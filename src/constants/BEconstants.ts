import { Model } from "mongoose";
// import { CostEstimationModel } from "../models/Stage Models/Cost Estimation Model/costEstimation.model";
// import MaterialRoomConfirmationModel from "../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model";
// import { RequirementFormModel } from "../models/Stage Models/requirment model/requirement.model";
import { SampleDesignModel } from "../models/Stage Models/sampleDesing model/sampleDesign.model";
import { SiteMeasurementModel } from "../models/Stage Models/siteMeasurement models/siteMeasurement.model";
import { TechnicalConsultationModel } from "../models/Stage Models/technical consulatation/technicalconsultation.model";
import PaymentConfirmationModel from "../models/Stage Models/Payment Confirmation model/PaymentConfirmation.model";
// import OrderingMaterialModel from "../models/Stage Models/Ordering Material Model/orderingMaterial.model";
// import MaterialArrivalModel from "../models/Stage Models/MaterialArrivalCheck Model/materialArrivalCheck.model";
import WorkMainStageScheduleModel from "../models/Stage Models/WorkTask Model/WorkTask.model";
import InstallationModel from "../models/Stage Models/installation model/Installation.model";
import { QualityCheckupModel } from "../models/Stage Models/QualityCheck Model/QualityCheck.model";
import { CleaningAndSanitationModel } from "../models/Stage Models/Cleaning Model/cleaning.model";
import { ProjectDeliveryModel } from "../models/Stage Models/ProjectDelivery Model/ProjectDelivery.model";
import MaterialArrivalModel from "../models/Stage Models/MaterialArrivalCheck Model/materialArrivalCheckNew.model";
import { OrderMaterialHistoryModel } from "../models/Stage Models/Ordering Material Model/OrderMaterialHistory.model";
import { RequirementFormModel } from "../models/Stage Models/requirment model/mainRequirementNew.model";


export const SUBSCRIPTION_PLANS = {
  BASIC: {
    name: "basic",
    price: 1000, // Rs 1000
    durationInDays: 30, // 1 month
  },
  ENTERPRISE: {
    name: "enterprise",
    price: 5000, // Rs 5000
    durationInDays: 30,
  },
  ADVANCED: {
    name: "advanced",
    price: 8000, // Rs 8000
    durationInDays: 30,
  },
};


// ASSIGNED TO 
export const assignedTo = "assignedTo"
export const selectedFields = "_id staffName email"



export const JOB_NAMES = {
    SYNC_TO_PAYMENT: "auto-sync-to-payment",
    // You can add future jobs here, like CLEANUP_OLD_LOGS: "cleanup-logs"
} as const;


// STAGE MODELS (BASIC)
export const stageModels: Model<any>[] = [
  RequirementFormModel,               // Stage 1
  SiteMeasurementModel,   // Stage 2
  SampleDesignModel, // Stage 3
  TechnicalConsultationModel,      // Stage 4
  // SelectedModularUnitModel, //stage 5
  // SelectedExternalModel, //stage 6
  // MaterialRoomConfirmationModel,      // Stage 5
  // CostEstimationModel,                // Stage 6    
  PaymentConfirmationModel,    //stage 7
  // OrderingMaterialModel,  
  OrderMaterialHistoryModel, //stage 8
  MaterialArrivalModel, // //Stage 9
  WorkMainStageScheduleModel,  //Stage 10
  InstallationModel, //Stage 11
  QualityCheckupModel, //Stage 12
  CleaningAndSanitationModel, //Stage 13
  ProjectDeliveryModel,//Stage 14
];




export const allowedFieldsModularUnit: Record<string, string[]> = {
  // ✅ False Ceiling
  falseCeiling: [
    "name",
     "description",
    "price",
    "material",
    "category",
    "ceilingType",
    "lightingType",
    "roomType",
    "materialType",
    "designStyle",
    "colorTheme",
    "levels",
    "edgeProfile",
    "fixtureIntegration",
    "panelType",
    "shapeGeometry",
    "modularType",
    "installationComplexity",
    "budgetRange",
  ],

  // ✅ Showcase
  showcase: [
    "name",
    "description",
    "price",
    "material",
    "category",
    "unitType",
    "length",
    "breadth",
    "carcassMaterial",
    "frontMaterial",
    "finish",
    "storageType",
    "shutterType",
    "glassVisibility",
    "lighting",
    "installationType",
    "usagePurpose",
    "addOns",
    "compartments",
    "edges",
    "modularType",
    "priceRange",
  ],

  // ✅ Shoe Rack
  shoeRack: [
    "name",
    "description",
    "price",
    "material",
    "category",
    "unitType",
    "length",
    "breadth",
    "height",
    "carcassMaterial",
    "shutterMaterial",
    "finish",
    "storageType",
    "handleType",
    "shoeCapacity",
    "ventilation",
    "installationType",
    "usagePurpose",
    "addOns",
    "edges",
    "modularType",
    "priceRange",
  ],

  // ✅ Wardrobe
  wardrobe: [
    "name",
    "description",
    "price",
    "material",
    "category",
    "wardrobeType",
    "length",
    "breadth",
    "height",
    "carcassMaterial",
    "shutterMaterial",
    "finish",
    "handleType",
    "internalAccessories",
    "mirrorProvision",
    "lighting",
    "lockType",
    "edges",
    "installationType",
    "modularType",
    "priceRange",
  ],

  // ✅ TV Unit
  tv: [
    "name",
    "description",
    "price",
    "material",
    "category",
    "unitType",
    "length",
    "breadth",
    "height",
    "panelMaterial",
    "finish",
    "storageType",
    "shutterType",
    "openShelves",
    "lighting",
    "addOns",
    "edges",
    "installationType",
    "modularType",
    "priceRange",
  ],

  // ✅ Bed Cot
  BedCot: [
    "name",
    "description",
    "price",
    "material",
    "category",
    "bedType",
    "length",
    "breadth",
    "height",
    "frameMaterial",
    "headboardMaterial",
    "finish",
    "storageType",
    "addOns",
    "edges",
    "installationType",
    "modularType",
    "priceRange",
  ],

  // ✅ Kitchen Cabinet
  kitchenCabinet: [
    "name",
    "description",
    "price",
    "material",
    "category",
    "unitType",
    "internalLayout",
    "compartments",
    "featureTags",
    "dimensions",
    "carcassMaterial",
    "doorsMaterial",
    "finish",
    "ssHardwareBrand",
    "visibilityType",
    "positionUsage",
    "installationType",
    "designCollection",
    "modularType",
    "priceRange",
  ],

  // ✅ Study Table
  studyTable: [
    "name",
    "description",
    "price",
    "material",
    "category",
    "unitType",
    "length",
    "breadth",
    "height",
    "carcassMaterial",
    "tableTopMaterial",
    "finish",
    "storageType",
    "addOns",
    "edges",
    "installationType",
    "modularType",
    "priceRange",
  ],

  // ✅ Crockery Unit
  crockery: [
    "name",
    "description",
    "price",
    "material",
    "category",
    "unitType",
    "length",
    "breadth",
    "height",
    "carcassMaterial",
    "shutterMaterial",
    "finish",
    "glassType",
    "lighting",
    "storageType",
    "handleType",
    "addOns",
    "edges",
    "installationType",
    "modularType",
    "priceRange",
  ],
};





// ✅ Define the valid room keys as per your schema
export const validRoomKeys = [
  "LivingRoom",
  "Bedroom",
  "Kitchen",
  "DiningRoom",
  "Balcony",
  "FoyerArea",
  "Terrace",
  "StudyRoom",
  "CarParking",
  "Garden",
  "StorageRoom",
  "EntertainmentRoom",
  "HomeGym",
];





// FOR DOCUMENTATION

// constants/stageMapping.ts

export const STAGE_KEY_DOCMENTION_MAP: Record<string, string> = {
  "1": "Requirement Stage",
  "2": "Site Mesasurement",
  "3": "Sample Design",
  "4": "Worker Schedule",
  "5": "Technical Consultant",
  "6": "Material Selection",
  "7": "Cost Estimation",
  "8": "Payment Confirmation",
  "9": "Ordering Material",
  "10": "Material Arrival",
  "11": "Installation ",
  "12": "Quality Check",
  "13": "Cleaning And Sanitization",
  "14": "Project Delivery",
};


export const getRoleByModel = {
  "StaffModel": "staff",
  "WorkerModel": "worker",
  "UserModel": "owner",
  "CTOModel": "CTO",
  "ClientModel": "client"
} as const;
