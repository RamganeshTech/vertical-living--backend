// import nodeHtmlToImage from 'node-html-to-image';
// import { s3, S3_BUCKET } from "../../../utils/s3Uploads/s3Client";


// export const uploadImageToS3 = async (imageBuffer: Buffer, fileName: string) => {
//   const params = {
//     Bucket: S3_BUCKET,
//     Key: fileName,
//     Body: imageBuffer,
//     ContentType: 'image/png',
//     ContentDisposition: 'inline',
//   };

//   try {
//     const result = await s3.upload(params).promise();
//     return result;
//   } catch (error) {
//     console.error('S3 upload error (image):', error);
//     throw new Error('Failed to upload image to S3');
//   }
// };

// function convertTo12HourFormat(timeStr: string | undefined): string {
//   if (!timeStr) return "---"; // fallback
//   const [hourStr, minuteStr] = timeStr.split(":");
//   let hour = parseInt(hourStr, 10);
//   const minute = minuteStr.padStart(2, "0");

//   const ampm = hour >= 12 ? "PM" : "AM";
//   hour = hour % 12;
//   if (hour === 0) hour = 12; // 0 → 12 AM

//   return `${hour.toString().padStart(2, "0")}:${minute} ${ampm}`;
// }

// export const generateWorkReportImage = async (report: any): Promise<Buffer> => {
// //   const html = `
// //     <html>
// //     <head>
// //       <style>
// //         body { font-family: Arial; padding: 20px; font-size: 16px; }
// //         .title { font-weight: bold; font-size: 20px; color: darkred; margin-bottom: 10px; }
// //         .label { font-weight: bold; }
// //         .line { margin-bottom: 5px; }
// //       </style>
// //     </head>
// //     <body>
// //       <div class="title">${report.workerName}</div>
// //       <div class="line"><span class="label">Date - </span>${new Date(report.date).toLocaleDateString()}</div>
// //       <div class="line"><span class="label">Place of Work - </span>${report.placeOfWork}</div>
// //       <div class="line"><span class="label">Reporting Time - </span>${report.reportingTime}</div>
// //       <div class="line"><span class="label">Work Start Time - </span>${report.workStartTime}</div>
// //       <div class="line"><span class="label">Travelling Time - </span>${report.travelingTime}</div>
// //       <div class="line"><span class="label">Work Done - </span>${report.workDone}</div>
// //       <div class="line"><span class="label">Finishing Time - </span>${report.finishingTime}</div>
// //       <div class="line"><span class="label">Shift Done - </span>${report.shiftDone}</div>
// //       <div class="line"><span class="label">Place of Stay - </span>${report.placeOfStay}</div>
// //     </body>
// //     </html>
// //   `;

//   const html = `
//       <html>
//       <head>
//         <style>
//           body {
//             font-family: Arial, sans-serif;
//             padding: 20px;
//             font-size: 16px;
//           }
//           .title {
//             font-weight: bold;
//             font-size: 20px;
//             color: darkred;
//             margin-bottom: 10px;
//           }
//           .label {
//             font-weight: bold;
//           }
//           .line {
//             margin-bottom: 5px;
//           }
//           .images {
//             margin-top: 15px;
//             display: flex;
//             gap: 10px;
//             flex-wrap: wrap;
//           }
//           .images img {
//             width: 120px;
//             height: 120px;
//             object-fit: cover;
//             border: 1px solid #ccc;
//             border-radius: 6px;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="title">${report.workerName}</div>
//       <div class="line"><span class="label">Date - </span>${new Date(report.date).toLocaleDateString()}</div>
//       <div class="line"><span class="label">Place of Work - </span>${report.placeOfWork}</div>
//       <div class="line"><span class="label">Reporting Time - </span>${convertTo12HourFormat(report.reportingTime)}</div>
//       <div class="line"><span class="label">Work Start Time - </span>${convertTo12HourFormat(report.workStartTime)}</div>
//       <div class="line"><span class="label">Travelling Time - </span>${convertTo12HourFormat(report.travelingTime)}</div>
//       <div class="line"><span class="label">Work Done - </span>${report.workDone}</div>
//       <div class="line"><span class="label">Finishing Time - </span>${convertTo12HourFormat(report.finishingTime)}</div>
//       <div class="line"><span class="label">Shift Done - </span>${report.shiftDone}</div>
//       <div class="line"><span class="label">Place of Stay - </span>${report.placeOfStay}</div>

//         <div class="images">
//           ${
//             report.images?.length > 0
//               ? report.images
//                   .map((img: any) => `<img src="${img.url}" alt="${img.originalName ?? 'work image'}" />`)
//                   .join("")
//               : "<p>No work images provided.</p>"
//           }
//         </div>
//       </body>
//       </html>
//     `;

//   const buffer = await nodeHtmlToImage({
//     html,
//     quality: 100,
//     type: 'png',
//     // encoding: 'buffer', // 👈 this returns a Buffer instead of writing to file
//   });

//   // return buffer;
//    return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as string);
// };