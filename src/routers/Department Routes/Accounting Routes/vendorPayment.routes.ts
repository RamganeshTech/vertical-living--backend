import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";
import { createVendorPayment, deleteVendorPayment, getVendorPayment, getVendorPaymentById, sendVendorPaymentToPayment, updatepurchase } from "../../../controllers/Department controllers/Accounting Controller/VendorPayment Controller/vendorPayment.controller";

const VendorPaymentRoutes = Router();

// ✅ GET all accounting records for an organization (with filters)
VendorPaymentRoutes
.get("/getall",multiRoleAuthMiddleware("owner", "staff", "CTO"), getVendorPayment)
.post("/create",multiRoleAuthMiddleware("owner", "staff", "CTO"),  createVendorPayment)
.delete("/delete/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"),deleteVendorPayment)
.get("/getsingle/:id",multiRoleAuthMiddleware("owner", "staff", "CTO"),getVendorPaymentById)
.put("/update/:id",multiRoleAuthMiddleware("owner", "staff", "CTO"),updatepurchase)
.post("/sendtopayment/:vendorId",multiRoleAuthMiddleware("owner", "staff", "CTO"),sendVendorPaymentToPayment);


    
export default VendorPaymentRoutes;
