import { Request, RequestHandler, Response } from "express"
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import UserModel from "../models/user.model";
import { AuthenticatedUserRequest } from "../types/types";

const userlogin = async (req: Request, res: Response) => {
    try {
        let { email, password } = req.body

        let isTokenExists = req.cookies.useraccesstoken

        if (isTokenExists) {
            return res.status(403).json({ error: true, message: "Already logged in", ok: false });
        }

        if (!email || !password) {
            res.status(404).json({ message: "please provide the input properly", error: true, ok: false })
        }

        const user = await UserModel.findOne({ email: email })

        if (!user) {
            return res.status(404).json({ message: "invalid credentials", error: true, ok: false })
        }

        const isMatching = await bcrypt.compare(password, user?.password)

        if (!isMatching) {
            return res.status(404).json({ message: "invalid credentials", error: true, ok: false })
        }


        let token = jwt.sign({ _id: user._id }, process.env.JWT_ACCESS_SECRET as string, { expiresIn: "1d" })
        let refreshToken = jwt.sign({ _id: user._id }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: "7d" })

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

        res.status(200).json({ message: `${user.username} loggedin successfull`, ok: true, error: false })
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


        res.status(200).json({ message: "Logout successful", ok: true, error: false });
        return;
    }
    catch (error) {
        console.log(error)
        res.status(500).json({ message: "internal server error", errormessage: error, ok: false, error: true });

    }
}

const registerUser = async (req: Request, res: Response) => {
    try {
        const { email, password, username, phoneNo } = req.body

        const isExist = await UserModel.findOne({ email: email })

        if (isExist) {
            return res.status(400).json({ message: "user aleady there with this email and username", error: true, ok: false })
        }

        const hashPassword = await bcrypt.hash(password, 10)

        const user = await UserModel.create({
            email,
            password: hashPassword,
            username,
            phoneNo
        })

        let token = jwt.sign({ _id: user._id }, process.env.JWT_ACCESS_SECRET as string, { expiresIn: "1d" })
        let refreshToken = jwt.sign({ _id: user._id }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: "7d" })

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


        res.status(200).json({ message: `${user.username} account created successfull`, ok: true, error: false })

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
            return res.status(403).json({ message: "no refresh token provided please login", ok: false })
        }

        let isDataExists = jwt.verify(refreshtoken, process.env.JWT_REFRESH_SECRET as string) as { _id: string };

        let isExists = await UserModel.findById(isDataExists._id)

        if (!isExists) {
            return res.status(404).json({ message: "user not found", ok: false })
        }

        let useraccesstoken = jwt.sign({ _id: isExists._id }, process.env.JWT_ACCESS_SECRET as string, { expiresIn: "1d" })

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

const isAuthenticated = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedUserRequest).user as { _id: string }

        const isExist = await UserModel.findById(user._id)

        if (!isExist) {
            return res.status(404).json({ message: "user not found", ok: false })
        }

        res.status(200).json({ data: isExist, message: "user is authenticated", ok: true })
    }
    catch (error) {
        if (error instanceof Error) {
            console.log("erorr from isAutneticated user", error)
            res.status(500).json({ message: "internal error ocuured", errorMssage: error, ok: false })
        }
    }
}

export {
    userlogin,
    userLogout,
    registerUser,
    refreshToken,
    isAuthenticated
}