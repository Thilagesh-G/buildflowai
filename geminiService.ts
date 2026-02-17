
import { GoogleGenAI, Type } from "@google/genai";
import { Estimate, MaterialItem, LaborItem, ProjectStatus } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const MATERIAL_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      quantity: { type: Type.NUMBER },
      unit: { type: Type.STRING },
      unitPrice: { type: Type.NUMBER },
      category: { type: Type.STRING }
    },
    required: ["name", "quantity", "unit", "unitPrice", "category"]
  }
};

const LABOR_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      role: { type: Type.STRING },
      hours: { type: Type.NUMBER },
      rate: { type: Type.NUMBER }
    },
    required: ["role", "hours", "rate"]
  }
};

const RFP_EXTRACTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    projectName: { type: Type.STRING },
    projectType: { type: Type.STRING },
    location: { type: Type.STRING },
    deadline: { type: Type.STRING },
    materials: MATERIAL_SCHEMA,
    labor: LABOR_SCHEMA,
    notes: { type: Type.STRING }
  },
  required: ["projectName", "projectType", "materials", "labor"]
};

export const parseRFPText = async (rfpText: string): Promise<Partial<Estimate>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert electrical estimator specializing in the Indian market. Parse the following RFP text and extract structured project data.
      Provide realistic material quantities and labor estimates based on the RFP details. All currency values must be in Indian Rupees (INR).
      Text: ${rfpText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: RFP_EXTRACTION_SCHEMA
      }
    });

    const data = JSON.parse(response.text);
    
    // Add IDs and calculate totals for UI
    const materials: MaterialItem[] = data.materials.map((m: any, idx: number) => ({
      ...m,
      id: `mat-${Date.now()}-${idx}`,
      total: m.quantity * m.unitPrice
    }));

    const labor: LaborItem[] = data.labor.map((l: any, idx: number) => ({
      ...l,
      id: `lab-${Date.now()}-${idx}`,
      total: l.hours * l.rate
    }));

    const materialTotal = materials.reduce((acc, curr) => acc + curr.total, 0);
    const laborTotal = labor.reduce((acc, curr) => acc + curr.total, 0);

    return {
      projectName: data.projectName || "New Electrical Project",
      projectType: data.projectType || "Commercial",
      location: data.location || "Unknown Location",
      deadline: data.deadline || new Date().toISOString().split('T')[0],
      materials,
      labor,
      notes: data.notes || "Auto-extracted from RFP.",
      totalCost: materialTotal + laborTotal
    };
  } catch (error) {
    console.error("AI RFP Parsing Error:", error);
    throw error;
  }
};

export const getOptimizationSuggestions = async (estimate: Estimate): Promise<string> => {
  const prompt = `As an electrical project management consultant in India, analyze this estimate for a ${estimate.projectType} project named "${estimate.projectName}".
  Total Cost: ₹${estimate.totalCost.toLocaleString('en-IN')}
  Materials: ${estimate.materials.map(m => m.name).join(", ")}
  Labor Hours: ${estimate.labor.reduce((a, b) => a + b.hours, 0)}
  Provide 3 bullet points for cost optimization (considering GST and local sourcing) and 2 for competitive bidding strategy in the Indian market.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text;
};
