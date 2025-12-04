import { PDFDocument, rgb, PDFFont, PDFImage, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { Types } from 'mongoose';
import { IBillItem } from '../../../../models/Department Models/Accounting Model/billAccount.model';
import { COLORS } from '../Invoice Accounts Controllers/pdfInvoiceAcc';
import { formatDate } from '../../../stage controllers/workReport Controller/imageWorkReport';

// Update the PdfBillData interface to include images
export interface PdfBillData {
    billNumber: string;
    vendorName: string;
    vendorId?: string | Types.ObjectId;
    organizationId: string | Types.ObjectId;
    accountsPayable?: string;
    subject?: string;
    billDate: string;
    dueDate: string;
    items: IBillItem[];
    totalAmount: number;
    discountPercentage?: number;
    discountAmount?: number;
    taxPercentage?: number;
    taxAmount?: number;
    advancedAmount: number;
    paymentType: string;
    grandTotal: number;
    notes?: string;
    images?: Array<{
        type: "image" | "pdf";
        url: string;
        originalName?: string;
        uploadedAt?: Date;
    }>;
    companyLogo?: string;
    companyName?: string;
}


/**
 * Generate professional bill PDF with images
 */
export async function generateBillAccBillPdf(billData: PdfBillData): Promise<Uint8Array> {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // Embed fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Add a page
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    let yPosition = height - 50;

    // Draw header with logo and company name
    yPosition = await drawBillHeader(page, billData, yPosition, width, helveticaBoldFont, helveticaFont);

    // Draw bill information section
    yPosition = drawBillInfoSection(page, billData, yPosition, width, helveticaBoldFont, helveticaFont);

    // Draw items table
    yPosition = drawBillItemsTable(page, billData, yPosition, width, helveticaBoldFont, helveticaFont);

    // Draw totals section
    yPosition = drawBillTotalsSection(page, billData, yPosition, width, helveticaBoldFont, helveticaFont);

    // Draw notes if they exist
    if (billData.notes) {
        yPosition = drawBillNotesSection(page, billData, yPosition, width, helveticaBoldFont, helveticaFont);
    }

    // Draw images section if images exist
    if (billData.images && billData.images.length > 0) {
        yPosition = await drawBillImagesSection(page, billData, yPosition, width, helveticaBoldFont, helveticaFont);
    }

    // Draw footer
    // drawBillFooter(page, billData, width, helveticaFont);

    return await pdfDoc.save();
}

// /**
//  * Draw bill totals section (updated without background color and with INR)
//  */


function drawBillTotalsSection(
    page: any,
    billData: PdfBillData,
    yPosition: number,
    width: number,
    boldFont: PDFFont,
    regularFont: PDFFont
): number {
    const totalsLeft = width - 250; // Increased width for INR prefix
    let currentY = yPosition;

    // Subtotal in bold with INR
    drawBillTotalLine(page, 'Subtotal', `INR ${billData.totalAmount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`, totalsLeft, currentY, boldFont);
    currentY -= 25;

    // Discount in bold with INR
    if (billData.discountAmount && billData.discountAmount > 0) {
        const discountText = billData.discountPercentage
            ? `Discount (${billData.discountPercentage}%)`
            : 'Discount';
        drawBillTotalLine(page, discountText, `-INR ${billData.discountAmount.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`, totalsLeft, currentY, boldFont);
        currentY -= 25;
    }

    // Tax in bold with INR
    if (billData.taxAmount && billData.taxAmount > 0) {
        const taxText = billData.taxPercentage
            ? `Tax (${billData.taxPercentage}%)`
            : 'Tax';
        drawBillTotalLine(page, taxText, `INR ${billData.taxAmount.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`, totalsLeft, currentY, boldFont);
        currentY -= 25;
    }


    if (billData.advancedAmount) {
        const amtText = `Advance Amt`

        drawBillTotalLine(page, amtText, `INR ${billData.advancedAmount.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`, totalsLeft, currentY, boldFont);
        currentY -= 25;
    }


    // if (billData.paymentType) {
    //     const paymentTypeText = `Payment Type`
    //     drawBillTotalLine(page, paymentTypeText, `${billData.paymentType}`, totalsLeft, currentY, boldFont);
    //     currentY -= 25;
    // }


    // Grand Total (bold with INR, no background color)
    page.drawText('Grand Total', {
        x: totalsLeft,
        y: currentY - 15,
        size: 14,
        font: boldFont,
        color: COLORS.PRIMARY,
    });

    page.drawText(`INR ${billData.grandTotal.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`, {
        x: totalsLeft + 120, // Adjusted for INR prefix
        y: currentY - 15,
        size: 14,
        font: boldFont,
        color: COLORS.PRIMARY,
    });

    return currentY - 50;
}

// /**
//  * Helper function to draw bill total lines (updated for INR)
//  */


function drawBillTotalLine(
    page: any,
    label: string,
    value: string,
    x: number,
    y: number,
    font: PDFFont
): void {
    if (y < 100) {
        const newPage = page.doc.addPage([595.28, 841.89]);
        y = 841.89 - 100;
    }

    page.drawText(label, {
        x: x,
        y: y,
        size: 11,
        font: font,
        color: COLORS.TEXT,
    });

    page.drawText(value, {
        x: x + 120, // Increased spacing for INR prefix
        y: y,
        size: 11,
        font: font,
        color: COLORS.TEXT,
    });
}



/**
 * Draw professional header with logo and company name for bill
 */
async function drawBillHeader(
    page: any,
    billData: PdfBillData,
    yPosition: number,
    width: number,
    boldFont: PDFFont,
    regularFont: PDFFont
): Promise<number> {
    const companyLogo = billData.companyLogo || 'https://via.placeholder.com/150x50/1a3a6d/ffffff?text=Vertical+Living';
    const companyName = billData.companyName || 'Vertical Living';

    try {
        // Fetch and embed logo
        const logoResponse = await fetch(companyLogo);
        const logoBuffer = await logoResponse.arrayBuffer();
        let logoImage: PDFImage;

        if (companyLogo.toLowerCase().endsWith('.png')) {
            logoImage = await page.doc.embedPng(logoBuffer);
        } else {
            logoImage = await page.doc.embedJpg(logoBuffer);
        }

        const logoScale = 0.4;
        const logoDims = logoImage.scale(logoScale);

        // Calculate positioning
        const brandFontSize = 20;
        const spacing = 15;
        const brandTextWidth = boldFont.widthOfTextAtSize(companyName, brandFontSize);
        const totalWidth = logoDims.width + spacing + brandTextWidth;
        const combinedX = (width - totalWidth) / 2;

        // Draw logo
        page.drawImage(logoImage, {
            x: combinedX,
            y: yPosition - logoDims.height,
            width: logoDims.width,
            height: logoDims.height,
        });

        // Draw company name
        const textY = yPosition - (logoDims.height / 2) - (brandFontSize / 3);
        page.drawText(companyName, {
            x: combinedX + logoDims.width + spacing,
            y: textY,
            size: brandFontSize,
            font: boldFont,
            color: COLORS.PRIMARY,
        });

        yPosition -= logoDims.height + 20;

    } catch (error) {
        console.error('Failed to load company logo, using text only:', error);

        // Fallback: company name only
        const brandFontSize = 24;
        const brandTextWidth = boldFont.widthOfTextAtSize(companyName, brandFontSize);

        page.drawText(companyName, {
            x: (width - brandTextWidth) / 2,
            y: yPosition,
            size: brandFontSize,
            font: boldFont,
            color: COLORS.PRIMARY,
        });

        yPosition -= 40;
    }

    // Draw header line
    page.drawLine({
        start: { x: 50, y: yPosition },
        end: { x: width - 50, y: yPosition },
        thickness: 2,
        color: COLORS.PRIMARY,
    });

    return yPosition - 30;
}

/**
 * Draw bill information section
 */
function drawBillInfoSection(
    page: any,
    billData: PdfBillData,
    yPosition: number,
    width: number,
    boldFont: PDFFont,
    regularFont: PDFFont
): number {
    const leftColumnX = 50;
    const rightColumnX = width - 250;
    let currentY = yPosition;

    // Bill title
    page.drawText('BILL', {
        x: leftColumnX,
        y: currentY,
        size: 24,
        font: boldFont,
        color: COLORS.PRIMARY,
    });

    currentY -= 40;

    // Left column - Vendor To
    page.drawText('Vendor:', {
        x: leftColumnX,
        y: currentY,
        size: 12,
        font: boldFont,
        color: COLORS.TEXT,
    });

    page.drawText(billData.vendorName, {
        x: leftColumnX,
        y: currentY - 20,
        size: 14,
        font: regularFont,
        color: COLORS.TEXT,
    });

    // Right column - Bill details
    const details = [
        { label: 'Bill Number', value: billData.billNumber },
        { label: 'Bill Date', value: formatDate(billData.billDate) },
        { label: 'Due Date', value: formatDate(billData.dueDate) },
        // { label: 'Accounts Payable', value: billData.accountsPayable },
        {label: "Payment Type", value: billData.paymentType}
    ];

    let detailY = currentY;
    details.forEach(detail => {
        if (detail.value) {
            page.drawText(`${detail.label}:`, {
                x: rightColumnX,
                y: detailY,
                size: 10,
                font: boldFont,
                color: COLORS.LIGHT_TEXT,
            });

            page.drawText(detail.value.toString(), {
                x: rightColumnX + 80,
                y: detailY,
                size: 10,
                font: regularFont,
                color: COLORS.TEXT,
            });

            detailY -= 15;
        }
    });

    return Math.min(currentY - 40, detailY) - 20;
}

/**
 * Draw bill items table with multi-line support
 */
function drawBillItemsTable(
    page: any,
    billData: PdfBillData,
    yPosition: number,
    width: number,
    boldFont: PDFFont,
    regularFont: PDFFont
): number {
    const tableTop = yPosition;
    const tableLeft = 50;
    const tableWidth = width - 100;
    const columnWidths = [tableWidth * 0.08, tableWidth * 0.37, tableWidth * 0.1, tableWidth * 0.1, tableWidth * 0.15, tableWidth * 0.2];
    const baseRowHeight = 25;
    const headerHeight = 30;

    // Table headers
    const headers = ['S.No', 'Item Name', 'Qty', 'Unit', 'Rate', 'Total'];
    let currentX = tableLeft;

    // Draw table header background
    page.drawRectangle({
        x: tableLeft,
        y: tableTop - headerHeight,
        width: tableWidth,
        height: headerHeight,
        color: COLORS.PRIMARY,
    });

    // Draw header text
    headers.forEach((header, index) => {
        page.drawText(header, {
            x: currentX + 5,
            y: tableTop - headerHeight + 10,
            size: 10,
            font: boldFont,
            color: rgb(1, 1, 1),
        });
        currentX += columnWidths[index];
    });

    let currentY = tableTop - headerHeight - 5;

    // Draw items
    for (let index = 0; index < billData.items.length; index++) {
        const item = billData.items[index];
        const isEvenRow = index % 2 === 0;

        // Check if we need a new page before drawing this row
        if (currentY < 100) {
            const newPage = page.doc.addPage([595.28, 841.89]);
            currentY = 841.89 - 50;

            // Redraw table headers on new page
            currentX = tableLeft;
            headers.forEach((header, idx) => {
                newPage.drawText(header, {
                    x: currentX + 5,
                    y: currentY - 10,
                    size: 10,
                    font: boldFont,
                    color: rgb(1, 1, 1),
                });
                currentX += columnWidths[idx];
            });
            currentY -= 30;
        }

        if (isEvenRow) {
            page.drawRectangle({
                x: tableLeft,
                y: currentY - baseRowHeight,
                width: tableWidth,
                height: baseRowHeight,
                color: COLORS.BACKGROUND,
            });
        }

        currentX = tableLeft;

        // Serial Number
        page.drawText((index + 1).toString(), {
            x: currentX + 8,
            y: currentY - 20,
            size: 9,
            font: regularFont,
            color: COLORS.TEXT,
        });
        currentX += columnWidths[0];

        // Item Name with multi-line support
        const itemName = item.itemName || 'No item name';
        const maxItemNameWidth = columnWidths[1] - 10;

        const lines = splitTextIntoLines(itemName, regularFont, 9, maxItemNameWidth);
        const lineHeight = 12;
        const itemNameHeight = Math.max(baseRowHeight, lines.length * lineHeight);

        lines.forEach((line, lineIndex) => {
            page.drawText(line, {
                x: currentX + 5,
                y: currentY - 20 - (lineIndex * lineHeight),
                size: 9,
                font: regularFont,
                color: COLORS.TEXT,
            });
        });
        currentX += columnWidths[1];

        // Quantity
        page.drawText((item.quantity || 0).toString(), {
            x: currentX + 5,
            y: currentY - 20,
            size: 9,
            font: regularFont,
            color: COLORS.TEXT,
        });
        currentX += columnWidths[2];

        // Unit (show N/A if empty)
        page.drawText(item.unit || 'N/A', {
            x: currentX + 5,
            y: currentY - 20,
            size: 9,
            font: regularFont,
            color: COLORS.TEXT,
        });
        currentX += columnWidths[3];

        // Rate
        page.drawText((item.rate || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }), {
            x: currentX + 5,
            y: currentY - 20,
            size: 9,
            font: regularFont,
            color: COLORS.TEXT,
        });
        currentX += columnWidths[4];

        // Total
        page.drawText((item.totalCost || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }), {
            x: currentX + 5,
            y: currentY - 20,
            size: 9,
            font: regularFont,
            color: COLORS.TEXT,
        });

        currentY -= itemNameHeight;
    }

    // Draw table borders
    page.drawRectangle({
        x: tableLeft,
        y: currentY,
        width: tableWidth,
        height: tableTop - currentY - headerHeight,
        borderColor: COLORS.BORDER,
        borderWidth: 1,
    });

    return currentY - 20;
}

/**
 * Draw bill notes section
 */
function drawBillNotesSection(
    page: any,
    billData: PdfBillData,
    yPosition: number,
    width: number,
    boldFont: PDFFont,
    regularFont: PDFFont
): number {
    if (!billData.notes) return yPosition;

    let currentY = yPosition;

    // Notes title in bold
    page.drawText('Notes:', {
        x: 50,
        y: currentY,
        size: 12,
        font: boldFont,
        color: COLORS.TEXT,
    });

    currentY -= 20;

    // Notes content with multi-line support
    const notes = billData.notes;
    const maxNotesWidth = width - 100;

    const lines = splitTextIntoLines(notes, regularFont, 10, maxNotesWidth);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if we need a new page
        if (currentY < 50) {
            const newPage = page.doc.addPage([595.28, 841.89]);
            currentY = 841.89 - 50;
        }

        page.drawText(line, {
            x: 50,
            y: currentY,
            size: 10,
            font: regularFont,
            color: COLORS.LIGHT_TEXT,
        });

        currentY -= 15;
    }

    return currentY - 20;
}

/**
 * Draw bill images section with grid layout
 */
async function drawBillImagesSection(
    page: any,
    billData: PdfBillData,
    yPosition: number,
    width: number,
    boldFont: PDFFont,
    regularFont: PDFFont
): Promise<number> {
    if (!billData.images || billData.images.length === 0) return yPosition;

    let currentY = yPosition;
    let currentPage = page;

    // Images title in bold
    currentPage.drawText('Attached Images:', {
        x: 50,
        y: currentY,
        size: 12,
        font: boldFont,
        color: COLORS.TEXT,
    });

    currentY -= 30;

    // Filter only images (not PDFs)
    const imageFiles = billData.images.filter(img => img.type === 'image');

    console.log('Total images found:', imageFiles.length);

    if (imageFiles.length === 0) return currentY;

    // Image grid configuration
    const imageWidth = 150;
    const imageHeight = 120;
    const spacing = 20;
    const imagesPerRow = 2;
    const totalImageHeight = imageHeight + 40; // Image + label space

    // Track current row on current page
    let currentRow = 0;

    for (let i = 0; i < imageFiles.length; i++) {
        const image = imageFiles[i];
        const col = i % imagesPerRow;

        // Check if we need a new page (before drawing this image)
        if (currentY - (currentRow * totalImageHeight) < 100) {
            currentPage = currentPage.doc.addPage([595.28, 841.89]);
            currentY = 841.89 - 50; // Reset to top of new page
            currentRow = 0; // Reset row counter for new page

            // Redraw title on new page
            currentPage.drawText('Attached Images:', {
                x: 50,
                y: currentY,
                size: 12,
                font: boldFont,
                color: COLORS.TEXT,
            });
            currentY -= 30;
        }

        const xPos = 50 + (col * (imageWidth + spacing));
        const yPos = currentY - (currentRow * totalImageHeight);

        try {
            console.log(`Attempting to load image: ${image.url}`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const imageResponse = await fetch(image.url, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!imageResponse.ok) {
                throw new Error(`HTTP ${imageResponse.status}: ${imageResponse.statusText}`);
            }

            const imageBuffer = await imageResponse.arrayBuffer();

            if (imageBuffer.byteLength === 0) {
                throw new Error('Empty image buffer');
            }

            console.log(`Image loaded successfully, size: ${imageBuffer.byteLength} bytes`);

            let pdfImage: PDFImage;

            // Use the same logic from your working code
            if (image.type === "image" || image.url.toLowerCase().endsWith('.jpg') || image.url.toLowerCase().endsWith('.jpeg')) {
                pdfImage = await currentPage.doc.embedJpg(imageBuffer);
                console.log('Embedded as JPG');
            } else {
                pdfImage = await currentPage.doc.embedPng(imageBuffer);
                console.log('Embedded as PNG');
            }

            // Draw image with border
            currentPage.drawImage(pdfImage, {
                x: xPos,
                y: yPos - imageHeight,
                width: imageWidth,
                height: imageHeight,
            });

            currentPage.drawRectangle({
                x: xPos - 2,
                y: yPos - imageHeight - 2,
                width: imageWidth + 4,
                height: imageHeight + 4,
                borderColor: COLORS.BORDER,
                borderWidth: 1,
            });

            // Draw image name below the image
            const imageName = image.originalName || `Image ${i + 1}`;
            const maxNameWidth = imageWidth - 10;
            const nameLines = splitTextIntoLines(imageName, regularFont, 8, maxNameWidth);

            nameLines.forEach((line, lineIndex) => {
                currentPage.drawText(line, {
                    x: xPos + 5,
                    y: yPos - imageHeight - 15 - (lineIndex * 10),
                    size: 8,
                    font: regularFont,
                    color: COLORS.LIGHT_TEXT,
                });
            });

            console.log(`Successfully drawn image ${i + 1} at row ${currentRow}, col ${col}`);

        } catch (error) {
            console.error(`Failed to load image ${image.url}:`, error);

            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Error details:', errorMessage);

            // Draw placeholder for failed image
            currentPage.drawRectangle({
                x: xPos,
                y: yPos - imageHeight,
                width: imageWidth,
                height: imageHeight,
                color: COLORS.BACKGROUND,
                borderColor: COLORS.BORDER,
                borderWidth: 1,
            });

            currentPage.drawText('Image not available', {
                x: xPos + 10,
                y: yPos - imageHeight / 2,
                size: 10,
                font: regularFont,
                color: COLORS.LIGHT_TEXT,
            });
        }

        // Move to next row if this is the last column in the row
        if (col === imagesPerRow - 1) {
            currentRow++;
        }
    }

    // Calculate final Y position after all images
    const totalRowsOnCurrentPage = currentRow + 1; // +1 because currentRow is 0-based
    return currentY - (totalRowsOnCurrentPage * totalImageHeight) - 20;
}


/**
 * Split text into multiple lines based on max width
 */
function splitTextIntoLines(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = font.widthOfTextAtSize(testLine, fontSize);

        if (width <= maxWidth) {
            currentLine = testLine;
        } else {
            if (currentLine) {
                lines.push(currentLine);
            }
            currentLine = word;
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
}

/**
 * Draw bill footer
//  */
// function drawBillFooter(
//     page: any,
//     billData: PdfBillData,
//     width: number,
//     font: PDFFont
// ): void {
//     const footerText = 'Thank you for your business!';
//     const footerTextWidth = font.widthOfTextAtSize(footerText, 10);

//     page.drawText(footerText, {
//         x: (width - footerTextWidth) / 2,
//         y: 50,
//         size: 10,
//         font: font,
//         color: COLORS.LIGHT_TEXT,
//     });
// }