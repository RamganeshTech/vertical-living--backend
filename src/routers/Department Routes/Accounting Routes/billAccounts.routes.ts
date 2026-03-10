import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { createCustomer, deleteCustomer, getAllCustomers, getCustomer, updateCustomer, updateCustomerDoc } from "../../../controllers/Department controllers/Accounting Controller/Customer Accounts Controllers/customerAccounts.controller";
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";
import { createBill, createBillV1, deleteBill, deleteBillImages, deleteBillPaymentProofs, getBillById, getBills, sendBillToPayment, updatebill, uploadBillImagesOnly, uploadBillPaymentProofOnly } from "../../../controllers/Department controllers/Accounting Controller/Bill Accounts Controller/billAccounts.controller";

const BillAccountRoutes = Router();

// ✅ GET all accounting records for an organization (with filters)
BillAccountRoutes
    .get("/getallbill", multiRoleAuthMiddleware("owner", "staff", "CTO"), getBills)
    .post("/createbill", multiRoleAuthMiddleware("owner", "staff", "CTO"),
        imageUploadToS3.array("files"),
        processUploadFiles,
        createBill)  // not used int he websites, but used in the mobile
    .post("/v1/createbill", multiRoleAuthMiddleware("owner", "staff", "CTO"),
        imageUploadToS3.fields([
            { name: "files", maxCount: 10 },
            { name: "paymentProof", maxCount: 10 }
        ]),
        processUploadFiles,
        createBillV1)
    .post("/updatebill/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"),
        // imageUploadToS3.array("files"),
        // processUploadFiles,
        updatebill)
    .post("/upload-images/:id",
        multiRoleAuthMiddleware("owner", "staff", "CTO"),
        imageUploadToS3.array("files"),
        processUploadFiles,
        uploadBillImagesOnly)
    .post("/upload-payment-proof/:id",
        multiRoleAuthMiddleware("owner", "staff", "CTO"),
        imageUploadToS3.array("files"),
        processUploadFiles,
        uploadBillPaymentProofOnly)
    .delete("/deletebill/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"), deleteBill)
    .get("/getsinglebill/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"), getBillById)
    .delete("/deleteimage/:id/:imageId", multiRoleAuthMiddleware("owner", "staff", "CTO"), deleteBillImages)
    .delete("/deletepaymentproof/:id/:imageId", multiRoleAuthMiddleware("owner", "staff", "CTO"), deleteBillPaymentProofs)
    // .post("/synctoaccounts/:billId", multiRoleAuthMiddleware("owner", "staff", "CTO"), sendBillToAccounting)
    // .post("/synctoaccounts/:billId", multiRoleAuthMiddleware("owner", "staff", "CTO"), sendBillToAccounting)
    .post("/synctopayments/:billId", multiRoleAuthMiddleware("owner", "staff", "CTO"), sendBillToPayment);



export default BillAccountRoutes;
