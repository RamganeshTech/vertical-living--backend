// import nodeHtmlToImage from 'node-html-to-image';
import { s3, S3_BUCKET } from "../../../utils/s3Uploads/s3Client";
import { createCanvas, loadImage, registerFont } from 'canvas';


export const uploadImageToS3 = async (imageBuffer: Buffer, fileName: string) => {
    const params = {
        Bucket: S3_BUCKET,
        Key: fileName,
        Body: imageBuffer,
        ContentType: 'image/png',
        ContentDisposition: 'inline',
    };

    try {
        const result = await s3.upload(params).promise();
        return result;
    } catch (error) {
        console.error('S3 upload error (image):', error);
        throw new Error('Failed to upload image to S3');
    }
};

function convertTo12HourFormat(timeStr: string | undefined): string {
    if (!timeStr) return "---"; // fallback
    const [hourStr, minuteStr] = timeStr.split(":");
    let hour = parseInt(hourStr, 10);
    const minute = minuteStr.padStart(2, "0");

    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12; // 0 → 12 AM

    return `${hour.toString().padStart(2, "0")}:${minute} ${ampm}`;
}


export function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}





export const generateWorkReportImage = async (report: any): Promise<Buffer> => {
    const canvasWidth = 800;
    const padding = 40;
    const fontSize = 18;
    const lineHeight = fontSize * 1.6;
    const fieldSpacing = 10;
    const imageSize = 100;
    const imageGap = 20;
    const imagesPerRow = 3;

    const wrapText = (
  text: string,
  maxWidth: number,
  font: string,
  context = ctx // fall back to main ctx if none provided
): string[] => {
  context.font = font;
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (let word of words) {
    const width = context.measureText(currentLine + word).width;
    if (width < maxWidth) {
      currentLine += word + " ";
    } else {
      lines.push(currentLine.trim());
      currentLine = word + " ";
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  return lines;
};


    // Prepare canvas height estimation
    // const totalTextLines = 10; // The number of fields (workerName + 9 props)
    // const textBlockHeight = totalTextLines * (lineHeight + fieldSpacing);

   const measureTextBlockHeight = (): number => {
  const tempCanvas = createCanvas(1, 1);
  const tempCtx = tempCanvas.getContext('2d');

  const allFields = [
    { label: "Date", value: formatDate(report.date) },
    { label: "Place of Work", value: report.placeOfWork || "---" },
    { label: "Reporting Time", value: convertTo12HourFormat(report.reportingTime) },
    { label: "Work Start Time", value: convertTo12HourFormat(report.workStartTime) },
    { label: "Travelling Time", value: convertTo12HourFormat(report.travelingTime) },
    { label: "Work Done", value: report.workDone || "---" },
    { label: "Finishing Time", value: convertTo12HourFormat(report.finishingTime) },
    { label: "Shift Done", value: report.shiftDone || "---" },
    { label: "Place of Stay", value: report.placeOfStay || "---" }
  ];

  let totalLines = 1; // worker name
  for (let { label, value } of allFields) {
    const labelFont = 'bold 16px Arial';
    const valueFont = '16px Arial';

    tempCtx.font = labelFont;
    const labelWidth = tempCtx.measureText(`${label} -`).width || 0;
    const maxWidth = canvasWidth - padding * 2 - labelWidth - 10;

    const lines = wrapText(value, maxWidth, valueFont, tempCtx);
    totalLines += lines.length;
  }

  return totalLines * (lineHeight + fieldSpacing);
};

    // const textBlockHeight = measureTextBlockHeight();

    // const imageRows = Math.ceil((report.images?.length || 0) / imagesPerRow);
    // const imageBlockHeight = imageRows * (imageSize + imageGap);
    // const canvasHeight = padding * 2 + textBlockHeight + 60 + imageBlockHeight;

    // const canvas = createCanvas(canvasWidth, canvasHeight);
    // const ctx = canvas.getContext('2d');


    const textBlockHeight = measureTextBlockHeight();

const imageRows = Math.ceil((report.images?.length || 0) / imagesPerRow);
const imageBlockHeight = imageRows * (imageSize + imageGap);

const canvasHeight = padding * 2 + textBlockHeight + 60 + imageBlockHeight;

const canvas = createCanvas(canvasWidth, canvasHeight);
const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Fonts
    ctx.font = `bold ${fontSize + 2}px Arial`;
    ctx.fillStyle = '#dc2626'; // red-600
    ctx.fillText(report.workerName || "Unknown", padding, padding);

    ctx.fillStyle = '#000';
    ctx.font = `${fontSize}px Arial`;

    let x = padding; // ✅ x is now declared before being used
    let y = padding + lineHeight + 10;

    // const drawField = (label: string, value: string) => {
    //     ctx.font = 'bold 16px Arial';
    //     ctx.fillText(`${label} -`, x, y);

    //     ctx.font = '16px Arial';
    //     ctx.fillText(value, x + ctx.measureText(`${label} -`).width + 10, y); // Shift value slightly to the right
    //     y += lineHeight;
    // };

//     const wrapText = (text: string, maxWidth: number, font: string): string[] => {
//     ctx.font = font;
//     const words = text.split(" ");
//     const lines: string[] = [];
//     let currentLine = "";

//     for (let word of words) {
//         const width = ctx.measureText(currentLine + word).width;
//         if (width < maxWidth) {
//             currentLine += word + " ";
//         } else {
//             lines.push(currentLine.trim());
//             currentLine = word + " ";
//         }
//     }

//     if (currentLine.trim()) {
//         lines.push(currentLine.trim());
//     }

//     return lines;
// };




    const drawField = (label: string, value: string) => {
    const labelFont = 'bold 16px Arial';
    const valueFont = '16px Arial';
    const labelText = `${label} -`;

    ctx.font = labelFont;
    const labelWidth = ctx.measureText(labelText).width;
    ctx.fillText(labelText, x, y);

    // Wrap value text
    const maxWidth = canvasWidth - x - labelWidth - padding;
    const lines = wrapText(value, maxWidth, valueFont);

    ctx.font = valueFont;
    for (let i = 0; i < lines.length; i++) {
        const lineY = y + (lineHeight * i);
        ctx.fillText(lines[i], x + labelWidth + 10, lineY); // slightly offset from label
    }

    y += lineHeight * lines.length; // shift down based on how many lines used
};

    drawField("Date", formatDate(report.date));
    drawField("Place of Work", report.placeOfWork || "---");
    drawField("Reporting Time", convertTo12HourFormat(report.reportingTime));
    drawField("Work Start Time", convertTo12HourFormat(report.workStartTime));
    drawField("Travelling Time", convertTo12HourFormat(report.travelingTime));
    drawField("Work Done", report.workDone || "---");
    drawField("Finishing Time", convertTo12HourFormat(report.finishingTime));
    drawField("Shift Done", report.shiftDone || "---");
    drawField("Place of Stay", report.placeOfStay || "---");

    // Draw Images (after some spacing)
    y += 30;
    // let x = padding;
    let imageCount = 0;

    for (const imgObj of report.images || []) {
        const imageUrl = imgObj?.url || '';

        try {
            const img = await loadImage(imageUrl);
            ctx.drawImage(img, x, y, imageSize, imageSize);

            // Draw border
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, imageSize, imageSize);

        } catch (err) {
            console.error("Failed to load image in canvas:", err);
        }

        x += imageSize + imageGap;
        imageCount++;

        if (imageCount % imagesPerRow === 0) {
            x = padding;
            y += imageSize + imageGap;
        }
    }

    return canvas.toBuffer("image/png");
};


