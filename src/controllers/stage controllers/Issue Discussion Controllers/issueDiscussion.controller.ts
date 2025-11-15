// controllers/discussion.controller.ts

import { Response } from 'express';
// import { RoleBasedRequest } from '../types/request.types';
// import { IssueDiscussionModel } from '../models/IssueDiscussion.model';
import { populateDiscussion, formatUserData } from './populateDiscussion.util';
// import { SocketService } from '../services/socketService';
import { Types } from 'mongoose';
import { RoleBasedRequest } from '../../../types/types';
import { IConvo, IssueDiscussionModel } from '../../../models/Stage Models/Issue Discussion Model/issueDiscussion.model';
import { SocketService } from '../../../config/socketService';
import { getModelNameByRole } from '../../../utils/common features/utils';

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
        // let discussion;

        // = await IssueDiscussionModel.findOne({
        //     organizationId,
        // });

        // if (!discussion) {
        let discussion = new IssueDiscussionModel({
            organizationId,
            // projectId,
            discussion: []
        });
        // }

        let staffSelectedModel = getModelNameByRole(selectStaffRole);

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
                projectId: new Types.ObjectId(projectId),
                raisedBy: new Types.ObjectId(raisedBy),
                raisedModel,
                issue,
                isRead: false,
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
        // const populatedDiscussion = await populateDiscussion(discussion);


        const populatedDiscussion = await populateDiscussion(discussion);
        const conversation = populatedDiscussion.discussion[0];

        // ✅ Format the full IssueDiscussion document
        const formattedDiscussion = {
            _id: populatedDiscussion._id,
            organizationId: populatedDiscussion.organizationId,
            discussion: [{
                _id: conversation._id,
                issue: {
                    ...conversation.issue.toObject(),
                    raisedBy: formatUserData(conversation.issue.raisedBy, conversation.issue.raisedModel),
                    selectStaff: formatUserData(conversation.issue.selectStaff, conversation.issue.staffSelectedModel)
                },
                createdAt: conversation.createdAt,
                updatedAt: conversation.updatedAt
            }],
            createdAt: populatedDiscussion.createdAt,
            updatedAt: populatedDiscussion.updatedAt,
            __v: populatedDiscussion.__v
        };


        

        // ✅ CHANGED: Use emitToOrgDiscussion instead of emitToProject
        await SocketService.emitToOrgDiscussion(organizationId, 'new_issue_created', {
            discussionId: discussion._id,
            conversation: formattedDiscussion,
            projectId  // Include projectId in data if needed
        });



        console.log("conversation", conversation.issue)
        console.log("selectStaff", conversation.issue.selectStaff._id.toString())
        await getUnreadTicketCountUtil(formattedDiscussion.organizationId, conversation.issue.selectStaff._id.toString());

        // Send notification to assigned staff
        // SocketService.sendNotification(selectStaff, {
        //     type: 'issue_assigned',
        //     title: 'New Issue Assigned',
        //     message: `You have been assigned a new issue: ${issue}`,
        //     data: {
        //         discussionId: discussion._id,
        //         convoId: discussion._id,
        //         projectId,
        //         issueTitle: issue
        //     }
        // });

        res.status(201).json({
            ok: true,
            data: {
                discussionId: discussion._id,
                // conversation: formattedConvo,
                conversation: populatedDiscussion.toObject(), // Return full document
                projectId,
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
        const { organizationId, convoId } = req.params;
        const { responseContent, optionalMessage, } = req.body;

        console.log("convoId", convoId)
        if (!req.user) {
            return res.status(401).json({
                ok: false,
                message: 'Unauthorized'
            });
        }

        // Get responder info
        const responsededBy = req.user._id;
        const responsededModel = getModelNameByRole(req.user.role);

        const discussion = await IssueDiscussionModel.findOne({ organizationId, _id: convoId });
        if (!discussion) {
            return res.status(404).json({
                ok: false,
                message: 'Discussion not found'
            });
        }

        const convo = discussion.discussion[0];
        // if (!convo) {
        //     return res.status(404).json({
        //         ok: false,
        //         message: 'Conversation not found'
        //     });
        // }

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
        // const updatedConvo = populatedDiscussion.discussion.id(convoId);

        // const formattedConvo = {
        //     _id: updatedConvo._id,
        //     issue: {
        //         ...updatedConvo.issue.toObject(),
        //         raisedBy: formatUserData(updatedConvo.issue.raisedBy, updatedConvo.issue.raisedModel),
        //         // selectStaff: formatUserData(updatedConvo.issue.selectStaff, 'StaffModel')
        //         selectStaff: formatUserData(updatedConvo.issue.selectStaff, updatedConvo.issue.staffSelectedModel)
        //     },
        //     response: {
        //         ...updatedConvo.response.toObject(),
        //         responsededBy: formatUserData(
        //             updatedConvo.response.responsededBy,
        //             updatedConvo.response.responsededModel
        //         )
        //     },
        //     status: "responded",
        //     createdAt: updatedConvo.createdAt,
        //     updatedAt: updatedConvo.updatedAt
        // }

        // Emit socket events
        // await SocketService.emitToProject(discussion.projectId.toString(), 'issue_response_added', {
        //     discussionId: discussion._id,
        //     convoId,
        //     response: formattedConvo.response 
        // });

        const projectIdString = convo.issue.projectId.toString();

        // ✅ FIXED: Extract _id from populated projectId
        // const projectIdString = discussion.projectId._id
        //     ? discussion.projectId._id.toString()
        //     : projectId; // Fallback to param if not populated


        // ✅ ADD THESE LOGS
        console.log("========== EMITTING SOCKET EVENT ==========");
        console.log("Project ID:", projectIdString.toString());
        console.log("Convo ID:", convoId);
        console.log("==========================================");

        // await SocketService.emitToProject(projectIdString, 'issue_response_added', {
        //     projectId: projectIdString,  // ✅ Add projectId
        //     convoId: String(convoId),                           // ✅ Keep convoId as string
        //     conversation: formattedConvo,               // ✅ Add full conversation
        //     response: formattedConvo.response           // ✅ Keep response for backward compatibility
        // });


        const conversation = populatedDiscussion.discussion[0];

        // ✅ Format the full IssueDiscussion document
        const formattedDiscussion = {
            _id: populatedDiscussion._id,
            organizationId: populatedDiscussion.organizationId,
            discussion: [{
                _id: conversation._id,
                issue: {
                    ...conversation.issue.toObject(),
                    raisedBy: formatUserData(conversation.issue.raisedBy, conversation.issue.raisedModel),
                    selectStaff: formatUserData(conversation.issue.selectStaff, conversation.issue.staffSelectedModel)
                },
                response: {
                    ...conversation.response.toObject(),
                    responsededBy: formatUserData(
                        conversation.response.responsededBy,
                        conversation.response.responsededModel
                    )
                },
                createdAt: conversation.createdAt,
                updatedAt: conversation.updatedAt
            }],
            createdAt: populatedDiscussion.createdAt,
            updatedAt: populatedDiscussion.updatedAt,
            __v: populatedDiscussion.__v
        };


        console.log("formattedDiscussion:", JSON.stringify(formattedDiscussion, null, 2));


        // ✅ CHANGED: Use emitToOrgDiscussion
        await SocketService.emitToOrgDiscussion(organizationId, 'issue_response_added', {
            projectId: projectIdString,  // ✅ Add projectId
            convoId: String(convoId),
            conversation: formattedDiscussion,
            // response: formattedConvo.response
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
                response: formattedDiscussion,
                // conversation: formattedConvo  // ✅ Optionally return full conversation
                conversation: populatedDiscussion.toObject() // Return full document

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
// export const getProjectDiscussions = async (req: RoleBasedRequest, res: Response): Promise<any> => {
//     try {
//         const { organizationId } = req.params;
//         const { page = 1, limit = 20, search = "",
//             projectId = "",
//             myTickets = "false",
//             notResponded = "false",
//             sortBy = "createdAt",
//             sortOrder = "desc", } = req.query;

//         if (!req.user) {
//             return res.status(401).json({
//                 ok: false,
//                 error: 'Unauthorized'
//             });
//         }

//         const query: any = { organizationId };

//         const discussions = await IssueDiscussionModel.find(query);

//         if (!discussions || discussions.length === 0) {
//             return res.json({
//                 ok: true,
//                 data: {
//                     discussionId: null,
//                     discussions: [],
//                     totalConversations: 0,
//                     page: Number(page),
//                     limit: Number(limit)
//                 }
//             });
//         }

//         // Populate discussions
//         // const populatedDiscussion = await populateDiscussion(discussion);

//         // ✅ CHANGED: Populate ALL documents and merge their discussions
//         let allConversations: any[] = [];

//         for (const discussion of discussions) {
//             const populatedDiscussion = await populateDiscussion(discussion);

//             console.log("populatedDiscussion", populatedDiscussion)
//             allConversations.push(populatedDiscussion.toObject());
//         }


//         // Filter conversations based on query params
//         let filteredDiscussions = allConversations;

//         console.log("allConversations first dsicussion", allConversations[0].discussion)
//         console.log("allConversations", allConversations)


//         console.log("filteredDiscussions ", filteredDiscussions)
//         // if (projectId) {
//         //     filteredDiscussions = filteredDiscussions.filter(
//         //         (convo: any) => convo.issue.projectId?._id?.toString() === projectId
//         //     );
//         // }




//         // Filter by projectId
//         if (projectId) {
//             filteredDiscussions = filteredDiscussions.filter(doc =>
//                 doc.discussion[0]?.issue?.projectId?._id?.toString() === projectId
//             );
//         }



//         // Pagination
//         const startIndex = (Number(page) - 1) * Number(limit);
//         const endIndex = startIndex + Number(limit);
//         const paginatedConvos = filteredDiscussions.slice(startIndex, endIndex);
//         const totalConversations = filteredDiscussions?.length || 0;
//         // Format all conversations
//         // const formattedDiscussions = paginatedConvos.map((convo: any) => ({
//         //     _id: convo._id,
//         //     issue: {
//         //         ...convo.issue.toObject(),
//         //         raisedBy: formatUserData(convo.issue.raisedBy, convo.issue.raisedModel),
//         //         selectStaff: formatUserData(convo.issue.selectStaff, convo.issue.staffSelectedModel)
//         //     },
//         //     response: convo.response ? {
//         //         ...convo.response.toObject(),
//         //         responsededBy: formatUserData(
//         //             convo.response.responsededBy,
//         //             convo.response.responsededModel
//         //         )
//         //     } : null,
//         //     status: convo.response ? 'responded' : 'pending',
//         //     createdAt: convo.createdAt,
//         //     updatedAt: convo.updatedAt
//         // }));


//         const formattedDiscussions = paginatedConvos.map((doc: any) => {
//             console.log("convo of document", doc)
//             const convo = doc.discussion[0];

//             console.log("convo of thedocu", convo)

//             return {
//                 _id: doc._id,
//                 organizationId: doc.organizationId,
//                 discussion: [{
//                     _id: convo?._id,
//                     issue: {
//                         ...convo.issue,
//                         raisedBy: formatUserData(convo.issue.raisedBy, convo.issue.raisedModel),
//                         selectStaff: formatUserData(convo.issue.selectStaff, convo.issue.staffSelectedModel)
//                     },
//                     response: convo.response ? {
//                         ...convo.response,
//                         responsededBy: formatUserData(
//                             convo.response.responsededBy,
//                             convo.response.responsededModel
//                         )
//                     } : undefined,
//                     createdAt: convo.createdAt,
//                     updatedAt: convo.updatedAt
//                 }],
//                 createdAt: doc.createdAt,
//                 updatedAt: doc.updatedAt,
//                 __v: doc.__v
//             };
//         });


//         res.json({
//             ok: true,
//             data: {
//                 // projectId: populatedDiscussion.projectId,
//                 discussions: formattedDiscussions,
//                 totalConversations: totalConversations,
//                 page: Number(page),
//                 limit: Number(limit),
//                 totalPages: Math.ceil(totalConversations / Number(limit)) // ✅ ADDED: Helpful for
//             }
//         });

//     } catch (error) {
//         const err = error as Error;
//         console.error('Get discussions error:', err);
//         res.status(500).json({
//             ok: false,
//             error: err.message || 'Failed to fetch discussions'
//         });
//     }
// };


//  Forward the issue to someother staff"
// controllers/issueDiscussion.controller.ts



export const getProjectDiscussions = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.params;
        const {
            page = 1,
            limit = 20,
            search = "",
            projectId = "",
            myTickets = "false",
            notResponded = "false",
            sortBy = "createdAt",
            sortOrder = "desc",
        } = req.query as any;


        if (!req.user) {
            return res.status(401).json({ ok: false, error: "Unauthorized" });
        }

        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 20;
        const myTicketsBool = String(myTickets) === "true";
        const notRespondedBool = String(notResponded) === "true";
        const sortDir = String(sortOrder).toLowerCase() === "asc" ? 1 : -1;

        // 🟢 fetch all docs for org
        const docs = await IssueDiscussionModel.find({ organizationId });

        if (!docs || docs.length === 0) {
            return res.json({
                ok: true,
                data: {
                    discussions: [],
                    totalConversations: 0,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: 0,
                },
            });
        }

        // 🟢 populate each doc and FLATTEN ALL conversations
        let allConvos: {
            parentId: any;
            organizationId: any;
            convo: any; // populated discussion subdoc
            createdAt: Date;
            updatedAt: Date;
        }[] = [];

        for (const d of docs) {
            const populated = await populateDiscussion(d); // assumes populates discussion.issue/response users/projects
            const obj = populated.toObject();
            const arr = Array.isArray(obj.discussion) ? obj.discussion : [];

            for (const c of arr) {
                allConvos.push({
                    parentId: obj._id,
                    organizationId: obj.organizationId,
                    convo: c,
                    createdAt: c.createdAt,
                    updatedAt: c.updatedAt,
                });
            }
        }

        // 🟢 FILTERS

        // search across issue text, project name, raisedBy/selectStaff names
        const q = String(search).trim().toLowerCase();
        if (q) {
            allConvos = allConvos.filter(({ convo }) => {
                const issueText = convo?.issue?.issue || "";
                const pName = convo?.issue?.projectId?.projectName || "";
                const raisedName = convo?.issue?.raisedBy?.name || "";
                const staffName = convo?.issue?.selectStaff?.name || "";
                const issue = convo?.issue?.issue || "";
                const textResponse = convo?.response?.textResponse || "";
                const dropdownResponse = convo?.response?.dropdownResponse || "";
                return (
                    issueText.toLowerCase().includes(q) ||
                    pName.toLowerCase().includes(q) ||
                    raisedName.toLowerCase().includes(q) ||
                    staffName.toLowerCase().includes(q) ||
                    issue.toLowerCase().includes(q) ||
                    textResponse.toLowerCase().includes(q) ||
                    dropdownResponse.toLowerCase().includes(q)
                );
            });
        }

        // filter by project
        if (projectId) {
            allConvos = allConvos.filter(
                ({ convo }) =>
                    convo?.issue?.projectId?._id?.toString() === String(projectId)
            );
        }

        // myTickets -> assigned to current user
        if (myTicketsBool) {
            allConvos = allConvos.filter(
                ({ convo }) =>
                    convo?.issue?.selectStaff?._id?.toString() === req.user!._id.toString()
            );
        }

        // notResponded -> no response
        if (notRespondedBool) {
            allConvos = allConvos.filter(({ convo }) => !convo?.response);
        }

        // 🟢 SORT (by convo createdAt/updatedAt)
        allConvos.sort((a, b) => {
            let aVal: any = a[sortBy as "createdAt" | "updatedAt"] ?? a.createdAt;
            let bVal: any = b[sortBy as "createdAt" | "updatedAt"] ?? b.createdAt;
            const ad = new Date(aVal).getTime();
            const bd = new Date(bVal).getTime();
            return sortDir === 1 ? ad - bd : bd - ad;
        });

        // 🟢 PAGINATION
        const totalConversations = allConvos.length;
        const start = (pageNum - 1) * limitNum;
        const end = start + limitNum;
        const pageItems = allConvos.slice(start, end);

        // 🟢 FORMAT OUTPUT (compatible shape)
        const formattedDiscussions = pageItems.map(({ parentId, organizationId, convo }) => ({
            _id: parentId, // parent doc id
            organizationId,
            discussion: [
                {
                    _id: convo?._id,
                    issue: {
                        ...convo.issue,
                        raisedBy: formatUserData(convo.issue.raisedBy, convo.issue.raisedModel),
                        selectStaff: formatUserData(convo.issue.selectStaff, convo.issue.staffSelectedModel),
                    },
                    response: convo.response
                        ? {
                            ...convo.response,
                            responsededBy: formatUserData(
                                convo.response.responsededBy,
                                convo.response.responsededModel
                            ),
                        }
                        : undefined,
                    createdAt: convo.createdAt,
                    updatedAt: convo.updatedAt,
                },
            ],
            createdAt: convo.createdAt,
            updatedAt: convo.updatedAt,
        }));

        return res.json({
            ok: true,
            data: {
                discussions: formattedDiscussions,
                totalConversations,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(totalConversations / limitNum),
            },
        });
    } catch (error) {
        const err = error as Error;
        console.error("Get discussions error:", err);
        res.status(500).json({
            ok: false,
            error: err.message || "Failed to fetch discussions",
        });
    }
};


export const forwardIssue = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { organizationId, convoId } = req.params;
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

        const discussion = await IssueDiscussionModel.findById(convoId);
        if (!discussion) {
            return res.status(404).json({
                ok: false,
                message: 'Discussion not found'
            });
        }

        const convo = discussion.discussion[0] || {
            issue: null,
            response: null
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

        // ✅ Update the four fields
        convo.issue.selectStaff = new Types.ObjectId(forwardToStaff);
        convo.issue.staffSelectedModel = staffSelectedModel;
        convo.issue.selectStaffRole = forwardToStaffRole;
        convo.issue.isRead = false;

        await discussion.save();

        // Populate the updated conversation
        const populatedDiscussion = await populateDiscussion(discussion);
        // const updatedConvo = (populatedDiscussion.discussion as any).id(convoId);

        const conversation = populatedDiscussion.discussion[0];

        // ✅ Format the full IssueDiscussion document
        const formattedDiscussion = {
            _id: populatedDiscussion._id,
            organizationId: populatedDiscussion.organizationId,
            discussion: [{
                _id: conversation._id,
                issue: {
                    ...conversation.issue.toObject(),
                    raisedBy: formatUserData(conversation.issue.raisedBy, conversation.issue.raisedModel),
                    selectStaff: formatUserData(conversation.issue.selectStaff, conversation.issue.staffSelectedModel)
                },
                createdAt: conversation.createdAt,
                updatedAt: conversation.updatedAt
            }],
            createdAt: populatedDiscussion.createdAt,
            updatedAt: populatedDiscussion.updatedAt,
            __v: populatedDiscussion.__v
        };




        // ✅ Get projectId from the issue
        const projectId = conversation.issue.projectId.toString();


        console.log("========== ISSUE FORWARDED ==========");
        console.log("From:", originalAssignee);
        console.log("To:", forwardToStaff);
        console.log("Convo ID:", convoId);
        console.log("Project ID:", projectId);
        console.log("====================================");





        // ✅ Emit socket event
        // await SocketService.emitToProject(projectId.toString(), 'issue_forwarded', {
        //     projectId: projectId.toString(),
        //     convoId: convoId,
        //     conversation: formattedConvo,
        //     forwardedFrom: originalAssignee,
        //     forwardedTo: forwardToStaff
        // });

        // Emit socket events
        // await SocketService.emitToProject(projectId, 'new_issue_created', {
        //     discussionId: discussion._id,
        //     conversation: formattedConvo
        // });


        // ✅ CHANGED: Use emitToOrgDiscussion
        await SocketService.emitToOrgDiscussion(organizationId, 'issue_forwarded', {
            discussionId: discussion._id,
            // conversation: formattedConvo,
            conversation: formattedDiscussion, // Full document
            convoId,
            forwardedBy: req.user?._id
        });


        // await getUnreadTicketCountUtil(organizationId, formattedDiscussion.discussion[0].issue.selectStaff._id);
        await getUnreadTicketCountUtil(formattedDiscussion.organizationId, conversation.issue.selectStaff._id.toString());



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
                // conversation: formattedConvo,
                conversation: populatedDiscussion.toObject(), // Return full document

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
        const { convoId, organizationId } = req.params;

        if (!req.user) {
            return res.status(401).json({
                ok: false,
                message: 'Unauthorized'
            });
        }

        const discussion = await IssueDiscussionModel.findById(convoId);
        if (!discussion) {
            return res.status(404).json({
                ok: false,
                message: 'Discussion not found'
            });
        }

        // const convoIndex = discussion.discussion.findIndex(
        //     (convo: any) => convo._id.toString() === convoId
        // );

        // if (convoIndex === -1) {
        //     return res.status(404).json({
        //         ok: false,
        //         message: 'Conversation not found'
        //     });
        // }

        const convo = discussion.discussion[0];

        // Check authorization (only raiser or owner can delete)
        if (convo.issue.raisedBy.toString() !== req.user._id && req.user.role !== 'owner') {
            return res.status(403).json({
                ok: false,
                message: 'You are not allowed to delete this conversation'
            });
        }

        await IssueDiscussionModel.findByIdAndDelete(convoId);


        // Remove the conversation

        // Emit socket event
        // await SocketService.emitToProject(convo.issue.projectId.toString(), 'issue_deleted', {
        //     discussionId: discussion._id,
        //     convoId
        // });



        // ✅ CHANGED: Use emitToOrgDiscussion
        await SocketService.emitToOrgDiscussion(organizationId, 'issue_deleted', {
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
 * Mark all as read
 * PATCH /api/notifications/mark-all-read
 */
export const markAllTicketAsRead = async (req: RoleBasedRequest, res: Response) => {
    try {
        const { organizationId } = req.params
        const userId = req.user?._id!;

        // await IssueDiscussionModel.updateMany({ organizationId, "discussion.$.issue.selectedStaff": userId, isRead: false }, { isRead: true });

          await IssueDiscussionModel.updateMany(
            {
                organizationId,
                "discussion.issue.selectStaff": userId,
                "discussion.issue.isRead": false
            },
            {
                $set: { "discussion.$[elem].issue.isRead": true }
            },
            {
                arrayFilters: [
                    {
                        "elem.issue.selectStaff": userId,
                        "elem.issue.isRead": false
                    }
                ]
            }
        );

        res.status(200).json({
            ok: true,
            message: 'All Tickets marked as read',
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            message: 'Error marking all as read',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};


    export const getUnreadTicketCountUtil = async (organizationId: string, userId: string) => {
        try {
           
            const count = await IssueDiscussionModel.countDocuments({
                organizationId,
                discussion: {
                    $elemMatch: {
                        "issue.selectStaff": userId,
                        "issue.isRead": false
                    }
                }
            });

            console.log("unread count", count)

            // Emit to the per-user socket room
            SocketService.emitToUserTicketRoom(userId, 'unread_ticket_count_update', { count });

            return count || 0;
        } catch (error) {
            throw error;
        }

    }



export const getUnreadTicketCount = async (req: RoleBasedRequest, res: Response) => {
    try {
        const { organizationId } = req.params

        const userId = req.user?._id!;

        const count = await getUnreadTicketCountUtil(organizationId, userId);

        res.status(200).json({
            ok: true,
            message: 'Unread count fetched successfully',
            count,
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            message: 'Error fetching unread count',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};


/**
 * Get user's assigned issues across all projects
 */
// export const getUserAssignedIssues = async (req: RoleBasedRequest, res: Response): Promise<any> => {
//     try {
//         if (!req.user) {
//             return res.status(401).json({
//                 ok: false,
//                 error: 'Unauthorized'
//             });
//         }

//         const userId = req.user._id;
//         const { status, page = 1, limit = 20 } = req.query;

//         // Find all discussions where user is assigned
//         const discussions = await IssueDiscussionModel.find({
//             'discussion.issue.selectStaff': userId
//         });

//         let allAssignedConvos: any[] = [];

//         // Process each discussion
//         for (const discussion of discussions) {
//             const populatedDiscussion = await populateDiscussion(discussion);

//             // Filter conversations assigned to user
//             const assignedConvos = populatedDiscussion.discussion.filter(
//                 (convo: any) => convo.issue.selectStaff?._id?.toString() === userId
//             );

//             // Add project info to each conversation
//             const convosWithProject = assignedConvos.map((convo:any) => ({
//                 _id: convo._id,
//                 discussionId: discussion._id,
//                 projectId: convo.projectId,
//                 issue: {
//                     ...convo.issue.toObject(),
//                     raisedBy: formatUserData(convo.issue.raisedBy, convo.issue.raisedModel),
//                     selectStaff: formatUserData(convo.issue.selectStaff, 'StaffModel')
//                 },
//                 response: convo.response ? {
//                     ...convo.response.toObject(),
//                     responsededBy: formatUserData(
//                         convo.response.responsededBy,
//                         convo.response.responsededModel
//                     )
//                 } : null,
//                 status: convo.response ? 'responded' : 'pending',
//                 createdAt: convo.createdAt,
//                 updatedAt: convo.updatedAt
//             }));

//             allAssignedConvos.push(...convosWithProject);
//         }

//         // Filter by status if provided
//         if (status) {
//             allAssignedConvos = allAssignedConvos.filter(convo => convo.status === status);
//         }

//         // Sort by creation date (newest first)
//         allAssignedConvos.sort((a, b) =>
//             new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
//         );

//         // Pagination
//         const startIndex = (Number(page) - 1) * Number(limit);
//         const endIndex = startIndex + Number(limit);
//         const paginatedConvos = allAssignedConvos.slice(startIndex, endIndex);

//         res.json({
//             ok: true,
//             data: {
//                 issues: paginatedConvos,
//                 total: allAssignedConvos.length,
//                 page: Number(page),
//                 limit: Number(limit)
//             }
//         });

//     } catch (error) {
//         const err = error as Error;
//         console.error('Get user assigned issues error:', err);
//         res.status(500).json({
//             ok: false,
//             error: err.message || 'Failed to fetch assigned issues'
//         });
//     }
// };

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

export const getRecentDiscussions = async (organizationId: string, userId: string) => {
    try {
        // Find the discussion document for this project
        const discussion = await IssueDiscussionModel.findOne({ organizationId });

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
                    issue: {
                        _id: convo.issue._id,
                        issue: convo.issue.issue,
                        projectId: convo.issue.projectId,
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