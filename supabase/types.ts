export type Conversation = {
    id: string;
    phone_number: string;
    message_content: string;
    response_content: string | null;
    language: string;
    created_at: string;
    updated_at: string;
}

export type Database = {
    public: {
        Tables: {
            conversations: {
                Row: Conversation;
                Insert: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Conversation, 'id' | 'created_at' | 'updated_at'>>;
            };
        };
    };
}; 