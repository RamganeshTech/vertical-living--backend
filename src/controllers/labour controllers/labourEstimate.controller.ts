import { Response } from "express";
import { AuthenticatedUserRequest } from "../../types/types";
import { LabourListModel } from "../../models/labour models/labourList.model";
import { LabourEstimateModel } from "../../models/labour models/labourEstimate.model";
import { LabourApprovalModel } from "../../models/client model/labourApproval.model";

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
        const labourList = await LabourListModel.create({
            projectId,
            labourListName,
            labourItems: []
        })

        if (!labourList) {
            res.status(400).json({ message: "problem in createing the labour lists", ok: false })
            return
        }

        const labours = await LabourEstimateModel.create({
            labourListId: labourList._id,
            labourItems: [],
            totalLabourCost: 0
        })

        if (!labours) {
            res.status(400).json({ message: "problem in createing the labour Items list", ok: false })
            return
        }

        res.status(201).json({ message: "created labour lists", data: labourList, ok: true })
    }
    catch (error) {
        console.error("Error from create labour list:", error);
        res.status(500).json({ message: "Server error", ok: false, error });
        return
    }
}

const createLabour = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
    try {

        let { projectId } = req.params
        const { labourListId } = req.query

        const { role, numberOfPeople,
            estimatedHours,
            hourlyRate,
            totalCost,
            notes, totalLabourCost } = req.body

        if (!role?.trim() || !numberOfPeople) {
            res.status(400).json({ message: "role and No of People is mandatory", ok: false })
            return;
        }

        let isCorrectTotalCost = numberOfPeople * ((estimatedHours ?? 0) * (hourlyRate ?? 0))

        if (![null, undefined].includes(totalCost) && isCorrectTotalCost !== totalCost) {
            res.status(400).json({ message: "total cost for single labour items is not correct", ok: false })
            return
        }

        let createdLabour;

        if (labourListId) {
            createdLabour = await LabourEstimateModel.findOneAndUpdate( {labourListId}, {
                $push: {
                    labourItems: {
                        role,
                        numberOfPeople,
                        estimatedHours: estimatedHours || 0,
                        hourlyRate: hourlyRate || 0,
                        totalCost: isCorrectTotalCost || 0,
                        notes: notes || null,
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

            await LabourListModel.findByIdAndUpdate(labourListId, {
                $addToSet: {
                    labours: createdLabour._id
                }
            }, { returnDocument: "after" })
        }
        else {
            let labourList = await LabourListModel.findOne({ projectId, labourListName: "general labour" });

            if (!labourList) {
                let labourlist = await LabourListModel.create({
                    labourListName: "general labour",
                    projectId,
                    labours: []
                })

                  if (!labourlist) {
                    res.status(400).json({ message: "Problem creating labour List", ok: false });
                    return;
                }

                createdLabour = await LabourEstimateModel.create({
                    labourListId: labourlist._id,
                    labourItems: [{
                        role,
                        numberOfPeople,
                        estimatedHours: estimatedHours ?? 0,
                        hourlyRate: hourlyRate ?? 0,
                        totalCost: isCorrectTotalCost ?? 0,
                        notes: notes ?? null,
                    }],
                    totalLabourCost: isCorrectTotalCost ?? 0
                })

                labourlist.labours.push(createdLabour._id)
                await labourlist.save()

            }
            else {
                createdLabour = await LabourEstimateModel.findOne({ labourListId: labourList._id })

                if (!createdLabour) {
                    res.status(404).json({ message: "no labour list found", ok: false })
                    return

                }

                createdLabour?.labourItems.push({
                    role,
                    numberOfPeople,
                    estimatedHours: estimatedHours ?? 0,
                    hourlyRate: hourlyRate ?? 0,
                    totalCost: isCorrectTotalCost ?? 0,
                    notes: notes ?? null,
                })

                createdLabour.totalLabourCost = createdLabour.labourItems.reduce(
                    (sum, item) => sum + (item.totalCost || 0),
                    0
                );

                await createdLabour.save();
            }

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

        let labourEstimateDoc = await LabourEstimateModel.findOne({ labourListId })


        if (!labourEstimateDoc) {
            res.status(404).json({ message: "labour items not found", ok: false });
            return;
        }

        // 2️⃣ Get approval doc
        const approvalDoc = await LabourApprovalModel.findOne({ labourListId });

        const approvedMap: Record<string, { approved: string; feedback: string | null }> = {};

        if (approvalDoc?.approvedItems?.length) {
            approvalDoc.approvedItems.forEach((item: any) => {
                approvedMap[item.labourItemId.toString()] = {
                    approved: item.approved,
                    feedback: item.feedback
                };
            });
        }

        // 3️⃣ Merge each material item with approval status
        const mergedMaterials = labourEstimateDoc.labourItems.map((labour: any) => {
            const itemId = labour._id.toString();
            return {
                ...labour.toObject(), //here teh material means to material items array where it will contain the array of objects
                clientApproved: approvalDoc ? (approvedMap[itemId]?.approved || "pending") : "no client assigned",
                clientFeedback: approvalDoc ? (approvedMap[itemId]?.feedback || null) : null
            };
        });

        const totalLabourCost = labourEstimateDoc.totalLabourCost

        res.status(200).json({
            message: "labour items fetched successfully",
            ok: true,
            data: { _id: labourEstimateDoc._id, labourListId, mergedMaterials, totalLabourCost }
        });

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

        if (!labourList.length) {
            res.status(200).json({ message: "labour List not found", ok: false, data: labourList })
            return
        }

        // 2. Prepare output with clientApproved field
        const result = await Promise.all(labourList.map(async (list) => {
            const labourEstimate = await LabourEstimateModel.findOne({ labourListId: list._id });
            const labourApproval = await LabourApprovalModel.findOne({ labourListId: list._id });

            let status = "no client assigned";

            if (labourEstimate && labourApproval) {
                const totalItems = labourEstimate.labourItems.length;
                const approvals = labourApproval.approvedItems;

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
            message: "Labour lists fetched successfully",
            ok: true,
            data: result,
        });


        // res.status(200).json({ message: "fetched labour lists", data: labourList, ok: true })
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
            res.status(400).json({ message: "Project ID and labour List Id is required", ok: false });
            return
        }

        if (!labourListName) {
            res.status(400).json({ message: "labour list name is required", ok: false })
            return;
        }

        const updatedData = await LabourListModel.findOneAndUpdate({ _id: labourListId, projectId }, { labourListName }, { returnDocument: "after" })

        res.status(200).json({ message: "labour list is updated", ok: true, data: updatedData })
    }
    catch (error) {
        console.error("Error from update labour:", error);
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
            notes } = req.body

        if (!labourListId || !labourItemId) {
            res.status(400).json({ message: "LabourItem Id and Labour List Id is required", ok: false })
            return;
        }

        if (!role?.trim() || !numberOfPeople) {
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
        labourItem.role = role?.trim() ?? labourItem.role;
        labourItem.numberOfPeople = numberOfPeople ?? labourItem.numberOfPeople;
        labourItem.estimatedHours = estimatedHours ?? labourItem.estimatedHours;
        labourItem.hourlyRate = hourlyRate ?? labourItem.hourlyRate;
        labourItem.notes = notes?.trim() ?? labourItem.notes;

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
        let { labourListId, labourItemId } = req.params


        if (!labourListId || !labourItemId) {
            res.status(400).json({ message: "LabourItem ID and LabourList Id is required", ok: false });
            return
        }

        const updated = await LabourEstimateModel.findOneAndUpdate(
            { labourListId },
            { $pull: { labourItems: { _id: labourItemId } } },
            { returnDocument: "after" }
        );

        if (!updated) {
            res.status(404).json({ message: "Labour item not found", ok: false });
            return;
        }

        updated.totalLabourCost = updated.labourItems.reduce(
            (sum, item) => sum + (item.totalCost || 0),
            0
        );

        await updated.save()

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