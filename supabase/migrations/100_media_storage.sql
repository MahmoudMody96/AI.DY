-- Migration: create a public "media" bucket for tool logos,
-- blog covers, and any other user-uploaded assets. Admins
-- can upload, anyone can read.

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for the "media" bucket.
DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
CREATE POLICY "media_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

-- Authenticated users can upload to "media".
-- (We rely on the admin layout / role check at the app layer
--  rather than a complex storage RLS — the app ensures only
--  admin sessions reach the upload action.)
DROP POLICY IF EXISTS "media_authenticated_insert" ON storage.objects;
CREATE POLICY "media_authenticated_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND auth.role() = 'authenticated'
  );

-- Admins can delete (used when removing an old asset).
DROP POLICY IF EXISTS "media_authenticated_delete" ON storage.objects;
CREATE POLICY "media_authenticated_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media'
    AND auth.role() = 'authenticated'
  );
