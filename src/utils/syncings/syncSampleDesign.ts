import { PREDEFINED_ROOMS } from "../../constants/phaseConstants";
import { SampleDesignModel } from "../../models/Stage Models/sampleDesing model/sampleDesign.model";
import { siteRooms } from "./syncRoomsWithMaterialConfimation";

export const syncSampleDesignModel = async (projectId: string, siteRooms: siteRooms[]) => {

    let design = await SampleDesignModel.findOne({ projectId });


    if (!design) {
        design = new SampleDesignModel({
            projectId,
            rooms: PREDEFINED_ROOMS.map(roomName => {
                    return {
                      roomName,
                      files: []
                    }
                  }),
            status: "pending",
            isEditable: true,
            timer: {
                startedAt: new Date(),
                completedAt: null,
                deadLine: null
            },
            additionalNotes: null,
        })
    } else {
        design.status = "pending";
        design.isEditable = true;
        // design.timer.startedAt = new Date();
        const existingRoomNames = design.rooms.map((room: any) => room.roomName);
        siteRooms.forEach((room: any) => {
            if (!existingRoomNames.includes(room.roomName)) {
                design!.rooms.push({
                    roomName: room.roomName,
                    files: [],
                });
            }
        });
    }
    await design.save()

}