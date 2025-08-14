import { Request, Response } from "express";
import { DailyScheduleModel, IUploadFile } from "../../../models/Stage Models/WorkTask Model/dailySchedule.model";
import { Types } from "mongoose";
import redisClient from "../../../config/redisClient";



// const addDailyTask = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { dailyScheduleId, projectId } = req.params;
//     const { taskName, date, description, assignedTo } = req.body;

//     if (!dailyScheduleId || !Types.ObjectId.isValid(dailyScheduleId)) {
//       return res.status(400).json({ ok: false, message: "Valid DailySchedule ID is required" });
//     }


//     console.log("taskName", taskName, date, description, assignedTo)

//     if (!taskName) {
//       return res.status(400).json({ ok: false, message: "Task name, date, and description are required" });
//     }


//     if (assignedTo && !Types.ObjectId.isValid(assignedTo)) {
//       return res.status(400).json({ ok: false, message: "Invalid assignedTo ID" });
//     }

//     // Handle optional upload
//     let upload = undefined;

//     if (req.file) {
//       const { mimetype, location, originalname } = req.file as any;

//       if (!mimetype.startsWith("image/")) {
//         return res.status(400).json({ ok: false, message: "Only image uploads are allowed" });
//       }

//       upload = {
//         type: "image",
//         url: location,
//         originalName: originalname,
//         uploadedAt: new Date(),
//       };
//     }

//     const newTask = {
//       taskName,
//       date,
//       description,
//       status: "not_started",
//       upload, // can be undefined if no file uploaded
//       assignedTo: assignedTo || null
//     };

//     const doc = await DailyScheduleModel.findByIdAndUpdate(
//       dailyScheduleId,
//       { $push: { tasks: newTask } },
//       { new: true }
//     ).populate({
//       path: "tasks.assignedTo",
//       select: "_id email workerName"
//     });

//     if (!doc) {
//       return res.status(404).json({ ok: false, message: "DailySchedule not found" });
//     }

//     const redisDailyScheduleKey = `stage:DailyScheduleModel:${projectId}`
//     await redisClient.set(redisDailyScheduleKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })

//     res.status(201).json({ ok: true, data: doc });
//   } catch (err: any) {
//     res.status(500).json({ ok: false, message: err.message });
//   }
// };



// const updateDailyTask = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { dailyScheduleId, taskId, projectId } = req.params;
//     const { taskName, date, description, status, assignedTo } = req.body;

//     if (!dailyScheduleId || !Types.ObjectId.isValid(dailyScheduleId)) {
//       return res.status(400).json({ ok: false, message: "Valid DailySchedule ID is required" });
//     }
//     if (!taskId || !Types.ObjectId.isValid(taskId)) {
//       return res.status(400).json({ ok: false, message: "Valid Task ID is required" });
//     }

//     if (assignedTo && !Types.ObjectId.isValid(assignedTo)) {
//       return res.status(400).json({ ok: false, message: "Invalid assignedTo ID" });
//     }


//     const updateFields: any = {};
//     if (taskName) updateFields["tasks.$.taskName"] = taskName;
//     if (date) updateFields["tasks.$.date"] = date;
//     if (description) updateFields["tasks.$.description"] = description;
//     if (status) updateFields["tasks.$.status"] = status;
//     if (assignedTo) updateFields["tasks.$.assignedTo"] = assignedTo;


//     if (req.file) {
//       const { mimetype, location, originalname } = req.file as any;
//       if (!mimetype.startsWith("image/")) {
//         return res.status(400).json({ ok: false, message: "Only image uploads are allowed" });
//       }
//       updateFields["tasks.$.upload"] = {
//         type: "image",
//         url: location,
//         originalName: originalname,
//         uploadedAt: new Date(),
//       };
//     }

//     const doc = await DailyScheduleModel.findOneAndUpdate(
//       { _id: dailyScheduleId, "tasks._id": taskId },
//       { $set: updateFields },
//       { new: true }
//     ).populate({
//       path: "tasks.assignedTo",
//       select: "_id email workerName"
//     });

//     if (!doc) {
//       return res.status(404).json({ ok: false, message: "DailySchedule or Task not found" });
//     }

//     const redisDailyScheduleKey = `stage:DailyScheduleModel:${projectId}`
//     await redisClient.set(redisDailyScheduleKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })


//     res.status(200).json({ ok: true, data: doc });
//   } catch (err: any) {
//     res.status(500).json({ ok: false, message: err.message });
//   }
// };

// const deleteDailyTask = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { dailyScheduleId, taskId, projectId } = req.params;

//     if (!dailyScheduleId || !Types.ObjectId.isValid(dailyScheduleId)) {
//       return res.status(400).json({ ok: false, message: "Valid DailySchedule ID is required" });
//     }
//     if (!taskId || !Types.ObjectId.isValid(taskId)) {
//       return res.status(400).json({ ok: false, message: "Valid Task ID is required" });
//     }

//     const doc = await DailyScheduleModel.findByIdAndUpdate(
//       dailyScheduleId,
//       { $pull: { tasks: { _id: taskId } } },
//       { new: true }
//     ).populate({
//       path: "tasks.assignedTo",
//       select: "_id email workerName"
//     });

//     if (!doc) {
//       return res.status(404).json({ ok: false, message: "DailySchedule or Task not found" });
//     }

//     const redisDailyScheduleKey = `stage:DailyScheduleModel:${projectId}`
//     await redisClient.set(redisDailyScheduleKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })


//     res.status(200).json({ ok: true, message: "Task deleted successfully", data: doc });
//   } catch (err: any) {
//     res.status(500).json({ ok: false, message: err.message });
//   }
// };





export const createWork = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params
    const { taskName, description, assignedTo, dates } = req.body;

    console.log("dates", dates)
    // Validate: uploads should not be sent during creation
    // if (req.body.uploads && req.body.uploads.length > 0) {
    //   return res.status(400).json({ message: "Uploads are not allowed when creating a work.", ok: false });
    // }

    // Find or create DailySchedule for project
    let dailySchedule = await DailyScheduleModel.findOne({ projectId });

    // Check duplicate task name in same project (case-sensitive)
    if (dailySchedule && dailySchedule.tasks.some(task => task.taskName === taskName)) {
      return res.status(400).json({ message: "Task name already exists for this project.", ok: false });
    }

    // If no schedule exists, create a new one
    if (!dailySchedule) {
      dailySchedule = new DailyScheduleModel({
        projectId,
        tasks: [{
          taskName,
          description,
          assignedTo: assignedTo || null,
          dates: dates.map((date: any) => {
            return {
              date: date.date,
              uploads: []
            }
          }),
          status: "pending"
        }]
      });
    }

    // Add new task
    dailySchedule.tasks.push({
      taskName,
      description,
      assignedTo: assignedTo || null,
      dates: dates.map((date: any) => {
        return {
          date: date.date,
          uploads: []
        }
      }),
      status: "pending"
    });

    await dailySchedule.save();

    return res.status(201).json({ message: "Work created successfully", ok: true, data: dailySchedule.tasks });
  } catch (error) {
    console.error("Error creating work:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};




export const updateWork = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, taskId } = req.params;
    const { taskName, description, assignedTo, dates } = req.body;

    if (!projectId || !taskId) {
      return res.status(400).json({ message: "Invalid projectId or taskId", ok: false });
    }

    // Find the schedule for the project
    const dailySchedule = await DailyScheduleModel.findOne({ projectId });
    if (!dailySchedule) {
      return res.status(404).json({ message: "Project schedule not found", ok: false });
    }

    // Find the task by _id
    const taskIndex = dailySchedule.tasks.findIndex(task => (task as any)._id.toString() === taskId);
    if (taskIndex === -1) {
      return res.status(404).json({ message: "Task not found", ok: false });
    }

    // Check for duplicate taskName (case-insensitive) excluding current task
    if (taskName) {
      const duplicate = dailySchedule.tasks.find(
        (t, idx) => idx !== taskIndex && t.taskName.toLowerCase() === taskName.toLowerCase()
      );
      if (duplicate) {
        return res.status(400).json({ message: "Task name already exists for this project", ok: false });
      }
    }

    // Update task fields
    if (taskName) dailySchedule.tasks[taskIndex].taskName = taskName;
    if (description !== undefined) dailySchedule.tasks[taskIndex].description = description;
    if (assignedTo !== undefined) dailySchedule.tasks[taskIndex].assignedTo = assignedTo;

    // Update dates if provided
    if (dates && Array.isArray(dates)) {
      // Convert incoming to Date objects (strip time to midnight UTC for exact date-only compare)
      const updatedDates = dates.map((d: any) => {
        const obj = new Date(d.date);
        obj.setUTCHours(0, 0, 0, 0); // remove time part
        return obj;
      });

      const finalDates = [];

      for (const dObj of updatedDates) {
        const existing = dailySchedule.tasks[taskIndex].dates.find(dt => {
          const existingDate = new Date(dt.date);
          existingDate.setUTCHours(0, 0, 0, 0);
          return existingDate.getTime() === dObj.getTime();
        });

        if (existing) {
          finalDates.push(existing); // preserve uploads if same date
        } else {
          finalDates.push({ date: dObj, uploads: [] }); // new date, empty uploads
        }
      }

      // Replace dates completely with the updated set (removes any missing dates)
      dailySchedule.tasks[taskIndex].dates = finalDates;
    }

    await dailySchedule.save();

    return res.status(200).json({
      message: "Task updated successfully",
      ok: true,
      data: dailySchedule.tasks[taskIndex]
    });

  } catch (error) {
    console.error("Error updating work:", error);
    return res.status(500).json({ message: "Internal server error", ok: false, error });
  }
};

export const deleteWork = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, taskId } = req.params;

    if (!projectId || !taskId) {
      return res.status(400).json({ message: "Invalid projectId or taskId", ok: false });
    }

    // Find the project schedule
    const dailySchedule = await DailyScheduleModel.findOne({ projectId });
    if (!dailySchedule) {
      return res.status(404).json({ message: "Project schedule not found", ok: false });
    }

    // Find the task index
    const taskIndex = dailySchedule.tasks.findIndex((task: any) => task._id.toString() === taskId);
    if (taskIndex === -1) {
      return res.status(404).json({ message: "Task not found", ok: false });
    }

    // Remove the task from tasks array (deletes all dates and uploads as well)
    dailySchedule.tasks.splice(taskIndex, 1);

    await dailySchedule.save();

    return res.status(200).json({ message: "Task deleted successfully", ok: true, data: dailySchedule });

  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({ message: "Internal server error", ok: false, error });
  }
};



export const uploadDailyScheduleImages = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, taskId, dateId } = req.params;

    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ ok: false, message: "No files uploaded" });
    }

    // Ensure only images
    const uploadedFiles: IUploadFile[] = (req.files as (Express.Multer.File & { location: string })[])
      .filter(file => file.mimetype.startsWith("image/"))
      .map(file => ({
        fileType: "image",
        url: file.location,
        originalName: file.originalname,
        uploadedAt: new Date(),
      }));

    if (uploadedFiles.length === 0) {
      return res.status(400).json({ ok: false, message: "Only image uploads are allowed" });
    }

    const dailySchedule = await DailyScheduleModel.findOne({ projectId });
    if (!dailySchedule) return res.status(404).json({ ok: false, message: "Project schedule not found" });

    const task = dailySchedule.tasks.find((t: any) => t._id.toString() === taskId);
    if (!task) return res.status(404).json({ ok: false, message: "Task not found" });

    const dateObj = task.dates.find((d: any) => d._id.toString() === dateId);
    if (!dateObj) return res.status(404).json({ ok: false, message: "Date not found for this task" });

    if (!dateObj.uploads) dateObj.uploads = [];
    dateObj.uploads.push(...uploadedFiles);

    await dailySchedule.save();

    return res.status(200).json({
      ok: true,
      message: "Images uploaded successfully",
      data: uploadedFiles
    });
  } catch (err) {
    console.error("Error uploading task date images:", err);
    return res.status(500).json({ ok: false, message: "Internal server error" });
  }
};



export const deleteDailyScheduleImage = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, taskId, dateId, imageId } = req.params;

    // 1. Find schedule for the project
    const schedule = await DailyScheduleModel.findOne({ projectId });
    if (!schedule) {
      return res.status(404).json({ ok:false, message: "Project schedule not found" });
    }

    // 2. Find the task
    const task = (schedule.tasks as any).id(taskId);
    if (!task) {
      return res.status(404).json({ ok:false, message: "Task not found" });
    }

    // 3. Find the date entry
    const dateEntry = task.dates.id(dateId);
    if (!dateEntry) {
      return res.status(404).json({ ok:false, message: "Date entry not found" });
    }

    // 4. Ensure the image exists
    const imageExists = dateEntry.uploads.id(imageId);
    if (!imageExists) {
      return res.status(404).json({ ok:false, message: "Image not found" });
    }

    // 5. Remove the image using pull()
    dateEntry.uploads.pull({ _id: imageId });

    // 6. Save changes
    await schedule.save();

    return res.status(200).json({
      message: "Image deleted successfully",
      ok: true
    });

  } catch (err) {
    console.error("Error deleting daily schedule image:", err);
    return res.status(500).json({ message: "Internal server error" , ok:false});
  }
};


const updateDailyScheduleStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { dailyScheduleId, projectId } = req.params;
    const { status } = req.body;

    if (!dailyScheduleId || !Types.ObjectId.isValid(dailyScheduleId)) {
      return res.status(400).json({ ok: false, message: "Valid DailySchedule ID is required." });
    }

    if (!["pending", "submitted", "approved", "rejected", "completed"].includes(status)) {
      return res.status(400).json({ ok: false, message: "Invalid status value." });
    }

    const doc = await DailyScheduleModel.findByIdAndUpdate(
      dailyScheduleId,
      { status },
      { new: true }
    ).populate({
      path: "tasks.assignedTo",
      select: "_id email workerName"
    });

    if (!doc) {
      return res.status(404).json({ ok: false, message: "DailySchedule not found." });
    }

    const redisDailyScheduleKey = `stage:DailyScheduleModel:${projectId}`
    await redisClient.set(redisDailyScheduleKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })


    res.status(200).json({ ok: true, message: "DailySchedule status updated.", data: doc });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

export {

  // addDailyTask,
  // updateDailyTask,
  // deleteDailyTask,
  updateDailyScheduleStatus
};
