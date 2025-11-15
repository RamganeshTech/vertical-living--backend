// utils/populateDiscussion.util.ts

import { Types } from "mongoose";
import { getNameFieldByModel } from "../../../utils/common features/utils";

interface PopulateField {
  path: string;
  model?: string;
  select: string;
}

/**
 * Get common fields to populate based on model
 */
export function getSelectFieldsByModel(modelName: string): string {
  const nameField = getNameFieldByModel(modelName);
  // Add other common fields you want to populate
  return `${nameField} email avatar role designation`;
}






// export async function   populateDiscussion(discussion: any) {
//     // First, populate project
//     await discussion.populate({
//         path: 'projectId',
//         select: 'projectName status'
//     });

//     // Then handle dynamic populations for each conversation
//     for (let i = 0; i < discussion.discussion.length; i++) {
//         const convo = discussion.discussion[i];
        
//         // Populate selectStaff with the correct model based on staffSelectedModel
//         if (convo.issue.selectStaff && convo.issue.staffSelectedModel) {
//             const nameField = getNameFieldByModel(convo.issue.staffSelectedModel);
            
//             await discussion.populate({
//                 path: `discussion.${i}.issue.selectStaff`,
//                 model: convo.issue.staffSelectedModel,  // ✅ Use the dynamic model
//                 select: `${nameField} email `
//             });
//         }

//         // Populate raisedBy with correct model based on raisedModel
//         if (convo.issue.raisedBy && convo.issue.raisedModel) {
//             const nameField = getNameFieldByModel(convo.issue.raisedModel);
            
//             await discussion.populate({
//                 path: `discussion.${i}.issue.raisedBy`,
//                 model: convo.issue.raisedModel,  // ✅ Use the dynamic model
//                 select: `${nameField} email `
//             });
//         }

//         // Populate responsededBy with correct model
//         if (convo.response?.responsededBy && convo.response.responsededModel) {
//             const nameField = getNameFieldByModel(convo.response.responsededModel);
            
//             await discussion.populate({
//                 path: `discussion.${i}.response.responsededBy`,
//                 model: convo.response.responsededModel,  // ✅ Use the dynamic model
//                 select: `${nameField} email `
//             });
//         }
//     }

//     return discussion;
// }


export async function populateDiscussion(discussion: any) {
    // Handle dynamic populations for each conversation
    for (let i = 0; i < discussion.discussion.length; i++) {
        const convo = discussion.discussion[i];
        
        // ✅ Populate projectId for each issue
        if (convo.issue.projectId) {
            await discussion.populate({
                path: `discussion.${i}.issue.projectId`,
                model: 'ProjectModel',
                select: 'projectName status'
            });
        }
        
        // Populate selectStaff with the correct model based on staffSelectedModel
        if (convo.issue.selectStaff && convo.issue.staffSelectedModel) {
            const nameField = getNameFieldByModel(convo.issue.staffSelectedModel);
            
            await discussion.populate({
                path: `discussion.${i}.issue.selectStaff`,
                model: convo.issue.staffSelectedModel,
                select: `${nameField} email`
            });
        }

        // Populate raisedBy with correct model based on raisedModel
        if (convo.issue.raisedBy && convo.issue.raisedModel) {
            const nameField = getNameFieldByModel(convo.issue.raisedModel);
            
            await discussion.populate({
                path: `discussion.${i}.issue.raisedBy`,
                model: convo.issue.raisedModel,
                select: `${nameField} email`
            });
        }

        // Populate responsededBy with correct model
        if (convo.response?.responsededBy && convo.response.responsededModel) {
            const nameField = getNameFieldByModel(convo.response.responsededModel);
            
            await discussion.populate({
                path: `discussion.${i}.response.responsededBy`,
                model: convo.response.responsededModel,
                select: `${nameField} email`
            });
        }
    }

    return discussion;
}


/**
 * Format populated user data to have consistent structure
 */
export function formatUserData(user: any, modelType: string) {
  if (!user) return null;
  
  const nameField = getNameFieldByModel(modelType);
  
  return {
    _id: user._id,
    name: user[nameField], // Map to consistent 'name' field
    email: user.email,
    // avatar: user.avatar,
    // designation: user.designation,
    role: user.role,
    modelType
  };
}