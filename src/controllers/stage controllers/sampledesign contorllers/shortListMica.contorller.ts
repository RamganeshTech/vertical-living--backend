// import { Request, Response } from 'express';
// import * as cocoSsd from '@tensorflow-models/coco-ssd';
// import * as tf from '@tensorflow/tfjs';
// import sharp from 'sharp';
// import { RoleBasedRequest } from '../../../types/types';
// import mongoose, {Types} from "mongoose"
// import { RequirementFormModel } from '../../../models/Stage Models/requirment model/mainRequirementNew.model';
// import { SiteMeasurementModel } from '../../../models/Stage Models/siteMeasurement models/siteMeasurement.model';
// import { generateShortlistMicaPdf } from './pdfShorListMicaDesignsController';
// import { ShortlistedMicaDesignModel } from '../../../models/Stage Models/sampleDesing model/shortListedMica.model';
// import { ShortlistedMicaReferenceDesignModel } from '../../../models/Stage Models/sampleDesing model/shortListeMicaReference.model';
// // const Jimp = require('jimp');



// export const processImageForDetection = async (imageUrl: string, model: any) => {
//   try {
//     // 1. Fetch image from URL
//     const response = await fetch(imageUrl);
//     if (!response.ok) {
//       throw new Error(`Failed to fetch image: ${response.statusText}`);
//     }

//     // 2. Get image buffer
//     const imageBuffer = await response.arrayBuffer();
//     const buffer = Buffer.from(imageBuffer);

//     // 3. Process image with Sharp
//     const processedImage = await sharp(buffer)
//       .resize(800, 800, { 
//         fit: 'inside',
//         withoutEnlargement: true 
//       })
//       .removeAlpha()
//       .raw()
//       .toBuffer({ resolveWithObject: true });

//     const { data, info } = processedImage;

//     // 4. Convert to tensor
//     const tensor = tf.tensor3d(data, [info.height, info.width, 3]);

//     // 5. Detect objects
//     const predictions = await model.detect(tensor);

//     // 6. Clean up tensor
//     tensor.dispose();

//     // 7. Filter only relevant furniture/interior objects
//     const relevantClasses = ['chair', 'couch', 'bed', 'dining table', 'tv', 'laptop', 'book'];
//     const filteredPredictions = predictions.filter((pred: any) => 
//       relevantClasses.includes(pred.class)
//     );

//     return filteredPredictions.map((pred: any) => ({
//       class: pred.class,
//       score: pred.score,
//       bbox: {
//         x: pred.bbox[0],
//         y: pred.bbox[1],
//         width: pred.bbox[2],
//         height: pred.bbox[3]
//       }
//     }));

//   } catch (error: any) {
//     throw new Error(`Image processing failed: ${error.message}`);
//   }
// };

// let model: any = null;

// // Load model once when server starts
// export const loadDetectionModel = async () => {
//   try {
//     console.log('Loading COCO-SSD model...');
//     model = await cocoSsd.load();
//     console.log('COCO-SSD model loaded successfully');
//   } catch (error) {
//     console.error('Error loading model:', error);
//     throw error;
//   }
// };



// // Detect objects in image from URL
// export const detectObjects = async (req: Request, res: Response):Promise<any> => {
//   try {
//     if (!model) {
//       await loadDetectionModel();
//     }

//     const { imageUrl } = req.body;

//     if (!imageUrl) {
//       return res.status(400).json({ error: 'No image URL provided' });
//     }

//     // Process image from URL and detect objects
//     const predictions = await processImageForDetection(imageUrl, model);

//     res.json({
//       success: true,
//       detectedAreas: predictions,
//       message: `Detected ${predictions.length} objects`
//     });

//   } catch (error: any) {
//     console.error('Detection error:', error);
//     res.status(500).json({ 
//       error: 'Failed to process image',
//       details: error.message 
//     });
//   }
// };




// export const getAllMicaSiteImages = async (req: RoleBasedRequest, res: Response): Promise<any> => {
//     try {

//         const { projectId } = req.params
//         const [requirement, sitemeasurement] = await Promise.all([RequirementFormModel.findOne({ projectId }), SiteMeasurementModel.findOne({ projectId })])

//         let allImages: any = [];
//         if (requirement) {
//             if (Array.isArray(requirement.uploads) && requirement.uploads.length > 0) {
//                 let arr = requirement.uploads.filter((file: any) => file.type === "image");
//                 allImages.push(...arr);
//             }

//             // ✅ RequirementFormModel room uploads
//             if (Array.isArray(requirement.rooms) && requirement.rooms.length > 0) {
//                 requirement.rooms.forEach((room: any) => {
//                     if (Array.isArray(room.uploads) && room.uploads.length > 0) {
//                         // allImages.push(...room.uploads.map((img: any) => ({
//                         //     ...img,
//                         //     // roomName: room.roomName, // 🔍 attach room context
//                         // })));
//                         let arr = room.uploads.filter((file: any) => file.type === "image")
//                         allImages.push(...arr);
//                     }
//                 });
//             }
//         }




//         // ✅ SiteMeasurementModel
//         if (sitemeasurement) {
//             if (Array.isArray(sitemeasurement.uploads) && sitemeasurement.uploads.length > 0) {
//                 // allImages.push(...sitemeasurement.uploads);
//                 let arr = sitemeasurement.uploads.filter((file: any) => file.type === "image");
//                 allImages.push(...arr);
//             }

//             if (Array.isArray(sitemeasurement.rooms) && sitemeasurement.rooms.length > 0) {
//                 sitemeasurement.rooms.forEach((room: any) => {
//                     if (Array.isArray(room.uploads) && room.uploads.length > 0) {
//                         let arr = room.uploads.filter((file: any) => file.type === "image")
//                         allImages.push(...arr);
//                     }
//                 });
//             }
//         }


//         // console.log("all images without pdf and video", allImages)
//         return res.status(200).json({
//             message: "Images get fetched",
//             data: allImages,
//             ok: true,
//         });

//     }
//     catch (error: any) {
//         console.error("Upload & mail error:", error);
//         return res.status(500).json({ message: "Internal Server Error", ok: false });
//     }
// }


// export const getShortlistedMicaReferenceDesigns = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { organizationId } = req.params;
//         const { tags } = req.query;


//         if (!organizationId) {
//             return res.status(400).json({ ok: false, message: "Missing organizationId" });
//         }


//                 console.log('🔍 Mica API Called:', { organizationId, tags });


//         // let filterTags: string[] = [];

//         // if (tags) {
//         //   if (typeof tags === "string") {
//         //     filterTags = tags === "all" ? [] : tags.split(",").map(tag => tag.trim());
//         //   } else if (Array.isArray(tags)) {
//         //     filterTags = tags as string[];
//         //   }
//         // }

//         let filterTags: string[] = [];

//         if (tags) {
//             if (typeof tags === "string") {
//                 filterTags = tags === "all" ? [] : [tags.trim()];
//             } else if (Array.isArray(tags)) {
//                 filterTags = (tags as string[]).map(tag => tag.trim());
//             }
//         }

//         const matchObj: any = { organizationId: new mongoose.Types.ObjectId(organizationId) };

//         const aggregationPipeline: any[] = [
//             { $match: matchObj }
//         ];

//         // ✅ Tag filtering logic
//         if (filterTags.length > 0) {
//             aggregationPipeline.push({
//                 $project: {
//                     referenceImages: {
//                         $filter: {
//                             input: "$referenceImages",
//                             as: "image",
//                             cond: {
//                                 $or: [
//                                     // ✅ Match tags
//                                     {
//                                         $gt: [
//                                             {
//                                                 $size: {
//                                                     $filter: {
//                                                         input: { $ifNull: ["$$image.tags", []] }, // ✅ Fallback to []
//                                                         as: "tag",
//                                                         cond: { $in: ["$$tag", filterTags] }
//                                                     }
//                                                 }
//                                             },
//                                             0
//                                         ]
//                                     },
//                                     // ✅ Special case if "general" included
//                                     ...(filterTags.includes("general") ? [
//                                         { $not: ["$$image.tags"] },
//                                         {
//                                             $eq: [
//                                                 { $size: { $ifNull: ["$$image.tags", []] } },
//                                                 0
//                                             ]
//                                         }
//                                     ] : [])
//                                 ]
//                             }
//                         }
//                     }
//                 }
//             });
//         }

//         const designs = await ShortlistedMicaReferenceDesignModel.aggregate([
//             ...aggregationPipeline,
//             // Remove documents with no matching images
//             { $match: { referenceImages: { $not: { $size: 0 } } } }
//         ]);

//         const referenceImages = designs.flatMap(doc => doc.referenceImages);

//         return res.status(200).json({
//             ok: true,
//             data: referenceImages,
//             message: "references images fetched for comparison "
//         });

//     } catch (err) {
//         console.error("Error fetching designs:", err);
//         return res.status(500).json({ ok: false, message: "Server error" });
//     }
// };


// export const getAllMicaReferenceTags = async (req: Request, res: Response):Promise<any> => {
//   try {
//     const { q } = req.query; // optional: e.g. ?q=mod

//     const tagsAggregation = await ShortlistedMicaDesignModel.aggregate([
//       { $unwind: "$referenceImages" },
//       { $unwind: "$referenceImages.tags" },
//       {
//         $group: {
//           _id: null,
//           allTags: { $addToSet: "$referenceImages.tags" }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           tags: "$allTags"
//         }
//       }
//     ]);

//     let tags: string[] = tagsAggregation[0]?.tags || [];

//     // Optional filtering if query is passed
//     if (q) {
//       tags = tags.filter(tag =>
//         tag.toLowerCase().includes((q as string).toLowerCase())
//       );
//     }

//     return res.status(200).json({ tags });
//   } catch (err) {
//     console.error("Error fetching reference tags", err);
//     return res.status(500).json({ message: "Failed to get tags", err });
//   }
// };

// export const addShortlistedMicaDesigns = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { projectId } = req.params;
//         const { selections } = req.body;

//         /**
//          * Body Format Example:
//          * {
//          *   selections: [
//          *     {
//          *       siteImage: {
//          *         _id: "650fa...", // original image id
//          *         url: "https://s3...",
//          *         originalName: "room1.jpg",
//          *         type: "image"
//          *       },
//          *       referenceImages: [
//          *         {
//          *           _id: "650fb...",
//          *           url: "https://s3...",
//          *           originalName: "ref1.jpg",
//          *           type: "image"
//          *         }
//          *       ]
//          *     }
//          *   ]
//          * }
//          */

//         if (!selections || !Array.isArray(selections)) {
//             return res.status(400).json({ ok: false, message: "Selections must be an array" });
//         }

//         const formattedSelections = selections.map((sel: any) => {
//             return {
//                 siteImage: {
//                     url: sel.siteImage.url,
//                     originalName: sel.siteImage.originalName,
//                     type: "image",
//                     imageId: new mongoose.Types.ObjectId(sel.siteImage._id), // store original _id
//                     uploadedAt: new Date(),
//                 },
//                 referenceImages: (sel.referenceImages || []).map((ref: any) => ({
//                     url: ref.url,
//                     originalName: ref.originalName,
//                     type: "image",
//                     imageId: new mongoose.Types.ObjectId(ref._id),
//                     uploadedAt: new Date(),
//                 })),
//             };
//         });

//         // let doc = await ShortlistedDesignModel.findOne({ projectId });

//         // if (!doc) {
//         //   // Create new entry
//         //   doc = new ShortlistedDesignModel({
//         //     projectId,
//         //     shortListedDesigns: formattedSelections,
//         //   });
//         // } else {
//         //   // Append to existing shortlist
//         //   doc.shortListedDesigns.push(...formattedSelections);
//         // }

//         // await doc.save();

//         let doc = await ShortlistedMicaDesignModel.create({
//             projectId,
//             shortListedDesigns: formattedSelections,
//         })

//         doc = await doc.populate("projectId");

//         const data = await generateShortlistMicaPdf({ doc })

//         return res.status(200).json({
//             ok: true,
//             message: "Shortlisted designs added successfully",
//             data: {
//                 url: data.url,
//                 fileName: data.pdfName
//             },
//         });
//     } catch (error) {
//         console.error("Error adding shortlisted designs:", error);
//         return res.status(500).json({ ok: false, message: "Internal server error" });
//     }
// };





// export const deleteShortListedMicaDesign = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { id } = req.params;

//         const doc = await ShortlistedMicaDesignModel.findByIdAndDelete(id)

//         if (!doc) {
//             return res.status(404).json({ message: "No shortlisted designs found", ok: false });
//         }


//         return res.status(200).json({ ok: true, message: "deleted successfully", data: doc });
//     } catch (error) {
//         console.error("Error fetching shortlisted room designs:", error);
//         return res.status(500).json({ message: "Internal server error", ok: false });
//     }
// };



// export const getShortlistedMicaRoomDesigns = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { projectId } = req.params;

//         const doc = await ShortlistedMicaDesignModel.find({ projectId });

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