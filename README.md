# Smartech Hub — Local Demo

Bản demo local của Smart Knowledge & Project Hub: Bento Grid dashboard, sidebar 9 topics,
SLA aging engine, Gemini AI Co-Pilot (mock nếu chưa có API key), và Project Incubator.

## Chạy demo

```bash
npm install
npx prisma generate
npx prisma db push      # tạo dev.db (SQLite) từ schema
npm run prisma:seed     # nạp 9 topics + dữ liệu mẫu
npm run dev
```

Mở http://localhost:3000

## Ghi chú

- **Database**: dùng SQLite (`dev.db`) để chạy ngay không cần cài đặt gì thêm. Đổi
  `provider` trong `prisma/schema.prisma` sang `postgresql` + `DATABASE_URL` thật khi
  lên production (SQLite không hỗ trợ `String[]`, nên `Project.steps` đang lưu dạng
  JSON string — đổi lại thành mảng thật khi chuyển qua Postgres).
- **Gemini AI**: nếu để trống `GEMINI_API_KEY` trong `.env`, API `/api/gemini/enhance-idea`
  sẽ trả kết quả mock (rule-based) để bạn xem trước luồng UI mà không cần key thật.
  Điền key thật vào `.env` để gọi model `gemini-2.5-flash-preview-09-2025` thật.
- **Auto-Downloader**: `/api/ingest/download` hiện là stub — trả về metadata giả.
  Khi làm production, nối route này với extractor theo từng platform (TikTok/Reels/
  Threads/YouTube) và upload file lên Cloudflare R2, gán URL vào `Item.storagePath`.
- **PDF/Video Viewer**: `PDFViewerModal` sẽ tự phát `<video>` hoặc nhúng `<iframe>`
  nếu `storagePath` có giá trị; nếu chưa có file thật (như trong seed data) sẽ hiện
  placeholder.
- Lần chạy đầu cần internet để `prisma generate` tải engine và để Next.js tải Google
  Fonts (Outfit, Plus Jakarta Sans).

## Cấu trúc

Theo đúng `project_specification_claude.md`: `app/`, `components/`, `lib/`, `prisma/`.
