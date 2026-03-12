import { Router } from "express";
import { multiRoleAuthMiddleware } from "../../middlewares/multiRoleAuthMiddleware";
import { createPincode, 
getAllPincodes, 
getSinglePincode, 
updatePincode, 
deletePincode  } from "../../controllers/pincode_controllers/pincodeMaster.controller";

const pincodeMasterRoutes = Router();

// ✅ CREATE a new pincode serviceability record
pincodeMasterRoutes.post(
    "/create-pincode", 
    multiRoleAuthMiddleware("owner", "staff", "CTO"), 
    createPincode
);

// ✅ GET all pincodes with pagination and organization filters
pincodeMasterRoutes.get(
    "/get-all-pincodes", 
    multiRoleAuthMiddleware("owner", "staff", "CTO"), 
    getAllPincodes
);

// ✅ GET details for a specific pincode (service mode, margins, factors)
pincodeMasterRoutes.get(
    "/get-pincode/:id", 
    multiRoleAuthMiddleware("owner", "staff", "CTO"), 
    getSinglePincode
);

// ✅ UPDATE regional logic (change service mode, risk level, or multipliers)
pincodeMasterRoutes.patch(
    "/update-pincode/:id", 
    multiRoleAuthMiddleware("owner", "staff", "CTO"), 
    updatePincode
);

// ✅ DELETE a pincode record from the master list
pincodeMasterRoutes.delete(
    "/delete-pincode/:id", 
    multiRoleAuthMiddleware("owner", "staff", "CTO"), 
    deletePincode
);

export default pincodeMasterRoutes;