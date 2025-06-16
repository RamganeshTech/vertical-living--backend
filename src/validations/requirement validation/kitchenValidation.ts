export const isPositiveNumber = (value: any): boolean => {
  return typeof value === "number" && !isNaN(value) && value > 0;
};

const validateKitchenInput = (kitchen: any): string | null => {
  const { layoutType, measurements, kitchenPackage } = kitchen;

  const validLayouts = ["L-shaped", "Straight", "U-shaped", "Parallel"];
  if (!layoutType || !validLayouts.includes(layoutType)) {
    return "Kitchen layout type is required and must be one of: " + validLayouts.join(", ");
  }

  if (!measurements || typeof measurements !== "object") {
    return "Measurements must be provided as an object.";
  }

  const { A, B, C } = measurements;

  switch (layoutType) {
    case "L-shaped":
    case "U-shaped":
      if (!isPositiveNumber(A) || !isPositiveNumber(B) || !isPositiveNumber(C)) {
        return `All measurements (A, B, C) must be numbers greater than 0 for ${layoutType} kitchen.`;
      }
      break;

    case "Straight":
      if (!isPositiveNumber(B)) return "Measurement B must be a number greater than 0 for Straight kitchen.";
      if (A != null || C != null) return "Only measurement B should be provided for Straight kitchen.";
      break;

    case "Parallel":
      if (!isPositiveNumber(A) || !isPositiveNumber(C)) {
        return "Measurements A and C must be numbers greater than 0 for Parallel kitchen.";
      }
      if (B != null) return "Measurement B should not be provided for Parallel kitchen.";
      break;
  }

  const validPackages = ["Essentials", "Premium", "Luxury", "Build Your Own Package"];
  if (!kitchenPackage || !validPackages.includes(kitchenPackage)) {
    return "Kitchen package is required and must be valid.";
  }

  return null; // All good!
};


const validateWardrobeInput = (wardrobe: any): string | null => {
  const { wardrobeType, lengthInFeet, heightInFeet, wardrobePackage } = wardrobe;

  const validTypes = ["Sliding", "Openable"];
  if (!wardrobeType || !validTypes.includes(wardrobeType)) {
    return "Wardrobe type is required and must be either 'Sliding' or 'Openable'.";
  }

  if (!isPositiveNumber(lengthInFeet)) {
    return "Length in feet must be a number greater than 0.";
  }

  if (!isPositiveNumber(heightInFeet)) {
    return "Height in feet must be a number greater than 0.";
  }

  const validPackages = ["Essentials", "Premium", "Luxury", "Build Your Own Package"];
  if (!wardrobePackage || !validPackages.includes(wardrobePackage)) {
    return "Wardrobe package is required and must be valid.";
  }

  return null;
};



const validateBedroomInput = (bedroom: any): string | null => {
  const { numberOfBedrooms, bedroomPackage, bedType } = bedroom;

  if (!isPositiveNumber(numberOfBedrooms)) {
    return "Number of bedrooms must be a number greater than 0.";
  }

  const validBedTypes = ["Single", "Double", "Queen", "King"];
  if (bedType && !validBedTypes.includes(bedType)) {
    return "If bed type is provided, it must be one of: " + validBedTypes.join(", ");
  }

  const validPackages = ["Essentials", "Premium", "Luxury", "Build Your Own Package"];
  if (!bedroomPackage || !validPackages.includes(bedroomPackage)) {
    return "Bedroom package is required and must be valid.";
  }

  return null;
};



const validateLivingHallInput = (livingHall: any): string | null => {
  const { seatingStyle, wallDecorStyle, numberOfFans, numberOfLights, livingHallPackage } = livingHall;

  const validSeating = ["Sofa Set", "L-Shaped Sofa", "Recliner Chairs", "Floor Seating"];
  if (seatingStyle && !validSeating.includes(seatingStyle)) {
    return "If seating style is provided, it must be valid.";
  }

  const validWallStyles = ["Paint", "Wallpaper", "Wood Paneling", "Stone Cladding"];
  if (wallDecorStyle && !validWallStyles.includes(wallDecorStyle)) {
    return "If wall decor style is provided, it must be valid.";
  }

  if (numberOfFans != null && !isPositiveNumber(numberOfFans)) {
    return "If number of fans is provided, it must be a number greater than 0.";
  }

  if (numberOfLights != null && !isPositiveNumber(numberOfLights)) {
    return "If number of lights is provided, it must be a number greater than 0.";
  }

  const validPackages = ["Essentials", "Premium", "Luxury", "Build Your Own Package"];
  if (!livingHallPackage || !validPackages.includes(livingHallPackage)) {
    return "Living hall package is required and must be valid.";
  }

  return null;
};


export {validateBedroomInput, validateLivingHallInput, validateWardrobeInput, validateKitchenInput}