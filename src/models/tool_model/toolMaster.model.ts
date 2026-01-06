import mongoose, { Schema } from "mongoose";




export interface IUploadPdf {
    type: "image" | "pdf";
    url: string;
    originalName?: string;
    uploadedAt?: Date;
}

const toolUploadSchema = new Schema<IUploadPdf>({
    type: { type: String, enum: ["image", "pdf"] },
    url: { type: String, },
    originalName: String,
    uploadedAt: { type: Date, default: new Date() }
}, { _id: true });


const ToolSchema = new mongoose.Schema(
    {
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "OrganizationModel" },

        toolImages: { type: [toolUploadSchema], default: [] },

        toolCode: { type: String,  },
        toolName: { type: String, required: true },
        toolCategory: {
            type: String,
            // enum: ["drill", "saw", "grinder", "cutter", "Other"],
            required: true
        },
        brand: { type: String },
        modelNumber: { type: String },
        // serialNumber: { type: String, },

        purchaseDate: { type: Date },
        purchaseValue: { type: Number },

        toolRoomId: { type: mongoose.Schema.Types.ObjectId, ref: "ToolRoomModel", default: null },

        conditionStatus: {
            type: String,
            // enum: ["new", "good", "worn", "repair"],
            default: "new"
        },

        availabilityStatus: {
            type: String,
            // enum: ["available", "issued", "repair", "missing"],
            default: "available"
        },

        remarks: { type: String }
    },
    { timestamps: true }
);


// ✅ Pre-save hook to auto-generate unique Tool Code per Organization
ToolSchema.pre("save", async function (next) {
    // Only run this logic if it's a new document and toolCode isn't already set
    if (this.isNew && !this.toolCode) {
        try {
            // Find the last tool created FOR THIS SPECIFIC organization
            const lastTool = await mongoose.model("ToolMasterModel")
                .findOne({}, { toolCode: 1 })
                .sort({ createdAt: -1 });

            let nextNumber = 1;

            if (lastTool && lastTool.toolCode) {
                // Extracts the number from the end of strings like "TOOL-005"
                const match = lastTool.toolCode.match(/(\d+)$/);
                if (match) {
                    nextNumber = parseInt(match[1]) + 1;
                }
            }

            // Formatting: TOOL-001, TOOL-002, etc.
            this.toolCode = `TOOL-${String(nextNumber).padStart(3, "0")}`;

            next();
        } catch (error: any) {
            next(error);
        }
    } else {
        next();
    }
});


const ToolMasterModel = mongoose.model("ToolMasterModel", ToolSchema);

export default ToolMasterModel;
