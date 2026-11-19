/**
 * Sinh khóa chính `bigint` cho các bảng mà cột `id` chưa có DEFAULT/IDENTITY
 * trong schema (xem `supabase/migrations/0005_generated_ids.sql`).
 *
 * Vì sao cần: `0001_init.sql` khai báo `id bigint PRIMARY KEY` nhưng KHÔNG có
 * default, nên mọi INSERT không truyền `id` sẽ lỗi
 * "null value in column \"id\" ... violates not-null constraint".
 * Migration 0005 bổ sung sequence ở tầng DB; hàm này là lớp bảo hiểm để ứng
 * dụng vẫn ghi được ngay cả khi migration chưa được áp dụng.
 *
 * Giá trị = `Date.now() * 4000 + counter(0..3999)`:
 *   - ~7.2e15 (năm 2026), vẫn nằm dưới `Number.MAX_SAFE_INTEGER` (9.007e15)
 *     → số nguyên chính xác khi gửi qua JSON. (Còn an toàn tới khoảng năm 2041.)
 *   - Luôn lớn hơn id seed (1..16) nên không đụng dữ liệu mẫu.
 *   - Bộ đếm tăng dần trong cùng mili-giây: quan trọng cho **import CSV** (tạo
 *     hàng trăm id trong một vòng lặp). Nếu chỉ dùng random 0..999, xác suất
 *     trùng trong 500 id cùng mili-giây là rất cao.
 */

const ID_STRIDE = 4000

let lastMillisecond = 0
let sequence = 0

export function newBigIntId(): number {
  const now = Date.now()

  if (now === lastMillisecond) {
    // Cùng mili-giây → tăng bộ đếm (quay vòng sau ID_STRIDE-1).
    sequence = (sequence + 1) % ID_STRIDE
  } else {
    lastMillisecond = now
    // Điểm bắt đầu ngẫu nhiên để hai Worker isolate ít đụng nhau hơn.
    sequence = Math.floor(Math.random() * ID_STRIDE)
  }

  return now * ID_STRIDE + sequence
}