# Epic 12: Auth & invite flow audit

**Status:** In progress — 12.1's config fix applied (Supabase Site URL +
Redirect URLs updated to kelbara.com), not yet verified with a live
round-trip; 12.2–12.5 not started; 12.6 (forgot password) implemented,
redesigned after two live `otp_expired` failures (see 12.6), and
verified end-to-end against an admin-generated token — still needs one
more real-email round-trip to close out
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

### 12.6 — Add password recovery ("forgot password") — DONE, verified end-to-end
- [x] **Confirmed gap**: there was no account-recovery flow at all — no
      "Forgot password?" link on `/login`, no reset page, no
      change-password option in settings. Since login is by email (not
      a separate username), the only real gap was password recovery.
- [x] `src/app/(auth)/forgot-password/{page,actions}.tsx`: email input,
      calls `supabase.auth.resetPasswordForEmail`. Always returns the
      same generic "reset link is on its way" message regardless of
      whether the account exists — Supabase itself doesn't distinguish
      the two for this call, by design, so this form can't be used to
      enumerate registered accounts. Rate-limited (new `forgotPassword`
      bucket in `src/lib/ratelimit.ts`, 5/hour by IP, same pattern as
      signup/login). "Forgot password?" link added to `/login`.
- [x] **First implementation (superseded)**: reset-password originally
      lived at `src/app/(app)/reset-password/`, reached via the same
      `/callback` code-exchange route signup/invite use, verifying via
      Supabase's default `{{ .ConfirmationURL }}` email link. This
      consistently failed live with `otp_expired` — traced to the
      link being consumed before the user's real click, most likely
      Gmail's link-scanning being especially aggressive against
      `kelbara.com` as a brand-new, no-reputation sending domain
      (Resend's click-tracking was checked and confirmed off, ruling
      that out as the cause).
- [x] **Current implementation**: `src/app/reset-password/page.tsx`, a
      top-level route (moved out of `(app)` — it must render for
      logged-out visitors, since establishing the session *is* what
      this page does). The Supabase "Reset Password" email template
      (Authentication → Emails; required setting up SMTP via Resend on
      the Free plan to unlock template editing) was changed to link
      directly here with `?token_hash={{ .TokenHash }}&type=recovery`
      instead of `{{ .ConfirmationURL }}`. Verification
      (`supabase.auth.verifyOtp`) does **not** fire automatically on
      page load — it's gated behind an explicit "Continue" button,
      since verifyOtp consumes the token on first use and an
      automatic on-load trigger is exactly what a JS-capable scanner
      would still consume before a real click; a scanner doesn't
      simulate a user click. `src/app/(auth)/forgot-password/actions.ts`
      updated to point `redirectTo` at `/reset-password` directly (no
      longer routes through `/callback` for this flow — `redirectTo`
      isn't even used by the new template's link, but still populated
      for any Supabase-side allowlist checks).
- [x] `src/lib/supabase/middleware.ts`'s `isPublicPath` allowlist: added
      `/forgot-password` (missing entirely — same class of bug as the
      `/opengraph-image` redirect issue from the share-metadata work)
      and `/reset-password` (now a public top-level route by design).
- [x] **Verified end-to-end live** via Playwright against an
      admin-API-generated recovery token (`auth.admin.generateLink`),
      exercising the full pending → Continue → verifyOtp → password
      form → `updateUser` → redirect-to-`/onboarding` path with no
      email involved at all — isolates the app code from email
      delivery/scanning, which is a variable outside this repo's
      control. `tsc`/`lint`/`build` clean.
- [ ] **Not yet re-verified with a real received email** since the
      button-gate change — the pre-button-gate version failed live
      twice with `otp_expired`; the button gate is the fix, but hasn't
      had its own real-email round trip yet.

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
