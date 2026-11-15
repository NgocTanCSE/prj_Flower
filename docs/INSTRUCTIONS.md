@Typescript
@TailwindCSS
@Next 15 App Router

Tiệm Hoa CoBeCuBe
=================

Kiến trúc A - **SSR qua Supabase (hầu hết logic nằm ở RLS & Supabase Client).**
- FE: Next.js 15 App Router, TypeScript, TailwindCSS
- BE: Supabase Postgres (PostgREST API), Supabase Auth (Login), Supabase Storage (Ảnh)
- Deploy: Netlify (miễn phí, thương mại) + Supabase (miễn phí)
- Admin panel: `/admin`, login từ Supabase Auth, session cookie
-教徒: sản phẩm, danh mục, đánh giá, thư viện ảnh, cài đặt site, tin nhắn

6 agent độc quyền file:
A1 - DB: supabase/migrations/*, supabase/seed.sql, docs/DB.md
A2 - Auth: src/lib/supabase/*, src/lib/auth/*, src/app/(auth)/*, middleware.ts, src/app/layout.tsx
A3 - Public: src/app/(site)/*, src/components/site/*, src/styles/site.css
A4 - Admin products/settings: src/app/admin/*, src/components/admin/products/*, src/components/admin/settings/*, src/components/admin/uploader/*
A5 - Admin review/gallery + QA: src/components/admin/reviews/*, src/components/admin/gallery/*, src/app/admin/(danh-gia|thu-vien)/*, e2e/*, netlify.toml, .github/*, src/app/error.tsx, src/app/not-found.tsx

Rules:
1. Only write to declared files. No package.json to another agent, no next.config.ts.
2. Don't install new packages (devTools already in package.json).
3. Don't start dev server.
4. Follow API/DB contract in docs/DB.md.
5. Public nextDbVars() to fetch data on the server, skip client.
6. All images compressed with react-use-canvas or similar in uploader only.
7. Server Action for authenticated + protected admin, no direct user write.
8. No direct GRID, no SQL in the UI. All queries go through the Supabase client in src/lib/supabase.
9. Do not add framework changes without talking to each other.
10. Use TypeScript for all components.
11. Admin logout email users controller does not delete/modify DB unless role admin.
12. Admin login page does not appear unless there is no session.
13. Missing env file: docs/env-setup.md? Cover it? No, only env-setup.md.
14. No placeholders in code.

NOW: CODE FULL SOLUTIONS.
