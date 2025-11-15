// import express from 'express';
// import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';
// import {

//     createSubContract,
//     generateShareableLink,
//     submitWorkerInfo,
//     uploadAfterWorkInfo,
//     // getSubContractByShareableLink,
//     getSubContractsByOrganization,
//     getSubContractById,
//     updateWorkerStatus,
//     deleteSubContract,
//     getSubContractBasicDetails,
//     uploadBeforeWorkInfo,
//     deleteWorkerInfo
// } from '../../controllers/SubContract Controllers/subContract.controllers';
// import { imageUploadToS3, processUploadFiles } from '../../utils/s3Uploads/s3upload';


// const SubContractRoutes = express.Router()


// // ✅ Create a new SubContract
// SubContractRoutes.post(
//     "/create",
//     multiRoleAuthMiddleware("owner", "staff", "CTO"),
//     createSubContract
// );

// // ✅ Generate shareable link
// SubContractRoutes.put(
//     "/generate-shareable-link/:subContractId",
//     multiRoleAuthMiddleware("owner", "staff", "CTO"),
//     generateShareableLink
// );

// // ✅ Get all SubContracts by organization
// SubContractRoutes.get(
//     "/getall/:organizationId",
//     multiRoleAuthMiddleware("owner", "staff", "CTO"),
//     getSubContractsByOrganization
// );

// // ✅ Get single SubContract by ID
// SubContractRoutes.get(
//     "/getsingle/:subContractId/:workerInfoId",
//     multiRoleAuthMiddleware("owner", "staff", "CTO"),
//     getSubContractById
// );

// // ✅ Update worker status (accept/reject)
// SubContractRoutes.put(
//     "/update-status/:subContractId/:workerId",
//     multiRoleAuthMiddleware("owner", "staff", "CTO"),
//     updateWorkerStatus
// );

// // ✅ Delete a SubContract
// SubContractRoutes.delete(
//     "/delete/:subContractId",
//     multiRoleAuthMiddleware("owner", "staff", "CTO"),
//     deleteSubContract
// );

// SubContractRoutes.delete(
//     "/deletework/:subContractId/:workId",
//     multiRoleAuthMiddleware("owner", "staff", "CTO"),
//     deleteWorkerInfo
// );




// /* =============================
//    🌐 PUBLIC ROUTES (No Login)
//    ============================= */

// // 🧾 Get SubContract by shareable token link
// // SubContractRoutes.get("/public/getbytoken/:token", getSubContractByShareableLink);

// // 🧱 Submit worker info (Before Work)
// SubContractRoutes.post(
//     "/public/submit/:subContractId",
//     imageUploadToS3.array("files"),
//     processUploadFiles,
//     submitWorkerInfo
// );


// SubContractRoutes.get(
//     "/public/getsubcontract/basicdetail/:subContractId",
//     getSubContractBasicDetails
// );


// // 🏗️ Upload After Work files
// SubContractRoutes.post(
//     "/public/upload-after-work/:subContractId",
//     imageUploadToS3.array("files"),
//     processUploadFiles,
//     uploadAfterWorkInfo
// );

// SubContractRoutes.post(
//     "/public/upload-before-work/:subContractId",
//     imageUploadToS3.array("files"),
//     processUploadFiles,
//     uploadBeforeWorkInfo
// );



// export default SubContractRoutes

