
import { GoogleGenAI, Type } from "@google/genai";
import { ModPackage, Team } from "../types";

export const generateModPackage = async (prompt: string): Promise<ModPackage | null> => {
  if (!process.env.API_KEY) return null;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemPrompt = `Generate a valid JSON ModPackage for Nebula Protocol.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Mod idea: ${prompt}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            author: { type: Type.STRING },
            roles: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, team: { type: Type.STRING, enum: [Team.INITIATIVE, Team.GLITCH, Team.NEUTRAL] }, description: { type: Type.STRING }, visionRadius: { type: Type.NUMBER }, canVent: { type: Type.BOOLEAN }, canKill: { type: Type.BOOLEAN }, killCooldown: { type: Type.NUMBER }, specialAbility: { type: Type.STRING } }, required: ["id", "name", "team", "description", "visionRadius", "canVent", "canKill", "killCooldown"] } },
            tasks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, type: { type: Type.STRING, enum: ["short", "long", "complex"] }, interactRange: { type: Type.NUMBER }, miniGameKey: { type: Type.STRING } }, required: ["id", "name", "type", "interactRange", "miniGameKey"] } }
          },
          required: ["id", "name", "roles", "tasks"]
        }
      }
    });
    return JSON.parse(response.text || '{}') as ModPackage;
  } catch (e) {
    return null;
  }
};