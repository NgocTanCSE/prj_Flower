'use client';

import Image from 'next/image';

import type { Review } from '@/lib/getProducts';

interface TestimonialsProps {
  reviews: Review[];
  title?: string;
  subtitle?: string;
}

export function Testimonials({ reviews = [], title, subtitle }: TestimonialsProps) {
  const titleT = title !== undefined ? title : 'Khách hàng nói gì về chúng tôi';
  const subtitleT = subtitle !== undefined ? subtitle : 'Mỗi đóa hoa là một niềm tin tưởng. Điểm bán của shop. Những bàn công việc gia đình hay doanh nghiệp, thông qua mùa mắt. Chúng tôi làm cho cuộc sống có thú hoa. Hơn 2000 cách chỉ phụ vụ tận.'

  return (
    <section className="section bg-[var(--color-tag-bg)]">
      <div className="container">
        <div className="section-head flex flex-col gap-3 md:items-center text-center">
          <h2 className="text-4xl text-[var(--color-ink)]">{titleT}</h2>
          {subtitleT !== undefined && <p className="text-lg text-[var(--color-ink-light)]">{subtitleT}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.length > 0 ? (
            reviews.map((r) => (
              <article key={r.id} className="bg-white rounded-lg border border-[var(--color-border)] p-6 shadow-[var(--shadow-card)]">
                <div className="flex mb-4 text-[var(--color-primary)]" aria-label={`${r.rating} sao`}>
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-5 h-5 ${i < r.rating ? 'fill-current' : 'text-[var(--color-border)]'}`} viewBox="0 0 24 24">
                      <path d="M12 3l3.3 6.7L22 12l-6.7 3.3L12 22l-3.3-6.7L2 12l6.7-3.3L12 3z" />
                    </svg>
                  ))}
                </div>
                <p className="mb-6 text-[var(--color-ink)]">{r.comment}</p>
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium text-[var(--color-ink)]">{r.customer_name}</p>
                    <p className="text-sm text-[var(--color-ink-light)]">Khách hàng</p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-[var(--color-border)] p-6 shadow-[var(--shadow-card)] animate-pulse" />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
