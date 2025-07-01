export const requiredFieldsByRoomArrival: Record<string, string[]> = {
  carpentry: ["material", "brandName", "specification", "quantity", "unit", "remarks"],
  hardware: ["item", "size", "material", "brandName", "quantity", "unit", "remarks"],
  electricalFittings: ["item", "specification", "quantity", "unit", "remarks"],
  tiles: ["type", "brandName", "size", "quantity", "unit", "remarks"],
  ceramicSanitaryware: ["item", "specification", "quantity", "unit", "remarks"],
  paintsCoatings: ["type", "brandName", "color", "quantity", "unit", "remarks"],
  lightsFixtures: ["type", "brandName", "specification", "quantity", "unit", "remarks"],
  glassMirrors: ["type", "brandName", "size", "thickness", "quantity", "remarks"],
  upholsteryCurtains: ["item", "fabric", "color", "quantity", "unit", "remarks"],
  falseCeilingMaterials: ["item", "specification", "quantity", "unit", "remarks"]
};

export const validateMaterialFieldsByRoom = (roomKey: string, item: any): { success: boolean; message?: string } => {
  const requiredFields = requiredFieldsByRoomArrival[roomKey];
  if (!requiredFields) {
    return { success: false, message: `Invalid room key: ${roomKey}` };
  }

  for (const field of requiredFields) {
    if (item[field] === undefined || item[field] === null || item[field] === "") {
      return { success: false, message: `Missing required field: ${field}` };
    }

    if (field === "quantity") {
      const parsed = parseFloat(item[field]);
      if (isNaN(parsed)) {
        return { success: false, message: `Field '${field}' must be a valid number` };
      }
    }

    if (
      ["remarks", "material", "item", "type", "brandName", "specification", "unit", "size", "color", "fabric", "thickness"].includes(field)
    ) {
      if (typeof item[field] !== "string") {
        return { success: false, message: `Field '${field}' must be a string` };
      }
    }
  }

  // 🔍 Upload validation
 if (Object.keys(item.upload).length) {
  // console.log(item.upload, "item.uploda is te sfl;sjflsjflk;j")
    if (typeof item.upload !== "object") {
      return { success: false, message: "Invalid upload field structure" };
    }

    if (item.upload.type !== "image") {
      return { success: false, message: "Only image files are allowed in upload field" };
    }

    if (!item.upload?.url || typeof item.upload.url !== "string") {
      return { success: false, message: "Upload must include a valid image URL" };
    }
  }


  return { success: true };
};
