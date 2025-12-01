import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { deletePaymentAcc , getAllPaymentsAcc, getSinglePaymentAcc, sendPaymentToAcc} from "../../../controllers/Department controllers/Accounting Controller/PaymentMainAcc_controllers/paymentMainAcc.controller";

const paymentAccRoutes = Router();

// ✅ GET all accounting records for an organization (with filters)
paymentAccRoutes
.get("/getallpayments",multiRoleAuthMiddleware("owner", "staff", "CTO"), getAllPaymentsAcc)
// .post("/createinvoice",multiRoleAuthMiddleware("owner", "staff", "CTO"),  createInvoice)
// .put("/updateinvoice/:id",multiRoleAuthMiddleware("owner", "staff", "CTO"),  updateInvoice)
.delete("/deletepayments/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"),deletePaymentAcc)
.get("/getsinglepayments/:id",multiRoleAuthMiddleware("owner", "staff", "CTO"),getSinglePaymentAcc, )
.post("/syncpaymenttoaccounts/:paymentId",multiRoleAuthMiddleware("owner", "staff", "CTO"),sendPaymentToAcc );



    
export default paymentAccRoutes;
