# ARCHITECTURE (bản rút gọn cho AI)

Tài liệu gốc: "Đặc tả dự án cho các AI: Website mô-đun và VIET-DUB". File này chỉ tóm tắt mục 4–5 và 7–8.

## Cấu trúc
```
core/            bố cục, menu, routing, đọc module.json  (đứng yên)
  layouts/Base.astro
  lib/modules.js        glob đọc modules/*/module.json và content/*.md
  pages/index.astro     trang chủ, liệt kê mô-đun
  pages/[...slug].astro sinh trang từ content/*.md của mọi mô-đun
modules/<id>/    mỗi mô-đun một thư mục, độc lập
  module.json    khai báo cho core (bắt buộc)
  project.json   thông tin dự án/công cụ (tên, version, downloads)
  content/*.md   bài viết, index.md là trang chính
modules/MODULE_TEMPLATE/   mẫu sao chép
public/          ảnh, file tĩnh
scripts/check-modules.mjs  kiểm tra hợp đồng (npm run check)
```

## Hợp đồng mô-đun
1. Mô-đun nằm trọn trong `modules/<id>/`, `id` trùng tên thư mục (chữ thường, dấu gạch ngang).
2. `module.json` bắt buộc: `id`, `name`, `version` (MAJOR.MINOR.PATCH), `route` (bắt đầu bằng `/`, không trùng), `entry` (file có thật), `menu` (`label`, `order`). Tùy chọn: `summary`.
3. Mô-đun không import mô-đun khác. Core không import mô-đun cụ thể, chỉ glob.
4. Xóa một thư mục mô-đun thì website vẫn build được.
5. Route trang: `route` cho `content/index.md`, `route/<tên-file>` cho các file còn lại.
6. File code dưới khoảng 300 dòng. Sửa đúng đoạn cần sửa, không viết lại cả file.
7. Không đưa khóa API hay dữ liệu riêng tư vào kho.

## Thêm mô-đun mới
Sao chép `modules/MODULE_TEMPLATE` thành `modules/<id>`, sửa nội dung, chạy `npm run check` và `npm run build`.

## Muốn đổi hợp đồng hoặc core
Dừng lại, hỏi chủ dự án, rồi cập nhật tài liệu gốc cùng file này.
