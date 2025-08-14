-- Add missing columns to users table for CSV template compatibility
ALTER TABLE users ADD COLUMN IF NOT EXISTS code VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS church VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Update questions table for CSV template compatibility
ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_text_en TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create index for user code
CREATE INDEX IF NOT EXISTS idx_users_code ON users(code);
CREATE INDEX IF NOT EXISTS idx_users_category ON users(category);
</sql>
