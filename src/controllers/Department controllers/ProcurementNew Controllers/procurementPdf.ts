import { PDFDocument, PDFName, rgb, StandardFonts } from 'pdf-lib';
import { String } from "aws-sdk/clients/acm";
import ProcurementModelNew from "../../../models/Department Models/ProcurementNew Model/procurementNew.model";
import { COMPANY_LOGO, uploadToS3 } from '../../stage controllers/ordering material controller/pdfOrderHistory.controller';
import mongoose from "mongoose"
import { IPdfGenerator } from '../../../models/Stage Models/Ordering Material Model/OrderMaterialHistory.model';
// Main PDF generation function
export const generateProcurementPdf = async (id: String) => {
    try {
        // Fetch order history data
        const procurement = await ProcurementModelNew.findById(id)
            .populate('projectId', 'projectName')


        if (!procurement) {
            throw new Error('Procurement item not found for the given project ID');
        }


        const isNewPdf = Array.isArray(procurement.procurementPdfs) && procurement.procurementPdfs.length > 0;
        let nextNumber = 1;

        if (isNewPdf) {
            // Extract all numbers from refUniquePdf (format: projectName-<number>-pdf)
            const numbers = procurement.procurementPdfs.map(ele => {
                const match = ele.refUniquePdf?.match(/-(\d+)-pdf$/);
                return match ? parseInt(match[1], 10) : 0; // Extract the number part
            });

            // Find the max number and increment
            nextNumber = Math.max(...numbers, 0) + 1;
        }

        // Construct the new refUniquePdf
        const refUniquePdf = `pro-${nextNumber}-pdf`;


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

        const heading = "Procurement";

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
        if (procurement.projectId) {
            const projectText = `Project: ${(procurement.projectId as any).projectName}`;
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
        // if (procurement.shopDetails) {
        //     page.drawText("Shop Details:", {
        //         x: 50,
        //         y: yPosition,
        //         size: 14,
        //         font: boldFont,
        //         color: rgb(0.2, 0.2, 0.2),
        //     });
        //     yPosition -= 20;

        //     if (procurement.shopDetails.shopName) {
        //         page.drawText(`Shop Name: ${procurement.shopDetails.shopName}`, {
        //             x: 50,
        //             y: yPosition,
        //             size: 10,
        //             font: regularFont,
        //             color: rgb(0.3, 0.3, 0.3),
        //         });
        //         yPosition -= 15;
        //     }

        //     if (procurement.shopDetails.address) {
        //         page.drawText(`Address: ${procurement.shopDetails.address}`, {
        //             x: 50,
        //             y: yPosition,
        //             size: 10,
        //             font: regularFont,
        //             color: rgb(0.3, 0.3, 0.3),
        //         });
        //         yPosition -= 15;
        //     }

        //     if (procurement.shopDetails.contactPerson) {
        //         page.drawText(`Contact Person: ${procurement.shopDetails.contactPerson}`, {
        //             x: 50,
        //             y: yPosition,
        //             size: 10,
        //             font: regularFont,
        //             color: rgb(0.3, 0.3, 0.3),
        //         });
        //         yPosition -= 15;
        //     }

        //     if (procurement.shopDetails.phoneNumber) {
        //         page.drawText(`Phone: ${procurement.shopDetails.phoneNumber}`, {
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
        // if (procurement.deliveryLocationDetails) {
        //     page.drawText("Delivery Location:", {
        //         x: 50,
        //         y: yPosition,
        //         size: 14,
        //         font: boldFont,
        //         color: rgb(0.2, 0.2, 0.2),
        //     });
        //     yPosition -= 20;

        //     if (procurement.deliveryLocationDetails.siteName) {
        //         page.drawText(`Site Name: ${procurement.deliveryLocationDetails.siteName}`, {
        //             x: 50,
        //             y: yPosition,
        //             size: 10,
        //             font: regularFont,
        //             color: rgb(0.3, 0.3, 0.3),
        //         });
        //         yPosition -= 15;
        //     }

        //     if (procurement.deliveryLocationDetails.address) {
        //         page.drawText(`Site Address: ${procurement.deliveryLocationDetails.address}`, {
        //             x: 50,
        //             y: yPosition,
        //             size: 10,
        //             font: regularFont,
        //             color: rgb(0.3, 0.3, 0.3),
        //         });
        //         yPosition -= 15;
        //     }

        //     if (procurement.deliveryLocationDetails.siteSupervisor) {
        //         page.drawText(`Site Supervisor: ${procurement.deliveryLocationDetails.siteSupervisor}`, {
        //             x: 50,
        //             y: yPosition,
        //             size: 10,
        //             font: regularFont,
        //             color: rgb(0.3, 0.3, 0.3),
        //         });
        //         yPosition -= 15;
        //     }

        //     if (procurement.deliveryLocationDetails.phoneNumber) {
        //         page.drawText(`Contact: ${procurement.deliveryLocationDetails.phoneNumber}`, {
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

        if (!procurement?.selectedUnits || procurement?.selectedUnits?.length === 0) {
            page.drawText(`Material Items`, {
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

        // for (const unit of procurement?.selectedUnits) {



        // Unit name heading


        // Table headers
        const tableStartY = yPosition;
        const rowHeight = 25;
        // const columnWidths = [60, , 300, 80, 80]; // S.No, Material Item, Quantity, Unit
        // const columnPositions = [50, 110, 410, 490];

        // const columnWidths = [50, 200, 80, 50];
        const columnPositions = [
            // 50,  // S.No
            // // 100, // Ref ID
            // 120, // Material Item
            // 420, // Quantity
            // 500,  // Unit

            // 450, // Rate (NEW)
            // 510  // Total (NEW)

            50,  // S.No
            110, // Material Item (increased space)
            340, // Quantity (moved right)
            400, // Unit
            450, // Rate (NEW)
            510  // Total (NEW)
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
        const headers = ['S.No', 'Material Item', 'Quantity', 'Unit', "Rate", "Total"];
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
        if (procurement?.selectedUnits && procurement?.selectedUnits.length > 0) {
            procurement?.selectedUnits.forEach((subItem, index) => {
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
                    // subItem.refId || "N/A",
                    subItem.subItemName || 'N/A',
                    (subItem.quantity || 0).toString(),
                    subItem.unit || 'N/A',
                    (subItem.rate || 0).toString(),
                    (subItem.totalCost || 0).toString()
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
        // }

        // Total cost section
        // if (procurement.totalCost) {
        yPosition -= 20;
        page.drawText(`Total Cost: Rs ${procurement.totalCost.toLocaleString()}`, {
            x: width - 200,
            y: yPosition,
            size: 14,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2),
        });
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
        const fileName = `procurement-${id}-${Date.now()}.pdf`;
        const uploadResult = await uploadToS3(pdfBytes, fileName);

        // Update the order history with generated link
        // await OrderMaterialHistoryModel.findByIdAndUpdate({projectId}, {
        //     generatedLink: uploadResult.Location
        // });

        // console.log("generateld dat", uploadResult.Location)


        const pdfData = {
            url: uploadResult.Location,
            refUniquePdf, // <-- now has projectName-uniquenumber-pdf
            pdfName: "Procurement",
            status: "pending",
            _id: new mongoose.Types.ObjectId()
        };

        if (Array.isArray(procurement.procurementPdfs)) {
            procurement?.procurementPdfs?.push(pdfData as IPdfGenerator);
        } else {
            procurement.procurementPdfs = []
            procurement?.procurementPdfs.push(pdfData as IPdfGenerator)
        }

        console.log("procurement.procurementPdfs", procurement.procurementPdfs)


        // const ProcurementNewItems: any[] = [];
        // const subItemMap: Record<string, any> = {}; // key = subItemName

        // procurement.selectedUnits.forEach((unit:any) => {
        //     // unit.subItems.forEach((subItem: any) => {
        //         const { _id, refId, ...rest } = unit.toObject ? unit.toObject() : unit;

        //         const name = rest.subItemName?.trim().toLowerCase() || "";
        //         const unitKey = rest.unit?.trim().toLowerCase() || "";
        //         const key = `${name}__${unitKey}`; // combine name + unit

        //         if (key) {
        //             if (subItemMap[key]) {
        //                 // Already exists with same name+unit → add quantity
        //                 subItemMap[key].quantity += rest.quantity || 0;
        //             } else {
        //                 // Create fresh entry
        //                 subItemMap[key] = {
        //                     ...rest,
        //                     quantity: rest.quantity || 0,
        //                     _id: new mongoose.Types.ObjectId() // always refresh ID
        //                 };
        //             }
        //         }
        //     // });
        // });

        // // Convert map back to array
        // Object.values(subItemMap).forEach((item: any) => ProcurementNewItems.push(item));

        // // console.log("procurement", ProcurementNewItems)
        // await ProcurementModelNew.create({
        //     organizationId,
        //     projectId: projectId,
        //     shopDetails: procurement.shopDetails,
        //     deliveryLocationDetails: procurement.deliveryLocationDetails,
        //     selectedUnits: ProcurementNewItems,
        //     refPdfId: refUniquePdf,
        //     totalCost: 0
        // })
        // // Clear subItems from each selectedUnit


        await procurement.save();

        // console.log("orderhisoty", procurement)

        return {
            ok: true,
            pdfUrl: uploadResult.Location,
            data: procurement,
            message: 'PDF generated successfully'
        };

    } catch (error: any) {
        console.error('Error generating PDF:', error);
        throw new Error(`PDF generation failed: ${error.message}`);
    }
};