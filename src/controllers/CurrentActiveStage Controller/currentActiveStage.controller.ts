import { Request, Response } from 'express';
import { getStageSelectionUtil } from '../Modular Units Controllers/StageSelection Controller/stageSelection.controller';
import { stageModels } from '../../constants/BEconstants';




// Corresponding frontend stage route slugs
const allStageRoutes = [
    "requirementform",
    "sitemeasurement",
    "sampledesign",
    "technicalconsultant",
    "modularunits",
    "materialselection",
    "costestimation",
    "paymentconfirmation",
    "ordermaterial",
    "materialarrival",
    "workmainschedule",
    "installation",
    "qualitycheck",
    "cleaning",
    "projectdelivery",
];

export const getFirstPendingStageForProject = async (req: Request, res: Response): Promise<any> => {
    const { projectId } = req.params;

    // 1️⃣ Always check first 4 stages
    for (let i = 0; i < 4; i++) {
        const model = stageModels[i];
        const doc = await model.findOne({ projectId });
        const isCompleted = doc?.status === "completed";

        if (!isCompleted) {
            return res.json({ redirectTo: allStageRoutes[i] });
        }
    }

    const selection = await getStageSelectionUtil(projectId);
    const selectedMode = selection?.mode;

    if (!selectedMode) {
        return res.json({ redirectTo: "selectstage", ok: true });
    }

    // 3️⃣ Mode-specific stage check
    let allowedIndexes: number[];

    if (selectedMode === "Manual Flow") {
        allowedIndexes = [...Array(15).keys()].slice(5); // indexes 5 to 14
    } else if (selectedMode === "Modular Units") {
        allowedIndexes = [...Array(15).keys()].filter(i => i !== 5 && i !== 6 && i >= 4); // skip Material Selection & Cost Estimation
    } else {
        return res.status(200).json({ redirectTo: "selectstage",  ok: true });
    }

    for (const i of allowedIndexes) {
        const model = stageModels[i];
        const doc = await model.findOne({ projectId });

        if (!doc) {
            continue;
        }

        const isCompleted = doc?.status === "completed";

        if (!isCompleted) {
            return res.json({ redirectTo: allStageRoutes[i], ok: true });
        }
    }

    // 4️⃣ got to the first stage
    return res.json({ redirectTo: allStageRoutes.at(0)!, ok: true });
};
