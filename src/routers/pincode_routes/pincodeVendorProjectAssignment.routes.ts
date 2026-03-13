import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../middlewares/multiRoleAuthMiddleware";
import { createAssignment, 
updateAssignmentStatus, 
getAllAssignments, 
getSingleAssignment, 
deleteAssignment,  
getPublicAssignment,
acceptPublicAssignment} from "../../controllers/pincode_controllers/pincodeVendorProjectAssignment.controller";

const pincodeVendorProjectAssignmentRoutes = Router();

// ✅ CREATE: Assign a project to a vendor with T&C generation
pincodeVendorProjectAssignmentRoutes.post(
    "/assign-project", 
    multiRoleAuthMiddleware("owner", "staff", "CTO"), 
    createAssignment
);

// ✅ UPDATE: Handle Vendor acknowledgement (Accept/Reject) and status changes
// Note: You can also allow 'vendor' role here if you have one for the Vendor Portal
pincodeVendorProjectAssignmentRoutes.patch(
    "/update-status/:id", 
    multiRoleAuthMiddleware("owner", "staff", "CTO"), 
    updateAssignmentStatus
);

// ✅ GET ALL: Fetch all assignments with filters (Admin view)
pincodeVendorProjectAssignmentRoutes.get(
    "/get-all", 
    multiRoleAuthMiddleware("owner", "staff", "CTO"), 
    getAllAssignments
);

// ✅ GET SINGLE: Details for a specific assignment (Legal docs + IDs)
pincodeVendorProjectAssignmentRoutes.get(
    "/get-assignment/:id", 
    multiRoleAuthMiddleware("owner", "staff", "CTO"), 
    getSingleAssignment
);

// ✅ DELETE: Remove an assignment record
pincodeVendorProjectAssignmentRoutes.delete(
    "/delete-assignment/:id", 
    multiRoleAuthMiddleware("owner", "staff", "CTO"), 
    deleteAssignment
);

// These routes do NOT have auth middleware
pincodeVendorProjectAssignmentRoutes.get("/public/:id", getPublicAssignment);
pincodeVendorProjectAssignmentRoutes.patch("/public-accept/:id", acceptPublicAssignment);

export default pincodeVendorProjectAssignmentRoutes;