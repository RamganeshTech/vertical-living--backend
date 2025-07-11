import { Request, Response } from "express";
import { ProjectDeliveryModel } from "../../../models/Stage Models/ProjectDelivery Model/ProjectDelivery.model";
import redisClient from "../../../config/redisClient";
import { handleSetStageDeadline, timerFunctionlity } from "../../../utils/common features/timerFuncitonality";
import { populateWithAssignedToField } from "../../../utils/populateWithRedis";
import { updateProjectCompletionPercentage } from "../../../utils/updateProjectCompletionPercentage ";

export const syncProjectDelivery = async (
    projectId: string
): Promise<any> => {

    if (!projectId) {
        return
    }

    const redisKey = `stage:ProjectDeliveryModel:${projectId}`;
    // const cached = await redisClient.get(redisKey);

    // if (cached) {
    //   return res.json({
    //     ok: true,
    //     message: "Fetched from cache",
    //     data: JSON.parse(cached),
    //   });
    // }

    let doc = await ProjectDeliveryModel.findOne({ projectId }).populate({
        path: "assignedTo",
        select: "_id staffName email",
    });

    if (!doc) {
        doc = await ProjectDeliveryModel.create({
            projectId,
            assignedTo: null,
            status: "pending",
            isEditable: true,
            timer: {
                startedAt: null,
                completedAt: null,
                deadLine: null,
                reminderSent: false,
            },
            uploads: [],
            clientConfirmed: false,
            ownerConfirmed: false,
            clientAcceptedAt: null,
        });
    } else {
        doc.timer.startedAt = null
        doc.timer.deadLine = null,
            doc.timer.completedAt = null,
            doc.timer.reminderSent = false,

            await doc.save()
    }

    await redisClient.del(redisKey);
};


/**
 * ✅ 1) Upload file metadata to ProjectDeliveryModel
 */
const uploadProjectDeliveryFile = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        if (!projectId) {
            return res.status(400).json({ ok: false, message: "Missing projectId." });
        }

        let files = [];

        if (req.files && Array.isArray(req.files)) {
            files = req.files;
        } else if (req.file) {
            files = [req.file];
        } else {
            return res.status(400).json({ ok: false, message: "No files found in request." });
        }

        const uploadedFiles = files.map((file: any) => ({
            type: file.mimetype.includes("pdf") ? "pdf" : "image",
            url: file.location,
            originalName: file.originalname,
            uploadedAt: new Date(),
        }));

        const updatedDoc = await ProjectDeliveryModel.findOneAndUpdate(
            { projectId },
            { $push: { uploads: { $each: uploadedFiles } } },
            { new: true }
        );

        if (!updatedDoc) {
            return res.status(404).json({ ok: false, message: "ProjectDelivery not found." });
        }

        // const cacheKey = `stage:ProjectDeliveryModel:${projectId}`;
        // await redisClient.set(cacheKey, JSON.stringify(updatedDoc.toObject()), { EX: 60 * 10 });

        await populateWithAssignedToField({ stageModel: ProjectDeliveryModel, projectId, dataToCache: updatedDoc })


        return res.json({
            ok: true,
            message: "Files uploaded and saved successfully.",
            data: uploadedFiles,
        });
    } catch (err: any) {
        console.error("Upload Project Delivery Files:", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
};


/**
 * ✅ 2) Delete uploaded file by _id in uploads array
 */
const deleteProjectDeliveryFile = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, fileId } = req.params;



        console.log("prjectid", projectId, fileId)
        if (!projectId || !fileId) {
            return res.status(400).json({ ok: false, message: "Missing projectId or fileId" });
        }



        const delivery = await ProjectDeliveryModel.findOne({ projectId });

        if (!delivery) {
            return res.status(404).json({ ok: false, message: "ProjectDelivery not found" });
        }

        delivery.uploads = delivery.uploads.filter(
            (file: any) => file._id?.toString() !== fileId
        );

        await delivery.save();

        // Clear cache if exists

        // const cacheKey = `stage:ProjectDeliveryModel:${projectId}`;
        // await redisClient.set(cacheKey, JSON.stringify(delivery.toObject()), { EX: 60 * 10 });

        await populateWithAssignedToField({ stageModel: ProjectDeliveryModel, projectId, dataToCache: delivery })


        return res.status(200).json({ ok: true, message: "File deleted", data: delivery.uploads });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ ok: false, message: "Server error", error: error.message });
    }
};

/**
 * ✅ 3) Update clientConfirmed status (+ update clientAcceptedAt)
 */
const updateClientConfirmation = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const { confirmed } = req.body;

        if (!projectId || typeof confirmed !== "boolean") {
            return res.status(400).json({ ok: false, message: "Invalid request body" });
        }

        const delivery = await ProjectDeliveryModel.findOne({ projectId });

        if (!delivery) {
            return res.status(404).json({ ok: false, message: "ProjectDelivery not found" });
        }

        delivery.clientConfirmation = confirmed;
        delivery.clientAcceptedAt = confirmed ? new Date() : null;

        await delivery.save();
        // const cacheKey = `stage:ProjectDeliveryModel:${projectId}`;
        // await redisClient.set(cacheKey, JSON.stringify(delivery.toObject()), { EX: 60 * 10 });

        await populateWithAssignedToField({ stageModel: ProjectDeliveryModel, projectId, dataToCache: delivery })



        return res.status(200).json({ ok: true, message: "Client confirmation updated", data: delivery });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ ok: false, message: "Server error", error: error.message });
    }
};

/**
 * ✅ 4) Update ownerConfirmed status
 */
const updateOwnerConfirmation = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const { confirmed } = req.body;

        if (!projectId || typeof confirmed !== "boolean") {
            return res.status(400).json({ ok: false, message: "Invalid request body" });
        }

        const delivery = await ProjectDeliveryModel.findOne({ projectId });

        if (!delivery) {
            return res.status(404).json({ ok: false, message: "ProjectDelivery not found" });
        }

        delivery.ownerConfirmation = confirmed;

        await delivery.save();
        // const cacheKey = `stage:ProjectDeliveryModel:${projectId}`;
        // await redisClient.set(cacheKey, JSON.stringify(delivery.toObject()), { EX: 60 * 10 });

        await populateWithAssignedToField({ stageModel: ProjectDeliveryModel, projectId, dataToCache: delivery })


        return res.status(200).json({ ok: true, message: "Owner confirmation updated", data: delivery });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ ok: false, message: "Server error", error: error.message });
    }
};

/**
 * ✅ 5) Get all ProjectDelivery details with assignedTo populated (_id, staffName, email)
 */
const getProjectDeliveryDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        if (!projectId) {
            return res.status(400).json({ ok: false, message: "Missing projectId" });
        }


        const cacheKey = `stage:ProjectDeliveryModel:${projectId}`;
        // await  redisClient.del(cacheKey);
        const cached = await redisClient.get(cacheKey);

        if (cached) {
            return res.status(200).json({ ok: true, message: "Fetched from cache", data: JSON.parse(cached) });
        }

        const delivery = await ProjectDeliveryModel.findOne({ projectId })

        if (!delivery) {
            return res.status(404).json({ ok: false, message: "ProjectDelivery not found" });
        }

        // await redisClient.set(cacheKey, JSON.stringify(delivery.toObject()), { EX: 60 * 10 });

        await populateWithAssignedToField({ stageModel: ProjectDeliveryModel, projectId, dataToCache: delivery })


        return res.status(200).json({ ok: true, message: "Fetched successfully", data: delivery });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ ok: false, message: "Server error", error: error.message });
    }
};





// COMMON CONTOROLLER


const setProjectDeliveryStageDeadline = (req: Request, res: Response): Promise<any> => {
    return handleSetStageDeadline(req, res, {
        model: ProjectDeliveryModel,
        stageName: "Project Delivery"
    });
};



const projectDeliveryCompletionStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const form = await ProjectDeliveryModel.findOne({ projectId });

        if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

        form.status = "completed";
        form.isEditable = false
        timerFunctionlity(form, "completedAt")
        await form.save();

        // const cacheKey = `stage:ProjectDeliveryModel:${projectId}`;

        // await redisClient.set(cacheKey, JSON.stringify(form.save()), { EX: 60 * 10 });

        await populateWithAssignedToField({ stageModel: ProjectDeliveryModel, projectId, dataToCache: form })

        res.status(200).json({ ok: true, message: "Quality Checkup stage marked as completed", data: form });

        updateProjectCompletionPercentage(projectId);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Server error, try again after some time" });
    }
};


/**
 * ✅ Grouped exports
 */
export {
    uploadProjectDeliveryFile,
    deleteProjectDeliveryFile,
    updateClientConfirmation,
    updateOwnerConfirmation,
    getProjectDeliveryDetails,


    setProjectDeliveryStageDeadline,
    projectDeliveryCompletionStatus
};
