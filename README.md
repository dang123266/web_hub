# Website mô-đun

Website tĩnh (Astro) chạy trên GitHub Pages. Gồm core nhỏ và các mô-đun độc lập trong `modules/`.

## Chạy thử trên máy
Cần Node.js 20 trở lên.
```
npm install
npm run dev        # xem tại http://localhost:4321
npm run check      # kiểm tra module.json
npm run build      # build ra thư mục dist
```

## Đưa lên GitHub Pages
1. Tạo kho công khai trên GitHub. Tên `<tên-bạn>.github.io` thì địa chỉ là `https://<tên-bạn>.github.io`.
2. Đưa toàn bộ thư mục này lên nhánh `main`.
3. Vào Settings → Pages, ở mục Source chọn **GitHub Actions**.
4. Mỗi lần đẩy code lên `main`, workflow `.github/workflows/deploy.yml` tự build và xuất bản.

Địa chỉ và base path được workflow tự điền theo tên kho; không cần sửa file nào.

## Thêm mô-đun
Xem `modules/MODULE_TEMPLATE/README.md` và `ARCHITECTURE.md`.

## Lưu ý
Không bao giờ đưa `api_key.txt` hay khóa API lên kho (đã nằm trong `.gitignore`).
