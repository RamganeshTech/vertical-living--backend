import agenda from "../config/agenda";
import { JOB_NAMES } from "../constants/BEconstants";
import { createPaymentMainAccUtil } from "../controllers/Department controllers/Accounting Controller/PaymentMainAcc_controllers/paymentMainAcc.controller";
import { AccountingModel } from "../models/Department Models/Accounting Model/accountingMain.model";
import ProcurementModelNew, { IProcurementItemsNew } from "../models/Department Models/ProcurementNew Model/procurementNew.model";
import OrganizationModel from "../models/organization models/organization.model";
import { Types } from "mongoose"
// import ProcurementModelNew from "../models/ProcurementModelNew";
// import OrganizationModel from "../models/OrganizationModel";
// import { createPaymentMainAccUtil } from "../utils/paymentUtils";

// This name "auto-sync-to-payment" MUST match what you use in agenda.schedule
agenda.define(JOB_NAMES.SYNC_TO_PAYMENT, async (job: any) => {
    const { procurementId, organizationId } = job.attrs.data;

    try {
        // 1. Re-check Organization Mode (Hybrid Safety)
        const org = await OrganizationModel.findById(organizationId);
        // if (org?.mode !== "automation") return;

        console.log("schedule is gettnig called")
        // 2. Fetch the Procurement record
        const procurement = await ProcurementModelNew.findById(procurementId);

        // 3. Safety Check: If already synced (by human), stop.
        if (!procurement || procurement.isSyncWithPaymentsSection) return;



        const paymentItems = procurement.selectedUnits.map((item: IProcurementItemsNew, index: number) => {
            return {
                itemName: item.subItemName,
                quantity: item.quantity,
                rate: item.rate,
                unit: item.unit || "",
                totalCost: item.totalCost,
                dueDate: null,
                status: "pending",
                orderId: "",
                paymentId: "",
                transactionId: "",
                paidAt: null,
                failureReason: "",
                fees: null,
                tax: null
            }
        });



        // 4. Run your Payment Logic (Copy of your manual logic)
        // ... call createPaymentMainAccUtil here ...

        const newPayemnt = await createPaymentMainAccUtil({
            paymentPersonId: null,
            paymentPersonModel: null,
            paymentPersonName: procurement?.shopDetails?.contactPerson || "",
            organizationId: procurement?.organizationId,
            accountingRef: null,
            projectId: procurement?.projectId || null,
            fromSectionModel: "ProcurementModelNew",
            fromSectionId: procurement._id as Types.ObjectId,
            fromSection: "Procurement",
            fromSectionNumber: procurement?.procurementNumber || procurement?.refPdfId || "",
            orderMaterialDeptNumber: procurement?.fromDeptNumber || null,
            orderMaterialRefId: (procurement as any)?.fromDeptRefId || null,
            paymentDate: null,
            dueDate: null,
            subject: "",
            procurementDeptValidation: "not verified by procurement department",
            items: paymentItems,
            totalAmount: procurement.totalCost || 0,
            discountPercentage: 0,
            discountAmount: 0,
            taxPercentage: 0,
            taxAmount: 0,
            grandTotal: procurement.totalCost || 0,
            paymentType: "",
            advancedAmount: {
                totalAmount: 0,
                status: 'pending',
                orderId: "",
                paymentId: "",
                transactionId: "",
                paidAt: null,
                failureReason: null,
                fees: null,
                tax: null,
            },
            amountRemaining: {
                totalAmount: procurement?.totalCost || 0,
                status: 'pending',
                orderId: "",
                paymentId: "",
                transactionId: "",
                paidAt: null,
                failureReason: null,
                fees: null,
                tax: null,
            },

            notes: null,
            isSyncedWithAccounting: false,
            generalStatus: "pending"
        })

        procurement.isConfirmedRate = true;
        procurement.isSyncWithPaymentsSection = true;
        await procurement.save();


        console.log("new payment", newPayemnt)

         await AccountingModel.findOneAndUpdate(
                    {
                        orderMaterialRefId: procurement.fromDeptRefId,
                    },
                    {
                        $set: {
                            // Update fields that might have changed in the bill
                            amount: procurement?.totalCost,
                            projectId: procurement?.projectId || null,
                            assoicatedPersonName: procurement?.shopDetails?.contactPerson || null,
        
                            deptGeneratedDate: (procurement as any).updatedAt || (procurement as any).createdAt || null,
                            deptNumber: procurement?.procurementNumber || null,
                            deptDueDate: null,
        
                            referenceId: procurement._id!,
                            referenceModel: "ProcurementModelNew",
        
                            // Optional: Update person ID if vendor changed
                            assoicatedPersonId: null,
        
                            // IMPORTANT: We DO NOT include 'status' or 'paymentId' here.
                            // Those are controlled by the Payment Controller.
                        }
                    },
                    { new: true }
                );
        
        

        console.log(`✔ Automation: Successfully moved ${procurementId} to Payments`);
    } catch (error) {
        console.error("Automation Job Failed:", error);
    }
});

