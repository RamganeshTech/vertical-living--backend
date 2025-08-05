// utils/getEmailsForProject.ts
import UserModel from "../../../models/usermodel/user.model";
import CTOModel from "../../../models/CTO model/CTO.model";
import mongoose from "mongoose";

export const getEmailsForProject = async (projectId: string): Promise<string[]> => {
  const _id = new mongoose.Types.ObjectId(projectId); // convert to ObjectId
  const [owner] = await UserModel.find({ projectId:_id }); // assuming owner is from UserModel
  const [cto] = await CTOModel.find({ projectId:_id });

  return [
    owner?.email,
    cto?.email,
  ].filter(Boolean);
};
