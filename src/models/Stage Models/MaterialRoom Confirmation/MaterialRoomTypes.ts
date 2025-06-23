import { Schema } from "mongoose";


export interface IRoomItemEntry {
    quantity: number;
    unit: string;
    remarks: string | null;
}


export const itemEntrySchema = new Schema<IRoomItemEntry>({
    quantity: { type: Number, default: 0 },
    unit: { type: String, default: "" },
    remarks: { type: String, default: "" },
}, { _id: false });

// Living Room Schema (predefined keys only)
export const livingRoomSchema = new Schema({
    tvUnit: itemEntrySchema,
    displayShelves: itemEntrySchema,
    modularSofaUnits: itemEntrySchema,
    coffeeTables: itemEntrySchema,
    accentWallPanels: itemEntrySchema,
    wallCladding: itemEntrySchema,
    falseCeiling: itemEntrySchema,
    electricalWork: itemEntrySchema,
    flooring: itemEntrySchema,
    windows: itemEntrySchema,
    doors: itemEntrySchema,
    mirrors: itemEntrySchema,
    upholsteryAndCurtains: itemEntrySchema,
    lightingFixtures: itemEntrySchema,
    partitions: itemEntrySchema,
    writingDesk: itemEntrySchema,
    privacyDivider: itemEntrySchema,
    paintingsWallArt: itemEntrySchema,
    safetyGrills: itemEntrySchema,
}, { _id: false });

// ✅ Bedroom

const attachedBathroomSchema = new Schema(
    {
        vanityUnit: itemEntrySchema,
        washBasin: itemEntrySchema,
        wc: itemEntrySchema,
        showerPartition: itemEntrySchema,
        exhaustFan: itemEntrySchema,
        geyser: itemEntrySchema,
        wallTiles: itemEntrySchema,
        towelRods: itemEntrySchema,
        electricalWork: itemEntrySchema,
        door: itemEntrySchema,
        window: itemEntrySchema,
    },
    { _id: false }
);


export const bedroomSchema = new Schema(
    {
        wardrobe: itemEntrySchema,
        bed: itemEntrySchema,
        bedsideTables: itemEntrySchema,
        dresserUnit: itemEntrySchema,
        tvPanelUnit: itemEntrySchema,
        studyDesk: itemEntrySchema,
        cotBacks: itemEntrySchema,
        falseCeiling: itemEntrySchema,
        electricalWork: itemEntrySchema,
        flooring: itemEntrySchema,
        windows: itemEntrySchema,
        doors: itemEntrySchema,
        mirrors: itemEntrySchema,
        upholstery: itemEntrySchema,
        paintings: itemEntrySchema,
        privacyWall: itemEntrySchema,
        safetyGrills: itemEntrySchema,
        attachedBathrRoom:attachedBathroomSchema
    },
    { _id: false }
);

// ✅ Kitchen
export const kitchenSchema = new Schema(
    {
        baseUnits: itemEntrySchema,
        wallUnits: itemEntrySchema,
        tallUnits: itemEntrySchema,
        islandCounter: itemEntrySchema,
        chimneyAndHob: itemEntrySchema,
        sink: itemEntrySchema,
        rollingShutterCabinet: itemEntrySchema,
        backsplashCladding: itemEntrySchema,
        electricalWork: itemEntrySchema,
        flooring: itemEntrySchema,
        windows: itemEntrySchema,
        doors: itemEntrySchema,
        mirrors: itemEntrySchema,
        curtains: itemEntrySchema,
        mealPlanningDesk: itemEntrySchema,
        safetyGrills: itemEntrySchema,
    },
    { _id: false }
);



// DINING SCHEAM 
export const diningRoomSchema = new Schema(
  {
    crockeryUnit: itemEntrySchema,
    diningTable: itemEntrySchema,
    sideboardCounter: itemEntrySchema,
    pendantLights: itemEntrySchema,
    wallPanelCladding: itemEntrySchema,
    studyCounter: itemEntrySchema,
    electricalWork: itemEntrySchema,
    flooring: itemEntrySchema,
    windows: itemEntrySchema,
    doors: itemEntrySchema,
    mirrors: itemEntrySchema,
    upholsteryAndCurtains: itemEntrySchema,
    wallArt: itemEntrySchema,
    privacyPartition: itemEntrySchema,
    safetyGrills: itemEntrySchema,
  },
  { _id: false }
);



export const balconySchema = new Schema(
  {
    seatingBench: itemEntrySchema,
    deckFlooring: itemEntrySchema,
    verticalGarden: itemEntrySchema,
    outdoorLighting: itemEntrySchema,
    electricalWork: itemEntrySchema,
    flooring: itemEntrySchema,
    windowsDoors: itemEntrySchema,
    mirrors: itemEntrySchema,
    curtainsBlinds: itemEntrySchema,
    safetyGrills: itemEntrySchema,
    outdoorPaintings: itemEntrySchema,
  },
  { _id: false }
);


export const foyerAreaSchema = new Schema(
  {
    shoeRack: itemEntrySchema,
    tallMirrorPanel: itemEntrySchema,
    decorativeConsole: itemEntrySchema,
    keyDropStation: itemEntrySchema,
    electricalWork: itemEntrySchema,
    flooring: itemEntrySchema,
    windows: itemEntrySchema,
    doors: itemEntrySchema,
    mirrors: itemEntrySchema,
    upholstery: itemEntrySchema,
    curtains: itemEntrySchema,
    welcomeArt: itemEntrySchema,
    safetyGrill: itemEntrySchema,
  },
  { _id: false }
);



export const terraceSchema = new Schema(
  {
    pergola: itemEntrySchema,
    outdoorBar: itemEntrySchema,
    greenDeck: itemEntrySchema,
    electricalWork: itemEntrySchema,
    flooring: itemEntrySchema,
    doors: itemEntrySchema,
    windows: itemEntrySchema,
    curtains: itemEntrySchema,
    mirrors: itemEntrySchema,
    safetyGrills: itemEntrySchema,
    outdoorArt: itemEntrySchema,
  },
  { _id: false }
);



export const studyRoomSchema = new Schema(
  {
    studyTable: itemEntrySchema,
    libraryStorage: itemEntrySchema,
    ergonomicChair: itemEntrySchema,
    wallPanels: itemEntrySchema,
    electricalWork: itemEntrySchema,
    flooring: itemEntrySchema,
    windows: itemEntrySchema,
    doors: itemEntrySchema,
    mirrors: itemEntrySchema,
    curtains: itemEntrySchema,
    upholstery: itemEntrySchema,
    safetyGrills: itemEntrySchema,
    motivationalArt: itemEntrySchema,
  },
  { _id: false }
);

// ✅ 9. Car Parking
export const carParkingSchema = new Schema(
  {
    utilityCabinets: itemEntrySchema,
    toolRack: itemEntrySchema,
    loftStorage: itemEntrySchema,
    electricalWork: itemEntrySchema,
    flooring: itemEntrySchema,
    windows: itemEntrySchema,
    doors: itemEntrySchema,
    safetyGrills: itemEntrySchema,
    curtains: itemEntrySchema,
    industrialPosters: itemEntrySchema,
  },
  { _id: false }
);

// ✅ 10. Garden
export const gardenSchema = new Schema(
  {
    deckOrPatio: itemEntrySchema,
    gazebo: itemEntrySchema,
    seatingArea: itemEntrySchema,
    pathway: itemEntrySchema,
    electricalWork: itemEntrySchema,
    flooring: itemEntrySchema,
    windows: itemEntrySchema,
    doors: itemEntrySchema,
    safetyGrills: itemEntrySchema,
    curtains: itemEntrySchema,
    outdoorArt: itemEntrySchema,
  },
  { _id: false }
);

// ✅ 11. Storage Room
export const storageRoomSchema = new Schema(
  {
    shelvesBins: itemEntrySchema,
    labelingSystem: itemEntrySchema,
    ladderRack: itemEntrySchema,
    electricalWork: itemEntrySchema,
    flooring: itemEntrySchema,
    windows: itemEntrySchema,
    doors: itemEntrySchema,
    mirrors: itemEntrySchema,
    curtains: itemEntrySchema,
    safetyGrills: itemEntrySchema,
  },
  { _id: false }
);

// ✅ 12. Entertainment Room
export const entertainmentRoomSchema = new Schema(
  {
    reclinerSetup: itemEntrySchema,
    projectorUnit: itemEntrySchema,
    gamingConsole: itemEntrySchema,
    moodLighting: itemEntrySchema,
    electricalWork: itemEntrySchema,
    flooring: itemEntrySchema,
    windows: itemEntrySchema,
    doors: itemEntrySchema,
    mirrors: itemEntrySchema,
    curtains: itemEntrySchema,
    upholstery: itemEntrySchema,
    safetyGrills: itemEntrySchema,
    movieArt: itemEntrySchema,
  },
  { _id: false }
);



// home gym 
export const attachedRestroomSchema = new Schema(
  {
    vanity: itemEntrySchema,
    mirror: itemEntrySchema,
    wc: itemEntrySchema,
    showerArea: itemEntrySchema,
    exhaustFan: itemEntrySchema,
    geyser: itemEntrySchema,
    flooring: itemEntrySchema,
    door: itemEntrySchema,
    window: itemEntrySchema,
  },
  { _id: false }
);

export const homeGymSchema = new Schema(
  {
    equipmentStorage: itemEntrySchema,
    rubberFlooring: itemEntrySchema,
    tvMirrorWall: itemEntrySchema,
    writingDesk: itemEntrySchema,
    electricalWork: itemEntrySchema,
    flooring: itemEntrySchema,
    windows: itemEntrySchema,
    doors: itemEntrySchema,
    mirrors: itemEntrySchema,
    curtains: itemEntrySchema,
    upholstery: itemEntrySchema,
    safetyGrills: itemEntrySchema,
    fitnessWallGraphics: itemEntrySchema,
    attachedRestroom: attachedRestroomSchema,
  },
  { _id: false }
);