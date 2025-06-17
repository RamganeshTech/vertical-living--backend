import { Request, Response } from "express";
import { AuthenticatedCTORequest, AuthenticatedUserRequest, RoleBasedRequest } from "../../types/types";
import UserModel from "../../models/usermodel/user.model";
import bcrypt from 'bcrypt';
import OrganizationModel from "../../models/organization models/organization.model";
import StaffModel from "../../models/staff model/staff.model";
import CTOModel from "../../models/CTO model/CTO.model";

import jwt  from 'jsonwebtoken';


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
            userId: user._id
        });

        if (!organization) {
            res.status(404).json({ message: "organization not created successfully", ok: false })
            return
        }

        const existingUser = await UserModel.findByIdAndUpdate(user._id, { $push: { organizationId: organization._id } }, { returnDocument: "after" })

        if (!existingUser) {
            res.status(404).json({ message: "user not found", ok: false })
            return
        }

        return res.status(201).json({
            message: "Organization successfully",
            data: organization,
            ok: true
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

        if (!user || !user.organization) {
            res.status(404).json({ message: "No organization linked", data: [], ok: false });
            return
        }

        const organization = await OrganizationModel.find({ userId: user._id });

        if (!organization) {
            res.status(200).json({ message: "No organizations  found", ok: false, data: [] });
            return
        }

        res.status(200).json({ ok: true, message: "fetched successfully", data: organization });
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
        const { orgs } = req.params

        if (!user) {
            res.status(404).json({ message: "No organization linked", ok: false });
            return
        }

        if (!orgs) {
            res.status(404).json({ message: "No organization id provided", ok: false });
            return
        }

        const organization = await OrganizationModel.findById(orgs);

        if (!organization) {
            res.status(200).json({ message: "No organization  found", ok: false, data: {} });
            return
        }

        console.log(organization)

        return res.status(200).json({ ok: true, message: "fetched successfully", data: organization });
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error in get organization by id:", error);
            return res.status(500).json({ message: "Server error", ok: false, error: error.message });
        }
    }
};


const updateOrganizationDetails = async (req: AuthenticatedUserRequest, res: Response) => {
    try {
        const user = req.user;
        const updatedData = req.body;
        const { orgId } = req.params;

        if (!user || !user.organization) {
            return res.status(404).json({ message: "User not associated with this organization", ok: false });
        }

        // Validate that exactly one field is being updated
        const fields = Object.keys(updatedData);
        if (fields.length !== 1) {
            return res.status(400).json({ message: "Exactly one field must be updated at a time", ok: false });
        }

        const updatedOrg = await OrganizationModel.findByIdAndUpdate(
            orgId,
            { $set: updatedData }, // directly apply updatedData
            { returnDocument: "after" }
        );

        if (!updatedOrg) {
            return res.status(404).json({ message: "Organization not found", ok: false });
        }

        return res.status(200).json({ ok: true, message: "Organization field updated", data: updatedOrg });

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
        const { orgId } = req.params

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
        const user = req.user
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
            expiresAt,
            ownerId: user._id
        };

        const encodedPayload = Buffer.from(JSON.stringify(invitationPayload)).toString("base64");

        const baseUrl = process.env.NODE_ENV === "development"
            ? "http://localhost:5173"
            : "https://verticalliving.com";

        const inviteLink = `${baseUrl}/staffregister?invite=${encodedPayload}`;

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

        res.status(200).json({ message: "Removed staff from organization", data: staff, ok: true });

    } catch (error) {
        if (error instanceof Error) {
            console.error("Error removing staff from org:", error);
            res.status(500).json({ message: "Server error", ok: false });
            return
        }
    }
};




const getCTOByOrganization = async (req: AuthenticatedUserRequest, res: Response) => {
    try {
        const { orgId } = req.params;

        if (!orgId) {
            return res.status(400).json({ message: "Organization ID is required", ok: false });
        }

        const CTO = await CTOModel.find({
            organizationId: orgId
        }).select("-password -resetPasswordToken -resetPasswordExpire"); // Exclude sensitive fields

        return res.status(200).json({
            message: "CTOs fetched successfully",
            ok: true,
            data: CTO
        });

    } catch (error) {
        if (error instanceof Error) {
            console.error("Error fetching CTO:", error);
            res.status(500).json({ message: "Server error", ok: false, error: error.message });
            return
        }
    }
};


const inviteCTO = async (req: AuthenticatedUserRequest, res: Response) => {
    try {
        const { organizationId } = req.body;
        const user = req.user

        if (!organizationId) {
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
            role: "CTO",
            expiresAt,
            ownerId: user._id
        };

        const encodedPayload = Buffer.from(JSON.stringify(invitationPayload)).toString("base64");

        const baseUrl = process.env.NODE_ENV === "development"
            ? "http://localhost:5173"
            : "https://verticalliving.com";

        const inviteLink = `${baseUrl}/ctoregister?invite=${encodedPayload}`;

        res.status(200).json({
            message: "Invitation link generated successfully",
            data: inviteLink,
            ok: true
        });

    } catch (error) {
        if (error instanceof Error) {
            console.error("Error inviting CTO:", error);
            res.status(500).json({ message: "Server error", ok: false, error: error.message });
            return
        }
    }
};

const removeCTOFromOrganization = async (req: AuthenticatedUserRequest, res: Response) => {
    const { CTOId, orgId } = req.query;

    try {
        const CTO = await CTOModel.findByIdAndUpdate(
            CTOId,
            { $pull: { organizationId: orgId } },
            { new: true }
        );

        if (!CTO) {
            res.status(404).json({ message: "CTO not found", ok: false });
            return
        }

        res.status(200).json({ message: "Removed CTO from organization", data: CTO, ok: true });

    } catch (error) {
        if (error instanceof Error) {
            console.error("Error removing CTO from org:", error);
            res.status(500).json({ message: "Server error", ok: false });
            return
        }
    }
};


// CLIENT CONTROLLERS
const inviteClient = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId } = req.body;

        const { ownerId } = (req as any).user

        if (!projectId) {
            return res.status(400).json({
                ok: false,
                message: "projectId is required",
            });
        }
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const payload = {
            projectId,
            ownerId,
            expiresAt,
            role: "client"
        };

        const encodedToken = Buffer.from(JSON.stringify(payload)).toString("base64");


        // const token = jwt.sign(payload, process.env.JWT_CLIENT_INVITE_SECRET!, {
        //     expiresIn: "1d", // invite link valid for 1 day
        // });

        const baseUrl = process.env.NODE_ENV === "development"
            ? process.env.FRONTEND_URL!
            : "https://yourdomain.com";

        const registerLink = `${baseUrl}/clientregister?invite=${encodedToken}`;

        return res.status(200).json({
            ok: true,
            message: "Client registration link generated successfully",
            data: registerLink,
        });

    } catch (error: any) {
        console.error("Error generating client invite link:", error);
        return res.status(500).json({
            ok: false,
            message: "Server error while generating invite link",
        });
    }
};



export {
    createOrganziation,
    getMyOrganizations,
    getOrganizationById,
    updateOrganizationDetails,
    deleteOrganization,

    getStaffsByOrganization,
    inviteStaff,
    removeStaffFromOrganization,

    getCTOByOrganization,
    inviteCTO,
    removeCTOFromOrganization,

    inviteClient,
}