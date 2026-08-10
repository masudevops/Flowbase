# Epic 12: Auth & invite flow audit

**Status:** In progress — 12.1's config fix applied (Supabase Site URL +
Redirect URLs updated to kelbara.com), not yet verified with a live
round-trip; 12.2–12.5 not started; 12.6 (forgot password) added and not
started
**Schema change:** No
**Risk:** Low — mostly configuration/verification, not new surface area

## Why

Raised after noticing that invite emails' "Join" link lands on the
Vercel-assigned `*.vercel.app` domain instead of `kelbara.com`, even
though the app is otherwise reachable at the custom domain — while
plain (non-invite) signup appeared to stay on `kelbara.com`
throughout. None of epics 1–11 audited the signup/login/invite/join
pipeline end-to-end as its own pass; this closes that gap and fixes
the concrete domain leak found along the way.

## Scope

- Find and fix the domain leak in server-generated links (invite
  emails, auth email redirects).
- Live-walk all four identity flows — sign up, sign in, send invite,
  accept invite/join — for both new-user and existing-user paths, and
  confirm each lands where it should.
- Confirm this isn't a Resend problem specifically: Resend only
  delivers the HTML/links the app hands it, so if a link is wrong the
  bug is in how the app builds that link, not in Resend's delivery.

## Non-goals

- No new auth provider or invite UX redesign — this is a correctness
  audit of the existing flows, not a rebuild.
- No changes to Supabase project settings beyond what's needed to fix
  the domain leak (i.e. the Redirect URLs allowlist), and only after
  confirming with the user first, same as Epic 8's external-account
  stories.

## Stories

### 12.1 — Fix cross-domain leak in invite/signup email links
- [x] **Root-caused, first hypothesis (`NEXT_PUBLIC_APP_URL`) ruled
      out**: checked Vercel Project Settings → Environment Variables —
      `NEXT_PUBLIC_APP_URL` (Production) is already `https://kelbara.com`.
      Not the cause.
- [x] **Actual root cause, confirmed live**: Supabase → Authentication
      → URL Configuration. **Site URL** is `https://flowbase-azure.vercel.app`
      (a leftover from before this project was renamed from "Flowbase"
      to Kelbara and the custom domain was attached), and the
      **Redirect URLs** allowlist only contains
      `https://flowbase-azure.vercel.app/callback` and
      `http://localhost:3000/callback` — `kelbara.com` isn't on it at
      all. `src/app/(auth)/signup/actions.ts` passes
      `emailRedirectTo: https://kelbara.com/callback...`, which isn't
      on the allowlist, so Supabase silently falls back to the stale
      Site URL for the confirmation-email redirect. Not a Resend
      issue — Resend delivers exactly the link Supabase puts in the
      email template.
- [x] **Fixed by the user in Supabase**: Site URL set to
      `https://kelbara.com`; `https://kelbara.com/callback` added to
      the Redirect URLs allowlist (`localhost:3000/callback` kept for
      local dev).
- [ ] Confirm live (12.4/12.5 below) rather than assuming the config
      change alone fixed it.

### 12.2 — Live audit: sign up (no invite)
- [ ] New account, no pending invite: submit signup, confirm the
      confirmation email's link domain, confirm `/callback` behavior,
      confirm landing page (onboarding → create workspace, per the
      last fix in `2df3736`).

### 12.3 — Live audit: sign in (existing account)
- [ ] Existing account login, including the `next` param redirect
      path (`/login?next=...`) used by the invite page for users who
      aren't signed in yet.

### 12.4 — Live audit: send invite
- [ ] Send an invite, inspect the actual Resend email received (not
      just the code that generates it) — confirm the link domain,
      subject, and body render correctly end-to-end.

### 12.5 — Live audit: accept invite / join
- [ ] Invited user who **already has an account**: click invite link
      → log in → accept → lands in the correct org (not "create
      workspace").
- [ ] Invited user who is **brand new**: click invite link → sign up
      → confirm email → accept → lands in the correct org. This path
      is the one that exercises 12.1's fix, since it's the only one
      that round-trips through an email link after the initial click.

### 12.6 — Add password recovery ("forgot password")
- [ ] **Confirmed gap**: there is currently no account-recovery flow at
      all — no "Forgot password?" link on `/login`, no reset page, no
      change-password option in settings. Since login is by email (not
      a separate username), the only real gap is password recovery.
- [ ] `/forgot-password`: email input, calls
      `supabase.auth.resetPasswordForEmail(email, { redirectTo:
      `${APP_URL}/callback?next=/reset-password` })`, rate-limited the
      same way as login/signup (new `checkRateLimit` bucket).
- [ ] `/reset-password`: new-password form, reached after the recovery
      link round-trips through the existing `/callback` code-exchange
      handler (same mechanism signup confirmation and invite emails
      already use); calls `supabase.auth.updateUser({ password })`.
- [ ] "Forgot password?" link added to `/login`, next to the password
      field.
- [ ] Depends on 12.1's fix being live-verified first — this reuses the
      exact same Supabase redirect plumbing.

## Acceptance criteria

- [ ] Every link in a transactional email (invite, signup
      confirmation) resolves to `https://kelbara.com` in production —
      confirmed by actually reading the received email, not just the
      generating code.
- [ ] All five flows above (12.2–12.5, with 12.5 counted twice for its
      two paths) walked live with no domain mismatch and no
      misrouting.
- `tsc` / `lint` / `test` / `build` clean if any code changes are made
  (12.1's fix is expected to be config-only, but verify).
