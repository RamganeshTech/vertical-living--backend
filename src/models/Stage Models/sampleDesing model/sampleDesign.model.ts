import mongoose, { Types, Schema } from "mongoose";
import { type } from "os";
import procurementLogger from "../../../Plugins/ProcurementDeptPluggin";


export interface IFileItem {
  type: "image" | "pdf";
  url: string;
  originalName?: string;
  uploadedAt?: Date;
}

export interface IRoom {
  _id?: Types.ObjectId
  roomName: string;
  files: IFileItem[];
}

export interface ISampleDesign {
  projectId: Types.ObjectId;
  rooms: IRoom[];
  timer: {
    startedAt: Date | null;
    completedAt: Date | null;
    deadLine: Date | null;
    reminderSent: boolean
  };
  status: "pending" | "completed";
  assignedTo: Types.ObjectId;
  additionalNotes?: string | null;
  isEditable: boolean;
}

const fileSchema = new Schema<IFileItem>({
  type: { type: String, enum: ["image", "pdf"] },
  url: { type: String,  },
  originalName: String,
  uploadedAt: { type: Date, default: new Date() }
}, {_id: true});

const dynamicRoomSchema = new Schema<IRoom>({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  roomName: { type: String, }, // e.g., "Master Bedroom", "Office Room"
  files: [fileSchema]
});

const sampleDesignSchema = new Schema<ISampleDesign>({
  projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", required: true },
  rooms: [dynamicRoomSchema],
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

  status: { type: String, enum: ["pending", "completed"], default: "pending" },
  additionalNotes: { type: String, default: null },
  isEditable: { type: Boolean, default: true }
}, { timestamps: true });


sampleDesignSchema.index({projectId:1})


sampleDesignSchema.plugin(procurementLogger)


export const SampleDesignModel = mongoose.model("SampleDesignModel", sampleDesignSchema);
