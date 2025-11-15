
/**
 * Get the name field based on model type
 */
export function getNameFieldByModel(modelName: string): string {
  const nameFieldMap: Record<string, string> = {
    'StaffModel': 'staffName',
    'UserModel': 'username',
    'WorkerModel': 'workerName',
    'CTOModel': 'CTOName',
    'ClientModel': "clientName"
  };
  
  return nameFieldMap[modelName] || 'name';
}


export function getModelNameByRole(role: string): string {
  const nameFieldMap: Record<string, string> = {
    "staff": 'StaffModel',
    "owner": 'UserModel',
    "worker":'WorkerModel',
    "CTO": 'CTOModel',
    "client": "ClientModel"
  };
  
  return nameFieldMap[role] || 'staffModel';
}

