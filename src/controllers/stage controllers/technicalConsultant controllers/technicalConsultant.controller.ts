import { Request, Response } from "express";
import { TechnicalConsultationModel } from "../../../models/Stage Models/technical consulatation/technicalconsultation.model";
import { handleSetStageDeadline, timerFunctionlity } from "../../../utils/common features/timerFuncitonality";
import MaterialRoomConfirmationModel from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model";
import { initializeMaterialSelection } from "../material Room confirmation/materialRoomConfirmation.controller";

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

        if(senderRole === "owner"){
            senderModel = "UserModel"
        }
        else if(senderRole === "CTO"){
            senderModel = "CTOModel"
        }
          else if(senderRole === "staff"){
            senderModel = "StaffModel"
        }
          else if(senderRole === "worker"){
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
        return res.status(200).json({ message: "Message added", data: doc.messages, ok: true });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" , ok:false});
    }
};



const getConsultationMessages = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    const doc = await TechnicalConsultationModel.findOne({ projectId })
      .populate("messages.sender"); // if you're using refPath

    if (!doc) {
      return res.status(404).json({ ok: false, message: "No confirmation found on last stage" });
    }

    return res.status(200).json({ ok: true, data: doc });
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
      (m:any) => m._id.toString() === messageId
    );

    if (!msg) {
      return res.status(404).json({ ok: false, message: "Message not found." });
    }

    const isSender = msg.sender.toString() === senderId;
    const isAdmin = senderRole === "owner" || senderRole === "CTO";

    if (!isSender && !isAdmin) {
      return res.status(403).json({ ok: false, message: "Not authorized to edit this message." });
    }

    msg.message = message.trim();
    await consultation.save();

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

        if (techDoc.status === "completed") return res.status(400).json({ ok: false, message: "Already completed" });

        techDoc.status = "completed";
        timerFunctionlity(techDoc, "completedAt")
        techDoc.isEditable = false;

        if (techDoc.status === "completed") {
          let material = await MaterialRoomConfirmationModel.findOne({ projectId });


          if (!material) {
            // material = new MaterialRoomConfirmationModel({
            //   projectId,
            //   status: "pending",
            //   isEditable: true,
            //   timer: {
            //     startedAt: new Date(),
            //     completedAt: null,
            //     deadLine: null
            //   },
            //   rooms:[]
            // })
            material = await initializeMaterialSelection(req, res)
           } else {
            material.status = "pending";
            material.isEditable = true;
            material.timer.startedAt = new Date();

            await material.save()
          }

        }

        await techDoc.save();
        return res.status(200).json({ ok: true, message: "Technical consultant marked as completed", data: techDoc });
    } catch (err) {
        console.error("Technical consultant Complete Error:", err);
        return res.status(500).json({ message: "Internal server error", ok: false });
    }
};



const setTechnicalConsultantStageDeadline = (req: Request, res: Response): Promise<any> => {
    return handleSetStageDeadline(req, res, {
        model: TechnicalConsultationModel,
        stageName: "Technical Consultant"
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