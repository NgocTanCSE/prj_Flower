/**
 * 404 page. Next.js tự động render khi không tìm thấy route (link hỏng hoặc
 * trỏ sai đường dẫn).
 */

export default function NotFound() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-[#fdfbfb] px-6">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-6xl font-bold text-[#8b5f65]">404</h1>
        <h2 className="text-xl font-medium">Trang không tồn tại</h2>
        <p className="text-[#5b5b5b]">
          Vì sự thu hút của mỗi yêu thích, trang bạn đang tìm kiếm không còn.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <a
            href="/"
            className="rounded-lg bg-[#8b5f65] px-4 py-2 text-sm text-white transition-colors hover:bg-[#764f54]"
          >
            Về trang chủ
          </a>
          <a
            href="/lien-he"
            className="rounded-lg border border-[#e8e1e1] bg-white px-4 py-2 text-sm text-[#5b5b5b]
              transition-colors hover:bg-[#f4eeef] hover:text-[#8b5f65]"
          >
            Liên hệ
          </a>
        </div>
      </div>
    </div>
  )
}
