// import { PDFDocument, rgb, PDFFont, RGB, StandardFonts } from 'pdf-lib';
// import fontkit from '@pdf-lib/fontkit';
// import axios from 'axios';
// import { IBillNew, ITemplateBill, IBillStyle } from '../../../../models/Department Models/Accounting Model/Bill_New_Accounts_controllers/billNewAccounting.model';

// // --- CONSTANTS ---
// const PAGE_WIDTH = 794;
// const PAGE_HEIGHT = 1123;

// // --- UTILS ---

// const hexToRgb = (hex: string): RGB => {
//     if (!hex) return rgb(0, 0, 0);
//     const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
//     return result
//         ? rgb(parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255)
//         : rgb(0, 0, 0);
// };

// const fetchImage = async (url: string) => {
//     try {
//         const response = await axios.get(url, { responseType: 'arraybuffer' });
//         return response.data;
//     } catch (error) {
//         console.error(`Failed to fetch image at ${url}`);
//         throw new Error(`Image not found: ${url}`);
//     }
// };

// // --- SPLIT TEXT LOGIC (Handles Newlines) ---
// const splitTextToLines = (text: string, maxWidth: number, font: PDFFont, size: number): string[] => {
//     if (!text) return [];

//     const paragraphs = text.toString().replace(/\r/g, '').split('\n');
//     const finalLines: string[] = [];

//     paragraphs.forEach(paragraph => {
//         if (paragraph === '') {
//             finalLines.push(' '); 
//             return;
//         }

//         const words = paragraph.split(' ');
//         let currentLine = words[0];

//         for (let i = 1; i < words.length; i++) {
//             const word = words[i];
//             const width = font.widthOfTextAtSize(currentLine + " " + word, size);
            
//             if (width < maxWidth) {
//                 currentLine += " " + word;
//             } else {
//                 finalLines.push(currentLine);
//                 currentLine = word;
//             }
//         }
//         finalLines.push(currentLine);
//     });
    
//     return finalLines;
// };

// export const generateBillPdf = async (docData: IBillNew | ITemplateBill): Promise<Uint8Array> => {
    
//     const pdfDoc = await PDFDocument.create();
//     pdfDoc.registerFontkit(fontkit);

//     // --- FONT LOADING WITH FALLBACK ---
//     let customFont: PDFFont;
    
//     try {
//         // URL for Roboto Regular (Google Fonts Static CDN - Very Stable)
//         const fontUrl = 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.ttf';
        
//         const fontResponse = await axios.get(fontUrl, { responseType: 'arraybuffer' });
//         customFont = await pdfDoc.embedFont(fontResponse.data);
//     } catch (error) {
//         console.error("⚠️ Failed to load custom font (Roboto). Falling back to Helvetica.", error);
//         // Fallback prevents crash, but Rupee symbol (₹) might not render correctly.
//         customFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
//     }

//     // Standard Bold font for headers (or load Roboto-Bold if you want)
//     const fallbackBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

//     // Create Page
//     const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

//     // --- BACKGROUND IMAGE ---
//     if (docData.pdfData && docData.pdfData.url) {
//         try {
//             if (docData.pdfData.type === 'image') {
//                 const imgBytes = await fetchImage(docData.pdfData.url);
//                 const image = await pdfDoc.embedPng(imgBytes).catch(() => pdfDoc.embedJpg(imgBytes));
//                 page.drawImage(image, { x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT });
//             }
//         } catch (error) {
//             console.error("Background image skipped due to error.");
//         }
//     }

//     // Process Components
//     const components = docData.layout[0]?.components || [];

//     for (const comp of components) {
//         if (!comp.isVisible) continue;

//         const pdfX = comp.x;
        
//         // Determine Font to use based on weight
//         const fontToUse = comp.style.fontWeight === 'bold' ? (customFont ?? fallbackBold) : customFont;

//         // --- TEXT / DATA-FIELD ---
//         if (comp.type === 'text' || comp.type === 'data-field') {
//             const fontSize = comp.style.fontSize || 12;
//             const color = hexToRgb(comp.style.color || '#000000');
//             const bgColor = comp.style.backgroundColor && comp.style.backgroundColor !== 'transparent' 
//                 ? hexToRgb(comp.style.backgroundColor) 
//                 : undefined;
            
//             const content = String(comp.type === 'data-field' ? `${comp.label}: ${comp.value}` : comp.label);
            
//             // Adjust width slightly to prevent edge clipping
//             const width = comp.style.width || 200;
            
//             const lines = splitTextToLines(content, width, fontToUse, fontSize);
            
//             const lineHeight = fontSize * 1.2;
//             const totalTextHeight = lines.length * lineHeight;
//             const startY = PAGE_HEIGHT - comp.y; // Top-left origin conversion

//             // Background
//             if (bgColor) {
//                 page.drawRectangle({
//                     x: pdfX,
//                     // Adjust Y to draw box downwards from top
//                     y: startY - totalTextHeight - 4, 
//                     width: width,
//                     height: totalTextHeight + 8,
//                     color: bgColor
//                 });
//             }

//             // Text Lines
//             lines.forEach((line, i) => {
//                 const lineWidth = fontToUse.widthOfTextAtSize(line, fontSize);
//                 let xOffset = 0;
//                 if(comp.style.textAlign === 'center') xOffset = (width - lineWidth) / 2;
//                 if(comp.style.textAlign === 'right') xOffset = (width - lineWidth);

//                 page.drawText(line, {
//                     x: pdfX + xOffset,
//                     y: startY - ((i + 1) * lineHeight),
//                     size: fontSize,
//                     font: fontToUse,
//                     color: color
//                 });
//             });
//         }

//         // --- IMAGE ---
//         if (comp.type === 'image' && Array.isArray(comp.value) && comp.value.length > 0) {
//             try {
//                 const imageSource = comp.value[0];
//                 let imgBytes;
                
//                 if (imageSource.startsWith('data:image')) {
//                     const base64Data = imageSource.split(',')[1];
//                     imgBytes = Buffer.from(base64Data, 'base64');
//                 } else {
//                     imgBytes = await fetchImage(imageSource);
//                 }

//                 const image = await pdfDoc.embedPng(imgBytes).catch(() => pdfDoc.embedJpg(imgBytes));
//                 const width = comp.style.width || 100;
//                 const height = comp.style.height || 100;

//                 page.drawImage(image, {
//                     x: pdfX,
//                     y: PAGE_HEIGHT - comp.y - height,
//                     width: width,
//                     height: height
//                 });
//             } catch (e) {
//                 console.error("Error embedding component image:", e);
//             }
//         }

//         // --- TABLE ---
//         if (comp.type === 'table' && Array.isArray(comp.value)) {
//             const tableWidth = comp.style.width || 600;
//             const colPercents = comp.columnWidths && comp.columnWidths.length > 0 
//                 ? comp.columnWidths 
//                 : new Array(comp.value[0]?.length || 1).fill(100 / (comp.value[0]?.length || 1));
            
//             const rowHeights = comp.rowHeights || new Array(comp.value.length).fill(30);
//             let currentY = PAGE_HEIGHT - comp.y; 

//             comp.value.forEach((row: any[], rIndex: number) => {
//                 const rowHeight = rowHeights[rIndex] || 30;
//                 let currentX = pdfX;

//                 row.forEach((cellData: any, cIndex: number) => {
//                     const colWidth = (colPercents[cIndex] / 100) * tableWidth;
//                     let content = '';
//                     let cellStyle: Partial<IBillStyle> = {};

//                     if (typeof cellData === 'object' && cellData !== null) {
//                         content = cellData.content || '';
//                         cellStyle = cellData.style || {};
//                     } else {
//                         content = String(cellData);
//                     }

//                     const fontSize = cellStyle.fontSize || comp.style.fontSize || 10;
//                     const cellFont = (cellStyle.fontWeight === 'bold' || comp.style.fontWeight === 'bold') ? (customFont ?? fallbackBold) : customFont;
//                     const textColor = hexToRgb(cellStyle.color || comp.style.color || '#000000');
//                     const bgColor = cellStyle.backgroundColor && cellStyle.backgroundColor !== 'transparent' 
//                         ? hexToRgb(cellStyle.backgroundColor) 
//                         : undefined;
//                     const align = cellStyle.textAlign || comp.style.textAlign || 'left';

//                     // 1. Background
//                     if (bgColor) {
//                         page.drawRectangle({
//                             x: currentX,
//                             y: currentY - rowHeight,
//                             width: colWidth,
//                             height: rowHeight,
//                             color: bgColor,
//                         });
//                     }

//                     // 2. Border
//                     page.drawRectangle({
//                         x: currentX,
//                         y: currentY - rowHeight,
//                         width: colWidth,
//                         height: rowHeight,
//                         borderColor: rgb(0, 0, 0),
//                         borderWidth: 0.5,
//                         color: undefined,
//                     });

//                     // 3. Text
//                     const lines = splitTextToLines(content, colWidth - 4, cellFont, fontSize);
//                     const lineHeight = fontSize * 1.1;
//                     const textBlockHeight = lines.length * lineHeight;
//                     // Top Padding: 4px
//                     const textStartY = currentY - 4 - fontSize; 

//                     lines.forEach((line, lineIdx) => {
//                         const textWidth = cellFont.widthOfTextAtSize(line, fontSize);
//                         let textX = currentX + 2; 

//                         if (align === 'center') textX = currentX + (colWidth - textWidth) / 2;
//                         if (align === 'right') textX = currentX + colWidth - textWidth - 2;

//                         const drawY = textStartY - (lineIdx * lineHeight);
//                         if (drawY > (currentY - rowHeight)) {
//                             page.drawText(line, {
//                                 x: textX,
//                                 y: drawY,
//                                 size: fontSize,
//                                 font: cellFont,
//                                 color: textColor
//                             });
//                         }
//                     });

//                     currentX += colWidth;
//                 });
//                 currentY -= rowHeight;
//             });
//         }
//     }

//     const pdfBytes = await pdfDoc.save();
//     return pdfBytes;
// };




// SECOND VERSION


import { PDFDocument, rgb, PDFFont, RGB, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import axios from 'axios';
import { IBillNew, ITemplateBill, IBillStyle } from '../../../../models/Department Models/Accounting Model/Bill_New_Accounts_controllers/billNewAccounting.model';

// --- CONSTANTS ---
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;

// --- UTILS ---

// Helper to convert Hex to PDF RGB (0-1 range)
const hexToRgb = (hex: string): RGB => {
    if (!hex || hex === 'transparent') return rgb(0, 0, 0);
    
    // Handle short hex #fff
    let fullHex = hex;
    if (hex.length === 4) {
        fullHex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result
        ? rgb(parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255)
        : rgb(0, 0, 0);
};

const fetchImage = async (url: string) => {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch image at ${url}`);
        throw new Error(`Image not found`);
    }
};

const splitTextToLines = (text: string, maxWidth: number, font: PDFFont, size: number): string[] => {
    if (!text) return [];
    const paragraphs = text.toString().replace(/\r/g, '').split('\n');
    const finalLines: string[] = [];

    paragraphs.forEach(paragraph => {
        if (paragraph === '') {
            finalLines.push(' ');
            return;
        }
        const words = paragraph.split(' ');
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = font.widthOfTextAtSize(currentLine + " " + word, size);
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                finalLines.push(currentLine);
                currentLine = word;
            }
        }
        finalLines.push(currentLine);
    });
    return finalLines;
};

export const generateBillPdf = async (docData: IBillNew | ITemplateBill): Promise<Uint8Array> => {
    
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // --- 1. LOAD BOTH REGULAR AND BOLD FONTS ---
    let fontRegular: PDFFont;
    let fontBold: PDFFont;
    
    try {
        // Using Google Fonts CDN for stability
        const [regRes, boldRes] = await Promise.all([
            axios.get('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.ttf', { responseType: 'arraybuffer' }),
            axios.get('https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.ttf', { responseType: 'arraybuffer' })
        ]);

        fontRegular = await pdfDoc.embedFont(regRes.data);
        fontBold = await pdfDoc.embedFont(boldRes.data);
    } catch (error) {
        console.error("⚠️ Failed to load custom fonts. Falling back to Helvetica.", error);
        fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
        fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    }

    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

    // --- DRAW MAIN BACKGROUND ---
    if (docData.pdfData && docData.pdfData.url) {
        try {
            if (docData.pdfData.type === 'image') {
                const imgBytes = await fetchImage(docData.pdfData.url);
                const image = await pdfDoc.embedPng(imgBytes).catch(() => pdfDoc.embedJpg(imgBytes));
                page.drawImage(image, { x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT });
            }
        } catch (e) { console.error("Bg Image Error", e); }
    }

    const components = docData.layout[0]?.components || [];

    for (const comp of components) {
        if (!comp.isVisible) continue;
        const pdfX = comp.x;

        // ==========================================
        // COMPONENT TYPE: TEXT / DATA-FIELD
        // ==========================================
        if (comp.type === 'text' || comp.type === 'data-field') {
            // 1. Resolve Styles
            const fontSize = comp.style.fontSize || 12;
            const isBold = comp.style.fontWeight === 'bold';
            const fontToUse = isBold ? fontBold : fontRegular;
            const color = hexToRgb(comp.style.color || '#000000');
            
            const hasBg = comp.style.backgroundColor && comp.style.backgroundColor !== 'transparent';
            const bgColor = hasBg ? hexToRgb(comp.style.backgroundColor) : undefined;

            const content = String(comp.type === 'data-field' ? `${comp.label}: ${comp.value}` : comp.label);
            const width = comp.style.width || 200;

            const lines = splitTextToLines(content, width, fontToUse, fontSize);
            const lineHeight = fontSize * 1.2;
            const totalTextHeight = lines.length * lineHeight;
            const startY = PAGE_HEIGHT - comp.y;

            // 2. Draw Background (First)
            if (bgColor) {
                page.drawRectangle({
                    x: pdfX,
                    y: startY - totalTextHeight - 4, // Add padding
                    width: width,
                    height: totalTextHeight + 8,
                    color: bgColor
                });
            }

            // 3. Draw Text (Last)
            lines.forEach((line, i) => {
                const lineWidth = fontToUse.widthOfTextAtSize(line, fontSize);
                let xOffset = 0;
                if(comp.style.textAlign === 'center') xOffset = (width - lineWidth) / 2;
                if(comp.style.textAlign === 'right') xOffset = (width - lineWidth);

                page.drawText(line, {
                    x: pdfX + xOffset,
                    y: startY - ((i + 1) * lineHeight),
                    size: fontSize,
                    font: fontToUse,
                    color: color
                });
            });
        }

        // ==========================================
        // COMPONENT TYPE: IMAGE
        // ==========================================
        if (comp.type === 'image' && Array.isArray(comp.value) && comp.value.length > 0) {
            try {
                const imageSource = comp.value[0];
                let imgBytes;
                if (imageSource.startsWith('data:image')) {
                    imgBytes = Buffer.from(imageSource.split(',')[1], 'base64');
                } else {
                    imgBytes = await fetchImage(imageSource);
                }
                const image = await pdfDoc.embedPng(imgBytes).catch(() => pdfDoc.embedJpg(imgBytes));
                page.drawImage(image, {
                    x: pdfX,
                    y: PAGE_HEIGHT - comp.y - (comp.style.height || 100),
                    width: comp.style.width || 100,
                    height: comp.style.height || 100
                });
            } catch (e) { console.error("Image Embed Error", e); }
        }

        // ==========================================
        // COMPONENT TYPE: TABLE
        // ==========================================
        if (comp.type === 'table' && Array.isArray(comp.value)) {
            const tableWidth = comp.style.width || 600;
            const colPercents = comp.columnWidths || new Array(comp.value[0]?.length || 1).fill(100);
            const rowHeights = comp.rowHeights || new Array(comp.value.length).fill(30);
            
            let currentY = PAGE_HEIGHT - comp.y;

            comp.value.forEach((row: any[], rIndex: number) => {
                const rowHeight = rowHeights[rIndex] || 30;
                let currentX = pdfX;

                row.forEach((cellData: any, cIndex: number) => {
                    const colWidth = (colPercents[cIndex] / 100) * tableWidth;

                    // --- A. RESOLVE CELL DATA & STYLES ---
                    let content = '';
                    let cellStyle: Partial<IBillStyle> = {};

                    if (typeof cellData === 'object' && cellData !== null) {
                        content = cellData.content || '';
                        cellStyle = cellData.style || {};
                    } else {
                        content = String(cellData);
                    }

                    // Merge Styles (Cell > Component Global > Default)
                    const fontSize = cellStyle.fontSize || comp.style.fontSize || 10;
                    const isBold = (cellStyle.fontWeight === 'bold') || (comp.style.fontWeight === 'bold');
                    const fontToUse = isBold ? fontBold : fontRegular;
                    
                    const textColorHex = cellStyle.color || comp.style.color || '#000000';
                    const textColor = hexToRgb(textColorHex);

                    const bgHex = cellStyle.backgroundColor || 'transparent';
                    const hasBg = bgHex !== 'transparent';
                    const bgColor = hasBg ? hexToRgb(bgHex) : undefined;

                    const align = cellStyle.textAlign || comp.style.textAlign || 'left';

                    // --- B. DRAW BACKGROUND (First Layer) ---
                    if (bgColor) {
                        page.drawRectangle({
                            x: currentX,
                            y: currentY - rowHeight, // Bottom-left of cell
                            width: colWidth,
                            height: rowHeight,
                            color: bgColor,
                        });
                    }

                    // --- C. DRAW BORDER (Second Layer) ---
                    page.drawRectangle({
                        x: currentX,
                        y: currentY - rowHeight,
                        width: colWidth,
                        height: rowHeight,
                        borderColor: rgb(0, 0, 0),
                        borderWidth: 0.5,
                        color: undefined, // Transparent fill
                    });

                    // --- D. DRAW TEXT (Top Layer) ---
                    const lines = splitTextToLines(content, colWidth - 6, fontToUse, fontSize);
                    const lineHeight = fontSize * 1.15;
                    // const textBlockHeight = lines.length * lineHeight;
                    
                    // Padding top: 4px
                    const textStartY = currentY - 4 - fontSize; 

                    lines.forEach((line, lineIdx) => {
                        const textWidth = fontToUse.widthOfTextAtSize(line, fontSize);
                        let textX = currentX + 3; // Left Padding

                        if (align === 'center') textX = currentX + (colWidth - textWidth) / 2;
                        if (align === 'right') textX = currentX + colWidth - textWidth - 3;

                        // Clip text if it exceeds row height
                        const drawY = textStartY - (lineIdx * lineHeight);
                        if (drawY > (currentY - rowHeight + 2)) {
                            page.drawText(line, {
                                x: textX,
                                y: drawY,
                                size: fontSize,
                                font: fontToUse,
                                color: textColor
                            });
                        }
                    });

                    currentX += colWidth;
                });
                currentY -= rowHeight;
            });
        }
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
};