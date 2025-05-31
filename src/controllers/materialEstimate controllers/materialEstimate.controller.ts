import { Response } from "express";
import { AuthenticatedUserRequest } from "../../types/types";
import { materialValidations } from "../../validations/materialValidations/materialValidations";
import MaterialEstimateModel from "../../models/Material Estimate Model/materialEstimate.model";
import MaterialListModel from "../../models/Material Estimate Model/materialList.model";
import { MaterialApprovalModel } from "../../models/client model/materialApproval.model";
import { Error } from "mongoose";

const createMaterial = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
    try {

        const { projectId } = req.params;
        const { materialListId } = req.query
        const { materialName, unit,
            unitPrice,
            materialQuantity,
            vendor,
            notes } = req.body


        const isValidData = materialValidations({
            materialName, unit, unitPrice, materialQuantity, vendor, notes
        })

        if (!isValidData.valid) {
            res.status(400).json({ message: isValidData.message, ok: false });
            return
        }

        let material;

        if (materialListId) {
            material = await MaterialEstimateModel.findOne({ materialListId })

            if (material?.materials) {

                material.materials.push({
                    materialName: materialName.trim(),
                    unit: unit.trim(),
                    unitPrice,
                    materialQuantity,
                    vendor: vendor?.trim() || null,
                    notes: notes?.trim() || null
                })



                let newlyAdded = material.materials.at(-1) //it gets the last element of the array

                material.totalCost = material.materials.reduce((acc, curr) => acc + curr.unitPrice * curr.materialQuantity, 0)

                await material.save()

                if (!newlyAdded) {
                    res.status(404).json({ message: "last element not found", ok: false })
                    return
                }

                await MaterialListModel.findOneAndUpdate({ materialListId },
                    {
                        $push: { materials: (newlyAdded as any)._id },
                    },
                    { returnDocument: "after" })
            }
        }
        else {
            // this will work only if the materialId is not provided which means if the user is trying to add in general list
            let materialList = await MaterialListModel.findOne({ projectId, materialListName: "general" });

            if (!materialList) {
                // creating only for first time , next this part will ownt work, it will move on to the else part
                materialList = await MaterialListModel.create({
                    projectId,
                    materialListName: "general"
                });

                if (!materialList) {
                    res.status(400).json({ message: "Problem creating Material List", ok: false });
                    return;
                }

                material = await MaterialEstimateModel.create({
                    materialListId: materialList._id,
                    materials: [{
                        materialName: materialName.trim(),
                        unit: unit?.trim(),
                        unitPrice,
                        materialQuantity,
                        vendor: vendor || null,
                        notes: notes?.trim() || null
                    }],
                    totalCost: materialQuantity * unitPrice
                })

                materialList.materials.push(material._id)

                await materialList.save()
            }
            else {
                material = await MaterialEstimateModel.findOne({ materialListId: materialList._id })

                if (!material) {
                    res.status(404).json({ message: "no material list found", ok: false })
                    return

                }

                material?.materials.push({
                    materialName: materialName.trim(),
                    unit: unit?.trim(),
                    unitPrice,
                    materialQuantity,
                    vendor: vendor || null,
                    notes: notes?.trim() || null
                })



                material.totalCost = material?.materials.reduce(
                    (acc, curr) => acc + curr.unitPrice * curr.materialQuantity,
                    0
                );

                await material.save();
            }

        }

        res.status(200).json({ message: "Material added successfully", ok: true, data: material });

    } catch (error) {
        if (error instanceof Error) {
            console.error("Error from createMaterail:", error);
            res.status(500).json({ message: "Server error", ok: false, error: error.message });
            return
        }
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

        if (!materialLists) {
            res.status(400).json({ message: "problem in createing the matrial lists", ok: false })
            return
        }

        const materials = await MaterialEstimateModel.create({
            materialListId: materialLists._id,
            materials: [],
            totalCost: 0
        })

        if (!materials) {
            res.status(400).json({ message: "problem in createing the matrial Items list", ok: false })
            return
        }

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

        const materialEstimateDoc = await MaterialEstimateModel.findOne({ materialListId });

        if (!materialEstimateDoc) {
            res.status(404).json({ message: "Material items not found", ok: false });
            return;
        }

        // 2️⃣ Get approval doc
        const approvalDoc = await MaterialApprovalModel.findOne({ materialListId });

        const approvedMap: Record<string, { approved: string; feedback: string | null }> = {};

        if (approvalDoc?.approvedItems?.length) {
            approvalDoc.approvedItems.forEach((item: any) => {
                approvedMap[item.materialItemId.toString()] = {
                    approved: item.approved,
                    feedback: item.feedback
                };
            });
        }

        // 3️⃣ Merge each material item with approval status
        const mergedMaterials = materialEstimateDoc.materials.map((material: any) => {
            const itemId = material._id.toString();
            return {
                ...material.toObject(), //here teh material means to material items array where it will contain the array of objects
                clientApproved: approvalDoc ? (approvedMap[itemId]?.approved || "pending") : "no client assigned",
                clientFeedback: approvalDoc ? (approvedMap[itemId]?.feedback || null) : null
            };
        });

        const totalCost = materialEstimateDoc.totalCost

        res.status(200).json({
            message: "Material items fetched successfully",
            ok: true,
            data: { materialListId, mergedMaterials, totalCost }
        });

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

        // 1. Fetch all material lists for the project
        const materialLists = await MaterialListModel.find({ projectId });

        if (!materialLists.length) {
            res.status(200).json({ message: "materials List not found", ok: false, data: materialLists })
            return
        }

        // 2. Prepare output with clientApproved field
        const result = await Promise.all(materialLists.map(async (list) => {
            const materialEstimate = await MaterialEstimateModel.findOne({ materialListId: list._id });
            const materialApproval = await MaterialApprovalModel.findOne({ materialListId: list._id });

            let status = "no client assigned";

            if (materialEstimate && materialApproval) {
                const totalItems = materialEstimate.materials.length;
                const approvals = materialApproval.approvedItems;

                const statusCounts = {
                    approved: 0,
                    pending: 0,
                    rejected: 0,
                };

                for (let item of approvals) {
                    if (item.approved === "approved") statusCounts.approved++;
                    else if (item.approved === "pending") statusCounts.pending++;
                    else if (item.approved === "rejected") statusCounts.rejected++;
                }

                // Determine the overall status
                if (statusCounts.approved === totalItems) {
                    status = "approved";
                } else if (statusCounts.rejected === totalItems) {
                    status = "rejected";
                } else {
                    status = "pending";
                }
            }

            return {
                ...list.toObject(),
                clientApproval: status,
            };
        }));

        res.status(200).json({
            message: "Material lists fetched successfully",
            ok: true,
            data: result,
        });

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

        if (!materialListId || !materialId) {
            res.status(400).json({ message: "Material ID and MaterialList Id is required", ok: false });
            return
        }

        let material = await MaterialEstimateModel.findOne({ materialListId })

        if (!material) {
            res.status(404).json({ message: "material list not found", ok: false })
            return
        }

        material.materials = material?.materials.filter((item: any) => {
            return (
                item._id.toString() !== materialId.toString()
            )
        })

        material.totalCost = material?.materials.reduce(
            (acc, curr) => acc + curr.unitPrice * curr.materialQuantity,
            0
        );

        await material.save()

        res.status(200).json({ message: "Material fetched successfully", ok: true, data: material });

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

        const existingMaterailLists = await MaterialListModel.findOneAndDelete({ _id: materailListId, projectId })

        res.status(200).json({ message: "Material deleted successfully", ok: true, data: existingMaterailLists });

    }
    catch (error) {
        console.error("Error from delete material list :", error);
        res.status(500).json({ message: "Server error", ok: false, error });
        return
    }
}

// UPDATE THE MATERIAL 
const updateMaterialItem = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
    try {
        let { materialListId, materialId } = req.params

        if (!materialId || !materialListId) {
            res.status(400).json({ message: "Material Id and Materail List Id is required", ok: false })
            return;
        }

        let updatedData = req.body

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
        itemToUpdate.materialName = updatedData.materialName?.trim() || itemToUpdate.materialName;
        itemToUpdate.unit = updatedData.unit || itemToUpdate.unit;
        itemToUpdate.unitPrice = updatedData.unitPrice ?? itemToUpdate.unitPrice;
        itemToUpdate.materialQuantity = updatedData.materialQuantity ?? itemToUpdate.materialQuantity;
        itemToUpdate.vendor = updatedData.vendor?.trim() ?? itemToUpdate.vendor;
        itemToUpdate.notes = updatedData.notes?.trim() ?? itemToUpdate.notes;

        material.totalCost = material?.materials.reduce(
            (acc, curr) => acc + curr.unitPrice * curr.materialQuantity,
            0
        );

        await material.save()

        res.status(200).json({ message: "Material item updated successfully", ok: true, data: material });

    }
    catch (error) {
        console.error("Error from update material list :", error);
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

        let materialLists = await MaterialListModel.findOneAndUpdate({ _id: materailListId, projectId }, { materialListName }, { returnDocument: "after" })

        if (!materialLists) {
            res.status(404).json({ message: "material lists not exists", ok: false })
            return;
        }

        res.status(200).json({ message: "Material list updated successfully", ok: true, data: materialLists });
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