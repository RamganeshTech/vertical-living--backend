import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose'
import { CostEstimationModel, ICostEstimaionUpload, ICostEstimation } from '../../../models/Stage Models/Cost Estimation Model/costEstimation.model';
import { SiteMeasurementModel } from '../../../models/Stage Models/siteMeasurement models/siteMeasurement.model';
import MaterialRoomConfirmationModel, { IMaterialRoomConfirmation } from './../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model';
import { PREDEFINED_ROOMS } from '../../../constants/phaseConstants';
import { handleSetStageDeadline, timerFunctionlity } from '../../../utils/common features/timerFuncitonality';
import { syncInstallationWork } from '../installation controllers/installation.controller';
import { syncQualityCheck } from '../QualityCheck controllers/QualityCheck.controller';
import { syncPaymentConfirationModel } from '../PaymentConfirmation controllers/PaymentMain.controllers';
import { assignedTo, selectedFields } from '../../../constants/BEconstants';
import { updateProjectCompletionPercentage } from '../../../utils/updateProjectCompletionPercentage ';
import { addOrUpdateStageDocumentation } from '../../documentation controller/documentation.controller';
import { DocUpload } from '../../../types/types';


const generateCostEstimationFromMaterialSelection = async (
    materialDoc: Partial<IMaterialRoomConfirmation> = {},
    projectId: string
): Promise<any> => {

    // Check if cost estimation already exists
    const existing = await CostEstimationModel.findOne({ projectId });

    const timer = {
        startedAt: null,
        completedAt: null,
        deadLine: null,
        reminderSent: false,
    };

    if (!existing) {
        const materialEstimation: any[] = [];

        
        // Handle predefined rooms
        for (const room of materialDoc?.rooms || []) {
            if (room.roomFields) {
                const materials = Object.keys(room.roomFields).map((fieldKey) => ({
                    key: fieldKey,
                    areaSqFt: null,
                    predefinedRate: null,
                    overriddenRate: null,
                    finalRate: null,
                    totalCost: null,
                }));

                materialEstimation.push({
                    name: room.name,
                    materials,
                    totalCost: null,
                    uploads: [],
                });
            }
        }

        // Handle custom rooms
        for (const customRoom of materialDoc?.customRooms || []) {
            const materials = customRoom.items.map((item) => ({
                key: item.itemKey,
                areaSqFt: null,
                predefinedRate: null,
                overriddenRate: null,
                finalRate: null,
                totalCost: null,
            }));

            materialEstimation.push({
                name: customRoom.name,
                materials,
                totalCost: null,
                uploads: [],
            });
        }

       const cost =  await CostEstimationModel.create({
            projectId,
            materialEstimation,
            assignedTo: null,
            labourEstimations: [],
            totalMaterialCost: 0,
            totalLabourCost: 0,
            totalEstimation: 0,
            isEditable: true,
            timer: {
                startedAt: null,
                completedAt: null,
                deadLine: null,
                reminderSent: false,
            },
            status: "pending",
        });
    }
    else {
        // Update timer
        existing.timer = timer;

        // Get current valid room names from materialDoc
        const validRoomNames = new Set([
            ...(materialDoc?.rooms || []).map(r => r.name),
            ...(materialDoc?.customRooms || []).map(r => r.name)
        ]);

        // Filter out deleted rooms from materialEstimation
        existing.materialEstimation = existing?.materialEstimation?.filter((estimation) =>
            validRoomNames.has(estimation?.name)
        );


        const existingRoomNames = new Set(existing.materialEstimation?.map((r) => r.name));

        for (const customRoom of materialDoc?.customRooms || []) {
            if (!existingRoomNames.has(customRoom?.name)) {
                const materials = customRoom?.items?.map((item) => ({
                    key: item.itemKey,
                    areaSqFt: null,
                    predefinedRate: null,
                    overriddenRate: null,
                    finalRate: null,
                    totalCost: null,
                }));

                existing.materialEstimation?.push({
                    name: customRoom.name,
                    materials,
                    totalCost: 0,
                    uploads: [],
                });
            }
        }

        await existing.save();

        console.log("exisitn cost in if condition, e")

    }
};


const getCostEstimationByProject = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        if (!projectId) {
            return res.status(400).json({ ok: false, message: "Project ID is required" });
        }

        const costEstimation = await CostEstimationModel.findOne({ projectId }).populate(assignedTo, selectedFields);

        if (!costEstimation) {
            return res.status(404).json({ ok: false, message: "Cost estimation not found" });
        }

        return res.status(200).json({
            ok: true,
            message: "Cost estimation data retrieved",
            data: costEstimation,
        });
    } catch (error) {
        console.error("Error fetching cost estimation:", error);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};


const getSingleRoomEstimation = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, roomId } = req.params;

        if (!projectId || !roomId) {
            return res.status(400).json({ ok: false, message: "Project ID and roomId are required" });
        }

        const costEstimation = await CostEstimationModel.findOne({ projectId });
        if (!costEstimation) {
            return res.status(404).json({ ok: false, message: "Cost estimation not found" });
        }

        const room = costEstimation.materialEstimation.find((room: any) =>
            room._id.equals(new mongoose.Types.ObjectId(roomId))
        );

        if (!room) {
            return res.status(404).json({ ok: false, message: "Room not found in cost estimation" });
        }

        return res.status(200).json({
            ok: true,
            message: `Cost estimation for room retrieved`,
            data: room,
        });
    } catch (error) {
        console.error("Error fetching single room estimation:", error);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};

const updateMaterialEstimationItem = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, materialKey } = req.params;
        const { areaSqFt, predefinedRate, overriddenRate } = req.body;

        if (!projectId || !materialKey) {
            return res.status(400).json({ ok: false, message: "Project ID and material key are required" });
        }

        const costEstimation = await CostEstimationModel.findOne({ projectId });
        if (!costEstimation) {
            return res.status(404).json({ ok: false, message: "Cost estimation not found" });
        }

        let foundItem = null;
        let foundRoomIndex = -1;
        let foundMaterialIndex = -1;

        for (let i = 0; i < costEstimation.materialEstimation.length; i++) {
            const room = costEstimation.materialEstimation[i];
            const index = room.materials.findIndex(
                (m) => m.key?.toLowerCase() === materialKey.toLowerCase()
            );

            if (index !== -1) {
                foundItem = room.materials[index];
                foundRoomIndex = i;
                foundMaterialIndex = index;
                break;
            }
        }

        if (!foundItem) {
            return res.status(404).json({ ok: false, message: "Material item not found" });
        }

        // Update only allowed fields
        if (typeof areaSqFt === "number" && areaSqFt >= 0) {
            foundItem.areaSqFt = areaSqFt;
        }

        if (typeof predefinedRate === "number" && predefinedRate >= 0) {
            foundItem.predefinedRate = predefinedRate;
        }

        foundItem.overriddenRate = typeof overriddenRate === "number" ? overriddenRate : null;

        // Compute finalRate and totalCost
        const finalRate =
            foundItem.overriddenRate && foundItem.overriddenRate > 0
                ? foundItem.overriddenRate
                : foundItem.predefinedRate ?? 0;

        foundItem.finalRate = finalRate;
        foundItem.totalCost =
            typeof foundItem.areaSqFt === "number" && typeof finalRate === "number"
                ? foundItem.areaSqFt * finalRate
                : 0;

        // Update the room totalCost
        const updatedRoom = costEstimation.materialEstimation[foundRoomIndex];
        updatedRoom.totalCost = updatedRoom.materials.reduce((acc, material) => acc + (material.totalCost || 0), 0);

        costEstimation.materialEstimation[foundRoomIndex] = updatedRoom;

        // ✅ Recalculate project-level total material cost
        costEstimation.totalMaterialCost = costEstimation.materialEstimation.reduce(
            (sum, room) => sum + (room.totalCost || 0),
            0
        );

        // ✅ Recalculate grand total estimation
        costEstimation.totalEstimation = (costEstimation.totalMaterialCost || 0) + (costEstimation.totalLabourCost || 0);


        await costEstimation.save();

        return res.status(200).json({
            ok: true,
            message: "Material estimation item updated successfully",
            data: foundItem,
        });
    } catch (error) {
        console.error("Error updating material estimation:", error);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};



// LABOUR COST ESTIAMATION CONTROLLERS BEGINS HERE

const getLabourEstimations = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        const doc = await CostEstimationModel.findOne({ projectId });


        console.log("getLabourEstimations getLabourEstimations getLabourEstimations si  called")

        if (!doc) {
            return res.status(404).json({ ok: false, message: "Cost Estimation not found" });
        }

        res.status(200).json({
            ok: true,
            message: "Labour estimations fetched successfully",
            data: doc.labourEstimations,
        });
    } catch (err) {
        console.error("Error fetching labour estimations:", err);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
};


// 1. Add Labour Estimation
const addLabourEstimation = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const {
            workType,
            // workerId,
            noOfPeople,
            daysPlanned,
            perdaySalary,
            // uploads
        } = req.body;

        if (!projectId) {
            return res.status(400).json({
                ok: false,
                message: "Missing required projectId",
            });
        }

        if (!workType) {
            return res.status(400).json({
                ok: false,
                message: "Missing required field: workType",
            });
        }




        const doc = await CostEstimationModel.findOne({ projectId });
        if (!doc) return res.status(404).json({ ok: false, message: "Project not found" });


        const weeklySalary = perdaySalary ? (perdaySalary * noOfPeople) * 7 : 0;
        const totalCost = daysPlanned ? (perdaySalary * daysPlanned) * noOfPeople : 0;


        const newEntry = {
            workType,
            // workerId,
            noOfPeople,
            daysPlanned,
            weeklySalary,
            perdaySalary,
            totalCost,
            // uploads: uploads || []
        };

        doc.labourEstimations.push(newEntry);


        // Recalculate totalLabourCost
        doc.totalLabourCost = doc.labourEstimations.reduce((sum, item) => sum + (item.totalCost || 0), 0);

        // Recalculate totalEstimation = totalMaterialCost + totalLabourCost
        doc.totalEstimation = (doc.totalMaterialCost || 0) + doc.totalLabourCost;

        await doc.save();

        res.status(201).json({ ok: true, message: "Labour estimation added", data: newEntry });
    } catch (err) {
        console.error("Add labour estimation error:", err);
        res.status(500).json({ ok: false, message: "Server error" });
    }
};




const editLabourEstimation = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, labourId } = req.params;
        const { daysPlanned, perdaySalary, workType, noOfPeople } = req.body;

        if (daysPlanned === null || perdaySalary === null || workType === null || noOfPeople === null) {
            return res.status(400).json({
                ok: false,
                message: "workType, daysPlanned, perdaySalary or noOfPeople should not be null",
            });
        }

        const doc = await CostEstimationModel.findOne({ projectId });
        if (!doc) return res.status(404).json({ ok: false, message: "Project not found" });

        const labour = (doc.labourEstimations as Types.DocumentArray<any>).id(labourId);
        if (!labour) return res.status(404).json({ ok: false, message: "Labour item not found" });

        // ✅ Only update editable fields
        if (typeof workType === "string") labour.workType = workType;
        if (typeof daysPlanned === "number") labour.daysPlanned = daysPlanned;
        if (typeof perdaySalary === "number") labour.perdaySalary = perdaySalary;
        if (typeof noOfPeople === "number") labour.noOfPeople = noOfPeople;

        // 🔁 Recalculate dependent fields
        labour.weeklySalary = (labour.perdaySalary * labour.noOfPeople) * 7;
        labour.totalCost = labour.perdaySalary * labour.daysPlanned;

        // 🔁 Recalculate total labour cost and overall total
        doc.totalLabourCost = doc.labourEstimations.reduce((sum, item) => sum + (item.totalCost || 0), 0);
        doc.totalEstimation = (doc.totalMaterialCost || 0) + doc.totalLabourCost;

        await doc.save();

        return res.status(200).json({ ok: true, message: "Labour estimation updated successfully", data: labour, });
    } catch (err) {
        console.error("Edit labour estimation error:", err);
        res.status(500).json({ ok: false, message: "Server error" });
    }
};


// controllers/costEstimation.controller.ts

const deleteLabourEstimation = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, labourId } = req.params;


        if (!projectId || !labourId) {
            return res.status(400).json({
                ok: false,
                message: "Missing required projectId and labourId",
            });
        }

        const doc = await CostEstimationModel.findOne({ projectId });
        if (!doc) return res.status(404).json({ ok: false, message: "Cost Estimation not found" });

        const labourIndex = doc.labourEstimations.findIndex((item: any) => item._id.toString() === labourId);
        if (labourIndex === -1) return res.status(404).json({ ok: false, message: "Labour item not found" });

        // ❌ Remove labour entry
        doc.labourEstimations.splice(labourIndex, 1);

        // 🔁 Recalculate total labour cost
        doc.totalLabourCost = doc.labourEstimations.reduce((sum, item) => sum + (item.totalCost || 0), 0);

        // 🔁 Recalculate overall total estimation
        doc.totalEstimation = (doc.totalMaterialCost || 0) + doc.totalLabourCost;

        await doc.save();

        return res.status(200).json({
            ok: true,
            message: "Labour estimation deleted successfully",
        });

    } catch (err) {
        console.error("Delete labour estimation error:", err);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
};



// COMMON STAGE CONTROLLERS

const setCostEstimationStageDeadline = (req: Request, res: Response): Promise<any> => {
    return handleSetStageDeadline(req, res, {
        model: CostEstimationModel,
        stageName: "Cost Estimation"
    });
};



const costEstimationCompletionStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const form = await CostEstimationModel.findOne({ projectId });

        if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

        // if(form.status === "completed"){
        //     return res.status(400).json({ ok: false, message: "already set to completed stage" });
        // }

        form.status = "completed";
        form.isEditable = false
        timerFunctionlity(form, "completedAt")
        await form.save();

        if (form.status === "completed") {
            await syncPaymentConfirationModel(projectId, form.totalEstimation)

            let uploadedFiles: DocUpload[] = [];

            const extractUploads = (room: any): DocUpload[] => {
                return room.uploads?.map((file: any) => ({
                    type: file.type,
                    url: file.url,
                    originalName: file.originalName,
                })) || []

            };

            uploadedFiles = form.materialEstimation.flatMap(extractUploads);

            await addOrUpdateStageDocumentation({
                projectId,
                stageNumber: "6", // ✅ Put correct stage number here
                description: "Cost Estimation Stage is documented",
                uploadedFiles, // optionally add files here
                price: form.totalEstimation
            })
        }

        res.status(200).json({ ok: true, message: "cost estimation stage marked as completed", data: form });

        updateProjectCompletionPercentage(projectId);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Server error, try again after some time" });
    }
};


// FILE UPLOAD CONTROLLLERS

const uploadCostEstimationFiles = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, roomId } = req.params;

        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ ok: false, message: "No files uploaded" });
        }

        const doc = await CostEstimationModel.findOne({ projectId });
        if (!doc) return res.status(404).json({ ok: false, message: "Cost Estimation not found" });

        const room = doc.materialEstimation.find((room: any) => room._id.toString() === roomId);
        if (!room) return res.status(404).json({ ok: false, message: "Room not found" });

        const uploadedFiles: ICostEstimaionUpload[] = (req.files as (Express.Multer.File & { location: string })[]).map(
            (file) => ({
                type: file.mimetype.includes("pdf") ? "pdf" : "image",
                url: file.location,
                originalName: file.originalname,
                uploadedAt: new Date(),
            })
        );

        if (!room.uploads) room.uploads = [];
        room.uploads.push(...uploadedFiles);
        console.log(room)
        await doc.save();

        return res.status(200).json({ ok: true, message: "Files uploaded successfully", data: uploadedFiles });
    } catch (err) {
        console.error("Error uploading files to cost estimation room:", err);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};



const deleteCostEstimationFile = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, roomId, fileId } = req.params;

        const doc = await CostEstimationModel.findOne({ projectId });
        if (!doc) return res.status(404).json({ ok: false, message: "Cost Estimation not found" });

        const room = doc.materialEstimation.find((room: any) => room._id.toString() === roomId);
        if (!room) return res.status(404).json({ ok: false, message: "Room not found" });
        console.log(fileId,)
        // const index = room.uploads.findIndex((upload: any) => upload._id?.toString() === fileId);
        const index = room.uploads.findIndex((upload: any) => {
            console.log("upload", upload)
            console.log("filedi", fileId)


            return upload._id?.toString() === fileId
        }

        );

        if (index === -1) return res.status(404).json({ ok: false, message: "File not found" });

        room.uploads.splice(index, 1);
        await doc.save();

        return res.status(200).json({ ok: true, message: "File deleted successfully" });
    } catch (err) {
        console.error("Error deleting uploaded file:", err);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};


export {
    generateCostEstimationFromMaterialSelection,
    getCostEstimationByProject,
    getSingleRoomEstimation,
    updateMaterialEstimationItem,

    getLabourEstimations,
    addLabourEstimation,
    editLabourEstimation,
    deleteLabourEstimation,

    setCostEstimationStageDeadline,
    costEstimationCompletionStatus,

    uploadCostEstimationFiles,
    deleteCostEstimationFile
}