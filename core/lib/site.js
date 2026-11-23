import config from '/site.config.json';

// Theme được chọn trong site.config.json; core chỉ đọc CSS của theme đó qua glob.
const themeCss = import.meta.glob('/themes/*/style.css', { query: '?raw', import: 'default', eager: true });

export const site = config;

export function getThemeCss() {
  const css = themeCss[`/themes/${config.theme}/style.css`];
  if (css === undefined) throw new Error(`Không thấy theme "${config.theme}" trong thư mục themes/`);
  return css;
}

export function withBase(path) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base + path;
}
