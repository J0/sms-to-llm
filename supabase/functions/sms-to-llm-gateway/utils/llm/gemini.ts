import { GoogleGenAI } from "npm:@google/genai";

const geminiClient = new GoogleGenAI({
  apiKey: Deno.env.get('GEMINI_API_KEY')
});

const SYSTEM_PROMPT = `
You are a helpful AI assistant accessible via SMS. Follow these rules strictly:
1. Keep responses under 420 characters (3 SMS messages max)
2. Use plain text only - no markdown or formatting
3. Be helpful and casual in tone
4. If the response would exceed 420 characters, prioritize the most important information
5. Avoid using links, instead try to provide the information of the linked content in a concise manner
`;

/**
 * Get a Gemini LLM response for a user message.
 * @param message The user's SMS message
 * @returns Gemini's response as a string
 */
export async function getGeminiResponse(message: string) {
  const prompt = `${SYSTEM_PROMPT}\n\nUser message: ${message}`;
  const response = await geminiClient.models.generateContent({
    model: 'gemini-2.0-flash-001',
    contents: prompt
  });
  return response.text;
}
