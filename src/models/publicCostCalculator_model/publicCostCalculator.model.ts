import mongoose from 'mongoose';

const PublicQuoteSchema = new mongoose.Schema({
    name: { type: String },
    phone: { type: String },
    // organizationId:{type: types}
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrganizationModel',
        default: null,
    },
    location: { type: String },
    quoteNumber: { type: String, },
    carpetArea: { type: Number },
    homeType: { type: String },
    finish: { type: String },
    estimate: { type: Number },
    // Store S3 metadata just like your Club thumbnail
    quotationPdf: {
        url: String,
        key: String,
        originalName: String,
        uploadedAt: { type: Date, default: new Date() }
    },
    config: { type: Object, default: {} }
}, { timestamps: true });




// ✅ Pre-save hook to auto-generate unique invoice number
PublicQuoteSchema.pre("save", async function (next) {
    if (this.isNew && !this.quoteNumber) {
        const currentYear = new Date().getFullYear();

        const lastDoc = await mongoose
            .model("PublicQuoteCostCalculator")
            .findOne({ organizationId: this.organizationId }, { quoteNumber: 1 })
            .sort({ createdAt: -1 });

        let nextNumber = 1;
        if (lastDoc && lastDoc.quoteNumber) {
            const match = lastDoc.quoteNumber.match(/(\d+)$/);
            if (match) nextNumber = parseInt(match[1]) + 1;
        }

        this.quoteNumber = `VL-CAL-${currentYear}-${String(nextNumber).padStart(3, "0")}`;
    }
    next();
});


const PublicQuoteCostCalculatorModel = mongoose.model('PublicQuoteCostCalculator', PublicQuoteSchema);

export default PublicQuoteCostCalculatorModel