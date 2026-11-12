/**
 * Global: `process` đồ họa cho Node (runtime Next.js cung cấp), vì
 * `@types/node` không phải là dependency của dự án.
 */
declare global {
  // eslint-disable-next-line
  const process: {
    env: Record<string, string | undefined>
    cwd?: () => string
    platform?: string
    version?: string
    [key: string]: unknown
  }
}

export {}
