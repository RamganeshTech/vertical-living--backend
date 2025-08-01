import { Schema } from "mongoose";




export interface IExternalUpload {
    type: "image",
    url: string,
    uploadedAt: Date,
    originalName: string,
}

export interface ICommonExternal {
    unitName:string,
    price:number,
    unitCode:string,
    category: string,
    image:IExternalUpload
}

export interface IDimentionRange {
    start: number,
    end:number
}

const uploadSchema = new Schema<IExternalUpload>({
    type: { type: String, enum: ["image"] },
    url: { type: String, },
    originalName: {type: String},
    uploadedAt: { type: Date, default: new Date() }
}, { _id: true });



const CommonExternalSchema = new Schema<ICommonExternal>({
    unitName: {type: String},
    price: {type: Number},
    category: {type:String},
    unitCode: {type: String},
    image:{type: uploadSchema, default:null }
})


export const DimensionRangeSchema = new Schema<IDimentionRange>({
  start: { type: Number, default: 0 },
  end: { type: Number, default: 100 },
});



export default CommonExternalSchema;