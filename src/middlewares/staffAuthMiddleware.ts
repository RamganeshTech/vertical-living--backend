import { Response } from "express";
import jwt from 'jsonwebtoken';
import { AuthenticatedStaffRequest } from "../types/types";

const staffAuthenticatedMiddleware = (req: AuthenticatedStaffRequest, res: Response, next: () => void) => {
    try {
        let token = req.cookies.staffaccesstoken

        if (!token) {
             res.status(401).json({ message: "Unauthorized: Please login", error: true, ok: false })
             return
        }

        let decodedData = jwt.verify(token, process.env.JWT_STAFF_ACCESS_SECRET as string)

        req.staff = decodedData
        next()
    }
    catch {
        res.status(403).json({ message: "Invalid or expired token", error: true , ok:false});
        return;
    }
}

export default staffAuthenticatedMiddleware;