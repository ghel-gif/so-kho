/* Sổ Kho — PHÒNG RD theo RD-QT.01 (phiên bản 02, hiệu lực 02/01/2026)
   BM.02 Công thức sản phẩm – Phiếu kiểm tra pha chế · BM.04 Sổ theo dõi yêu cầu · BM.01 Sổ nghiên cứu thử nghiệm · BM.03 Sổ giao mẫu khảo nghiệm hiệu lực.
   TP. LAB/RD (Quản lý) lập yêu cầu + công thức thử và giao người thực hiện → người được giao ghi kết quả, bấm "Báo kết quả" → Quản lý đánh giá Đạt / Không đạt. */
"use strict";
(function () {
  const E = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const D = s => { s = String(s || "").slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s.split("-").reverse().join("/") : s; };
  const add = (s, n) => { if (!/^\d{4}-\d{2}-\d{2}/.test(s || "")) return ""; const d = new Date(String(s).slice(0, 10) + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const today = () => (window.S && S.today) || new Date().toISOString().slice(0, 10);
  const QL = () => S.me && S.me.vaiTro === "Quản lý";
  const META = { PT: ["BM.02-RD-QT.01", "02", "02/01/2026"], YC: ["BM.04-RD-QT.01", "02", "02/01/2026"], SO: ["BM.01-RD-QT.01", "02", "02/01/2026"], GM: ["BM.03-RD-QT.01", "02", "02/01/2026"] };
  const meta = k => `Mã số: <b>${META[k][0]}</b><br>Phiên bản: ${META[k][1]}<br>Ngày hiệu lực: ${META[k][2]}`;
  const TTC = { "Giao": "#2563eb", "Đang thử": "#d97706", "Đã báo KQ": "#7c3aed", "Đã duyệt": "#2e7d32" };
  const CT0 = () => [{ ct: "Ngoại quan" }, { ct: "pH trực tiếp hoặc pH (5%w/w)" }, { ct: "Tỷ trọng (g/ml)" }, { ct: "" }];
  let R = [], USERS = [], view = "pt";
  const box = () => document.getElementById("rdBox");
  const live = L => L.filter(x => !x.xoa);
  async function load() { R = await api0("webRDAll", S.auth); try { if (!USERS.length) USERS = await api0("getUserNames"); } catch (e) {} }
  const rec = id => R.find(x => x.id === id);
  const ptSt = p => p.d.tt === "Đã duyệt" ? "Đã duyệt · " + (p.d.danhGia || "") : p.d.tt || "Đang thử";
  const chip = p => { const t = p.d.tt || "Đang thử", c = p.d.tt === "Đã duyệt" ? (p.d.danhGia === "Đạt" ? "#2e7d32" : "#c62828") : TTC[t] || "#607d8b"; return `<span class="st" style="background:${c};color:#fff;border-color:${c}">${E(ptSt(p))}</span>`; };
  const doc54 = p => { const n = add(p.d.ngayBD, 14), done = (p.d.kq || []).some(r => String(r.b || "").trim()); return n && !done && p.d.tt !== "Đã duyệt" ? n : ""; };
  const ycSt = y => y.d.ngayKT ? "Xong" : y.d.han && y.d.han < today() ? "Quá hạn" : "Đang làm";

  /* ---------------- danh sách ---------------- */
  window.renderRD = async function () {
    const b = box(); if (!b) return;
    if (!S.me || !S.me.ct) { b.innerHTML = '<div class="empty">Tài khoản này không xem được hồ sơ RD (công thức).</div>'; return; }
    if (!b.dataset.ok) b.innerHTML = '<div class="empty"><span class="ldg">Đang tải hồ sơ RD…</span></div>';
    try { await load(); } catch (e) { b.innerHTML = `<div class="empty">${E(e.message)}</div>`; return; }
    b.dataset.ok = 1;
    const seg = [["pt", "Phiếu thử nghiệm (BM.02)"], ["yc", "Yêu cầu (BM.04)"], ["so", "Sổ nghiên cứu (BM.01)"], ["gm", "Giao mẫu khảo nghiệm (BM.03)"]];
    let h = `<div class="seg subseg" style="margin-bottom:10px">${seg.map(([k, t]) => `<button type="button" data-v="${k}" aria-pressed="${k === view}">${t}</button>`).join("")}</div>`;
    if (view === "pt") {
      const L = live(R).filter(x => x.loai === "PT").sort((a, b) => String(b.d.so || "").localeCompare(String(a.d.so || ""), "vi", { numeric: true }));
      h += `<div class="tools">${QL() ? '<button class="btn primary" type="button" id="rdNewPT">+ Lập công thức thử &amp; giao việc</button>' : ""}<span class="note">Quản lý lập công thức, giao người thực hiện → người thực hiện ghi kết quả, bấm <b>Báo kết quả</b> → Quản lý đánh giá.</span></div>
        <div class="list">${L.length ? L.map(p => { const n54 = doc54(p); return `<div class="row click" data-id="${E(p.id)}"><div class="name">${E(p.d.so || "")} · ${E(p.d.sp || "")} ${chip(p)}</div><div class="kg">${E(p.d.maCT || "")}<small>${E(p.d.hl || "")}</small></div>
          <div class="meta">Bắt đầu ${D(p.d.ngayBD)} · người thực hiện: <b>${E(p.d.nguoiTH || "—")}</b>${n54 ? ` · <b style="color:${n54 <= today() ? "#c62828" : "inherit"}">đọc mẫu 54 °C ngày ${D(n54)}</b>` : ""}${p.d.baoLuc && p.d.tt === "Đã báo KQ" ? " · báo KQ " + E(p.d.baoLuc) : ""}</div></div>`; }).join("") : '<div class="empty"><b>Chưa có phiếu thử nghiệm</b>Quản lý bấm “Lập công thức thử &amp; giao việc”.</div>'}</div>`;
    } else if (view === "yc") {
      const L = live(R).filter(x => x.loai === "YC").sort((a, b) => String(b.ngay).localeCompare(String(a.ngay)));
      h += `<div class="tools">${QL() ? '<button class="btn primary" type="button" id="rdNewYC">+ Ghi yêu cầu nghiên cứu</button>' : ""}<button class="btn" type="button" id="rdPrYC">🖨 In sổ BM.04</button></div>
        <div class="list">${L.length ? L.map(y => { const st = ycSt(y), c = st === "Xong" ? "#2e7d32" : st === "Quá hạn" ? "#c62828" : "#d97706", np = live(R).filter(p => p.loai === "PT" && p.d.yc === y.id).length;
          return `<div class="row click" data-id="${E(y.id)}"><div class="name">${E(y.d.noiDung || "")} <span class="st" style="background:${c};color:#fff;border-color:${c}">${st}</span></div><div class="kg">${np}<small>phiếu thử</small></div>
          <div class="meta">Yêu cầu ${D(y.ngay)} · ${E(y.d.donVi || "")} · cần kết quả ${D(y.d.han) || "—"} · thực hiện: ${E(y.d.nguoiTH || "—")}${y.d.ngayKT ? " · kết thúc " + D(y.d.ngayKT) : ""}</div></div>`; }).join("") : '<div class="empty"><b>Chưa có yêu cầu nào</b></div>'}</div>`;
    } else if (view === "gm") {
      const L = live(R).filter(x => x.loai === "GM").sort((a, b) => String(b.ngay).localeCompare(String(a.ngay)));
      h += `<div class="tools"><button class="btn primary" type="button" id="rdNewGM">+ Ghi giao mẫu</button><button class="btn" type="button" id="rdPrGM">🖨 In sổ BM.03</button>${!L.length ? '<button class="btn" type="button" id="rdImpGM">Chuyển 4 dòng từ sổ BM.03 trên Drive</button>' : ""}</div>
        <div class="list">${L.length ? L.map(g => `<div class="row click" data-id="${E(g.id)}"><div class="name">${E(g.d.ten || "")} <span class="st ${g.d.ngayTra ? "done" : "run"}">${g.d.ngayTra ? "Đã có kết quả" : "Chờ kết quả"}</span></div><div class="kg">${E(g.d.sl || "")}<small>${E(g.d.dvt || "")} ${E(g.d.ttl || "")}</small></div>
          <div class="meta">Gửi ${D(g.ngay)} · ${E(g.d.phong || "R&D")} → ${E(g.d.nguoiNhan || "—")}${g.d.maMau ? " · mã mẫu " + E(g.d.maMau) : ""}${g.d.ngayTra ? " · trả KQ " + D(g.d.ngayTra) : ""}</div></div>`).join("") : '<div class="empty"><b>Chưa có mẫu giao khảo nghiệm</b></div>'}</div>`;
    } else {
      h += `<div class="tools"><button class="btn" type="button" id="rdPrSO">🖨 In sổ BM.01</button><span class="note">Sổ tự tổng hợp từ yêu cầu (BM.04) và phiếu thử nghiệm (BM.02).</span></div>${soTable(false)}`;
    }
    b.innerHTML = h;
    b.querySelectorAll(".seg [data-v]").forEach(x => x.onclick = () => { view = x.dataset.v; renderRD(); });
    b.querySelectorAll(".row.click").forEach(x => x.onclick = () => { const r = rec(x.dataset.id); if (!r) return; r.loai === "PT" ? ptDlg(r) : r.loai === "YC" ? ycDlg(r) : gmDlg(r); });
    const on = (id, f) => { const el = document.getElementById(id); if (el) el.onclick = f; };
    on("rdNewPT", () => ptDlg(null)); on("rdNewYC", () => ycDlg(null)); on("rdNewGM", () => gmDlg(null));
    on("rdPrYC", prYC); on("rdPrGM", prGM); on("rdPrSO", prSO); on("rdImpGM", impGM);
  };

  /* ---------------- hộp thoại chung ---------------- */
  function dlg(title, body, wide) {
    const w = document.createElement("div"); w.className = "cfm";
    w.innerHTML = `<div class="cfm-box rd-dlg" style="max-width:min(${wide ? 1000 : 720}px,97vw);width:${wide ? 1000 : 720}px"><h2>${title}</h2>${body}</div>`;
    document.body.appendChild(w); return w;
  }
  const userOpts = (v) => `<option value="">— chọn —</option>` + USERS.map(u => `<option ${u === v ? "selected" : ""}>${E(u)}</option>`).join("");
  async function save(o, msg) { const r = await api("webRDSave", S.auth, o); toast(msg || "Đã lưu"); return r; }
  async function del(id) { if (!await askConfirm(["Xoá hồ sơ này? (khôi phục được trong Lịch sử phiếu / nhờ Quản lý)"])) return false; await api("webRDDel", S.auth, id, false); toast("Đã xoá"); return true; }
  const push = (title, body, to) => { try { window.SKPush && SKPush.send(title, body, to, "rd-" + title.slice(0, 20)); } catch (e) {} };

  /* ---------------- BM.02: công thức – phiếu kiểm tra pha chế ---------------- */
  function ptDlg(p) {
    const ql = QL(), d = p ? JSON.parse(JSON.stringify(p.d)) : { ngayBD: today(), nl: [{}, {}, {}, {}, {}], kq: CT0(), tt: "Giao" };
    if (!d.nl || !d.nl.length) d.nl = [{}]; if (!d.kq || !d.kq.length) d.kq = CT0();
    const me = S.me.ten, toi = d.nguoiTH === me, ghiKQ = ql || (toi && d.tt !== "Đã duyệt"), ro = !ql ? "disabled" : "";
    const YC = live(R).filter(x => x.loai === "YC");
    const nlList = (S.items || []).filter(i => /Nguyên liệu|Phụ gia/.test(i.nhom)).map(i => `<option value="${E(i.ten)}">${E(i.ma)}</option>`).join("");
    const nlRows = () => d.nl.map((r, i) => `<tr><td class="c">${i + 1}</td><td><input data-nl="${i}" data-k="ten" list="rdNlDl" value="${E(r.ten || "")}" ${ro}></td><td><input data-nl="${i}" data-k="pct" type="number" step="any" inputmode="decimal" value="${E(r.pct ?? "")}" ${ro} style="text-align:right"></td><td><input data-nl="${i}" data-k="tt" value="${E(r.tt || "")}" ${ro} placeholder="VD 1, 2…"></td>${ql ? `<td><button type="button" class="btn small" data-rmnl="${i}">✕</button></td>` : ""}</tr>`).join("");
    const kqRows = () => d.kq.map((r, i) => `<tr><td><input data-kq="${i}" data-k="ct" value="${E(r.ct || "")}" ${ghiKQ ? "" : "disabled"} placeholder="Chỉ tiêu"></td>${["a", "b", "c"].map(k => `<td><input data-kq="${i}" data-k="${k}" value="${E(r[k] || "")}" ${ghiKQ ? "" : "disabled"}></td>`).join("")}</tr>`).join("");
    const w = dlg(p ? `Phiếu thử nghiệm ${E(d.so || "")}` : "Lập công thức thử nghiệm", `
      <p class="note" style="margin:0 0 8px">BM.02-RD-QT.01 · ${p ? chip(p) : ""} ${d.baoLuc ? " · báo kết quả " + E(d.baoLuc) : ""}${d.duyetBoi ? " · duyệt: " + E(d.duyetBoi) + " " + E(d.duyetLuc || "") : ""}</p>
      <div class="grp">1. Thông tin chung ${ql ? "" : '<small class="note">(do TP. LAB/RD lập)</small>'}</div>
      <div class="two"><label>Tên sản phẩm *<input id="ptSp" value="${E(d.sp || "")}" ${ro} placeholder="VD Pymetrozine 20% + Nitenpyram 15% OD"></label><label>Mã công thức<input id="ptMa" value="${E(d.maCT || "")}" ${ro} placeholder="VD PN35OD-03"></label></div>
      <div class="two"><label>Hàm lượng<input id="ptHl" value="${E(d.hl || "")}" ${ro}></label><label>Yêu cầu nghiên cứu (BM.04)<select id="ptYc" ${ro}><option value="">— không gắn —</option>${YC.map(y => `<option value="${E(y.id)}" ${y.id === d.yc ? "selected" : ""}>${E(D(y.ngay) + " · " + (y.d.noiDung || "").slice(0, 60))}</option>`).join("")}</select></label></div>
      <div class="two"><label>Ngày bắt đầu<input id="ptBD" type="date" value="${E(d.ngayBD || "")}" ${ro}></label><label>Người thực hiện<select id="ptNg" ${ro}>${userOpts(d.nguoiTH)}</select></label></div>
      <div class="grp">2. Công thức sản phẩm</div>
      <datalist id="rdNlDl">${nlList}</datalist>
      <div class="dgx"><table><thead><tr><th style="width:6%">STT</th><th>Tên nguyên liệu</th><th style="width:16%">%w/w</th><th style="width:20%">Thứ tự thực hiện</th>${ql ? '<th style="width:6%"></th>' : ""}</tr></thead><tbody id="ptNl">${nlRows()}</tbody>
      <tfoot><tr><td></td><td><b>Tổng cộng</b> ${ql ? '<button type="button" class="btn small" id="ptAddNl">+ dòng</button>' : ""}</td><td id="ptSum" style="text-align:right;font-weight:700"></td><td>Tỷ trọng: <input id="ptTT" value="${E(d.tyTrong || "")}" ${ro} style="width:90px"></td>${ql ? "<td></td>" : ""}</tr></tfoot></table></div>
      <div class="grp">3. Quy trình pha chế</div>
      <textarea id="ptQT" rows="5" ${ro} style="width:100%" placeholder="Các bước pha chế, thứ tự cho nguyên liệu, tốc độ khuấy, thời gian, nhiệt độ…">${E(d.quyTrinh || "")}</textarea>
      <div class="grp">4. Kết quả thực hiện ${toi && !ql ? '<small class="note" style="color:#2563eb">(phần của bạn)</small>' : ""}</div>
      <div class="dgx"><table><thead><tr><th style="width:28%">Chỉ tiêu</th><th>Điều kiện thường 28±2 °C</th><th>Lưu mẫu 54±2 °C, 14 ngày${d.ngayBD ? `<br><small>đọc ngày ${D(add(d.ngayBD, 14))}</small>` : ""}</th><th>Lưu mẫu 0±2 °C, 7 ngày (nếu có)${d.ngayBD ? `<br><small>đọc ngày ${D(add(d.ngayBD, 7))}</small>` : ""}</th></tr></thead><tbody id="ptKq">${kqRows()}</tbody></table></div>
      ${ghiKQ ? '<button type="button" class="btn small" id="ptAddKq" style="margin-top:6px">+ chỉ tiêu</button>' : ""}
      <div class="two" style="margin-top:8px"><label>Kết quả ban đầu (tóm tắt — ghi vào Sổ BM.01)<textarea id="ptKqbd" rows="2" ${ghiKQ ? "" : "disabled"}>${E(d.kqbd || "")}</textarea></label><label>Đề xuất của người thực hiện<textarea id="ptDx" rows="2" ${ghiKQ ? "" : "disabled"}>${E(d.deXuat || "")}</textarea></label></div>
      <label style="max-width:240px">Ngày kết thúc<input id="ptKT" type="date" value="${E(d.ngayKT || "")}" ${ghiKQ ? "" : "disabled"}></label>
      <div class="grp">5. Đánh giá ${ql ? "" : '<small class="note">(TP. LAB/RD)</small>'}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center">${["Đạt", "Không đạt"].map(v => `<label class="pk"><input type="radio" name="ptDg" value="${v}" ${d.danhGia === v ? "checked" : ""} ${ro}> ${v}</label>`).join("")}<span class="note">Đề xuất xử lý:</span>${["Thử nghiệm lại", "Không thử lại"].map(v => `<label class="pk"><input type="radio" name="ptXl" value="${v}" ${d.xuLy === v ? "checked" : ""} ${ro}> ${v}</label>`).join("")}</div>
      <label>Ghi chú đánh giá<input id="ptGc" value="${E(d.ghiChu || "")}" ${ro}></label>
      <div class="actions" style="flex-wrap:wrap">
        ${ql ? `<button class="btn primary" type="button" id="ptSave">${p ? "Lưu" : "Lưu & giao việc"}</button>` : ""}
        ${!ql && toi && d.tt !== "Đã duyệt" ? '<button class="btn" type="button" id="ptDraft">Lưu kết quả</button><button class="btn primary" type="button" id="ptBao">📨 Báo kết quả</button>' : ""}
        ${p ? '<button class="btn" type="button" id="ptPr">🖨 In BM.02</button>' : ""}
        ${p && ql ? '<button class="btn danger" type="button" id="ptDel">Xoá</button>' : ""}
        <span style="flex:1"></span><button class="btn" type="button" data-x>Đóng</button></div>`, true);
    const q = s => w.querySelector(s);
    const sum = () => { const t = d.nl.reduce((s, r) => s + (+r.pct || 0), 0); q("#ptSum").textContent = (Math.round(t * 1000) / 1000).toLocaleString("vi-VN") + " %"; q("#ptSum").style.color = Math.abs(t - 100) < 0.01 || !t ? "inherit" : "#c62828"; };
    const wire = () => {
      w.querySelectorAll("[data-nl]").forEach(i => i.oninput = () => { d.nl[+i.dataset.nl][i.dataset.k] = i.value; sum(); });
      w.querySelectorAll("[data-kq]").forEach(i => i.oninput = () => { d.kq[+i.dataset.kq][i.dataset.k] = i.value; });
      w.querySelectorAll("[data-rmnl]").forEach(b => b.onclick = () => { d.nl.splice(+b.dataset.rmnl, 1); q("#ptNl").innerHTML = nlRows(); wire(); sum(); });
    };
    wire(); sum();
    if (q("#ptAddNl")) q("#ptAddNl").onclick = () => { d.nl.push({}); q("#ptNl").innerHTML = nlRows(); wire(); };
    if (q("#ptAddKq")) q("#ptAddKq").onclick = () => { d.kq.push({}); q("#ptKq").innerHTML = kqRows(); wire(); };
    q("[data-x]").onclick = () => w.remove();
    const collect = () => {
      if (ql) Object.assign(d, { sp: q("#ptSp").value.trim(), maCT: q("#ptMa").value.trim(), hl: q("#ptHl").value.trim(), yc: q("#ptYc").value, ngayBD: q("#ptBD").value, nguoiTH: q("#ptNg").value, tyTrong: q("#ptTT").value.trim(), quyTrinh: q("#ptQT").value,
        danhGia: (w.querySelector('[name=ptDg]:checked') || {}).value || "", xuLy: (w.querySelector('[name=ptXl]:checked') || {}).value || "", ghiChu: q("#ptGc").value.trim() });
      if (ghiKQ) Object.assign(d, { kqbd: q("#ptKqbd").value.trim(), deXuat: q("#ptDx").value.trim(), ngayKT: q("#ptKT").value });
      d.nl = d.nl.filter(r => String(r.ten || "").trim() || String(r.pct || "").trim()); d.kq = d.kq.filter(r => String(r.ct || "").trim() || r.a || r.b || r.c);
    };
    const go = async (extra, msg) => { collect(); Object.assign(d, extra || {}); try {
        const giaoMoi = ql && d.nguoiTH && (!p || p.d.nguoiTH !== d.nguoiTH) && d.nguoiTH !== S.me.ten;
        const r = await save({ id: p && p.id, loai: "PT", ngay: d.ngayBD, d }, msg);
        if (giaoMoi) push("🧪 Giao thử nghiệm " + (r.d.so || ""), (r.d.sp || "") + " · bắt đầu " + D(r.d.ngayBD) + " · giao bởi " + S.me.ten, { ten: [d.nguoiTH] });
        if (extra && extra.tt === "Đã báo KQ") push("📨 Kết quả thử nghiệm " + (r.d.so || ""), (r.d.sp || "") + " · " + S.me.ten + " đã báo kết quả, chờ đánh giá", { roles: ["Quản lý"] });
        if (ql && d.danhGia && (!p || p.d.danhGia !== d.danhGia) && d.nguoiTH && d.nguoiTH !== S.me.ten) push((d.danhGia === "Đạt" ? "✅ " : "⛔ ") + "Đánh giá " + (r.d.so || "") + ": " + d.danhGia, (r.d.sp || "") + (d.xuLy ? " · " + d.xuLy : ""), { ten: [d.nguoiTH] });
        w.remove(); renderRD(); } catch (e) { toast(e.message); } };
    if (q("#ptSave")) q("#ptSave").onclick = () => { if (!q("#ptSp").value.trim()) return toast("Ghi tên sản phẩm."); go(null, p ? "Đã lưu phiếu" : "Đã lập phiếu" + (q("#ptNg").value ? " và giao cho " + q("#ptNg").value : "")); };
    if (q("#ptDraft")) q("#ptDraft").onclick = () => go(null, "Đã lưu kết quả");
    if (q("#ptBao")) q("#ptBao").onclick = () => go({ tt: "Đã báo KQ" }, "Đã báo kết quả cho TP. LAB/RD");
    if (q("#ptPr")) q("#ptPr").onclick = () => { collect(); prPT(p, d); };
    if (q("#ptDel")) q("#ptDel").onclick = async () => { if (await del(p.id)) { w.remove(); renderRD(); } };
  }
  function prPT(p, d) {
    const K = window.BMK, nl = (d.nl || []).concat(Array(Math.max(0, 12 - (d.nl || []).length)).fill({})), t = (d.nl || []).reduce((s, r) => s + (+r.pct || 0), 0), cb = v => v ? "☑" : "☐";
    K.pr(`${K.PCSS}<style>.pq td,.pq th{padding:3px 6px}.pq .qt{min-height:28mm;white-space:pre-wrap}</style><div class="pq">${K.head("CÔNG THỨC SẢN PHẨM –<br>PHIẾU KIỂM TRA PHA CHẾ", meta("PT"))}
      <p>Số phiếu theo dõi: <b>${E(d.so || "")}</b></p>
      <table><tr class="sec"><td colspan="4">1. THÔNG TIN CHUNG</td></tr><tr><td style="width:22%">Ngày bắt đầu</td><td>${D(d.ngayBD)}</td><td style="width:22%">Ngày kết thúc</td><td>${D(d.ngayKT)}</td></tr>
      <tr><td>Tên sản phẩm</td><td><b>${E(d.sp || "")}</b></td><td>Mã công thức</td><td>${E(d.maCT || "")}</td></tr><tr><td>Hàm lượng</td><td>${E(d.hl || "")}</td><td>Người thực hiện</td><td>${E(d.nguoiTH || "")}</td></tr></table>
      <div class="gap"></div><table><tr class="sec"><td colspan="4">2. CÔNG THỨC SẢN PHẨM</td></tr><tr><th style="width:8%">STT</th><th>Tên nguyên liệu</th><th style="width:16%">%w/w</th><th style="width:24%">Thứ tự thực hiện</th></tr>
      ${nl.map((r, i) => `<tr><td class="c">${i + 1}</td><td>${E(r.ten || "")}</td><td class="r">${E(r.pct ?? "")}</td><td class="c">${E(r.tt || "")}</td></tr>`).join("")}
      <tr><td></td><td><b>Tổng cộng</b></td><td class="r"><b>${t ? (Math.round(t * 1000) / 1000) : ""}</b></td><td>Tỷ trọng: ${E(d.tyTrong || "")}</td></tr></table>
      <div class="gap"></div><table><tr class="sec"><td>3. QUY TRÌNH PHA CHẾ</td></tr><tr><td class="qt">${E(d.quyTrinh || "")}</td></tr></table>
      <div class="gap"></div><table><tr class="sec"><td colspan="4">4. KẾT QUẢ THỰC HIỆN</td></tr><tr><th style="width:28%">Chỉ tiêu</th><th>Theo dõi ở điều kiện thường: 28±2 °C</th><th>Lưu mẫu: 54±2 °C, 14 ngày</th><th>Lưu mẫu: 0±2 °C, 7 ngày (nếu có)</th></tr>
      ${(d.kq || []).map((r, i) => `<tr><td>4.${i + 1} ${E(r.ct || "")}</td><td>${E(r.a || "")}</td><td>${E(r.b || "")}</td><td>${E(r.c || "")}</td></tr>`).join("")}
      ${d.kqbd ? `<tr><td>Kết quả ban đầu</td><td colspan="3">${E(d.kqbd)}</td></tr>` : ""}${d.deXuat ? `<tr><td>Đề xuất của người thực hiện</td><td colspan="3">${E(d.deXuat)}</td></tr>` : ""}</table>
      <div class="gap"></div><table><tr class="sec"><td>5. ĐÁNH GIÁ</td></tr><tr><td>${cb(d.danhGia === "Đạt")} Đạt &nbsp;&nbsp; ${cb(d.danhGia === "Không đạt")} Không đạt &nbsp;&nbsp;&nbsp;&nbsp; Đề xuất xử lý: ${cb(d.xuLy === "Thử nghiệm lại")} Thử nghiệm lại &nbsp; ${cb(d.xuLy === "Không thử lại")} Không thử lại${d.ghiChu ? "<br>Ghi chú: " + E(d.ghiChu) : ""}</td></tr></table>
      ${K.sign([["Phòng R&D", d.duyetBoi || ""], ["Nhân viên thực hiện", d.nguoiTH || ""]])}</div>`);
  }

  /* ---------------- BM.04: yêu cầu ---------------- */
  function ycDlg(y) {
    const ql = QL(), d = y ? Object.assign({}, y.d) : {}, ro = ql ? "" : "disabled";
    const w = dlg(y ? "Yêu cầu nghiên cứu" : "Ghi yêu cầu nghiên cứu", `<p class="note" style="margin:0 0 8px">BM.04-RD-QT.01 · Sổ theo dõi yêu cầu</p>
      <div class="two"><label>Ngày yêu cầu<input id="ycNgay" type="date" value="${E(y ? y.ngay : today())}" ${ro}></label><label>Đơn vị / người yêu cầu<input id="ycDv" value="${E(d.donVi || "")}" ${ro} placeholder="VD TGĐ, P.KD, khách hàng…"></label></div>
      <label>Nội dung yêu cầu<textarea id="ycNd" rows="3" ${ro}>${E(d.noiDung || "")}</textarea></label>
      <div class="two"><label>Ngày cần kết quả nghiên cứu<input id="ycHan" type="date" value="${E(d.han || "")}" ${ro}></label><label>Người thực hiện<select id="ycNg" ${ro}>${userOpts(d.nguoiTH)}</select></label></div>
      <div class="two"><label>Ngày kết thúc<input id="ycKT" type="date" value="${E(d.ngayKT || "")}" ${ro}></label><label>Ghi chú<input id="ycGc" value="${E(d.ghiChu || "")}" ${ro}></label></div>
      <div class="actions">${ql ? '<button class="btn primary" type="button" id="ycSave">Lưu</button>' : ""}${y && ql ? '<button class="btn danger" type="button" id="ycDel">Xoá</button>' : ""}<span style="flex:1"></span><button class="btn" type="button" data-x>Đóng</button></div>`);
    const q = s => w.querySelector(s); q("[data-x]").onclick = () => w.remove();
    if (q("#ycSave")) q("#ycSave").onclick = async () => { const nd = q("#ycNd").value.trim(); if (!nd) return toast("Ghi nội dung yêu cầu.");
      const n = { donVi: q("#ycDv").value.trim(), noiDung: nd, han: q("#ycHan").value, nguoiTH: q("#ycNg").value, ngayKT: q("#ycKT").value, ghiChu: q("#ycGc").value.trim() };
      try { await save({ id: y && y.id, loai: "YC", ngay: q("#ycNgay").value, d: n }, "Đã lưu yêu cầu");
        if (n.nguoiTH && (!y || y.d.nguoiTH !== n.nguoiTH) && n.nguoiTH !== S.me.ten) push("📝 Yêu cầu nghiên cứu mới", nd.slice(0, 120) + (n.han ? " · cần kết quả " + D(n.han) : ""), { ten: [n.nguoiTH] });
        w.remove(); renderRD(); } catch (e) { toast(e.message); } };
    if (q("#ycDel")) q("#ycDel").onclick = async () => { if (await del(y.id)) { w.remove(); renderRD(); } };
  }
  /* ---------------- BM.03: giao mẫu khảo nghiệm ---------------- */
  function gmDlg(g) {
    const d = g ? Object.assign({}, g.d) : { phong: "R&D" }, f = (id, lb, v, t) => `<label>${lb}<input id="${id}" ${t ? `type="${t}"` : ""} value="${E(v || "")}"></label>`;
    const w = dlg(g ? "Mẫu giao khảo nghiệm" : "Ghi giao mẫu khảo nghiệm hiệu lực", `<p class="note" style="margin:0 0 8px">BM.03-RD-QT.01 · Sổ giao mẫu khảo nghiệm hiệu lực</p>
      <div class="two">${f("gmPh", "Phòng bàn giao mẫu", d.phong)}${f("gmBb", "Mã số biên bản giao mẫu", d.bienBan)}</div>
      <div class="two">${f("gmMa", "Mã số mẫu", d.maMau)}${f("gmTen", "Tên mẫu *", d.ten)}</div>
      <div class="two">${f("gmDvt", "ĐVT", d.dvt)}${f("gmTtl", "TT/TL (quy cách)", d.ttl)}</div>
      <div class="two">${f("gmSl", "Số lượng", d.sl)}${f("gmNg", "Ngày gửi", g ? g.ngay : today(), "date")}</div>
      <div class="two">${f("gmNn", "Người nhận", d.nguoiNhan)}${f("gmTra", "Ngày trả kết quả", d.ngayTra, "date")}</div>
      <label>Ghi chú / kết quả<input id="gmGc" value="${E(d.ghiChu || "")}"></label>
      <div class="actions"><button class="btn primary" type="button" id="gmSave">Lưu</button>${g ? '<button class="btn danger" type="button" id="gmDel">Xoá</button>' : ""}<span style="flex:1"></span><button class="btn" type="button" data-x>Đóng</button></div>`);
    const q = s => w.querySelector(s); q("[data-x]").onclick = () => w.remove();
    q("#gmSave").onclick = async () => { const ten = q("#gmTen").value.trim(); if (!ten) return toast("Ghi tên mẫu.");
      const n = { phong: q("#gmPh").value.trim(), bienBan: q("#gmBb").value.trim(), maMau: q("#gmMa").value.trim(), ten, dvt: q("#gmDvt").value.trim(), ttl: q("#gmTtl").value.trim(), sl: q("#gmSl").value.trim(), nguoiNhan: q("#gmNn").value.trim(), ngayTra: q("#gmTra").value, ghiChu: q("#gmGc").value.trim() };
      try { await save({ id: g && g.id, loai: "GM", ngay: q("#gmNg").value, d: n }); w.remove(); renderRD(); } catch (e) { toast(e.message); } };
    if (q("#gmDel")) q("#gmDel").onclick = async () => { if (await del(g.id)) { w.remove(); renderRD(); } };
  }
  async function impGM() {
    const L = [["Dofine 0.5SL", "Chai", "100ml", "5", "2026-01-22"], ["Osaku 435WP", "Túi", "100gr", "10", "2026-03-03"], ["Doctor 5ME", "Chai", "100ml", "10", "2026-04-04"], ["PK ASATA 27-13+TE KPHOS_02", "Chai", "500ml", "2", "2026-04-14"]];
    if (!await askConfirm(["Chuyển 4 mẫu đã giao trong sổ BM.03 trên Drive vào Sổ Kho: " + L.map(x => x[0]).join(", ") + " (người nhận: Anh Hiếu)."])) return;
    try { for (const x of L) await api("webRDSave", S.auth, { loai: "GM", ngay: x[4], d: { phong: "R&D", ten: x[0], dvt: x[1], ttl: x[2], sl: x[3], nguoiNhan: "Anh Hiếu" } }); toast("Đã chuyển 4 dòng"); renderRD(); } catch (e) { toast(e.message); }
  }

  /* ---------------- BM.01: sổ nghiên cứu thử nghiệm (tổng hợp) ---------------- */
  function soRows() {
    const Y = live(R).filter(x => x.loai === "YC"), P = live(R).filter(x => x.loai === "PT"), out = [];
    P.forEach(p => { const y = Y.find(x => x.id === p.d.yc); out.push({ ngayYC: y ? y.ngay : p.ngay, dv: y ? y.d.donVi : "", nd: y ? y.d.noiDung : p.d.sp, th: p.d.ngayBD, so: p.d.so, kq: p.d.kqbd || "", kl: p.d.danhGia ? p.d.danhGia + (p.d.xuLy ? " · " + p.d.xuLy : "") : "", gc: [p.d.sp, p.d.maCT].filter(Boolean).join(" · ") }); });
    Y.filter(y => !P.some(p => p.d.yc === y.id)).forEach(y => out.push({ ngayYC: y.ngay, dv: y.d.donVi, nd: y.d.noiDung, th: "", so: "", kq: "", kl: y.d.ngayKT ? "Kết thúc " + D(y.d.ngayKT) : "", gc: y.d.ghiChu || "" }));
    return out.sort((a, b) => String(a.ngayYC).localeCompare(String(b.ngayYC)) || String(a.so).localeCompare(String(b.so)));
  }
  function soTable(pr) {
    const L = soRows(); if (!L.length && !pr) return '<div class="empty">Chưa có yêu cầu hay phiếu thử nào.</div>';
    return `<div class="${pr ? "" : "dgx"}"><table><thead><tr><th style="width:4%">STT</th><th style="width:9%">Ngày yêu cầu</th><th style="width:10%">Đơn vị</th><th>Nội dung yêu cầu</th><th style="width:9%">Ngày thực hiện</th><th style="width:10%">Số phiếu theo dõi</th><th style="width:17%">Kết quả ban đầu</th><th style="width:11%">Kết luận</th><th style="width:11%">Ghi chú</th></tr></thead><tbody>
      ${L.map((r, i) => `<tr><td class="c">${i + 1}</td><td class="c">${D(r.ngayYC)}</td><td>${E(r.dv)}</td><td>${E(r.nd)}</td><td class="c">${D(r.th)}</td><td class="c">${E(r.so)}</td><td>${E(r.kq)}</td><td>${E(r.kl)}</td><td>${E(r.gc)}</td></tr>`).join("")}</tbody></table></div>`;
  }
  const sheetPr = (k, title, tbl) => { const K = window.BMK; K.pr(`${K.PCSS}<style>.pq td,.pq th{font-size:11pt;padding:3px 5px}</style><div class="pq">${K.head(title, meta(k))}<div class="gap"></div>${tbl}</div>`, true); };
  function prSO() { sheetPr("SO", "SỔ NGHIÊN CỨU THỬ NGHIỆM", soTable(true)); }
  function prYC() { const L = live(R).filter(x => x.loai === "YC").sort((a, b) => String(a.ngay).localeCompare(String(b.ngay)));
    sheetPr("YC", "SỔ THEO DÕI YÊU CẦU", `<table><thead><tr><th style="width:5%">Stt</th><th style="width:10%">Ngày yêu cầu</th><th style="width:14%">Đơn vị/ Người yêu cầu</th><th>Nội dung yêu cầu</th><th style="width:11%">Ngày cần kết quả nghiên cứu</th><th style="width:10%">Ngày kết thúc</th><th style="width:13%">Người thực hiện</th><th style="width:12%">Ghi chú</th></tr></thead><tbody>${L.map((y, i) => `<tr><td class="c">${i + 1}</td><td class="c">${D(y.ngay)}</td><td>${E(y.d.donVi)}</td><td>${E(y.d.noiDung)}</td><td class="c">${D(y.d.han)}</td><td class="c">${D(y.d.ngayKT)}</td><td>${E(y.d.nguoiTH)}</td><td>${E(y.d.ghiChu)}</td></tr>`).join("")}</tbody></table>`); }
  function prGM() { const L = live(R).filter(x => x.loai === "GM").sort((a, b) => String(a.ngay).localeCompare(String(b.ngay)));
    sheetPr("GM", "SỔ GIAO MẪU KHẢO NGHIỆM HIỆU LỰC", `<table><thead><tr><th style="width:4%">STT</th><th style="width:8%">Phòng bàn giao mẫu</th><th style="width:9%">Mã số biên bản giao mẫu</th><th style="width:8%">Mã số mẫu</th><th>Tên mẫu</th><th style="width:5%">ĐVT</th><th style="width:7%">TT/TL</th><th style="width:7%">Số lượng</th><th style="width:9%">Ngày gửi</th><th style="width:10%">Người nhận</th><th style="width:9%">Ngày trả kết quả</th><th style="width:9%">Ghi chú</th></tr></thead><tbody>${L.map((g, i) => `<tr><td class="c">${i + 1}</td><td>${E(g.d.phong)}</td><td>${E(g.d.bienBan)}</td><td>${E(g.d.maMau)}</td><td>${E(g.d.ten)}</td><td class="c">${E(g.d.dvt)}</td><td class="c">${E(g.d.ttl)}</td><td class="c">${E(g.d.sl)}</td><td class="c">${D(g.ngay)}</td><td>${E(g.d.nguoiNhan)}</td><td class="c">${D(g.d.ngayTra)}</td><td>${E(g.d.ghiChu)}</td></tr>`).join("")}</tbody></table>`); }

  /* ---------------- cho Bàn làm việc ---------------- */
  window.rdTasks = async function () {
    if (!S.me || !S.me.ct) return [];
    try { await load(); } catch (e) { return []; }
    const me = S.me.ten, ql = QL(), t = today(), out = [];
    live(R).filter(x => x.loai === "PT").forEach(p => {
      const d = p.d, n54 = add(d.ngayBD, 14), b54 = !(d.kq || []).some(r => String(r.b || "").trim());
      if (d.nguoiTH === me && (d.tt === "Giao" || d.tt === "Đang thử")) out.push({ id: p.id, c: "#2563eb", t: `🧪 <b>${E(d.so)}</b> · ${E(d.sp)} — ${d.tt === "Giao" ? "<b>được giao, chưa bắt đầu</b>" : "đang thử"}${n54 && b54 ? ` · đọc mẫu 54 °C ngày <b style="color:${n54 <= t ? "#c62828" : "inherit"}">${D(n54)}</b>` : ""}` });
      if (ql && d.tt === "Đã báo KQ") out.push({ id: p.id, c: "#7c3aed", t: `📨 <b>${E(d.so)}</b> · ${E(d.sp)} — ${E(d.nguoiTH)} đã báo kết quả, <b>chờ anh đánh giá</b>` });
      if (ql && (d.tt === "Giao" || d.tt === "Đang thử") && n54 && n54 < t && b54) out.push({ id: p.id, c: "#c62828", t: `⏰ <b>${E(d.so)}</b> · ${E(d.sp)} — quá ngày đọc mẫu 54 °C (${D(n54)}), ${E(d.nguoiTH || "chưa giao")} chưa ghi` });
    });
    live(R).filter(x => x.loai === "YC" && !x.d.ngayKT && (ql || x.d.nguoiTH === me)).forEach(y => { if (y.d.han && y.d.han <= add(t, 3)) out.push({ id: y.id, c: y.d.han < t ? "#c62828" : "#d97706", t: `📝 Yêu cầu: ${E((y.d.noiDung || "").slice(0, 80))} — cần kết quả <b>${D(y.d.han)}</b>${y.d.han < t ? " (quá hạn)" : ""}` }); });
    return out;
  };
  window.rdOpen = function (id) { setTab("rd"); setTimeout(async () => { try { if (!R.length) await load(); const r = rec(id); if (r) (r.loai === "PT" ? ptDlg : r.loai === "YC" ? ycDlg : gmDlg)(r); } catch (e) {} }, 300); };
})();
