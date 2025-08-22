import { PDFDocument, PDFName, rgb, StandardFonts } from 'pdf-lib';
// import fetch from 'node-fetch';
import { s3, S3_BUCKET } from "../../../utils/s3Uploads/s3Client";
import { IPdfGenerator, OrderMaterialHistoryModel } from '../../../models/Stage Models/Ordering Material Model/OrderMaterialHistory.model';
import { Request, Response } from 'express';
import { ok } from 'assert';
import mongoose from 'mongoose';
import { CommonOrderHistoryModel } from '../../../models/Stage Models/Ordering Material Model/CommonOrderMaterialHistory Model/commonOrderMaterialHistory.model';

const COMPANY_LOGO = "https://th.bing.com/th/id/OIP.Uparc9uI63RDb82OupdPvwAAAA?w=80&h=80&c=1&bgcl=c77779&r=0&o=6&dpr=1.3&pid=ImgRC";
const COMPANY_NAME = "Vertical Living";

// Upload PDF to S3
const uploadToS3 = async (pdfBytes: any, fileName: any) => {
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
const generateOrderHistoryPDF = async (projectId: string) => {
    try {
        // Fetch order history data
        const orderHistory = await OrderMaterialHistoryModel.findOne({ projectId })
            .populate('projectId', 'projectName')


        if (!orderHistory) {
            throw new Error('Order history not found for the given project ID');
        }


        const isNewPdf = Array.isArray(orderHistory.generatedLink) && orderHistory.generatedLink.length > 0;
        let nextNumber = 1;

        if (isNewPdf) {
            // Extract all numbers from refUniquePdf (format: projectName-<number>-pdf)
            const numbers = orderHistory.generatedLink.map(ele => {
                const match = ele.refUniquePdf?.match(/-(\d+)-pdf$/);
                return match ? parseInt(match[1], 10) : 0; // Extract the number part
            });

            // Find the max number and increment
            nextNumber = Math.max(...numbers, 0) + 1;
        }

        // Construct the new refUniquePdf
        const refUniquePdf = `${(orderHistory.projectId as any).projectName}-${nextNumber}-pdf`;


        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage([595, 842]); // A4 size
        const { width, height } = page.getSize();

        // Load fonts
        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        let yPosition = height - 20;

        // Old method Add company logo
        // try {
        //     const logoResponse = await fetch(COMPANY_LOGO);
        //     const logoBuffer = await logoResponse.arrayBuffer();
        //     const logoImage = await pdfDoc.embedPng(logoBuffer);

        //     const logoSize = 60;
        //     page.drawImage(logoImage, {
        //         x: (width - logoSize) / 2,
        //         y: yPosition - logoSize,
        //         width: logoSize,
        //         height: logoSize,
        //     });
        //     yPosition -= logoSize + 20;
        // } catch (error) {
        //     console.log('Could not load logo, continuing without it');
        //     yPosition -= 20;
        // }




        // Company name
        // page.drawText(COMPANY_NAME, {
        //     x: (width - COMPANY_NAME.length * 12) / 2,
        //     y: yPosition,
        //     size: 24,
        //     font: boldFont,
        //    color: rgb(0, 0.4, 0.8),
        // });
        // yPosition -= 50;



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

        const referenceId = `Pdf Reference Id: ${refUniquePdf}`; // e.g. projectName-01-pdf

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

        for (const unit of orderHistory?.selectedUnits) {


            //no room condition - only show unit if it has subitems
            if (!unit?.subItems || unit?.subItems?.length === 0) {
                continue; // Skip units without subitems
            }

            // Unit name heading
            if (unit.unitName) {
                page.drawText(`Unit: ${unit.unitName}`, {
                    x: 50,
                    y: yPosition,
                    size: 14,
                    font: boldFont,
                    color: rgb(0.2, 0.2, 0.2),
                });
                yPosition -= 30;
            }

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
            if (unit.subItems && unit.subItems.length > 0) {
                unit.subItems.forEach((subItem, index) => {
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
        }

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
            _id: new mongoose.Types.ObjectId()
        };

        if (Array.isArray(orderHistory.generatedLink)) {
            orderHistory?.generatedLink?.push(pdfData as IPdfGenerator);
        } else {
            orderHistory.generatedLink = []
            orderHistory?.generatedLink.push(pdfData as IPdfGenerator)
        }

        console.log("orderHistory.generatedLink", orderHistory.generatedLink)
        await orderHistory.save();

        // console.log("orderhisoty", orderHistory)

        return {
            ok: true,
            pdfUrl: uploadResult.Location,
            data: orderHistory,
            message: 'PDF generated successfully'
        };

    } catch (error: any) {
        console.error('Error generating PDF:', error);
        throw new Error(`PDF generation failed: ${error.message}`);
    }
};



export const gerneateCommonOrdersPdf = async (id: string) => {
    try {
        // Fetch order history data
        const orderHistory = await CommonOrderHistoryModel.findById(id).populate("organizationId")



        if (!orderHistory) {
            throw new Error('Order history not found for the given project ID');
        }


        const isNewPdf = Array.isArray(orderHistory?.pdfLink) && orderHistory?.pdfLink.length > 0;
        let nextNumber = 1;

        if (isNewPdf) {
            // Extract all numbers from refUniquePdf (format: projectName-<number>-pdf)
            const numbers = orderHistory.pdfLink.map((ele: any) => {
                const match = ele.refUniquePdf?.match(/-(\d+)-pdf$/);
                return match ? parseInt(match[1], 10) : 0; // Extract the number part
            });

            // Find the max number and increment
            nextNumber = Math.max(...numbers, 0) + 1;
        }

        // Construct the new refUniquePdf
        const refUniquePdf = `cmn-${orderHistory.projectName}-${nextNumber}-pdf`;


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

        const heading = "MATERIAL ORDER";

        const referenceId = `Pdf Reference Id: ${refUniquePdf}`; // e.g. projectName-01-pdf

        type OrgPopulated = { organizationPhoneNo?: string };
        const PhoneNo = (orderHistory.organizationId as OrgPopulated)?.organizationPhoneNo ? `Ph No: ${(orderHistory.organizationId as OrgPopulated)?.organizationPhoneNo || ""}` : null;

        // Measure text widths
        const headingWidth = boldFont.widthOfTextAtSize(heading, 18);
        const refWidth = boldFont.widthOfTextAtSize(referenceId, 8);

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
            size: 8,
            font: boldFont,
            color: rgb(0.0, 0.2, 0.4),
        });

        if (PhoneNo) {
            const lineHeight = 12; // you can tweak this (slightly bigger than font size)
            page.drawText(PhoneNo, {
                x: refX,
                y: yPosition - lineHeight,
                size: 8,
                font: boldFont,
                color: rgb(0.0, 0.2, 0.4),
            });
        }

            yPosition -= 30; // move down for next content

            // Project details
            if (orderHistory.projectName) {
                const projectText = `Project: ${orderHistory.projectName}`;
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

            for (const unit of orderHistory?.selectedUnits) {


                //no room condition - only show unit if it has subitems
                if (!unit?.subItems || unit?.subItems?.length === 0) {
                    continue; // Skip units without subitems
                }

                // Unit name heading
                if (unit.unitName) {
                    page.drawText(`Unit: ${unit.unitName}`, {
                        x: 50,
                        y: yPosition,
                        size: 14,
                        font: boldFont,
                        color: rgb(0.2, 0.2, 0.2),
                    });
                    yPosition -= 30;
                }

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
                if (unit.subItems && unit.subItems.length > 0) {
                    unit.subItems.forEach((subItem, index) => {
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
            }

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
            const fileName = `order-material/order-${orderHistory.projectName}-${Date.now()}.pdf`;
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
                _id: new mongoose.Types.ObjectId()
            };

            if (Array.isArray(orderHistory.pdfLink)) {
                orderHistory?.pdfLink?.push(pdfData as IPdfGenerator);
            } else {
                orderHistory.pdfLink = []
                orderHistory?.pdfLink.push(pdfData as IPdfGenerator)
            }

            console.log("orderHistory.pdfLink", orderHistory.pdfLink)
            await orderHistory.save();

            // console.log("orderhisoty", orderHistory)

            return {
                ok: true,
                pdfUrl: uploadResult.Location,
                data: orderHistory,
                message: 'PDF generated successfully'
            };

        } catch (error: any) {
            console.error('Error generating PDF:', error);
            throw new Error(`PDF generation failed: ${error.message}`);
        }
    }

export {
        generateOrderHistoryPDF,
        // generateOrderHistoryPDFController,
        uploadToS3
    };

// Example route usage:
// import { generateOrderHistoryPDFController } from './path-to-your-service.js';
// router.get('/generate-pdf/:projectId', generateOrderHistoryPDFController);