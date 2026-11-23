# Cách tạo mô-đun mới

1. Sao chép thư mục `MODULE_TEMPLATE` thành `modules/<id>/` (id: chữ thường, dấu gạch ngang).
2. Sửa `module.json` (id phải trùng tên thư mục), `project.json` và `content/`.
3. Chạy `npm run check` rồi `npm run build`.
4. Không import mô-đun khác. Cần dùng chung thì hỏi chủ dự án để đưa lên `core/`.
