import { Router } from "express";
import { imageUploadToS3, processUploadFiles } from "../../../utils/s3Uploads/s3upload";
import { deleteShortlistedMicaDesign, getAllShortlistedMicaDesigns, uploadShortlistedMicaDesignImages } from "../../../controllers/stage controllers/sampledesign contorllers/shortlistMicaReferenceDesing.controller";

const shortlistMicaReferenceDesignRoutes = Router();


/**
 * @route   POST /shortlist/:organizationId/upload
 * @desc    Upload shortlisted design images
 */
shortlistMicaReferenceDesignRoutes.post(
  "/:organizationId/uploaddesign",
  imageUploadToS3.array("files"), // handle multiple uploads
  processUploadFiles,
  uploadShortlistedMicaDesignImages
);

/**
 * @route   GET /shortlist/:organizationId
 * @desc    Get shortlisted designs for an organization
 */
shortlistMicaReferenceDesignRoutes.get("/getdesigns/:organizationId", getAllShortlistedMicaDesigns);

/**
 * @route   DELETE /shortlist/:organizationId/:imageId
 * @desc    Delete a specific shortlisted design image
 */
shortlistMicaReferenceDesignRoutes.delete("/deletedesign/:organizationId/:imageId", deleteShortlistedMicaDesign);



export default shortlistMicaReferenceDesignRoutes