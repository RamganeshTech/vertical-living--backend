import OpenAI from "openai";
import { saveBrandsToDB } from "./storeBrandName";
import dotenv  from 'dotenv';

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Predefined prompts 🟢
export const BRAND_PROMPTS = {
  carpentry: "Give me a list of popular carpentry related brand names in India and globally. Respond with only the brand names, comma-separated.",
  hardware: "List well-known hardware brands (hinges, handles, screws, etc.) used in carpentry & interiors in India and globally. Comma-separated only.",
  // electricalFittings: "Provide top electrical fittings brand names (switches, sockets, wiring, panels). India and global. Only comma-separated brand names.",
  tiles: "Give a list of popular tile brands for flooring and wall cladding, India & global. Comma-separated only.",
  // ceramicSanitaryware: "List ceramic and sanitaryware brands for bathrooms, kitchens — India & global. Only comma-separated.",
  paintsCoatings: "List well-known paint & coating brands (interior/exterior). India & global. Comma-separated.",
  lightsFixtures: "Give famous lighting and fixtures brands for interiors/exteriors. India & global. Comma-separated only.",
  glassMirrors: "Provide top brands for glass and mirror products. India & globally. Only comma-separated.",
  // upholsteryCurtains: "List brands for upholstery, curtains & soft furnishings. India & global. Comma-separated only.",
  // falseCeilingMaterials: "Provide known false ceiling material brands — gypsum boards, panels, etc. India & global. Comma-separated.",
};

/**
 * Run: npx ts-node "src/lib/Store Brand Name/generateUsingAi.ts"
 * Change `categoryToGenerate` to whichever you want!
 */

export const storeBrandsDynamically = async ({
  category,
}: {
  category: keyof typeof BRAND_PROMPTS;
}): Promise<void> => {
  const prompt = BRAND_PROMPTS[category];
  if (!prompt) {
    console.error(`❌ No prompt defined for category: ${category}`);
    return;
  }

  try {
    console.log("gettin entered")
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const answer = completion.choices[0].message.content || "";
    const brandNames = answer.split(",").map(b => b.trim()).filter(Boolean);

    console.log(`✨ Fetched brands for ${category}:`, brandNames);

    await saveBrandsToDB({
      category,
      newBrands: brandNames,
    });

    console.log(`✅ Saved ${brandNames.length} brands to ${category} in DB.`);
  } catch (error) {
    console.error(`❌ Failed to store ${category} brands:`, error);
  }
};

// Example usage: manually set this before running
const categoryToGenerate: keyof typeof BRAND_PROMPTS = "carpentry";

storeBrandsDynamically({ category: categoryToGenerate });
