import { Response } from "express";
import { AuthenticatedUserRequest } from "../types/types";
import ProjectModel from "../models/project.model";

const createProject = async (req: AuthenticatedUserRequest, res: Response) => {
    try {
        let user = req.user

        let { projectName,
            description,
            projectInformation,
            projectAccess } = req.body

        if (!projectName) {
            return res.status(400).json({ message: "project name is required", ok: false })
        }

        projectInformation.owner = user.username

        await ProjectModel.create({
            projectName,
            description: description ? description : null,
            projectInformation,
            projectAccess
        })
    }
    catch (error) {
        console.log("error form createProject", error)
        return res.status(500).json({ message: 'Server error. Please try again later.', error: true, ok: false });
    }
}

export {
    createProject
}