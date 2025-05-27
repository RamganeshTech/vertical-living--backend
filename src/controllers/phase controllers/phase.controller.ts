import { Response } from "express";
import { PhaseInformation, PhaseModel } from "../../models/phasemodels/phase.model";
import { AuthenticatedUserRequest } from "../../types/types";
import PhaseTaskListModel from "../../models/phasemodels/phaseTaskList.model";
import PhaseSingleTaskModel from "../../models/phasemodels/phaseSingleTask.model";
import { PhaseCommentModel } from "../../models/phasemodels/phasecomments.model";
import IssueModel from "../../models/issuesmodels/issues.models";
import { allowedUpdateFields } from "../../constants/phaseConstants";

const createPhase = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
    try {
        const { projectId } = req.params

        const { phaseName, description, status, startDate, endDate } = req.body

        if (!projectId) {
            res.status(400).json({ message: "Project Id is required", ok: false })
            return
        }

        if (!phaseName) {
            res.status(400).json({ message: "Phase Name is required", ok: false })
            return
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // reset to midnight for date-only comparison


        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start < today) {
            res.status(400).json({ message: "Start date cannot be in the past.", ok: false });
            return
        }

        // Rule 2: endDate must be same or after startDate
        if (end < start) {
            res.status(400).json({ message: "End date cannot be before start date.", ok: false });
            return

        }

        const phaseInformation: PhaseInformation = {
            chartView: [],
            statusTimeline: {
                createdAt: new Date(startDate)
            },
            activeStream: []
        }

        let phase = await PhaseModel.create({
            phaseId: Date.now(),
            projectId,
            phaseName,
            description: description || null,
            status,
            phaseInformation,
            startDate: start,
            endDate: end,
        })

        res.status(201).json({ message: "phase cretated", ok: true, data: phase })
        return
    }
    catch (error) {
        console.log("error form createProject", error)
        res.status(500).json({ message: 'Server error. Please try again later.', errorMessage: error, error: true, ok: false });
        return
    }
}

const deletePhase = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
    try {
        const { projectId, phaseId } = req.params

        if (!projectId || !phaseId) {
            res.status(400).json({ message: "Project Id and Phase Id is required", ok: false })
            return
        }

        const deletedPhase = await PhaseModel.findByIdAndDelete({
            _id: phaseId,
            projectId: projectId
        })

        if (!deletedPhase) {
            res.status(404).json({ message: "Phase not found or does not belong to this project", ok: false });
            return
        }

        const phaseTaskLists = await PhaseTaskListModel.find({ phaseId: phaseId }).select('_id');

        const taskListIds = phaseTaskLists.map(taskList => taskList._id);

        // 3. Delete all tasks related to those task lists
        await PhaseSingleTaskModel.deleteMany({ phaseTaskListId: { $in: taskListIds } });

        // 4. Delete the task lists themselves
        await PhaseTaskListModel.deleteMany({ phaseId: phaseId });

        // 5. Optionally delete comments and issues related to this phase
        await PhaseCommentModel.deleteMany({ phaseId: phaseId });

        await IssueModel.deleteMany({ phaseId: phaseId })

        res.status(200).json({ message: "Phase deleted successfully", ok: true });
        return


    }
    catch (error) {
        console.log("error form createProject", error)
        res.status(500).json({ message: 'Server error. Please try again later.', errorMessage: error, error: true, ok: false });
        return
    }
}

const getPhases = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
    try {
        const { projectId } = req.params;

        if (!projectId) {
            res.status(400).json({ message: "Project ID is required", ok: false });
            return
        }

        // Find all phases linked to the projectId
        const phases = await PhaseModel.find({ projectId }).exec();

        res.status(200).json({ message: "phases fetched successfully", ok: true, data: phases });
        return
    } catch (error) {
        console.error("Error fetching phases:", error);
        res.status(500).json({ message: "Server error", ok: false, error });
        return
    }
};

const updatePhase = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
    try {
        const { projectId, phaseId } = req.params;
        const updateData = req.body;  // User can send any subset of Phase fields here

        if (!projectId || phaseId) {
            res.status(400).json({ message: "Project ID and Phase Id is required", ok: false });
            return
        }

        let incomingFields = Object.keys(updateData)

        if (!updateData || incomingFields.length === 0) {
            res.status(400).json({ message: "No update data provided", ok: false });
            return;
        }

        const invalidFields = incomingFields.filter(field => !allowedUpdateFields.includes(field));

        if (invalidFields.length > 0) {
            res.status(400).json({
                message: `Invalid field(s): ${invalidFields.join(", ")}`,
                ok: false,
            });
            return
        }

        // Find all phases linked to the projectId

        const updatedPhase = await PhaseModel.findOneAndUpdate(
            { _id: phaseId, projectId },
            { $set: updateData },
            { new: true }
        ).exec();

        if (!updatedPhase) {
            res.status(404).json({ message: "Phase not found", ok: false });
            return;
        }

        res.status(200).json({ message: "Phase updated successfully", ok: true, data: updatedPhase });

        return
    } catch (error) {
        console.error("Error fetching phases:", error);
        res.status(500).json({ message: "Server error", ok: false, error });
        return
    }
}


export {
    createPhase,
    deletePhase,
    getPhases,
    updatePhase,
}