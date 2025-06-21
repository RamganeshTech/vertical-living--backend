import MaterialRoomConfirmationModel from './../../models/Stage Models/MaterialRoom Confirmation/MaterialRoomConfirmation.model';


export interface siteRooms {
    name: string | null;
    length: number | null;
    breadth: number | null;
    height?: number | null;
}


export const syncRoomsToMaterialConfirmation = async (projectId: string, siteRooms:siteRooms[]) => {


  let materialDoc = await MaterialRoomConfirmationModel.findOne({ projectId });

  if (!materialDoc) {
    materialDoc = new MaterialRoomConfirmationModel({
      projectId,
      status: "pending",
      isEditable: true,
      timer: { startedAt: new Date(), completedAt: null, deadLine: null },
      rooms: siteRooms.map((room: any) => ({
        roomName: room.roomName,
        uploads: [],
        modularWorks: [],
      })),
    });
  } else {
    const existingRoomNames = materialDoc.rooms.map((room: any) => room.roomName);
    siteRooms.forEach((room: any) => {
      if (!existingRoomNames.includes(room.roomName)) {
        materialDoc!.rooms.push({
          roomName: room.roomName,
          uploads: [],
          modularWorks: [],
        });
      }
    });
  }

  await materialDoc.save();
  return materialDoc;
};
