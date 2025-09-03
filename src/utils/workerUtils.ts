import { EmployeeModel } from "../models/Department Models/HR Model/HRMain.model";
import { WorkerModel } from "../models/worker model/worker.model";

export const removeWorkerUtils = async ({workerId, projectId}: {workerId:string, projectId:string})=>{
            // return await WorkerModel.findByIdAndUpdate(workerId, {$pull : {projectId: projectId}}, {returnDocument:"after"});


             const [worker, hremp] = await Promise.all([
                        WorkerModel.findByIdAndDelete(workerId, { new: true }),
                        EmployeeModel.findOneAndDelete({ empId: workerId })]
                    );
            return worker
}

export const getWorkerUtils = async ({projectId}: { projectId:string})=>{
           return await WorkerModel.find({ projectId });
}