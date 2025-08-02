import { model, Schema, Types } from "mongoose";
import { IWardrobeExternal } from "../WardrobeExternal Model/wardrobeExternal.model";
import { ICommonExternal, IExternalUpload } from "../CommonExternal model/commonExternal.model";


export interface ISelectedDimention extends ICommonExternal {
    dimention?: {
        height: number;
        width: number;
        depth: number;
    },
    totalPrice?: number,
    quantity?:number
}


export interface ISelectedExternal {
    projectId: Types.ObjectId,
    selectedUnits: ISelectedDimention[],
    totalCost: number,
    status: "completed" | "pending"
}


const uploadSelectedExternal = new Schema<IExternalUpload>({
    type: { type: String, enum: ["image"] },
    url: { type: String, },
    originalName: { type: String },
    uploadedAt: { type: Date, default: new Date() }
}, { _id: false });




const SelectedCommonExternalSchema = new Schema<ICommonExternal & { projectId?: Types.ObjectId }>({
    unitName: { type: String },
    price: { type: Number },
    category: { type: String },
    unitCode: { type: String },
    image: { type: uploadSelectedExternal, default: null }
})


const SelectedUnitsSchema = new Schema<ISelectedDimention>({
    ...SelectedCommonExternalSchema.obj,
    dimention: {
        height: { type: Number, default: 0 },
        width: { type: Number, default: 0 },
        depth: { type: Number, default: 0 },
    },
    totalPrice: {type: Number, default: 0},
    quantity: {type: Number, default: 0},
    
}, {_id:true})


const SelectedExternalSchema = new Schema<ISelectedExternal>({
    projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel" },
    selectedUnits: { type: [SelectedUnitsSchema], default: [] },
    totalCost: { type: Number, default: 0 },
    status: { type: String, enum: ["completed", "pending"], default: "pending" },
}, {
    timestamps: true
})



export const SelectedExternalModel = model("SelectedExternalModel", SelectedExternalSchema)