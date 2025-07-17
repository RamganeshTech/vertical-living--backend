import { Schema, model, Types } from "mongoose";

export interface IUnitsMaster {
  organizationId: Types.ObjectId;
  wardrobe: Types.ObjectId[];   // links WardrobeUnitModel
  studyTable: Types.ObjectId[]; // links StudyTableUnitModel
  BedCot: Types.ObjectId[];        // links CotUnitModel
  mirrorUnits: Types.ObjectId[]; // etc...
  dressingTables: Types.ObjectId[];
  tv: Types.ObjectId[];
  diningTables: Types.ObjectId[];
  sofas: Types.ObjectId[];
  crockery: Types.ObjectId[];
  kitchenCabinet: Types.ObjectId[];
  kitchenBaseUnits: Types.ObjectId[];
  kitchenTallUnits: Types.ObjectId[];
  kitchenWallUnits: Types.ObjectId[];
  pantryUnits: Types.ObjectId[];
  foyerAreaDesigns: Types.ObjectId[];
  falseCeiling: Types.ObjectId[];
  showcase: Types.ObjectId[];
  shoeRack: Types.ObjectId[];
  wallpapers: Types.ObjectId[];
  balconyUnits: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

export const UnitsMasterSchema = new Schema<IUnitsMaster>(
  {
    organizationId:{type: Schema.Types.ObjectId, ref:"OrganizationModel"},
    wardrobe: [{ type: Schema.Types.ObjectId, ref: "WardrobeUnitModel" }],
    studyTable: [{ type: Schema.Types.ObjectId, ref: "StudyTableUnitModel" }],
    BedCot: [{ type: Schema.Types.ObjectId, ref: "BedCotUnitModel" }],
    // mirrorUnits: [{ type: Schema.Types.ObjectId, ref: "MirrorUnitModel" }],
    // dressingTables: [{ type: Schema.Types.ObjectId, ref: "DressingTableUnitModel" }],
    tv:[{ type: Schema.Types.ObjectId, ref: "TVUnitModel" }],
    // diningTables: [{ type: Schema.Types.ObjectId, ref: "DiningTableUnitModel" }],
    // sofas: [{ type: Schema.Types.ObjectId, ref: "SofaUnitModel" }],
    crockery: [{ type: Schema.Types.ObjectId, ref: "CrockeryUnitModel" }],
    kitchenCabinet: [{ type: Schema.Types.ObjectId, ref: "KitchenCabinetUnitModel" }],
    // kitchenBaseUnits: [{ type: Schema.Types.ObjectId, ref: "KitchenBaseUnitModel" }],
    // kitchenTallUnits: [{ type: Schema.Types.ObjectId, ref: "KitchenTallUnitModel" }],
    // kitchenWallUnits: [{ type: Schema.Types.ObjectId, ref: "KitchenWallUnitModel" }],
    // pantryUnits: [{ type: Schema.Types.ObjectId, ref: "PantryUnitModel" }],
    // foyerAreaDesigns: [{ type: Schema.Types.ObjectId, ref: "FoyerAreaDesignModel" }],
    falseCeiling: [{ type: Schema.Types.ObjectId, ref: "FalseCeilingUnitModel" }],
    showcase: [{ type: Schema.Types.ObjectId, ref: "ShowcaseUnitModel" }],
    shoeRack: [{ type: Schema.Types.ObjectId, ref: "ShoeRackUnitModel" }],
    // wallpapers: [{ type: Schema.Types.ObjectId, ref: "WallpaperUnitModel" }],
    // balconyUnits: [{ type: Schema.Types.ObjectId, ref: "BalconyUnitModel" }],
  },
  { timestamps: true }
);

export const AllUnitModel = model("AllUnitModel", UnitsMasterSchema);
