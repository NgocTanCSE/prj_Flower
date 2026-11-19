/**
 * CSV thuần — dùng chung cho client (đọc file, tải file mẫu) và server
 * (route handler xuất dữ liệu). Không phụ thuộc thư viện ngoài nên chạy tốt
 * trên Cloudflare Workers và không làm tăng bundle.
 *
 * Hỗ trợ:
 *   - UTF-8 BOM (Excel lưu kèm BOM vẫn đọc đúng).
 *   - Dấu phân cách `,` `;` `\t` tự nhận.
 *   - Ô có dấu nháy kép, dấu phân cách hoặc xuống dòng bên trong.
 *   - Chống CSV formula injection khi xuất (ô bắt đầu bằng `= + - @`).
 */

/** Kích thước tối đa của file CSV khi nhập (2 MB). */
export const MAX_CSV_BYTES = 2 * 1024 * 1024

/** Giá trị một ô khi xuất CSV. */
export type CsvCell = string | number | boolean | null | undefined

export interface CsvRow {
  /** Số dòng thực tế trong file (bắt đầu từ 1, đã tính dòng tiêu đề). */
  line: number
  cells: string[]
}

export interface CsvTable {
  headers: string[]
  rows: CsvRow[]
}

/**
 * Escape một ô. Ngoài việc bọc nháy kép, còn chặn **CSV formula injection**:
 * Excel sẽ thực thi ô bắt đầu bằng `=`, `+`, `-`, `@` → thêm dấu `'` phía trước.
 * (Chỉ áp dụng cho chuỗi; số âm vẫn xuất bình thường.)
 */
function escapeCell(value: CsvCell, delimiter: string): string {
  if (value === null || value === undefined) return ''
  let text = String(value)

  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`
  }

  if (
    text.includes('"') ||
    text.includes('\n') ||
    text.includes('\r') ||
    text.includes(delimiter)
  ) {
    text = `"${text.replace(/"/g, '""')}"`
  }
  return text
}

/** Serialize bảng thành CSV (không kèm BOM — nơi gọi tự thêm khi tải file). */
export function toCsv(
  headers: readonly string[],
  rows: ReadonlyArray<ReadonlyArray<CsvCell>>,
  delimiter = ','
): string {
  const lines = [
    headers.map((h) => escapeCell(h, delimiter)).join(delimiter),
    ...rows.map((row) => row.map((cell) => escapeCell(cell, delimiter)).join(delimiter)),
  ]
  return `${lines.join('\r\n')}\r\n`
}

/** Đoán dấu phân cách từ dòng đầu tiên (bỏ qua nội dung trong nháy kép). */
function detectDelimiter(text: string): string {
  const candidates = [',', ';', '\t']
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0 }
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') i++
      else inQuotes = !inQuotes
      continue
    }
    if (!inQuotes) {
      if (char === '\n' || char === '\r') break
      if (char in counts) counts[char]++
    }
  }

  let best = ','
  let bestCount = 0
  for (const delimiter of candidates) {
    if (counts[delimiter] > bestCount) {
      best = delimiter
      bestCount = counts[delimiter]
    }
  }
  return best
}

/**
 * Parse CSV thành `{ headers, rows }`. Ném lỗi khi file rỗng hoặc thiếu dấu
 * nháy đóng (dữ liệu hỏng) để nơi gọi hiển thị thông báo rõ ràng.
 */
export function parseCsv(input: string): CsvTable {
  let text = input.replace(/^\uFEFF/, '')
  if (text.trim() === '') throw new Error('File CSV trống.')

  // Excel đôi khi chèn dòng `sep=;` ở đầu file để chỉ định dấu phân cách.
  // Tách riêng trước khi parse, đồng thời giữ đúng số dòng thực tế.
  let forcedDelimiter: string | null = null
  const separatorHint = text.match(/^sep=(.)\r?\n/i)
  if (separatorHint) {
    forcedDelimiter = separatorHint[1]
    text = text.slice(separatorHint[0].length)
  }

  const delimiter = forcedDelimiter ?? detectDelimiter(text)
  const rows: CsvRow[] = []
  let cells: string[] = []
  let field = ''
  let inQuotes = false
  let lineNo = forcedDelimiter ? 2 : 1
  let rowStartLine = lineNo

  const finishRow = () => {
    // Bỏ qua dòng trống hoàn toàn (Excel hay chèn ở cuối file).
    if (!(cells.length === 1 && cells[0].trim() === '')) {
      rows.push({ line: rowStartLine, cells })
    }
    cells = []
  }

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        if (char === '\n') lineNo++
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === delimiter) {
      cells.push(field)
      field = ''
    } else if (char === '\r' || char === '\n') {
      if (char === '\r' && text[i + 1] === '\n') i++
      cells.push(field)
      field = ''
      finishRow()
      lineNo++
      rowStartLine = lineNo
    } else {
      field += char
    }
  }

  if (inQuotes) throw new Error('CSV không hợp lệ: thiếu dấu nháy kép đóng.')
  if (field !== '' || cells.length > 0) {
    cells.push(field)
    rows.push({ line: rowStartLine, cells })
  }

  if (rows.length === 0) throw new Error('File CSV không có dòng dữ liệu.')
  if (rows[0].cells.every((cell) => cell.trim() === '')) {
    throw new Error('File CSV thiếu dòng tiêu đề.')
  }

  return {
    headers: rows[0].cells.map((header) => header.trim()),
    rows: rows.slice(1),
  }
}