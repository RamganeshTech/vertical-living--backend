import { Request, Response } from "express";
import StaffModel from "../../models/staff model/staff.model";

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { AuthenticatedStaffRequest } from "../../types/types";
import { ObjectId } from "mongoose";

// POST /api/staff/register
const registerStaff = async (req: Request, res: Response) => {
    try {

        const { invite, email, password, phoneNo, staffName } = req.body;

        // 1. Validate required fields
        if (!invite || !email || !password || !phoneNo || !staffName) {
            return res.status(400).json({ message: "All fields are required", ok: false });
        }

        // 2. Decode the invite token safely
        let organizationId: string, role: string, expiresAt: string, ownerId:string;

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
        const staffExists = await StaffModel.findOne({ email });
        if (staffExists) {
            return res.status(409).json({ message: "Staff with this email already exists", ok: false });
        }

        // 6. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);


        const staff = await StaffModel.create({
            email,
            password: hashedPassword, // Make sure to hash this in middleware
            phoneNo,
            staffName,
            role,
            organizationId: [organizationId],
            ownerId
        });

        let token = jwt.sign({ _id: staff._id, staffName: staff.staffName, organizationId: staff.organizationId, role:staff.role }, process.env.JWT_STAFF_ACCESS_SECRET as string, { expiresIn: "1d" })
        let refreshToken = jwt.sign({ _id: staff._id, staffName: staff.staffName, organizationId: staff.organizationId , role:staff.role}, process.env.JWT_STAFF_REFRESH_SECRET as string, { expiresIn: "7d" })

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

        res.status(201).json({ message: "Staff registered successfully", data:staff, ok: true });
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
        const staff = await StaffModel.findOne({ email });
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
        let token = jwt.sign({ _id: staff._id, staffName: staff.staffName, role:staff.role, organizationId: staff.organizationId }, process.env.JWT_STAFF_ACCESS_SECRET as string, { expiresIn: "1d" })
        let refreshToken = jwt.sign({ _id: staff._id, staffName: staff.staffName, role:staff.role, organizationId: staff.organizationId }, process.env.JWT_STAFF_REFRESH_SECRET as string, { expiresIn: "7d" })

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

        let staffaccesstoken = jwt.sign({ _id: staff._id, staffName: staff.staffName, role:staff.role, organizationId: staff.organizationId }, process.env.JWT_STAFF_ACCESS_SECRET as string, { expiresIn: "1d" })


        res.cookie("staffaccesstoken", staffaccesstoken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24, // 1d
        });

        res.status(200).json({
            message: "staff access token generated successfully",
            ok: true,
            error:false
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



const staffIsAuthenticated = async (req: AuthenticatedStaffRequest, res: Response) => {
    try {
        const staff = req.staff

        const isExist = await StaffModel.findById(staff._id)

        if (!isExist) {
            return res.status(404).json({ message: "staff not found", ok: false })
        }

        res.status(200).json({ data: {
                staffId: isExist._id,
                role: isExist.role,
                email: isExist.email,
                phoneNo: isExist.phoneNo,
                staffName: isExist.staffName,
                isauthenticated: true,
            }, 
            message: "staff is authenticated", ok: true })
    }
    catch (error) {
        if (error instanceof Error) {
            console.log("erorr from staffisAutneticated staff", error)
            res.status(500).json({ message: "internal error ocuured", errorMssage: error, ok: false })
        }
    }
}

export {
    registerStaff,
    loginStaff,
    staffLogout,
    refreshTokenStaff,
    staffIsAuthenticated
}