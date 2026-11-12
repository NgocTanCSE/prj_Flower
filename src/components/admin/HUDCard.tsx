'use client';

/**
 * HUDCard – thẻ theo dõi chỉ số (dashboard / thong-ke).
 * Hiển thị nhãn + giá trị + thành phần (icon/trạng thái).
 */

import React from 'react';

export interface HUDCardProps {
  label: string;
  value: string | number;
  change?: { label: string; value: string };
  accent?: 'rose' | 'green' | 'blue' | 'amber';
  icon?: React.ReactNode;
}

const accentColors: Record<string, string> = {
  rose: 'border-[#8b5f65] bg-[#8b5f65]/10',
  green: 'border-[#3f7f63] bg-[#3f7f63]/10',
  blue: 'border-[#4f7b9c] bg-[#4f7b9c]/10',
  amber: 'border-[#b47f3d] bg-[#b47f3d]/10',
};

export function HUDCard({ label, value, change, accent = 'rose', icon }: HUDCardProps) {
  const style = accentColors[accent];
  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border-l-[3px] ${style} bg-white p-4 shadow-[0_8px_24px_rgba(92,58,64,0.08)]`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-[#5b5b5b]">{label}</span>
        {icon && (
          <span className="rounded-lg p-2">{icon}</span>
        )}
      </div>
      <div className="text-3xl font-bold text-[#1a1a1a]">{value}</div>
      {change && (
        <p className="text-xs text-[#5b5b5b]">{`${change.label} ${change.value}`}</p>
      )}
    </div>
  );
}
