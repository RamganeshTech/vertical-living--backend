// controllers/selectedModularUnit.controller.ts
import { Request, Response } from "express";
import { RoleBasedRequest } from "../../../types/types";
import { SelectedModularUnitNewModel } from "../../../models/Modular Units Models/Modular Unit New/SelectedModularUnitNew  Model/selectedUnitNew.model";

// ADD A UNIT
export const addSelectedUnitNew = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const {projectId} = req.params
    const {  quantity, singleUnitCost, product} = req.body;

    if(quantity < 0 ){
        return res.status(404).json({ ok: false, message: "Quantity cannot be in negative" });
    }

     // If quantity is 0 or negative, remove the item from cart
    if (quantity === 0) {
      let record = await SelectedModularUnitNewModel.findOne({ projectId });
      
      if (!record) {
        return res.status(404).json({ ok: false, message: "No record found" });
      }

      // Remove the unit from selectedUnits
      const initialLength = record.selectedUnits.length;
      record.selectedUnits = record.selectedUnits.filter(
        (unit: any) => unit.productId.toString() !== product._id.toString()
      );

      // Check if item was actually removed
      if (record.selectedUnits.length === initialLength) {
        return res.status(404).json({ ok: false, message: "Product not found in cart" });
      }

      // Recalculate totalCost
      record.totalCost = record?.selectedUnits?.reduce(
        (acc, unit: any) => acc + unit.singleUnitCost,
        0
      );

      await record.save();

      return res.status(200).json({ 
        ok: true, 
        data: record, 
        message: "Product removed from cart successfully" 
      });
    }

    const singleUnitTotal = singleUnitCost * quantity;

    let record = await SelectedModularUnitNewModel.findOne({ projectId });

    if (!record) {
      // First entry for this project
      record = await SelectedModularUnitNewModel.create({
        projectId,
        selectedUnits: [{ productId: product._id, quantity, singleUnitCost: product.fabricationCost * quantity, ...product}],
        totalCost: singleUnitTotal,
      });
    }
    else {
      const unit = record.selectedUnits.find((unit) => unit.productId!.toString() === product._id.toString());

      if (!unit) {
        record.selectedUnits.push({ productId: product._id, quantity, singleUnitCost: product.fabricationCost * quantity, ...product });
        record.totalCost = record.selectedUnits.reduce(
          (acc, unit) => acc + unit.singleUnitCost,
          0
        );
        await record.save()
        return res.status(201).json({ ok: true, data: record, message: "Product Added successfully" });
      }
      else {
        unit.quantity = quantity
        unit.singleUnitCost = product.fabricationCost * quantity

        record.totalCost = record.selectedUnits.reduce(
          (acc, unit) => acc + unit.singleUnitCost,
          0
        );
        await record.save()
        return res.status(200).json({ ok: true, data: record, message: "Quantity updated successfully" });
      }




    }

    //   else {
    // // Add new unit to existing project
    // record.selectedUnits.push({ unitId, category, quantity, singleUnitCost, image, customId });
    // record.totalCost = record.selectedUnits.reduce(
    //   (acc, unit) => acc + unit.singleUnitCost * unit.quantity,
    //   0
    // );
    // await record.save();
    // }

    return res.status(201).json({ ok: true, data: record });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message });
  }
};

// GET ALL UNITS FOR A PROJECT
export const getSelectedUnitsByProjectNew = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    const data = await SelectedModularUnitNewModel.findOne({ projectId });


    return res.status(200).json({ ok: true, data, message: "fetched all the selcted units" });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message });
  }
};

// DELETE ONE UNIT FROM A PROJECT
export const deleteSelectedUnitNew = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { projectId, unitId } = req.params;
    console.log("unitId", unitId)

    const record = await SelectedModularUnitNewModel.findOne({ projectId });

    if (!record) return res.status(404).json({ ok: false, message: "No record found" });

    record.selectedUnits = record.selectedUnits.filter(
      (unit: any) => unit._id.toString() !== unitId.toString()
    );

    // Recalculate totalCost
    record.totalCost = record.selectedUnits.reduce(
      (acc, unit: any) => acc + unit.singleUnitCost,
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

    const modularSelection = await SelectedModularUnitNewModel.findOne({ projectId });


    // if (!modularSelection) {
    //   return res.status(400).json({
    //     ok: false,
    //     message: "No modular unit section available.",
    //   });
    // }

    // let recalculatedTotalCost = 0;
    // if (modularSelection.selectedUnits.length) {
    //   // ✅ Recalculate totalCost in case it's outdated
    //   recalculatedTotalCost = modularSelection.selectedUnits.reduce((sum, unit) => {
    //     return sum + (unit.singleUnitCost * unit.quantity);
    //   }, 0);

    //   // ✅ Update total cost in the modular unit record
    //   modularSelection.totalCost = recalculatedTotalCost;
    //   modularSelection.status = "completed"


    //   const selectedExternal = await SelectedExternalModel.findOne({ projectId });
    //   let finalTotalAmount = 0;
    //   finalTotalAmount += selectedExternal?.totalCost || 0
    //   finalTotalAmount += recalculatedTotalCost
    //   await syncPaymentConfirationModel(projectId, finalTotalAmount)

    //   await modularSelection.save();
    // }



    // OLD ONE
    // const updatedPayment = await syncPaymentConfirationModel(projectId, recalculatedTotalCost)

    // // ✅ Mark MaterialRoomConfirmationModel as completed
    // const materialDoc = await MaterialRoomConfirmationModel.findOneAndUpdate(
    //   { projectId },
    //   { status: "completed" },
    //   { returnDocument: "after" }
    // ).populate(assignedTo, selectedFields)

    // // console.log("mateiraldoc", materialDoc)
    // await generateCostEstimationFromMaterialSelection({}, projectId)
    // await syncCostEstimation({}, projectId)   // use this newly crated right now


    // // ✅ Mark CostEstimationModel as completed
    // await CostEstimationModel.findOneAndUpdate(
    //   { projectId },
    //   { status: "completed" }
    // );
    // await populateWithAssignedToField({ stageModel: MaterialRoomConfirmationModel, projectId, dataToCache: materialDoc })

    return res.status(200).json({
      ok: true,
      message: "Modular unit completion finalized and totals updated.",
      data: modularSelection
    });
  } catch (error) {
    console.error("Error in completeModularUnitSelection:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error while finalizing modular unit selection.",
    });
  }
};
