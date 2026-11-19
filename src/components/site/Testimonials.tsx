'use client';

import type { Review } from '@/lib/getProducts';

import { Reveal } from '@/components/site/Reveal';
import { SectionTitle } from '@/components/site/SectionTitle';

interface TestimonialsProps {
  reviews: Review[];
  title?: string;
  subtitle?: string;
}

/** Chữ cái đầu của tên khách để làm huy hiệu đại diện. */
function initial(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : '?';
}

/** Lưới đánh giá (không có section riêng) — dùng lại được ở nhiều trang. */
export function TestimonialGrid({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <div className="flex flex-wrap justify-center gap-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-48 w-full animate-pulse rounded-2xl border border-[var(--color-border)] bg-white md:w-[calc(50%_-_0.75rem)] xl:w-[calc(25%_-_1.125rem)]"
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-6">
      {reviews.map((review, index) => (
        <Reveal
          key={review.id}
          delay={index * 80}
          className="h-full w-full md:w-[calc(50%_-_0.75rem)] xl:w-[calc(25%_-_1.125rem)]"
        >
          <article className="flex h-full flex-col rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-hover)]">
            <div className="mb-4 flex flex-none text-[var(--color-primary)]" aria-label={`${review.rating} trên 5 sao`}>
              {[...Array(5)].map((_, i) => (
                <svg key={i} className={`h-5 w-5 ${i < review.rating ? 'fill-current' : 'text-[var(--color-border)]'}`} viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3l3.3 6.7L22 12l-6.7 3.3L12 22l-3.3-6.7L2 12l6.7-3.3L12 3z" />
                </svg>
              ))}
            </div>
            <p className="mb-6 flex-1 leading-relaxed text-[var(--color-ink)]">{review.comment}</p>
            <div className="flex flex-none items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-tag-bg)] font-semibold text-[var(--color-primary)]" aria-hidden="true">
                {initial(review.customer_name)}
              </span>
              <div>
                <p className="text-sm font-medium text-[var(--color-ink)]">{review.customer_name}</p>
                <p className="text-xs uppercase tracking-wide text-[var(--color-ink-light)]">Khách hàng</p>
              </div>
            </div>
          </article>
        </Reveal>
      ))}
    </div>
  );
}

/** Khối đánh giá đầy đủ (có tiêu đề + section) cho trang chủ. */
export function Testimonials({ reviews = [], title, subtitle }: TestimonialsProps) {
  return (
    <section className="section bg-[var(--color-tag-bg)]">
      <div className="container">
        <SectionTitle
          label="Đánh giá"
          title={title !== undefined ? title : 'Khách hàng nói gì về chúng tôi'}
          subtitle={subtitle}
          align="center"
        />
        <TestimonialGrid reviews={reviews} />
      </div>
    </section>
  );
}
