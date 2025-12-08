import mongoose, { Schema, Document, Types } from "mongoose";
import { IUploadPdf } from "./invoiceAccount.model";


export interface IPaymentMainAcc extends Document {
    organizationId: mongoose.Types.ObjectId;
    paymentPersonId: Types.ObjectId | null;
    paymentPersonName: string
    paymentPersonModel: string | null;
    fromSection: string      //expense, 
    fromSectionModel: string | null
    fromSectionId: Types.ObjectId | null
    // vendorId: Types.ObjectId;
    // customerId: Types.ObjectId;
    projectId: Types.ObjectId;
    accountingRef: Types.ObjectId | null;
    // vendorName: string;
    // customerName: string;
    fromSectionNumber: string;
    paymentNumber: string,
    paymentDate: Date | null,
    dueDate: Date | null,
    subject: string,
    items?: IPaymentItem[],

    totalAmount: number;

    discountPercentage?: number;
    discountAmount?: number;

    taxPercentage?: number;
    taxAmount?: number;
    paymentType?: string,
    advancedAmount?: IGrandTotal;

    grandTotal: number
    amountRemaining: IGrandTotal

    notes: string | null;
    // images: IBillUploads[],
    // pdfData: IBillUploads | null,
    isSyncedWithAccounting?: boolean
    generalStatus: string
}


export interface IPaymentItem {
    itemName: string;
    quantity: number;
    rate: number;
    unit: string;
    totalCost: number; // quantity * rate
    status: string,  // or "paid"
    orderId: string,        // Razorpay order ID
    paymentId: string,
    transactionId: string
    paidAt: Date | null
    failureReason: string | null
    fees: number | null
    tax: number | null
}

const PaymentAccItemSchema = new Schema<IPaymentItem>(
    {
        itemName: { type: String, },
        quantity: { type: Number, default: 0 },
        rate: { type: Number, },
        unit: { type: String, default: "" },
        totalCost: { type: Number, }, // quantity * rate
        status: { type: String, default: null },
        orderId: { type: String, default: null }, // Razorpay order/fund_account_id
        paymentId: { type: String, default: null }, // Razorpay payout_id
        transactionId: { type: String, default: null }, // UTR number
        paidAt: { type: Date, default: null },
        failureReason: { type: String, default: null },
        fees: { type: Number, default: null },
        tax: { type: Number, default: null }
    },
    { _id: true }
);


export interface IGrandTotal {
    totalAmount: number; // quantity * rate
    status: string,  // or "paid"
    orderId: string,        // Razorpay order ID
    paymentId: string,
    transactionId: string
    paidAt: Date | null
    failureReason: string | null
    fees: number | null
    tax: number | null
}


const grandTotalSchema = new Schema<IGrandTotal>({
    totalAmount: { type: Number, default: 0 },
    status: { type: String, default: null },
    orderId: { type: String, default: null }, // Razorpay order/fund_account_id
    paymentId: { type: String, default: null }, // Razorpay payout_id
    transactionId: { type: String, default: null }, // UTR number
    paidAt: { type: Date, default: null },
    failureReason: { type: String, default: null },
})


// export interface IBillUploads extends IUploadPdf { }





// const BillUploadSchema = new Schema<IUploadPdf>({
//     type: { type: String, enum: ["image", "pdf"] },
//     url: { type: String, },
//     originalName: String,
//     uploadedAt: { type: Date, default: new Date() }
// }, { _id: true });


const PaymentMainAccountSchema = new Schema<IPaymentMainAcc>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "OrganizationModel"
        },
        paymentPersonId: {
            type: Schema.Types.ObjectId,
            refPath: "personModel",
            default: null
        },

        paymentPersonModel: {
            type: String,
            default: null
        },

        paymentPersonName: {
            type: String,
            default: null
        },

        accountingRef: {
            type: Schema.Types.ObjectId,
            ref: "AccountingModel",
            default: null
        },

        fromSectionModel: {
            type: String,
            default: null
        },

        fromSectionId: {
            type: Schema.Types.ObjectId,
            refPath: "fromSectionModel",
            default: null
        },

        projectId: {
            type: Schema.Types.ObjectId,
            ref: "ProjectModel",
            default: null
        },
        // vendorName: { type: String, default: null },
        fromSection: { type: String, default: null },
        fromSectionNumber: {type: String, default:null},
        paymentNumber: { type: String, },
        paymentDate: { type: Date, default: new Date() },
        dueDate: { type: Date, default: new Date() },
        subject: { type: String, default: null },
        items: { type: [PaymentAccItemSchema], default: [] },
        totalAmount: { type: Number, default: 0 },
        
        advancedAmount: { type: grandTotalSchema, default: {} },
        paymentType: {type: String, default: null},
        discountPercentage: { type: Number, default: 0 },
        discountAmount: { type: Number, default: 0 },
        taxPercentage: { type: Number, default: 0 },
        taxAmount: { type: Number, default: 0 },
        grandTotal: { type: Number, default: 0 },

        amountRemaining: { type: grandTotalSchema, default: {} },
        notes: { type: String, default: null },
        // images: { type: [BillUploadSchema], default: [] },
        // pdfData: { type: BillUploadSchema, default: null },
        isSyncedWithAccounting: {
            type: Boolean,
            default: false
        },
        generalStatus: { type: String, default: "pending" }
    },
    { timestamps: true }
);


// ✅ Pre-save hook to auto-generate unique invoice number
PaymentMainAccountSchema.pre("save", async function (next) {
    if (this.isNew && !this.paymentNumber) {
          const currentYear = new Date().getFullYear();


        const lastDoc = await mongoose
            .model("PaymentMainAccountsModel")
            .findOne({organizationId: this.organizationId}, { paymentNumber: 1 })
            .sort({ createdAt: -1 });

        let nextNumber = 1;
        if (lastDoc && lastDoc.paymentNumber) {
            const match = lastDoc.paymentNumber.match(/(\d+)$/);
            if (match) nextNumber = parseInt(match[1]) + 1;
        }

        this.paymentNumber = `PAY-${currentYear}-${String(nextNumber).padStart(3, "0")}`;
    }
    next();
});

export const PaymentMainAccountModel = mongoose.model<IPaymentMainAcc>("PaymentMainAccountsModel", PaymentMainAccountSchema);
