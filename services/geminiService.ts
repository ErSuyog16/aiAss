import { GoogleGenAI } from "@google/genai";

// Fix: Use process.env.API_KEY as per the guidelines to fix the TypeScript error and adhere to requirements.
// The API key must be obtained exclusively from the environment variable `process.env.API_KEY`.
// Assume this variable is pre-configured, valid, and accessible.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// Helper to convert data URL to blob
function dataURLtoFile(dataurl: string, filename: string) {
    const arr = dataurl.split(',');
    if (arr.length < 2) {
        throw new Error("Invalid data URL");
    }
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error("Could not find MIME type in data URL");
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const runQuery = async (prompt: string, image?: string): Promise<string> => {
  // Fix: Removed API key check as per guidelines.
  // The guidelines state to assume the API key is pre-configured and valid.
  try {
    if (image) {
      const imageFile = dataURLtoFile(image, 'query-image');
      const imagePart = await fileToGenerativePart(imageFile);
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }, imagePart] }
      });

      return response.text;
    } else {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      return response.text;
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        return `An error occurred: ${error.message}`;
    }
    return "An unknown error occurred while contacting the AI model.";
  }
};
