// logistics.controller.ts
import { Request, Response } from "express";
import { Types } from "mongoose";
import { LogisticsShipmentModel } from "../../../models/Department Models/Logistics Model/logistics.model";
import { createAccountingEntry } from "../Accounting Controller/accounting.controller";
import { SocketService } from "../../../config/socketService";
import crypto  from 'crypto';

export const createShipmentUtil = async ({ organizationId, projectId,
    projectName,
    vehicleDetails,
    origin = {},
    destination = {},
    items,
    status,
    scheduledDate = new Date(),
    notes,
    actualDeliveryTime,
    actualPickupTime
}: {
    organizationId: string | Types.ObjectId;
    projectId: string | Types.ObjectId;
    projectName: string;
    vehicleDetails?: any; // optional
    origin?: any;
    destination?: any;
    items?: any[];
    status?: string;
    scheduledDate?: Date;
    notes?: string;
    actualDeliveryTime?: Date;
    actualPickupTime?: Date;
}) => {
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

    // const {
    //     vehicleNumber,
    //     vehicleType,
    //     driver,
    //     driverCharge,
    //     isAvailable,
    //     currentLocation,
    // } = vehicleDetails;

    // // Minimum fields check
    // if (!vehicleNumber) {
    //     throw new Error("vehicleNumber  is required");
    // }

     // ✅ Generate unique tracking token
    const generateTrackingToken = () => {
        // Generate random 32-character hex string
        const randomPart = crypto.randomBytes(16).toString('hex');
        return `TRK-${randomPart}`;
        // Example output: TRK-8a7f3c9b2e1d4f6a5b8c9d0e1f2a3b4c
    };

    // ✅ Ensure token is unique (very unlikely to collide, but safe check)
    let token = generateTrackingToken();
    let tokenExists = await LogisticsShipmentModel.findOne({ organizationId, token });
    
    while (tokenExists) {
        token = generateTrackingToken();
        tokenExists = await LogisticsShipmentModel.findOne({ organizationId, token });
    }

// const trackingId = `${prefix}-${nextNumber.toString().padStart(3, '0')}`
    // Create Shipment with the resolved vehicleId
    const shipment = await LogisticsShipmentModel.create({
        organizationId,
        projectId,
        shipmentNumber,
        vehicleDetails: vehicleDetails,
        origin,
        destination,
        items,
        status,
        scheduledDate,
        actualDeliveryTime,
        actualPickupTime,
        notes,
        // trackingId: null,
        token: null
    });

    return shipment
}


export const createShipment = async (req: Request, res: Response): Promise<any> => {
    try {

        const { projectId, organizationId, projectName } = req.params;

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

        const shipment = await createShipmentUtil({
            organizationId,
            projectId,
            projectName,
            vehicleDetails,
            origin,
            destination,
            items,
            status,
            scheduledDate,
            notes,
            actualDeliveryTime,
            actualPickupTime,

        })




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
            shipmentStatus,
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
            driverUpiId,
            isAvailable,
            currentLocation,
        } = vehicleDetails;

        // SUBCASE A: Update existing vehicle (when _id is given)
        // Update only provided fields (partial update)

        if (vehicleNumber) existingShipment.vehicleDetails.vehicleNumber = vehicleNumber;
        if (vehicleType) existingShipment.vehicleDetails.vehicleType = vehicleType;
        if (driver) existingShipment.vehicleDetails.driver = driver;
        if (driverCharge) existingShipment.vehicleDetails.driverCharge = driverCharge;
        if (typeof driverUpiId === "string") existingShipment.vehicleDetails.driverUpiId = driverUpiId;
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
        existingShipment.shipmentStatus = shipmentStatus || existingShipment.shipmentStatus;
        existingShipment.scheduledDate = scheduledDate || existingShipment.scheduledDate;
        existingShipment.actualDeliveryTime = actualDeliveryTime || existingShipment.actualDeliveryTime;
        existingShipment.actualPickupTime = actualPickupTime || existingShipment.actualPickupTime;
        // existingShipment.assignedTo = assignedTo || existingShipment.assignedTo;
        existingShipment.notes = notes || existingShipment.notes;


        // ✅ ADD THIS BLOCK - Check if status changed to delivered/cancelled
        const previousStatus = existingShipment.shipmentStatus;
        const newStatus = shipmentStatus;

        if (newStatus === "delivered" && previousStatus !== "delivered") {
            existingShipment.actualDeliveryTime = new Date();

            // ✅ EMIT TRACKING STOPPED
            await SocketService.emitTrackingStopped(
                existingShipment.organizationId.toString(),
                {
                    shipmentId: existingShipment._id.toString(),
                    shipmentNumber: existingShipment.shipmentNumber || "",
                    status: 'delivered',
                    finalLocation: existingShipment.currentLocation
                }
            );
        }

        if (newStatus === "cancelled" && previousStatus !== "cancelled") {
            // ✅ EMIT TRACKING STOPPED
            await SocketService.emitTrackingStopped(
                existingShipment.organizationId.toString(),
                {
                    shipmentId: existingShipment._id.toString(),
                    shipmentNumber: existingShipment.shipmentNumber || "",
                    status: 'cancelled'
                }
            );
        }




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
        const { organizationId, status, scheduledDate, projectId } = req.query;

        if (!organizationId) {
            return res.status(400).json({ ok: false, message: "Missing organizationId" });
        }

        const filters: any = { organizationId };

        if (status) filters.status = status;
        if (projectId) filters.projectId = projectId;

        // ✅ Handle scheduledDate (exact date match or range)
        if (scheduledDate) {
            const date = new Date(scheduledDate as string);

            // Create a range for that day: start -> end
            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            const endOfDay = new Date(date.setHours(23, 59, 59, 999));

            filters.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
        }


        // Step 1: Find the LogisticsMain document for the organization
        const logisticsMain = await LogisticsShipmentModel.find(filters)

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

export const getSingleLogisticsShipment = async (req: Request, res: Response): Promise<any> => {
    try {
        const { shipmentId } = req.params;

        const shipment = await LogisticsShipmentModel.findById(shipmentId)

        if (!shipment) {
            return res.status(404).json({ message: "Shipment not found", ok: false });
        }

        res.status(200).json({ data: shipment, ok: true });
    } catch (error: any) {
        console.error("Error fetching shipment:", error);
        res.status(500).json({ message: "Internal server error", ok: false });
    }
};


// TRACKING 

export const updateDriverLocation = async (req: Request, res: Response): Promise<any> => {
    try {
        const { shipmentId } = req.params;
        const { latitude, longitude } = req.body;

        if (!shipmentId || !Types.ObjectId.isValid(shipmentId)) {
            return res.status(400).json({ ok: false, message: "Invalid shipmentId" });
        }

        if (!latitude || !longitude) {
            return res.status(400).json({ ok: false, message: "latitude and longitude are required" });
        }

        const shipment = await LogisticsShipmentModel.findById(shipmentId);

        if (!shipment) {
            return res.status(404).json({ ok: false, message: "Shipment not found" });
        }

        // Check if shipment is active
        if (!["in_transit", "pickedup"].includes(shipment.shipmentStatus || "")) {
            return res.status(400).json({
                ok: false,
                message: "Cannot track - shipment is not active"
            });
        }

        const now = new Date();

        // Update current location
        shipment.currentLocation = {
            latitude,
            longitude,
            updatedAt: now
        };

        shipment.lastLocationUpdate = now;

        // Add to location history
        shipment.locationHistory.push({
            latitude,
            longitude,
            timestamp: now
        });

        await shipment.save();

        // ✅ EMIT TO WEBSOCKET using SocketService
        await SocketService.emitLocationUpdate(
            shipment.organizationId.toString(),
            {
                shipmentId: shipment._id.toString(),
                latitude,
                longitude,
                updatedAt: now,
                shipmentStatus: shipment.shipmentStatus || "",
                vehicleDetails: shipment.vehicleDetails,
                shipmentNumber: shipment.shipmentNumber || ""
            }
        );

        return res.status(200).json({
            ok: true,
            message: "Location updated successfully",
            data: {
                currentLocation: shipment.currentLocation,
                shipmentStatus: shipment.shipmentStatus
            }
        });

    } catch (err: any) {
        console.error("Error updating driver location:", err);
        return res.status(500).json({
            ok: false,
            message: "Failed to update location",
            error: err.message
        });
    }
};


// ============================================
// 🚀 Start Tracking
// ============================================
export const startTracking = async (req: Request, res: Response): Promise<any> => {
    try {
        const { shipmentId } = req.params;

        if (!shipmentId || !Types.ObjectId.isValid(shipmentId)) {
            return res.status(400).json({ ok: false, message: "Invalid shipmentId" });
        }

        const shipment = await LogisticsShipmentModel.findById(shipmentId);

        if (!shipment) {
            return res.status(404).json({ ok: false, message: "Shipment not found" });
        }

        // Generate tracking ID if not exists
        // if (!shipment.trackingId) {
        //     shipment.trackingId = `TRK-${shipmentId.toString().slice(-8).toUpperCase()}`;
        // }

        // Update status to in_transit if it was pending/assigned
        if (shipment.shipmentStatus === "pending" || shipment.shipmentStatus === "assigned") {
            shipment.shipmentStatus = "pickedup";
            shipment.actualPickupTime = new Date();
        }

        await shipment.save();

        // ✅ EMIT TRACKING STARTED
        await SocketService.emitTrackingStarted(
            shipment.organizationId.toString(),
            {
                shipmentId: shipment._id.toString(),
                // trackingId: shipment.trackingId.toString(),
                shipmentNumber: shipment.shipmentNumber || "",
                vehicleDetails: shipment.vehicleDetails,
                destination: shipment.destination
            }
        );

        return res.status(200).json({
            ok: true,
            message: "Tracking started",
            data: {
                // trackingId: shipment.trackingId,
                shipmentId: shipment._id,
                status: shipment.shipmentStatus
            }
        });

    } catch (err: any) {
        console.error("Error starting tracking:", err);
        return res.status(500).json({
            ok: false,
            message: "Failed to start tracking",
            error: err.message
        });
    }
};


// ============================================
// 🚀 Get Active Shipments with Location
// ============================================
export const getActiveShipmentsWithLocation = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, projectId } = req.query;

        if (!organizationId) {
            return res.status(400).json({ ok: false, message: "organizationId is required" });
        }

        const filters: any = {
            organizationId,
            shipmentStatus: { $in: ["in_transit", "pickedup"] }
        };

        if (projectId) {
            filters.projectId = projectId;
        }

        const activeShipments = await LogisticsShipmentModel.find(filters)
            .select('shipmentNumber currentLocation lastLocationUpdate vehicleDetails destination origin shipmentStatus eta trackingId')
            .lean();

        // ✅ OPTIONAL: Send bulk update via WebSocket when dashboard requests
        if (activeShipments.length > 0) {
            const shipmentData = activeShipments.map(s => ({
                shipmentId: s._id.toString(),
                currentLocation: s.currentLocation || { latitude: 0, longitude: 0, updatedAt: new Date() },
                shipmentStatus: s.shipmentStatus || "",
                shipmentNumber: s.shipmentNumber || ""
            }));

            await SocketService.emitBulkLocationUpdate(
                organizationId.toString(),
                shipmentData
            );
        }

        return res.status(200).json({
            ok: true,
            data: activeShipments,
            count: activeShipments.length
        });

    } catch (err: any) {
        console.error("Error fetching active shipments:", err);
        return res.status(500).json({
            ok: false,
            message: "Failed to fetch active shipments",
            error: err.message
        });
    }
};


// ============================================
// 🚀 Get Shipment Route History
// ============================================
export const getShipmentRouteHistory = async (req: Request, res: Response): Promise<any> => {
    try {
        const { shipmentId } = req.params;

        if (!shipmentId || !Types.ObjectId.isValid(shipmentId)) {
            return res.status(400).json({ ok: false, message: "Invalid shipmentId" });
        }

        const shipment = await LogisticsShipmentModel.findById(shipmentId)
            .select('shipmentNumber locationHistory currentLocation origin destination vehicleDetails shipmentStatus')
            .lean();

        if (!shipment) {
            return res.status(404).json({ ok: false, message: "Shipment not found" });
        }

        return res.status(200).json({
            ok: true,
            data: {
                shipmentNumber: shipment.shipmentNumber,
                currentLocation: shipment.currentLocation,
                locationHistory: shipment.locationHistory,
                origin: shipment.origin,
                destination: shipment.destination,
                vehicleDetails: shipment.vehicleDetails,
                shipmentStatus: shipment.shipmentStatus
            }
        });

    } catch (err: any) {
        console.error("Error fetching route history:", err);
        return res.status(500).json({
            ok: false,
            message: "Failed to fetch route history",
            error: err.message
        });
    }
};




// public


// Get shipment by token (public endpoint - no auth needed)
export const getShipmentByToken = async (req: Request, res: Response): Promise<any> => {
    try {
        const { token } = req.params;

        const shipment = await LogisticsShipmentModel.findOne({ token })
            .select('shipmentNumber organizationId destination origin vehicleDetails shipmentStatus currentLocation eta items');

        if (!shipment) {
            return res.status(404).json({ 
                ok: false, 
                message: "Invalid or expired tracking link" 
            });
        }

        // ✅ Check if shipment is already delivered (optional: disable tracking)
        if (shipment.shipmentStatus === 'delivered' || shipment.shipmentStatus === 'cancelled') {
            return res.status(400).json({ 
                ok: false, 
                message: "This shipment has already been completed" 
            });
        }

        return res.status(200).json({
            ok: true,
            data: shipment
        });
    } catch (err: any) {
        return res.status(500).json({ 
            ok: false, 
            message: "Failed to fetch shipment", 
            error: err.message 
        });
    }
};



export const SyncAccountingFromLogistics = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, projectId } = req.params;
        const { totalCost, upiId } = req.body;

        if (!organizationId || !projectId) {
            return res.status(400).json({ ok: false, message: "OrganizationId and  ProjectId is required" });
        }

        const doc = await createAccountingEntry({
            organizationId,
            projectId,
            fromDept: "logistics",
            totalCost,
            upiId,
        });

        res.status(201).json({ ok: true, data: doc });
    } catch (err: any) {
        console.error("Error sending logistics entry to accounting:", err);
        res.status(500).json({ ok: false, message: err.message });
    }
}