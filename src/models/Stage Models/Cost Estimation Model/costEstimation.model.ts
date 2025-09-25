import mongoose, {  model, Schema, Types } from 'mongoose'

export interface ICostEstimaionUpload {
    type: "image" | "pdf";
    url: string;
    originalName?: string;
    uploadedAt: Date
}

export interface IMaterialCostItems {
    key: string;
    areaSqFt: number | null;
    predefinedRate: number | null;
    overriddenRate?: number | null;
    profitMargin: number | null;
    finalRate: number | null;
    totalCost: number | null;
}


export interface ICostEstimation {
    projectId: Types.ObjectId;

    materialEstimation: {
        name: string,
        totalCost: number,
        materials: IMaterialCostItems[]
        uploads: ICostEstimaionUpload[]
    }[];
          assignedTo: Types.ObjectId;

    labourEstimations: {
        workType: string;
        // workerId?: Types.ObjectId;
        noOfPeople: number,
        daysPlanned: number;
        weeklySalary: number;
        perdaySalary: number;
        totalCost: number;
        // uploads: ICostEstimaionUpload[]

    }[];


    totalMaterialCost: number;
    totalLabourCost: number;
    totalEstimation: number;

    isEditable: boolean;

    timer: {
        startedAt: Date | null;
        completedAt: Date | null;
        deadLine: Date | null;
        reminderSent: boolean;
    };

    status: "pending" | "completed";
}

const uploadSchema = new Schema<ICostEstimaionUpload>({
    type: { type: String, enum: ["image", "pdf"], required: true },
    url: { type: String, required: true },
    originalName: { type: String },
    uploadedAt: { type: Date, },
}, { _id: true });


const materialItemSchema = new Schema({
    key: { type: String, }, // e.g., "tvUnit", "lightingFixtures"
    areaSqFt: { type: Number, default: null },
    predefinedRate: { type: Number, default: null },
    profitMargin: { type: Number, default: null },
    overriddenRate: { type: Number, default: null },
    finalRate: { type: Number, default: null },
    totalCost: { type: Number, default: null },
}, { _id: false });


const roomSchema = new Schema({
    name: { type: String, }, // e.g., "Living Room"
    materials: [materialItemSchema],
    totalCost: { type: Number, default: null }, // sum of all item totalCosts
    uploads: [uploadSchema]
}, { _id: true });


const labourEstimationSchema = new Schema({
    workType: { type: String, required: true }, //carpentror
    // workerId: { type: mongoose.Schema.Types.ObjectId, ref: "WorkerModel", default: null },
    noOfPeople: { type: Number, default:null },
    daysPlanned: { type: Number, default: null },
    weeklySalary: { type: Number, default: null },
    perdaySalary: { type: Number, default: null },
    totalCost: { type: Number, default: null },
    // uploads: [uploadSchema]
}, { _id: true });

const costEstimationSchema = new Schema<ICostEstimation>({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProjectModel",
        required: true,
    },

    materialEstimation: [roomSchema],

    labourEstimations: [labourEstimationSchema],

    totalMaterialCost: { type: Number, default: 0 },
    totalLabourCost: { type: Number, default: 0 },
    totalEstimation: { type: Number, default: 0 },

    isEditable: { type: Boolean, default: true },

    timer: {
        startedAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },
        deadLine: { type: Date, default: null },
        reminderSent: { type: Boolean, default: false },
    },

      assignedTo:{
      type: Schema.Types.ObjectId,
      default: null,
      ref:"StaffModel"
    },

    status: {
        type: String,
        enum: ["pending", "completed"],
        default: "pending",
    },
}, { timestamps: true });

costEstimationSchema.index({projectId:1})
// costEstimationSchema.plugin(procurementLogger);


// export const CostEstimationModel = model<ICostEstimation>("CostEstimation", costEstimationSchema);