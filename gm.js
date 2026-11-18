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
  const ttOf = r => r.d.huy ? "Huỷ" : (r.d.ketQua || r.d.xong) ? "Đã có kết quả" : "Chờ kết quả";
  let R = [], loaded = false, q = "", fNam = "", fDV = "", fTT = "";
  const live = () => R.filter(x => !x.xoa);
  async function load() { R = await api("webGMAll", S.auth); loaded = true; }
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
    const L = Y.filter(r => (!fDV || r.d.dv === fDV) && (!fTT || ttOf(r) === fTT) && (!W.length || (t => W.every(w => t.includes(w)))(fold([r.d.ten, r.d.lo, r.d.nguon, r.d.dv, r.d.mucDich, r.d.soHS, r.d.ghiChu, r.d.ma].join(" ")))));
    const ch = A.filter(r => ttOf(r) === "Chờ kết quả"), tre = ch.filter(r => cho(r) > HAN);
    const G = { "Chờ kết quả": [], "Đã có kết quả": [], "Huỷ": [] }; L.forEach(r => G[ttOf(r)].push(r)); G["Chờ kết quả"].reverse(); G["Đã có kết quả"].reverse(); /* mới gửi lên đầu */
    const row = r => { const d = r.d; return `<tr class="click" data-id="${E(r.id)}" style="cursor:pointer"><td style="text-align:center">${r._stt}</td><td>${D(d.ngay)}</td><td><b>${E(d.ten)}</b>${d.lo || d.nsx ? `<div class="note" style="margin:2px 0 0">${[d.lo ? "Lô " + E(d.lo) : "", d.nsx ? "NSX " + D(d.nsx) : ""].filter(Boolean).join(" · ")}</div>` : ""}</td><td>${E(d.nguon || "")}</td><td>${E(d.dv || "")}</td><td>${E(d.mucDich || "")}</td><td>${E(d.soHS || "")}${d.ngayNhan ? `<div class="note" style="margin:2px 0 0">nhận ${D(d.ngayNhan)}</div>` : ""}</td><td>${kqChip(r)}${d.ghiChu ? `<div class="note" style="margin:2px 0 0">${E(d.ghiChu)}</div>` : ""}</td></tr>`; };
    b.innerHTML = `<div class="tools tb-top"><input type="search" id="gmQ" value="${E(q)}" placeholder="Tìm mẫu: tên, số lô, đơn vị, mã số hồ sơ…" style="flex:1;min-width:220px">
        <select id="gmNam" style="width:auto">${nams.map(n => `<option${n === fNam ? " selected" : ""}>${n}</option>`).join("")}</select>
        <select id="gmDV" style="width:auto"><option value="">Tất cả đơn vị</option>${uniq("dv").map(x => `<option${x === fDV ? " selected" : ""}>${E(x)}</option>`).join("")}</select>
        <select id="gmTT" style="width:auto">${["", "Chờ kết quả", "Đã có kết quả", "Huỷ"].map(t => `<option value="${t}"${t === fTT ? " selected" : ""}>${t || "Tất cả trạng thái"}</option>`).join("")}</select>
        <button class="btn" type="button" id="gmPr">🖨 In sổ năm ${fNam}</button>${QC() ? '<button class="btn primary" type="button" id="gmNew">+ Ghi gửi mẫu</button>' : ""}</div>
      <p class="note" style="margin:0 0 8px">${ch.length ? `<b style="color:#b45309">${ch.length} mẫu chờ kết quả</b>${tre.length ? ` · <b style="color:#c62828">${tre.length} mẫu quá ${HAN} ngày</b>` : ""}` : "Không có mẫu chờ kết quả"} · năm ${fNam}: ${Y.length} mẫu${L.length !== Y.length ? ` · khớp ${L.length}` : ""}. Bấm vào mẫu để ghi mã số hồ sơ, kết quả.</p>
      ${L.length ? `<div class="dgx tb-tbl"><table><thead><tr><th style="width:44px">STT</th><th style="width:104px">Ngày gửi</th><th>Tên mẫu</th><th style="width:13%">Nguồn gốc</th><th style="width:11%">Đơn vị KTCL</th><th style="width:14%">Mục đích</th><th style="width:15%">Mã số hồ sơ</th><th style="width:138px">Kết quả</th></tr></thead><tbody>${Object.keys(G).filter(t => G[t].length).map(t => `<tr class="tb-gh"><td colspan="8">${t} <small>· ${G[t].length} mẫu</small></td></tr>` + G[t].map(row).join("")).join("")}</tbody></table></div>`
        : `<div class="empty"><b>${W.length || fDV || fTT ? "Không có mẫu nào khớp" : "Chưa có mẫu gửi nào trong năm " + fNam}</b></div>`}`;
    const on = (id, ev, f) => { const el = document.getElementById(id); if (el) el[ev] = f; };
    on("gmQ", "oninput", e => { q = e.target.value; clearTimeout(window.__gmQT); window.__gmQT = setTimeout(() => window.renderGM().then(() => { const el = document.getElementById("gmQ"); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }), 250); });
    on("gmNam", "onchange", e => { fNam = e.target.value; window.renderGM(); }); on("gmDV", "onchange", e => { fDV = e.target.value; window.renderGM(); }); on("gmTT", "onchange", e => { fTT = e.target.value; window.renderGM(); });
    on("gmNew", "onclick", () => gmDlg(null)); on("gmPr", "onclick", () => prGM(fNam));
    b.querySelectorAll("tr[data-id]").forEach(x => x.onclick = () => gmDlg(live().find(r => r.id === x.dataset.id)));
    if (window.pgActSync) window.pgActSync();
  };

  /* các lô BTP / thành phẩm / nguyên liệu đang có trên sổ kho — để chọn nhanh mẫu là lô nào */
  const lots = () => { const out = []; try { (S.items || []).forEach(it => { if (!it.theoLo || !/Bán thành phẩm|Thành phẩm|Nguyên liệu|Phân bón/.test(it.nhom || "")) return; (S.lots[it.ma] || []).forEach(l => l.lo && out.push({ ma: it.ma, ten: it.ten, lo: l.lo, nsx: String(l.nsx || "").slice(0, 10), nhom: it.nhom })); }); } catch (e) {} return out.sort((a, c) => (a.nhom === "Bán thành phẩm" ? 0 : 1) - (c.nhom === "Bán thành phẩm" ? 0 : 1) || String(c.lo).localeCompare(String(a.lo))); };

  function gmDlg(r, pre) {
    const moi = !r, ed = QC(), d = Object.assign({ ngay: today(), ten: "", ma: "", lo: "", nsx: "", nguon: "", sl: "", dv: "", mucDich: "", soHS: "", ketQua: "", ngayNhan: "", ghiChu: "", huy: false, xong: false, nguoiLap: (S.me && S.me.ten) || "" }, r ? r.d : (pre || {})), dis = ed ? "" : "disabled";
    const w = document.createElement("div"); w.className = "cfm";
    const f = (k, lb, at, full) => `<label${full ? ' style="grid-column:1/-1"' : ""}>${lb}<input data-k="${k}" value="${E(d[k] ?? "")}" ${at || ""} ${dis}></label>`;
    w.innerHTML = `<div class="cfm-box kh-dlg"><h2>${moi ? "Ghi gửi mẫu kiểm tra chất lượng" : "Mẫu gửi KTCL · " + E(d.ten)}</h2>${moi ? '<p class="note">Khi có kết quả, bấm vào dòng mẫu trong sổ để ghi mã số hồ sơ và kết quả.</p>' : ""}
      ${moi && ed ? `<label>Chọn lô trên sổ kho <small class="note">— gõ tên, mã hoặc số lô; mẫu không thuộc lô nào (mẫu PTN, mẫu mua…) thì bỏ qua</small><input id="gmLot" list="gmLotL" placeholder="VD: 2607.089, us-sinate…" data-opt autocomplete="off"></label>${dl("gmLotL", lots().map(x => x.lo + " · " + x.ten + " · " + x.ma))}` : ""}
      <div class="two qa-g">${f("ngay", "Ngày gửi mẫu", 'type="date"')}${f("sl", "Số lượng mẫu", 'list="gmSlL" placeholder="100ml / 100gr"')}
        ${f("ten", "Tên mẫu", "", true)}
        ${f("lo", "Số lô SX", 'data-opt')}${f("nsx", "NSX", 'type="date" data-opt')}
        ${f("nguon", "Nguồn gốc", 'list="gmNgL" placeholder="số lô, Mẫu PTN, Mẫu mua, BTP nhập khẩu…" data-opt')}${f("dv", "Đơn vị KTCL", 'list="gmDvL" placeholder="VinaCert, Quatest 3, Phía Nam…"')}
        ${f("mucDich", "Mục đích KTCL", 'list="gmMdL" placeholder="cập nhật date mới, hợp quy 54°C…" data-opt', true)}</div>
      <fieldset class="qa-fs" ${dis}${moi ? " hidden" : ""}><legend>Kết quả</legend><div class="two qa-g">${f("soHS", "Mã số hồ sơ / số phiếu kết quả", 'data-opt')}${f("ngayNhan", "Ngày nhận kết quả", 'type="date" data-opt')}
        <label>Kết quả<select data-k="ketQua" data-opt>${["", "Đạt", "Không đạt"].map(x => `<option value="${x}"${x === (d.ketQua || "") ? " selected" : ""}>${x || "— chưa có —"}</option>`).join("")}</select></label>${f("ghiChu", "Ghi chú", 'data-opt')}
        <label class="gm-ck"><input type="checkbox" data-c="xong" ${d.xong ? "checked" : ""}><span>Đã xong, không cần theo dõi nữa (không ghi kết quả)</span></label>
        <label class="gm-ck"><input type="checkbox" data-c="huy" ${d.huy ? "checked" : ""}><span>Huỷ mẫu này</span></label></div></fieldset>
      ${dl("gmSlL", ["100ml", "100gr", "500ml", "500gr"])}${dl("gmDvL", uniq("dv"))}${dl("gmMdL", uniq("mucDich"))}${dl("gmNgL", ["Mẫu PTN", "Mẫu mua", "BTP nhập khẩu", "Mẫu nhập khẩu"])}
      ${r ? `<p class="note">Người lập: ${E(d.nguoiLap || r.nguoi || "")}${r.sua ? " · sửa cuối: " + E(r.sua) : ""}</p>` : ""}
      <div class="actions">${!moi && ed ? '<button class="btn danger" type="button" data-x="del">Xoá</button>' : ""}<span style="flex:1"></span><button class="btn" type="button" data-x="close">Đóng</button>${ed ? '<button class="btn primary noic" type="button" data-x="save">Lưu</button>' : ""}</div></div>`;
    document.body.appendChild(w);
    const g = k => w.querySelector(`[data-k="${k}"]`), set = (k, v) => { const el = g(k); if (el && v != null) el.value = v; };
    const lot = w.querySelector("#gmLot"); if (lot) lot.onchange = () => { const v = lot.value, x = lots().find(y => y.lo + " · " + y.ten + " · " + y.ma === v); if (!x) return; set("ten", x.ten); set("lo", x.lo); set("nsx", x.nsx); set("nguon", x.lo); d.ma = x.ma; if (!g("sl").value) set("sl", /SL|EC|SC|OD|FS|ME|EW|SE/i.test(x.ten.split(" ").pop()) ? "100ml" : "100gr"); };
    w.querySelector('[data-x="close"]').onclick = () => w.remove();
    const sv = w.querySelector('[data-x="save"]'); if (sv) sv.onclick = async () => { const o = Object.assign({}, d); w.querySelectorAll("[data-k]").forEach(x => { o[x.dataset.k] = x.value.trim(); }); w.querySelectorAll("[data-c]").forEach(x => { o[x.dataset.c] = x.checked; });
      if (!/^\d{4}-\d{2}-\d{2}$/.test(o.ngay)) { toast("Ghi ngày gửi mẫu."); g("ngay").focus(); return; } if (!o.ten) { toast("Ghi tên mẫu."); g("ten").focus(); return; } if (!o.dv) { toast("Ghi đơn vị KTCL."); g("dv").focus(); return; }
      if (o.ketQua && !o.ngayNhan) o.ngayNhan = today();
      sv.disabled = true; try { const x = await api("webGMSave", S.auth, { id: r ? r.id : "", d: o }); const i = R.findIndex(y => y.id === x.id); if (i >= 0) R[i] = x; else R.push(x); w.remove(); toast(moi ? "Đã ghi mẫu gửi " + o.dv : "Đã lưu"); window.renderGM(); if (window.renderQC && S.tab === "qc") renderQC(); } catch (e) { toast(e.message); sv.disabled = false; } };
    const dlb = w.querySelector('[data-x="del"]'); if (dlb) dlb.onclick = async () => { if (dlb.dataset.sure !== "1") { dlb.dataset.sure = "1"; dlb.textContent = "Bấm lần nữa để xoá"; setTimeout(() => { if (dlb.isConnected) { dlb.dataset.sure = ""; dlb.textContent = "Xoá"; } }, 3000); return; }
      try { await api("webGMDel", S.auth, r.id); r.xoa = true; w.remove(); toast("Đã xoá dòng gửi mẫu"); window.renderGM(); } catch (e) { toast(e.message); } };
    if (moi && ed) setTimeout(() => (lot || g("ten")).focus(), 50);
  }

  function prGM(nam) {
    const K = window.BMK, L = live().filter(r => String(r.d.ngay).slice(0, 4) === nam).sort((a, c) => String(a.d.ngay).localeCompare(String(c.d.ngay)) || String(a.luc || "").localeCompare(String(c.luc || "")) || String(a.id).localeCompare(String(c.id)));
    if (!L.length) { toast("Năm " + nam + " chưa có mẫu gửi nào."); return; }
    const W = [4, 8, 20, 11, 6, 8, 7, 13, 6, 8, 7, 12, 12], H = ["STT", "Ngày gởi mẫu", "Tên mẫu", "Nguồn gốc", "Số lượng", "Đơn vị KTCL", "Trạng thái", "Mã số hồ sơ", "Kết quả", "Ngày nhận", "Người lập", "Mục đích KTCL", "Ghi chú"], tw = W.reduce((a, c) => a + c, 0);
    const body = L.map((r, i) => { const d = r.d, t = ttOf(r); return `<tr><td class="c">${i + 1}</td><td class="c nw">${D(d.ngay)}</td><td>${E(d.ten)}${d.nsx ? "<br>NSX: " + D(d.nsx) : ""}${d.lo ? "<br>Số lô SX: " + E(d.lo) : ""}</td><td>${E(d.nguon || "")}</td><td class="c">${E(d.sl || "")}</td><td>${E(d.dv || "")}</td><td class="c">${t === "Huỷ" ? "Huỷ" : "Đã gởi"}</td><td>${E(d.soHS || "")}</td><td class="c">${E(d.ketQua || "")}</td><td class="c nw">${D(d.ngayNhan)}</td><td>${E(d.nguoiLap || r.nguoi || "")}</td><td>${E(d.mucDich || "")}</td><td>${E(d.ghiChu || (t === "Đã có kết quả" ? "Hoàn thành" : ""))}</td></tr>`; }).join("");
    K.pr(`${K.PCSS}<style>.pq.gmp table{table-layout:fixed;width:100%}.pq.gmp td,.pq.gmp th{font-size:9pt;padding:2px 3px;line-height:1.25;overflow-wrap:break-word}.pq.gmp td{vertical-align:top}.pq.gmp .c{text-align:center}.pq.gmp .nw{white-space:nowrap}.pq.gmp th{background:#e5e7eb}.pq.gmp h1{font-size:15pt;text-align:center;margin:0 0 6px}.pq.gmp thead{display:table-header-group}</style>
      <div class="pq gmp"><h1>SỔ THEO DÕI GỬI MẪU KIỂM TRA CHẤT LƯỢNG — NĂM ${E(nam)}</h1><table><colgroup>${W.map(x => `<col style="width:${(x / tw * 100).toFixed(2)}%">`).join("")}</colgroup><thead><tr>${H.map(t => `<th>${t}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>`, true);
  }

  /* ---- cho khung QC lô: các lần gửi mẫu của 1 lô + nút gửi mẫu điền sẵn ---- */
  window.gmLotBox = async function (el, it, l) {
    if (!el || !it || !l) return; try { if (!loaded) await load(); } catch (e) { el.innerHTML = ""; return; } if (!el.isConnected) return;
    /* khớp theo số lô; thêm điều kiện cùng sản phẩm (cùng mã, hoặc tên mẫu có chữ đầu nằm trong tên vật tư) để lô tên chung chung như "Nhập khẩu" không bắt nhầm mẫu của sản phẩm khác */
    const k = key(l.lo), tn = fold(it.ten), cung = r => r.d.ma ? r.d.ma === it.ma : (w => !w || tn.includes(w))((fold(r.d.ten).split(/\s+/).find(x => x.length >= 3) || ""));
    const L = live().filter(r => k && (key(r.d.lo) === k || key(r.d.nguon) === k) && cung(r)).sort((a, c) => String(c.d.ngay).localeCompare(String(a.d.ngay)));
    el.innerHTML = `<div class="gm-lot"><b>Gửi mẫu KTCL</b>${L.length ? L.map(r => `<div class="gm-lot-r" data-id="${E(r.id)}">${D(r.d.ngay)} · ${E(r.d.dv || "")}${r.d.mucDich ? " · " + E(r.d.mucDich) : ""}${r.d.soHS ? " · " + E(r.d.soHS) : ""} ${kqChip(r)}</div>`).join("") : '<span class="note"> chưa gửi mẫu nào của lô này</span>'}${QC() ? '<button type="button" class="btn small" id="gmLotNew">+ Gửi mẫu lô này</button>' : ""}</div>`;
    el.querySelectorAll("[data-id]").forEach(x => x.onclick = e => { e.stopPropagation(); gmDlg(live().find(r => r.id === x.dataset.id)); });
    const nb = el.querySelector("#gmLotNew"); if (nb) nb.onclick = e => { e.stopPropagation(); gmDlg(null, { ten: it.ten, ma: it.ma, lo: l.lo, nsx: String(l.nsx || "").slice(0, 10), nguon: l.lo }); };
  };
  window.gmReload = async function () { loaded = false; if (S.tab === "gm") await window.renderGM(); };
})();
