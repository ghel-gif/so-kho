/* Sổ Kho — PHÒNG QA/QC
   QC-QT.02 Quy trình kiểm tra vật tư nhập kho (lần ban hành 02, 02/01/2026):
     BM.01 Sổ kiểm tra nhãn · BM.02 Sổ kiểm tra túi/cuộn màng · BM.03 Sổ kiểm tra chai/nắp · BM.04 Sổ kiểm tra thùng/hộp · BM.05 Sổ kiểm tra vật tư hằng ngày
   QC-QT.05 Quy trình xử lý đầu ra không phù hợp: BM.01 Sổ theo dõi sự không phù hợp.
   QC ghi vật tư về + kết quả kiểm tra (hạn 48 giờ, hàng gấp 60 phút) → TP. QA/QC xác nhận. Cột thu mua để trống, ký tay khi in. */
"use strict";
(function () {
  const E = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const D = s => { s = String(s || "").slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s.split("-").reverse().join("/") : s; };
  const DM = s => { s = String(s || "").slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s.slice(8, 10) + "/" + s.slice(5, 7) : s; };
  const N = v => { const x = parseFloat(String(v ?? "").replace(",", ".")); return isFinite(x) ? (Math.round(x * 1000) / 1000).toLocaleString("vi-VN") : ""; };
  const today = () => (window.S && S.today) || new Date().toISOString().slice(0, 10);
  const TP = () => !!(S.me && S.me.vaiTro === "Quản lý" && S.me.ten === "Nguyễn Ô Ghel"); /* TP. QA/QC xác nhận */
  const QC = () => !!(S.me && (S.me.qc || S.me.vaiTro === "Quản lý"));
  const META = (bm, ngay) => `Mã số: <b>${bm}</b><br>Phiên bản: 02<br>Ngày hiệu lực: ${ngay || "02/01/2026"}`;
  const OKV = ["Đạt", "Không đạt"];
  /* cỡ mẫu theo hướng dẫn kiểm tra (QC-HD.02 → 05) */
  const MAU = {
    NHAN: n => n >= 501 && n <= 3200 ? "13 mẫu (định lượng, kích thước: 10 mẫu; ngoại quan, khác: toàn bộ 13 mẫu) · cho phép 1 KPH" : n >= 3201 && n <= 35000 ? "20 mẫu (định lượng, kích thước: 10 mẫu; ngoại quan: toàn bộ) · cho phép 1 KPH" : "",
    TUI: n => MAU.NHAN(n),
    CHAI: n => n >= 501 && n <= 1200 ? "20 mẫu (định lượng: 10 mẫu; trải nhựa, ngoại quan: toàn bộ)" : n >= 1201 && n <= 10000 ? "32 mẫu (định lượng: 10 mẫu; trải nhựa, ngoại quan: toàn bộ)" : n >= 10001 && n <= 35000 ? "50 mẫu (định lượng: 10 mẫu; trải nhựa, ngoại quan: toàn bộ)" : n > 35000 ? "80 mẫu (định lượng: 10 mẫu; trải nhựa, ngoại quan: toàn bộ)" : "",
    THUNG: n => n >= 26 && n <= 150 ? "3 mẫu (kích thước, ngoại quan: toàn bộ mẫu)" : n > 150 ? "5 mẫu (kích thước, ngoại quan: toàn bộ mẫu)" : ""
  };
  const DAT = ["Đạt", "Không đạt"];
  const SO = {
    NHAN: { bm: "BM.01-QC-QT.02", ngan: "Nhãn", tieuDe: "SỔ KIỂM TRA NHÃN", hd: "QC-HD.04", nguong: 5, qc: "V (g/ml)", ten: "Tên nhãn", loaiTxt: "Loại nhãn",
      loai: ["Nhãn dán hồ", "Nhãn decal", "Nhãn phụ", "Dán thùng / dán hộp", "Túi", "Túi cuộn", "Hộp"],
      ct: [["chinhTa", "Chính tả", ["Đúng", "Sai"]], ["kichThuoc", "Kích thước", DAT], ["dinhLuong", "Định lượng", DAT], ["ngoaiQuan", "Ngoại quan", ["Bình thường", "Không đạt"]]],
      nang: "Sai font, sai kích thước, sai nội dung, sai vị trí hình ảnh so với file thiết kế (decal: không đứt bế, giấy lót đứt rời; dán thùng/hộp: cắt phạm)", nhe: "Nhòe màu nhưng vẫn đọc được nội dung, nhãn bị cắt xéo chiều rộng" },
    TUI: { bm: "BM.02-QC-QT.02", ngan: "Túi / cuộn màng", tieuDe: "SỔ KIỂM TRA TÚI/CUỘN MÀNG", hd: "QC-HD.02", nguong: 5, qc: "Quy cách", ten: "Tên thương phẩm", loaiTxt: "Loại bao bì",
      loai: ["Túi", "Túi cuộn", "Cuộn màng", "Túi không in (bạc / nhôm)", "Túi MPET"],
      ct: [["kichThuoc", "Kích thước", DAT], ["dinhLuong", "Định lượng", DAT], ["ngoaiQuan", "Ngoại quan", DAT]],
      nang: "Ngoại quan và nội dung sai với thiết kế, độ dày không đạt, sai kích thước, đường hàn bong tróc, lẫn túi lạ, rách túi", nhe: "Lệch màu, lệch khung chữ, nhòe màu nhưng không mất nội dung, nhăn nhúm, cắt sát biên" },
    CHAI: { bm: "BM.03-QC-QT.02", ngan: "Chai / nắp", tieuDe: "SỔ KIỂM TRA CHAI - NẮP", hd: "QC-HD.03", nguong: 5, qc: "Quy cách", ten: "Tên sản phẩm", loaiTxt: "Loại vật tư",
      loai: ["Chai", "Nắp", "Chai + nắp"],
      ct: [["dinhLuong", "Định lượng", DAT], ["ngoaiQuan", "Ngoại quan", DAT]],
      nang: "Không đủ định lượng, thủng, không seal, nổi bong bóng, trải nhựa không đều, chai bị biến dạng", nhe: "Miệng chai không phẳng, khó siết nắp" },
    THUNG: { bm: "BM.04-QC-QT.02", ngan: "Thùng / hộp", tieuDe: "SỔ KIỂM TRA THÙNG/HỘP", hd: "QC-HD.05", nguong: 2, qc: "Quy cách", ten: "Tên thùng/hộp", loaiTxt: "Loại vật tư",
      loai: ["Thùng", "Hộp"],
      ct: [["kichThuoc", "Kích thước", DAT], ["ngoaiQuan", "Ngoại quan", DAT]],
      nang: "Kích thước, thiết kế không đúng, rách, bong màng, dính keo, rách giấy", nhe: "Trầy xước, biến dạng" }
  };
  const ORDER = ["NHAN", "TUI", "CHAI", "THUNG"];
  const XN = ["Đạt", "Y/c: Điều chỉnh đợt sau", "Không đạt – trả NCC", "Không đạt – chấp nhận sử dụng (có email BLĐ)"];
  const TTQC = ["Bình thường", "Cách ly – chờ xử lý (nhãn vàng)", "Trả NCC (nhãn đỏ)"];

  let R = [], USERS = [], view = "vt", fSo = "", fTT = "", fThang = "", ngay5 = "", thangK = "";
  const live = L => L.filter(x => !x.xoa);
  const rec = id => R.find(x => x.id === id);
  async function load() { R = await api0("webQAAll", S.auth); try { if (!USERS.length) USERS = await api0("getUserNames"); } catch (e) {} }
  const box = () => document.getElementById("qaBox");
  const vt = () => live(R).filter(x => SO[x.loai]);
  /* hạn kiểm: 48 giờ từ lúc vật tư về (hàng gấp: 60 phút) */
  const tz7 = s => new Date(String(s).replace(" ", "T") + (String(s).length <= 16 ? ":00" : "") + "+07:00");
  const baseT = r => { const d = r.d; if (/^\d{2}:\d{2}/.test(d.gioNhap || "")) return tz7(d.ngayNhap + " " + d.gioNhap.slice(0, 5)); if (r.luc) { const t = tz7(String(r.luc).slice(0, 16)); if (!isNaN(t)) return t; } return tz7(d.ngayNhap + " 08:00"); };
  const hanT = r => new Date(baseT(r).getTime() + (r.d.gap ? 3600e3 : 48 * 3600e3));
  const hanTxt = r => { const ms = hanT(r) - Date.now(), h = Math.abs(ms) / 3600e3, t = h >= 1 ? Math.round(h) + " giờ" : Math.max(1, Math.round(h * 60)) + " phút";
    return ms < 0 ? `<b style="color:#c62828">quá hạn ${t}</b>` : `còn <b style="color:${h < 8 ? "#d97706" : "inherit"}">${t}</b>`; };
  const ttOf = r => r.d.tt || (r.d.xnQL ? "Đã xác nhận" : r.d.ketLuan ? "Chờ xác nhận" : "Chờ kiểm");
  const chip = r => { const t = ttOf(r), kl = r.d.ketLuan, c = t === "Chờ kiểm" ? "#d97706" : t === "Chờ xác nhận" ? "#7c3aed" : kl === "Không đạt" ? "#c62828" : "#2e7d32";
    return `<span class="st" style="background:${c};color:#fff;border-color:${c}">${E(t === "Đã xác nhận" ? (kl || "Đã xác nhận") + " · đã xác nhận" : t === "Chờ xác nhận" ? (kl || "") + " · chờ xác nhận" : "Chờ kiểm")}</span>`; };
  const soLoi = d => { const a = parseFloat(d.loiNang), b = parseFloat(d.loiNhe); return isFinite(a) || isFinite(b) ? (isFinite(a) ? a : 0) + (isFinite(b) ? b : 0) : (d.soLoi ?? ""); };
  const kqTxt = d => { const a = +d.loiNang || 0, b = +d.loiNhe || 0; if (!a && !b) return "Không phát hiện lỗi"; return [b ? "Phát hiện " + b + " lỗi nhỏ" : "", a ? (b ? "" : "Phát hiện ") + a + " lỗi nặng" : ""].filter(Boolean).join(", "); };
  /* gợi ý kết luận theo QC-HD: có lỗi nặng hoặc tiêu chí không đạt → Không đạt; lỗi nhẹ vượt ngưỡng (5 %, thùng/hộp 2 %) → Không đạt */
  const goiY = (so, d) => { const S0 = SO[so]; const bad = S0.ct.filter(([k, , o]) => d[k] && d[k] === o[1]).map(x => x[1]);
    if (+d.loiNang > 0) return ["Không đạt", "có " + d.loiNang + " lỗi nặng"];
    if (bad.length) return ["Không đạt", "tiêu chí " + bad.join(", ") + " không đạt"];
    const n = +d.soMau || 0, b = +d.loiNhe || 0; if (!n) return b ? null : (S0.ct.some(([k]) => d[k]) ? ["Đạt", "không có lỗi"] : null);
    const p = b / n * 100; return p > S0.nguong ? ["Không đạt", `lỗi nhẹ ${p.toFixed(1)} % > ${S0.nguong} %`] : ["Đạt", `lỗi nhẹ ${p.toFixed(1)} % ≤ ${S0.nguong} %`]; };

  /* ---------------- danh sách ---------------- */
  window.renderQA = async function () {
    const b = box(); if (!b) return;
    if (!S.me) { b.innerHTML = '<div class="empty">Vui lòng đăng nhập.</div>'; return; }
    if (!fThang) fThang = today().slice(0, 7); if (!ngay5) ngay5 = today(); if (!thangK) thangK = today().slice(0, 7);
    if (!b.dataset.ok) b.innerHTML = '<div class="empty"><span class="ldg">Đang tải sổ QA/QC…</span></div>';
    try { await load(); } catch (e) { b.innerHTML = `<div class="empty">${E(e.message)}</div>`; return; }
    b.dataset.ok = 1;
    const seg = [["vt", "Kiểm tra vật tư nhập (BM.01–04)"], ["ngay", "Sổ hằng ngày (BM.05)"], ["kph", "Sự không phù hợp (QC-QT.05)"]];
    let h = `<div class="seg subseg" style="margin-bottom:10px">${seg.map(([k, t]) => `<button type="button" data-v="${k}" aria-pressed="${k === view}">${t}</button>`).join("")}</div>`;
    if (view === "vt") {
      const all = vt(), cho = all.filter(r => ttOf(r) === "Chờ kiểm"), cxn = all.filter(r => ttOf(r) === "Chờ xác nhận");
      let L = all.filter(r => (!fSo || r.loai === fSo) && (!fThang || String(r.d.ngayNhap).slice(0, 7) === fThang || ttOf(r) !== "Đã xác nhận"));
      if (fTT) L = L.filter(r => fTT === "Không đạt" ? r.d.ketLuan === "Không đạt" : ttOf(r) === fTT);
      L.sort((a, c) => String(c.d.ngayNhap).localeCompare(String(a.d.ngayNhap)) || String(c.luc).localeCompare(String(a.luc)));
      h += `<div class="tools">${QC() ? '<button class="btn primary" type="button" id="qaNew">+ Ghi vật tư về</button>' : ""}
        <select id="qaFSo" style="width:auto"><option value="">Tất cả sổ</option>${ORDER.map(k => `<option value="${k}"${k === fSo ? " selected" : ""}>${SO[k].bm.slice(0, 5)} · ${SO[k].ngan}</option>`).join("")}</select>
        <select id="qaFTT" style="width:auto">${["", "Chờ kiểm", "Chờ xác nhận", "Đã xác nhận", "Không đạt"].map(t => `<option value="${t}"${t === fTT ? " selected" : ""}>${t || "Tất cả trạng thái"}</option>`).join("")}</select>
        <input type="month" id="qaFM" value="${E(fThang)}" style="width:auto" title="Tháng nhập (trống = tất cả)">
        <button class="btn" type="button" id="qaPr">🖨 In sổ ${fSo ? SO[fSo].bm.slice(0, 5) : "BM.01–04"}${fThang ? " tháng " + fThang.slice(5) + "/" + fThang.slice(0, 4) : ""}</button></div>
        <p class="note" style="margin:0 0 8px">${cho.length ? `<b style="color:#d97706">${cho.length} lô chờ kiểm</b> (hạn 48 giờ, hàng gấp 60 phút)` : "Không có lô chờ kiểm"} · ${cxn.length ? `<b style="color:#7c3aed">${cxn.length} lô chờ TP. QA/QC xác nhận</b>` : "không có lô chờ xác nhận"}. Lô chưa xác nhận luôn hiện, không theo tháng.</p>
        <div class="list">${L.length ? L.map(r => { const d = r.d, t = ttOf(r);
          return `<div class="row click" data-id="${E(r.id)}"><div class="name"><span class="st" style="background:#e0f2fe;color:#075985;border-color:#7dd3fc">${SO[r.loai].bm.slice(0, 5)}</span> ${E(d.ten)} ${chip(r)}${d.gap && t === "Chờ kiểm" ? ' <span class="st" style="background:#c62828;color:#fff;border-color:#c62828">GẤP</span>' : ""}</div><div class="kg">${N(d.sl)}<small>${E(d.dvt || "")}</small></div>
          <div class="meta">Về ${D(d.ngayNhap)}${d.gioNhap ? " " + E(d.gioNhap) : ""} · ${E(d.ncc || "—")}${d.npp ? " · NPP " + E(d.npp) : ""}${d.loaiVT ? " · " + E(d.loaiVT) : ""}${t === "Chờ kiểm" ? " · hạn kiểm " + hanTxt(r) : ` · kiểm ${D(d.ngayKT)} · ${E(d.nguoiKT || "")}${soLoi(d) !== "" ? " · " + soLoi(d) + " lỗi" : ""}`}${d.xnQL ? " · TP. QA/QC: <b>" + E(d.xnQL) + "</b>" : ""}${d.ycXuLy ? " · " + E(d.ycXuLy) : ""}</div></div>`; }).join("")
          : `<div class="empty"><b>Chưa có lô vật tư nào${fThang ? " trong tháng " + fThang.slice(5) + "/" + fThang.slice(0, 4) : ""}</b>${QC() ? "Bấm “Ghi vật tư về” khi nhà cung cấp giao hàng." : ""}</div>`}</div>`;
    } else if (view === "ngay") {
      const P = live(R).filter(x => x.loai === "KH" && x.d.duKien === ngay5), A = vt().filter(r => r.d.ngayNhap === ngay5).sort((a, c) => String(a.d.gioNhap || "").localeCompare(String(c.d.gioNhap || "")));
      h += `<div class="tools"><input type="date" id="qaN5" value="${E(ngay5)}" style="width:auto">${QC() ? '<button class="btn primary" type="button" id="qaKH">+ Thêm kế hoạch giao</button>' : ""}<button class="btn" type="button" id="qaPr5">🖨 In BM.05 ngày ${D(ngay5)}</button></div>
        <h3 style="margin:8px 0 4px">Kế hoạch giao (thu mua báo)</h3>
        <div class="dgx"><table><thead><tr><th>Dự kiến giao</th><th>NCC</th><th>Tên hàng</th><th>Đơn vị</th><th>Số lượng</th><th>Ghi chú</th></tr></thead><tbody>${P.length ? P.map(p => `<tr class="click" data-kh="${E(p.id)}" style="cursor:pointer"><td>${D(p.d.duKien)}${p.d.gio ? " " + E(p.d.gio) : ""}</td><td>${E(p.d.ncc)}</td><td>${E(p.d.ten)}</td><td>${E(p.d.dvt)}</td><td style="text-align:right">${N(p.d.sl)}</td><td>${E(p.d.ghiChu)}</td></tr>`).join("") : '<tr><td colspan="6" class="note">Chưa có kế hoạch giao cho ngày này.</td></tr>'}</tbody></table></div>
        <h3 style="margin:12px 0 4px">Thực tế giao (tự lấy từ các sổ BM.01–04)</h3>
        <div class="dgx"><table><thead><tr><th>Thời gian giao</th><th>NCC</th><th>Loại vật tư</th><th>Tên vật tư</th><th>Quy cách</th><th>NPP</th><th>Số lượng</th><th>Tình trạng</th><th>Đánh giá</th><th>Ghi chú</th><th>Kết quả</th></tr></thead><tbody>${A.length ? A.map(r => `<tr class="click" data-id="${E(r.id)}" style="cursor:pointer"><td>${D(r.d.ngayNhap)}${r.d.gioNhap ? " " + E(r.d.gioNhap) : ""}</td><td>${E(r.d.ncc)}</td><td>${E(r.d.loaiVT)}</td><td>${E(r.d.ten)}</td><td>${E(r.d.quyCach)}</td><td>${E(r.d.npp)}</td><td style="text-align:right">${N(r.d.sl)}</td><td>${E(r.d.tinhTrangKho || "")}</td><td>${E(r.d.ketLuan || "Chờ kiểm")}</td><td>${E(r.d.ghiChu)}</td><td>${E(r.d.xnQL || r.d.kqXuLy || "")}</td></tr>`).join("") : '<tr><td colspan="11" class="note">Chưa có vật tư về trong ngày này.</td></tr>'}</tbody></table></div>`;
    } else {
      const L = live(R).filter(x => x.loai === "KPH" && (!thangK || String(x.d.ngay).slice(0, 7) === thangK || !x.d.dong)).sort((a, c) => String(c.d.ngay).localeCompare(String(a.d.ngay)) || String(c.d.so).localeCompare(String(a.d.so)));
      h += `<div class="tools">${QC() ? '<button class="btn primary" type="button" id="qaNewK">+ Ghi sự không phù hợp</button>' : ""}<input type="month" id="qaKM" value="${E(thangK)}" style="width:auto"><button class="btn" type="button" id="qaPrK">🖨 In sổ BM.01-QC-QT.05${thangK ? " tháng " + thangK.slice(5) + "/" + thangK.slice(0, 4) : ""}</button></div>
        <p class="note" style="margin:0 0 8px">Sự KPH chưa xử lý xong luôn hiện, không theo tháng. Lô vật tư không đạt: mở lô ở sổ kiểm tra rồi bấm “Lập phiếu KPH”.</p>
        <div class="list">${L.length ? L.map(k => `<div class="row click" data-k="${E(k.id)}"><div class="name">${E(k.d.so)} · ${E(k.d.suKPH)} <span class="st" style="background:${k.d.dong ? "#2e7d32" : "#c62828"};color:#fff;border-color:${k.d.dong ? "#2e7d32" : "#c62828"}">${k.d.dong ? "Đã xử lý" : "Đang xử lý"}</span>${k.d.mucDo ? ` <span class="st">${E(k.d.mucDo)}</span>` : ""}</div><div class="kg">${N(k.d.slKPH)}<small>KPH</small></div>
          <div class="meta">${D(k.d.ngay)} · ${E(k.d.sanPham || "")}${k.d.bpPhatHien ? " · phát hiện: " + E(k.d.bpPhatHien) : ""}${k.d.khacPhuc ? " · khắc phục: " + E(String(k.d.khacPhuc).slice(0, 80)) : ""}</div></div>`).join("") : '<div class="empty"><b>Chưa có sự không phù hợp nào</b></div>'}</div>`;
    }
    b.innerHTML = h;
    b.querySelectorAll(".seg [data-v]").forEach(x => x.onclick = () => { view = x.dataset.v; renderQA(); });
    b.querySelectorAll("[data-id]").forEach(x => x.onclick = () => { const r = rec(x.dataset.id); if (r) vtDlg(r); });
    b.querySelectorAll("[data-kh]").forEach(x => x.onclick = () => { const r = rec(x.dataset.kh); if (r) khDlg(r); });
    b.querySelectorAll("[data-k]").forEach(x => x.onclick = () => { const r = rec(x.dataset.k); if (r) kphDlg(r); });
    const on = (id, ev, f) => { const el = document.getElementById(id); if (el) el[ev] = f; };
    on("qaNew", "onclick", () => vtDlg(null)); on("qaKH", "onclick", () => khDlg(null)); on("qaNewK", "onclick", () => kphDlg(null));
    on("qaFSo", "onchange", e => { fSo = e.target.value; renderQA(); }); on("qaFTT", "onchange", e => { fTT = e.target.value; renderQA(); }); on("qaFM", "onchange", e => { fThang = e.target.value; renderQA(); });
    on("qaN5", "onchange", e => { ngay5 = e.target.value || today(); renderQA(); }); on("qaKM", "onchange", e => { thangK = e.target.value; renderQA(); });
    on("qaPr", "onclick", () => prSo(fSo, fThang)); on("qaPr5", "onclick", () => prNgay(ngay5)); on("qaPrK", "onclick", () => prKPH(thangK));
  };

  /* ---------------- hộp thoại chung ---------------- */
  function dlg(title, body, wide) {
    const w = document.createElement("div"); w.className = "cfm";
    w.innerHTML = `<div class="cfm-box rd-dlg qa-dlg" style="max-width:min(${wide ? 980 : 720}px,97vw);width:${wide ? 980 : 720}px"><h2>${title}</h2>${body}</div>`;
    document.body.appendChild(w); return w;
  }
  const dl = (id, L) => `<datalist id="${id}">${[...new Set(L.filter(Boolean).map(x => String(x).trim()).filter(Boolean))].map(x => `<option value="${E(x)}">`).join("")}</datalist>`;
  const fld = (lab, html, full) => `<label${full ? ' style="grid-column:1/-1"' : ""}>${lab}${html}</label>`;
  const inp = (k, v, at) => `<input data-k="${k}" value="${E(v ?? "")}" ${at || ""}>`;
  const sel = (k, v, L, blank) => `<select data-k="${k}">${blank !== false ? `<option value="">${blank || "—"}</option>` : ""}${L.map(x => `<option${x === v ? " selected" : ""}>${E(x)}</option>`).join("")}${v && !L.includes(v) ? `<option selected>${E(v)}</option>` : ""}</select>`;
  const userSel = (k, v) => sel(k, v, USERS.length ? USERS : [S.me.ten], "— chọn —");
  async function save(o, msg) { const r = await api("webQASave", S.auth, o); toast(msg || "Đã lưu"); return r; }
  const qcCodes = () => (S.dg && S.dg.qc) || [];
  function codesFor(so) {
    const Q = qcCodes(), out = [];
    Q.forEach(q => { const v = (q.luong ? q.luong + " " + (q.dvl || "") : "").trim();
      if (so === "NHAN" || so === "TUI") { if (q.nhan) out.push([q.nhan, (so === "TUI" ? "Túi " : "Nhãn ") + q.sp + (v ? " - " + v : "") + " " + q.nhan, v]); }
      if (so === "CHAI" && q.chai) out.push([q.chai, "Chai " + q.chai + (q.moTaChai ? " (" + q.moTaChai + ")" : ""), v]);
      if (so === "THUNG") { if (q.hop) out.push([q.hop, "Hộp " + q.hop, ""]); if (q.thung) out.push([q.thung, "Thùng " + q.thung, ""]); } });
    const seen = new Set(); return out.filter(x => !seen.has(x[0]) && seen.add(x[0]));
  }

  /* ---------------- sổ kiểm tra vật tư (BM.01–04) ---------------- */
  function vtDlg(r, so0) {
    const isNew = !r, me = S.me.ten, d = r ? JSON.parse(JSON.stringify(r.d)) : { ngayNhap: today(), tinhTrangKho: "Bình thường", ngayKT: today(), nguoiKT: me, dvt: "cái" };
    let so = r ? r.loai : (so0 || fSo || "NHAN");
    const tp = TP(), locked = !!(r && r.d.xnQL && !tp), canEd = QC() && !locked;
    if (!d.nguoiKT) d.nguoiKT = me;
    const draw = () => {
      const S0 = SO[so], A = vt(), C = codesFor(so), ro = canEd ? "" : "disabled";
      const g = goiY(so, d);
      return `${isNew ? `<div class="seg subseg" style="margin-bottom:8px">${ORDER.map(k => `<button type="button" data-so="${k}" aria-pressed="${k === so}">${SO[k].bm.slice(0, 5)} · ${SO[k].ngan}</button>`).join("")}</div>` : `<p class="note" style="margin:0 0 6px"><b>${S0.bm}</b> · ${S0.tieuDe.toLowerCase()} · ghi bởi ${E(r.nguoi)}${r.sua && r.sua !== r.nguoi ? " · sửa cuối " + E(r.sua) : ""}${d.nguon ? " · " + E(d.nguon) : ""}</p>`}
        ${locked ? `<p class="note" style="background:#e8f5e9;padding:6px 8px;border-radius:6px">✓ TP. QA/QC đã xác nhận (${E(d.xnQLNguoi || "")}${d.xnQLLuc ? " · " + E(d.xnQLLuc) : ""}) — chỉ xem.</p>` : ""}
        <fieldset class="qa-fs" ${ro}><legend>Quản lý kho — vật tư về</legend><div class="two qa-g">
          ${fld("Ngày nhập", inp("ngayNhap", d.ngayNhap, 'type="date"'))}${fld("Giờ giao", inp("gioNhap", d.gioNhap, 'type="time"'))}
          ${fld("Nhà cung cấp", inp("ncc", d.ncc, 'list="qaNcc"') + dl("qaNcc", A.map(x => x.d.ncc)))}
          ${fld(S0.loaiTxt, inp("loaiVT", d.loaiVT, 'list="qaLoai"') + dl("qaLoai", S0.loai.concat(A.filter(x => x.loai === so).map(x => x.d.loaiVT))))}
          ${fld("Mã (theo danh mục quy cách)", inp("ma", d.ma, 'list="qaMa" placeholder="không bắt buộc"') + `<datalist id="qaMa">${C.map(c => `<option value="${E(c[0])}">${E(c[1])}</option>`).join("")}</datalist>`)}
          ${fld(S0.ten, inp("ten", d.ten, 'list="qaTen"') + dl("qaTen", A.filter(x => x.loai === so).map(x => x.d.ten)), true)}
          ${fld(S0.qc, inp("quyCach", d.quyCach))}${fld("Nhà phân phối", inp("npp", d.npp, 'list="qaNpp"') + dl("qaNpp", A.map(x => x.d.npp).concat(S.chuHang || [])))}
          ${fld("Số lượng thực tế", inp("sl", d.sl, 'type="number" step="any" min="0"'))}${fld("Đơn vị", inp("dvt", d.dvt, 'list="qaDvt"') + dl("qaDvt", ["cái", "kg", "cuộn", "bó", "thùng"]))}
          ${fld("Tình trạng khi nhận", inp("tinhTrangKho", d.tinhTrangKho, 'list="qaTTK"') + dl("qaTTK", ["Bình thường", "Móp / méo", "Ướt", "Thiếu số lượng", "Rách bao gói"]))}
          <label class="qa-chk"><input type="checkbox" data-k="gap"${d.gap ? " checked" : ""}> Hàng gấp — báo kết quả trong 60 phút</label>
        </div></fieldset>
        <fieldset class="qa-fs" ${ro}><legend>Kiểm tra (${S0.hd})</legend><div class="two qa-g">
          ${fld("Ngày kiểm tra", inp("ngayKT", d.ngayKT, 'type="date"'))}${fld("Người kiểm mẫu", userSel("nguoiKT", d.nguoiKT))}
          ${fld("Cỡ mẫu kiểm tra", inp("soMau", d.soMau, 'type="number" min="0" step="1"') + `<small class="note" id="qaMauG">${E(MAU[so](+d.sl || 0) ? "Theo " + S0.hd + ": " + MAU[so](+d.sl || 0) : (+d.sl ? "Cỡ lô " + N(d.sl) + ": ngoài bảng lấy mẫu của " + S0.hd : ""))}</small>`, true)}
          ${S0.ct.map(([k, t, o]) => fld(t, sel(k, d[k], o))).join("")}
          ${fld("Số lỗi nặng", inp("loiNang", d.loiNang, 'type="number" min="0" step="1"'))}${fld("Số lỗi nhẹ", inp("loiNhe", d.loiNhe, 'type="number" min="0" step="1"'))}
          <p class="note" style="grid-column:1/-1;margin:0">Lỗi nặng: ${E(S0.nang)}. · Lỗi nhẹ: ${E(S0.nhe)}.</p>
          ${fld("Ghi chú (mô tả lỗi)", `<textarea data-k="ghiChu" rows="2">${E(d.ghiChu || "")}</textarea>`, true)}
          ${so === "NHAN" ? fld("Kết quả", inp("ketQua", d.ketQua, `placeholder="${E(kqTxt(d))}"`)) + fld("Tình trạng", sel("tinhTrangQC", d.tinhTrangQC || "Bình thường", TTQC, false)) : ""}
          <div style="grid-column:1/-1"><b>Kết luận</b> <span class="qa-kl">${OKV.map(v => `<button type="button" class="btn small${d.ketLuan === v ? (v === "Đạt" ? " ok" : " bad") : ""}" data-kl="${v}" ${ro}>${v}</button>`).join(" ")}</span>
            <small class="note" id="qaGY">${g ? `Gợi ý theo ${S0.hd}: <b style="color:${g[0] === "Đạt" ? "#2e7d32" : "#c62828"}">${g[0]}</b> (${E(g[1])})` : "Ghi số mẫu, số lỗi để có gợi ý."}</small></div>
          ${fld(so === "NHAN" ? "Phiếu yêu cầu xử lý SPKPH" : so === "TUI" ? "Yêu cầu xử lý SP KPH" : "Phiếu yêu cầu xử lý SPKPH", inp("ycXuLy", d.ycXuLy, 'placeholder="số phiếu KPH (nếu có)"') + (r && canEd ? ` <button type="button" class="btn small" id="qaMkK">Lập phiếu KPH</button>` : ""), true)}
        </div></fieldset>
        <fieldset class="qa-fs" ${tp ? "" : "disabled"}><legend>Xác nhận</legend><div class="two qa-g">
          ${fld("Xác nhận của quản lý phòng QC (TP. QA/QC)", inp("xnQL", d.xnQL, 'list="qaXN"') + dl("qaXN", XN))}
          ${fld("Kết quả xử lý", inp("kqXuLy", d.kqXuLy))}
          <p class="note" style="grid-column:1/-1;margin:0">${d.xnQL ? "Đã xác nhận: " + E(d.xnQLNguoi || "") + (d.xnQLLuc ? " · " + E(d.xnQLLuc) : "") + ". " : ""}${tp ? "Xoá ô xác nhận rồi Lưu để mở lại cho QC sửa." : "Chỉ TP. QA/QC (Nguyễn Ô Ghel) xác nhận."} Xác nhận của bộ phận thu mua: ký tay trên bản in.</p>
        </div></fieldset>
        <div class="actions">${r && (tp || (canEd && r.nguoi === me)) ? '<button class="btn danger" type="button" data-a="del">Xoá</button>' : ""}<span style="flex:1"></span><button class="btn" type="button" data-a="x">Đóng</button>${canEd || tp ? '<button class="btn primary" type="button" data-a="sv">Lưu</button>' : ""}</div>`;
    };
    const w = dlg((isNew ? "Ghi vật tư về" : "Lô vật tư") + " — " + SO[so].bm, draw(), true), bx = w.querySelector(".cfm-box");
    const pull = () => { bx.querySelectorAll("[data-k]").forEach(el => { const k = el.dataset.k; d[k] = el.type === "checkbox" ? el.checked : el.value.trim(); }); };
    const re = () => { const y = bx.scrollTop; bx.innerHTML = `<h2>${(isNew ? "Ghi vật tư về" : "Lô vật tư") + " — " + SO[so].bm}</h2>` + draw(); wire(); bx.scrollTop = y; };
    const hint = () => { const g = goiY(so, d), el = bx.querySelector("#qaGY"), S0 = SO[so]; if (el) el.innerHTML = g ? `Gợi ý theo ${S0.hd}: <b style="color:${g[0] === "Đạt" ? "#2e7d32" : "#c62828"}">${g[0]}</b> (${E(g[1])})` : "Ghi số mẫu, số lỗi để có gợi ý.";
      const m = bx.querySelector("#qaMauG"), t = MAU[so](+d.sl || 0); if (m) m.textContent = t ? "Theo " + S0.hd + ": " + t : (+d.sl ? "Cỡ lô " + N(d.sl) + ": ngoài bảng lấy mẫu của " + S0.hd : "");
      const k = bx.querySelector('[data-k="ketQua"]'); if (k) k.placeholder = kqTxt(d); };
    function wire() {
      bx.querySelectorAll("[data-so]").forEach(x => x.onclick = () => { pull(); so = x.dataset.so; re(); });
      bx.querySelectorAll("[data-k]").forEach(el => el.addEventListener("change", () => { pull(); hint(); }));
      const ma = bx.querySelector('[data-k="ma"]'); if (ma) ma.addEventListener("change", () => { const c = codesFor(so).find(x => x[0] === ma.value.trim()); if (!c) return; const t = bx.querySelector('[data-k="ten"]'), q = bx.querySelector('[data-k="quyCach"]'); if (t && !t.value.trim()) t.value = c[1]; if (q && !q.value.trim() && c[2]) q.value = c[2]; pull(); });
      bx.querySelectorAll("[data-kl]").forEach(x => x.onclick = () => { pull(); d.ketLuan = d.ketLuan === x.dataset.kl ? "" : x.dataset.kl; re(); });
      const mk = bx.querySelector("#qaMkK"); if (mk) mk.onclick = async () => { pull(); try { const o = await save({ id: r.id, loai: so, d }, "Đã lưu lô vật tư"); Object.assign(d, o.d); w.remove(); kphDlg(null, { ngay: d.ngayKT || today(), suKPH: "Vật tư nhập không đạt: " + d.ten, nn: { vatTu: true }, hienTrang: d.ghiChu || "", moTa: [d.loaiVT, d.ncc ? "NCC " + d.ncc : "", d.ngayNhap ? "về " + D(d.ngayNhap) : ""].filter(Boolean).join(" · "), sanPham: [d.ten, d.npp, d.quyCach].filter(Boolean).join(" - "), slKPH: soLoi(d), slKT: d.soMau || "", mucDo: +d.loiNang > 0 ? "Nặng" : "Nhẹ", bpPhatHien: "Phòng QA/QC", bpLienQuan: "Thu mua", nguon: r.id }); } catch (e) { toast(e.message); } };
      bx.querySelector('[data-a="x"]').onclick = () => w.remove();
      const dv = bx.querySelector('[data-a="del"]'); if (dv) dv.onclick = async () => { if (!await askConfirm(["Xoá lô vật tư này khỏi sổ?"])) return; try { await api("webQADel", S.auth, r.id, false); toast("Đã xoá"); w.remove(); renderQA(); } catch (e) { toast(e.message); } };
      const sv = bx.querySelector('[data-a="sv"]'); if (sv) sv.onclick = async () => { pull(); if (!d.ten) { toast("Ghi " + SO[so].ten.toLowerCase() + "."); return; }
        if (!d.ketQua && so === "NHAN" && d.ketLuan) d.ketQua = kqTxt(d); if (d.loiNang !== "" || d.loiNhe !== "") d.soLoi = soLoi(d);
        sv.disabled = true; try { await save({ id: r && r.id, loai: so, d }, d.xnQL && tp ? "Đã lưu và xác nhận" : d.ketLuan ? "Đã lưu kết quả kiểm tra — chờ TP. QA/QC xác nhận" : "Đã ghi vật tư về — chờ kiểm (hạn 48 giờ)"); w.remove(); renderQA(); } catch (e) { sv.disabled = false; toast(e.message); } };
    }
    bx.addEventListener("input", () => { pull(); hint(); });
    wire();
  }

  /* ---------------- BM.05: kế hoạch giao ---------------- */
  function khDlg(r) {
    const d = r ? Object.assign({}, r.d) : { duKien: ngay5 || today(), dvt: "cái" }, ed = QC();
    const w = dlg(r ? "Kế hoạch giao" : "Thêm kế hoạch giao (BM.05)", `<fieldset class="qa-fs" ${ed ? "" : "disabled"}><div class="two qa-g">
      ${fld("Ngày dự kiến giao", inp("duKien", d.duKien, 'type="date"'))}${fld("Giờ", inp("gio", d.gio, 'type="time"'))}
      ${fld("Nhà cung cấp", inp("ncc", d.ncc, 'list="qaNcc2"') + dl("qaNcc2", live(R).map(x => x.d.ncc)))}${fld("Tên hàng", inp("ten", d.ten))}
      ${fld("Đơn vị", inp("dvt", d.dvt))}${fld("Số lượng", inp("sl", d.sl, 'type="number" step="any" min="0"'))}
      ${fld("Ghi chú", inp("ghiChu", d.ghiChu), true)}</div></fieldset>
      <div class="actions">${r && ed ? '<button class="btn danger" type="button" data-a="del">Xoá</button>' : ""}<span style="flex:1"></span><button class="btn" type="button" data-a="x">Đóng</button>${ed ? '<button class="btn primary" type="button" data-a="sv">Lưu</button>' : ""}</div>`);
    const bx = w.querySelector(".cfm-box"), pull = () => bx.querySelectorAll("[data-k]").forEach(el => d[el.dataset.k] = el.value.trim());
    bx.querySelector('[data-a="x"]').onclick = () => w.remove();
    const dv = bx.querySelector('[data-a="del"]'); if (dv) dv.onclick = async () => { try { await api("webQADel", S.auth, r.id, false); toast("Đã xoá"); w.remove(); renderQA(); } catch (e) { toast(e.message); } };
    const sv = bx.querySelector('[data-a="sv"]'); if (sv) sv.onclick = async () => { pull(); sv.disabled = true; try { await save({ id: r && r.id, loai: "KH", d }); ngay5 = d.duKien || ngay5; w.remove(); renderQA(); } catch (e) { sv.disabled = false; toast(e.message); } };
  }

  /* ---------------- QC-QT.05: sổ theo dõi sự không phù hợp ---------------- */
  const NN = [["thietBi", "Thiết bị"], ["vatTu", "Vật tư"], ["nguyenLieu", "Nguyên liệu"], ["quaTrinh", "Quá trình"], ["conNguoi", "Con người"]];
  const tiLe = d => { const a = parseFloat(d.slKPH), b = parseFloat(d.slKT); return isFinite(a) && b > 0 ? (a / b * 100).toFixed(2).replace(/\.?0+$/, "") + " %" : ""; };
  function kphDlg(r, seed) {
    const d = r ? JSON.parse(JSON.stringify(r.d)) : Object.assign({ ngay: today(), nn: {}, bpPhatHien: "Phòng QA/QC" }, seed || {}), ed = QC();
    if (!d.nn) d.nn = {};
    const w = dlg(r ? "Sự không phù hợp " + E(d.so || "") : "Ghi sự không phù hợp (BM.01-QC-QT.05)", `<fieldset class="qa-fs" ${ed ? "" : "disabled"}><div class="two qa-g">
      ${fld("Ngày", inp("ngay", d.ngay, 'type="date"'))}${fld("Số phiếu", inp("so", d.so, 'placeholder="tự đánh số KPH-yyMM-nn"'))}
      ${fld("Sự không phù hợp", inp("suKPH", d.suKPH), true)}
      <div style="grid-column:1/-1"><b>Nguyên nhân</b> ${NN.map(([k, t]) => `<label class="qa-chk" style="display:inline-flex;margin-right:12px"><input type="checkbox" data-nn="${k}"${d.nn[k] ? " checked" : ""}> ${t}</label>`).join("")}</div>
      ${fld("Hiện trạng lỗi", `<textarea data-k="hienTrang" rows="2">${E(d.hienTrang || "")}</textarea>`)}${fld("Mô tả chi tiết", `<textarea data-k="moTa" rows="2">${E(d.moTa || "")}</textarea>`)}
      ${fld("Sản phẩm - Nhà phân phối - Ngày sản xuất - Quy cách", inp("sanPham", d.sanPham), true)}
      ${fld("Số lượng sản phẩm KPH", inp("slKPH", d.slKPH, 'type="number" step="any" min="0"'))}${fld("Số lượng thùng có sản phẩm KPH", inp("slThung", d.slThung, 'type="number" step="any" min="0"'))}
      ${fld("Số lượng đvsp kiểm tra", inp("slKT", d.slKT, 'type="number" step="any" min="0"'))}${fld("Tỉ lệ KPH", `<input id="qaTL" value="${E(tiLe(d))}" disabled>`)}
      ${fld("Mức độ lỗi", sel("mucDo", d.mucDo, ["Nhẹ", "Nặng"]))}${fld("Bộ phận phát hiện", inp("bpPhatHien", d.bpPhatHien))}
      ${fld("Sự khắc phục", `<textarea data-k="khacPhuc" rows="2">${E(d.khacPhuc || "")}</textarea>`)}${fld("Hành động khắc phục", `<textarea data-k="hanhDong" rows="2">${E(d.hanhDong || "")}</textarea>`)}
      ${fld("Bộ phận liên quan", inp("bpLienQuan", d.bpLienQuan))}
      <label class="qa-chk"><input type="checkbox" data-k="dong"${d.dong ? " checked" : ""}> Đã xử lý xong${d.dongNguoi ? " (" + E(d.dongNguoi) + (d.dongLuc ? " · " + E(d.dongLuc) : "") + ")" : ""}</label>
      </div></fieldset>
      ${d.nguon && rec(d.nguon) ? `<p class="note">Từ lô vật tư: <a href="#" id="qaSrc">${E(rec(d.nguon).d.ten)}</a></p>` : ""}
      <div class="actions">${r && ed ? '<button class="btn danger" type="button" data-a="del">Xoá</button>' : ""}<span style="flex:1"></span><button class="btn" type="button" data-a="x">Đóng</button>${ed ? '<button class="btn primary" type="button" data-a="sv">Lưu</button>' : ""}</div>`, true);
    const bx = w.querySelector(".cfm-box");
    const pull = () => { bx.querySelectorAll("[data-k]").forEach(el => d[el.dataset.k] = el.type === "checkbox" ? el.checked : el.value.trim()); bx.querySelectorAll("[data-nn]").forEach(el => d.nn[el.dataset.nn] = el.checked); };
    bx.addEventListener("input", () => { pull(); const t = bx.querySelector("#qaTL"); if (t) t.value = tiLe(d); });
    bx.querySelector('[data-a="x"]').onclick = () => w.remove();
    const src = bx.querySelector("#qaSrc"); if (src) src.onclick = ev => { ev.preventDefault(); w.remove(); vtDlg(rec(d.nguon)); };
    const dv = bx.querySelector('[data-a="del"]'); if (dv) dv.onclick = async () => { if (!await askConfirm(["Xoá sự không phù hợp này?"])) return; try { await api("webQADel", S.auth, r.id, false); toast("Đã xoá"); w.remove(); renderQA(); } catch (e) { toast(e.message); } };
    const sv = bx.querySelector('[data-a="sv"]'); if (sv) sv.onclick = async () => { pull(); sv.disabled = true;
      try { const o = await save({ id: r && r.id, loai: "KPH", d }, "Đã lưu sự không phù hợp");
        if (!r && d.nguon) { const v = rec(d.nguon); if (v && !v.d.ycXuLy) { try { await api("webQASave", S.auth, { id: v.id, loai: v.loai, d: Object.assign({}, v.d, { ycXuLy: o.d.so }) }); } catch (e) {} } }
        w.remove(); view = "kph"; renderQA(); } catch (e) { sv.disabled = false; toast(e.message); } };
  }

  /* ---------------- bản in ---------------- */
  const PRCSS = `<style>.pq.qap td,.pq.qap th{font-size:8.5pt;padding:2px 3px;line-height:1.25}.pq.qap th{font-size:8pt}.pq.qap .qgrp th{font-size:9pt;background:#e5e7eb}.pq.qap .hd .tt{font-size:14pt}.pq.qap .hd td{font-size:9.5pt}</style>`;
  const pr = (bm, title, tbl, ngay) => { const K = window.BMK; K.pr(`${K.PCSS}${PRCSS}<div class="pq qap">${K.head(title, META(bm, ngay))}<div class="gap"></div>${tbl}</div>`, true); };
  const COLS = {
    NHAN: [["Quản lý kho", [["Ngày nhập", r => D(r.d.ngayNhap), 6], ["Nhà cung cấp", r => r.d.ncc, 6], ["Loại nhãn", r => r.d.loaiVT, 5], ["Tên nhãn", r => r.d.ten, 12], ["V (g/ml)", r => r.d.quyCach, 4], ["Nhà phân phối", r => r.d.npp, 5], ["Số lượng thực tế", r => N(r.d.sl), 5], ["Tình trạng", r => r.d.tinhTrangKho, 4]]],
      ["Kiểm tra", [["Ngày kiểm tra", r => D(r.d.ngayKT), 5], ["Người kiểm mẫu", r => r.d.nguoiKT, 4], ["Chính tả", r => r.d.chinhTa, 3.5], ["Kích thước", r => r.d.kichThuoc, 3.5], ["Định lượng", r => r.d.dinhLuong, 3.5], ["Ngoại quan", r => r.d.ngoaiQuan, 4], ["Số lượng lỗi", r => soLoi(r.d), 3], ["Ghi chú", r => r.d.ghiChu, 11], ["Kết quả", r => r.d.ketQua || (r.d.ketLuan ? kqTxt(r.d) : ""), 5], ["Tình trạng", r => r.d.tinhTrangQC || (r.d.ketLuan ? "Bình thường" : ""), 4]]],
      ["Xác nhận", [["Xác nhận của quản lý phòng QC", r => r.d.xnQL, 6], ["Xác nhận của bộ phận thu mua", () => "", 5], ["Kết quả xử lý", r => r.d.kqXuLy, 5]]]],
    TUI: [["Quản lý kho", [["Ngày nhập vật tư", r => D(r.d.ngayNhap), 6], ["Nhà cung cấp", r => r.d.ncc, 6], ["Loại bao bì", r => r.d.loaiVT, 5], ["Tên thương phẩm", r => r.d.ten, 13], ["Quy cách", r => r.d.quyCach, 4.5], ["Số lượng", r => N(r.d.sl), 5], ["Phân phối", r => r.d.npp, 5], ["Tình trạng", r => r.d.tinhTrangKho, 4.5]]],
      ["Kiểm tra", [["Ngày kiểm tra", r => D(r.d.ngayKT), 5], ["Người kiểm tra", r => r.d.nguoiKT, 4.5], ["Kích thước", r => r.d.kichThuoc, 4], ["Định lượng", r => r.d.dinhLuong, 4], ["Ngoại quan", r => r.d.ngoaiQuan, 4], ["Kết luận", r => r.d.ketLuan, 4], ["Ghi chú", r => r.d.ghiChu, 11], ["Yêu cầu xử lý SP KPH", r => r.d.ycXuLy, 5]]],
      ["Xác nhận", [["Xác nhận quản lý phòng QC", r => r.d.xnQL, 6], ["Xác nhận của bộ phận thu mua", () => "", 5], ["Kết quả xử lý", r => r.d.kqXuLy, 5]]]],
    CHAI: [["Quản lý kho", [["Ngày nhập", r => D(r.d.ngayNhap), 6], ["Nhà cung cấp", r => r.d.ncc, 7], ["Loại vật tư", r => r.d.loaiVT, 5], ["Tên sản phẩm", r => r.d.ten, 14], ["Quy cách", r => r.d.quyCach, 5], ["Số lượng", r => N(r.d.sl), 5], ["Tình trạng", r => r.d.tinhTrangKho, 5]]],
      ["Kiểm tra", [["Ngày kiểm tra", r => D(r.d.ngayKT), 5.5], ["Người kiểm tra", r => r.d.nguoiKT, 5], ["Định lượng", r => r.d.dinhLuong, 4.5], ["Ngoại quan", r => r.d.ngoaiQuan, 4.5], ["Ghi chú", r => r.d.ghiChu, 12], ["Kết luận", r => r.d.ketLuan, 4.5], ["Phiếu yêu cầu xử lý SPKPH", r => r.d.ycXuLy, 6]]],
      ["Xác nhận", [["Xác nhận quản lý phòng QC", r => r.d.xnQL, 6.5], ["Xác nhận của phòng vật tư", () => "", 5.5], ["Kết quả xử lý", r => r.d.kqXuLy, 5.5]]]],
    THUNG: [["Quản lý kho", [["Ngày nhập", r => D(r.d.ngayNhap), 6.5], ["Nhà cung cấp", r => r.d.ncc, 7.5], ["Loại vật tư", r => r.d.loaiVT, 5.5], ["Tên thùng/hộp", r => r.d.ten, 15], ["Quy cách", r => r.d.quyCach, 6], ["Số lượng", r => N(r.d.sl), 5.5], ["Trạng thái", r => r.d.tinhTrangKho, 5.5]]],
      ["Kiểm tra", [["Kích thước", r => r.d.kichThuoc, 5], ["Ngoại quan", r => r.d.ngoaiQuan, 5], ["Ghi chú", r => r.d.ghiChu, 13], ["Kết luận", r => r.d.ketLuan, 5], ["Phiếu yêu cầu xử lý SPKPH", r => r.d.ycXuLy, 6]]],
      ["Xác nhận", [["Xác nhận của quản lý phòng QC", r => r.d.xnQL, 7], ["Xác nhận của bộ phận vật tư", () => "", 6], ["Kết quả xử lý", r => r.d.kqXuLy, 6]]]]
  };
  const tblOf = (G, L, pad) => { const C = G.flatMap(g => g[1]), tw = C.reduce((s, c) => s + c[2], 0);
    return `<table><colgroup>${C.map(c => `<col style="width:${(c[2] / tw * 100).toFixed(2)}%">`).join("")}</colgroup><thead><tr class="qgrp">${G.map(g => `<th colspan="${g[1].length}">${E(g[0])}</th>`).join("")}</tr><tr>${C.map(c => `<th>${E(c[0])}</th>`).join("")}</tr></thead>
      <tbody>${L.map(r => `<tr>${C.map(c => `<td>${E(c[1](r) ?? "")}</td>`).join("")}</tr>`).join("")}${Array(Math.max(1, (pad || 0) - L.length)).fill("<tr>" + C.map(() => "<td>&nbsp;</td>").join("") + "</tr>").join("")}</tbody></table>`; };
  function prSo(so, thang) {
    const ks = so ? [so] : ORDER, yr = (thang || today()).slice(0, 4);
    const parts = ks.map(k => { const L = vt().filter(r => r.loai === k && (thang ? String(r.d.ngayNhap).slice(0, 7) === thang : String(r.d.ngayNhap).slice(0, 4) === yr)).sort((a, c) => String(a.d.ngayNhap).localeCompare(String(c.d.ngayNhap)) || String(a.luc).localeCompare(String(c.luc)));
      if (!L.length && !so) return ""; return [k, L]; }).filter(Boolean);
    if (!parts.length) { toast("Chưa có lô vật tư nào trong " + (thang ? "tháng " + thang.slice(5) + "/" + yr : "năm " + yr) + "."); return; }
    const K = window.BMK, html = parts.map(([k, L], i) => `<div class="pq qap"${i ? ' style="break-before:page"' : ""}>${K.head(SO[k].tieuDe + (thang ? " THÁNG " + thang.slice(5) : "") + " NĂM " + yr, META(SO[k].bm))}<div class="gap"></div>${tblOf(COLS[k], L, 12)}</div>`).join("");
    K.pr(`${K.PCSS}${PRCSS}${html}`, true);
  }
  function prNgay(n) {
    const P = live(R).filter(x => x.loai === "KH" && x.d.duKien === n), A = vt().filter(r => r.d.ngayNhap === n).sort((a, c) => String(a.d.gioNhap || "").localeCompare(String(c.d.gioNhap || ""))), m = Math.max(P.length, A.length, 12);
    const W = [8, 7, 11, 4, 5, 6, 7, 7, 6, 11, 6, 6, 5, 5, 5, 7, 6], C = (v, r) => `<td${r ? ' style="text-align:right"' : ""}>${E(v ?? "")}</td>`;
    const rows = Array.from({ length: m }, (_, i) => { const p = P[i], a = A[i];
      return `<tr>${p ? C(D(p.d.duKien) + (p.d.gio ? " " + p.d.gio : "")) + C(p.d.ncc) + C(p.d.ten) + C(p.d.dvt) + C(N(p.d.sl), 1) + C(p.d.ghiChu) : "<td>&nbsp;</td>".repeat(6)}${a ? C(D(a.d.ngayNhap) + (a.d.gioNhap ? " " + a.d.gioNhap : "")) + C(a.d.ncc) + C(a.d.loaiVT) + C(a.d.ten) + C(a.d.quyCach) + C(a.d.npp) + C(N(a.d.sl), 1) + C(a.d.tinhTrangKho) + C(a.d.ketLuan || "Chờ kiểm") + C(a.d.ghiChu) + C(a.d.xnQL || a.d.kqXuLy) : "<td>&nbsp;</td>".repeat(11)}</tr>`; }).join("");
    pr("BM.05-QC-QT.02", "SỔ KIỂM TRA VẬT TƯ HẰNG NGÀY<br><span style=\"font-size:11pt;font-weight:400\">Ngày " + D(n) + "</span>", `<table><colgroup>${W.map(x => `<col style="width:${x}%">`).join("")}</colgroup><thead><tr class="qgrp"><th colspan="6">KẾ HOẠCH</th><th colspan="11">THỰC TẾ</th></tr><tr>${["Dự kiến giao", "NCC", "Tên hàng", "Đơn vị", "Số lượng", "Ghi chú", "Thời gian giao", "NCC", "Loại vật tư", "Tên vật tư", "Quy cách", "NPP", "Số lượng", "Tình trạng", "Đánh giá", "Ghi chú", "Kết quả"].map(t => `<th>${t}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`);
  }
  function prKPH(thang) {
    const yr = (thang || today()).slice(0, 4), L = live(R).filter(x => x.loai === "KPH" && (thang ? String(x.d.ngay).slice(0, 7) === thang : String(x.d.ngay).slice(0, 4) === yr)).sort((a, c) => String(a.d.ngay).localeCompare(String(c.d.ngay)) || String(a.d.so).localeCompare(String(c.d.so)));
    const ck = v => v ? "✓" : "", W = [3, 5, 9, 3.5, 3.5, 3.5, 3.5, 3.5, 8, 9, 9, 4, 4, 4, 4, 4, 7, 7, 5, 5, 5];
    const body = L.map((k, i) => `<tr><td style="text-align:center">${i + 1}</td><td>${D(k.d.ngay)}</td><td>${E(k.d.suKPH)}</td>${NN.map(([n]) => `<td style="text-align:center">${ck(k.d.nn && k.d.nn[n])}</td>`).join("")}<td>${E(k.d.hienTrang)}</td><td>${E(k.d.moTa)}</td><td>${E(k.d.sanPham)}</td><td style="text-align:right">${N(k.d.slKPH)}</td><td style="text-align:right">${N(k.d.slThung)}</td><td style="text-align:right">${N(k.d.slKT)}</td><td style="text-align:right">${E(tiLe(k.d))}</td><td>${E(k.d.mucDo)}</td><td>${E(k.d.khacPhuc)}</td><td>${E(k.d.hanhDong)}</td><td>${E(k.d.so)}</td><td>${E(k.d.bpPhatHien)}</td><td>${E(k.d.bpLienQuan)}</td></tr>`).join("") + Array(Math.max(1, 10 - L.length)).fill(`<tr>${"<td>&nbsp;</td>".repeat(21)}</tr>`).join("");
    pr("BM.01-QC-QT.05", (thang ? "THÁNG " + thang.slice(5) + " NĂM " + yr : "NĂM " + yr) + " — SỔ THEO DÕI SỰ KHÔNG PHÙ HỢP", `<table><colgroup>${W.map(x => `<col style="width:${x}%">`).join("")}</colgroup><thead><tr class="qgrp"><th rowspan="2">STT</th><th rowspan="2">Ngày</th><th rowspan="2">Sự KPH</th><th colspan="5">NGUYÊN NHÂN</th><th colspan="2">MÔ TẢ</th><th rowspan="2">Sản phẩm - Nhà phân phối - Ngày sản xuất - Quy cách</th><th rowspan="2">Số lượng sản phẩm KPH</th><th rowspan="2">Số lượng thùng có sản phẩm KPH</th><th rowspan="2">Số lượng đvsp kiểm tra</th><th rowspan="2">Tỉ lệ KPH</th><th rowspan="2">Mức độ lỗi</th><th rowspan="2">Sự khắc phục</th><th rowspan="2">Hành động khắc phục</th><th rowspan="2">Số phiếu</th><th rowspan="2">Bộ phận phát hiện</th><th rowspan="2">Bộ phận liên quan</th></tr><tr>${NN.map(([, t]) => `<th>${t}</th>`).join("")}<th>Hiện trạng lỗi</th><th>Mô tả chi tiết</th></tr></thead><tbody>${body}</tbody></table>`);
  }

  /* ---------------- cho Bàn làm việc ---------------- */
  window.qaTasks = async function () {
    if (!S.me || !QC()) return [];
    try { await load(); } catch (e) { return []; }
    const tp = TP(), out = [];
    vt().forEach(r => { const d = r.d, t = ttOf(r);
      if (t === "Chờ kiểm") { const late = hanT(r) < Date.now(); out.push({ id: r.id, c: late || d.gap ? "#c62828" : "#d97706", t: `${d.gap ? "🚨 <b>GẤP</b> · " : "📦 "}<b>${E(SO[r.loai].bm.slice(0, 5))}</b> · ${E(d.ten)} · ${E(d.ncc || "")} · ${N(d.sl)} ${E(d.dvt || "")} — về ${DM(d.ngayNhap)}${d.gioNhap ? " " + E(d.gioNhap) : ""}, <b>chưa kiểm</b> (${hanTxt(r)})` }); }
      if (tp && t === "Chờ xác nhận") out.push({ id: r.id, c: d.ketLuan === "Không đạt" ? "#c62828" : "#7c3aed", t: `✍ <b>${E(SO[r.loai].bm.slice(0, 5))}</b> · ${E(d.ten)} — QC ${E(d.nguoiKT || "")} kết luận <b>${E(d.ketLuan)}</b>, chờ anh xác nhận` });
    });
    if (tp) live(R).filter(x => x.loai === "KPH" && !x.d.dong).forEach(k => out.push({ id: k.id, c: "#c62828", t: `⚠ <b>${E(k.d.so)}</b> · ${E(k.d.suKPH)} — chưa xử lý xong (${D(k.d.ngay)})` }));
    return out;
  };
  window.qaOpen = function (id) { setTab("qa"); setTimeout(async () => { try { if (!R.length) await load(); const r = rec(id); if (!r) return; if (r.loai === "KPH") { view = "kph"; kphDlg(r); } else if (r.loai === "KH") khDlg(r); else vtDlg(r); } catch (e) {} }, 300); };
})();
