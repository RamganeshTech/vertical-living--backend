import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { SelectedModularUnitNewModel } from "../../../models/Modular Units Models/Modular Unit New/SelectedModularUnitNew  Model/selectedUnitNew.model";
import { COMPANY_LOGO, uploadToS3 } from "../../stage controllers/ordering material controller/pdfOrderHistory.controller";
import mongoose from "mongoose";




// Constants for layout
const PAGE_WIDTH = 842; // Increased width for more columns
const PAGE_HEIGHT = 595; // Landscape orientation
const MARGIN = 30;
const TABLE_START_Y = PAGE_HEIGHT - 120;
const ROW_HEIGHT = 60;
const IMAGE_SIZE = 40;

// Column widths (adjust as needed)
const COLUMN_WIDTHS = {
    sNo: 30,
    image: 50,
    image2D: 50,
    image3D: 50,
    serialNo: 60,
    productName: 80,
    dimensions: 80,
    quantity: 50,
    unitCost: 60,
    totalCost: 70
};


// Main PDF generation function
const generatePdfModularUnits = async (projectId: string, organizationId: string) => {
    try {
        // Fetch order history data
        const modularUnits = await SelectedModularUnitNewModel.findOne({ projectId })
            .populate('projectId', 'projectName')


        if (!modularUnits) {
            throw new Error('Modular Units not found for the given project ID');
        }

        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        const { width, height } = page.getSize();


        // Load fonts
        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const smallFont = await pdfDoc.embedFont(StandardFonts.Helvetica);


        let yPosition = height - 20;


        try {
            const logoRes = await fetch(COMPANY_LOGO);
            const logoBuffer = await logoRes.arrayBuffer();
            const logoImage = await pdfDoc.embedJpg(logoBuffer);

            const logoScale = 0.4;
            const logoDims = logoImage.scale(logoScale);

            const brandText = "Vertical Living";
            const brandFontSize = 20;
            const brandColor = rgb(0.1, 0.4, 0.9);
            const brandTextWidth = boldFont.widthOfTextAtSize(brandText, brandFontSize);

            const spacing = 10; // space between logo and text

            // Total width = logo + spacing + text
            const totalWidth = logoDims.width + spacing + brandTextWidth;

            // X and Y to center the whole block horizontally and set a top margin
            const combinedX = (width - totalWidth) / 2;

            // Draw logo
            page.drawImage(logoImage, {
                x: combinedX,
                y: yPosition - logoDims.height,
                width: logoDims.width,
                height: logoDims.height,
            });

            // Align text vertically with logo (visually aligned mid-way)
            const textY = yPosition - (logoDims.height / 2) - (brandFontSize / 3);

            // Draw text next to logo
            page.drawText(brandText, {
                x: combinedX + logoDims.width + spacing,
                y: textY,
                size: brandFontSize,
                font: boldFont,
                color: brandColor,
            });

            // Update yPosition to be below the logo
            yPosition = yPosition - logoDims.height - 15;

            // Draw horizontal line
            page.drawLine({
                start: { x: MARGIN, y: yPosition },
                end: { x: width - MARGIN, y: yPosition },
                thickness: 1,
                color: rgb(0.6, 0.6, 0.6),
            });

            yPosition -= 25;
        } catch (err) {
            console.error("Failed to load company logo:", err);
        }


        // Project details
        if (modularUnits.projectId) {
            const projectText = `Project: ${(modularUnits.projectId as any).projectName}`;
            page.drawText(projectText, {
                x: MARGIN,
                y: yPosition,
                size: 14,
                font: boldFont,
                color: rgb(0.3, 0.3, 0.3),
            });

            const dateText = `Date: ${new Date().toLocaleDateString()}`;
            const dateTextWidth = regularFont.widthOfTextAtSize(dateText, 12);
            page.drawText(dateText, {
                x: width - MARGIN - dateTextWidth,
                y: yPosition,
                size: 12,
                font: regularFont,
                color: rgb(0.3, 0.3, 0.3),
            });

            yPosition -= 40;
        }

        // Draw table headers
        const drawTableHeaders = (currentPage: any, yPos: number) => {
            let xPosition = MARGIN;

            // Background for header
            currentPage.drawRectangle({
                x: xPosition,
                y: yPos - ROW_HEIGHT,
                width: width - (2 * MARGIN),
                height: ROW_HEIGHT,
                color: rgb(0.9, 0.9, 0.9),
            });

            // Header texts
            const headers = [
                { text: "S.No", width: COLUMN_WIDTHS.sNo },
                { text: "Image", width: COLUMN_WIDTHS.image },
                { text: "2D Image", width: COLUMN_WIDTHS.image2D },
                { text: "3D Image", width: COLUMN_WIDTHS.image3D },
                { text: "Serial No", width: COLUMN_WIDTHS.serialNo },
                { text: "Product Name", width: COLUMN_WIDTHS.productName },
                { text: "Dimensions", width: COLUMN_WIDTHS.dimensions },
                { text: "Qty", width: COLUMN_WIDTHS.quantity },
                { text: "Unit Cost", width: COLUMN_WIDTHS.unitCost },
                { text: "Total Cost", width: COLUMN_WIDTHS.totalCost }
            ];

            headers.forEach(header => {
                currentPage.drawText(header.text, {
                    x: xPosition + 5,
                    y: yPos - 20,
                    size: 10,
                    font: boldFont,
                    color: rgb(0, 0, 0),
                });
                xPosition += header.width;
            });

            return yPos - ROW_HEIGHT;
        };

        let currentY = drawTableHeaders(page, TABLE_START_Y);

        // Draw table rows
        // const drawTableRow = async (currentPage: any, unit: any, index: number, yPos: number) => {
        //     let xPosition = MARGIN;

        //     // Draw row background (alternating colors for better readability)
        //     const rowColor = index % 2 === 0 ? rgb(1, 1, 1) : rgb(0.95, 0.95, 0.95);
        //     currentPage.drawRectangle({
        //         x: xPosition,
        //         y: yPos - ROW_HEIGHT,
        //         width: width - (2 * MARGIN),
        //         height: ROW_HEIGHT,
        //         color: rowColor,
        //     });

        //     // S.No
        //     currentPage.drawText((index + 1).toString(), {
        //         x: xPosition + 10,
        //         y: yPos - 35,
        //         size: 9,
        //         font: regularFont,
        //         color: rgb(0, 0, 0),
        //     });
        //     xPosition += COLUMN_WIDTHS.sNo;

        //     // Helper function to draw images with error handling
        //     const drawImageInCell = async (imageUrl: string, x: number, y: number) => {
        //         if (!imageUrl) return false;

        //         try {
        //             const imageRes = await fetch(imageUrl);
        //             if (!imageRes.ok) throw new Error('Failed to fetch image');

        //             const imageBuffer = await imageRes.arrayBuffer();
        //             let image;

        //             // Check image type and embed accordingly
        //             if (imageUrl.toLowerCase().endsWith('.png')) {
        //                 image = await pdfDoc.embedPng(imageBuffer);
        //             } else {
        //                 image = await pdfDoc.embedJpg(imageBuffer);
        //             }

        //             const scale = IMAGE_SIZE / Math.max(image.height, 1);
        //             const scaledWidth = image.width * scale;
        //             const scaledHeight = image.height * scale;

        //             // Center image in cell
        //             const centerX = x + (COLUMN_WIDTHS.image - scaledWidth) / 2;
        //             const centerY = y - (ROW_HEIGHT - scaledHeight) / 2;

        //             currentPage.drawImage(image, {
        //                 x: centerX,
        //                 y: centerY,
        //                 width: scaledWidth,
        //                 height: scaledHeight,
        //             });
        //             return true;
        //         } catch (err) {
        //             console.warn(`Failed to load image: ${imageUrl}`, err);
        //             return false;
        //         }
        //     };

        //     // Main Image
        //     const mainImageUrl = unit.productImages?.[0]?.url;
        //     const mainImageDrawn = await drawImageInCell(mainImageUrl, xPosition, yPos - ROW_HEIGHT);
        //     if (!mainImageDrawn) {
        //         currentPage.drawText("N/A", {
        //             x: xPosition + (COLUMN_WIDTHS.image - 15) / 2,
        //             y: yPos - 35,
        //             size: 8,
        //             font: regularFont,
        //             color: rgb(0.5, 0.5, 0.5),
        //         });
        //     }
        //     xPosition += COLUMN_WIDTHS.image;

        //     // 2D Image
        //     const image2DUrl = unit["2dImages"]?.[0]?.url;
        //     const image2DDrawn = await drawImageInCell(image2DUrl, xPosition, yPos - ROW_HEIGHT);
        //     if (!image2DDrawn) {
        //         currentPage.drawText("N/A", {
        //             x: xPosition + (COLUMN_WIDTHS.image2D - 15) / 2,
        //             y: yPos - 35,
        //             size: 8,
        //             font: regularFont,
        //             color: rgb(0.5, 0.5, 0.5),
        //         });
        //     }
        //     xPosition += COLUMN_WIDTHS.image2D;

        //     // 3D Image
        //     const image3DUrl = unit["3dImages"]?.[0]?.url;
        //     const image3DDrawn = await drawImageInCell(image3DUrl, xPosition, yPos - ROW_HEIGHT);
        //     if (!image3DDrawn) {
        //         currentPage.drawText("N/A", {
        //             x: xPosition + (COLUMN_WIDTHS.image3D - 15) / 2,
        //             y: yPos - 35,
        //             size: 8,
        //             font: regularFont,
        //             color: rgb(0.5, 0.5, 0.5),
        //         });
        //     }
        //     xPosition += COLUMN_WIDTHS.image3D;

        //     // Serial No (with text wrapping)
        //     const serialNo = unit.serialNo || "N/A";
        //     const maxSerialNoChars = 8;
        //     const displaySerialNo = serialNo.length > maxSerialNoChars
        //         ? serialNo.substring(0, maxSerialNoChars) + "..."
        //         : serialNo;

        //     currentPage.drawText(displaySerialNo, {
        //         x: xPosition + 5,
        //         y: yPos - 35,
        //         size: 9,
        //         font: regularFont,
        //         color: rgb(0, 0, 0),
        //     });
        //     xPosition += COLUMN_WIDTHS.serialNo;

        //     // Product Name (with text wrapping and multi-line support)
        //     const productName = unit.productName || "N/A";
        //     const maxProductNameChars = 20;
        //     let displayProductName = productName;

        //     if (productName.length > maxProductNameChars) {
        //         // Try to break at space
        //         const breakIndex = productName.lastIndexOf(' ', maxProductNameChars);
        //         if (breakIndex > 0) {
        //             displayProductName = productName.substring(0, breakIndex) + '\n' +
        //                 productName.substring(breakIndex + 1);
        //         } else {
        //             displayProductName = productName.substring(0, maxProductNameChars) + "...";
        //         }
        //     }

        //     const productNameLines = displayProductName.split('\n');
        //     productNameLines.forEach((line: any, lineIndex: number) => {
        //         currentPage.drawText(line, {
        //             x: xPosition + 5,
        //             y: yPos - 25 - (lineIndex * 12),
        //             size: 9,
        //             font: regularFont,
        //             color: rgb(0, 0, 0),
        //         });
        //     });
        //     xPosition += COLUMN_WIDTHS.productName;

        //     // Dimensions
        //     const dimText = unit.dimention ?
        //         `₹{unit.dimention.height || 0}H x ${unit.dimention.width || 0}W x ${unit.dimention.depth || 0}D` :
        //         "N/A";

        //     currentPage.drawText(dimText, {
        //         x: xPosition + 5,
        //         y: yPos - 35,
        //         size: 9,
        //         font: regularFont,
        //         color: rgb(0, 0, 0),
        //     });
        //     xPosition += COLUMN_WIDTHS.dimensions;

        //     // Quantity (centered)
        //     const quantityText = unit.quantity.toString();
        //     const quantityWidth = regularFont.widthOfTextAtSize(quantityText, 9);
        //     currentPage.drawText(quantityText, {
        //         x: xPosition + (COLUMN_WIDTHS.quantity - quantityWidth) / 2,
        //         y: yPos - 35,
        //         size: 9,
        //         font: regularFont,
        //         color: rgb(0, 0, 0),
        //     });
        //     xPosition += COLUMN_WIDTHS.quantity;

        //     // Unit Cost (right aligned)
        //     const unitCostText = `₹${(unit.singleUnitCost || 0).toFixed(2)}`;
        //     const unitCostWidth = regularFont.widthOfTextAtSize(unitCostText, 9);
        //     currentPage.drawText(unitCostText, {
        //         x: xPosition + COLUMN_WIDTHS.unitCost - unitCostWidth - 5,
        //         y: yPos - 35,
        //         size: 9,
        //         font: regularFont,
        //         color: rgb(0, 0, 0),
        //     });
        //     xPosition += COLUMN_WIDTHS.unitCost;

        //     // Total Cost (right aligned and bold)
        //     const totalCost = (unit.quantity * (unit.singleUnitCost || 0));
        //     const totalCostText = `₹${totalCost.toFixed(2)}`;
        //     const totalCostWidth = boldFont.widthOfTextAtSize(totalCostText, 9);
        //     currentPage.drawText(totalCostText, {
        //         x: xPosition + COLUMN_WIDTHS.totalCost - totalCostWidth - 5,
        //         y: yPos - 35,
        //         size: 9,
        //         font: boldFont,
        //         color: rgb(0, 0, 0),
        //     });

        //     // Draw vertical cell borders
        //     let borderX = MARGIN;
        //     const columnWidths = Object.values(COLUMN_WIDTHS);

        //     for (let i = 0; i <= columnWidths.length; i++) {
        //         currentPage.drawLine({
        //             start: { x: borderX, y: yPos },
        //             end: { x: borderX, y: yPos - ROW_HEIGHT },
        //             thickness: 0.5,
        //             color: rgb(0.7, 0.7, 0.7),
        //         });

        //         if (i < columnWidths.length) {
        //             borderX += columnWidths[i];
        //         }
        //     }

        //     // Draw horizontal borders for the row
        //     currentPage.drawLine({
        //         start: { x: MARGIN, y: yPos },
        //         end: { x: width - MARGIN, y: yPos },
        //         thickness: 0.5,
        //         color: rgb(0.7, 0.7, 0.7),
        //     });

        //     currentPage.drawLine({
        //         start: { x: MARGIN, y: yPos - ROW_HEIGHT },
        //         end: { x: width - MARGIN, y: yPos - ROW_HEIGHT },
        //         thickness: 0.5,
        //         color: rgb(0.7, 0.7, 0.7),
        //     });

        //     return yPos - ROW_HEIGHT;
        // };


        const drawTableRow = async (currentPage: any, unit: any, index: number, yPos: number) => {
            let xPosition = MARGIN;

            // Draw row background (alternating colors for better readability)
            const rowColor = index % 2 === 0 ? rgb(1, 1, 1) : rgb(0.95, 0.95, 0.95);
            currentPage.drawRectangle({
                x: xPosition,
                y: yPos - ROW_HEIGHT,
                width: width - (2 * MARGIN),
                height: ROW_HEIGHT,
                color: rowColor,
            });

            // S.No
            currentPage.drawText((index + 1).toString(), {
                x: xPosition + 10,
                y: yPos - 35,
                size: 9,
                font: regularFont,
                color: rgb(0, 0, 0),
            });
            xPosition += COLUMN_WIDTHS.sNo;

            // Improved image drawing function with better error handling
            const drawImageInCell = async (imageArray: any[], imageType: string, x: number, columnWidth: number) => {
                if (!imageArray || imageArray.length === 0) {
                    console.log(`No ${imageType} images available`);
                    return false;
                }

                const imageData = imageArray[0];
                if (!imageData.url) {
                    console.log(`No URL found for ${imageType} image`);
                    return false;
                }

                try {
                    console.log(`Fetching ${imageType} image from:`, imageData.url);

                    // Add timeout to fetch request
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

                    const imageRes = await fetch(imageData.url, {
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);

                    if (!imageRes.ok) {
                        throw new Error(`HTTP ${imageRes.status}: ${imageRes.statusText}`);
                    }

                    const imageBuffer = await imageRes.arrayBuffer();

                    if (imageBuffer.byteLength === 0) {
                        throw new Error('Empty image buffer');
                    }

                    console.log(`Image fetched successfully, size: ${imageBuffer.byteLength} bytes`);

                    let image;
                    const contentType = imageRes.headers.get('content-type');

                    // Determine image type from content-type or URL
                    if (contentType?.includes('png') || imageData.url.toLowerCase().includes('.png')) {
                        console.log('Embedding as PNG');
                        image = await pdfDoc.embedPng(imageBuffer);
                    } else if (contentType?.includes('jpeg') || contentType?.includes('jpg') ||
                        imageData.url.toLowerCase().includes('.jpg') ||
                        imageData.url.toLowerCase().includes('.jpeg')) {
                        console.log('Embedding as JPG');
                        image = await pdfDoc.embedJpg(imageBuffer);
                    } else {
                        console.log('Unknown image type, trying JPG as default');
                        image = await pdfDoc.embedJpg(imageBuffer);
                    }

                    // Calculate scaling to fit within cell
                    const maxImageSize = IMAGE_SIZE - 10; // Leave some padding
                    const scaleX = maxImageSize / image.width;
                    const scaleY = maxImageSize / image.height;
                    const scale = Math.min(scaleX, scaleY);

                    const scaledWidth = image.width * scale;
                    const scaledHeight = image.height * scale;

                    // Center image in cell
                    const centerX = x + (columnWidth - scaledWidth) / 2;
                    const centerY = yPos - (ROW_HEIGHT + scaledHeight) / 2;

                    console.log(`Drawing ${imageType} image at:`, { centerX, centerY, scaledWidth, scaledHeight });

                    currentPage.drawImage(image, {
                        x: centerX,
                        y: centerY,
                        width: scaledWidth,
                        height: scaledHeight,
                    });

                    console.log(`✅ ${imageType} image drawn successfully`);
                    return true;

                } catch (err) {
                    console.error(`❌ Failed to load ${imageType} image:`, err);
                    console.error(`Image URL: ${imageData.url}`);
                    return false;
                }
            };

            // Main Product Image
            console.log('Drawing main product image...');
            const mainImageDrawn = await drawImageInCell(unit.productImages, 'main', xPosition, COLUMN_WIDTHS.image);
            if (!mainImageDrawn) {
                currentPage.drawText("N/A", {
                    x: xPosition + (COLUMN_WIDTHS.image - 15) / 2,
                    y: yPos - 35,
                    size: 8,
                    font: regularFont,
                    color: rgb(0.5, 0.5, 0.5),
                });
            }
            xPosition += COLUMN_WIDTHS.image;

            // 2D Image
            console.log('Drawing 2D image...');
            const image2DDrawn = await drawImageInCell(unit["2dImages"], '2D', xPosition, COLUMN_WIDTHS.image2D);
            if (!image2DDrawn) {
                currentPage.drawText("N/A", {
                    x: xPosition + (COLUMN_WIDTHS.image2D - 15) / 2,
                    y: yPos - 35,
                    size: 8,
                    font: regularFont,
                    color: rgb(0.5, 0.5, 0.5),
                });
            }
            xPosition += COLUMN_WIDTHS.image2D;

            // 3D Image
            console.log('Drawing 3D image...');
            const image3DDrawn = await drawImageInCell(unit["3dImages"], '3D', xPosition, COLUMN_WIDTHS.image3D);
            if (!image3DDrawn) {
                currentPage.drawText("N/A", {
                    x: xPosition + (COLUMN_WIDTHS.image3D - 15) / 2,
                    y: yPos - 35,
                    size: 8,
                    font: regularFont,
                    color: rgb(0.5, 0.5, 0.5),
                });
            }
            xPosition += COLUMN_WIDTHS.image3D;

            // Continue with other columns...
            // Serial No
            const serialNo = unit.serialNo || "N/A";
            const maxSerialNoChars = 8;
            const displaySerialNo = serialNo.length > maxSerialNoChars
                ? serialNo.substring(0, maxSerialNoChars) + "..."
                : serialNo;

            currentPage.drawText(displaySerialNo, {
                x: xPosition + 5,
                y: yPos - 35,
                size: 9,
                font: regularFont,
                color: rgb(0, 0, 0),
            });
            xPosition += COLUMN_WIDTHS.serialNo;

            // Product Name
            const productName = unit.productName || "N/A";
            const maxProductNameChars = 20;
            let displayProductName = productName;

            if (productName.length > maxProductNameChars) {
                const breakIndex = productName.lastIndexOf(' ', maxProductNameChars);
                if (breakIndex > 0) {
                    displayProductName = productName.substring(0, breakIndex) + '\n' +
                        productName.substring(breakIndex + 1);
                } else {
                    displayProductName = productName.substring(0, maxProductNameChars) + "...";
                }
            }

            const productNameLines = displayProductName.split('\n');
            productNameLines.forEach((line: any, lineIndex: number) => {
                currentPage.drawText(line, {
                    x: xPosition + 5,
                    y: yPos - 25 - (lineIndex * 12),
                    size: 9,
                    font: regularFont,
                    color: rgb(0, 0, 0),
                });
            });
            xPosition += COLUMN_WIDTHS.productName;

            // Dimensions - Fixed format
            const dimText = unit.dimention ?
                `${unit.dimention.height || 0}H x ${unit.dimention.width || 0}W x ${unit.dimention.depth || 0}D` :
                "N/A";

            currentPage.drawText(dimText, {
                x: xPosition + 5,
                y: yPos - 35,
                size: 9,
                font: regularFont,
                color: rgb(0, 0, 0),
            });
            xPosition += COLUMN_WIDTHS.dimensions;

            // Quantity
            const quantityText = unit.quantity.toString();
            const quantityWidth = regularFont.widthOfTextAtSize(quantityText, 9);
            currentPage.drawText(quantityText, {
                x: xPosition + (COLUMN_WIDTHS.quantity - quantityWidth) / 2,
                y: yPos - 35,
                size: 9,
                font: regularFont,
                color: rgb(0, 0, 0),
            });
            xPosition += COLUMN_WIDTHS.quantity;

            // Unit Cost
            const unitCostText = `₹${(unit.singleUnitCost || 0).toFixed(2)}`;
            const unitCostWidth = regularFont.widthOfTextAtSize(unitCostText, 9);
            currentPage.drawText(unitCostText, {
                x: xPosition + COLUMN_WIDTHS.unitCost - unitCostWidth - 5,
                y: yPos - 35,
                size: 9,
                font: regularFont,
                color: rgb(0, 0, 0),
            });
            xPosition += COLUMN_WIDTHS.unitCost;

            // Total Cost
            const totalCost = (unit.quantity * (unit.singleUnitCost || 0));
            const totalCostText = `₹${totalCost.toFixed(2)}`;
            const totalCostWidth = boldFont.widthOfTextAtSize(totalCostText, 9);
            currentPage.drawText(totalCostText, {
                x: xPosition + COLUMN_WIDTHS.totalCost - totalCostWidth - 5,
                y: yPos - 35,
                size: 9,
                font: boldFont,
                color: rgb(0, 0, 0),
            });

            // Draw borders
            let borderX = MARGIN;
            const columnWidths = Object.values(COLUMN_WIDTHS);

            for (let i = 0; i <= columnWidths.length; i++) {
                currentPage.drawLine({
                    start: { x: borderX, y: yPos },
                    end: { x: borderX, y: yPos - ROW_HEIGHT },
                    thickness: 0.5,
                    color: rgb(0.7, 0.7, 0.7),
                });

                if (i < columnWidths.length) {
                    borderX += columnWidths[i];
                }
            }

            // Horizontal borders
            currentPage.drawLine({
                start: { x: MARGIN, y: yPos },
                end: { x: width - MARGIN, y: yPos },
                thickness: 0.5,
                color: rgb(0.7, 0.7, 0.7),
            });

            currentPage.drawLine({
                start: { x: MARGIN, y: yPos - ROW_HEIGHT },
                end: { x: width - MARGIN, y: yPos - ROW_HEIGHT },
                thickness: 0.5,
                color: rgb(0.7, 0.7, 0.7),
            });

            return yPos - ROW_HEIGHT;
        };


        // Process all units with pagination and progress tracking
        let rowCount = 0;
        const totalUnits = modularUnits.selectedUnits.length;

        // Debug: Check image data before generating PDF
        console.log('=== DEBUG: Checking image data ===');
        modularUnits.selectedUnits.forEach((unit, index) => {
            console.log(`Unit ${index + 1}:`);
            console.log('Product Images:', unit.productImages?.length, unit.productImages);
            console.log('2D Images:', unit["2dImages"]?.length, unit["2dImages"]);
            console.log('3D Images:', unit["3dImages"]?.length, unit["3dImages"]);

            // Test if URLs are accessible
            if (unit.productImages?.[0]?.url) {
                console.log('Product Image URL:', unit.productImages[0].url);
            }
        });

        for (let i = 0; i < totalUnits; i++) {
            const unit = modularUnits.selectedUnits[i];

            // Check if we need a new page (leave space for summary if last row)
            const isLastRow = i === totalUnits - 1;
            const minYRequired = isLastRow ? MARGIN + ROW_HEIGHT + 60 : MARGIN + ROW_HEIGHT;

            if (currentY < minYRequired) {
                // Add footer to current page before creating new one
                if (rowCount > 0) {
                    page.drawText(`Page ${pdfDoc.getPageCount()}`, {
                        x: width - MARGIN - 30,
                        y: MARGIN - 10,
                        size: 8,
                        font: regularFont,
                        color: rgb(0.5, 0.5, 0.5),
                    });
                }

                // Create new page
                page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                rowCount = 0;
                currentY = TABLE_START_Y;
                currentY = drawTableHeaders(page, TABLE_START_Y);
            }

            currentY = await drawTableRow(page, unit, i, currentY);
            rowCount++;
        }

        // Draw final outer table border
        const tableHeight = TABLE_START_Y - currentY;
        if (tableHeight > 0) {
            page.drawRectangle({
                x: MARGIN,
                y: currentY,
                width: width - (2 * MARGIN),
                height: tableHeight,
                borderColor: rgb(0.3, 0.3, 0.3),
                borderWidth: 1,
            });
        }

        // Add summary section
        const summaryY = Math.max(currentY - 50, MARGIN + 30);

        // Summary background
        page.drawRectangle({
            x: width - 250,
            y: summaryY - 25,
            width: 220,
            height: 40,
            color: rgb(0.95, 0.95, 0.95),
            borderColor: rgb(0.7, 0.7, 0.7),
            borderWidth: 1,
        });

        // Total items
        page.drawText(`Total Items: ${totalUnits}`, {
            x: width - 240,
            y: summaryY,
            size: 10,
            font: boldFont,
            color: rgb(0, 0, 0),
        });

        // Grand Total
        const grandTotalText = `Grand Total: ₹${modularUnits.totalCost?.toLocaleString("en-in") || "0.00"}`;
        const grandTotalWidth = boldFont.widthOfTextAtSize(grandTotalText, 12);
        page.drawText(grandTotalText, {
            x: width - MARGIN - grandTotalWidth,
            y: summaryY - 20,
            size: 12,
            font: boldFont,
            color: rgb(0.1, 0.4, 0.1),
        });

        // Add page number to last page
        page.drawText(`Page ${pdfDoc.getPageCount()}`, {
            x: width - MARGIN - 30,
            y: MARGIN - 10,
            size: 8,
            font: regularFont,
            color: rgb(0.5, 0.5, 0.5),
        });

        // Add generated timestamp
        const timestamp = new Date().toLocaleString();
        page.drawText(`Generated: ${timestamp}`, {
            x: MARGIN,
            y: MARGIN - 10,
            size: 8,
            font: regularFont,
            color: rgb(0.5, 0.5, 0.5),
        });

        // Save PDF
        const pdfBytes = await pdfDoc.save();

        // Upload to AWS S3 and update database
        const rawName = (modularUnits.projectId as any).projectName || "project";
        const safeProjectName = rawName.replace(/\s+/g, ""); // remove all spaces

        const fileName = `modular-units-${safeProjectName}-${Date.now()}.pdf`;
        const uploadResult = await uploadToS3(pdfBytes, fileName);

        const pdfData = {
            url: uploadResult.Location,
            type: "pdf" as const,
            originalName: "Modular Units Order Summary",
            uploadedAt: new Date(),
            _id: new mongoose.Types.ObjectId()
        };

        // Update PDF list
        if (Array.isArray(modularUnits.pdfList)) {
            modularUnits.pdfList.push(pdfData);
        } else {
            modularUnits.pdfList = [pdfData];
        }

        // Clear selected units for the next order as requested
        console.log(`Clearing ${modularUnits.selectedUnits.length} selected units for next order`);
        modularUnits.selectedUnits = [];
        modularUnits.totalCost = 0;

        await modularUnits.save();

        return {
            ok: true,
            pdfUrl: uploadResult.Location,
            data: { pdfData, modularUnits },
            message: 'PDF generated successfully and selected units cleared for next order'
        };

    } catch (error: any) {
        console.error('PDF generation error:', error);
        throw new Error(`Failed to generate PDF: ${error.message}`);
    }
}
export default generatePdfModularUnits;
