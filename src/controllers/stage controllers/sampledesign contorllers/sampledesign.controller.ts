import { Request, Response } from "express";
import { IFileItem, SampleDesignModel } from "../../../models/Stage Models/sampleDesing model/sampleDesign.model";
import { handleSetStageDeadline } from "../../../utils/common features/timerFuncitonality";
import { TechnicalConsultationModel } from "../../../models/Stage Models/technical consulatation/technicalconsultation.model";
import redisClient from "../../../config/redisClient";

const addRoom = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    const { roomName } = req.body;

    if (!roomName || typeof roomName !== "string") {
      return res.status(400).json({ message: "Room name is required." });
    }

    const design = await SampleDesignModel.findOne({ projectId });

    if (!design) {
      const newDesign = new SampleDesignModel({
        projectId,
        rooms: [{ roomName, files: [] }]
      });
      await newDesign.save();
      return res.status(201).json({ message: "Room created", data: newDesign.rooms });
    }

    const roomExists = design.rooms.some(room => room.roomName === roomName);
    if (roomExists) {
      return res.status(400).json({ message: "Room already exists." });
    }

    design.rooms.push({ roomName, files: [] });
    await design.save();


    const redisMainKey = `stage:SampleDesignModel:${projectId}`
    await redisClient.set(redisMainKey, JSON.stringify(design.toObject()), { EX: 60 * 10 })

    return res.status(200).json({ message: "Room added", data: design.rooms });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const uploadFilesToRoom = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, roomName } = req.params;
    const files = req.files as (Express.Multer.File & { location: string })[];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded." });
    }

    const design = await SampleDesignModel.findOne({ projectId });
    if (!design) {
      return res.status(404).json({ message: "Sample design not found." });
    }

    const room = design.rooms.find(r => r?.roomName === roomName);
    if (!room) {
      return res.status(404).json({ message: "Room not found." });
    }

    const mappedFiles: IFileItem[] = files.map(file => {
      const type: "image" | "pdf" = file.mimetype.startsWith("image") ? "image" : "pdf";
      return {
        type,
        url: file.location,
        originalName: file.originalname,
        uploadedAt: new Date()
      };
    });


    room.files.push(...mappedFiles);
    await design.save();

    const redisMainKey = `stage:SampleDesignModel:${projectId}`
    await redisClient.set(redisMainKey, JSON.stringify(design.toObject()), { EX: 60 * 10 })

    return res.status(200).json({ message: "Files uploaded to room", data: room, ok: true });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const getFilesFromRoom = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;


    if (!projectId) {
      return res.status(400).json({ message: "projectId is mandatory" })
    }


    const redisMainKey = `stage:SampleDesignModel:${projectId}`

    const redisCachedData = await redisClient.get(redisMainKey)

    if (redisCachedData) {
      return res.json({ message: "data fetched from the cache", data: JSON.parse(redisCachedData), ok: true })
    }

    const design = await SampleDesignModel.findOne({ projectId });

    if (!design) {
      return res.status(404).json({ message: "Sample design not found." });
    }

    console.log("design of the smaple deisng", design)
    // const room = design.rooms.find(r => r.roomName === roomName);
    // if (!room) {
    //   return res.status(404).json({ message: `${roomName} not found.`, ok:false });
    // }


    await redisClient.set(redisMainKey, JSON.stringify(design.toObject()), { EX: 60 * 10 })

    return res.status(200).json({ data: design, ok: true, message: "fetched successfully uploads" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", ok: false });
  }
};

const deleteFileFromRoom = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, roomName, fileIndex } = req.params;

    if (!projectId) {
      return res.status(400).json({ message: "projectId is requried", ok: false })
    }

    const design = await SampleDesignModel.findOne({ projectId });
    if (!design) {
      return res.status(404).json({ message: "Sample design not found." });
    }

    const room = design.rooms.find(r => r.roomName === roomName);
    if (!room || !room.files[+fileIndex]) {
      return res.status(404).json({ message: "File not found in room." });
    }

    room.files.splice(+fileIndex, 1);
    await design.save();


    const redisMainKey = `stage:SampleDesignModel:${projectId}`
    await redisClient.set(redisMainKey, JSON.stringify(design.toObject()), { EX: 60 * 10 })

    return res.status(200).json({ message: "File deleted", data: room });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};


const deleteRoom = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, roomId } = req.params;

    if (!projectId) {
      return res.status(400).json({ message: "projectId is requried", ok: false })
    }

    const design = await SampleDesignModel.findOneAndDelete({ projectId });
    if (!design) {
      return res.status(404).json({ message: "Sample design not found.", ok: true });
    }


    const redisMainKey = `stage:SampleDesignModel:${projectId}`
    await redisClient.set(redisMainKey, JSON.stringify(design.toObject()), { EX: 60 * 10 })

    return res.status(200).json({ message: "Room deleted", data: design, ok: true });
  } catch (error) {
    return res.status(500).json({ message: "Server error", ok: true });
  }
}


const sampleDesignCompletionStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    if (!projectId) return res.status(400).json({ ok: false, message: "Project ID is required" });

    const design = await SampleDesignModel.findOne({ projectId });
    if (!design) return res.status(404).json({ ok: false, message: "Sample design not found" });

    if (design.status === "completed") return res.status(400).json({ ok: false, message: "Already completed" });

    design.status = "completed";
    design.isEditable = false;

    if (design.status === "completed") {

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
            deadLine: null
          },
          messages: []
        })
      } else {
        techConsultant.status = "pending";
        techConsultant.isEditable = true;
        techConsultant.timer.startedAt = new Date();

      }

      await techConsultant.save()
    }

    await design.save();

    const redisKey = `stage:SampleDesignModel:${projectId}`
    await redisClient.set(redisKey, JSON.stringify(design.toObject()), { EX: 60 * 10 });

    return res.status(200).json({ ok: true, message: "Sample design marked as completed", data: design });
  } catch (err) {
    console.error("Sample design Complete Error:", err);
    return res.status(500).json({ message: "Internal server error", ok: false });
  }
};


const setSampleDesignStageDeadline = (req: Request, res: Response): Promise<any> => {
  return handleSetStageDeadline(req, res, {
    model: SampleDesignModel,
    stageName: "Sample Design"
  });
};

export {
  addRoom,
  uploadFilesToRoom,
  getFilesFromRoom,
  deleteFileFromRoom,
  deleteRoom,

  sampleDesignCompletionStatus,
  setSampleDesignStageDeadline,
};
