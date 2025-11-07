import { Schema, model, Document } from "mongoose";

import { Types } from "mongoose";

export interface IIssueDiscussion {
    _id?: Types.ObjectId
    organizationId: Types.ObjectId,
    projectId: Types.ObjectId,
    discussion: IConvo[],
    createdAt?: Date
    updatedAt?: Date
}

export interface IIssueFileType {
    type: "image" | "pdf";
    url: string;
    originalName?: string;
    uploadedAt: Date
}

export interface IConvo {
    _id?: Types.ObjectId
    issue: IIssueRaise,
    response?: IResponse
}

export interface IIssueRaise {
    _id?: Types.ObjectId,
    selectStaff: Types.ObjectId,
    selectStaffRole: string,
    staffSelectedModel: string,
    raisedBy: Types.ObjectId,
    raisedModel: string,
    issue: string,
    responseType: "dropdown" | "text" | "file",
    isMessageRequired: boolean,
    dropdownOptions?: string[],
    createdAt?: Date
    updatedAt?: Date
}

export interface IResponse {
    _id?: Types.ObjectId,
    issueId: Types.ObjectId,
    responsededBy: Types.ObjectId,
    responsededModel: string,
    responseType: "dropdown" | "text" | "file",
    // Response based on type - USE SEPARATE FIELDS
    dropdownResponse?: string;

    textResponse?: string;

    fileResponse?: IIssueFileType[];

    optionalMessage?: string

    createdAt?: Date;
    updatedAt?: Date;
}



export const IssueFileSchema = new Schema<IIssueFileType>({
    type: { type: String, enum: ["image", "pdf"] },
    url: { type: String },
    originalName: { type: String },
    uploadedAt: { type: Date, default: new Date() },
}, { _id: true });


export const ResponseSchema = new Schema<IResponse>({
    issueId: {
        type: Schema.Types.ObjectId,
        required: true,
    },

    // Dynamic reference using refPath
    responsededBy: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'response.responsededModel' // Path within the parent document
    },
    responsededModel: {
        type: String,
        required: true,
        enum: ["UserModel", "StaffModel", "CTOModel", "WorkerModel"]
    },

    responseType: {
        type: String,
        required: true,
        enum: ["dropdown", "text", "file"]
    },

    // Separate fields for different response types
    dropdownResponse: {
        type: String,
        required: function () {
            return this.responseType === 'dropdown';
        }
    },

    textResponse: {
        type: String,
        required: function () {
            return this.responseType === 'text';
        }
    },

    fileResponse: {
        type: [IssueFileSchema],
        required: function () {
            return this.responseType === 'file';
        },
        validate: {
            validator: function (files: IIssueFileType[]) {
                if (this.responseType === 'file') {
                    return files && files.length > 0;
                }
                return true;
            },
            message: 'At least one file is required for file response type'
        }
    },

    optionalMessage: {
        type: String
    }

}, {
    timestamps: true,
    _id: true
});

// Issue Raise Schema
export const IssueRaiseSchema = new Schema<IIssueRaise>({
    selectStaff: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'discussion.issue.staffSelectedModel' // Assuming staff is always from StaffModel
    },

    staffSelectedModel: {
        type: String,
        required: true,
        enum: ["UserModel", "StaffModel", "CTOModel", "WorkerModel"]
    },

    selectStaffRole:{
        type: String,
        enum: ["CTO", "worker", "owner", "staff"]
    },

    // Dynamic reference using refPath
    raisedBy: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'discussion.issue.raisedModel' // Path from parent document
    },
    raisedModel: {
        type: String,
        required: true,
        enum: ["UserModel", "StaffModel", "CTOModel", "WorkerModel"]
    },

    issue: {
        type: String,
        trim: true
    },

    responseType: {
        type: String,
        required: true,
        enum: ["dropdown", "text", "file"]
    },

    isMessageRequired: {
        type: Boolean,
        default: false
    },

    dropdownOptions: {
        type: [String], required:false
    }

}, {
    timestamps: true,
    _id: true
});

// Conversation Schema
export const ConvoSchema = new Schema<IConvo>({
    issue: {
        type: IssueRaiseSchema,
        required: true
    },
    response: {
        type: ResponseSchema,
        required: false // Response might not exist initially
    }
}, {
    _id: true,
    timestamps: true
});

// Main Discussion Schema
export const IssueDiscussionSchema = new Schema<IIssueDiscussion>({
    organizationId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'OrganizationModel',
    },

    projectId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'ProjectModel',
    },

    discussion: {
        type: [ConvoSchema],
        default: []
    }
}, {
    timestamps: true,
});



// Validation middleware
ResponseSchema.pre('save', function(next) {
    const response = this as any;
    
    // Count how many response types are filled
    const filledResponses = [
        !!response.dropdownResponse,
        !!response.textResponse,
        !!(response.fileResponse && response.fileResponse.length > 0)
    ].filter(Boolean);
    
    if (filledResponses.length !== 1) {
        return next(new Error('Exactly one response type must be provided based on responseType'));
    }
    
    // Validate that the correct response field is filled based on responseType
    switch(response.responseType) {
        case 'dropdown':
            if (!response.dropdownResponse) {
                return next(new Error('Dropdown response is required for dropdown type'));
            }
            break;
        case 'text':
            if (!response.textResponse) {
                return next(new Error('Text response is required for text type'));
            }
            break;
        case 'file':
            if (!response.fileResponse || response.fileResponse.length === 0) {
                return next(new Error('File response is required for file type'));
            }
            break;
    }
    
    next();
});

// Virtual for getting the issue status
ConvoSchema.virtual('status').get(function() {
    if (!this.response) {
        return 'pending';
    }
    return 'responded';
});

// Instance method to add a new conversation
IssueDiscussionSchema.methods.addConversation = function(convo: IConvo) {
    this.discussion.push(convo);
    return this.save();
};

// Static method to find discussions with population
// IssueDiscussionSchema.statics.findWithPopulation = function(filter: any) {
//     return this.find(filter)
//         .populate('projectId')
//         .populate({
//             path: 'discussion.issue.raisedBy',
//             select: 'staffName'
//         })
//         .populate({
//             path: 'discussion.issue.selectStaff',
//             model: 'StaffModel',
//             select: 'staffName'
//         })
//         .populate({
//             path: 'discussion.response.responsededBy',
//             select: 'staffName'
//         });
// };



export const IssueDiscussionModel = model<IIssueDiscussion>('IssueDiscussionModel', IssueDiscussionSchema);
