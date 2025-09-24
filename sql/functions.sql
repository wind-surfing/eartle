CREATE OR REPLACE FUNCTION public.create_user_account(
  p_email text, 
  p_password text, 
  p_username text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
  v_result JSON;
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
    RETURN json_build_object('success', false, 'error', 'Email already registered');
  END IF;

  IF EXISTS (SELECT 1 FROM users WHERE username = p_username) THEN
    RETURN json_build_object('success', false, 'error', 'Username already taken');
  END IF;

  INSERT INTO users (email, username, password_hash, emailVerificationToken)
  VALUES (p_email, p_username, crypt(p_password, gen_salt('bf')), encode(gen_random_bytes(3), 'hex'))
  RETURNING id INTO v_user_id;

  SELECT json_build_object(
    'success', true,
    'user', json_build_object(
      'id', u.id,
      'email', u.email,
      'username', u.username,
      'displayName', u.displayName,
      'avatar', u.avatar,
      'emailVerified', u.emailVerified,
      'lastActiveAt', u.lastActiveAt
    ),
    'verification_code', (SELECT emailVerificationToken FROM users WHERE id = v_user_id)
  ) INTO v_result
  FROM users u WHERE u.id = v_user_id;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Failed to create user account');
END;
$function$;

CREATE OR REPLACE FUNCTION public.authenticate_user(
  p_identifier text,
  p_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user RECORD;
  v_result JSON;
BEGIN
  SELECT * INTO v_user FROM users WHERE email = p_identifier OR username = p_identifier;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid email/username or password');
  END IF;

  IF v_user.password_hash != crypt(p_password, v_user.password_hash) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid email/username or password');
  END IF;

  IF NOT v_user.emailVerified THEN
    RETURN json_build_object('success', false, 'requires_verification', true, 'error', 'Please verify your email before signing in');
  END IF;

  UPDATE users SET lastActiveAt = now() WHERE id = v_user.id;

  SELECT json_build_object(
    'success', true,
    'user', json_build_object(
      'id', u.id,
      'email', u.email,
      'username', u.username,
      'displayName', u.displayName,
      'avatar', u.avatar,
      'emailVerified', u.emailVerified,
      'lastActiveAt', u.lastActiveAt
    )
  ) INTO v_result
  FROM users u WHERE u.id = v_user.id;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Authentication service error');
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_by_id(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user RECORD;
BEGIN
  SELECT * INTO v_user FROM users WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'username', v_user.username,
      'displayName', v_user.displayName,
      'avatar', v_user.avatar,
      'emailVerified', v_user.emailVerified,
      'createdAt', v_user.createdAt,
      'updatedAt', v_user.updatedAt,
      'lastActiveAt', v_user.lastActiveAt
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Database error');
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_profile(
  p_user_id uuid,
  p_username text, 
  p_displayName text, 
  p_avatar text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE users SET
    username = p_username,
    displayName = p_displayName,
    avatar = p_avatar,
    updatedAt = now()
  WHERE id = p_user_id;

  RETURN json_build_object('success', true, 'message', 'Profile updated successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Failed to update profile');
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_user_email(
  p_identifier text,
  p_verification_code text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user RECORD;
BEGIN
  SELECT * INTO v_user FROM users 
  WHERE (email = p_identifier OR username = p_identifier)
    AND emailVerificationToken = p_verification_code;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid verification code');
  END IF;

  UPDATE users SET emailVerified = true, emailVerificationToken = NULL, updatedAt = now()
  WHERE id = v_user.id;

  RETURN json_build_object('success', true, 'message', 'Email verified successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Verification failed');
END;
$function$;

CREATE OR REPLACE FUNCTION public.resend_verification_code(
  p_identifier text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user RECORD;
  v_new_code text;
BEGIN
  SELECT * INTO v_user FROM users 
  WHERE (email = p_identifier OR username = p_identifier)
    AND emailVerified = false;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found or already verified');
  END IF;

  v_new_code := encode(gen_random_bytes(3), 'hex');
  
  UPDATE users SET 
    emailVerificationToken = v_new_code,
    updatedAt = now()
  WHERE id = v_user.id;

  RETURN json_build_object(
    'success', true, 
    'message', 'Verification code sent',
    'verification_code', v_new_code
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Failed to resend verification code');
END;
$function$;

CREATE OR REPLACE FUNCTION public.debug_user_table_structure()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_columns json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'column_name', column_name,
      'data_type', data_type,
      'is_nullable', is_nullable
    )
  ) INTO v_columns
  FROM information_schema.columns 
  WHERE table_name = 'users' AND table_schema = 'public';
  
  RETURN json_build_object(
    'success', true,
    'table_structure', v_columns
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_or_update_social_user(
  p_email text,
  p_name text,
  p_image text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id text;
  v_is_new_user BOOLEAN := false;
  v_username text;
  v_base_username text;
  v_counter integer := 0;
  v_user RECORD;
BEGIN
  SELECT * INTO v_user FROM users WHERE email = p_email;

  IF NOT FOUND THEN
    v_base_username := LOWER(REPLACE(p_name, ' ', '_'));
    v_username := v_base_username;
    
    WHILE EXISTS (SELECT 1 FROM users WHERE star_name = v_username) LOOP
      v_counter := v_counter + 1;
      v_username := v_base_username || '_' || v_counter::text;
    END LOOP;
    
    INSERT INTO users (email, star_name, display_name, avatar, stardust, level, total_bytes_completed, current_streak, longest_streak, is_premium)
    VALUES (p_email, v_username, p_name, p_image, 50, 1, 0, 0, 0, false)
    RETURNING id INTO v_user_id;
    
    SELECT * INTO v_user FROM users WHERE id = v_user_id;
    v_is_new_user := true;
  ELSE
    UPDATE users SET 
      display_name = COALESCE(p_name, display_name),
      avatar = COALESCE(p_image, avatar)
    WHERE id = v_user.id;
    
    v_user_id := v_user.id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'is_new_user', v_is_new_user,
    'user', json_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'username', v_user.star_name,
      'displayName', v_user.display_name,
      'avatar', v_user.avatar,
      'emailVerified', true,
      'createdAt', COALESCE(v_user.created_at, now()),
      'updatedAt', COALESCE(v_user.updated_at, now()),
      'lastActiveAt', now()
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in create_or_update_social_user: %', SQLERRM;
    RETURN json_build_object('success', false, 'error', 'Failed to create/update user: ' || SQLERRM);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_today_word()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_word RECORD;
  v_selected_word RECORD;
  v_word_count integer;
BEGIN
  SELECT * INTO v_word FROM daily_words WHERE date = CURRENT_DATE;
  
  IF NOT FOUND THEN
    SELECT COUNT(*) INTO v_word_count FROM word_list;
    
    SELECT * INTO v_selected_word 
    FROM word_list 
    ORDER BY id 
    OFFSET (abs(hashtext(CURRENT_DATE::text)) % v_word_count) 
    LIMIT 1;
    
    INSERT INTO daily_words (word, date, word_id)
    VALUES (v_selected_word.word, CURRENT_DATE, v_selected_word.id)
    RETURNING * INTO v_word;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'word_id', v_word.id,
    'date', v_word.date
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Failed to get today word');
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_valid_word(p_word text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (SELECT 1 FROM word_list WHERE word = UPPER(trim(p_word)));
END;
$function$;

CREATE OR REPLACE FUNCTION public.start_game_session(p_user_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_daily_word RECORD;
  v_session RECORD;
BEGIN
  SELECT * INTO v_daily_word FROM daily_words WHERE date = CURRENT_DATE;
  
  IF NOT FOUND THEN
    SELECT * INTO v_daily_word FROM (SELECT * FROM get_today_word()) AS result;
    SELECT * INTO v_daily_word FROM daily_words WHERE date = CURRENT_DATE;
  END IF;
  
  SELECT * INTO v_session FROM game_sessions 
  WHERE user_id = p_user_id AND daily_word_id = v_daily_word.id;
  
  IF NOT FOUND THEN
    INSERT INTO game_sessions (user_id, daily_word_id)
    VALUES (p_user_id, v_daily_word.id)
    RETURNING * INTO v_session;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'session', json_build_object(
      'id', v_session.id,
      'status', v_session.status,
      'attempts', v_session.attempts,
      'guesses_count', v_session.guesses_count,
      'start_time', v_session.start_time,
      'won', v_session.won
    ),
    'word_length', 5
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Failed to start game session');
END;
$function$;

CREATE OR REPLACE FUNCTION public.submit_guess(
  p_user_id text,
  p_guess text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_daily_word RECORD;
  v_session RECORD;
  v_result jsonb;
  v_feedback jsonb := '[]'::jsonb;
  v_char text;
  v_target_char text;
  v_guess_upper text;
  v_target_upper text;
  v_i integer;
  v_duration integer;
  v_won boolean := false;
  v_status text;
BEGIN
  SELECT * INTO v_daily_word FROM daily_words WHERE date = CURRENT_DATE;
  
  SELECT * INTO v_session FROM game_sessions 
  WHERE user_id = p_user_id AND daily_word_id = v_daily_word.id;
  
  IF NOT FOUND OR v_session.status != 'in_progress' THEN
    RETURN json_build_object('success', false, 'error', 'No active game session');
  END IF;
  
  IF v_session.guesses_count >= 6 THEN
    RETURN json_build_object('success', false, 'error', 'Maximum guesses reached');
  END IF;
  
  v_guess_upper := UPPER(trim(p_guess));
  v_target_upper := UPPER(v_daily_word.word);
  
  IF length(v_guess_upper) != 5 THEN
    RETURN json_build_object('success', false, 'error', 'Guess must be 5 letters');
  END IF;
  
  IF NOT is_valid_word(v_guess_upper) THEN
    RETURN json_build_object('success', false, 'error', 'Not a valid word');
  END IF;
  
  FOR v_i IN 1..5 LOOP
    v_char := substring(v_guess_upper from v_i for 1);
    v_target_char := substring(v_target_upper from v_i for 1);
    
    IF v_char = v_target_char THEN
      v_feedback := v_feedback || jsonb_build_object('letter', v_char, 'status', 'correct');
    ELSIF position(v_char in v_target_upper) > 0 THEN
      v_feedback := v_feedback || jsonb_build_object('letter', v_char, 'status', 'present');
    ELSE
      v_feedback := v_feedback || jsonb_build_object('letter', v_char, 'status', 'absent');
    END IF;
  END LOOP;
  
  v_won := (v_guess_upper = v_target_upper);
  v_status := CASE 
    WHEN v_won THEN 'completed'
    WHEN v_session.guesses_count + 1 >= 6 THEN 'failed'
    ELSE 'in_progress'
  END;
  
  v_duration := CASE 
    WHEN v_status != 'in_progress' THEN EXTRACT(EPOCH FROM (now() - v_session.start_time))::integer
    ELSE NULL
  END;
  
  UPDATE game_sessions SET
    attempts = attempts || jsonb_build_object('guess', v_guess_upper, 'feedback', v_feedback),
    guesses_count = guesses_count + 1,
    status = v_status,
    won = v_won,
    end_time = CASE WHEN v_status != 'in_progress' THEN now() ELSE NULL END,
    duration_seconds = v_duration,
    updatedAt = now()
  WHERE id = v_session.id
  RETURNING * INTO v_session;
  
  IF v_status != 'in_progress' THEN
    INSERT INTO leaderboard (user_id, daily_word_id, guesses_count, duration_seconds, won)
    VALUES (p_user_id, v_daily_word.id, v_session.guesses_count, v_duration, v_won)
    ON CONFLICT (user_id, daily_word_id) DO NOTHING;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'feedback', v_feedback,
    'won', v_won,
    'game_over', v_status != 'in_progress',
    'guesses_count', v_session.guesses_count,
    'duration_seconds', v_duration,
    'target_word', CASE WHEN v_status != 'in_progress' THEN v_target_upper ELSE NULL END
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Failed to submit guess');
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_today_leaderboard()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_daily_word RECORD;
  v_leaderboard jsonb := '[]'::jsonb;
  v_entry RECORD;
BEGIN
  SELECT * INTO v_daily_word FROM daily_words WHERE date = CURRENT_DATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', true, 'leaderboard', '[]'::jsonb);
  END IF;
  
  FOR v_entry IN
    SELECT u.username, u.displayName, l.guesses_count, l.duration_seconds, l.score, l.createdAt
    FROM leaderboard l
    JOIN users u ON l.user_id = u.id
    WHERE l.daily_word_id = v_daily_word.id AND l.won = true
    ORDER BY l.score DESC, l.createdAt ASC
    LIMIT 50
  LOOP
    v_leaderboard := v_leaderboard || jsonb_build_object(
      'username', v_entry.username,
      'displayName', v_entry.displayName,
      'guesses', v_entry.guesses_count,
      'duration', v_entry.duration_seconds,
      'score', v_entry.score,
      'completed_at', v_entry.createdAt
    );
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'leaderboard', v_leaderboard,
    'date', v_daily_word.date
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Failed to get leaderboard');
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_by_username(
  p_username text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user RECORD;
BEGIN
  SELECT * INTO v_user FROM users WHERE username = p_username;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'username', v_user.username,
      'displayName', v_user.displayName,
      'avatar', v_user.avatar,
      'emailVerified', v_user.emailVerified,
      'createdAt', v_user.createdAt,
      'updatedAt', v_user.updatedAt,
      'lastActiveAt', v_user.lastActiveAt
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Database error');
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_username_unique(
  p_username text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE username = p_username) THEN
    RETURN json_build_object('success', false, 'message', 'Username is already taken');
  ELSE
    RETURN json_build_object('success', true, 'message', 'Username is available');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Error checking username');
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_public_profile(
  p_user_id uuid DEFAULT NULL,
  p_username text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user RECORD;
BEGIN
  IF p_user_id IS NOT NULL THEN
    SELECT * INTO v_user FROM users WHERE id = p_user_id;
  ELSIF p_username IS NOT NULL THEN
    SELECT * INTO v_user FROM users WHERE username = p_username;
  ELSE
    RETURN json_build_object('success', false, 'error', 'Either user_id or username must be provided');
  END IF;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', v_user.id,
      'username', v_user.username,
      'displayName', v_user.displayName,
      'avatar', v_user.avatar,
      'createdAt', v_user.createdAt
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Error fetching profile');
END;
$function$;
