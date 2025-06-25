import { model, Schema } from "mongoose";


const PaymentConfirmationSchema = new Schema({

}, { timestamps: true })

const PaymentConfirmationModel = model("PaymentConfirmationModel", PaymentConfirmationSchema)

export default PaymentConfirmationModel;