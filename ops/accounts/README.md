# Accounts and cloud backup: setup

Supabase project created by Nheil on 2026-11-26.

| Setting | Value |
|---|---|
| Project URL | `https://dbdjwtjxairfahdfufkh.supabase.co` (the app adds `/rest/v1` and `/auth/v1` itself) |
| Publishable key (public, safe to ship in the app) | `sb_publishable_pwtPG7V9ZiKXGIYn2f5_Ww_hFpO_dqV` |

- The publishable key replaces the old "anon" key. It has low privileges; row-level security protects the data.
- **Never** put the secret key (`sb_secret_…`) or the `service_role` key in the app, the repo or a chat.

## One-time setup (Nheil)
1. In Supabase, open **SQL Editor → New query**, paste all of [`schema.sql`](schema.sql) and press **Run**. It should say "Success. No rows returned".
2. **Authentication → Providers:** Email is on by default; leave it on.
3. **Authentication → URL Configuration:** leave the defaults for now. The Coder will add the app's redirect URL for password-reset links when the feature is built.

## Status
- [x] Project created and keys shared (2026-11-26)
- [ ] `schema.sql` run in the SQL Editor (Nheil)
- [ ] Accounts feature built (roadmap: Queued by Nheil, item 5)

Note: Claude's build workspace can't reach supabase.co, so the Coder builds and tests against a mock. The real connection gets checked on Nheil's phone.
