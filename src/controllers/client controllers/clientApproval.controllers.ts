import { Response } from "express";
import { AuthenticatedClientRequest } from "../../types/types";
import ProjectModel from "../../models/project.model";
import { LabourListModel } from "../../models/labour models/labourList.model";
import MaterialListModel from "../../models/Material Estimate Model/materialList.model";
import { MaterialApprovalModel } from "../../models/client model/materialApproval.model";
import { LabourApprovalModel } from "../../models/client model/labourApproval.model";
import MaterialEstimateModel from "../../models/Material Estimate Model/materialEstimate.model";
import { Types } from "mongoose";

const getAccessedProjects = async (req: AuthenticatedClientRequest, res: Response) => {
    try {
        const client = req.client

        const projects = await ProjectModel.find({ accessibleClientId: { $in: client._id } })

        res.status(200).json({ message: "accessed projects retrived", ok: true, data: projects })
    }
    catch (error) {
        console.log("error form getProjects", error)
         res.status(500).json({ message: 'Server error. Please try again later.', errorMessage: error, error: true, ok: false });
        return
    }
}


const getProjectDetailsdummy = async (req: AuthenticatedClientRequest, res: Response) => {
    try {

        const { projectId } = req.params
        const client = req.client

        if (!projectId) {
            res.status(400).json({ message: "projectId is missing", ok: false })
            return;
        }


        const projectDetails = await ProjectModel.findOne({
            _id: projectId,
            accessibleClientId: { $in: client._id },
        })
            // Populate Materials
            .populate({
                path: "materials", // MaterialListModel
                populate: {
                    path: "materials", // MaterialEstimateModel
                    model: "MaterialEstimateModel",
                },
            })
            // Populate Labours
            .populate({
                path: "labours", // LabourListModel
                populate: {
                    path: "labours", // LabourEstimateModel
                    model: "LabourEstimateModel",
                },
            });

        if (!projectDetails) {
            return res.status(404).json({ message: "Project not found or access denied", ok: false });
        }

        res.status(200).json({ message: "Project details retrieved", ok: true, data: projectDetails });

    }
    catch (error) {
        console.log("error form getProjects", error)
        return res.status(500).json({ message: 'Server error. Please try again later.', errorMessage: error, error: true, ok: false });
    }
}

const getProjectDetails = async (req: AuthenticatedClientRequest, res: Response) => {
    try {
        const { projectId } = req.params
        const client = req.client

        if (!projectId) {
            res.status(400).json({ message: "projectId is missing", ok: false })
            return;
        }


        const [materialList, labourList] = await Promise.all([
            MaterialListModel.findOne({ projectId }).populate("materials"),
            LabourListModel.findOne({ projectId }).populate("labours"),
        ]);

        if (!materialList || !labourList) {
            return res.status(404).json({ message: "Material or labour list not found", ok: false });
        }

        // Get material and labour approval documents
        const [materialApprovalDoc, labourApprovalDoc] = await Promise.all([
            MaterialApprovalModel.findOne({ projectId, clientId: client._id }),
            LabourApprovalModel.findOne({ projectId, clientId: client._id }),
        ]);

        // Simplify approvals into maps for easy checking
        const approvedMaterialsMap: any = {};
        materialApprovalDoc?.approvedItems?.forEach(item => {
            approvedMaterialsMap[item.materialItemId.toString()] = {
                approved: item.approved,
                feedback: item.feedback,
            };
        });

        const approvedLaboursMap: any = {};
        labourApprovalDoc?.approvedItems?.forEach((item) => {
            approvedLaboursMap[item.labourItemId.toString()] = {
                approved: item.approved,
                feedback: item.feedback,
            };
        });

        // Attach approval status to each item
        const materialItemsWithStatus: any = materialList.materials.map((item: any) => ({
            ...item.toObject(),
            approval: approvedMaterialsMap[item._id.toString()] || null,
        }));

        const labourItemsWithStatus = labourList.labours.map((item: any) => ({
            ...item.toObject(),
            approval: approvedLaboursMap[item._id.toString()] || null,
        }));

        return res.status(200).json({
            ok: true,
            message: "Project details fetched",
            data: {
                materialList: { ...materialList.toObject(), materials: materialItemsWithStatus },
                labourList: { ...labourList.toObject(), labours: labourItemsWithStatus },
            },
        });

    }
    catch (error) {
        console.log("error form getProjects", error)
        return res.status(500).json({ message: 'Server error. Please try again later.', errorMessage: error, error: true, ok: false });
    }
}

const updateMaterialStatus = async (req: AuthenticatedClientRequest, res: Response) => {
    try {
        const { materialListId, materialItemId, projectId } = req.params;
        const { approved, feedback } = req.body;

        if (!materialListId || !materialItemId || projectId) {
            res.status(400).json({ message: "MaterialList Id and MaterialItem Id is required", ok: false })
            return;
        }

        if (approved && !["approved", "pending", "rejected"].includes(approved)) {
             res.status(400).json({ message: "Invalid approval status", ok: false });
             return
        }

        // Confirm the materialItem exists
        const materialEstimate = await MaterialEstimateModel.findOne({ materialListId });
        if (!materialEstimate) {
             res.status(404).json({ message: "MaterialEstimate not found for this MaterialList", ok: false });
             return
        }

        const materialItemExists = materialEstimate.materials.some((item: any) => item._id.toString() === materialItemId);

        if (!materialItemExists) {
             res.status(404).json({ message: "MaterialItem not found in MaterialEstimate", ok: false });
             return
        }

        // Get clientId and projectId from the authenticated user or request body/context
        const clientId = req.client?._id; // Adjust as per your auth system

        let materialApproval = await MaterialApprovalModel.findOne({ materialListId });

        if (!materialApproval) {
            materialApproval = new MaterialApprovalModel({
                clientId,
                projectId,
                materialListId,
                approvedItems: [],
            });
        }

        // Update or insert the item in approvedItems array
        const existingIndex = materialApproval.approvedItems.findIndex(
            (item) => item.materialItemId.toString() === materialItemId
        );

        if (existingIndex !== -1) {
            // Update existing item and it will preserve the db data if either one of them is not provided and ("pending" is falsy value)
            if (approved) materialApproval.approvedItems[existingIndex].approved = approved;
            if (feedback !== undefined) materialApproval.approvedItems[existingIndex].feedback = feedback;
        } else {
            // Add new item
            materialApproval.approvedItems.push({
                materialItemId: new Types.ObjectId(materialItemId),
                approved: approved || "pending",
                feedback: feedback || null,
            });
        }

        // Recalculate approvalStatus after change
        const totalItems = materialEstimate.materials.length;
        const approvedItems = materialApproval.approvedItems;

        const statusCounts = {
            approved: 0,
            pending: 0,
            rejected: 0,
        };

        for (const item of approvedItems) {
            if (item.approved === 'approved') statusCounts.approved++;
            else if (item.approved === 'rejected') statusCounts.rejected++;
            else statusCounts.pending++;
        }

        // Default to "pending"
        let newStatus: 'pending' | 'approved' | 'rejected' = 'pending';

        if (statusCounts.approved === totalItems) {
            newStatus = 'approved';
        } else if (statusCounts.rejected === totalItems) {
            newStatus = 'rejected';
        }

        materialApproval.approvalStatus = newStatus;
        materialApproval.approvedAt = newStatus === 'approved' ? new Date() : null;
        await materialApproval.save();


         res.status(200).json({ message: "Material item status updated", ok: true });
         return


    }
    catch (error) {
        console.log("error form update material status", error)
         res.status(500).json({ message: 'Server error. Please try again later.', errorMessage: error, error: true, ok: false });
         return;
    }
}

const updateMaterialListStatusDummy = async (req: AuthenticatedClientRequest, res: Response) => {
    try {
        const { materialListId, projectId } = req.params;
        const { approvalStatus } = req.body;
        const client = req.client

        if (!materialListId || !projectId) {
            res.status(400).json({ message: "MaterialList Id, projectId is required", ok: false })
            return;
        }

        if (approvalStatus && !["approved", "pending", "rejected"].includes(approvalStatus)) {
            return res.status(400).json({ message: "Invalid approval status", ok: false });
        }

        const materialApproval = await MaterialApprovalModel.findOne({ clientId: client._id, projectId, materialListId })

        if (!materialApproval) {
            res.status(404).json({ message: "MaterialList not found", ok: false });
            return
        }

        materialApproval.approvalStatus = approvalStatus

        if (approvalStatus === "approved") {
            materialApproval.approvedAt = new Date()
        }
        else {
            materialApproval.approvedAt = null;
        }


        if (approvalStatus !== 'pending' && materialApproval.approvedItems.length) {
            materialApproval.approvedItems.forEach(item => {
                item.approved = approvalStatus
            })
        }

        await materialApproval.save()
        res.status(200).json({ message: "materail list has approved and all the items inside is also approved", ok: true, data: materialApproval })

    }
    catch (error) {
        console.log("error form update material status", error)
        return res.status(500).json({ message: 'Server error. Please try again later.', errorMessage: error, error: true, ok: false });
    }
}

// chant GPt version of this api updateMaterialListStatus (use thsi if mine is not working)
const updateMaterialListStatus = async (req: AuthenticatedClientRequest, res: Response) => {
    try {
        const { materialListId, projectId } = req.params;
        const { status } = req.body;

        if (!materialListId || !projectId) {
             res.status(400).json({ message: "MaterialList Id and Project Id are required", ok: false });
             return
        }

        if (!["approved", "pending", "rejected"].includes(status)) {
             res.status(400).json({ message: "Invalid approval status", ok: false });
             return
        }

        const clientId = req.client?._id;

        // Get the material estimate for the list
        const materialEstimate = await MaterialEstimateModel.findOne({ materialListId });

        if (!materialEstimate) {
             res.status(404).json({ message: "MaterialEstimate not found for this list", ok: false });
             return
        }

        // Fetch or create MaterialApproval
        let materialApproval = await MaterialApprovalModel.findOne({ materialListId, projectId, clientId });

        if (!materialApproval) {
            materialApproval = new MaterialApprovalModel({
                materialListId,
                projectId,
                clientId,
                approvedItems: [],
            });
        }


        // Replace approvedItems with the new status
        const updatedItems = materialEstimate.materials.map((item: any) => {
            const existingItem = materialApproval.approvedItems.find(
                (approvedItem) => approvedItem.materialItemId.toString() === item._id.toString()
            );

            return {
                materialItemId: item._id,
                approved: status,
                feedback: existingItem?.feedback ?? null, // ✅ Preserve old feedback if exists
            };
        });

        materialApproval.approvedItems = updatedItems;
        materialApproval.approvalStatus = status;
        materialApproval.approvedAt = status === "approved" ? new Date() : null;

        await materialApproval.save();

         res.status(200).json({
            message: `Material list marked as ${status} successfully`,
            ok: true,
            data: materialApproval
        });
        return

    } catch (error) {
        console.log("Error in updateMaterialListApprovalStatus", error);
        return res.status(500).json({ message: "Server error", errorMessage: error, error: true, ok: false });
        return
    }
};


export {
    getAccessedProjects,
    getProjectDetails,
    updateMaterialStatus,
    updateMaterialListStatus
}