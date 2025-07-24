export const isPositiveNumber = (value: any): boolean => {
  return typeof value === "number" && !isNaN(value) && value >= 0;
};

const validateKitchenInput = (kitchen: any): string | null => {
  const { layoutType, measurements, kitchenPackage } = kitchen;

  const validLayouts = ["L-shaped", "Straight", "U-shaped", "Parallel"];
  if (layoutType) {
    if (!layoutType || !validLayouts.includes(layoutType)) {
      return "Kitchen layout type is required and must be one of: " + validLayouts.join(", ");
    }
  }
console.log("mesaruement", measurements)
  if (measurements) {
    if (!measurements || typeof measurements !== "object") {
      return "Measurements must be provided as an object.";
    }
  }
  const { top, left, right } = measurements;
  if (layoutType) {
    switch (layoutType) {
      case "L-shaped":
      case "U-shaped":
        if (!isPositiveNumber(top) || !isPositiveNumber(left) || !isPositiveNumber(right)) {
          return `All measurements (top, left, right) must be positive number for ${layoutType} kitchen.`;
        }
        break;

      case "Straight":
        if (!isPositiveNumber(left)) return "Measurement left must be positive number for Straight kitchen.";
        if (top !== null && right !== null && top > 0  && right > 0  ) return "Only measurement left should be provided for Straight kitchen.";
        break;

      case "Parallel":
        if (!isPositiveNumber(top) || !isPositiveNumber(right)) {
          return "Measurements top and right must be numbers positive number for Parallel kitchen.";
        }
        if (left !== null && left > 0) return "Measurement left should not be provided for Parallel kitchen.";
        break;
    }
  }

  const validPackages = ["Essentials", "Premium", "Luxury", "Build Your Own Package"];
  if (kitchenPackage) {
    if (!kitchenPackage || !validPackages.includes(kitchenPackage)) {
      return "Kitchen package is required and must be valid.";
    }
  }

  return null; // All good!
};


const validateWardrobeInput = (wardrobe: any): string | null => {
  const { wardrobeType, lengthInFeet, heightInFeet, wardrobePackage } = wardrobe;

  const validTypes = ["Sliding", "Openable"];
  if (wardrobeType) {
    if (!wardrobeType || !validTypes.includes(wardrobeType)) {
      return "Wardrobe type is required and must be either 'Sliding' or 'Openable'.";
    }
  }

  if (lengthInFeet) {
    if (!isPositiveNumber(lengthInFeet)) {
      return "Length in feet must be a positive number.";
    }
  }

  if (heightInFeet) {
    if (!isPositiveNumber(heightInFeet)) {
      return "Height in feet must be a positive number.";
    }
  }

  const validPackages = ["Essentials", "Premium", "Luxury", "Build Your Own Package"];
  if (wardrobePackage) {
    if (!wardrobePackage || !validPackages.includes(wardrobePackage)) {
      return "Wardrobe package is required and must be valid.";
    }
  }

  return null;
};



const validateBedroomInput = (bedroom: any): string | null => {
  const { numberOfBedrooms, bedroomPackage, bedType } = bedroom;

  if (numberOfBedrooms) {
    if (!isPositiveNumber(numberOfBedrooms)) {
      return "Number of bedrooms must be a positive number.";
    }
  }

  const validBedTypes = ["Single", "Double", "Queen", "King"];
  if (bedType) {
    if (bedType && !validBedTypes.includes(bedType)) {
      return "If bed type is provided, it must be one of: " + validBedTypes.join(", ");
    }
  }


  const validPackages = ["Essentials", "Premium", "Luxury", "Build Your Own Package"];
  if (bedroomPackage) {
    if (!bedroomPackage || !validPackages.includes(bedroomPackage)) {
      return "Bedroom package is required and must be valid.";
    }
  }


  return null;
};



const validateLivingHallInput = (livingHall: any): string | null => {
  const { seatingStyle, wallDecorStyle, numberOfFans, numberOfLights, livingHallPackage } = livingHall;

  const validSeating = ["Sofa Set", "L-Shaped Sofa", "Recliner Chairs", "Floor Seating"];
  if (seatingStyle) {
    if (seatingStyle && !validSeating.includes(seatingStyle)) {
      return "If seating style is provided, it must be valid.";
    }
  }

  const validWallStyles = ["Paint", "Wallpaper", "Wood Paneling", "Stone Cladding"];
  if (wallDecorStyle) {
    if (wallDecorStyle && !validWallStyles.includes(wallDecorStyle)) {
      return "If wall decor style is provided, it must be valid.";
    }
  }

  if (numberOfFans) {
    if (numberOfFans !== null && !isPositiveNumber(numberOfFans)) {
      return "If number of fans is provided, it must be a positive number.";
    }
  }

  if (numberOfLights) {
    if (numberOfLights !== null && !isPositiveNumber(numberOfLights)) {
      return "If number of lights is provided, it must be a positive number.";
    }
  }

  const validPackages = ["Essentials", "Premium", "Luxury", "Build Your Own Package"];
  if (livingHallPackage) {
    if (!livingHallPackage || !validPackages.includes(livingHallPackage)) {
      return "Living hall package is required and must be valid.";
    }
  }

  return null;
};


export { validateBedroomInput, validateLivingHallInput, validateWardrobeInput, validateKitchenInput }