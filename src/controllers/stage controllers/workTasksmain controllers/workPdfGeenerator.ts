import { Types } from "mongoose"
import { DailyTaskSubModel } from "../../../models/Stage Models/WorkTask Model/dailySchedule.model";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { COMPANY_LOGO, uploadToS3 } from "../ordering material controller/pdfOrderHistory.controller";



export const generateWorkSchedulePDF = async (scheduleId: string | Types.ObjectId) => {
    try {
        // Fetch work schedule data
        const workSchedule = await DailyTaskSubModel.findById(scheduleId);

        if (!workSchedule) {
            throw new Error('Work schedule not found for the given schedule ID');
        }

        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage([595, 842]); // A4 size
        const { width, height } = page.getSize();

        // Load fonts
        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        let yPosition = height - 20;

        // Company logo and branding
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

            // Draw brand text
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
            yPosition -= 60; // Adjust if logo fails
        }

        // Helper function to check if we need a new page
        const checkNewPage = (requiredSpace: number) => {
            if (yPosition - requiredSpace < 50) {
                page = pdfDoc.addPage([595, 842]);
                yPosition = height - 50;
                return true;
            }
            return false;
        };

        // Work Schedule Heading (centered)
        const headingText = "WORK SCHEDULE";
        const headingSize = 18;
        const headingWidth = boldFont.widthOfTextAtSize(headingText, headingSize);
        const headingX = (width - headingWidth) / 2;

        page.drawText(headingText, {
            x: headingX,
            y: yPosition,
            size: headingSize,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2),
        });

        yPosition -= 40;

        // Project Assignee Information
        if (workSchedule.projectAssignee) {
            const assignee = workSchedule.projectAssignee;

            checkNewPage(120);

            page.drawText("PROJECT INFORMATION", {
                x: 50,
                y: yPosition,
                size: 14,
                font: boldFont,
                color: rgb(0.3, 0.3, 0.3),
            });
            yPosition -= 25;

            const projectInfo = [
                { label: "Project Name:", value: assignee.projectName || "N/A" },
                { label: "Site Address:", value: assignee.siteAddress || "N/A" },
                { label: "Design Reference ID:", value: assignee.designReferenceId || "N/A" },
                { label: "Carpenter Name:", value: assignee.carpenterName || "N/A" },
                { label: "Supervisor Name:", value: assignee.supervisorName || "N/A" },
                { label: "Planned Start Date:", value: assignee.plannedStartDate ? new Date(assignee.plannedStartDate).toLocaleDateString() : "N/A" }
            ];

            projectInfo.forEach(info => {
                checkNewPage(20);
                page.drawText(info.label, {
                    x: 60,
                    y: yPosition,
                    size: 10,
                    font: boldFont,
                    color: rgb(0.4, 0.4, 0.4),
                });
                page.drawText(info.value, {
                    x: 180,
                    y: yPosition,
                    size: 10,
                    font: regularFont,
                    color: rgb(0.2, 0.2, 0.2),
                });
                yPosition -= 18;
            });

            yPosition -= 10;
        }

        // OLD Daily Tasks Table
        // if (workSchedule.dailyTasks && workSchedule.dailyTasks.length > 0) {
        //     checkNewPage(150);

        //     page.drawText("DAILY TASKS", {
        //         x: 50,
        //         y: yPosition,
        //         size: 14,
        //         font: boldFont,
        //         color: rgb(0.3, 0.3, 0.3),
        //     });
        //     yPosition -= 25;

        //     // Table headers
        //     const tableHeaders = ["Date", "Room", "Description", "Time", "Manpower", "Status"];
        //     const colWidths = [70, 70, 150, 80, 60, 80];
        //     const tableStartX = 50;
        //     let currentX = tableStartX;

        //     // Draw table header background
        //     page.drawRectangle({
        //         x: tableStartX - 5,
        //         y: yPosition - 15,
        //         width: colWidths.reduce((a, b) => a + b, 0) + 10,
        //         height: 20,
        //         color: rgb(0.9, 0.9, 0.9),
        //     });

        //     // Draw table headers
        //     tableHeaders.forEach((header, index) => {
        //         page.drawText(header, {
        //             x: currentX,
        //             y: yPosition,
        //             size: 9,
        //             font: boldFont,
        //             color: rgb(0.2, 0.2, 0.2),
        //         });
        //         currentX += colWidths[index];
        //     });

        //     yPosition -= 25;

        //     // Draw table rows
        //     workSchedule.dailyTasks.forEach((task, rowIndex) => {
        //         checkNewPage(25);

        //         currentX = tableStartX;

        //         // Alternate row background
        //         if (rowIndex % 2 === 0) {
        //             page.drawRectangle({
        //                 x: tableStartX - 5,
        //                 y: yPosition - 12,
        //                 width: colWidths.reduce((a, b) => a + b, 0) + 10,
        //                 height: 18,
        //                 color: rgb(0.98, 0.98, 0.98),
        //             });
        //         }

        //         const rowData = [
        //             task.datePlanned ? new Date(task.datePlanned).toLocaleDateString() : "N/A",
        //             task.room || "N/A",
        //             task.workDescription ? (task.workDescription.length > 20 ? task.workDescription.substring(0, 17) + "..." : task.workDescription) : "N/A",
        //             `${task.startTime || "N/A"} - ${task.endTime || "N/A"}`,
        //             task.manpower ? task.manpower.toString() : "N/A",
        //             task.status || "N/A"
        //         ];

        //         rowData.forEach((data, colIndex) => {
        //             page.drawText(data, {
        //                 x: currentX,
        //                 y: yPosition,
        //                 size: 8,
        //                 font: regularFont,
        //                 color: rgb(0.2, 0.2, 0.2),
        //             });
        //             currentX += colWidths[colIndex];
        //         });

        //         yPosition -= 20;
        //     });

        //     yPosition -= 15;
        // }



       if (workSchedule.dailyTasks && workSchedule.dailyTasks.length > 0) {
            checkNewPage(150);

            page.drawText("DAILY TASKS", {
                x: 50,
                y: yPosition,
                size: 14,
                font: boldFont,
                color: rgb(0.3, 0.3, 0.3),
            });
            yPosition -= 25;

            // Table headers - Updated to match the 7 columns
            const tableHeaders = ["Date", "Room", "Description", "Time", "Materials", "Manpower", "Status"];
            // Adjusted column widths - reduced date, increased description, reduced materials
            const colWidths = [40, 60, 180, 70, 50, 50, 70];   // chnge thsi to adjust eh width of the column
            const tableStartX = 50;
            let currentX = tableStartX;

            // Draw table header background
            page.drawRectangle({
                x: tableStartX - 5,
                y: yPosition - 15,
                width: colWidths.reduce((a, b) => a + b, 0) + 10,
                height: 20,
                color: rgb(0.9, 0.9, 0.9),
            });

            // Draw table headers
            tableHeaders.forEach((header, index) => {
                page.drawText(header, {
                    x: currentX,
                    y: yPosition - 7,
                    size: 9,
                    font: boldFont,
                    color: rgb(0.2, 0.2, 0.2),
                });
                currentX += colWidths[index];
            });

            yPosition -= 25;

            // Draw table rows
            workSchedule.dailyTasks.forEach((task, rowIndex) => {
                // Helper function to wrap text for description column
                const wrapText = (text: string, maxWidth: number, fontSize: number) => {
                    if (!text) return "N/A";

                    const words = text.split(' ');
                    let line = '';
                    let result = '';

                    for (let i = 0; i < words.length; i++) {
                        const testLine = line + words[i] + ' ';
                        const testWidth = regularFont.widthOfTextAtSize(testLine, fontSize);

                        if (testWidth > maxWidth && line !== '') {
                            result += line.trim() + '\n';
                            line = words[i] + ' ';
                        } else {
                            line = testLine;
                        }
                    }
                    result += line.trim();

                    // Limit to 2 lines for table display
                    const lines = result.split('\n');
                    if (lines.length > 2) {
                        return lines[0] + '\n' + lines[1].substring(0, lines[1].length - 3) + '...';
                    }
                    return result;
                };

                // Calculate dynamic row height based on description
                const descriptionText = wrapText(task.workDescription || "N/A", 170, 8);
                const descriptionLines = descriptionText.split('\n').length;
                const dynamicRowHeight = Math.max(25, descriptionLines * 12 + 8);

                checkNewPage(dynamicRowHeight + 10);

                currentX = tableStartX;

                // Alternate row background with dynamic height
                if (rowIndex % 2 === 0) {
                    page.drawRectangle({
                        x: tableStartX - 5,
                        y: yPosition - 12,
                        width: colWidths.reduce((a, b) => a + b, 0) + 10,
                        height: dynamicRowHeight,
                        color: rgb(0.98, 0.98, 0.98),
                    });
                }

                // Prepare row data - now matching 7 columns
                const rowData = [
                    // Date - shortened format
                    task.datePlanned
                        ? (() => {
                            const d = new Date(task.datePlanned);
                            const day = String(d.getDate()).padStart(2, "0");
                            const month = String(d.getMonth() + 1).padStart(2, "0");
                            const year = String(d.getFullYear()).slice(-2);
                            return `${day}-${month}-${year}`; // → "26-08-25"
                        })()
                        : "N/A",
                    // Room
                    task.room || "N/A",
                    // Description - wrapped text
                    descriptionText,
                    // Time
                    `${task.startTime || "N/A"}-${task.endTime || "N/A"}`,
                    // Materials - count only
                    task.materialsNeeded && task.materialsNeeded.length > 0 ? task.materialsNeeded.length.toString() : "0",
                    // Manpower
                    task.manpower ? task.manpower.toString() : "N/A",
                    // Status
                    task.status || "N/A"
                ];

                rowData.forEach((data, colIndex) => {
                    // Handle multi-line text for description column
                    if (colIndex === 2 && data.includes('\n')) {
                        const lines = data.split('\n');
                        lines.forEach((line, lineIndex) => {
                            page.drawText(line, {
                                x: currentX + 2,
                                y: yPosition - (lineIndex * 10),
                                size: 8,
                                font: regularFont,
                                color: rgb(0.2, 0.2, 0.2),
                            });
                        });
                    } else {
                        page.drawText(data, {
                            x: currentX + 2,
                            y: yPosition,
                            size: 8,
                            font: regularFont,
                            color: rgb(0.2, 0.2, 0.2),
                        });
                    }
                    currentX += colWidths[colIndex];
                });

                yPosition -= dynamicRowHeight + 5;
            });

            yPosition -= 15;
        }


// Materials Needed (if any tasks have materials)
// const allMaterials = workSchedule.dailyTasks?.flatMap(task => task.materialsNeeded || []).filter(Boolean);
// if (allMaterials && allMaterials.length > 0) {
//     checkNewPage(100);

//     page.drawText("MATERIALS NEEDED", {
//         x: 50,
//         y: yPosition,
//         size: 14,
//         font: boldFont,
//         color: rgb(0.3, 0.3, 0.3),
//     });
//     yPosition -= 20;

//     const uniqueMaterials = [...new Set(allMaterials)];
//     uniqueMaterials.forEach(material => {
//         checkNewPage(15);
//         page.drawText(`• ${material}`, {
//             x: 60,
//             y: yPosition,
//             size: 10,
//             font: regularFont,
//             color: rgb(0.2, 0.2, 0.2),
//         });
//         yPosition -= 15;
//     });

//     yPosition -= 10;
// }

// Supervisor Check Information
if (workSchedule.supervisorCheck) {
    checkNewPage(120);

    page.drawText("SUPERVISOR REVIEW", {
        x: 50,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0.3, 0.3, 0.3),
    });
    yPosition -= 25;

    const supervisorInfo = [
        { label: "Reviewer Name:", value: workSchedule.supervisorCheck.reviewerName || "N/A" },
        { label: "Review Date:", value: workSchedule.supervisorCheck.reviewDateTime ? new Date(workSchedule.supervisorCheck.reviewDateTime).toLocaleDateString() : "N/A" },
        { label: "Status:", value: workSchedule.supervisorCheck.status || "Pending" },
        { label: "Gatekeeping:", value: workSchedule.supervisorCheck.gatekeeping || "N/A" },
        { label: "Remarks:", value: workSchedule.supervisorCheck.remarks || "No remarks" }
    ];

    supervisorInfo.forEach(info => {
        checkNewPage(20);
        page.drawText(info.label, {
            x: 60,
            y: yPosition,
            size: 10,
            font: boldFont,
            color: rgb(0.4, 0.4, 0.4),
        });

        // Handle long remarks text
        if (info.label === "Remarks:" && info.value.length > 60) {
            const words = info.value.split(' ');
            let line = '';
            let lineY = yPosition;

            words.forEach(word => {
                const testLine = line + word + ' ';
                const testWidth = regularFont.widthOfTextAtSize(testLine, 10);

                if (testWidth > 300 && line !== '') {
                    page.drawText(line.trim(), {
                        x: 180,
                        y: lineY,
                        size: 10,
                        font: regularFont,
                        color: rgb(0.2, 0.2, 0.2),
                    });
                    line = word + ' ';
                    lineY -= 12;
                    checkNewPage(12);
                } else {
                    line = testLine;
                }
            });

            if (line.trim() !== '') {
                page.drawText(line.trim(), {
                    x: 180,
                    y: lineY,
                    size: 10,
                    font: regularFont,
                    color: rgb(0.2, 0.2, 0.2),
                });
            }

            yPosition = lineY - 18;
        } else {
            page.drawText(info.value, {
                x: 180,
                y: yPosition,
                size: 10,
                font: regularFont,
                color: rgb(0.2, 0.2, 0.2),
            });
            yPosition -= 18;
        }
    });

    yPosition -= 10;
}

// OLD  Helper function to embed and display images
const addImageToPdf = async (imageUrl: string, title: string) => {
    try {
        const imageRes = await fetch(imageUrl);
        const imageBuffer = await imageRes.arrayBuffer();

        let image;
        const contentType = imageRes.headers.get('content-type') || '';

        if (contentType.includes('jpeg') || contentType.includes('jpg')) {
            image = await pdfDoc.embedJpg(imageBuffer);
        } else if (contentType.includes('png')) {
            image = await pdfDoc.embedPng(imageBuffer);
        } else {
            // Try to embed as JPEG by default
            image = await pdfDoc.embedJpg(imageBuffer);
        }

        const maxWidth = 200;
        const maxHeight = 150;
        const imageScale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
        const scaledWidth = image.width * imageScale;
        const scaledHeight = image.height * imageScale;

        checkNewPage(scaledHeight + 40);

        page.drawText(title, {
            x: 50,
            y: yPosition,
            size: 12,
            font: boldFont,
            color: rgb(0.3, 0.3, 0.3),
        });
        yPosition -= 25;

        page.drawImage(image, {
            x: 50,
            y: yPosition - scaledHeight,
            width: scaledWidth,
            height: scaledHeight,
        });

        yPosition -= scaledHeight + 15;
    } catch (err) {
        console.error(`Failed to embed image ${title}:`, err);

        checkNewPage(30);
        page.drawText(`${title}: Failed to load image`, {
            x: 50,
            y: yPosition,
            size: 10,
            font: regularFont,
            color: rgb(0.8, 0.2, 0.2),
        });
        yPosition -= 20;
    }
};

// // Design Plan Images
// if (workSchedule.designPlanImages && workSchedule.designPlanImages.length > 0) {
//     for (const image of workSchedule.designPlanImages) {
//         if (image.url) {
//             await addImageToPdf(image.url, "Design Plan Image");
//         }
//     }
// }

// // Site Images
// if (workSchedule.siteImages && workSchedule.siteImages.length > 0) {
//     for (const image of workSchedule.siteImages) {
//         if (image.url) {
//             await addImageToPdf(image.url, "Site Image");
//         }
//     }
// }

// // Comparison Images
// if (workSchedule.comparison) {
//     if (workSchedule.comparison.plannedImage && workSchedule.comparison.plannedImage.url) {
//         await addImageToPdf(workSchedule.comparison.plannedImage.url, "Planned Comparison Image");
//     }
//     if (workSchedule.comparison.actualImage && workSchedule.comparison.actualImage.url) {
//         await addImageToPdf(workSchedule.comparison.actualImage.url, "Actual Comparison Image");
//     }
// }




// Helper function to add multiple images in a grid layout
const addImagesInGrid = async (images: any[], title: string, imagesPerRow: number = 2) => {
    if (!images || images.length === 0) return;
    
    // Add section heading once
    checkNewPage(50);
    page.drawText(title, {
        x: 50,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0.3, 0.3, 0.3),
    });
    yPosition -= 25;
    
    const imageWidth = 180; // Fixed width for each image
    const imageHeight = 120; // Fixed height for each image
    const horizontalSpacing = 15; // Space between images horizontally
    const verticalSpacing = 20; // Space between rows
    const startX = 50; // Starting X position
    
    let currentRow = 0;
    let currentCol = 0;
    let maxRowHeight = 0;
    
    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (!image.url) continue;
        
        try {
            const imageRes = await fetch(image.url);
            const imageBuffer = await imageRes.arrayBuffer();
            
            let pdfImage;
            const contentType = imageRes.headers.get('content-type') || '';
            
            if (contentType.includes('jpeg') || contentType.includes('jpg')) {
                pdfImage = await pdfDoc.embedJpg(imageBuffer);
            } else if (contentType.includes('png')) {
                pdfImage = await pdfDoc.embedPng(imageBuffer);
            } else {
                pdfImage = await pdfDoc.embedJpg(imageBuffer);
            }
            
            // Calculate scaled dimensions
            const imageScale = Math.min(imageWidth / pdfImage.width, imageHeight / pdfImage.height, 1);
            const scaledWidth = pdfImage.width * imageScale;
            const scaledHeight = pdfImage.height * imageScale;
            
            // Calculate position
            const xPos = startX + (currentCol * (imageWidth + horizontalSpacing));
            
            // Check if we need a new row
            if (currentCol === 0) {
                checkNewPage(scaledHeight + verticalSpacing + 10);
            }
            
            // Draw image
            page.drawImage(pdfImage, {
                x: xPos,
                y: yPosition - scaledHeight,
                width: scaledWidth,
                height: scaledHeight,
            });
            
            // Track the maximum height in this row
            maxRowHeight = Math.max(maxRowHeight, scaledHeight);
            
            // Move to next position
            currentCol++;
            
            // Check if we need to start a new row
            if (currentCol >= imagesPerRow) {
                currentCol = 0;
                currentRow++;
                yPosition -= maxRowHeight + verticalSpacing;
                maxRowHeight = 0;
            }
            
        } catch (err) {
            console.error(`Failed to embed image in grid:`, err);
            // Continue with next image if one fails
        }
    }
    
    // Adjust position after the last row if there were remaining images
    if (currentCol > 0) {
        yPosition -= maxRowHeight + verticalSpacing;
    }
    
    yPosition -= 15; // Extra spacing after the image section
};

// Design Plan Images - Grid Layout
if (workSchedule.designPlanImages && workSchedule.designPlanImages.length > 0) {
    await addImagesInGrid(workSchedule.designPlanImages, "DESIGN PLAN IMAGES", 2);
}

// Site Images - Grid Layout  
if (workSchedule.siteImages && workSchedule.siteImages.length > 0) {
    await addImagesInGrid(workSchedule.siteImages, "SITE IMAGES", 2);
}

// Comparison Images - Keep original vertical layout (no changes)
if (workSchedule.comparison) {
    if (workSchedule.comparison.plannedImage && workSchedule.comparison.plannedImage.url) {
        await addImageToPdf(workSchedule.comparison.plannedImage.url, "Planned Comparison Image");
    }
    if (workSchedule.comparison.actualImage && workSchedule.comparison.actualImage.url) {
        await addImageToPdf(workSchedule.comparison.actualImage.url, "Actual Comparison Image");
    }
}

// Generate PDF bytes
const pdfBytes = await pdfDoc.save();



// Upload to AWS S3

const fileName = `work-schedule-${scheduleId}-${Date.now()}.pdf`;
const uploadResult = await uploadToS3(pdfBytes, fileName);




// Return the result with download link
return {
    fileName: fileName,
    downloadUrl: uploadResult.Location, // Adjust URL as needed
    fileSize: pdfBytes.length,
    generatedAt: new Date().toISOString()
};

    } catch (error: any) {
    console.error('PDF generation error:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
}
};