import { Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import { isRecord } from "../studios_controllers/new_v1/studio/studio.validation";
import { RoleBasedRequest } from "../../types/types";
import { LibraryDesignModel } from "../../models/librarydesign_model/librarydesign.model";

type UploadedSwatch = Express.Multer.File & { location: string };

interface SwatchFileMetadata {
  designCode?: string;
  finishCode?: string;
  name?: string;
  materialKind?: string;
  studioFinishKind?: string;
  priceGroup?: string;
}

const readText = (value: unknown, maxLength: number): string =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

/** `metadata` is an optional JSON array sent alongside the files, one entry per file, in the same order. */
const readMetadata = (raw: unknown): SwatchFileMetadata[] => {
  if (typeof raw !== "string" || raw.trim() === "") return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((entry) => (isRecord(entry) ? (entry as SwatchFileMetadata) : {})) : [];
  } catch {
    return [];
  }
};

/** "Merino Oak 01.jpg" -> "Merino Oak 01" (used as the design code when none is sent). */
const nameWithoutExtension = (fileName: string): string => fileName.replace(/\.[^.]+$/, "").trim();

// POST /:organizationId/library/upload
export const uploadLibraryDesigns = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const organizationId = String(req.params.organizationId ?? "");
    if (!isValidObjectId(organizationId)) {
      return res.status(400).json({ ok: false, message: "Invalid organization ID" });
    }

    const files = (req.files as UploadedSwatch[] | undefined) ?? [];
    if (files.length === 0) {
      return res.status(400).json({ ok: false, message: "Upload at least one image" });
    }

    // Swatches are pictures only; reject anything else before touching the database.
    const notImage = files.find((file) => !file.mimetype.startsWith("image/"));
    if (notImage) {
      return res.status(400).json({ ok: false, message: `${notImage.originalname} is not an image` });
    }

    const body = req.body as Record<string, unknown>;
    const brandName = readText(body.brandName, 120);
    const catalogueName = readText(body.catalogueName, 160);
    const sharedFinishCode = readText(body.finishCode, 80);
    const metadata = readMetadata(body.metadata);

    if (!brandName) {
      return res.status(400).json({ ok: false, message: "Brand name is required" });
    }

    // Build one entry per uploaded image. Fields sent per file win over the shared fields.
    const designs = files.map((file, index) => {
      const perFile = metadata[index] ?? {};
      return {
        designCode: readText(perFile.designCode, 80) || nameWithoutExtension(file.originalname).slice(0, 80),
        finishCode: readText(perFile.finishCode, 80) || sharedFinishCode,
        name: readText(perFile.name, 160),
        materialKind: readText(perFile.materialKind, 80),
        studioFinishKind: readText(perFile.studioFinishKind, 80),
        priceGroup: readText(perFile.priceGroup, 80).toLowerCase(),
        imageUrl: file.location,
        // ADJUST: a separate small thumbnail can be generated later; until then the full image is used for both.
        thumbnailUrl: file.location,
      };
    });

    // const missingFinish = designs.find((design) => !design.finishCode);
    // if (missingFinish) {
    //   return res.status(400).json({ ok: false, message: "Every image needs a finish code (send finishCode or metadata per file)" });
    // }

    // One write per design: same brand + design code + finish updates the existing design, otherwise it is created.
    // All of them go to MongoDB in one bulk call.
    const organization = new Types.ObjectId(organizationId);
    const result = await LibraryDesignModel.bulkWrite(
      designs.map((design) => ({
        updateOne: {
          filter: { organizationId: organization, brandName, designCode: design.designCode, finishCode: design.finishCode },
          update: { $set: { ...design, brandName, catalogueName, organizationId: organization } },
          upsert: true,
        },
      })),
      { ordered: false }
    );

    const saved = await LibraryDesignModel.find({
      organizationId: organization,
      brandName,
      $or: designs.map((design) => ({ designCode: design.designCode, finishCode: design.finishCode })),
    })
      .select("-imageUrl") // lists carry thumbnails only
      .lean();

    return res.status(201).json({
      ok: true,
      message: `${result.upsertedCount} added, ${result.modifiedCount} updated`,
      data: {
        createdCount: result.upsertedCount,
        updatedCount: result.modifiedCount,
        designs: saved,
      },
    });
  } catch (error: any) {
    console.error("Error uploading library designs:", error);
    return res.status(500).json({
      ok: false,
      message: "Error uploading library designs",
      error: error.message,
    });
  }
};

// GET /:organizationId/library
export const getAllLibraryDesigns = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const organizationId = String(req.params.organizationId ?? "");
    if (!isValidObjectId(organizationId)) {
      return res.status(400).json({ ok: false, message: "Invalid organization ID" });
    }

    const query = req.query as Record<string, string | undefined>;
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));

    const filter: Record<string, unknown> = { organizationId: new Types.ObjectId(organizationId) };
    if (query.brandName) filter.brandName = query.brandName.trim();
    if (query.catalogueName) filter.catalogueName = query.catalogueName.trim();
    if (query.search) {
      const term = query.search.trim().slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [{ designCode: { $regex: term, $options: "i" } }, { finishCode: { $regex: term, $options: "i" } }, { name: { $regex: term, $options: "i" } }];
    }

    const [designs, total] = await Promise.all([
      LibraryDesignModel.find(filter)
        .select("-imageUrl") // thumbnails only in lists; full photo comes from the by-id route
        .sort({ brandName: 1, designCode: 1, finishCode: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      LibraryDesignModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      ok: true,
      message: "",
      data: { designs, total, page, limit },
    });
  } catch (error: any) {
    console.error("Error fetching library designs:", error);
    return res.status(500).json({ ok: false, message: "Error fetching library designs", error: error.message });
  }
};

// GET /:organizationId/library/:designId
export const getLibraryDesignById = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const organizationId = String(req.params.organizationId ?? "");
    const designId = String(req.params.designId ?? "");
    if (!isValidObjectId(organizationId) || !isValidObjectId(designId)) {
      return res.status(400).json({ ok: false, message: "Invalid ID" });
    }

    const design = await LibraryDesignModel.findOne({
      _id: new Types.ObjectId(designId),
      organizationId: new Types.ObjectId(organizationId),
    }).lean();

    if (!design) {
      return res.status(404).json({ ok: false, message: "Design not found" });
    }

    return res.status(200).json({ ok: true, message: "", data: design });
  } catch (error: any) {
    console.error("Error fetching library design:", error);
    return res.status(500).json({ ok: false, message: "Error fetching library design", error: error.message });
  }
};

// DELETE /:organizationId/library/:designId
export const deleteLibraryDesign = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const organizationId = String(req.params.organizationId ?? "");
    const designId = String(req.params.designId ?? "");
    if (!isValidObjectId(organizationId) || !isValidObjectId(designId)) {
      return res.status(400).json({ ok: false, message: "Invalid ID" });
    }

    const deleted = await LibraryDesignModel.findOneAndDelete({
      _id: new Types.ObjectId(designId),
      organizationId: new Types.ObjectId(organizationId),
    });

    if (!deleted) {
      return res.status(404).json({ ok: false, message: "Design not found" });
    }

    // The S3 picture is kept (cheap, and existing quotes may still show it). A clean-up job can remove it later.
    return res.status(200).json({ ok: true, message: "Design removed", data: { designId } });
  } catch (error: any) {
    console.error("Error deleting library design:", error);
    return res.status(500).json({ ok: false, message: "Error deleting library design", error: error.message });
  }
};


// GET /:organizationId/library/dropdown
export const getLibraryDesignsForDropdown = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const organizationId = String(req.params.organizationId ?? "");
    if (!isValidObjectId(organizationId)) {
      return res.status(400).json({ ok: false, message: "Invalid organization ID" });
    }

    const query = req.query as Record<string, string | undefined>;
    const filter: Record<string, unknown> = { organizationId: new Types.ObjectId(organizationId) };
    if (query.brandName) filter.brandName = query.brandName.trim();
    if (query.catalogueName) filter.catalogueName = query.catalogueName.trim();
    if (query.search) {
      const term = query.search.trim().slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { designCode: { $regex: term, $options: "i" } },
        { brandName: { $regex: term, $options: "i" } },
        { name: { $regex: term, $options: "i" } },
      ];
    }

    // No pagination here — a dropdown needs the whole matching set at once, and only the fields it shows.
    const designs = await LibraryDesignModel.find(filter)
      .select("_id brandName designCode imageUrl thumbnailUrl")
      .sort({ brandName: 1, designCode: 1 })
      .limit(1000) // ADJUST: raise/remove once you know how many designs an organisation typically has
      .lean();

    return res.status(200).json({ ok: true, message: "", data: designs });
  } catch (error: any) {
    console.error("Error fetching library designs for dropdown:", error);
    return res.status(500).json({ ok: false, message: "Error fetching library designs for dropdown", error: error.message });
  }
};