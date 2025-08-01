import { Request, Response } from "express";
import { RoleBasedRequest } from "../../types/types";
import { IExternalUpload } from "../../models/externalUnit model/CommonExternal model/commonExternal.model";
import { WardrobeExternalModel } from "../../models/externalUnit model/WardrobeExternal Model/wardrobeExternal.model";


export const createWardrobeUnit = async (req: RoleBasedRequest, res: Response): Promise<any> => {
    try {
        const { unitName, category, price } = req.body;
        const files = req.files as Express.Multer.File[];

        if (!unitName) {
            return res.status(400).json({ message: "unitName is required", ok: false });
        }

        if (!category) {
            return res.status(400).json({ message: "category is required", ok: false });
        }

        // Validate files if sent
        let image: IExternalUpload | null = null;
        if (files?.length) {
            const imageFile = files.find(file => file.mimetype.startsWith("image/"));
            if (!imageFile) {
                return res.status(400).json({ message: "Only image files are allowed", ok: false });
            }

            image = {
                type: "image",
                url: (imageFile as any).location,
                originalName: imageFile.originalname,
                uploadedAt: new Date(),
            };
        }

        // Generate next available unitCode based on existing items in this category
        const existingCodes = await WardrobeExternalModel.find({ category }).select("unitCode");
        const codeNumbers = existingCodes
            ?.map((doc) => {
                const match = doc.unitCode?.match(new RegExp(`^${category}-(\\d+)$`)); // trying to extract the number part
                return match ? parseInt(match[1]) : null;
            })
            ?.filter((num): num is number => num !== null); //filtering wherether it is a number finally codNumber will be real number [1,3,8]

        const nextNumber = codeNumbers?.length > 0 ? Math.max(...codeNumbers) + 1 : 1;  //adding the number 1 with the maximum numbe presentin the array else keep it as 1
        const unitCode = `${category}-${nextNumber}`;


        const newUnit = await WardrobeExternalModel.create({
            unitName,
            price: price ?? 0,
            unitCode,
            image,
        });

        res.status(201).json({ message: "Wardrobe unit created", data: newUnit, ok: true });
    } catch (err) {
        console.error("Create unit error:", err);
        res.status(500).json({ message: "Internal server error", ok: false });
    }
};


export const createWardrobeUnittemp = async (unitName: string, category: string, price: number, files?: any): Promise<any> => {
    try {
        // const { unitName, category, price } = req.body;
        // const files = req.files as Express.Multer.File[];

        if (!unitName) {
            // return 
        }

        if (!category) {
            // return 
        }

        // Validate files if sent
        let image: IExternalUpload | null = null;
        if (files?.length) {
            const imageFile = files.find((file: any) => file.mimetype.startsWith("image/"));
            if (!imageFile) {
                // return res.status(400).json({ message: "Only image files are allowed", ok: false });
            }

            image = {
                type: "image",
                url: (imageFile as any).location,
                originalName: imageFile.originalname,
                uploadedAt: new Date(),
            };
        }

        // Generate next available unitCode based on existing items in this category
        const existingCodes = await WardrobeExternalModel.find({ category }).select("unitCode");
        const codeNumbers = existingCodes
            ?.map((doc) => {
                const match = doc.unitCode?.match(new RegExp(`^${category}-(\\d+)$`)); // trying to extract the number part
                return match ? parseInt(match[1]) : null;
            })
            ?.filter((num): num is number => num !== null); //filtering wherether it is a number finally codNumber will be real number [1,3,8]

        const nextNumber = codeNumbers?.length > 0 ? Math.max(...codeNumbers) + 1 : 1;  //adding the number 1 with the maximum numbe presentin the array else keep it as 1
        const unitCode = `${category}-${nextNumber}`;


        const newUnit = await WardrobeExternalModel.create({
            unitName,
            price: price ?? 0,
            unitCode,
            image,
            dimention: {
                height: {
                    start: 0,
                    end: 100
                },
                depth: {
                    start: 0,
                    end: 100
                },
                width: {
                    start: 0,
                    end: 100
                },
            },
            category,
        });

        // res.status(201).json({ message: "Wardrobe unit created", data: newUnit, ok: true });
    } catch (err) {
        console.error("Create unit error:", err);
        // res.status(500).json({ message: "Internal server error", ok: false });
    }
};

export const getWardrobeUnits = async (req: Request, res: Response): Promise<any> => {
    try {
        const { page = "1", limit = "10", search = "" } = req.query;

        const pageNumber = parseInt(page as string, 10);
        const limitNumber = parseInt(limit as string, 10);

        // Build search query
        const searchRegex = new RegExp(search as string, "i"); // case-insensitive
        const searchQuery = {
            $or: [
                { unitName: searchRegex },
                { unitCode: searchRegex }
            ]
        };

        // Count total documents matching the search
        const total = await WardrobeExternalModel.countDocuments(searchQuery);

        // Fetch paginated and filtered results
        const units = await WardrobeExternalModel.find(searchQuery)
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber)
            .sort({ createdAt: -1 });

        res.status(200).json({
            ok: true,
            data: units,
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber)
            }
        });

    } catch (error) {
        console.error("Error fetching wardrobe units:", error);
        res.status(500).json({ ok: false, message: "Server error" });
    }
};


