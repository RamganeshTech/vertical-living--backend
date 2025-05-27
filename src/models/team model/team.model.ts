import mongoose, { Schema } from "mongoose";

export interface ITeams {
    teamId: mongoose.Schema.Types.ObjectId[]
} 

const TeamSchema:Schema<ITeams> = new Schema({
    teamId:[{
        typs:mongoose.Schema.ObjectId
    }]
})


const TeamModel = mongoose.model("TeamModel", TeamSchema)

export default TeamModel;