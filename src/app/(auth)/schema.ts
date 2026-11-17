import { z } from 'zod'

/** Chỉ mật khẩu đăng nhập (email cố định). */
export const loginSchema = z.object({
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
})

/** Typed FormData -> login schema. */
export function parseLogin(formData: FormData) {
  return loginSchema.safeParse({
    password: String(formData.get('password')),
  })
}