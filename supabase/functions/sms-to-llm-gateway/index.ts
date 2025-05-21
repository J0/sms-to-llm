import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenAI } from "npm:@google/genai";
console.info('SMS Webhook with Gemini SDK server started');
const geminiClient = new GoogleGenAI({
  apiKey: Deno.env.get('GEMINI_API_KEY') // Replace with your actual Gemini API key
});
Deno.serve(async (req)=>{
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405
    });
  }
  const payload = await req.json();
  // Call Gemini API with the text from the request
  let geminiResponse;
  try {
    const systemPrompt = `You are a helpful AI assistant accessible via SMS in Rwanda. Follow these rules strictly:
1. Keep responses under 420 characters (3 SMS messages max)
2. Use plain text only - no markdown or formatting
3. Be helpful and casual in tone
4. Respond in the same language as the user's message (Kinyarwanda, French, or English)
5. If the response would exceed 420 characters, prioritize the most important information`;

    const prompt = `${systemPrompt}\n\nUser message: ${payload.text}`;

    geminiResponse = await geminiClient.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt
    });
    console.log(geminiResponse.text);
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return new Response('Failed to call Gemini API', {
      status: 500
    });
  }
  const responseText = geminiResponse.text; // Adjust based on the actual response structure from Gemini
  // Prepare SMS data to send via Pindo API
  const smsData = {
    to: payload.from,
    text: responseText,
    sender: "PindoTest"
  };
  // Send SMS using Pindo API
  const smsResponse = await fetch('https://api.pindo.io/v1/sms/', {
    method: 'POST',
    headers: {
      'Accept': '*/*',
      'Authorization': `Bearer ${Deno.env.get("PINDO_API_KEY")}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(smsData)
  });
  if (smsResponse.ok) {
    return new Response('Received', {
      status: 200
    });
  } else {
    return new Response('Failed to send SMS', {
      status: 500
    });
  }
});

