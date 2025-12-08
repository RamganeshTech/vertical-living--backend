import { model, Schema, Types } from "mongoose";
// import procurementLogger from "../../../Plugins/ProcurementDeptPluggin";



export interface IPaymentTimer {
    startedAt: Date | null;
    completedAt: Date | null;
    deadLine: Date | null;
    reminderSent: boolean
}


// STEP 1
export interface IPaymentClientConsent {
    content: string; // Stored in backend, editable per project if needed.
    agreedByClientId: Types.ObjectId;
    agreedAt: Date;
    isAgreed: boolean;
    link: string | null;
    // agreedByName: string | null;
    // agreedByEmail: string | null;
    agreementToken: string | null;
}


// STEP 2
export interface IPaymentScheduleItem {
    milestone: string;                  // E.g. "Advance", "50% Completion"
    amount: number;                     // E.g. 200000
    dueDate: Date;                      // Due date for this payment milestone

    clientApprovalStatus: "pending" | "approved" | "rejected";
    clientNotes: string;
    clientApprovedAt: Date | null;

    mdApprovalStatus: "pending" | "approved" | "rejected";
    mdNotes: string;
    mdApprovedAt: Date | null;
}

// STEP 3
export interface IPaymentTransaction {
    clientId: Types.ObjectId;              // 👈 your user ID for tracking
    paymentGateway: string;
    gatewayOrderId: string;                       // Razorpay Order ID
    gatewayPaymentId: string | null;              // Razorpay Payment ID (transaction ID)
    status: "created" | "attempted" | "successful" | "failed" | null;
    amount: number;
    currency: string;
    paidAt: Date | null;
}



export interface IClientQuotesSelected {
    quoteId: Types.ObjectId;              // 👈 your user ID for tracking
    quoteModel: string;
    quoteNo: string;
    status: "selected" | "rejected" | "draft" | null;
}

export interface IPaymentConfirmation {
    projectId: Types.ObjectId;

    assignedTo: Types.ObjectId | null;
    timer: IPaymentTimer;
    status: "pending" | "completed";
    isEditable: boolean;
    isConsentRequired: boolean;
    totalAmount: number;

    paymentClientConsent: IPaymentClientConsent
    paymentSchedule: IPaymentScheduleItem; //milestone approvals
    paymentTransaction: IPaymentTransaction
    quoteSelected: IClientQuotesSelected[]
}


const TimerSchema = new Schema<IPaymentTimer>({
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    deadLine: { type: Date, default: null },
    reminderSent: { type: Boolean, default: false },
}, { _id: false });



// STEP 1
const PaymentClientConsentSchema = new Schema<IPaymentClientConsent>({
    content: { type: String, }, // the terms, payment schedules, conditions
    // agreedByClientId: { type: Schema.Types.ObjectId, default:null },
    isAgreed: { type: Boolean, default: null },
    agreedAt: { type: Date, default: null },
    link: { type: String, default: null },
    // agreedByName: { type: String, default: null },
    // agreedByEmail: { type: String, default: null },
    agreementToken: { type: String, default: null },
}, { _id: false });



// STEP 2
const PaymentScheduleItemSchema = new Schema<IPaymentScheduleItem>({
    dueDate: { type: Date, default: null },

    clientApprovalStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    clientNotes: { type: String, default: "" },
    clientApprovedAt: { type: Date, default: null },

    mdApprovalStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    mdNotes: { type: String, default: "" },
    mdApprovedAt: { type: Date, default: null },
}, { _id: false });


const PaymentTransactionSchema = new Schema<IPaymentTransaction>(
    {
        clientId: { type: Schema.Types.ObjectId, ref: "ClientModel", default: null },
        paymentGateway: { type: String, },
        gatewayOrderId: { type: String, },
        gatewayPaymentId: { type: String, default: null },

        status: {
            type: String,
            enum: ["created", "attempted", "successful", "failed", null],
            default: null,
        },
        amount: { type: Number },
        currency: { type: String, default: "INR" },
        paidAt: { type: Date, default: null },
    },
    { _id: false }
);



const ClientQuotesSelected = new Schema<IClientQuotesSelected>({
    quoteId: { type: Schema.Types.ObjectId, default: null, refPath: "quoteSelected.quoteModel" },        // 👈 your user ID for tracking
  quoteModel: { type: String, default: "QuoteVarientGenerateModel" },
    quoteNo: { type: String, default: null },
    status: { type: String, default: null },
}, { _id: true })

const PaymentConfirmationSchema = new Schema<IPaymentConfirmation>({

    projectId: { type: Schema.Types.ObjectId, ref: "ProjectModel", required: true, unique: true },
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    isEditable: { type: Boolean, default: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "StaffModel", default: null },
    isConsentRequired: { type: Boolean, default: true },
    timer: { type: TimerSchema, },
    totalAmount: { type: Number, default: 0 },
    // step1
    paymentClientConsent: { type: PaymentClientConsentSchema, },
    // step2
    paymentSchedule: { type: PaymentScheduleItemSchema },
    // step3
    paymentTransaction: { type: PaymentTransactionSchema },
    quoteSelected: { type: [ClientQuotesSelected], default:[] },
}, { timestamps: true })


PaymentConfirmationSchema.index({ projectId: 1 })
// PaymentConfirmationSchema.plugin(procurementLogger)

const PaymentConfirmationModel = model("PaymentConfirmationModel", PaymentConfirmationSchema)

export default PaymentConfirmationModel;