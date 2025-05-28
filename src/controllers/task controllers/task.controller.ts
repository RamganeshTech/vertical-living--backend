import { Response } from "express";
import { AuthenticatedUserRequest } from "../../types/types";
import TaskModel, { ITask, TaskInformation } from "../../models/task.model";
import { isObjectHasValue } from "../../utils/isObjectHasValue";
import ProjectModel from "../../models/project.model";
import { TaskListModel } from "../../models/tasklist.model";

const createTask = async (req: AuthenticatedUserRequest, res: Response) => {
  try {
    const user = req.user
    let { taskListId, projectId } = req.params

    const {
      taskName,
      taskInformation,
      status,
      description,
      comments,
      document
    } = req.body;

    if (!taskName || !projectId) {
      return res.status(400).json({ message: "Task name and projectId are required", ok: false });
    }

    // Use provided taskListId or default to "General"
    let finalTaskListId: any = taskListId;

    if (!finalTaskListId) {
      // Check if a "General" task list exists for the project
      let generalList = await TaskListModel.findOne({ projectId, title: "General" });

      if (!generalList) {
        // Create a new "General" task list
        generalList = await TaskListModel.create({
          title: "General",
          projectId,
          tasks: []
        });
      }

      finalTaskListId = generalList._id;
    }

    // Sanitize optional fields
    const sanitizedTaskInfo: Partial<typeof taskInformation> = {};
    for (const key in taskInformation) {
      if (taskInformation[key]) {
        sanitizedTaskInfo[key] = taskInformation[key];
      }
    }

    // Create the Task
    const newTask = await TaskModel.create({
      taskName,
      description: typeof description === "string" ? description : null,
      status: typeof status === "string" ? status : null,
      document: typeof document === "object" ? document : null,
      taskInformation: {
        ...sanitizedTaskInfo,
        owner: user.username,
      },
      comments: typeof comments === "object" && isObjectHasValue(comments) ? [comments] : [],
      taskList: finalTaskListId
    });

    // Add task to the TaskList
    await TaskListModel.findByIdAndUpdate(finalTaskListId, {
      $push: { tasks: newTask._id }
    });


    res.status(201).json({ message: "task created", data: newTask, ok: true })
  }
  catch (error) {
    console.log("error form createTask", error)
    return res.status(500).json({ message: 'Server error. Please try again later.', error: true, ok: false });
  }
}


const updateTask = async (req: AuthenticatedUserRequest, res: Response) => {
  try {
    const { taskId, taskListId, projectId } = req.params;

    const {
      taskName,
      description,
      status,
      comments,          // single comment object to append
      taskInformation,   // partial updates for nested object
      document
    } = req.body;

    if (!taskId || !taskListId || !projectId) {
      return res.status(400).json({ message: "Task ID, taskList Id , project Id is required", ok: false });
    }

    // Build the update object
    const updateData: any = {};

    if (typeof taskName === "string") updateData.taskName = taskName;
    if (typeof description === "string") updateData.description = description;
    if (typeof status === "string") updateData.status = status;
    if (document && typeof document === "object") updateData.document = document;

    if (taskInformation && typeof taskInformation === "object") {
      // Use $set with dot notation to update nested fields individually
      for (const key in taskInformation) {
        if (taskInformation.hasOwnProperty(key)) {
          updateData[`taskInformation.${key}`] = taskInformation[key];
        }
      }
    }



    // Find the task first
    const task = await TaskModel.findById({ taskId });
    if (!task) {
      return res.status(404).json({ message: "Task not found", ok: false });
    }

    // const project = await ProjectModel.findById(projectId);
    // if (!project) {
    //   return res.status(404).json({ message: "Associated project not found", ok: false });
    // }

    // // Optional: validate taskList too
    // const taskList = await TaskListModel.findById(taskListId);
    // if (!taskList) {
    //   return res.status(404).json({ message: "Associated task list not found", ok: false });
    // }


     const [taskList, project] = await Promise.all([
      TaskListModel.findById(taskListId).select("tasks projectId").lean(),
      ProjectModel.findById(projectId).select("taskLists").lean(),
    ]);

    if (!taskList || !project) {
      return res.status(404).json({ message: "Associated TaskList or Project not found", ok: false });
    }

    // Append comment if valid
    if (comments && isObjectHasValue(comments)) {
      task.comments.push(comments);
    }

    // Update other fields
    for (const key in updateData) {
      task.set(key, updateData[key]);
    }

    await task.save();

    res.status(200).json({ message: "Task updated successfully", data: task, ok: true });

  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({ message: "Server error", ok: false });
  }
};

export {
  createTask,
  updateTask
}