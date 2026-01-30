import { Request, Response } from "express";
import ClientModel from "../../models/client model/client.model";
import CTOModel from "../../models/CTO model/CTO.model";
import StaffModel from "../../models/staff model/staff.model";
import UserModel from "../../models/usermodel/user.model";
import { WorkerModel } from "../../models/worker model/worker.model";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose, { Model } from "mongoose";
import { RoleBasedRequest } from "../../types/types";
import redisClient from "../../config/redisClient";
import crypto from 'crypto';
import sendResetEmail from "../../utils/Common Mail Services/forgotPasswordMail";
import { syncEmployee } from "../Department controllers/HRMain controller/HrMain.controllers";
import { getModelNameByRole } from "../../utils/common features/utils";

export const unifiedLogin = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required", ok: false });
        }

        // 1. Define the models and their associated "type" names
        const models: { model: mongoose.Model<any>; roleName: string }[] = [
            { model: UserModel, roleName: 'owner' },
            { model: StaffModel, roleName: 'staff' },
            { model: WorkerModel, roleName: 'worker' },
            { model: CTOModel, roleName: 'CTO' },
            { model: ClientModel, roleName: 'client' }
        ];

        let foundUser: any = null;
        let userRole = "";

        // 2. Loop through models to find the email
        for (const item of models) {
            const user = await item.model.findOne({ email }).lean();
            if (user) {
                foundUser = user;
                userRole = item.roleName;
                break; // Stop searching once found
            }
        }

        if (!foundUser) {
            return res.status(404).json({ message: "Invalid credentials", ok: false });
        }

        // 3. Verify Password
        const isMatching = await bcrypt.compare(password, foundUser.password);
        if (!isMatching) {
            return res.status(401).json({ message: "Invalid credentials", ok: false });
        }

        // 4. Unified Token Generation
        // Note: Using a single Secret is better for a unified login system
        const jwtPayload: any = {
            _id: foundUser._id,
            // username: foundUser.username || foundUser.staffName || foundUser.workerName,
            organizationId: foundUser.organizationId,
            ownerId: foundUser.ownerId,
            role: foundUser.role || userRole,
            isGuideRequired: foundUser.isGuideRequired
        };

        // 2. Assign specific name and identify correct secrets based on role
        let accessSecret = "";
        let refreshSecret = "";

        switch (userRole) {
            case 'owner':
                jwtPayload.username = foundUser.username;
                accessSecret = process.env.JWT_ACCESS_SECRET!;
                refreshSecret = process.env.JWT_REFRESH_SECRET!;
                break;
            case 'staff':
                jwtPayload.staffName = foundUser.staffName;
                accessSecret = process.env.JWT_STAFF_ACCESS_SECRET!;
                refreshSecret = process.env.JWT_STAFF_REFRESH_SECRET!;
                break;
            case 'worker':
                jwtPayload.workerName = foundUser.workerName;
                // Workers often need project IDs in their payload
                jwtPayload.projectId = foundUser.projectId || [];
                accessSecret = process.env.JWT_WORKER_ACCESS_SECRET!;
                refreshSecret = process.env.JWT_WORKER_REFRESH_SECRET!;
                break;
            case 'CTO':
                jwtPayload.CTOName = foundUser.CTOName;
                accessSecret = process.env.JWT_CTO_ACCESS_SECRET!;
                refreshSecret = process.env.JWT_CTO_REFRESH_SECRET!;
                break;
            case 'client':
                jwtPayload.clientName = foundUser.clientName;
                accessSecret = process.env.JWT_CLIENT_ACCESS_SECRET!;
                refreshSecret = process.env.JWT_CLIENT_REFRESH_SECRET!;
                break;
        }

        const token = jwt.sign(jwtPayload, accessSecret, { expiresIn: "1d" });
        const refreshToken = jwt.sign(jwtPayload, refreshSecret, { expiresIn: "7d" });

        // 5. Set Unified Cookies
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? ("none" as const) : ("lax" as const),
            maxAge: 1000 * 60 * 60 * 24
        };


        // Also set the Legacy Role-Specific Cookies so your existing frontend stays happy
        let specificAccessKey = "";
        let specificRefreshKey = "";

        switch (userRole) {
            case 'owner': specificAccessKey = "useraccesstoken"; specificRefreshKey = "userrefreshtoken"; break;
            case 'staff': specificAccessKey = "staffaccesstoken"; specificRefreshKey = "staffrefreshtoken"; break;
            case 'worker': specificAccessKey = "workeraccesstoken"; specificRefreshKey = "workerrefreshtoken"; break;
            case 'CTO': specificAccessKey = "ctoaccesstoken"; specificRefreshKey = "ctorefreshtoken"; break;
            case 'client': specificAccessKey = "clientaccesstoken"; specificRefreshKey = "clientrefreshtoken"; break;
        }

        if (specificAccessKey) { // always there will be only htis role only witut this there wont be anyother roel so no need to set the cookie twice
            res.cookie(specificAccessKey, token, cookieOptions);
            res.cookie(specificRefreshKey, refreshToken, { ...cookieOptions, maxAge: 1000 * 60 * 60 * 24 * 7 });
        }


        // res.cookie("accesstoken", token, cookieOptions);
        // res.cookie("refreshtoken", refreshToken, { ...cookieOptions, maxAge: 1000 * 60 * 60 * 24 * 7 });

        // 7. Prepare the Response Data with dynamic ID and Name keys
        const responseData: any = {
            role: userRole,
            email: foundUser.email,
            phoneNo: foundUser.phoneNo,
            organizationId: foundUser.organizationId,
            permission: foundUser.permission || {},
            isGuideRequired: foundUser.isGuideRequired,
            ok: true
        };

        // Add dynamic ID and Name for the response body
        switch (userRole) {
            case 'owner':
                responseData.userId = foundUser._id;
                responseData.userName = foundUser.username;
                break;
            case 'staff':
                responseData.staffId = foundUser._id;
                responseData.staffName = foundUser.staffName;
                break;
            case 'worker':
                responseData.workerId = foundUser._id;
                responseData.workerName = foundUser.workerName;
                break;
            case 'CTO':
                responseData.CTOId = foundUser._id;
                responseData.CTOName = foundUser.CTOName;
                break;
            case 'client':
                responseData.clientId = foundUser._id;
                responseData.clientName = foundUser.clientName;
                break;
        }


        // Optional: Clear Redis cache for this user on new login to force fresh auth data
        // await redisClient.del(`userAuth:${foundUser._id}`);

        return res.status(200).json({
            message: "Login successful",
            data: responseData,
            ok: true
        });

    } catch (error) {
        console.error("Unified Login Error:", error);
        return res.status(500).json({ message: "Internal Server Error", ok: false });
    }
};


export const unifiedRegister = async (req: Request, res: Response): Promise<any> => {
    try {
        // 1. Destructure ONLY the allowed fields - Security Best Practice
        const {
            email,
            password,
            // role,
            name, // Generic name from UI
            // organizationId,
            phoneNo,
            invite,
            // ownerId // Required for certain sub-roles
        } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ message: "Missing required fields", ok: false });
        }


        let finalRole: string = "";
        let finalOrgId: string = "";
        let finalOwnerId: string = "";
        let finalSpecificRole: string[] = [];
        let finalProjectId: string | null = null;
        let expiresAt: string | null = null;


        // 2. Handle Invitation vs Direct Registration
        if (invite) {
            // Decoding the invitation string
            try {
                const decoded = Buffer.from(invite, "base64").toString("utf-8");
                const { organizationId, role, expiresAt, ownerId, specificRole = [], projectId } = JSON.parse(decoded);

                // Check Expiry
                if (expiresAt && new Date(expiresAt) < new Date()) {
                    return res.status(400).json({ message: "Invitation link has expired", ok: false });
                }

                if (role === "worker") {
                    finalSpecificRole = specificRole
                    finalProjectId = projectId
                }

                if (role === "client") {
                    finalProjectId = projectId
                }

                finalRole = role;
                finalOrgId = organizationId;
                finalOwnerId = ownerId;
            } catch (error) {
                return res.status(400).json({ message: "Invalid invitation link", ok: false });
            }
        }


        // 2. Prevent duplicate emails across ALL models
        const models: mongoose.Model<any>[] = [UserModel, StaffModel, WorkerModel, CTOModel, ClientModel];

        for (const model of models) {
            // Check if any user in any table has this email OR phone
            const existingUser: any = await model.findOne({
                $or: [{ email: email }, { phoneNo: phoneNo }]
            }).lean();

            if (existingUser) {
                if (existingUser.email === email) {
                    return res.status(400).json({
                        message: `The email ${email} is already registered.`,
                        ok: false
                    });
                }
                if (existingUser.phoneNo === phoneNo) {
                    return res.status(400).json({
                        message: `The phone number ${phoneNo} is already registered.`,
                        ok: false
                    });
                }
            }
        }


        // 6. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);


        // 4. Create a clean base object for registration
        const baseUserData = {
            email,
            password: hashedPassword,
            organizationId: finalOrgId ? [new mongoose.Types.ObjectId(finalOrgId)] : [],
            phoneNo,
            role: finalRole,
            isGuideRequired: true // Default for new users
        };

        let newUser: any;

        // 5. Map the generic 'name' to the model-specific field name
        switch (finalRole) {
            case 'owner':
                newUser = await UserModel.create({ ...baseUserData, username: name });
                break;
            case 'staff':
                newUser = await StaffModel.create({ ...baseUserData, staffName: name, ownerId: new mongoose.Types.ObjectId(finalOwnerId) });
                break;
            case 'worker':
                newUser = await WorkerModel.create({
                    ...baseUserData,
                    workerName: name,
                    ownerId: new mongoose.Types.ObjectId(finalOwnerId),
                    specificRole: finalSpecificRole,
                    projectId: finalProjectId ? [new mongoose.Types.ObjectId(finalProjectId)] : null
                });
                break;
            case 'CTO':
                newUser = await CTOModel.create({
                    ...baseUserData,
                    CTOName: name,
                    ownerId: new mongoose.Types.ObjectId(finalOwnerId)
                });
                break;
            case 'client':
                // 1. PROJECT UNIQUE CHECK: Ensure no other client is already assigned to this project
                if (finalProjectId) {
                    const projectHasClient = await ClientModel.findOne({ projectId: finalProjectId }).lean();
                    if (projectHasClient) {
                        return res.status(400).json({
                            message: "This project already has an assigned client. Only one client per project is allowed.",
                            ok: false
                        });
                    }
                }


                newUser = await ClientModel.create({
                    ...baseUserData,
                    organizationId: [finalOrgId],
                    clientName: name,
                    ownerId: new mongoose.Types.ObjectId(finalOwnerId),
                    projectId: finalProjectId ? new mongoose.Types.ObjectId(finalProjectId) : null
                });
                break;
            default:
                return res.status(400).json({ message: "Invalid role provided", ok: false });
        }


        // 6. --- ADDED: REDIS CLEANUP ---
        if (finalOrgId) {
            await redisClient.del(`getusers:${finalRole}:${finalOrgId}`);
        }

        const modelByRole = getModelNameByRole(finalRole)

        // 7. --- ADDED: EMPLOYEE SYNCING ---
        if (finalRole !== 'owner' && finalRole !== "client") {
            const syncRoleMap: any = { staff: "organization_staff", worker: "organization_staff", CTO: "organization_staff", };
            syncEmployee({
                organizationId: finalOrgId,
                empId: newUser._id,
                employeeModel: modelByRole,
                empRole: syncRoleMap[finalRole] || finalRole,
                name: name,
                phoneNo: newUser.phoneNo,
                role: finalRole,
                email: newUser.email,
            }).catch(err => console.error("syncEmployee error in Hr Dept:", err));
        }




        // 4. Unified Token Generation
        // Note: Using a single Secret is better for a unified login system
        const jwtPayload: any = {
            _id: newUser._id,
            // username: newUser.username || newUser.staffName || newUser.workerName,
            organizationId: newUser.organizationId,
            ownerId: newUser.ownerId,
            role: newUser.role,
            isGuideRequired: newUser.isGuideRequired
        };

        // 2. Assign specific name and identify correct secrets based on role
        let accessSecret = "";
        let refreshSecret = "";

        switch (newUser.role) {
            case 'owner':
                jwtPayload.username = newUser.username;
                accessSecret = process.env.JWT_ACCESS_SECRET!;
                refreshSecret = process.env.JWT_REFRESH_SECRET!;
                break;
            case 'staff':
                jwtPayload.staffName = newUser.staffName;
                accessSecret = process.env.JWT_STAFF_ACCESS_SECRET!;
                refreshSecret = process.env.JWT_STAFF_REFRESH_SECRET!;
                break;
            case 'worker':
                jwtPayload.workerName = newUser.workerName;
                // Workers often need project IDs in their payload
                jwtPayload.projectId = newUser.projectId || [];
                accessSecret = process.env.JWT_WORKER_ACCESS_SECRET!;
                refreshSecret = process.env.JWT_WORKER_REFRESH_SECRET!;
                break;
            case 'CTO':
                jwtPayload.CTOName = newUser.CTOName;
                accessSecret = process.env.JWT_CTO_ACCESS_SECRET!;
                refreshSecret = process.env.JWT_CTO_REFRESH_SECRET!;
                break;
            case 'client':
                jwtPayload.clientName = newUser.clientName;
                accessSecret = process.env.JWT_CLIENT_ACCESS_SECRET!;
                refreshSecret = process.env.JWT_CLIENT_REFRESH_SECRET!;
                break;
        }

        const token = jwt.sign(jwtPayload, accessSecret, { expiresIn: "1d" });
        const refreshToken = jwt.sign(jwtPayload, refreshSecret, { expiresIn: "7d" });

        // 5. Set Unified Cookies
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? ("none" as const) : ("lax" as const),
            maxAge: 1000 * 60 * 60 * 24
        };


        // Also set the Legacy Role-Specific Cookies so your existing frontend stays happy
        let specificAccessKey = "";
        let specificRefreshKey = "";

        switch (newUser.role) {
            case 'owner': specificAccessKey = "useraccesstoken"; specificRefreshKey = "userrefreshtoken"; break;
            case 'staff': specificAccessKey = "staffaccesstoken"; specificRefreshKey = "staffrefreshtoken"; break;
            case 'worker': specificAccessKey = "workeraccesstoken"; specificRefreshKey = "workerrefreshtoken"; break;
            case 'CTO': specificAccessKey = "ctoaccesstoken"; specificRefreshKey = "ctorefreshtoken"; break;
            case 'client': specificAccessKey = "clientaccesstoken"; specificRefreshKey = "clientrefreshtoken"; break;
        }

        if (specificAccessKey) { // always there will be only htis role only witut this there wont be anyother roel so no need to set the cookie twice
            res.cookie(specificAccessKey, token, cookieOptions);
            res.cookie(specificRefreshKey, refreshToken, { ...cookieOptions, maxAge: 1000 * 60 * 60 * 24 * 7 });
        }


        // 6. Return standard data object so frontend can immediately log the user in
        const responseData: any = {
            role: newUser.role,
            email: newUser.email,
            phoneNo: newUser.phoneNo,
            organizationId: newUser.organizationId,
            isGuideRequired: newUser.isGuideRequired,
            ok: true
        };

        // Align IDs and names with your existing login response
        if (finalRole === 'owner') { responseData.userId = newUser._id; responseData.userName = newUser.username; }
        else if (finalRole === 'staff') { responseData.staffId = newUser._id; responseData.staffName = newUser.staffName; }
        else if (finalRole === 'worker') { responseData.workerId = newUser._id; responseData.workerName = newUser.workerName; }
        else if (finalRole === 'CTO') { responseData.CTOId = newUser._id; responseData.CTOName = newUser.CTOName; }
        else if (finalRole === 'client') { responseData.clientId = newUser._id; responseData.clientName = newUser.clientName; }

        return res.status(201).json({
            message: "User registered successfully",
            ok: true,
            data: responseData
        });


        // return res.status(201).json({
        //     message: "User registered successfully",
        //     ok: true,
        //     data: {
        //         id: newUser._id,
        //         role: role,
        //         email: newUser.email
        //     }
        // });

    } catch (error: any) {
        console.error("Unified Registration Error:", error);
        return res.status(500).json({
            message: "Internal Server Error during registration",
            error: error.message,
            ok: false
        });
    }
};



export const unifiedLogout = async (req: Request, res: Response) => {
    try {
        // List of all old specific cookies + the new unified ones
        const cookiesToClear = [
            "useraccesstoken", "userrefreshtoken",
            "staffaccesstoken", "staffrefreshtoken",
            "workeraccesstoken", "workerrefreshtoken",
            "ctoaccesstoken", "ctorefreshtoken",
            "clientaccesstoken", "clientrefreshtoken",
            "accesstoken", "refreshtoken" // The new unified names
        ];

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? ("none" as const) : ("lax" as const),
            path: "/",
        };

        // Clear every cookie in the list
        cookiesToClear.forEach(cookieName => {
            res.clearCookie(cookieName, cookieOptions);
        });

        return res.status(200).json({
            message: "Logged out successfully from all sessions",
            ok: true
        });
    } catch (error) {
        console.error("Logout Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            ok: false
        });
    }
};


export const unifiedIsAuthenticated = async (req: RoleBasedRequest, res: Response) => {
    try {

        const user = req?.user

        // if (!user?._id) {
        //     return res.status(404).json({ message: "User id not found", ok: false })
        // }


        if (!user) {
            return res.status(401).json({ message: "Not authenticated", ok: false });
        }

        // req.user is populated by your authentication middleware
        const { _id, role } = user;

        if (!_id || !role) {
            return res.status(401).json({ message: "Not authenticated", ok: false });
        }

        const redisUserKey = `userAuth:${_id}`

        // await redisClient.del(redisUserKey)
        const cachedData = await redisClient.get(redisUserKey)

        if (cachedData) {
            return res.status(200).json({
                data: JSON.parse(cachedData),
                message: "user is authenticated form cache", ok: true
            })
        }


        // 1. Map role to the correct model
        let targetModel: mongoose.Model<any>;
        switch (role) {
            case 'owner': targetModel = UserModel; break;
            case 'staff': targetModel = StaffModel; break;
            case 'worker': targetModel = WorkerModel; break;
            case 'CTO': targetModel = CTOModel; break;
            case 'client': targetModel = ClientModel; break;
            default: return res.status(403).json({ message: "Invalid role", ok: false });
        }

        // 2. Fetch fresh user data (Lean for performance)
        const isExist: any = await targetModel.findById(_id).lean();

        if (!isExist) {
            return res.status(404).json({ message: "User no longer exists", ok: false });
        }

        // 3. Extract the correct name based on your model conventions
        // const userName = isExist.username || isExist.staffName || isExist.workerName || isExist.CTOName || isExist.clientName;

        // return res.status(200).json({
        //     ok: true,
        //     message: "User is authenticated",
        //     data: {
        //         userId: isExist._id,
        //         role: role,
        //         userName: userName,
        //         email: isExist.email,
        //         phoneNo: isExist.phoneNo,
        //         isauthenticated: true,
        //         organizationId: isExist.organizationId,
        //         permission: isExist?.permission || {},
        //         isGuideRequired: isExist.isGuideRequired
        //     }
        // });



        // 4. Build Dynamic Response Data
        // This ensures staffId for staff, CTOId for CTO, etc.
        const responseData: any = {
            role: role,
            email: isExist.email,
            phoneNo: isExist.phoneNo,
            organizationId: isExist.organizationId,
            permission: isExist?.permission || {},
            isGuideRequired: isExist.isGuideRequired,
            isauthenticated: true,
        };

        // Dynamically assign ID and Name keys based on role
        switch (role) {
            case 'owner':
                responseData.userId = isExist._id;
                responseData.userName = isExist.username;
                break;
            case 'staff':
                responseData.staffId = isExist._id;
                responseData.staffName = isExist.staffName;
                break;
            case 'worker':
                responseData.workerId = isExist._id;
                responseData.workerName = isExist.workerName;
                break;
            case 'CTO':
                responseData.CTOId = isExist._id;
                responseData.CTOName = isExist.CTOName;
                break;
            case 'client':
                responseData.clientId = isExist._id;
                responseData.clientName = isExist.clientName;
                break;
        }

        // 5. Cache the specifically formatted data
        await redisClient.set(redisUserKey, JSON.stringify(responseData), { EX: 60 * 10 }); // Cache for 1 hour

        return res.status(200).json({
            ok: true,
            message: "User is authenticated",
            data: responseData
        });

    } catch (error) {
        console.error("Auth Check Error:", error);
        return res.status(500).json({ message: "Internal Server Error", ok: false });
    }
};


export const unifiedForgotPassword = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required', ok: false });
        }

        const models: { model: mongoose.Model<any>; roleName: string }[] = [
            { model: UserModel, roleName: 'owner' },
            { model: StaffModel, roleName: 'staff' },
            { model: WorkerModel, roleName: 'worker' },
            { model: CTOModel, roleName: 'CTO' },
            { model: ClientModel, roleName: 'client' }
        ];

        let foundUser: any = null;
        let userRole = "";

        // 1. Search across all models
        for (const item of models) {
            const user = await item.model.findOne({ email });
            if (user) {
                foundUser = user;
                userRole = item.roleName;
                break;
            }
        }

        if (!foundUser) {
            return res.status(404).json({ message: 'User not found with this email', ok: false });
        }

        // 2. Generate and Hash Token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // 3. Save to database
        foundUser.resetPasswordToken = hashedToken;
        foundUser.resetPasswordExpire = Date.now() + 3600000; // 1 hour
        await foundUser.save();

        // 4. Generate Link (Include role for frontend routing)
        const resetLink = `${process.env.FRONTEND_URL}/common/reset-password?token=${resetToken}`;

        // 5. Send Email
        const displayName = foundUser.username || foundUser.staffName || foundUser.workerName || foundUser.CTOName || foundUser.clientName || "User";
        await sendResetEmail(foundUser.email, displayName, resetLink);

        return res.status(200).json({
            message: 'Password reset email sent. Please check your inbox.',
            ok: true
        });

    } catch (error) {
        console.error('Unified Forgot Password Error: ', error);
        return res.status(500).json({ message: 'Server error. Please try again later.', ok: false });
    }
};


export const unifiedResetForgotPassword = async (req: Request, res: Response): Promise<any> => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ message: "Token and password are required.", ok: false });
        }

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const models: mongoose.Model<any>[] = [UserModel, StaffModel, WorkerModel, CTOModel, ClientModel];
        let foundUser: any = null;

        // 1. Find user by hashed token and expiration
        for (const model of models) {
            const user = await model.findOne({
                resetPasswordToken: hashedToken,
                resetPasswordExpire: { $gt: Date.now() },
            });
            if (user) {
                foundUser = user;
                break;
            }
        }

        if (!foundUser) {
            return res.status(400).json({ message: "Invalid or expired token.", ok: false });
        }

        // 2. Hash new password and clear tokens
        const salt = await bcrypt.genSalt(10);
        foundUser.password = await bcrypt.hash(password, salt);
        foundUser.resetPasswordToken = undefined;
        foundUser.resetPasswordExpire = undefined;

        await foundUser.save();

        // 3. Invalidate Redis Auth Cache (Crucial Security Step)
        const redisUserKey = `userAuth:${foundUser._id}`;
        await redisClient.del(redisUserKey);

        return res.status(200).json({
            message: "Password reset successful. You can now log in.",
            ok: true
        });

    } catch (error) {
        console.error("Unified Reset Password Error:", error);
        return res.status(500).json({ message: "Server error. Please try again later.", ok: false });
    }
};