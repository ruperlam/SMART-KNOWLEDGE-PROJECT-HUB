#!/bin/zsh -il
# -i -l: interactive login shell, so ~/.zprofile and ~/.zshrc are sourced
# (this is where Homebrew/nvm normally put node & npm on PATH).
set -e
cd "$(dirname "$0")"

if ! command -v npm >/dev/null 2>&1; then
  echo "Không tìm thấy lệnh 'npm' trong PATH."
  echo "Hãy mở Terminal bình thường và gõ: which npm"
  echo "Nếu không có kết quả, bạn cần cài Node.js trước (https://nodejs.org) rồi chạy lại file này."
  read "?Nhấn Enter để đóng cửa sổ..."
  exit 1
fi

echo "=== Dùng npm: $(command -v npm) ($(npm -v)) ==="
echo "=== Cài đặt dependencies (lần đầu có thể mất 1-2 phút) ==="
npm install

if command -v yt-dlp >/dev/null 2>&1; then
  echo "=== yt-dlp: $(yt-dlp --version) — Auto Ingest sẽ tải video thật ==="
else
  echo "=== Chưa cài yt-dlp — Auto Ingest sẽ chỉ lưu link/tiêu đề. Xem GOOGLE_DRIVE_SETUP.md để cài. ==="
fi

if ! grep -q '^DATABASE_URL="postgres' .env 2>/dev/null; then
  echo ""
  echo "=== Chưa cấu hình DATABASE_URL (Postgres) trong .env ==="
  echo "Xem DEPLOYMENT.md — tạo 1 project Neon miễn phí, dán connection string vào .env, rồi chạy lại file này."
  read "?Nhấn Enter để đóng cửa sổ..."
  exit 1
fi

echo ""
echo "=== Khởi tạo Prisma Client ==="
npx prisma generate

echo ""
echo "=== Đồng bộ schema vào database (không xoá dữ liệu cũ) ==="
npx prisma db push

echo ""
echo "=== Nạp 9 topics + dữ liệu mẫu (tự bỏ qua nếu đã có dữ liệu) ==="
npm run prisma:seed

echo ""
echo "=== Khởi động server tại http://localhost:3000 ==="
echo "(Trình duyệt sẽ tự mở sau vài giây. Đóng cửa sổ Terminal này để tắt server.)"
(sleep 5 && open http://localhost:3000) &
npm run dev
