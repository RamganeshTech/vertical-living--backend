// controllers/selectedModularUnit.controller.ts
import { Request, Response } from "express";
import { RoleBasedRequest } from "../../../types/types";
import { SelectedModularUnitNewModel } from "../../../models/Modular Units Models/Modular Unit New/SelectedModularUnitNew  Model/selectedUnitNew.model";
import generatePdfModularUnits from "./pdfGenerateModularUnits";
import { populateWithAssignedToField } from "../../../utils/populateWithRedis";

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




// Controller function
export const generateModularUnitsPDFController = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, organizationId } = req.params;

        if (!projectId) {
            return res.status(400).json({
                ok: false,
                message: 'Project ID is required'
            });
        }

        const result = await generatePdfModularUnits(projectId, organizationId);



        res.status(200).json(result);

    } catch (error: any) {
        console.error('PDF generation controller error:', error);
        res.status(500).json({
            ok: false,
            message: error.message || 'Internal server error'
        });
    }
};






