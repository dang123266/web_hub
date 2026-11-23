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
  if (m.entry && !fs.existsSync(path.join(root, dir.name, m.entry))) fail(dir.name, `không thấy file entry "${m.entry}"`);
}
if (errors) { console.error(`\n${errors} lỗi hợp đồng mô-đun.`); process.exit(1); }
console.log('✓ Tất cả mô-đun hợp lệ.');
