-- ---------------------------------------------------------------------------
-- 0005_generated_ids.sql
--
-- Vá lỗi schema: các bảng nghiệp vụ khai báo `id bigint PRIMARY KEY` nhưng
-- KHÔNG có DEFAULT/IDENTITY. Vì vậy mọi INSERT không truyền `id` đều thất bại:
--   null value in column "id" of relation "<table>" violates not-null constraint
--
-- Migration này tạo sequence + gán DEFAULT cho từng bảng, đồng thời đặt bộ đếm
-- SAU `MAX(id)` hiện có để không đụng dữ liệu seed (id 1..N).
--
-- An toàn để chạy nhiều lần (CREATE SEQUENCE IF NOT EXISTS + SET DEFAULT).
-- ---------------------------------------------------------------------------

BEGIN;

-- categories ---------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.categories_id_seq;
ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;
ALTER TABLE public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq');
SELECT setval('public.categories_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM public.categories), 0) + 1, 1), false);

-- products -----------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.products_id_seq;
ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;
ALTER TABLE public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq');
SELECT setval('public.products_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM public.products), 0) + 1, 1), false);

-- product_images -----------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.product_images_id_seq;
ALTER SEQUENCE public.product_images_id_seq OWNED BY public.product_images.id;
ALTER TABLE public.product_images ALTER COLUMN id SET DEFAULT nextval('public.product_images_id_seq');
SELECT setval('public.product_images_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM public.product_images), 0) + 1, 1), false);

-- reviews ------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.reviews_id_seq;
ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;
ALTER TABLE public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq');
SELECT setval('public.reviews_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM public.reviews), 0) + 1, 1), false);

-- gallery_images -----------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.gallery_images_id_seq;
ALTER SEQUENCE public.gallery_images_id_seq OWNED BY public.gallery_images.id;
ALTER TABLE public.gallery_images ALTER COLUMN id SET DEFAULT nextval('public.gallery_images_id_seq');
SELECT setval('public.gallery_images_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM public.gallery_images), 0) + 1, 1), false);

COMMIT;