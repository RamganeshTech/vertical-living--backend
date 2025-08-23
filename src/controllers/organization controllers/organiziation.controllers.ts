import { Response } from "express";
import { RoleBasedRequest } from "../../types/types";
import UserModel from "../../models/usermodel/user.model";
import OrganizationModel from "../../models/organization models/organization.model";
import StaffModel from "../../models/staff model/staff.model";
import CTOModel from "../../models/CTO model/CTO.model";
import ClientModel from "../../models/client model/client.model";
import { getWorkerUtils, removeWorkerUtils } from "../../utils/workerUtils";
import { generateWorkerInviteLink } from "../../utils/generateInvitationworker";
import { syncAllMixedRoutes } from "../Modular Units Controllers/modularUnit.controller";
import redisClient from "../../config/redisClient";
import { EmployeeModel, HREmployeeModel } from "../../models/Department Models/HR Model/HRMain.model";


const createOrganziation = async (req: RoleBasedRequest, res: Response) => {
    try {

        let user = req.user
        const { organizationName, type, address, logoUrl, organizationPhoneNo } = req.body;


        if (!organizationName) {
            res.status(400).json({ message: "Organization name is required", ok: false });
            return
        }

        // ✅ Check directly in OrganizationModel
        const existing = await OrganizationModel.findOne({ userId: user?._id });


        if (existing) {
            return res.status(400).json({
                message: "Owner already has an organization",
                ok: false,
            });
        }


        // if (existingOrg) {
        //     return res.status(400).json({
        //         message: "Owner already has an organization",
        //         ok: false,
        //     });
        // }



        // 2. Create Organization
        const organization = await OrganizationModel.create({
            organizationName,
            type: type || null,
            address: address || null,
            logoUrl: logoUrl || null,
            organizationPhoneNo: organizationPhoneNo || null,
            userId: user?._id
        });

        if (!organization) {
            res.status(404).json({ message: "organization not created successfully", ok: false })
            return
        }

        const existingUser = await UserModel.findByIdAndUpdate(user?._id, { $push: { organizationId: organization._id } }, { returnDocument: "after" })

        if (!existingUser) {
            res.status(404).json({ message: "user not found", ok: false })
            return
        }

        res.status(201).json({
            message: "Organization successfully",
            data: organization,
            ok: true
        });

        await syncAllMixedRoutes((organization._id as string))
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("Error from create organization:", error);
            res.status(500).json({ message: "Server error", ok: false, error: error.message });
            return
        }
    }
}


const getMyOrganizations = async (req: RoleBasedRequest, res: Response) => {
    try {
        const user = req.user;

        let idToSearch;

        if (user?.role === "owner") {
            // console.log("im i getting inside", user?.role)
            idToSearch = user._id
        }
        else {
            // console.log("im i getting else part", user?.role)
            idToSearch = user?.ownerId
        }

        if (!idToSearch) {
            res.status(404).json({ message: "No organization linked", data: {}, ok: false });
            return
        }
        const organization = await OrganizationModel.findOne({ userId: idToSearch });
        // console.log("getting inside the getmyiorganizitons", organization)

        if (!organization) {
            res.status(200).json({ message: "No organizations  found", ok: false, data: null });
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


const getOrganizationById = async (req: RoleBasedRequest, res: Response) => {
    try {
        // const user = req.user;
        const { orgs } = req.params

        // if (!user) {
        //     res.status(404).json({ message: "No organization linked", ok: false });
        //     return
        // }

        if (!orgs) {
            res.status(404).json({ message: "No organization id provided", ok: false });
            return
        }

        const organization = await OrganizationModel.findById(orgs);

        if (!organization) {
            res.status(200).json({ message: "No organization  found", ok: false, data: {} });
            return
        }

        // console.log(organization)

        return res.status(200).json({ ok: true, message: "fetched successfully", data: organization });
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error in get organization by id:", error);
            return res.status(500).json({ message: "Server error", ok: false, error: error.message });
        }
    }
};


const updateOrganizationDetails = async (req: RoleBasedRequest, res: Response) => {
    try {
        const user = req.user;
        const updatedData = req.body;
        const { orgId } = req.params;

        if (!user || !user._id) {
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


        return res.status(200).json({ ok: true, message: "Organization field updated", data: updatedOrg });

    } catch (error) {
        if (error instanceof Error) {
            console.error("Error in updateOrganizationName:", error);
            res.status(500).json({ message: "Server error", ok: false, error: error.message });
            return
        }
    }
};

const deleteOrganization = async (req: RoleBasedRequest, res: Response) => {
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
        await UserModel.findByIdAndUpdate(user?._id, {
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

// used only in the invitestaff component
const getStaffsByOrganization = async (req: RoleBasedRequest, res: Response) => {
    try {
        const { orgId } = req.params;

        if (!orgId) {
            return res.status(400).json({ message: "Organization ID is required", ok: false });
        }

        const staffs = await StaffModel.find({
            organizationId: orgId
        }).select("-password -resetPasswordToken -resetPasswordExpire"); // Exclude sensitive fields
        // console.log("staffs", staffs)


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
const inviteStaff = async (req: RoleBasedRequest, res: Response) => {
    try {
        const { organizationId, role, specificRole } = req.body;
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
            specificRole,
            expiresAt,
            ownerId: user?.ownerId || user?._id
        };

        const encodedPayload = Buffer.from(JSON.stringify(invitationPayload)).toString("base64");

        const baseUrl = process.env.NODE_ENV === "development"
            ? process.env.FRONTEND_URL
            : process.env.FRONTEND_URL;

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
const removeStaffFromOrganization = async (req: RoleBasedRequest, res: Response) => {
    const { staffId, orgId } = req.query;

    try {
        const [staff, hremp] = await Promise.all([
            StaffModel.findByIdAndDelete(staffId, { new: true }),
            EmployeeModel.findOneAndDelete({ empId: staffId })]
        );



        if (!staff) {
            res.status(404).json({ message: "Staff not found", ok: false });
            return
        }

        await redisClient.del(`getusers:staff:${orgId}`)

        res.status(200).json({ message: "Removed staff from organization", data: staff, ok: true });

    } catch (error) {
        if (error instanceof Error) {
            console.error("Error removing staff from org:", error);
            res.status(500).json({ message: "Server error", ok: false });
            return
        }
    }
};




const getCTOByOrganization = async (req: RoleBasedRequest, res: Response) => {
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


const inviteCTO = async (req: RoleBasedRequest, res: Response) => {
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
            ownerId: user?.ownerId || user?._id
        };

        const encodedPayload = Buffer.from(JSON.stringify(invitationPayload)).toString("base64");

        const baseUrl = process.env.NODE_ENV === "development"
            ? process.env.FRONTEND_URL
            : process.env.FRONTEND_URL;


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

const removeCTOFromOrganization = async (req: RoleBasedRequest, res: Response) => {
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

        await redisClient.del(`getusers:CTO:${orgId}`)

        res.status(200).json({ message: "Removed CTO from organization", data: CTO, ok: true });

    } catch (error) {
        if (error instanceof Error) {
            console.error("Error removing CTO from org:", error);
            res.status(500).json({ message: "Server error", ok: false });
            return
        }
    }
};



// WORKER CONTORLLERS 

const inviteWorkerByStaff = async (req: RoleBasedRequest, res: Response): Promise<void> => {

    try {
        const { projectId, role, organizationId } = req.body;
        const user = req.user

        if (!projectId) {
            res.status(400).json({
                message: "projectId and specificRole are required",
                ok: false,
            });
            return;
        }


        const inviteLink = generateWorkerInviteLink({
            projectId,
            organizationId: organizationId,
            role,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
            invitedBy: user?.ownerId! || user?._id!,
            invitedByModel: user!.role === "staff" ? "StaffModel" : (user!.role === "CTO" ? "CTOModel" : "UserModel")
        });

        res.status(200).json({
            message: "Invitation link generated successfully by staff",
            data: inviteLink,
            ok: true,
        });

    } catch (error) {
        console.error("Error inviting worker:", error);
        res.status(500).json({
            message: "Server error",
            ok: false,
            error: (error as Error).message,
        });
    }
};


// PUT /api/worker/remove/:workerId/:projectId
const removeWorkerFromProject = async (req: RoleBasedRequest, res: Response): Promise<void> => {
    try {
        const { workerId, projectId, orgId } = req.params;

        if (!workerId) {
            res.status(400).json({ message: "workerId is required", ok: false });
            return;
        }

        const deletedWorker = await removeWorkerUtils({ workerId, projectId })

        if (!deletedWorker) {
            res.status(404).json({ message: "Worker not found", ok: false });
            return;
        }


        await redisClient.del(`getusers:worker:${orgId}`)

        res.status(200).json({
            message: "Worker removed from the project successfully",
            data: deletedWorker,
            ok: true,
        });
    } catch (error) {
        console.error("Error removing worker:", error);
        res.status(500).json({
            message: "Server error",
            ok: false,
            error: (error as Error).message,
        });
    }
};


const getWorkersByProject = async (req: RoleBasedRequest, res: Response): Promise<void> => {
    try {
        const { projectId } = req.params;

        if (!projectId) {
            res.status(400).json({ message: "projectId is required", ok: false });
            return;
        }

        const workers = await getWorkerUtils({ projectId })

        console.log("workers", workers)
        res.status(200).json({
            message: "Workers fetched successfully",
            data: workers,
            ok: true,
        });
    } catch (error) {
        console.error("Error fetching workers:", error);
        res.status(500).json({
            message: "Server error",
            ok: false,
            error: (error as Error).message,
        });
    }
};


// CLIENT CONTROLLERS
const inviteClient = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId, organizationId } = req.body;

        const user = req.user

        if (!projectId) {
            return res.status(400).json({
                ok: false,
                message: "projectId is required",
            });
        }
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);


        const payload = {
            projectId,
            ownerId: user?.ownerId || user?._id,
            expiresAt,
            organizationId,
            role: "client"
        };

        const encodedToken = Buffer.from(JSON.stringify(payload)).toString("base64");


        // const token = jwt.sign(payload, process.env.JWT_CLIENT_INVITE_SECRET!, {
        //     expiresIn: "1d", // invite link valid for 1 day
        // });

        const baseUrl = process.env.NODE_ENV === "development"
            ? process.env.FRONTEND_URL!
            : process.env.FRONTEND_URL;

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

const getClientByProject = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { orgId, projectId } = req.params;

        if (!orgId || !projectId) {
            return res.status(400).json({ message: "Organization ID and project Id is required", ok: false });
        }

        // const client = await ClientModel.find({$and: [{organizationId:orgId, projectId:projectId}]}).select("-password -resetPasswordToken -resetPasswordExpire"); // Exclude sensitive fields
        const client = await ClientModel.find({ projectId: projectId }).select("-password -resetPasswordToken -resetPasswordExpire"); // Exclude sensitive fields

        return res.status(200).json({
            message: "client fetched successfully",
            ok: true,
            data: client
        });

    } catch (error) {
        if (error instanceof Error) {
            console.error("Error fetching client:", error);
            res.status(500).json({ message: "Server error", ok: false, error: error.message });
            return
        }
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

    getWorkersByProject,
    inviteWorkerByStaff,
    removeWorkerFromProject,

    inviteClient,
    getClientByProject
}