'use client';

/**
 * Table – hệ thống bảng hiển thị dữ liệu (danh sách sản phẩm, đánh giá, thư viện).
 */

import React from 'react';

export interface TableCell {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T = Record<string, unknown>> {
  headers: TableCell[];
  rows: T[] | null;
  loading?: boolean;
  empty: string;
  render?: (rowData: T) => React.ReactNode;
  actions?: (rowData: T) => React.ReactNode;
}

/** Hiển thị một ô (cell) default theo giá trị. */
function renderCell(key: string, value: unknown) {
  if (typeof value === 'boolean') {
    return (
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
          value ? 'bg-[#3f7f63] text-white' : 'bg-[#e8e1e1] text-[#5b5b5b]'
        }`}
      >
        {value ? 'Hiển thị' : 'Ẩn'}
      </span>
    );
  }
  if (typeof value === 'undefined' || value === null) {
    return <span className="text-sm text-[#999999]">—</span>;
  }
  return <span className="text-sm text-[#1a1a1a]">{String(value)}</span>;
}

export function Table<T = Record<string, unknown>>({
  headers,
  rows,
  loading = false,
  empty = 'Chưa có dữ liệu.',
  render,
  actions,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#e8e1e1] bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#faf5fa] text-left">
            {headers.map((header) => (
              <th
                key={header.key}
                className={`
                  ${header.sortable ? 'cursor-pointer hover:bg-white' : ''}
                  px-4 py-3 font-semibold uppercase tracking-wide text-[#5b5b5b] text-[0.75rem]
                `}
              >
                {header.label}
              </th>
            ))}
            {actions && <th className="px-4 py-3 w-[140px]"></th>}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={headers.length + 1} className="py-8 text-center">
                <span className="inline-flex items-center gap-2 text-sm text-[#5b5b5b]">
                  <span className="block h-2 w-2 rounded-full bg-[#8b5f65] animate-pulse" />
                  Đang tải...
                </span>
              </td>
            </tr>
          )}
          {!loading && rows && rows.length > 0 &&
            rows.map((row, i) => {
              // `T` có thể là một interface bất kỳ: ép kiểu để đọc theo key.
              const cellRow = row as Record<string, unknown>
              return (
                <tr key={i} className="border-t border-[#f4eeef] hover:bg-[#faf5fa] transition-colors">
                  {render ? (
                    <td colSpan={headers.length + 1} className="px-4 py-3">
                      {render(row)}
                    </td>
                  ) : (
                    <>
                      {headers.map((header) => (
                        <td key={header.key} className="px-4 py-3">
                          {renderCell(header.key, cellRow[header.key])}
                        </td>
                      ))}
                      {actions && <td className="px-4 py-3">{actions(row)}</td>}
                    </>
                  )}
                </tr>
              )
            })}
          {!loading && !(rows && rows.length > 0) && (
            <tr>
              <td colSpan={headers.length + 1} className="py-8 text-center text-sm text-[#5b5b5b]">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
