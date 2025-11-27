import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { RoleBasedRequest } from '../../types/types';
import StaffMainTaskModel, { IStaffTask, IStaffTaskFile, ISTaskSchema } from '../../models/Staff Task Models/staffTask.model';
// import { getEmbedding } from '../utils/embedder';
// import {  } from '../utils/cosine';
import { getEmbedding } from '../../utils/embedder/embedder';
import { cosineSimilarity } from '../../utils/embedder/cosine';
import TaskTemplateModel from '../../models/Staff Task Models/TaskTemplate Model/taskTemplate.model';
import { CACHE_TTL, deleteCachedData, generateFilterHash, getCachedData, getCacheKey, invalidateTrackedKeys, setCachedData, trackCacheKey } from './staffTaskRedisUtil';
import { createNotification } from '../Notification Controller/notification.service';
import { NotificationType, UserModelType } from '../Notification Controller/notification.controller';
import redisClient from '../../config/redisClient';

const ALLOWED_MODELS = ["UserModel", "StaffModel", "CTOModel", "WorkerModel"];
const VALID_STATUSES = ['queued', 'in_progress', 'paused', 'done', "start"];




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


export const suggestSubtasks = async (req: Request, res: Response): Promise<any> => {
    try {
        const { title } = req.query;

        if (!title || typeof title !== 'string' || title.length < 3) {
            return res.status(400).json({ ok: false, message: 'Valid task title is required' });
        }


        // Check cache first
        const cacheKey = getCacheKey.taskSuggestion(title);
        const cached = await getCachedData<{ matched: boolean; steps: string[] }>(cacheKey);

        if (cached) {
            return res.status(200).json({
                ok: true,
                cached: true,
                ...cached
            });
        }

        const inputEmbedding = await getEmbedding(title);
        const templates = await TaskTemplateModel.find(); // Optional: add limit

        let bestMatch = null;
        let bestScore = 0;

        for (const template of templates) {
            const matchScore = cosineSimilarity(inputEmbedding, template.embedding);
            if (matchScore > bestScore) {
                bestScore = matchScore;
                bestMatch = template;
            }
        }

        // if (bestScore >= 0.85 && bestMatch) {
        //     return res.status(200).json({
        //         ok: true,
        //         matched: true,
        //         steps: bestMatch.steps
        //     });
        // }

        //  res.status(200).json({ ok: true, matched: false, steps: [] });

        const result = bestScore >= 0.85 && bestMatch
            ? { matched: true, steps: bestMatch.steps }
            : { matched: false, steps: [] };

        // Cache the result
        await setCachedData(cacheKey, result, CACHE_TTL.SUGGESTION);

        return res.status(200).json({ ok: true, ...result });

    } catch (err) {
        console.error('Error in suggestSubtasks:', err);
        return res.status(500).json({ ok: false, message: 'Internal server error' });
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
            overdue,
            createdAt,
            dependecies
        } = req.query;

        const { organizationId } = req.params

        const query: any = {};
        if (organizationId) query.organizationId = new Types.ObjectId(organizationId)
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (assigneeId) query.assigneeId = new Types.ObjectId(assigneeId as string);
        if (projectId) query.projectId = new Types.ObjectId(projectId as string);
        if (department) query.department = department;
        if (dependecies === 'true') {
            query.dependentTaskId = { $exists: true, $ne: [] };
        }

        if (overdue === 'true') {
            query.due = { $lt: new Date() }; // due < now
        }

        if (createdAt) {
            const date = new Date(createdAt as string);

            // Create a range for that day: start -> end
            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            const endOfDay = new Date(date.setHours(23, 59, 59, 999));

            query.due = { $gte: startOfDay, $lte: endOfDay };
        }


        console.log("query", query)

        // Generate cache key with filters
        const filterHash = generateFilterHash(req.query);
        const cacheKey = getCacheKey.taskList(organizationId, filterHash);

        // Check cache
        const cached = await getCachedData<IStaffTask[]>(cacheKey);
        if (cached) {
            return res.status(200).json({
                ok: true,
                message: 'Tasks fetched from cache',
                cached: true,
                data: cached
            });
        }

        const tasks = await StaffMainTaskModel.find(query).populate("assigneeId");

        let finalTasks = tasks;

        if (dependecies === 'true') {
            finalTasks = tasks.filter(task => {
                return (
                    task?.dependentTaskId && Array.isArray(task?.dependentTaskId) &&
                    task?.dependentTaskId.length > 0 &&
                    task.status !== 'done'
                );
            });
        }


        // Cache the result and track it
        await setCachedData(cacheKey, finalTasks, CACHE_TTL.TASK_LIST);
        await trackCacheKey(getCacheKey.taskTrackingSet(organizationId), cacheKey);


        return res.status(200).json({
            ok: true,
            message: 'Tasks fetched successfully',
            data: finalTasks
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

        // Check cache
        const cacheKey = getCacheKey.task(id);
        const cached = await getCachedData<IStaffTask>(cacheKey);

        if (cached) {
            return res.status(200).json({
                ok: true,
                message: 'Task fetched from cache',
                cached: true,
                data: cached
            });
        }


        const task = await StaffMainTaskModel.findById(id)
            .populate("assigneeId", "_id staffName email")     // populate staff fields
            .populate("projectId", "_id projectName")        // populate project fields
            .populate({
                path: "dependentTaskId",
                select: "_id title assigneeId due status",
                populate: {
                    path: "assigneeId",
                    model: "StaffModel",
                    select: "_id staffName",  // fields you want from staff
                },
            })

        if (!task) {
            return res.status(404).json({
                ok: false,
                message: 'Task not found'
            });
        }

        await setCachedData(cacheKey, task.toObject(), CACHE_TTL.TASK_SINGLE);

        return res.status(200).json({
            ok: true,
            message: 'Task fetched successfully',
            data: task
        });


        // return res.status(200).json({
        //     ok: true,
        //     message: 'Tasks fetched successfully',
        //     data: task || null
        // });


    } catch (error) {
        console.error('Error fetching tasks:', error);
        return res.status(500).json({
            ok: false,
            message: 'Failed to fetch tasks'
        });
    }
};



export const getAssociatedStaffsTask = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        let user = req.user
        const { organizationId } = req.params

        const {
            status,
            priority,
            projectId,
            department,
            overdue,
            createdAt,
            dependecies
        } = req.query;

        if (!user?._id) {
            return res.status(400).json({ message: "staff Id not available", ok: false })
        }


        const query: any = {};
        if (organizationId) query.organizationId = new Types.ObjectId(organizationId)
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (user?._id) query.assigneeId = new Types.ObjectId(user?._id as string);
        if (projectId) query.projectId = new Types.ObjectId(projectId as string);
        if (department) query.department = department;
        // ✅ Filter by "active dependencies" if ?dependencies=true
        if (dependecies === 'true') {
            query.dependentTaskId = { $exists: true, $ne: [] };
        }
        if (overdue === 'true') {
            query.due = { $lt: new Date() }; // due < now
        }


        if (createdAt) {
            const date = new Date(createdAt as string);

            // Create a range for that day: start -> end
            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            const endOfDay = new Date(date.setHours(23, 59, 59, 999));

            query.due = { $gte: startOfDay, $lte: endOfDay };
        }


        // Generate cache key
        const filterHash = generateFilterHash(req.query);
        const cacheKey = getCacheKey.staffTasks(user._id.toString(), organizationId, filterHash);

        // Check cache
        const cached = await getCachedData<IStaffTask[]>(cacheKey);
        if (cached) {
            return res.status(200).json({
                ok: true,
                message: 'Tasks fetched from cache',
                cached: true,
                data: cached
            });
        }

        const tasks = await StaffMainTaskModel.find(query).populate("assigneeId");

        let finalTasks = tasks;

        if (dependecies === 'true') {
            finalTasks = tasks.filter(task => {
                return (
                    task?.dependentTaskId && Array.isArray(task?.dependentTaskId) &&
                    task?.dependentTaskId.length > 0 &&
                    task.status !== 'done'
                );
            });
        }

        // Cache and track
        await setCachedData(cacheKey, finalTasks, CACHE_TTL.TASK_LIST);
        await trackCacheKey(
            getCacheKey.staffTaskTrackingSet(user._id.toString(), organizationId),
            cacheKey
        );


        return res.status(200).json({
            ok: true,
            message: 'Tasks fetched successfully',
            data: finalTasks || null
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return res.status(500).json({
            ok: false,
            message: 'Failed to fetch tasks'
        });
    }
};



export const getOtherStaffPendingTasks = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const {
            // status,
            priority,
            // assigneeId,
            projectId,
            department,
            overdue,
            createdAt,
            dependecies
        } = req.query;

        const { organizationId } = req.params


        const query: any = {};
        query.assigneeId = { $ne: new Types.ObjectId(req.user?._id as string) }
        if (organizationId) query.organizationId = new Types.ObjectId(organizationId)
        // if (status) query.status = status;
        if (priority) query.priority = priority;
        if (projectId) query.projectId = new Types.ObjectId(projectId as string);
        if (department) query.department = department;

        query.status = { $ne: "done" }

        if (dependecies === 'true') {
            query.dependentTaskId = { $exists: true, $ne: [] };
        }

        if (overdue === 'true') {
            query.due = { $lt: new Date() }; // due < now
        }

        if (createdAt) {
            const date = new Date(createdAt as string);

            // Create a range for that day: start -> end
            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            const endOfDay = new Date(date.setHours(23, 59, 59, 999));

            query.due = { $gte: startOfDay, $lte: endOfDay };
        }



        // Generate cache key with filters
        const filterHash = generateFilterHash(req.query);
        const cacheKey = getCacheKey.otherStaffTasks(
            req.user?._id as string,
            organizationId,
            filterHash
        );

        // Check cache
        const cached = await getCachedData<IStaffTask[]>(cacheKey);
        if (cached) {
            return res.status(200).json({
                ok: true,
                message: 'pending Tasks fetched from cache',
                cached: true,
                data: cached
            });
        }

        const tasks = await StaffMainTaskModel.find(query).populate("assigneeId");

        let finalTasks = tasks;

        if (dependecies === 'true') {
            finalTasks = tasks.filter(task => {
                return (
                    task?.dependentTaskId && Array.isArray(task?.dependentTaskId) &&
                    task?.dependentTaskId.length > 0 &&
                    task.status !== 'done'
                );
            });
        }


        // Cache the result and track it
        await setCachedData(cacheKey, finalTasks, CACHE_TTL.TASK_LIST);
        await trackCacheKey(getCacheKey.taskTrackingSet(organizationId), cacheKey);


        return res.status(200).json({
            ok: true,
            message: 'Pending Tasks fetched successfully',
            data: finalTasks
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
        let {
            tasks,
            assigneRole
        }: {
            tasks: Array<Partial<IStaffTask> & { tasks: { taskName: string }[] }>;
            assigneRole: string;
        } = req.body;


        // ✅ Parse tasks if it's a JSON string (which it will be when using FormData)
        if (typeof tasks === "string") {
            try {
                tasks = JSON.parse(tasks);
            } catch (e) {
                return res.status(400).json({ ok: false, message: "Invalid tasks JSON format" });
            }
        }


        const user = req.user;

        if (!user || !user?._id) {
            return res.status(401).json({ ok: false, message: 'Unauthorized request (user not found)' });
        }

        if (!tasks || !Array.isArray(tasks) || tasks?.length === 0) {
            return res.status(400).json({ ok: false, message: 'No tasks provided for creation' });
        }

        // Get appropriate model names based on roles
        let assigneeModel = mapRoleToModel(assigneRole);
        let assignedByModel = mapRoleToModel(user.role); // From backend - don't rely on frontend

        const assignedById = user._id;

        if (!ALLOWED_MODELS.includes(assigneeModel) || !ALLOWED_MODELS.includes(assignedByModel)) {
            return res.status(400).json({ ok: false, message: 'Invalid model mapping for assignee or assigner' });
        }

        const files = req.files as (Express.Multer.File & { location: string })[];

        const mappedFiles: IStaffTaskFile[] = files.map(file => {
            const type: "image" | "pdf" = file.mimetype.startsWith("image") ? "image" : "pdf";
            return {
                type,
                url: file.location,
                originalName: file.originalname,
                uploadedAt: new Date()
            };
        });


        const newTasks: IStaffTask[] = [];
        const organizationsToInvalidate = new Set<string>();
        const assigneesToInvalidate = new Set<string>();


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
            // if (!title) {
            //     return res.status(400).json({
            //         ok: false,
            //         message: 'Task title is required',
            //     });
            // }

            // 👇 Filter out empty images for safety
            const hasImages = (mappedFiles && mappedFiles.length > 0);
            const hasTitle = !!(title && title.trim().length > 0);

            // ✅ Validation: must have at least one of title or image
            if (!hasTitle && !hasImages) {
                console.warn(`⚠️ Skipped task - missing both title and image`);
                continue; // skip creating this empty task
            }


            const newTask = new StaffMainTaskModel({
                images: mappedFiles || [],
                title: title?.trim() || "",
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
                dependentTaskId: dependentTaskId ? (Array.isArray(dependentTaskId) ? Array.from(dependentTaskId) : dependentTaskId) : null,
                history: []
            });

            newTasks.push(newTask);

            // Track which caches need invalidation
            if (organizationId) {
                organizationsToInvalidate.add(organizationId.toString());
            }
            if (assigneeId) {
                assigneesToInvalidate.add(assigneeId.toString());
            }

            const existingTemplate = await TaskTemplateModel.findOne({ taskText: title });

            const validSubTasks = Array.isArray(subTasks)
                ? subTasks.map((s: ISTaskSchema) => s.taskName?.trim()).filter(Boolean)
                : [];

            if (!existingTemplate && validSubTasks?.length > 0 && title?.trim()) {
                const embedding = await getEmbedding(title);
                const plainEmbedding = Array.from(embedding);

                await TaskTemplateModel.create({
                    taskText: title,
                    steps: validSubTasks,
                    embedding: plainEmbedding
                });

                console.log(`✅ Template stored for task: "${title}"`);
            } else {
                console.log(`⚠️ Template not stored for "${title}" — No valid steps.`);
            }
        }

        if (newTasks.length === 0) {
            return res.status(400).json({
                ok: false,
                message: "No valid tasks to create. Each task must have either a title or at least one image.",
            });
        }


        // Insert all at once
        const savedTasks = await StaffMainTaskModel.insertMany(newTasks);


        // ✅ INVALIDATE ALL RELATED CACHES
        const invalidationPromises: Promise<void>[] = [];

        // Invalidate organization task lists
        for (const orgId of organizationsToInvalidate) {
            invalidationPromises.push(
                invalidateTrackedKeys(getCacheKey.taskTrackingSet(orgId))
            );
        }

        // Invalidate staff-specific task lists
        for (const staffId of assigneesToInvalidate) {
            for (const orgId of organizationsToInvalidate) {
                invalidationPromises.push(
                    invalidateTrackedKeys(getCacheKey.staffTaskTrackingSet(staffId, orgId))
                );

                // ✅ Also invalidate "other staff" views
                invalidationPromises.push(
                    invalidateTrackedKeys(getCacheKey.otherStaffTaskTrackingSet(orgId))
                )

            }
        }

        await Promise.all(invalidationPromises);


        res.status(201).json({
            ok: true,
            message: `${savedTasks.length} task(s) created successfully.`,
            data: savedTasks
        });



        // ✅ CREATE NOTIFICATIONS IN BACKGROUND (After response)
        // Group tasks by assigneeId to avoid duplicate notifications
        const tasksByAssignee = new Map<string, IStaffTask[]>();

        savedTasks.forEach(task => {
            if (task.assigneeId) {
                const assigneeIdStr = task.assigneeId.toString();
                if (!tasksByAssignee.has(assigneeIdStr)) {
                    tasksByAssignee.set(assigneeIdStr, []);
                }
                tasksByAssignee.get(assigneeIdStr)!.push(task);
            }
        });

        // Send notification to each assignee
        const notificationPromises: Promise<any>[] = [];

        for (const [assigneeId, assignedTasks] of tasksByAssignee) {
            const taskCount = assignedTasks.length;
            const firstTask = assignedTasks[0];

            const message = taskCount === 1
                ? `You have been assigned a new task: "${firstTask.title}".`
                : `You have been assigned ${taskCount} new tasks.`;

            notificationPromises.push(
                createNotification({
                    organizationId: firstTask.organizationId?.toString(),
                    userId: assigneeId,
                    userModel: assigneeModel as UserModelType,
                    message,
                    type: NotificationType.ASSIGNMENT,
                    navigation: {
                        // url: taskCount === 1 
                        //     ? `/staff-tasks/${firstTask._id}` 
                        //     : `/staff-tasks`,
                        url: `organizations/${firstTask.organizationId}/projects/associatedstafftask`,
                        label: taskCount === 1 ? 'View Task' : 'View Tasks',
                    },
                    projectId: firstTask.projectId?.toString(),
                }).catch(err => {
                    console.error(`❌ Failed to create notification for ${assigneeId}:`, err);
                })
            );
        }

        // Wait for all notifications to be created
        await Promise.all(notificationPromises);
        // console.log(`✅ Notifications sent to ${tasksByAssignee.size} assignee(s)`);

    } catch (error) {
        console.error('Error in createStaffTask:', error);
        return res.status(500).json({ ok: false, message: 'Internal server error' });
    }
};

export const createStaffTaskFromWork = async (
    req: RoleBasedRequest,
    res: Response
): Promise<any> => {
    try {
        let {
            tasks,
            assigneRole
        }: {
            tasks: Array<Partial<IStaffTask> & { tasks: { taskName: string }[] }>;
            assigneRole: string;
        } = req.body;

        if (typeof tasks === "string") {
            try {
                tasks = JSON.parse(tasks);
            } catch (e) {
                return res.status(400).json({ ok: false, message: "Invalid tasks JSON format" });
            }
        }

        const user = req.user;

        if (!user || !user?.role || !user?._id) {
            return res.status(401).json({ ok: false, message: "Unauthorized request (user not found)" });
        }

        if (!tasks || !Array.isArray(tasks) || tasks?.length === 0) {
            return res.status(400).json({ ok: false, message: "No tasks provided for creation" });
        }

        // Validate roles ⇒ get model mappings
        const assigneeModel = mapRoleToModel(assigneRole);
        const assignedByModel = mapRoleToModel(user.role);
        const assignedById = user._id;

        if (!ALLOWED_MODELS.includes(assigneeModel) || !ALLOWED_MODELS.includes(assignedByModel)) {
            return res.status(400).json({ ok: false, message: "Invalid role model mapping" });
        }

        const files = req.files as (Express.Multer.File & { location: string })[];

        const mappedFiles: IStaffTaskFile[] = files.map(file => {
            const type: "image" | "pdf" = file.mimetype.startsWith("image") ? "image" : "pdf";
            return {
                type,
                url: file.location,
                originalName: file.originalname,
                uploadedAt: new Date()
            };
        });

        const savedTasks: IStaffTask[] = [];
        const organizationsToInvalidate = new Set<string>();
        const assigneesToInvalidate = new Set<string>();

        let previousTaskId: Types.ObjectId | null = null;

        // ✅ STEP 1: Get last known due time once
        const firstTask = tasks[0];
        const { assigneeId, organizationId } = firstTask;

        const redisStaffTaskLastDue = `staff:task:lastDue:${assigneeId}:${organizationId}`;
        let lastDue: Date | null = null;

        const cachedLastDue = await redisClient.get(redisStaffTaskLastDue);
        if (cachedLastDue) {
            lastDue = new Date(cachedLastDue);
        } else {
            // fallback from DB only once
            const lastTask = await StaffMainTaskModel.findOne(
                { assigneeId, organizationId },
                { due: 1 },
                { sort: { due: -1 } }
            ).lean();

            lastDue = lastTask?.due ? new Date(lastTask.due) : new Date();
        }


        // ✅ STEP 2: Loop through tasks and calculate new due dates manually
        for (const taskData of tasks) {
            const {
                title,
                description,
                due,
                status = "queued",
                priority = "medium",
                projectId,
                organizationId,
                assigneeId,
                department,
                tasks: subTasks = []
            } = taskData;


            // Convert estimatedTime (due) → actual Date
            const estimatedMinutes = Number(due || 0);

            // Add minutes to lastDue manually without external libs
            const nextDue: Date = new Date(lastDue!.getTime() + estimatedMinutes * 60 * 1000);

            // Update lastDue for next task
            lastDue = nextDue;

            const newTask: any = new StaffMainTaskModel({
                images: mappedFiles || [],
                title: title?.trim() || "",
                description,
                due: nextDue,
                status,
                priority,
                department,
                projectId: projectId || null,
                organizationId,
                assigneeId: assigneeId || null,
                assigneModel: assigneeModel,
                assignedById,
                assignedByModel,
                tasks: subTasks?.filter((st) => st?.taskName)?.map(st => ({
                    taskName: st.taskName?.trim(),
                    comments: null
                })) || [],
                dependentTaskId: previousTaskId ? [previousTaskId] : null, // 👈 key point
                history: []
            });

            const savedTask = await newTask.save(); // ⏳ Save immediately to get _id

            savedTasks.push(savedTask); // Push to response list
            previousTaskId = savedTask._id; // ☑️ Chain to next task

            // Track caches to invalidate
            if (organizationId) {
                organizationsToInvalidate.add(organizationId.toString());
            }
            if (assigneeId) {
                assigneesToInvalidate.add(assigneeId.toString());
            }


            // Optionally, generate a template
            // const existingTemplate = await TaskTemplateModel.findOne({ taskText: title });
            // const validSubTasks = subTasks?.map(sub => sub.taskName?.trim()).filter(Boolean) || [];

            // if (!existingTemplate && validSubTasks?.length > 0 && title?.trim()) {
            //     const embedding = await getEmbedding(title);
            //     await TaskTemplateModel.create({
            //         taskText: title,
            //         steps: validSubTasks,
            //         embedding: Array.from(embedding)
            //     });

            //     console.log(`✅ Created template for "${title}"`);
            // }
        }

        // ✅ STEP 3: Store the latest due in Redis for next chaining
        if (lastDue) {
            await redisClient.set(redisStaffTaskLastDue, lastDue.toISOString());
        }



        // ✅ INVALIDATE ALL RELATED CACHES
        const invalidationPromises: Promise<void>[] = [];

        for (const orgId of organizationsToInvalidate) {
            invalidationPromises.push(
                invalidateTrackedKeys(getCacheKey.taskTrackingSet(orgId))
            );
        }

        for (const staffId of assigneesToInvalidate) {
            for (const orgId of organizationsToInvalidate) {
                invalidationPromises.push(
                    invalidateTrackedKeys(getCacheKey.staffTaskTrackingSet(staffId, orgId))
                );

                // ✅ Also invalidate "other staff" views
                invalidationPromises.push(
                    invalidateTrackedKeys(getCacheKey.otherStaffTaskTrackingSet(orgId))
                )

            }
        }

        await Promise.all(invalidationPromises);

        res.status(201).json({
            ok: true,
            message: `${savedTasks.length} chained task(s) created successfully.`,
            data: savedTasks
        });


        // ✅ CREATE NOTIFICATIONS IN BACKGROUND
        const tasksByAssignee = new Map<string, IStaffTask[]>();

        savedTasks.forEach(task => {
            if (task.assigneeId) {
                const assigneeIdStr = task.assigneeId.toString();
                if (!tasksByAssignee.has(assigneeIdStr)) {
                    tasksByAssignee.set(assigneeIdStr, []);
                }
                tasksByAssignee.get(assigneeIdStr)!.push(task);
            }
        });

        const notificationPromises: Promise<any>[] = [];

        for (const [assigneeId, assignedTasks] of tasksByAssignee) {
            const taskCount = assignedTasks.length;
            const firstTask = assignedTasks[0];

            // const message = taskCount === 1
            //     ? `You have been assigned a workflow task: "${firstTask.title}".`
            //     : `You have been assigned ${taskCount} dependent workflow tasks.`;

            const message = taskCount === 1
                ? `You have been assigned a new task: "${firstTask.title}".`
                : `You have been assigned ${taskCount} new tasks.`;

            notificationPromises.push(
                createNotification({
                    organizationId: firstTask.organizationId?.toString(),
                    userId: assigneeId,
                    userModel: assigneeModel as UserModelType,
                    message,
                    type: NotificationType.ASSIGNMENT,
                    navigation: {
                        // url: taskCount === 1 
                        //     ? `/staff-tasks/${firstTask._id}` 
                        //     : `/staff-tasks`,
                        // label: taskCount === 1 ? 'View Task' : 'View Workflow',
                        url: `organizations/${firstTask.organizationId}/projects/associatedstafftask`,
                        label: taskCount === 1 ? 'View Task' : 'View Tasks',
                    },
                    projectId: firstTask.projectId?.toString(),
                }).catch(err => {
                    console.error(`❌ Failed to create notification for ${assigneeId}:`, err);
                })
            );
        }

        await Promise.all(notificationPromises);
        console.log(`✅ Workflow notifications sent to ${tasksByAssignee.size} assignee(s)`);

    } catch (error) {
        console.error("❌ Error in createStaffTaskFromWork:", error);
        return res.status(500).json({ ok: false, message: "Internal Server Error" });
    }
};

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


        // ✅ INVALIDATE CACHES
        const invalidationPromises = [
            // Invalidate single task cache
            deleteCachedData(getCacheKey.task(mainTaskId)),

            // Invalidate organization task lists
            invalidateTrackedKeys(getCacheKey.taskTrackingSet(updated.organizationId.toString()))
        ];

        // Invalidate staff-specific caches if task is assigned
        if (updated.assigneeId) {
            invalidationPromises.push(
                invalidateTrackedKeys(
                    getCacheKey.staffTaskTrackingSet(
                        updated.assigneeId.toString(),
                        updated.organizationId.toString()
                    )
                )
            );
        }

        await Promise.all(invalidationPromises);

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


        // ✅ INVALIDATE CACHES
        const invalidationPromises = [
            deleteCachedData(getCacheKey.task(mainTaskId)),
            invalidateTrackedKeys(getCacheKey.taskTrackingSet(updated.organizationId.toString()))
        ];

        if (updated.assigneeId) {
            invalidationPromises.push(
                invalidateTrackedKeys(
                    getCacheKey.staffTaskTrackingSet(
                        updated.assigneeId.toString(),
                        updated.organizationId.toString()
                    )
                )
            );
        }

        await Promise.all(invalidationPromises);


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
    try {
        const { mainTaskId } = req.params;
        const {
            title,
            description,
            due,
            status,
            priority,
            department,
            projectId,
            assigneeId,
            dependentTaskId
        } = req.body;


        // Get the old task first to check if assigneeId changed
        const oldTask = await StaffMainTaskModel.findById(mainTaskId);

        if (!oldTask) {
            return res.status(404).json({
                ok: false,
                message: 'Main task not found'
            });
        }


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
                    ...(dependentTaskId && { dependentTaskId }),
                    ...(assigneeId && { assigneeId }),
                    ...(status && { status })

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


        // ✅ INVALIDATE CACHES
        const invalidationPromises = [
            // Invalidate single task cache
            deleteCachedData(getCacheKey.task(mainTaskId)),

            // Invalidate organization task lists
            invalidateTrackedKeys(getCacheKey.taskTrackingSet(updated.organizationId.toString()))
        ];

        // Invalidate old assignee's cache
        if (oldTask.assigneeId) {
            invalidationPromises.push(
                invalidateTrackedKeys(
                    getCacheKey.staffTaskTrackingSet(
                        oldTask.assigneeId.toString(),
                        updated.organizationId.toString()
                    )
                )
            );
        }

        // Invalidate new assignee's cache (if assigneeId changed)
        if (assigneeId && assigneeId.toString() !== oldTask.assigneeId?.toString()) {
            invalidationPromises.push(
                invalidateTrackedKeys(
                    getCacheKey.staffTaskTrackingSet(
                        assigneeId.toString(),
                        updated.organizationId.toString()
                    )
                )
            );
        }

        await Promise.all(invalidationPromises);

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


export const updateStaffTaskComments = async (req: Request, res: Response): Promise<any> => {
    try {
        const { mainTaskId, subTaskId } = req.params;
        const { comment } = req.body;

        if (!comment.trim() || typeof comment !== "string") {
            return res.status(400).json({
                ok: false,
                message: "Comment is required and must be a string."
            });
        }

        const task = await StaffMainTaskModel.findById(mainTaskId);

        if (!task) {
            return res.status(404).json({
                ok: false,
                message: "Main task not found."
            });
        }

        const subTask = (task.tasks as any).id(subTaskId);
        if (!subTask) {
            return res.status(404).json({
                ok: false,
                message: "Subtask not found."
            });
        }

        subTask.comments = comment;

        await task.save();


        // ✅ INVALIDATE CACHES
        const invalidationPromises = [
            // Invalidate single task cache
            deleteCachedData(getCacheKey.task(mainTaskId)),

            // Invalidate organization task lists
            invalidateTrackedKeys(getCacheKey.taskTrackingSet(task.organizationId.toString()))
        ];

        // Invalidate staff-specific caches if task is assigned
        if (task.assigneeId) {
            invalidationPromises.push(
                invalidateTrackedKeys(
                    getCacheKey.staffTaskTrackingSet(
                        task.assigneeId.toString(),
                        task.organizationId.toString()
                    )
                )
            );
        }

        await Promise.all(invalidationPromises);

        return res.status(200).json({
            ok: true,
            message: "Comment updated successfully.",
            data: subTask
        });

    } catch (error) {
        console.error("❌ Error updating subtask comment:", error);
        return res.status(500).json({
            ok: false,
            message: "Internal Server Error"
        });
    }
};
// DELETE /tasks/:mainTaskId
export const deleteMainTask = async (req: Request, res: Response): Promise<any> => {
    try {
        const { mainTaskId } = req.params;

        const deleted = await StaffMainTaskModel.findByIdAndDelete(mainTaskId);

        if (!deleted) {
            return res.status(404).json({
                ok: false,
                message: 'Main task not found'
            });
        }

        const staffId = deleted?.assigneeId && deleted?.assigneeId?.toString();


        // ✅ INVALIDATE CACHES
        const invalidationPromises = [
            // Delete single task cache
            deleteCachedData(getCacheKey.task(mainTaskId)),

            // Invalidate organization task lists
            invalidateTrackedKeys(getCacheKey.taskTrackingSet(deleted.organizationId.toString()))
        ];

        // Invalidate staff-specific caches if task was assigned
        if (deleted.assigneeId) {
            invalidationPromises.push(
                invalidateTrackedKeys(
                    getCacheKey.staffTaskTrackingSet(
                        deleted.assigneeId.toString(),
                        deleted.organizationId.toString()
                    )
                )
            );

            // “Other staff” views (so it disappears from others’ dashboards)
            invalidationPromises.push(
                invalidateTrackedKeys(getCacheKey.staffTaskTrackingSet(`otherstaff-${staffId}`, deleted?.organizationId?.toString()))
            );
        }

        await Promise.all(invalidationPromises);


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
        const { status, task } = req.body;
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
                        subTask: task,
                        status,
                        changedAt: new Date(),
                        changedBy: user._id,
                        userModel: mapRoleToModel(user.role)
                    }
                }
            },
            { new: true }
        );


        if (!updated) {
            return res.status(404).json({
                ok: false,
                message: 'Task not found'
            });
        }

        // ✅ INVALIDATE CACHES
        const invalidationPromises = [
            // Invalidate single task cache
            deleteCachedData(getCacheKey.task(mainTaskId)),

            // Invalidate organization task lists
            invalidateTrackedKeys(getCacheKey.taskTrackingSet(updated.organizationId.toString()))
        ];

        // Invalidate staff-specific caches if task is assigned
        if (updated.assigneeId) {
            invalidationPromises.push(
                invalidateTrackedKeys(
                    getCacheKey.staffTaskTrackingSet(
                        updated.assigneeId.toString(),
                        updated.organizationId.toString()
                    )
                )
            );
        }

        await Promise.all(invalidationPromises);

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
