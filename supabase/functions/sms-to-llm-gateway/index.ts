import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenAI } from "npm:@google/genai";
import { saveConversation } from "../sms-webhook/utils/db.ts";

console.info('SMS Webhook with Gemini SDK server started');
const geminiClient = new GoogleGenAI({
  apiKey: Deno.env.get('GEMINI_API_KEY') // Replace with your actual Gemini API key
});

Deno.serve(async (req)=>{
  console.info('Received request:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  if (req.method !== 'POST') {
    console.warn('Invalid method:', req.method);
    return new Response('Method Not Allowed', {
      status: 405
    });
  }

  let payload;
  try {
    payload = await req.json();
    console.info('Received payload:', payload);
  } catch (error) {
    console.error('Failed to parse request body:', error);
    return new Response('Invalid JSON payload', {
      status: 400
    });
  }
  
  if (payload.event !== 'sms:received') {
    console.warn('Invalid event type:', payload.event);
    return new Response('Invalid event type', {
      status: 400
    });
  }

  const { message, phoneNumber } = payload.payload;
  
  // Validate Rwandan phone number
  if (!phoneNumber.startsWith('+250')) {
    console.warn('Non-Rwandan phone number:', phoneNumber);
    return new Response('Only Rwandan phone numbers are supported', {
      status: 400
    });
  }

  console.info('Processing SMS:', { message, phoneNumber });
  
  // Call Gemini API with the text from the request
  let geminiResponse;
  try {
    const systemPrompt = `
    You are a helpful AI assistant accessible via SMS in Rwanda. Follow these rules strictly:
    1. Keep responses under 420 characters (3 SMS messages max)
    2. Use plain text only - no markdown or formatting
    3. Be helpful and casual in tone
    4. If the response would exceed 420 characters, prioritize the most important information
    `;

    const prompt = `${systemPrompt}\n\nUser message: ${message}`;
    console.info('Sending prompt to Gemini:', prompt);

    geminiResponse = await geminiClient.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt
    });
    console.info('Received Gemini response:', geminiResponse.text);
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return new Response('Failed to call Gemini API', {
      status: 500
    });
  }

  const responseText = geminiResponse.text;
  console.info('Preparing to send SMS response:', responseText);

  // Send SMS using Android forwarding app API
  try {
    const smsResponse = await fetch('https://api.sms-gate.app/3rdparty/v1/message', {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${Deno.env.get("SMS_GATEWAY_PUBLIC_USER")}:${Deno.env.get("SMS_GATEWAY_PUBLIC_PASSWORD")}`)}`
      },
      body: JSON.stringify({
        message: responseText,
        phoneNumbers: [phoneNumber]
      })
    });

    if (!smsResponse.ok) {
      const errorBody = await smsResponse.text();
      console.error('Failed to send SMS:', {
        status: smsResponse.status,
        statusText: smsResponse.statusText,
        errorBody
      });
      return new Response('Failed to send SMS', {
        status: 500
      });
    }

    const successBody = await smsResponse.text();
    console.info('SMS sent successfully:', successBody);

    // Only store the conversation if both LLM response and SMS sending were successful
    try {
      await saveConversation(phoneNumber, message, responseText, 'en');
      console.info('Successfully stored conversation in database');
    } catch (dbError) {
      console.error('Failed to save conversation:', dbError);
      // Don't return error response since the main functionality (SMS) was successful
    }

    return new Response(JSON.stringify({
      status: 'success',
      message: 'SMS sent successfully',
      geminiResponse: responseText
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    return new Response('Failed to send SMS', {
      status: 500
    });
  }
});

