import { Request, Response } from "express";
import { RoleBasedRequest } from "../../../types/types";
import mongoose, { Types } from "mongoose"
import { ShortlistedDesignModel } from "../../../models/Stage Models/sampleDesing model/shortListed.model";
import { ShortlistedReferenceDesignModel } from "../../../models/Stage Models/sampleDesing model/shortlistReferenceDesign.model";

export const uploadShortlistedReferenceDesignImages = async (req: RoleBasedRequest, res: Response): Promise<any> => {
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
                        tags = req.body.tags.split(",").map((tag: string) => tag.trim());
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



        const doc = await ShortlistedReferenceDesignModel.findOneAndUpdate(
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


export const getAllShortlistedReferenceDesigns = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.params;

        if (!organizationId) {
            return res.status(500).json({ message: "organizationId is required", ok: false });
        }

        const { search } = req.query
        // 1. Prepare the search tags
        let searchTags: string[] = [];
        if (search) {
            // Handles both single string and comma-separated "tag1,tag2"
            searchTags = (search as string).split(',').map(tag => tag.trim());
        }

        // // 1. If NO search tags, just do a simple findOne (Fastest)
        // if (searchTags.length === 0) {
        //     const doc = await ShortlistedReferenceDesignModel.findOne({ organizationId });
        //     return res.status(200).json({
        //         ok: true,
        //         data: doc
        //     });
        // }

        // 2. Build the filter
        const filter: any = { organizationId };

        if (searchTags.length > 0) {
            // This searches if ANY of the tags in your search array 
            // exist within the 'referenceImages.tags' array
            filter["referenceImages.tags"] = { $in: searchTags };
        }

        const doc = await ShortlistedReferenceDesignModel.findOne(filter).lean();

          if (!doc) {
            return res.status(200).json({ message: "No shortlisted designs found", ok: true, data: null });
        }

        // 4. Optional: Filter the internal array
        // If the document has 100 images but only 2 match the tags, 
        // you might want to filter the referenceImages array before sending it back.
        // if (searchTags.length > 0) {
        if (searchTags.length > 0 && doc?.referenceImages) {
            doc.referenceImages = doc.referenceImages?.filter(img => 
                img?.tags?.some(tag => searchTags.includes(tag))
            );
        }

        // // 3. If THERE ARE tags, run the strict aggregation
        // const docs = await ShortlistedReferenceDesignModel.aggregate([
        //     { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
        //     { $unwind: "$referenceImages" },
        //     // Strict match: only images containing at least one of the search tags
        //     { $match: { "referenceImages.tags": { $in: searchTags } } },
        //     {
        //         $group: {
        //             _id: "$_id",
        //             organizationId: { $first: "$organizationId" },
        //             referenceImages: { $push: "$referenceImages" }
        //         }
        //     }
        // ]);

        // // const doc = docs[0] || null;
        // const doc = docs.length > 0 ? docs[0] : { organizationId, referenceImages: [] };

        // if (!doc) {
        //     return res.status(200).json({ message: "No shortlisted designs found", ok: true, data: null });
        // }

        return res.status(200).json({ ok: true, data: doc });
    } catch (error) {
        console.error("Error fetching shortlisted room designs:", error);
        return res.status(500).json({ message: "Internal server error", ok: false });
    }
};




export const deleteShortlistedReferenceDesign = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { organizationId, imageId } = req.params;

        if (!organizationId || !imageId) {
            return res.status(400).json({ message: "Missing required data", ok: false });
        }

        const shortlist = await ShortlistedReferenceDesignModel.findOneAndUpdate({ organizationId }, { $pull: { referenceImages: { _id: imageId } } }, { new: true });

        if (!shortlist) {
            return res.status(404).json({ message: "Shortlist not found", ok: false });
        }


        console.log("shortlist", shortlist)

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