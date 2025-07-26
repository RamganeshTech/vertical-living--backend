import { Request, Response } from "express";
import { handleSetStageDeadline, timerFunctionlity } from "../../../utils/common features/timerFuncitonality";
import PaymentConfirmationModel from "../../../models/Stage Models/Payment Confirmation model/PaymentConfirmation.model";
import { syncOrderingMaterials } from "../ordering material controller/orderingMaterial.controller";
import { updateProjectCompletionPercentage } from "../../../utils/updateProjectCompletionPercentage ";
import { addOrUpdateStageDocumentation } from "../../documentation controller/documentation.controller";

import { Types } from "mongoose"



// <h3 style="color: #1f2937; font-size: 20px; margin-top: 20px; margin-bottom: 8px;">
//   4. Client Responsibilities
// </h3>
// <ul style="margin-bottom: 16px; padding-left: 20px;">
//   <li>
//     The client shall provide necessary approvals, information, and access in a timely manner to avoid project delays.
//   </li>
// </ul>

// <h3 style="color: #1f2937; font-size: 20px; margin-top: 20px; margin-bottom: 8px;">
//   5. Dispute Resolution
// </h3>
// <ul style="margin-bottom: 16px; padding-left: 20px;">
//   <li style="margin-bottom: 6px;">
//     In case of any disputes, both parties agree to resolve the matter amicably through mutual discussion.
//   </li>
//   <li>
//     All legal matters will be governed by the jurisdiction of [Your City/State, India].
//   </li>
// </ul>



// 📌 This is your reusable default HTML Terms
const defaultConsentContent = `
<h2 style="text-align: center; color: #2563eb; font-size: 28px; margin-bottom: 20px;">
  Payment Terms & Client Consent
</h2>

<p style="margin-bottom: 16px; font-size: 16px; line-height: 1.5;">
  This agreement confirms that the client agrees to the full payment terms as outlined below for the
  execution of the project.
</p>

<h3 style="color: #1f2937; font-size: 20px; margin-top: 20px; margin-bottom: 8px;">
  1. Payment Terms
</h3>
<ul style="margin-bottom: 16px; padding-left: 20px;">
  <li style="margin-bottom: 6px;">
    The total agreed project amount must be paid in full before commencement of work, unless otherwise mutually agreed in writing.
  </li>
  <li>
    All payments shall be made through authorized payment methods as communicated by the company.
  </li>
</ul>

<h3 style="color: #1f2937; font-size: 20px; margin-top: 20px; margin-bottom: 8px;">
  2. No Refund Policy
</h3>
<ul style="margin-bottom: 16px; padding-left: 20px;">
  <li>
    Payments made towards the project are non-refundable once the work has commenced, except in cases of proven negligence or breach of contract by the company.
  </li>
</ul>

<h3 style="color: #1f2937; font-size: 20px; margin-top: 20px; margin-bottom: 8px;">
  3. Deliverables
</h3>
<ul style="margin-bottom: 16px; padding-left: 20px;">
  <li style="margin-bottom: 6px;">
    The project deliverables will be executed as per the agreed scope and timeline shared with the client.
  </li>
  <li>
    Any additional work requested by the client will be treated as separate and may incur extra charges.
  </li>
</ul>

<h3 style="color: #1f2937; font-size: 20px; margin-top: 20px; margin-bottom: 8px;">
  4. Consent
</h3>
<p style="margin-bottom: 20px; font-size: 16px; line-height: 1.5;">
  By clicking "I Agree", the client acknowledges that they have read, understood, and agree to abide by the above terms and conditions.
</p>

<p style="text-align: center; font-weight: bold; color: #2563eb; font-size: 18px;">
  Vertical Living Policy
</p>

`;

export const syncPaymentConfirationModel = async (projectId: string | Types.ObjectId, totalAmount: number): Promise<any> => {
  if (!projectId) {
    return
  }

  const existing = await PaymentConfirmationModel.findOne({ projectId })
  const timer = {
    startedAt: new Date(),
    completedAt: null,
    deadLine: null,
    reminderSent: false,
  };
console.log("exisitn payment", existing)
  if (!existing) {
    await PaymentConfirmationModel.create({
      projectId: projectId,
      assignedTo: null,
      isConsentRequired: true, // default true
      timer: timer, // Will initialize empty fields with default schema values
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
      paymentTransaction: {
        clientId: null,
        paymentGateway: null,
        gatewayOrderId: null,
        gatewayPaymentId: null,
        status: null,
        amount: null,
        currency: "INR",
        paidAt: null
      },
    });
  }
  else {
    existing.timer = timer
    existing.totalAmount = totalAmount || 0,
      existing.paymentSchedule.amount = totalAmount

    await existing.save()
  }


};

const getPaymentConfirmation = async (req: Request, res: Response): Promise<any> => {
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

    if (form.status === "completed") {
      await syncOrderingMaterials(projectId)

      await addOrUpdateStageDocumentation({
        projectId,
        stageNumber: "7", // ✅ Put correct stage number here
        description: "Payment Stage is documented",
        uploadedFiles: [], // optionally add files here
        price: form.totalAmount
      })
    }


    res.status(200).json({ ok: true, message: "Payment stage marked as completed", data: form });

    updateProjectCompletionPercentage(projectId);

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