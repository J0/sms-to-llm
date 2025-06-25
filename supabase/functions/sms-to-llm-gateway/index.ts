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
  const CURRENT_NUMBER = Deno.env.get("CURRENT_NUMBER");

  if (phoneNumber === `${CURRENT_NUMBER}`) {
    return new Response('You cannot text yourself', { status: 400 });
  }

  if (!phoneNumber.startsWith('+250')) {
    return new Response('Only Rwandan phone numbers are supported', { status: 400 });
  }

  try {
    const context = await getContext(phoneNumber);
    const geminiResponse = await getGeminiResponse(message, context);
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
