-- ---------------------------------------------------------------------------
-- 0002_site_settings.sql
-- Giá trị mặc định (default) cho các khóa cài đặt mới cần cho giao diện
-- website (logo, favicon, màu chủ đạo, tiêu đề banner trang chủ).
--
-- Script an toàn khi chạy lại (ON CONFLICT DO NOTHING), cả khi push
-- migration một lần hoặc khi khách hàng đã up data cũ lên.
-- ---------------------------------------------------------------------------

INSERT INTO public.settings (key, value) VALUES
  ('shop_logo_url',       ''),
  ('shop_favicon_url',    '/favicon.svg'),
  ('site_theme_primary',  '#8b5f65'),
  ('site_theme_body',     '#1a1a1a'),
  ('shop_hero_title',     'Bó hoa đẹp cho bạn yêu thương'),
  ('shop_hero_subtitle',  'Những bó hoa được chọn lọc trong ngày')
ON CONFLICT (key) DO NOTHING;
