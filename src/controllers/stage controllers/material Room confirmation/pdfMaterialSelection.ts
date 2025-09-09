// import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
// import { COMPANY_LOGO } from '../ordering material controller/pdfOrderHistory.controller';
// import { Types } from "mongoose"
// import MaterialRoomConfirmationModel from '../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model';

// export const generatePackageComparisonPDF = async (projectId: Types.ObjectId | string) => {
//     try {

//         const materialRoomConfirmationData = await MaterialRoomConfirmationModel.findOne({ projectId }).populate("projectId")

//         if (!materialRoomConfirmationData) {
//             throw new Error("Material item with given _id not found in this item.");
//         }

//         console.log("mateial arrival ", materialRoomConfirmationData)
//         // Create a new PDF document
//         const pdfDoc = await PDFDocument.create();
//         let page = pdfDoc.addPage([842, 595]); // A4 Landscape for better comparison view
//         const { width, height } = page.getSize();

//         // Load fonts
//         const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
//         const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

//         let yPosition = height - 20;

//         console.log("gnerag the company detials ")
//         // Company Logo and Name Section
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

//             const spacing = 10;
//             const totalWidth = logoDims.width + spacing + brandTextWidth;
//             const combinedX = (width - totalWidth) / 2;
//             const topY = yPosition;

//             // Draw logo
//             page.drawImage(logoImage, {
//                 x: combinedX,
//                 y: topY - logoDims.height,
//                 width: logoDims.width,
//                 height: logoDims.height,
//             });

//             // Draw text next to logo
//             const textY = topY - (logoDims.height / 2) - (brandFontSize / 3);
//             page.drawText(brandText, {
//                 x: combinedX + logoDims.width + spacing,
//                 y: textY,
//                 size: brandFontSize,
//                 font: boldFont,
//                 color: brandColor,
//             });

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
//             yPosition -= 50; // Skip logo space if failed
//         }

//         console.log("completion of the company detials ")


//         // "Compare packages" heading (left aligned)
//         page.drawText("Compare packages", {
//             x: 50,
//             y: yPosition,
//             size: 24,
//             font: boldFont,
//             color: rgb(0.2, 0.2, 0.2),
//         });

//         yPosition -= 40;

//         // Package data
//         const packages = materialRoomConfirmationData.package || [];

//         // Define colors for each package
//         const packageColors = {
//             economy: {
//                 header: rgb(0.2, 0.5, 0.3),
//                 bg: rgb(0.9, 0.97, 0.9),

//             },
//             premium: {
//                 header: rgb(0.1, 0.3, 0.7),
//                 bg: rgb(0.9, 0.95, 1),
//             },
//             luxury: {
//                 header: rgb(0.4, 0.2, 0.1),
//                 bg: rgb(0.98, 0.95, 0.9),
//             }
//         };

//         // Calculate column width
//         const columnWidth = (width - 120) / 3; // 60px margin on each side
//         const columnSpacing = 10;
//         const startX = 60;
//         console.log("Entering into For Loop")
//         // Draw package columns
//         packages.forEach((pkg: any, index: number) => {
//             const x = startX + (index * (columnWidth + columnSpacing));
//             const currentY = yPosition;

//             // Calculate total cost for this package
//             const totalCost = pkg.rooms?.reduce((sum: number, room: any) => sum + (room.totalCost || 0), 0) || 0;

//             const colors = (packageColors as any)[pkg.level] || packageColors.economy;

//             // Draw package header with background
//             page.drawRectangle({
//                 x: x,
//                 y: currentY - 40,
//                 width: columnWidth,
//                 height: 40,
//                 color: colors.header,
//             });

//             // Package title with icon
//             const packageTitle = pkg.level.charAt(0).toUpperCase() + pkg.level.slice(1);
//             // page.drawText(`${colors.icon} ${packageTitle}`, {
//             page.drawText(`${packageTitle}`, {
//                 x: x + 15,
//                 y: currentY - 25,
//                 size: 16,
//                 font: boldFont,
//                 color: rgb(1, 1, 1),
//             });

//             let packageY = currentY - 50;

//             // Draw package content background
//             const contentHeight = 400; // Adjust based on content
//             page.drawRectangle({
//                 x: x,
//                 y: packageY - contentHeight,
//                 width: columnWidth,
//                 height: contentHeight,
//                 color: colors.bg,
//             });

//             // Price section
//             page.drawText(`Rs: ${totalCost.toLocaleString('en-IN')}`, {
//                 x: x + 15,
//                 y: packageY - 25,
//                 size: 18,
//                 font: boldFont,
//                 color: rgb(0.1, 0.1, 0.1),
//             });

//             packageY -= 45;

//             // Room names
//             const roomNames = pkg.rooms?.map((room: any) => room.name).filter(Boolean).join(' | ') || 'No rooms';
//             const wrappedRoomNames = wrapText(roomNames, columnWidth - 30, regularFont, 10);

//             wrappedRoomNames.forEach(line => {
//                 page.drawText(line, {
//                     x: x + 15,
//                     y: packageY,
//                     size: 10,
//                     font: regularFont,
//                     color: rgb(0.4, 0.4, 0.4),
//                 });
//                 packageY -= 12;
//             });

//             packageY -= 20;

//             // // Rooms section
//             // page.drawText("Rooms", {
//             //     x: x + 15,
//             //     y: packageY,
//             //     size: 12,
//             //     font: boldFont,
//             //     color: rgb(0.2, 0.2, 0.2),
//             // });
//             // packageY -= 15;

//             // Process each room
//             pkg.rooms?.forEach((room: any, roomIndex: number) => {
//                 if (packageY < 100) return; // Stop if running out of space


//                 // ROOM NAME HEADING CHANGED - Show "Rooms" heading for each individual room
//                 page.drawText("Rooms", {
//                     x: x + 15,
//                     y: packageY,
//                     size: 12,
//                     font: boldFont,
//                     color: rgb(0.2, 0.2, 0.2),
//                 });
//                 packageY -= 15;

//                 // Room name
//                 page.drawText(`${room.name || 'Unnamed Room'} (1)`, {
//                     x: x + 20,
//                     y: packageY,
//                     size: 10,
//                     font: regularFont,
//                     color: rgb(0.3, 0.3, 0.3),
//                 });
//                 packageY -= 18;

//                 // Furniture section
//                 page.drawText("Furniture", {
//                     x: x + 20,
//                     y: packageY,
//                     size: 10,
//                     font: boldFont,
//                     color: rgb(0.2, 0.2, 0.2),
//                 });
//                 packageY -= 12;

//                 // Get furniture items
//                 const furnitureItems = room.roomFields?.map((field: any) => field.itemName).filter(Boolean) || [];
//                 const furnitureText = furnitureItems.length > 0 ? furnitureItems.join(', ') : 'No furniture items';
//                 const wrappedFurniture = wrapText(furnitureText, columnWidth - 50, regularFont, 9);

//                 wrappedFurniture.forEach(line => {
//                     if (packageY < 100) return;
//                     page.drawText(`• ${line}`, {
//                         x: x + 25,
//                         y: packageY,
//                         size: 9,
//                         font: regularFont,
//                         color: rgb(0.4, 0.4, 0.4),
//                     });
//                     packageY -= 11;
//                 });

//                 packageY -= 8;

//                 // Materials section
//                 page.drawText("Materials", {
//                     x: x + 20,
//                     y: packageY,
//                     size: 10,
//                     font: boldFont,
//                     color: rgb(0.2, 0.2, 0.2),
//                 });
//                 packageY -= 12;

//                 // Get all materials from all room fields
//                 const allMaterials: any[] = [];
//                 room.roomFields?.forEach((field: any) => {
//                     field.materialItems?.forEach((material: any) => {
//                         if (material.materialName) {
//                             allMaterials.push(material.materialName);
//                         }
//                     });
//                 });

//                 const materialsText = allMaterials.length > 0 ? allMaterials.join(', ') : 'No materials';
//                 const wrappedMaterials = wrapText(materialsText, columnWidth - 50, regularFont, 9);

//                 wrappedMaterials.forEach(line => {
//                     if (packageY < 100) return;
//                     page.drawText(`• ${line}`, {
//                         x: x + 25,
//                         y: packageY,
//                         size: 9,
//                         font: regularFont,
//                         color: rgb(0.4, 0.4, 0.4),
//                     });
//                     packageY -= 11;
//                 });

//                 // Room divider
//                 if (roomIndex < pkg.rooms.length - 1) {
//                     packageY -= 5;
//                     page.drawLine({
//                         start: { x: x + 15, y: packageY },
//                         end: { x: x + columnWidth - 15, y: packageY },
//                         thickness: 0.5,
//                         color: rgb(0.7, 0.7, 0.7),
//                     });
//                     packageY -= 15;
//                 }
//             });

//             // Column border
//             page.drawRectangle({
//                 x: x,
//                 y: currentY - 40 - contentHeight,
//                 width: columnWidth,
//                 height: 40 + contentHeight,
//                 borderColor: rgb(0.8, 0.8, 0.8),
//                 borderWidth: 1,
//             });
//         });

//         // Handle empty packages case
//         if (packages.length === 0) {
//             page.drawText("No packages available", {
//                 x: width / 2 - 80,
//                 y: yPosition - 100,
//                 size: 16,
//                 font: regularFont,
//                 color: rgb(0.5, 0.5, 0.5),
//             });
//         }

//         // Serialize the PDF document to bytes
//         const pdfBytes = await pdfDoc.save();
//         console.log("getting the last code ")
//         return {
//             pdfBytes,
//             materialDoc: materialRoomConfirmationData
//         };



//     } catch (error: any) {
//         console.error('Error generating package comparison PDF:', error);
//         throw new Error('Failed to generate package comparison PDF', error.message);
//     }
// };

// // Helper function to wrap text
// function wrapText(text: string, maxWidth: any, font: any, fontSize: any) {
//     const words = text.split(' ');
//     const lines = [];
//     let currentLine = '';

//     words.forEach(word => {
//         const testLine = currentLine ? `${currentLine} ${word}` : word;
//         const testWidth = font.widthOfTextAtSize(testLine, fontSize);

//         if (testWidth <= maxWidth) {
//             currentLine = testLine;
//         } else {
//             if (currentLine) {
//                 lines.push(currentLine);
//                 currentLine = word;
//             } else {
//                 // Word is too long, force it on a line
//                 lines.push(word);
//             }
//         }
//     });

//     if (currentLine) {
//         lines.push(currentLine);
//     }

//     return lines.length > 0 ? lines : [''];
// }



// second version 



// export const generatePackageComparisonPDF = async (projectId: Types.ObjectId | string) => {
//     try {

//         const materialRoomConfirmationData = await MaterialRoomConfirmationModel.findOne({ projectId }).populate("projectId")

//         if (!materialRoomConfirmationData) {
//             throw new Error("Material item with given _id not found in this item.");
//         }

//         console.log("mateial arrival ", materialRoomConfirmationData)
//         // Create a new PDF document
//         const pdfDoc = await PDFDocument.create();
//         let page = pdfDoc.addPage([842, 595]); // A4 Landscape for better comparison view
//         const { width, height } = page.getSize();

//         // Load fonts
//         const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
//         const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

//         let yPosition = height - 20;

//         console.log("gnerag the company detials ")
//         // Company Logo and Name Section
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

//             const spacing = 10;
//             const totalWidth = logoDims.width + spacing + brandTextWidth;
//             const combinedX = (width - totalWidth) / 2;
//             const topY = yPosition;

//             // Draw logo
//             page.drawImage(logoImage, {
//                 x: combinedX,
//                 y: topY - logoDims.height,
//                 width: logoDims.width,
//                 height: logoDims.height,
//             });

//             // Draw text next to logo
//             const textY = topY - (logoDims.height / 2) - (brandFontSize / 3);
//             page.drawText(brandText, {
//                 x: combinedX + logoDims.width + spacing,
//                 y: textY,
//                 size: brandFontSize,
//                 font: boldFont,
//                 color: brandColor,
//             });

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
//             yPosition -= 50; // Skip logo space if failed
//         }

//         console.log("completion of the company detials ")


//         // "Compare packages" heading (left aligned)
//         page.drawText("Compare packages", {
//             x: 50,
//             y: yPosition,
//             size: 24,
//             font: boldFont,
//             color: rgb(0.2, 0.2, 0.2),
//         });

//         yPosition -= 40;

//         // Package data
//         const packages = materialRoomConfirmationData.package || [];

//         // Define colors for each package
//         const packageColors = {
//             economy: {
//                 header: rgb(0.2, 0.5, 0.3),
//                 bg: rgb(0.9, 0.97, 0.9),

//             },
//             premium: {
//                 header: rgb(0.1, 0.3, 0.7),
//                 bg: rgb(0.9, 0.95, 1),
//             },
//             luxury: {
//                 header: rgb(0.4, 0.2, 0.1),
//                 bg: rgb(0.98, 0.95, 0.9),
//             }
//         };

//         // Calculate column width
//         const columnWidth = (width - 120) / 3; // 60px margin on each side
//         const columnSpacing = 10;
//         const startX = 60;
//         console.log("Entering into For Loop")
        
//         // Store current package and room indices for page continuation
//         let currentPackageIndex = 0;
//         let currentRoomIndex = 0;
//         let currentMaterialIndex = 0;
//         let currentFurnitureIndex = 0;
        
//         // Function to add a new page and reset positions
//         const addNewPage = () => {
//             page = pdfDoc.addPage([842, 595]);
//             yPosition = height - 50;
            
//             // Redraw package headers on new page
//             packages.forEach((pkg: any, index: number) => {
//                 const x = startX + (index * (columnWidth + columnSpacing));
//                 const colors = (packageColors as any)[pkg.level] || packageColors.economy;
                
//                 // Draw package header with background
//                 page.drawRectangle({
//                     x: x,
//                     y: yPosition - 40,
//                     width: columnWidth,
//                     height: 40,
//                     color: colors.header,
//                 });

//                 // Package title
//                 const packageTitle = pkg.level.charAt(0).toUpperCase() + pkg.level.slice(1);
//                 page.drawText(`${packageTitle}`, {
//                     x: x + 15,
//                     y: yPosition - 25,
//                     size: 16,
//                     font: boldFont,
//                     color: rgb(1, 1, 1),
//                 });
//             });
            
//             yPosition -= 60;
//         };
        
//         // Draw package columns
//         for (let pkgIndex = 0; pkgIndex < packages.length; pkgIndex++) {
//             const pkg = packages[pkgIndex];
//             const x = startX + (pkgIndex * (columnWidth + columnSpacing));
//             const currentY = yPosition;

//             // Calculate total cost for this package
//             const totalCost = pkg.rooms?.reduce((sum: number, room: any) => sum + (room.totalCost || 0), 0) || 0;

//             const colors = (packageColors as any)[pkg.level] || packageColors.economy;

//             // Draw package header with background
//             page.drawRectangle({
//                 x: x,
//                 y: currentY - 40,
//                 width: columnWidth,
//                 height: 40,
//                 color: colors.header,
//             });

//             // Package title with icon
//             const packageTitle = pkg.level.charAt(0).toUpperCase() + pkg.level.slice(1);
//             page.drawText(`${packageTitle}`, {
//                 x: x + 15,
//                 y: currentY - 25,
//                 size: 16,
//                 font: boldFont,
//                 color: rgb(1, 1, 1),
//             });

//             let packageY = currentY - 50;

//             // Draw package content background
//             const contentHeight = 400; // Adjust based on content
//             page.drawRectangle({
//                 x: x,
//                 y: packageY - contentHeight,
//                 width: columnWidth,
//                 height: contentHeight,
//                 color: colors.bg,
//             });

//             // Price section
//             page.drawText(`Rs: ${totalCost.toLocaleString('en-IN')}`, {
//                 x: x + 15,
//                 y: packageY - 25,
//                 size: 18,
//                 font: boldFont,
//                 color: rgb(0.1, 0.1, 0.1),
//             });

//             packageY -= 45;

//             // Room names
//             const roomNames = pkg.rooms?.map((room: any) => room.name).filter(Boolean).join(' | ') || 'No rooms';
//             const wrappedRoomNames = wrapText(roomNames, columnWidth - 30, regularFont, 10);

//             wrappedRoomNames.forEach(line => {
//                 page.drawText(line, {
//                     x: x + 15,
//                     y: packageY,
//                     size: 10,
//                     font: regularFont,
//                     color: rgb(0.4, 0.4, 0.4),
//                 });
//                 packageY -= 12;
//             });

//             packageY -= 20;

//             // Process each room
//             for (let roomIndex = 0; roomIndex < (pkg.rooms?.length || 0); roomIndex++) {
//                 const room = pkg.rooms[roomIndex];
                
//                 // Check if we need a new page before starting a new room
//                 if (packageY < 100) {
//                     addNewPage();
//                     packageY = yPosition - 50;
                    
//                     // Redraw the current package header on the new page
//                     page.drawRectangle({
//                         x: x,
//                         y: packageY - 40,
//                         width: columnWidth,
//                         height: 40,
//                         color: colors.header,
//                     });
                    
//                     page.drawText(`${packageTitle}`, {
//                         x: x + 15,
//                         y: packageY - 25,
//                         size: 16,
//                         font: boldFont,
//                         color: rgb(1, 1, 1),
//                     });
                    
//                     packageY -= 60;
//                 }

//                 // ROOM NAME HEADING CHANGED - Show "Rooms" heading for each individual room
//                 page.drawText("Rooms", {
//                     x: x + 15,
//                     y: packageY,
//                     size: 12,
//                     font: boldFont,
//                     color: rgb(0.2, 0.2, 0.2),
//                 });
//                 packageY -= 15;

//                 // Room name
//                 page.drawText(`${room.name || 'Unnamed Room'} (1)`, {
//                     x: x + 20,
//                     y: packageY,
//                     size: 10,
//                     font: regularFont,
//                     color: rgb(0.3, 0.3, 0.3),
//                 });
//                 packageY -= 18;

//                 // Furniture section
//                 page.drawText("Furniture", {
//                     x: x + 20,
//                     y: packageY,
//                     size: 10,
//                     font: boldFont,
//                     color: rgb(0.2, 0.2, 0.2),
//                 });
//                 packageY -= 12;

//                 // Get furniture items
//                 const furnitureItems = room.roomFields?.map((field: any) => field.itemName).filter(Boolean) || [];
//                 const furnitureText = furnitureItems.length > 0 ? furnitureItems.join(', ') : 'No furniture items';
//                 const wrappedFurniture = wrapText(furnitureText, columnWidth - 50, regularFont, 9);

//                 // CHANGED: Handle page breaks for furniture items
//                 for (let i = 0; i < wrappedFurniture.length; i++) {
//                     if (packageY < 100) {
//                         addNewPage();
//                         packageY = yPosition - 50;
                        
//                         // Redraw the current package header on the new page
//                         page.drawRectangle({
//                             x: x,
//                             y: packageY - 40,
//                             width: columnWidth,
//                             height: 40,
//                             color: colors.header,
//                         });
                        
//                         page.drawText(`${packageTitle}`, {
//                             x: x + 15,
//                             y: packageY - 25,
//                             size: 16,
//                             font: boldFont,
//                             color: rgb(1, 1, 1),
//                         });
                        
//                         packageY -= 60;
                        
//                         // Redraw room and furniture headings
//                         page.drawText("Rooms", {
//                             x: x + 15,
//                             y: packageY,
//                             size: 12,
//                             font: boldFont,
//                             color: rgb(0.2, 0.2, 0.2),
//                         });
//                         packageY -= 15;
                        
//                         page.drawText(`${room.name || 'Unnamed Room'} (1)`, {
//                             x: x + 20,
//                             y: packageY,
//                             size: 10,
//                             font: regularFont,
//                             color: rgb(0.3, 0.3, 0.3),
//                         });
//                         packageY -= 18;
                        
//                         page.drawText("Furniture", {
//                             x: x + 20,
//                             y: packageY,
//                             size: 10,
//                             font: boldFont,
//                             color: rgb(0.2, 0.2, 0.2),
//                         });
//                         packageY -= 12;
//                     }
                    
//                     page.drawText(`• ${wrappedFurniture[i]}`, {
//                         x: x + 25,
//                         y: packageY,
//                         size: 9,
//                         font: regularFont,
//                         color: rgb(0.4, 0.4, 0.4),
//                     });
//                     packageY -= 11;
//                 }

//                 packageY -= 8;

//                 // Materials section
//                 page.drawText("Materials", {
//                     x: x + 20,
//                     y: packageY,
//                     size: 10,
//                     font: boldFont,
//                     color: rgb(0.2, 0.2, 0.2),
//                 });
//                 packageY -= 12;

//                 // Get all materials from all room fields
//                 const allMaterials: any[] = [];
//                 room.roomFields?.forEach((field: any) => {
//                     field.materialItems?.forEach((material: any) => {
//                         if (material.materialName) {
//                             allMaterials.push(material.materialName);
//                         }
//                     });
//                 });

//                 const materialsText = allMaterials.length > 0 ? allMaterials.join(', ') : 'No materials';
//                 const wrappedMaterials = wrapText(materialsText, columnWidth - 50, regularFont, 9);

//                 // CHANGED: Handle page breaks for material items
//                 for (let i = 0; i < wrappedMaterials.length; i++) {
//                     if (packageY < 100) {
//                         addNewPage();
//                         packageY = yPosition - 50;
                        
//                         // Redraw the current package header on the new page
//                         page.drawRectangle({
//                             x: x,
//                             y: packageY - 40,
//                             width: columnWidth,
//                             height: 40,
//                             color: colors.header,
//                         });
                        
//                         page.drawText(`${packageTitle}`, {
//                             x: x + 15,
//                             y: packageY - 25,
//                             size: 16,
//                             font: boldFont,
//                             color: rgb(1, 1, 1),
//                         });
                        
//                         packageY -= 60;
                        
//                         // Redraw room and material headings
//                         page.drawText("Rooms", {
//                             x: x + 15,
//                             y: packageY,
//                             size: 12,
//                             font: boldFont,
//                             color: rgb(0.2, 0.2, 0.2),
//                         });
//                         packageY -= 15;
                        
//                         page.drawText(`${room.name || 'Unnamed Room'} (1)`, {
//                             x: x + 20,
//                             y: packageY,
//                             size: 10,
//                             font: regularFont,
//                             color: rgb(0.3, 0.3, 0.3),
//                         });
//                         packageY -= 18;
                        
//                         page.drawText("Materials", {
//                             x: x + 20,
//                             y: packageY,
//                             size: 10,
//                             font: boldFont,
//                             color: rgb(0.2, 0.2, 0.2),
//                         });
//                         packageY -= 12;
//                     }
                    
//                     page.drawText(`• ${wrappedMaterials[i]}`, {
//                         x: x + 25,
//                         y: packageY,
//                         size: 9,
//                         font: regularFont,
//                         color: rgb(0.4, 0.4, 0.4),
//                     });
//                     packageY -= 11;
//                 }

//                 // Room divider
//                 if (roomIndex < pkg.rooms.length - 1) {
//                     packageY -= 5;
//                     page.drawLine({
//                         start: { x: x + 15, y: packageY },
//                         end: { x: x + columnWidth - 15, y: packageY },
//                         thickness: 0.5,
//                         color: rgb(0.7, 0.7, 0.7),
//                     });
//                     packageY -= 15;
//                 }
//             }

//             // Column border
//             page.drawRectangle({
//                 x: x,
//                 y: currentY - 40 - contentHeight,
//                 width: columnWidth,
//                 height: 40 + contentHeight,
//                 borderColor: rgb(0.8, 0.8, 0.8),
//                 borderWidth: 1,
//             });
//         }

//         // Handle empty packages case
//         if (packages.length === 0) {
//             page.drawText("No packages available", {
//                 x: width / 2 - 80,
//                 y: yPosition - 100,
//                 size: 16,
//                 font: regularFont,
//                 color: rgb(0.5, 0.5, 0.5),
//             });
//         }

//         // Serialize the PDF document to bytes
//         const pdfBytes = await pdfDoc.save();
//         console.log("getting the last code ")
//         return {
//             pdfBytes,
//             materialDoc: materialRoomConfirmationData
//         };



//     } catch (error: any) {
//         console.error('Error generating package comparison PDF:', error);
//         throw new Error('Failed to generate package comparison PDF', error.message);
//     }
// };

// // Helper function to wrap text
// function wrapText(text: string, maxWidth: any, font: any, fontSize: any) {
//     const words = text.split(' ');
//     const lines = [];
//     let currentLine = '';

//     words.forEach(word => {
//         const testLine = currentLine ? `${currentLine} ${word}` : word;
//         const testWidth = font.widthOfTextAtSize(testLine, fontSize);

//         if (testWidth <= maxWidth) {
//             currentLine = testLine;
//         } else {
//             if (currentLine) {
//                 lines.push(currentLine);
//                 currentLine = word;
//             } else {
//                 // Word is too long, force it on a line
//                 lines.push(word);
//             }
//         }
//     });

//     if (currentLine) {
//         lines.push(currentLine);
//     }

//     return lines.length > 0 ? lines : [''];
// }






// THIRD VERSION 



import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { COMPANY_LOGO } from '../ordering material controller/pdfOrderHistory.controller';
import { Types } from "mongoose"
import MaterialRoomConfirmationModel from '../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model';

export const generatePackageComparisonPDF = async (projectId: Types.ObjectId | string) => {
    try {
        const materialRoomConfirmationData = await MaterialRoomConfirmationModel.findOne({ projectId }).populate("projectId")

        if (!materialRoomConfirmationData) {
            throw new Error("Material item with given _id not found in this item.");
        }

        console.log("mateial arrival ", materialRoomConfirmationData)
        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage([842, 595]); // A4 Landscape for better comparison view
        const { width, height } = page.getSize();

        // Load fonts
        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        let yPosition = height - 20;

        console.log("gnerag the company detials ")
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

        console.log("completion of the company detials ")

        // "Compare packages" heading (left aligned)
        page.drawText("Compare packages", {
            x: 50,
            y: yPosition,
            size: 24,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2),
        });

        yPosition -= 40;

        // Package data
        const packages = materialRoomConfirmationData.package || [];

        // Define colors for each package
        const packageColors = {
            economy: {
                header: rgb(0.2, 0.5, 0.3),
                bg: rgb(0.9, 0.97, 0.9),
            },
            premium: {
                header: rgb(0.1, 0.3, 0.7),
                bg: rgb(0.9, 0.95, 1),
            },
            luxury: {
                header: rgb(0.4, 0.2, 0.1),
                bg: rgb(0.98, 0.95, 0.9),
            }
        };

        // Calculate column width
        const columnWidth = (width - 120) / 3; // 60px margin on each side
        const columnSpacing = 10;
        const startX = 60;
        console.log("Entering into For Loop")
        
        // Draw package headers for all packages on the first page
        packages.forEach((pkg: any, index: number) => {
            const x = startX + (index * (columnWidth + columnSpacing));
            const colors = (packageColors as any)[pkg.level] || packageColors.economy;
            
            // Draw package header with background
            page.drawRectangle({
                x: x,
                y: yPosition - 40,
                width: columnWidth,
                height: 40,
                color: colors.header,
            });

            // Package title
            const packageTitle = pkg.level.charAt(0).toUpperCase() + pkg.level.slice(1);
            page.drawText(`${packageTitle}`, {
                x: x + 15,
                y: yPosition - 25,
                size: 16,
                font: boldFont,
                color: rgb(1, 1, 1),
            });
        });

        let packageY = yPosition - 50;
        
        // Draw package content background for all packages
        packages.forEach((pkg: any, index: number) => {
            const x = startX + (index * (columnWidth + columnSpacing));
            const colors = (packageColors as any)[pkg.level] || packageColors.economy;
            
            // Calculate total cost for this package
            const totalCost = pkg.rooms?.reduce((sum: number, room: any) => sum + (room.totalCost || 0), 0) || 0;

            // Draw package content background
            page.drawRectangle({
                x: x,
                y: packageY - 400,
                width: columnWidth,
                height: 400,
                color: colors.bg,
            });

            // Price section
            page.drawText(`Rs: ${totalCost.toLocaleString('en-IN')}`, {
                x: x + 15,
                y: packageY - 25,
                size: 18,
                font: boldFont,
                color: rgb(0.1, 0.1, 0.1),
            });

            // Room names
            const roomNames = pkg.rooms?.map((room: any) => room.name).filter(Boolean).join(' | ') || 'No rooms';
            const wrappedRoomNames = wrapText(roomNames, columnWidth - 30, regularFont, 10);

            let roomNameY = packageY - 45;
            wrappedRoomNames.forEach(line => {
                page.drawText(line, {
                    x: x + 15,
                    y: roomNameY,
                    size: 10,
                    font: regularFont,
                    color: rgb(0.4, 0.4, 0.4),
                });
                roomNameY -= 12;
            });
        });

        packageY -= 80;

        // Function to add a new page and reset positions
        const addNewPage = () => {
            page = pdfDoc.addPage([842, 595]);
            yPosition = height - 50;
            packageY = yPosition - 50;
            
            // DON'T redraw package headers on new pages (as requested)
            return packageY;
        };

        // Find the maximum number of rooms across all packages
        const maxRooms = Math.max(...packages.map((pkg: any) => pkg.rooms?.length || 0));
        
        // Process all rooms across all packages in parallel
        for (let roomIndex = 0; roomIndex < maxRooms; roomIndex++) {
            // Check if we need a new page before starting a new room
            if (packageY < 100) {
                packageY = addNewPage();
            }
            
            // Process each package for this room
            for (let pkgIndex = 0; pkgIndex < packages.length; pkgIndex++) {
                const pkg = packages[pkgIndex];
                const x = startX + (pkgIndex * (columnWidth + columnSpacing));
                const colors = (packageColors as any)[pkg.level] || packageColors.economy;
                
                // Skip if this package doesn't have this room
                if (roomIndex >= (pkg.rooms?.length || 0)) continue;
                
                const room = pkg.rooms[roomIndex];
                
                // ROOM NAME HEADING - Show "Rooms" heading for each individual room
                page.drawText("Rooms", {
                    x: x + 15,
                    y: packageY,
                    size: 12,
                    font: boldFont,
                    color: rgb(0.2, 0.2, 0.2),
                });
                
                // Room name
                page.drawText(`${room.name || 'Unnamed Room'}`, {
                    x: x + 20,
                    y: packageY - 15,
                    size: 10,
                    font: regularFont,
                    color: rgb(0.3, 0.3, 0.3),
                });
                
                let currentY = packageY - 33;

                // Furniture section
                page.drawText("Furniture", {
                    x: x + 20,
                    y: currentY,
                    size: 10,
                    font: boldFont,
                    color: rgb(0.2, 0.2, 0.2),
                });
                currentY -= 12;

                // Get furniture items
                const furnitureItems = room.roomFields?.map((field: any) => field.itemName).filter(Boolean) || [];
                const furnitureText = furnitureItems.length > 0 ? furnitureItems.join(', ') : 'No furniture items';
                const wrappedFurniture = wrapText(furnitureText, columnWidth - 50, regularFont, 9);

                // Handle furniture items with page breaks
                for (let i = 0; i < wrappedFurniture.length; i++) {
                    // Check if we need a new page
                    if (currentY < 100) {
                        // Save current room index and package index
                        const savedRoomIndex = roomIndex;
                        const savedPkgIndex = pkgIndex;
                        
                        // Add new page
                        packageY = addNewPage();
                        currentY = packageY;
                        
                        // Redraw room and furniture headings for all packages
                        for (let pkgIdx = 0; pkgIdx < packages.length; pkgIdx++) {
                            const pkgItem = packages[pkgIdx];
                            const xPos = startX + (pkgIdx * (columnWidth + columnSpacing));
                            
                            if (savedRoomIndex < (pkgItem.rooms?.length || 0)) {
                                const roomItem = pkgItem.rooms[savedRoomIndex];
                                
                                page.drawText("Rooms", {
                                    x: xPos + 15,
                                    y: currentY,
                                    size: 12,
                                    font: boldFont,
                                    color: rgb(0.2, 0.2, 0.2),
                                });
                                
                                page.drawText(`${roomItem.name || 'Unnamed Room'} (1)`, {
                                    x: xPos + 20,
                                    y: currentY - 15,
                                    size: 10,
                                    font: regularFont,
                                    color: rgb(0.3, 0.3, 0.3),
                                });
                                
                                page.drawText("Furniture", {
                                    x: xPos + 20,
                                    y: currentY - 33,
                                    size: 10,
                                    font: boldFont,
                                    color: rgb(0.2, 0.2, 0.2),
                                });
                            }
                        }
                        
                        currentY -= 45;
                        roomIndex = savedRoomIndex;
                        pkgIndex = savedPkgIndex - 1; // Reset to previous package
                        break;
                    }
                    
                    page.drawText(`• ${wrappedFurniture[i]}`, {
                        x: x + 25,
                        y: currentY,
                        size: 9,
                        font: regularFont,
                        color: rgb(0.4, 0.4, 0.4),
                    });
                    currentY -= 11;
                }

                currentY -= 8;

                // Materials section
                page.drawText("Materials", {
                    x: x + 20,
                    y: currentY,
                    size: 10,
                    font: boldFont,
                    color: rgb(0.2, 0.2, 0.2),
                });
                currentY -= 12;

                // Get all materials from all room fields
                const allMaterials: any[] = [];
                room.roomFields?.forEach((field: any) => {
                    field.materialItems?.forEach((material: any) => {
                        if (material.materialName) {
                            allMaterials.push(material.materialName);
                        }
                    });
                });

                const materialsText = allMaterials.length > 0 ? allMaterials.join(', ') : 'No materials';
                const wrappedMaterials = wrapText(materialsText, columnWidth - 50, regularFont, 9);

                // Handle material items with page breaks
                for (let i = 0; i < wrappedMaterials.length; i++) {
                    // Check if we need a new page
                    if (currentY < 100) {
                        // Save current room index and package index
                        const savedRoomIndex = roomIndex;
                        const savedPkgIndex = pkgIndex;
                        
                        // Add new page
                        packageY = addNewPage();
                        currentY = packageY;
                        
                        // Redraw room and material headings for all packages
                        for (let pkgIdx = 0; pkgIdx < packages.length; pkgIdx++) {
                            const pkgItem = packages[pkgIdx];
                            const xPos = startX + (pkgIdx * (columnWidth + columnSpacing));
                            
                            if (savedRoomIndex < (pkgItem.rooms?.length || 0)) {
                                const roomItem = pkgItem.rooms[savedRoomIndex];
                                
                                page.drawText("Rooms", {
                                    x: xPos + 15,
                                    y: currentY,
                                    size: 12,
                                    font: boldFont,
                                    color: rgb(0.2, 0.2, 0.2),
                                });
                                
                                page.drawText(`${roomItem.name || 'Unnamed Room'} (1)`, {
                                    x: xPos + 20,
                                    y: currentY - 15,
                                    size: 10,
                                    font: regularFont,
                                    color: rgb(0.3, 0.3, 0.3),
                                });
                                
                                page.drawText("Materials", {
                                    x: xPos + 20,
                                    y: currentY - 45,
                                    size: 10,
                                    font: boldFont,
                                    color: rgb(0.2, 0.2, 0.2),
                                });
                            }
                        }
                        
                        currentY -= 60;
                        roomIndex = savedRoomIndex;
                        pkgIndex = savedPkgIndex - 1; // Reset to previous package
                        break;
                    }
                    
                    page.drawText(`• ${wrappedMaterials[i]}`, {
                        x: x + 25,
                        y: currentY,
                        size: 9,
                        font: regularFont,
                        color: rgb(0.4, 0.4, 0.4),
                    });
                    currentY -= 11;
                }
                
                // Update the minimum Y position across all packages
                if (pkgIndex === packages.length - 1) {
                    packageY = Math.min(packageY, currentY - 20);
                }
            }
            
            // Room divider for all packages
            if (roomIndex < maxRooms - 1) {
                packages.forEach((pkg: any, index: number) => {
                    const x = startX + (index * (columnWidth + columnSpacing));
                    
                    if (roomIndex < (pkg.rooms?.length || 0) - 1) {
                        page.drawLine({
                            start: { x: x + 15, y: packageY },
                            end: { x: x + columnWidth - 15, y: packageY },
                            thickness: 0.5,
                            color: rgb(0.7, 0.7, 0.7),
                        });
                    }
                });
                
                packageY -= 15;
            }
        }

        // Draw column borders for all packages
        packages.forEach((pkg: any, index: number) => {
            const x = startX + (index * (columnWidth + columnSpacing));
            
            page.drawRectangle({
                x: x,
                y: yPosition - 40 - 400,
                width: columnWidth,
                height: 40 + 400,
                borderColor: rgb(0.8, 0.8, 0.8),
                borderWidth: 1,
            });
        });

        // Handle empty packages case
        if (packages.length === 0) {
            page.drawText("No packages available", {
                x: width / 2 - 80,
                y: yPosition - 100,
                size: 16,
                font: regularFont,
                color: rgb(0.5, 0.5, 0.5),
            });
        }

        // Serialize the PDF document to bytes
        const pdfBytes = await pdfDoc.save();
        console.log("getting the last code ")
        return {
            pdfBytes,
            materialDoc: materialRoomConfirmationData
        };

    } catch (error: any) {
        console.error('Error generating package comparison PDF:', error);
        throw new Error('Failed to generate package comparison PDF', error.message);
    }
};

// Helper function to wrap text
function wrapText(text: string, maxWidth: any, font: any, fontSize: any) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (testWidth <= maxWidth) {
            currentLine = testLine;
        } else {
            if (currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                // Word is too long, force it on a line
                lines.push(word);
            }
        }
    });

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [''];
}