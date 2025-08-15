import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
// import fetch from 'node-fetch';
import { s3, S3_BUCKET } from "../../../utils/s3Uploads/s3Client";
import { OrderMaterialHistoryModel } from '../../../models/Stage Models/Ordering Material Model/OrderMaterialHistory.model';
import { Request, Response } from 'express';
import { ok } from 'assert';

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

        // Material Order heading
        const heading = "MATERIAL ORDER";
        page.drawText(heading, {
            x: 50,
            y: yPosition,
            size: 18,
            font: boldFont,
            color: rgb(0.0, 0.2, 0.4),
        });
        yPosition -= 20;

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


        function drawWrappedDetail(label: string, value: string) {
            const labelX = 60;               // Label starting X
            const valueX = labelX + 120;     // Space after label (adjust if needed)
            const fontSize = 12;
            const maxWidth = width - valueX - 50; // Remaining space for value text

            // Draw label
            page.drawText(`${label}:`, {
                x: labelX,
                y: yPosition,
                size: fontSize,
                font: boldFont,
                color: rgb(0, 0, 0),
            });

            // Split value into multiple lines if needed
            const words = value.split(' ');
            let line = '';
            let lines: string[] = [];

            for (let word of words) {
                const testLine = line + word + ' ';
                const testWidth = regularFont.widthOfTextAtSize(testLine, fontSize);

                if (testWidth > maxWidth && line !== '') {
                    lines.push(line.trim());
                    line = word + ' ';
                } else {
                    line = testLine;
                }
            }
            if (line) lines.push(line.trim());

            // Draw each wrapped line of the value
            lines.forEach((lineText, index) => {
                page.drawText(lineText, {
                    x: valueX,
                    y: yPosition - index * (fontSize + 4), // 4px gap between wrapped lines
                    size: fontSize,
                    font: regularFont,
                    color: rgb(0, 0, 0),
                });
            });

            // Reduce yPosition by total height of wrapped text + some extra gap
            yPosition -= lines.length * (fontSize + 4) + 4;
        }

        // Usage
        const deliveryDetails = orderHistory?.deliveryLocationDetails || {};

        const siteName = deliveryDetails?.siteName?.trim() || "Not Mentioned";
        const address = deliveryDetails?.address?.trim() || "Not Mentioned";
        const supervisor = deliveryDetails?.siteSupervisor?.trim() || "Not Mentioned";
        const phone = deliveryDetails?.phoneNumber?.trim() || "Not Mentioned";

        // Heading
        page.drawText("Delivery Location", {
            x: 50,
            y: yPosition,
            size: 16,
            font: boldFont,
            color: rgb(0.0, 0.3, 0.6),
        });
        yPosition -= 20;

        // Draw details with wrapping
        drawWrappedDetail("Site Name", siteName);
        drawWrappedDetail("Address", address);
        drawWrappedDetail("Site Supervisor", supervisor);
        drawWrappedDetail("Phone", phone);

        // Divider line
        yPosition -= 10;
        page.drawLine({
            start: { x: 50, y: yPosition },
            end: { x: width - 50, y: yPosition },
            thickness: 0.5,
            color: rgb(0.6, 0.6, 0.6),
        });
        yPosition -= 20;



        // Order date
        // const orderDate = `Order Date: ${new Date(orderHistory.createdAt).toLocaleDateString()}`;
        // page.drawText(orderDate, {
        //     x: 50,
        //     y: yPosition,
        //     size: 12,
        //     font: regularFont,
        //     color: rgb(0.3, 0.3, 0.3),
        // });
        // yPosition -= 30;

        // Status
        // const statusText = `Status: ${orderHistory.status.toUpperCase()}`;
        // page.drawText(statusText, {
        //     x: 50,
        //     y: yPosition,
        //     size: 12,
        //     font: boldFont,
        //     color: orderHistory.status === 'completed' ? rgb(0, 0.6, 0) : rgb(0.8, 0.6, 0),
        // });
        // yPosition -= 40;

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
            const columnWidths = [60, 300, 80, 80]; // S.No, Material Item, Quantity, Unit
            const columnPositions = [50, 110, 410, 490];

            // Draw table header background
            page.drawRectangle({
                x: 45,
                y: yPosition - 5,
                width: 500,
                height: rowHeight,
                color: rgb(0.9, 0.9, 0.9),
            });

            // Table headers
            const headers = ['S.No', 'Material Item', 'Quantity', 'Unit'];
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

        // if (orderHistory.assignedTo && orderHistory.assignedTo.name) {
        //     page.drawText(`Assigned to: ${orderHistory.assignedTo.name}`, {
        //         x: width - 150,
        //         y: footerY,
        //         size: 8,
        //         font: regularFont,
        //         color: rgb(0.6, 0.6, 0.6),
        //     });
        // }

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
        orderHistory.generatedLink = uploadResult.Location

        await orderHistory.save()


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


export {
    generateOrderHistoryPDF,
    // generateOrderHistoryPDFController,
    uploadToS3
};

// Example route usage:
// import { generateOrderHistoryPDFController } from './path-to-your-service.js';
// router.get('/generate-pdf/:projectId', generateOrderHistoryPDFController);