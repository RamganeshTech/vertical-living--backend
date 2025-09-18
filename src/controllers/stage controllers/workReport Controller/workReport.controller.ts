


import { Types } from "mongoose";
import WorkReportModel, { IWorkReportUpload } from "../../../models/Stage Models/WorkReport Model/workReport.model";
import { RoleBasedRequest } from "../../../types/types";
import { Response } from "express";
import { DailyTaskSubModel } from "../../../models/Stage Models/WorkTask Model/dailySchedule.model";
// import { generateWorkReportImage, uploadImageToS3 } from "./imageWorkReport";

function transformWorkUploads(uploadItems: any[] | undefined): IWorkReportUpload[] {
    if (!Array.isArray(uploadItems)) return [];

    return uploadItems.map(item => ({
        _id: new Types.ObjectId(),         // 🔁 new _id
        type: item?.fileType,
        url: item.url,
        originalName: item.originalName ?? null,
        uploadedAt: new Date()
    }));
}


export async function createWorkReport(req: RoleBasedRequest, res: Response): Promise<any> {
    try {
        const {
            workerName,
            date,
            placeOfWork,
            reportingTime,
            workStartTime,
            travelingTime,
            workDone,
            finishingTime,
            shiftDone,
            placeOfStay,
            images,

        } = req.body;

        const { organizationId,
            projectId } = req.params

        const cleanImages = transformWorkUploads(images); // 🧼 Clean & assign new _id

        const report = await WorkReportModel.create({
            workerName,
            date,
            placeOfWork,
            reportingTime,
            workStartTime,
            travelingTime,
            workDone,
            finishingTime,
            shiftDone,
            placeOfStay,
            images: cleanImages,
            organizationId,
            projectId,
            imageLink: null
        });

        // const reportImageBuffer = await generateWorkReportImage(report); // ← your data

        // const fileName = `work-reports/${workerName}-${Date.now()}.png`;

        // const uploadResult = await uploadImageToS3(reportImageBuffer, fileName);

        // console.log("✅ Uploaded Image URL:", uploadResult.Location);


        // report.imageLin = {
        //     type: "image",
        //     url: uploadResult.Location,
        //     originalName: fileName,
        //     uploadedAt: new Date()
        // }

        // await report.save()
  
        res.status(201).json({
            ok: true,      
            // data: {
            //     url: uploadResult.Location,
            //     data: report,
            //     fileName:fileName
            // },
            data: report,
             message: "created successfully"
        });
    } catch (err) {
        console.error("Error creating work report", err);
        res.status(500).json({ ok: false, message: "Failed to create report." });
    }
}


export const getWorkReportsByProjectId = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        if (!projectId) {
            return res.status(400).json({ ok: false, message: "Invalid projectId" });
        }

        const reports = await WorkReportModel.find({ projectId }).sort({ date: -1 });

        res.status(200).json({ ok: true, data: reports });
    } catch (error) {
        console.error("❌ Error fetching work reports:", error);
        res.status(500).json({ ok: false, message: "Failed to fetch work reports" });
    }
};


export const deleteWorkReportById = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ ok: false, message: "Invalid report ID" });
        }

        const deleted = await WorkReportModel.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ ok: false, message: "Work report not found" });
        }

        res.status(200).json({ ok: true, message: "Work report deleted", data: deleted });
    } catch (error) {
        console.error("❌ Error deleting work report:", error);
        res.status(500).json({ ok: false, message: "Failed to delete work report" });
    }
};


// 📌 Controller: Get grouped daily task images by date
export const getDailyTaskImagesByDate = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId, id, date, dailyTaskId } = req.params;

        if (!projectId) {
            return res.status(400).json({ ok: false, message: "Invalid projectId" });
        }

        // Get all daily task subs for the project
        const dailyTaskSub = await DailyTaskSubModel.findOne({ projectId, _id: id }).lean();

        if (!dailyTaskSub) {
            return res.status(404).json({ ok: false, message: "No daily tasks found for this project" });
        }


        const dailywork = dailyTaskSub.dailyTasks.find((task: any) => task._id.toString() === dailyTaskId)

        console.log("dailysubtasks", dailyTaskSub)

        // const requestedDateKey = new Date(date).toISOString().split("T")[0];
        // console.log("requestedDateKey", requestedDateKey)
        let uploads: any[] = [];

        // Collect only uploads for the requested date
        // dailyTaskSub.dailyTasks.forEach((task: any) => {
        //     task?.uploadedImages?.forEach((uploadBlock: any) => {
        //         const uploadDateKey = new Date(uploadBlock.date).toISOString().split("T")[0];
        //         console.log("uploadDateKey", uploadDateKey)
        //         console.log("uploads", uploadBlock.uploads)
        //         if (uploadDateKey === requestedDateKey && Array.isArray(uploadBlock.uploads)) {
        //             uploads.push(...uploadBlock.uploads);
        //         }
        //     });
        // });


        dailywork?.uploadedImages?.forEach((uploadBlock: any) => {
            // const uploadDateKey = new Date(uploadBlock.date).toISOString().split("T")[0];
            // console.log("uploadDateKey", uploadDateKey)
            // console.log("uploads", uploadBlock.uploads)
            // if (uploadDateKey === requestedDateKey && Array.isArray(uploadBlock.uploads)) {
            //     uploads.push(...uploadBlock.uploads);
            // }
            uploads.push(...uploadBlock.uploads)
        });

        // Flatten all uploadedImages across all tasks
        // const groupedImages: Record<string, any[]> = {};

        // dailyTaskSub.dailyTasks.forEach((task: any) => {
        //     task.uploadedImages.forEach((uploadBlock: any) => {
        //         const dateKey = new Date(uploadBlock.date).toISOString().split("T")[0]; // YYYY-MM-DD

        //         if (!groupedImages[dateKey]) {
        //             groupedImages[dateKey] = [];
        //         }

        //         // Append uploads from this date
        //         if (Array.isArray(uploadBlock.uploads)) {
        //             groupedImages[dateKey].push(...uploadBlock.uploads);
        //         }
        //     });
        // });

        // // Convert grouped object into an array
        // const result = Object.keys(groupedImages).map((date) => ({
        //     date,
        //     uploads: groupedImages[date],
        // }));


        console.log("uploads", uploads)


        return res.status(200).json({
            ok: true,
            message: "Daily task images grouped by date fetched successfully",
            data: uploads,
        });
    } catch (error: any) {
        console.error("Error fetching daily task images:", error);
        return res.status(500).json({ ok: false, message: error.message });
    }
};
