// Kiểm tra hợp đồng module.json. Chạy: npm run check
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('modules');
const REQUIRED = ['id', 'name', 'version', 'route', 'entry', 'menu'];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SEMVER = /^\d+\.\d+\.\d+$/;
let errors = 0;
const routes = new Set();
const fail = (dir, msg) => { errors++; console.error(`✗ modules/${dir}: ${msg}`); };

for (const dir of fs.readdirSync(root, { withFileTypes: true })) {
  if (!dir.isDirectory() || dir.name === 'MODULE_TEMPLATE') continue;
  const file = path.join(root, dir.name, 'module.json');
  if (!fs.existsSync(file)) { fail(dir.name, 'thiếu module.json'); continue; }
  let m;
  try { m = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { fail(dir.name, 'module.json không phải JSON hợp lệ'); continue; }
  for (const k of REQUIRED) if (m[k] === undefined) fail(dir.name, `thiếu trường "${k}"`);
  if (m.id && m.id !== dir.name) fail(dir.name, `id "${m.id}" phải trùng tên thư mục`);
  if (m.id && !SLUG.test(m.id)) fail(dir.name, 'id chỉ gồm chữ thường, số, dấu gạch ngang');
  if (m.version && !SEMVER.test(m.version)) fail(dir.name, 'version phải dạng MAJOR.MINOR.PATCH');
  if (m.route && !m.route.startsWith('/')) fail(dir.name, 'route phải bắt đầu bằng "/"');
  if (m.route) { if (routes.has(m.route)) fail(dir.name, `route "${m.route}" bị trùng`); routes.add(m.route); }
  if (m.menu && m.menu.show !== undefined && typeof m.menu.show !== 'boolean') fail(dir.name, 'menu.show phải là true hoặc false');
  if (m.entry && !fs.existsSync(path.join(root, dir.name, m.entry))) fail(dir.name, `không thấy file entry "${m.entry}"`);
}
// Kiểm tra các mục của bộ sưu tập (modules/<id>/items/*.md)
function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? m[1] : null;
}
for (const dir of fs.readdirSync(root, { withFileTypes: true })) {
  if (!dir.isDirectory() || dir.name === 'MODULE_TEMPLATE') continue;
  const mj = path.join(root, dir.name, 'module.json');
  if (!fs.existsSync(mj)) continue;
  let m; try { m = JSON.parse(fs.readFileSync(mj, 'utf8')); } catch { continue; }
  if (!m.collection) continue;
  const idir = path.join(root, dir.name, m.collection.dir || 'items');
  if (!fs.existsSync(idir)) continue;
  for (const f of fs.readdirSync(idir)) {
    if (!f.endsWith('.md')) continue;
    const name = `${dir.name}/${f}`;
    const base = f.replace(/\.md$/, '');
    if (!SLUG.test(base)) fail(name, 'tên file chỉ gồm chữ thường, số, dấu gạch ngang');
    const fm = frontmatter(fs.readFileSync(path.join(idir, f), 'utf8'));
    if (fm === null) { fail(name, 'thiếu khối --- ở đầu file'); continue; }
    if (!/^title:\s*\S/m.test(fm)) fail(name, 'thiếu title');
    if (!/^date:\s*\d{4}-\d{2}-\d{2}/m.test(fm)) fail(name, 'date phải dạng YYYY-MM-DD');
    if (/DÁN LINK FILE VÀO ĐÂY/.test(fm) && !/^draft:\s*true/m.test(fm)) fail(name, 'còn dòng "DÁN LINK FILE VÀO ĐÂY": điền link thật hoặc đặt draft: true');
    for (const u of fm.matchAll(/^\s*url:\s*["']?([^"'\n]+)["']?/gm)) {
      const url = u[1].trim();
      if (!/^(https:\/\/|\/)/.test(url) && !/DÁN LINK/.test(url)) fail(name, `link file phải bắt đầu bằng https:// hoặc "/": ${url}`);
      if (url.startsWith('/') && !fs.existsSync(path.join('public', url.slice(1)))) fail(name, `không thấy file trong public/: ${url}`);
    }
  }
}

// Kiểm tra theme được chọn trong site.config.json
try {
  const cfg = JSON.parse(fs.readFileSync('site.config.json', 'utf8'));
  const td = path.join('themes', String(cfg.theme));
  if (!cfg.theme || !fs.existsSync(path.join(td, 'style.css'))) { errors++; console.error(`✗ site.config.json: theme "${cfg.theme}" thiếu themes/<id>/style.css`); }
  else {
    const tj = path.join(td, 'theme.json');
    if (!fs.existsSync(tj)) { errors++; console.error(`✗ themes/${cfg.theme}: thiếu theme.json`); }
    else if (JSON.parse(fs.readFileSync(tj, 'utf8')).id !== cfg.theme) { errors++; console.error(`✗ themes/${cfg.theme}: id trong theme.json phải trùng tên thư mục`); }
  }
} catch (e) { errors++; console.error('✗ site.config.json thiếu hoặc không hợp lệ'); }

if (errors) { console.error(`\n${errors} lỗi hợp đồng mô-đun.`); process.exit(1); }
console.log('✓ Tất cả mô-đun hợp lệ.');
