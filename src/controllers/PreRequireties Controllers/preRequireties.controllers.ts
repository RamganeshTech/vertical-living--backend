import { Request, Response } from "express";
import { PreRequiretiesModel } from "../../models/PreRequisites/preRequireties.model";
import { ObjectId, Types } from 'mongoose';



export const syncPreRequireties = async (projectId: Types.ObjectId | string) => {
    const defaultData = {
        isRequired: false,
        notes: null
    }

    const data = await PreRequiretiesModel.create({
        modularWork: defaultData,
        electricalWork: defaultData,
        plumbingWork: defaultData,
        civilWork: defaultData,
        decorationWork: defaultData,
        carpentryWork: defaultData,
        projectId
    })

    return data
}

// 🟢 1️⃣ Update notes for a single work section
const updatePreRequiretyNotes = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id, section } = req.params; // id = PreRequireties ID, section = which section to update
        const { notes } = req.body;

        if (!['modularWork', 'electricalWork', 'plumbingWork', 'civilWork', 'decorationWork','carpentryWork'].includes(section)) {
            return res.status(400).json({ ok: false, message: "Invalid section name" });
        }

        const updatePath = `${section}.notes`;

        const updated = await PreRequiretiesModel.findByIdAndUpdate(
            id,
            { $set: { [updatePath]: notes } },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "section not foudn", ok: false })
        }

        res.status(200).json({ ok: true, data: updated });
    } catch (error: any) {
        res.status(500).json({ ok: false, message: "internal server error" });
    }
};

// 🟢 2️⃣ Update isRequired for a single work section
const updatePreRequiretyBoolean = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id, section } = req.params; // id = PreRequireties ID, section = which section to update
        const { isRequired } = req.body;

        if (typeof isRequired !== "boolean") {
            return res.status(400).json({ ok: false, message: "isRequired must be a boolean" });
        }

        if (!['modularWork', 'electricalWork', 'plumbingWork', 'civilWork', 'decorationWork', 'carpentryWork'].includes(section)) {
            return res.status(400).json({ ok: false, message: "Invalid section name" });
        }

        const updatePath = `${section}.isRequired`;
// console.log("id ", id)
        const updated = await PreRequiretiesModel.findByIdAndUpdate(
            id,
            { $set: { [updatePath]: isRequired } },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "section not foudn", ok: false })
        }

        res.status(200).json({ ok: true, data: updated });
    } catch (error) {
        res.status(500).json({ ok: false, message: "internal server error" });
    }
};

// 🟢 3️⃣ Get all
const getAllPreRequireties = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const data = await PreRequiretiesModel.findOne({ projectId });

        if (!data) {
            return res.status(400).json({ message: "Pre Requireties not found ", data: null, ok: false })
        }


        res.status(200).json({ ok: true, data });
    } catch (error) {
        res.status(500).json({ ok: false, message: "internal server error" });
    }
};

// 🟢 4️⃣ Get single
const getSinglePreRequirity = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, section } = req.params;
        const data = await PreRequiretiesModel.findOne({ projectId, section });

        if (!data) {
            return res.status(400).json({ message: "Pre Requireties not found", data: null, ok: false })
        }

        res.status(200).json({ ok: true, data });
    } catch (error) {
        res.status(500).json({ ok: false, message: "internal server error" });
    }
};

// ✅ Group export
export {
    updatePreRequiretyNotes,
    updatePreRequiretyBoolean,
    getAllPreRequireties,
    getSinglePreRequirity,
};
