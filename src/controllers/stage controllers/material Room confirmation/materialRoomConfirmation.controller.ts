// import { Request, Response } from "express";
// import MaterialRoomConfirmationModel from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model";
// import mongoose, { Types } from "mongoose";
// import { handleSetStageDeadline, timerFunctionlity } from "../../../utils/common features/timerFuncitonality";

// // import { generateCostEstimationFromMaterialSelection } from "../cost estimation controllers/costEstimation.controller";
// import redisClient from "../../../config/redisClient";
// import { populateWithAssignedToField } from "../../../utils/populateWithRedis";
// import { updateProjectCompletionPercentage } from "../../../utils/updateProjectCompletionPercentage ";
// import { DocUpload, RoleBasedRequest } from "../../../types/types";
// import { addOrUpdateStageDocumentation } from "../../documentation controller/documentation.controller";
// import { Items, RequirementFormModel } from "../../../models/Stage Models/requirment model/mainRequirementNew.model";
// import { syncCostEstimation } from "../cost estimation controllers/costEstimation.controller";
// import { IRoomItemEntry } from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomTypes";
// import { listenerCount } from "events";
// import { generatePackageComparisonPDF } from "./pdfMaterialSelection";
// import { uploadToS3 } from "../ordering material controller/pdfOrderHistory.controller";

// export const syncMaterialRoomSelectionStage = async (projectId: mongoose.Types.ObjectId | string) => {
//   // 1. Fetch requirement form for given project
//   const requirementDoc = await RequirementFormModel.findOne({ projectId });
//   if (!requirementDoc) return;


//   const timer = {
//     startedAt: new Date(),
//     completedAt: null,
//     deadLine: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
//     reminderSent: false,
//   };


//   // 2. Fetch existing material selection doc (if any)
//   let materialDoc = await MaterialRoomConfirmationModel.findOne({ projectId });


//   const packages = ["economy", "premium", "luxury"].map((pkg) => {
//     return {
//       _id: new mongoose.Types.ObjectId(), // fresh room id
//       level: pkg,
//       rooms: (requirementDoc.rooms || []).map((room: any) => ({
//         _id: new mongoose.Types.ObjectId(), // fresh room id
//         name: room.roomName,
//         roomFields: (room.items || []).map((item: Items) => ({
//           _id: new mongoose.Types.ObjectId(), // fresh item id
//           itemName: item.itemName,
//           quantity: item.quantity,
//           unit: item.unit || "nos",
//           materialItems: [],
//         })),
//         totalCost: 0,
//         uploads: [],

//       }))
//     }
//   })



//   if (!materialDoc) {
//     // 4. If no existing doc → create fresh
//     materialDoc = await MaterialRoomConfirmationModel.create({
//       projectId,
//       package: packages,
//       packageSelected: "economy",
//       status: "pending",
//       isEditable: true,
//       assignedTo: null,
//       timer: timer
//     });
//   }
//   else {

//     const requirementRooms = requirementDoc.rooms || [];

//     // Define the base packages you're expecting always
//     const basePackageLevels: ("economy" | "luxury" | "premium")[] = ["economy", "luxury", "premium"];

//     // If packages are missing, initialize them
//     if (!materialDoc.package || materialDoc.package.length === 0) {
//       materialDoc.package = basePackageLevels.map((level) => ({
//         _id: new mongoose.Types.ObjectId(),
//         level,
//         rooms: [],
//       }));
//     }

//     // For duplicate prevention: collect existing room names across all packages
//     const existingRoomNames = new Set<string>();
//     materialDoc.package.forEach(pkg => {
//       pkg.rooms.forEach(room => {
//         if (room.name) {
//           existingRoomNames.add(room.name.toLowerCase());
//         }
//       });
//     });

//     // Loop over base packages and add missing rooms
//     for (const pkg of materialDoc.package) {
//       for (const room of requirementRooms) {
//         const roomName = room.roomName?.toLowerCase();
//         if (!existingRoomNames.has(roomName)) {
//           const newRoom = {
//             _id: new mongoose.Types.ObjectId(),
//             name: room.roomName,
//             roomFields: (room.items || []).map(item => ({
//               _id: new mongoose.Types.ObjectId(),
//               itemName: item.itemName,
//               quantity: item.quantity,
//               unit: item.unit || "nos",
//               materialItems: []
//             })),
//             totalCost: 0,
//             uploads: [],
//           };

//           pkg.rooms.push(newRoom);
//         }
//       }
//     }

//     // Update timer
//     materialDoc.timer = timer;

//     await materialDoc.save();
//   }


//   const redisKey = `stage:MaterialRoomConfirmationModel:${projectId}`;
//   await redisClient.del(redisKey);
// };


// const getMaterialRoomConfirmationByProject = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId } = req.params;
//     const redisMainKey = `stage:MaterialRoomConfirmationModel:${projectId}`

//     //  await redisClient.del(redisMainKey)
//     const redisCachedData = await redisClient.get(redisMainKey)


//     if (redisCachedData) {
//       return res.json({ message: "data fetched from the cache", data: JSON.parse(redisCachedData), ok: true })
//     }


//     const data = await MaterialRoomConfirmationModel.findOne({ projectId });

//     if (!data) {
//       return res.status(404).json({ ok: false, message: "Material Room Confirmation not found." });
//     }

//     // await redisClient.set(redisMainKey, JSON.stringify(data.toObject()), { EX: 60 * 10 })

//     await populateWithAssignedToField({ stageModel: MaterialRoomConfirmationModel, projectId, dataToCache: data })


//     return res.status(200).json({ message: "fetched all matieral confirmations successfully", ok: true, data });
//   } catch (error) {
//     console.error("Error fetching material room confirmation:", error);
//     return res.status(500).json({ ok: false, message: "Server error" });
//   }
// };

// const getMaterialByPackageLevel = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId, packageId, roomId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(packageId)) {
//       return res.status(400).json({ message: "Invalid packageId", ok: false });
//     }

//     const redisRoomKey = `stage:MaterialRoomConfirmationModel:${projectId}:package:${packageId}`
//     // const redisMainKey = `stage:MaterialRoomConfirmationModel:${projectId}`
//     await redisClient.del(redisRoomKey)
//     const redisCachedData = await redisClient.get(redisRoomKey)


//     if (redisCachedData) {
//       return res.json({ message: "data fetched from the cache", data: JSON.parse(redisCachedData), ok: true })
//     }

//     const materialDoc = await MaterialRoomConfirmationModel.findOne({ projectId });

//     if (!materialDoc) {
//       return res.status(404).json({ message: "Material document not found", ok: false });
//     }

//     const selectedPackage = materialDoc.package.find((pkg: any) => pkg._id?.toString() === packageId);

//     if (!selectedPackage) {
//       return res.status(404).json({ message: "Package with given ID not found", ok: false });
//     }

//     let room = (selectedPackage.rooms).find((room: any) => room._id.toString() === roomId)


//     return res.status(200).json({ data: room, ok: true, message: "retrived successfully" });


//   } catch (error) {
//     return res.status(500).json({ message: "Server error", error, ok: false });
//   }
// };


// const addOrUpdateMaterialItem = async (req: Request, res: Response): Promise<any> => {
//   const { projectId, packageId, roomId, fieldId } = req.params;
//   const newMaterial = req.body; // Validate before using in production

//   try {
//     const doc = await MaterialRoomConfirmationModel.findOne({ projectId });

//     if (!doc) return res.status(404).json({ ok: false, message: "Material record not found" });

//     const pkg = doc.package.find((p: any) => p._id.toString() === packageId);
//     if (!pkg) return res.status(404).json({ ok: false, message: "Package not found" });

//     const room = (pkg.rooms as any).id(roomId);
//     if (!room) return res.status(404).json({ ok: false, message: "Room not found" });


//     const item = room.roomFields.id(fieldId);
//     if (!item) return res.status(404).json({ ok: false, message: "Item not found" });

//     const inputId = newMaterial._id;

//     if (inputId) {
//       // Try to find existing by _id
//       const existing = item.materialItems.id(inputId);

//       if (!existing) {
//         return res.status(404).json({ ok: false, message: "Material item with given _id not found in this item." });
//       }

//       // Update fields of existing item
//       existing.materialName = newMaterial.materialName;
//       existing.unit = newMaterial.unit;
//       existing.price = newMaterial.price;
//       existing.labourCost = newMaterial.labourCost;
//       existing.quantity = newMaterial.quantity;

//     } else {
//       // If no _id, check if same materialName already exists (per business rule)
//       const duplicate = item.materialItems.find((mat: any) => mat.materialName === newMaterial.materialName);

//       if (duplicate) {
//         return res.status(400).json({ message: `Material item '${newMaterial.materialName}' already exists.`, ok: false });
//       }

//       // Add new material item
//       item.materialItems.push(newMaterial);
//     }


//     room.totalCost = room.roomFields
//       .flatMap((item: any) => item.materialItems)
//       .reduce((sum: number, mat: any) => {
//         const itemCost = ((mat.price || 0) + (mat.labourCost || 0)) * (mat.quantity || 0);
//         return sum + itemCost;
//       }, 0);


//     await doc.save();

//     const updatedPackage = doc.package.find((pkg: any) => pkg._id.toString() === packageId);

//     const redisRoomKey = `stage:MaterialRoomConfirmationModel:${projectId}:package:${packageId}`
//     const updatedRoom = updatedPackage;

//     await redisClient.set(redisRoomKey, JSON.stringify(updatedRoom), { EX: 60 * 10 });
//     await populateWithAssignedToField({ stageModel: MaterialRoomConfirmationModel, projectId, dataToCache: doc })


//     return res.status(200).json({
//       message: inputId ? 'Material item updated successfully' : 'Material item added successfully',
//       data: item.materialItems,
//       ok: true
//     });


//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: "Server error", error: err });
//   }
// };

// export const deleteMaterialSubItem = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId, packageId, roomId, fieldId, itemId } = req.params;

//     const doc = await MaterialRoomConfirmationModel.findOne({ projectId });

//     if (!doc) return res.status(404).json({ ok: false, message: "Material record not found" });

//     const pkg = doc.package.find((p: any) => p._id.toString() === packageId);
//     if (!pkg) return res.status(404).json({ ok: false, message: "Package not found" });

//     const room = (pkg.rooms as any).id(roomId);
//     if (!room) return res.status(404).json({ ok: false, message: "Room not found" });

//     const item = room.roomFields.id(fieldId);
//     if (!item) return res.status(404).json({ ok: false, message: "Item not found" });


//     // Try to find existing by _id
//     item.materialItems = item.materialItems.filter((item: any) => item._id.toString() !== itemId);


//     // ✅ After material item is removed, update totalCost as well
//     room.totalCost = room.roomFields
//       .flatMap((item: any) => item.materialItems)
//       .reduce((sum: number, mat: any) => {
//         return sum + ((mat.price || 0) + (mat.labourCost || 0)) * (mat.quantity || 0);
//       }, 0);


//     await doc.save();

//     const updatedPackage = doc.package.find((pkg: any) => pkg._id.toString() === packageId);

//     const redisRoomKey = `stage:MaterialRoomConfirmationModel:${projectId}:package:${packageId}`
//     const updatedRoom = updatedPackage;

//     await redisClient.set(redisRoomKey, JSON.stringify(updatedRoom), { EX: 60 * 10 });
//     await populateWithAssignedToField({ stageModel: MaterialRoomConfirmationModel, projectId, dataToCache: doc })


//     return res.status(200).json({
//       message: 'Material item deleted successfully',
//       data: updatedRoom,
//       ok: true
//     });


//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: "Server error", error: err });
//   }
// }



// export const updateSelectedPackage = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId } = req.params;
//     const { selectedPackage } = req.body

//     const doc = await MaterialRoomConfirmationModel.findOneAndUpdate({ projectId }, { $set: { packageSelected: selectedPackage } }, {new:true});

//     if (!doc) return res.status(404).json({ ok: false, message: "Material record not found" });

//     await populateWithAssignedToField({ stageModel: MaterialRoomConfirmationModel, projectId, dataToCache: doc })

//     return res.status(200).json({
//       message: "Package Updated successfully",
//       data: doc.packageSelected,
//       ok: true
//     });


//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: "Server error", error: err, ok:false });
//   }
// }


// const deleteRoom = async (req: RoleBasedRequest, res: Response): Promise<any> => {
//   try {
//     const { projectId, packageId, roomId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(packageId) || !mongoose.Types.ObjectId.isValid(roomId)) {
//       return res.status(400).json({ ok: false, message: "Invalid ID(s) provided." });
//     }

//     const materialDoc = await MaterialRoomConfirmationModel.findOne({ projectId });

//     if (!materialDoc) {
//       return res.status(404).json({ ok: false, message: "Material selection document not found." });
//     }

//     const targetPackage = materialDoc.package.find((pkg: any) => pkg._id.toString() === packageId);

//     if (!targetPackage) {
//       return res.status(404).json({ ok: false, message: "Package not found." });
//     }

//     const initialLength = targetPackage.rooms.length;

//     // Remove room with matching roomId
//     targetPackage.rooms = targetPackage.rooms.filter((room: any) => room._id.toString() !== roomId);

//     if (targetPackage.rooms.length === initialLength) {
//       return res.status(404).json({ ok: false, message: "Room not found in specified package." });
//     }

//     await materialDoc.save();

//     // Optionally cache it with staff info, etc
//     await populateWithAssignedToField({
//       stageModel: MaterialRoomConfirmationModel,
//       projectId,
//       dataToCache: materialDoc,
//     });

//     return res.status(200).json({
//       ok: true,
//       message: "Room deleted successfully.",
//       data: materialDoc,
//     });

//   } catch (error) {
//     console.error("Error deleting room:", error);
//     return res.status(500).json({ ok: false, message: "Server error" });
//   }
// };



// export const generatePdfMaterialPacakgeComparison = async (req: RoleBasedRequest, res: Response): Promise<any> => {
//   try {
//     const { projectId } = req.params;

//     const resp = await generatePackageComparisonPDF(projectId)

//     const safeProjectName = ((resp.materialDoc.projectId as any).projectName || "project").replace(/\s+/g, "-");

//     const fileName = `home-interior-${safeProjectName}-${Date.now()}.pdf`;
//     const uploadResult = await uploadToS3(resp.pdfBytes, fileName);

//     const pdfData = {
//       url: uploadResult.Location,
//       pdfName: fileName,
//     };

//     return res.status(200).json({
//       ok: true,
//       data: pdfData,
//       message: 'PDF generated successfully'
//     });


//   } catch (error: any) {
//     console.error("Error deleting room:", error);
//     return res.status(500).json({ ok: false, message: error.message, error: "Server Error" });
//   }
// }


// const materialSelectionCompletionStatus = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId } = req.params;
//     const form = await MaterialRoomConfirmationModel.findOne({ projectId });

//     if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

//     form.status = "completed";
//     form.isEditable = false
//     timerFunctionlity(form, "completedAt")
//     await form.save();

//     if (form.status === "completed") {
//       // await generateCostEstimationFromMaterialSelection(form, projectId)
//       await syncCostEstimation(form, projectId)


//       // let uploadedFiles: DocUpload[] = [];

//       // const extractUploads = (rooms: any[]): DocUpload[] => {
//       //   return rooms.flatMap(room =>
//       //     room.uploads?.map((file: any) => ({
//       //       type: file.type,
//       //       url: file.url,
//       //       originalName: file.originalName,
//       //     })) || []
//       //   );
//       // };

//       // uploadedFiles = [
//       //   ...extractUploads(form.rooms),
//       //   // ...extractUploads(form.customRooms),
//       // ];
//       // await addOrUpdateStageDocumentation({
//       //   projectId,
//       //   stageNumber: "5", // ✅ Put correct stage number here
//       //   description: "Material Selection Stage is documented",
//       //   uploadedFiles, // optionally add files here
//       // })
//     }

//     // const redisMainKey = `stage:MaterialRoomConfirmationModel:${projectId}`
//     // await redisClient.set(redisMainKey, JSON.stringify(form.toObject()), { EX: 60 * 10 })

//     await populateWithAssignedToField({ stageModel: MaterialRoomConfirmationModel, projectId, dataToCache: form })



//     res.status(200).json({ ok: true, message: "Material Selection stage marked as completed", data: form });
//     updateProjectCompletionPercentage(projectId);

//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ ok: false, message: "Server error, try again after some time" });
//   }
// };


// // Mark form stage as completed (finalize the requirement gathering step)
// const setMaterialConfirmationStageDeadline = (req: Request, res: Response): Promise<any> => {
//   return handleSetStageDeadline(req, res, {
//     model: MaterialRoomConfirmationModel,
//     stageName: "Material Confirmation"
//   });
// };

// const uploadMaterialRoomFiles = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId, roomId, packageId } = req.params;

//     if (!projectId || !roomId || !packageId) {
//       return res.status(400).json({ ok: false, message: "Project ID and Room ID are required" });
//     }

//     if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
//       return res.status(400).json({ ok: false, message: "No files uploaded" });
//     }

//     const materialDoc = await MaterialRoomConfirmationModel.findOne({ projectId });
//     if (!materialDoc) {
//       return res.status(404).json({ ok: false, message: "Material confirmation document not found" });
//     }

//     let packageLevel = (materialDoc.package as Types.DocumentArray<any>).id(packageId);


//     if (!packageLevel) {
//       return res.status(404).json({ ok: false, message: "Room not found." });
//     }

//     const room = packageLevel.rooms.find((room: any) => room._id.toString() === roomId.toString())


//     // let room = (materialDoc.rooms as Types.DocumentArray<any>).id(roomId);
//     // if (!room) {
//     //   room = (materialDoc.customRooms as Types.DocumentArray<any>).id(roomId);
//     // }

//     if (!room) {
//       return res.status(404).json({ ok: false, message: "Room not found" });
//     }


//     const uploadedFiles = (req.files as (Express.Multer.File & { location: string })[]).map(file => ({
//       type: file.mimetype.includes("pdf") ? "pdf" : "image",
//       url: file.location,
//       originalName: file.originalname,
//       uploadedAt: new Date(),
//     }));


//     room.uploads.push(...uploadedFiles);

//     await materialDoc.save();


//     const redisRoomKey = `stage:MaterialRoomConfirmationModel:${projectId}:package:${packageId}`
//     // const redisMainKey = `stage:MaterialRoomConfirmationModel:${projectId}`

//     // ✅ Correct: updatedRoom is the room you just updated
//     const updatedRoom = packageLevel;
//     // await redisClient.set(redisMainKey, JSON.stringify(materialDoc.toObject()), { EX: 60 * 10 })
//     await redisClient.set(redisRoomKey, JSON.stringify(updatedRoom), { EX: 60 * 10 });
//     await populateWithAssignedToField({ stageModel: MaterialRoomConfirmationModel, projectId, dataToCache: materialDoc })


//     return res.status(200).json({
//       ok: true,
//       message: "Files uploaded successfully",
//       data: uploadedFiles,
//     });
//   } catch (err) {
//     console.error("Upload Room Files Error:", err);
//     return res.status(500).json({ ok: false, message: "Internal server error" });
//   }
// };


// const deleteMaterialRoomFile = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId, roomId, fileId, packageId } = req.params;

//     if (!projectId || !roomId || !fileId || !packageId) {
//       return res.status(400).json({ ok: false, message: "Missing required parameters." });
//     }

//     const materialDoc = await MaterialRoomConfirmationModel.findOne({ projectId });
//     if (!materialDoc) {
//       return res.status(404).json({ ok: false, message: "Material confirmation document not found." });
//     }

//     let packageLevel = (materialDoc.package as Types.DocumentArray<any>).id(packageId);
//     // if (!room) {
//     //   room = (materialDoc.customRooms as Types.DocumentArray<any>).id(roomId);
//     // }

//     if (!packageLevel) {
//       return res.status(404).json({ ok: false, message: "Room not found." });
//     }

//     const room = packageLevel.rooms.find((room: any) => room._id.toString() === roomId.toString())

//     if (!room) {
//       return res.status(404).json({ ok: false, message: "Room not found" });
//     }

//     // console.log("fileId", fileId)
//     const initialLength = room.uplods?.length || 0
//     room.uploads = room.uploads.filter((upload: any) => upload._id.toString() !== fileId.toString());

//     if (room.uploads.length === initialLength) {
//       return res.status(404).json({ ok: false, message: "File not found in room." });
//     }

//     await materialDoc.save();


//     const redisRoomKey = `stage:MaterialRoomConfirmationModel:${projectId}:package:${packageId}`
//     // const redisMainKey = `stage:MaterialRoomConfirmationModel:${projectId}`

//     // ✅ Correct: updatedRoom is the room you just updated
//     const updatedRoom = packageLevel;
//     // await redisClient.set(redisMainKey, JSON.stringify(materialDoc.toObject()), { EX: 60 * 10 })
//     await redisClient.set(redisRoomKey, JSON.stringify(updatedRoom), { EX: 60 * 10 });
//     await populateWithAssignedToField({ stageModel: MaterialRoomConfirmationModel, projectId, dataToCache: materialDoc })

//     return res.status(200).json({
//       ok: true,
//       message: "File deleted successfully.",
//     });
//   } catch (err) {
//     console.error("Delete Room File Error:", err);
//     return res.status(500).json({ ok: false, message: "Internal server error." });
//   }
// };



// export {
//   getMaterialRoomConfirmationByProject,
//   getMaterialByPackageLevel,
//   addOrUpdateMaterialItem,
//   deleteRoom,
//   materialSelectionCompletionStatus,
//   setMaterialConfirmationStageDeadline,
//   uploadMaterialRoomFiles,
//   deleteMaterialRoomFile
// }



