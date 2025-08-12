import { Request, Response } from "express";
import { TechnicalConsultationModel } from "../../../models/Stage Models/technical consulatation/technicalconsultation.model";
import { handleSetStageDeadline, timerFunctionlity } from "../../../utils/common features/timerFuncitonality";
import MaterialRoomConfirmationModel from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model";
import { syncMaterialRoomSelectionStage } from "../material Room confirmation/materialRoomConfirmation.controller";
import redisClient from "../../../config/redisClient";
import { assignedTo, selectedFields } from "../../../constants/BEconstants";
import { populateWithAssignedToField } from "../../../utils/populateWithRedis";
import { updateProjectCompletionPercentage } from "../../../utils/updateProjectCompletionPercentage ";
import { Model } from "mongoose";
import { addOrUpdateStageDocumentation } from "../../documentation controller/documentation.controller";
import { DocUpload } from "../../../types/types";


export const syncTechnicalConsultantStage = async (projectId: string) => {
  let techConsultant = await TechnicalConsultationModel.findOne({ projectId });


  if (!techConsultant) {
    techConsultant = new TechnicalConsultationModel({
      projectId,
      status: "pending",
      isEditable: true,
      assignedTo: null,
      timer: {
        startedAt: new Date(),
        completedAt: null,
        deadLine: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        reminderSent: false
      },
      messages: []
    })
  } else {
    techConsultant.status = "pending";
    techConsultant.isEditable = true;
    techConsultant.timer = {
      startedAt: new Date(),
      completedAt: null,
      deadLine: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      reminderSent: false
    }
  }

  await techConsultant.save()
  const redisKey = `stage:TechnicalConsultationModel:${projectId}`;
  await redisClient.del(redisKey);
}

const addConsultationMessage = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    let { sender, senderModel, senderRole, message, section } = req.body;
    const files = req.files as Express.Multer.File[];

    // ✅ Check if at least one of message or attachments is provided
    const hasMessage = typeof message === "string" && message.trim().length > 0;
    const hasAttachments = files && files.length > 0;

    if (!hasMessage && !hasAttachments) {
      return res.status(400).json({ message: "Either a message or an attachment must be provided.", ok: false });
    }

    // ✅ Build attachment objects if files exist
    const attachments = (files || []).map((file) => ({
      type: file.mimetype.startsWith("image") ? "image" as const : "pdf" as const,
      url: (file as any).location,
      originalName: file.originalname,
    }));

    if (senderRole === "owner") {
      senderModel = "UserModel"
    }
    else if (senderRole === "CTO") {
      senderModel = "CTOModel"
    }
    else if (senderRole === "staff") {
      senderModel = "StaffModel"
    }
    else if (senderRole === "worker") {
      senderModel = "WorkerModel"
    }

    // ✅ Construct new message
    const newMessage = {
      sender,
      senderModel,
      senderRole,
      message: hasMessage ? message.trim() : "",
      section,
      attachments,
      createdAt: new Date(),
      isEdited: false
    };

    // ✅ Add to existing or create new doc
    let doc = await TechnicalConsultationModel.findOne({ projectId });

    if (!doc) {
      doc = new TechnicalConsultationModel({
        projectId,
        messages: [newMessage],
        timer: { startedAt: new Date() },
      });
    } else {
      doc.messages.push(newMessage);
      // Start timer if it's the first message
      // if (!doc.timer.startedAt) {
      //     doc.timer.startedAt = new Date();
      // }
    }



    await doc.save();

    const populatedDoc = await doc.populate("messages.sender");


    await populateWithAssignedToField({ stageModel: TechnicalConsultationModel, projectId, dataToCache: populatedDoc })

    // const redisMainKey = `stage:TechnicalConsultationModel:${projectId}`
    // await redisClient.set(redisMainKey, JSON.stringify(populatedDoc.toObject()), { EX: 60 * 10 })


    return res.status(200).json({ message: "Message added", data: doc.messages, ok: true });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error", ok: false });
  }
};



const getConsultationMessages = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    const redisMainKey = `stage:TechnicalConsultationModel:${projectId}`
    const redisCachedData = await redisClient.get(redisMainKey)
    await redisClient.del(redisMainKey)


    if (redisCachedData) {
      return res.json({ message: "data fetched from the cache", data: JSON.parse(redisCachedData), ok: true })
    }


    const doc = await TechnicalConsultationModel.findOne({ projectId })
      .populate("messages.sender")
    // .populate({
    //   path: "messages",
    //   populate: {
    //     path: "sender",
    //     strictPopulate: false // important for refPath
    //   }
    // });

    // console.log("doc", doc)
    if (!doc) {
      return res.status(404).json({ ok: false, message: "No confirmation found on last stage" });
    }

    // console.log("doc", doc)
    // await redisClient.set(redisMainKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })

    await populateWithAssignedToField({ stageModel: TechnicalConsultationModel, projectId, dataToCache: doc })


    return res.status(200).json({ ok: true, data: doc, message: "fetch successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error while fetching messages." });
  }
};


const deleteConsultationMessage = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, messageId } = req.params;
    const { senderId, senderRole } = req.body;

    if (!messageId) {
      return res.status(400).json({ ok: false, message: "message ID is required" });
    }

    const consultation = await TechnicalConsultationModel.findOne({ projectId });
    if (!consultation) {
      return res.status(404).json({ ok: false, message: "Consultation not found." });
    }

    const msgIndex = consultation.messages.findIndex((msg) =>
      (msg as any)._id.toString() === messageId
    );

    if (msgIndex === -1) {
      return res.status(404).json({ ok: false, message: "Message not found." });
    }

    const message = consultation.messages[msgIndex];

    const isSender = message.sender.toString() === senderId;
    const isAdmin = senderRole === "owner" || senderRole === "CTO";

    if (!isSender && !isAdmin) {
      return res.status(403).json({ ok: false, message: "Not authorized to delete this message." });
    }

    consultation.messages.splice(msgIndex, 1);
    await consultation.save();

    const populatedData = await consultation.populate("messages.sender")


    // const redisMainKey = `stage:TechnicalConsultationModel:${projectId}`
    // await redisClient.set(redisMainKey, JSON.stringify(populatedData.toObject()), { EX: 60 * 10 })

    await populateWithAssignedToField({ stageModel: TechnicalConsultationModel, projectId, dataToCache: populatedData })


    return res.status(200).json({ ok: true, message: "Message deleted." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error while deleting message." });
  }
};

const editConsultationMessage = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, messageId } = req.params;
    const { senderId, senderRole, message } = req.body;

    if (!messageId) {
      return res.status(400).json({ ok: false, message: "message ID is requied" });
    }

    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({ ok: false, message: "Message content is required." });
    }

    const consultation = await TechnicalConsultationModel.findOne({ projectId });
    if (!consultation) {
      return res.status(404).json({ ok: false, message: "Consultation not found." });
    }

    const msg = consultation.messages.find(
      (m: any) => m._id.toString() === messageId
    );

    if (!msg) {
      return res.status(404).json({ ok: false, message: "Message not found." });
    }

    const isSender = msg.sender.toString() === senderId;
    const isAdmin = senderRole === "owner" || senderRole === "CTO";

    if (!isSender && !isAdmin) {
      return res.status(404).json({ ok: false, message: "Not authorized to edit this message." });
    }

    let senderModel;
    if (senderRole === "owner") {
      senderModel = "UserModel"
    }
    else if (senderRole === "CTO") {
      senderModel = "CTOModel"
    }
    else if (senderRole === "staff") {
      senderModel = "StaffModel"
    }
    else if (senderRole === "worker") {
      senderModel = "WorkerModel"
    }


    msg.message = message.trim();
    msg.senderRole = senderRole
    msg.senderModel = senderModel!;
    msg.isEdited = true
    msg.createdAt = new Date()
    await consultation.save();

    const populatedData = await consultation.populate("messages.sender")


    // const redisMainKey = `stage:TechnicalConsultationModel:${projectId}`
    // await redisClient.set(redisMainKey, JSON.stringify(populatedData.toObject()), { EX: 60 * 10 })

    await populateWithAssignedToField({ stageModel: TechnicalConsultationModel, projectId, dataToCache: populatedData })


    return res.status(200).json({ ok: true, message: "Message updated successfully.", data: msg });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, message: "Server error while editing message." });
  }
};



const tehnicalConsultantCompletionStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    if (!projectId) return res.status(400).json({ ok: false, message: "Project ID is required" });

    const techDoc = await TechnicalConsultationModel.findOne({ projectId });
    if (!techDoc) return res.status(404).json({ ok: false, message: "Technical consultant not found" });

    // if (techDoc.status === "completed") return res.status(400).json({ ok: false, message: "Already completed" });

    techDoc.status = "completed";
    timerFunctionlity(techDoc, "completedAt")
    techDoc.isEditable = false;

    if (techDoc.status === "completed") {
      // await initializeMaterialSelection(projectId)
      await syncMaterialRoomSelectionStage(projectId)


      // const uploadedFiles: DocUpload[] = techDoc.messages.flatMap(msgSection => {
      //   if (msgSection.attachments?.length) {
      //     return msgSection.attachments.map((file: any) => {
      //       return {
      //         type: file.type,
      //         url: file.url,
      //         originalName: file.originalName,
      //       }
      //     });
      //   }
      //   return []; // ⚠️ Always return an array from flatMap
      // })

      // await addOrUpdateStageDocumentation({
      //   projectId,
      //   stageNumber: "4", // ✅ Put correct stage number here
      //   description: "Technical consultation Stage is documented",
      //   uploadedFiles, // optionally add files here
      // })

    }

    await techDoc.save();
    const populatedData = await techDoc.populate("messages.sender")


    // const redisMainKey = `stage:TechnicalConsultationModel:${projectId}`
    // await redisClient.set(redisMainKey, JSON.stringify(populatedData.toObject()), { EX: 60 * 10 })

    await populateWithAssignedToField({ stageModel: TechnicalConsultationModel, projectId, dataToCache: populatedData })


    res.status(200).json({ ok: true, message: "Technical consultant marked as completed", data: techDoc });
    updateProjectCompletionPercentage(projectId);

  } catch (err) {
    console.error("Technical consultant Complete Error:", err);
    return res.status(500).json({ message: "Internal server error", ok: false });
  }
};



const setTechnicalConsultantStageDeadline = (req: Request, res: Response): Promise<any> => {
  return handleSetStageDeadline(req, res, {
    model: TechnicalConsultationModel,
    stageName: "Technical Consultant",
    populate: "messages.sender"
  });
};

export {
  addConsultationMessage,
  getConsultationMessages,
  deleteConsultationMessage,
  editConsultationMessage,

  tehnicalConsultantCompletionStatus,
  setTechnicalConsultantStageDeadline
}