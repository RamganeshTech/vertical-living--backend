// controllers/payment/paymentConsent.controllers.ts

import { Request, Response } from "express";
import PaymentConfirmationModel from "../../../../models/Stage Models/Payment Confirmation model/PaymentConfirmation.model";
import crypto from "crypto";
import { RoleBasedRequest } from "../../../../types/types";





const toggleConsentRequired = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({ ok: false, message: "Project ID is required." });
    }

    const paymentDoc = await PaymentConfirmationModel.findOne({ projectId });

    if (!paymentDoc) {
      return res.status(404).json({ ok: false, message: "Payment Confirmation not found." });
    }

    // Toggle the flag
    paymentDoc.isConsentRequired = !paymentDoc.isConsentRequired;

    await paymentDoc.save();

    return res.status(200).json({
      ok: true,
      message: `Consent requirement toggled to ${paymentDoc.isConsentRequired}`,
      data: paymentDoc.isConsentRequired,
    });

  } catch (err) {
    console.error("Toggle consent required error:", err);
    return res.status(500).json({ ok: false, message: "Server error." });
  }
};



// controllers/payment/paymentConsent.controllers.ts
const generateConsentLink = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({ ok: false, message: "Project ID is required.", data: null });
    }

    const paymentDoc = await PaymentConfirmationModel.findOne({ projectId });
    if (!paymentDoc) {
      return res.status(404).json({ ok: false, message: "Payment Confirmation not found.", data: null });
    }

    if (!paymentDoc.isConsentRequired) {
      return res.status(400).json({ ok: false, message: "Consent is not required for this project.", data: null });
    }

    if (paymentDoc.paymentClientConsent?.isAgreed) {
      return res.status(400).json({ ok: false, message: "Consent already given.", data: null });
    }

    const token = crypto.randomBytes(32).toString("hex");
    paymentDoc.paymentClientConsent.agreementToken = token;

    let link: string
    if (process.env.NODE_ENV === "development") {
      link = `http://localhost:5173/clientconsent/public/${projectId}/${token}`;
    }
    else {
      link = `${process.env.FRONTEND_URL}/clientconsent/public/${projectId}/${token}`;
    }
    paymentDoc.paymentClientConsent.link = link
    await paymentDoc.save();
    return res.status(200).json({
      ok: true,
      message: "Consent link generated successfully.",
      data: { link }
    });

  } catch (err) {
    console.error("Generate consent link error:", err);
    return res.status(500).json({ ok: false, message: "Server error.", data: null });
  }
};



const acceptClientConsent = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { projectId, token } = req.params;
    // const { clientId } = req.body;

    // if (!clientId) {
    //   return res.status(400).json({ ok: false, message: "Client ID is required.", data: null });
    // }

    const paymentDoc = await PaymentConfirmationModel.findOne({ projectId });

    if (!paymentDoc || !paymentDoc.paymentClientConsent) {
      return res.status(404).json({ ok: false, message: "Consent data not found.", data: null });
    }

    if (!paymentDoc.isConsentRequired) {
      return res.status(400).json({ ok: false, message: "Consent is not required for this project.", data: null });
    }

    // if (paymentDoc.paymentClientConsent.agreedByClientId) {
    //   return res.status(400).json({ ok: false, message: "Consent already given.", data: null });
    // }

    if (paymentDoc.paymentClientConsent.isAgreed) {
      return res.status(400).json({ ok: false, message: "Consent already given.", data: null });
    }

    if (paymentDoc.paymentClientConsent.agreementToken !== token) {
      return res.status(400).json({ ok: false, message: "Consent Form token Expired or Invalid.", data: null });
    }

    // ✅ Save the client ID securely
    // paymentDoc.paymentClientConsent.agreedByClientId = clientId;
    paymentDoc.paymentClientConsent.isAgreed = true
    paymentDoc.paymentClientConsent.agreedAt = new Date();
    // paymentDoc.paymentClientConsent.agreedByName = name || null;
    // paymentDoc.paymentClientConsent.agreedByEmail = email || null;

    // ✅ Invalidate token permanently
    paymentDoc.paymentClientConsent.agreementToken = null;

    await paymentDoc.save();

    return res.status(200).json({
      ok: true,
      message: "Client consent accepted successfully.",
      data: {
        agreedByClientId: paymentDoc.paymentClientConsent.agreedByClientId,
        agreedAt: paymentDoc.paymentClientConsent.agreedAt
      }
    });

  } catch (err) {
    console.error("Accept client consent error:", err);
    return res.status(500).json({ ok: false, message: "Server error.", data: null });
  }
};



export {
  toggleConsentRequired,
  generateConsentLink,
  acceptClientConsent,
}
