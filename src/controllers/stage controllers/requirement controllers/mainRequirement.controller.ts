import { Request, Response, NextFunction } from "express";
import { RequirementFormModel } from "../../../models/Stage Models/requirment model/requirement.model";
import { validateBedroomInput, validateKitchenInput, validateLivingHallInput, validateWardrobeInput } from "../../../validations/requirement validation/kitchenValidation";
import { Model, Types } from "mongoose";
import crypto from 'crypto';
import { handleSetStageDeadline, timerFunctionlity } from "../../../utils/common features/timerFuncitonality";
import { isDate } from "util/types";
import { SiteMeasurementModel } from "../../../models/Stage Models/siteMeasurement models/siteMeasurement.model";
import { resetStages } from "../../../utils/common features/ressetStages";
import { isObjectHasValue } from "../../../utils/isObjectHasValue";
import redisClient from "../../../config/redisClient";
import { assignedTo, selectedFields } from "../../../constants/BEconstants";
import { populateWithAssignedToField } from "../../../utils/populateWithRedis";
import { syncSiteMeasurement } from "../site measurement controller/siteMeasurements.controller";
import { updateProjectCompletionPercentage } from "../../../utils/updateProjectCompletionPercentage ";
import { syncAdminWall, syncWorkerWall } from "../../Wall Painting controllers/adminWallPainting.controller";
import { syncPreRequireties } from "../../PreRequireties Controllers/preRequireties.controllers";




export const syncRequirmentForm = async (projectId: Types.ObjectId) => {

  const form = await RequirementFormModel.findOne({ projectId })

  if (!form) {
    await RequirementFormModel.create({
      projectId,
      shareToken: null,
      assignedTo: null,
      clientData: {
        clientName: "",
        email: "",
        whatsapp: "",
        location: "",
      },
      isEditable: true, // ✅ your default
      status: "pending", // ✅ your default
      kitchen: {
        layoutType: null,
        measurements: {
          top: null,
          left: null,
          right: null
        },
        kitchenPackage: null,
        graniteCountertop: null,
        numberOfShelves: null,
        notes: null
      },
      bedroom: {
        numberOfBedrooms: null,
        bedType: null,
        wardrobeIncluded: null,
        falseCeilingRequired: null,
        tvUnitRequired: null,
        studyTableRequired: null,
        bedroomPackage: null,
        notes: null,
      },
      wardrobe: {
        wardrobeType: null,
        lengthInFeet: null,
        heightInFeet: null,
        mirrorIncluded: null,
        wardrobePackage: null,
        numberOfShelves: null,
        numberOfDrawers: null,
        notes: null,
      },
      livingHall: {
        seatingStyle: null,
        tvUnitDesignRequired: null,
        falseCeilingRequired: null,
        wallDecorStyle: null,
        numberOfFans: null,
        numberOfLights: null,
        livingHallPackage: null,
        notes: null,
      },
      additionalNotes: null,
      timer: {
        startedAt: null,
        completedAt: null,
        deadLine: null,
        reminderSent: false,
      },
      uploads: [],
    });
  }
  else {
    form.timer.startedAt = null
    form.timer.completedAt = null
    form.timer.deadLine = null
    form.timer.reminderSent = false
    await form.save()
  }
  const redisMainKey = `stage:RequirementFormModel:${projectId}`
  await redisClient.del(redisMainKey)


}





// SUBMIT REQUIREMENT PUBLIC FORM FOR ONLY CLIENT 
const submitRequirementForm = async (req: Request, res: Response,): Promise<void> => {
  try {
    const { projectId } = req.params
    const { token } = req.query;
    const { clientData, kitchen, wardrobe, bedroom, livingHall } = req.body;


    if (!token || typeof token !== "string") {
      res.status(400).json({ ok: false, message: "Missing or invalid share token." });
      return;
    }

    // Validate required client info
    if (!clientData?.clientName || !clientData?.email || !clientData?.whatsapp) {
      res.status(400).json({
        success: false,
        message: "Missing required client information.",
      });
      return;
    }

    const form = await RequirementFormModel.findOne({ projectId })

    if (!form) {
      res.status(404).json({ ok: false, message: "Form not found or token invalid." });
      return;
    }

    if (form.shareTokenExpiredAt && new Date() > form.shareTokenExpiredAt) {
      res.status(410).json({ message: "This form link has expired.", ok: false });
      return
    }

    // if (form?.clientConfirmed) {
    //   res.status(400).json({ message: "This form has already been submitted by another client.", ok: false });
    //   return
    // }

    let executeValidationForKitchen = isObjectHasValue(kitchen)
    let executeValidationForBedroom = isObjectHasValue(bedroom)
    let executeValidationForWardrobe = isObjectHasValue(wardrobe)
    let executeValidationForLivingHall = isObjectHasValue(livingHall)

    if (executeValidationForKitchen) {
      const kitchenError = validateKitchenInput(kitchen);
      if (kitchenError) {
        res.status(400).json({ message: `Kitchen input validation failed: ${kitchenError}`, ok: false });
        return
      }
    }

    if (executeValidationForBedroom) {
      const wardrobeError = validateWardrobeInput(wardrobe);
      if (wardrobeError) {
        res.status(400).json({ message: `Wardrobe input validation failed: ${wardrobeError}`, ok: false });
        return
      }
    }

    if (executeValidationForWardrobe) {
      const bedroomError = validateBedroomInput(bedroom);
      if (bedroomError) {
        res.status(400).json({ message: `Bedroom input validation failed: ${bedroomError}`, ok: false });
        return
      }
    }

    if (executeValidationForLivingHall) {
      const livingError = validateLivingHallInput(livingHall);
      if (livingError) {
        res.status(400).json({ message: `Living Hall input validation failed: ${livingError}`, ok: false });
        return
      }
    }



    form.clientData = {
      clientName: clientData.clientName,
      email: clientData.email,
      whatsapp: clientData.whatsapp,
      location: clientData?.location || "N/A",
    };
    form.kitchen = kitchen;
    form.wardrobe = wardrobe;
    form.bedroom = bedroom;
    form.livingHall = livingHall;
    form.clientConfirmed = true;
    timerFunctionlity(form, "startedAt")
    form.shareTokenExpiredAt = new Date();

    await form.save();

    await populateWithAssignedToField({ stageModel: RequirementFormModel, projectId, dataToCache: form })

    res.status(201).json({ ok: true, message: "Requirement form submitted successfully.", data: form, });
  } catch (error: any) {
    res.status(500).json({ ok: false, message: "Server error, try again after some time", error: error.message, });
    return
  }
};


const delteRequirementForm = async (req: Request, res: Response,): Promise<void> => {
  try {
    const { projectId } = req.params

    if (!projectId) {
      res.status(400).json({ ok: false, message: "projectId is missing" });
      return;
    }

    const existingForm = await RequirementFormModel.findOne({ projectId })

    if (existingForm?.status === "completed") {
      res.status(404).json({ ok: false, message: "status is already completed" });
      return;
    }

    const form = await RequirementFormModel.findOneAndDelete({ projectId })

    if (!form) {
      res.status(404).json({ ok: false, message: "Form not found" });
      return;
    }

    await redisClient.del(`stage:RequirementFormModel:${projectId}`)

    res.status(200).json({ ok: true, message: "Requirement form deleted successfully.", data: form });
  } catch (error: any) {
    res.status(500).json({ ok: false, message: "Server error, try again after some time", error: error.message, });
    return
  }
};


const getFormFilledDetails = async (req: Request, res: Response,): Promise<any> => {
  try {
    const { projectId } = req.params

    if (!projectId) {
      res.status(400).json({ ok: false, message: "projectId is missing" });
      return;
    }

    
    const redisKeyMain = `stage:RequirementFormModel:${projectId}`
    // await redisClient.del(redisKeyMain)
    const redisCache = await redisClient.get(redisKeyMain)

    if (redisCache) {
      return res.json({ ok: true, message: "form fetchd form cache", data: JSON.parse(redisCache) })
    }

    const form = await RequirementFormModel.findOne({ projectId }).populate("assignedTo", "_id staffName email");

    if (!form) {
      res.status(404).json({ ok: false, message: "Form not found or token invalid." });
      return;
    }

    await redisClient.set(redisKeyMain, JSON.stringify(form.toObject()), { EX: 60 * 10 })

    res.status(200).json({ ok: true, message: "Requirement from fetched succesfully.", data: form });
  } catch (error: any) {
    res.status(500).json({ ok: false, message: "Server error please try again", error: error.message, });
    return
  }
};



const generateShareableFormLink = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    if (!Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ ok: false, message: "Invalid project ID" });
    }

    // Generate unique token
    const token = crypto.randomBytes(16).toString("hex");

    // Save token to DB in requirement form with status draft if it doesn't exist
    let form = await RequirementFormModel.findOne({ projectId });

    if (form?.clientConfirmed) {
      res.status(400).json({ ok: false, message: "Client Has confirmed, Cannot generate new link." });
      return
    }

    if (!form) {
      form = new RequirementFormModel({
        projectId,
        shareToken: token,
        shareTokenExpiredAt: null,
        clientConfirmed: false,
        isEditable: true,
        status: "pending",
        timer: {},
        clientData: {
          clientName: "",
          email: "",
          whatsapp: "",
          location: ""
        },
        kitchen: {
          //   layoutType: "L-shaped",
          //   measurements: { top: 0, left: 0, right: 0 },
          //   kitchenPackage: "Essentials",
        },
        livingHall: {
          //   seatingStyle: "Sofa Set",
          //   tvUnitDesignRequired: false,
          //   falseCeilingRequired: false,
          //   wallDecorStyle: "Paint",
          //   numberOfFans: 0,
          //   numberOfLights: 0,
          //   livingHallPackage: "Essentials",
          //   notes: ""
        },
        bedroom: {
          //   numberOfBedrooms: 0,
          //   bedType: "Single",
          //   wardrobeIncluded: false,
          //   falseCeilingRequired: false,
          //   tvUnitRequired: false,
          //   studyTableRequired: false,
          //   bedroomPackage: "Essentials",
          //   notes: ""
        },
        wardrobe: {
          //   wardrobeType: "Sliding",
          //   lengthInFeet: 0,
          //   heightInFeet: 0,
          //   mirrorIncluded: false,
          //   wardrobePackage: "Essentials",
          //   numberOfShelves: 0,
          //   numberOfDrawers: 0,
          //   notes: ""
        },
        // additionalNotes: ""
      });
    } else {
      form.shareToken = token;
    }

    await form.save();
    // const redisKeyMain = `stage:RequirementFormModel:${projectId}`
    // await redisClient.set(redisKeyMain, JSON.stringify(form.toObject()), { EX: 60 * 10 })

    await populateWithAssignedToField({ stageModel: RequirementFormModel, projectId, dataToCache: form })

    const link = `${process.env.FRONTEND_URL}/requirementform/${projectId}/${token}`;

    return res.status(200).json({ ok: true, data: link });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error, try again after some time" });
  }
};

// Lock form (make it non-editable)
const lockRequirementForm = async (req: Request, res: Response): Promise<any> => {
  try {
    const { formId, projectId } = req.params;
    const form = await RequirementFormModel.findById(formId);

    if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

    form.status = "locked";
    await form.save();

    // const redisKeyMain = `stage:RequirementFormModel:${projectId}`
    // await redisClient.set(redisKeyMain, JSON.stringify(form.toObject()), { EX: 60 * 10 })
    await populateWithAssignedToField({ stageModel: RequirementFormModel, projectId, dataToCache: form })

    return res.status(200).json({ ok: true, message: "Form has been locked", data: form });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error, try again after some time" });
  }
};

// Mark form stage as completed (finalize the requirement gathering step)
const markFormAsCompleted = async (req: Request, res: Response): Promise<any> => {
  try {
    const { formId, projectId } = req.params;
    console.log("formId", formId)
    const form = await RequirementFormModel.findById(formId);

    if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

    if (form.status === "completed") {
      return res.status(400).json({ ok: false, message: "Stage already completed" });
    }

    form.status = "completed";
    form.isEditable = false
    timerFunctionlity(form, "completedAt")
    await form.save();

    if (form.status === "completed") {
      await syncSiteMeasurement(projectId)
    }

    // const redisKeyMain = `stage:RequirementFormModel:${projectId}`
    // await redisClient.set(redisKeyMain, JSON.stringify(form.toObject()), { EX: 60 * 10 })

    await populateWithAssignedToField({ stageModel: RequirementFormModel, projectId, dataToCache: form })


    res.status(200).json({ ok: true, message: "Requirement stage marked as completed", data: form });
    updateProjectCompletionPercentage(projectId);
    await syncWorkerWall(projectId)
    await syncAdminWall(projectId)
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error, try again after some time" });
  }
};


// Mark form stage as completed (finalize the requirement gathering step)
export const setRequirementStageDeadline = (req: Request, res: Response): Promise<any> => {
  return handleSetStageDeadline(req, res, {
    model: RequirementFormModel,
    stageName: "Requirement Form"
  });
};




const deleteRequirementStageFile = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, fileId } = req.params;

    const doc = await RequirementFormModel.findOne({ projectId });
    if (!doc) return res.status(404).json({ ok: false, message: "requriement stage not found" });

    // const file = doc.uploads.find((file: any) => file._id.toString() === fileId);

    const index = doc.uploads.findIndex((upload: any) => upload._id?.toString() === fileId);
    if (index === -1) return res.status(404).json({ ok: false, message: "File not found" });

    doc.uploads.splice(index, 1);
    await doc.save();
    // const redisKeyMain = `stage:RequirementFormModel:${projectId}`
    // await redisClient.set(redisKeyMain, JSON.stringify(doc.toObject()), { EX: 60 * 10 })

    await populateWithAssignedToField({ stageModel: RequirementFormModel, projectId, dataToCache: doc })


    return res.status(200).json({ ok: true, message: "File deleted successfully" });
  } catch (err) {
    console.error("Error deleting uploaded file:", err);
    return res.status(500).json({ ok: false, message: "Internal server error" });
  }
};

export {
  submitRequirementForm,
  delteRequirementForm,
  getFormFilledDetails,
  generateShareableFormLink,
  lockRequirementForm,
  markFormAsCompleted,

  deleteRequirementStageFile
}