# Console Hub - Plan v0.1

**Trust tier: DRAFT (plan, not built).** Scoping doc for a merged, invite-only
console across PromptOS + newswatcher + agent-kit (+ a net-new dev-setup
console). Written to be executed in a *fresh, repo-launched, bounded* session
-- not bolted onto a long marathon thread.

## Goal (one line)

One invite-only web app that renders every project's console (prompt/data
catalogs) behind Supabase auth, replacing N separate single-file consoles.

## Scope

**In (v1):**
- Merge existing consoles into one renderer + project switcher.
- Invite-only login (no public signup).
- Live catalogs from a shared Postgres table (not baked-in JSON).
- Per-user access scoping (who sees which project).

**Out (v1, explicitly):**
- Editing prompts in the UI (read/browse first; authoring is a later phase).
- Running prompts through a model from the console (only if/when needed; if
  added, the API key stays server-side -- never in the browser).
- Server-gated *page* protection (see Hosting decision -- shell is public,
  data is gated; revisit only if the shell itself must be hidden).

## Hosting decision (SETTLED)

**GitHub Pages (static frontend) + Supabase (auth + edge functions + data).**

- GitHub Pages is dumb static hosting: no server, no compute. It hosts the
  console *shell* only.
- Auth, edge functions, and data live in **Supabase**. The shell calls them
  from the browser via the Supabase JS client.
- The shell ships the Supabase **publishable/anon key** (designed to be
  public). Real protection = **Row-Level Security + auth on the data**, not
  hiding the key.
- Tradeoff accepted: an uninvited person can download the empty shell but gets
  **nothing** -- every data call needs a valid session and passes RLS.
- Move to Cloudflare Workers / Vercel **only if** the page itself must be
  invisible to uninvited users (server-gated pages). Not a v1 requirement.

## Architecture

```
[GitHub Pages]  static shell (one renderer + project switcher)
      |  Supabase JS client (anon key, public-safe)
      v
[Supabase]  Auth (invite-only) + Postgres (RLS) + Edge Functions (Deno)
```

## Supabase schema (first cut -- confirm live before building)

- `projects(id, slug, name, visibility)`
- `catalog_items(id, project_id, kind, title, body, meta jsonb, updated_at)`
  -- the unified contract every console renders from.
- `allowed_emails(email, invited_by, invited_at)` -- the invite allowlist.
- `memberships(user_id, project_id, role)` -- who sees which project.
- `usage_receipts(...)` -- ties to PromptOS PR #5 (telemetry-loop); the hub is
  where receipts surface.

**Non-negotiable:** RLS ON for every table. A table with RLS off is the classic
way this pattern leaks. Verify live per table before shipping.

## Auth flow (invite-only)

1. Public signup DISABLED in Supabase Auth settings.
2. Admin adds an email to `allowed_emails` (or `auth.admin.inviteUserByEmail`).
3. User gets a magic link, logs in, session established.
4. Every data read is RLS-scoped by `memberships` -> user sees only their
   projects. No session -> blank app.

## Edge functions (the genuinely useful ones)

- `invite` -- admin issues/revokes invites (writes `allowed_emails`).
- `access-check` -- role/project gating beyond RLS where needed.
- `search` -- server-side search over a large merged catalog.
- `receipts` -- usage telemetry (PR #5 tie-in).
- `run-proxy` -- ONLY if the console ever runs a prompt; keeps the model API
  key server-side. Out of v1 unless required.

## DISCOVERY STEP 1 (do FIRST -- do not assume)

The merge assumes newswatcher / agent-kit / dev-setup consoles exist and share
PromptOS's data-contract shape. **This is unverified.** Before any build:

- [ ] Confirm each console exists and locate it (repo + path).
- [ ] Extract each one's data contract (what JSON shape it renders).
- [ ] Decide the unified `catalog_items` contract; note any console that needs
      a normalization adapter.
- [ ] dev-setup console is net-new -> built to the unified contract from day 1.

If contracts diverged, add a normalization layer to the plan before Phase 2.

## Build sequence (bounded, phased -- one PR per phase)

1. **Phase 0 - decide repo home.** New `BFlinkDesign/console-hub` vs. live in
   PROMPTOS. (Cross-project -> a dedicated repo is likely cleaner.)
2. **Phase 1 - Supabase project + schema + RLS**, empty. Verify RLS live.
3. **Phase 2 - static shell renders ONE project** from Supabase (PromptOS
   first), behind invite-only auth. Prove the auth gate with an uninvited user
   (should get nothing).
4. **Phase 3 - project switcher + remaining catalogs** (after Discovery Step 1).
5. **Phase 4 - edge functions** (invite admin, search, receipts) as needed.
6. **Phase 5 - GitHub Pages deploy** of the shell; custom domain optional.

## Verification gates (per phase)

- RLS proven live: an unauthenticated / wrong-project request returns nothing
  (not just "the UI hides it").
- No secrets in the static shell (anon key only; scan before every Pages deploy).
- Each phase merged only with its gate green; draft PR + human review.

## Open decisions (owner: Brady)

- Repo home (new `console-hub` vs PROMPTOS).
- Which projects ship in v1 (all four, or PromptOS + one).
- Whether editing/authoring is ever in-scope (changes the schema + RLS).

---
*Plan only. Next action: pick the repo home, then execute Phase 1 in a fresh
session launched from that repo.*
