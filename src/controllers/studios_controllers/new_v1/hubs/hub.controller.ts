import { Request, Response } from "express";
import HubModel from "./hub.model"; // adjust path as needed

/**
 * Create a new hub
 */
export const createHub = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      organizationId,
      city,
      latitude,
      longitude,
      startingPincode,
      endingPincode,
      materialPercentage,
      labourPercentage,
    } = req.body;

    if (!organizationId || !city) {
      return res.status(400).json({
        ok: false,
        message: "organizationId and city are required",
      });
    }

    const hub = await HubModel.create({
      organizationId,
      city,
      latitude,
      longitude,
      startingPincode,
      endingPincode,
      materialPercentage,
      labourPercentage,
    });

    return res.status(201).json({
      ok: true,
      message: "Hub created successfully",
      data: hub,
    });
  } catch (error: any) {
    console.error("Error creating hub:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Get all hubs for an organization
 */
export const getHubs = async (req: Request, res: Response): Promise<any> => {
  try {
    const { organizationId } = req.params;

    if (!organizationId) {
      return res.status(400).json({
        ok: false,
        message: "organizationId is required",
      });
    }

    const hubs = await HubModel.find({ organizationId }).lean();

    return res.status(200).json({
      ok: true,
      message: "Hubs fetched successfully",
      data: hubs,
    });
  } catch (error: any) {
    console.error("Error fetching hubs:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Get a single hub by id
 */
export const getHubById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { hubId } = req.params;

    if (!hubId) {
      return res.status(400).json({
        ok: false,
        message: "hubId is required",
      });
    }

    const hub = await HubModel.findById(hubId).lean();

    if (!hub) {
      return res.status(404).json({
        ok: false,
        message: "Hub not found",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Hub fetched successfully",
      data: hub,
    });
  } catch (error: any) {
    console.error("Error fetching hub:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Update a hub
 */
export const updateHub = async (req: Request, res: Response): Promise<any> => {
  try {
    const { hubId } = req.params;

    if (!hubId) {
      return res.status(400).json({
        ok: false,
        message: "hubId is required",
      });
    }

    const updatedHub = await HubModel.findByIdAndUpdate(hubId, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedHub) {
      return res.status(404).json({
        ok: false,
        message: "Hub not found",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Hub updated successfully",
      data: updatedHub,
    });
  } catch (error: any) {
    console.error("Error updating hub:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Delete a hub
 */
export const deleteHub = async (req: Request, res: Response): Promise<any> => {
  try {
    const { hubId } = req.params;

    if (!hubId) {
      return res.status(400).json({
        ok: false,
        message: "hubId is required",
      });
    }

    const deletedHub = await HubModel.findByIdAndDelete(hubId);

    if (!deletedHub) {
      return res.status(404).json({
        ok: false,
        message: "Hub not found",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Hub deleted successfully",
      data: deletedHub,
    });
  } catch (error: any) {
    console.error("Error deleting hub:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Toggle hub active status
 */
export const toggleHubStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { hubId } = req.params;

    if (!hubId) {
      return res.status(400).json({
        ok: false,
        message: "hubId is required",
      });
    }

    const hub = await HubModel.findById(hubId);

    if (!hub) {
      return res.status(404).json({
        ok: false,
        message: "Hub not found",
      });
    }

    hub.isActive = !hub.isActive;
    await hub.save();

    return res.status(200).json({
      ok: true,
      message: "Hub status updated successfully",
      data: hub,
    });
  } catch (error: any) {
    console.error("Error toggling hub status:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};



/**
 * Find the hub matching a city/pincode/lat-long combination
 * Priority: pincode range match > city name match > nearest by lat/long
 */
export const findHubByLocation = async (req: Request, res: Response): Promise<any> => {
  try {
    const { organizationId, city, pincode, latitude, longitude } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        ok: false,
        message: "organizationId is required",
      });
    }

    if (!city && !pincode && !(latitude && longitude)) {
      return res.status(400).json({
        ok: false,
        message: "Provide at least one of: city, pincode, or latitude & longitude",
      });
    }

    let hub = null;

    // 1. Try pincode range match first
    if (pincode) {
      const pin = Number(pincode);

      if (isNaN(pin)) {
        return res.status(400).json({
          ok: false,
          message: "pincode must be a valid number",
        });
      }

      const hubs = await HubModel.find({
        organizationId,
        isActive: true,
        startingPincode: { $ne: null },
        endingPincode: { $ne: null },
      }).lean();

      hub = hubs.find(
        (h) =>
          Number(h.startingPincode) <= pin && pin <= Number(h.endingPincode)
      );
    }

    // 2. Fall back to city name match
    if (!hub && city) {
      hub = await HubModel.findOne({
        organizationId,
        isActive: true,
        // city: { $regex: new RegExp(`^${city}$`, "i") },
        city: { $regex: new RegExp(`^${String(city).trim()}$`, "i") },
      }).lean();
    }

    // 3. Fall back to nearest hub by latitude/longitude
    if (!hub && latitude && longitude) {
      const lat = Number(latitude);
      const lng = Number(longitude);

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({
          ok: false,
          message: "latitude and longitude must be valid numbers",
        });
      }

      const hubs = await HubModel.find({
        organizationId,
        isActive: true,
        latitude: { $ne: null },
        longitude: { $ne: null },
      }).lean();

      if (hubs.length > 0) {
        let nearestHub = hubs[0];
        let minDistance = Infinity;

        for (const h of hubs) {
          // Haversine distance (km)
          const R = 6371;
          const dLat = ((h.latitude - lat) * Math.PI) / 180;
          const dLng = ((h.longitude - lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat * Math.PI) / 180) *
              Math.cos((h.latitude * Math.PI) / 180) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          if (distance < minDistance) {
            minDistance = distance;
            nearestHub = h;
          }
        }

        hub = nearestHub;
      }
    }

    if (!hub) {
      return res.status(404).json({
        ok: false,
        message: "No matching hub found for the given location data",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Hub matched successfully",
      data: hub,
    });
  } catch (error: any) {
    console.error("Error finding hub by location:", error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};