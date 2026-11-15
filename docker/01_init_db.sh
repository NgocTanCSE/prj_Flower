#!/bin/bash
# ---------------------------------------------------------------------------
# Khởi tạo cơ sở dữ liệu (chạy một lần khi volume dữ liệu trống)
#
# 1. Namespace `auth` giả + 2 role `anon` / `authenticated` (Supabase có
#    sẵn khi chạy dịch vụ Auth; Postgres thuần không có -> tạo bổ sung để
#    các policy RLS của migration 0001_init.sql không lỗi).
#    - `auth.uid()` (hàm trả UUID)
#    - Bảng `auth.users` (id, role) — foreign key cho profiles.id
# 2. Áp dụng `supabase/migrations/*.sql` (0001_init, 0002_site_settings)
#
# Lưu ý: 0001_init.sql đã đổ đủ dữ liệu mẫu, seed.sql không cần chạy lại.
# ---------------------------------------------------------------------------
set -e

# chờ db sẵn sàng (unix socket, trust auth cho user postgres)
until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do
  echo "[init] db chưa sẵn sàng, chờ..."
  sleep 2
done
echo "[init] db đã sẵn sàng"

PSQL="psql -U $POSTGRES_USER -d $POSTGRES_DB -v ON_ERROR_STOP=1"

# --- Bước 1: namespace `auth` giả + role -------------------------------------------------
echo "[init] 1. Tạo namespace `auth` giả + vai `anon` / `authenticated`"
$PSQL <<'EOF'
-- Supabase Auth phục vụ bởi dịch vụ riêng; cục bộ đóng vai trò luồng này.
CREATE SCHEMA IF NOT EXISTS auth;

-- Extension `uuid-ossp` cung cấp uuid_generate_v4() (hàm `auth.uid()`)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bảng `auth.users` (id + role) — foreign key cho bảng profiles.id
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL DEFAULT 'user'
);

-- Hàm `auth.uid()` trả về UUID thuộc user đang đăng nhập
CREATE OR REPLACE FUNCTION auth.uid()
  RETURNS uuid
  LANGUAGE sql
  AS 'SELECT uuid_generate_v4()';

-- Vai `anon` / `authenticated` (Supabase có sẵn; Postgres thuần không có).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated;
  END IF;
END
$$;
EOF

# --- Bước 2: migration ------------------------------------------------------
echo "[init] 2. Áp dụng migration"
for f in $(ls /supabase_migrations/*.sql 2>/dev/null | sort); do
  echo "   -> $f"
  $PSQL -f "$f"
done

echo "[init] done."
