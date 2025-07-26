// controllers/selectedModularUnit.controller.ts
import { Request, Response } from "express";
import { SelectedModularUnitModel } from "../../../models/Modular Units Models/All Unit Model/SelectedModularUnit Model/selectedUnit.model";
import mongoose from "mongoose";
import { RoleBasedRequest } from "../../../types/types";
import PaymentConfirmationModel from "../../../models/Stage Models/Payment Confirmation model/PaymentConfirmation.model";
import MaterialRoomConfirmationModel from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model";
import { CostEstimationModel } from "../../../models/Stage Models/Cost Estimation Model/costEstimation.model";
import { generateCostEstimationFromMaterialSelection } from "../../stage controllers/cost estimation controllers/costEstimation.controller";
import { syncPaymentConfirationModel } from "../../stage controllers/PaymentConfirmation controllers/PaymentMain.controllers";
import { populateWithAssignedToField } from "../../../utils/populateWithRedis";
import { assignedTo, selectedFields } from "../../../constants/BEconstants";

// ADD A UNIT
export const addSelectedUnit = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { projectId, unitId, category, quantity, singleUnitCost , image, customId} = req.body;

    const singleUnitTotal = singleUnitCost * quantity;

    let record = await SelectedModularUnitModel.findOne({ projectId });

    if (!record) {
      // First entry for this project
      record = await SelectedModularUnitModel.create({
        projectId,
        selectedUnits: [{ unitId, category, quantity, singleUnitCost , image, customId}],
        totalCost: singleUnitTotal,
      });
    } else {
      // Add new unit to existing project
      record.selectedUnits.push({ unitId, category, quantity, singleUnitCost, image, customId });
      record.totalCost = record.selectedUnits.reduce(
        (acc, unit) => acc + unit.singleUnitCost * unit.quantity,
        0
      );
      await record.save();
    }

    return res.status(200).json({ ok: true, data: record });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message });
  }
};

// GET ALL UNITS FOR A PROJECT
export const getSelectedUnitsByProject = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    const data = await SelectedModularUnitModel.findOne({ projectId });

    return res.status(200).json({ ok: true, data, message: "fetched all the selcted units" });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message });
  }
};

// DELETE ONE UNIT FROM A PROJECT
export const deleteSelectedUnit = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { projectId, unitId } = req.params;

    const record = await SelectedModularUnitModel.findOne({ projectId });

    if (!record) return res.status(404).json({ ok: false, message: "No record found" });

    record.selectedUnits = record.selectedUnits.filter(
      (unit: any) => unit.unitId.toString() !== unitId
    );

    // Recalculate totalCost
    record.totalCost = record.selectedUnits.reduce(
      (acc, unit: any) => acc + unit.singleUnitCost * unit.quantity,
      0
    );

    await record.save();

    return res.status(200).json({ ok: true, message: "Unit deleted", data: record });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message });
  }
};



export const completeModularUnitSelection = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    const modularSelection = await SelectedModularUnitModel.findOne({ projectId });

    if (!modularSelection || modularSelection.selectedUnits.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "No modular unit selected for this project.",
      });
    }

    // ✅ Recalculate totalCost in case it's outdated
    const recalculatedTotalCost = modularSelection.selectedUnits.reduce((sum, unit) => {
      return sum + (unit.singleUnitCost * unit.quantity);
    }, 0);

    // ✅ Update total cost in the modular unit record
    modularSelection.totalCost = recalculatedTotalCost;
    await modularSelection.save();

    const updatedPayment = await syncPaymentConfirationModel(projectId, recalculatedTotalCost) 

    // ✅ Update PaymentConfirmationModel (add to totalAmount)
    // const updatedPayment = await PaymentConfirmationModel.findOneAndUpdate(
    //   { projectId },
    //   { $set: { totalAmount: recalculatedTotalCost } },
    //   { new: true }
    // );

    // ✅ Mark MaterialRoomConfirmationModel as completed
   const materialDoc =  await MaterialRoomConfirmationModel.findOneAndUpdate(
      { projectId },
      { status: "completed" },
      {returnDocument:"after"}
    ).populate(assignedTo, selectedFields)

// console.log("mateiraldoc", materialDoc)
     await generateCostEstimationFromMaterialSelection({}, projectId)
   

    // ✅ Mark CostEstimationModel as completed
    await CostEstimationModel.findOneAndUpdate(
      { projectId },
      { status: "completed" }
    );
    await populateWithAssignedToField({ stageModel: MaterialRoomConfirmationModel, projectId, dataToCache: materialDoc })
     
    return res.status(200).json({
      ok: true,
      message: "Modular unit completion finalized and totals updated.",
      data: {
        totalCostAdded: recalculatedTotalCost,
        updatedPayment
      }
    });
  } catch (error) {
    console.error("Error in completeModularUnitSelection:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error while finalizing modular unit selection.",
    });
  }
};
