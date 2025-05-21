import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenAI } from "npm:@google/genai";
import { saveConversation } from "./utils/db.ts";

console.info('SMS Webhook with Gemini SDK server started');
const geminiClient = new GoogleGenAI({
  apiKey: Deno.env.get('GEMINI_API_KEY') // Replace with your actual Gemini API key
});

const SYSTEM_PROMPT = `
You are a helpful AI assistant accessible via SMS. Follow these rules strictly:
1. Keep responses under 420 characters (3 SMS messages max)
2. Use plain text only - no markdown or formatting
3. Be helpful and casual in tone
4. If the response would exceed 420 characters, prioritize the most important information
5. Avoid using links, instead try to provide the information of the linked content in a concise manner
`;

async function validateRequest(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const payload = await req.json();
    if (payload.event !== 'sms:received') {
      return new Response('Invalid event type', { status: 400 });
    }
    return payload;
  } catch (error) {
    return new Response('Invalid JSON payload', { status: 400 });
  }
}

async function getGeminiResponse(message: string) {
  const prompt = `${SYSTEM_PROMPT}\n\nUser message: ${message}`;
  const response = await geminiClient.models.generateContent({
    model: 'gemini-2.0-flash-001',
    contents: prompt
  });
  return response.text;
}

async function sendSMS(phoneNumber: string, message: string) {
  const response = await fetch('https://api.sms-gate.app/3rdparty/v1/message', {
    method: 'POST',
    headers: {
      'Accept': '*/*',
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(`${Deno.env.get("SMS_GATEWAY_PUBLIC_USER")}:${Deno.env.get("SMS_GATEWAY_PUBLIC_PASSWORD")}`)}`
    },
    body: JSON.stringify({
      message,
      phoneNumbers: [phoneNumber]
    })
  });

  if (!response.ok) {
    throw new Error(`SMS sending failed: ${response.statusText}`);
  }

  return response.text();
}

Deno.serve(async (req) => {
  console.info('Processing new request');
  
  const payload = await validateRequest(req);
  if (payload instanceof Response) return payload;

  const { message, phoneNumber } = payload.payload;
  
  if (!phoneNumber.startsWith('+250')) {
    return new Response('Only Rwandan phone numbers are supported', { status: 400 });
  }

  try {
    const geminiResponse = await getGeminiResponse(message);
    await sendSMS(phoneNumber, geminiResponse);
    
    try {
      await saveConversation(phoneNumber, message, geminiResponse, 'en');
    } catch (dbError) {
      console.error('Failed to save conversation:', dbError);
    }

    return new Response(JSON.stringify({
      status: 'success',
      message: 'SMS sent successfully',
      geminiResponse
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response('Internal server error', { status: 500 });
  }
});

