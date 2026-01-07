// routes/layoutRoutes.js
import express from 'express';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';
import { createToolRoom, deleteToolRoom, getAllToolRooms, getToolRoomById, updateToolRoom } from '../../controllers/tool_controllers/toolRoom.controller';
import { getAllToolRoomWithoutPagination, getAllToolWithoutPagination, getToolTimelineHistory, initiateToolIssue, initiateToolReturn, resendIssueOtp, resendReturnOtp, workerVerifyAndAccept, workerVerifyReturn } from '../../controllers/tool_controllers/toolIssue.controller';
import { imageUploadToS3, processUploadFiles } from '../../utils/s3Uploads/s3upload';
const toolIssueRoutes = express.Router();

// Issue tool generator
toolIssueRoutes.post(
    '/issue/generateotp',
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    initiateToolIssue
);

toolIssueRoutes.post(
    '/issue/resendotp',
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    resendIssueOtp
);


toolIssueRoutes.post(
    '/return/resendotp',
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    resendReturnOtp
);


toolIssueRoutes.get(
    '/getalltool/:organizationId',
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    getAllToolWithoutPagination
);


toolIssueRoutes.get(
    '/getalltoolroom/:organizationId',
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    getAllToolRoomWithoutPagination
);





// otp enter for issue
toolIssueRoutes.patch(
    '/issue/enterotp',
    multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"),
    workerVerifyAndAccept
);




// return  tool generator
toolIssueRoutes.post(
    '/return/generateotp',
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    imageUploadToS3.array("photos"), processUploadFiles,

    initiateToolReturn
);

// otp enter for issue
toolIssueRoutes.patch(
    '/return/enterotp',
    multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"),
    workerVerifyReturn
);


toolIssueRoutes.get(
    '/history/:toolId',
    multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"),
    getToolTimelineHistory
);

export default toolIssueRoutes;