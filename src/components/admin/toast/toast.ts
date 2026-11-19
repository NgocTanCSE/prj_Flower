/**
 * Toast store – cửa sổ thông báo dạng module (không cần Provider).
 *
 * Lưu trữ ở mức module + event emitter để bất kỳ component nào cũng gọi
 * `notifyToast(...)` được mà không cần đóng gói trong context tree.
 * `<ToastContainer />` (được mount một lần ở AdminLayout) theo dõi store
 * và render. File này phải là 'use client' để hooks hoạt động.
 */

'use client'

import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: number
  type: ToastType
  message: string
}

let nextId = 1
let toasts: ToastMessage[] = []
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

/** Thêm một thông báo mới (hiển thị trên cùng). */
export function notifyToast(message: string, type: ToastType = 'success'): void {
  toasts = [...toasts, { id: nextId++, type, message }]
  emitChange()
}

/** Bỏ một thông báo khỏi danh sách. */
export function dismissToast(id: number): void {
  toasts = toasts.filter((t) => t.id !== id)
  emitChange()
}

/** Hook dùng bên trong `<ToastContainer />`. */
export function useToasts() {
  const [state, setState] = useState<ToastMessage[]>(toasts)

  useEffect(() => {
    const callback = () => setState([...toasts])
    listeners.add(callback)
    return () => {
      listeners.delete(callback)
    }
  }, [])

  return { toasts: state, dismiss: dismissToast }
}
