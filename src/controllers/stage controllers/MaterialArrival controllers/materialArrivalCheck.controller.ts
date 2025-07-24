import { Request, Response } from "express";
import MaterialArrivalModel, { IMaterialArrival, IMaterialArrivalTimer } from "../../../models/Stage Models/MaterialArrivalCheck Model/materialArrivalCheck.model";
import { validateMaterialFieldsByRoom } from "../../../utils/validateMaterialArrivalStep";
import { generateOrderingToken } from "../../../utils/generateToken";
import { handleSetStageDeadline, timerFunctionlity } from "../../../utils/common features/timerFuncitonality";
import redisClient from "../../../config/redisClient";
import { syncWorkSchedule } from "../workTasksmain controllers/workMain.controller";
import { populateWithAssignedToField } from "../../../utils/populateWithRedis";
import { updateProjectCompletionPercentage } from "../../../utils/updateProjectCompletionPercentage ";
import { DocUpload } from "../../../types/types";
import { addOrUpdateStageDocumentation } from "../../documentation controller/documentation.controller";

const allowedRooms = [
    "carpentry", "hardware", "electricalFittings", "tiles", "ceramicSanitaryware",
    "paintsCoatings", "lightsFixtures", "glassMirrors", "upholsteryCurtains", "falseCeilingMaterials"
];

export const syncMaterialArrival = async (projectId: string) => {

    const existing = await MaterialArrivalModel.findOne({ projectId });

    if (!existing) {
        const timer: IMaterialArrivalTimer = {
            startedAt: null,
            completedAt: null,
            deadLine: null,
            reminderSent: false,
        };

        await MaterialArrivalModel.create({
            projectId: projectId,
            status: "pending",
            isEditable: true,
            generatedLink: null,
            assignedTo: null,
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
            materialArrivalList: {
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
        });
    }
    else {
        existing.timer.startedAt = null
        existing.timer.completedAt = null
        existing.timer.deadLine = null
        existing.timer.reminderSent = false


        existing.save()
    }

    const redisKey = `stage:MaterialArrivalModel:${projectId}`;
    await redisClient.del(redisKey);
}

const updateMaterialArrivalShopDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const { shopName, address, contactPerson, phoneNumber } = req.body;

        if (!shopName || !address || !contactPerson || !phoneNumber) {
            return res.status(400).json({ ok: false, message: "All shop details are required" });
        }

        const updated = await MaterialArrivalModel.findOneAndUpdate(
            { projectId },
            { $set: { shopDetails: { shopName, address, contactPerson, phoneNumber } } },
            { new: true, upsert: true }
        );

        if (!updated) {
            return res.status(400).json({ message: "failed to updated the details", ok: false })
        }

        // const redisMainKey = `stage:MaterialArrivalModel:${projectId}`
        // await redisClient.set(redisMainKey, JSON.stringify(updated.toObject()), { EX: 60 * 10 })

        await populateWithAssignedToField({ stageModel: MaterialArrivalModel, projectId, dataToCache: updated })


        res.json({ ok: true, data: updated?.shopDetails });
    } catch (err: any) {
        res.status(500).json({ ok: false, message: err.message });
    }
};

const updateMaterialArrivalDeliveryLocation = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const { siteName, address, siteSupervisor, phoneNumber } = req.body;

        if (!siteName || !address || !siteSupervisor || !phoneNumber) {
            return res.status(400).json({ ok: false, message: "All delivery location details are required" });
        }

        const updated = await MaterialArrivalModel.findOneAndUpdate(
            { projectId },
            { $set: { deliveryLocationDetails: { siteName, address, siteSupervisor, phoneNumber } } },
            { new: true, upsert: true }
        );

        if (!updated) {
            return res.status(400).json({ message: "failed to updated the details", ok: false })
        }


        // const redisMainKey = `stage:MaterialArrivalModel:${projectId}`
        // await redisClient.set(redisMainKey, JSON.stringify(updated.toObject()), { EX: 60 * 10 })

        await populateWithAssignedToField({ stageModel: MaterialArrivalModel, projectId, dataToCache: updated })


        res.json({ ok: true, data: updated?.deliveryLocationDetails });
    } catch (err: any) {
        res.status(500).json({ ok: false, message: err.message });
    }
};

const updateMaterialArrivalRoomItem = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, roomKey } = req.params;
        const file = req.file as Express.Multer.File & { location: string };
        const itemDataRaw = req.body.itemData;  // in FE {itemData}

        if (!itemDataRaw) {
            return res.status(400).json({ ok: false, message: "Item data is required" });
        }

        let itemData;
        try {
            itemData = JSON.parse(itemDataRaw);
        } catch {
            return res.status(400).json({ ok: false, message: "Invalid item data format" });
        }


        // ⬇️ Only add upload info if file is present
        if (file) {
            console.log("file", file)
            itemData.upload = {
                type: "image",
                url: file.location,
                originalName: file.originalname,
                uploadedAt: new Date()
            };
        }


        // ⬇️ Validate only if file was uploaded or 'upload' field already present
        if (file || itemData.upload) {
            const validation = validateMaterialFieldsByRoom(roomKey, itemData);
            if (!validation.success) {
                return res.status(400).json({ ok: false, message: validation.message });
            }
        }



        // ⬇️ If _id is present, perform update
        if (itemData?._id) {
            const updatePath = `materialArrivalList.${roomKey}`;
            const result = await MaterialArrivalModel.findOneAndUpdate(
                {
                    projectId,
                    [`${updatePath}._id`]: itemData._id,
                },
                {
                    $set: {
                        [`${updatePath}.$`]: itemData,
                    },
                },
                { new: true }
            );

            if (!result) {
                return res.status(404).json({ ok: false, message: "Item not found for update" });
            }


            const updatedRoom = (result.materialArrivalList as any)[roomKey]

            // const redisMainKey = `stage:MaterialArrivalModel:${projectId}`
            const redisRoomKey = `stage:MaterialArrivalModel:${projectId}:room:${roomKey}`
            // await redisClient.set(redisMainKey, JSON.stringify(result.toObject()), { EX: 60 * 10 })
            await redisClient.set(redisRoomKey, JSON.stringify(updatedRoom), { EX: 60 * 10 })

            await populateWithAssignedToField({ stageModel: MaterialArrivalModel, projectId, dataToCache: result })

            return res.status(200).json({ ok: true, message: "Item updated", data: result });
        }

        // ⬇️ add the materiallist for this room
        const result = await MaterialArrivalModel.findOneAndUpdate(
            { projectId },
            { $push: { [`materialArrivalList.${roomKey}`]: itemData } },
            { new: true }
        );

        if (!result) {
            console.log("is it getting  send")
            return res.status(404).json({ ok: false, message: "section not available" })
        }

        const updatedRoom = (result.materialArrivalList as any)[roomKey]
        // const redisMainKey = `stage:MaterialArrivalModel:${projectId}`
        const redisRoomKey = `stage:MaterialArrivalModel:${projectId}:room:${roomKey}`
        // await redisClient.set(redisMainKey, JSON.stringify(result.toObject()), { EX: 60 * 10 })
        await redisClient.set(redisRoomKey, JSON.stringify(updatedRoom), { EX: 60 * 10 })

        await populateWithAssignedToField({ stageModel: MaterialArrivalModel, projectId, dataToCache: result })


        return res.status(200).json({ ok: true, message: "Item added", data: result });

    } catch (err: any) {
        return res.status(500).json({ ok: false, message: err.message || "Server error" });
    }
};


const deleteMaterialArrivalRoomItem = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, roomKey, itemId } = req.params;

        const update = await MaterialArrivalModel.findOneAndUpdate(
            { projectId },
            { $pull: { [`materialArrivalList.${roomKey}`]: { _id: itemId } } },
            { new: true }
        );

        if (!update) {
            return res.status(400).json({ ok: false, message: "mateial arrival stage not available" });
        }

        const updatedRoom = (update.materialArrivalList as any)[roomKey] || []

        const redisRoomKey = `stage:MaterialArrivalModel:${projectId}:room:${roomKey}`
        // const redisMainKey = `stage:MaterialArrivalModel:${projectId}`

        // await redisClient.set(redisMainKey, JSON.stringify(update.toObject()), { EX: 60 * 10 })
        await populateWithAssignedToField({ stageModel: MaterialArrivalModel, projectId, dataToCache: update })

        await redisClient.set(redisRoomKey, JSON.stringify(updatedRoom), { EX: 60 * 10 })

        res.json({ ok: true, data: update });
    } catch (err: any) {
        res.status(500).json({ ok: false, message: err.message });
    }
};

const getAllMaterialArrivalDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        const redisMainKey = `stage:MaterialArrivalModel:${projectId}`
    // await redisClient.del(redisMainKey);

        const cachedData = await redisClient.get(redisMainKey)

        if (cachedData) {
            return res.status(200).json({ message: "data fetched from the cache", data: JSON.parse(cachedData), ok: true })
        }

        if (!projectId) {
            res.status(400).json({ ok: false, message: "project is requried" });

        }
        const doc = await MaterialArrivalModel.findOne({ projectId });

        if (!doc) {
            return res.status(400).json({ ok: false, message: "mateial arrival stage not available" });
        }

        // await redisClient.set(redisMainKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 })
        await populateWithAssignedToField({ stageModel: MaterialArrivalModel, projectId, dataToCache: doc })


        res.json({ ok: true, data: doc });
    } catch (err: any) {
        res.status(500).json({ ok: false, message: err.message });
    }
};

const getSingleRoomMaterialArrival = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, roomKey } = req.params;

        const redisRoomKey = `stage:MaterialArrivalModel:${projectId}:room:${roomKey}`

        const cachedData = await redisClient.get(redisRoomKey)

        if (cachedData) {
            return res.status(200).json({ message: "data fetched from the cache", data: JSON.parse(cachedData), ok: true })
        }

        const doc = await MaterialArrivalModel.findOne({ projectId });

        if (!doc) return res.status(404).json({ ok: false, message: "Not found" });

        const roomItems = (doc.materialArrivalList as any)[roomKey];
        if (!roomItems) return res.status(404).json({ ok: false, message: "Invalid room key" });

        await redisClient.set(redisRoomKey, JSON.stringify(roomItems), { EX: 60 * 10 })

        res.status(200).json({ ok: true, data: roomItems });
    } catch (err: any) {
        res.status(500).json({ ok: false, message: err.message });
    }
};

const generateMaterialArrivalLink = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        const doc = await MaterialArrivalModel.findOne({ projectId });
        if (!doc) return res.status(404).json({ ok: false, message: "Material Arrival document not found" });

        if (doc.generatedLink) {
            return res.status(400).json({ ok: false, message: "Link already generated" });
        }

        const token = generateOrderingToken(); // or use your custom function like generateMaterialArrivalToken()
        doc.generatedLink = `${process.env.FRONTEND_URL}/materialarrival/public/${projectId}/${token}`;
        await doc.save();

        return res.status(200).json({
            ok: true,
            message: "Link generated successfully",
            data: {
                token,
                shareableUrl: doc.generatedLink,
            }
        });
    } catch (err: any) {
        res.status(500).json({ ok: false, message: err.message });
    }
};

const getMaterialArrivalPublicDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, token } = req.params;
        const doc = await MaterialArrivalModel.findOne({ projectId });

        if (!doc) return res.status(404).json({ ok: false, message: "Invalid or expired link" });

        const { materialArrivalList, shopDetails, deliveryLocationDetails } = doc;
        res.json({ ok: true, data: { materialArrivalList, shopDetails, deliveryLocationDetails } });
    } catch (err: any) {
        res.status(500).json({ ok: false, message: err.message });
    }
};




// COMMON STAGE CONTROLLERS

const setMaterialArrivalStageDeadline = (req: Request, res: Response): Promise<any> => {
    return handleSetStageDeadline(req, res, {
        model: MaterialArrivalModel,
        stageName: "Material Arrival"
    });
};



const materialArrivalCompletionStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const form = await MaterialArrivalModel.findOne({ projectId });

        if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

        form.status = "completed";
        form.isEditable = false
        timerFunctionlity(form, "completedAt")
        await form.save();

        if (form.status === "completed") {
            await syncWorkSchedule(projectId)

            let uploadedFiles: DocUpload[] = [];

            const categories = Object.keys(form.materialArrivalList || {});

            for (const category of categories) {
                const items = (form.materialArrivalList as any)[category] || [];

                items.forEach((item: any) => {
                    if (item.upload && item.upload.url) {
                        uploadedFiles.push({
                            type: item.upload.type,
                            url: item.upload.url,
                            originalName: item.upload.originalName,
                        });
                    }
                });
            }


            await addOrUpdateStageDocumentation({
                projectId,
                stageNumber: "9", // Material Arrival stage number
                description: "Material Arrival Stage is documented",
                uploadedFiles,
            });

        }
        // const redisMainKey = `stage:MaterialArrivalModel:${projectId}}`
        // await redisClient.set(redisMainKey, JSON.stringify(form.toObject()), { EX: 60 * 10 })


        await populateWithAssignedToField({ stageModel: MaterialArrivalModel, projectId, dataToCache: form })

        res.status(200).json({ ok: true, message: "mateiral arrival stage marked as completed", data: form.status });

        updateProjectCompletionPercentage(projectId);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Server error, try again after some time" });
    }
};


export {
    updateMaterialArrivalShopDetails,
    updateMaterialArrivalDeliveryLocation,
    updateMaterialArrivalRoomItem,
    deleteMaterialArrivalRoomItem,
    getAllMaterialArrivalDetails,
    getSingleRoomMaterialArrival,
    generateMaterialArrivalLink,
    getMaterialArrivalPublicDetails,

    setMaterialArrivalStageDeadline,
    materialArrivalCompletionStatus
};
