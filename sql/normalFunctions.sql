CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_result json;
  v_today_daily_word_id text;
  v_cleanup_result json;
BEGIN
  SELECT cleanup_old_game_data(1) INTO v_cleanup_result;

  SELECT id INTO v_today_daily_word_id
  FROM daily_words
  WHERE date = CURRENT_DATE;

  IF v_today_daily_word_id IS NULL THEN
    RETURN json_build_object(
      'success', true,
      'leaderboard', '[]'::json,
      'message', 'No daily word found for today'
    );
  END IF;

  SELECT json_build_object(
    'success', true,
    'leaderboard', COALESCE(json_agg(
      json_build_object(
        'id', subquery.id,
        'username', subquery.username,
        'displayName', subquery.displayName,
        'avatar', subquery.avatar,
        'email', subquery.email,
        'emailVerified', subquery.emailVerified,
        'lastActiveAt', subquery.lastActiveAt,
        'score', subquery.score,
        'guesses', subquery.guesses,
        'duration', subquery.duration,
        'won', subquery.won,
        'createdAt', subquery.createdAt
      ) ORDER BY subquery.score DESC
    ), '[]'::json)
  ) INTO v_result
  FROM (
    SELECT 
      u.id,
      u.username,
      u.displayName,
      u.avatar,
      u.email,
      u.emailVerified,
      u.lastActiveAt,
      CASE 
        WHEN l.won THEN (7 - l.guesses_count) * 1000 + (300 - LEAST(l.duration_seconds, 300))
        ELSE 0
      END as score,
      l.guesses_count as guesses,
      l.duration_seconds as duration,
      l.won,
      l.createdAt
    FROM leaderboard l
    JOIN users u ON l.user_id = u.id
    WHERE l.won = true
      AND l.daily_word_id = v_today_daily_word_id
    ORDER BY CASE 
        WHEN l.won THEN (7 - l.guesses_count) * 1000 + (300 - LEAST(l.duration_seconds, 300))
        ELSE 0
      END DESC
    LIMIT p_limit
    OFFSET p_offset
  ) subquery;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Failed to fetch leaderboard: ' || SQLERRM
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_game_data(
  p_days_to_keep integer DEFAULT 1
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_deleted_leaderboard_count integer;
  v_deleted_daily_words_count integer;
  v_cutoff_date date;
BEGIN
  v_cutoff_date := CURRENT_DATE - INTERVAL '1 day' * p_days_to_keep;

  DELETE FROM leaderboard 
  WHERE DATE(createdAt) < v_cutoff_date;
  
  GET DIAGNOSTICS v_deleted_leaderboard_count = ROW_COUNT;

  DELETE FROM daily_words 
  WHERE date < v_cutoff_date;
  
  GET DIAGNOSTICS v_deleted_daily_words_count = ROW_COUNT;

  RETURN json_build_object(
    'success', true,
    'deleted_leaderboard_entries', v_deleted_leaderboard_count,
    'deleted_daily_words', v_deleted_daily_words_count,
    'days_kept', p_days_to_keep,
    'cutoff_date', v_cutoff_date
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to cleanup old data: ' || SQLERRM
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_daily_word()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_today_word RECORD;
  v_random_word RECORD;
  v_daily_word_id text;
  v_cleanup_result json;
  v_result json;
BEGIN
  SELECT * INTO v_today_word 
  FROM daily_words 
  WHERE date = CURRENT_DATE;

  IF FOUND THEN
    RETURN json_build_object(
      'success', true,
      'word', v_today_word.word,
      'daily_word_id', v_today_word.id,
      'date', v_today_word.date,
      'is_new', false
    );
  ELSE
    SELECT cleanup_old_game_data(1) INTO v_cleanup_result;
    
    SELECT * INTO v_random_word 
    FROM word_list 
    ORDER BY RANDOM() 
    LIMIT 1;

    IF NOT FOUND THEN
      RETURN json_build_object(
        'success', false,
        'error', 'No words available in word_list table'
      );
    END IF;

    INSERT INTO daily_words (word, date, word_id)
    VALUES (v_random_word.word, CURRENT_DATE, v_random_word.id)
    ON CONFLICT (date) DO NOTHING
    RETURNING id INTO v_daily_word_id;

    IF v_daily_word_id IS NULL THEN
      SELECT * INTO v_today_word 
      FROM daily_words 
      WHERE date = CURRENT_DATE;
      
      RETURN json_build_object(
        'success', true,
        'word', v_today_word.word,
        'daily_word_id', v_today_word.id,
        'date', v_today_word.date,
        'is_new', false,
        'note', 'Word already existed due to concurrent creation'
      );
    END IF;

    RETURN json_build_object(
      'success', true,
      'word', v_random_word.word,
      'daily_word_id', v_daily_word_id,
      'date', CURRENT_DATE,
      'is_new', true,
      'cleanup_performed', v_cleanup_result
    );
  END IF;

EXCEPTION
  WHEN unique_violation THEN
    SELECT * INTO v_today_word 
    FROM daily_words 
    WHERE date = CURRENT_DATE;
    
    IF FOUND THEN
      RETURN json_build_object(
        'success', true,
        'word', v_today_word.word,
        'daily_word_id', v_today_word.id,
        'date', v_today_word.date,
        'is_new', false,
        'note', 'Retrieved existing daily word after conflict'
      );
    ELSE
      RETURN json_build_object(
        'success', false,
        'error', 'Unique constraint violation but no daily word found'
      );
    END IF;
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to get daily word: ' || SQLERRM
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.submit_to_leaderboard(
  p_user_id text,
  p_daily_word_id text,
  p_guesses_count integer,
  p_duration_seconds integer,
  p_won boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_existing_record RECORD;
  v_new_score integer;
  v_existing_score integer;
  v_result json;
BEGIN
  IF p_user_id IS NULL OR p_daily_word_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'user_id and daily_word_id are required'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found with id: ' || p_user_id
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM daily_words WHERE id = p_daily_word_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Daily word not found with id: ' || p_daily_word_id
    );
  END IF;

  IF p_guesses_count < 1 OR p_guesses_count > 6 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'guesses_count must be between 1 and 6'
    );
  END IF;

  IF p_duration_seconds < 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'duration_seconds must be non-negative'
    );
  END IF;

  IF NOT p_won THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Game not won - no score recorded',
      'score', 0,
      'is_new_record', false
    );
  END IF;

  v_new_score := (7 - p_guesses_count) * 1000 + (300 - LEAST(p_duration_seconds, 300));

  SELECT * INTO v_existing_record
  FROM leaderboard
  WHERE user_id = p_user_id AND daily_word_id = p_daily_word_id;

  IF FOUND THEN
    v_existing_score := (7 - v_existing_record.guesses_count) * 1000 + (300 - LEAST(v_existing_record.duration_seconds, 300));
    
    RETURN json_build_object(
      'success', true,
      'message', 'You have already completed this daily word',
      'score', v_existing_score,
      'attempted_score', v_new_score,
      'is_new_record', false,
      'already_completed', true
    );
  ELSE
    INSERT INTO leaderboard (user_id, daily_word_id, guesses_count, duration_seconds, won)
    VALUES (p_user_id, p_daily_word_id, p_guesses_count, p_duration_seconds, p_won);

    RETURN json_build_object(
      'success', true,
      'message', 'Score submitted successfully',
      'score', v_new_score,
      'is_new_record', true
    );
  END IF;

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Duplicate submission detected'
    );
  WHEN foreign_key_violation THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid user_id or daily_word_id'
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to submit score: ' || SQLERRM
    );
END;
$function$;