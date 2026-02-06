import { Request, Response } from "express";
import { CategoryModel, ItemModel } from "../../../models/Quote Model/RateConfigAdmin Model/rateConfigAdmin.model";
import mongoose from "mongoose";


export const updatePreSalesMaterialItem = async (req: Request, res: Response): Promise<any> => {
    try {
        const { itemId } = req.params;
        const { manufacturCostPerSqft } = req.body; // expect flat object like { brand: "X", rate: 120 }


        if (manufacturCostPerSqft === undefined) {
            return res.status(400).json({
                ok: false,
                message: "manufacturCostPerSqft is required",
            });
        }

        if (typeof manufacturCostPerSqft !== "number") {
            return res.status(400).json({
                ok: false,
                message: "manufacturCostPerSqft must be a number",
            });
        }



        const item = await ItemModel.findByIdAndUpdate(
            itemId,
            {
                $set: {
                    "data.manufacturCostPerSqft": manufacturCostPerSqft,
                },
            },
            { new: true }
        );

        if (!item) {
            return res.status(404).json({
                ok: false,
                message: "Material item not found",
            });
        }


        return res.status(200).json({
            ok: true,
            message: "Manufacture cost per sqft updated successfully",
            data: item,
        });
    } catch (error: any) {
        console.error("Error updating material item:", error);
        return res.status(500).json({
            ok: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};