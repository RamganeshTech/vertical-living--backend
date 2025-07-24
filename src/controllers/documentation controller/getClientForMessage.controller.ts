import { Response } from "express";
import ClientModel from "../../models/client model/client.model";
import { RoleBasedRequest } from "../../types/types";
import { StageDocumentationModel } from "../../models/Documentation Model/documentation.model";

export const getClientByProjectId = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    const client = await ClientModel.findOne({ projectId });

    if (!client) {
      return res.status(404).json({ message: "Client not found for this project", ok: false });
    }

    return res.status(200).json({
      data: {
        clientName: client.clientName,
        phoneNo: client.phoneNo,
        email: client.email,
        projectId: client.projectId,
      }, ok: true
    });
  } catch (error) {
    // console.error("Error fetching client:", error);
    return res.status(500).json({ message: "Internal server error", ok: false });
  }
};



export const getStageShareMessage = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { projectId, stageNumber } = req.params;
    const project = await StageDocumentationModel.findOne({ projectId });
    if (!project) return res.status(404).json({ ok: false, message: "Project not found." });

    const stage = project.stages.find((s) => s.stageNumber === stageNumber);
    if (!stage) return res.status(404).json({ ok: false, message: "Stage not found." });


    const company = `From *Vertical Living*,`;

    const title = `*Stage Update*\nStage: *${stage.stageKey}* (Stage ${stage.stageNumber})`;

    const context =
      `We’re excited to inform you that the documentation for the stage ` +
      `*${stage.stageKey}* has been successfully completed. Please find the details below:`;

    const description = stage.description?.trim()
      ? `*Description:*\n${indentMultiline(stage.description.trim(), 2)}`
      : "";

    const images = stage.uploadedFiles
      .filter((f) => f.url.match(/\.(jpg|jpeg|png|webp)$/i))
      .map((f, i) => `  Image ${i + 1}: ${f.url}`);

    const pdfs = stage.uploadedFiles
      .filter((f) => f.url.match(/\.pdf$/i))
      .map((f, i) => `  PDF ${i + 1}: ${f.url}`);

    const filesSection =
      [...images, ...pdfs].length > 0
        ? `*Files:*\n${[...images, ...pdfs].join("\n")}`
        : "";

    let priceText = "";
    if (["6", "7"].includes(stage.stageNumber)) {
      priceText = `*Price:*\n  ${stage.price}`;
    }

    const fullMessage = [company, title, context, description, filesSection, priceText]
      .filter(Boolean)
      .join("\n\n");


    return res.json({
      ok: true,
      message: "Generated WhatsApp message",
      data: { message: fullMessage },
    });
  } catch (err) {
    // console.error("WhatsApp message generation error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};





// Helper function to indent multiline strings
function indentMultiline(text: string, spaces: number = 2): string {
  const pad = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line) => `${pad}${line.trim()}`)
    .join("\n");
}