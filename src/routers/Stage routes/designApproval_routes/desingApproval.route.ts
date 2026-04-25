// Example Router setup
import express from 'express';
import { multiRoleAuthMiddleware } from '../../../middlewares/multiRoleAuthMiddleware';
import { imageUploadToS3, processUploadFiles } from '../../../utils/s3Uploads/s3upload';
import { deleteSingleFile, designApprovalCompletionStatus, designApprovalDeletePhase, getDesignApprovals, setDesignApprovalStageDeadline, startNextPhase, submitClientFeedback, uploadDesignFiles } from '../../../controllers/stage controllers/designApproval_controllers/designApproval.controller';

const designApprovalRoutes = express.Router();

designApprovalRoutes.post(
    "/:projectId/:designType/upload",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    imageUploadToS3.array("files"),
    processUploadFiles,
    uploadDesignFiles
);

designApprovalRoutes.get("/:projectId", multiRoleAuthMiddleware("owner", "staff", "CTO"), getDesignApprovals);
designApprovalRoutes.get("/public/:projectId" , getDesignApprovals);

designApprovalRoutes.put("/:projectId/:designType/next-phase", multiRoleAuthMiddleware("owner", "staff", "CTO"), startNextPhase);

designApprovalRoutes.put("/:projectId/:designType/phases/:phaseId/feedback",  submitClientFeedback);
designApprovalRoutes.delete("/:projectId/:designType/phases/:phaseId", multiRoleAuthMiddleware("owner", "staff", "CTO"), designApprovalDeletePhase);
designApprovalRoutes.delete("/:projectId/:designType/phases/:phaseId/files/:fileId", multiRoleAuthMiddleware("owner", "staff", "CTO"), deleteSingleFile);


designApprovalRoutes.put('/deadline/:projectId/:formId', multiRoleAuthMiddleware("owner", "staff", "CTO"),   designApprovalCompletionStatus)
designApprovalRoutes.put('/completionstatus/:projectId', multiRoleAuthMiddleware("owner", "staff", "CTO"),  setDesignApprovalStageDeadline)

export default designApprovalRoutes;
