import { Document , model, Schema, Types} from "mongoose";

interface ExternalAllUnit extends Document {
    wardrobe?: Types.ObjectId[];
    // studyTable?: Types.ObjectId[];
    // bedCot?: Types.ObjectId[];
    // tv?: Types.ObjectId[];
    // crockery?: Types.ObjectId[];
    // kitchenCabinet?: Types.ObjectId[];
    // falseCeiling?: Types.ObjectId[];
    // showcase?: Types.ObjectId[];
    // shoeRack?: Types.ObjectId[];
}

const AllExternalUnitSchema = new Schema<ExternalAllUnit>({
    wardrobe: {type: Schema.Types.ObjectId, ref:""},
    
}, {
    timestamps:true
})


export const AllExternalUnitModel = model("AllExternalUnitModel", AllExternalUnitSchema)