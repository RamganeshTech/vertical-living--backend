import { Request, Response } from "express";
import mongoose from "mongoose";
import { ActiveLogEntry } from "../../Plugins/ProcurementDeptPluggin";
import procurementModel from "../../models/Procurement Model/procurement.model";


export const getProcurementAllLogs = async (req: Request, res: Response):Promise<any> => {
       try {
        const { organizationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(organizationId)) {
            return res.status(400).json({ error: "Invalid organization ID", ok:false });
        }

        const procurementLogs = await procurementModel
            .findOne({ organizationId }).populate("projectId", "projectName")
            .lean();

        return res.status(200).json({data:procurementLogs, ok:true});
    } catch (err) {
        console.error("Error fetching procurement logs:", err);
        return res.status(500).json({ error: "Internal server error" , ok:false});
    }
}




export const getProcurementLogsFiltered = async (req: Request, res: Response):Promise<any>  => {
    try {
        const { organizationId } = req.params;
        const { projectId, stageId } = req.query;

        if (!mongoose.Types.ObjectId.isValid(organizationId)) {
            return res.status(400).json({ error: "Invalid organization ID" , ok:false});
        }

        const procurementLogs = await procurementModel
            .findOne({ organizationId })
            .lean();

        let logs = (procurementLogs?.activeLog || []) as ActiveLogEntry[];

        if (projectId) {
            logs = logs.filter((log: any) => String(log.projectId) === String(projectId));
        }
        if (stageId) {
            logs = logs.filter((log: any) => String(log.stageId) === String(stageId));
        }

        return res.status(200).json({data:logs, ok:true});
    } catch (err) {
        console.error("Error fetching filtered procurement logs:", err);
        return res.status(500).json({ error: "Internal server error", ok:false });
    }
};



