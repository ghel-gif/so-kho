/* Sổ Kho — THIẾT BỊ NHÀ XƯỞNG + KIỂM TRA CÂN
   Thiết bị nhà xưởng: danh mục thiết bị, lịch kiểm định / hiệu chuẩn (cảnh báo từ 60 ngày trước hạn; P.QA/QC đề xuất HCKĐ trước hạn ít nhất 15 ngày, TGĐ duyệt),
   nhật ký bảo trì – sửa chữa, hồ sơ từng thiết bị, báo cáo thiết bị không hoạt động.
   QC-QT.01 Quy trình kiểm soát thiết bị đo lường (lần ban hành 02, 02/01/2026): BM.01 Bảng theo dõi hiệu chuẩn kiểm định thiết bị đo · BM.02 Sổ kiểm tra thiết bị đo.
   QC-HD.01 Hướng dẫn kiểm tra và hiệu chỉnh thiết bị cân (lần ban hành 02, 25/09/2026):
     cân SX ≤3 kg — kiểm tra mỗi ngày có sản xuất, quả cân M1 500 g / 1.000 g, mỗi lần đo lệch không quá 0,3 g / 0,5 g;
     cân kỹ thuật PTN — kiểm tra mỗi tuần, quả cân F1 100 g / 200 g: 2 số lẻ ≤ 0,02 / 0,05 g; 3 số lẻ ≤ 0,002 / 0,005 g.
     C1 = |M − m1|, C2 = |M − m2|, độ lệch = (C1 + C2) / 2; cả C1 và C2 trong giới hạn mới đạt. */
"use strict";
(function () {
  const E = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const D = s => { s = String(s || "").slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s.split("-").reverse().join("/") : s; };
  const DM = s => { s = String(s || "").slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s.slice(8, 10) + "/" + s.slice(5, 7) : s; };
  const today = () => (window.S && S.today) || new Date().toISOString().slice(0, 10);
  const QC = () => !!(S.me && (S.me.qc || S.me.vaiTro === "Quản lý"));
  const TP = () => !!(S.me && S.me.vaiTro === "Quản lý" && S.me.ten === "Nguyễn Ô Ghel");
  const isYmd = s => /^\d{4}-\d{2}-\d{2}$/.test(s || "");
  const t0 = s => Date.parse(s + "T00:00:00+07:00");
  const addD = (s, n) => new Date(t0(s) + n * 864e5 + 12 * 3600e3).toISOString().slice(0, 10);
  const addM = (s, m) => { if (!isYmd(s) || !(+m > 0)) return ""; const [y, mo, d] = s.split("-").map(Number), t = new Date(Date.UTC(y, mo - 1 + +m, 1)), last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
    return t.getUTCFullYear() + "-" + String(t.getUTCMonth() + 1).padStart(2, "0") + "-" + String(Math.min(d, last)).padStart(2, "0"); };
  const conNgay = s => isYmd(s) ? Math.round((t0(s) - t0(today())) / 864e5) : null;
  const THU = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  const dow = s => new Date(t0(s) + 12 * 3600e3).getUTCDay();
  const wkStart = s => addD(s, -((dow(s) + 6) % 7));
  const num = v => { const x = parseFloat(String(v ?? "").replace(",", ".")); return isFinite(x) ? x : null; };
  const vn = v => String(v).replace(".", ",");
  const META = bm => `Mã số: <b>${bm}</b><br>Phiên bản: 02<br>Ngày hiệu lực: 02/01/2026`;

  const TT = ["Đang sử dụng", "Tạm ngưng", "Chờ sửa", "Ngừng sử dụng", "Chưa cập nhật"];
  const TTC = { "Đang sử dụng": "#2e7d32", "Tạm ngưng": "#d97706", "Chờ sửa": "#c2410c", "Ngừng sử dụng": "#64748b", "Chưa cập nhật": "#94a3b8" };
  const KHD = ["Tạm ngưng", "Chờ sửa", "Ngừng sử dụng"];
  const HTQL = ["Bảo trì", "Kiểm định", "Hiệu chuẩn", "Kiểm định - hiệu chuẩn", "Kiểm định an toàn", "Bảo dưỡng"];
  const BOPHAN = ["Sản xuất", "Bảo trì", "QA-QC/R&D", "Kho", "Hành chính"];
  const HCL = ["Hiệu chuẩn", "Kiểm định", "Kiểm định an toàn", "Bảo dưỡng"];
  const LCV = ["Bảo trì định kỳ", "Sửa chữa", "Vệ sinh", "Kiểm tra", "Thay thế phụ tùng", "Hiệu chuẩn", "Kiểm định", "Kiểm định an toàn", "Bảo dưỡng"];
  const KC = {
    M1: { ten: "Cân SX hằng ngày", qua: [500, 1000], chuan: "QUẢ CÂN 500G M1, 1000G M1", chu: "quả cân M1 500 g, 1.000 g", nv: "Nhân viên QC line", ky: ["Trưởng phòng QA/QC", "Nhân viên QC"],
      dp: () => 1, gh: () => ({ 500: 0.3, 1000: 0.5 }), luat: "QC-HD.01: mỗi ngày có sản xuất, cân 2 lần quả cân M1 500 g (mỗi lần lệch ≤ 0,3 g) và 1.000 g (≤ 0,5 g); cả 2 lần trong giới hạn mới đạt." },
    F1: { ten: "Cân PTN hằng tuần", qua: [100, 200], chuan: "Quả cân 200g F1, 100g F1", chu: "quả cân F1 100 g, 200 g", nv: "Nhân viên QC", ky: ["Trưởng phòng QA/QC", "Nhân viên QC"],
      dp: doc => +doc && +doc <= 0.001 ? 3 : 2, gh: doc => +doc && +doc <= 0.001 ? { 100: 0.002, 200: 0.005 } : { 100: 0.02, 200: 0.05 },
      luat: "QC-HD.01: mỗi tuần, cân 2 lần quả cân F1 100 g và 200 g — cân 2 số lẻ lệch ≤ 0,02 / 0,05 g, cân 3 số lẻ ≤ 0,002 / 0,005 g; cả 2 lần trong giới hạn mới đạt." }
  };

  let R = [], USERS = [];
  const live = L => L.filter(x => !x.xoa);
  const rec = id => R.find(x => x.id === id);
  const tbs = () => live(R).filter(x => x.loai === "TB");
  const nks = () => live(R).filter(x => x.loai === "NK");
  const kcs = () => live(R).filter(x => x.loai === "KC");
  async function load() { R = await api0("webTBAll", S.auth); try { if (!USERS.length) USERS = await api0("getUserNames"); } catch (e) {} }
  async function save(o, msg) { const r = await api("webTBSave", S.auth, o); if (msg) toast(msg); return r; }
  const rer = () => { if (S.tab === "kc" && window.renderKC) renderKC(); else if (S.tab === "tb" && window.renderTB) renderTB(); else if (S.tab === "blv" && window.blvRender) blvRender(); };
  const maK = t => String(t.d.ma || "").trim().toUpperCase();
  const isDup = t => { const m = maK(t); return !!m && m !== "N/A" && tbs().some(x => x.id !== t.id && maK(x) === m); };
  const dupMa = () => { const c = {}; tbs().forEach(t => { const m = maK(t); if (m && m !== "N/A") (c[m] = c[m] || []).push(t); }); return Object.entries(c).filter(([, L]) => L.length > 1); };
  const tenTB = t => (t.d.ma ? t.d.ma + " · " : "") + t.d.ten;
  const byStt = (a, b) => (+a.d.stt || 9999) - (+b.d.stt || 9999) || String(a.d.ma || "").localeCompare(String(b.d.ma || ""), "vi", { numeric: true });
  const byMa = (a, b) => String(a.d.ma || "~").localeCompare(String(b.d.ma || "~"), "vi", { numeric: true }) || String(a.d.ten).localeCompare(String(b.d.ten), "vi");
  const chip = (t, c) => `<span class="st" style="background:${c};color:#fff;border-color:${c}">${E(t)}</span>`;
  const chipO = (t, c) => `<span class="st" style="color:${c};border-color:${c}">${E(t)}</span>`;
  /* trạng thái hiệu lực kiểm định / hiệu chuẩn */
  const hcTT = d => { if (!d.hcLoai) return null; if (d.tinhTrang === "Ngừng sử dụng") return { t: "Ngừng sử dụng", c: "#64748b", n: null };
    const n = conNgay(d.denHan); if (n == null) return { t: "Chưa nhập ngày đến hạn", c: "#94a3b8", n: null };
    if (n < 0) return { t: "Quá hạn " + -n + " ngày", c: "#c62828", n }; if (n <= 15) return { t: "Còn " + n + " ngày — cần đề xuất", c: "#c62828", n };
    if (n <= 60) return { t: "Còn " + n + " ngày", c: "#d97706", n }; return { t: "Còn hạn", c: "#2e7d32", n }; };
  const hcLine = d => { if (!d.hcLoai) return "Không theo dõi kiểm định / hiệu chuẩn."; const h = hcTT(d);
    return `${chip(h.t, h.c)} ${E(d.hcLoai)}${d.chuKy ? " · chu kỳ " + E(d.chuKy) + " tháng" : ""}${isYmd(d.denHan) ? " · đến hạn " + D(d.denHan) + (h.n != null && h.n >= 0 ? " · lập đề xuất HCKĐ trước " + D(addD(d.denHan, -15)) + " (ít nhất 15 ngày trước hạn, QC-QT.01)" : "") : ""}`; };
  const kcLine = d => !d.kcSo ? "Không ghi sổ kiểm tra cân." : d.kcSo === "M1" ? "Sổ BM.02 cân SX: mỗi ngày có sản xuất, quả cân M1 500 g (lệch ≤ 0,3 g) và 1.000 g (≤ 0,5 g). Chỉ cân đang sử dụng mới vào sổ."
    : `Sổ BM.02 cân PTN: mỗi tuần, quả cân F1 100 g (≤ ${vn(KC.F1.gh(d.kcDoc)[100])} g) và 200 g (≤ ${vn(KC.F1.gh(d.kcDoc)[200])} g). Chỉ cân đang sử dụng mới vào sổ.`;

  /* ---------------- kiểm tra cân: tính toán ---------------- */
  const scales = so => tbs().filter(t => t.d.kcSo === so && t.d.tinhTrang === "Đang sử dụng").sort(byMa);
  const rowsFor = (so, t, lai) => KC[so].qua.map(M => ({ tb: t.id, ma: t.d.ma || "", ten: t.d.ten, M, m1: "", m2: "", gh: KC[so].gh(t.d.kcDoc)[M], dp: KC[so].dp(t.d.kcDoc), lai: lai || 0 }));
  const ghOf = r => isFinite(parseFloat(r.gh)) ? +r.gh : ({ 500: 0.3, 1000: 0.5, 100: +r.dp >= 3 ? 0.002 : 0.02, 200: +r.dp >= 3 ? 0.005 : 0.05 })[+r.M];
  const calc = r => { const a = num(r.m1), b = num(r.m2), gh = ghOf(r); if (a == null || b == null || !(gh > 0)) return null; const M = +r.M, c1 = Math.abs(M - a), c2 = Math.abs(M - b), g = gh + 1e-9; return { c1, c2, lech: (c1 + c2) / 2, dat: c1 <= g && c2 <= g }; };
  const fx = (v, dp) => num(v) == null ? "" : num(v).toFixed(dp);
  const lechTxt = (v, dp) => { let s = v.toFixed(dp + 1); if (dp >= 2 && s.endsWith("0")) s = s.slice(0, -1); return s; };
  const gkey = r => (r.tb || r.ma) + "|" + (+r.lai || 0);
  /* kết quả cuối của từng cân: lần kiểm tra lại sau cùng (nếu có) */
  const ketQuaTB = d => { const G = {}, O = []; (d.rows || []).forEach(r => { const k = r.tb || r.ma; if (!G[k]) { G[k] = []; O.push(k); } G[k].push(r); });
    return O.map(k => { const L = G[k], mx = Math.max(...L.map(r => +r.lai || 0)), C = L.filter(r => (+r.lai || 0) === mx).map(calc);
      return { k, ma: L[0].ma, ten: L[0].ten, lai: mx, dat: C.every(c => c && c.dat), bad: C.some(c => c && !c.dat) }; }); };
  const kqOf = d => { if (d.khongSX) return "Không SX"; const K = ketQuaTB(d); if (!K.length) return ""; if (K.some(x => x.bad)) return "Không đạt"; return K.every(x => x.dat) ? "Đạt" : "Chưa đủ số liệu"; };
  const kqChip = d => { const k = d.ketQua || kqOf(d); return k === "Đạt" ? chip("Đạt", "#2e7d32") : k === "Không đạt" ? chip("Không đạt", "#c62828") : k === "Không SX" ? chipO("Không sản xuất", "#64748b") : chipO(k || "Chưa ghi", "#d97706"); };

  /* ---------------- hộp thoại chung ---------------- */
  function dlg(title, body, wide, cls) {
    const w = document.createElement("div"); w.className = "cfm" + (cls ? " " + cls : "");
    w.innerHTML = `<div class="cfm-box rd-dlg qa-dlg" style="max-width:min(${wide ? 980 : 720}px,97vw);width:${wide ? 980 : 720}px"><h2>${title}</h2>${body}</div>`;
    document.body.appendChild(w); return w;
  }
  const dl = (id, L) => `<datalist id="${id}">${[...new Set(L.filter(Boolean).map(x => String(x).trim()).filter(Boolean))].map(x => `<option value="${E(x)}">`).join("")}</datalist>`;
  const fld = (lab, html, full) => `<label${full ? ' style="grid-column:1/-1"' : ""}>${lab}${html}</label>`;
  const inp = (k, v, at) => `<input data-k="${k}" value="${E(v ?? "")}" ${at || ""}>`;
  const sel = (k, v, L, blank) => `<select data-k="${k}">${blank !== false ? `<option value="">${blank || "—"}</option>` : ""}${L.map(x => `<option${x === v ? " selected" : ""}>${E(x)}</option>`).join("")}${v && !L.includes(v) ? `<option selected>${E(v)}</option>` : ""}</select>`;
  const userSel = (k, v) => sel(k, v, USERS.length ? USERS : [S.me.ten], "— chọn —");
  const nkRow = n => `<div class="row click" data-nk="${E(n.id)}"><div class="name">${D(n.d.ngay)} · ${E(n.d.ma ? n.d.ma + " · " : "")}${E(n.d.ten)} ${chipO(n.d.loaiCV || "Công việc", "#0369a1")}</div>
      <div class="meta">${E(n.d.noiDung || "")}${n.d.ketQua ? " · <b>" + E(n.d.ketQua) + "</b>" : ""}${n.d.nguoiTH ? " · " + E(n.d.nguoiTH) : ""}${n.d.quyetDinh ? " · " + E(n.d.quyetDinh) : ""}${isYmd(n.d.ngayTiep) ? " · tiếp theo " + D(n.d.ngayTiep) : ""}</div></div>`;

  /* ================= THIẾT BỊ NHÀ XƯỞNG ================= */
  let vTB = "dm", q = "", fNhom = "", fTT = "", fHT = "", fNKm = "", fNKtb = "";
  window.renderTB = async function () {
    const b = document.getElementById("tbBox"); if (!b) return;
    if (!S.me) { b.innerHTML = '<div class="empty">Vui lòng đăng nhập.</div>'; return; }
    if (!b.dataset.ok) b.innerHTML = '<div class="empty"><span class="ldg">Đang tải danh mục thiết bị…</span></div>';
    try { await load(); } catch (e) { b.innerHTML = `<div class="empty">${E(e.message)}</div>`; return; }
    b.dataset.ok = 1;
    const A = tbs().sort(byStt), ed = QC(), HC = A.filter(t => t.d.hcLoai), dup = dupMa();
    const nQH = HC.filter(t => { const h = hcTT(t.d); return h && h.n != null && h.n < 0; }).length, n60 = HC.filter(t => { const h = hcTT(t.d); return h && h.n != null && h.n >= 0 && h.n <= 60; }).length;
    const nKHD = A.filter(t => KHD.includes(t.d.tinhTrang)).length;
    let h = `<div class="seg subseg" style="margin-bottom:10px">${[["dm", "Danh mục thiết bị"], ["hc", "Lịch kiểm định / hiệu chuẩn"], ["nk", "Nhật ký bảo trì"]].map(([k, t]) => `<button type="button" data-v="${k}" aria-pressed="${k === vTB}">${t}</button>`).join("")}</div>
      <div class="tb-sum"><div><b>${A.length}</b><small>thiết bị</small></div><div><b>${A.filter(t => t.d.tinhTrang === "Đang sử dụng").length}</b><small>đang sử dụng</small></div>
        <div class="${nKHD ? "warn" : ""}" data-go="khd" role="button" tabindex="0"><b>${nKHD}</b><small>không hoạt động</small></div><div><b>${HC.length}</b><small>dòng kiểm định / hiệu chuẩn</small></div>
        <div class="${nQH ? "bad" : ""}" data-go="hc" role="button" tabindex="0"><b>${nQH}</b><small>quá hạn</small></div><div class="${n60 ? "warn" : ""}" data-go="hc" role="button" tabindex="0"><b>${n60}</b><small>đến hạn trong 60 ngày</small></div></div>`;
    if (vTB === "dm") {
      const qq = q.trim().toLowerCase();
      const L = A.filter(t => (!fNhom || (t.d.nhom || "-") === fNhom) && (!fTT || (fTT === "KHD" ? KHD.includes(t.d.tinhTrang) : t.d.tinhTrang === fTT))
        && (!qq || [t.d.ma, t.d.ten, t.d.thongSo, t.d.ghiChu, t.d.nhom].join(" ").toLowerCase().includes(qq)));
      const nhoms = [...new Set(A.map(t => t.d.nhom || "-"))].sort((a, c) => a === "-" ? 1 : c === "-" ? -1 : a.localeCompare(c, "vi"));
      h += `<div class="tools">${ed ? '<button class="btn primary" type="button" id="tbNew">+ Thêm thiết bị</button>' : ""}
          <input type="text" id="tbQ" value="${E(q)}" placeholder="Tìm mã, tên, thông số…" style="width:auto;min-width:200px">
          <select id="tbFN" style="width:auto"><option value="">Tất cả nhóm / khu vực</option>${nhoms.map(n => `<option value="${E(n)}"${n === fNhom ? " selected" : ""}>${E(n === "-" ? "(chưa ghi nhóm)" : n)}</option>`).join("")}</select>
          <select id="tbFT" style="width:auto">${[["", "Tất cả tình trạng"], ["KHD", "Không hoạt động (tạm ngưng, chờ sửa, ngừng)"]].concat(TT.map(x => [x, x])).map(([v, t]) => `<option value="${E(v)}"${v === fTT ? " selected" : ""}>${E(t)}</option>`).join("")}</select>
          <button class="btn" type="button" id="tbPrDM">🖨 In danh mục</button><button class="btn" type="button" id="tbPrKHD">🖨 Báo cáo thiết bị không hoạt động</button></div>
        ${dup.length ? `<p class="note tb-warn">⚠ ${dup.length} mã thiết bị đang trùng: ${dup.map(([m, L]) => `<b>${E(m)}</b> (${E(L.map(t => t.d.ten).join(" / "))})`).join("; ")} — mở từng thiết bị để sửa lại mã cho đúng tem trên máy.</p>` : ""}
        <p class="note" style="margin:0 0 8px">${L.length} / ${A.length} thiết bị.</p>
        <div class="list">${L.length ? L.map(t => { const d = t.d, hh = hcTT(d);
          return `<div class="row click" data-tb="${E(t.id)}"><div class="name">${d.ma ? `<b>${E(d.ma)}</b> · ` : ""}${E(d.ten)} ${chip(d.tinhTrang || "Chưa cập nhật", TTC[d.tinhTrang] || "#94a3b8")}${isDup(t) ? " " + chipO("Trùng mã", "#c62828") : ""}${hh ? " " + chipO(d.hcLoai + ": " + hh.t, hh.c) : ""}${d.kcSo ? " " + chipO(d.kcSo === "M1" ? "Kiểm cân hằng ngày" : "Kiểm cân hằng tuần", "#4d7c0f") : ""}</div>
            <div class="kg">${E(d.namSD || "")}<small>${d.namSD ? "năm SD" : ""}</small></div>
            <div class="meta">${[d.nhom, d.xuatXu, d.thongSo, d.boPhan ? "BP " + d.boPhan : "", d.ghiChu].filter(Boolean).map(E).join(" · ")}</div></div>`; }).join("")
          : '<div class="empty"><b>Không có thiết bị nào khớp bộ lọc.</b></div>'}</div>`;
    } else if (vTB === "hc") {
      const L = HC.filter(t => !fHT || t.d.hcLoai === fHT).sort((a, c) => String(a.d.denHan || "9999").localeCompare(String(c.d.denHan || "9999")) || byMa(a, c));
      const sap = HC.filter(t => t.d.do && (() => { const x = hcTT(t.d); return x && x.n != null && x.n <= 60; })());
      const thieu = A.filter(t => t.d.do && !t.d.hcLoai && t.d.tinhTrang !== "Ngừng sử dụng");
      h += `<div class="tools"><select id="tbFH" style="width:auto"><option value="">Tất cả hình thức</option>${HCL.map(x => `<option${x === fHT ? " selected" : ""}>${x}</option>`).join("")}</select>
          <button class="btn" type="button" id="tbPrBM1">🖨 BM.01-QC-QT.01 (thiết bị đo)</button>${sap.length ? `<button class="btn" type="button" id="tbPrDX">🖨 Đề xuất HCKĐ (${sap.length} thiết bị đo đến hạn)</button>` : ""}<button class="btn" type="button" id="tbPrLich">🖨 Lịch kiểm định / hiệu chuẩn</button></div>
        <p class="note" style="margin:0 0 8px">Cảnh báo từ 60 ngày trước hạn. P.QA/QC lập đề xuất HCKĐ trước hạn ít nhất 15 ngày (QC-QT.01 bước 2) — in BM.01 các thiết bị đến hạn để TGĐ phê duyệt. Có kết quả: mở thiết bị → “Ghi kết quả … mới”.</p>
        ${thieu.length ? `<p class="note tb-warn">Thiết bị đo chưa có lịch hiệu chuẩn / kiểm định: ${thieu.map(t => `<a href="#" data-tb="${E(t.id)}">${E(tenTB(t))}</a>`).join(", ")}.</p>` : ""}
        <div class="dgx"><table><thead><tr><th>STT</th><th>Mã thiết bị</th><th>Tên thiết bị</th><th>Hình thức</th><th>Chu kỳ</th><th>Ngày gần nhất</th><th>Ngày đến hạn</th><th>Trạng thái</th><th>Đơn vị thực hiện</th><th>Số chứng thư</th><th>Ghi chú</th></tr></thead>
          <tbody>${L.length ? L.map((t, i) => { const d = t.d, x = hcTT(d); return `<tr class="click" data-tb="${E(t.id)}" style="cursor:pointer"><td>${i + 1}</td><td>${E(d.ma || "—")}${isDup(t) ? " " + chipO("trùng", "#c62828") : ""}</td><td>${E(d.ten)}</td><td>${E(d.hcLoai)}</td><td>${d.chuKy ? E(d.chuKy) + " tháng" : ""}</td><td>${D(d.hcNgay)}</td><td>${D(d.denHan)}</td><td>${chip(x.t, x.c)}</td><td>${E(d.donVi)}</td><td>${E(d.soCT)}</td><td>${E(d.hcGhiChu)}</td></tr>`; }).join("")
            : '<tr><td colspan="11" class="note">Chưa có thiết bị nào được theo dõi kiểm định / hiệu chuẩn.</td></tr>'}</tbody></table></div>`;
    } else {
      const L = nks().filter(n => (!fNKm || String(n.d.ngay).slice(0, 7) === fNKm) && (!fNKtb || n.d.tb === fNKtb)).sort((a, c) => String(c.d.ngay).localeCompare(String(a.d.ngay)) || String(c.luc).localeCompare(String(a.luc)));
      h += `<div class="tools">${ed ? '<button class="btn primary" type="button" id="tbNkNew">+ Ghi nhật ký</button>' : ""}
          <input type="month" id="tbNkM" value="${E(fNKm)}" style="width:auto" title="Tháng (trống = tất cả)">
          <select id="tbNkTB" style="width:auto;max-width:320px"><option value="">Tất cả thiết bị</option>${A.slice().sort(byMa).map(t => `<option value="${E(t.id)}"${t.id === fNKtb ? " selected" : ""}>${E(tenTB(t))}</option>`).join("")}</select>
          <button class="btn" type="button" id="tbPrNK">🖨 In nhật ký${fNKm ? " tháng " + fNKm.slice(5) + "/" + fNKm.slice(0, 4) : ""}</button></div>
        <p class="note" style="margin:0 0 8px">Ghi mỗi lần bảo trì, sửa chữa, vệ sinh, kiểm tra bất thường, kiểm định / hiệu chuẩn thành một dòng — tự vào hồ sơ của thiết bị.</p>
        <div class="list">${L.length ? L.map(nkRow).join("") : '<div class="empty"><b>Chưa có nhật ký nào khớp bộ lọc.</b></div>'}</div>`;
    }
    b.innerHTML = h;
    b.querySelectorAll(".seg [data-v]").forEach(x => x.onclick = () => { vTB = x.dataset.v; renderTB(); });
    b.querySelectorAll("[data-go]").forEach(x => x.onclick = () => { if (x.dataset.go === "khd") { vTB = "dm"; fTT = "KHD"; } else vTB = "hc"; renderTB(); });
    b.querySelectorAll("[data-tb]").forEach(x => x.onclick = ev => { ev.preventDefault(); const t = rec(x.dataset.tb); if (t) tbDlg(t); });
    b.querySelectorAll("[data-nk]").forEach(x => x.onclick = () => { const n = rec(x.dataset.nk); if (n) nkDlg(n); });
    const on = (id, ev, f) => { const el = document.getElementById(id); if (el) el[ev] = f; };
    on("tbNew", "onclick", () => tbDlg(null)); on("tbNkNew", "onclick", () => nkDlg(null, fNKtb ? { tb: fNKtb } : null));
    on("tbQ", "oninput", e => { q = e.target.value; clearTimeout(window.__tbQT); window.__tbQT = setTimeout(() => { renderTB().then(() => { const el = document.getElementById("tbQ"); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }); }, 250); });
    on("tbFN", "onchange", e => { fNhom = e.target.value; renderTB(); }); on("tbFT", "onchange", e => { fTT = e.target.value; renderTB(); });
    on("tbFH", "onchange", e => { fHT = e.target.value; renderTB(); }); on("tbNkM", "onchange", e => { fNKm = e.target.value; renderTB(); }); on("tbNkTB", "onchange", e => { fNKtb = e.target.value; renderTB(); });
    on("tbPrDM", "onclick", () => { const qq = q.trim().toLowerCase(); prDanhMuc(A.filter(t => (!fNhom || (t.d.nhom || "-") === fNhom) && (!fTT || (fTT === "KHD" ? KHD.includes(t.d.tinhTrang) : t.d.tinhTrang === fTT)) && (!qq || [t.d.ma, t.d.ten, t.d.thongSo, t.d.ghiChu, t.d.nhom].join(" ").toLowerCase().includes(qq)))); });
    on("tbPrKHD", "onclick", () => prKHD(A.filter(t => KHD.includes(t.d.tinhTrang))));
    on("tbPrBM1", "onclick", () => prBM01(HC.filter(t => t.d.do).sort(byStt), ""));
    on("tbPrDX", "onclick", () => { const L = HC.filter(t => t.d.do && (() => { const x = hcTT(t.d); return x && x.n != null && x.n <= 60; })()).sort((a, c) => String(a.d.denHan).localeCompare(String(c.d.denHan))); prBM01(L, "Đề xuất hiệu chuẩn, kiểm định các thiết bị đo đến hạn trước " + D(addD(today(), 60))); });
    on("tbPrLich", "onclick", () => prLich(HC.filter(t => !fHT || t.d.hcLoai === fHT).sort((a, c) => String(a.d.denHan || "9999").localeCompare(String(c.d.denHan || "9999")) || byMa(a, c))));
    on("tbPrNK", "onclick", () => prNK(nks().filter(n => (!fNKm || String(n.d.ngay).slice(0, 7) === fNKm) && (!fNKtb || n.d.tb === fNKtb)).sort((a, c) => String(a.d.ngay).localeCompare(String(c.d.ngay))), fNKm));
  };

  /* ---------------- hộp thoại thiết bị ---------------- */
  function tbDlg(t) {
    const ed = QC(), A = tbs(), d = t ? JSON.parse(JSON.stringify(t.d)) : { tinhTrang: "Đang sử dụng", htql: "Bảo trì", boPhan: "Sản xuất", stt: Math.max(0, ...A.map(x => +x.d.stt || 0)) + 1 };
    let autoDH = !d.denHan || d.denHan === addM(d.hcNgay, d.chuKy), dirty = false;
    const NK = t ? nks().filter(n => n.d.tb === t.id).sort((a, c) => String(c.d.ngay).localeCompare(String(a.d.ngay))) : [];
    const ro = ed ? "" : "disabled";
    const w = dlg(t ? E(tenTB(t)) : "Thêm thiết bị", `${t ? `<p class="note" style="margin:0 0 6px">Ghi bởi ${E(t.nguoi)}${t.sua && t.sua !== t.nguoi ? " · sửa cuối " + E(t.sua) : ""}${d.nguon ? " · " + E(d.nguon) : ""}</p>` : ""}
      ${t && isDup(t) ? `<p class="note tb-warn">⚠ Mã ${E(d.ma)} đang trùng với: ${E(A.filter(x => x.id !== t.id && maK(x) === maK(t)).map(x => x.d.ten).join("; "))} — sửa lại mã cho đúng tem trên thiết bị.</p>` : ""}
      <fieldset class="qa-fs" ${ro}><legend>Thông tin thiết bị</legend><div class="two qa-g">
        ${fld("Mã thiết bị", inp("ma", d.ma, 'placeholder="VD: AHK-64, QC-TB-08"'))}${fld("Năm sử dụng", inp("namSD", d.namSD, 'inputmode="numeric"'))}
        ${fld("Tên thiết bị", inp("ten", d.ten), true)}
        ${fld("Nhóm / khu vực", inp("nhom", d.nhom, 'list="tbNhom"') + dl("tbNhom", A.map(x => x.d.nhom)))}${fld("Xuất xứ", inp("xuatXu", d.xuatXu, 'list="tbXX"') + dl("tbXX", A.map(x => x.d.xuatXu)))}
        ${fld("Thông số chính / phạm vi đo", inp("thongSo", d.thongSo), true)}
        ${fld("Hình thức quản lý", inp("htql", d.htql, 'list="tbHT"') + dl("tbHT", HTQL.concat(A.map(x => x.d.htql))))}${fld("Bộ phận quản lý / sử dụng", inp("boPhan", d.boPhan, 'list="tbBP"') + dl("tbBP", BOPHAN.concat(A.map(x => x.d.boPhan))))}
        ${fld("Tình trạng", sel("tinhTrang", d.tinhTrang, TT, false))}${fld("Số chế tạo", inp("soCheTao", d.soCheTao))}
        ${fld("Mục đích sử dụng", inp("mucDich", d.mucDich), true)}
        ${fld("Ghi chú / hiện trạng", `<textarea data-k="ghiChu" rows="2">${E(d.ghiChu || "")}</textarea>`, true)}
        <label class="qa-chk" style="grid-column:1/-1"><input type="checkbox" data-k="do"${d.do ? " checked" : ""}> Thiết bị đo — có trên BM.01-QC-QT.01 (bảng theo dõi hiệu chuẩn kiểm định thiết bị đo)</label>
      </div></fieldset>
      <fieldset class="qa-fs" ${ro}><legend>Kiểm định / hiệu chuẩn</legend><div class="two qa-g">
        ${fld("Hình thức", sel("hcLoai", d.hcLoai, HCL, "— không theo dõi —"))}${fld("Chu kỳ (tháng)", inp("chuKy", d.chuKy, 'type="number" min="1" step="1"'))}
        ${fld("Ngày thực hiện gần nhất", inp("hcNgay", d.hcNgay, 'type="date"'))}${fld("Ngày đến hạn", inp("denHan", d.denHan, 'type="date"'))}
        ${fld("Đơn vị thực hiện", inp("donVi", d.donVi, 'list="tbDV"') + dl("tbDV", A.map(x => x.d.donVi)))}${fld("Số chứng thư", inp("soCT", d.soCT))}
        ${fld("Ghi chú kiểm định / hiệu chuẩn", inp("hcGhiChu", d.hcGhiChu), true)}
        ${fld("Link chứng nhận (Drive)", inp("hcLink", d.hcLink, 'type="url" placeholder="https://drive.google.com/…"'), true)}
        <p class="note" id="tbHcTT" style="grid-column:1/-1;margin:0">${hcLine(d)}${d.hcLink ? ` · <a href="${E(d.hcLink)}" target="_blank" rel="noopener">mở chứng nhận</a>` : ""}</p>
        ${t && ed && t.d.hcLoai ? `<div style="grid-column:1/-1"><button type="button" class="btn" id="tbHcNew">✓ Ghi kết quả ${E(t.d.hcLoai.toLowerCase())} mới</button></div>` : ""}
      </div></fieldset>
      <fieldset class="qa-fs" ${ro}><legend>Kiểm tra nội bộ (QC-HD.01)</legend><div class="two qa-g">
        ${fld("Sổ kiểm tra cân (BM.02-QC-QT.01)", `<select data-k="kcSo"><option value="">Không kiểm tra nội bộ</option><option value="M1"${d.kcSo === "M1" ? " selected" : ""}>Hằng ngày — cân SX ≤3 kg (quả cân M1)</option><option value="F1"${d.kcSo === "F1" ? " selected" : ""}>Hằng tuần — cân kỹ thuật PTN (quả cân F1)</option></select>`)}
        ${fld("Độ đọc của cân", `<select data-k="kcDoc">${[["0.1", "0,1 g (1 số lẻ)"], ["0.01", "0,01 g (2 số lẻ)"], ["0.001", "0,001 g (3 số lẻ)"]].map(([v, x]) => `<option value="${v}"${String(d.kcDoc || (d.kcSo === "F1" ? "0.01" : "0.1")) === v ? " selected" : ""}>${x}</option>`).join("")}</select>`)}
        <p class="note" id="tbKcGh" style="grid-column:1/-1;margin:0">${kcLine(d)}</p>
      </div></fieldset>
      ${t ? `<h3 style="margin:12px 0 4px">Hồ sơ thiết bị — nhật ký (${NK.length})</h3>
        <div class="list">${NK.length ? NK.map(nkRow).join("") : '<div class="empty" style="padding:10px">Chưa có nhật ký bảo trì, sửa chữa hay kiểm định.</div>'}</div>
        <div class="tools" style="margin-top:6px">${ed ? '<button class="btn" type="button" id="tbNkAdd">+ Ghi nhật ký</button>' : ""}<button class="btn" type="button" id="tbHoSo">🖨 In hồ sơ thiết bị</button></div>` : ""}
      <div class="actions">${t && (TP() || (ed && t.nguoi === S.me.ten)) ? '<button class="btn danger" type="button" data-a="del">Xoá</button>' : ""}<span style="flex:1"></span><button class="btn" type="button" data-a="x">Đóng</button>${ed ? '<button class="btn primary" type="button" data-a="sv">Lưu</button>' : ""}</div>`, true, "tb-dev");
    const bx = w.querySelector(".cfm-box"), g = k => bx.querySelector(`[data-k="${k}"]`);
    const pull = () => bx.querySelectorAll("[data-k]").forEach(el => { const k = el.dataset.k; d[k] = el.type === "checkbox" ? el.checked : el.value.trim(); });
    const upd = () => { const a = bx.querySelector("#tbHcTT"); if (a) a.innerHTML = hcLine(d); const k = bx.querySelector("#tbKcGh"); if (k) k.textContent = kcLine(d); };
    bx.addEventListener("input", e => { dirty = true; if (e.target === g("denHan")) autoDH = false; pull();
      if ((e.target === g("hcNgay") || e.target === g("chuKy")) && autoDH) { const v = addM(d.hcNgay, d.chuKy); if (v) { g("denHan").value = v; d.denHan = v; } } upd(); });
    bx.addEventListener("change", e => { dirty = true; pull(); if (e.target === g("kcSo") && d.kcSo === "F1" && (!d.kcDoc || d.kcDoc === "0.1")) { g("kcDoc").value = "0.01"; d.kcDoc = "0.01"; } upd(); });
    bx.querySelector('[data-a="x"]').onclick = () => w.remove();
    bx.querySelectorAll("[data-nk]").forEach(x => x.onclick = () => { const n = rec(x.dataset.nk); if (n) nkDlg(n, null, () => { w.remove(); const tt = rec(t.id); if (tt) tbDlg(tt); }); });
    const hn = bx.querySelector("#tbHcNew"); if (hn) hn.onclick = () => { if (dirty) { toast("Bấm Lưu thông tin thiết bị trước, rồi ghi kết quả."); return; } hcDlg(t, () => { w.remove(); const tt = rec(t.id); if (tt) tbDlg(tt); }); };
    const na = bx.querySelector("#tbNkAdd"); if (na) na.onclick = () => nkDlg(null, { tb: t.id }, () => { w.remove(); const tt = rec(t.id); if (tt) tbDlg(tt); });
    const hs = bx.querySelector("#tbHoSo"); if (hs) hs.onclick = () => prHoSo(t);
    const dv = bx.querySelector('[data-a="del"]'); if (dv) dv.onclick = async () => { if (!await askConfirm(["Xoá thiết bị " + tenTB(t) + " khỏi danh mục?" + (NK.length ? " (" + NK.length + " dòng nhật ký vẫn giữ lại)" : "")])) return;
      try { await api("webTBDel", S.auth, t.id, false); toast("Đã xoá thiết bị"); w.remove(); rer(); } catch (e) { toast(e.message); } };
    const sv = bx.querySelector('[data-a="sv"]'); if (sv) sv.onclick = async () => { pull(); if (!d.ten) { toast("Ghi tên thiết bị."); return; }
      if (d.hcLoai && d.hcNgay && d.chuKy && !d.denHan) d.denHan = addM(d.hcNgay, d.chuKy);
      if (d.chuKy !== "" && d.chuKy != null) d.chuKy = +d.chuKy || ""; d.kcDoc = d.kcSo ? +d.kcDoc || (d.kcSo === "F1" ? 0.01 : 0.1) : "";
      sv.disabled = true; try { await save({ id: t && t.id, loai: "TB", d }, t ? "Đã lưu thiết bị" : "Đã thêm thiết bị"); w.remove(); rer(); } catch (e) { sv.disabled = false; toast(e.message); } };
  }

  /* ---------------- ghi kết quả kiểm định / hiệu chuẩn mới (QC-QT.01 bước 4–5) ---------------- */
  function hcDlg(t, after) {
    const d0 = t.d, f = { kq: "Đạt" }; let autoDH = true;
    const w = dlg(`Ghi kết quả ${E(d0.hcLoai.toLowerCase())} — ${E(tenTB(t))}`, `<fieldset class="qa-fs"><div class="two qa-g">
      ${fld("Ngày thực hiện", inp("ngay", today(), 'type="date"'))}${fld("Đơn vị thực hiện", inp("donVi", d0.donVi, 'list="tbDV2"') + dl("tbDV2", tbs().map(x => x.d.donVi)))}
      ${fld("Số chứng thư / phiếu kết quả", inp("soCT", ""))}${fld("Ngày đến hạn mới", inp("denHan", addM(today(), d0.chuKy), 'type="date"'))}
      <div style="grid-column:1/-1"><b>Kết quả</b> <span class="qa-kl"><button type="button" class="btn small ok" data-kq="Đạt">Đạt</button> <button type="button" class="btn small" data-kq="Không đạt">Không đạt</button></span></div>
      <div id="tbKqD" style="grid-column:1/-1">${KHD.includes(d0.tinhTrang) ? `<label class="qa-chk"><input type="checkbox" data-k="suDung" checked> Đưa vào sử dụng lại (đang “${E(d0.tinhTrang)}” → Đang sử dụng)</label>` : '<span class="note">Kết quả đạt: thiết bị tiếp tục sử dụng (QC-QT.01 bước 5).</span>'}</div>
      <div id="tbKqK" style="grid-column:1/-1" hidden>${fld("Xử lý thiết bị không đạt (QC-QT.01 bước 5)", sel("xuLy", "", ["Cách ly – chờ sửa chữa", "Sửa chữa", "Loại bỏ"], "— chọn —"), true)}</div>
      ${fld("Link chứng nhận (Drive)", inp("hcLink", "", 'type="url" placeholder="https://drive.google.com/…"'), true)}
      ${fld("Ghi chú", inp("ghiChu", ""), true)}
      <p class="note" style="grid-column:1/-1;margin:0">Lưu: thêm một dòng vào hồ sơ thiết bị (nhật ký) và cập nhật lịch: ngày gần nhất, ngày đến hạn, đơn vị, số chứng thư.</p>
      </div></fieldset><div class="actions"><span style="flex:1"></span><button class="btn" type="button" data-a="x">Đóng</button><button class="btn primary" type="button" data-a="sv">Lưu kết quả</button></div>`);
    const bx = w.querySelector(".cfm-box"), g = k => bx.querySelector(`[data-k="${k}"]`);
    bx.addEventListener("input", e => { if (e.target === g("denHan")) autoDH = false; if (e.target === g("ngay") && autoDH) g("denHan").value = addM(g("ngay").value, d0.chuKy) || g("denHan").value; });
    bx.querySelectorAll("[data-kq]").forEach(b => b.onclick = () => { f.kq = b.dataset.kq; bx.querySelectorAll("[data-kq]").forEach(x => x.className = "btn small" + (x.dataset.kq === f.kq ? (f.kq === "Đạt" ? " ok" : " bad") : "")); bx.querySelector("#tbKqD").hidden = f.kq !== "Đạt"; bx.querySelector("#tbKqK").hidden = f.kq === "Đạt"; });
    bx.querySelector('[data-a="x"]').onclick = () => w.remove();
    bx.querySelector('[data-a="sv"]').onclick = async ev => {
      const v = k => g(k) ? (g(k).type === "checkbox" ? g(k).checked : g(k).value.trim()) : "", ngay = v("ngay"), denHan = v("denHan"), soCT = v("soCT"), donVi = v("donVi"), xuLy = v("xuLy");
      if (!isYmd(ngay)) { toast("Ghi ngày thực hiện."); return; }
      if (f.kq === "Đạt" && !isYmd(denHan)) { toast("Ghi ngày đến hạn mới."); return; }
      if (f.kq !== "Đạt" && !xuLy) { toast("Chọn cách xử lý thiết bị không đạt."); return; }
      ev.target.disabled = true;
      try {
        const nd = Object.assign({}, t.d, { hcNgay: ngay, donVi, soCT, hcKQ: f.kq }); if (v("hcLink")) nd.hcLink = v("hcLink");
        if (f.kq === "Đạt") { nd.denHan = denHan; if (v("suDung")) nd.tinhTrang = "Đang sử dụng"; } else nd.tinhTrang = xuLy === "Loại bỏ" ? "Ngừng sử dụng" : "Chờ sửa";
        await save({ loai: "NK", d: { tb: t.id, ma: t.d.ma || "", ten: t.d.ten, ngay, loaiCV: t.d.hcLoai, noiDung: t.d.hcLoai + (soCT ? " · chứng thư " + soCT : ""), ketQua: f.kq === "Đạt" ? "Đạt; hiệu lực đến " + D(denHan) : "Không đạt — " + xuLy, nguoiTH: donVi, ngayTiep: f.kq === "Đạt" ? denHan : "", quyetDinh: f.kq === "Đạt" ? "Tiếp tục sử dụng" : xuLy, kyTen: S.me.ten, ghiChu: v("ghiChu") } });
        await save({ id: t.id, loai: "TB", d: nd }, "Đã ghi kết quả " + t.d.hcLoai.toLowerCase());
        await load(); w.remove(); if (after) after(); rer();
      } catch (e) { ev.target.disabled = false; toast(e.message); }
    };
  }

  /* ---------------- nhật ký bảo trì / sửa chữa ---------------- */
  function nkDlg(n, seed, after) {
    const ed = QC(), d = n ? JSON.parse(JSON.stringify(n.d)) : Object.assign({ ngay: today(), kyTen: S.me.ten }, seed || {}), A = tbs().sort(byMa);
    const w = dlg(n ? "Nhật ký thiết bị" : "Ghi nhật ký bảo trì / sửa chữa", `<fieldset class="qa-fs" ${ed ? "" : "disabled"}><div class="two qa-g">
      ${fld("Thiết bị", `<select data-k="tb"><option value="">— chọn thiết bị —</option>${A.map(t => `<option value="${E(t.id)}"${t.id === d.tb ? " selected" : ""}>${E(tenTB(t))}</option>`).join("")}</select>`, true)}
      ${fld("Ngày", inp("ngay", d.ngay, 'type="date"'))}${fld("Loại công việc", inp("loaiCV", d.loaiCV, 'list="tbLCV"') + dl("tbLCV", LCV))}
      ${fld("Nội dung công việc", `<textarea data-k="noiDung" rows="2">${E(d.noiDung || "")}</textarea>`, true)}
      ${fld("Kết quả", inp("ketQua", d.ketQua))}${fld("Người / đơn vị thực hiện", inp("nguoiTH", d.nguoiTH, 'list="tbNTH"') + dl("tbNTH", nks().map(x => x.d.nguoiTH).concat(USERS)))}
      ${fld("Kiểm tra — quyết định", inp("quyetDinh", d.quyetDinh, 'list="tbQD"') + dl("tbQD", ["Tiếp tục vận hành", "Tiếp tục sử dụng", "Tạm ngưng", "Chờ sửa", "Ngừng sử dụng"]))}${fld("Kiểm tra — ký tên", inp("kyTen", d.kyTen, 'list="tbKy"') + dl("tbKy", USERS))}
      ${fld("Ngày dự kiến tiếp theo", inp("ngayTiep", d.ngayTiep, 'type="date"'))}${fld("Tình trạng thiết bị sau công việc", sel("ttSau", "", TT, "— không đổi —"))}
      ${fld("Ghi chú", inp("ghiChu", d.ghiChu), true)}
      </div></fieldset>${d.nguon ? `<p class="note">Nguồn: ${E(d.nguon)}</p>` : ""}${n ? `<p class="note">Ghi bởi ${E(n.nguoi)}${n.sua && n.sua !== n.nguoi ? " · sửa cuối " + E(n.sua) : ""}</p>` : ""}
      <div class="actions">${n && (TP() || (ed && n.nguoi === S.me.ten)) ? '<button class="btn danger" type="button" data-a="del">Xoá</button>' : ""}<span style="flex:1"></span><button class="btn" type="button" data-a="x">Đóng</button>${ed ? '<button class="btn primary" type="button" data-a="sv">Lưu</button>' : ""}</div>`);
    const bx = w.querySelector(".cfm-box"), pull = () => bx.querySelectorAll("[data-k]").forEach(el => d[el.dataset.k] = el.value.trim());
    bx.querySelector('[data-a="x"]').onclick = () => w.remove();
    const done = async () => { await load(); w.remove(); if (after) after(); rer(); };
    const dv = bx.querySelector('[data-a="del"]'); if (dv) dv.onclick = async () => { if (!await askConfirm(["Xoá dòng nhật ký này?"])) return; try { await api("webTBDel", S.auth, n.id, false); toast("Đã xoá"); await done(); } catch (e) { toast(e.message); } };
    const sv = bx.querySelector('[data-a="sv"]'); if (sv) sv.onclick = async () => { pull(); const t = rec(d.tb); if (!t) { toast("Chọn thiết bị."); return; } if (!isYmd(d.ngay)) { toast("Ghi ngày."); return; } if (!d.noiDung && !d.loaiCV) { toast("Ghi nội dung công việc."); return; }
      const ttSau = d.ttSau; delete d.ttSau; d.ma = t.d.ma || ""; d.ten = t.d.ten; sv.disabled = true;
      try { await save({ id: n && n.id, loai: "NK", d }, "Đã lưu nhật ký");
        if (ttSau && ttSau !== t.d.tinhTrang) await save({ id: t.id, loai: "TB", d: Object.assign({}, t.d, { tinhTrang: ttSau }) }, "Đã lưu nhật ký · " + (t.d.ma || t.d.ten) + " → " + ttSau);
        await done(); } catch (e) { sv.disabled = false; toast(e.message); } };
  }

  /* ================= KIỂM TRA CÂN (BM.02-QC-QT.01) ================= */
  let vKC = "M1", fKCm = "";
  const kcRow = k => { const d = k.d, K = ketQuaTB(d), bad = K.filter(x => x.bad);
    return `<div class="row click" data-kc="${E(k.id)}"><div class="name">${THU[dow(d.ngay)]} ${D(d.ngay)} ${kqChip(d)}</div><div class="kg">${d.khongSX ? "" : K.length}<small>${d.khongSX ? "" : "cân"}</small></div>
      <div class="meta">${d.khongSX ? "Không sản xuất — không kiểm tra cân" : E(K.map(x => x.ma || x.ten).join(", "))}${d.nguoi ? " · " + E(d.nguoi) : ""}${bad.length ? ` · <b style="color:#c62828">không đạt: ${E(bad.map(x => x.ma || x.ten).join(", "))}</b>` : ""}${d.tamNgung && Object.values(d.tamNgung).some(Boolean) ? " · đã dán nhãn tạm ngưng" : ""}${d.ghiChu ? " · " + E(d.ghiChu) : ""}${d.nguon ? " · " + E(d.nguon) : ""}</div></div>`; };
  window.renderKC = async function () {
    const b = document.getElementById("kcBox"); if (!b) return;
    if (!S.me) { b.innerHTML = '<div class="empty">Vui lòng đăng nhập.</div>'; return; }
    if (!fKCm) fKCm = today().slice(0, 7);
    if (!b.dataset.ok) b.innerHTML = '<div class="empty"><span class="ldg">Đang tải sổ kiểm tra cân…</span></div>';
    try { await load(); } catch (e) { b.innerHTML = `<div class="empty">${E(e.message)}</div>`; return; }
    b.dataset.ok = 1;
    const S0 = KC[vKC], td = today(), sc = scales(vKC), off = tbs().filter(t => t.d.kcSo === vKC && t.d.tinhTrang !== "Đang sử dụng").sort(byMa);
    const L = kcs().filter(k => k.d.so === vKC && (!fKCm || String(k.d.ngay).slice(0, 7) === fKCm)).sort((a, c) => String(c.d.ngay).localeCompare(String(a.d.ngay)));
    const kToday = kcs().find(x => x.d.so === vKC && x.d.ngay === td);
    let st;
    if (vKC === "M1") { const dw = dow(td); st = `${THU[dw]} ${D(td)}: ${kToday ? (kToday.d.khongSX ? "<b>không sản xuất</b>" : "đã kiểm tra" + (kToday.d.nguoi ? " — " + E(kToday.d.nguoi) : "") + " " + kqChip(kToday.d)) : dw === 0 ? "chủ nhật" : '<b style="color:#d97706">chưa kiểm tra cân</b>'}`; }
    else { const ws = wkStart(td), we = addD(ws, 6), k = kcs().filter(x => x.d.so === "F1" && x.d.ngay >= ws && x.d.ngay <= we).sort((a, c) => String(c.d.ngay).localeCompare(String(a.d.ngay)))[0];
      st = `Tuần ${DM(ws)} – ${D(we)}: ${k ? "đã kiểm tra ngày " + D(k.d.ngay) + (k.d.nguoi ? " — " + E(k.d.nguoi) : "") + " " + kqChip(k.d) : '<b style="color:#d97706">chưa kiểm tra cân</b>'}`; }
    b.innerHTML = `<div class="seg subseg" style="margin-bottom:10px">${[["M1", "Cân SX ≤3 kg — hằng ngày (quả cân M1)"], ["F1", "Cân kỹ thuật PTN — hằng tuần (quả cân F1)"]].map(([k, t]) => `<button type="button" data-v="${k}" aria-pressed="${k === vKC}">${t}</button>`).join("")}</div>
      <p style="margin:0 0 8px;font-size:15px">${st}</p>
      <div class="tools">${QC() ? `<button class="btn primary" type="button" id="kcNew">${kToday && !kToday.d.khongSX ? "Mở sổ hôm nay" : "+ Kiểm tra cân hôm nay"}</button>${vKC === "M1" && !kToday ? '<button class="btn" type="button" id="kcOff">Hôm nay không sản xuất</button>' : ""}` : ""}
        <input type="month" id="kcM" value="${E(fKCm)}" style="width:auto" title="Tháng (trống = tất cả)"><button class="btn" type="button" id="kcPr">🖨 In BM.02${fKCm ? " tháng " + fKCm.slice(5) + "/" + fKCm.slice(0, 4) : ""}</button></div>
      <p class="note" style="margin:0 0 8px">${E(S0.luat)} Cân trong sổ: ${sc.length ? E(sc.map(t => t.d.ma || t.d.ten).join(", ")) : "<b>chưa có cân nào</b>"}${off.length ? " · không kiểm (không ở trạng thái Đang sử dụng): " + E(off.map(t => (t.d.ma || t.d.ten) + " – " + t.d.tinhTrang).join(", ")) : ""}. Đổi danh sách: Thiết bị nhà xưởng → mở thiết bị → Kiểm tra nội bộ.</p>
      <div class="list">${L.length ? L.map(kcRow).join("") : `<div class="empty"><b>Chưa có sổ kiểm tra cân${fKCm ? " trong tháng " + fKCm.slice(5) + "/" + fKCm.slice(0, 4) : ""}.</b></div>`}</div>`;
    b.querySelectorAll(".seg [data-v]").forEach(x => x.onclick = () => { vKC = x.dataset.v; renderKC(); });
    b.querySelectorAll("[data-kc]").forEach(x => x.onclick = () => { const k = rec(x.dataset.kc); if (k) kcDlg(k); });
    const on = (id, ev, f) => { const el = document.getElementById(id); if (el) el[ev] = f; };
    on("kcNew", "onclick", () => kToday && !kToday.d.khongSX ? kcDlg(kToday) : kcDlg(null, vKC, td, kToday));
    on("kcOff", "onclick", async e => { e.target.disabled = true; try { await save({ loai: "KC", d: { ngay: td, so: "M1", khongSX: true, nguoi: S.me.ten, rows: [], ketQua: "Không SX" } }, "Đã ghi: hôm nay không sản xuất"); rer(); } catch (x) { e.target.disabled = false; toast(x.message); } });
    on("kcM", "onchange", e => { fKCm = e.target.value; renderKC(); });
    on("kcPr", "onclick", () => prKC(L.filter(k => !k.d.khongSX).sort((a, c) => String(a.d.ngay).localeCompare(String(c.d.ngay)))));
  };

  function kcDlg(r, so0, ngay0, reuse) { /* reuse: bản ghi "không sản xuất" cùng ngày → ghi đè thành sổ kiểm tra */
    const ed = QC(), so = r ? r.d.so : so0, S0 = KC[so];
    if (r && r.d.khongSX) {
      const w = dlg("Kiểm tra cân — " + THU[dow(r.d.ngay)] + " " + D(r.d.ngay), `<p>Đã ghi <b>không sản xuất</b>${r.nguoi ? " (" + E(r.nguoi) + ")" : ""} — ngày này không kiểm tra cân SX.</p>
        <div class="actions">${TP() || (ed && r.nguoi === S.me.ten) ? '<button class="btn danger" type="button" data-a="del">Bỏ ghi nhận</button>' : ""}<span style="flex:1"></span><button class="btn" type="button" data-a="x">Đóng</button></div>`);
      const bx = w.querySelector(".cfm-box"); bx.querySelector('[data-a="x"]').onclick = () => w.remove();
      const dv = bx.querySelector('[data-a="del"]'); if (dv) dv.onclick = async () => { try { await api("webTBDel", S.auth, r.id, false); toast("Đã bỏ ghi nhận"); w.remove(); rer(); } catch (e) { toast(e.message); } };
      return;
    }
    const d = r ? JSON.parse(JSON.stringify(r.d)) : { ngay: ngay0 || today(), so, nguoi: S.me.ten, rows: scales(so).flatMap(t => rowsFor(so, t, 0)) };
    if (!d.tamNgung) d.tamNgung = {};
    const dis = ed ? "" : "disabled";
    const tblH = () => { const seen = {}; let h = "";
      d.rows.forEach((x, i) => { const k = gkey(x), first = !seen[k], span = d.rows.filter(y => gkey(y) === k).length, c = calc(x); seen[k] = 1;
        h += `<tr>${first ? `<td rowspan="${span}" class="knm">${E(x.ten)}<small class="kma2">${E(x.ma)}</small>${x.lai ? `<br><small class="note">kiểm tra lại${x.lai > 1 ? " lần " + x.lai : ""} sau hiệu chỉnh</small>` : ""}${ed && !x.lai ? ` <button type="button" class="btn small" data-rm="${E(x.tb || x.ma)}" title="Bỏ cân này khỏi sổ (không dùng trong ngày)">×</button>` : ""}</td><td rowspan="${span}" class="kma">${E(x.ma)}</td>` : ""}
          <td class="r">${fx(x.M, x.dp)}</td><td><input class="kcv" data-i="${i}" data-f="m1" value="${E(x.m1)}" inputmode="decimal" autocomplete="off" ${dis}></td><td><input class="kcv" data-i="${i}" data-f="m2" value="${E(x.m2)}" inputmode="decimal" autocomplete="off" ${dis}></td>
          <td class="r klc" id="kcL${i}">${c ? lechTxt(c.lech, x.dp) : ""}</td><td class="r note kgh">±${vn(ghOf(x))}</td><td id="kcD${i}" title="${c ? "C1 = " + vn(+c.c1.toFixed(4)) + " · C2 = " + vn(+c.c2.toFixed(4)) : ""}">${c ? (c.dat ? '<b style="color:#2e7d32">Đạt</b>' : '<b style="color:#c62828">Không đạt</b>') : ""}</td></tr>`; });
      return `<div class="dgx"><table class="tb-kc"><thead><tr><th>Tên thiết bị</th><th class="kma">Mã</th><th>Quả cân chuẩn (g)</th><th>Lần 1 (g)</th><th>Lần 2 (g)</th><th class="klc">Độ lệch</th><th class="kgh">Giới hạn</th><th>Đánh giá</th></tr></thead><tbody>${h || '<tr><td colspan="8" class="note">Chưa có cân nào — thêm cân bên dưới.</td></tr>'}</tbody></table></div>`; };
    const sumH = () => { const K = ketQuaTB(d), bad = K.filter(x => x.bad), miss = d.rows.filter(x => !calc(x)).length; if (!d.rows.length) return "";
      let h = miss ? `<p class="note" style="margin:4px 0">Còn ${miss} dòng chưa ghi đủ 2 lần cân.</p>` : "";
      if (!bad.length && !miss) h += '<p style="margin:6px 0;color:#2e7d32"><b>✓ Tất cả cân đạt</b> — đưa vào sử dụng.</p>';
      if (bad.length) h += `<div class="tb-warn" style="margin-top:6px"><b>Cân không đạt — hành động điều chỉnh (QC-HD.01):</b> ngừng sử dụng cân, ghi nhận và báo người phụ trách; kiểm tra điều kiện đặt cân, vệ sinh, hiệu chỉnh theo model rồi kiểm tra lại. Chỉ dùng lại khi kiểm tra lại đạt; nếu vẫn không đạt: dán nhãn tạm ngưng sử dụng, chuyển sửa chữa / hiệu chuẩn bên ngoài.
        ${bad.map(x => `<div class="tb-bad"><b>${E(x.ma || "")}</b> ${E(x.ten)} — ${x.lai ? "kiểm tra lại" + (x.lai > 1 ? " lần " + x.lai : "") + " vẫn không đạt" : "không đạt"}${ed ? ` <button type="button" class="btn small" data-lai="${E(x.k)}">+ Kiểm tra lại sau hiệu chỉnh</button> <label class="qa-chk" style="display:inline-flex;margin:0"><input type="checkbox" data-tn="${E(x.k)}"${d.tamNgung[x.k] ? " checked" : ""}> Dán nhãn tạm ngưng (chuyển thiết bị sang Tạm ngưng)</label>` : ""}</div>`).join("")}</div>`;
      return h; };
    const extra = () => tbs().filter(t => (t.d.kcSo === so || (/^cân/i.test(t.d.ten) && t.d.nhom === "Đo lường")) && !d.rows.some(x => x.tb === t.id)).sort(byMa);
    const w = dlg(`Sổ kiểm tra thiết bị đo (BM.02-QC-QT.01) — ${S0.ten}`, `<div class="two qa-g">
        ${fld("Ngày", `<input data-h="ngay" type="date" value="${E(d.ngay)}" ${dis}>`)}${fld(S0.nv, sel("nguoi", d.nguoi, USERS.length ? USERS : [S.me.ten], "— chọn —").replace('data-k="nguoi"', `data-h="nguoi" ${dis}`))}</div>
      <p class="note" style="margin:6px 0">PP kiểm tra: dùng quả cân, vật cân chuẩn để kiểm tra · thiết bị cân chuẩn: ${E(S0.chu)}. ${E(S0.luat)}</p>
      <div id="kcTbl">${tblH()}</div>
      ${ed ? `<div class="tools" style="margin-top:6px"><select id="kcAdd" style="width:auto;max-width:360px"><option value="">+ Thêm cân vào sổ…</option>${extra().map(t => `<option value="${E(t.id)}">${E(tenTB(t))}${t.d.tinhTrang !== "Đang sử dụng" ? " (" + E(t.d.tinhTrang) + ")" : ""}</option>`).join("")}</select></div>` : ""}
      <div id="kcSum">${sumH()}</div>
      ${fld("Ghi chú", `<input data-h="ghiChu" value="${E(d.ghiChu || "")}" ${dis}>`, true)}
      ${r ? `<p class="note">Ghi bởi ${E(r.nguoi)}${r.sua && r.sua !== r.nguoi ? " · sửa cuối " + E(r.sua) : ""}${d.nguon ? " · " + E(d.nguon) : ""}</p>` : ""}
      <div class="actions">${r && (TP() || (ed && r.nguoi === S.me.ten)) ? '<button class="btn danger" type="button" data-a="del">Xoá</button>' : ""}<span style="flex:1"></span>${r ? '<button class="btn" type="button" data-a="pr">🖨 In</button>' : ""}<button class="btn" type="button" data-a="x">Đóng</button>${ed ? '<button class="btn primary" type="button" data-a="sv">Lưu</button>' : ""}</div>`, true);
    const bx = w.querySelector(".cfm-box");
    const reTbl = () => { bx.querySelector("#kcTbl").innerHTML = tblH(); bx.querySelector("#kcSum").innerHTML = sumH(); const a = bx.querySelector("#kcAdd"); if (a) a.innerHTML = `<option value="">+ Thêm cân vào sổ…</option>${extra().map(t => `<option value="${E(t.id)}">${E(tenTB(t))}${t.d.tinhTrang !== "Đang sử dụng" ? " (" + E(t.d.tinhTrang) + ")" : ""}</option>`).join("")}`; };
    bx.addEventListener("input", e => { const el = e.target; if (!el.classList.contains("kcv")) return; const i = +el.dataset.i, x = d.rows[i]; if (!x) return; x[el.dataset.f] = el.value.trim();
      const c = calc(x), L = bx.querySelector("#kcL" + i), Dd = bx.querySelector("#kcD" + i);
      if (L) L.textContent = c ? lechTxt(c.lech, x.dp) : ""; if (Dd) { Dd.innerHTML = c ? (c.dat ? '<b style="color:#2e7d32">Đạt</b>' : '<b style="color:#c62828">Không đạt</b>') : ""; Dd.title = c ? "C1 = " + vn(+c.c1.toFixed(4)) + " · C2 = " + vn(+c.c2.toFixed(4)) : ""; }
      bx.querySelector("#kcSum").innerHTML = sumH(); });
    bx.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.classList.contains("kcv")) { e.preventDefault(); const I = [...bx.querySelectorAll(".kcv")], j = I.indexOf(e.target); if (I[j + 1]) I[j + 1].focus(); } });
    bx.addEventListener("click", e => { const t = e.target;
      if (t.dataset.rm) { d.rows = d.rows.filter(x => (x.tb || x.ma) !== t.dataset.rm); delete d.tamNgung[t.dataset.rm]; reTbl(); }
      else if (t.dataset.lai) { const k = t.dataset.lai, dev = rec(k), L = d.rows.filter(x => (x.tb || x.ma) === k), mx = Math.max(...L.map(x => +x.lai || 0)), last = d.rows.lastIndexOf(L[L.length - 1]);
        const nr = dev ? rowsFor(so, dev, mx + 1) : KC[so].qua.map(M => Object.assign({}, L.find(x => +x.M === M) || L[0], { M, m1: "", m2: "", lai: mx + 1 }));
        nr.forEach(x => { if (!dev) x.gh = (L.find(y => +y.M === +x.M) || L[0]).gh; }); d.rows.splice(last + 1, 0, ...nr); reTbl(); const f = bx.querySelector(`.kcv[data-i="${last + 1}"]`); if (f) f.focus(); }
      else if (t.dataset.tn) d.tamNgung[t.dataset.tn] = t.checked; });
    const add = bx.querySelector("#kcAdd"); if (add) add.onchange = () => { const dev = rec(add.value); if (dev) { d.rows.push(...rowsFor(so, dev, 0)); reTbl(); } };
    bx.querySelector('[data-a="x"]').onclick = () => w.remove();
    const pb = bx.querySelector('[data-a="pr"]'); if (pb) pb.onclick = () => prKC([r]);
    const dv = bx.querySelector('[data-a="del"]'); if (dv) dv.onclick = async () => { if (!await askConfirm(["Xoá sổ kiểm tra cân ngày " + D(r.d.ngay) + "?"])) return; try { await api("webTBDel", S.auth, r.id, false); toast("Đã xoá"); w.remove(); rer(); } catch (e) { toast(e.message); } };
    const sv = bx.querySelector('[data-a="sv"]'); if (sv) sv.onclick = async () => {
      d.ngay = bx.querySelector('[data-h="ngay"]').value; d.nguoi = bx.querySelector('[data-h="nguoi"]').value; d.ghiChu = bx.querySelector('[data-h="ghiChu"]').value.trim();
      if (!isYmd(d.ngay)) { toast("Ghi ngày kiểm tra."); return; } if (!d.rows.length) { toast("Chưa có cân nào trong sổ."); return; }
      const miss = d.rows.filter(x => !calc(x)).length; if (miss && !await askConfirm([`Còn ${miss} dòng chưa ghi đủ 2 lần cân. Vẫn lưu?`])) return;
      const K = ketQuaTB(d); d.ketQua = kqOf(d); d.khongDat = K.filter(x => x.bad).map(x => x.ma || x.ten);
      Object.keys(d.tamNgung).forEach(k => { if (!d.tamNgung[k] || !K.some(x => x.k === k && x.bad)) delete d.tamNgung[k]; });
      sv.disabled = true;
      delete d.khongSX; if (reuse && d.ngay !== reuse.d.ngay) reuse = null;
      try { await save({ id: (r && r.id) || (reuse && reuse.id), loai: "KC", d }, d.ketQua === "Không đạt" ? "Đã lưu — có cân không đạt" : "Đã lưu sổ kiểm tra cân");
        for (const k of Object.keys(d.tamNgung)) { const t = rec(k); if (!t || t.d.tinhTrang === "Tạm ngưng") continue;
          await save({ id: t.id, loai: "TB", d: Object.assign({}, t.d, { tinhTrang: "Tạm ngưng", ghiChu: ["Kiểm tra cân " + D(d.ngay) + " không đạt — dán nhãn tạm ngưng", t.d.ghiChu].filter(Boolean).join(" · ") }) });
          await save({ loai: "NK", d: { tb: t.id, ma: t.d.ma || "", ten: t.d.ten, ngay: d.ngay, loaiCV: "Kiểm tra", noiDung: "Kiểm tra cân (BM.02-QC-QT.01, " + S0.chu + ") không đạt sau hiệu chỉnh — dán nhãn tạm ngưng sử dụng, chuyển sửa chữa / hiệu chuẩn bên ngoài", ketQua: "Không đạt", quyetDinh: "Tạm ngưng", kyTen: d.nguoi || S.me.ten } }, "Đã chuyển " + (t.d.ma || t.d.ten) + " sang Tạm ngưng"); }
        w.remove(); rer(); } catch (e) { sv.disabled = false; toast(e.message); } };
    setTimeout(() => { const f = bx.querySelector(".kcv:not([disabled])"); if (f && !r) f.focus(); }, 50);
  }

  /* ================= BẢN IN ================= */
  const PRCSS = `<style>.pq.tbp td,.pq.tbp th{font-size:9pt;padding:3px 4px;line-height:1.25}.pq.tbp th{font-size:8.5pt}.pq.tbp .hd .tt{font-size:14pt}.pq.tbp .hd td{font-size:9.5pt}.pq.tbp .sub{margin:5px 0;font-size:10pt}.pq.tbp td.c{text-align:center}.pq.tbp td.r{text-align:right}.pq.tbp table.kch td{border:0;padding:2px 0;font-size:10.5pt}.pq.tbp table.kv td{font-size:10pt;padding:4px 6px}.pq.tbp.kc td,.pq.tbp.kc th{font-size:10.5pt;padding:4px 5px}.pq.tbp td.xo{position:relative}.pq.tbp td.xo svg{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible}.pq.tbp td.xo line{stroke:#000;stroke-width:1;vector-effect:non-scaling-stroke}</style>`;
  const BMK = () => window.BMK;
  const page = (title, meta, body, land) => { const B = BMK(); B.pr(`${B.PCSS}${PRCSS}<div class="pq tbp">${B.head(title, meta)}<div class="gap"></div>${body}</div>`, land); };
  const table = (cols, rows, pad) => `<table><colgroup>${cols.map(c => `<col style="width:${c[1]}%">`).join("")}</colgroup><thead><tr>${cols.map(c => `<th>${E(c[0])}</th>`).join("")}</tr></thead><tbody>${rows.join("")}${Array(Math.max(0, (pad || 0) - rows.length)).fill(`<tr>${cols.map(() => "<td>&nbsp;</td>").join("")}</tr>`).join("")}</tbody></table>`;
  const td = (v, cls) => `<td${cls ? ` class="${cls}"` : ""}>${E(v ?? "")}</td>`;
  const DMCOLS = [["STT", 3], ["Mã thiết bị", 6.5], ["Tên thiết bị", 15], ["Nhóm/khu vực", 9], ["Xuất xứ", 6], ["Thông số chính", 19], ["Năm sử dụng", 5], ["Hình thức quản lý", 7], ["Bộ phận quản lý", 7], ["Tình trạng", 7], ["Ghi chú/Hiện trạng", 15.5]];
  const dmRows = L => L.map((t, i) => `<tr>${td(i + 1, "c")}${td(t.d.ma)}${td(t.d.ten)}${td(t.d.nhom)}${td(t.d.xuatXu)}${td(t.d.thongSo)}${td(t.d.namSD, "c")}${td(t.d.htql)}${td(t.d.boPhan)}${td(t.d.tinhTrang)}${td(t.d.ghiChu)}</tr>`);
  function prDanhMuc(L) { if (!L.length) { toast("Không có thiết bị để in."); return; } page("DANH MỤC THIẾT BỊ NHÀ XƯỞNG", `Ngày in: ${D(today())}<br>Số thiết bị: ${L.length}`, table(DMCOLS, dmRows(L)), true); }
  function prKHD(L) { if (!L.length) { toast("Không có thiết bị không hoạt động."); return; } const n = x => L.filter(t => t.d.tinhTrang === x).length;
    page("BÁO CÁO THIẾT BỊ KHÔNG HOẠT ĐỘNG", `Ngày báo cáo: ${D(today())}`, `<p class="sub">Tạm ngưng: <b>${n("Tạm ngưng")}</b> · Chờ sửa: <b>${n("Chờ sửa")}</b> · Ngừng sử dụng: <b>${n("Ngừng sử dụng")}</b> · Tổng cần báo cáo: <b>${L.length}</b></p>${table(DMCOLS, dmRows(L))}`, true); }
  function prBM01(L, sub) { if (!L.length) { toast("Không có thiết bị đo để in."); return; }
    const cols = [["Stt", 3], ["Tên thiết bị", 15], ["Mã thiết bị", 7], ["Số chế tạo", 6], ["Xuất xứ", 6], ["Phạm vi đo", 10], ["Bộ phận sử dụng", 8], ["Mục đích sử dụng", 12], ["Nơi hiệu chuẩn", 13], ["Ngày HC", 6.5], ["Ngày HC kế tiếp", 6.5], ["Xác nhận tình trạng", 7]];
    const rows = L.map((t, i) => `<tr>${td(i + 1, "c")}${td(t.d.ten)}${td(t.d.ma)}${td(t.d.soCheTao)}${td(t.d.xuatXu)}${td(t.d.thongSo)}${td(t.d.boPhan)}${td(t.d.mucDich)}${td(t.d.donVi)}${td(D(t.d.hcNgay), "c")}${td(D(t.d.denHan), "c")}${td([t.d.hcKQ, t.d.tinhTrang].filter(Boolean).join(" · "))}</tr>`);
    page("BẢNG THEO DÕI HIỆU CHUẨN KIỂM ĐỊNH THIẾT BỊ ĐO", META("BM.01-QC-QT.01"), `${sub ? `<p class="sub"><b>${E(sub)}</b></p>` : ""}${table(cols, rows, 7)}${BMK().sign([["Người lập bảng"], ["Phê duyệt"]])}`, true); }
  function prLich(L) { if (!L.length) { toast("Không có dòng kiểm định / hiệu chuẩn để in."); return; }
    const cols = [["STT", 3], ["Mã thiết bị", 7], ["Tên thiết bị", 15], ["Hình thức", 8], ["Chu kỳ", 5], ["Ngày gần nhất", 7], ["Ngày đến hạn", 7], ["Trạng thái", 9], ["Đơn vị thực hiện", 15], ["Số chứng thư", 9], ["Ghi chú", 15]];
    page("THEO DÕI KIỂM ĐỊNH VÀ HIỆU CHUẨN", `Ngày in: ${D(today())}<br>Số dòng: ${L.length}`, table(cols, L.map((t, i) => `<tr>${td(i + 1, "c")}${td(t.d.ma || "N/A")}${td(t.d.ten)}${td(t.d.hcLoai)}${td(t.d.chuKy ? t.d.chuKy + " tháng" : "", "c")}${td(D(t.d.hcNgay), "c")}${td(D(t.d.denHan), "c")}${td(hcTT(t.d).t)}${td(t.d.donVi)}${td(t.d.soCT)}${td(t.d.hcGhiChu)}</tr>`)), true); }
  function prNK(L, thang) { if (!L.length) { toast("Không có nhật ký để in."); return; }
    const cols = [["STT", 3], ["Ngày", 6.5], ["Mã thiết bị", 6.5], ["Tên thiết bị", 13], ["Loại công việc", 8], ["Nội dung", 17], ["Kết quả", 12], ["Người/đơn vị thực hiện", 13], ["Ngày dự kiến tiếp theo", 7], ["Ghi chú", 14]];
    page("NHẬT KÝ BẢO TRÌ VÀ SỬA CHỮA", thang ? `Tháng ${thang.slice(5)}/${thang.slice(0, 4)}` : `Ngày in: ${D(today())}`, table(cols, L.map((n, i) => `<tr>${td(i + 1, "c")}${td(D(n.d.ngay), "c")}${td(n.d.ma)}${td(n.d.ten)}${td(n.d.loaiCV)}${td(n.d.noiDung)}${td(n.d.ketQua)}${td(n.d.nguoiTH)}${td(D(n.d.ngayTiep), "c")}${td(n.d.ghiChu)}</tr>`), 10), true); }
  function prHoSo(t) { const d = t.d, L = nks().filter(n => n.d.tb === t.id).sort((a, c) => String(a.d.ngay).localeCompare(String(c.d.ngay)));
    const kv = `<table class="kv"><colgroup><col style="width:20%"><col style="width:32%"><col style="width:18%"><col style="width:30%"></colgroup>
      <tr><td><b>Tên thiết bị</b></td><td>${E(d.ten)}</td><td><b>Mã thiết bị</b></td><td>${E(d.ma)}</td></tr>
      <tr><td><b>Năm vận hành</b></td><td>${E(d.namSD)}</td><td><b>Xuất xứ</b></td><td>${E(d.xuatXu)}</td></tr>
      <tr><td><b>Bộ phận quản lý</b></td><td>${E(d.boPhan)}</td><td><b>Nhóm/khu vực</b></td><td>${E(d.nhom)}</td></tr>
      <tr><td><b>Quy cách kỹ thuật</b></td><td colspan="3">${E(d.thongSo)}</td></tr>
      ${d.hcLoai ? `<tr><td><b>${E(d.hcLoai)}</b></td><td colspan="3">${d.chuKy ? "Chu kỳ " + E(d.chuKy) + " tháng · " : ""}gần nhất ${D(d.hcNgay)} · đến hạn ${D(d.denHan)}${d.donVi ? " · " + E(d.donVi) : ""}${d.soCT ? " · số " + E(d.soCT) : ""}</td></tr>` : ""}</table>`;
    const rows = L.map(n => `<tr>${td(D(n.d.ngay), "c")}${td([n.d.loaiCV && n.d.noiDung && !String(n.d.noiDung).startsWith(n.d.loaiCV) ? n.d.loaiCV + ": " : "", n.d.noiDung || n.d.loaiCV].join(""))}${td(n.d.ketQua)}${td(n.d.quyetDinh)}${td(n.d.kyTen)}${td([n.d.nguoiTH, n.d.ghiChu].filter(Boolean).join(" · "))}</tr>`).join("");
    page("HỒ SƠ THIẾT BỊ SẢN XUẤT", `Mã thiết bị: <b>${E(d.ma || "—")}</b><br>Ngày in: ${D(today())}`, `${kv}<div class="gap"></div><table><colgroup><col style="width:11%"><col style="width:30%"><col style="width:20%"><col style="width:12%"><col style="width:11%"><col style="width:16%"></colgroup>
      <thead><tr><th rowspan="2">Ngày</th><th rowspan="2">Nội dung công việc</th><th rowspan="2">Kết quả</th><th colspan="2">Kiểm tra</th><th rowspan="2">Ghi chú</th></tr><tr><th>Quyết định</th><th>Ký tên</th></tr></thead>
      <tbody>${rows}${Array(Math.max(0, 16 - L.length)).fill("<tr>" + "<td>&nbsp;</td>".repeat(6) + "</tr>").join("")}</tbody></table>`, false); }
  /* dòng trống cuối sổ: gạch chéo một đường từ góc trên trái xuống góc dưới phải (ô không dùng) — mỗi ô vẽ đoạn của mình, nối liền nhau */
  function xoaRows(n, W) {
    if (!n) return "";
    const tot = W.reduce((s, v) => s + v, 0), X = W.map((w, j) => W.slice(0, j).reduce((s, v) => s + v, 0) / tot);
    return Array.from({ length: n }, (_, i) => "<tr>" + W.map((w, j) => { const a = X[j], b = a + w / tot, c = i / n, e = (i + 1) / n, x1 = Math.max(a, c), x2 = Math.min(b, e);
      if (x2 - x1 < 1e-6) return "<td>&nbsp;</td>";
      const u = x => ((x - a) / (b - a) * 100).toFixed(2), v = y => ((y - c) / (e - c) * 100).toFixed(2);
      return `<td class="xo">&nbsp;<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line x1="${u(x1)}" y1="${v(x1)}" x2="${u(x2)}" y2="${v(x2)}"/></svg></td>`; }).join("") + "</tr>").join("");
  }
  function prKC(L) {
    if (!L.length) { toast("Chưa có sổ kiểm tra cân để in."); return; }
    const B = BMK(), html = L.map((k, j) => { const d = k.d, S0 = KC[d.so], seen = {};
      const body = (d.rows || []).map(x => { const key = gkey(x), first = !seen[key], span = d.rows.filter(y => gkey(y) === key).length, c = calc(x); seen[key] = 1;
        return `<tr>${first ? `<td rowspan="${span}">${E(x.ten)}${x.lai ? " (kiểm tra lại" + (x.lai > 1 ? " lần " + x.lai : "") + ")" : ""}</td><td rowspan="${span}" class="c">${E(x.ma)}</td>` : ""}<td class="c">${fx(x.M, x.dp)}</td><td class="c">${fx(x.m1, x.dp)}</td><td class="c">${fx(x.m2, x.dp)}</td><td class="c">${c ? lechTxt(c.lech, x.dp) : ""}</td><td class="c">${c ? (c.dat ? "Đạt" : "Không đạt") : ""}</td></tr>`; }).join("");
      return `<div class="pq tbp kc"${j ? ' style="break-before:page"' : ""}>${B.head("SỔ KIỂM TRA THIẾT BỊ ĐO", META("BM.02-QC-QT.01"))}<div class="gap"></div>
        <table class="kch"><tr><td colspan="2"><b>Ngày:</b> ${D(d.ngay)}</td></tr><tr><td style="width:55%">PP kiểm tra: Dùng quả cân, vật cân chuẩn để kiểm tra</td><td>Thiết bị cân chuẩn: ${E(S0.chuan)}</td></tr></table><div class="gap"></div>
        <table><colgroup><col style="width:27%"><col style="width:12%"><col style="width:13%"><col style="width:12%"><col style="width:12%"><col style="width:11%"><col style="width:13%"></colgroup>
        <thead><tr><th rowspan="2">Tên thiết bị</th><th rowspan="2">Mã thiết bị</th><th rowspan="2">Quả cân chuẩn (g)</th><th colspan="4">${E(S0.nv)}</th></tr><tr><th colspan="2">Kết quả</th><th>Độ lệch</th><th>Đánh giá</th></tr></thead>
        <tbody>${body}${xoaRows(Math.max(0, 16 - (d.rows || []).length), [27, 12, 13, 12, 12, 11, 13])}</tbody></table>
        ${d.ghiChu ? `<p class="sub">Ghi chú: ${E(d.ghiChu)}</p>` : ""}<p class="sub"><i>Thực hiện theo HD.01 - Hướng dẫn kiểm tra và hiệu chỉnh thiết bị cân</i></p>${B.sign(S0.ky.map(x => [x]))}</div>`; }).join("");
    B.pr(`${B.PCSS}${PRCSS}${html}`, false);
  }

  /* ================= BÀN LÀM VIỆC ================= */
  window.tbTasks = async function () {
    if (!S.me || !QC()) return [];
    try { await load(); } catch (e) { return []; }
    const out = [], td0 = today();
    tbs().forEach(t => { const h = hcTT(t.d); if (!h || h.n == null || h.n > 60) return;
      out.push({ id: t.id, n: h.n, c: h.n <= 15 ? "#c62828" : "#d97706", t: `${h.n < 0 ? "⛔" : "📅"} <b>${E(t.d.ma || "—")}</b> · ${E(t.d.ten)} — ${E(t.d.hcLoai.toLowerCase())} ${h.n < 0 ? `<b>quá hạn ${-h.n} ngày</b> (hạn ${D(t.d.denHan)})` : `đến hạn ${D(t.d.denHan)} (còn ${h.n} ngày)${h.n <= 15 ? " · <b>lập đề xuất HCKĐ ngay</b>" : " · đề xuất trước " + D(addD(t.d.denHan, -15))}`}` }); });
    out.sort((a, b) => a.n - b.n);
    kcs().filter(k => k.d.ngay === td0 && !k.d.khongSX).forEach(k => { const bad = ketQuaTB(k.d).filter(x => x.bad && !(k.d.tamNgung || {})[x.k]);
      if (bad.length) out.unshift({ kc: k.d.so, rid: k.id, c: "#c62828", t: `✗ Kiểm tra cân hôm nay <b>không đạt</b>: ${E(bad.map(x => x.ma || x.ten).join(", "))} — hiệu chỉnh, kiểm tra lại hoặc dán nhãn tạm ngưng` }); });
    {
      const dw = dow(td0), m1 = scales("M1"), f1 = scales("F1"), ws = wkStart(td0);
      if (dw >= 1 && dw <= 6 && m1.length && !kcs().some(k => k.d.so === "M1" && k.d.ngay === td0)) out.unshift({ kc: "M1", c: "#d97706", t: `⚖ <b>Hôm nay chưa kiểm tra cân SX</b> (BM.02-QC-QT.01, quả cân M1) — ${m1.length} cân: ${E(m1.map(t => t.d.ma || t.d.ten).join(", "))}. Không sản xuất thì bấm “Hôm nay không sản xuất”.` });
      if (f1.length && !kcs().some(k => k.d.so === "F1" && k.d.ngay >= ws && k.d.ngay <= addD(ws, 6))) out.push({ kc: "F1", c: "#d97706", t: `⚖ <b>Tuần này chưa kiểm tra cân kỹ thuật PTN</b> (BM.02-QC-QT.01, quả cân F1) — ${E(f1.map(t => t.d.ma || t.d.ten).join(", "))}` });
    }
    return out;
  };
  window.tbOpen = function (x) {
    if (!x) return;
    if (x.kc) { vKC = x.kc; setTab("kc"); setTimeout(async () => { try { await load(); const r = x.rid ? rec(x.rid) : kcs().find(k => k.d.so === x.kc && k.d.ngay === today() && !k.d.khongSX); kcDlg(r || null, x.kc, today()); } catch (e) {} }, 350); return; }
    setTab("tb"); setTimeout(async () => { try { await load(); const t = rec(x.id); if (t) tbDlg(t); } catch (e) {} }, 350);
  };
  /* nhập danh sách từ file Excel (một lần, TP. QA/QC) */
  window.tbNhap = async function (L) { if (!TP()) throw new Error("Chỉ TP. QA/QC nhập danh sách."); const n = await api("webTBNhap", S.auth, L); await load(); return n; };
})();
