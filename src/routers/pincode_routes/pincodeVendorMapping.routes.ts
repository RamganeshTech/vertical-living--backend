// import { Router } from "express";
// import { createMapping, deleteMapping, getAllMappings, getSingleMapping, updateMapping } from "../../controllers/pincode_controllers/pincodeVendorMapping.controllers";
// import { multiRoleAuthMiddleware } from "../../middlewares/multiRoleAuthMiddleware";

// const pincodeVendorMappingRoutes = Router();

// // ✅ CREATE a new vendor-pincode mapping [cite: 10, 276]
// pincodeVendorMappingRoutes.post(
//     "/create-mapping", 
//     multiRoleAuthMiddleware("owner", "staff", "CTO"), 
//     createMapping
// );

// // ✅ GET all mappings with pagination and filters (by vendor, pincode, or role) [cite: 362, 366]
// pincodeVendorMappingRoutes.get(
//     "/get-all-mappings", 
//     multiRoleAuthMiddleware("owner", "staff", "CTO"), 
//     getAllMappings
// );

// // ✅ GET a single mapping record detail [cite: 407]
// pincodeVendorMappingRoutes.get(
//     "/get-single/:id", 
//     multiRoleAuthMiddleware("owner", "staff", "CTO"), 
//     getSingleMapping
// );       

// // ✅ UPDATE an existing mapping (SLA, rates, or priority) [cite: 292, 296]
// pincodeVendorMappingRoutes.patch(
//     "/update-mapping/:id", 
//     multiRoleAuthMiddleware("owner", "staff", "CTO"), 
//     updateMapping
// );

// // ✅ DELETE a mapping record [cite: 490]
// pincodeVendorMappingRoutes.delete(
//     "/delete-mapping/:id", 
//     multiRoleAuthMiddleware("owner", "staff", "CTO"), 
//     deleteMapping
// );

// export default pincodeVendorMappingRoutes;