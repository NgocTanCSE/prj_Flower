'use client'

/**
 * SettingsForm – form cài đặt trang (client wrapper).
 *
 * Bố cục "master–detail": danh sách nhóm cài đặt bên trái (desktop) hoặc
 * dropdown `<select>` (mobile) điều khiển khung chỉnh sửa bên phải. Nhờ vậy
 * mỗi nhóm có trọn không gian để hiển thị field (2 cột) thay vì 5 thẻ nhỏ
 * xếp chồng như trước.
 *
 * Lưu ý kỹ thuật: TẤT CẢ panel đều nằm trong DOM (panel không active dùng
 * thuộc tính `hidden`), nên khi submit chỉ những field đã đổi mới gửi lên —
 * server action chỉ ghi các key có giá trị, không nhóm nào bị ghi đè rỗng.
 *
 * Gọi server action `updateSettings` qua `startTransition` để có thể hiển thị
 * toast thành công / lỗi — form server-action thuần chỉ revalidate và im lặng.
 */

import { useId, useRef, useState, useTransition } from 'react'

import { Button } from '@/components/admin/Button'
import { Card } from '@/components/admin/Card'
import { ColorField, normalizeHex } from '@/components/admin/ColorField'
import { StableLabel } from '@/components/admin/StableLabel'
import { notifyToast } from '@/components/admin/toast/toast'
import { updateSettings, uploadHeroImage } from '@/app/admin/api/actions/settings'
import { COLOR_SETTING_KEYS, SETTING_DEFAULTS, SETTING_KEYS } from '@/lib/getProducts'
import { COMPRESS_PRESETS, compressImage, formatBytes } from '@/lib/image-compress'

interface SettingGroup {
  /** id ổn định dùng cho tab / aria-controls / id của panel. */
  id: string
  label: string
  description: string
  keys: string[]
}

/**
 * Những nhóm field sẽ được hiển thị.
 * Thứ tự key được xếp để textarea (full-width) nằm cuối nhóm, tránh lỗ hổng
 * ở lưới 2 cột.
 */
const GROUPS: SettingGroup[] = [
  {
    id: 'store',
    label: 'Thông tin cửa hàng',
    description: 'Tên trang, liên hệ, giới thiệu, giờ mở cửa.',
    keys: ['shop_name', 'phone', 'email', 'address', 'business_hours', 'about_text'],
  },
  {
    id: 'social',
    label: 'Mạng xã hội',
    description: 'Zalo, Messenger, Facebook, Instagram.',
    keys: ['zalo_link', 'facebook_link', 'messenger_link', 'instagram_link'],
  },
  {
    id: 'commerce',
    label: 'Giao dịch & tiền tệ',
    description: 'Đơn hàng, tiền tệ, phí vận chuyển, thuế.',
    keys: ['allow_orders', 'currency', 'language', 'shipping_fee', 'free_shipping_min', 'tax_rate'],
  },
  {
    id: 'hero',
    label: 'Banner trang chủ (Hero)',
    description: 'Bật/tắt banner lớn, tiêu đề, phụ đề, số ảnh decor.',
    keys: ['shop_hero_enabled', 'shop_hero_title', 'shop_hero_subtitle', 'shop_hero_image_url', 'hero_panel_count'],
  },
  {
    id: 'policy-seo',
    label: 'Chính sách & SEO',
    description: 'Chính sách hủy, ghi chú giao hàng, thẻ meta.',
    keys: ['seo_meta_title', 'seo_meta_description', 'cancel_policy', 'delivery_note'],
  },
  {
    id: 'brand',
    label: 'Thương hiệu & giao diện',
    description: 'Logo, favicon, màu chủ đạo, màu chữ.',
    keys: ['shop_logo_url', 'shop_favicon_url', 'site_theme_primary', 'site_theme_body'],
  },
]

const TEXTAREA_KEYS = new Set(['about_text', 'business_hours', 'cancel_policy', 'delivery_note', 'seo_meta_description'])

/** Các field nhập số. */
const NUMBER_KEYS = new Set(['hero_panel_count'])

/** Field chiếm trọn 1 hàng (textarea, toggle, số ít). */
const FULL_WIDTH_KEYS = new Set([...TEXTAREA_KEYS, 'shop_hero_enabled', 'shop_hero_image_url', 'hero_panel_count'])

/** Giá trị được coi là TẮT (dùng cho cờ bật/tắt như hero). */
const OFF_VALUES = new Set(['0', 'false', 'off', 'no', 'hidden'])

/** Cờ bật/tắt: mặc định BẬT khi chưa cấu hình. */
function isEnabled(value: string): boolean {
  return !OFF_VALUES.has(value.trim().toLowerCase())
}

interface SettingsFormProps {
  settings: { key: string; value: string }[]
  /** Ảnh thư viện để chọn nhanh làm nền banner. */
  galleryImages?: { url: string; alt?: string }[]
}

function find(settings: SettingsFormProps['settings'], key: string) {
  const { value = '' } = settings.find((s) => s.key === key) ?? {}
  return value
}

/** Kiểu input hợp lý theo tên key. */
function inputType(key: string) {
  if (NUMBER_KEYS.has(key)) return 'number'
  if (key.endsWith('_link') || key.endsWith('_url')) return 'url'
  return 'text'
}

const FIELD_CLASS =
  'w-full rounded-lg border border-[#e8e1e1] px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#8b5f65]/40'

/** Gợi ý ngắn dưới các field dễ gây nhầm lẫn. */
const KEY_HINTS: Record<string, string> = {
  shop_logo_url: 'Để trống để dùng tên shop làm logo.',
  shop_favicon_url: 'Để trống sẽ dùng /favicon.svg mặc định.',
  site_theme_primary: 'Màu nhấn cho nút, liên kết và giá sản phẩm. Để trống = dùng mặc định.',
  site_theme_body: 'Màu chữ nội dung chính trên nền sáng. Để trống = dùng mặc định.',
  hero_panel_count: 'Từ 2 đến 5 ảnh decor bên cạnh banner.',
}

export function SettingsForm({ settings, galleryImages = [] }: SettingsFormProps) {
  const [pending, startTransition] = useTransition()
  const [activeId, setActiveId] = useState(GROUPS[0].id)
  // Ảnh nền banner: controlled để preview + input + thư viện luôn đồng bộ.
  const [heroImage, setHeroImage] = useState(() => find(settings, 'shop_hero_image_url'))
  const [heroUploading, setHeroUploading] = useState(false)
  const selectId = useId()
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const activeIndex = Math.max(
    0,
    GROUPS.findIndex((g) => g.id === activeId)
  )
  const active = GROUPS[activeIndex]

  /** Roving tabindex: mũi tên di chuyển giữa các tab (chuẩn ARIA tabs). */
  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const last = GROUPS.length - 1
    let next = activeIndex
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = activeIndex === last ? 0 : activeIndex + 1
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = activeIndex === 0 ? last : activeIndex - 1
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = last
    else return
    event.preventDefault()
    setActiveId(GROUPS[next].id)
    tabRefs.current[next]?.focus()
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      try {
        await updateSettings(formData)
        notifyToast('Đã lưu cài đặt.', 'success')
      } catch (error) {
        notifyToast(error instanceof Error ? error.message : 'Lưu cài đặt thất bại.', 'error')
      }
    })
  }

  /** Upload ảnh banner lên storage rồi gán URL vào ô cài đặt. */
  async function handleHeroUpload(event: React.ChangeEvent<HTMLInputElement>) {
    // Giữ tham chiếu input trước `await`: `event.currentTarget` bị null hoá sau
    // khi handler chạy xong, còn ta cần reset value ở `finally`.
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return

    setHeroUploading(true)
    try {
      // Nén ảnh (WebP, cạnh dài ≤ 1920px cho banner) trước khi đẩy lên Supabase.
      // Ảnh nhỏ/GIF/lỗi → dùng file gốc.
      const compressed = await compressImage(file, COMPRESS_PRESETS.hero)

      const formData = new FormData()
      formData.set('file', compressed.file)
      const res = await uploadHeroImage(formData)
      if (res.ok && res.url) {
        setHeroImage(res.url)
        const note = compressed.compressed
          ? ` (${formatBytes(compressed.originalSize)} → ${formatBytes(compressed.size)})`
          : ''
        notifyToast(`Đã tải ảnh banner.${note}`, 'success')
      } else {
        notifyToast(res.error ?? 'Upload ảnh banner thất bại.', 'error')
      }
    } catch (error) {
      notifyToast(error instanceof Error ? error.message : 'Upload ảnh banner thất bại.', 'error')
    } finally {
      setHeroUploading(false)
      input.value = ''
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* ---------- Thanh hành động (tĩnh, không dính theo khi cuộn) ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e8e1e1] bg-white px-4 py-3">
        <p className="text-sm text-[#5b5b5b]">
          Đang chỉnh: <span className="font-medium text-[#1a1a1a]">{active.label}</span>
        </p>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-[#999] sm:inline">Mọi thay đổi trên tất cả các nhóm đều được lưu.</span>
          <Button type="submit" disabled={pending}>
            <StableLabel reserve="Lưu cài đặt">
              {pending ? 'Đang lưu...' : 'Lưu cài đặt'}
            </StableLabel>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[19rem_minmax(0,1fr)]">
        {/* ---------- Điều hướng nhóm cài đặt ---------- */}
        <div className="xl:sticky xl:top-6 xl:self-start">
          {/* Mobile: dropdown */}
          <div className="xl:hidden">
            <label htmlFor={selectId} className="mb-2 block text-sm font-medium text-[#5b5b5b]">
              Nhóm cài đặt
            </label>
            <select
              id={selectId}
              value={activeId}
              onChange={(e) => setActiveId(e.target.value)}
              className={`${FIELD_CLASS} bg-white`}
            >
              {GROUPS.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.label}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop: danh sách dọc (ARIA tabs) */}
          <nav aria-label="Nhóm cài đặt" className="hidden xl:block">
            <ul
              role="tablist"
              aria-orientation="vertical"
              className="flex flex-col gap-1 rounded-xl border border-[#e8e1e1] bg-white p-2 shadow-[0_8px_24px_rgba(92,58,64,0.08)]"
            >
              {GROUPS.map((group, index) => {
                const selected = group.id === activeId
                return (
                  <li key={group.id} role="presentation">
                    <button
                      type="button"
                      role="tab"
                      id={`tab-${group.id}`}
                      aria-selected={selected}
                      aria-controls={`panel-${group.id}`}
                      tabIndex={selected ? 0 : -1}
                      ref={(el) => {
                        tabRefs.current[index] = el
                      }}
                      onClick={() => setActiveId(group.id)}
                      onKeyDown={handleTabKeyDown}
                      className={`flex w-full flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left transition-colors ${
                        selected
                          ? 'bg-[#8b5f65] text-white'
                          : 'text-[#5b5b5b] hover:bg-[#f4eeef] hover:text-[#8b5f65]'
                      }`}
                    >
                      <span className="text-sm font-medium">{group.label}</span>
                      <span className={`text-xs ${selected ? 'text-white/75' : 'text-[#999]'}`}>
                        {group.keys.length} mục
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>

        {/* ---------- Khung chỉnh sửa ---------- */}
        <div className="min-w-0">
          {GROUPS.map((group) => {
            const selected = group.id === activeId
            return (
              <section
                key={group.id}
                id={`panel-${group.id}`}
                role="tabpanel"
                aria-labelledby={`tab-${group.id}`}
                hidden={!selected}
              >
                <Card title={group.label} subtitle={group.description} variant="shadow" className="p-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {group.keys.map((key) => {
                      const fullWidth = FULL_WIDTH_KEYS.has(key)
                      const label = (
                        <span className="text-sm font-medium text-[#5b5b5b]">{SETTING_KEYS[key]}</span>
                      )

                      // Màu theme: 3 cách chọn đồng bộ — bảng màu, color picker, mã hex.
                      // Giá trị mặc định luôn hiển thị kể cả khi DB chưa có key.
                      if ((COLOR_SETTING_KEYS as readonly string[]).includes(key)) {
                        return (
                          <ColorField
                            key={key}
                            name={key}
                            label={SETTING_KEYS[key]}
                            defaultValue={
                              normalizeHex(find(settings, key)) ?? SETTING_DEFAULTS[key] ?? '#8b5f65'
                            }
                            variant={key === 'site_theme_primary' ? 'primary' : 'ink'}
                            hint={KEY_HINTS[key]}
                          />
                        )
                      }

                      // Cờ bật/tắt: chọn Hiển thị / Ẩn.
                      if (key === 'shop_hero_enabled') {
                        return (
                          <label key={key} className="flex flex-col gap-1.5 md:col-span-2">
                            {label}
                            <select
                              name={key}
                              defaultValue={isEnabled(find(settings, key)) ? '1' : '0'}
                              className={FIELD_CLASS}
                            >
                              <option value="1">Hiển thị banner</option>
                              <option value="0">Ẩn banner</option>
                            </select>
                            <span className="text-xs text-[#999]">
                              Tắt sẽ ẩn toàn bộ banner lớn ở đầu trang chủ; nội dung bên dưới vẫn giữ nguyên.
                            </span>
                          </label>
                        )
                      }

                      // Ảnh nền banner: URL + tải lên + chọn từ thư viện + xem trước.
                      if (key === 'shop_hero_image_url') {
                        return (
                          <div key={key} className="flex flex-col gap-2 md:col-span-2">
                            {label}
                            <div className="grid gap-4 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
                              {/* Xem trước */}
                              <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-[#e8e1e1] bg-[#faf5fa]">
                                {heroImage ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={heroImage}
                                    alt="Xem trước ảnh nền banner"
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="flex h-full items-center justify-center px-3 text-center text-xs text-[#999]">
                                    Chưa đặt — đang dùng ảnh đầu tiên của thư viện
                                  </span>
                                )}
                              </div>

                              <div className="flex min-w-0 flex-col gap-3">
                                <input
                                  type="text"
                                  name={key}
                                  value={heroImage}
                                  onChange={(e) => setHeroImage(e.target.value)}
                                  placeholder="Dán URL ảnh, hoặc tải lên / chọn bên dưới"
                                  className={FIELD_CLASS}
                                />

                                <div className="flex flex-wrap items-center gap-2">
                                  <label
                                    className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#e8e1e1] bg-white px-3 py-1.5 text-sm font-medium text-[#8b5f65] transition-colors hover:bg-[#f4eeef] ${
                                      heroUploading ? 'pointer-events-none opacity-60' : ''
                                    }`}
                                  >
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp,image/gif"
                                      className="sr-only"
                                      onChange={handleHeroUpload}
                                      disabled={heroUploading}
                                    />
                                    <StableLabel reserve="Đang xử lý...">
                                      {heroUploading ? 'Đang xử lý...' : 'Tải ảnh lên'}
                                    </StableLabel>
                                  </label>
                                  {heroImage ? (
                                    <button
                                      type="button"
                                      onClick={() => setHeroImage('')}
                                      className="rounded-lg border border-[#e8e1e1] bg-white px-3 py-1.5 text-sm text-[#5b5b5b] transition-colors hover:bg-[#f4eeef]"
                                    >
                                      Dùng ảnh đầu thư viện
                                    </button>
                                  ) : null}
                                </div>

                                {galleryImages.length > 0 ? (
                                  <div>
                                    <p className="mb-1.5 text-xs font-medium text-[#5b5b5b]">Hoặc chọn từ thư viện</p>
                                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                                      {galleryImages.slice(0, 18).map((img) => {
                                        const isSelected = img.url === heroImage
                                        return (
                                          <button
                                            type="button"
                                            key={img.url}
                                            onClick={() => setHeroImage(img.url)}
                                            title={img.alt || 'Chọn ảnh này'}
                                            aria-pressed={isSelected}
                                            className={`aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                                              isSelected
                                                ? 'border-[#8b5f65]'
                                                : 'border-transparent hover:border-[#8b5f65]/40'
                                            }`}
                                          >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                              src={img.url}
                                              alt={img.alt || 'Ảnh thư viện'}
                                              className="h-full w-full object-cover"
                                            />
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        )
                      }

                      return (
                        <label
                          key={key}
                          className={`flex flex-col gap-1.5 ${fullWidth ? 'md:col-span-2' : ''}`}
                        >
                          {label}
                          {TEXTAREA_KEYS.has(key) ? (
                            <textarea
                              name={key}
                              defaultValue={find(settings, key) || SETTING_DEFAULTS[key] || ''}
                              placeholder={SETTING_KEYS[key]}
                              rows={3}
                              className={FIELD_CLASS}
                            />
                          ) : (
                            <input
                              type={inputType(key)}
                              name={key}
                              defaultValue={find(settings, key) || SETTING_DEFAULTS[key] || ''}
                              placeholder={SETTING_KEYS[key]}
                              min={NUMBER_KEYS.has(key) ? 2 : undefined}
                              max={NUMBER_KEYS.has(key) ? 5 : undefined}
                              className={FIELD_CLASS}
                            />
                          )}
                          {KEY_HINTS[key] ? (
                            <span className="text-xs text-[#999]">{KEY_HINTS[key]}</span>
                          ) : null}
                        </label>
                      )
                    })}
                  </div>
                </Card>
              </section>
            )
          })}
        </div>
      </div>
    </form>
  )
}