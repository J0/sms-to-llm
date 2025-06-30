/**
 * Send an SMS message using the SMS Gateway API.
 * @param phoneNumber The recipient's phone number
 * @param message The message to send
 */
export async function sendSMS(phoneNumber: string, message: string, authUrl : string) {
  const response = await fetch('https://api.sms-gate.app/3rdparty/v1/message', {
    method: 'POST',
    headers: {
      'Accept': '*/*',
      'Content-Type': 'application/json',
      'Authorization': authUrl
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
