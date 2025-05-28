import { Response } from "express";
import { AuthenticatedUserRequest } from "../../types/types";
import { TaskListModel } from "../../models/tasklist.model";
import redisClient from "../../config/redisClient";

const createTaskList = async (req: AuthenticatedUserRequest, res: Response) => {
    try {
        let { projectId } = req.params

        let { title, tasks } = req.body

        if (!projectId || !title) {
            return res.status(400).json({ message: "Project Id and Task List title is required", ok: false });
        }

        const TaskList = await TaskListModel.create({
            projectId,
            title,
            tasks: tasks || []
        })

        res.status(201).json({ message: "task list created", data: TaskList, ok: true })
    }
    catch (error) {
        console.error("Error updating task:", error);
        return res.status(500).json({ message: "Server error", ok: false });

    }
}


const getTaskList = async (req: AuthenticatedUserRequest, res: Response) => {
    try {

        let user = req.user
        let { projectId } = req.params

        const cacheKey = `taskslist:${user._id}`;


        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            return res.status(200).json({ message: "tasks retrieved from cache", data: parsedData, ok: true });
        }

        const tasksLists = await TaskListModel.findOne({ projectId })

        await redisClient.set(cacheKey, JSON.stringify(tasksLists), { EX: 300 }); // expires in 5 mins (put in secondsj)

        res.status(200).json({ message: "tasksList retrived successfully", data: tasksLists, ok: true });
    }
    catch (error) {
        console.log("error form getTasklists", error)
        return res.status(500).json({ message: 'Server error. Please try again later.', errorMessage: error, error: true, ok: false });
    }
}

export {
    createTaskList,
    getTaskList
}