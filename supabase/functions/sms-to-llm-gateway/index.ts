import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getGeminiResponse } from "./utils/llm/gemini.ts";
import { sendSMS } from "./utils/sms/send.ts";
import { saveConversation } from "./utils/db/conversations.ts";
import { validateRequest } from "./utils/validation/validateRequest.ts";
import { getContext } from "./utils/llm/getContext.ts";

Deno.serve(async (req) => {
  console.info('Processing new request');
  
  const result = await validateRequest(req);
  if (result instanceof Response) return result;

  const { message, phoneNumber } = result.payload;
  const AI_NUMBER_1 = Deno.env.get("AI_NUMBER_1");
  const AI_NUMBER_2 = Deno.env.get("AI_NUMBER_2");

  if (phoneNumber === `${AI_NUMBER_1}` || phoneNumber === `${AI_NUMBER_2}`) {
    return new Response('You AI number is not allowed to text!', { status: 400 });
  }
  try {
    const context = await getContext(phoneNumber);
    const geminiResponse = await getGeminiResponse(message, context);

    let authUrl;
    if (phoneNumber.startsWith("+25078") || phoneNumber.startsWith("+25079")) {
      authUrl = `Basic ${btoa(`${Deno.env.get("SMS_GATEWAY_PUBLIC_USER_2")}:${Deno.env.get("SMS_GATEWAY_PUBLIC_PASSWORD_2")}`)}`
    } else {
      authUrl = `Basic ${btoa(`${Deno.env.get("SMS_GATEWAY_PUBLIC_USER_1")}:${Deno.env.get("SMS_GATEWAY_PUBLIC_PASSWORD_1")}`)}`
    }

    await sendSMS(phoneNumber, geminiResponse, authUrl);
    
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
