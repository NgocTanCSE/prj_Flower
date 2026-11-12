'use client';

/**
 * CatalogSelector – widget chọn danh mục (gán cho sản phẩm).
 * Hỗ trợ tìm kiếm, chọn nhiều, đổi thứ tự kéo/thả tắt ở đâu.
 */

import React, { useState } from 'react';
import { Button } from './Button';

export interface CatalogOption {
  slug: string;
  name: string;
  keyword: string;
  sort_order: number;
  active: boolean;
}

export interface CatalogSelectorProps {
  options: CatalogOption[];
  selected: string[];
  onChange: (slugs: string[]) => void;
  placeholder?: string;
  multiple?: boolean;
}

export function CatalogSelector({
  options,
  selected,
  onChange,
  placeholder = 'Chọn danh mục...',
  multiple = true,
}: CatalogSelectorProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const matches = options.filter((o) =>
    o.active && (o.name.toLowerCase().includes(query.toLowerCase()) || o.keyword.toLowerCase().includes(query.toLowerCase()))
  ).sort((a, b) => a.sort_order - b.sort_order);

  const toggle = (slug: string) => {
    const has = selected.includes(slug);
    const next = has ? selected.filter((s) => s !== slug) : [...selected, slug];
    onChange(next);
  };

  return (
    <div className="relative">
      <div
        className="flex min-h-[40px] items-center gap-2 rounded-lg border border-[#e8e1e1] bg-white px-3 py-2 cursor-pointer hover:border-[#b38f94]"
        onClick={() => setOpen(!open)}
      >
        <div className="flex flex-wrap gap-2 flex-1">
          {selected.length === 0 && (
            <span className="text-sm text-[#999999]">{placeholder}</span>
          )}
          {selected.map((slug) => {
            const found = options.find((o) => o.slug === slug);
            return (
              <span key={slug} className="inline-flex items-center gap-1 rounded-full bg-[#f4eeef] px-2.5 py-0.5 text-xs font-medium text-[#8b5f65]">
                {found?.name ?? slug}
                <button
                  type="button"
                  className="ml-1 rounded-full hover:bg-[#e8e1e1] p-0.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(slug);
                  }}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
        <span className="text-sm text-[#5b5b5b]">▼</span>
      </div>
      {open && (
        <div className="absolute z-10 mt-2 w-full rounded-lg border border-[#e8e1e1] bg-white shadow-[0_12px_32px_rgba(92,58,64,0.12)]">
          <div className="p-3 border-b border-[#e8e1e1]">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm danh mục..."
              className="w-full rounded-lg border border-[#e8e1e1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#8b5f65]/40"
              onFocus={() => setOpen(true)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {matches.length === 0 && (
              <p className="p-3 text-sm text-[#999999]">Không tìm thấy danh mục.</p>
            )}
            {matches.map((o) => {
              const checked = selected.includes(o.slug);
              return (
                <label
                  key={o.slug}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-[#1a1a1a] cursor-pointer hover:bg-[#faf5fa]"
                >
                  <input
                    type={multiple ? 'checkbox' : 'radio'}
                    checked={checked}
                    onChange={() => toggle(o.slug)}
                    className="rounded border-[#e8e1e1] text-[#8b5f65] focus:ring-[#8b5f65]"
                  />
                  <span>{o.name} <span className="text-xs text-[#5b5b5b]">({o.keyword})</span></span>
                </label>
              );
            })}
          </div>
          <div className="flex items-center justify-between border-t border-[#e8e1e1] p-3">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Đóng
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onChange([])}>
              Bỏ chọn lại
            </Button>
          </div>
        </div>
      )}
      {open && <div className="fixed inset-0 z-0" onClick={() => setOpen(false)} />}
    </div>
  );
}
