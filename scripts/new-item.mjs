// Tạo mục mới cho kho (mô-đun có collection). Cách dùng:
//   npm run new-item -- "Tên mục" [--module archive] [--type PowerPoint] [--tags "học tập, thuyết trình"]
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const title = args.find((a) => !a.startsWith('--'));
const opt = (name, def = '') => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] ?? def : def; };
if (!title) { console.error('Thiếu tên mục.\nVí dụ: npm run new-item -- "Bài PowerPoint về vũ trụ" --type PowerPoint --tags "học tập, vũ trụ"'); process.exit(1); }

const mod = opt('module', 'archive');
const type = opt('type', '');
const tags = opt('tags', '').split(',').map((t) => t.trim()).filter(Boolean);
const slug = title.toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
const dir = path.join('modules', mod, 'items');
if (!fs.existsSync(path.join('modules', mod, 'module.json'))) { console.error(`Không có mô-đun "${mod}".`); process.exit(1); }
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `${slug}.md`);
if (fs.existsSync(file)) { console.error(`Đã có ${file}. Đổi tên mục hoặc sửa file đó.`); process.exit(1); }
const today = new Date().toISOString().slice(0, 10);
const q = (s) => JSON.stringify(s);   // chuỗi JSON cũng là chuỗi YAML hợp lệ
fs.writeFileSync(file, `---
title: ${q(title)}
date: ${today}
type: ${q(type)}
tags: [${tags.map(q).join(', ')}]
summary: ""
files:
  - label: "Tải về"
    url: "DÁN LINK FILE VÀO ĐÂY"
    size: ""
---

Mô tả chi tiết (không bắt buộc). Có thể viết nhiều đoạn, danh sách, liên kết...
`);
console.log(`✓ Đã tạo ${file}\nBước tiếp: sửa summary, dán link file (Release hoặc /archive/files/...), rồi chạy npm run check.`);
