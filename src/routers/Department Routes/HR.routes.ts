import {  Router } from "express";
import { imageUploadToS3, processUploadFiles } from "../../utils/s3Uploads/s3upload";
import { addEmployeeByHR, deleteEmployee, deleteEmployeeDocument, getAllEmployees, getSingleEmployee, updateEmployee, uploadEmployeeDocument } from "../../controllers/Department controllers/HRMain controller/HrMain.controllers";
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


// create employee by hr
HRRoutes.post(
  "/createemployee",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  imageUploadToS3.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'aadhar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'passport', maxCount: 1 },
  { name: 'education', maxCount: 5 }, // Allow multiple education docs
  { name: 'experience', maxCount: 5 }, // Allow multiple experience docs
]), // file upload middleware
  processUploadFiles, // Process files and upload to S3
  addEmployeeByHR
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


// Delete employee document
HRRoutes.delete(
  "/:empId/deletedocument/:docId",
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  deleteEmployeeDocument
);

export default HRRoutes;