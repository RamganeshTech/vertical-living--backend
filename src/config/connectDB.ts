import mongoose from 'mongoose';

const connectDB = async()=>{
   try{
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string,{
        maxPoolSize: 100
    })
   }
   catch(error){
    console.log("error form connectDB",error)
   }
}

export default connectDB
