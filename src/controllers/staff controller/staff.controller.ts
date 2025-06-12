import { Response } from "express";
import { AuthenticatedStaffRequest } from './../../types/types';
import { generateWorkerInviteLink } from "../../utils/generateInvitationworker";
import { getWorkerUtils, removeWorkerUtils } from "../../utils/workerUtils";

const inviteWorkerByStaff = async (req: AuthenticatedStaffRequest, res: Response): Promise<void> => {

    try {
        const { projectId, specificRole, role, organizationId } = req.body;
        const staff = req.staff

        if (!projectId || !specificRole) {
            res.status(400).json({
                message: "projectId and specificRole are required",
                ok: false,
            });
            return;
        }


        const inviteLink = generateWorkerInviteLink({
            projectId,
            organizationId: "",
            role,
            specificRole,
            invitedBy: staff._id,
            invitedByModel: "StaffModel"
        });

        res.status(200).json({
            message: "Invitation link generated successfully by staff",
            data: inviteLink,
            ok: true,
        });

    } catch (error) {
        console.error("Error inviting worker:", error);
        res.status(500).json({
            message: "Server error",
            ok: false,
            error: (error as Error).message,
        });
    }
};


// PUT /api/worker/remove/:workerId/:projectId
const removeWorkerFromProject = async (req: AuthenticatedStaffRequest, res: Response): Promise<void> => {
    try {
        const { workerId, projectId  } = req.params;

        if (!workerId) {
            res.status(400).json({ message: "workerId is required", ok: false });
            return;
        }

        const deletedWorker = await removeWorkerUtils({workerId, projectId})

        if (!deletedWorker) {
            res.status(404).json({ message: "Worker not found", ok: false });
            return;
        }

        res.status(200).json({
            message: "Worker removed from the project successfully",
            data:deletedWorker,
            ok: true,
        });
    } catch (error) {
        console.error("Error removing worker:", error);
        res.status(500).json({
            message: "Server error",
            ok: false,
            error: (error as Error).message,
        });
    }
};


const getWorkersByProject = async (req: AuthenticatedStaffRequest, res: Response): Promise<void> => {
    try {
        const { projectId } = req.params;

        if (!projectId) {
            res.status(400).json({ message: "projectId is required", ok: false });
            return;
        }

        const workers = await getWorkerUtils({projectId})

        res.status(200).json({
            message: "Workers fetched successfully",
            data: workers,
            ok: true,
        });
    } catch (error) {
        console.error("Error fetching workers:", error);
        res.status(500).json({
            message: "Server error",
            ok: false,
            error: (error as Error).message,
        });
    }
};


export {
    getWorkersByProject, inviteWorkerByStaff, removeWorkerFromProject
}