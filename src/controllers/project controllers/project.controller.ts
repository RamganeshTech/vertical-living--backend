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

        console.log("user form middleware", user)

        projectInformation.owner = user.username

        const project = await ProjectModel.create({
            userId: user._id,
            projectId: Date.now(),
            projectName,
            description: description ? description : null,
            projectInformation,
            projectAccess
        })

        const cacheKey = `projects:${user._id}`;
        await redisClient.del(cacheKey);

        res.status(200).json({ message: "Projects created successfully", data: project, ok: true });
    }
    catch (error: any) {
        console.log("error form createProject", error)

        if (error.errorResponse.code === 11000) {
            return res.status(400).json({
                message: "A project with this name already exists for this user.",
                ok: false
            });
        }
        return res.status(500).json({ message: 'Server error. Please try again later.', errorMessage: error, error: true, ok: false });
    }
}


const getProjects = async (req: AuthenticatedUserRequest, res: Response) => {
    try {

        let user = req.user

        const cacheKey = `projects:${user._id}`;

        // await redisClient.del(`projects:${user._id}`);
        let cachedData = await redisClient.get(cacheKey);


        if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            return res.status(200).json({ message: "Projects retrieved from cache", data: parsedData, ok: true });
        }

        const projects = await ProjectModel.find({ userId: user._id })

        await redisClient.set(cacheKey, JSON.stringify(projects), { EX: 300 }); // expires in 5 mins (put in secondsj)


        res.status(200).json({ message: "Projects retrived successfully", data: projects, ok: true });

    }
    catch (error) {
        console.log("error form getProjects", error)
        return res.status(500).json({ message: 'Server error. Please try again later.', errorMessage: error, error: true, ok: false });
    }
}


const deleteProject = async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
    try {
        const { projectId } = req.params

        if (!projectId) {
            res.status(400).json({ message: "project name is required", ok: false })
            return
        }

        const data = await ProjectModel.findByIdAndDelete(projectId)

        if (!data) {
            res.status(404).json({ message: "no project found with given projectid", ok: false })
            return;
        }

        res.status(200).json({ message: "project deleted successfully", data, ok: true })

    }
    catch (error) {
        console.log("error form delete projects", error)
        res.status(500).json({ message: 'Server error. Please try again later.', errorMessage: error, error: true, ok: false });
        return
    }
}


export {
    createProject,
    getProjects, deleteProject
}