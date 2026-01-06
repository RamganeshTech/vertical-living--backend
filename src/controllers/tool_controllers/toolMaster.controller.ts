import { Response } from "express";
import ToolMasterModel from "../../models/tool_model/toolMaster.model";
// import ToolMasterModel from "../models/ToolMasterModel"; // Adjust path

export const createTool = async (req: any, res: Response): Promise<any> => {
    try {
        const {
            organizationId, toolName, toolCategory, brand,
            modelNumber, purchaseDate, purchaseValue, toolRoomId, remarks
        } = req.body;

        // 1. Validation: Check if serialNumber exists in this organization
        // (First DB Call)
        // const existingTool = await ToolMasterModel.findOne({
        //     organizationId,
        //     serialNumber
        // });

        // if (existingTool) {
        //     return res.status(400).json({
        //         ok: false,
        //         message: "A tool with this Serial Number already exists in your organization."
        //     });
        // }

        // 2. Map the uploaded files from req.files (populated by your middleware)
        const files = req.files as (Express.Multer.File & { location: string })[];
        const mappedImages = files ? files.map(file => {

            if (file.mimetype.startsWith("image")) {
                return {
                    type: "image",
                    url: file.location,
                    originalName: file.originalname,
                    uploadedAt: new Date()
                }
            }
        }) : [];

        // 3. Create the tool
        // (Second DB Call - Triggers the TOOL-001 auto-gen hook)
        const newTool = new ToolMasterModel({
            organizationId,
            toolName,
            toolCategory,
            brand,
            modelNumber,
            // serialNumber,
            purchaseDate,
            purchaseValue,
            toolRoomId,
            remarks,
            toolImages: mappedImages
        });

        await newTool.save()

        return res.status(201).json({
            ok: true,
            message: "Tool registered okfully",
            data: newTool
        });

    } catch (error: any) {
        console.error("Create Tool Error:", error);
        return res.status(500).json({
            ok: false,
            message: error.message || "Internal Server Error"
        });
    }
};




export const updateToolContent = async (req: any, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Prevent modification of critical fields via this route
        delete updateData.toolImages;
        delete updateData.toolCode;
        delete updateData.organizationId;

        const updatedTool = await ToolMasterModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedTool) return res.status(404).json({ message: "Tool not found" });

        return res.status(200).json({ ok: true, data: updatedTool });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};



export const updateToolImages = async (req: any, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const files = req.files as (Express.Multer.File & { location: string })[];

        if (!files.length) {
            return res.status(400).json({ ok: false, message: "No images uploaded" });

        }

        const mappedImages = files ? files.map(file => {

            if (file.mimetype.startsWith("image")) {
                return {
                    type: "image",
                    url: file.location,
                    originalName: file.originalname,
                    uploadedAt: new Date()
                }
            }
        }) : [];

        const updatedTool = await ToolMasterModel.findByIdAndUpdate(
            id,
            { $push: { toolImages: { $each: mappedImages } } },
            { new: true }
        );

        return res.status(200).json({ ok: true, data: updatedTool });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};


export const getAllTools = async (req: any, res: Response): Promise<any> => {
    try {
        const {
            organizationId,
            page = 1,
            limit = 10,
            toolName,
            toolCategory,
            minPrice,
            maxPrice
        } = req.query;

        const query: any = { organizationId };

        // Search Filters
        if (toolName) query.toolName = { $regex: toolName, $options: "i" };
        if (toolCategory) query.toolCategory = toolCategory;

        // Purchase Value Range Filter
        if (minPrice || maxPrice) {
            query.purchaseValue = {};
            if (minPrice) query.purchaseValue.$gte = Number(minPrice);
            if (maxPrice) query.purchaseValue.$lte = Number(maxPrice);
        }

        const skip = (Number(page) - 1) * Number(limit);

        const tools = await ToolMasterModel.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate("toolRoomId");

        const total = await ToolMasterModel.countDocuments(query);

        return res.status(200).json({
            ok: true,
            total,
            currentPage: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            data: tools
        });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};

export const getToolById = async (req: any, res: Response): Promise<any> => {
    try {
        const tool = await ToolMasterModel.findById(req.params.id).populate("toolRoomId");
        if (!tool) return res.status(404).json({ message: "Tool not found" });
        return res.status(200).json({ ok: true, data: tool });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};



export const deleteTool = async (req: any, res: Response): Promise<any> => {
    try {
        const tool = await ToolMasterModel.findByIdAndDelete(req.params.id);
        if (!tool) return res.status(404).json({ message: "Tool not found" });

        return res.status(200).json({ ok: true, message: "Tool deleted okfully" });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};