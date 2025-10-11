import mongoose from 'mongoose';
import { MaterialInventoryModel } from './MaterialInventory.model';
import dotenv from 'dotenv';

// To run this script:
// 1. First run: npm run build
// 2. Then run: node "dist/models/Material Inventory Model/addBrandProperty.js"

dotenv.config();


// const organizationId = '6881a8c24a56bad430507bb8'; // dymmy organization
const organizationId = '684a57015e439b678e8f6918'; // original organizaiton (Arun)


async function addBrandToInventory() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string);
        console.log('Connected to MongoDB');

        if (!organizationId) {
            console.log("No organization ID provided");
            return;
        }

        // Find all documents for the organization that don't have brand or have null/undefined brand
        const itemsToUpdate = await MaterialInventoryModel.find({
            organizationId,
            $or: [
                { 'specification.brand': { $exists: false } },
                { 'specification.brand': null },
                { 'specification.brand': '' }
            ]
        });

        console.log(`Found ${itemsToUpdate.length} items to update`);

        let updated = 0;

        // Update each document
        for (const item of itemsToUpdate) {
            // Add brand property to specification
            item.specification.brand = 'jaquar';
              item.markModified('specification');
            // Save the updated document
            await item.save();
            updated++;

            // Log progress every 10 items
            if (updated % 10 === 0) {
                console.log(`Updated ${updated}/${itemsToUpdate.length} items...`);
            }
        }

        console.log(`✅ Successfully updated ${updated} items with brand: "jaquar"`);

        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');

    } catch (error) {
        console.error('❌ Error updating inventory:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run the function
addBrandToInventory().catch(console.error);