-- ---------------------------------------------------------------------------
-- 0004: Bucket Supabase Storage cho ảnh
--
-- Ảnh thư viện / sản phẩm được upload vào bucket `assets` (public read),
-- ghi bằng service role nên không cần policy ghi cho client.
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "assets_public_read" ON storage.objects;
CREATE POLICY "assets_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'assets');
