import { Request, Response } from "express";
import StaffModel from "../../models/staff model/staff.model";
import { Types } from "mongoose"
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { RoleBasedRequest } from "../../types/types";
import redisClient from "../../config/redisClient";
import crypto from 'crypto';
import sendResetEmail from "../../utils/Common Mail Services/forgotPasswordMail";
import { syncEmployee } from "../Department controllers/HRMain controller/HrMain.controllers";
import { EmployeeModel } from "../../models/Department Models/HR Model/HRMain.model";

// POST /api/staff/register
const registerStaff = async (req: Request, res: Response) => {
    try {

        const { invite, email, password, phoneNo, staffName, } = req.body;

        // 1. Validate required fields
        if (!invite || !email || !password || !phoneNo || !staffName) {
            return res.status(400).json({ message: "All fields are required", ok: false });
        }

        // 2. Decode the invite token safely
        let organizationId: string, role: string, expiresAt: string, ownerId: string, specificRole: string[];

        try {
            const decoded = Buffer.from(invite, "base64").toString("utf-8");
            ({ organizationId, role, expiresAt, ownerId } = JSON.parse(decoded));
        } catch (error) {
            return res.status(400).json({ message: "Invalid invitation link", ok: false });
        }



        // 3. Validate expiry
        if (!expiresAt || new Date(expiresAt) < new Date()) {
            return res.status(400).json({ message: "Invitation link has expired", ok: false });
        }

        // 4. Validate payload content
        if (!organizationId || !role) {
            return res.status(400).json({ message: "Invalid invitation data", ok: false });
        }

        // 5. Check for duplicate staff
        // const staffExists = await StaffModel.findOne({ email: email });
        const staffExists = await StaffModel.findOne({
            $or: [{ email: email }, { phoneNo: phoneNo }]
        });

        if (staffExists) {
            // Logic to give a specific error message
            if (staffExists.email === email) {
                return res.status(400).json({ message: "A staff member with this Email already exists." });
            }
            if (staffExists.phoneNo === phoneNo) {
                return res.status(400).json({ message: "A staff member with this Phone Number already exists." });
            }
        }

        // if (staffExists) {
        //     return res.status(409).json({ message: "Staff with this email already exists", ok: false });
        // }

        // 6. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);


        const staff = await StaffModel.create({
            email,
            password: hashedPassword, // Make sure to hash this in middleware
            phoneNo,
            staffName,
            permission: {},
            role,
            organizationId: [organizationId],
            ownerId,
            isGuideRequired: true,
        });

        let token = jwt.sign({ _id: staff._id, staffName: staff.staffName, ownerId: staff.ownerId, organizationId: staff.organizationId, role: staff.role, permission: staff.permission ,isGuideRequired:staff.isGuideRequired}, process.env.JWT_STAFF_ACCESS_SECRET as string, { expiresIn: "1d" })
        let refreshToken = jwt.sign({ _id: staff._id, staffName: staff.staffName, ownerId: staff.ownerId, organizationId: staff.organizationId, role: staff.role, permission: staff.permission ,isGuideRequired:staff.isGuideRequired }, process.env.JWT_STAFF_REFRESH_SECRET as string, { expiresIn: "7d" })

        res.cookie("staffaccesstoken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24
        }
        )

        res.cookie("staffrefreshtoken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24 * 7
        }
        )



        await redisClient.del(`getusers:${role}:${organizationId}`)

        res.status(201).json({
            message: "Staff registered successfully", data: {

                staffId: staff._id,
                staffName: staff.staffName,
                email: staff.email,
                phoneNo: staff.phoneNo,
                organizationId: staff.organizationId,
                role: staff.role,
                permission: staff?.permission || {},
                isGuideRequired:staff.isGuideRequired

            }, ok: true
        });



        syncEmployee({
            organizationId,
            empId: staff._id,
            employeeModel: "StaffModel",
            empRole: "organization_staff",
            name: staff.staffName,
            phoneNo: staff.phoneNo,
            role: "staff",
            email: staff.email,

        })
            .catch(err => console.log("syncEmployee error in Hr Dept from Staff model", err))


    } catch (error) {
        if (error instanceof Error) {
            console.error("Staff registration failed:", error);
            res.status(500).json({ message: "Server error", ok: false, error: error.message });
            return
        }
    }
};






const loginStaff = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Check if email and password are provided
        if (!email || !password) {
            res.status(400).json({ message: "Email and password are required", ok: false });
            return
        }


        // Find staff by email
        // const staff = await StaffModel.findOne({ email, organizationId });
        const staff = await StaffModel.findOne({
            email,
        });

        if (!staff) {
            res.status(404).json({ message: "Invalid email or password", ok: false });
            return
        }

        // Compare passwords
        const isPasswordCorrect = await bcrypt.compare(password, staff.password);
        if (!isPasswordCorrect) {
            res.status(400).json({ message: "Invalid email or password", ok: false });
            return
        }

        // Generate JWT Token
                isGuideRequired:staff.isGuideRequired
        let token = jwt.sign({ _id: staff._id, staffName: staff.staffName, role: staff.role, ownerId: staff.ownerId, organizationId: staff.organizationId ,isGuideRequired:staff.isGuideRequired }, process.env.JWT_STAFF_ACCESS_SECRET as string, { expiresIn: "1d" })
        let refreshToken = jwt.sign({ _id: staff._id, staffName: staff.staffName, role: staff.role, ownerId: staff.ownerId, organizationId: staff.organizationId ,isGuideRequired:staff.isGuideRequired }, process.env.JWT_STAFF_REFRESH_SECRET as string, { expiresIn: "7d" })

        res.cookie("staffaccesstoken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24
        }
        )

        res.cookie("staffrefreshtoken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24 * 7
        }
        )


        return res.status(200).json({
            message: "Login successful",
            token,
            data: {
                staffId: staff._id,
                staffName: staff.staffName,
                email: staff.email,
                phoneNo: staff.phoneNo,
                organizationId: staff.organizationId,
                role: staff.role,
                permission: staff?.permission || {},
                isGuideRequired:staff.isGuideRequired

            },
            ok: true
        });
    } catch (error) {
        if (error instanceof Error) {
            console.error("Login error:", error);
            res.status(500).json({ message: "Internal server error", ok: false });
            return
        }
    }
};


const staffLogout = async (req: Request, res: Response) => {
    try {
        res.clearCookie("staffaccesstoken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Only secure in production
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/", // Clear the cookie for the entire domain
        });

        res.clearCookie("staffrefreshtoken", {
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

const refreshTokenStaff = async (req: Request, res: Response): Promise<void> => {
    try {
        const refreshtoken = req.cookies.staffrefreshtoken;

        if (!refreshtoken) {
            res.status(404).json({
                message: "No refresh token provided. Please login again.",
                ok: false,
            });
            return;
        }

        const decoded = jwt.verify(
            refreshtoken,
            process.env.JWT_STAFF_REFRESH_SECRET as string
        ) as { id: string };

        const staff = await StaffModel.findById(decoded.id);

        if (!staff) {
            res.status(404).json({ message: "staff not found", ok: false });
            return;
        }

        let staffaccesstoken = jwt.sign({ _id: staff._id, staffName: staff.staffName, role: staff.role, organizationId: staff.organizationId, isGuideRequired:staff.isGuideRequired }, process.env.JWT_STAFF_ACCESS_SECRET as string, { expiresIn: "1d" })


        res.cookie("staffaccesstoken", staffaccesstoken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24, // 1d
        });

        res.status(200).json({
            message: "staff access token generated successfully",
            ok: true,
            error: false
        });

    } catch (error) {
        console.error("Error from refreshStaffToken:", error);
        res.status(500).json({
            message: "Internal error occurred while refreshing token",
            errorMessage: (error as Error).message,
            ok: false,
        });
    }
};



const staffIsAuthenticated = async (req: RoleBasedRequest, res: Response) => {
    try {
        const user = req?.user

        if (!user?._id) {
            return res.status(404).json({ message: "User id not found", ok: false })
        }


        const redisUserKey = `userAuth:${user?._id}`

        // await redisClient.del(redisUserKey)
        const cachedData = await redisClient.get(redisUserKey)

        if (cachedData) {
            return res.status(200).json({
                data: JSON.parse(cachedData),
                message: "client is authenticated form cache", ok: true
            })
        }

        const isExist = await StaffModel.findById(user?._id)

        if (!isExist) {
            return res.status(404).json({ message: "staff not found", ok: false })
        }

        const data = {
            staffId: isExist._id,
            role: isExist.role,
            email: isExist.email,
            phoneNo: isExist.phoneNo,
            staffName: isExist.staffName,
            isauthenticated: true,
            permission: isExist?.permission || {},
            isGuideRequired:isExist.isGuideRequired
        }

        await redisClient.set(redisUserKey, JSON.stringify(data), { EX: 60 * 10 })

        res.status(200).json({
            data,
            message: "staff is authenticated", ok: true
        })
    }
    catch (error) {
        if (error instanceof Error) {
            console.log("erorr from staffisAutneticated staff", error)
            res.status(500).json({ message: "internal error ocuured", errorMssage: error, ok: false })
        }
    }
}






const staffforgotPassword = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email } = req.body;

        // Check if the email exists in the database
        const staff = await StaffModel.findOne({ email });

        if (!staff) {
            return res.status(404).json({ message: 'staff not found', error: true, ok: false });
        }

        // Generate a token for password reset (using crypto or JWT)
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Hash the token and store it in the database for later validation
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Store the hashed token and set an expiration time (1 hour)
        staff.resetPasswordToken = hashedToken;
        staff.resetPasswordExpire = (Date.now() + 3600000); // 1 hour in milliseconds

        await staff.save();

        // Generate the password reset URL (ensure to use your real app's URL)
        let resetLink: string;

        if (process.env.NODE_ENV === "production") {
            resetLink = `${process.env.FRONTEND_URL}/reset-password/staff?token=${resetToken}`;
        }
        else {
            resetLink = `${process.env.FRONTEND_URL}/reset-password/staff?token=${resetToken}`;
        }

        // Send the password reset email
        await sendResetEmail(staff.email, staff.staffName, resetLink);

        return res.status(200).json({
            message: 'Password reset email sent. Please check your registered email inbox.',
            ok: true
        });
    } catch (error) {
        console.error('Error handling forgot password request: ', error);
        return res.status(500).json({ message: 'Server error. Please try again later.', error: true, ok: false });
    }
};

const staffResetForgotPassword = async (req: Request, res: Response): Promise<any> => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ message: "Invalid request. Token and password are required.", error: true, ok: false });
        }


        // Hash the received token to match the stored one
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        // Find the user with the provided reset token (and check if it’s not expired)
        const staff = await StaffModel.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }, // Ensure token is not expired
        });

        if (!staff) {
            return res.status(400).json({ message: "Invalid or expired token.", error: true, ok: false });
        }


        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        staff.password = await bcrypt.hash(password, salt);

        // Clear the reset token fields
        staff.resetPasswordToken = undefined;
        staff.resetPasswordExpire = undefined;

        // Save the updated staff data
        await staff.save();

        return res.status(200).json({ message: "Password reset successful. You can now log in.", error: false, ok: true });
    } catch (error) {
        console.error("Error resetting password:", error);
        return res.status(500).json({ message: "Server error. Please try again later.", error: true, ok: false });
    }
}

export {
    registerStaff,
    loginStaff,
    staffLogout,
    refreshTokenStaff,
    staffIsAuthenticated,


    staffResetForgotPassword,
    staffforgotPassword
}