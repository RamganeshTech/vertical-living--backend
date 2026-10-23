import { Document, model, Schema, Types } from 'mongoose';

export interface IMetaAdAccount {
  organizationId: Types.ObjectId;
  accountName: string;
  facebookPageId: string | null;
  metaAdAccountId: string | null; // format: "act_1234567890" — store WITH "act_" prefix
  metaAccessToken: string | null;
  metaVerifyToken: string | null;
  metaDatasetId: string | null;
  metaDatasetToken: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMetaAdAccountDocument extends IMetaAdAccount, Document {}

const metaAdAccountSchema = new Schema<IMetaAdAccountDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'OrganizationModel',
      required: true,
    },
    accountName: {type: String, default:null},

    facebookPageId: {
      type: String,
      trim: true,
      default: null,
    },
    metaAdAccountId: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: function (v: string) {
          return !v || /^act_\d+$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid Meta Ad Account ID. It must follow the format 'act_<digits>'.`,
      },
    },
    metaAccessToken: {
      type: String,
      trim: true,
      select: false, // Prevents sensitive token leakage in standard queries
      default: null,
    },
    metaVerifyToken: {
      type: String,
      trim: true,
      select: false,
      default: null,
    },
    metaDatasetId: {
      type: String,
      trim: true,
      default: null,
    },
    metaDatasetToken: {
      type: String,
      trim: true,
      select: false,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const MetaAdAccountModel = model<IMetaAdAccountDocument>(
  'MetaAdAccountModel',
  metaAdAccountSchema
);