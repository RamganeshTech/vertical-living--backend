import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedClientRequest } from '../types/types';

const ClientAuthMiddleware = async (req: AuthenticatedClientRequest, res: Response, next: () => void) => {
    try {
        const accesstoken = req.cookies.clientaccesstoken

        if (!accesstoken) {
            res.status(401).json({ message: "Unauthorized: Please login client", ok: false })
            return;
        }

        const decodeddata = jwt.verify(accesstoken, process.env.JWT_CLIENT_ACCESS_SECRET!)

        req.client = decodeddata
        next()
    }
    catch (error) {
        res.status(403).json({ message: "Invalid or expired token for client", error: true, ok: false });
        return;
    }
}

export default ClientAuthMiddleware;