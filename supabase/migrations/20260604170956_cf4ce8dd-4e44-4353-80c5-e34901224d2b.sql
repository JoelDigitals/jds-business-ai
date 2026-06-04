-- 1) Prevent privilege escalation via profile updates
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only block when the change comes from a logged-in end user (not service_role / definer fns)
  IF auth.uid() IS NOT NULL AND auth.uid() = NEW.id THEN
    NEW.plan := OLD.plan;
    NEW.credits := OLD.credits;
    NEW.credits_reset_at := OLD.credits_reset_at;
    NEW.plan_expires_at := OLD.plan_expires_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_priv_esc ON public.profiles;
CREATE TRIGGER trg_prevent_profile_priv_esc
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- Tighten the update policy with an explicit WITH CHECK
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 2) Let users manage their own API keys (admin policy already exists)
CREATE POLICY "Users view own api keys"
ON public.api_keys
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users create own api keys"
ON public.api_keys
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own api keys"
ON public.api_keys
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own api keys"
ON public.api_keys
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);