-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL,
    message_content TEXT NOT NULL,
    response_content TEXT,
    language TEXT NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on phone_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_conversations_phone_number ON conversations(phone_number);

-- Create index on created_at for efficient time-based queries
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow insert from authenticated users
CREATE POLICY "Allow insert from authenticated users" ON conversations
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Create policy to allow select from authenticated users
CREATE POLICY "Allow select from authenticated users" ON conversations
    FOR SELECT TO authenticated
    USING (true);

-- Create policy to allow update from authenticated users
CREATE POLICY "Allow update from authenticated users" ON conversations
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true); 