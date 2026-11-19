/* Sổ Kho — SỔ THEO DÕI GỬI MẪU KIỂM TRA CHẤT LƯỢNG (KTCL)
   Thay sổ Excel "Sổ theo dõi gởi mẫu KTCL": mỗi dòng = 1 mẫu gửi đơn vị kiểm nghiệm bên ngoài (VinaCert, Quatest 3, TT KĐ&KN thuốc BVTV phía Nam / phía Bắc…).
   Cột như sổ cũ: ngày gửi · tên mẫu (NSX, số lô SX) · nguồn gốc · số lượng · đơn vị KTCL · mã số hồ sơ · kết quả · ngày nhận · người lập · mục đích · ghi chú.
   Trạng thái tự suy ra: Huỷ · Đã có kết quả (có kết quả, hoặc đánh dấu đã xong) · Chờ kết quả (kèm số ngày đã chờ).
   Gắn với QC lô: khung QC của lô hiện các lần gửi mẫu của lô đó và nút "Gửi mẫu" điền sẵn tên, NSX, số lô. */
"use strict";
(function () {
  const E = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const D = s => { s = String(s || "").slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s.split("-").reverse().join("/") : s; };
  const today = () => (typeof S !== "undefined" && S.today) || new Date().toISOString().slice(0, 10);
  const QC = () => !!(S.me && (typeof can !== "undefined" && can.phieu ? can.phieu() : (S.me.qc || S.me.vaiTro === "Quản lý"))); /* ai lập phiếu được thì ghi sổ gửi mẫu được (R&D, QC) */
  const fold = t => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();
  const key = s => String(s || "").replace(/\s+/g, "").toUpperCase();
  const t0 = s => Date.parse(s + "T00:00:00+07:00"), cho = r => Math.max(0, Math.round((t0(today()) - t0(r.d.ngay)) / 864e5));
  const HAN = 15; /* số ngày chờ kết quả coi là trễ */
  /* QC-HD.49 (lần ban hành 02, 28/09/2026) mục 5.2: đơn vị thử nghiệm và lượng mẫu gửi. bv = thuốc BVTV [chỉ kiểm hàm lượng, kiểm nhiều chỉ tiêu] (g hoặc mL); pb = phân bón (g hoặc mL); null = hướng dẫn chưa có thông tin */
  const LAB = {
    "VinaCert": { ten: "Công ty Cổ phần Chứng nhận và Giám định Vinacert", dc: "F8-62 đường số 6, Khu dân cư 586, Phường Hưng Phú, TP. Cần Thơ", dt: "0934 488 845 (Lan Anh) · 0939 836 631 (Chị Lam)", bv: [200, 300], pb: 1000 },
    "Phía Nam": { ten: "Trung tâm Kiểm định và Khảo nghiệm thuốc BVTV phía Nam", dc: "28 Mạc Đỉnh Chi, Phường Sài Gòn, TP.HCM", dt: "02838 231 805", bv: [100, 200], pb: null },
    "Phía Bắc": { ten: "Trung tâm Kiểm định và Khảo nghiệm thuốc BVTV phía Bắc", dc: "7A Phố Lê Văn Hiến, Phường Đông Ngạc, TP. Hà Nội", dt: "0916 993 992 (Anh Nghĩa)", bv: [100, 200], pb: null },
    "SaigonCert": { ten: "Công ty Cổ phần Chứng nhận và Giám định SaigonCert", dc: "69 đường Làng Tăng Phú, Phường Tăng Nhơn Phú, TP. HCM", dt: "0981 977 731 (Kiều Tiên)", bv: null, pb: 500 },
    "Quatest 3": { ten: "Trung tâm Kỹ thuật tiêu chuẩn đo lường chất lượng 3 (QUATEST3)", dc: "1196 đường Ba Tháng Hai, Phường Bình Thới, TP. HCM", dt: "02838 294 274 · 02838 293 012", bv: null, pb: 1000 },
    "IQC": { ten: "Công ty Cổ phần Chứng nhận và Giám định IQC", dc: "Ô 6 BT 4 Khu đô thị mới Cầu Bươu, Phường Thanh Trì, TP. Hà Nội", dt: "0913 837 110", bv: null, pb: 500 },
    /* không có trong QC-HD.49 — chỉ có tên đầy đủ do TP. QA/QC cung cấp, chưa có địa chỉ và lượng mẫu */
    "Vinacontrol": { ten: "Trung tâm phân tích và thử nghiệm 2 - Vinacontrol", dc: "", dt: "", bv: null, pb: null } };
  /* 19/11/2026 (theo anh Ghel): mục đích chỉ còn vài lựa chọn cố định (theo QC-HD.49 + "cập nhật date mới" đang dùng nhiều trong sổ); dòng cũ ghi khác thì giữ nguyên chữ cũ */
  const MUC = ["Kiểm soát lô", "Cập nhật date mới", "Hợp quy", "Độ bền bảo quản", "Nghiên cứu", "Điều tra bất thường"];
  /* tên gọi tắt trong sổ cũ (VinaCert, Quatest 3, Phía Nam…) -> đơn vị trong QC-HD.49; sổ, bản in và danh sách chọn hiện tên đầy đủ */
  const labKey = dv => { const f = fold(dv).replace(/[^a-z0-9]+/g, " ").trim(); if (!f) return ""; for (const k in LAB) if (fold(LAB[k].ten) === fold(dv)) return k;
    return /vinacontrol/.test(f) ? "Vinacontrol" : /vinacert/.test(f) ? "VinaCert" : /saigon ?cert/.test(f) ? "SaigonCert" : /quatest ?3|qt ?3/.test(f) ? "Quatest 3" : /\biqc\b/.test(f) ? "IQC" : /phia nam|\bpn\b/.test(f) ? "Phía Nam" : /phia bac|\bpb\b/.test(f) ? "Phía Bắc" : ""; };
  const labOf = dv => LAB[labKey(dv)] || null;
  const dvFull = dv => { const L = labOf(dv); return L ? L.ten : String(dv || ""); };
  const lCua = d => { const L = labOf(d.dv); if (!L) return null; const n = d.loaiMau === "Phân bón" ? L.pb : (L.bv ? L.bv[d.phamVi === "Nhiều chỉ tiêu" ? 1 : 0] : null); if (!n) return ""; const long_ = d.dang === "Lỏng";
    return n >= 1000 ? (n / 1000) + (long_ ? " L" : " kg") : n + (long_ ? " mL" : " g"); };
  /* tên mẫu ghi trên nhãn / phiếu yêu cầu theo QC-HD.49 mục 5.3 */
  const tenHD = d => { const t = String(d.ten || "").trim(); if (!t) return ""; const p = [d.nsx ? "NSX: " + D(d.nsx) : "", d.lo ? "Số lô SX: " + d.lo : "", d.slLo ? "Số lượng: " + d.slLo : ""].filter(Boolean).join(" – ");
    return t + (d.loaiMau === "Phân bón" && d.maPB ? ", Mã số phân bón: " + d.maPB : "") + (p ? " (" + p + ")" : ""); };
  const longOf = ten => /(^|\s|\d)(SL|EC|SC|OD|FS|ME|EW|SE|DC|CS|ULV|AL)\b/i.test(String(ten || "").trim().split(/\s+/).slice(-1)[0] || "") ? "Lỏng" : "Rắn";
  /* đơn vị KTCL gửi bản scan trước, bản cứng về sau: bản cứng ghi số bản, ngày nhận và do chính tài khoản nhận bấm xác nhận (r.d.bc — chỉ máy chủ ghi). Chỉ nhắc "chờ bản cứng" với kết quả nhận từ ngày bật tính năng, sổ cũ không nhắc. */
  const BC_TU = "2026-11-18";
  const choBC = r => !r.d.huy && !r.d.bc && !!(r.d.ketQua || r.d.ngayNhan) && String(r.d.ngayNhan || "") >= BC_TU;
  /* bản cứng chia tiếp: người nhận từ trung tâm giao cho người khác (r.d.bc.giao), người được giao tự đăng nhập xác nhận; đã xác nhận thì khoá */
  const giaoL = b => (b && b.giao) || [], conGiu = b => b ? b.so - giaoL(b).reduce((s, x) => s + (+x.so || 0), 0) : 0;
  const bcTxt = b => b ? `${b.so} bản · nhận ${D(b.ngay)} · ${[conGiu(b) > 0 || !giaoL(b).length ? b.nguoi + " giữ " + conGiu(b) : ""].concat(giaoL(b).map(x => `${x.cho} ${x.so}${x.nhan ? " ✓" : " (chờ xác nhận)"}`)).filter(Boolean).join(" · ")}` : "";
  const gioNgay = s => { s = String(s || ""); return s.length >= 16 ? s.slice(11, 16) + " " + D(s) : D(s); };
  const nhanL = b => giaoL(b).filter(x => x.nhan), nhanTu = b => nhanL(b).map(x => `${x.cho} (${x.so} bản, ${gioNgay(x.nhan)})`).join("; ");
  const choToi = r => !r.d.huy && S.me && giaoL(r.d.bc).some(x => x.cho === S.me.ten && !x.nhan);
  let USERS = [];
  const badge = () => { const b = document.getElementById("tabGmBtn"); if (!b) return; let c = b.querySelector(".cnt"); const n = live().filter(choToi).length; if (!c) { c = document.createElement("span"); c.className = "cnt"; b.appendChild(c); } c.hidden = !n; c.textContent = n; };
  const ttOf = r => r.d.huy ? "Huỷ" : (r.d.ketQua || r.d.xong) ? "Đã có kết quả" : "Chờ kết quả";
  let R = [], loaded = false, q = "", fNam = "", fThang = "", fDV = "", fTT = "";
  const live = () => R.filter(x => !x.xoa);
  async function load() { R = await api("webGMAll", S.auth); loaded = true; try { badge(); } catch (e) {} try { if (!USERS.length) USERS = await api("getUserNames"); } catch (e) {} }
  const uniq = k => [...new Set(live().map(r => String(r.d[k] || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));
  const dl = (id, L) => `<datalist id="${id}">${L.map(x => `<option value="${E(x)}">`).join("")}</datalist>`;
  const kqChip = r => { const t = ttOf(r), k = r.d.ketQua; if (t === "Huỷ") return '<span class="st cancel">Huỷ</span>';
    if (k) return `<span class="st" style="background:${k === "Đạt" ? "#2e7d32" : "#c62828"};color:#fff;border-color:transparent">${E(k)}</span>`;
    if (t === "Đã có kết quả") return '<span class="note">đã nhận</span>'; const n = cho(r);
    return `<span class="st" style="background:${n > HAN ? "#c62828" : "#b45309"};color:#fff;border-color:transparent">chờ ${n} ngày</span>`; };

  window.renderGM = async function () {
    const b = document.getElementById("gmBox"); if (!b) return;
    if (!loaded) { b.innerHTML = '<p class="note"><span class="ldg">Đang tải sổ gửi mẫu</span></p>'; try { await load(); } catch (e) { b.innerHTML = `<div class="empty"><b>Không tải được sổ gửi mẫu</b>${E(e.message)}</div>`; return; } }
    const A = live(), nams = [...new Set(A.map(r => String(r.d.ngay).slice(0, 4)).concat([today().slice(0, 4)]))].sort().reverse(); if (!fNam || !nams.includes(fNam)) fNam = nams[0];
    const W = fold(q).split(/\s+/).filter(Boolean);
    const Y = A.filter(r => String(r.d.ngay).slice(0, 4) === fNam).sort((a, c) => String(a.d.ngay).localeCompare(String(c.d.ngay)) || String(a.luc || "").localeCompare(String(c.luc || "")) || String(a.id).localeCompare(String(c.id)));
    Y.forEach((r, i) => { r._stt = i + 1; });
    const L = Y.filter(r => (!fThang || String(r.d.ngay).slice(5, 7) === fThang) && (!fDV || dvFull(r.d.dv) === fDV) && (!fTT || (fTT === "Chờ bản cứng" ? choBC(r) : fTT === "Chờ tôi xác nhận bản cứng" ? choToi(r) : ttOf(r) === fTT)) && (!W.length || (t => W.every(w => t.includes(w)))(fold([r.d.ten, r.d.lo, r.d.nguon, r.d.dv, r.d.mucDich, r.d.soHS, r.d.ghiChu, r.d.ma].join(" ")))));
    const ch = A.filter(r => ttOf(r) === "Chờ kết quả"), tre = ch.filter(r => cho(r) > HAN);
    const G = { "Chờ kết quả": [], "Đã có kết quả": [], "Huỷ": [] }; L.forEach(r => G[ttOf(r)].push(r)); G["Chờ kết quả"].reverse(); G["Đã có kết quả"].reverse(); /* mới gửi lên đầu */
    const row = r => { const d = r.d; return `<tr class="click" data-id="${E(r.id)}" style="cursor:pointer"><td style="text-align:center">${r._stt}</td><td style="white-space:nowrap;overflow-wrap:normal">${D(d.ngay)}</td><td><b>${E(d.ten)}</b>${d.lo || d.nsx ? `<div class="note" style="margin:2px 0 0">${[d.lo ? "Lô " + E(d.lo) : "", d.nsx ? "NSX " + D(d.nsx) : ""].filter(Boolean).join(" · ")}</div>` : ""}</td><td>${E(d.nguon || "")}</td><td>${E(dvFull(d.dv))}</td><td>${E(d.mucDich || "")}</td><td>${E(d.soHS || "")}${d.ngayNhan ? `<div class="note" style="margin:2px 0 0">${d.ngayNhan >= BC_TU ? "bản scan" : "nhận"} ${D(d.ngayNhan)}</div>` : ""}</td><td>${kqChip(r)}${d.bc ? `<div class="note" style="margin:2px 0 0">Bản cứng: ${E(d.bc.so)} bản · ${E(d.bc.luc && String(d.bc.luc).slice(0, 10) === d.bc.ngay ? gioNgay(d.bc.luc) : D(d.bc.ngay))}</div>` : choBC(r) ? '<div style="margin:3px 0 0"><span class="st" style="background:#b45309;color:#fff;border-color:transparent">chờ bản cứng</span></div>' : ""}${d.ghiChu ? `<div class="note" style="margin:2px 0 0">${E(d.ghiChu)}</div>` : ""}</td><td>${nhanL(d.bc).map(x => `<div><b>${E(x.cho)}</b> · ${E(x.so)} bản<div class="note" style="margin:0 0 3px">${E(gioNgay(x.nhan))}</div></div>`).join("")}</td></tr>`; };
    b.innerHTML = `<div class="tools tb-top"><input type="search" id="gmQ" value="${E(q)}" placeholder="Tìm mẫu: tên, số lô, đơn vị, mã số hồ sơ…" style="flex:1;min-width:220px">
        <select id="gmNam" style="width:auto">${nams.map(n => `<option${n === fNam ? " selected" : ""}>${n}</option>`).join("")}</select>
        <select id="gmThang" style="width:auto"><option value="">Cả năm</option>${Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(m => `<option value="${m}"${m === fThang ? " selected" : ""}>Tháng ${+m}${(n => n ? " (" + n + ")" : "")(Y.filter(r => String(r.d.ngay).slice(5, 7) === m).length)}</option>`).join("")}</select>
        <select id="gmDV" style="width:auto"><option value="">Tất cả đơn vị</option>${[...new Set(uniq("dv").map(dvFull))].sort((a, c) => a.localeCompare(c, "vi")).map(x => `<option${x === fDV ? " selected" : ""}>${E(x)}</option>`).join("")}</select>
        <select id="gmTT" style="width:auto">${["", "Chờ kết quả", "Chờ bản cứng", "Chờ tôi xác nhận bản cứng", "Đã có kết quả", "Huỷ"].map(t => `<option value="${t}"${t === fTT ? " selected" : ""}>${t || "Tất cả trạng thái"}</option>`).join("")}</select>
        <button class="btn" type="button" id="gmPr">🖨 In sổ ${fThang ? "tháng " + +fThang + "/" : "năm "}${fNam}</button>${QC() ? '<button class="btn primary" type="button" id="gmNew">+ Ghi gửi mẫu</button>' : ""}</div>
      ${A.some(choToi) ? `<div class="gm-toi"><b>Có ${A.filter(choToi).length} phiếu kết quả bản cứng giao cho bạn, chờ bạn xác nhận đã nhận.</b> <button type="button" class="btn small" id="gmToi">Xem</button></div>` : ""}
      <p class="note" style="margin:0 0 8px">${ch.length ? `<b style="color:#b45309">${ch.length} mẫu chờ kết quả</b>${tre.length ? ` · <b style="color:#c62828">${tre.length} mẫu quá ${HAN} ngày</b>` : ""}` : "Không có mẫu chờ kết quả"}${A.filter(choBC).length ? ` · <b style="color:#b45309">${A.filter(choBC).length} mẫu chờ bản cứng</b>` : ""} · năm ${fNam}: ${Y.length} mẫu${L.length !== Y.length ? ` · khớp ${L.length}` : ""}. Bấm vào mẫu để ghi mã số hồ sơ, kết quả.</p>
      ${L.length ? `<div class="dgx tb-tbl"><table><thead><tr><th style="width:46px">STT</th><th style="width:116px">Ngày gửi</th><th>Tên mẫu</th><th style="width:10%">Nguồn gốc</th><th style="width:19%">Đơn vị KTCL</th><th style="width:11%">Mục đích</th><th style="width:12%">Mã số hồ sơ</th><th style="width:132px">Kết quả</th><th style="width:10%">Người nhận bản cứng</th></tr></thead><tbody>${Object.keys(G).filter(t => G[t].length).map(t => `<tr class="tb-gh"><td colspan="9">${t} <small>· ${G[t].length} mẫu</small></td></tr>` + G[t].map(row).join("")).join("")}</tbody></table></div>`
        : `<div class="empty"><b>${W.length || fDV || fTT || fThang ? "Không có mẫu nào khớp" : "Chưa có mẫu gửi nào trong năm " + fNam}</b></div>`}`;
    const on = (id, ev, f) => { const el = document.getElementById(id); if (el) el[ev] = f; };
    on("gmQ", "oninput", e => { q = e.target.value; clearTimeout(window.__gmQT); window.__gmQT = setTimeout(() => window.renderGM().then(() => { const el = document.getElementById("gmQ"); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }), 250); });
    on("gmNam", "onchange", e => { fNam = e.target.value; window.renderGM(); }); on("gmThang", "onchange", e => { fThang = e.target.value; window.renderGM(); }); on("gmDV", "onchange", e => { fDV = e.target.value; window.renderGM(); }); on("gmTT", "onchange", e => { fTT = e.target.value; window.renderGM(); });
    on("gmToi", "onclick", () => { fTT = "Chờ tôi xác nhận bản cứng"; const A2 = live().filter(choToi); if (A2.length) fNam = String(A2[0].d.ngay).slice(0, 4); fThang = ""; window.renderGM(); }); try { badge(); } catch (e) {}
    on("gmNew", "onclick", () => gmDlg(null)); on("gmPr", "onclick", () => prGM(fNam, fThang));
    b.querySelectorAll("tr[data-id]").forEach(x => x.onclick = () => gmDlg(live().find(r => r.id === x.dataset.id)));
    if (window.pgActSync) window.pgActSync();
  };

  /* các lô BTP / thành phẩm / nguyên liệu đang có trên sổ kho — để chọn nhanh mẫu là lô nào */
  const lots = () => { const out = []; try { (S.items || []).forEach(it => { if (!it.theoLo || !/Bán thành phẩm|Thành phẩm|Nguyên liệu|Phân bón/.test(it.nhom || "")) return; (S.lots[it.ma] || []).forEach(l => l.lo && out.push({ ma: it.ma, ten: it.ten, lo: l.lo, nsx: String(l.nsx || "").slice(0, 10), nhom: it.nhom })); }); } catch (e) {} return out.sort((a, c) => (a.nhom === "Bán thành phẩm" ? 0 : 1) - (c.nhom === "Bán thành phẩm" ? 0 : 1) || String(c.lo).localeCompare(String(a.lo))); };

  function bcHtml(b) {
    const me = (S.me && S.me.ten) || "", ql = !!(S.me && S.me.vaiTro === "Quản lý");
    if (!b) return `<p class="note" style="margin:0 0 6px">Trung tâm gửi bản scan trước (ghi ở mục Kết quả), bản cứng về sau. Ai nhận bản cứng từ trung tâm thì đăng nhập tài khoản của mình và bấm xác nhận.</p><div class="two qa-g"><label>Số bản nhận (tối đa 3)<select id="gmBcSo"><option value="">— chọn —</option><option>1</option><option>2</option><option>3</option></select></label><label>Ngày nhận bản cứng<input id="gmBcNg" type="date" value="${today()}"></label></div>
      <div class="acts" style="margin-top:6px"><button type="button" class="btn primary" data-x="bc">${E(me || "Tôi")} xác nhận đã nhận bản cứng từ trung tâm</button></div>`;
    const con = conGiu(b), giu = me === b.nguoi || ql, G = giaoL(b).filter(x => giu || QC() || x.cho === me), /* người nhận chỉ thấy dòng của mình */ lk = x => x.luc ? E(String(x.luc).slice(11, 16)) + " " + D(x.luc) : "";
    return `<p style="margin:0"><b>${E(b.nguoi)}</b> nhận từ trung tâm <b>${E(b.so)} bản</b> ngày ${D(b.ngay)}${b.luc ? ` <small class="note">(xác nhận ${lk(b)})</small>` : ""}. ${con > 0 ? `Còn giữ <b>${con} bản</b>.` : "Đã giao hết."}</p>
      ${G.length ? `<table class="gm-bc"><thead><tr><th>Người nhận</th><th>Số bản</th><th>Ngày</th><th>Xác nhận của người nhận</th><th></th></tr></thead><tbody>${G.map(x => `<tr><td><b>${E(x.cho)}</b></td><td style="text-align:center">${E(x.so)}</td><td>${D(x.ngay)}</td><td>${x.nhan ? `<span class="st" style="background:#2e7d32;color:#fff;border-color:transparent">đã nhận</span> <small class="note">${lk({ luc: x.nhan })}</small>` : '<span class="st" style="background:#b45309;color:#fff;border-color:transparent">chờ xác nhận</span>'}</td>
        <td style="text-align:right">${!x.nhan && x.cho === me ? `<button type="button" class="btn primary small" data-xn="${E(x.id)}">Tôi xác nhận đã nhận ${E(x.so)} bản</button>` : ""}${!x.nhan && giu ? ` <button type="button" class="btn small" data-bo="${E(x.id)}">Bỏ</button>` : ""}${x.nhan && ql && x.cho !== me ? ` <button type="button" class="btn small" data-bo="${E(x.id)}">Bỏ</button>` : ""}</td></tr>`).join("")}</tbody></table>` : ""}
      ${con > 0 && me && me !== b.nguoi ? `<div class="gm-giao"><label>Số bản bạn nhận từ ${E(b.nguoi)}<select id="gmTnSo">${Array.from({ length: con }, (_, i) => `<option>${i + 1}</option>`).join("")}</select></label><button type="button" class="btn primary" data-x="tuNhan">${E(me)} xác nhận đã nhận</button></div><p class="note" style="margin:4px 0 0">Đã xác nhận thì không huỷ, không xoá được.</p>` : ""}
      ${con > 0 && me === b.nguoi ? `<p class="note" style="margin:6px 0 0">Ai nhận bản cứng từ bạn thì tự đăng nhập, mở dòng này, chọn số bản và bấm xác nhận. Đã xác nhận thì người nhận không huỷ, không xoá được.</p>` : ""}
      ${!giaoL(b).length && giu ? '<div class="acts" style="margin-top:6px"><button type="button" class="btn small" data-x="bcHuy">Huỷ xác nhận nhận từ trung tâm</button></div>' : ""}`;
  }
  function gmDlg(r, pre) {
    const moi = !r, ed = QC(), d0 = r ? r.d : (pre || {}), d = Object.assign({ ngay: today(), ten: "", ma: "", lo: "", nsx: "", nguon: "", sl: "", dv: "", mucDich: "", loaiMau: "Thuốc BVTV", dang: "", phamVi: "Chỉ hàm lượng", chiTieu: "", maPB: "", slLo: "", vanDon: "", mauLuu: false, soHS: "", ketQua: "", ngayNhan: "", ghiChu: "", huy: false, xong: false, nguoiLap: (S.me && S.me.ten) || "" }, d0), dis = ed ? "" : "disabled"; d.dv = dvFull(d.dv);
    if (!d.dang) d.dang = longOf(d.ten); if (!d0.loaiMau && /phân bón|fertili|asata combi|chelate|hữu cơ/i.test(d.ten)) d.loaiMau = "Phân bón";
    const sel = (k, lb, L) => `<label>${lb}<select data-k="${k}" data-opt ${dis}>${L.map(x => `<option${x === d[k] ? " selected" : ""}>${x}</option>`).join("")}</select></label>`;
    const w = document.createElement("div"); w.className = "cfm";
    const f = (k, lb, at, full) => `<label${full ? ' style="grid-column:1/-1"' : ""}>${lb}<input data-k="${k}" value="${E(d[k] ?? "")}" ${at || ""} ${dis}></label>`;
    w.innerHTML = `<div class="cfm-box kh-dlg"><h2>${moi ? "Ghi gửi mẫu kiểm tra chất lượng" : "Mẫu gửi KTCL · " + E(d.ten)}</h2>${moi ? '<p class="note">Theo QC-HD.49. Khi có kết quả, bấm vào dòng mẫu trong sổ để ghi mã số hồ sơ và kết quả.</p>' : ""}
      ${moi && ed ? `<label>Chọn lô trên sổ kho <small class="note">— gõ tên, mã hoặc số lô; mẫu không thuộc lô nào (mẫu PTN, mẫu mua…) thì bỏ qua</small><input id="gmLot" list="gmLotL" placeholder="VD: 2607.089, us-sinate…" data-opt autocomplete="off"></label>${dl("gmLotL", lots().map(x => x.lo + " · " + x.ten + " · " + x.ma))}` : ""}
      <div class="two qa-g">${f("ngay", "Ngày gửi mẫu", 'type="date"')}${sel("loaiMau", "Loại mẫu", ["Thuốc BVTV", "Phân bón"])}
        ${f("ten", "Tên sản phẩm <small class=\"note\">— đúng tên trên TCCS / hồ sơ đăng ký, không viết tắt</small>", "", true)}
        ${f("lo", "Số lô SX", 'data-opt')}${f("nsx", "NSX", 'type="date" data-opt')}
        <label data-pb>Mã số phân bón<input data-k="maPB" value="${E(d.maPB)}" data-opt ${dis}></label>${f("slLo", "Số lượng cả lô <small class=\"note\">(hàng gia công, nếu bên đặt yêu cầu)</small>", 'placeholder="VD: 14.220 Lít" data-opt')}
        ${f("nguon", "Nguồn gốc", 'list="gmNgL" placeholder="số lô, Mẫu PTN, Mẫu mua, BTP nhập khẩu…" data-opt')}${f("dv", "Đơn vị KTCL", 'list="gmDvL" placeholder="gõ VinaCert, Quatest, phía Nam… rồi chọn tên đầy đủ"', true)}
        <p class="note" id="gmDvI" style="grid-column:1/-1;margin:-4px 0 0" hidden></p>
        <label>Mục đích KTCL<select data-k="mucDich" data-opt ${dis}><option value="">— chọn —</option>${(() => { const cur = String(d.mucDich || "").trim(), hit = MUC.find(x => x.toLowerCase() === cur.toLowerCase()); return (cur && !hit ? [cur] : []).concat(MUC).map(x => `<option${x === (hit || cur) ? " selected" : ""}>${E(x)}</option>`).join(""); })()}</select></label>
        ${sel("phamVi", "Phạm vi kiểm", ["Chỉ hàm lượng", "Nhiều chỉ tiêu"])}${sel("dang", "Dạng mẫu", ["Rắn", "Lỏng"])}
        ${f("sl", "Lượng mẫu gửi", 'list="gmSlL" placeholder="theo QC-HD.49"')}${f("vanDon", "Số vận đơn / biên nhận", 'data-opt')}
        <p class="note" id="gmSlI" style="grid-column:1/-1;margin:-4px 0 0" hidden></p>
        <label class="gm-ck"><input type="checkbox" data-c="mauLuu" ${d.mauLuu ? "checked" : ""} ${dis}><span>Đã chia và niêm phong mẫu lưu đối chứng của cùng lần lấy mẫu</span></label>
        <div class="gm-ten" id="gmTen" style="grid-column:1/-1"></div></div>
      <fieldset class="qa-fs" ${dis}${moi ? " hidden" : ""}><legend>Kết quả</legend><div class="two qa-g">${f("soHS", "Mã số hồ sơ / số phiếu kết quả", 'data-opt')}${f("ngayNhan", "Ngày nhận bản scan kết quả", 'type="date" data-opt')}
        <label>Kết quả<select data-k="ketQua" data-opt>${["", "Đạt", "Không đạt"].map(x => `<option value="${x}"${x === (d.ketQua || "") ? " selected" : ""}>${x || "— chưa có —"}</option>`).join("")}</select></label>${f("ghiChu", "Ghi chú", 'data-opt')}
        <label class="gm-ck"><input type="checkbox" data-c="xong" ${d.xong ? "checked" : ""}><span>Đã xong, không cần theo dõi nữa (không ghi kết quả)</span></label>
        <label class="gm-ck"><input type="checkbox" data-c="huy" ${d.huy ? "checked" : ""}><span>Huỷ mẫu này</span></label></div></fieldset>
      ${moi ? "" : `<fieldset class="qa-fs gm-bcfs"><legend>Bản cứng phiếu kết quả</legend>${bcHtml(d.bc)}</fieldset>`}
      ${dl("gmSlL", ["100 g", "100 mL", "200 g", "200 mL", "300 g", "300 mL", "500 g", "500 mL", "1 kg", "1 L"])}${dl("gmDvL", [...new Set(Object.keys(LAB).map(k => LAB[k].ten).concat(uniq("dv").map(dvFull)))])}${dl("gmNgL", ["Mẫu PTN", "Mẫu mua", "BTP nhập khẩu", "Mẫu nhập khẩu"])}
      ${r ? `<p class="note">Người lập: ${E(d.nguoiLap || r.nguoi || "")}${r.sua ? " · sửa cuối: " + E(r.sua) : ""}</p>` : ""}
      <div class="actions">${!moi && ed ? '<button class="btn danger" type="button" data-x="del">Xoá</button>' : ""}<span style="flex:1"></span><button class="btn" type="button" data-x="close">Đóng</button>${ed ? '<button class="btn primary noic" type="button" data-x="save">Lưu</button>' : ""}</div></div>`;
    document.body.appendChild(w);
    const g = k => w.querySelector(`[data-k="${k}"]`), set = (k, v) => { const el = g(k); if (el && v != null) el.value = v; };
    /* theo QC-HD.49: hiện địa chỉ đơn vị, gợi ý lượng mẫu gửi (tự điền khi ô còn trống hoặc đang là số gợi ý cũ), dựng dòng "Tên mẫu" ghi trên nhãn và phiếu yêu cầu */
    let slGY = "";
    const cur = () => { const o = {}; w.querySelectorAll("[data-k]").forEach(x => { o[x.dataset.k] = x.value.trim(); }); return o; };
    const up = () => { const o = cur(), L = labOf(o.dv), gy = lCua(o), pb = o.loaiMau === "Phân bón"; w.querySelectorAll("[data-pb]").forEach(x => { x.style.display = pb ? "" : "none"; });
      const di = w.querySelector("#gmDvI"); di.hidden = !L; di.hidden = !L || (!L.dc && fold(o.dv) === fold(L.ten)); if (L) di.innerHTML = `${fold(o.dv) === fold(L.ten) ? "" : "<b>" + E(L.ten) + "</b> · "}${E([L.dc, L.dt ? "ĐT: " + L.dt : ""].filter(Boolean).join(" · "))}`;
      const si = w.querySelector("#gmSlI"); si.hidden = !L; if (L) si.innerHTML = gy ? `QC-HD.49: gửi ${E(labKey(o.dv))} ${pb ? "phân bón" : "thuốc BVTV, " + o.phamVi.toLowerCase()} — <b>${gy}</b>; mẫu lưu đối chứng chuẩn bị riêng.` : `QC-HD.49 chưa có lượng mẫu ${pb ? "phân bón" : "thuốc BVTV"} cho ${E(labKey(o.dv))} — xác nhận với đơn vị nhận trước khi lấy mẫu.`;
      const sl = g("sl"); if (ed && L && gy != null && (!sl.value.trim() || sl.value.trim() === slGY)) { sl.value = gy; slGY = gy; }
      const t = tenHD(o), tb = w.querySelector("#gmTen"); tb.innerHTML = t ? `<small class="note">Tên mẫu ghi trên nhãn và phiếu yêu cầu (QC-HD.49 mục 5.3):</small><div class="gm-ten-t"><b>${E(t)}</b><button type="button" class="btn small" id="gmCopy">Chép</button></div>` : "";
      const cb = w.querySelector("#gmCopy"); if (cb) cb.onclick = async () => { try { await navigator.clipboard.writeText(t); toast("Đã chép tên mẫu"); } catch (e) { toast("Không chép được — bôi đen rồi Ctrl+C"); } }; };
    w.querySelectorAll("[data-k]").forEach(x => { x.addEventListener("input", up); x.addEventListener("change", up); });
    const lot = w.querySelector("#gmLot"); if (lot) lot.onchange = () => { const v = lot.value, x = lots().find(y => y.lo + " · " + y.ten + " · " + y.ma === v); if (!x) return; set("ten", String(x.ten).replace(/^BTP\s+/i, "")); set("lo", x.lo); set("nsx", x.nsx); set("nguon", x.lo); d.ma = x.ma; set("dang", longOf(x.ten)); if (/Phân bón/i.test(x.nhom || "")) set("loaiMau", "Phân bón"); up(); };
    g("dv").addEventListener("change", () => { const x = g("dv"), f = dvFull(x.value.trim()); if (f && f !== x.value) { x.value = f; up(); } });
    if (!moi && d.sl) slGY = "\u0000"; up();
    /* người không ghi sổ (chỉ vào nhận bản cứng): chỉ hiện tóm tắt mẫu + phần bản cứng của họ, ẩn hết ô nhập liệu */
    if (!moi && !ed) { const box = w.querySelector(".cfm-box"); [...box.children].forEach(c => { if (!c.matches("h2, .gm-bcfs, .actions")) c.style.display = "none"; });
      box.querySelector("h2").textContent = "Nhận bản cứng phiếu kết quả";
      const tt = document.createElement("div"); tt.className = "gm-tt"; tt.innerHTML = `<b>${E(d.ten)}</b>${d.lo ? " · lô " + E(d.lo) : ""}${d.nsx ? " · NSX " + D(d.nsx) : ""}<br>${E(d.dv)}${d.soHS ? " · số phiếu " + E(d.soHS) : ""}${d.ketQua ? " · kết quả: <b>" + E(d.ketQua) + "</b>" : ""}`; box.querySelector("h2").after(tt); }
    w.querySelector('[data-x="close"]').onclick = () => w.remove();
    const sv = w.querySelector('[data-x="save"]'); const thu = () => { const o = Object.assign({}, d); w.querySelectorAll("[data-k]").forEach(x => { o[x.dataset.k] = x.value.trim(); }); w.querySelectorAll("[data-c]").forEach(x => { o[x.dataset.c] = x.checked; }); o.dv = dvFull(o.dv); if (o.ketQua && !o.ngayNhan) o.ngayNhan = today(); return o; };
    if (sv) sv.onclick = async () => { const o = thu();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(o.ngay)) { toast("Ghi ngày gửi mẫu."); g("ngay").focus(); return; } if (!o.ten) { toast("Ghi tên mẫu."); g("ten").focus(); return; } o.dv = dvFull(o.dv); if (!o.dv) { toast("Ghi đơn vị KTCL."); g("dv").focus(); return; }
      if (o.ketQua && !o.ngayNhan) o.ngayNhan = today();
      sv.disabled = true; try { const x = await api("webGMSave", S.auth, { id: r ? r.id : "", d: o }); const i = R.findIndex(y => y.id === x.id); if (i >= 0) R[i] = x; else R.push(x); w.remove(); toast(moi ? "Đã ghi mẫu gửi " + (labKey(o.dv) || o.dv) : "Đã lưu"); window.renderGM(); if (window.renderQC && S.tab === "qc") renderQC(); gmDlg(x); /* lưu xong giữ cửa sổ mở để ghi tiếp kết quả / bản cứng; đóng bằng nút Đóng */ } catch (e) { toast(e.message); sv.disabled = false; } };
    const bcDo = async (btn, v, msg) => { btn.disabled = true; try { /* đang sửa dở mục Kết quả (ngày nhận bản scan, mã hồ sơ…) thì lưu luôn trước, kẻo mở lại mất chữ vừa gõ */
      if (ed && sv) { const o = thu(); if (/^\d{4}-\d{2}-\d{2}$/.test(o.ngay) && o.ten && o.dv && JSON.stringify(o) !== JSON.stringify(Object.assign({}, d, { dv: o.dv }))) { const y = await api("webGMSave", S.auth, { id: r.id, d: o }); const j = R.findIndex(z => z.id === y.id); if (j >= 0) R[j] = y; } }
      const x = await api("webGMBanCung", S.auth, r.id, v); const i = R.findIndex(y => y.id === x.id); if (i >= 0) R[i] = x; w.remove(); toast(msg); window.renderGM(); if (window.renderQC && S.tab === "qc") renderQC(); gmDlg(x); } catch (e) { toast(e.message); btn.disabled = false; } };
    const sure = (b, t) => { if (b.dataset.sure === "1") return true; b.dataset.sure = "1"; b.textContent = t; setTimeout(() => { if (b.isConnected) b.dataset.sure = ""; }, 4000); return false; };
    const bcb = w.querySelector('[data-x="bc"]'); if (bcb) bcb.onclick = () => { const so = parseInt(w.querySelector("#gmBcSo").value, 10), ng = w.querySelector("#gmBcNg").value; if (!(so >= 1)) { toast("Chọn số bản cứng nhận được."); w.querySelector("#gmBcSo").focus(); return; } if (!/^\d{4}-\d{2}-\d{2}$/.test(ng)) { toast("Ghi ngày nhận bản cứng."); return; } bcDo(bcb, { act: "nhan", so, ngay: ng }, "Đã xác nhận nhận " + so + " bản cứng"); };
    const bch = w.querySelector('[data-x="bcHuy"]'); if (bch) bch.onclick = () => { if (sure(bch, "Bấm lần nữa để huỷ")) bcDo(bch, { act: "huy" }, "Đã huỷ xác nhận bản cứng"); };
    const tn = w.querySelector('[data-x="tuNhan"]'); if (tn) tn.onclick = () => { const so = parseInt(w.querySelector("#gmTnSo").value, 10); if (sure(tn, "Bấm lần nữa để xác nhận nhận " + so + " bản — sau đó không huỷ được")) bcDo(tn, { act: "tuNhan", so }, "Đã xác nhận nhận " + so + " bản cứng"); };
    const gi = w.querySelector('[data-x="giao"]'); if (gi) gi.onclick = () => { const cho_ = w.querySelector("#gmGiCho").value, so = parseInt(w.querySelector("#gmGiSo").value, 10); if (!cho_) { toast("Chọn người nhận bản cứng."); w.querySelector("#gmGiCho").focus(); return; } bcDo(gi, { act: "giao", cho: cho_, so }, "Đã ghi giao " + so + " bản cho " + cho_ + " — chờ người nhận xác nhận"); };
    w.querySelectorAll("[data-xn]").forEach(b => { b.onclick = () => { if (sure(b, "Bấm lần nữa để xác nhận — sau đó không huỷ được")) bcDo(b, { act: "xn", gid: b.dataset.xn }, "Đã xác nhận nhận bản cứng"); }; });
    w.querySelectorAll("[data-bo]").forEach(b => { b.onclick = () => { if (sure(b, "Bấm lần nữa để bỏ")) bcDo(b, { act: "bo", gid: b.dataset.bo }, "Đã bỏ dòng giao bản cứng"); }; });
    const dlb = w.querySelector('[data-x="del"]'); if (dlb) dlb.onclick = async () => { if (dlb.dataset.sure !== "1") { dlb.dataset.sure = "1"; dlb.textContent = "Bấm lần nữa để xoá"; setTimeout(() => { if (dlb.isConnected) { dlb.dataset.sure = ""; dlb.textContent = "Xoá"; } }, 3000); return; }
      try { await api("webGMDel", S.auth, r.id); r.xoa = true; w.remove(); toast("Đã xoá dòng gửi mẫu"); window.renderGM(); } catch (e) { toast(e.message); } };
    if (moi && ed) setTimeout(() => (lot || g("ten")).focus(), 50);
  }

  function prGM(nam, th) {
    const K = window.BMK, L = live().filter(r => String(r.d.ngay).slice(0, 4) === nam && (!th || String(r.d.ngay).slice(5, 7) === th)).sort((a, c) => String(a.d.ngay).localeCompare(String(c.d.ngay)) || String(a.luc || "").localeCompare(String(c.luc || "")) || String(a.id).localeCompare(String(c.id)));
    if (!L.length) { toast((th ? "Tháng " + +th + "/" : "Năm ") + nam + " chưa có mẫu gửi nào."); return; }
    const W = [3.5, 7.5, 16, 9.5, 5.5, 13, 5.5, 10, 5.5, 7.5, 7, 9.5, 9.5, 8], H = ["STT", "Ngày gởi mẫu", "Tên mẫu", "Nguồn gốc", "Số lượng", "Đơn vị KTCL", "Trạng thái", "Mã số hồ sơ", "Kết quả", "Ngày nhận", "Người lập", "Mục đích KTCL", "Ghi chú", "Người nhận bản cứng"], tw = W.reduce((a, c) => a + c, 0);
    const body = L.map((r, i) => { const d = r.d, t = ttOf(r); return `<tr><td class="c">${i + 1}</td><td class="c nw">${D(d.ngay)}</td><td>${E(d.ten)}${d.nsx ? "<br>NSX: " + D(d.nsx) : ""}${d.lo ? "<br>Số lô SX: " + E(d.lo) : ""}</td><td>${E(d.nguon || "")}</td><td class="c">${E(d.sl || "")}</td><td>${E(dvFull(d.dv))}</td><td class="c">${t === "Huỷ" ? "Huỷ" : "Đã gởi"}</td><td>${E(d.soHS || "")}</td><td class="c">${E(d.ketQua || "")}</td><td class="c nw">${D(d.ngayNhan)}</td><td>${E(d.nguoiLap || r.nguoi || "")}</td><td>${E(d.mucDich || "")}</td><td>${E([d.ghiChu || (t === "Đã có kết quả" ? "Hoàn thành" : ""), d.bc ? "Bản cứng: " + d.bc.so + " bản, " + d.bc.nguoi + " nhận " + D(d.bc.ngay) : ""].filter(Boolean).join(". "))}</td><td>${E(nhanTu(d.bc))}</td></tr>`; }).join("");
    K.pr(`${K.PCSS}<style>.pq.gmp table{table-layout:fixed;width:100%}.pq.gmp td,.pq.gmp th{font-size:9pt;padding:2px 3px;line-height:1.25;overflow-wrap:break-word}.pq.gmp td{vertical-align:top}.pq.gmp .c{text-align:center}.pq.gmp .nw{white-space:nowrap}.pq.gmp th{background:#e5e7eb}.pq.gmp h1{font-size:15pt;text-align:center;margin:0 0 6px}.pq.gmp thead{display:table-header-group}</style>
      <div class="pq gmp"><h1>SỔ THEO DÕI GỬI MẪU KIỂM TRA CHẤT LƯỢNG — ${th ? "THÁNG " + +th + "/" : "NĂM "}${E(nam)}</h1><table><colgroup>${W.map(x => `<col style="width:${(x / tw * 100).toFixed(2)}%">`).join("")}</colgroup><thead><tr>${H.map(t => `<th>${t}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>`, true);
  }

  /* ---- cho khung QC lô: các lần gửi mẫu của 1 lô + nút gửi mẫu điền sẵn ---- */
  window.gmLotBox = async function (el, it, l) {
    if (!el || !it || !l) return; try { if (!loaded) await load(); } catch (e) { el.innerHTML = ""; return; } if (!el.isConnected) return;
    /* khớp theo số lô; thêm điều kiện cùng sản phẩm (cùng mã, hoặc tên mẫu có chữ đầu nằm trong tên vật tư) để lô tên chung chung như "Nhập khẩu" không bắt nhầm mẫu của sản phẩm khác */
    const k = key(l.lo), tn = fold(it.ten), cung = r => r.d.ma ? r.d.ma === it.ma : (w => !w || tn.includes(w))((fold(r.d.ten).split(/\s+/).find(x => x.length >= 3) || ""));
    const L = live().filter(r => k && (key(r.d.lo) === k || key(r.d.nguon) === k) && cung(r)).sort((a, c) => String(c.d.ngay).localeCompare(String(a.d.ngay)));
    el.innerHTML = `<div class="gm-lot"><b>Gửi mẫu</b>${L.length ? L.map(r => `<div class="gm-lot-r" data-id="${E(r.id)}">${D(r.d.ngay)} · ${E(dvFull(r.d.dv))}${r.d.mucDich ? " · " + E(r.d.mucDich) : ""}${r.d.soHS ? " · " + E(r.d.soHS) : ""} ${kqChip(r)}</div>`).join("") : '<span class="note"> chưa gửi mẫu nào của lô này</span>'}${QC() ? '<button type="button" class="btn small" id="gmLotNew">+ Gửi mẫu lô này</button>' : ""}</div>`;
    el.querySelectorAll("[data-id]").forEach(x => x.onclick = e => { e.stopPropagation(); gmDlg(live().find(r => r.id === x.dataset.id)); });
    const nb = el.querySelector("#gmLotNew"); if (nb) nb.onclick = e => { e.stopPropagation(); gmDlg(null, { ten: it.ten, ma: it.ma, lo: l.lo, nsx: String(l.nsx || "").slice(0, 10), nguon: l.lo }); };
  };
  /* nhắc người được giao bản cứng ngay khi mở Sổ Kho (chấm số trên tab Gửi mẫu KTCL) */
  setTimeout(async () => { try { if (!loaded && typeof S !== "undefined" && S.auth && S.me) { await load(); } } catch (e) {} }, 6000);
  window.gmReload = async function () { loaded = false; if (S.tab === "gm") await window.renderGM(); };
})();
