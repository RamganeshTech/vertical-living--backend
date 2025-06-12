import { WorkerModel } from "../models/worker model/worker.model";

export const removeWorkerUtils = async ({workerId, projectId}: {workerId:string, projectId:string})=>{
            return await WorkerModel.findByIdAndUpdate(workerId, {$pull : {projectId: projectId}}, {returnDocument:"after"});
}

export const getWorkerUtils = async ({projectId}: { projectId:string})=>{
           return await WorkerModel.find({ projectId });
}