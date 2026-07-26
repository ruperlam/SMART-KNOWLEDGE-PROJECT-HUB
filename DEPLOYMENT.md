# Go-live: Smartech Hub trên hạ tầng miễn phí

Kiến trúc 100% free cho một PKM cá nhân (1 user):

| Thành phần | Dịch vụ | Vì sao free |
|---|---|---|
| Database (metadata) | **Neon** (Postgres) | 0.5GB free vĩnh viễn, không giới hạn thời gian |
| App hosting | **Render** Web Service (Docker) | 750 giờ/tháng free — đủ chạy 1 service 24/7 |
| Lưu video/tài liệu | **Google Drive** (5TB Gemini Pro có sẵn) | Bạn đã có sẵn |
| AI Co-Pilot | **Gemini API** (Google AI Studio key) | Free tier ~1.500 request/ngày cho gemini-2.5-flash — **khác** với gói Gemini Pro tiêu dùng, cần tạo API key riêng |

Tổng chi phí: **$0/tháng**. Đánh đổi: Render free sẽ "ngủ" sau 15 phút không có
request, lần truy cập đầu tiên sau đó chờ ~30-50s để "thức dậy" — chấp nhận
được cho một tool cá nhân, không cần realtime.

---

## Bước 1 — Tạo database Neon (5 phút)

1. Vào https://neon.tech → đăng nhập bằng Google → **Create a project**
   (chọn region gần bạn, vd Singapore).
2. Vào tab **Connection Details**, copy connection string dạng:
   `postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
3. Dán vào `DATABASE_URL` trong file `.env` (folder `smartech-hub`).
4. Chạy thử local: mở lại `run-demo.command` — nó sẽ tạo bảng + seed dữ liệu
   mẫu vào Neon (không phải SQLite nữa). Nếu thấy `Ready in ...ms` và web mở
   được ở localhost, bước này xong.

*(Tùy chọn: Neon cho phép tạo "branch" — bạn có thể tạo 1 branch riêng tên
`dev` để test local mà không ảnh hưởng dữ liệu production. Không bắt buộc
cho dùng cá nhân.)*

## Bước 2 — Đẩy code lên GitHub

Render deploy từ GitHub repo. Trong Terminal (mở bình thường, không qua
`run-demo.command`), tại thư mục `smartech-hub`:

```bash
git init
git add .
git commit -m "Smartech Hub — ready to deploy"
```

Tạo repo mới (private) trên https://github.com/new, rồi:

```bash
git remote add origin <URL-repo-của-bạn>
git branch -M main
git push -u origin main
```

**Kiểm tra lại `.gitignore`** trước khi push — `.env`, `.google-token.json`,
`prisma/dev.db` đã được loại trừ sẵn, không bị lộ secret.

## Bước 3 — Tạo Web Service trên Render

1. Vào https://render.com → đăng nhập bằng GitHub → **New → Web Service**.
2. Chọn repo `smartech-hub` vừa push.
3. Render tự nhận diện `Dockerfile` → Runtime: **Docker**. Region tùy chọn
   (Singapore gần VN nhất).
4. Instance Type: **Free**.
5. Mục **Environment Variables**, thêm:
   - `DATABASE_URL` = connection string Neon (bước 1)
   - `GEMINI_API_KEY` = API key từ https://aistudio.google.com/apikey (free,
     khác với gói Gemini Pro tiêu dùng — xem lưu ý cuối file)
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` = từ Google Cloud Console
     (xem `GOOGLE_DRIVE_SETUP.md`, tạo credentials mới hoặc dùng lại cái cũ)
   - `GOOGLE_REDIRECT_URI` = `https://<tên-service>.onrender.com/api/auth/google/callback`
     (Render cho bạn biết URL này ngay sau khi tạo service, dạng
     `smartech-hub-xxxx.onrender.com`)
6. Bấm **Create Web Service**. Lần build đầu mất ~3-5 phút (cài Node +
   yt-dlp + ffmpeg + build Next.js).

## Bước 4 — Cập nhật Google OAuth cho domain production

1. Quay lại Google Cloud Console → **APIs & Services → Credentials** → mở
   OAuth Client đã tạo → **Authorized redirect URIs** → thêm:
   `https://<tên-service>.onrender.com/api/auth/google/callback`
   (giữ nguyên URI `localhost:3000` cũ để vẫn dùng được ở local).
2. Vào **OAuth consent screen** → bấm **PUBLISH APP** → xác nhận.
   **Quan trọng:** nếu để ở "Testing", token Google Drive sẽ tự hết hạn sau
   **7 ngày** vì scope `drive.file` không thuộc nhóm scope cơ bản được miễn
   trừ. Publish (không cần Google duyệt vì đây không phải scope "restricted")
   để token sống vĩnh viễn. Lần đầu người dùng (chính bạn) đăng nhập sẽ thấy
   cảnh báo "Google chưa xác minh ứng dụng này" — bấm **Advanced → Go to
   Smartech Hub (unsafe)** để tiếp tục, đây là app của chính bạn nên an toàn.

## Bước 5 — Go live

1. Mở `https://<tên-service>.onrender.com`.
2. Bấm **"Kết nối Google Drive"** → đăng nhập → Allow.
3. Dán thử 1 link TikTok/YouTube vào Auto Ingest để kiểm tra toàn bộ chuỗi:
   yt-dlp tải video → chọn Topic → upload lên Drive đúng folder.

---

## Lưu ý quan trọng

- **yt-dlp trên Render free**: container free tier có giới hạn RAM (512MB)
  và có thể timeout với video rất lớn/dài. Video ngắn (TikTok, Reels,
  YouTube Shorts) chạy tốt; video YouTube dài (>30 phút, chất lượng cao) có
  thể cần nâng cấp lên gói trả phí ($7/tháng) nếu gặp lỗi out-of-memory.
- **Cold start**: sau 15 phút không ai truy cập, Render tắt container.
  Request tiếp theo sẽ chờ ~30-50 giây để khởi động lại — bình thường, không
  phải lỗi.
- **Gemini API vs Gemini Pro**: gói Gemini Pro (tiêu dùng, có 5TB Drive) và
  Gemini API (dùng trong code, qua Google AI Studio) là **hai thứ khác
  nhau**, tính phí riêng. Free tier của API (~1.500 request/ngày cho
  gemini-2.5-flash) đủ dùng cho một PKM cá nhân, không tốn thêm tiền dù bạn
  không có gói Pro.
- **Riêng tư**: theo chính sách hiện tại của Google, nội dung gửi qua *free
  tier* của Gemini API có thể được dùng để cải thiện model (khác với tier
  trả phí). Nếu bạn nhập ý tưởng nhạy cảm vào ô "Phân tích với AI", cân nhắc
  điều này hoặc chuyển sang gói trả phí của API sau này.
- **Backup**: Neon free tier không có backup point-in-time dài hạn ở gói
  free — dữ liệu quan trọng (Project, ghi chú) nên thỉnh thoảng export thủ
  công nếu bạn lo ngại mất dữ liệu.
- **Muốn không có cold start / không giới hạn RAM**: cân nhắc Oracle Cloud
  "Always Free" (VM ARM 4 core/24GB RAM, miễn phí vĩnh viễn, không giới hạn
  giờ) thay cho Render — setup thủ công hơn (tự cài Docker, Nginx, HTTPS qua
  Let's Encrypt/Caddy). Hỏi mình nếu muốn đi hướng này thay vì Render.
