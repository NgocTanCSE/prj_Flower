#!/bin/bash
# ---------------------------------------------------------------------------
# Chuẩn bị cơ sở dữ liệu:
#   1. Tạo namespace `auth` giả (Supabase chưa có dịch vụ Auth trên local)
#      - `auth.uid()` dùng trong migration (is_admin()).
#      - `auth.users` id: dùng để ràng buộc khóa ngoại `profiles.id`.
#   2. Chạy migration (0001_init.sql, 0002_site_settings.sql)
#   3. Chạy seed.sql (dữ liệu mẫu từ dự án)
# ---------------------------------------------------------------------------
set -e

DB=$POSTGRES_DB
DB_USER=$POSTGRES_USER
DB_PASSWORD=$POSTGRES_PASSWORD

# chờ db có sẵn
until pg_isready -U "$DB_USER" -d "$DB" -h 127.0.0.1 -p 5432 >/dev/null 2>&1; do
  echo "Waiting for db ($DB)..."
  sleep 2
done

echo "DB ready bough, preparing data..."

PSQL="psql -U "$DB_USER" -d "$DB" -h 127.0.0.1 -p 5432 -v ON_ERROR_STOP=1"

# 1. Tạo namespace auth (dễ dàng cho các migration liên quan đến auth.users)
echo "-- 1/ Tạo namespace auth giả (local Postgres)"
$PSQL <<'EOF'
CREATE SCHEMA IF NOT EXISTS auth;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY,
  role text NOT NULL DEFAULT 'user'
);
CREATE OR REPLACE FUNCTION auth.uid()
  RETURNS uuid
  LANGUAGE sql
  AS 'SELECT uuid_generate_v4()';
EOF

# 2. Migration (chạy theo thứ tự sắp xếp file)
echo "-- 2/ Áp dụng migration"
for f in /supabase_migrations/*.sql; do
  echo "  -> $f"
  $PSQL "$f"
done

# 3. Seed (chỉ chèn dữ liệu khởi động, chạy chậm một lần)
echo "-- 3/ Áp dụng seed.sql"
for f in /supabase_seed/*.sql; do
  echo "  -> $f"
  $PSQL "$f"
done

# 4. Xóa quyền on conflicts & đảm bảo rõ ràng
echo "-- 4/ Hoàn tất"
$PSQL -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;"
echo "Done. ✓"
