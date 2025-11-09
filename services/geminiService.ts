
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("Gemini API key is not set. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

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
  if (!API_KEY) {
    return "Error: Gemini API key is not configured. Please contact the administrator.";
  }
  
  // Fix: The following is a deprecated way of calling the Gemini API.
  // const model = ai.models['gemini-2.5-flash'];
  
  try {
    if (image) {
      const imageFile = dataURLtoFile(image, 'query-image');
      const imagePart = await fileToGenerativePart(imageFile);
      
      // Fix: Use ai.models.generateContent and pass the model name directly
      // as per the latest SDK guidelines.
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }, imagePart] }
      });

      return response.text;
    } else {
      // Fix: Use ai.models.generateContent and pass the model name directly
      // as per the latest SDK guidelines.
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
