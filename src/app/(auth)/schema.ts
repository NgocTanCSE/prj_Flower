import { z } from 'zod'

// ---------------------------------------------------------------------------
// validation các form của nhóm (auth): login, register, forgot-password, reset-password
// ---------------------------------------------------------------------------

/** Email + mật khẩu đăng nhập. */
export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ').max(256),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
})

/** Đăng ký: email + mật khẩu (xác nhận). */
export const registerSchema = z
  .object({
    email: z.string().email('Email không hợp lệ').max(256),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    passwordConfirm: z.string().min(6, 'Xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['passwordConfirm'],
  })

/** Gửi link đặt lại mật khẩu qua email. */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ').max(256),
})

/** Đặt mật khẩu mới sau khi đọc magic link (reset password). */
export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    passwordConfirm: z.string().min(6, 'Xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['passwordConfirm'],
  })

/** Typed FormData -> login schema. */
export function parseLogin(formData: FormData) {
  return loginSchema.safeParse({
    email: String(formData.get('email')),
    password: String(formData.get('password')),
  })
}

/** Typed FormData -> register schema. */
export function parseRegister(formData: FormData) {
  return registerSchema.safeParse({
    email: String(formData.get('email')),
    password: String(formData.get('password')),
    passwordConfirm: String(formData.get('passwordConfirm')),
  })
}

/** Typed FormData -> forgot-password schema. */
export function parseForgotPassword(formData: FormData) {
  return forgotPasswordSchema.safeParse({
    email: String(formData.get('email')),
  })
}

/** Typed FormData -> reset-password schema. */
export function parseResetPassword(formData: FormData) {
  return resetPasswordSchema.safeParse({
    password: String(formData.get('password')),
    passwordConfirm: String(formData.get('passwordConfirm')),
  })
}
