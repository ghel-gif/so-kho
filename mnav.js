/* Sổ Kho — ĐIỆN THOẠI: thanh mục dưới đáy (4 mục hay dùng theo vai trò + Menu) và bảng Menu đủ các mục.
   Thay dải mục vuốt ngang trên cùng: bấm bằng ngón cái, không phải vuốt tìm mục. Máy tính / màn hình rộng vẫn dùng menu trái.
   Số đỏ (việc cần làm) lấy đúng theo menu trái; mục nào bị ẩn theo quyền thì ở đây cũng ẩn. */
"use strict";
(function () {
  const E = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const SHORT = { blv: "Việc", ton: "Tồn kho", tb: "Thiết bị", nhap: "Nhập", xnb: "Xuất", kk: "Kiểm kê", ls: "Lịch sử", rd: "Thử nghiệm", lsx: "Phối trộn", qc: "QC lô", kc: "Cân", qa: "IQC", dgl: "Đóng gói", vt: "Danh mục", bc: "Báo cáo" };
  const MENU_IC = "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z";
  const me = () => (typeof S !== "undefined" && S.me) || null;
  const side = () => document.querySelector("nav.side");
  const btns = () => [...document.querySelectorAll("nav.side button[data-tab]")];
  const vis = b => !!b && !b.hidden && getComputedStyle(b).display !== "none";
  const ic = t => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${E(t === "_menu" ? MENU_IC : (typeof NAV_ICON !== "undefined" && NAV_ICON[t]) || "")}"/></svg>`;
  const lbl = b => ((b.querySelector(".lbl") || b).textContent || "").replace(/\s*\(\d+\)$/, "").trim();
  const cnt = b => { const c = b && b.querySelector(".cnt"); return c && !c.hidden && c.textContent.trim() ? { n: c.textContent.trim(), t: c.title || "" } : null; };
  const col = t => (typeof TILE_COL !== "undefined" && TILE_COL[t]) || "#2a74bc";
  /* 4 mục ở thanh dưới: theo vai trò, chỉ lấy mục người đó được thấy, thiếu thì lấy theo thứ tự menu */
  function pick() {
    const u = me(), r = u ? u.vaiTro : "", V = btns().filter(vis).map(b => b.dataset.tab);
    const pref = r === "Quản lý" ? ["blv", "ton", "lsx", "dgl"] : u && u.qc ? ["blv", "qc", "qa", "kc"]
      : ["Thủ kho", "Kế toán kho", "Kế toán"].includes(r) ? ["blv", "ton", "nhap", "xnb"] : ["blv", "ton", "ls", "bc"];
    const out = pref.filter(t => V.includes(t)); V.forEach(t => { if (out.length < 4 && !out.includes(t)) out.push(t); });
    return out.slice(0, 4);
  }
  let bar = null, sheet = null, key = "";
  const cur = () => { const b = btns().find(x => x.getAttribute("aria-selected") === "true"); return b ? b.dataset.tab : (typeof S !== "undefined" && S.tab) || ""; };
  function build() {
    const app = document.getElementById("appView"); if (!app) return;
    if (!bar) { bar = document.createElement("div"); bar.id = "mnav"; bar.setAttribute("role", "navigation"); bar.setAttribute("aria-label", "Mục chính"); app.appendChild(bar);
      bar.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; if (b.dataset.go === "_menu") { open(); return; } close(); if (typeof setTab === "function") setTab(b.dataset.go); }); }
    const P = pick(), k = P.join(",") + "|" + ((me() || {}).ten || "");
    if (k !== key) { key = k;
      bar.innerHTML = P.map(t => `<button type="button" data-go="${t}">${ic(t)}<span class="mn-l">${E(SHORT[t] || t)}</span><i class="mn-c" hidden></i></button>`).join("")
        + `<button type="button" data-go="_menu" aria-haspopup="dialog">${ic("_menu")}<span class="mn-l">Menu</span><i class="mn-c" hidden></i></button>`; }
    sync();
  }
  /* trạng thái: mục đang mở, số đỏ; Menu sáng khi đang ở mục không có trên thanh, có số khi mục ẩn trong Menu có việc */
  function sync() {
    if (!bar) return; const t = cur(), P = key.split("|")[0].split(","), B = {}; btns().forEach(b => { B[b.dataset.tab] = b; });
    let rest = 0, restT = [];
    btns().filter(vis).forEach(b => { if (P.includes(b.dataset.tab)) return; const c = cnt(b); if (c) { rest += parseInt(c.n, 10) || 0; restT.push(lbl(b) + ": " + (c.t || c.n)); } });
    bar.querySelectorAll("button").forEach(x => { const g = x.dataset.go, on = g === "_menu" ? !!sheet || !P.includes(t) : g === t && !sheet, i = x.querySelector(".mn-c");
      x.classList.toggle("on", on); x.setAttribute("aria-current", on && g !== "_menu" ? "page" : "false");
      const c = g === "_menu" ? (rest ? { n: rest > 99 ? "99+" : String(rest), t: restT.join(" · ") } : null) : cnt(B[g]);
      i.hidden = !c; i.textContent = c ? c.n : ""; x.title = c ? (c.t || "") : ""; });
    if (sheet) paintSheet();
  }
  /* bảng Menu: các nhóm như menu trái, mỗi mục 1 ô có biểu tượng + số đỏ; cuối bảng: giao diện sáng/tối, đăng xuất */
  function paintSheet() {
    const g = sheet.querySelector(".mn-grps"); if (!g) return; const t = cur(); let h = "", grp = null, items = [];
    const flush = () => { if (items.length) h += `<section class="mn-grp">${grp ? `<h3>${E(grp)}</h3>` : ""}<div class="mn-g">${items.join("")}</div></section>`; items = []; };
    [...(side() || { children: [] }).children].forEach(n => {
      if (n.classList && n.classList.contains("navh")) { flush(); grp = n.textContent.trim(); return; }
      if (!n.matches || !n.matches("button[data-tab]") || !vis(n)) return; const k = n.dataset.tab, c = cnt(n);
      items.push(`<button type="button" class="mn-t${k === t ? " on" : ""}" data-go="${k}" style="--tl:${col(k)}">${ic(k)}<b>${E(lbl(n))}</b>${c ? `<i class="mn-c" title="${E(c.t)}">${E(c.n)}</i>` : ""}</button>`); });
    flush(); g.innerHTML = h;
    const th = sheet.querySelector('[data-act="theme"]'); if (th) { const dk = document.documentElement.dataset.theme === "dark"; th.innerHTML = (dk ? "☀️ Giao diện sáng" : "🌙 Giao diện tối"); }
  }
  function open() {
    if (sheet) { close(); return; } const u = me() || {};
    sheet = document.createElement("div"); sheet.className = "mn-sheet"; sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true"); sheet.setAttribute("aria-label", "Menu");
    const ver = (document.querySelector(".hver") || {}).textContent || "";
    sheet.innerHTML = `<div class="mn-box"><div class="mn-hd"><div class="mn-me"><b>${E(u.ten || "")}</b><small>${E(u.vaiTro || "")}</small></div><button type="button" class="mn-x" aria-label="Đóng menu">✕</button></div>
      <div class="mn-grps"></div>
      <div class="mn-ft"><button type="button" class="btn" data-act="theme"></button>${typeof pwCan === "function" && pwCan() ? `<button type="button" class="btn" data-act="pw">🔑 Đổi mật khẩu${typeof S !== "undefined" && S.pwLk ? " · 🔒 " + S.pwLk : ""}</button>` : ""}<button type="button" class="btn" data-act="out">Đăng xuất</button><small>Sổ Kho ${E(ver.trim())}</small></div></div>`;
    document.getElementById("appView").appendChild(sheet); paintSheet(); document.documentElement.classList.add("mn-open");
    requestAnimationFrame(() => sheet && sheet.classList.add("in"));
    sheet.addEventListener("click", e => {
      if (e.target === sheet || e.target.closest(".mn-x")) { close(); return; }
      const a = e.target.closest("[data-act]"); if (a) { if (a.dataset.act === "theme") { const b = document.getElementById("themeBtn"); if (b) b.click(); setTimeout(paintSheet, 60); } else if (a.dataset.act === "pw") { close(); if (typeof pwDlg === "function") pwDlg(); } else { close(); const b = document.getElementById("logoutBtn"); if (b) b.click(); } return; }
      const b = e.target.closest("[data-go]"); if (b) { const t = b.dataset.go; close(); if (typeof setTab === "function") setTab(t); } });
    sync(); const x = sheet.querySelector(".mn-x"); if (x) x.focus({ preventScroll: true });
  }
  function close() { if (!sheet) return; const s = sheet; sheet = null; document.documentElement.classList.remove("mn-open"); s.classList.remove("in"); setTimeout(() => s.remove(), 180); sync(); }
  document.addEventListener("keydown", e => { if (e.key === "Escape" && sheet) close(); });
  /* theo dõi menu trái: đổi mục, đổi quyền (ẩn/hiện), số đỏ thay đổi → cập nhật thanh dưới */
  let tm = 0; const later = () => { clearTimeout(tm); tm = setTimeout(build, 60); };
  function start() { const s = side(); if (!s) return; build();
    new MutationObserver(later).observe(s, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["hidden", "aria-selected", "title"] });
    const app = document.getElementById("appView"); if (app) new MutationObserver(later).observe(app, { attributes: true, attributeFilter: ["hidden"] }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  window.mnavClose = close;
})();
