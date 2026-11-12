-- ---------------------------------------------------------------------------
-- 0001_init.sql
-- Schema co so du lieu Tiệm Hoa CoBeCuBe (Next.js + Supabase)
--
-- Qui tac:
--   - RLS bat tren moi bang, mac dinh DENY.
--   - anon key (frontend) chi SELECT nhung du lieu cong khai:
--       + san pham status = 'published'
--       + gallery is_active = true
--       + reviews is_approved = true
--   - Admin (role = 'admin') co toan quyen qua ham is_admin().
--   - Ban du lieu co ban, ban sau LAM SONG TRUYEN THONG.
-- ---------------------------------------------------------------------------

BEGIN;

-- ===========================================================================
-- 1. Ham tro giup
-- ===========================================================================

-- Tra ve true neu user dang dang nhap co role = 'admin'
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$function$;

COMMENT ON FUNCTION public.is_admin IS 'Ham bao mat: kiem tra role admin cua nguoi dung dang dang nhap.';

-- ===========================================================================
-- 2. Doi tuong cap nhat updated_at tu dong
-- ===========================================================================

-- Trigger function chung, dung cho cac bang co cot updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF row(new) IS DISTINCT FROM row(old) THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$function$;

-- ===========================================================================
-- 3. Bang
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Profiles: ho so nguoi dung, noi voi auth.users
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users (id) ON DELETE CASCADE PRIMARY KEY,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  full_name text NOT NULL DEFAULT '',
  avatar_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Ho so nguoi dung, noi FK voi auth.users';

-- ---------------------------------------------------------------------------
-- Categories: danh muc san pham, ho tro phan cap 1 cap (parent_id)
-- ---------------------------------------------------------------------------
CREATE TABLE public.categories (
  id bigint PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL,
  parent_id bigint NULL,
  sort_order bigint NOT NULL DEFAULT 999,
  active boolean NOT NULL DEFAULT true,
  CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories (id) ON DELETE SET NULL,
  CONSTRAINT categories_slug_key UNIQUE (slug)
);

COMMENT ON TABLE public.categories IS 'Danh muc san pham, phan cap toi da 2 cap';

-- ---------------------------------------------------------------------------
-- Products: san pham, slug deterministic theo id
-- ---------------------------------------------------------------------------
CREATE TABLE public.products (
  id bigint PRIMARY KEY,
  slug text NOT NULL,
  name text NOT NULL,
  short_desc text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  price bigint NOT NULL DEFAULT 0 CHECK (price >= 0),
  old_price bigint NULL CHECK (old_price >= 0),
  category_id bigint NOT NULL,
  weight numeric(8,2) NOT NULL DEFAULT 0 CHECK (weight >= 0),
  featured_is boolean NOT NULL DEFAULT false,
  sort_order bigint NOT NULL DEFAULT 999,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  views bigint NOT NULL DEFAULT 0 CHECK (views >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories (id),
  CONSTRAINT products_slug_key UNIQUE (slug)
);

COMMENT ON TABLE public.products IS 'San pham hoa, slug deterministic (hoa-1..hoa-8)';

-- ---------------------------------------------------------------------------
-- ProductImages: anh cua san pham (nhieu anh, 1 anh goc)
-- ---------------------------------------------------------------------------
CREATE TABLE public.product_images (
  id bigint PRIMARY KEY,
  product_id bigint NOT NULL,
  url text NOT NULL,
  alt text NOT NULL DEFAULT '',
  sort_order bigint NOT NULL DEFAULT 1,
  is_primary boolean NOT NULL DEFAULT false,
  CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products (id) ON DELETE CASCADE
);

COMMENT ON TABLE public.product_images IS 'Anh dinh kem san pham';

-- ---------------------------------------------------------------------------
-- Reviews: nhan xet san pham, phe duyet moi hien thi
-- ---------------------------------------------------------------------------
CREATE TABLE public.reviews (
  id bigint PRIMARY KEY,
  product_id bigint NOT NULL,
  customer_name text NOT NULL DEFAULT '',
  customer_email text NOT NULL DEFAULT '',
  rating smallint NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products (id)
);

COMMENT ON TABLE public.reviews IS 'Nhan xet san pham, chi hien thi khi is_approved = true';

-- ---------------------------------------------------------------------------
-- GalleryImages: anh gallery cong khai, loc theo danh muc va trang thai
-- ---------------------------------------------------------------------------
CREATE TABLE public.gallery_images (
  id bigint PRIMARY KEY,
  url text NOT NULL,
  alt text NOT NULL DEFAULT '',
  category text NOT NULL,
  sort_order bigint NOT NULL DEFAULT 999,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.gallery_images IS 'Anh gallery cong khai';

-- ---------------------------------------------------------------------------
-- Settings: cau hinh website
-- ---------------------------------------------------------------------------
CREATE TABLE public.settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.settings IS 'Cau hinh website, key-value';

-- ---------------------------------------------------------------------------
-- AuditLog: nhat ky van hanh
-- ---------------------------------------------------------------------------
CREATE TABLE public.audit_log (
  id bigserial PRIMARY KEY,
  user_id uuid NULL,
  action text NOT NULL,
  table text NOT NULL,
  record_id bigint NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.audit_log IS 'Nhật ky van hanh, chi admin moi doc/ghi duoc';

-- ===========================================================================
-- 4. Chi muc
-- ===========================================================================
CREATE INDEX products_status_visible_idx ON public.products (status, sort_order) WHERE status = 'published';
CREATE INDEX products_slug_idx ON public.products (slug) WHERE is_active = true;
CREATE INDEX products_category_idx ON public.products (category_id);
CREATE INDEX products_featured_idx ON public.products (featured_is) WHERE featured_is = true;

CREATE INDEX reviews_approved_idx ON public.reviews (is_approved, created_at) WHERE is_approved = true;
CREATE INDEX reviews_product_idx ON public.reviews (product_id, is_approved) WHERE is_approved = true;

CREATE INDEX gallery_active_idx ON public.gallery_images (is_active, sort_order) WHERE is_active = true;

CREATE INDEX categories_active_idx ON public.categories (active, sort_order) WHERE active = true;

CREATE INDEX audit_log_table_record_idx ON public.audit_log (table, record_id);

-- ===========================================================================
-- 5. Trigger cap nhat updated_at
-- ===========================================================================
DO $body$
BEGIN
  -- profiles
  DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
  CREATE TRIGGER profiles_set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

  -- categories
  DROP TRIGGER IF EXISTS categories_set_updated_at ON public.categories;
  CREATE TRIGGER categories_set_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

  -- products
  DROP TRIGGER IF EXISTS products_set_updated_at ON public.products;
  CREATE TRIGGER products_set_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

  -- product_images
  DROP TRIGGER IF EXISTS product_images_set_updated_at ON public.product_images;
  CREATE TRIGGER product_images_set_updated_at
    BEFORE UPDATE ON public.product_images
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

  -- reviews
  DROP TRIGGER IF EXISTS reviews_set_updated_at ON public.reviews;
  CREATE TRIGGER reviews_set_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

  -- gallery_images
  DROP TRIGGER IF EXISTS gallery_images_set_updated_at ON public.gallery_images;
  CREATE TRIGGER gallery_images_set_updated_at
    BEFORE UPDATE ON public.gallery_images
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

  -- settings
  DROP TRIGGER IF EXISTS settings_set_updated_at ON public.settings;
  CREATE TRIGGER settings_set_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
END;
$body$;

-- ===========================================================================
-- 6. Row Level Security
-- ===========================================================================

-- Bat RLS tren moi bang
ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Lam rong cac policy cu truoc khi tao moi
DROP POLICY IF EXISTS "self_read" ON public.profiles;
DROP POLICY IF EXISTS "admin_full" ON public.profiles;

DROP POLICY IF EXISTS "public_read" ON public.categories;
DROP POLICY IF EXISTS "admin_full" ON public.categories;

DROP POLICY IF EXISTS "public_read" ON public.products;
DROP POLICY IF EXISTS "admin_full" ON public.products;

DROP POLICY IF EXISTS "public_read" ON public.product_images;
DROP POLICY IF EXISTS "admin_full" ON public.product_images;

DROP POLICY IF EXISTS "public_read" ON public.reviews;
DROP POLICY IF EXISTS "admin_full" ON public.reviews;

DROP POLICY IF EXISTS "public_read" ON public.gallery_images;
DROP POLICY IF EXISTS "admin_full" ON public.gallery_images;

DROP POLICY IF EXISTS "public_read" ON public.settings;
DROP POLICY IF EXISTS "admin_full" ON public.settings;

DROP POLICY IF EXISTS "admin_read" ON public.audit_log;
DROP POLICY IF EXISTS "admin_write" ON public.audit_log;

-- ---------------------------------------------------------------------------
-- profiles: tu doc chinh minh + admin quan ly
-- ---------------------------------------------------------------------------
CREATE POLICY "self_read" ON public.profiles
  FOR SELECT TO anon, authenticated
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "admin_full" ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- categories: cong khai
-- ---------------------------------------------------------------------------
CREATE POLICY "public_read" ON public.categories
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "admin_full" ON public.categories
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- products: cong khai nhung san pham da cong bo
-- ---------------------------------------------------------------------------
CREATE POLICY "public_read" ON public.products
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND is_active = true);

CREATE POLICY "admin_full" ON public.products
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- product_images: cong khai
-- ---------------------------------------------------------------------------
CREATE POLICY "public_read" ON public.product_images
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "admin_full" ON public.product_images
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- reviews: chi nhung binh luan da phe duyet
-- ---------------------------------------------------------------------------
CREATE POLICY "public_read" ON public.reviews
  FOR SELECT TO anon, authenticated
  USING (is_approved = true);

CREATE POLICY "admin_full" ON public.reviews
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- gallery_images: chi nhung anh dang hoat dong
-- ---------------------------------------------------------------------------
CREATE POLICY "public_read" ON public.gallery_images
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "admin_full" ON public.gallery_images
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- settings: cong khai
-- ---------------------------------------------------------------------------
CREATE POLICY "public_read" ON public.settings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "admin_full" ON public.settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- audit_log: chi admin
-- ---------------------------------------------------------------------------
CREATE POLICY "admin_read" ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "admin_write" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- ===========================================================================
-- 7. Du lieu mau (seed)
-- ===========================================================================

-- ------------------
-- Profiles (tam bo: role 'admin' duoc tao khi nguoi dung dat lam admin)
-- ------------------

-- ------------------
-- Categories: 5 danh muc
-- ------------------
INSERT INTO public.categories (id, name, slug, parent_id, sort_order, active) VALUES
  (1, ' Hoa Sinh Nhật',       'hoa-sinh-nhat', null, 1, true),
  (2, ' Hoa Cưới',            'hoa-cuoi',      null, 2, true),
  (3, ' Hoa Chia Buồn',       'hoa-chia-buon', null, 3, true),
  (4, ' Hoa Trang Trí',        'hua-trang-tri', null, 4, true),
  (5, ' Quà Tặng',            'qua-tang',      null, 5, true);

-- ------------------
-- Products: 8 san pham (id = slug suffix, seed deterministically)
-- ------------------
INSERT INTO public.products (id, slug, name, short_desc, description, price, old_price, category_id, weight, featured_is, sort_order, status, views, is_active) VALUES
  (1, 'hoa-1', 'Bouquet Hoa Hồng Đỏ',
   '19 bong hồng đỏ tươi, co ban de dep sang trong',
   'Bouquet hồng do 19 bong truong thanh, cat tu vuon hong Da Lat. Bao quan la eucalyptus co xau va hoa baby. Gioi cuu, goi giay premium neu de cho nguoi thuong.',
   500000, 650000, 1, 0.50, true, 1, 'published', 234, true),
  (2, 'hoa-2', 'Bouquet Sinh Nhật Đẹp Vui',
   'Sao hanh mung sinh nhat, co ban cau an',
   'Bouquet sinh nhat ket hop hong, cam chuong, ly phi vang. Mau sac ruc ro. Goi va co bao quan PEEP de tre duoc luon.',
   400000, NULL, 1, 0.80, false, 2, 'published', 56, true),
  (3, 'hoa-3', 'Bouquet Hoa Tulip Da Lat',
   '50 bong tulip Ha Lan, huong tho dam dong',
   'Tulip Da Lat nhap khau tu vuon Ha Lan, 50 bong sep dep. Bao quan tra ke pu se duoc mo cuong de ure.',
   650000, 800000, 1, 1.00, true, 3, 'published', 12, true),
  (4, 'hoa-4', 'Hoa Lan Vạn Thọ',
   'Hoa lan cac loai de da rong, tot la bieu tuong tai loc',
   'Bouquet hoa lan van thau, cac loai lan dai tu 40-60cm. Hoa lan huong thu ca thang, dat tren ban lam viec hoac phong khach.',
   1200000, 1400000, 4, 2.00, false, 4, 'published', 89, true),
  (5, 'hoa-5', 'Hoa Cưới Trắng Tinh Khiết',
   'Trang tri tiec cuoi tong trang sang tro',
   'Giuong cuoi trang dep voi hong, lan doan, giay white. Duoc day chong in thong, ok ne, thiet ke theo mot. Cuong de cho duoc.',
   2500000, 3000000, 2, 1.50, true, 5, 'published', 45, true),
  (6, 'hoa-6', 'Bouquet Hướng Dương Em Ấy',
   'Hương Dương tuoi thanh theo nang',
   'Bouquet huong Dương 21 bus va la xanh co dien. Bo hoa dep tuong truong cho tinh yeu nylon xay, phuc hop cho nguoi thuong mien Nam.',
   300000, NULL, 1, 0.60, false, 6, 'published', 210, true),
  (7, 'hoa-7', 'Hoa Lan Điều Sợi Tươi',
   'Hương thoa nhe, do tuoi len den 2 thang',
   'Hoa lan dieu dang do no dep tu 2-9 moi. Lanh quyen nhe nhang, huong thoa linh hoat. So sue nao do cho than men.',
   1500000, 1800000, 3, 3.00, false, 7, 'draft', 4, true),
  (8, 'hoa-8', 'Quà Tặng Hoa & Bánh Đôi Gà',
   'Goi qua thiet ke theo yeu cau',
   'Bouquet ket hop banh ngot va thi quai yeu thich. It dat truoc 1 ngay de bao dam tot nhat. Goi banh Chocolate tao niem vui bat ng... tour.',
   750000, 900000, 5, 1.20, false, 8, 'published', 167, true);

-- ------------------
-- ProductImages: 2 anh moi san pham (1 chinh)
-- ------------------
INSERT INTO public.product_images (id, product_id, url, alt, sort_order, is_primary) VALUES
  (1,  1, 'https://cocobebe.vn/products/hoa-1-main.jpg', 'Bouquet Hoa Hồng Đỏ',  1, true),
  (2,  1, 'https://cocobebe.vn/products/hoa-1-alt.jpg', 'Bouquet Hoa Hồng Đỏ goc khac', 2, false),
  (3,  2, 'https://cocobebe.vn/products/hoa-2-main.jpg', 'Bouquet Sinh Nhật',  1, true),
  (4,  2, 'https://cocobebe.vn/products/hoa-2-alt.jpg', 'Bouquet Sinh Nhật chi tiet', 2, false),
  (5,  3, 'https://cocobebe.vn/products/hoa-3-main.jpg', 'Bouquet Hoa Tulip',  1, true),
  (6,  3, 'https://cocobebe.vn/products/hoa-3-alt.jpg', 'Hoa Tulip Da Lat', 2, false),
  (7,  4, 'https://cocobebe.vn/products/hoa-4-main.jpg', 'Hoa Lan Vạn Thọ',  1, true),
  (8,  4, 'https://cocobebe.vn/products/hoa-4-alt.jpg', 'Hoa Lan chi tiet', 2, false),
  (9,  5, 'https://cocobebe.vn/products/hoa-5-main.jpg', 'Hoa Cưới Trắng',  1, true),
  (10, 5, 'https://cocobebe.vn/products/hoa-5-alt.jpg', 'Hoa Cưới Trắng ngoai troi', 2, false),
  (11, 6, 'https://cocobebe.vn/products/hoa-6-main.jpg', 'Bouquet Hướng Dương', 1, true),
  (12, 6, 'https://cocobebe.vn/products/hoa-6-alt.jpg', 'Hương Dương ben cua so', 2, false),
  (13, 7, 'https://cocobebe.vn/products/hoa-7-main.jpg', 'Hoa Lan Điều',  1, true),
  (14, 7, 'https://cocobebe.vn/products/hoa-7-alt.jpg', 'Hoa Lan Điều ban phong khach', 2, false),
  (15, 8, 'https://cocobebe.vn/products/hoa-8-main.jpg', 'Gói Quà Tặng', 1, true),
  (16, 8, 'https://cocobebe.vn/products/hoa-8-alt.jpg', 'Gói Quà Tặng banh', 2, false);

-- ------------------
-- Reviews: 4 binh luan, 3 phe duyet + 1 cho kiem
-- ------------------
INSERT INTO public.reviews (id, product_id, customer_name, customer_email, rating, comment, is_approved, created_at) VALUES
  (1, 1, 'Nguyễn Thị Mai',    'mai.nguyen@example.com', 5, 'Hoa rất tươi, doan goi can than. Giao hang dung GIO, minh se ung ho shop dai dai!', true, '2025-11-01T09:30:00Z'),
  (2, 2, 'Trần Văn Hùng',    'hung.tran@example.com', 4, 'Hen gai voi hinh, mau khoa dep. Se ung ho lan sau!', true, '2025-11-02T14:15:00Z'),
  (3, 5, 'Lê Thị Hương',     'huong.le@example.com', 5, 'Hoan hao cho dam cuoi, hoa trang tinh khon! Gia hoi cao nhung cung xing dang.', true, '2025-11-03T16:45:00Z'),
  (4, 6, 'Phạm Đức Anh',     'anh.pham@example.com', 5, 'Giao hang Nhanh chong, minh rat thich! Cam on shop.', true, '2025-11-04T08:00:00Z');

-- ------------------
-- GalleryImages: 5 anh
-- ------------------
INSERT INTO public.gallery_images (id, url, alt, category, sort_order, is_active) VALUES
  (1, 'https://cocobebe.vn/gallery/shop-main.jpg', 'Tiệm Hoa CoBeCuBe truoc cua', 'shop', 1, true),
  (2, 'https://cocobebe.vn/gallery/bouquet-main.jpg', 'Bouquet hoa quan sinh nhat', 'bouquet', 2, true),
  (3, 'https://cocobebe.vn/gallery/wedding-main.jpg', 'Tan mat cuoi hoa trang', 'wedding', 3, true),
  (4, 'https://cocobebe.vn/gallery/decro-main.jpg', 'Ha Trang tri phong khach', 'decor', 4, true),
  (5, 'https://cocobebe.vn/gallery/delivery-main.jpg', 'Nhan vien giao hoa', 'delivery', 5, true);

-- ------------------
-- Settings: 20 cau hinh mac dinh
-- ------------------
INSERT INTO public.settings (key, value) VALUES
  ('shop_name',           'Tiệm Hoa CoBeCuBe'),
  ('about_text',          'Tiệm Hoa CoBeCuBe chuyen cap phat cac loai hoa tuoi, hoa cuoi, hoa sinh nhat va qua tang. Dat hoa giao nhanh trong ngay, phuc vu tai tung khu vuc. Ten ban ve loai hoa dep, thich hop cho moi nguoi.'),
  ('phone',               '0905.888.123'),
  ('email',               'hello@cocobebe.vn'),
  ('address',             '123 Ngậuyen Thi Dinh, Phuong Ngậuyen Canh Binh, Quan 7, TP. Ho Chi Minh'),
  ('business_hours',      'Thu Hai - Chu Nhật: 08:00 - 21:00'),
  ('zalo_link',           'https://zalo.me/0905888123'),
  ('messenger_link',      'https://m.me/cocobebe.vn'),
  ('facebook_link',       'https://facebook.com/cocobebe.vn'),
  ('instagram_link',      'https://instagram.com/cocobebe.vn'),
  ('allow_orders',        'true'),
  ('currency',            'VND'),
  ('language',            'vi'),
  ('shipping_fee',        '30000'),
  ('free_shipping_min',   '500000'),
  ('tax_rate',            '0'),
  ('cancel_policy',       'Khong hoan tien neu da dat hang. Đặt lai 1 giu truoc khi giao de huy.'),
  ('delivery_note',       'Giao hang toan thanh pho. Vui long kiem tra hoa truoc khi nhan.'),
  ('seo_meta_title',      'Tiệm Hoa CoBeCuBe - Hoa tuoi tron niem vui'),
  ('seo_meta_description','Chuyen ban hoa tuoi, hoa cuoi, hoa sinh nhat, hoa qua tang giao hang nhanh tai TP. Ho Chi Minh.');

-- ------------------
-- AuditLog: 1 ban ghi chuan
-- ------------------
INSERT INTO public.audit_log (user_id, action, table, record_id, data, created_at) VALUES
  (NULL, 'INSERT', 'settings', NULL, '{"keys": ["shop_name","about_text","phone","email","address","business_hours","zalo_link","messenger_link"]}'::jsonb, now());

COMMIT;
