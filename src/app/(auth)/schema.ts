import { z } from 'zod'

export const passwordSchema = z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự')

/** Chỉ mật khẩu đăng nhập (email cố định). */
export const loginSchema = z.object({
  password: passwordSchema,
})

/** Typed FormData -> login schema. */
export function parseLogin(formData: FormData) {
  return loginSchema.safeParse({
    password: String(formData.get('password')),
  })
}

/** Typed FormData -> mật khẩu mới khi đặt lại. */
export function parseResetPassword(formData: FormData) {
  return z.object({
    password: passwordSchema,
    passwordConfirm: z.string(),
  }).safeParse({
    password: String(formData.get('password')),
    passwordConfirm: String(formData.get('passwordConfirm')),
  })
}