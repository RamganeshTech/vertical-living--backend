import { Response } from "express";
import { AuthenticatedUserRequest } from "../types/types";
import TaskModel from "../models/task.model";

const editComment = async (req: AuthenticatedUserRequest, res: Response) => {
    try {
        let user = req.user
        let { commentId, taskId } = req.params

        const { comment } = req.body;


        let task = await TaskModel.findByIdAndUpdate(taskId)

        if (!task) {
            return res.status(404).json({ message: "task not found", ok: false })
        }

        const existingComment = task.comments.find((comm: any) => {
            return comm._id.toString() === commentId.toString();
        });

        if (existingComment) {
            existingComment.comment = comment;
            existingComment.commentedTime = new Date();
            await task.save();
        }
        res.status(200).json({ message: "comment updated", data: existingComment, ok: false })
    }
    catch (error) {
        console.log("Error from edit comment", error)
        return res.status(500).json({ message: "Server error", ok: false });

    }
}


const deleteComment = async (req: AuthenticatedUserRequest, res: Response) => {
    try {
        let user = req.user
        let { commentId, taskId } = req.params

        const { comment } = req.body;


        let task = await TaskModel.findByIdAndUpdate(taskId)

        if (!task) {
            return res.status(404).json({ message: "task not found", ok: false })
        }


        const initialLength = task.comments.length;

        task.comments = task.comments.filter((comm: any) => {
            return comm._id.toString() !== commentId.toString();
        });

        if (task.comments.length === initialLength) {
            return res.status(404).json({ message: "Comment not found" , ok:false});
        }

        await task.save()
        res.status(200).json({ message: "comment deleted",  data: task.comments , ok: false })

    }
    catch (error) {
        console.log("Error from delet3e comment", error)
        return res.status(500).json({ message: "Server error", ok: false });

    }
}


export {
    editComment, deleteComment
}