import { Request, Response } from "express";
import { Model, Types } from "mongoose";


import { CostEstimationModel } from "../../../models/Stage Models/Cost Estimation Model/costEstimation.model";
import MaterialRoomConfirmationModel from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model";
import { RequirementFormModel } from "../../../models/Stage Models/requirment model/requirement.model";
import { SampleDesignModel } from "../../../models/Stage Models/sampleDesing model/sampleDesign.model";
import { SiteMeasurementModel } from "../../../models/Stage Models/siteMeasurement models/siteMeasurement.model";
import { TechnicalConsultationModel } from "../../../models/Stage Models/technical consulatation/technicalconsultation.model";
import PaymentConfirmationModel from "../../../models/Stage Models/Payment Confirmation model/PaymentConfirmation.model";
// import OrderingMaterialModel from "../../../models/Stage Models/Ordering Material Model/orderingMaterial.model";
// import MaterialArrivalModel from "../../../models/Stage Models/MaterialArrivalCheck Model/materialArrivalCheck.model";
import WorkMainStageScheduleModel from "../../../models/Stage Models/WorkTask Model/WorkTask.model";
import InstallationModel from "../../../models/Stage Models/installation model/Installation.model";
import { QualityCheckupModel } from "../../../models/Stage Models/QualityCheck Model/QualityCheck.model";
import { CleaningAndSanitationModel } from "../../../models/Stage Models/Cleaning Model/cleaning.model";
import { ProjectDeliveryModel } from "../../../models/Stage Models/ProjectDelivery Model/ProjectDelivery.model";
import redisClient from "../../../config/redisClient";
import { assignedTo, selectedFields } from "../../../constants/BEconstants";
import MaterialArrivalModel from "../../../models/Stage Models/MaterialArrivalCheck Model/materialArrivalCheckNew.model";
import { OrderMaterialHistoryModel } from "../../../models/Stage Models/Ordering Material Model/OrderMaterialHistory.model";


export const stageModelMap = new Map<string, Model<Document>>([
  ["RequirementFormModel", RequirementFormModel as unknown as Model<Document>],
  ["SiteMeasurementModel", SiteMeasurementModel as unknown as Model<Document>],
  ["SampleDesignModel", SampleDesignModel as unknown as Model<Document>],
  ["TechnicalConsultationModel", TechnicalConsultationModel as unknown as Model<Document>],
  ["MaterialRoomConfirmationModel", MaterialRoomConfirmationModel as unknown as Model<Document>],
  ["CostEstimation", CostEstimationModel as unknown as Model<Document>],
  ["PaymentConfirmationModel", PaymentConfirmationModel as unknown as Model<Document>],
  ["OrderMaterialHistoryModel", OrderMaterialHistoryModel as unknown as Model<Document>],
  ["MaterialArrivalModel", MaterialArrivalModel as unknown as Model<Document>],
  ["WorkMainStageScheduleModel", WorkMainStageScheduleModel as unknown as Model<Document>],
  ["InstallationModel", InstallationModel as unknown as Model<Document>],
  ["QualityCheckupModel", QualityCheckupModel as unknown as Model<Document>],
  ["CleaningAndSanitationModel", CleaningAndSanitationModel as unknown as Model<Document>],
  ["ProjectDeliveryModel", ProjectDeliveryModel as unknown as Model<Document>],
]);

const assignStageStaffByName = async (req: Request, res: Response): Promise<any> => {
  try {
    const { stageName, projectId, staffId } = req.params;

    
    // console.log("staff", staffId)

    if (!stageName || !projectId) {
      return res.status(400).json({ message: "stageName and projectId required", ok: false });
    }

    if(!staffId){
      return res.status(400).json({ message: "select the staff to assign", ok: false });
    }

    console.log("staff", staffId)

    const StageModel = stageModelMap.get(stageName);

    if (!StageModel) {
      return res.status(400).json({ message: "Invalid stage name", ok: false });
    }

    if (!Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid projectId", ok: false });
    }

    if (staffId && !Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ message: "Invalid staffId", ok: false });
    }

    const updated = await StageModel.findOneAndUpdate(
      { projectId },
      { assignedTo: staffId || null },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Stage not found", ok: false });
    }


    const populatedData = await updated.populate(assignedTo, selectedFields)
    
    const redisMainKey = `stage:${stageName}:${projectId}`
    // console.log("key name", redisMainKey)
    await redisClient.set(redisMainKey, JSON.stringify(populatedData.toObject()), { EX: 60 * 10 })

    return res.status(200).json({ message: "Assigned successfully", data: updated, ok: true });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error", ok: false });
  }
};




export { assignStageStaffByName };

