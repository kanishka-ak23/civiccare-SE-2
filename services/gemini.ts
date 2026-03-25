import { GoogleGenAI, Type } from "@google/genai";
import { IssueCategory, Location } from "../types";

export async function analyzeIssuePriority(
  category: IssueCategory,
  description: string,
  location: Location,
  hasImage: boolean = false
) {
  try {
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== "undefined" && process.env?.API_KEY);

    if (!apiKey || apiKey === "PLACEHOLDER_API_KEY") {
      throw new Error("Missing or placeholder API Key");
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Analyze this civic issue report and assign a priority score from 0 to 100.
      Category: ${category}
      Description: ${description}
      Address: ${location.address || 'Unknown'}
      Has Image Evidence: ${hasImage ? 'Yes' : 'No'}
      
      Guidelines:
      - High scores (80-100): Immediate life safety risks (e.g., open drainage near school, massive potholes on highway).
      - Medium scores (40-79): Significant inconvenience or moderate danger.
      - Low scores (0-39): Aesthetic or minor issues.
      - Boost the score if image evidence is provided, as it increases legitimacy.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Priority score from 0 to 100" },
            reasoning: { type: Type.STRING, description: "Brief explanation of the priority score" },
            detectedSensitiveLocation: { type: Type.BOOLEAN, description: "True if the issue is near a critical area" }
          },
          required: ["score", "reasoning", "detectedSensitiveLocation"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    // LOCAL LOGIC-BASED ALGORITHM (Fallback)
    console.log("Using Local AI Simulator for Scoring...");
    let score = 20; // base score
    let reasoning = "Standard priority case.";
    let detectedSensitiveLocation = false;

    const desc = description.toLowerCase();
    const address = (location.address || "").toLowerCase();

    // Category Based Base-Score
    if (category === IssueCategory.DRAINAGE || category === IssueCategory.WATER_LEAK) score += 20;
    if (category === IssueCategory.POTHOLES || category === IssueCategory.STREETLIGHTS) score += 30;

    // Image Evidence
    if (hasImage) {
      score += 15;
      reasoning = "Image evidence provided, increasing case legitimacy.";
    }

    // Keyword analysis
    if (desc.includes("severe") || desc.includes("huge") || desc.includes("massive") || desc.includes("dangerous")) {
      score += 15;
      reasoning = "High severity detected by keywords in description.";
    }

    if (desc.includes("school") || desc.includes("hospital") || address.includes("school") || address.includes("hospital")) {
      score += 25;
      reasoning = "Critical priority: Issue located near a highly sensitive area (school/hospital).";
      detectedSensitiveLocation = true;
    } else if (desc.includes("traffic") || address.includes("highway") || address.includes("main road")) {
      score += 15;
      reasoning = "High priority: Issue is affecting a high-traffic area.";
    }

    // Safety checks
    if (desc.includes("accident") || desc.includes("fell") || desc.includes("injury")) {
      score += 35;
      reasoning = "URGENT: Reports of injury or accidents associated with this complaint.";
    }

    score = Math.min(100, Math.max(0, score));

    if (score < 40 && reasoning === "Standard priority case.") {
      reasoning = "Low concern issue: Expected to be resolved during routine maintenance.";
    } else if (score >= 40 && score < 75 && reasoning === "Standard priority case.") {
      reasoning = "Moderate issue requiring attention within the coming week.";
    }

    return {
      score,
      reasoning,
      detectedSensitiveLocation
    };
  }
}
