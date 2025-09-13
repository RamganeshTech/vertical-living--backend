import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { COMPANY_LOGO, uploadToS3 } from "../../stage controllers/ordering material controller/pdfOrderHistory.controller";
import QuoteVarientGenerateModel from "../../../models/Quote Model/QuoteVariant Model/quoteVarient.model";
import ProjectModel from "../../../models/project model/project.model";
import { RequirementFormModel } from "../../../models/Stage Models/requirment model/mainRequirementNew.model";

// const HEADER_FONT_SIZE = 18;
// const FONT_SIZE = 10;

// const filterMaterialRows = (rows: any[]) => {
//   return rows.filter((row) =>
//     row &&
//     (row.itemName ||
//       row.imageUrl ||
//       row.plywoodNos?.quantity > 0 ||
//       row.carpenters > 0 ||
//       row.days > 0 ||
//       row.rowTotal > 0)
//   );
// };

// const filterSimpleRows = (rows: any[]) => {
//   return rows.filter(
//     (row) =>
//       row &&
//       (row.itemName || row.description || row.quantity > 0 || row.cost > 0 || row.rowTotal > 0)
//   );
// };

// export const generateQuoteVariantPdf = async ({
//   quoteId,
//   projectId,
//   newVariant,
// }: {
//   quoteId: string;
//   projectId: string;
//   newVariant: any;
// }) => {
//   try {
//     const [projectData, clientDataDoc] = await Promise.all([
//       ProjectModel.findById(projectId),
//       RequirementFormModel.findOne({ projectId }),
//     ]);

//     const clientData:any = clientDataDoc?.clientData || {};
//     const companyName = "Vertical Living";

//     const pdfDoc = await PDFDocument.create();
//     const page = pdfDoc.addPage();
//     const { width, height } = page.getSize();
//     const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
//     const normalFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

//     let yPosition = height - 40;

//     // Fetch and embed logo
//     try {
//       const logoRes = await fetch(COMPANY_LOGO!);
//       const logoBuffer = await logoRes.arrayBuffer();
//       const logoImage = await pdfDoc.embedJpg(logoBuffer);
//       const logoDims = logoImage.scale(0.4);

//       page.drawImage(logoImage, {
//         x: (width - logoDims.width) / 2,
//         y: yPosition - logoDims.height,
//         width: logoDims.width,
//         height: logoDims.height,
//       });

//       yPosition -= logoDims.height + 10;
//     } catch (err) {
//       console.error("Failed to load logo:", err);
//       yPosition -= 50;
//     }

//     // Company name
//     page.drawText(companyName, {
//       x: (width - boldFont.widthOfTextAtSize(companyName, HEADER_FONT_SIZE)) / 2,
//       y: yPosition,
//       size: HEADER_FONT_SIZE,
//       font: boldFont,
//       color: rgb(0, 0, 0.75),
//     });

//     yPosition -= 40;

//     const drawDetails = (label: string, value: string, y: number) => {
//       const labelWidth = boldFont.widthOfTextAtSize(label, FONT_SIZE);
//       page.drawText(label, {
//         x: 50,
//         y,
//         font: boldFont,
//         size: FONT_SIZE,
//         color: rgb(0.2, 0.2, 0.2),
//       });
//       page.drawText(value || "-", {
//         x: 50 + labelWidth + 10,
//         y,
//         font: normalFont,
//         size: FONT_SIZE,
//         color: rgb(0.1, 0.1, 0.1),
//       });
//     };

//     // Draw client/project details
//     drawDetails("Client Name:", clientData?.clientName || "-", yPosition);
//     drawDetails("Email:", clientData?.email || "-", (yPosition -= 16));
//     drawDetails("WhatsApp:", clientData?.whatsapp || "-", (yPosition -= 16));
//     drawDetails("Location:", clientData?.location || "-", (yPosition -= 16));
//     drawDetails("Project:", projectData?.projectName || "-", (yPosition -= 16));
//     if(newVariant?.quoteNo){
//         drawDetails("Quote No:", newVariant?.quoteNo, (yPosition -= 16));
//     }
//     drawDetails("Date:", new Date().toLocaleDateString(), (yPosition -= 16));

//     yPosition -= 30;

//     // ✅ Done with Page 1
//     // -------------------------------------------------------
//     let currentPage = page;

//     const ensureSpace = (minY: number) => {
//       if (yPosition < minY) {
//         currentPage = pdfDoc.addPage();
//         yPosition = currentPage.getHeight() - 40;
//       }
//     };

//     // 👉 Iterate furnitures
//     for (const furniture of newVariant.furnitures) {
//       // New page per furniture
//       currentPage = pdfDoc.addPage();
//       yPosition = currentPage.getHeight() - 40;

//       currentPage.drawText(`Furniture: ${furniture.furnitureName}`, {
//         x: 50,
//         y: yPosition,
//         font: boldFont,
//         size: 14,
//         color: rgb(0.1, 0.3, 0.5),
//       });

//       yPosition -= 20;

//       const coreRows = filterMaterialRows(furniture.coreMaterials);
//       if (coreRows.length) {
//         currentPage.drawText("Core Materials", {
//           x: 50,
//           y: yPosition,
//           font: boldFont,
//           size: 12,
//           color: rgb(0.2, 0.2, 0.2),
//         });
//         yPosition -= 20;

//         for (const row of coreRows) {
//           const line = [
//             pad(row.itemName || "-", 20),
//             `Qty: ${row.plywoodNos?.quantity || 0}`,
//             `Rs: ${row.rowTotal}`,
//           ].join("  |  ");

//           ensureSpace(30);
//           currentPage.drawText(line, {
//             x: 60,
//             y: yPosition,
//             size: FONT_SIZE,
//             font: normalFont,
//             color: rgb(0.1, 0.1, 0.1),
//           });
//           yPosition -= 18;
//         }

//         // Section subtotal
//         currentPage.drawText(`Subtotal (Core): Rs: ${furniture.coreMaterialsTotal}`, {
//           x: 60,
//           y: yPosition - 10,
//           size: FONT_SIZE,
//           font: boldFont,
//           color: rgb(0.1, 0.3, 0.1),
//         });

//         yPosition -= 30;
//       }

//       const renderSimpleSection = (title: string, rows: any[], total: number) => {
//         const validRows = filterSimpleRows(rows);
//         if (!validRows.length) return;

//         currentPage.drawText(title, {
//           x: 50,
//           y: yPosition,
//           font: boldFont,
//           size: 12,
//           color: rgb(0.2, 0.2, 0.2),
//         });
//         yPosition -= 20;

//         for (const item of validRows) {
//           const line = [
//             pad(item.itemName || "-", 20),
//             `Qty: ${item.quantity}`,
//             `Rate: ${item.cost}`,
//             `Rs: ${item.rowTotal}`,
//           ].join("  |  ");

//           ensureSpace(30);
//           currentPage.drawText(line, {
//             x: 60,
//             y: yPosition,
//             size: FONT_SIZE,
//             font: normalFont,
//             color: rgb(0.1, 0.1, 0.1),
//           });
//           yPosition -= 18;
//         }

//         currentPage.drawText(`Subtotal (${title}): Rs: ${total}`, {
//           x: 60,
//           y: yPosition - 10,
//           size: FONT_SIZE,
//           font: boldFont,
//           color: rgb(0.1, 0.3, 0.1),
//         });

//         yPosition -= 30;
//       };

//       renderSimpleSection("Fittings", furniture.fittingsAndAccessories, furniture.fittingsAndAccessoriesTotal);
//       renderSimpleSection("Glues", furniture.glues, furniture.gluesTotal);
//       renderSimpleSection("Non-Branded Materials", furniture.nonBrandMaterials, furniture.nonBrandMaterialsTotal);

//       // Furniture total
//       currentPage.drawText(`Furniture Total: Rs: ${furniture.furnitureTotal}`, {
//         x: 60,
//         y: yPosition - 10,
//         size: 12,
//         font: boldFont,
//         color: rgb(0, 0.4, 0),
//       });

//       yPosition -= 25;
//     }

//     // ✅ New page → Grand total
//     const totalPage = pdfDoc.addPage();
//     yPosition = totalPage.getHeight() - 80;
//     totalPage.drawText(`GRAND TOTAL: Rs: ${newVariant.grandTotal}`, {
//       x: 60,
//       y: yPosition,
//       size: 16,
//       font: boldFont,
//       color: rgb(0, 0.4, 0),
//     });

//     // ✅ Append 3 pages with "Terms and Conditions" in bold center
//     for (let i = 0; i < 3; i++) {
//       const termsPage = pdfDoc.addPage();
//       const centerX = termsPage.getWidth() / 2;
//       const centerY = termsPage.getHeight() / 2;
//       const text = "Terms and Conditions";

//       const textWidth = boldFont.widthOfTextAtSize(text, 22);

//       termsPage.drawText(text, {
//         x: centerX - textWidth / 2,
//         y: centerY,
//         font: boldFont,
//         size: 22,
//         color: rgb(0, 0, 0),
//       });
//     }

//     // ✅ Save and upload to S3
//     const pdfBytes = await pdfDoc.save();
//     const fileName = `home-interior-quote-${newVariant.quoteNo}-${Date.now()}.pdf`;

//     const uploadResult = await uploadToS3(pdfBytes, fileName);

//     // ⬆️ Update the model with pdfLink
//     const updated = await QuoteVarientGenerateModel.findByIdAndUpdate(
//       newVariant._id,
//       {
//         pdfLink: {
//           type: "pdf",
//           url: uploadResult.Location,
//           originalName: fileName,
//           uploadedAt: new Date(),
//         },
//       },
//       { new: true }
//     );

//     return {
//       success: true,
//       fileUrl: uploadResult.Location,
//       fileName: fileName,
//       updatedDoc: updated,
//     };

//   } catch (err: any) {
//     console.error("Failed to generate PDF:", err);
//     throw new Error("Something went wrong during PDF generation");
//   }
// };

// // Padding utility
// const pad = (str: string, len: number) => str.padEnd(len, " ");







// SECOND VERSION

// const FONT_SIZE = 11;
// const HEADER_FONT_SIZE = 16;
// const SECTION_SPACE = 30;

// /**
//  * Filter material rows: skip entirely empty rows (all default)
//  */
// const filterMaterialRows = (rows: any[]) => {
//   return rows.filter((row) =>
//     row &&
//     (row.itemName || row.imageUrl || row.plywoodNos?.quantity > 0 || row.rowTotal > 0)
//   );
// };

// /**
//  * Filter simple rows like fittings, glues, nbms
//  */
// const filterSimpleRows = (rows: any[]) => {
//   return rows.filter(
//     (row) =>
//       row &&
//       (row.itemName || row.description || row.quantity > 0 || row.cost > 0 || row.rowTotal > 0)
//   );
// };

// export const generateQuoteVariantPdf = async ({
//   quoteId,
//   projectId,
//   newVariant,
// }: {
//   quoteId: string;
//   projectId: string;
//   newVariant: any;
// }) => {
//   try {
//     const [projectData, clientDataDoc] = await Promise.all([
//       ProjectModel.findById(projectId),
//       RequirementFormModel.findOne({ projectId }),
//     ]);

//     const clientData:any = clientDataDoc?.clientData || {};

//     const pdfDoc = await PDFDocument.create();
//     const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
//     const normalFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

//     // === PAGE 1: Company + Client Info === //
//     const detailsPage = pdfDoc.addPage();
//     const { width, height } = detailsPage.getSize();
//     let yPosition = height - 50;

//     // ✅ Draw Logo
//     try {
//       const logoRes = await fetch(COMPANY_LOGO);
//       const logoBuffer = await logoRes.arrayBuffer();
//       const logoImage = await pdfDoc.embedJpg(logoBuffer);
//       const logoDims = logoImage.scale(0.4);

//       detailsPage.drawImage(logoImage, {
//         x: (width - logoDims.width) / 2,
//         y: yPosition - logoDims.height,
//         width: logoDims.width,
//         height: logoDims.height,
//       });

//       yPosition -= logoDims.height + 20;
//     } catch {
//       yPosition -= 60;
//     }

//     detailsPage.drawText("Vertical Living", {
//       x: (width - boldFont.widthOfTextAtSize("Vertical Living", HEADER_FONT_SIZE)) / 2,
//       y: yPosition,
//       size: HEADER_FONT_SIZE,
//       font: boldFont,
//       color: rgb(0, 0, 0.8),
//     });

//     yPosition -= 40;

//     const drawSectionHeader = (title: string) => {
//       detailsPage.drawText(title, {
//         x: 50,
//         y: yPosition,
//         size: 14,
//         font: boldFont,
//         color: rgb(0.1, 0.1, 0.1),
//       });
//       yPosition -= 8;
//       detailsPage.drawLine({
//         start: { x: 50, y: yPosition },
//         end: { x: width - 50, y: yPosition },
//         thickness: 1,
//         color: rgb(0.6, 0.6, 0.6),
//       });
//       yPosition -= 25;
//     };

//     const drawRow = (label: string, value: string) => {
//       detailsPage.drawText(`${label}:`, {
//         x: 60,
//         y: yPosition,
//         size: FONT_SIZE + 1,
//         font: boldFont,
//         color: rgb(0.2, 0.2, 0.2),
//       });
//       detailsPage.drawText(value || "-", {
//         x: 180,
//         y: yPosition,
//         size: FONT_SIZE + 1,
//         font: normalFont,
//         color: rgb(0.1, 0.1, 0.1),
//       });
//       yPosition -= 22;
//     };

//     drawSectionHeader("Client Details");
//     drawRow("Name", clientData.clientName || "-");
//     drawRow("Email", clientData.email || "-");
//     drawRow("Phone", clientData.whatsapp || "-");
//     drawRow("Location", clientData.location || "-");

//     yPosition -= 10;

//     drawSectionHeader("Project Details");
//     drawRow("Project Name", projectData?.projectName || "-");
//     drawRow("Quote No", newVariant.quoteNo);
//     drawRow("Date", new Date().toLocaleDateString());

//     // === PAGE 2+ Furniture Rendering === //

//     let currentPage = pdfDoc.addPage();
//     yPosition = currentPage.getHeight() - 50;

//     const ensureSpace = (minHeight: number) => {
//       if (yPosition < minHeight) {
//         currentPage = pdfDoc.addPage();
//         yPosition = currentPage.getHeight() - 50;
//       }
//     };

//     for (const furniture of newVariant.furnitures) {
//       ensureSpace(80);

//       currentPage.drawText(`Furniture: ${furniture.furnitureName}`, {
//         x: 50,
//         y: yPosition,
//         font: boldFont,
//         size: 14,
//         color: rgb(0.1, 0.3, 0.5),
//       });

//       yPosition -= 20;

//       // --- Core Materials Table --- //
//       const coreMaterials = filterMaterialRows(furniture.coreMaterials);
//       if (coreMaterials.length > 0) {
//         currentPage.drawText("Core Materials", {
//           x: 50,
//           y: yPosition,
//           font: boldFont,
//           size: 12,
//         });
//         yPosition -= 20;

//         currentPage.drawText("Item Name         | Quantity | Cost", {
//           x: 60,
//           y: yPosition,
//           font: boldFont,
//           size: FONT_SIZE,
//           color: rgb(0.2, 0.2, 0.2),
//         });
//         yPosition -= 15;

//         for (const item of coreMaterials) {
//           const line = [
//             pad(item.itemName || "-", 20),
//             String(item.plywoodNos.quantity || 0),
//             `Rs: ${item.rowTotal}`,
//           ].join(" | ");

//           ensureSpace(30);
//           currentPage.drawText(line, {
//             x: 60,
//             y: yPosition,
//             font: normalFont,
//             size: FONT_SIZE,
//           });
//           yPosition -= FONT_SIZE + 4;
//         }

//         currentPage.drawText(`Subtotal: Rs: ${furniture.coreMaterialsTotal}`, {
//           x: 60,
//           y: yPosition - 6,
//           font: boldFont,
//           size: FONT_SIZE,
//           color: rgb(0, 0.4, 0),
//         });
//         yPosition -= SECTION_SPACE;
//       }

//       // --- Render Simple Section --- //
//       const renderSimpleSection = (title: string, rows: any[], total: number) => {
//         const validRows = filterSimpleRows(rows);
//         if (validRows.length === 0) return;

//         currentPage.drawText(title, {
//           x: 50,
//           y: yPosition,
//           font: boldFont,
//           size: 12,
//           color: rgb(0.1, 0.2, 0.2),
//         });
//         yPosition -= 20;

//         currentPage.drawText("Item Name         | Description      | Qty | Cost", {
//           x: 60,
//           y: yPosition,
//           font: boldFont,
//           size: FONT_SIZE,
//         });
//         yPosition -= 15;

//         for (const item of validRows) {
//           const desc = item.description || "-";
//           const line = [
//             pad(item.itemName || "-", 18),
//             pad(desc, 20),
//             String(item.quantity),
//             `Rs: ${item.rowTotal}`,
//           ].join(" | ");

//           ensureSpace(30);
//           currentPage.drawText(line, {
//             x: 60,
//             y: yPosition,
//             font: normalFont,
//             size: FONT_SIZE,
//           });
//           yPosition -= FONT_SIZE + 4;
//         }

//         currentPage.drawText(`Subtotal: Rs: ${total}`, {
//           x: 60,
//           y: yPosition - 6,
//           font: boldFont,
//           size: FONT_SIZE,
//           color: rgb(0, 0.4, 0),
//         });
//         yPosition -= SECTION_SPACE;
//       };

//       renderSimpleSection("Fittings", furniture.fittingsAndAccessories, furniture.fittingsAndAccessoriesTotal);
//       renderSimpleSection("Glues", furniture.glues, furniture.gluesTotal);
//       renderSimpleSection("Non-Branded Materials", furniture.nonBrandMaterials, furniture.nonBrandMaterialsTotal);

//       // Furniture Total
//       currentPage.drawText(`Furniture Total: Rs: ${furniture.furnitureTotal}`, {
//         x: 60,
//         y: yPosition,
//         font: boldFont,
//         size: 13,
//         color: rgb(0, 0.4, 0.1),
//       });
//       yPosition -= SECTION_SPACE;
//     }

//     // === GRANT TOTAL ===

//     if (yPosition < 80) {
//       currentPage = pdfDoc.addPage();
//       yPosition = currentPage.getHeight() - 50;
//     }

//     currentPage.drawText(`GRAND TOTAL: Rs: ${newVariant.grandTotal}`, {
//       x: 60,
//       y: yPosition,
//       font: boldFont,
//       size: 16,
//       color: rgb(0.1, 0.5, 0.1),
//     });

//     // === TERMS AND CONDITIONS ===
//     for (let i = 0; i < 3; i++) {
//       const termsPage = pdfDoc.addPage();
//       const centerX = termsPage.getWidth() / 2;
//       const centerY = termsPage.getHeight() / 2;
//       const text = "Terms and Conditions";

//       const textWidth = boldFont.widthOfTextAtSize(text, 22);

//       termsPage.drawText(text, {
//         x: centerX - textWidth / 2,
//         y: centerY,
//         font: boldFont,
//         size: 22,
//         color: rgb(0, 0, 0),
//       });
//     }

//     // === SAVE + UPLOAD ===
//     const pdfBytes = await pdfDoc.save();
//     const fileName = `home-interior-quote-${newVariant.quoteNo}-${Date.now()}.pdf`;

//     const uploadResult = await uploadToS3(pdfBytes, fileName);

//     const finalDoc = await QuoteVarientGenerateModel.findByIdAndUpdate(
//       newVariant._id,
//       {
//         pdfLink: {
//           type: "pdf",
//           url: uploadResult.Location,
//           originalName: fileName,
//           uploadedAt: new Date(),
//         },
//       },
//       { new: true }
//     );

//     return {
//       success: true,
//       fileUrl: uploadResult.Location,
//       fileName,
//       updatedDoc: finalDoc,
//     };
//   } catch (err: any) {
//     console.error("PDF generation error:", err);
//     throw new Error("Failed to generate variant quote PDF.");
//   }
// };

// // Utility to pad string in tables
// const pad = (str: string, len: number) => {
//   str = str || "-";
//   return str.padEnd(len, " ");
// };





// import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// import { COMPANY_LOGO, uploadToS3 } from "../../stage controllers/ordering material controller/pdfOrderHistory.controller";
// import QuoteVarientGenerateModel from "../../../models/Quote Model/QuoteVariant Model/quoteVarient.model";
// import ProjectModel from "../../../models/project model/project.model";
// import { RequirementFormModel } from "../../../models/Stage Models/requirment model/mainRequirementNew.model";

const FONT_SIZE = 12;
const HEADER_FONT_SIZE = 18;
const SECTION_SPACE = 30;
const TABLE_HEADER_BG_COLOR = rgb(0.2, 0.4, 0.6); // Dark blue background for headers
const TABLE_HEADER_TEXT_COLOR = rgb(1, 1, 1); // White text for headers

/**
 * Filter material rows: skip entirely empty rows (all default)
 */
const filterMaterialRows = (rows: any[]) => {
    return rows.filter((row) =>
        row &&
        (row.itemName || row.imageUrl || row.plywoodNos?.quantity > 0 || row.rowTotal > 0)
    );
};

/**
 * Filter simple rows like fittings, glues, nbms
 */
const filterSimpleRows = (rows: any[]) => {
    return rows.filter(
        (row) =>
            row &&
            (row.itemName || row.description || row.quantity > 0 || row.cost > 0 || row.rowTotal > 0)
    );
};

export const generateQuoteVariantPdf = async ({
    quoteId,
    projectId,
    newVariant,
}: {
    quoteId: string;
    projectId: string;
    newVariant: any;
}) => {
    try {
        const [projectData, clientDataDoc] = await Promise.all([
            ProjectModel.findById(projectId),
            RequirementFormModel.findOne({ projectId }),
        ]);

        const clientData: any = clientDataDoc?.clientData || {};

        const pdfDoc = await PDFDocument.create();
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const normalFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // === PAGE 1: Company + Client Info + Project Details === //
        const detailsPage = pdfDoc.addPage();
        const { width, height } = detailsPage.getSize();
        let yPosition = height - 50;

        // Define colors
        const PRIMARY_COLOR = rgb(0.1, 0.4, 0.9); // Blue from your example
        const TEXT_COLOR = rgb(0.2, 0.2, 0.2);
        const LIGHT_TEXT_COLOR = rgb(0.4, 0.4, 0.4);
        const LINE_COLOR = rgb(0.6, 0.6, 0.6);

        // Draw Company Logo and Name horizontally centered
        try {
            const logoRes = await fetch(COMPANY_LOGO);
            const logoBuffer = await logoRes.arrayBuffer();
            const logoImage = await pdfDoc.embedJpg(logoBuffer);

            const logoScale = 0.5;
            const logoDims = logoImage.scale(logoScale);

            const brandText = "Vertical Living";
            const brandFontSize = 20;
            const brandColor = PRIMARY_COLOR;
            const brandTextWidth = boldFont.widthOfTextAtSize(brandText, brandFontSize);

            const spacing = 10; // space between logo and text

            // Total width = logo + spacing + text
            const totalWidth = logoDims.width + spacing + brandTextWidth;

            // X and Y to center the whole block horizontally and set a top margin
            const combinedX = (width - totalWidth) / 2;
            const topY = yPosition; // use existing yPosition for vertical positioning

            // Draw logo
            detailsPage.drawImage(logoImage, {
                x: combinedX,
                y: topY - logoDims.height,
                width: logoDims.width,
                height: logoDims.height,
            });

            // Align text vertically with logo (visually aligned mid-way)
            const textY = topY - (logoDims.height / 2) - (brandFontSize / 3);

            // Draw text next to logo
            detailsPage.drawText(brandText, {
                x: combinedX + logoDims.width + spacing,
                y: textY,
                size: brandFontSize,
                font: boldFont,
                color: brandColor,
            });

            // Update yPosition to be below the logo
            yPosition = topY - logoDims.height - 5;

            // Draw horizontal line
            detailsPage.drawLine({
                start: { x: 50, y: yPosition },
                end: { x: width - 50, y: yPosition },
                thickness: 1,
                color: LINE_COLOR,
            });

            yPosition -= 30;
        } catch (err) {
            console.error("Failed to load company logo:", err);

            // Fallback: Just draw the company name if logo fails
            const COMPANY_NAME = "Vertical Living";
            const brandFontSize = 20;
            const brandTextWidth = boldFont.widthOfTextAtSize(COMPANY_NAME, brandFontSize);

            detailsPage.drawText(COMPANY_NAME, {
                x: (width - brandTextWidth) / 2,
                y: yPosition,
                size: brandFontSize,
                font: boldFont,
                color: PRIMARY_COLOR,
            });

            yPosition -= 40;

            // Draw horizontal line
            detailsPage.drawLine({
                start: { x: 50, y: yPosition },
                end: { x: width - 50, y: yPosition },
                thickness: 1,
                color: LINE_COLOR,
            });

            yPosition -= 30;
        }

        // Updated drawSectionHeader function with underline
        const drawSectionHeader = (title: string) => {
            // Draw section title
            detailsPage.drawText(title, {
                x: 50,
                y: yPosition,
                size: 16,
                font: boldFont,
                color: TEXT_COLOR,
            });

            // Calculate text width to determine underline length
            const textWidth = boldFont.widthOfTextAtSize(title, 16);

            yPosition -= 8;

            // Draw underline only for the text width + some padding
            detailsPage.drawLine({
                start: { x: 50, y: yPosition },
                end: { x: 50 + textWidth + 10, y: yPosition }, // Add 10px padding
                thickness: 2,
                color: LINE_COLOR,
            });

            yPosition -= 25;
        };

        // Updated drawRow function
        const drawRow = (label: string, value: string, isBoldValue = false) => {
            // Draw label
            detailsPage.drawText(`${label}:`, {
                x: 60,
                y: yPosition,
                size: FONT_SIZE,
                font: boldFont,
                color: TEXT_COLOR,
            });

            // Draw value with different styling if bold
            detailsPage.drawText(value || "-", {
                x: 180,
                y: yPosition,
                size: FONT_SIZE,
                font: isBoldValue ? boldFont : normalFont,
                color: isBoldValue ? PRIMARY_COLOR : LIGHT_TEXT_COLOR,
            });

            yPosition -= 22;
        };



        // Client Details Section
        drawSectionHeader("Client Details");
        drawRow("Name", clientData.clientName || "-", true);
        drawRow("Email", clientData.email || "-", true);
        drawRow("Phone", clientData.whatsapp || "-", true);
        drawRow("Location", clientData.location || "-", true);

        yPosition -= 15;

        // Project Details Section
        drawSectionHeader("Project Details");
        drawRow("Project Name", projectData?.projectName || "-", true);
        drawRow("Quote No", newVariant.quoteNo, true);
        drawRow("Date", new Date().toLocaleDateString(), true);
        if(newVariant?.brandName){
            drawRow("Brand", newVariant?.brandName, true);
        }

        // Add a decorative line at the bottom if there's space
        // if (yPosition > 100) {
        //     detailsPage.drawLine({
        //         start: { x: 50, y: yPosition - 20 },
        //         end: { x: width - 50, y: yPosition - 20 },
        //         thickness: 1,
        //         color: LINE_COLOR,
        //     });
        // }

        yPosition -= 30;

        // END of first page

        // === Furniture Pages === //
        // let currentPage = pdfDoc.addPage();
        // yPosition = currentPage.getHeight() - 50;

        // const ensureSpace = (minHeight: number) => {
        //     if (yPosition < minHeight) {
        //         currentPage = pdfDoc.addPage();
        //         yPosition = currentPage.getHeight() - 50;
        //     }
        // };

        // // Function to draw table headers
        // const drawTableHeader = (headers: string[], columnWidths: number[]) => {
        //     const headerHeight = 25;
        //     const startX = 50;

        //     // Draw header background
        //     currentPage.drawRectangle({
        //         x: startX,
        //         y: yPosition - headerHeight + 5,
        //         width: width - 100,
        //         height: headerHeight,
        //         color: TABLE_HEADER_BG_COLOR,
        //     });

        //     // Draw header text
        //     let xPos = startX + 10;
        //     for (let i = 0; i < headers.length; i++) {
        //         currentPage.drawText(headers[i], {
        //             x: xPos,
        //             y: yPosition - 15,
        //             font: boldFont,
        //             size: FONT_SIZE,
        //             color: TABLE_HEADER_TEXT_COLOR,
        //         });
        //         xPos += columnWidths[i];
        //     }

        //     yPosition -= headerHeight + 10;
        // };

        // for (const furniture of newVariant.furnitures) {
        //     ensureSpace(100);

        //     // Furniture header
        //     currentPage.drawText(`Furniture: ${furniture.furnitureName}`, {
        //         x: 50,
        //         y: yPosition,
        //         font: boldFont,
        //         size: 16,
        //         color: rgb(0.1, 0.3, 0.5),
        //     });
        //     yPosition -= 30;

        //     // --- Core Materials Table --- //
        //     const coreMaterials = filterMaterialRows(furniture.coreMaterials);
        //     if (coreMaterials.length > 0) {
        //         drawTableHeader(
        //             ["Image", "Item Name", "Quantity", "Cost"],
        //             [80, 200, 100, 100]
        //         );

        //         for (const item of coreMaterials) {
        //             ensureSpace(60);

        //             // Draw image if available
        //             if (item.imageUrl) {
        //                 try {
        //                     const imageRes = await fetch(item.imageUrl);
        //                     const imageBuffer = await imageRes.arrayBuffer();
        //                     const image = await pdfDoc.embedPng(imageBuffer);
        //                     const imageDims = image.scale(0.1);

        //                     currentPage.drawImage(image, {
        //                         x: 55,
        //                         y: yPosition - 15,
        //                         width: imageDims.width,
        //                         height: imageDims.height,
        //                     });
        //                 } catch (error) {
        //                     console.error("Error loading image:", error);
        //                     currentPage.drawText("No Image", {
        //                         x: 60,
        //                         y: yPosition,
        //                         font: normalFont,
        //                         size: FONT_SIZE - 2,
        //                     });
        //                 }
        //             } else {
        //                 currentPage.drawText("No Image", {
        //                     x: 60,
        //                     y: yPosition,
        //                     font: normalFont,
        //                     size: FONT_SIZE - 2,
        //                 });
        //             }

        //             // Draw item details
        //             currentPage.drawText(item.itemName || "-", {
        //                 x: 140,
        //                 y: yPosition,
        //                 font: normalFont,
        //                 size: FONT_SIZE,
        //             });

        //             currentPage.drawText(String(item.plywoodNos?.quantity || 0), {
        //                 x: 340,
        //                 y: yPosition,
        //                 font: normalFont,
        //                 size: FONT_SIZE,
        //             });

        //             currentPage.drawText(`${item.rowTotal}`, {
        //                 x: 440,
        //                 y: yPosition,
        //                 font: boldFont,
        //                 size: FONT_SIZE,
        //                 color: rgb(0, 0.4, 0),
        //             });

        //             yPosition -= 25;
        //         }

        //         // Subtotal
        //         ensureSpace(30);
        //         currentPage.drawText(`Subtotal: Rs: ${furniture.coreMaterialsTotal}`, {
        //             x: width - 200,
        //             y: yPosition,
        //             font: boldFont,
        //             size: FONT_SIZE,
        //             color: rgb(0, 0.4, 0),
        //         });
        //         yPosition -= SECTION_SPACE;
        //     }

        //     // Function to render simple sections (fittings, glues, nbms)
        //     const renderSimpleSection = (title: string, rows: any[], total: number) => {
        //         const validRows = filterSimpleRows(rows);
        //         if (validRows.length === 0) return;

        //         ensureSpace(80);
        //         currentPage.drawText(title, {
        //             x: 50,
        //             y: yPosition,
        //             font: boldFont,
        //             size: 14,
        //             color: rgb(0.1, 0.2, 0.2),
        //         });
        //         yPosition -= 30;

        //         drawTableHeader(
        //             ["Item Name", "Description", "Quantity", "Cost"],
        //             [150, 200, 80, 100]
        //         );

        //         for (const item of validRows) {
        //             ensureSpace(30);

        //             currentPage.drawText(item.itemName || "-", {
        //                 x: 60,
        //                 y: yPosition,
        //                 font: normalFont,
        //                 size: FONT_SIZE,
        //             });

        //             currentPage.drawText(item.description || "-", {
        //                 x: 210,
        //                 y: yPosition,
        //                 font: normalFont,
        //                 size: FONT_SIZE,
        //             });

        //             currentPage.drawText(String(item.quantity || 0), {
        //                 x: 410,
        //                 y: yPosition,
        //                 font: normalFont,
        //                 size: FONT_SIZE,
        //             });

        //             currentPage.drawText(`Rs: ${item.rowTotal}`, {
        //                 x: 490,
        //                 y: yPosition,
        //                 font: boldFont,
        //                 size: FONT_SIZE,
        //                 color: rgb(0, 0.4, 0),
        //             });

        //             yPosition -= 20;
        //         }

        //         // Subtotal
        //         ensureSpace(30);
        //         currentPage.drawText(`Subtotal: Rs: ${total}`, {
        //             x: width - 200,
        //             y: yPosition,
        //             font: boldFont,
        //             size: FONT_SIZE,
        //             color: rgb(0, 0.4, 0),
        //         });
        //         yPosition -= SECTION_SPACE;
        //     };

        //     renderSimpleSection("Fittings", furniture.fittingsAndAccessories, furniture.fittingsAndAccessoriesTotal);
        //     renderSimpleSection("Glues", furniture.glues, furniture.gluesTotal);
        //     renderSimpleSection("Non-Branded Materials", furniture.nonBrandMaterials, furniture.nonBrandMaterialsTotal);

        //     // Furniture Total
        //     ensureSpace(40);
        //     currentPage.drawText(`Furniture Total: Rs: ${furniture.furnitureTotal}`, {
        //         x: width - 250,
        //         y: yPosition,
        //         font: boldFont,
        //         size: 14,
        //         color: rgb(0, 0.4, 0.1),
        //     });
        //     yPosition -= SECTION_SPACE * 1.5;
        // }



        // === Furniture Pages === //

        // second page
        let currentPage = pdfDoc.addPage();
        yPosition = currentPage.getHeight() - 50;

        const ensureSpace = (minHeight: number) => {
            if (yPosition < minHeight) {
                currentPage = pdfDoc.addPage();
                yPosition = currentPage.getHeight() - 50;
            }
        };

        // // Helper function to wrap text
        // const wrapText = (text: string, maxWidth: number, font: any, fontSize: number): string[] => {
        //     const words = text.split(' ');
        //     const lines: string[] = [];
        //     let currentLine = words[0];

        //     for (let i = 1; i < words.length; i++) {
        //         const word = words[i];
        //         const width = font.widthOfTextAtSize(currentLine + ' ' + word, fontSize);
        //         if (width < maxWidth) {
        //             currentLine += ' ' + word;
        //         } else {
        //             lines.push(currentLine);
        //             currentLine = word;
        //         }
        //     }
        //     lines.push(currentLine);
        //     return lines;
        // };

        // THIRD VERSION OF DROW TABLE WITH BORDERS
        // Function to draw table with borders
        // const drawTableWithBorders = async (headers: string[], columnWidths: number[], rows: any[], isCoreMaterials = false) => {
        //     const headerHeight = 25;
        //     const baseRowHeight = 25;
        //     const startX = 50;
        //     const tableWidth = width - 100;
        //     const padding = 8;

        //     // Draw header background
        //     currentPage.drawRectangle({
        //         x: startX,
        //         y: yPosition - headerHeight + 5,
        //         width: tableWidth,
        //         height: headerHeight,
        //         color: TABLE_HEADER_BG_COLOR,
        //     });

        //     // Draw header text and vertical borders
        //     let xPos = startX;
        //     for (let i = 0; i < headers.length; i++) {
        //         // Draw header text (centered)
        //         const textWidth = boldFont.widthOfTextAtSize(headers[i], FONT_SIZE);
        //         currentPage.drawText(headers[i], {
        //             x: xPos + (columnWidths[i] - textWidth) / 2,
        //             y: yPosition - 15,
        //             font: boldFont,
        //             size: FONT_SIZE,
        //             color: TABLE_HEADER_TEXT_COLOR,
        //         });

        //         // Draw vertical border between headers (white)
        //         if (i < headers.length - 1) {
        //             currentPage.drawLine({
        //                 start: { x: xPos + columnWidths[i], y: yPosition - headerHeight + 5 },
        //                 end: { x: xPos + columnWidths[i], y: yPosition + 5 },
        //                 thickness: 1,
        //                 color: rgb(1, 1, 1), // White border
        //             });
        //         }

        //         xPos += columnWidths[i];
        //     }

        //     // Draw horizontal border below header
        //     currentPage.drawLine({
        //         start: { x: startX, y: yPosition - headerHeight + 5 },
        //         end: { x: startX + tableWidth, y: yPosition - headerHeight + 5 },
        //         thickness: 1,
        //         color: TABLE_HEADER_BG_COLOR,
        //     });

        //     yPosition -= headerHeight + 5;

        //     // Draw rows with borders
        //     for (const row of rows) {
        //         ensureSpace(baseRowHeight + 20);

        //         xPos = startX;
        //         let columnIndex = 0;
        //         let rowYPosition = yPosition;
        //         let maxLinesInRow = 1;

        //         // For core materials table
        //         if (isCoreMaterials) {
        //             // Image column (centered)
        //             const imageCellHeight = 30;
        //             if (row.imageUrl) {
        //                 try {
        //                     const imageRes = await fetch(row.imageUrl);
        //                     if (imageRes.ok) {
        //                         const imageBuffer = await imageRes.arrayBuffer();
        //                         try {
        //                             const image = await pdfDoc.embedPng(imageBuffer);
        //                             const maxImageSize = 25;
        //                             const scale = Math.min(maxImageSize / image.width, maxImageSize / image.height);
        //                             const imageDims = { width: image.width * scale, height: image.height * scale };

        //                             currentPage.drawImage(image, {
        //                                 x: xPos + (columnWidths[columnIndex] - imageDims.width) / 2,
        //                                 y: rowYPosition - imageDims.height + 5,
        //                                 width: imageDims.width,
        //                                 height: imageDims.height,
        //                             });
        //                         } catch (e) {
        //                             // If PNG fails, try JPG
        //                             try {
        //                                 const image = await pdfDoc.embedJpg(imageBuffer);
        //                                 const maxImageSize = 25;
        //                                 const scale = Math.min(maxImageSize / image.width, maxImageSize / image.height);
        //                                 const imageDims = { width: image.width * scale, height: image.height * scale };

        //                                 currentPage.drawImage(image, {
        //                                     x: xPos + (columnWidths[columnIndex] - imageDims.width) / 2,
        //                                     y: rowYPosition - imageDims.height + 5,
        //                                     width: imageDims.width,
        //                                     height: imageDims.height,
        //                                 });
        //                             } catch (e) {
        //                                 drawCenteredText("Invalid Image", xPos, columnWidths[columnIndex], rowYPosition, normalFont, FONT_SIZE - 2);
        //                             }
        //                         }
        //                     } else {
        //                         drawCenteredText("No Image", xPos, columnWidths[columnIndex], rowYPosition, normalFont, FONT_SIZE - 2);
        //                     }
        //                 } catch (error) {
        //                     drawCenteredText("No Image", xPos, columnWidths[columnIndex], rowYPosition, normalFont, FONT_SIZE - 2);
        //                 }
        //             } else {
        //                 drawCenteredText("No Image", xPos, columnWidths[columnIndex], rowYPosition, normalFont, FONT_SIZE - 2);
        //             }

        //             xPos += columnWidths[columnIndex++];

        //             // Item Name column (left aligned)
        //             const itemName = row.itemName || "-";
        //             drawLeftAlignedText(itemName, xPos, columnWidths[columnIndex], rowYPosition, normalFont, FONT_SIZE);
        //             xPos += columnWidths[columnIndex++];

        //             // Quantity column (centered)
        //             const quantityText = String(row.plywoodNos?.quantity || 0);
        //             drawCenteredText(quantityText, xPos, columnWidths[columnIndex], rowYPosition, normalFont, FONT_SIZE);
        //             xPos += columnWidths[columnIndex++];

        //             // Cost column (centered)
        //             const costText = `${row.rowTotal}`;
        //             drawCenteredText(costText, xPos, columnWidths[columnIndex], rowYPosition, boldFont, FONT_SIZE, rgb(0, 0.4, 0));
        //         } 
        //         // For simple tables (fittings, glues, nbms)
        //         else {
        //             // Item Name column (left aligned)
        //             const itemName = row.itemName || "-";
        //             drawLeftAlignedText(itemName, xPos, columnWidths[columnIndex], rowYPosition, normalFont, FONT_SIZE);
        //             xPos += columnWidths[columnIndex++];

        //             // Description column (left aligned)
        //             const description = row.description || "-";
        //             drawLeftAlignedText(description, xPos, columnWidths[columnIndex], rowYPosition, normalFont, FONT_SIZE);
        //             xPos += columnWidths[columnIndex++];

        //             // Quantity column (centered)
        //             const quantityText = String(row.quantity || 0);
        //             drawCenteredText(quantityText, xPos, columnWidths[columnIndex], rowYPosition, normalFont, FONT_SIZE);
        //             xPos += columnWidths[columnIndex++];

        //             // Cost column (centered)
        //             const costText = `${row.rowTotal}`;
        //             drawCenteredText(costText, xPos, columnWidths[columnIndex], rowYPosition, boldFont, FONT_SIZE, rgb(0, 0.4, 0));
        //         }

        //         // Draw horizontal border below this row
        //         currentPage.drawLine({
        //             start: { x: startX, y: yPosition - baseRowHeight },
        //             end: { x: startX + tableWidth, y: yPosition - baseRowHeight },
        //             thickness: 1,
        //             color: TABLE_HEADER_BG_COLOR,
        //         });

        //         // Draw vertical borders for this row
        //         xPos = startX;
        //         for (let i = 0; i < headers.length; i++) {
        //             if (i > 0) {
        //                 currentPage.drawLine({
        //                     start: { x: xPos, y: yPosition },
        //                     end: { x: xPos, y: yPosition - baseRowHeight },
        //                     thickness: 1,
        //                     color: TABLE_HEADER_BG_COLOR,
        //                 });
        //             }
        //             xPos += columnWidths[i];
        //         }

        //         // Draw right border
        //         currentPage.drawLine({
        //             start: { x: startX + tableWidth, y: yPosition },
        //             end: { x: startX + tableWidth, y: yPosition - baseRowHeight },
        //             thickness: 1,
        //             color: TABLE_HEADER_BG_COLOR,
        //         });

        //         yPosition -= baseRowHeight;
        //     }

        //     yPosition -= 15;
        // };


        // FOURTH VERSION FO TABLE WITH BORDERS
        const drawTableWithBorders = async (headers: string[], columnWidths: number[], rows: any[], isCoreMaterials = false) => {
            const headerHeight = 25;
            const baseRowHeight = 25;
            const startX = 50;
            const tableWidth = width - 100;
            const padding = 8;

            // Draw header background
            currentPage.drawRectangle({
                x: startX,
                y: yPosition - headerHeight + 5,
                width: tableWidth,
                height: headerHeight,
                color: TABLE_HEADER_BG_COLOR,
            });

            // Draw header text and vertical borders
            let xPos = startX;
            for (let i = 0; i < headers.length; i++) {
                // Draw header text (centered)
                const textWidth = boldFont.widthOfTextAtSize(headers[i], FONT_SIZE);
                currentPage.drawText(headers[i], {
                    x: xPos + (columnWidths[i] - textWidth) / 2,
                    y: yPosition - 15,
                    font: boldFont,
                    size: FONT_SIZE,
                    color: TABLE_HEADER_TEXT_COLOR,
                });

                // Draw vertical border between headers (white)
                if (i < headers.length - 1) {
                    currentPage.drawLine({
                        start: { x: xPos + columnWidths[i], y: yPosition - headerHeight + 5 },
                        end: { x: xPos + columnWidths[i], y: yPosition + 5 },
                        thickness: 1,
                        color: rgb(1, 1, 1), // White border
                    });
                }

                xPos += columnWidths[i];
            }

            // Draw horizontal border below header
            currentPage.drawLine({
                start: { x: startX, y: yPosition - headerHeight + 5 },
                end: { x: startX + tableWidth, y: yPosition - headerHeight + 5 },
                thickness: 1,
                color: TABLE_HEADER_BG_COLOR,
            });

            yPosition -= headerHeight + 5;

            // Draw rows with borders
            for (const row of rows) {
                let rowHeight = baseRowHeight;

                // Calculate required row height for core materials with images
                if (isCoreMaterials && row.imageUrl) {
                    rowHeight = Math.max(rowHeight, 40); // Minimum height for images
                }

                ensureSpace(rowHeight + 20);

                xPos = startX;
                let columnIndex = 0;
                let rowYPosition = yPosition;

                // For core materials table
                if (isCoreMaterials) {

                    const imageCellHeight = rowHeight;
                    if (row.imageUrl) {
                        try {
                            const imageRes = await fetch(row.imageUrl);
                            if (imageRes.ok) {
                                const imageBuffer = await imageRes.arrayBuffer();
                                try {
                                    const image = await pdfDoc.embedPng(imageBuffer);
                                    const maxImageSize = 25;
                                    const scale = Math.min(maxImageSize / image.width, maxImageSize / image.height);
                                    const imageDims = { width: image.width * scale, height: image.height * scale };

                                    // Calculate position to center image vertically and horizontally
                                    const imageX = xPos + (columnWidths[columnIndex] - imageDims.width) / 2;
                                    const imageY = rowYPosition - (rowHeight + imageDims.height) / 2 + 5;

                                    currentPage.drawImage(image, {
                                        x: imageX,
                                        y: imageY,
                                        width: imageDims.width,
                                        height: imageDims.height,
                                    });
                                } catch (e) {
                                    // If PNG fails, try JPG
                                    try {
                                        const image = await pdfDoc.embedJpg(imageBuffer);
                                        const maxImageSize = 25;
                                        const scale = Math.min(maxImageSize / image.width, maxImageSize / image.height);
                                        const imageDims = { width: image.width * scale, height: image.height * scale };

                                        // Calculate position to center image vertically and horizontally
                                        const imageX = xPos + (columnWidths[columnIndex] - imageDims.width) / 2;
                                        const imageY = rowYPosition - (rowHeight + imageDims.height) / 2 + 5;

                                        currentPage.drawImage(image, {
                                            x: imageX,
                                            y: imageY,
                                            width: imageDims.width,
                                            height: imageDims.height,
                                        });
                                    } catch (e) {
                                        // Center the error text vertically
                                        const textY = rowYPosition - rowHeight / 2 - 3;
                                        drawCenteredText("Invalid Image", xPos, columnWidths[columnIndex], textY, normalFont, FONT_SIZE - 2);
                                    }
                                }
                            } else {
                                // Center the "No Image" text vertically
                                const textY = rowYPosition - rowHeight / 2 - 3;
                                drawCenteredText("No Image", xPos, columnWidths[columnIndex], textY, normalFont, FONT_SIZE - 2);
                            }
                        } catch (error) {
                            // Center the "No Image" text vertically
                            const textY = rowYPosition - rowHeight / 2 - 3;
                            drawCenteredText("No Image", xPos, columnWidths[columnIndex], textY, normalFont, FONT_SIZE - 2);
                        }
                    } else {
                        // Center the "No Image" text vertically
                        const textY = rowYPosition - rowHeight / 2 - 3;
                        drawCenteredText("No Image", xPos, columnWidths[columnIndex], textY, normalFont, FONT_SIZE - 2);
                    }

                    xPos += columnWidths[columnIndex++];

                    // Item Name column (left aligned)
                    const itemName = row.itemName || "-";
                    drawLeftAlignedText(itemName, xPos, columnWidths[columnIndex], rowYPosition - rowHeight / 2, normalFont, FONT_SIZE);
                    xPos += columnWidths[columnIndex++];

                    // Quantity column (centered)
                    const quantityText = String(row.plywoodNos?.quantity || 0);
                    drawCenteredText(quantityText, xPos, columnWidths[columnIndex], rowYPosition - rowHeight / 2, normalFont, FONT_SIZE);
                    xPos += columnWidths[columnIndex++];

                    // Cost column (centered)
                    const costText = `${row.rowTotal}`;
                    drawCenteredText(costText, xPos, columnWidths[columnIndex], rowYPosition - rowHeight / 2, boldFont, FONT_SIZE, rgb(0, 0.4, 0));
                }
                // For simple tables (fittings, glues, nbms)
                else {
                    // Item Name column (left aligned)
                    const itemName = row.itemName || "-";
                    drawLeftAlignedText(itemName, xPos, columnWidths[columnIndex], rowYPosition - rowHeight / 2, normalFont, FONT_SIZE);
                    xPos += columnWidths[columnIndex++];

                    // Description column (left aligned)
                    const description = row.description || "-";
                    drawLeftAlignedText(description, xPos, columnWidths[columnIndex], rowYPosition - rowHeight / 2, normalFont, FONT_SIZE);
                    xPos += columnWidths[columnIndex++];

                    // Quantity column (centered)
                    const quantityText = String(row.quantity || 0);
                    drawCenteredText(quantityText, xPos, columnWidths[columnIndex], rowYPosition - rowHeight / 2, normalFont, FONT_SIZE);
                    xPos += columnWidths[columnIndex++];

                    // Cost column (centered)
                    const costText = `${row.rowTotal}`;
                    drawCenteredText(costText, xPos, columnWidths[columnIndex], rowYPosition - rowHeight / 2, boldFont, FONT_SIZE, rgb(0, 0.4, 0));
                }

                // Draw horizontal border below this row
                currentPage.drawLine({
                    start: { x: startX, y: yPosition - rowHeight },
                    end: { x: startX + tableWidth, y: yPosition - rowHeight },
                    thickness: 1,
                    color: TABLE_HEADER_BG_COLOR,
                });

                // Draw vertical borders for this row
                xPos = startX;
                for (let i = 0; i < headers.length; i++) {
                    if (i > 0) {
                        currentPage.drawLine({
                            start: { x: xPos, y: yPosition },
                            end: { x: xPos, y: yPosition - rowHeight },
                            thickness: 1,
                            color: TABLE_HEADER_BG_COLOR,
                        });
                    }
                    xPos += columnWidths[i];
                }

                // Draw right border
                currentPage.drawLine({
                    start: { x: startX + tableWidth, y: yPosition },
                    end: { x: startX + tableWidth, y: yPosition - rowHeight },
                    thickness: 1,
                    color: TABLE_HEADER_BG_COLOR,
                });

                yPosition -= rowHeight;
            }

            yPosition -= 15;
        };

        // Helper function to draw centered text
        const drawCenteredText = (text: string, x: number, width: number, y: number, font: any, size: number, color = rgb(0, 0, 0)) => {
            const textWidth = font.widthOfTextAtSize(text, size);
            currentPage.drawText(text, {
                x: x + (width - textWidth) / 2,
                y: y - 5,
                font: font,
                size: size,
                color: color,
            });
        };

        // Helper function to draw left-aligned text
        const drawLeftAlignedText = (text: string, x: number, width: number, y: number, font: any, size: number, color = rgb(0, 0, 0)) => {
            const maxWidth = width - 10;
            let displayText = text;

            // Truncate text if too long
            if (font.widthOfTextAtSize(text, size) > maxWidth) {
                let truncated = text;
                while (truncated.length > 3 && font.widthOfTextAtSize(truncated + '...', size) > maxWidth) {
                    truncated = truncated.slice(0, -1);
                }
                displayText = truncated + '...';
            }

            currentPage.drawText(displayText, {
                x: x + 5,
                y: y - 5,
                font: font,
                size: size,
                color: color,
            });
        };


       
console.log("newVariant", newVariant)
        for (const furniture of newVariant.furnitures) {
            ensureSpace(100);

            // Furniture header
            currentPage.drawText(`Furniture: ${furniture.furnitureName}`, {
                x: 50,
                y: yPosition,
                font: boldFont,
                size: 16,
                color: rgb(0.1, 0.3, 0.5),
            });
            yPosition -= 30;

            // --- Core Materials Table --- //
            const coreMaterials = filterMaterialRows(furniture.coreMaterials);
            if (coreMaterials.length > 0) {
                currentPage.drawText("Core Materials", {
                    x: 50,
                    y: yPosition,
                    font: boldFont,
                    size: 14,
                    color: rgb(0.1, 0.2, 0.2),
                });
                yPosition -= 20;

                await drawTableWithBorders(
                    ["Image", "Item Name", "Quantity", "Cost"],
                    [80, 200, 100, 100],
                    coreMaterials,
                    true // isCoreMaterials
                );

                // Subtotal
                ensureSpace(30);
                currentPage.drawText(`Subtotal: Rs: ${furniture.coreMaterialsTotal}`, {
                    x: width - 200,
                    y: yPosition,
                    font: boldFont,
                    size: FONT_SIZE,
                    color: rgb(0, 0.4, 0),
                });
                yPosition -= SECTION_SPACE;
            }

            // Function to render simple sections (fittings, glues, nbms)
            const renderSimpleSection = async (title: string, rows: any[], total: number) => {
                const validRows = filterSimpleRows(rows);
                if (validRows.length === 0) return;

                ensureSpace(80);
                currentPage.drawText(title, {
                    x: 50,
                    y: yPosition,
                    font: boldFont,
                    size: 14,
                    color: rgb(0.1, 0.2, 0.2),
                });
                yPosition -= 20;

                await drawTableWithBorders(
                    ["Item Name", "Description", "Quantity", "Cost"],
                    [150, 200, 80, 100],
                    validRows,
                    false // not core materials
                );

                // Subtotal
                ensureSpace(30);
                currentPage.drawText(`Subtotal: Rs: ${total}`, {
                    x: width - 200,
                    y: yPosition,
                    font: boldFont,
                    size: FONT_SIZE,
                    color: rgb(0, 0.4, 0),
                });
                yPosition -= SECTION_SPACE;
            };

            await renderSimpleSection("Fittings", furniture.fittingsAndAccessories, furniture.fittingsAndAccessoriesTotal);
            await renderSimpleSection("Glues", furniture.glues, furniture.gluesTotal);
            await renderSimpleSection("Non-Branded Materials", furniture.nonBrandMaterials, furniture.nonBrandMaterialsTotal);

            // Furniture Total
            ensureSpace(40);
            currentPage.drawText(`Furniture Total: Rs: ${furniture.furnitureTotal}`, {
                x: width - 250,
                y: yPosition,
                font: boldFont,
                size: 14,
                color: rgb(0, 0.4, 0.1),
            });
            yPosition -= SECTION_SPACE * 1.5;
        }

        // === GRAND TOTAL ===
        // Add grand total on current page if space available
        if (yPosition > 100) {
            currentPage.drawText(`GRAND TOTAL: Rs:${newVariant.grandTotal}`, {
                // x: width - 300,
                x: 50,
                y: yPosition,
                font: boldFont,
                size: 16,
                color: rgb(0.1, 0.5, 0.1),
            });
        } else {
            // If not enough space, create a new page
            currentPage = pdfDoc.addPage();
            yPosition = currentPage.getHeight() - 100;

            currentPage.drawText(`GRAND TOTAL: Rs: ${newVariant.grandTotal}`, {
                x: (width - boldFont.widthOfTextAtSize(`GRAND TOTAL: Rs: ${newVariant.grandTotal}`, 16)) / 2,
                y: yPosition,
                font: boldFont,
                size: 16,
                color: rgb(0.1, 0.5, 0.1),
            });
        }

        // === TERMS AND CONDITIONS ===
        for (let i = 0; i < 3; i++) {
            const termsPage = pdfDoc.addPage();
            const centerX = termsPage.getWidth() / 2;
            const centerY = termsPage.getHeight() / 2;
            const text = "Terms and Conditions";

            const textWidth = boldFont.widthOfTextAtSize(text, 22);

            termsPage.drawText(text, {
                x: centerX - textWidth / 2,
                y: centerY,
                font: boldFont,
                size: 22,
                color: rgb(0, 0, 0),
            });
        }

        // === SAVE + UPLOAD ===
        const pdfBytes = await pdfDoc.save();
        const fileName = `home-interior-quote-${newVariant.quoteNo}-${Date.now()}.pdf`;

        const uploadResult = await uploadToS3(pdfBytes, fileName);

        const finalDoc = await QuoteVarientGenerateModel.findByIdAndUpdate(
            newVariant._id,
            {
                pdfLink: {
                    type: "pdf",
                    url: uploadResult.Location,
                    originalName: fileName,
                    uploadedAt: new Date(),
                },
            },
            { new: true }
        );

        return {
            success: true,
            fileUrl: uploadResult.Location,
            fileName,
            updatedDoc: finalDoc,
        };
    } catch (err: any) {
        console.error("PDF generation error:", err);
        throw new Error("Failed to generate variant quote PDF.");
    }
};