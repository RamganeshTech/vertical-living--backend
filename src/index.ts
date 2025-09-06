
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
// import orderMaterialRoutes from './routers/Stage routes/order Material routes/orderMaterial.routes';
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
// import checkRedisConnection from './config/redisClient';
import subscriptionRoutes from './routers/SubscriptionPayment Routes/subscriptionPayment.routes';
import adminWallroutes from './routers/WallPainting routes/adminWallPainting.routes';
import workerWallRoutes from './routers/WallPainting routes/workerWallPainting.routes';
import downloadRouter from './routers/Download Routes/download.routes';
import profileRoutes from './routers/Profile Role Routes/ProfileRole.routes';
import preRequiretiesRoutes from './routers/PreRequireties Routes/preRequireties.routes';
import utilAiRoutes from './routers/Util routes/util.routes';
import modularUnitRoutes from './routers/Modular Unit routes/modularUnit.routes';
import stageSelectetionRoutes from './routers/Modular Unit routes/SelectionStage Routes/selectionStage.routes';
import SelectedModularUnitRoutes from './routers/Modular Unit routes/SelectedModularUnit Routes/selectedModularUnit.routes';
import documentaitonRoutes from './routers/Documentation Routes/documentation.routes';
import shortlistedDesignRoutes from './routers/Stage routes/sample desing routes/shortListed.routes';
import orderMaterialHistoryRoutes from './routers/Stage routes/order Material routes/orderMaterialHistory.routes';
import currentActiveStage from './routers/CurrentActiveStage Routes/currentActiveStage.route';
import externalUnitRoutes from './routers/ExternalUnit Routes/externalUnit.routes';
import selectedExternalRoutes from './routers/ExternalUnit Routes/selectedExternalUnit.routes';

// CRON JOBs
import './utils/cronJobs/ReminderEmail/checkDeadLines'
import mongoose from 'mongoose';
import procurementLogger from './Plugins/ProcurementDeptPluggin';
import procurementRoutes from './routers/Department Routes/procurement routes/procurement.route';
import HRRoutes from './routers/Department Routes/HR.routes';
import commonOrderRoutes from './routers/Stage routes/order Material routes/Common OrderMaterial Routes/commonOrderMaterial.routes';
import InventoryRoutes from './routers/Stage routes/Inventory Routes/inventory.routes';
import recycleMaterialRoutes from './routers/Stage routes/Inventory Routes/RecycleMaterial routes/recycle.routes';
import http from 'http';
import { Server, Socket } from 'socket.io';
import ProjectModel from './models/project model/project.model';
import  jwt  from 'jsonwebtoken';
import { RoleUserPayload } from './types/types';
import { SocketService } from './config/socketService';
import LogisticsRoutes from './routers/Department Routes/Logistics Routes/logistics.routes';
import procurementNewRoutes from './routers/Department Routes/ProcurementNew Routes/procurementNew.routes';



// Extend Socket interface for custom properties
interface CustomSocket extends Socket {
  userId?: string;
  userRole?: string;
  ownerId?: string;
  currentRoom?: string;
  currentProjectId?: string;
  currentOrgId?: string;
}



dotenv.config();

const app = express()
const server = http.createServer(app);


// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Your React app URL
    methods: ["GET", "POST", "PUT", "PATCH", "PUT"],
    credentials: true
  }
});


SocketService.initialize(io);




io.use((socket:CustomSocket, next) => {
   console.log("🚀 middleware reached");
  const cookieHeader = socket.request.headers.cookie;
  // console.log("cookie header", cookieHeader)
  if (!cookieHeader) return next(new Error("No cookies found"));
// console.log("cookieJHeader", cookieHeader)
  // parse manually if needed
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, v] = c.trim().split("=");
      return [k, decodeURIComponent(v)];
    })
  );
// console.log("cookies", cookies)

  const token =
    cookies.useraccesstoken ||
    cookies.ctoaccesstoken ||
    cookies.staffaccesstoken ||
    cookies.workeraccesstoken ||
    cookies.clientaccesstoken;


    // console.log("token", token)
  if (!token) return next(new Error("No token found"));

   const tokenSecretMap = {
    useraccesstoken: process.env.JWT_ACCESS_SECRET,
    staffaccesstoken: process.env.JWT_STAFF_ACCESS_SECRET,
    workeraccesstoken: process.env.JWT_WORKER_ACCESS_SECRET,
    ctoaccesstoken: process.env.JWT_CTO_ACCESS_SECRET,
    clientaccesstoken: process.env.JWT_CLIENT_ACCESS_SECRET,
  };


   let decoded:any = null;
  for (const [cookieName, secret] of Object.entries(tokenSecretMap)) {
    const token = cookies[cookieName];

    if (token && secret) {
      try {
        decoded = jwt.verify(token, secret);
        // console.log(`✅ Token '${cookieName}' verified successfully`);
        // socket.data.user = decoded;

        // Attach to socket (this is what fixes your issue)
        socket.userId = decoded._id;
        socket.userRole = decoded.role;
        socket.data.user = decoded;

        return next();
      } catch (err:any) {
        console.warn(`❌ Token '${cookieName}' failed: ${err.message}`);
      }
    }
  }

});


// Make io available globally for controllers
declare global {
  var socketIO: Server;
}
global.socketIO = io;


// console.log("env file", process.env.FRONTEND_URL)

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}))
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))
app.use(express.json({ limit: "50mb" }));
// mongoose.plugin(procurementLogger); // Apply to ALL schemas


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

app.use('/api/externalunits', externalUnitRoutes)
app.use('/api/selectedexternal', selectedExternalRoutes)

// MODULAR UNITS APIS
app.use('/api/modularunit', modularUnitRoutes)
app.use('/api/selectedmodularunits', SelectedModularUnitRoutes)
app.use('/api/selectedstage', stageSelectetionRoutes)

// DOCUEMENTATION APIS
app.use('/api/documentation', documentaitonRoutes)

// STAGE APIS
app.use('/api/requirementform', requirementRoutes)
app.use('/api/sitemeasurement', siteMeasurementRoutes)
app.use('/api/sampledesign', sampleDesignRoutes)
app.use('/api/technicalconsultation', technicalConsultRoutes)
app.use('/api/materialconfirmation', materialConfirmationRoutes)
app.use('/api/costestimation', costEstimationRoutes)
app.use('/api/paymentconfirmation', paymentConsentRoutes)
app.use('/api/orderingmaterial', orderMaterialHistoryRoutes)
app.use('/api/materialarrivalcheck', materialArrivalRoutes)
app.use('/api/worktasks', workTaskRoutes)
app.use('/api/installation', installationRoutes)
app.use('/api/qualitycheck', qualityCheckRoutes)
app.use('/api/cleaning', cleaningRoutes)
app.use('/api/projectdelivery', projectDeliveryRoutes)

app.use('/api/commonorder', commonOrderRoutes)
app.use('/api/inventory', InventoryRoutes)
app.use('/api/recyclematerial', recycleMaterialRoutes)

// SOP
app.use('/api/adminwall', adminWallroutes)
app.use('/api/workerwall', workerWallRoutes)

// SHORTLIST API
app.use('/api/shortlisteddesign', shortlistedDesignRoutes)
app.use('/api/currentactivestage', currentActiveStage)


// PROCUREMENT API
app.use('/api/procurement', procurementRoutes)
app.use('/api/department/hr', HRRoutes)
app.use('/api/department/logistics', LogisticsRoutes)
app.use('/api/department/procurement', procurementNewRoutes)




// SHORTLIST API
// app.use('/api/shortlist', shortlistedDesignRoutes)
// shortlistedDesignRoutes.post(
//   "/upload/:projectId/:roomName",
//   multiRoleAuthMiddleware("owner", "staff", "CTO",),
//   imageUploadToS3.array("file"),
//   processUploadFiles,
//   uploadShortlistedRoomImages
// );


// RESET STAGE
app.use('/api', resetRouter)
app.use(downloadRouter)


// ASSIGN STAFF 
app.use('/api/assignstafftostage', assignRoutes)

// SUBSCRIPTION API
app.use("/api/subscriptionpayment", subscriptionRoutes);

// PROFILE API
app.use('/api/profile', profileRoutes)


// AI ROUTES FOR BRANDNAMES , MATIERAISL, AND OTHER EXTRA THINGS...
app.use('/api/ai', utilAiRoutes)







// io.use(async (socket: CustomSocket, next) => {
//   try {
//     const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
//     if (!token) {
//       return next(new Error('Authentication token required'));
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
//     socket.userId = decoded._id;
//     socket.userRole = decoded.role;
//     socket.ownerId = decoded.ownerId;
    
//     next();
//   } catch (error) {
//     next(new Error('Invalid token'));
//   }
// });

    


// io.on("connection", (socket) => {
//   console.log("🔌 Client connected:", socket.id);

//   socket.on("disconnect", () => {
//     console.log("❌ Client disconnected:", socket.id);
//   });
// });



// Socket.IO Connection Handler
io.on('connection', (socket:CustomSocket) => {
  console.log(`User ${socket.userId} connected with role ${socket.userRole}`);
  
  // Handle joining project rooms
  socket.on('join_organization', async (data: { organizationId: string }) => {
    try {
      const { organizationId } = data;
      
      // Get organization ID from project
      // const project = await ProjectModel.findById({ _id: projectId }).populate('organizationId');
      // if (!project) {
      //   socket.emit('error', { message: 'Project not found' });
      //   return;
      // }
      // const organizationId = project.organizationId._id.toString();
      const roomName = `org_${organizationId}`;
      
      await socket.join(roomName);
      socket.currentRoom = roomName;
      // socket.currentProjectId = projectId;
      socket.currentOrgId = organizationId;
      
      console.log(`User ${socket.userId} joined room: ${roomName}`);
      
      // Notify other users in the room
      socket.to(roomName).emit('user_joined', {
        userId: socket.userId,
        userRole: socket.userRole,
        // projectId
      });

      console.log(`User ${socket.userId} joined room: ${roomName}`);

      
    } catch (error) {
      socket.emit('error', { message: 'Failed to join project room' });
    }
  });
  
  // Handle leaving project rooms
  socket.on('leave_organization', () => {
    if (socket.currentRoom) {
      socket.leave(socket.currentRoom);
      socket.to(socket.currentRoom).emit('user_left', {
        userId: socket.userId,
        userRole: socket.userRole
      });
      console.log(`User ${socket.userId} left room: ${socket.currentRoom}`);
      socket.currentRoom = undefined;
      // socket.currentOrgId = undefined;
      socket.currentOrgId = undefined;
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`);
  });
});


const PORT = process.env.PORT || 4000

// connectDB().then(() => {
//   app.listen(PORT, () => {
//     console.log("DB connected")
//     console.log(`Server listening to http://localhost:${PORT}`)
//   })
// })
// .catch((error:Error)=>{
//   console.log("error from DB connection", error.message)
// })



connectDB()
  .then(() => {
    server.listen(PORT, () => {   // <- start the HTTP server, not app
      console.log("DB connected");
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((error: Error) => {
    console.log("error from DB connection", error.message);
  });