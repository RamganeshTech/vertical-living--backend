
export const getDefaultRoomFields = (keys: string[], nested: Record<string, any> = {}) => {
  const defaults: any = {};
  keys.forEach((key) => {
    defaults[key] = { quantity: 0, unit: "", remarks: "" };
  });
  return { ...defaults, ...nested };
};

export  const predefinedRooms = [
      {
        name: "Living Room",
        fields: getDefaultRoomFields([
          "tvUnit",
          "displayShelves",
          "modularSofaUnits",
          "coffeeTables",
          "accentWallPanels",
          "wallCladding",
          "falseCeiling",
          "electricalWork",
          "flooring",
          "windows",
          "doors",
          "mirrors",
          "upholsteryAndCurtains",
          "lightingFixtures",
          "partitions",
          "writingDesk",
          "privacyDivider",
          "paintingsWallArt",
          "safetyGrills",
        ]),
      },
      {
        name: "Bedroom",
        fields: getDefaultRoomFields([
          "wardrobe",
          "bed",
          "bedsideTables",
          "dresserUnit",
          "tvPanelUnit",
          "studyDesk",
          "cotBacks",
          "falseCeiling",
          "electricalWork",
          "flooring",
          "windows",
          "doors",
          "mirrors",
          "upholstery",
          "paintings",
          "privacyWall",
          "safetyGrills",
        ], {
          attachedBathrRoom: getDefaultRoomFields([
            "vanityUnit",
            "washBasin",
            "wc",
            "showerPartition",
            "exhaustFan",
            "geyser",
            "wallTiles",
            "towelRods",
            "electricalWork",
            "door",
            "window",
          ]),
        }),
      },
      {
        name: "Kitchen",
        fields: getDefaultRoomFields([
          "baseUnits",
          "wallUnits",
          "tallUnits",
          "islandCounter",
          "chimneyAndHob",
          "sink",
          "rollingShutterCabinet",
          "backsplashCladding",
          "electricalWork",
          "flooring",
          "windows",
          "doors",
          "mirrors",
          "curtains",
          "mealPlanningDesk",
          "safetyGrills",
        ]),
      },
      {
        name: "Dining Room",
        fields: getDefaultRoomFields([
          "crockeryUnit",
          "diningTable",
          "sideboardCounter",
          "pendantLights",
          "wallPanelCladding",
          "studyCounter",
          "electricalWork",
          "flooring",
          "windows",
          "doors",
          "mirrors",
          "upholsteryAndCurtains",
          "wallArt",
          "privacyPartition",
          "safetyGrills",
        ]),
      },
      {
        name: "Balcony",
        fields: getDefaultRoomFields([
          "seatingBench",
          "deckFlooring",
          "verticalGarden",
          "outdoorLighting",
          "electricalWork",
          "flooring",
          "windowsDoors",
          "mirrors",
          "curtainsBlinds",
          "safetyGrills",
          "outdoorPaintings",
        ]),
      },
      {
        name: "Foyer Area",
        fields: getDefaultRoomFields([
          "shoeRack",
          "tallMirrorPanel",
          "decorativeConsole",
          "keyDropStation",
          "electricalWork",
          "flooring",
          "windows",
          "doors",
          "mirrors",
          "upholstery",
          "curtains",
          "welcomeArt",
          "safetyGrill",
        ]),
      },
      {
        name: "Terrace",
        fields: getDefaultRoomFields([
          "pergola",
          "outdoorBar",
          "greenDeck",
          "electricalWork",
          "flooring",
          "doors",
          "windows",
          "curtains",
          "mirrors",
          "safetyGrills",
          "outdoorArt",
        ]),
      },
      {
        name: "Study Room",
        fields: getDefaultRoomFields([
          "studyTable",
          "libraryStorage",
          "ergonomicChair",
          "wallPanels",
          "electricalWork",
          "flooring",
          "windows",
          "doors",
          "mirrors",
          "curtains",
          "upholstery",
          "safetyGrills",
          "motivationalArt",
        ]),
      },
      {
        name: "Car Parking",
        fields: getDefaultRoomFields([
          "utilityCabinets",
          "toolRack",
          "loftStorage",
          "electricalWork",
          "flooring",
          "windows",
          "doors",
          "safetyGrills",
          "curtains",
          "industrialPosters",
        ]),
      },
      {
        name: "Garden",
        fields: getDefaultRoomFields([
          "deckOrPatio",
          "gazebo",
          "seatingArea",
          "pathway",
          "electricalWork",
          "flooring",
          "windows",
          "doors",
          "safetyGrills",
          "curtains",
          "outdoorArt",
        ]),
      },
      {
        name: "Storage Room",
        fields: getDefaultRoomFields([
          "shelvesBins",
          "labelingSystem",
          "ladderRack",
          "electricalWork",
          "flooring",
          "windows",
          "doors",
          "mirrors",
          "curtains",
          "safetyGrills",
        ]),
      },
      {
        name: "Entertainment Room",
        fields: getDefaultRoomFields([
          "reclinerSetup",
          "projectorUnit",
          "gamingConsole",
          "moodLighting",
          "electricalWork",
          "flooring",
          "windows",
          "doors",
          "mirrors",
          "curtains",
          "upholstery",
          "safetyGrills",
          "movieArt",
        ]),
      },
      {
        name: "Home Gym",
        fields: getDefaultRoomFields([
          "equipmentStorage",
          "rubberFlooring",
          "tvMirrorWall",
          "writingDesk",
          "electricalWork",
          "flooring",
          "windows",
          "doors",
          "mirrors",
          "curtains",
          "upholstery",
          "safetyGrills",
          "fitnessWallGraphics",
        ], {
          attachedRestroom: getDefaultRoomFields([
            "vanity",
            "mirror",
            "wc",
            "showerArea",
            "exhaustFan",
            "geyser",
            "flooring",
            "door",
            "window",
          ]),
        }),
      },
    ];