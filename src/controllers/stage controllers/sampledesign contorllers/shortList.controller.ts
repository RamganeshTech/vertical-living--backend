// // controllers/shortlistedDesign.controller.ts

// import { Request, Response } from "express";
// import { Types } from "mongoose";
// import { ShortlistedDesignModel } from "../../../models/Stage Models/sampleDesing model/shortListed.model";
// import { RoleBasedRequest } from "../../../types/types";
// import ClientModel from "../../../models/client model/client.model";
// import { sendShortlistedDesignsEmail } from "../../../utils/Common Mail Services/ShortListMail";
// import { AsyncLocalStorage } from "async_hooks";


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


// export const uploadShortlistedDesignImages = async (req: RoleBasedRequest, res: Response): Promise<any> => {
//     try {
//         const { projectId, roomName, categoryName , categoryId} = req.params;
//         const files = req.files as Express.Multer.File[];

//         if (!projectId || !roomName || !categoryName || !categoryId) {
//             return res.status(400).json({ message: "Missing projectId, roomName or categoryName", ok: false });
//         }

//         if (!files?.length) {
//             return res.status(400).json({ message: "No files uploaded", ok: false });
//         }

//         const imageFiles = files.filter((file) => file.mimetype.startsWith("image/"));

//         const uploads = imageFiles.map((file) => ({
//             _id: new Types.ObjectId(),
//             type: "image" as const,
//             url: (file as any).location,
//             imageId: null,
//             originalName: file.originalname,
//             uploadedAt: new Date(),
//         }));

//         // 🔍 Find or create the main document
//         let doc = await ShortlistedDesignModel.findOne({ projectId });

//         if (!doc) {
//             // Create full structure if not exists
//             doc = await ShortlistedDesignModel.create({
//                 projectId,
//                 shortlistedRooms: [
//                     {
//                         roomName,
//                         categories: [
//                             {
//                                 categoryName,
//                                 categoryId,
//                                 designs: uploads,
//                             },
//                         ],
//                     },
//                 ],
//             });
//         } else {
//             // Check or insert room
//             let room = doc.shortlistedRooms.find((r) => r.roomName === roomName);
//             if (!room) {
//                 doc.shortlistedRooms.push({
//                     roomName,
//                     categories: [{ categoryName, categoryId, designs: uploads }],
//                 });
//             } else {
//                 // Check or insert category
//                 let category = room.categories.find((c) => c.categoryId.toString() === categoryId.toString());
//                 if (!category) {
//                     room.categories.push({ categoryName, categoryId, designs: uploads });
//                 } else {
//                     // Push new designs into existing
//                     category.designs.push(...uploads);
//                 }
//             }

//             await doc.save();
//         }

//         // ✅ Refetch updated designs for email
//         const updated = await ShortlistedDesignModel.findOne({ projectId });
//         const selectedRoom = updated?.shortlistedRooms.find((r) => r.roomName === roomName);
//         const selectedCategory = selectedRoom?.categories.find((c) => c.categoryId.toString() === categoryId.toString());
//         const allImageUrls = selectedCategory?.designs.map((d) => d.url) || [];

//         if (allImageUrls.length) {
//             await sendShortListMailUtil(
//                 projectId,
//                 roomName,
//                 categoryName,
//                 allImageUrls,
//             );
//         }

//         return res.status(200).json({
//             message: "Images uploaded and email sent",
//             urls: allImageUrls,
//             ok: true,
//         });
//     } catch (err) {
//         console.error("Upload & mail error:", err);
//         return res.status(500).json({ message: "Internal Server Error", ok: false });
//     }
// };




// export const addSelectedDesignsToShortlist = async (req: RoleBasedRequest, res: Response): Promise<any> => {
//     try {
//         const { projectId, roomName, categoryName, categoryId } = req.params;
//         const { selectedImages } = req.body;

//         if (!roomName || !categoryName || !Array.isArray(selectedImages) || !selectedImages.length) {
//             return res.status(400).json({ message: "Invalid data", ok: false });
//         }

//         const shortlist = await ShortlistedDesignModel.findOne({ projectId });

//         if (!shortlist) {
//             return res.status(404).json({ message: "Shortlist not found", ok: false });
//         }

//         // Convert selected images into design format
//         const newDesigns = selectedImages.map((img: any) => ({
//             _id: new Types.ObjectId(),
//             type: "image" as const,
//             url: img.url,
//             originalName: img.originalName || "",
//             imageId: img._id || null,
//             uploadedAt: new Date(),
//         }));

//         // Step 1: Find room or create it
//         let room = shortlist.shortlistedRooms.find((r) => r.roomName === roomName);
//         if (!room) {
//             shortlist.shortlistedRooms.push({
//                 roomName,
//                 categories: [{ categoryName, categoryId, designs: newDesigns }],
//             });
//         } else {
//             // Step 2: Find category or create it
//             let category = room.categories.find((c) => {
//                 console.log("c", c.categoryId)
//                 console.log("categoryd", categoryId)
//                 return c?.categoryId?.toString() === categoryId?.toString()
//             });
//             if (!category) {
//                 room.categories.push({ categoryName, categoryId, designs: newDesigns });
//             } else {
//                 // Step 3: Append new designs to existing
//                 // Step 3: Append only non-duplicate designs
//                 const existingUrls = new Set(category.designs.map((design) => design.url));
//                 const filteredNewDesigns = newDesigns.filter((design) => !existingUrls.has(design.url));

//                 if (filteredNewDesigns.length > 0) {
//                     category.designs.push(...filteredNewDesigns);
//                 }
//                 // const nonDuplicateDesigns = new Set()
//                 // category.designs.push(...newDesigns);
//             }
//         }

//         await shortlist.save();

//         // ✅ Refetch updated designs for email
//         const updated = await ShortlistedDesignModel.findOne({ projectId });
//         const selectedRoom = updated?.shortlistedRooms.find((r) => r.roomName === roomName);
//         const selectedCategory = selectedRoom?.categories.find((c) => c.categoryId.toString() === categoryId.toString());
//         const allImageUrls = selectedCategory?.designs.map((d) => d.url) || [];

//         if (allImageUrls.length) {
//             await sendShortListMailUtil(
//                 projectId,
//                 roomName,
//                 categoryName,
//                 allImageUrls,
//             );
//         }

//         return res.status(200).json({
//             message: "Designs added to shortlist and email sent",
//             urls: allImageUrls,
//             ok: true,
//         });
//     } catch (error) {
//         console.error("Error adding designs:", error);
//         return res.status(500).json({ message: "Internal server error", ok: false });
//     }
// };


// export const syncShortList = async (projectId: string | Types.ObjectId) => {
//     await ShortlistedDesignModel.create({
//         projectId,
//         shortlistedRooms: []
//     })
// }


// export const deleteShortlistedDesign = async (req: RoleBasedRequest, res: Response): Promise<any> => {
//     try {
//         const { projectId, roomName, categoryId, imageId } = req.params;

//         if (!projectId || !roomName || !categoryId || !imageId) {
//             return res.status(400).json({ message: "Missing required data", ok: false });
//         }

//         const shortlist = await ShortlistedDesignModel.findOne({ projectId });

//         if (!shortlist) {
//             return res.status(404).json({ message: "Shortlist not found", ok: false });
//         }

//         console.log("room name", roomName)

//         const room = shortlist.shortlistedRooms.find(r => r.roomName === roomName);
//         if (!room) {
//             return res.status(404).json({ message: "Room not found", ok: false });
//         }

//         const category = room.categories.find(c => c.categoryId === categoryId);
//         if (!category) {
//             return res.status(404).json({ message: "Category not found", ok: false });
//         }

//         const imageObjectId = new Types.ObjectId(imageId);

//         category.designs = category.designs.filter(
//             (design: any) => !(design._id.equals(imageObjectId) && design.type === "image")
//         );

//         await shortlist.save();

//         return res.status(200).json({ message: "Image deleted successfully", ok: true });
//     } catch (error) {
//         console.error("Error deleting shortlisted image:", error);
//         return res.status(500).json({ message: "Internal server error", ok: false });
//     }
// };

// export const getShortlistedRoomDesigns = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { projectId, roomName } = req.params;

//         const doc = await ShortlistedDesignModel.findOne({ projectId });

//         if (!doc) {
//             return res.status(404).json({ message: "No shortlisted designs found", ok: false });
//         }

//         // const room = doc.shortlistedRooms.find((r) => r.roomName === roomName);

//         // if (!room) {
//         //   return res.status(404).json({ message: "Room not found in shortlist", ok: false });
//         // }

//         return res.status(200).json({ ok: true, data: doc });
//     } catch (error) {
//         console.error("Error fetching shortlisted room designs:", error);
//         return res.status(500).json({ message: "Internal server error", ok: false });
//     }
// };





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


        console.log("all images without pdf and video", allImages)
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


// export const getShortlistedReferenceDesigns = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { organizationId } = req.params;
//         const { tags } = req.query;

//         if (!organizationId) {
//             return res.status(400).json({ ok: false, message: "Missing organizationId" });
//         }

//         let filterTags: string[] = [];

//         if (tags) {
//             if (typeof tags === "string") {
//                 // Either "general" or comma-separated string
//                 filterTags = tags === "general" ? ["general"] : tags.split(",").map(tag => tag.trim());
//             } else if (Array.isArray(tags)) {
//                 filterTags = tags as string[];
//             }
//         }

//         // Build filter logic for images
//         let imageFilter: any = [];

//         if (filterTags.length > 0) {
//             imageFilter.push(
//                 { "referenceImages.tags": { $in: filterTags } }
//             );

//             // Special case if "general" is one of provided tags
//             if (filterTags.includes("general")) {
//                 imageFilter.push(
//                     { "referenceImages.tags": { $exists: false } },
//                     { "referenceImages.tags": { $size: 0 } }
//                 );
//             }
//         } else {
//             // No tags: include only general (tags missing or empty)
//             imageFilter.push(
//                 { "referenceImages.tags": { $exists: false } },
//                 { "referenceImages.tags": { $size: 0 } }
//             );
//         }



//         const designs = await ShortlistedReferenceDesignModel.aggregate([
//             { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
//             {
//                 $project: {
//                     referenceImages: {
//                         $filter: {
//                             input: "$referenceImages",
//                             as: "image",
//                             cond: {
//                                 $or: [
//                                     {
//                                         $in: [{ $literal: true }, filterTags.includes('general') ? [
//                                             { $eq: [{ $size: "$$image.tags" }, 0] },
//                                             { $not: ["$$image.tags"] }
//                                         ] : []]
//                                     }, // general case
//                                     ...(filterTags.length > 0 ? [
//                                         {
//                                             $gt: [
//                                                 {
//                                                     $size: {
//                                                         $filter: {
//                                                             input: "$$image.tags",
//                                                             as: "tag",
//                                                             cond: { $in: ["$$tag", filterTags] }
//                                                         }
//                                                     }
//                                                 },
//                                                 0
//                                             ]
//                                         }
//                                     ] : []) // tags match
//                                 ]
//                             }
//                         }
//                     }
//                 }
//             },
//             { $match: { referenceImages: { $not: { $size: 0 } } } } // remove empty
//         ]);

//         return res.status(200).json({
//             ok: true,
//             referenceImages: designs.flatMap(d => d.referenceImages),
//         });

//     } catch (err) {
//         console.error("Error fetching designs:", err);
//         return res.status(500).json({ ok: false, message: "Server error" });
//     }
// };



// ✅ Controller to bulk add shortlisted designs

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

export const addShortlistedDesigns = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const { selections } = req.body;

        /**
         * Body Format Example:
         * {
         *   selections: [
         *     {
         *       siteImage: {
         *         _id: "650fa...", // original image id
         *         url: "https://s3...",
         *         originalName: "room1.jpg",
         *         type: "image"
         *       },
         *       referenceImages: [
         *         {
         *           _id: "650fb...",
         *           url: "https://s3...",
         *           originalName: "ref1.jpg",
         *           type: "image"
         *         }
         *       ]
         *     }
         *   ]
         * }
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