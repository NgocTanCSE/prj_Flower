import { getSettingsForAdmin, updateSettings } from '@/app/admin/api/actions/settings'
import { Card } from '@/components/admin/Card'
import { SETTING_KEYS } from '@/lib/getProducts'

export const metadata = {
  title: 'Cài đặt | Quản trị',
  description: 'Quản lý thông tin và cài đặt cửa hàng.',
}

/** Những nhóm field sẽ được hiển thị. */
const GROUPS: Record<string, string[]> = {
  'Thông tin cửa hàng': ['shop_name', 'about_text', 'phone', 'email', 'address', 'business_hours'],
  'Mạng xã hội': ['zalo_link', 'messenger_link', 'facebook_link', 'instagram_link'],
  'Giao dịch & tiền tệ': ['allow_orders', 'currency', 'language', 'shipping_fee', 'free_shipping_min', 'tax_rate'],
  'Chính sách & SEO': ['cancel_policy', 'delivery_note', 'seo_meta_title', 'seo_meta_description'],
  /** Logo/banner/màu chủ đạo — áp vào HTML/`src/styles/site.css` biếntheme */
  'Thương hiệu & Giao diện': ['shop_logo_url', 'shop_favicon_url', 'site_theme_primary', 'site_theme_body', 'shop_hero_title', 'shop_hero_subtitle'],
}

export default async function CaiDatPage() {
  let settings: Awaited<ReturnType<typeof getSettingsForAdmin>>
  try {
    settings = await getSettingsForAdmin()
  } catch {
    settings = []
  }

  return (
    <main className="mx-auto max-w-6xl py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Cài đặt trang</h1>
        <p className="text-sm text-[#5b5b5b]">Thông tin liên hệ, mạng xã hội, giờ mở cửa, SEO, thương hiệu.</p>
      </div>

      <form action={updateSettings}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Object.entries(GROUPS).map(([label, keys]) => (
            <Card key={label} title={label} subtitle={SETTING_KEYS[keys[0]]} variant="shadow">
              <div className="flex flex-col gap-4">
                {keys.map((key) =>
                  key === 'about_text' || key === 'business_hours' || key === 'cancel_policy' || key === 'delivery_note' || key === 'seo_meta_description' ? (
                    <label key={key} className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-[#5b5b5b]">{SETTING_KEYS[key]}</span>
                      <textarea
                        name={key}
                        defaultValue={find(settings, key)}
                        placeholder={SETTING_KEYS[key]}
                        rows={3}
                        className="w-full rounded-lg border border-[#e8e1e1] px-3 py-2 text-sm outline-none
                          focus:ring-2 focus:ring-[#8b5f65]/40"
                      />
                    </label>
                  ) : (
                    <label key={key} className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-[#5b5b5b]">{SETTING_KEYS[key]}</span>
                      <input
                        type={key.endsWith('_link') || key.endsWith('_url') ? 'url' : 'text'}
                        name={key}
                        defaultValue={find(settings, key)}
                        placeholder={SETTING_KEYS[key]}
                        className="w-full rounded-lg border border-[#e8e1e1] px-3 py-2 text-sm outline-none
                          focus:ring-2 focus:ring-[#8b5f65]/40"
                      />
                    </label>
                  )
                )}
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-[#8b5f65] px-5 py-2.5 text-sm font-medium text-white
              transition-colors hover:bg-[#764f54] focus:ring-2 focus:ring-[#8b5f65]/60"
          >
            Lưu cài đặt
          </button>
        </div>
      </form>
    </main>
  )
}

function find(settings: { key: string; value: string }[], key: string) {
  const { value = '' } = settings.find((s) => s.key === key) ?? {}
  return value
}
