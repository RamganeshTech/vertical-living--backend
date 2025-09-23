import { Router } from 'express';
import {
  // 1. Create
  createStaffTask,

  // 2. Sub-task actions
  updateSubTaskName,
  deleteSubTask,

  // 3. Main task updates
  updateMainTask,
  deleteMainTask,

  // 4. Status + History
  updateTaskHistory,

  // 5. Filters
  getAllTasks,
  getSingleTask,
  suggestSubtasks
} from '../../controllers/Staff Task Controllers/saffTask.controller';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';
import { staffTaskAccess } from '../../middlewares/staffTaskAccess';

const staffTaskRoutes = Router();


staffTaskRoutes.post('/tasks/bulk', multiRoleAuthMiddleware("owner", "staff", "CTO") , createStaffTask); 

// 📝 2. UPDATE / DELETE SUB-TASKS ----------------------------------

// Update subtask name
staffTaskRoutes.patch('/tasks/:mainTaskId/subtasks/:subTaskId', multiRoleAuthMiddleware("owner", "staff", "CTO"), staffTaskAccess, updateSubTaskName);

// Delete a subtask
staffTaskRoutes.delete('/tasks/:mainTaskId/subtasks/:subTaskId', multiRoleAuthMiddleware("owner", "staff", "CTO"), staffTaskAccess, deleteSubTask);


// 🛠️ 3. UPDATE / DELETE MAIN TASK ---------------------------------

// Update a main task's top-level info (title, due, etc)
staffTaskRoutes.patch('/tasks/:mainTaskId',multiRoleAuthMiddleware("owner", "staff", "CTO"), staffTaskAccess, updateMainTask);

// Delete a main task completely
staffTaskRoutes.delete('/tasks/:mainTaskId',multiRoleAuthMiddleware("owner", "staff", "CTO"), staffTaskAccess, deleteMainTask);


// ⏯️ 4. SUB-TASK STATUS (HISTORY TRACKING) -------------------------

// Add a status update to history (paused, started, etc)
staffTaskRoutes.patch('/tasks/:mainTaskId/subtasks/:subTaskId/history',multiRoleAuthMiddleware("owner", "staff", "CTO"), staffTaskAccess, updateTaskHistory);


// 🔍 5. GET TASKS BASED ON FILTERS ---------------------------------

// Get all tasks using query filters (status, priority, assigneeId, overdue, etc)
staffTaskRoutes.get('/suggest/subtasks', multiRoleAuthMiddleware("owner", "staff", "CTO"), suggestSubtasks);
staffTaskRoutes.get('/tasks', multiRoleAuthMiddleware("owner", "staff", "CTO"), getAllTasks);
staffTaskRoutes.get('/singletask/:id', multiRoleAuthMiddleware("owner", "staff", "CTO"), getSingleTask);

export default staffTaskRoutes;