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