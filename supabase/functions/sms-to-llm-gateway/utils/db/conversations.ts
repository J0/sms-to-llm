import { supabase } from './client.ts';

/**
 * Save a conversation to the database.
 * @param phoneNumber The user's phone number
 * @param messageContent The incoming SMS message
 * @param responseContent The LLM's response
 * @param language The language code (default: 'en')
 */
export async function saveConversation(
    phoneNumber: string,
    messageContent: string,
    responseContent: string | null,
    language: string = 'en'
) {
    const { data, error } = await supabase
        .from('conversations')
        .insert({
            phone_number: phoneNumber,
            message_content: messageContent,
            response_content: responseContent,
            language
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving conversation:', error);
        throw error;
    }

    return data;
}

/**
 * Get recent conversations for a phone number within the last N hours.
 * @param phoneNumber The user's phone number
 * @param hours How many hours back to look (default: 48)
 */
export async function getRecentConversations(phoneNumber: string, hours: number = 48) {
    const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('phone_number', phoneNumber)
        .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching conversations:', error);
        throw error;
    }

    return data;
}
