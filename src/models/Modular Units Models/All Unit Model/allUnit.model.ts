import { Schema, model, Types } from "mongoose";

export interface IUnitsMaster {
  wardrobes: Types.ObjectId[];   // links WardrobeUnitModel
  studyTables: Types.ObjectId[]; // links StudyTableUnitModel
  cots: Types.ObjectId[];        // links CotUnitModel
  mirrorUnits: Types.ObjectId[]; // etc...
  dressingTables: Types.ObjectId[];
  tvUnits: Types.ObjectId[];
  diningTables: Types.ObjectId[];
  sofas: Types.ObjectId[];
  crockeryUnits: Types.ObjectId[];
  kitchenBaseUnits: Types.ObjectId[];
  kitchenTallUnits: Types.ObjectId[];
  kitchenWallUnits: Types.ObjectId[];
  pantryUnits: Types.ObjectId[];
  foyerAreaDesigns: Types.ObjectId[];
  falseCeilings: Types.ObjectId[];
  wallpapers: Types.ObjectId[];
  balconyUnits: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

export const UnitsMasterSchema = new Schema<IUnitsMaster>(
  {
    wardrobes: [{ type: Schema.Types.ObjectId, ref: "WardrobeUnitModel" }],
    studyTables: [{ type: Schema.Types.ObjectId, ref: "StudyTableUnitModel" }],
    cots: [{ type: Schema.Types.ObjectId, ref: "CotUnitModel" }],
    mirrorUnits: [{ type: Schema.Types.ObjectId, ref: "MirrorUnitModel" }],
    dressingTables: [{ type: Schema.Types.ObjectId, ref: "DressingTableUnitModel" }],
    tvUnits: [{ type: Schema.Types.ObjectId, ref: "TVUnitModel" }],
    diningTables: [{ type: Schema.Types.ObjectId, ref: "DiningTableUnitModel" }],
    sofas: [{ type: Schema.Types.ObjectId, ref: "SofaUnitModel" }],
    crockeryUnits: [{ type: Schema.Types.ObjectId, ref: "CrockeryUnitModel" }],
    kitchenBaseUnits: [{ type: Schema.Types.ObjectId, ref: "KitchenBaseUnitModel" }],
    kitchenTallUnits: [{ type: Schema.Types.ObjectId, ref: "KitchenTallUnitModel" }],
    kitchenWallUnits: [{ type: Schema.Types.ObjectId, ref: "KitchenWallUnitModel" }],
    pantryUnits: [{ type: Schema.Types.ObjectId, ref: "PantryUnitModel" }],
    foyerAreaDesigns: [{ type: Schema.Types.ObjectId, ref: "FoyerAreaDesignModel" }],
    falseCeilings: [{ type: Schema.Types.ObjectId, ref: "FalseCeilingUnitModel" }],
    wallpapers: [{ type: Schema.Types.ObjectId, ref: "WallpaperUnitModel" }],
    balconyUnits: [{ type: Schema.Types.ObjectId, ref: "BalconyUnitModel" }],
  },
  { timestamps: true }
);

export const UnitsMasterModel = model("UnitsMaster", UnitsMasterSchema);
