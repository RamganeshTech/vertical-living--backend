// SECOND VERSION 

// controllers/shortlistedDesign.controller.ts
import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import { ShortlistedDesignModel } from "../../../models/Stage Models/sampleDesing model/shortListed.model";
import { RoleBasedRequest } from "../../../types/types";
import { RequirementFormModel } from "../../../models/Stage Models/requirment model/mainRequirementNew.model";
import { SiteMeasurementModel } from "../../../models/Stage Models/siteMeasurement models/siteMeasurement.model";
import { generateShortlistPdf } from "./pdfShortListDesignsController";
import { ShortlistedReferenceDesignModel } from "../../../models/Stage Models/sampleDesing model/shortlistReferenceDesign.model";


// const sendShortListMailUtil = async (projectId: Types.ObjectId | string, roomName: string, categoryName: string, images: any[]) => {
//     const client = await ClientModel.findOne({ projectId });
//     if (!client || !client.email) {
//         return;
//     }

//     // Step 2: Send email
//     await sendShortlistedDesignsEmail({
//         clientName: client.clientName,
//         clientEmail: client.email,
//         categoryName,
//         roomName,
//         images,
//     });

// }


export const getAllSiteImages = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {

        const { projectId } = req.params
        const [requirement, sitemeasurement] = await Promise.all([RequirementFormModel.findOne({ projectId }), SiteMeasurementModel.findOne({ projectId })])

        let allImages: any = [];
        if (requirement) {
            if (Array.isArray(requirement.uploads) && requirement.uploads.length > 0) {
                let arr = requirement.uploads.filter((file: any) => file.type === "image");
                allImages.push(...arr);
            }

            // ✅ RequirementFormModel room uploads
            if (Array.isArray(requirement.rooms) && requirement.rooms.length > 0) {
                requirement.rooms.forEach((room: any) => {
                    if (Array.isArray(room.uploads) && room.uploads.length > 0) {
                        // allImages.push(...room.uploads.map((img: any) => ({
                        //     ...img,
                        //     // roomName: room.roomName, // 🔍 attach room context
                        // })));
                        let arr = room.uploads.filter((file: any) => file.type === "image")
                        allImages.push(...arr);
                    }
                });
            }
        }




        // ✅ SiteMeasurementModel
        if (sitemeasurement) {
            if (Array.isArray(sitemeasurement.uploads) && sitemeasurement.uploads.length > 0) {
                // allImages.push(...sitemeasurement.uploads);
                let arr = sitemeasurement.uploads.filter((file: any) => file.type === "image");
                allImages.push(...arr);
            }

            if (Array.isArray(sitemeasurement.rooms) && sitemeasurement.rooms.length > 0) {
                sitemeasurement.rooms.forEach((room: any) => {
                    if (Array.isArray(room.uploads) && room.uploads.length > 0) {
                        let arr = room.uploads.filter((file: any) => file.type === "image")
                        allImages.push(...arr);
                    }
                });
            }
        }


        // console.log("all images without pdf and video", allImages)
        return res.status(200).json({
            message: "Images get fetched",
            data: allImages,
            ok: true,
        });

    }
    catch (error: any) {
        console.error("Upload & mail error:", error);
        return res.status(500).json({ message: "Internal Server Error", ok: false });
    }
}


export const getShortlistedReferenceDesigns = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.params;
        const { tags } = req.query;


        if (!organizationId) {
            return res.status(400).json({ ok: false, message: "Missing organizationId" });
        }

        // let filterTags: string[] = [];

        // if (tags) {
        //   if (typeof tags === "string") {
        //     filterTags = tags === "all" ? [] : tags.split(",").map(tag => tag.trim());
        //   } else if (Array.isArray(tags)) {
        //     filterTags = tags as string[];
        //   }
        // }

        let filterTags: string[] = [];

        if (tags) {
            if (typeof tags === "string") {
                filterTags = tags === "all" ? [] : [tags.trim()];
            } else if (Array.isArray(tags)) {
                filterTags = (tags as string[]).map(tag => tag.trim());
            }
        }

        const matchObj: any = { organizationId: new mongoose.Types.ObjectId(organizationId) };

        const aggregationPipeline: any[] = [
            { $match: matchObj }
        ];

        // ✅ Tag filtering logic
        if (filterTags.length > 0) {
            aggregationPipeline.push({
                $project: {
                    referenceImages: {
                        $filter: {
                            input: "$referenceImages",
                            as: "image",
                            cond: {
                                $or: [
                                    // ✅ Match tags
                                    {
                                        $gt: [
                                            {
                                                $size: {
                                                    $filter: {
                                                        input: { $ifNull: ["$$image.tags", []] }, // ✅ Fallback to []
                                                        as: "tag",
                                                        cond: { $in: ["$$tag", filterTags] }
                                                    }
                                                }
                                            },
                                            0
                                        ]
                                    },
                                    // ✅ Special case if "general" included
                                    ...(filterTags.includes("general") ? [
                                        { $not: ["$$image.tags"] },
                                        {
                                            $eq: [
                                                { $size: { $ifNull: ["$$image.tags", []] } },
                                                0
                                            ]
                                        }
                                    ] : [])
                                ]
                            }
                        }
                    }
                }
            });
        }

        const designs = await ShortlistedReferenceDesignModel.aggregate([
            ...aggregationPipeline,
            // Remove documents with no matching images
            { $match: { referenceImages: { $not: { $size: 0 } } } }
        ]);

        const referenceImages = designs.flatMap(doc => doc.referenceImages);

        return res.status(200).json({
            ok: true,
            data: referenceImages,
            message: "references images fetched for comparison "
        });

    } catch (err) {
        console.error("Error fetching designs:", err);
        return res.status(500).json({ ok: false, message: "Server error" });
    }
};


export const getAllReferenceTags = async (req: Request, res: Response): Promise<any> => {
    try {
        const { q } = req.query; // optional: e.g. ?q=mod

        const tagsAggregation = await ShortlistedReferenceDesignModel.aggregate([
            { $unwind: "$referenceImages" },
            { $unwind: "$referenceImages.tags" },
            {
                $group: {
                    _id: null,
                    allTags: { $addToSet: "$referenceImages.tags" }
                }
            },
            {
                $project: {
                    _id: 0,
                    tags: "$allTags"
                }
            }
        ]);

        let tags: string[] = tagsAggregation[0]?.tags || [];

        // Optional filtering if query is passed
        if (q) {
            tags = tags.filter(tag =>
                tag.toLowerCase().includes((q as string).toLowerCase())
            );
        }

        return res.status(200).json({ tags });
    } catch (err) {
        console.error("Error fetching reference tags", err);
        return res.status(500).json({ message: "Failed to get tags", err });
    }
};

export const addShortlistedDesigns = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const { selections } = req.body;

        /**
         * Body Format Example:
          {
            selections: [
              {
                siteImage: {
                  _id: "650fa...", // original image id
                  url: "https://s3...",
                  originalName: "room1.jpg",
                  type: "image"
                },
                referenceImages: [
                  {
                    _id: "650fb...",
                    url: "https://s3...",
                    originalName: "ref1.jpg",
                    type: "image"
                  },
          {
                    _id: "650fd4...",
                    url: "https://s3...",
                    originalName: "ref2.jpg",
                    type: "image"
                  }
                ]
              }
            ]
          }
         */

        if (!selections || !Array.isArray(selections)) {
            return res.status(400).json({ ok: false, message: "Selections must be an array" });
        }

        const formattedSelections = selections.map((sel: any) => {
            return {
                siteImage: {
                    url: sel.siteImage.url,
                    originalName: sel.siteImage.originalName,
                    type: "image",
                    imageId: new mongoose.Types.ObjectId(sel.siteImage._id), // store original _id
                    uploadedAt: new Date(),
                },
                referenceImages: (sel.referenceImages || []).map((ref: any) => ({
                    url: ref.url,
                    originalName: ref.originalName,
                    type: "image",
                    imageId: new mongoose.Types.ObjectId(ref._id),
                    uploadedAt: new Date(),
                })),
            };
        });

        // let doc = await ShortlistedDesignModel.findOne({ projectId });

        // if (!doc) {
        //   // Create new entry
        //   doc = new ShortlistedDesignModel({
        //     projectId,
        //     shortListedDesigns: formattedSelections,
        //   });
        // } else {
        //   // Append to existing shortlist
        //   doc.shortListedDesigns.push(...formattedSelections);
        // }

        // await doc.save();

        let doc = await ShortlistedDesignModel.create({
            projectId,
            shortListedDesigns: formattedSelections,
        })

        doc = await doc.populate("projectId");

        const data = await generateShortlistPdf({ doc })

        return res.status(200).json({
            ok: true,
            message: "Shortlisted designs added successfully",
            data: {
                url: data.url,
                fileName: data.pdfName
            },
        });
    } catch (error) {
        console.error("Error adding shortlisted designs:", error);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};





export const deleteShortListedDesign = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        const doc = await ShortlistedDesignModel.findByIdAndDelete(id)

        if (!doc) {
            return res.status(404).json({ message: "No shortlisted designs found", ok: false });
        }


        return res.status(200).json({ ok: true, message: "deleted successfully", data: doc });
    } catch (error) {
        console.error("Error fetching shortlisted room designs:", error);
        return res.status(500).json({ message: "Internal server error", ok: false });
    }
};



export const getShortlistedRoomDesigns = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        const doc = await ShortlistedDesignModel.find({ projectId });

        if (!doc) {
            return res.status(404).json({ message: "No shortlisted designs found", ok: false });
        }

        // const room = doc.shortlistedRooms.find((r) => r.roomName === roomName);

        // if (!room) {
        //   return res.status(404).json({ message: "Room not found in shortlist", ok: false });
        // }

        return res.status(200).json({ ok: true, data: doc });
    } catch (error) {
        console.error("Error fetching shortlisted room designs:", error);
        return res.status(500).json({ message: "Internal server error", ok: false });
    }
};