import { Response } from "express";
import { AuthenticatedClientRequest } from "../../types/types";
import ProjectModel from "../../models/project.model";
import { LabourListModel } from "../../models/labour models/labourList.model";
import MaterialListModel from "../../models/Material Estimate Model/materialList.model";
import { MaterialApprovalModel } from "../../models/client model/materialApproval.model";
import { LabourApprovalModel } from "../../models/client model/labourApproval.model";

const getAccessedProjects = async (req: AuthenticatedClientRequest, res: Response) => {
    try {
        const client = req.client

        const projects = await ProjectModel.find({ accessibleClientId: { $in: client._id } })

        res.status(200).json({ message: "accessed projects retrived", ok: true, data: projects })
    }
    catch (error) {
        console.log("error form getProjects", error)
        return res.status(500).json({ message: 'Server error. Please try again later.', errorMessage: error, error: true, ok: false });
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
        const approvedMaterialsMap:any = {};
        materialApprovalDoc?.approvedItems?.forEach(item => {
            approvedMaterialsMap[item.materialItemId.toString()] = {
                approved: item.approved,
                feedback: item.feedback,
            };
        });

        const approvedLaboursMap:any = {};
        labourApprovalDoc?.approvedItems?.forEach((item) => {
            approvedLaboursMap[item.labourItemId.toString()] = {
                approved: item.approved,
                feedback: item.feedback,
            };
        });

        // Attach approval status to each item
        const materialItemsWithStatus:any = materialList.materials.map((item:any) => ({
            ...item.toObject(),
            approval: approvedMaterialsMap[item._id.toString()] || null,
        }));

        const labourItemsWithStatus = labourList.labours.map((item:any) => ({
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
        const { materialListId, materrialItemId } = req.params

        if (!materialListId || !materrialItemId) {
            res.status(400).json({ message: "MaterialList Id and MaterialItem Id is required", ok: false })
            return;
        }

    }
    catch (error) {
        console.log("error form getProjects", error)
        return res.status(500).json({ message: 'Server error. Please try again later.', errorMessage: error, error: true, ok: false });
    }
}


const updateStatusProject = async (req: AuthenticatedClientRequest, res: Response) => {
    try {

    }
    catch (error) {
        console.log("error form getProjects", error)
        return res.status(500).json({ message: 'Server error. Please try again later.', errorMessage: error, error: true, ok: false });
    }
}

export {
    getAccessedProjects,
    getProjectDetails,
    updateStatusProject,
    updateMaterialStatus
}