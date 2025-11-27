import { GoogleGenAI, Type } from "@google/genai";
import { ClothingItem, Outfit, WeeklyPlan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getBase64Data = (base64String: string) => {
  return base64String.split(',')[1];
};

/**
 * Analyzes a photo of a clothing item to extract metadata.
 */
export const analyzeClothingItem = async (base64Image: string): Promise<Partial<ClothingItem>> => {
  const modelId = "gemini-2.5-flash";
  
  const prompt = `Analyze this image of a clothing item.
  Classify it strictly into one of these categories: Top, Bottom, Outerwear, Shoes, One-Piece, Accessory, Other.
  Identify the dominant color.
  Identify the suitable season (Summer, Winter, Spring/Fall, All).
  Provide a short, trendy description.`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: getBase64Data(base64Image) } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, enum: ['Top', 'Bottom', 'Outerwear', 'Shoes', 'One-Piece', 'Accessory', 'Other'] },
            color: { type: Type.STRING },
            season: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ["category", "color", "season", "description"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Error analyzing clothing:", error);
    return {
      category: "Other",
      color: "Unknown",
      season: "All",
      description: "Could not analyze image."
    };
  }
};

/**
 * Generates a single visual outfit based on wardrobe and vibe.
 */
export const generateOutfit = async (
  wardrobe: ClothingItem[],
  weather: string,
  vibe: string
): Promise<Outfit | null> => {
  if (wardrobe.length === 0) return null;

  const modelId = "gemini-2.5-flash";
  
  // Create a minimal inventory list for the prompt
  const inventory = wardrobe.map(item => 
    `{ "id": "${item.id}", "category": "${item.category}", "color": "${item.color}", "desc": "${item.description}" }`
  ).join(',\n');

  const prompt = `You are a trendy stylist.
  Context: ${weather}
  User Vibe: "${vibe}"
  
  Inventory:
  [${inventory}]
  
  Task: Select items from the inventory to create a coherent, "Pinterest-worthy" outfit.
  Return a list of itemIds. Try to include a Top+Bottom (or One-Piece) and Shoes at minimum.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            itemIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            explanation: { type: Type.STRING },
            vibe: { type: Type.STRING }
          },
          required: ["itemIds", "explanation", "vibe"]
        }
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      return {
        id: Date.now().toString(),
        itemIds: result.itemIds,
        vibe: result.vibe || vibe,
        explanation: result.explanation
      };
    }
    return null;
  } catch (error) {
    console.error("Outfit generation error:", error);
    return null;
  }
};

/**
 * Generates an outfit based on an uploaded inspiration image.
 */
export const generateOutfitFromImage = async (
  wardrobe: ClothingItem[],
  inspoImageBase64: string
): Promise<Outfit | null> => {
  if (wardrobe.length === 0) return null;

  const modelId = "gemini-2.5-flash";
  
  const inventory = wardrobe.map(item => 
    `{ "id": "${item.id}", "category": "${item.category}", "color": "${item.color}", "desc": "${item.description}" }`
  ).join(',\n');

  const prompt = `I have this inspiration image (see attached).
  I want you to recreate this look as closely as possible using ONLY items from my current wardrobe inventory below.
  
  Inventory:
  [${inventory}]
  
  1. Analyze the vibe, colors, and key pieces in the image.
  2. Select the best matching items from my inventory.
  3. Explain why you chose these items to match the photo.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: getBase64Data(inspoImageBase64) } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            itemIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            explanation: { type: Type.STRING },
            vibe: { type: Type.STRING, description: "A 2-3 word title for this look based on the image" }
          },
          required: ["itemIds", "explanation", "vibe"]
        }
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      return {
        id: Date.now().toString(),
        itemIds: result.itemIds,
        vibe: result.vibe || "Inspo Match",
        explanation: result.explanation
      };
    }
    return null;

  } catch (error) {
    console.error("Inspo match error:", error);
    return null;
  }
};


/**
 * Generates a weekly plan (5 days)
 */
export const generateWeeklyPlan = async (
  wardrobe: ClothingItem[],
  weather: string,
  theme: string
): Promise<WeeklyPlan | null> => {
  if (wardrobe.length === 0) return null;

  const modelId = "gemini-2.5-flash";
  const inventory = wardrobe.map(item => 
    `{ "id": "${item.id}", "category": "${item.category}", "color": "${item.color}", "desc": "${item.description}" }`
  ).join(',\n');

  const prompt = `Create a 5-day (Mon-Fri) outfit plan.
  Theme: "${theme}".
  Context: ${weather}.
  
  Inventory: [${inventory}]
  
  Reuse items creatively if needed, but try to mix it up.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            Monday: { type: Type.OBJECT, properties: { itemIds: {type:Type.ARRAY, items:{type:Type.STRING}}, explanation: {type:Type.STRING} } },
            Tuesday: { type: Type.OBJECT, properties: { itemIds: {type:Type.ARRAY, items:{type:Type.STRING}}, explanation: {type:Type.STRING} } },
            Wednesday: { type: Type.OBJECT, properties: { itemIds: {type:Type.ARRAY, items:{type:Type.STRING}}, explanation: {type:Type.STRING} } },
            Thursday: { type: Type.OBJECT, properties: { itemIds: {type:Type.ARRAY, items:{type:Type.STRING}}, explanation: {type:Type.STRING} } },
            Friday: { type: Type.OBJECT, properties: { itemIds: {type:Type.ARRAY, items:{type:Type.STRING}}, explanation: {type:Type.STRING} } },
          },
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Weekly plan error:", error);
    return null;
  }
};

/**
 * Checks if a wishlist item is similar to something already owned.
 */
export const checkSimilarity = async (
  wishlistImageBase64: string, 
  wardrobe: ClothingItem[]
): Promise<{ isSimilar: boolean; explanation: string }> => {
  
  if (wardrobe.length === 0) return { isSimilar: false, explanation: "Your wardrobe is empty!" };

  const modelId = "gemini-2.5-flash";
  
  const wardrobeDescriptions = wardrobe.map(item => 
    `ID ${item.id}: ${item.color} ${item.category} - ${item.description}`
  ).join('\n');

  const prompt = `I am thinking of buying the item in this image. 
  Here is a list of items I already own:
  ${wardrobeDescriptions}

  Compare the visual item with my list. 
  Does it look significantly similar in style, color, or function to anything I own?
  Return JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: getBase64Data(wishlistImageBase64) } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSimilar: { type: Type.BOOLEAN },
            explanation: { type: Type.STRING, description: "A friendly warning message if similar, or encouragement if unique." },
          },
          required: ["isSimilar", "explanation"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return { isSimilar: false, explanation: "Go for it!" };
  } catch (error) {
    console.error("Similarity check error:", error);
    return { isSimilar: false, explanation: "Couldn't check for duplicates, but trust your gut!" };
  }
};
