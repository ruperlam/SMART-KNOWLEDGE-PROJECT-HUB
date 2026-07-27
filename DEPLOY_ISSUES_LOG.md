# Smartech Hub — Deploy Issue Log (Render + Neon)

Live URL: https://smartech-hub.onrender.com
Repo: https://github.com/ruperlam/SMART-KNOWLEDGE-PROJECT-HUB
Stack: Next.js 14.2.5 (standalone Docker) on Render Free, Postgres on Neon Free, Prisma 5.20.

## Đã fix (theo thứ tự thời gian)

1. **`.gitignore` thiếu `.env`** — file `.env` (chứa mật khẩu Neon) suýt bị commit lên GitHub. Đã thêm `.env` vào `.gitignore`.
2. **Docker build lỗi `curl: not found`** — `Dockerfile` cài yt-dlp bằng `curl` nhưng chưa cài gói `curl` trong base image. Đã thêm `curl` vào danh sách `apt-get install`.
3. **Next.js build lỗi `useSearchParams() should be wrapped in a suspense boundary at page "/404"`** — `components/Sidebar.tsx` dùng `useSearchParams()` và được render trực tiếp trong `app/layout.tsx` (dùng chung mọi trang, kể cả trang 404 tự sinh), không có `<Suspense>` bao ngoài. Đã bọc `<Sidebar>` trong `<Suspense fallback={null}>` ở `app/layout.tsx`.
4. **`prisma:error Error in PostgreSQL connection: Error { kind: Closed, cause: None }`** — Neon free tier tự suspend compute sau ~5 phút không hoạt động, đóng kết nối TCP mà Prisma đang giữ. Đã thử 2 lớp:
   - `lib/prisma.ts`: bọc mọi Prisma query bằng `$extends` để tự động retry (tối đa 3 lần, delay 300ms/800ms) khi gặp lỗi "Closed".
   - `app/page.tsx`: bọc `Promise.all(...)` các query dashboard trong `try/catch`, fallback về mảng rỗng + banner báo lỗi thay vì crash cả trang.
   - `.env` / Render env: thêm `&connection_limit=1&pool_timeout=20` vào `DATABASE_URL`.
5. **Nghi ngờ Render health-check gây restart vòng lặp** — giả thuyết: health check mặc định gọi vào `/` (phụ thuộc DB chậm) khiến Render tưởng app chết rồi tự restart mỗi ~5 phút. Đã thêm:
   - `app/api/health/route.ts` — endpoint không đụng DB, trả `{ ok: true }` ngay lập tức.
   - `instrumentation.ts` + `experimental.instrumentationHook: true` trong `next.config.mjs` — bắt `unhandledRejection`/`uncaughtException` ở cấp process để 1 lỗi DB lẻ tẻ không làm sập cả server.
   - Người dùng đã đổi **Health Check Path** trên Render sang `/api/health`.

## Lỗi CHƯA fix — đang chặn go-live

Sau khi làm hết bước 5, **CẢ `/api/health` (không đụng DB) lẫn `/` đều trả về HTTP 502** cùng lúc. Đây là bằng chứng quan trọng: giả thuyết "health check phụ thuộc DB" ở bước 5 **sai** hoặc **chưa đủ** — nếu đúng, `/api/health` phải luôn load được. Vì cả 2 route đều chết, nghĩa là toàn bộ container/process không phản hồi được, không riêng gì các route đụng database.

Các hướng nghi vấn cần điều tra tiếp (chưa kiểm chứng):

- **OOM (hết RAM)**: Render Free tier giới hạn RAM (512MB). Image cài thêm Python, ffmpeg, yt-dlp binary + Next.js standalone + Prisma engine — có thể vượt giới hạn RAM lúc build hoặc lúc runtime, khiến container bị kill và Render phải khởi động lại (log không hiện rõ lý do kill, chỉ thấy "Detected service running on port 10000" lặp lại bất thường mà không có dòng "Deploying..." đứng trước).
- **Response time / timeout tại tầng proxy**: cần xem Render Metrics (CPU/Memory graph) tại đúng thời điểm lỗi để xác nhận có spike RAM/CPU hay không.
- **Deploy chồng lấn**: quan sát thấy nhiều lần 2 deploy chạy sát nhau trong vòng <1 phút (Auto-Deploy do git push + có thể do đổi Settings cũng trigger redeploy riêng) — cần xác nhận đây chỉ là trùng thời điểm test hay là nguyên nhân thật.
- Chưa xem được **Render Shell/Metrics** trực tiếp (tính năng có icon tia sét ⚡, có thể yêu cầu gói trả phí) để kiểm tra process có thực sự bị OOM-kill hay không.

## File/code liên quan

- `Dockerfile` — multi-stage build, cài yt-dlp qua curl.
- `lib/prisma.ts` — Prisma client với retry logic.
- `app/layout.tsx` — Suspense wrap Sidebar.
- `app/page.tsx` — dashboard, try/catch quanh Promise.all.
- `app/api/health/route.ts` — health check endpoint mới.
- `instrumentation.ts`, `next.config.mjs` — process-level error guard.
- `DEPLOYMENT.md` — hướng dẫn go-live gốc (Neon/Render/Google OAuth), viết trước khi gặp các lỗi trên.
- `Project Specification Claude.md` (thư mục cha) — spec đầy đủ của dự án.

## Việc còn lại sau khi hết 502

- Test luồng Auto Ingest end-to-end (yt-dlp tải video → chọn Topic → upload Google Drive).
- Test Gemini AI Co-Pilot (đã có `GEMINI_API_KEY` trong Render).
- Google OAuth đã publish "In production" — cần xác nhận không bị hỏi lại sau 7 ngày.
