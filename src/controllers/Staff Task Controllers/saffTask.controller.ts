import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { RoleBasedRequest } from '../../types/types';
import StaffMainTaskModel, { IStaffTask } from '../../models/Staff Task Models/staffTask.model';

const ALLOWED_MODELS = ["UserModel", "StaffModel", "CTOModel", "WorkerModel"];
const VALID_STATUSES = ['queued', 'in_progress', 'paused', 'done'];


const mapRoleToModel = (role: string): string => {
    switch (role) {
        case 'owner':
            return 'UserModel';
        case 'CTO':
            return 'CTOModel';
        case 'staff':
            return 'StaffModel';
        case 'worker':
            return 'WorkerModel';
        default:
            throw new Error(`Invalid role: ${role}`);
    }
};


export const getAllTasks = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            status,
            priority,
            assigneeId,
            projectId,
            department,
            overdue
        } = req.query;

        const query: any = {};

        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (assigneeId) query.assigneeId = new Types.ObjectId(assigneeId as string);
        if (projectId) query.projectId = new Types.ObjectId(projectId as string);
        if (department) query.department = department;

        if (overdue === 'true') {
            query.due = { $lt: new Date() }; // due < now
        }

        const tasks = await StaffMainTaskModel.find(query);

        return res.status(200).json({
            ok: true,
            message: 'Tasks fetched successfully',
            data: tasks
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return res.status(500).json({
            ok: false,
            message: 'Failed to fetch tasks'
        });
    }
};



export const getSingleTask = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            id
        } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Id not available", ok: false })
        }

        const tasks = await StaffMainTaskModel.findById(id);

        return res.status(200).json({
            ok: true,
            message: 'Tasks fetched successfully',
            data: tasks || null
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return res.status(500).json({
            ok: false,
            message: 'Failed to fetch tasks'
        });
    }
};

export const createStaffTask = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const {
            tasks,
            assigneRole
        }: {
            tasks: Array<Partial<IStaffTask> & { tasks: { taskName: string }[] }>;
            assigneRole: string;
        } = req.body;

        const user = req.user;

        if (!user || !user?.role || !user?._id) {
            return res.status(401).json({ ok: false, message: 'Unauthorized request (user not found)' });
        }

        if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
            return res.status(400).json({ ok: false, message: 'No tasks provided for creation' });
        }

        // Get appropriate model names based on roles
        let assigneeModel = mapRoleToModel(assigneRole);
        let assignedByModel = mapRoleToModel(user.role); // From backend - don't rely on frontend

        const assignedById = user._id;

        if (!ALLOWED_MODELS.includes(assigneeModel) || !ALLOWED_MODELS.includes(assignedByModel)) {
            return res.status(400).json({ ok: false, message: 'Invalid model mapping for assignee or assigner' });
        }


        const newTasks: IStaffTask[] = [];

        for (const taskData of tasks) {
            const {
                title,
                description,
                due,
                status = 'queued',
                priority = 'medium',
                projectId,
                organizationId,
                assigneeId,
                department,
                tasks: subTasks = [],
                dependentTaskId
            } = taskData;

            // Validation: Required fields per task
            if (!title) {
                return res.status(400).json({
                    ok: false,
                    message: 'Task title is required',
                });
            }


           

            const newTask = new StaffMainTaskModel({
                title,
                description,
                due,
                status,
                priority,
                department,

                projectId: projectId || null,
                organizationId,

                assigneeId: assigneeId || null,
                assigneModel: assigneeModel,

                assignedById,
                assignedByModel,
                tasks: subTasks, // [{ taskName }]
                dependentTaskId: dependentTaskId || null,
                history: [
                    //   {
                    //     status,
                    //     changedAt: new Date(),
                    //     changedBy: assignedById,
                    //     userModel: assignedByModel
                    //   }
                ]
            });

            newTasks.push(newTask);
        }

        // Insert all at once
        const savedTasks = await StaffMainTaskModel.insertMany(newTasks);

        return res.status(201).json({
            ok: true,
            message: `${savedTasks.length} task(s) created successfully.`,
            data: savedTasks
        });

    } catch (error) {
        console.error('Error in createStaffTask:', error);
        return res.status(500).json({ ok: false, message: 'Internal server error' });
    }
};


// PATCH /tasks/:mainTaskId/subtasks/:subTaskId
export const updateSubTaskName = async (req: Request, res: Response): Promise<any> => {
    const { mainTaskId, subTaskId } = req.params;
    const { taskName } = req.body;

    if (!taskName || taskName.trim().length === 0) {
        return res.status(400).json({
            ok: false,
            message: 'Sub-task name cannot be empty'
        });
    }

    try {
        const updated = await StaffMainTaskModel.findOneAndUpdate(
            {
                _id: mainTaskId,
                'tasks._id': subTaskId
            },
            {
                $set: { 'tasks.$.taskName': taskName }
            },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({
                ok: false,
                message: 'Main task or sub-task not found'
            });
        }

        return res.status(200).json({
            ok: true,
            message: 'Sub-task updated successfully',
            data: updated
        });
    } catch (error) {
        console.error('Error updating sub-task:', error);
        return res.status(500).json({
            ok: false,
            message: 'Failed to update sub-task'
        });
    }
};



// DELETE /tasks/:mainTaskId/subtasks/:subTaskId
export const deleteSubTask = async (req: Request, res: Response): Promise<any> => {
    const { mainTaskId, subTaskId } = req.params;

    try {
        const updated = await StaffMainTaskModel.findByIdAndUpdate(
            mainTaskId,
            {
                $pull: { tasks: { _id: subTaskId } }
            },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({
                ok: false,
                message: 'Main task or sub-task not found'
            });
        }

        return res.status(200).json({
            ok: true,
            message: 'Sub-task deleted successfully',
            data: updated
        });
    } catch (error) {
        console.error('Error deleting sub-task:', error);
        return res.status(500).json({
            ok: false,
            message: 'Failed to delete sub-task'
        });
    }
};


// PATCH /tasks/:mainTaskId
export const updateMainTask = async (req: Request, res: Response): Promise<any> => {
    const { mainTaskId } = req.params;
    const {
        title,
        description,
        due,
        priority,
        department,
        projectId,
        dependentTaskId
    } = req.body;

    try {
        const updated = await StaffMainTaskModel.findByIdAndUpdate(
            mainTaskId,
            {
                $set: {
                    ...(title && { title }),
                    ...(description && { description }),
                    ...(due && { due }),
                    ...(priority && { priority }),
                    ...(department && { department }),
                    ...(projectId && { projectId }),
                    ...(dependentTaskId && { dependentTaskId })
                }
            },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({
                ok: false,
                message: 'Main task not found'
            });
        }

        return res.status(200).json({
            ok: true,
            message: 'Main task updated successfully',
            data: updated
        });
    } catch (err) {
        console.error('Error updating main task:', err);
        return res.status(500).json({
            ok: false,
            message: 'Failed to update main task'
        });
    }
};



// DELETE /tasks/:mainTaskId
export const deleteMainTask = async (req: Request, res: Response): Promise<any> => {
    const { mainTaskId } = req.params;

    try {
        const deleted = await StaffMainTaskModel.findByIdAndDelete(mainTaskId);

        if (!deleted) {
            return res.status(404).json({
                ok: false,
                message: 'Main task not found'
            });
        }

        return res.status(200).json({
            ok: true,
            message: 'Main task deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting main task:', err);
        return res.status(500).json({
            ok: false,
            message: 'Failed to delete main task'
        });
    }
};


// PATCH /tasks/:mainTaskId/subtasks/:subTaskId/history
export const updateTaskHistory = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { mainTaskId, subTaskId } = req.params;
        const { status , task} = req.body;
        const user = req.user;

        if (!status || !VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                ok: false,
                message: 'Invalid or missing status value (queued, in_progress, paused, done)'
            });
        }

        if (!user || !user._id || !user.role) {
            return res.status(401).json({
                ok: false,
                message: 'Unauthorized. User info missing.'
            });
        }

        // Check if main task and sub-task exist
        const taskExists = await StaffMainTaskModel.findOne({
            _id: mainTaskId,
            'tasks._id': subTaskId
        });

        if (!taskExists) {
            return res.status(404).json({
                ok: false,
                message: 'Main task or sub-task not found'
            });
        }

        // Push new history item to history array
        const updated = await StaffMainTaskModel.findByIdAndUpdate(
            mainTaskId,
            {
                $push: {
                    history: {
                        subTask:task,
                        status,
                        changedAt: new Date(),
                        changedBy: user._id,
                        userModel: mapRoleToModel(user.role)
                    }
                }
            },
            { new: true }
        );

        return res.status(200).json({
            ok: true,
            message: 'Task history updated successfully',
            data: updated
        });
    } catch (error) {
        console.error('Error updating task history:', error);
        return res.status(500).json({
            ok: false,
            message: 'Internal server error'
        });
    }
};
