-- Restrict UPDATE on profiles to safe columns only via column-level privileges.
-- This is defence-in-depth on top of the existing prevent_profile_privilege_escalation trigger.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, email, updated_at) ON public.profiles TO authenticated;
-- service_role keeps full access (used by SECURITY DEFINER fns and edge functions)
GRANT ALL ON public.profiles TO service_role;