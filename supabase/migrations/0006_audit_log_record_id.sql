-- ---------------------------------------------------------------------------
-- 0006_audit_log_record_id.sql
--
-- `audit_log.record_id` là bigint nhưng application ghi nhiều loại khóa khác
-- nhau: id số (products, reviews...), KHÓA TEXT (settings.key) và danh sách
-- "1,2,3" (bulk). Ghi text vào bigint khiến insert log thất bại và bị nuốt
-- im lặng trong `logAudit` → mất nhật ký.
--
-- Đổi sang text để log mọi loại định danh. An toàn: đây chỉ là bảng nhật ký.
-- ---------------------------------------------------------------------------

BEGIN;

ALTER TABLE public.audit_log
  ALTER COLUMN record_id TYPE text USING record_id::text;

COMMIT;