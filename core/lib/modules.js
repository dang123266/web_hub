// Core đọc danh sách mô-đun qua glob, KHÔNG import trực tiếp mô-đun nào.
// Xóa một thư mục trong modules/ thì website vẫn build được.
const manifests = import.meta.glob('/modules/*/module.json', { eager: true });
const pages = import.meta.glob('/modules/*/content/*.md', { eager: true });

const dirOf = (p) => p.split('/')[2];

export function getModules() {
  return Object.entries(manifests)
    .filter(([p]) => dirOf(p) !== 'MODULE_TEMPLATE')
    .map(([p, m]) => ({ ...(m.default ?? m), dir: dirOf(p) }))
    .sort((a, b) => (a.menu?.order ?? 100) - (b.menu?.order ?? 100));
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

export function withBase(path) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base + path;
}
