
// // ==========================================
// // 1. UPLOAD FILES (STAFF)
// // Route: POST /api/design-approvals/:projectId/:designType/upload
// // ==========================================
// export const uploadDesignFiles = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId, designType } = req.params; // designType should be "2D" or "3D"
//     const phaseId = req.query.phaseId as string | undefined; // Get phaseId from query

//     const files = req.files as (Express.Multer.File & { location: string })[];

//     if (!files || files.length === 0) {
//       return res.status(400).json({ message: "No files uploaded.", ok: false });
//     }

//     // Map uploaded files to schema format
//     const mappedFiles: IFileItem[] = files.map(file => {
//       const type: "image" | "pdf" = file.mimetype.startsWith("image") ? "image" : "pdf";
//       return {
//         type,
//         url: file.location,
//         originalName: file.originalname,
//         uploadedAt: new Date()
//       };
//     });

//     // Check if the design document already exists for this project
//     let design = await DesignApprovalModel.findOne({ projectId, designType });

//     if (phaseId) {
//       // ==========================================
//       // SCENARIO 1: Uploading to an existing phase
//       // ==========================================
//       if (!design) {
//         return res.status(404).json({ message: "Design document not found.", ok: false });
//       }

//       const phase = (design.phases as any).id(phaseId);

//       if (!phase) {
//         return res.status(404).json({ message: "Specific phase not found.", ok: false });
//       }

//       if (phase.status === "Approved") {
//         return res.status(400).json({ 
//           message: "This phase is already approved. Cannot upload more files.", 
//           ok: false 
//         });
//       }

//       // Append files to the specified phase
//       phase.files.push(...mappedFiles);

//     } else {
//       // ==========================================
//       // SCENARIO 2: No phaseId provided (First time creation)
//       // ==========================================
//       if (design) {
//         // If design already exists, block the creation to prevent duplicates
//         return res.status(400).json({ 
//           message: `${designType} design already exists for this project. Please provide a phaseId to upload files to an existing phase.`, 
//           ok: false 
//         });
//       }

//       // Create brand new document with Phase 1
//       design = new DesignApprovalModel({
//         projectId,
//         designType,
//         phases: [{ 
//           phaseNumber: 1, 
//           files: mappedFiles, 
//           feedbacks: [], 
//           status: "Pending" 
//         }]
//       });
//     }

//     await design.save();

//     // Cache updating logic goes here if needed
//     // await populateWithAssignedToField({ stageModel: DesignApprovalModel, projectId, dataToCache: design });

//     return res.status(200).json({ 
//       message: phaseId ? "Files added to phase successfully" : "New design and phase created successfully", 
//       data: design, 
//       ok: true 
//     });

//   } catch (error: any) {
//     console.error("Upload Error:", error);
//     return res.status(500).json({ message: "Server error", ok: false });
//   }
// };

// // ==========================================
// // 2. GET ALL DESIGNS FOR PROJECT (2D & 3D)
// // Route: GET /api/design-approvals/:projectId
// // ==========================================
// export const getDesignApprovals = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId } = req.params;

//     // This returns an array (usually containing the 2D document and the 3D document)
//     const designs = await DesignApprovalModel.find({ projectId });

//     // if (!designs || designs.length === 0) {
//     //   return res.status(404).json({ message: "No designs found for this project.", ok: false });
//     // }

//     return res.status(200).json({ message: "Designs fetched successfully", data: designs, ok: true });
//   } catch (error: any) {
//     console.error("Get Designs Error:", error);
//     return res.status(500).json({ message: "Server error", ok: false });
//   }
// };

// // ==========================================
// // 3. START NEW PHASE (STAFF)
// // Route: PUT /api/design-approvals/:projectId/:designType/next-phase
// // ==========================================
// export const startNextPhase = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId, designType } = req.params;

//     const design = await DesignApprovalModel.findOne({ projectId, designType });
//     if (!design) return res.status(404).json({ message: "Design not found.", ok: false });

//     if (design.isFullyApproved) {
//       return res.status(400).json({ message: "Design is already fully approved.", ok: false });
//     }

//     const currentPhase = design.phases[design.phases.length - 1];

//     // Create the next phase
//     const nextPhaseNumber = currentPhase.phaseNumber + 1;
//     design.phases.push({
//       phaseNumber: nextPhaseNumber,
//       files: [],
//       feedbacks: [],
//       status: "Pending"
//     } as any);

//     await design.save();

//     return res.status(200).json({ message: `Phase ${nextPhaseNumber} started.`, data: design, ok: true });
//   } catch (error: any) {
//     console.error("New Phase Error:", error);
//     return res.status(500).json({ message: "Server error", ok: false });
//   }
// };

// // ==========================================
// // 4. SUBMIT CLIENT FEEDBACK (CLIENT)
// // Route: PUT /api/design-approvals/:projectId/:designType/phases/:phaseId/feedback
// // ==========================================
// export const submitClientFeedback = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId, designType, phaseId } = req.params;
//     const { status, clientOverallComment, feedbacks } = req.body; 
//     // `feedbacks` should be an array of IFileFeedback objects

//     const design = await DesignApprovalModel.findOne({ projectId, designType });
//     if (!design) return res.status(404).json({ message: "Design not found.", ok: false });

//     const phase = (design.phases as any).id(phaseId);
//     if (!phase) return res.status(404).json({ message: "Phase not found.", ok: false });

//     // Update phase status and overall comment
//     phase.status = status || phase.status;
//     phase.clientOverallComment = clientOverallComment || phase.clientOverallComment;
//     phase.reviewedAt = new Date();

//     // Replace the feedbacks array with the client's submitted array
//     if (feedbacks && Array.isArray(feedbacks)) {
//       phase.feedbacks = feedbacks;
//     }

//     // Mark entire design as approved if this phase is approved
//     if (phase.status === "Approved") {
//       design.isFullyApproved = true;
//     }

//     await design.save();

//     return res.status(200).json({ message: "Feedback submitted successfully", data: phase, ok: true });
//   } catch (error: any) {
//     console.error("Client Feedback Error:", error);
//     return res.status(500).json({ message: "Server error", ok: false });
//   }
// };

// // ==========================================
// // 5. DELETE ENTIRE PHASE (STAFF)
// // Route: DELETE /api/design-approvals/:projectId/:designType/phases/:phaseId
// // ==========================================
// export const designApprovalDeletePhase = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId, designType, phaseId } = req.params;

//     const design = await DesignApprovalModel.findOne({ projectId, designType });
//     if (!design) return res.status(404).json({ message: "Design not found.", ok: false });

//     // Use Mongoose pull to remove the specific phase by ID
//     (design.phases as any).pull({ _id: phaseId });

//     // // Check if there are no phases left, you might want to reset isFullyApproved
//     // if (design.phases.length === 0) {
//     //   design.isFullyApproved = false;
//     // }

//     await design.save();

//     return res.status(200).json({ message: "Phase deleted successfully", data: design, ok: true });
//   } catch (error: any) {
//     console.error("Delete Phase Error:", error);
//     return res.status(500).json({ message: "Server error", ok: false });
//   }
// };

// // ==========================================
// // 6. DELETE SINGLE FILE (STAFF)
// // Route: DELETE /api/design-approvals/:projectId/:designType/phases/:phaseId/files/:fileId
// // ==========================================
// export const deleteSingleFile = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId, designType, phaseId, fileId } = req.params;

//     const design = await DesignApprovalModel.findOne({ projectId, designType });
//     if (!design) return res.status(404).json({ message: "Design not found.", ok: false });

//     const phase = (design.phases as any).id(phaseId);
//     if (!phase) return res.status(404).json({ message: "Phase not found.", ok: false });

//     // Remove the file from the phase's files array
//     phase.files.pull({ _id: fileId });

//     // Optional cleanup: If you also want to delete any client feedback attached to this deleted file
//     // if (phase.feedbacks && phase.feedbacks.length > 0) {
//     //   const feedbackToRemove = phase.feedbacks.find((f:any) => f.fileId.toString() === fileId);
//     //   if (feedbackToRemove && feedbackToRemove._id) {
//     //      phase.feedbacks.pull({ _id: feedbackToRemove._id });
//     //   }
//     // }

//     await design.save();

//     return res.status(200).json({ message: "File deleted successfully", data: phase, ok: true });
//   } catch (error: any) {
//     console.error("Delete File Error:", error);
//     return res.status(500).json({ message: "Server error", ok: false });
//   }
// };





import { Request, Response } from "express";
import { DesignApprovalModel, IFileItem } from "../../../models/Stage Models/DesignApproval_model/designApproval.model";
import { populateWithAssignedToField } from "../../../utils/populateWithRedis";
import { updateProjectCompletionPercentage } from "../../../utils/updateProjectCompletionPercentage ";
import { handleSetStageDeadline } from "../../../utils/common features/timerFuncitonality";

// Helper function to dynamically select the correct 2D or 3D object
const getDesignTarget = (design: any, designType: string) => {
    return designType.toUpperCase() === "3D" ? design.design3D : design.design2D;
};

// ==========================================
// 1. UPLOAD FILES (STAFF)
// Route: POST /api/design-approvals/:projectId/:designType/upload
// ==========================================
export const uploadDesignFiles = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, designType } = req.params; // "2D" or "3D"
        const phaseId = req.query.phaseId as string | undefined;

        if (designType !== "2D" && designType !== "3D") {
            return res.status(400).json({ message: "Invalid design type. Must be 2D or 3D.", ok: false });
        }

        const files = req.files as (Express.Multer.File & { location: string })[];

        if (!files || files.length === 0) {
            return res.status(400).json({ message: "No files uploaded.", ok: false });
        }

        const mappedFiles: IFileItem[] = files.map(file => {
            const type: "image" | "pdf" = file.mimetype.startsWith("image") ? "image" : "pdf";
            return {
                type,
                url: file.location,
                originalName: file.originalname,
                uploadedAt: new Date()
            };
        });

        let design = await DesignApprovalModel.findOne({ projectId });

        // If the whole document doesn't exist yet, create the base structure
        if (!design) {
            design = new DesignApprovalModel({
                projectId,
                design2D: { phases: [] },
                design3D: { phases: [] },
                timer: { startedAt: new Date() } // Start the timer on first upload!
            });
        }

        const targetDesign = getDesignTarget(design, designType);

        if (phaseId) {
            // --- Upload to EXISTING Phase ---
            const phase = targetDesign.phases.id(phaseId);

            if (!phase) {
                return res.status(404).json({ message: "Specific phase not found.", ok: false });
            }
            if (phase.status === "Approved") {
                return res.status(400).json({ message: "This phase is already approved.", ok: false });
            }

            phase.files.push(...mappedFiles);
        } else {
            // --- Create NEW First Phase ---
            if (targetDesign.phases.length > 0) {
                return res.status(400).json({
                    message: `${designType} design already has phases. Please provide a phaseId.`,
                    ok: false
                });
            }

            targetDesign.phases.push({
                phaseNumber: 1,
                files: mappedFiles,
                feedbacks: [],
                status: "Pending"
            } as any);
        }

        await design.save();

        return res.status(200).json({ message: "Files uploaded successfully", data: design, ok: true });
    } catch (error: any) {
        console.error("Upload Error:", error);
        return res.status(500).json({ message: "Server error", ok: false });
    }
};

// ==========================================
// 2. GET DESIGN APPROVAL DOC (STAFF & PUBLIC)
// Route: GET /api/design-approvals/:projectId
// ==========================================
export const getDesignApprovals = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        // We only need findOne now because it's a single document!
        const design = await DesignApprovalModel.findOne({ projectId }).populate("assignedTo", "name email");

        if (!design) {
            return res.status(404).json({ message: "No designs found for this project.", ok: false });
        }

        return res.status(200).json({ message: "Design fetched successfully", data: design, ok: true });
    } catch (error: any) {
        console.error("Get Designs Error:", error);
        return res.status(500).json({ message: "Server error", ok: false });
    }
};

// ==========================================
// 3. START NEXT PHASE (STAFF)
// Route: PUT /api/design-approvals/:projectId/:designType/next-phase
// ==========================================
export const startNextPhase = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, designType } = req.params;

        let design = await DesignApprovalModel.findOne({ projectId });

        if (designType !== "2D" && designType !== "3D") {
            return res.status(400).json({ message: "Invalid design type. Must be 2D or 3D.", ok: false });
        }

        // if (!design) return res.status(404).json({ message: "Design not found.", ok: false });

        // 1. If the design document doesn't exist at all, create it
        if (!design) {
            design = new DesignApprovalModel({
                projectId,
                design2D: { phases: [] },
                design3D: { phases: [] },
                timer: { startedAt: new Date() } // Start timer on the first action
            });
        }

        const targetDesign = getDesignTarget(design, designType);

        // if (targetDesign.phases.length === 0) {
        //     return res.status(400).json({ message: `No initial ${designType} phase exists yet.`, ok: false });
        // }

        // const currentPhase = targetDesign.phases[targetDesign.phases.length - 1];

        // const nextPhaseNumber = currentPhase.phaseNumber + 1;
        // targetDesign.phases.push({
        //     phaseNumber: nextPhaseNumber,
        //     files: [],
        //     feedbacks: [],
        //     status: "Pending"
        // } as any);

        // await design.save();

        // 2. Determine the next phase number
        let nextPhaseNumber = 1; // Default to Phase 1

        if (targetDesign.phases.length > 0) {
            // If phases already exist, get the last one and increment
            const currentPhase = targetDesign?.phases[targetDesign?.phases?.length - 1];
            nextPhaseNumber = currentPhase.phaseNumber + 1;
        }

        // 3. Push the new phase (either Phase 1 or Phase N+1)
        targetDesign.phases.push({
            phaseNumber: nextPhaseNumber,
            files: [],
            feedbacks: [],
            status: "Pending"
        } as any);

        await design.save();

        return res.status(200).json({ message: `Phase ${nextPhaseNumber} started.`, data: design, ok: true });
    } catch (error: any) {
        console.error("New Phase Error:", error);
        return res.status(500).json({ message: "Server error", ok: false });
    }
};

// ==========================================
// 4. SUBMIT CLIENT FEEDBACK (CLIENT PUBLIC LINK)
// Route: PUT /api/design-approvals/:projectId/:designType/phases/:phaseId/feedback
// ==========================================

export const submitClientFeedback = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, designType, phaseId } = req.params;
        const { status, clientOverallComment, feedbacks } = req.body;

        const design = await DesignApprovalModel.findOne({ projectId });
        if (!design) return res.status(404).json({ message: "Design not found.", ok: false });

        const targetDesign = getDesignTarget(design, designType);
        const phase = targetDesign.phases.id(phaseId);

        if (!phase) return res.status(404).json({ message: "Phase not found.", ok: false });
        if (phase.status === "Approved") return res.status(400).json({ message: "Already approved.", ok: false });

        phase.status = status || phase.status;
        phase.clientOverallComment = clientOverallComment || phase.clientOverallComment;
        phase.reviewedAt = new Date();

        if (feedbacks && Array.isArray(feedbacks)) {
            phase.feedbacks = feedbacks;
        }

        await design.save();

        return res.status(200).json({ message: "Feedback submitted successfully", data: phase, ok: true });
    } catch (error: any) {
        console.error("Client Feedback Error:", error);
        return res.status(500).json({ message: "Server error", ok: false });
    }
};

// ==========================================
// 5. MARK AS COMPLETE (STAFF)
// Route: PUT /api/design-approvals/:projectId/complete
// ==========================================
export const markDesignComplete = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        const design = await DesignApprovalModel.findOne({ projectId });
        if (!design) return res.status(404).json({ message: "Design not found.", ok: false });

        design.isFullyApproved = true;

        // Stop the timer
        if (design.timer) {
            design.timer.completedAt = new Date();
        }

        await design.save();

        return res.status(200).json({ message: "Design stage marked as complete.", data: design, ok: true });
    } catch (error: any) {
        console.error("Complete Design Error:", error);
        return res.status(500).json({ message: "Server error", ok: false });
    }
};

// ==========================================
// 6. DELETE PHASE (STAFF)
// ==========================================
export const designApprovalDeletePhase = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, designType, phaseId } = req.params;

        const design = await DesignApprovalModel.findOne({ projectId });
        if (!design) return res.status(404).json({ message: "Design not found.", ok: false });

        const targetDesign = getDesignTarget(design, designType);
        targetDesign.phases.pull({ _id: phaseId });

        await design.save();

        return res.status(200).json({ message: "Phase deleted successfully", data: design, ok: true });
    } catch (error: any) {
        console.error("Delete Phase Error:", error);
        return res.status(500).json({ message: "Server error", ok: false });
    }
};

// ==========================================
// 7. DELETE SINGLE FILE (STAFF)
// ==========================================
export const deleteSingleFile = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, designType, phaseId, fileId } = req.params;

        const design = await DesignApprovalModel.findOne({ projectId });
        if (!design) return res.status(404).json({ message: "Design not found.", ok: false });

        const targetDesign = getDesignTarget(design, designType);
        const phase = targetDesign.phases.id(phaseId);
        if (!phase) return res.status(404).json({ message: "Phase not found.", ok: false });

        phase.files.pull({ _id: fileId });

        // Clean up associated feedback for this file
        if (phase.feedbacks && phase.feedbacks.length > 0) {
            const feedbackToRemove = phase.feedbacks.find((f: any) => f.fileId.toString() === fileId);
            if (feedbackToRemove && feedbackToRemove._id) {
                phase.feedbacks.pull({ _id: feedbackToRemove._id });
            }
        }

        await design.save();

        return res.status(200).json({ message: "File deleted successfully", data: phase, ok: true });
    } catch (error: any) {
        console.error("Delete File Error:", error);
        return res.status(500).json({ message: "Server error", ok: false });
    }
};




export const designApprovalCompletionStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        if (!projectId) return res.status(400).json({ ok: false, message: "Project ID is required" });

        const design = await DesignApprovalModel.findOne({ projectId });
        if (!design) return res.status(404).json({ ok: false, message: "Sample design not found" });

        if (design.status === "completed") return res.status(400).json({ ok: false, message: "Already completed" });

        design.status = "completed";

        await design.save();

        // const redisKey = `stage:SampleDesignModel:${projectId}`
        // await redisClient.set(redisKey, JSON.stringify(design.toObject()), { EX: 60 * 10 });

        await populateWithAssignedToField({ stageModel: DesignApprovalModel, projectId, dataToCache: design })


        res.status(200).json({ ok: true, message: "Sample design marked as completed", data: design });
        updateProjectCompletionPercentage(projectId);

    } catch (err) {
        console.error("Sample design Complete Error:", err);
        return res.status(500).json({ message: "Internal server error", ok: false });
    }
};


export const setDesignApprovalStageDeadline = (req: Request, res: Response): Promise<any> => {
    return handleSetStageDeadline(req, res, {
        model: DesignApprovalModel,
        stageName: "Design Approval"
    });
};