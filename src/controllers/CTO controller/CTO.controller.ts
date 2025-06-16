import { Response } from "express";
import { generateWorkerInviteLink } from "../../utils/generateInvitationworker";
import { AuthenticatedCTORequest } from "../../types/types";
import { getWorkerUtils, removeWorkerUtils } from "../../utils/workerUtils";
import StaffModel from "../../models/staff model/staff.model";

const inviteWorkerByCTO = async (req: AuthenticatedCTORequest, res: Response) => {
    try {
        const { projectId, role, specificRole, organizationId } = req.body;
        const CTO = req.CTO


        if (!projectId || !role || !specificRole) {
            return res.status(400).json({ message: "All fields required", ok: false });
        }

        const inviteLink = generateWorkerInviteLink({
            projectId,
            organizationId,
            role,
            specificRole,
            invitedBy: CTO._id,
            invitedByModel: "CTOModel"
        });

        res.status(200).json({ message: "Worker invite link created", data: inviteLink, ok: true });
    } catch (error) {
        res.status(500).json({ message: "Server error", ok: false, error: (error as Error).message });
    }
};



// PUT /api/worker/remove/:workerId/:projectId
const removeWorkerFromProjectFromCTO = async (req: AuthenticatedCTORequest, res: Response): Promise<void> => {
    try {
        const { workerId, projectId } = req.params;

        if (!workerId) {
            res.status(400).json({ message: "workerId is required", ok: false });
            return;
        }

        const deletedWorker = await removeWorkerUtils({ workerId, projectId })

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


const getWorkersByProjectFromCTO = async (req: AuthenticatedCTORequest, res: Response): Promise<void> => {
    try {
        const { projectId } = req.params;

        if (!projectId) {
            res.status(400).json({ message: "projectId is required", ok: false });
            return;
        }

        const workers = await getWorkerUtils({ projectId })

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


const getAllStaffsFromCTO = async (req:AuthenticatedCTORequest, res:Response)=> {
   try{
    const CTO= req.CTO;

        if (!CTO.ownerId) {
            res.status(400).json({ message: "ownerId is required", ok: false });
            return;
        }

        const staffs = await StaffModel.find({ownerId:CTO.ownerId})

        res.status(200).json({
            message: "Staffs fetched successfully",
            data: staffs,
            ok: true,
        });
    } 
    catch (error) {
        console.error("Error fetching staffs:", error);
        res.status(500).json({
            message: "Server error",
            ok: false,
            error: (error as Error).message,
        });
    }
}


export { inviteWorkerByCTO, getWorkersByProjectFromCTO, removeWorkerFromProjectFromCTO, getAllStaffsFromCTO }

