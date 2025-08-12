// controllers/selectedExternal.controller.ts
import { Response } from "express";
import { Types } from "mongoose";
import { SelectedExternalModel } from "../../models/externalUnit model/SelectedExternalUnit model/selectedExternalUnit.model";
import { RoleBasedRequest } from "../../types/types";
import { SelectedModularUnitModel } from "../../models/Modular Units Models/All Unit Model/SelectedModularUnit Model/selectedUnit.model";
import { syncPaymentConfirationModel } from "../stage controllers/PaymentConfirmation controllers/PaymentMain.controllers";
// import { generateCostEstimationFromMaterialSelection } from "../stage controllers/cost estimation controllers/costEstimation.controller";

import MaterialRoomConfirmationModel from "../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model";
import { assignedTo, selectedFields } from "../../constants/BEconstants";
import { CostEstimationModel } from "../../models/Stage Models/Cost Estimation Model/costEstimation.model";
import { populateWithAssignedToField } from "../../utils/populateWithRedis";
import { syncCostEstimation } from "../stage controllers/cost estimation controllers/costEstimation.controller";


export const addToSelectedExternal = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const { selectedUnit } = req.body;

        if (!projectId) {
            return res.status(400).json({ ok: false, message: "projectId is requried " });
        }

        const existing = await SelectedExternalModel.findOne({ projectId });

        let result;
        if (existing) {
            // Replace the selectedUnits array
            existing.selectedUnits.push(selectedUnit);
            existing.totalCost = existing.selectedUnits.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
            result = await existing.save();
        } else {
            result = await SelectedExternalModel.create({
                projectId: new Types.ObjectId(projectId),
                selectedUnits: [selectedUnit],
                status: "pending",
                totalCost: selectedUnit?.quantityPrice * selectedUnit.quantity || 0
            });
        }

        return res.status(200).json({ ok: true, data: result });
    } catch (error) {
        console.error("Error in createOrUpdateSelectedExternal:", error);
        return res.status(500).json({ ok: false, message: "Internal Server Error" });
    }
};

/**
 * Get all selected external units for a project
 */
export const getSelectedExternal = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        const result = await SelectedExternalModel.findOne({ projectId });

        return res.status(200).json({ ok: true, data: result || { projectId, selectedUnits: [] } });
    } catch (error) {
        console.error("Error in getSelectedExternal:", error);
        return res.status(500).json({ ok: false, message: "Internal Server Error" });
    }
};

/**
 * Delete a single selected unit from a project
 */
export const deleteSelectedExternalUnit = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId, unitId } = req.params;

        const result = await SelectedExternalModel.findOneAndUpdate(
            { projectId },
            [
                {
                    $set: {
                        selectedUnits: {
                            $filter: {
                                input: "$selectedUnits",
                                as: "unit",
                                cond: { $ne: ["$$unit._id", new Types.ObjectId(unitId)] }
                            }
                        }
                    }
                },
                {
                    $set: {
                        totalCost: {
                            $sum: "$selectedUnits.totalPrice"
                        }
                    }
                }
            ],
            { new: true }
        );



        if (!result) {
            return res.status(404).json({ ok: false, message: "Project or unit not found" });
        }

        return res.status(200).json({ ok: true, message: "Unit deleted okfully", data: result });
    } catch (error) {
        console.error("Error in deleteSelectedUnit:", error);
        return res.status(500).json({ ok: false, message: "Internal Server Error" });
    }
};



// controllers/ExternalUnit Controller/updateSelectedExternalStatus.ts
export const updateSelectedExternalStatus = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        const updated = await SelectedExternalModel.findOneAndUpdate(
            { projectId },
            { status: "completed" },
            { new: true }
        );




        if (!updated) {
            return res.status(404).json({ ok: false, message: "Project not found" });
        }

        const selectedModular = await SelectedModularUnitModel.findOne({ projectId });
        let recalculatedTotalCost = 0;
        recalculatedTotalCost += selectedModular?.totalCost || 0
        recalculatedTotalCost += updated?.totalCost
        await syncPaymentConfirationModel(projectId, recalculatedTotalCost)

        // ✅ Update PaymentConfirmationModel (add to totalAmount)
        // const updatedPayment = await PaymentConfirmationModel.findOneAndUpdate(
        //   { projectId },
        //   { $set: { totalAmount: recalculatedTotalCost } },
        //   { new: true }
        // );

        // ✅ Mark MaterialRoomConfirmationModel as completed
        const materialDoc = await MaterialRoomConfirmationModel.findOneAndUpdate(
            { projectId },
            { status: "completed" },
            { returnDocument: "after" }
        ).populate(assignedTo, selectedFields)

        // console.log("mateiraldoc", materialDoc)
        // await generateCostEstimationFromMaterialSelection({}, projectId)
        await syncCostEstimation({}, projectId)


        // ✅ Mark CostEstimationModel as completed
        await CostEstimationModel.findOneAndUpdate(
            { projectId },
            { status: "completed" }
        );
        await populateWithAssignedToField({ stageModel: MaterialRoomConfirmationModel, projectId, dataToCache: materialDoc })


        return res.status(200).json({ ok: true, data: updated });
    } catch (error) {
        console.error("Error updating status:", error);
        return res.status(500).json({ ok: false, message: "Internal Server Error" });
    }
};
