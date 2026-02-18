import { Request, Response } from "express";
import ToolMasterModel from "../../models/tool_model/toolMaster.model";
// import ToolMasterModel from "../models/ToolMasterModel"; // Adjust path

export const createTool = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            organizationId, toolName, toolCategory, brand,
            modelNumber, purchaseDate, purchaseValue, toolRoomId, remarks
        } = req.body;


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




export const createToolv1 = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            organizationId, toolName, toolCategory, brand,
            modelNumber, purchaseDate, purchaseValue, toolRoomId, remarks,
            warrantyDuration, serviceLocation, warrantyDetails
        } = req.body;


        // 2. Map the uploaded files from req.files (populated by your middleware)
        // const files = req.files as (Express.Multer.File & { location: string })[];
        // const mappedImages = files ? files.map(file => {

        //     if (file.mimetype.startsWith("image")) {
        //         return {
        //             type: "image",
        //             url: file.location,
        //             originalName: file.originalname,
        //             uploadedAt: new Date()
        //         }
        //     }
        // }) : [];

        // Function to map files based on mimetype
        const mapFile = (file: any) => ({
            type: file.mimetype.startsWith("image") ? "image" : "pdf",
            url: file.location,
            originalName: file.originalname,
            uploadedAt: new Date()
        });

        // Handling multiple fields from Multer (req.files as an object)
        const filesMap = req.files as { [fieldname: string]: (Express.Multer.File & { location: string })[] };

        const mappedToolImages = filesMap?.['toolImages'] ? filesMap['toolImages'].map(mapFile) : [];
        const mappedWarrantyImages = filesMap?.['warrantyFiles'] ? filesMap['warrantyFiles'].map(mapFile) : [];

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
            toolImages: mappedToolImages,
            warrentyFiles: mappedWarrantyImages,
            warrantyDuration, serviceLocation, warrantyDetails,
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




export const updateToolContent = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        // const updateData = { ...req.body };

        // delete updateData.toolImages;
        // delete updateData.toolCode;
        // delete updateData.organizationId;


        const { toolName,
            toolCategory,
            brand,
            modelNumber,
            conditionStatus,
            purchaseDate,
            purchaseValue,
            toolRoomId,
            remarks,
            warrantyDate,       // New text/date field
            serviceLocation,    // New text field
            warrantyDuration,
            warrantyDetails
        } = req.body

        const updateFields: any = {};
        if (toolName !== undefined) updateFields.toolName = toolName;
        if (toolCategory !== undefined) updateFields.toolCategory = toolCategory;
        if (brand !== undefined) updateFields.brand = brand;
        if (modelNumber !== undefined) updateFields.modelNumber = modelNumber;
        if (conditionStatus !== undefined) updateFields.conditionStatus = conditionStatus;
        if (purchaseDate !== undefined) updateFields.purchaseDate = purchaseDate;
        if (purchaseValue !== undefined) updateFields.purchaseValue = purchaseValue;
        if (toolRoomId !== undefined) updateFields.toolRoomId = toolRoomId;
        if (remarks !== undefined) updateFields.remarks = remarks;
        if (warrantyDate !== undefined) updateFields.warrantyDate = warrantyDate;
        if (serviceLocation !== undefined) updateFields.serviceLocation = serviceLocation;
        if (warrantyDetails !== undefined) updateFields.warrantyDetails = warrantyDetails;
        if (warrantyDuration !== undefined) updateFields.warrantyDuration = warrantyDuration;

        // Prevent modification of critical fields via this route

        const updatedTool = await ToolMasterModel.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!updatedTool) return res.status(404).json({ message: "Tool not found" });

        return res.status(200).json({ ok: true, data: updatedTool });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};



export const updateToolImages = async (req: Request, res: Response): Promise<any> => {
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

export const deleteToolImage = async (req: Request, res: Response): Promise<any> => {
    try {
        const { toolId, fileId } = req.params; // Expecting both IDs

        const updatedTool = await ToolMasterModel.findByIdAndUpdate(
            toolId,
            { $pull: { toolImages: { _id: fileId } } },
            { new: true }
        );

        if (!updatedTool) return res.status(404).json({ ok: false, message: "Tool not found" });

        return res.status(200).json({ ok: true, message: "Tool image removed", data: updatedTool });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};


export const updateToolWarrantyImages = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const files = req.files as (Express.Multer.File & { location: string })[];

        if (!files || files.length === 0) {
            return res.status(400).json({ ok: false, message: "No warranty files uploaded" });
        }

        // Map files to support both Image and PDF
        const mappedWarrantyFiles = files.map(file => {
            return {
                type: file.mimetype.startsWith("image") ? "image" : "pdf",
                url: file.location,
                originalName: file.originalname,
                uploadedAt: new Date()
            };
        });

        const updatedTool = await ToolMasterModel.findByIdAndUpdate(
            id,
            { $push: { warrantyFiles: { $each: mappedWarrantyFiles } } },
            { new: true }
        );

        if (!updatedTool) {
            return res.status(404).json({ ok: false, message: "Tool not found" });
        }

        return res.status(200).json({
            ok: true,
            message: "Warranty documents updated successfully",
            data: updatedTool
        });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};

export const deleteWarrantyFile = async (req: Request, res: Response): Promise<any> => {
    try {
        const { toolId, fileId } = req.params;

        const updatedTool = await ToolMasterModel.findByIdAndUpdate(
            toolId,
            { $pull: { warrantyFiles: { _id: fileId } } },
            { new: true }
        );

        if (!updatedTool) return res.status(404).json({ ok: false, message: "Tool not found" });

        return res.status(200).json({ ok: true, message: "Warranty file removed", data: updatedTool });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};


export const getAllTools = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            organizationId,
            page = 1,
            limit = 10,
            toolName,
            toolCategory,
            minPrice,
            maxPrice,
            search
        } = req.query;

        const query: any = { organizationId };

        // Search Filters
        if (toolName) query.toolName = { $regex: toolName, $options: "i" };
        if (toolCategory) query.toolCategory = toolCategory;


        if (search) {
            query.$or = [
                { modelNumber: { $regex: search, $options: 'i' } },
                { toolCode: { $regex: search, $options: 'i' } },
                { toolName: { $regex: search, $options: 'i' } },
            ];
        }


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

export const getToolById = async (req: Request, res: Response): Promise<any> => {
    try {
        const tool = await ToolMasterModel.findById(req.params.id).populate("toolRoomId");
        if (!tool) return res.status(404).json({ message: "Tool not found" });
        return res.status(200).json({ ok: true, data: tool });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};



export const deleteTool = async (req: Request, res: Response): Promise<any> => {
    try {
        const tool = await ToolMasterModel.findByIdAndDelete(req.params.id);
        if (!tool) return res.status(404).json({ message: "Tool not found" });

        return res.status(200).json({ ok: true, message: "Tool deleted okfully" });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};