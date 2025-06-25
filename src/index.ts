
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
import orgOwnerRoutes from './routers/OrgOwner routes/orgOwner.routes';
import workerRoutes from './routers/worker routes/worker.router';
import staffRoutes from './routers/staff routes/staff.routes';
import CTORoutes from './routers/CTO routes/CTO.routes';
import requirementRoutes from './routers/Stage routes/requirement routes/requirement.routes';
import siteMeasurementRoutes from './routers/Stage routes/siteMeasurement routes/siteMeasurement.route';
import sampleDesignRoutes from './routers/Stage routes/sample desing routes/sampleDesign.routes';
import technicalConsultRoutes from './routers/Stage routes/technicalConsultation.routes';
import materialConfirmationRoutes from './routers/Stage routes/MaterialRoomConfirmation routes/materialRoomConfirmation.routes';
import resetRouter from './routers/resetStage Routes/resetStage.routes';
import costEstimationRoutes from './routers/Stage routes/cost estimation routes/costEstimation.routes';
import orderMaterialRoutes from './routers/Stage routes/order Material routes/orderMaterial.routes';
// import checkRedisConnection from './config/redisClient';


dotenv.config()
// console.log("S3_BUCKET", process.env.AWS_S3_BUCKET); // 👈 Add this

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


app.use('/api/owner', orgOwnerRoutes)
app.use('/api/staff', staffRoutes)
app.use('/api/worker', workerRoutes)
app.use('/api/CTO', CTORoutes)

// STAGE APIS
app.use('/api/requirementform', requirementRoutes)
app.use('/api/sitemeasurement', siteMeasurementRoutes)
app.use('/api/sampledesign', sampleDesignRoutes)
app.use('/api/technicalconsultation', technicalConsultRoutes)
app.use('/api/materialconfirmation', materialConfirmationRoutes)
app.use('/api/costestimation', costEstimationRoutes)
app.use('/api/orderingmaterial', orderMaterialRoutes)


// RESET STAGE
app.use('/api', resetRouter)


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
