import { Response } from "express";
import { generateWorkerInviteLink } from "../../utils/generateInvitationworker";
import { AuthenticatedUserRequest } from "../../types/types";
import { getWorkerUtils, removeWorkerUtils } from "../../utils/workerUtils";

const inviteWorkerByOwner = async (req: AuthenticatedUserRequest, res: Response) => {
    try {
        const { projectId, role, specificRole ,  organizationId} = req.body;
        const user = req.user


        if (!projectId || !role || !specificRole) {
            return res.status(400).json({ message: "All fields required", ok: false });
        }

        const inviteLink = generateWorkerInviteLink({
            projectId,
             organizationId,
            role,
            specificRole,
            invitedBy: user._id,
            invitedByModel: "UserModel"
        });

        res.status(200).json({ message: "Worker invite link created", data: inviteLink, ok: true });
    } catch (error) {
        res.status(500).json({ message: "Server error", ok: false, error: (error as Error).message });
    }
};



// PUT /api/worker/remove/:workerId/:projectId
const removeWorkerFromProject = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
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


const getWorkersByProject = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
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


export { inviteWorkerByOwner , getWorkersByProject, removeWorkerFromProject}

