# SMS-to-LLM Gateway

A Supabase Edge Function that processes SMS messages and forwards them to Gemini API, designed for rural Rwanda.

## Development Setup

### Prerequisites

- Node.js 18+
- Supabase CLI
- Android SMS Gateway credentials
- Gemini API key

### Environment Variables

Create a `.env` file in the `supabase/functions/sms-to-llm-gateway` directory:

```env
GEMINI_API_KEY=your_gemini_api_key
SMS_GATEWAY_PUBLIC_USER=your_sms_gateway_username
SMS_GATEWAY_PUBLIC_PASSWORD=your_sms_gateway_password
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SMS_GATEWAY_SIGNING_KEY=your_payload_signing_key
```

### Database Setup

1. Start Supabase locally:
```bash
supabase start
```

2. Create the conversations table:
```bash
supabase db reset
```

The migrations will create the required `conversations` table with the necessary schema and indexes. Migrations should be placed in the `supabase/migrations` directory.

### Local Development

1. Install dependencies:
```bash
cd supabase/functions/sms-to-llm-gateway
npm install
```

2. Start the local development server:
```bash
supabase functions serve sms-to-llm-gateway --no-verify-jwt --env-file ./supabase/functions/sms-to-llm-gateway/.env
```

### Deployment

Deploy to Supabase:
```bash
supabase functions deploy sms-to-llm-gateway --no-verify-jwt
```

Note: The `--no-verify-jwt` flag is required because the Android SMS Gateway doesn't provide JWT tokens.

### Testing

The function can be tested locally using curl:

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/sms-to-llm-gateway' \
  --header 'Content-Type: application/json' \
  --data '{
    "event": "sms:received",
    "payload": {
      "phoneNumber": "+250788123456",
      "message": "Hello, how are you?"
    }
  }'
```

## Architecture

- SMS messages are received via Android SMS Gateway
- Messages are processed by Supabase Edge Function
- Responses are generated using Gemini API
- Conversations are stored in Supabase PostgreSQL
- Maximum response length is 420 characters (3 SMS messages)

## Error Handling

- Database errors are logged but don't block message delivery
- LLM errors return a user-friendly message
- Invalid phone numbers are rejected
- All errors are logged with context for debugging

## Monitoring

Check function logs in Supabase dashboard or using:
```bash
supabase functions logs sms-to-llm-gateway
``` 