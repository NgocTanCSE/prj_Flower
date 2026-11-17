'use client';

interface NewsletterProps {
  title?: string;
  subtitle?: string;
}

export function Newsletter({ title, subtitle }: NewsletterProps) {
  const titleT = title !== undefined ? title : 'Đăng ký nhận tin mới';
  const subtitleT =
    subtitle !== undefined
      ? subtitle
      : 'Đăng ký email để nhận những bó hoa tươi và ưu đãi đặc biệt đầu tiên.';

  return (
    <section className="section bg-[var(--color-tag-bg)] py-12">
      <div className="container mx-auto max-w-2xl text-center">
        <h2 className="text-3xl text-[var(--color-ink)] mb-4">{titleT}</h2>
        <p className="text-lg text-[var(--color-ink-light)] mb-6">{subtitleT}</p>
        <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-lg bg-white shadow-[var(--shadow-card)]">
          <input
            type="email"
            placeholder="Nhập email của bạn"
            className="flex-1 px-6 py-3 rounded-full border border-[var(--color-border)] bg-white text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-lighter)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <button type="button" className="btn btn-primary px-8 rounded-full">
            Đăng ký
          </button>
        </div>
        <p className="text-sm text-[var(--color-ink-lighter)] mt-4">
          Chúng tôi sẽ gửi tin mới và ưu đãi đặc biệt tới email của bạn.
        </p>
      </div>
    </section>
  );
}