import { Response } from "express";
import PincodeMasterModel from "../../models/Pincode_models/pincodeMaster.model";

// 1. CREATE Pincode Record
export const createPincode = async (req: any, res: Response): Promise<any> => {
    try {
        // Destructuring to ensure we only use allowed fields [cite: 76]
        const {
            organizationId,
            pincode,
            areaName,
            localityName,
            taluk,
            district,
            zone,
            state,
            latitude,
            longitude,
            urbanClassification,
            serviceStatus,
            serviceMode,
            approvalRequired,
            minOrderValue,
            directMarginPercent,
            partnerMarginPercent,
            transportFactor,
            installFactor,
            serviceFactor,
            complexityFactor,
            riskLevel,
            notes,
            vendors
        } = req.body;

        // Basic validation for required fields
        if (!organizationId || !pincode) {
            return res.status(400).json({ ok: false, message: "Organization ID and Pincode are required" });
        }

        const newPincode = await PincodeMasterModel.create({
            organizationId,
            pincode,
            areaName: areaName?.trim(),
            localityName: localityName?.trim(),
            taluk: taluk?.trim(),
            district: district || null,
            zone: zone || null,
            state: state || "Tamil Nadu",
            latitude,
            longitude,
            urbanClassification: urbanClassification || "Urban",
            serviceStatus: serviceStatus || "Active",
            serviceMode: serviceMode || "Direct Core",
            approvalRequired: approvalRequired || false,
            minOrderValue: minOrderValue || 0,
            directMarginPercent: directMarginPercent || 0,
            partnerMarginPercent: partnerMarginPercent || 0,
            transportFactor: transportFactor || 1.0,
            installFactor: installFactor || 1.0,
            serviceFactor: serviceFactor || 1.0,
            complexityFactor: complexityFactor || 1.0,
            riskLevel: riskLevel || "Low",
            notes: notes || null,
            lastReviewedAt: new Date(),
            vendors: vendors || [],
        });

        return res.status(201).json({
            ok: true,
            message: "Pincode record created successfully",
            data: newPincode
        });
    } catch (error: any) {
        console.error("Error creating pincode:", error);
        return res.status(500).json({ ok: false, message: "Error creating pincode", error: error.message });
    }
};

// 2. GET ALL Pincodes (with Pagination)
export const getAllPincodes = async (req: any, res: Response): Promise<any> => {
    try {
        const { organizationId,
            search,
            startDate,
            endDate,
            urbanClassification,
            serviceStatus } = req.query;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const query: any = {};
        if (organizationId) query.organizationId = organizationId;

        // 2. Date Range Filter (based on creation/review date) 
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate as string);
            if (endDate) query.createdAt.$lte = new Date(endDate as string);
        }

        // 3. Global Search (Pincode, Area, Locality, Taluk, State) [cite: 79-85]
        if (search) {
            const searchRegex = new RegExp(search as string, 'i');
            query.$or = [
                { pincode: searchRegex },
                { areaName: searchRegex },
                { localityName: searchRegex },
                { taluk: searchRegex },
                { state: searchRegex }
            ];
        }

        // 4. Specific Business Filters [cite: 87, 95]
        if (urbanClassification) query.urbanClassification = urbanClassification;
        if (serviceStatus) query.serviceStatus = serviceStatus;

        // Fetching records with pagination and population for IDs [cite: 83, 84]
        const [pincodes, totalCount] = await Promise.all([
            PincodeMasterModel.find(query)
                // .populate("districtId zoneId reviewedBy")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            PincodeMasterModel.countDocuments(query)
        ]);

        return res.status(200).json({
            ok: true,
            data: pincodes,
            pagination: {
                totalCount,
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                hasNextPage: skip + pincodes.length < totalCount
            }
        });
    } catch (error: any) {
        console.error("Error fetching pincodes:", error);
        return res.status(500).json({ ok: false, message: "Error fetching pincodes", error: error.message });
    }
};

// 3. GET SINGLE Pincode Record
export const getSinglePincode = async (req: any, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // const pincode = await PincodeMasterModel.findById(id)
        const pincode = await PincodeMasterModel.findById(id)
            .populate({
                path: 'vendors.vendorId', // Path to the field inside the array
                select: 'companyName firstName vendorName email phone vendorGrade' // Fields you want to show
            })
        // .populate("districtId zoneId reviewedBy");

        if (!pincode) {
            return res.status(404).json({ ok: false, message: "Pincode record not found" });
        }

        return res.status(200).json({ ok: true, data: pincode });
    } catch (error: any) {
        console.error("Error fetching single pincode:", error);
        return res.status(500).json({ ok: false, message: "Error fetching pincode record", error: error.message });
    }
};

// 4. UPDATE Pincode Record
export const updatePincode = async (req: any, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Destructure incoming updates to prevent unauthorized field injection
        const {
            pincode,
            areaName,
            localityName,
            taluk,
            district,
            zone,
            state,
            latitude,
            longitude,
            urbanClassification,
            activeStatus,
            serviceStatus,
            serviceMode,
            approvalRequired,
            minOrderValue,
            directMarginPercent,
            partnerMarginPercent,
            transportFactor,
            installFactor,
            serviceFactor,
            complexityFactor,
            riskLevel,
            notes,
            reviewedBy,
            vendors: vendors,
        } = req.body;

        const updatedPincode = await PincodeMasterModel.findByIdAndUpdate(
            id,
            {
                $set: {
                    pincode,
                    areaName,
                    localityName,
                    taluk,
                    district,
                    zone,
                    state,
                    latitude,
                    longitude,
                    urbanClassification,
                    activeStatus,
                    serviceStatus,
                    serviceMode,
                    approvalRequired,
                    minOrderValue,
                    directMarginPercent,
                    partnerMarginPercent,
                    transportFactor,
                    installFactor,
                    serviceFactor,
                    complexityFactor,
                    riskLevel,
                    notes,
                    reviewedBy,
                    lastReviewedAt: new Date(), // 
                    vendors: vendors,
                }
            },
            { new: true, runValidators: true }
        );

        if (!updatedPincode) {
            return res.status(404).json({ ok: false, message: "Pincode record not found to update" });
        }

        return res.status(200).json({
            ok: true,
            message: "Pincode record updated successfully",
            data: updatedPincode
        });
    } catch (error: any) {
        console.error("Error updating pincode:", error);
        return res.status(500).json({ ok: false, message: "Error updating pincode", error: error.message });
    }
};

// 5. DELETE Pincode Record
export const deletePincode = async (req: any, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        const deletedPincode = await PincodeMasterModel.findByIdAndDelete(id);

        if (!deletedPincode) {
            return res.status(404).json({ ok: false, message: "Pincode record not found" });
        }

        return res.status(200).json({ ok: true, message: "Pincode record deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting pincode:", error);
        return res.status(500).json({ ok: false, message: "Error deleting pincode", error: error.message });
    }
};