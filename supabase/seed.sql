-- ---------------------------------------------------------------------------
-- seed.sql
-- Dữ liệu mẫu (seed) cho tiệm hoa CoBeCuBe.
-- Chạy sau khi dùng migration 0001_init.sql.
-- ---------------------------------------------------------------------------

-- Dữ liệu mẫu (seed) cho tiệm hoa CoBeCuBe.
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

-- --- New site settings ---
INSERT INTO public.settings (key, value) VALUES
  ('shop_logo_url',       ''),
  ('shop_favicon_url',    '/favicon.svg'),
  ('site_theme_primary',  '#8b5f65'),
  ('site_theme_body',     '#1a1a1a'),
  ('shop_hero_title',     'Bó hoa đẹp cho bạn yêu thương'),
  ('shop_hero_subtitle',  'Những bó hoa được chọn lọc trong ngày');

-- ------------------
-- AuditLog: 1 ban ghi chuan
-- ------------------
INSERT INTO public.audit_log (user_id, action, table, record_id, data, created_at) VALUES
  (NULL, 'INSERT', 'settings', NULL, '{"keys": ["shop_name","about_text","phone","email","address","business_hours","zalo_link","messenger_link"]}'::jsonb, now());
