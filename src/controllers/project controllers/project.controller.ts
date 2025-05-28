import { Response } from "express";
import { AuthenticatedUserRequest } from "../../types/types";
import ProjectModel from "../../models/project.model";

import redisClient from '../../config/redisClient'

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

        const project = await ProjectModel.create({
            projectId: Date.now(),
            projectName,
            description: description ? description : null,
            projectInformation,
            projectAccess
        })

        res.status(200).json({ message: "Projects created successfully", data: project, ok: true });
    }
    catch (error) {
        console.log("error form createProject", error)
        return res.status(500).json({ message: 'Server error. Please try again later.', errorMessage:error, error: true, ok: false });
    }
}


const getProjects = async (req: AuthenticatedUserRequest, res: Response) => {
    try {

        let user = req.user

        const cacheKey = `projects:${user._id}`;


        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            return res.status(200).json({ message: "Projects retrieved from cache", data: parsedData, ok: true });
        }

        const projects = await ProjectModel.findOne({ userId: user._id })

        await redisClient.set(cacheKey, JSON.stringify(projects), { EX: 300 }); // expires in 5 mins (put in secondsj)


        res.status(200).json({ message: "Projects retrived successfully", data: projects, ok: true });

    }
    catch (error) {
        console.log("error form getProjects", error)
        return res.status(500).json({ message: 'Server error. Please try again later.', errorMessage:error, error: true, ok: false });
    }
}

export {
    createProject,
    getProjects
}