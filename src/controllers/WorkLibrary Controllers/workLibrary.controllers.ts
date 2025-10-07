import { Types } from "mongoose";
import { RoleBasedRequest } from "../../types/types";
import { Request, Response } from "express";
import { ISubtask, WorkLibraryModel } from "../../models/Staff Task Models/Library of works/libraryOfWorks.model";



const isValidObjectId = (id: any) => Types.ObjectId.isValid(id);

export const createWorkLibrary = async (req: Request, res: Response): Promise<any> => {
    const { workName, organizationId, description, tags, tasks } = req.body;

    try {
        // ✅ Basic validation
        if (!workName || !organizationId) {
            return res.status(400).json({
                ok: false,
                message: 'workName and organizationId are required'
            });
        }

        // ✅ Validate tasks and subtasks structure (optional but good practice)
        const validTasks = Array.isArray(tasks)
            ? tasks.map(task => ({
                title: task.title,
                // description: task.description || null,
                // category: task.category || null,
                estimatedTimeInMinutes: task.estimatedTimeInMinutes || null,
                subtasks: Array.isArray(task.subtasks)
                    ? task.subtasks.map((subtask: ISubtask) => ({
                        title: subtask.title,
                    }))
                    : []
            }))
            : [];

        // ✅ Create WorkLibrary with nested tasks and subtasks
        const newLibrary = new WorkLibraryModel({
            organizationId,
            workName,
            description: description || null,
            tags: tags || [],
            tasks: validTasks
        });

        const saved = await newLibrary.save();

        return res.status(201).json({
            ok: true,
            message: 'Work library created successfully',
            data: saved
        });
    } catch (error) {
        console.error('Error creating WorkLibrary:', error);
        return res.status(500).json({
            ok: false,
            message: 'Failed to create WorkLibrary'
        });
    }
};




// export const updateWorkLibrary = async (req: Request, res: Response): Promise<any> => {
//     const { id } = req.params;
//     const { workName, description, tags } = req.body;

//     try {
//         const updated = await WorkLibraryModel.findByIdAndUpdate(
//             id,
//             { $set: { workName, description, tags } },
//             { new: true }
//         );

//         if (!updated) {
//             return res.status(404).json({
//                 ok: false,
//                 message: 'WorkLibrary not found'
//             });
//         }

//         return res.status(200).json({
//             ok: true,
//             message: 'WorkLibrary updated successfully',
//             data: updated
//         });
//     } catch (error) {
//         console.error('Error updating WorkLibrary:', error);
//         return res.status(500).json({
//             ok: false,
//             message: 'Failed to update WorkLibrary'
//         });
//     }
// };



export const updateWorkLibrary = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const {
        workName,
        description,
        tags,
        addTasks = [],
        deleteTaskIds = [],
        updateTasks = [],
        addSubtasks = [],
        deleteSubtaskIds = [],
        updateSubtasks = []
    } = req.body;

    try {
        const workLibrary = await WorkLibraryModel.findById(id);
        if (!workLibrary) {
            return res.status(404).json({
                ok: false,
                message: 'WorkLibrary not found'
            });
        }

        /** -------------------- ✅ Update WorkLibrary General Info -------------------- **/
        if (workName !== undefined) workLibrary.workName = workName;
        if (description !== undefined) workLibrary.description = description;
        if (tags !== undefined) workLibrary.tags = tags;

        /** -------------------- ✅ Delete Tasks -------------------- **/
        if (Array.isArray(deleteTaskIds) && deleteTaskIds.length) {
            workLibrary.tasks = workLibrary.tasks.filter(
                task => !deleteTaskIds.includes((task as any)._id.toString())
            );
        }

        /** -------------------- ✅ Add New Tasks -------------------- **/
        if (Array.isArray(addTasks) && addTasks.length) {
            addTasks.forEach(task => {
                workLibrary.tasks.push({
                    title: task.title,
                    // description: task.description || null,
                    // category: task.category || null,
                    subtasks: Array.isArray(task.subtasks)
                        ? task.subtasks.map((st: ISubtask) => ({
                            title: st.title,
                            // description: st.description || null,
                            // estimatedTimeInMinutes: st.estimatedTimeInMinutes || null
                        }))
                        : []
                });
            });
        }

        /** -------------------- ✅ Update Tasks -------------------- **/
        if (Array.isArray(updateTasks)) {
            updateTasks.forEach(update => {
                const task = (workLibrary.tasks as any).id(update._id);
                if (task) {
                    if (update.title !== undefined) task.title = update.title;
                    if (update.description !== undefined) task.description = update.description;
                    if (update.category !== undefined) task.category = update.category;
                    // ✅ Fix: Include estimatedTimeInMinutes
                    if (update.estimatedTimeInMinutes !== undefined) {
                        task.estimatedTimeInMinutes = Number(update.estimatedTimeInMinutes);
                    }
                }
            });
        }

        /** -------------------- ✅ Delete Subtasks -------------------- **/
        if (Array.isArray(deleteSubtaskIds)) {
            deleteSubtaskIds.forEach(({ taskId, subtaskId }) => {
                const task = (workLibrary.tasks as any).id(taskId);
                if (task) {
                    task.subtasks = task.subtasks.filter(
                        (st: ISubtask) => (st as any)._id.toString() !== subtaskId
                    );
                }
            });
        }

        /** -------------------- ✅ Add Subtasks to a Task -------------------- **/
        if (Array.isArray(addSubtasks)) {
            addSubtasks.forEach(({ taskId, subtasks }) => {
                const task = (workLibrary.tasks as any).id(taskId);
                if (task && Array.isArray(subtasks)) {
                    const newSubtasks = subtasks.map(st => ({
                        title: st.title,
                        description: st.description || null,
                        estimatedTimeInMinutes: st.estimatedTimeInMinutes || null
                    }));
                    task.subtasks.push(...newSubtasks);
                }
            });
        }

        /** -------------------- ✅ Update Subtasks -------------------- **/
        if (Array.isArray(updateSubtasks)) {
            updateSubtasks.forEach(({ taskId, subtaskId, title, description, estimatedTimeInMinutes }) => {
                const task = (workLibrary.tasks as any).id(taskId);
                if (task) {
                    const subtask = task.subtasks.id(subtaskId);
                    if (subtask) {
                        if (title !== undefined) subtask.title = title;
                        if (description !== undefined) subtask.description = description;
                        if (estimatedTimeInMinutes !== undefined)
                            subtask.estimatedTimeInMinutes = estimatedTimeInMinutes;
                    }
                }
            });
        }

        /** -------------------- ✅ Save the updated document -------------------- **/
        const saved = await workLibrary.save();

        return res.status(200).json({
            ok: true,
            message: 'WorkLibrary updated successfully',
            data: saved
        });
    } catch (error) {
        console.error('Error updating WorkLibrary:', error);
        return res.status(500).json({
            ok: false,
            message: 'Failed to update WorkLibrary'
        });
    }
};




export const deleteWorkLibrary = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;

    try {
        const deleted = await WorkLibraryModel.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({
                ok: false,
                message: 'WorkLibrary not found'
            });
        }

        return res.status(200).json({
            ok: true,
            message: 'WorkLibrary deleted successfully',
            data: deleted
        });
    } catch (error) {
        console.error('Error deleting WorkLibrary:', error);
        return res.status(500).json({
            ok: false,
            message: 'Failed to delete WorkLibrary'
        });
    }
};



export const getWorkLibrariesByOrgId = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    const { orgId } = req.params;

    if (!orgId || !isValidObjectId(orgId)) {
        return res.status(400).json({
            ok: false,
            message: 'Invalid organizationId'
        });
    }

    try {
        const works = await WorkLibraryModel.find({ organizationId: orgId });

        return res.status(200).json({
            ok: true,
            message: 'WorkLibraries retrieved successfully',
            data: works
        });
    } catch (error) {
        console.error('Error fetching WorkLibraries by organizationId:', error);
        return res.status(500).json({
            ok: false,
            message: 'Failed to fetch WorkLibraries'
        });
    }
};



export const getWorkLibraryById = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;

    try {
        const work = await WorkLibraryModel.findById(id);

        if (!work) {
            return res.status(404).json({
                ok: false,
                message: 'WorkLibrary not found'
            });
        }

        return res.status(200).json({
            ok: true,
            message: 'WorkLibrary retrieved successfully',
            data: work
        });
    } catch (error) {
        console.error('Error fetching WorkLibrary:', error);
        return res.status(500).json({
            ok: false,
            message: 'Failed to fetch WorkLibrary'
        });
    }
};