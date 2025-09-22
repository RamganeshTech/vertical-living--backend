import { Request, Response, NextFunction } from 'express';
import { RoleBasedRequest } from '../types/types';
import StaffMainTaskModel from '../models/Staff Task Models/staffTask.model';


export const staffTaskAccess = async (req: RoleBasedRequest, res: Response, next: NextFunction):Promise<any> => {
  const { mainTaskId } = req.params;
  const user = req.user;

  if (!user || !user._id || !user.role) {
    return res.status(401).json({
      ok: false,
      message: 'User not authenticated.'
    });
  }

  try {
    const task = await StaffMainTaskModel.findById(mainTaskId);

    if (!task) {
      return res.status(404).json({
        ok: false,
        message: 'Task not found.'
      });
    }

    const privilegedRoles = ['owner', 'CTO'];

    if (privilegedRoles.includes(user.role)) {
      // ✅ Owner or CTO can modify any task
      return next();
    }

    if (user.role === 'staff') {
      const taskAssigneeId = task?.assigneeId?.toString();
      const userId = user._id?.toString();


        // ❗Task has no assignee → allow any staff
      if (!taskAssigneeId) {
        return next(); // any staff can update
      }

      // ❗ Assignee is specified → must match
      if (userId === taskAssigneeId) {
        return next(); // this staff is the assignee
      }

      if (userId !== taskAssigneeId) {
        return res.status(403).json({
          ok: false,
          message: 'You are not authorized to modify this task.'
        });
      }

    //   return next(); // ✅ Staff is the assignee
    }

    // ❌ If user is not in allowed roles
    return res.status(403).json({
      ok: false,
      message: 'You do not have permission to modify this task.'
    });

  } catch (err) {
    console.error('Task access check failed:', err);
    return res.status(500).json({
      ok: false,
      message: 'Error in checking task access.'
    });
  }
};