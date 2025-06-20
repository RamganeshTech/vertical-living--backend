// import { Request, Response } from "express";
// import { IFileItem, SampleDesignModel } from "../../../models/Stage Models/sampleDesing model/sampleDesign.model";


// // KITCHEN
// const uploadKitchenFiles = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId } = req.params;
//     const files = req.files as Express.Multer.File[];

//     if (!files || files.length === 0) {
//       return res.status(400).json({ message: "No files uploaded." });
//     }

//     const mapUploadedFileToFileItem = (file: Express.Multer.File & { location: string }): IFileItem => ({
//       type: file.mimetype.startsWith("image") ? "image" : "pdf" as const,
//       url: file.location,
//       originalName: file.originalname,
//       uploadedAt: new Date()
//     });

//     const mappedFiles: IFileItem[] = (files as (Express.Multer.File & { location: string })[]).map(mapUploadedFileToFileItem);


//     const existing = await SampleDesignModel.findOne({ projectId });

//     if (!existing) {
//       const newDoc = await SampleDesignModel.create({
//         projectId,
//         kitchen: { imagesAndPdfs: mappedFiles }
//       });
//       return res.status(201).json({ message: "Kitchen files uploaded", data: newDoc });
//     }

//     if (!existing.kitchen) {
//       existing.kitchen = { imagesAndPdfs: [] };
//     }

//     existing.kitchen.imagesAndPdfs.push(...mappedFiles);
//     await existing.save();

//     return res.status(200).json({ message: "Kitchen files added", data: existing.kitchen });
//   } catch (error) {
//     console.error("Kitchen Upload Error:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// const deleteKitchenFile = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId, fileIndex } = req.params;

//     const design = await SampleDesignModel.findOne({ projectId });

//     if (!design || !design.kitchen || !design.kitchen.imagesAndPdfs[+fileIndex]) {
//       return res.status(404).json({ message: "File not found in kitchen section." });
//     }

//     // Remove file by index
//     design.kitchen.imagesAndPdfs.splice(+fileIndex, 1);
//     await design.save();

//     return res.status(200).json({
//       message: "Kitchen file deleted successfully.",
//       data: design.kitchen
//     });
//   } catch (error) {
//     console.error("Delete Error:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// const getKitchenDesign = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId } = req.params;
//     const design = await SampleDesignModel.findOne({ projectId }, { kitchen: 1 });

//     if (!design?.kitchen) return res.status(404).json({ message: "No kitchen design found." });

//     return res.status(200).json({ data: design.kitchen });
//   } catch (error) {
//     return res.status(500).json({ message: "Server error" });
//   }
// };


// // WARDROBE 


// const uploadWardrobeFiles = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId } = req.params;
//     const files = req.files as (Express.Multer.File & { location: string })[];

//     if (!files || files.length === 0) {
//       return res.status(400).json({ message: "No files uploaded." });
//     }

//     const mappedFiles: IFileItem[] = files.map(file => ({
//       type: file.mimetype.startsWith("image") ? "image" : "pdf" as const,
//       url: file.location,
//       originalName: file.originalname,
//       uploadedAt: new Date()
//     }));

//     let design = await SampleDesignModel.findOne({ projectId });

//     if (!design) {
//       design = new SampleDesignModel({
//         projectId,
//         wardrobe: { imagesAndPdfs: mappedFiles }
//       });
//     } else {
//       if (!design.wardrobe) {
//         design.wardrobe = { imagesAndPdfs: [] };
//       }
//       design.wardrobe.imagesAndPdfs.push(...mappedFiles);
//     }

//     await design.save();
//     return res.status(200).json({ message: "Wardrobe files uploaded", data: design.wardrobe });
//   } catch (error) {
//     console.error("Wardrobe Upload Error:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// const deleteWardrobeFile = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId, fileIndex } = req.params;

//     const design = await SampleDesignModel.findOne({ projectId });

//     if (!design || !design.wardrobe || !design.wardrobe.imagesAndPdfs[+fileIndex]) {
//       return res.status(404).json({ message: "File not found in wardrobe section." });
//     }

//     design.wardrobe.imagesAndPdfs.splice(+fileIndex, 1);
//     await design.save();

//     return res.status(200).json({
//       message: "Wardrobe file deleted successfully.",
//       data: design.wardrobe
//     });
//   } catch (error) {
//     console.error("Delete Error:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };


// const getWardrobeDesign = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId } = req.params;
//     const design = await SampleDesignModel.findOne({ projectId }, { kitchen: 1 });

//     if (!design?.wardrobe) return res.status(404).json({ message: "No wardrobe design found." });

//     return res.status(200).json({ data: design.wardrobe });
//   } catch (error) {
//     return res.status(500).json({ message: "Server error" });
//   }
// };


// // living hall


// const uploadLivingHallFiles = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId } = req.params;
//     const files = req.files as (Express.Multer.File & { location: string })[];

//     if (!files || files.length === 0) {
//       return res.status(400).json({ message: "No files uploaded." });
//     }

//     const mappedFiles: IFileItem[] = files.map(file => ({
//       type: file.mimetype.startsWith("image") ? "image" : "pdf" as const,
//       url: file.location,
//       originalName: file.originalname,
//       uploadedAt: new Date()
//     }));

//     let design = await SampleDesignModel.findOne({ projectId });

//     if (!design) {
//       design = new SampleDesignModel({
//         projectId,
//         livingHall: { imagesAndPdfs: mappedFiles }
//       });
//     } else {
//       if (!design.livingHall) {
//         design.livingHall = { imagesAndPdfs: [] };
//       }
//       design.livingHall.imagesAndPdfs.push(...mappedFiles);
//     }

//     await design.save();
//     return res.status(200).json({ message: "Living Hall files uploaded", data: design.livingHall });
//   } catch (error) {
//     console.error("Living Hall Upload Error:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// const deleteLivingHallFile = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId, fileIndex } = req.params;

//     const design = await SampleDesignModel.findOne({ projectId });

//     if (!design || !design.livingHall || !design.livingHall.imagesAndPdfs[+fileIndex]) {
//       return res.status(404).json({ message: "File not found in living hall section." });
//     }

//     design.livingHall.imagesAndPdfs.splice(+fileIndex, 1);
//     await design.save();

//     return res.status(200).json({
//       message: "Living Hall file deleted successfully.",
//       data: design.livingHall
//     });
//   } catch (error) {
//     console.error("Delete Error:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };



// const getLivingHallFiles = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId } = req.params;
//     const design = await SampleDesignModel.findOne({ projectId }, { livingHall: 1 });

//     if (!design?.livingHall || design.livingHall.imagesAndPdfs.length === 0) {
//       return res.status(404).json({ message: "No living hall files found." });
//     }

//     return res.status(200).json({ data: design.livingHall });
//   } catch (error) {
//     console.error("Fetch Error:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };


// // bedroom 
// const uploadBedroomFiles = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { projectId } = req.params;
//     const files = req.files as (Express.Multer.File & { location: string })[];

//     if (!files || files.length === 0) {
//       return res.status(400).json({ message: "No files uploaded." });
//     }

//     const mappedFiles: IFileItem[] = files.map(file => ({
//       type: file.mimetype.startsWith("image") ? "image" : "pdf" as const,
//       url: file.location,
//       originalName: file.originalname,
//       uploadedAt: new Date()
//     }));

//     let design = await SampleDesignModel.findOne({ projectId });

//     if (!design) {
//       design = new SampleDesignModel({
//         projectId,
//         bedroom: { imagesAndPdfs: mappedFiles }
//       });
//     } else {
//       if (!design.bedroom) {
//         design.bedroom = { imagesAndPdfs: [] };
//       }
//       design.bedroom.imagesAndPdfs.push(...mappedFiles);
//     }

//     await design.save();
//     return res.status(200).json({ message: "Bedroom files uploaded", data: design.bedroom });
//   } catch (error) {
//     console.error("Bedroom Upload Error:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };



// export {
//   uploadKitchenFiles,
//   deleteKitchenFile,
//   getKitchenDesign,


//   uploadWardrobeFiles,
//   deleteWardrobeFile,
//   getWardrobeDesign,


//   uploadLivingHallFiles,
//   deleteLivingHallFile,
//   getLivingHallFiles
// }




import { Request, Response } from "express";
import { IFileItem, SampleDesignModel } from "../../../models/Stage Models/sampleDesing model/sampleDesign.model";
import { handleSetStageDeadline } from "../../../utils/common features/timerFuncitonality";
import { TechnicalConsultationModel } from "../../../models/Stage Models/technical consulatation/technicalconsultation.model";

const addRoom = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    const { roomName } = req.body;

    if (!roomName || typeof roomName !== "string") {
      return res.status(400).json({ message: "Room name is required." });
    }

    const design = await SampleDesignModel.findOne({ projectId });

    if (!design) {
      const newDesign = new SampleDesignModel({
        projectId,
        rooms: [{ roomName, files: [] }]
      });
      await newDesign.save();
      return res.status(201).json({ message: "Room created", data: newDesign.rooms });
    }

    const roomExists = design.rooms.some(room => room.roomName === roomName);
    if (roomExists) {
      return res.status(400).json({ message: "Room already exists." });
    }

    design.rooms.push({ roomName, files: [] });
    await design.save();
    return res.status(200).json({ message: "Room added", data: design.rooms });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const uploadFilesToRoom = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, roomName } = req.params;
    const files = req.files as (Express.Multer.File & { location: string })[];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded." });
    }

    const design = await SampleDesignModel.findOne({ projectId });
    if (!design) {
      return res.status(404).json({ message: "Sample design not found." });
    }

    const room = design.rooms.find(r => r?.roomName === roomName);
    if (!room) {
      return res.status(404).json({ message: "Room not found." });
    }

    const mappedFiles: IFileItem[] = files.map(file => {
      const type: "image" | "pdf" = file.mimetype.startsWith("image") ? "image" : "pdf";
      return {
        type,
        url: file.location,
        originalName: file.originalname,
        uploadedAt: new Date()
      };
    });


    room.files.push(...mappedFiles);
    await design.save();

    return res.status(200).json({ message: "Files uploaded to room", data: room , ok:true});
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const getFilesFromRoom = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    const design = await SampleDesignModel.findOne({ projectId });

    if (!design) {
      return res.status(404).json({ message: "Sample design not found." });
    }

    console.log("design of the smaple deisng", design)
    // const room = design.rooms.find(r => r.roomName === roomName);
    // if (!room) {
    //   return res.status(404).json({ message: `${roomName} not found.`, ok:false });
    // }

    return res.status(200).json({ data: design , ok:true, message:"fetched successfully uploads"});
  } catch (error) {
    return res.status(500).json({ message: "Server error", ok:false });
  }
};

const deleteFileFromRoom = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId, roomName, fileIndex } = req.params;

    if(!projectId){
      return res.status(400).json({message:"projectId is requried", ok:false})
    }

    const design = await SampleDesignModel.findOne({ projectId });
    if (!design) {
      return res.status(404).json({ message: "Sample design not found." });
    }

    const room = design.rooms.find(r => r.roomName === roomName);
    if (!room || !room.files[+fileIndex]) {
      return res.status(404).json({ message: "File not found in room." });
    }

    room.files.splice(+fileIndex, 1);
    await design.save();

    return res.status(200).json({ message: "File deleted", data: room });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};


const deleteRoom = async (req: Request, res: Response): Promise<any> =>{
    try {
    const { projectId, roomId } = req.params;

    if(!projectId){
      return res.status(400).json({message:"projectId is requried", ok:false})
    }

    const design = await SampleDesignModel.findOneAndDelete({ projectId });
    if (!design) {
      return res.status(404).json({ message: "Sample design not found.",  ok:true });
    }

    return res.status(200).json({ message: "Room deleted", data: design, ok:true });
  } catch (error) {
    return res.status(500).json({ message: "Server error",  ok:true });
  }
}


const sampleDesignCompletionStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;

    if (!projectId) return res.status(400).json({ ok: false, message: "Project ID is required" });

    const design = await SampleDesignModel.findOne({ projectId });
    if (!design) return res.status(404).json({ ok: false, message: "Sample design not found" });

    if (design.status === "completed") return res.status(400).json({ ok: false, message: "Already completed" });

    design.status = "completed";
    design.isEditable = false;

    if (design.status === "completed") {

      let techConsultant = await TechnicalConsultationModel.findOne({ projectId });


      if (!techConsultant) {
        techConsultant = new TechnicalConsultationModel({
          projectId,
          status: "pending",
          isEditable: true,
          timer: {
            startedAt: new Date(),
            completedAt: null,
            deadLine: null
          },
          messages: []
        })
       } else {
        techConsultant.status = "pending";
        techConsultant.isEditable = true;
        techConsultant.timer.startedAt = new Date();

      }
      
      await techConsultant.save()
    }

    await design.save();
    return res.status(200).json({ ok: true, message: "Sample design marked as completed", data: design });
  } catch (err) {
    console.error("Sample design Complete Error:", err);
    return res.status(500).json({ message: "Internal server error", ok: false });
  }
};


const setSampleDesignStageDeadline = (req: Request, res: Response): Promise<any> => {
  return handleSetStageDeadline(req, res, {
    model: SampleDesignModel,
    stageName: "Sample Design"
  });
};

export {
  addRoom,
  uploadFilesToRoom,
  getFilesFromRoom,
  deleteFileFromRoom,
  deleteRoom,

  sampleDesignCompletionStatus,
  setSampleDesignStageDeadline,
};
