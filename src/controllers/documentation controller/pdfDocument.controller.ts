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
    const COMPANY_LOGO = "https://th.bing.com/th/id/OIP.Uparc9uI63RDb82OupdPvwAAAA?w=80&h=80&c=1&bgcl=c77779&r=0&o=6&dpr=1.3&pid=ImgRC";

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const SECTION_GAP = 30; // pixels of vertical space between sections

    let cursorY = height - 20;

     // Embed company logo and name centered at top
 try {
    const logoRes = await fetch(COMPANY_LOGO);
    const logoBuffer = await logoRes.arrayBuffer();
    const logoImage = await pdfDoc.embedJpg(logoBuffer);

    const logoScale = 0.5;
    const logoDims = logoImage.scale(logoScale);

    const brandText = "Vertical Living";
    const brandFontSize = 20;
    const brandColor = rgb(0.1, 0.4, 0.9);
    const brandTextWidth = fontBold.widthOfTextAtSize(brandText, brandFontSize);

    const spacing = 10; // space between logo and text

    // Total width = logo + spacing + text
    const totalWidth = logoDims.width + spacing + brandTextWidth;

    // X and Y to center the whole block horizontally and set a top margin
    const combinedX = (width - totalWidth) / 2;
    const topY = cursorY; // use existing cursorY for vertical positioning

    // Draw logo
    page.drawImage(logoImage, {
        x: combinedX,
        y: topY - logoDims.height,
        width: logoDims.width,
        height: logoDims.height,
    });

    // Align text vertically with logo (visually aligned mid-way)
    const textY = topY - (logoDims.height / 2) - (brandFontSize / 3);

    // Draw text next to logo
    page.drawText(brandText, {
        x: combinedX + logoDims.width + spacing,
        y: textY,
        size: brandFontSize,
        font: fontBold,
        color: brandColor,
    });

    // Update cursorY to be below the logo
    cursorY = topY - logoDims.height - 5;

    // Draw horizontal line
    page.drawLine({
        start: { x: 50, y: cursorY },
        end: { x: width - 50, y: cursorY },
        thickness: 1,
        color: rgb(0.6, 0.6, 0.6),
    });

    cursorY -= 30;
} catch (err) {
    console.error("Failed to load company logo:", err);
}

    // Title (centered)
   const title = `Stage: ${stageKey} (Stage ${stageNumber})`;
    page.drawText(title, {
        x: 50,
        y: cursorY,
        size: 16,
        font: fontBold,
        color: rgb(0, 0, 0),
    });
    cursorY -= 30;

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
        page.drawText(`Price: ${price} INR`, {
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

    // cursorY -= SECTION_GAP
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
