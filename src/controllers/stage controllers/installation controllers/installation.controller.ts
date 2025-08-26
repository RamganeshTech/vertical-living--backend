import { Request, Response } from "express";
import InstallationModel from "../../../models/Stage Models/installation model/Installation.model";
import { handleSetStageDeadline, timerFunctionlity } from "../../../utils/common features/timerFuncitonality";
import redisClient from "../../../config/redisClient";
import { populateWithAssignedToField } from "../../../utils/populateWithRedis";
import { syncQualityCheck } from "../QualityCheck controllers/QualityCheck.controller";
import { updateProjectCompletionPercentage } from "../../../utils/updateProjectCompletionPercentage ";
import { DocUpload } from "../../../types/types";
import { addOrUpdateStageDocumentation } from "../../documentation controller/documentation.controller";
import { validRoomKeys } from "../../../constants/BEconstants";
import { DailyScheduleModel, DailyTaskSubModel } from "../../../models/Stage Models/WorkTask Model/dailySchedule.model";
import mongoose from "mongoose"



// export const syncInstallationWork = async (projectId: string) => {

//   const dailySchedule = await DailyScheduleModel.findOne({ projectId });

//   if (!dailySchedule) {
//     console.log("work schedule is not created")
//     return
//   }

//   // 2. Group uploads by taskName
//   const taskUploadsMap: Record<string, { url: string }[]> = {};

//   dailySchedule.tasks.forEach(task => {
//     const allImages: { url: string }[] = [];

//     task?.dates?.forEach(dateEntry => {
//       dateEntry?.uploads?.forEach(upload => {
//         if (upload.fileType === "image" && upload?.url) {
//           allImages.push({ url: upload?.url });
//         }
//       });
//     });

//     if (!taskUploadsMap[task.taskName]) {
//       taskUploadsMap[task.taskName] = [];
//     }
//     taskUploadsMap[task.taskName].push(...allImages);
//   });


//   const existing = await InstallationModel.findOne({ projectId });


//   const timer = {
//     startedAt: new Date(),
//     completedAt: null,
//     deadLine: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
//     reminderSent: false,
//   };

//   if (!existing) {
//     // Create fresh Installation document
//     let installationDoc = new InstallationModel({
//       projectId,
//       isEditable: true,
//       status: "pending",
//       timer,
//       assignedTo: null,

//       tasks: Object.entries(taskUploadsMap).map(([workName, images]) => ({
//         workName,
//         images,
//         status: "pending"
//       }))
//     });

//     await installationDoc.save()
//   } else {
//     // Update existing Installation document
//     Object.entries(taskUploadsMap).forEach(([workName, images]) => {
//       let existingTask = existing.tasks.find(t => t.workName === workName);
//       if (!existingTask) {
//         // Add new task if it doesn't exist
//         existing.tasks.push({
//           workName,
//           images,
//           status: "pending"
//         });
//       } else {
//         // Merge new images (avoid duplicates)
//         const existingUrls = new Set(existingTask.images.map(img => img.url));
//         images.forEach(img => {
//           if (!existingUrls.has(img.url)) {
//             existingTask.images.push(img);
//           }
//         });
//       }
//     });

//     // 4. Save to DB
//     await existing.save();
//   }


//   const redisKey = `stage:InstallationModel:${projectId}`;
//   await redisClient.del(redisKey);
// }


export const syncInstallationWork = async (projectId: string) => {
  try {
    // 1. Fetch all daily schedules for this project
    const dailySchedules = await DailyTaskSubModel.find({ projectId });

    if (!dailySchedules || dailySchedules.length === 0) {
      console.log("No daily schedules found for this project");
      return;
    }

    // 2. Aggregate images grouped by workDescription
    const taskUploadsMap: Record<string, { url: string }[]> = {};

    dailySchedules.forEach(schedule => {
      schedule.dailyTasks.forEach(task => {
        const allImages: { url: string }[] = [];

        task.uploadedImages.forEach(dateEntry => {
          dateEntry.uploads.forEach(upload => {
            if (upload.fileType === "image" && upload.url) {
              allImages.push({ url: upload.url });
            }
          });
        });

        if (!taskUploadsMap[task.workDescription]) {
          taskUploadsMap[task.workDescription] = [];
        }
        taskUploadsMap[task.workDescription].push(...allImages);
      });
    });

    // 3. Fetch or create the Installation document for this project
    let installation = await InstallationModel.findOne({ projectId });
    if (!installation) {
      installation = new InstallationModel({
        projectId,
        isEditable: true,
        status: "pending",
        tasks: Object.entries(taskUploadsMap).map(([workName, images]) => ({
          workName,
          images: images.map(img => ({ url: img.url })), // convert to { url } objects
          status: "pending"
        }))
      });

      await installation.save();
    }

    // 4. Update tasks array in Installation schema
    for (const [workName, images] of Object.entries(taskUploadsMap)) {
      const existingTask = installation.tasks.find(t => t.workName === workName);
      if (existingTask) {
        // Merge new images without duplicates
        const existingUrls = new Set(existingTask.images.map(i => i.url));
        images.forEach(img => {
          if (!existingUrls.has(img.url)) existingTask.images.push({ url: img.url });
        });
      } else {
        // Add a new task entry
        installation.tasks.push({ workName, images: images.map(img => ({ url: img.url })), status: "pending" });
      }
    }

    await installation.save();
    console.log("Installation tasks synced successfully!");
  } catch (error) {
    console.error("Error syncing installation work:", error);
    throw error;
  }
};




export const validRooms = [
  "LivingRoom",
  "Bedroom",
  "Kitchen",
  "DiningRoom",
  "Balcony",
  "FoyerArea",
  "Terrace",
  "StudyRoom",
  "CarParking",
  "Garden",
  "StorageRoom",
  "EntertainmentRoom",
  "HomeGym",
];



export const updateInstallationTaskStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, taskId } = req.params;
    const { status } = req.body;
    console.log("tasks id", taskId)
    console.log("projectId", projectId)
    // Find and update the task
    const updatedSchedule = await InstallationModel.findOneAndUpdate(
      {
        projectId: new mongoose.Types.ObjectId(projectId),
        "tasks._id": new mongoose.Types.ObjectId(taskId)
      },
      { $set: { "tasks.$.status": status } },
      { new: true }
    );

    if (!updatedSchedule) {
      return res.status(404).json({ message: "Task not found", ok: false });
    }

    await populateWithAssignedToField({ stageModel: InstallationModel, projectId, dataToCache: updatedSchedule })


    res.status(200).json({
      message: "Task status updated successfully",
      updatedSchedule,
      ok: true
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({ message: "Internal server error", ok: false });
  }
};


// const createInstallationItem = async (req: Request, res: Response): Promise<any> => {
//   try {

//     const { projectId, roomName } = req.params

//     const { workName, descritpion, completedDate } = req.body;

//     if (!projectId || !roomName || !workName) {
//       return res.status(400).json({ ok: false, message: "projectId, roomName, workName are required." });
//     }

//     if (!validRooms.includes(roomName)) {
//       return res.status(400).json({ ok: false, message: "Invalid room name." });
//     }

//     let validatedUpload = null;
//     if (req.file) {
//       const { mimetype, location, originalname } = req.file as any;
//       if (!mimetype.startsWith("image/")) {
//         return res.status(400).json({ ok: false, message: "Only image uploads are allowed." });
//       }
//       validatedUpload = {
//         type: "image",
//         url: location,
//         originalName: originalname,
//         uploadedAt: new Date(),
//       };
//     }

//     const newItem = {
//       workName,
//       descritpion: descritpion || "",
//       completedDate: completedDate ? new Date(completedDate) : null,
//       upload: validatedUpload,
//     };

//     const doc: any = await InstallationModel.findOneAndUpdate(
//       { projectId },
//       { $push: { [roomName]: newItem } },
//       { new: true }
//     );

//     if (!doc) return res.status(404).json({ ok: false, message: "Installation record not found." });

//     // const redisMainKey = `stage:InstallationModel:${projectId}`
//     const redisRoomKey = `stage:InstallationModel:${projectId}:room:${roomName}`

//     const updatedRoom = doc[roomName]
//     // await redisClient.set(redisMainKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })
//     await populateWithAssignedToField({ stageModel: InstallationModel, projectId, dataToCache: doc })

//     await redisClient.set(redisRoomKey, JSON.stringify(updatedRoom), { EX: 60 * 10 })

//     return res.json({ ok: true, data: doc[roomName] });
//   } catch (err: any) {
//     console.error(err);
//     return res.status(500).json({ ok: false, message: err.message });
//   }
// };


// const editInstallationItem = async (req: Request, res: Response): Promise<any> => {
//   try {


//     const { projectId, roomName } = req.params


//     const { itemId, workName, descritpion, completedDate, } = req.body;

//     if (!projectId || !roomName || !itemId) {
//       return res.status(400).json({ ok: false, message: "projectId, roomName, and itemId are required." });
//     }

//     if (!validRooms.includes(roomName)) {
//       return res.status(400).json({ ok: false, message: "Invalid room name." });
//     }

//     const doc: any = await InstallationModel.findOne({ projectId });
//     if (!doc) return res.status(404).json({ ok: false, message: "Installation record not found." });

//     const item = doc[roomName].id(itemId);
//     if (!item) return res.status(404).json({ ok: false, message: "Item not found." });

//     if (workName) item.workName = workName;
//     if (descritpion !== undefined) item.descritpion = descritpion;
//     if (completedDate) item.completedDate = new Date(completedDate);

//     if (req.file) {
//       const { mimetype, location, originalname } = req.file as any;

//       if (!mimetype.startsWith("image/")) {
//         return res.status(400).json({ ok: false, message: "Only image uploads are allowed." });
//       }

//       item.upload = {
//         type: "image",
//         url: location,
//         originalName: originalname,
//         uploadedAt: new Date(),
//       };
//     }

//     await doc.save();


//     // const redisMainKey = `stage:InstallationModel:${projectId}`
//     const redisRoomKey = `stage:InstallationModel:${projectId}:room:${roomName}`

//     const updatedRoom = doc[roomName]
//     // await redisClient.set(redisMainKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })
//     await populateWithAssignedToField({ stageModel: InstallationModel, projectId, dataToCache: doc })

//     await redisClient.set(redisRoomKey, JSON.stringify(updatedRoom), { EX: 60 * 10 })

//     return res.json({ ok: true, data: item, message: "updated successull" });
//   } catch (error) {
//     console.error("Error editing installation item:", error);
//     return res.status(500).json({ ok: false, message: "Server error." });
//   }
// };

// const deleteInstallationItem = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { roomName, itemId } = req.body;
//     const { projectId } = req.params
//     if (!projectId || !roomName || !itemId) {
//       return res.status(400).json({ ok: false, message: "projectId, roomName, and itemId are required." });
//     }

//     if (!validRooms.includes(roomName)) {
//       return res.status(400).json({ ok: false, message: "Invalid room name." });
//     }

//     const doc = await InstallationModel.findOneAndUpdate(
//       { projectId },
//       { $pull: { [roomName]: { _id: itemId } } },
//       { new: true }
//     );

//     if (!doc) {
//       return res.status(404).json({ ok: false, message: "Installation record not found." });
//     }

//     // const redisMainKey = `stage:InstallationModel:${projectId}`
//     const redisRoomKey = `stage:InstallationModel:${projectId}:room:${roomName}`

//     const updatedRoom = (doc as any)[roomName]
//     // await redisClient.set(redisMainKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })
//     await populateWithAssignedToField({ stageModel: InstallationModel, projectId, dataToCache: doc })

//     await redisClient.set(redisRoomKey, JSON.stringify(updatedRoom), { EX: 60 * 10 })

//     return res.json({ ok: true, success: true, message: "Item deleted successfully." });
//   } catch (error) {
//     console.error("Error deleting installation item:", error);
//     return res.status(500).json({ ok: false, message: "Server error." });
//   }
// };

const getInstallationDetails = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    const redisMainKey = `stage:InstallationModel:${projectId}`
    // await redisClient.del(redisMainKey)
    const cachedData = await redisClient.get(redisMainKey)

    if (cachedData) {
      return res.status(200).json({ message: "data fetched from the cache", data: JSON.parse(cachedData), ok: true })
    }

    const doc = await InstallationModel.findOne({ projectId });
    if (!doc) return res.status(404).json({ ok: false, message: "Installation record not found." });

    // await redisClient.set(redisMainKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })
    await populateWithAssignedToField({ stageModel: InstallationModel, projectId, dataToCache: doc })

    return res.status(200).json({ ok: true, data: doc, message: "fetched properly" });
  } catch (error) {
    console.error("Error fetching installation details:", error);
    return res.status(500).json({ ok: false, message: "Server error." });
  }
};

// const getInstallationRoomDetails = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId, roomName } = req.params;

//     if (!validRooms.includes(roomName)) {
//       return res.status(400).json({ ok: false, message: "Invalid room name." });
//     }

//     const redisRoomKey = `stage:InstallationModel:${projectId}:room:${roomName}`

//     const cachedData = await redisClient.get(redisRoomKey)

//     if (cachedData) {
//       return res.status(200).json({ message: "data fetched from the cache", data: JSON.parse(cachedData), ok: true })
//     }


//     const doc: any = await InstallationModel.findOne({ projectId });
//     if (!doc) return res.status(404).json({ ok: false, message: "Installation record not found." });

//     await redisClient.set(redisRoomKey, JSON.stringify(doc[roomName]), { EX: 60 * 10 })


//     return res.json({ ok: true, success: true, data: doc[roomName] });
//   } catch (error) {
//     console.error("Error fetching room details:", error);
//     return res.status(500).json({ ok: false, message: "Server error." });
//   }
// };



// COMMON CONTOROLLER


const setInstallationStageDeadline = (req: Request, res: Response): Promise<any> => {
  return handleSetStageDeadline(req, res, {
    model: InstallationModel,
    stageName: "Installation and Checking"
  });
};



const installationCompletionStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    const form: any = await InstallationModel.findOne({ projectId });

    if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

    form.status = "completed";
    form.isEditable = false
    timerFunctionlity(form, "completedAt")
    await form.save();

    if (form.status === "completed") {
      // await syncQualityCheck(projectId)

      // let uploadedFiles: DocUpload[] = [];



      // const roomKeys = validRoomKeys.filter((key) => {
      //   const roomItems = form?.[key];
      //   return (
      //     Array.isArray(roomItems) &&
      //     roomItems.some((item: any) => item?.upload?.url) // has at least one upload
      //   );
      // });



      // console.log("roomKeys", roomKeys)
      // for (const room of roomKeys) {
      //   const items = form[room] || [];

      //   items.forEach((item: any) => {
      //     if (item.upload?.url) {
      //       uploadedFiles.push({
      //         type: item.upload.type,
      //         url: item.upload.url,
      //         originalName: item.upload.originalName,
      //       });
      //     }
      //   });
      // }

      // await addOrUpdateStageDocumentation({
      //   projectId,
      //   stageNumber: "11", // Installation Stage
      //   description: "Installation Stage is documented",
      //   uploadedFiles,
      // });

    }

    // const redisMainKey = `stage:InstallationModel:${projectId}`
    // await redisClient.set(redisMainKey, JSON.stringify(form.toObject()), { EX: 60 * 10 })
    await populateWithAssignedToField({ stageModel: InstallationModel, projectId, dataToCache: form })

    res.status(200).json({ ok: true, message: "installation check stage marked as completed", data: form });

    updateProjectCompletionPercentage(projectId);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error, try again after some time" });
  }
};

export {
  // createInstallationItem,
  // editInstallationItem,
  // deleteInstallationItem,
  getInstallationDetails,
  // getInstallationRoomDetails,


  setInstallationStageDeadline,
  installationCompletionStatus
};
