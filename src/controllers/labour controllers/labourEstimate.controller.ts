import { Response } from "express";
import { AuthenticatedUserRequest } from "../../types/types";
import { LabourListModel } from "../../models/labour models/labourList.model";
import { LabourEstimateModel } from "../../models/labour models/labourEstimate.model";

const createLabourList = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
    try {
        let { projectId } = req.params
        let { labourListName } = req.body

        if (!projectId) {
            res.status(400).json({ message: "Project ID is required", ok: false });
            return
        }

        if (!labourListName) {
            res.status(400).json({ message: "Name is required while creating Labour list", ok: false });
            return
        }
        const materialLists = await LabourListModel.create({
            projectId,
            labourListName,
            labourItems: []
        })

        res.status(201).json({ message: "created material lists", data: materialLists, ok: true })
    }
    catch (error) {
        console.error("Error from create labour list:", error);
        res.status(500).json({ message: "Server error", ok: false, error });
        return
    }
}

const createLabour = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
    try {

        let { labourListId, projectId } = req.params

        const { role, numberOfPeople,
            estimatedHours,
            hourlyRate,
            totalCost,
            notes, totalLabourCost } = req.body

        if (!role || !numberOfPeople) {
            res.status(400).json({ message: "role and No of People is mandatory", ok: false })
            return;
        }

        let isCorrectTotalCost = numberOfPeople * (estimatedHours * hourlyRate)

        if (isCorrectTotalCost !== totalCost) {
            res.status(400).json({ message: "total cost for single labour items is not correct", ok: false })
            return
        }

        let createdLabour;

        if (labourListId) {
            createdLabour = await LabourEstimateModel.findByIdAndUpdate({ labourListId }, {
                $push: {
                    labourItems: {
                        role,
                        numberOfPeople,
                        estimatedHours: estimatedHours || 0,
                        hourlyRate: hourlyRate || 0,
                        totalCost: isCorrectTotalCost || 0,
                        notes: notes || null,
                        totalLabourCost: totalLabourCost || 0
                    }
                }
            }, { returnDocument: "after" })

            if (!createdLabour) {
                res.status(404).json({ message: "labour item not created successfully", ok: false })
                return;
            }

            const newTotalLabourCost = createdLabour.labourItems.reduce(
                (sum, item) => sum + (item.totalCost || 0),
                0
            );

            createdLabour.totalLabourCost = newTotalLabourCost;
            await createdLabour.save();

            const newLabourItem = createdLabour.labourItems[createdLabour.labourItems.length - 1];

            if (!newLabourItem) {
                res.status(404).json({ message: "last item not found", ok: false })
                return
            }

            await LabourListModel.findByIdAndUpdate(labourListId, {
                $addToSet: {
                    labours: (newLabourItem as any)._id
                }
            }, { returnDocument: "after" })
        }
        else {
            let labourlist = await LabourListModel.create({
                labourListName: "general labour list",
                projectId,
                labours: []
            })

            createdLabour = await LabourEstimateModel.create({
                labourListId: labourlist._id,
                labourItems: [{
                    role,
                    numberOfPeople,
                    estimatedHours: estimatedHours ?? 0,
                    hourlyRate: hourlyRate ?? 0,
                    totalCost: isCorrectTotalCost ?? 0,
                    notes: notes ?? null,
                    totalLabourCost: totalLabourCost ?? 0
                }],
                totalLabourCost: isCorrectTotalCost ?? 0
            })
        }
        
        res.status(201).json({ message: "created labour list", ok: true, data: createdLabour })
    }
    catch (error) {
        console.error("Error from create labour:", error);
        res.status(500).json({ message: "Server error", ok: false, error });
        return
    }
}

const getLabourItems = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
    try {
        let { labourListId } = req.params

        if (!labourListId) {
            res.status(400).json({ message: "materialList ID is required", ok: false });
            return
        }

        let labours = await LabourEstimateModel.findOne({ labourListId })

        res.status(200).json({ message: "labour items fetched successfully", ok: true, data: labours });

    }
    catch (error) {
        console.error("Error from  getlabouritems:", error);
        res.status(500).json({ message: "Server error", ok: false, error });
        return
    }
}

const getLabourLists = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
    try {

        let { projectId } = req.params

        if (!projectId) {
            res.status(400).json({ message: "Project ID is required", ok: false });
            return
        }

        const labourList = await LabourListModel.find({ projectId })

        res.status(200).json({ message: "fetched labour lists", data: labourList, ok: true })
    }
    catch (error) {
        console.error("Error from create labour:", error);
        res.status(500).json({ message: "Server error", ok: false, error });
        return
    }
}

const updateLabourList = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
    try {
        let { labourListId, projectId } = req.params

        let { labourListName } = req.body

        if (!projectId || !labourListId) {
            res.status(400).json({ message: "Project ID and MaterailList Id is required", ok: false });
            return
        }

        if (!labourListName) {
            res.status(400).json({ message: "labour list name is required", ok: false })
            return;
        }

        const updatedData = await LabourListModel.findOneAndUpdate({ _id: labourListId, projectId }, { labourListName }, { returnDocument: "after" })

        res.status(200).json({ message: "labour list is updated", ok: false, data: updatedData })
    }
    catch (error) {
        console.error("Error from create labour:", error);
        res.status(500).json({ message: "Server error", ok: false, error });
        return
    }
}

const updateLabourItem = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
    try {
        const { labourListId, labourItemId } = req.params
        let {
            role,
            numberOfPeople,
            estimatedHours,
            hourlyRate,
            totalCost,
            notes, totalLabourCost } = req.body

        if (!labourListId || !labourItemId) {
            res.status(400).json({ message: "LabourItem Id and Labour List Id is required", ok: false })
            return;
        }

        if (!role || !numberOfPeople) {
            res.status(400).json({ message: "role and No of People is mandatory", ok: false })
            return;
        }

        // step1: find the document
        const estimateDoc = await LabourEstimateModel.findOne({ labourListId });

        if (!estimateDoc) {
            res.status(404).json({ message: "Labour Estimate not found", ok: false });
            return;
        }

        const labourItem = (estimateDoc.labourItems as any).id(labourItemId);
        // should use the above method only if you have the _id property inside the each objects of the array, (it is called mongodb subdocuments)

        if (!labourItem) {
            res.status(404).json({ message: "Labour item not found", ok: false });
            return
        }

        // Update only if new value provided; otherwise retain existing
        labourItem.role = role ?? labourItem.role;
        labourItem.numberOfPeople = numberOfPeople ?? labourItem.numberOfPeople;
        labourItem.estimatedHours = estimatedHours ?? labourItem.estimatedHours;
        labourItem.hourlyRate = hourlyRate ?? labourItem.hourlyRate;
        labourItem.notes = notes ?? labourItem.notes;

        // Recalculate totalCost
        labourItem.totalCost =
            totalCost ??
            labourItem.numberOfPeople * labourItem.estimatedHours * labourItem.hourlyRate;

        // Recalculate totalLabourCost for the whole estimate
        estimateDoc.totalLabourCost = estimateDoc.labourItems.reduce(
            (sum, item) => sum + (item.totalCost || 0),
            0);

        await estimateDoc.save();

        // // Step 2: Find the specific labour item
        // // const labourItem = estimateDoc.labourItems.id(labourItemId);

        // if (!labourItem) {
        //     res.status(404).json({ message: "Labour item not found", ok: false });
        //     return;
        // }

        // // Step 3: Merge values with fallbacks to existing
        // const updatedFields = {
        //     "labourItems.$.role": role ?? labourItem.role,
        //     "labourItems.$.numberOfPeople": numberOfPeople ?? labourItem.numberOfPeople,
        //     "labourItems.$.estimatedHours": estimatedHours ?? labourItem.estimatedHours,
        //     "labourItems.$.hourlyRate": hourlyRate ?? labourItem.hourlyRate,
        //     "labourItems.$.totalCost":
        //         totalCost ?? (numberOfPeople ?? labourItem.numberOfPeople) * ((estimatedHours ?? labourItem.estimatedHours) * (hourlyRate ?? labourItem.hourlyRate)),
        //     "labourItems.$.notes": notes ?? labourItem.notes,

        // };

        // // Step 4: Perform the update
        // const updated = await LabourEstimateModel.findOneAndUpdate(
        //     { labourListId, "labourItems._id": labourItemId },
        //     { $set: updatedFields },
        //     { new: true }
        // );

        res.status(200).json({ message: "Labour item updated", ok: true, data: labourItem });

    }
    catch (error) {
        console.error("Error from create labour:", error);
        res.status(500).json({ message: "Server error", ok: false, error });
        return
    }
}

const deleteLabourList = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
    try {
        let { labourListId, projectId } = req.params

        if (!labourListId || !projectId) {
            res.status(400).json({ message: "project Id and LabourList Id is required", ok: false });
            return
        }

        const deletedLabour = await LabourEstimateModel.findOneAndDelete({ labourListId })

        if (!deletedLabour) {
            res.status(404).json({ message: "LabourList Id is not belongs to the labours", ok: false });
            return
        }

        const deletedLabourList = await LabourListModel.findOneAndDelete({ _id: labourListId, projectId })

        if (!deletedLabourList) {
            res.status(404).json({ message: "LabourList Id is not belong to this labourlist", ok: false });
            return
        }

        res.status(200).json({ message: "labour list deleted", ok: false, data: deletedLabourList })

    }
    catch (error) {
        console.error("Error from create labour:", error);
        res.status(500).json({ message: "Server error", ok: false, error });
        return
    }
}

const deleteLabourItem = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
    try {
        let { labourListId, labouritemId } = req.params


        if (!labourListId || !labouritemId) {
            res.status(400).json({ message: "LabourItem ID and LabourList Id is required", ok: false });
            return
        }

        const updated = await LabourEstimateModel.findOne(
            { labourListId },
            { $pull: { labourItems: { _id: labouritemId } } },
            { returnDocument: "after" }
        );

        if (!updated) {
            res.status(404).json({ message: "Labour item not found", ok: false });
            return;
        }

        res.status(200).json({ message: "Labour item deleted successfully", ok: true, data: updated });

    }
    catch (error) {
        console.error("Error from create labour:", error);
        res.status(500).json({ message: "Server error", ok: false, error });
        return
    }
}


export {
    createLabourList,
    createLabour,
    getLabourItems,
    getLabourLists,
    updateLabourList,
    updateLabourItem,
    deleteLabourList,
    deleteLabourItem
}