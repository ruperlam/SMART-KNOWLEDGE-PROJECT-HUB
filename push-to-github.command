#!/bin/zsh -il
# Đẩy code Smartech Hub lên GitHub — chỉ cần dán 1 đường link repo khi được hỏi.

cd "$(dirname "$0")"

echo "=== Kiểm tra git ==="
if ! command -v git >/dev/null 2>&1; then
  echo "Chưa cài Git. Cài qua: xcode-select --install (hoặc brew install git) rồi chạy lại file này."
  read -q "?Nhấn phím bất kỳ để đóng..."
  exit 1
fi

if [ ! -d .git ]; then
  echo ""
  echo "=== Khởi tạo git repo lần đầu ==="
  git init
  git branch -M main
fi

echo ""
echo "=== Kiểm tra .env sẽ KHÔNG bị đẩy lên (bảo mật) ==="
if git check-ignore -q .env 2>/dev/null; then
  echo "OK: .env đã được loại trừ."
else
  echo "CẢNH BÁO: .env chưa có trong .gitignore — dừng lại để tránh lộ mật khẩu database."
  read -q "?Nhấn phím bất kỳ để đóng..."
  exit 1
fi

echo ""
echo "=== Thêm & commit code ==="
git add .
git status --short | head -20
git commit -m "Smartech Hub — ready to deploy" || echo "(Không có gì thay đổi để commit — có thể đã commit trước đó, vẫn tiếp tục)"

echo ""
echo "=== Bây giờ vào https://github.com/new để tạo repo mới (Private) ==="
echo "Đặt tên ví dụ: smartech-hub. KHÔNG tick 'Add a README' (repo phải trống)."
open "https://github.com/new"

echo ""
echo "Sau khi tạo xong, GitHub sẽ hiện 1 đường link dạng:"
echo "  https://github.com/<ten-ban>/smartech-hub.git"
echo ""
read "REPO_URL?Dán đường link đó vào đây rồi nhấn Enter: "

if [ -z "$REPO_URL" ]; then
  echo "Chưa nhập link — dừng lại. Chạy lại file này khi có link."
  read -q "?Nhấn phím bất kỳ để đóng..."
  exit 1
fi

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

echo ""
echo "=== Đẩy code lên GitHub (có thể sẽ hỏi đăng nhập GitHub lần đầu) ==="
git push -u origin main

echo ""
echo "=== XONG! Code đã lên GitHub. Quay lại chat để làm Bước 3 (Render). ==="
read -q "?Nhấn phím bất kỳ để đóng cửa sổ này..."
