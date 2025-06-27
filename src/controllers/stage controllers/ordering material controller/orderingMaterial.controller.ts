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

export const syncOrderingMaterials = async (projectId: string) => {

  const existing = await OrderingMaterialModel.findOne({ projectId });

  if (!existing) {
    const timer: IMaterialOrderingTimer = {
      startedAt: new Date(),
      completedAt: null,
      deadLine: null,
      reminderSent: false,
    };

    await OrderingMaterialModel.create({
      projectId: projectId,
      status: "pending",
      isEditable: true,
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
}

const getAllOrderingMaterialDetails = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    const doc = await OrderingMaterialModel.findOne({ projectId });

    if (!doc) return res.status(404).json({ ok: false, message: "Data not found" });

    return res.status(200).json({ ok: true, data: doc });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

const getRoomDetailsOrderMaterials = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, roomKey } = req.params;

    const doc = await OrderingMaterialModel.findOne({ projectId });

    if (!doc) return res.status(404).json({ ok: false, message: "Data not found" });

    const roomData: any = (doc.materialOrderingList as any)[roomKey];

    if (!roomData)
      return res.status(400).json({ ok: false, message: `Room '${roomKey}' not found` });

    return res.status(200).json({ ok: true, data: roomData });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};


const updateShopDetails = async (req: Request, res: Response): Promise<any> => {
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

  res.status(200).json({ ok: true, message: "Shop details updated", data: orderingDoc.shopDetails });
};



const updateDeliveryLocationDetails = async (req: Request, res: Response): Promise<any> => {
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

  res.status(200).json({ ok: true, message: "Delivery location updated", data: orderingDoc.deliveryLocationDetails });
};

// PATCH /api/ordering-materials/:projectId/room/:roomKey
const updateRoomMaterials = async (req: Request, res: Response): Promise<any> => {
  const { projectId, roomKey } = req.params;
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ ok: false, message: "Items array is required and cannot be empty." });
  }

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

  const requiredFields = requiredFieldsByRoom[roomKey as keyof typeof requiredFieldsByRoom];
  if (!requiredFields) {
    return res.status(400).json({ ok: false, message: `Invalid room key: ${roomKey}` });
  }

  for (const [i, item] of items.entries()) {
    for (const field of requiredFields) {
      if (!item[field]) {
        return res.status(400).json({
          ok: false,
          message: `Missing field "${field}" in item at index ${i}`,
        });
      }
    }
  }

  const orderingDoc = await OrderingMaterialModel.findOneAndUpdate(
    { projectId },
    {
      $set: {
        [`materialOrderingList.${roomKey}`]: items,
      },
    },
    { new: true, upsert: true }
  );

  res.status(200).json({ ok: true, message: `Room '${roomKey}' materials updated.`, data: (orderingDoc.materialOrderingList as any)[roomKey] });
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

    return res.status(200).json({ ok: true, message: "Item deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};



// WHATSAPP LINK API

const generateOrderingMaterialLink = async (req: Request, res: Response): Promise<any>  => {
  const { projectId } = req.params;

  const form = await OrderingMaterialModel.findOne({ projectId });
  if (!form) return res.status(404).json({ ok: false, message: "Ordering Material Form not found" });

  if (form.generatedLink) {
    return res.status(400).json({ ok: false, message: "Link already generated" });
  }

  const token = generateOrderingToken();
  form.generatedLink = token;
  await form.save();

  return res.status(200).json({
    ok: true,
    message: "Link generated successfully",
    data: {
      token,
      shareableUrl: `${process.env.BASE_URL}/orderingmaterial/public/${projectId}/${token}`,
    },
  });
};


const getOrderingMaterialPublicDetails = async (req: Request, res: Response): Promise<any>  => {
  const { projectId, token } = req.params;

  const form = await OrderingMaterialModel.findOne({ projectId });
  if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

  if (form.generatedLink !== token) {
    return res.status(403).json({ ok: false, message: "Invalid or unauthorized token" });
  }
console.log("form at the link", form)
  return res.status(200).json({
    ok: true,
    data: {
      shopDetails: form.shopDetails,
      deliveryLocationDetails: form.deliveryLocationDetails,
      materialOrderingList: form.materialOrderingList,
      uploads: form.uploads,
    },
  });
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

    // if (form.status === "completed") {
    //   await autoCreateCostEstimationRooms(req, res, projectId)
    // }

    await syncMaterialArrival(projectId)

    return res.status(200).json({ ok: true, message: "cost estimation stage marked as completed", data: form });
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

    return res.status(200).json({ ok: true, message: "File deleted successfully" });
  } catch (err) {
    console.error("Error deleting uploaded file:", err);
    return res.status(500).json({ ok: false, message: "Internal server error" });
  }
};

export {
  updateShopDetails,
  updateDeliveryLocationDetails,
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