'use client';

interface NewsletterProps {
  title?: string;
  subtitle?: string;
}

export function Newsletter({ title, subtitle }: NewsletterProps) {
  const titleT = title !== undefined ? title : 'Ch\u1ecdm m\u1edbi v\u1ee5 x\u1ebdi';
  const subtitleT = subtitle !== undefined ? subtitle : 'H\u01a1n d\u1ea7u \u0111i\u1ec1n c\u1ebafn t\u01b0 ch\u00ednh. Nh\u1eefng ch\u1ecdm c\u1ef1c m\u1edbi ph\u1ee5c v\u1ee5. T\u1eeb c\u00e1c h\u00e0ng ph\u1ee5c ch\u1ecdt c\u1ea1n, m\u00ecnh mu\u1ed1n th\u00ea l\u1eddi h\u01a1n.';

  return (
    <section className="section bg-[var(--color-tag-bg)] py-12">
      <div className="container mx-auto max-w-2xl text-center">
        <h2 className="text-3xl text-[var(--color-ink)] mb-4">{titleT}</h2>
        <p className="text-lg text-[var(--color-ink-light)] mb-6">{subtitleT}</p>
        <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-lg bg-white shadow-[var(--shadow-card)]">
          <input
            type="email"
            placeholder="Email c\u1ee7a b\u1ea1n"
            className="flex-1 px-6 py-3 rounded-full border border-[var(--color-border)] bg-white text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-lighter)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <button type="button" className="btn btn-primary px-8 rounded-full">
            \u0110\u1eb7ng k\u00fd
          </button>
        </div>
        <p className="text-sm text-[var(--color-ink-lighter)] mt-4">
          B\u1eadt email m\u1edbi. N\u00ean l\u01ea5y l\u01eddi v\u01e8n t\u00een c\u1ee7a.
        </p>
      </div>
    </section>
  );
}
