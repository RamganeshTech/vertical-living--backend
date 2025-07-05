import { Request, Response } from "express";
import { handleSetStageDeadline, timerFunctionlity } from "../../../utils/common features/timerFuncitonality";
import PaymentConfirmationModel from "../../../models/Stage Models/Payment Confirmation model/PaymentConfirmation.model";





 const getPaymentConfirmation = async (req: Request,res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        ok: false,
        message: "Project ID is required",
      });
    }

    const paymentDoc = await PaymentConfirmationModel.findOne({
      projectId: projectId,
    }).populate("assignedTo")

    if (!paymentDoc) {
      return res.status(404).json({
        ok: false,
        message: "Payment Confirmation not found for this project",
      });
    }

    return res.status(200).json({
      ok: true,
      data: paymentDoc,
    });
  } catch (err) {
    console.error("Error fetching Payment Confirmation:", err);
    return res.status(500).json({
      ok: false,
      message: "Server error, please try again later",
    });
  }
};




const setPayementConfirmationStageDeadline = (req: Request, res: Response): Promise<any> => {
    return handleSetStageDeadline(req, res, {
        model: PaymentConfirmationModel,
        stageName: "Payment Confirmation"
    });
};



const paymentConfirmationCompletionStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const form = await PaymentConfirmationModel.findOne({ projectId });

        if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

        // if(form.status === "completed"){
        //     return res.status(400).json({ ok: false, message: "already set to completed stage" });
        // }

        form.status = "completed";
        form.isEditable = false
        timerFunctionlity(form, "completedAt")
        await form.save();


        return res.status(200).json({ ok: true, message: "cost estimation stage markjjjjjjjjjjed as completed", data: form });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Server error, try again after some time" });
    }
};




export {
    setPayementConfirmationStageDeadline,
    paymentConfirmationCompletionStatus,
    getPaymentConfirmation

}