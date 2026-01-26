import { Request, Response } from 'express';
import CutlistModel from '../../models/Cutlist_model/cutlist.model';
import { generateCutlistPDF } from './pdfCutlistcontroller';
import { COMPANY_LOGO, COMPANY_NAME } from '../stage controllers/ordering material controller/pdfOrderHistory.controller';










// Helper to handle the file mapping logic
const processRoomsWithImages = (roomsArray: any[], fileMap: Record<string, any>) => {
    return roomsArray.map((room: any, index: number) => {
        // Keys used by frontend in FormData: e.g., "rooms[0].backSideLaminateImage"
        const backKey = `rooms[${index}].backSideLaminateImage`;
        const frontKey = `rooms[${index}].frontSideLaminateImage`;

        const backFile = fileMap[backKey];
        const frontFile = fileMap[frontKey];

        return {
            ...room,
            // If a new file is uploaded, use its S3 location. 
            // Otherwise, keep the existing URL if it's an update.
            backSideLaminateImage: backFile ? {
                type: "image",
                url: backFile.location,
                originalName: backFile.originalname,
                uploadedAt: new Date()
            } : (room.backSideLaminateImage || null),

            frontSideLaminateImage: frontFile ? {
                type: "image",
                url: frontFile.location,
                originalName: frontFile.originalname,
                uploadedAt: new Date()
            } : (room.frontSideLaminateImage || null),

            // Ensure sub-items are mapped correctly
            items: (room.items || []).map((item: any) => ({ ...item }))
        };
    });
};



export const saveCutlist = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.query; // Present for Update, absent for Create
        const { organizationId, projectId, clientId,

            quoteNo, // Add this
            quoteId  // Add this
        } = req.body;

        // 1. Mandatory Validation
        if (!organizationId) {
            return res.status(400).json({ ok: false, message: "Valid organizationId is required." });
        }

        // 2. Map Uploaded Files
        const files = req.files as any[];
        const fileMap: Record<string, any> = {};
        files?.forEach(file => {
            if (file.fieldname) fileMap[file.fieldname] = file;
        });

        // 3. Parse and Process Rooms
        // Frontend sends 'rooms' as a stringified JSON in FormData
        const rawRooms = JSON.parse(req.body.rooms || '[]');
        const processedRooms = processRoomsWithImages(rawRooms, fileMap);

        // 4. Extract Summary and other fields
        const summary = req.body.summary ? JSON.parse(req.body.summary) : {};
        const versionNo = req.body.versionNo || "1.0";
        const clientName = req.body.clientName || null;
        const location = req.body.location || null;

        // Clean up IDs: Convert "null" strings from FormData back to real nulls
        const cleanProjectId = (projectId === 'null' || projectId === '') ? null : projectId;
        const cleanQuoteId = (quoteId === 'null' || quoteId === '') ? null : quoteId;
        const cleanClientId = (clientId === 'null' || clientId === '') ? null : clientId;

        if (id) {
            // --- UPDATE LOGIC ---
            const existing = await CutlistModel.findById(id);
            if (!existing) return res.status(404).json({ ok: false, message: "Cutlist not found." });
            if (existing.isLocked) return res.status(403).json({ ok: false, message: "Cutlist is locked." });

            const updated = await CutlistModel.findByIdAndUpdate(
                id,
                {
                    $set: {
                        // projectId, clientId,
                        projectId: cleanProjectId,
                        clientId: cleanClientId,
                        quoteId: cleanQuoteId, // SAVING NOW
                        quoteNo: quoteNo || null, // SAVING NOW
                        versionNo, clientName,
                        location, rooms: processedRooms, summary
                    }
                },
                { new: true }
            );

            return res.status(200).json({ ok: true, message: "Updated", data: updated });
        } else {
            // --- CREATE LOGIC ---
            const newCutlist = new CutlistModel({
                organizationId,
                //  projectId, clientId, 
                projectId: cleanProjectId,
                clientId: cleanClientId,
                quoteId: cleanQuoteId, // SAVING NOW
                quoteNo: quoteNo || null, // SAVING NOW
                versionNo,
                clientName, location, rooms: processedRooms, summary,
                status: 'draft',
                isLocked: false
            });

            const saved = await newCutlist.save();
            return res.status(201).json({ ok: true, message: "Created", data: saved });
        }
    } catch (error: any) {
        console.error("Save Cutlist Error:", error);
        return res.status(500).json({ ok: false, message: error.message });
    }
};



/* 1. CREATE CONTROLLER
 * Extracts specific fields before saving
 */
export const createCutlist = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            organizationId, projectId, clientId, quoteId,
            quoteNo,
            versionNo, clientName, location,
            rooms, summary, status = "draft", isLocked = false
        } = req.body;

        // Strict Validation
        if (!organizationId) {
            return res.status(400).json({ ok: false, message: "organizationId is mandatory." });
        }

        const newCutlist = new CutlistModel({
            organizationId,
            projectId,
            clientId,
            quoteId,
            quoteNo,
            versionNo,
            clientName,
            location,
            rooms,
            summary,
            status,
            isLocked
        });

        const savedCutlist = await newCutlist.save();
        return res.status(201).json({
            ok: true,
            message: "Cutlist created successfully",
            data: savedCutlist
        });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};

/**
 * 2. UPDATE CONTROLLER
 * Extracts only allowed fields for update
 */
export const updateCutlist = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const {
            organizationId, projectId, clientId = null, quoteNo, quoteId,
            versionNo, clientName, location,
            rooms, summary, status, isLocked
        } = req.body;

        if (!organizationId) {
            return res.status(400).json({ ok: false, message: "organizationId is required for updates." });
        }

        const existing = await CutlistModel.findById(id);
        if (!existing) {
            return res.status(404).json({ ok: false, message: "Cutlist not found." });
        }

        // // Security check
        // if (existing.organizationId?.toString() !== organizationId.toString()) {
        //     return res.status(403).json({ ok: false, message: "Unauthorized organization access." });
        // }

        if (existing.isLocked) {
            return res.status(403).json({ ok: false, message: "This cutlist is locked." });
        }



        // 2. Clean the IDs (Convert empty strings or "null" strings back to null)
        const cleanProjectId = (projectId === '' || projectId === 'null') ? null : projectId;
        const cleanQuoteId = (quoteId === '' || quoteId === 'null') ? null : quoteId;
        // const cleanClientId = (req.body.clientId === '' || req.body.clientId === 'null') ? null : req.body.clientId;



        const updatedData = {
            // projectId, clientId,
            clientId: clientId,
            versionNo,
            clientName, location, rooms,
            summary, status, isLocked,

            projectId: cleanProjectId,
            quoteNo: quoteNo || null,
            quoteId: cleanQuoteId,

            // quoteNo, 
            // quoteId
        };



        console.log("updatedData", updatedData)
        const updatedCutlist = await CutlistModel.findByIdAndUpdate(
            id,
            { $set: updatedData },
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            ok: true,
            message: "Cutlist updated successfully",
            data: updatedCutlist
        });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};


/**
 * 3. GET ALL CONTROLLER
 * Filterable by organization or project
 */
export const getAllCutlists = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, projectId,   // Pagination
            page = 1,
            limit = 20,
            search,
            startDate,
            endDate,
        } = req.query;

        let query: any = {};

        if (organizationId) query.organizationId = organizationId;
        if (projectId) query.projectId = projectId;

        // --- Date Range Filter (Uses new deptGeneratedDate) ---
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate as string);
            if (endDate) query.createdAt.$lte = new Date(endDate as string);
        }

        if (search) {
            const searchRegex = new RegExp(search as string, "i");
            query.$or = [
                { quoteNo: searchRegex },           // Searches BILL-001, INV-001
                { clientName: searchRegex }, // Searches Vendor/Customer Name
                { location: searchRegex },         // Searches ACC-REC-001
            ];
        }


        // Calculate pagination
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // const cutlists = await CutlistModel.find(query)
        //     .sort({ createdAt: -1 }) // Sort by the actual transaction date (Bill Date), not createdAt
        //     .skip(skip)
        //     .limit(limitNum)
        //     .populate('projectId', "projectName _id")

        // const total = await CutlistModel.countDocuments(query);


        // Get bills with pagination
        const [cutlists, totalCount] = await Promise.all([
            CutlistModel.find(query)
                .sort({ createdAt: -1 }) // Sort by the actual transaction date (Bill Date), not createdAt
                .skip(skip)
                .limit(limitNum)
                .populate('projectId', "projectName _id"),

            CutlistModel.countDocuments(query)
        ])




        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;



        return res.status(200).json({
            ok: true,
            pagination: {
                total: totalCount,
                page: pageNum,
                limit: limitNum,
                totalPages,
                hasNextPage,
                hasPrevPage,
            },
            data: cutlists
        });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};

/**
 * 4. GET SINGLE CONTROLLER
 */
export const getSingleCutlist = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const cutlist = await CutlistModel.findById(id)
            .populate('projectId', "projectName _id")
            .populate("clientId", "_id clientName")
        // .populate('organizationId');

        if (!cutlist) {
            return res.status(404).json({ ok: false, message: "Cutlist not found" });
        }

        return res.status(200).json({
            ok: true,
            data: cutlist
        });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};

/**
 * 5. DELETE CONTROLLER
 */
export const deleteCutlist = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const deletedCutlist = await CutlistModel.findByIdAndDelete(id);

        if (!deletedCutlist) {
            return res.status(404).json({ ok: false, message: "Cutlist not found" });
        }

        return res.status(200).json({
            ok: true,
            message: "Cutlist deleted successfully"
        });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};











export const generateCutlistPDFController = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params; // Cutlist ID

        // Fetch data exactly as it exists in DB
        const cutlist = await CutlistModel.findById(id)
            .populate('projectId', 'projectName')
            .populate('organizationId', 'name companyLogo');

        if (!cutlist) {
            return res.status(404).json({ ok: false, message: 'Cutlist not found' });
        }

        const orgName = (cutlist.organizationId as any)?.organizationName || COMPANY_NAME   ;
        
        // Generate PDF and upload to S3
        const uploadResult = await generateCutlistPDF(cutlist, orgName, COMPANY_LOGO);

        // Update DB with the new PDF link (optional but recommended)
        cutlist.status = 'generated'; 
        // If your schema has a pdfUrl field: cutlist.pdfUrl = uploadResult.Location;
        await cutlist.save();

        return res.status(200).json({
            ok: true,
            message: 'PDF generated successfully',
            data: {
                cutlist,
                
                pdfUrl: uploadResult.Location,
            }
        });

    } catch (error: any) {
        console.error('PDF generation error:', error);
        res.status(500).json({
            ok: false,
            message: error.message || 'Internal server error'
        });
    }
};