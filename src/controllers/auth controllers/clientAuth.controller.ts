import { Request, Response } from "express";
import ClientModel from "../../models/client model/client.model";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthenticatedClientRequest } from "../../types/types";
import crypto from 'crypto';
import sendResetEmail from "../../utils/forgotPasswordMail";
import { Types } from "mongoose";

const clientLogin = async (req: Request, res: Response) => {
    try {
        let { email, password } = req.body

        let isTokenExists = req.cookies.clientaccesstoken

        if (isTokenExists) {
            return res.status(403).json({ error: true, message: "Client Already logged in", ok: false });
        }

        if (!email || !password) {
            res.status(404).json({ message: "please provide the input properly", error: true, ok: false })
        }

        const client = await ClientModel.findOne({ email: email })

        if (!client) {
            return res.status(404).json({ message: "invalid credentials", error: true, ok: false })
        }

        const isMatching = await bcrypt.compare(password, client?.password)

        if (!isMatching) {
            return res.status(404).json({ message: "invalid credentials", error: true, ok: false })
        }


        let token = jwt.sign({ _id: client._id, role: client.role, clientName: client.clientName, ownerId: client.ownerId }, process.env.JWT_CLIENT_ACCESS_SECRET as string, { expiresIn: "1d" })
        let refreshToken = jwt.sign({ _id: client._id, role: client.role, clientName: client.clientName, ownerId: client.ownerId }, process.env.JWT_CLIENT_REFRESH_SECRET as string, { expiresIn: "7d" })

        res.cookie("clientaccesstoken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24
        }
        )


        res.cookie("clientrefreshtoken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24 * 7
        }
        )

        res.status(200).json({
            message: `${client.clientName} loggedin successfull`, data: {
                clientId: client._id,
                clientName: client.clientName,
                email: client.email,
                phoneNo: client.phoneNo,
                role: "client"
            },
            ok: true, error: false
        })
    }
    catch (error) {
        console.log("error from cleintlogin", error)
        const err = error as Error;
        console.error(err.message);
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
            ok: false,
        });
    }
}


const clientLogout = async (req: Request, res: Response) => {
    try {
        res.clearCookie("clientaccesstoken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Only secure in production
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/", // Clear the cookie for the entire domain
        });

        res.clearCookie("clientrefreshtoken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Only secure in production
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/", // Clear the cookie for the entire domain
        });


        res.status(200).json({ message: "Logout successful", ok: true, error: false, });
        return;
    }
    catch (error) {
        console.log(error)
        res.status(500).json({ message: "internal server error", errormessage: error, ok: false, error: true });

    }
}

const registerClient = async (req: Request, res: Response) => {
    try {
        const { invite } = req.query;
        let { email, password, clientName, phoneNo } = req.body

        if (!invite) {
            return res.status(400).json({ ok: false, message: "Invite token is required" });
        }


        let decoded: any;
        try {
            decoded = JSON.parse(Buffer.from(invite as string, "base64").toString());
        } catch (err) {
            return res.status(400).json({ ok: false, message: "Invalid invite token" });
        }

        const { projectId, ownerId, expiresAt, role, organizationId } = decoded;

        if (!projectId || !Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ ok: false, message: "Invalid project ID in invite" });
        }

        if (expiresAt && new Date() > new Date(expiresAt)) {
            return res.status(410).json({ ok: false, message: "Invite link has expired" });
        }

        if (!email || !password || !clientName || !phoneNo) {
            res.status(400).json({ message: "email, password , client name and phone number is reequired", ok: false })
            return;
        }


        // const orConditions: Array<any> = [
        //     { email },
        //     { clientName },
        //     { phoneNo }
        // ];

        // Add phone check only if it's provided
        // if (phoneNo) {
        //     if (String(phoneNo).length !== 10) {
        //         return res.status(400).json({
        //             message: "Phone number should be exactly 10 digits",
        //             ok: false,
        //         });
        //     }
        //     orConditions.push({ phoneNo });
        // }

        // One DB call to check if any of the unique fields are already taken
        // const existingClient = await ClientModel.findOne({
        //     $or: [
        //         { projectId }, // Any client already assigned to this project
        //         {
        //             ownerId,
        //             $or: [
        //                 { email },
        //                 { phoneNo }
        //             ]
        //         }
        //     ]
        // });



        const existingClient = await ClientModel.findOne({
            $or: [
                // 1️⃣ Project already has any client
                { projectId },

                // 2️⃣ Same org AND project AND (same email OR phone)
                {
                    $and: [
                        { projectId },
                        { organizationId },
                        {
                            $or: [
                                { email },
                                { phoneNo }
                            ]
                        }
                    ]
                }
            ]
        });


        if (existingClient) {
            if (existingClient.projectId.toString() === projectId) {
                return res.status(400).json({
                    ok: false,
                    message: "A client is already assigned to this project.",
                });
            }

            if (existingClient.ownerId.toString() === ownerId && existingClient.email === email) {
                return res.status(400).json({
                    ok: false,
                    message: "A client with this email already exists ",
                });
            }

            if (existingClient.ownerId.toString() === ownerId && existingClient.clientName === clientName) {
                return res.status(400).json({
                    ok: false,
                    message: "A client with this name already exists",
                });
            }

            if (existingClient.ownerId.toString() === ownerId && existingClient.phoneNo === phoneNo) {
                return res.status(400).json({
                    ok: false,
                    message: "A client with this phone number already exists",
                });
            }


        }

        // if (existingClient) {
        //     // Determine exactly which field is duplicated
        //     if (existingClient.email === email) {
        //         return res.status(400).json({ message: "Email already in use", ok: false });
        //     }
        //     if (existingClient.clientName === clientName) {
        //         return res.status(400).json({ message: "Client name already in use", ok: false });
        //     }
        //     if (phoneNo && existingClient.phoneNo === phoneNo) {
        //         return res.status(400).json({ message: "Phone number already in use", ok: false });
        //     }
        // }



        const hashPassword = await bcrypt.hash(password, 10)

        const client = await ClientModel.create({
            email,
            password: hashPassword,
            clientName,
            phoneNo: phoneNo ?? null,
            role,
            organizationId: [organizationId],
            ownerId,
            projectId
        })

        let token = jwt.sign({ _id: client._id, clientName: client.clientName, role: client.role, ownerId: client.ownerId }, process.env.JWT_CLIENT_ACCESS_SECRET as string, { expiresIn: "1d" })
        let refreshToken = jwt.sign({ _id: client._id, clientName: client.clientName, role: client.role, ownerId: client.ownerId }, process.env.JWT_CLIENT_REFRESH_SECRET as string, { expiresIn: "7d" })

        res.cookie("clientaccesstoken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24
        }
        )

        res.cookie("clientrefreshtoken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24 * 7
        }
        )


        res.status(200).json({
            message: `${client.clientName} account created successfull`, ok: true, error: false, data: {
                _id: client._id,
                clientName: client.clientName,
                email: client.email,
                phoneNo: client.phoneNo,
                role: "client"
            }
        })

    }
    catch (error) {
        if (error instanceof Error) {
            console.log("erorr from register client", error)
            res.status(500).json({ message: "internal error ocuured", errorMssage: error, ok: false })
        }
    }
}

const clientRefreshToken = async (req: Request, res: Response) => {
    try {
        let refreshtoken = req.cookies.clientrefreshtoken

        if (!refreshtoken) {
            return res.status(400).json({ message: "no refresh token provided please login", ok: false })
        }

        let isDataExists = jwt.verify(refreshtoken, process.env.JWT_REFRESH_SECRET as string) as { _id: string };

        let isExists = await ClientModel.findById(isDataExists._id)

        if (!isExists) {
            return res.status(404).json({ message: "user not found", ok: false })
        }

        let clientaccesstoken = jwt.sign({ _id: isExists._id, clientName: isExists.clientName, role: isExists.role, ownerId: isExists.ownerId }, process.env.JWT_CLIENT_ACCESS_SECRET as string, { expiresIn: "1d" })

        res.cookie("clientaccesstoken", clientaccesstoken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24
        })

        res.status(200).json({ message: "access token generated", ok: true, error: false })

    }
    catch (error) {
        if (error instanceof Error) {
            console.log("erorr from client refreshtoken user", error)
            res.status(500).json({ message: "internal error ocuured", errorMssage: error, ok: false })
        }
    }
}

const isClientAuthenticated = async (req: AuthenticatedClientRequest, res: Response) => {
    try {
        const client = req.client

        const isExist = await ClientModel.findById(client._id).select(["clientName", "email", "phoneNo", "createdAt", "comapany", "updatedAt"])

        if (!isExist) {
            return res.status(404).json({ message: "client not found", ok: false })
        }

        res.status(200).json({
            data: {
                clientId: isExist._id,
                role: isExist.role,
                email: isExist.email,
                phoneNo: isExist.phoneNo,
                clientName: isExist.clientName,
                isauthenticated: true,
            }, message: "client is authenticated", ok: true
        })
    }
    catch (error) {
        if (error instanceof Error) {
            console.log("erorr from isAutneticated client", error)
            res.status(500).json({ message: "internal error ocuured", errorMssage: error, ok: false })
        }
    }
}

const clientForgotPassword = async (req: Request, res: Response): Promise<any> => {
    const { email } = req.body;

    // Check if the email exists in the database
    try {
        const client = await ClientModel.findOne({ email });

        if (!client) {
            return res.status(404).json({ message: 'client not found', error: true, ok: false });
        }

        // Generate a token for password reset (using crypto or JWT)
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Hash the token and store it in the database for later validation
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Store the hashed token and set an expiration time (1 hour)
        client.resetPasswordToken = hashedToken;
        client.resetPasswordExpire = (Date.now() + 3600000); // 1 hour in milliseconds

        await client.save();

        // Generate the password reset URL (ensure to use your real app's URL)
        let resetLink: string;

        if (process.env.NODE_ENV === "production") {
            resetLink = `https://www.verticalliving.com/reset-password?token=${resetToken}`;
        }
        else {
            resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
        }

        // Send the password reset email
        await sendResetEmail(client.email, client.clientName, resetLink);

        return res.status(200).json({
            message: 'Password reset email sent. Please check your registered email inbox.',
        });
    } catch (error) {
        console.error('Error handling forgot password request: ', error);
        return res.status(500).json({ message: 'Server error. Please try again later.', error: true, ok: false });
    }
};

const clientResetForgotPassword = async (req: Request, res: Response): Promise<any> => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ message: "Invalid request. Token and password are required.", error: true, ok: false });
    }


    try {
        // Hash the received token to match the stored one
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        // Find the user with the provided reset token (and check if it’s not expired)
        const client = await ClientModel.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }, // Ensure token is not expired
        });

        if (!client) {
            return res.status(400).json({ message: "Invalid or expired token.", error: true, ok: false });
        }


        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        client.password = await bcrypt.hash(password, salt);

        // Clear the reset token fields
        client.resetPasswordToken = undefined;
        client.resetPasswordExpire = undefined;

        // Save the updated client data
        await client.save();

        return res.status(200).json({ message: "Password reset successful. You can now log in.", error: false, ok: true });
    } catch (error) {
        console.error("Error resetting password:", error);
        return res.status(500).json({ message: "Server error. Please try again later.", error: true, ok: false });
    }
}

const updateClientProfile = async (req: AuthenticatedClientRequest, res: Response): Promise<any> => {
    try {
        const clientId = req.client?._id;
        const { clientName, phoneNo, location } = req.body;

        if (!clientName && !phoneNo && !location) {
            return res.status(400).json({ ok: false, message: "At least one field (clientName, phoneNo, or location) is required to update.", });
        }

        const client = await ClientModel.findById(clientId);

        if (!client) {
            return res.status(404).json({ ok: false, message: "Client not found" });
        }

        // Check if phone number is valid and not used by another client under same owner
        if (phoneNo && phoneNo !== client.phoneNo) {
            if (String(phoneNo).length !== 10) {
                return res.status(400).json({ ok: false, message: "Phone number must be exactly 10 digits", });
            }

            const phoneTaken = await ClientModel.findOne({
                phoneNo,
                ownerId: client.ownerId,
                _id: { $ne: clientId }
            });

            if (phoneTaken) {
                return res.status(400).json({ ok: false, message: "Phone number already in use by another client under this owner", });
            }

            client.phoneNo = phoneNo;
        }

        if (clientName) client.clientName = clientName;
        if (location) client.location = location;

        await client.save();

        return res.status(200).json({ ok: true, message: "Client profile updated successfully", data: client, });

    } catch (err) {
        console.error("Error updating client profile:", err);
        return res.status(500).json({
            ok: false,
            message: "Server error",
        });
    }
};


const deleteClient = async (req: Request, res: Response): Promise<any> => {
    try {

        let { clientId } = req.params
        const client = await ClientModel.findByIdAndDelete(clientId)

        return res.status(200).json({ message: "clientId deleted successful. You can now log in.", error: false, ok: true, data: client });

    }
    catch (error) {
        console.error("Error deleting client:", error);
        return res.status(500).json({ message: "Server error. Please try again later.", error: true, ok: false });
    }
}

export {
    clientLogin,
    clientLogout,
    registerClient,
    clientRefreshToken,
    isClientAuthenticated,
    clientForgotPassword,
    clientResetForgotPassword,
    updateClientProfile,
    deleteClient
}