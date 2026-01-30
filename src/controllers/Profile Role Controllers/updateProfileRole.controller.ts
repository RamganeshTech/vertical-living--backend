import { Request, Response } from "express";
import UserModel from "../../models/usermodel/user.model";
import ClientModel from "../../models/client model/client.model";
import StaffModel from "../../models/staff model/staff.model";
import CTOModel from "../../models/CTO model/CTO.model";
import { WorkerModel } from "../../models/worker model/worker.model";
import { RoleBasedRequest } from "../../types/types";
import redisClient from "../../config/redisClient";
import { Model } from "mongoose";

export const updateProfile = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const user = req.user; // your auth middleware must attach user { _id, role }
        const { email, phoneNo, name } = req.body;

        if (!user || !user.role) {
            return res.status(401).json({ ok: false, message: "Unauthorized" });
        }

        // role → model map
        const roleModelMap: Record<string, any> = {
            owner: UserModel,
            client: ClientModel,
            staff: StaffModel,
            CTO: CTOModel,
            worker: WorkerModel,
        };

        const Model = roleModelMap[user.role];
        if (!Model) {
            return res.status(400).json({ ok: false, message: "Invalid role." });
        }



        // 1. GLOBAL UNIQUE CHECK (Email & Phone)
        // Ensure the new email or phone isn't used by ANYONE ELSE in ANY table
        if (email || phoneNo) {
            const allModels:Model<any>[] = [UserModel, StaffModel, WorkerModel, CTOModel, ClientModel];
            
            for (const model of allModels) {
                const query: any = {
                    $or: [],
                    // Critically: if it's the same model as the current user, 
                    // exclude the current user's ID from the search
                    _id: { $ne: user._id } 
                };

                if (email) query.$or.push({ email });
                if (phoneNo) query.$or.push({ phoneNo });

                const existingUser:any = await model.findOne(query).lean();

                if (existingUser) {
                    const conflictField = existingUser.email === email ? "Email" : "Phone Number";
                    return res.status(400).json({
                        ok: false,
                        message: `${conflictField} is already taken by another user.`,
                    });
                }
            }
        }



        // build dynamic update object
        const updateFields: Record<string, any> = {};
        if (email) updateFields.email = email;
        if (phoneNo) updateFields.phoneNo = phoneNo;

        // each model uses different name field
        if (name) {
            switch (user.role) {
                case "owner":
                    updateFields.username = name;
                    updateFields.phoneNo = phoneNo
                    updateFields.email = email
                    break;
                case "client":
                    updateFields.clientName = name;
                    updateFields.phoneNo = phoneNo
                    updateFields.email = email
                    break;
                case "staff":
                    updateFields.staffName = name;
                    updateFields.phoneNo = phoneNo
                    updateFields.email = email
                    break;
                case "CTO":
                    updateFields.CTOName = name;
                    updateFields.phoneNo = phoneNo
                    updateFields.email = email
                    break;
                case "worker":
                    updateFields.workerName = name;
                    updateFields.phoneNo = phoneNo
                    updateFields.email = email
                    break;
            }
        }


        // Check for email uniqueness within the same model
        // if (email) {
        //     const existingEmail = await Model.findOne({
        //         email,
        //         _id: { $ne: user._id }, // exclude self
        //     });

        //     if (existingEmail) {
        //         return res.status(400).json({
        //             ok: false,
        //             message: "Email already exists. Please use a different one.",
        //         });
        //     }
        // }


        // update document
        const updatedUser = await Model.findByIdAndUpdate(
            user._id,
            { $set: updateFields },
            { new: true }
        ).select("-password");


        let data;

        switch (user?.role) {
            case "owner":
                data = {
                    userId: updatedUser._id,
                    role: updatedUser.role,
                    email: updatedUser.email,
                    phoneNo: updatedUser.phoneNo,
                    userName: updatedUser.username,
                    isauthenticated: true,
                }
                break;
            case "client":
                data = {
                    clientId: updatedUser._id,
                    role: updatedUser.role,
                    email: updatedUser.email,
                    phoneNo: updatedUser.phoneNo,
                    clientName: updatedUser.clientName,
                    isauthenticated: true,
                }
                break;
            case "staff":
                data = {
                    staffId: updatedUser._id,
                    role: updatedUser.role,
                    email: updatedUser.email,
                    phoneNo: updatedUser.phoneNo,
                    staffName: updatedUser.staffName,
                    isauthenticated: true,
                }
                break;
            case "CTO":
                data = {
                    CTOId: updatedUser._id,
                    role: updatedUser.role,
                    email: updatedUser.email,
                    phoneNo: updatedUser.phoneNo,
                    CTOName: updatedUser.CTOName,
                    isauthenticated: true,
                }
                break;
            case "worker":
                data = {
                    workerId: updatedUser._id,
                    role: updatedUser.role,
                    email: updatedUser.email,
                    phoneNo: updatedUser.phoneNo,
                    workerName: updatedUser.workerName,
                    isauthenticated: true,
                }
                break;
        }

        if (!updatedUser) {
            return res.status(404).json({ ok: false, message: "User not found." });
        }

        const redisUserKey = `userAuth:${user?._id}`
        await redisClient.set(redisUserKey, JSON.stringify(data), { EX: 60 * 10 })


        return res.status(200).json({
            ok: true,
            message: "Profile updated successfully.",
            data: updatedUser,
        });

    } catch (error) {
        console.error("Update Profile Error:", error);
        return res.status(500).json({ ok: false, message: "Server error." });
    }
};
