/* ============================================================================
   Sổ Kho · Giao diện theo giờ mặt trời và thời tiết tại nhà máy (Đức Hòa, Tây Ninh)
   - Giờ: bình minh, buổi sáng, buổi trưa, buổi chiều, hoàng hôn, ban đêm — tính tại máy
     theo giờ mặt trời mọc / lặn của nhà máy, không cần mạng.
   - Thời tiết: dự báo của MET Norway (api.met.no, giấy phép CC BY 4.0), lưu đệm theo
     giờ hết hạn của máy chủ (≈ 30 phút), lỗi mạng thì chỉ đổi màu theo giờ.
   - Hiệu ứng chỉ ở dải đầu trang; tắt được trong ô thời tiết; máy đặt "giảm chuyển động"
     thì không chạy hiệu ứng động.
   ========================================================================== */
"use strict";
(function () {
  const LAT = 10.85, LON = 106.45, OFF = 7 * 3600e3, KW = "sokho_wx1", KF = "sokho_skyfx", NOI = "Nhà máy · Đức Hòa, Tây Ninh";
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hm = t => { const d = new Date(t); return isNaN(d) ? "" : d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }); };
  const nf = (v, d) => v == null || isNaN(+v) ? "—" : (+v).toLocaleString("vi-VN", { maximumFractionDigits: d });
  const fxOn = () => { try { return localStorage.getItem(KF) !== "off"; } catch (e) { return true; } };

  /* ---------- giờ mặt trời mọc / lặn (phương trình mặt trời mọc, sai số ~1–2 phút) ---------- */
  function sun(now) {
    const r = Math.PI / 180, L0 = new Date(now.getTime() + OFF);
    const J = Date.UTC(L0.getUTCFullYear(), L0.getUTCMonth(), L0.getUTCDate(), 5) / 864e5 + 2440587.5; /* 12:00 giờ VN */
    const n = Math.round(J - 2451545 + 0.0008), Js = n - LON / 360, M = (357.5291 + 0.98560028 * Js) % 360;
    const C = 1.9148 * Math.sin(M * r) + 0.02 * Math.sin(2 * M * r) + 0.0003 * Math.sin(3 * M * r), lam = (M + C + 282.9372) % 360;
    const Jt = 2451545 + Js + 0.0053 * Math.sin(M * r) - 0.0069 * Math.sin(2 * lam * r), dec = Math.asin(Math.sin(lam * r) * Math.sin(23.4397 * r));
    const w = Math.acos((Math.sin(-0.833 * r) - Math.sin(LAT * r) * Math.sin(dec)) / (Math.cos(LAT * r) * Math.cos(dec)));
    const t = j => (j - 2440587.5) * 864e5;
    return { noon: t(Jt), rise: t(Jt - w / (2 * Math.PI)), set: t(Jt + w / (2 * Math.PI)) };
  }
  const PH = { binhminh: "Bình minh", sang: "Buổi sáng", trua: "Buổi trưa", chieu: "Buổi chiều", hoanghon: "Hoàng hôn", dem: "Ban đêm" };
  function phase(t, S) {
    const m = 60e3;
    if (t < S.rise - 35 * m || t >= S.set + 35 * m) return "dem";
    if (t < S.rise + 45 * m) return "binhminh";
    if (t < S.noon - 60 * m) return "sang";
    if (t < S.noon + 90 * m) return "trua";
    if (t < S.set - 60 * m) return "chieu";
    return "hoanghon";
  }

  /* ---------- thời tiết: mã ký hiệu MET Norway → nhóm hiển thị ---------- */
  const WX = { quang: "Trong xanh", itmay: "Ít mây", comay: "Có mây", nhieumay: "Nhiều mây", suongmu: "Sương mù", muanho: "Mưa nhỏ", mua: "Có mưa", muato: "Mưa to", giong: "Mưa giông" };
  function wxOf(code) {
    const b = String(code || "").replace(/_(day|night|polartwilight)$/, "");
    if (!b) return "";
    if (/thunder/.test(b)) return "giong";
    if (/^heavy(rain|sleet)/.test(b)) return "muato";
    if (/rain|sleet|snow/.test(b)) return /^light/.test(b) ? "muanho" : "mua";
    if (b === "fog") return "suongmu";
    if (b === "cloudy") return "nhieumay";
    if (b === "partlycloudy") return "comay";
    if (b === "fair") return "itmay";
    if (b === "clearsky") return "quang";
    return "";
  }
  const load = () => { try { return JSON.parse(localStorage.getItem(KW) || "null"); } catch (e) { return null; } };
  const save = v => { try { localStorage.setItem(KW, JSON.stringify(v)); } catch (e) { } };
  let W = load(), busy = false, err = "", F = null, nextTry = 0;
  const fresh = () => !!(W && W.d && Date.now() - W.t < 3 * 3600e3);
  async function fetchWx(force) {
    const now = Date.now();
    if (busy || (!force && W && W.exp > now) || now < nextTry) return;
    busy = true;
    try {
      const r = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${LAT}&lon=${LON}`);
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json(), ex = Date.parse(r.headers.get("Expires") || "") || 0, ts = (j.properties && j.properties.timeseries) || [];
      let i = ts.findIndex(x => Date.parse(x.time) > now); i = i < 0 ? ts.length - 1 : Math.max(0, i - 1);
      const x = ts[i] || {}, D = x.data || {}, I = (D.instant && D.instant.details) || {}, s = k => D[k] && D[k].summary ? D[k].summary.symbol_code : "", p = k => D[k] && D[k].details ? D[k].details.precipitation_amount : null;
      W = { t: now, exp: Math.max(ex, now + 15 * 60e3) + Math.round(Math.random() * 120e3), d: { temp: I.air_temperature, rh: I.relative_humidity, cloud: I.cloud_area_fraction, wind: I.wind_speed, c1: s("next_1_hours"), p1: p("next_1_hours"), c6: s("next_6_hours"), p6: p("next_6_hours"), c12: s("next_12_hours") } };
      save(W); err = "";
    } catch (e) { err = "Chưa tải được dự báo thời tiết (" + (e.message || "mạng") + ")."; nextTry = now + 10 * 60e3; }
    finally { busy = false; apply(); }
  }

  /* ---------- biểu tượng ---------- */
  const SUN = '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>';
  const MOON = '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>';
  const CLOUD = '<path d="M7 19h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.4 10.2 4.4 4.4 0 0 0 7 19z"/>';
  const SMALLSUN = '<circle cx="8" cy="8" r="3"/><path d="M8 2v1.4M2 8h1.4M3.8 3.8l1 1M12.2 3.8l-1 1"/>';
  const SMALLMOON = '<path d="M11.5 9.5A4.6 4.6 0 1 1 5.6 3.3a3.8 3.8 0 0 0 5.9 6.2z"/>';
  const CL2 = '<path d="M9 20h9a3.6 3.6 0 0 0 .5-7.15A5.2 5.2 0 0 0 8.6 12a3.9 3.9 0 0 0 .4 8z"/>';
  function icon(wx, ph, big) {
    const n = ph === "dem", z = big ? 44 : 20; let b = "";
    if (!wx || wx === "quang") b = n ? MOON : SUN;
    else if (wx === "itmay" || wx === "comay") b = (n ? SMALLMOON : SMALLSUN) + CL2;
    else if (wx === "nhieumay") b = CLOUD;
    else if (wx === "suongmu") b = '<path d="M4 9h16M3 13h18M5 17h14"/>';
    else if (wx === "giong") b = '<path d="M7 15h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.4 6.2 4.4 4.4 0 0 0 7 15z"/><path d="M12.5 15l-2 3.5h3l-2 3.5"/>';
    else b = '<path d="M7 14h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.4 5.2 4.4 4.4 0 0 0 7 14z"/><path d="M8.5 17l-1 2.5M12.5 17l-1 2.5M16.5 17l-1 2.5"/>';
    return `<svg class="wxi wx-${wx || "x"}" viewBox="0 0 24 24" width="${z}" height="${z}" aria-hidden="true">${b}</svg>`;
  }

  /* ---------- trạng thái hiện tại ---------- */
  function cur() {
    const now = Date.now(), S = sun(new Date(now)), ph = F && F.ph || phase(now, S), d = fresh() ? W.d : null;
    const wx = F && F.wx || (d ? (wxOf(d.c1) || wxOf(d.c6)) : "");
    return { now, S, ph, wx, d };
  }
  function layer() {
    const h = document.querySelector("#appView header"); if (!h) return null;
    let L = $("skyFx");
    if (!L) { L = document.createElement("div"); L.id = "skyFx"; L.setAttribute("aria-hidden", "true"); L.innerHTML = '<i class="sk-g"></i><i class="sk-stars"></i><i class="sk-stars s2"></i><i class="sk-shoot"></i><i class="sk-sun"></i><i class="sk-moon"></i><i class="sk-bird"></i><i class="sk-cl c1"></i><i class="sk-cl c2"></i><i class="sk-cl c3"></i><i class="sk-fog"></i><i class="sk-rain"></i><i class="sk-flash"></i>'; h.prepend(L); }
    return L;
  }
  function chip() {
    let b = $("wxBtn"); const who = document.querySelector("#appView .who"), th = $("themeBtn");
    if (!b && who) {
      b = document.createElement("button"); b.id = "wxBtn"; b.type = "button"; b.className = "wxb";
      if (th) who.insertBefore(b, th); else who.prepend(b);
      b.onclick = e => { e.stopPropagation(); const p = $("wxPop"); if (p) p.remove(); else pop(); };
    }
    return b;
  }
  /* ---------- hình động như thật: vẽ bằng canvas — mây nhiều lớp trôi, mưa theo gió, nắng có quầng và tia,
     trăng sao lấp lánh, sao băng, chim vỗ cánh, chớp khi mưa giông, sương mù trôi ---------- */
  const RM = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const K = { cv: null, x: null, w: 0, h: 0, r: 1, key: "", raf: 0, last: 0, ld: 0, t: 0, cl: [], dr: [], st: [], bd: null, nextBird: 0, sh: null, nextShoot: 0, fl: 0, bolt: null, boltT: 0, nextBolt: 0, fog: [], spr: {} };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const dark = () => document.documentElement.dataset.theme === "dark";
  const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
  function cvEl() {
    const L = $("skyFx"); if (!L) return null;
    if (!K.cv || !K.cv.isConnected) {
      K.cv = document.createElement("canvas"); K.cv.className = "sk-cv"; const g = L.querySelector(".sk-g"); if (g) g.after(K.cv); else L.prepend(K.cv); K.x = K.cv.getContext("2d");
      if (window.ResizeObserver) new ResizeObserver(() => { cvSize(); if (RM()) draw(0); }).observe(L);
    }
    return K.cv;
  }
  function cvSize() {
    if (!K.cv) return; const b = K.cv.parentElement.getBoundingClientRect(), r = Math.min(2, window.devicePixelRatio || 1), w = Math.max(1, Math.round(b.width)), h = Math.max(1, Math.round(b.height));
    if (w === K.w && h === K.h && r === K.r) return; K.w = w; K.h = h; K.r = r; K.cv.width = w * r; K.cv.height = h * r; K.x.setTransform(r, 0, 0, r, 0, 0); K.spr = {}; seed(true);
  }
  /* một đám mây = nhiều cụm tròn mờ chồng lên nhau, đáy tối hơn — vẽ sẵn 1 lần rồi chỉ dời chỗ */
  function cloudSprite(wd, ht, T, alpha) {
    const c = document.createElement("canvas"), r = K.r; c.width = Math.ceil(wd * r); c.height = Math.ceil(ht * r); const g = c.getContext("2d"); g.scale(r, r);
    const n = Math.round(rnd(8, 13)), cx = wd / 2, base = ht * .7;
    for (let i = 0; i < n; i++) {
      const px = rnd(wd * .14, wd * .86), k = 1 - Math.abs(px - cx) / wd * .95, pr = rnd(ht * .2, ht * .42) * (.55 + .45 * k), py = base - rnd(0, ht * .34) * k;
      const gr = g.createRadialGradient(px, py - pr * .3, pr * .1, px, py, pr);
      gr.addColorStop(0, `rgba(${T[0]},${T[1]},${T[2]},${alpha})`); gr.addColorStop(.62, `rgba(${T[0]},${T[1]},${T[2]},${alpha * .7})`); gr.addColorStop(1, `rgba(${T[0]},${T[1]},${T[2]},0)`);
      g.fillStyle = gr; g.beginPath(); g.arc(px, py, pr, 0, 6.283); g.fill();
    }
    g.globalCompositeOperation = "source-atop"; const sh = g.createLinearGradient(0, ht * .3, 0, ht);
    sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(1, `rgba(${T[3]},${T[4]},${T[5]},${T[6]})`); g.fillStyle = sh; g.fillRect(0, 0, wd, ht);
    return c;
  }
  function seed(force) {
    const R = document.documentElement, ph = R.dataset.sky || "sang", wx = R.dataset.wx || "x", dk = dark(), key = ph + "|" + wx + "|" + dk + "|" + K.w + "|" + K.h;
    if ((!force && key === K.key) || !K.w || K.h < 8) return; K.key = key; const W = K.w, H = K.h;
    const rainy = /^(muanho|mua|muato|giong)$/.test(wx), heavy = wx === "muato" || wx === "giong", night = ph === "dem";
    const nCl = ({ quang: 1, x: 1, itmay: 3, comay: 5, nhieumay: 8, suongmu: 4, muanho: 8, mua: 9, muato: 11, giong: 11 })[wx] || 2;
    const T = dk ? (rainy ? [118, 130, 148, 24, 30, 42, .5] : [146, 160, 180, 34, 42, 58, .42]) : rainy ? (heavy ? [170, 180, 195, 64, 74, 92, .5] : [204, 211, 222, 86, 98, 118, .42]) : night ? [214, 222, 238, 104, 116, 146, .32] : [255, 255, 255, 146, 162, 188, .3];
    const aC = dk ? .55 : rainy ? .95 : (wx === "quang" || wx === "x") ? .5 : .92, big = rainy || wx === "nhieumay";
    K.cl = [];
    for (let i = 0; i < nCl; i++) {
      const l = i % 3, sc = [.72, 1, 1.32][l] * rnd(.85, 1.2), wd = 150 * sc * (big ? 1.3 : 1), ht = Math.min(H * 1.3, 60 * sc * (big ? 1.15 : 1));
      K.cl.push({ s: cloudSprite(wd, ht, T, aC * [.72, .88, 1][l]), w: wd, h: ht, x: rnd(-wd * .5, W), y: rnd(-ht * .4, H - ht * .72), v: [6, 10, 15][l] * (rainy ? 1.7 : 1) * rnd(.8, 1.25), l });
    }
    K.cl.sort((a, b) => a.l - b.l);
    const nDr = ({ muanho: 80, mua: 190, muato: 330, giong: 330 })[wx] || 0; K.dr = [];
    for (let i = 0; i < nDr; i++) K.dr.push({ x: rnd(-20, W + 40), y: rnd(-H, H), v: rnd(380, 640) * (heavy ? 1.25 : 1), l: rnd(7, 13) * (heavy ? 1.3 : 1), a: rnd(.25, .62) });
    K.st = []; if (night) for (let i = 0; i < Math.round(W / 26); i++) K.st.push({ x: rnd(0, W), y: rnd(2, H - 5), r: rnd(.5, 1.45), p: rnd(0, 6.28), f: rnd(.7, 2.3) });
    K.fog = wx === "suongmu" ? [0, 1, 2].map(i => ({ x: rnd(0, W), y: H * (.3 + i * .24), w: W * rnd(.45, .8), v: rnd(5, 10) * (i % 2 ? 1 : -1) })) : [];
    K.bd = null; K.nextBird = K.t + rnd(2, 7); K.sh = null; K.nextShoot = K.t + rnd(3, 8); K.nextBolt = K.t + rnd(2, 5); K.fl = 0; K.boltT = 0;
  }
  const SUNPOS = { binhminh: [.29, .9, "#ff9d4a"], sang: [.37, .34, "#ffd25a"], trua: [.44, .04, "#ffe27a"], chieu: [.51, .3, "#ffc04d"], hoanghon: [.57, .92, "#ff7a45"] };
  function drawSun(g, ph, wx, t) {
    const p = SUNPOS[ph]; if (!p || !/^(quang|x|itmay|comay)$/.test(wx)) return;
    const W = K.w, H = K.h, x = W * p[0], y = H * p[1], R0 = Math.min(H * .34, 21), a = wx === "comay" ? .68 : 1;
    const glow = g.createRadialGradient(x, y, 0, x, y, R0 * 5.5); glow.addColorStop(0, hexA(p[2], .5 * a)); glow.addColorStop(.32, hexA(p[2], .18 * a)); glow.addColorStop(1, hexA(p[2], 0));
    g.fillStyle = glow; g.beginPath(); g.arc(x, y, R0 * 5.5, 0, 6.283); g.fill();
    g.save(); g.translate(x, y); g.rotate(t * .045);
    for (let i = 0; i < 16; i++) { g.rotate(6.283 / 16); const L = R0 * (2.1 + .55 * Math.sin(t * 1.25 + i * 1.7)), gr = g.createLinearGradient(0, R0, 0, L);
      gr.addColorStop(0, hexA(p[2], .3 * a)); gr.addColorStop(1, hexA(p[2], 0)); g.fillStyle = gr; g.beginPath(); g.moveTo(-R0 * .11, R0 * .95); g.lineTo(R0 * .11, R0 * .95); g.lineTo(0, L); g.closePath(); g.fill(); }
    g.restore();
    const core = g.createRadialGradient(x - R0 * .25, y - R0 * .25, R0 * .1, x, y, R0); core.addColorStop(0, `rgba(255,255,242,${a})`); core.addColorStop(.62, hexA(p[2], .96 * a)); core.addColorStop(1, hexA(p[2], 0));
    g.fillStyle = core; g.beginPath(); g.arc(x, y, R0, 0, 6.283); g.fill();
    if (wx === "quang" || wx === "x") { /* chấm loá ống kính dọc theo đường chéo, rất nhẹ */
      [[.35, 4, .12], [.62, 7, .08], [.9, 3, .1]].forEach(([k, rr, al]) => { const fx = x + (W * .5 - x) * k * 1.6, fy = y + (H * .6 - y) * k; g.fillStyle = hexA(p[2], al * (.7 + .3 * Math.sin(t * .7 + k * 9))); g.beginPath(); g.arc(fx, fy, rr, 0, 6.283); g.fill(); });
    }
  }
  function drawMoon(g, wx, t) {
    if (!/^(quang|x|itmay|comay)$/.test(wx)) return; const W = K.w, H = K.h, x = W * .52, y = H * .4, r = Math.min(H * .2, 12);
    const pu = .24 + .07 * Math.sin(t * .8), glow = g.createRadialGradient(x, y, r * .5, x, y, r * 4.6); glow.addColorStop(0, `rgba(245,240,205,${pu})`); glow.addColorStop(1, "rgba(245,240,205,0)");
    g.fillStyle = glow; g.beginPath(); g.arc(x, y, r * 4.6, 0, 6.283); g.fill();
    if (!K.spr.moon) { const c = document.createElement("canvas"), sz = Math.ceil(r * 2.4 * K.r); c.width = c.height = sz; const m = c.getContext("2d"); m.scale(K.r, K.r); const cx = r * 1.2;
      const mg = m.createRadialGradient(cx - r * .3, cx - r * .3, r * .1, cx, cx, r); mg.addColorStop(0, "#fffbe6"); mg.addColorStop(1, "#ece4b8"); m.fillStyle = mg; m.beginPath(); m.arc(cx, cx, r, 0, 6.283); m.fill();
      m.globalCompositeOperation = "destination-out"; m.beginPath(); m.arc(cx + r * .5, cx - r * .28, r * .88, 0, 6.283); m.fill(); K.spr.moon = c; }
    g.drawImage(K.spr.moon, x - r * 1.2, y - r * 1.2, r * 2.4, r * 2.4);
  }
  function draw(dt) {
    const g = K.x; if (!g || !K.w) return; const W = K.w, H = K.h, R = document.documentElement, ph = R.dataset.sky || "sang", wx = R.dataset.wx || "x", dk = dark(), night = ph === "dem", clearish = /^(quang|x|itmay|comay)$/.test(wx);
    g.clearRect(0, 0, W, H);
    if (night) {
      const dim = wx === "comay" ? .5 : /^(quang|x|itmay)$/.test(wx) ? 1 : 0;
      if (dim) for (const s of K.st) { g.fillStyle = `rgba(255,255,255,${(.3 + .6 * (.5 + .5 * Math.sin(K.t * s.f + s.p))) * dim})`; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 6.283); g.fill(); }
      if (clearish) { if (!K.sh && K.t > K.nextShoot) K.sh = { x: rnd(W * .3, W * .8), y: rnd(2, H * .35), vx: -rnd(260, 380), vy: rnd(60, 110), life: 0 };
        if (K.sh) { const s = K.sh; s.life += dt; s.x += s.vx * dt; s.y += s.vy * dt; const an = Math.atan2(s.vy, s.vx), tx = s.x - Math.cos(an) * 80, ty = s.y - Math.sin(an) * 80, fa = Math.max(0, 1 - s.life / .85), gr = g.createLinearGradient(s.x, s.y, tx, ty);
          gr.addColorStop(0, `rgba(255,255,255,${.95 * fa})`); gr.addColorStop(1, "rgba(255,255,255,0)"); g.strokeStyle = gr; g.lineWidth = 1.6; g.lineCap = "round"; g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(tx, ty); g.stroke();
          if (s.life > .85) { K.sh = null; K.nextShoot = K.t + rnd(7, 16); } } }
      drawMoon(g, wx, K.t);
    } else drawSun(g, ph, wx, K.t);
    for (const c of K.cl) { c.x -= c.v * dt; if (c.x < -c.w) { c.x = W + rnd(10, 140); c.y = rnd(-c.h * .4, H - c.h * .72); } g.drawImage(c.s, c.x, c.y, c.w, c.h); }
    if (!night && clearish && ph !== "hoanghon" && ph !== "trua" || (ph === "trua" && wx !== "quang" && clearish)) {
      if (!K.bd && K.t > K.nextBird) { const n = Math.round(rnd(3, 5)); K.bd = { x: -30, y: rnd(H * .22, H * .55), v: rnd(36, 54), b: Array.from({ length: n }, (_, i) => ({ dx: -i * rnd(14, 22), dy: (i % 2 ? 1 : -1) * rnd(3, 8) * Math.ceil(i / 2), p: rnd(0, 6.28), f: rnd(7, 10), s: rnd(.8, 1.15) })) }; }
      if (K.bd) { const B = K.bd; B.x += B.v * dt; B.y += Math.sin(K.t * .9) * 5 * dt; g.strokeStyle = dk ? "rgba(220,230,242,.8)" : "rgba(38,56,78,.75)"; g.lineWidth = 1.4; g.lineCap = "round";
        for (const b of B.b) { const x = B.x + b.dx, y = B.y + b.dy, w = 6 * b.s, fl = Math.sin(K.t * b.f + b.p) * 3.3 * b.s; g.beginPath(); g.moveTo(x - w, y - fl); g.quadraticCurveTo(x - w * .45, y - fl * .3 - 1.4, x, y); g.quadraticCurveTo(x + w * .45, y - fl * .3 - 1.4, x + w, y - fl); g.stroke(); }
        if (B.x + Math.min(...B.b.map(b => b.dx)) > W + 30) { K.bd = null; K.nextBird = K.t + rnd(16, 34); } }
    }
    for (const f of K.fog) { f.x += f.v * dt; if (f.x > W + f.w) f.x = -f.w; if (f.x < -f.w) f.x = W + f.w; g.save(); g.translate(f.x, f.y); g.scale(f.w / 60, H * .22 / 60);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, 60); gr.addColorStop(0, dk ? "rgba(170,180,192,.22)" : "rgba(255,255,255,.6)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 60, 0, 6.283); g.fill(); g.restore(); }
    if (K.dr.length) { const wind = -.26; g.lineCap = "round"; g.lineWidth = 1; const col = dk ? "180,205,240" : "62,100,160";
      for (const d of K.dr) { d.y += d.v * dt; d.x += d.v * wind * dt; if (d.y > H + 8) { d.y = rnd(-28, -4); d.x = rnd(-10, W + 50); } g.strokeStyle = `rgba(${col},${d.a})`; g.beginPath(); g.moveTo(d.x, d.y); g.lineTo(d.x - d.l * wind, d.y - d.l); g.stroke(); } }
    if (wx === "giong") {
      if (K.t > K.nextBolt) { K.fl = 1; const P = [[rnd(W * .2, W * .75), -2]]; while (P[P.length - 1][1] < H) { const q = P[P.length - 1]; P.push([q[0] + rnd(-10, 10), q[1] + rnd(5, 11)]); } K.bolt = P; K.boltT = .24; K.nextBolt = K.t + rnd(5, 12); }
      if (K.boltT > 0) { K.boltT -= dt; g.save(); g.strokeStyle = "rgba(255,255,255,.95)"; g.lineWidth = 1.8; g.shadowColor = "rgba(190,210,255,.95)"; g.shadowBlur = 10; g.beginPath(); K.bolt.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke(); g.restore(); }
      if (K.fl > 0) { g.fillStyle = `rgba(255,255,255,${.42 * K.fl})`; g.fillRect(0, 0, W, H); K.fl = Math.max(0, K.fl - dt * 3.2); }
    }
  }
  function frame(ts) {
    K.raf = 0; if (!K.cv || document.visibilityState !== "visible" || document.documentElement.dataset.skyfx === "off" || RM()) return;
    if (ts - K.ld < 30) { K.raf = requestAnimationFrame(frame); return; } /* ~30 khung hình/giây là đủ mượt, đỡ hao pin */
    const dt = Math.min(.1, K.last ? (ts - K.last) / 1000 : .033); K.last = ts; K.ld = ts; K.t += dt; draw(dt);
    K.raf = requestAnimationFrame(frame);
  }
  function cvSet() {
    if (!cvEl()) return; cvSize(); seed(false); document.documentElement.dataset.skycv = "on";
    if (RM()) { draw(0); return; } if (!K.raf) { K.last = 0; K.raf = requestAnimationFrame(frame); }
  }
  new MutationObserver(() => { if (K.cv) { seed(false); if (RM()) draw(0); } }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-sky", "data-wx"] });
  function apply() {
    const C = cur(), R = document.documentElement;
    R.dataset.sky = C.ph; R.dataset.wx = C.wx || "x"; R.dataset.skyfx = fxOn() ? "on" : "off";
    layer(); try { cvSet(); } catch (e) { }
    const b = chip();
    if (b) {
      const t = C.d && C.d.temp != null ? Math.round(C.d.temp) + "°" : "";
      b.innerHTML = icon(C.wx, C.ph) + (t ? `<b>${t}</b>` : "") + `<span class="wxl">${esc(C.wx ? WX[C.wx] : PH[C.ph])}</span>`;
      b.title = `${PH[C.ph]}${C.wx ? " · " + WX[C.wx] : ""}${t ? " · " + t + "C" : ""} — bấm để xem thời tiết tại nhà máy`;
      b.setAttribute("aria-label", b.title);
    }
    document.querySelectorAll(".wxln").forEach(e => { e.outerHTML = line(C); });
    if ($("wxPop")) pop(true);
  }
  /* dòng thời tiết nhỏ (Bàn làm việc) — trên điện thoại thay cho nút ở đầu trang */
  function line(C) {
    C = C || cur(); const t = C.d && C.d.temp != null ? Math.round(C.d.temp) + "°C · " : "";
    return `<button type="button" class="wxln" data-wxpop title="Thời tiết tại nhà máy — bấm để xem chi tiết">${icon(C.wx, C.ph)}<span>${t}${esc(C.wx ? WX[C.wx] : PH[C.ph])}</span></button>`;
  }
  function pop(keep) {
    let p = $("wxPop"); if (!p && keep) return;
    if (!p) { p = document.createElement("div"); p.id = "wxPop"; p.className = "bellpop wxpop"; document.body.appendChild(p); }
    const C = cur(), d = C.d, f6 = d && wxOf(d.c6), f12 = d && wxOf(d.c12);
    p.innerHTML = `<div class="bh"><b>Thời tiết tại nhà máy</b><small>${esc(NOI)}</small></div>
      <div class="wx-now">${icon(C.wx, C.ph, true)}<div><div class="wx-t">${d && d.temp != null ? nf(d.temp, 1) + "°C" : "—"}</div><div>${esc(C.wx ? WX[C.wx] : "Chưa có dự báo")} · ${esc(PH[C.ph])}</div></div></div>
      <div class="wx-kv">${d ? `<span>Độ ẩm</span><b>${nf(d.rh, 0)}%</b><span>Mây che phủ</span><b>${nf(d.cloud, 0)}%</b><span>Gió</span><b>${nf(d.wind, 1)} m/s</b><span>Mưa 1 giờ tới</span><b>${d.p1 == null ? "—" : nf(d.p1, 1) + " mm"}</b>${f6 ? `<span>6 giờ tới</span><b>${esc(WX[f6])}${d.p6 ? " · " + nf(d.p6, 1) + " mm" : ""}</b>` : ""}${f12 ? `<span>12 giờ tới</span><b>${esc(WX[f12])}</b>` : ""}` : ""}<span>Mặt trời mọc</span><b>${hm(C.S.rise)}</b><span>Mặt trời lặn</span><b>${hm(C.S.set)}</b></div>
      ${err && !d ? `<div class="none">${esc(err)} Màu đầu trang vẫn đổi theo giờ.</div>` : ""}
      <label class="wx-tg"><input type="checkbox" id="wxFx" ${fxOn() ? "checked" : ""}> Hiệu ứng trời ở đầu trang (màu theo giờ, mây, mưa)</label>
      <div class="wx-src">${W && W.t ? "Cập nhật lúc " + hm(W.t) + " · " : ""}Dự báo: <a href="https://api.met.no/" target="_blank" rel="noopener">MET Norway</a> (giấy phép <a href="https://creativecommons.org/licenses/by/4.0/deed.vi" target="_blank" rel="noopener">CC BY 4.0</a>). Giờ mặt trời mọc / lặn tính theo vị trí nhà máy.</div>`;
    const c = $("wxFx"); if (c) c.onchange = () => { try { localStorage.setItem(KF, c.checked ? "on" : "off"); } catch (e) { } apply(); };
  }
  document.addEventListener("click", e => {
    const t = e.target.closest && e.target.closest("[data-wxpop]"); if (t) { e.stopPropagation(); const p = $("wxPop"); if (p) p.remove(); else pop(); return; }
    const p = $("wxPop"); if (p && !p.contains(e.target) && !(e.target.closest && e.target.closest("#wxBtn"))) p.remove();
  });

  /* dùng để xem thử: skyThu("hoanghon","mua") · skyThu() để trở lại bình thường */
  window.skyThu = (ph, wx) => { F = ph || wx ? { ph: ph || "", wx: wx || "" } : null; apply(); };
  window.skyStart = () => { apply(); fetchWx(); };
  window.skyLine = () => line();
  /* lời chào theo giờ mặt trời: trời tối là "buổi tối" (kể cả sau nửa đêm) */
  window.skyChao = () => { const C = cur(), p = F && F.ph ? F.ph : phase(C.now, C.S); return p === "dem" ? "Chào buổi tối" : p === "trua" ? "Chào buổi trưa" : p === "chieu" ? "Chào buổi chiều" : p === "hoanghon" ? (C.now < C.S.set ? "Chào buổi chiều" : "Chào buổi tối") : "Chào buổi sáng"; };
  apply();
  setInterval(() => { if (document.visibilityState !== "visible") return; apply(); fetchWx(); }, 60e3);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") { apply(); fetchWx(); } });
  fetchWx();
})();
