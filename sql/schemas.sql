CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id text NOT NULL DEFAULT uuid_generate_v4(),
    email text NOT NULL,
    username text NOT NULL,
    displayName text,
    emailVerified boolean DEFAULT false,
    createdAt timestamp with time zone DEFAULT now(),
    updatedAt timestamp with time zone DEFAULT now(),
    avatar text,
    lastActiveAt timestamp with time zone DEFAULT now(),
    password_hash text NOT NULL,
    emailVerificationToken text,
    passwordResetToken text,
    passwordResetExpires timestamp with time zone,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_username_unique UNIQUE (username)
);

CREATE TABLE word_list (
    id serial PRIMARY KEY,
    word text NOT NULL,
    frequency integer DEFAULT 1,
    difficulty text DEFAULT 'medium',
    CONSTRAINT word_list_word_unique UNIQUE (word),
    CONSTRAINT word_list_word_length CHECK (length(word) = 5),
    CONSTRAINT word_list_difficulty_check CHECK (difficulty IN ('easy', 'medium', 'hard'))
);

CREATE TABLE daily_words (
    id text NOT NULL DEFAULT uuid_generate_v4(),
    word text NOT NULL,
    date date NOT NULL DEFAULT CURRENT_DATE,
    word_id integer,
    createdAt timestamp with time zone DEFAULT now(),
    CONSTRAINT daily_words_pkey PRIMARY KEY (id),
    CONSTRAINT daily_words_date_unique UNIQUE (date),
    CONSTRAINT daily_words_word_length CHECK (length(word) = 5),
    CONSTRAINT daily_words_word_id_fkey FOREIGN KEY (word_id) REFERENCES word_list(id)
);

CREATE TABLE game_sessions (
    id text NOT NULL DEFAULT uuid_generate_v4(),
    user_id text NOT NULL,
    daily_word_id text NOT NULL,
    status text NOT NULL DEFAULT 'in_progress',
    attempts jsonb DEFAULT '[]'::jsonb,
    guesses_count integer DEFAULT 0,
    start_time timestamp with time zone DEFAULT now(),
    end_time timestamp with time zone,
    duration_seconds integer,
    won boolean DEFAULT false,
    createdAt timestamp with time zone DEFAULT now(),
    updatedAt timestamp with time zone DEFAULT now(),
    CONSTRAINT game_sessions_pkey PRIMARY KEY (id),
    CONSTRAINT game_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT game_sessions_daily_word_id_fkey FOREIGN KEY (daily_word_id) REFERENCES daily_words(id) ON DELETE CASCADE,
    CONSTRAINT game_sessions_user_daily_word_unique UNIQUE (user_id, daily_word_id),
    CONSTRAINT game_sessions_status_check CHECK (status IN ('in_progress', 'completed', 'failed')),
    CONSTRAINT game_sessions_guesses_count_check CHECK (guesses_count >= 0 AND guesses_count <= 6)
);

CREATE TABLE leaderboard (
    id text NOT NULL DEFAULT uuid_generate_v4(),
    user_id text NOT NULL,
    daily_word_id text NOT NULL,
    guesses_count integer NOT NULL,
    duration_seconds integer NOT NULL,
    won boolean NOT NULL,
    score integer GENERATED ALWAYS AS (
        CASE 
            WHEN won THEN (7 - guesses_count) * 1000 + (300 - LEAST(duration_seconds, 300))
            ELSE 0
        END
    ) STORED,
    createdAt timestamp with time zone DEFAULT now(),
    CONSTRAINT leaderboard_pkey PRIMARY KEY (id),
    CONSTRAINT leaderboard_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT leaderboard_daily_word_id_fkey FOREIGN KEY (daily_word_id) REFERENCES daily_words(id) ON DELETE CASCADE,
    CONSTRAINT leaderboard_user_daily_word_unique UNIQUE (user_id, daily_word_id)
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_policy" ON users FOR SELECT USING (id = current_setting('app.current_user_id', true));
CREATE POLICY "users_insert_policy" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update_policy" ON users FOR UPDATE USING (id = current_setting('app.current_user_id', true));
CREATE POLICY "users_delete_policy" ON users FOR DELETE USING (id = current_setting('app.current_user_id', true));

CREATE POLICY "word_list_select_policy" ON word_list FOR SELECT USING (true);
CREATE POLICY "daily_words_select_policy" ON daily_words FOR SELECT USING (true);

CREATE POLICY "game_sessions_select_policy" ON game_sessions FOR SELECT USING (user_id = current_setting('app.current_user_id', true));
CREATE POLICY "game_sessions_insert_policy" ON game_sessions FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true));
CREATE POLICY "game_sessions_update_policy" ON game_sessions FOR UPDATE USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "leaderboard_select_policy" ON leaderboard FOR SELECT USING (true);
CREATE POLICY "leaderboard_insert_policy" ON leaderboard FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_emailVerified ON users (emailVerified);
CREATE INDEX idx_users_createdAt ON users (createdAt);
CREATE INDEX idx_word_list_difficulty ON word_list (difficulty);
CREATE INDEX idx_word_list_frequency ON word_list (frequency);
CREATE INDEX idx_daily_words_date ON daily_words (date);
CREATE INDEX idx_game_sessions_user_id ON game_sessions (user_id);
CREATE INDEX idx_game_sessions_daily_word_id ON game_sessions (daily_word_id);
CREATE INDEX idx_game_sessions_status ON game_sessions (status);
CREATE INDEX idx_leaderboard_daily_word_id ON leaderboard (daily_word_id);
CREATE INDEX idx_leaderboard_score ON leaderboard (score DESC);
CREATE INDEX idx_leaderboard_user_id ON leaderboard (user_id);