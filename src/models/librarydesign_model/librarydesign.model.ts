/**
 * Library design: one swatch (a material finish sample) from a brand's laminate catalogue.
 *
 * Each design belongs to one organisation. The same brand + design code + finish is one design, so importing the
 * catalogue again updates it instead of adding a duplicate. Photos are stored on S3; this document keeps only the
 * https links (imageUrl = full picture, thumbnailUrl = small picture for lists).
 */

import { Schema, Types, model, models } from "mongoose";
import type { Model } from "mongoose";

export interface LibraryDesign {
//   _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  brandName: string;
  catalogueName: string;
  designCode: string;
  finishCode: string;
  name: string;
  materialKind: string;
  studioFinishKind: string;
  priceGroup: string;
  imageUrl: string;
  thumbnailUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Empty, or an https address. Data URLs (photos stored inside MongoDB) are not accepted. */
const HTTPS_OR_EMPTY = /^(https:\/\/[^\s"'<>]+)?$/;

const librarydesignSchema = new Schema<LibraryDesign>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true },
    brandName: { type: String, required: true, trim: true, maxlength: 120 },
    catalogueName: { type: String, default: "", trim: true, maxlength: 160 },
    designCode: { type: String,  trim: true, maxlength: 80 },
    finishCode: { type: String,  trim: true, maxlength: 80 },
    name: { type: String, default: "", trim: true, maxlength: 160 },
    materialKind: { type: String, default: "", trim: true, maxlength: 80 },
    studioFinishKind: { type: String, default: "", trim: true, maxlength: 80 },
    priceGroup: { type: String, default: "", trim: true, lowercase: true, maxlength: 80 },
    imageUrl: {
      type: String,
      default: "",
    //   maxlength: 2048,
      validate: { validator: (value: string) => HTTPS_OR_EMPTY.test(value), message: "imageUrl must be an https address" },
    },
    thumbnailUrl: {
      type: String,
      default: "",
    //   maxlength: 2048,
      validate: { validator: (value: string) => HTTPS_OR_EMPTY.test(value), message: "thumbnailUrl must be an https address" },
    },
  },
  { timestamps: true,  }
);

// One design per brand + code + finish inside an organisation (import updates it instead of duplicating).
// librarydesignSchema.index({ o    rganizationId: 1, brandName: 1, designCode: 1, finishCode: 1 }, { unique: true });
// Catalogue removal and brand listing.
librarydesignSchema.index({ organizationId: 1, brandName: 1, catalogueName: 1 });

export const LibraryDesignModel: Model<LibraryDesign> =
  (models.LibraryDesign as Model<LibraryDesign>) || model<LibraryDesign>("LibraryDesignModel", librarydesignSchema);