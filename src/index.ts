
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv  from 'dotenv';

import connectDB from './config/connectDB';

import taskComment from './routers/taskComment.router';
import task from './routers/task.router';


dotenv.config()

const app = express()

app.use(cors({
  origin: process.env.FROTEND_URL,
  credentials: true
}))
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())


app.use('/api/task', task)
app.use('/api/comment', taskComment)

const PORT = process.env.PORT
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("DB connected")
    console.log(`Server listening to http://localhost:${PORT}`)
  })
})
.catch((error:Error)=>{
  console.log("error from DB connection", error.message)
})
