import mongoose, { Schema } from "mongoose";

interface IReport extends Document{
userId:mongoose.Schema.Types.ObjectId
}

const ReportSchema:Schema<IReport> = new Schema({
    userId:{
        type: mongoose.Schema.ObjectId
    }
}, {
    timestamps:true
}) 

const ReportModel = mongoose.model<IReport>("ReportModel", ReportSchema)