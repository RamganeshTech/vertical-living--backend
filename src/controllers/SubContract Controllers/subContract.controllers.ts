// import { getModelNameByRole } from "../../utils/common features/utils";

// import { Request, Response } from "express";
// // import { SubContractModel, IWorkerInfo } from "../models/SubContract";
// import mongoose, { Types } from "mongoose";
// import crypto from "crypto";
// import { RoleBasedRequest } from "../../types/types";
// import { SubContractModel, IWorkerInfo, IFileItem } from "../../models/SubContract Model/subContract.model";
// import { AccountingModel } from "../../models/Department Models/Accounting Model/accountingMain.model";
// import { generateTransactionNumber } from "../Department controllers/Accounting Controller/accounting.controller";
// import dotenv from "dotenv"
// dotenv.config()

// // Create a new SubContract (for logged-in users)
// export const createSubContract = async (req: RoleBasedRequest, res: Response): Promise<any> => {
//     try {
//         const { organizationId, projectId, workName } = req.body;

//         if (!req.user) {
//             return res.status(401).json({
//                 ok: false,
//                 message: "User not authenticated"
//             });
//         }

//         // Validate required fields
//         if (!organizationId || !projectId || !workName) {
//             return res.status(400).json({
//                 ok: false,
//                 message: "organizationId, projectId, and workName are required"
//             });
//         }

//         // Get the model name based on user role
//         const modelName = getModelNameByRole(req.user.role);

//         // Create new SubContract
//         const newSubContract = new SubContractModel({
//             organizationId: new Types.ObjectId(organizationId),
//             projectId: new Types.ObjectId(projectId),
//             workName,
//             workOrderCreatedBy: new Types.ObjectId(req.user._id),
//             workOrderCreatedByModel: modelName,
//             workerInfo: [],
//             shrableLink: null
//         });

//         await newSubContract.save();

//         return res.status(201).json({
//             ok: true,
//             message: "SubContract created successfully",
//             data: newSubContract
//         });

//     } catch (error) {
//         console.error("Error creating SubContract:", error);
//         return res.status(500).json({
//             ok: false,
//             message: "Internal server error",
//             error: error instanceof Error ? error.message : "Unknown error"
//         });
//     }
// };

// // Generate shareable link for a SubContract
// export const generateShareableLink = async (req: RoleBasedRequest, res: Response): Promise<any> => {
//     try {
//         const { subContractId } = req.params;

//         if (!subContractId) {
//             return res.status(400).json({
//                 ok: false,
//                 message: "SubContract ID is required"
//             });
//         }

//         // Find the SubContract
//         const subContract = await SubContractModel.findById(subContractId);

//         if (!subContract) {
//             return res.status(404).json({
//                 ok: false,
//                 message: "SubContract not found"
//             });
//         }

//         // Generate unique shareable link
//         const uniqueToken = crypto.randomBytes(32).toString('hex');
//         // const shareableLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subcontract/share/${uniqueToken}`;
//         const shareableLink = uniqueToken


//         // Update the SubContract with the shareable link
//         subContract.shrableLink = shareableLink;
//         await subContract.save();

//         return res.status(200).json({
//             ok: true,
//             message: "Shareable link generated successfully",
//             data: {
//                 shareableLink,
//                 subContractId: subContract._id
//             }
//         });

//     } catch (error) {
//         console.error("Error generating shareable link:", error);
//         return res.status(500).json({
//             ok: false,
//             message: "Internal server error",
//             error: error instanceof Error ? error.message : "Unknown error"
//         });
//     }
// };

// // Submit worker information (accessible without login)
// export const submitWorkerInfo = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { token, submissionToken } = req.query
//         const { subContractId } = req.params;
//         const workerData: IWorkerInfo = req.body;



//         if (!subContractId) {
//             return res.status(400).json({
//                 ok: false,
//                 message: "SubContract ID is required"
//             });
//         }

//         if (!token) {
//             return res.status(400).json({ ok: false, message: "Token is required" });
//         }


//         // Validate worker data
//         const requiredFields = ['dateOfCommencement', 'dateOfCompletion', 'workerName', 'labourCost', 'materialCost', 'totalCost',];
//         for (const field of requiredFields) {
//             if (!workerData[field as keyof IWorkerInfo]) {
//                 return res.status(400).json({
//                     ok: false,
//                     message: `${field} is required`
//                 });
//             }
//         }

//         // // Validate status
//         // if (!['pending', 'accepted', 'rejected'].includes(workerData.status)) {
//         //     return res.status(400).json({
//         //         ok: false,
//         //         message: "Status must be 'pending', 'accepted', or 'rejected'"
//         //     });
//         // }

//         // Find and update the SubContract
//         const subContract = await SubContractModel.findById(subContractId);

//         if (!subContract) {
//             return res.status(404).json({
//                 ok: false,
//                 message: "SubContract not found"
//             });
//         }

//         const files = req.files as (Express.Multer.File & { location: string })[];

//         // if (!files || files.length === 0) {
//         //     return res.status(400).json({ message: "No files uploaded.", ok: false });
//         // }

//         const filesBeforeWork: IFileItem[] = files?.map(file => {
//             const type: "image" | "pdf" = file.mimetype.startsWith("image") ? "image" : "pdf";
//             return {
//                 _id: new mongoose.Types.ObjectId(),
//                 type,
//                 url: file.location,
//                 originalName: file.originalname,
//                 uploadedAt: new Date()
//             };
//         });

//         const totalCost = Number(workerData.labourCost || 0) + Number(workerData.materialCost || 0) || 0


//         const existingWork = subContract.workerInfo.find(work => work.submissionToken === submissionToken)

//         if (submissionToken && existingWork) {

//             console.log("getting into the updateion part")

//             existingWork.dateOfCommencement = workerData.dateOfCommencement
//             existingWork.dateOfCompletion = workerData.dateOfCompletion
//             existingWork.workerName = workerData.workerName
//             existingWork.labourCost = workerData.labourCost
//             existingWork.materialCost = workerData.materialCost
//             existingWork.totalCost = totalCost
//             existingWork.filesBeforeWork = [...existingWork.filesBeforeWork, ...filesBeforeWork]
//             // existingWork.filesAfterWork = [],
//             // existingWork.status = "pending",
//             existingWork.submissionToken = existingWork.submissionToken


//             await subContract.save();

//             return res.status(200).json({
//                 ok: true,
//                 message: "Worker information updated successfully",
//                 data: existingWork,
//                 token: existingWork.submissionToken
//             });

//         } else {

// console.log("gettinginto the creation part")

//             const tokenSubmission = crypto.randomBytes(12).toString("hex"); // e.g. "b4e7c6faab913ac23d55e4"



//             // Add worker info to the SubContract
//             const newWorkerInfo: IWorkerInfo = {
//                 dateOfCommencement: workerData.dateOfCommencement,
//                 dateOfCompletion: workerData.dateOfCompletion,
//                 workerName: workerData.workerName,
//                 labourCost: workerData.labourCost,
//                 materialCost: workerData.materialCost,
//                 totalCost: totalCost,
//                 filesBeforeWork: filesBeforeWork || [],
//                 filesAfterWork: [],
//                 status: "pending",
//                 submissionToken: tokenSubmission,
//             };

//             // if (Array.isArray(subContract.workerInfo)) {
//             //     subContract.workerInfo.push(newWorkerInfo);
//             // }
//             // else {
//             //     subContract.workerInfo = []
//             //     subContract.workerInfo.push(newWorkerInfo);
//             // }

//             subContract.workerInfo = Array.isArray(subContract.workerInfo)
//                 ? [...subContract.workerInfo, newWorkerInfo]
//                 : [newWorkerInfo];


//             await subContract.save();



//             return res.status(200).json({
//                 ok: true,
//                 message: "Worker information submitted successfully",
//                 data: newWorkerInfo,
//                 token: tokenSubmission
//             });
//         }

//     } catch (error) {
//         console.error("Error submitting worker info:", error);
//         return res.status(500).json({
//             ok: false,
//             message: "Internal server error",
//             error: error instanceof Error ? error.message : "Unknown error"
//         });
//     }
// };



// // Submit worker information (accessible without login)
// export const uploadBeforeWorkInfo = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { submissionToken } = req.query
//         const { subContractId } = req.params;
//         const workerData: IWorkerInfo = req.body;

//         if (!subContractId) {
//             return res.status(400).json({
//                 ok: false,
//                 message: "SubContract ID is required"
//             });
//         }

//         if (!submissionToken) {
//             return res.status(400).json({ ok: false, message: "Submission Token is required" });
//         }




//         // Find and update the SubContract
//         const subContract = await SubContractModel.findById(subContractId);

//         if (!subContract) {
//             return res.status(404).json({
//                 ok: false,
//                 message: "SubContract not found"
//             });
//         }

//         const files = req.files as (Express.Multer.File & { location: string })[];

//         if (!files || files.length === 0) {
//             return res.status(400).json({ message: "No files uploaded.", ok: false });
//         }

//         const filesAfterWork: IFileItem[] = files.map(file => {
//             const type: "image" | "pdf" = file.mimetype.startsWith("image") ? "image" : "pdf";
//             return {
//                 type,
//                 url: file.location,
//                 originalName: file.originalname,
//                 uploadedAt: new Date()
//             };
//         });


//         const workerInfo = subContract.workerInfo.find(() => {
//             return workerData.submissionToken === submissionToken
//         })

//         if (!workerInfo) {
//             return res.status(400).json({ message: "No WorkerInfo found for this submissionToken.", ok: false });
//         }

//         workerInfo.filesBeforeWork = [...workerInfo.filesBeforeWork, ...filesAfterWork]


//         await subContract.save();

//         return res.status(200).json({
//             ok: true,
//             message: "files uploaded successfully in the before work field",
//             data: workerInfo,
//             token: submissionToken
//         });

//     } catch (error) {
//         console.error("Error submitting worker info:", error);
//         return res.status(500).json({
//             ok: false,
//             message: "Internal server error",
//             error: error instanceof Error ? error.message : "Unknown error"
//         });
//     }
// };



// // Submit worker information (accessible without login)
// export const uploadAfterWorkInfo = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { submissionToken } = req.query
//         const { subContractId } = req.params;
//         const workerData: IWorkerInfo = req.body;

//         if (!subContractId) {
//             return res.status(400).json({
//                 ok: false,
//                 message: "SubContract ID is required"
//             });
//         }

//         console.log("submissionToken", submissionToken)
//         if (!submissionToken) {
//             return res.status(400).json({ ok: false, message: "Submission Token is required" });
//         }




//         // Find and update the SubContract
//         const subContract = await SubContractModel.findById(subContractId);

//         if (!subContract) {
//             return res.status(404).json({
//                 ok: false,
//                 message: "SubContract not found"
//             });
//         }

//         const files = req.files as (Express.Multer.File & { location: string })[];

//         if (!files || files.length === 0) {
//             return res.status(400).json({ message: "No files uploaded.", ok: false });
//         }

//         const filesAfterWork: IFileItem[] = files.map(file => {
//             const type: "image" | "pdf" = file.mimetype.startsWith("image") ? "image" : "pdf";
//             return {
//                 type,
//                 url: file.location,
//                 originalName: file.originalname,
//                 uploadedAt: new Date()
//             };
//         });


//         const workerInfo = subContract.workerInfo.find((worker) => {
//             return worker.submissionToken === submissionToken
//         })

//         if (!workerInfo) {
//             return res.status(400).json({ message: "No WorkerInfo found for this submissionToken.", ok: false });
//         }

//         workerInfo.filesAfterWork = [...workerInfo.filesAfterWork, ...filesAfterWork]


//         await subContract.save();

//         return res.status(200).json({
//             ok: true,
//             message: "files uploaded successfully in the after work field",
//             data: workerInfo,
//             token: submissionToken
//         });

//     } catch (error) {
//         console.error("Error submitting worker info:", error);
//         return res.status(500).json({
//             ok: false,
//             message: "Internal server error",
//             error: error instanceof Error ? error.message : "Unknown error"
//         });
//     }
// };



// // // Get SubContract by shareable link (accessible without login)
// // export const getSubContractByShareableLink = async (req: Request, res: Response):Promise<any> => {
// //     try {
// //         const { token } = req.params;
// //         const shareableLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/public/subcontract?token=${token}`;

// //         const subContract = await SubContractModel.findOne({ shrableLink: shareableLink })


// //         if (!subContract) {
// //             return res.status(404).json({
// //                 ok: false,
// //                 message: "Invalid or expired link"
// //             });
// //         }

// //         return res.status(200).json({
// //             ok: true,
// //             data: subContract
// //         });

// //     } catch (error) {
// //         console.error("Error getting SubContract by shareable link:", error);
// //         return res.status(500).json({
// //             ok: false,
// //             message: "Internal server error",
// //             error: error instanceof Error ? error.message : "Unknown error"
// //         });
// //     }
// // };

// // Get all SubContracts by organizationId
// export const getSubContractsByOrganization = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { organizationId } = req.params;
//         const { page = 1, limit = 10, status, projectId } = req.query;

//         if (!organizationId) {
//             return res.status(400).json({
//                 ok: false,
//                 message: "Organization ID is required"
//             });
//         }

//         // Build query
//         const query: any = {
//             organizationId: new Types.ObjectId(organizationId)
//         };

//         if (projectId) {
//             query.projectId = new Types.ObjectId(projectId as string);
//         }

//         // Calculate pagination
//         const skip = (Number(page) - 1) * Number(limit);

//         // Get SubContracts with pagination
//         const subContracts = await SubContractModel
//             .find(query)
//             .populate('workOrderCreatedBy')
//             .sort({ createdAt: -1 })
//             .skip(skip)
//             .limit(Number(limit));

//         // Get total count for pagination
//         const totalCount = await SubContractModel.countDocuments(query);

//         // Filter by worker status if provided
//         let filteredSubContracts: any[] = subContracts;
//         if (status) {
//             filteredSubContracts = subContracts.map(contract => {
//                 const filteredContract = contract.toObject();
//                 filteredContract.workerInfo = contract.workerInfo.filter(
//                     worker => worker.status === status
//                 );
//                 return filteredContract;
//             });
//         }

//         return res.status(200).json({
//             ok: true,
//             data: {
//                 subContracts: filteredSubContracts,
//                 pagination: {
//                     currentPage: Number(page),
//                     totalPages: Math.ceil(totalCount / Number(limit)),
//                     totalItems: totalCount,
//                     itemsPerPage: Number(limit)
//                 }
//             }
//         });

//     } catch (error) {
//         console.error("Error getting SubContracts by organization:", error);
//         return res.status(500).json({
//             ok: false,
//             message: "Internal server error",
//             error: error instanceof Error ? error.message : "Unknown error"
//         });
//     }
// };

// // Get single SubContract by ID
// export const getSubContractById = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { subContractId, workerInfoId } = req.params;

//         if (!subContractId) {
//             return res.status(400).json({
//                 ok: false,
//                 message: "SubContract ID is required"
//             });
//         }

//         const subContract = await SubContractModel
//             .findById(subContractId)
//             .populate('workOrderCreatedBy');


//         if (!subContract) {
//             return res.status(404).json({
//                 ok: false,
//                 message: "SubContract not found"
//             });
//         }

//         const subWorkerInfo = subContract?.workerInfo.find(worker => worker._id?.toString() === workerInfoId)

//         if (!subWorkerInfo) {
//             if (!subContract) {
//                 return res.status(404).json({
//                     ok: false,
//                     message: "SubContract not found"
//                 });
//             }
//         }


//         const data = {
//             _id: subContract._id,
//             organizationId: subContract.organizationId,
//             projectId: subContract.projectId,
//             workOrderCreatedBy: subContract.workOrderCreatedBy,
//             createdBy: subContract.createdAt,
//             updatedAt: subContract.updatedAt,
//             workerInfo: subWorkerInfo
//         }

//         return res.status(200).json({
//             ok: true,
//             data: data
//         });

//     } catch (error) {
//         console.error("Error getting SubContract by ID:", error);
//         return res.status(500).json({
//             ok: false,
//             message: "Internal server error",
//             error: error instanceof Error ? error.message : "Unknown error"
//         });
//     }
// };


// //  used to get the projectId, workname, workcreatedby things 

// export const getSubContractBasicDetails = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { submissionToken } = req.query
//         const { subContractId } = req.params;

//         if (!subContractId) {
//             return res.status(400).json({
//                 ok: false,
//                 message: "SubContract ID is required"
//             });
//         }

//         const subContract = await SubContractModel
//             .findById(subContractId)
//             .populate('workOrderCreatedBy', "-password")
//             .populate("projectId", "_id projectName")



//         if (!subContract) {
//             return res.status(404).json({
//                 ok: false,
//                 message: "SubContract not found"
//             });
//         }

//         let workerInfo: any = {};

//         if (submissionToken) {
//             const matchedWorker = subContract.workerInfo.find(
//                 (work) => work.submissionToken === submissionToken
//             );

//             if (matchedWorker) {
//                 workerInfo = {
//                     workerName: matchedWorker.workerName || null,
//                     dateOfCommencement: matchedWorker.dateOfCommencement || null,
//                     dateOfCompletion: matchedWorker.dateOfCompletion || null,
//                     filesBeforeWork: matchedWorker.filesBeforeWork || null,
//                     filesAfterWork: matchedWorker.filesAfterWork || null,
//                     labourCost: matchedWorker.labourCost || null,
//                     materialCost: matchedWorker.materialCost || null,
//                     totalCost: matchedWorker.totalCost || null,
//                 };
//             }
//         }

//         const data = {
//             _id: subContract._id,
//             organizationId: subContract.organizationId,
//             projectId: subContract.projectId,
//             workOrderCreatedBy: subContract.workOrderCreatedBy,
//             workName: subContract.workName,
//             ...workerInfo
//         }

//         return res.status(200).json({
//             ok: true,
//             data: data
//         });

//     } catch (error) {
//         console.error("Error getting SubContract by ID:", error);
//         return res.status(500).json({
//             ok: false,
//             message: "Internal server error",
//             error: error instanceof Error ? error.message : "Unknown error"
//         });
//     }
// };

// // Update worker status (for authorized users)
// export const updateWorkerStatus = async (req: RoleBasedRequest, res: Response): Promise<any> => {
//     try {
//         const { subContractId, workerId } = req.params;
//         const { status } = req.body;

//         if (!subContractId || !workerId) {
//             return res.status(400).json({
//                 ok: false,
//                 message: "SubContract ID and Worker ID are required"
//             });
//         }

//         if (!['pending', 'accepted', 'rejected'].includes(status)) {
//             return res.status(400).json({
//                 ok: false,
//                 message: "Status must be 'pending', 'accepted', or 'rejected'"
//             });
//         }

//         const subContract = await SubContractModel.findById(subContractId);

//         if (!subContract) {
//             return res.status(404).json({
//                 ok: false,
//                 message: "SubContract not found"
//             });
//         }

//         // Find and update the worker info
//         const workerIndex = subContract.workerInfo.findIndex(
//             worker => worker._id?.toString() === workerId
//         );

//         if (workerIndex === -1) {
//             return res.status(404).json({
//                 ok: false,
//                 message: "Worker not found in this SubContract"
//             });
//         }

//         subContract.workerInfo[workerIndex].status = status;

//         if (status === "rejected") {
//             subContract.workerInfo.splice(workerIndex, 1)
//         }

//         const formDate = await subContract.save();


//         // const acceptedWorkers = formDate.workerInfo.filter(work => work.status === "accepted")

//         const workToAccountant = subContract.workerInfo[workerIndex]

//         if (status === "accepted") {
//             const transactionNumber = await generateTransactionNumber(subContract.organizationId);

//             await AccountingModel.create({
//                 organizationId: subContract.organizationId,
//                 projectId: subContract.projectId,
//                 transactionNumber: transactionNumber,
//                 transactionType: "expense",
//                 totalAmount: {
//                     amount: workToAccountant.totalCost,
//                     taxAmount: 0
//                 },
//                 status: "pending",
//             })
//         }


//         return res.status(200).json({
//             ok: true,
//             message: `Worker status updated to ${status}`,
//             data: workToAccountant
//         });

//     } catch (error) {
//         console.error("Error updating worker status:", error);
//         return res.status(500).json({
//             ok: false,
//             message: "Internal server error",
//             error: error instanceof Error ? error.message : "Unknown error"
//         });
//     }
// };

// // Delete SubContract (for authorized users)
// export const deleteSubContract = async (req: RoleBasedRequest, res: Response): Promise<any> => {
//     try {
//         const { subContractId } = req.params;

//         if (!subContractId) {
//             return res.status(400).json({
//                 ok: false,
//                 message: "SubContract ID is required"
//             });
//         }

//         const deletedSubContract = await SubContractModel.findByIdAndDelete(subContractId);

//         if (!deletedSubContract) {
//             return res.status(404).json({
//                 ok: false,
//                 message: "SubContract not found"
//             });
//         }

//         return res.status(200).json({
//             ok: true,
//             message: "SubContract deleted successfully",
//             data: deletedSubContract
//         });

//     } catch (error) {
//         console.error("Error deleting SubContract:", error);
//         return res.status(500).json({
//             ok: false,
//             message: "Internal server error",
//             error: error instanceof Error ? error.message : "Unknown error"
//         });
//     }
// };



// export const deleteWorkerInfo = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { subContractId, workId } = req.params;
//         // const { submissionToken } = req.query;

//         if (!subContractId) {
//             return res.status(400).json({
//                 ok: false,
//                 message: "SubContract ID is required"
//             });
//         }

//         // if (!submissionToken) {
//         //     return res.status(400).json({
//         //         ok: false,
//         //         message: "Submission token is required"
//         //     });
//         // }

//         // Find the SubContract
//         const subContract = await SubContractModel.findById(subContractId);

//         if (!subContract) {
//             return res.status(404).json({
//                 ok: false,
//                 message: "SubContract not found"
//             });
//         }

//         const originalLength = subContract.workerInfo.length;

//         // Filter out the workerInfo to delete
//         subContract.workerInfo = subContract.workerInfo.filter(
//             work => work?._id?.toString() !== workId
//         );

//         if (subContract.workerInfo.length === originalLength) {
//             return res.status(404).json({
//                 ok: false,
//                 message: "No worker info found for this submission token"
//             });
//         }

//         await subContract.save();

//         return res.status(200).json({
//             ok: true,
//             message: "Worker info deleted successfully",
//             data: subContract.workerInfo
//         });

//     } catch (error) {
//         console.error("Error deleting worker info:", error);
//         return res.status(500).json({
//             ok: false,
//             message: "Internal server error",
//             error: error instanceof Error ? error.message : "Unknown error"
//         });
//     }
// };

