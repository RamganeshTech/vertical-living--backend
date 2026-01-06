import mongoose from "mongoose";

const WorkerToolPermissionSchema = new mongoose.Schema(
{
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: "WorkerModel",  },
  allowedCategory: {
    type: String,
    // enum: ["Drill", "Saw", "Grinder", "Cutter"]
  }
},
{ timestamps: true }
);

// WorkerToolPermissionSchema.index(
//   { workerId: 1, allowedCategory: 1 },
//   { unique: true }
// );

const WorkerToolPermissionModel = mongoose.model("WorkerToolPermissionModel", WorkerToolPermissionSchema);

export default WorkerToolPermissionModel;
