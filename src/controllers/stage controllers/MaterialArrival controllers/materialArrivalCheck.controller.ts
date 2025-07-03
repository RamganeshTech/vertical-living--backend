import { Request, Response } from "express";
import MaterialArrivalModel, { IMaterialArrival, IMaterialArrivalTimer } from "../../../models/Stage Models/MaterialArrivalCheck Model/materialArrivalCheck.model";
import { validateMaterialFieldsByRoom } from "../../../utils/validateMaterialArrivalStep";
import { generateOrderingToken } from "../../../utils/generateToken";
import { handleSetStageDeadline, timerFunctionlity } from "../../../utils/common features/timerFuncitonality";

const allowedRooms = [
    "carpentry", "hardware", "electricalFittings", "tiles", "ceramicSanitaryware",
    "paintsCoatings", "lightsFixtures", "glassMirrors", "upholsteryCurtains", "falseCeilingMaterials"
];



export const syncMaterialArrival = async (projectId: string) => {

    const existing = await MaterialArrivalModel.findOne({ projectId });

    if (!existing) {
        const timer: IMaterialArrivalTimer = {
            startedAt: new Date(),
            completedAt: null,
            deadLine: null,
            reminderSent: false,
        };

        await MaterialArrivalModel.create({
            projectId: projectId,
            status: "pending",
            isEditable: true,
            generatedLink: null,
      assignedTo: null,
            shopDetails: {
                shopName: null,
                address: null,
                contactPerson: null,
                phoneNumber: null,
            },
            deliveryLocationDetails: {
                siteName: null,
                address: null,
                siteSupervisor: null,
                phoneNumber: null,
            },
            materialArrivalList: {
                carpentry: [],
                hardware: [],
                electricalFittings: [],
                tiles: [],
                ceramicSanitaryware: [],
                paintsCoatings: [],
                lightsFixtures: [],
                glassMirrors: [],
                upholsteryCurtains: [],
                falseCeilingMaterials: []
            },
            timer,
        });
    }
}

const updateMaterialArrivalShopDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const { shopName, address, contactPerson, phoneNumber } = req.body;

        if (!shopName || !address || !contactPerson || !phoneNumber) {
            return res.status(400).json({ ok: false, message: "All shop details are required" });
        }

        const updated = await MaterialArrivalModel.findOneAndUpdate(
            { projectId },
            { $set: { shopDetails: { shopName, address, contactPerson, phoneNumber } } },
            { new: true, upsert: true }
        );

        res.json({ ok: true, data: updated?.shopDetails });
    } catch (err: any) {
        res.status(500).json({ ok: false, message: err.message });
    }
};

const updateMaterialArrivalDeliveryLocation = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const { siteName, address, siteSupervisor, phoneNumber } = req.body;

        if (!siteName || !address || !siteSupervisor || !phoneNumber) {
            return res.status(400).json({ ok: false, message: "All delivery location details are required" });
        }

        const updated = await MaterialArrivalModel.findOneAndUpdate(
            { projectId },
            { $set: { deliveryLocationDetails: { siteName, address, siteSupervisor, phoneNumber } } },
            { new: true, upsert: true }
        );

        res.json({ ok: true, data: updated?.deliveryLocationDetails });
    } catch (err: any) {
        res.status(500).json({ ok: false, message: err.message });
    }
};

const updateMaterialArrivalRoomItem = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, roomKey } = req.params;
        const file = req.file as Express.Multer.File & { location: string };
        const itemDataRaw = req.body.itemData;  // in FE {itemData}


        console.log("gteng caled isndeiht sman caled isndeiht sman caled isndeiht sman")

        if (!itemDataRaw) {
            return res.status(400).json({ ok: false, message: "Item data is required" });
        }

        let itemData;
        try {
            itemData = JSON.parse(itemDataRaw);
        } catch {
            return res.status(400).json({ ok: false, message: "Invalid item data format" });
        }

        console.log("gteng caled is2222222222")

        console.log("file", file)
        // ⬇️ Only add upload info if file is present
        if (file) {
            console.log("file", file)
            itemData.upload = {
                type: "image",
                url: file.location,
                originalName: file.originalname,
                uploadedAt: new Date()
            };
        }

        console.log("itemData.upload", itemData.upload)

        // ⬇️ Validate only if file was uploaded or 'upload' field already present
        if (file || itemData.upload) {
            const validation = validateMaterialFieldsByRoom(roomKey, itemData);
            if (!validation.success) {
                return res.status(400).json({ ok: false, message: validation.message });
            }
        }



        // ⬇️ If _id is present, perform update
    if (itemData._id) {
      const updatePath = `materialArrivalList.${roomKey}`;
      const result = await MaterialArrivalModel.findOneAndUpdate(
        {
          projectId,
          [`${updatePath}._id`]: itemData._id,
        },
        {
          $set: {
            [`${updatePath}.$`]: itemData,
          },
        },
        { new: true }
      );

      if (!result) {
        return res.status(404).json({ ok: false, message: "Item not found for update" });
      }

      return res.status(200).json({ ok: true, message: "Item updated", data: result });
    }

        // ⬇️ add the materiallist for this room
        const result = await MaterialArrivalModel.findOneAndUpdate(
            { projectId },
            { $push: { [`materialArrivalList.${roomKey}`]: itemData } },
            { new: true }
        );

        if(!result){
            console.log("is it getting  send")
            return res.status(404).json({ ok: false, message: "section not available" })
        } 

        return res.status(200).json({ ok: true, message: "Item added", data: result });

    } catch (err: any) {
        return res.status(500).json({ ok: false, message: err.message || "Server error" });
    }
};


const deleteMaterialArrivalRoomItem = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, roomKey, itemId } = req.params;

        const update = await MaterialArrivalModel.findOneAndUpdate(
            { projectId },
            { $pull: { [`materialArrivalList.${roomKey}`]: { _id: itemId } } },
            { new: true }
        );

        res.json({ ok: true, data: update });
    } catch (err: any) {
        res.status(500).json({ ok: false, message: err.message });
    }
};

const getAllMaterialArrivalDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        if(!projectId){
                   res.status(400).json({ ok: false, message: "project is requried" });

        }
        const doc = await MaterialArrivalModel.findOne({ projectId });
console.log("docuemtn of matiera arival", doc)
        res.json({ ok: true, data: doc });
    } catch (err: any) {
        res.status(500).json({ ok: false, message: err.message });
    }
};

const getSingleRoomMaterialArrival = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, roomKey } = req.params;
        const doc = await MaterialArrivalModel.findOne({ projectId });

        if (!doc) return res.status(404).json({ ok: false, message: "Not found" });

        const roomItems = (doc.materialArrivalList as any)[roomKey];
        if (!roomItems) return res.status(404).json({ ok: false, message: "Invalid room key" });

        res.status(200).json({ ok: true, data: roomItems  });
    } catch (err: any) {
        res.status(500).json({ ok: false, message: err.message });
    }
};

const generateMaterialArrivalLink = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;

        const doc = await MaterialArrivalModel.findOne({ projectId });
        if (!doc) return res.status(404).json({ ok: false, message: "Material Arrival document not found" });

        if (doc.generatedLink) {
            return res.status(400).json({ ok: false, message: "Link already generated" });
        }

        const token = generateOrderingToken(); // or use your custom function like generateMaterialArrivalToken()
        doc.generatedLink = token;
        await doc.save();

        return res.status(200).json({
            ok: true,
            message: "Link generated successfully",
            data: {
                token,
                shareableUrl: `${process.env.FRONTEND_URL}/materialarrival/public/${projectId}/${token}`,
            }
        });
    } catch (err: any) {
        res.status(500).json({ ok: false, message: err.message });
    }
};

const getMaterialArrivalPublicDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId, token } = req.params;
        const doc = await MaterialArrivalModel.findOne({ projectId, generatedLink: token });

        if (!doc) return res.status(404).json({ ok: false, message: "Invalid or expired link" });

        const { materialArrivalList, shopDetails, deliveryLocationDetails } = doc;
        res.json({ ok: true, data: { materialArrivalList, shopDetails, deliveryLocationDetails } });
    } catch (err: any) {
        res.status(500).json({ ok: false, message: err.message });
    }
};




// COMMON STAGE CONTROLLERS

const setMaterialArrivalStageDeadline = (req: Request, res: Response): Promise<any> => {
    return handleSetStageDeadline(req, res, {
        model: MaterialArrivalModel,
        stageName: "Material Arrival"
    });
};



const materialArrivalCompletionStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { projectId } = req.params;
        const form = await MaterialArrivalModel.findOne({ projectId });

        if (!form) return res.status(404).json({ ok: false, message: "Form not found" });

        form.status = "completed";
        form.isEditable = false
        timerFunctionlity(form, "completedAt")
        await form.save();

        // if (form.status === "completed") {
        // }

        await syncMaterialArrival(projectId)

        return res.status(200).json({ ok: true, message: "cost estimation stage marked as completed", data: form });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Server error, try again after some time" });
    }
};


export {
    updateMaterialArrivalShopDetails,
    updateMaterialArrivalDeliveryLocation,
    updateMaterialArrivalRoomItem,
    deleteMaterialArrivalRoomItem,
    getAllMaterialArrivalDetails,
    getSingleRoomMaterialArrival,
    generateMaterialArrivalLink,
    getMaterialArrivalPublicDetails,

    setMaterialArrivalStageDeadline,
    materialArrivalCompletionStatus
};
