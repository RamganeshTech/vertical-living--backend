import { Schema, model, Document, Types } from 'mongoose';

export type TaskStatus = 'queued' | 'in_progress' | 'paused' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type DepartmentType = 'site' | 'procurement' | 'design' | 'accounts';

export interface TaskHistory {
    subTask:string | null
    status: TaskStatus;
    changedAt: Date;
    changedBy: Types.ObjectId;
    userModel: string
}


export interface ISTaskSchema {
    taskName: string
}

export interface IStaffTask extends Document {
    title: string;
    description: string;
    due: Date;
    status: TaskStatus;
    priority: TaskPriority;

    projectId: Types.ObjectId;
    organizationId: Types.ObjectId

    assigneeId: Types.ObjectId;
    assigneModel: string;
    assignedByModel: string;
    department: DepartmentType;

    assignedById: Types.ObjectId;
    tasks: IStaffTask[]
    history: TaskHistory[];
    dependentTaskId: Types.ObjectId | null
}

const HistorySchema = new Schema<TaskHistory>(
    {
     subTask:{type:String, default:null},
        status: {
            type: String,
            enum: ['queued', 'in_progress', 'paused', 'done', "start"],
        },
        changedAt: {
            type: Date,
            default: new Date()
        },
        changedBy: {
            type: Schema.Types.ObjectId,
            refPath: 'history.userModel',
        },
        userModel: {
            type: String,
            enum: ["UserModel", "StaffModel", "CTOModel", "WorkerModel"],
        }
    },
    { _id: true }
);

const StaffTaskSchema = new Schema<ISTaskSchema>({
    taskName: { type: String, default: null },
}, { _id: true })

const StaffMainTaskSchema = new Schema<IStaffTask>(
    {
        title: {
            type: String,
        },

        description: {
            type: String,
        },

        due: {
            type: Date,
            default: new Date()
        },
        status: {
            type: String,
            enum: ['queued', 'in_progress', 'paused', 'done'],
            default: 'queued'
        },

        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: 'OrganizationModel'
        },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: 'ProjectModel'
        },

        assigneeId: {
            type: Schema.Types.ObjectId,
            refPath: 'assigneModel',
        },
        assigneModel: {
            type: String,
            enum: ["UserModel", "StaffModel", "CTOModel", "WorkerModel"],
        },

        department: {
            type: String,
            enum: ['site', 'procurement', 'design', 'accounts'],
        },

        assignedById: {
            type: Schema.Types.ObjectId,
            ref: 'assignedByModel',
        },
        assignedByModel: {
            type: String,
            enum: ["UserModel", "StaffModel", "CTOModel", "WorkerModel"],
        },
        dependentTaskId: {
            type: Schema.Types.ObjectId,
            ref: 'StaffTaskModel', // Referring main task _id which needs to be completed first
            default: null
        },
        tasks: {
            type: [StaffTaskSchema],
            default: []
        },
        history: {
            type: [HistorySchema],
            default: []
        },
    },
    {
        timestamps: true
    }
);

const StaffMainTaskModel = model<IStaffTask>('StaffTaskModel', StaffMainTaskSchema);
export default StaffMainTaskModel;


