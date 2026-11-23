/* THEME flak: khẩu pháo cao xạ. Chỉ trang trí, không đổi nội dung hay liên kết của trang.
   - Nòng pháo xoay theo con trỏ chuột.
   - Chuột phải: bắn. Phần tử (liên kết hoặc nút) nằm dưới con trỏ sẽ nổ và biến mất.
   - Shift + chuột phải: mở menu chuột phải bình thường.
   - Nút "Đầu hàng": đưa mọi phần tử đã bị bắn trở lại.
   Tự tắt trên màn hình cảm ứng (không có chuột) để không cản việc bấm liên kết. */
(function () {
  if (window.__flakLoaded) return;
  window.__flakLoaded = true;
  var mq = window.matchMedia;
  if (mq && mq('(hover: none)').matches) return;
  var reduce = !!(mq && mq('(prefers-reduced-motion: reduce)').matches);
  var canAnimate = typeof Element !== 'undefined' && !!Element.prototype.animate;

  var PX = 62, PY = 52, BARREL = 82;           // trục xoay và chiều dài nòng (đơn vị SVG)
  var TARGETS = 'a, button, [role="button"], summary, input[type="submit"], input[type="button"]';
  var gone = [];
  var angle = -50;                              // độ, 0 = hướng sang phải
  var lastFire = 0;

  var root = document.createElement('div');
  root.className = 'flak';
  root.setAttribute('data-flak-ui', '');
  root.innerHTML =
    '<svg viewBox="0 0 150 110" aria-hidden="true" focusable="false">' +
      '<defs>' +
        '<linearGradient id="flakBase" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b82f6"/><stop offset="1" stop-color="#1b2a7a"/></linearGradient>' +
        '<linearGradient id="flakHead" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8fc7"/><stop offset="1" stop-color="#ff4fa3"/></linearGradient>' +
        '<linearGradient id="flakGun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd8ff"/><stop offset="1" stop-color="#3b6fd8"/></linearGradient>' +
      '</defs>' +
      '<rect x="6" y="90" width="112" height="14" rx="5" fill="url(#flakBase)" stroke="#8fb4ff" stroke-opacity=".6"/>' +
      '<polygon points="28,90 96,90 82,68 42,68" fill="url(#flakBase)" stroke="#8fb4ff" stroke-opacity=".6"/>' +
      '<rect x="36" y="76" width="52" height="5" rx="2" fill="#ff4fa3" opacity=".85"/>' +
      '<g id="flakTurret" transform="translate(' + PX + ' ' + PY + ') rotate(' + angle + ')">' +
        '<g id="flakRecoil">' +
          '<rect x="2" y="-11" width="' + (BARREL - 2) + '" height="7" rx="3" fill="url(#flakGun)" stroke="#d7ecff" stroke-opacity=".7"/>' +
          '<rect x="2" y="4" width="' + (BARREL - 2) + '" height="7" rx="3" fill="url(#flakGun)" stroke="#d7ecff" stroke-opacity=".7"/>' +
          '<rect x="' + (BARREL - 14) + '" y="-13" width="14" height="11" rx="3" fill="url(#flakHead)"/>' +
          '<rect x="' + (BARREL - 14) + '" y="2" width="14" height="11" rx="3" fill="url(#flakHead)"/>' +
          '<rect x="-16" y="-15" width="26" height="30" rx="7" fill="url(#flakBase)" stroke="#8fb4ff" stroke-opacity=".7"/>' +
        '</g>' +
        '<circle cx="0" cy="0" r="12" fill="url(#flakHead)" stroke="#fff" stroke-opacity=".6"/>' +
        '<circle cx="0" cy="0" r="4" fill="#0d1440"/>' +
      '</g>' +
    '</svg>' +
    '<div class="flak-side">' +
      '<div class="flak-hint" id="flakHint"><b>Chuột phải</b>: bắn · <b>Shift + chuột phải</b>: menu thường</div>' +
      '<button type="button" class="flak-surrender" id="flakSurrender" data-flak-ui>Đầu hàng <span class="flak-count" id="flakCount" data-n="0">0</span></button>' +
    '</div>';
  document.body.appendChild(root);

  var fx = document.createElement('div');
  fx.className = 'flak-fx';
  fx.setAttribute('data-flak-ui', '');
  document.body.appendChild(fx);

  var turret = root.querySelector('#flakTurret');
  var recoil = root.querySelector('#flakRecoil');
  var svg = root.querySelector('svg');
  var hint = root.querySelector('#flakHint');
  var hintDefault = hint.innerHTML;
  var countEl = root.querySelector('#flakCount');
  var surrenderBtn = root.querySelector('#flakSurrender');
  var hintTimer = null;

  function pivot() {
    var r = svg.getBoundingClientRect();
    var k = r.width / 150;
    return { x: r.left + PX * k, y: r.top + PY * k, k: k };
  }
  function aim(x, y) {
    var p = pivot();
    angle = Math.atan2(y - p.y, x - p.x) * 180 / Math.PI;
    turret.setAttribute('transform', 'translate(' + PX + ' ' + PY + ') rotate(' + angle.toFixed(1) + ')');
  }
  function muzzle() {
    var p = pivot(), a = angle * Math.PI / 180;
    return { x: p.x + Math.cos(a) * BARREL * p.k, y: p.y + Math.sin(a) * BARREL * p.k };
  }
  // Dòng gợi ý chỉ hiện 8 giây đầu để không che chữ; các thông báo ngắn hiện rồi ẩn lại.
  function showHint(html, ms) {
    hint.innerHTML = html;
    hint.classList.remove('flak-hint-off');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(function () { hint.classList.add('flak-hint-off'); }, ms);
  }
  function say(html, ms) { showHint(html, ms || 1800); }
  function setCount() {
    countEl.textContent = String(gone.length);
    countEl.setAttribute('data-n', String(gone.length));
  }

  function findTarget(x, y) {
    var el = document.elementFromPoint(x, y);
    if (!el || (el.closest && el.closest('[data-flak-ui]'))) return null;
    var t = el.closest ? el.closest(TARGETS) : null;
    if (!t || t.classList.contains('flak-gone')) return null;
    return t;
  }

  function particle(cx, cy, big) {
    var d = document.createElement('div');
    d.className = 'flak-p';
    var s = 4 + Math.random() * (big ? 8 : 5);
    var colors = ['#ff4fa3', '#ff8fc7', '#5cc8ff', '#3b82f6', '#ffffff'];
    d.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (cx - s / 2) + 'px;top:' + (cy - s / 2) + 'px;background:' + colors[(Math.random() * colors.length) | 0] + ';box-shadow:0 0 8px currentColor;';
    fx.appendChild(d);
    var ang = Math.random() * Math.PI * 2, dist = (big ? 50 : 24) + Math.random() * (big ? 90 : 40);
    var dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist + 14;
    d.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(0)', opacity: 0 }],
      { duration: 450 + Math.random() * 450, easing: 'cubic-bezier(.15,.7,.3,1)' }).onfinish = function () { d.remove(); };
  }
  function boom(cx, cy, radius, big) {
    if (reduce || !canAnimate) return;
    var ring = document.createElement('div');
    ring.className = 'flak-ring';
    var r = Math.max(16, Math.min(radius, 90));
    ring.style.cssText = 'width:' + (r * 2) + 'px;height:' + (r * 2) + 'px;left:' + (cx - r) + 'px;top:' + (cy - r) + 'px;';
    fx.appendChild(ring);
    ring.animate([{ transform: 'scale(.2)', opacity: .95 }, { transform: 'scale(1.35)', opacity: 0 }], { duration: 420, easing: 'ease-out' }).onfinish = function () { ring.remove(); };
    var n = big ? 26 : 8;
    for (var i = 0; i < n; i++) particle(cx, cy, big);
  }

  function destroy(t) {
    var r = t.getBoundingClientRect();
    boom(r.left + r.width / 2, r.top + r.height / 2, Math.max(r.width, r.height) / 2 + 10, true);
    t.classList.remove('flak-back');
    t.classList.add('flak-gone');
    gone.push(t);
    setCount();
  }

  function fire(x, y) {
    var now = Date.now();
    if (now - lastFire < 160) return;
    lastFire = now;
    aim(x, y);
    var m = muzzle();
    var target = findTarget(x, y);
    var land = function () {
      if (target) destroy(target); else boom(x, y, 14, false);
    };
    if (canAnimate && !reduce) {
      recoil.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-9px)' }, { transform: 'translateX(0)' }], { duration: 200, easing: 'ease-out' });
      var s = document.createElement('div');
      s.className = 'flak-shot';
      s.style.left = m.x + 'px'; s.style.top = m.y + 'px';
      fx.appendChild(s);
      var dist = Math.hypot(x - m.x, y - m.y);
      var done = false;
      var finish = function () { if (done) return; done = true; s.remove(); land(); };
      var anim = s.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(' + (x - m.x) + 'px,' + (y - m.y) + 'px)' }],
        { duration: Math.max(60, Math.min(260, dist / 4)), easing: 'linear', fill: 'forwards' });
      anim.onfinish = finish;
      setTimeout(finish, 600);
    } else {
      land();
    }
  }

  function surrender() {
    var n = gone.length;
    gone.forEach(function (el) {
      el.classList.remove('flak-gone');
      el.classList.add('flak-back');
      (function (e) { setTimeout(function () { e.classList.remove('flak-back'); }, 500); })(el);
    });
    gone = [];
    setCount();
    say(n ? '<b>Đầu hàng!</b> ' + n + ' nút đã trở lại.' : 'Chưa có nút nào bị bắn.', 1800);
  }

  document.addEventListener('pointermove', function (e) { if (e.pointerType !== 'touch') aim(e.clientX, e.clientY); }, { passive: true });
  document.addEventListener('contextmenu', function (e) {
    if (e.shiftKey) return;                                  // Shift + chuột phải: menu bình thường
    if (e.target.closest && e.target.closest('[data-flak-ui]')) return;
    e.preventDefault();
    fire(e.clientX, e.clientY);
  });
  surrenderBtn.addEventListener('click', surrender);
  setCount();
  showHint(hintDefault, 8000);
})();
