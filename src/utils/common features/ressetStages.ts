import redisClient from "../../config/redisClient";
import { stageModels } from "../../constants/BEconstants";
import ProjectModel from "../../models/project model/project.model";
import { populateWithAssignedToField } from "../populateWithRedis";




export const resetStages = async (projectId: string, upToStageNumber: number) => {
    // const now = new Date();


    // Reset only up to the requested stage
    // for (let i = 0; i < upToStageNumber; i++) {
    //     const model = stageModels[i];
    //     const doc = await model.findOne({ projectId });
    //     if (!doc) continue;

    //     // Reset stage
    //     doc.status = "pending";
    //     if ("isEditable" in doc) {
    //         doc.isEditable = i === 0;
    //     }
    //     // doc.timer = {
    //     //     startedAt: i === 0 ? now : null,
    //     //     completedAt: null,
    //     //     deadline: i === 0 ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) : null,
    //     // };


    //     await doc.save();

    //     populateWithAssignedToField({stageModel:model,dataToCache:doc, projectId})
    // }


    // reset All Stages
    for (let i = 0; i < stageModels?.length; i++) {
        const model = stageModels[i];
        const doc = await model.findOne({ projectId });
        if (!doc) continue;

        // Reset stage
        doc.status = "pending";
        if ("isEditable" in doc) {
            doc.isEditable = i === 0;
        }
        // doc.timer = {
        //     startedAt: i === 0 ? now : null,
        //     completedAt: null,
        //     deadline: i === 0 ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) : null,
        // };


        if(i === 7){
            doc.paymentTransaction.status = null
        }


        await doc.save();

        if(model.modelName !== "SelectedModularUnitModel"){
            console.log("model name", model.modelName)
            await populateWithAssignedToField({ stageModel: model, dataToCache: doc, projectId })
        }
       
        await ProjectModel.updateOne(
            { _id: projectId },
            { $set: { completionPercentage: 0 } }
        );
    }


    // Reset all stages


    return true;
};
