import mongoose, { Schema } from "mongoose"

interface IProjectGroup extends Document {
    groupName:string;
        projectId:mongoose.Schema.Types.ObjectId[]

}


const ProjectGroupSchema:Schema<IProjectGroup> = new Schema({
    groupName:{
        type:String,
        default:"untitled"
    },
    projectId:[{
        type:mongoose.Schema.ObjectId,
    }]
}, {
    timestamps:true
})


const projectGroupModel = mongoose.model<IProjectGroup>("ProjectGroup", ProjectGroupSchema)

export default projectGroupModel;