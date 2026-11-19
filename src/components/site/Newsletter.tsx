'use client';

import { useState } from 'react';

import { Reveal } from '@/components/site/Reveal';

interface NewsletterProps {
  title?: string;
  subtitle?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Đăng ký nhận tin.
 *
 * Ô nhập email dùng `flex-1 min-w-0` để lấp đầy "viên thuốc", nút gửi được
 * ghim bên phải và không bị lệch khỏi khung. Có kiểm tra email + trạng thái
 * thông báo ngay trong form (không dùng `alert`).
 */
export function Newsletter({ title, subtitle }: NewsletterProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const titleT = title !== undefined ? title : 'Đăng ký nhận tin mới';
  const subtitleT =
    subtitle !== undefined
      ? subtitle
      : 'Đăng ký email để nhận những bó hoa tươi và ưu đãi đặc biệt đầu tiên.';

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setStatus('error');
      setMessage('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    setStatus('success');
    setMessage('Cảm ơn bạn! Chúng tôi sẽ gửi tin mới và ưu đãi tới email của bạn.');
    setEmail('');
  }

  return (
    <section className="section bg-[var(--color-tag-bg)]">
      <Reveal delay={80}>
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-[var(--color-ink)]">{titleT}</h2>
          <p className="mx-auto mt-2 mb-8 max-w-xl text-lg text-[var(--color-ink-light)]">{subtitleT}</p>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="mx-auto flex w-full max-w-2xl flex-col gap-2 rounded-[1.75rem] border border-[var(--color-border)] bg-white p-2 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:rounded-full"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Địa chỉ email
            </label>
            <input
              id="newsletter-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (status !== 'idle') {
                  setStatus('idle');
                  setMessage('');
                }
              }}
              placeholder="Nhập email của bạn"
              aria-invalid={status === 'error'}
              aria-describedby="newsletter-note"
              className="w-full min-w-0 flex-1 rounded-full border-0 bg-transparent px-5 py-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-lighter)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            />
            <button type="submit" className="btn btn-primary shrink-0 px-8">
              Đăng ký
            </button>
          </form>

          <p
            id="newsletter-note"
            role="status"
            aria-live="polite"
            className={`mt-4 text-sm ${
              status === 'error'
                ? 'text-[var(--color-primary-dark)]'
                : status === 'success'
                  ? 'text-[var(--color-success)]'
                  : 'text-[var(--color-ink-lighter)]'
            }`}
          >
            {message || 'Chúng tôi tôn trọng hộp thư của bạn và không gửi thư rác.'}
          </p>
        </div>
      </Reveal>
    </section>
  );
}
