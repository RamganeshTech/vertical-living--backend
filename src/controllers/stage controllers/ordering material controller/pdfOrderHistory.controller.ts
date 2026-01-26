import { PDFDocument, PDFName, rgb, StandardFonts } from 'pdf-lib';
// import fetch from 'node-fetch';
import { s3, S3_BUCKET } from "../../../utils/s3Uploads/s3Client";
import { OrderMaterialHistoryModel } from '../../../models/Stage Models/Ordering Material Model/OrderMaterialHistory.model';

import mongoose, { Types } from 'mongoose';
import { CommonOrderHistoryModel } from '../../../models/Stage Models/Ordering Material Model/CommonOrderMaterialHistory Model/commonOrderMaterialHistory.model';

export const COMPANY_LOGO = "https://th.bing.com/th/id/OIP.Uparc9uI63RDb82OupdPvwAAAA?w=80&h=80&c=1&bgcl=c77779&r=0&o=6&dpr=1.3&pid=ImgRC";
export const COMPANY_NAME = "Vertical Living";

// Upload PDF to S3
const uploadToS3:any = async (pdfBytes: any, fileName: any) => {
    const params = {
        Bucket: S3_BUCKET,
        Key: fileName,
        Body: Buffer.from(pdfBytes),
        ContentType: 'application/pdf',
        ContentDisposition: 'inline',
    };

    try {
        const result = await s3.upload(params).promise();
        return result;
    } catch (error) {
        console.error('S3 upload error:', error);
        throw new Error('Failed to upload PDF to S3');
    }
};

// Main PDF generation function
const generateOrderHistoryPDF = async (projectId: string, organizationId: string, orderItemId: string) => {
    try {
        // Fetch order history data
        // Fetch order history data
        const orderHistory = await OrderMaterialHistoryModel.findOne({ projectId })
            .populate('projectId', 'projectName _id organizationId')


        if (!orderHistory) {
            throw new Error('Order history not found for the given project ID');
        }


        let orderItem = orderHistory.orderedItems.find((order: any) => order._id.toString() === orderItemId.toString())

        if (!orderItem) {
            throw new Error('Order Item not found');

        }

        // let nextNumber = 1;
        // const isNewPdf = Array.isArray(orderHistory.generatedLink) && orderHistory.generatedLink.length > 0;

        // if (isNewPdf) {
        //     // Extract all numbers from refUniquePdf (format: projectName-<number>-pdf)
        //     const numbers = orderHistory.generatedLink.map(ele => {
        //         const match = ele.refUniquePdf?.match(/-(\d+)$/);
        //         return match ? parseInt(match[1], 10) : 0; // Extract the number part
        //     });

        //     // Find the max number and increment
        //     nextNumber = Math.max(...numbers, 0) + 1;
        // }


        // const currentYear = new Date().getFullYear()


        // // Always 3-digit format
        // const paddedNumber = String(nextNumber).padStart(3, "0");
        // const rawProjectId = (orderHistory.projectId as any)._id.toString().slice(-3);

        const refUniquePdf = orderItem?.orderMaterialNumber;


        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage([595, 842]); // A4 size
        const { width, height } = page.getSize();

        // Load fonts
        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        let yPosition = height - 20;

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

            const spacing = 10; // space between logo and text

            // Total width = logo + spacing + text
            const totalWidth = logoDims.width + spacing + brandTextWidth;

            // X and Y to center the whole block horizontally and set a top margin
            const combinedX = (width - totalWidth) / 2;
            const topY = yPosition; // use existing yPosition for vertical positioning

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
                font: boldFont,
                color: brandColor,
            });

            // Update yPosition to be below the logo
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
        }

        // // Material Order heading
        // const heading = "MATERIAL ORDER";
        // page.drawText(heading, {
        //     x: 50,
        //     y: yPosition,
        //     size: 18,
        //     font: boldFont,
        //     color: rgb(0.0, 0.2, 0.4),
        // });
        // yPosition -= 20;

        const heading = "Order Material";

        const referenceId = `Order Id: ${refUniquePdf}`; // e.g. projectName-01-pdf

        // Measure text widths
        const headingWidth = boldFont.widthOfTextAtSize(heading, 18);
        const refWidth = boldFont.widthOfTextAtSize(referenceId, 12);

        // Set margins
        const leftMargin = 50;
        const rightMargin = 50;

        // Page width
        const pageWidth = page.getWidth();

        // X positions
        const headingX = leftMargin;
        const refX = pageWidth - rightMargin - refWidth;

        // Draw heading (left)
        page.drawText(heading, {
            x: headingX,
            y: yPosition,
            size: 18,
            font: boldFont,
            color: rgb(0.0, 0.2, 0.4),
        });

        // Draw reference id (right, same y)
        page.drawText(referenceId, {
            x: refX,
            y: yPosition,
            size: 12,
            font: boldFont,
            color: rgb(0.0, 0.2, 0.4),
        });

        yPosition -= 30; // move down for next content

        // Project details
        if (orderHistory.projectId) {
            const projectText = `Project: ${(orderHistory.projectId as any).projectName}`;
            page.drawText(projectText, {
                x: 50,
                y: yPosition,
                size: 16,
                font: boldFont,
                color: rgb(0.3, 0.3, 0.3),
            });
            yPosition -= 40;
        }



        // // FIRST VERSION
        //           // ========== IMAGES SECTION - AFTER PROJECT DETAILS ==========
        //         // Check if images exist and have URLs
        //         const hasImages = orderHistory.images && 
        //                          Array.isArray(orderHistory.images) && 
        //                          orderHistory.images.length > 0 &&
        //                          orderHistory.images.some(img => img && img.url && img.url.trim() !== '');

        //         if (hasImages) {
        //             // Add heading for images section
        //             page.drawText("Images:", {
        //                 x: 50,
        //                 y: yPosition,
        //                 size: 14,
        //                 font: boldFont,
        //                 color: rgb(0.2, 0.2, 0.2),
        //             });
        //             yPosition -= 25;

        //             const imageWidth = 150; // Fixed width for images
        //             const imageHeight = 150; // Fixed height for images
        //             const margin = 20; // Margin between images
        //             const imagesPerRow = Math.floor((width - 100) / (imageWidth + margin));

        //             let currentRow = 0;
        //             let currentCol = 0;

        //             // Filter valid images (with URLs)
        //             const validImages = orderHistory.images.filter(img => img && img.url && img.url.trim() !== '');

        //             for (let i = 0; i < validImages.length; i++) {
        //                 const image = validImages[i];

        //                 // Check if we need a new page
        //                 if (yPosition < imageHeight + 100) {
        //                     page = pdfDoc.addPage([595, 842]);
        //                     yPosition = height - 50;
        //                     currentRow = 0;
        //                     currentCol = 0;
        //                 }

        //                 try {
        //                     // Calculate position
        //                     const xPos = 50 + (currentCol * (imageWidth + margin));
        //                     const yPos = yPosition - imageHeight;

        //                     // Fetch and embed image
        //                     const imageRes = await fetch(image?.url!);

        //                     // Check if response is OK
        //                     if (!imageRes.ok) {
        //                         console.warn(`Failed to fetch image ${i+1}: ${imageRes.statusText}`);
        //                         continue;
        //                     }

        //                     const imageBuffer = await imageRes.arrayBuffer();

        //                     // Check if buffer has data
        //                     if (!imageBuffer || imageBuffer.byteLength === 0) {
        //                         console.warn(`Image ${i+1} has empty buffer`);
        //                         continue;
        //                     }

        //                     // Try to determine image type and embed
        //                     let embeddedImage;
        //                     try {
        //                         // Try as JPEG
        //                         embeddedImage = await pdfDoc.embedJpg(imageBuffer);
        //                     } catch (jpgError) {
        //                         try {
        //                             // Try as PNG
        //                             embeddedImage = await pdfDoc.embedPng(imageBuffer);
        //                         } catch (pngError) {
        //                             console.warn(`Failed to embed image ${i+1}: Not a valid JPEG or PNG`);
        //                             continue;
        //                         }
        //                     }

        //                     // Calculate scaling to fit within fixed dimensions while maintaining aspect ratio
        //                     const imgDims = embeddedImage.scale(1);
        //                     const scale = Math.min(
        //                         imageWidth / imgDims.width,
        //                         imageHeight / imgDims.height
        //                     );

        //                     const scaledWidth = imgDims.width * scale;
        //                     const scaledHeight = imgDims.height * scale;

        //                     // Center image in the allocated space
        //                     const xOffset = xPos + (imageWidth - scaledWidth) / 2;
        //                     const yOffset = yPos + (imageHeight - scaledHeight) / 2;

        //                     // Draw image with border
        //                     page.drawRectangle({
        //                         x: xPos,
        //                         y: yPos,
        //                         width: imageWidth,
        //                         height: imageHeight,
        //                         borderColor: rgb(0.8, 0.8, 0.8),
        //                         borderWidth: 1,
        //                         color: rgb(0.95, 0.95, 0.95), // Light background for transparency
        //                     });

        //                     page.drawImage(embeddedImage, {
        //                         x: xOffset,
        //                         y: yOffset,
        //                         width: scaledWidth,
        //                         height: scaledHeight,
        //                     });

        //                     // Add image number
        //                     page.drawText(`Image ${i + 1}`, {
        //                         x: xPos + 5,
        //                         y: yPos - 15,
        //                         size: 8,
        //                         font: regularFont,
        //                         color: rgb(0.5, 0.5, 0.5),
        //                     });

        //                     // Update column position
        //                     currentCol++;

        //                     // Move to next row if needed
        //                     if (currentCol >= imagesPerRow) {
        //                         currentCol = 0;
        //                         currentRow++;
        //                         yPosition -= (imageHeight + margin + 25); // Add space for next row + label
        //                     }

        //                 } catch (error) {
        //                     console.warn(`Failed to process image ${i+1}:`, error);
        //                     // Continue with next image even if one fails
        //                     continue;
        //                 }
        //             }

        //             // After all images, update yPosition for next section
        //             if (currentCol > 0) {
        //                 yPosition -= (imageHeight + margin + 25);
        //             }

        //             // Add some space after images section
        //             yPosition -= 30;
        //         }
        // ========== END IMAGES SECTION ==========


        // SECOND VERSION

        // ========== IMAGES SECTION - AFTER PROJECT DETAILS ==========
        // Check if images exist and have URLs
        const hasImages = orderItem?.images &&
            Array.isArray(orderItem?.images) &&
            orderItem?.images.length > 0 &&
            orderItem?.images.some(img => img && img.url && img.url.trim() !== '');

        if (hasImages) {
            // Add heading for images section
            page.drawText("Images:", {
                x: 50,
                y: yPosition,
                size: 14,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2),
            });
            yPosition -= 25;

            const maxImageWidth = 150; // Maximum width for images
            const maxImageHeight = 150; // Maximum height for images
            const margin = 30; // Margin between images
            const imagesPerRow = 3; // Fixed to 3 images per row

            // Filter valid images (with URLs)
            const validImages = orderItem.images.filter(img => img && img.url && img.url.trim() !== '');

            // Calculate available width for each image in the row
            const totalAvailableWidth = width - 100; // 50px margin on each side
            const imageWidth = (totalAvailableWidth - ((imagesPerRow - 1) * margin)) / imagesPerRow;
            const imageHeight = maxImageHeight;

            let currentRow = 0;
            let currentCol = 0;

            for (let i = 0; i < validImages.length; i++) {
                const image = validImages[i];

                // Check if we need a new page
                if (yPosition < imageHeight + 100) {
                    page = pdfDoc.addPage([595, 842]);
                    yPosition = height - 50;
                    currentRow = 0;
                    currentCol = 0;

                    // Redraw "Images:" heading on new page
                    page.drawText("Images (continued):", {
                        x: 50,
                        y: yPosition,
                        size: 14,
                        font: boldFont,
                        color: rgb(0.2, 0.2, 0.2),
                    });
                    yPosition -= 25;
                }

                try {
                    // Calculate position
                    const xPos = 50 + (currentCol * (imageWidth + margin));
                    const yPos = yPosition - imageHeight;

                    // Fetch and embed image
                    const imageRes = await fetch(image?.url!);

                    // Check if response is OK
                    if (!imageRes.ok) {
                        console.warn(`Failed to fetch image ${i + 1}: ${imageRes.statusText}`);
                        currentCol++;
                        if (currentCol >= imagesPerRow) {
                            currentCol = 0;
                            currentRow++;
                            yPosition -= (imageHeight + margin);
                        }
                        continue;
                    }

                    const imageBuffer = await imageRes.arrayBuffer();

                    // Check if buffer has data
                    if (!imageBuffer || imageBuffer.byteLength === 0) {
                        console.warn(`Image ${i + 1} has empty buffer`);
                        currentCol++;
                        if (currentCol >= imagesPerRow) {
                            currentCol = 0;
                            currentRow++;
                            yPosition -= (imageHeight + margin);
                        }
                        continue;
                    }

                    // Try to determine image type and embed
                    let embeddedImage;
                    try {
                        // Try as JPEG
                        embeddedImage = await pdfDoc.embedJpg(imageBuffer);
                    } catch (jpgError) {
                        try {
                            // Try as PNG
                            embeddedImage = await pdfDoc.embedPng(imageBuffer);
                        } catch (pngError) {
                            console.warn(`Failed to embed image ${i + 1}: Not a valid JPEG or PNG`);
                            currentCol++;
                            if (currentCol >= imagesPerRow) {
                                currentCol = 0;
                                currentRow++;
                                yPosition -= (imageHeight + margin);
                            }
                            continue;
                        }
                    }

                    // Get original image dimensions
                    const imgDims = embeddedImage.scale(1);

                    // Calculate scaling to fit within the allocated width/height while maintaining aspect ratio
                    const scale = Math.min(
                        imageWidth / imgDims.width,
                        imageHeight / imgDims.height
                    );

                    const scaledWidth = imgDims.width * scale;
                    const scaledHeight = imgDims.height * scale;

                    // Center image in the allocated space
                    const xOffset = xPos + (imageWidth - scaledWidth) / 2;
                    const yOffset = yPos + (imageHeight - scaledHeight) / 2;

                    // Draw only the image (no background, no border)
                    page.drawImage(embeddedImage, {
                        x: xOffset,
                        y: yOffset,
                        width: scaledWidth,
                        height: scaledHeight,
                    });

                    // Add image number below the image
                    const imageNumber = `Image ${i + 1}`;
                    const numberWidth = regularFont.widthOfTextAtSize(imageNumber, 9);
                    const numberX = xPos + (imageWidth - numberWidth) / 2;

                    page.drawText(imageNumber, {
                        x: numberX,
                        y: yPos - 15,
                        size: 9,
                        font: regularFont,
                        color: rgb(0.4, 0.4, 0.4),
                    });

                    // Update column position
                    currentCol++;

                    // Move to next row if needed
                    if (currentCol >= imagesPerRow) {
                        currentCol = 0;
                        currentRow++;
                        yPosition -= (imageHeight + margin + 20); // Image height + margin + label space
                    }

                } catch (error) {
                    console.warn(`Failed to process image ${i + 1}:`, error);
                    // Continue with next image even if one fails
                    currentCol++;
                    if (currentCol >= imagesPerRow) {
                        currentCol = 0;
                        currentRow++;
                        yPosition -= (imageHeight + margin + 20);
                    }
                    continue;
                }
            }

            // After all images, update yPosition for next section
            if (currentCol > 0) {
                yPosition -= (imageHeight + margin + 20);
            }

            // Add some space after images section
            yPosition -= 30;
        }
        // ========== END IMAGES SECTION ==========


        // Shop Details Section
        // if (orderHistory.shopDetails) {
        //     page.drawText("Shop Details:", {
        //         x: 50,
        //         y: yPosition,
        //         size: 14,
        //         font: boldFont,
        //         color: rgb(0.2, 0.2, 0.2),
        //     });
        //     yPosition -= 20;

        //     if (orderHistory.shopDetails.shopName) {
        //         page.drawText(`Shop Name: ${orderHistory.shopDetails.shopName}`, {
        //             x: 50,
        //             y: yPosition,
        //             size: 10,
        //             font: regularFont,
        //             color: rgb(0.3, 0.3, 0.3),
        //         });
        //         yPosition -= 15;
        //     }

        //     if (orderHistory.shopDetails.address) {
        //         page.drawText(`Address: ${orderHistory.shopDetails.address}`, {
        //             x: 50,
        //             y: yPosition,
        //             size: 10,
        //             font: regularFont,
        //             color: rgb(0.3, 0.3, 0.3),
        //         });
        //         yPosition -= 15;
        //     }

        //     if (orderHistory.shopDetails.contactPerson) {
        //         page.drawText(`Contact Person: ${orderHistory.shopDetails.contactPerson}`, {
        //             x: 50,
        //             y: yPosition,
        //             size: 10,
        //             font: regularFont,
        //             color: rgb(0.3, 0.3, 0.3),
        //         });
        //         yPosition -= 15;
        //     }

        //     if (orderHistory.shopDetails.phoneNumber) {
        //         page.drawText(`Phone: ${orderHistory.shopDetails.phoneNumber}`, {
        //             x: 50,
        //             y: yPosition,
        //             size: 10,
        //             font: regularFont,
        //             color: rgb(0.3, 0.3, 0.3),
        //         });
        //         yPosition -= 15;
        //     }
        //     yPosition -= 10;
        // }

        // Delivery Location Details Section
        // if (orderHistory.deliveryLocationDetails) {
        //     page.drawText("Delivery Location:", {
        //         x: 50,
        //         y: yPosition,
        //         size: 14,
        //         font: boldFont,
        //         color: rgb(0.2, 0.2, 0.2),
        //     });
        //     yPosition -= 20;

        //     if (orderHistory.deliveryLocationDetails.siteName) {
        //         page.drawText(`Site Name: ${orderHistory.deliveryLocationDetails.siteName}`, {
        //             x: 50,
        //             y: yPosition,
        //             size: 10,
        //             font: regularFont,
        //             color: rgb(0.3, 0.3, 0.3),
        //         });
        //         yPosition -= 15;
        //     }

        //     if (orderHistory.deliveryLocationDetails.address) {
        //         page.drawText(`Site Address: ${orderHistory.deliveryLocationDetails.address}`, {
        //             x: 50,
        //             y: yPosition,
        //             size: 10,
        //             font: regularFont,
        //             color: rgb(0.3, 0.3, 0.3),
        //         });
        //         yPosition -= 15;
        //     }

        //     if (orderHistory.deliveryLocationDetails.siteSupervisor) {
        //         page.drawText(`Site Supervisor: ${orderHistory.deliveryLocationDetails.siteSupervisor}`, {
        //             x: 50,
        //             y: yPosition,
        //             size: 10,
        //             font: regularFont,
        //             color: rgb(0.3, 0.3, 0.3),
        //         });
        //         yPosition -= 15;
        //     }

        //     if (orderHistory.deliveryLocationDetails.phoneNumber) {
        //         page.drawText(`Contact: ${orderHistory.deliveryLocationDetails.phoneNumber}`, {
        //             x: 50,
        //             y: yPosition,
        //             size: 10,
        //             font: regularFont,
        //             color: rgb(0.3, 0.3, 0.3),
        //         });
        //         yPosition -= 15;
        //     }
        //     yPosition -= 20;
        // }


        // Process each unit and its sub-items
        let serialNumber = 1;

        // for (const unit of orderItem?.selectedUnits) {
        // for (const unit of orderItem?.subItems) {


            //no room condition - only show unit if it has subitems
            // if (!unit?.subItems || unit?.subItems?.length === 0) {
            //     continue; // Skip units without subitems
            // }

            // // Unit name heading
            // if (unit.unitName) {
            //     page.drawText(`Unit: ${unit.unitName}`, {
            //         x: 50,
            //         y: yPosition,
            //         size: 14,
            //         font: boldFont,
            //         color: rgb(0.2, 0.2, 0.2),
            //     });
            //     yPosition -= 30;
            // }

            // Check if we need a new page
            if (yPosition < 150) {
                page = pdfDoc.addPage([595, 842]);
                yPosition = height - 50;
            }

            // Table headers
            const tableStartY = yPosition;
            const rowHeight = 25;
            // const columnWidths = [60, , 300, 80, 80]; // S.No, Material Item, Quantity, Unit
            // const columnPositions = [50, 110, 410, 490];

            const columnWidths = [50, 100, 200, 80, 50];
            const columnPositions = [
                50,  // S.No
                100, // Ref ID
                180, // Material Item
                420, // Quantity
                500  // Unit
            ];
            // Draw table header background
            page.drawRectangle({
                x: 45,
                y: yPosition - 5,
                width: 500,
                height: rowHeight,
                color: rgb(0.9, 0.9, 0.9),
            });

            // Table headers
            const headers = ['S.No', 'Ref ID', 'Material Item', 'Quantity', 'Unit'];
            headers.forEach((header, index) => {
                page.drawText(header, {
                    x: columnPositions[index],
                    y: yPosition,
                    size: 12,
                    font: boldFont,
                    color: rgb(0.2, 0.2, 0.2),
                });
            });

            yPosition -= rowHeight + 5;

            // Table content - sub items
            if (orderItem?.subItems && orderItem?.subItems.length > 0) {
                orderItem?.subItems.forEach((subItem, index) => {
                    // Alternate row coloring
                    if (index % 2 === 0) {
                        page.drawRectangle({
                            x: 45,
                            y: yPosition - 5,
                            width: 500,
                            height: rowHeight,
                            color: rgb(0.98, 0.98, 0.98),
                        });
                    }

                    // Table borders
                    page.drawRectangle({
                        x: 45,
                        y: yPosition - 5,
                        width: 500,
                        height: rowHeight,
                        borderColor: rgb(0.8, 0.8, 0.8),
                        borderWidth: 0.5,
                    });

                    const rowData = [
                        serialNumber.toString(),
                        subItem.refId || "N/A",
                        subItem.subItemName || 'N/A',
                        (subItem.quantity || 0).toString(),
                        subItem.unit || 'N/A'
                    ];

                    rowData.forEach((data, colIndex) => {
                        let displayText = data;
                        // Truncate long text to fit in column
                        if (colIndex === 1 && data.length > 35) {
                            displayText = data.substring(0, 32) + '...';
                        }

                        page.drawText(displayText, {
                            x: columnPositions[colIndex],
                            y: yPosition,
                            size: 10,
                            font: regularFont,
                            color: rgb(0.3, 0.3, 0.3),
                        });
                    });

                    yPosition -= rowHeight;
                    serialNumber++;

                    // Check if we need a new page
                    if (yPosition < 100) {
                        page = pdfDoc.addPage([595, 842]);
                        yPosition = height - 50;
                    }
                });
            } else {
                // No sub items message
                page.drawText('No sub-items available', {
                    x: columnPositions[1],
                    y: yPosition,
                    size: 10,
                    font: regularFont,
                    color: rgb(0.6, 0.6, 0.6),
                });
                yPosition -= rowHeight;
            }

            yPosition -= 20; // Space between units
        
        // }

        // // Total cost section
        // if (orderHistory.totalCost) {
        //     yPosition -= 20;
        //     page.drawText(`Total Cost: Rs${orderHistory.totalCost.toLocaleString()}`, {
        //         x: width - 200,
        //         y: yPosition,
        //         size: 14,
        //         font: boldFont,
        //         color: rgb(0.2, 0.2, 0.2),
        //     });
        // }

        // // Footer
        // const footerY = 50;
        // page.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
        //     x: 50,
        //     y: footerY,
        //     size: 8,
        //     font: regularFont,
        //     color: rgb(0.6, 0.6, 0.6),
        // });

        // Save PDF
        const pdfBytes = await pdfDoc.save();

        // Upload to AWS S3
        const fileName = `order-material/order-${projectId}-${Date.now()}.pdf`;
        const uploadResult = await uploadToS3(pdfBytes, fileName);

        // Update the order history with generated link
        // await OrderMaterialHistoryModel.findByIdAndUpdate({projectId}, {
        //     generatedLink: uploadResult.Location
        // });

        // console.log("generateld dat", uploadResult.Location)


        const pdfData = {
            url: uploadResult.Location,
            refUniquePdf, // <-- now has projectName-uniquenumber-pdf
            pdfName: "Order Material",
            status: "pending",
            _id: new mongoose.Types.ObjectId()
        };

        // if (Array.isArray(orderHistory.generatedLink)) {
        //     orderHistory?.generatedLink?.push(pdfData as IPdfGenerator);
        // } else {
        //     orderHistory.generatedLink = []
        //     orderHistory?.generatedLink.push(pdfData as IPdfGenerator)
        // }

        // console.log("orderHistory.generatedLink", orderHistory.generatedLink)



        orderItem.pdfLink = pdfData



        await orderHistory.save();

        // console.log("orderhisoty", orderHistory)

        return {
            ok: true,
            data: {
                orderHistory,
                pdfUrl: uploadResult.Location
            },
            message: 'PDF generated successfully'
        };

    } catch (error: any) {
        console.error('Error generating PDF:', error);
        throw new Error(`PDF generation failed: ${error.message}`);
    }
};




// Main PDF generation function
export const generatePublicOrderHistoryPdf = async (projectId: string, organizationId: string, orderItemId: string) => {
    try {
        // Fetch order history data
        const orderHistory = await OrderMaterialHistoryModel.findOne({ projectId })
            .populate('projectId', 'projectName _id')


        if (!orderHistory) {
            throw new Error('Order history not found for the given project ID');
        }


        let orderItem = orderHistory.orderedItems.find((order: any) => order._id.toString() === orderItemId.toString())

        if (!orderItem) {
            throw new Error('Order Item not found');

        }

        // let nextNumber = 1;
        // const isNewPdf = Array.isArray(orderHistory.generatedLink) && orderHistory.generatedLink.length > 0;

        // if (isNewPdf) {
        //     // Extract all numbers from refUniquePdf (format: projectName-<number>-pdf)
        //     const numbers = orderHistory.generatedLink.map(ele => {
        //         const match = ele.refUniquePdf?.match(/-(\d+)$/);
        //         return match ? parseInt(match[1], 10) : 0; // Extract the number part
        //     });

        //     // Find the max number and increment
        //     nextNumber = Math.max(...numbers, 0) + 1;
        // }


        // const currentYear = new Date().getFullYear()


        // // Always 3-digit format
        // const paddedNumber = String(nextNumber).padStart(3, "0");
        // const rawProjectId = (orderHistory.projectId as any)._id.toString().slice(-3);


        const refUniquePdf = orderItem?.orderMaterialNumber;



        // const refUniquePdf = `ORD-${rawProjectId}-${currentYear}-${paddedNumber}`;
        // Construct the new refUniquePdf
        // const refUniquePdf = `ORD-${(orderHistory.projectId as any)._id.slice(0, 3)}-${currentYear}-${nextNumber}`;


        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage([595, 842]); // A4 size
        const { width, height } = page.getSize();

        // Load fonts
        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        let yPosition = height - 20;

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

            const spacing = 10; // space between logo and text

            // Total width = logo + spacing + text
            const totalWidth = logoDims.width + spacing + brandTextWidth;

            // X and Y to center the whole block horizontally and set a top margin
            const combinedX = (width - totalWidth) / 2;
            const topY = yPosition; // use existing yPosition for vertical positioning

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
                font: boldFont,
                color: brandColor,
            });

            // Update yPosition to be below the logo
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
        }

        // // Material Order heading
        // const heading = "MATERIAL ORDER";
        // page.drawText(heading, {
        //     x: 50,
        //     y: yPosition,
        //     size: 18,
        //     font: boldFont,
        //     color: rgb(0.0, 0.2, 0.4),
        // });
        // yPosition -= 20;

        const heading = "MATERIAL ORDER";

        const referenceId = `Order Id: ${refUniquePdf}`; // e.g. projectName-01-pdf

        // Measure text widths
        const headingWidth = boldFont.widthOfTextAtSize(heading, 18);
        const refWidth = boldFont.widthOfTextAtSize(referenceId, 12);

        // Set margins
        const leftMargin = 50;
        const rightMargin = 50;

        // Page width
        const pageWidth = page.getWidth();

        // X positions
        const headingX = leftMargin;
        const refX = pageWidth - rightMargin - refWidth;

        // Draw heading (left)
        page.drawText(heading, {
            x: headingX,
            y: yPosition,
            size: 18,
            font: boldFont,
            color: rgb(0.0, 0.2, 0.4),
        });

        // Draw reference id (right, same y)
        page.drawText(referenceId, {
            x: refX,
            y: yPosition,
            size: 12,
            font: boldFont,
            color: rgb(0.0, 0.2, 0.4),
        });

        yPosition -= 30; // move down for next content

        // Project details
        if (orderHistory.projectId) {
            const projectText = `Project: ${(orderHistory.projectId as any).projectName}`;
            page.drawText(projectText, {
                x: 50,
                y: yPosition,
                size: 16,
                font: boldFont,
                color: rgb(0.3, 0.3, 0.3),
            });
            yPosition -= 40;
        }


        // Shop Details Section
        if (orderHistory?.publicUnits?.shopDetails) {
            page.drawText("Shop Details:", {
                x: 50,
                y: yPosition,
                size: 14,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2),
            });
            yPosition -= 20;

            if (orderHistory?.publicUnits?.shopDetails.shopName) {
                page.drawText(`Shop Name: ${orderHistory?.publicUnits?.shopDetails.shopName}`, {
                    x: 50,
                    y: yPosition,
                    size: 10,
                    font: regularFont,
                    color: rgb(0.3, 0.3, 0.3),
                });
                yPosition -= 15;
            }

            if (orderHistory?.publicUnits?.shopDetails.address) {
                page.drawText(`Address: ${orderHistory?.publicUnits?.shopDetails.address}`, {
                    x: 50,
                    y: yPosition,
                    size: 10,
                    font: regularFont,
                    color: rgb(0.3, 0.3, 0.3),
                });
                yPosition -= 15;
            }

            if (orderHistory?.publicUnits?.shopDetails.contactPerson) {
                page.drawText(`Contact Person: ${orderHistory?.publicUnits?.shopDetails.contactPerson}`, {
                    x: 50,
                    y: yPosition,
                    size: 10,
                    font: regularFont,
                    color: rgb(0.3, 0.3, 0.3),
                });
                yPosition -= 15;
            }

            if (orderHistory?.publicUnits?.shopDetails.phoneNumber) {
                page.drawText(`Phone: ${orderHistory.shopDetails.phoneNumber}`, {
                    x: 50,
                    y: yPosition,
                    size: 10,
                    font: regularFont,
                    color: rgb(0.3, 0.3, 0.3),
                });
                yPosition -= 15;
            }
            yPosition -= 10;
        }


        yPosition -= 20;


        // Process each unit and its sub-items
        let serialNumber = 1;

        // for (const unit of orderHistory?.publicUnits) {




        // Check if we need a new page
        if (yPosition < 150) {
            page = pdfDoc.addPage([595, 842]);
            yPosition = height - 50;
        }

        // Table headers
        const tableStartY = yPosition;
        const rowHeight = 25;
        // const columnWidths = [60, , 300, 80, 80]; // S.No, Material Item, Quantity, Unit
        // const columnPositions = [50, 110, 410, 490];

        const columnWidths = [50, 100, 200, 80, 50];
        const columnPositions = [
            50,  // S.No
            100, // Ref ID
            180, // Material Item
            420, // Quantity
            500  // Unit
        ];
        // Draw table header background
        page.drawRectangle({
            x: 45,
            y: yPosition - 5,
            width: 500,
            height: rowHeight,
            color: rgb(0.9, 0.9, 0.9),
        });

        // Table headers
        const headers = ['S.No', 'Ref ID', 'Material Item', 'Quantity', 'Unit'];
        headers.forEach((header, index) => {
            page.drawText(header, {
                x: columnPositions[index],
                y: yPosition,
                size: 12,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2),
            });
        });

        yPosition -= rowHeight + 5;

        // Table content - sub items
        orderHistory?.publicUnits?.subItems.forEach((subItem, index) => {
            // Alternate row coloring
            if (index % 2 === 0) {
                page.drawRectangle({
                    x: 45,
                    y: yPosition - 5,
                    width: 500,
                    height: rowHeight,
                    color: rgb(0.98, 0.98, 0.98),
                });
            }


            // Table borders
            page.drawRectangle({
                x: 45,
                y: yPosition - 5,
                width: 500,
                height: rowHeight,
                borderColor: rgb(0.8, 0.8, 0.8),
                borderWidth: 0.5,
            });

            const rowData = [
                serialNumber.toString(),
                subItem.refId || "N/A",
                subItem.subItemName || 'N/A',
                (subItem.quantity || 0).toString(),
                subItem.unit || 'N/A'
            ];

            rowData.forEach((data, colIndex) => {
                let displayText = data;
                // Truncate long text to fit in column
                if (colIndex === 1 && data.length > 35) {
                    displayText = data.substring(0, 32) + '...';
                }

                page.drawText(displayText, {
                    x: columnPositions[colIndex],
                    y: yPosition,
                    size: 10,
                    font: regularFont,
                    color: rgb(0.3, 0.3, 0.3),
                });
            });

            yPosition -= rowHeight;
            serialNumber++;

            // Check if we need a new page
            if (yPosition < 100) {
                page = pdfDoc.addPage([595, 842]);
                yPosition = height - 50;
            }
        });
        // } else {
        //     // No sub items message
        //     page.drawText('No sub-items available', {
        //         x: columnPositions[1],
        //         y: yPosition,
        //         size: 10,
        //         font: regularFont,
        //         color: rgb(0.6, 0.6, 0.6),
        //     });
        //     yPosition -= rowHeight;
        // }

        yPosition -= 20; // Space between units
        // }

        // // Total cost section
        // if (orderHistory.totalCost) {
        //     yPosition -= 20;
        //     page.drawText(`Total Cost: Rs${orderHistory.totalCost.toLocaleString()}`, {
        //         x: width - 200,
        //         y: yPosition,
        //         size: 14,
        //         font: boldFont,
        //         color: rgb(0.2, 0.2, 0.2),
        //     });
        // }

        // // Footer
        // const footerY = 50;
        // page.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
        //     x: 50,
        //     y: footerY,
        //     size: 8,
        //     font: regularFont,
        //     color: rgb(0.6, 0.6, 0.6),
        // });

        // Save PDF
        const pdfBytes = await pdfDoc.save();

        // Upload to AWS S3
        const fileName = `order-material/order-${projectId}-${Date.now()}.pdf`;
        const uploadResult = await uploadToS3(pdfBytes, fileName);

        // Update the order history with generated link
        // await OrderMaterialHistoryModel.findByIdAndUpdate({projectId}, {
        //     generatedLink: uploadResult.Location
        // });

        // console.log("generateld dat", uploadResult.Location)


        const pdfData = {
            url: uploadResult.Location,
            refUniquePdf, // <-- now has projectName-uniquenumber-pdf
            pdfName: "Order Material",
            status: "pending",
            _id: new mongoose.Types.ObjectId()
        };

        // if (Array.isArray(orderHistory.generatedLink)) {
        //     orderHistory?.generatedLink?.push(pdfData as IPdfGenerator);
        // } else {
        //     orderHistory.generatedLink = []
        //     orderHistory?.generatedLink.push(pdfData as IPdfGenerator)
        // }

        // console.log("orderHistory.generatedLink", orderHistory.generatedLink)



        // const ProcurementNewItems: any[] = [];
        // const subItemMap: Record<string, any> = {}; // key = subItemName

        // orderHistory?.publicUnits?.subItems?.forEach((subItem: any) => {
        //     const { _id, refId, ...rest } = subItem.toObject ? subItem.toObject() : subItem;

        //     const name = rest.subItemName?.trim().toLowerCase() || "";
        //     const unitKey = rest.unit?.trim().toLowerCase() || "";
        //     const key = `${name}__${unitKey}`; // combine name + unit

        //     if (key) {
        //         if (subItemMap[key]) {
        //             // Already exists with same name+unit → add quantity
        //             subItemMap[key].quantity += rest.quantity || 0;
        //         } else {
        //             // Create fresh entry
        //             subItemMap[key] = {
        //                 ...rest,
        //                 quantity: rest.quantity || 0,
        //                 _id: new mongoose.Types.ObjectId() // always refresh ID
        //             };
        //         }
        //     }
        // });

        // // Convert map back to array
        // Object.values(subItemMap).forEach((item: any) => ProcurementNewItems.push(item));

        // // console.log("procurement", ProcurementNewItems)
        // await ProcurementModelNew.create({
        //     organizationId,
        //     projectId: projectId,
        //     shopDetails: orderHistory.publicUnits.shopDetails,
        //     deliveryLocationDetails: orderHistory.deliveryLocationDetails,
        //     selectedUnits: ProcurementNewItems,
        //     refPdfId: refUniquePdf,
        //     totalCost: 0,
        //     isSyncWithPaymentsSection: false,
        //     isConfirmedRate: false,



        //     fromDeptNumber: refUniquePdf,
        //     fromDeptName: "Order Material",
        //     fromDeptModel: "OrderMaterialHistoryModel",
        //     fromDeptRefId: orderHistory._id as Types.ObjectId,


        // })
        // Clear subItems from each selectedUnit

        orderHistory.publicUnits.subItems = [];
        orderHistory.publicUnits.shopDetails = {
            shopName: null,
            address: null,
            contactPerson: null,
            phoneNumber: null
        };
        orderHistory.needsStaffReview = false;


        orderItem.pdfLink = pdfData



        await orderHistory.save();



        // console.log("orderhisoty", orderHistory)

        return {
            ok: true,
            pdfUrl: uploadResult.Location,
            data: {
                orderHistory,
                pdfData: pdfData
            },
            message: 'PDF generated successfully'
        };

    } catch (error: any) {
        console.error('Error generating PDF:', error);
        throw new Error(`PDF generation failed: ${error.message}`);
    }
};


// not in use
// export const gerneateCommonOrdersPdf = async (id: string) => {
//     try {
//         // Fetch order history data
//         const orderHistory = await CommonOrderHistoryModel
//             .findById(id)
//             .populate("organizationId");

//         if (!orderHistory) {
//             throw new Error("Order history not found");
//         }

//         let nextNumber = 1;

//         if (Array.isArray(orderHistory.pdfLink) && orderHistory.pdfLink.length > 0) {
//             const numbers = orderHistory.pdfLink.map((item: any) => {
//                 const match = item.refUniquePdf?.match(/-(\d+)$/);
//                 return match ? parseInt(match[1], 10) : 0;
//             });

//             nextNumber = Math.max(...numbers) + 1;
//         }

//         const currentYear = new Date().getFullYear();

//         const refUniquePdf = `CMN-ORD-${orderHistory.projectName}-${currentYear}-${nextNumber}`;

//         // Create a new PDF document
//         const pdfDoc = await PDFDocument.create();
//         let page = pdfDoc.addPage([595, 842]); // A4 size
//         const { width, height } = page.getSize();

//         // Load fonts
//         const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
//         const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

//         let yPosition = height - 20;

//         try {
//             const logoRes = await fetch(COMPANY_LOGO);
//             const logoBuffer = await logoRes.arrayBuffer();
//             const logoImage = await pdfDoc.embedJpg(logoBuffer);

//             const logoScale = 0.5;
//             const logoDims = logoImage.scale(logoScale);

//             const brandText = "Vertical Living";
//             const brandFontSize = 20;
//             const brandColor = rgb(0.1, 0.4, 0.9);
//             const brandTextWidth = boldFont.widthOfTextAtSize(brandText, brandFontSize);

//             const spacing = 10; // space between logo and text

//             // Total width = logo + spacing + text
//             const totalWidth = logoDims.width + spacing + brandTextWidth;

//             // X and Y to center the whole block horizontally and set a top margin
//             const combinedX = (width - totalWidth) / 2;
//             const topY = yPosition; // use existing yPosition for vertical positioning

//             // Draw logo
//             page.drawImage(logoImage, {
//                 x: combinedX,
//                 y: topY - logoDims.height,
//                 width: logoDims.width,
//                 height: logoDims.height,
//             });

//             // Align text vertically with logo (visually aligned mid-way)
//             const textY = topY - (logoDims.height / 2) - (brandFontSize / 3);

//             // Draw text next to logo
//             page.drawText(brandText, {
//                 x: combinedX + logoDims.width + spacing,
//                 y: textY,
//                 size: brandFontSize,
//                 font: boldFont,
//                 color: brandColor,
//             });

//             // Update yPosition to be below the logo
//             yPosition = topY - logoDims.height - 5;

//             // Draw horizontal line
//             page.drawLine({
//                 start: { x: 50, y: yPosition },
//                 end: { x: width - 50, y: yPosition },
//                 thickness: 1,
//                 color: rgb(0.6, 0.6, 0.6),
//             });

//             yPosition -= 30;
//         } catch (err) {
//             console.error("Failed to load company logo:", err);
//         }

//         const heading = "MATERIAL ORDER";

//         const referenceId = `Order Number: ${refUniquePdf}`; // e.g. projectName-01-pdf

//         type OrgPopulated = { organizationPhoneNo?: string };
//         const PhoneNo = (orderHistory.organizationId as OrgPopulated)?.organizationPhoneNo ? `Ph No: ${(orderHistory.organizationId as OrgPopulated)?.organizationPhoneNo || ""}` : null;

//         // Measure text widths
//         const headingWidth = boldFont.widthOfTextAtSize(heading, 18);
//         const refWidth = boldFont.widthOfTextAtSize(referenceId, 8);

//         // Set margins
//         const leftMargin = 50;
//         const rightMargin = 50;

//         // Page width
//         const pageWidth = page.getWidth();

//         // X positions
//         const headingX = leftMargin;
//         const refX = pageWidth - rightMargin - refWidth;

//         // Draw heading (left)
//         page.drawText(heading, {
//             x: headingX,
//             y: yPosition,
//             size: 18,
//             font: boldFont,
//             color: rgb(0.0, 0.2, 0.4),
//         });

//         // Draw reference id (right, same y)
//         page.drawText(referenceId, {
//             x: refX,
//             y: yPosition,
//             size: 8,
//             font: boldFont,
//             color: rgb(0.0, 0.2, 0.4),
//         });

//         if (PhoneNo) {
//             const lineHeight = 12; // you can tweak this (slightly bigger than font size)
//             page.drawText(PhoneNo, {
//                 x: refX,
//                 y: yPosition - lineHeight,
//                 size: 8,
//                 font: boldFont,
//                 color: rgb(0.0, 0.2, 0.4),
//             });
//         }

//         yPosition -= 30; // move down for next content

//         // Project details
//         if (orderHistory.projectName) {
//             const projectText = `Project: ${orderHistory.projectName}`;
//             page.drawText(projectText, {
//                 x: 50,
//                 y: yPosition,
//                 size: 16,
//                 font: boldFont,
//                 color: rgb(0.3, 0.3, 0.3),
//             });
//             yPosition -= 40;
//         }



//         // Shop Details Section
//         // if (orderHistory.shopDetails) {
//         //     page.drawText("Shop Details:", {
//         //         x: 50,
//         //         y: yPosition,
//         //         size: 14,
//         //         font: boldFont,
//         //         color: rgb(0.2, 0.2, 0.2),
//         //     });
//         //     yPosition -= 20;

//         //     if (orderHistory.shopDetails.shopName) {
//         //         page.drawText(`Shop Name: ${orderHistory.shopDetails.shopName}`, {
//         //             x: 50,
//         //             y: yPosition,
//         //             size: 10,
//         //             font: regularFont,
//         //             color: rgb(0.3, 0.3, 0.3),
//         //         });
//         //         yPosition -= 15;
//         //     }

//         //     if (orderHistory.shopDetails.address) {
//         //         page.drawText(`Address: ${orderHistory.shopDetails.address}`, {
//         //             x: 50,
//         //             y: yPosition,
//         //             size: 10,
//         //             font: regularFont,
//         //             color: rgb(0.3, 0.3, 0.3),
//         //         });
//         //         yPosition -= 15;
//         //     }

//         //     if (orderHistory.shopDetails.contactPerson) {
//         //         page.drawText(`Contact Person: ${orderHistory.shopDetails.contactPerson}`, {
//         //             x: 50,
//         //             y: yPosition,
//         //             size: 10,
//         //             font: regularFont,
//         //             color: rgb(0.3, 0.3, 0.3),
//         //         });
//         //         yPosition -= 15;
//         //     }

//         //     if (orderHistory.shopDetails.phoneNumber) {
//         //         page.drawText(`Phone: ${orderHistory.shopDetails.phoneNumber}`, {
//         //             x: 50,
//         //             y: yPosition,
//         //             size: 10,
//         //             font: regularFont,
//         //             color: rgb(0.3, 0.3, 0.3),
//         //         });
//         //         yPosition -= 15;
//         //     }
//         //     yPosition -= 10;
//         // }

//         // Delivery Location Details Section
//         // if (orderHistory.deliveryLocationDetails) {
//         //     page.drawText("Delivery Location:", {
//         //         x: 50,
//         //         y: yPosition,
//         //         size: 14,
//         //         font: boldFont,
//         //         color: rgb(0.2, 0.2, 0.2),
//         //     });
//         //     yPosition -= 20;

//         //     if (orderHistory.deliveryLocationDetails.siteName) {
//         //         page.drawText(`Site Name: ${orderHistory.deliveryLocationDetails.siteName}`, {
//         //             x: 50,
//         //             y: yPosition,
//         //             size: 10,
//         //             font: regularFont,
//         //             color: rgb(0.3, 0.3, 0.3),
//         //         });
//         //         yPosition -= 15;
//         //     }

//         //     if (orderHistory.deliveryLocationDetails.address) {
//         //         page.drawText(`Site Address: ${orderHistory.deliveryLocationDetails.address}`, {
//         //             x: 50,
//         //             y: yPosition,
//         //             size: 10,
//         //             font: regularFont,
//         //             color: rgb(0.3, 0.3, 0.3),
//         //         });
//         //         yPosition -= 15;
//         //     }

//         //     if (orderHistory.deliveryLocationDetails.siteSupervisor) {
//         //         page.drawText(`Site Supervisor: ${orderHistory.deliveryLocationDetails.siteSupervisor}`, {
//         //             x: 50,
//         //             y: yPosition,
//         //             size: 10,
//         //             font: regularFont,
//         //             color: rgb(0.3, 0.3, 0.3),
//         //         });
//         //         yPosition -= 15;
//         //     }

//         //     if (orderHistory.deliveryLocationDetails.phoneNumber) {
//         //         page.drawText(`Contact: ${orderHistory.deliveryLocationDetails.phoneNumber}`, {
//         //             x: 50,
//         //             y: yPosition,
//         //             size: 10,
//         //             font: regularFont,
//         //             color: rgb(0.3, 0.3, 0.3),
//         //         });
//         //         yPosition -= 15;
//         //     }
//         //     yPosition -= 20;
//         // }


//         // Process each unit and its sub-items
//         let serialNumber = 1;

//         for (const unit of orderHistory?.selectedUnits) {


//             //no room condition - only show unit if it has subitems
//             if (!unit?.subItems || unit?.subItems?.length === 0) {
//                 continue; // Skip units without subitems
//             }

//             // Unit name heading
//             if (unit.unitName) {
//                 page.drawText(`Unit: ${unit.unitName}`, {
//                     x: 50,
//                     y: yPosition,
//                     size: 14,
//                     font: boldFont,
//                     color: rgb(0.2, 0.2, 0.2),
//                 });
//                 yPosition -= 30;
//             }

//             // Check if we need a new page
//             if (yPosition < 150) {
//                 page = pdfDoc.addPage([595, 842]);
//                 yPosition = height - 50;
//             }

//             // Table headers
//             const tableStartY = yPosition;
//             const rowHeight = 25;
//             // const columnWidths = [60, , 300, 80, 80]; // S.No, Material Item, Quantity, Unit
//             // const columnPositions = [50, 110, 410, 490];

//             const columnWidths = [50, 100, 200, 80, 50];
//             const columnPositions = [
//                 50,  // S.No
//                 100, // Ref ID
//                 180, // Material Item
//                 420, // Quantity
//                 500  // Unit
//             ];
//             // Draw table header background
//             page.drawRectangle({
//                 x: 45,
//                 y: yPosition - 5,
//                 width: 500,
//                 height: rowHeight,
//                 color: rgb(0.9, 0.9, 0.9),
//             });

//             // Table headers
//             const headers = ['S.No', 'Ref ID', 'Material Item', 'Quantity', 'Unit'];
//             headers.forEach((header, index) => {
//                 page.drawText(header, {
//                     x: columnPositions[index],
//                     y: yPosition,
//                     size: 12,
//                     font: boldFont,
//                     color: rgb(0.2, 0.2, 0.2),
//                 });
//             });

//             yPosition -= rowHeight + 5;

//             // Table content - sub items
//             if (unit.subItems && unit.subItems.length > 0) {
//                 unit.subItems.forEach((subItem, index) => {
//                     // Alternate row coloring
//                     if (index % 2 === 0) {
//                         page.drawRectangle({
//                             x: 45,
//                             y: yPosition - 5,
//                             width: 500,
//                             height: rowHeight,
//                             color: rgb(0.98, 0.98, 0.98),
//                         });
//                     }

//                     // Table borders
//                     page.drawRectangle({
//                         x: 45,
//                         y: yPosition - 5,
//                         width: 500,
//                         height: rowHeight,
//                         borderColor: rgb(0.8, 0.8, 0.8),
//                         borderWidth: 0.5,
//                     });

//                     const rowData = [
//                         serialNumber.toString(),
//                         subItem.refId || "N/A",
//                         subItem.subItemName || 'N/A',
//                         (subItem.quantity || 0).toString(),
//                         subItem.unit || 'N/A'
//                     ];

//                     rowData.forEach((data, colIndex) => {
//                         let displayText = data;
//                         // Truncate long text to fit in column
//                         if (colIndex === 1 && data.length > 35) {
//                             displayText = data.substring(0, 32) + '...';
//                         }

//                         page.drawText(displayText, {
//                             x: columnPositions[colIndex],
//                             y: yPosition,
//                             size: 10,
//                             font: regularFont,
//                             color: rgb(0.3, 0.3, 0.3),
//                         });
//                     });

//                     yPosition -= rowHeight;
//                     serialNumber++;

//                     // Check if we need a new page
//                     if (yPosition < 100) {
//                         page = pdfDoc.addPage([595, 842]);
//                         yPosition = height - 50;
//                     }
//                 });
//             } else {
//                 // No sub items message
//                 page.drawText('No sub-items available', {
//                     x: columnPositions[1],
//                     y: yPosition,
//                     size: 10,
//                     font: regularFont,
//                     color: rgb(0.6, 0.6, 0.6),
//                 });
//                 yPosition -= rowHeight;
//             }

//             yPosition -= 20; // Space between units
//         }

//         // // Total cost section
//         // if (orderHistory.totalCost) {
//         //     yPosition -= 20;
//         //     page.drawText(`Total Cost: Rs${orderHistory.totalCost.toLocaleString()}`, {
//         //         x: width - 200,
//         //         y: yPosition,
//         //         size: 14,
//         //         font: boldFont,
//         //         color: rgb(0.2, 0.2, 0.2),
//         //     });
//         // }

//         // // Footer
//         // const footerY = 50;
//         // page.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
//         //     x: 50,
//         //     y: footerY,
//         //     size: 8,
//         //     font: regularFont,
//         //     color: rgb(0.6, 0.6, 0.6),
//         // });

//         // Save PDF
//         const pdfBytes = await pdfDoc.save();

//         // Upload to AWS S3
//         const fileName = `order-material/order-${orderHistory.projectName}-${Date.now()}.pdf`;
//         const uploadResult = await uploadToS3(pdfBytes, fileName);

//         const pdfData: any = {
//             url: uploadResult.Location,
//             refUniquePdf, // <-- now has projectName-uniquenumber-pdf
//             pdfName: "Order Material",
//             status: "pending",
//             _id: new mongoose.Types.ObjectId()
//         };

//         if (Array.isArray(orderHistory.pdfLink)) {
//             orderHistory?.pdfLink?.push(pdfData);
//         } else {
//             orderHistory.pdfLink = []
//             orderHistory?.pdfLink.push(pdfData)
//         }

//         console.log("orderHistory.pdfLink", orderHistory.pdfLink)

//         const ProcurementNewItems: any[] = [];
//         const subItemMap: Record<string, any> = {}; // key = subItemName

//         orderHistory.selectedUnits.forEach(unit => {
//             unit.subItems.forEach((subItem: any) => {
//                 const { _id, refId, ...rest } = subItem.toObject ? subItem.toObject() : subItem;

//                 const name = rest.subItemName?.trim().toLowerCase() || "";
//                 const unitKey = rest.unit?.trim().toLowerCase() || "";
//                 const key = `${name}__${unitKey}`; // combine name + unit

//                 if (key) {
//                     if (subItemMap[key]) {
//                         // Already exists with same name+unit → add quantity
//                         subItemMap[key].quantity += rest.quantity || 0;
//                     } else {
//                         // Create fresh entry
//                         subItemMap[key] = {
//                             ...rest,
//                             quantity: rest.quantity || 0,
//                             _id: new mongoose.Types.ObjectId() // always refresh ID
//                         };
//                     }
//                 }
//             });
//         });

//         // Convert map back to array
//         Object.values(subItemMap).forEach((item: any) => ProcurementNewItems.push(item));

//         // console.log("procurement", ProcurementNewItems)
//         await ProcurementModelNew.create({
//             organizationId: orderHistory.organizationId._id,
//             // projectId: projectId,
//             shopDetails: orderHistory.shopDetails,
//             deliveryLocationDetails: orderHistory.deliveryLocationDetails,
//             selectedUnits: ProcurementNewItems,
//             refPdfId: refUniquePdf,
//             totalCost: 0,

//             isSyncWithPaymentsSection: false,
//             isConfirmedRate: false,


//             fromDeptNumber: refUniquePdf,
//             fromDeptName: "Common Order Material",
//             fromDeptModel: "CommonOrderHistoryModel",
//             fromDeptRefId: orderHistory._id as Types.ObjectId,


//         })
//         // Clear subItems from each selectedUnit

//         orderHistory.selectedUnits.forEach(unit => {
//             unit.subItems = [];
//         });
//         // orderHistory.images = [];



//         // Clear subItems from each selectedUnit
//         // orderHistory.selectedUnits.forEach(unit => {
//         //     unit.subItems = [];
//         // });

//         await orderHistory.save();

//         // console.log("orderhisoty", orderHistory)

//         return {
//             ok: true,
//             pdfUrl: uploadResult.Location,
//             data: orderHistory,
//             message: 'PDF generated successfully'
//         };

//     } catch (error: any) {
//         console.error('Error generating PDF:', error);
//         throw new Error(`PDF generation failed: ${error.message}`);
//     }
// }


export const generateCommonOrderHistoryPDF = async (id: string, organizationId: string, orderItemId: string) => {
    try {
        // Fetch order history data
        // Fetch order history data
        const orderHistory = await CommonOrderHistoryModel.findById(id)
            // .populate('projectId', 'projectName _id organizationId')


        if (!orderHistory) {
            throw new Error('Order history not found for the given project ID');
        }


        let orderItem = orderHistory.orderedItems.find((order: any) => order._id.toString() === orderItemId.toString())

        if (!orderItem) {
            throw new Error('Order Item not found');

        }

        // let nextNumber = 1;
        // const isNewPdf = Array.isArray(orderHistory.generatedLink) && orderHistory.generatedLink.length > 0;

        // if (isNewPdf) {
        //     // Extract all numbers from refUniquePdf (format: projectName-<number>-pdf)
        //     const numbers = orderHistory.generatedLink.map(ele => {
        //         const match = ele.refUniquePdf?.match(/-(\d+)$/);
        //         return match ? parseInt(match[1], 10) : 0; // Extract the number part
        //     });

        //     // Find the max number and increment
        //     nextNumber = Math.max(...numbers, 0) + 1;
        // }


        // const currentYear = new Date().getFullYear()


        // // Always 3-digit format
        // const paddedNumber = String(nextNumber).padStart(3, "0");
        // const rawProjectId = (orderHistory.projectId as any)._id.toString().slice(-3);

        const refUniquePdf = orderItem?.orderMaterialNumber;


        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage([595, 842]); // A4 size
        const { width, height } = page.getSize();

        // Load fonts
        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        let yPosition = height - 20;

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

            const spacing = 10; // space between logo and text

            // Total width = logo + spacing + text
            const totalWidth = logoDims.width + spacing + brandTextWidth;

            // X and Y to center the whole block horizontally and set a top margin
            const combinedX = (width - totalWidth) / 2;
            const topY = yPosition; // use existing yPosition for vertical positioning

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
                font: boldFont,
                color: brandColor,
            });

            // Update yPosition to be below the logo
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
        }

        // // Material Order heading
        // const heading = "MATERIAL ORDER";
        // page.drawText(heading, {
        //     x: 50,
        //     y: yPosition,
        //     size: 18,
        //     font: boldFont,
        //     color: rgb(0.0, 0.2, 0.4),
        // });
        // yPosition -= 20;

        const heading = "Order Material";

        const referenceId = `Order Id: ${refUniquePdf}`; // e.g. projectName-01-pdf

        // Measure text widths
        const headingWidth = boldFont.widthOfTextAtSize(heading, 18);
        const refWidth = boldFont.widthOfTextAtSize(referenceId, 12);

        // Set margins
        const leftMargin = 50;
        const rightMargin = 50;

        // Page width
        const pageWidth = page.getWidth();

        // X positions
        const headingX = leftMargin;
        const refX = pageWidth - rightMargin - refWidth;

        // Draw heading (left)
        page.drawText(heading, {
            x: headingX,
            y: yPosition,
            size: 18,
            font: boldFont,
            color: rgb(0.0, 0.2, 0.4),
        });

        // Draw reference id (right, same y)
        page.drawText(referenceId, {
            x: refX,
            y: yPosition,
            size: 12,
            font: boldFont,
            color: rgb(0.0, 0.2, 0.4),
        });

        yPosition -= 30; // move down for next content

        // // Project details
        // if (orderHistory.projectId) {
        //     const projectText = `Project: ${(orderHistory.projectId as any).projectName}`;
        //     page.drawText(projectText, {
        //         x: 50,
        //         y: yPosition,
        //         size: 16,
        //         font: boldFont,
        //         color: rgb(0.3, 0.3, 0.3),
        //     });
        //     yPosition -= 40;
        // }



        // // FIRST VERSION
        //           // ========== IMAGES SECTION - AFTER PROJECT DETAILS ==========
        //         // Check if images exist and have URLs
        //         const hasImages = orderHistory.images && 
        //                          Array.isArray(orderHistory.images) && 
        //                          orderHistory.images.length > 0 &&
        //                          orderHistory.images.some(img => img && img.url && img.url.trim() !== '');

        //         if (hasImages) {
        //             // Add heading for images section
        //             page.drawText("Images:", {
        //                 x: 50,
        //                 y: yPosition,
        //                 size: 14,
        //                 font: boldFont,
        //                 color: rgb(0.2, 0.2, 0.2),
        //             });
        //             yPosition -= 25;

        //             const imageWidth = 150; // Fixed width for images
        //             const imageHeight = 150; // Fixed height for images
        //             const margin = 20; // Margin between images
        //             const imagesPerRow = Math.floor((width - 100) / (imageWidth + margin));

        //             let currentRow = 0;
        //             let currentCol = 0;

        //             // Filter valid images (with URLs)
        //             const validImages = orderHistory.images.filter(img => img && img.url && img.url.trim() !== '');

        //             for (let i = 0; i < validImages.length; i++) {
        //                 const image = validImages[i];

        //                 // Check if we need a new page
        //                 if (yPosition < imageHeight + 100) {
        //                     page = pdfDoc.addPage([595, 842]);
        //                     yPosition = height - 50;
        //                     currentRow = 0;
        //                     currentCol = 0;
        //                 }

        //                 try {
        //                     // Calculate position
        //                     const xPos = 50 + (currentCol * (imageWidth + margin));
        //                     const yPos = yPosition - imageHeight;

        //                     // Fetch and embed image
        //                     const imageRes = await fetch(image?.url!);

        //                     // Check if response is OK
        //                     if (!imageRes.ok) {
        //                         console.warn(`Failed to fetch image ${i+1}: ${imageRes.statusText}`);
        //                         continue;
        //                     }

        //                     const imageBuffer = await imageRes.arrayBuffer();

        //                     // Check if buffer has data
        //                     if (!imageBuffer || imageBuffer.byteLength === 0) {
        //                         console.warn(`Image ${i+1} has empty buffer`);
        //                         continue;
        //                     }

        //                     // Try to determine image type and embed
        //                     let embeddedImage;
        //                     try {
        //                         // Try as JPEG
        //                         embeddedImage = await pdfDoc.embedJpg(imageBuffer);
        //                     } catch (jpgError) {
        //                         try {
        //                             // Try as PNG
        //                             embeddedImage = await pdfDoc.embedPng(imageBuffer);
        //                         } catch (pngError) {
        //                             console.warn(`Failed to embed image ${i+1}: Not a valid JPEG or PNG`);
        //                             continue;
        //                         }
        //                     }

        //                     // Calculate scaling to fit within fixed dimensions while maintaining aspect ratio
        //                     const imgDims = embeddedImage.scale(1);
        //                     const scale = Math.min(
        //                         imageWidth / imgDims.width,
        //                         imageHeight / imgDims.height
        //                     );

        //                     const scaledWidth = imgDims.width * scale;
        //                     const scaledHeight = imgDims.height * scale;

        //                     // Center image in the allocated space
        //                     const xOffset = xPos + (imageWidth - scaledWidth) / 2;
        //                     const yOffset = yPos + (imageHeight - scaledHeight) / 2;

        //                     // Draw image with border
        //                     page.drawRectangle({
        //                         x: xPos,
        //                         y: yPos,
        //                         width: imageWidth,
        //                         height: imageHeight,
        //                         borderColor: rgb(0.8, 0.8, 0.8),
        //                         borderWidth: 1,
        //                         color: rgb(0.95, 0.95, 0.95), // Light background for transparency
        //                     });

        //                     page.drawImage(embeddedImage, {
        //                         x: xOffset,
        //                         y: yOffset,
        //                         width: scaledWidth,
        //                         height: scaledHeight,
        //                     });

        //                     // Add image number
        //                     page.drawText(`Image ${i + 1}`, {
        //                         x: xPos + 5,
        //                         y: yPos - 15,
        //                         size: 8,
        //                         font: regularFont,
        //                         color: rgb(0.5, 0.5, 0.5),
        //                     });

        //                     // Update column position
        //                     currentCol++;

        //                     // Move to next row if needed
        //                     if (currentCol >= imagesPerRow) {
        //                         currentCol = 0;
        //                         currentRow++;
        //                         yPosition -= (imageHeight + margin + 25); // Add space for next row + label
        //                     }

        //                 } catch (error) {
        //                     console.warn(`Failed to process image ${i+1}:`, error);
        //                     // Continue with next image even if one fails
        //                     continue;
        //                 }
        //             }

        //             // After all images, update yPosition for next section
        //             if (currentCol > 0) {
        //                 yPosition -= (imageHeight + margin + 25);
        //             }

        //             // Add some space after images section
        //             yPosition -= 30;
        //         }
        // ========== END IMAGES SECTION ==========


        // SECOND VERSION

        // ========== IMAGES SECTION - AFTER PROJECT DETAILS ==========
        // Check if images exist and have URLs
        const hasImages = orderItem?.images &&
            Array.isArray(orderItem?.images) &&
            orderItem?.images.length > 0 &&
            orderItem?.images.some(img => img && img.url && img.url.trim() !== '');

        if (hasImages) {
            // Add heading for images section
            page.drawText("Images:", {
                x: 50,
                y: yPosition,
                size: 14,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2),
            });
            yPosition -= 25;

            const maxImageWidth = 150; // Maximum width for images
            const maxImageHeight = 150; // Maximum height for images
            const margin = 30; // Margin between images
            const imagesPerRow = 3; // Fixed to 3 images per row

            // Filter valid images (with URLs)
            const validImages = orderItem.images.filter(img => img && img.url && img.url.trim() !== '');

            // Calculate available width for each image in the row
            const totalAvailableWidth = width - 100; // 50px margin on each side
            const imageWidth = (totalAvailableWidth - ((imagesPerRow - 1) * margin)) / imagesPerRow;
            const imageHeight = maxImageHeight;

            let currentRow = 0;
            let currentCol = 0;

            for (let i = 0; i < validImages.length; i++) {
                const image = validImages[i];

                // Check if we need a new page
                if (yPosition < imageHeight + 100) {
                    page = pdfDoc.addPage([595, 842]);
                    yPosition = height - 50;
                    currentRow = 0;
                    currentCol = 0;

                    // Redraw "Images:" heading on new page
                    page.drawText("Images (continued):", {
                        x: 50,
                        y: yPosition,
                        size: 14,
                        font: boldFont,
                        color: rgb(0.2, 0.2, 0.2),
                    });
                    yPosition -= 25;
                }

                try {
                    // Calculate position
                    const xPos = 50 + (currentCol * (imageWidth + margin));
                    const yPos = yPosition - imageHeight;

                    // Fetch and embed image
                    const imageRes = await fetch(image?.url!);

                    // Check if response is OK
                    if (!imageRes.ok) {
                        console.warn(`Failed to fetch image ${i + 1}: ${imageRes.statusText}`);
                        currentCol++;
                        if (currentCol >= imagesPerRow) {
                            currentCol = 0;
                            currentRow++;
                            yPosition -= (imageHeight + margin);
                        }
                        continue;
                    }

                    const imageBuffer = await imageRes.arrayBuffer();

                    // Check if buffer has data
                    if (!imageBuffer || imageBuffer.byteLength === 0) {
                        console.warn(`Image ${i + 1} has empty buffer`);
                        currentCol++;
                        if (currentCol >= imagesPerRow) {
                            currentCol = 0;
                            currentRow++;
                            yPosition -= (imageHeight + margin);
                        }
                        continue;
                    }

                    // Try to determine image type and embed
                    let embeddedImage;
                    try {
                        // Try as JPEG
                        embeddedImage = await pdfDoc.embedJpg(imageBuffer);
                    } catch (jpgError) {
                        try {
                            // Try as PNG
                            embeddedImage = await pdfDoc.embedPng(imageBuffer);
                        } catch (pngError) {
                            console.warn(`Failed to embed image ${i + 1}: Not a valid JPEG or PNG`);
                            currentCol++;
                            if (currentCol >= imagesPerRow) {
                                currentCol = 0;
                                currentRow++;
                                yPosition -= (imageHeight + margin);
                            }
                            continue;
                        }
                    }

                    // Get original image dimensions
                    const imgDims = embeddedImage.scale(1);

                    // Calculate scaling to fit within the allocated width/height while maintaining aspect ratio
                    const scale = Math.min(
                        imageWidth / imgDims.width,
                        imageHeight / imgDims.height
                    );

                    const scaledWidth = imgDims.width * scale;
                    const scaledHeight = imgDims.height * scale;

                    // Center image in the allocated space
                    const xOffset = xPos + (imageWidth - scaledWidth) / 2;
                    const yOffset = yPos + (imageHeight - scaledHeight) / 2;

                    // Draw only the image (no background, no border)
                    page.drawImage(embeddedImage, {
                        x: xOffset,
                        y: yOffset,
                        width: scaledWidth,
                        height: scaledHeight,
                    });

                    // Add image number below the image
                    const imageNumber = `Image ${i + 1}`;
                    const numberWidth = regularFont.widthOfTextAtSize(imageNumber, 9);
                    const numberX = xPos + (imageWidth - numberWidth) / 2;

                    page.drawText(imageNumber, {
                        x: numberX,
                        y: yPos - 15,
                        size: 9,
                        font: regularFont,
                        color: rgb(0.4, 0.4, 0.4),
                    });

                    // Update column position
                    currentCol++;

                    // Move to next row if needed
                    if (currentCol >= imagesPerRow) {
                        currentCol = 0;
                        currentRow++;
                        yPosition -= (imageHeight + margin + 20); // Image height + margin + label space
                    }

                } catch (error) {
                    console.warn(`Failed to process image ${i + 1}:`, error);
                    // Continue with next image even if one fails
                    currentCol++;
                    if (currentCol >= imagesPerRow) {
                        currentCol = 0;
                        currentRow++;
                        yPosition -= (imageHeight + margin + 20);
                    }
                    continue;
                }
            }

            // After all images, update yPosition for next section
            if (currentCol > 0) {
                yPosition -= (imageHeight + margin + 20);
            }

            // Add some space after images section
            yPosition -= 30;
        }
        // ========== END IMAGES SECTION ==========


        // Shop Details Section
        // if (orderHistory.shopDetails) {
        //     page.drawText("Shop Details:", {
        //         x: 50,
        //         y: yPosition,
        //         size: 14,
        //         font: boldFont,
        //         color: rgb(0.2, 0.2, 0.2),
        //     });
        //     yPosition -= 20;

        //     if (orderHistory.shopDetails.shopName) {
        //         page.drawText(`Shop Name: ${orderHistory.shopDetails.shopName}`, {
        //             x: 50,
        //             y: yPosition,
        //             size: 10,
        //             font: regularFont,
        //             color: rgb(0.3, 0.3, 0.3),
        //         });
        //         yPosition -= 15;
        //     }

        //     if (orderHistory.shopDetails.address) {
        //         page.drawText(`Address: ${orderHistory.shopDetails.address}`, {
        //             x: 50,
        //             y: yPosition,
        //             size: 10,
        //             font: regularFont,
        //             color: rgb(0.3, 0.3, 0.3),
        //         });
        //         yPosition -= 15;
        //     }

        //     if (orderHistory.shopDetails.contactPerson) {
        //         page.drawText(`Contact Person: ${orderHistory.shopDetails.contactPerson}`, {
        //             x: 50,
        //             y: yPosition,
        //             size: 10,
        //             font: regularFont,
        //             color: rgb(0.3, 0.3, 0.3),
        //         });
        //         yPosition -= 15;
        //     }

        //     if (orderHistory.shopDetails.phoneNumber) {
        //         page.drawText(`Phone: ${orderHistory.shopDetails.phoneNumber}`, {
        //             x: 50,
        //             y: yPosition,
        //             size: 10,
        //             font: regularFont,
        //             color: rgb(0.3, 0.3, 0.3),
        //         });
        //         yPosition -= 15;
        //     }
        //     yPosition -= 10;
        // }

        // Delivery Location Details Section
        // if (orderHistory.deliveryLocationDetails) {
        //     page.drawText("Delivery Location:", {
        //         x: 50,
        //         y: yPosition,
        //         size: 14,
        //         font: boldFont,
        //         color: rgb(0.2, 0.2, 0.2),
        //     });
        //     yPosition -= 20;

        //     if (orderHistory.deliveryLocationDetails.siteName) {
        //         page.drawText(`Site Name: ${orderHistory.deliveryLocationDetails.siteName}`, {
        //             x: 50,
        //             y: yPosition,
        //             size: 10,
        //             font: regularFont,
        //             color: rgb(0.3, 0.3, 0.3),
        //         });
        //         yPosition -= 15;
        //     }

        //     if (orderHistory.deliveryLocationDetails.address) {
        //         page.drawText(`Site Address: ${orderHistory.deliveryLocationDetails.address}`, {
        //             x: 50,
        //             y: yPosition,
        //             size: 10,
        //             font: regularFont,
        //             color: rgb(0.3, 0.3, 0.3),
        //         });
        //         yPosition -= 15;
        //     }

        //     if (orderHistory.deliveryLocationDetails.siteSupervisor) {
        //         page.drawText(`Site Supervisor: ${orderHistory.deliveryLocationDetails.siteSupervisor}`, {
        //             x: 50,
        //             y: yPosition,
        //             size: 10,
        //             font: regularFont,
        //             color: rgb(0.3, 0.3, 0.3),
        //         });
        //         yPosition -= 15;
        //     }

        //     if (orderHistory.deliveryLocationDetails.phoneNumber) {
        //         page.drawText(`Contact: ${orderHistory.deliveryLocationDetails.phoneNumber}`, {
        //             x: 50,
        //             y: yPosition,
        //             size: 10,
        //             font: regularFont,
        //             color: rgb(0.3, 0.3, 0.3),
        //         });
        //         yPosition -= 15;
        //     }
        //     yPosition -= 20;
        // }


        // Process each unit and its sub-items
        let serialNumber = 1;

        // for (const unit of orderItem?.selectedUnits) {
        // for (const unit of orderItem?.subItems) {


            //no room condition - only show unit if it has subitems
            // if (!unit?.subItems || unit?.subItems?.length === 0) {
            //     continue; // Skip units without subitems
            // }

            // // Unit name heading
            // if (unit.unitName) {
            //     page.drawText(`Unit: ${unit.unitName}`, {
            //         x: 50,
            //         y: yPosition,
            //         size: 14,
            //         font: boldFont,
            //         color: rgb(0.2, 0.2, 0.2),
            //     });
            //     yPosition -= 30;
            // }

            // Check if we need a new page
            if (yPosition < 150) {
                page = pdfDoc.addPage([595, 842]);
                yPosition = height - 50;
            }

            // Table headers
            const tableStartY = yPosition;
            const rowHeight = 25;
            // const columnWidths = [60, , 300, 80, 80]; // S.No, Material Item, Quantity, Unit
            // const columnPositions = [50, 110, 410, 490];

            const columnWidths = [50, 100, 200, 80, 50];
            const columnPositions = [
                50,  // S.No
                100, // Ref ID
                180, // Material Item
                420, // Quantity
                500  // Unit
            ];
            // Draw table header background
            page.drawRectangle({
                x: 45,
                y: yPosition - 5,
                width: 500,
                height: rowHeight,
                color: rgb(0.9, 0.9, 0.9),
            });

            // Table headers
            const headers = ['S.No', 'Ref ID', 'Material Item', 'Quantity', 'Unit'];
            headers.forEach((header, index) => {
                page.drawText(header, {
                    x: columnPositions[index],
                    y: yPosition,
                    size: 12,
                    font: boldFont,
                    color: rgb(0.2, 0.2, 0.2),
                });
            });

            yPosition -= rowHeight + 5;

            // Table content - sub items
            if (orderItem?.subItems && orderItem?.subItems.length > 0) {
                orderItem?.subItems.forEach((subItem, index) => {
                    // Alternate row coloring
                    if (index % 2 === 0) {
                        page.drawRectangle({
                            x: 45,
                            y: yPosition - 5,
                            width: 500,
                            height: rowHeight,
                            color: rgb(0.98, 0.98, 0.98),
                        });
                    }

                    // Table borders
                    page.drawRectangle({
                        x: 45,
                        y: yPosition - 5,
                        width: 500,
                        height: rowHeight,
                        borderColor: rgb(0.8, 0.8, 0.8),
                        borderWidth: 0.5,
                    });

                    const rowData = [
                        serialNumber.toString(),
                        subItem.refId || "N/A",
                        subItem.subItemName || 'N/A',
                        (subItem.quantity || 0).toString(),
                        subItem.unit || 'N/A'
                    ];

                    rowData.forEach((data, colIndex) => {
                        let displayText = data;
                        // Truncate long text to fit in column
                        if (colIndex === 1 && data.length > 35) {
                            displayText = data.substring(0, 32) + '...';
                        }

                        page.drawText(displayText, {
                            x: columnPositions[colIndex],
                            y: yPosition,
                            size: 10,
                            font: regularFont,
                            color: rgb(0.3, 0.3, 0.3),
                        });
                    });

                    yPosition -= rowHeight;
                    serialNumber++;

                    // Check if we need a new page
                    if (yPosition < 100) {
                        page = pdfDoc.addPage([595, 842]);
                        yPosition = height - 50;
                    }
                });
            } else {
                // No sub items message
                page.drawText('No sub-items available', {
                    x: columnPositions[1],
                    y: yPosition,
                    size: 10,
                    font: regularFont,
                    color: rgb(0.6, 0.6, 0.6),
                });
                yPosition -= rowHeight;
            }

            yPosition -= 20; // Space between units
        
        // }

        // // Total cost section
        // if (orderHistory.totalCost) {
        //     yPosition -= 20;
        //     page.drawText(`Total Cost: Rs${orderHistory.totalCost.toLocaleString()}`, {
        //         x: width - 200,
        //         y: yPosition,
        //         size: 14,
        //         font: boldFont,
        //         color: rgb(0.2, 0.2, 0.2),
        //     });
        // }

        // // Footer
        // const footerY = 50;
        // page.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
        //     x: 50,
        //     y: footerY,
        //     size: 8,
        //     font: regularFont,
        //     color: rgb(0.6, 0.6, 0.6),
        // });

        // Save PDF
        const pdfBytes = await pdfDoc.save();

        // Upload to AWS S3
        const fileName = `common-order-material/order-${id}-${Date.now()}.pdf`;
        const uploadResult = await uploadToS3(pdfBytes, fileName);

        // Update the order history with generated link
        // await OrderMaterialHistoryModel.findByIdAndUpdate({projectId}, {
        //     generatedLink: uploadResult.Location
        // });

        // console.log("generateld dat", uploadResult.Location)


        const pdfData:any = {
            url: uploadResult.Location,
            refUniquePdf, // <-- now has projectName-uniquenumber-pdf
            pdfName: "Common Order Material",
            status: "pending",
            _id: new mongoose.Types.ObjectId()
        };

        // if (Array.isArray(orderHistory.generatedLink)) {
        //     orderHistory?.generatedLink?.push(pdfData as IPdfGenerator);
        // } else {
        //     orderHistory.generatedLink = []
        //     orderHistory?.generatedLink.push(pdfData as IPdfGenerator)
        // }

        // console.log("orderHistory.generatedLink", orderHistory.generatedLink)



        orderItem.pdfLink = pdfData



        await orderHistory.save();

        // console.log("orderhisoty", orderHistory)

        return {
            ok: true,
            data: {
                orderHistory,
                pdfUrl: uploadResult.Location
            },
            message: 'PDF generated successfully'
        };

    } catch (error: any) {
        console.error('Error generating PDF:', error);
        throw new Error(`PDF generation failed: ${error.message}`);
    }
};

export {
    generateOrderHistoryPDF,
    // generateOrderHistoryPDFController,
    uploadToS3
};

// Example route usage:
// import { generateOrderHistoryPDFController } from './path-to-your-service.js';
// router.get('/generate-pdf/:projectId', generateOrderHistoryPDFController);