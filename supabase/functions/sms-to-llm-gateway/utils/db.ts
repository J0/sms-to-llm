import { createClient } from 'jsr:@supabase/supabase-js@2'
import { Database } from '../../../types.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

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