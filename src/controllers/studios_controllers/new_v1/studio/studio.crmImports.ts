/**
 * The only file in the backend Studio module that imports from the rest of the CRM.
 * TODO (check imports only): point these four paths at the real files in your backend.
 */

export { multiRoleAuthMiddleware } from '../../../../middlewares/multiRoleAuthMiddleware';
export { imageUploadToS3, processUploadFiles } from '../../../../utils/s3Uploads/s3upload';
export type { RoleBasedRequest } from './../../../../types/types';

// export type { RoleBasedRequest,  } from "../../types/roleBasedRequest";
// export { multiRoleAuthMiddleware } from "../../middlewares/multiRoleAuthMiddleware";
// export { imageUploadToS3, processUploadFiles } from "../../middlewares/uploadToS3";

