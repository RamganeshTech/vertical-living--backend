import { getModelNameByRole } from "../../utils/common features/utils";

import { Request, Response } from "express";
// import { SubContractModel, IWorkerInfo } from "../models/SubContract";
import mongoose, { Types } from "mongoose";
import crypto from "crypto";
import { RoleBasedRequest } from "../../types/types";
import { SubContractModel, IFileItem } from "../../models/SubContract Model/subContract.model";
import { AccountingModel } from "../../models/Department Models/Accounting Model/accountingMain.model";
import { generateTransactionNumber } from "../Department controllers/Accounting Controller/accounting.controller";
import dotenv from "dotenv"
dotenv.config()

// Create a new SubContract (for logged-in users)
export const createSubContract = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { organizationId, projectId,
            workName,
            dateOfCommencement,
            dateOfCompletion,
            workerName,
            labourCost,
            materialCost,
        } = req.body;


        // existingWork.filesAfterWork = [],
        // existingWork.status = "pending",



        if (!req.user) {
            return res.status(401).json({
                ok: false,
                message: "User not authenticated"
            });
        }

        // Validate required fields
        if (!organizationId || !projectId || !workName) {
            return res.status(400).json({
                ok: false,
                message: "organizationId, projectId, and workName are required"
            });
        }

        // Get the model name based on user role
        const modelName = getModelNameByRole(req.user.role);
        const totalCost = Number(labourCost || 0) + Number(materialCost || 0) || 0


        const files = req.files as (Express.Multer.File & { location: string })[];

        // if (!files || files.length === 0) {
        //     return res.status(400).json({ message: "No files uploaded.", ok: false });
        // }

        const filesBeforeWork: IFileItem[] = files?.map(file => {
            const type: "image" | "pdf" = file.mimetype.startsWith("image") ? "image" : "pdf";
            return {
                _id: new mongoose.Types.ObjectId(),
                type,
                url: file.location,
                originalName: file.originalname,
                uploadedAt: new Date()
            };
        });



        console.log("files before work", filesBeforeWork)
        const uniqueToken = crypto.randomBytes(32).toString('hex');


        // Create new SubContract
        const newSubContract = new SubContractModel({
            organizationId: new Types.ObjectId(organizationId),
            projectId: new Types.ObjectId(projectId),
            workName: workName || null,
            workOrderCreatedBy: new Types.ObjectId(req.user._id),
            workOrderCreatedByModel: modelName,
            token: uniqueToken,
            dateOfCommencement: dateOfCommencement || null,
            dateOfCompletion: dateOfCompletion || null,
            workerName: workerName || null,
            labourCost: labourCost || 0,
            materialCost: materialCost || 0,
            totalCost,
            status: "pending",
            filesBeforeWork: filesBeforeWork || [],
            filesAfterWork: []
        });

        await newSubContract.save();

        return res.status(201).json({
            ok: true,
            message: "SubContract created successfully",
            data: {
                subContract: newSubContract,
                formId: newSubContract._id,
                token: newSubContract.token
            }

        });

    } catch (error) {
        console.error("Error creating SubContract:", error);
        return res.status(500).json({
            ok: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};



export const updateSubContract = async (req: Request, res: Response): Promise<any> => {
    try {
        const { subContractId } = req.params;
        const { workerData } = req.body;

        if (!subContractId) {
            return res.status(400).json({
                ok: false,
                message: "SubContract ID is required"
            });
        }

        // Validate worker data
        const requiredFields = ['projectId', 'dateOfCommencement', 'dateOfCompletion', 'workerName', 'labourCost', 'materialCost', 'totalCost', 'workName'];
        for (const field of requiredFields) {
            if (!workerData[field as string]) {
                return res.status(400).json({
                    ok: false,
                    message: `${field} is required`
                });
            }
        }

        // // Validate status
        // if (!['pending', 'accepted', 'rejected'].includes(workerData.status)) {
        //     return res.status(400).json({
        //         ok: false,
        //         message: "Status must be 'pending', 'accepted', or 'rejected'"
        //     });
        // }

        // Find and update the SubContract
        const subContract = await SubContractModel.findById(subContractId);

        if (!subContract) {
            return res.status(404).json({
                ok: false,
                message: "SubContract not found"
            });
        }



        const totalCost = Number(workerData.labourCost || 0) + Number(workerData.materialCost || 0) || 0


        console.log("getting into the updateion part")

        subContract.projectId = workerData.projectId
        subContract.dateOfCommencement = workerData.dateOfCommencement
        subContract.dateOfCompletion = workerData.dateOfCompletion
        subContract.workerName = workerData.workerName
        subContract.workName = workerData.workName
        subContract.labourCost = workerData.labourCost
        subContract.materialCost = workerData.materialCost
        subContract.totalCost = totalCost


        await subContract.save();

        return res.status(200).json({
            ok: true,
            message: "Worker information updated successfully",
            data: subContract,
            token: subContract.token
        });



    } catch (error) {
        console.error("Error submitting worker info:", error);
        return res.status(500).json({
            ok: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};


// Generate shareable link for a SubContract
export const generateShareableLink = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { subContractId } = req.params;

        if (!subContractId) {
            return res.status(400).json({
                ok: false,
                message: "SubContract ID is required"
            });
        }

        // Find the SubContract
        const subContract = await SubContractModel.findById(subContractId);

        if (!subContract) {
            return res.status(404).json({
                ok: false,
                message: "SubContract not found"
            });
        }

        // Generate unique shareable link
        const uniqueToken = crypto.randomBytes(32).toString('hex');
        // const shareableLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subcontract/share/${uniqueToken}`;
        const token = uniqueToken


        // Update the SubContract with the shareable link
        subContract.token = token;
        await subContract.save();

        return res.status(200).json({
            ok: true,
            message: "Shareable link generated successfully",
            data: {
                shareableLink: token,
                subContractId: subContract._id
            }
        });

    } catch (error) {
        console.error("Error generating shareable link:", error);
        return res.status(500).json({
            ok: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

// Submit worker information (accessible without login)
export const submitWorkerInfo = async (req: Request, res: Response): Promise<any> => {
    try {
        const { token } = req.query
        const { subContractId } = req.params;
        const workerData = req.body;



        if (!subContractId) {
            return res.status(400).json({
                ok: false,
                message: "SubContract ID is required"
            });
        }

        if (!token) {
            return res.status(400).json({ ok: false, message: "Token is required" });
        }


        // Validate worker data
        const requiredFields = ['dateOfCommencement', 'dateOfCompletion', 'workerName', 'labourCost', 'materialCost', 'totalCost',];
        for (const field of requiredFields) {
            if (!workerData[field as string]) {
                return res.status(400).json({
                    ok: false,
                    message: `${field} is required`
                });
            }
        }

        // // Validate status
        // if (!['pending', 'accepted', 'rejected'].includes(workerData.status)) {
        //     return res.status(400).json({
        //         ok: false,
        //         message: "Status must be 'pending', 'accepted', or 'rejected'"
        //     });
        // }

        // Find and update the SubContract
        const subContract = await SubContractModel.findById(subContractId);

        if (!subContract) {
            return res.status(404).json({
                ok: false,
                message: "SubContract not found"
            });
        }




        const files = req.files as (Express.Multer.File & { location: string })[];

        // if (!files || files.length === 0) {
        //     return res.status(400).json({ message: "No files uploaded.", ok: false });
        // }

        const filesBeforeWork: IFileItem[] = files?.map(file => {
            const type: "image" | "pdf" = file.mimetype.startsWith("image") ? "image" : "pdf";
            return {
                _id: new mongoose.Types.ObjectId(),
                type,
                url: file.location,
                originalName: file.originalname,
                uploadedAt: new Date()
            };
        });

        const totalCost = Number(workerData.labourCost || 0) + Number(workerData.materialCost || 0) || 0


        console.log("getting into the updateion part")


        if (subContract?.status !== "accepted") {
            subContract.dateOfCommencement = workerData.dateOfCommencement
            subContract.dateOfCompletion = workerData.dateOfCompletion
            subContract.workerName = workerData.workerName
            subContract.labourCost = workerData.labourCost
            subContract.materialCost = workerData.materialCost
            subContract.totalCost = totalCost
        }



        subContract.filesBeforeWork = [...subContract.filesBeforeWork, ...filesBeforeWork]
        // subContract.filesAfterWork = [],
        // subContract.status = "pending",


        await subContract.save();

        return res.status(200).json({
            ok: true,
            message: "Worker information updated successfully",
            data: subContract,
            token: subContract.token
        });



    } catch (error) {
        console.error("Error submitting worker info:", error);
        return res.status(500).json({
            ok: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};



// Submit worker information (accessible without login)
export const uploadBeforeWorkInfo = async (req: Request, res: Response): Promise<any> => {
    try {
        const { subContractId } = req.params;

        if (!subContractId) {
            return res.status(400).json({
                ok: false,
                message: "SubContract ID is required"
            });
        }

        // Find and update the SubContract
        const subContract = await SubContractModel.findById(subContractId);

        if (!subContract) {
            return res.status(404).json({
                ok: false,
                message: "SubContract not found"
            });
        }

        const files = req.files as (Express.Multer.File & { location: string })[];

        if (!files || files.length === 0) {
            return res.status(400).json({ message: "No files uploaded.", ok: false });
        }

        const filesBeforeWork: IFileItem[] = files.map(file => {
            const type: "image" | "pdf" = file.mimetype.startsWith("image") ? "image" : "pdf";
            return {
                type,
                url: file.location,
                originalName: file.originalname,
                uploadedAt: new Date()
            };
        });

        subContract.filesBeforeWork = [...subContract.filesBeforeWork, ...filesBeforeWork]

        await subContract.save();

        return res.status(200).json({
            ok: true,
            message: "files uploaded successfully in the before work field",
            data: subContract,
        });

    } catch (error) {
        console.error("Error submitting worker info:", error);
        return res.status(500).json({
            ok: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};



// Submit worker information (accessible without login)
export const uploadAfterWorkInfo = async (req: Request, res: Response): Promise<any> => {
    try {
        const { subContractId } = req.params;
        const workerData = req.body;

        if (!subContractId) {
            return res.status(400).json({
                ok: false,
                message: "SubContract ID is required"
            });
        }



        // Find and update the SubContract
        const subContract = await SubContractModel.findById(subContractId);

        if (!subContract) {
            return res.status(404).json({
                ok: false,
                message: "SubContract not found"
            });
        }


        const isCorrectStatus = ["pending", "rejected"].includes(subContract.status)

        if (isCorrectStatus && !subContract.workerName) {
            return res.status(400).json({
                ok: false,
                message: "worker Name is not filled, please fill the left column and then upload the files for after work section"
            });
        }

        const files = req.files as (Express.Multer.File & { location: string })[];

        if (!files || files.length === 0) {
            return res.status(400).json({ message: "No files uploaded.", ok: false });
        }

        const filesAfterWork: IFileItem[] = files.map(file => {
            const type: "image" | "pdf" = file.mimetype.startsWith("image") ? "image" : "pdf";
            return {
                type,
                url: file.location,
                originalName: file.originalname,
                uploadedAt: new Date()
            };
        });




        subContract.filesAfterWork = [...subContract.filesAfterWork, ...filesAfterWork]


        await subContract.save();

        return res.status(200).json({
            ok: true,
            message: "files uploaded successfully in the after work field",
            data: subContract,
        });

    } catch (error) {
        console.error("Error submitting worker info:", error);
        return res.status(500).json({
            ok: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

export const getSubContractsByOrganization = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.params;
        const { page = 1, limit = 10,

            status, projectId, search = "",


            labourCostMin,
            labourCostMax,
            materialCostMin,
            materialCostMax,
            totalCostMin,
            totalCostMax,

            dateOfCommencementFrom,
            dateOfCommencementTo,
            dateOfCompletionFrom,
            dateOfCompletionTo,


        } = req.query;

        if (!organizationId) {
            return res.status(400).json({
                ok: false,
                message: "Organization ID is required"
            });
        }

        // Build query
        const query: any = {
            organizationId: new Types.ObjectId(organizationId)
        };

        if (projectId) {
            query.projectId = new Types.ObjectId(projectId as string);
        }

        if (status) {
            query.status = status
        }


        if (search && typeof search === 'string' && search.trim() !== '') {
            query.$or = [
                { workerName: new RegExp(search, "i") },
                { workName: new RegExp(search, "i") },
            ];
        }



        // Cost Filters
        if (labourCostMin || labourCostMax) {
            query.labourCost = {};
            if (labourCostMin) query.labourCost.$gte = Number(labourCostMin);
            if (labourCostMax) query.labourCost.$lte = Number(labourCostMax);
        }

        if (materialCostMin || materialCostMax) {
            query.materialCost = {};
            if (materialCostMin) query.materialCost.$gte = Number(materialCostMin);
            if (materialCostMax) query.materialCost.$lte = Number(materialCostMax);
        }

        if (totalCostMin || totalCostMax) {
            query.totalCost = {};
            if (totalCostMin) query.totalCost.$gte = Number(totalCostMin);
            if (totalCostMax) query.totalCost.$lte = Number(totalCostMax);
        }

        // Date Filters


        if (dateOfCommencementFrom || dateOfCommencementTo) {
            const filterRange: any = {};

            if (dateOfCommencementFrom) {
                const from = new Date(dateOfCommencementFrom as string);
                if (isNaN(from.getTime())) {
                    res.status(400).json({
                        ok: false,
                        message: "Invalid dateOfCommencementFrom format. Use ISO string (e.g. 2025-10-23)."
                    });
                    return;
                }
                from.setHours(0, 0, 0, 0);
                filterRange.$gte = from;
            }

            if (dateOfCommencementTo) {
                const to = new Date(dateOfCommencementTo as string);
                if (isNaN(to.getTime())) {
                    res.status(400).json({
                        ok: false,
                        message: "Invalid dateOfCommencementTo format. Use ISO string (e.g. 2025-10-23)."
                    });
                    return;
                }
                to.setHours(23, 59, 59, 999);
                filterRange.$lte = to;
            }

            query.dateOfCommencement = filterRange;
        }



        if (dateOfCompletionFrom || dateOfCompletionTo) {
            const filterRange: any = {};

            if (dateOfCompletionFrom) {
                const from = new Date(dateOfCompletionFrom as string);
                if (isNaN(from.getTime())) {
                    res.status(400).json({
                        ok: false,
                        message: "Invalid dateOfCompletionFrom format. Use ISO string (e.g. 2025-10-23)."
                    });
                    return;
                }
                from.setHours(0, 0, 0, 0);
                filterRange.$gte = from;
            }

            if (dateOfCompletionTo) {
                const to = new Date(dateOfCompletionTo as string);
                if (isNaN(to.getTime())) {
                    res.status(400).json({
                        ok: false,
                        message: "Invalid dateOfCompletionTo format. Use ISO string (e.g. 2025-10-23)."
                    });
                    return;
                }
                to.setHours(23, 59, 59, 999);
                filterRange.$lte = to;
            }

            query.dateOfCompletionTo = filterRange;
        }

        // Calculate pagination
        const skip = (Number(page) - 1) * Number(limit);

        // Get SubContracts with pagination
        const subContracts = await SubContractModel
            .find(query)
            .populate('workOrderCreatedBy')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        // Get total count for pagination
        const totalCount = await SubContractModel.countDocuments(query);



        return res.status(200).json({
            ok: true,
            data: {
                subContracts: subContracts,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(totalCount / Number(limit)),
                    totalItems: totalCount,
                    itemsPerPage: Number(limit)
                }
            }
        });

    } catch (error) {
        console.error("Error getting SubContracts by organization:", error);
        return res.status(500).json({
            ok: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

// Get single SubContract by ID
export const getSubContractById = async (req: Request, res: Response): Promise<any> => {
    try {
        const { subContractId } = req.params;

        if (!subContractId) {
            return res.status(400).json({
                ok: false,
                message: "SubContract ID is required"
            });
        }

        const subContract = await SubContractModel
            .findById(subContractId)
            .populate('workOrderCreatedBy', "-password -phoneNo")
            .populate("projectId", "_id projectName")


        if (!subContract) {
            return res.status(404).json({
                ok: false,
                message: "SubContract not found"
            });
        }

        return res.status(200).json({
            ok: true,
            data: subContract
        });

    } catch (error) {
        console.error("Error getting SubContract by ID:", error);
        return res.status(500).json({
            ok: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};


//  used to get the projectId, workname, workcreatedby things 

export const getSubContractBasicDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { subContractId } = req.params;

        if (!subContractId) {
            return res.status(400).json({
                ok: false,
                message: "SubContract ID is required"
            });
        }

        const subContract = await SubContractModel
            .findById(subContractId)
            .populate('workOrderCreatedBy', "-password")
            .populate("projectId", "_id projectName")



        if (!subContract) {
            return res.status(404).json({
                ok: false,
                message: "SubContract not found"
            });
        }


        return res.status(200).json({
            ok: true,
            data: subContract
        });

    } catch (error) {
        console.error("Error getting SubContract by ID:", error);
        return res.status(500).json({
            ok: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

// Update worker status (for authorized users)
export const updateWorkerStatus = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { subContractId } = req.params;
        const { status } = req.body;

        if (!subContractId) {
            return res.status(400).json({
                ok: false,
                message: "SubContract ID are required"
            });
        }

        if (!['pending', 'accepted', 'rejected'].includes(status)) {
            return res.status(400).json({
                ok: false,
                message: "Status must be 'pending', 'accepted', or 'rejected'"
            });
        }

        let subContract = await SubContractModel.findById(subContractId);

        if (!subContract) {
            return res.status(404).json({
                ok: false,
                message: "SubContract not found"
            });
        }


        if (subContract.status === "accepted" && status === "accepted") {
            return res.status(400).json({
                ok: true,
                message: "Already Accepted"
            });
        }


        // Find and update the worker info

        subContract.status = status;
        await subContract.save()
        // if (status === "rejected") {
        //     subContract = await SubContractModel.findByIdAndDelete(subContractId)
        // }


        if (!subContract) {
            return res.status(404).json({
                ok: false,
                message: "SubContract not found, status not updated"
            });
        }


        // const acceptedWorkers = formDate.workerInfo.filter(work => work.status === "accepted")

        if (status === "accepted") {
            const existingAccounting = await AccountingModel.findOne({
                referenceId: subContract._id
            });

            if (!existingAccounting) {
                const transactionNumber = await generateTransactionNumber(subContract.organizationId);

                await AccountingModel.create({                    
                    organizationId: subContract.organizationId,
                    projectId: subContract.projectId,
                    recordNumber: transactionNumber,
                    deptRecordFrom: "Sub Contract",
                    referenceModel: "SubContractModel",
                    referenceId: subContract._id,
                    amount: subContract?.totalCost || 0,
                    // totalAmount: {
                    //     amount: subContract?.totalCost,
                    //     taxAmount: 0
                    // },
                    // status: "pending",
                })

                // await createAccountingEntry({
                //     organizationId: (subContract as any).organizationId,
                //     projectId: (subContract as any).projectId,
                //     fromDept: "hr",
                //     subContractId: (subContract as any)._id,
                //     totalCost: subContract.totalCost,
                //     // installMents: (subContract as any)?.installMents || []
                // })
            }
        }


        return res.status(200).json({
            ok: true,
            message: `Worker status updated to ${status}`,
            data: subContract
        });

    } catch (error) {
        console.error("Error updating worker status:", error);
        return res.status(500).json({
            ok: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

// Delete SubContract (for authorized users)
export const deleteSubContract = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { subContractId } = req.params;

        if (!subContractId) {
            return res.status(400).json({
                ok: false,
                message: "SubContract ID is required"
            });
        }

        const deletedSubContract = await SubContractModel.findByIdAndDelete(subContractId);

        if (!deletedSubContract) {
            return res.status(404).json({
                ok: false,
                message: "SubContract not found"
            });
        }

        return res.status(200).json({
            ok: true,
            message: "SubContract deleted successfully",
            data: deletedSubContract
        });

    } catch (error) {
        console.error("Error deleting SubContract:", error);
        return res.status(500).json({
            ok: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};


//  NOT USED 
export const deleteWorkerInfo = async (req: Request, res: Response): Promise<any> => {
    try {
        const { subContractId } = req.params;
        // const { submissionToken } = req.query;

        if (!subContractId) {
            return res.status(400).json({
                ok: false,
                message: "SubContract ID is required"
            });
        }

        // if (!submissionToken) {
        //     return res.status(400).json({
        //         ok: false,
        //         message: "Submission token is required"
        //     });
        // }

        // Find the SubContract
        const subContract = await SubContractModel.findByIdAndDelete(subContractId);

        if (!subContract) {
            return res.status(404).json({
                ok: false,
                message: "SubContract not found"
            });
        }

        await subContract.save();

        return res.status(200).json({
            ok: true,
            message: "Worker info deleted successfully",
            data: subContract
        });

    } catch (error) {
        console.error("Error deleting worker info:", error);
        return res.status(500).json({
            ok: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

