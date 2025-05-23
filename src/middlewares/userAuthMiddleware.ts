import { Response } from "express";
import jwt from 'jsonwebtoken';
import { AuthenticatedUserRequest } from "../types/types";

const userAuthenticatedMiddleware = (req: AuthenticatedUserRequest, res: Response, next: () => void) => {
    try {
        let token = req.cookies.useraccesstoken

        if (!token) {
            return res.status(401).json({ message: "Unauthorized: Please login", error: true, ok: false })
        }

        let decodedData = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string)

        req.user = decodedData
        // req.user = decodedData as Record<string, any>;
        next()
    }
    catch {
        res.status(403).json({ message: "Invalid or expired token", error: true , ok:false});
        return;
    }
}

export default userAuthenticatedMiddleware;