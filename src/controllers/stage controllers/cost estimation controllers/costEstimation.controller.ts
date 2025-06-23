import { CostEstimationModel } from '../../../models/Stage Models/Cost Estimation Model/costEstimation.model';
import { SiteMeasurementModel } from '../../../models/Stage Models/siteMeasurement models/siteMeasurement.model';
import MaterialRoomConfirmationModel from './../../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model';


interface MaterialEstimation {
    workName: string;
    materialName: string;
    totalSqft: number;
    predefinedRatePerSqft: number;
    finalRatePerSqft: number;
    totalCost: number;
    isManualOverride: boolean;
    notes: string | null;
}

interface RoomEstimation {
    roomName: string;
    roomTotalCost: number;
    materials: MaterialEstimation[];
}


// export const autoGenerateCostEstimation = async (projectId: string): Promise<void> => {
//     const siteData = await SiteMeasurementModel.findOne({ projectId });
//     const materialData = await MaterialRoomConfirmationModel.findOne({ projectId });

//     if (!siteData || !materialData) return;

//     let costEstimation = await CostEstimationModel.findOne({ projectId });

//     const roomMap = new Map<string, RoomEstimation>();
//     costEstimation?.roomEstimations.forEach(room => {
//         roomMap.set(room.roomName.toLowerCase(), room);
//     });

//     const updatedRooms: RoomEstimation[] = [];

//     for (const siteRoom of siteData.rooms) {
//         if (!siteRoom.name) continue;
//         const roomName = siteRoom.name.toLowerCase();
//         const existingRoom = roomMap.get(roomName);


//         const matchingMaterialRoom = materialData.rooms.find(
//             matRoom => matRoom.roomName?.toLowerCase() === roomName
//         );

//         const materialMap = new Map<string, MaterialEstimation>();
//         existingRoom?.materials.forEach(mat => {
//             materialMap.set(`${mat.workName}|${mat.materialName}`, mat);
//         });

//         const newMaterials: MaterialEstimation[] = [];

//         if (matchingMaterialRoom) {
//             for (const work of matchingMaterialRoom.modularWorks) {
//                 for (const material of work.materials) {
//                     const key = `${work.workName}|${material}`;
//                     const totalSqft = (siteRoom.length ?? 0) * (siteRoom.breadth ?? 0);

//                     if (materialMap.has(key)) {
//                         const oldMat = materialMap.get(key)!;
//                         newMaterials.push({
//                             ...oldMat,
//                             totalSqft // update sqft only, preserve manual cost settings
//                         });
//                         materialMap.delete(key); // remove processed
//                     } else {
//                         const predefinedRate = 100 // PREDEFINED RATE, YO CNA CHANGE HERE ITSELF ;
//                         newMaterials.push({
//                             workName: work.workName,
//                             materialName: material,
//                             totalSqft,
//                             predefinedRatePerSqft: predefinedRate,
//                             finalRatePerSqft: predefinedRate,
//                             totalCost: 0,
//                             isManualOverride: false,
//                             notes: ''
//                         });
//                     }
//                 }
//             }
//         }

//         // Any materials not found in new list = deleted in Material Selection => don't include them
//         updatedRooms.push({
//             roomName: siteRoom.name,
//             roomTotalCost: existingRoom?.roomTotalCost ?? 0,
//             materials: newMaterials
//         });
//     }

//     if (costEstimation) {
//         costEstimation.roomEstimations = updatedRooms;
//         await costEstimation.save();
//     } else {
//         await CostEstimationModel.create({
//             projectId,
//             roomEstimations: updatedRooms,
//             totalEstimation: 0
//         });
//     }
// };

