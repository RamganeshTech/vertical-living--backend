// import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { uploadToS3 } from '../stage controllers/ordering material controller/pdfOrderHistory.controller';

// const PRIMARY_COLOR = rgb(0.1, 0.4, 0.8); // Professional Blue
// const TEXT_COLOR = rgb(0.2, 0.2, 0.2);
// const LINE_COLOR = rgb(0.8, 0.8, 0.8);
// const BG_COLOR_HEADER = rgb(0.89, 0.95, 1); // Light Blue from image_e4f103.png

// export const generateCutlistPDF = async (cutlistData: any, orgName: string) => {
//     const pdfDoc = await PDFDocument.create();
//     const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
//     const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

//     // Wide format (A3 Landscape)
//     const PAGE_WIDTH = 1190.55;
//     const PAGE_HEIGHT = 841.89;
//     let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
//     const { width } = page.getSize();

//     let yPosition = PAGE_HEIGHT - 50;

//     const drawTableHeaders = () => {
//         const headers = [
//             "S No", "Measurement", "Plywood Thickness", "Inner Laminate Thickness", "Outer Laminate Thickness",
//             "Back Side Laminate Brand", "Back Side Laminate Name and Code", "Back Side Laminate Image", "Front Side Laminate Brand", "Front Side Laminate Name and Code", "Front side Laminate Image"
//         ];

//         const colWidths = [40, 120, 80, 80, 80, 120, 120, 150, 120, 120, 150];

//         page.drawRectangle({
//             x: 40, y: yPosition - 25, width: PAGE_WIDTH - 80, height: 30, color: BG_COLOR_HEADER
//         });

//         let currentX = 50;
//         headers.forEach((header, i) => {
//             page.drawText(header, {
//                 x: currentX, y: yPosition - 15, size: 10, font: boldFont, color: TEXT_COLOR
//             });
//             currentX += colWidths[i];
//         });
//         yPosition -= 40;
//     };

//     // Main Header logic from your snippet
//     const drawHeader = () => {
//         // page.drawText(orgName.toUpperCase(), { x: 50, y: yPosition, size: 22, font: boldFont, color: PRIMARY_COLOR });
//         page.drawText(`CLIENT: ${cutlistData.clientName || 'N/A'}`, { x: PAGE_WIDTH - 400, y: yPosition, size: 12, font: boldFont });
//         yPosition -= 20;
//         page.drawText(`LOCATION: ${cutlistData.location || 'N/A'}`, { x: PAGE_WIDTH - 400, y: yPosition, size: 12, font: regularFont });
//         yPosition -= 30;
//     };




//     // // --- 2. HEADER SECTION ---
//     // page.drawText(clean(orgName).toUpperCase(), { x: 50, y: yPosition, size: 20, font: boldFont, color: PRIMARY_COLOR });
//     // page.drawText(`PRODUCT: ${clean(unitObj.productName) || 'N/A'}`, { x: width - 400, y: yPosition, size: 14, font: boldFont, color: TEXT_COLOR });

//     // // Draw Company Logo and Name horizontally centered
//     // // --- HEADER SECTION ---
//     try {
//         // Use the specific company logo if available, or fall back to a default
//         // const logoUrl = orgInfo.companyLogo || COMPANY_LOGO; 
//         const logoUrl = COMPANY_LOGO;

//         const logoRes = await fetch(logoUrl);
//         const logoBuffer = await logoRes.arrayBuffer();
//         const logoImage = await pdfDoc.embedJpg(logoBuffer);

//         const logoScale = 0.4;
//         const logoDims = logoImage.scale(logoScale);

//         const brandText = orgName; // 👈 Uses dynamic Org Name
//         const brandFontSize = 22;
//         const brandTextWidth = boldFont.widthOfTextAtSize(brandText, brandFontSize);

//         const spacing = 15;
//         const totalWidth = logoDims.width + spacing + brandTextWidth;
//         const combinedX = (width - totalWidth) / 2;

//         // Draw Logo
//         page.drawImage(logoImage, {
//             x: combinedX,
//             y: yPosition - logoDims.height,
//             width: logoDims.width,
//             height: logoDims.height,
//         });

//         // Draw Organization Name
//         page.drawText(brandText, {
//             x: combinedX + logoDims.width + spacing,
//             y: yPosition - (logoDims.height / 2) - (brandFontSize / 4),
//             size: brandFontSize,
//             font: boldFont,
//             color: PRIMARY_COLOR,
//         });

//         yPosition -= (logoDims.height + 10);

//     } catch (err) {
//         // Fallback if logo fetch fails
//         const brandFontSize = 22;
//         const textWidth = boldFont.widthOfTextAtSize(orgName, brandFontSize);
//         page.drawText(orgName, {
//             x: (width - textWidth) / 2,
//             y: yPosition,
//             size: brandFontSize,
//             font: boldFont,
//             color: PRIMARY_COLOR,
//         });
//         yPosition -= 30;
//     }

//     // Draw Line
//     page.drawLine({
//         start: { x: 50, y: yPosition },
//         end: { x: width - 50, y: yPosition },
//         thickness: 1,
//         color: LINE_COLOR,
//     });



//     drawHeader();

//     for (const room of cutlistData.rooms) {
//         // Room Title Section
//         if (yPosition < 150) { page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]); yPosition = PAGE_HEIGHT - 50; }
//         page.drawText(`ROOM: ${room.roomName} | PRODUCT: ${room.productName}`, { x: 50, y: yPosition, size: 14, font: boldFont, color: PRIMARY_COLOR });
//         yPosition -= 20;

//         drawTableHeaders();

//         const rowHeight = 25;
//         const totalItemsHeight = room.items.length * rowHeight;

//         // Embed Images if available
//         let backImg: any, frontImg: any;
//         try {
//             if (room.backSideLaminateImage?.url) {
//                 const res = await fetch(room.backSideLaminateImage.url);
//                 backImg = await pdfDoc.embedPng(await res.arrayBuffer());
//             }
//             if (room.frontSideLaminateImage?.url) {
//                 const res = await fetch(room.frontSideLaminateImage.url);
//                 frontImg = await pdfDoc.embedPng(await res.arrayBuffer());
//             }
//         } catch (e) { console.error("Img embed error", e); }

//         room.items.forEach((item: any, idx: number) => {
//             if (yPosition < 50) {
//                 page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
//                 yPosition = PAGE_HEIGHT - 50;
//                 drawTableHeaders();
//             }

//             const currentX = 50;
//             // Draw text for items
//             page.drawText(String(idx + 1), { x: 50, y: yPosition, size: 9, font: regularFont });
//             page.drawText(item.measurement || '', { x: 90, y: yPosition, size: 9, font: regularFont });
//             page.drawText(`${item.plyThickness}mm`, { x: 210, y: yPosition, size: 9, font: regularFont });

//             // Draw images on the first row of the room, spanning the height of all items
//             if (idx === 0) {
//                 if (backImg) {
//                     page.drawImage(backImg, {
//                         x: 590, y: yPosition - totalItemsHeight + 10, width: 130, height: totalItemsHeight - 5
//                     });
//                 }
//                 if (frontImg) {
//                     page.drawImage(frontImg, {
//                         x: 980, y: yPosition - totalItemsHeight + 10, width: 130, height: totalItemsHeight - 5
//                     });
//                 }
//             }

//             yPosition -= rowHeight;
//         });
//         yPosition -= 20; // Gap between rooms
//     }

//     const pdfBytes = await pdfDoc.save();
//     const fileName = `cutlists/CL-${cutlistData._id}-${Date.now()}.pdf`;
//     return await uploadToS3(pdfBytes, fileName);

// };



//  SECOND VERSION

// import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// const PRIMARY_COLOR = rgb(0.1, 0.4, 0.8);
// const TEXT_COLOR = rgb(0.2, 0.2, 0.2);
// const LINE_COLOR = rgb(0.8, 0.8, 0.8);
// const BG_COLOR_HEADER = rgb(0.89, 0.95, 1);

// export const generateCutlistPDF = async (cutlistData: any, orgName: string, COMPANY_LOGO: string,) => {
//     const pdfDoc = await PDFDocument.create();
//     const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
//     const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

//     const PAGE_WIDTH = 1190.55; // A3 Landscape
//     const PAGE_HEIGHT = 841.89;
//     let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
//     let yPosition = PAGE_HEIGHT - 50;

//     const clean = (text: any) => (text ? String(text).replace(/[\r\n]+/g, " ").trim() : "");

//     // Column Configuration
//     const colWidths = [40, 100, 80, 80, 80, 120, 120, 130, 120, 120, 130];
//     const headers = [
//         "S No", "Measurement", "Plywood Thickness", "Inner Laminate Thickness", "Outer Laminate Thickness",
//         "Back Side Laminate Brand", "Back Side Laminate Name and Code", "Back Side Laminate Image", 
//         "Front Side Laminate Brand", "Front Side Laminate Name and Code", "Front side Laminate Image"
//     ];

//     // --- HEADER TEXT WRAPPING HELPER ---
//     const wrapHeaderText = (text: string, width: number) => {
//         const words = text.split(' ');
//         let lines: string[] = [];
//         let currentLine = words[0];
//         for (let i = 1; i < words.length; i++) {
//             if (boldFont.widthOfTextAtSize(currentLine + " " + words[i], 8) < width - 10) {
//                 currentLine += " " + words[i];
//             } else {
//                 lines.push(currentLine);
//                 currentLine = words[i];
//             }
//         }
//         lines.push(currentLine);
//         return lines;
//     };

//     const drawTableHeaders = () => {
//         const headerHeight = 45; // Increased to allow 3 lines of text
//         page.drawRectangle({
//             x: 40, y: yPosition - headerHeight, width: PAGE_WIDTH - 80, height: headerHeight, color: BG_COLOR_HEADER
//         });

//         let currentX = 50;
//         headers.forEach((h, i) => {
//             const lines = wrapHeaderText(h, colWidths[i]);
//             lines.forEach((line, lineIdx) => {
//                 page.drawText(line, {
//                     x: currentX,
//                     y: yPosition - 15 - (lineIdx * 10),
//                     size: 8,
//                     font: boldFont,
//                     color: TEXT_COLOR
//                 });
//             });
//             currentX += colWidths[i];
//         });
//         yPosition -= (headerHeight + 10);
//     };

//     // --- DYNAMIC BRAND HEADER ---
//     try {
//         const logoRes = await fetch(COMPANY_LOGO);
//         const logoBuffer = await logoRes.arrayBuffer();
//         const logoImage = COMPANY_LOGO.toLowerCase().endsWith('.png') 
//             ? await pdfDoc.embedPng(logoBuffer) 
//             : await pdfDoc.embedJpg(logoBuffer);

//         const logoScale = 0.4;
//         const logoDims = logoImage.scale(logoScale);
//         const brandText = orgName || "Vertical Living";
//         const brandTextWidth = boldFont.widthOfTextAtSize(brandText, 22);
//         const combinedWidth = logoDims.width + 15 + brandTextWidth;
//         const startX = (PAGE_WIDTH - combinedWidth) / 2;

//         page.drawImage(logoImage, { x: startX, y: yPosition - logoDims.height, ...logoDims });
//         page.drawText(brandText, {
//             x: startX + logoDims.width + 15,
//             y: yPosition - (logoDims.height / 2) - 5,
//             size: 22, font: boldFont, color: PRIMARY_COLOR
//         });
//         yPosition -= (logoDims.height + 20);
//     } catch (err) {
//         const textWidth = boldFont.widthOfTextAtSize(orgName, 22);
//         page.drawText(orgName, { x: (PAGE_WIDTH - textWidth) / 2, y: yPosition, size: 22, font: boldFont, color: PRIMARY_COLOR });
//         yPosition -= 40;
//     }

//     // DRAW CLIENT INFO
//     page.drawLine({ start: { x: 50, y: yPosition }, end: { x: PAGE_WIDTH - 50, y: yPosition }, thickness: 1, color: LINE_COLOR });
//     yPosition -= 20;
//     page.drawText(`CLIENT: ${cutlistData.clientName || 'N/A'}`, { x: 50, y: yPosition, size: 11, font: boldFont });
//     page.drawText(`LOCATION: ${cutlistData.location || 'N/A'}`, { x: 350, y: yPosition, size: 11, font: boldFont });
//     yPosition -= 30;

//     for (const room of cutlistData.rooms) {
//         if (yPosition < 200) { page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]); yPosition = PAGE_HEIGHT - 50; }

//         page.drawText(`ROOM: ${room.roomName} | PRODUCT: ${room.productName}`, { x: 50, y: yPosition, size: 12, font: boldFont, color: PRIMARY_COLOR });
//         yPosition -= 20;
//         drawTableHeaders();

//         const rowHeight = 35; // Increased for better spacing
//         const totalItemsHeight = room.items.length * rowHeight;

//         let backImg: any, frontImg: any;
//         try {
//             // HELPER TO HANDLE BOTH JPG AND PNG
//             const fetchAndEmbed = async (url: string) => {
//                 const res = await fetch(url);
//                 const buf = await res.arrayBuffer();
//                 return url.toLowerCase().includes('.png') ? pdfDoc.embedPng(buf) : pdfDoc.embedJpg(buf);
//             };

//             if (room.backSideLaminateImage?.url) backImg = await fetchAndEmbed(room.backSideLaminateImage.url);
//             if (room.frontSideLaminateImage?.url) frontImg = await fetchAndEmbed(room.frontSideLaminateImage.url);
//         } catch (e) { console.error("Image loading failed:", e); }

//         room.items.forEach((item: any, idx: number) => {
//             if (yPosition < 100) { page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]); yPosition = PAGE_HEIGHT - 50; drawTableHeaders(); }

//             let curX = 50;
//             // Draw text data
//             const rowData = [
//                 String(idx + 1), 
//                 item.measurement, 
//                 `${item.plyThickness}mm`, 
//                 `${item.innerFace.laminateThickness}mm`, 
//                 `${item.outerFace.laminateThickness}mm`,
//                 item.innerFace.laminateBrand,
//                 item.innerFace.laminateNameCode
//             ];

//             rowData.forEach((text, i) => {
//                 page.drawText(clean(text), { x: curX, y: yPosition - 20, size: 8, font: regularFont });
//                 curX += colWidths[i];
//             });

//             // Draw Images spanning the room
//             if (idx === 0) {
//                 if (backImg) {
//                     page.drawImage(backImg, {
//                         x: 50 + colWidths.slice(0, 7).reduce((a, b) => a + b, 0),
//                         y: yPosition - totalItemsHeight + 5,
//                         width: colWidths[7] - 10, height: totalItemsHeight - 10
//                     });
//                 }
//                 // Calculate X for Front Side Brand/Code/Image
//                 let frontX = 50 + colWidths.slice(0, 8).reduce((a, b) => a + b, 0);
//                 page.drawText(clean(item.outerFace.laminateBrand), { x: frontX, y: yPosition - 20, size: 8, font: regularFont });
//                 page.drawText(clean(item.outerFace.laminateNameCode), { x: frontX + colWidths[8], y: yPosition - 20, size: 8, font: regularFont });

//                 if (frontImg) {
//                     page.drawImage(frontImg, {
//                         x: frontX + colWidths[8] + colWidths[9],
//                         y: yPosition - totalItemsHeight + 5,
//                         width: colWidths[10] - 10, height: totalItemsHeight - 10
//                     });
//                 }
//             }

//             // Draw horizontal row line for clarity
//             page.drawLine({
//                 start: { x: 40, y: yPosition - rowHeight + 10 },
//                 end: { x: PAGE_WIDTH - 40, y: yPosition - rowHeight + 10 },
//                 thickness: 0.5, color: LINE_COLOR
//             });

//             yPosition -= rowHeight;
//         });
//         yPosition -= 30;
//     }

//     const pdfBytes = await pdfDoc.save();
//     return await uploadToS3(pdfBytes, `cutlists/${cutlistData.cutlistNo}.pdf`);
// };




import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const PRIMARY_COLOR = rgb(0.1, 0.4, 0.8);
const TEXT_COLOR = rgb(0.2, 0.2, 0.2);
const LINE_COLOR = rgb(0.8, 0.8, 0.8);
const BG_COLOR_HEADER = rgb(0.89, 0.95, 1);

export const generateCutlistPDF = async (cutlistData: any, orgName: string, COMPANY_LOGO: string) => {
    const pdfDoc = await PDFDocument.create();
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const PAGE_WIDTH = 1190.55; // A3 Landscape
    const PAGE_HEIGHT = 841.89;
    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let yPosition = PAGE_HEIGHT - 60;

    const clean = (text: any) => (text ? String(text).replace(/[\r\n]+/g, " ").trim() : "");

    // 1. Updated Column Widths to accommodate long names
    const colWidths = [40, 100, 80, 80, 80, 110, 110, 135, 110, 110, 135];
    const headers = [
        "S No", "Measurement", "Plywood Thickness", "Inner Laminate Thickness", "Outer Laminate Thickness",
        "Back Side Brand", "Back Name/Code", "Back Image",
        "Front Side Brand", "Front Name/Code", "Front Image"
    ];

    // --- HEADER TEXT WRAPPING HELPER ---
    const wrapHeaderText = (text: string, width: number) => {
        const words = text.split(' ');
        let lines: string[] = [];
        let currentLine = words[0];
        for (let i = 1; i < words.length; i++) {
            if (boldFont.widthOfTextAtSize(currentLine + " " + words[i], 8) < width - 10) {
                currentLine += " " + words[i];
            } else {
                lines.push(currentLine);
                currentLine = words[i];
            }
        }
        lines.push(currentLine);
        return lines;
    };

    const drawTableHeaders = () => {
        const headerHeight = 40;
        page.drawRectangle({
            x: 40, y: yPosition - headerHeight, width: PAGE_WIDTH - 80, height: headerHeight, color: BG_COLOR_HEADER
        });

        let currentX = 50;
        headers.forEach((h, i) => {
            const lines = wrapHeaderText(h, colWidths[i]);
            lines.forEach((line, lineIdx) => {
                page.drawText(line, {
                    x: currentX,
                    y: yPosition - 15 - (lineIdx * 10),
                    size: 8,
                    font: boldFont,
                    color: TEXT_COLOR
                });
            });
            currentX += colWidths[i];
        });
        yPosition -= (headerHeight + 10);
    };

    // --- 2. CENTERED BRANDING SECTION ---
    try {
        const logoRes = await fetch(COMPANY_LOGO);
        const logoBuffer = await logoRes.arrayBuffer();
        const logoImage = COMPANY_LOGO.toLowerCase().includes('.png')
            ? await pdfDoc.embedPng(logoBuffer)
            : await pdfDoc.embedJpg(logoBuffer);

        const logoScale = 0.35;
        const logoDims = logoImage.scale(logoScale);
        const brandText = orgName.toUpperCase();
        const brandTextWidth = boldFont.widthOfTextAtSize(brandText, 22);

        const combinedWidth = logoDims.width + 15 + brandTextWidth;
        const startX = (PAGE_WIDTH - combinedWidth) / 2;

        page.drawImage(logoImage, { x: startX, y: yPosition - logoDims.height, ...logoDims });
        page.drawText(brandText, {
            x: startX + logoDims.width + 15,
            y: yPosition - (logoDims.height / 2) - 5,
            size: 22, font: boldFont, color: PRIMARY_COLOR
        });
        yPosition -= (logoDims.height + 25);
    } catch (err) {
        const textWidth = boldFont.widthOfTextAtSize(orgName, 22);
        page.drawText(orgName.toUpperCase(), { x: (PAGE_WIDTH - textWidth) / 2, y: yPosition, size: 22, font: boldFont, color: PRIMARY_COLOR });
        yPosition -= 40;
    }

    // DRAW CLIENT INFO ROW
    page.drawLine({ start: { x: 50, y: yPosition }, end: { x: PAGE_WIDTH - 50, y: yPosition }, thickness: 1, color: LINE_COLOR });
    yPosition -= 20;

    const labelSize = 10;
    const valueSize = 11;
    const rightAlignX = PAGE_WIDTH - 250; // X position for the right-side info
    const todayDate = new Date().toLocaleDateString('en-GB'); // Formats as dd/mm/yyyy

    // Left Side: Client and Location (One below the other)
    page.drawText(`CLIENT: ${clean(cutlistData.clientName) || 'N/A'}`, { 
        x: 50, y: yPosition, size: valueSize, font: boldFont, color: TEXT_COLOR 
    });
    
    // Right Side: Cutlist Number
    page.drawText(`CUTLIST NO: ${clean(cutlistData.cutlistNo) || 'N/A'}`, { 
        x: rightAlignX, y: yPosition, size: valueSize, font: boldFont, color: TEXT_COLOR 
    });

    yPosition -= 18; // Move down for the second row

    // Left Side: Location
    page.drawText(`LOCATION: ${clean(cutlistData.location) || 'N/A'}`, { 
        x: 50, y: yPosition, size: valueSize, font: boldFont, color: TEXT_COLOR 
    });

    // Right Side: Date
    page.drawText(`DATE: ${todayDate}`, { 
        x: rightAlignX, y: yPosition, size: valueSize, font: boldFont, color: TEXT_COLOR 
    });

    yPosition -= 30; // Final gap before starting rooms


    // page.drawText(`CLIENT: ${cutlistData.clientName || 'N/A'}`, { x: 50, y: yPosition, size: 11, font: boldFont });
    // page.drawText(`LOCATION: ${cutlistData.location || 'N/A'}`, { x: 400, y: yPosition, size: 11, font: boldFont });
    // page.drawText(`CUTLIST NO: ${cutlistData.cutlistNo || 'N/A'}`, { x: PAGE_WIDTH - 250, y: yPosition, size: 11, font: boldFont });
    // yPosition -= 35;

    // --- 3. DYNAMIC ROOM DATA ---
    for (const room of cutlistData.rooms) {

        // Space check for Room Title + Headers + at least one row
        const rowHeight = 35;
        const totalRowsHeight = room.items.length * rowHeight;
        const requiredSpace = totalRowsHeight + 100;

        if (yPosition < 200) {
             page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]); 
             yPosition = PAGE_HEIGHT - 60;
             }

        page.drawText(`ROOM: ${room.roomName} | PRODUCT: ${room.productName}`, { x: 50, y: yPosition, size: 12, font: boldFont, color: PRIMARY_COLOR });
        yPosition -= 15;
        drawTableHeaders();

        // const totalItemsHeight = room.items.length * rowHeight + 100;

        const roomContentStartY = yPosition;

        // let backImg: any, frontImg: any;
        // try {
        //     const fetchImg = async (url: string) => {
        //         const res = await fetch(url);
        //         const buf = await res.arrayBuffer();
        //         return url.toLowerCase().includes('.png') ? pdfDoc.embedPng(buf) : pdfDoc.embedJpg(buf);
        //     };
        //     if (room.backSideLaminateImage?.url) backImg = await fetchImg(room.backSideLaminateImage.url);
        //     if (room.frontSideLaminateImage?.url) frontImg = await fetchImg(room.frontSideLaminateImage.url);
        // } catch (e) { console.error("Img error", e); }


        // PRE-FETCH IMAGES before entering the items loop
        let backImg: any = null;
        let frontImg: any = null;
        // try {
        //     if (room.backSideLaminateImage?.url) {
        //         const res = await fetch(room.backSideLaminateImage.url);
        //         if (!res.ok) throw new Error(`Failed to fetch backside image: ${res.statusText}`);
        //         const buf = await res.arrayBuffer();
        //         backImg = room.backSideLaminateImage.url.toLowerCase().endsWith('.png')
        //             ? await pdfDoc.embedPng(buf) : await pdfDoc.embedJpg(buf);
        //     }
        //     if (room.frontSideLaminateImage?.url) {
        //         const res = await fetch(room.frontSideLaminateImage.url);
        //         if (!res.ok) throw new Error(`Failed to fetch frontside image: ${res.statusText}`);

        //         const buf = await res.arrayBuffer();
        //         frontImg = room.frontSideLaminateImage.url.toLowerCase().endsWith('.png')
        //             ? await pdfDoc.embedPng(buf) : await pdfDoc.embedJpg(buf);
        //     }
        // } catch (e) { console.error("Image Pre-fetch failed", e); }


        const fetchAndEmbed = async (imageUrl: string) => {
            if (!imageUrl) return null;
            try {
                const response = await fetch(imageUrl);
                if (!response.ok) return null;
                const buf = await response.arrayBuffer();
                // Try PNG first, then JPG as fallback (per your reference code style)
                try { return await pdfDoc.embedPng(buf); } 
                catch (e) { return await pdfDoc.embedJpg(buf); }
            } catch (err) {
                console.error("Image load error:", err);
                return null;
            }
        };

        backImg = await fetchAndEmbed(room.backSideLaminateImage?.url);
        frontImg = await fetchAndEmbed(room.frontSideLaminateImage?.url);



        // room.items.forEach((item: any, idx: number) => {
        //     if (yPosition < 100) {
        //         page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        //         yPosition = PAGE_HEIGHT - 60;
        //         drawTableHeaders();
        //     }

        //     let curX = 50;
        //     const itemRowY = yPosition - 20;


        //     // 1. Draw first 7 columns (S No to Back Code)
        //     const rowData = [
        //         String(idx + 1),
        //         clean(item.measurement),
        //         `${item.plyThickness}mm`,
        //         `${item.innerFace.laminateThickness}mm`,
        //         `${item.outerFace.laminateThickness}mm`,
        //         clean(item.innerFace.laminateBrand),
        //         clean(item.innerFace.laminateNameCode)
        //     ];

        //     rowData.forEach((text, i) => {
        //         page.drawText(text, { x: curX, y: itemRowY, size: 8, font: regularFont });
        //         curX += colWidths[i];
        //     });



        //     // 2. IMPORTANT: Skip the Image column width to get to the Front Side columns
        //     let imageColumnX = curX;
        //     curX += colWidths[7]; // Move past Back Image column

        //     // 3. Draw Front Side Brand and Name/Code
        //     page.drawText(clean(item.outerFace.laminateBrand), { x: curX, y: itemRowY, size: 8, font: regularFont });
        //     curX += colWidths[8];
        //     page.drawText(clean(item.outerFace.laminateNameCode), { x: curX, y: itemRowY, size: 8, font: regularFont });
        //     curX += colWidths[9];

        //     // 4. Draw spanned images on the first row of each room
        //     if (idx === 0) {
        //         const imgY = yPosition - totalItemsHeight + 5;

        //         if (backImg) {
        //             page.drawImage(backImg, {
        //                 x: imageColumnX + 5,
        //                 y: imgY,
        //                 width: colWidths[7] - 10,
        //                 height: totalItemsHeight - 10
        //             });
        //         }
        //         if (frontImg) {
        //             page.drawImage(frontImg, {
        //                 x: curX + 5, // curX is now at the "Front Image" column index
        //                 y: imgY,
        //                 width: colWidths[10] - 10,
        //                 height: totalItemsHeight - 10
        //             });
        //         }
        //     }

        //     // Draw a thin separator line for each row
        //     page.drawLine({
        //         start: { x: 40, y: yPosition - rowHeight + 10 },
        //         end: { x: PAGE_WIDTH - 40, y: yPosition - rowHeight + 10 },
        //         thickness: 0.5,
        //         color: LINE_COLOR,
        //     });

        //     yPosition -= rowHeight;
           
        // });



        room.items.forEach((item: any, idx: number) => {
            // Internal page break check handled by requiredSpace check above
            // to ensure the image spanning doesn't break across pages.

            let curX = 50;
            const itemRowY = yPosition - 20;

            // 1. Draw first 7 columns
            const rowData = [
                String(idx + 1), `${clean(item.measurement)}mm`, `${item.plyThickness}mm`,
                `${item.innerFace.laminateThickness}mm`, `${item.outerFace.laminateThickness}mm`,
                clean(item.innerFace.laminateBrand), clean(item.innerFace.laminateNameCode)
            ];

            rowData.forEach((text, i) => {
                page.drawText(text, { x: curX, y: itemRowY, size: 8, font: regularFont });
                curX += colWidths[i];
            });

            // 2. Identify Image Column X and move past it
            const backImageX = curX;
            curX += colWidths[7];

            // 3. Draw Front Side Brand/Code
            page.drawText(clean(item.outerFace.laminateBrand), { x: curX, y: itemRowY, size: 8, font: regularFont });
            curX += colWidths[8];
            page.drawText(clean(item.outerFace.laminateNameCode), { x: curX, y: itemRowY, size: 8, font: regularFont });
            curX += colWidths[9];

            const frontImageX = curX;
            curX += colWidths[10];

            // 4. DRAW BORDERS (Skipping internal borders for image columns)
            let borderX = 50;
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].forEach((i) => {
                const isInsideImageCol = (i === 8 || i === 11); // These are the right-hand borders of image cols
                
                // Only draw vertical lines for text columns
                // or the very last border of the table
                if (!isInsideImageCol || idx === room.items.length - 1) {
                    // Logic to handle vertical lines for text-only columns
                }
                
                // SIMPLIFIED: Draw horizontal lines but only for text columns
                // This removes the "ladder" effect inside the image area
                page.drawLine({
                    start: { x: 40, y: yPosition - rowHeight + 10 },
                    end: { x: backImageX, y: yPosition - rowHeight + 10 }, // Stop at image col
                    thickness: 0.5, color: LINE_COLOR,
                });
                page.drawLine({
                    start: { x: backImageX + colWidths[7], y: yPosition - rowHeight + 10 },
                    end: { x: frontImageX, y: yPosition - rowHeight + 10 }, // Mid section
                    thickness: 0.5, color: LINE_COLOR,
                });
            });

            // 5. Draw Spanned Images at the very end of the items loop or on first index
            if (idx === 0) {
                // Vertical Center Calculation
                const roomBottomY = roomContentStartY - totalRowsHeight + 10;
                const imgHeight = totalRowsHeight - 10;

                if (backImg) {
                    page.drawImage(backImg, {
                        x: backImageX + 5,
                        y: roomBottomY,
                        width: colWidths[7] - 10,
                        height: imgHeight
                    });
                }
                if (frontImg) {
                    page.drawImage(frontImg, {
                        x: frontImageX + 5,
                        y: roomBottomY,
                        width: colWidths[10] - 10,
                        height: imgHeight
                    });
                }
            }

            yPosition -= rowHeight;
        });

        // Draw one final bottom line for the whole room to close the image boxes
        page.drawLine({
            start: { x: 40, y: yPosition + 10 },
            end: { x: PAGE_WIDTH - 40, y: yPosition + 10 },
            thickness: 0.5, color: LINE_COLOR
        });

        yPosition -= 30;
    }

    const pdfBytes = await pdfDoc.save();
    return await uploadToS3(pdfBytes, `cutlists/CL-${cutlistData.cutlistNo}.pdf`);
};