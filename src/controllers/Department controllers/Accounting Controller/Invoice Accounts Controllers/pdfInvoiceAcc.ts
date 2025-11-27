import { PDFDocument, rgb, PDFFont, PDFImage, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { Types } from 'mongoose';

// Types for invoice data
interface InvoiceItem {
    description: string;
    quantity: number;
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
const COLORS = {
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

    // Embed fonts - CORRECTED WAY
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    // const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    // const normalFont = await pdfDoc.embedFont(StandardFonts.Helvetica);


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

    // Draw notes and terms if they exist
    if (invoiceData.customerNotes || invoiceData.termsAndConditions) {
        yPosition = drawNotesAndTerms(page, invoiceData, yPosition, width, helveticaBoldFont, helveticaFont);
    }

    // Draw footer
    drawFooter(page, invoiceData, width, helveticaFont);

    return await pdfDoc.save();
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
        { label: 'Invoice Date', value: new Date(invoiceData.invoiceDate).toLocaleDateString() },
        { label: 'Due Date', value: new Date(invoiceData.dueDate).toLocaleDateString() },
        { label: 'Order Number', value: invoiceData.orderNumber },
        { label: 'Sales Person', value: invoiceData.salesPerson },
        { label: 'Subject', value: invoiceData.subject },
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
    const columnWidths = [tableWidth * 0.5, tableWidth * 0.15, tableWidth * 0.15, tableWidth * 0.2];
    const rowHeight = 25;
    const headerHeight = 30;

    // Table headers
    const headers = ['Description', 'Quantity', 'Rate', 'Total'];
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
            x: currentX + 10,
            y: tableTop - headerHeight + 10,
            size: 12,
            font: boldFont,
            color: rgb(1, 1, 1), // White text
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

        // Description
        page.drawText(item.description || 'No description', {
            x: currentX + 10,
            y: currentY - 20,
            size: 10,
            font: regularFont,
            color: COLORS.TEXT,
            maxWidth: columnWidths[0] - 20,
        });
        currentX += columnWidths[0];

        // Quantity
        page.drawText((item.quantity || 0).toString(), {
            x: currentX + 10,
            y: currentY - 20,
            size: 10,
            font: regularFont,
            color: COLORS.TEXT,
        });
        currentX += columnWidths[1];

        // Rate
        page.drawText(`₹${(item.rate || 0 ).toFixed(2)}`, {
            x: currentX + 10,
            y: currentY - 20,
            size: 10,
            font: regularFont,
            color: COLORS.TEXT,
        });
        currentX += columnWidths[2];

        // Total
        page.drawText(`₹${(item.totalCost || 0).toFixed(2)}`, {
            x: currentX + 10,
            y: currentY - 20,
            size: 10,
            font: regularFont,
            color: COLORS.TEXT,
        });

        currentY -= rowHeight;
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

    // Subtotal
    drawTotalLine(page, 'Subtotal', `$${invoiceData.totalAmount.toFixed(2)}`, totalsLeft, currentY, regularFont);
    currentY -= 25;

    // Discount
    if (invoiceData.discountAmount && invoiceData.discountAmount > 0) {
        const discountText = invoiceData.discountPercentage
            ? `Discount (${invoiceData.discountPercentage}%)`
            : 'Discount';
        drawTotalLine(page, discountText, `-$${invoiceData.discountAmount.toFixed(2)}`, totalsLeft, currentY, regularFont);
        currentY -= 25;
    }

    // Tax
    if (invoiceData.taxAmount && invoiceData.taxAmount > 0) {
        const taxText = invoiceData.taxPercentage
            ? `Tax (${invoiceData.taxPercentage}%)`
            : 'Tax';
        drawTotalLine(page, taxText, `$${invoiceData.taxAmount.toFixed(2)}`, totalsLeft, currentY, regularFont);
        currentY -= 25;
    }

    // Grand Total
    page.drawRectangle({
        x: totalsLeft - 10,
        y: currentY - 30,
        width: 160,
        height: 35,
        color: COLORS.PRIMARY,
    });

    page.drawText('Grand Total', {
        x: totalsLeft,
        y: currentY - 15,
        size: 14,
        font: boldFont,
        color: rgb(1, 1, 1),
    });

    page.drawText(`$${invoiceData.grandTotal.toFixed(2)}`, {
        x: totalsLeft + 100,
        y: currentY - 15,
        size: 14,
        font: boldFont,
        color: rgb(1, 1, 1),
    });

    return currentY - 50;
}

/**
 * Helper function to draw total lines
 */
function drawTotalLine(
    page: any,
    label: string,
    value: string,
    x: number,
    y: number,
    font: PDFFont
): void {
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
 */
function drawFooter(
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

    page.drawText(`Invoice #${invoiceData.invoiceNumber}`, {
        x: 50,
        y: 30,
        size: 8,
        font: font,
        color: COLORS.LIGHT_TEXT,
    });

    page.drawText(`Generated on ${new Date().toLocaleDateString()}`, {
        x: width - 150,
        y: 30,
        size: 8,
        font: font,
        color: COLORS.LIGHT_TEXT,
    });
}