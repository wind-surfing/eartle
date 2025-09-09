CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updatedAt = now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_game_sessions_updated_at
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION set_display_name_default()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'INSERT' AND (NEW.displayName IS NULL OR NEW.displayName = '') THEN
    NEW.displayName = NEW.username;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_users_display_name
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_display_name_default();
