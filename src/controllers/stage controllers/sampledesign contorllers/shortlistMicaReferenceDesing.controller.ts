import { Request, Response } from "express";
import { RoleBasedRequest } from "../../../types/types";

import {Types} from "mongoose"
import { ShortlistedMicaReferenceDesignModel } from "../../../models/Stage Models/sampleDesing model/shortListeMicaReference.model";


export const uploadShortlistedMicaDesignImages = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.params;
        const files = req.files as Express.Multer.File[];

        let tags: string[] = [];


        if (req.body?.tags) {
            try {
                if (typeof req.body.tags === "string") {
                    // support JSON string or comma-separated string
                    if (req.body.tags.startsWith("[")) {
                        tags = JSON.parse(req.body.tags);
                    } else {
                        tags = req.body.tags.split(",").map((tag:string) => tag.trim());
                    }
                } else if (Array.isArray(req.body.tags)) {
                    tags = req.body.tags;
                }

                if (!Array.isArray(tags)) throw new Error("Tags must be an array");
            } catch (err) {
                return res.status(400).json({ message: "Invalid tags format", ok: false });
            }
        }

        if (!organizationId) {
            return res.status(400).json({ message: "Missing organizaion Id", ok: false });
        }

        if (!files?.length) {
            return res.status(400).json({ message: "No files uploaded", ok: false });
        }

        const imageFiles = files.filter((file) => file.mimetype.startsWith("image/"));

        const uploads = imageFiles.map((file) => ({
            _id: new Types.ObjectId(),
            type: "image" as const,
            url: (file as any).location,
            // imageId: null,
                        tags: tags || [],
            originalName: file.originalname,
            uploadedAt: new Date(),
        }));

        // 🔍 Find or create the main document
        // let doc = await ShortlistedReferenceDesignModel.findOne({ organizationId });

        // if (!doc) {
        //     // Create full structure if not exists
        //     doc = await ShortlistedReferenceDesignModel.create({
        //         organizationId,
        //         referenceImages: [...uploads],
        //     });
        // } else {
        //     // Check or insert room
        //     doc.referenceImages.push(...uploads)
        //     await doc.save();
        // }



        const doc = await ShortlistedMicaReferenceDesignModel.findOneAndUpdate(
            { organizationId }, // match condition
            {
                $push: { referenceImages: { $each: uploads } }, // append images
            },
            {
                new: true,   // return the updated document
                upsert: true // create if not exists
            }
        );


        return res.status(200).json({
            message: "Images uploaded sent",
            urls: uploads,
            ok: true,
        });
    } catch (err) {
        console.error("Upload & mail error:", err);
        return res.status(500).json({ message: "Internal Server Error", ok: false });
    }
};


export const getAllShortlistedMicaDesigns = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.params;

        const doc = await ShortlistedMicaReferenceDesignModel.findOne({ organizationId });

        if (!doc) {
            return res.status(200).json({ message: "No shortlisted designs found", ok: true, data: null });
        }

        return res.status(200).json({ ok: true, data: doc });
    } catch (error) {
        console.error("Error fetching shortlisted room designs:", error);
        return res.status(500).json({ message: "Internal server error", ok: false });
    }
};




export const deleteShortlistedMicaDesign = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { organizationId, imageId } = req.params;

        if (!organizationId || !imageId) {
            return res.status(400).json({ message: "Missing required data", ok: false });
        }

        const shortlist = await ShortlistedMicaReferenceDesignModel.findOneAndUpdate({ organizationId }, { $pull: { referenceImages: { _id: imageId } } }, { new: true } );

        if (!shortlist) {
            return res.status(404).json({ message: "Shortlist not found", ok: false });
        }



        // optional: check if image still exists to confirm deletion
        const stillExists = shortlist.referenceImages.some((img: any) => img._id.toString() === imageId);
        if (stillExists) {
            return res.status(404).json({ message: "Image not found in shortlist", ok: false });
        }

        await shortlist.save();

        return res.status(200).json({ message: "Image deleted successfully", ok: true });
    } catch (error) {
        console.error("Error deleting shortlisted image:", error);
        return res.status(500).json({ message: "Internal server error", ok: false });
    }
};