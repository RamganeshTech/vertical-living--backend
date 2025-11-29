import { PDFDocument, rgb, PDFFont, PDFImage, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { Types } from 'mongoose';
import { formatDate } from '../../../stage controllers/workReport Controller/imageWorkReport';

// Types for invoice data
interface InvoiceItem {
    itemName: string;
    quantity: number;
        unit: string; // Add this line
    rate: number;
    totalCost: number;
}

export interface PdfInvoiceData {
    invoiceNumber: string;
    customerName: string;
    customerId?: string | Types.ObjectId;
    organizationId: string | Types.ObjectId;
    orderNumber?: string;
    accountsReceivable?: string;
    salesPerson?: string;
    subject?: string;
    invoiceDate: string;
    terms?: string;
    dueDate: string;
    items: InvoiceItem[];
    totalAmount: number;
    discountPercentage?: number;
    discountAmount?: number;
    taxPercentage?: number;
    taxAmount?: number;
    grandTotal: number;
    customerNotes?: string;
    termsAndConditions?: string;
    companyLogo?: string;
    companyName?: string;
}

// Professional color scheme
export const COLORS = {
    PRIMARY: rgb(0.1, 0.4, 0.9),     // Professional blue
    SECONDARY: rgb(0.2, 0.2, 0.2),   // Dark gray
    ACCENT: rgb(0.9, 0.3, 0.1),      // Orange for highlights
    TEXT: rgb(0.2, 0.2, 0.2),        // Main text
    LIGHT_TEXT: rgb(0.4, 0.4, 0.4),  // Secondary text
    BORDER: rgb(0.8, 0.8, 0.8),      // Border color
    BACKGROUND: rgb(0.98, 0.98, 0.98), // Table background
    SUCCESS: rgb(0.2, 0.6, 0.3),     // Green for totals
};

/**
 * Generate professional invoice PDF
 */
export async function generateInvoiceAccBillPdf(invoiceData: PdfInvoiceData): Promise<Uint8Array> {
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
    yPosition = await drawHeader(page, invoiceData, yPosition, width, helveticaBoldFont, helveticaFont);

    // Draw invoice information section
    yPosition = drawInvoiceInfoSection(page, invoiceData, yPosition, width, helveticaBoldFont, helveticaFont);

    // Draw items table
    yPosition = drawItemsTable(page, invoiceData, yPosition, width, helveticaBoldFont, helveticaFont);

    // Draw totals section
    yPosition = drawTotalsSection(page, invoiceData, yPosition, width, helveticaBoldFont, helveticaFont);

    // Draw remarks section if remarks exist
    if (invoiceData.subject) {
        yPosition = drawRemarksSection(page, invoiceData, yPosition, width, helveticaBoldFont, helveticaFont);
    }

    // Draw notes and terms if they exist
    if (invoiceData.customerNotes || invoiceData.termsAndConditions) {
        yPosition = drawNotesAndTerms(page, invoiceData, yPosition, width, helveticaBoldFont, helveticaFont);
    }

    // Draw footer
    drawFooter(page, invoiceData, width, helveticaFont);

    return await pdfDoc.save();
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
 * Draw professional header with logo and company name
 */
async function drawHeader(
    page: any,
    invoiceData: PdfInvoiceData,
    yPosition: number,
    width: number,
    boldFont: PDFFont,
    regularFont: PDFFont
): Promise<number> {
    const companyLogo = invoiceData.companyLogo || 'https://via.placeholder.com/150x50/1a3a6d/ffffff?text=Vertical+Living';
    const companyName = invoiceData.companyName || 'Vertical Living';

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
 * Draw invoice information section
 */
function drawInvoiceInfoSection(
    page: any,
    invoiceData: PdfInvoiceData,
    yPosition: number,
    width: number,
    boldFont: PDFFont,
    regularFont: PDFFont
): number {
    const leftColumnX = 50;
    const rightColumnX = width - 250;
    let currentY = yPosition;

    // Invoice title
    page.drawText('INVOICE', {
        x: leftColumnX,
        y: currentY,
        size: 24,
        font: boldFont,
        color: COLORS.PRIMARY,
    });

    currentY -= 40;

    // Left column - Bill To
    page.drawText('Bill To:', {
        x: leftColumnX,
        y: currentY,
        size: 12,
        font: boldFont,
        color: COLORS.TEXT,
    });

    page.drawText(invoiceData.customerName, {
        x: leftColumnX,
        y: currentY - 20,
        size: 14,
        font: regularFont,
        color: COLORS.TEXT,
    });

    // Right column - Invoice details
    const details = [
        { label: 'Invoice Number', value: invoiceData.invoiceNumber },
        { label: 'Invoice Date', value: formatDate(invoiceData.invoiceDate)},
        { label: 'Due Date', value: formatDate(invoiceData.dueDate)},
        { label: 'Order Number', value: invoiceData.orderNumber },
        { label: 'Sales Person', value: invoiceData.salesPerson },
        // { label: 'Remaks', value: invoiceData.subject },
        { label: 'Terms', value: invoiceData.terms },
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
 * Draw items table
 */
function drawItemsTable(
    page: any,
    invoiceData: PdfInvoiceData,
    yPosition: number,
    width: number,
    boldFont: PDFFont,
    regularFont: PDFFont
): number {
    const tableTop = yPosition;
    const tableLeft = 50;
    const tableWidth = width - 100;
    // Updated column widths for serial number and multi-line text
    const columnWidths = [tableWidth * 0.08, tableWidth * 0.37, tableWidth * 0.1, tableWidth * 0.1, tableWidth * 0.15, tableWidth * 0.2];
    const rowHeight = 25;
    const headerHeight = 30;

    // Updated table headers with serial number
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
    invoiceData.items.forEach((item, index) => {
        const isEvenRow = index % 2 === 0;

        if (isEvenRow) {
            page.drawRectangle({
                x: tableLeft,
                y: currentY - rowHeight,
                width: tableWidth,
                height: rowHeight,
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
        
        // Split text into multiple lines if needed
        const lines = splitTextIntoLines(itemName, regularFont, 9, maxItemNameWidth);
        lines.forEach((line, lineIndex) => {
            page.drawText(line, {
                x: currentX + 5,
                y: currentY - 20 - (lineIndex * 12),
                size: 9,
                font: regularFont,
                color: COLORS.TEXT,
            });
        });
        
        // Adjust row height based on number of lines
        const itemRowHeight = Math.max(rowHeight, lines.length * 12);
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

        // Unit
        page.drawText(item.unit || '-', {
            x: currentX + 5,
            y: currentY - 20,
            size: 9,
            font: regularFont,
            color: COLORS.TEXT,
        });
        currentX += columnWidths[3];

        // Rate (without INR prefix)
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

        // Total (without INR prefix)
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

        currentY -= itemRowHeight;

        // Check if we need a new page
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
    });

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
 * Draw totals section
 */
function drawTotalsSection(
    page: any,
    invoiceData: PdfInvoiceData,
    yPosition: number,
    width: number,
    boldFont: PDFFont,
    regularFont: PDFFont
): number {
    const totalsLeft = width - 200;
    let currentY = yPosition;

    // Subtotal in bold
    drawTotalLine(page, 'Subtotal', invoiceData.totalAmount.toLocaleString('en-IN', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    }), totalsLeft, currentY, boldFont);
    currentY -= 25;

    // Discount in bold
    if (invoiceData.discountAmount && invoiceData.discountAmount > 0) {
        const discountText = invoiceData.discountPercentage
            ? `Discount (${invoiceData.discountPercentage}%)`
            : 'Discount';
        drawTotalLine(page, discountText, `-${invoiceData.discountAmount.toLocaleString('en-IN', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        })}`, totalsLeft, currentY, boldFont);
        currentY -= 25;
    }

    // Tax in bold
    if (invoiceData.taxAmount && invoiceData.taxAmount > 0) {
        const taxText = invoiceData.taxPercentage
            ? `Tax (${invoiceData.taxPercentage}%)`
            : 'Tax';
        drawTotalLine(page, taxText, invoiceData.taxAmount.toLocaleString('en-IN', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        }), totalsLeft, currentY, boldFont);
        currentY -= 25;
    }

    // Grand Total (no background color, just bold)
    page.drawText('Grand Total', {
        x: totalsLeft,
        y: currentY - 15,
        size: 14,
        font: boldFont,
        color: COLORS.PRIMARY,
    });

    page.drawText(`INR ${invoiceData.grandTotal.toLocaleString('en-IN', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    })}`, {
        x: totalsLeft + 100,
        y: currentY - 15,
        size: 14,
        font: boldFont,
        color: COLORS.PRIMARY,
    });

    return currentY - 50;
}

/**
 * Helper function to draw total lines
 */function drawTotalLine(
    page: any,
    label: string,
    value: string,
    x: number,
    y: number,
    font: PDFFont
): void {
    // Check if we need new page for totals
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
        x: x + 100,
        y: y,
        size: 11,
        font: font,
        color: COLORS.TEXT,
    });
}




/**
 * Draw remarks section after totals
 */
function drawRemarksSection(
    page: any,
    invoiceData: PdfInvoiceData,
    yPosition: number,
    width: number,
    boldFont: PDFFont,
    regularFont: PDFFont
): number {
    if (!invoiceData.subject) return yPosition;
    
    let currentY = yPosition;
    
    // Remarks title in bold
    page.drawText('Remarks:', {
        x: 50,
        y: currentY,
        size: 12,
        font: boldFont,
        color: COLORS.TEXT,
    });

    currentY -= 20;

    // Remarks content with multi-line support
    const remarks = invoiceData.subject;
    const maxRemarksWidth = width - 100;
    
    // Split remarks into multiple lines
    const lines = splitTextIntoLines(remarks, regularFont, 10, maxRemarksWidth);
    
    lines.forEach((line, index) => {
        // Check if we need a new page
        if (currentY < 100) {
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
    });

    return currentY - 20;
}



/**
 * Draw notes and terms section
 */
function drawNotesAndTerms(
    page: any,
    invoiceData: PdfInvoiceData,
    yPosition: number,
    width: number,
    boldFont: PDFFont,
    regularFont: PDFFont
): number {
    let currentY = yPosition;

    if (invoiceData.customerNotes) {
        page.drawText('Customer Notes:', {
            x: 50,
            y: currentY,
            size: 12,
            font: boldFont,
            color: COLORS.TEXT,
        });

        page.drawText(invoiceData.customerNotes, {
            x: 50,
            y: currentY - 20,
            size: 10,
            font: regularFont,
            color: COLORS.LIGHT_TEXT,
            maxWidth: width - 100,
            lineHeight: 12,
        });

        currentY -= 60;
    }

    if (invoiceData.termsAndConditions) {
        page.drawText('Terms & Conditions:', {
            x: 50,
            y: currentY,
            size: 12,
            font: boldFont,
            color: COLORS.TEXT,
        });

        page.drawText(invoiceData.termsAndConditions, {
            x: 50,
            y: currentY - 20,
            size: 10,
            font: regularFont,
            color: COLORS.LIGHT_TEXT,
            maxWidth: width - 100,
            lineHeight: 12,
        });

        currentY -= 60;
    }

    return currentY;
}

/**
 * Draw footer
 */function drawFooter(
    page: any,
    invoiceData: PdfInvoiceData,
    width: number,
    font: PDFFont
): void {
    const footerText = 'Thank you for your business!';
    const footerTextWidth = font.widthOfTextAtSize(footerText, 10);

    page.drawText(footerText, {
        x: (width - footerTextWidth) / 2,
        y: 50,
        size: 10,
        font: font,
        color: COLORS.LIGHT_TEXT,
    });

    // Removed invoice number and generated date from footer
}

