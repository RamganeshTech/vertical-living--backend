import { Response } from "express";
import { RequirementFormModel } from "../../models/requirment model/requirement.model";
import { AuthenticatedClientRequest } from "../../types/types";



const updateKitchenSection = async (req: AuthenticatedClientRequest, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const {kitchen} = req.body;
        const client = req.client;

        if (!kitchen) {
            return res.status(400).json({ ok: false, message: "Kitchen data is required" });
        }

        const form = await RequirementFormModel.findOne({ projectId });

        if (!form) {
            return res.status(404).json({ ok: false, message: "Requirement form not found" });
        }

        // Ensure form is editable
        if (form.status === "completed" || form.status === "locked") {
            return res.status(400).json({ ok: false, message: "Form is not editable" });
        }

        // Ensure client is the one who submitted
        if (form.clientData?.clientName?.toString() !== client.clientName.toString()) {
            return res.status(400).json({ ok: false, message: "Not authorized to edit this form" });
        }

        form.kitchen = kitchen;
        await form.save();

        return res.status(200).json({ ok: true, message: "Kitchen section updated successfully", data: form.kitchen });
    } catch (err) {
        console.error("Error updating kitchen section:", err);
        return res.status(500).json({ ok: false, message: "Server error" });
    }
};

const updateBedroomSection = async (req: AuthenticatedClientRequest, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const client = req.client;;
        const { bedroom } = req.body;

        if (!bedroom) {
            return res.status(400).json({ ok: false, message: "Bedroom data is required" });
        }

        const form = await RequirementFormModel.findOne({ projectId });
        if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

        if (form.status === "completed" || form.status === "locked") {
            return res.status(403).json({ ok: false, message: "Form is not editable" });
        }

        if (form.clientData?.clientName?.toString() !== client.clientName.toString()) {
            return res.status(403).json({ ok: false, message: "Not authorized" });
        }

        form.bedroom = bedroom;
        await form.save();

        return res.status(200).json({ ok: true, message: "Bedroom updated", data: form.bedroom });
    }
    catch (error) {
        console.log("error form bedroom section", error)
        return res.status(500).json({ message: "internal server error", ok: false })
    }
};

const updateWardrobeSection = async (req: AuthenticatedClientRequest, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const client = req.client;;
        const { wardrobe } = req.body;

        if (!wardrobe) {
            return res.status(400).json({ ok: false, message: "Wardrobe data is required" });
        }

        const form = await RequirementFormModel.findOne({ projectId });
        if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

        if (form.status === "completed" || form.status === "locked") {
            return res.status(403).json({ ok: false, message: "Form is not editable" });
        }

        if (form.clientData?.clientName?.toString() !== client.clientName.toString()) {
            return res.status(403).json({ ok: false, message: "Not authorized" });
        }

        form.wardrobe = wardrobe;
        await form.save();

        return res.status(200).json({ ok: true, message: "Wardrobe updated", data: form.wardrobe });
    }
    catch (error) {
        console.log("error form wardrobe section", error)
        return res.status(500).json({ message: "internal server error", ok: false })
    }
};


const updateLivingHallSection = async (req: AuthenticatedClientRequest, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const client = req.client;;
        const { livingHall } = req.body;

        if (!livingHall) {
            return res.status(400).json({ ok: false, message: "Living hall data is required" });
        }

        const form = await RequirementFormModel.findOne({ projectId });
        if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

        if (form.status === "completed" || form.status === "locked") {
            return res.status(403).json({ ok: false, message: "Form is not editable" });
        }

        if (form.clientData?.clientName?.toString() !== client.clientName.toString()) {
            return res.status(403).json({ ok: false, message: "Not authorized" });
        }

        form.livingHall = livingHall;
        await form.save();

        return res.status(200).json({ ok: true, message: "Living hall updated", data: form.livingHall });
    }
    catch (error) {
        console.log("error form living hall section", error)
        return res.status(500).json({ message: "internal server error", ok: false })
    }
};



export {
    updateKitchenSection,
    updateBedroomSection,
    updateWardrobeSection,
    updateLivingHallSection
}

