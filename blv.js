/* Sổ Kho — BÀN LÀM VIỆC: việc của riêng người đang đăng nhập (cùng logic với bản tin sáng — brief.js). */
"use strict";
(function () {
  const E = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const D = s => { s = String(s || "").slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s.split("-").reverse().join("/") : s; };
  const N = v => (Math.round((+v || 0) * 100) / 100).toLocaleString("vi-VN");
  let CODE = null;
  async function code() {
    if (CODE) return CODE;
    const v = (typeof APP_VER !== "undefined" ? APP_VER : "") + "-" + (window.SOKHO_VER || ""), g = f => fetch(f + "?v=" + v, { cache: "no-cache" }).then(r => r.text());
    const [a, b] = await Promise.all([g("server.gs"), g("khpt.gs")]);
    if (!window.SOKHO_BRIEF) await new Promise((ok, no) => { const s = document.createElement("script"); s.src = "brief.js?v=" + v; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
    return CODE = a + "\n" + b;
  }
  /* mỗi mục: màu, biểu tượng, nội dung 1 dòng, bấm thì mở đúng chỗ */
  const META = {
    formMiss: { c: "#c62828", i: "📋", line: x => `<b>${E(x.so)}</b> · ${E(x.sp)} — còn thiếu <b style="color:#c62828">${E(x.miss.join(", "))}</b>${x.xong ? " (lệnh đã xong)" : ""}`, go: x => openDG(x.so) },
    cho: { c: "#7c3aed", i: "🧪", line: x => `<b>${E(x.ma)}</b> ${E(x.ten)} · lô <b>${E(x.lo || "—")}</b> · ${N(x.ton)} kg · chờ từ ${D(x.ngay)}`, go: x => window.lotCard ? lotCard(x.ma, x.lo) : setTab("qc") },
    dgShort: { c: "#c62828", i: "⚠", line: x => `<b>${E(x.so)}</b> · ${E(x.ma)} lô ${E(x.lots.join(", "))} — cần ${N(x.need)} kg, <b style="color:#c62828">thiếu ${N(x.short)} kg</b>`, go: x => openDG(x.so) },
    lsxShort: { c: "#c62828", i: "⚠", line: x => `<b>${E(x.so)}</b> — thiếu ${x.sh.map(s => E(s.ma) + " " + N(s.short) + " kg").join("; ")}`, go: x => openLSX(x.so) },
    low: { c: "#e5484d", i: "📉", line: x => `<b>${E(x.ma)}</b> ${E(x.ten)} — tồn <b style="color:${x.am ? "#c62828" : "inherit"}">${N(x.ton)} kg</b>${x.min ? " / tối thiểu " + N(x.min) : ""}`, go: () => bellTon("am") },
    exp: { c: "#d97706", i: "⏳", line: x => `<b>${E(x.ma)}</b> ${E(x.ten)} · lô ${E(x.lo || "—")} · HSD ${D(x.hsd)} — ${x.con < 0 ? `<b style="color:#c62828">quá hạn ${-x.con} ngày</b>` : "còn " + x.con + " ngày"} · ${N(x.ton)} kg`, go: x => window.lotCard ? lotCard(x.ma, x.lo) : bellTon("hsd") },
    treo: { c: "#5a4fcf", i: "🕒", line: x => `<b>${E(x.so)}</b> · ${E(x.maSP)} — ra lệnh ${D(x.ngay)}, treo ${x.ngayTreo} ngày`, go: x => openLSX(x.so) },
    mine: { c: "#0f766e", i: "🛠", line: x => `<b>${E(x.so)}</b> · ${x.dg ? "Đóng gói" : "SX BTP"} · ${E(x.sp)} · ra lệnh ${D(x.ngay)}`, go: x => x.dg ? openDG(x.so) : openLSX(x.so) }
  };
  function openDG(so) { S.dgv = "detail"; S.dgSo = so; S.dgN = null; S.dgC = null; setTab("dgl"); }
  function openLSX(so) { setTab("lsx"); setTimeout(() => { try { if (typeof openOrder === "function" && S.me && S.me.ct) openOrder(so); } catch (e) {} }, 80); }

  /* Lệnh đóng gói đang làm: còn thiếu gì (biểu mẫu QC chưa lập / chưa điền đủ, số liệu hoàn thành) */
  async function dgCheck(box, R) {
    const el = box.querySelector("#blvDg"); if (!el) return;
    const me = S.me.ten, ql = S.me.vaiTro === "Quản lý", inc = (s, t) => String(s || "").split(",").map(x => x.trim()).includes(t);
    const L = (S.lenh || []).filter(o => o.trangThai === "Đang SX" && typeof dgIsTP === "function" && dgIsTP(o) && String(o.ngay) >= "2026-11-05" && !/\(huỷ/.test(o.so)
      && (ql || S.me.qc || o.nguoiLap === me || inc(o.nguoiSX, me) || inc(o.qcSX, me)));
    if (!L.length) { el.innerHTML = ""; return; }
    el.innerHTML = `<div class="blv-card" style="--c:#0f766e"><div class="blv-h"><span class="blv-i">📦</span><b>Lệnh đóng gói đang làm — còn thiếu</b><span class="blv-n">${L.length}</span></div><div class="blv-l"><div class="note" style="padding:8px 12px">Đang kiểm tra từng lệnh…</div></div></div>`;
    try { if (!S.dg && typeof dgLoad === "function") await dgLoad(); } catch (e) {}
    const rows = [];
    for (const o of L) {
      const miss = []; let D = null;
      try { D = await api0("webDGFGet", S.auth, o.so); } catch (e) {}
      const F = (D && D.forms) || [], gap = f => (window.dgfGap && D ? dgfGap(D, f) : []);
      [["BM05", "BM.05", x => x.loai === "BM05"], ["KT", "BM.04/06", x => /^BM0[46]$/.test(x.loai)], ["BM07", "BM.07", x => x.loai === "BM07"]].forEach(([k, nm, fn]) => {
        const Fs = F.filter(fn); if (!Fs.length) { miss.push({ t: nm + ": chưa lập", f: k, bad: 1 }); return; }
        const G = [].concat(...Fs.map(gap)); if (G.length) miss.push({ t: nm + ": " + G.slice(0, 4).join(", ") + (G.length > 4 ? "…" : ""), f: k });
      });
      const P = ((S.dg && S.dg.lenh) || {})[o.so] || {}, X = P.x || {};
      const done = [];
      if (!String(X.nvh || "").trim()) done.push("người vận hành");
      if (!(X.cuoi || []).some(v => v !== "" && v != null)) done.push("cân KL tồn cuối BTP");
      if (done.length) miss.push({ t: "Khi đóng xong: " + done.join(", "), f: "" });
      if (miss.length) rows.push({ o, miss });
    }
    if (!rows.length) { el.innerHTML = `<div class="blv-card" style="--c:#2e7d32"><div class="blv-h"><span class="blv-i">📦</span><b>Lệnh đóng gói đang làm: đủ thông tin</b><span class="blv-n">${L.length}</span></div></div>`; return; }
    el.innerHTML = `<div class="blv-card" style="--c:#0f766e"><div class="blv-h"><span class="blv-i">📦</span><b>Lệnh đóng gói đang làm — còn thiếu</b><span class="blv-n">${rows.length}</span></div><div class="blv-l">${rows.map((r, i) => {
        const it = typeof itemBy === "function" ? itemBy(r.o.maSP) : null;
        return `<div class="blv-r" style="cursor:default;flex-direction:column;align-items:stretch"><div style="display:flex;justify-content:space-between;gap:8px"><span><b>${E(r.o.so)}</b> · ${E(it ? it.ten : r.o.maSP)} · ra lệnh ${D(r.o.ngay)}</span><button type="button" class="btn small" data-dgo="${i}">Mở lệnh ›</button></div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">${r.miss.map(m => `<button type="button" class="blv-chip${m.bad ? " bad" : ""}" data-dgo="${i}" data-f="${m.f}">${E(m.t)}</button>`).join("")}</div></div>`; }).join("")}</div></div>`;
    el.querySelectorAll("[data-dgo]").forEach(b => b.onclick = () => { const r = rows[+b.dataset.dgo], f = b.dataset.f; openDG(r.o.so); if (f && window.dgfOpen) setTimeout(() => { try { dgfOpen(r.o.so, f); } catch (e) {} }, 700); });
  }

  async function rdCard(box) {
    const el = box.querySelector("#blvRd"); if (!el || !window.rdTasks) return;
    const T = await rdTasks(); if (!T.length) { el.innerHTML = ""; return; }
    el.innerHTML = `<div class="blv-card" style="--c:#db2777"><div class="blv-h"><span class="blv-i">🧪</span><b>Phòng RD — thử nghiệm, yêu cầu</b><span class="blv-n">${T.length}</span></div><div class="blv-l">${T.map((x, i) => `<button type="button" class="blv-r" data-rd="${i}"><span>${x.t}</span><span class="blv-go">Mở ›</span></button>`).join("")}</div></div>`;
    el.querySelectorAll("[data-rd]").forEach(b => b.onclick = () => rdOpen(T[+b.dataset.rd].id));
    const sm = box.querySelector(".blv-sum"); if (sm) { const n = (+sm.dataset.n || 0) + T.length; sm.className = "blv-sum bad"; sm.innerHTML = `<b>${n}</b> việc cần chú ý`; }
    const ok = [...box.querySelectorAll(".blv-card")].find(c => /Phần việc của bạn đang ổn/.test(c.textContent)); if (ok) ok.remove();
  }
  async function qaCard(box) {
    const el = box.querySelector("#blvQa"); if (!el || !window.qaTasks) return;
    const T = await qaTasks(); if (!T.length) { el.innerHTML = ""; return; }
    el.innerHTML = `<div class="blv-card" style="--c:#0284c7"><div class="blv-h"><span class="blv-i">🔎</span><b>Phòng QC — kiểm vật tư nhập kho, sự không phù hợp</b><span class="blv-n">${T.length}</span></div><div class="blv-l">${T.map((x, i) => `<button type="button" class="blv-r" data-qa="${i}" style="border-left:3px solid ${x.c}"><span>${x.t}</span><span class="blv-go">Mở ›</span></button>`).join("")}</div></div>`;
    el.querySelectorAll("[data-qa]").forEach(b => b.onclick = () => qaOpen(T[+b.dataset.qa].id));
    const sm = box.querySelector(".blv-sum"); if (sm) { const n = (+sm.dataset.n || 0) + T.length; sm.dataset.n = n; sm.className = "blv-sum bad"; sm.innerHTML = `<b>${n}</b> việc cần chú ý`; }
    const ok = [...box.querySelectorAll(".blv-card")].find(c => /Phần việc của bạn đang ổn/.test(c.textContent)); if (ok) ok.remove();
  }
  window.blvRender = async function () {
    const box = document.getElementById("blvBox"); if (!box) return;
    if (!S.me) { box.innerHTML = '<div class="empty">Vui lòng đăng nhập.</div>'; return; }
    if (!box.dataset.ok) box.innerHTML = `<div class="empty"><span class="ldg">Đang gom việc của bạn…</span></div>`;
    let R;
    try {
      const db = window.SOKHO_WEB && SOKHO_WEB.db; if (!db || !db.sheets) throw new Error("Chưa tải xong dữ liệu.");
      const sheets = {}; Object.keys(db.sheets).forEach(n => sheets[n] = db.sheets[n].rows);
      const me = { ten: S.me.ten, vai_tro: S.me.vaiTro, quyen_qc: !!S.me.qc };
      const cd = await code(); R = window.SOKHO_BRIEF.build(sheets, cd, [me])[0];
    } catch (e) { box.innerHTML = `<div class="empty">Không lập được bàn làm việc: ${E(e.message)}</div>`; return; }
    box.dataset.ok = 1;
    R.sec.forEach(s => { if (s.k === "formMiss") { s.rows = s.rows.filter(x => x.xong); s.t = "Lệnh đóng gói đã xong còn thiếu biểu mẫu QC"; } });
    R.sec = R.sec.filter(s => s.rows.length);
    const urgent = R.sec.filter(s => s.k !== "mine"), mine = R.sec.find(s => s.k === "mine");
    const h = new Date().getHours(), chao = h < 11 ? "Chào buổi sáng" : h < 14 ? "Chào buổi trưa" : h < 18 ? "Chào buổi chiều" : "Chào buổi tối";
    const card = s => { const M = META[s.k], L = s.rows.slice(0, 30);
      return `<div class="blv-card" style="--c:${M.c}"><div class="blv-h"><span class="blv-i">${M.i}</span><b>${E(s.t)}</b><span class="blv-n">${s.rows.length}</span></div>
        <div class="blv-l">${L.map((x, i) => `<button type="button" class="blv-r" data-k="${s.k}" data-i="${i}"><span>${M.line(x)}</span><span class="blv-go">Mở ›</span></button>`).join("")}${s.rows.length > 30 ? `<div class="note" style="padding:6px 10px">… và ${s.rows.length - 30} dòng nữa.</div>` : ""}</div></div>`; };
    box.innerHTML = `<div class="blv-top"><div><h2 style="margin:0">${chao}, ${E(S.me.ten)}</h2><p class="note" style="margin:2px 0 0">${E(S.me.vaiTro)}${S.me.qc && S.me.vaiTro !== "Quản lý" ? " · QC" : ""} · ${D(R.today)} — chỉ hiện việc thuộc phần của bạn.</p></div>
        <div class="blv-sum ${R.n ? "bad" : "ok"}" data-n="${R.n}">${R.n ? `<b>${R.n}</b> việc cần chú ý` : "✓ Không có việc tồn"}</div></div>
      <div id="blvDg"></div><div id="blvRd"></div><div id="blvQa"></div>${urgent.length ? urgent.map(card).join("") : `<div class="blv-card" style="--c:#2e7d32"><div class="blv-h"><span class="blv-i">✅</span><b>Phần việc của bạn đang ổn</b></div><p class="note" style="padding:4px 12px 10px;margin:0">Không có lô chờ QC, biểu mẫu thiếu, lệnh thiếu tồn hay hàng sắp hết hạn trong phần việc của bạn.</p></div>`}
      ${mine && mine.rows.length ? card(mine) : ""}
      <p class="note" style="margin-top:10px">Bàn làm việc tự cập nhật khi dữ liệu thay đổi. Bấm một dòng để mở đúng lệnh / lô.</p>`;
    box.querySelectorAll(".blv-r").forEach(b => b.onclick = () => { const s = R.sec.find(x => x.k === b.dataset.k); META[b.dataset.k].go(s.rows[+b.dataset.i]); });
    dgCheck(box, R);
    rdCard(box);
    qaCard(box);
  };
})();
