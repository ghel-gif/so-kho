/* Sổ Kho — BẢN TIN BUỔI SÁNG (chạy trên máy chủ: Edge Function "push" tải file này từ web rồi chạy).
   Dựng lại môi trường Google Sheet chỉ-đọc từ bảng sheet_rows, nạp server.gs + khpt.gs (đúng logic Sổ Kho),
   rồi lập bản tin RIÊNG cho từng người theo việc họ đang làm. */
(function (G) {
  "use strict";
  const TZ = "Asia/Ho_Chi_Minh", OFF = 7 * 3600e3, pad = n => String(n).padStart(2, "0");
  const vn = d => { const x = new Date(d.getTime() + OFF); return { y: x.getUTCFullYear(), M: x.getUTCMonth() + 1, d: x.getUTCDate(), H: x.getUTCHours(), m: x.getUTCMinutes(), s: x.getUTCSeconds() }; };
  const fmt = (d, f) => { if (!(d instanceof Date) || isNaN(d)) return ""; const p = vn(d); return f.replace(/yyyy|yy|MM|dd|HH|mm|ss|M|d|H/g, t => ({ yyyy: p.y, yy: pad(p.y % 100), MM: pad(p.M), dd: pad(p.d), HH: pad(p.H), mm: pad(p.m), ss: pad(p.s), M: p.M, d: p.d, H: p.H })[t]); };
  const DT_RE = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;
  const revive = v => { if (typeof v === "string") { const m = DT_RE.exec(v); if (m) return new Date(Date.UTC(+m[1], m[2] - 1, +m[3], m[4] - 7, +m[5], +m[6])); } return v; };

  /* ---------- Google Sheet chỉ-đọc ---------- */
  function gas(sheets) {
    const S = {}; Object.keys(sheets).forEach(n => S[n] = sheets[n].map(r => (r || []).map(revive)));
    class Range {
      constructor(sh, r, c, nr, nc) { Object.assign(this, { sh, r, c, nr, nc }); }
      getValues() { const R = S[this.sh] || [], o = []; for (let i = 0; i < this.nr; i++) { const row = R[this.r - 1 + i] || [], x = []; for (let j = 0; j < this.nc; j++) { const v = row[this.c - 1 + j]; x.push(v === undefined || v === null ? "" : v); } o.push(x); } return o; }
      getValue() { return this.getValues()[0][0]; }
      getDisplayValues() { return this.getValues().map(r => r.map(v => v instanceof Date ? fmt(v, "dd/MM/yyyy") : String(v))); }
      setValues() { return this; } setValue() { return this; }
    }
    ["setNumberFormat", "setFontWeight", "setBackground", "setDataValidation", "setWrap", "setHorizontalAlignment", "setFontColor", "setNote", "merge", "clearContent", "clear"].forEach(m => Range.prototype[m] = function () { return this; });
    class Sheet {
      constructor(n) { this.n = n; }
      get R() { return S[this.n] || []; }
      getName() { return this.n; }
      getLastRow() { const R = this.R; let i = R.length; while (i > 0 && !(R[i - 1] || []).some(v => v !== "" && v != null)) i--; return i; }
      getLastColumn() { return Math.max(1, ...this.R.map(r => { let j = r.length; while (j > 0 && (r[j - 1] === "" || r[j - 1] == null)) j--; return j; })); }
      getDataRange() { return new Range(this.n, 1, 1, Math.max(1, this.getLastRow()), this.getLastColumn()); }
      getRange(a, b, c, d) { if (typeof a === "string") throw new Error("ro"); return new Range(this.n, a, b, c || 1, d || 1); }
      appendRow() { return this; } getMaxRows() { return 1000; } getMaxColumns() { return 26; }
    }
    ["setFrozenRows", "setColumnWidth", "deleteRow", "insertRowsAfter", "hideColumns", "setTabColor", "activate", "protect"].forEach(m => Sheet.prototype[m] = function () { return this; });
    const SS = { getSheetByName: n => S[n] ? new Sheet(n) : null, insertSheet: n => { S[n] = S[n] || []; return new Sheet(n); }, getSheets: () => Object.keys(S).map(n => new Sheet(n)), getSpreadsheetTimeZone: () => TZ };
    const no = () => { throw new Error("không hỗ trợ trong bản tin"); };
    const P = new Map(), C = new Map();
    return {
      SpreadsheetApp: { getActiveSpreadsheet: () => SS, flush: () => {}, newDataValidation: () => new Proxy({}, { get: () => () => ({}) }) },
      Utilities: { formatDate: (d, tz, f) => fmt(d, f), getUuid: () => String(Math.random()).slice(2), sleep: () => {} },
      LockService: { getScriptLock: () => ({ waitLock() {}, tryLock: () => true, releaseLock() {} }) },
      CacheService: { getScriptCache: () => ({ get: k => C.get(k) ?? null, put: (k, v) => C.set(k, v), remove: k => C.delete(k), removeAll: () => {} }) },
      PropertiesService: { getScriptProperties: () => ({ getProperty: k => P.get(k) ?? null, setProperty: (k, v) => P.set(k, v), deleteProperty: () => {} }) },
      DriveApp: new Proxy({}, { get: () => no }), MailApp: { sendEmail: no }, ScriptApp: { getProjectTriggers: () => [], newTrigger: no, deleteTrigger: () => {} },
      Session: { getActiveUser: () => ({ getEmail: () => "" }), getScriptTimeZone: () => TZ }, HtmlService: {}, UrlFetchApp: { fetch: no }, Logger: { log() {} }
    };
  }
  function compile(code, env) {
    const names = [...code.matchAll(/^function\s+([A-Za-z0-9_$]+)\s*\(/gm)].map(m => m[1]);
    const src = code.replace(/function auth_\(a, allowed\) \{/, "function auth_(a, allowed) { throw new Error('bản tin không gọi hàm có đăng nhập');")
      + "\n;return {" + names.map(n => `${n}: typeof ${n} === "function" ? ${n} : undefined`).join(",") + "};";
    const keys = Object.keys(env);
    return new Function(...keys, src)(...keys.map(k => env[k]));
  }

  /* ---------- số liệu ---------- */
  const e = v => String(v == null ? "" : v).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const r3 = v => Math.round((+v || 0) * 1000) / 1000;
  const f = v => (Math.round((+v || 0) * 100) / 100).toLocaleString("vi-VN");
  const dmy = s => String(s || "").slice(0, 10).split("-").reverse().join("/");
  const days = (a, b) => Math.round((new Date(a) - new Date(b)) / 864e5);

  function facts(F) {
    const cfg = F.settings_(), A = F.alertData_(), items = F.items_(), IM = {}; items.forEach(i => IM[i.ma] = i);
    const mv = F.moves_(), bal = F.balances_(items, mv), L = F.lots_(items, mv, cfg), today = A.today;
    const orders = F.orders_().filter(o => !/\(huỷ/.test(o.so));
    const isTP = o => { const it = IM[o.maSP]; return it ? it.nhom === "Thành phẩm" : /^TP\./.test(o.maSP || ""); };
    const ldg = (F.ldgMap_ && F.ldgMap_()) || {}, CT = F.recipes_(), dgf = (F.dgfAll_ && F.dgfAll_()) || [];
    const byDate = (a, b) => String(a.ngay).localeCompare(String(b.ngay)) || String(a.so).localeCompare(String(b.so), "vi", { numeric: true });
    const lotTon = (ma, lo) => { const x = (L[ma] || {})[lo]; return x ? Math.max(0, +x.ton || 0) : 0; };
    /* lệnh đóng gói đang mở lấy quá tồn lô BTP (lệnh trước giữ trước) */
    const remL = {}, dgShort = [];
    orders.filter(o => isTP(o) && o.trangThai === "Đang SX").sort(byDate).forEach(o => {
      const P = ldg[o.so]; if (!P || !Array.isArray(P.btp)) return; const by = {};
      P.btp.forEach(b => { if (!b || !b.ma) return; const g = by[b.ma] || (by[b.ma] = { ma: b.ma, need: 0, lots: [] }); g.need += +b.kg || 0; if (b.lo && !g.lots.includes(b.lo)) g.lots.push(b.lo); });
      Object.values(by).filter(g => g.lots.length).forEach(g => { let got = 0; g.lots.forEach(lo => { const k = g.ma + "|" + lo; if (remL[k] == null) remL[k] = lotTon(g.ma, lo); const t = Math.min(remL[k], g.need - got); if (t > 0) { remL[k] -= t; got += t; } });
        if (g.need - got > 0.0005) dgShort.push({ so: o.so, nguoi: o.nguoiLap, ma: g.ma, lots: g.lots, need: r3(g.need), short: r3(g.need - got) }); });
    });
    /* lệnh SX BTP đang mở thiếu nguyên liệu theo công thức */
    const remN = {}, lsxShort = [], water = it => /NUOC$/i.test(it.ma) || /^nước( |$)/i.test(String(it.ten || "").trim());
    orders.filter(o => !isTP(o) && o.trangThai === "Đang SX" && CT[o.maSP]).sort(byDate).forEach(o => {
      const need = {}; CT[o.maSP].forEach(l => { const it = IM[l.ma]; if (!it || water(it)) return; need[it.ma] = (need[it.ma] || 0) + l.dm * (+o.slDuKien || 0) * (it.heSo || 1); });
      const sh = []; Object.entries(need).forEach(([ma, k]) => { if (!(k > 0)) return; if (remN[ma] == null) remN[ma] = Math.max(0, (bal[ma] || {}).ton || 0); const t = Math.min(remN[ma], k); remN[ma] -= t; if (k - t > 0.0005) sh.push({ ma, short: r3(k - t) }); });
      if (sh.length) lsxShort.push({ so: o.so, nguoi: o.nguoiLap, sh });
    });
    /* lệnh đóng gói thiếu biểu mẫu QC (đang đóng gói, hoặc xong trong 7 ngày) */
    const formMiss = [];
    orders.filter(o => isTP(o) && (o.trangThai === "Đang SX" || (o.trangThai === "Hoàn thành" && o.ngayHT && days(today, o.ngayHT) <= 7))).forEach(o => {
      const F2 = dgf.filter(x => x.so === o.so), miss = [];
      if (!F2.some(x => x.loai === "BM05")) miss.push("BM.05");
      if (!F2.some(x => /^BM0[46]$/.test(x.loai))) miss.push("BM.04/06");
      if (!F2.some(x => x.loai === "BM07")) miss.push("BM.07");
      if (miss.length) formMiss.push({ so: o.so, nguoi: o.nguoiLap, xong: o.trangThai === "Hoàn thành", miss, sp: (IM[o.maSP] || {}).ten || o.maSP });
    });
    const exp30 = A.exp.filter(x => x.con <= 30);
    return { today, cho: A.cho, exp: A.exp, exp30, low: A.low.filter(x => x.am || x.min), am: A.low.filter(x => x.am), treo: A.treo, dgShort, lsxShort, formMiss, orders, isTP };
  }

  /* ---------- bản tin riêng từng người ---------- */
  const SEC = {
    cho: { t: "Lô chờ QC", h: ["Mã", "Tên", "Lô", "Từ ngày", "Tồn (kg)"], row: x => [e(x.ma), e(x.ten), e(x.lo || "—"), dmy(x.ngay), f(x.ton)] },
    formMiss: { t: "Lệnh đóng gói còn thiếu biểu mẫu QC", h: ["Lệnh", "Sản phẩm", "Trạng thái", "Còn thiếu"], row: x => [e(x.so), e(x.sp), x.xong ? "Đã xong" : "Đang đóng gói", "<b style='color:#c62828'>" + x.miss.join(", ") + "</b>"] },
    exp: { t: "Lô sắp hết hạn / quá hạn", h: ["Mã", "Tên", "Lô", "HSD", "Còn", "Tồn (kg)"], row: x => [e(x.ma), e(x.ten), e(x.lo || "—"), dmy(x.hsd), x.con < 0 ? "<b style='color:#c62828'>quá " + (-x.con) + " ngày</b>" : x.con + " ngày", f(x.ton)] },
    dgShort: { t: "Lệnh đóng gói thiếu tồn BTP", h: ["Lệnh", "BTP", "Lô đã chọn", "Cần (kg)", "Thiếu (kg)"], row: x => [e(x.so), e(x.ma), e(x.lots.join(", ")), f(x.need), "<b style='color:#c62828'>" + f(x.short) + "</b>"] },
    lsxShort: { t: "Lệnh SX BTP thiếu nguyên liệu", h: ["Lệnh", "Thiếu"], row: x => [e(x.so), x.sh.map(s => e(s.ma) + " " + f(s.short) + " kg").join("; ")] },
    low: { t: "Âm kho / dưới mức tối thiểu", h: ["Mã", "Tên", "Tồn (kg)", "Tối thiểu (kg)"], row: x => [e(x.ma), e(x.ten), x.am ? "<b style='color:#c62828'>" + f(x.ton) + "</b>" : f(x.ton), x.min ? f(x.min) : ""] },
    treo: { t: "Lệnh SX chưa hoàn thành (treo lâu)", h: ["Lệnh", "Sản phẩm", "Ngày ra lệnh", "Đã treo"], row: x => [e(x.so), e(x.maSP), dmy(x.ngay), x.ngayTreo + " ngày"] }
  };
  const SHORT = { cho: n => n + " lô chờ QC", formMiss: n => n + " lệnh thiếu biểu mẫu QC", exp: n => n + " lô sắp/quá hạn", dgShort: n => n + " lệnh đóng gói thiếu BTP", lsxShort: n => n + " lệnh SX thiếu NL", low: n => n + " mã âm/dưới tối thiểu", treo: n => n + " lệnh SX treo" };
  function forUser(u, X) {
    const role = u.vai_tro || "", ql = role === "Quản lý", qc = ql || !!u.quyen_qc, kho = ["Thủ kho", "Kế toán kho", "Kế toán"].includes(role), mine = x => x.nguoi === u.ten;
    const S = {};
    if (qc) { S.cho = X.cho; S.formMiss = ql ? X.formMiss : X.formMiss; }
    if (ql || kho) { S.dgShort = X.dgShort; S.lsxShort = X.lsxShort; S.low = X.low; S.exp = X.exp; }
    else if (qc) S.exp = X.exp30;
    if (ql) S.treo = X.treo;
    if (!ql && !kho) { /* nhân viên: lệnh của chính mình */
      const dg = X.dgShort.filter(mine), ls = X.lsxShort.filter(mine), fm = X.formMiss.filter(mine), tr = X.treo.filter(t => (X.orders.find(o => o.so === t.so) || {}).nguoiLap === u.ten);
      if (dg.length) S.dgShort = dg; if (ls.length) S.lsxShort = ls; if (!qc && fm.length) S.formMiss = fm; if (tr.length) S.treo = tr;
    }
    Object.keys(S).forEach(k => { if (!S[k] || !S[k].length) delete S[k]; });
    const keys = ["formMiss", "cho", "dgShort", "lsxShort", "low", "exp", "treo"].filter(k => S[k]);
    const n = keys.reduce((s, k) => s + S[k].length, 0);
    const tbl = k => { const D = SEC[k], R = S[k].slice(0, 40); return `<h3 style="margin:18px 0 6px;font-size:15px;color:#0f5f56">${D.t} (${S[k].length})</h3><table style="border-collapse:collapse;font-size:13px;width:100%">` +
      `<tr>${D.h.map(h => `<th style="text-align:left;border-bottom:2px solid #cfd8dc;padding:5px 10px 5px 0">${h}</th>`).join("")}</tr>` +
      R.map(r => `<tr>${D.row(r).map(c => `<td style="border-bottom:1px solid #eceff1;padding:5px 10px 5px 0;vertical-align:top">${c == null ? "" : c}</td>`).join("")}</tr>`).join("") + `</table>` + (S[k].length > 40 ? `<p style="color:#78909c;font-size:12px">… và ${S[k].length - 40} dòng nữa — xem trong Sổ Kho.</p>` : ""); };
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#1d2a22;max-width:760px"><h2 style="margin:0 0 4px;color:#0f6f64">Sổ Kho — bản tin sáng ${dmy(X.today)}</h2><p style="margin:0 0 10px;color:#546e7a">Chào ${e(u.ten)}. ${n ? "Việc của bạn cần chú ý hôm nay:" : "Hôm nay không có việc tồn đọng nào trong phần việc của bạn. 👍"}</p>` +
      keys.map(tbl).join("") + `<p style="margin-top:20px"><a href="https://ghel-gif.github.io/so-kho/" style="background:#0f6f64;color:#fff;padding:9px 16px;border-radius:8px;text-decoration:none;font-weight:bold">Mở Sổ Kho</a></p><p style="color:#90a4ae;font-size:11px">Bản tin tự động · tắt / đổi email trong Sổ Kho → chuông 🔔 → Bản tin buổi sáng.</p></div>`;
    const sum = keys.map(k => SHORT[k](S[k].length)).join(" · ");
    return { n, keys, html, subject: "Sổ Kho " + dmy(X.today) + ": " + (n ? n + " việc cần chú ý" : "không có việc tồn"), push: n ? sum : "" };
  }

  G.SOKHO_BRIEF = {
    build(sheets, code, users) {
      const F = compile(code, gas(sheets)), X = facts(F);
      return users.map(u => Object.assign({ ten: u.ten }, forUser(u, X)));
    }
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
