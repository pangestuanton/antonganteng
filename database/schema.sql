-- ============================================================
-- Antoniqueee AI - PostgreSQL Schema
-- (Alternative to MongoDB - use if you prefer SQL)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255),
    google_id       VARCHAR(255) UNIQUE,
    avatar          TEXT,
    is_verified     BOOLEAN DEFAULT FALSE,
    role            VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    last_seen       TIMESTAMP DEFAULT NOW(),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);

-- ─── User Settings ────────────────────────────────────────────────────────────
CREATE TABLE settings (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme           VARCHAR(20) DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'auto')),
    notifications   BOOLEAN DEFAULT TRUE,
    language        VARCHAR(10) DEFAULT 'en',
    font_size       VARCHAR(20) DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ─── Sessions ─────────────────────────────────────────────────────────────────
CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      VARCHAR(255) UNIQUE NOT NULL,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(200) DEFAULT 'New Chat',
    model           VARCHAR(100) DEFAULT 'gemini-1.5-flash',
    total_messages  INTEGER DEFAULT 0,
    total_tokens    INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    start_time      TIMESTAMP DEFAULT NOW(),
    end_time        TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_session_id ON sessions(session_id);

-- ─── Messages ─────────────────────────────────────────────────────────────────
CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      VARCHAR(255) NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender          VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
    content         TEXT NOT NULL,
    model           VARCHAR(100) DEFAULT 'gemini-1.5-flash',
    tokens_prompt   INTEGER DEFAULT 0,
    tokens_completion INTEGER DEFAULT 0,
    tokens_total    INTEGER DEFAULT 0,
    is_streamed     BOOLEAN DEFAULT FALSE,
    status          VARCHAR(20) DEFAULT 'complete' CHECK (status IN ('pending', 'complete', 'error')),
    timestamp       TIMESTAMP DEFAULT NOW(),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);

-- ─── Auto-update timestamps ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
