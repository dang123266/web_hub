/* THEME flak: khẩu pháo cao xạ (chỉ trang trí, không đổi nội dung hay liên kết của trang).
   - Nòng pháo xoay theo con trỏ chuột.
   - Chuột phải: bắn. Liên kết hoặc nút nằm dưới con trỏ sẽ nổ và biến mất.
   - Shift + chuột phải: mở menu chuột phải bình thường.
   - Nút "Đầu hàng": đưa mọi phần tử đã bị bắn trở lại. Nút loa: bật/tắt âm thanh.
   - Âm thanh tạo trực tiếp bằng Web Audio (không tải file nào).
   Tự tắt trên màn hình cảm ứng (không có chuột) để không cản việc bấm liên kết. */
(function () {
  if (window.__flakLoaded) return;
  window.__flakLoaded = true;
  var mq = window.matchMedia;
  var AC = window.AudioContext || window.webkitAudioContext;

  /* ===================== ÂM THANH (Web Audio) ===================== */
  function makeAudio(c, dest) {
    var master = c.createGain(); master.gain.value = 0.9;
    var comp = c.createDynamicsCompressor();
    comp.threshold.value = -9; comp.knee.value = 8; comp.ratio.value = 4; comp.attack.value = 0.002; comp.release.value = 0.25;
    var lim = c.createDynamicsCompressor();          // bộ giới hạn cuối chuỗi: chống méo khi tiếng bắn và tiếng nổ chồng nhau
    lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.12;
    var out = c.createGain(); out.gain.value = 1.0;
    master.connect(comp); comp.connect(lim); lim.connect(out); out.connect(dest);

    function noiseBuffer(sec, brown) {
      var n = Math.floor(c.sampleRate * sec), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0), last = 0;
      for (var i = 0; i < n; i++) {
        var w = Math.random() * 2 - 1;
        if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
      }
      return b;
    }
    var white = noiseBuffer(2.5, false), brown = noiseBuffer(3, true);

    // vang ngoài trời: xung đáp ứng là nhiễu tắt dần
    var verb = c.createConvolver(), vlen = Math.floor(c.sampleRate * 1.3), vb = c.createBuffer(2, vlen, c.sampleRate);
    for (var ch = 0; ch < 2; ch++) { var vd = vb.getChannelData(ch); for (var i = 0; i < vlen; i++) vd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / vlen, 2.6); }
    verb.buffer = vb;
    var verbGain = c.createGain(); verbGain.gain.value = 0.34;
    verb.connect(verbGain); verbGain.connect(master);

    function send(node, amount) { node.connect(master); if (amount) { var g = c.createGain(); g.gain.value = amount; node.connect(g); g.connect(verb); } }
    function env(g, t, atk, peak, dec) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + atk);
      g.gain.exponentialRampToValueAtTime(0.0001, t + atk + dec);
    }
    function noise(t, buf, dur, filtType, f0, f1, q, atk, peak, dec, rev) {
      var s = c.createBufferSource(); s.buffer = buf;
      var f = c.createBiquadFilter(); f.type = filtType; f.Q.value = q || 0.7;
      f.frequency.setValueAtTime(f0, t);
      if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      var g = c.createGain(); env(g, t, atk, peak, dec);
      s.connect(f); f.connect(g); send(g, rev);
      s.start(t, Math.random() * 0.5); s.stop(t + dur + dec + 0.05);
    }
    function tone(t, type, f0, f1, dur, atk, peak, dec, rev) {
      var o = c.createOscillator(); o.type = type;
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      var g = c.createGain(); env(g, t, atk, peak, dec);
      o.connect(g); send(g, rev);
      o.start(t); o.stop(t + dur + dec + 0.05);
    }

    return {
      // Tiếng nổ nòng: tiếng bốp đanh + luồng khí + cú đập trầm + tiếng khóa nòng
      shot: function (t) {
        noise(t, white, 0.05, 'highpass', 2200, 1800, 0.7, 0.001, 1.5, 0.05, 0.5);          // bốp đanh
        noise(t, white, 0.4, 'lowpass', 6000, 260, 0.9, 0.002, 1.6, 0.34, 0.7);            // luồng khí
        noise(t + 0.01, brown, 0.5, 'lowpass', 900, 90, 0.7, 0.004, 1.7, 0.45, 0.6);       // thân tiếng nổ
        tone(t, 'sine', 170, 36, 0.24, 0.003, 1.7, 0.3, 0.5);                              // cú đập trầm
        tone(t, 'triangle', 95, 50, 0.16, 0.003, 0.5, 0.2, 0.3);
        noise(t + 0.17, white, 0.05, 'bandpass', 1300, 0, 3, 0.001, 0.3, 0.06, 0.1);        // khóa nòng
        tone(t + 0.17, 'square', 240, 120, 0.05, 0.001, 0.12, 0.06, 0);
        noise(t + 0.46, white, 0.03, 'bandpass', 3200, 0, 6, 0.001, 0.12, 0.05, 0.05);      // vỏ đạn rơi
      },
      // Tiếng nổ: bốp, quầng lửa, đập sub, ầm ì kéo dài, mảnh vỡ loảng xoảng
      boom: function (t, size) {
        var s = 0.2 + 0.8 * size, big = size > 0.35;
        noise(t, white, 0.08, 'highpass', 900, 600, 0.7, 0.001, 0.95 * s, 0.08, 0.5);
        noise(t, white, 0.9, 'lowpass', 7000, 140, 0.9, 0.006, 1.0 * s, 0.85, 0.8);
        tone(t, 'sine', 78, 24, 0.75, 0.004, 1.35 * s, 0.9, 0.6);
        tone(t, 'sine', 135, 48, 0.3, 0.003, 0.8 * s, 0.7, 0.4);
        if (big) {
          noise(t + 0.03, brown, 1.5, 'lowpass', 300, 70, 0.7, 0.05, 0.95 * s, 1.6, 0.9);   // ầm ì
          for (var i = 0; i < 9; i++) {                                                        // mảnh vỡ
            noise(t + 0.1 + Math.random() * 0.75, white, 0.04, 'bandpass', 2200 + Math.random() * 5000, 0, 9, 0.001, 0.13 + Math.random() * 0.12, 0.05, 0.3);
          }
        }
      },
      chime: function (t) {
        tone(t, 'sine', 660, 662, 0.12, 0.005, 0.16, 0.25, 0.4);
        tone(t + 0.1, 'sine', 880, 884, 0.14, 0.005, 0.16, 0.35, 0.5);
      }
    };
  }
  if (window.__flakExpose) window.__flakExpose({ makeAudio: makeAudio });   // dùng khi kiểm thử

  if (mq && mq('(hover: none)').matches) return;
  var reduce = !!(mq && mq('(prefers-reduced-motion: reduce)').matches);
  var canAnimate = typeof Element !== 'undefined' && !!Element.prototype.animate;

  var ctx = null, audio = null, soundOn = true;
  try { soundOn = localStorage.getItem('flakSound') !== 'off'; } catch (e) {}
  function ensureAudio() {
    if (!AC) return null;
    try {
      if (!ctx) { ctx = new AC(); audio = makeAudio(ctx, ctx.destination); }
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { return null; }
    return audio;
  }
  function play(name, a, b) {
    if (!soundOn) return;
    var au = ensureAudio();
    if (au && ctx.state !== 'closed') { try { au[name](ctx.currentTime + 0.005, a, b); } catch (e) {} }
  }

  /* ===================== KHẨU PHÁO ===================== */
  var W = 220, H = 130, PX = 64, PY = 70, BARREL = 140;
  var TARGETS = 'a, button, [role="button"], summary, input[type="submit"], input[type="button"]';
  var gone = [];
  var angle = -45, flip = 1;
  var lastFire = 0;

  var root = document.createElement('div');
  root.className = 'flak';
  root.setAttribute('data-flak-ui', '');
  root.innerHTML =
    '<svg viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true" focusable="false">' +
      '<defs>' +
        '<linearGradient id="fkSteel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8da2d8"/><stop offset=".45" stop-color="#4a5c96"/><stop offset="1" stop-color="#232c52"/></linearGradient>' +
        '<linearGradient id="fkDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46558a"/><stop offset="1" stop-color="#161c3a"/></linearGradient>' +
        '<linearGradient id="fkBarrel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4e2ff"/><stop offset=".25" stop-color="#7d93cf"/><stop offset=".7" stop-color="#34437a"/><stop offset="1" stop-color="#151b3a"/></linearGradient>' +
        '<linearGradient id="fkBrass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f6d98a"/><stop offset=".5" stop-color="#c7952f"/><stop offset="1" stop-color="#8a5f17"/></linearGradient>' +
        '<linearGradient id="fkCone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".25" stop-color="#ffe7a0"/><stop offset=".65" stop-color="#ff9a2e" stop-opacity=".85"/><stop offset="1" stop-color="#ff4a1a" stop-opacity="0"/></linearGradient>' +
        '<radialGradient id="fkHub" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#cfe0ff"/><stop offset=".6" stop-color="#4b5d98"/><stop offset="1" stop-color="#1a2146"/></radialGradient>' +
      '</defs>' +
      // --- giá pháo (đứng yên) ---
      '<ellipse cx="66" cy="122" rx="74" ry="5" fill="#000" opacity=".38"/>' +
      '<g>' +
        '<circle cx="42" cy="108" r="11" fill="#12162f" stroke="#3a4a80" stroke-width="1.5"/><circle cx="42" cy="108" r="5.5" fill="url(#fkHub)"/>' +
        '<circle cx="90" cy="108" r="11" fill="#12162f" stroke="#3a4a80" stroke-width="1.5"/><circle cx="90" cy="108" r="5.5" fill="url(#fkHub)"/>' +
        '<path d="M42 97v22M31 108h22M90 97v22M79 108h22" stroke="#2a3563" stroke-width="1"/>' +
      '</g>' +
      '<polygon points="32,94 46,94 18,119 4,119" fill="url(#fkDark)" stroke="#7f98dc" stroke-opacity=".5"/>' +
      '<polygon points="84,94 98,94 128,119 114,119" fill="url(#fkDark)" stroke="#7f98dc" stroke-opacity=".5"/>' +
      '<rect x="0" y="118" width="24" height="5" rx="2" fill="#1a2146" stroke="#7f98dc" stroke-opacity=".5"/>' +
      '<rect x="110" y="118" width="24" height="5" rx="2" fill="#1a2146" stroke="#7f98dc" stroke-opacity=".5"/>' +
      '<polygon points="22,91 110,91 102,103 30,103" fill="url(#fkSteel)" stroke="#9db4f0" stroke-opacity=".6"/>' +
      '<line x1="28" y1="97" x2="104" y2="97" stroke="#ff4fa3" stroke-width="1.6"/>' +
      '<polygon points="46,91 82,91 76,78 52,78" fill="url(#fkDark)" stroke="#7f98dc" stroke-opacity=".5"/>' +
      '<path d="M50 80 L52 66 Q64 58 76 66 L78 80 Z" fill="url(#fkSteel)" stroke="#9db4f0" stroke-opacity=".6"/>' +
      // --- cụm pháo xoay theo độ cao nòng ---
      '<g id="fkTurret" transform="translate(' + PX + ' ' + PY + ') scale(1 1) rotate(' + angle + ')">' +
        '<polygon points="13,-27 20,-27 24,23 17,23" fill="url(#fkDark)" stroke="#9db4f0" stroke-opacity=".6"/>' +
        '<circle cx="18.6" cy="-19" r="1.1" fill="#9db4f0"/><circle cx="19.6" cy="-4" r="1.1" fill="#9db4f0"/><circle cx="20.8" cy="12" r="1.1" fill="#9db4f0"/>' +
        '<rect x="3" y="9" width="42" height="5.5" rx="2.5" fill="url(#fkDark)" stroke="#9db4f0" stroke-opacity=".5"/>' +
        '<g id="fkRecoilRod"><rect x="44" y="10.2" width="16" height="3" rx="1.4" fill="#cfe0ff" opacity=".85"/></g>' +
        '<rect x="-2" y="-9" width="38" height="18" rx="4" fill="url(#fkSteel)" stroke="#a9bef5" stroke-opacity=".7"/>' +
        '<path d="M-27 -11 Q-30 0 -27 13 L-3 15 L-3 -13 Z" fill="url(#fkSteel)" stroke="#a9bef5" stroke-opacity=".7"/>' +
        '<rect x="-25" y="-17" width="9" height="5" rx="1.5" fill="url(#fkDark)"/>' +
        // hộp tiếp đạn phía trên
        '<polygon points="-23,-13 -6,-13 -4,-28 -25,-28" fill="url(#fkDark)" stroke="#9db4f0" stroke-opacity=".6"/>' +
        '<rect x="-22" y="-33" width="3.4" height="6" rx="1.2" fill="url(#fkBrass)"/><rect x="-17" y="-33" width="3.4" height="6" rx="1.2" fill="url(#fkBrass)"/>' +
        '<rect x="-12" y="-33" width="3.4" height="6" rx="1.2" fill="url(#fkBrass)"/><rect x="-7" y="-33" width="3.4" height="6" rx="1.2" fill="url(#fkBrass)"/>' +
        '<g id="fkBarrelG">' +
          '<polygon points="30,-5 128,-3.2 128,3.2 30,5" fill="url(#fkBarrel)" stroke="#e1ecff" stroke-opacity=".5" stroke-width=".6"/>' +
          '<rect x="52" y="-6.3" width="3.4" height="12.6" rx="1" fill="#4a5c96" stroke="#cfe0ff" stroke-opacity=".6" stroke-width=".6"/>' +
          '<rect x="78" y="-5.7" width="3.4" height="11.4" rx="1" fill="#4a5c96" stroke="#cfe0ff" stroke-opacity=".6" stroke-width=".6"/>' +
          '<rect x="102" y="-5.1" width="3.4" height="10.2" rx="1" fill="#4a5c96" stroke="#cfe0ff" stroke-opacity=".6" stroke-width=".6"/>' +
          '<rect x="127" y="-6" width="14" height="12" rx="2" fill="url(#fkSteel)" stroke="#cfe0ff" stroke-opacity=".7" stroke-width=".7"/>' +
          '<rect x="127" y="-6" width="3.2" height="12" fill="#ff4fa3"/>' +
          '<rect x="132" y="-5.4" width="1.3" height="10.8" fill="#080c22"/><rect x="135" y="-5.4" width="1.3" height="10.8" fill="#080c22"/><rect x="138" y="-5.4" width="1.3" height="10.8" fill="#080c22"/>' +
        '</g>' +
        '<circle cx="0" cy="0" r="9" fill="url(#fkHub)" stroke="#e1ecff" stroke-opacity=".7"/><circle cx="0" cy="0" r="3" fill="#10163a"/>' +
        // chớp đầu nòng
        '<g transform="translate(' + BARREL + ' 0)"><g id="fkFlash" style="opacity:0">' +
          '<polygon points="0,-7 58,0 0,7" fill="url(#fkCone)"/>' +
          '<polygon points="2,-6 9,-26 15,-6" fill="#ffb84a" opacity=".9"/><polygon points="2,6 9,26 15,6" fill="#ffb84a" opacity=".9"/>' +
          '<polygon points="0,-19 4,-6 17,-12 8,-2 22,0 8,2 17,12 4,6 0,19 -4,6 -17,12 -8,2 -22,0 -8,-2 -17,-12 -4,-6" fill="#fff8d6"/>' +
        '</g></g>' +
      '</g>' +
    '</svg>' +
    '<div class="flak-side">' +
      '<div class="flak-hint" id="fkHint"><b>Chuột phải</b>: bắn · <b>Shift + chuột phải</b>: menu thường</div>' +
      '<div class="flak-row">' +
        '<button type="button" class="flak-surrender" id="fkSurrender" data-flak-ui>Đầu hàng <span class="flak-count" id="fkCount" data-n="0">0</span></button>' +
        '<button type="button" class="flak-sound" id="fkSound" data-flak-ui aria-label="Bật hoặc tắt âm thanh" aria-pressed="true" title="Âm thanh"></button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(root);

  var fx = document.createElement('div');
  fx.className = 'flak-fx';
  fx.setAttribute('data-flak-ui', '');
  document.body.appendChild(fx);

  var $ = function (id) { return root.querySelector('#' + id); };
  var turret = $('fkTurret'), barrelG = $('fkBarrelG'), rodG = $('fkRecoilRod'), flashG = $('fkFlash');
  var svg = root.querySelector('svg'), hint = $('fkHint'), hintDefault = hint.innerHTML;
  var countEl = $('fkCount'), surrenderBtn = $('fkSurrender'), soundBtn = $('fkSound');
  var hintTimer = null;

  var ICON_ON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>';
  var ICON_OFF = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
  function drawSound() { soundBtn.innerHTML = soundOn ? ICON_ON : ICON_OFF; soundBtn.setAttribute('aria-pressed', soundOn ? 'true' : 'false'); }

  function pivot() {
    var r = svg.getBoundingClientRect(), k = r.width / W;
    return { x: r.left + PX * k, y: r.top + PY * k, k: k };
  }
  function aim(x, y) {
    var p = pivot(), dx = x - p.x, dy = y - p.y;
    flip = dx < 0 ? -1 : 1;                                   // quay sang trái thì lật pháo, nòng không bị lộn ngược
    angle = Math.max(-88, Math.min(26, Math.atan2(dy, Math.abs(dx)) * 180 / Math.PI));
    turret.setAttribute('transform', 'translate(' + PX + ' ' + PY + ') scale(' + flip + ' 1) rotate(' + angle.toFixed(1) + ')');
  }
  function local(lx, ly) {                                    // điểm trong hệ pháo -> toạ độ màn hình
    var p = pivot(), a = angle * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return { x: p.x + flip * (lx * c - ly * s) * p.k, y: p.y + (lx * s + ly * c) * p.k };
  }
  function showHint(html, ms) {
    hint.innerHTML = html; hint.classList.remove('flak-hint-off');
    clearTimeout(hintTimer); hintTimer = setTimeout(function () { hint.classList.add('flak-hint-off'); }, ms);
  }
  function setCount() { countEl.textContent = String(gone.length); countEl.setAttribute('data-n', String(gone.length)); }

  /* ===================== HIỆU ỨNG ===================== */
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function el(cls, css) {
    var d = document.createElement('div'); d.className = cls; d.style.cssText = css; fx.appendChild(d); return d;
  }
  function anim(node, frames, opts) {
    var a = node.animate(frames, opts); a.onfinish = function () { node.remove(); }; return a;
  }
  function smokePuff(x, y, r, life, rise, dark, delay) {
    var d = el('flak-smoke', 'width:' + r * 2 + 'px;height:' + r * 2 + 'px;left:' + (x - r) + 'px;top:' + (y - r) + 'px;' + (dark ? 'opacity:.9;' : ''));
    var dx = rnd(-30, 30), up = rise + rnd(0, 40);
    anim(d, [{ transform: 'translate(0,0) scale(.35)', opacity: dark ? .85 : .6 },
             { transform: 'translate(' + dx * .5 + 'px,' + (-up * .5) + 'px) scale(1)', opacity: dark ? .6 : .4, offset: .4 },
             { transform: 'translate(' + dx + 'px,' + (-up) + 'px) scale(1.9)', opacity: 0 }],
      { duration: life, delay: delay || 0, fill: 'backwards', easing: 'cubic-bezier(.2,.6,.3,1)' });
  }
  function shake(power) {
    if (reduce || !canAnimate) return;
    var parts = document.querySelectorAll('.site-header, .site-main, .site-footer');
    for (var i = 0; i < parts.length; i++) {
      var f = [{ transform: 'translate(0,0)' }];
      for (var k = 0; k < 6; k++) { var m = power * (1 - k / 6); f.push({ transform: 'translate(' + rnd(-m, m).toFixed(1) + 'px,' + rnd(-m, m).toFixed(1) + 'px)' }); }
      f.push({ transform: 'translate(0,0)' });
      parts[i].animate(f, { duration: 320, easing: 'linear' });
    }
  }

  function explode(cx, cy, r, size, colors) {
    if (reduce || !canAnimate) return;
    var R = Math.max(26, Math.min(r * 1.5, 120));
    // quầng sáng + chớp trắng
    anim(el('flak-glow', 'width:' + R * 5 + 'px;height:' + R * 5 + 'px;left:' + (cx - R * 2.5) + 'px;top:' + (cy - R * 2.5) + 'px;'),
      [{ opacity: .95, transform: 'scale(.3)' }, { opacity: .55, transform: 'scale(.8)', offset: .3 }, { opacity: 0, transform: 'scale(1.1)' }], { duration: 260, easing: 'ease-out' });
    // quả cầu lửa (vài khối chồng nhau)
    for (var i = 0; i < 5; i++) {
      var rr = R * rnd(.55, 1.0), ox = i ? rnd(-R, R) * .45 : 0, oy = i ? rnd(-R, R) * .35 : 0;
      anim(el('flak-fire', 'width:' + rr * 2 + 'px;height:' + rr * 2 + 'px;left:' + (cx + ox - rr) + 'px;top:' + (cy + oy - rr) + 'px;'),
        [{ transform: 'scale(.15)', opacity: 1 }, { transform: 'scale(1)', opacity: .95, offset: .3 }, { transform: 'scale(1.25) translateY(' + (-R * .25) + 'px)', opacity: 0 }],
        { duration: rnd(380, 620), delay: i * 18, easing: 'cubic-bezier(.1,.7,.3,1)', fill: 'backwards' });
    }
    // sóng xung kích
    anim(el('flak-ring', 'width:' + R * 2 + 'px;height:' + R * 2 + 'px;left:' + (cx - R) + 'px;top:' + (cy - R) + 'px;'),
      [{ transform: 'scale(.15)', opacity: .9 }, { transform: 'scale(1.7)', opacity: 0 }], { duration: 480, easing: 'cubic-bezier(.1,.6,.2,1)' });
    // tia lửa: vạch sáng bay theo parabol, xoay theo hướng bay
    var ns = Math.round(26 + 22 * size);
    for (var s = 0; s < ns; s++) {
      var ang = rnd(0, Math.PI * 2), sp = rnd(70, 230 + 160 * size), vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp - 40, T = rnd(.45, .95), g = 520;
      var len = rnd(8, 22), col = ['#fff6c8', '#ffd36a', '#ffa530', '#ff6a1a'][(Math.random() * 4) | 0];
      var spark = el('flak-spark', 'height:' + len + 'px;left:' + cx + 'px;top:' + cy + 'px;background:linear-gradient(to bottom,' + col + ',rgba(255,90,20,0));');
      var fr = [];
      for (var q = 0; q <= 4; q++) {
        var t = q / 4 * T, X = vx * t, Y = vy * t + .5 * g * t * t, vyN = vy + g * t;
        fr.push({ transform: 'translate(' + X.toFixed(1) + 'px,' + Y.toFixed(1) + 'px) rotate(' + (Math.atan2(vyN, vx) * 180 / Math.PI + 90).toFixed(0) + 'deg) scaleY(' + (1 - q * .2).toFixed(2) + ')', opacity: q === 4 ? 0 : 1 });
      }
      anim(spark, fr, { duration: T * 1000, easing: 'linear' });
    }
    // mảnh vỡ của chính nút (màu theo nút), xoay và rơi
    for (var m = 0; m < 14; m++) {
      var w = rnd(4, 10), h = rnd(3, 7), a2 = rnd(0, Math.PI * 2), sp2 = rnd(60, 190 + 80 * size), T2 = rnd(.7, 1.2);
      var vx2 = Math.cos(a2) * sp2, vy2 = Math.sin(a2) * sp2 - 90, col2 = colors[(Math.random() * colors.length) | 0];
      var frag = el('flak-frag', 'width:' + w + 'px;height:' + h + 'px;left:' + (cx - w / 2) + 'px;top:' + (cy - h / 2) + 'px;background:' + col2 + ';');
      var spin = rnd(-720, 720), f2 = [];
      for (var z = 0; z <= 4; z++) { var tt = z / 4 * T2; f2.push({ transform: 'translate(' + (vx2 * tt).toFixed(1) + 'px,' + (vy2 * tt + 420 * tt * tt).toFixed(1) + 'px) rotate(' + (spin * z / 4).toFixed(0) + 'deg)', opacity: z === 4 ? 0 : 1 }); }
      anim(frag, f2, { duration: T2 * 1000, easing: 'linear' });
    }
    // khói
    for (var k = 0; k < 6; k++) smokePuff(cx + rnd(-R, R) * .6, cy + rnd(-R, R) * .4, rnd(R * .5, R * .95), rnd(1100, 1900), rnd(40, 110), true, rnd(110, 260));
    shake(2 + 5 * size);
  }
  function sparkPop(x, y) {                                    // bắn trượt: chớp nhỏ và bụi
    if (reduce || !canAnimate) return;
    anim(el('flak-glow', 'width:70px;height:70px;left:' + (x - 35) + 'px;top:' + (y - 35) + 'px;'), [{ opacity: .9, transform: 'scale(.3)' }, { opacity: 0, transform: 'scale(1)' }], { duration: 180 });
    for (var s = 0; s < 10; s++) {
      var ang = rnd(0, Math.PI * 2), sp = rnd(40, 120), T = rnd(.25, .5), vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp - 20, len = rnd(6, 12);
      var sk = el('flak-spark', 'height:' + len + 'px;left:' + x + 'px;top:' + y + 'px;background:linear-gradient(to bottom,#ffd36a,rgba(255,90,20,0));'), fr = [];
      for (var q = 0; q <= 3; q++) { var t = q / 3 * T; fr.push({ transform: 'translate(' + (vx * t).toFixed(1) + 'px,' + (vy * t + 260 * t * t).toFixed(1) + 'px) rotate(' + (Math.atan2(vy + 520 * t, vx) * 180 / Math.PI + 90).toFixed(0) + 'deg)', opacity: q === 3 ? 0 : 1 }); }
      anim(sk, fr, { duration: T * 1000, easing: 'linear' });
    }
    smokePuff(x, y, 16, 700, 24, false);
  }

  function muzzleFx(m) {
    if (reduce || !canAnimate) return;
    flashG.animate([{ opacity: 1, transform: 'scale(.5)' }, { opacity: 1, transform: 'scale(1.1)', offset: .35 }, { opacity: 0, transform: 'scale(1.3)' }], { duration: 120, easing: 'ease-out' });
    anim(el('flak-glow', 'width:150px;height:150px;left:' + (m.x - 75) + 'px;top:' + (m.y - 75) + 'px;'), [{ opacity: .8, transform: 'scale(.4)' }, { opacity: 0, transform: 'scale(1)' }], { duration: 160 });
    for (var i = 0; i < 4; i++) smokePuff(m.x + rnd(-6, 6), m.y + rnd(-6, 6), rnd(10, 18), rnd(900, 1500), rnd(25, 60), false);
    // vỏ đạn văng ra phía sau khoá nòng
    var b = local(-22, 4), w = 4, h = 11;
    var cas = el('flak-case', 'width:' + w + 'px;height:' + h + 'px;left:' + b.x + 'px;top:' + b.y + 'px;');
    var vx = -flip * rnd(50, 110), vy = -rnd(90, 160), T = .75, fr = [];
    for (var z = 0; z <= 5; z++) { var t = z / 5 * T; fr.push({ transform: 'translate(' + (vx * t).toFixed(1) + 'px,' + (vy * t + 560 * t * t).toFixed(1) + 'px) rotate(' + (z * 150 * (flip)) + 'deg)', opacity: z === 5 ? 0 : 1 }); }
    anim(cas, fr, { duration: T * 1000, easing: 'linear' });
  }

  /* ===================== BẮN ===================== */
  function findTarget(x, y) {
    var e = document.elementFromPoint(x, y);
    if (!e || (e.closest && e.closest('[data-flak-ui]'))) return null;
    var t = e.closest ? e.closest(TARGETS) : null;
    return (!t || t.classList.contains('flak-gone')) ? null : t;
  }
  function destroy(t) {
    var r = t.getBoundingClientRect(), cs = getComputedStyle(t), cols = ['#ff4fa3', '#3b82f6', '#5cc8ff'];
    if (cs.color) cols.push(cs.color);
    var rad = Math.max(r.width, r.height) / 2;
    play('boom', Math.max(.3, Math.min(rad / 70, 1)));
    explode(r.left + r.width / 2, r.top + r.height / 2, rad + 8, Math.max(.35, Math.min(rad / 70, 1)), cols);
    t.classList.remove('flak-back'); t.classList.add('flak-gone');
    gone.push(t); setCount();
  }
  function fire(x, y) {
    var now = Date.now();
    if (now - lastFire < 220) return;
    lastFire = now;
    aim(x, y);
    var m = local(BARREL, 0), target = findTarget(x, y);
    play('shot');
    var land = function () { if (target) destroy(target); else { play('boom', .12); sparkPop(x, y); } };
    if (canAnimate && !reduce) {
      var rec = [{ transform: 'translateX(0)' }, { transform: 'translateX(-15px)', offset: .12 }, { transform: 'translateX(-15px)', offset: .2 }, { transform: 'translateX(0)' }];
      barrelG.animate(rec, { duration: 520, easing: 'cubic-bezier(.2,.7,.3,1)' });
      rodG.animate(rec, { duration: 520, easing: 'cubic-bezier(.2,.7,.3,1)' });
      svg.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(' + (-flip * 2.5) + 'px,1.5px)', offset: .1 }, { transform: 'translate(0,0)' }], { duration: 260 });
      muzzleFx(m);
      var dist = Math.hypot(x - m.x, y - m.y), ang = Math.atan2(y - m.y, x - m.x) * 180 / Math.PI;
      var s = el('flak-shot', 'left:' + m.x + 'px;top:' + m.y + 'px;'), done = false;
      var finish = function () { if (done) return; done = true; s.remove(); land(); };
      var a = s.animate([{ transform: 'translate(0,0) rotate(' + ang + 'deg)' }, { transform: 'translate(' + (x - m.x) + 'px,' + (y - m.y) + 'px) rotate(' + ang + 'deg)' }],
        { duration: Math.max(45, Math.min(260, dist / 3.2)), easing: 'linear', fill: 'forwards' });
      a.onfinish = finish; setTimeout(finish, 700);
    } else land();
  }
  function surrender() {
    var n = gone.length;
    gone.forEach(function (e) {
      e.classList.remove('flak-gone'); e.classList.add('flak-back');
      (function (q) { setTimeout(function () { q.classList.remove('flak-back'); }, 500); })(e);
    });
    gone = []; setCount();
    if (n) play('chime');
    showHint(n ? '<b>Đầu hàng!</b> ' + n + ' nút đã trở lại.' : 'Chưa có nút nào bị bắn.', 1800);
  }

  /* ===================== SỰ KIỆN ===================== */
  document.addEventListener('pointermove', function (e) { if (e.pointerType !== 'touch') aim(e.clientX, e.clientY); }, { passive: true });
  document.addEventListener('pointerdown', function () { if (soundOn) ensureAudio(); }, { passive: true });   // trình duyệt chỉ cho phát tiếng sau thao tác của người dùng
  document.addEventListener('contextmenu', function (e) {
    if (e.shiftKey) return;                                  // Shift + chuột phải: menu bình thường
    if (e.target.closest && e.target.closest('[data-flak-ui]')) return;
    e.preventDefault();
    fire(e.clientX, e.clientY);
  });
  surrenderBtn.addEventListener('click', surrender);
  soundBtn.addEventListener('click', function () {
    soundOn = !soundOn;
    try { localStorage.setItem('flakSound', soundOn ? 'on' : 'off'); } catch (e) {}
    drawSound();
    if (soundOn) { ensureAudio(); play('chime'); }
  });
  drawSound(); setCount(); aim(window.innerWidth * 0.6, window.innerHeight * 0.3);
  showHint(hintDefault, 8000);
})();
