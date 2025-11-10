// controllers/discussion.controller.ts

import { Response } from 'express';
// import { RoleBasedRequest } from '../types/request.types';
// import { IssueDiscussionModel } from '../models/IssueDiscussion.model';
import { populateDiscussion, formatUserData, getModelNameByRole } from './populateDiscussion.util';
// import { SocketService } from '../services/socketService';
import { Types } from 'mongoose';
import { RoleBasedRequest } from '../../../types/types';
import { IConvo, IssueDiscussionModel } from '../../../models/Stage Models/Issue Discussion Model/issueDiscussion.model';
import { SocketService } from '../../../config/socketService';

/**
 * Create a new issue
 */
export const createIssue = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        let {
            organizationId,
            projectId,
            selectStaff,
            selectStaffRole,
            issue,
            responseType,
            isMessageRequired,
            dropdownOptions,
            //   attachments
        } = req.body;

        
    // 🧩 Convert to boolean
    isMessageRequired = isMessageRequired === "true" || isMessageRequired === true;

    // 🧩 Parse dropdownOptions if it was sent as JSON string
    if (typeof dropdownOptions === "string") {
      try {
        dropdownOptions = JSON.parse(dropdownOptions);
      } catch (e) {
        console.warn("Failed to parse dropdownOptions:", dropdownOptions);
        dropdownOptions = [];
      }
    }


        // Get user info from auth middleware
        if (!req.user) {
            return res.status(401).json({
                ok: false,
                message: 'Unauthorized'
            });
        }
        console.log("========== CREATE ISSUE DEBUG ==========");
        console.log("Request body:", req.body);
        console.log("selectStaff:", selectStaff);
        console.log("=======================================");


        const allowedrole = [
            "owner",
            "CTO",
            "staff",
            "worker"]

        if (!allowedrole.includes(selectStaffRole)) {
            return res.status(404).json({
                ok: false,
                message: `${selectStaffRole} for selected staff role is not allowed`
            });
        }

        const raisedBy = req.user._id;
        const raisedModel = getModelNameByRole(req.user.role);

        // Find or create discussion document
        let discussion = await IssueDiscussionModel.findOne({
            organizationId,
            projectId
        });

        if (!discussion) {
            discussion = new IssueDiscussionModel({
                organizationId,
                projectId,
                discussion: []
            });
        }

        let staffSelectedModel = "StaffModel";

        if (selectStaffRole === "owner") {
            staffSelectedModel = "UserModel"
        }
        else if (selectStaffRole === "CTO") {
            staffSelectedModel = "CTOModel"
        }
        else if (selectStaffRole === "staff") {
            staffSelectedModel = "StaffModel"
        }
        else if (selectStaffRole === "worker") {
            staffSelectedModel = "WorkerModel"
        }
        // console.log("selectStaffRole", selectStaffRole)

        const files = req.files as Express.Multer.File[];

        // ✅ Build attachment objects if files exist
        const attachments = (files || []).map((file) => ({
            type: file.mimetype.startsWith("image") ? "image" as const : "pdf" as const,
            url: (file as any).location,
            originalName: file.originalname,
            uploadedAt: new Date()
        }));

        // Create new conversation
        const newConvo: IConvo = {
            issue: {
                selectStaff: new Types.ObjectId(selectStaff),
                staffSelectedModel: staffSelectedModel,
                selectStaffRole: selectStaffRole,
                raisedBy: new Types.ObjectId(raisedBy),
                raisedModel,
                issue,
                responseType,
                isMessageRequired,
                dropdownOptions: responseType === 'dropdown' ? dropdownOptions : undefined,
                files: attachments || []
            }
        };

        discussion.discussion.push(newConvo);
        discussion.markModified('discussion');
        await discussion.save();

        // Populate the new discussion
        const populatedDiscussion = await populateDiscussion(discussion);
        const latestConvo = populatedDiscussion.discussion[populatedDiscussion.discussion.length - 1];

        // Format user data for consistent response
        const formattedConvo = {
            _id: latestConvo._id,
            issue: {
                ...latestConvo.issue.toObject(),
                raisedBy: formatUserData(latestConvo.issue.raisedBy, latestConvo.issue.raisedModel),
                selectStaff: formatUserData(latestConvo.issue.selectStaff, 'StaffModel')
            },
            response: null,
            status: 'pending',
            createdAt: latestConvo.createdAt,
            updatedAt: latestConvo.updatedAt
        };

        // Emit socket events
        await SocketService.emitToProject(projectId, 'new_issue_created', {
            discussionId: discussion._id,
            conversation: formattedConvo
        });

        // Send notification to assigned staff
        SocketService.sendNotification(selectStaff, {
            type: 'issue_assigned',
            title: 'New Issue Assigned',
            message: `You have been assigned a new issue: ${issue}`,
            data: {
                discussionId: discussion._id,
                convoId: latestConvo._id,
                projectId,
                issueTitle: issue
            }
        });

        res.status(201).json({
            ok: true,
            data: {
                discussionId: discussion._id,
                conversation: formattedConvo
            }
        });

    } catch (error) {
        const err = error as Error;
        console.error('Create issue error:', err);
        res.status(500).json({
            ok: false,
            message: err.message || 'Failed to create issue'
        });
    }
};

/**
 * Add response to an issue
 */
export const addResponse = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId, convoId } = req.params;
        const { responseContent, optionalMessage, } = req.body;

        if (!req.user) {
            return res.status(401).json({
                ok: false,
                message: 'Unauthorized'
            });
        }

        // Get responder info
        const responsededBy = req.user._id;
        const responsededModel = getModelNameByRole(req.user.role);

        const discussion = await IssueDiscussionModel.findOne({ projectId });
        if (!discussion) {
            return res.status(404).json({
                ok: false,
                message: 'Discussion not found'
            });
        }

        const convo = (discussion.discussion as any).id(convoId);
        if (!convo) {
            return res.status(404).json({
                ok: false,
                message: 'Conversation not found'
            });
        }

        // Check if user is authorized to respond
        if (convo.issue.selectStaff.toString() !== req.user._id) {
            return res.status(403).json({
                ok: false,
                message: 'You are not alloted to respond to this issue'
            });
        }

        // Check if already responded
        if (convo.response) {
            return res.status(400).json({
                ok: false,
                message: 'This issue has already been responded to'
            });
        }

        // Build response based on type
        const response: any = {
            issueId: convo.issue._id,
            responsededBy: new Types.ObjectId(responsededBy),
            responsededModel,
            responseType: convo.issue.responseType
        };

        // Add response content based on type
        switch (convo.issue.responseType) {
            case 'dropdown':
                if (!responseContent) {
                    return res.status(400).json({
                        ok: false,
                        error: 'Dropdown selection is required'
                    });
                }
                response.dropdownResponse = responseContent;
                break;

            case 'text':
                if (!responseContent) {
                    return res.status(400).json({
                        ok: false,
                        error: 'Text response is required'
                    });
                }
                response.textResponse = responseContent;
                break;

            case 'file':
                const files = req.files as Express.Multer.File[];

                if (!files || files.length === 0) {
                    return res.status(400).json({
                        ok: false,
                        error: 'File upload is required'
                    });
                }

                // ✅ Build attachment objects if files exist
                const attachments = (files || []).map((file) => ({
                    type: file.mimetype.startsWith("image") ? "image" as const : "pdf" as const,
                    url: (file as any).location,
                    originalName: file.originalname,
                }));




                // if (!fileResponse || fileResponse.length === 0) {
                //     return res.status(400).json({
                //         ok: false,
                //         error: 'File upload is required'
                //     });
                // }
                response.fileResponse = attachments;
                break;
        }

        // Add optional message if required
        if (convo.issue.isMessageRequired && !optionalMessage) {
            return res.status(400).json({
                ok: false,
                message: 'Additional message is required for this issue'
            });
        }

        if (optionalMessage) {
            response.optionalMessage = optionalMessage;
        }

        // Update conversation with response
        convo.response = response;
        await discussion.save();

        // Populate and format response
        const populatedDiscussion = await populateDiscussion(discussion);
        const updatedConvo = populatedDiscussion.discussion.id(convoId);

        const formattedConvo = {
            _id: updatedConvo._id,
            issue: {
                ...updatedConvo.issue.toObject(),
                raisedBy: formatUserData(updatedConvo.issue.raisedBy, updatedConvo.issue.raisedModel),
                selectStaff: formatUserData(updatedConvo.issue.selectStaff, 'StaffModel')
            },
            response: {
                ...updatedConvo.response.toObject(),
                responsededBy: formatUserData(
                    updatedConvo.response.responsededBy,
                    updatedConvo.response.responsededModel
                )
            },
            status: "responded",
            createdAt: updatedConvo.createdAt,
            updatedAt: updatedConvo.updatedAt
        }

        // Emit socket events
        // await SocketService.emitToProject(discussion.projectId.toString(), 'issue_response_added', {
        //     discussionId: discussion._id,
        //     convoId,
        //     response: formattedConvo.response 
        // });



        // ✅ FIXED: Extract _id from populated projectId
        const projectIdString = discussion.projectId._id
            ? discussion.projectId._id.toString()
            : projectId; // Fallback to param if not populated


        // ✅ ADD THESE LOGS
        console.log("========== EMITTING SOCKET EVENT ==========");
        console.log("Project ID:", projectIdString.toString());
        console.log("Convo ID:", convoId);
        console.log("Formatted Conversation:", JSON.stringify(formattedConvo, null, 2));
        console.log("==========================================");



        await SocketService.emitToProject(projectIdString, 'issue_response_added', {
            projectId: projectIdString,  // ✅ Add projectId
            convoId: String(convoId),                           // ✅ Keep convoId as string
            conversation: formattedConvo,               // ✅ Add full conversation
            response: formattedConvo.response           // ✅ Keep response for backward compatibility
        });

        // Notify the issue raiser
        SocketService.sendNotification(convo.issue.raisedBy.toString(), {
            type: 'issue_responded',
            title: 'Issue Response Received',
            message: `Your issue has been responded to`,
            data: {
                discussionId: discussion._id,
                convoId,
                projectId: projectIdString,  // ✅ Add projectId
            }
        });

        res.json({
            ok: true,
            data: {
                response: formattedConvo.response,
                conversation: formattedConvo  // ✅ Optionally return full conversation
            }
        });

    } catch (error) {
        const err = error as Error;
        console.error('Add response error:', err);
        res.status(500).json({
            ok: false,
            message: err.message || 'Failed to add response'
        });
    }
};

/**
 * Get discussions for a project
 */
export const getProjectDiscussions = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const { page = 1, limit = 20, status, assignedToMe } = req.query;

        if (!req.user) {
            return res.status(401).json({
                ok: false,
                error: 'Unauthorized'
            });
        }

        const query: any = { projectId };

        const discussion = await IssueDiscussionModel.findOne(query);

        if (!discussion) {
            return res.json({
                ok: true,
                data: {
                    discussionId: null,
                    discussions: [],
                    totalConversations: 0,
                    page: Number(page),
                    limit: Number(limit)
                }
            });
        }

        // Populate discussions
        const populatedDiscussion = await populateDiscussion(discussion);

        // Filter conversations based on query params
        let filteredConvos = populatedDiscussion.discussion;

        // Filter by assigned to current user
        if (assignedToMe === 'true') {
            filteredConvos = filteredConvos.filter(
                (convo: any) => convo.issue.selectStaff?._id?.toString() === req.user!._id
            );
        }

        // Filter by status
        if (status) {
            filteredConvos = filteredConvos.filter((convo: any) => {
                const convoStatus = convo.response ? 'responded' : 'pending';
                return convoStatus === status;
            });
        }

        // Pagination
        const startIndex = (Number(page) - 1) * Number(limit);
        const endIndex = startIndex + Number(limit);
        const paginatedConvos = filteredConvos.slice(startIndex, endIndex);

        // Format all conversations
        const formattedDiscussions = paginatedConvos.map((convo: any) => ({
            _id: convo._id,
            issue: {
                ...convo.issue.toObject(),
                raisedBy: formatUserData(convo.issue.raisedBy, convo.issue.raisedModel),
                selectStaff: formatUserData(convo.issue.selectStaff, convo.issue.staffSelectedModel)
            },
            response: convo.response ? {
                ...convo.response.toObject(),
                responsededBy: formatUserData(
                    convo.response.responsededBy,
                    convo.response.responsededModel
                )
            } : null,
            status: convo.response ? 'responded' : 'pending',
            createdAt: convo.createdAt,
            updatedAt: convo.updatedAt
        }));

        res.json({
            ok: true,
            data: {
                discussionId: populatedDiscussion._id,
                projectId: populatedDiscussion.projectId,
                discussions: formattedDiscussions,
                totalConversations: filteredConvos.length,
                page: Number(page),
                limit: Number(limit)
            }
        });

    } catch (error) {
        const err = error as Error;
        console.error('Get discussions error:', err);
        res.status(500).json({
            ok: false,
            error: err.message || 'Failed to fetch discussions'
        });
    }
};


//  Forward the issue to someother staff"
// controllers/issueDiscussion.controller.ts

export const forwardIssue = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId, convoId } = req.params;
        const {
            forwardToStaff,
            forwardToStaffRole
        } = req.body;

        if (!req.user) {
            return res.status(401).json({
                ok: false,
                message: 'Unauthorized'
            });
        }

        // Validate input
        if (!forwardToStaff || !forwardToStaffRole) {
            return res.status(400).json({
                ok: false,
                message: 'Forward recipient and role are required'
            });
        }

        const discussion = await IssueDiscussionModel.findOne({ projectId });
        if (!discussion) {
            return res.status(404).json({
                ok: false,
                message: 'Discussion not found'
            });
        }

        const convo = (discussion.discussion as any).id(convoId);
        if (!convo) {
            return res.status(404).json({
                ok: false,
                message: 'Conversation not found'
            });
        }

        // ✅ Validation 1: Check if user is the assigned staff
        if (convo.issue.selectStaff.toString() !== req.user._id) {
            return res.status(403).json({
                ok: false,
                message: 'Only the assigned staff can forward this issue'
            });
        }

        // ✅ Validation 2: Cannot forward to self
        if (forwardToStaff === req.user._id) {
            return res.status(400).json({
                ok: false,
                message: 'Cannot forward issue to yourself'
            });
        }

        // ✅ Validation 3: Cannot forward to original raiser
        if (forwardToStaff === convo.issue.raisedBy.toString()) {
            return res.status(400).json({
                ok: false,
                message: 'Cannot forward issue back to the person who raised it'
            });
        }

        // ✅ Validation 4: Check if already responded
        if (convo.response) {
            return res.status(400).json({
                ok: false,
                message: 'Cannot forward an issue that has already been responded to'
            });
        }

        // Validate role
        const allowedRoles = ["owner", "CTO", "staff", "worker"];
        if (!allowedRoles.includes(forwardToStaffRole)) {
            return res.status(400).json({
                ok: false,
                message: `Invalid role: ${forwardToStaffRole}`
            });
        }

        // Get model name based on role
        const staffSelectedModel = getModelNameByRole(forwardToStaffRole);

        // Store original assignee for notification
        const originalAssignee = convo.issue.selectStaff.toString();

        // ✅ Update the three fields
        convo.issue.selectStaff = new Types.ObjectId(forwardToStaff);
        convo.issue.staffSelectedModel = staffSelectedModel;
        convo.issue.selectStaffRole = forwardToStaffRole;

        await discussion.save();

        // Populate the updated conversation
        const populatedDiscussion = await populateDiscussion(discussion);
        const updatedConvo = (populatedDiscussion.discussion as any).id(convoId);

        // Format the conversation
        const formattedConvo = {
            _id: updatedConvo._id,
            issue: {
                ...updatedConvo.issue.toObject(),
                raisedBy: formatUserData(updatedConvo.issue.raisedBy, updatedConvo.issue.raisedModel),
                selectStaff: formatUserData(updatedConvo.issue.selectStaff, updatedConvo.issue.staffSelectedModel)
            },
            response: null,
            status: "pending",
            createdAt: updatedConvo.createdAt,
            updatedAt: updatedConvo.updatedAt
        };

        console.log("========== ISSUE FORWARDED ==========");
        console.log("From:", originalAssignee);
        console.log("To:", forwardToStaff);
        console.log("Convo ID:", convoId);
        console.log("====================================");

        // ✅ Emit socket event
        await SocketService.emitToProject(projectId.toString(), 'issue_forwarded', {
            projectId: projectId.toString(),
            convoId: convoId,
            conversation: formattedConvo,
            forwardedFrom: originalAssignee,
            forwardedTo: forwardToStaff
        });

        // Emit socket events
        await SocketService.emitToProject(projectId, 'new_issue_created', {
            discussionId: discussion._id,
            conversation: formattedConvo
        });

        // ✅ Notify new assignee
        SocketService.sendNotification(forwardToStaff, {
            type: 'issue_forwarded_to_you',
            title: 'Issue Forwarded to You',
            message: `An issue has been forwarded to you`,
            data: {
                projectId: projectId,
                convoId: convoId,
                forwardedFrom: originalAssignee
            }
        });

        // ✅ Notify original raiser
        SocketService.sendNotification(convo.issue.raisedBy.toString(), {
            type: 'your_issue_forwarded',
            title: 'Your Issue Was Forwarded',
            message: `Your issue has been reassigned to another staff member`,
            data: {
                projectId: projectId,
                convoId: convoId,
                forwardedTo: forwardToStaff
            }
        });

        res.json({
            ok: true,
            data: {
                conversation: formattedConvo,
                message: 'Issue forwarded successfully'
            }
        });

    } catch (error) {
        const err = error as Error;
        console.error('Forward issue error:', err);
        res.status(500).json({
            ok: false,
            message: err.message || 'Failed to forward issue'
        });
    }
};



/**
 * Delete a conversation (only by issue raiser or admin)
 */
export const deleteConversation = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId, convoId } = req.params;

        if (!req.user) {
            return res.status(401).json({
                ok: false,
                message: 'Unauthorized'
            });
        }

        const discussion = await IssueDiscussionModel.findOne({ projectId });
        if (!discussion) {
            return res.status(404).json({
                ok: false,
                message: 'Discussion not found'
            });
        }

        const convoIndex = discussion.discussion.findIndex(
            (convo: any) => convo._id.toString() === convoId
        );

        if (convoIndex === -1) {
            return res.status(404).json({
                ok: false,
                message: 'Conversation not found'
            });
        }

        const convo = discussion.discussion[convoIndex];

        // Check authorization (only raiser or owner can delete)
        if (convo.issue.raisedBy.toString() !== req.user._id && req.user.role !== 'owner') {
            return res.status(403).json({
                ok: false,
                message: 'You are not allowed to delete this conversation'
            });
        }

        // Remove the conversation
        discussion.discussion.splice(convoIndex, 1);
        await discussion.save();

        // Emit socket event
        await SocketService.emitToProject(discussion.projectId.toString(), 'issue_deleted', {
            discussionId: discussion._id,
            convoId
        });

        res.json({
            ok: true,
            message: 'Conversation deleted successfully'
        });

    } catch (error) {
        const err = error as Error;
        console.error('Delete conversation error:', err);
        res.status(500).json({
            ok: false,
            error: err.message || 'Failed to delete conversation'
        });
    }
};

/**
 * Get user's assigned issues across all projects
 */
export const getUserAssignedIssues = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json({
                ok: false,
                error: 'Unauthorized'
            });
        }

        const userId = req.user._id;
        const { status, page = 1, limit = 20 } = req.query;

        // Find all discussions where user is assigned
        const discussions = await IssueDiscussionModel.find({
            'discussion.issue.selectStaff': userId
        });

        let allAssignedConvos: any[] = [];

        // Process each discussion
        for (const discussion of discussions) {
            const populatedDiscussion = await populateDiscussion(discussion);

            // Filter conversations assigned to user
            const assignedConvos = populatedDiscussion.discussion.filter(
                (convo: any) => convo.issue.selectStaff?._id?.toString() === userId
            );

            // Add project info to each conversation
            const convosWithProject = assignedConvos.map((convo: any) => ({
                _id: convo._id,
                discussionId: discussion._id,
                projectId: discussion.projectId,
                issue: {
                    ...convo.issue.toObject(),
                    raisedBy: formatUserData(convo.issue.raisedBy, convo.issue.raisedModel),
                    selectStaff: formatUserData(convo.issue.selectStaff, 'StaffModel')
                },
                response: convo.response ? {
                    ...convo.response.toObject(),
                    responsededBy: formatUserData(
                        convo.response.responsededBy,
                        convo.response.responsededModel
                    )
                } : null,
                status: convo.response ? 'responded' : 'pending',
                createdAt: convo.createdAt,
                updatedAt: convo.updatedAt
            }));

            allAssignedConvos.push(...convosWithProject);
        }

        // Filter by status if provided
        if (status) {
            allAssignedConvos = allAssignedConvos.filter(convo => convo.status === status);
        }

        // Sort by creation date (newest first)
        allAssignedConvos.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Pagination
        const startIndex = (Number(page) - 1) * Number(limit);
        const endIndex = startIndex + Number(limit);
        const paginatedConvos = allAssignedConvos.slice(startIndex, endIndex);

        res.json({
            ok: true,
            data: {
                issues: paginatedConvos,
                total: allAssignedConvos.length,
                page: Number(page),
                limit: Number(limit)
            }
        });

    } catch (error) {
        const err = error as Error;
        console.error('Get user assigned issues error:', err);
        res.status(500).json({
            ok: false,
            error: err.message || 'Failed to fetch assigned issues'
        });
    }
};

/**
 * Get user's raised issues
 */
export const getUserRaisedIssues = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json({
                ok: false,
                error: 'Unauthorized'
            });
        }

        const userId = req.user._id;
        const userModel = getModelNameByRole(req.user.role);
        const { status, page = 1, limit = 20 } = req.query;

        // Find all discussions where user raised issues
        const discussions = await IssueDiscussionModel.find({
            'discussion.issue.raisedBy': userId,
            'discussion.issue.raisedModel': userModel
        });

        let allRaisedConvos: any[] = [];

        // Process each discussion
        for (const discussion of discussions) {
            const populatedDiscussion = await populateDiscussion(discussion);

            // Filter conversations raised by user
            const raisedConvos = populatedDiscussion.discussion.filter(
                (convo: any) =>
                    convo.issue.raisedBy?._id?.toString() === userId &&
                    convo.issue.raisedModel === userModel
            );

            // Add project info to each conversation
            const convosWithProject = raisedConvos.map((convo: any) => ({
                _id: convo._id,
                discussionId: discussion._id,
                projectId: discussion.projectId,
                issue: {
                    ...convo.issue.toObject(),
                    raisedBy: formatUserData(convo.issue.raisedBy, convo.issue.raisedModel),
                    selectStaff: formatUserData(convo.issue.selectStaff, 'StaffModel')
                },
                response: convo.response ? {
                    ...convo.response.toObject(),
                    responsededBy: formatUserData(
                        convo.response.responsededBy,
                        convo.response.responsededModel
                    )
                } : null,
                status: convo.response ? 'responded' : 'pending',
                createdAt: convo.createdAt,
                updatedAt: convo.updatedAt
            }));

            allRaisedConvos.push(...convosWithProject);
        }

        // Filter by status if provided
        if (status) {
            allRaisedConvos = allRaisedConvos.filter(convo => convo.status === status);
        }

        // Sort by creation date (newest first)
        allRaisedConvos.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Pagination
        const startIndex = (Number(page) - 1) * Number(limit);
        const endIndex = startIndex + Number(limit);
        const paginatedConvos = allRaisedConvos.slice(startIndex, endIndex);

        res.json({
            ok: true,
            data: {
                issues: paginatedConvos,
                total: allRaisedConvos.length,
                page: Number(page),
                limit: Number(limit)
            }
        });

    } catch (error) {
        const err = error as Error;
        console.error('Get user raised issues error:', err);
        res.status(500).json({
            ok: false,
            error: err.message || 'Failed to fetch raised issues'
        });
    }
};





//  CONTROLLERS USED FOR SOCCKETS

export const getRecentDiscussions = async (projectId: string, userId: string) => {
    try {
        // Find the discussion document for this project
        const discussion = await IssueDiscussionModel.findOne({ projectId });

        if (!discussion) {
            return {
                discussions: [],
                total: 0
            };
        }

        // Populate the discussion
        const populatedDiscussion = await populateDiscussion(discussion);

        // Get last 20 conversations (or customize the limit)
        const recentLimit = 20;
        const totalConversations = populatedDiscussion.discussion.length;
        const startIndex = Math.max(0, totalConversations - recentLimit);

        // Get recent conversations
        const recentConvos = populatedDiscussion.discussion
            .slice(startIndex)
            .reverse() // Most recent first
            .map((convo: any) => {
                // Check if this conversation involves the current user
                const isRaisedByUser = convo.issue.raisedBy?._id?.toString() === userId;
                const isAssignedToUser = convo.issue.selectStaff?._id?.toString() === userId;
                const isRespondedByUser = convo.response?.responsededBy?._id?.toString() === userId;

                return {
                    _id: convo._id,
                    discussionId: discussion._id,
                    projectId: discussion.projectId,
                    issue: {
                        _id: convo.issue._id,
                        issue: convo.issue.issue,
                        responseType: convo.issue.responseType,
                        isMessageRequired: convo.issue.isMessageRequired,
                        dropdownOptions: convo.issue.dropdownOptions,
                        raisedBy: formatUserData(convo.issue.raisedBy, convo.issue.raisedModel),
                        selectStaff: formatUserData(convo.issue.selectStaff, 'StaffModel'),
                        createdAt: convo.issue.createdAt,
                        updatedAt: convo.issue.updatedAt
                    },
                    response: convo.response ? {
                        _id: convo.response._id,
                        responseType: convo.response.responseType,
                        dropdownResponse: convo.response.dropdownResponse,
                        textResponse: convo.response.textResponse,
                        fileResponse: convo.response.fileResponse,
                        optionalMessage: convo.response.optionalMessage,
                        responsededBy: formatUserData(
                            convo.response.responsededBy,
                            convo.response.responsededModel
                        ),
                        createdAt: convo.response.createdAt,
                        updatedAt: convo.response.updatedAt
                    } : null,
                    status: convo.response ? 'responded' : 'pending',
                    userInvolvement: {
                        isRaisedByUser,
                        isAssignedToUser,
                        isRespondedByUser,
                        isInvolved: isRaisedByUser || isAssignedToUser || isRespondedByUser
                    },
                    createdAt: convo.createdAt,
                    updatedAt: convo.updatedAt
                };
            });

        // Get count of pending issues assigned to this user
        const pendingAssignedCount = populatedDiscussion.discussion.filter(
            (convo: any) =>
                convo.issue.selectStaff?._id?.toString() === userId &&
                !convo.response
        ).length;

        // Get count of user's raised issues that got responses
        const respondedToUserCount = populatedDiscussion.discussion.filter(
            (convo: any) =>
                convo.issue.raisedBy?._id?.toString() === userId &&
                convo.response
        ).length;

        return {
            discussions: recentConvos,
            total: totalConversations,
            stats: {
                pendingAssignedToUser: pendingAssignedCount,
                respondedToUser: respondedToUserCount,
                totalInProject: totalConversations
            }
        };

    } catch (error) {
        const err = error as Error;
        console.error('Get recent discussions error:', err);
        return {
            discussions: [],
            total: 0,
            error: err.message
        };
    }
};

/**
 * Get discussion statistics for a user in a project
 */
export const getDiscussionStats = async (projectId: string, userId: string, userRole: string) => {
    try {
        const discussion = await IssueDiscussionModel.findOne({ projectId });

        if (!discussion) {
            return {
                totalIssues: 0,
                raisedByUser: 0,
                assignedToUser: 0,
                respondedByUser: 0,
                pendingResponse: 0,
                resolved: 0
            };
        }

        const userModel = getModelNameByRole(userRole);

        const stats = {
            totalIssues: discussion.discussion.length,
            raisedByUser: 0,
            assignedToUser: 0,
            respondedByUser: 0,
            pendingResponse: 0,
            resolved: 0
        };

        discussion.discussion.forEach((convo: any) => {
            // Count raised by user
            if (convo.issue.raisedBy?.toString() === userId &&
                convo.issue.raisedModel === userModel) {
                stats.raisedByUser++;
            }

            // Count assigned to user
            if (convo.issue.selectStaff?.toString() === userId) {
                stats.assignedToUser++;

                // Count pending responses for assigned issues
                if (!convo.response) {
                    stats.pendingResponse++;
                }
            }

            // Count responded by user
            if (convo.response?.responsededBy?.toString() === userId &&
                convo.response?.responsededModel === userModel) {
                stats.respondedByUser++;
            }

            // Count resolved issues
            if (convo.response) {
                stats.resolved++;
            }
        });

        return stats;

    } catch (error) {
        const err = error as Error;
        console.error('Get discussion stats error:', err);
        return {
            totalIssues: 0,
            raisedByUser: 0,
            assignedToUser: 0,
            respondedByUser: 0,
            pendingResponse: 0,
            resolved: 0,
            error: err.message
        };
    }
};