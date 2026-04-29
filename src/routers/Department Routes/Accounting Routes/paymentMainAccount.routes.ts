import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { deletePaymentAcc, getAllPaymentsAcc, getAllPaymentsAccWihtoutPaginationForExport, getSinglePaymentAcc, sendPaymentToAcc, syncPaymentDeptToLogistics, uploadCashPaymentProofOnly, verifyAndProcessCashPayment } from "../../../controllers/Department controllers/Accounting Controller/PaymentMainAcc_controllers/paymentMainAcc.controller";
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";

const paymentAccRoutes = Router();

// ✅ GET all accounting records for an organization (with filters)
paymentAccRoutes
    .get("/getallpayments", multiRoleAuthMiddleware("owner", "staff", "CTO"), getAllPaymentsAcc)
    .get("/getallpayments-export", multiRoleAuthMiddleware("owner", "staff", "CTO"), getAllPaymentsAccWihtoutPaginationForExport)
    // .post("/createinvoice",multiRoleAuthMiddleware("owner", "staff", "CTO"),  createInvoice)
    // .put("/updateinvoice/:id",multiRoleAuthMiddleware("owner", "staff", "CTO"),  updateInvoice)
    .delete("/deletepayments/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"), deletePaymentAcc)
    .get("/getsinglepayments/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"), getSinglePaymentAcc,)
    .post("/syncpaymenttoaccounts/:paymentId", multiRoleAuthMiddleware("owner", "staff", "CTO"), sendPaymentToAcc)
    .post("/syncpaymenttologistics/:paymentId", multiRoleAuthMiddleware("owner", "staff", "CTO"), syncPaymentDeptToLogistics)
    .post("/updatepaymentproof/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"),
        imageUploadToS3.array("files"),
        processUploadFiles,
        uploadCashPaymentProofOnly)
    .post("/verifycashpayment/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"),verifyAndProcessCashPayment);







export default paymentAccRoutes;
