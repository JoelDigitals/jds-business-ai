-- Update consume_credit to accept variable cost
CREATE OR REPLACE FUNCTION public.consume_credit(_amount int DEFAULT 1)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _c INT;
BEGIN
  IF _amount IS NULL OR _amount < 1 THEN _amount := 1; END IF;
  PERFORM public.maybe_reset_credits(auth.uid());
  SELECT credits INTO _c FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  IF _c IS NULL OR _c < _amount THEN RETURN FALSE; END IF;
  UPDATE public.profiles SET credits = credits - _amount WHERE id = auth.uid();
  RETURN TRUE;
END;
$$;

-- Fix credit reset: monthly for pro/business, monthly small allowance for free
CREATE OR REPLACE FUNCTION public.maybe_reset_credits(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _p public.profiles;
BEGIN
  SELECT * INTO _p FROM public.profiles WHERE id = _user_id FOR UPDATE;
  IF _p IS NULL THEN RETURN; END IF;

  -- Paid plans reset monthly to their allowance
  IF _p.plan IN ('pro','business') THEN
    IF _p.credits_reset_at IS NULL OR _p.credits_reset_at < now() - interval '30 days' THEN
      UPDATE public.profiles SET
        credits = CASE WHEN _p.plan = 'pro' THEN 200 ELSE 600 END,
        credits_reset_at = now()
      WHERE id = _user_id;
    END IF;
    -- Expire paid plan back to free once plan_expires_at passed
    IF _p.plan_expires_at IS NOT NULL AND _p.plan_expires_at < now() THEN
      UPDATE public.profiles SET plan = 'free', credits = 10, credits_reset_at = now()
      WHERE id = _user_id;
    END IF;
  ELSE
    -- Free plan: 10 credits per month
    IF _p.credits_reset_at IS NULL OR _p.credits_reset_at < now() - interval '30 days' THEN
      UPDATE public.profiles SET credits = 10, credits_reset_at = now()
      WHERE id = _user_id;
    END IF;
  END IF;
END;
$$;

-- Update redeem_code to use new credit amounts
CREATE OR REPLACE FUNCTION public.redeem_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _code_row public.redemption_codes;
  _user_id UUID := auth.uid();
  _credits INT;
  _expires TIMESTAMPTZ;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO _code_row FROM public.redemption_codes WHERE code = upper(_code) FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Code nicht gefunden');
  END IF;
  IF _code_row.expires_at IS NOT NULL AND _code_row.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Code abgelaufen');
  END IF;
  IF _code_row.uses >= _code_row.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Code bereits eingelöst');
  END IF;
  IF EXISTS (SELECT 1 FROM public.code_redemptions WHERE code_id = _code_row.id AND user_id = _user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bereits eingelöst');
  END IF;

  _credits := CASE WHEN _code_row.plan = 'pro' THEN 200 ELSE 600 END;
  _expires := CASE WHEN _code_row.duration = 'yearly' THEN now() + interval '1 year' ELSE now() + interval '1 month' END;

  UPDATE public.profiles SET plan = _code_row.plan, credits = _credits,
    credits_reset_at = now(), plan_expires_at = _expires, updated_at = now()
    WHERE id = _user_id;
  UPDATE public.redemption_codes SET uses = uses + 1 WHERE id = _code_row.id;
  INSERT INTO public.code_redemptions (code_id, user_id) VALUES (_code_row.id, _user_id);

  RETURN jsonb_build_object('success', true, 'plan', _code_row.plan, 'credits', _credits, 'expires_at', _expires);
END;
$$;