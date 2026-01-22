import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { COMPANY_LOGO, uploadToS3 } from '../stage controllers/ordering material controller/pdfOrderHistory.controller';

interface PdfParams {
    unitData: any;
    orgName: string;
}

export const generateModularUnitCutlistPdfHelper = async ({ unitData, orgName }: PdfParams) => {
    const pdfDoc = await PDFDocument.create();
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Helper to add a new A3 Landscape page with consistent setup
    const createNewPage = () => {
        const newPage = pdfDoc.addPage([1190.55, 841.89]);
        return {
            page: newPage,
            width: newPage.getSize().width,
            height: newPage.getSize().height
        };
    };

    // A3 Landscape provides 1190 points of width
    let page = pdfDoc.addPage([1190.55, 841.89]);
    const { width, height } = page.getSize();

    const PRIMARY_COLOR = rgb(0.1, 0.3, 0.6);
    const TABLE_HEADER_BG = rgb(0.9, 0.95, 1);
    const BORDER_COLOR = rgb(0.8, 0.8, 0.8);
    const TEXT_COLOR = rgb(0.2, 0.2, 0.2);
    const LINE_COLOR = rgb(0.6, 0.6, 0.6);


    let yPosition = height - 50;

    // --- HELPER: SANITIZE STRING (Fixes the WinAnsi error) ---
    const clean = (text: any) => {
        if (text === null || text === undefined) return "";
        // Removes newlines, carriage returns, and multiple spaces
        return String(text).replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
    };


    const unitObj = unitData.toObject ? unitData.toObject() : unitData;
    // --- 1. DYNAMIC HEADER EXTRACTION ---
    const firstPart = unitObj.parts[0] || {};

    // Define a "blacklist" of internal keys to exclude
    const excludedKeys = [
        "_id", "id", "__v", "createdAt", "updatedAt",
        "PARENTARRAY", "INDEX", "$PARENT", "DOC", "$ISNEW"
    ];

    const dynamicKeys = Object.keys(firstPart).filter(
        (k) => !excludedKeys.includes(k) && !k.startsWith('$')
    );

    const availableWidth = width - 100;
    const columnCount = dynamicKeys.length;

    const headers = dynamicKeys.map((key) => {
        let colWidth = 120;
        if (key === 'no') colWidth = 40;
        else if (['l', 'w', 't'].includes(key.toLowerCase())) colWidth = 60;
        else colWidth = (availableWidth - 220) / (columnCount - 4);

        return {
            key,
            label: clean(key.toUpperCase().replace(/_/g, ' ')),
            width: colWidth
        };
    });


    
    // 2. REUSABLE DRAWING LOGIC
    const drawTableHeaders = () => {
        let startX = 50;
        headers.forEach((h) => {
            page.drawRectangle({
                x: startX, y: yPosition - 25, width: h.width, height: 25,
                color: TABLE_HEADER_BG, borderWidth: 1, borderColor: BORDER_COLOR,
            });
            page.drawText(h.label, {
                x: startX + 5, y: yPosition - 17, size: 9, font: boldFont, color: PRIMARY_COLOR,
            });
            startX += h.width;
        });
        yPosition -= 25;
    };

    const ensureSpace = (minHeight: number) => {
        if (yPosition < minHeight) {
            page = pdfDoc.addPage([1190.55, 841.89]);
            yPosition = page.getHeight() - 50;
            drawTableHeaders(); // Always reprint headers on new page
        }
    };


    
    // // --- 2. HEADER SECTION ---
    // page.drawText(clean(orgName).toUpperCase(), { x: 50, y: yPosition, size: 20, font: boldFont, color: PRIMARY_COLOR });
    // page.drawText(`PRODUCT: ${clean(unitObj.productName) || 'N/A'}`, { x: width - 400, y: yPosition, size: 14, font: boldFont, color: TEXT_COLOR });

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
        page.drawImage(logoImage, {
            x: combinedX,
            y: yPosition - logoDims.height,
            width: logoDims.width,
            height: logoDims.height,
        });

        // Draw Organization Name
        page.drawText(brandText, {
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
        page.drawText(orgName, {
            x: (width - textWidth) / 2,
            y: yPosition,
            size: brandFontSize,
            font: boldFont,
            color: PRIMARY_COLOR,
        });
        yPosition -= 30;
    }

    // Draw Line
    page.drawLine({
        start: { x: 50, y: yPosition },
        end: { x: width - 50, y: yPosition },
        thickness: 1,
        color: LINE_COLOR,
    });



    yPosition -= 30;
    // page.drawLine({ start: { x: 50, y: yPosition }, end: { x: width - 50, y: yPosition }, thickness: 2, color: PRIMARY_COLOR });
    // yPosition -= 40;

    page.drawText(`PRODUCT: ${clean(unitObj.productName) || 'N/A'}`, {
        x: 50,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: TEXT_COLOR
    });


    yPosition -= 16;


    // --- 3. TEXT WRAPPING LOGIC (Sanitized) ---
    const wrapText = (text: string, maxWidth: number, font: any, size: number) => {
        const sanitizedText = clean(text) || '-';
        const words = sanitizedText.split(' ');
        let lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const wordWidth = font.widthOfTextAtSize(currentLine + " " + word, size);
            if (wordWidth < maxWidth - 10) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    };

    // --- 4. DRAW TABLE HEADERS ---
    // let currentX = 50;
    // const headerHeight = 25;
    // headers.forEach((h) => {
    //     page.drawRectangle({
    //         x: currentX,
    //         y: yPosition - headerHeight,
    //         width: h.width,
    //         height: headerHeight,
    //         color: TABLE_HEADER_BG,
    //         borderWidth: 1,
    //         borderColor: BORDER_COLOR,
    //     });
    //     page.drawText(h.label, {
    //         x: currentX + 5,
    //         y: yPosition - 17,
    //         size: 9,
    //         font: boldFont,
    //         color: PRIMARY_COLOR,
    //     });
    //     currentX += h.width;
    // });

    // yPosition -= headerHeight;


    drawTableHeaders();

    // --- 5. DRAW DATA ROWS ---
    unitObj.parts.forEach((part: any, index: number) => {
        const rowData = { ...part, no: index + 1 };

        let maxLines = 1;
        headers.forEach((h) => {
            const lines = wrapText(rowData[h.key], h.width, regularFont, 10);
            if (lines.length > maxLines) maxLines = lines.length;
        });

        const rowHeight = (maxLines * 12) + 10;

       ensureSpace(rowHeight + 20);

        let rowX = 50;
        headers.forEach((h) => {
            const textValue = rowData[h.key];
            const wrappedLines = wrapText(textValue, h.width, regularFont, 9);

            page.drawRectangle({
                x: rowX,
                y: yPosition - rowHeight,
                width: h.width,
                height: rowHeight,
                borderWidth: 0.5,
                borderColor: BORDER_COLOR,
            });

            wrappedLines.forEach((line, lineIdx) => {
                page.drawText(line, {
                    x: rowX + 5,
                    y: yPosition - 15 - (lineIdx * 12),
                    size: 9,
                    font: regularFont,
                    color: TEXT_COLOR,
                });
            });
            rowX += h.width;
        });

        yPosition -= rowHeight;
    });

    // Finalize and Upload
    const pdfBytes = await pdfDoc.save();
    const safeProductName = clean(unitObj.productName).replace(/\s+/g, '-');
    const fileName = `Cutlist-${safeProductName}-${Date.now()}.pdf`;

    const uploadResult = await uploadToS3(pdfBytes, fileName);

    // Update the model with the new document link
    unitData.cutlistDoc.push({
        type: "pdf",
        url: uploadResult.Location,
        originalName: fileName,
        uploadedAt: new Date()
    });

    await unitData.save();

    return {
        fileUrl: uploadResult.Location,
        fileName,
        updatedDoc: unitData
    };
};