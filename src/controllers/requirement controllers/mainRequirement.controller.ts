import { Request, Response, NextFunction } from "express";
import { RequirementFormModel } from "../../models/requirment model/requirement.model"; 
import { validateKitchenInput } from "../../validations/requirement validation/kitchenValidation";

 const submitRequirementForm = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      clientName,
      email,
      phoneNumber,
      whatsappNumber,
      location,

      kitchen,
      wardrobe,
      bedroom,
      livingHall,
    } = req.body;

    // Validate required client info
    if (!clientName || !email || !whatsappNumber) {
      res.status(400).json({
        success: false,
        message: "Missing required client information.",
      });
      return;
    }


    const kitchenErrors = validateKitchenInput(kitchen)
    


    const newForm = await RequirementFormModel.create({
      clientName,
      email,
      phoneNumber,
      whatsappNumber,
      location,

      kitchen,
      wardrobe,
      bedroom,
      livingHall,
    });

    res.status(201).json({
      success: true,
      message: "Requirement form submitted successfully.",
      data: newForm,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Server error while submitting requirement form.",
      error: error.message,
    });
  }
};



export {submitRequirementForm}