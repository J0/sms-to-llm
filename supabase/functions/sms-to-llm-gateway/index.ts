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
    geminiResponse = await geminiClient.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: payload.text
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

