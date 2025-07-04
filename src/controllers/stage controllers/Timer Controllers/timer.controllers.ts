import { Request, Response } from "express";
import mongoose, { Model } from "mongoose";

import { RequirementFormModel } from "../../../models/Stage Models/requirment model/requirement.model";
import { SampleDesignModel } from "../../../models/Stage Models/sampleDesing model/sampleDesign.model";
import { SiteMeasurementModel } from "../../../models/Stage Models/siteMeasurement models/siteMeasurement.model";
import { TechnicalConsultationModel } from "../../../models/Stage Models/technical consulatation/technicalconsultation.model";
import MaterialRoomConfirmationModel from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model";
import { CostEstimationModel } from "../../../models/Stage Models/Cost Estimation Model/costEstimation.model";
import PaymentConfirmationModel from "../../../models/Stage Models/Payment Confirmation model/PaymentConfirmation.model";
import OrderingMaterialModel from "../../../models/Stage Models/Ordering Material Model/orderingMaterial.model";
import MaterialArrivalModel from "../../../models/Stage Models/MaterialArrivalCheck Model/materialArrivalCheck.model";
import { CleaningAndSanitationModel } from "../../../models/Stage Models/Cleaning Model/cleaning.model";
import { ProjectDeliveryModel } from "../../../models/Stage Models/ProjectDelivery Model/ProjectDelivery.model";
import { QualityCheckupModel } from "../../../models/Stage Models/QualityCheck Model/QualityCheck.model";
import InstallationModel from "../../../models/Stage Models/installation model/Installation.model";
import WorkMainStageScheduleModel from "../../../models/Stage Models/WorkTask Model/WorkTask.model";
import redisClient from "../../../config/redisClient";


const stageModelMap = new Map<string, Model<Document>>([
    ["requirementform", RequirementFormModel as unknown as Model<Document>],
    ["sitemeasurement", SiteMeasurementModel as unknown as Model<Document>],
    ["sampledesign", SampleDesignModel as unknown as Model<Document>],
    ["technicalconsultation", TechnicalConsultationModel as unknown as Model<Document>],
    ["materialconfirmation", MaterialRoomConfirmationModel as unknown as Model<Document>],
    ["costestimation", CostEstimationModel as unknown as Model<Document>],
    ["paymentconfirmation", PaymentConfirmationModel as unknown as Model<Document>],
    ["orderingmaterial", OrderingMaterialModel as unknown as Model<Document>],
    ["materialarrivalcheck", MaterialArrivalModel as unknown as Model<Document>],
    ["worktasks", WorkMainStageScheduleModel as unknown as Model<Document>],
    ["installation", InstallationModel as unknown as Model<Document>],
    ["qualitycheck", QualityCheckupModel as unknown as Model<Document>],
    ["cleaning", CleaningAndSanitationModel as unknown as Model<Document>],
    ["projectdelivery", ProjectDeliveryModel as unknown as Model<Document>],
]);



export const startStageTimer = async (req: Request, res: Response): Promise<any> => {
    try {
        const { stageName, projectId } = req.params;

        const { startedAt } = req.body;

        const Model = stageModelMap.get(stageName);

        if (!Model) {
            return res.status(400).json({ ok: false, message: "Invalid stage name." });
        }

        const doc: any = await Model.findOne({ projectId });
        if (!doc) {
            return res.status(404).json({ ok: false, message: "Stage document not found." });
        }


        let startDate: Date;

        const nowUTC = new Date();
        const utcTimestamp = nowUTC.getTime() + nowUTC.getTimezoneOffset() * 60 * 1000;
        const ISTOffset = 5.5 * 60 * 60 * 1000;
        const istNow = new Date(utcTimestamp + ISTOffset);

        if (startedAt) {
            // Parse user input
            startDate = new Date(startedAt);

            if (isNaN(startDate.getTime())) {
                return res.status(400).json({ ok: false, message: "Invalid startedAt format." });
            }

            const inputUTC = startDate.getTime() + startDate.getTimezoneOffset() * 60 * 1000;
            const inputIST = new Date(inputUTC + ISTOffset);

            if (inputIST < istNow) {
                return res.status(400).json({ ok: false, message: "Started date & time cannot be in the past (IST)." });
            }
        } else {
            // No time provided → use today IST at 00:00:00
            const istTodayMidnight = new Date(
                istNow.getFullYear(),
                istNow.getMonth(),
                istNow.getDate(),
                0, 0, 0
            );

            // Convert this back to UTC
            const istMidnightUTC = new Date(istTodayMidnight.getTime() - ISTOffset);
            startDate = istMidnightUTC;
        }

        // Start the timer explicitly
        doc.timer = {
            ...doc.timer,
            startedAt: startDate,
            completedAt: null,
            reminderSent: false,
        };

        await doc.save();

        const redisKey = `stage:${Model.modelName}:${projectId}`;
        await redisClient.set(redisKey, JSON.stringify(doc.toObject()), { EX: 60 * 10 });

        return res.status(200).json({ ok: true, message: `Timer started for ${stageName}`, data: doc.timer });
    } catch (err: any) {
        console.error("Start stage timer error:", err);
        return res.status(500).json({ ok: false, message: "Server error" });
    }
};
