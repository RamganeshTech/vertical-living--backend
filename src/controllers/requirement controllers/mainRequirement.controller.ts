import { Request, Response, NextFunction } from "express";
import { RequirementFormModel } from "../../models/requirment model/requirement.model";
import { validateBedroomInput, validateKitchenInput, validateLivingHallInput, validateWardrobeInput } from "../../validations/requirement validation/kitchenValidation";
import { Types } from "mongoose";
import crypto from 'crypto';

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
    if (!clientData.clientName || !clientData.email || !clientData.whatsapp) {
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

    const kitchenError = validateKitchenInput(kitchen);
    if (kitchenError) {
      res.status(400).json({ message: `Kitchen input validation failed: ${kitchenError}`, ok: false });
      return
    }

    const wardrobeError = validateWardrobeInput(wardrobe);
    if (wardrobeError) {
      res.status(400).json({ message: `Wardrobe input validation failed: ${wardrobeError}`, ok: false });
      return
    }

    const bedroomError = validateBedroomInput(bedroom);
    if (bedroomError) {
      res.status(400).json({ message: `Bedroom input validation failed: ${bedroomError}`, ok: false });
      return
    }

    const livingError = validateLivingHallInput(livingHall);
    if (livingError) {
      res.status(400).json({ message: `Living Hall input validation failed: ${livingError}`, ok: false });
      return
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
    form.shareTokenExpiredAt = new Date();

    await form.save();

    res.status(201).json({ ok: true, message: "Requirement form submitted successfully.", data: form, });
  } catch (error: any) {
    res.status(500).json({ ok: false, message: "Server error, try again after some time", error: error.message, });
    return
  }
};


const getFormFilledDetails = async (req: Request, res: Response,): Promise<void> => {
  try {
    const { projectId } = req.params

    const form = await RequirementFormModel.findOne({ projectId })

    if (!form) {
      res.status(404).json({ ok: false, message: "Form not found or token invalid." });
      return;
    }


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
    const { formId } = req.params;
    const form = await RequirementFormModel.findById(formId);

    if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

    form.status = "locked";
    await form.save();

    return res.status(200).json({ ok: true, message: "Form has been locked", data:form });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error, try again after some time" });
  }
};

// Mark form stage as completed (finalize the requirement gathering step)
const markFormAsCompleted = async (req: Request, res: Response): Promise<any> => {
  try {
    const { formId } = req.params;
    const form = await RequirementFormModel.findById(formId);

    if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

    form.status = "completed";
    await form.save();

    return res.status(200).json({ ok: true, message: "Requirement stage marked as completed", data:form });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error, try again after some time" });
  }
};






export { 
  submitRequirementForm,
  getFormFilledDetails,
   generateShareableFormLink,
   lockRequirementForm,
   markFormAsCompleted 
  }