import { Response } from "express";
import { RoleBasedRequest } from "../../types/types";
import { ProjectConfigurationModel } from "../../models/project model/projectConfiguration.model";
// import { ProjectConfigurationModel } from "../models/ProjectConfigurationModel";


// ------------------------------------------------------------------
// 1. GET: Fetch the Entire Configuration
// ------------------------------------------------------------------
export const getProjectConfiguration = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const {organizationId} = req.params;

        if (!organizationId) {
            return res.status(400).json({ ok: false, message: "Organization ID is required" });
        }

        const config = await ProjectConfigurationModel.findOne({ organizationId });

        return res.status(200).json({ ok: true, data: config });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message || "Internal server error" });
    }
};

// ------------------------------------------------------------------
// 2. POST: Upload Videos (Appends to existing array)
// ------------------------------------------------------------------
export const uploadConfigVideos = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        console.log("entered or not ")

        const {organizationId} = req.params;
        const files = req.files as (Express.Multer.File & { location: string })[];

        if (!files || files.length === 0) {
            return res.status(400).json({ ok: false, message: "No videos provided" });
        }

        const uploadedVideos = files.map(file => ({
            type: file.mimetype,
            url: file.location || file.path,
            originalName: file.originalname,
            uploadedAt: new Date()
        }));

        const updatedConfig = await ProjectConfigurationModel.findOneAndUpdate(
            { organizationId },
            { $push: { videos: { $each: uploadedVideos } } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return res.status(200).json({ ok: true, message: "Videos uploaded", data: updatedConfig });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};

// ------------------------------------------------------------------
// 3. POST: Upload Images (Appends to existing array)
// ------------------------------------------------------------------
export const uploadConfigImages = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const {organizationId} = req.params;
        const files = req.files as (Express.Multer.File & { location: string })[];

        if (!files || files.length === 0) {
            return res.status(400).json({ ok: false, message: "No images provided" });
        }

        const uploadedImages = files.map(file => ({
            type: file.mimetype,
            url: file.location || file.path,
            originalName: file.originalname,
            uploadedAt: new Date()
        }));

        const updatedConfig = await ProjectConfigurationModel.findOneAndUpdate(
            { organizationId },
            { $push: { images: { $each: uploadedImages } } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return res.status(200).json({ ok: true, message: "Images uploaded", data: updatedConfig });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};

// ------------------------------------------------------------------
// 4. PUT: Update Terms and Conditions (Overwrites existing string)
// ------------------------------------------------------------------
export const updateTermsAndConditions = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const {organizationId} = req.params;
        const { termsAndCondition } = req.body;

        if (termsAndCondition === undefined) {
            return res.status(400).json({ ok: false, message: "Terms and conditions content is required" });
        }

        const updatedConfig = await ProjectConfigurationModel.findOneAndUpdate(
            { organizationId },
            { $set: { termsAndCondition } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return res.status(200).json({ ok: true, message: "Terms updated", data: updatedConfig });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};



// ------------------------------------------------------------------
// 5. DELETE: Remove a Video from the array
// ------------------------------------------------------------------
export const deleteConfigVideo = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { organizationId, videoId } = req.params;

        if (!organizationId || !videoId) {
            return res.status(400).json({ ok: false, message: "Organization ID and Video ID are required" });
        }

        const updatedConfig = await ProjectConfigurationModel.findOneAndUpdate(
            { organizationId },
            { $pull: { videos: { _id: videoId } } }, // Removes the specific video by its _id
            { new: true }
        );

        return res.status(200).json({ ok: true, message: "Video deleted successfully", data: updatedConfig });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};

// ------------------------------------------------------------------
// 6. DELETE: Remove an Image from the array
// ------------------------------------------------------------------
export const deleteConfigImage = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { organizationId, imageId } = req.params;

        if (!organizationId || !imageId) {
            return res.status(400).json({ ok: false, message: "Organization ID and Image ID are required" });
        }

        const updatedConfig = await ProjectConfigurationModel.findOneAndUpdate(
            { organizationId },
            { $pull: { images: { _id: imageId } } }, // Removes the specific image by its _id
            { new: true }
        );

        return res.status(200).json({ ok: true, message: "Image deleted successfully", data: updatedConfig });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};