import { Model } from "mongoose";
import { CostEstimationModel } from "../../models/Stage Models/Cost Estimation Model/costEstimation.model";
import MaterialRoomConfirmationModel from "../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model";
import { RequirementFormModel } from "../../models/Stage Models/requirment model/requirement.model";
import { SampleDesignModel } from "../../models/Stage Models/sampleDesing model/sampleDesign.model";
import { SiteMeasurementModel } from "../../models/Stage Models/siteMeasurement models/siteMeasurement.model";
import { TechnicalConsultationModel } from "../../models/Stage Models/technical consulatation/technicalconsultation.model";
import PaymentConfirmationModel from "../../models/Stage Models/Payment Confirmation model/PaymentConfirmation.model";
import OrderingMaterialModel from "../../models/Stage Models/Ordering Material Model/orderingMaterial.model";
import MaterialArrivalModel from "../../models/Stage Models/MaterialArrivalCheck Model/materialArrivalCheck.model";
import WorkMainStageScheduleModel from "../../models/Stage Models/WorkTask Model/WorkTask.model";
import InstallationModel from "../../models/Stage Models/installation model/Installation.model";

export const resetStages = async (projectId: string, upToStageNumber: number) => {
    // const now = new Date();

    const stageModels: Model<any>[] = [
        RequirementFormModel,               // Stage 1
        SiteMeasurementModel,   // Stage 2
        SampleDesignModel, // Stage 3
        TechnicalConsultationModel,      // Stage 4
        MaterialRoomConfirmationModel,      // Stage 5
        CostEstimationModel,                // Stage 6
        PaymentConfirmationModel,    //stage 7
        OrderingMaterialModel,  //Stage 8
        MaterialArrivalModel, // //Stage 9
        WorkMainStageScheduleModel,  //Stage 10
        InstallationModel , //Stage 11
        // QualityCheck,
        // CleaningSanitizing,
        // ProjectDelivery,
        // ...up to Stage 14
    ];

    // Reset only up to the requested stage
    for (let i = 0; i < upToStageNumber; i++) {
        const model = stageModels[i];
        const doc = await model.findOne({ projectId });
        if (!doc) continue;

        // Reset stage
        doc.status = "pending";
        if ("isEditable" in doc) {
            doc.isEditable = i === 0;
        }
        // doc.timer = {
        //     startedAt: i === 0 ? now : null,
        //     completedAt: null,
        //     deadline: i === 0 ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) : null,
        // };

        await doc.save();
    }

    return true;
};
