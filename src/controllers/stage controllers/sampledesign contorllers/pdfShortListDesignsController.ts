import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { COMPANY_LOGO, uploadToS3 } from "../ordering material controller/pdfOrderHistory.controller";
import { ShortlistedDesignModel } from "../../../models/Stage Models/sampleDesing model/shortListed.model";

// const generateShortlistPdf = async ({doc}:{doc:any})=>{
//     try{




//           const pdfDoc = await PDFDocument.create();
//                 let page = pdfDoc.addPage([842, 595]); // A4 Landscape for better comparison view
//                 const { width, height } = page.getSize();

//                 // Load fonts
//                 const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
//                 const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

//                 let yPosition = height - 20;

//                 console.log("gnerag the company detials ")
//                 // Company Logo and Name Section
//                 try {
//                     const logoRes = await fetch(COMPANY_LOGO);
//                     const logoBuffer = await logoRes.arrayBuffer();
//                     const logoImage = await pdfDoc.embedJpg(logoBuffer);

//                     const logoScale = 0.5;
//                     const logoDims = logoImage.scale(logoScale);

//                     const brandText = "Vertical Living";
//                     const brandFontSize = 20;
//                     const brandColor = rgb(0.1, 0.4, 0.9);
//                     const brandTextWidth = boldFont.widthOfTextAtSize(brandText, brandFontSize);

//                     const spacing = 10;
//                     const totalWidth = logoDims.width + spacing + brandTextWidth;
//                     const combinedX = (width - totalWidth) / 2;
//                     const topY = yPosition;

//                     // Draw logo
//                     page.drawImage(logoImage, {
//                         x: combinedX,
//                         y: topY - logoDims.height,
//                         width: logoDims.width,
//                         height: logoDims.height,
//                     });

//                     // Draw text next to logo
//                     const textY = topY - (logoDims.height / 2) - (brandFontSize / 3);
//                     page.drawText(brandText, {
//                         x: combinedX + logoDims.width + spacing,
//                         y: textY,
//                         size: brandFontSize,
//                         font: boldFont,
//                         color: brandColor,
//                     });

//                     yPosition = topY - logoDims.height - 5;

//                     // Draw horizontal line
//                     page.drawLine({
//                         start: { x: 50, y: yPosition },
//                         end: { x: width - 50, y: yPosition },
//                         thickness: 1,
//                         color: rgb(0.6, 0.6, 0.6),
//                     });

//                     yPosition -= 30;
//                 } catch (err) {
//                     console.error("Failed to load company logo:", err);
//                     yPosition -= 50; // Skip logo space if failed
//                 }




//     }
//     catch(error:any){

//     }
// }



// export const generateShortlistPdf = async ({ doc }: { doc: any }) => {
//   try {
//     const pdfDoc = await PDFDocument.create();
//     let page = pdfDoc.addPage([842, 595]); // A4 Landscape for better comparison view
//     const { width, height } = page.getSize();

//     // Load fonts
//     const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
//     const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

//     let yPosition = height - 20;

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
//       yPosition -= 50; // Skip logo space if failed
//     }

//     // Project Name and Heading
//     const projectName = doc?.projectId?.projectName || "Project";
//     const headingText = "Selected Designs";

//     // Draw heading on left
//     page.drawText(headingText, {
//       x: 50,
//       y: yPosition,
//       size: 18,
//       font: boldFont,
//       color: rgb(0, 0, 0),
//     });

//     // Draw project name on right
//     const projectNameWidth = regularFont.widthOfTextAtSize(projectName, 14);
//     page.drawText(projectName, {
//       x: width - 50 - projectNameWidth,
//       y: yPosition,
//       size: 14,
//       font: regularFont,
//       color: rgb(0.4, 0.4, 0.4),
//     });

//     yPosition -= 40;

//     // Process each room shortlist
//     for (const room of doc?.shortListedDesigns) {
//       // Check if we need a new page
//       if (yPosition < 150) {
//         page = pdfDoc.addPage([842, 595]);
//         yPosition = height - 50;
//       }

//       // Site Image Section
//       if (room?.siteImage && room?.siteImage.url) {
//         try {
//           const siteImageRes = await fetch(room?.siteImage?.url);
//           const siteImageBuffer = await siteImageRes.arrayBuffer();
//           let siteImage;

//           // Check image type and embed accordingly
//           if (room.siteImage.type === "image/jpeg" || room.siteImage.url.toLowerCase().endsWith('.jpg') || room.siteImage.url.toLowerCase().endsWith('.jpeg')) {
//             siteImage = await pdfDoc.embedJpg(siteImageBuffer);
//           } else {
//             siteImage = await pdfDoc.embedPng(siteImageBuffer);
//           }

//           // Scale image to fit width
//           const maxWidth = width - 100;
//           const scale = maxWidth / siteImage.width;
//           const scaledDims = { 
//             width: siteImage.width * scale, 
//             height: siteImage.height * scale 
//           };

//           // Draw site image label
//           page.drawText("Site Image:", {
//             x: 50,
//             y: yPosition,
//             size: 14,
//             font: boldFont,
//             color: rgb(0, 0, 0),
//           });

//           yPosition -= 20;

//           // Draw site image
//           page.drawImage(siteImage, {
//             x: 50,
//             y: yPosition - scaledDims.height,
//             width: scaledDims.width,
//             height: scaledDims.height,
//           });

//           yPosition -= scaledDims.height + 30;
//         } catch (err) {
//           console.error("Failed to load site image:", err);
//           page.drawText("Site Image: Unable to load", {
//             x: 50,
//             y: yPosition,
//             size: 12,
//             font: regularFont,
//             color: rgb(0.8, 0, 0),
//           });
//           yPosition -= 30;
//         }
//       }

//       // Reference Images Section
//       if (room?.referenceImages && room?.referenceImages?.length > 0) {
//         // Draw reference images label
//         page.drawText("Reference Images:", {
//           x: 50,
//           y: yPosition,
//           size: 14,
//           font: boldFont,
//           color: rgb(0, 0, 0),
//         });

//         yPosition -= 25;

//         const imagesPerRow = 3;
//         const imageWidth = (width - 100 - (imagesPerRow - 1) * 20) / imagesPerRow;
//         let currentX = 50;
//         let rowCount = 0;

//         for (let i = 0; i < room?.referenceImages?.length; i++) {
//           const refImage = room.referenceImages[i];

//           // Check if we need a new row
//           if (rowCount >= imagesPerRow) {
//             rowCount = 0;
//             currentX = 50;
//             yPosition -= imageWidth + 40; // Assuming square images

//             // Check if we need a new page
//             if (yPosition < 150) {
//               page = pdfDoc.addPage([842, 595]);
//               yPosition = height - 50;
//             }
//           }

//           try {
//             const refImageRes = await fetch(refImage?.url);
//             const refImageBuffer = await refImageRes.arrayBuffer();
//             let image;

//             // Check image type and embed accordingly
//             if (refImage.type === "image/jpeg" || refImage?.url.toLowerCase().endsWith('.jpg') || refImage.url.toLowerCase().endsWith('.jpeg')) {
//               image = await pdfDoc.embedJpg(refImageBuffer);
//             } else {
//               image = await pdfDoc.embedPng(refImageBuffer);
//             }

//             // Scale image to fit the allocated width while maintaining aspect ratio
//             const scale = imageWidth / image.width;
//             const scaledHeight = image.height * scale;

//             // Draw reference image
//             page.drawImage(image, {
//               x: currentX,
//               y: yPosition - scaledHeight,
//               width: imageWidth,
//               height: scaledHeight,
//             });

//             // Move to next position
//             currentX += imageWidth + 20;
//             rowCount++;
//           } catch (err) {
//             console.error("Failed to load reference image:", err);
//             // Draw placeholder for failed image
//             page.drawRectangle({
//               x: currentX,
//               y: yPosition - imageWidth,
//               width: imageWidth,
//               height: imageWidth,
//               color: rgb(0.9, 0.9, 0.9),
//               borderColor: rgb(0.7, 0.7, 0.7),
//               borderWidth: 1,
//             });

//             page.drawText("Image unavailable", {
//               x: currentX + 10,
//               y: yPosition - imageWidth / 2,
//               size: 10,
//               font: regularFont,
//               color: rgb(0.5, 0.5, 0.5),
//             });

//             currentX += imageWidth + 20;
//             rowCount++;
//           }
//         }

//         // Update yPosition after all reference images
//         yPosition -= imageWidth + 50;
//       }

//       // Add some space between rooms
//       yPosition -= 30;
//     }

//     // Finalize PDF
//     const pdfBytes = await pdfDoc.save();

//     // Upload to S3
//     const safeProjectName = projectName.replace(/[^a-zA-Z0-9]/g, '-');
//     const fileName = `home-interior-${safeProjectName}-${Date.now()}.pdf`;
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



// export const generateShortlistPdf = async ({ doc }: { doc: any }) => {
//   try {
//     const pdfDoc = await PDFDocument.create();
//     let page = pdfDoc.addPage([842, 595]); // A4 Landscape for better comparison view
//     const { width, height } = page.getSize();

//     // Load fonts
//     const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
//     const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

//     let yPosition = height - 20;

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
//       yPosition -= 50; // Skip logo space if failed
//     }

//     // Project Name and Heading
//     const projectName = doc?.projectId?.projectName || "Project";
//     const headingText = "Selected Designs";

//     // Draw heading on left
//     page.drawText(headingText, {
//       x: 50,
//       y: yPosition,
//       size: 18,
//       font: boldFont,
//       color: rgb(0, 0, 0),
//     });

//     // Draw project name on right
//     const projectNameWidth = regularFont.widthOfTextAtSize(projectName, 14);
//     page.drawText(projectName, {
//       x: width - 50 - projectNameWidth,
//       y: yPosition,
//       size: 14,
//       font: regularFont,
//       color: rgb(0.4, 0.4, 0.4),
//     });

//     yPosition -= 40;

//     // Process each room shortlist with serial numbers
//     for (let roomIndex = 0; roomIndex < doc?.shortListedDesigns?.length; roomIndex++) {
//       const room = doc.shortListedDesigns[roomIndex];

//       // Check if we need a new page
//       if (yPosition < 150) {
//         page = pdfDoc.addPage([842, 595]);
//         yPosition = height - 50;
//       }

//       // Room heading with serial number
//       const roomHeading = `Room ${roomIndex + 1}`;
//       page.drawText(roomHeading, {
//         x: 50,
//         y: yPosition,
//         size: 16,
//         font: boldFont,
//         color: rgb(0.2, 0.2, 0.6),
//       });

//       yPosition -= 25;

//       // Site Image Section with serial number
//       if (room?.siteImage && room?.siteImage.url) {
//         try {
//           const siteImageRes = await fetch(room?.siteImage?.url);
//           const siteImageBuffer = await siteImageRes.arrayBuffer();
//           let siteImage;

//           // Check image type and embed accordingly
//           if (room.siteImage.type === "image/jpeg" || room.siteImage.url.toLowerCase().endsWith('.jpg') || room.siteImage.url.toLowerCase().endsWith('.jpeg')) {
//             siteImage = await pdfDoc.embedJpg(siteImageBuffer);
//           } else {
//             siteImage = await pdfDoc.embedPng(siteImageBuffer);
//           }

//           // Scale image to fit width
//           const maxWidth = width - 100;
//           const scale = maxWidth / siteImage.width;
//           const scaledDims = { 
//             width: siteImage.width * scale, 
//             height: siteImage.height * scale 
//           };

//           // Draw site image label with serial number
//           const siteImageLabel = `${roomIndex + 1}. Site Image:`;
//           page.drawText(siteImageLabel, {
//             x: 50,
//             y: yPosition,
//             size: 14,
//             font: boldFont,
//             color: rgb(0, 0, 0),
//           });

//           yPosition -= 20;

//           // Draw site image
//           page.drawImage(siteImage, {
//             x: 50,
//             y: yPosition - scaledDims.height,
//             width: scaledDims.width,
//             height: scaledDims.height,
//           });

//           yPosition -= scaledDims.height + 30;
//         } catch (err) {
//           console.error("Failed to load site image:", err);
//           const siteImageLabel = `${roomIndex + 1}. Site Image: Unable to load`;
//           page.drawText(siteImageLabel, {
//             x: 50,
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
//         // Draw reference images label
//         page.drawText("Reference Images:", {
//           x: 50,
//           y: yPosition,
//           size: 14,
//           font: boldFont,
//           color: rgb(0, 0, 0),
//         });

//         yPosition -= 25;

//         const imagesPerRow = 3;
//         const imageWidth = (width - 100 - (imagesPerRow - 1) * 20) / imagesPerRow;
//         let currentX = 50;
//         let rowCount = 0;

//         for (let i = 0; i < room?.referenceImages?.length; i++) {
//           const refImage = room.referenceImages[i];

//           // Check if we need a new row
//           if (rowCount >= imagesPerRow) {
//             rowCount = 0;
//             currentX = 50;
//             yPosition -= imageWidth + 50; // Extra space for serial numbers

//             // Check if we need a new page
//             if (yPosition < 150) {
//               page = pdfDoc.addPage([842, 595]);
//               yPosition = height - 50;
//             }
//           }

//           try {
//             const refImageRes = await fetch(refImage?.url);
//             const refImageBuffer = await refImageRes.arrayBuffer();
//             let image;

//             // Check image type and embed accordingly
//             if (refImage.type === "image/jpeg" || refImage?.url.toLowerCase().endsWith('.jpg') || refImage.url.toLowerCase().endsWith('.jpeg')) {
//               image = await pdfDoc.embedJpg(refImageBuffer);
//             } else {
//               image = await pdfDoc.embedPng(refImageBuffer);
//             }

//             // Scale image to fit the allocated width while maintaining aspect ratio
//             const scale = imageWidth / image.width;
//             const scaledHeight = image.height * scale;

//             // Draw reference image
//             page.drawImage(image, {
//               x: currentX,
//               y: yPosition - scaledHeight,
//               width: imageWidth,
//               height: scaledHeight,
//             });

//             // Draw serial number for reference image
//             const refNumber = `${roomIndex + 1}.${i + 1}`;
//             const numberWidth = regularFont.widthOfTextAtSize(refNumber, 12);
//             page.drawText(refNumber, {
//               x: currentX + (imageWidth / 2) - (numberWidth / 2),
//               y: yPosition - scaledHeight - 15,
//               size: 12,
//               font: boldFont,
//               color: rgb(0, 0, 0),
//             });

//             // Move to next position
//             currentX += imageWidth + 20;
//             rowCount++;
//           } catch (err) {
//             console.error("Failed to load reference image:", err);
//             // Draw placeholder for failed image
//             page.drawRectangle({
//               x: currentX,
//               y: yPosition - imageWidth,
//               width: imageWidth,
//               height: imageWidth,
//               color: rgb(0.9, 0.9, 0.9),
//               borderColor: rgb(0.7, 0.7, 0.7),
//               borderWidth: 1,
//             });

//             // Draw serial number for failed image
//             const refNumber = `${roomIndex + 1}.${i + 1}`;
//             const numberWidth = regularFont.widthOfTextAtSize(refNumber, 12);
//             page.drawText(refNumber, {
//               x: currentX + (imageWidth / 2) - (numberWidth / 2),
//               y: yPosition - imageWidth - 15,
//               size: 12,
//               font: boldFont,
//               color: rgb(0, 0, 0),
//             });

//             page.drawText("Image unavailable", {
//               x: currentX + 10,
//               y: yPosition - imageWidth / 2,
//               size: 10,
//               font: regularFont,
//               color: rgb(0.5, 0.5, 0.5),
//             });

//             currentX += imageWidth + 20;
//             rowCount++;
//           }
//         }

//         // Update yPosition after all reference images
//         yPosition -= imageWidth + 70; // Extra space for serial numbers
//       }

//       // Add some space between rooms
//       yPosition -= 30;

//       // Add a separator line between rooms
//       if (roomIndex < doc.shortListedDesigns.length - 1) {
//         page.drawLine({
//           start: { x: 50, y: yPosition },
//           end: { x: width - 50, y: yPosition },
//           thickness: 1,
//           color: rgb(0.8, 0.8, 0.8),
//         });
//         yPosition -= 20;
//       }
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


export const generateShortlistPdf = async ({ doc }: { doc: any }) => {
  try {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]); // A4 Portrait for better vertical flow
    const { width, height } = page.getSize();

    // Load fonts
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let yPosition = height - 50;
    const margin = 50;
    const contentWidth = width - (margin * 2);

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
      yPosition -= 50; // Skip logo space if failed
    }

    // Project Name
    // const projectName = doc?.projectId?.projectName || "Project";
    // const projectLabel = "Project:";

    // // Draw project label in bold
    // page.drawText(projectLabel, {
    //   x: margin,
    //   y: yPosition,
    //   size: 16,
    //   font: regularFont,
    //     color: rgb(128 / 255, 128 / 255, 128 / 255), // gray
    //   // color: rgb(0, 0, 0),
    // });

    // // Draw project name
    // const projectNameX = margin + boldFont.widthOfTextAtSize(projectLabel, 16) + 5;
    // page.drawText(projectName, {
    //   x: projectNameX,
    //   y: yPosition,
    //   size: 16,
    //   font: boldFont,
    //   // color: rgb(0.2, 0.2, 0.6),
    //   color: rgb(0, 0, 0),
    // });

    // yPosition -= 30;

    // // Main Heading
    // const headingText = "Selected Designs";
    // const headingWidth = boldFont.widthOfTextAtSize(headingText, 20);
    // page.drawText(headingText, {
    //   x: margin + (contentWidth - headingWidth) / 2,
    //   y: yPosition,
    //   size: 20,
    //   font: boldFont,
    //   color: rgb(0.1, 0.1, 0.5),
    // });


    // Project name/label
    const projectName = doc?.projectId?.projectName || "Project";
    const projectLabel = "Project:";

    // Heading text
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
      color: rgb(128 / 255, 128 / 255, 128 / 255), // gray
    });

    page.drawText(projectName, {
      x: rightStartX + projectLabelWidth + 5,
      y: lineY,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Move yPosition down for the next section
    yPosition -= 40;

    // Process each room shortlist with serial numbers
    for (let roomIndex = 0; roomIndex < doc?.shortListedDesigns?.length; roomIndex++) {
      const room = doc.shortListedDesigns[roomIndex];

      // Check if we need a new page (leave at least 300px for next content)
      if (yPosition < 300) {
        page = pdfDoc.addPage([595, 842]);
        yPosition = height - 50;
      }

      // Site Image Section with serial number
      if (room?.siteImage && room?.siteImage.url) {
        try {
          const siteImageRes = await fetch(room?.siteImage?.url);
          const siteImageBuffer = await siteImageRes.arrayBuffer();
          let siteImage;

          // Check image type and embed accordingly
          if (room.siteImage.type === "image" || room.siteImage.url.toLowerCase().endsWith('.jpg') || room.siteImage.url.toLowerCase().endsWith('.jpeg')) {
            siteImage = await pdfDoc.embedJpg(siteImageBuffer);
          } else {
            siteImage = await pdfDoc.embedPng(siteImageBuffer);
          }

          // Scale image to fit content width
          const maxWidth = contentWidth;
          const scale = Math.min(maxWidth / siteImage.width, 0.6); // Limit scale to 60% of original
          const scaledDims = {
            width: siteImage.width * scale,
            height: siteImage.height * scale
          };

          // Draw site image label with serial number
          const siteImageLabel = `${roomIndex + 1}. Site Image`;
          page.drawText(siteImageLabel, {
            x: margin,
            y: yPosition,
            size: 14,
            font: boldFont,
            color: rgb(0, 0, 0),
          });

          yPosition -= 20;

          // Draw site image centered
          const imageX = margin + (contentWidth - scaledDims.width) / 2;
          page.drawImage(siteImage, {
            x: imageX,
            y: yPosition - scaledDims.height,
            width: scaledDims.width,
            height: scaledDims.height,
          });

          yPosition -= scaledDims.height + 30;
        } catch (err) {
          console.error("Failed to load site image:", err);
          const siteImageLabel = `${roomIndex + 1}. Site Image: Unable to load`;
          page.drawText(siteImageLabel, {
            x: margin,
            y: yPosition,
            size: 12,
            font: regularFont,
            color: rgb(0.8, 0, 0),
          });
          yPosition -= 30;
        }
      }

      // Reference Images Section with serial numbers
      if (room?.referenceImages && room?.referenceImages?.length > 0) {
        // Draw reference images label
        page.drawText("Reference Images:", {
          x: margin,
          y: yPosition,
          size: 14,
          font: boldFont,
          color: rgb(0, 0, 0),
        });

        yPosition -= 25;

        const imagesPerRow = 3;
        const spacing = 15;
        const imageWidth = (contentWidth - (imagesPerRow - 1) * spacing) / imagesPerRow;
        let currentX = margin;
        let rowCount = 0;

        for (let i = 0; i < room?.referenceImages?.length; i++) {
          const refImage = room?.referenceImages[i];

          // Check if we need a new row
          if (rowCount >= imagesPerRow) {
            rowCount = 0;
            currentX = margin;
            yPosition -= imageWidth + 40; // Space for image + serial number

            // Check if we need a new page
            if (yPosition < 200) {
              page = pdfDoc.addPage([595, 842]);
              yPosition = height - 100;
              currentX = margin;
            }
          }

          try {
            const refImageRes = await fetch(refImage?.url);
            const refImageBuffer = await refImageRes.arrayBuffer();
            let image;

            // Check image type and embed accordingly
            if (refImage.type === "image" || refImage?.url.toLowerCase().endsWith('.jpg') || refImage.url.toLowerCase().endsWith('.jpeg')) {
              image = await pdfDoc.embedJpg(refImageBuffer);
            } else {
              image = await pdfDoc.embedPng(refImageBuffer);
            }

            // Scale image to fit the allocated width while maintaining aspect ratio
            const scale = imageWidth / image.width;
            const scaledHeight = image.height * scale;

            // Draw reference image
            page.drawImage(image, {
              x: currentX,
              y: yPosition - scaledHeight,
              width: imageWidth,
              height: scaledHeight,
            });

            // Draw serial number for reference image (centered below image)
            const refNumber = `${roomIndex + 1}.${i + 1}`;
            const numberWidth = regularFont.widthOfTextAtSize(refNumber, 11);
            page.drawText(refNumber, {
              x: currentX + (imageWidth / 2) - (numberWidth / 2),
              y: yPosition - scaledHeight - 15,
              size: 11,
              font: boldFont,
              color: rgb(0.3, 0.3, 0.3),
            });

            // Move to next position
            currentX += imageWidth + spacing;
            rowCount++;
          } catch (err) {
            console.error("Failed to load reference image:", err);
            // Draw placeholder for failed image
            page.drawRectangle({
              x: currentX,
              y: yPosition - imageWidth,
              width: imageWidth,
              height: imageWidth,
              color: rgb(0.95, 0.95, 0.95),
              borderColor: rgb(0.7, 0.7, 0.7),
              borderWidth: 1,
            });

            // Draw serial number for failed image
            const refNumber = `${roomIndex + 1}.${i + 1}`;
            const numberWidth = regularFont.widthOfTextAtSize(refNumber, 11);
            page.drawText(refNumber, {
              x: currentX + (imageWidth / 2) - (numberWidth / 2),
              y: yPosition - imageWidth - 15,
              size: 11,
              font: boldFont,
              color: rgb(0.3, 0.3, 0.3),
            });

            page.drawText("Unavailable", {
              x: currentX + (imageWidth / 2) - (regularFont.widthOfTextAtSize("Unavailable", 9) / 2),
              y: yPosition - imageWidth / 2,
              size: 9,
              font: regularFont,
              color: rgb(0.5, 0.5, 0.5),
            });

            currentX += imageWidth + spacing;
            rowCount++;
          }
        }

        // Update yPosition after all reference images
        yPosition -= imageWidth + 50;
      }

      // Add space between rooms
      yPosition -= 20;

      // Add a separator line between rooms (except after the last one)
      if (roomIndex < doc.shortListedDesigns.length - 1) {
        page.drawLine({
          start: { x: margin, y: yPosition },
          end: { x: width - margin, y: yPosition },
          thickness: 0.5,
          color: rgb(0.9, 0.9, 0.9),
        });
        yPosition -= 30;
      }
    }

    // Finalize PDF
    const pdfBytes = await pdfDoc.save();

    // Upload to S3 with corrected filename
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