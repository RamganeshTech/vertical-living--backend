// routes/payment/paymentConsent.routes.ts

import express from "express";
import { acceptClientConsent, generateConsentLink, getPaymentConsentTermsAndConditions, toggleConsentRequired } from "../../../controllers/stage controllers/PaymentConfirmation controllers/PaymentConsent contrlollers/paymentConsent.controller"; 
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { checkPreviousStageCompleted } from "../../../middlewares/checkPreviousStageMiddleware";
// import { TechnicalConsultationModel } from "../../../models/Stage Models/Cost Estimation Model/costEstimation.model";
import { getPaymentConfirmation, paymentConfirmationCompletionStatus, setPayementConfirmationStageDeadline } from "../../../controllers/stage controllers/PaymentConfirmation controllers/PaymentMain.controllers";
import { getPaymentSchedule, updateClientApprovalStatus, updateClientNotes, updateDueDate, updateMdApprovalStatus, updateMdNotes } from "../../../controllers/stage controllers/PaymentConfirmation controllers/PaymentSchedule controllers/paymentSchedule.controllers";
import { createPaymentConfirmationOrder, getPaymentTransaction, verifyPaymentConfirmation } from "../../../controllers/stage controllers/PaymentConfirmation controllers/Payment Transaction/paymentTransaction.controller";
import PaymentConfirmationModel from "../../../models/Stage Models/Payment Confirmation model/PaymentConfirmation.model";
import { notToUpdateIfStageCompleted } from "../../../middlewares/notToUpdateIfStageCompleted";
import { checkIfStaffIsAssignedToStage } from "../../../middlewares/checkIfStaffIsAssignedToStage";
import { TechnicalConsultationModel } from "../../../models/Stage Models/technical consulatation/technicalconsultation.model";
import { getPaymentAllQuotes, getPaymentSingleQuote } from "../../../controllers/stage controllers/PaymentConfirmation controllers/QuotePayment controllers/QuotePayment.controller";

// import { createPaymentConfirmationOrder, getPaymentTransaction, verifyPaymentConfirmation } from "../../../controllers/stage controllers/PaymentConfirmation controllers/Payment Transaction/paymentTransaction.controller";

const paymentConsentRoutes = express.Router();

paymentConsentRoutes.get("/getpaymentconfirmation/:projectId", multiRoleAuthMiddleware("CTO", "owner", "staff", "client"), checkPreviousStageCompleted(TechnicalConsultationModel), getPaymentConfirmation);

// step 1
// Example: PUT /api/payment/toggle-consent/:projectId
paymentConsentRoutes.put("/toggleconsent/:projectId", multiRoleAuthMiddleware("CTO", "owner", "staff"),  checkPreviousStageCompleted(TechnicalConsultationModel),  
// notToUpdateIfStageCompleted(PaymentConfirmationModel),
  checkIfStaffIsAssignedToStage(PaymentConfirmationModel), toggleConsentRequired);

paymentConsentRoutes.post("/generatepayementconsentlink/:projectId", multiRoleAuthMiddleware("CTO", "owner", "staff",), checkPreviousStageCompleted(TechnicalConsultationModel), 
// notToUpdateIfStageCompleted(PaymentConfirmationModel),
 checkIfStaffIsAssignedToStage(PaymentConfirmationModel), generateConsentLink);
paymentConsentRoutes.post("/acceptconsent/:projectId/:token",
  //  multiRoleAuthMiddleware("client", "owner"),
    checkPreviousStageCompleted(TechnicalConsultationModel), 
// notToUpdateIfStageCompleted(PaymentConfirmationModel),
 acceptClientConsent);
 paymentConsentRoutes.get("/getconsentcontent/:projectId/:token", checkPreviousStageCompleted(TechnicalConsultationModel), getPaymentConsentTermsAndConditions);

// step2

// GET payment schedule
paymentConsentRoutes.get("/getschedule/:projectId",multiRoleAuthMiddleware("CTO", "owner", "staff", "client"), checkPreviousStageCompleted(TechnicalConsultationModel), getPaymentSchedule);
// Client approval status
paymentConsentRoutes.put("/clientapprovalstatus/:projectId",multiRoleAuthMiddleware("client", "owner"),checkPreviousStageCompleted(TechnicalConsultationModel),
// notToUpdateIfStageCompleted(PaymentConfirmationModel),
 updateClientApprovalStatus);
// Due Date
paymentConsentRoutes.put("/dueDate/:projectId",multiRoleAuthMiddleware("CTO", "owner", "staff",),checkPreviousStageCompleted(TechnicalConsultationModel),
// notToUpdateIfStageCompleted(PaymentConfirmationModel),
  checkIfStaffIsAssignedToStage(PaymentConfirmationModel),updateDueDate);
// Client notes
paymentConsentRoutes.put("/clientnotes/:projectId",multiRoleAuthMiddleware("client", "owner"), checkPreviousStageCompleted(TechnicalConsultationModel),
// notToUpdateIfStageCompleted(PaymentConfirmationModel),
 updateClientNotes);
// MD approval status
paymentConsentRoutes.put("/mdapprovalstatus/:projectId",multiRoleAuthMiddleware("owner", "CTO", "staff"), checkPreviousStageCompleted(TechnicalConsultationModel),
// notToUpdateIfStageCompleted(PaymentConfirmationModel),
 updateMdApprovalStatus);
// MD notes
paymentConsentRoutes.put("/mdnotes/:projectId",multiRoleAuthMiddleware( "owner", "CTO", "staff"),checkPreviousStageCompleted(TechnicalConsultationModel), 
// notToUpdateIfStageCompleted(PaymentConfirmationModel),
updateMdNotes);


//  STEP 3

paymentConsentRoutes.post("/createorder/:projectId", multiRoleAuthMiddleware("client", "owner" ,"CTO", "staff"), checkPreviousStageCompleted(TechnicalConsultationModel), 
// notToUpdateIfStageCompleted(PaymentConfirmationModel),
 createPaymentConfirmationOrder);
paymentConsentRoutes.post("/verifypayment/:projectId", multiRoleAuthMiddleware("client", "owner" ,"CTO", "staff"), checkPreviousStageCompleted(TechnicalConsultationModel), 
// notToUpdateIfStageCompleted(PaymentConfirmationModel),
 verifyPaymentConfirmation);
paymentConsentRoutes.get("/gettransaction/:projectId", multiRoleAuthMiddleware("CTO", "owner", "staff", "client"), checkPreviousStageCompleted(TechnicalConsultationModel), getPaymentTransaction);


// STEP 4 (QUOTE ROUTES)
paymentConsentRoutes.get("/getallquotes/:projectId", multiRoleAuthMiddleware("CTO", "owner", "staff", "client"), checkPreviousStageCompleted(TechnicalConsultationModel), getPaymentAllQuotes);
paymentConsentRoutes.get("/getsinglequotes/:projectId/:id", multiRoleAuthMiddleware("CTO", "owner", "staff", "client"), checkPreviousStageCompleted(TechnicalConsultationModel), getPaymentSingleQuote);


// COMMON ROUTES
paymentConsentRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO",),checkPreviousStageCompleted(TechnicalConsultationModel), 
// notToUpdateIfStageCompleted(PaymentConfirmationModel),
 checkIfStaffIsAssignedToStage(PaymentConfirmationModel), setPayementConfirmationStageDeadline)
paymentConsentRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",), checkIfStaffIsAssignedToStage(PaymentConfirmationModel), paymentConfirmationCompletionStatus)
// paymentConsentRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO",), checkIfStaffIsAssignedToStage(PaymentConfirmationModel), paymentConfirmationCompletionStatus)

export default paymentConsentRoutes;
