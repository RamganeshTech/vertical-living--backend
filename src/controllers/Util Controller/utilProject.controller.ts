import { Request, Response } from "express";
import redisClient from "../../config/redisClient";
import ProjectModel from "../../models/project model/project.model";
import { RoleBasedRequest } from "../../types/types";



export const getUtilProjectDetails = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const project = await getProjectDetailsUtil(projectId);

        if (!project) {
            return res.status(404).json({ message: "project not found.", ok: true });
        }

        return res.status(200).json({ data: project, ok: true });
    } catch (err) {
        return res.status(500).json({ message: "Server error", error: err, ok: true });
    }
};


export const getProjectDetailsUtil = async (projectId: string): Promise<any | null> => {
    const redisKey = `stage:projectdetails:${projectId}`;

    // Check Redis first
    // await redisClient.del(redisKey)
    const cached = await redisClient.get(redisKey);
    if (cached) {
        // return { projectId, mode: JSON.parse(cached) }; 
        return JSON.parse(cached); 
    }

    // Fallback to DB
    const project = await ProjectModel.findById(projectId )
    if (!project) return null;
    // console.log("selection form Util", selection)
    // Cache for future
    await redisClient.set(redisKey, JSON.stringify(project.toObject()), { EX: 60 * 10 });

    return project;
};


