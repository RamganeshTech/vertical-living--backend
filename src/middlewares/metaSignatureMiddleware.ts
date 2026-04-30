import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export const verifyMetaSignature = (req: any, res: Response, next: NextFunction):void => {
    const signature = req.headers['x-hub-signature-256'] as string;

    if (!signature) {
        console.warn("No signature found on request");
         res.sendStatus(401);
         return
    }

    const elements = signature.split('=');
    const signatureHash = elements[1];
    
    // Use your META_APP_SECRET from your .env
    const expectedHash = crypto
        .createHmac('sha256', process.env.META_APP_SECRET || '')
        .update(req.rawBody)
        .digest('hex');

    if (signatureHash !== expectedHash) {
        console.error("Signature verification failed");
         res.sendStatus(403);
         return
    }

    next();
};