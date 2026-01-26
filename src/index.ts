
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import connectDB from './config/connectDB';
import agenda from './config/agenda'; // Import your agenda config
import './jobs/procurementJob';    // IMPORTANT: Import your job definitions so Agenda knows they exist

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
import workerRoutes from './routers/worker routes/worker.router';
import staffRoutes from './routers/staff routes/staff.routes';
import CTORoutes from './routers/CTO routes/CTO.routes';
import requirementRoutes from './routers/Stage routes/requirement routes/requirement.routes';
import siteMeasurementRoutes from './routers/Stage routes/siteMeasurement routes/siteMeasurement.route';
import sampleDesignRoutes from './routers/Stage routes/sample desing routes/sampleDesign.routes';
import technicalConsultRoutes from './routers/Stage routes/technicalConsultation.routes';
// import materialConfirmationRoutes from './routers/Stage routes/MaterialRoomConfirmation routes/materialRoomConfirmation.routes';
import resetRouter from './routers/resetStage Routes/resetStage.routes';
// import costEstimationRoutes from './routers/Stage routes/cost estimation routes/costEstimation.routes';
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
import utilAiRoutes from './routers/Util routes/utilAi.routes';
import modularUnitRoutes from './routers/Modular Unit routes/modularUnit.routes';
// import stageSelectetionRoutes from './routers/Modular Unit routes/SelectionStage Routes/selectionStage.routes';
// import SelectedModularUnitRoutes from './routers/Modular Unit routes/SelectedModularUnit Routes/selectedModularUnit.routes';
import documentaitonRoutes from './routers/Documentation Routes/documentation.routes';
import shortlistedDesignRoutes from './routers/Stage routes/sample desing routes/shortListed.routes';
import orderMaterialHistoryRoutes from './routers/Stage routes/order Material routes/orderMaterialHistory.routes';
import currentActiveStage from './routers/CurrentActiveStage Routes/currentActiveStage.route';
import externalUnitRoutes from './routers/ExternalUnit Routes/externalUnit.routes';
// import selectedExternalRoutes from './routers/ExternalUnit Routes/selectedExternalUnit.routes';

// CRON JOBs
import './utils/cronJobs/ReminderEmail/checkDeadLines'
import mongoose from 'mongoose';
import HRRoutes from './routers/Department Routes/HR.routes';
import commonOrderRoutes from './routers/Stage routes/order Material routes/Common OrderMaterial Routes/commonOrderMaterial.routes';
import InventoryRoutes from './routers/Stage routes/Inventory Routes/inventory.routes';
import recycleMaterialRoutes from './routers/Stage routes/Inventory Routes/RecycleMaterial routes/recycle.routes';
import http from 'http';
import { Server, Socket } from 'socket.io';
import ProjectModel from './models/project model/project.model';
import jwt from 'jsonwebtoken';
import { RoleUserPayload } from './types/types';
import { SocketService } from './config/socketService';
import LogisticsRoutes from './routers/Department Routes/Logistics Routes/logistics.routes';
import procurementNewRoutes from './routers/Department Routes/ProcurementNew Routes/procurementNew.routes';
import accountingRoutes from './routers/Department Routes/Accounting Routes/accounting.routes';
import RateConfigRoutes from './routers/Quote Routes/RateConfig Routes/rateConfig.routes';
import QuoteRouter from './routers/Quote Routes/QuoteGenerate Routes/quoteGenerate.routes';
import shortlistReferenceDesign from './routers/Stage routes/sample desing routes/shortlistReferenceDesign.routes';
import workReportRoutes from './routers/Stage routes/workReport Routes/workReport.routes';
import staffTaskRoutes from './routers/StaffTask Routes/staffTask.routes';
import LabourRateConfigRoutes from './routers/Quote Routes/RateConfig Routes/laboruRateConfig.routes';
import projectUtilRoutes from './routers/Util routes/util.routes';
// import { loadDetectionModel } from './controllers/stage controllers/sampledesign contorllers/shortListMica.contorller';
// import micaDeletectionRoutes from './routers/Stage routes/sample desing routes/shortListMica.routes';
import shortlistMicaReferenceDesignRoutes from './routers/Stage routes/sample desing routes/shortListMicaReferenceDesign.routes';
import workLibRoutes from './routers/WorkLibrary Routes/workLibrary.routes';
import materialInventoryRoutes from './routers/Material Inventory Routes/materialInventory.routes';
import materialInventoryCartRoutes from './routers/Material Inventory Routes/materialInventoryCart.routes';
import notificaitonRoutes from './routers/Notificaiton Routes/notificaiton.routes';
import customerAccountingRoutes from './routers/Department Routes/Accounting Routes/customerAccounts.routes';
import invoiceAccountRoutes from './routers/Department Routes/Accounting Routes/invoiceAccounts.routes';
import retailInvoiceAccountRoutes from './routers/Department Routes/Accounting Routes/retailInvoiceAccounts.routes';
import modularUnitRoutesNew from './routers/Modular Unit routes/modularUnitNew.routes';
import SelectedModularUnitNewRoutes from './routers/Modular Unit routes/SelectedModularUnit Routes New/selectedModularUnitNew.routes';
import salesAccountsRoutes from './routers/Department Routes/Accounting Routes/salesOrderAccounts.route';
import publicOrderMaterialRoutes from './routers/Stage routes/order Material routes/publicOrderMaterial.routes';
import shopLibRoutes from './routers/Stage routes/order Material routes/shopLibDetails.routes';
import vendorAccountingRoutes from './routers/Department Routes/Accounting Routes/vendorAccounts.routes';
import ExpenseRoutes from './routers/Department Routes/Accounting Routes/expense.routes';
import ExpenseAccountingRoutes from './routers/Department Routes/Accounting Routes/expense.routes';
import BillAccountRoutes from './routers/Department Routes/Accounting Routes/billAccounts.routes';
import PurchaseAccRoutes from './routers/Department Routes/Accounting Routes/purchaseAcc.routes';
import VendorPaymentRoutes from './routers/Department Routes/Accounting Routes/vendorPayment.routes';
// import { setupDiscussionSocket } from './controllers/stage controllers/Issue Discussion Controllers/issueDiscussionSocket';
import issueDiscussionRoutes from './routers/Stage routes/Issue Discussion Routes/issueDiscussion.routes';
// import { SubContractModel } from './models/SubContract Model/subContract.model';
// import SubContractRoutes from './routers/SubContract Routes/subContract.routes';

// import path from "path";
// import { pathToFileURL } from "url";
import SubContractRoutesNew from './routers/SubContract Routes/subContractNew.routes';
import razorpayRoutes from './routers/Razorpay_routes/razorpay.routes';
import BillNewAccountRoutes from './routers/Department Routes/Accounting Routes/billNewAccounts.routes';
import paymentAccRoutes from './routers/Department Routes/Accounting Routes/paymentMainAccount.routes';
import desingRoutes from './routers/Design_Lab_routes/designLab.routes';
import designRoutes from './routers/Design_Lab_routes/designLab.routes';
import GuideRoutes from './routers/guide_routes/guide.routes';
import cadRoutes from './routers/cad_routes/cad.routes';
import toolMasterRoutes from './routers/tool_routes/toolMaster.route';
import toolRoomModel from './routers/tool_routes/toolsRoom.route';
import toolRoomRoutes from './routers/tool_routes/toolsRoom.route';
import toolIssueRoutes from './routers/tool_routes/toolIssue.route';
import InternalQuoteRoutes from './routers/Quote Routes/QuoteGenerate Routes/internalQuoteNewVersion.routes';
import MateroialWithLabourRateConfigRoutes from './routers/Quote Routes/RateConfig Routes/materialWithLabourRateConfig.routes';
import CutlistRoutes from './routers/cutlist_routes/cutlist.routes';


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




io.use((socket: CustomSocket, next) => {
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


  let decoded: any = null;
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
      } catch (err: any) {
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

const isProd = process.env.NODE_ENV === "production";

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
app.use('/api/labour', labourRoutes)

app.use('/api/orgs/', orgsRouter)
app.use('/api/razorpay', razorpayRoutes)

app.use('/api/staff', staffRoutes)
app.use('/api/worker', workerRoutes)
app.use('/api/CTO', CTORoutes)


// for getting all the users in hte organization
app.use('/api/getusers', getUsersRoutes)



// PROFILE API
app.use('/api/profile', profileRoutes)



// EXTERNAL UNITS
// app.use('/api/externalunits', externalUnitRoutes)
// app.use('/api/selectedexternal', selectedExternalRoutes)

// MODULAR UNITS APIS
// app.use('/api/modularunit', modularUnitRoutes)
app.use('/api/modularunitnew', modularUnitRoutesNew)
app.use('/api/selectedmodularunitsnew', SelectedModularUnitNewRoutes)
// app.use('/api/selectedmodularunits', SelectedModularUnitRoutes)
// app.use('/api/selectedstage', stageSelectetionRoutes)


// Timer routes for starting for all stages
app.use('/api/starttimer', stageTimerRoutes)
// PREREQUIRETIES APIS
app.use('/api/prerequireties', preRequiretiesRoutes)

// ISSUE DISCUSSION

app.use('/api/issuediscussion', issueDiscussionRoutes)


// DOCUEMENTATION APIS
app.use('/api/documentation', documentaitonRoutes)

// STAGE APIS
app.use('/api/requirementform', requirementRoutes)
app.use('/api/sitemeasurement', siteMeasurementRoutes)
app.use('/api/sampledesign', sampleDesignRoutes)
app.use('/api/technicalconsultation', technicalConsultRoutes)
// app.use('/api/materialconfirmation', materialConfirmationRoutes)
// app.use('/api/costestimation', costEstimationRoutes)
app.use('/api/paymentconfirmation', paymentConsentRoutes)
app.use('/api/orderingmaterial', orderMaterialHistoryRoutes)
app.use('/api/publicordermaterial', publicOrderMaterialRoutes)
app.use('/api/shoplibdetails', shopLibRoutes)
app.use('/api/materialarrivalcheck', materialArrivalRoutes)
app.use('/api/worktasks', workTaskRoutes)
app.use('/api/designlab', designRoutes)

// REPORTS
app.use('/api/workreports', workReportRoutes)




app.use('/api/installation', installationRoutes)
app.use('/api/qualitycheck', qualityCheckRoutes)
app.use('/api/cleaning', cleaningRoutes)
app.use('/api/projectdelivery', projectDeliveryRoutes)

app.use('/api/guideline', GuideRoutes)



app.use('/api/commonorder', commonOrderRoutes)
app.use('/api/inventory', InventoryRoutes)
app.use('/api/recyclematerial', recycleMaterialRoutes)

// SOP
app.use('/api/adminwall', adminWallroutes)
app.use('/api/workerwall', workerWallRoutes)

// ASSIGN STAFF 
app.use('/api/assignstafftostage', assignRoutes)



// SHORTLIST REFERENCE DESIGN
app.use('/api/shortlist/referencedesign', shortlistReferenceDesign)
// uncomment this for using the mica design (but not working)
// app.use('/api/shortlist/micadesign', shortlistMicaReferenceDesignRoutes)


// SHORTLIST API
app.use('/api/shortlisteddesign', shortlistedDesignRoutes)
// SHORLIST MICA API
// app.use('/api/detection', micaDeletectionRoutes);

app.use('/api/currentactivestage', currentActiveStage)

// PROCUREMENT API

app.use('/api/department/hr', HRRoutes)
app.use('/api/department/logistics', LogisticsRoutes)
app.use('/api/department/procurement', procurementNewRoutes)
app.use('/api/department/accounting', accountingRoutes)
app.use('/api/department/accounting/customer', customerAccountingRoutes)
app.use('/api/department/accounting/payments/section', paymentAccRoutes)
app.use('/api/department/accounting/invoice', invoiceAccountRoutes)
app.use('/api/department/accounting/retailinvoice', retailInvoiceAccountRoutes)
app.use('/api/department/accounting/salesorder', salesAccountsRoutes)
app.use('/api/department/accounting/vendor', vendorAccountingRoutes)
app.use('/api/department/accounting/expense', ExpenseAccountingRoutes)
app.use('/api/department/accounting/bill', BillAccountRoutes)
app.use('/api/department/accounting/billpdf', BillNewAccountRoutes)
app.use('/api/department/accounting/purchase', PurchaseAccRoutes)
app.use('/api/department/accounting/vendorpayment', VendorPaymentRoutes)


// QUOTES API
app.use('/api/quote/rateconfig', RateConfigRoutes)
app.use('/api/quote/labour/rateconfig', LabourRateConfigRoutes)
app.use('/api/quote/materialwithlabour/rateconfig', MateroialWithLabourRateConfigRoutes)
app.use('/api/quote/quotegenerate', QuoteRouter)
app.use('/api/quote/quotegenerate', InternalQuoteRoutes)

app.use('/api/cutlist', CutlistRoutes)



// app.use('/api/subcontract', SubContractRoutes)
app.use('/api/subcontract', SubContractRoutesNew)
// STAFF TASKS API
app.use('/api/worklib', workLibRoutes)
app.use("/api/stafftasks/", staffTaskRoutes)


// MATERIAL INVENTORY API
app.use("/api/materialinventory", materialInventoryRoutes)
app.use("/api/materialinventory/cart", materialInventoryCartRoutes)

// NOTIFICAITON API
app.use("/api/notification", notificaitonRoutes)

// CAD ROUTES
app.use("/api/cad", cadRoutes)



// TOOL ROUTES
app.use("/api/toolmaster", toolMasterRoutes)
app.use("/api/toolroom", toolRoomRoutes)
app.use("/api/tool", toolIssueRoutes)



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



// SUBSCRIPTION API
app.use("/api/subscriptionpayment", subscriptionRoutes);




// UTILS API
app.use('/api/projectdetails', projectUtilRoutes)


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
io.on('connection', (socket: CustomSocket) => {
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


  // Handle joining user-specific notification room
  socket.on('join_notifications', async (data: { userId: string }) => {
    try {
      const { userId } = data;
      const notificationRoom = `notifications_${userId}`;

      await socket.join(notificationRoom);

      console.log(`User ${userId} joined notification room: ${notificationRoom}`);

      // Send current unread count
      const { getUnreadCount } = await import('./controllers/Notification Controller/notification.service.js');
      const unreadCount = await getUnreadCount(userId);

      socket.emit("unread_count_update", { count: unreadCount });

    } catch (error) {
      socket.emit("error", { message: 'Failed to join notification room' });
    }
  });

  socket.on('join_ticket_discussion', async (data: {
    organizationId: string,
    userId: string
  }) => {
    try {
      const { organizationId, userId } = data;

      // Create room names
      const orgDiscussionRoom = `org_discussion_${organizationId}`;
      const userTicketNotiRoom = `user_issue_notification_${userId}`; // add per-user ticket room

      // Join both project and organization discussion rooms
      // await socket.join(discussionRoom);
      await socket.join(orgDiscussionRoom);
      await socket.join(userTicketNotiRoom); // ✅ user-specific ticket room

      if (!socket.data.discussionRooms) {
        socket.data.discussionRooms = [];
      }

      socket.data.discussionRooms.push(orgDiscussionRoom); // ← Add to array
      socket.data.discussionRoom = orgDiscussionRoom;
      // socket.data.currentProjectId = projectId;

      console.log(`User ${socket.userId} joined discussion rooms: ${orgDiscussionRoom}`);

      // Notify others in the room
      socket.to(orgDiscussionRoom).emit('user_joined_discussion', {
        userId: socket.userId,
        userRole: socket.userRole,
        userName: socket.data.userName,
        timestamp: new Date()
      });



      if (!socket.userId) {
        socket.emit('discussion_error', {
          message: 'User authentication required'
        });
        return;
      }





      // Send recent discussions to the joining user

      //     const controllerRelativePath = isProd
      // ? "../dist/controllers/stage controllers/Issue Discussion Controllers/issueDiscussion.controller.js"
      // : "./controllers/stage controllers/Issue Discussion Controllers/issueDiscussion.controller.ts";

      // const controllerPath = pathToFileURL(path.resolve(__dirname, controllerRelativePath)).href;


      //     const { getUnreadTicketCountUtil, getRecentDiscussions } = await import(controllerPath);

      //     // const { getUnreadTicketCountUtil } = await import('./controllers/stage controllers/Issue Discussion Controllers/issueDiscussion.controller.js');
      //     const unreadCount = await getUnreadTicketCountUtil(organizationId, socket.userId);

      //     console.log(`📊 Sending unread count to user ${socket.userId}:`, unreadCount); // ← Debug log


      //     socket.emit("unread_ticket_count_update", { count: unreadCount });
      //     // const { getRecentDiscussions } = await import('./controllers/stage controllers/Issue Discussion Controllers/issueDiscussion.controller.js');
      //     const recentDiscussions = await getRecentDiscussions(organizationId, socket.userId);

      //     socket.emit('recent_discussions', recentDiscussions);

    } catch (error: any) {
      socket.emit('discussion_error', {
        message: 'Failed to join discussion room',
        error: error.message
      });
    }
  });

  // Handle new issue creation
  socket.on('create_issue', async (data: {
    projectId: string,
    issue: any
  }) => {
    try {
      const discussionRoom = `discussion_${data.projectId}`;

      // Emit to all users in the discussion room
      io.to(discussionRoom).emit('new_issue_created', {
        issue: data.issue,
        createdBy: {
          userId: socket.userId,
          userRole: socket.userRole,
          userName: socket.data.userName
        },
        timestamp: new Date()
      });

      // Also notify the assigned staff member personally
      const assignedStaffRoom = `notifications_${data.issue.selectStaff}`;
      io.to(assignedStaffRoom).emit('assigned_to_issue', {
        issue: data.issue,
        assignedBy: socket.data.userName,
        // projectId: data.projectId
      });

    } catch (error: any) {
      socket.emit('discussion_error', {
        message: 'Failed to create issue',
        error: error.message
      });
    }
  });

  // Handle response submission
  socket.on('submit_response', async (data: {
    discussionId: string,
    convoId: string,
    response: any,
    projectId: string
  }) => {
    try {
      const discussionRoom = `discussion_${data.projectId}`;

      // Emit to all users in the discussion room
      io.to(discussionRoom).emit('new_response_added', {
        discussionId: data.discussionId,
        convoId: data.convoId,
        response: data.response,
        respondedBy: {
          userId: socket.userId,
          userRole: socket.userRole,
          userName: socket.data.userName
        },
        timestamp: new Date()
      });

    } catch (error: any) {
      socket.emit('discussion_error', {
        message: 'Failed to submit response',
        error: error.message
      });
    }
  });

  // Handle typing indicators
  socket.on('typing', (data: {
    projectId: string,
    isTyping: boolean,
    convoId?: string
  }) => {
    const discussionRoom = `discussion_${data.projectId}`;

    socket.to(discussionRoom).emit('user_typing', {
      userId: socket.userId,
      userName: socket.data.userName,
      isTyping: data.isTyping,
      convoId: data.convoId
    });
  });

  // Handle leaving discussion room
  socket.on('leave_ticket_discussion', (data: { projectId: string }) => {
    const discussionRoom = `discussion_${data.projectId}`;

    socket.leave(discussionRoom);
    socket.to(discussionRoom).emit('user_left_discussion', {
      userId: socket.userId,
      userName: socket.data.userName
    });

    // Clean up socket data
    socket.data.discussionRooms = socket.data.discussionRooms?.filter(
      (room: any) => room !== discussionRoom
    );
  });


  if (socket.userId) {
    // Join a personal notification room
    const userNotificationRoom = `user_notifications_${socket.userId}`;
    socket.join(userNotificationRoom);
    console.log(`User ${socket.userId} joined room ${userNotificationRoom}`);
  }

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

// Add discussion socket setup
// setupDiscussionSocket(io);

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


// Load model when server starts (add this before app.listen)
// loadDetectionModel().then(() => {
//   console.log('Detection system ready');
// }).catch(error => {
//   console.error('Failed to load detection model:', error);
// });


connectDB()
  .then(async () => {

    try {
      await agenda.start();
      console.log("✔ Agenda Automation Engine Started");
    } catch (agendaError) {
      console.error("❌ Agenda failed to start:", agendaError);
    }



    server.listen(PORT, () => {   // <- start the HTTP server, not app
      console.log("DB connected");
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((error: Error) => {
    console.log("error from DB connection", error.message);
  });