
-- Roles enum + user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  credits INT NOT NULL DEFAULT 5,
  credits_reset_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Redemption codes
CREATE TABLE public.redemption_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('pro', 'business')),
  duration TEXT NOT NULL CHECK (duration IN ('monthly', 'yearly')),
  max_uses INT NOT NULL DEFAULT 1,
  uses INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.redemption_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage codes" ON public.redemption_codes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID REFERENCES public.redemption_codes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(code_id, user_id)
);
ALTER TABLE public.code_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own redemptions" ON public.code_redemptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all redemptions" ON public.code_redemptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Generated documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own docs" ON public.documents FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Redeem code function (atomic)
CREATE OR REPLACE FUNCTION public.redeem_code(_code TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

  _credits := CASE WHEN _code_row.plan = 'pro' THEN 50 ELSE 100 END;
  _expires := CASE WHEN _code_row.duration = 'yearly' THEN now() + interval '1 year' ELSE now() + interval '1 month' END;

  UPDATE public.profiles SET plan = _code_row.plan, credits = _credits,
    credits_reset_at = now(), plan_expires_at = _expires, updated_at = now()
    WHERE id = _user_id;
  UPDATE public.redemption_codes SET uses = uses + 1 WHERE id = _code_row.id;
  INSERT INTO public.code_redemptions (code_id, user_id) VALUES (_code_row.id, _user_id);

  RETURN jsonb_build_object('success', true, 'plan', _code_row.plan, 'credits', _credits, 'expires_at', _expires);
END;
$$;

-- Weekly credit reset for Pro/Business
CREATE OR REPLACE FUNCTION public.maybe_reset_credits(_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _p public.profiles;
BEGIN
  SELECT * INTO _p FROM public.profiles WHERE id = _user_id FOR UPDATE;
  IF _p.plan IN ('pro','business') AND _p.credits_reset_at < now() - interval '7 days' THEN
    UPDATE public.profiles SET
      credits = CASE WHEN _p.plan = 'pro' THEN 50 ELSE 100 END,
      credits_reset_at = now()
    WHERE id = _user_id;
  END IF;
END;
$$;

-- Consume credit
CREATE OR REPLACE FUNCTION public.consume_credit()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _c INT;
BEGIN
  PERFORM public.maybe_reset_credits(auth.uid());
  SELECT credits INTO _c FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  IF _c IS NULL OR _c <= 0 THEN RETURN FALSE; END IF;
  UPDATE public.profiles SET credits = credits - 1 WHERE id = auth.uid();
  RETURN TRUE;
END;
$$;
