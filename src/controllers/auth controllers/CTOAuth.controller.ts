import { Request, Response } from "express";

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { AuthenticatedCTORequest } from "../../types/types";
import CTOModel from "../../models/CTO model/CTO.model";

// POST /api/CTO/register
const registerCTO = async (req: Request, res: Response) => {
    try {

        const { invite, email, password, phoneNo, CTOName } = req.body;

        // 1. Validate required fields
        if (!invite || !email || !password || !phoneNo || !CTOName) {
            return res.status(400).json({ message: "All fields are required", ok: false });
        }

        // 2. Decode the invite token safely
        let organizationId: string, role: string, expiresAt: string, ownerId: string;

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

        // 5. Check for duplicate cTO
        const CTOExists = await CTOModel.findOne({
            ownerId, 
            $or: [
                { email },
                { CTOName },
                { phoneNo }
            ]
        });

        if (CTOExists) {
            return res.status(409).json({
                message: "CTO with this email, name, or phone number already exists",
                ok: false
            });
        }

        // 6. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);


        const CTO = await CTOModel.create({
            email,
            password: hashedPassword, // Make sure to hash this in middleware
            phoneNo,
            CTOName,
            role,
            organizationId: [organizationId],
            ownerId
        });

        let token = jwt.sign({ _id: CTO._id, CTOName: CTO.CTOName, organizationId: CTO.organizationId, ownerId: CTO.ownerId, role: CTO.role }, process.env.JWT_CTO_ACCESS_SECRET as string, { expiresIn: "1d" })
        let refreshToken = jwt.sign({ _id: CTO._id, CTOName: CTO.CTOName, organizationId: CTO.organizationId, ownerId: CTO.ownerId, role: CTO.role }, process.env.JWT_CTO_REFRESH_SECRET as string, { expiresIn: "7d" })

        res.cookie("ctoaccesstoken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24
        }
        )

        res.cookie("ctorefreshtoken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24 * 7
        }
        )

        res.status(201).json({ message: "CTO registered successfully", data: CTO, ok: true });
    } catch (error) {
        if (error instanceof Error) {
            console.error("CTO registration failed:", error);
            res.status(500).json({ message: "Server error", ok: false, error: error.message });
            return
        }
    }
};



const loginCTO = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Check if email and password are provided
        if (!email || !password) {
            res.status(400).json({ message: "Email and password are required", ok: false });
            return
        }

        // Find CTO by email
        const CTO = await CTOModel.findOne({ email });
        if (!CTO) {
            res.status(404).json({ message: "Invalid email or password", ok: false });
            return
        }

        // Compare passwords
        const isPasswordCorrect = await bcrypt.compare(password, CTO.password);
        if (!isPasswordCorrect) {
            res.status(400).json({ message: "Invalid email or password", ok: false });
            return
        }

        // Generate JWT Token
        let token = jwt.sign({ _id: CTO._id, CTOName: CTO.CTOName, role: CTO.role, ownerId: CTO.ownerId, organizationId: CTO.organizationId }, process.env.JWT_CTO_ACCESS_SECRET as string, { expiresIn: "1d" })
        let refreshToken = jwt.sign({ _id: CTO._id, CTOName: CTO.CTOName, role: CTO.role, ownerId: CTO.ownerId, organizationId: CTO.organizationId }, process.env.JWT_CTO_REFRESH_SECRET as string, { expiresIn: "7d" })

        res.cookie("ctoaccesstoken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24
        }
        )

        res.cookie("ctorefreshtoken", refreshToken, {
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
                CTOName: CTO.CTOName,
                email: CTO.email,
                phoneNo: CTO.phoneNo,
                organizationId: CTO.organizationId,
                role: CTO.role,
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


const CTOLogout = async (req: Request, res: Response) => {
    try {
        res.clearCookie("ctoaccesstoken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Only secure in production
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/", // Clear the cookie for the entire domain
        });

        res.clearCookie("ctorefreshtoken", {
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

const refreshTokenCTO = async (req: Request, res: Response): Promise<void> => {
    try {
        const refreshtoken = req.cookies.ctorefreshtoken;

        if (!refreshtoken) {
            res.status(404).json({
                message: "No refresh token provided. Please login again.",
                ok: false,
            });
            return;
        }

        const decoded = jwt.verify(
            refreshtoken,
            process.env.JWT_CTO_REFRESH_SECRET as string
        ) as { id: string };

        const CTO = await CTOModel.findById(decoded.id);

        if (!CTO) {
            res.status(404).json({ message: "CTO not found", ok: false });
            return;
        }

        let CTOaccesstoken = jwt.sign({ _id: CTO._id, CTOName: CTO.CTOName, role: CTO.role, ownerId: CTO.ownerId, organizationId: CTO.organizationId }, process.env.JWT_CTO_ACCESS_SECRET as string, { expiresIn: "1d" })


        res.cookie("ctoaccesstoken", CTOaccesstoken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24, // 1d
        });

        res.status(200).json({
            message: "CTO access token generated successfully",
            ok: true,
            error: false
        });

    } catch (error) {
        console.error("Error from refreshCTOToken:", error);
        res.status(500).json({
            message: "Internal error occurred while refreshing token",
            errorMessage: (error as Error).message,
            ok: false,
        });
    }
};



const CTOIsAuthenticated = async (req: AuthenticatedCTORequest, res: Response) => {
    try {
        const CTO = req.CTO

        const isExist = await CTOModel.findById(CTO._id)

        if (!isExist) {
            return res.status(404).json({ message: "CTO not found", ok: false })
        }

        res.status(200).json({
            data: {
                CTOId: isExist._id,
                role: isExist.role,
                email: isExist.email,
                phoneNo: isExist.phoneNo,
                CTOName: isExist.CTOName,
                isauthenticated: true,
            },
            message: "CTO is authenticated", ok: true
        })
    }
    catch (error) {
        if (error instanceof Error) {
            console.log("erorr from CTOisAutneticated CTO", error)
            res.status(500).json({ message: "internal error ocuured", errorMssage: error, ok: false })
        }
    }
}

export {
    registerCTO,
    loginCTO,
    CTOLogout,
    refreshTokenCTO,
    CTOIsAuthenticated
}