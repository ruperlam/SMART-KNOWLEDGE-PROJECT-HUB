# Kết nối Google Drive + cài yt-dlp

Hai bước dưới đây bạn tự làm một lần — sau đó Auto Ingest sẽ tự tải video và
lưu vào đúng thư mục Topic trên Google Drive của bạn (5TB Gemini Pro).

## 1. Cài yt-dlp (để tải video thật)

yt-dlp là công cụ mã nguồn mở, chạy ngay trên máy bạn, tải trực tiếp từ CDN
của TikTok/YouTube/Facebook — không qua server bên thứ ba nào.

Mở Terminal và chạy một trong hai lệnh sau:

```bash
brew install yt-dlp
```

hoặc nếu không dùng Homebrew:

```bash
pip3 install -U yt-dlp
```

Kiểm tra đã cài xong: `yt-dlp --version` phải in ra một số phiên bản.

Nếu chưa cài, Auto Ingest vẫn hoạt động bình thường nhưng chỉ lưu được
link + tiêu đề (không tải được file video thật).

## 2. Tạo Google OAuth credentials

1. Vào https://console.cloud.google.com/ (đăng nhập bằng tài khoản Google
   Gemini Pro của bạn — tài khoản có 5TB Drive).
2. Tạo project mới (hoặc dùng project có sẵn).
3. Vào **APIs & Services → Library**, tìm "Google Drive API", bấm **Enable**.
4. Vào **APIs & Services → OAuth consent screen**:
   - User Type: **External** (nếu không phải Google Workspace) hoặc
     **Internal** (nếu có Workspace).
   - Điền tên app tùy ý (vd. "Smartech Hub"), email của bạn.
   - Ở bước Scopes: không cần thêm gì, để mặc định.
   - Ở bước Test users (nếu là External): thêm chính email Gmail của bạn.
5. Vào **APIs & Services → Credentials → Create Credentials → OAuth client
   ID**:
   - Application type: **Web application**.
   - Authorized redirect URIs: thêm chính xác
     `http://localhost:3000/api/auth/google/callback`
   - Bấm **Create** → copy **Client ID** và **Client Secret**.
6. Mở file `.env` trong folder `smartech-hub`, điền vào:

   ```
   GOOGLE_CLIENT_ID="<client-id-vừa-copy>"
   GOOGLE_CLIENT_SECRET="<client-secret-vừa-copy>"
   ```

7. Chạy lại `run-demo.command` (hoặc `npm run dev` nếu server đang chạy sẵn
   thì chỉ cần bấm nút "Kết nối Google Drive" trong app).
8. Trong app, bấm nút **"Kết nối Google Drive"** ở đầu Dashboard → đăng nhập
   Google → **Allow**. Xong — từ giờ Auto Ingest sẽ tự tạo folder
   `Smartech Hub/{Tên Topic}` trên Drive và upload video thật vào đó.

## Lưu ý

- Token đăng nhập Google được lưu ở file `.google-token.json` (đã có trong
  `.gitignore`, không public lên đâu). Xoá file này nếu muốn ngắt kết nối /
  đăng nhập lại tài khoản khác.
- Nếu quên bước Enable "Google Drive API" ở bước 3, upload sẽ báo lỗi 403 —
  quay lại Library bật API rồi thử lại.
- App chỉ xin quyền `drive.file` (chỉ thấy/sửa được các file do chính app
  này tạo ra), không đụng tới các file khác trong Drive của bạn.
