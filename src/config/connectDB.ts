import mongoose from 'mongoose';

const connectDB = async()=>{
      console.log('Attempting to connect to DB...');
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
