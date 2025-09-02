import { Request, Response } from "express";
import { DailyScheduleModel, DailyTaskSubModel, ISelectedImgForCorrection, IUploadFile } from "../../../models/Stage Models/WorkTask Model/dailySchedule.model";
import mongoose, { Types } from "mongoose";
import redisClient from "../../../config/redisClient";
import { generateWorkSchedulePDF } from "./workPdfGeenerator";
import ProjectModel from "../../../models/project model/project.model";
import { RequirementFormModel } from "../../../models/Stage Models/requirment model/mainRequirementNew.model";
import { RoleBasedRequest } from "../../../types/types";
import { SocketService } from "../../../config/socketService";

// export const createWork = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId } = req.params
//     const { taskName, description, assignedTo, dates } = req.body;

//     console.log("dates", dates)
//     // Validate: uploads should not be sent during creation
//     // if (req.body.uploads && req.body.uploads.length > 0) {
//     //   return res.status(400).json({ message: "Uploads are not allowed when creating a work.", ok: false });
//     // }

//     // Find or create DailySchedule for project
//     let dailySchedule = await DailyScheduleModel.findOne({ projectId });

//     // Check duplicate task name in same project (case-sensitive)
//     if (dailySchedule && dailySchedule.tasks.some(task => task.taskName === taskName)) {
//       return res.status(400).json({ message: "Task name already exists for this project.", ok: false });
//     }

//     // If no schedule exists, create a new one
//     if (!dailySchedule) {
//       dailySchedule = new DailyScheduleModel({
//         projectId,
//         tasks: [{
//           taskName,
//           description,
//           assignedTo: assignedTo || null,
//           dates: dates.map((date: any) => {
//             return {
//               date: date.date,
//               uploads: []
//             }
//           }),
//           status: "pending"
//         }]
//       });
//     }

//     // Add new task
//     dailySchedule.tasks.push({
//       taskName,
//       description,
//       assignedTo: assignedTo || null,
//       dates: dates.map((date: any) => {
//         return {
//           date: date.date,
//           uploads: []
//         }
//       }),
//       status: "pending"
//     });

//     await dailySchedule.save();

//     return res.status(201).json({ message: "Work created successfully", ok: true, data: dailySchedule.tasks });
//   } catch (error) {
//     console.error("Error creating work:", error);
//     return res.status(500).json({ message: "Internal server error", error });
//   }
// };


// export const updateWork = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId, taskId } = req.params;
//     const { taskName, description, assignedTo, dates } = req.body;

//     if (!projectId || !taskId) {
//       return res.status(400).json({ message: "Invalid projectId or taskId", ok: false });
//     }

//     // Find the schedule for the project
//     const dailySchedule = await DailyScheduleModel.findOne({ projectId });
//     if (!dailySchedule) {
//       return res.status(404).json({ message: "Project schedule not found", ok: false });
//     }

//     // Find the task by _id
//     const taskIndex = dailySchedule.tasks.findIndex(task => (task as any)._id.toString() === taskId);
//     if (taskIndex === -1) {
//       return res.status(404).json({ message: "Task not found", ok: false });
//     }

//     // Check for duplicate taskName (case-insensitive) excluding current task
//     if (taskName) {
//       const duplicate = dailySchedule.tasks.find(
//         (t, idx) => idx !== taskIndex && t.taskName.toLowerCase() === taskName.toLowerCase()
//       );
//       if (duplicate) {
//         return res.status(400).json({ message: "Task name already exists for this project", ok: false });
//       }
//     }

//     // Update task fields
//     if (taskName) dailySchedule.tasks[taskIndex].taskName = taskName;
//     if (description !== undefined) dailySchedule.tasks[taskIndex].description = description;
//     if (assignedTo !== undefined) dailySchedule.tasks[taskIndex].assignedTo = assignedTo;

//     // Update dates if provided
//     if (dates && Array.isArray(dates)) {
//       // Convert incoming to Date objects (strip time to midnight UTC for exact date-only compare)
//       const updatedDates = dates.map((d: any) => {
//         const obj = new Date(d.date);
//         obj.setUTCHours(0, 0, 0, 0); // remove time part
//         return obj;
//       });

//       const finalDates = [];

//       for (const dObj of updatedDates) {
//         const existing = dailySchedule.tasks[taskIndex].dates.find(dt => {
//           const existingDate = new Date(dt.date);
//           existingDate.setUTCHours(0, 0, 0, 0);
//           return existingDate.getTime() === dObj.getTime();
//         });

//         if (existing) {
//           finalDates.push(existing); // preserve uploads if same date
//         } else {
//           finalDates.push({ date: dObj, uploads: [] }); // new date, empty uploads
//         }
//       }

//       // Replace dates completely with the updated set (removes any missing dates)
//       dailySchedule.tasks[taskIndex].dates = finalDates;
//     }

//     await dailySchedule.save();

//     return res.status(200).json({
//       message: "Task updated successfully",
//       ok: true,
//       data: dailySchedule.tasks[taskIndex]
//     });

//   } catch (error) {
//     console.error("Error updating work:", error);
//     return res.status(500).json({ message: "Internal server error", ok: false, error });
//   }
// };

// export const deleteWork = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId, taskId } = req.params;

//     if (!projectId || !taskId) {
//       return res.status(400).json({ message: "Invalid projectId or taskId", ok: false });
//     }

//     // Find the project schedule
//     const dailySchedule = await DailyScheduleModel.findOne({ projectId });
//     if (!dailySchedule) {
//       return res.status(404).json({ message: "Project schedule not found", ok: false });
//     }

//     // Find the task index
//     const taskIndex = dailySchedule.tasks.findIndex((task: any) => task._id.toString() === taskId);
//     if (taskIndex === -1) {
//       return res.status(404).json({ message: "Task not found", ok: false });
//     }

//     // Remove the task from tasks array (deletes all dates and uploads as well)
//     dailySchedule.tasks.splice(taskIndex, 1);

//     await dailySchedule.save();

//     return res.status(200).json({ message: "Task deleted successfully", ok: true, data: dailySchedule });

//   } catch (error) {
//     console.error("Error deleting task:", error);
//     return res.status(500).json({ message: "Internal server error", ok: false, error });
//   }
// };

// export const uploadDailyScheduleImages = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId, taskId, dateId } = req.params;

//     if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
//       return res.status(400).json({ ok: false, message: "No files uploaded" });
//     }

//     // Ensure only images
//     const uploadedFiles: IUploadFile[] = (req.files as (Express.Multer.File & { location: string })[])
//       .filter(file => file.mimetype.startsWith("image/"))
//       .map(file => ({
//         fileType: "image",
//         url: file.location,
//         originalName: file.originalname,
//         uploadedAt: new Date(),
//       }));

//     if (uploadedFiles.length === 0) {
//       return res.status(400).json({ ok: false, message: "Only image uploads are allowed" });
//     }

//     const dailySchedule = await DailyScheduleModel.findOne({ projectId });
//     if (!dailySchedule) return res.status(404).json({ ok: false, message: "Project schedule not found" });

//     const task = dailySchedule.tasks.find((t: any) => t._id.toString() === taskId);
//     if (!task) return res.status(404).json({ ok: false, message: "Task not found" });

//     const dateObj = task.dates.find((d: any) => d._id.toString() === dateId);
//     if (!dateObj) return res.status(404).json({ ok: false, message: "Date not found for this task" });

//     if (!dateObj.uploads) dateObj.uploads = [];
//     dateObj.uploads.push(...uploadedFiles);

//     await dailySchedule.save();

//     return res.status(200).json({
//       ok: true,
//       message: "Images uploaded successfully",
//       data: uploadedFiles
//     });
//   } catch (err) {
//     console.error("Error uploading task date images:", err);
//     return res.status(500).json({ ok: false, message: "Internal server error" });
//   }
// };

// export const deleteDailyScheduleImage = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId, taskId, dateId, imageId } = req.params;

//     // 1. Find schedule for the project
//     const schedule = await DailyScheduleModel.findOne({ projectId });
//     if (!schedule) {
//       return res.status(404).json({ ok:false, message: "Project schedule not found" });
//     }


//     console.log("taskid", taskId)

//     // 2. Find the task
//     const task = (schedule.tasks as any).id(taskId);

//     if (!task) {
//       return res.status(404).json({ ok:false, message: "Task not found" });
//     }

//     // 3. Find the date entry
//     const dateEntry = task.dates.id(dateId);
//     if (!dateEntry) {
//       return res.status(404).json({ ok:false, message: "Date entry not found" });
//     }

//     // 4. Ensure the image exists
//     const imageExists = dateEntry.uploads.id(imageId);
//     if (!imageExists) {
//       return res.status(404).json({ ok:false, message: "Image not found" });
//     }

//     // 5. Remove the image using pull()
//     dateEntry.uploads.pull({ _id: imageId });

//     // 6. Save changes
//     await schedule.save();

//     return res.status(200).json({
//       message: "Image deleted successfully",
//       ok: true
//     });

//   } catch (err) {
//     console.error("Error deleting daily schedule image:", err);
//     return res.status(500).json({ message: "Internal server error" , ok:false});
//   }
// };


// ✅ Create / Add Multiple Daily Tasks with optional extras




export const getCurrentProjectDetailsWork = async (req: Request, res: Response): Promise<any> => {
  try {

    const { projectId } = req.params

    const [project, requirement, dailyWork] = await Promise.all([ProjectModel.findById(projectId),
    RequirementFormModel.findOne({ projectId }), DailyTaskSubModel.find({ projectId })])


    let nextNumber = 1;

    const projectName = project?.projectName || "PRO"; // fallback
    const projectCode = projectName.substring(0, 3).toLowerCase(); // first 3 letters


    if (dailyWork && dailyWork.length > 0) {
      // Extract numbers from existing references
      const numbers = dailyWork
        .map((ele) => {
          const match = ele?.projectAssignee?.designReferenceId?.match(/-(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((num) => num > 0);

      // Get max + 1
      nextNumber = Math.max(...numbers, 0) + 1;
    }
    // 3. Generate new reference
    const designReferenceId = `${projectCode}-work-${nextNumber}`;


    res.status(200).json({
      message: "project assigned detials", data: {
        projectName: project?.projectName || "",
        siteAddress: requirement?.clientData?.location || "",
        designReferenceId: designReferenceId || "",
      }
    })


  }
  catch (error: any) {
    console.log("error", error)
    res.status(500).json({ message: "internal server erroro", ok: false })
  }

}

export const createDailyWorkUtil = async (data: {
  projectId: string,
  dailyTasks?: any[],
  projectAssignee?: any[],
  supervisorCheck?: any,
  files?: any
}) => {

  let { projectId, dailyTasks = [], projectAssignee = [], supervisorCheck = {}, files = {} } = data;



  if (typeof dailyTasks === 'string') dailyTasks = JSON.parse(dailyTasks);
  if (typeof projectAssignee === 'string') projectAssignee = JSON.parse(projectAssignee);
  if (typeof supervisorCheck === 'string') supervisorCheck = JSON.parse(supervisorCheck);


  supervisorCheck = {
    reviewerName: supervisorCheck.reviewerName || "",
    reviewerId: supervisorCheck.reviewerId || null, // convert empty string to null
    reviewDateTime: supervisorCheck.reviewDateTime || "",
    status: ["approved", "needs_changes", "rejected"].includes(supervisorCheck.status)
      ? supervisorCheck.status
      : "needs_changes", // fallback to default
    remarks: supervisorCheck.remarks || "",
    gatekeeping: supervisorCheck.gatekeeping || "block",
  };

  // console.log("projectId", projectId)
  // console.log("dailyTasks", dailyTasks)
  // console.log("projectAssignee", projectAssignee)
  // console.log("supervisorCheck", supervisorCheck)

  // const files: any = uploadedFiles as { [fieldname: string]: Express.Multer.File[] };
  // console.log("files formt eh at first ", files)
  // Parse optional images if uploaded
  const designPlanImages = files?.designPlanImages
    ? files.designPlanImages.map((file: any) => ({
      fileType: "image",                // required enum
      url: file.location,               // S3 URL
      originalName: file.originalname,  // original file name
      uploadedAt: new Date(),
    }))
    : [];



  // console.log("req.files", files)
  const siteImages = files?.siteImages
    ? files.siteImages.map((file: any) => ({
      fileType: "image",                // required enum
      url: file.location,               // S3 URL
      originalName: file.originalname,  // original file name
      uploadedAt: new Date(),
    }))
    : [];

  // const comparison = files?.comparison
  //   ? {
  //     design: files.comparison
  //       .filter((f: any) => f.fieldname === "comparisonDesign")
  //       .map((f: any) => ({ url: f.location, key: f.key })),
  //     site: files.comparison
  //       .filter((f: any) => f.fieldname === "comparisonSite")
  //       .map((f: any) => ({ url: f.location, key: f.key })),
  //   }
  //   : undefined;




  const actualImage = files?.actualImage?.[0] ? {
    fileType: "image",
    url: files.actualImage[0].location,
    originalName: files.actualImage[0].originalname,
    uploadedAt: new Date(),
  } : null;
  const plannedImage = files?.plannedImage?.[0] ? {
    fileType: "image",
    url: files.plannedImage[0].location,
    originalName: files.plannedImage[0].originalname,
    uploadedAt: new Date(),
  } : null;

  let comparison: any;
  if (actualImage || plannedImage) {
    comparison = {
      actualImage: actualImage || null,
      plannedImage: plannedImage || null
    }
  } else {
    comparison = undefined
  }

  const newRecord = await DailyTaskSubModel.create({
    projectId,
    dailyTasks,
    projectAssignee,
    supervisorCheck,
    ...(designPlanImages.length > 0 && { designPlanImages }),
    ...(siteImages.length > 0 && { siteImages }),
    ...(comparison && { comparison }),
  });



  return newRecord

}

export const createWork = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {

    const { projectId } = req.params
    let {
      dailyTasks = [],
      projectAssignee = [],
      supervisorCheck = {},
    } = req.body;

    const files: any = req.files as { [fieldname: string]: Express.Multer.File[] };


    // if (typeof dailyTasks === 'string') dailyTasks = JSON.parse(dailyTasks);
    // if (typeof projectAssignee === 'string') projectAssignee = JSON.parse(projectAssignee);
    // if (typeof supervisorCheck === 'string') supervisorCheck = JSON.parse(supervisorCheck);


    // supervisorCheck = {
    //   reviewerName: supervisorCheck.reviewerName || "",
    //   reviewerId: supervisorCheck.reviewerId || null, // convert empty string to null
    //   reviewDateTime: supervisorCheck.reviewDateTime || "",
    //   status: ["approved", "needs_changes", "rejected"].includes(supervisorCheck.status)
    //     ? supervisorCheck.status
    //     : "needs_changes", // fallback to default
    //   remarks: supervisorCheck.remarks || "",
    //   gatekeeping: supervisorCheck.gatekeeping || "block",
    // };

    // console.log("projectId", projectId)
    // console.log("dailyTasks", dailyTasks)
    // console.log("projectAssignee", projectAssignee)
    // console.log("supervisorCheck", supervisorCheck)

    // console.log("files formt eh at first ", files)
    // // Parse optional images if uploaded
    // const designPlanImages = files?.designPlanImages
    //   ? files.designPlanImages.map((file: any) => ({
    //     fileType: "image",                // required enum
    //     url: file.location,               // S3 URL
    //     originalName: file.originalname,  // original file name
    //     uploadedAt: new Date(),
    //   }))
    //   : [];



    //   console.log("req.files" ,files)
    // const siteImages = files?.siteImages
    //   ? files.siteImages.map((file: any) => ({
    //     fileType: "image",                // required enum
    //     url: file.location,               // S3 URL
    //     originalName: file.originalname,  // original file name
    //     uploadedAt: new Date(),
    //   }))
    //   : [];

    // // const comparison = files?.comparison
    // //   ? {
    // //     design: files.comparison
    // //       .filter((f: any) => f.fieldname === "comparisonDesign")
    // //       .map((f: any) => ({ url: f.location, key: f.key })),
    // //     site: files.comparison
    // //       .filter((f: any) => f.fieldname === "comparisonSite")
    // //       .map((f: any) => ({ url: f.location, key: f.key })),
    // //   }
    // //   : undefined;




    // const actualImage = files?.actualImage?.[0] ? {
    //   fileType: "image",
    //   url: files.actualImage[0].location,
    //   originalName: files.actualImage[0].originalname,
    //   uploadedAt: new Date(),
    // } : null;
    // const plannedImage = files?.plannedImage?.[0] ? {
    //   fileType: "image",
    //   url: files.plannedImage[0].location,
    //   originalName: files.plannedImage[0].originalname,
    //   uploadedAt: new Date(),
    // } : null;

    // let comparison: any;
    // if (actualImage || plannedImage) {
    //   comparison = {
    //     actualImage: actualImage || null,
    //     plannedImage: plannedImage || null
    //   }
    // } else {
    //   comparison = undefined
    // }

    // const newRecord = await DailyTaskSubModel.create({
    //   projectId,
    //   dailyTasks,
    //   projectAssignee,
    //   supervisorCheck,
    //   ...(designPlanImages.length > 0 && { designPlanImages }),
    //   ...(siteImages.length > 0 && { siteImages }),
    //   ...(comparison && { comparison }),
    // });


    const newRecord = await createDailyWorkUtil({
      projectId, dailyTasks,
      projectAssignee,
      supervisorCheck, files
    })


    const isExists = await DailyScheduleModel.findOne({ projectId })
    if (!isExists) {
      await DailyScheduleModel.create({
        projectId,
        tasks: [newRecord._id],
      })
    } else {
      await DailyScheduleModel.findOneAndUpdate({ projectId }, { $addToSet: { tasks: newRecord._id } }, { returnDocument: "after" })
    }


console.log("getting created")
    // 🔥 WebSocket Emission
    await SocketService.emitToProject(projectId, 'workSchedule:task_created', {
      taskId: newRecord._id,
      dailyTasks: newRecord.dailyTasks,
      projectAssignee: newRecord.projectAssignee,
      supervisorCheck: newRecord.supervisorCheck,
      createdBy: req?.user?._id,
      createdByRole: req?.user?.role
    });

    return res.status(201).json({
      ok: true,
      message: "Daily tasks added successfully",
      data: newRecord,
    });
  } catch (error: any) {
    console.error("Error adding daily tasks:", error);
    return res.status(500).json({ ok: false, message: error.message });
  }
};

// ✅ Update existing DailyTaskSub by pushing more tasks / assignees
export const updateWork = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { projectId, id } = req.params; // DailyTaskSub _id
    let { dailyTasks = [], projectAssignee = [], supervisorCheck } = req.body;

    if (typeof dailyTasks === 'string') dailyTasks = JSON.parse(dailyTasks);
    if (typeof projectAssignee === 'string') projectAssignee = JSON.parse(projectAssignee);
    if (typeof supervisorCheck === 'string') supervisorCheck = JSON.parse(supervisorCheck);


    supervisorCheck = {
      reviewerName: supervisorCheck.reviewerName || "",
      reviewerId: supervisorCheck.reviewerId || null, // convert empty string to null
      reviewDateTime: supervisorCheck.reviewDateTime || "",
      status: ["approved", "needs_changes", "pending"].includes(supervisorCheck.status)
        ? supervisorCheck.status
        : "needs_changes", // fallback to default
      remarks: supervisorCheck.remarks || "",
      gatekeeping: supervisorCheck.gatekeeping || "block",
    };


      projectAssignee = {
      projectName: projectAssignee.projectName || "",
      siteAddress: projectAssignee.siteAddress || null, // convert empty string to null
      designReferenceId: projectAssignee.designReferenceId || "",
      carpenterName: projectAssignee?.carpenterName || null,
      supervisorName: projectAssignee.supervisorName || "",
      plannedStartDate: projectAssignee.plannedStartDate || null,
    };



    const record = await DailyTaskSubModel.findById(id);
    if (!record) {
      return res.status(404).json({ ok: false, message: "task not found" });
    }

    // Step 2: Update dailyTasks (replace by _id, append new ones)
    if (dailyTasks.length > 0) {
      // Create a map of existing tasks
      const taskMap = new Map(
        record.dailyTasks.map((t: any) => [String(t._id), t])
      );

      dailyTasks.forEach((newTask: any) => {
        if (newTask._id && taskMap.has(String(newTask._id))) {
          const existing = taskMap.get(String(newTask._id));

          // Only merge if there are changes
          const updated = { ...existing.toObject?.() || existing, ...newTask };

          taskMap.set(String(newTask._id), updated);
        } else {
          // Add as new task (preserve _id = true in schema)
          taskMap.set(
            new mongoose.Types.ObjectId().toString(),
            newTask
          );
        }
      });

      // Preserve unmodified tasks as they are
      record.set("dailyTasks", Array.from(taskMap.values()));
    }


    if (projectAssignee && Object.keys(projectAssignee).length > 0) {
      // If you want to overwrite fully:
      record.set("projectAssignee", projectAssignee);
    }


    console.log("supervisor", supervisorCheck)
    if (supervisorCheck && Object.keys(supervisorCheck).length > 0) {
      record.set("supervisorCheck", {
        ...(record.supervisorCheck as any)?.toObject(),
        ...supervisorCheck,
      });
    }


    const files: any = req.files as { [fieldname: string]: Express.Multer.File[] };


    if (files?.designPlanImages?.length > 0) {
      const existing = record.designPlanImages || [];
      const newOnes = files.designPlanImages.map((file: any) => ({
        url: file.location,
        key: file.key,
      }));

      record.set("designPlanImages", [...existing, ...newOnes]);
    }


    // Handle siteImages merge
    if (files?.siteImages?.length > 0) {
      const existing = record.siteImages || [];
      const newOnes = files.siteImages.map((file: any) => ({
        url: file.location,
        key: file.key,
      }));

      record.set("siteImages", [...existing, ...newOnes]);
    }


    // Handle actual/planned comparison
    const actualImage = files?.actualImage?.[0]
      ? {
        fileType: "image",
        url: files.actualImage[0].location,
        originalName: files.actualImage[0].originalname,
        uploadedAt: new Date(),
      }
      : null;

    const plannedImage = files?.plannedImage?.[0]
      ? {
        fileType: "image",
        url: files.plannedImage[0].location,
        originalName: files.plannedImage[0].originalname,
        uploadedAt: new Date(),
      }
      : null;


    // Only overwrite comparison if new images are given
    if (actualImage || plannedImage) {
      record.set("comparison", {
        ...((record.comparison as any)?.toObject?.() || record.comparison || {}),
        ...(actualImage ? { actualImage } : {}),
        ...(plannedImage ? { plannedImage } : {}),
      });
    }


    await record.save();




    await DailyScheduleModel.findOneAndUpdate({ projectId }, { $addToSet: { tasks: record._id } }, { returnDocument: "after" })


    // 🔥 WebSocket Emission
    await SocketService.emitToProject(projectId, 'workSchedule:task_updated', {
      taskId: record._id,
      updatedData: {
        dailyTasks: record.dailyTasks,
        projectAssignee: record.projectAssignee,
        supervisorCheck: record.supervisorCheck
      },
      updatedBy: req.user?._id,
      updatedByRole: req.user?.role
    });

    return res.status(200).json({
      ok: true,
      message: "Daily tasks updated successfully",
      data: record,
    });
  } catch (error: any) {
    console.error("Error updating daily tasks:", error);
    return res.status(500).json({ ok: false, message: error.message });
  }
};




export const deleteWork = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { scheduleId, taskId } = req.params;

    if (!scheduleId || !taskId) {
      return res.status(400).json({ message: "Invalid projectId or taskId", ok: false });
    }
    console.log("tasksid", taskId)


    console.log("schedule", scheduleId)
    // Find the project schedule
    const dailySchedule = await DailyTaskSubModel.findById(scheduleId);
    if (!dailySchedule) {
      return res.status(404).json({ message: "Project schedule not found", ok: false });
    }

    // Find the task index
    const totalLength = dailySchedule.dailyTasks.length
    const task = dailySchedule.dailyTasks.filter((task: any) => task._id.toString() !== taskId);
    (dailySchedule as any).dailyTasks = task
    if (task.length === totalLength) {
      return res.status(404).json({ message: "Task not found", ok: false });
    }

    await dailySchedule.save();

    // 🔥 WebSocket Emission - Need to get projectId from schedule
    const schedule = await DailyScheduleModel.findOne({ tasks: scheduleId });
    if (schedule) {
      await SocketService.emitToProject(String(schedule.projectId), 'workSchedule:task_deleted', {
        scheduleId,
        taskId,
        deletedBy: req.user?._id,
        deletedByRole: req.user?.role
      });
    }

    return res.status(200).json({ message: "Task deleted successfully", ok: true, data: dailySchedule });

  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({ message: "Internal server error", ok: false, error });
  }
};


export const uploadDailyScheduleImages = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { scheduleId, taskId } = req.params;
    const { date } = req.body;
    const files = req.files as (Express.Multer.File & { location: string })[];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded.", ok: false });
    }

    // Find the DailyTaskSubSchema by scheduleId
    const schedule = await DailyTaskSubModel.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Daily Task Schedule not found.", ok: false });
    }

    // Find the specific task inside dailyTasks
    const task = (schedule.dailyTasks as any).id(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found in schedule.", ok: false });
    }

    // Map uploaded files to IUploadFile format
    const mappedFiles: IUploadFile[] = files.map(file => {
      const fileType: "image" | "pdf" = file.mimetype.startsWith("image") ? "image" : "pdf";
      return {
        fileType,
        url: file.location,
        originalName: file.originalname,
        uploadedAt: new Date()
      };
    });

    // Check if there's already an entry for the given date
    let dateEntry = task?.uploadedImages?.find((entry: any) => entry?.date?.toDateString() === new Date(date)?.toDateString());

    if (dateEntry) {
      // If date exists, append new files
      dateEntry.uploads.push(...mappedFiles);
    } else {
      // Otherwise, create a new entry for this date
      dateEntry = {
        date: new Date(date),
        uploads: mappedFiles
      };
      task.uploadedImages.push(dateEntry);

      // task.uploadedImages.push(dateEntry);
      //     task.uploadedImages.push({
      //       date: new Date(date),
      //       uploads: mappedFiles
      //     });
    }

    await schedule.save();

    const savedUploads = dateEntry.uploads.slice(-mappedFiles.length);

    // 🔥 WebSocket Emission - Need to get projectId
    const dailySchedule = await DailyScheduleModel.findOne({ tasks: scheduleId });
    if (dailySchedule) {
      await SocketService.emitToProject(String(dailySchedule.projectId), 'workSchedule:image_uploaded', {
        scheduleId,
        taskId,
        date: new Date(date).toISOString(),
        newImages: savedUploads,
        uploadedBy: req.user?._id,
        uploadedByRole: req.user?.role
      });
    }

    return res.status(200).json({
      message: "Files uploaded to task successfully",

      data: {
        date: new Date(date).toISOString(), // keep it as string
        uploads: savedUploads
      },
      ok: true
    });

  } catch (error) {
    console.error("Error uploading task images:", error);
    return res.status(500).json({ message: "Server error", ok: false });
  }
};



export const deleteDailyScheduleImage = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    // Find and update in one shot
    const { scheduleId, taskId, date, imageId } = req.params;


    // console.log("scheduleId", scheduleId)
    // console.log("taskId", taskId)
    // console.log("imageId", imageId)
    // console.log("date", date)
    // const updatedDoc = await DailyTaskSubModel.findOneAndUpdate(
    //   { _id: scheduleId, "dailyTasks._id": taskId, "dailyTasks.uploadedImages.uploads._id": imageId },
    //   {
    //     $pull: { "dailyTasks.$[].uploadedImages.$[].uploads": { _id: imageId } }
    //   },
    //   { new: true }
    // );
    // if (!updatedDoc) {
    //     return res.status(404).json({
    //       message: "Task or image not found",
    //       ok: false,
    //     });
    //   }



    // return res.status(200).json({
    //   message: "Image deleted successfully",
    //   data: {
    //     date,
    //     uploads: updatedDoc.dailyTasks
    //       .find((t: any) => t._id.toString() === taskId)
    //       ?.uploadedImages.find((g: any) => g.date.toISOString().split("T")[0] === date)?.uploads || []
    //   },
    //   ok: true,
    // });

    const schedule = await DailyTaskSubModel.findOne({ _id: scheduleId });
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found", ok: false });
    }

    const task = schedule.dailyTasks.find((t: any) => t._id.toString() === taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found", ok: false });
    }

    const dateGroup = task.uploadedImages.find(
      (g: any) => g.date.toISOString().split("T")[0] === date
    );
    if (!dateGroup) {
      return res.status(404).json({ message: "Date group not found", ok: false });
    }

    // Remove the image
    dateGroup.uploads = dateGroup.uploads.filter((u: any) => u._id.toString() !== imageId);

    await schedule.save();


    // 🔥 WebSocket Emission
    const dailySchedule = await DailyScheduleModel.findOne({ tasks: scheduleId });
    if (dailySchedule) {
      await SocketService.emitToProject(String(dailySchedule.projectId), 'workSchedule:image_deleted', {
        scheduleId,
        taskId,
        date,
        imageId,
        remainingImages: dateGroup.uploads,
        deletedBy: req.user?._id,
        deletedByRole: req.user?.role
      });
    }



    return res.status(200).json({
      message: "Image deleted successfully",
      data: dateGroup, // send the updated group for frontend merge
      ok: true
    });
  } catch (error) {
    console.error("Error deleting task image:", error);
    return res.status(500).json({
      message: "Server error",
      ok: false,
    });
  }
};

export const generateWorkSchedulePDFController = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { projectId, scheduleId } = req.params
    let {
      dailyTasks = [],
      projectAssignee = [],
      supervisorCheck = {},
    } = req.body;



    const files: any = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!projectId) {
      return res.status(400).json({
        ok: false,
        message: 'projectId ID is required'
      });
    }



    // console.log("dailyTasks", dailyTasks)

    // console.log("Raw req.body:", req.body);
    // console.log("Files:", req.files);

    let newRecord: any = null
    if (!scheduleId) {
      newRecord = await createDailyWorkUtil({
        projectId, dailyTasks,
        projectAssignee,
        supervisorCheck, files
      })
    }

    let result: any;
    if (newRecord) {
      result = await generateWorkSchedulePDF(newRecord._id);
    } else {
      result = await generateWorkSchedulePDF(scheduleId);
    }



    res.status(200).json({ ok: true, message: "pdf generated successfully", data: result });

    if (!scheduleId) {
      const isExists = await DailyScheduleModel.findOne({ projectId })
      if (!isExists) {
        await DailyScheduleModel.create({
          projectId,
          tasks: [newRecord._id],
        })
      } else {
        await DailyScheduleModel.findOneAndUpdate({ projectId }, { $addToSet: { tasks: newRecord._id } }, { returnDocument: "after" })
      }
    }


  } catch (error: any) {
    console.error('PDF generation controller error:', error);
    res.status(500).json({
      ok: false,
      message: error.message || 'Internal server error'
    });
  }
};

export const addComparisonSelectImage = async (
  req: RoleBasedRequest,
  res: Response
): Promise<any> => {
  try {

    const { scheduleId } = req.params
    const imageData = req.body;
    // imageData is from siteImages (single or array)
    const user = req.user;

    if (!user) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    if (!scheduleId) {
      return res.status(400).json({ ok: false, message: "scheduleId are required" });
    }


    if (scheduleId === "null") {
      return res.status(400).json({ message: "first save the document, then you try uploading images for correction section" })
    }

    // Resolve createModel based on role
    let createModel = "";
    switch (user.role) {
      case "owner":
        createModel = "UserModel";
        break;
      case "CTO":
        createModel = "CTOModel";
        break;
      case "staff":
        createModel = "StaffModel";
        break;
      case "worker":
        createModel = "WorkerModel";
        break;
      default:
        createModel = "UserModel"; // fallback
    }

    // Normalize to array
    const images = Array.isArray(imageData) ? imageData : [imageData];
    // console.log("imageData", imageData)
    // Map to SelectedImgForCorrection shape
    const selectImageDocs = images.map((img: any) => {
      // console.log("img", img)
      const { _id, ...rest } = img; // remove _id

      // console.log("rest", rest)
      return {
        plannedImage: {
          ...rest
        },
        comment: "", // optional
        createdBy: user._id,
        createModel,
        createdAt: new Date(),
      };
    });

    // Create a new ComparisonReview entry
    const comparisonEntry = {
      selectImage: selectImageDocs,
      correctedImages: [],
    };

    const updatedDoc = await DailyTaskSubModel.findByIdAndUpdate(
      scheduleId,
      { $push: { workComparison: comparisonEntry } },
      { new: true }
    );

    if (!updatedDoc) {
      return res.status(404).json({ message: "schedule not found", ok: false });
    }


    // 🔥 WebSocket Emission - Need to get projectId from schedule
    const dailySchedule = await DailyScheduleModel.findOne({ _id: scheduleId });
    if (dailySchedule) {
      await SocketService.emitToProject(String(dailySchedule.projectId), 'workSchedule:selectimage_added', {
        scheduleId,
        comparisonId: (updatedDoc.workComparison.slice(-1)[0] as any)._id,
        // selectImages: selectImageDocs,
        selectImages: updatedDoc.workComparison.slice(-1)[0],
        addedBy: user._id,
        addedByRole: user.role
      });
    }


    return res.status(200).json({
      message: "Comparison review entry added successfully",
      data: updatedDoc.workComparison.slice(-1)[0],
      ok: true
    });
  } catch (error: any) {
    console.error("Error in addComparisonSelectImageController:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};



export const uploadComparisonImagesManually = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { scheduleId, comparisonId } = req.params
    const user = req.user
    const files = req.files as (Express.Multer.File & { location: string })[];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded.", ok: false });
    }

    const doc = await DailyTaskSubModel.findById(scheduleId);
    if (!doc) {
      return res.status(404).json({ message: "Task not found.", ok: false });
    }



    // Resolve createModel based on role
    let createModel = "";
    switch (user?.role) {
      case "owner":
        createModel = "UserModel";
        break;
      case "CTO":
        createModel = "CTOModel";
        break;
      case "staff":
        createModel = "StaffModel";
        break;
      case "worker":
        createModel = "WorkerModel";
        break;
      default:
        createModel = "UserModel"; // fallback
    }


    const selectImageDocs: ISelectedImgForCorrection[] = files
      .filter(file => file.mimetype.startsWith("image")) // ✅ only allow images
      .map(file => ({
        plannedImage: {
          fileType: "image",
          url: file.location,
          originalName: file.originalname,
          uploadedAt: new Date()
        },
        comment: "", // optional
        createdBy: user?._id!,
        createModel,
        createdAt: new Date(),
      }));

    if (comparisonId !== "null") {

      let comparison = (doc.workComparison as any).id(comparisonId);
      if (!comparison) {
        return res.status(404).json({ ok: false, message: "Comparison not found." });
      }

      comparison.selectImage = [...comparison.selectImage, ...selectImageDocs];
      await doc.save()


      // 🔥 WebSocket Emission - Update existing comparison
      const dailySchedule = await DailyScheduleModel.findById(scheduleId);
      if (dailySchedule) {
        await SocketService.emitToProject(String(dailySchedule.projectId), 'workSchedule:selectimage_added_manual', {
          scheduleId,
          comparisonId,
          newSelectImages: doc.workComparison,
          uploadedBy: user?._id,
          uploadedByRole: user?.role
        });
      }


      return res.status(200).json({
        ok: true,
        message: "updaloaded successfully",
        data: doc.workComparison
      });
    } else {
      // Create a new ComparisonReview entry


      const comparisonEntry = {
        selectImage: selectImageDocs,
        correctedImages: [],
      };

      const updatedDoc = await DailyTaskSubModel.findByIdAndUpdate(
        scheduleId,
        { $push: { workComparison: comparisonEntry } },
        { new: true }
      );

      if (!updatedDoc) {
        return res.status(404).json({ message: "schedule not found", ok: false });
      }


      // 🔥 WebSocket Emission - New comparison created
      const dailySchedule = await DailyScheduleModel.findById(scheduleId);
      if (dailySchedule) {
        await SocketService.emitToProject(String(dailySchedule.projectId), 'workSchedule:comparison_created', {
          scheduleId,
          comparisonId: (updatedDoc.workComparison.slice(-1)[0] as any)._id,
          selectImages: updatedDoc.workComparison.slice(-1)[0],
          createdBy: user?._id,
          createdByRole: user?.role
        });
      }

      return res.status(200).json({
        ok: true,
        message: "updaloaded successfully",
        data: updatedDoc.workComparison
      });

    }



  }
  catch (error: any) {
    console.error("Error in addComparisonSelectImageController:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
}


export const updateSelectedImageComment = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { scheduleId, comparisonId, selectedImageId } = req.params;
    const { comment } = req.body;

    const user = req.user

    if (!user) {
      return res.status(200).json({ ok: false, message: "Not Authorized" })
    }

    // if (!comment || comment.trim() === "") {
    //   return res.status(400).json({ ok: false, message: "Comment is required." });
    // }

    // Find the parent document
    const doc = await DailyTaskSubModel.findById(scheduleId);
    if (!doc) {
      return res.status(404).json({ ok: false, message: "Schedule not found." });
    }

    // Find the specific comparison
    const comparison = (doc.workComparison as any).id(comparisonId);
    if (!comparison) {
      return res.status(404).json({ ok: false, message: "Comparison not found." });
    }

    // Find the selected image
    const selectedImg = comparison.selectImage.id(selectedImageId);
    if (!selectedImg) {
      return res.status(404).json({ ok: false, message: "Selected image not found." });
    }

    // Update the comment
    selectedImg.comment = comment;


    // Resolve createModel based on role
    let createModel = "";
    switch (user.role) {
      case "owner":
        createModel = "UserModel";
        break;
      case "CTO":
        createModel = "CTOModel";
        break;
      case "staff":
        createModel = "StaffModel";
        break;
      case "worker":
        createModel = "WorkerModel";
        break;
      default:
        createModel = "UserModel"; // fallback
    }


    selectedImg.createModel = createModel;
    selectedImg.createdAt = new Date()
    selectedImg.createdBy = user?._id

    await doc.save();



    // 🔥 WebSocket Emission - Comment updated
    const dailySchedule = await DailyScheduleModel.findById(scheduleId);
    if (dailySchedule) {
      await SocketService.emitToProject(String(dailySchedule.projectId), 'workSchedule:selectimage_comment', {
        scheduleId,
        comparisonId,
        selectedImageId,
        comment,
        updatedBy: user._id,
        updatedByRole: user.role
      });
    }


    return res.status(200).json({
      ok: true,
      message: "Comment updated successfully.",
      data: doc.workComparison,
    });
  } catch (error: any) {
    console.error("Error in updateSelectedImageComment:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};





export const deleteWorkSelectImage = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { scheduleId, comparisonId, selectId } = req.params;


    const user = req?.user
    // shorter way
    //    const doc = await DailyTaskSubModel.updateOne(
    //   { _id: scheduleId, "workComparison._id": comparisonId },
    //   { $pull: { "workComparison.$.selectImage": { _id: selectId } } }
    // );

    //  if (!doc) {
    //       return res.status(404).json({ ok: false, message: "Schedule not found" });
    //     }


    // Find parent document
    const doc = await DailyTaskSubModel.findById(scheduleId);
    if (!doc) {
      return res.status(404).json({ ok: false, message: "Schedule not found" });
    }

    // Find comparison object
    const comparison = (doc.workComparison as any).id(comparisonId);
    if (!comparison) {
      return res.status(404).json({ ok: false, message: "Comparison not found" });
    }

    // Find and remove image by _id
    const imageIndex = comparison.selectImage.findIndex(
      (img: any) => img._id.toString() === selectId
    );

    if (imageIndex === -1) {
      return res.status(404).json({ ok: false, message: "Image not found" });
    }

    // Remove from array
    comparison.selectImage.splice(imageIndex, 1);

 const deletedImage = comparison.selectImage[imageIndex];
    // let comparisonDeleted = false;

    // ✅ If both arrays are empty, remove the entire comparison object
    if (
      comparison.selectImage.length === 0 &&
      (!comparison.correctedImages || comparison.correctedImages.length === 0)
    ) {
      doc.workComparison = doc.workComparison.filter(
        (comp: any) => comp._id.toString() !== comparisonId
      );
      // comparisonDeleted = true;
    }
    await doc.save();

    const dailySchedule = await DailyScheduleModel.findById(scheduleId);
    if (dailySchedule) {
      // if (comparisonDeleted) {
        await SocketService.emitToProject(String(dailySchedule.projectId), 'workSchedule:selectimage_delete', {
          scheduleId,
          comparisonId,
          images:doc.workComparison,
          deletedBy: user?._id,
          deletedByRole: user?.role
        });
      // } else {
      //   await SocketService.emitToProject(String(dailySchedule.projectId), 'workSchedule:select_image_deleted', {
      //     scheduleId,
      //     comparisonId,
      //     selectImageId: selectId,
      //     deletedImage,
      //     deletedBy: user?._id,
      //     deletedByRole: user?.role
      //   });
      // }
    }

    return res.status(200).json({
      ok: true,
      message: "Selected image deleted successfully",
      data: doc.workComparison,
    });
  } catch (error: any) {
    console.error("Error in deleteWorkCorrectImages:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};



export const uploadCorrectImages = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { scheduleId, comparisonId } = req.params
    const user = req.user

    const files = req.files as (Express.Multer.File & { location: string })[];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded.", ok: false });
    }

    const doc = await DailyTaskSubModel.findById(scheduleId);
    if (!doc) {
      return res.status(404).json({ message: "Task not found.", ok: false });
    }

    const comparison = doc.workComparison.find((r: any) => r?._id.toString() === comparisonId);

    if (!comparison) {
      return res.status(404).json({ message: "comparison not found.", ok: false });
    }

    const mappedFiles: IUploadFile[] = files
      .filter(file => file.mimetype.startsWith("image")) // ✅ only allow images
      .map(file => ({
        fileType: "image",
        url: file.location,
        originalName: file.originalname,
        uploadedAt: new Date()
      }));


    comparison.correctedImages = [
      ...(comparison.correctedImages || []),
      ...mappedFiles,
    ];

    await doc.save();

     // 🔥 WebSocket Emission - Corrected images uploaded
    const dailySchedule = await DailyScheduleModel.findById(scheduleId);
    if (dailySchedule) {
      await SocketService.emitToProject(String(dailySchedule.projectId), 'workSchedule:correctimage_upload', {
        scheduleId,
        comparisonId,
        newCorrectedImages: doc.workComparison,
        uploadedBy: user?._id,
        uploadedByRole: user?.role
      });
    }


    return res.status(200).json({
      ok: true,
      message: "updaloaded successfully",
      data: doc.workComparison
    });
  }
  catch (error: any) {
    console.error("Error in addComparisonSelectImageController:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
}


export const deleteWorkCorrectImages = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { scheduleId, comparisonId, imageId } = req.params;
    const user = req.user;

    // Find parent document
    const doc = await DailyTaskSubModel.findById(scheduleId);
    if (!doc) {
      return res.status(404).json({ ok: false, message: "Schedule not found" });
    }

    // Find comparison object
    const comparison = (doc.workComparison as any).id(comparisonId);
    if (!comparison) {
      return res.status(404).json({ ok: false, message: "Comparison not found" });
    }

    // Find and remove image by _id
    const imageIndex = comparison.correctedImages.findIndex(
      (img: any) => img._id.toString() === imageId
    );

    if (imageIndex === -1) {
      return res.status(404).json({ ok: false, message: "Image not found" });
    }
    // Store deleted image info for socket emission
    const deletedImage = comparison.correctedImages[imageIndex];

    // Remove from array
    comparison.correctedImages.splice(imageIndex, 1);



    await doc.save();

      // 🔥 WebSocket Emission - Corrected image deleted
    const dailySchedule = await DailyScheduleModel.findById(scheduleId);
    if (dailySchedule) {
      await SocketService.emitToProject(String(dailySchedule.projectId), 'workSchedule:correctimage_delete', {
        scheduleId,
        comparisonId,
        imageId,
        deletedImage: doc.workComparison,
        deletedBy: user?._id,
        deletedByRole: user?.role
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Corrected image deleted successfully",
      data: doc.workComparison,
    });
  } catch (error: any) {
    console.error("Error in deleteWorkCorrectImages:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal Server Error",
      error: error.message,
    });
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
