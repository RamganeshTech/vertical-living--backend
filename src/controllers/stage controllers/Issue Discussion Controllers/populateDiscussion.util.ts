// utils/populateDiscussion.util.ts

import { Types } from "mongoose";

interface PopulateField {
  path: string;
  model?: string;
  select: string;
}

/**
 * Get the name field based on model type
 */
export function getNameFieldByModel(modelName: string): string {
  const nameFieldMap: Record<string, string> = {
    'StaffModel': 'staffName',
    'UserModel': 'username',
    'WorkerModel': 'workerName',
    'CTOModel': 'CTOName'
  };
  
  return nameFieldMap[modelName] || 'name';
}


export function getModelNameByRole(role: string): string {
  const nameFieldMap: Record<string, string> = {
    "staff": 'StaffModel',
    "owner": 'UserModel',
    "worker":'WorkerModel',
    "CTO": 'CTOModel',
  };
  
  return nameFieldMap[role] || 'staffModel';
}


/**
 * Get common fields to populate based on model
 */
export function getSelectFieldsByModel(modelName: string): string {
  const nameField = getNameFieldByModel(modelName);
  // Add other common fields you want to populate
  return `${nameField} email avatar role designation`;
}

/**
 * Build population options for discussion queries
 */
export function buildDiscussionPopulateOptions() {
  return [
    {
      path: 'projectId',
      select: 'projectName status'
    },
    {
      path: 'discussion.issue.raisedBy',
      select: function(doc: any) {
        // Dynamic selection based on the model
        return getSelectFieldsByModel(doc.raisedModel);
      }
    },
    {
      path: 'discussion.issue.selectStaff',
      model: 'StaffModel',
      select: 'staffName email avatar designation'
    },
    {
      path: 'discussion.response.responsededBy',
      select: function(doc: any) {
        return getSelectFieldsByModel(doc.responsededModel);
      }
    }
  ];
}

/**
 * Populate discussion with proper name fields
 * Use this after fetching the document
 */
// export async function populateDiscussion(discussion: any) {
//   // First, populate without dynamic fields
//   await discussion.populate([
//     {
//       path: 'projectId',
//       select: 'projectName status'
//     },
//     {
//       path: 'discussion.issue.selectStaff',
//       model: 'StaffModel',
//       select: 'staffName email'
//     }
//   ]);

//   // Then handle dynamic populations
//   for (const convo of discussion.discussion) {
//     // Populate raisedBy with correct field
//     if (convo.issue.raisedBy) {
//       const nameField = getNameFieldByModel(convo.issue.raisedModel);
//       await discussion.populate({
//         path: `discussion.${discussion.discussion.indexOf(convo)}.issue.raisedBy`,
//         select: `${nameField} email`
//       });
//     }

//     // Populate responsededBy with correct field
//     if (convo.response?.responsededBy) {
//       const nameField = getNameFieldByModel(convo.response.responsededModel);
//       await discussion.populate({
//         path: `discussion.${discussion.discussion.indexOf(convo)}.response.responsededBy`,
//         select: `${nameField} email`
//       });
//     }
//   }

//   return discussion;
// }


// export async function populateDiscussion(discussion: any) {
//   await discussion.populate([
//     {
//       path: 'projectId',
//       select: 'projectName status'
//     },
//     {
//       path: 'discussion.issue.selectStaff',
//       model: 'StaffModel',
//       select: 'staffName email'
//     },
//     {
//       path: 'discussion.issue.raisedBy',
//       select: 'username staffName workerName CTOName email',
//     },
//     {
//       path: 'discussion.response.responsededBy',
//       select: 'username staffName workerName CTOName email',
//     }
//   ]);

//   return discussion;
// }



export async function populateDiscussion(discussion: any) {
    // First, populate project
    await discussion.populate({
        path: 'projectId',
        select: 'projectName status'
    });

    // Then handle dynamic populations for each conversation
    for (let i = 0; i < discussion.discussion.length; i++) {
        const convo = discussion.discussion[i];
        
        // Populate selectStaff with the correct model based on staffSelectedModel
        if (convo.issue.selectStaff && convo.issue.staffSelectedModel) {
            const nameField = getNameFieldByModel(convo.issue.staffSelectedModel);
            
            await discussion.populate({
                path: `discussion.${i}.issue.selectStaff`,
                model: convo.issue.staffSelectedModel,  // ✅ Use the dynamic model
                select: `${nameField} email `
            });
        }

        // Populate raisedBy with correct model based on raisedModel
        if (convo.issue.raisedBy && convo.issue.raisedModel) {
            const nameField = getNameFieldByModel(convo.issue.raisedModel);
            
            await discussion.populate({
                path: `discussion.${i}.issue.raisedBy`,
                model: convo.issue.raisedModel,  // ✅ Use the dynamic model
                select: `${nameField} email `
            });
        }

        // Populate responsededBy with correct model
        if (convo.response?.responsededBy && convo.response.responsededModel) {
            const nameField = getNameFieldByModel(convo.response.responsededModel);
            
            await discussion.populate({
                path: `discussion.${i}.response.responsededBy`,
                model: convo.response.responsededModel,  // ✅ Use the dynamic model
                select: `${nameField} email `
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
    avatar: user.avatar,
    designation: user.designation,
    role: user.role,
    modelType
  };
}