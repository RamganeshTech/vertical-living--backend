
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
import materialArrivalRoutes from './routers/Stage routes/Material Arrival Routes/MaterialArrival.routes';
import workTaskRoutes from './routers/Stage routes/workTask routes/workmaintasks.routes';
import installationRoutes from './routers/Stage routes/installation routes/installation.routes';
import qualityCheckRoutes from './routers/Stage routes/QualityCheck routes/QualityCheck.routes';
import cleaningRoutes from './routers/Stage routes/Cleaning Routes/cleaning.routes';
import getUsersRoutes from './routers/Stage routes/Get Users Routes/getUsers.routes';
import assignRoutes from './routers/Stage routes/Assign routes/assignStaffs.routes';
import projectDeliveryRoutes from './routers/Stage routes/ProjectDelivery Routes/ProjectDelivery.routes';
import stageTimerRoutes from './routers/Stage routes/Timer routes/timer.routes';
import paymentConsentRoutes from './routers/Stage routes/PaymentConfirmation Routes/PaymentConfirmation.routes';
import path from 'path';
import { s3 } from './config/awssdk';
// import checkRedisConnection from './config/redisClient';
import fs from 'fs';
import subscriptionRoutes from './routers/SubscriptionPayment Routes/subscriptionPayment.routes';
import AWS from "aws-sdk";
import adminWallroutes from './routers/WallPainting routes/adminWallPainting.routes';
import workerWallRoutes from './routers/WallPainting routes/workerWallPainting.routes';
import downloadRouter from './routers/Download Routes/download.routes';
import profileRoutes from './routers/Profile Role Routes/ProfileRole.routes';
import preRequiretiesRoutes from './routers/PreRequireties Routes/preRequireties.routes';
import utilAiRoutes from './routers/Util routes/util.routes';

dotenv.config();

// (async () => {
//   try {
//     const fileName = "Screenshot (11).png";

//     // Absolute or relative path to your image
//     const filePath = path.join(__dirname, fileName);

//     console.log("Uploading:", filePath);

//     const result = await s3.upload({
//       Bucket: process.env.AWS_S3_BUCKET!,
//       Key: `test-upload/${Date.now()}-${fileName}`,
//       Body: fs.createReadStream(filePath),
//       // ACL: "public-read",
//       ContentType: "image/png",
//     }).promise();

//     console.log("✅ Upload success!");
//     console.log("S3 URL:", result.Location);
//   } catch (err) {
//     console.error("❌ Upload failed:", err);
//   }
// })();

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


// for getting all the users in hte organization
app.use('/api/getusers', getUsersRoutes)


// Timer routes for starting for all stages
app.use('/api/starttimer', stageTimerRoutes)

// PREREQUIRETIES APIS

app.use('/api/prerequireties', preRequiretiesRoutes)


// STAGE APIS
app.use('/api/requirementform', requirementRoutes)
app.use('/api/sitemeasurement', siteMeasurementRoutes)
app.use('/api/sampledesign', sampleDesignRoutes)
app.use('/api/technicalconsultation', technicalConsultRoutes)
app.use('/api/materialconfirmation', materialConfirmationRoutes)
app.use('/api/costestimation', costEstimationRoutes)
app.use('/api/paymentconfirmation', paymentConsentRoutes)
app.use('/api/orderingmaterial', orderMaterialRoutes)
app.use('/api/materialarrivalcheck', materialArrivalRoutes)
app.use('/api/worktasks', workTaskRoutes)
app.use('/api/installation', installationRoutes)
app.use('/api/qualitycheck', qualityCheckRoutes)
app.use('/api/cleaning', cleaningRoutes)
app.use('/api/projectdelivery', projectDeliveryRoutes)

app.use('/api/adminwall', adminWallroutes)
app.use('/api/workerwall', workerWallRoutes)

// RESET STAGE
app.use('/api', resetRouter)
app.use(downloadRouter)


// ASSIGN STAFF 
app.use('/api/assignstafftostage', assignRoutes)

app.use("/api/subscriptionpayment", subscriptionRoutes);

app.use('/api/profile', profileRoutes)


// AI ROUTES FOR BRANDNAMES , MATIERAISL, AND OTHER EXTRA THINGS...
app.use('/api/ai', utilAiRoutes)


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
