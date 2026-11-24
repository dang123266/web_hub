// Core đọc danh sách mô-đun qua glob, KHÔNG import trực tiếp mô-đun nào.
// Xóa một thư mục trong modules/ thì website vẫn build được.
import { withBase } from './site.js';
export { withBase };

const manifests = import.meta.glob('/modules/*/module.json', { eager: true });
const projects = import.meta.glob('/modules/*/project.json', { eager: true });
const pages = import.meta.glob('/modules/*/content/*.md', { eager: true });
const itemFiles = import.meta.glob('/modules/*/items/*.md', { eager: true });

const dirOf = (p) => p.split('/')[2];
const skip = (p) => dirOf(p) === 'MODULE_TEMPLATE';

export function getModules() {
  return Object.entries(manifests)
    .filter(([p]) => !skip(p))
    .map(([p, m]) => ({ ...(m.default ?? m), dir: dirOf(p) }))
    .sort((a, b) => (a.menu?.order ?? 100) - (b.menu?.order ?? 100));
}

// Mô-đun hiện trên menu (menu.show mặc định là true).
export function getMenuModules() {
  return getModules().filter((m) => m.menu?.show !== false);
}

export function getModulePages(dir) {
  return Object.entries(pages)
    .filter(([p]) => dirOf(p) === dir)
    .map(([p, mod]) => ({
      file: p.split('/').pop().replace(/\.md$/, ''),
      frontmatter: mod.frontmatter,
      Content: mod.Content,
    }));
}

// Mô-đun có project.json = một công cụ/dự án hiện ở trang Công cụ.
export function getProjects() {
  const mods = getModules();
  return Object.entries(projects)
    .filter(([p]) => !skip(p))
    .map(([p, pr]) => {
      const mod = mods.find((m) => m.dir === dirOf(p));
      return mod ? { ...(pr.default ?? pr), route: mod.route, dir: mod.dir } : null;
    })
    .filter(Boolean);
}

// ---- Bộ sưu tập (collection): mô-đun khai báo "collection" trong module.json thì mỗi file
// modules/<id>/items/*.md là một mục có trang riêng và hiện trong trang tìm kiếm của mô-đun.
const toDate = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d ?? ''));

export function getItems(dir) {
  return Object.entries(itemFiles)
    .filter(([p]) => dirOf(p) === dir)
    .map(([p, m]) => {
      const fm = m.frontmatter ?? {};
      const id = p.split('/').pop().replace(/\.md$/, '');
      return {
        id,
        title: String(fm.title ?? id),
        date: toDate(fm.date),
        type: String(fm.type ?? ''),
        tags: Array.isArray(fm.tags) ? fm.tags.map(String) : [],
        summary: String(fm.summary ?? ''),
        files: Array.isArray(fm.files) ? fm.files : [],
        draft: !!fm.draft,
        Content: m.Content,
      };
    })
    .filter((i) => !i.draft)
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'vi'));
}

// Bản gọn (không có hàm Content) để nhúng JSON cho ô tìm kiếm.
export function plainItem(i) {
  const { Content, draft, ...rest } = i;
  return rest;
}

// Đường dẫn bắt đầu bằng "/" là đường dẫn trong site (cộng base); còn lại giữ nguyên.
export function fileUrl(u) {
  return typeof u === 'string' && u.startsWith('/') ? withBase(u) : u;
}
