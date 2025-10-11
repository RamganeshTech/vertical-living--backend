import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { COMPANY_LOGO, uploadToS3 } from "../../stage controllers/ordering material controller/pdfOrderHistory.controller";
import QuoteVarientGenerateModel from "../../../models/Quote Model/QuoteVariant Model/quoteVarient.model";
import ProjectModel from "../../../models/project model/project.model";
import { RequirementFormModel } from "../../../models/Stage Models/requirment model/mainRequirementNew.model";

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
        if (newVariant?.brandName) {
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

        // END OF FIRST PAGE 

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

        const drawLeftAlignedText = (text: string, x: number, width: number, y: number, font: any, size: number, color = rgb(0, 0, 0)) => {
    const maxWidth = width - 10;
    const lineHeight = size * 1.2;
    const lines: string[] = [];
    
    // If text fits in one line, just draw it
    if (font.widthOfTextAtSize(text, size) <= maxWidth) {
        currentPage.drawText(text, {
            x: x + 5,
            y: y - size, // Adjust Y position to be at the baseline
            font: font,
            size: size,
            color: color,
        });
        return 1;
    }

    // Split text into multiple lines based on max width
    let currentLine = '';
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const testLine = currentLine + char;
        const testWidth = font.widthOfTextAtSize(testLine, size);
        
        if (testWidth <= maxWidth) {
            currentLine = testLine;
        } else {
            // Add the current line and start a new one
            lines.push(currentLine);
            currentLine = char;
        }
    }
    
    // Add the last line
    if (currentLine) {
        lines.push(currentLine);
    }

    // Draw each line from bottom to top
    let currentY = y - size; // Start from the baseline
    for (const line of lines) {
        currentPage.drawText(line, {
            x: x + 5,
            y: currentY,
            font: font,
            size: size,
            color: color,
        });
        currentY -= lineHeight;
    }

    return lines.length;
};

// Helper function to calculate number of lines needed for text
const calculateTextLines = (text: string, maxWidth: number, font: any, size: number): number => {
    // If text fits in one line, return 1
    if (font.widthOfTextAtSize(text, size) <= maxWidth) {
        return 1;
    }

    let lines = 1;
    let currentLine = '';
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const testLine = currentLine + char;
        const testWidth = font.widthOfTextAtSize(testLine, size);
        
        if (testWidth <= maxWidth) {
            currentLine = testLine;
        } else {
            lines++;
            currentLine = char;
        }
    }

    return lines;
};

// Helper function to draw centered text
const drawCenteredText = (text: string, x: number, width: number, y: number, font: any, size: number, color = rgb(0, 0, 0)) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    currentPage.drawText(text, {
        x: x + (width - textWidth) / 2,
        y: y - size, // Adjust Y position to be at the baseline
        font: font,
        size: size,
        color: color,
    });
};

const drawTableWithBorders = async (headers: string[], columnWidths: number[], rows: any[], isCoreMaterials = false) => {
    const headerHeight = 25;
    const baseRowHeight = 25;
    const lineHeight = FONT_SIZE * 1.2;
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
        let maxLines = 1;

       
        // Calculate required row height based on text content
// Calculate required row height based on text content
if (!isCoreMaterials) {
    // For non-core materials table
    const description = row.description || "-";
    const descriptionLines = calculateTextLines(description, columnWidths[1] - 10, normalFont, FONT_SIZE);
    maxLines = Math.max(maxLines, descriptionLines);
    
    const itemName = row.itemName || "-";
    const itemNameLines = calculateTextLines(itemName, columnWidths[0] - 10, normalFont, FONT_SIZE);
    maxLines = Math.max(maxLines, itemNameLines);
} else {
    // For core materials, check item name for multi-line
    const itemName = row.itemName || "-";
    const itemNameLines = calculateTextLines(itemName, columnWidths[1] - 10, normalFont, FONT_SIZE);
    maxLines = Math.max(maxLines, itemNameLines);
    
    // Also check if there's an image
    if (row.imageUrl) {
        rowHeight = Math.max(rowHeight, 40); // Minimum height for images
    }
}

        // Adjust row height based on number of lines
        rowHeight = Math.max(rowHeight, baseRowHeight + (maxLines - 1) * lineHeight);

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

                            // Center image vertically in the row
                            const imageX = xPos + (columnWidths[columnIndex] - imageDims.width) / 2;
                            const imageY = rowYPosition - rowHeight / 2 - imageDims.height / 2;

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

                                // Center image vertically in the row
                                const imageX = xPos + (columnWidths[columnIndex] - imageDims.width) / 2;
                                const imageY = rowYPosition - rowHeight / 2 - imageDims.height / 2;

                                currentPage.drawImage(image, {
                                    x: imageX,
                                    y: imageY,
                                    width: imageDims.width,
                                    height: imageDims.height,
                                });
                            } catch (e) {
                                // Center the error text vertically
                                const textY = rowYPosition - rowHeight / 2;
                                drawCenteredText("Invalid Image", xPos, columnWidths[columnIndex], textY, normalFont, FONT_SIZE - 2);
                            }
                        }
                    } else {
                        // Center the "No Image" text vertically
                        const textY = rowYPosition - rowHeight / 2;
                        drawCenteredText("No Image", xPos, columnWidths[columnIndex], textY, normalFont, FONT_SIZE - 2);
                    }
                } catch (error) {
                    // Center the "No Image" text vertically
                    const textY = rowYPosition - rowHeight / 2;
                    drawCenteredText("No Image", xPos, columnWidths[columnIndex], textY, normalFont, FONT_SIZE - 2);
                }
            } else {
                // Center the "No Image" text vertically
                const textY = rowYPosition - rowHeight / 2;
                drawCenteredText("No Image", xPos, columnWidths[columnIndex], textY, normalFont, FONT_SIZE - 2);
            }

            xPos += columnWidths[columnIndex++];

            // // Item Name column (left aligned) - position at proper height
            // const itemName = row.itemName || "-";
            // const itemNameLines = drawLeftAlignedText(itemName, xPos, columnWidths[columnIndex], rowYPosition - 10, normalFont, FONT_SIZE);
            // xPos += columnWidths[columnIndex++];

           // Item Name column (left aligned) - PROPERLY CENTERED
const itemName = row.itemName || "-";
const itemNameMaxWidth = columnWidths[columnIndex] - 10;
const itemNameLinesCount = calculateTextLines(itemName, itemNameMaxWidth, normalFont, FONT_SIZE);
const itemNameHeight = itemNameLinesCount * lineHeight;

// Calculate top position of text block for proper vertical centering
const textTopY = rowYPosition - (rowHeight - itemNameHeight) / 2;

drawLeftAlignedText(itemName, xPos, columnWidths[columnIndex], textTopY, normalFont, FONT_SIZE);
xPos += columnWidths[columnIndex++];

            // Quantity column (centered) - center vertically
            const quantityText = String(row.plywoodNos?.quantity || 0);
            const centerY = rowYPosition - rowHeight / 2;
            drawCenteredText(quantityText, xPos, columnWidths[columnIndex], centerY, normalFont, FONT_SIZE);
            xPos += columnWidths[columnIndex++];

            // Cost column (centered) - center vertically
            const costText = `${row.rowTotal}`;
            drawCenteredText(costText, xPos, columnWidths[columnIndex], centerY, boldFont, FONT_SIZE, rgb(0, 0.4, 0));
        }
        // For simple tables (fittings, glues, nbms)
        else {
            // Item Name column (left aligned)
            const itemName = row.itemName || "-";
            const itemNameLines = drawLeftAlignedText(itemName, xPos, columnWidths[columnIndex], rowYPosition - 10, normalFont, FONT_SIZE);
            xPos += columnWidths[columnIndex++];

            // Description column (left aligned) - this will handle multi-line text
            const description = row.description || "-";
            const descriptionLines = drawLeftAlignedText(description, xPos, columnWidths[columnIndex], rowYPosition - 10, normalFont, FONT_SIZE);
            xPos += columnWidths[columnIndex++];

            // Quantity column (centered) - center vertically
            const quantityText = String(row.quantity || 0);
            const centerY = rowYPosition - rowHeight / 2;
            drawCenteredText(quantityText, xPos, columnWidths[columnIndex], centerY, normalFont, FONT_SIZE);
            xPos += columnWidths[columnIndex++];

            // Cost column (centered) - center vertically
            const costText = `${row.rowTotal}`;
            drawCenteredText(costText, xPos, columnWidths[columnIndex], centerY, boldFont, FONT_SIZE, rgb(0, 0.4, 0));
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

// BELOW ONE IS USED FOR THE CORE MATERIALS
// const drawCoreMaterialsTable = async (headers: string[], columnWidths: number[], rows: any[]) => {
//     const headerHeight = 25;
//     const baseRowHeight = 25;
//     const lineHeight = FONT_SIZE * 1.2;
//     const startX = 50;
//     const tableWidth = width - 100;
//     const padding = 8;

//     // Calculate total height needed for all rows
//     let totalHeight = headerHeight + 5; // Start with header height
//     for (const row of rows) {
//         let rowHeight = baseRowHeight;
//         let maxLines = 1;
        
//         const itemName = row.itemName || "-";
//         const itemNameLines = calculateTextLines(itemName, columnWidths[1] - 10, normalFont, FONT_SIZE);
//         maxLines = Math.max(maxLines, itemNameLines);
        
//         if (row.imageUrl) {
//             rowHeight = Math.max(rowHeight, 40); // Minimum height for images
//         }
        
//         rowHeight = Math.max(rowHeight, baseRowHeight + (maxLines - 1) * lineHeight);
//         totalHeight += rowHeight;
//     }

//     // Get the starting Y position for the entire section
//     const sectionStartY = yPosition;
    
//     // Draw header background (only for non-image columns)
//     currentPage.drawRectangle({
//         x: startX + columnWidths[0], // Start from itemName column
//         y: yPosition - headerHeight + 5,
//         width: tableWidth - columnWidths[0],
//         height: headerHeight,
//         color: TABLE_HEADER_BG_COLOR,
//     });

//     // Draw header text
//     let xPos = startX;
//     for (let i = 0; i < headers.length; i++) {
//         // Skip drawing header for image column if it's not the first row
//         if (i === 0 && rows.length > 0) {
//             // Only draw "Image" header if we have an image to show
//             if (rows[0].imageUrl) {
//                 const textWidth = boldFont.widthOfTextAtSize(headers[i], FONT_SIZE);
//                 currentPage.drawText(headers[i], {
//                     x: xPos + (columnWidths[i] - textWidth) / 2,
//                     y: yPosition - 15,
//                     font: boldFont,
//                     size: FONT_SIZE,
//                     color: TABLE_HEADER_TEXT_COLOR,
//                 });
//             }
//         } else {
//             // Draw other headers normally
//             const textWidth = boldFont.widthOfTextAtSize(headers[i], FONT_SIZE);
//             currentPage.drawText(headers[i], {
//                 x: xPos + (columnWidths[i] - textWidth) / 2,
//                 y: yPosition - 15,
//                 font: boldFont,
//                 size: FONT_SIZE,
//                 color: TABLE_HEADER_TEXT_COLOR,
//             });
//         }

//         xPos += columnWidths[i];
//     }

//     // Draw horizontal border below header (starting from itemName column)
//     currentPage.drawLine({
//         start: { x: startX + columnWidths[0], y: yPosition - headerHeight + 5 },
//         end: { x: startX + tableWidth, y: yPosition - headerHeight + 5 },
//         thickness: 1,
//         color: TABLE_HEADER_BG_COLOR,
//     });

//     yPosition -= headerHeight + 5;

//     // Load and draw the single image for the entire section (from first row)
//     let sectionImage = null;
//     let sectionImageDims = { width: 0, height: 0 };
    
//     if (rows.length > 0 && rows[0].imageUrl) {
//         try {
//             const imageRes = await fetch(rows[0].imageUrl);
//             if (imageRes.ok) {
//                 const imageBuffer = await imageRes.arrayBuffer();
//                 try {
//                     sectionImage = await pdfDoc.embedPng(imageBuffer);
//                 } catch (e) {
//                     try {
//                         sectionImage = await pdfDoc.embedJpg(imageBuffer);
//                     } catch (e) {
//                         console.log("Invalid image format");
//                     }
//                 }
                
//                 if (sectionImage) {
//                     const maxImageSize = 35;
//                     const scale = Math.min(maxImageSize / sectionImage.width, maxImageSize / sectionImage.height);
//                     sectionImageDims = { 
//                         width: sectionImage.width * scale, 
//                         height: sectionImage.height * scale 
//                     };
                    
//                     // Center image vertically in the entire section
//                     const sectionCenterY = sectionStartY - totalHeight / 2;
//                     const imageX = startX + (columnWidths[0] - sectionImageDims.width) / 2;
//                     const imageY = sectionCenterY - sectionImageDims.height / 2;
                    
//                     currentPage.drawImage(sectionImage, {
//                         x: imageX,
//                         y: imageY,
//                         width: sectionImageDims.width,
//                         height: sectionImageDims.height,
//                     });
//                 }
//             }
//         } catch (error) {
//             console.log("Error loading image:", error);
//         }
//     }

//     // Draw rows
//     for (const row of rows) {
//         let rowHeight = baseRowHeight;
//         let maxLines = 1;

//         // Calculate required row height
//         const itemName = row.itemName || "-";
//         const itemNameLines = calculateTextLines(itemName, columnWidths[1] - 10, normalFont, FONT_SIZE);
//         maxLines = Math.max(maxLines, itemNameLines);
        
//         rowHeight = Math.max(rowHeight, baseRowHeight + (maxLines - 1) * lineHeight);

//         ensureSpace(rowHeight + 20);

//         xPos = startX + columnWidths[0]; // Start from itemName column
//         let columnIndex = 1; // Start from itemName column index
//         let rowYPosition = yPosition;

//         // Item Name column (left aligned) - PROPERLY CENTERED
//         const itemNameMaxWidth = columnWidths[1] - 10;
//         const itemNameLinesCount = calculateTextLines(itemName, itemNameMaxWidth, normalFont, FONT_SIZE);
//         const itemNameHeight = itemNameLinesCount * lineHeight;

//         // Calculate top position of text block for proper vertical centering
//         const textTopY = rowYPosition - (rowHeight - itemNameHeight) / 2;

//         drawLeftAlignedText(itemName, xPos, columnWidths[1], textTopY, normalFont, FONT_SIZE);
//         xPos += columnWidths[columnIndex++];

//         // Quantity column (centered) - center vertically
//         const quantityText = String(row.plywoodNos?.quantity || 0);
//         const centerY = rowYPosition - rowHeight / 2;
//         drawCenteredText(quantityText, xPos, columnWidths[columnIndex], centerY, normalFont, FONT_SIZE);
//         xPos += columnWidths[columnIndex++];

//         // Cost column (centered) - center vertically
//         const costText = `${row.rowTotal}`;
//         drawCenteredText(costText, xPos, columnWidths[columnIndex], centerY, boldFont, FONT_SIZE, rgb(0, 0.4, 0));

//         // Draw horizontal border below this row (starting from itemName column)
//         currentPage.drawLine({
//             start: { x: startX + columnWidths[0], y: yPosition - rowHeight },
//             end: { x: startX + tableWidth, y: yPosition - rowHeight },
//             thickness: 1,
//             color: TABLE_HEADER_BG_COLOR,
//         });

//         // Draw vertical borders for this row (skip image column)
//         xPos = startX + columnWidths[0];
//         for (let i = 1; i < headers.length; i++) {
//             if (i > 1) { // Don't draw border after image column
//                 currentPage.drawLine({
//                     start: { x: xPos, y: yPosition },
//                     end: { x: xPos, y: yPosition - rowHeight },
//                     thickness: 1,
//                     color: TABLE_HEADER_BG_COLOR,
//                 });
//             }
//             xPos += columnWidths[i];
//         }

//         // Draw right border
//         currentPage.drawLine({
//             start: { x: startX + tableWidth, y: yPosition },
//             end: { x: startX + tableWidth, y: yPosition - rowHeight },
//             thickness: 1,
//             color: TABLE_HEADER_BG_COLOR,
//         });

//         yPosition -= rowHeight;
//     }

//     yPosition -= 15;
// };


const drawCoreMaterialsTable = async (headers: string[], columnWidths: number[], rows: any[]) => {
    const headerHeight = 25;
    const baseRowHeight = 25;
    const lineHeight = FONT_SIZE * 1.2;
    const startX = 50;
    const tableWidth = width - 100;

    // Calculate total height needed for all rows
    let totalRowsHeight = 0;
    let rowHeights: number[] = [];
    
    for (const row of rows) {
        let rowHeight = baseRowHeight;
        let maxLines = 1;
        
        const itemName = row.itemName || "-";
        const itemNameLines = calculateTextLines(itemName, columnWidths[1] - 10, normalFont, FONT_SIZE);
        maxLines = Math.max(maxLines, itemNameLines);
        
        rowHeight = Math.max(rowHeight, baseRowHeight + (maxLines - 1) * lineHeight);
        rowHeights.push(rowHeight);
        totalRowsHeight += rowHeight;
    }

    const totalTableHeight = headerHeight + 5 + totalRowsHeight;
    const sectionStartY = yPosition;
    
    // Draw FULL header background (including image column)
    currentPage.drawRectangle({
        x: startX,
        y: yPosition - headerHeight + 5,
        width: tableWidth,
        height: headerHeight,
        color: TABLE_HEADER_BG_COLOR,
    });

    // Draw header text (ALL headers including Image)
    let xPos = startX;
    for (let i = 0; i < headers.length; i++) {
        const textWidth = boldFont.widthOfTextAtSize(headers[i], FONT_SIZE);
        currentPage.drawText(headers[i], {
            x: xPos + (columnWidths[i] - textWidth) / 2,
            y: yPosition - 15,
            font: boldFont,
            size: FONT_SIZE,
            color: TABLE_HEADER_TEXT_COLOR,
        });

        // Draw vertical border between ALL headers
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

    // Draw horizontal border below header (FULL width)
    currentPage.drawLine({
        start: { x: startX, y: yPosition - headerHeight + 5 },
        end: { x: startX + tableWidth, y: yPosition - headerHeight + 5 },
        thickness: 1,
        color: TABLE_HEADER_BG_COLOR,
    });

    yPosition -= headerHeight + 5;

    // Load and position the single image for the entire section
    let sectionImage = null;
    let sectionImageDims = { width: 0, height: 0 };
    const hasImage = rows.length > 0 && rows[0].imageUrl;
    
    if (hasImage) {
        try {
            const imageRes = await fetch(rows[0].imageUrl);
            if (imageRes.ok) {
                const imageBuffer = await imageRes.arrayBuffer();
                try {
                    sectionImage = await pdfDoc.embedPng(imageBuffer);
                } catch (e) {
                    try {
                        sectionImage = await pdfDoc.embedJpg(imageBuffer);
                    } catch (e) {
                        console.log("Invalid image format");
                    }
                }
                
                if (sectionImage) {
                    const maxImageSize = 35;
                    const scale = Math.min(maxImageSize / sectionImage.width, maxImageSize / sectionImage.height);
                    sectionImageDims = { 
                        width: sectionImage.width * scale, 
                        height: sectionImage.height * scale 
                    };
                    
                    // Center image vertically in the entire rows section
                    const rowsStartY = sectionStartY - headerHeight - 5;
                    const imageCenterY = rowsStartY - (totalRowsHeight / 2);
                    
                    const imageX = startX + (columnWidths[0] - sectionImageDims.width) / 2;
                    const imageY = imageCenterY - (sectionImageDims.height / 2);
                    
                    currentPage.drawImage(sectionImage, {
                        x: imageX,
                        y: imageY,
                        width: sectionImageDims.width,
                        height: sectionImageDims.height,
                    });
                }
            }
        } catch (error) {
            console.log("Error loading image:", error);
        }
    }
    
    // If no image available, show "No Image" text centered in the rows section
    if (!hasImage || !sectionImage) {
        const rowsStartY = sectionStartY - headerHeight - 5;
        const textCenterY = rowsStartY - (totalRowsHeight / 2);
        
        drawCenteredText(
            "No Image", 
            startX, 
            columnWidths[0], 
            textCenterY, 
            normalFont, 
            FONT_SIZE - 2
        );
    }

    // Draw rows with proper borders
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        const rowHeight = rowHeights[rowIndex];

        ensureSpace(rowHeight + 20);

        xPos = startX + columnWidths[0]; // Start from itemName column (skip image column)
        let columnIndex = 1; // Start from itemName column index
        let rowYPosition = yPosition;

        // Item Name column (left aligned)
        const itemName = row.itemName || "-";
        const itemNameMaxWidth = columnWidths[1] - 10;
        const itemNameLinesCount = calculateTextLines(itemName, itemNameMaxWidth, normalFont, FONT_SIZE);
        const itemNameHeight = itemNameLinesCount * lineHeight;
        const textTopY = rowYPosition - (rowHeight - itemNameHeight) / 2;

        drawLeftAlignedText(itemName, xPos, columnWidths[1], textTopY, normalFont, FONT_SIZE);
        xPos += columnWidths[columnIndex++];

        // Quantity column (centered)
        const quantityText = String(row.plywoodNos?.quantity || 0);
        const centerY = rowYPosition - rowHeight / 2;
        drawCenteredText(quantityText, xPos, columnWidths[columnIndex], centerY, normalFont, FONT_SIZE);
        xPos += columnWidths[columnIndex++];

        // Cost column (centered)
        const costText = `${row.rowTotal}`;
        drawCenteredText(costText, xPos, columnWidths[columnIndex], centerY, boldFont, FONT_SIZE, rgb(0, 0.4, 0));

        // Draw horizontal border below this row (START from itemName column, NOT from image column)
        currentPage.drawLine({
            start: { x: startX + columnWidths[0], y: yPosition - rowHeight },
            end: { x: startX + tableWidth, y: yPosition - rowHeight },
            thickness: 1,
            color: TABLE_HEADER_BG_COLOR,
        });

        // Draw ALL vertical borders between data columns (Item Name, Quantity, Cost)
        xPos = startX + columnWidths[0]; // Start from first vertical border (after image column)
        for (let i = 1; i < headers.length; i++) {
            // Draw vertical border for ALL data columns (including between Quantity and Cost)
            currentPage.drawLine({
                start: { x: xPos, y: yPosition },
                end: { x: xPos, y: yPosition - rowHeight },
                thickness: 1,
                color: TABLE_HEADER_BG_COLOR,
            });
            xPos += columnWidths[i];
        }

        // Draw left border of image column (full height)
        currentPage.drawLine({
            start: { x: startX, y: yPosition },
            end: { x: startX, y: yPosition - rowHeight },
            thickness: 1,
            color: TABLE_HEADER_BG_COLOR,
        });

        // Draw right border of table
        currentPage.drawLine({
            start: { x: startX + tableWidth, y: yPosition },
            end: { x: startX + tableWidth, y: yPosition - rowHeight },
            thickness: 1,
            color: TABLE_HEADER_BG_COLOR,
        });

        yPosition -= rowHeight;
    }

    // Draw bottom border of table (FULL width including image column)
    currentPage.drawLine({
        start: { x: startX, y: yPosition },
        end: { x: startX + tableWidth, y: yPosition },
        thickness: 1,
        color: TABLE_HEADER_BG_COLOR,
    });

    yPosition -= 15;
};


// Usage in your furniture loop
for (const furniture of newVariant.furnitures) {
    ensureSpace(100);

    currentPage.drawText(`Product: ${furniture.furnitureName}`, {
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

        // await drawTableWithBorders(
        //     ["Image", "Item Name", "Quantity", "Cost"],
        //     [80, 200, 100, 100],
        //     coreMaterials,
        //     true // isCoreMaterials
        // );

          await drawCoreMaterialsTable(
            ["Image", "Item Name", "Quantity", "Cost"],
            [80, 200, 100, 100],
            coreMaterials
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
            currentPage.drawText(`Product Total: Rs: ${furniture.furnitureTotal}`, {
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






















// IF NOTHING WORKS THEN USE THIS BELOW ONE ( IT IS HTE PREVIOUS WHCIH IS THE LIVE)


// import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// import { COMPANY_LOGO, uploadToS3 } from "../../stage controllers/ordering material controller/pdfOrderHistory.controller";
// import QuoteVarientGenerateModel from "../../../models/Quote Model/QuoteVariant Model/quoteVarient.model";
// import ProjectModel from "../../../models/project model/project.model";
// import { RequirementFormModel } from "../../../models/Stage Models/requirment model/mainRequirementNew.model";

// const FONT_SIZE = 12;
// const HEADER_FONT_SIZE = 18;
// const SECTION_SPACE = 30;
// const TABLE_HEADER_BG_COLOR = rgb(0.2, 0.4, 0.6); // Dark blue background for headers
// const TABLE_HEADER_TEXT_COLOR = rgb(1, 1, 1); // White text for headers

// /**
//  * Filter material rows: skip entirely empty rows (all default)
//  */
// const filterMaterialRows = (rows: any[]) => {
//     return rows.filter((row) =>
//         row &&
//         (row.itemName || row.imageUrl || row.plywoodNos?.quantity > 0 || row.rowTotal > 0)
//     );
// };

// /**
//  * Filter simple rows like fittings, glues, nbms
//  */
// const filterSimpleRows = (rows: any[]) => {
//     return rows.filter(
//         (row) =>
//             row &&
//             (row.itemName || row.description || row.quantity > 0 || row.cost > 0 || row.rowTotal > 0)
//     );
// };

// export const generateQuoteVariantPdf = async ({
//     quoteId,
//     projectId,
//     newVariant,
// }: {
//     quoteId: string;
//     projectId: string;
//     newVariant: any;
// }) => {
//     try {
//         const [projectData, clientDataDoc] = await Promise.all([
//             ProjectModel.findById(projectId),
//             RequirementFormModel.findOne({ projectId }),
//         ]);

//         const clientData: any = clientDataDoc?.clientData || {};

//         const pdfDoc = await PDFDocument.create();
//         const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
//         const normalFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

//         // === PAGE 1: Company + Client Info + Project Details === //
//         const detailsPage = pdfDoc.addPage();
//         const { width, height } = detailsPage.getSize();
//         let yPosition = height - 50;

//         // Define colors
//         const PRIMARY_COLOR = rgb(0.1, 0.4, 0.9); // Blue from your example
//         const TEXT_COLOR = rgb(0.2, 0.2, 0.2);
//         const LIGHT_TEXT_COLOR = rgb(0.4, 0.4, 0.4);
//         const LINE_COLOR = rgb(0.6, 0.6, 0.6);

//         // Draw Company Logo and Name horizontally centered
//         try {
//             const logoRes = await fetch(COMPANY_LOGO);
//             const logoBuffer = await logoRes.arrayBuffer();
//             const logoImage = await pdfDoc.embedJpg(logoBuffer);

//             const logoScale = 0.5;
//             const logoDims = logoImage.scale(logoScale);

//             const brandText = "Vertical Living";
//             const brandFontSize = 20;
//             const brandColor = PRIMARY_COLOR;
//             const brandTextWidth = boldFont.widthOfTextAtSize(brandText, brandFontSize);

//             const spacing = 10; // space between logo and text

//             // Total width = logo + spacing + text
//             const totalWidth = logoDims.width + spacing + brandTextWidth;

//             // X and Y to center the whole block horizontally and set a top margin
//             const combinedX = (width - totalWidth) / 2;
//             const topY = yPosition; // use existing yPosition for vertical positioning

//             // Draw logo
//             detailsPage.drawImage(logoImage, {
//                 x: combinedX,
//                 y: topY - logoDims.height,
//                 width: logoDims.width,
//                 height: logoDims.height,
//             });

//             // Align text vertically with logo (visually aligned mid-way)
//             const textY = topY - (logoDims.height / 2) - (brandFontSize / 3);

//             // Draw text next to logo
//             detailsPage.drawText(brandText, {
//                 x: combinedX + logoDims.width + spacing,
//                 y: textY,
//                 size: brandFontSize,
//                 font: boldFont,
//                 color: brandColor,
//             });

//             // Update yPosition to be below the logo
//             yPosition = topY - logoDims.height - 5;

//             // Draw horizontal line
//             detailsPage.drawLine({
//                 start: { x: 50, y: yPosition },
//                 end: { x: width - 50, y: yPosition },
//                 thickness: 1,
//                 color: LINE_COLOR,
//             });

//             yPosition -= 30;
//         } catch (err) {
//             console.error("Failed to load company logo:", err);

//             // Fallback: Just draw the company name if logo fails
//             const COMPANY_NAME = "Vertical Living";
//             const brandFontSize = 20;
//             const brandTextWidth = boldFont.widthOfTextAtSize(COMPANY_NAME, brandFontSize);

//             detailsPage.drawText(COMPANY_NAME, {
//                 x: (width - brandTextWidth) / 2,
//                 y: yPosition,
//                 size: brandFontSize,
//                 font: boldFont,
//                 color: PRIMARY_COLOR,
//             });

//             yPosition -= 40;

//             // Draw horizontal line
//             detailsPage.drawLine({
//                 start: { x: 50, y: yPosition },
//                 end: { x: width - 50, y: yPosition },
//                 thickness: 1,
//                 color: LINE_COLOR,
//             });

//             yPosition -= 30;
//         }

//         // Updated drawSectionHeader function with underline
//         const drawSectionHeader = (title: string) => {
//             // Draw section title
//             detailsPage.drawText(title, {
//                 x: 50,
//                 y: yPosition,
//                 size: 16,
//                 font: boldFont,
//                 color: TEXT_COLOR,
//             });

//             // Calculate text width to determine underline length
//             const textWidth = boldFont.widthOfTextAtSize(title, 16);

//             yPosition -= 8;

//             // Draw underline only for the text width + some padding
//             detailsPage.drawLine({
//                 start: { x: 50, y: yPosition },
//                 end: { x: 50 + textWidth + 10, y: yPosition }, // Add 10px padding
//                 thickness: 2,
//                 color: LINE_COLOR,
//             });

//             yPosition -= 25;
//         };

//         // Updated drawRow function
//         const drawRow = (label: string, value: string, isBoldValue = false) => {
//             // Draw label
//             detailsPage.drawText(`${label}:`, {
//                 x: 60,
//                 y: yPosition,
//                 size: FONT_SIZE,
//                 font: boldFont,
//                 color: TEXT_COLOR,
//             });

//             // Draw value with different styling if bold
//             detailsPage.drawText(value || "-", {
//                 x: 180,
//                 y: yPosition,
//                 size: FONT_SIZE,
//                 font: isBoldValue ? boldFont : normalFont,
//                 color: isBoldValue ? PRIMARY_COLOR : LIGHT_TEXT_COLOR,
//             });

//             yPosition -= 22;
//         };



//         // Client Details Section
//         drawSectionHeader("Client Details");
//         drawRow("Name", clientData.clientName || "-", true);
//         drawRow("Email", clientData.email || "-", true);
//         drawRow("Phone", clientData.whatsapp || "-", true);
//         drawRow("Location", clientData.location || "-", true);

//         yPosition -= 15;

//         // Project Details Section
//         drawSectionHeader("Project Details");
//         drawRow("Project Name", projectData?.projectName || "-", true);
//         drawRow("Quote No", newVariant.quoteNo, true);
//         drawRow("Date", new Date().toLocaleDateString(), true);
//         if(newVariant?.brandName){
//             drawRow("Brand", newVariant?.brandName, true);
//         }

//         // Add a decorative line at the bottom if there's space
//         // if (yPosition > 100) {
//         //     detailsPage.drawLine({
//         //         start: { x: 50, y: yPosition - 20 },
//         //         end: { x: width - 50, y: yPosition - 20 },
//         //         thickness: 1,
//         //         color: LINE_COLOR,
//         //     });
//         // }

//         yPosition -= 30;

//     // END OF FIRST PAGE 
    
//         // === Furniture Pages === //

//         // second page
//         let currentPage = pdfDoc.addPage();
//         yPosition = currentPage.getHeight() - 50;

//         const ensureSpace = (minHeight: number) => {
//             if (yPosition < minHeight) {
//                 currentPage = pdfDoc.addPage();
//                 yPosition = currentPage.getHeight() - 50;
//             }
//         };

     

//         // FOURTH VERSION FO TABLE WITH BORDERS
//         const drawTableWithBorders = async (headers: string[], columnWidths: number[], rows: any[], isCoreMaterials = false) => {
//             const headerHeight = 25;
//             const baseRowHeight = 25;
//             const startX = 50;
//             const tableWidth = width - 100;
//             const padding = 8;

//             // Draw header background
//             currentPage.drawRectangle({
//                 x: startX,
//                 y: yPosition - headerHeight + 5,
//                 width: tableWidth,
//                 height: headerHeight,
//                 color: TABLE_HEADER_BG_COLOR,
//             });

//             // Draw header text and vertical borders
//             let xPos = startX;
//             for (let i = 0; i < headers.length; i++) {
//                 // Draw header text (centered)
//                 const textWidth = boldFont.widthOfTextAtSize(headers[i], FONT_SIZE);
//                 currentPage.drawText(headers[i], {
//                     x: xPos + (columnWidths[i] - textWidth) / 2,
//                     y: yPosition - 15,
//                     font: boldFont,
//                     size: FONT_SIZE,
//                     color: TABLE_HEADER_TEXT_COLOR,
//                 });

//                 // Draw vertical border between headers (white)
//                 if (i < headers.length - 1) {
//                     currentPage.drawLine({
//                         start: { x: xPos + columnWidths[i], y: yPosition - headerHeight + 5 },
//                         end: { x: xPos + columnWidths[i], y: yPosition + 5 },
//                         thickness: 1,
//                         color: rgb(1, 1, 1), // White border
//                     });
//                 }

//                 xPos += columnWidths[i];
//             }

//             // Draw horizontal border below header
//             currentPage.drawLine({
//                 start: { x: startX, y: yPosition - headerHeight + 5 },
//                 end: { x: startX + tableWidth, y: yPosition - headerHeight + 5 },
//                 thickness: 1,
//                 color: TABLE_HEADER_BG_COLOR,
//             });

//             yPosition -= headerHeight + 5;

//             // Draw rows with borders
//             for (const row of rows) {
//                 let rowHeight = baseRowHeight;

//                 // Calculate required row height for core materials with images
//                 if (isCoreMaterials && row.imageUrl) {
//                     rowHeight = Math.max(rowHeight, 40); // Minimum height for images
//                 }

//                 ensureSpace(rowHeight + 20);

//                 xPos = startX;
//                 let columnIndex = 0;
//                 let rowYPosition = yPosition;

//                 // For core materials table
//                 if (isCoreMaterials) {

//                     const imageCellHeight = rowHeight;
//                     if (row.imageUrl) {
//                         try {
//                             const imageRes = await fetch(row.imageUrl);
//                             if (imageRes.ok) {
//                                 const imageBuffer = await imageRes.arrayBuffer();
//                                 try {
//                                     const image = await pdfDoc.embedPng(imageBuffer);
//                                     const maxImageSize = 25;
//                                     const scale = Math.min(maxImageSize / image.width, maxImageSize / image.height);
//                                     const imageDims = { width: image.width * scale, height: image.height * scale };

//                                     // Calculate position to center image vertically and horizontally
//                                     const imageX = xPos + (columnWidths[columnIndex] - imageDims.width) / 2;
//                                     const imageY = rowYPosition - (rowHeight + imageDims.height) / 2 + 5;

//                                     currentPage.drawImage(image, {
//                                         x: imageX,
//                                         y: imageY,
//                                         width: imageDims.width,
//                                         height: imageDims.height,
//                                     });
//                                 } catch (e) {
//                                     // If PNG fails, try JPG
//                                     try {
//                                         const image = await pdfDoc.embedJpg(imageBuffer);
//                                         const maxImageSize = 25;
//                                         const scale = Math.min(maxImageSize / image.width, maxImageSize / image.height);
//                                         const imageDims = { width: image.width * scale, height: image.height * scale };

//                                         // Calculate position to center image vertically and horizontally
//                                         const imageX = xPos + (columnWidths[columnIndex] - imageDims.width) / 2;
//                                         const imageY = rowYPosition - (rowHeight + imageDims.height) / 2 + 5;

//                                         currentPage.drawImage(image, {
//                                             x: imageX,
//                                             y: imageY,
//                                             width: imageDims.width,
//                                             height: imageDims.height,
//                                         });
//                                     } catch (e) {
//                                         // Center the error text vertically
//                                         const textY = rowYPosition - rowHeight / 2 - 3;
//                                         drawCenteredText("Invalid Image", xPos, columnWidths[columnIndex], textY, normalFont, FONT_SIZE - 2);
//                                     }
//                                 }
//                             } else {
//                                 // Center the "No Image" text vertically
//                                 const textY = rowYPosition - rowHeight / 2 - 3;
//                                 drawCenteredText("No Image", xPos, columnWidths[columnIndex], textY, normalFont, FONT_SIZE - 2);
//                             }
//                         } catch (error) {
//                             // Center the "No Image" text vertically
//                             const textY = rowYPosition - rowHeight / 2 - 3;
//                             drawCenteredText("No Image", xPos, columnWidths[columnIndex], textY, normalFont, FONT_SIZE - 2);
//                         }
//                     } else {
//                         // Center the "No Image" text vertically
//                         const textY = rowYPosition - rowHeight / 2 - 3;
//                         drawCenteredText("No Image", xPos, columnWidths[columnIndex], textY, normalFont, FONT_SIZE - 2);
//                     }

//                     xPos += columnWidths[columnIndex++];

//                     // Item Name column (left aligned)
//                     const itemName = row.itemName || "-";
//                     drawLeftAlignedText(itemName, xPos, columnWidths[columnIndex], rowYPosition - rowHeight / 2, normalFont, FONT_SIZE);
//                     xPos += columnWidths[columnIndex++];

//                     // Quantity column (centered)
//                     const quantityText = String(row.plywoodNos?.quantity || 0);
//                     drawCenteredText(quantityText, xPos, columnWidths[columnIndex], rowYPosition - rowHeight / 2, normalFont, FONT_SIZE);
//                     xPos += columnWidths[columnIndex++];

//                     // Cost column (centered)
//                     const costText = `${row.rowTotal}`;
//                     drawCenteredText(costText, xPos, columnWidths[columnIndex], rowYPosition - rowHeight / 2, boldFont, FONT_SIZE, rgb(0, 0.4, 0));
//                 }
//                 // For simple tables (fittings, glues, nbms)
//                 else {
//                     // Item Name column (left aligned)
//                     const itemName = row.itemName || "-";
//                     drawLeftAlignedText(itemName, xPos, columnWidths[columnIndex], rowYPosition - rowHeight / 2, normalFont, FONT_SIZE);
//                     xPos += columnWidths[columnIndex++];

//                     // Description column (left aligned)
//                     const description = row.description || "-";
//                     drawLeftAlignedText(description, xPos, columnWidths[columnIndex], rowYPosition - rowHeight / 2, normalFont, FONT_SIZE);
//                     xPos += columnWidths[columnIndex++];

//                     // Quantity column (centered)
//                     const quantityText = String(row.quantity || 0);
//                     drawCenteredText(quantityText, xPos, columnWidths[columnIndex], rowYPosition - rowHeight / 2, normalFont, FONT_SIZE);
//                     xPos += columnWidths[columnIndex++];

//                     // Cost column (centered)
//                     const costText = `${row.rowTotal}`;
//                     drawCenteredText(costText, xPos, columnWidths[columnIndex], rowYPosition - rowHeight / 2, boldFont, FONT_SIZE, rgb(0, 0.4, 0));
//                 }

//                 // Draw horizontal border below this row
//                 currentPage.drawLine({
//                     start: { x: startX, y: yPosition - rowHeight },
//                     end: { x: startX + tableWidth, y: yPosition - rowHeight },
//                     thickness: 1,
//                     color: TABLE_HEADER_BG_COLOR,
//                 });

//                 // Draw vertical borders for this row
//                 xPos = startX;
//                 for (let i = 0; i < headers.length; i++) {
//                     if (i > 0) {
//                         currentPage.drawLine({
//                             start: { x: xPos, y: yPosition },
//                             end: { x: xPos, y: yPosition - rowHeight },
//                             thickness: 1,
//                             color: TABLE_HEADER_BG_COLOR,
//                         });
//                     }
//                     xPos += columnWidths[i];
//                 }

//                 // Draw right border
//                 currentPage.drawLine({
//                     start: { x: startX + tableWidth, y: yPosition },
//                     end: { x: startX + tableWidth, y: yPosition - rowHeight },
//                     thickness: 1,
//                     color: TABLE_HEADER_BG_COLOR,
//                 });

//                 yPosition -= rowHeight;
//             }

//             yPosition -= 15;
//         };

//         // Helper function to draw centered text
//         const drawCenteredText = (text: string, x: number, width: number, y: number, font: any, size: number, color = rgb(0, 0, 0)) => {
//             const textWidth = font.widthOfTextAtSize(text, size);
//             currentPage.drawText(text, {
//                 x: x + (width - textWidth) / 2,
//                 y: y - 5,
//                 font: font,
//                 size: size,
//                 color: color,
//             });
//         };

//         // Helper function to draw left-aligned text
//         const drawLeftAlignedText = (text: string, x: number, width: number, y: number, font: any, size: number, color = rgb(0, 0, 0)) => {
//             const maxWidth = width - 10;
//             let displayText = text;

//             // Truncate text if too long
//             if (font.widthOfTextAtSize(text, size) > maxWidth) {
//                 let truncated = text;
//                 while (truncated.length > 3 && font.widthOfTextAtSize(truncated + '...', size) > maxWidth) {
//                     truncated = truncated.slice(0, -1);
//                 }
//                 displayText = truncated + '...';
//             }

//             currentPage.drawText(displayText, {
//                 x: x + 5,
//                 y: y - 5,
//                 font: font,
//                 size: size,
//                 color: color,
//             });
//         };


       
// console.log("newVariant", newVariant)
//         for (const furniture of newVariant.furnitures) {
//             ensureSpace(100);

//             // Furniture header
//             currentPage.drawText(`Furniture: ${furniture.furnitureName}`, {
//                 x: 50,
//                 y: yPosition,
//                 font: boldFont,
//                 size: 16,
//                 color: rgb(0.1, 0.3, 0.5),
//             });
//             yPosition -= 30;

//             // --- Core Materials Table --- //
//             const coreMaterials = filterMaterialRows(furniture.coreMaterials);
//             if (coreMaterials.length > 0) {
//                 currentPage.drawText("Core Materials", {
//                     x: 50,
//                     y: yPosition,
//                     font: boldFont,
//                     size: 14,
//                     color: rgb(0.1, 0.2, 0.2),
//                 });
//                 yPosition -= 20;

//                 await drawTableWithBorders(
//                     ["Image", "Item Name", "Quantity", "Cost"],
//                     [80, 200, 100, 100],
//                     coreMaterials,
//                     true // isCoreMaterials
//                 );

//                 // Subtotal
//                 ensureSpace(30);
//                 currentPage.drawText(`Subtotal: Rs: ${furniture.coreMaterialsTotal}`, {
//                     x: width - 200,
//                     y: yPosition,
//                     font: boldFont,
//                     size: FONT_SIZE,
//                     color: rgb(0, 0.4, 0),
//                 });
//                 yPosition -= SECTION_SPACE;
//             }

//             // Function to render simple sections (fittings, glues, nbms)
//             const renderSimpleSection = async (title: string, rows: any[], total: number) => {
//                 const validRows = filterSimpleRows(rows);
//                 if (validRows.length === 0) return;

//                 ensureSpace(80);
//                 currentPage.drawText(title, {
//                     x: 50,
//                     y: yPosition,
//                     font: boldFont,
//                     size: 14,
//                     color: rgb(0.1, 0.2, 0.2),
//                 });
//                 yPosition -= 20;

//                 await drawTableWithBorders(
//                     ["Item Name", "Description", "Quantity", "Cost"],
//                     [150, 200, 80, 100],
//                     validRows,
//                     false // not core materials
//                 );

//                 // Subtotal
//                 ensureSpace(30);
//                 currentPage.drawText(`Subtotal: Rs: ${total}`, {
//                     x: width - 200,
//                     y: yPosition,
//                     font: boldFont,
//                     size: FONT_SIZE,
//                     color: rgb(0, 0.4, 0),
//                 });
//                 yPosition -= SECTION_SPACE;
//             };

//             await renderSimpleSection("Fittings", furniture.fittingsAndAccessories, furniture.fittingsAndAccessoriesTotal);
//             await renderSimpleSection("Glues", furniture.glues, furniture.gluesTotal);
//             await renderSimpleSection("Non-Branded Materials", furniture.nonBrandMaterials, furniture.nonBrandMaterialsTotal);

//             // Furniture Total
//             ensureSpace(40);
//             currentPage.drawText(`Furniture Total: Rs: ${furniture.furnitureTotal}`, {
//                 x: width - 250,
//                 y: yPosition,
//                 font: boldFont,
//                 size: 14,
//                 color: rgb(0, 0.4, 0.1),
//             });
//             yPosition -= SECTION_SPACE * 1.5;
//         }

//         // === GRAND TOTAL ===
//         // Add grand total on current page if space available
//         if (yPosition > 100) {
//             currentPage.drawText(`GRAND TOTAL: Rs:${newVariant.grandTotal}`, {
//                 // x: width - 300,
//                 x: 50,
//                 y: yPosition,
//                 font: boldFont,
//                 size: 16,
//                 color: rgb(0.1, 0.5, 0.1),
//             });
//         } else {
//             // If not enough space, create a new page
//             currentPage = pdfDoc.addPage();
//             yPosition = currentPage.getHeight() - 100;

//             currentPage.drawText(`GRAND TOTAL: Rs: ${newVariant.grandTotal}`, {
//                 x: (width - boldFont.widthOfTextAtSize(`GRAND TOTAL: Rs: ${newVariant.grandTotal}`, 16)) / 2,
//                 y: yPosition,
//                 font: boldFont,
//                 size: 16,
//                 color: rgb(0.1, 0.5, 0.1),
//             });
//         }

//         // === TERMS AND CONDITIONS ===
//         for (let i = 0; i < 3; i++) {
//             const termsPage = pdfDoc.addPage();
//             const centerX = termsPage.getWidth() / 2;
//             const centerY = termsPage.getHeight() / 2;
//             const text = "Terms and Conditions";

//             const textWidth = boldFont.widthOfTextAtSize(text, 22);

//             termsPage.drawText(text, {
//                 x: centerX - textWidth / 2,
//                 y: centerY,
//                 font: boldFont,
//                 size: 22,
//                 color: rgb(0, 0, 0),
//             });
//         }

//         // === SAVE + UPLOAD ===
//         const pdfBytes = await pdfDoc.save();
//         const fileName = `home-interior-quote-${newVariant.quoteNo}-${Date.now()}.pdf`;

//         const uploadResult = await uploadToS3(pdfBytes, fileName);

//         const finalDoc = await QuoteVarientGenerateModel.findByIdAndUpdate(
//             newVariant._id,
//             {
//                 pdfLink: {
//                     type: "pdf",
//                     url: uploadResult.Location,
//                     originalName: fileName,
//                     uploadedAt: new Date(),
//                 },
//             },
//             { new: true }
//         );

//         return {
//             success: true,
//             fileUrl: uploadResult.Location,
//             fileName,
//             updatedDoc: finalDoc,
//         };
//     } catch (err: any) {
//         console.error("PDF generation error:", err);
//         throw new Error("Failed to generate variant quote PDF.");
//     }
// };