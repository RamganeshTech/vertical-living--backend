import { Request, Response } from "express";
import { WorkerModel } from "../../models/worker model/worker.model";
import jwt from "jsonwebtoken";
import { AuthenticatedWorkerRequest } from "../../types/types";
import { ObjectId, Schema, Types } from "mongoose";
import bcrypt from 'bcrypt';

// Helper: Token generator
const generateWorkerTokens = (workerId: string, role: string, workerName: string, projectId: string[]) => {
  const workeraccesstoken = jwt.sign({ _id: workerId, role, workerName, projectId }, process.env.JWT_WORKER_ACCESS_SECRET!, { expiresIn: "1d" });
  const workerrefreshtoken = jwt.sign({ _id: workerId, role, workerName, projectId }, process.env.JWT_WORKER_REFRESH_SECRET!, { expiresIn: "7d" });
  return { workeraccesstoken, workerrefreshtoken };
};

const registerWorker = async (req: Request, res: Response): Promise<void> => {
  try {
    const { invite } = req.query;
    const { workerName, phoneNo, email, password } = req.body;

    if (!invite || typeof invite !== "string") {
      res.status(400).json({ message: "Missing or invalid invite token." });
      return;
    }

    if (!workerName || !phoneNo || !email || !password) {
      res.status(400).json({ message: "All fields (name, phoneNo, email, password) are required." });
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      res.status(400).json({ message: "Invalid email format." });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters." });
      return;
    }

    const decoded = JSON.parse(Buffer.from(invite, "base64").toString("utf-8"));
    const { projectId, role, specificRole, expiresAt, invitedBy, invitedByModel, organizationId } = decoded;

    if (!projectId || !role || !specificRole || !expiresAt) {
      res.status(400).json({ message: "Invite token is missing required fields." , ok:false});
      return;
    }
console.log(role, specificRole)
    if (new Date() > new Date(expiresAt)) {
      res.status(400).json({ message: "Invitation link has expired.", ok:false });
      return;
    }

    const exists = await WorkerModel.findOne({
      projectId,
      $or: [
        { email },
        { phoneNo },
      ]
    });

    if (exists) {
      res.status(409).json({ message: "Worker already registered for this project." , ok:false });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newWorker = await WorkerModel.create({
      workerName,
      phoneNo,
      email,
      password:hashedPassword, // hash in real app
      role,
      specificRole,
      projectId: [projectId],
      organizationId: [organizationId],
      invitedBy,
      invitedByModel,
      isRegistered: true,
    });

    const projectIdStrings = newWorker.projectId.map(id => id.toString());


    const { workeraccesstoken, workerrefreshtoken } = generateWorkerTokens((newWorker as any)._id.toString(), newWorker.role, newWorker.workerName, projectIdStrings);

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
      data: newWorker,
      ok: true
    });

  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error", error: (error as Error).message , ok:false});
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

    if (!worker || !worker.isRegistered) {
      res.status(404).json({ message: "Worker not found or not registered.", ok: false });
      return;
    }

    // const isPasswordCorrect = await bcrypt.compare(password, worker.password);
    // if (!isPasswordCorrect) {
    //   res.status(400).json({ message: "Invalid email or password", ok: false });
    //   return
    // }


    console.log("worker", worker.password)
    console.log("incomming pass", password)
    if (worker.password !== password) {
      res.status(400).json({ message: "Incorrect password.", ok: false });
      return;
    }

    const projectIdStrings = worker.projectId.map(id => id.toString());


    const { workeraccesstoken, workerrefreshtoken } = generateWorkerTokens((worker as any)._id.toString(), worker.role, worker.workerName, projectIdStrings);

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
      data: worker,
      ok: true
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: (error as Error).message , ok:false});
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

const workerIsAuthenticated = async (req: AuthenticatedWorkerRequest, res: Response) => {
  try {
    const worker = req.worker

    const isExist = await WorkerModel.findById(worker._id)

    if (!isExist) {
      return res.status(404).json({ message: "worker not found", ok: false })
    }

    res.status(200).json({
      data: {
        workerId: isExist._id,
        role: isExist.role,
        email: isExist.email,
        phoneNo: isExist.phoneNo,
        workerName: isExist.workerName,
        isauthenticated: true,
      },
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


export {
  loginWorker, registerWorker, workerLogout, refreshTokenWorker, workerIsAuthenticated
}