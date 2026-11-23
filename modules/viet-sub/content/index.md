---
title: VIET-SUB
date: 2026-11-23
summary: Công cụ tự động lồng tiếng Việt cho video, chạy trên máy yếu, dùng dịch vụ miễn phí.
---

# VIET-SUB

Tự động lồng tiếng Việt cho video. Bạn đưa vào một video (mọi ngôn ngữ), công cụ nhận dạng lời nói, dịch sang tiếng Việt, đọc bằng giọng Việt và ghép lại thành video mới. Chỉ một file `main.py`, dùng dịch vụ miễn phí, chạy được trên máy yếu.

<p><a class="button" href="https://github.com/dang123266/web_hub/releases/latest/download/main.py">Tải main.py (phiên bản 2.1)</a>
<a class="button button-secondary" href="https://github.com/dang123266/web_hub/releases">Các bản phát hành</a></p>

## Cách hoạt động

1. **Tách âm thanh** bằng ffmpeg.
2. **Nhận dạng giọng nói** bằng faster-whisper, chạy trên CPU, chia video dài thành từng đoạn và lưu dở dang để chạy tiếp khi bị ngắt.
3. **Dịch sang tiếng Việt** bằng Groq (chính), tự chuyển sang Gemini nếu Groq hết hạn mức.
4. **Đọc bằng giọng Việt** qua edge-tts (giọng của Microsoft).
5. **Ghép vào video** bằng ffmpeg. Video có phụ đề cứng thì làm mờ phụ đề cũ và chèn phụ đề tiếng Việt mới.

## Yêu cầu

- Windows, đã cài **Python 3.9 trở lên** (tải ở python.org, khi cài nhớ tích **Add Python to PATH**).
- Kết nối mạng.
- **Khóa API Groq** (miễn phí). Khóa Gemini là tùy chọn, dùng để dự phòng.
- Thư viện và ffmpeg: công cụ tự hỏi rồi cài giúp lần chạy đầu (ffmpeg qua winget trên Windows).

## Cài đặt từng bước

1. Tạo một thư mục riêng, ví dụ `D:\VIET-SUB`, rồi tải `main.py` vào đó.
2. Mở thư mục, gõ `cmd` vào thanh địa chỉ rồi Enter để mở cửa sổ lệnh tại đó.
3. Chạy `python main.py`. Lần đầu công cụ tự tạo `config.ini`, `models.json`, `glossary.txt`, `pronunciation.txt` và `api_key.txt`, rồi hỏi trước khi cài thư viện còn thiếu. Trả lời đồng ý.
4. Lấy khóa Groq miễn phí tại [console.groq.com](https://console.groq.com) (mục API Keys), mở `api_key.txt` và dán khóa vào. Nếu có khóa Gemini (lấy tại [aistudio.google.com/apikey](https://aistudio.google.com/apikey)) thì dán thêm một dòng nữa. Khóa Gemini có thể bắt đầu bằng `AIza` hoặc `AQ.`.
5. Chạy với video của bạn:
   ```
   python main.py video.mp4
   ```
   Có thể đưa nhiều video, hoặc cả thư mục: `python main.py video1.mp4 video2.mkv thu_muc_video/`.

Mọi thông số chỉnh trong `config.ini`. Xem toàn bộ tùy chọn bằng `python main.py --help`.

## Lệnh hay dùng

| Lệnh | Tác dụng |
| --- | --- |
| `python main.py --update` | Kiểm tra và cập nhật bản mới (luôn hỏi trước, có sao lưu) |
| `python main.py --rollback` | Quay lại bản trước lần cập nhật gần nhất |
| `python main.py --update-deps` | Nâng cấp thư viện |
| `python main.py --list-voices` | Liệt kê giọng đọc có sẵn |
| `python main.py --voice vi-VN-NamMinhNeural video.mp4` | Chọn giọng đọc |
| `python main.py --mode light video.mp4` | Chọn chế độ theo sức máy: `light`, `balanced`, `max` |
| `python main.py -y video.mp4` | Tự trả lời "có" các câu hỏi cài đặt |

## Giới hạn cần biết

- **Video dài mất nhiều thời gian.** Số đo trên máy i3-1005G1, RAM 4 GB, không card đồ họa rời: nhận dạng giọng nói cho video 3 giờ mất khoảng 15 phút. Bước đọc giọng chậm nhất: một lần chạy 1.160 câu mất khoảng 1,5 đến 2 giờ (đo trước khi cải tiến tốc độ, chưa đo lại).
- **Dịch vụ miễn phí có hạn mức.** Groq gói miễn phí (model gpt-oss-120b) giới hạn 30 yêu cầu mỗi phút, 1.000 yêu cầu mỗi ngày, 8.000 token mỗi phút và 200.000 token mỗi ngày (theo trang [rate limits của Groq](https://console.groq.com/docs/rate-limits), kiểm tra tháng 11/2026). Công cụ tự giãn nhịp gửi theo hạn mức; video rất dài nên thêm khóa Gemini để dịch trọn một lần.
- **Giọng đọc phụ thuộc máy chủ Microsoft** nên có lúc chậm hoặc bị giới hạn, không do máy bạn.
- Một số tính năng chưa kiểm chứng trên dịch vụ thật: Gemini với khóa dạng `AQ.`, render bằng Quick Sync, tự cập nhật qua GitHub.

## Câu hỏi thường gặp

**Báo lỗi 429 hoặc "giới hạn tốc độ"?**
Bạn đã chạm hạn mức miễn phí. Công cụ tự chờ và thử lại, hoặc chuyển sang Gemini nếu có khóa. Thêm khóa Gemini vào `api_key.txt` để chạy mượt hơn.

**Video đang chạy thì bị tắt máy hoặc ngắt giữa chừng?**
Chạy lại đúng lệnh cũ. Bước nhận dạng giọng nói lưu dở dang theo từng đoạn, và kết quả dịch, giọng đọc được lưu đệm nên không làm lại từ đầu.

**Đổi giọng đọc thế nào?**
Dùng `--list-voices` để xem giọng có sẵn, rồi chạy với `--voice <tên giọng>`, hoặc đặt cố định trong `config.ini`.

**Sửa cách dịch một số từ, hoặc cách đọc từ đặc biệt?**
Thêm vào `glossary.txt` (từ điển dịch) và `pronunciation.txt` (cách đọc).

**Cập nhật hoặc quay lại bản cũ?**
`python main.py --update` luôn hỏi trước và sao lưu. Nếu bản mới lỗi, công cụ tự giữ bản cũ; muốn quay lại thủ công dùng `python main.py --rollback`.

**Máy báo thiếu ffmpeg?**
Công cụ sẽ hỏi rồi cài qua winget trên Windows. Nếu không được, tải ffmpeg và đưa vào PATH.

## Góp ý

Gặp lỗi hoặc có ý tưởng, gửi tại [GitHub Issues](https://github.com/dang123266/web_hub/issues).
