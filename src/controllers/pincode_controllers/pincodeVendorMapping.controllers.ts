import { Response } from "express";
import { Types } from "mongoose";
import PincodeVendorMappingModel from "../../models/Pincode_models/pincodeVendorMapping.model";

// 1. CREATE Vendor-Pincode Mapping
export const createMapping = async (req: any, res: Response): Promise<any> => {
    try {
        // Destructuring incoming fields to follow the specific mapping logic [cite: 284-301]
        const {
            organizationId,
            vendorId,
            pincodeId,
            vendorRole,
            serviceMode,
            priorityRank,
            minOrderValue,
            maxProjectValue,
            rateMultiplier,
            travelRule,
            serviceVisitRule,
            siteVisitSlaDays,
            installSlaDays,
            complaintSlaHours,
            premiumJobAllowed,
            repairJobAllowed,
            activeStatus,
            notes
        } = req.body;

        // Validation for mandatory links [cite: 286, 287]
        if (!vendorId || !pincodeId) {
            return res.status(400).json({ 
                ok: false, 
                message: "Vendor ID and Pincode ID are required to create a mapping" 
            });
        }

        const newMapping = await PincodeVendorMappingModel.create({
            organizationId,
            vendorId,
            pincodeId,
            vendorRole: vendorRole || "Primary", // 
            serviceMode: serviceMode || "Direct", // [cite: 288]
            priorityRank: priorityRank || 1,
            minOrderValue: minOrderValue || 0, // [cite: 298]
            maxProjectValue: maxProjectValue || 0, // [cite: 299]
            rateMultiplier: rateMultiplier || 1.0, // [cite: 296]
            travelRule: travelRule || null, // [cite: 297]
            serviceVisitRule: serviceVisitRule || null,
            siteVisitSlaDays: siteVisitSlaDays || 2, // [cite: 293]
            installSlaDays: installSlaDays || 15, // [cite: 294]
            complaintSlaHours: complaintSlaHours || 48, // [cite: 295]
            premiumJobAllowed: premiumJobAllowed || false, // [cite: 300]
            repairJobAllowed: repairJobAllowed || true, // [cite: 306]
            activeStatus: activeStatus !== undefined ? activeStatus : true, // [cite: 307]
            notes: notes || null // [cite: 308]
        });

        return res.status(201).json({
            ok: true,
            message: "Vendor mapped to pincode successfully",
            data: newMapping
        });
    } catch (error: any) {
        console.error("Error creating mapping:", error);
        return res.status(500).json({ ok: false, message: "Error creating mapping", error: error.message });
    }
};

// 2. GET ALL Mappings (with Pagination & Search Filters)
export const getAllMappings = async (req: any, res: Response): Promise<any> => {
    try {
        // const { vendorId, pincodeId, vendorRole, serviceMode } = req.query;
        const { 
            organizationId,
            vendorId, 
            vendorRole, 
            serviceMode, 
            pincodeId,
            startDate, 
            endDate ,
            search
        } = req.query;

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

       const query: any = {};

        if (organizationId) query.organizationId = organizationId;


        // 1. Vendor ID Filter (Mongoose ID check) [cite: 287]
        if (vendorId && Types.ObjectId.isValid(vendorId as string)) {
            query.vendorId = new Types.ObjectId(vendorId as string);
        }

        // 2. Pincode ID Filter [cite: 286]
        if (pincodeId && Types.ObjectId.isValid(pincodeId as string)) {
            query.pincodeId = new Types.ObjectId(pincodeId as string);
        }

        // 3. Enum Business Filters [cite: 288, 289]
        if (vendorRole) {
            query.vendorRole = vendorRole;
        }
        if (serviceMode) {
            query.serviceMode = serviceMode;
        }

        // 4. Date Range Filter (based on when mapping was created/updated)
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate as string);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate as string);
            }
        }

        const [mappings, totalCount] = await Promise.all([
            PincodeVendorMappingModel.find(query)
                .populate("vendorId pincodeId") // [cite: 400, 412]
                .sort({ priorityRank: 1 }) // Show primary vendors first
                .skip(skip)
                .limit(limit),
            PincodeVendorMappingModel.countDocuments(query)
        ]);

        return res.status(200).json({
            ok: true,
            data: mappings,
            pagination: {
                totalCount,
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                hasNextPage: skip + mappings.length < totalCount
            }
        });
    } catch (error: any) {
        console.error("Error fetching mappings:", error);
        return res.status(500).json({ ok: false, message: "Error fetching mappings", error: error.message });
    }
};

// 3. GET SINGLE Mapping
export const getSingleMapping = async (req: any, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        const mapping = await PincodeVendorMappingModel.findById(id).populate("vendorId pincodeId");

        if (!mapping) {
            return res.status(404).json({ ok: false, message: "Mapping not found" });
        }

        return res.status(200).json({ ok: true, data: mapping });
    } catch (error: any) {
        console.error("Error fetching single mapping:", error);
        return res.status(500).json({ ok: false, message: "Error fetching mapping details", error: error.message });
    }
};

// 4. UPDATE Mapping
export const updateMapping = async (req: any, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Destructure only updated fields to prevent overwriting vendorId/pincodeId accidentally
        const {
            vendorRole,
            serviceMode,
            priorityRank,
            minOrderValue,
            maxProjectValue,
            rateMultiplier,
            travelRule,
            serviceVisitRule,
            siteVisitSlaDays,
            installSlaDays,
            complaintSlaHours,
            premiumJobAllowed,
            repairJobAllowed,
            activeStatus,
            notes
        } = req.body;

        const updatedMapping = await PincodeVendorMappingModel.findByIdAndUpdate(
            id,
            {
                $set: {
                    vendorRole,
                    serviceMode,
                    priorityRank,
                    minOrderValue,
                    maxProjectValue,
                    rateMultiplier,
                    travelRule,
                    serviceVisitRule,
                    siteVisitSlaDays,
                    installSlaDays,
                    complaintSlaHours,
                    premiumJobAllowed,
                    repairJobAllowed,
                    activeStatus,
                    notes
                }
            },
            { new: true, runValidators: true }
        );

        if (!updatedMapping) {
            return res.status(404).json({ ok: false, message: "Mapping record not found" });
        }

        return res.status(200).json({
            ok: true,
            message: "Mapping updated successfully",
            data: updatedMapping
        });
    } catch (error: any) {
        console.error("Error updating mapping:", error);
        return res.status(500).json({ ok: false, message: "Error updating mapping", error: error.message });
    }
};

// 5. DELETE Mapping
export const deleteMapping = async (req: any, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        const deletedMapping = await PincodeVendorMappingModel.findByIdAndDelete(id);

        if (!deletedMapping) {
            return res.status(404).json({ ok: false, message: "Mapping record not found" });
        }

        return res.status(200).json({ ok: true, message: "Vendor-pincode mapping removed successfully" });
    } catch (error: any) {
        console.error("Error deleting mapping:", error);
        return res.status(500).json({ ok: false, message: "Error deleting mapping", error: error.message });
    }
};