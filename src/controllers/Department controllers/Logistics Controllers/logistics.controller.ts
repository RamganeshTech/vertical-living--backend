// logistics.controller.ts
import { Request, Response } from "express";
import { Types } from "mongoose";
import { LogisticsShipmentModel } from "../../../models/Department Models/Logistics Model/logistics.model";

// Create a new Vehicle
// export const createVehicle = async (req: Request, res: Response): Promise<any> => {
//     try {

//         const { organizationId } = req.params;

//         const {
//             vehicleNumber,
//             vehicleType,
//             capacity,
//             driver,
//             driverCharge,
//             isAvailable,
//             currentLocation,
//             maintenanceStatus
//         } = req.body;

//         if (!vehicleNumber) {
//             return res.status(400).json({ ok: false, message: "vehicleNumber and vehicleType are required" });
//         }

//         const vehicle = await LogisticsVehicleModel.create({
//             vehicleNumber,
//             vehicleType,
//             capacity,
//             driver,
//             driverCharge,
//             isAvailable,
//             currentLocation,
//             maintenanceStatus
//         });


//         res.status(201).json({ ok: true, data: vehicle });


//         setImmediate(async () => {
//             try {
//                 const logisticsMain = await LogisticsMainModel.findOne({ organizationId });

//                 if (logisticsMain) {
//                     // ✅ Add vehicleId if not already in vehicles array
//                     if (!logisticsMain.vehicles.includes(vehicle._id)) {
//                         logisticsMain.vehicles.push(vehicle._id);
//                     }

//                     // Save updated logistics data
//                     await logisticsMain.save();
//                 } else {
//                     // If no LogisticsMain exists for this org yet, create one.
//                     await LogisticsMainModel.create({
//                         organizationId,
//                         vehicles: [vehicle._id],
//                         projectShipments: []
//                     });
//                 }

//                 console.log(`✅ LogisticsMainModel created for organization`);
//             }
//             catch (error: any) {
//                 console.error("❌ Error updating LogisticsMainModel in background:", error.message);
//             }
//         })
//     } catch (err: any) {
//         return res.status(500).json({ ok: false, message: "Failed to create vehicle", error: err.message });
//     }
// };

// export const updateVehicle = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { vehicleId, organizationId } = req.params;

//         if (!vehicleId || !Types.ObjectId.isValid(vehicleId)) {
//             return res.status(400).json({ ok: false, message: "Invalid vehicleId" });
//         }

//         const {
//             vehicleNumber,
//             vehicleType,
//             capacity,
//             driver,
//             driverCharge,
//             isAvailable,
//             currentLocation,
//             maintenanceStatus
//         } = req.body;

//         const vehicle = await LogisticsVehicleModel.findById(vehicleId);

//         if (!vehicle) {
//             return res.status(404).json({ ok: false, message: "Vehicle not found" });
//         }

//         // Update only the provided fields
//         if (vehicleNumber) vehicle.vehicleNumber = vehicleNumber;
//         if (vehicleType) vehicle.vehicleType = vehicleType;
//         if (capacity) vehicle.capacity = capacity;
//         if (driver) vehicle.driver = driver;
//         if (typeof driverCharge === "number") vehicle.driverCharge = driverCharge;
//         if (typeof isAvailable === "boolean") vehicle.isAvailable = isAvailable;
//         if (currentLocation) vehicle.currentLocation = currentLocation;
//         if (maintenanceStatus) vehicle.maintenanceStatus = maintenanceStatus;

//         const updatedVehicle = await vehicle.save();

//         res.status(200).json({ ok: true, data: updatedVehicle });

//         setImmediate(async () => {
//             try {
//                 const logisticsMain = await LogisticsMainModel.findOne({ organizationId });

//                 if (logisticsMain) {
//                     // ✅ Add vehicleId if not already in vehicles array
//                     logisticsMain.vehicles = logisticsMain.vehicles.filter((id) => id.toString() !== vehicleId)

//                     // Add updated vehicleId (if not already present)
//                     if (!logisticsMain.vehicles.includes(updatedVehicle._id)) {
//                         logisticsMain.vehicles.push(updatedVehicle._id);
//                     }
//                     // Save updated logistics data
//                     await logisticsMain.save();
//                 }
//                 console.log(`✅ LogisticsMainModel created for organization`);
//             }
//             catch (error: any) {
//                 console.error("❌ Error updating LogisticsMainModel in background:", error.message);
//             }
//         })

//     } catch (err: any) {
//         console.error("❌ Error updating vehicle:", err.message);
//         return res.status(500).json({ ok: false, message: "Failed to update vehicle", error: err.message });
//     }
// };


// export const deleteVehicle = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { vehicleId, organizationId } = req.params;

//         if (!vehicleId || !Types.ObjectId.isValid(vehicleId) || !Types.ObjectId.isValid(organizationId)) {
//             return res.status(400).json({ ok: false, message: "Invalid vehicleId or organizationId" });
//         }

//         const vehicle = await LogisticsVehicleModel.findByIdAndDelete(vehicleId);

//         if (!vehicle) {
//             return res.status(404).json({ ok: false, message: "Vehicle not found" });
//         }

//         res.status(200).json({ ok: true, message: "Vehicle deleted successfully" });

//         // ✅ Remove from LogisticsMainModel in background
//         setImmediate(async () => {
//             try {
//                 const logisticsMain = await LogisticsMainModel.findOne({ organizationId });

//                 if (logisticsMain) {
//                     logisticsMain.vehicles = logisticsMain.vehicles.filter(
//                         vid => vid.toString() !== vehicleId
//                     );

//                     await logisticsMain.save();
//                     console.log("✔️ Vehicle removed from LogisticsMainModel");
//                 }
//             } catch (err: any) {
//                 console.error("❌ Error updating LogisticsMainModel in deleteVehicle:", err.message);
//             }
//         });

//     } catch (err: any) {
//         console.error("❌ Error deleting vehicle:", err.message);
//         return res.status(500).json({ ok: false, message: "Failed to delete vehicle", error: err.message });
//     }
// };

// export const createShipment = async (req: Request, res: Response): Promise<any> => {
//     try {

//         const { projectId, organizationId } = req.params;

//         const {
//             shipmentNumber,
//             shipmentType,
//             vehicleDetails,
//             origin,
//             destination,
//             items,
//             status,
//             scheduledDate,
//             assignedTo,
//             notes
//         } = req.body;


//         if (!projectId || !Types.ObjectId.isValid(projectId)) {
//             return res.status(400).json({ ok: false, message: "Invalid or missing projectId" });
//         }

//         // if (!shipmentType || !["delivery", "pickup", "transfer"].includes(shipmentType)) {
//         //   return res.status(400).json({ ok: false, message: "Invalid shipmentType" });
//         // }

//         let vehicleId: Types.ObjectId | null = null;

//         // CASE 1: vehicleDetails is an existing vehicle's ObjectId
//         if (typeof vehicleDetails === "string" && Types.ObjectId.isValid(vehicleDetails)) {
//             vehicleId = new Types.ObjectId(vehicleDetails);

//             const existingVehicle = await LogisticsVehicleModel.findById(vehicleId);
//             if (!existingVehicle) {
//                 return res.status(404).json({ ok: false, message: "Vehicle not found with provided ID" });
//             }

//             // CASE 2: vehicleDetails is a new vehicle object
//         } else if (typeof vehicleDetails === "object" && vehicleDetails !== null) {
//             const {
//                 vehicleNumber,
//                 vehicleType,
//                 capacity,
//                 driver,
//                 driverCharge,
//                 isAvailable,
//                 currentLocation,
//                 maintenanceStatus
//             } = vehicleDetails;

//             // Minimum fields check
//             if (!vehicleNumber) {
//                 return res.status(400).json({ ok: false, message: "vehicleNumber and vehicleType required for new vehicle" });
//             }

//             const newVehicle = await LogisticsVehicleModel.create({
//                 vehicleNumber,
//                 vehicleType,
//                 capacity,
//                 driver,
//                 driverCharge,
//                 isAvailable,
//                 currentLocation,
//                 maintenanceStatus
//             });

//             vehicleId = newVehicle._id
//         }

//         // Create Shipment with the resolved vehicleId
//         const shipment = await LogisticsShipmentModel.create({
//             projectId,
//             shipmentNumber,
//             shipmentType,
//             vehicleDetails: vehicleId,
//             origin,
//             destination,
//             items,
//             status,
//             scheduledDate,
//             assignedTo,
//             notes
//         });

//         res.status(201).json({ ok: true, data: shipment });

//         // await LogisticsMainModel.updateOne(
//         //     { organizationId: organizationId },
//         //     {
//         //         $addToSet: {
//         //             vehicles: vehicleId,
//         //             "projectShipments.$[elem].shipments": shipment._id
//         //         }
//         //     },
//         //     {
//         //         arrayFilters: [{ "elem.projectId": projectId }],
//         //         upsert: true // optional: if you want to create one if doesn't exist
//         //     }
//         // );

//         setImmediate(async () => {
//             try {
//                 const logisticsMain = await LogisticsMainModel.findOne({ organizationId });

//                 if (logisticsMain) {
//                     // ✅ Check if projectId already exists in projectShipments
//                     const existingProjectShipment = logisticsMain.projectShipments.find((proj) =>
//                         proj.projectId.toString() === projectId.toString()
//                     );

//                     if (existingProjectShipment) {
//                         // Avoid duplicate shipment IDs
//                         if (!existingProjectShipment.shipments.includes(shipment._id)) {
//                             existingProjectShipment.shipments.push(shipment._id);
//                         }

//                     } else {
//                         // Add new projectShipment entry with shipment ID
//                         logisticsMain.projectShipments.push({
//                             projectId: new Types.ObjectId(projectId),
//                             shipments: [shipment._id]
//                         });
//                     }

//                     // ✅ Add vehicleId if not already in vehicles array
//                     if (!logisticsMain.vehicles.includes(vehicleId!)) {
//                         logisticsMain.vehicles.push(vehicleId!);
//                     }

//                     // Save updated logistics data
//                     await logisticsMain.save();
//                 } else {
//                     // If no LogisticsMain exists for this org yet, create one.
//                     await LogisticsMainModel.create({
//                         organizationId,
//                         vehicles: [vehicleId],
//                         projectShipments: [
//                             {
//                                 projectId,
//                                 shipments: [shipment._id]
//                             }
//                         ]
//                     });
//                 }

//                 console.log(`✅ LogisticsMainModel created for organization`);
//             }
//             catch (error: any) {
//                 console.error("❌ Error updating LogisticsMainModel in background:", error.message);
//             }
//         })

//     } catch (err: any) {
//         return res.status(500).json({ ok: false, message: "Failed to create shipment", error: err.message });
//     }
// };



// export const updateShipment = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { shipmentId, organizationId, projectId } = req.params;
//         const {
//             shipmentNumber,
//             shipmentType,
//             vehicleDetails,
//             origin,
//             destination,
//             items,
//             status,
//             scheduledDate,
//             assignedTo,
//             notes
//         } = req.body;

//         if (!Types.ObjectId.isValid(shipmentId)) {
//             return res.status(400).json({ ok: false, message: "Invalid shipmentId" });
//         }

//         if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
//             return res.status(400).json({ ok: false, message: "Invalid organizationId" });
//         }

//         const existingShipment = await LogisticsShipmentModel.findById(shipmentId);

//         if (!existingShipment) {
//             return res.status(404).json({ ok: false, message: "Shipment not found" });
//         }

//         // Track significant changes
//         const originalProjectId = existingShipment.projectId.toString();
//         let originalVehicleId = typeof vehicleDetails === "string" ? existingShipment.vehicleDetails?.toString() : vehicleDetails._id.toString();

//         let vehicleId: Types.ObjectId | null = null;

//         // CASE 1: vehicleDetails is an ObjectId (string or ObjectId)
//         if (typeof vehicleDetails === "string" && Types.ObjectId.isValid(vehicleDetails)) {
//             const existingVehicle = await LogisticsVehicleModel.findById(vehicleDetails);
//             if (!existingVehicle) {
//                 return res.status(404).json({ ok: false, message: "Vehicle not found with provided ID" });
//             }
//             vehicleId = new Types.ObjectId(vehicleDetails);

//             // CASE 2: vehicleDetails is a new vehicle object
//         } else if (typeof vehicleDetails === "object" && vehicleDetails !== null) {

//             const {
//                 _id,
//                 vehicleNumber,
//                 vehicleType,
//                 capacity,
//                 driver,
//                 driverCharge,
//                 isAvailable,
//                 currentLocation,
//                 maintenanceStatus
//             } = vehicleDetails;

//             // SUBCASE A: Update existing vehicle (when _id is given)
//             if (_id && Types.ObjectId.isValid(_id)) {
//                 const existingVehicle = await LogisticsVehicleModel.findById(_id);
//                 if (!existingVehicle) {
//                     return res.status(404).json({ ok: false, message: "Vehicle with given _id not found for update" });
//                 }

//                 // Update only provided fields (partial update)
//                 if (vehicleNumber) existingVehicle.vehicleNumber = vehicleNumber;
//                 if (vehicleType) existingVehicle.vehicleType = vehicleType;
//                 if (capacity) existingVehicle.capacity = capacity;
//                 if (driver) existingVehicle.driver = driver;
//                 if (typeof driverCharge === "number") existingVehicle.driverCharge = driverCharge;
//                 if (typeof isAvailable === "boolean") existingVehicle.isAvailable = isAvailable;
//                 if (currentLocation) existingVehicle.currentLocation = currentLocation;
//                 if (maintenanceStatus) existingVehicle.maintenanceStatus = maintenanceStatus;

//                 await existingVehicle.save();
//                 vehicleId = existingVehicle._id;

//                 // SUBCASE B: Create new vehicle (no _id, but full object)
//             } else {
//                 if (!vehicleNumber || !vehicleType) {
//                     return res.status(400).json({ ok: false, message: "vehicleNumber and vehicleType are required for new vehicle" });
//                 }

//                 const newVehicle = await LogisticsVehicleModel.create({
//                     vehicleNumber,
//                     vehicleType,
//                     capacity,
//                     driver,
//                     driverCharge,
//                     isAvailable,
//                     currentLocation,
//                     maintenanceStatus
//                 });

//                 vehicleId = newVehicle._id;
//             }
//         } else {
//             // If not passed at all, keep the existing one
//             vehicleId = existingShipment.vehicleDetails as Types.ObjectId;
//         }

//         // Proceed to update the shipment
//         existingShipment.projectId = new Types.ObjectId(projectId) || existingShipment.projectId;
//         existingShipment.shipmentNumber = shipmentNumber || existingShipment.shipmentNumber;
//         existingShipment.shipmentType = shipmentType || existingShipment.shipmentType;
//         existingShipment.vehicleDetails = vehicleId;
//         existingShipment.origin = origin || existingShipment.origin;
//         existingShipment.destination = destination || existingShipment.destination;
//         existingShipment.items = items || existingShipment.items;
//         existingShipment.status = status || existingShipment.status;
//         existingShipment.scheduledDate = scheduledDate || existingShipment.scheduledDate;
//         existingShipment.assignedTo = assignedTo || existingShipment.assignedTo;
//         existingShipment.notes = notes || existingShipment.notes;

//         const updatedShipment = await existingShipment.save();

//         // Send response immediately ✅
//         res.status(200).json({ ok: true, data: updatedShipment });

//         // Run background logistics model update if necessary 🚀
//         setImmediate(async () => {
//             try {
//                 // Only update if projectId or vehicleId changed
//                 const isProjectChanged = originalProjectId !== projectId;
//                 const isVehicleChanged = originalVehicleId !== vehicleId?.toString();

//                 if (!isProjectChanged && !isVehicleChanged) return;

//                 const logisticsMain = await LogisticsMainModel.findOne({ organizationId });

//                 if (logisticsMain) {
//                     // Remove the shipment from the old projectId if changed
//                     if (isProjectChanged) {
//                         const oldProjectEntry = logisticsMain.projectShipments.find(proj =>
//                             proj.projectId.toString() === originalProjectId
//                         );
//                         if (oldProjectEntry) {
//                             oldProjectEntry.shipments = oldProjectEntry.shipments.filter(
//                                 id => id.toString() !== shipmentId
//                             );
//                         }
//                     }

//                     // Add to the new projectId entry
//                     const newProjectEntry = logisticsMain.projectShipments.find(proj =>
//                         proj.projectId.toString() === projectId
//                     );

//                     if (newProjectEntry) {
//                         if (!newProjectEntry.shipments.includes(updatedShipment._id)) {
//                             newProjectEntry.shipments.push(updatedShipment._id);
//                         }
//                     } else {
//                         logisticsMain.projectShipments.push({
//                             projectId: new Types.ObjectId(projectId),
//                             shipments: [updatedShipment._id],
//                         });
//                     }

//                     // Add vehicle if not present
//                     //   if (!logisticsMain.vehicles.includes(vehicleId!)) {
//                     //     logisticsMain.vehicles.push(vehicleId!);
//                     //   }


//                     if (isVehicleChanged) {
//                         // 🧼 Remove old vehicle
//                         logisticsMain.vehicles = logisticsMain.vehicles.filter(
//                             (id) => id.toString() !== originalVehicleId
//                         );

//                         // ➕ Add new vehicle
//                         if (!logisticsMain.vehicles.includes(vehicleId!)) {
//                             logisticsMain.vehicles.push(vehicleId!);
//                         }
//                     }

//                     await logisticsMain.save();
//                     console.log("✅ LogisticsMainModel updated (background from updateShipment)");

//                 } else {
//                     // If it doesn't exist, create it
//                     await LogisticsMainModel.create({
//                         organizationId,
//                         vehicles: [vehicleId],
//                         projectShipments: [
//                             {
//                                 projectId,
//                                 shipments: [updatedShipment._id],
//                             }
//                         ]
//                     });
//                     console.log("✅ LogisticsMainModel created (background from updateShipment)");
//                 }
//             } catch (error: any) {
//                 console.error("❌ Failed to update LogisticsMainModel:", error.message);
//             }
//         });

//     } catch (error: any) {
//         return res.status(500).json({ ok: false, message: "Error updating shipment", error: error.message });
//     }
// };


// export const deleteShipment = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { shipmentId, organizationId } = req.params;

//         if (!Types.ObjectId.isValid(shipmentId) || !Types.ObjectId.isValid(organizationId)) {
//             return res.status(400).json({ ok: false, message: "Invalid shipmentId or organizationId" });
//         }

//         const shipment = await LogisticsShipmentModel.findByIdAndDelete(shipmentId);

//         if (!shipment) {
//             return res.status(404).json({ ok: false, message: "Shipment not found" });
//         }

//         // Respond immediately ✅
//         res.status(200).json({ ok: true, message: "Shipment deleted successfully" });

//         // Remove the shipment from LogisticsMainModel.projectShipments in background ⏱
//         setImmediate(async () => {
//             try {
//                 const logisticsMain = await LogisticsMainModel.findOne({ organizationId });

//                 if (!logisticsMain) return;

//                 // Find matching project entry
//                 const projectEntry = logisticsMain.projectShipments.find((proj) =>
//                     proj.projectId.toString() === shipment.projectId.toString()
//                 );

//                 if (projectEntry) {
//                     // Remove the shipment ID from the project
//                     projectEntry.shipments = projectEntry.shipments.filter(
//                         id => id.toString() !== shipmentId
//                     );
//                 }

//                 // Optional: Remove the entire project entry if no shipments are left
//                 // You can skip this if you want the project to persist
//                 logisticsMain.projectShipments = logisticsMain.projectShipments.filter(
//                     (proj) => proj.shipments.length > 0
//                 );

//                 await logisticsMain.save();
//                 console.log(`✅ LogisticsMainModel updated after deleting shipment: ${shipmentId}`);
//             } catch (error: any) {
//                 console.error("❌ Failed to update LogisticsMainModel after deleting shipment:", error.message);
//             }
//         });

//     } catch (err: any) {
//         return res.status(500).json({ ok: false, message: "Failed to delete shipment", error: err.message });
//     }
// };


// export const getOrganizationVehicles = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { organizationId } = req.params;

//         if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
//             return res.status(400).json({ ok: false, message: "Invalid or missing organizationId" });
//         }

//         // ✅ Populate only the vehicles, ignore projectShipments
//         const logisticsMain = await LogisticsMainModel
//             .findOne({ organizationId })
//             .populate("vehicles") // populate vehicle details
//             .select("organizationId vehicles") // restrict returned fields

//         if (!logisticsMain) {
//             return res.status(404).json({ ok: false, message: "No logistics data found for this organization" });
//         }

//         return res.status(200).json({ ok: true, data: logisticsMain });

//     } catch (err: any) {
//         console.error("❌ Error fetching organization vehicles:", err.message);
//         res.status(500).json({ ok: false, message: "Failed to fetch vehicles", error: err.message });
//     }
// };



// NEW OCNTORLLERS 



export const createShipment = async (req: Request, res: Response): Promise<any> => {
    try {

        const { projectId, organizationId ,projectName} = req.params;

        const {
            // shipmentType,
            vehicleDetails,
            origin,
            destination,
            items,
            status,
            scheduledDate,
            // assignedTo,
            notes,
            actualDeliveryTime,
            actualPickupTime
        } = req.body;


        if (!projectId || !Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ ok: false, message: "Invalid or missing projectId" });
        }

        // if (!shipmentType || !["delivery", "pickup", "transfer"].includes(shipmentType)) {
        //   return res.status(400).json({ ok: false, message: "Invalid shipmentType" });
        // }




    const prefix = projectName.substring(0, 3).toLowerCase();



      const existingShipments = await LogisticsShipmentModel.find({ organizationId });

    const existingNumbers = new Set<string>();

    for (const s of existingShipments) {
      if (s.shipmentNumber?.startsWith(prefix)) {
        const parts = s.shipmentNumber.split('-');
        if (parts.length === 2 && /^\d+$/.test(parts[1])) {
          existingNumbers.add(parts[1]);
        }
      }
    }

    // Step 3: Find next available number
    let nextNumber = 1;
    while (existingNumbers.has(nextNumber.toString().padStart(3, '0'))) {
      nextNumber++;
    }

    const shipmentNumber = `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
    
        const {
            vehicleNumber,
            vehicleType,
            driver,
            driverCharge,
            isAvailable,
            currentLocation,
        } = vehicleDetails;

        // Minimum fields check
        if (!vehicleNumber) {
            return res.status(400).json({ ok: false, message: "vehicleNumber and vehicleType required for new vehicle" });
        }


        // Create Shipment with the resolved vehicleId
        const shipment = await LogisticsShipmentModel.create({
            organizationId,
            projectId,
            shipmentNumber,
            // shipmentType,
            vehicleDetails: vehicleDetails,
            origin,
            destination,
            items,
            status,
            scheduledDate,
            // assignedTo,
            actualDeliveryTime: actualDeliveryTime || new Date(),
            actualPickupTime: actualPickupTime || new Date(),
            notes
        });

        res.status(201).json({ ok: true, data: shipment });
    }

    catch (err: any) {
        return res.status(500).json({ ok: false, message: "Failed to create shipment", error: err.message });
    }
};



export const updateShipment = async (req: Request, res: Response): Promise<any> => {
    try {
        const { shipmentId, organizationId, projectId } = req.params;
        const {
            shipmentNumber,
            // shipmentType,
            vehicleDetails,
            origin,
            destination,
            items,
            status,
            scheduledDate,
            // assignedTo,
             actualDeliveryTime,
            actualPickupTime,
            notes
        } = req.body;

        if (!Types.ObjectId.isValid(shipmentId)) {
            return res.status(400).json({ ok: false, message: "Invalid shipmentId" });
        }

        if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
            return res.status(400).json({ ok: false, message: "Invalid organizationId" });
        }

        const existingShipment = await LogisticsShipmentModel.findById(shipmentId);

        if (!existingShipment) {
            return res.status(404).json({ ok: false, message: "Shipment not found" });
        }

        const {
            vehicleNumber,
            vehicleType,
            driver,
            driverCharge,
            isAvailable,
            currentLocation,
        } = vehicleDetails;

        // SUBCASE A: Update existing vehicle (when _id is given)

        // Update only provided fields (partial update)
        if (vehicleNumber) existingShipment.vehicleDetails.vehicleNumber = vehicleNumber;
        if (vehicleType) existingShipment.vehicleDetails.vehicleType = vehicleType;
        if (driver) existingShipment.vehicleDetails.driver = driver;
        if (typeof driverCharge === "number") existingShipment.vehicleDetails.driverCharge = driverCharge;
        // if (typeof isAvailable === "boolean") existingShipment.vehicleDetails.isAvailable = isAvailable;
        // if (currentLocation) existingShipment.vehicleDetails.currentLocation = currentLocation;



        // Proceed to update the shipment

        existingShipment.organizationId = new Types.ObjectId(organizationId) || existingShipment.organizationId;
        existingShipment.projectId = new Types.ObjectId(projectId) || existingShipment.projectId;
        existingShipment.shipmentNumber = shipmentNumber || existingShipment.shipmentNumber;
        // existingShipment.shipmentType = shipmentType || existingShipment.shipmentType;
        existingShipment.origin = origin || existingShipment.origin;
        existingShipment.destination = destination || existingShipment.destination;
        existingShipment.items = items || existingShipment.items;
        existingShipment.status = status || existingShipment.status;
        existingShipment.scheduledDate = scheduledDate || existingShipment.scheduledDate;
        existingShipment.actualDeliveryTime = actualDeliveryTime || existingShipment.actualDeliveryTime;
        existingShipment.actualPickupTime = actualPickupTime || existingShipment.actualPickupTime;
        // existingShipment.assignedTo = assignedTo || existingShipment.assignedTo;
        existingShipment.notes = notes || existingShipment.notes;

        const updatedShipment = await existingShipment.save();

        // Send response immediately ✅
        res.status(200).json({ ok: true, data: updatedShipment });

    } catch (error: any) {
        return res.status(500).json({ ok: false, message: "Error updating shipment", error: error.message });
    }
};


export const deleteShipment = async (req: Request, res: Response): Promise<any> => {
    try {
        const { shipmentId, organizationId } = req.params;

        if (!Types.ObjectId.isValid(shipmentId) || !Types.ObjectId.isValid(organizationId)) {
            return res.status(400).json({ ok: false, message: "Invalid shipmentId or organizationId" });
        }

        const shipment = await LogisticsShipmentModel.findByIdAndDelete(shipmentId);

        if (!shipment) {
            return res.status(404).json({ ok: false, message: "Shipment not found" });
        }

        // Respond immediately ✅
        res.status(200).json({ ok: true, message: "Shipment deleted successfully" });

        // Remove the shipment from LogisticsMainModel.projectShipments in background ⏱
    } catch (err: any) {
        return res.status(500).json({ ok: false, message: "Failed to delete shipment", error: err.message });
    }
};




export const getAllShipments = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.query;

        if (!organizationId) {
            return res.status(400).json({ ok: false, message: "Missing organizationId" });
        }

        // Step 1: Find the LogisticsMain document for the organization
        const logisticsMain = await LogisticsShipmentModel.find({ organizationId })

        if (!logisticsMain) {
            return res.status(200).json({ ok: false, message: "No logistics data found", data: [] });
        }

        // ✅ Return only required fields
        return res.status(200).json({
            ok: true,
            data: logisticsMain
        });

    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Failed to fetch shipments", error: err.message });
    }
};


