import { Response } from "express";
import { AuthenticatedUserRequest } from "../../types/types";
import UserModel from "../../models/usermodel/user.model";
import bcrypt from 'bcrypt';
import OrganizationModel from "../../models/organization models/organization.model";
import StaffModel from "../../models/staff model/staff.model";

const createOrganziation = async (req: AuthenticatedUserRequest, res: Response) => {
    try {

        let user = req.user
        const { organizationName, type, address, logoUrl, organizationPhoneNo } = req.body;


        if (!organizationName) {
            res.status(400).json({ message: "Organization name is required", ok: false });
            return
        }

        // 2. Create Organization
        const organization = await OrganizationModel.create({
            organizationName,
            type: type || null,
            address: address || null,
            logoUrl: logoUrl || null,
            organizationPhoneNo: organizationPhoneNo || null,
            userId:user._id
        });

        if (!organization) {
            res.status(404).json({ message: "organization not created successfully", ok: false })
            return
        }

        const existingUser = await UserModel.findByIdAndUpdate(user._id, { $push: {organizationId: organization._id} }, { returnDocument: "after" })

        if (!existingUser) {
            res.status(404).json({ message: "user not found", ok: false })
            return
        }

        return res.status(201).json({
            message: "Organization successfully",
            data: organization,
            ok:true
        });
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("Error from create organization:", error);
            res.status(500).json({ message: "Server error", ok: false, error: error.message });
            return
        }
    }
}


const getMyOrganizations = async (req: AuthenticatedUserRequest, res: Response) => {
    try {
        const user = req.user;

        if (!user || user.organization) {
            res.status(404).json({ message: "No organization linked", data:{}, ok: false });
            return
        }

        const organization = await OrganizationModel.find({userId: user._id});

        if (!organization) {
            res.status(200).json({ message: "No organizations  found", ok: false, data: {} });
            return
        }

         res.status(200).json({ ok: true, message:"fetched successfully", data: organization });
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error in getMyOrganizations:", error);
            return res.status(500).json({ message: "Server error", ok: false, error: error.message });
        }
    }
};


const getOrganizationById = async (req: AuthenticatedUserRequest, res: Response) => {
    try {
        const user = req.user;
        const {orgs} = req.params
        
        if (!user) {
            res.status(404).json({ message: "No organization linked", ok: false });
            return
        }

         if (!orgs) {
            res.status(404).json({ message: "No organization id provided",  ok: false });
            return
        }

        const organization = await OrganizationModel.findById(orgs);

        if (!organization) {
            res.status(200).json({ message: "No organization  found", ok: false, data: {} });
            return
        }

        return res.status(200).json({ ok: true, message:"fetched successfully", data: organization });
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error in get organization by id:", error);
            return res.status(500).json({ message: "Server error", ok: false, error: error.message });
        }
    }
};


const updateOrganizationName = async (req: AuthenticatedUserRequest, res: Response) => {
    try {
        const user = req.user;
        const { organizationName } = req.body;

        const {orgId} = req.params

        if (!user || !user.organization) {
            res.status(404).json({ message: "User Not associated with this organization", ok: false });
            return
        }

        if (!organizationName) {
            res.status(400).json({ message: "Organization name is required", ok: false });
            return
        }

        const updatedOrg = await OrganizationModel.findByIdAndUpdate(
            orgId,
            { organizationName },
            { returnDocument: "after" }
        );

        if (!updatedOrg) {
            res.status(404).json({ message: "Organization not found", ok: false });
            return
        }

        return res.status(200).json({ ok: true, message: "Organization name updated", data: updatedOrg });
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error in updateOrganizationName:", error);
            res.status(500).json({ message: "Server error", ok: false, error: error.message });
            return
        }
    }
};

const deleteOrganization = async (req: AuthenticatedUserRequest, res: Response) => {
    try {
        const user = req.user;
        const {orgId} = req.params
        
        if (!orgId) {
            res.status(400).json({ ok: false, message: "No organization found for user" });
            return
        }

        // 1. Delete the organization
        const deletedOrg = await OrganizationModel.findByIdAndDelete(orgId);
        if (!deletedOrg) {
            res.status(404).json({ ok: false, message: "Organization not found" });
            return
        }

        // 2. Remove orgId from all staff documents
        await StaffModel.updateMany(
            { organizationId: orgId },
            { $pull: { organizationId: orgId } }
        );

        // 3. Remove orgId from the Product Owner (UserModel)
        await UserModel.findByIdAndUpdate(user._id, {
            $pull: { organizationId: orgId }
        }, { returnDocument: "after" });

        return res.status(200).json({
            ok: true,
            message: "Organization and references removed successfully",
            data: deletedOrg
        });
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error deleting organization:", error);
            return res.status(500).json({ ok: false, message: "Server error", error: error.message });
        }
    }
};


const getStaffsByOrganization = async (req: AuthenticatedUserRequest, res: Response) => {
    try {
        const { orgId } = req.params;

        if (!orgId) {
            return res.status(400).json({ message: "Organization ID is required", ok: false });
        }

        const staffs = await StaffModel.find({
            organizationId: orgId
        }).select("-password -resetPasswordToken -resetPasswordExpire"); // Exclude sensitive fields

        return res.status(200).json({
            message: "Staffs fetched successfully",
            ok: true,
            data: staffs
        });

    } catch (error) {
        if (error instanceof Error) {
            console.error("Error fetching staffs:", error);
            res.status(500).json({ message: "Server error", ok: false, error: error.message });
            return
        }
    }
};


// POST /api/staff/invite
const inviteStaff = async (req: AuthenticatedUserRequest, res: Response) => {
    try {
         const { organizationId, role } = req.body;

        if (!organizationId || !role) {
             res.status(400).json({
                message: "organizationId and role are required",
                ok: false
            });
            return
        }

        // Set expiry: 1 day from now
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day in milliseconds

        // Payload with expiry
        const invitationPayload = {
            organizationId,
            role,
            expiresAt
        };

        const encodedPayload = Buffer.from(JSON.stringify(invitationPayload)).toString("base64");

        const baseUrl = process.env.NODE_ENV === "development"
            ? "http://localhost:5173"
            : "https://verticalliving.com";

        const inviteLink = `${baseUrl}/staff/register?invite=${encodedPayload}`;

         res.status(200).json({
            message: "Invitation link generated successfully",
            data: inviteLink,
            ok: true
        });

    } catch (error) {
        if (error instanceof Error) {
            console.error("Error inviting staff:", error);
            res.status(500).json({ message: "Server error", ok: false, error: error.message });
            return
        }
    }
};

// PATCH /api/staff/remove-from-org/:staffId/:orgId
const removeStaffFromOrganization = async (req: AuthenticatedUserRequest, res: Response) => {
    const { staffId, orgId } = req.query;

    try {
        const staff = await StaffModel.findByIdAndUpdate(
            staffId,
            { $pull: { organizationId: orgId } },
            { new: true }
        );

        if (!staff) {
            res.status(404).json({ message: "Staff not found", ok: false });
            return
        }

        res.status(200).json({ message: "Removed staff from organization", data:staff });

    } catch (error) {
        if (error instanceof Error) {
            console.error("Error removing staff from org:", error);
            res.status(500).json({ message: "Server error", ok: false });
            return
        }
    }
};



export {
    createOrganziation,
    getMyOrganizations,
    getOrganizationById,
    updateOrganizationName,
    deleteOrganization,
    getStaffsByOrganization,
    inviteStaff,
    removeStaffFromOrganization
}