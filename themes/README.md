# Theme (giao diện)

Giao diện là một mô-đun riêng: đổi hoặc thiết kế lại mà không đụng core hay nội dung.

## Cấu trúc
```
themes/<id>/theme.json   id (trùng tên thư mục), name, version, description
themes/<id>/style.css    toàn bộ CSS của giao diện
themes/<id>/theme.js     (tùy chọn) hiệu ứng, tương tác trang trí; core nhúng vào cuối trang
```
Chọn theme trong `site.config.json` (trường `theme`).

## Hợp đồng class
Core chỉ dùng các class dưới đây; theme chỉ cần style các class này (không cần sửa HTML).
`site-header`, `site-nav`, `brand`, `site-main`, `site-footer`, `hero`, `section-title`,
`card-grid`, `card`, `card-featured`, `card-meta`, `card-actions`, `button`, `button-secondary`,
`button-disabled`, `update-list`, `date`. Nội dung bài viết nằm trong thẻ `article` bên `site-main`.

## Tạo theme mới
1. Sao chép `themes/default` thành `themes/<id-mới>`, sửa `theme.json` (id trùng tên thư mục) và `style.css`.
2. Đổi `"theme"` trong `site.config.json`.
3. Chạy `npm run check` và `npm run build`.
## theme.js (tùy chọn)
Chỉ dùng cho hiệu ứng và tương tác trang trí (ví dụ khẩu pháo ở theme `flak`). Quy tắc:
- Không đổi nội dung, liên kết hay cấu trúc dữ liệu của trang; không gọi mạng; không đọc hay ghi dữ liệu người dùng.
- Mọi thứ theme.js tự thêm vào trang phải có thuộc tính `data-flak-ui` hoặc tương đương để dễ nhận biết, và dọn được.
- Tôn trọng `prefers-reduced-motion` và tự tắt trên màn hình cảm ứng nếu làm cản việc bấm liên kết.
- Phải chạy được khi tắt JavaScript: trang vẫn dùng bình thường chỉ với style.css.

Theme không chứa nội dung trang; nếu cần đổi cấu trúc HTML, hỏi chủ dự án để sửa core.
