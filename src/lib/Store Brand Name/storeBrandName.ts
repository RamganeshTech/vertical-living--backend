import { BrandModel } from "../../models/Util Models/util.model"; 

export const saveBrandsToDB = async ({
  category,
  newBrands,
}: {
  category: string;
  newBrands: string[];
}): Promise<void> => {
  const uniqueNew = Array.from(new Set(newBrands.map(b => b.trim())));
  const existingDoc = await BrandModel.findOne({ category });

  if (existingDoc) {
    const merged = Array.from(new Set([...existingDoc.brandNames, ...uniqueNew]));
    existingDoc.brandNames = merged;
    await existingDoc.save();
    console.log(`✅ Updated ${category} brands. Total: ${merged.length}`);
  } else {
    await BrandModel.create({
      category,
      names: uniqueNew,
    });
    console.log(`✅ Created new ${category} brands list.`);
  }
};

//  to run this use this npx ts-node src/lib/Store Brand Name/generateUsingAi.ts
//  just change the differnetcategory in the generateUsingAi.ts funtion in the categoryToGenerate of ai in where role:user