import { GoogleGenAI } from "@google/genai";
import fs from 'fs/promises';
import path from 'path';

const ai = new GoogleGenAI({});

export default async function AI(req, res) {
  try {
    // Read system prompt from prompt.txt
    const promptPath = path.resolve('src/AI/prompt.txt');
    const systemPrompt = await fs.readFile(promptPath, 'utf-8');

    const userContent = req.body?.content || "Hello, how can I assist you today?";
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: `${systemPrompt}\n\n${userContent}` }] }
      ]
    });

    res.status(200).json({ text: response.text });
    console.log(response.text);
  } catch (error) {
    console.error("Error in AI function:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
