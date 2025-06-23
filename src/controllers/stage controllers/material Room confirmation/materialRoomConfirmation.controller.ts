import { Request, Response } from "express";
import MaterialRoomConfirmationModel from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model";
import mongoose, { Schema, Types } from "mongoose";
import { handleSetStageDeadline, timerFunctionlity } from "../../../utils/common features/timerFuncitonality";

import { livingRoomSchema } from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomTypes"; 
import { bedroomSchema } from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomTypes"; 
import { kitchenSchema } from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomTypes"; 
import { diningRoomSchema } from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomTypes"; 
import { balconySchema } from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomTypes"; 
import { foyerAreaSchema } from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomTypes"; 
import { terraceSchema } from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomTypes"; 
import { studyRoomSchema } from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomTypes"; 
import { carParkingSchema } from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomTypes"; 
import { gardenSchema } from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomTypes"; 
import { storageRoomSchema } from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomTypes"; 
import { entertainmentRoomSchema } from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomTypes"; 
import { homeGymSchema } from "../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomTypes"; 


// function instantiateRoomFields(schema: Schema): any {
//   const tempSchema = new mongoose.Schema({ container: schema });
//   const modelName = `TempModel_${Math.random().toString(36).substring(2)}`;
//   const TempModel = mongoose.model(modelName, tempSchema);

//   const doc = new TempModel();
//   const defaultRoomFields = doc.toObject().container;

//   // Clean up model
//   mongoose.deleteModel(modelName);

//   return defaultRoomFields;
// }

// SHOULD BE USED DURING THE PROJECT CREATION TIME (WHEN THE OPERATION IS DONE ONLY ONE TIME)
// export const initializeMaterialSelection = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(projectId)) {
//       return res.status(400).json({ message: "Invalid projectId" , ok:false});
//     }

//     const existing = await MaterialRoomConfirmationModel.findOne({ projectId });

//     // if (existing) {
//     //   return res.status(200).json({ message: "Material Selection already initialized", data: existing, ok:true });
//     // }

//     const predefinedRooms = [
//       { name: "Living Room", schema: livingRoomSchema },
//       { name: "Bedroom", schema: bedroomSchema },
//       { name: "Kitchen", schema: kitchenSchema },
//       { name: "Dining Room", schema: diningRoomSchema },
//       { name: "Balcony", schema: balconySchema },
//       { name: "Foyer Area", schema: foyerAreaSchema },
//       { name: "Terrace", schema: terraceSchema },
//       { name: "Study Room", schema: studyRoomSchema },
//       { name: "Car Parking", schema: carParkingSchema },
//       { name: "Garden", schema: gardenSchema },
//       { name: "Storage Room", schema: storageRoomSchema },
//       { name: "Entertainment Room", schema: entertainmentRoomSchema },
//       { name: "Home Gym", schema: homeGymSchema },
//     ];

//     const rooms = predefinedRooms.map(({ name, schema }) => ({
//       name,
//       roomFields: instantiateRoomFields(schema),
//       uploads: [],
//     }));

//       await MaterialRoomConfirmationModel.create({
//       projectId,
//       rooms,
//       customRooms: [],
//       isEditable: true,
//       status: "pending",
//       timer: {
//         startedAt: new Date(),
//         completedAt: null,
//         deadLine: null,
//         reminderSent: false,
//       },
//     });

//   } catch (error) {
//     console.error("Error initializing material selection:", error);
//   }
// };


const getDefaultRoomFields = (keys: string[], nested: Record<string, any> = {}) => {
  const defaults: any = {};
  keys.forEach((key) => {
    defaults[key] = { quantity: 0, unit: "", remarks: "" };
  });
  return { ...defaults, ...nested };
};

export const initializeMaterialSelection = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ ok: false, message: "Invalid projectId" });
    }

    const existing = await MaterialRoomConfirmationModel.findOne({ projectId });

    if (existing) {
      return res.status(200).json({
        ok: true,
        message: "Material Selection already initialized",
        data: existing,
      });
    }

    const predefinedRooms = [
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

    const rooms = predefinedRooms.map((room) => ({
      name: room.name,
      roomFields: room.fields,
      uploads: [],
    }));

    const newMaterialForm = await MaterialRoomConfirmationModel.create({
      projectId,
      rooms,
      customRooms: [],
      status: "pending",
      isEditable: true,
      timer: {
        startedAt: new Date(),
        completedAt: null,
        deadLine: null,
        reminderSent: false,
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Material selection initialized successfully",
      data: newMaterialForm,
    });
  } catch (error) {
    console.error("Error initializing material selection:", error);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};


const getMaterialRoomConfirmationByProject = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    const data = await MaterialRoomConfirmationModel.findOne({ projectId });

    if (!data) {
      return res.status(404).json({ ok:false, message: "Material Room Confirmation not found." });
    }

    return res.status(200).json({ message:"fetched all matieral confirmations successfully", ok:true,data});
  } catch (error) {
    console.error("Error fetching material room confirmation:", error);
    return res.status(500).json({ ok:false, message: "Server error" });
  }
};

const getSinglePredefinedRoom = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, roomId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ ok:false,message: "Invalid room ID." });
    }

    const data = await MaterialRoomConfirmationModel.findOne({ projectId });

    if (!data) {
      return res.status(404).json({  ok:false, message: "Material Room Confirmation not found." });
    }

    // Check in predefined rooms
    const predefinedRoom = data.rooms.find(r => (r as any)._id?.toString() === roomId);
    if (predefinedRoom) {
      return res.status(200).json({
        ok:true,
       message:"fetched room",
        data: predefinedRoom
      });
    }

    // Check in custom rooms
    const customRoom = data.customRooms.find(r => (r as any)._id?.toString() === roomId);
    if (customRoom) {
      return res.status(200).json({
        ok:true,
       message:"fetched room",
        data: customRoom
      });
    }

    return res.status(404).json({ message: "Room not found.", ok:false });

  } catch (error) {
    console.error("Error fetching single room:", error);
    return res.status(500).json({ message: "Server error" , ok:false});
  }
};


 const updatePredefinedRoomField = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, roomId, fieldKey } = req.params;
    const { quantity, unit, remarks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ ok: false, message: "Invalid room ID." });
    }

    const doc = await MaterialRoomConfirmationModel.findOne({ projectId });

    if (!doc) {
      return res.status(404).json({ ok: false, message: "Material selection not found." });
    }

    // 1. Check Predefined Rooms
    const predefinedRoom = doc.rooms.find((r: any) => r._id?.toString() === roomId);
    if (predefinedRoom) {
      const field = predefinedRoom.roomFields?.[fieldKey];
      if (!field) {
        return res.status(404).json({ ok: false, message: `Field '${fieldKey}' not found in predefined room.` });
      }

      console.log("quantity", field.quantity)
      field.quantity = quantity ?? field.quantity;
      field.unit = unit ?? field.unit;
      field.remarks = remarks ?? field.remarks;

      console.log("field after updation", field)

      doc.markModified("rooms");

      await doc.save();

      return res.status(200).json({
        ok: true,
        message: `Field '${fieldKey}' in predefined room updated successfully.`,
        data: predefinedRoom
      });
    }

    // 2. Check Custom Rooms
    const customRoom = doc.customRooms.find((r:any) => r._id.toString() === roomId);
    if (customRoom) {
      const item = customRoom.items.find(i => i.itemKey === fieldKey);
      if (!item) {
        return res.status(404).json({ ok: false, message: `Field '${fieldKey}' not found in custom room.` });
      }

      item.quantity = quantity ?? item.quantity;
      item.unit = unit ?? item.unit;
      item.remarks = remarks ?? item.remarks;

      await doc.save();

      return res.status(200).json({
        ok: true,
        message: `Field '${fieldKey}' in custom room updated successfully.`,
        data: customRoom
      });
    }

    return res.status(404).json({ ok: false, message: "Room not found in either predefined or custom rooms." });

  } catch (error) {
    console.error("Error updating predefined room field:", error);
    return res.status(500).json({ ok: false, message: "Server error." });
  }
};


const createCustomRoom = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    const { name } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ ok: false, message: "Room name is required and must be a string." });
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ ok: false, message: "Invalid projectId." });
    }

    const materialSelection = await MaterialRoomConfirmationModel.findOne({ projectId });

    if (!materialSelection) {
      return res.status(404).json({ ok: false, message: "Material selection document not found." });
    }

    // Check for duplicate room name in customRooms
    const roomExists = materialSelection.customRooms.some(
      (room) => room.name.trim().toLowerCase() === name.trim().toLowerCase()
    );

    if (roomExists) {
      return res.status(400).json({ ok: false, message: "Custom room with this name already exists." });
    }

    // Add new custom room
    const newRoom = {
      name: name.trim(),
      items: [],
      uploads: [],
    };

    materialSelection.customRooms.push(newRoom);
    await materialSelection.save();

    return res.status(201).json({
      ok: true,
      message: "Custom room created successfully.",
      room: newRoom,
    });

  } catch (error) {
    console.error("Error creating custom room:", error);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};



const addItemToCustomRoom = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, roomId } = req.params;
    const { itemKey, quantity, unit, remarks } = req.body;

    if (!itemKey || typeof itemKey !== "string") {
      return res.status(400).json({ ok: false, message: "Item key is required and must be a string." });
    }

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ ok: false, message: "Invalid projectId or roomId." });
    }

    const doc = await MaterialRoomConfirmationModel.findOne({ projectId });

    if (!doc) {
      return res.status(404).json({ ok: false, message: "Material selection document not found." });
    }

    const room = doc.customRooms.find((r:any) => r._id.toString() === roomId);

    if (!room) {
      return res.status(404).json({ ok: false, message: "Custom room not found." });
    }

    const existingItem = room.items.find(i => i.itemKey.toLowerCase() === itemKey.trim().toLowerCase());

    if (existingItem) {
      return res.status(400).json({ ok: false, message: "Item key already exists in this room." });
    }

    room.items.push({
      itemKey: itemKey.trim(),
      quantity: typeof quantity === "number" ? quantity : 0,
      unit: typeof unit === "string" ? unit : "",
      remarks: typeof remarks === "string" ? remarks : "",
    });

    await doc.save();

    return res.status(201).json({
      ok: true,
      message: "Item added to custom room successfully.",
      roomId,
      itemKey,
    });

  } catch (error) {
    console.error("Error adding item to custom room:", error);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};


const deleteCustomRoomField = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, roomId, fieldKey } = req.params;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ ok: false, message: "Invalid room ID." });
    }

    const doc = await MaterialRoomConfirmationModel.findOne({ projectId });

    if (!doc) {
      return res.status(404).json({ ok: false, message: "Material selection not found." });
    }

    const customRoom = doc.customRooms.find((room: any) => room._id.toString() === roomId);

    if (!customRoom) {
      return res.status(404).json({ ok: false, message: "Custom room not found." });
    }

    const initialLength = customRoom.items.length;
    customRoom.items = customRoom.items.filter(item => item.itemKey !== fieldKey);

    if (customRoom.items.length === initialLength) {
      return res.status(404).json({ ok: false, message: `Field '${fieldKey}' not found in custom room.` });
    }

    await doc.save();

    return res.status(200).json({
      ok: true,
      message: `Field '${fieldKey}' deleted successfully from custom room.`,
      data: customRoom
    });

  } catch (error) {
    console.error("Error deleting custom room field:", error);
    return res.status(500).json({ ok: false, message: "Server error." });
  }
};

// const getRoomById = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { projectId, roomId } = req.params;

//         const materialDoc = await MaterialRoomConfirmationModel.findOne({ projectId });
//         if (!materialDoc) return res.status(404).json({ ok: false, message: "No docujjjjjjjjjjjjjjjment found" });

//         const room = (materialDoc.rooms as Types.DocumentArray<any>).id(roomId); // This uses Mongoose subdocument lookup
//         // if (!room) return res.status(404).json({ ok: false, message: "Room not found" });

//         console.log("im gettig called room by id", )

//         return res.status(200).json({ ok: true, data: room });
//     } catch (err) {
//         console.error(err);
//         return res.status(500).json({ ok: false, message: "Server error, try again after some time" });
//     }
// };


// const getAllMaterialRooms = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { projectId } = req.params;

//         if (!projectId) {
//             return res.status(400).json({ ok: false, message: "Project ID is required" });
//         }


//         console.log("im gettig called room by id", )


//         const doc = await MaterialRoomConfirmationModel.findOne({ projectId });

//         if (!doc) {
//             return res.status(404).json({ ok: false, message: "Material confirmation not found" });
//         }

//         return res.status(200).json({
//             ok: true,
//             data: doc.rooms, // only returning the list of rooms
//         });
//     } catch (error) {
//         console.error("Error fetching material rooms:", error);
//         return res.status(500).json({ ok: false, message: "Internal server error" });
//     }
// };


// const addMaterialRoom = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { projectId } = req.params;
//         const { roomName } = req.body;

//         if (!roomName || typeof roomName !== "string") {
//             return res.status(400).json({ ok: false, message: "Room name is required" });
//         }

//         const materialDoc = await MaterialRoomConfirmationModel.findOne({ projectId });

//         if (!materialDoc) {
//             return res.status(404).json({ ok: false, message: "Material confirmation document not found" });
//         }

//         // Check for duplicate room
//         const alreadyExists = materialDoc.rooms.some((room) => room.roomName === roomName);
//         if (alreadyExists) {
//             return res.status(400).json({ ok: false, message: "Room already exists" });
//         }

//         materialDoc.rooms.push({
//             roomName,
//             uploads: [],
//             modularWorks: [],
//         });

//         await materialDoc.save();

//         return res.status(201).json({ ok: true, message: "Room added", data: materialDoc.rooms });
//     } catch (error) {
//         console.error("Add Room Error:", error);
//         return res.status(500).json({ ok: false, message: "Internal server error" });
//     }
// };


// const createModularWork = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { projectId, roomId } = req.params;
//         const { workName, notes, materials } = req.body;

//         if (!workName || typeof workName !== "string") {
//             return res.status(400).json({ ok: false, message: "workName is required and must be a string" });
//         }

//         const materialDoc = await MaterialRoomConfirmationModel.findOne({ projectId });
//         if (!materialDoc) {
//             return res.status(404).json({ ok: false, message: "Material confirmation document not found" });
//         }

//         const room = (materialDoc.rooms as Types.DocumentArray<any>).id(roomId);
//         if (!room) {
//             return res.status(404).json({ ok: false, message: "Room not found" });
//         }

//         room.modularWorks.push({
//             workName,
//             notes: typeof notes === "string" ? notes : null,
//             materials: Array.isArray(materials) ? materials : [],
//         });

//         await materialDoc.save();

//         return res.status(201).json({ ok: true, message: "Modular work added", data: room.modularWorks });
//     } catch (error) {
//         console.error("Add Modular Work Error:", error);
//         return res.status(500).json({ ok: false, message: "Internal server error" });
//     }
// };

// const editModularWork = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { projectId, roomId, workId } = req.params;
//         const { workName, notes, materials } = req.body;

//         if (workName && typeof workName !== "string") {
//             return res.status(400).json({ ok: false, message: "workName must be a string" });
//         }

//         if (notes && typeof notes !== "string") {
//             return res.status(400).json({ ok: false, message: "notes must be a string" });
//         }

//         if (materials && !Array.isArray(materials)) {
//             return res.status(400).json({ ok: false, message: "materials must be an array of strings" });
//         }

//         const materialDoc = await MaterialRoomConfirmationModel.findOne({ projectId });
//         if (!materialDoc) {
//             return res.status(404).json({ ok: false, message: "Material confirmation document not found" });
//         }

//         const room = (materialDoc.rooms as Types.DocumentArray<any>).id(roomId);
//         if (!room) {
//             return res.status(404).json({ ok: false, message: "Room not found" });
//         }

//         const modularWork = room.modularWorks.id(workId);
//         if (!modularWork) {
//             return res.status(404).json({ ok: false, message: "Modular work not found" });
//         }

//         // Perform updates conditionally
//         if (workName) modularWork.workName = workName;
//         if (notes !== undefined) modularWork.notes = notes || null;
//         if (materials) modularWork.materials = materials;

//         await materialDoc.save();

//         return res.status(200).json({ ok: true, message: "Modular work updated", data: modularWork });
//     } catch (err) {
//         console.error("Edit Modular Work Error:", err);
//         return res.status(500).json({ ok: false, message: "Internal server error" });
//     }
// };

// const deleteModularWork = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { projectId, roomId, workId } = req.params;

//         if (!projectId || !roomId || !workId) {
//             return res.status(400).json({ ok: false, message: "Missing required parameters" });
//         }

//         const materialDoc = await MaterialRoomConfirmationModel.findOne({ projectId });
//         if (!materialDoc) {
//             return res.status(404).json({ ok: false, message: "Material confirmation document not found" });
//         }

//         const room = (materialDoc.rooms as Types.DocumentArray<any>).id(roomId);
//         if (!room) {
//             return res.status(404).json({ ok: false, message: "Room not found" });
//         }

//         const workIndex = room.modularWorks.findIndex((work: any) => work._id.toString() === workId);
//         if (workIndex === -1) {
//             return res.status(404).json({ ok: false, message: "Modular work not found" });
//         }

//         room.modularWorks.splice(workIndex, 1);
//         await materialDoc.save();

//         return res.status(200).json({ ok: true, message: "Modular work deleted successfully" });
//     } catch (err) {
//         console.error("Delete Modular Work Error:", err);
//         return res.status(500).json({ ok: false, message: "Internal server error" });
//     }
// };


// const deleteMaterialRoom = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { projectId, roomId } = req.params;

//         if (!projectId || !roomId) {
//             return res.status(400).json({ ok: false, message: "Project ID and Room ID are required" });
//         }

//         const materialDoc = await MaterialRoomConfirmationModel.findOne({ projectId });
//         if (!materialDoc) {
//             return res.status(404).json({ ok: false, message: "Material confirmation document not found" });
//         }

//         const roomIndex = materialDoc.rooms.findIndex((room: any) => room._id.toString() === roomId);
//         if (roomIndex === -1) {
//             return res.status(404).json({ ok: false, message: "Room not found" });
//         }

//         materialDoc.rooms.splice(roomIndex, 1);
//         await materialDoc.save();

//         return res.status(200).json({ ok: true, message: "Room deleted successfully" });
//     } catch (err) {
//         console.error("Delete Room Error:", err);
//         return res.status(500).json({ ok: false, message: "Internal server error" });
//     }
// };



// Mark form stage as completed (finalize the requirement gathering step)




const materialSelectionCompletionStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { formId } = req.params;
        const form = await MaterialRoomConfirmationModel.findById(formId);

        if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

        form.status = "completed";
        form.isEditable = false
        timerFunctionlity(form, "completedAt")
        await form.save();

        // if (form.status === "completed") {
        //   let siteMeasurement = await SiteMeasurementModel.findOne({ projectId: form.projectId });
        //   if (!siteMeasurement) {
        //     siteMeasurement = new SiteMeasurementModel({
        //       projectId: form.projectId,
        //       status: "pending",
        //       isEditable: true,
        //       timer: {
        //         startedAt: new Date(),
        //         completedAt: null,
        //         deadLine: null
        //       },
        //       uploads: [],
        //       siteDetails: {
        //         totalPlotAreaSqFt: { type: Number, default: null },
        //         builtUpAreaSqFt: { type: Number, default: null },
        //         roadFacing: { type: Boolean, default: null },
        //         numberOfFloors: { type: Number, default: null },
        //         hasSlope: { type: Boolean, default: null },
        //         boundaryWallExists: { type: Boolean, default: null },
        //         additionalNotes: { type: String, default: null }
        //       },
        //       rooms: [],
        //     });
        //   } else {
        //     siteMeasurement.status = "pending";
        //     siteMeasurement.isEditable = true;
        //     siteMeasurement.timer.startedAt = new Date();

        //   }
        //   await siteMeasurement.save()
        // }


        return res.status(200).json({ ok: true, message: "Material Selection stage marked as completed", data: form });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Server error, try again after some time" });
    }
};


// Mark form stage as completed (finalize the requirement gathering step)
const setMaterialConfirmationStageDeadline = (req: Request, res: Response): Promise<any> => {
    return handleSetStageDeadline(req, res, {
        model: MaterialRoomConfirmationModel,
        stageName: "Material Confirmation"
    });
};

const uploadMaterialRoomFiles = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, roomId } = req.params;

        if (!projectId || !roomId) {
            return res.status(400).json({ ok: false, message: "Project ID and Room ID are required" });
        }

        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ ok: false, message: "No files uploaded" });
        }

        const materialDoc = await MaterialRoomConfirmationModel.findOne({ projectId });
        if (!materialDoc) {
            return res.status(404).json({ ok: false, message: "Material confirmation document not found" });
        }

        const room = (materialDoc.rooms as Types.DocumentArray<any>).id(roomId);
        if (!room) {
            return res.status(404).json({ ok: false, message: "Room not found" });
        }

        const uploadedFiles = (req.files as (Express.Multer.File & { location: string })[]).map(file => ({
            type: file.mimetype.includes("pdf") ? "pdf" : "image",
            url: file.location,
            originalName: file.originalname,
            uploadedAt: new Date(),
        }));


        room.uploads.push(...uploadedFiles);

        await materialDoc.save();

        return res.status(200).json({
            ok: true,
            message: "Files uploaded successfully",
            data: uploadedFiles,
        });
    } catch (err) {
        console.error("Upload Room Files Error:", err);
        return res.status(500).json({ ok: false, message: "Internal server error" });
    }
};


const deleteMaterialRoomFile = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, roomId, fileId } = req.params;

    if (!projectId || !roomId || !fileId)
      return res.status(400).json({ ok: false, message: "Missing required parameters" });

    const materialDoc = await MaterialRoomConfirmationModel.findOne({ projectId });
    if (!materialDoc) return res.status(404).json({ ok: false, message: "Material document not found" });

    const room = (materialDoc.rooms as Types.DocumentArray<any>).id(roomId);
    if (!room) return res.status(404).json({ ok: false, message: "Room not found" });

    const uploadIndex = room.uploads.findIndex((upload:any) => upload._id?.toString() === fileId);
    if (uploadIndex === -1) return res.status(404).json({ ok: false, message: "file not found" });

    room.uploads.splice(uploadIndex, 1); // Remove the upload
    await materialDoc.save();

    return res.status(200).json({ ok: true, message: "file deleted successfully" });
  } catch (err) {
    console.error("Error deleting room upload:", err);
    return res.status(500).json({ ok: false, message: "Internal server error" });
  }
};



export {
    // getRoomById,
    // getAllMaterialRooms,
    // addMaterialRoom,
    // createModularWork,
    // editModularWork,
    // deleteModularWork,
    // deleteMaterialRoom,
    
    getMaterialRoomConfirmationByProject,
getSinglePredefinedRoom ,
updatePredefinedRoomField, 
createCustomRoom ,
addItemToCustomRoom, 
deleteCustomRoomField, 

    materialSelectionCompletionStatus,
    setMaterialConfirmationStageDeadline,
    uploadMaterialRoomFiles,
    deleteMaterialRoomFile
}



