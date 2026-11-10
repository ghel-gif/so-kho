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
    if (!L) { L = document.createElement("div"); L.id = "skyFx"; L.setAttribute("aria-hidden", "true"); L.innerHTML = '<i class="sk-g"></i><i class="sk-stars"></i><i class="sk-sun"></i><i class="sk-moon"></i><i class="sk-cl c1"></i><i class="sk-cl c2"></i><i class="sk-cl c3"></i><i class="sk-fog"></i><i class="sk-rain"></i><i class="sk-flash"></i>'; h.prepend(L); }
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
  function apply() {
    const C = cur(), R = document.documentElement;
    R.dataset.sky = C.ph; R.dataset.wx = C.wx || "x"; R.dataset.skyfx = fxOn() ? "on" : "off";
    layer();
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
