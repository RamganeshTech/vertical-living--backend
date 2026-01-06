import { Request, Response } from "express";
import { WorkerModel } from "../../models/worker model/worker.model";
import jwt from "jsonwebtoken";
import { AuthenticatedWorkerRequest, RoleBasedRequest } from "../../types/types";
import { ObjectId, Schema, Types } from "mongoose";
import bcrypt from 'bcrypt';
import redisClient from "../../config/redisClient";
import crypto from 'crypto';
import sendResetEmail from "../../utils/Common Mail Services/forgotPasswordMail";
import { syncEmployee } from "../Department controllers/HRMain controller/HrMain.controllers";

// Helper: Token generator
const generateWorkerTokens = (workerId: string, ownerId: string, role: string, workerName: string, projectId: string[], isGuideRequired:boolean) => {
  const workeraccesstoken = jwt.sign({ _id: workerId, role, workerName, projectId, ownerId, isGuideRequired }, process.env.JWT_WORKER_ACCESS_SECRET!, { expiresIn: "1d" });
  const workerrefreshtoken = jwt.sign({ _id: workerId, role, workerName, projectId, ownerId, isGuideRequired }, process.env.JWT_WORKER_REFRESH_SECRET!, { expiresIn: "7d" });
  return { workeraccesstoken, workerrefreshtoken };
};

const registerWorker = async (req: Request, res: Response): Promise<void> => {
  try {
    const { invite } = req.query;
    const { workerName, phoneNo, email, password } = req.body;

    if (!invite || typeof invite !== "string") {
      res.status(400).json({ ok: false, message: "Missing or invalid invite token." });
      return;
    }

    if (!workerName || !phoneNo || !email || !password) {
      res.status(400).json({ ok: false, message: "All fields (name, phoneNo, email, password) are required." });
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      res.status(400).json({ ok: false, message: "Invalid email format." });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters.", ok: false });
      return;
    }

    const decoded = JSON.parse(Buffer.from(invite, "base64").toString("utf-8"));
    const { projectId, role, expiresAt, invitedBy, invitedByModel, organizationId, ownerId, specificRole = [] } = decoded;

    if (!projectId || !role || !expiresAt) {
      res.status(400).json({ message: "Invite token is missing required fields.", ok: false });
      return;
    }

    if (new Date() > new Date(expiresAt)) {
      res.status(400).json({ message: "Invitation link has expired.", ok: false });
      return;
    }

    const exists = await WorkerModel.findOne({
      $or: [
        { email },
        { phoneNo },
      ]
    });


    if (exists) {
      res.status(409).json({ message: "Worker already registered with the email or phone number", ok: false });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newWorker = await WorkerModel.create({
      workerName,
      phoneNo,
      email,
      password: hashedPassword, // hash in real app
      role,
      projectId: [projectId],
      organizationId: [organizationId],
      ownerId: ownerId || null,
      invitedBy,
      invitedByModel,
      specificRole,
      isRegistered: true,
      permission: {},
      isGuideRequired: true
    });

    const projectIdStrings = newWorker.projectId.map(id => id.toString());


    const { workeraccesstoken, workerrefreshtoken } = generateWorkerTokens((newWorker as any)._id.toString(),
      (newWorker as any).ownerId, newWorker.role,
      newWorker.workerName, projectIdStrings, newWorker.isGuideRequired);

    res.cookie("workeraccesstoken", workeraccesstoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24
    }
    )

    res.cookie("workerrefreshtoken", workerrefreshtoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
    )

    res.status(201).json({
      message: "Worker registered successfully",
      workeraccesstoken,
      workerrefreshtoken,
      data: {
        workerId: newWorker._id,
        role: newWorker.role,
        email: newWorker.email,
        phoneNo: newWorker.phoneNo,
        workerName: newWorker.workerName,
        isauthenticated: true,
        permission: newWorker?.permission || {},
        isGuideRequired: newWorker.isGuideRequired
      },
      ok: true
    });


    await redisClient.del(`getusers:${role}:${organizationId}`)


    syncEmployee({
      organizationId,
      empId: newWorker._id as Types.ObjectId,
      employeeModel: "WorkerModel",
      empRole: "nonorganization_staff",
      name: newWorker.workerName,
      phoneNo: newWorker.phoneNo!,
      email: newWorker.email,
      role: "worker"
    })
      .catch((err) => console.log("syncEmployee error in Hr Dept from Worker model", err))


  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error", error: (error as Error).message, ok: false });
  }
};






const loginWorker = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required.", ok: false });
      return;
    }

    const worker = await WorkerModel.findOne({ email });

    if (!worker) {
      res.status(404).json({ message: "Worker not found or not registered.", ok: false });
      return;
    }

    const isPasswordCorrect = await bcrypt.compare(password, worker.password);
    if (!isPasswordCorrect) {
      res.status(400).json({ message: "Invalid email or password", ok: false });
      return
    }

    // if (worker.password !== password) {
    //   res.status(400).json({ message: "Incorrect password.", ok: false });
    //   return;
    // }

    const projectIdStrings = worker.projectId.map(id => id.toString());



    const { workeraccesstoken, workerrefreshtoken } = generateWorkerTokens((worker as any)._id.toString(), (worker as any).ownerId,
      worker.role, worker.workerName, projectIdStrings, worker.isGuideRequired);

    res.cookie("workeraccesstoken", workeraccesstoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24
    }
    )

    res.cookie("workerrefreshtoken", workerrefreshtoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
    )

    res.status(200).json({
      message: "Login successful",
      workeraccesstoken,
      workerrefreshtoken,
      data: {
        workerId: worker._id,
        role: worker.role,
        email: worker.email,
        phoneNo: worker.phoneNo,
        workerName: worker.workerName,
        isauthenticated: true,
        permission: worker?.permission || {},
        isGuideRequired: worker.isGuideRequired

      },
      ok: true
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: (error as Error).message, ok: false });
  }
};



const workerLogout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("workeraccesstoken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only secure in production
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/", // Clear the cookie for the entire domain
    });

    res.clearCookie("workerrefreshtoken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only secure in production
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/", // Clear the cookie for the entire domain
    });


    res.status(200).json({ message: "Logout successful", ok: true, error: false });
    return;
  }
  catch (error) {
    console.log(error)
    res.status(500).json({ message: "internal server error", errormessage: error, ok: false, error: true });

  }
}

const refreshTokenWorker = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshtoken = req.cookies.workerrefreshtoken;

    if (!refreshtoken) {
      res.status(404).json({
        message: "No refresh token provided. Please login again.",
        ok: false,
      });
      return;
    }

    const decoded = jwt.verify(
      refreshtoken,
      process.env.WORKER_REFRESH_SECRET as string
    ) as { id: string };

    const worker = await WorkerModel.findById(decoded.id);

    if (!worker) {
      res.status(404).json({ message: "Worker not found", ok: false });
      return;
    }

    const projectIdStrings = worker.projectId.map(id => id.toString());

    const workeraccesstoken = jwt.sign(
      { id: (worker as any)._id.toString(), email: worker.email, projectId: projectIdStrings },
      process.env.WORKER_ACCESS_SECRET as string,
      { expiresIn: "15m" }
    );

    res.cookie("workeraccesstoken", workeraccesstoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1d
    });

    res.status(200).json({
      message: "Worker access token generated successfully",
      ok: true,
    });

  } catch (error) {
    console.error("Error from refreshWorkerToken:", error);
    res.status(500).json({
      message: "Internal error occurred while refreshing token",
      errorMessage: (error as Error).message,
      ok: false,
    });
  }
};

const workerIsAuthenticated = async (req: RoleBasedRequest, res: Response) => {
  try {
    const user = req?.user

    if (!user?._id) {
      return res.status(404).json({ message: "User id not found", ok: false })
    }


    const redisUserKey = `userAuth:${user?._id}`

    const cachedData = await redisClient.get(redisUserKey)

    if (cachedData) {
      return res.status(200).json({
        data: JSON.parse(cachedData),
        message: "client is authenticated form cache", ok: true
      })
    }

    const isExist = await WorkerModel.findById(user?._id)

    if (!isExist) {
      return res.status(404).json({ message: "worker not found", ok: false })
    }


    // console.log("isExit", isExist)

    const data = {
      workerId: isExist._id,
      role: isExist.role,
      email: isExist.email,
      phoneNo: isExist.phoneNo,
      workerName: isExist.workerName,
      isauthenticated: true,
      permission: isExist?.permission || {},
      isGuideRequired: isExist.isGuideRequired

    }

    await redisClient.set(redisUserKey, JSON.stringify(data), { EX: 60 * 10 })

    res.status(200).json({
      data,
      message: "worker is authenticated", ok: true
    })
  }
  catch (error) {
    if (error instanceof Error) {
      console.log("erorr from workerisAutneticated worker", error)
      res.status(500).json({ message: "internal error ocuured", errorMssage: error, ok: false })
    }
  }
}



const workerforgotPassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.body;

    // Check if the email exists in the database
    const worker = await WorkerModel.findOne({ email });

    if (!worker) {
      return res.status(404).json({ message: 'worker not found', error: true, ok: false });
    }

    // Generate a token for password reset (using crypto or JWT)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash the token and store it in the database for later validation
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Store the hashed token and set an expiration time (1 hour)
    worker.resetPasswordToken = hashedToken;
    worker.resetPasswordExpire = (Date.now() + 3600000); // 1 hour in milliseconds

    await worker.save();

    // Generate the password reset URL (ensure to use your real app's URL)
    let resetLink: string;

    if (process.env.NODE_ENV === "production") {
      resetLink = `${process.env.FRONTEND_URL}/reset-password/worker?token=${resetToken}`;
    }
    else {
      resetLink = `${process.env.FRONTEND_URL}/reset-password/worker?token=${resetToken}`;
    }

    // Send the password reset email
    await sendResetEmail(worker.email, worker.workerName, resetLink);

    return res.status(200).json({
      message: 'Password reset email sent. Please check your registered email inbox.',
      ok: true
    });
  } catch (error) {
    console.error('Error handling forgot password request: ', error);
    return res.status(500).json({ message: 'Server error. Please try again later.', error: true, ok: false });
  }
};

const workerResetForgotPassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Invalid request. Token and password are required.", error: true, ok: false });
    }


    // Hash the received token to match the stored one
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find the user with the provided reset token (and check if it’s not expired)
    const worker = await WorkerModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }, // Ensure token is not expired
    });

    if (!worker) {
      return res.status(400).json({ message: "Invalid or expired token.", error: true, ok: false });
    }


    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    worker.password = await bcrypt.hash(password, salt);

    // Clear the reset token fields
    worker.resetPasswordToken = undefined;
    worker.resetPasswordExpire = undefined;

    // Save the updated worker data
    await worker.save();

    return res.status(200).json({ message: "Password reset successful. You can now log in.", error: false, ok: true });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ message: "Server error. Please try again later.", error: true, ok: false });
  }
}


export {
  loginWorker, registerWorker, workerLogout, refreshTokenWorker, workerIsAuthenticated,
  workerforgotPassword, workerResetForgotPassword
}