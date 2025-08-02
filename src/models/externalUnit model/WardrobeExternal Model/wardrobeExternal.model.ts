import { model, Schema } from "mongoose";
import CommonExternalSchema, { DimensionRangeSchema, ICommonExternal, IDimentionRange } from "../CommonExternal model/commonExternal.model";

export interface IWardrobeExternal extends ICommonExternal {
    dimention?: {
        height: IDimentionRange
        width: IDimentionRange
        depth: IDimentionRange
    }
}


const WardrobeExternalSchema = new Schema<IWardrobeExternal>({
    ...CommonExternalSchema.obj,
    dimention: {
        height: { type: DimensionRangeSchema },
        width: { type: DimensionRangeSchema },
        depth: { type: DimensionRangeSchema },
    }
}, {
    timestamps:true
})


export const WardrobeExternalModel = model("WardrobeExternalModel", WardrobeExternalSchema) 