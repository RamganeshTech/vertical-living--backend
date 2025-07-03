
// import mongoose, { Schema , Types} from "mongoose";


// export interface IFileItem {
//   type: "image" | "pdf";
//   url: string;
//   originalName?: string;
//   uploadedAt?: Date;
// }

// export interface ISection {
//   imagesAndPdfs: IFileItem[];
// }

// export interface ISampleDesign {
//   _id?: Types.ObjectId;
//   projectId: Types.ObjectId;
//   kitchen?: ISection;
//   wardrobe?: ISection;
//   livingHall?: ISection;
//   bedroom?: ISection;
//   timer: {
//     startedAt: Date | null;
//     completedAt: Date | null;
//     deadLine: Date | null;
//   };
//   status: "pending" | "completed";
//   additionalNotes?: string | null;
//   isEditable: boolean;
//   createdAt?: Date;
//   updatedAt?: Date;
// }


// const fileSchema = new Schema<IFileItem>({
//     type: { type: String, enum: ["image", "pdf"], required: true },
//     url: { type: String, required: true },
//     originalName: String,
//     uploadedAt: { type: Date, default: new Date() }
// }, { _id: false });

// const sectionSchema = new Schema<ISection>({
//     imagesAndPdfs: [fileSchema]
// }, { _id: false });

// const sampleDesignSchema = new Schema<ISampleDesign>({
//     projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", required: true },
//     kitchen: sectionSchema,
//     wardrobe: sectionSchema,
//     livingHall: sectionSchema,
//     bedroom: sectionSchema,
//     timer: {
//         startedAt: { type: Date, default: null },
//         completedAt: { type: Date, default: null },
//         deadLine: { type: Date, default: null },
//     },
//     status: {
//         type: String,
//         enum: ["pending", "completed"],
//         default: "pending"
//     },
//     additionalNotes: {
//         type: String,
//         default: null
//     },
//     isEditable: { type: Boolean, default: true }
// }, { timestamps: true });

// export const SampleDesignModel = mongoose.model<ISampleDesign>("SampleDesignModel", sampleDesignSchema);


import mongoose, { Types, Schema } from "mongoose";
import { type } from "os";


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
  type: { type: String, enum: ["image", "pdf"], required: true },
  url: { type: String, required: true },
  originalName: String,
  uploadedAt: { type: Date, default: new Date() }
});

const dynamicRoomSchema = new Schema<IRoom>({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  roomName: { type: String, required: true }, // e.g., "Master Bedroom", "Office Room"
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

export const SampleDesignModel = mongoose.model("SampleDesignModel", sampleDesignSchema);
