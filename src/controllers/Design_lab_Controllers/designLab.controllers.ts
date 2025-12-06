// src/controllers/designLab.controller.ts

import { Request, Response } from "express";
import mongoose, {Types} from "mongoose";
// import DesignLab from "../models/designLab.model";
// import { IUpload, IDesignLab } from "../interfaces/designLab.interface";
import { IComponent, IDesignLab, IMaterial, IUpload } from "../../models/Design_Lab_model/designLab.model";

import DesignLabModel from "../../models/Design_Lab_model/designLab.model";
import { RoleBasedRequest } from "../../types/types";

// ==========================================
// TYPE DEFINITIONS
// ==========================================


interface PaginationQuery {
    organizationId?:string
    page?: string;
    limit?: string;
    search?: string;
    spaceType?: string;
    difficultyLevel?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

interface UploadTarget {
    section: "reference" | "material";
    componentIndex?: number;
    materialIndex?: number;
}



/**
 * File mapping structure to tell where each uploaded file should go
 */
interface FileMapping {
    target: "reference" | "material";
    componentIndex?: number;  // Required if target is "material"
    materialIndex?: number;   // Required if target is "material"
}

/**
 * Helper function to map uploaded file to IUpload format
 */
const mapFileToUpload = (file: Express.Multer.File & { location: string }): IUpload => {
    return {
        type: file.mimetype.startsWith("image") ? "image" : "pdf",
        url: file.location,
        originalName: file.originalname,
        uploadedAt: new Date(),
    };
};

/**
 * Helper function to process files and apply them to the design lab data
 */
const processFilesWithMapping = (
    files: (Express.Multer.File & { location: string })[],
    fileMapping: FileMapping[],
    designLabData: Partial<IDesignLab>
): { success: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Initialize referenceImages if not exists
    if (!designLabData.referenceImages) {
        designLabData.referenceImages = [];
    }

    // Initialize components if not exists
    if (!designLabData.components) {
        designLabData.components = [];
    }

    // Process each file according to its mapping
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const mapping = fileMapping[i];

        if (!mapping) {
            errors.push(`No mapping found for file at index ${i} (${file.originalname})`);
            continue;
        }

        const uploadData = mapFileToUpload(file);

        if (mapping.target === "reference") {
            // Add to reference images
            designLabData.referenceImages.push(uploadData);
        } else if (mapping.target === "material") {
            const { componentIndex, materialIndex } = mapping;

            // Validate indices
            if (componentIndex === undefined || materialIndex === undefined) {
                errors.push(
                    `File at index ${i}: componentIndex and materialIndex are required for material target`
                );
                continue;
            }

            // Check if component exists
            if (!designLabData.components[componentIndex]) {
                errors.push(
                    `File at index ${i}: Component at index ${componentIndex} does not exist`
                );
                continue;
            }

            // Check if material exists
            if (!designLabData.components[componentIndex].materials) {
                designLabData.components[componentIndex].materials = [];
            }

            if (!designLabData.components[componentIndex].materials[materialIndex]) {
                errors.push(
                    `File at index ${i}: Material at index ${materialIndex} in component ${componentIndex} does not exist`
                );
                continue;
            }

            // Assign image to material
            designLabData.components[componentIndex].materials[materialIndex].image = uploadData;
        } else {
            errors.push(`File at index ${i}: Unknown target "${mapping.target}"`);
        }
    }

    return { success: errors.length === 0, errors };
};



export async function generateDesignCode(
    organizationId: string | Types.ObjectId
): Promise<string> {

    const currentYear = new Date().getFullYear();

    // Find the last created design for this organization
    const lastDoc = await DesignLabModel.findOne({ organizationId })
        .sort({ createdAt: -1 })
        .select("designCode");

    let nextNumber = 1;

    if (lastDoc?.designCode) {
        // Match pattern DL-2025-001 → extract the last number only
        const regex = new RegExp(`DL-${currentYear}-(\\d+)$`);
        const match = lastDoc.designCode.match(regex);

        if (match) {
            nextNumber = parseInt(match[1], 10) + 1;
        }
    }

    // Always minimum 3 digits (001, 010, 100, 999, 1000...)
    const padded = String(nextNumber).padStart(3, "0");

    return `DL-${currentYear}-${padded}`;
}

export const createDesignLab = async (
    req: RoleBasedRequest,
    res: Response
): Promise<any> => {
    try {
        const {organizationId} = req.params

        if (!organizationId) {
            return res.status(400).json({
                ok: false,
                message: "Organization ID is required",
            });
        }

        // Get uploaded files
        const files =
            (req.files as (Express.Multer.File & { location: string })[]) || [];

        // Parse the main data from request body
        let designLabData: Partial<IDesignLab>;

        if (typeof req.body.data === "string") {
            try {
                designLabData = JSON.parse(req.body.data);
            } catch (parseError) {
                return res.status(400).json({
                    ok: false,
                    message: "Invalid JSON in 'data' field",
                });
            }
        } else if (req.body.data) {
            designLabData = req.body.data;
        } else {
            const { data, fileMapping, files: _, ...restBody } = req.body;
            designLabData = restBody;
        }

        // Parse file mapping
        let fileMapping: FileMapping[] = [];

        if (req.body.fileMapping) {
            try {
                fileMapping =
                    typeof req.body.fileMapping === "string"
                        ? JSON.parse(req.body.fileMapping)
                        : req.body.fileMapping;
            } catch (parseError) {
                return res.status(400).json({
                    ok: false,
                    message: "Invalid JSON in 'fileMapping' field",
                });
            }
        }

        // Validate file mapping count matches files count
        if (files.length > 0 && fileMapping.length !== files.length) {
            return res.status(400).json({
                ok: false,
                message: `File count mismatch: ${files.length} files uploaded but ${fileMapping.length} mappings provided`,
            });
        }

        

        // Initialize referenceImages array
        if (!designLabData.referenceImages) {
            designLabData.referenceImages = [];
        }

        // Initialize materials with null images
        if (designLabData.components) {
            designLabData.components = designLabData.components.map((component) => ({
                ...component,
                materials: (component.materials || []).map((material) => ({
                    ...material,
                    image: material.image || null,
                })),
            }));
        }

        // Process files and apply to data
        if (files.length > 0 && fileMapping.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const mapping = fileMapping[i];

                if (!mapping) continue;

                const uploadData = mapFileToUpload(file);

                if (mapping.target === "reference") {
                    designLabData.referenceImages!.push(uploadData);
                } else if (mapping.target === "material") {
                    const { componentIndex, materialIndex } = mapping;

                    if (
                        componentIndex !== undefined &&
                        materialIndex !== undefined &&
                        designLabData.components?.[componentIndex]?.materials?.[materialIndex]
                    ) {
                        designLabData.components[componentIndex].materials[materialIndex].image =
                            uploadData;
                    }
                }
            }
        }

        // Add organization ID
        designLabData.organizationId = new mongoose.Types.ObjectId(organizationId);

        if (designLabData.designerId) {
            designLabData.designerId = new mongoose.Types.ObjectId(
                designLabData.designerId as unknown as string
            );
        }


          const dlCode = await generateDesignCode(organizationId)

        
          if(dlCode){
            designLabData.designCode = dlCode
          }

        // Create and save
        const designLab = new DesignLabModel(designLabData);
        await designLab.save();

        return res.status(201).json({
            ok: true,
            message: "Design Lab created successfully",
            data: designLab,
        });
    } catch (error: any) {
        console.error("Error creating Design Lab:", error);
        return res.status(500).json({
            ok: false,
            message: "Failed to create Design Lab",
            error: error.message,
        });
    }
};



// ==========================================
// 2. UPDATE DESIGN LAB (Text Data Only - No Image Handling)
// ==========================================
export const updateDesignLab = async (
    req: RoleBasedRequest,
    res: Response
): Promise<any> => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                message: "Invalid Design Lab ID",
            });
        }

        const existingDesignLab = await DesignLabModel.findById(id);

        if (!existingDesignLab) {
            return res.status(404).json({
                ok: false,
                message: "Design Lab not found",
            });
        }

        // Get update data from body
        const updateData: Partial<IDesignLab> = req.body;

        // Remove fields that shouldn't be updated via this controller
        delete updateData.designCode;
        delete updateData.organizationId;
        delete (updateData as any).createdAt;
        delete updateData.referenceImages; // Images handled by separate controller

        // If components are being updated, preserve existing images
        if (updateData.components) {
            updateData.components = updateData.components.map((component, compIdx) => {
                const existingComponent = existingDesignLab.components?.[compIdx];

                return {
                    ...component,
                    materials: (component.materials || []).map((material, matIdx) => {
                        // Preserve existing image if not explicitly set to null
                        const existingMaterialImage =
                            existingComponent?.materials?.[matIdx]?.image;

                        return {
                            ...material,
                            // Keep the existing image - don't allow image updates here
                            image: existingMaterialImage || null,
                        };
                    }),
                };
            });
        }

        // Update the document
        const updatedDesignLab = await DesignLabModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            ok: true,
            message: "Design Lab updated successfully",
            data: updatedDesignLab,
        });
    } catch (error: any) {
        console.error("Error updating Design Lab:", error);
        return res.status(500).json({
            ok: false,
            message: "Failed to update Design Lab",
            error: error.message,
        });
    }
};

// ==========================================
// 3. DELETE DESIGN LAB
// ==========================================
export const deleteDesignLab = async (
    req: RoleBasedRequest,
    res: Response
): Promise<any> => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                message: "Invalid Design Lab ID",
            });
        }

        // const designLab = await DesignLabModel.findById(id);

        // if (!designLab) {
        //   return res.status(404).json({
        //     ok: false,
        //     message: "Design Lab not found",
        //   });
        // }

        // TODO: Optionally delete associated S3 files here
        // You can iterate through referenceImages and component materials
        // and delete them from S3

        const deleted = await DesignLabModel.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({
                ok: false,
                message: "Design Lab not found",
            });
        }

        return res.status(200).json({
            ok: true,
            message: "Design Lab deleted successfully",
        });
    } catch (error: any) {
        console.error("Error deleting Design Lab:", error);
        return res.status(500).json({
            ok: false,
            message: "Failed to delete Design Lab",
            error: error.message,
        });
    }
};

// ==========================================
// 4. GET ALL DESIGN LABS (Infinite Loading Pagination)
// ==========================================
export const getAllDesignLabs = async (
    req: RoleBasedRequest,
    res: Response
): Promise<any> => {
    try {

       

        const {
            organizationId,
            page = "1",
            limit = "10",
            search,
            spaceType,
            difficultyLevel,
            status,
            sortBy = "createdAt",
            sortOrder = "desc",
        } = req.query as PaginationQuery;

         if (!organizationId) {
            return res.status(400).json({
                ok: false,
                message: "Organization ID is required",
            });
        }

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        // Build filter query
        const filter: any = {
            organizationId: new mongoose.Types.ObjectId(organizationId as string),
        };

        if (search) {
            filter.$or = [
                { productName: { $regex: search, $options: "i" } },
                { designerName: { $regex: search, $options: "i" } },
                { designCode: { $regex: search, $options: "i" } },
            ];
        }

        if (spaceType) {
            filter.spaceType = spaceType;
        }

        if (difficultyLevel) {
            filter.difficultyLevel = difficultyLevel;
        }

        if (status) {
            filter.status = status;
        }

        // Build sort object
        const sort: any = {};
        sort[sortBy] = sortOrder === "asc" ? 1 : -1;

        // Execute queries
        const [designLabs, totalCount] = await Promise.all([
            DesignLabModel.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            DesignLabModel.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        return res.status(200).json({
            ok: true,
            message: "Design Labs fetched successfully",
            data: {
                designLabs,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalCount,
                    limit: limitNum,
                    hasNextPage,
                    hasPrevPage,
                    nextPage: hasNextPage ? pageNum + 1 : null,
                    prevPage: hasPrevPage ? pageNum - 1 : null,
                },
            },
        });
    } catch (error: any) {
        console.error("Error fetching Design Labs:", error);
        return res.status(500).json({
            ok: false,
            message: "Failed to fetch Design Labs",
            error: error.message,
        });
    }
};

// ==========================================
// 5. GET SINGLE DESIGN LAB BY ID
// ==========================================
export const getDesignLabById = async (
    req: RoleBasedRequest,
    res: Response
): Promise<any> => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                message: "Invalid Design Lab ID",
            });
        }

        const designLab = await DesignLabModel.findById(id)
            .populate("designerId", "name email")
            .lean();

        if (!designLab) {
            return res.status(404).json({
                ok: false,
                message: "Design Lab not found",
            });
        }

        return res.status(200).json({
            ok: true,
            message: "Design Lab fetched successfully",
            data: designLab,
        });
    } catch (error: any) {
        console.error("Error fetching Design Lab:", error);
        return res.status(500).json({
            ok: false,
            message: "Failed to fetch Design Lab",
            error: error.message,
        });
    }
};

// ==========================================
// 6. UPLOAD REFERENCE IMAGES (New Images Only)
// ==========================================
export const uploadReferenceImages = async (
    req: RoleBasedRequest,
    res: Response
): Promise<any> => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                message: "Invalid Design Lab ID",
            });
        }

        const files = req.files as (Express.Multer.File & { location: string })[];

        if (!files || files.length === 0) {
            return res.status(400).json({
                ok: false,
                message: "No files uploaded",
            });
        }

        const designLab = await DesignLabModel.findById(id);

        if (!designLab) {
            return res.status(404).json({
                ok: false,
                message: "Design Lab not found",
            });
        }

        // Map uploaded files to IUpload format
        const newImages: IUpload[] = files.map((file) => mapFileToUpload(file));

        // Append new images to existing reference images (don't replace)
        designLab.referenceImages = [...(designLab.referenceImages || []), ...newImages];

        await designLab.save();

        return res.status(200).json({
            ok: true,
            message: `${newImages.length} reference image(s) uploaded successfully`,
            data: {
                uploadedImages: newImages,
                totalReferenceImages: designLab.referenceImages.length,
                referenceImages: designLab.referenceImages,
            },
        });
    } catch (error: any) {
        console.error("Error uploading reference images:", error);
        return res.status(500).json({
            ok: false,
            message: "Failed to upload reference images",
            error: error.message,
        });
    }
};

// ==========================================
// 7. DELETE REFERENCE IMAGE (One at a Time)
// ==========================================
export const deleteReferenceImage = async (
    req: RoleBasedRequest,
    res: Response
): Promise<any> => {
    try {
        const { id, imageId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                message: "Invalid Design Lab ID",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(imageId)) {
            return res.status(400).json({
                ok: false,
                message: "Invalid Image ID",
            });
        }

        const designLab = await DesignLabModel.findById(id);

        if (!designLab) {
            return res.status(404).json({
                ok: false,
                message: "Design Lab not found",
            });
        }

        // Find the image index by _id
        const imageIndex = designLab.referenceImages.findIndex(
            (img: any) => img._id?.toString() === imageId
        );

        if (imageIndex === -1) {
            return res.status(404).json({
                ok: false,
                message: "Reference image not found",
            });
        }

        // Get the image URL before deletion (for S3 cleanup if needed)
        const deletedImage = designLab.referenceImages[imageIndex];

        // TODO: Delete from S3 if needed
        // if (deletedImage.url) {
        //   await deleteFromS3(deletedImage.url);
        // }

        // Remove the image from array
        designLab.referenceImages.splice(imageIndex, 1);

        await designLab.save();

        return res.status(200).json({
            ok: true,
            message: "Reference image deleted successfully",
            data: {
                deletedImage,
                remainingImages: designLab.referenceImages.length,
                referenceImages: designLab.referenceImages,
            },
        });
    } catch (error: any) {
        console.error("Error deleting reference image:", error);
        return res.status(500).json({
            ok: false,
            message: "Failed to delete reference image",
            error: error.message,
        });
    }
};

// ==========================================
// 8. UPLOAD MATERIAL IMAGE (Single Image for Specific Material)
// ==========================================
export const uploadMaterialImage = async (
    req: RoleBasedRequest,
    res: Response
): Promise<any> => {
    try {
        const { id, componentId, materialId } = req.params;

        // Validate Design Lab ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                message: "Invalid Design Lab ID",
            });
        }

        // Get uploaded files (expecting single file, but handle array)
        const files = req.files as (Express.Multer.File & { location: string })[];

        if (!files || files.length === 0) {
            return res.status(400).json({
                ok: false,
                message: "No file uploaded",
            });
        }

        // Use only the first file (single image per material)
        const file = files[0];

        const designLab = await DesignLabModel.findById(id);

        if (!designLab) {
            return res.status(404).json({
                ok: false,
                message: "Design Lab not found",
            });
        }

        const exisitingComponent: IComponent = (designLab.components as any).id(componentId)


        if (!exisitingComponent) {
            return res.status(404).json({
                ok: false,
                message: `Component not found`,
            });
        }


        const existingMaterial = (exisitingComponent.materials as any).id(materialId)

        if (!existingMaterial) {
            return res.status(404).json({
                ok: false,
                message: `Material not found in the component`,
            });
        }


        // Create new image object
        const newImage: IUpload = mapFileToUpload(file);

        // Update the material with new image
        // designLab.components[compIdx].materials[matIdx].image = newImage;

        existingMaterial.image = newImage;

        await designLab.save();

        return res.status(200).json({
            ok: true,
            message: "Material image uploaded successfully",
            data: {
                // previousImage: existingImage || null,
                newImage,
            },
        });
    } catch (error: any) {
        console.error("Error uploading material image:", error);
        return res.status(500).json({
            ok: false,
            message: "Failed to upload material image",
            error: error.message,
        });
    }
};

// ==========================================
// 9. DELETE MATERIAL IMAGE (One at a Time)
// ==========================================
export const deleteMaterialImage = async (
    req: RoleBasedRequest,
    res: Response
): Promise<any> => {
    try {
        const { id, componentId, materialId } = req.params;

        // Validate Design Lab ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                message: "Invalid Design Lab ID",
            });
        }

        // Validate Component ID
        if (!mongoose.Types.ObjectId.isValid(componentId)) {
            return res.status(400).json({
                ok: false,
                message: "Invalid Component ID",
            });
        }

        // Validate Material ID
        if (!mongoose.Types.ObjectId.isValid(materialId)) {
            return res.status(400).json({
                ok: false,
                message: "Invalid Material ID",
            });
        }

        const designLab = await DesignLabModel.findById(id);

        if (!designLab) {
            return res.status(404).json({
                ok: false,
                message: "Design Lab not found",
            });
        }

        // Find component by ID
        const existingComponent: IComponent | null = (designLab.components as any).id(componentId);

        if (!existingComponent) {
            return res.status(404).json({
                ok: false,
                message: "Component not found",
            });
        }

        // Find material by ID
        const existingMaterial: IMaterial | null = (existingComponent.materials as any).id(materialId);

        if (!existingMaterial) {
            return res.status(404).json({
                ok: false,
                message: "Material not found in the component",
            });
        }

        // Get the existing image
        const existingImage = existingMaterial.image;

        if (!existingImage) {
            return res.status(404).json({
                ok: false,
                message: "No image found for this material",
            });
        }

        // TODO: Delete from S3 if needed
        // if (existingImage.url) {
        //   await deleteFromS3(existingImage.url);
        // }

        // Set image to null
        existingMaterial.image = null;

        await designLab.save();

        return res.status(200).json({
            ok: true,
            message: "Material image deleted successfully",
            data: {
                deletedImage: existingImage,
                componentId,
                materialId,
            },
        });
    } catch (error: any) {
        console.error("Error deleting material image:", error);
        return res.status(500).json({
            ok: false,
            message: "Failed to delete material image",
            error: error.message,
        });
    }
};