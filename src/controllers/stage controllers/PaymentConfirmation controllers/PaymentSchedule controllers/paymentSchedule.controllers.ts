import { Request, Response } from "express";
import PaymentConfirmationModel from "../../../../models/Stage Models/Payment Confirmation model/PaymentConfirmation.model";





const getPaymentSchedule = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({ ok: false, message: "Project ID is required." });
    }

    const paymentDoc = await PaymentConfirmationModel.findOne({ projectId });

    if (!paymentDoc) {
      return res.status(404).json({ ok: false, message: "Payment Confirmation stage not found." });
    }

    return res.status(200).json({
      ok: true,
      message: "Payment schedule fetched successfully.",
      data: paymentDoc.paymentSchedule,
    });

  } catch (err) {
    console.error("Error fetching payment schedule:", err);
    return res.status(500).json({ ok: false, message: "Server error." });
  }
};



const updateDueDate = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    const { dueDate } = req.body;

    if (!projectId) {
      return res.status(400).json({ ok: false, message: "Project ID is required." });
    }

    if(new Date() > new Date(dueDate)){
      return res.status(400).json({ ok: false, message: "Due Date should not be in past" });
    }

    const paymentDoc = await PaymentConfirmationModel.findOne({ projectId });
    if (!paymentDoc) {
      return res.status(404).json({ ok: false, message: "Payment Confirmation not found." });
    }

    // if (paymentDoc.isConsentRequired && !paymentDoc.paymentClientConsent.agreedByClientId) {
    //   return res.status(400).json({ ok: false, message: "Client consent not given. Cannot update notes." });
    // }

    if (paymentDoc.isConsentRequired && !paymentDoc.paymentClientConsent.isAgreed) {
      return res.status(400).json({ ok: false, message: "Client consent not given. Cannot update schedule." });
    }

    paymentDoc.paymentSchedule.dueDate  = dueDate || paymentDoc.paymentSchedule.dueDate 

    await paymentDoc.save();

    return res.status(200).json({ ok: true, message: "Due Date updated.", data: paymentDoc.paymentSchedule });
  } catch (err) {
    console.error("Error updating client notes:", err);
    return res.status(500).json({ ok: false, message: "Server error." });
  }
};

// CLIENT APPROVAL STATUS
const updateClientApprovalStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    const { status } = req.body; // expecting "pending" | "approved" | "rejected"

    if (!projectId || !status) {
      return res.status(400).json({ ok: false, message: "Project ID and status are required." });
    }

    const paymentDoc = await PaymentConfirmationModel.findOne({ projectId });
    if (!paymentDoc) {
      return res.status(404).json({ ok: false, message: "Payment Confirmation not found." });
    }

    // if (paymentDoc.isConsentRequired && !paymentDoc.paymentClientConsent.agreedByClientId) {
    //   return res.status(400).json({ ok: false, message: "Client consent not given. Cannot update schedule." });
    // }

    if (paymentDoc.isConsentRequired && !paymentDoc.paymentClientConsent.isAgreed) {
      return res.status(400).json({ ok: false, message: "Client consent not given. Cannot update schedule." });
    }

    paymentDoc.paymentSchedule.clientApprovalStatus = status;

    if (status === "approved") {
      paymentDoc.paymentSchedule.clientApprovedAt = new Date();
    } else {
      paymentDoc.paymentSchedule.clientApprovedAt = null;
    }

    await paymentDoc.save();

    return res.status(200).json({ ok: true, message: "Client approval status updated.", data: paymentDoc.paymentSchedule });
  } catch (err) {
    console.error("Error updating client approval status:", err);
    return res.status(500).json({ ok: false, message: "Server error." });
  }
};

// CLIENT NOTES
const updateClientNotes = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    const { notes } = req.body;

    if (!projectId) {
      return res.status(400).json({ ok: false, message: "Project ID is required." });
    }

    if (!notes.trim()) {
      return res.status(400).json({ ok: false, message: "write something Notes" });
    }

    const paymentDoc = await PaymentConfirmationModel.findOne({ projectId });
    if (!paymentDoc) {
      return res.status(404).json({ ok: false, message: "Payment Confirmation not found." });
    }

    // if (paymentDoc.isConsentRequired && !paymentDoc.paymentClientConsent.agreedByClientId) {
    //   return res.status(400).json({ ok: false, message: "Client consent not given. Cannot update notes." });
    // }

    if (paymentDoc.isConsentRequired && !paymentDoc.paymentClientConsent.isAgreed) {
      return res.status(400).json({ ok: false, message: "Client consent not given. Cannot update schedule." });
    }

    paymentDoc.paymentSchedule.clientNotes = notes || "";

    await paymentDoc.save();

    return res.status(200).json({ ok: true, message: "Client notes updated.", data: paymentDoc.paymentSchedule });
  } catch (err) {
    console.error("Error updating client notes:", err);
    return res.status(500).json({ ok: false, message: "Server error." });
  }
};

// MD APPROVAL STATUS
const updateMdApprovalStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    const { status } = req.body; // expecting "pending" | "approved" | "rejected"

    if (!projectId || !status) {
      return res.status(400).json({ ok: false, message: "Project ID and status are required." });
    }

    const paymentDoc = await PaymentConfirmationModel.findOne({ projectId });
    if (!paymentDoc) {
      return res.status(404).json({ ok: false, message: "Payment Confirmation not found." });
    }

    // if (paymentDoc.isConsentRequired && !paymentDoc.paymentClientConsent.agreedByClientId) {
    //   return res.status(400).json({ ok: false, message: "Client consent not given. Cannot update MD approval status." });
    // }

    if (paymentDoc.isConsentRequired && !paymentDoc.paymentClientConsent.isAgreed) {
      return res.status(400).json({ ok: false, message: "Client consent not given. Cannot update schedule." });
    }


    paymentDoc.paymentSchedule.mdApprovalStatus = status;

    if (status === "approved") {
      paymentDoc.paymentSchedule.mdApprovedAt = new Date();
    } else {
      paymentDoc.paymentSchedule.mdApprovedAt = null;
    }

    await paymentDoc.save();

    return res.status(200).json({ ok: true, message: "MD approval status updated.", data: paymentDoc.paymentSchedule });
  } catch (err) {
    console.error("Error updating MD approval status:", err);
    return res.status(500).json({ ok: false, message: "Server error." });
  }
};

// MD NOTES
const updateMdNotes = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    const { notes } = req.body;

    if (!projectId) {
      return res.status(400).json({ ok: false, message: "Project ID is required." });
    }

    if (!notes.trim()) {
      return res.status(400).json({ ok: false, message: "write something Notes" });
    }

    const paymentDoc = await PaymentConfirmationModel.findOne({ projectId });
    if (!paymentDoc) {
      return res.status(404).json({ ok: false, message: "Payment Confirmation not found." });
    }

    // if (paymentDoc.isConsentRequired && !paymentDoc.paymentClientConsent.agreedByClientId) {
    //   return res.status(400).json({ ok: false, message: "Client consent not given. Cannot update MD notes." });
    // }


    if (paymentDoc.isConsentRequired && !paymentDoc.paymentClientConsent.isAgreed) {
      return res.status(400).json({ ok: false, message: "Client consent not given. Cannot update schedule." });
    }


    paymentDoc.paymentSchedule.mdNotes = notes || "";

    await paymentDoc.save();

    return res.status(200).json({ ok: true, message: "MD notes updated.", data: paymentDoc.paymentSchedule });
  } catch (err) {
    console.error("Error updating MD notes:", err);
    return res.status(500).json({ ok: false, message: "Server error." });
  }
};


// GROUPED EXPORT
export {
  getPaymentSchedule,
  updateDueDate,
  updateClientApprovalStatus,
  updateClientNotes,
  updateMdApprovalStatus,
  updateMdNotes
};
