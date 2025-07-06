// utils/getEmailsForProject.ts
import UserModel from "../../../models/usermodel/user.model";
import CTOModel from "../../../models/CTO model/CTO.model";

export const getEmailsForProject = async (projectId: string): Promise<string[]> => {
  const [owner] = await UserModel.find({ projectId }); // assuming owner is from UserModel
  const [cto] = await CTOModel.find({ projectId });

  return [
    owner?.email,
    cto?.email,
  ].filter(Boolean);
};
