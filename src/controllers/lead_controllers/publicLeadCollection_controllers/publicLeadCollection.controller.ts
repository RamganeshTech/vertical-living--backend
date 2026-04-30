import { Request, Response } from 'express';
import PublicLeadCollectionModel from '../../../models/lead_model/publicLeadCollection_model/publicLeadcollection.model';

import dotenv from "dotenv"
dotenv.config()

/**
 * CREATE: Save a new lead from the Inquiry Form
 */

const VERTICAL_LIVING_ORG_ID = process.env.VERTICAL_LIVING_ORG_ID;

export const createPublicLead = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            fullName, mobileNumber, projectCategory,
            propertyType, budget, location, timeline, serviceType
        } = req.body;

        console.log("req.body from the ublic tell us about ur project", req.body)




        const newLead = new PublicLeadCollectionModel({
            organizationId: VERTICAL_LIVING_ORG_ID,
            fullName,
            mobileNumber,
            projectCategory,
            propertyType,
            budget,
            location,
            timeline,
            serviceType
        });

        await newLead.save();

        res.status(201).json({
            ok: true,
            message: "Inquiry submitted successfully",
            data: newLead
        });

    } catch (error: any) {
        console.log("error", error)
        res.status(500).json({ ok: false, message: error.message });
    }
};

/**
 * GET ALL: Retrieve leads with filters (Search, Date, Category)
 */
export const getAllPublicLeads = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, search, startDate, endDate, projectCategory } = req.query;

        if (!organizationId) {
            return res.status(400).json({ ok: false, message: "Organization ID is required" });
        }

        const query: any = { organizationId };

        // 1. Search Logic (Name, Phone, Lead Number)
        if (search) {
            const searchRegex = new RegExp(String(search), 'i');
            query.$or = [
                { fullName: searchRegex },
                { mobileNumber: searchRegex },
                { leadNumber: searchRegex },
                { location: searchRegex }
            ];
        }

        // 2. Project Category Filter
        if (projectCategory) {
            query.projectCategory = projectCategory;
        }

        // 3. Date Range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(String(startDate));
            if (endDate) {
                const end = new Date(String(endDate));
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const leads = await PublicLeadCollectionModel.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            ok: true,
            count: leads.length,
            data: leads
        });
    } catch (error: any) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

/**
 * GET SINGLE: Retrieve one lead by ID
 */
export const getSinglePublicLead = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { organizationId } = req.query;

        const lead = await PublicLeadCollectionModel.findOne({ _id: id, organizationId });

        if (!lead) {
            return res.status(404).json({ ok: false, message: "Lead not found" });
        }

        res.status(200).json({ ok: true, data: lead });
    } catch (error: any) {
        res.status(500).json({ ok: false, message: error.message });
    }
};