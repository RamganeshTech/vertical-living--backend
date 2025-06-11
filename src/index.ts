
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv  from 'dotenv';

import connectDB from './config/connectDB';

import clientRoutes from './routers/client routes/clientAuth.routes';
import clientApprovalRoutes from './routers/client routes/clientApproval.routes';
import authRoutes from './routers/auth.routers';
import taskComment from './routers/taskComment.router';
import task from './routers/task.router';
import projectRouter from './routers/project.router'
import taskListRouter from './routers/tasklist.router'
import phaseRoutes from './routers/phase routers/phase.router'
import materailRoutes from './routers/material routers/material.router'
import labourRoutes from './routers/labour routes/labour.routes'
import orgsRouter from './routers/organization routes/organization.routes';
// import checkRedisConnection from './config/redisClient';


dotenv.config()

const app = express()
// console.log("env file", process.env.FRONTEND_URL)
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}))
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// checkRedisConnection() //for redis

app.use('/api/auth', authRoutes)
app.use('/api/auth/client', clientRoutes)
app.use('/api/auth/clientapproval', clientApprovalRoutes)
app.use('/api/task', task)
app.use('/api/comment', taskComment)
app.use('/api/project', projectRouter)
app.use('/api/tasklist', taskListRouter)
app.use('/api/phase', phaseRoutes)
app.use('/api/material', materailRoutes)
app.use('/api/labour', labourRoutes )
app.use('/api/orgs/', orgsRouter)


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
