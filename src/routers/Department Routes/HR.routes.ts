import {  Router } from "express";
import { imageUploadToS3 } from "../../utils/s3Uploads/s3upload";
import { deleteEmployee, deleteEmployeeDocument, getAllEmployees, getSingleEmployee, updateEmployee, uploadEmployeeDocument } from "../../controllers/Department controllers/HRMain controller/HrMain.controllers";
import { multiRoleAuthMiddleware } from "../../middlewares/multiRoleAuthMiddleware";


const HRRoutes = Router();

// Get all employees (with pagination, search, filters)
HRRoutes.get(
  "/getallemployee",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  getAllEmployees
);

// Get single employee by ID
HRRoutes.get(
  "/getsingle/:id",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  getSingleEmployee
);

// Update employee
HRRoutes.put(
  "/update/:empId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  updateEmployee
);

// Delete employee
HRRoutes.delete(
  "/deleteemployee/:empId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  deleteEmployee
);

// ============================
// Employee Document Management
// ============================

// Upload employee document
HRRoutes.post(
  "/:empId/uploaddocument",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  imageUploadToS3.single("file"), // file upload middleware
  uploadEmployeeDocument
);

// Delete employee document
HRRoutes.delete(
  "/:empId/deletedocument/:docId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  deleteEmployeeDocument
);

export default HRRoutes;