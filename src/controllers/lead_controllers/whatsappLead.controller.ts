import { Request, Response } from 'express';
import OrganizationModel from '../../models/organization models/organization.model';
import { WhatsAppLeadModel } from '../../models/lead_model/whatsappLead_model/whatsappLead.model';
// import { WhatsAppLeadModel } from '../../models/WhatsAppLeadModel';
// import { OrganizationModel } from '../../models/OrganizationModel';

// ==========================================
// 1. WEBHOOK CONTROLLERS (META INTEGRATION)
// ==========================================

export const verifyWhatsAppWebhook = async (req: Request, res: Response): Promise<void> => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
        console.log("WA_WEBHOOK_VERIFIED");
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
};

export const handleWhatsAppWebhook = async (req: Request, res: Response): Promise<void> => {
    const body = req.body;

    // WhatsApp Cloud API sends the object as "whatsapp_business_account"
    if (body.object === 'whatsapp_business_account') {
        try {
            for (const entry of body.entry) {
                const changes = entry.changes[0];
                const value = changes.value;

                // Ensure this is an actual message, not just a "read" or "delivered" status update
                if (value.messages && value.messages.length > 0) {
                    const phoneNumberId = value.metadata.phone_number_id; // Identifies the Tenant
                    const message = value.messages[0];
                    const contact = value.contacts[0];

                    const customerPhone = message.from; // The user messaging you
                    const customerName = contact.profile.name;
                    const messageText = message.type === 'text' ? message.text.body : "Sent an attachment/media";
                    const waMessageId = message.id;

                    // 1. Find the Organization
                    const org = await OrganizationModel.findOne({ whatsappPhoneNumberId: phoneNumberId });
                    if (!org) continue;

                    // 2. Save or Update the Lead
                    await WhatsAppLeadModel.findOneAndUpdate(
                        { phoneNumber: customerPhone, organizationId: org._id },
                        { 
                            customerName: customerName,
                            initialInquiry: messageText, // Or create a lastMessage field in your schema
                            waMessageId: waMessageId,
                            $setOnInsert: { status: "New" } // Aligning with your Kanban stages
                        },
                        { upsert: true, new: true }
                    );
                }
            }
            res.status(200).send('EVENT_RECEIVED');
            return;
        } catch (error) {
            console.error("WA Webhook Error:", error);
            res.sendStatus(500);
            return;
        }
    }
    res.sendStatus(404);
};

// ==========================================
// 2. UI CONTROLLERS (KANBAN / TABLE)
// ==========================================

// ==========================================
// 0. DUMMY DATA GENERATOR (For UI Testing)
// ==========================================
const generateDummyWALeads = (organizationId: string) => {
    const firstNames = ["Suresh", "Lakshmi", "Karan", "Divya", "Rajesh", "Meera", "Manoj", "Aarti", "Gaurav", "Nisha", "Deepak", "Swati", "Nitin", "Kriti", "Vivek"];
    const lastNames = ["Menon", "Krishnan", "Patil", "Desai", "Joshi", "Bhatt", "Chauhan", "Varma", "Chawla", "Malhotra", "Kapur", "Pandey", "Chatterjee", "Banerjee", "Bose"];
    const statuses = ['New', 'Contacted', 'Interested', 'Not Interested', 'Converted'];
    const messages = [
        "Hello, I need an estimate for a 2BHK interior.",
        "Could you please share your catalog?",
        "Do you handle civil work as well?",
        "I have attached the floor plan.", // Simulating media context
        "What is your starting price for modular kitchens?",
        "Hi, are you available for a call?",
        "We want to renovate our office space.",
        "Can you send some previous work photos?",
        "Interested in false ceiling designs.",
        "Please call me back when free.",
        "Do you provide a 3D design before starting?",
        "I saw your WhatsApp ad, looking for details.",
        "Do you work in Navi Mumbai?",
        "What brands of plywood do you use?",
        "Just wanted to know the consultation fees."
    ];

    const dummyLeads = [];
    const now = new Date();

    for (let i = 1; i <= 60; i++) {
        const fName = firstNames[i % firstNames.length];
        const lName = lastNames[i % lastNames.length];
        const randomDaysAgo = Math.floor(Math.random() * 30);
        const createdAt = new Date(now.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000);
        
        // Generate a realistic Indian mobile number format
        const randomPhoneSuffix = Math.floor(10000000 + Math.random() * 90000000); 
        const phoneNumber = `91${(i % 4) + 6}${randomPhoneSuffix}`; // Starts with 91, then 6,7,8, or 9

        dummyLeads.push({
            _id: `dummy_wa_lead_${i}`,
            organizationId: organizationId,
            phoneNumber: phoneNumber,
            customerName: `${fName} ${lName}`,
            initialInquiry: messages[i % messages.length],
            waMessageId: `wamid.HBgLOTE${phoneNumber}==`, // Looks like a real WhatsApp ID
            status: statuses[i % statuses.length],
            createdAt: createdAt.toISOString(),
            updatedAt: new Date(createdAt.getTime() + 3600000).toISOString() // 1 hour later
        });
    }

    // Sort newest first
    return dummyLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};


export const getAllWhatsAppLeads = async (req: any, res: Response): Promise<any> => {
    try {
        const { page = 1, limit = 10, status, startDate, endDate, organizationId } = req.query;

        const query: any = { organizationId: organizationId };

        // 1. Get the 60 dummy leads
        // let leads = generateDummyWALeads(organizationId as string || "YOUR_ORG_ID_HERE");

        if (status) query.status = status;

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate as string);
            if (endDate) query.createdAt.$lte = new Date(endDate as string);
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [leads, total] = await Promise.all([
            WhatsAppLeadModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            WhatsAppLeadModel.countDocuments(query)
        ]);

        // 3. Apply Pagination to Dummy Data
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
        return res.status(500).json({ ok: false, message: "Server error fetching WA leads" });
    }
};

export const getWhatsAppLeadById = async (req: any, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const lead = await WhatsAppLeadModel.findOne({ _id: id }); // Add orgId check in production
        
        
        if (!lead) return res.status(404).json({ ok: false, message: "Lead not found" });
        
        // const organizationId = "sj.dlsk;slkjksld"
        //  let leads = generateDummyWALeads(organizationId as string || "YOUR_ORG_ID_HERE");

        // let lead = leads.find(ele => ele._id === id)



        return res.status(200).json({ ok: true, data: lead });
    } catch (error) {
        return res.status(500).json({ ok: false, message: "Error fetching WA lead details" });
    }
};

export const updateWhatsAppLeadStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updatedLead = await WhatsAppLeadModel.findOneAndUpdate(
            { _id: id },
            { status },
            { new: true }
        );

        if (!updatedLead) return res.status(404).json({ ok: false, message: "Lead not found" });

        return res.status(200).json({ ok: true, message: `Lead moved to ${status}`, data: updatedLead });
    } catch (error) {
        return res.status(500).json({ ok: false, message: "Update failed" });
    }
};