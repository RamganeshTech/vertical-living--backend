// controllers/payment/paymentConsent.controllers.ts

import { Request, Response } from "express";
import PaymentConfirmationModel from "../../../../models/Stage Models/Payment Confirmation model/PaymentConfirmation.model";
import crypto from "crypto";
import { RoleBasedRequest } from "../../../../types/types";


// 📌 This is your reusable default HTML Terms
const defaultConsentContent = `
<h2 style="text-align: center;">Payment Terms & Client Consent</h2>

<p>
  This agreement confirms that the client agrees to the full payment terms as outlined below for the
  execution of the project.
</p>

<h3>1. Payment Terms</h3>
<ul>
  <li>The total agreed project amount must be paid in full before commencement of work, unless otherwise mutually agreed in writing.</li>
  <li>All payments shall be made through authorized payment methods as communicated by the company.</li>
</ul>

<h3>2. No Refund Policy</h3>
<ul>
  <li>Payments made towards the project are non-refundable once the work has commenced, except in cases of proven negligence or breach of contract by the company.</li>
</ul>

<h3>3. Deliverables</h3>
<ul>
  <li>The project deliverables will be executed as per the agreed scope and timeline shared with the client.</li>
  <li>Any additional work requested by the client will be treated as separate and may incur extra charges.</li>
</ul>

<h3>4. Client Responsibilities</h3>
<ul>
  <li>The client shall provide necessary approvals, information, and access in a timely manner to avoid project delays.</li>
</ul>

<h3>5. Dispute Resolution</h3>
<ul>
  <li>In case of any disputes, both parties agree to resolve the matter amicably through mutual discussion.</li>
  <li>All legal matters will be governed by the jurisdiction of [Your City/State, India].</li>
</ul>

<h3>6. Consent</h3>
<p>
  By clicking "I Agree", the client acknowledges that they have read, understood, and agree to abide by the above terms and conditions.
</p>

<p style="text-align: center;">
  <strong>[Your Company Name]</strong><br/>
  [Your Company Address]<br/>
  [Contact: phone / email]
</p>
`;

export const syncPaymentConfirationModel = async (projectId:string, totalAmount:number): Promise<any> => {
    if (!projectId) {
      return
    }
    // 👇 Example doc creation
    const paymentDoc = await PaymentConfirmationModel.create({
      projectId: projectId,
      assignedTo: null,
      isConsentRequired: true, // default true
      timer: {}, // Will initialize empty fields with default schema values
      totalAmount: totalAmount || 0,
      paymentClientConsent: {
        content: defaultConsentContent,
        agreedByClientId: null,
        agreedAt: null,
        // agreedByName: null,
        // agreedByEmail: null,
        agreementToken: null,
        agreedByClient: false,
      },
      paymentSchedule: {
        milestone: "Full Payment",
        amount: totalAmount || 0,
        dueDate: null,
        clientApprovalStatus: "pending",
        clientNotes: "",
        clientApprovedAt: null,
        mdApprovalStatus: "pending",
        mdNotes: "",
        mdApprovedAt: null,
      },
      paymentTransaction: null,
    });

  
};


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
    
    let link:string
    if(process.env.NODE_ENV === "development"){
        link = `http://localhost:5173/clientconsent/public/${projectId}/${token}`;
      }
    else{
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
