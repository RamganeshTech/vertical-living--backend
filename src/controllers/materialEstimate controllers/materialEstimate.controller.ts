import { Response } from "express";
import { AuthenticatedUserRequest } from "../../types/types";
import { materialValidations } from "../../validations/materialValidations/materialValidations";
import MaterialEstimateModel from "../../models/Material Estimate Model/materialEstimate.model";
import MaterialListModel from "../../models/Material Estimate Model/materialList.model";
import { Types } from "mongoose";

const createMaterial = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
    try {

        const { materialListId, projectId } = req.params;
        const { materialName, unit,
            unitPrice,
            materialQuantity,
            vendor,
            notes } = req.body


        if (!materialListId) {
            res.status(400).json({ message: "MaterialList ID is required", ok: false });
            return
        }

        const isValidData = materialValidations({
            materialName, unit, unitPrice, materialQuantity, vendor, notes
        })

        if (!isValidData.valid) {
            res.status(400).json({ message: isValidData.message, ok: false });
            return
        }

        let material;

        material = await MaterialEstimateModel.findOne({ materialListId })

        if (material?.materials && material?.materials.length > 0) {
            material.materials.push({
                materialName,
                unit,
                unitPrice,
                materialQuantity,
                vendor: vendor || null,
                notes: notes || null
            })

            let newlyAdded = material.materials.at(-1) //it gets the last element of the array

            await material.save()

            if (!newlyAdded) {
                res.status(404).json({ message: "last element not found", ok: false })
                return
            }

            await MaterialListModel.findByIdAndUpdate({ materialListId }, { $push: { materials: (newlyAdded as any)._id } }, { returnDocument: "after" })
        }
        else {
            let materialList = await MaterialListModel.create({ projectId, materialListName: "general" })

            if (!materialList) {
                res.status(400).json({ message: "problem in creating Materail List", ok: false, });
                return;
            }

            material = await MaterialEstimateModel.create({
                materialListId: materialList._id,
                materials: [{
                    materialName,
                    unit,
                    unitPrice,
                    materialQuantity,
                    vendor: vendor || null,
                    notes: notes || null
                }],
                totalCost: materialQuantity * unitPrice
            })

            materialList.materials.push(material._id)
            await materialList.save()
        }

        res.status(200).json({ message: "Material added successfully", ok: true, data: material });

    } catch (error) {
        console.error("Error from createMaterail:", error);
        res.status(500).json({ message: "Server error", ok: false, error });
        return
    }
}

const createMaterailList = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
    try {
        let { projectId } = req.params
        let { materialListName } = req.body

        if (!projectId) {
            res.status(400).json({ message: "Project ID is required", ok: false });
            return
        }

        if (!materialListName) {
            res.status(400).json({ message: "Name is required while creating material list", ok: false });
            return
        }


        const materialLists = await MaterialListModel.create({
            projectId,
            materialListName,
            materials: []
        })

        res.status(201).json({ message: "created material lists", data: materialLists, ok: true })
    }
    catch (error) {
        console.error("Error from crate Materail list:", error);
        res.status(500).json({ message: "Server error", ok: false, error });
        return
    }
}

const getMaterial = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
    try {
        let { materialListId } = req.params

        if (!materialListId) {
            res.status(400).json({ message: "materialList ID is required", ok: false });
            return
        }

        let materials = await MaterialEstimateModel.findOne({ materialListId: { $in: materialListId } })

        res.status(200).json({ message: "Material fetched successfully", ok: true, data: materials });

    }
    catch (error) {
        console.error("Error from getMaterail:", error);
        res.status(500).json({ message: "Server error", ok: false, error });
        return
    }
}


const getMaterialLists = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
    try {
        let { projectId } = req.params

        if (!projectId) {
            res.status(400).json({ message: "Project ID is required", ok: false });
            return
        }

        let materialLists = await MaterialListModel.findOne({ projectId })

        res.status(200).json({ message: "Material fetched successfully", ok: true, data: materialLists });

    }
    catch (error) {
        console.error("Error from getMaterailsLists :", error);
        res.status(500).json({ message: "Server error", ok: false, error });
        return
    }
}

// DELETE SINGLE MATERIAL
const deleteMaterial = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
    try {
        let { materialListId, materialId } = req.params

        if (!materialListId || materialId) {
            res.status(400).json({ message: "Material ID and MaterialList Id is required", ok: false });
            return
        }

        let materials = await MaterialEstimateModel.findByIdAndDelete(materialId, { returnDocument: "after" })

        res.status(200).json({ message: "Material fetched successfully", ok: true, data: materials });

    }
    catch (error) {
        console.error("Error from delete material :", error);
        res.status(500).json({ message: "Server error", ok: false, error });
        return
    }
}

// DELETE THE WHOLE MATERIAL LIST
const deleteMaterialLists = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
    try {
        let { projectId, materailListId } = req.params

        if (!projectId || !materailListId) {
            res.status(400).json({ message: "Project ID and Materail List Id is required", ok: false });
            return
        }

        let materialLists = await MaterialListModel.findOne({ _id: materailListId, projectId })

        if (!materialLists) {
            res.status(404).json({ message: "materail lists not exists", ok: false })
            return;
        }

        const itemsToBeDeleted = materialLists.materials

        await MaterialEstimateModel.deleteMany({ _id: { $in: itemsToBeDeleted } })

        const existingMaterailLists = await MaterialListModel.findByIdAndDelete({ _id: materailListId, projectId })

        res.status(200).json({ message: "Material fetched successfully", ok: true, data: existingMaterailLists });

    }
    catch (error) {
        console.error("Error from delete material list :", error);
        res.status(500).json({ message: "Server error", ok: false, error });
        return
    }
}

// CHATGPT PROVIDED FOR DELETING MATERAIL LISTS
const deleteMaterialList = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
    try {
        const { projectId, materailListId } = req.params;

        if (!projectId || !materailListId) {
            res.status(400).json({ message: "Project ID and Material List ID are required", ok: false });
            return;
        }

        // Step 1: Delete the MaterialList
        const deletedMaterialList = await MaterialListModel.findOneAndDelete({
            _id: materailListId,
            projectId,
        });

        if (!deletedMaterialList) {
            res.status(404).json({ message: "Material List not found", ok: false });
            return;
        }

        // Step 2: Delete associated MaterialEstimate(s)
        const deletedMaterials = await MaterialEstimateModel.deleteMany({
            MaterialListId: materailListId,
        });

        res.status(200).json({
            message: "Material list and associated materials deleted successfully",
            ok: true,
            deletedMaterialList,
            deletedMaterialsCount: deletedMaterials.deletedCount,
        });
    } catch (error) {
        console.error("Error deleting material list:", error);
        res.status(500).json({ message: "Server error", ok: false, error });
    }
};

// UPDATE THE MATERIAL 
const updateMaterialItem = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
    try {
        let { materialListId, materialId } = req.params

        let updatedData = req.body

        // APPROACH PROVIDED BY CHATGPT
        //      const updated = await MaterialEstimateModel.findOneAndUpdate(
        //   {
        //     materialListId,
        //     "materials._id": materialId, // Match the subdocument inside the array
        //   },
        //   {
        //     $set: {
        //       "materials.$.materialName": updatedData.materialName,
        //       "materials.$.unit": updatedData.unit,
        //       "materials.$.unitPrice": updatedData.unitPrice,
        //       "materials.$.materialQuantity": updatedData.materialQuantity,
        //       "materials.$.vendor": updatedData.vendor || null,
        //       "materials.$.notes": updatedData.notes || null,
        //     },
        //   },
        //   { returnDocument: "after" }
        // );

        // if (!updated) {
        //   res.status(404).json({ message: "Material item not found", ok: false });
        //   return;
        // }

        // res.status(200).json({ message: "Material item updated successfully", ok: true, data: updated });


        let material = await MaterialEstimateModel.findOne({ materialListId })

        if (!material) {
            res.status(404).json({ message: "material lists not exists", ok: false })
            return;
        }

        const itemToUpdate = material?.materials.find(mat => (mat as any)._id.toString() === (materialId as any).toString())

        if (!itemToUpdate) {
            res.status(404).json({ message: "Material item not found", ok: false });
            return;
        }

        // Manually update fields
        itemToUpdate.materialName = updatedData.materialName || itemToUpdate.materialName;
        itemToUpdate.unit = updatedData.unit || itemToUpdate.unit;
        itemToUpdate.unitPrice = updatedData.unitPrice ?? itemToUpdate.unitPrice;
        itemToUpdate.materialQuantity = updatedData.materialQuantity ?? itemToUpdate.materialQuantity;
        itemToUpdate.vendor = updatedData.vendor ?? itemToUpdate.vendor;
        itemToUpdate.notes = updatedData.notes ?? itemToUpdate.notes;

        await material.save()

        res.status(200).json({ message: "Material fetched successfully", ok: true, data:material });

    }
    catch (error) {
        console.error("Error from delete material list :", error);
        res.status(500).json({ message: "Server error", ok: false, error });
        return
    }
}


// UPDATE THE MATERIAL LIST ITSELF
const updateMaterialLists = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
    try {
        let { projectId, materailListId } = req.params
        let { materialListName } = req.body

        if (!projectId || !materailListId) {
            res.status(400).json({ message: "Project ID and MaterailList Id is required", ok: false });
            return
        }

        let materialLists = await MaterialListModel.findByIdAndUpdate({ _id: materailListId, projectId }, { materialListName }, { returnDocument: "after" })

        if (!materialLists) {
            res.status(404).json({ message: "material lists not exists", ok: false })
            return;
        }

        res.status(200).json({ message: "Material fetched successfully", ok: true, data: materialLists });
        return;
    }
    catch (error) {
        console.error("Error from update material list :", error);
        res.status(500).json({ message: "Server error", ok: false, error });
        return
    }
}


export {
    createMaterial,
    createMaterailList,
    getMaterial,
    getMaterialLists,
    deleteMaterial,
    deleteMaterialLists,

    updateMaterialLists,
    updateMaterialItem
}