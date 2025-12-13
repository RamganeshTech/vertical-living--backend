import { Request, RequestHandler, Response } from "express"
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto'

import UserModel from "../../models/usermodel/user.model";
import { AuthenticatedUserRequest, RoleBasedRequest } from "../../types/types";
import sendResetEmail from "../../utils/Common Mail Services/forgotPasswordMail";
import redisClient from "../../config/redisClient";

const userlogin = async (req: Request, res: Response) => {
    try {
        let { email, password } = req.body

        // let isTokenExists = req.cookies.useraccesstoken

        // if (isTokenExists) {
        //     return res.status(403).json({ error: true, message: "Already logged in", ok: false });
        // }

        if (!email || !password) {
            res.status(404).json({ message: "please provide the input properly", error: true, ok: false })
        }

        const user = await UserModel.findOne({ email: email })

        if (!user) {
            return res.status(404).json({ message: "invalid credentials", error: true, ok: false })
        }
        // console.log("matching", user)

        const isMatching = await bcrypt.compare(password, user?.password)

        if (!isMatching) {
            return res.status(404).json({ message: "invalid credentials", error: true, ok: false })
        }

        // console.log("matching", isMatching)
        let token = jwt.sign({ _id: user._id, username: user.username, organization: user.organizationId, role: user.role, isGuideRequired:user.isGuideRequired }, process.env.JWT_ACCESS_SECRET as string, { expiresIn: "1d" })
        let refreshToken = jwt.sign({ _id: user._id, username: user.username, organization: user.organizationId, role: user.role , isGuideRequired:user.isGuideRequired}, process.env.JWT_REFRESH_SECRET as string, { expiresIn: "7d" })

        res.cookie("useraccesstoken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24
        }
        )


        res.cookie("userrefreshtoken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24 * 7
        }
        )

        res.status(200).json({
            message: `${user.username} loggeg in successfully`,
            data: {
                userId: user._id, role: "owner", userName: user.username, email: user.email, phoneNo: user.phoneNo,

                permission: user?.permission || {},
                isGuideRequired:user.isGuideRequired

            },
            ok: true,
            error: false
        })
    }
    catch (error) {
        console.log("error from userlogin", error)
        const err = error as Error;
        console.error(err.message);
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
            ok: false,
        });
    }
}


const userLogout = async (req: Request, res: Response) => {
    try {
        res.clearCookie("useraccesstoken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Only secure in production
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/", // Clear the cookie for the entire domain
        });

        res.clearCookie("userrefreshtoken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Only secure in production
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/", // Clear the cookie for the entire domain
        });


        res.status(200).json({ message: "Logout successfull", ok: true, error: false });
        return;
    }
    catch (error) {
        console.log(error)
        res.status(500).json({ message: "internal server error", errormessage: error, ok: false, error: true });

    }
}

const registerUser = async (req: Request, res: Response) => {
    try {
        let { email, password, username, phoneNo } = req.body

        if (!email || !password || !username) {
            res.status(400).json({ message: "email, password and username is reequired", ok: false })
            return;
        }

        const isExist = await UserModel.findOne({ email })

        if (isExist) {
            return res.status(400).json({ message: "user aleady there with this email and username", error: true, ok: false })
        }

        const hashPassword = await bcrypt.hash(password, 10)

        phoneNo = String(phoneNo)

        if (phoneNo && phoneNo.length !== 10) {
            res.status(400).json({ message: "phone number shoud be 10 digits is required", ok: false })
            return
        }

        const user = await UserModel.create({
            email,
            password: hashPassword,
            username,
            phoneNo: phoneNo ?? null,
            role: "owner",
            permission:{},
            isGuideRequired: true,
        })

        let token = jwt.sign({ _id: user._id, username: user.username, role: user.role, organization: user.organizationId, isGuideRequired:user.isGuideRequired }, process.env.JWT_ACCESS_SECRET as string, { expiresIn: "1d" })
        let refreshToken = jwt.sign({ _id: user._id, username: user.username, role: user.role, organization: user.organizationId , isGuideRequired:user.isGuideRequired}, process.env.JWT_REFRESH_SECRET as string, { expiresIn: "7d" })

        res.cookie("useraccesstoken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24
        }
        )

        res.cookie("userrefreshtoken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24 * 7
        }
        )


        res.status(200).json({
            message: `${user.username} account created successfull`,
            ok: true,
            error: false,
               
            data: { userId: user._id, role: "owner", userName: user.username, email: user.email, phoneNo: user.phoneNo , isGuideRequired:user.isGuideRequired,   permission: user?.permission || {} },
        })

    }
    catch (error) {
        if (error instanceof Error) {
            console.log("erorr from register user", error)
            res.status(500).json({ message: "internal error ocuured", errorMssage: error, ok: false })
        }
    }
}

const refreshToken = async (req: Request, res: Response) => {
    try {
        let refreshtoken = req.cookies.userrefreshtoken

        if (!refreshtoken) {
            return res.status(404).json({ message: "no refresh token provided please login", ok: false })
        }

        let isDataExists = jwt.verify(refreshtoken, process.env.JWT_REFRESH_SECRET as string) as { _id: string };

        let isExists = await UserModel.findById(isDataExists._id)

        if (!isExists) {
            return res.status(404).json({ message: "user not found", ok: false })
        }

        let useraccesstoken = jwt.sign({ _id: isExists._id, username: isExists.username, role: isExists.role, organization: isExists.organizationId }, process.env.JWT_ACCESS_SECRET as string, { expiresIn: "1d" })

        res.cookie("useraccesstoken", useraccesstoken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24
        })

        res.status(200).json({ message: "access token generated", ok: true, error: false })

    }
    catch (error) {
        if (error instanceof Error) {
            console.log("erorr from refreshtoken user", error)
            res.status(500).json({ message: "internal error ocuured", errorMssage: error, ok: false })
        }
    }
}

const isAuthenticated = async (req: RoleBasedRequest, res: Response) => {
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


        const isExist = await UserModel.findById(user?._id)

        if (!isExist) {
            return res.status(404).json({ message: "user not found", ok: false })
        }

        const data = {
            userId: isExist._id,
            role: isExist.role,
            email: isExist.email,
            phoneNo: isExist.phoneNo,
            userName: isExist.username,
            isauthenticated: true,
            permission: isExist?.permission || {},
            isGuideRequired:isExist?.isGuideRequired
        }

        await redisClient.set(redisUserKey, JSON.stringify(data), { EX: 60 * 10 })

        res.status(200).json({
            message: "user is authenticated", ok: true,
            data
        })
    }
    catch (error) {
        if (error instanceof Error) {
            console.log("erorr from isAutneticated user", error)
            res.status(500).json({ message: "internal error ocuured", errorMssage: error, ok: false })
        }
    }
}

const forgotPassword = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email } = req.body;

        // Check if the email exists in the database
        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found', error: true, ok: false });
        }

        // Generate a token for password reset (using crypto or JWT)
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Hash the token and store it in the database for later validation
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Store the hashed token and set an expiration time (1 hour)
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpire = (Date.now() + 3600000); // 1 hour in milliseconds

        await user.save();

        // Generate the password reset URL (ensure to use your real app's URL)
        let resetLink: string;

        if (process.env.NODE_ENV === "production") {
            resetLink = `${process.env.FRONTEND_URL}/reset-password/owner?token=${resetToken}`;
        }
        else {
            resetLink = `${process.env.FRONTEND_URL}/reset-password/owner?token=${resetToken}`;
        }

        // Send the password reset email
        await sendResetEmail(user.email, user.username, resetLink);

        return res.status(200).json({
            message: 'Password reset email sent. Please check your registered email inbox.',
            ok: true
        });
    } catch (error) {
        console.error('Error handling forgot password request: ', error);
        return res.status(500).json({ message: 'Server error. Please try again later.', error: true, ok: false });
    }
};

const resetForgotPassword = async (req: Request, res: Response): Promise<any> => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ message: "Invalid request. Token and password are required.", error: true, ok: false });
    }


    try {
        // Hash the received token to match the stored one
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        // Find the user with the provided reset token (and check if it’s not expired)
        const user = await UserModel.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }, // Ensure token is not expired
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token.", error: true, ok: false });
        }


        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Clear the reset token fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        // Save the updated user data
        await user.save();

        return res.status(200).json({ message: "Password reset successful. You can now log in.", error: false, ok: true });
    } catch (error) {
        console.error("Error resetting password:", error);
        return res.status(500).json({ message: "Server error. Please try again later.", error: true, ok: false });
    }
}

const deleteuser = async (req: Request, res: Response): Promise<any> => {
    try {

        let { userId } = req.params
        const user = await UserModel.findByIdAndDelete(userId)

        return res.status(200).json({ message: "user deleted successful. You can now log in.", error: false, ok: true, data: user });

    }
    catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({ message: "Server error. Please try again later.", error: true, ok: false });
    }
}

export {
    userlogin,
    userLogout,
    registerUser,
    refreshToken,
    isAuthenticated,
    resetForgotPassword,
    forgotPassword,
    deleteuser
}