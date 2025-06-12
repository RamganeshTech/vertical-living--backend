import { Response } from "express";
import jwt from 'jsonwebtoken';
import { AuthenticatedWorkerRequest } from "../types/types";

const workerAuthenticatedMiddleware = (req: AuthenticatedWorkerRequest, res: Response, next: () => void) => {
    try {
        let token = req.cookies.workeraccesstoken

        if (!token) {
             res.status(401).json({ message: "Unauthorized: Please login", error: true, ok: false })
             return
        }

        let decodedData = jwt.verify(token, process.env.JWT_WORKER_ACCESS_SECRET as string)

        req.worker = decodedData
        next()
    }
    catch {
        res.status(403).json({ message: "Invalid or expired token", error: true , ok:false});
        return;
    }
}

export default workerAuthenticatedMiddleware;