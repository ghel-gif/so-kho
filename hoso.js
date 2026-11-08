/* Sổ Kho — HỒ SƠ LÔ MỘT CHẠM: truy xuất 1 lô (nguồn gốc + nơi dùng + QC + biểu mẫu) → xem / in / lưu PDF. */
"use strict";
(function () {
  const E = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const D = s => { s = String(s || "").slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s.split("-").reverse().join("/") : s; };
  const N = v => (Math.round((+v || 0) * 1000) / 1000).toLocaleString("vi-VN");
  const QCC = t => t === "Đạt" ? "✓ Đạt" : t === "Không đạt" ? "✗ Không đạt" : t || "—";
  const FN = { BM05: "BM.05", BM04: "BM.04", BM06: "BM.06", BM07: "BM.07" };
  function formsTxt(o) {
    if (!o.dg) return "";
    const F = o.forms || [], has = k => F.some(f => f.loai === k), kt = has("BM04") || has("BM06");
    return `BM.05 ${has("BM05") ? "✓" : "✗"} · BM.04/06 ${kt ? "✓" : "✗"} · BM.07 ${has("BM07") ? "✓" : "✗"}` + (F.length ? ` <small>(${F.map(f => (FN[f.loai] || f.loai) + " " + D(f.ngay) + (f.nguoi ? " – " + E(f.nguoi) : "")).join("; ")})</small>` : "");
  }
  function lenhBlock(g, lv) {
    const o = g.lenh, pad = lv ? `style="margin-left:${lv * 6}mm"` : "";
    const rows = g.vao.map(x => `<tr><td>${E(x.nhom)}</td><td>${E(x.ma)}<br><small>${E(x.ten)}</small></td><td class="c">${E(x.lo || "—")}</td><td class="c">${D(x.nsx)}</td><td class="c">${D(x.hsd)}</td><td class="r">${x.kg ? N(x.kg) + " kg" : N(x.sl) + " " + E(x.dv || "")}</td><td class="c">${x.nhom === "Bán thành phẩm" || x.nhom === "Nguyên liệu" ? QCC(x.qc) : ""}</td></tr>`).join("");
    let sub = "";
    g.vao.forEach(x => (x.nguon || []).forEach(n => { sub += `<p ${pad} style="margin:8px 0 2px ${(lv + 1) * 6}mm"><b>↳ BTP ${E(x.ma)} lô ${E(x.lo)}</b> được sản xuất từ:</p>` + lenhBlock(n, lv + 1); }));
    return `<div ${pad}><table><tr class="sec"><td colspan="7">${o.dg ? "Lệnh đóng gói" : "Lệnh SX BTP"} <b>${E(o.so)}</b> · ra lệnh ${D(o.ngay)}${o.ngayHT ? " · xong " + D(o.ngayHT) : ""} · ${E(o.tenSP || o.maSP)} · ${N(o.sl)} · ${E(o.trangThai)}</td></tr>
      <tr><td colspan="7"><small>Người lập: ${E(o.nguoiLap)}${o.nguoiSX ? " · Người SX: " + E(o.nguoiSX) : ""}${o.qcSX ? " · QC theo dõi: " + E(o.qcSX) : ""}${o.khachHang ? " · Khách hàng: " + E(o.khachHang) : ""}${o.dg ? "<br>Biểu mẫu QC: " + formsTxt(o) : ""}</small></td></tr>
      <tr><th style="width:12%">Nhóm</th><th style="width:31%">Mã / tên</th><th style="width:15%">Số lô</th><th style="width:10%">NSX</th><th style="width:10%">HSD</th><th style="width:11%">Lượng xuất</th><th style="width:11%">QC</th></tr>
      ${rows || `<tr><td colspan="7" class="c">Chưa có phiếu xuất cho lệnh này</td></tr>`}</table></div>` + sub;
  }
  function html(R) {
    const K = window.BMK, l = R.lot;
    const nguon = R.nguon.length ? R.nguon.map(g => lenhBlock(g, 0)).join('<div class="gap"></div>') : `<p>Lô này không do lệnh sản xuất / đóng gói trong Sổ Kho tạo ra (nhập mua ngoài hoặc tồn đầu).</p>`;
    const dung = R.dung.length ? `<table><tr><th style="width:18%">Lệnh</th><th style="width:12%">Ngày</th><th style="width:14%">Lượng dùng</th><th>Sản phẩm / lô tạo ra</th></tr>${R.dung.map(d => `<tr><td>${E(d.lenh ? d.lenh.so : "")}</td><td class="c">${D(d.ngay)}</td><td class="r">${N(d.kg)} kg</td><td>${d.ra.map(r => E(r.ma) + " lô <b>" + E(r.lo || "—") + "</b> (" + (r.kg ? N(r.kg) + " kg" : N(r.sl) + " " + E(r.dv)) + ")").join("<br>") || "—"}</td></tr>`).join("")}</table>` : `<p>Chưa dùng cho lệnh nào.</p>`;
    const the = `<table><tr><th style="width:12%">Ngày</th><th style="width:11%">Loại</th><th style="width:14%">Lượng</th><th style="width:18%">Chứng từ / lệnh</th><th style="width:18%">Người lập</th><th>Ghi chú</th></tr>${R.the.map(x => `<tr><td class="c">${D(x.ngay)}</td><td class="c">${E(x.loai)}</td><td class="r">${x.kg ? N(x.kg) + " kg" : N(x.sl) + " " + E(x.dv)}</td><td>${E(x.lenh || x.chungTu || "")}</td><td>${E(x.nguoi)}</td><td>${E(x.ghiChu)}</td></tr>`).join("") || `<tr><td colspan="6" class="c">Chưa có phiếu</td></tr>`}</table>`;
    return `${K.PCSS}<style>.pq small{font-size:10pt}.pq h3{font-size:13pt;margin:12px 0 4px}</style><div class="pq">
      ${K.head("HỒ SƠ TRUY XUẤT LÔ", `Mã: <b>${E(l.ma)}</b><br>Số lô: <b>${E(l.lo || "—")}</b><br>In lúc: ${E(R.luc)}`)}
      <h3>1. Thông tin lô</h3><table>
      <tr><td style="width:22%">Sản phẩm / vật tư</td><td colspan="3"><b>${E(l.ten)}</b> (${E(l.ma)}) · nhóm ${E(l.nhom)}</td></tr>
      <tr><td>Số lô</td><td style="width:28%"><b>${E(l.lo || "—")}</b></td><td style="width:22%">Tồn hiện tại</td><td>${N(l.ton)} kg</td></tr>
      <tr><td>Ngày sản xuất</td><td>${D(l.nsx) || "—"}</td><td>Hạn sử dụng</td><td>${D(l.hsd) || "—"}</td></tr>
      <tr><td>Kết quả QC</td><td><b>${QCC(l.qc)}</b>${l.qcNgay ? " · " + D(l.qcNgay) : ""}${l.qcNguoi ? " · " + E(l.qcNguoi) : ""}</td><td>Hàm lượng / tỷ trọng</td><td>${E(l.hl || "—")}${l.tt ? " · " + E(l.tt) + " g/ml" : ""}</td></tr>
      ${l.qcGhi ? `<tr><td>Ghi chú QC</td><td colspan="3">${E(l.qcGhi)}</td></tr>` : ""}
      <tr><td>Hồ sơ đính kèm</td><td colspan="3">${l.hs.length ? l.hs.map(h => E(h.loai) + ": " + E(h.ten)).join("<br>") : "—"}</td></tr></table>
      <h3>2. Nguồn gốc (nguyên liệu, BTP, bao bì đã dùng)</h3>${nguon}
      <h3>3. Nơi sử dụng lô này</h3>${dung}
      <h3>4. Thẻ kho của lô</h3>${the}
      ${K.sign([["Người lập", R.nguoi], ["QA / QC", ""], ["Quản lý", ""]])}</div>`;
  }
  document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-hslo]"); if (!b) return; const [m, l] = b.dataset.hslo.split("|"); window.hoSoLo(m, l); });
  window.hoSoLo = async function (ma, lo) {
    let R; try { R = await api("webHoSoLo", S.auth, ma, lo); } catch (e) { return toast(e.message); }
    const h = html(R), w = document.createElement("div"); w.className = "cfm";
    w.innerHTML = `<div class="cfm-box" style="max-width:min(980px,97vw);width:980px"><h2>Hồ sơ lô ${E(ma)} · ${E(lo || "—")}</h2><div class="actions" style="justify-content:flex-start;margin:0 0 8px"><button class="btn primary" type="button" data-p>🖨 In / Lưu PDF</button><button class="btn" type="button" data-x>Đóng</button></div><p class="note">Muốn lưu PDF: bấm In → chọn máy in “Lưu dưới dạng PDF”.</p><div style="background:#fff;color:#000;border:1px solid #ccd;border-radius:8px;padding:12px;max-height:68vh;overflow:auto">${h}</div></div>`;
    document.body.appendChild(w);
    w.querySelector("[data-x]").onclick = () => w.remove();
    w.querySelector("[data-p]").onclick = () => window.BMK.pr(h);
  };
})();
