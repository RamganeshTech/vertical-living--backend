
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv  from 'dotenv';

import connectDB from './config/connectDB';

import taskComment from './routers/taskComment.router';
import task from './routers/task.router';
import projectRouter from './routers/project.router'
import taskListRouter from './routers/tasklist.router'
import phaseRoutes from './routers/phase routers/phase.router'
// import checkRedisConnection from './config/redisClient';


dotenv.config()

const app = express()

app.use(cors({
  origin: process.env.FROTEND_URL,
  credentials: true
}))
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// checkRedisConnection() //for redis

app.use('/api/task', task)
app.use('/api/comment', taskComment)
app.use('/api/project', projectRouter)
app.use('/api/tasklist', taskListRouter)
app.use('/api/phase', phaseRoutes)


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
