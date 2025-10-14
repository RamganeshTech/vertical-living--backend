import mongoose from "mongoose";
import dotenv from "dotenv";
import { MaterialInventoryModel } from "./MaterialInventory.model.js";
import data from "./dummyswitch.json"  // your JSON data file

dotenv.config();

// Change this to whichever organization you want

//  in this case it is node "dist/models/Material Inventory Model/BulkInsertSwitches.js"

// const organizationId = '6881a8c24a56bad430507bb8'; // dymmy organization
const organizationId = '684a57015e439b678e8f6918'; // original organizaiton (Arun)



async function importSwitchData() {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string);

    if (!organizationId) {
      console.error("❌ Organization ID missing.");
      return;
    }

    let inserted = 0;
    let skipped = 0;

    for (const item of data) {
      // Optional check for unique items (based on category + brand + description)
      const exists = await MaterialInventoryModel.findOne({
        organizationId,
        "specification.brand": item.brand,
        "specification.category": item.category,
        "specification.description": item.description,
      });

      if (!exists) {
        await MaterialInventoryModel.create({
          organizationId,
          specification: item,
        });
        inserted++;
      } else {
        skipped++;
      }
    }

    console.log(`✅ Inserted: ${inserted}, Skipped: ${skipped}`);
  } catch (err) {
    console.error("⚠️ Error importing switches:", err);
  } finally {
    await mongoose.disconnect();
  }
}

importSwitchData().catch(console.error);
