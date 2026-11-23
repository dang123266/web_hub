import { defineConfig } from 'astro/config';

// Đổi 2 dòng dưới khi biết địa chỉ thật, hoặc đặt biến môi trường SITE_URL / SITE_BASE.
// Kho tên <user>.github.io  -> base để '/'.
// Kho tên khác (vd. my-site) -> base '/my-site'.
export default defineConfig({
  srcDir: './core',
  site: process.env.SITE_URL || 'https://example.github.io',
  base: process.env.SITE_BASE || '/',
});
