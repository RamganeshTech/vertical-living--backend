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


        // ✅ Check if name already exists for this unitType and organization
        const existing = await Model.findOne({
            organizationId,
            name: { $regex: `^${req.body.name}$`, $options: "i" }, // case-insensitive match
        });

        if (existing) {
            return res.status(400).json({
                ok: false,
                message: `A ${unitType} with the name "${req.body.name}" already exists.`,
            });
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


        const masterDoc = await AllUnitModel.findOne({ organizationId });

        if (!masterDoc) {
            return res.status(404).json({ message: "not found", ok: false })
        }

        let unitCount = 0;
        if (masterDoc && Array.isArray((masterDoc as any)[unitType])) {
            unitCount = (masterDoc as any)[unitType].length;
        }


        const customId = `${unitType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-modular-${unitCount + 1}`;
        console.log("req.body", req.body.name)

        const newUnit = new Model({
            ...req.body,
            images: uploads,
            customId, // ✅ attach human-readable unique ID
            organizationId
        });

        const saved = await newUnit.save();

        // await AllUnitModel.findOneAndUpdate(
        //     { organizationId }, // ✅ find only for this org
        //     { $addToSet: { [unitType]: saved._id } },
        //     { upsert: true, new: true }
        // );


        (masterDoc as any)[unitType].push(saved._id)
        await masterDoc.save()

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

        console.log("unittype", unitType, "unitId", unitId)
        const Model = unitModels[unitType];

        console.log("model", Model)

        if (!Model) {
            return res.status(400).json({ ok: false, message: "Invalid unit type." });
        }

        const unit = await Model.findById(unitId);
        if (!unit) {
            return res.status(404).json({ ok: false, message: "Unit not found." });
        }

        await Model.findByIdAndDelete(unitId);



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
function parseBudgetRange(range: string): Record<string, number> {
    // Remove ₹ and spaces
    console.log("range", range)
    const cleaned = range.replace(/[₹,\s]/g, "");

    console.log("cleaned", cleaned)
    if (cleaned.endsWith("+")) {
        const min = parseInt(cleaned.slice(0, -1), 10); // "25000+"
        console.log("+ ends with", min)
        return { $gte: min };
    }

    const [minStr, maxStr] = cleaned.split(/[-–]/); // or "-"

    console.log("minStr", minStr)
    console.log("maxStr", maxStr)
    if (maxStr && maxStr) {
        const min = parseInt(minStr, 10);
        const max = parseInt(maxStr, 10);
        return { $gte: min, $lte: max };
    }

    return {};
}



const getUnits = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { unitType, organizationId } = req.params; // e.g. showcase, falseCeiling, etc.
        const { searchQuery = "", ...rawFilters } = req.query;

        const Model = unitModels[unitType];
        if (!Model) {
            return res.status(400).json({ ok: false, message: "Invalid unit type." });
        }

        const filterQuery: any = {
            organizationId,
        };


        console.log("rawFilters", rawFilters)

        // Handle filters
        for (const key in rawFilters) {


            const rawValue = rawFilters[key];

            if (key === "budgetRange" || key === "priceRange") {
                const priceFilter = parseBudgetRange(String(rawValue || ""));
                if (Object.keys(priceFilter).length > 0) {
                    filterQuery.price = priceFilter;
                }
            } else {
                const values = String(rawFilters[key]).split(",").map((v) => v.trim());
                console.log("values", values)
                // 🔁 Regular field filters
                filterQuery[key] = { $in: values };
            }
        }

        console.log("filterQuery", filterQuery)
        // Optional search text (case-insensitive search over string fields)
        if (searchQuery) {
            filterQuery.$or = [
                { name: { $regex: searchQuery, $options: "i" } },
                { customId: { $regex: searchQuery, $options: "i" } },
                // You can add more searchable fields here
            ];
        }

        const units = await Model.find(filterQuery).sort({ createdAt: -1 });


        res.status(200).json({ ok: true, data: units, message: `fetched products from ${unitType} category` });
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
            .populate("wardrobe")
            .populate("studyTable")
            .populate("BedCot")
            // .populate("mirrorUnits")
            // .populate("dressingTables")
            .populate("tv")
            // .populate("diningTables")
            // .populate("sofas")
            .populate("crockery")
            .populate("kitchenCabinet")
            // .populate("kitchenBaseUnits")
            // .populate("kitchenTallUnits")
            // .populate("kitchenWallUnits")
            // .populate("pantryUnits")
            // .populate("foyerAreaDesigns")
            .populate("falseCeiling")
            // .populate("wallpapers")
            // .populate("balconyUnits")
            .populate("showcase")
            .populate("shoeRack")

        if (!allUnitsMaster) {
            return res.status(200).json({ ok: true, message: "No units found.", data: [] });
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

        return res.status(200).json({ ok: true, data: allUnits, message: "get all category products" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Failed to fetch units." });
    }
};


export const syncAllMixedRoutes = async (organizationId: string) => {
    await AllUnitModel.create({
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
