import { Router } from 'express';
// import { uploadMaterialShopDocuments } from '../controllers/materialShopController';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';
import { imageUploadToS3, processUploadFiles } from '../../utils/s3Uploads/s3upload';
import { createMaterialShopDocuments, createMaterialShopDocumentsV1, deleteMaterialShopDocument, deleteMaterialShopFile, editMaterialShopCategoryName, extractShopMaterialDocDetails, extractShopMaterialDocDetailsv1, getAllMaterialShopDocuments, getMaterialShopDocumentById, getMaterialShopDocumentByIdV1, updateFilesToMaterialDocument } from '../../controllers/shopMaterialDocument_controllers/shopMaterialDocument.controller';

const MaterialShopRoutes = Router();

// Assuming imageUploadToS3 is your multer middleware configured for S3
MaterialShopRoutes.post(
  "/uploadmaterials", 
  multiRoleAuthMiddleware("owner", "staff", "CTO"), 
  imageUploadToS3.array("files"), // 'files' is the key in FormData
  processUploadFiles,
  createMaterialShopDocuments
);

MaterialShopRoutes.post(
  "/uploadmaterials/v1", 
  multiRoleAuthMiddleware("owner", "staff", "CTO"), 
  imageUploadToS3.array("files"), // 'files' is the key in FormData
  processUploadFiles,
  createMaterialShopDocumentsV1
);


MaterialShopRoutes.patch(
  "/update/category/:id", 
  multiRoleAuthMiddleware("owner", "staff", "CTO"),
  editMaterialShopCategoryName
);

MaterialShopRoutes.post(
  "/update/upload/doc/:id", 
  multiRoleAuthMiddleware("owner", "staff", "CTO"), 
  imageUploadToS3.array("files"), // 'files' is the key in FormData
  processUploadFiles,
  updateFilesToMaterialDocument
);





// GET all with pagination and filter: /api/materials?categoryName=Hardware&page=1&limit=10
MaterialShopRoutes.get("/getall", multiRoleAuthMiddleware("owner", "staff", "CTO"), getAllMaterialShopDocuments);

// GET single
MaterialShopRoutes.get("/getsingle/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"), getMaterialShopDocumentById);
MaterialShopRoutes.get("/getsingle/v1/:categoryId", multiRoleAuthMiddleware("owner", "staff", "CTO"), getMaterialShopDocumentByIdV1);

// DELETE
MaterialShopRoutes.delete("/delete/:id", multiRoleAuthMiddleware("owner", "staff", "CTO"), deleteMaterialShopDocument);
MaterialShopRoutes.delete("/deletefile/:categoryId/:fileId", multiRoleAuthMiddleware("owner", "staff", "CTO"), deleteMaterialShopFile);





MaterialShopRoutes.put("/extract/:id/:fileId", multiRoleAuthMiddleware("owner", "staff", "CTO"), extractShopMaterialDocDetails);
MaterialShopRoutes.put("/extract/v1/:organizationId/:categoryId/:id/:fileId", multiRoleAuthMiddleware("owner", "staff", "CTO"), extractShopMaterialDocDetailsv1);




export default MaterialShopRoutes;