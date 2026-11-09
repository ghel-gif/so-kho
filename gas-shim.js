/* ============================================================================
   SỔ KHO bản web — lớp giả lập Google Apps Script chạy trong trình duyệt.
   Mã máy chủ của Sổ Kho cũ (server.gs) chạy nguyên vẹn trên dữ liệu tải từ Supabase
   (bảng sheet_rows giữ đúng cấu trúc từng trang Google Sheet), nên chức năng giống hệt bản cũ.
   Ghi dữ liệu: gom các ô đã đổi → gửi 1 lần (hàm ghi_nhieu), có kiểm tra người khác vừa sửa.
   ========================================================================== */
"use strict";
(function () {
  const CFG = window.SOKHO_CFG;
  const sb = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "sokho-web-auth" } });
  window.SOKHO_SB = sb;
  const TZ = "Asia/Ho_Chi_Minh", OFF = 7 * 3600e3;
  const unsupported = what => { throw new Error(what + " chưa có ở bản web mới (cần Google Drive / email của bản cũ). Tạm dùng Sổ Kho cũ cho việc này."); };

  /* ---------- ngày giờ (luôn theo giờ Việt Nam) ---------- */
  const pad = (n, w = 2) => String(n).padStart(w, "0");
  function vn(d) { const x = new Date(d.getTime() + OFF); return { y: x.getUTCFullYear(), M: x.getUTCMonth() + 1, d: x.getUTCDate(), H: x.getUTCHours(), m: x.getUTCMinutes(), s: x.getUTCSeconds() }; }
  function fmt(d, f) {
    if (!(d instanceof Date) || isNaN(d)) return "";
    const p = vn(d);
    return f.replace(/yyyy|yy|MM|dd|HH|mm|ss|M|d|H/g, t => ({ yyyy: p.y, yy: pad(p.y % 100), MM: pad(p.M), dd: pad(p.d), HH: pad(p.H), mm: pad(p.m), ss: pad(p.s), M: p.M, d: p.d, H: p.H })[t]);
  }
  const DT_RE = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;
  const revive = v => { if (typeof v === "string") { const m = DT_RE.exec(v); if (m) return new Date(Date.UTC(+m[1], m[2] - 1, +m[3], m[4] - 7, +m[5], +m[6])); } return v; };
  const store = v => v instanceof Date ? fmt(v, "yyyy-MM-dd HH:mm:ss") : (v === undefined || v === null ? "" : v);

  /* ---------- kho dữ liệu trong máy ---------- */
  const DB = { sheets: {}, dirty: {}, backup: {}, loaded: false, ao: null };
  /* KHO THỬ: tài khoản gắn kho_thu chỉ đọc / ghi các trang "ao:<tên>" (số liệu ảo) — máy chủ (RLS) cũng chặn như vậy */
  const AO = () => !!(ME && ME.kho_thu), PX = "ao:";
  const phys = n => AO() ? PX + n : n, logi = n => AO() ? (n.startsWith(PX) ? n.slice(PX.length) : null) : (n.startsWith(PX) ? null : n);
  const vers = data => (data || []).map(v => ({ sheet: logi(v.sheet), ver: v.ver })).filter(v => v.sheet);
  const CACHE_K0 = "sokho-web-cache-v1";
  let CACHE_K = CACHE_K0;
  function modeCheck() { const ao = AO(); if (DB.ao !== null && DB.ao !== ao) { DB.sheets = {}; DB.loaded = false; } DB.ao = ao; CACHE_K = CACHE_K0 + (ao ? "-ao" : ""); }
  function saveCache() {
    try { const o = {}; Object.keys(DB.sheets).forEach(n => o[n] = { ver: DB.sheets[n].ver, rows: DB.sheets[n].rows.map(r => r.map(store)) }); localStorage.setItem(CACHE_K, JSON.stringify(o)); } catch (e) { try { localStorage.removeItem(CACHE_K); } catch (e2) {} }
  }
  function loadCache() {
    try { const o = JSON.parse(localStorage.getItem(CACHE_K) || "null"); if (!o) return; Object.keys(o).forEach(n => DB.sheets[n] = { ver: o[n].ver, rows: o[n].rows.map(r => r.map(revive)) }); } catch (e) {}
  }
  async function fetchRows(names) {
    const by = {}; names.forEach(n => by[n] = []);
    let from = 0;
    for (;;) {
      const { data, error } = await sb.from("sheet_rows").select("sheet,idx,data").in("sheet", names.map(phys)).order("sheet").order("idx").range(from, from + 999);
      if (error) throw error;
      data.forEach(r => { const a = by[logi(r.sheet)]; if (a) a[r.idx] = (r.data || []).map(revive); });
      if (data.length < 1000) break; from += 1000;
    }
    Object.keys(by).forEach(n => { const a = by[n]; for (let i = 0; i < a.length; i++) if (!a[i]) a[i] = []; });
    return by;
  }
  let syncP = null;
  async function sync() { // tải các trang có thay đổi kể từ lần trước
    if (syncP) return syncP;
    syncP = (async () => {
      modeCheck();
      if (!DB.loaded) { loadCache(); DB.loaded = true; }
      const r0 = await sb.from("sheet_ver").select("sheet,ver"), error = r0.error;
      if (error) throw error;
      const data = vers(r0.data);
      const need = data.filter(v => !DB.sheets[v.sheet] || DB.sheets[v.sheet].ver !== +v.ver).map(v => v.sheet);
      if (need.length) {
        const by = await fetchRows(need);
        data.forEach(v => { if (need.includes(v.sheet)) DB.sheets[v.sheet] = { ver: +v.ver, rows: by[v.sheet] || [] }; });
        saveCache();
      }
    })();
    try { await syncP; } finally { syncP = null; }
  }

  /* ---------- giả lập Sheet / Range ---------- */
  function touch(n) { if (!DB.backup[n]) DB.backup[n] = JSON.parse(JSON.stringify(DB.sheets[n].rows.map(r => r.map(store)))); if (!DB.dirty[n]) DB.dirty[n] = { idx: new Set(), replace: false }; return DB.dirty[n]; }
  const colNum = s => s.split("").reduce((a, c) => a * 26 + c.charCodeAt(0) - 64, 0);
  class Range {
    constructor(sh, r, c, nr, nc) { this.sh = sh; this.r = r; this.c = c; this.nr = nr; this.nc = nc; }
    getValues() { const R = this.sh.R, out = []; for (let i = 0; i < this.nr; i++) { const row = R[this.r - 1 + i] || [], o = []; for (let j = 0; j < this.nc; j++) { const v = row[this.c - 1 + j]; o.push(v === undefined || v === null ? "" : v); } out.push(o); } return out; }
    getValue() { return this.getValues()[0][0]; }
    getDisplayValues() { return this.getValues().map(r => r.map(v => v instanceof Date ? fmt(v, "dd/MM/yyyy") : String(v))); }
    setValues(v) {
      const d = touch(this.sh.n), R = this.sh.R;
      v.forEach((row, i) => { const ri = this.r - 1 + i; while (R.length <= ri) R.push([]); const t = R[ri];
        row.forEach((x, j) => { const ci = this.c - 1 + j; while (t.length < ci) t.push(""); t[ci] = x === undefined || x === null ? "" : x; }); d.idx.add(ri); });
      return this;
    }
    setValue(x) { const v = []; for (let i = 0; i < this.nr; i++) { const r = []; for (let j = 0; j < this.nc; j++) r.push(x); v.push(r); } return this.setValues(v); }
    clearContent() { return this.setValue(""); }
    clear() { return this.setValue(""); }
    getRow() { return this.r; } getColumn() { return this.c; } getNumRows() { return this.nr; } getNumColumns() { return this.nc; }
  }
  ["setNumberFormat", "setFontWeight", "setBackground", "setDataValidation", "setFormulas", "setFormula", "copyFormatToRange", "setWrap", "setHorizontalAlignment", "setFontColor", "setNote", "merge", "setBorder", "setFontSize"].forEach(m => Range.prototype[m] = function () { return this; });
  class Sheet {
    constructor(n) { this.n = n; }
    get R() { return DB.sheets[this.n].rows; }
    getName() { return this.n; }
    getSheetId() { return this.n; }
    getLastRow() { const R = this.R; let i = R.length; while (i > 0 && !(R[i - 1] || []).some(v => v !== "" && v !== null && v !== undefined)) i--; return i; }
    getLastColumn() { return Math.max(1, ...this.R.map(r => { let j = r.length; while (j > 0 && (r[j - 1] === "" || r[j - 1] == null)) j--; return j; })); }
    getMaxRows() { return Math.max(1000, this.R.length); }
    getMaxColumns() { return Math.max(26, this.getLastColumn()); }
    getDataRange() { return new Range(this, 1, 1, Math.max(1, this.getLastRow()), this.getLastColumn()); }
    getRange(a, b, c, d) {
      if (typeof a === "string") {
        const m = /^([A-Z]+)(\d*)(?::([A-Z]+)(\d*))?$/.exec(a); if (!m) throw new Error("Vùng ô không hỗ trợ: " + a);
        const c1 = colNum(m[1]), r1 = +m[2] || 1, c2 = m[3] ? colNum(m[3]) : c1, r2 = m[4] ? +m[4] : (m[3] ? Math.max(r1, this.getLastRow()) : r1);
        return new Range(this, r1, c1, r2 - r1 + 1, c2 - c1 + 1);
      }
      return new Range(this, a, b, c || 1, d || 1);
    }
    appendRow(arr) { const d = touch(this.n), R = this.R, at = this.getLastRow(), row = arr.map(x => x === undefined || x === null ? "" : x); if (at < R.length) R[at] = row; else R.push(row); d.idx.add(at); return this; }
    deleteRow(r) { const d = touch(this.n); this.R.splice(r - 1, 1); d.replace = true; return this; }
    deleteRows(r, n) { const d = touch(this.n); this.R.splice(r - 1, n); d.replace = true; return this; }
    insertRowsAfter(r, n) { const d = touch(this.n); this.R.splice(r, 0, ...Array.from({ length: n }, () => [])); d.replace = true; return this; }
  }
  ["setFrozenRows", "setColumnWidth", "setColumnWidths", "setRowHeights", "setRowHeight", "autoResizeColumns", "hideColumns", "setTabColor", "activate", "protect"].forEach(m => Sheet.prototype[m] = function () { return this; });
  Sheet.prototype.getRowHeight = () => 21;
  const SS = {
    getSheetByName: n => DB.sheets[n] ? new Sheet(n) : null,
    insertSheet: n => { if (!DB.sheets[n]) { DB.sheets[n] = { ver: 0, rows: [] }; touch(n).replace = true; } return new Sheet(n); },
    getSheets: () => Object.keys(DB.sheets).map(n => new Sheet(n)),
    getSpreadsheetTimeZone: () => TZ, getId: () => "supabase", getUrl: () => "", getName: () => "Sổ Kho (Supabase)",
    deleteSheet: () => {}
  };
  const chain = () => new Proxy({}, { get: (t, k) => k === "build" ? () => ({}) : () => chain() });
  const GAS = {
    SpreadsheetApp: { getActiveSpreadsheet: () => SS, flush: () => {}, newDataValidation: chain, openById: () => unsupported("Mở file Google Sheet khác") },
    Utilities: {
      formatDate: (d, tz, f) => fmt(d, f), getUuid: () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()),
      DigestAlgorithm: { MD5: "MD5", SHA_256: "SHA_256" }, Charset: { UTF_8: "UTF_8" },
      computeDigest: (alg, s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return [h & 255, (h >> 8) & 255, (h >> 16) & 255, (h >> 24) & 255]; },
      base64EncodeWebSafe: b => btoa(String.fromCharCode(...(Array.isArray(b) ? b.map(x => x & 255) : new TextEncoder().encode(String(b))))).replace(/\+/g, "-").replace(/\//g, "_"),
      base64Encode: b => btoa(String.fromCharCode(...(Array.isArray(b) ? b.map(x => x & 255) : new TextEncoder().encode(String(b))))),
      base64Decode: () => unsupported("Tải file"), newBlob: () => unsupported("Tải file lên Drive"), sleep: () => {}
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, tryLock: () => true, releaseLock() {}, hasLock: () => true }) },
    CacheService: { getScriptCache: () => ({ get: k => GAS._c.get(k) ?? null, put: (k, v) => GAS._c.set(k, v), remove: k => GAS._c.delete(k), removeAll: ks => ks.forEach(k => GAS._c.delete(k)) }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => GAS._p.get(k) ?? null, setProperty: (k, v) => GAS._p.set(k, v), deleteProperty: k => GAS._p.delete(k) }) },
    DriveApp: new Proxy({}, { get: () => () => unsupported("Lưu file lên Google Drive") }),
    MailApp: { sendEmail: () => unsupported("Gửi email cảnh báo") },
    ScriptApp: { getProjectTriggers: () => [], newTrigger: () => unsupported("Hẹn giờ tự động"), deleteTrigger: () => {}, getOAuthToken: () => "" },
    Session: { getActiveUser: () => ({ getEmail: () => "" }), getScriptTimeZone: () => TZ },
    HtmlService: {}, UrlFetchApp: { fetch: () => unsupported("Gọi dịch vụ ngoài") },
    Logger: { log: (...a) => console.log(...a) },
    _c: new Map(), _p: new Map()
  };

  /* ---------- đăng nhập: dùng tài khoản Supabase thay mã PIN ---------- */
  let ME = null;
  async function loadMe() { const { data, error } = await sb.rpc("toi"); if (error) throw error; ME = data && data.ten ? data : null; return ME; }
  function auth(a, allowed, ROLES) {
    if (!ME) throw new Error("Vui lòng đăng nhập.");
    if (a && a.ten && a.ten !== ME.ten) throw new Error("Vui lòng đăng nhập lại.");
    const role = ME.vai_tro || ROLES.XEM;
    if (allowed && allowed.indexOf(role) < 0) throw new Error('Tài khoản "' + role + '" không có quyền làm việc này.');
    const nhom = String(ME.pham_vi || "").split(",").map(x => x.trim()).filter(Boolean);
    return { ten: ME.ten, vaiTro: role, nhom, qc: role === ROLES.QL || !!ME.quyen_qc, ct: role === ROLES.QL || !!ME.xem_cong_thuc };
  }

  /* ---------- nạp mã máy chủ của Sổ Kho cũ ---------- */
  let SRV = null;
  async function loadServer() {
    const code = (await (await fetch("server.gs?v=" + (window.SOKHO_VER || ""), { cache: "no-cache" })).text()) + "\n" + (await (await fetch("khpt.gs?v=" + (window.SOKHO_VER || ""), { cache: "no-cache" })).text()) + `
/* --- thêm cho bản web: ảnh nhập kho lưu ở Supabase Storage --- */
function webThemAnh(a, id, fname, fid) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]);
  const m = moves_().find(x => x.id === String(id));
  if (!m || m.loai !== 'Nhập') throw new Error('Không tìm thấy phiếu nhập.');
  shX_(AN_SH, ['ID phiếu nhập', 'Mã', 'Số lô', 'Tên file', 'Link', 'File ID', 'Người', 'Thời điểm']).appendRow([m.id, m.ma, m.lo, fname, '', fid, me.ten, new Date()]);
  log_(me, 'Ảnh nhập kho', m.ma + (m.lo ? ' lô ' + m.lo : '') + ' · ngày ' + m.ngay, fname);
  return (anMap_()[m.id] || []).length;
}
function webKiemAnh(a, fid) { auth_(a); return !!(sheet_(AN_SH) && rows_(AN_SH).some(r => str_(r[5]) === String(fid))); }
function webKiemHoSo(a, ma, lo, loai, mime, size) {
  const me = auth_(a);
  if (!me.qc) throw new Error('Tài khoản ' + me.ten + ' chưa có quyền QC.');
  const it = items_().find(i => i.ma === ma);
  if (!hoSoOk_(it)) throw new Error('Chỉ đính kèm hồ sơ cho nguyên liệu kỹ thuật và bán thành phẩm theo lô.');
  if ((HS_THEO_NHOM[it.nhom] || HS_LOAI).indexOf(loai) < 0) throw new Error('Loại hồ sơ "' + loai + '" không dùng cho nhóm ' + it.nhom + '.');
  const nhan = HS_NHAN[loai] || ['pdf', 'img'];
  if (!nhan.some(k => HS_MIME[k].test(String(mime || '')))) throw new Error(loai + ': chỉ nhận file ' + nhan.map(k => ({ pdf: 'PDF', img: 'ảnh', word: 'Word' })[k]).join(', ') + '.');
  if (size > 15 * 1024 * 1024) throw new Error('File lớn quá 15 MB.');
  return { tenFile: (HS_TEN[loai] || 'HS') + '_' + ma + '_' + (String(lo || '') || 'chua-co-lo') + '_' + Utilities.formatDate(new Date(), tz_(), 'yyyyMMdd-HHmm') };
}
function webThemHoSo(a, ma, lo, loai, fname, url, fid) {
  const me = auth_(a); lo = String(lo || '');
  HS_C = null; sheet_(SH.HS).appendRow([ma, lo, loai, fname, url, me.ten, new Date(), fid]);
  log_(me, 'Đính kèm ' + loai, ma + ' lô ' + (lo || '(chưa có lô)'), fname);
  return getHoSo(a, ma, lo);
}
function webLotInfo(a, ma, lo) {
  auth_(a); lo = String(lo || '');
  const items = items_(), IM = {}; items.forEach(i => IM[i.ma] = i);
  const mv = moves_().filter(m => !m.trangThai), Q = qcMap_();
  const hs = getHoSo(a, ma, lo), xn = (hlMap_()[lotKey_(ma, lo)] || '');
  const nh = mv.filter(m => m.ma === ma && m.lo === lo && m.loai === 'Nhập' && m.lenh);
  const lenh = [...new Set(nh.map(m => m.lenh))];
  const nl = [];
  lenh.forEach(so => mv.filter(m => m.lenh === so && m.loai === 'Xuất').forEach(m => {
    const it = IM[m.ma] || {}; if (it.nhom !== 'Nguyên liệu' && it.nhom !== 'Bán thành phẩm') return;
    const q = Q[lotKey_(m.ma, m.lo)];
    nl.push({ lenh: so, ma: m.ma, ten: it.ten || '', nhom: it.nhom || '', lo: m.lo, kg: m.kg, qc: q ? q.tt : '' });
  }));
  return { hs, xn, nl, btp: (IM[ma] || {}).nhom === 'Bán thành phẩm' };
}
function webPhieuNhap(a, id) { auth_(a); const m = moves_().find(x => x.id === String(id)); return m ? { ma: m.ma, lo: m.lo, ngay: m.ngay, loai: m.loai } : null; }
`;
    const names = [...code.matchAll(/^function\s+([A-Za-z0-9_$]+)\s*\(/gm)].map(m => m[1]);
    const lets = [...code.matchAll(/^let\s+([^;]+);/gm)].flatMap(m => m[1].split(",").map(s => s.split("=")[0].trim()));
    const src = code
      .replace(/function auth_\(a, allowed\) \{/, "function auth_(a, allowed) { return __auth(a, allowed, ROLES);")
      .replace(/globalThis\[fn\]/g, "__F[fn]")
      + "\n;const __F = {" + names.map(n => `${n}: ${n}`).join(",") + "};\nreturn Object.assign(__F, { __reset() { " + lets.map(n => `${n} = null;`).join(" ") + " } });";
    const keys = ["SpreadsheetApp", "Utilities", "LockService", "CacheService", "PropertiesService", "DriveApp", "MailApp", "ScriptApp", "Session", "HtmlService", "UrlFetchApp", "Logger"];
    SRV = new Function(...keys, "__auth", src)(...keys.map(k => GAS[k]), auth);
  }
  const ready = (async () => { await loadServer(); try { await loadMe(); } catch (e) { ME = null; } })();

  /* ---------- chạy 1 hàm máy chủ ---------- */
  const clone = v => JSON.parse(JSON.stringify(v === undefined ? null : v, (k, x) => x));
  const outJSON = v => JSON.parse(JSON.stringify(v === undefined ? null : v, function (k, x) { const raw = this[k]; return raw instanceof Date ? fmt(raw, "yyyy-MM-dd HH:mm:ss") : x; }));
  function restore() { Object.keys(DB.backup).forEach(n => { DB.sheets[n].rows = DB.backup[n].map(r => r.map(revive)); }); DB.dirty = {}; DB.backup = {}; }
  async function flush() {
    const names = Object.keys(DB.dirty); if (!names.length) return;
    const p = names.map(n => { const d = DB.dirty[n], R = DB.sheets[n].rows; const idx = d.replace ? R.map((_, i) => i) : [...d.idx];
      return { sheet: phys(n), base_ver: DB.sheets[n].ver, replace: d.replace, rows: idx.map(i => [i, (R[i] || []).map(store)]) }; });
    const { data, error } = await sb.rpc("ghi_nhieu", { p });
    if (error) throw new Error(error.message);
    Object.keys(data || {}).forEach(k => { const n = logi(k); if (n && DB.sheets[n]) DB.sheets[n].ver = +data[k]; });
    DB.dirty = {}; DB.backup = {}; saveCache();
  }
  async function run(fn, args) {
    await ready;
    if (fn === "getUserNames") { const { data, error } = await sb.rpc("ds_dang_nhap"); if (error) throw error; const TT = ["Nguyễn Ô Ghel", "Phan Thị Cẩm Tiên", "Châu Trần Yến Nhi", "KT Kho"], k = n => { const i = TT.indexOf(n); return i < 0 ? 99 : i; }; return (data || []).map(u => u.ten).sort((a, b) => k(a) - k(b) || a.localeCompare(b, "vi")); }
    if (fn === "login") return login(args[0]);
    if (fn === "uploadAnhNhap") return uploadAnh(...args);
    if (fn === "getAnh") return getAnhWeb(...args);
    if (fn === "uploadHoSo") return uploadHoSoWeb(...args);
    if (!ME) { try { await loadMe(); } catch (e) {} if (!ME) throw new Error("Vui lòng đăng nhập."); }
    for (let lan = 0; lan < 2; lan++) {
      await sync();
      if (!DB.sheets.VatTu || !DB.sheets.Phieu) { if (AO()) throw new Error("Kho thử chưa có số liệu ảo. Nhờ anh Ghel chạy file nạp số liệu kho thử trong Supabase."); if (ME && ME.vai_tro === "Quản lý") napDuLieu(); throw new Error("Đã đăng nhập đúng, nhưng Supabase CHƯA CÓ DỮ LIỆU Sổ Kho." + (ME && ME.vai_tro === "Quản lý" ? " Bấm nút “Chọn file dữ liệu” ở giữa màn hình." : " Nhờ Quản lý nạp dữ liệu.")); }
      SRV.__reset(); DB.dirty = {}; DB.backup = {};
      let res;
      try {
        if (fn === "runW") { const [f, a] = args; if (typeof SRV[f] !== "function" || /_$/.test(f)) throw new Error("Không hỗ trợ: " + f); const r = SRV[f](...clone(a || [])); SRV.__reset(); res = { r: r === undefined ? null : r, d: SRV.getData(a && a[0]) }; }
        else { if (typeof SRV[fn] !== "function" || /_$/.test(fn)) throw new Error("Không có chức năng " + fn); res = SRV[fn](...clone(args)); }
      } catch (e) { restore(); throw e; }
      try { await flush(); } catch (e) { restore(); if (/DU_LIEU_DOI/.test(e.message) && lan === 0) continue; throw new Error(/DU_LIEU_DOI/.test(e.message) ? "Có người vừa sửa dữ liệu cùng lúc, vui lòng thử lại." : e.message); }
      return linkHoSo(outJSON(res));
    }
  }
  async function login(a) {
    const { data: ds, error: e1 } = await sb.rpc("ds_dang_nhap"); if (e1) throw e1;
    const u = (ds || []).find(x => x.ten === a.ten); if (!u) throw new Error("Không có người dùng " + a.ten);
    const pw = String(a.pin || "");
    if (pw.length < 6) throw new Error("Mật khẩu ít nhất 6 ký tự." + (u.da_kich_hoat ? "" : " (Lần đầu dùng bản web: mật khẩu bạn nhập sẽ được đặt làm mật khẩu.)"));
    if (u.da_kich_hoat) {
      const { error } = await sb.auth.signInWithPassword({ email: u.email, password: pw });
      if (error) throw new Error(/Invalid login/i.test(error.message) ? "Sai mật khẩu." : error.message);
    } else {
      const { data, error } = await sb.auth.signUp({ email: u.email, password: pw });
      if (error) throw new Error(error.message);
      if (!data.session) throw new Error("Đã tạo tài khoản nhưng Supabase đang bật “Confirm email”. Quản lý cần tắt mục này.");
    }
    await loadMe(); if (!ME) throw new Error("Tài khoản chưa liên kết với người dùng Sổ Kho.");
    try { localStorage.setItem("sokho_last_ten", ME.ten); } catch (e) {}
    const r = auth(a, null, { QL: "Quản lý", XEM: "Chỉ xem" });
    return Object.assign(r, { tk: "sb" });
  }


  /* ---------- nạp dữ liệu lần đầu từ file xuất của Sổ Kho cũ (chỉ Quản lý, khi Supabase còn trống) ---------- */
  function napDuLieu() {
    if (document.getElementById("napBox")) return;
    const d = document.createElement("div"); d.id = "napBox";
    d.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(10,20,30,.55);display:flex;align-items:center;justify-content:center;padding:16px;font-family:inherit";
    d.innerHTML = `<div style="background:#fff;color:#16233f;max-width:440px;width:100%;border-radius:16px;padding:24px;box-shadow:0 20px 50px rgba(0,0,0,.3)">
      <h2 style="margin:0 0 8px;font-size:19px">Nạp dữ liệu Sổ Kho</h2>
      <p style="margin:0 0 14px;font-size:14px;line-height:1.5">Supabase chưa có dữ liệu. Bấm nút dưới, chọn file <b>sokho_du_lieu.json</b> (file Claude gửi trong khung chat, đã tải về máy).</p>
      <label style="display:block;background:#1f6fb8;color:#fff;text-align:center;padding:12px;border-radius:10px;font-weight:600;cursor:pointer">Chọn file dữ liệu<input type="file" accept=".json,application/json" style="display:none" id="napFile"></label>
      <p id="napMsg" style="margin:12px 0 0;font-size:14px"></p></div>`;
    document.body.appendChild(d);
    d.querySelector("#napFile").onchange = async e => {
      const f = e.target.files[0], msg = d.querySelector("#napMsg"); if (!f) return;
      try {
        msg.textContent = "Đang đọc file…";
        const o = JSON.parse(await f.text());
        if (!o.VatTu || !o.Phieu) throw new Error("File không đúng (không có trang VatTu / Phieu).");
        const { data: vs } = await sb.from("sheet_ver").select("sheet,ver"); const V = {}; (vs || []).forEach(x => V[x.sheet] = +x.ver);
        const names = Object.keys(o); let i = 0;
        for (const n of names) {
          let rows = o[n]; if (n === "NguoiDung") rows = rows.map(r => [r[0], ""].concat(r.slice(1)));
          rows = rows.map(r => { r = [...r]; while (r.length && r[r.length - 1] === "") r.pop(); return r; });
          msg.textContent = `Đang nạp ${n} (${rows.length} dòng) · ${++i}/${names.length}…`;
          const { error } = await sb.rpc("ghi_nhieu", { p: [{ sheet: n, base_ver: V[n] || 0, replace: true, rows: rows.map((r, k) => [k, r]) }] });
          if (error) throw new Error(n + ": " + error.message);
        }
        msg.textContent = "Xong! Đang mở Sổ Kho…";
        try { localStorage.removeItem(CACHE_K); } catch (x) {}
        setTimeout(() => location.reload(), 800);
      } catch (x) { msg.style.color = "#b42318"; msg.textContent = "Lỗi: " + (x.message || x); }
    };
  }


  /* ---------- ảnh hàng / marking khi nhập kho: Supabase Storage (bucket anh-nhap) ---------- */
  const BUCKET = "anh-nhap";
  async function uploadAnh(a, id, name, mime, b64) {
    if (AO()) throw new Error("Kho thử: không tải ảnh lên.");
    if (!/^image\/(jpeg|png|webp)$/.test(String(mime || ""))) throw new Error("Chỉ nhận ảnh (JPG, PNG).");
    const bin = atob(String(b64 || "")), bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    if (bytes.length > 8 * 1024 * 1024) throw new Error("Ảnh lớn quá 8 MB.");
    const m = await run("webPhieuNhap", [a, id]); if (!m || m.loai !== "Nhập") throw new Error("Không tìm thấy phiếu nhập.");
    const ext = mime === "image/png" ? ".png" : mime === "image/webp" ? ".webp" : ".jpg";
    const stamp = fmt(new Date(), "yyyyMMdd-HHmmss");
    const fname = ["Anh", m.ma, m.lo || m.ngay, stamp].join("_").replace(/[\\/:*?"<>|]/g, "-") + ext;
    const path = String(id).replace(/[^A-Za-z0-9._-]/g, "_") + "/" + stamp + "-" + Math.random().toString(36).slice(2, 7) + ext;
    const { error } = await sb.storage.from(BUCKET).upload(path, bytes, { contentType: mime, upsert: false });
    if (error) throw new Error("Không tải ảnh lên được: " + error.message + (/bucket|not found|policy|security/i.test(error.message) ? " (Quản lý cần chạy file 08_anh_nhap_kho.sql)" : ""));
    return run("webThemAnh", [a, id, fname, "sb:" + path]);
  }
  async function getAnhWeb(a, fid) {
    fid = String(fid || "");
    if (!fid.startsWith("sb:")) { // ảnh trên Google Drive (đã dời sau 90 ngày, hoặc chụp từ Sổ Kho cũ)
      const { data: ss } = await sb.auth.getSession(); const tk = ss && ss.session && ss.session.access_token;
      try {
        const r = await fetch(CFG.anhUrl + "?anh=" + encodeURIComponent(fid) + "&tk=" + encodeURIComponent(tk || ""));
        const o = await r.json(); if (o && o.b64) return { mime: o.mime || "image/jpeg", b64: o.b64 };
        if (o && o.err) throw new Error(o.err);
      } catch (e) { throw new Error("Ảnh này lưu trên Google Drive, chưa lấy được: " + (e.message || e)); }
      throw new Error("Không lấy được ảnh trên Drive.");
    }
    if (!(await run("webKiemAnh", [a, fid]))) throw new Error("Không tìm thấy ảnh.");
    const { data, error } = await sb.storage.from(BUCKET).download(fid.slice(3));
    if (error) throw new Error("Không tải được ảnh: " + error.message);
    const buf = new Uint8Array(await data.arrayBuffer()); let bin = ""; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return { mime: data.type || "image/jpeg", b64: btoa(bin) };
  }


  /* ---------- hồ sơ lô (COA, phiếu kết quả…): lưu cố định trên Supabase Storage (bucket ho-so), mở nhanh cho mọi người đăng nhập;
     mỗi đêm Apps Script chép thêm 1 bản sang thư mục hồ sơ lô trên Drive ---------- */
  const HS_BUCKET = "ho-so";
  async function uploadHoSoWeb(a, ma, lo, loai, name, mime, b64) {
    if (AO()) throw new Error("Kho thử: không tải hồ sơ lên.");
    const bin = atob(String(b64 || "")), bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const k = await run("webKiemHoSo", [a, ma, lo, loai, mime, bytes.length]);
    const ext = (String(name || "").match(/\.[A-Za-z0-9]{2,5}$/) || [mime === "application/pdf" ? ".pdf" : /word/.test(mime) ? ".docx" : ".jpg"])[0];
    const fname = k.tenFile.replace(/[\\/:*?"<>|]/g, "-") + ext;
    const safe = x => String(x || "_").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/[^A-Za-z0-9._-]/g, "_");
    const path = safe(ma) + "/" + safe(lo) + "/" + safe(fname.replace(/\.[^.]+$/, "")) + "-" + Math.random().toString(36).slice(2, 7) + ext.toLowerCase();
    const { error } = await sb.storage.from(HS_BUCKET).upload(path, bytes, { contentType: mime, upsert: false });
    if (error) throw new Error("Không tải file lên được: " + error.message + (/bucket|not found|policy|security|mime/i.test(error.message) ? " (Quản lý cần chạy file 10_ho_so_lo.sql)" : ""));
    return run("webThemHoSo", [a, ma, lo, loai, fname, "sbhs:" + path, ""]);
  }
  /* link "sbhs:…" → "#sbhs:…"; khi bấm mới xin link xem tạm (5 phút) nên không bao giờ hết hạn trên màn hình */
  function linkHoSo(v) {
    const walk = o => { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === "object") Object.keys(o).forEach(k => { const x = o[k];
      if (k === "link" && typeof x === "string" && x.startsWith("sbhs:")) o[k] = "#" + x;
      else if (k === "link" && typeof x === "string" && /drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/.test(x)) o[k] = "#gdhs:" + x.match(/\/file\/d\/([A-Za-z0-9_-]+)/)[1];
      else walk(x); }); };
    walk(v); return v;
  }
  /* hồ sơ cũ nằm trên Google Drive: lấy qua Sổ Kho cũ (kiểm tra phiên đăng nhập web) → mở trong tab mới, không cần quyền Drive */
  if (typeof document !== "undefined") document.addEventListener("click", async e => {
    const a = e.target.closest && e.target.closest('a[href^="#gdhs:"]'); if (!a) return;
    e.preventDefault(); e.stopPropagation();
    const w = window.open("", "_blank");
    try { if (w) w.document.write("<p style=\"font:15px system-ui;padding:24px\">Đang lấy hồ sơ từ Google Drive…</p>"); } catch (x) {}
    try {
      const { data: ss } = await sb.auth.getSession(); const tk = ss && ss.session && ss.session.access_token;
      const r = await fetch(CFG.anhUrl + "?hs=" + encodeURIComponent(a.getAttribute("href").slice(6)) + "&tk=" + encodeURIComponent(tk || ""));
      const o = await r.json(); if (!o || !o.b64) throw new Error((o && o.err) || "lỗi không rõ");
      const bin = atob(o.b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([u8], { type: o.mime || "application/octet-stream" }));
      if (w) w.location.href = url; else location.href = url;
    } catch (x) { if (w) w.close(); alert("Không mở được hồ sơ: " + (x.message || x)); }
  }, true);
  if (typeof document !== "undefined") document.addEventListener("click", async e => {
    const a = e.target.closest && e.target.closest('a[href^="#sbhs:"]'); if (!a) return;
    e.preventDefault(); e.stopPropagation();
    const w = window.open("", "_blank");
    try { if (w) w.document.write("<p style=\"font:15px system-ui;padding:24px\">Đang mở hồ sơ…</p>"); } catch (x) {}
    const { data, error } = await sb.storage.from(HS_BUCKET).createSignedUrl(a.getAttribute("href").slice(6), 300);
    if (error || !data) { if (w) w.close(); alert("Không mở được hồ sơ: " + ((error && error.message) || "")); return; }
    if (w) w.location.href = data.signedUrl; else location.href = data.signedUrl;
  }, true);

  /* ---------- google.script.run / history / url ---------- */
  function runner(ok, fail) {
    return new Proxy({}, { get(t, k) {
      if (k === "withSuccessHandler") return f => runner(f, fail);
      if (k === "withFailureHandler") return f => runner(ok, f);
      if (k === "withUserObject") return () => runner(ok, fail);
      return (...args) => { run(k, args).then(r => ok && ok(r), e => { console.error(e); fail && fail(e instanceof Error ? e : new Error(String(e && e.message || e))); }); };
    } });
  }
  window.google = { script: {
    run: runner(null, null),
    history: { push() {}, replace() {}, setChangeHandler() {} },
    url: { getLocation: cb => cb({ parameter: Object.fromEntries(new URLSearchParams(location.search)), hash: location.hash.slice(1) }) }
  } };
  async function peek() { // chỉ hỏi số phiên bản từng trang – rất nhẹ; true nếu máy khác vừa đổi dữ liệu
    if (!DB.loaded) return false;
    const r0 = await sb.from("sheet_ver").select("sheet,ver"); if (r0.error) throw r0.error;
    return vers(r0.data).some(v => !DB.sheets[v.sheet] || DB.sheets[v.sheet].ver !== +v.ver);
  }
  window.SOKHO_WEB = { sync, peek, signOut: async () => { ME = null; DB.sheets = {}; DB.loaded = false; DB.ao = null; await sb.auth.signOut(); }, db: DB, khoThu: () => AO() };
})();
