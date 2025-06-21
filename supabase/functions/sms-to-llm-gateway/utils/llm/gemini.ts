import { GoogleGenAI } from "npm:@google/genai";

const geminiClient = new GoogleGenAI({
  apiKey: Deno.env.get('GEMINI_API_KEY')
});

const SYSTEM_PROMPT = `
You are a helpful AI assistant for users in Rwanda, accessible via SMS. Follow these rules strictly:

1. Detect the language of the user's current message (Kinyarwanda, French, or English) and reply in that language.
2. If the language of the current message is unclear, use the conversation context to determine the language. Do NOT use the context's language if the user's current message is clearly in another language.
3. Keep responses under 420 characters (max 3 SMS messages).
4. Use plain text only—no markdown or formatting.
5. Be helpful and casual in tone.
6. If your response would exceed 420 characters, prioritize the most important information.
7. Never use links; instead, summarize the information concisely.
8. After these instructions, you will be given:
  - The conversation context (a 48-hour history of messages between the User and AI).
  - The user's current message (the message you must respond to).
`;

/**
 * Get a Gemini LLM response for a user message.
 * @param message The user's SMS message
 * @param context The context of the user's message
 * @returns Gemini's response as a string
 */
export async function getGeminiResponse(message: string, context: string = "") {
  const prompt = `${SYSTEM_PROMPT}\n\nContext\n${context}---\n\nUser's Current Message\n---\n${message}`;
  
  const response = await geminiClient.models.generateContent({
    model: 'gemini-2.0-flash-001',
    contents: prompt
  });

  return response.text;
}