// src/utils/validation/materialValidations.ts
import { MaterialItem } from "../../models/Material Estimate Model/materialEstimate.model";

const materialValidations = ({
    materialName,
    unit,
    unitPrice,
    materialQuantity,
}: MaterialItem): { valid: boolean; message?: string } => {
    
    if (!materialName) return { valid: false, message: "Material Name is required" };
    if (!unit) return { valid: false, message: "Unit field is required" };
    if (unitPrice === null || unitPrice < 0) return { valid: false, message: "Valid Unit Price is required" };
    if (materialQuantity === null || materialQuantity < 0)
        return { valid: false, message: "Valid Quantity is required" };

    return { valid: true };
};

export { materialValidations };
