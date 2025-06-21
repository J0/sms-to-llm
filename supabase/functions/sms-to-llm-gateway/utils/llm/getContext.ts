import { getRecentConversations } from "../db/conversations.ts";

/**
 * Get context of a user's request
 * @param messageContent The incoming SMS message
 */
export async function getContext(phoneNumber: string) {
    const recentConversations = await getRecentConversations(phoneNumber);
    
    return recentConversations
        .map(turn =>
            `---\nUSER\n${turn.message_content}\n---\nAI\n${turn.response_content}\n`
        )
        .join("");
}