import { model, Schema , Types} from "mongoose";

export interface IPreRequiretiesSiteItem {
  isRequired: boolean;
  notes?: string;
}

export interface IProjectPreRequireties {
  modularWork: IPreRequiretiesSiteItem;
  electricalWork: IPreRequiretiesSiteItem;
  plumbingWork: IPreRequiretiesSiteItem;
  civilWork: IPreRequiretiesSiteItem;
  decorationWork: IPreRequiretiesSiteItem;
  carpentryWork: IPreRequiretiesSiteItem;
  projectId: Types.ObjectId
}



const PreRequiretiesItemSchema = new Schema<IPreRequiretiesSiteItem>({
  isRequired: { type: Boolean, default: false },
  notes: { type: String, default: '' },
});

const PreRequiretiesSchema = new Schema<IProjectPreRequireties>({
  modularWork: { type: PreRequiretiesItemSchema, required: true, default: {} },
  electricalWork: { type: PreRequiretiesItemSchema, required: true, default: {} },
  plumbingWork: { type: PreRequiretiesItemSchema, required: true, default: {} },
  civilWork: { type: PreRequiretiesItemSchema, required: true, default: {} },
  decorationWork: { type: PreRequiretiesItemSchema, required: true, default: {} },
  carpentryWork:{ type: PreRequiretiesItemSchema, required: true, default: {} },
  projectId: {type: Schema.Types.ObjectId, ref:"ProjectModel", default:null}
}, {
  timestamps: true
});


export const PreRequiretiesModel = model('PreRequiretiesModel', PreRequiretiesSchema)