// controllers/shortlistedDesign.controller.ts

import { Request, Response } from "express";
import { Types } from "mongoose";
import { ShortlistedDesignModel } from "../../../models/Stage Models/sampleDesing model/shortListed.model";
import { RoleBasedRequest } from "../../../types/types";
import ClientModel from "../../../models/client model/client.model";
import { sendShortlistedDesignsEmail } from "../../../utils/Common Mail Services/ShortListMail";


const sendShortListMailUtil = async (projectId: Types.ObjectId | string, roomName: string, images: any[]) => {
    const client = await ClientModel.findOne({ projectId });
    if (!client || !client.email) {
        return;
    }

    // Step 2: Send email
    await sendShortlistedDesignsEmail({
        clientName: client.clientName,
        clientEmail: client.email,
        roomName,
        images,
    });

}

export const uploadShortlistedRoomImages = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId, roomName } = req.params;
        const files = req.files as Express.Multer.File[];

        if (!files?.length) {
            return res.status(400).json({ message: "No files uploaded", ok: false });
        }

        const imageFiles = files.filter((file) => file.mimetype.startsWith("image/"));

        // if (imageFiles.length !== files.length) {
        //   res.status(400).json({ message: "Only image files are allowed", ok: false });
        // }

        const uploads = imageFiles.map((file) => ({
            _id: new Types.ObjectId(),
            type: "image" as const,
            url: (file as any).location,
            imageId: null,
            originalName: file.originalname,
            uploadedAt: new Date(),
        }));

        let doc = await ShortlistedDesignModel.findOne({ projectId });

        // If no document exists for the project, create a new one
        if (!doc) {
            doc = new ShortlistedDesignModel({
                projectId,
                shortlistedRooms: [{ roomName, designs: uploads }],
            });
        } else {
            // Find the room entry
            const roomEntry = doc.shortlistedRooms.find((room) => room.roomName === roomName);

            if (roomEntry) {
                roomEntry.designs.push(...uploads);
            } else {
                doc.shortlistedRooms.push({ roomName, designs: uploads });
            }
        }

        await doc.save();

          const imageToclient =  doc.shortlistedRooms.find((room) => room.roomName === roomName)?.designs.map(room=> room.url)

        // const imageUrls = uploads.map((image: any) => image.url)

        if(imageToclient){
            await sendShortListMailUtil(projectId, roomName, imageToclient)
        }
        res.status(200).json({ message: "Images uploaded successfully", data: uploads, ok: true });
    } catch (error) {
        console.error("Error uploading images:", error);
        res.status(500).json({ message: "Internal server error", ok: false });
    }
};


export const addSelectedDesignsToShortlist = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId, roomName } = req.params;
        const { selectedImages } = req.body;

        if (!roomName || !Array.isArray(selectedImages) || !selectedImages.length) {
            return res.status(400).json({ message: "Invalid data", ok: false });
        }

        const shortlist = await ShortlistedDesignModel.findOne({ projectId });

        if (!shortlist) {
            return res.status(404).json({ message: "Shortlist not found", ok: false });
        }

        const room = shortlist.shortlistedRooms.find((room) => room.roomName === roomName);
        // Always generate newDesigns
        const newDesigns = selectedImages.map((img: any) => ({
            _id: new Types.ObjectId(),
            type: "image" as const,
            url: img.url,
            originalName: img.originalName,
            imageId: img._id || null,
            uploadedAt: new Date()
        }));


        if (!room) {
            // If room does not exist, create it and push selected designs
            shortlist.shortlistedRooms.push({
                roomName,
                designs: newDesigns
            });
        } else {
            // Push to existing room but avoid duplicates based on imageId or url
            const existingUrls = new Set(room.designs.map((d) => d.url));
            const filteredDesigns = newDesigns.filter((d) => !existingUrls.has(d.url));

            // newDesigns = selectedImages
            //     .filter((img: any) => !existingUrls.has(img.url))
            //     .map((img: any) => ({
            //         _id: new Types.ObjectId(),
            //         type: "image" as const,
            //         url: img.url,
            //         originalName: img.originalName,
            //         imageId: img._id || null,
            //         uploadedAt: new Date()
            //     }));

            room.designs.push(...filteredDesigns);
        }

        await shortlist.save();

          const imageToclient =  shortlist.shortlistedRooms.find((room) => room.roomName === roomName)?.designs.map(room=> room.url)

          
        // const imageUrls = newDesigns.map((image: any) => image.url)
        if(imageToclient){
            await sendShortListMailUtil(projectId, roomName, imageToclient)
        }

        return res.status(200).json({ message: "Designs added successfully", ok: true });
    } catch (error) {
        console.error("Error adding selected designs", error);
        return res.status(500).json({ message: "Server error", ok: false });
    }
};

export const syncShortList = async (projectId: string | Types.ObjectId) => {
    await ShortlistedDesignModel.create({
        projectId,
        shortlistedRooms: []
    })
}


export const removeShortlistedDesign = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId, roomName, _id } = req.params;


        if (!_id) {
            return res.status(400).json({ message: "_id of the image is required", ok: false });
        }

        const doc = await ShortlistedDesignModel.findOneAndUpdate(
            { projectId, "shortlistedRooms.roomName": roomName },
            {
                $pull: {
                    "shortlistedRooms.$.designs": { _id },
                },
            },
            { new: true }
        );

        if (!doc) {
            return res.status(404).json({ message: "Shortlist record not found", ok: false });
        }

        return res.status(200).json({ message: "Design removed successfully", ok: true, data: doc });
    } catch (error) {
        console.error("Error removing design:", error);
        return res.status(500).json({ message: "Internal server error", ok: false });
    }
};




// controllers/shortlistedDesign.controller.ts

export const getShortlistedRoomDesigns = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { projectId, roomName } = req.params;

        const doc = await ShortlistedDesignModel.findOne({ projectId });

        if (!doc) {
            return res.status(404).json({ message: "No shortlisted designs found", ok: false });
        }

        // const room = doc.shortlistedRooms.find((r) => r.roomName === roomName);

        // if (!room) {
        //   return res.status(404).json({ message: "Room not found in shortlist", ok: false });
        // }
        // console.log("geting rooms", doc)
        return res.status(200).json({ ok: true, data: doc });
    } catch (error) {
        console.error("Error fetching shortlisted room designs:", error);
        return res.status(500).json({ message: "Internal server error", ok: false });
    }
};
