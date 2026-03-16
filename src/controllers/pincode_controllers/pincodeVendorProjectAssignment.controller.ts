import { Request, Response } from "express";
import { COMPANY_NAME } from "../stage controllers/ordering material controller/pdfOrderHistory.controller";
import { PincodeVendorProjectAssignment } from "../../models/Pincode_models/PincodeVendorProjectAssign.model";
import ProjectModel from "../../models/project model/project.model";
import ExecutionPartnerModel from "../../models/Department Models/Accounting Model/executionPartner.model";

// 1. CREATE Assignment (With T&C Generation)
export const createAssignment = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, projectId, partnerId, customTerms, notes } = req.body;

        if (!organizationId || !projectId || !partnerId) {
            return res.status(400).json({ ok: false, message: "Missing required fields" });
        }

        // Fetch vendor details to personalize the T&C
        const vendor = await ExecutionPartnerModel.findById(partnerId);
        if (!vendor) return res.status(404).json({ ok: false, message: "partner not found" });

        // Dynamic T&C Generation Logic
        const generatedTerms = customTerms || `
            LEGAL AGREEMENT - ${COMPANY_NAME}
            Partner: ${vendor.companyName}
            Date: ${new Date().toLocaleDateString()}
            
            1. Scope: The vendor agrees to execute Project ID: ${projectId}.
            2. Payment: Based on terms: ${vendor.paymentTerms || "Standard"}.
            3. Warranty: Vendor must provide service support.
            4. Timeline: Work must commence within 48 hours of digital acceptance.
        `;

        const newAssignment = new PincodeVendorProjectAssignment({
            organizationId,
            projectId,
            partnerId,
            termsAndConditions: generatedTerms,
            status: "pending",
            notes
        });

        await newAssignment.save()

        return res.status(201).json({
            ok: true,
            message: "Project assigned to vendor. Pending acknowledgement.",
            data: newAssignment
        });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: "Error assigning project", error: error.message });
    }
};

// 2. UPDATE Assignment (Handling E-Signature/Acknowledgement)
export const updateAssignmentStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { status, notes, partnerId, projectId } = req.body;

        // Capture security data for legal proof
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || "0.0.0.0";

        const updateData: any = { status, notes , projectId, partnerId};

        // If vendor is accepting, record the digital signature
        if (status === "accepted") {
            updateData.acknowledgedAt = new Date();
            updateData.ipAddress = Array.isArray(ipAddress) ? ipAddress[0] : ipAddress;
        }

        const updated = await PincodeVendorProjectAssignment.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        if (!updated) return res.status(404).json({ ok: false, message: "Assignment not found" });

        return res.status(200).json({ ok: true, message: `Assignment ${status}`, data: updated });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: "Error updating assignment", error: error.message });
    }
};
// 3. GET ALL Assignments (With Search, Date Filters, and Pagination)
export const getAllAssignments = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            organizationId,
            page = 1,
            limit = 10,
            search,
            status,
            startDate,
            projectId,
            partnerId,
            endDate
        } = req.query;

        // 1. Build the base filter
        let filter: any = { organizationId };

        // // 2. Date Range Filtering (createdAt)
        // if (startDate || endDate) {
        //     filter.createdAt = {};
        //     if (startDate) filter.createdAt.$gte = new Date(startDate as string);
        //     if (endDate) filter.createdAt.$lte = new Date(endDate as string);
        // }


        if (projectId) filter.projectId = projectId;
        if (partnerId) filter.partnerId = partnerId;

        

        // 2. Date Range Filtering (createdAt)
        if (startDate || endDate) {
            const dateFilter: any = {};

            if (startDate) {
                const from = new Date(startDate as string);
                if (isNaN(from.getTime())) {
                    return res.status(400).json({
                        ok: false,
                        message: "Invalid startDate format. Use ISO string (e.g. 2025-10-23)."
                    });
                }
                // Set to 00:00:00:000 to include the entire start day
                from.setHours(0, 0, 0, 0);
                dateFilter.$gte = from;
            }

            if (endDate) {
                const to = new Date(endDate as string);
                if (isNaN(to.getTime())) {
                    return res.status(400).json({
                        ok: false,
                        message: "Invalid endDate format. Use ISO string (e.g. 2025-10-23)."
                    });
                }
                // Set to 23:59:59:999 to include the entire end day
                to.setHours(23, 59, 59, 999);
                dateFilter.$lte = to;
            }

            filter.createdAt = dateFilter;
        }

        // 3. Pagination Logic
        const skip = (Number(page) - 1) * Number(limit);

        if (status) {
            filter.acknowledgeStatus = status;
        }

        // 4. Advanced Search Logic
        // Since we are searching across Populated fields, we find IDs first if search exists
        if (search) {
            const searchRegex = new RegExp(search as string, 'i');

            // Find Vendors or Projects that match the search string
            const [matchingVendors, matchingProjects] = await Promise.all([
                ExecutionPartnerModel.find({
                    $or: [
                        { companyName: searchRegex },
                        { firstName: searchRegex }
                    ]
                }).select('_id firstName companyName'),
                ProjectModel.find({ projectName: searchRegex }).select('_id projectName')
            ]);

            const partnerIds = matchingVendors.map(v => v._id);
            const projectIds = matchingProjects.map(p => p._id);

            // Filter assignments that belong to either matching vendors or matching projects
            filter.$or = [
                { partnerId: { $in: partnerIds } },
                { projectId: { $in: projectIds } }
            ];
        }

        // 5. Execute Query
        const [data, total] = await Promise.all([
            PincodeVendorProjectAssignment.find(filter)
                .populate("partnerId", "_id companyName firstName email phone")
                .populate("projectId", "_id projectName")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            PincodeVendorProjectAssignment.countDocuments(filter)
        ]);

        return res.status(200).json({
            ok: true,
            count: data.length,
            data,
            pagination: {
                total,
                currentPage: Number(page),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error: any) {
        console.error("Error in getAllAssignments:", error);
        return res.status(500).json({ ok: false, message: "Error fetching assignments", error: error.message });
    }
};

// 4. GET SINGLE Assignment (For Vendor Portal)
export const getSingleAssignment = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const data = await PincodeVendorProjectAssignment.findById(id)
            .populate("partnerId")
            .populate("projectId");

        if (!data) return res.status(404).json({ ok: false, message: "Record not found" });

        return res.status(200).json({ ok: true, data });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: "Error fetching record", error: error.message });
    }
};

// 5. DELETE Assignment
export const deleteAssignment = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const deleted = await PincodeVendorProjectAssignment.findByIdAndDelete(id);

        if (!deleted) return res.status(404).json({ ok: false, message: "Record not found" });

        return res.status(200).json({ ok: true, message: "Assignment deleted successfully" });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: "Error deleting assignment", error: error.message });
    }
};



// PUBLIC CONTROLLER

// 1. GET Public Assignment Data (No Auth)
export const getPublicAssignment = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const data = await PincodeVendorProjectAssignment.findById(id)
            .populate("partnerId", "companyName firstName")
            .populate("projectId", "projectName");

        if (!data) return res.status(404).json({ ok: false, message: "Link invalid or expired" });

        return res.status(200).json({ ok: true, data });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: "Server error", error: error.message });
    }
};

// 2. SUBMIT Acknowledgement (No Auth, Strict Lock)
export const acceptPublicAssignment = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || "0.0.0.0";

        // Check if already accepted
        const existing = await PincodeVendorProjectAssignment.findById(id);
        if (!existing) return res.status(404).json({ ok: false, message: "Record not found" });

        if (existing.acknowledgeStatus === "accepted") {
            return res.status(400).json({ ok: false, message: "This assignment has already been accepted and cannot be modified." });
        }

        const updated = await PincodeVendorProjectAssignment.findByIdAndUpdate(
            id,
            {
                $set: {
                    acknowledgeStatus: "accepted",
                    status: "accepted", // Update main status too
                    acknowledgedAt: new Date(),
                    ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
                }
            },
            { new: true }
        );

        return res.status(200).json({ ok: true, message: "Acknowledgement successful", data: updated });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: "Submission failed", error: error.message });
    }
};