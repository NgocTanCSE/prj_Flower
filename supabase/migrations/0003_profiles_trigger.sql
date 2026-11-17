-- ---------------------------------------------------------------------------
-- 0003: Tự tạo profile khi có user mới trong auth.users
--
-- Bảng public.profiles có FK tới auth.users nhưng không có trigger tạo dòng
-- tương ứng. Migration này thêm trigger + backfill các user đã tồn tại.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    'user',
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Tạo profile tương ứng khi auth.users có user mới.';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: tạo profile cho user đã tồn tại nhưng chưa có profile.
INSERT INTO public.profiles (id, role, full_name)
SELECT u.id, 'user', COALESCE(u.raw_user_meta_data ->> 'full_name', '')
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;
