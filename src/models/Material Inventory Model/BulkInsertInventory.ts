import mongoose from 'mongoose';
import data from './materialinventJSON.json';
import { MaterialInventoryModel } from './MaterialInventory.model';
import dotenv  from 'dotenv';

//  to run this you need to firsst npm run build 
//  and then you need to use the node and filename

//  in this case it is node "dist/models/Material Inventory Model/BulkInsertInventory.js"
dotenv.config();

const organizationId = '6881a8c24a56bad430507bb8'; // dymmy organization
// const organizationId = '684a57015e439b678e8f6918'; // original organizaiton (Arun)

async function importInventory() {
  await mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string); // Update with your connection string

  if(!organizationId){
    console.log("nor or id ")
    return ;
  }
  let inserted = 0;
  for (const item of data.items) {
    // Check for existing item by unique field (e.g., itemCode)
    const exists = await MaterialInventoryModel.findOne({ 'specification.itemCode': item.itemCode, organizationId });
    if (!exists) {
      await MaterialInventoryModel.create({
        organizationId,
        specification: item,
      });
      inserted++;
    }
  }

  console.log(`Inserted ${inserted} new items.`);
  await mongoose.disconnect();
}

// importInventory().catch(console.error);