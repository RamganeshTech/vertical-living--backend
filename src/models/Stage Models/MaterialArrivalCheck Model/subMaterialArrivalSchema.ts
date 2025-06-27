import { Schema } from "mongoose";

export interface IUploadFile {
    type: "image" | "pdf";
    url: string;
    originalName?: string;
    uploadedAt?: Date;
}

export interface ICarpentryItem {
    material: string;
    brandName: string;
    specification: string;
    quantity: number;
    unit: string;
    remarks: string;
    upload: IUploadFile
    verifiedByAccountant: boolean
}

export interface IHardwareItem {
    item: string;
    size: string;
    material: string;
    brandName: string;
    quantity: number;
    unit: string;
    remarks: string;
    upload: IUploadFile
    verifiedByAccountant: boolean
}

export interface IElectricalFittingItem {
    item: string;
    specification: string;
    quantity: number;
    unit: string;
    remarks: string;
    upload: IUploadFile
    verifiedByAccountant: boolean
}

export interface ITileItem {
    type: string;
    brandName: string;
    size: string;
    quantity: number;
    unit: string;
    remarks: string;
    upload: IUploadFile
    verifiedByAccountant: boolean
}

export interface ICeramicSanitarywareItem {
    item: string;
    specification: string;
    quantity: number;
    unit: string;
    remarks: string;
    upload: IUploadFile
    verifiedByAccountant: boolean
}

export interface IPaintItem {
    type: string;
    brandName: string;
    color: string;
    quantity: number;
    unit: string;
    remarks: string;
    upload: IUploadFile
    verifiedByAccountant: boolean
}

export interface ILightFixtureItem {
    type: string;
    brandName: string;
    specification: string;
    quantity: number;
    unit: string;
    remarks: string;
    upload: IUploadFile
    verifiedByAccountant: boolean
}

export interface IGlassMirrorItem {
    type: string;
    brandName: string;
    size: string;
    thickness: string;
    quantity: number;
    remarks: string;
    upload: IUploadFile
    verifiedByAccountant: boolean
}

export interface IUpholsteryCurtainItem {
    item: string;
    fabric: string;
    color: string;
    quantity: number;
    unit: string;
    remarks: string;
    upload: IUploadFile
    verifiedByAccountant: boolean
}

export interface IFalseCeilingItem {
    item: string;
    specification: string;
    quantity: number;
    unit: string;
    remarks: string;
    upload: IUploadFile
    verifiedByAccountant: boolean
}



// Carpentry
export const CarpentryMaterialArrivalSchema = new Schema({
    material: String,
    brandName: String,
    specification: String,
    quantity: Number,
    unit: String,
    remarks: String,
    verifiedByAccountant: Boolean,
    upload: {
        type: {
            type: String,},
        originalName: {
            type: String,},
        url: {
            type: String,},
        uploadedAt: {
            type: Date,
           }
    }
}, { _id: true });

// Hardware
export const HardwareMaterialArrivalSchema = new Schema({
    item: String,
    size: String,
    material: String,
    brandName: String,
    quantity: Number,
    unit: String,
    remarks: String,
    verifiedByAccountant: Boolean,
    upload: {
        type: {
            type: String,
        },
        originalName: {
            type: String,
        },
        url: {
            type: String,
        },
        uploadedAt: {
            type: Date,
           
        }
    }
}, { _id: true });

// Electrical Fittings
export const ElectricalFittingMaterialArrivalSchema = new Schema({
    item: String,
    specification: String,
    quantity: Number,
    unit: String,
    remarks: String,
    verifiedByAccountant: Boolean,
    upload: {
        type: {
            type: String,
        },
        originalName: {
            type: String,
        },
        url: {
            type: String,
        },
        uploadedAt: {
            type: Date,
        }
    }
}, { _id: true });

// Tiles
export const TileMaterialArrivalSchema = new Schema({
    type: String,
    brandName: String,
    size: String,
    quantity: Number,
    unit: String,
    remarks: String,
    verifiedByAccountant: Boolean,
    upload: {
        type: {
            type: String,
        },
        originalName: {
            type: String,
        },
        url: {
            type: String,
        },
        uploadedAt: {
            type: Date,
        }
    }
}, { _id: true });

// Ceramic & Sanitaryware
export const CeramicSanitarywareMaterialArrivalSchema = new Schema({
    item: String,
    specification: String,
    quantity: Number,
    unit: String,
    remarks: String,
    verifiedByAccountant: Boolean,
    upload: {
        type: {
            type: String,
        },
        originalName: {
            type: String,
        },
        url: {
            type: String,
        },
        uploadedAt: {
            type: Date,
        }
    }
}, { _id: true });

// Paints & Coatings
export const PaintMaterialArrivalSchema = new Schema({
    type: String,
    brandName: String,
    color: String,
    quantity: Number,
    unit: String,
    remarks: String,
    verifiedByAccountant: Boolean,
    upload: {
        type: {
            type: String,
        },
        originalName: {
            type: String,
        },
        url: {
            type: String,
        },
        uploadedAt: {
            type: Date,
        }
    }
}, { _id: true });

// Lights & Fixtures
export const LightFixtureMaterialArrivalSchema = new Schema({
    type: String,
    brandName: String,
    specification: String,
    quantity: Number,
    unit: String,
    remarks: String,
    verifiedByAccountant: Boolean,
    upload: {
        type: {
            type: String,
        },
        originalName: {
            type: String,
        },
        url: {
            type: String,
        },
        uploadedAt: {
            type: Date,
        }
    }
}, { _id: true });

// Glass & Mirrors
export const GlassMirrorMaterialArrivalSchema = new Schema({
    type: String,
    brandName: String,
    size: String,
    thickness: String,
    quantity: Number,
    remarks: String,
    verifiedByAccountant: Boolean,
    upload: {
        type: {
            type: String,
        },
        originalName: {
            type: String,
        },
        url: {
            type: String,
        },
        uploadedAt: {
            type: Date,
        }
    }
}, { _id: true });

// Upholstery & Curtains
export const UpholsteryCurtainMaterialArrivalSchema = new Schema({
    item: String,
    fabric: String,
    color: String,
    quantity: Number,
    unit: String,
    remarks: String,
    verifiedByAccountant: Boolean,
    upload: {
        type: {
            type: String,
        },
        originalName: {
            type: String,
        },
        url: {
            type: String,
        },
        uploadedAt: {
            type: Date,
        }
    }
}, { _id: true });

// False Ceiling Materials
export const FalseCeilingMaterialArrivalSchema = new Schema({
    item: String,
    specification: String,
    quantity: Number,
    unit: String,
    remarks: String,
    verifiedByAccountant: Boolean,
    upload: {
        type: {
            type: String,
        },
        originalName: {
            type: String,
        },
        url: {
            type: String,
        },
        uploadedAt: {
            type: Date,
        }
    }
}, { _id: true });
