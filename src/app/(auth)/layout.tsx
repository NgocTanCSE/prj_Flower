/** Trang nhóm (auth): đăng nhập, đăng ký, quên/đặt lại mật khẩu. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <div className="pb-16 pt-8">{children}</div>
    </main>
  )
}
