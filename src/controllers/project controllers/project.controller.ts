import { Response } from "express";
import { RoleBasedRequest } from "../../types/types";
import ProjectModel from "../../models/project model/project.model";

import redisClient from '../../config/redisClient'
import ClientModel from "../../models/client model/client.model";
import CTOModel from "../../models/CTO model/CTO.model";
import UserModel from "../../models/usermodel/user.model";
// import { syncRequirmentForm } from "../stage controllers/requirement controllers/mainRequirement.controller";
import { syncPreRequireties } from "../PreRequireties Controllers/preRequireties.controllers";
// import { syncSelectStage } from "../Modular Units Controllers/StageSelection Controller/stageSelection.controller";
import { syncDocumentationModel } from "../documentation controller/documentation.controller";
import { stageModels } from "../../constants/BEconstants";
import { AdminWallPaintingModel } from "../../models/Wall Painting model/AdminSideWallPainting.model";
import { WorkerWallPaintingModel } from "../../models/Wall Painting model/workerSideWallPainting.model";
import { Model } from "mongoose";
import { PreRequiretiesModel } from "../../models/PreRequisites/preRequireties.model";
import { StageDocumentationModel } from "../../models/Documentation Model/documentation.model";
import { ShortlistedDesignModel } from "../../models/Stage Models/sampleDesing model/shortListed.model";
import { syncRequirmentForm } from "../stage controllers/requirement controllers/mainRequirementNew.controller";

const createProject = async (req: RoleBasedRequest, res: Response) => {
    try {
        let user = req.user

        let {
            projectName,
            description,
            tags,
            startDate,
            endDate,
            dueDate,
            priority,
            // category,
            status
        } = req.body


        const { organizationId } = req.params

        if (!organizationId) {
            res.status(400).json({ message: "organization Id is required", ok: false })
            return
        }

        if (!projectName) {
            return res.status(400).json({ message: "project name is required", ok: false })
        }


        if (!startDate) {
            return res.status(400).json({ message: "start date is required", ok: false })
        }

        if (endDate && startDate > endDate) {
            res.status(400).json({ message: "end date should be after start date" })
            return
        }

        if (dueDate && startDate > dueDate) {
            res.status(400).json({ message: "Due date should be after start date" })
            return
        }

        const durationInDays = Math.ceil(
            (new Date(dueDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
        );


        const project = await ProjectModel.findOne({
            projectName,
            userId: user?.role === "owner" ? user?._id : user?.ownerId
        })


        if (!project) {
            console.log("project crated wiht new ", project)

            // const existingCustomProjectId = project 

            const projectNew = new ProjectModel({
                userId: user?.role === "owner" ? user?._id : user?.ownerId,
                projectId: Date.now(),
                projectName,
                description: description ? description : null,
                organizationId,
                projectInformation: {
                    owner: user?.role === "owner" ? user?._id : user?.ownerId,
                    tags,
                    startDate,
                    endDate,
                    dueDate,
                    duration: durationInDays,
                    priority,
                    // category: category || "residential",
                    status,
                },
            })

            await projectNew.save()

            await Promise.all([
                UserModel.updateOne(
                    {
                        role: "owner",
                        organizationId: organizationId,
                    },
                    {
                        $addToSet: { projectId: projectNew._id },
                    }
                ),

                CTOModel.updateMany(
                    {
                        organizationId: organizationId,
                    },
                    {
                        $addToSet: { projectId: projectNew._id },
                    }
                ),

                syncRequirmentForm(projectNew._id),
                syncPreRequireties(projectNew._id),
                // syncSelectStage(projectNew._id),
                syncDocumentationModel(projectNew._id)
            ]);
        }
        else {
            return res.status(400).json({
                message: "A project with this name already exists for this user.",
                ok: false
            });


        }


        const cacheKey = `projects:${organizationId}`;
        await redisClient.del(cacheKey);

        res.status(200).json({ message: "Projects created successfully", data: project, ok: true });
    }
    catch (error: any) {
        console.log("error form createProject", error)

        // if (error?.errorResponse?.code === 11000) {
        //     return res.status(400).json({
        //         message: "A project with this name already exists for this user.",
        //         ok: false
        //     });
        // }
        return res.status(500).json({ message: 'Server error. Please try again later.', errorMessage: error, error: true, ok: false });
    }
}


const getProjects = async (req: RoleBasedRequest, res: Response) => {
    try {

        const { organizationId } = req.params

        if (!organizationId) {
            res.status(400).json({ message: "organization Id is required", ok: false })
            return
        }
        // console.log("organizationId", organizationId)
        const cacheKey = `projects:${organizationId}`;

        // await redisClient.del(`projects:${organizationId}`);
        let cachedData = await redisClient.get(cacheKey);


        if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            return res.status(200).json({ message: "Projects retrieved from cache", data: parsedData, ok: true });
        }

        const projects = await ProjectModel.find({ organizationId })

        await redisClient.set(cacheKey, JSON.stringify(projects), { EX: 300 }); // expires in 5 mins (put in secondsj)


        res.status(200).json({ message: "Projects retrived successfully", data: projects, ok: true });

    }
    catch (error) {
        console.log("error form getProjects", error)
        return res.status(500).json({ message: 'Server error. Please try again later.', errorMessage: error, error: true, ok: false });
    }
}


const deleteProject = async (req: RoleBasedRequest, res: Response): Promise<void> => {
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


        await Promise.all([
            UserModel.updateMany(
                {
                    role: "owner",
                    projectId: projectId,
                },
                {
                    $pull: { projectId },
                }
            ),

            CTOModel.updateMany(
                {
                    projectId: projectId,

                }, {
                $pull: { projectId },
            }
            ),
        ]);

        const allModels: Model<any>[] = [
            ...stageModels,
            PreRequiretiesModel,
            ShortlistedDesignModel,
            StageDocumentationModel,
            AdminWallPaintingModel,
            WorkerWallPaintingModel,
            // SelectedModularUnitModel,
        ];


        // for (let model of allModels) {
        //     const doc = await model.findOne({ projectId });
        //     if (!doc) {
        //         continue;
        //     }
        //     else{
        //         await model.findOneAndDelete({projectId})
        //     }
        // }


        for (const model of allModels) {
            await model.deleteMany({ projectId }); // Efficient and deletes all matching
        }

        const cacheKey = `projects:${data.organizationId}`;

        await redisClient.del(cacheKey);

        res.status(200).json({ message: "project deleted successfully", data, ok: true })

    }
    catch (error) {
        console.log("error form delete projects", error)
        res.status(500).json({ message: 'Server error. Please try again later.', errorMessage: error, error: true, ok: false });
        return
    }
}

const assignClient = async (req: RoleBasedRequest, res: Response): Promise<void> => {
    try {
        const { clientId, projectId } = req.params

        if (!clientId || !projectId) {
            res.status(400).json({ message: 'client id and project id is required', ok: false });
            return
        }

        const client = await ClientModel.findById(clientId)

        if (!client) {
            res.status(404).json({ message: "client not found", ok: false })
            return
        }

        const project = await ProjectModel.findByIdAndUpdate(projectId, { $push: { accessibleClientId: clientId } }, { returnDocument: "after" })

        if (!project) {
            res.status(404).json({ message: "proejct not found", ok: false })
            return
        }

        const cacheKey = `projects:${project.organizationId}`;
        await redisClient.del(cacheKey);


        res.status(200).json({ message: `client ${client.clientName} has been assigned to the ${project.projectName} project`, ok: true });
    }
    catch (error) {
        console.log("error form assign client projects", error)
        res.status(500).json({ message: 'Server error. Please try again later.', errorMessage: error, error: true, ok: false });
        return
    }
}

const updateProject = async (req: RoleBasedRequest, res: Response): Promise<void> => {
    try {
        let user = req.user

        const { projectId } = req.params

        let {
            projectName,
            description,
            tags,
            startDate,
            endDate,
            dueDate,
            category,
            priority,
            status
        } = req.body

        if (!projectName) {
            res.status(400).json({ message: "project name is required", ok: false })
            return
        }

        if (!startDate) {
            res.status(400).json({ message: "start date is required", ok: false })
            return
        }

        if (endDate && startDate > endDate) {
            res.status(400).json({ message: "end date should be after start date" })
            return
        }

        if (dueDate && startDate > dueDate) {
            res.status(400).json({ message: "Due date should be after start date" })
            return
        }

        const durationInDays = Math.ceil(
            (new Date(dueDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        const data = await ProjectModel.findByIdAndUpdate(projectId, {
            projectName,
            description: description ? description : null,
            projectInformation: {
                owner: user?.role === "owner" ? user?._id : user?.ownerId,
                tags,
                startDate,
                endDate,
                dueDate,
                duration: durationInDays,
                category: category || "residential",
                priority,
                status,
            },
        }, {
            returnDocument: "after"
        })

        if (!data) {
            res.status(404).json({ message: "project not found" })
            return;
        }

        const cacheKey = `projects:${data.organizationId}`;
        await redisClient.del(cacheKey);


        res.status(200).json({ message: "project information updated", data, ok: true })

    }
    catch (error) {
        console.log("error form edit projects", error)
        res.status(500).json({ message: 'Server error. Please try again later.', errorMessage: error, error: true, ok: false });
        return
    }
}


export {
    createProject,
    getProjects,
    deleteProject,
    assignClient,
    updateProject,
}