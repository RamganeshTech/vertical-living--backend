// import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
// import { COMPANY_LOGO, uploadToS3 } from "../ordering material controller/pdfOrderHistory.controller";
// import { ShortlistedDesignModel } from "../../../models/Stage Models/sampleDesing model/shortListed.model";

// export const generateShortlistPdf = async ({ doc }: { doc: any }) => {
//   try {
//     const pdfDoc = await PDFDocument.create();
//     let page = pdfDoc.addPage([595, 842]); // A4 Portrait
//     const { width, height } = page.getSize();

//     // Load fonts
//     const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
//     const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

//     let yPosition = height - 50;
//     const margin = 50;
//     const contentWidth = width - (margin * 2);

//     // Fixed image dimensions
//     const FIXED_IMAGE_WIDTH = 400;
//     const FIXED_IMAGE_HEIGHT = 250; // Reduced height for site images
//     const REF_IMAGE_HEIGHT = 150; // Smaller height for reference images

//     // Company Logo and Name Section
//     try {
//       const logoRes = await fetch(COMPANY_LOGO);
//       const logoBuffer = await logoRes.arrayBuffer();
//       const logoImage = await pdfDoc.embedJpg(logoBuffer);

//       const logoScale = 0.5;
//       const logoDims = logoImage.scale(logoScale);

//       const brandText = "Vertical Living";
//       const brandFontSize = 20;
//       const brandColor = rgb(0.1, 0.4, 0.9);
//       const brandTextWidth = boldFont.widthOfTextAtSize(brandText, brandFontSize);

//       const spacing = 10;
//       const totalWidth = logoDims.width + spacing + brandTextWidth;
//       const combinedX = (width - totalWidth) / 2;
//       const topY = yPosition;

//       // Draw logo
//       page.drawImage(logoImage, {
//         x: combinedX,
//         y: topY - logoDims.height,
//         width: logoDims.width,
//         height: logoDims.height,
//       });

//       // Draw text next to logo
//       const textY = topY - (logoDims.height / 2) - (brandFontSize / 3);
//       page.drawText(brandText, {
//         x: combinedX + logoDims.width + spacing,
//         y: textY,
//         size: brandFontSize,
//         font: boldFont,
//         color: brandColor,
//       });

//       yPosition = topY - logoDims.height - 5;

//       // Draw horizontal line
//       page.drawLine({
//         start: { x: 50, y: yPosition },
//         end: { x: width - 50, y: yPosition },
//         thickness: 1,
//         color: rgb(0.6, 0.6, 0.6),
//       });

//       yPosition -= 30;
//     } catch (err) {
//       console.error("Failed to load company logo:", err);
//       yPosition -= 50;
//     }

//     // Project name and heading section
//     const projectName = doc?.projectId?.projectName || "Project";
//     const projectLabel = "Project:";
//     const headingText = "Selected Designs";

//     // Measure widths
//     const headingWidth = boldFont.widthOfTextAtSize(headingText, 20);
//     const projectLabelWidth = regularFont.widthOfTextAtSize(projectLabel, 16);
//     const projectNameWidth = boldFont.widthOfTextAtSize(projectName, 16);

//     // Y position for both (same line)
//     const lineY = yPosition;

//     // Left side: Heading
//     page.drawText(headingText, {
//       x: margin,
//       y: lineY,
//       size: 20,
//       font: boldFont,
//       color: rgb(0.1, 0.1, 0.5),
//     });

//     // Right side: Project label + name
//     const rightBlockWidth = projectLabelWidth + projectNameWidth + 5;
//     const rightStartX = page.getWidth() - margin - rightBlockWidth;

//     page.drawText(projectLabel, {
//       x: rightStartX,
//       y: lineY,
//       size: 16,
//       font: regularFont,
//       color: rgb(128 / 255, 128 / 255, 128 / 255),
//     });

//     page.drawText(projectName, {
//       x: rightStartX + projectLabelWidth + 5,
//       y: lineY,
//       size: 16,
//       font: boldFont,
//       color: rgb(0, 0, 0),
//     });

//     yPosition -= 40;


//     // Process each room shortlist with serial numbers
//     for (let roomIndex = 0; roomIndex < doc?.shortListedDesigns?.length; roomIndex++) {
//       const room = doc.shortListedDesigns[roomIndex];

//       // Calculate required height for this room section
//       const roomSectionHeight = calculateRoomSectionHeight(room, FIXED_IMAGE_HEIGHT, REF_IMAGE_HEIGHT);

//       // Check if we need a new page before starting this room section
//       // if (yPosition - roomSectionHeight < 100) {
//       //   page = pdfDoc.addPage([595, 842]);
//       //   yPosition = height - 50;
//       // }

//       if (yPosition - (FIXED_IMAGE_HEIGHT + 30) < 100) {
//         page = pdfDoc.addPage([595, 842]);
//         yPosition = height - 50;
//       }

//       // Site Image Section with serial number
//       if (room?.siteImage && room?.siteImage.url) {
//         try {
//           const siteImageRes = await fetch(room?.siteImage?.url);
//           const siteImageBuffer = await siteImageRes.arrayBuffer();
//           let siteImage;

//           if (room.siteImage.type === "image" || room.siteImage.url.toLowerCase().endsWith('.jpg') || room.siteImage.url.toLowerCase().endsWith('.jpeg')) {
//             siteImage = await pdfDoc.embedJpg(siteImageBuffer);
//           } else {
//             siteImage = await pdfDoc.embedPng(siteImageBuffer);
//           }

//           // Scale image to fit fixed dimensions while maintaining aspect ratio
//           const scale = Math.min(
//             FIXED_IMAGE_WIDTH / siteImage.width,
//             FIXED_IMAGE_HEIGHT / siteImage.height
//           );

//           const scaledWidth = siteImage.width * scale;
//           const scaledHeight = siteImage.height * scale;

//           // Center the image within the fixed dimensions
//           const xOffset = (FIXED_IMAGE_WIDTH - scaledWidth) / 2;
//           const yOffset = (FIXED_IMAGE_HEIGHT - scaledHeight) / 2;

//           // Draw site image label with serial number
//           const siteImageLabel = `${roomIndex + 1}. Site Image`;
//           page.drawText(siteImageLabel, {
//             x: margin,
//             y: yPosition,
//             size: 14,
//             font: boldFont,
//             color: rgb(0, 0, 0),
//           });

//           yPosition -= 25;

//           // Draw site image centered
//           const imageX = margin + (contentWidth - FIXED_IMAGE_WIDTH) / 2;
//           page.drawImage(siteImage, {
//             x: imageX + xOffset,
//             y: yPosition - FIXED_IMAGE_HEIGHT + yOffset,
//             width: scaledWidth,
//             height: scaledHeight,
//           });

//           yPosition -= FIXED_IMAGE_HEIGHT + 20;
//         } catch (err) {
//           console.error("Failed to load site image:", err);
//           const siteImageLabel = `${roomIndex + 1}. Site Image: Unable to load`;
//           page.drawText(siteImageLabel, {
//             x: margin,
//             y: yPosition,
//             size: 12,
//             font: regularFont,
//             color: rgb(0.8, 0, 0),
//           });
//           yPosition -= 30;
//         }
//       }

//       // Reference Images Section with serial numbers
//       if (room?.referenceImages && room?.referenceImages?.length > 0) {
//         // Check if we have enough space for reference images label
//         if (yPosition < 150) {
//           page = pdfDoc.addPage([595, 842]);
//           yPosition = height - 50;
//         }

//         // Draw reference images label
//         page.drawText("Reference Images:", {
//           x: margin,
//           y: yPosition,
//           size: 14,
//           font: boldFont,
//           color: rgb(0, 0, 0),
//         });

//         yPosition -= 30;

//         const imagesPerRow = 2;
//         const horizontalSpacing = 30;
//         const verticalSpacing = 40;
//         const imageWidth = (contentWidth - (imagesPerRow - 1) * horizontalSpacing) / imagesPerRow;
//         let currentX = margin;
//         let rowCount = 0;

//         for (let i = 0; i < room?.referenceImages?.length; i++) {
//           const refImage = room?.referenceImages[i];

//           // Check if we need a new row
//           if (rowCount >= imagesPerRow) {
//             rowCount = 0;
//             currentX = margin;
//             yPosition -= REF_IMAGE_HEIGHT + verticalSpacing;

//             // Check if we need a new page for the next row
//             if (yPosition - REF_IMAGE_HEIGHT < 100) {
//               page = pdfDoc.addPage([595, 842]);
//               yPosition = height - 50;
//               currentX = margin;

//               // Add reference images label on new page
//               page.drawText("Reference Images (continued):", {
//                 x: margin,
//                 y: yPosition,
//                 size: 14,
//                 font: boldFont,
//                 color: rgb(0, 0, 0),
//               });
//               yPosition -= 30;
//             }
//           }

//           // Check if current image can fit in current row
//           if (yPosition - REF_IMAGE_HEIGHT < 50) {
//             page = pdfDoc.addPage([595, 842]);
//             yPosition = height - 50;
//             currentX = margin;
//             rowCount = 0;

//             // Add reference images label on new page
//             page.drawText("Reference Images (continued):", {
//               x: margin,
//               y: yPosition,
//               size: 14,
//               font: boldFont,
//               color: rgb(0, 0, 0),
//             });
//             yPosition -= 30;
//           }

//           try {
//             const refImageRes = await fetch(refImage?.url);
//             const refImageBuffer = await refImageRes.arrayBuffer();
//             let image;

//             if (refImage.type === "image" || refImage?.url.toLowerCase().endsWith('.jpg') || refImage.url.toLowerCase().endsWith('.jpeg')) {
//               image = await pdfDoc.embedJpg(refImageBuffer);
//             } else {
//               image = await pdfDoc.embedPng(refImageBuffer);
//             }

//             // Scale image to fit fixed dimensions while maintaining aspect ratio
//             const scale = Math.min(
//               imageWidth / image.width,
//               REF_IMAGE_HEIGHT / image.height
//             );

//             const scaledWidth = image.width * scale;
//             const scaledHeight = image.height * scale;

//             // Center the image within the fixed dimensions
//             const xOffset = (imageWidth - scaledWidth) / 2;
//             const yOffset = (REF_IMAGE_HEIGHT - scaledHeight) / 2;

//             // Draw reference image centered
//             page.drawImage(image, {
//               x: currentX + xOffset,
//               y: yPosition - REF_IMAGE_HEIGHT + yOffset,
//               width: scaledWidth,
//               height: scaledHeight,
//             });

//             // Draw serial number for reference image with better spacing
//             const refNumber = `${roomIndex + 1}.${i + 1}`;
//             const numberWidth = regularFont.widthOfTextAtSize(refNumber, 11);
//             page.drawText(refNumber, {
//               x: currentX + (imageWidth / 2) - (numberWidth / 2),
//               y: yPosition - REF_IMAGE_HEIGHT - 20,
//               size: 11,
//               font: boldFont,
//               color: rgb(0.3, 0.3, 0.3),
//             });

//             currentX += imageWidth + horizontalSpacing;
//             rowCount++;
//           } catch (err) {
//             console.error("Failed to load reference image:", err);
//             // Draw placeholder for failed image
//             page.drawRectangle({
//               x: currentX,
//               y: yPosition - REF_IMAGE_HEIGHT,
//               width: imageWidth,
//               height: REF_IMAGE_HEIGHT,
//               color: rgb(0.95, 0.95, 0.95),
//               borderColor: rgb(0.7, 0.7, 0.7),
//               borderWidth: 1,
//             });

//             // Draw serial number for failed image
//             const refNumber = `${roomIndex + 1}.${i + 1}`;
//             const numberWidth = regularFont.widthOfTextAtSize(refNumber, 11);
//             page.drawText(refNumber, {
//               x: currentX + (imageWidth / 2) - (numberWidth / 2),
//               y: yPosition - REF_IMAGE_HEIGHT - 20,
//               size: 11,
//               font: boldFont,
//               color: rgb(0.3, 0.3, 0.3),
//             });

//             page.drawText("Unavailable", {
//               x: currentX + (imageWidth / 2) - (regularFont.widthOfTextAtSize("Unavailable", 9) / 2),
//               y: yPosition - REF_IMAGE_HEIGHT / 2,
//               size: 9,
//               font: regularFont,
//               color: rgb(0.5, 0.5, 0.5),
//             });

//             currentX += imageWidth + horizontalSpacing;
//             rowCount++;
//           }
//         }

//         // Update yPosition after all reference images
//         yPosition -= REF_IMAGE_HEIGHT + 30;
//       }

//       // Add space between rooms (only if there's another room coming)
//       if (roomIndex < doc.shortListedDesigns.length - 1) {
//         yPosition -= 30;

//         // Add a separator line between rooms if there's space
//         if (yPosition > 60) {
//           page.drawLine({
//             start: { x: margin, y: yPosition },
//             end: { x: width - margin, y: yPosition },
//             thickness: 0.5,
//             color: rgb(0.9, 0.9, 0.9),
//           });
//           yPosition -= 40;
//         }
//       }
//     }

//     // Helper function to calculate required height for a room section
//     function calculateRoomSectionHeight(room: any, siteImageHeight: number, refImageHeight: number): number {
//       let height = 0;

//       // Site image section height
//       if (room?.siteImage) {
//         height += 25 + siteImageHeight + 20; // Label + image + spacing
//       }

//       // Reference images section height
//       if (room?.referenceImages && room.referenceImages.length > 0) {
//         height += 30; // "Reference Images:" label

//         const imagesPerRow = 2;
//         const rows = Math.ceil(room.referenceImages.length / imagesPerRow);
//         height += rows * (refImageHeight + 40); // Each row height + spacing

//         height += 30; // Final spacing after reference images
//       }

//       // Room separator
//       height += 30;

//       return height;
//     }

//     // Finalize PDF
//     const pdfBytes = await pdfDoc.save();

//     // Upload to S3
//     const safeProjectName = projectName.replace(/[^a-zA-Z0-9]/g, '-');
//     const fileName = `shortlisted-designs-${safeProjectName}-${Date.now()}.pdf`;
//     const uploadResult = await uploadToS3(pdfBytes, fileName);

//     // Update the document with the PDF link
//     await ShortlistedDesignModel.findByIdAndUpdate(doc._id, {
//       pdfLink: {
//         type: "pdf",
//         url: uploadResult.Location,
//         originalName: fileName,
//         uploadedAt: new Date(),
//       }
//     });

//     return {
//       url: uploadResult.Location,
//       pdfName: fileName,
//     };
//   } catch (error: any) {
//     console.error("Error generating PDF:", error);
//     throw error;
//   }
// };




import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { COMPANY_LOGO, uploadToS3 } from "../ordering material controller/pdfOrderHistory.controller";
import { ShortlistedDesignModel } from "../../../models/Stage Models/sampleDesing model/shortListed.model";

export const generateShortlistPdf = async ({ doc }: { doc: any }) => {
  try {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();

    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const margin = 50;
    const contentWidth = width - (margin * 2);
    let yPosition = height - 60;

    // Layout Constants
    const SITE_IMG_WIDTH = contentWidth * 0.8; // Large Site Image (80% width)
    const SITE_IMG_HEIGHT = 220;

    const REF_IMAGES_PER_ROW = 3;
    const GRID_GAP = 15;
    const REF_IMG_WIDTH = (contentWidth - (GRID_GAP * (REF_IMAGES_PER_ROW - 1))) / REF_IMAGES_PER_ROW;
    const REF_IMG_HEIGHT = 130;


    // Company Logo and Name Section
    try {
      const logoRes = await fetch(COMPANY_LOGO);
      const logoBuffer = await logoRes.arrayBuffer();
      const logoImage = await pdfDoc.embedJpg(logoBuffer);

      const logoScale = 0.5;
      const logoDims = logoImage.scale(logoScale);

      const brandText = "Vertical Living";
      const brandFontSize = 20;
      const brandColor = rgb(0.1, 0.4, 0.9);
      const brandTextWidth = boldFont.widthOfTextAtSize(brandText, brandFontSize);

      const spacing = 10;
      const totalWidth = logoDims.width + spacing + brandTextWidth;
      const combinedX = (width - totalWidth) / 2;
      const topY = yPosition;

      // Draw logo
      page.drawImage(logoImage, {
        x: combinedX,
        y: topY - logoDims.height,
        width: logoDims.width,
        height: logoDims.height,
      });

      // Draw text next to logo
      const textY = topY - (logoDims.height / 2) - (brandFontSize / 3);
      page.drawText(brandText, {
        x: combinedX + logoDims.width + spacing,
        y: textY,
        size: brandFontSize,
        font: boldFont,
        color: brandColor,
      });

      yPosition = topY - logoDims.height - 5;

      // Draw horizontal line
      page.drawLine({
        start: { x: 50, y: yPosition },
        end: { x: width - 50, y: yPosition },
        thickness: 1,
        color: rgb(0.6, 0.6, 0.6),
      });

      yPosition -= 30;
    } catch (err) {
      console.error("Failed to load company logo:", err);
      yPosition -= 50;
    }

    // Project name and heading section
    const projectName = doc?.projectId?.projectName || "Project";
    const projectLabel = "Project:";
    const headingText = "Selected Designs";

    // Measure widths
    const headingWidth = boldFont.widthOfTextAtSize(headingText, 20);
    const projectLabelWidth = regularFont.widthOfTextAtSize(projectLabel, 16);
    const projectNameWidth = boldFont.widthOfTextAtSize(projectName, 16);

    // Y position for both (same line)
    const lineY = yPosition;

    // Left side: Heading
    page.drawText(headingText, {
      x: margin,
      y: lineY,
      size: 20,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.5),
    });

    // Right side: Project label + name
    const rightBlockWidth = projectLabelWidth + projectNameWidth + 5;
    const rightStartX = page.getWidth() - margin - rightBlockWidth;

    page.drawText(projectLabel, {
      x: rightStartX,
      y: lineY,
      size: 16,
      font: regularFont,
      color: rgb(128 / 255, 128 / 255, 128 / 255),
    });

    page.drawText(projectName, {
      x: rightStartX + projectLabelWidth + 5,
      y: lineY,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    yPosition -= 40;


    // // Process each room shortlist with serial numbers
    // for (let roomIndex = 0; roomIndex < doc?.shortListedDesigns?.length; roomIndex++) {
    //   const room = doc.shortListedDesigns[roomIndex];

    //   // Calculate required height for this room section
    //   const roomSectionHeight = calculateRoomSectionHeight(room, FIXED_IMAGE_HEIGHT, REF_IMAGE_HEIGHT);

    //   // Check if we need a new page before starting this room section
    //   // if (yPosition - roomSectionHeight < 100) {
    //   //   page = pdfDoc.addPage([595, 842]);
    //   //   yPosition = height - 50;
    //   // }

    //   if (yPosition - (FIXED_IMAGE_HEIGHT + 30) < 100) {
    //     page = pdfDoc.addPage([595, 842]);
    //     yPosition = height - 50;
    //   }

    //   // Site Image Section with serial number
    //   if (room?.siteImage && room?.siteImage.url) {
    //     try {
    //       const siteImageRes = await fetch(room?.siteImage?.url);
    //       const siteImageBuffer = await siteImageRes.arrayBuffer();
    //       let siteImage;

    //       if (room.siteImage.type === "image" || room.siteImage.url.toLowerCase().endsWith('.jpg') || room.siteImage.url.toLowerCase().endsWith('.jpeg')) {
    //         siteImage = await pdfDoc.embedJpg(siteImageBuffer);
    //       } else {
    //         siteImage = await pdfDoc.embedPng(siteImageBuffer);
    //       }

    //       // Scale image to fit fixed dimensions while maintaining aspect ratio
    //       const scale = Math.min(
    //         FIXED_IMAGE_WIDTH / siteImage.width,
    //         FIXED_IMAGE_HEIGHT / siteImage.height
    //       );

    //       const scaledWidth = siteImage.width * scale;
    //       const scaledHeight = siteImage.height * scale;

    //       // Center the image within the fixed dimensions
    //       const xOffset = (FIXED_IMAGE_WIDTH - scaledWidth) / 2;
    //       const yOffset = (FIXED_IMAGE_HEIGHT - scaledHeight) / 2;

    //       // Draw site image label with serial number
    //       const siteImageLabel = `${roomIndex + 1}. Site Image`;
    //       page.drawText(siteImageLabel, {
    //         x: margin,
    //         y: yPosition,
    //         size: 14,
    //         font: boldFont,
    //         color: rgb(0, 0, 0),
    //       });

    //       yPosition -= 25;

    //       // Draw site image centered
    //       const imageX = margin + (contentWidth - FIXED_IMAGE_WIDTH) / 2;
    //       page.drawImage(siteImage, {
    //         x: imageX + xOffset,
    //         y: yPosition - FIXED_IMAGE_HEIGHT + yOffset,
    //         width: scaledWidth,
    //         height: scaledHeight,
    //       });

    //       yPosition -= FIXED_IMAGE_HEIGHT + 20;
    //     } catch (err) {
    //       console.error("Failed to load site image:", err);
    //       const siteImageLabel = `${roomIndex + 1}. Site Image: Unable to load`;
    //       page.drawText(siteImageLabel, {
    //         x: margin,
    //         y: yPosition,
    //         size: 12,
    //         font: regularFont,
    //         color: rgb(0.8, 0, 0),
    //       });
    //       yPosition -= 30;
    //     }
    //   }

    //   // Reference Images Section with serial numbers
    //   if (room?.referenceImages && room?.referenceImages?.length > 0) {
    //     // Check if we have enough space for reference images label
    //     if (yPosition < 150) {
    //       page = pdfDoc.addPage([595, 842]);
    //       yPosition = height - 50;
    //     }

    //     // Draw reference images label
    //     page.drawText("Reference Images:", {
    //       x: margin,
    //       y: yPosition,
    //       size: 14,
    //       font: boldFont,
    //       color: rgb(0, 0, 0),
    //     });

    //     yPosition -= 30;

    //     const imagesPerRow = 2;
    //     const horizontalSpacing = 30;
    //     const verticalSpacing = 40;
    //     const imageWidth = (contentWidth - (imagesPerRow - 1) * horizontalSpacing) / imagesPerRow;
    //     let currentX = margin;
    //     let rowCount = 0;

    //     for (let i = 0; i < room?.referenceImages?.length; i++) {
    //       const refImage = room?.referenceImages[i];

    //       // Check if we need a new row
    //       if (rowCount >= imagesPerRow) {
    //         rowCount = 0;
    //         currentX = margin;
    //         yPosition -= REF_IMAGE_HEIGHT + verticalSpacing;

    //         // Check if we need a new page for the next row
    //         if (yPosition - REF_IMAGE_HEIGHT < 100) {
    //           page = pdfDoc.addPage([595, 842]);
    //           yPosition = height - 50;
    //           currentX = margin;

    //           // Add reference images label on new page
    //           page.drawText("Reference Images (continued):", {
    //             x: margin,
    //             y: yPosition,
    //             size: 14,
    //             font: boldFont,
    //             color: rgb(0, 0, 0),
    //           });
    //           yPosition -= 30;
    //         }
    //       }

    //       // Check if current image can fit in current row
    //       if (yPosition - REF_IMAGE_HEIGHT < 50) {
    //         page = pdfDoc.addPage([595, 842]);
    //         yPosition = height - 50;
    //         currentX = margin;
    //         rowCount = 0;

    //         // Add reference images label on new page
    //         page.drawText("Reference Images (continued):", {
    //           x: margin,
    //           y: yPosition,
    //           size: 14,
    //           font: boldFont,
    //           color: rgb(0, 0, 0),
    //         });
    //         yPosition -= 30;
    //       }

    //       try {
    //         const refImageRes = await fetch(refImage?.url);
    //         const refImageBuffer = await refImageRes.arrayBuffer();
    //         let image;

    //         if (refImage.type === "image" || refImage?.url.toLowerCase().endsWith('.jpg') || refImage.url.toLowerCase().endsWith('.jpeg')) {
    //           image = await pdfDoc.embedJpg(refImageBuffer);
    //         } else {
    //           image = await pdfDoc.embedPng(refImageBuffer);
    //         }

    //         // Scale image to fit fixed dimensions while maintaining aspect ratio
    //         const scale = Math.min(
    //           imageWidth / image.width,
    //           REF_IMAGE_HEIGHT / image.height
    //         );

    //         const scaledWidth = image.width * scale;
    //         const scaledHeight = image.height * scale;

    //         // Center the image within the fixed dimensions
    //         const xOffset = (imageWidth - scaledWidth) / 2;
    //         const yOffset = (REF_IMAGE_HEIGHT - scaledHeight) / 2;

    //         // Draw reference image centered
    //         page.drawImage(image, {
    //           x: currentX + xOffset,
    //           y: yPosition - REF_IMAGE_HEIGHT + yOffset,
    //           width: scaledWidth,
    //           height: scaledHeight,
    //         });

    //         // Draw serial number for reference image with better spacing
    //         const refNumber = `${roomIndex + 1}.${i + 1}`;
    //         const numberWidth = regularFont.widthOfTextAtSize(refNumber, 11);
    //         page.drawText(refNumber, {
    //           x: currentX + (imageWidth / 2) - (numberWidth / 2),
    //           y: yPosition - REF_IMAGE_HEIGHT - 20,
    //           size: 11,
    //           font: boldFont,
    //           color: rgb(0.3, 0.3, 0.3),
    //         });

    //         currentX += imageWidth + horizontalSpacing;
    //         rowCount++;
    //       } catch (err) {
    //         console.error("Failed to load reference image:", err);
    //         // Draw placeholder for failed image
    //         page.drawRectangle({
    //           x: currentX,
    //           y: yPosition - REF_IMAGE_HEIGHT,
    //           width: imageWidth,
    //           height: REF_IMAGE_HEIGHT,
    //           color: rgb(0.95, 0.95, 0.95),
    //           borderColor: rgb(0.7, 0.7, 0.7),
    //           borderWidth: 1,
    //         });

    //         // Draw serial number for failed image
    //         const refNumber = `${roomIndex + 1}.${i + 1}`;
    //         const numberWidth = regularFont.widthOfTextAtSize(refNumber, 11);
    //         page.drawText(refNumber, {
    //           x: currentX + (imageWidth / 2) - (numberWidth / 2),
    //           y: yPosition - REF_IMAGE_HEIGHT - 20,
    //           size: 11,
    //           font: boldFont,
    //           color: rgb(0.3, 0.3, 0.3),
    //         });

    //         page.drawText("Unavailable", {
    //           x: currentX + (imageWidth / 2) - (regularFont.widthOfTextAtSize("Unavailable", 9) / 2),
    //           y: yPosition - REF_IMAGE_HEIGHT / 2,
    //           size: 9,
    //           font: regularFont,
    //           color: rgb(0.5, 0.5, 0.5),
    //         });

    //         currentX += imageWidth + horizontalSpacing;
    //         rowCount++;
    //       }
    //     }

    //     // Update yPosition after all reference images
    //     yPosition -= REF_IMAGE_HEIGHT + 30;
    //   }

    //   // Add space between rooms (only if there's another room coming)
    //   if (roomIndex < doc.shortListedDesigns.length - 1) {
    //     yPosition -= 30;

    //     // Add a separator line between rooms if there's space
    //     if (yPosition > 60) {
    //       page.drawLine({
    //         start: { x: margin, y: yPosition },
    //         end: { x: width - margin, y: yPosition },
    //         thickness: 0.5,
    //         color: rgb(0.9, 0.9, 0.9),
    //       });
    //       yPosition -= 40;
    //     }
    //   }
    // }

    for (let i = 0; i < doc?.shortListedDesigns?.length; i++) {
      const item = doc.shortListedDesigns[i];

      // --- 2. Site Image Section ---
      if (yPosition < 300) { page = pdfDoc.addPage([595, 842]); yPosition = height - 60; }

      // Label: Site Image
      page.drawText(`${i + 1}. Site Image`, {
        x: margin,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0.1, 0.4, 0.9),
      });
      yPosition -= 20;

      if (item?.siteImage?.url) {
        try {
          // const imgBytes = await fetch(item.siteImage.url).then(res => res.arrayBuffer());
          // const image = item.siteImage.url.toLowerCase().endsWith('.png') ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);


          // const imgRes = await fetch(item.siteImage.url);
          // const imgBuffer = await imgRes.arrayBuffer();

          // let image;
          // const url = item.siteImage.url.toLowerCase();

          // // ✅ FIX: Check the actual file extension or type
          // if (url.endsWith('.png')) {
          //   image = await pdfDoc.embedPng(imgBuffer);
          // } else if (url.endsWith('.jpg') || url.endsWith('.jpeg')) {
          //   image = await pdfDoc.embedJpg(imgBuffer);
          // } else {
          //   // Fallback for S3 signatures or complex URLs
          //   try {
          //     image = await pdfDoc.embedJpg(imgBuffer);
          //   } catch {
          //     image = await pdfDoc.embedPng(imgBuffer);
          //   }
          // }

          // const dims = image.scaleToFit(SITE_IMG_WIDTH, SITE_IMG_HEIGHT);


          // page.drawImage(image, {
          //   x: margin + (contentWidth - dims.width) / 2, // Centered
          //   y: yPosition - dims.height,
          //   width: dims.width,
          //   height: dims.height,
          // });
          // yPosition -= (dims.height + 30);


          const siteImageRes = await fetch(item.siteImage.url);
          const siteImageBuffer = await siteImageRes.arrayBuffer();
          let siteImage;

          // Your Image Extraction Logic: Detection of PNG vs JPG
          if (item.siteImage.type === "image" || item.siteImage.url.toLowerCase().endsWith('.jpg') || item.siteImage.url.toLowerCase().endsWith('.jpeg')) {
            siteImage = await pdfDoc.embedJpg(siteImageBuffer);
          } else {
            siteImage = await pdfDoc.embedPng(siteImageBuffer);
          }

          const scale = Math.min(SITE_IMG_WIDTH / siteImage.width, SITE_IMG_HEIGHT / siteImage.height);
          const scaledWidth = siteImage.width * scale;
          const scaledHeight = siteImage.height * scale;

          page.drawImage(siteImage, {
            x: margin + (contentWidth - scaledWidth) / 2,
            y: yPosition - scaledHeight,
            width: scaledWidth,
            height: scaledHeight,
          });

          yPosition -= (scaledHeight + 40);

        } catch (e) {
          console.error("Failed to load site image:", e);

          const siteImageLabel = `${i + 1}. Site Image: Unable to load`;
                    page.drawText(siteImageLabel, {
                      x: margin,
                      y: yPosition,
                      size: 12,
                      font: regularFont,
                      color: rgb(0.8, 0, 0),
                    });


          yPosition -= 20;
        }
      }

      // --- 3. Reference Images Section ---
      if (item?.referenceImages?.length > 0) {
        if (yPosition < 150) { page = pdfDoc.addPage([595, 842]); yPosition = height - 60; }

        page.drawText(`Reference Images`, {
          x: margin,
          y: yPosition,
          size: 12,
          font: boldFont,
          color: rgb(0.3, 0.3, 0.3),
        });
        yPosition -= 20;

        let currentX = margin;
        for (let j = 0; j < item.referenceImages.length; j++) {
          // Row Management: Move to next row after 3 images
          if (j > 0 && j % REF_IMAGES_PER_ROW === 0) {
            currentX = margin;
            yPosition -= (REF_IMG_HEIGHT + 35); // 35 includes space for the label below

            // Page Break Check for new row
            if (yPosition < 150) {
              page = pdfDoc.addPage([595, 842]);
              yPosition = height - 60;
            }
          }

          try {
            const refBytes = await fetch(item.referenceImages[j].url).then(res => res.arrayBuffer());
            const refImg = await pdfDoc.embedJpg(refBytes);
            const refDims = refImg.scaleToFit(REF_IMG_WIDTH, REF_IMG_HEIGHT);

            // Draw Image
            page.drawImage(refImg, {
              x: currentX + (REF_IMG_WIDTH - refDims.width) / 2,
              y: yPosition - refDims.height,
              width: refDims.width,
              height: refDims.height,
            });

            // Label (e.g., 1.1, 1.2)
            const label = `${i + 1}.${j + 1}`;
            page.drawText(label, {
              x: currentX + (REF_IMG_WIDTH / 2) - 5,
              y: yPosition - refDims.height - 12,
              size: 9,
              font: regularFont,
              color: rgb(0.5, 0.5, 0.5),
            });

            currentX += REF_IMG_WIDTH + GRID_GAP;
          } catch (e) { currentX += REF_IMG_WIDTH + GRID_GAP; }
        }
        yPosition -= (REF_IMG_HEIGHT + 50); // Final spacing after the grid
      }

      // Separator Line between main blocks
      if (i < doc.shortListedDesigns.length - 1) {
        page.drawLine({
          start: { x: margin, y: yPosition + 20 },
          end: { x: width - margin, y: yPosition + 20 },
          thickness: 0.5,
          color: rgb(0.8, 0.8, 0.8),
        });
      }
    }

    // Helper function to calculate required height for a room section
    function calculateRoomSectionHeight(room: any, siteImageHeight: number, refImageHeight: number): number {
      let height = 0;

      // Site image section height
      if (room?.siteImage) {
        height += 25 + siteImageHeight + 20; // Label + image + spacing
      }

      // Reference images section height
      if (room?.referenceImages && room.referenceImages.length > 0) {
        height += 30; // "Reference Images:" label

        const imagesPerRow = 2;
        const rows = Math.ceil(room.referenceImages.length / imagesPerRow);
        height += rows * (refImageHeight + 40); // Each row height + spacing

        height += 30; // Final spacing after reference images
      }

      // Room separator
      height += 30;

      return height;
    }

    // Finalize PDF
    const pdfBytes = await pdfDoc.save();

    // Upload to S3
    const safeProjectName = projectName.replace(/[^a-zA-Z0-9]/g, '-');
    const fileName = `shortlisted-designs-${safeProjectName}-${Date.now()}.pdf`;
    const uploadResult = await uploadToS3(pdfBytes, fileName);

    // Update the document with the PDF link
    await ShortlistedDesignModel.findByIdAndUpdate(doc._id, {
      pdfLink: {
        type: "pdf",
        url: uploadResult.Location,
        originalName: fileName,
        uploadedAt: new Date(),
      }
    });

    return {
      url: uploadResult.Location,
      pdfName: fileName,
    };
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};