import { Response } from "express";
import { AuthenticatedClientRequest } from "../../types/types";
import ProjectModel from "../../models/project model/project.model";
import { LabourListModel } from "../../models/labour models/labourList.model";
import MaterialListModel from "../../models/Material Estimate Model/materialList.model";
import { MaterialApprovalModel } from "../../models/client model/materialApproval.model";
import { LabourApprovalModel } from "../../models/client model/labourApproval.model";
import MaterialEstimateModel from "../../models/Material Estimate Model/materialEstimate.model";
import { Types } from "mongoose";
import { LabourEstimateModel } from "../../models/labour models/labourEstimate.model";
import { TaskApprovalModel } from "../../models/client model/taskApproval.model";
import TaskModel from "../../models/task model/task.model";
import { TaskListModel } from '../../models/task model/tasklist.model';

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
            approval: approvedMaterialsMap[item._id.toString()] || { approved: null, feedback: null },
        }));

        const labourItemsWithStatus = labourList.labours.map((item: any) => ({
            ...item.toObject(),
            approval: approvedLaboursMap[item._id.toString()] || { approved: null, feedback: null },
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
            res.status(400).json({ message: "MaterialList Id, projectId and  MaterialItem Id is required", ok: false })
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
        res.status(500).json({ message: "Server error", errorMessage: error, error: true, ok: false });
        return
    }
};

const updateLabourStatus = async (req: AuthenticatedClientRequest, res: Response) => {
    try {

        const { labourListId, labourItemId, projectId } = req.params;
        const { approved, feedback } = req.body;

        if (!labourListId || !labourItemId || projectId) {
            res.status(400).json({ message: "labourList Id, projectId and  labourItem Id is required", ok: false })
            return;
        }

        if (approved && !["approved", "pending", "rejected"].includes(approved)) {
            res.status(400).json({ message: "Invalid approval status", ok: false });
            return
        }

        // Confirm the materialItem exists
        const labourEstimate = await LabourEstimateModel.findOne({ labourListId });
        if (!labourEstimate) {
            res.status(404).json({ message: "Labour Estimate not found for this Labour List", ok: false });
            return
        }

        const labourItemExists = labourEstimate.labourItems.some((item: any) => item._id.toString() === labourItemId);

        if (!labourItemExists) {
            res.status(404).json({ message: "Labour Item not found in Labour Estimate", ok: false });
            return
        }

        // Get clientId and projectId from the authenticated user or request body/context
        const clientId = req.client?._id; // Adjust as per your auth system

        let labourApproval = await LabourApprovalModel.findOne({ labourListId });

        if (!labourApproval) {
            labourApproval = new LabourApprovalModel({
                clientId,
                projectId,
                labourListId,
                approvedItems: [],
            });
        }

        // Update or insert the item in approvedItems array
        const existingIndex = labourApproval.approvedItems.findIndex(
            (item) => item.labourItemId.toString() === labourItemId
        );

        if (existingIndex !== -1) {
            // Update existing item and it will preserve the db data if either one of them is not provided and ("pending" is falsy value)
            if (approved) labourApproval.approvedItems[existingIndex].approved = approved;
            if (feedback !== undefined) labourApproval.approvedItems[existingIndex].feedback = feedback;
        } else {
            // Add new item
            labourApproval.approvedItems.push({
                labourItemId: new Types.ObjectId(labourItemId),
                approved: approved || "pending",
                feedback: feedback || null,
            });
        }

        // Recalculate approvalStatus after change
        const totalItems = labourEstimate.labourItems.length;
        const approvedItems = labourApproval.approvedItems;

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

        labourApproval.approvalStatus = newStatus;
        labourApproval.approvedAt = newStatus === 'approved' ? new Date() : null;
        await labourApproval.save();


        res.status(200).json({ message: "Labour item status updated", ok: true });
        return
    }
    catch (error) {
        console.log("Error in update Labour item ApprovalStatus", error);
        res.status(500).json({ message: "Server error", errorMessage: error, error: true, ok: false });
        return
    }
}

const updateLabourListStatus = async (req: AuthenticatedClientRequest, res: Response) => {
    try {
        const { projectId, labourListId } = req.params
        const clientId = req.client?._id;
        let { status } = req.body

        if (!labourListId || !projectId) {
            res.status(400).json({ message: "Labour list Id and Project Id are required", ok: false });
            return
        }

        if (!["approved", "pending", "rejected"].includes(status)) {
            res.status(400).json({ message: "Invalid approval status", ok: false });
            return
        }


        // Get the material estimate for the list
        const labourEstimate = await LabourEstimateModel.findOne({ labourListId });

        if (!labourEstimate) {
            res.status(404).json({ message: "Labour Estimate not found for this list", ok: false });
            return
        }

        // Fetch or create MaterialApproval
        let labourApproval = await LabourApprovalModel.findOne({ labourListId, projectId, clientId });

        if (!labourApproval) {
            labourApproval = new LabourApprovalModel({
                labourListId,
                projectId,
                clientId,
                approvedItems: [],
            });
        }


        // Replace approvedItems with the new status
        const updatedItems = labourEstimate.labourItems.map((item: any) => {
            const existingItem = labourApproval.approvedItems.find(
                (approvedItem) => approvedItem.labourItemId.toString() === item._id.toString()
            );

            return {
                labourItemId: item._id,
                approved: status,
                feedback: existingItem?.feedback ?? null, // ✅ Preserve old feedback if exists
            };
        });

        labourApproval.approvedItems = updatedItems;
        labourApproval.approvalStatus = status;
        labourApproval.approvedAt = status === "approved" ? new Date() : null;

        await labourApproval.save();

        res.status(200).json({
            message: `Labour list marked as ${status} successfully`,
            ok: true,
            data: labourApproval
        });
        return
    }
    catch (error) {
        console.log("Error in update Labour list ApprovalStatus", error);
        res.status(500).json({ message: "Server error", errorMessage: error, error: true, ok: false });
        return
    }
}

const updateTaskItemStatus = async (req: AuthenticatedClientRequest, res: Response) => {
    try {

        const { projectId, taskListId, taskItemId } = req.params
        const { approved, feedback } = req.body;

        if (!taskListId || !projectId || !taskItemId) {
            res.status(400).json({ message: "taskItem Id , Task list Id and Project Id are required", ok: false });
            return
        }

        if (approved && !["approved", "pending", "rejected"].includes(approved)) {
            res.status(400).json({ message: "Invalid approval status", ok: false });
            return
        }

        // Confirm the materialItem exists
        const taskModel = await TaskModel.findOne({ taskListId, _id: taskItemId });
        if (!taskModel) {
            res.status(404).json({ message: "taskModel not found for this TaskList", ok: false });
            return
        }

        let taskList = await TaskListModel.findOne({_id:taskListId})

        if (!taskList) {
            res.status(404).json({ message: "task list not found for this TaskList", ok: false });
            return
        }

        // Get clientId and projectId from the authenticated user or request body/context
        const clientId = req.client?._id; // Adjust as per your auth system

        let taskApproval = await TaskApprovalModel.findOne({ taskListId });

        if (!taskApproval) {
            taskApproval = new TaskApprovalModel({
                clientId,
                projectId,
                taskListId,
                approvedItems: [],
            });
        }

        // Update or insert the item in approvedItems array
        const existingIndex = taskApproval.approvedItems.findIndex(
            (item) => item.taskItemId.toString() === taskItemId
        );

        if (existingIndex !== -1) {
            // Update existing item and it will preserve the db data if either one of them is not provided and ("pending" is falsy value)
            if (approved) taskApproval.approvedItems[existingIndex].approved = approved;
            if (feedback !== undefined) taskApproval.approvedItems[existingIndex].feedback = feedback;
        } else {
            // Add new item
            taskApproval.approvedItems.push({
                taskItemId: new Types.ObjectId(taskItemId),
                approved: approved || "pending",
                feedback: feedback || null,
            });
        }

        // Recalculate approvalStatus after change
        const totalItems = taskList.tasks.length;
        const approvedItems = taskApproval.approvedItems;

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

        taskApproval.approvalStatus = newStatus;
        taskApproval.approvedAt = newStatus === 'approved' ? new Date() : null;
        await taskApproval.save();


        res.status(200).json({ message: "Task item status updated", ok: true });
        return

    }
    catch (error) {
        console.log("Error in update Task item ApprovalStatus", error);
        res.status(500).json({ message: "Server error", errorMessage: error, error: true, ok: false });
        return
    }
}


const updateTaskListStatus = async (req: AuthenticatedClientRequest, res: Response) => {
    try {
        const { projectId, taskListId } = req.params
        const clientId = req.client?._id;
        let { status } = req.body

        if (!taskListId || !projectId) {
            res.status(400).json({ message: "task list Id and Project Id are required", ok: false });
            return
        }

        if (!["approved", "pending", "rejected"].includes(status)) {
            res.status(400).json({ message: "Invalid approval status", ok: false });
            return
        }

        let taskList = await TaskListModel.findOne({_id:taskListId})

          if (!taskList) {
            res.status(404).json({ message: "taks lists not found for the provided Id", ok: false });
            return
        }

        // Get the material estimate for the list
        const taskModel = await TaskModel.findOne({ taskListId });

        if (!taskModel) {
            res.status(404).json({ message: "tasks not found for this list", ok: false });
            return
        }

        // Fetch or create MaterialApproval
        let taskApproval = await TaskApprovalModel.findOne({ taskListId, projectId, clientId });

        if (!taskApproval) {
            taskApproval = new TaskApprovalModel({
                taskListId,
                projectId,
                clientId,
                approvedItems: [],
            });
        }


        // Replace approvedItems with the new status
        const updatedItems = taskList.tasks.map((item: any) => {
            const existingItem = taskApproval.approvedItems.find(
                (approvedItem) => approvedItem.taskItemId.toString() === item._id.toString()
            );

            return {
                taskItemId: item._id,
                approved: status,
                feedback: existingItem?.feedback ?? null, // ✅ Preserve old feedback if exists
            };
        });

        taskApproval.approvedItems = updatedItems;
        taskApproval.approvalStatus = status;
        taskApproval.approvedAt = status === "approved" ? new Date() : null;

        await taskApproval.save();

        res.status(200).json({
            message: `task list marked as ${status} successfully`,
            ok: true,
            data: taskApproval
        });
        return
    }
    catch (error) {
        console.log("Error in update Task list ApprovalStatus", error);
        res.status(500).json({ message: "Server error", errorMessage: error, error: true, ok: false });
        return
    }
}


export {
    getAccessedProjects,
    getProjectDetails,
    updateMaterialStatus,
    updateMaterialListStatus,
    updateLabourStatus,
    updateLabourListStatus,
    updateTaskItemStatus
}