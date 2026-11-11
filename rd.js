/* Sổ Kho — PHÒNG RD theo RD-QT.01 (phiên bản 02, hiệu lực 02/01/2026)
   BM.02 Công thức sản phẩm – Phiếu kiểm tra pha chế · BM.04 Sổ theo dõi yêu cầu · BM.01 Sổ nghiên cứu thử nghiệm · BM.03 Sổ giao mẫu khảo nghiệm hiệu lực.
   TP. LAB/RD (Quản lý) lập yêu cầu + công thức thử và giao người thực hiện → người được giao ghi kết quả, bấm "Báo kết quả" → Quản lý đánh giá Đạt / Không đạt. */
"use strict";
(function () {
  const E = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const D = s => { s = String(s || "").slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s.split("-").reverse().join("/") : s; };
  /* số thập phân thống nhất: dấu chấm, 3 chữ số (VD 18.553 · 5.000) — đúng kiểu ghi trên nhãn / GCN */
  /* số thập phân: cả cột hiện cùng số chữ số lẻ = số lẻ nhiều nhất đã nhập (0–3) */
  const F3 = (v, n = 3) => { const x = parseFloat(String(v ?? "").replace(",", ".")); return isFinite(x) ? x.toFixed(n) : ""; };
  const DP = v => { const x = parseFloat(String(v ?? "").replace(",", ".")); if (!isFinite(x)) return 0; const t = String(+x.toFixed(3)), i = t.indexOf("."); return i < 0 ? 0 : t.length - i - 1; };
  const NDP = L => Math.max(0, ...(L || []).filter(r => r && !r.bu).map(r => DP(r.pct)));
  /* loại nguyên liệu: tech (hoạt chất kỹ thuật) / dung môi / phụ gia — tự đoán, bấm nhãn để đổi */
  const LO = { tech: ["Tech", "#7c3aed"], dm: ["Dung môi", "#0277bd"], pg: ["Phụ gia", "#d97706"], pb: ["Phân bón", "#2e7d32"] };
  const SOLV = /(nước|water|dầu|\boil\b|\bMES\b|solvesso|\bS-?\s?(100|150|200)\b|xylen|toluen|\bNMP\b|pyrrolidon|\bDMSO\b|\bDMF\b|cyclohexanon|isophoron|methanol|ethanol|\bIPA\b|isopropanol|butanol|aceton|methyl oleat|metyl oleat|\bMSO\b|paraffin|dung môi|solvent)/i;
  const loaiOf = r => { if (r.loai && LO[r.loai]) return r.loai; const t = String(r.ten || "").trim(); if (!t && !r.ma) return "";
    const it = r.ma && typeof itemBy === "function" ? itemBy(r.ma) : null, nh = it ? it.nhom : "";
    if (nh === "Nguyên liệu") return "tech"; if (nh === "Phân bón") return "pb"; if (r.bu || SOLV.test(t)) return "dm"; if (nh) return "pg";
    return /\d{2,3}(?:[.,]\d+)?\s*%|\btech\b|\bTC\b|kỹ thuật/i.test(t) ? "tech" : "pg"; };
  /* dòng Tech: hàm lượng hoạt chất trong công thức = %w/w × độ tinh khiết; dạng lỏng có tỷ trọng thì ra thêm g/L */
  const PUR = r => { const it = r.ma && typeof itemBy === "function" ? itemBy(r.ma) : null, m = /(\d{2,3}(?:[.,]\d+)?)\s*%/.exec((r.ten || "") + " " + (it ? it.ten + " " + (it.hamLuong || "") : "")); const v = m ? parseFloat(m[1].replace(",", ".")) : 100; return v > 0 && v <= 100 ? v : 100; };
  const HLtxt = (r, d) => { if (loaiOf(r) !== "tech") return ""; const p = parseFloat(String(r.pct ?? "").replace(",", ".")); if (!(p > 0)) return "";
    const hl = p * PUR(r) / 100, tt = parseFloat(String(d.tyTrong || "").replace(",", ".")), u = DVHL(d);
    if (u === "g/kg") return (+(hl * 10).toFixed(1)) + " g/kg";
    if (u === "g/L") return tt > 0 ? (+(hl * tt * 10).toFixed(1)) + " g/L" : (+hl.toFixed(2)) + " % (ghi tỷ trọng để ra g/L)";
    return (+hl.toFixed(2)) + " %"; };
  const DVHL = d => ["g/L", "g/kg", "%"].includes(d.dvHL) ? d.dvHL : (LONG.includes(d.dang) ? "g/L" : "%");
  /* mẻ thử: người làm chọn lượng + đơn vị → tự tính lượng cân từng nguyên liệu (ml, L quy ra khối lượng theo tỷ trọng) */
  const MEDV = ["g", "kg", "ml", "L"];
  const meInfo = d => { const sl = parseFloat(String(d.meSL ?? "").replace(",", ".")), dv = MEDV.includes(d.meDV) ? d.meDV : "g";
    if (!(sl > 0)) return null; const tt0 = parseFloat(String(d.tyTrong || "").replace(",", ".")), vol = dv === "ml" || dv === "L", tt = vol ? (tt0 > 0 ? tt0 : 1) : 1;
    return { m: sl * tt, u: dv === "g" || dv === "ml" ? "g" : "kg", sl, dv, noTT: vol && !(tt0 > 0) }; };
  const canOf = (r, d, M) => { M = M || meInfo(d); const p = parseFloat(String(r.pct ?? "").replace(",", ".")); if (!M || !(p > 0)) return ""; return (M.m * p / 100).toFixed(M.u === "g" ? 2 : 3); };
  const LOAI_TN = ["Thử nghiệm công thức mới", "Thử nghiệm lô tech mới", "Thử nghiệm lô phụ gia mới", "Thử nghiệm cải tiến công thức"];
  /* ----- NGƯỜI THỰC HIỆN ĐIỀU CHỈNH CÔNG THỨC: so công thức đang ghi với công thức TP. LAB/RD giao (theo mã vật tư; không có mã thì theo tên)
     → dòng đổi %, dòng thêm, dòng bỏ. Dùng ở phiếu, danh sách, bản in, thông báo. ----- */
  const kNL = r => String((r && r.ma) || "").trim().toUpperCase() || String((r && r.ten) || "").trim().toLowerCase();
  const pN = v => { const x = parseFloat(String(v ?? "").replace(",", ".")); return isFinite(x) ? x : 0; };
  const pT = v => v === "" || v == null ? "—" : String(+pN(v).toFixed(3));
  function diffNl(cur, goc) { const out = [], used = new Set();
    (cur || []).forEach(r => { const k = kNL(r); if (!k) return; const b = (goc || []).find(x => !used.has(x) && kNL(x) === k);
      if (!b) { out.push({ t: "them", ten: r.ten || r.ma, b: r.pct, bu: !!r.bu }); return; } used.add(b);
      if (Math.abs(pN(r.pct) - pN(b.pct)) > 0.0005) out.push({ t: "doi", ten: r.ten || r.ma, a: b.pct, b: r.pct, bu: !!r.bu }); });
    (goc || []).forEach(b => { if (kNL(b) && !used.has(b)) out.push({ t: "bo", ten: b.ten || b.ma, a: b.pct }); });
    return out; }
  const diffTxt = x => x.t === "them" ? "thêm " + x.ten + " " + pT(x.b) + " %" : x.t === "bo" ? "bỏ " + x.ten + " (giao " + pT(x.a) + " %)" : x.ten + ": " + pT(x.a) + " → " + pT(x.b) + " %";
  const diffLi = x => `<li class="${x.t}">${x.t === "them" ? "＋ thêm <b>" + E(x.ten) + "</b> " + pT(x.b) + " %" : x.t === "bo" ? "− bỏ <b>" + E(x.ten) + "</b> <small>(giao " + pT(x.a) + " %)</small>" : "<b>" + E(x.ten) + "</b>: " + pT(x.a) + " → <b>" + pT(x.b) + " %</b>" + (x.bu ? " <small>(Up to, tự bù)</small>" : "")}</li>`;
  const sigNl = L => JSON.stringify((L || []).filter(r => kNL(r)).map(r => [kNL(r), +pN(r.pct).toFixed(3), r.bu ? 1 : 0]));
  const add = (s, n) => { if (!/^\d{4}-\d{2}-\d{2}/.test(s || "")) return ""; const d = new Date(String(s).slice(0, 10) + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const today = () => (typeof S !== "undefined" && S.today) || new Date().toISOString().slice(0, 10);
  const QL = () => !!(S.me && S.me.vaiTro === "Quản lý" && S.me.ten === "Nguyễn Ô Ghel"); /* chỉ TP. LAB/RD sửa công thức */
  const META = { PT: ["BM.02-RD-QT.01", "02", "02/01/2026"], YC: ["BM.04-RD-QT.01", "02", "02/01/2026"], SO: ["BM.01-RD-QT.01", "02", "02/01/2026"], GM: ["BM.03-RD-QT.01", "02", "02/01/2026"] };
  const meta = k => `Mã số: <b>${META[k][0]}</b><br>Phiên bản: ${META[k][1]}<br>Ngày hiệu lực: ${META[k][2]}`;
  const TTC = { "Giao": "#2563eb", "Đang thử": "#d97706", "Đã báo KQ": "#7c3aed", "Đã duyệt": "#2e7d32" };
  const CT0 = () => [rowOf("Ngoại quan"), rowOf("pH (5%w/w)", 1), rowOf("Tỷ trọng (g/ml)", 1)];
  /* dạng thành phẩm → đơn vị hàm lượng + chỉ tiêu theo dõi gợi ý */
  const LONG = ["SC", "OD", "EC", "EW", "ME", "SL", "SE", "CS", "FS", "DC", "ZC", "AL", "OL"];
  /* DANH MỤC CHỈ TIÊU — mức yêu cầu theo QCVN 01-188:2018/BNNPTNT (Bảng 4), phương pháp theo hướng dẫn nội bộ QC-HD của nhà máy.
     w: điều kiện áp dụng (a = thường 28 °C, b = 54 °C 14 ngày, c = 0 °C 7 ngày). nb = chỉ tiêu theo dõi nội bộ, không bắt buộc theo QCVN. */
  const CAT = [
    { ct: "Ngoại quan", yc: "Đồng nhất, đúng mô tả dạng", pp: "QC-HD.36", w: "abc" },
    { ct: "Hàm lượng hoạt chất", yc: "Theo đăng ký (Bảng 1); sau 54 °C ≥ 95% trước bảo quản", pp: "QC-HD.49 (gửi ngoài)", w: "ab" },
    { ct: "pH (5%w/w)", yc: "", pp: "QC-HD.35", w: "ab", nb: 1 },
    { ct: "Tỷ trọng (g/ml)", yc: "", pp: "QC-HD.37", w: "a", nb: 1 },
    { ct: "Độ bọt (sau 1 phút)", yc: "≤ 60 ml", pp: "QC-HD.38", w: "a" },
    { ct: "Độ mịn rây ướt (cặn trên rây 75 µm)", yc: "≤ 2 %", pp: "QC-HD.39", w: "ab" },
    { ct: "Độ mịn rây khô (cặn trên rây 75 µm)", yc: "≤ 5 %", pp: "TCVN 8050:2016", w: "ab" },
    { ct: "Độ thấm ướt", yc: "Thấm ướt hoàn toàn trong 1 phút", pp: "QC-HD.40", w: "ab" },
    { ct: "Độ bền nhũ tương", yc: "Kem ≤ 2 ml sau 0,5 h; ≤ 4 ml sau 2 h", pp: "QC-HD.41", w: "abc" },
    { ct: "Độ bền pha loãng", yc: "Đồng nhất, không cặn sau 24 h (cặn ≤ 2 %)", pp: "QC-HD.42", w: "abc" },
    { ct: "Độ hoà tan và độ bền dung dịch", yc: "Cặn trên rây 75 µm ≤ 2 %", pp: "QC-HD.42", w: "ab" },
    { ct: "Độ tự phân tán", yc: "≥ 60 %", pp: "QC-HD.43", w: "ab" },
    { ct: "Độ bền phân tán", yc: "Kem/dầu ≤ 2 ml; cặn ≤ 0,2 ml (0,5 h), ≤ 0,4 ml (24,5 h)", pp: "QC-HD.44", w: "abc" },
    { ct: "Tỷ suất lơ lửng (30 phút)", yc: "≥ 60 %", pp: "QC-HD.46", w: "ab" },
    { ct: "Kích thước hạt (kính hiển vi)", yc: "≤ 5 µm (D max)", pp: "QC-HD.45", w: "abc", nb: 1 },
    { ct: "Thể tích tách lớp ở 0 °C", yc: "≤ 0,3 ml", pp: "QC-HD.47", w: "c" },
    { ct: "Tách lớp / tách dầu khi lưu mẫu", yc: "", pp: "QC-HD.47", w: "bc", nb: 1 },
    { ct: "Độ nhớt", yc: "", pp: "", w: "ab", nb: 1 },
    { ct: "Độ bụi (qua rây 50 µm)", yc: "≤ 1 %", pp: "TCVN 8750:2014", w: "a" },
    { ct: "Kích thước hạt (GR)", yc: "Dmax/Dmin ≤ 4; ≥ 85 % trong khoảng công bố", pp: "TCVN 2743:1978", w: "a" }
  ];
  /* chỉ tiêu theo QCVN 01-188 cho từng dạng (+ nội bộ hay dùng) */
  const QCVN = {
    SC: ["Ngoại quan", "Hàm lượng hoạt chất", "Độ tự phân tán", "Tỷ suất lơ lửng (30 phút)", "Độ mịn rây ướt (cặn trên rây 75 µm)", "Độ bọt (sau 1 phút)", "+pH (5%w/w)", "+Tỷ trọng (g/ml)", "+Kích thước hạt (kính hiển vi)"],
    EC: ["Ngoại quan", "Thể tích tách lớp ở 0 °C", "Hàm lượng hoạt chất", "Độ bền nhũ tương", "Độ bọt (sau 1 phút)", "+pH (5%w/w)", "+Tỷ trọng (g/ml)"],
    WP: ["Ngoại quan", "Hàm lượng hoạt chất", "Tỷ suất lơ lửng (30 phút)", "Độ thấm ướt", "Độ mịn rây ướt (cặn trên rây 75 µm)", "Độ bọt (sau 1 phút)", "+pH (5%w/w)"],
    WG: ["Ngoại quan", "Hàm lượng hoạt chất", "Tỷ suất lơ lửng (30 phút)", "Độ tự phân tán", "Độ thấm ướt", "Độ mịn rây ướt (cặn trên rây 75 µm)", "Độ bọt (sau 1 phút)", "+pH (5%w/w)"],
    SL: ["Ngoại quan", "Thể tích tách lớp ở 0 °C", "Hàm lượng hoạt chất", "Độ bền pha loãng", "Độ bọt (sau 1 phút)", "+pH (5%w/w)", "+Tỷ trọng (g/ml)"],
    OD: ["Ngoại quan", "Hàm lượng hoạt chất", "Độ bền phân tán", "Độ mịn rây ướt (cặn trên rây 75 µm)", "Độ bọt (sau 1 phút)", "+Tỷ trọng (g/ml)", "+Kích thước hạt (kính hiển vi)", "+Tách lớp / tách dầu khi lưu mẫu"],
    EW: ["Ngoại quan", "Thể tích tách lớp ở 0 °C", "Hàm lượng hoạt chất", "Độ bền nhũ tương", "Độ bọt (sau 1 phút)", "+pH (5%w/w)", "+Tỷ trọng (g/ml)"],
    ME: ["Ngoại quan", "Thể tích tách lớp ở 0 °C", "Hàm lượng hoạt chất", "Độ bền nhũ tương", "Độ bọt (sau 1 phút)", "+pH (5%w/w)", "+Tỷ trọng (g/ml)"],
    GR: ["Ngoại quan", "Hàm lượng hoạt chất", "Độ bụi (qua rây 50 µm)", "Kích thước hạt (GR)"],
    CS: ["Ngoại quan", "Hàm lượng hoạt chất", "Độ tự phân tán", "Tỷ suất lơ lửng (30 phút)", "Độ mịn rây ướt (cặn trên rây 75 µm)", "Độ bọt (sau 1 phút)", "+pH (5%w/w)", "+Tỷ trọng (g/ml)"],
    FS: ["Ngoại quan", "Hàm lượng hoạt chất", "Tỷ suất lơ lửng (30 phút)", "Độ mịn rây ướt (cặn trên rây 75 µm)", "Độ bọt (sau 1 phút)", "+pH (5%w/w)", "+Tỷ trọng (g/ml)"],
    SE: ["Ngoại quan", "Hàm lượng hoạt chất", "Độ bền phân tán", "Độ mịn rây ướt (cặn trên rây 75 µm)", "Độ bọt (sau 1 phút)", "+pH (5%w/w)", "+Tỷ trọng (g/ml)"],
    DC: ["Ngoại quan", "Thể tích tách lớp ở 0 °C", "Hàm lượng hoạt chất", "Độ bền phân tán", "Độ bọt (sau 1 phút)", "+Tỷ trọng (g/ml)"],
    DP: ["Ngoại quan", "Hàm lượng hoạt chất", "Độ mịn rây khô (cặn trên rây 75 µm)"],
    SP: ["Ngoại quan", "Hàm lượng hoạt chất", "Độ hoà tan và độ bền dung dịch", "Độ thấm ướt", "Độ bọt (sau 1 phút)", "+pH (5%w/w)"],
    SG: ["Ngoại quan", "Hàm lượng hoạt chất", "Độ hoà tan và độ bền dung dịch", "Độ bọt (sau 1 phút)", "+pH (5%w/w)"]
  };
  const catOf = ct => CAT.find(x => x.ct === ct);
  const rowOf = (ct, nb) => { const c = catOf(ct) || { ct, yc: "", pp: "", w: "abc" }; return { ct: c.ct, yc: c.yc, pp: c.pp, w: c.w, nb: nb || c.nb ? 1 : 0 }; };
  const ctOf = dg => (QCVN[dg] || ["Ngoại quan", "+pH (5%w/w)", "+Tỷ trọng (g/ml)"]).map(x => rowOf(x.replace(/^\+/, ""), x[0] === "+"));
  const DANGS = ["SC", "OD", "EC", "EW", "ME", "SL", "SE", "CS", "FS", "DC", "ZC", "WP", "WG", "GR", "DP", "SP", "SG"];
  const dangOf = sp => { const m = /\b(\d[\d.,+\s]*)?\s*(SC|OD|EC|EW|ME|SL|SE|CS|FS|DC|ZC|WP|WG|GR|DP|SP|SG)\b/i.exec(String(sp || "")); return m ? m[2].toUpperCase() : ""; };
  /* mã công thức tự tạo: 3 chữ đầu mỗi hoạt chất + tổng hàm lượng + dạng + số thứ tự, VD PYMNIT35OD-01 (sửa được) */
  const bo = t => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "D");
  function genMa(sp, dg, self) {
    const t = bo(sp).toUpperCase(), parts = t.split("+"), ab = parts.map(x => (x.match(/[A-Z]{3,}/) || [""])[0].slice(0, 3)).filter(Boolean).join("").slice(0, 9);
    const nums = (t.match(/\d+(?:[.,]\d+)?/g) || []).map(x => parseFloat(x.replace(",", "."))), tot = nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) * 10) / 10 : "";
    const pre = (ab || "CT") + String(tot).replace(".", "_") + (dg || ""); if (!ab) return "";
    const used = live(R).filter(x => x.loai === "PT" && x.id !== self).map(x => String(x.d.maCT || "")).filter(m => m.startsWith(pre + "-")).map(m => parseInt(m.slice(pre.length + 1)) || 0);
    return pre + "-" + String((used.length ? Math.max(...used) : 0) + 1).padStart(2, "0");
  }
  let R = [], USERS = [], view = "pt";
  const box = () => document.getElementById("rdBox");
  const live = L => L.filter(x => !x.xoa);
  async function load() { R = await api0("webRDAll", S.auth); try { if (!USERS.length) USERS = await api0("getUserNames"); } catch (e) {} }
  const rec = id => R.find(x => x.id === id);
  const ptSt = p => p.d.tt === "Đã duyệt" ? "Đã duyệt · " + (p.d.danhGia || "") : p.d.tt || "Đang thử";
  const chip = p => { if (p.d.hong && p.d.tt !== "Đã duyệt") return `<span class="st" style="background:#c62828;color:#fff;border-color:#c62828">⛔ Mẫu hỏng · ${E(p.d.tt || "")}</span>`; const t = p.d.tt || "Đang thử", c = p.d.tt === "Đã duyệt" ? (p.d.danhGia === "Đạt" ? "#2e7d32" : "#c62828") : TTC[t] || "#607d8b"; return `<span class="st" style="background:${c};color:#fff;border-color:${c}">${E(ptSt(p))}</span>`; };
  const ycSt = y => y.d.ngayKT ? "Xong" : y.d.han && y.d.han < today() ? "Quá hạn" : "Đang làm";
  /* ----- BƯỚC CÔNG VIỆC của 1 phiếu thử (dùng chung: danh sách, đầu phiếu, Bàn làm việc) -----
     z = khu: "lam" (cần người làm ngay) · "theodoi" (đang lưu mẫu, chưa đến ngày đọc) · "xong" (đã duyệt)
     k = bước: giao (chờ bắt đầu) → kq0 (ghi kết quả điều kiện thường) → luu (đang lưu mẫu) / doc (đến ngày đọc mẫu) → bao (báo kết quả) → duyet (chờ Quản lý) → xong */
  const BUOC = [["giao", "Pha mẫu", "chờ bắt đầu"], ["kq0", "Ghi kết quả ban đầu", "điều kiện thường"], ["luu", "Lưu mẫu · theo dõi", "54 °C · 0 °C"], ["bao", "Báo kết quả", "tự đánh giá"], ["duyet", "Duyệt", "Quản lý đánh giá"], ["xong", "Đã xong", "in BM.02 để ký"]];
  const fil = v => String(v == null ? "" : v).trim() !== "";
  const wRow = r => r.w != null ? r.w : (r.n28 ? "a" : (catOf(r.ct) || {}).w || (/t[ỷỉ] tr[ọo]ng|density/i.test(r.ct || "") ? "a" : "abc"));
  const dDiff = (x, y) => Math.round((new Date(String(x).slice(0, 10) + "T00:00:00Z") - new Date(String(y).slice(0, 10) + "T00:00:00Z")) / 864e5);
  function buoc(d) {
    const td = today(), K = (d.kq || []).filter(r => fil(r.ct)), t54 = d.t54 !== false, t0 = d.t0 != null ? !!d.t0 : K.some(r => fil(r.c)), th = d.nguoiTH || "";
    const pr = k => { const N = K.filter(r => wRow(r).includes(k)); return [N.filter(r => fil(r[k])).length, N.length]; };
    const P = { a: pr("a"), b: t54 ? pr("b") : null, c: t0 ? pr("c") : null };
    /* các điều kiện lưu mẫu còn chưa ghi đủ kết quả, kèm ngày đọc */
    const luu = d.ngayBD && !d.hong ? [["b", "54 °C", 14], ["c", "0 °C", 7]].filter(([k]) => P[k] && P[k][1] > 0 && P[k][0] < P[k][1]).map(([k, ten, n]) => ({ k, ten, tong: n, ngay: add(d.ngayBD, n), da: Math.max(0, Math.min(n, dDiff(td, d.ngayBD))) })).sort((x, y) => x.ngay.localeCompare(y.ngay)) : [];
    const o = { P, luu, th, t54, t0 }, set = x => Object.assign(o, x);
    if (d.tt === "Đã duyệt") return set({ z: "xong", k: "xong", i: 5 });
    if (d.tt === "Đã báo KQ" || d.hong) return set({ z: "lam", k: "duyet", i: 4, who: "Quản lý", ql: 1, viec: d.hong ? "mẫu hỏng — đánh giá, chọn hướng xử lý rồi bấm Lưu để duyệt" : "xem kết quả, chọn Đạt / Không đạt rồi bấm Lưu để duyệt" });
    if (!d.ngayBD) return set({ z: "lam", k: "giao", i: 0, who: th || "Quản lý", ql: th ? 0 : 1, cho: dDiff(td, d.ngayLap || td), viec: th ? "pha mẫu theo cột Cân, ghi Ngày bắt đầu" : "chọn người thực hiện để giao việc" });
    if (P.a[0] < P.a[1]) return set({ z: "lam", k: "kq0", i: 1, who: th || "Quản lý", ql: th ? 0 : 1, viec: "ghi kết quả điều kiện thường (đã ghi " + P.a[0] + "/" + P.a[1] + " chỉ tiêu)" });
    const due = luu.filter(x => x.ngay <= td);
    if (due.length) { const tre = dDiff(td, due[0].ngay); return set({ z: "lam", k: "doc", i: 2, who: th || "Quản lý", ql: th ? 0 : 1, han: due[0].ngay, tre, viec: (tre > 0 ? "quá " + tre + " ngày" : "hôm nay đến ngày") + " đọc mẫu " + due.map(x => x.ten).join(", ") + " — ghi kết quả lưu mẫu" }); }
    if (luu.length) return set({ z: "theodoi", k: "luu", i: 2, who: th || "Quản lý", ql: th ? 0 : 1, han: luu[0].ngay, con: dDiff(luu[0].ngay, td) });
    return set({ z: "lam", k: "bao", i: 3, who: th || "Quản lý", ql: th ? 0 : 1, viec: th ? "chọn kết luận Đạt / Không đạt, bấm Báo kết quả" : "chọn kết luận Đạt / Không đạt rồi bấm Lưu" });
  }
  const cuaToi = b => !!S.me && (b.ql ? QL() : b.who === S.me.ten);
  const luuTxt = x => `${x.ten}: ngày ${x.da}/${x.tong} · đọc ${D(x.ngay)}`;
  let fB = "", doneAll = false; /* lọc theo bước · xem hết phiếu đã xong */
  /* khu trong danh sách: tiêu đề màu + số phiếu; khu trống vẫn hiện 1 dòng để thấy đủ 3 khu */
  const zone = (cls, ic, ten, sub, n, body, empty) => `<section class="rd-zone z-${cls}"><h3><span>${ic} ${ten}</span><small>${sub}</small><em>${n}</em></h3>${n ? `<div class="list rd-list">${body}</div>` : `<p class="rd-zempty">${empty}</p>`}</section>`;

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
      const B = new Map(L.map(p => [p, buoc(p.d)])), bo = p => B.get(p), td = today();
      /* 3 khu: đang làm (việc của mình và việc gấp lên trước) · đang theo dõi (sắp đến ngày đọc lên trước) · đã xong (mới duyệt lên trước) */
      const UT = { doc: 0, duyet: 1, bao: 2, kq0: 3, giao: 4 };
      const F = p => !fB || (fB === "luu" ? bo(p).i === 2 : bo(p).k === fB);
      const Zl = L.filter(p => bo(p).z === "lam" && F(p)).sort((x, y) => (cuaToi(bo(y)) - cuaToi(bo(x))) || (UT[bo(x).k] - UT[bo(y).k]) || ((bo(y).tre || 0) - (bo(x).tre || 0)));
      const Zt = L.filter(p => bo(p).z === "theodoi" && F(p)).sort((x, y) => String(bo(x).han).localeCompare(String(bo(y).han)));
      const Zx = L.filter(p => bo(p).z === "xong" && F(p)).sort((x, y) => String(y.d.duyetLuc || "").localeCompare(String(x.d.duyetLuc || "")));
      const cnt = k => L.filter(p => k === "luu" ? bo(p).i === 2 : bo(p).k === k).length, tre = L.filter(p => bo(p).k === "doc").length, my = L.filter(p => bo(p).z === "lam" && cuaToi(bo(p))).length, dat = L.filter(p => bo(p).z === "xong" && p.d.danhGia === "Đạt").length, nx = L.filter(p => bo(p).z === "xong").length;
      const row = p => { const d = p.d, b = bo(p), mine = cuaToi(b), lv = b.k === "doc" || (d.hong && b.k !== "xong") ? " r-bad" : b.k === "duyet" ? " r-wait" : "";
        const next = b.z === "xong" ? `<div class="rd-next done">✓ <b>${E(d.danhGia || "Đã duyệt")}</b>${d.xuLy ? " · " + E(d.xuLy) : ""}${d.duyetLuc ? " · duyệt " + D(d.duyetLuc) : ""}${d.hong ? " · mẫu hỏng" : ""}</div>`
          : b.z === "theodoi" ? b.luu.map(x => `<div class="rd-next wait">⏳ Lưu mẫu ${E(luuTxt(x))} <b>(còn ${dDiff(x.ngay, td)} ngày)</b><span class="rd-bar"><i style="width:${Math.round(x.da / x.tong * 100)}%"></i></span></div>`).join("")
          : `<div class="rd-next${mine ? " my" : ""}${b.k === "doc" || d.hong ? " bad" : ""}">👉 <b>${E(mine ? "Bạn" : b.who)}</b>: ${E(b.viec)}${mine ? ' <span class="rd-my">việc của bạn</span>' : ""}</div>`
            + (b.k !== "doc" && b.k !== "duyet" ? b.luu.filter(x => x.ngay > td).map(x => `<div class="rd-next wait sub">⏳ Đang lưu mẫu ${E(luuTxt(x))} (còn ${dDiff(x.ngay, td)} ngày)</div>`).join("") : "");
        return `<div class="row click${lv}" data-id="${E(p.id)}"><div class="name"><span class="code">${E(d.so || "")}</span><span class="tn">${E(d.sp || "")}</span> ${chip(p)}${d.nlGoc && !d.tuNV && diffNl(d.nl, d.nlGoc).length ? ' <span class="rd-tagct" title="Người thực hiện đã điều chỉnh công thức so với công thức giao — mở phiếu để xem">⚗ đã chỉnh công thức</span>' : ""}${d.tu ? ` <span class="rd-tagct v" title="Phiếu chép từ ${E(d.tu)}">${d.tuNV ? "⚗ tỷ lệ khác" : "↻ thử lại"} · từ ${E(d.tu)}</span>` : ""}${b.k === "xong" || b.k === "duyet" ? ` <button type="button" class="btn small" data-prpt="${E(p.id)}" title="In BM.02 để ký">🖨 In</button>` : ""}</div><div class="kg">${E(d.maCT || "")}<small>${E(d.hl || "")}</small></div>
          ${next}<div class="meta">Lập ${D(d.ngayLap || p.ngay)} · ${d.ngayBD ? "bắt đầu " + D(d.ngayBD) : b.k === "giao" && b.cho >= 3 ? `<b style="color:#b45309">giao ${b.cho} ngày chưa bắt đầu</b>` : "chưa bắt đầu"} · thực hiện: <b>${E(d.nguoiTH || "—")}</b>${d.ngayBD && b.z !== "xong" && b.P.a[1] ? ` · KQ thường ${b.P.a[0]}/${b.P.a[1]}` : ""}${d.baoLuc && b.k === "duyet" ? " · báo KQ " + D(d.baoLuc) : ""}</div></div>`; };
      const XN = 8, Xs = doneAll || fB ? Zx : Zx.slice(0, XN);
      h += `<div class="tools">${QL() ? '<button class="btn primary" type="button" id="rdNewPT">+ Lập công thức thử &amp; giao việc</button>' : ""}</div>
        <div class="rd-how"><b>Quy trình 5 bước</b> <span>— số trên mỗi bước là số phiếu đang ở bước đó; bấm vào bước để chỉ xem các phiếu ấy.${my ? ` <b class="rd-my">Bạn có ${my} việc</b>` : ""}</span></div>
        <ol class="rd-steps">${BUOC.map(([k, t, sub], i) => { const n = cnt(k), bad = k === "luu" && tre; return `<li><button type="button" data-b="${k}" class="${fB === k ? "on " : ""}${n ? "has " : ""}${bad ? "bad" : ""}" aria-pressed="${fB === k}"><i>${i < 5 ? i + 1 : "✓"}</i><span><b>${t}</b><small>${k === "luu" && tre ? tre + " phiếu đến ngày đọc" : sub}</small></span><em>${n}</em></button></li>`; }).join("")}</ol>
        ${fB ? `<p class="rd-fnote">Đang chỉ xem bước <b>${E((BUOC.find(x => x[0] === fB) || [])[1] || "")}</b> · <button type="button" class="btn small" id="rdFAll">Xem tất cả</button></p>` : ""}
        ${L.length ? zone("lam", "🛠", "Đang làm", "cần người làm ngay — dòng 👉 ghi rõ ai làm gì", Zl.length, Zl.map(row).join(""), fB ? "Không có phiếu nào ở bước này." : "Không có phiếu nào đang cần làm.")
          + zone("theodoi", "⏳", "Đang theo dõi", "mẫu đang lưu, chưa đến ngày đọc — chưa phải làm gì", Zt.length, Zt.map(row).join(""), "Không có mẫu nào đang lưu chờ ngày đọc.")
          + zone("xong", "✅", "Đã xong", nx ? `${dat} đạt · ${nx - dat} không đạt` : "đã duyệt", Zx.length, Xs.map(row).join("") + (Zx.length > Xs.length ? `<button type="button" class="rd-more" id="rdDoneAll">Xem hết ${Zx.length} phiếu đã xong</button>` : ""), "Chưa có phiếu nào được duyệt.")
          : '<div class="empty"><b>Chưa có phiếu thử nghiệm</b>Quản lý bấm “Lập công thức thử &amp; giao việc”.</div>'}`;
    } else if (view === "yc") {
      const L = live(R).filter(x => x.loai === "YC").sort((a, b) => String(b.ngay).localeCompare(String(a.ngay)));
      h += `<div class="tools">${QL() ? '<button class="btn primary" type="button" id="rdNewYC">+ Ghi yêu cầu nghiên cứu</button>' : ""}<button class="btn" type="button" id="rdPrYC">🖨 In sổ BM.04</button></div>
        ${(() => { if (!L.length) return '<div class="empty"><b>Chưa có yêu cầu nào</b></div>';
          const yr = y => { const st = ycSt(y), c = st === "Xong" ? "#2e7d32" : st === "Quá hạn" ? "#c62828" : "#d97706", np = live(R).filter(p => p.loai === "PT" && p.d.yc === y.id).length;
            return `<div class="row click${st === "Quá hạn" ? " r-bad" : ""}" data-id="${E(y.id)}"><div class="name">${E(y.d.noiDung || "")} <span class="st" style="background:${c};color:#fff;border-color:${c}">${st}</span></div><div class="kg">${np}<small>phiếu thử</small></div>
            <div class="meta">Yêu cầu ${D(y.ngay)} · ${E(y.d.donVi || "")} · cần kết quả ${D(y.d.han) || "—"} · thực hiện: ${E(y.d.nguoiTH || "—")}${y.d.ngayKT ? " · kết thúc " + D(y.d.ngayKT) : ""}</div></div>`; };
          const A = L.filter(y => ycSt(y) !== "Xong").sort((a, b) => String(a.d.han || "9").localeCompare(String(b.d.han || "9"))), X = L.filter(y => ycSt(y) === "Xong"), q = A.filter(y => ycSt(y) === "Quá hạn").length;
          return zone("lam", "🛠", "Đang làm", q ? q + " yêu cầu quá hạn" : "chưa ghi ngày kết thúc", A.length, A.map(yr).join(""), "Không có yêu cầu nào đang làm.") + zone("xong", "✅", "Đã xong", "đã ghi ngày kết thúc", X.length, X.map(yr).join(""), "Chưa có yêu cầu nào kết thúc."); })()}`;
    } else if (view === "gm") {
      const L = live(R).filter(x => x.loai === "GM").sort((a, b) => String(b.ngay).localeCompare(String(a.ngay)));
      h += `<div class="tools"><button class="btn primary" type="button" id="rdNewGM">+ Ghi giao mẫu</button><button class="btn" type="button" id="rdPrGM">🖨 In sổ BM.03</button>${!L.length ? '<button class="btn" type="button" id="rdImpGM">Chuyển 4 dòng từ sổ BM.03 trên Drive</button>' : ""}</div>
        ${(() => { if (!L.length) return '<div class="empty"><b>Chưa có mẫu giao khảo nghiệm</b></div>';
          const gr = g => `<div class="row click" data-id="${E(g.id)}"><div class="name">${E(g.d.ten || "")} <span class="st ${g.d.ngayTra ? "done" : "run"}">${g.d.ngayTra ? "Đã có kết quả" : "Chờ kết quả"}</span></div><div class="kg">${E(g.d.sl || "")}<small>${E(g.d.dvt || "")} ${E(g.d.ttl || "")}</small></div>
            <div class="meta">Gửi ${D(g.ngay)}${g.d.ngayTra ? "" : " · đã " + Math.max(0, dDiff(today(), g.ngay)) + " ngày"} · ${E(g.d.phong || "R&D")} → ${E(g.d.nguoiNhan || "—")}${g.d.maMau ? " · mã mẫu " + E(g.d.maMau) : ""}${g.d.ngayTra ? " · trả KQ " + D(g.d.ngayTra) : ""}</div></div>`;
          const A = L.filter(g => !g.d.ngayTra), X = L.filter(g => g.d.ngayTra);
          return zone("theodoi", "⏳", "Đang theo dõi", "mẫu đã gửi, chờ kết quả khảo nghiệm", A.length, A.map(gr).join(""), "Không có mẫu nào đang chờ kết quả.") + zone("xong", "✅", "Đã xong", "đã có kết quả", X.length, X.map(gr).join(""), "Chưa có mẫu nào trả kết quả."); })()}`;
    } else {
      h += `<div class="tools"><button class="btn" type="button" id="rdPrSO">🖨 In sổ BM.01</button><span class="note">Sổ tự tổng hợp từ yêu cầu (BM.04) và phiếu thử nghiệm (BM.02).</span></div>${soTable(false)}`;
    }
    b.innerHTML = h;
    b.querySelectorAll(".seg [data-v]").forEach(x => x.onclick = () => { view = x.dataset.v; renderRD(); });
    b.querySelectorAll("[data-prpt]").forEach(x => x.onclick = ev => { ev.stopPropagation(); const r = rec(x.dataset.prpt); if (r) prPT(r, r.d); });
    b.querySelectorAll(".rd-steps [data-b]").forEach(x => x.onclick = () => { fB = fB === x.dataset.b ? "" : x.dataset.b; renderRD(); });
    { const fa = b.querySelector("#rdFAll"); if (fa) fa.onclick = () => { fB = ""; renderRD(); }; const da = b.querySelector("#rdDoneAll"); if (da) da.onclick = () => { doneAll = true; renderRD(); }; }
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
  async function del(id) { if (!await askConfirm(["Xoá hồ sơ này? (khôi phục được trong Lịch sử / nhờ Quản lý)"])) return false; await api("webRDDel", S.auth, id, false); toast("Đã xoá"); return true; }
  const push = (title, body, to) => { try { window.SKPush && SKPush.send(title, body, to, "rd-" + title.slice(0, 20)); } catch (e) {} };

  /* ---------------- BM.02: công thức – phiếu kiểm tra pha chế ---------------- */
  function ptDlg(p) {
    const ql = QL(), d = p ? JSON.parse(JSON.stringify(p.d)) : (window.__rdSeed ? Object.assign({ ngayLap: today(), tt: "Giao" }, window.__rdSeed) : { ngayLap: today(), nl: [{}, {}, {}, {}, {}], kq: CT0(), tt: "Giao", me: 500 });
    window.__rdSeed = null; if (d.t54 == null) d.t54 = true; if (d.t0 == null) d.t0 = (d.kq || []).some(r => String(r.c || "").trim()); if (!d.me) d.me = 500; if (!d.ngayLap) d.ngayLap = p ? p.ngay : today(); if (d.dang == null) d.dang = dangOf(d.sp);
    if (!d.nl || !d.nl.length) d.nl = [{}]; if (!d.kq || !d.kq.length) d.kq = CT0();
    const me = S.me.ten, toi = d.nguoiTH === me, ghiKQ = ql || (toi && d.tt !== "Đã duyệt"), ro = !ql ? "disabled" : "";
    /* NGƯỜI THỰC HIỆN điều chỉnh công thức theo thực tế pha chế: sửa %w/w, đổi / thêm / bỏ phụ gia, dung môi.
       Dòng hoạt chất (Tech) do TP. LAB/RD ghi → khoá. Loại "Thử nghiệm lô tech mới" → khoá cả công thức. Phiếu "thử tỷ lệ khác": người thực hiện tự lập, chép từ phiếu đang làm. */
    const cp = x => JSON.parse(JSON.stringify(x)), techMoi = (d.loaiTN || LOAI_TN[0]) === LOAI_TN[1], bienThe = !p && !ql && !!d.tu;
    const suaCT = !ql && toi && d.tt !== "Đã duyệt" && !techMoi;
    const GOC = d.nlGoc ? cp(d.nlGoc) : (ql ? null : cp(d.nl.filter(r => String(r.ten || "").trim() || r.ma))); /* công thức TP. LAB/RD giao */
    const GB = {}; (GOC || []).forEach(r => { const k = kNL(r); if (k && !GB[k]) GB[k] = r; });
    /* dòng MỚI do người thực hiện thêm: là hoạt chất khi danh mục ghi nhóm "Nguyên liệu" hoặc tên ghi rõ tech / TC / kỹ thuật (giống máy chủ: rdLoaiMoi_) */
    const loaiMoi = r => { const t = String(r.ten || "").trim(), it = r.ma && typeof itemBy === "function" ? itemBy(r.ma) : null, nh = it ? it.nhom : ""; if (!t && !r.ma) return "";
      if (nh === "Nguyên liệu") return "tech"; if (nh === "Phân bón") return "pb"; if (r.bu || SOLV.test(t)) return "dm"; return !nh && /\btech\b|\bTC\b|kỹ thuật/i.test(t) ? "tech" : "pg"; };
    const loaiNV = r => { const b = GB[kNL(r)]; return b ? loaiOf(b) : loaiMoi(r); };
    /* LOCK = các dòng người đang mở phiếu không sửa được (người thực hiện: dòng hoạt chất của công thức giao, khớp 1–1) */
    const LOCK = new WeakSet(), lockAll = () => { if (ql) return; const used = new Set();
      d.nl.forEach(r => { if (!suaCT) { LOCK.add(r); return; } const k = kNL(r), b = k && GOC.find(x => !used.has(x) && kNL(x) === k && loaiOf(x) === "tech"); if (b) { used.add(b); LOCK.add(r); } }); };
    lockAll();
    const edR = r => ql || (suaCT && !LOCK.has(r)), saiTech = r => suaCT && !LOCK.has(r) && loaiNV(r) === "tech", colX = ql || suaCT;
    const YC = live(R).filter(x => x.loai === "YC");
    const VT = (S.items || []).filter(i => /Nguyên liệu|Phụ gia|Bán thành phẩm/.test(i.nhom)), lb = it => it.ma + " · " + it.ten;
    const nlList = VT.filter(i => ql || i.nhom !== "Nguyên liệu").map(i => `<option value="${E(lb(i))}"></option>`).join("");
    const findVT = v => { v = String(v || "").trim(); if (!v) return null; const u = v.toUpperCase(); return VT.find(i => lb(i) === v || i.ma.toUpperCase() === u || i.ten.toUpperCase() === u) || null; };
    const tonTxt = ma => { const t = ((S.bal || {})[ma] || {}).ton; return t == null ? "" : "tồn " + (Math.round(t * 100) / 100).toLocaleString("vi-VN") + " kg"; };
    const tag = r => r.ma ? `<small style="color:#2e7d32">✓ ${E(r.ma)} · ${tonTxt(r.ma)}</small>` : (String(r.ten || "").trim() ? '<small style="color:#b26a00">● vật tư mới (chưa có trong kho)</small>' : "");
    const liq = () => LONG.includes(d.dang), hcU = () => liq() ? "g/L" : "%";
    /* độ tinh khiết nguyên liệu kỹ thuật: lấy theo "98%" trong tên hoặc hàm lượng ở danh mục; không có thì coi 100% */
    const purOf = r => { const it = r.ma && typeof itemBy === "function" ? itemBy(r.ma) : null, m = /(\d{2,3}(?:[.,]\d+)?)\s*%/.exec((r.ten || "") + " " + (it ? it.ten + " " + (it.hamLuong || "") : "")); const v = m ? parseFloat(m[1].replace(",", ".")) : 100; return v > 0 && v <= 100 ? v : 100; };
    const loChip = (r, i) => { const k = loaiOf(r); return k ? `<button type="button" class="rd-lo" data-lo="${i}" style="--lc:${LO[k][1]}" title="${LO[k][0]}${ql ? " — bấm vạch màu để đổi: Tech → Dung môi → Phụ gia → Phân bón" : ""}" ${ql ? "" : "disabled"}></button>` : '<span class="rd-lo0"></span>'; };
    const maCell = r => r.ma ? `${E(r.ma)}` : (String(r.ten || "").trim() ? '<span class="rd-new">mới</span>' : "");
    const nlRows = () => d.nl.map((r, i) => { const ed = edR(r), dis = ed ? "" : "disabled";
      return `<tr data-row="${i}" style="--lc:${(LO[loaiOf(r)] || [, "#cfd8dc"])[1]}"><td class="c rd-num">${ql ? `<span class="rd-drag" draggable="true" data-dr="${i}" title="Kéo để đổi vị trí">⠿</span>` : ""}${i + 1}</td><td data-ma="${i}" class="rd-ma">${maCell(r)}</td><td class="rd-tn"><span data-loc="${i}">${loChip(r, i)}</span><input data-nl="${i}" data-k="ten" list="rdNlDl" value="${E(r.ten || "")}" ${dis} placeholder="${ql ? "Mã / tên vật tư trong kho, hoặc tên mới" : "Mã / tên phụ gia, dung môi"}"><small class="rd-nlt" data-nt="${i}"></small></td>
      <td><input data-nl="${i}" data-k="pct" type="number" step="any" inputmode="decimal" value="${E(r.pct === "" || r.pct == null ? "" : F3(r.pct, NDP(d.nl)))}" ${dis} style="text-align:right;font-weight:700"><small class="rd-goc" data-gp="${i}"></small></td>
      <td class="rd-can" data-can="${i}">${canOf(r, d)}</td>
      <td class="c"><input type="radio" name="ptBu" data-bu="${i}" ${r.bu ? "checked" : ""} ${dis} title="Dung môi nền: tự bù cho đủ 100%"></td>
      <td><b class="rd-hl" data-hl="${i}">${E(HLtxt(r, d))}</b><input data-nl="${i}" data-k="gc" value="${E(r.gc || "")}" ${dis} data-opt placeholder="" title="${E(r.gc || "")}"></td>
      ${colX ? `<td class="rd-act">${ed ? `<button type="button" class="rd-mv rd-x" data-rmnl="${i}" title="${ql ? "Xoá dòng" : "Bỏ dòng này khỏi công thức"}">✕</button>` : '<span class="rd-lk" title="Hoạt chất — do TP. LAB/RD ghi, giữ nguyên">🔒</span>'}</td>` : ""}</tr>`; }).join("");
    /* mức yêu cầu: "5-7", "5 – 7", "≥ 90", ">= 90", "≤ 3", "< 3" → kiểm số đo, tô xanh / đỏ */
    const inYc = (yc, v) => { const x = parseFloat(String(v || "").replace(",", ".")); if (!isFinite(x) || !String(v).trim().match(/^[\d.,\s]+$/)) return null; const t = String(yc || "").replace(/,/g, ".");
      let m = /(-?\d+(?:\.\d+)?)\s*[-–÷~]\s*(-?\d+(?:\.\d+)?)/.exec(t); if (m) return x >= +m[1] && x <= +m[2];
      m = /(≥|>=|>|min)\s*(-?\d+(?:\.\d+)?)/i.exec(t); if (m) return m[1] === ">" ? x > +m[2] : x >= +m[2];
      m = /(≤|<=|<|max)\s*(-?\d+(?:\.\d+)?)/i.exec(t); if (m) return m[1] === "<" ? x < +m[2] : x <= +m[2]; return null; };
    const cols = () => ["a"].concat(d.t54 ? ["b"] : [], d.t0 ? ["c"] : []);
    const kqHead = () => `<tr><th style="width:30%">Chỉ tiêu · điều kiện · phương pháp</th><th style="width:18%">Yêu cầu</th><th>Điều kiện thường 28±2 °C</th>${d.t54 ? `<th>Lưu mẫu 54±2 °C, 14 ngày${d.ngayBD ? `<br><small>đọc ngày ${D(add(d.ngayBD, 14))}</small>` : ""}</th>` : ""}${d.t0 ? `<th>Lưu mẫu 0±2 °C, 7 ngày${d.ngayBD ? `<br><small>đọc ngày ${D(add(d.ngayBD, 7))}</small>` : ""}</th>` : ""}${ql ? '<th style="width:38px"></th>' : ""}</tr>`;
    const wOf = r => r.w != null ? r.w : (r.n28 ? "a" : (catOf(r.ct) || {}).w || (/t[ỷỉ] tr[ọo]ng|density/i.test(r.ct || "") ? "a" : "abc"));
    const ctDl = `<datalist id="rdCtDl">${CAT.map(c => `<option value="${E(c.ct)}">${E((c.nb ? "nội bộ · " : "QCVN · ") + (c.pp || ""))}</option>`).join("")}</datalist>`;
    const kqRows = () => d.kq.map((r, i) => { const wv = wOf(r);
      return `<tr><td><input data-kq="${i}" data-k="ct" list="rdCtDl" value="${E(r.ct || "")}" ${ql ? "" : "disabled"} placeholder="Chọn hoặc gõ chỉ tiêu" title="${E(r.ct || "")}">
        <div class="rd-w">${[["a", "28°"], ["b", "54°"], ["c", "0°"]].map(([k, t]) => `<label title="Đo ở điều kiện này"><input type="checkbox" data-w="${i}" data-c="${k}" ${wv.includes(k) ? "checked" : ""} ${ql ? "" : "disabled"}>${t}</label>`).join("")}<textarea data-kq="${i}" data-k="pp" rows="1" ${ql ? "" : "disabled"} placeholder="phương pháp" class="rd-pp rd-ta" title="Phương pháp thử">${E(r.pp || "")}</textarea>${r.nb ? '<span class="rd-nb">nội bộ</span>' : ""}</div></td>
        <td><textarea data-kq="${i}" data-k="yc" rows="1" class="rd-ta" ${ql ? "" : "disabled"} placeholder="Mức yêu cầu">${E(r.yc || "")}</textarea></td>
        ${cols().map(k => !wv.includes(k) ? `<td class="c note">—</td>` : `<td><textarea data-kq="${i}" data-k="${k}" rows="1" class="rd-ta rd-kqv" ${ghiKQ ? "" : "disabled"}${kqOpt(k)} placeholder="${ghiKQ ? (k !== "a" && d.ngayBD && add(d.ngayBD, k === "b" ? 14 : 7) > today() ? "đọc ngày " + D(add(d.ngayBD, k === "b" ? 14 : 7)) : "Nhập kết quả") : ""}">${E(r[k] || "")}</textarea></td>`).join("")}
        ${ql ? `<td><button type="button" class="btn small" data-rmkq="${i}">✕</button></td>` : ""}</tr>`; }).join("");
    const kqMark = () => w.querySelectorAll('[data-kq]').forEach(el => { const k = el.dataset.k; if (!"abc".includes(k)) return; const r = d.kq[+el.dataset.kq], ok = inYc(r.yc, r[k]); el.style.boxShadow = ok === null ? "" : ok ? "inset 0 0 0 2px #2e7d32" : "inset 0 0 0 2px #c62828"; el.title = ok === null ? "" : ok ? "Đạt mức yêu cầu" : "Ngoài mức yêu cầu " + r.yc; });
    /* đầu phiếu: 5 bước, đang ở bước nào, ai làm gì tiếp (theo bản đã lưu) */
    const guide = () => { const ST = BUOC.slice(0, 5).map(x => x[1]);
      const st = i0 => `<ol class="rd-stepper">${ST.map((t, i) => `<li class="${i < i0 ? "done" : i === i0 ? "cur" : ""}"><i>${i < i0 ? "✓" : i + 1}</i><span>${t}</span></li>`).join("")}</ol>`;
      if (bienThe) return `<div class="rd-guide z-lam">${st(0)}<p>⚗ <b>Phiếu thử tỷ lệ khác</b> — chép từ phiếu <b>${E(d.tu)}</b>. Ở <b>mục 2</b>, sửa %w/w, đổi / thêm / bỏ phụ gia, dung môi cho đúng tỷ lệ bạn sẽ pha, rồi bấm <b>Lưu phiếu mới</b>.</p><p class="note">Phiếu mới có số riêng và kết quả riêng; phiếu ${E(d.tu)} giữ nguyên. TP. LAB/RD được báo ngay khi bạn lưu.</p></div>`;
      if (!p) return `<div class="rd-guide z-lam">${st(-1)}<p>👉 <b>Chuẩn bị — bạn (Quản lý):</b> ghi tên sản phẩm, dạng, công thức %w/w (mục 2), quy trình pha chế (mục 3), chọn <b>Người thực hiện</b> rồi bấm <b>Lưu &amp; giao việc</b>.</p><p class="note">Mục 4 (kết quả) và mục 5 (đánh giá) để người thực hiện ghi sau — chưa cần điền bây giờ.</p></div>`;
      const b = buoc(p.d), mine = cuaToi(b), td = today(), i0 = b.i; /* 0–4 = đang ở bước đó · 5 = xong cả 5 bước */
      const luu = b.luu.map(x => `Lưu mẫu ${E(luuTxt(x))} ${x.ngay > td ? "(còn " + dDiff(x.ngay, td) + " ngày)" : x.ngay === td ? "<b>(hôm nay)</b>" : `<b style="color:#c62828">(quá ${dDiff(td, x.ngay)} ngày)</b>`}`).join(" · ");
      const CHO = { giao: "mở mục 2 xem công thức và cột <b>Cân</b>, pha mẫu, rồi ghi <b>Ngày bắt đầu</b> ở mục 4 và bấm Lưu kết quả.", kq0: "ghi kết quả cột <b>Điều kiện thường</b> ở mục 4 (đã ghi " + b.P.a[0] + "/" + b.P.a[1] + " chỉ tiêu), bấm Lưu kết quả.", doc: "đã đến ngày đọc mẫu — ghi kết quả cột <b>Lưu mẫu</b> ở mục 4, bấm Lưu kết quả.", bao: "đã đủ kết quả — chọn <b>Đạt / Không đạt</b> ở mục 5 rồi bấm <b>📨 Báo kết quả</b>.", duyet: p.d.hong ? "mẫu hỏng — xem mục 4, chọn kết luận và hướng xử lý ở mục 5 rồi bấm <b>Lưu</b> để duyệt." : "xem kết quả mục 4, chọn <b>Đạt / Không đạt</b> ở mục 5 rồi bấm <b>Lưu</b> để duyệt." };
      const body = b.z === "xong" ? `<p>✅ <b>Đã xong</b> — kết luận <b>${E(p.d.danhGia || "")}</b>${p.d.xuLy ? " · " + E(p.d.xuLy) : ""}${p.d.duyetBoi ? " · duyệt: " + E(p.d.duyetBoi) + " " + E(p.d.duyetLuc || "") : ""}. In BM.02 để ký${ql && p.d.xuLy === "Thử nghiệm lại" ? "; cần thử lại thì bấm <b>↻ Thử lại (phiếu mới)</b>" : ""}.</p>`
        : b.z === "theodoi" ? `<p>⏳ <b>Đang theo dõi — chưa phải làm gì.</b> ${luu}. Đến ngày, máy nhắc <b>${E(b.who)}</b> ghi kết quả lưu mẫu.</p>`
        : `<p>👉 <b>Việc tiếp theo — ${mine ? "bạn" : E(b.who)}:</b> ${CHO[b.k] || E(b.viec)}${mine ? ` <button type="button" class="btn small rd-goto" data-goto="${b.k === "bao" || b.k === "duyet" ? "ptS5" : "ptS4"}">Tới mục ${b.k === "bao" || b.k === "duyet" ? 5 : 4} ↓</button>` : ""}</p>${luu && b.k !== "duyet" ? `<p class="note">${luu}</p>` : ""}${!mine && b.k !== "duyet" && ql ? '<p class="note">Bạn là Quản lý: xem được tiến độ; các ô kết quả do người thực hiện ghi.</p>' : ""}${mine && !ql && (b.k === "giao" || b.k === "kq0") ? (suaCT ? '<p class="note">⚗ Pha khác công thức giao (tỷ lệ chất nhũ, phụ gia, dung môi…)? Sửa thẳng ở <b>mục 2</b> rồi Lưu kết quả — hoặc bấm <b>Thử tỷ lệ khác</b> ở cuối phiếu để mỗi tỷ lệ một phiếu riêng.</p>' : techMoi ? '<p class="note">🔒 Thử nghiệm lô tech mới: pha đúng công thức giao (không đổi tỷ lệ, phụ gia) để so sánh lô tech.</p>' : "") : ""}`;
      return `<div class="rd-guide z-${b.z}${b.k === "doc" || p.d.hong ? " bad" : ""}">${st(i0)}${body}</div>`; };
    /* ô kết quả chưa tới lượt (Quản lý xem phiếu giao người khác · cột lưu mẫu chưa đến ngày đọc): không tính là "ô cần điền" */
    const kqOpt = k => { if (ql && d.nguoiTH && d.nguoiTH !== S.me.ten) return " data-opt"; if (k === "b" || k === "c") { const n = d.ngayBD ? add(d.ngayBD, k === "b" ? 14 : 7) : ""; if (!n || n > today()) return " data-opt"; } return ""; };
    const ctHint = suaCT ? `<div class="rd-ct ed">✏️ <b>Bạn điều chỉnh được công thức theo thực tế pha chế</b>: sửa %w/w, đổi tên / thêm / bỏ <b class="c-pg">phụ gia</b>, <b class="c-dm">dung môi</b>. Dòng <b class="c-tech">Tech</b> 🔒 (hoạt chất) do TP. LAB/RD ghi — giữ nguyên.${bienThe ? "" : " Muốn giữ phiếu này và thử thêm một tỷ lệ nữa: bấm <b>⚗ Thử tỷ lệ khác</b> ở cuối phiếu."}</div>`
      : !ql && toi && techMoi && d.tt !== "Đã duyệt" ? '<div class="rd-ct lock">🔒 <b>Thử nghiệm lô tech mới</b> — pha đúng công thức giao để so sánh lô tech: không điều chỉnh tỷ lệ, phụ gia.</div>' : "";
    const ctBox = !GOC ? "" : `<div class="rd-ct diff" id="ptCt" hidden><p id="ptCtH"></p><ul id="ptCtL" class="rd-ct-l"></ul>${suaCT ? `<div class="rd-ct-f"><label>Lý do điều chỉnh<input id="ptCtLy" data-opt maxlength="300" value="${E((d.nlSua && d.nlSua.ly) || "")}" placeholder="VD nhũ chưa bền → tăng chất nhũ; đổi dung môi vì…"></label><button type="button" class="btn small" id="ptCtReset">↺ Về công thức giao</button></div>` : ql ? '<div class="rd-ct-f"><button type="button" class="btn small" id="ptCtReset">↺ Về công thức giao ban đầu</button><span class="note">Bạn sửa công thức rồi Lưu thì công thức đó thành công thức giao mới.</span></div>' : ""}</div>`;
    const w = dlg(p ? `Phiếu thử nghiệm ${E(d.so || "")}` : bienThe ? `Thử tỷ lệ khác — chép từ ${E(d.tu)}` : "Lập công thức thử nghiệm", `
      ${guide()}
      ${p && (d.tt === "Đã duyệt" || d.tt === "Đã báo KQ") ? `<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 8px;padding:9px 12px;border-radius:10px;background:rgba(46,125,50,.08);border:1.5px solid rgba(46,125,50,.4)"><b style="color:#2e7d32">${d.tt === "Đã duyệt" ? "✓ Phiếu đã hoàn thành — in ra để ký" : "Đã báo kết quả — có thể in ra trình ký"}</b><button class="btn primary small" type="button" id="ptPrTop">🖨 In BM.02 (ký: Phòng R&amp;D · Nhân viên thực hiện)</button></div>` : ""}
      <p class="note" style="margin:0 0 8px">BM.02-RD-QT.01 · ${p ? chip(p) : ""} ${d.tu ? " · " + (d.tuNV ? "⚗ thử tỷ lệ khác" : "↻ thử lại") + ", chép từ <b>" + E(d.tu) + "</b>" : ""}${d.baoLuc ? " · báo kết quả " + E(d.baoLuc) : ""}${d.duyetBoi ? " · duyệt: " + E(d.duyetBoi) + " " + E(d.duyetLuc || "") : ""}</p>
      <div class="grp">1. Thông tin chung ${ql ? "" : '<small class="note">(do TP. LAB/RD lập)</small>'}</div>
      <div class="two"><label>Tên sản phẩm *<input id="ptSp" value="${E(d.sp || "")}" ${ro} placeholder="VD Pymetrozine 20% + Nitenpyram 15% OD"></label><label>Mã công thức<input id="ptMa" value="${E(d.maCT || "")}" ${ro} placeholder="VD PN35OD-03"></label></div>
      <div class="two"><label>Hàm lượng<input id="ptHl" value="${E(d.hl || "")}" ${ro}></label><label>Loại thử nghiệm<select id="ptLoai" ${ro}>${LOAI_TN.map(x => `<option ${x === (d.loaiTN || LOAI_TN[0]) ? "selected" : ""}>${x}</option>`).join("")}</select></label></div>
      <div><label>Thuộc yêu cầu nghiên cứu (sổ BM.04)<select id="ptYc" ${ro} data-opt><option value="">— Để trống: tự ghi 1 dòng mới vào sổ BM.04 —</option>${YC.map(y => `<option value="${E(y.id)}" ${y.id === d.yc ? "selected" : ""}>${E(D(y.ngay) + " · " + (y.d.noiDung || "").slice(0, 60))}</option>`).join("")}</select></label></div>
      <div class="two"><label>Ngày lập phiếu<input id="ptLap" type="date" value="${E(d.ngayLap || "")}" ${ro}></label><label>Người thực hiện<select id="ptNg" ${ro}>${userOpts(d.nguoiTH)}</select></label></div>
      <div class="two"><label>Dạng sản phẩm *<select id="ptDang" ${ro}><option value="">— chọn dạng —</option>${DANGS.map(x => `<option ${x === d.dang ? "selected" : ""}>${x}</option>`).join("")}</select></label><span></span></div>
      <div class="two" id="ptTTRow" ${liq() ? "" : "hidden"}><label>Tỷ trọng dự kiến (g/ml) *<input id="ptTT" type="number" step="any" inputmode="decimal" value="${E(d.tyTrong || "")}" ${ro} placeholder="VD 1.10 — để quy g/L ra %w/w"></label><span></span></div>
      ${ql ? `<div class="tools" style="margin:4px 0"><select id="ptFrom" style="max-width:420px" data-opt><option value="">📋 Chép công thức từ…</option><optgroup label="Phiếu thử trước">${live(R).filter(x => x.loai === "PT" && (!p || x.id !== p.id)).map(x => `<option value="pt:${E(x.id)}">${E((x.d.so || "") + " · " + (x.d.sp || "") + (x.d.maCT ? " · " + x.d.maCT : "") + (x.d.danhGia ? " · " + x.d.danhGia : ""))}</option>`).join("")}</optgroup><optgroup label="Công thức sản xuất đang dùng">${Object.keys(S.congThuc || {}).map(m => `<option value="ct:${E(m)}">${E(m + " · " + ((itemBy && itemBy(m) || {}).ten || ""))}</option>`).join("")}</optgroup></select></div>` : ""}
      <div class="grp">2. Công thức sản phẩm ${suaCT ? '<small class="note" style="color:#2563eb">(bạn điều chỉnh được phụ gia, dung môi)</small>' : ""}</div>
      <datalist id="rdNlDl">${nlList}</datalist>
      <p class="note" style="margin:0 0 6px"><span class="rd-leg"><i style="--lc:#7c3aed">Tech</i><i style="--lc:#0277bd">Dung môi</i><i style="--lc:#d97706">Phụ gia</i><i style="--lc:#2e7d32">Phân bón</i></span> Ghi %w/w từng nguyên liệu. Chọn ô <b>Up to</b> ở dòng <b>dung môi nền</b> (nước, dầu, chất mang…) để tự bù cho đủ 100%.</p>
      ${ctHint}
      <div class="rd-me"><b>Mẻ thử</b> <input id="ptMeSL" type="number" step="any" inputmode="decimal" min="0" value="${E(d.meSL || "")}" ${ghiKQ ? "" : "disabled"}${ql && d.nguoiTH && d.nguoiTH !== S.me.ten ? " data-opt" : ""} placeholder="Số lượng"> <select id="ptMeDV" ${ghiKQ ? "" : "disabled"}>${MEDV.map(u => `<option ${u === (d.meDV || "g") ? "selected" : ""}>${u}</option>`).join("")}</select> <span class="note" id="ptMeNote">→ cột <b>Cân</b> tự tính lượng từng nguyên liệu, khỏi tính tay.</span></div>
      <p class="note rd-swipe">↔ Vuốt ngang bảng để xem đủ các cột.</p><div class="dgx rd-tb rd-ctb"><table><colgroup><col style="width:${ql ? 46 : 30}px"><col style="width:132px"><col><col style="width:96px"><col style="width:84px"><col style="width:46px"><col style="width:16%">${colX ? '<col style="width:40px">' : ""}</colgroup><thead><tr><th>#</th><th>Mã VT</th><th>Tên nguyên liệu</th><th>%w/w</th><th id="ptCanH" title="Lượng cân theo mẻ thử">Cân (g)</th><th title="Dung môi nền / nước / chất mang: tự bù cho đủ 100%">Up to</th><th>Hàm lượng <select id="ptDvHL" class="rd-dvhl" title="Đơn vị hàm lượng hoạt chất" ${ql ? "" : "disabled"}>${["g/L", "g/kg", "%"].map(u => `<option ${u === DVHL(d) ? "selected" : ""}>${u}</option>`).join("")}</select> / Ghi chú</th>${colX ? '<th></th>' : ""}</tr></thead><tbody id="ptNl">${nlRows()}</tbody>
      <tfoot><tr><td></td><td></td><td><b>Tổng cộng</b> ${colX ? `<button type="button" class="btn small" id="ptAddNl">${ql ? "+ dòng" : "+ phụ gia / dung môi"}</button>` : ""}</td><td id="ptSum" style="text-align:right;font-weight:700"></td><td id="ptCanSum" class="rd-can" style="font-weight:700"></td><td colspan="${colX ? 3 : 2}"></td></tr></tfoot></table></div>
      ${ctBox}
      <div class="grp">3. Quy trình pha chế</div>
      <textarea id="ptQT" rows="5" ${ro} style="width:100%" placeholder="Các bước pha chế, thứ tự cho nguyên liệu, tốc độ khuấy, thời gian, nhiệt độ…">${E(d.quyTrinh || "")}</textarea>
      <div class="grp" id="ptS4">4. Kết quả thực hiện ${toi && !ql ? '<small class="note" style="color:#2563eb">(phần của bạn)</small>' : ""}</div>
      ${d.hong ? `<div style="margin:6px 0;padding:9px 12px;border-radius:10px;border:1.5px solid #c62828;background:rgba(198,40,40,.08);color:#c62828"><b>⛔ Mẫu hỏng – dừng theo dõi</b> · ${E(d.hong.gd)} · ngày ${D(d.hong.ngay)}${d.hong.nd != null && d.hong.nd !== "" ? " (sau " + d.hong.nd + " ngày)" : ""}<br>Hiện tượng: ${E(d.hong.hien || "")}${ghiKQ && d.tt !== "Đã duyệt" ? ' <button type="button" class="btn small" id="ptHongX" style="margin-left:6px">Bỏ ghi hỏng</button>' : ""}</div>` : ""}
      <label style="max-width:300px">Ngày bắt đầu pha chế, lưu mẫu (người thực hiện ghi)<input id="ptBD" type="date" value="${E(d.ngayBD || "")}" ${ghiKQ ? "" : "disabled"}${ql && d.nguoiTH && d.nguoiTH !== S.me.ten ? " data-opt" : ""}></label>
      <div class="rd-dgr" style="align-items:center"><span class="rd-dgl" style="padding:0">Lưu mẫu thử</span><label class="pk"><input type="checkbox" id="pt54" ${d.t54 ? "checked" : ""} ${ro}> 54±2 °C, 14 ngày</label><label class="pk"><input type="checkbox" id="pt0" ${d.t0 ? "checked" : ""} ${ro}> 0±2 °C, 7 ngày</label><span class="note">(luôn theo dõi ở điều kiện thường 28±2 °C)</span></div>
      ${ctDl}${ql ? `<div class="tools" style="margin:4px 0"><button type="button" class="btn small" id="ptQcvn">📋 Lấy chỉ tiêu theo QCVN 01-188 cho dạng <span class="ptDg2">${E(d.dang || "…")}</span></button><span class="note">Chọn chỉ tiêu từ danh sách để tự điền mức yêu cầu (QCVN) và phương pháp (QC-HD nội bộ).</span></div>` : ""}
      <div class="dgx rd-tb"><table><thead id="ptKqH">${kqHead()}</thead><tbody id="ptKq">${kqRows()}</tbody></table></div>
      ${ghiKQ ? '<button type="button" class="btn small" id="ptAddKq" style="margin-top:6px">+ chỉ tiêu</button>' : ""}
      <div class="two" style="margin-top:8px"><label>Kết quả ban đầu (tóm tắt — ghi vào Sổ BM.01)<textarea id="ptKqbd" rows="2" ${ghiKQ ? "" : "disabled"}>${E(d.kqbd || "")}</textarea></label><label>Đề xuất của người thực hiện<textarea id="ptDx" rows="2" ${ghiKQ ? "" : "disabled"}>${E(d.deXuat || "")}</textarea></label></div>
      <label style="max-width:300px">Ngày kết thúc (người thực hiện ghi)<input id="ptKT" type="date" value="${E(d.ngayKT || "")}" ${ghiKQ ? "" : "disabled"} data-opt title="Để trống: tự ghi ngày bấm Báo kết quả"></label>
      <div class="grp" id="ptS5">5. Đánh giá <small class="note">(người thực hiện đánh giá, TP. LAB/RD duyệt)</small></div>
      <div class="rd-dg">
        ${d.tt === "Đã báo KQ" && ql ? `<div class="rd-wait">📨 ${E(d.nguoiTH || "")} đã báo kết quả${d.baoLuc ? " lúc " + E(d.baoLuc) : ""} — xem phần 4, 5 rồi bấm Lưu để duyệt.</div>` : ""}
        <div class="rd-dgr"><span class="rd-dgl">Kết luận</span><div class="rd-opts">
          ${[["Đạt", "✓ Đạt", "ok"], ["Không đạt", "✗ Không đạt", "bad"]].map(([v, t, c]) => `<label class="rd-opt ${c}"><input type="radio" name="ptDg" value="${v}" ${(d.danhGia || (d.hong ? "Không đạt" : "")) === v ? "checked" : ""} ${ghiKQ ? "" : "disabled"}><span>${t}</span></label>`).join("")}</div></div>
        <div class="rd-dgr"><span class="rd-dgl">Đề xuất xử lý</span><div class="rd-opts">
          ${[["Thử nghiệm lại", "↻ Thử nghiệm lại", "re"], ["Không thử lại", "■ Không thử lại", "no"]].map(([v, t, c]) => `<label class="rd-opt ${c}"><input type="radio" name="ptXl" value="${v}" ${(d.xuLy || (d.hong ? "Thử nghiệm lại" : "")) === v ? "checked" : ""} ${ghiKQ ? "" : "disabled"}><span>${t}</span></label>`).join("")}</div></div>
        <div class="rd-dgr"><span class="rd-dgl">Ghi chú</span><textarea id="ptGc" rows="2" ${ghiKQ ? "" : "disabled"} style="flex:1 1 300px;min-width:240px" placeholder="Nhận xét, hướng điều chỉnh công thức…">${E(d.ghiChu || "")}</textarea></div>
        ${!ql && !d.danhGia ? '<p class="note" style="margin:6px 0 0">Bạn tự đánh giá kết luận và đề xuất xử lý, rồi bấm Báo kết quả — TP. LAB/RD sẽ xem và duyệt.</p>' : ""}
      </div>
      <div class="actions" style="flex-wrap:wrap">
        ${ql ? `<button class="btn primary" type="button" id="ptSave">${p ? "Lưu" : "Lưu & giao việc"}</button>` : ""}
        ${!ql && toi && d.tt !== "Đã duyệt" ? (() => { if (bienThe) return '<button class="btn primary" type="button" id="ptDraft">Lưu phiếu mới</button>'; const bao = p && buoc(p.d).k === "bao"; /* nút chính = việc của bước hiện tại */
          return `<button class="btn${bao ? "" : " primary"}" type="button" id="ptDraft">Lưu kết quả</button><button class="btn${bao ? " primary" : ""}" type="button" id="ptBao">📨 Báo kết quả</button>`; })() : ""}
        ${(toi || ql) && d.tt !== "Đã duyệt" && !d.hong && !bienThe ? '<button class="btn danger" type="button" id="ptHong">⛔ Mẫu hỏng<span class="fnm"> – dừng theo dõi</span></button>' : ""}
        ${p ? '<button class="btn" type="button" id="ptPr">🖨 In<span class="fnm"> BM.02</span></button>' : ""}${p && !ql && toi && !techMoi ? '<button class="btn" type="button" id="ptBT" title="Lập phiếu mới chép từ phiếu này để thử một tỷ lệ / phụ gia khác — mỗi tỷ lệ một phiếu, kết quả ghi riêng">⚗ Thử tỷ lệ khác<span class="fnm"> (phiếu mới)</span></button>' : ""}${p && ql ? '<button class="btn" type="button" id="ptLai">↻ Thử lại<span class="fnm"> (phiếu mới)</span></button>' : ""}${p && ql && d.tt === "Đã duyệt" ? '<button class="btn" type="button" id="ptMo">🔓 Mở lại để sửa</button>' : ""}
        ${p && (ql || (p.nguoi === me && d.tuNV && d.tt !== "Đã duyệt")) ? '<button class="btn danger" type="button" id="ptDel">Xoá</button>' : ""}
        <span style="flex:1"></span><button class="btn" type="button" data-x>Đóng</button></div>`, true);
    const q = s => w.querySelector(s);
    const num = v => { const x = parseFloat(String(v ?? "").replace(",", ".")); return isFinite(x) ? x : 0; };
    /* khung "đã điều chỉnh so với công thức giao" dưới bảng + ghi chú nhỏ ở từng dòng (giao x %, ＋ mới thêm, ⛔ hoạt chất) */
    const ctUp = () => { const bx = q("#ptCt"); if (!bx || !GOC) return; const DF = diffNl(d.nl, GOC), sx = d.nlSua || {}, lucT = sx.luc ? E(D(sx.luc) + " " + String(sx.luc).slice(11)) : "";
      bx.hidden = !DF.length; q("#ptCtL").innerHTML = DF.map(diffLi).join("");
      q("#ptCtH").innerHTML = suaCT ? `⚗ <b>${bienThe ? "Phiếu mới khác công thức giao" : "Bạn đã điều chỉnh"} ${DF.length} chỗ</b>${bienThe ? "" : " so với công thức giao"}${!bienThe && d.nlDoi ? ' — <b class="rd-chua">chưa lưu</b>, bấm Lưu kết quả để ghi lại' : !bienThe && lucT ? " · đã lưu " + lucT : ""}:`
        : `⚗ <b>${E(sx.nguoi || d.nguoiTH || "Người thực hiện")}</b> ${d.tuNV ? "lập phiếu thử tỷ lệ khác (chép từ " + E(d.tu || "") + ") — khác công thức giao" : "đã điều chỉnh công thức so với công thức giao"}${lucT ? " (" + lucT + ")" : ""}${sx.ly ? " — lý do: <i>" + E(sx.ly) + "</i>" : ""}:`;
      d.nl.forEach((r, i) => { const gp = w.querySelector(`[data-gp="${i}"]`), nt = w.querySelector(`[data-nt="${i}"]`), k = kNL(r), b = k ? GB[k] : null;
        if (gp) gp.textContent = b && Math.abs(pN(r.pct) - pN(b.pct)) > 0.0005 ? "giao " + pT(b.pct) : "";
        if (nt) { const sai = saiTech(r), moi = !!k && !b; nt.textContent = sai ? "⛔ hoạt chất — do TP. LAB/RD ghi, không thêm ở đây được" : moi ? "＋ thêm so với công thức giao" : ""; nt.className = "rd-nlt" + (sai ? " bad" : moi ? " moi" : ""); } }); };
    const calc = () => {
      const tt = num(q("#ptTT") ? q("#ptTT").value : d.tyTrong), me = num(d.me) || 0;
      if (q("#ptTT") && !q("#ptTT").disabled) d.tyTrong = q("#ptTT").value.trim(); if (q("#ptDang") && !q("#ptDang").disabled) d.dang = q("#ptDang").value; if (q("#ptDvHL") && !d.dvHL) q("#ptDvHL").value = DVHL(d);
      const bi = d.nl.findIndex(r => r.bu); if (bi >= 0) d.nl[bi].pct = Math.round((100 - d.nl.reduce((s, r, i) => s + (i === bi ? 0 : num(r.pct)), 0)) * 1000) / 1000;
      const n = NDP(d.nl);
      if (q("#ptMeSL")) { d.meSL = q("#ptMeSL").value.trim(); d.meDV = q("#ptMeDV").value; }
      const MI = meInfo(d);
      if (q("#ptCanH")) q("#ptCanH").textContent = "Cân (" + (MI ? MI.u : (d.meDV === "kg" || d.meDV === "L" ? "kg" : "g")) + ")";
      if (q("#ptMeNote")) q("#ptMeNote").innerHTML = !MI ? "→ ghi lượng mẻ thử, cột <b>Cân</b> tự tính lượng từng nguyên liệu." : MI.noTT ? `→ chưa ghi tỷ trọng: tạm tính 1 ${MI.dv} = 1 ${MI.dv === "ml" ? "g" : "kg"}. Ghi tỷ trọng để ra đúng khối lượng.` : `→ tổng khối lượng mẻ ${MI.u === "g" ? MI.m.toFixed(2) : MI.m.toFixed(3)} ${MI.u}${MI.dv === "ml" || MI.dv === "L" ? " (theo tỷ trọng " + d.tyTrong + ")" : ""}.`;
      d.nl.forEach((r, i) => { const inp = w.querySelector(`[data-nl="${i}"][data-k="pct"]`), auto = !!r.bu, tr = w.querySelector(`tr[data-row="${i}"]`), mc = w.querySelector(`[data-ma="${i}"]`);
        if (tr) tr.style.setProperty("--lc", (LO[loaiOf(r)] || [, "#cfd8dc"])[1]); const lc = w.querySelector(`[data-loc="${i}"]`); if (lc) lc.innerHTML = loChip(r, i);
        const hc = w.querySelector(`[data-hl="${i}"]`); if (hc) hc.textContent = HLtxt(r, d);
        const cc = w.querySelector(`[data-can="${i}"]`); if (cc) cc.textContent = canOf(r, d, MI);
        if (inp && document.activeElement !== inp) inp.value = r.pct === "" || r.pct == null ? "" : F3(r.pct, n); if (inp) { inp.readOnly = !!auto; inp.style.background = auto ? "rgba(46,125,50,.08)" : ""; inp.title = auto ? (r.bu ? "Dung môi nền: up to 100%" : "Tự tính từ hàm lượng HC, độ tinh khiết " + r.pur + "% (lấy theo tên / danh mục vật tư)") : ""; }
      });
      const t = d.nl.reduce((s, r) => s + num(r.pct), 0), ok = Math.abs(t - 100) < 0.01;
      q("#ptSum").innerHTML = F3(t, n) + " %" + (t && !ok ? `<br><small>${t > 100 ? "thừa" : "thiếu"} ${F3(Math.abs(100 - t), n)}%</small>` : "");
      q("#ptSum").style.color = ok || !t ? "#2e7d32" : "#c62828";
      if (q("#ptCanSum")) { const sc = d.nl.reduce((s2, r) => s2 + (parseFloat(canOf(r, d, MI)) || 0), 0); q("#ptCanSum").textContent = MI && sc ? sc.toFixed(MI.u === "g" ? 2 : 3) : ""; }
      
      const warn = false; q("#ptTT").style.outline = warn ? "2px solid #c62828" : ""; q("#ptTT").title = warn ? "Dạng lỏng: ghi tỷ trọng để tính %w/w từ g/L" : "";
      ctUp();
    };
    const sum = calc;
    const wire = () => {
      w.querySelectorAll("[data-nl]").forEach(i => i.oninput = () => { const k = i.dataset.k, r = d.nl[+i.dataset.nl]; r[k] = (k === "pct" || k === "hc" || k === "pur") ? (i.value === "" ? "" : num(i.value)) : i.value;
        if (k === "ten") { const it = findVT(i.value); if (it) { r.ma = it.ma; r.ten = it.ten; } else { r.ma = ""; r.ten = i.value.trim(); } const mc = w.querySelector(`[data-ma="${i.dataset.nl}"]`); if (mc) mc.innerHTML = maCell(r); }
        if (k === "ten") r.pur = "";
        if (!ql) { d.nlDoi = 1; if (k === "ten") { const lo = loaiNV(r); if (lo) r.loai = lo; else delete r.loai; } } /* người thực hiện sửa công thức: loại dòng theo công thức giao / danh mục */
        if (false) { const it = r.ma ? itemBy(r.ma) : null; const m = it && /(\d{2}(?:[.,]\d+)?)\s*%/.exec(it.ten + " " + (it.hamLuong || "")); if (m && /TECH|TC|kỹ thuật/i.test(it.ten + it.ma)) { r.pur = num(m[1]); const pi = w.querySelector(`[data-nl="${i.dataset.nl}"][data-k="pur"]`); if (pi) pi.value = r.pur; } }
        calc(); });
      w.querySelectorAll('[data-k="pct"]').forEach(i => i.addEventListener("blur", () => setTimeout(calc)));
      w.onclick = e => { const b = e.target.closest && e.target.closest("[data-lo]"); if (!b || !ql) return; const r = d.nl[+b.dataset.lo], ks = ["tech", "dm", "pg", "pb"]; r.loai = ks[(ks.indexOf(loaiOf(r)) + 1) % 4]; calc(); };
      w.querySelectorAll("[data-bu]").forEach(i => i.onchange = () => { d.nl.forEach((r, k) => r.bu = k === +i.dataset.bu); if (!ql) { d.nlDoi = 1; d.nl.forEach(x => { if (!LOCK.has(x) && !GB[kNL(x)]) { const lo = loaiMoi(x); if (lo) x.loai = lo; } }); } calc(); });
      const fit = t => { t.style.height = "auto"; t.style.height = Math.max(30, t.scrollHeight + 2) + "px"; };
      w.querySelectorAll("textarea.rd-ta").forEach(t => { fit(t); t.addEventListener("input", () => fit(t)); t.addEventListener("keydown", e => { if (e.key === "Enter") e.preventDefault(); }); });
      w.querySelectorAll("[data-kq]").forEach(i => i.oninput = () => { const r = d.kq[+i.dataset.kq]; r[i.dataset.k] = i.value; kqMark();
        if (i.dataset.k === "ct") { const c = catOf(i.value); if (c) { Object.assign(r, { yc: r.yc || c.yc, pp: r.pp || c.pp, w: c.w, nb: c.nb ? 1 : 0 }); q("#ptKq").innerHTML = kqRows(); wire(); } } }); kqMark();
      w.querySelectorAll("[data-w]").forEach(c => c.onchange = () => { const r = d.kq[+c.dataset.w], set = new Set(wOf(r).split("")); c.checked ? set.add(c.dataset.c) : set.delete(c.dataset.c); r.w = ["a", "b", "c"].filter(x => set.has(x)).join(""); if (!c.checked) r[c.dataset.c] = ""; q("#ptKq").innerHTML = kqRows(); wire(); });
      w.querySelectorAll("[data-rmkq]").forEach(b => b.onclick = () => { d.kq.splice(+b.dataset.rmkq, 1); q("#ptKq").innerHTML = kqRows(); wire(); });
      w.querySelectorAll("[data-rmnl]").forEach(b => b.onclick = () => { if (!edR(d.nl[+b.dataset.rmnl])) return; d.nl.splice(+b.dataset.rmnl, 1); if (!ql) d.nlDoi = 1; q("#ptNl").innerHTML = nlRows(); wire(); calc(); });
      const mv = (a, b) => { if (b < 0 || b >= d.nl.length || a === b) return; const [x] = d.nl.splice(a, 1); d.nl.splice(b, 0, x); q("#ptNl").innerHTML = nlRows(); wire(); calc(); const tr = w.querySelector(`#ptNl tr[data-row="${b}"]`); if (tr) { tr.classList.add("rd-flash"); setTimeout(() => tr.classList.remove("rd-flash"), 700); } };
      w.querySelectorAll("[data-up]").forEach(b => b.onclick = () => mv(+b.dataset.up, +b.dataset.up - 1));
      w.querySelectorAll("[data-dn]").forEach(b => b.onclick = () => mv(+b.dataset.dn, +b.dataset.dn + 1));
      let from = null;
      w.querySelectorAll("[data-dr]").forEach(h => { h.ondragstart = e => { from = +h.dataset.dr; e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", String(from)); e.dataTransfer.setDragImage(h.closest("tr"), 20, 20); } catch (x) {} h.closest("tr").classList.add("rd-dragging"); };
        h.ondragend = () => { w.querySelectorAll("#ptNl tr").forEach(t => t.classList.remove("rd-dragging", "rd-over")); }; });
      w.querySelectorAll("#ptNl tr[data-row]").forEach(tr => { tr.ondragover = e => { if (from == null) return; e.preventDefault(); w.querySelectorAll("#ptNl tr").forEach(t => t.classList.remove("rd-over")); tr.classList.add("rd-over"); };
        tr.ondrop = e => { e.preventDefault(); const to = +tr.dataset.row; const f = from; from = null; mv(f, to); }; });
    };
    wire(); calc();
    /* nút Đạt / Không đạt, Thử lại / Không thử lại: bấm lần nữa để bỏ chọn */
    w.querySelectorAll(".rd-opt input[type=radio]").forEach(r => {
      const mark = () => w.querySelectorAll(`input[name="${r.name}"]`).forEach(x => x.dataset.was = x.checked ? "1" : "");
      mark(); r.addEventListener("click", () => { if (r.dataset.was === "1") r.checked = false; mark(); });
    });
    setTimeout(() => { if (!p && q("#ptMa") && !q("#ptMa").value) autoMa(); }, 0);
    if (q("#ptTT")) q("#ptTT").oninput = calc;
    if (q("#ptQcvn")) q("#ptQcvn").onclick = () => { if (!d.dang) return toast("Chọn dạng sản phẩm trước.");
      const have = new Set(d.kq.map(r => r.ct)), add2 = ctOf(d.dang).filter(r => !have.has(r.ct)); d.kq = d.kq.filter(r => String(r.ct || "").trim() || r.a || r.b || r.c).concat(add2);
      q("#ptKq").innerHTML = kqRows(); wire(); toast(add2.length ? "Đã thêm " + add2.length + " chỉ tiêu theo QCVN 01-188 dạng " + d.dang : "Đã có đủ chỉ tiêu"); };
    const reKq = () => { q("#ptKqH").innerHTML = kqHead(); q("#ptKq").innerHTML = kqRows(); wire(); };
    if (q("#pt54")) q("#pt54").onchange = () => { d.t54 = q("#pt54").checked; reKq(); };
    if (q("#pt0")) q("#pt0").onchange = () => { d.t0 = q("#pt0").checked; reKq(); };
    if (q("#ptBD")) q("#ptBD").addEventListener("change", () => { d.ngayBD = q("#ptBD").value; q("#ptKqH").innerHTML = kqHead(); });
    if (q("#ptDvHL")) q("#ptDvHL").onchange = () => { d.dvHL = q("#ptDvHL").value; calc(); };
    if (q("#ptMeSL")) { q("#ptMeSL").addEventListener("input", calc); q("#ptMeDV").addEventListener("change", calc); }
    if (q("#ptDang")) q("#ptDang").onchange = () => { d.dang = q("#ptDang").value; const blank = !d.kq.some(r => r.a || r.b || r.c); if (blank) { d.kq = ctOf(d.dang); q("#ptKq").innerHTML = kqRows(); wire(); } w.querySelectorAll(".ptU").forEach(x => x.textContent = hcU()); q("#ptTTRow").hidden = !liq(); w.querySelectorAll(".ptDg2").forEach(x => x.textContent = d.dang || "…"); w.querySelectorAll('[data-k="hc"]').forEach(x => x.placeholder = hcU()); calc(); };
    let maTay = !!(p && d.maCT); const autoMa = () => { if (!ql || maTay || !q("#ptMa")) return; q("#ptMa").value = genMa(q("#ptSp").value, q("#ptDang").value, p && p.id); };
    if (q("#ptMa")) q("#ptMa").addEventListener("input", () => { maTay = !!q("#ptMa").value.trim(); });
    if (q("#ptSp") && ql) q("#ptSp").addEventListener("input", () => { const dg = dangOf(q("#ptSp").value); if (dg && q("#ptDang").value !== dg) { q("#ptDang").value = dg; q("#ptDang").onchange(); } autoMa(); });
    if (q("#ptDang") && ql) q("#ptDang").addEventListener("change", autoMa);
    if (q("#ptFrom")) q("#ptFrom").onchange = () => { const v = q("#ptFrom").value; if (!v) return; let nl = [];
      if (v.startsWith("pt:")) { const o = rec(v.slice(3)); if (o) { nl = JSON.parse(JSON.stringify(o.d.nl || [])); ["hl", "tyTrong", "quyTrinh", "dang", "maCT"].forEach(k => { if (!d[k] && o.d[k]) { d[k] = o.d[k]; const el = { hl: "#ptHl", tyTrong: "#ptTT", quyTrinh: "#ptQT", dang: "#ptDang", maCT: "#ptMa" }[k]; if (q(el)) q(el).value = o.d[k]; } }); if (!q("#ptSp").value) q("#ptSp").value = o.d.sp || ""; } }
      else { const m = v.slice(3); nl = ((S.congThuc || {})[m] || []).map((l, i) => { const it = itemBy(l.ma) || {}; return { ma: it.ma ? l.ma : "", ten: it.ten || l.ma, pct: Math.round(l.dm * (it.heSo || 1) * 100 * 1000) / 1000, tt: String(i + 1) }; }); if (!q("#ptSp").value) q("#ptSp").value = ((itemBy(m) || {}).ten || m).replace(/^BTP\s*/i, ""); }
      if (nl.length) { d.nl = nl; q("#ptNl").innerHTML = nlRows(); wire(); calc(); toast("Đã chép " + nl.length + " nguyên liệu — chỉnh lại rồi lưu"); } q("#ptFrom").value = ""; };
    if (q("#ptAddNl")) q("#ptAddNl").onclick = () => { d.nl.push({}); q("#ptNl").innerHTML = nlRows(); wire(); calc(); const el = w.querySelector(`[data-nl="${d.nl.length - 1}"][data-k="ten"]`); if (el) el.focus(); };
    if (q("#ptAddKq")) q("#ptAddKq").onclick = () => { d.kq.push({}); q("#ptKq").innerHTML = kqRows(); wire(); };
    q("[data-x]").onclick = () => w.remove();
    w.querySelectorAll(".rd-goto").forEach(g => g.onclick = () => { const el = q("#" + g.dataset.goto); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); });
    const collect = () => {
      if (ql) Object.assign(d, { loaiTN: q("#ptLoai").value, sp: q("#ptSp").value.trim(), maCT: q("#ptMa").value.trim(), hl: q("#ptHl").value.trim(), yc: q("#ptYc").value, ngayLap: q("#ptLap").value, nguoiTH: q("#ptNg").value, t54: q("#pt54").checked, t0: q("#pt0").checked, tyTrong: q("#ptTT").value.trim(), quyTrinh: q("#ptQT").value, dang: q("#ptDang").value,
      });
      if (ghiKQ) Object.assign(d, { danhGia: (w.querySelector('[name=ptDg]:checked') || {}).value || "", xuLy: (w.querySelector('[name=ptXl]:checked') || {}).value || "", ghiChu: q("#ptGc").value.trim() });
      if (ghiKQ) Object.assign(d, { meSL: q("#ptMeSL").value.trim(), meDV: q("#ptMeDV").value, ngayBD: q("#ptBD").value, kqbd: q("#ptKqbd").value.trim(), deXuat: q("#ptDx").value.trim(), ngayKT: q("#ptKT").value });
      if (!ql && q("#ptCtLy")) d.nlLy = q("#ptCtLy").value.trim();
      d.nl = d.nl.filter(r => String(r.ten || "").trim() || String(r.pct || "").trim()); d.kq = d.kq.filter(r => String(r.ct || "").trim() || r.yc || r.a || r.b || r.c);
    };
    const reAll = () => { q("#ptNl").innerHTML = nlRows(); q("#ptKq").innerHTML = kqRows(); wire(); calc(); }; /* collect() đã bỏ dòng trống → vẽ lại 2 bảng cho khớp */
    /* người thực hiện sửa công thức: kiểm trước khi lưu */
    const ctLoi = () => { if (!suaCT || (!d.nlDoi && !bienThe)) return ""; const L = d.nl;
      const st = L.find(saiTech); if (st) return `“${st.ten || st.ma}” là hoạt chất — hoạt chất do TP. LAB/RD ghi; người thực hiện chỉ thêm, đổi được phụ gia và dung môi.`;
      if (L.some(r => !LOCK.has(r) && !String(r.ten || "").trim())) return "Ghi tên nguyên liệu cho dòng đã có %w/w (hoặc bỏ dòng đó).";
      const kp = L.find(r => !LOCK.has(r) && !r.bu && !(num(r.pct) > 0)); if (kp) return `Ghi %w/w cho “${kp.ten}” (không dùng nữa thì bấm ✕ để bỏ dòng).`;
      const am = L.find(r => num(r.pct) < 0); if (am) return `Dòng Up to “${am.ten}” đang âm — tổng các dòng khác đã quá 100 %. Giảm bớt tỷ lệ.`;
      const t = L.reduce((x, r) => x + num(r.pct), 0); if (Math.abs(t - 100) >= 0.01) return `Tổng công thức đang ${F3(t, 3)} % (${t > 100 ? "thừa" : "thiếu"} ${F3(Math.abs(100 - t), 3)} %) — phải đủ 100 %. Sửa %w/w, hoặc chọn ô Up to ở dung môi nền để tự bù.`;
      if (bienThe) { const src = live(R).find(x => x.loai === "PT" && x.d.so === d.tu); if (src && sigNl(L) === sigNl(src.d.nl)) return `Công thức phiếu mới đang giống hệt phiếu ${d.tu} — phải sửa tỷ lệ hoặc phụ gia rồi mới lưu.`; }
      return ""; };
    const go = async (extra, msg) => { collect(); const loi = ctLoi(); if (loi) { reAll(); toast(loi); const el = q("#ptNl"); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
      Object.assign(d, extra || {}); try {
        const giaoMoi = ql && d.nguoiTH && (!p || p.d.nguoiTH !== d.nguoiTH) && d.nguoiTH !== S.me.ten, doiCT = !ql && !!p && !!d.nlDoi && sigNl(d.nl) !== sigNl(p.d.nl);
        let r = await save({ id: p && p.id, loai: "PT", ngay: d.ngayLap || today(), d }, msg);
        if (ql) try { r = await ycSync(r); } catch (e) { toast("Chưa ghi được sổ BM.04: " + e.message); }
        if (giaoMoi) push("🧪 Giao thử nghiệm " + (r.d.so || ""), (r.d.sp || "") + " · lập " + D(r.d.ngayLap) + " · giao bởi " + S.me.ten, { ten: [d.nguoiTH] });
        if (!ql && r && r.d && (bienThe || doiCT)) { const DF = r.d.nlGoc ? diffNl(r.d.nl, r.d.nlGoc) : [], tx = DF.slice(0, 4).map(diffTxt).join("; ") + (DF.length > 4 ? "; …" : "");
          if (bienThe) { push("⚗ Thử tỷ lệ khác " + (r.d.so || ""), (r.d.sp || "") + " · " + S.me.ten + " lập từ " + (r.d.tu || "") + (tx ? ": " + tx : ""), { roles: ["Quản lý"] }); toast("Đã lập phiếu " + (r.d.so || "") + " — thử tỷ lệ khác, chép từ " + (r.d.tu || "")); }
          else push("⚗ Điều chỉnh công thức " + (r.d.so || ""), (r.d.sp || "") + " · " + S.me.ten + (tx ? ": " + tx : " đã đưa về công thức giao"), { roles: ["Quản lý"] }); }
        if (extra && extra.tt === "Đã báo KQ") push("📨 Kết quả thử nghiệm " + (r.d.so || ""), (r.d.sp || "") + " · " + S.me.ten + " đã báo kết quả, chờ đánh giá", { roles: ["Quản lý"] });
        if (ql && d.danhGia && (!p || p.d.danhGia !== d.danhGia) && d.nguoiTH && d.nguoiTH !== S.me.ten) push((d.danhGia === "Đạt" ? "✅ " : "⛔ ") + "Đánh giá " + (r.d.so || "") + ": " + d.danhGia, (r.d.sp || "") + (d.xuLy ? " · " + d.xuLy : ""), { ten: [d.nguoiTH] });
        w.remove(); renderRD(); if (ql && d.danhGia && (!p || !p.d.danhGia)) setTimeout(() => { const x = dlg("Phiếu " + E(r.d.so || "") + " đã hoàn thành", `<p>Kết luận: <b>${E(d.danhGia)}</b>${d.xuLy ? " · " + E(d.xuLy) : ""}. In BM.02 để <b>Phòng R&amp;D</b> và <b>nhân viên thực hiện</b> (${E(d.nguoiTH || "")}) ký?</p><div class="actions"><button class="btn primary" type="button" data-ok>🖨 In ngay</button><button class="btn" type="button" data-x>Để sau</button></div>`); x.querySelector("[data-x]").onclick = () => x.remove(); x.querySelector("[data-ok]").onclick = () => { x.remove(); prPT(null, r.d); }; }, 300); } catch (e) { toast(e.message); if (w.isConnected) reAll(); } };
    if (q("#ptSave")) q("#ptSave").onclick = () => { if (!q("#ptSp").value.trim()) return toast("Ghi tên sản phẩm."); if (!q("#ptDang").value) return toast("Chọn dạng sản phẩm.");
      if (liq() && !(num(q("#ptTT").value) > 0)) { q("#ptTT").focus(); return toast("Dạng lỏng: ghi tỷ trọng dự kiến (g/ml)."); } go(null, p ? "Đã lưu phiếu" : "Đã lập phiếu" + (q("#ptNg").value ? " và giao cho " + q("#ptNg").value : "")); };
    if (q("#ptDraft")) q("#ptDraft").onclick = () => go(null, bienThe ? "Đã lập phiếu thử tỷ lệ khác" : "Đã lưu kết quả");
    if (q("#ptCtReset")) q("#ptCtReset").onclick = () => { if (!GOC) return; d.nl = cp(GOC); lockAll(); if (!ql) d.nlDoi = 1; q("#ptNl").innerHTML = nlRows(); wire(); calc(); toast("Đã đưa về công thức giao — bấm Lưu để ghi lại"); };
    /* THỬ TỶ LỆ KHÁC: người thực hiện lập phiếu mới chép từ phiếu đang làm (mỗi tỷ lệ 1 phiếu, kết quả riêng) */
    let dirtyKQ = false; { const dk = e => { const t = e.target; if (t && t.closest && !t.closest("#ptNl") && !t.closest("#ptCt") && !t.closest(".rd-me")) dirtyKQ = true; }; w.addEventListener("input", dk, true); w.addEventListener("change", dk, true); }
    const maBT = ma => { const base = String(ma || "").trim().replace(/-TL\d+$/i, ""); if (!base) return ""; const U = base.toUpperCase() + "-TL";
      const used = live(R).filter(x => x.loai === "PT").map(x => String(x.d.maCT || "").toUpperCase()).filter(m => m.startsWith(U)).map(m => parseInt(m.slice(U.length)) || 0); return (base + "-TL" + ((used.length ? Math.max(...used) : 1) + 1)).slice(0, 40); };
    if (q("#ptBT")) q("#ptBT").onclick = async () => {
      if (dirtyKQ) return toast("Bạn vừa ghi kết quả ở phiếu này mà chưa lưu — bấm Lưu kết quả trước, rồi mở lại phiếu và bấm Thử tỷ lệ khác.");
      collect(); reAll();
      if (sigNl(d.nl) !== sigNl(p.d.nl) && !await askConfirm([`Đưa sang phiếu mới: phiếu mới mang công thức vừa sửa, phiếu ${d.so || ""} giữ công thức cũ.`, `Ở lại phiếu này: bấm Lưu kết quả để ghi công thức vừa sửa vào phiếu ${d.so || ""} trước.`], { t: "Công thức vừa sửa chưa lưu", n: `Bạn đã sửa công thức ở phiếu <b>${E(d.so || "")}</b> nhưng chưa lưu. Chọn một trong hai:`, no: "Ở lại phiếu này", ok: "Đưa sang phiếu mới", cls: "primary" })) return;
      const n = { tu: d.so, lan: (d.lan || 1) + 1, tuNV: 1, tt: "Đang thử", nguoiTH: me, ngayLap: today() };
      ["sp", "hl", "loaiTN", "yc", "dang", "tyTrong", "quyTrinh", "t54", "t0", "dvHL", "meSL", "meDV"].forEach(k => { if (d[k] !== undefined) n[k] = cp(d[k]); });
      n.nl = cp(d.nl); n.nlGoc = cp(GOC || p.d.nl || []); n.maCT = maBT(d.maCT);
      n.kq = (d.kq || []).filter(r => fil(r.ct)).map(r => ({ ct: r.ct, yc: r.yc || "", pp: r.pp || "", w: wRow(r), nb: r.nb ? 1 : 0 }));
      window.__rdSeed = n; w.remove(); ptDlg(null); toast("Phiếu mới chép từ " + (d.so || "") + " — sửa tỷ lệ / phụ gia ở mục 2 rồi bấm Lưu phiếu mới"); };
    if (q("#ptBao")) q("#ptBao").onclick = () => { if (!q("#ptBD").value) { q("#ptBD").focus(); return toast("Ghi ngày bắt đầu pha chế, lưu mẫu."); } if (!q("#ptKT").value) q("#ptKT").value = today(); go({ tt: "Đã báo KQ" }, "Đã báo kết quả cho TP. LAB/RD"); };
    if (q("#ptPr")) q("#ptPr").onclick = () => { collect(); prPT(p, d); };
    if (q("#ptPrTop")) q("#ptPrTop").onclick = () => { collect(); prPT(p, d); };
    if (q("#ptLai")) q("#ptLai").onclick = () => { collect(); const n = JSON.parse(JSON.stringify(d)); ["so", "kq", "kqbd", "deXuat", "ngayKT", "danhGia", "xuLy", "ghiChu", "duyetBoi", "duyetLuc", "baoLuc", "maCT", "nlGoc", "nlSua", "tuNV", "nlDoi", "nlLy", "hong", "tt"].forEach(k => delete n[k]);
      n.kq = ctOf(n.dang); n.lan = (d.lan || 1) + 1; n.tu = d.so; n.ngayLap = today(); delete n.ngayBD; window.__rdSeed = n; w.remove(); ptDlg(null); toast("Phiếu mới chép từ " + (d.so || "") + " — sửa công thức rồi Lưu & giao việc"); };
    if (q("#ptMo")) q("#ptMo").onclick = () => { w.querySelectorAll('[name=ptDg],[name=ptXl]').forEach(x => x.checked = false); go({ danhGia: "", xuLy: "", tt: "Đã báo KQ", duyetBoi: "", duyetLuc: "" }, "Đã mở lại phiếu — người thực hiện sửa được kết quả"); };
    if (q("#ptHongX")) q("#ptHongX").onclick = () => { delete d.hong; go(null, "Đã bỏ ghi mẫu hỏng"); };
    if (q("#ptHong")) q("#ptHong").onclick = () => {
      const bd = q("#ptBD").value, x = document.createElement("div"); x.className = "cfm";
      x.innerHTML = `<div class="cfm-box" style="max-width:520px"><h2>Mẫu hỏng – dừng theo dõi</h2><p class="note">Ghi lại giai đoạn hỏng để TP. LAB/RD đánh giá và điều chỉnh công thức. Phiếu chuyển sang “Đã báo KQ”, không nhắc đọc mẫu nữa.</p>
        <label>Hỏng ở giai đoạn<select id="hgGd">${["Khi pha chế (sau khuấy / nghiền)", "Theo dõi điều kiện thường 28±2 °C", "Lưu mẫu 54±2 °C", "Lưu mẫu 0±2 °C"].map(v => `<option>${v}</option>`).join("")}</select></label>
        <div class="two"><label>Ngày phát hiện<input id="hgNg" type="date" value="${today()}"></label><label>Số ngày đã lưu<input id="hgNd" type="number" min="0" step="1" value="${bd ? Math.max(0, Math.round((new Date(today()) - new Date(bd)) / 864e5)) : ""}"></label></div>
        <label>Hiện tượng<textarea id="hgHien" rows="3" placeholder="VD đông cứng, tạo gel, tách lớp > 10%, kết tinh, sệt không chảy, đổi màu…"></textarea></label>
        <div class="actions"><button class="btn danger" type="button" id="hgOk">Ghi mẫu hỏng &amp; báo kết quả</button><button class="btn" type="button" id="hgNo">Huỷ</button></div></div>`;
      document.body.appendChild(x); const g = s2 => x.querySelector(s2);
      g("#hgNo").onclick = () => x.remove();
      g("#hgNg").onchange = () => { if (bd) g("#hgNd").value = Math.max(0, Math.round((new Date(g("#hgNg").value) - new Date(bd)) / 864e5)); };
      g("#hgOk").onclick = () => { const hien = g("#hgHien").value.trim(); if (!hien) return toast("Ghi hiện tượng hỏng.");
        const h = { gd: g("#hgGd").value, ngay: g("#hgNg").value, nd: g("#hgNd").value, hien }; x.remove();
        if (!q("#ptBD").value && bd === "") q("#ptBD").value = h.ngay; if (!q("#ptKT").value) q("#ptKT").value = h.ngay;
        if (!q("#ptKqbd").value.trim()) q("#ptKqbd").value = "Mẫu hỏng " + h.gd.toLowerCase() + (h.nd !== "" ? " sau " + h.nd + " ngày" : "") + ": " + hien;
        go(ql ? { hong: h } : { hong: h, tt: "Đã báo KQ" }, "Đã ghi mẫu hỏng" + (ql ? "" : " và báo kết quả")); };
    };
    if (q("#ptDel")) q("#ptDel").onclick = async () => { if (await del(p.id)) { w.remove(); renderRD(); } };
  }
  function prPT(p, d) {
    const MP = meInfo(d);
    const t54 = d.t54 !== false, t0 = d.t0 != null ? d.t0 : (d.kq || []).some(r => String(r.c || "").trim()), C = ["a"].concat(t54 ? ["b"] : [], t0 ? ["c"] : []);
    const CH = { a: "Theo dõi ở điều kiện thường: 28±2 °C", b: "Lưu mẫu: 54±2 °C, 14 ngày", c: "Lưu mẫu: 0±2 °C, 7 ngày" };
    const K = window.BMK, nl0 = (d.nl || []).filter(r => String(r.ten || "").trim() || String(r.pct ?? "").trim()), nl = nl0.length ? nl0 : Array(8).fill({}), t = (d.nl || []).reduce((s, r) => s + (+r.pct || 0), 0), cb = v => v ? "☑" : "☐";
    K.pr(`${K.PCSS}<style>.pq{font-size:11pt;line-height:1.25}.pq td,.pq th{padding:1px 5px;font-size:10.5pt}.pq .hd .lg img{height:16mm}.pq .hd .tt{font-size:15pt}.pq .sec td{padding:3px 6px}.pq .gap{height:6px}.pq p{margin:5px 0}.pq .qt{min-height:${String(d.quyTrinh || "").trim() ? "0" : "22mm"};white-space:pre-wrap}.pq small{font-size:9.5pt}</style><div class="pq">${K.head("CÔNG THỨC SẢN PHẨM –<br>PHIẾU KIỂM TRA PHA CHẾ", meta("PT"))}
      <p>Số phiếu theo dõi: <b>${E(d.so || "")}</b> <small style="float:right">Chỉ tiêu theo QCVN 01-188:2018/BNNPTNT · phương pháp theo QC-HD nội bộ</small></p>
      <table><colgroup><col style="width:18%"><col style="width:32%"><col style="width:18%"><col style="width:32%"></colgroup><tr class="sec"><td colspan="4">1. THÔNG TIN CHUNG</td></tr><tr><td style="width:22%">Ngày lập phiếu</td><td>${D(d.ngayLap)}</td><td style="width:22%">Người thực hiện</td><td>${E(d.nguoiTH || "")}</td></tr><tr><td>Ngày bắt đầu</td><td>${D(d.ngayBD)}</td><td>Ngày kết thúc</td><td>${D(d.ngayKT)}</td></tr>
      <tr><td>Tên sản phẩm</td><td><b>${E(d.sp || "")}</b></td><td>Mã công thức</td><td>${E(d.maCT || "")}</td></tr><tr><td>Hàm lượng</td><td>${E(d.hl || "")}</td><td>Dạng · tỷ trọng</td><td>${E(d.dang || "")}${d.tyTrong ? " · " + E(d.tyTrong) + " g/ml" : ""}</td></tr><tr><td>Loại thử nghiệm</td><td colspan="3">${E(d.loaiTN || LOAI_TN[0])}</td></tr></table>
      <div class="gap"></div><table><colgroup><col style="width:6%"><col style="width:16%"><col><col style="width:10%">${MP ? '<col style="width:11%">' : ""}<col style="width:22%"></colgroup><tr class="sec"><td colspan="${MP ? 6 : 5}">2. CÔNG THỨC SẢN PHẨM${MP ? ` <span style="font-weight:400;text-transform:none">· mẻ thử ${E(MP.sl)} ${E(MP.dv)}</span>` : ""}</td></tr><tr><th>STT</th><th>Mã vật tư</th><th>Tên nguyên liệu</th><th>%w/w</th>${MP ? `<th>Cân (${MP.u})</th>` : ""}<th>Hàm lượng (${DVHL(d)}) / Ghi chú</th></tr>
      ${nl.map((r, i) => `<tr><td class="c">${i + 1}</td><td>${r.ma ? E(r.ma) : (String(r.ten || "").trim() ? "<i>mới</i>" : "")}</td><td style="${LO[loaiOf(r)] ? "color:" + LO[loaiOf(r)][1] + ";-webkit-print-color-adjust:exact;print-color-adjust:exact" : ""}">${E(r.ten || "")}</td><td class="r">${r.pct === "" || r.pct == null ? "" : F3(r.pct, NDP(d.nl))}</td>${MP ? `<td class="r">${canOf(r, d, MP)}</td>` : ""}<td>${HLtxt(r, d) ? "<b>HL " + E(HLtxt(r, d)) + "</b>" + (r.gc ? "; " : "") : ""}${E(r.gc || "")}</td></tr>`).join("")}
      <tr><td></td><td></td><td><b>Tổng cộng</b></td><td class="r"><b>${t ? F3(t, NDP(d.nl)) : ""}</b></td>${MP ? `<td class="r"><b>${(MP.m).toFixed(MP.u === "g" ? 2 : 3)}</b></td>` : ""}<td>Tỷ trọng: ${E(d.tyTrong || "")}</td></tr></table>
      ${(() => { const DC = d.nlGoc ? diffNl(nl0, d.nlGoc) : [], sx = d.nlSua || {}; return (d.tu ? `<p><small>${d.tuNV ? "Phiếu thử tỷ lệ khác" : "Phiếu thử lại"} — chép từ phiếu <b>${E(d.tu)}</b>.</small></p>` : "") + (DC.length ? `<p><small><b>Người thực hiện điều chỉnh so với công thức giao</b>${sx.nguoi ? " (" + E(sx.nguoi) + (sx.luc ? ", " + E(D(sx.luc)) : "") + ")" : ""}: ${DC.map(x => E(diffTxt(x))).join("; ")}.${sx.ly ? " Lý do: " + E(sx.ly) + "." : ""}</small></p>` : ""); })()}
      <div class="gap"></div><table><tr class="sec"><td>3. QUY TRÌNH PHA CHẾ</td></tr><tr><td class="qt">${E(d.quyTrinh || "")}</td></tr></table>
      <div class="gap"></div><table><colgroup><col style="width:27%"><col style="width:${C.length > 2 ? 17 : 21}%">${C.map(() => `<col>`).join("")}</colgroup><tr class="sec"><td colspan="${2 + C.length}">4. KẾT QUẢ THỰC HIỆN</td></tr><tr><th style="width:27%">Chỉ tiêu <small>(phương pháp)</small></th><th style="width:19%">Yêu cầu</th>${C.map(k => `<th>${CH[k]}</th>`).join("")}</tr>
      ${(d.kq || []).filter(r => String(r.ct || "").trim()).map((r, i) => { const wv = r.w != null ? r.w : (r.n28 ? "a" : (catOf(r.ct) || {}).w || "abc"); return `<tr><td>4.${i + 1} ${E(r.ct || "")}${r.nb ? " <small>(nội bộ)</small>" : ""}${r.pp ? `<br><small>${E(r.pp)}</small>` : ""}</td><td><small>${E(r.yc || "")}</small></td>${C.map(k => wv.includes(k) ? `<td>${E(r[k] || "")}</td>` : `<td class="c">—</td>`).join("")}</tr>`; }).join("")}
      ${d.hong ? `<tr><td><b>Mẫu hỏng – dừng theo dõi</b></td><td colspan="${1 + C.length}">${E(d.hong.gd)} · ngày ${D(d.hong.ngay)}${d.hong.nd !== "" && d.hong.nd != null ? " (sau " + E(d.hong.nd) + " ngày)" : ""} · ${E(d.hong.hien)}</td></tr>` : ""}
      ${d.kqbd || d.deXuat ? `<tr><td>Kết quả ban đầu · đề xuất</td><td colspan="${1 + C.length}">${E(d.kqbd || "")}${d.kqbd && d.deXuat ? "<br>" : ""}${d.deXuat ? "<i>Đề xuất:</i> " + E(d.deXuat) : ""}</td></tr>` : ""}</table>
      <div class="gap"></div><table><tr class="sec"><td>5. ĐÁNH GIÁ</td></tr><tr><td>${cb(d.danhGia === "Đạt")} Đạt &nbsp;&nbsp; ${cb(d.danhGia === "Không đạt")} Không đạt &nbsp;&nbsp;&nbsp;&nbsp; Đề xuất xử lý: ${cb(d.xuLy === "Thử nghiệm lại")} Thử nghiệm lại &nbsp; ${cb(d.xuLy === "Không thử lại")} Không thử lại${d.ghiChu ? "<br>Ghi chú: " + E(d.ghiChu) : ""}</td></tr></table>
      ${K.sign([["Phòng R&D", d.duyetBoi || ""], ["Nhân viên thực hiện", d.nguoiTH || ""]])}</div>`);
  }

  /* ---------------- BM.04: yêu cầu ---------------- */
  /* phiếu công thức → tự ghi / cập nhật 1 dòng ở sổ yêu cầu BM.04 (dòng do phiếu tạo ra: d.tuPT = id phiếu) */
  async function ycSync(r) {
    const p = r.d, y = p.yc ? rec(p.yc) : null;
    if (y && y.d.tuPT !== r.id) return r; /* phiếu gắn yêu cầu có sẵn: giữ nguyên */
    const n = Object.assign({}, y ? y.d : {}, { tuPT: r.id, donVi: (y && y.d.donVi) || "Phòng R&D",
      noiDung: (p.loaiTN || LOAI_TN[0]) + ": " + (p.sp || "") + (p.hl ? " – " + p.hl : "") + (p.dang && !String(p.sp || "").toUpperCase().includes(p.dang.toUpperCase()) ? " (" + p.dang + ")" : "") + " · phiếu " + (p.so || ""),
      nguoiTH: p.nguoiTH || "", ngayKT: p.danhGia ? (p.ngayKT || today()) : (y && y.d.ngayKT) || "",
      ghiChu: p.danhGia ? "Kết luận: " + p.danhGia + (p.xuLy ? " · " + p.xuLy : "") : (p.hong ? "Mẫu hỏng" : (y && y.d.ghiChu) || "") });
    const yr = await api("webRDSave", S.auth, { id: y && y.id, loai: "YC", ngay: y ? y.ngay : (p.ngayLap || today()), d: n });
    if (!y) return await api("webRDSave", S.auth, { id: r.id, loai: "PT", ngay: p.ngayLap || today(), d: Object.assign({}, p, { yc: yr.id }) });
    return r;
  }
  function ycDlg(y) {
    const ql = QL(), d = y ? Object.assign({}, y.d) : {}, ro = ql ? "" : "disabled";
    const w = dlg(y ? "Yêu cầu nghiên cứu" : "Ghi yêu cầu nghiên cứu", `<p class="note" style="margin:0 0 8px">BM.04-RD-QT.01 · Sổ theo dõi yêu cầu</p>
      <div class="two"><label>Ngày yêu cầu<input id="ycNgay" type="date" value="${E(y ? y.ngay : today())}" ${ro}></label><label>Đơn vị / người yêu cầu<input id="ycDv" value="${E(d.donVi || "")}" ${ro} placeholder="VD TGĐ, P.KD, khách hàng…"></label></div>
      ${ql ? `<div class="rd-pick"><span class="note">Chọn nhanh:</span>${LOAI_TN.map(x => `<button type="button" class="btn small" data-pick="${E(x)}">${x}</button>`).join("")}</div>` : ""}
      <label>Nội dung yêu cầu<textarea id="ycNd" rows="3" ${ro}>${E(d.noiDung || "")}</textarea></label>
      <div class="two"><label>Ngày cần kết quả nghiên cứu<input id="ycHan" type="date" value="${E(d.han || "")}" ${ro}></label><label>Người thực hiện<select id="ycNg" ${ro}>${userOpts(d.nguoiTH)}</select></label></div>
      <div class="two"><label>Ngày kết thúc<input id="ycKT" type="date" value="${E(d.ngayKT || "")}" ${ro}></label><label>Ghi chú<input id="ycGc" value="${E(d.ghiChu || "")}" ${ro}></label></div>
      <div class="actions">${ql ? '<button class="btn primary" type="button" id="ycSave">Lưu</button>' : ""}${y && ql ? '<button class="btn danger" type="button" id="ycDel">Xoá</button>' : ""}<span style="flex:1"></span><button class="btn" type="button" data-x>Đóng</button></div>`);
    const q = s => w.querySelector(s); q("[data-x]").onclick = () => w.remove();
    w.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => { const t = q("#ycNd"), v = t.value.trim(), x = b.dataset.pick; let rest = v; LOAI_TN.forEach(L => { if (rest.startsWith(L)) rest = rest.slice(L.length).replace(/^[:\s]+/, ""); }); t.value = x + (rest ? ": " + rest : ": "); t.focus(); });
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
      const d = p.d, b = buoc(d), mine = cuaToi(b), hd = `<b>${E(d.so)}</b> · ${E(d.sp)}`;
      if (b.z === "lam" && mine) out.push({ id: p.id, c: b.k === "doc" && b.tre > 0 ? "#c62828" : b.k === "duyet" ? "#7c3aed" : b.k === "doc" ? "#d97706" : "#2563eb", t: b.k === "duyet" ? `📨 ${hd} — ${d.hong ? "mẫu hỏng" : E(d.nguoiTH || "") + " đã báo kết quả"}, <b>chờ anh đánh giá</b>` : `🧪 ${hd} — <b>${E(b.viec)}</b>` });
      else if (b.z === "theodoi" && b.who === me) out.push({ id: p.id, c: "#64748b", t: `⏳ ${hd} — đang lưu mẫu, đọc ${E(b.luu[0].ten)} ngày <b>${D(b.han)}</b> (còn ${b.con} ngày)` });
      /* Quản lý theo dõi việc của người khác: quá ngày đọc mẫu · giao lâu chưa bắt đầu */
      if (ql && !mine && b.k === "doc" && b.tre > 0) out.push({ id: p.id, c: "#c62828", t: `⏰ ${hd} — quá ngày đọc mẫu ${b.tre} ngày (${D(b.han)}), ${E(d.nguoiTH || "chưa giao")} chưa ghi` });
      if (ql && !mine && b.k === "giao" && b.cho >= 7) out.push({ id: p.id, c: "#d97706", t: `🕒 ${hd} — giao ${E(d.nguoiTH || "")} đã <b>${b.cho} ngày</b>, chưa bắt đầu` });
    });
    live(R).filter(x => x.loai === "YC" && !x.d.ngayKT && (ql || x.d.nguoiTH === me)).forEach(y => { if (y.d.han && y.d.han <= add(t, 3)) out.push({ id: y.id, c: y.d.han < t ? "#c62828" : "#d97706", t: `📝 Yêu cầu: ${E((y.d.noiDung || "").slice(0, 80))} — cần kết quả <b>${D(y.d.han)}</b>${y.d.han < t ? " (quá hạn)" : ""}` }); });
    return out;
  };
  window.rdOpen = function (id) { setTab("rd"); setTimeout(async () => { try { if (!R.length) await load(); const r = rec(id); if (r) (r.loai === "PT" ? ptDlg : r.loai === "YC" ? ycDlg : gmDlg)(r); } catch (e) {} }, 300); };
})();
