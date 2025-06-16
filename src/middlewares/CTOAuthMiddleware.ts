import { Response } from "express";
import jwt from 'jsonwebtoken';
import { AuthenticatedCTORequest } from "../types/types";

const CTOAuthenticatedMiddleware = (req: AuthenticatedCTORequest, res: Response, next: () => void) => {
    try {
        let token = req.cookies.ctoaccesstoken

        if (!token) {
             res.status(401).json({ message: "Unauthorized: Please login", error: true, ok: false })
             return
        }

        let decodedData = jwt.verify(token, process.env.JWT_CTO_ACCESS_SECRET as string)

        req.CTO = decodedData
        next()
    }
    catch {
        res.status(403).json({ message: "Invalid or expired token", error: true , ok:false});
        return;
    }
}

export default CTOAuthenticatedMiddleware;