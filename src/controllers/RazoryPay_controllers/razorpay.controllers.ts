import { Request, Response } from "express";
import { RazorpayIntegrationModel } from "../../models/razoryPay_model/razorPay.model";
import { decrypt, encrypt } from "../../utils/Encryption/encryption";




// CREATE OR UPDATE
// export const saveRazorpayConfig = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { organizationId } = req.params;
//         const {
//             razorpayKeyId,
//             razorpayKeySecret,
//             razorpayXKeyId,
//             razorpayXKeySecret,
//             razorpayXAccountNumber
//         } = req.body;

//         if (!razorpayKeyId || !razorpayKeySecret) {
//             return res.status(400).json({ ok: false, message: "Razorpay keys required" });
//         }

//         const encryptedData = {
//             razorpayKeyId,
//             razorpayKeySecret: encrypt(razorpayKeySecret),

//             razorpayXKeyId,
//             razorpayXKeySecret: razorpayXKeySecret
//                 ? encrypt(razorpayXKeySecret)
//                 : null,

//             razorpayXAccountNumber: razorpayXAccountNumber
//                 ? encrypt(razorpayXAccountNumber)
//                 : null,
//         };

//         let config = await RazorpayIntegrationModel.findOne({ organizationId });

//         if (config) {
//             // Update
//             Object.assign(config, encryptedData);
//             await config.save();
//         } else {
//             // Create new
//             config = await RazorpayIntegrationModel.create({
//                 organizationId,
//                 ...encryptedData
//             });
//         }

//         return res.json({
//             ok: true,
//             message: "Razorpay configuration saved successfully",
//             data: {
//                 ...config.toObject(),
//                 razorpayKeySecret: "********",
//                 razorpayXKeySecret: config.razorpayXKeySecret ? "********" : null,
//                 razorpayXAccountNumber: config.razorpayXAccountNumber ? "********" : null,
//             }
//         });

//     } catch (error: any) {
//         res.status(500).json({ ok: false, message: error.message });
//     }
// };

export const saveRazorpayConfig = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.params;
        const {
            razorpayKeyId,
            razorpayKeySecret,
            razorpayXKeyId,
            razorpayXKeySecret,
            razorpayXAccountNumber
        } = req.body;

        if (!razorpayKeyId || !razorpayKeySecret) {
            return res.status(400).json({ ok: false, message: "Razorpay Key ID and Secret are required" });
        }

        // ✅ DON'T ENCRYPT HERE - let the pre-save hook handle it
        const payload: any = {
            razorpayKeyId,
            razorpayKeySecret, // Plain text - will be encrypted in pre-save
        };

        // Only add optional fields if provided
        if (razorpayXKeyId) payload.razorpayXKeyId = razorpayXKeyId;
        if (razorpayXKeySecret) payload.razorpayXKeySecret = razorpayXKeySecret;
        if (razorpayXAccountNumber) payload.razorpayXAccountNumber = razorpayXAccountNumber;

        // ✅ Use findOneAndUpdate with upsert
        const config = await RazorpayIntegrationModel.findOneAndUpdate(
            { organizationId },
            { $set: payload },
            { upsert: true, new: true, runValidators: true }
        );

        return res.json({
            ok: true,
            message: "Razorpay configuration saved successfully",
            data: {
                razorpayKeyId: config.razorpayKeyId,
                razorpayKeySecret: "********",
                razorpayXKeyId: config.razorpayXKeyId || null,
                razorpayXKeySecret: config.razorpayXKeySecret ? "********" : null,
                razorpayXAccountNumber: config.razorpayXAccountNumber ? "********" : null,
                active: config.active,
                createdAt: config.createdAt,
                updatedAt: config.updatedAt
            }
        });

    } catch (error: any) {
        console.error("Error saving Razorpay config:", error);
        res.status(500).json({ ok: false, message: error.message });
    }
};


export const getRazorpayConfig = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.params;

        const config = await RazorpayIntegrationModel.findOne({ organizationId });

        if (!config) {
            return res.status(404).json({ ok: false, message: "No Razorpay config found" });
        }

        return res.json({
            ok: true,
            data: {
                razorpayKeyId: config.razorpayKeyId,
                razorpayKeySecret: "********",
                razorpayXKeyId: config.razorpayXKeyId || null,
                razorpayXKeySecret: config.razorpayXKeySecret ? "********" : null,
                razorpayXAccountNumber: config.razorpayXAccountNumber ? "********" : null,
                active: config.active,
                createdAt: config.createdAt,
                updatedAt: config.updatedAt
            }
        });

    } catch (error: any) {
        res.status(500).json({ ok: false, message: error.message });
    }
};



export const deleteRazorpayConfig = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.params;

        const config = await RazorpayIntegrationModel.findOneAndDelete({
            organizationId
        });

        if (!config) {
            return res.status(404).json({ ok: false, message: "Razorpay config not found" });
        }

        return res.json({
            ok: true,
            message: "Razorpay configuration deleted successfully"
        });

    } catch (error: any) {
        res.status(500).json({ ok: false, message: error.message });
    }
};





// ✅ NEW: Get decrypted config (ONLY for internal use - never expose via API)
export const getDecryptedRazorpayConfig = async (organizationId: string) => {
    const config = await RazorpayIntegrationModel.findOne({ organizationId });
    
    if (!config) {
        throw new Error("No Razorpay configuration found");
    }

    // const { decrypt } = await import("../../utils/Encryption/encryption");

    return {
        razorpayKeyId: config.razorpayKeyId,
        razorpayKeySecret: decrypt(config.razorpayKeySecret),
        razorpayXKeyId: config.razorpayXKeyId,
        razorpayXKeySecret: config.razorpayXKeySecret ? decrypt(config.razorpayXKeySecret) : null,
        razorpayXAccountNumber: config.razorpayXAccountNumber ? decrypt(config.razorpayXAccountNumber) : null,
    };
};
