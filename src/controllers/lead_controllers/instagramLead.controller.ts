import { Request, Response } from 'express';
import { InstagramLeadModel } from '../../models/lead_model/instagramLead_model/instagramLead.model';
import OrganizationModel from '../../models/organization models/organization.model';
import axios from 'axios';

// import { InstagramLeadModel } from '../models/InstagramLeadModel';
// import { OrganizationModel } from '../models/OrganizationModel';

/**
 * GET /api/v1/webhooks/instagram
 * Meta Verification Handshake
 */
export const verifyInstagramWebhook = async (req: Request, res: Response): Promise<any> => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Use a secret string stored in your .env
    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
        console.log("WEBHOOK_VERIFIED");
        return res.status(200).send(challenge);
    } else {
        return res.sendStatus(403);
    }
};

/**
 * POST /api/v1/webhooks/instagram
 * Actual Event Listener
 */

// export const handleInstagramWebhook = async (req: Request, res: Response): Promise<any> => {
//     const body = req.body;

//     // Check if this is an Instagram message event
//     if (body.object === 'instagram') {
//         try {
//             for (const entry of body.entry) {
//                 const pageId = entry.id; // The ID of the FB Page linked to IG
//                 const webhookEvent = entry.messaging[0];
//                 const senderId = webhookEvent.sender.id; // The unique Instagram PSID
//                 const messageText = webhookEvent.message?.text;

//                 if (!messageText) continue;

//                 // 1. Identify which Organization this belongs to
//                 const org = await OrganizationModel.findOne({ facebookPageId: pageId });
//                 if (!org) {
//                     console.error(`Organization not found for Page ID: ${pageId}`);
//                     continue;
//                 }

//                 // 2. Upsert the Lead (Update if exists, Create if new)
//                 await InstagramLeadModel.findOneAndUpdate(
//                     { senderId: senderId, organizationId: org._id },
//                     { 
//                         lastMessageText: messageText,
//                         // If you have the Meta Access Token, you can call 
//                         // the Graph API here to get their Full Name/Handle
//                         $setOnInsert: { status: "New" } 
//                     },
//                     { upsert: true, new: true }
//                 );
//             }

//             return res.status(200).send('EVENT_RECEIVED');
//         } catch (error) {
//             console.error("IG Webhook Error:", error);
//             return res.sendStatus(500);
//         }
//     } else {
//         return res.sendStatus(404);
//     }
// };

// Inside instagramLead.controller.ts

const getInstagramUserProfile = async (senderId: string, pageAccessToken: string) => {
    try {
        const url = `https://graph.facebook.com/v19.0/${senderId}?fields=name,username&access_token=${pageAccessToken}`;
        const response = await axios.get(url);
        return response.data; // Returns { name: "...", username: "..." }
    } catch (error) {
        console.error("Error fetching IG profile:", error);
        return null;
    }
};

export const handleInstagramWebhook = async (req: Request, res: Response): Promise<any> => {
    const body = req.body;

    if (body.object === 'instagram') {
        try {
            for (const entry of body.entry) {
                const pageId = entry.id;
                const webhookEvent = entry.messaging[0];
                const senderId = webhookEvent.sender.id;
                const messageText = webhookEvent.message?.text;

                if (!messageText) continue;

                // 1. Find the Organization and their Access Token
                const org = await OrganizationModel.findOne({ facebookPageId: pageId });
                if (!org || !org.metaAccessToken) continue;

                // 2. Point B: Get actual name/username from Meta
                const profile = await getInstagramUserProfile(senderId, org.metaAccessToken);

                // 3. Save to your new model
                await InstagramLeadModel.findOneAndUpdate(
                    { senderId: senderId, organizationId: org._id },
                    {
                        igUsername: profile?.username || "unknown",
                        fullName: profile?.name || "Instagram User",
                        lastMessageText: messageText,
                        $setOnInsert: { status: "New" }
                    },
                    { upsert: true }
                );
            }
            return res.status(200).send('EVENT_RECEIVED');
        } catch (error) {
            return res.sendStatus(500);
        }
    }
    res.sendStatus(404);
};

// --- DUMMY DATA GENERATOR (For UI Testing) ---
const generateDummyLeads = (organizationId: string) => {
    const firstNames = ["Rahul", "Priya", "Amit", "Sneha", "Karthik", "Anjali", "Vikram", "Neha", "Arjun", "Pooja", "Siddharth", "Kavya", "Rohan", "Shruti", "Aditya"];
    const lastNames = ["Sharma", "Patel", "Reddy", "Singh", "Kumar", "Iyer", "Rao", "Das", "Nair", "Pillai", "Gowda", "Menon", "Jain", "Bose", "Gupta"];
    const statuses = ['New', 'Contacted', 'Interested', 'Not Interested', 'Converted'];
    const messages = [
        "Hi, I'm interested in a 3BHK interior quote.",
        "Can you share your portfolio?",
        "What is the cost per sqft for Core finish?",
        "Do you do modular kitchens?",
        "I saw your ad on Instagram, looks great!",
        "Is the consultation free?",
        "Can we schedule a site visit this weekend?",
        "Please send me the pricing brochure.",
        "We are getting possession next month.",
        "Looking for wardrobe designs.",
        "Do you work in South Chennai?",
        "I have a 1600 sqft apartment. Rough estimate?",
        "Hi, do you provide EMI options?",
        "Can you replicate a Pinterest design?",
        "Just browsing, thanks."
    ];

    const dummyLeads = [];
    const now = new Date();

    for (let i = 1; i <= 60; i++) {
        const fName = firstNames[i % firstNames.length];
        const lName = lastNames[i % lastNames.length];
        const randomDaysAgo = Math.floor(Math.random() * 30); // Spread over last 30 days
        const createdAt = new Date(now.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000);

        dummyLeads.push({
            _id: `dummy_lead_${i}`,
            organizationId: organizationId,
            senderId: `100200300${i}`,
            igUsername: `${fName.toLowerCase()}_${lName.toLowerCase()}${i}`,
            fullName: `${fName} ${lName}`,
            lastMessageText: messages[i % messages.length],
            status: statuses[i % statuses.length],
            createdAt: createdAt.toISOString(),
            updatedAt: new Date(createdAt.getTime() + 3600000).toISOString() // 1 hour later
        });
    }

    // Sort newest first
    return dummyLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getAllInstagramLeads = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            startDate,
            endDate,
            organizationId
        } = req.query;

        // Multi-tenant check: always filter by the logged-in user's organization
        const query: any = { organizationId: organizationId };

        // let leads = generateDummyLeads(organizationId as string || "YOUR_ORG_ID_HERE");

        // 1. Stage/Status Filter (for Kanban columns)
        if (status) {
            query.status = status;
        }

        // 2. Date Range Filter
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate as string);
            if (endDate) query.createdAt.$lte = new Date(endDate as string);
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [leads, total] = await Promise.all([
            InstagramLeadModel.find(query)
                .sort({ createdAt: -1 })
                .skip(skip) 
                .limit(Number(limit)),
            InstagramLeadModel.countDocuments(query)
        ]);

        // 3. Apply Pagination (Simulating MongoDB .skip() and .limit())
        // const total = leads.length;
        // const skip = (Number(page) - 1) * Number(limit);
        // const paginatedLeads = leads.slice(skip, skip + Number(limit));

        return res.status(200).json({
            ok: true,
            data: leads,
            pagination: {
                totalLeads: total,
                totalPages: Math.ceil(total / Number(limit)),
                currentPage: Number(page)
            }
        });

    } catch (error) {
        console.error("Fetch Leads Error:", error);
        return res.status(500).json({ ok: false, message: "Server error fetching leads" });
    }
};

export const getInstagramLeadById = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        const organizationId = "sj.dlsk;slkjksld"
        // Ensure the ID exists and belongs to this organization
        let lead: any = await InstagramLeadModel.findOne({
            _id: id,
            // organizationId: req.user.organizationId 
        });

        // let leads = generateDummyLeads(organizationId as string || "YOUR_ORG_ID_HERE");

        // let lead = leads.find(ele => ele._id === id)


        if (!lead) {
            return res.status(404).json({ ok: false, message: "Lead not found" });
        }

        return res.status(200).json({
            ok: true,
            data: lead
        });

    } catch (error) {
        console.error("Fetch Single Lead Error:", error);
        return res.status(500).json({ ok: false, message: "Error fetching lead details" });
    }
};

export const updateInstagramLeadStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updatedLead = await InstagramLeadModel.findOneAndUpdate(
            { _id: id, },
            { status },
            { new: true }
        );

        if (!updatedLead) {
            return res.status(404).json({ ok: false, message: "Lead not found" });
        }

        return res.status(200).json({
            ok: true,
            message: `Lead moved to ${status}`,
            data: updatedLead
        });
    } catch (error) {
        return res.status(500).json({ ok: false, message: "Update failed" });
    }
};