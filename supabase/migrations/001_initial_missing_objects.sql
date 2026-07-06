-- =============================================================================
-- SOUG XPRESS — Migration 001: Initial Missing Objects
-- =============================================================================
-- Project : SOUG XPRESS
-- Created : 2026-07-06
-- Author  : Platform owner / DBA
--
-- PURPOSE
-- -------
-- Creates missing database objects and hardens Row Level Security (RLS) policies
-- that were identified during QA. This migration is ADDITIVE only:
--   • No existing tables are dropped or altered.
--   • No existing data is deleted.
--   • DROP POLICY IF EXISTS is used before each CREATE POLICY so re-running
--     this file is safe if a policy already exists under the same name.
--
-- HOW TO RUN
-- ----------
-- Option A — Supabase SQL Editor (recommended for first run):
--   Dashboard → SQL Editor → New query → paste file contents → Run
--
-- Option B — Supabase CLI (if configured):
--   supabase db push   (applies all files in supabase/migrations/ in order)
--
-- ⚠  Review every section before running. Read the inline comments.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 0. Safety check — ensure we are in the right schema context
-- ---------------------------------------------------------------------------
SET search_path TO public;


-- ===========================================================================
-- SECTION 1 — promotions table
-- ===========================================================================
-- The merchant dashboard (src/app/(tabs)/merchant.tsx) queries and inserts
-- into `public.promotions`.  The table did not exist, causing a PGRST205 error
-- that silently emptied the promotions panel for every merchant.
--
-- Columns mapped by the app:
--   id             → string  (UUID primary key, auto-generated)
--   store_id       → string  (FK to stores.id, set to auth.uid() on insert)
--   name           → string  (product/offer name, e.g. "طن كسكس مميز")
--   original_price → string  (free-form label, default 'السعر القديم')
--   promo_price    → string  (formatted price string, e.g. "450 د.ج")
--   created_at     → timestamptz (auto-set)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.promotions (
    id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id       uuid        NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name           text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
    original_price text        NOT NULL DEFAULT 'السعر القديم',
    promo_price    text        NOT NULL CHECK (char_length(promo_price) BETWEEN 1 AND 100),
    created_at     timestamptz NOT NULL DEFAULT now()
);

-- Index for the most common query pattern: all promos for one store
CREATE INDEX IF NOT EXISTS promotions_store_id_idx ON public.promotions (store_id);

-- Enable RLS (safe to call even if already enabled)
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Merchants read their own promotions
DROP POLICY IF EXISTS "Merchants read own promotions" ON public.promotions;
CREATE POLICY "Merchants read own promotions"
    ON public.promotions
    FOR SELECT
    USING (auth.uid() = store_id);

-- Public can read approved stores' promotions (for the customer home feed)
-- This policy allows any authenticated or anonymous user to browse live promos.
DROP POLICY IF EXISTS "Public read all promotions" ON public.promotions;
CREATE POLICY "Public read all promotions"
    ON public.promotions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = store_id AND s.is_approved = true
        )
    );

-- Merchants insert their own promotions
DROP POLICY IF EXISTS "Merchants insert own promotions" ON public.promotions;
CREATE POLICY "Merchants insert own promotions"
    ON public.promotions
    FOR INSERT
    WITH CHECK (auth.uid() = store_id);

-- Merchants delete their own promotions
DROP POLICY IF EXISTS "Merchants delete own promotions" ON public.promotions;
CREATE POLICY "Merchants delete own promotions"
    ON public.promotions
    FOR DELETE
    USING (auth.uid() = store_id);


-- ===========================================================================
-- SECTION 2 — comments table: enforce authenticated INSERT
-- ===========================================================================
-- QA finding (CRIT-02): anonymous users could INSERT rows into `comments`
-- without any account. The anon key returned HTTP 201 on a bare POST.
--
-- The app (src/app/index.tsx) inserts comments with:
--   { post_id, user_id, content, username, user_role }
--
-- After this migration:
--   • Anon INSERT → blocked (403 Forbidden)
--   • Authenticated users → INSERT allowed
--   • SELECT remains public (anyone can read the comment feed)
--   • Merchants can DELETE comments on posts that belong to their store
--   • Users can DELETE their own comments (future: user profiles with ownership)
--
-- ⚠  If the comments table already has RLS policies, check for conflicts in
--    Dashboard → Authentication → Policies before running.
-- ===========================================================================

-- Ensure RLS is on
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- SELECT: keep public so the feed is readable without an account
DROP POLICY IF EXISTS "Public read comments" ON public.comments;
CREATE POLICY "Public read comments"
    ON public.comments
    FOR SELECT
    USING (true);

-- INSERT: require a valid session (auth.uid() is not null means authenticated)
DROP POLICY IF EXISTS "Authenticated users insert comments" ON public.comments;
CREATE POLICY "Authenticated users insert comments"
    ON public.comments
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- DELETE: merchants can remove comments on their own posts
-- A post belongs to a merchant when store_media.store_id = auth.uid()
DROP POLICY IF EXISTS "Merchant delete comments on own posts" ON public.comments;
CREATE POLICY "Merchant delete comments on own posts"
    ON public.comments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.store_media sm
            WHERE sm.id = comments.post_id
              AND sm.store_id = auth.uid()
        )
    );


-- ===========================================================================
-- SECTION 3 — store_media table: allow public SELECT
-- ===========================================================================
-- QA finding (CRIT-04): the commercial feed on the onboarding screen
-- (src/app/index.tsx fetchCommercialFeed) reads from `store_media` but the
-- anon role received an empty result set because RLS blocked all anon reads.
-- The feed was always empty for unauthenticated visitors.
--
-- This policy makes all store_media rows for APPROVED stores readable by
-- anyone (anon or authenticated) — matching the public nature of a commercial
-- advertising feed.
-- ===========================================================================

ALTER TABLE public.store_media ENABLE ROW LEVEL SECURITY;

-- Public can read media for approved stores
DROP POLICY IF EXISTS "Public read approved store media" ON public.store_media;
CREATE POLICY "Public read approved store media"
    ON public.store_media
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = store_media.store_id AND s.is_approved = true
        )
    );

-- Merchants can INSERT their own media
DROP POLICY IF EXISTS "Merchants insert own media" ON public.store_media;
CREATE POLICY "Merchants insert own media"
    ON public.store_media
    FOR INSERT
    WITH CHECK (auth.uid() = store_id);

-- Merchants can DELETE their own media
DROP POLICY IF EXISTS "Merchants delete own media" ON public.store_media;
CREATE POLICY "Merchants delete own media"
    ON public.store_media
    FOR DELETE
    USING (auth.uid() = store_id);


-- ===========================================================================
-- SECTION 4 — drivers table: restrict SELECT to own row only
-- ===========================================================================
-- QA finding (HIGH-04): any authenticated user could query ALL rows in the
-- `drivers` table, exposing every driver's name, trip count, and money owed.
--
-- After this migration:
--   • A driver sees only their own row (auth.uid() = id)
--   • The admin screen reads drivers differently (via service role or a
--     future admin-scoped policy — add one below if needed)
--   • Unauthenticated users see nothing
--
-- ⚠  The admin screen (src/app/admin.tsx) also reads drivers.  If it runs
--    with the anon/user key (not service role), add the admin policy below
--    after confirming the admin user's UUID or email domain.
-- ===========================================================================

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Drivers read only their own row
DROP POLICY IF EXISTS "Driver reads own row" ON public.drivers;
CREATE POLICY "Driver reads own row"
    ON public.drivers
    FOR SELECT
    USING (auth.uid() = id);

-- Drivers update their own row (for delivery_counter, total_owed_to_site, is_suspended)
-- The app calls: supabase.from('drivers').update({...}).eq('id', user.id)
DROP POLICY IF EXISTS "Driver updates own row" ON public.drivers;
CREATE POLICY "Driver updates own row"
    ON public.drivers
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ── OPTIONAL: Admin bypass ──────────────────────────────────────────────────
-- Uncomment and replace '<admin-uuid>' with the real admin user's UUID to let
-- the admin panel read and manage all drivers.
--
-- DROP POLICY IF EXISTS "Admin full access to drivers" ON public.drivers;
-- CREATE POLICY "Admin full access to drivers"
--     ON public.drivers
--     FOR ALL
--     USING (auth.uid() = '<admin-uuid>');
-- ────────────────────────────────────────────────────────────────────────────


-- ===========================================================================
-- SECTION 5 — store-media storage bucket (informational SQL only)
-- ===========================================================================
-- The merchant dashboard uploads product photos to the `store-media` bucket.
-- QA confirmed the bucket either does not exist or has no accessible policy.
--
-- The INSERT below creates the bucket record if it does not already exist.
-- Storage file-level policies must be added separately in the Dashboard
-- (see docs/SUPABASE_SETUP.md → Step 5).
--
-- ⚠  Un-comment ONLY if you want to create the bucket via SQL.
--    The safer approach is the Dashboard UI described in SUPABASE_SETUP.md.
-- ===========================================================================

-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--     'store-media',
--     'store-media',
--     true,                                -- MUST be true: app uses getPublicUrl() → stored in store_media.media_url
--     5242880,                             -- 5 MB per file
--     ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
-- )
-- ON CONFLICT (id) DO NOTHING;


-- ===========================================================================
-- END OF MIGRATION
-- ===========================================================================
-- Verify by running these SELECT queries after applying:
--
--   SELECT tablename, rowsecurity FROM pg_tables
--    WHERE schemaname = 'public'
--      AND tablename IN ('promotions','comments','store_media','drivers');
--
--   SELECT schemaname, tablename, policyname, cmd
--     FROM pg_policies
--    WHERE schemaname = 'public'
--      AND tablename IN ('promotions','comments','store_media','drivers')
--    ORDER BY tablename, policyname;
-- =============================================================================
