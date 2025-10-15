import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import MaterialInventoryCartModel from "../../models/Material Inventory Model/materialInventoryCart.model";
import { COMPANY_LOGO, uploadToS3 } from "../stage controllers/ordering material controller/pdfOrderHistory.controller";
import ProjectModel from "../../models/project model/project.model";
import { RequirementFormModel } from "../../models/Stage Models/requirment model/mainRequirementNew.model";
import { HerbertTokenizer } from "@xenova/transformers";

const FONT_SIZE = 12;
const HEADER_FONT_SIZE = 18;
const SECTION_SPACE = 30;
const TABLE_HEADER_BG_COLOR = rgb(0.2, 0.4, 0.6); // Dark blue background for headers
const TABLE_HEADER_TEXT_COLOR = rgb(1, 1, 1); // White text for headers


export const generateMaterialInventoryCartPdf = async ({
    id,
    projectId,
}: {
    id: string;
    projectId: string;
}) => {
    try {
        const material = await MaterialInventoryCartModel.findById(id)

        if (!material) {
            return {
                success: false,
                fileUrl: "",
                fileName: "",
                updatedDoc: "",
            }
        }

        const [projectData, clientDataDoc] = await Promise.all([
            ProjectModel.findById(projectId).populate("organizationId"),
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
        drawSectionHeader("Delivery Details");
        drawRow("Location", clientData.location || "-", true);

        yPosition -= 15;




        // Project Details Section
        drawSectionHeader("Project Details");
        drawRow("Project Name", projectData?.projectName || "-", true);
        drawRow("Contact No", (projectData?.organizationId as any)?.organizationPhoneNo || "-", true);
        // drawRow("Date", new Date().toLocaleDateString(), true);

        // Format date as dd/mm/yyyy
        const today = new Date();
        const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
        drawRow("Date", formattedDate, true);


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

        // === ITEMS TABLE PAGES === //
        // let currentPage = pdfDoc.addPage();
        // yPosition = currentPage.getHeight() - 50;

        // === ITEMS TABLE - CONTINUE ON SAME PAGE IF SPACE AVAILABLE === //
        let currentPage = detailsPage; // Use the same page as project details
        // Check if there's enough space on current page, otherwise create new page
        if (yPosition < 200) { // If less than 200 units space left
            currentPage = pdfDoc.addPage();
            yPosition = currentPage.getHeight() - 50;
        }

        // const ensureSpace = (minHeight: number) => {
        //     if (yPosition < minHeight) {
        //         currentPage = pdfDoc.addPage();
        //         yPosition = currentPage.getHeight() - 50;
        //     }
        // };

        const ensureSpace = (minHeight: number) => {
            if (yPosition < minHeight) {
                currentPage = pdfDoc.addPage();
                yPosition = currentPage.getHeight() - 50;
                return true; // Return true if new page was created
            }
            return false; // Return false if no new page needed
        };

        // Helper function to calculate text lines
        const calculateTextLines = (text: string, maxWidth: number, font: any, size: number): number => {
            const textStr = String(text); // Convert to string first
            if (font.widthOfTextAtSize(textStr, size) <= maxWidth) {
                return 1;
            }

            let lines = 1;
            let currentLine = '';

            for (let i = 0; i < textStr.length; i++) {
                const char = textStr[i];
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

        // Helper function to draw multi-line text
        // const drawMultiLineText = (text: string, x: number, y: number, maxWidth: number, font: any, size: number, color = rgb(0, 0, 0)) => {
        //     const textStr = String(text); // Convert to string first
        //     const lineHeight = size * 1.2;
        //     let currentY = y;
        //     let currentLine = '';

        //     for (let i = 0; i < textStr.length; i++) {
        //         const char = textStr[i];
        //         const testLine = currentLine + char;
        //         const testWidth = font.widthOfTextAtSize(testLine, size);

        //         if (testWidth <= maxWidth) {
        //             currentLine = testLine;
        //         } else {
        //             // Draw current line
        //             currentPage.drawText(currentLine, {
        //                 x: x,
        //                 y: currentY,
        //                 font: font,
        //                 size: size,
        //                 color: color,
        //             });
        //             currentLine = char;
        //             currentY -= lineHeight;
        //         }
        //     }

        //     // Draw remaining text
        //     if (currentLine) {
        //         currentPage.drawText(currentLine, {
        //             x: x,
        //             y: currentY,
        //             font: font,
        //             size: size,
        //             color: color,
        //         });
        //     }

        //     return Math.max(1, Math.ceil((y - currentY) / lineHeight));
        // };

        // Helper function to draw multi-line text with proper vertical centering
        const drawMultiLineText = (text: string, x: number, y: number, maxWidth: number, font: any, size: number, color = rgb(0, 0, 0)) => {
            const textStr = String(text);
            const lineHeight = size * 1.2;
            let currentY = y;
            let currentLine = '';

            // First, break text into lines
            const lines: string[] = [];

            for (let i = 0; i < textStr.length; i++) {
                const char = textStr[i];
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

            // Draw lines from top to bottom
            const totalHeight = lines.length * lineHeight;
            const startY = y + (lineHeight / 2); // Start slightly lower to center better

            for (let i = 0; i < lines.length; i++) {
                currentPage.drawText(lines[i], {
                    x: x,
                    y: startY - (i * lineHeight),
                    font: font,
                    size: size,
                    color: color,
                });
            }

            return lines.length;
        };

        // Updated helper function to draw centered multi-line text vertically
        const drawCenteredMultiLineText = (text: string, x: number, columnWidth: number, rowTopY: number, rowHeight: number, font: any, size: number, color = rgb(0, 0, 0)) => {
            const textStr = String(text);
            const lineHeight = size * 1.2;
            const maxWidth = columnWidth - 10; // 5px padding on each side

            // First, break text into lines
            const lines: string[] = [];
            let currentLine = '';

            for (let i = 0; i < textStr.length; i++) {
                const char = textStr[i];
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

            // Calculate vertical position for perfect centering
            const totalTextHeight = lines.length * lineHeight;
            const startY = rowTopY - (rowHeight - totalTextHeight) / 2 - (lineHeight * 0.3); // Adjusted for better visual centering

            // Draw each line
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const lineWidth = font.widthOfTextAtSize(line, size);
                const xPos = x + (columnWidth - lineWidth) / 2; // Center horizontally

                currentPage.drawText(line, {
                    x: xPos,
                    y: startY - (i * lineHeight),
                    font: font,
                    size: size,
                    color: color,
                });
            }

            return lines.length;
        };

        // Helper function to draw centered text
        const drawCenteredText = (text: string, x: number, width: number, y: number, font: any, size: number, color = rgb(0, 0, 0)) => {
            const textWidth = font.widthOfTextAtSize(text, size);
            currentPage.drawText(text, {
                x: x + (width - textWidth) / 2,
                y: y,
                font: font,
                size: size,
                color: color,
            });
        };

        // Main function to draw items table
        const drawItemsTable = async (items: any[]) => {
            const headers = ["S.No", "Image", "Item Code", "Brand", "Model", "Watt", "Color", "Quantity"];
            // const columnWidths = [40, 60, 80, 80, 80, 60, 60]; // Adjusted widths
            const columnWidths = [40, 60, 80, 70, 80, 40, 60, 70]; // Added 60 for Color column

            const headerHeight = 25;
            const baseRowHeight = 35; // Increased base height for images
            const lineHeight = FONT_SIZE * 1.2;
            const startX = 50;
            const tableWidth = width - 100;

            // Draw header
            ensureSpace(headerHeight + 50);

            currentPage.drawRectangle({
                x: startX,
                y: yPosition - headerHeight + 5,
                width: tableWidth,
                height: headerHeight,
                color: TABLE_HEADER_BG_COLOR,
            });

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

            // yPosition -= headerHeight + 5;
            // yPosition -= headerHeight;

            // ⭐⭐ FIX: Position the first row directly below the header ⭐⭐
            yPosition = yPosition - headerHeight + 5; // This puts the first row right below the header


            // Draw rows
            for (let index = 0; index < items.length; index++) {
                const item = items[index];
                const specification = item.specification || {};

                // Calculate required row height
                let rowHeight = baseRowHeight;
                const maxLines = Math.max(
                    calculateTextLines(String(specification.brand || "-"), columnWidths[3] - 10, normalFont, FONT_SIZE),
                    calculateTextLines(String(specification.model || "-"), columnWidths[4] - 10, normalFont, FONT_SIZE),
                    calculateTextLines(String(specification.itemCode || "-"), columnWidths[2] - 10, normalFont, FONT_SIZE),
                    calculateTextLines(String(specification?.color || "-"), columnWidths[6] - 10, normalFont, FONT_SIZE)
                );

                rowHeight = Math.max(rowHeight, baseRowHeight + (maxLines - 1) * lineHeight);

                ensureSpace(rowHeight + 20);

                xPos = startX;
                const rowYPosition = yPosition;

                // ⭐⭐ ADD LEFT BORDER FOR THIS ROW ⭐⭐
                currentPage.drawLine({
                    start: { x: startX, y: yPosition },
                    end: { x: startX, y: yPosition - rowHeight },
                    thickness: 1,
                    color: TABLE_HEADER_BG_COLOR,
                });

                // S.No
                drawCenteredText(String(index + 1), xPos, columnWidths[0], rowYPosition - rowHeight / 2, normalFont, FONT_SIZE);
                xPos += columnWidths[0];

                // Image - Fixed size display
                const imageUrl = specification.image || (item.productId?.image || "");
                if (imageUrl) {
                    try {
                        const imageRes = await fetch(imageUrl);
                        if (imageRes.ok) {
                            const imageBuffer = await imageRes.arrayBuffer();
                            try {
                                const image = await pdfDoc.embedPng(imageBuffer);
                                const fixedSize = 25; // Fixed size for all images
                                const scale = Math.min(fixedSize / image.width, fixedSize / image.height);
                                const imageDims = { width: image.width * scale, height: image.height * scale };

                                const imageX = xPos + (columnWidths[1] - imageDims.width) / 2;
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
                                    const fixedSize = 25;
                                    const scale = Math.min(fixedSize / image.width, fixedSize / image.height);
                                    const imageDims = { width: image.width * scale, height: image.height * scale };

                                    const imageX = xPos + (columnWidths[1] - imageDims.width) / 2;
                                    const imageY = rowYPosition - rowHeight / 2 - imageDims.height / 2;

                                    currentPage.drawImage(image, {
                                        x: imageX,
                                        y: imageY,
                                        width: imageDims.width,
                                        height: imageDims.height,
                                    });
                                } catch (e) {
                                    drawCenteredText("Invalid", xPos, columnWidths[1], rowYPosition - 15, normalFont, FONT_SIZE - 2);
                                    // drawCenteredText("Invalid", xPos, columnWidths[1], rowYPosition - rowHeight/2, normalFont, FONT_SIZE - 2);
                                }
                            }
                        } else {
                            drawCenteredText("No Image", xPos, columnWidths[1], rowYPosition - 15, normalFont, FONT_SIZE - 2);
                            //   drawCenteredText("No Image", xPos, columnWidths[1], rowYPosition - rowHeight/2, normalFont, FONT_SIZE - 2);
                        }
                    } catch (error) {
                        drawCenteredText("No Image", xPos, columnWidths[1], rowYPosition - 15, normalFont, FONT_SIZE - 2);
                        //   drawCenteredText("No Image", xPos, columnWidths[1], rowYPosition - rowHeight/2, normalFont, FONT_SIZE - 2);

                    }
                } else {
                    drawCenteredText("No Image", xPos, columnWidths[1], rowYPosition - 15, normalFont, FONT_SIZE - 2);
                    //   drawCenteredText("No Image", xPos, columnWidths[1], rowYPosition - rowHeight/2, normalFont, FONT_SIZE - 2);

                }
                xPos += columnWidths[1];

                // // Item Code (multi-line)
                // const itemCode = String(specification.itemCode || "-");
                // drawMultiLineText(itemCode, xPos + 5, rowYPosition - 10, columnWidths[2] - 10, normalFont, FONT_SIZE);
                // xPos += columnWidths[2];

                // // Brand (multi-line)
                // const brand = String(specification.brand || "-");
                // drawMultiLineText(brand, xPos + 5, rowYPosition - 10, columnWidths[3] - 10, normalFont, FONT_SIZE);
                // xPos += columnWidths[3];

                // // Model (multi-line)
                // const model = String(specification.model || "-");
                // drawMultiLineText(model, xPos + 5, rowYPosition - 10, columnWidths[4] - 10, normalFont, FONT_SIZE);
                // xPos += columnWidths[4];


                // Item Code (multi-line) - Center vertically
                const itemCode = String(specification.itemCode || "-");
                const itemCodeLines = calculateTextLines(itemCode, columnWidths[2] - 10, normalFont, FONT_SIZE);
                const itemCodeY = rowYPosition - (rowHeight - (itemCodeLines * lineHeight)) / 2;
                // drawMultiLineText(itemCode, xPos + 5, itemCodeY, columnWidths[2] - 10, normalFont, FONT_SIZE);
                drawCenteredMultiLineText(itemCode, xPos, columnWidths[2], rowYPosition, rowHeight, normalFont, FONT_SIZE);
                xPos += columnWidths[2];

                // Brand (multi-line) - Center vertically
                const brand = String(specification.brand || "-");
                const brandLines = calculateTextLines(brand, columnWidths[3] - 10, normalFont, FONT_SIZE);
                const brandY = rowYPosition - (rowHeight - (brandLines * lineHeight)) / 2;
                // drawMultiLineText(brand, xPos + 5, brandY, columnWidths[3] - 10, normalFont, FONT_SIZE);
                drawCenteredMultiLineText(brand, xPos, columnWidths[3], rowYPosition, rowHeight, normalFont, FONT_SIZE);
                xPos += columnWidths[3];

                // Model (multi-line) - Center vertically
                const model = String(specification.model || "-");
                const modelLines = calculateTextLines(model, columnWidths[4] - 10, normalFont, FONT_SIZE);
                const modelY = rowYPosition - (rowHeight - (modelLines * lineHeight)) / 2;
                // drawMultiLineText(model, xPos + 5, modelY, columnWidths[4] - 10, normalFont, FONT_SIZE);
                drawCenteredMultiLineText(model, xPos, columnWidths[4], rowYPosition, rowHeight, normalFont, FONT_SIZE);
                xPos += columnWidths[4];

                // Watt
                const watt = String(specification.watt || "-");
                drawCenteredText(watt, xPos, columnWidths[5], rowYPosition - rowHeight / 2, normalFont, FONT_SIZE);
                xPos += columnWidths[5];


                // ⭐⭐ NEW: Color column - Center vertically ⭐⭐
                const color = String(specification.color || specification.colour || "-");
                const colorLines = calculateTextLines(color, columnWidths[6] - 10, normalFont, FONT_SIZE);
                const colorY = rowYPosition - (rowHeight - (colorLines * lineHeight)) / 2;
                // drawMultiLineText(color, xPos + 5, colorY, columnWidths[6] - 10, normalFont, FONT_SIZE);
                drawCenteredMultiLineText(color, xPos, columnWidths[6], rowYPosition, rowHeight, normalFont, FONT_SIZE);
                xPos += columnWidths[6];

                // Quantity
                const quantity = String(item.quantity || 0);
                drawCenteredText(quantity, xPos, columnWidths[7], rowYPosition - rowHeight / 2, normalFont, FONT_SIZE);

                // Draw borders
                currentPage.drawLine({
                    start: { x: startX, y: yPosition - rowHeight },
                    end: { x: startX + tableWidth, y: yPosition - rowHeight },
                    thickness: 1,
                    color: TABLE_HEADER_BG_COLOR,
                });

                // Draw vertical borders
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

                // Right border
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

        // Draw items table header
        ensureSpace(100);
        currentPage.drawText("Material Order Items", {
            x: 50,
            y: yPosition,
            font: boldFont,
            size: 16,
            color: rgb(0.1, 0.3, 0.5),
        });
        yPosition -= 30;

        // Draw the items table
        await drawItemsTable(material.items || []);

        // === TOTAL COST ===
        // ensureSpace(50);
        // const totalCostText = `TOTAL COST Rs: ${material.totalCost.toLocaleString("en-in")}`;
        // const totalCostWidth = boldFont.widthOfTextAtSize(totalCostText, 14);
        // currentPage.drawText(`TOTAL COST Rs: ${material.totalCost.toLocaleString("en-in")}`, {
        //     // x: 50,
        //     x: width - totalCostWidth - 50, // Right aligned with 50px margin
        //     y: yPosition,
        //     font: boldFont,
        //     size: 14,
        //     color: rgb(0.1, 0.5, 0.1),
        // });

        
        // === SAVE + UPLOAD ===
        const pdfBytes = await pdfDoc.save();
        const projectName = projectData?.projectName ? projectData.projectName.replace(/\s+/g, '-') : ''; // Replace spaces with hyphens
        const fileName = projectData?.projectName ? `Material-Order-${projectName}-${Date.now()}.pdf` : `Material-Order-${Date.now()}.pdf`;

        const uploadResult = await uploadToS3(pdfBytes, fileName);

        const finalDoc = await MaterialInventoryCartModel.findByIdAndUpdate(
            id,
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
        throw new Error("Failed to generate material order PDF.");
    }
};



// we need to add the color also here, if the color property si not available or if the color property is available but the value is faly the you can you simply put it as "-"
// so how cna we do this 