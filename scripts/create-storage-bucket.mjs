// Create the "media" storage bucket via the Supabase JS client
// (doesn't require direct DB access)
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf-8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.+)$/);
  if (m) env[m[1]] = m[2].trim();
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

(async () => {
  // 1. Create bucket
  const { data: existing } = await admin.storage.getBucket('media');
  if (existing) {
    console.log('Bucket "media" already exists');
  } else {
    const { data, error } = await admin.storage.createBucket('media', {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5 MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'],
    });
    if (error) {
      console.error('createBucket failed:', error.message);
      process.exit(1);
    }
    console.log('Created bucket:', data);
  }

  // 2. Set the public read policy via SQL
  // (Policies on storage.objects in Supabase have to be set via SQL,
  //  not the JS API. We need a DB connection.)
  console.log('\nNOTE: RLS policies on storage.objects need to be created via SQL.');
  console.log('If you get "permission denied" when uploading, run the following');
  console.log('in Supabase Dashboard → SQL Editor:');
  console.log(`
-- Public read
CREATE POLICY "media_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'media');
-- Authenticated insert
CREATE POLICY "media_authenticated_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');
-- Authenticated delete
CREATE POLICY "media_authenticated_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'media' AND auth.role() = 'authenticated');
  `);
})();
