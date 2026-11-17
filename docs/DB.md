# Cơ sở dữ liệu Tiệm Hoa Shop Flower

> Tài liệu kỹ thuật cho Next.js + Supabase, RLS xác định quyền truy cập.
>
> Migration: `supabase/migrations/0001_init.sql` (8 bảng + RLS + hàm `is_admin()` + trigger tự cập nhật `updated_at`).
> Giao diện shop: `supabase/migrations/0002_site_settings.sql` (6 khóa đặt tên shop / logo / favicon / màu / banner SEO).
> Chạy `supabase/seed.sql` để điền dữ liệu mẫu (5 danh mục, 8 sản phẩm, 16 ảnh SP, 4 review, 5 gallery, 26 cài đặt).

## Bảng (Tables)

| Bảng             | Chứa
| ---------------- | ---------------------------------------
| `profiles`       | Hồ sơ người dùng, `role` `user` / `admin`
| `categories`     | Danh mục hoa (phân cấp 1 cấp)
| `products`       | Sản phẩm hoa, slug deterministic
| `product_images` | Ảnh sản phẩm, 1 ảnh gốc (`is_primary`)
| `reviews`        | Bình luận, chỉ hiển thị khi `is_approved = true`
| `gallery_images` | Ảnh gallery, lọc theo category và trạng thái
| `settings`       | Cấu hình website (key-value)
| `audit_log`      | Nhật ký vận hành (chỉ admin mới đọc/ghi)

## Cột chuẩn

### `profiles`
```sql
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users (id) ON DELETE CASCADE PRIMARY KEY,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  full_name text NOT NULL DEFAULT '',
  avatar_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### `categories`
```sql
CREATE TABLE public.categories (
  id bigint PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL,
  parent_id bigint NULL,
  sort_order bigint NOT NULL DEFAULT 999,
  active boolean NOT NULL DEFAULT true,
  CONSTRAINT categories_slug_key UNIQUE (slug)
);
```

### `products`
```sql
CREATE TABLE public.products (
  id bigint PRIMARY KEY,
  slug text NOT NULL,
  name text NOT NULL,
  short_desc text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  price bigint NOT NULL DEFAULT 0 CHECK (price >= 0),
  old_price bigint NULL CHECK (old_price >= 0),
  category_id bigint NOT NULL REFERENCES categories(id),
  weight numeric(8,2) NOT NULL DEFAULT 0 CHECK (weight >= 0),
  featured_is boolean NOT NULL DEFAULT false,
  sort_order bigint NOT NULL DEFAULT 999,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  views bigint NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_slug_key UNIQUE (slug)
);
```
- Slug: `hoa-1`..`hoa-8`, status `draft`/`published`, có `[weight, featured_is]`.

### `product_images`
- `product_id` FK + `on delete cascade`, `is_primary` = 1 ảnh gốc mỗi sản phẩm.

### `reviews`
- `rating` 1..5, `is_approved` chỉ hiển thị cho công khai nếu `true`.

### `gallery_images`
- `url text`, `alt text`, `category text`, `sort_order bigint`, `is_active boolean`.

### `settings`
- Key-value cấu hình website (26 mục mặc định khi chạy `seed.sql`).
- Admin chỉnh qua `/admin/cai-dat`:
  + Thông tin cửa hàng: `shop_name`, `about_text`, `phone`, `email`, `address`, `business_hours`
  + Mạng xã hội: `zalo_link`, `messenger_link`, `facebook_link`, `instagram_link`
  + Giao dịch & tiền tệ: `allow_orders`, `currency`, `language`, `shipping_fee`, `free_shipping_min`, `tax_rate`
  + Chính sách & SEO: `cancel_policy`, `delivery_note`, `seo_meta_title`, `seo_meta_description`
  + Giao diện & thương hiệu (mới): `shop_logo_url`, `shop_favicon_url`, `site_theme_primary`, `site_theme_body`, `shop_hero_title`, `shop_hero_subtitle`

### `audit_log`
> ⚠️ Cột `table` là **từ khóa của Postgres**, bắt buộc đặt trong dấu nháy kép `"table"` khi viết SQL thuần:
> ```sql
> CREATE TABLE public.audit_log (
>   id bigserial PRIMARY KEY,
>   user_id uuid NULL,
>   action text NOT NULL,
>   "table" text NOT NULL,
>   record_id bigint NULL,
>   data jsonb NOT NULL DEFAULT '{}'::jsonb,
>   created_at timestamptz NOT NULL DEFAULT now()
> );
> ```
> Code app dùng Supabase client (JSON payload) → không dính lỗi này. Plugin아는 từ SQL Editor nếu ghi `INSERT INTO audit_log (... "table"...)`.

## Row Level Security (RLS)

- Bật trên 8 bảng. Mặc định DENY.
- Công khai (`anon`, `authenticated`):
  - `products`: `status = 'published' AND is_active = true`
  - `gallery_images`: `is_active = true`
  - `reviews`: `is_approved = true`
  - `categories`, `product_images`, `settings`: `SELECT` toàn bộ
- Admin (`public.is_admin()`): INSERT, UPDATE, DELETE, SELECT toàn bộ các bảng.

### Hàm `is_admin()`
```sql
CREATE FUNCTION public.is_admin()
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
```
- Kiểm tra `profiles.role = 'admin'` cho `auth.uid()` đang đăng nhập.

### Trigger `updated_at`
- Tự động cập nhật mọi khi UPDATE bảng `update_updated_at()` (BEFORE ROW).

## Seed
Chạy `supabase/seed.sql` sau khi push migration (5 categories, 8 products, 16 product_images, 4 reviews, 5 gallery, 26 settings, 1 audit_log).
