import { Response } from "express";
import { RoleBasedRequest } from "../../types/types";
import ToolMasterModel from "../../models/tool_model/toolMaster.model";
// import ToolIssueTransactionModel from "../../models/tool_model/toolIssue.model";
import ToolOtpLogModel from "../../models/tool_model/toolOtp.model";
import { getModelNameByRole } from "../../utils/common features/utils";
import ToolIssueTransactionModel from "../../models/tool_model/toolIssueTransaction.model";
import ToolReturnTransactionModel from "../../models/tool_model/toolReturnTransaction.model";
import mongoose from "mongoose";
import ToolPhotoModel from "../../models/tool_model/toolPhoto.model";
import axios from 'axios';
import { WorkerModel } from "../../models/worker model/worker.model";
import dotenv from 'dotenv';
import { createNotification } from "../Notification Controller/notification.service";
import { NotificationType, UserModelType } from "../Notification Controller/notification.controller";
import ToolRoomModel from "../../models/tool_model/toolRoom.model";
dotenv.config()


export const getAllToolWithoutPagination = async (req: any, res: Response): Promise<any> => {
    try {
        const {
            organizationId,

        } = req.params;


        const tools = await ToolMasterModel.find({ organizationId }).select("_id toolRoomId toolName toolCode brand conditionStatus availabilityStatus")

        return res.status(200).json({
            ok: true,
            message: "all tools",
            data: tools
        });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};


export const getAllToolRoomWithoutPagination = async (req: any, res: Response): Promise<any> => {
    try {
        const {
            organizationId,
        } = req.params;


        const toolRoom = await ToolRoomModel.find({ organizationId }).select("_id toolRoomName allowedIssueFrom allowedIssueTo")

        return res.status(200).json({
            ok: true,
            message: "all tool room",
            data: toolRoom
        });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};

export const initiateToolIssue = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { toolId, toolWorkerId, projectId, toolRoomId, organizationId, expectedReturnDate } = req.body;

        if (!req.user || !req.user.role || !req.user._id) {
            return
        }

        // 1. Check if the tool is actually available
        const tool = await ToolMasterModel.findOne({ _id: toolId, organizationId });
        if (!tool || tool?.availabilityStatus?.toLowerCase() !== "available") {
            return res.status(400).json({ ok: false, message: "Tool is not available (already issued or in repair)." });
        }

        // 2. Create a 'PENDING' transaction immediately
        // This ensures the tool is "locked" while waiting for the worker to enter OTP
        const modelName = getModelNameByRole(req.user.role);

        const pendingTx = await ToolIssueTransactionModel.create({
            organizationId,
            toolId,
            toolWorkerId,
            projectId,
            toolRoomId,
            issueDateTime: new Date(),
            expectedReturnDate: expectedReturnDate,
            issueOtpVerified: false,
            transactionStatus: "pending", // Custom status for the flow
            issuedByUserId: req.user._id,
            issuedByUserModel: modelName
        });

        // 3. Generate and Send OTP (MSG91 Logic)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();



        // Log OTP in DB for the worker to verify
        const otpRecord = await ToolOtpLogModel.create({
            organizationId,
            workerId: toolWorkerId,
            toolId,
            transactionType: "issue",
            transactionId: pendingTx._id,
            // status: "pending",
            isValid: true,
            toolRoomId: toolRoomId,
            otp,
            otpGeneratedAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 60000) // 5 Minute validity
        });




        const tasksByAssignee = new Map<string, any>();


        if (toolWorkerId) {
            const assigneeIdStr = toolWorkerId.toString();
            tasksByAssignee.set(assigneeIdStr, otpRecord);

            const message = `OTP Received for the issued tool ${otpRecord.otp}`


            await createNotification({
                organizationId: organizationId?.toString(),
                userId: assigneeIdStr,
                userModel: "WorkerModel" as UserModelType,
                message,
                type: NotificationType.INFO,
                fromModule: "tool",
                navigation: {

                    url: `organizations/${organizationId}/projects/enterotp`,
                    label: 'Enter OTP',
                },
                projectId: projectId?.toString() || null,
            }).catch(err => {
                console.error(`❌ Failed to create notification for ${toolWorkerId}:`, err);
            })
        }

        // TODO: Call MSG91 API here to send 'otp' to worker's registered mobile

        return res.status(200).json({
            ok: true,
            message: "Pickup request sent. Worker must verify via OTP in their app.",
            data: pendingTx,
            otp: otp
        });

    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};



export const resendIssueOtp = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { transactionId, organizationId } = req.body;

        if (!req.user || !req.user._id) {
            return res.status(401).json({ ok: false, message: "Unauthorized" });
        }

        // 1. Find the existing pending transaction
        const transaction = await ToolIssueTransactionModel.findOne({
            _id: transactionId,
            organizationId,
            transactionStatus: "pending"
        });

        if (!transaction) {
            return res.status(404).json({ ok: false, message: "No active pending transaction found for this tool." });
        }

        // 2. Invalidate ALL previous OTPs for this specific transaction
        // This ensures old codes (even if not technically expired) cannot be used
        await ToolOtpLogModel.updateMany(
            { transactionId: transaction._id, isValid: true },
            { $set: { isValid: false } }
        );


        
        const pendingTx = await ToolIssueTransactionModel.create({
            organizationId,
            toolId: transaction.toolId,
            toolWorkerId: transaction.toolWorkerId,
            projectId: transaction.projectId,
            toolRoomId: transaction.toolRoomId,
            issueDateTime: new Date(),
            expectedReturnDate: transaction.expectedReturnDate,
            issueOtpVerified: false,
            transactionStatus: "pending", // Custom status for the flow
            issuedByUserId: req.user._id,
            issuedByUserModel: transaction.issuedByUserModel
        });



        // 3. Generate a New OTP
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

        // 4. Create New OTP Record
        const newOtpRecord = await ToolOtpLogModel.create({
            organizationId,
            workerId: pendingTx.toolWorkerId,
            toolId: pendingTx.toolId,
            transactionType: "issue",
            transactionId: pendingTx._id,
            isValid: true,
            otp: newOtp,
            otpGeneratedAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 60000) // 5 Minutes
        });

        


         await ToolIssueTransactionModel.findByIdAndDelete(transaction._id)

        // 5. Notify the Worker again
        const message = `New OTP Received for tool issue: ${newOtp}`;

        await createNotification({
            organizationId: organizationId.toString(),
            userId: transaction.toolWorkerId.toString(),
            userModel: "WorkerModel" as UserModelType,
            message,
            type: NotificationType.INFO,
            fromModule: "tool",
            navigation: {
                url: `organizations/${organizationId}/projects/enterotp`,
                label: 'Enter New OTP',
            },
            projectId: transaction.projectId.toString(),
        }).catch(err => console.error(`❌ Resend Notification Error:`, err));

        // Note: You would also trigger the MSG91 SMS here

        return res.status(200).json({
            ok: true,
            message: "A new OTP has been sent to the worker.",
            otp: newOtpRecord.otp, // Include for development testing
            data: pendingTx
        });

    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};



export const workerVerifyAndAccept = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { otp, organizationId } = req.body;

        if (!req.user || !req.user.role || !req.user._id) {
            return
        }

        const workerId = req.user._id; // Taken from logged-in worker session
        // const organizationId = req.user.organizationId;

        // 1. Validate the OTP against the transaction and worker


        console.log("Query Params:", {
            workerId: String(workerId),
            otp: String(otp),
            organizationId: String(organizationId)
        });


        // console.log("workerId", workerId)


        const otpRecord = await ToolOtpLogModel.findOne({
            // transactionId,
            isValid: true,
            workerId: new mongoose.Types.ObjectId(String(workerId)),
            otp: String(otp),
            organizationId: new mongoose.Types.ObjectId(String(organizationId))
        });

        if (!otpRecord) {
            return res.status(400).json({ ok: false, message: "Invalid OTP or request expired." });
        }

        // --- ADDED EXPIRY LOGIC HERE ---
        const currentTime = new Date();
        if (currentTime > (otpRecord as any).expiresAt) {
            // Optional: Mark it as invalid so it can't be found again
            otpRecord.isValid = false;
            await otpRecord.save();

            return res.status(400).json({ ok: false, message: "OTP has expired. Please generate a new one." });
        }
        // -------------------------------


        // 2. Use the transactionId stored inside the otpRecord
        const transactionId = (otpRecord as any).transactionId;

        // 2. Update the Transaction to 'issued'
        const transaction = await ToolIssueTransactionModel.findOneAndUpdate(
            { _id: transactionId, toolWorkerId: workerId, transactionStatus: "pending" },
            {
                transactionStatus: "issued",
                issueOtpVerified: true,
                issueDateTime: new Date() // Set final time of handover
            },
            { new: true }
        );

        if (!transaction) {
            return res.status(404).json({ ok: false, message: "No pending transaction found." });
        }

        // 3. Update the Tool Master Status to 'issued'
        await ToolMasterModel.findByIdAndUpdate(transaction.toolId, {
            availabilityStatus: "issued"
        });

        // After finding the otpRecord, check if it's already used
        // if ((otpRecord as any).status === "used") {
        //     return res.status(400).json({ ok: false, message: "This OTP has already been used." });
        // }

        // ... after transaction is successful, mark it:
        // (otpRecord as any).status = "used";
        (otpRecord as any).otpVerifiedAt = new Date();
        (otpRecord as any).isValid = false;
        await otpRecord.save();

        // 4. Cleanup OTP
        // await ToolOtpLogModel.deleteOne({ _id: otpRecord._id });

        return res.status(200).json({
            ok: true,
            message: "Tool possession confirmed. Transaction finalized.",
            data: transaction
        });

    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};






export const initiateToolReturn = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { toolId,
            //  transactionId,
            toolWorkerId,
            returnCondition, damageNotes, toolRoomId, organizationId } = req.body;


        if (!toolId || !toolWorkerId) {
            return res.status(400).json({
                ok: false,
                message: "select the tool and the worker"
            });
        }

        if (!req.user || !req.user.role || !req.user._id) {
            return res.status(401).json({
                ok: false,
                message: "Unauthorized"
            });
        }

        // 1. Verify the original issue transaction exists and is still "issued"
        const issueTx = await ToolIssueTransactionModel.findOne({
            toolId: toolId,
            organizationId,
            transactionStatus: "issued"
        });

        if (!issueTx) {
            return res.status(404).json({ ok: false, message: "No active issue record found for this tool." });
        }

        // 2. Handle Damage Photos if provided
        const files = req.files as (Express.Multer.File & { location: string })[];
        if (returnCondition === "damaged" && (!files || files.length === 0)) {
            return res.status(400).json({ ok: false, message: "Photos are mandatory for damaged tools." });
        }

        const modelName = getModelNameByRole(req.user.role);

        // Upload photos to ToolPhotoModel if they exist
        if (returnCondition === "damaged" && files && files.length > 0) {
            const photoEntries = files.map(file => ({
                toolId: issueTx.toolId,
                transactionId: issueTx._id,
                photo: {
                    type: file.mimetype.startsWith("image") ? "image" : "pdf",
                    url: file.location,
                    originalName: file.originalname,
                    uploadedAt: new Date()
                },
                photoType: returnCondition === "damaged" ? "damaged" : "master",
                uploadedBy: (req as any).user._id!,
                uploaderModel: modelName
            }));
            await ToolPhotoModel.insertMany(photoEntries);
        }

        // 3. Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 4. Save to OTP Log for the worker to verify
        // We store returnCondition and notes in the OTP log temporarily so they are applied only after OTP verification
        const otpRecord = await ToolOtpLogModel.create({
            organizationId,
            generatedUserId: req.user._id || null,
            generatedUserModel: modelName,
            workerId: issueTx.toolWorkerId,
            toolId: toolId,
            transactionId: issueTx._id,
            otp,
            isValid: true,
            toolRoomId: toolRoomId,
            transactionType: "return", // Added this to your OTP model to distinguish from 'issue'
            metadata: { returnCondition, damageNotes }, // Temporary storage used only int eh returnin g the things
            expiresAt: new Date(Date.now() + 5 * 60000)
        });



        const tasksByAssignee = new Map<string, any>();


        if (toolWorkerId) {
            const assigneeIdStr = toolWorkerId.toString();
            tasksByAssignee.set(assigneeIdStr, otpRecord);

            const message = `OTP Received to Return tool ${otpRecord.otp}`


            await createNotification({
                organizationId: organizationId?.toString(),
                userId: assigneeIdStr,
                userModel: "WorkerModel" as UserModelType,
                message,
                type: NotificationType.INFO,
                navigation: {

                    url: `organizations/${organizationId}/projects/enterotp`,
                    label: 'Enter OTP',
                },
                fromModule: "tool",
                projectId: null,
            }).catch(err => {
                console.error(`❌ Failed to create notification for ${toolWorkerId}:`, err);
            })
        }

        // TODO: Call MSG91 to send OTP to Worker

        return res.status(200).json({
            ok: true,
            message: "Return initiated. Worker must enter OTP to confirm return.",
            data: issueTx,
            otp: otpRecord.otp
        });

    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};


export const resendReturnOtp = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { toolId, organizationId, toolWorkerId } = req.body;

        if (!req.user || !req.user._id) {
            return res.status(401).json({ ok: false, message: "Unauthorized" });
        }

        // 1. Verify that the tool is still in 'issued' status 
        // (If it was already returned, we can't resend an OTP)
        const issueTx = await ToolIssueTransactionModel.findOne({
            toolId: toolId,
            organizationId,
            transactionStatus: "issued"
        });

        if (!issueTx) {
            return res.status(404).json({ ok: false, message: "No active issue record found for this tool." });
        }

        // 2. Find the existing 'return' OTP that needs to be replaced
        const existingOtp = await ToolOtpLogModel.findOne({
            toolId,
            workerId: toolWorkerId,
            organizationId,
            transactionType: "return",
            isValid: true
        });

        if (!existingOtp) {
            return res.status(404).json({ ok: false, message: "No pending return request found to resend OTP." });
        }

        // 3. Invalidate the previous OTP
        existingOtp.isValid = false;
        // existingOtp.status = "replaced";
        await existingOtp.save();

        // 4. Generate New OTP
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

        // 5. Create New OTP Record with same metadata (condition, notes, etc.)
        const modelName = getModelNameByRole(req.user.role);
        const newOtpRecord = await ToolOtpLogModel.create({
            organizationId,
            generatedUserId: req.user._id,
            generatedUserModel: modelName,
            workerId: issueTx.toolWorkerId,
            toolId: toolId,
            transactionId: issueTx._id,
            otp: newOtp,
            isValid: true,
            toolRoomId: existingOtp.toolRoomId,
            transactionType: "return",
            metadata: existingOtp.metadata, // Preserve the condition and notes from previous attempt
            expiresAt: new Date(Date.now() + 5 * 60000)
        });

        // 6. Send Notification to Worker
        const message = `New OTP Received to Return tool: ${newOtp}`;
        
        await createNotification({
            organizationId: organizationId.toString(),
            userId: toolWorkerId.toString(),
            userModel: "WorkerModel" as UserModelType,
            message,
            type: NotificationType.INFO,
            fromModule: "tool",
            navigation: {
                url: `organizations/${organizationId}/projects/enterotp`,
                label: 'Enter New OTP',
            },
            projectId: null,
        }).catch(err => console.error(`❌ Resend Return Notification Error:`, err));

        return res.status(200).json({
            ok: true,
            message: "New return OTP has been sent.",
            otp: newOtpRecord.otp, // For testing
            data: issueTx
        });

    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};



export const workerVerifyReturn = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { otp, organizationId } = req.body;

        if (!req.user || !req.user.role || !req.user._id) {
            return
        }


        const workerId = req.user._id;

        // 1. Find the Return OTP Log
        const otpRecord = await ToolOtpLogModel.findOne({
            workerId,
            otp,
            isValid: true,
            organizationId,
            transactionType: "return",
            otpVerifiedAt: { $exists: false }
        }).sort({ createdAt: -1 });



        if (!otpRecord) {
            return res.status(400).json({ ok: false, message: "Invalid OTP or OTP expired." });
        }


        // --- ADDED EXPIRY LOGIC HERE ---
        const currentTime = new Date();
        if (currentTime > (otpRecord as any).expiresAt) {
            // Optional: Mark it as invalid so it can't be found again
            otpRecord.isValid = false;
            await otpRecord.save();

            return res.status(400).json({ ok: false, message: "OTP has expired. Please generate a new one." });
        }
        // -------------------------------


        const { transactionId, metadata } = otpRecord;
        // const modelName = getModelNameByRole(req.user.role);

        // 2. Create the ToolReturnTransaction record
        const returnTx = await ToolReturnTransactionModel.create({
            organizationId,
            transactionId,

            toolId: (otpRecord as any)?.toolId || null,
            returnDateTime: new Date(),
            returnCondition: metadata?.returnCondition || null,
            damageNotes: metadata?.damageNotes || null,
            returnOtpVerified: true,
            toolRoomId: (otpRecord as any)?.toolRoomId || null,
            receivedByUserId: otpRecord.generatedUserId || null, // The storekeeper who initiated is already in session? 
            // NOTE: Usually, the 'receivedBy' is the Storekeeper. Since the worker is the one 
            // calling this API, we should fetch the Storekeeper's ID from the original Issue Tx 
            // or the OTP record's creator.
            receivedByUserModel: otpRecord.generatedUserModel || null,
        });

        // 3. Update the original Issue Transaction Status
        await ToolIssueTransactionModel.findByIdAndUpdate(transactionId, {
            transactionStatus: "returned",
            toolReturnId: returnTx._id,
        });

        // 4. Update the Tool Master Status
        // If it was damaged, status becomes 'repair'. If OK, status becomes 'available'.
        const newStatus = metadata?.returnCondition === "damaged" ? "damaged" : "available";

        await ToolMasterModel.findByIdAndUpdate(otpRecord.toolId, {
            availabilityStatus: newStatus,
            conditionStatus: metadata?.returnCondition === "damaged" ? "damaged" : "good"

        });

        // 5. Cleanup
        // await ToolOtpLogModel.deleteOne({ _id: otpRecord._id });

        (otpRecord as any).otpVerifiedAt = new Date();
        (otpRecord as any).isValide = false;

        await otpRecord.save()

        return res.status(200).json({
            ok: true,
            message: `Tool return finalized as ${metadata?.returnCondition}.`,
            data: returnTx
        });

    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};





//  tool history log



export const getToolTimelineHistory = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { toolId } = req.params;
        const { organizationId } = req.query;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const tId = new mongoose.Types.ObjectId(toolId);
        const oId = new mongoose.Types.ObjectId(organizationId as string);

        const totalDocs = await ToolIssueTransactionModel.countDocuments({ toolId: tId, organizationId: oId });

        const pipeline: any[] = [
            { $match: { toolId: tId, organizationId: oId } },

            // 1. Core Lookups
            { $lookup: { from: "toolreturntransactionmodels", localField: "toolReturnId", foreignField: "_id", as: "returnData" } },
            { $unwind: { path: "$returnData", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "workermodels", localField: "toolWorkerId", foreignField: "_id", as: "worker" } },
            { $lookup: { from: "projectmodels", localField: "projectId", foreignField: "_id", as: "project" } },

            // 2. Room Lookups (Look for Room in Issue OR Return document)
            { $lookup: { from: "toolroommodels", localField: "toolRoomId", foreignField: "_id", as: "issueRoom" } },
            { $lookup: { from: "toolroommodels", localField: "returnData.toolRoomId", foreignField: "_id", as: "returnRoom" } },

            // 3. Staff Lookups (Joining all 4 possible models)
            { $lookup: { from: "usermodels", localField: "issuedByUserId", foreignField: "_id", as: "issueUser" } },
            { $lookup: { from: "staffmodels", localField: "issuedByUserId", foreignField: "_id", as: "issueStaff" } },
            { $lookup: { from: "ctomodels", localField: "issuedByUserId", foreignField: "_id", as: "issueCTO" } },

            // 4. Return Staff Lookups
            // 4. Return Staff Lookups (Staff, User, CTO)
            // We specifically look for non-worker roles here to represent the collector
            { $lookup: { from: "usermodels", localField: "returnData.receivedByUserId", foreignField: "_id", as: "retUser" } },
            { $lookup: { from: "staffmodels", localField: "returnData.receivedByUserId", foreignField: "_id", as: "retStaff" } },
            { $lookup: { from: "ctomodels", localField: "returnData.receivedByUserId", foreignField: "_id", as: "retCTO" } },

            // {
            //     $project: {
            //         events: [
            //             {
            //                 eventType: "ISSUE",
            //                 date: "$issueDateTime",
            //                 workerName: { $arrayElemAt: ["$worker.workerName", 0] },
            //                 // Dynamically pick the name based on which lookup found a match
            //                 staffName: {
            //                     $concat: [
            //                         { $ifNull: [{ $arrayElemAt: ["$issueUser.username", 0] }, ""] },
            //                         { $ifNull: [{ $arrayElemAt: ["$issueStaff.staffName", 0] }, ""] },
            //                         { $ifNull: [{ $arrayElemAt: ["$issueCTO.CTOName", 0] }, ""] }
            //                     ]
            //                 },
            //                 projectId: { $arrayElemAt: ["$project.projectName", 0] },
            //                 roomData: { $arrayElemAt: ["$issueRoom.toolRoomName", 0] },
            //                 status: "$transactionStatus"
            //             },
            //             {
            //                 $cond: [
            //                     { $ifNull: ["$toolReturnId", false] },
            //                     {
            //                         eventType: "RETURN",
            //                         date: "$returnData.returnDateTime",
            //                         workerName: { $arrayElemAt: ["$worker.workerName", 0] },
            //                         staffName: {
            //                             $concat: [
            //                                 { $ifNull: [{ $arrayElemAt: ["$retStaff.staffName", 0] }, ""] },
            //                                 { $ifNull: [{ $arrayElemAt: ["$retWorker.workerName", 0] }, ""] }
            //                             ]
            //                         },
            //                         projectId: { $arrayElemAt: ["$project.projectName", 0] },
            //                         roomData: { $arrayElemAt: ["$returnRoom.toolRoomName", 0] }, // Fixed room path
            //                         status: "$returnData.returnCondition"
            //                     },
            //                     "$$REMOVE"
            //                 ]
            //             }
            //         ]
            //     }
            // },

            {
                $project: {
                    events: [
                        {
                            eventType: "ISSUE",
                            date: "$issueDateTime",
                            workerName: { $ifNull: [{ $arrayElemAt: ["$worker.workerName", 0] }, "N/A"] },
                            staffName: {
                                $trim: {
                                    input: {
                                        $concat: [
                                            { $ifNull: [{ $arrayElemAt: ["$issueUser.username", 0] }, ""] },
                                            { $ifNull: [{ $arrayElemAt: ["$issueStaff.staffName", 0] }, ""] },
                                            { $ifNull: [{ $arrayElemAt: ["$issueCTO.CTOName", 0] }, ""] }
                                        ]
                                    }
                                }
                            },
                            projectId: { $ifNull: [{ $arrayElemAt: ["$project.projectName", 0] }, "N/A"] },
                            roomData: { $ifNull: [{ $arrayElemAt: ["$issueRoom.toolRoomName", 0] }, "N/A"] },
                            status: "$transactionStatus"
                        },
                        {
                            $cond: [
                                { $ifNull: ["$toolReturnId", false] },
                                {
                                    eventType: "RETURN",
                                    date: "$returnData.returnDateTime",
                                    workerName: { $ifNull: [{ $arrayElemAt: ["$worker.workerName", 0] }, "N/A"] },
                                    staffName: {
                                        $trim: {
                                            input: {
                                                $concat: [
                                                    { $ifNull: [{ $arrayElemAt: ["$retUser.username", 0] }, ""] },
                                                    { $ifNull: [{ $arrayElemAt: ["$retStaff.staffName", 0] }, ""] },
                                                    { $ifNull: [{ $arrayElemAt: ["$retCTO.CTOName", 0] }, ""] }
                                                ]
                                            }
                                        }
                                    },
                                    projectId: { $ifNull: [{ $arrayElemAt: ["$project.projectName", 0] }, "N/A"] },
                                    roomData: { $ifNull: [{ $arrayElemAt: ["$returnRoom.toolRoomName", 0] }, "N/A"] },
                                    status: "$returnData.returnCondition"
                                },
                                "$$REMOVE"
                            ]
                        }
                    ]
                }
            },
            { $unwind: "$events" },
            { $sort: { "events.date": -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ];


        // why the toolRoom is provided for some and why it si not provided for others i dont know 

        const history = await ToolIssueTransactionModel.aggregate(pipeline);

        // 5. Final Formatting with Null Protection
        const formattedData = history
            .filter(item => item && item.events) // Protective filter against nulls
            .map((item: any) => {
                const ev = item.events;
                return {
                    ...ev,
                    // If staffName is empty string from concat, fallback to "System"
                    staffName: (ev.staffName && ev.staffName.length > 0) ? ev.staffName : "System"
                };
            });

        return res.status(200).json({
            ok: true,
            pagination: {
                total: totalDocs,
                totalPages: Math.ceil((totalDocs * 2) / limit),
                currentPage: page
            },
            data: formattedData
        });

    } catch (error: any) {
        console.log("internal error", error)
        return res.status(500).json({ ok: false, message: error.message });
    }
};