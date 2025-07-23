// import { PDFDocument, PDFName, rgb, StandardFonts } from "pdf-lib";

// export const generateStagePDF = async ({
//     stageKey,
//     stageNumber,
//     description,
//     uploadedFiles,
//     price,
// }: {
//     stageKey: string;
//     stageNumber: string;
//     description: string;
//     uploadedFiles: { type: "image" | "pdf", url: string; originalName: string }[];
//     price?: number | null;
// }): Promise<Uint8Array> => {
//     const pdfDoc = await PDFDocument.create();
//     const page = pdfDoc.addPage();
//     const { width, height } = page.getSize();
//     const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

//     let cursorY = height - 50;

//     // Title
//     page.drawText(`Stage: ${stageKey} (Stage ${stageNumber})`, {
//         x: 50, y: cursorY, size: 18, font, color: rgb(0, 0, 0),
//     });
//     cursorY -= 30;

//     // Description
//     if (description) {
//         page.drawText(`Description: ${description}`, {
//             x: 50, y: cursorY, size: 12, font, color: rgb(0.1, 0.1, 0.1),
//         });
//         cursorY -= 20;
//     }

//     // Price (for stages 6 or 7 only)
//     if ((stageNumber === "6" || stageNumber === "7") && price !== null) {
//         page.drawText(`Price: ₹${price}`, {
//             x: 50, y: cursorY, size: 12, font, color: rgb(0.1, 0.1, 0.1),
//         });
//         cursorY -= 20;
//     }

//     // Embed images
//     for (const file of uploadedFiles) {
//         if (file.type === "image") {
//             try {
//                 const imgRes = await fetch(file.url);
//                 const imgBuffer = await imgRes.arrayBuffer();
//                 let img;
//                 if (file.url.endsWith(".jpg") || file.url.endsWith(".jpeg") || file.url.endsWith(".png")) {
//                     img = await pdfDoc.embedJpg(imgBuffer);
//                 } else {
//                     img = await pdfDoc.embedPng(imgBuffer);
//                 }

//                 const imgDims = img.scale(0.4);
//                 if (cursorY - imgDims.height < 50) {
//                     // Add new page if no room
//                     const newPage = pdfDoc.addPage();
//                     cursorY = height - 50;
//                     newPage.drawImage(img, {
//                         x: 50,
//                         y: cursorY - imgDims.height,
//                         width: imgDims.width,
//                         height: imgDims.height,
//                     });
//                     cursorY -= imgDims.height + 20;
//                 } else {
//                     page.drawImage(img, {
//                         x: 50,
//                         y: cursorY - imgDims.height,
//                         width: imgDims.width,
//                         height: imgDims.height,
//                     });
//                     cursorY -= imgDims.height + 20;
//                 }
//             } catch (err) {
//                 console.error(`Failed to embed image: ${file.url}`, err);
//             }
//         } else if (file.type === "pdf") {
//             const linkText = file.originalName || "View PDF";
//             const textSize = 12;
//             const textWidth = font.widthOfTextAtSize(linkText, textSize);

//             if (cursorY < 60) {
//                 pdfDoc.addPage();
//                 cursorY = height - 50;
//             }

//             // Draw text
//             page.drawText(linkText, {
//                 x: 50,
//                 y: cursorY,
//                 size: textSize,
//                 font,
//                 color: rgb(0, 0, 1),
//             });

//             // Add link annotation (manually)
//             const annotationDict = pdfDoc.context.obj({
//                 Type: "Annot",
//                 Subtype: "Link",
//                 Rect: [50, cursorY, 50 + textWidth, cursorY + 14],
//                 Border: [0, 0, 0],
//                 A: {
//                     Type: "Action",
//                     S: "URI",
//                     URI: file.url,
//                 },
//             });

//             const annotationRef = pdfDoc.context.register(annotationDict);
//             page.node.set(PDFName.of("Annots"), pdfDoc.context.obj([annotationRef]));

//             cursorY -= 20;
//         }
//     }

//     return await pdfDoc.save();
// };





import { PDFArray, PDFDocument, PDFName, PDFString, rgb, StandardFonts } from "pdf-lib";

export const generateStagePDF = async ({
    stageKey,
    stageNumber,
    description,
    uploadedFiles,
    price,
}: {
    stageKey: string;
    stageNumber: string;
    description: string;
    uploadedFiles: { type: "image" | "pdf", url: string; originalName: string }[];
    price?: number | null;
}): Promise<Uint8Array> => {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let cursorY = height - 50;

    // Title (centered)
    const title = `Stage: ${stageKey} (Stage ${stageNumber})`;
    const titleWidth = fontBold.widthOfTextAtSize(title, 18);
    page.drawText(title, {
        x: (width - titleWidth) / 2,
        y: cursorY,
        size: 18,
        font: fontBold,
        color: rgb(0, 0, 0),
    });
    cursorY -= 40;

    // Description Section
    if (description) {
        page.drawText("Description:", {
            x: 50, y: cursorY, size: 14, font: fontBold, color: rgb(0.1, 0.1, 0.1),
        });
        cursorY -= 20;

        const wrapped = wrapText(description, 80);
        for (const line of wrapped) {
            page.drawText(line, {
                x: 60, y: cursorY, size: 12, font, color: rgb(0.1, 0.1, 0.1),
            });
            cursorY -= 15;
        }
        cursorY -= 10;
    }

    // Price (only for stages 6 and 7)
    if ((stageNumber === "6" || stageNumber === "7") && price !== null) {
        page.drawText(`Price: ₹${price}`, {
            x: 50, y: cursorY, size: 12, font: fontBold, color: rgb(0.2, 0.2, 0.2),
        });
        cursorY -= 30;
    }



    // Image Section Heading
    const images = uploadedFiles.filter(f => f.type === "image");
    if (images.length > 0) {
        page.drawText("Images:", {
            x: 50, y: cursorY, size: 14, font: fontBold, color: rgb(0.2, 0.2, 0.2),
        });
        cursorY -= 20;

        const imagesPerRow = 3;
        const imgSpacing = 10;
        const imgMaxWidth = (width - 100 - (imagesPerRow - 1) * imgSpacing) / imagesPerRow;
        let imgIndex = 0;

        for (const imgFile of images) {
            try {
                const res = await fetch(imgFile.url);
                const buffer = await res.arrayBuffer();
                const fileType = imgFile.url.toLowerCase();

                let image;
                if (fileType.endsWith(".png")) {
                    image = await pdfDoc.embedPng(buffer);
                } else if (fileType.endsWith(".jpg") || fileType.endsWith(".jpeg")) {
                    image = await pdfDoc.embedJpg(buffer);
                } else {
                    // console.warn("Unsupported image type:", imgFile.url);
                    continue;
                }

                const scaled = image.scaleToFit(imgMaxWidth, 100);

                const x = 50 + (imgIndex % imagesPerRow) * (imgMaxWidth + imgSpacing);
                const y = cursorY - scaled.height;

                if (y < 60) {
                    cursorY = height - 50;
                    pdfDoc.addPage();
                    continue;
                }

                page.drawImage(image, {
                    x, y, width: scaled.width, height: scaled.height,
                });

                imgIndex++;
                if (imgIndex % imagesPerRow === 0) {
                    cursorY = y - 20;
                }
            } catch (err) {
                console.error("Failed to embed image:", imgFile.url, err);
            }
        }

        // Push cursor below last image row if needed
        if (imgIndex % imagesPerRow !== 0) {
            cursorY -= 120;
        }
    }

    // PDF Section
    const pdfFiles = uploadedFiles.filter(f => f.type === "pdf");
    if (pdfFiles.length > 0) {
        if (cursorY < 100) {
            pdfDoc.addPage();
            cursorY = height - 50;
        }

        page.drawText("PDFs:", {
            x: 50, y: cursorY, size: 14, font: fontBold, color: rgb(0.2, 0.2, 0.2),
        });
        cursorY -= 20;

        for (const pdf of pdfFiles) {
            const linkText = pdf.originalName || "View PDF";
            const textSize = 12;
            const textWidth = font.widthOfTextAtSize(linkText, textSize);
            const textHeight = font.heightAtSize(textSize);

            const requiredHeight = 20;

            // Only create a new page if not enough space left
            if (cursorY - requiredHeight < 50) {
                page = pdfDoc.addPage();
                cursorY = height - 50;
            }

            // Draw link text
            page.drawText(linkText, {
                x: 50,
                y: cursorY,
                size: textSize,
                font,
                color: rgb(0, 0, 1),
            });

            // Create clickable area
            const linkRect = [50, cursorY, 50 + textWidth, cursorY + textHeight];

            console.log("pdf", pdf.url)
            const link = pdfDoc.context.obj({
                Type: PDFName.of("Annot"),
                Subtype: PDFName.of("Link"),
                Rect: linkRect,
                Border: [0, 0, 0],
                A: pdfDoc.context.obj({
                    Type: PDFName.of("Action"),
                    S: PDFName.of("URI"),
                    URI: PDFString.of(pdf.url),
                }),
            });

            const linkRef = pdfDoc.context.register(link);

            let annots = page.node.get(PDFName.of("Annots")) as PDFArray;
            if (!annots) {
                annots = pdfDoc.context.obj([]) as PDFArray;
                page.node.set(PDFName.of("Annots"), annots);
            }

            annots.push(linkRef);

            // Move cursor down for next link
            cursorY -= requiredHeight;
        }
    }

    return await pdfDoc.save();
};

// Helper: Wrap text for long descriptions
function wrapText(text: string, maxLineLength: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
        if ((currentLine + word).length < maxLineLength) {
            currentLine += word + " ";
        } else {
            lines.push(currentLine.trim());
            currentLine = word + " ";
        }
    }
    if (currentLine) lines.push(currentLine.trim());
    return lines;
}
