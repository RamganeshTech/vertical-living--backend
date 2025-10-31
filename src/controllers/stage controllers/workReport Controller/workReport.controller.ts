


import { Types } from "mongoose";
import WorkReportModel, { IWorkReportUpload } from "../../../models/Stage Models/WorkReport Model/workReport.model";
import { RoleBasedRequest } from "../../../types/types";
import { Request, Response } from "express";
import { DailyTaskSubModel } from "../../../models/Stage Models/WorkTask Model/dailySchedule.model";
// import { generateWorkReportImage, uploadImageToS3 } from "./imageWorkReport";
// import fetch from "node-fetch";
import { generateWorkReportImage, uploadImageToS3 } from "./imageWorkReport";


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
            images
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
        imageLink:null 
        });

    const reportImageBuffer = await generateWorkReportImage(report); // ← your data

    const fileName = `work-reports/${workerName}-${Date.now()}.png`;

    const uploadResult = await uploadImageToS3(reportImageBuffer, fileName);

    console.log("✅ Uploaded Image URL:", uploadResult.Location);


    report.imageLink = {
        type: "image",
        url: uploadResult.Location,
        originalName: fileName,
        uploadedAt: new Date()
    }

    await report.save()

    res.status(201).json({
        ok: true,
        data: {
            url: uploadResult.Location,
            data: report,
            fileName:fileName
        },
        // data: report,
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
        const { projectId, id, dailyTaskId } = req.params;

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

      

        dailywork?.uploadedImages?.forEach((uploadBlock: any) => {
            uploads.push(...uploadBlock.uploads)
        });

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



// export const proxyImageFromS3 = async (req: Request, res: Response):Promise<any> => {
//     try {
//   const { url } = req.query;

//   console.log("req.query.url", url)
//   if (!url || typeof url !== "string") {
//     return res.status(400).json({ ok: false, message: "Invalid image URL" });
//   }

//     const decodedUrl = decodeURIComponent(url); // 👈 FIX
//     console.log("🌐 Decoded S3 Proxy URL:", decodedUrl);

//     const response = await fetch(decodedUrl); // node-fetch must be installed (or use Axios)

//     if (!response.ok || !response.body) {
//       return res.status(500).json({ok: false, message: "Failed to fetch image from source" });
//     }

// console.log("response", response)
//     const contentType = response.headers.get("content-type");

//     res.set("Content-Type", contentType || "image/jpeg");
//     res.set("Access-Control-Allow-Origin", "*"); // 👈 Fixes CORS
//     (response.body as any)?.pipe(res);
//     // if (response.body) {
//     //   // Convert web ReadableStream to Node.js stream
//     //   const { Readable } = require("stream");
//     //   const nodeStream = Readable.fromWeb(response.body as any);
//     // //   console.log("nodejsstreadm", res)
//     //   nodeStream.pipe(res);
//     // } else {
//     //     console.log("form the error page")
//     //   res.status(500).send("No image data found.");
//     // }    
//   } catch (error) {
//     console.error("Error proxying image:", error);
//     res.status(500).send("Failed to fetch and proxy image.");
//   }
// }; 