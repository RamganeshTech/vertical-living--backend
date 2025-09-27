import { Router } from "express";
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";
import { deleteShortlistedReferenceDesign, getAllShortlistedReferenceDesigns, uploadShortlistedReferenceDesignImages } from "../../../controllers/stage controllers/sampledesign contorllers/shortListReferenceDesign.controller";

const shortlistReferenceDesign = Router();

/**
 * @route   POST /shortlist/:organizationId/upload
 * @desc    Upload shortlisted design images
 */
shortlistReferenceDesign.post(
  "/:organizationId/uploaddesign",
  imageUploadToS3.array("files"), // handle multiple uploads
  processUploadFiles,
  uploadShortlistedReferenceDesignImages
);

/**
 * @route   GET /shortlist/:organizationId
 * @desc    Get shortlisted designs for an organization
 */
shortlistReferenceDesign.get("/getdesigns/:organizationId", getAllShortlistedReferenceDesigns);

/**
 * @route   DELETE /shortlist/:organizationId/:imageId
 * @desc    Delete a specific shortlisted design image
 */
shortlistReferenceDesign.delete("/deletedesign/:organizationId/:imageId", deleteShortlistedReferenceDesign);

export default shortlistReferenceDesign;
