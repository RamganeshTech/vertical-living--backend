import mongoose, { Schema, Document, Types } from "mongoose";
import { decrypt, encrypt } from "../../utils/Encryption/encryption";

export interface IRazorpayIntegration extends Document {
  organizationId: Types.ObjectId;

  // Razorpay for customer payments
  razorpayKeyId: string;
  razorpayKeySecret: string; // encrypted

  // RazorpayX for payouts
  razorpayXKeyId: string;
  razorpayXKeySecret: string; // encrypted
  razorpayXAccountNumber: string; // encrypted

  // Metadata
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}



const RazorpayIntegrationSchema = new Schema<IRazorpayIntegration>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "OrganizationModel",
      required: true
    },

    razorpayKeyId: { type: String, required: true },
    razorpayKeySecret: { type: String, required: true }, // encrypted

    // razorpayXKeyId: { type: String, default: null },
    // razorpayXKeySecret: { type: String, default: null }, // encrypted
    razorpayXAccountNumber: { type: String, default: null }, // encrypted

    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);



// /** AUTO ENCRYPT BEFORE SAVE */
// RazorpayIntegrationSchema.pre("save", function (next) {
//   if (this.isModified("razorpayKeySecret")) {
//     this.razorpayKeySecret = encrypt(this.razorpayKeySecret);
//   }

//   if (this.isModified("razorpayXKeySecret") && this.razorpayXKeySecret) {
//     this.razorpayXKeySecret = encrypt(this.razorpayXKeySecret);
//   }

//   if (this.isModified("razorpayXAccountNumber") && this.razorpayXAccountNumber) {
//     this.razorpayXAccountNumber = encrypt(this.razorpayXAccountNumber);
//   }

//   next();
// });

/** AUTO ENCRYPT BEFORE SAVE */
RazorpayIntegrationSchema.pre("save", function (next) {
  // ✅ Only encrypt if the field is modified AND not already encrypted
  if (this.isModified("razorpayKeySecret") && !this.razorpayKeySecret.startsWith("encrypted:")) {
    this.razorpayKeySecret = encrypt(this.razorpayKeySecret);
  }

  if (this.isModified("razorpayXKeySecret") && this.razorpayXKeySecret && !this.razorpayXKeySecret.startsWith("encrypted:")) {
    this.razorpayXKeySecret = encrypt(this.razorpayXKeySecret);
  }

  if (this.isModified("razorpayXAccountNumber") && this.razorpayXAccountNumber && !this.razorpayXAccountNumber.startsWith("encrypted:")) {
    this.razorpayXAccountNumber = encrypt(this.razorpayXAccountNumber);
  }

  next();
});





export const RazorpayIntegrationModel =
  mongoose.model<IRazorpayIntegration>("RazorpayIntegration", RazorpayIntegrationSchema);


