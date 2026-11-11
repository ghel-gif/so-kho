/* ============================================================================
   Sổ Kho · Tìm nhanh — gõ mã, tên, số lô, số lệnh, nhà cung cấp, khách hàng…
   ra ngay vật tư (tồn kho), lô, lệnh SX BTP, lệnh đóng gói, phiếu kiểm bao bì.
   Mở: nút 🔍 ở đầu trang, phím "/" hoặc Ctrl+K. ↑ ↓ chọn, Enter mở, Esc đóng.
   ========================================================================== */
"use strict";
(function () {
  const $ = id => document.getElementById(id);
  const E = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fd = t => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d").toLowerCase();
  const ok = () => typeof S !== "undefined" && S.me && S.items;
  const N = v => (+v || 0).toLocaleString("vi-VN", { maximumFractionDigits: 3 });
  const D = s => { s = String(s || "").slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s.split("-").reverse().join("/") : s; };
  let act = 0, L = [], seq = 0;
  function btn() {
    if ($("timBtn")) return; const who = document.querySelector("#appView .who"); if (!who) return;
    const b = document.createElement("button"); b.id = "timBtn"; b.type = "button"; b.className = "timb"; b.title = "Tìm nhanh (phím / hoặc Ctrl+K)"; b.setAttribute("aria-label", "Tìm nhanh");
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><span>Tìm</span>';
    who.insertBefore(b, who.firstChild); b.onclick = e => { e.stopPropagation(); open(); };
  }
  function open(q0) {
    if (!ok()) return; let o = $("timOv");
    if (!o) {
      o = document.createElement("div"); o.id = "timOv"; o.className = "timov";
      o.innerHTML = `<div class="timbox" role="dialog" aria-label="Tìm nhanh"><div class="timh"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="timQ" type="search" autocomplete="off" spellcheck="false" placeholder="Gõ mã, tên, số lô, số lệnh, nhà cung cấp, khách hàng…"><button type="button" class="timx" aria-label="Đóng"><span class="timx-d">Esc</span><span class="timx-m">Đóng</span></button></div><div class="timr" id="timR"></div><div class="timf">↑ ↓ chọn · Enter mở · Esc đóng</div></div>`;
      document.body.appendChild(o);
      o.addEventListener("click", e => { if (e.target === o || e.target.closest(".timx")) close(); });
      const q = $("timQ"); q.addEventListener("input", () => run(q.value));
      q.addEventListener("keydown", e => {
        if (e.key === "ArrowDown") { e.preventDefault(); mv(1); } else if (e.key === "ArrowUp") { e.preventDefault(); mv(-1); }
        else if (e.key === "Enter") { e.preventDefault(); const x = L[act]; if (x) go(x); } else if (e.key === "Escape") { e.preventDefault(); close(); } });
    }
    o.hidden = false; const q = $("timQ"); if (q0 != null) q.value = q0; setTimeout(() => { q.focus(); q.select(); }, 20); run(q.value);
  }
  function close() { const o = $("timOv"); if (o) o.hidden = true; }
  function mv(d) { if (!L.length) return; act = (act + d + L.length) % L.length; paint(); const el = $("timR").querySelector(`[data-i="${act}"]`); if (el) el.scrollIntoView({ block: "nearest" }); }
  function go(x) { close(); try { x.go(); } catch (e) { } }
  function paint() {
    const R = $("timR"); if (!R) return; let g = "", h = "";
    L.forEach((x, i) => { if (x.g !== g) { g = x.g; h += `<div class="timg">${E(g)}</div>`; } h += `<button type="button" class="timi${i === act ? " on" : ""}" data-i="${i}"><b>${x.t}</b><small>${x.s}</small></button>`; });
    const q = $("timQ").value.trim();
    R.innerHTML = h || (q ? `<div class="timn">Không thấy kết quả cho “${E(q)}”.</div>` : `<div class="timn">Gõ mã vật tư, tên, số lô, số lệnh SX / đóng gói, nhà cung cấp hoặc khách hàng.</div>`);
    R.querySelectorAll("[data-i]").forEach(b => { b.onclick = () => go(L[+b.dataset.i]); b.onmousemove = () => { if (act !== +b.dataset.i) { act = +b.dataset.i; R.querySelectorAll(".timi").forEach(x => x.classList.toggle("on", x === b)); } }; });
  }
  async function run(q) {
    const my = ++seq, toks = fd(q).trim().split(/\s+/).filter(Boolean); act = 0;
    if (!toks.length) { L = []; paint(); return; }
    const hit = h => toks.every(t => h.includes(t)), qq = fd(q).trim(), R = [], sc = k => { k = fd(k); return k === qq ? 2 : k.startsWith(qq) ? 1 : 0; };
    const tenOf = ma => (S.items.find(i => i.ma === ma) || {}).ten || "";
    /* vật tư */
    S.items.filter(i => hit(fd(i.ma + " " + i.ten + " " + (i.nhom || "") + " " + (i.chuHang || "")))).sort((a, b) => (fd(b.ma) === qq) - (fd(a.ma) === qq) || a.ma.localeCompare(b.ma)).slice(0, 6)
      .forEach(i => { const t = S.bal && S.bal[i.ma] ? S.bal[i.ma].ton : 0; R.push({ k: sc(i.ma), g: "Vật tư · tồn kho", t: `${E(i.ma)} · ${E(i.ten)}`, s: `${E(i.nhom || "")} · tồn <b class="${t < -1e-6 ? "neg" : ""}">${N(t)} kg</b>`, go: () => { S.tkOpen = i.ma; const qi = $("q"); if (qi) qi.value = i.ma; setTab("ton"); } }); });
    /* lô */
    const LO = []; Object.entries(S.lots || {}).forEach(([ma, ls]) => (ls || []).forEach(l => { if (hit(fd(ma + " " + l.lo + " " + tenOf(ma)))) LO.push([ma, l]); }));
    LO.sort((a, b) => (fd(b[1].lo) === qq) - (fd(a[1].lo) === qq) || (b[1].ton > 0) - (a[1].ton > 0) || String(b[1].nsx || "").localeCompare(String(a[1].nsx || ""))).slice(0, 6)
      .forEach(([ma, l]) => R.push({ k: sc(l.lo), g: "Lô", t: `Lô ${E(l.lo)} · ${E(ma)}`, s: `${E(tenOf(ma))} · tồn ${N(l.ton)} kg${l.hsd ? " · HSD " + D(l.hsd) : ""}${l.qc ? " · QC " + E(l.qc) : ""}`, go: () => lotCard(ma, l.lo) }));
    /* lệnh */
    (S.lenh || []).filter(o => hit(fd([o.so, o.maSP, o.tenSP, tenOf(o.maSP), o.khachHang, o.nguoiSX].join(" ")))).sort((a, b) => (fd(b.so) === qq) - (fd(a.so) === qq) || String(b.ngay).localeCompare(String(a.ngay))).slice(0, 8)
      .forEach(o => { const tp = typeof dgIsTP === "function" && dgIsTP(o); R.push({ k: sc(o.so), g: tp ? "Lệnh đóng gói" : "Lệnh SX", t: `${E(o.so)} · ${E(tenOf(o.maSP) || o.tenSP || o.maSP)}`, s: `${E(o.trangThai)} · ra lệnh ${D(o.ngay)}${o.khachHang ? " · " + E(o.khachHang) : ""}`,
        go: () => { if (tp) { S.dgv = "detail"; S.dgSo = o.so; S.dgN = null; S.dgC = null; setTab("dgl"); } else { setTab("lsx"); openOrder(o.so); } } }); });
    L = order(R); paint();
    /* phiếu kiểm bao bì (tải khi cần) */
    if (window.qaSearch && toks.join("").length >= 2) {
      const Q = await window.qaSearch(toks, fd); if (my !== seq) return;
      Q.forEach(x => L.push({ k: sc(x.ma), g: "IQC bao bì", t: `${E(x.ten || x.ma)}${x.ma && x.ten ? " · " + E(x.ma) : ""}`, s: `${E(x.bm)} · về ${D(x.ngay)}${x.ncc ? " · " + E(x.ncc) : ""} · ${E(x.kl || x.tt)}`, go: () => qaOpen(x.id) }));
      L = order(L); paint();
    }
  }
  /* nhóm nào khớp đúng mã / số lô / số lệnh thì lên đầu */
  function order(A) { const G = [], by = {}; A.forEach(x => { if (!by[x.g]) { by[x.g] = []; G.push(x.g); } by[x.g].push(x); }); const m = g => Math.max(...by[g].map(x => x.k || 0));
    return G.map((g, i) => [g, i]).sort((a, b) => m(b[0]) - m(a[0]) || a[1] - b[1]).flatMap(([g]) => by[g]); }
  document.addEventListener("keydown", e => {
    if (!ok()) return; const t = e.target, typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); open(); }
    else if (e.key === "/" && !typing && !document.querySelector(".cfm")) { e.preventDefault(); open(); }
  });
  window.timStart = btn; window.timOpen = open;
  const t0 = setInterval(() => { if (document.querySelector("#appView .who")) { btn(); clearInterval(t0); } }, 500);
})();
