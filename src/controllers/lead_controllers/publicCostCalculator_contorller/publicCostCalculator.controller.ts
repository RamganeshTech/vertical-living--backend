// import PublicQuoteCalculatorModel from '../model/publicQuoteCalculator.model.js';
import type { Request, Response } from 'express';
import PublicQuoteCostCalculatorModel from '../../../models/lead_model/publicCostCalculator_model/publicCostCalculator.model';




import dotenv from "dotenv"
dotenv.config()


// import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
// import { uploadFileToS3New } from '../utils/s3UploadsNew.js';

// import { PublicQuoteModel } from '../models/PublicQuoteModel.js';
// import { uploadBufferToS3 } from '../utils/s3Config.js';


// Helper function to format the file object for your UploadSchema
// export const formatUploadData = async (file: any) => {
//     if (!file) return null;
//     const uploadData = await uploadFileToS3New(file);
//     const type = file.mimetype.startsWith("image") ? "image" : "video";
//     return {
//         url: uploadData.url,
//         key: uploadData.key,
//         type: type,
//         originalName: file.originalname,
//         uploadedAt: new Date()
//     };
// };




// export const COMPANY_LOGO = "https://th.bing.com/th/id/OIP.Uparc9uI63RDb82OupdPvwAAAA?w=80&h=80&c=1&bgcl=c77779&r=0&o=6&dpr=1.3&pid=ImgRC";
// export const COMPANY_NAME = "Vertical Living";
    
const VERTICAL_LIVING_ORG_ID = process.env.VERTICAL_LIVING_ORG_ID;

export const createPublicQuote = async (req: Request, res: Response):Promise<any> => {
    try {
        const { name, phone, location, carpetArea, homeType, finish, estimate , config, quotationPdf, consent} = req.body;

        // console.log("quotationpdf", quotationPdf)


        // console.log("req.body from the cost calculator", req.body)
      
        // // 1. Create PDF via pdf-lib
        // const pdfDoc = await PDFDocument.create();
        // const page = pdfDoc.addPage([612, 792]); // US Letter size
        // const { width, height } = page.getSize();

        // // Load fonts
        // const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        // const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // // Color Palette
        // const yellowColor = rgb(1, 0.8, 0); // Bright Yellow #FFCC00
        // const blackColor = rgb(0, 0, 0); // Pure Black
        // const blueColor = rgb(0, 0.4, 0.8); // Royal Blue #0066CC
        // const lightGray = rgb(0.95, 0.95, 0.95); // Light Gray for backgrounds
        // const whiteColor = rgb(1, 1, 1);
        // const darkGray = rgb(0.3, 0.3, 0.3); // Dark Gray for text
        
        // // Clean white background
        // page.drawRectangle({
        //     x: 0, y: 0,
        //     width: width,
        //     height: height,
        //     color: whiteColor,
        // });

        // // ===== HEADER SECTION WITH LOGO =====
        // let yPosition = height - 40;

        // // Try to fetch and embed logo using the provided method
        // try {
        //     const logoRes = await fetch(COMPANY_LOGO);
        //     const logoBuffer = await logoRes.arrayBuffer();
            
        //     // Try to determine image type and embed accordingly
        //     let logoImage;
        //     try {
        //         logoImage = await pdfDoc.embedJpg(logoBuffer);
        //     } catch {
        //         logoImage = await pdfDoc.embedPng(logoBuffer);
        //     }

        //     const logoScale = 0.5;
        //     const logoDims = logoImage.scale(logoScale);

        //     const brandText = "Vertical Living";
        //     const brandFontSize = 24;
        //     const brandColor = blueColor;
        //     const brandTextWidth = helveticaBold.widthOfTextAtSize(brandText, brandFontSize);

        //     const spacing = 10; // space between logo and text

        //     // Total width = logo + spacing + text
        //     const totalWidth = logoDims.width + spacing + brandTextWidth;

        //     // X and Y to center the whole block horizontally
        //     const combinedX = (width - totalWidth) / 2;
        //     const topY = yPosition;

        //     // Draw logo
        //     page.drawImage(logoImage, {
        //         x: combinedX,
        //         y: topY - logoDims.height,
        //         width: logoDims.width,
        //         height: logoDims.height,
        //     });

        //     // Align text vertically with logo
        //     const textY = topY - (logoDims.height / 2) - (brandFontSize / 3);

        //     // Draw text next to logo
        //     page.drawText(brandText, {
        //         x: combinedX + logoDims.width + spacing,
        //         y: textY,
        //         size: brandFontSize,
        //         font: helveticaBold,
        //         color: brandColor,
        //     });

        //     // Update yPosition to be below the logo
        //     yPosition = topY - logoDims.height - 15;

        //     // Draw horizontal line
        //     page.drawLine({
        //         start: { x: 50, y: yPosition },
        //         end: { x: width - 50, y: yPosition },
        //         thickness: 1,
        //         color: lightGray,
        //     });

        //     yPosition -= 25;
        // } catch (err) {
        //     console.error("Failed to load company logo:", err);
        //     // Fallback to text only
        //     page.drawText('VERTICAL LIVING', {
        //         x: 40,
        //         y: yPosition,
        //         size: 28,
        //         color: blueColor,
        //         font: helveticaBold
        //     });
        //     yPosition -= 30;
            
        //     page.drawLine({
        //         start: { x: 40, y: yPosition },
        //         end: { x: width - 40, y: yPosition },
        //         thickness: 1,
        //         color: lightGray,
        //     });
        //     yPosition -= 20;
        // }

     

        // // ===== CLIENT INFORMATION SECTION =====
        // page.drawText('CLIENT INFORMATION', {
        //     x: 40,
        //     y: yPosition,
        //     size: 14,
        //     color: blueColor,
        //     font: helveticaBold
        // });

        // // Yellow underline
        // page.drawRectangle({
        //     x: 40,
        //     y: yPosition - 10,
        //     width: 150,
        //     height: 2,
        //     color: yellowColor,
        // });

        // yPosition -= 30;

        // // Client details in a clean layout
        // const clientData = [
        //     { label: 'Full Name:', value: name },
        //     { label: 'Phone Number:', value: phone },
        //     { label: 'Project Location:', value: location },
        // ];

        // // Left side - Client details
        // let clientY = yPosition;
        // clientData.forEach((item) => {
        //     page.drawText(item.label, {
        //         x: 40,
        //         y: clientY,
        //         size: 10,
        //         color: darkGray,
        //         font: helvetica
        //     });

        //     page.drawText(item.value, {
        //         x: 150,
        //         y: clientY,
        //         size: 12,
        //         color: blackColor,
        //         font: helveticaBold
        //     });

        //     clientY -= 20;
        // });

        // // Right side - Date
        // const today = new Date();
        // const dateStr = today.toLocaleDateString('en-IN', {
        //     day: 'numeric',
        //     month: 'long',
        //     year: 'numeric'
        // });

        // page.drawText('Date:', {
        //     x: width - 200,
        //     y: yPosition,
        //     size: 10,
        //     color: darkGray,
        //     font: helvetica
        // });

        // page.drawText(dateStr, {
        //     x: width - 150,
        //     y: yPosition,
        //     size: 12,
        //     color: blackColor,
        //     font: helveticaBold
        // });

        // // Valid until
        // // const validUntil = new Date(today.setDate(today.getDate() + 30));
        // // const validUntilStr = validUntil.toLocaleDateString('en-IN', {
        // //     day: 'numeric',
        // //     month: 'long',
        // //     year: 'numeric'
        // // });

        // // page.drawText('Valid Until:', {
        // //     x: width - 200,
        // //     y: yPosition - 20,
        // //     size: 10,
        // //     color: darkGray,
        // //     font: helvetica
        // // });

        // // page.drawText(validUntilStr, {
        // //     x: width - 150,
        // //     y: yPosition - 20,
        // //     size: 12,
        // //     color: blackColor,
        // //     font: helveticaBold
        // // });

        // yPosition = clientY - 30;

        // // ===== PROJECT SPECIFICATIONS =====
        // page.drawText('PROJECT SPECIFICATIONS', {
        //     x: 40,
        //     y: yPosition,
        //     size: 14,
        //     color: blueColor,
        //     font: helveticaBold
        // });

        // page.drawRectangle({
        //     x: 40,
        //     y: yPosition - 10,
        //     width: 180,
        //     height: 2,
        //     color: yellowColor,
        // });

        // yPosition -= 30;

        // // Specification cards in a row
        // const specData = [
        //     { label: 'HOME TYPE', value: homeType },
        //     { label: 'CARPET AREA', value: `${carpetArea} sq.ft.` },
        //     { label: 'FINISH STYLE', value: finish },
        // ];

        // let cardX = 40;
        // const cardWidth = 160;
        
        // specData.forEach((item) => {
        //     // Card background
        //     page.drawRectangle({
        //         x: cardX,
        //         y: yPosition - 60,
        //         width: cardWidth,
        //         height: 60,
        //         color: whiteColor,
        //         borderColor: lightGray,
        //         borderWidth: 1,
        //     });

        //     // Yellow top border
        //     page.drawRectangle({
        //         x: cardX,
        //         y: yPosition,
        //         width: cardWidth,
        //         height: 3,
        //         color: yellowColor,
        //     });

        //     // Label
        //     page.drawText(item.label, {
        //         x: cardX + 10,
        //         y: yPosition - 20,
        //         size: 9,
        //         color: darkGray,
        //         font: helvetica
        //     });

        //     // Value
        //     page.drawText(item.value, {
        //         x: cardX + 10,
        //         y: yPosition - 40,
        //         size: 14,
        //         color: blackColor,
        //         font: helveticaBold
        //     });

        //     cardX += cardWidth + 20;
        // });

        // yPosition -= 90;

        // // ===== ESTIMATE SECTION =====
        // page.drawText('ESTIMATE DETAILS', {
        //     x: 40,
        //     y: yPosition,
        //     size: 14,
        //     color: blueColor,
        //     font: helveticaBold
        // });

        // page.drawRectangle({
        //     x: 40,
        //     y: yPosition - 10,
        //     width: 130,
        //     height: 2,
        //     color: yellowColor,
        // });

        // yPosition -= 30;

        // // Estimate card with proper height (only 60px height)
        // page.drawRectangle({
        //     x: 40,
        //     y: yPosition - 60,
        //     width: width - 80,
        //     height: 60,
        //     color: lightGray,
        // });

        // // Yellow left border
        // page.drawRectangle({
        //     x: 40,
        //     y: yPosition - 60,
        //     width: 5,
        //     height: 60,
        //     color: yellowColor,
        // });

        // // Total estimated value label
        // page.drawText('TOTAL ESTIMATED VALUE', {
        //     x: 60,
        //     y: yPosition - 20,
        //     size: 11,
        //     color: darkGray,
        //     font: helvetica
        // });

        // // Format estimate
        // const formattedEstimate = `INR ${estimate.toLocaleString('en-IN')}`;

        // // Amount
        // page.drawText(formattedEstimate, {
        //     x: 60,
        //     y: yPosition - 45,
        //     size: 24,
        //     color: blueColor,
        //     font: helveticaBold
        // });

        // yPosition -= 80;

        // // ===== TERMS AND CONDITIONS =====
        // // Separator line
        // yPosition -= 10;

        // page.drawLine({
        //     start: { x: 40, y: yPosition + 10 },
        //     end: { x: width - 40, y: yPosition + 10 },
        //     thickness: 1,
        //     color: lightGray,
        // });

        // page.drawText('Disclaimer', {
        //     x: 40,
        //     y: yPosition,
        //     size: 11,
        //     color: blueColor,
        //     font: helveticaBold
        // });

        // yPosition -= 20;

        // const terms = [
        //     '• This is a preliminary quotation based on the information provided',
        //     '• Final pricing may vary after site visit and material selection',
        //     // '• This quotation is valid for 30 days from the issue date',
        //     '• For more information contact to our sales team +91 9363993814',
        // ];

        // terms.forEach((term) => {
        //     page.drawText(term, {
        //         x: 40,
        //         y: yPosition,
        //         size: 8,
        //         color: darkGray,
        //         font: helvetica
        //     });
        //     yPosition -= 15;
        // });

        // // ===== FOOTER =====
        // const footerY = 50;

        // page.drawLine({
        //     start: { x: 40, y: footerY + 10 },
        //     end: { x: width - 40, y: footerY + 10 },
        //     thickness: 1,
        //     color: lightGray,
        // });

        // // Footer with company details
        // page.drawText('Vertical Living - Premium Interior Designs', {
        //     x: 40,
        //     y: footerY - 5,
        //     size: 8,
        //     color: blueColor,
        //     font: helvetica
        // });

        // page.drawText('www.theverticalliving.com', {
        //     x: 40,
        //     y: footerY - 20,
        //     size: 8,
        //     color: darkGray,
        //     font: helvetica
        // });

        // page.drawText('+91 93639 93814', {
        //     x: width - 150,
        //     y: footerY - 5,
        //     size: 8,
        //     color: darkGray,
        //     font: helvetica
        // });

        // const pdfBytes = await pdfDoc.save();

        // // 2. Upload to S3
        // const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_');
        // const timestamp = Date.now();
        // const filename = `${sanitizedName}_${timestamp}_Quote.pdf`;

        // const fakeFile = {
        //     buffer: Buffer.from(pdfBytes),
        //     originalname: filename,
        //     mimetype: 'application/pdf'
        // };

        // const quotationData = await uploadFileToS3New(fakeFile);

        // 3. Save to MongoDB
        
        if (!consent) {
            return res.status(400).json({ message: "consent should be true or accepted", ok: false })
        }

        
        const newQuote = new PublicQuoteCostCalculatorModel({
            organizationId: VERTICAL_LIVING_ORG_ID,
            name, phone, location, carpetArea, homeType, finish, estimate,
            quotationPdf, config, consent
        });

        await newQuote.save();

        res.status(201).json({
            ok: true,
            message: "Quotation saved successfully",
data: newQuote,
        });

    } catch (error) {
        console.error("Quote Error:", error);
        res.status(500).json({ ok: false, message: "Error generating quotation" });
    }
};

export const getAllPublicCostCalculator = async (req: Request, res: Response): Promise<any> => {
    try {


        const { 
      organizationId, 
      search,
      startDate,
      endDate,
      finish, // Mapping 'status' logic to your 'finish' type (Standard/Premium/Luxury)
      minAmount, 
      maxAmount 
    } = req.query;


    if (!organizationId) {
      return res.status(400).json({ ok: false, message: "Organization ID is required" });
    }

    // Initialize the query with the organizationId
    const query: any = { organizationId };

    // 1. Filter by Finish Type (Standard, Premium, Luxury)
    if (finish) {
      query.finish = finish;
    }

    // 2. Search Logic (Regex search across Name, Phone, and Location)
    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [
        { "name": searchRegex },
        { "phone": searchRegex },
        { "location": searchRegex },
        { "homeType": searchRegex }
      ];
    }

    // 3. Date Range Logic (Created At)
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(String(startDate));
      }
      if (endDate) {
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999); // Include the full end day
        query.createdAt.$lte = end;
      }
    }

    // 4. Amount Range Logic (Filtering based on the 'estimate' field)
    if (minAmount !== undefined || maxAmount !== undefined) {
      query.estimate = {};
      if (minAmount !== undefined && minAmount !== "") {
        query.estimate.$gte = Number(minAmount);
      }
      if (maxAmount !== undefined && maxAmount !== "") {
        query.estimate.$lte = Number(maxAmount);
      }
      // Remove the object if no numeric values were actually assigned
      if (Object.keys(query.estimate).length === 0) delete query.estimate;
    }


        // Filter by organizationId to ensure data isolation
        const quotes = await PublicQuoteCostCalculatorModel.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            ok: true,
            count: quotes.length,
            data: quotes,
        });
    } catch (error) {
        console.error("Fetch All Error:", error);
        res.status(500).json({ ok: false, message: "Server error retrieving data" });
    }
};

/**
 * Get single calculation by ID and Org ID
 */
export const getSinglePublicCostCalculator = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Ensure the ID belongs to this organization for security
        const quote = await PublicQuoteCostCalculatorModel.findOne({ 
            _id: id,
            organizationId: VERTICAL_LIVING_ORG_ID 
        });

        if (!quote) {
            return res.status(404).json({ ok: false, message: "Record not found" });
        }

        res.status(200).json({
            ok: true,
            data: quote,
        });
    } catch (error) {
        console.error("Fetch Single Error:", error);
        res.status(500).json({ ok: false, message: "Error retrieving record" });
    }
};


// import axios from 'axios';

// export const sendWhatsAppAutomation = async (clientPhone: string, clientName: string, pdfUrl: string) => {
//     const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
//     const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
    
//     // Ensure phone is in international format (e.g., 91xxxxxxxxxx for India)
//     const formattedPhone = clientPhone.replace(/\D/g, ''); 

//     const data = {
//         messaging_product: "whatsapp",
//         to: formattedPhone,
//         type: "template",
//         template: {
//             name: "cost_calculation_template", // Your approved template name
//             language: { code: "en" }, // Language selected in your screenshot
//             components: [
//                 {
//                     type: "header",
//                     parameters: [
//                         {
//                             type: "document",
//                             document: {
//                                 link: pdfUrl,
//                                 filename: "Vertical_Living_Estimation.pdf"
//                             }
//                         }
//                     ]
//                 },
//                 {
//                     type: "body",
//                     parameters: [
//                         { type: "text", text: clientName } // Fills {{customer_name}}
//                     ]
//                 }
//             ]
//         }
//     };

//     try {
//         const response = await axios.post(
//             `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
//             data,
//             { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
//         );
//         return response.data;
//     } catch (error: any) {
//         console.error("WhatsApp API Error:", error.response?.data || error.message);
//         throw error;
//     }
// };