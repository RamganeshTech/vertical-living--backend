import { PDFDocument, PDFFont, PDFPage, StandardFonts, degrees, rgb } from "pdf-lib";

import { COMPANY_LOGO, COMPANY_NAME, uploadToS3 } from "../../stage controllers/ordering material controller/pdfOrderHistory.controller";
import QuoteVarientGenerateModel from "../../../models/Quote Model/QuoteVariant Model/quoteVarient.model";
import ProjectModel from "../../../models/project model/project.model";
import { RequirementFormModel } from "../../../models/Stage Models/requirment model/mainRequirementNew.model";

const FONT_SIZE = 12;
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



interface DrawTextOptions {
    page: PDFPage;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    font: PDFFont;
    color?: any; // Defaults to Black
    isBlurred: boolean;
    isRightAligned?: boolean;
    maskWidth?: number;
}

// Helper for Blurred Text
const drawTextOrBlur = (
    {
        page,
        text,
        x,
        y,
        fontSize,
        font,
        color = rgb(0, 0, 0),
        isBlurred,
        isRightAligned = false,
        maskWidth = 80
    }: DrawTextOptions
) => {
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    if (isBlurred) {

        const drawX = isRightAligned ? x - maskWidth : x;
        page.drawRectangle({
            x: drawX,
            y: y - 2,
            width: maskWidth,
            height: fontSize + 4, // Slightly taller for better coverage
            color: rgb(0.92, 0.92, 0.92), // Soft professional gray
            borderWidth: 0,
        });


        // // --- HIGH INTENSITY BLUR CONTROLS ---
        // const density = 45;       // High density for a solid ink cloud
        // const scatterX = 6.0;     // Wider horizontal spread
        // const scatterY = 5.0;     // Higher vertical spread to break the "line" look
        // const dummyChars = ["X", "M", "W", "8", "#", "@"]; // Mix of thick characters

        // // 1. DENSE CLOUD GENERATION
        // for (let i = 0; i < density; i++) {
        //     const char = dummyChars[Math.floor(Math.random() * dummyChars.length)];
        //     const charWidth = font.widthOfTextAtSize(char, fontSize);

        //     // Randomize position across the entire width of the data area
        //     const posX = drawX + (Math.random() * textWidth) + (Math.random() - 0.5) * scatterX;
        //     const posY = y + (Math.random() - 0.5) * scatterY;
        //     const randomSize = fontSize + (Math.random() * 6 - 2);

        //     page.drawText(char, {
        //         x: posX,
        //         y: posY,
        //         size: randomSize,
        //         font,
        //         color: rgb(0, 0, 0),
        //         opacity: 0.15,
        //         // If your pdf-lib version supports rotate, add slight rotation:
        //         // rotate: degrees((Math.random() - 0.5) * 45), 
        //     });
        // }

        // // 2. THE "TOTAL MASK" OVERLAY
        // // We add two layers of frosted glass to completely wash out sharp edges
        // page.drawRectangle({
        //     x: drawX - 8,
        //     y: y - 6,
        //     width: textWidth + 16,
        //     height: fontSize + 12,
        //     color: rgb(1, 1, 1),
        //     opacity: 0.45,
        // });

        // page.drawRectangle({
        //     x: drawX - 4,
        //     y: y - 4,
        //     width: textWidth + 8,
        //     height: fontSize + 8,
        //     color: rgb(0.95, 0.95, 0.95),
        //     opacity: 0.3,
        // });

        // // 3. HORIZONTAL SMUDGE
        // // A single wide, semi-transparent line to unify the blot
        // page.drawLine({
        //     start: { x: drawX - 2, y: y + (fontSize / 3) },
        //     end: { x: drawX + textWidth + 2, y: y + (fontSize / 3) },
        //     thickness: fontSize * 0.8,
        //     color: rgb(0.1, 0.1, 0.1),
        //     opacity: 0.1,
        // });


    } else {
        // const textWidth = font.widthOfTextAtSize(text, fontSize);
        // page.drawText(text, { x: isRightAligned ? x - textWidth : x, y, size: fontSize, font, color });

        const drawX = isRightAligned ? x - textWidth : x;
        // Normal text if not blurred
        page.drawText(text, {
            x: drawX,
            y,
            size: fontSize,
            font,
            color,
        });
    }
};


export const generateQuoteVariantPdf = async ({
    quoteId,
    projectId,
    newVariant
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
        // if (newVariant?.brandName) {
        //     drawRow("Brand", newVariant?.brandName, true);
        // }

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

            // yPosition -= headerHeight + 5;
            // yPosition -= headerHeight;
            // ⭐⭐ FIX: Position the first row directly below the header ⭐⭐
            yPosition = yPosition - headerHeight + 5;
            // space between the table an body above

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

                    // === ADD THIS BORDER DRAWING CODE ===
                    let xPos = startX;

                    // DRAW LEFT BORDER - This is what's missing!
                    currentPage.drawLine({
                        start: { x: xPos, y: yPosition },
                        end: { x: xPos, y: yPosition - rowHeight },
                        thickness: 1,
                        color: TABLE_HEADER_BG_COLOR,
                    });

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
                    // const costText = `${row.rowTotal}`;
                    const costText = String(row.rowTotal); // Use String() explicitly
                    console.log('Cost text after conversion:', costText, 'Length:', costText.length);
                    drawCenteredText(costText, xPos, columnWidths[columnIndex], centerY, boldFont, FONT_SIZE, rgb(0, 0.4, 0));
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

            // yPosition -= headerHeight + 5;
            // yPosition -= headerHeight
            // ⭐⭐ FIX: Position the first row directly below the header ⭐⭐

            yPosition = yPosition - headerHeight + 5;


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
                // const rowsStartY = sectionStartY - headerHeight - 5;
                // const textCenterY = rowsStartY - (totalRowsHeight / 2);

                // drawCenteredText(
                //     "No Image",
                //     startX,
                //     columnWidths[0],
                //     textCenterY,
                //     normalFont,
                //     FONT_SIZE - 2
                // );


                // Get the exact bounds of the image column area
                const columnTop = yPosition;
                const columnBottom = yPosition - totalRowsHeight;

                // Calculate true vertical center
                const centerY = columnTop - (totalRowsHeight / 2);

                // For text: centerY + (fontSize/2) because text baseline is at bottom of text
                const textY = centerY + ((FONT_SIZE - 2) / 2);

                const textWidth = normalFont.widthOfTextAtSize("No Image", FONT_SIZE - 2);
                const textX = startX + (columnWidths[0] - textWidth) / 2;

                // Draw the text directly without using drawCenteredText
                currentPage.drawText("No Image", {
                    x: textX,
                    y: textY,
                    font: normalFont,
                    size: FONT_SIZE - 2,
                    color: rgb(0, 0, 0),
                });
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


                await drawCoreMaterialsTable(
                    ["Image", "Item Name", "Quantity", "Cost"],
                    [80, 200, 100, 100],
                    coreMaterials
                );


                // Subtotal
                ensureSpace(30);
                currentPage.drawText(`Subtotal Rs: ${furniture.coreMaterialsTotal}`, {
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
                    // color: SUBTOTAL_CPO
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





// Helper function to wrap text within a specific width
const wrapText = (text: string, maxWidth: number, font: any, fontSize: number) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = font.widthOfTextAtSize(currentLine + ' ' + word, fontSize);
        if (width < maxWidth) {
            currentLine += ' ' + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
};


export const generateClientQuoteVariantPdfwithTemplates = async ({
    quoteId,
    projectId,
    newVariant,
    templateType = "type 1", // Default to type 1
    isBlurred,
}: {
    quoteId: string;
    projectId: string;
    newVariant: any;
    templateType?: "type 1" | "type 2" | "type 3";
    isBlurred: boolean
}) => {
    try {

        // Define colors
        const PRIMARY_COLOR = rgb(0.1, 0.4, 0.9);
        // const TEXT_COLOR = rgb(0.2, 0.2, 0.2);
        const LIGHT_TEXT_COLOR = rgb(0.4, 0.4, 0.4);
        const LINE_COLOR = rgb(0.6, 0.6, 0.6);

        const SUBTOTAL_COLOR = rgb(0.4, 0.4, 0.4); // Soft Medium Green
        const PRODUCTTOTAL_COLOR = rgb(0.2, 0.2, 0.2)
        const GRAND_TOTAL_COLOR = rgb(0.0, 0.0, 0.0); // Deep Forest Green


        const [projectData, clientDataDoc] = await Promise.all([
            // ProjectModel.findById(projectId),
            ProjectModel.findById(projectId).populate("organizationId"),
            RequirementFormModel.findOne({ projectId }),
        ]);


        // Extract Organization Info safely
        const orgInfo = (projectData?.organizationId as any) || {};
        const orgName = orgInfo?.organizationName || COMPANY_NAME;
        const orgGstin = orgInfo?.gstin || "";
        const orgAddress = orgInfo?.address || "";
        const orgPhone = orgInfo?.organizationPhoneNo || "";

        const clientData: any = clientDataDoc?.clientData || {};

        const pdfDoc = await PDFDocument.create();
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const normalFont = await pdfDoc.embedFont(StandardFonts.Helvetica);


        // START OF FIRST PAGE OLD VERSION

        // // === PAGE 1: Company + Client Info + Project Details === //
        const detailsPage = pdfDoc.addPage();
        const { width, height } = detailsPage.getSize();
        let yPosition = height - 50;


        // // Draw Company Logo and Name horizontally centered
        // // --- HEADER SECTION ---
        try {
            // Use the specific company logo if available, or fall back to a default
            // const logoUrl = orgInfo.companyLogo || COMPANY_LOGO; 
            const logoUrl = COMPANY_LOGO;

            const logoRes = await fetch(logoUrl);
            const logoBuffer = await logoRes.arrayBuffer();
            const logoImage = await pdfDoc.embedJpg(logoBuffer);

            const logoScale = 0.4;
            const logoDims = logoImage.scale(logoScale);

            const brandText = orgName; // 👈 Uses dynamic Org Name
            const brandFontSize = 22;
            const brandTextWidth = boldFont.widthOfTextAtSize(brandText, brandFontSize);

            const spacing = 15;
            const totalWidth = logoDims.width + spacing + brandTextWidth;
            const combinedX = (width - totalWidth) / 2;

            // Draw Logo
            detailsPage.drawImage(logoImage, {
                x: combinedX,
                y: yPosition - logoDims.height,
                width: logoDims.width,
                height: logoDims.height,
            });

            // Draw Organization Name
            detailsPage.drawText(brandText, {
                x: combinedX + logoDims.width + spacing,
                y: yPosition - (logoDims.height / 2) - (brandFontSize / 4),
                size: brandFontSize,
                font: boldFont,
                color: PRIMARY_COLOR,
            });

            yPosition -= (logoDims.height + 10);

        } catch (err) {
            // Fallback if logo fetch fails
            const brandFontSize = 22;
            const textWidth = boldFont.widthOfTextAtSize(orgName, brandFontSize);
            detailsPage.drawText(orgName, {
                x: (width - textWidth) / 2,
                y: yPosition,
                size: brandFontSize,
                font: boldFont,
                color: PRIMARY_COLOR,
            });
            yPosition -= 30;
        }

        // Draw Line
        detailsPage.drawLine({
            start: { x: 50, y: yPosition },
            end: { x: width - 50, y: yPosition },
            thickness: 1,
            color: LINE_COLOR,
        });

        const rightColX = width / 2 + 20;
        const labelFontSize = 9;
        const leftColX = 50;
        const detailFontSize = 9;
        const TEXT_COLOR = rgb(0.1, 0.1, 0.1);
        const MUTED_COLOR = rgb(0.5, 0.5, 0.5);

        // --- 2. ORGANIZATION INFO BLOCK (Left Aligned) ---
        yPosition -= 25;

        // Draw GSTIN (Top line, left side)
        if (orgGstin) {
            detailsPage.drawText(`GSTIN: ${orgGstin}`, {
                x: leftColX,
                y: yPosition,
                size: detailFontSize,
                font: boldFont,
                color: TEXT_COLOR,
            });
            yPosition -= 16;
        }

        // Draw Phone Number
        if (orgPhone) {
            const phoneLabel = "Phone: ";
            const phoneLabelWidth = boldFont.widthOfTextAtSize(phoneLabel, detailFontSize);

            // We establish this as our vertical alignment "anchor" for the address too
            const valueStartX = leftColX + phoneLabelWidth;

            detailsPage.drawText(phoneLabel, {
                x: leftColX,
                y: yPosition,
                size: detailFontSize,
                font: boldFont,
                color: TEXT_COLOR,
            });

            detailsPage.drawText(orgPhone, {
                x: valueStartX,
                y: yPosition,
                size: detailFontSize,
                font: normalFont,
                color: MUTED_COLOR,
            });

            yPosition -= 14;

            // --- Draw Address (Anchored to the same level as Phone) ---
            if (orgAddress) {
                const addrLabel = "Address: ";
                const addrLabelWidth = boldFont.widthOfTextAtSize(addrLabel, detailFontSize);

                // We use a fixed width to ensure it doesn't cross the middle of the page
                const availableAddrWidth = (width / 2) - valueStartX;
                const wrappedAddr = wrapText(orgAddress, availableAddrWidth, normalFont, detailFontSize);

                wrappedAddr.forEach((line, idx) => {
                    if (idx === 0) {
                        // Label starts at the far left
                        detailsPage.drawText(addrLabel, {
                            x: leftColX,
                            y: yPosition,
                            size: detailFontSize,
                            font: boldFont,
                            color: TEXT_COLOR
                        });
                        // Value starts at the same level as the Phone value
                        detailsPage.drawText(line, {
                            x: valueStartX + 10,
                            y: yPosition,
                            size: detailFontSize,
                            font: normalFont,
                            color: MUTED_COLOR
                        });
                    } else {
                        // Indented lines start at the same valueStartX level
                        detailsPage.drawText(line, {
                            x: valueStartX + 10,
                            y: yPosition,
                            size: detailFontSize,
                            font: normalFont,
                            color: MUTED_COLOR
                        });
                    }
                    yPosition -= 12;
                });
            }
        }

        // Reset Y for the Client/Project sections below
        yPosition -= 40;

        // --- 3. DUAL COLUMN LAYOUT (Client vs Project) ---
        const sectionTitleSize = 14;
        const columnTopY = yPosition;

        // --- LEFT COLUMN: CLIENT INFORMATION ---
        detailsPage.drawText("CLIENT INFORMATION", {
            x: leftColX,
            y: yPosition,
            size: sectionTitleSize,
            font: boldFont,
            color: PRIMARY_COLOR,
        });

        let clientY = yPosition - 30;
        const columnWidth = (width / 2) - leftColX - 20;

        const drawElegantDetail = (page: any, label: string, value: string, x: number, y: number) => {
            // page.drawText(label.toUpperCase(), { x, y, size: labelFontSize, font: boldFont, color: MUTED_COLOR });
            // page.drawText(value || "-", { x, y: y - 15, size: detailFontSize + 1, font: normalFont, color: TEXT_COLOR });
            // return y - 45;

            // 1. Draw the Label in muted caps
            page.drawText(label.toUpperCase(), {
                x,
                y,
                size: labelFontSize,
                font: boldFont,
                color: MUTED_COLOR
            });

            const textValue = value || "-";
            const valueYStart = y - 15;

            // 2. Wrap the value text based on the column width
            // We use detailFontSize + 1 to match your current styling
            const wrappedLines = wrapText(textValue, columnWidth, normalFont, detailFontSize + 1);

            // 3. Draw each line of the wrapped text
            wrappedLines.forEach((line, index) => {
                page.drawText(line, {
                    x,
                    y: valueYStart - (index * (detailFontSize + 5)), // Spacing between lines
                    size: detailFontSize + 1,
                    font: normalFont,
                    color: TEXT_COLOR
                });
            });

            // 4. Return the new Y position dynamically
            // This ensures the next label starts after all lines of the previous value
            const totalValueHeight = wrappedLines.length * (detailFontSize + 5);
            return valueYStart - totalValueHeight - 20; // 20 is the gap between sections
        };

        clientY = drawElegantDetail(detailsPage, "Client Name", clientData.clientName, leftColX, clientY);
        clientY = drawElegantDetail(detailsPage, "Email Address", clientData.email, leftColX, clientY);
        clientY = drawElegantDetail(detailsPage, "Contact Number", clientData.whatsapp, leftColX, clientY);
        clientY = drawElegantDetail(detailsPage, "Site Location", clientData.location, leftColX, clientY);

        // --- RIGHT COLUMN: PROJECT INFORMATION ---
        yPosition = columnTopY; // Reset Y to top of section for the right column

        detailsPage.drawText("PROJECT DETAILS", {
            x: rightColX,
            y: yPosition,
            size: sectionTitleSize,
            font: boldFont,
            color: PRIMARY_COLOR,
        });

        let projectY = yPosition - 30;

        projectY = drawElegantDetail(detailsPage, "Project Name", projectData?.projectName || "-", rightColX, projectY);
        projectY = drawElegantDetail(detailsPage, "Quotation Number", newVariant.quoteNo, rightColX, projectY);
        projectY = drawElegantDetail(detailsPage, "Date of Issue", new Date().toLocaleDateString('en-IN'), rightColX, projectY);
        // if (newVariant?.brandName) {
        //     projectY = drawElegantDetail(detailsPage, "Material Brand", newVariant.brandName, rightColX, projectY);
        // }

        // --- 4. DECORATIVE DIVIDER ---
        // Draw a vertical line to separate Client and Project sections elegantly
        const lineBottom = Math.min(clientY, projectY);
        detailsPage.drawLine({
            start: { x: width / 2, y: columnTopY },
            end: { x: width / 2, y: lineBottom + 20 },
            thickness: 0.5,
            color: rgb(0.8, 0.8, 0.8),
        });

        yPosition = lineBottom - 50;
        //  END OF FIRST PAGE NEW VERSION




        // === Furniture Pages === //
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

            if (font.widthOfTextAtSize(text, size) <= maxWidth) {
                // currentPage.drawText(text, {
                //     x: x + 5,
                //     y: y - size,
                //     font: font,
                //     size: size,
                //     color: color,
                // });

                drawTextOrBlur({
                    page: currentPage,
                    text: text,
                    x: x + 5,
                    y: y - size,
                    fontSize: size,
                    font: font,
                    color: color,
                    isBlurred: isBlurred, // Uses the variable from parent scope
                    isRightAligned: false,
                    maskWidth: maxWidth
                });
                return 1;
            }



            let currentLine = '';
            const lines: string[] = [];

            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const testLine = currentLine + char;
                const testWidth = font.widthOfTextAtSize(testLine, size);

                if (testWidth <= maxWidth) {
                    currentLine = testLine;
                } else {
                    lines.push(currentLine);
                    currentLine = char;
                }
            }

            if (currentLine) {
                lines.push(currentLine);
            }

            let currentY = y - size;
            for (const line of lines) {
                // currentPage.drawText(line, {
                //     x: x + 5,
                //     y: currentY,
                //     font: font,
                //     size: size,
                //     color: color,
                // });

                drawTextOrBlur({
                    page: currentPage,
                    text: line,
                    x: x + 5,
                    y: currentY,
                    fontSize: size,
                    font: font,
                    color: color,
                    isBlurred: isBlurred,
                    isRightAligned: false,
                    maskWidth: maxWidth
                });

                currentY -= lineHeight;
            }

            return lines.length;
        };

        const calculateTextLines = (text: string, maxWidth: number, font: any, size: number): number => {
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

        const drawCenteredText = (text: string, x: number, width: number, y: number, font: any, size: number, color = rgb(0, 0, 0)) => {
            const textWidth = font.widthOfTextAtSize(text, size);
            // currentPage.drawText(text, {
            //     x: x + (width - textWidth) / 2,
            //     y: y - size,
            //     font: font,
            //     size: size,
            //     color: color,
            // });

           
            const isMaskCall = text === "QUANTITY_MASK" || text === "COST_AMOUNT_MASK";


            if (isBlurred && isMaskCall) {

                const FIXED_WIDTH = 45;
                const FIXED_X = x + (width / 2) + (isBlurred ? 15 : 20  ); // Center of the specific cell



                drawTextOrBlur({
                    page: currentPage,
                    text: text,
                    // x: x + (width / 2) + (isBlurred ? 20 : 15), // Anchor to middle
                    x: FIXED_X,
                    y: y - size,
                    fontSize: size,
                    font: font,
                    color: color,
                    isBlurred: isBlurred,
                    isRightAligned: true, // This centers the mask/text relative to the middle anchor
                    maskWidth: FIXED_WIDTH
                });
            }
            else {
                // --- 2. NORMAL STATE (Not Blurred) ---
                // Calculate real text width so we can center it perfectly
                const realTextWidth = font.widthOfTextAtSize(text, size);
                const centerX = x + (width / 2) + 15;

                drawTextOrBlur({
                    page: currentPage,
                    text: text,
                    x: centerX,
                    y: y - size,
                    fontSize: size,
                    font: font,
                    color: color,
                    isBlurred: false, // Ensure this is false here
                    isRightAligned: true,
                    maskWidth: realTextWidth
                });
            }
        };

        const drawTableWithBorders = async (headers: string[], columnWidths: number[], rows: any[], isCoreMaterials = false, isBlurred: boolean) => {
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

                const isLastColumn = i === headers.length - 1;

                const effectiveWidth = isLastColumn ? (columnWidths[i] - 15) : columnWidths[i];


                const textWidth = boldFont.widthOfTextAtSize(headers[i], FONT_SIZE);

                currentPage.drawText(headers[i], {
                    // x: xPos + (columnWidths[i] - textWidth) / 2,
                    x: xPos + (effectiveWidth - textWidth) / 2,
                    y: yPosition - 15,
                    font: boldFont,
                    size: FONT_SIZE,
                    color: TABLE_HEADER_TEXT_COLOR,
                });

                if (i < headers.length - 1) {
                    currentPage.drawLine({
                        start: { x: xPos + columnWidths[i], y: yPosition - headerHeight + 5 },
                        end: { x: xPos + columnWidths[i], y: yPosition + 5 },
                        thickness: 1,
                        color: rgb(1, 1, 1),
                    });
                }

                xPos += columnWidths[i];



            }

            currentPage.drawLine({
                start: { x: startX, y: yPosition - headerHeight + 5 },
                end: { x: startX + tableWidth, y: yPosition - headerHeight + 5 },
                thickness: 1,
                color: TABLE_HEADER_BG_COLOR,
            });

            yPosition -= headerHeight - 5;

            // Draw rows with borders
            for (const row of rows) {
                let rowHeight = baseRowHeight;
                let maxLines = 1;


                if (!isCoreMaterials) {
                    const description = row.description || "-";
                    const descriptionLines = calculateTextLines(description, columnWidths[1] - 10, normalFont, FONT_SIZE);
                    maxLines = Math.max(maxLines, descriptionLines);

                    const itemName = row.itemName || "-";
                    const itemNameLines = calculateTextLines(itemName, columnWidths[0] - 10, normalFont, FONT_SIZE);
                    maxLines = Math.max(maxLines, itemNameLines);
                } else {
                    const itemName = row.itemName || "-";
                    const itemNameLines = calculateTextLines(itemName, columnWidths[1] - 10, normalFont, FONT_SIZE);
                    maxLines = Math.max(maxLines, itemNameLines);

                    if (row.imageUrl) {
                        rowHeight = Math.max(rowHeight, 40);
                    }
                }

                rowHeight = Math.max(rowHeight, baseRowHeight + (maxLines - 1) * lineHeight);

                ensureSpace(rowHeight + 20);

                xPos = startX;
                let columnIndex = 0;
                let rowYPosition = yPosition;

                // For core materials table (but not used hou cna remove this later once cheked)
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

                                    const imageX = xPos + (columnWidths[columnIndex] - imageDims.width) / 2;
                                    const imageY = rowYPosition - rowHeight / 2 - imageDims.height / 2;

                                    currentPage.drawImage(image, {
                                        x: imageX,
                                        y: imageY,
                                        width: imageDims.width,
                                        height: imageDims.height,
                                    });
                                } catch (e) {
                                    try {
                                        const image = await pdfDoc.embedJpg(imageBuffer);
                                        const maxImageSize = 25;
                                        const scale = Math.min(maxImageSize / image.width, maxImageSize / image.height);
                                        const imageDims = { width: image.width * scale, height: image.height * scale };

                                        const imageX = xPos + (columnWidths[columnIndex] - imageDims.width) / 2;
                                        const imageY = rowYPosition - rowHeight / 2 - imageDims.height / 2;

                                        currentPage.drawImage(image, {
                                            x: imageX,
                                            y: imageY,
                                            width: imageDims.width,
                                            height: imageDims.height,
                                        });
                                    } catch (e) {
                                        const textY = rowYPosition - rowHeight / 2;
                                        drawCenteredText("Invalid Image", xPos, columnWidths[columnIndex], textY, normalFont, FONT_SIZE - 2);
                                    }
                                }
                            } else {
                                const textY = rowYPosition - rowHeight / 2;
                                drawCenteredText("No Image", xPos, columnWidths[columnIndex], textY, normalFont, FONT_SIZE - 2);
                            }
                        } catch (error) {
                            const textY = rowYPosition - rowHeight / 2;
                            drawCenteredText("No Image", xPos, columnWidths[columnIndex], textY, normalFont, FONT_SIZE - 2);
                        }
                    } else {
                        const textY = rowYPosition - rowHeight / 2;
                        drawCenteredText("No Image", xPos, columnWidths[columnIndex], textY, normalFont, FONT_SIZE - 2);
                    }

                    xPos += columnWidths[columnIndex++];

                    // Item Name column
                    const itemName = row.itemName || "-";
                    const itemNameMaxWidth = columnWidths[columnIndex] - 10;
                    const itemNameLinesCount = calculateTextLines(itemName, itemNameMaxWidth, normalFont, FONT_SIZE);
                    const itemNameHeight = itemNameLinesCount * lineHeight;
                    const textTopY = rowYPosition - (rowHeight - itemNameHeight) / 2;

                    drawLeftAlignedText(itemName, xPos, columnWidths[columnIndex], textTopY, normalFont, FONT_SIZE);
                    xPos += columnWidths[columnIndex++];

                    // Quantity column
                    const quantityText = String(row.plywoodNos?.quantity || 0);
                    const centerY = rowYPosition - rowHeight / 2;
                    drawCenteredText(isBlurred ? "QUANTITY_MASK" : quantityText, xPos, columnWidths[columnIndex], centerY, normalFont, FONT_SIZE);
                    xPos += columnWidths[columnIndex++];

                    // Cost column
                    const costText = `${row.rowTotal}`;
                    drawCenteredText(isBlurred ? "COST_AMOUNT_MASK" : costText, xPos, columnWidths[columnIndex], centerY, boldFont, FONT_SIZE);
                }
                // For simple tables (fittings, glues, nbms)
                else {
                    let currentX = startX;
                    let currentColIdx = 0;
                    const adjustedYForCentering = (rowYPosition - (rowHeight / 2)) + (FONT_SIZE / 2);
                    const centerY = rowYPosition - rowHeight / 2;

                    // 1. Draw left border
                    currentPage.drawLine({
                        start: { x: currentX, y: yPosition },
                        end: { x: currentX, y: yPosition - rowHeight },
                        thickness: 1,
                        color: TABLE_HEADER_BG_COLOR,
                    });

                    // 2. Item Name
                    const itemName = row.itemName || "-";
                    const w1 = columnWidths[currentColIdx];
                    drawLeftAlignedText(itemName, currentX, w1, rowYPosition - 10, normalFont, FONT_SIZE);
                    currentX += w1;
                    currentColIdx++;

                    // 3. Description
                    const description = row.description || "-";
                    const w2 = columnWidths[currentColIdx];
                    drawLeftAlignedText(description, currentX, w2, rowYPosition - 10, normalFont, FONT_SIZE);
                    currentX += w2;
                    currentColIdx++;

                    // 4. Quantity (Centered)
                    const qtyText = String(row.quantity || 0);
                    const w3 = columnWidths[currentColIdx];
                    drawCenteredText(isBlurred ? "QUANTITY_MASK" : qtyText, currentX, w3, adjustedYForCentering, normalFont, FONT_SIZE);
                    currentX += w3 - 10;
                    currentColIdx++;

                    // 5. Cost (Centered) - FIX: Use the specific 4th column width
                    const costText = Number(row.rowTotal).toLocaleString('en-IN', {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2
                    });
                    const w4 = columnWidths[currentColIdx];

                    // Pass currentX and w4 explicitly so it stays inside the box
                    drawCenteredText(isBlurred ? "COST_AMOUNT_MASK" : costText, currentX, w4, adjustedYForCentering, boldFont, FONT_SIZE);

                    // Update global xPos for the border loop
                    xPos = currentX + w4;
                    // xPos = startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3];
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

            yPosition -= 20;
        };

        const drawCoreMaterialsTable = async (headers: string[], columnWidths: number[], rows: any[], templateType: string = "type 1") => {
            const headerHeight = 25;
            const baseRowHeight = 25;
            const lineHeight = FONT_SIZE * 1.2;
            const startX = 50;
            const tableWidth = width - 100;

            let totalRowsHeight = 0;
            let rowHeights: number[] = [];

            for (const row of rows) {
                let rowHeight = baseRowHeight;
                let maxLines = 1;

                // For type 2 and type 1, calculate item name lines
                if (templateType !== "type 3") {
                    const itemNameColIndex = headers.indexOf("Item Name");
                    if (itemNameColIndex !== -1) {
                        const itemName = row.itemName || "-";
                        const itemNameLines = calculateTextLines(itemName, columnWidths[itemNameColIndex] - 10, normalFont, FONT_SIZE);
                        maxLines = Math.max(maxLines, itemNameLines);
                    }
                }

                // For type 3 (only image), make rows taller to accommodate image
                if (templateType === "type 3" && row.imageUrl) {
                    rowHeight = Math.max(rowHeight, 60); // Taller rows for image-only view
                } else {
                    rowHeight = Math.max(rowHeight, baseRowHeight + (maxLines - 1) * lineHeight);
                }

                rowHeights.push(rowHeight);
                totalRowsHeight += rowHeight;
            }

            const totalTableHeight = headerHeight + 5 + totalRowsHeight;
            const sectionStartY = yPosition;

            // Draw FULL header background
            currentPage.drawRectangle({
                x: startX,
                y: yPosition - headerHeight + 5,
                width: tableWidth,
                height: headerHeight,
                color: TABLE_HEADER_BG_COLOR,
            });

            // Draw header text
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

                if (i < headers.length - 1) {
                    currentPage.drawLine({
                        start: { x: xPos + columnWidths[i], y: yPosition - headerHeight + 5 },
                        end: { x: xPos + columnWidths[i], y: yPosition + 5 },
                        thickness: 1,
                        color: rgb(1, 1, 1),
                    });
                }

                xPos += columnWidths[i];
            }

            currentPage.drawLine({
                start: { x: startX, y: yPosition - headerHeight + 5 },
                end: { x: startX + tableWidth, y: yPosition - headerHeight + 5 },
                thickness: 1,
                color: TABLE_HEADER_BG_COLOR,
            });

            yPosition -= headerHeight - 5;

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
                            // Adjust image size based on template type
                            let maxImageSize = 40;
                            if (templateType === "type 3") {
                                maxImageSize = 80; // Larger images for type 3 (image only)
                            } else if (templateType === "type 2") {
                                maxImageSize = 30; // Smaller images for type 2
                            }

                            const scale = Math.min(maxImageSize / sectionImage.width, maxImageSize / sectionImage.height);
                            sectionImageDims = {
                                width: sectionImage.width * scale,
                                height: sectionImage.height * scale
                            };

                            // 1. Calculate the exact vertical boundaries of the row area
                            const tableTopY = sectionStartY - headerHeight;
                            const tableBottomY = tableTopY - totalRowsHeight;

                            // 2. Find the mathematical center of that specific box
                            const verticalCenter = (tableTopY + tableBottomY) / 2;

                            // 3. Center the image by subtracting half its height from the center point
                            const imageX = startX + (columnWidths[0] - sectionImageDims.width) / 2;
                            const imageY = verticalCenter - (sectionImageDims.height / 2);

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

            if (!hasImage || !sectionImage) {
                // 1. Establish the top of the rows (just below the header)
                const rowsStartY = sectionStartY - headerHeight + 5;

                // 2. Find the geometric center of the merged image column
                const imageCenterY = rowsStartY - (totalRowsHeight / 2);

                const text = "No Image";
                const fontSize = FONT_SIZE - 2;
                const textWidth = normalFont.widthOfTextAtSize(text, fontSize);

                // 3. Calculate exact coordinates
                // Horizontal center
                const textX = startX + (columnWidths[0] - textWidth) / 2;
                // Vertical center (adjusted for the font's baseline)
                const textY = imageCenterY - (fontSize / 4);

                currentPage.drawText(text, {
                    x: textX,
                    y: textY,
                    size: fontSize,
                    font: normalFont,
                    color: rgb(0.3, 0.3, 0.3),
                });
            }

            // Draw rows with proper borders
            for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                const row = rows[rowIndex];
                const rowHeight = rowHeights[rowIndex];
                const isLastRow = rowIndex === rows.length - 1; // Check if it's the last row

                ensureSpace(rowHeight + 20);

                xPos = startX;
                let columnIndex = 0;
                let rowYPosition = yPosition;

                // Process each column based on template type
                for (const header of headers) {
                    if (header === "Image") {
                        // Image column is already handled above (single image for section)
                        // Just move xPos for this column
                        xPos += columnWidths[columnIndex++];
                        continue;
                    }

                    if (header === "Item Name") {
                        // // Item Name column (left aligned)
                        const itemName = row.itemName || "-";
                        const itemNameMaxWidth = columnWidths[columnIndex] - 10;
                        const itemNameLinesCount = calculateTextLines(itemName, itemNameMaxWidth, normalFont, FONT_SIZE);
                        const itemNameHeight = itemNameLinesCount * lineHeight;
                        const textTopY = rowYPosition - (rowHeight - itemNameHeight) / 2;

                        drawLeftAlignedText(itemName, xPos, columnWidths[columnIndex], textTopY, normalFont, FONT_SIZE);
                        xPos += columnWidths[columnIndex++];
                    }
                    else if (header === "Quantity") {
                        // Quantity column (centered)
                        const quantityText = String(row.plywoodNos?.quantity || 0);
                        const centerY = rowYPosition - rowHeight / 2;
                        drawCenteredText(isBlurred ? "QUANTITY_MASK" : quantityText, xPos, columnWidths[columnIndex], centerY, normalFont, FONT_SIZE);
                        xPos += columnWidths[columnIndex++];



                    }
                    else if (header === "Cost") {
                        // Cost column (centered)
                        const costText = Number(row?.rowTotal).toLocaleString('en-IN', {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2
                        });
                        // const costText = `${row.rowTotal}`;
                        const centerY = rowYPosition - rowHeight / 2;
                        drawCenteredText(isBlurred ? "COST_AMOUNT_MASK" : costText, xPos, columnWidths[columnIndex], centerY, boldFont, FONT_SIZE);
                        xPos += columnWidths[columnIndex++];
                    }
                }



                //  START OF NEW VERSION

                // --- BORDER LOGIC CHANGES START HERE ---

                // 1. MODIFIED HORIZONTAL LINE (Row Separator)
                // Only draw the horizontal line if it's the last row (table bottom) 
                // OR if we are skipping the Image column width for internal rows.
                currentPage.drawLine({
                    start: {
                        x: isLastRow ? startX : startX + columnWidths[0], // If last row, start from table edge. Otherwise, start after Image col.
                        y: yPosition - rowHeight
                    },
                    end: { x: startX + tableWidth, y: yPosition - rowHeight },
                    thickness: 1,
                    color: TABLE_HEADER_BG_COLOR,
                });

                let xPosBorder = startX;
                for (let i = 0; i < headers.length; i++) {
                    // We draw a vertical line at every xPosBorder
                    // This includes the line between Image (index 0) and Item Name (index 1)
                    currentPage.drawLine({
                        start: { x: xPosBorder, y: yPosition },
                        end: { x: xPosBorder, y: yPosition - rowHeight },
                        thickness: 1,
                        color: TABLE_HEADER_BG_COLOR,
                    });

                    xPosBorder += columnWidths[i];
                }

                // 3. Right border of table (always drawn)
                currentPage.drawLine({
                    start: { x: startX + tableWidth, y: yPosition },
                    end: { x: startX + tableWidth, y: yPosition - rowHeight },
                    thickness: 1,
                    color: TABLE_HEADER_BG_COLOR,
                });

                // --- BORDER LOGIC CHANGES END HERE ---

                yPosition -= rowHeight;
            }

            // END OF NEW VERSION

            // Draw bottom border of table
            currentPage.drawLine({
                start: { x: startX, y: yPosition },
                end: { x: startX + tableWidth, y: yPosition },
                thickness: 1,
                color: TABLE_HEADER_BG_COLOR,
            });

            yPosition -= 20;
        };

        const renderSimpleSection = async (title: string, rows: any[], total: number, hideSubTotal: boolean = false) => {
            const validRows = filterSimpleRows(rows);
            if (validRows.length === 0) return;


            const showSubtotalText = hideSubTotal ? "Total" : "Subtotal"
            // Template Type 2: Don't show anything (no table, no subtotal)
            if (templateType === "type 2") {
                return;
            }

            // Template Type 3: Show only subtotal without table
            if (templateType === "type 3") {
                ensureSpace(30);
                const totalText = `${title} ${showSubtotalText} Rs: ${total}`;
                currentPage.drawText(`${title} ${showSubtotalText} Rs: ${total}`, {
                    x: width - 250,
                    y: yPosition,
                    font: boldFont,
                    size: FONT_SIZE,
                    color: SUBTOTAL_COLOR
                });

                // drawTextOrBlur({
                //     page: currentPage,
                //     text: totalText,
                //     x: width - 50,
                //     y: yPosition,
                //     fontSize: FONT_SIZE,
                //     font: boldFont,
                //     color: SUBTOTAL_COLOR,
                //     isBlurred: isBlurred,
                //     isRightAligned: true,
                //     maskWidth: 150
                // });


                yPosition -= SECTION_SPACE;
                return;
            }


            // Template Type 1: Show full table with subtotal
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
                false,
                isBlurred
            );

            // Subtotal
            ensureSpace(30);
            currentPage.drawText(`${showSubtotalText} Rs: ${total}`, {
                x: width - 200,
                y: yPosition,
                font: boldFont,
                size: FONT_SIZE,
                color: SUBTOTAL_COLOR
            });


            // drawTextOrBlur({
            //     page: currentPage,
            //     text: `${showSubtotalText} Rs: ${total}`,
            //     x: width - 50,
            //     y: yPosition,
            //     fontSize: FONT_SIZE,
            //     font: boldFont,
            //     color: SUBTOTAL_COLOR,
            //     isBlurred: isBlurred,
            //     isRightAligned: true,
            //     maskWidth: 100
            // });
            yPosition -= SECTION_SPACE;
        };

        // Main furniture loop
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

                // Calculate dynamic widths based on template type
                const tableWidth = width - 100; // Full page width minus margins
                let headers: string[] = [];
                let columnWidths: number[] = [];

                if (templateType === "type 3") {
                    // Type 3: Show only image
                    headers = ["Image"];
                    columnWidths = [tableWidth]; // Full width for image
                }
                else if (templateType === "type 2") {
                    // Type 2: Show image, itemName, cost
                    headers = ["Image", "Item Name", "Cost"];
                    // Distribute width: 20% image, 60% item name, 20% cost
                    columnWidths = [
                        tableWidth * 0.2, // Image
                        tableWidth * 0.6, // Item Name
                        tableWidth * 0.2  // Cost
                    ];
                }
                else {
                    // Type 1: Show all columns (image, itemName, quantity, cost)
                    headers = ["Image", "Item Name", "Quantity", "Cost"];
                    // Distribute width: 15% image, 50% item name, 15% quantity, 20% cost
                    columnWidths = [
                        tableWidth * 0.15, // Image
                        tableWidth * 0.50, // Item Name
                        tableWidth * 0.15, // Quantity
                        tableWidth * 0.20  // Cost
                    ];
                }

                await drawCoreMaterialsTable(headers, columnWidths, coreMaterials, templateType);

                // --- FORMATTING SUBTOTALS ---
                const formattedSubtotal = Number(furniture?.coreMaterialsTotal).toLocaleString('en-IN', {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2
                });

                // Subtotal
                ensureSpace(30);
                const subtotalText = `Subtotal Rs: ${formattedSubtotal}`;
                currentPage.drawText(`Subtotal Rs: ${formattedSubtotal}`, {
                    x: width - 200,
                    y: yPosition,
                    font: boldFont,
                    size: FONT_SIZE,
                    color: SUBTOTAL_COLOR,

                });


                // drawTextOrBlur({
                //     page: currentPage,
                //     text: subtotalText,
                //     x: width - 50, // Use the right margin as the anchor
                //     y: yPosition,
                //     fontSize: FONT_SIZE,
                //     font: boldFont,
                //     color: SUBTOTAL_COLOR,
                //     isBlurred: isBlurred,
                //     isRightAligned: true, // Anchor to right to prevent layout shifting
                //     maskWidth: 120
                // });

                yPosition -= SECTION_SPACE;
            }

            // Render simple sections (fittings, glues, nbms) - only for type 1
            await renderSimpleSection("Fittings", furniture.fittingsAndAccessories, furniture.fittingsAndAccessoriesTotal, false);
            await renderSimpleSection("Glues", furniture.glues, furniture.gluesTotal, false);
            await renderSimpleSection("Non-Branded Materials", furniture.nonBrandMaterials, furniture.nonBrandMaterialsTotal, false);

            // Furniture Total
            ensureSpace(40);
            // --- FORMATTING SUBTOTALS ---
            const formattedSubtotal = Number(furniture.furnitureTotal).toLocaleString('en-IN', {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2
            });

            currentPage.drawText(`Product Total: Rs: ${formattedSubtotal}`, {
                x: width - 250,
                y: yPosition,
                font: boldFont,
                size: 14,
                color: PRODUCTTOTAL_COLOR
            });


            // const productTotalText = `Product Total: Rs: ${formattedSubtotal}`;

            // drawTextOrBlur({
            //     page: currentPage,
            //     text: productTotalText,
            //     x: width - 50,
            //     y: yPosition,
            //     fontSize: 14,
            //     font: boldFont,
            //     color: PRODUCTTOTAL_COLOR,
            //     isBlurred: isBlurred,
            //     isRightAligned: true,
            //     maskWidth: 180
            // });
            yPosition -= SECTION_SPACE * 1.5;
        }



        if (newVariant?.commonMaterials) {

            const commonMattotal = newVariant?.commonMaterials.reduce(
                (sum: number, row: any) => sum + row.rowTotal,
                0)
            await renderSimpleSection("Common Materials", newVariant?.commonMaterials, commonMattotal, true);
        }


        // === GRAND TOTAL ===
        // This ensures 2 decimal places and adds Indian style commas (e.g., 93,559.96)
        const formattedGrandTotal = Number(newVariant.grandTotal).toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
        });
        const grandTotalFullText = `Grand Total Rs: ${formattedGrandTotal}`;
        if (yPosition > 100) {
            currentPage.drawText(`Grand Total Rs:${formattedGrandTotal}`, {
                x: width - 250,
                y: yPosition,
                font: boldFont,
                size: 16,
                // color: rgb(0.1, 0.5, 0.1),
                color: GRAND_TOTAL_COLOR,
            });
            // drawTextOrBlur({
            //     page: currentPage,
            //     text: grandTotalFullText,
            //     x: width - 50,
            //     y: yPosition,
            //     fontSize: 16,
            //     font: boldFont,
            //     color: GRAND_TOTAL_COLOR,
            //     isBlurred: isBlurred,
            //     isRightAligned: true,
            //     maskWidth: 200 // Larger mask to cover "Grand Total Rs: XXXXX"
            // });
        } else {
            currentPage = pdfDoc.addPage();
            yPosition = currentPage.getHeight() - 100;

            const fullText = `GRAND TOTAL Rs: ${formattedGrandTotal}`;
            currentPage.drawText(fullText, {
                x: (width - boldFont.widthOfTextAtSize(fullText, 16)) / 2,
                y: yPosition,
                font: boldFont,
                size: 16,
                color: GRAND_TOTAL_COLOR,
            });

            // drawTextOrBlur({
            //     page: currentPage,
            //     text: grandTotalFullText,
            //     x: width - 50,
            //     y: yPosition,
            //     fontSize: 16,
            //     font: boldFont,
            //     color: GRAND_TOTAL_COLOR,
            //     isBlurred: isBlurred,
            //     isRightAligned: true,
            //     maskWidth: 200 // Larger mask to cover "Grand Total Rs: XXXXX"
            // });

        }

        // === TERMS AND CONDITIONS ===
        // for (let i = 0; i < 3; i++) {
        //     const termsPage = pdfDoc.addPage();
        //     const centerX = termsPage.getWidth() / 2;
        //     const centerY = termsPage.getHeight() / 2;
        //     const text = "Terms and Conditions";

        //     const textWidth = boldFont.widthOfTextAtSize(text, 22);

        //     termsPage.drawText(text, {
        //         x: centerX - textWidth / 2,
        //         y: centerY,
        //         font: boldFont,
        //         size: 22,
        //         color: rgb(0, 0, 0),
        //     });
        // }


        // === TERMS AND CONDITIONS PAGE ===




        const termsPage = pdfDoc.addPage();
        const { width: pageWidth, height: pageHeight } = termsPage.getSize();
        let termsY = pageHeight - 50;

        // Header: Terms and Conditions
        const termsTitle = "Terms and Conditions";
        const termsTitleWidth = boldFont.widthOfTextAtSize(termsTitle, 18);
        termsPage.drawText(termsTitle, {
            x: (pageWidth - termsTitleWidth) / 2,
            y: termsY,
            size: 18,
            font: boldFont,
            color: rgb(0, 0, 0),
        });
        termsY -= 15;

        // Horizontal Divider
        termsPage.drawLine({
            start: { x: 50, y: termsY },
            end: { x: pageWidth - 50, y: termsY },
            thickness: 1,
            color: rgb(0.8, 0.8, 0.8),
        });
        termsY -= 30;

        // Sub-header: VERTICAL LIVING – PAYMENT TERMS

        const subHeader = `${orgName} – PAYMENT TERMS`;
        termsPage.drawText(subHeader, {
            x: 50,
            y: termsY,
            size: 12,
            font: boldFont,
            color: rgb(0, 0, 0),
        });
        termsY -= 25;

        // --- PAYMENT MILESTONE TABLE ---
        const milestoneHeaders = ["Milestone", "Amount / Percentage", "Work Included"];
        const milestoneColWidths = [140, 130, 240];
        let tableX = 50;

        // Draw Table Headers
        milestoneHeaders.forEach((header, idx) => {
            termsPage.drawText(header, {
                x: tableX,
                y: termsY,
                size: 10,
                font: boldFont,
                color: rgb(0, 0, 0),
            });
            tableX += milestoneColWidths[idx];
        });
        termsY -= 20;

        const milestones = [
            { m: "Booking Advance", a: "INR 10,000 (fixed)", w: "Site visit, client discussion, proposal drafting" },
            { m: "Design Approval & Site Measurement", a: "INR 15,000 (fixed)", w: "2D/3D design finalization, site measurement, BOQ preparation" },
            { m: "Material Procurement & Site Start", a: "80% of total project", w: "Material purchase, delivery, fabrication, and/or civil work initiation" },
            { m: "Execution Completion", a: "10% of total project", w: "Modular/civil work installation, finishing, painting, electrical/plumbing (if any)" },
            { m: "Final Handover Payment", a: "10% of total project", w: "Snag list closure, cleaning, documentation, and final handover" }
        ];

        milestones.forEach((item) => {
            let milestoneX = 50;

            // Draw Bullet/Icon (Blue diamond as seen in image)
            // termsPage.drawText("◆", { x: milestoneX - 15, y: termsY, size: 10, color: rgb(0.1, 0.4, 0.9) });

            termsPage.drawRectangle({
                x: milestoneX - 18,
                y: termsY - 2,
                width: 5,
                height: 5,
                color: rgb(0.1, 0.4, 0.9),
                rotate: degrees(45), // Rotates square into a diamond shape
            });

            // Milestone Name
            const mLines = wrapText(item.m, milestoneColWidths[0] - 10, boldFont, 9);
            // Amount
            const aLines = wrapText(item.a, milestoneColWidths[1] - 10, boldFont, 9);
            // Work Included
            const wLines = wrapText(item.w, milestoneColWidths[2] - 10, normalFont, 9);

            const maxRowLines = Math.max(mLines.length, aLines.length, wLines.length);

            mLines.forEach((line, i) => termsPage.drawText(line, { x: milestoneX, y: termsY - (i * 12), size: 9, font: boldFont }));
            milestoneX += milestoneColWidths[0];

            aLines.forEach((line, i) => termsPage.drawText(line, { x: milestoneX, y: termsY - (i * 12), size: 9, font: boldFont }));
            milestoneX += milestoneColWidths[1];

            wLines.forEach((line, i) => termsPage.drawText(line, { x: milestoneX, y: termsY - (i * 12), size: 9, font: normalFont }));

            termsY -= (maxRowLines * 12) + 10;
        });

        termsY -= 10;
        termsPage.drawLine({ start: { x: 50, y: termsY }, end: { x: pageWidth - 50, y: termsY }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
        termsY -= 30;

        // --- PAYMENT TERMS AND CONDITIONS LIST ---
        termsPage.drawText("Payment Terms and Conditions.", { x: 50, y: termsY, size: 12, font: boldFont });
        termsY -= 20;

        const conditions = [
            { label: "Delayed Payments:", text: "Interest of 2% per month applies if payment is overdue beyond 5 working days" },
            { label: "GST:", text: "Will be added as applicable by law and shown on invoices" },
            { label: "Forfeiture Clause:", text: "If the next milestone payment is not processed within 7 working days of intimation, the previous fixed payments INR (10,000 + 15,000) shall stand forfeited. Vertical Living reserves the right to cancel or suspend the project without refund or liability for any damages caused due to non-compliance." },
            { label: "Legal Validity:", text: "Acceptance via digital signature, physical signature, or email is enforceable under the Information Technology Act, 2000" }
        ];

        conditions.forEach((cond) => {
            // Keep bullet at x: 50
            termsPage.drawRectangle({
                x: 50,
                y: termsY + 2,
                width: 3,
                height: 3,
                color: rgb(0, 0, 0),
            });

            const textStartX = 65;
            const fontSize = 9;

            // ⭐ FIX: Calculate width by subtracting the start position AND a right margin (e.g., 50)
            // This ensures the text wraps before hitting the right edge of the page.
            const availableWidth = pageWidth - textStartX - 50;

            const labelWithSpace = cond.label + " ";
            const labelWidth = boldFont.widthOfTextAtSize(labelWithSpace, fontSize);
            const fullLineText = labelWithSpace + cond.text;

            // Wrap the text using the corrected availableWidth
            const wrappedLines = wrapText(fullLineText, availableWidth, normalFont, fontSize);

            wrappedLines.forEach((line, idx) => {
                if (idx === 0) {
                    // Draw Bold Label
                    termsPage.drawText(cond.label, { x: textStartX, y: termsY, size: fontSize, font: boldFont });

                    // Draw the rest of the first line starting immediately after the label
                    // line.substring(cond.label.length) handles the offset correctly
                    termsPage.drawText(line.substring(cond.label.length), {
                        x: textStartX + labelWidth,
                        y: termsY,
                        size: fontSize,
                        font: normalFont
                    });
                } else {
                    // For lines 2, 3, etc., align perfectly under the start of the first line
                    termsPage.drawText(line, { x: textStartX, y: termsY, size: fontSize, font: normalFont });
                }
                termsY -= 12; // Line spacing
            });

            termsY -= 8; // Space between different bullet points
        });

        // --- SIGNATURE SECTION ---
        // We use a fixed position from the bottom of the page (e.g., 80 units up)
        const bottomY = 80;

        termsPage.drawText("MANAGING DIRECTOR", {
            x: 50,           // Align with your table and bullet points
            y: bottomY,
            size: 12,        // Slightly larger for the footer
            font: boldFont,
            color: rgb(0, 0, 0),
        });

        // // Optional: Add a subtle horizontal line above the title if you want a signature space
        // termsPage.drawLine({
        //     start: { x: 50, y: bottomY + 25 },
        //     end: { x: 200, y: bottomY + 25 },
        //     thickness: 1,
        //     color: rgb(0, 0, 0),
        // });

        const pdfBytes = await pdfDoc.save();
        const fileName = `home-interior-quote-${newVariant.quoteNo}-${Date.now()}.pdf`;

        const uploadResult = await uploadToS3(pdfBytes, fileName);

        const finalDoc = await QuoteVarientGenerateModel.findByIdAndUpdate(
            newVariant._id,
            // {
            //     pdfLink: {
            //         type: "pdf",
            //         url: uploadResult.Location,
            //         originalName: fileName,
            //         uploadedAt: new Date(),
            //     },
            // },
            {
                $push: {
                    pdfType: {
                        // Change 'template' to 'templateType' to match your schema
                        templateType: templateType,
                        pdf: {
                            type: "pdf",
                            url: uploadResult.Location,
                            originalName: fileName,
                            uploadedAt: new Date(),
                        }
                    }
                }
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





export const generateClientQuoteVariantSqftRatePdfwithTemplates = async ({
    quoteId,
    projectId,
    newVariant,
    templateType = "type 1",// Default to type 1
    isBlurred,
}: {
    quoteId: string;
    projectId: string;
    newVariant: any;
    templateType?: "type 1" | "type 2" | "type 3";
    isBlurred: boolean,

}) => {
    try {

        // Define colors
        const PRIMARY_COLOR = rgb(0.1, 0.4, 0.9);
        // const TEXT_COLOR = rgb(0.2, 0.2, 0.2);
        const LIGHT_TEXT_COLOR = rgb(0.4, 0.4, 0.4);
        const LINE_COLOR = rgb(0.6, 0.6, 0.6);

        const SUBTOTAL_COLOR = rgb(0.4, 0.4, 0.4); // Soft Medium Green
        const PRODUCTTOTAL_COLOR = rgb(0.2, 0.2, 0.2)
        const GRAND_TOTAL_COLOR = rgb(0.0, 0.0, 0.0); // Deep Forest Green
        const TABLE_HEADER_BG = rgb(0.95, 0.95, 0.95);


        const [projectData, clientDataDoc] = await Promise.all([
            // ProjectModel.findById(projectId),
            ProjectModel.findById(projectId).populate("organizationId"),
            RequirementFormModel.findOne({ projectId }),
        ]);


        // Extract Organization Info safely
        const orgInfo = (projectData?.organizationId as any) || {};
        const orgName = orgInfo?.organizationName || COMPANY_NAME;
        const orgGstin = orgInfo?.gstin || "";
        const orgAddress = orgInfo?.address || "";
        const orgPhone = orgInfo?.organizationPhoneNo || "";

        const clientData: any = clientDataDoc?.clientData || {};

        const pdfDoc = await PDFDocument.create();
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const normalFont = await pdfDoc.embedFont(StandardFonts.Helvetica);


        // START OF FIRST PAGE OLD VERSION

        // // === PAGE 1: Company + Client Info + Project Details === //
        const detailsPage = pdfDoc.addPage();
        const { width, height } = detailsPage.getSize();
        let yPosition = height - 50;


        // // Draw Company Logo and Name horizontally centered
        // // --- HEADER SECTION ---
        try {
            // Use the specific company logo if available, or fall back to a default
            // const logoUrl = orgInfo.companyLogo || COMPANY_LOGO; 
            const logoUrl = COMPANY_LOGO;

            const logoRes = await fetch(logoUrl);
            const logoBuffer = await logoRes.arrayBuffer();
            const logoImage = await pdfDoc.embedJpg(logoBuffer);

            const logoScale = 0.4;
            const logoDims = logoImage.scale(logoScale);

            const brandText = orgName; // 👈 Uses dynamic Org Name
            const brandFontSize = 22;
            const brandTextWidth = boldFont.widthOfTextAtSize(brandText, brandFontSize);

            const spacing = 15;
            const totalWidth = logoDims.width + spacing + brandTextWidth;
            const combinedX = (width - totalWidth) / 2;

            // Draw Logo
            detailsPage.drawImage(logoImage, {
                x: combinedX,
                y: yPosition - logoDims.height,
                width: logoDims.width,
                height: logoDims.height,
            });

            // Draw Organization Name
            detailsPage.drawText(brandText, {
                x: combinedX + logoDims.width + spacing,
                y: yPosition - (logoDims.height / 2) - (brandFontSize / 4),
                size: brandFontSize,
                font: boldFont,
                color: PRIMARY_COLOR,
            });

            yPosition -= (logoDims.height + 10);

        } catch (err) {
            // Fallback if logo fetch fails
            const brandFontSize = 22;
            const textWidth = boldFont.widthOfTextAtSize(orgName, brandFontSize);
            detailsPage.drawText(orgName, {
                x: (width - textWidth) / 2,
                y: yPosition,
                size: brandFontSize,
                font: boldFont,
                color: PRIMARY_COLOR,
            });
            yPosition -= 30;
        }

        // Draw Line
        detailsPage.drawLine({
            start: { x: 50, y: yPosition },
            end: { x: width - 50, y: yPosition },
            thickness: 1,
            color: LINE_COLOR,
        });

        const rightColX = width / 2 + 20;
        const labelFontSize = 9;
        const leftColX = 50;
        const detailFontSize = 9;
        const TEXT_COLOR = rgb(0, 0, 0);
        const MUTED_COLOR = rgb(0.5, 0.5, 0.5);

        // --- 2. ORGANIZATION INFO BLOCK (Left Aligned) ---
        yPosition -= 25;

        // Draw GSTIN (Top line, left side)
        if (orgGstin) {
            detailsPage.drawText(`GSTIN: ${orgGstin}`, {
                x: leftColX,
                y: yPosition,
                size: detailFontSize,
                font: boldFont,
                color: TEXT_COLOR,
            });
            yPosition -= 16;
        }

        // Draw Phone Number
        if (orgPhone) {
            const phoneLabel = "Phone: ";
            const phoneLabelWidth = boldFont.widthOfTextAtSize(phoneLabel, detailFontSize);

            // We establish this as our vertical alignment "anchor" for the address too
            const valueStartX = leftColX + phoneLabelWidth;

            detailsPage.drawText(phoneLabel, {
                x: leftColX,
                y: yPosition,
                size: detailFontSize,
                font: boldFont,
                color: TEXT_COLOR,
            });

            detailsPage.drawText(orgPhone, {
                x: valueStartX,
                y: yPosition,
                size: detailFontSize,
                font: normalFont,
                color: MUTED_COLOR,
            });

            yPosition -= 14;

            // --- Draw Address (Anchored to the same level as Phone) ---
            if (orgAddress) {
                const addrLabel = "Address: ";
                const addrLabelWidth = boldFont.widthOfTextAtSize(addrLabel, detailFontSize);

                // We use a fixed width to ensure it doesn't cross the middle of the page
                const availableAddrWidth = (width / 2) - valueStartX;
                const wrappedAddr = wrapText(orgAddress, availableAddrWidth, normalFont, detailFontSize);

                wrappedAddr.forEach((line, idx) => {
                    if (idx === 0) {
                        // Label starts at the far left
                        detailsPage.drawText(addrLabel, {
                            x: leftColX,
                            y: yPosition,
                            size: detailFontSize,
                            font: boldFont,
                            color: TEXT_COLOR
                        });
                        // Value starts at the same level as the Phone value
                        detailsPage.drawText(line, {
                            x: valueStartX + 10,
                            y: yPosition,
                            size: detailFontSize,
                            font: normalFont,
                            color: MUTED_COLOR
                        });
                    } else {
                        // Indented lines start at the same valueStartX level
                        detailsPage.drawText(line, {
                            x: valueStartX + 10,
                            y: yPosition,
                            size: detailFontSize,
                            font: normalFont,
                            color: MUTED_COLOR
                        });
                    }
                    yPosition -= 12;
                });
            }
        }

        // Reset Y for the Client/Project sections below
        yPosition -= 40;

        // --- 3. DUAL COLUMN LAYOUT (Client vs Project) ---
        const sectionTitleSize = 14;
        const columnTopY = yPosition;

        // --- LEFT COLUMN: CLIENT INFORMATION ---
        detailsPage.drawText("CLIENT INFORMATION", {
            x: leftColX,
            y: yPosition,
            size: sectionTitleSize,
            font: boldFont,
            color: PRIMARY_COLOR,
        });

        let clientY = yPosition - 30;
        const columnWidth = (width / 2) - leftColX - 20;

        const drawElegantDetail = (page: any, label: string, value: string, x: number, y: number) => {
            // page.drawText(label.toUpperCase(), { x, y, size: labelFontSize, font: boldFont, color: MUTED_COLOR });
            // page.drawText(value || "-", { x, y: y - 15, size: detailFontSize + 1, font: normalFont, color: TEXT_COLOR });
            // return y - 45;

            // 1. Draw the Label in muted caps
            page.drawText(label.toUpperCase(), {
                x,
                y,
                size: labelFontSize,
                font: boldFont,
                color: MUTED_COLOR
            });

            const textValue = value || "-";
            const valueYStart = y - 15;

            // 2. Wrap the value text based on the column width
            // We use detailFontSize + 1 to match your current styling
            const wrappedLines = wrapText(textValue, columnWidth, normalFont, detailFontSize + 1);

            // 3. Draw each line of the wrapped text
            wrappedLines.forEach((line, index) => {
                page.drawText(line, {
                    x,
                    y: valueYStart - (index * (detailFontSize + 5)), // Spacing between lines
                    size: detailFontSize + 1,
                    font: normalFont,
                    color: TEXT_COLOR
                });
            });

            // 4. Return the new Y position dynamically
            // This ensures the next label starts after all lines of the previous value
            const totalValueHeight = wrappedLines.length * (detailFontSize + 5);
            return valueYStart - totalValueHeight - 20; // 20 is the gap between sections
        };

        clientY = drawElegantDetail(detailsPage, "Client Name", clientData.clientName, leftColX, clientY);
        clientY = drawElegantDetail(detailsPage, "Email Address", clientData.email, leftColX, clientY);
        clientY = drawElegantDetail(detailsPage, "Contact Number", clientData.whatsapp, leftColX, clientY);
        clientY = drawElegantDetail(detailsPage, "Site Location", clientData.location, leftColX, clientY);

        // --- RIGHT COLUMN: PROJECT INFORMATION ---
        yPosition = columnTopY; // Reset Y to top of section for the right column

        detailsPage.drawText("PROJECT DETAILS", {
            x: rightColX,
            y: yPosition,
            size: sectionTitleSize,
            font: boldFont,
            color: PRIMARY_COLOR,
        });

        let projectY = yPosition - 30;

        projectY = drawElegantDetail(detailsPage, "Project Name", projectData?.projectName || "-", rightColX, projectY);
        projectY = drawElegantDetail(detailsPage, "Quotation Number", newVariant.quoteNo, rightColX, projectY);
        projectY = drawElegantDetail(detailsPage, "Date of Issue", new Date().toLocaleDateString('en-IN'), rightColX, projectY);
        // if (newVariant?.brandName) {
        //     projectY = drawElegantDetail(detailsPage, "Material Brand", newVariant.brandName, rightColX, projectY);
        // }

        // --- 4. DECORATIVE DIVIDER ---
        // Draw a vertical line to separate Client and Project sections elegantly
        const lineBottom = Math.min(clientY, projectY);
        detailsPage.drawLine({
            start: { x: width / 2, y: columnTopY },
            end: { x: width / 2, y: lineBottom + 20 },
            thickness: 0.5,
            color: rgb(0.8, 0.8, 0.8),
        });

        yPosition = lineBottom - 50;
        //  END OF FIRST PAGE NEW VERSION



        // --- 3. PAGE 2: WORK ESTIMATION TABLE ---
        let tablePage = pdfDoc.addPage();
        let currentY = height - 50;

        const works = newVariant?.sqftRateWork || [];

        const drawTableHeader = (page: PDFPage, y: number) => {
            page.drawRectangle({
                x: 50,
                y: y - 20,
                width: width - 100,
                height: 25,
                color: TABLE_HEADER_BG_COLOR,
            });
            page.drawText("WORK TYPE", { x: 60, y: y - 13, size: 10, font: boldFont, color: TABLE_HEADER_TEXT_COLOR });
            page.drawText("AMOUNT", { x: width - 150, y: y - 13, size: 10, font: boldFont, color: TABLE_HEADER_TEXT_COLOR });
            return y - 45;
        };

        currentY = drawTableHeader(tablePage, currentY);


        // --- 4. DRAWING WORK ROWS ---
        for (const work of works) {
            // Check for Page Break
            if (currentY < 100) {
                tablePage = pdfDoc.addPage();
                currentY = drawTableHeader(tablePage, height - 50);
            }

            const workName = work.workType || "General Work";
            const amount = `Rs: ${Number(work.totalCost || 0).toLocaleString('en-IN')}`;

            // Wrap Text for long work names
            const wrappedWorkName = wrapText(workName, width - 250, normalFont, 11);

            wrappedWorkName.forEach((line, idx) => {
                // drawTextOrBlur(tablePage, line, 60, currentY, 11, idx === 0 ? boldFont : normalFont, TEXT_COLOR);
                // Call the reusable helper
                drawTextOrBlur({
                    page: tablePage,
                    text: line,
                    x: 60,
                    y: currentY,
                    fontSize: 11,
                    font: idx === 0 ? boldFont : normalFont,
                    isBlurred: isBlurred, // Passed from your controller arguments
                    isRightAligned: false
                });
                if (idx === 0) {
                    // drawTextOrBlur(tablePage, amount, width - 60, currentY, 11, boldFont, TEXT_COLOR, true);
                    drawTextOrBlur({
                        page: tablePage,
                        text: amount,
                        x: width - 60,
                        y: currentY,
                        fontSize: 11,
                        font: boldFont,
                        isBlurred: isBlurred,
                        isRightAligned: true,
                        maskWidth: 70 // You can customize the box size per call
                    });
                }
                currentY -= 18;
            });

            // Draw thin divider line
            tablePage.drawLine({
                start: { x: 50, y: currentY },
                end: { x: width - 50, y: currentY },
                thickness: 0.5,
                color: rgb(0.9, 0.9, 0.9),
            });
            currentY -= 20;
        }

        // --- 5. GRAND TOTAL SECTION ---
        if (currentY < 120) {
            tablePage = pdfDoc.addPage();
            currentY = height - 100;
        }

        currentY -= 20;
        const grandTotalText = `GRAND TOTAL Rs: ${Number(newVariant.grandTotal || 0).toLocaleString('en-IN')}`;

        tablePage.drawRectangle({
            x: width - 260,
            y: currentY - 10,
            width: 210,
            height: 35,
            color: PRIMARY_COLOR,
            opacity: 0.1,
        });

        // 2. Use the reusable helper for the text/mask
        drawTextOrBlur({
            page: tablePage,
            text: grandTotalText,
            x: width - 60,
            y: currentY + 5,
            fontSize: 14,
            font: boldFont,
            color: PRIMARY_COLOR,
            isBlurred: isBlurred,
            isRightAligned: true,
            maskWidth: 150 // Increased width to cover the longer "Grand Total" label + amount
        });



        const termsPage = pdfDoc.addPage();
        const { width: pageWidth, height: pageHeight } = termsPage.getSize();
        let termsY = pageHeight - 50;

        // Header: Terms and Conditions
        const termsTitle = "Terms and Conditions";
        const termsTitleWidth = boldFont.widthOfTextAtSize(termsTitle, 18);
        termsPage.drawText(termsTitle, {
            x: (pageWidth - termsTitleWidth) / 2,
            y: termsY,
            size: 18,
            font: boldFont,
            color: rgb(0, 0, 0),
        });
        termsY -= 15;

        // Horizontal Divider
        termsPage.drawLine({
            start: { x: 50, y: termsY },
            end: { x: pageWidth - 50, y: termsY },
            thickness: 1,
            color: rgb(0.8, 0.8, 0.8),
        });
        termsY -= 30;

        // Sub-header: VERTICAL LIVING – PAYMENT TERMS

        const subHeader = `${orgName} – PAYMENT TERMS`;
        termsPage.drawText(subHeader, {
            x: 50,
            y: termsY,
            size: 12,
            font: boldFont,
            color: rgb(0, 0, 0),
        });
        termsY -= 25;

        // --- PAYMENT MILESTONE TABLE ---
        const milestoneHeaders = ["Milestone", "Amount / Percentage", "Work Included"];
        const milestoneColWidths = [140, 130, 240];
        let tableX = 50;

        // Draw Table Headers
        milestoneHeaders.forEach((header, idx) => {
            termsPage.drawText(header, {
                x: tableX,
                y: termsY,
                size: 10,
                font: boldFont,
                color: rgb(0, 0, 0),
            });
            tableX += milestoneColWidths[idx];
        });
        termsY -= 20;

        const milestones = [
            { m: "Booking Advance", a: "INR 10,000 (fixed)", w: "Site visit, client discussion, proposal drafting" },
            { m: "Design Approval & Site Measurement", a: "INR 15,000 (fixed)", w: "2D/3D design finalization, site measurement, BOQ preparation" },
            { m: "Material Procurement & Site Start", a: "80% of total project", w: "Material purchase, delivery, fabrication, and/or civil work initiation" },
            { m: "Execution Completion", a: "10% of total project", w: "Modular/civil work installation, finishing, painting, electrical/plumbing (if any)" },
            { m: "Final Handover Payment", a: "10% of total project", w: "Snag list closure, cleaning, documentation, and final handover" }
        ];

        milestones.forEach((item) => {
            let milestoneX = 50;

            // Draw Bullet/Icon (Blue diamond as seen in image)
            // termsPage.drawText("◆", { x: milestoneX - 15, y: termsY, size: 10, color: rgb(0.1, 0.4, 0.9) });

            termsPage.drawRectangle({
                x: milestoneX - 18,
                y: termsY - 2,
                width: 5,
                height: 5,
                color: rgb(0.1, 0.4, 0.9),
                rotate: degrees(45), // Rotates square into a diamond shape
            });

            // Milestone Name
            const mLines = wrapText(item.m, milestoneColWidths[0] - 10, boldFont, 9);
            // Amount
            const aLines = wrapText(item.a, milestoneColWidths[1] - 10, boldFont, 9);
            // Work Included
            const wLines = wrapText(item.w, milestoneColWidths[2] - 10, normalFont, 9);

            const maxRowLines = Math.max(mLines.length, aLines.length, wLines.length);

            mLines.forEach((line, i) => termsPage.drawText(line, { x: milestoneX, y: termsY - (i * 12), size: 9, font: boldFont }));
            milestoneX += milestoneColWidths[0];

            aLines.forEach((line, i) => termsPage.drawText(line, { x: milestoneX, y: termsY - (i * 12), size: 9, font: boldFont }));
            milestoneX += milestoneColWidths[1];

            wLines.forEach((line, i) => termsPage.drawText(line, { x: milestoneX, y: termsY - (i * 12), size: 9, font: normalFont }));

            termsY -= (maxRowLines * 12) + 10;
        });

        termsY -= 10;
        termsPage.drawLine({ start: { x: 50, y: termsY }, end: { x: pageWidth - 50, y: termsY }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
        termsY -= 30;

        // --- PAYMENT TERMS AND CONDITIONS LIST ---
        termsPage.drawText("Payment Terms and Conditions.", { x: 50, y: termsY, size: 12, font: boldFont });
        termsY -= 20;

        const conditions = [
            { label: "Delayed Payments:", text: "Interest of 2% per month applies if payment is overdue beyond 5 working days" },
            { label: "GST:", text: "Will be added as applicable by law and shown on invoices" },
            { label: "Forfeiture Clause:", text: "If the next milestone payment is not processed within 7 working days of intimation, the previous fixed payments INR (10,000 + 15,000) shall stand forfeited. Vertical Living reserves the right to cancel or suspend the project without refund or liability for any damages caused due to non-compliance." },
            { label: "Legal Validity:", text: "Acceptance via digital signature, physical signature, or email is enforceable under the Information Technology Act, 2000" }
        ];

        conditions.forEach((cond) => {
            // Keep bullet at x: 50
            termsPage.drawRectangle({
                x: 50,
                y: termsY + 2,
                width: 3,
                height: 3,
                color: rgb(0, 0, 0),
            });

            const textStartX = 65;
            const fontSize = 9;

            // ⭐ FIX: Calculate width by subtracting the start position AND a right margin (e.g., 50)
            // This ensures the text wraps before hitting the right edge of the page.
            const availableWidth = pageWidth - textStartX - 50;

            const labelWithSpace = cond.label + " ";
            const labelWidth = boldFont.widthOfTextAtSize(labelWithSpace, fontSize);
            const fullLineText = labelWithSpace + cond.text;

            // Wrap the text using the corrected availableWidth
            const wrappedLines = wrapText(fullLineText, availableWidth, normalFont, fontSize);

            wrappedLines.forEach((line, idx) => {
                if (idx === 0) {
                    // Draw Bold Label
                    termsPage.drawText(cond.label, { x: textStartX, y: termsY, size: fontSize, font: boldFont });

                    // Draw the rest of the first line starting immediately after the label
                    // line.substring(cond.label.length) handles the offset correctly
                    termsPage.drawText(line.substring(cond.label.length), {
                        x: textStartX + labelWidth,
                        y: termsY,
                        size: fontSize,
                        font: normalFont
                    });
                } else {
                    // For lines 2, 3, etc., align perfectly under the start of the first line
                    termsPage.drawText(line, { x: textStartX, y: termsY, size: fontSize, font: normalFont });
                }
                termsY -= 12; // Line spacing
            });

            termsY -= 8; // Space between different bullet points
        });

        // --- SIGNATURE SECTION ---
        // We use a fixed position from the bottom of the page (e.g., 80 units up)
        const bottomY = 80;

        termsPage.drawText("MANAGING DIRECTOR", {
            x: 50,           // Align with your table and bullet points
            y: bottomY,
            size: 12,        // Slightly larger for the footer
            font: boldFont,
            color: rgb(0, 0, 0),
        });


        // --- 6. FINAL GENERATION & UPLOAD ---



        const pdfBytes = await pdfDoc.save();
        const fileName = `home-interior-quote-${newVariant.quoteNo}-${Date.now()}.pdf`;

        const uploadResult = await uploadToS3(pdfBytes, fileName);

        const finalDoc = await QuoteVarientGenerateModel.findByIdAndUpdate(
            newVariant._id,
            // {
            //     pdfLink: {
            //         type: "pdf",
            //         url: uploadResult.Location,
            //         originalName: fileName,
            //         uploadedAt: new Date(),
            //     },
            // },
            {
                $push: {
                    pdfType: {
                        // Change 'template' to 'templateType' to match your schema
                        templateType: templateType,
                        pdf: {
                            type: "pdf",
                            url: uploadResult.Location,
                            originalName: fileName,
                            uploadedAt: new Date(),
                        }
                    }
                }
            },
            { new: true }
        );

        return {
            success: true,
            fileUrl: uploadResult.Location,
            fileName,
            updatedDoc: finalDoc,
        };
    }
    catch (err: any) {
        console.error("PDF generation error:", err);
        throw new Error("Failed to generate sqft rate variant quote PDF.");
    }
}