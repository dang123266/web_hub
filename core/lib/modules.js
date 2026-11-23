// Core đọc danh sách mô-đun qua glob, KHÔNG import trực tiếp mô-đun nào.
// Xóa một thư mục trong modules/ thì website vẫn build được.
import { withBase } from './site.js';
export { withBase };

const manifests = import.meta.glob('/modules/*/module.json', { eager: true });
const projects = import.meta.glob('/modules/*/project.json', { eager: true });
const pages = import.meta.glob('/modules/*/content/*.md', { eager: true });

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
