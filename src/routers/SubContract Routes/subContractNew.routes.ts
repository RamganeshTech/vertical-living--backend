import express from 'express';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';
import {

    createSubContract,
    generateShareableLink,
    submitWorkerInfo,
    uploadAfterWorkInfo,
    // getSubContractByShareableLink,
    getSubContractsByOrganization,
    getSubContractById,
    updateWorkerStatus,
    deleteSubContract,
    getSubContractBasicDetails,
    uploadBeforeWorkInfo,
    deleteWorkerInfo,
    updateSubContract
} from '../../controllers/SubContract Controllers/subContractNew.controller';
import { imageUploadToS3, processUploadFiles } from '../../utils/s3Uploads/s3upload';


const SubContractRoutesNew = express.Router()


// ✅ Create a new SubContract
SubContractRoutesNew.post(
    "/create",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
     imageUploadToS3.array("files"),
    processUploadFiles,
    createSubContract
);


SubContractRoutesNew.put(
    "/update/:subContractId",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    updateSubContract
);



// ✅ Generate shareable link  ( NOT USED) 
SubContractRoutesNew.put(
    "/generate-shareable-link/:subContractId",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    generateShareableLink
);

// ✅ Get all SubContracts by organization
SubContractRoutesNew.get(
    "/getall/:organizationId",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    getSubContractsByOrganization
);

// ✅ Get single SubContract by ID
SubContractRoutesNew.get(
    "/getsingle/:subContractId",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    getSubContractById
);

// ✅ Update worker status (accept/reject)
SubContractRoutesNew.put(
    "/update-status/:subContractId",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    updateWorkerStatus
);

// ✅ Delete a SubContract
SubContractRoutesNew.delete(
    "/delete/:subContractId",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    deleteSubContract
);

// SubContractRoutesNew.delete(
//     "/deletework/:subContractId",
//     multiRoleAuthMiddleware("owner", "staff", "CTO"),
//     deleteWorkerInfo
// );




/* =============================
   🌐 PUBLIC ROUTES (No Login)
   ============================= */

// 🧾 Get SubContract by shareable token link
// SubContractRoutesNew.get("/public/getbytoken/:token", getSubContractByShareableLink);

// 🧱 Submit worker info (Before Work)
SubContractRoutesNew.post(
    "/public/submit/:subContractId",
    imageUploadToS3.array("files"),
    processUploadFiles,
    submitWorkerInfo
);


SubContractRoutesNew.get(
    "/public/getsubcontract/basicdetail/:subContractId",
    getSubContractBasicDetails
);


// 🏗️ Upload After Work files
SubContractRoutesNew.post(
    "/public/upload-after-work/:subContractId",
    imageUploadToS3.array("files"),
    processUploadFiles,
    uploadAfterWorkInfo
);

SubContractRoutesNew.post(
    "/public/upload-before-work/:subContractId",
    imageUploadToS3.array("files"),
    processUploadFiles,
    uploadBeforeWorkInfo
);



export default SubContractRoutesNew

