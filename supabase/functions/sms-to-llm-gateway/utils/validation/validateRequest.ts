/**
 * Validates and verifies the incoming webhook request for SMS Gateway.
 * Performs HMAC signature check, timestamp validation, and JSON parsing.
 * Returns the parsed payload or a Response on error.
 */
export async function validateRequest(req: Request): Promise<any | Response> {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // --- HMAC signature verification ---
  const SIGNING_KEY = Deno.env.get("SMS_GATEWAY_SIGNING_KEY");
  if (!SIGNING_KEY) {
    return new Response('Server misconfiguration: missing signing key', { status: 500 });
  }

  const xSignature = req.headers.get('x-signature');
  const xTimestamp = req.headers.get('x-timestamp');
  if (!xSignature || !xTimestamp) {
    return new Response('Missing signature headers', { status: 401 });
  }

  // Read raw body as string
  const rawBody = new Uint8Array(await req.arrayBuffer());
  const decoder = new TextDecoder();
  const bodyString = decoder.decode(rawBody);
  // Concatenate as string, then encode
  const message = bodyString + xTimestamp;
  const encoder = new TextEncoder();
  const messageBytes = encoder.encode(message);

  // Compute HMAC-SHA256
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SIGNING_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, messageBytes);
  const sigArray = Array.from(new Uint8Array(sigBuffer));
  const computedSignature = sigArray.map(b => b.toString(16).padStart(2, '0')).join('');

  if (computedSignature !== xSignature.toLowerCase()) {
    return new Response('Invalid signature', { status: 401 });
  }

  // Optionally: check timestamp is recent (5 min window)
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(xTimestamp, 10);
  if (isNaN(ts) || Math.abs(now - ts) > 300) {
    return new Response('Invalid or expired timestamp', { status: 401 });
  }

  // Parse JSON body (already read raw, so re-parse from rawBody)
  try {
    const body = JSON.parse(bodyString);
    if (body.event !== 'sms:received') {
      return new Response('Invalid event type', { status: 400 });
    }
    return body;
  } catch (error) {
    return new Response('Invalid JSON payload', { status: 400 });
  }
}
