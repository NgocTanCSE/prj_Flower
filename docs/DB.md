# Cơ sở dữ liệu Tiệm Hoa CoBeCuBe

> Tài liệu kỹ thuật cho Next.js + Supabase, RLS xác định quyền truy cập.

## Bảng (Tables)

| Bảng            | Chứa
| --------------- | ---------------------------------------
| `profiles`      | Hồ sơ người dùng, key từ `auth.users`
| `categories`    | Danh mục hoa (phân cấp 1 cấp)
| `products`      | Sản phẩm hoa, slug deterministic
| `product_images`| Ảnh minh họa
| `reviews`       | Bình luận có phê duyệt
| `gallery_images`| Ảnh gallery
| `settings`      | Cấu hình website (key-value)
| `audit_log`     | Nhật ký vận hành

## Cột chuẩn

### `products`
```sql
CREATE TABLE public.products (
  id bigint PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  short_desc text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  price bigint NOT NULL DEFAULT 0,
  old_price bigint NULL,
  category_id bigint NOT NULL REFERENCES categories(id),
  weight numeric(8,2) NOT NULL DEFAULT 0,
  featured_is boolean NOT NULL DEFAULT false,
  sort_order bigint NOT NULL DEFAULT 999,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  views bigint NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```
- Slug: `hoa-1`..`hoa-8`, status `draft`/`published`, có `weight`, `featured_is`.

### `reviews`
- `rating` 1..5, `is_approved` chỉ hiển thị cho public nếu `true`.

### `settings`
- Key-value cấu hình (20 mục mặc định: shop_name, phone, email, zalo_link...).

### `product_images`
- `product_id` FK + `on delete cascade`, `is_primary` = 1.

## Row Level Security (RLS)

- Bật trên 8 bảng. Mặc định DENY.
- Công khai (`anon`, `authenticated`):
  - `products`: `status = 'published' AND is_active = true`
  - `gallery_images`: `is_active = true`
  - `reviews`: `is_approved = true`
  - `categories`, `product_images`, `settings`: `SELECT` toàn bộ
- Admin (`public.is_admin()`): INSERT, UPDATE, DELETE, SELECT toàn bộ các bảng.

### Function `is_admin()`
```sql
CREATE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
```
- Kiểm tra `profiles.role = 'admin'` cho `auth.uid()`.

### Trigger `updated_at`
- Tự động cập nhật mọi khi UPDATE bảng `update_updated_at()` (BEFORE ROW).

## Seed
Chạy `supabase/seed.sql` sau khi push migration (5 categories, 8 products, 16 product_images, 4 reviews, 5 gallery, 20 settings, 1 audit_log).
