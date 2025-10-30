import { Request, Response } from "express";
import { OrderShopDetailsLibModel } from "../../../models/Stage Models/Ordering Material Model/OrderShopLibrary.model";


export const createShopLib = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.params;
        const { shopName, address, contactPerson, phoneNumber } = req.body;

        if (!organizationId) {
            return res.status(400).json({ ok: false, message: "organizationId is required." });
        }

        if (!shopName || !shopName.trim()) {
            return res.status(400).json({ ok: false, message: "Shop name is required." });
        }



        if (phoneNumber && (!/^\d{10}$/.test(phoneNumber))) {
            return res.status(400).json({ ok: false, message: "Phone number must be exactly 10 digits." });
        }


        const orderingDoc = await OrderShopDetailsLibModel.create(
            {
                organizationId,
                shopName: shopName?.trim() || null,
                address: address?.trim() || null,
                contactPerson: contactPerson?.trim() || null,
                phoneNumber: phoneNumber?.trim() || null,
            }
        );


        res.status(201).json({ ok: true, message: "Shop Created", data: orderingDoc });
    }
    catch (error: any) {
        console.error("Error creating the  shop details", error);
        return res.status(500).json({ message: "Server error", ok: false });
    }
};



export const updateShopLib = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { shopName, address, contactPerson, phoneNumber } = req.body;

        if (!id) {
            return res.status(400).json({ ok: false, message: "shop id is required." });
        }

        if (!shopName && !shopName?.trim()) {
            return res.status(400).json({ ok: false, message: "Shop name is required." });
        }


        if (phoneNumber?.trim() && phoneNumber.length !== 10) {
            return res.status(400).json({ ok: false, message: "Phone Number should be 10 digits" });
        }

        const orderingDoc = await OrderShopDetailsLibModel.findByIdAndUpdate(id,
            {
                shopName,
                address,
                contactPerson,
                phoneNumber
            }, { returnDocument: "after" }
        );

        if (!orderingDoc) {
            return res.status(404).json({ ok: false, message: "Shop not found." });
        }


        res.status(200).json({ ok: true, message: "Shop updated", data: orderingDoc });
    }
    catch (error: any) {
        console.error("Error updatinthe shop details", error);
        return res.status(500).json({ message: "Server error", ok: false });
    }
};





export const getShopLib = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.params;

        if (!organizationId) {
            return res.status(400).json({ ok: false, message: "organizationId is required." });
        }

        const orderingDoc = await OrderShopDetailsLibModel.find({ organizationId });


        res.status(200).json({ ok: true, message: "Shop fetched successfully", data: orderingDoc });
    }
    catch (error: any) {
        console.error("Error fetching shop details form ordering room", error);
        return res.status(500).json({ message: "Server error", ok: false });
    }
};







export const deleteShopLib = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ ok: false, message: "shop id is required." });
        }

        const orderingDoc = await OrderShopDetailsLibModel.findByIdAndDelete(id);

        if (!orderingDoc) {
            return res.status(404).json({ ok: false, message: "Shop not found." });
        }



        res.status(200).json({ ok: true, message: "Shop deleted", data: orderingDoc });
    }
    catch (error: any) {
        console.error("Error deleting shop details form ordering room", error);
        return res.status(500).json({ message: "Server error", ok: false });
    }
};

