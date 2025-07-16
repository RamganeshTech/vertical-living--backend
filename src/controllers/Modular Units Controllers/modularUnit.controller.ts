// src/controllers/dynamicUnit.controller.ts (or a separate unitRegistry.ts)

import { KitchenCabinetUnitModel } from "../../models/Modular Units Models/KitchenCabinet Models/KitchenCabinet.model"
import { FalseCeilingUnitModel } from "../../models/Modular Units Models/False Ceiling Model/falseCeiling.model"
import { ShowcaseUnitModel } from "../../models/Modular Units Models/ShowCase Model/showCase.model"
import { ShoeRackUnitModel } from "../../models/Modular Units Models/ShoeRack Model/shoeRack.model"
import { WardrobeUnitModel } from "../../models/Modular Units Models/Wardrobe Model/wardrobeUnit.model"
import { Request, Response } from "express"
import { RoleBasedRequest } from "../../types/types"
import { TVUnitModel } from "../../models/Modular Units Models/TV Unit Model/TVUnit.model"
import { BedCotUnitModel } from "../../models/Modular Units Models/BedCot Model/BedCot.model"
import { StudyTableUnitModel } from "../../models/Modular Units Models/Study Table Model/studyTable.model"
import { CrockeryUnitModel } from "../../models/Modular Units Models/Crockery Models/crockeryUnit.model"
import { validateCommonFields } from "../../utils/modular units utils/commonValidation"
import { allowedFieldsModularUnit } from "../../constants/BEconstants"
import { CommonUpload } from "../../models/Modular Units Models/All Unit Model/common.model"
import { AllUnitModel } from "../../models/Modular Units Models/All Unit Model/allUnit.model"

export const unitModels: Record<string, any> = {
    falseCeiling: FalseCeilingUnitModel,
    showcase: ShowcaseUnitModel,
    shoeRack: ShoeRackUnitModel,
    wardrobe: WardrobeUnitModel,
    tv: TVUnitModel,
    BedCot: BedCotUnitModel,
    kitchenCabinet: KitchenCabinetUnitModel,
    studyTable: StudyTableUnitModel,
    crockery: CrockeryUnitModel
    // Add more units as you define them...
    // fallback: CommonUnitsModel, // Optional: fallback generic model
};



const createUnit = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { unitType, organizationId } = req.params;

        const Model = unitModels[unitType];
        if (!Model) {
            return res.status(400).json({ ok: false, message: "Invalid unit type." });
        }


        const allowed = allowedFieldsModularUnit[unitType];
        if (!allowed) {
            return res.status(400).json({ ok: false, message: "No allowed fields defined for this unit type." });
        }

        const bodyKeys = Object.keys(req.body);
        const invalidKeys = bodyKeys.filter((key) => !allowed.includes(key));

        if (invalidKeys.length) {
            return res.status(400).json({
                ok: false,
                message: "Invalid fields found.",
                invalidFields: invalidKeys,
            });
        }

        // ✅ Directly validate common fields
        const { valid, errors } = validateCommonFields(req.body);
        if (!valid) {
            return res.status(400).json({ ok: false, message: "Validation failed.", errors });
        }

        // ✅ Images handled by processUploadFiles
        let uploads: CommonUpload[] = [];
        if (req.files && Array.isArray(req.files)) {
            uploads = (req.files as any[]).map(file => ({
                type: "image",
                url: (file as any).location,
                originalName: file.originalname,
                uploadedAt: new Date(),
            }));
        }


        const newUnit = new Model({
            ...req.body,
            images: uploads,
        });

        const saved = await newUnit.save();

        await AllUnitModel.findOneAndUpdate(
            { organizationId }, // ✅ find only for this org
            { $addToSet: { [unitType]: saved._id } },
            { upsert: true, new: true }
        );

        return res.status(201).json({ ok: true, message: "Unit created.", data: saved });

    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            ok: false, message: "Error creating unit", error: error.message,
        });
    }
};




const updateUnit = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { unitId, unitType } = req.params; // The _id of the unit you want to update

        const Model = unitModels[unitType];
        if (!Model) {
            return res.status(400).json({ ok: false, message: "Invalid unit type." });
        }

        // Validate allowed fields for this unit type
        const allowed = allowedFieldsModularUnit[unitType];
        if (!allowed) {
            return res.status(400).json({ ok: false, message: "Invalid unit type." });
        }

        // Validate request body keys
        const bodyKeys = Object.keys(req.body);
        const invalidKeys = bodyKeys.filter(key => !allowed.includes(key));
        if (invalidKeys.length) {
            return res.status(400).json({
                ok: false,
                message: "Invalid fields in request body.",
                invalidFields: invalidKeys,
            });
        }

        // Validate 'name' is present (mandatory)
        if (!req.body.name || typeof req.body.name !== "string") {
            return res.status(400).json({ ok: false, message: "Name is required." });
        }

        // Handle images if present (your `processUploadFiles` does compression + S3)
        let uploads: CommonUpload[] = [];
        if (req.files && Array.isArray(req.files)) {
            uploads = (req.files as any[]).map(file => ({
                type: "image",
                url: (file as any).location,
                originalName: file.originalname,
                uploadedAt: new Date(),
            }));
        }

        // Find and update the unit
        const unit = await Model.findById(unitId);
        if (!unit) {
            return res.status(404).json({ ok: false, message: "Unit not found." });
        }

        // Update only allowed fields
        allowed.forEach(field => {
            if (req.body[field] !== undefined) {
                unit[field] = req.body[field];
            }
        });

        // If you store uploads inside the unit
        if (uploads.length) {
            unit.images = uploads;
        }

        await unit.save();

        res.status(200).json({ ok: true, message: "Unit updated successfully.", data: unit });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ ok: false, message: "Failed to update unit.", error: err.message });
    }
};

const deleteUnit = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { unitId, unitType, organizationId } = req.params; // The _id of the unit you want to update

        const Model = unitModels[unitType];
        if (!Model) {
            return res.status(400).json({ ok: false, message: "Invalid unit type." });
        }

        const unit = await Model.findById(unitId);
        if (!unit) {
            return res.status(404).json({ ok: false, message: "Unit not found." });
        }

        const data = await Model.findByIdAndDelete(unitId);

        if (!data) {
            return res.status(400).json({ message: "item not found", ok: false })
        }

        await AllUnitModel.findOneAndUpdate(
            { organizationId }, // ✅ find only for this org
            { $pull: { [unitType]: unitId } }
        );


        res.status(200).json({ ok: true, message: "Unit deleted successfully." });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ ok: false, message: "Failed to delete unit.", error: err.message });
    }
};


const getUnits = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { unitType } = req.params; // e.g. showcase, falseCeiling, etc.

        const Model = unitModels[unitType];
        if (!Model) {
            return res.status(400).json({ ok: false, message: "Invalid unit type." });
        }

        const units = await Model.find().sort({ createdAt: -1 });

        res.status(200).json({ ok: true, data: units });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ ok: false, message: "Failed to fetch units.", error: err.message });
    }
};


// ✅ controllers/modularUnits.controller.ts


const getAllMixedUnits = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {

        const { organizationId } = req.params

        const allUnitsMaster = await AllUnitModel.findOne({ organizationId })
            .populate("wardrobes")
            .populate("studyTables")
            .populate("cots")
            .populate("mirrorUnits")
            .populate("dressingTables")
            .populate("tvUnits")
            .populate("diningTables")
            .populate("sofas")
            .populate("crockeryUnits")
            .populate("kitchenBaseUnits")
            .populate("kitchenTallUnits")
            .populate("kitchenWallUnits")
            .populate("pantryUnits")
            .populate("foyerAreaDesigns")
            .populate("falseCeilings")
            .populate("wallpapers")
            .populate("balconyUnits");

        if (!allUnitsMaster) {
            return res.status(404).json({ ok: false, message: "No units found.", data: [] });
        }

        // Flatten and add type for FE
        const allUnits: any[] = [];

        Object.entries(allUnitsMaster.toObject()).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach((unit) => {
                    allUnits.push({ ...unit, unitType: key });
                });
            }
        });

        return res.status(200).json({ ok: true, data: allUnits });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Failed to fetch units." });
    }
};


export const syncAllMixedRoutes = async (organizationId: string) => {
    const allUnitsMaster = await AllUnitModel.create({
        organizationId,
        wardrobe: [],
        studyTable: [],
        BedCot: [],
        mirrorUnits: [],
        dressingTables: [],
        tv: [],
        diningTables: [],
        sofas: [],
        crockery: [],
        kitchenCabinet: [],
        kitchenBaseUnits: [],
        kitchenTallUnits: [],
        kitchenWallUnits: [],
        pantryUnits: [],
        foyerAreaDesigns: [],
        falseCeiling: [],
        showcase: [],
        shoeRack: [],
        wallpapers: [],
        balconyUnits: []
    })

}


export {
    createUnit,
    updateUnit,
    deleteUnit,
    getUnits,
    getAllMixedUnits
}
