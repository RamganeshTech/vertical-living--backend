import { Response } from "express";
import ToolRoomModel from "../../models/tool_model/toolRoom.model";
import { getModelNameByRole } from "../../utils/common features/utils";
import { RoleBasedRequest } from "../../types/types";

// 1. CREATE TOOL ROOM
export const createToolRoom = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { toolRoomName, location, allowedIssueFrom, allowedIssueTo, inchargeUser, inchargeRole , organizationId } = req.body;


        if(!organizationId){
            return 
        }

        // Automatically determine model based on the logged-in user's role
        const modelName = getModelNameByRole(inchargeRole);

        const newToolRoom = await ToolRoomModel.create({
            toolRoomName,
            organizationId,
            location,
            allowedIssueFrom,
            allowedIssueTo,
            inchargeUser: inchargeUser, // From Auth Middleware
            inchargeModel: modelName    // Dynamic Reference
        });

        return res.status(201).json({
            ok: true,
            message: "Tool Room created successfully",
            data: newToolRoom
        });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};

// 2. UPDATE TOOL ROOM
export const updateToolRoom = async (req: any, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // If updating the incharge person, ensure we update the model too

        // updateData.inchargeModel = getModelByRole[updateData.role];

        updateData.inchargeUser = updateData.inchargeUser;
        updateData.inchargeModel = getModelNameByRole(updateData?.inchargeRole);


        const updatedRoom = await ToolRoomModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedRoom) return res.status(404).json({ ok: false, message: "Tool Room not found" });

        return res.status(200).json({ ok: true, data: updatedRoom });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};

// 3. GET ALL TOOL ROOMS (with search)
export const getAllToolRooms = async (req: any, res: Response): Promise<any> => {
    try {
        const {  page = 1, limit = 10 , toolRoomName, location, isActive, organizationId} = req.query;

        const query: any = {organizationId: organizationId};

        if (toolRoomName) query.toolRoomName = { $regex: toolRoomName, $options: "i" };
        if (isActive) query.isActive = isActive ;
        if (location) query.location = location ;

        const skip = (Number(page) - 1) * Number(limit);

        const rooms = await ToolRoomModel.find(query)
            .populate("inchargeUser") // Mongoose handles the dynamic ref automatically
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 });

        const total = await ToolRoomModel.countDocuments(query);

        return res.status(200).json({
            ok: true,
            total,
            data: rooms
        });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};

// 4. GET TOOL ROOM BY ID
export const getToolRoomById = async (req: any, res: Response): Promise<any> => {
    try {
        const room = await ToolRoomModel.findById(req.params.id).populate("inchargeUser");
        if (!room) return res.status(404).json({ ok: false, message: "Tool Room not found" });

        return res.status(200).json({ ok: true, data: room });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};

// 5. DELETE TOOL ROOM
export const deleteToolRoom = async (req: any, res: Response): Promise<any> => {
    try {
        const room = await ToolRoomModel.findByIdAndDelete(req.params.id);
        if (!room) return res.status(404).json({ ok: false, message: "Tool Room not found" });

        return res.status(200).json({ ok: true, message: "Tool Room deleted successfully" });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};