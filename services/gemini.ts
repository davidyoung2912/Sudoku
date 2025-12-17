import { GoogleGenAI, Type } from "@google/genai";
import { SudokuData } from "../types";
import { carvePuzzle } from "./logic";

const API_KEY = process.env.API_KEY;

// Helper to ensure we get a valid JSON string even if the model chatters
const cleanJsonString = (str: string) => {
  const firstBrace = str.indexOf('{');
  const lastBrace = str.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    return str.substring(firstBrace, lastBrace + 1);
  }
  return str;
};

export const generateSudokuPuzzle = async (stars: number): Promise<SudokuData> => {
  // if (!API_KEY) {
  //   throw new Error("API Key not found");
  // }

  const ai = new GoogleGenAI({ apiKey: 'AIzaSyB4bJEo9i2T6tZrcfawdTmH_xNVjgE3scM' });

  // We ask the AI only for the SOLUTION (a valid filled grid).
  // We will then programmatically carve out holes to ensure:
  // 1. The starting board is a valid subset of the solution.
  // 2. The difficulty is controlled by the number of clues.
  // 3. The puzzle has a unique solution (verified by our logic).
  const prompt = `
    Generate a valid, completely filled 9x9 Sudoku solution grid.
    
    Return a JSON object with:
    "solution": 9x9 fully solved grid (array of arrays of integers 1-9).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for maximum speed
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            solution: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER }
              }
            }
          },
          required: ["solution"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(cleanJsonString(text)) as { solution: number[][] };
    
    // Basic validation
    if (!data.solution || data.solution.length !== 9 || data.solution[0].length !== 9) {
      throw new Error("Invalid grid returned from AI");
    }

    // Generate the initial puzzle state by removing numbers based on difficulty
    const initial = carvePuzzle(data.solution, stars);

    return {
      initial,
      solution: data.solution
    };

  } catch (error) {
    console.error("Error generating puzzle:", error);
    throw error;
  }
};
