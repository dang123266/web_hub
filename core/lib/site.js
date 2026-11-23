import config from '/site.config.json';

// Theme được chọn trong site.config.json; core chỉ đọc CSS của theme đó qua glob.
const themeCss = import.meta.glob('/themes/*/style.css', { query: '?raw', import: 'default', eager: true });

const themeJs = import.meta.glob('/themes/*/theme.js', { query: '?raw', import: 'default', eager: true });

export const site = config;

export function getThemeCss() {
  const css = themeCss[`/themes/${config.theme}/style.css`];
  if (css === undefined) throw new Error(`Không thấy theme "${config.theme}" trong thư mục themes/`);
  return css;
}

// theme.js là tùy chọn (hiệu ứng, tương tác trang trí). Không có thì trả về chuỗi rỗng.
export function getThemeJs() {
  return themeJs[`/themes/${config.theme}/theme.js`] ?? '';
}

export function withBase(path) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base + path;
}
