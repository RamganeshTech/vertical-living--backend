import { Request, Response } from "express";
import mongoose from "mongoose";
import MaterialRoomConfirmationModel, {
  IMaterialRoomConfirmation,
  IPredefinedRoom,
  ICustomRoom,
} from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model";
import OrderingMaterialModel, { IUploadFile } from "../../../models/Stage Models/Ordering Material Model/orderingMaterial.model";
import PaymentConfirmationModel from './../../../models/Stage Models/Payment Confirmation model/PaymentConfirmation.model';
import { IMaterialOrderingTimer } from './../../../models/Stage Models/Ordering Material Model/orderingMaterial.model';
import { handleSetStageDeadline, timerFunctionlity } from "../../../utils/common features/timerFuncitonality";
import { generateOrderingToken } from "../../../utils/generateToken";
import { s3 } from "../../../config/awssdk";
import { syncMaterialArrival } from "../MaterialArrival controllers/materialArrivalCheck.controller";
import redisClient from "../../../config/redisClient";
import { populateWithAssignedToField } from "../../../utils/populateWithRedis";
import { updateProjectCompletionPercentage } from "../../../utils/updateProjectCompletionPercentage ";
import { addOrUpdateStageDocumentation } from "../../documentation controller/documentation.controller";
import { DocUpload } from "../../../types/types";

export const syncOrderingMaterials = async (projectId: string) => {

  const existing = await OrderingMaterialModel.findOne({ projectId });

  if (!existing) {
    const timer: IMaterialOrderingTimer = {
      startedAt: null,
      completedAt: null,
      deadLine: null,
      reminderSent: false,
    };

    await OrderingMaterialModel.create({
      projectId: projectId,
      status: "pending",
      isEditable: true,
      assignedTo: null,
      shopDetails: {
        shopName: null,
        address: null,
        contactPerson: null,
        phoneNumber: null,
      },
      deliveryLocationDetails: {
        siteName: null,
        address: null,
        siteSupervisor: null,
        phoneNumber: null,
      },
      materialOrderingList: {
        carpentry: [],
        hardware: [],
        electricalFittings: [],
        tiles: [],
        ceramicSanitaryware: [],
        paintsCoatings: [],
        lightsFixtures: [],
        glassMirrors: [],
        upholsteryCurtains: [],
        falseCeilingMaterials: []
      },
      timer,
      generatedLink: null,
    });
  }
  else {
    existing.timer.startedAt = null
    existing.timer.completedAt = null
    existing.timer.deadLine = null
    existing.timer.reminderSent = false

    existing.save()
  }
  const redisKey = `stage:OrderingMaterialModel:${projectId}`;
  await redisClient.del(redisKey);
}

const getAllOrderingMaterialDetails = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    const redisMainKey = `stage:OrderingMaterialModel:${projectId}`
    // await redisClient.del(redisMainKey)
    const cachedData = await redisClient.get(redisMainKey)

    if (cachedData) {
      return res.status(200).json({ message: "data fetched from the cache", data: JSON.parse(cachedData), ok: true })
    }


    const doc = await OrderingMaterialModel.findOne({ projectId });

    if (!doc) return res.status(404).json({ ok: false, message: "Data not found" });

    // await redisClient.set(redisMainKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })
    await populateWithAssignedToField({ stageModel: OrderingMaterialModel, projectId, dataToCache: doc })


    return res.status(200).json({ ok: true, data: doc });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

const getRoomDetailsOrderMaterials = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, roomKey } = req.params;

    const redisRoomKey = `stage:OrderingMaterialModel:${projectId}:room:${roomKey}`
    // await redisClient.del(redisRoomKey)
    const cachedData = await redisClient.get(redisRoomKey)

    if (cachedData) {
      return res.status(200).json({ message: "data fetched from the cache", data: JSON.parse(cachedData), ok: true })
    }

    const doc = await OrderingMaterialModel.findOne({ projectId });

    if (!doc) return res.status(404).json({ ok: false, message: "Data not found" });

    const roomData: any = (doc.materialOrderingList as any)[roomKey];

    if (!roomData) {
      return res.status(400).json({ ok: false, message: `Room '${roomKey}' not found` });
    }

    await redisClient.set(redisRoomKey, JSON.stringify(roomData), { EX: 60 * 10 })

    return res.status(200).json({ ok: true, data: roomData });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};


const updateShopDetails = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    const { shopName, address, contactPerson, phoneNumber } = req.body;



    if (!shopName || !address || !contactPerson || !phoneNumber) {
      return res.status(400).json({ ok: false, message: "All shop details are required." });
    }

    const orderingDoc = await OrderingMaterialModel.findOneAndUpdate(
      { projectId },
      {
        $set: {
          shopDetails: { shopName, address, contactPerson, phoneNumber },
        },
      },
      { new: true, upsert: true }
    );

    if (!orderingDoc) {
      return res.status(400).json({ ok: false, message: "Failed to update shop details." });
    }

    // const redisMainKey = `stage:OrderingMaterialModel:${projectId}`
    // await redisClient.set(redisMainKey, JSON.stringify(orderingDoc.toObject()), { EX: 60 * 10 })

    await populateWithAssignedToField({ stageModel: OrderingMaterialModel, projectId, dataToCache: orderingDoc })



    res.status(200).json({ ok: true, message: "Shop details updated", data: orderingDoc.shopDetails });
  }
  catch (error: any) {
    console.error("Error updatinthe shop details form ordering room", error);
    return res.status(500).json({ message: "Server error", ok: false });
  }
};



const updateDeliveryLocationDetails = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    const { siteName, address, siteSupervisor, phoneNumber } = req.body;

    if (!siteName || !address || !siteSupervisor || !phoneNumber) {
      return res.status(400).json({ ok: false, message: "All delivery location details are required." });
    }

    const orderingDoc = await OrderingMaterialModel.findOneAndUpdate(
      { projectId },
      {
        $set: {
          deliveryLocationDetails: { siteName, address, siteSupervisor, phoneNumber },
        },
      },
      { new: true, upsert: true }
    );

    if (!orderingDoc) {
      return res.status(400).json({ ok: false, message: "Failed to update delivery details." });
    }

    // const redisMainKey = `stage:OrderingMaterialModel:${projectId}`
    // await redisClient.set(redisMainKey, JSON.stringify(orderingDoc.toObject()), { EX: 60 * 10 })

    await populateWithAssignedToField({ stageModel: OrderingMaterialModel, projectId, dataToCache: orderingDoc })


    res.status(200).json({ ok: true, message: "Delivery location updated", data: orderingDoc.deliveryLocationDetails });
  }
  catch (error: any) {
    console.error("Error updatinthe delivery details form ordering room", error);
    return res.status(500).json({ message: "Server error", ok: false });
  }
};



const addRoomMaterialItem = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, roomKey } = req.params;
    const newItem = req.body; // expecting a single new item!

    if (!newItem || typeof newItem !== "object") {
      return res.status(400).json({ ok: false, message: "No valid item provided." });
    }

    // Validate roomKey
    const requiredFieldsByRoom = {
      carpentry: ["material", "brandName", "specification", "quantity", "unit", "remarks"],
      hardware: ["item", "size", "material", "brandName", "quantity", "unit", "remarks"],
      electricalFittings: ["item", "specification", "quantity", "unit", "remarks"],
      tiles: ["type", "brandName", "size", "quantity", "unit", "remarks"],
      ceramicSanitaryware: ["item", "specification", "quantity", "unit", "remarks"],
      paintsCoatings: ["type", "brandName", "color", "quantity", "unit", "remarks"],
      lightsFixtures: ["type", "brandName", "specification", "quantity", "unit", "remarks"],
      glassMirrors: ["type", "brandName", "size", "thickness", "quantity", "remarks"],
      upholsteryCurtains: ["item", "fabric", "color", "quantity", "unit", "remarks"],
      falseCeilingMaterials: ["item", "specification", "quantity", "unit", "remarks"],
    };

    const requiredFields = requiredFieldsByRoom[roomKey as keyof typeof requiredFieldsByRoom];
    if (!requiredFields) {
      return res.status(400).json({ ok: false, message: `Invalid room key: ${roomKey}` });
    }

    // Validate: first field is mandatory
    const firstFieldKey = requiredFields[0];
    const firstFieldValue = (newItem[firstFieldKey] || "").toString().trim();
    if (!firstFieldValue) {
      return res.status(400).json({ ok: false, message: `Field '${firstFieldKey}' is required.` });
    }

    // Load doc
    const doc = await OrderingMaterialModel.findOne({ projectId });
    if (!doc) {
      return res.status(404).json({ ok: false, message: "Ordering material doc not found." });
    }

    const existingItems = (doc.materialOrderingList as any)[roomKey] || [];

    // Check duplicate on first field
    const exists = existingItems.some(
      (item: any) => (item[firstFieldKey] || "").toString().trim().toLowerCase() === firstFieldValue.toLowerCase()
    );

    if (exists) {
      return res.status(400).json({
        ok: false,
        message: `An item with '${firstFieldKey}' = '${firstFieldValue}' already exists.`,
      });
    }

    // ✅ Push new item
    existingItems.push(newItem);

    // ✅ Save back
    (doc.materialOrderingList as any)[roomKey] = existingItems;

    await doc.save();

    res.status(200).json({
      ok: true,
      message: `New item added to '${roomKey}'.`,
      data: existingItems,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error." });
  }
};

// put /api/ordering-materials/:projectId/room/:roomKey
const updateRoomMaterials = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, roomKey, itemId } = req.params;
    const { items } = req.body;



    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ ok: false, message: "Items array is required and cannot be empty." });
    }


    const updateData = items[0];


    // Validate based on room type
    const requiredFieldsByRoom = {
      carpentry: ["material", "brandName", "specification", "quantity", "unit", "remarks"],
      hardware: ["item", "size", "material", "brandName", "quantity", "unit", "remarks"],
      electricalFittings: ["item", "specification", "quantity", "unit", "remarks"],
      tiles: ["type", "brandName", "size", "quantity", "unit", "remarks"],
      ceramicSanitaryware: ["item", "specification", "quantity", "unit", "remarks"],
      paintsCoatings: ["type", "brandName", "color", "quantity", "unit", "remarks"],
      lightsFixtures: ["type", "brandName", "specification", "quantity", "unit", "remarks"],
      glassMirrors: ["type", "brandName", "size", "thickness", "quantity", "remarks"],
      upholsteryCurtains: ["item", "fabric", "color", "quantity", "unit", "remarks"],
      falseCeilingMaterials: ["item", "specification", "quantity", "unit", "remarks"]
    };

    const orderingDoc = await OrderingMaterialModel.findOne({ projectId });
    if (!orderingDoc) {
      return res.status(404).json({ ok: false, message: "Ordering material document not found." });
    }

    // Get room array
    const roomItems = (orderingDoc.materialOrderingList as any)[roomKey];
    if (!Array.isArray(roomItems)) {
      return res.status(400).json({ ok: false, message: `Invalid room key: ${roomKey}` });
    }

    // Find item index by _id
    const index = roomItems.findIndex(i => i._id.toString() === itemId);
    if (index === -1) {
      return res.status(404).json({ ok: false, message: "Item not found in the room." });
    }

    // Replace item at index
    roomItems[index] = {
      ...roomItems[index].toObject?.() || roomItems[index],
      ...updateData,
      _id: itemId, // Ensure _id is preserved
    };

    orderingDoc.markModified(`materialOrderingList.${roomKey}`);

    await orderingDoc.save();


    // const redisMainKey = `stage:OrderingMaterialModel:${projectId}`
    const redisRoomKey = `stage:OrderingMaterialModel:${projectId}:room:${roomKey}`
    // await redisClient.set(redisMainKey, JSON.stringify(orderingDoc.toObject()), { EX: 60 * 10 })
    await redisClient.set(redisRoomKey, JSON.stringify((orderingDoc.materialOrderingList as any)[roomKey]), { EX: 60 * 10 });
    await populateWithAssignedToField({ stageModel: OrderingMaterialModel, projectId, dataToCache: orderingDoc })

    res.status(200).json({ ok: true, message: `Room '${roomKey}' materials updated.`, data: (orderingDoc.materialOrderingList as any)[roomKey] });

  }
  catch (error) {
    return res.status(500).json({ message: "Server error", ok: false });
  }


};



const deleteRoomMaterialItem = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, roomKey, itemId } = req.params;

    const doc = await OrderingMaterialModel.findOne({ projectId });

    if (!doc) return res.status(404).json({ ok: false, message: "Data not found" });

    if (!(doc.materialOrderingList as any)[roomKey])
      return res.status(400).json({ ok: false, message: `Room '${roomKey}' not found` });

    // Remove item
    (doc.materialOrderingList as any)[roomKey] = (doc.materialOrderingList as any)[roomKey].filter(
      (item: any) => item._id.toString() !== itemId
    );

    await doc.save();

    const updatedRoom = (doc.materialOrderingList as any)[roomKey]

    // const redisMainKey = `stage:OrderingMaterialModel:${projectId}`
    const redisRoomKey = `stage:OrderingMaterialModel:${projectId}:room:${roomKey}`
    // await redisClient.set(redisMainKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })
    await redisClient.set(redisRoomKey, JSON.stringify(updatedRoom), { EX: 60 * 10 })

    await populateWithAssignedToField({ stageModel: OrderingMaterialModel, projectId, dataToCache: doc })


    return res.status(200).json({ ok: true, message: "Item deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};



// WHATSAPP LINK API

const generateOrderingMaterialLink = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    const form = await OrderingMaterialModel.findOne({ projectId });
    if (!form) return res.status(404).json({ ok: false, message: "Ordering Material Form not found" });

    if (form.generatedLink) {
      return res.status(400).json({ ok: false, message: "Link already generated" });
    }

    const token = generateOrderingToken();

    form.generatedLink = `${process.env.FRONTEND_URL}/ordermaterial/public/${projectId}/${token}`;
    await form.save();

    return res.status(200).json({
      ok: true,
      message: "Link generated successfully",
      data: {
        token,
        shareableUrl: form.generatedLink,
      },
    });
  }
  catch (error) {
    return res.status(500).json({ ok: false, message: "server error" });
  }
};


const getOrderingMaterialPublicDetails = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, token } = req.params;

    const form = await OrderingMaterialModel.findOne({ projectId });
    if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

    // if (form.generatedLink !== token) {
    //   return res.status(403).json({ ok: false, message: "Invalid or unauthorized token" });
    // }
    return res.status(200).json({
      ok: true,
      data: {
        shopDetails: form.shopDetails,
        deliveryLocationDetails: form.deliveryLocationDetails,
        materialOrderingList: form.materialOrderingList,
        uploads: form.uploads,
      },
    });
  }
  catch (error) {
    return res.status(500).json({ ok: false, message: "server error" });
  }
};




// COMMON STAGE CONTROLLERS

const setOrderMaterialFileStageDeadline = (req: Request, res: Response): Promise<any> => {
  return handleSetStageDeadline(req, res, {
    model: OrderingMaterialModel,
    stageName: "Ordering Material"
  });
};



const orderMaterialCompletionStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    const form = await OrderingMaterialModel.findOne({ projectId });

    if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

    form.status = "completed";
    form.isEditable = false
    timerFunctionlity(form, "completedAt")
    await form.save();

    if (form.status === "completed") {
      // await autoCreateCostEstimationRooms(req, res, projectId)
      await syncMaterialArrival(projectId)



      let uploadedFiles: DocUpload[] = form.uploads?.map((file: any) => ({
        type: file.type,
        url: file.url,
        originalName: file.originalName,
      })) || []
    



    await addOrUpdateStageDocumentation({
      projectId,
      stageNumber: "6", // ✅ Put correct stage number here
      description: "Ordering Material Stage is documented",
      uploadedFiles, // optionally add files here
    })


  }

    // const redisMainKey = `stage:OrderingMaterialModel:${projectId}`

    // await redisClient.set(redisMainKey, JSON.stringify(form.toObject()), { EX: 60 * 10 })

    await populateWithAssignedToField({ stageModel: OrderingMaterialModel, projectId, dataToCache: form })


  res.status(200).json({ ok: true, message: "order material stage marked as completed", data: form });

  updateProjectCompletionPercentage(projectId);

} catch (err) {
  console.error(err);
  return res.status(500).json({ ok: false, message: "Server error, try again after some time" });
}
};


// FILE UPLOAD CONTROLLLERS

const uploadOrderMaterialFiles = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ ok: false, message: "No files uploaded" });
    }

    const doc = await OrderingMaterialModel.findOne({ projectId });
    if (!doc) return res.status(404).json({ ok: false, message: "Ordering Materials not found" });

    const uploadedFiles: IUploadFile[] = (req.files as (Express.Multer.File & { location: string })[]).map(
      (file) => ({
        type: file.mimetype.includes("pdf") ? "pdf" : "image",
        url: file.location,
        originalName: file.originalname,
        uploadedAt: new Date(),
      })
    );


    if (!doc.uploads) {
      doc.uploads = []
    }
    doc.uploads.push(...uploadedFiles);

    await doc.save();


    // const redisMainKey = `stage:OrderingMaterialModel:${projectId}`

    // await redisClient.set(redisMainKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })

    await populateWithAssignedToField({ stageModel: OrderingMaterialModel, projectId, dataToCache: doc })



    return res.status(200).json({ ok: true, message: "Files uploaded successfully", data: uploadedFiles });
  } catch (err) {
    console.error("Error uploading files to cost estimation room:", err);
    return res.status(500).json({ ok: false, message: "Internal server error" });
  }
};



const deleteOrderMaterialFile = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, fileId } = req.params;

    const doc = await OrderingMaterialModel.findOne({ projectId });
    if (!doc) return res.status(404).json({ ok: false, message: "Cost Estimation not found" });


    //  // Find the file to delete (to get the URL)
    // const fileToDelete = doc.uploads.find((file: any) => file._id.toString() === fileId);
    // if (!fileToDelete) return res.status(404).json({ ok: false, message: "File not found" });

    // // 🔥 Extract the S3 key from URL (assuming you used s3.upload(...Key))
    // const fileUrl = fileToDelete.url;
    // const bucket = process.env.S3_BUCKET_NAME!;
    // const s3Key = new URL(fileUrl).pathname.slice(1); // Remove leading '/'

    // // 🧽 Delete from S3
    // await s3.deleteObject({
    //   Bucket: bucket,
    //   Key: s3Key,
    // }).promise();

    // 🔁 Remove from DB
    doc.uploads = doc.uploads.filter((file: any) => file._id.toString() !== fileId)


    await doc.save();


    // const redisMainKey = `stage:OrderingMaterialModel:${projectId}`

    // await redisClient.set(redisMainKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })

    await populateWithAssignedToField({ stageModel: OrderingMaterialModel, projectId, dataToCache: doc })



    res.status(200).json({ ok: true, message: "File deleted successfully" });

  } catch (err) {
    console.error("Error deleting uploaded file:", err);
    return res.status(500).json({ ok: false, message: "Internal server error" });
  }
};

export {
  updateShopDetails,
  updateDeliveryLocationDetails,
  addRoomMaterialItem,
  updateRoomMaterials,
  deleteRoomMaterialItem,
  getAllOrderingMaterialDetails,
  getRoomDetailsOrderMaterials,

  generateOrderingMaterialLink,
  getOrderingMaterialPublicDetails,

  uploadOrderMaterialFiles,
  deleteOrderMaterialFile,
  setOrderMaterialFileStageDeadline,
  orderMaterialCompletionStatus
}