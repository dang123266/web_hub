# Kho lưu trữ

Mỗi mục là một file `items/<id>.md`. Tìm kiếm chạy trên metadata (tiêu đề, loại, thẻ, mô tả).

## Thêm mục
    npm run new-item -- "Tên mục" --type PowerPoint --tags "học tập, vũ trụ"
Sửa `summary`, dán link file, rồi `npm run check`. Hoặc tạo/sửa file .md trực tiếp trên GitHub web.

## Nơi để file
| Dung lượng | Nơi để | Link trong `url` |
|---|---|---|
| ≲ 25 MB | `public/archive/files/<id>/ten-file.ext` (Pages phục vụ) | `/archive/files/<id>/ten-file.ext` |
| lớn hơn (≤ 2 GiB/file) | Release asset, ví dụ release `kho-2026` | `https://github.com/dang123266/web_hub/releases/download/kho-2026/<id>-ten-file.ext` |

Quy tắc: tên asset duy nhất (`<id>-…`), mỗi release ≤ 1000 file nên chia theo năm/chủ đề; giữ cả site dưới ~1 GB.
Có thể thêm `sha256` để người tải kiểm tra file.

## Định dạng mục
    ---
    title: "Tên"
    date: 2026-11-24
    type: "PowerPoint"
    tags: ["a", "b"]
    summary: "Mô tả ngắn"
    files:
      - label: "Tải về"
        url: "..."
        size: "3.2 MB"
        sha256: "..."
    draft: false
    ---
    Nội dung mô tả (tùy chọn).

## Ảnh xem trước và nút tải
Thêm `image: "/duong-dan/anh.jpg"` để hiện ảnh nhỏ trong danh sách và trên trang mục. Một mục có thể có nhiều nút trong `files`; thêm `download: true` để bấm là tải về thay vì mở.
