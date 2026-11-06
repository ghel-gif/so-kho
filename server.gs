/**
 * SỔ KHO (kg) — phần mềm theo dõi nhập / xuất / kiểm kê / tồn kho quy đổi kg.
 * Dữ liệu lưu trong chính Google Sheet chứa đoạn code này.
 * Các trang tính được tạo tự động lần đầu chạy:
 *   VatTu      – danh mục vật tư
 *   Phieu      – toàn bộ phiếu nhập / xuất / kiểm kê (không xoá hẳn, chỉ đánh dấu)
 *   NguoiDung  – tên, mã PIN, vai trò của người dùng
 *   TonKho     – bảng tồn kho tự tính bằng công thức (để kế toán xem / tải Excel)
 *   LenhSX     – lệnh sản xuất (BTP, đóng gói…): lập lệnh → hoàn thành = trừ vật tư thực tế + nhập SP
 *   CongThuc   – định mức vật tư cho 1 đơn vị sản phẩm (dán từ file công thức giá được)
 */

const SH = { VT: 'VatTu', PH: 'Phieu', ND: 'NguoiDung', TK: 'TonKho', LX: 'LenhSX', CT: 'CongThuc', QC: 'QCLo', NK: 'NhatKy', CD: 'CaiDat', XNB: 'PhieuXNB', HS: 'HoSoLo', TT: 'TyTrongLo' };
const CHU_HANG = ['Asata', 'Đồng Phát', 'Hitaka', 'Nông Trang', 'Phúc Trời', 'Heanal'];
const LYDO_XNB = ['Rửa máy / vệ sinh thiết bị', 'Lấy mẫu QC / lưu mẫu', 'Hủy hàng hỏng, quá hạn', 'Xuất trả nhà cung cấp', 'Xuất bán / giao khách hàng', 'Khác'];
const QC_TT = ['Chờ kiểm', 'Đạt', 'Không đạt'];
const ROLES = { QL: 'Quản lý', KT: 'Kế toán', TK: 'Thủ kho', NV: 'Nhân viên', KTK: 'Kế toán kho', XEM: 'Chỉ xem' };
const LOAI = ['Nhập', 'Xuất', 'Kiểm kê'];
const NHOM = ['Nguyên liệu', 'Phụ gia / dung môi', 'Bao bì', 'Bán thành phẩm', 'Thành phẩm', 'Phân bón', 'Khác'];
const NCOL = 16; // số cột của trang Phieu

/* ================= WEB APP ================= */
function doGet() {
  // Kiểm tra / tạo sheet chỉ khi code đổi hoặc 6 giờ 1 lần (trước đây chạy mỗi lần mở app, mất 1–2 giây)
  const ek = 'ens_' + ensureSheets_.toString().length, ec = CacheService.getScriptCache();
  if (!ec.get(ek)) { ensureSheets_(); ec.put(ek, '1', 21600); }
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Sổ Kho')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* ================= CÀI ĐẶT TRANG TÍNH ================= */
function ensureSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const make = (name, headers, textCols) => {
    let sh = ss.getSheetByName(name);
    if (sh) return sh;
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#e3efe6');
    sh.setFrozenRows(1);
    (textCols || []).forEach(c => sh.getRange(1, c, sh.getMaxRows(), 1).setNumberFormat('@'));
    return sh;
  };
  const col = (sh, c, title, text) => {
    if (str_(sh.getRange(1, c).getValue())) return;
    sh.getRange(1, c).setValue(title).setFontWeight('bold').setBackground('#e3efe6');
    if (text) sh.getRange(1, c, sh.getMaxRows(), 1).setNumberFormat('@');
  };
  const vt = make(SH.VT, ['Mã', 'Tên', 'Nhóm', 'Đơn vị', 'Hệ số kg / đơn vị', 'Tồn đầu kỳ (kg)', 'Mức tối thiểu (kg)'], [1]);
  col(vt, 8, 'Theo dõi lô', true); col(vt, 9, 'Hạn dùng (tháng)'); col(vt, 10, 'Chủ hàng (trống = Asata)', true);
  make(SH.HS, ['Mã', 'Số lô', 'Loại', 'Tên file', 'Link', 'Người', 'Thời điểm', 'File ID'], [1, 2]);
  make(SH.TT, ['Mã', 'Số lô', 'Tỷ trọng (g/ml)', 'Ngày', 'Người', 'Thời điểm'], [1, 2, 4]);
  const ph = make(SH.PH, ['ID', 'Thời điểm lập', 'Ngày', 'Loại', 'Mã', 'Số lượng', 'Đơn vị', 'Kg', 'Chứng từ / Lệnh SX', 'Ghi chú', 'Người lập', 'Trạng thái'], [1, 3, 5]);
  col(ph, 13, 'Lệnh SX', true); col(ph, 14, 'Số lô', true); col(ph, 15, 'NSX', true); col(ph, 16, 'HSD', true);
  make(SH.LX, ['Số lệnh', 'Ngày ra lệnh', 'Mã SP', 'SL dự kiến', 'Trạng thái', 'Ngày hoàn thành', 'SL thực tế', 'Người lập', 'Người hoàn thành', 'Ghi chú'], [1, 2, 3, 6]);
  make(SH.CT, ['Mã SP', 'Mã vật tư', 'Định mức / 1 đơn vị SP'], [1, 2]);
  make(SH.QC, ['Mã', 'Số lô', 'Trạng thái', 'Ngày', 'Người', 'Ghi chú', 'HSD mới', 'Thời điểm'], [1, 2, 4, 7]);
  make(SH.NK, ['Thời điểm', 'Người', 'Hành động', 'Đối tượng', 'Chi tiết']);
  if (!ss.getSheetByName(SH.CD)) {
    const c = make(SH.CD, ['Cài đặt', 'Giá trị', 'Giải thích']);
    c.getRange(2, 1, 5, 3).setValues([
      ['Email nhận cảnh báo', '', 'Nhiều email cách nhau bằng dấu phẩy'],
      ['Báo trước hết hạn (ngày)', 90, 'Lô còn hạn ít hơn số ngày này sẽ được cảnh báo'],
      ['Báo lệnh SX treo quá (ngày)', 7, 'Lệnh Đang SX lâu hơn số ngày này sẽ được cảnh báo'],
      ['Nhóm cần QC theo lô', 'Nguyên liệu, Bán thành phẩm', 'Lô mới nhập của các nhóm này ở trạng thái Chờ kiểm, chưa xuất được'],
      ['Giờ gửi cảnh báo', 7, 'Giờ trong ngày (0–23)']]);
    c.setColumnWidth(1, 220); c.setColumnWidth(2, 260); c.setColumnWidth(3, 420);
  }
  const nd = ss.getSheetByName(SH.ND);
  if (!nd) {
    const s = make(SH.ND, ['Tên', 'Mã PIN', 'Vai trò'], [2]);
    s.getRange(2, 1, 1, 3).setValues([['Quản lý', '1234', ROLES.QL]]);
    s.getRange(2, 3, 200, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(Object.values(ROLES), true).build());
    s.getRange('E1').setValue('Vai trò: Quản lý (toàn quyền) · Kế toán (lập, xoá phiếu, sửa vật tư) · Thủ kho (lập phiếu) · Chỉ xem. ĐỔI MÃ PIN 1234 NGAY.');
  }
  const nds = ss.getSheetByName(SH.ND);
  if (!str_(nds.getRange(1, 4).getValue())) {
    nds.getRange(1, 4).setValue('Phạm vi nhóm (trống = tất cả)').setFontWeight('bold').setBackground('#e3efe6');
    nds.getRange(2, 3, 200, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(Object.values(ROLES), true).build());
    nds.getRange('F1').setValue('Phạm vi nhóm: tên nhóm cách nhau bằng dấu phẩy, VD: Nguyên liệu, Phụ gia / dung môi, Bán thành phẩm. Chỉ áp dụng cho Thủ kho và Nhân viên.');
  }
  if (!str_(nds.getRange(1, 5).getValue())) {
    nds.getRange(1, 5).setValue('Quyền QC (Có / để trống)').setFontWeight('bold').setBackground('#e3efe6');
    nds.getRange(2, 5, 200, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Có'], true).build());
  }
  if (!str_(nds.getRange(1, 6).getValue())) {
    nds.getRange(1, 6).setValue('Xem công thức (Có / để trống)').setFontWeight('bold').setBackground('#e3efe6');
    nds.getRange(2, 6, 200, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Có'], true).build());
  }
  make(SH.XNB, ['Số phiếu', 'Ngày', 'Lý do', 'Người nhận', 'Bộ phận', 'Ghi chú', 'Người lập', 'Thời điểm lập', 'Trạng thái', 'Đã nhập AMIS', 'Dòng (JSON)'], [1, 2]);
  if (!ss.getSheetByName(SH.TK)) {
    const s = make(SH.TK, ['Mã', 'Tên', 'Nhóm', 'Đơn vị', 'Tồn đầu kỳ (kg)', 'Nhập (kg)', 'Xuất (kg)', 'Kiểm kê (kg)', 'Tồn (kg)', 'Tồn theo đơn vị', 'Trạng thái']);
    const V = SH.VT, P = SH.PH;
    // Công thức dùng MAP/LAMBDA (SUMIFS không tự mở rộng trong ARRAYFORMULA); dấu ; vì bảng tính locale vi_VN
    s.getRange('A2:K2').setFormulas([[
      `=ARRAYFORMULA(IF(LEN(${V}!A2:A);${V}!A2:A;""))`,
      `=ARRAYFORMULA(IF(LEN(${V}!A2:A);${V}!B2:B;""))`,
      `=ARRAYFORMULA(IF(LEN(${V}!A2:A);${V}!C2:C;""))`,
      `=ARRAYFORMULA(IF(LEN(${V}!A2:A);${V}!D2:D;""))`,
      `=ARRAYFORMULA(IF(LEN(A2:A);IFERROR(${V}!F2:F*1;0);""))`,
      `=MAP(A2:A;LAMBDA(m;IF(m="";"";SUMIFS(${P}!H2:H;${P}!E2:E;m;${P}!D2:D;"Nhập";${P}!L2:L;""))))`,
      `=MAP(A2:A;LAMBDA(m;IF(m="";"";SUMIFS(${P}!H2:H;${P}!E2:E;m;${P}!D2:D;"Xuất";${P}!L2:L;""))))`,
      `=MAP(A2:A;LAMBDA(m;IF(m="";"";SUMIFS(${P}!H2:H;${P}!E2:E;m;${P}!D2:D;"Kiểm kê";${P}!L2:L;""))))`,
      `=ARRAYFORMULA(IF(LEN(A2:A);E2:E+F2:F-G2:G+H2:H;""))`,
      `=ARRAYFORMULA(IF(LEN(A2:A);IFERROR(I2:I/${V}!E2:E;"");""))`,
      `=ARRAYFORMULA(IF(LEN(A2:A);IF(I2:I<0;"Âm kho";IF((IFERROR(${V}!G2:G*1;0)>0)*(I2:I<IFERROR(${V}!G2:G*1;0));"Dưới mức";""));""))`
    ]]);
    s.getRange('E2:J').setNumberFormat('#,##0.00');
  }
  const def = ss.getSheetByName('Sheet1') || ss.getSheetByName('Trang tính1');
  if (def && ss.getSheets().length > 1 && def.getLastRow() === 0) ss.deleteSheet(def);
}

/* ================= TIỆN ÍCH ================= */
const tz_ = () => TZ_ || (TZ_ = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone()); // nhớ múi giờ trong 1 lần gọi (trước đây hỏi lại Sheets ở mỗi ô ngày → rất chậm)
const str_ = v => (v instanceof Date ? Utilities.formatDate(v, tz_(), 'yyyy-MM-dd') : String(v == null ? '' : v)).trim();
const num_ = v => { const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.')); return isNaN(n) ? 0 : n; };
let SS_ = null, TZ_ = null, RC_ = null; // RC_: bộ nhớ đọc sheet, chỉ bật trong các hàm chỉ đọc (getData, getDash)
const sheet_ = n => (SS_ || (SS_ = SpreadsheetApp.getActiveSpreadsheet())).getSheetByName(n);
/* Bộ nhớ tạm trong 1 lần gọi: Cài đặt, Người dùng, Hồ sơ lô được đọc nhiều lần → chỉ đọc sheet 1 lần. Ghi vào các sheet này thì xoá bộ nhớ tạm. */
let CD_C = null, ND_C = null, HS_C = null;
const cdRows_ = () => CD_C || (CD_C = sheet_(SH.CD) ? rows_(SH.CD) : []);
const ndRows_ = () => ND_C || (ND_C = rows_(SH.ND));
const hsRows_ = () => HS_C || (HS_C = sheet_(SH.HS) ? rows_(SH.HS) : []);
const rows_ = n => { if (RC_ && RC_[n]) return RC_[n]; const s = sheet_(n); const all = s.getDataRange().getValues(), out = all.length < 2 ? [] : all.slice(1); if (RC_) RC_[n] = out; return out; };

/* Khoá tạm đăng nhập: sai PIN PIN_MAX lần liên tiếp thì khoá tài khoản đó PIN_LOCK_MIN phút */
const PIN_MAX = 3, PIN_LOCK_MIN = 30;
function pinKey_(ten) { return 'pinf_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, String(ten), Utilities.Charset.UTF_8)); }
function pinState_(ten) { try { return JSON.parse(CacheService.getScriptCache().get(pinKey_(ten)) || '{}'); } catch (e) { return {}; } }
function pinGuard_(ten) {
  const o = pinState_(ten);
  if (o.until && o.until > Date.now()) {
    const p = Math.max(1, Math.ceil((o.until - Date.now()) / 60000));
    throw new Error('Tài khoản "' + ten + '" đang bị khoá tạm vì nhập sai mã PIN ' + PIN_MAX + ' lần. Thử lại sau ' + p + ' phút.');
  }
}
function pinFail_(ten) {
  const lock = LockService.getScriptLock(); try { lock.waitLock(5000); } catch (e) {}
  try {
    let o = pinState_(ten); if (o.until && o.until <= Date.now()) o = {};
    o.n = (o.n || 0) + 1;
    let msg;
    if (o.n >= PIN_MAX) {
      o = { until: Date.now() + PIN_LOCK_MIN * 60000, n: 0 };
      log_({ ten: ten }, 'Khoá tạm đăng nhập', ten, 'Nhập sai mã PIN ' + PIN_MAX + ' lần liên tiếp · khoá ' + PIN_LOCK_MIN + ' phút');
      msg = 'Sai mã PIN ' + PIN_MAX + ' lần. Tài khoản "' + ten + '" bị khoá tạm ' + PIN_LOCK_MIN + ' phút.';
    } else msg = 'Sai tên hoặc mã PIN. Còn ' + (PIN_MAX - o.n) + ' lần thử, sai tiếp sẽ bị khoá ' + PIN_LOCK_MIN + ' phút.';
    CacheService.getScriptCache().put(pinKey_(ten), JSON.stringify(o), 21600);
    return msg;
  } finally { try { lock.releaseLock(); } catch (e) {} }
}
function pinOk_(ten) { try { const c = CacheService.getScriptCache(), k = pinKey_(ten); if (c.get(k)) c.remove(k); } catch (e) {} }

function auth_(a, allowed) {
  if (!a || !a.ten) throw new Error('Vui lòng đăng nhập.');
  const byPin = !a.tk;
  if (byPin) pinGuard_(a.ten);
  const u = ndRows_().find(r => str_(r[0]) === a.ten && (a.tk ? tok_(a.ten, str_(r[1])) === a.tk : str_(r[1]) === String(a.pin || '')));
  if (!u) throw new Error(a.tk ? 'Tên hoặc mã PIN đã được đổi. Vui lòng đăng nhập lại.' : pinFail_(a.ten));
  if (byPin) pinOk_(a.ten);
  const role = str_(u[2]) || ROLES.XEM;
  if (allowed && allowed.indexOf(role) < 0) throw new Error('Tài khoản "' + role + '" không có quyền làm việc này.');
  const nhom = str_(u[3]).split(',').map(x => x.trim()).filter(String);
  return { ten: a.ten, vaiTro: role, nhom, qc: role === ROLES.QL || str_(u[4]) === 'Có', ct: role === ROLES.QL || str_(u[5]) === 'Có' };
}
function needCT_(me) { if (!me.ct) throw new Error('Tài khoản ' + me.ten + ' không được xem công thức, định mức.'); }
const seeItem_ = (me, it) => me.ct || !me.nhom.length || me.nhom.indexOf(it.nhom) >= 0;
function scopeOk_(me, it) { return [ROLES.QL, ROLES.KT].indexOf(me.vaiTro) >= 0 || !me.nhom.length || me.nhom.indexOf(it.nhom) >= 0; }
function needScope_(me, it) { if (!scopeOk_(me, it)) throw new Error(me.ten + ' không được thao tác nhóm "' + it.nhom + '" (' + it.ma + ').'); }

/* ---------- cài đặt, nhật ký, QC ---------- */
function settings_() {
  const o = {};
  cdRows_().forEach(r => { if (str_(r[0])) o[str_(r[0])] = r[1]; });
  const list = v => str_(v).split(',').map(x => x.trim()).filter(String);
  return {
    email: list(o['Email nhận cảnh báo']).join(','),
    hetHan: num_(o['Báo trước hết hạn (ngày)']) || 90,
    treo: num_(o['Báo lệnh SX treo quá (ngày)']) || 7,
    nhomQC: o['Nhóm cần QC theo lô'] === undefined ? ['Nguyên liệu', 'Bán thành phẩm'] : list(o['Nhóm cần QC theo lô']),
    gio: o['Giờ gửi cảnh báo'] === undefined || o['Giờ gửi cảnh báo'] === '' ? 7 : Math.min(23, Math.max(0, Math.round(num_(o['Giờ gửi cảnh báo']))))
  };
}
function log_(me, act, obj, detail) {
  try { sheet_(SH.NK).appendRow([new Date(), me.ten, act, String(obj || ''), String(detail || '').slice(0, 500)]); } catch (e) {}
}
const lotKey_ = (ma, lo) => ma + '\u0001' + lo;
/** Bản ghi QC mới nhất của từng lô. */
function qcMap_() {
  const Q = {};
  if (!sheet_(SH.QC)) return Q;
  rows_(SH.QC).forEach(r => {
    const ma = str_(r[0]); if (!ma) return;
    Q[lotKey_(ma, str_(r[1]))] = { tt: str_(r[2]), ngay: str_(r[3]), nguoi: str_(r[4]), ghiChu: str_(r[5]), hsdMoi: str_(r[6]) };
  });
  return Q;
}
/** Tỷ trọng mới nhất của từng lô (g/ml = kg/L). */
function ttMap_() {
  const T = {};
  if (!sheet_(SH.TT)) return T;
  rows_(SH.TT).forEach(r => { const ma = str_(r[0]); if (ma) T[lotKey_(ma, str_(r[1]))] = num_(r[2]); });
  return T;
}
const needQC_ = (it, cfg) => !!it && it.theoLo && cfg.nhomQC.indexOf(it.nhom) >= 0;
/** Chặn xuất lô chưa QC đạt hoặc đã hết hạn. */
function checkLotOut_(it, lo, L, ngay) {
  const x = L[it.ma] && L[it.ma][lo];
  if (!x) return;
  const ten = it.ma + ' lô ' + (lo || '(chưa có lô)');
  if (x.qc && x.qc !== 'Đạt') throw new Error(ten + ' đang "' + x.qc + '" — QC chưa duyệt, không xuất được.');
  if (x.hsd && x.hsd < ngay) throw new Error(ten + ' đã hết hạn (HSD ' + x.hsd.split('-').reverse().join('/') + '). Cần QC kiểm lại và gia hạn trước khi xuất.');
}

function items_() {
  return rows_(SH.VT).filter(r => str_(r[0])).map(r => ({
    ma: str_(r[0]), ten: str_(r[1]), nhom: str_(r[2]) || 'Khác', donVi: str_(r[3]) || 'kg',
    heSo: num_(r[4]) || 1, dauKy: num_(r[5]), toiThieu: num_(r[6]),
    theoLo: str_(r[7]) === 'Có', hanThang: num_(r[8]), chuHang: str_(r[9]), hamLuong: str_(r[10]), kho: str_(r[11])
  }));
}

function moves_() {
  return rows_(SH.PH).filter(r => str_(r[0])).map(r => ({
    id: str_(r[0]), lap: r[1] instanceof Date ? Utilities.formatDate(r[1], tz_(), 'dd/MM/yyyy HH:mm') : str_(r[1]),
    ngay: str_(r[2]), loai: str_(r[3]), ma: str_(r[4]), soLuong: num_(r[5]), donVi: str_(r[6]),
    kg: num_(r[7]), chungTu: str_(r[8]), ghiChu: str_(r[9]), nguoiLap: str_(r[10]), trangThai: str_(r[11]), lenh: str_(r[12]),
    lo: str_(r[13]), nsx: str_(r[14]), hsd: str_(r[15]), ncc: str_(r[16])
  }));
}

function balances_(items, moves) {
  const b = {};
  items.forEach(i => b[i.ma] = { dauKy: i.dauKy, nhap: 0, xuat: 0, kk: 0 });
  moves.forEach(m => {
    if (m.trangThai || !b[m.ma]) return;
    if (m.loai === 'Nhập') b[m.ma].nhap += m.kg;
    else if (m.loai === 'Xuất') b[m.ma].xuat += m.kg;
    else b[m.ma].kk += m.kg;
  });
  const kt = khongTon_();
  Object.keys(b).forEach(k => { const x = b[k]; x.ton = x.dauKy + x.nhap - x.xuat + x.kk; if (kt[k]) { x.ton = 0; x.kt = true; } });
  return b;
}

/** Mã không theo dõi tồn (VD nước): vẫn ghi xuất cho lệnh SX để biết lượng dùng, nhưng tồn luôn 0, không cảnh báo âm kho. Khai ở CaiDat "Mã không theo dõi tồn". */
let KT_CACHE_ = null;
function khongTon_() {
  if (KT_CACHE_) return KT_CACHE_;
  const raw = cdRows_().find(x => str_(x[0]) === 'Mã không theo dõi tồn');
  const o = {}; (raw ? str_(raw[1]) : 'NL.NUOC').split(',').map(x => x.trim()).filter(String).forEach(m => o[m] = 1);
  return (KT_CACHE_ = o);
}
/** Tồn theo lô cho các mã theo dõi lô: { ma: { lo: {lo, nsx, hsd, ton} } } */
function lots_(items, moves, cfg, Q) {
  cfg = cfg || settings_(); Q = Q || qcMap_();
  const L = {}, need = {}, T = ttMap_(), IM = {};
  items.forEach(i => { IM[i.ma] = i; });
  items.forEach(i => { if (needQC_(i, cfg)) need[i.ma] = 1; });
  items.forEach(i => {
    if (!i.theoLo) return;
    L[i.ma] = {};
    if (i.dauKy) L[i.ma][''] = { lo: '', nsx: '', hsd: '', ton: i.dauKy };
  });
  moves.forEach(m => {
    if (m.trangThai || !L[m.ma]) return;
    const x = L[m.ma][m.lo] = L[m.ma][m.lo] || { lo: m.lo, nsx: '', hsd: '', ton: 0 };
    if (m.loai === 'Nhập') { x.ton += m.kg; if (m.nsx) x.nsx = m.nsx; else if (m.lenh && !x.nsx) x.nsx = m.ngay; if (m.hsd) x.hsd = m.hsd; }
    else if (m.loai === 'Xuất') x.ton -= m.kg;
    else x.ton += m.kg;
  });
  Object.keys(L).forEach(ma => Object.values(L[ma]).forEach(x => {
    const q = Q[lotKey_(ma, x.lo)];
    if (q && q.hsdMoi) { x.hsdGoc = x.hsd; x.hsd = q.hsdMoi; }
    x.qc = need[ma] ? (q ? q.tt : 'Đạt') : '';
    if (q) { x.qcNgay = q.ngay; x.qcNguoi = q.nguoi; x.qcGhiChu = q.ghiChu; }
    x.tyTrong = T[lotKey_(ma, x.lo)] || 0;
    if (!x.hsd && x.nsx && IM[ma]) x.hsd = addMonths_(x.nsx, hanOf_(IM[ma]));
  }));
  return L;
}

/* ===== Cảnh báo trước khi xuất: vượt tồn, chưa xuất lô hết hạn trước (FEFO). Người dùng phải bấm xác nhận mới lưu. ===== */
function outGuard_(a) { return { xn: !!(a && a.xn), msg: {}, used: {} }; }
function outWarn_(g, it, lo, kg, L, bal, ngay, noAcc) {
  if (!(kg > 0) || khongTon_()[it.ma]) return; if (it.nhom === 'Bao bì' && str_(settings_raw_('Cảnh báo âm kho bao bì')) !== 'Có') return;
  const f = v => (Math.round(v * 100) / 100).toLocaleString('vi-VN'), dmy = s => String(s || '').split('-').reverse().join('/');
  const k = it.ma + '\u0001' + (it.theoLo ? lo : '');
  const used = noAcc ? kg : (g.used[k] = (g.used[k] || 0) + kg);
  const ten = it.ma + (it.theoLo ? ' lô ' + (lo || '(chưa có lô)') : '');
  if (it.theoLo) {
    const x = (L[it.ma] || {})[lo];
    const ton = x ? x.ton : 0;
    if (used > ton + 1e-6) g.msg['v' + k] = ten + ': xuất ' + f(used) + ' kg nhưng sổ chỉ còn ' + f(Math.max(ton, 0)) + ' kg → lô sẽ âm ' + f(used - Math.max(ton, 0)) + ' kg.';
    if (x && x.hsd) {
      const o = Object.values(L[it.ma] || {}).filter(y => y.lo !== lo && y.ton > 1e-6 && y.hsd && y.hsd >= ngay && y.hsd < x.hsd && (!y.qc || y.qc === 'Đạt'))
        .sort((p, q) => p.hsd.localeCompare(q.hsd))[0];
      if (o) g.msg['f' + k] = ten + ' (HSD ' + dmy(x.hsd) + '): còn lô ' + (o.lo || '(chưa có lô)') + ' hết hạn sớm hơn (HSD ' + dmy(o.hsd) + ', tồn ' + f(o.ton) + ' kg), nên xuất lô đó trước.';
    }
  } else {
    const ton = bal[it.ma] ? bal[it.ma].ton : 0;
    if (used > ton + 1e-6) g.msg['v' + k] = ten + ': xuất ' + f(used) + ' kg nhưng sổ chỉ còn ' + f(Math.max(ton, 0)) + ' kg → sẽ âm ' + f(used - Math.max(ton, 0)) + ' kg.';
  }
}
function outList_(g) { return Object.keys(g.msg).sort().map(k => g.msg[k]); }
function outConfirm_(g, me, what) {
  const list = outList_(g); if (!list.length) return;
  if (!g.xn) throw new Error('CẦN XÁC NHẬN|' + JSON.stringify(list));
  log_(me, 'Xuất dù có cảnh báo', what, list.join(' | ').slice(0, 900));
}

function addMonths_(ymd, n) {
  const p = ymd.split('-').map(Number), d = new Date(Date.UTC(p[0], p[1] - 1 + n, p[2]));
  if (d.getUTCDate() !== p[2]) d.setUTCDate(0);
  return d.toISOString().slice(0, 10);
}
/** Hạn dùng (tháng) tính từ NSX: phân bón 3 năm, còn lại 2 năm. */
const hanOf_ = it => (it.nhom === 'Phân bón' || /^BTP PB /i.test(it.ten || '')) ? 36 : 24;
const isYmd_ = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '');

/** Chuẩn hoá thông tin lô cho một dòng phiếu; trả [lo, nsx, hsd]. */
function lotInfo_(it, loai, p, L, ngayMacDinh) {
  if (!it.theoLo) return ['', '', ''];
  const lo = String(p.lo || '').trim();
  if (loai === 'Nhập') {
    if (!lo) throw new Error('Nhập số lô cho ' + it.ma + '.');
    const nsx = isYmd_(p.nsx) ? p.nsx : ngayMacDinh;
    const cur = L[it.ma] && L[it.ma][lo];
    if (cur && cur.hsd) return [lo, cur.nsx || nsx, cur.hsd]; // lô đã có: giữ NSX, HSD cũ
    return [lo, nsx, addMonths_(nsx, hanOf_(it))];
  }
  const x = L[it.ma] && L[it.ma][lo];
  if (!x) throw new Error('Chọn lô cho ' + it.ma + '.');
  return [lo, x.nsx, x.hsd];
}

/* ================= HÀM GỌI TỪ GIAO DIỆN ================= */
function getUserNames() {
  ensureSheets_();
  return rows_(SH.ND).map(r => str_(r[0])).filter(String);
}

/** Đăng nhập 1 lần: máy lưu mã thẻ (không lưu PIN). Đổi tên hoặc PIN trong trang NguoiDung là mã thẻ cũ hết hiệu lực. */
function authKey_() { const p = PropertiesService.getScriptProperties(); let k = p.getProperty('AUTH_KEY'); if (!k) { k = Utilities.getUuid() + Utilities.getUuid(); p.setProperty('AUTH_KEY', k); } return k; }
function tok_(ten, pin) { return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, ten + '|' + pin + '|' + authKey_(), Utilities.Charset.UTF_8)); }
function login(a) { ensureSheets_(); const me = auth_(a); const u = ndRows_().find(r => str_(r[0]) === me.ten); return Object.assign({}, me, { tk: tok_(me.ten, str_(u[1])) }); }

function getData(a) {
RC_ = {};
  const me = auth_(a);
  const items = items_(), moves = moves_();
  const lenh = orders_().sort((x, y) => (x.trangThai === 'Đang SX' ? 0 : 1) - (y.trangThai === 'Đang SX' ? 0 : 1) || (y.ngay + y.so).localeCompare(x.ngay + x.so)).slice(0, 300);
  const cfg = settings_(), L = lots_(items, moves, cfg), lots = {};
  const HSL = hsLoaiMap_(), HLX = hlMap_(), IMx = {}; items.forEach(i => IMx[i.ma] = i);
  Object.keys(L).forEach(ma => {
    const btp = (IMx[ma] || {}).nhom === 'Bán thành phẩm';
    lots[ma] = Object.values(L[ma]).filter(x => Math.abs(x.ton) > 1e-6)
      .map(x => { const k = lotKey_(ma, x.lo), hs = HSL[k] || {}, bh = btp && needHoaLy_(x.lo); return { lo: x.lo, nsx: x.nsx, hsd: x.hsd, hsdGoc: x.hsdGoc || '', ton: Math.round(x.ton * 10000) / 10000,
        qc: x.qc, qcNgay: x.qcNgay || '', qcNguoi: x.qcNguoi || '', qcGhiChu: x.qcGhiChu || '', tyTrong: x.tyTrong || 0,
        hoaLy: bh ? !!(hs['Phiếu kiểm hoá lý'] || hs['Phiếu test hoá lý']) : undefined, hamLuong: bh ? !!hs['Phiếu kết quả hàm lượng'] : undefined, hlXn: bh ? (HLX[k] || '') : undefined }; })
      .sort((p, q) => (p.hsd || '9999').localeCompare(q.hsd || '9999') || p.lo.localeCompare(q.lo));
  });
  const bal = balances_(items, moves);
  if (!me.ct) {
    const vis = items, b = {}, l = {};
    vis.forEach(i => { b[i.ma] = bal[i.ma]; if (lots[i.ma]) l[i.ma] = lots[i.ma]; });
    return { me, items: vis, bal: b, lots: l, nhom: NHOM.filter(n => !me.nhom.length || me.nhom.indexOf(n) >= 0), nhomQC: cfg.nhomQC, hetHan: cfg.hetHan, congThuc: {},
      lenh: lenh.map(o => ({ so: o.so, tenSP: (items.find(i => i.ma === o.maSP) || {}).ten || '', ngay: o.ngay, maSP: o.maSP, slDuKien: o.slDuKien, trangThai: o.trangThai, ngayHT: o.ngayHT, slThucTe: o.slThucTe, nguoiLap: o.nguoiLap, nguoiHT: o.nguoiHT, ghiChu: o.ghiChu, khachHang: o.khachHang, nguoiSX: o.nguoiSX, qcSX: o.qcSX, tyTrong: o.tyTrong })),
      khoaSo: lockMonth_(), chuHang: CHU_HANG, hoSo: hoSoCount_(), ncc: nccList_(moves), nccMa: nccMa_(moves), goiY: lxGoiY_(lenh), qpCho: qpCho_(items, moves), diaChi: str_(settings_raw_('Địa chỉ công ty')), moi: moiNhap_(moves, me, items), today: Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd') };
  }
  return { me, items, bal, lots, nhom: NHOM, nhomQC: cfg.nhomQC, hetHan: cfg.hetHan, congThuc: recipes_(), lenh, khoaSo: lockMonth_(), chuHang: CHU_HANG, hoSo: hoSoCount_(), ncc: nccList_(moves), nccMa: nccMa_(moves), goiY: lxGoiY_(lenh), qpCho: qpCho_(items, moves), diaChi: str_(settings_raw_('Địa chỉ công ty')), moi: moiNhap_(moves, me, items), today: Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd') };
}

/** Phiếu nhập 14 ngày gần nhất (Trang chủ: Hàng mới nhập; Tồn kho: đưa mã mới nhập lên đầu). */
function moiNhap_(moves, me, items) {
  const set = {}; items.forEach(i => set[i.ma] = 1);
  let AN = {}; try { AN = anMap_(); } catch (e) {}
  const from = Utilities.formatDate(new Date(Date.now() - 14 * 864e5), tz_(), 'yyyy-MM-dd');
  return moves.filter(m => m.loai === 'Nhập' && !m.trangThai && m.ngay >= from && set[m.ma] && (me.ct || !m.lenh))
    .sort((x, y) => (y.ngay + y.id).localeCompare(x.ngay + x.id)).slice(0, 300)
    .map(m => ({ id: m.id, ngay: m.ngay, ma: m.ma, lo: m.lo, kg: m.kg, soLuong: m.soLuong, donVi: m.donVi, ncc: m.ncc, nguoiLap: m.nguoiLap, lenh: m.lenh, chungTu: m.chungTu, anh: (AN[String(m.id)] || []).length }));
}

function getHistory(a, thang, ma) {
  const me = auth_(a);
  const vis = {}; if (!me.ct) items_().forEach(i => { if (seeItem_(me, i)) vis[i.ma] = 1; });
  return moves_()
    .filter(m => me.ct || (vis[m.ma] && !m.lenh))
    .filter(m => (!thang || m.ngay.indexOf(thang) === 0) && (!ma || m.ma === ma))
    .sort((x, y) => (y.ngay + y.id).localeCompare(x.ngay + x.id))
    .slice(0, 500);
}

/** Thẻ kho 1 mã: lịch sử nhập / xuất / kiểm kê, tồn sau mỗi phiếu, hồ sơ lô (COA, phiếu kiểm). */
function getItemLog(a, ma) {
  const me = auth_(a), it = items_().find(i => i.ma === ma);
  if (!it) throw new Error('Không có mã vật tư ' + ma);
  let ton = it.dauKy;
  const rows = moves_().filter(m => m.ma === ma).sort((x, y) => (x.ngay + x.id).localeCompare(y.ngay + y.id)).map(m => {
    if (!m.trangThai) ton += m.loai === 'Xuất' ? -m.kg : m.kg;
    return Object.assign(m, { tonSau: ton });
  });
  const hs = {};
  if (sheet_(SH.HS)) rows_(SH.HS).forEach(r => { if (str_(r[0]) !== ma) return; const lo = str_(r[1]); (hs[lo] = hs[lo] || []).push({ loai: str_(r[2]), ten: str_(r[3]), link: str_(r[4]) }); });
  return { dauKy: it.dauKy, an: me.ct ? 0 : rows.filter(m => m.lenh && m.loai === 'Xuất').length, rows: rows.filter(m => me.ct || !(m.lenh && m.loai === 'Xuất')).reverse().slice(0, 500), hs };
}

/* ===== QC DUYỆT THEO PHIẾU NHẬP (dung môi, phụ gia – không theo lô) + ẢNH HÀNG / MARKING KHI NHẬP KHO ===== */
const QP_SH = 'QCPhieu', AN_SH = 'AnhNhap';
function shX_(name, head) {
  const ss = SpreadsheetApp.getActiveSpreadsheet(); let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#e3efe6'); sh.setFrozenRows(1); sh.getRange(1, 1, sh.getMaxRows(), 3).setNumberFormat('@'); }
  return sh;
}
function qpNhom_() { return (str_(settings_raw_('Nhóm duyệt QC theo phiếu nhập')) || 'Phụ gia / dung môi').split(',').map(x => x.trim()).filter(String); }
function qpTu_() { return str_(settings_raw_('Duyệt QC phiếu nhập từ ngày')) || '2026-10-19'; }
const qpCan_ = (it, nh, m, tu) => !!it && !it.theoLo && nh.indexOf(it.nhom) >= 0 && m.loai === 'Nhập' && !m.lenh && !m.trangThai && m.ngay >= tu;
function qpMap_() { const o = {}; if (!sheet_(QP_SH)) return o; rows_(QP_SH).forEach(r => { const id = str_(r[0]); if (id) o[id] = { tt: str_(r[2]), ngay: str_(r[3]), nguoi: str_(r[4]), ghiChu: str_(r[5]) }; }); return o; }
function anMap_() { const o = {}; if (!sheet_(AN_SH)) return o; rows_(AN_SH).forEach(r => { const id = str_(r[0]); if (id) (o[id] = o[id] || []).push({ ma: str_(r[1]), lo: str_(r[2]), ten: str_(r[3]), fid: str_(r[5]), nguoi: str_(r[6]) }); }); return o; }
function qpCho_(items, moves) {
  const IM = {}, nh = qpNhom_(), tu = qpTu_(), Q = qpMap_(); items.forEach(i => IM[i.ma] = i);
  return moves.filter(m => qpCan_(IM[m.ma], nh, m, tu) && !(Q[m.id] && Q[m.id].tt && Q[m.id].tt !== 'Chờ duyệt')).length;
}
function getQCPhieu(a) {
  auth_(a);
  const items = items_(), IM = {}, nh = qpNhom_(), tu = qpTu_(), Q = qpMap_(), A = anMap_(); items.forEach(i => IM[i.ma] = i);
  const lim = Utilities.formatDate(new Date(Date.now() - 120 * 864e5), tz_(), 'yyyy-MM-dd');
  return { nhom: nh, tu: tu, list: moves_().filter(m => m.loai === 'Nhập' && !m.trangThai && !m.lenh && m.ngay >= lim && (qpCan_(IM[m.ma], nh, m, tu) || A[m.id]))
    .sort((x, y) => (y.ngay + y.id).localeCompare(x.ngay + x.id)).slice(0, 300)
    .map(m => ({ id: m.id, ngay: m.ngay, ma: m.ma, ten: (IM[m.ma] || {}).ten || '', nhom: (IM[m.ma] || {}).nhom || '', kg: m.kg, lo: m.lo, ncc: m.ncc, chungTu: m.chungTu, ghiChu: m.ghiChu, nguoiLap: m.nguoiLap,
      can: qpCan_(IM[m.ma], nh, m, tu), qc: Q[m.id] || null, anh: (A[m.id] || []).map(x => ({ fid: x.fid, ten: x.ten, nguoi: x.nguoi })) })) };
}
function setQCPhieu(a, id, tt, ghiChu) {
  const me = auth_(a);
  if (!me.qc) throw new Error('Tài khoản ' + me.ten + ' chưa có quyền QC.');
  if (['Đạt', 'Không đạt', 'Chờ duyệt'].indexOf(tt) < 0) throw new Error('Kết quả không hợp lệ.');
  const m = moves_().find(x => x.id === String(id));
  if (!m || m.loai !== 'Nhập') throw new Error('Không tìm thấy phiếu nhập.');
  if (tt === 'Không đạt' && !String(ghiChu || '').trim()) throw new Error('Ghi lý do không đạt.');
  const today = Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd');
  shX_(QP_SH, ['ID phiếu nhập', 'Mã', 'Kết quả', 'Ngày', 'Người', 'Ghi chú', 'Thời điểm']).appendRow([m.id, m.ma, tt, today, me.ten, String(ghiChu || '').slice(0, 300), new Date()]);
  log_(me, 'QC phiếu nhập', m.ma + ' · ' + m.kg + ' kg · ngày ' + m.ngay, tt + (ghiChu ? ' · ' + ghiChu : ''));
  return true;
}
function anhFolder_() {
  const k = 'Thư mục ảnh nhập kho (Drive)', id = str_(settings_raw_(k));
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const f = DriveApp.createFolder('Sổ Kho – Ảnh nhập kho (marking, nhãn bao)');
  CD_C = null; const sh = sheet_(SH.CD), rows = rows_(SH.CD), i = rows.findIndex(r => str_(r[0]) === k);
  if (i >= 0) sh.getRange(i + 2, 2).setValue(f.getId()); else sh.appendRow([k, f.getId(), 'Thư mục Drive lưu ảnh hàng / marking chụp khi nhập kho']);
  return f;
}
function uploadAnhNhap(a, id, name, mime, b64) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]);
  if (!/^image\/(jpeg|png|webp)$/.test(String(mime || ''))) throw new Error('Chỉ nhận ảnh (JPG, PNG).');
  const m = moves_().find(x => x.id === String(id));
  if (!m || m.loai !== 'Nhập') throw new Error('Không tìm thấy phiếu nhập.');
  const bytes = Utilities.base64Decode(String(b64 || ''));
  if (bytes.length > 8 * 1024 * 1024) throw new Error('Ảnh lớn quá 8 MB.');
  const fname = ['Anh', m.ma, m.lo || m.ngay, Utilities.formatDate(new Date(), tz_(), 'yyyyMMdd-HHmmss')].join('_').replace(/[\\/:*?"<>|]/g, '-') + (mime === 'image/png' ? '.png' : '.jpg');
  const file = anhFolder_().createFile(Utilities.newBlob(bytes, mime, fname));
  shX_(AN_SH, ['ID phiếu nhập', 'Mã', 'Số lô', 'Tên file', 'Link', 'File ID', 'Người', 'Thời điểm']).appendRow([m.id, m.ma, m.lo, fname, file.getUrl(), file.getId(), me.ten, new Date()]);
  log_(me, 'Ảnh nhập kho', m.ma + (m.lo ? ' lô ' + m.lo : '') + ' · ngày ' + m.ngay, fname);
  return (anMap_()[m.id] || []).length;
}
/** Trả ảnh (base64) để hiện trong app: ai đăng nhập cũng xem được, không cần quyền Drive. */
function getAnh(a, fid) {
  auth_(a);
  if (!sheet_(AN_SH) || !rows_(AN_SH).some(r => str_(r[5]) === String(fid))) throw new Error('Không tìm thấy ảnh.');
  const b = DriveApp.getFileById(String(fid)).getBlob();
  return { mime: b.getContentType(), b64: Utilities.base64Encode(b.getBytes()) };
}
function getAnhLo(a, ma, lo) {
  auth_(a);
  if (!sheet_(AN_SH)) return [];
  return rows_(AN_SH).filter(r => str_(r[1]) === ma && str_(r[2]) === String(lo || '')).map(r => ({ fid: str_(r[5]), ten: str_(r[3]), nguoi: str_(r[6]) }));
}

/* ===== CHUYỂN KHO GIỮA CHỦ HÀNG: cùng hoạt chất, khác chủ sở hữu (VD Hitaka → Asata). Xuất mã đi + nhập mã nhận, giữ lô, NSX, HSD, QC, tỷ trọng, hồ sơ lô. ===== */
function transferStock(a, d) {
  const me = auth_(a, [ROLES.QL, ROLES.KT]);
  if (!isYmd_(d.ngay)) throw new Error('Ngày không hợp lệ.');
  const kg = Math.round(num_(d.kg) * 10000) / 10000;
  if (!(kg > 0)) throw new Error('Số kg chuyển phải lớn hơn 0.');
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    checkLock_(d.ngay);
    const items = items_(), A = items.find(i => i.ma === d.maFrom), B = items.find(i => i.ma === d.maTo);
    if (!A || !B) throw new Error('Chọn mã chuyển đi và mã nhận.');
    if (A.ma === B.ma) throw new Error('Mã nhận phải khác mã chuyển đi.');
    if (A.nhom !== B.nhom) throw new Error('Chỉ chuyển giữa hai mã cùng nhóm (' + A.nhom + ' / ' + B.nhom + ').');
    const cfg = settings_(), mv = moves_(), Q = qcMap_(), L = lots_(items, mv, cfg, Q);
    const lo = A.theoLo ? String(d.lo == null ? '' : d.lo) : '';
    const x = A.theoLo ? (L[A.ma] || {})[lo] : null;
    if (A.theoLo && !x) throw new Error('Chọn lô của ' + A.ma + '.');
    const loB = B.theoLo ? (String(d.loMoi || '').trim() || lo) : '';
    const xb = B.theoLo ? (L[B.ma] || {})[loB] : null;
    let nsx = '', hsd = '';
    if (B.theoLo) {
      if (xb && xb.hsd) { nsx = xb.nsx; hsd = xb.hsd; }
      else { nsx = (x && x.nsx) || ''; hsd = (x && x.hsd) || (nsx ? addMonths_(nsx, hanOf_(B)) : ''); }
    }
    const g = outGuard_(a); outWarn_(g, A, lo, kg, L, balances_(items, mv), d.ngay, true);
    outConfirm_(g, me, 'Chuyển kho ' + A.ma + ' → ' + B.ma + ' ' + kg + ' kg');
    const pre = 'CK-' + d.ngay.slice(2, 4) + d.ngay.slice(5, 7) + '-';
    const so = pre + ('00' + (new Set(mv.filter(m => m.chungTu.indexOf(pre) === 0).map(m => m.chungTu)).size + 1)).slice(-3);
    const ts = Utilities.formatDate(new Date(), tz_(), 'yyMMddHHmmss'), chu = i => i.chuHang || 'Asata', note = String(d.ghiChu || '').trim().slice(0, 120);
    const ph = sheet_(SH.PH); nccHead_();
    ph.appendRow([ts + 'CK1', new Date(), d.ngay, 'Xuất', A.ma, Math.round(kg / (A.heSo || 1) * 10000) / 10000, A.donVi, kg, so,
      ('Chuyển kho → ' + B.ma + ' (' + chu(B) + ')' + (note ? ' · ' + note : '')).slice(0, 200), me.ten, '', '', lo, x ? x.nsx : '', x ? x.hsd : '', '']);
    ph.appendRow([ts + 'CK2', new Date(), d.ngay, 'Nhập', B.ma, Math.round(kg / (B.heSo || 1) * 10000) / 10000, B.donVi, kg, so,
      ('Chuyển kho ← ' + A.ma + ' (' + chu(A) + ')' + (note ? ' · ' + note : '')).slice(0, 200), me.ten, '', '', loB, nsx, hsd, 'Chuyển kho từ ' + chu(A)]);
    if (B.theoLo) {
      const qa = Q[lotKey_(A.ma, lo)], hasB = !!Q[lotKey_(B.ma, loB)];
      if (needQC_(B, cfg) && !hasB) {
        const tt = A.theoLo && x.qc ? x.qc : (qa ? qa.tt : 'Chờ kiểm');
        sheet_(SH.QC).appendRow([B.ma, loB, tt, d.ngay, me.ten, 'Theo QC lô ' + (lo || '(chưa có lô)') + ' của ' + A.ma + ' (chuyển kho ' + so + ')', qa && qa.hsdMoi ? qa.hsdMoi : '', new Date()]);
      }
      if (x && x.tyTrong && !(xb && xb.tyTrong)) sheet_(SH.TT).appendRow([B.ma, loB, x.tyTrong, d.ngay, me.ten, new Date()]);
      HS_C = null; if (sheet_(SH.HS) && A.theoLo) {
        const da = {}; rows_(SH.HS).forEach(r => { if (str_(r[0]) === B.ma && str_(r[1]) === loB) da[str_(r[4])] = 1; });
        rows_(SH.HS).filter(r => str_(r[0]) === A.ma && str_(r[1]) === lo && !da[str_(r[4])]).forEach(r => { const c = r.slice(); c[0] = B.ma; c[1] = loB; sheet_(SH.HS).appendRow(c); });
      }
    }
    log_(me, 'Chuyển kho', so, A.ma + (lo ? ' lô ' + lo : '') + ' (' + chu(A) + ') → ' + B.ma + (loB ? ' lô ' + loB : '') + ' (' + chu(B) + ') · ' + kg + ' kg' + (note ? ' · ' + note : ''));
    return { so };
  } finally { lock.releaseLock(); }
}

/** Cột Q của trang Phieu: tên nhà cung cấp (phiếu nhập mua). */
function nccHead_() { const ph = sheet_(SH.PH); if (!str_(ph.getRange(1, 17).getValue())) ph.getRange(1, 17).setValue('Nhà cung cấp').setFontWeight('bold'); }
function nccList_(moves) {
  const c = {}; moves.forEach(m => { if (m.ncc && m.loai === 'Nhập' && !m.trangThai) c[m.ncc] = (c[m.ncc] || 0) + 1; });
  return Object.keys(c).sort((p, q) => c[q] - c[p] || p.localeCompare(q)).slice(0, 300);
}
function nccMa_(moves) { const o = {}; moves.forEach(m => { if (m.ncc && m.loai === 'Nhập' && !m.trangThai && (!o[m.ma] || m.ngay >= o[m.ma].d)) o[m.ma] = { d: m.ngay, n: m.ncc }; }); const r = {}; Object.keys(o).forEach(k => r[k] = o[k].n); return r; }
function saveMove(a, p) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]);
  if (LOAI.indexOf(p.loai) < 0) throw new Error('Loại phiếu không hợp lệ.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.ngay || '')) throw new Error('Ngày không hợp lệ.');
  const sl = num_(p.soLuong);
  if (sl < 0 || (p.loai !== 'Kiểm kê' && sl <= 0)) throw new Error('Số lượng phải lớn hơn 0.');
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const items = items_(), it = items.find(i => i.ma === p.ma);
    if (!it) throw new Error('Không tìm thấy mã vật tư ' + p.ma);
    needScope_(me, it);
    checkLock_(p.ngay);
    const cfg = settings_(), mv = moves_(), L = lots_(items, mv, cfg);
    const lot = lotInfo_(it, p.loai, p, L, p.ngay);
    if (p.loai === 'Xuất' && it.theoLo) checkLotOut_(it, lot[0], L, p.ngay);
    let kg, donVi = it.donVi;
    if (p.loai === 'Kiểm kê') {
      const ton = it.theoLo ? L[it.ma][lot[0]].ton : balances_(items, mv)[it.ma].ton;
      kg = Math.round((sl - ton) * 10000) / 10000;
      donVi = 'kg';
      if (Math.abs(kg) < 1e-9) throw new Error('Tồn thực tế khớp sổ, không cần điều chỉnh.');
    } else kg = Math.round(sl * it.heSo * 10000) / 10000;
    if (p.loai === 'Xuất') { const g = outGuard_(a); outWarn_(g, it, lot[0], kg, L, balances_(items, mv), p.ngay); outConfirm_(g, me, it.ma + ' ' + kg + ' kg' + (p.chungTu ? ' · ' + p.chungTu : '')); }
    const id = Utilities.formatDate(new Date(), tz_(), 'yyMMddHHmmss') + Math.floor(Math.random() * 900 + 100);
    const ncc = p.loai === 'Nhập' ? String(p.ncc || '').trim().slice(0, 100) : '';
    if (ncc) nccHead_();
    sheet_(SH.PH).appendRow([id, new Date(), p.ngay, p.loai, it.ma, sl, donVi, kg,
      String(p.chungTu || '').slice(0, 100), String(p.ghiChu || '').slice(0, 200), me.ten, '', ''].concat(lot).concat([ncc]));
    let cho = false;
    if (p.loai === 'Nhập' && needQC_(it, cfg) && !(L[it.ma] && L[it.ma][lot[0]])) {
      sheet_(SH.QC).appendRow([it.ma, lot[0], 'Chờ kiểm', p.ngay, me.ten, 'Tự tạo khi nhập kho', '', new Date()]);
      cho = true;
    }
    return { id, kg, loai: p.loai, choKiem: cho };
  } finally { lock.releaseLock(); }
}

function deleteMove(a, id) {
  const me = auth_(a, [ROLES.QL, ROLES.KT]);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = sheet_(SH.PH), ids = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 1).getValues();
    const i = ids.findIndex(r => str_(r[0]) === id);
    if (i < 0) throw new Error('Không tìm thấy phiếu.');
    checkLock_(str_(sh.getRange(i + 2, 3).getValue()));
    sh.getRange(i + 2, 12).setValue('Đã xoá bởi ' + me.ten + ' lúc ' + Utilities.formatDate(new Date(), tz_(), 'dd/MM/yyyy HH:mm'));
    const r = sh.getRange(i + 2, 1, 1, 14).getValues()[0];
    log_(me, 'Xoá phiếu', id, [str_(r[3]), str_(r[4]), num_(r[5]) + ' ' + str_(r[6]), 'ngày ' + str_(r[2]), r[13] ? 'lô ' + str_(r[13]) : '', r[8] ? 'CT ' + str_(r[8]) : '', 'người lập ' + str_(r[10])].filter(String).join(' · '));
    return true;
  } finally { lock.releaseLock(); }
}

/** Sửa phiếu nhập (không phải phiếu từ lệnh SX): ngày, số lượng, lô, NSX, NCC, chứng từ, ghi chú. Quản lý, Kế toán hoặc chính người lập. */
function updateKK_(a, me, sh, row, m, mv, d) {
  if ([ROLES.QL, ROLES.KT].indexOf(me.vaiTro) < 0 && m.nguoiLap !== me.ten) throw new Error('Chỉ Quản lý, Kế toán hoặc người lập phiếu (' + m.nguoiLap + ') mới sửa được.');
  const items = items_(), it = items.find(x => x.ma === m.ma);
  if (!it) throw new Error('Không tìm thấy mã vật tư ' + m.ma);
  needScope_(me, it);
  checkLock_(m.ngay);
  const sl = d.soLuong === undefined || d.soLuong === '' ? m.soLuong : num_(d.soLuong);
  if (!(sl >= 0)) throw new Error('Số lượng thực tế không hợp lệ.');
  // tồn sổ lúc kiểm giữ nguyên, chênh lệch đổi đúng bằng phần sửa số thực tế
  const kg = Math.round((m.kg + (sl - m.soLuong)) * 10000) / 10000;
  if (Math.abs(kg) < 1e-9) throw new Error('Sau khi sửa, thực tế khớp sổ (chênh lệch 0). Nếu đúng vậy thì xoá phiếu kiểm kê này ở tab Lịch sử.');
  const cfg = settings_(), others = mv.filter(x => x.id !== m.id);
  const L = lots_(items, others, cfg, qcMap_()), B = balances_(items, others), g = outGuard_(a), f = v => (Math.round(v * 100) / 100).toLocaleString('vi-VN');
  if (it.theoLo) { const x = (L[it.ma] || {})[m.lo]; const t = (x ? x.ton : 0) + kg; if (t < -1e-6) g.msg.a = it.ma + ' lô ' + m.lo + ': sau khi sửa, lô sẽ âm ' + f(-t) + ' kg.'; }
  else { const t = (B[it.ma] ? B[it.ma].ton : 0) + kg; if (t < -1e-6 && !khongTon_()[it.ma]) g.msg.a = it.ma + ': sau khi sửa, tồn sẽ âm ' + f(-t) + ' kg.'; }
  outConfirm_(g, me, 'Sửa phiếu kiểm kê ' + m.id);
  const ct = d.chungTu === undefined ? m.chungTu : String(d.chungTu || '').slice(0, 100), gc = d.ghiChu === undefined ? m.ghiChu : String(d.ghiChu || '').slice(0, 200);
  sh.getRange(row, 6, 1, 5).setValues([[sl, m.donVi || 'kg', kg, ct, gc]]);
  const doi = [['Thực tế', m.soLuong, sl], ['Chênh lệch', m.kg, kg], ['CT', m.chungTu, ct], ['Ghi chú', m.ghiChu, gc]]
    .filter(x => String(x[1]) !== String(x[2])).map(x => x[0] + ': ' + x[1] + ' → ' + x[2]);
  log_(me, 'Sửa phiếu kiểm kê', it.ma + (m.lo ? ' lô ' + m.lo : '') + ' · ' + m.id, doi.join(' · ') || 'không đổi');
  return true;
}
function updateMove(a, id, d) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = sheet_(SH.PH), ids = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 1).getValues();
    const i = ids.findIndex(r => str_(r[0]) === String(id));
    if (i < 0) throw new Error('Không tìm thấy phiếu.');
    const row = i + 2, mv = moves_(), m = mv.find(x => x.id === String(id));
    if (m.trangThai) throw new Error('Phiếu đã xoá.');
    if (m.loai === 'Kiểm kê' && !m.lenh) return updateKK_(a, me, sh, row, m, mv, d);
    if (m.loai !== 'Nhập' || m.lenh) throw new Error('Chỉ sửa được phiếu nhập vật tư và phiếu kiểm kê (phiếu của lệnh SX thì sửa ở lệnh).');
    if ([ROLES.QL, ROLES.KT].indexOf(me.vaiTro) < 0 && m.nguoiLap !== me.ten) throw new Error('Chỉ Quản lý, Kế toán hoặc người lập phiếu (' + m.nguoiLap + ') mới sửa được.');
    const items = items_(), it = items.find(x => x.ma === m.ma);
    needScope_(me, it);
    const ngay = isYmd_(d.ngay) ? d.ngay : m.ngay;
    checkLock_(m.ngay); checkLock_(ngay);
    const sl = d.soLuong === undefined || d.soLuong === '' ? m.soLuong : num_(d.soLuong);
    if (!(sl > 0)) throw new Error('Số lượng phải lớn hơn 0.');
    const kg = Math.round(sl * it.heSo * 10000) / 10000;
    let lo = m.lo, nsx = m.nsx, hsd = m.hsd;
    if (it.theoLo) {
      lo = String(d.lo == null ? m.lo : d.lo).trim(); if (!lo) throw new Error('Ghi số lô.');
      if (isYmd_(d.nsx) && d.nsx !== m.nsx) { nsx = d.nsx; hsd = addMonths_(nsx, hanOf_(it)); }
    }
    const cfg = settings_(), Q = qcMap_();
    // không để tồn (lô) âm vì sửa giảm / đổi lô
    const others = mv.filter(x => x.id !== m.id);
    const L = lots_(items, others, cfg, Q), B = balances_(items, others), g = outGuard_(a), f = v => (Math.round(v * 100) / 100).toLocaleString('vi-VN');
    if (it.theoLo) { const x = (L[it.ma] || {})[m.lo]; const conLai = (x ? x.ton : 0) + (lo === m.lo ? kg : 0); if (conLai < -1e-6) g.msg.a = it.ma + ' lô ' + m.lo + ': sau khi sửa, lô sẽ âm ' + f(-conLai) + ' kg (đã xuất nhiều hơn số nhập).'; }
    else { const t = (B[it.ma] ? B[it.ma].ton : 0) + kg; if (t < -1e-6 && !khongTon_()[it.ma]) g.msg.a = it.ma + ': sau khi sửa, tồn sẽ âm ' + f(-t) + ' kg.'; }
    outConfirm_(g, me, 'Sửa phiếu nhập ' + id);
    const ncc = d.ncc === undefined ? m.ncc : String(d.ncc || '').trim().slice(0, 100);
    const ct = d.chungTu === undefined ? m.chungTu : String(d.chungTu || '').slice(0, 100), gc = d.ghiChu === undefined ? m.ghiChu : String(d.ghiChu || '').slice(0, 200);
    sh.getRange(row, 3).setValue(ngay); sh.getRange(row, 6, 1, 5).setValues([[sl, it.donVi, kg, ct, gc]]);
    sh.getRange(row, 14, 1, 4).setValues([[lo, nsx, hsd, ncc]]);
    if (it.theoLo && lo !== m.lo) {
      const qOld = Q[lotKey_(it.ma, m.lo)];
      if (needQC_(it, cfg) && !Q[lotKey_(it.ma, lo)]) sheet_(SH.QC).appendRow([it.ma, lo, qOld ? qOld.tt : 'Chờ kiểm', ngay, me.ten, 'Đổi số lô phiếu nhập từ ' + m.lo, qOld ? qOld.hsdMoi : '', new Date()]);
      if (sheet_(AN_SH)) { const an = sheet_(AN_SH), v = rows_(AN_SH); v.forEach((r, k) => { if (str_(r[0]) === m.id) an.getRange(k + 2, 3).setValue(lo); }); }
    }
    const doi = [['Ngày', m.ngay, ngay], ['SL', m.soLuong, sl], ['Lô', m.lo, lo], ['NSX', m.nsx, nsx], ['NCC', m.ncc, ncc], ['CT', m.chungTu, ct], ['Ghi chú', m.ghiChu, gc]]
      .filter(x => String(x[1]) !== String(x[2])).map(x => x[0] + ': ' + x[1] + ' → ' + x[2]);
    log_(me, 'Sửa phiếu nhập', it.ma + ' · ' + id, doi.join(' · ') || 'không đổi');
    return true;
  } finally { lock.releaseLock(); }
}
function getAnhPhieu(a, id) { auth_(a); return (anMap_()[String(id)] || []).map(x => ({ fid: x.fid, ten: x.ten, nguoi: x.nguoi })); }

function saveItem(a, it, isNew) {
  const me = auth_(a, [ROLES.QL, ROLES.KT]);
  const ma = String(it.ma || '').trim(), ten = String(it.ten || '').trim(), dv = String(it.donVi || '').trim();
  const heSo = num_(it.heSo);
  if (!ma || !ten || !dv) throw new Error('Điền đủ mã, tên và đơn vị.');
  if (heSo <= 0) throw new Error('Hệ số quy đổi phải lớn hơn 0.');
  if (it.theoLo && num_(it.dauKy)) throw new Error('Hàng theo dõi lô: để tồn đầu kỳ = 0 và nhập tồn đầu bằng phiếu Nhập theo từng lô.');
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = sheet_(SH.VT), codes = rows_(SH.VT).map(r => str_(r[0]).toLowerCase());
    const idx = codes.indexOf(ma.toLowerCase());
    const chu = String(it.chuHang || '').trim() === 'Asata' ? '' : String(it.chuHang || '').trim().slice(0, 60);
    const row = [ma, ten, NHOM.indexOf(it.nhom) >= 0 ? it.nhom : 'Khác', dv, heSo, num_(it.dauKy), num_(it.toiThieu),
      it.theoLo ? 'Có' : '', num_(it.hanThang) || '', chu, String(it.hamLuong || '').trim().slice(0, 200), String(it.kho || '').trim().slice(0, 80)];
    if (!str_(sh.getRange(1, 12).getValue())) sh.getRange(1, 12).setValue('Kho').setFontWeight('bold');
    if (isNew) {
      if (idx >= 0) throw new Error('Mã ' + ma + ' đã tồn tại.');
      sh.appendRow(row);
      log_(me, 'Thêm vật tư', ma, ten);
    } else {
      if (idx < 0) throw new Error('Không tìm thấy mã ' + ma);
      const old = sh.getRange(idx + 2, 1, 1, row.length).getValues()[0];
      const H = ['Mã', 'Tên', 'Nhóm', 'Đơn vị', 'Hệ số', 'Tồn đầu kỳ', 'Tối thiểu', 'Theo lô', 'Hạn (tháng)', 'Chủ hàng', 'Hàm lượng', 'Kho'];
      if (lockEnd_() && String(old[5]) !== String(row[5])) throw new Error('Sổ đã khoá đến hết ' + lockMonth_() + ': không sửa tồn đầu kỳ được nữa. Dùng phiếu Kiểm kê để điều chỉnh.');
      const diff = row.map((v, k) => String(old[k]) === String(v) ? '' : H[k] + ': ' + str_(old[k]) + ' → ' + v).filter(String);
      sh.getRange(idx + 2, 1, 1, row.length).setValues([row]);
      if (diff.length) log_(me, 'Sửa vật tư', ma, diff.join(' · '));
    }
    return true;
  } finally { lock.releaseLock(); }
}

function deleteItem(a, ma) {
  const me = auth_(a, [ROLES.QL, ROLES.KT]);
  if (moves_().some(m => m.ma === ma && !m.trangThai)) throw new Error('Mã này còn phiếu. Xoá các phiếu trước.');
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const idx = rows_(SH.VT).findIndex(r => str_(r[0]) === ma);
    if (idx < 0) throw new Error('Không tìm thấy mã.');
    const r = rows_(SH.VT)[idx];
    sheet_(SH.VT).deleteRow(idx + 2);
    log_(me, 'Xoá vật tư', ma, str_(r[1]));
    return true;
  } finally { lock.releaseLock(); }
}

/* ================= LỆNH SẢN XUẤT ================= */
function recipes_() {
  const r = {};
  rows_(SH.CT).forEach(x => {
    const sp = str_(x[0]), vt = str_(x[1]);
    if (sp && vt) (r[sp] = r[sp] || []).push({ ma: vt, dm: num_(x[2]) });
  });
  return r;
}

function orders_() {
  return rows_(SH.LX).filter(r => str_(r[0])).map(r => ({
    so: str_(r[0]), ngay: str_(r[1]), maSP: str_(r[2]), slDuKien: num_(r[3]), trangThai: str_(r[4]) || 'Đang SX',
    ngayHT: str_(r[5]), slThucTe: num_(r[6]), nguoiLap: str_(r[7]), nguoiHT: str_(r[8]), ghiChu: str_(r[9]),
    khachHang: str_(r[10]), nguoiSX: str_(r[11]), qcSX: str_(r[12]), tyTrong: num_(r[13])
  }));
}
/** Cột K–M trang LenhSX: khách hàng, người sản xuất, QC theo dõi SX (in lên thẻ nhận diện BTP). */
function lxHead_() { const sh = sheet_(SH.LX); if (!str_(sh.getRange(1, 11).getValue())) sh.getRange(1, 11, 1, 3).setValues([['Khách hàng', 'Người sản xuất', 'QC theo dõi SX']]).setFontWeight('bold'); if (!str_(sh.getRange(1, 14).getValue())) sh.getRange(1, 14).setValue('Tỷ trọng (g/ml)').setFontWeight('bold'); }
/** BTP dạng lỏng (SC, EC, SL, OD, FS, EW, ME, SE, CS, DC): bắt buộc ghi tỷ trọng khi lập lệnh. */
const isLiq_ = sp => !!sp && /\d\s*(SC|EC|SL|OD|FS|EW|ME|SE|CS|DC)\b/i.test(sp.ten || '');
function ttIn_(v, sp, batBuoc) {
  const t = String(v == null ? '' : v).trim() === '' ? 0 : num_(v);
  if (t && (t < 0.3 || t > 3)) throw new Error('Tỷ trọng phải trong khoảng 0,3 – 3 g/ml.');
  if (!t && batBuoc && isLiq_(sp)) throw new Error(sp.ten + ' là dạng lỏng: ghi tỷ trọng (g/ml) để quy ra lít.');
  return t;
}
function lxGoiY_(lenh) {
  const uq = a => [...new Set(a.map(x => String(x || '').trim()).filter(String))];
  const ds = k => str_(settings_raw_(k)).split(',').map(x => x.trim()).filter(String);
  const nsx = ds('Danh sách người sản xuất'), qc = ds('Danh sách QC theo dõi SX');
  const dg = ds('Danh sách nhân viên đóng gói'), lab = ds('Danh sách nhân viên Lab');
  return { dg: uq(dg), lab: uq(lab.concat(qc)), kh: uq(lenh.map(o => o.khachHang).concat(['Công ty CP BVTV Asata Hoa Kỳ'])),
    nsx: nsx.length ? uq(nsx) : uq(lenh.map(o => o.nguoiSX)),
    qc: qc.length ? uq(qc) : uq(lenh.map(o => o.qcSX).concat(ndRows_().filter(r => str_(r[2]) === ROLES.QL || str_(r[4]) === 'Có').map(r => str_(r[0])))) };
}
function lxInfo_(o, sp) {
  const kh = String(o.khachHang || '').trim().slice(0, 150), nsx = String(o.nguoiSX || '').trim().slice(0, 200), qc = String(o.qcSX || '').trim().slice(0, 80);
  if (sp && sp.nhom === 'Bán thành phẩm' && !kh) throw new Error('Lệnh SX bán thành phẩm: ghi tên khách hàng (tên công ty) để in lên thẻ nhận diện.');
  return [kh, nsx, qc];
}
function updateOrderInfo(a, so, o) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]); needCT_(me);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const row = orderRow_(so), od = orders_().find(x => x.so === so), items = items_(), lx = sheet_(SH.LX), doi = [];
    if (od.trangThai === 'Đã huỷ') throw new Error('Lệnh ' + so + ' đã huỷ.');
    let sp = items.find(i => i.ma === od.maSP);
    if (od.trangThai === 'Đang SX') { // lệnh chưa hoàn thành: sửa được ngày, sản phẩm, khối lượng dự kiến
      if (o.maSP !== undefined && o.maSP !== od.maSP) { const n = items.find(i => i.ma === o.maSP); if (!n) throw new Error('Chọn sản phẩm.'); needScope_(me, n); lx.getRange(row, 3).setValue(n.ma); doi.push('SP ' + od.maSP + ' → ' + n.ma); sp = n; }
      const moi = String(o.soMoi || '').trim();
      if (moi && moi !== so) {
        const all = orders_(), trung = all.find(x => x.so.toLowerCase() === moi.toLowerCase() && x.so !== so);
        if (trung && trung.trangThai !== 'Đã huỷ') throw new Error('Số lệnh ' + moi + ' đã tồn tại.');
        if (trung) { let ten = trung.so + ' (huỷ)', k = 2; while (all.some(x => x.so === ten)) ten = trung.so + ' (huỷ ' + k++ + ')'; lx.getRange(orderRow_(trung.so), 1).setValue(ten); }
        lx.getRange(row, 1).setValue(moi); doi.push('Số lệnh ' + so + ' → ' + moi);
      }
      if (o.ngay !== undefined && o.ngay !== od.ngay) { if (!isYmd_(o.ngay)) throw new Error('Ngày ra lệnh không hợp lệ.'); lx.getRange(row, 2).setValue(o.ngay); doi.push('Ngày ' + od.ngay + ' → ' + o.ngay); }
      if (o.slDuKien !== undefined && num_(o.slDuKien) !== od.slDuKien) { const v = num_(o.slDuKien); if (!(v > 0)) throw new Error('Khối lượng dự kiến phải lớn hơn 0.'); lx.getRange(row, 4).setValue(v); doi.push('Dự kiến ' + od.slDuKien + ' → ' + v); }
    } else if (o.maSP !== undefined && o.maSP !== od.maSP || o.slDuKien !== undefined && num_(o.slDuKien) !== od.slDuKien) throw new Error('Lệnh đã hoàn thành: bấm "Mở lại lệnh để sửa" rồi mới đổi sản phẩm, khối lượng, vật tư.');
    const v = lxInfo_(o, sp); lxHead_();
    lx.getRange(row, 11, 1, 3).setValues([v]);
    let tt = od.tyTrong; if (o.tyTrong !== undefined) { tt = ttIn_(o.tyTrong, sp, od.trangThai === 'Đang SX'); lx.getRange(row, 14).setValue(tt || ''); }
    if (o.ghiChu !== undefined) lx.getRange(row, 10).setValue(String(o.ghiChu || '').slice(0, 200));
    log_(me, 'Sửa lệnh SX', String(o.soMoi || '').trim() || so, (doi.length ? doi.join(' · ') + ' · ' : '') + 'Khách: ' + v[0] + ' · Người SX: ' + v[1] + ' · QC: ' + v[2] + ' · Tỷ trọng: ' + (tt || '—'));
    return true;
  } finally { lock.releaseLock(); }
}

function orderRow_(so) {
  const i = rows_(SH.LX).findIndex(r => str_(r[0]) === so);
  if (i < 0) throw new Error('Không tìm thấy lệnh ' + so);
  return i + 2;
}

function saveRecipe(a, maSP, lines) {
  const me = auth_(a, [ROLES.QL, ROLES.KT]); needCT_(me);
  const items = items_(), has = m => items.some(i => i.ma === m);
  if (!has(maSP)) throw new Error('Chưa có mã sản phẩm ' + maSP + ' trong danh mục vật tư.');
  const clean = (lines || []).map(l => ({ ma: String(l.ma || '').trim(), dm: num_(l.dm) })).filter(l => l.ma);
  clean.forEach(l => {
    if (!has(l.ma)) throw new Error('Không có mã vật tư ' + l.ma);
    if (l.ma === maSP) throw new Error('Sản phẩm không thể là vật tư của chính nó.');
    if (l.dm <= 0) throw new Error('Định mức của ' + l.ma + ' phải lớn hơn 0.');
  });
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = sheet_(SH.CT), recipesBefore = recipes_()[maSP];
    const keep = rows_(SH.CT).filter(r => str_(r[0]) && str_(r[0]) !== maSP).map(r => [str_(r[0]), str_(r[1]), num_(r[2])]);
    const all = keep.concat(clean.map(l => [maSP, l.ma, l.dm]));
    if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 3).clearContent();
    if (all.length) sh.getRange(2, 1, all.length, 3).setValues(all);
    const before = {}, after = {};
    (recipesBefore || []).forEach(l => before[l.ma] = l.dm); clean.forEach(l => after[l.ma] = l.dm);
    const f = v => Math.round(v * 1e6) / 1e6, ch = [];
    Object.keys(after).forEach(m => { if (!(m in before)) ch.push('+ ' + m + ' ' + f(after[m])); else if (f(before[m]) !== f(after[m])) ch.push(m + ': ' + f(before[m]) + ' → ' + f(after[m])); });
    Object.keys(before).forEach(m => { if (!(m in after)) ch.push('− ' + m); });
    if (ch.length) log_(me, 'Sửa công thức', maSP, ch.join(' · '));
    return true;
  } finally { lock.releaseLock(); }
}

function createOrder(a, o) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]); needCT_(me);
  const so = String(o.so || '').trim(), sl = num_(o.slDuKien);
  if (!so) throw new Error('Nhập số lệnh.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(o.ngay || '')) throw new Error('Ngày ra lệnh không hợp lệ.');
  const spIt = items_().find(i => i.ma === o.maSP);
  if (!spIt) throw new Error('Chọn sản phẩm.');
  needScope_(me, spIt);
  if (sl <= 0) throw new Error('Số lượng dự kiến phải lớn hơn 0.');
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const all = orders_(), trung = all.find(x => x.so.toLowerCase() === so.toLowerCase());
    if (trung && trung.trangThai !== 'Đã huỷ') throw new Error('Số lệnh ' + so + ' đã tồn tại (' + trung.trangThai + ').');
    if (trung) { // lệnh cũ đã huỷ: đổi tên lệnh cũ thành "… (huỷ)" để dùng lại số lệnh
      let ten = trung.so + ' (huỷ)', k = 2; while (all.some(x => x.so === ten)) ten = trung.so + ' (huỷ ' + k++ + ')';
      sheet_(SH.LX).getRange(orderRow_(trung.so), 1).setValue(ten);
      log_(me, 'Dùng lại số lệnh đã huỷ', so, 'Lệnh huỷ cũ đổi tên thành ' + ten);
    }
    const info = lxInfo_(o, spIt), tt = ttIn_(o.tyTrong, spIt, true); lxHead_();
    sheet_(SH.LX).appendRow([so, o.ngay, o.maSP, sl, 'Đang SX', '', '', me.ten, '', String(o.ghiChu || '').slice(0, 200)].concat(info).concat([tt || '']));
    return true;
  } finally { lock.releaseLock(); }
}

function getOrderMoves(a, so) {
  needCT_(auth_(a));
  const all = moves_(), IM = {}, kt = khongTon_(); items_().forEach(i => IM[i.ma] = i);
  const r4 = x => Math.round(x * 1e4) / 1e4, dl = m => m.loai === 'Xuất' ? -m.kg : m.kg;
  // tồn sau phiếu: mọi phiếu ngày trước + phiếu cùng ngày ghi trước (theo thứ tự dòng trong sổ)
  return all.map((m, i) => [m, i]).filter(([m]) => m.lenh === so && !m.trangThai).map(([x, ix]) => {
    let t = (IM[x.ma] || {}).dauKy || 0, tl = 0;
    all.forEach((m, i) => { if (m.trangThai || m.ma !== x.ma) return; if (m.ngay > x.ngay || (m.ngay === x.ngay && i > ix)) return; t += dl(m); if (x.lo && m.lo === x.lo) tl += dl(m); });
    return Object.assign({}, x, { tonSau: kt[x.ma] ? null : r4(t), tonLoSau: x.lo ? r4(tl) : null });
  });
}

function completeOrder(a, so, d) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]); needCT_(me);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.ngay || '')) throw new Error('Ngày hoàn thành không hợp lệ.');
  const slTT = num_(d.slThucTe);
  if (slTT <= 0) throw new Error('Nhập số lượng sản phẩm thực tế nhập kho.');
  checkLock_(d.ngay);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const row = orderRow_(so), o = orders_().find(x => x.so === so);
    if (o.trangThai !== 'Đang SX') throw new Error('Lệnh ' + so + ' không ở trạng thái Đang SX.');
    const items = items_(), find = m => items.find(i => i.ma === m);
    const sp = find(o.maSP);
    if (!sp) throw new Error('Sản phẩm ' + o.maSP + ' không còn trong danh mục.');
    needScope_(me, sp);
    const now = new Date(), base = Utilities.formatDate(now, tz_(), 'yyMMddHHmmss');
    const cfg = settings_(), mv0 = moves_(), L = lots_(items, mv0, cfg), B = balances_(items, mv0), G = outGuard_(a), out = [];
    (d.lines || []).forEach((l, k) => {
      const sl = num_(l.sl), it = find(l.ma);
      if (!it) throw new Error('Không có mã vật tư ' + l.ma);
      needScope_(me, it);
      if (sl < 0) throw new Error('Số lượng xuất của ' + l.ma + ' không được âm.');
      if (sl === 0) return;
      if (it.theoLo) checkLotOut_(it, String(l.lo || '').trim(), L, d.ngay);
      const lotX = lotInfo_(it, 'Xuất', l, L, d.ngay), kgX = Math.round(sl * it.heSo * 10000) / 10000;
      outWarn_(G, it, lotX[0], kgX, L, B, d.ngay);
      out.push([base + 'X' + k, now, d.ngay, 'Xuất', it.ma, sl, it.donVi, kgX,
        so, 'Xuất cho lệnh SX', me.ten, '', so].concat(lotX));
    });
    if (!out.length) throw new Error('Chưa nhập số lượng vật tư thực tế đã xuất.');
    outConfirm_(G, me, 'Hoàn thành lệnh ' + so);
    const spLot = lotInfo_(sp, 'Nhập', { lo: d.lo || so, nsx: d.nsx, hsd: d.hsd }, L, d.ngay);
    out.push([base + 'N', now, d.ngay, 'Nhập', sp.ma, slTT, 'kg', Math.round(slTT * 10000) / 10000,
      so, 'Nhập sản phẩm từ lệnh SX', me.ten, '', so].concat(spLot));
    const ph = sheet_(SH.PH);
    ph.getRange(ph.getLastRow() + 1, 1, out.length, out[0].length).setValues(out);
    const lx = sheet_(SH.LX);
    lx.getRange(row, 5, 1, 3).setValues([['Hoàn thành', d.ngay, slTT]]);
    if (d.nguoiSX !== undefined || d.qcSX !== undefined) { lxHead_(); lx.getRange(row, 12, 1, 2).setValues([[String(d.nguoiSX || '').trim().slice(0, 200), String(d.qcSX || '').trim().slice(0, 80)]]); }
    lx.getRange(row, 9).setValue(me.ten);
    const ttHT = String(d.tyTrong == null ? '' : d.tyTrong).trim() !== '' ? ttIn_(d.tyTrong, sp, false) : o.tyTrong;
    if (ttHT && sp.theoLo && ttMap_()[lotKey_(sp.ma, spLot[0])] !== ttHT) sheet_(SH.TT).appendRow([sp.ma, spLot[0], ttHT, d.ngay, me.ten, new Date()]);
    let cho = false;
    if (needQC_(sp, cfg) && !(L[sp.ma] && L[sp.ma][spLot[0]]) && !qcMap_()[lotKey_(sp.ma, spLot[0])]) {
      sheet_(SH.QC).appendRow([sp.ma, spLot[0], 'Chờ kiểm', d.ngay, me.ten, 'Tự tạo khi hoàn thành lệnh ' + so, '', new Date()]);
      cho = true;
    }
    return { xuat: out.length - 1, choKiem: cho };
  } finally { lock.releaseLock(); }
}

function reopenOrder(a, so) {
  const me = auth_(a, [ROLES.QL, ROLES.KT]); needCT_(me);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const row = orderRow_(so), ph = sheet_(SH.PH), n = ph.getLastRow() - 1;
    const od = orders_().find(x => x.so === so); if (od && od.ngayHT) checkLock_(od.ngayHT);
    const note = 'Huỷ do mở lại lệnh, bởi ' + me.ten + ' lúc ' + Utilities.formatDate(new Date(), tz_(), 'dd/MM/yyyy HH:mm');
    if (n > 0) {
      const vals = ph.getRange(2, 12, n, 2).getValues();
      vals.forEach((v, i) => { if (str_(v[1]) === so && !str_(v[0])) ph.getRange(i + 2, 12).setValue(note); });
    }
    const lx = sheet_(SH.LX);
    lx.getRange(row, 5, 1, 3).setValues([['Đang SX', '', '']]);
    lx.getRange(row, 9).setValue('');
    log_(me, 'Mở lại lệnh SX', so, 'Huỷ các phiếu xuất/nhập của lệnh');
    return true;
  } finally { lock.releaseLock(); }
}

function cancelOrder(a, so) {
  const me = auth_(a, [ROLES.QL, ROLES.KT]);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const row = orderRow_(so), o = orders_().find(x => x.so === so);
    if (o.trangThai !== 'Đang SX') throw new Error('Chỉ huỷ được lệnh đang sản xuất.');
    sheet_(SH.LX).getRange(row, 5).setValue('Đã huỷ');
    log_(me, 'Huỷ lệnh SX', so, o.maSP + ' · dự kiến ' + o.slDuKien);
    return true;
  } finally { lock.releaseLock(); }
}

/* ================= QC THEO LÔ ================= */
/** Lô BTP cần Phiếu kiểm hoá lý + bước hàm lượng: chỉ lô của lệnh AHK. (GC., TC. chỉ cần QC duyệt Đạt). */
function needHoaLy_(lo) { return /^AHK\./i.test(String(lo || '').trim()); }

/** Loại hồ sơ đã có của từng lô: { 'ma\u0001lo': { 'Phiếu kiểm hoá lý': 1, ... } } */
function hsLoaiMap_() { const o = {}; hsRows_().forEach(r => { const k = lotKey_(str_(r[0]), str_(r[1])); (o[k] = o[k] || {})[str_(r[2])] = 1; }); return o; }
/** Xác nhận kiểm hàm lượng của lô BTP: 'Có kiểm' (chờ phiếu kết quả) hoặc 'Không kiểm'. */
const HL_SH = 'HamLuongLo';
function hlMap_() { const o = {}; if (!sheet_(HL_SH)) return o; rows_(HL_SH).forEach(r => { if (str_(r[0])) o[lotKey_(str_(r[0]), str_(r[1]))] = str_(r[2]); }); return o; }
function setHamLuongXn(a, ma, lo, tt, ghiChu) {
  const me = auth_(a);
  if (!me.qc) throw new Error('Tài khoản ' + me.ten + ' chưa có quyền QC.');
  if (['Có kiểm', 'Không kiểm', ''].indexOf(tt) < 0) throw new Error('Lựa chọn không hợp lệ.');
  shX_(HL_SH, ['Mã', 'Số lô', 'Kiểm hàm lượng', 'Ngày', 'Người', 'Ghi chú', 'Thời điểm']).appendRow([ma, String(lo || ''), tt, Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd'), me.ten, String(ghiChu || '').slice(0, 200), new Date()]);
  log_(me, 'Xác nhận kiểm hàm lượng', ma + ' lô ' + (lo || '(chưa có lô)'), tt || 'bỏ xác nhận');
  return true;
}
function setQC(a, ma, lo, tt, ghiChu, hsdMoi) {
  const me = auth_(a);
  if (!me.qc) throw new Error('Tài khoản ' + me.ten + ' chưa có quyền QC.');
  if (QC_TT.indexOf(tt) < 0) throw new Error('Trạng thái QC không hợp lệ.');
  lo = String(lo || '');
  hsdMoi = isYmd_(hsdMoi) ? hsdMoi : '';
  if (tt === 'Không đạt' && !String(ghiChu || '').trim()) throw new Error('Ghi lý do không đạt.');
  const it = items_().find(i => i.ma === ma);
  if (!it || !it.theoLo) throw new Error('Mã ' + ma + ' không theo dõi lô.');
  const L = lots_(items_(), moves_());
  if (!L[ma] || !L[ma][lo]) throw new Error('Không tìm thấy lô ' + (lo || '(chưa có lô)') + ' của ' + ma + '.');
  const old = L[ma][lo];
  if (tt === 'Đạt' && it.nhom === 'Bán thành phẩm' && old.qc === 'Chờ kiểm' && needHoaLy_(lo)) {
    const hs = hsLoaiMap_()[lotKey_(ma, lo)] || {};
    if (!hs['Phiếu kiểm hoá lý'] && !hs['Phiếu test hoá lý']) throw new Error('Lô BTP ' + ma + ' lô ' + (lo || '(chưa có lô)') + ': tải Phiếu kiểm hoá lý (đạt) lên hồ sơ lô trước, rồi mới duyệt Đạt.');
    if (!hs['Phiếu kết quả hàm lượng']) throw new Error('Lô BTP ' + ma + ' lô ' + (lo || '(chưa có lô)') + ': tải Phiếu kết quả hàm lượng lên hồ sơ lô trước, rồi mới duyệt Đạt.');
  }
  const today = Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd');
  sheet_(SH.QC).appendRow([ma, lo, tt, today, me.ten, String(ghiChu || '').slice(0, 300), hsdMoi, new Date()]);
  log_(me, 'QC lô', ma + ' lô ' + (lo || '(chưa có lô)'), (old.qc || 'Đạt') + ' → ' + tt + (hsdMoi ? ' · HSD mới ' + hsdMoi : '') + (ghiChu ? ' · ' + ghiChu : ''));
  return true;
}

/** Ghi tỷ trọng thực tế cho một lô (đo sau khi hoàn thành lệnh SX). v trống = xoá. */
function setTyTrong(a, ma, lo, v) {
  const me = auth_(a);
  if (!me.qc && [ROLES.QL, ROLES.KT, ROLES.TK].indexOf(me.vaiTro) < 0) throw new Error('Tài khoản ' + me.ten + ' chưa có quyền ghi tỷ trọng.');
  lo = String(lo || '');
  const t = String(v === undefined || v === null ? '' : v).trim() === '' ? 0 : num_(v);
  if (t && (t < 0.3 || t > 3)) throw new Error('Tỷ trọng phải trong khoảng 0,3 – 3 g/ml.');
  const L = lots_(items_(), moves_());
  if (!L[ma] || !L[ma][lo]) throw new Error('Không tìm thấy lô ' + (lo || '(chưa có lô)') + ' của ' + ma + '.');
  const today = Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd');
  sheet_(SH.TT).appendRow([ma, lo, t || '', today, me.ten, new Date()]);
  log_(me, 'Tỷ trọng lô', ma + ' lô ' + (lo || '(chưa có lô)'), (L[ma][lo].tyTrong || 'chưa có') + ' → ' + (t || 'xoá'));
  return t;
}

function getQCHistory(a, ma, lo) {
  auth_(a);
  return rows_(SH.QC).filter(r => str_(r[0]) === ma && str_(r[1]) === String(lo || ''))
    .map(r => ({ tt: str_(r[2]), ngay: str_(r[3]), nguoi: str_(r[4]), ghiChu: str_(r[5]), hsdMoi: str_(r[6]) })).reverse();
}

/* ================= TRUY XUẤT NGUỒN GỐC ================= */
function needTrace_(a) { const me = auth_(a); if (!(me.vaiTro === ROLES.QL || me.qc || me.ct)) throw new Error('Tài khoản ' + me.ten + ' chưa có quyền QC để truy xuất lô.'); return me; }
function getLotList(a, ma) {
  needTrace_(a);
  const items = items_(), L = lots_(items, moves_());
  return Object.values(L[ma] || {}).map(x => ({ lo: x.lo, nsx: x.nsx, hsd: x.hsd, ton: Math.round(x.ton * 1e4) / 1e4, qc: x.qc, tyTrong: x.tyTrong || 0 }))
    .sort((p, q) => (q.nsx || '').localeCompare(p.nsx || '') || q.lo.localeCompare(p.lo));
}

function getTrace(a, ma, lo) {
  needTrace_(a);
  lo = String(lo || '');
  const items = items_(), mv = moves_().filter(m => !m.trangThai), L = lots_(items, mv);
  const ord = {}; orders_().forEach(o => ord[o.so] = o);
  const ten = m => (items.find(i => i.ma === m) || {}).ten || '';
  const lotOf = (m, l) => { const x = L[m] && L[m][l]; return x ? { nsx: x.nsx, hsd: x.hsd, ton: Math.round(x.ton * 1e4) / 1e4, qc: x.qc, tyTrong: x.tyTrong || 0 } : {}; };
  const mvInfo = m => ({ ngay: m.ngay, kg: m.kg, soLuong: m.soLuong, donVi: m.donVi, nguoi: m.nguoiLap, chungTu: m.chungTu, ghiChu: m.ghiChu });
  const seen = {};
  function back(m, l, depth) {
    const nh = mv.filter(x => x.ma === m && x.lo === l && x.loai === 'Nhập');
    const res = { nhap: nh.filter(x => !x.lenh).map(mvInfo), lenh: [] };
    if (depth > 4) return res;
    nh.filter(x => x.lenh).forEach(x => {
      const o = ord[x.lenh] || { so: x.lenh };
      const vt = mv.filter(y => y.lenh === x.lenh && y.loai === 'Xuất').map(y => {
        const k = 'b' + y.ma + '|' + y.lo + '|' + depth;
        const node = Object.assign({ ma: y.ma, ten: ten(y.ma), lo: y.lo, theoLo: !!(L[y.ma]) }, mvInfo(y), { lot: lotOf(y.ma, y.lo) });
        if (L[y.ma] && !seen[k]) { seen[k] = 1; node.src = back(y.ma, y.lo, depth + 1); }
        return node;
      });
      res.lenh.push({ so: x.lenh, ngay: o.ngay, ngayHT: o.ngayHT, nguoiLap: o.nguoiLap, nguoiHT: o.nguoiHT, slThucTe: o.slThucTe, nhapKg: x.kg, vt });
    });
    return res;
  }
  function fwd(m, l, depth) {
    const xs = mv.filter(x => x.ma === m && x.lo === l && x.loai === 'Xuất');
    const res = { lenh: [], khac: [] };
    const byLenh = {};
    xs.forEach(x => {
      if (!x.lenh) { res.khac.push(mvInfo(x)); return; }
      (byLenh[x.lenh] = byLenh[x.lenh] || []).push(x);
    });
    Object.keys(byLenh).forEach(so => {
      const o = ord[so] || { so };
      const sp = mv.filter(y => y.lenh === so && y.loai === 'Nhập').map(y => {
        const k = 'f' + y.ma + '|' + y.lo + '|' + depth;
        const node = { ma: y.ma, ten: ten(y.ma), lo: y.lo, kg: y.kg, soLuong: y.soLuong, donVi: y.donVi, ngay: y.ngay, lot: lotOf(y.ma, y.lo) };
        if (depth < 4 && !seen[k]) { seen[k] = 1; node.dst = fwd(y.ma, y.lo, depth + 1); }
        return node;
      });
      res.lenh.push({ so, ngayHT: o.ngayHT, trangThai: o.trangThai, dung: byLenh[so].reduce((s, x) => s + x.kg, 0), sp });
    });
    return res;
  }
  const qh = getQCHistory(a, ma, lo);
  return { ma, ten: ten(ma), lo, lot: lotOf(ma, lo), qcLog: qh, hoSo: getHoSo(a, ma, lo), back: back(ma, lo, 0), fwd: fwd(ma, lo, 0) };
}

/* ================= BÁO CÁO HAO HỤT ================= */
function getVariance(a, tu, den) {
  needCT_(auth_(a, [ROLES.QL]));
  const items = items_(), ct = recipes_(), find = m => items.find(i => i.ma === m) || {};
  const os = orders_().filter(o => o.trangThai === 'Hoàn thành' && (!tu || o.ngayHT >= tu) && (!den || o.ngayHT <= den));
  const set = {}; os.forEach(o => set[o.so] = 1);
  const used = {};
  moves_().forEach(m => { if (!m.trangThai && m.loai === 'Xuất' && set[m.lenh]) { const u = used[m.lenh] = used[m.lenh] || {}; u[m.ma] = (u[m.ma] || 0) + m.soLuong; } });
  return os.map(o => {
    const u = used[o.so] || {}, r = ct[o.maSP] || [], lines = [];
    r.forEach(l => { const it = find(l.ma); lines.push({ ma: l.ma, ten: it.ten || '', donVi: it.donVi || '', heSo: it.heSo || 1, dm: l.dm * o.slThucTe, tt: u[l.ma] || 0 }); });
    Object.keys(u).forEach(m => { if (!r.some(l => l.ma === m)) { const it = find(m); lines.push({ ma: m, ten: it.ten || '', donVi: it.donVi || '', heSo: it.heSo || 1, dm: 0, tt: u[m], ngoai: true }); } });
    return { so: o.so, ngayHT: o.ngayHT, maSP: o.maSP, tenSP: find(o.maSP).ten || '', slDuKien: o.slDuKien, slThucTe: o.slThucTe, coCT: r.length > 0, lines };
  }).sort((x, y) => y.ngayHT.localeCompare(x.ngayHT));
}

/* ================= NHẬT KÝ ================= */
function getLog(a, thang) {
  auth_(a, [ROLES.QL]);
  if (!sheet_(SH.NK)) return [];
  return rows_(SH.NK).map(r => ({
    luc: r[0] instanceof Date ? Utilities.formatDate(r[0], tz_(), 'yyyy-MM-dd HH:mm') : str_(r[0]),
    nguoi: str_(r[1]), hanhDong: str_(r[2]), doiTuong: str_(r[3]), chiTiet: str_(r[4])
  })).filter(x => !thang || x.luc.indexOf(thang) === 0).reverse().slice(0, 500);
}

/* ================= CẢNH BÁO TỰ ĐỘNG ================= */
function getAlertSettings(a) {
  auth_(a, [ROLES.QL]);
  const c = settings_(), on = ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'dailyAlert');
  return { email: c.email, hetHan: c.hetHan, treo: c.treo, gio: c.gio, nhomQC: c.nhomQC.join(', '), bat: on };
}

function saveAlertSettings(a, p) {
  const me = auth_(a, [ROLES.QL]);
  const emails = String(p.email || '').split(',').map(x => x.trim()).filter(String);
  emails.forEach(e => { if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) throw new Error('Email không hợp lệ: ' + e); });
  CD_C = null; const sh = sheet_(SH.CD), rows = rows_(SH.CD);
  const put = (k, v) => { const i = rows.findIndex(r => str_(r[0]) === k); if (i >= 0) sh.getRange(i + 2, 2).setValue(v); else sh.appendRow([k, v, '']); };
  put('Email nhận cảnh báo', emails.join(', '));
  put('Báo trước hết hạn (ngày)', Math.max(1, Math.round(num_(p.hetHan)) || 90));
  put('Báo lệnh SX treo quá (ngày)', Math.max(1, Math.round(num_(p.treo)) || 7));
  put('Giờ gửi cảnh báo', Math.min(23, Math.max(0, Math.round(num_(p.gio)))));
  const nq = String(p.nhomQC || '').split(',').map(x => x.trim()).filter(String);
  nq.forEach(n => { if (NHOM.indexOf(n) < 0) throw new Error('Không có nhóm "' + n + '".'); });
  put('Nhóm cần QC theo lô', nq.join(', '));
  installTrigger_(p.bat && emails.length > 0);
  log_(me, 'Sửa cài đặt cảnh báo', '', 'Email: ' + (emails.join(', ') || '(trống)') + ' · bật: ' + (p.bat ? 'có' : 'không'));
  return getAlertSettings(a);
}

function installTrigger_(on) {
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === 'dailyAlert') ScriptApp.deleteTrigger(t); });
  if (on) ScriptApp.newTrigger('dailyAlert').timeBased().everyDays(1).atHour(settings_().gio).inTimezone(tz_()).create();
}

/** Chạy hàm này một lần trong trình chỉnh sửa để cấp quyền gửi email và bật lịch gửi hằng ngày. */
function setupAlerts() { installTrigger_(true); return 'Đã bật cảnh báo lúc ' + settings_().gio + 'h mỗi ngày.'; }

function sendAlertNow(a) {
  auth_(a, [ROLES.QL]);
  const r = dailyAlert(true);
  return r;
}

function alertData_() {
  const cfg = settings_(), items = items_(), mv = moves_(), bal = balances_(items, mv), L = lots_(items, mv, cfg);
  const today = Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd');
  const dd = (a, b) => Math.round((new Date(a) - new Date(b)) / 864e5);
  const low = [], exp = [], cho = [], treo = [];
  items.forEach(i => {
    const t = bal[i.ma].ton;
    if (t < -1e-6) low.push({ ma: i.ma, ten: i.ten, ton: t, min: i.toiThieu, am: true });
    else if (i.toiThieu > 0 && t < i.toiThieu) low.push({ ma: i.ma, ten: i.ten, ton: t, min: i.toiThieu });
  });
  Object.keys(L).forEach(ma => Object.values(L[ma]).forEach(x => {
    if (x.ton <= 1e-6) return;
    const it = items.find(i => i.ma === ma) || {};
    if (x.hsd) { const d = dd(x.hsd, today); if (d <= cfg.hetHan) exp.push({ ma, ten: it.ten, lo: x.lo, hsd: x.hsd, con: d, ton: x.ton }); }
    if (x.qc === 'Chờ kiểm') cho.push({ ma, ten: it.ten, lo: x.lo, ton: x.ton, ngay: x.qcNgay });
  }));
  orders_().forEach(o => { if (o.trangThai === 'Đang SX' && o.ngay && dd(today, o.ngay) > cfg.treo) treo.push({ so: o.so, maSP: o.maSP, ngay: o.ngay, ngayTreo: dd(today, o.ngay) }); });
  exp.sort((p, q) => p.con - q.con);
  return { cfg, today, low, exp, cho, treo };
}

/** Gửi email cảnh báo. Gọi từ lịch hằng ngày, hoặc từ nút "Gửi thử". */
function dailyAlert(force) {
  const d = alertData_();
  const n = d.low.length + d.exp.length + d.cho.length + d.treo.length;
  if (!d.cfg.email) return { gui: false, ly: 'Chưa cài email nhận cảnh báo.', n };
  if (!n && force !== true) return { gui: false, ly: 'Không có gì cần cảnh báo.', n };
  const f = v => (Math.round(v * 100) / 100).toLocaleString('vi-VN');
  const dmy = s => (s || '').split('-').reverse().join('/');
  const tbl = (title, head, rows) => rows.length ? '<h3 style="margin:18px 0 6px;font-size:15px">' + title + ' (' + rows.length + ')</h3><table style="border-collapse:collapse;font-size:13px">' +
    '<tr>' + head.map(h => '<th style="text-align:left;border-bottom:1px solid #ccc;padding:4px 10px 4px 0">' + h + '</th>').join('') + '</tr>' +
    rows.map(r => '<tr>' + r.map(c => '<td style="border-bottom:1px solid #eee;padding:4px 10px 4px 0">' + c + '</td>').join('') + '</tr>').join('') + '</table>' : '';
  const html = '<div style="font-family:Arial,sans-serif;color:#1d2a22">' +
    '<p>Sổ Kho — tình hình ngày ' + dmy(d.today) + '</p>' + (n ? '' : '<p>Không có mục nào cần chú ý.</p>') +
    tbl('Lô sắp hết hạn / quá hạn', ['Mã', 'Tên', 'Lô', 'HSD', 'Còn', 'Tồn (kg)'], d.exp.map(x => [x.ma, x.ten, x.lo || '(chưa có lô)', dmy(x.hsd), x.con < 0 ? '<b style="color:#a3331f">quá ' + (-x.con) + ' ngày</b>' : x.con + ' ngày', f(x.ton)])) +
    tbl('Lô chờ QC', ['Mã', 'Tên', 'Lô', 'Từ ngày', 'Tồn (kg)'], d.cho.map(x => [x.ma, x.ten, x.lo || '(chưa có lô)', dmy(x.ngay), f(x.ton)])) +
    tbl('Dưới mức tối thiểu / âm kho', ['Mã', 'Tên', 'Tồn (kg)', 'Tối thiểu (kg)'], d.low.map(x => [x.ma, x.ten, x.am ? '<b style="color:#a3331f">' + f(x.ton) + '</b>' : f(x.ton), x.min ? f(x.min) : ''])) +
    tbl('Lệnh SX chưa hoàn thành', ['Số lệnh', 'Sản phẩm', 'Ngày ra lệnh', 'Đã treo'], d.treo.map(x => [x.so, x.maSP, dmy(x.ngay), x.ngayTreo + ' ngày'])) +
    '</div>';
  MailApp.sendEmail({ to: d.cfg.email, subject: 'Sổ Kho: ' + (n ? n + ' mục cần chú ý' : 'không có cảnh báo') + ' — ' + dmy(d.today), htmlBody: html });
  return { gui: true, n, to: d.cfg.email };
}

/* ================= PHIẾU XUẤT NỘI BỘ ================= */
const XNB_DAYS = 7;
function xnbRows_() {
  const sh = sheet_(SH.XNB);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 11).getValues().map((r, i) => {
    let lines = []; try { lines = JSON.parse(str_(r[10]) || '[]'); } catch (e) {}
    const lap = r[7] instanceof Date ? r[7] : new Date(str_(r[7]));
    return { row: i + 2, so: str_(r[0]), ngay: str_(r[1]), lyDo: str_(r[2]), nguoiNhan: str_(r[3]), boPhan: str_(r[4]), ghiChu: str_(r[5]),
      nguoiLap: str_(r[6]), lap: isNaN(lap) ? '' : Utilities.formatDate(lap, tz_(), 'yyyy-MM-dd HH:mm'), lapMs: isNaN(lap) ? 0 : lap.getTime(),
      huy: str_(r[8]), amis: str_(r[9]), lines };
  }).filter(x => x.so);
}
function xnbEditable_(x, me) {
  if (x.huy) return 'Phiếu đã huỷ.';
  if (me.vaiTro !== ROLES.QL && Date.now() - x.lapMs > XNB_DAYS * 864e5) return 'Phiếu đã lập quá ' + XNB_DAYS + ' ngày, không sửa được nữa.';
  return '';
}
function xnbOut_(x, me) {
  const o = Object.assign({}, x); delete o.row; delete o.lapMs;
  o.tongTX = Math.round(x.lines.reduce((s, l) => s + (+l.kg || 0), 0) * 1e4) / 1e4;
  o.sua = !xnbEditable_(x, me) && (me.vaiTro === ROLES.QL || me.vaiTro === ROLES.KT || x.nguoiLap === me.ten);
  return o;
}
function getXNBList(a, thang) {
  const me = auth_(a);
  return xnbRows_().filter(x => !thang || x.ngay.indexOf(thang) === 0).sort((p, q) => q.so.localeCompare(p.so)).map(x => xnbOut_(x, me));
}
function saveXNB(a, p) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]);
  if (!isYmd_(p.ngay)) throw new Error('Ngày không hợp lệ.');
  if (LYDO_XNB.indexOf(p.lyDo) < 0) throw new Error('Chọn lý do xuất.');
  if (p.lyDo === 'Khác' && !String(p.ghiChu || '').trim()) throw new Error('Lý do "Khác": ghi rõ lý do ở ô Ghi chú.');
  if (p.lyDo === 'Xuất bán / giao khách hàng' && !String(p.boPhan || '').trim()) throw new Error('Xuất bán: ghi tên khách hàng.');
  if (!String(p.nguoiNhan || '').trim()) throw new Error('Ghi tên người nhận.');
  const src = (p.lines || []).filter(l => l && l.ma);
  if (!src.length) throw new Error('Phiếu chưa có vật tư nào.');
  checkLock_(p.ngay);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const items = items_(), cfg = settings_(), mv = moves_(), L = lots_(items, mv, cfg);
    const now = new Date(), yymm = p.ngay.slice(2, 4) + p.ngay.slice(5, 7), pre = 'XNB-' + yymm + '-';
    const n = xnbRows_().filter(x => x.so.indexOf(pre) === 0).reduce((m, x) => Math.max(m, parseInt(x.so.slice(pre.length), 10) || 0), 0) + 1;
    const so = pre + ('00' + n).slice(-3);
    const lines = [], out = [], B = balances_(items, mv), G = outGuard_(a);
    src.forEach((l, k) => {
      const it = items.find(i => i.ma === l.ma);
      if (!it) throw new Error('Không có mã vật tư ' + l.ma);
      const tx = num_(l.tx), yc = l.yc === '' || l.yc == null ? tx : num_(l.yc);
      if (!(tx > 0)) throw new Error('Nhập số lượng thực xuất của ' + it.ma + '.');
      if (yc < 0) throw new Error('Số lượng yêu cầu của ' + it.ma + ' không được âm.');
      const lot = lotInfo_(it, 'Xuất', { lo: l.lo }, L, p.ngay);
      if (it.theoLo) checkLotOut_(it, lot[0], L, p.ngay);
      const id = so + '-' + (k + 1), kgv = Math.round(tx * it.heSo * 1e4) / 1e4;
      outWarn_(G, it, lot[0], kgv, L, B, p.ngay);
      out.push([id, now, p.ngay, 'Xuất', it.ma, tx, it.donVi, kgv, so, ((p.lyDo === 'Xuất bán / giao khách hàng' ? 'Xuất bán · ' + String(p.boPhan || '').trim() : 'Xuất nội bộ · ' + p.lyDo) + (p.ghiChu ? ' · ' + p.ghiChu : '')).slice(0, 200), me.ten, '', ''].concat(lot));
      lines.push({ id, ma: it.ma, ten: it.ten, donVi: it.donVi, lo: lot[0], nsx: lot[1], hsd: lot[2], yc, tx, kg: kgv, theoLo: !!it.theoLo });
    });
    outConfirm_(G, me, 'Phiếu xuất nội bộ ' + so);
    const ph = sheet_(SH.PH);
    ph.getRange(ph.getLastRow() + 1, 1, out.length, out[0].length).setValues(out);
    sheet_(SH.XNB).appendRow([so, p.ngay, p.lyDo, String(p.nguoiNhan).trim().slice(0, 100), String(p.boPhan || '').trim().slice(0, 100), String(p.ghiChu || '').trim().slice(0, 200), me.ten, now, '', '', JSON.stringify(lines)]);
    log_(me, 'Lập phiếu xuất nội bộ', so, p.lyDo + ' · ' + lines.map(l => l.ma + ' ' + l.tx + ' ' + l.donVi).join(', '));
    return xnbOut_(xnbRows_().find(x => x.so === so), me);
  } finally { lock.releaseLock(); }
}
function adjustXNB(a, so, txs) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const x = xnbRows_().find(r => r.so === so);
    if (!x) throw new Error('Không tìm thấy phiếu ' + so);
    const why = xnbEditable_(x, me); if (why) throw new Error(why);
    checkLock_(x.ngay);
    if (!(me.vaiTro === ROLES.QL || me.vaiTro === ROLES.KT || x.nguoiLap === me.ten)) throw new Error('Chỉ người lập phiếu, Kế toán hoặc Quản lý được điều chỉnh.');
    const items = items_(), ph = sheet_(SH.PH), ids = ph.getRange(2, 1, Math.max(ph.getLastRow() - 1, 1), 1).getValues().map(r => str_(r[0])), ch = [];
    const mvA = moves_(), LA = lots_(items, mvA, settings_()), BA = balances_(items, mvA), G = outGuard_(a);
    x.lines.forEach(l => {
      if (!(l.id in (txs || {}))) return;
      const it = items.find(i => i.ma === l.ma); if (!it) return;
      const add = Math.round(num_(txs[l.id]) * it.heSo * 1e4) / 1e4 - (+l.kg || 0);
      outWarn_(G, it, l.lo || '', add, LA, BA, x.ngay);
    });
    outConfirm_(G, me, 'Điều chỉnh ' + so);
    x.lines.forEach(l => {
      if (!(l.id in (txs || {}))) return;
      const tx = num_(txs[l.id]);
      if (!(tx > 0)) throw new Error('Thực xuất của ' + l.ma + ' phải lớn hơn 0. Muốn bỏ hẳn thì huỷ phiếu và lập lại.');
      if (Math.abs(tx - l.tx) < 1e-9) return;
      const it = items.find(i => i.ma === l.ma) || { heSo: 1 }, i = ids.indexOf(l.id);
      if (i < 0) throw new Error('Không tìm thấy dòng phiếu ' + l.id);
      const kgv = Math.round(tx * it.heSo * 1e4) / 1e4;
      ph.getRange(i + 2, 6).setValue(tx); ph.getRange(i + 2, 8).setValue(kgv);
      ch.push(l.ma + ': ' + l.tx + ' → ' + tx + ' ' + l.donVi);
      l.tx = tx; l.kg = kgv;
    });
    if (!ch.length) throw new Error('Không có số nào thay đổi.');
    sheet_(SH.XNB).getRange(x.row, 11).setValue(JSON.stringify(x.lines));
    log_(me, 'Điều chỉnh thực xuất', so, ch.join(' · '));
    return xnbOut_(x, me);
  } finally { lock.releaseLock(); }
}
function cancelXNB(a, so, lyDo) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]);
  if (!String(lyDo || '').trim()) throw new Error('Ghi lý do huỷ phiếu.');
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const x = xnbRows_().find(r => r.so === so);
    if (!x) throw new Error('Không tìm thấy phiếu ' + so);
    const why = xnbEditable_(x, me); if (why) throw new Error(why);
    checkLock_(x.ngay);
    if (!(me.vaiTro === ROLES.QL || me.vaiTro === ROLES.KT || x.nguoiLap === me.ten)) throw new Error('Chỉ người lập phiếu, Kế toán hoặc Quản lý được huỷ.');
    const stamp = 'Đã huỷ bởi ' + me.ten + ' lúc ' + Utilities.formatDate(new Date(), tz_(), 'dd/MM/yyyy HH:mm');
    const ph = sheet_(SH.PH), ids = ph.getRange(2, 1, Math.max(ph.getLastRow() - 1, 1), 1).getValues().map(r => str_(r[0]));
    x.lines.forEach(l => { const i = ids.indexOf(l.id); if (i >= 0) ph.getRange(i + 2, 12).setValue(stamp); });
    sheet_(SH.XNB).getRange(x.row, 9).setValue(stamp + ' · ' + String(lyDo).trim().slice(0, 150));
    log_(me, 'Huỷ phiếu xuất nội bộ', so, String(lyDo).trim());
    return true;
  } finally { lock.releaseLock(); }
}
/* ================= XUẤT NGUYÊN LIỆU CHO SX THEO THÁNG ================= */
function getMonthlyUse(a, thang) {
  const me = auth_(a, [ROLES.QL]);
  if (!/^\d{4}-\d{2}$/.test(thang || '')) throw new Error('Chọn tháng.');
  const items = items_(), find = m => items.find(i => i.ma === m), sum = {};
  const nLenh = {};
  moves_().forEach(m => {
    if (m.trangThai || m.loai !== 'Xuất' || !m.lenh || m.ngay.indexOf(thang) !== 0) return;
    const it = find(m.ma); if (!it || !seeItem_(me, it)) return;
    const s = sum[m.ma] = sum[m.ma] || { ma: m.ma, ten: it.ten, nhom: it.nhom, donVi: it.donVi, soLuong: 0, kg: 0 };
    s.soLuong += m.soLuong; s.kg += m.kg; nLenh[m.lenh] = 1;
  });
  const rows = Object.values(sum).map(s => Object.assign(s, { soLuong: Math.round(s.soLuong * 1e4) / 1e4, kg: Math.round(s.kg * 1e4) / 1e4 }))
    .sort((p, q) => NHOM.indexOf(p.nhom) - NHOM.indexOf(q.nhom) || p.ma.localeCompare(q.ma));
  return { thang, soLenh: Object.keys(nLenh).length, rows };
}

/* ================= KHOÁ SỔ THÁNG ================= */
function lockMonth_() {
  const v = settings_raw_('Khoá sổ đến hết tháng');
  const m = v instanceof Date ? Utilities.formatDate(v, tz_(), 'yyyy-MM') : str_(v);
  return /^\d{4}-\d{2}$/.test(m) ? m : '';
}
function settings_raw_(k) { const r = cdRows_().find(x => str_(x[0]) === k); return r ? r[1] : ''; }
function lockEnd_() { const m = lockMonth_(); if (!m) return ''; const p = m.split('-').map(Number); return new Date(Date.UTC(p[0], p[1], 0)).toISOString().slice(0, 10); }
function checkLock_(ngay) {
  const e = lockEnd_();
  if (e && String(ngay || '') <= e) throw new Error('Sổ đã khoá đến hết tháng ' + lockMonth_().split('-').reverse().join('/') + '. Không lập, sửa, xoá phiếu ngày ' + String(ngay).split('-').reverse().join('/') + ' được nữa. Cần Quản lý mở khoá.');
}
function setLock(a, thang) {
  const me = auth_(a, [ROLES.QL]);
  if (thang && !/^\d{4}-\d{2}$/.test(thang)) throw new Error('Tháng không hợp lệ.');
  CD_C = null; const old = lockMonth_(), sh = sheet_(SH.CD), rows = rows_(SH.CD), k = 'Khoá sổ đến hết tháng';
  const i = rows.findIndex(r => str_(r[0]) === k);
  if (i >= 0) sh.getRange(i + 2, 2).setNumberFormat('@').setValue(thang || '');
  else { sh.appendRow([k, '', 'Chỉ Quản lý sửa trong app. Phiếu có ngày trong tháng này trở về trước không lập, sửa, xoá được.']); sh.getRange(sh.getLastRow(), 2).setNumberFormat('@').setValue(thang || ''); }
  log_(me, thang ? 'Khoá sổ' : 'Mở khoá sổ', thang || old, old ? 'Trước đó khoá đến ' + old : '');
  return lockMonth_();
}

/* ================= NHẬP HÀNG LOẠT TỪ EXCEL ================= */
const IMP_COLS = {
  mua: { ngay: ['ngay', 'ngay nhap'], ma: ['ma', 'ma vat tu'], sl: ['so luong', 'sl', 'kg'], lo: ['so lo', 'lo'], nsx: ['nsx', 'ngay san xuat'], hsd: ['hsd', 'han su dung'], ncc: ['nha cung cap', 'ncc', 'ten nha cung cap'], chungTu: ['chung tu', 'so chung tu', 'so phieu'], ghiChu: ['ghi chu'] },
  donggoi: { ngay: ['ngay', 'ngay dong goi'], lenh: ['ma lenh dong goi', 'lenh dong goi', 'ma lenh', 'so lenh'], ma: ['ma btp', 'ma', 'ma vat tu'], lo: ['so lo', 'lo'], kg: ['kg', 'so kg', 'khoi luong', 'so luong'], lit: ['lit', 'so lit', 'the tich', 'the tich (l)', 'l'], ghiChu: ['ghi chu'] },
  kiemke: { ngay: ['ngay', 'ngay kiem'], ma: ['ma', 'ma vat tu'], lo: ['so lo', 'lo'], ton: ['ton thuc te', 'ton thuc te (kg)', 'thuc te', 'so luong'], ghiChu: ['ghi chu'] }
};
const fold_ = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/\s+/g, ' ').trim();
function importRows(a, kind, headers, rows, commit) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]);
  const map = IMP_COLS[kind]; if (!map) throw new Error('Loại nhập không hợp lệ.');
  const hf = (headers || []).map(h => fold_(h).replace(/\(.*\)/, '').trim()), idx = {};
  Object.keys(map).forEach(k => { const i = hf.findIndex(h => map[k].indexOf(h) >= 0); idx[k] = i; });
  const need = kind === 'mua' ? ['ngay', 'ma', 'sl'] : kind === 'donggoi' ? ['ngay', 'lenh', 'ma', 'kg'] : ['ngay', 'ma', 'ton'];
  const miss = need.filter(k => idx[k] < 0);
  if (miss.length) throw new Error('File thiếu cột: ' + miss.join(', ') + '. Dùng file mẫu tải từ app.');
  if ((rows || []).length > 1000) throw new Error('Mỗi lần nhập tối đa 1000 dòng.');
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const items = items_(), cfg = settings_(), mv = moves_().filter(m => !m.trangThai), Q = qcMap_();
    const ok = [], err = [], out = [], qcNew = [], now = new Date(), base = Utilities.formatDate(now, tz_(), 'yyMMddHHmmss'), G = outGuard_(a);
    const v = (r, k) => idx[k] >= 0 ? r[idx[k]] : '';
    (rows || []).forEach((r, n) => {
      const line = n + 2;
      try {
        if (!r || r.every(c => String(c == null ? '' : c).trim() === '')) return;
        const ngay = String(v(r, 'ngay') || '').trim();
        if (!isYmd_(ngay)) throw new Error('Ngày "' + ngay + '" không hợp lệ (dd/mm/yyyy).');
        checkLock_(ngay);
        const ma = String(v(r, 'ma') || '').trim(), it = items.find(i => i.ma.toLowerCase() === ma.toLowerCase());
        if (!it) throw new Error('Không có mã ' + ma);
        needScope_(me, it);
        const L = lots_(items, mv, cfg, Q), bal = balances_(items, mv);
        let ncc = '', loai, sl, kgv, lot, ct = '', gc = String(v(r, 'ghiChu') || '').trim(), donVi = it.donVi;
        if (kind === 'mua') {
          loai = 'Nhập'; sl = num_(v(r, 'sl')); if (!(sl > 0)) throw new Error('Số lượng phải > 0.');
          lot = lotInfo_(it, 'Nhập', { lo: v(r, 'lo'), nsx: v(r, 'nsx'), hsd: v(r, 'hsd') }, L, ngay);
          kgv = Math.round(sl * it.heSo * 1e4) / 1e4; ct = String(v(r, 'chungTu') || '').trim(); ncc = String(v(r, 'ncc') || '').trim().slice(0, 100);
          if (needQC_(it, cfg) && !(L[it.ma] && L[it.ma][lot[0]]) && !qcNew.some(q => q[0] === it.ma && q[1] === lot[0])) qcNew.push([it.ma, lot[0], 'Chờ kiểm', ngay, me.ten, 'Tự tạo khi nhập từ Excel', '', now]);
        } else if (kind === 'donggoi') {
          loai = 'Xuất'; let k = num_(v(r, 'kg')); const lit = num_(v(r, 'lit'));
          if (!(k > 0) && !(lit > 0)) throw new Error('Ghi số kg hoặc số lít (> 0).');
          const ml = String(v(r, 'lenh') || '').trim(); if (!ml) throw new Error('Thiếu mã lệnh đóng gói.');
          let lo = String(v(r, 'lo') || '').trim();
          if (it.theoLo && !lo) { const c = Object.values(L[it.ma] || {}).filter(x => x.ton > 1e-6); if (c.length === 1) lo = c[0].lo; else throw new Error(c.length ? 'Mã có ' + c.length + ' lô còn tồn, ghi rõ số lô.' : 'Mã này hết tồn.'); }
          lot = lotInfo_(it, 'Xuất', { lo }, L, ngay); if (it.theoLo) checkLotOut_(it, lot[0], L, ngay);
          if (!(k > 0)) {
            const tt = ((L[it.ma] || {})[lot[0]] || {}).tyTrong;
            if (!(tt > 0)) throw new Error('Lô ' + (lot[0] || '(chưa có lô)') + ' chưa có tỷ trọng nên không quy lít ra kg được. Ghi số kg hoặc nhờ QC nhập tỷ trọng.');
            k = lit * tt; gc = lit + ' L × TT ' + tt + (gc ? ' · ' + gc : '');
          }
          kgv = Math.round(k * 1e4) / 1e4; sl = Math.round(k / (it.heSo || 1) * 1e4) / 1e4; ct = ml; gc = 'Đóng gói' + (gc ? ' · ' + gc : '');
          const g1 = outGuard_(); outWarn_(g1, it, lot[0], kgv, L, bal, ngay, true); Object.keys(g1.msg).forEach(q => G.msg[q + '#' + ('000' + line).slice(-4)] = 'Dòng ' + line + ' · ' + g1.msg[q]);
        } else {
          loai = 'Kiểm kê'; const t = num_(v(r, 'ton')); if (t < 0) throw new Error('Tồn thực tế không được âm.');
          lot = it.theoLo ? lotInfo_(it, 'Xuất', { lo: v(r, 'lo') }, L, ngay) : ['', '', ''];
          const cur = it.theoLo ? L[it.ma][lot[0]].ton : bal[it.ma].ton;
          sl = t; kgv = Math.round((t - cur) * 1e4) / 1e4; donVi = 'kg';
          if (Math.abs(kgv) < 1e-9) { ok.push({ dong: line, ma: it.ma, lo: lot[0], loai, kg: 0, note: 'khớp sổ, bỏ qua' }); return; }
        }
        const row = [base + 'I' + ('000' + n).slice(-4), now, ngay, loai, it.ma, sl, donVi, kgv, ct.slice(0, 100), ('Nhập Excel' + (gc ? ' · ' + gc : '')).slice(0, 200), me.ten, '', ''].concat(lot).concat([ncc]);
        out.push(row);
        mv.push({ ngay, loai, ma: it.ma, kg: kgv, soLuong: sl, lo: lot[0], nsx: lot[1], hsd: lot[2], trangThai: '', lenh: '' });
        ok.push({ dong: line, ma: it.ma, ten: it.ten, lo: lot[0], loai, sl, donVi, kg: kgv, ct, ncc });
      } catch (e) { err.push({ dong: line, msg: e.message }); }
    });
    if (commit && out.length) {
      outConfirm_(G, me, 'Nhập Excel đóng gói');
      if (kind === 'mua') nccHead_();
      const ph = sheet_(SH.PH); ph.getRange(ph.getLastRow() + 1, 1, out.length, out[0].length).setValues(out);
      if (qcNew.length) { const q = sheet_(SH.QC); q.getRange(q.getLastRow() + 1, 1, qcNew.length, 8).setValues(qcNew); }
      log_(me, 'Nhập Excel (' + kind + ')', out.length + ' dòng', err.length ? err.length + ' dòng lỗi bị bỏ qua' : '');
    }
    return { ok, err, ghi: commit ? out.length : 0, canh: outList_(G) };
  } finally { lock.releaseLock(); }
}

/* ================= HÀNG KHÁCH GỬI / GIA CÔNG ================= */
function getOwnerReport(a, chu, tu, den) {
  const me = auth_(a, [ROLES.QL]);
  if (!isYmd_(tu) || !isYmd_(den)) throw new Error('Chọn khoảng ngày.');
  const items = items_().filter(i => (i.chuHang || 'Asata') === chu && seeItem_(me, i));
  const set = {}; items.forEach(i => set[i.ma] = i);
  const r = {}; items.forEach(i => r[i.ma] = { ma: i.ma, ten: i.ten, nhom: i.nhom, dau: i.dauKy, nhan: 0, sx: 0, xuatKhac: 0, kk: 0 });
  const lenhDung = {};
  moves_().forEach(m => {
    if (m.trangThai || !set[m.ma]) return; const x = r[m.ma];
    const sign = m.loai === 'Nhập' ? 1 : m.loai === 'Xuất' ? -1 : 1;
    if (m.ngay < tu) { x.dau += sign * m.kg; return; }
    if (m.ngay > den) return;
    if (m.loai === 'Nhập') x.nhan += m.kg;
    else if (m.loai === 'Xuất') { if (m.lenh) { x.sx += m.kg; (lenhDung[m.lenh] = lenhDung[m.lenh] || {})[m.ma] = ((lenhDung[m.lenh] || {})[m.ma] || 0) + m.kg; } else x.xuatKhac += m.kg; }
    else x.kk += m.kg;
  });
  const rows = Object.values(r).map(x => Object.assign(x, { cuoi: x.dau + x.nhan - x.sx - x.xuatKhac + x.kk }))
    .filter(x => Math.abs(x.dau) + x.nhan + x.sx + x.xuatKhac + Math.abs(x.kk) > 1e-6)
    .map(x => { ['dau', 'nhan', 'sx', 'xuatKhac', 'kk', 'cuoi'].forEach(k => x[k] = Math.round(x[k] * 1e4) / 1e4); return x; });
  const all = items_(), ten = m => (all.find(i => i.ma === m) || {}).ten || '';
  const lenh = orders_().filter(o => lenhDung[o.so]).map(o => ({ so: o.so, maSP: o.maSP, tenSP: ten(o.maSP), ngayHT: o.ngayHT, trangThai: o.trangThai, slThucTe: o.slThucTe,
    dung: Object.keys(lenhDung[o.so]).map(m => ({ ma: m, kg: Math.round(lenhDung[o.so][m] * 1e4) / 1e4 })) })).sort((p, q) => (p.ngayHT || '').localeCompare(q.ngayHT || ''));
  return { chu, tu, den, rows, lenh };
}

/* ================= HỒ SƠ LÔ: COA / PHIẾU TEST HOÁ LÝ ================= */
const HS_LOAI = ['COA', 'Phiếu KTCL hàng nhập khẩu', 'Phiếu kiểm hoá lý', 'Phiếu kết quả hàm lượng', 'Phiếu test hoá lý', 'Khác'];
/** Loại hồ sơ theo nhóm: nguyên liệu kỹ thuật (tech) và bán thành phẩm. */
const HS_THEO_NHOM = { 'Nguyên liệu': ['COA', 'Phiếu KTCL hàng nhập khẩu', 'Khác'], 'Bán thành phẩm': ['Phiếu kiểm hoá lý', 'Phiếu kết quả hàm lượng', 'Khác'] };
const HS_MIME = { pdf: /^application\/pdf$/, img: /^image\/(jpeg|png|webp|heic|heif)$/, word: /^application\/(msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/ };
const HS_NHAN = { 'COA': ['pdf', 'img'], 'Phiếu KTCL hàng nhập khẩu': ['pdf', 'word', 'img'], 'Phiếu kiểm hoá lý': ['pdf', 'img'], 'Phiếu kết quả hàm lượng': ['pdf', 'img'], 'Phiếu test hoá lý': ['pdf', 'img'], 'Khác': ['pdf', 'img', 'word'] };
const HS_TEN = { 'COA': 'COA', 'Phiếu KTCL hàng nhập khẩu': 'KTCL-NK', 'Phiếu kiểm hoá lý': 'HoaLy', 'Phiếu kết quả hàm lượng': 'HamLuong', 'Phiếu test hoá lý': 'TestHL', 'Khác': 'HS' };
function hoSoCount_() {
  const c = {};
  hsRows_().forEach(r => { const k = str_(r[0]) + '|' + str_(r[1]); if (str_(r[0])) c[k] = (c[k] || 0) + 1; });
  return c;
}
function hoSoOk_(it) { return !!it && it.theoLo && (it.nhom === 'Nguyên liệu' || it.nhom === 'Bán thành phẩm'); }
function getHoSo(a, ma, lo) {
  auth_(a);
  if (!sheet_(SH.HS)) return [];
  return rows_(SH.HS).filter(r => str_(r[0]) === ma && str_(r[1]) === String(lo || '')).map(r => ({
    loai: str_(r[2]), ten: str_(r[3]), link: str_(r[4]), nguoi: str_(r[5]),
    luc: r[6] instanceof Date ? Utilities.formatDate(r[6], tz_(), 'dd/MM/yyyy HH:mm') : str_(r[6]) })).reverse();
}
function coaFolder_() {
  const k = 'Thư mục hồ sơ lô (Drive)';
  const id = str_(settings_raw_(k));
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const f = DriveApp.createFolder('Sổ Kho – Hồ sơ lô (COA, test hoá lý)');
  CD_C = null; const sh = sheet_(SH.CD), rows = rows_(SH.CD), i = rows.findIndex(r => str_(r[0]) === k);
  if (i >= 0) sh.getRange(i + 2, 2).setValue(f.getId()); else sh.appendRow([k, f.getId(), 'Thư mục Drive lưu file COA / phiếu test hoá lý']);
  return f;
}
function uploadHoSo(a, ma, lo, loai, name, mime, b64) {
  const me = auth_(a);
  if (!me.qc) throw new Error('Tài khoản ' + me.ten + ' chưa có quyền QC.');
  const it = items_().find(i => i.ma === ma);
  if (!hoSoOk_(it)) throw new Error('Chỉ đính kèm hồ sơ cho nguyên liệu kỹ thuật và bán thành phẩm theo lô.');
  if ((HS_THEO_NHOM[it.nhom] || HS_LOAI).indexOf(loai) < 0) throw new Error('Loại hồ sơ "' + loai + '" không dùng cho nhóm ' + it.nhom + '.');
  lo = String(lo || '');
  const nhan = HS_NHAN[loai] || ['pdf', 'img'];
  if (!nhan.some(k => HS_MIME[k].test(String(mime || '')))) throw new Error(loai + ': chỉ nhận file ' + nhan.map(k => ({ pdf: 'PDF', img: 'ảnh', word: 'Word' })[k]).join(', ') + '.');
  const bytes = Utilities.base64Decode(String(b64 || ''));
  if (bytes.length > 15 * 1024 * 1024) throw new Error('File lớn quá 15 MB.');
  const ext = (String(name || '').match(/\.[A-Za-z0-9]{2,5}$/) || [mime === 'application/pdf' ? '.pdf' : /word/.test(mime) ? '.docx' : '.jpg'])[0];
  const fname = [HS_TEN[loai] || 'HS', ma, lo || 'chua-co-lo', Utilities.formatDate(new Date(), tz_(), 'yyyyMMdd-HHmm')].join('_').replace(/[\\/:*?"<>|]/g, '-') + ext;
  const file = coaFolder_().createFile(Utilities.newBlob(bytes, mime, fname));
  HS_C = null; sheet_(SH.HS).appendRow([ma, lo, loai, fname, file.getUrl(), me.ten, new Date(), file.getId()]);
  log_(me, 'Đính kèm ' + loai, ma + ' lô ' + (lo || '(chưa có lô)'), fname);
  return getHoSo(a, ma, lo);
}
/** Chạy hàm này MỘT LẦN trong trình chỉnh sửa để cấp quyền lưu file vào Google Drive. */
function capQuyenDrive() { return 'Đã cấp quyền. Thư mục: ' + coaFolder_().getUrl(); }

/* ================= SAO LƯU HẰNG ĐÊM ================= */
const BK_KEEP = 30, BK_HOUR = 1;
function putSetting_(k, v, note) {
  CD_C = null; const sh = sheet_(SH.CD), rows = rows_(SH.CD), i = rows.findIndex(r => str_(r[0]) === k);
  const row = i >= 0 ? i + 2 : (sh.appendRow([k, '', note || '']), sh.getLastRow());
  sh.getRange(row, 2).setNumberFormat('@').setValue(v);
}
function bkFolder_() {
  const k = 'Thư mục sao lưu (Drive)', id = str_(settings_raw_(k));
  if (id) { try { const f = DriveApp.getFolderById(id); if (!f.isTrashed()) return f; } catch (e) {} }
  const f = DriveApp.createFolder('Sổ Kho – Sao lưu hằng ngày');
  putSetting_(k, f.getId(), 'Thư mục Drive chứa bản sao lưu Google Sheet mỗi đêm (giữ ' + BK_KEEP + ' bản gần nhất)');
  return f;
}
/** Chạy tự động mỗi đêm: chép nguyên file Google Sheet vào thư mục sao lưu, giữ 30 bản gần nhất. */
function nightlyBackup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet(), f = bkFolder_(), now = new Date();
  const name = 'Sổ Kho – sao lưu ' + Utilities.formatDate(now, tz_(), 'yyyy-MM-dd HH:mm');
  const c = DriveApp.getFileById(ss.getId()).makeCopy(name, f);
  const all = [], it = f.getFiles(); while (it.hasNext()) all.push(it.next());
  all.sort((p, q) => q.getDateCreated() - p.getDateCreated());
  all.slice(BK_KEEP).forEach(x => { try { x.setTrashed(true); } catch (e) {} });
  putSetting_('Sao lưu gần nhất', Utilities.formatDate(now, tz_(), 'yyyy-MM-dd HH:mm'), 'Tự ghi sau mỗi lần sao lưu');
  return { ten: name, link: c.getUrl(), soBan: Math.min(all.length, BK_KEEP) };
}
function installBackup_(on) {
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === 'nightlyBackup') ScriptApp.deleteTrigger(t); });
  if (on) ScriptApp.newTrigger('nightlyBackup').timeBased().everyDays(1).atHour(BK_HOUR).inTimezone(tz_()).create();
}
/** Chạy một lần trong trình chỉnh sửa để bật sao lưu mỗi đêm. */
function setupBackup() { installBackup_(true); const r = nightlyBackup(); return 'Đã bật sao lưu lúc ' + BK_HOUR + 'h mỗi đêm. Bản đầu tiên: ' + r.ten; }
function getBackupInfo(a) {
  auth_(a, [ROLES.QL]);
  const id = str_(settings_raw_('Thư mục sao lưu (Drive)'));
  let link = '', n = 0;
  if (id) { try { const f = DriveApp.getFolderById(id); link = f.getUrl(); const it = f.getFiles(); while (it.hasNext()) { it.next(); n++; } } catch (e) {} }
  return { bat: ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'nightlyBackup'), gan: str_(settings_raw_('Sao lưu gần nhất')), link, soBan: n, giu: BK_KEEP, gio: BK_HOUR };
}
function backupNow(a) {
  const me = auth_(a, [ROLES.QL]);
  const r = nightlyBackup(); log_(me, 'Sao lưu ngay', r.ten, '');
  return getBackupInfo(a);
}
function setBackup(a, on) {
  const me = auth_(a, [ROLES.QL]);
  installBackup_(!!on); log_(me, on ? 'Bật sao lưu hằng đêm' : 'Tắt sao lưu hằng đêm', '', '');
  return getBackupInfo(a);
}

/* ================= BÀN LÀM VIỆC (biểu đồ trang chủ) ================= */
function getDash(a) {
RC_ = {};
  const me = auth_(a), items = items_(), vis = {}, IM = {};
  items.forEach(i => { IM[i.ma] = i; if (seeItem_(me, i)) vis[i.ma] = 1; });
  const today = Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd'), months = [];
  let y = +today.slice(0, 4), m = +today.slice(5, 7);
  for (let k = 0; k < 12; k++) { months.unshift(y + '-' + ('0' + m).slice(-2)); if (--m === 0) { m = 12; y--; } }
  const idx = {}; months.forEach((x, i) => idx[x] = i);
  const nhap = months.map(() => 0), xuat = months.map(() => 0), top = {};
  const from3 = months[9];
  moves_().forEach(v => {
    if (v.trangThai || !vis[v.ma]) return;
    const i = idx[v.ngay.slice(0, 7)];
    if (v.loai === 'Nhập' && i !== undefined) nhap[i] += v.kg;
    else if (v.loai === 'Xuất') { if (i !== undefined) xuat[i] += v.kg; if (v.ngay.slice(0, 7) >= from3) top[v.ma] = (top[v.ma] || 0) + v.kg; }
  });
  const r = x => Math.round(x * 100) / 100;
  const out = { months, nhap: nhap.map(r), xuat: xuat.map(r),
    top: Object.keys(top).map(k => ({ ma: k, ten: (IM[k] || {}).ten || '', kg: r(top[k]) })).sort((p, q) => q.kg - p.kg).slice(0, 8) };
  if (me.ct) {
    const kg = months.map(() => 0), n = months.map(() => 0);
    orders_().forEach(o => {
      const sp = IM[o.maSP]; if (o.trangThai !== 'Hoàn thành' || !sp || sp.nhom !== 'Bán thành phẩm') return;
      const i = idx[(o.ngayHT || '').slice(0, 7)]; if (i === undefined) return;
      kg[i] += o.slThucTe * (sp.heSo || 1); n[i]++;
    });
    out.sx = { kg: kg.map(r), n };
  }
  return out;
}

/* ================= BÁO CÁO XUẤT NVL THEO NGÀY (file Google Sheet theo mẫu, mỗi ngày 1 file) ================= */
const BC_FOLDER = '1FslKkpj7SeSBBnHj9A1RpB34kGOSSKf0'; // Drive: "Báo cáo xuất NVL hằng ngày"
const BC_TPL = '1HQqzRdho6z8xjwAV6mH6lMuuCD6F_dbhIT4gTgOZocA'; // file mẫu "_MẪU báo cáo xuất NVL (không xoá)"
const BC_KHO = { 'Kho phân bón': 'Kho nguyên liệu phân bón', 'Kho nguyên liệu - dung môi nhũ': 'Kho nguyên liệu dung môi, nhũ', 'Kho nguyên liệu tech': 'Kho nguyên liệu tech' };
function bcKho_(it) {
  if (it.chuHang && it.chuHang !== 'Asata') return 'Kho GC Cty ' + it.chuHang;
  if (it.nhom === 'Bán thành phẩm') return 'Kho bán thành phẩm';
  return BC_KHO[it.kho] || it.kho || (it.nhom === 'Phân bón' ? 'Kho nguyên liệu phân bón' : '');
}
/** Các dòng xuất NVL trong ngày: NL tech, phụ gia/dung môi, phân bón (mọi phiếu xuất) + BTP đưa vào phối trộn lệnh SX. Bỏ nước, bỏ đóng gói. */
function bcDong_(ngay) {
  const items = items_(), IM = {}, kt = khongTon_(); items.forEach(i => IM[i.ma] = i);
  const mv = moves_().map((m, i) => Object.assign({ row: i }, m)).filter(m => !m.trangThai);
  const run = {}, ts = {}; items.forEach(i => run[i.ma] = i.dauKy || 0);
  mv.slice().sort((a, b) => a.ngay < b.ngay ? -1 : a.ngay > b.ngay ? 1 : a.row - b.row).forEach(m => {
    run[m.ma] = (run[m.ma] || 0) + (m.loai === 'Xuất' ? -m.kg : m.kg); ts[m.row] = Math.round(run[m.ma] * 1e4) / 1e4; });
  const NVL = ['Nguyên liệu', 'Phụ gia / dung môi', 'Phân bón'], L = [];
  mv.forEach(m => {
    if (m.ngay !== ngay || m.loai !== 'Xuất' || kt[m.ma]) return;
    const it = IM[m.ma]; if (!it) return;
    if (!(NVL.indexOf(it.nhom) >= 0 || (it.nhom === 'Bán thành phẩm' && m.lenh))) return;
    if (/^Đóng gói/.test(m.ghiChu || '')) return;
    const g = []; if (m.lo) g.push('Lô ' + m.lo);
    if (m.ghiChu && m.ghiChu !== 'Xuất cho lệnh SX') g.push(m.ghiChu.replace('Xuất nội bộ · ', ''));
    L.push({ row: m.row, kho: bcKho_(it), ma: m.ma, ten: it.ten, dv: m.donVi || it.donVi, sl: m.soLuong, ton: ts[m.row], lenh: m.lenh || m.chungTu, ghi: g.join(' · ') });
  });
  const first = {}; L.forEach(l => { if (!(l.lenh in first)) first[l.lenh] = l.row; });
  L.sort((a, b) => first[a.lenh] - first[b.lenh] || a.row - b.row);
  return L;
}
/** Tạo (hoặc tạo lại) file Phieu_xuat_kho_DD.MM.YYYY trong thư mục báo cáo. ngay: 'yyyy-MM-dd', bỏ trống = hôm nay. */
function baoCaoXuatNVL(ngay) {
  ngay = (typeof ngay === 'string' && ngay) || Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd');
  const L = bcDong_(ngay), p = ngay.split('-'), ten = 'Phieu_xuat_kho_' + p[2] + '.' + p[1] + '.' + p[0];
  const folder = DriveApp.getFolderById(BC_FOLDER);
  const old = folder.getFilesByName(ten);
  while (old.hasNext()) { const f = old.next(); if (f.getMimeType() === MimeType.GOOGLE_SHEETS) f.setTrashed(true); }
  if (!L.length) return { ngay: ngay, so: 0 };
  const file = DriveApp.getFileById(BC_TPL).makeCopy(ten, folder), ss = SpreadsheetApp.openById(file.getId()), sh = ss.getSheets()[0];
  const extra = Math.max(0, L.length - 9);
  if (extra) { const h = sh.getRowHeight(14); sh.insertRowsAfter(14, extra); sh.setRowHeights(15, extra, h); sh.getRange(14, 1, 1, 10).copyFormatToRange(sh, 1, 10, 15, 14 + extra); }
  sh.getRange(6, 1, L.length, 10).setValues(L.map((l, k) => [k + 1, l.kho, l.ma, l.ten, l.dv, l.sl, l.sl, l.ton, l.lenh, l.ghi]));
  sh.getRange('B4').setValue('Ngày xuất kho: ' + p[2] + '/' + p[1] + '/' + p[0]);
  SpreadsheetApp.flush();
  return { ngay: ngay, so: L.length, url: ss.getUrl() };
}
/** Chạy tự động mỗi chiều: lập file hôm nay và lập lại file hôm qua (để có cả phiếu ghi muộn). */
function baoCaoXuatNVLHangNgay() {
  const t = new Date();
  baoCaoXuatNVL(Utilities.formatDate(new Date(t.getTime() - 864e5), tz_(), 'yyyy-MM-dd'));
  baoCaoXuatNVL(Utilities.formatDate(t, tz_(), 'yyyy-MM-dd'));
}
/** Chạy 1 lần: lập lại toàn bộ từ 07/10/2026 đến hôm nay. */
function baoCaoXuatNVLTu0710() {
  const out = [], end = Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd');
  for (let d = new Date(2026, 9, 7, 12); ; d = new Date(d.getTime() + 864e5)) {
    const s = Utilities.formatDate(d, tz_(), 'yyyy-MM-dd'); if (s > end) break;
    const r = baoCaoXuatNVL(s); out.push(s + ': ' + r.so + ' dòng');
  }
  Logger.log(out.join('\n')); return out;
}
/** Chạy 1 lần: cài lịch tự lập báo cáo lúc khoảng 18:30 mỗi ngày. */
function caiLichBaoCaoXuatNVL() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'baoCaoXuatNVLHangNgay').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('baoCaoXuatNVLHangNgay').timeBased().everyDays(1).atHour(18).nearMinute(30).inTimezone('Asia/Ho_Chi_Minh').create();
  return 'ok';
}



/* ================= LỆNH ĐÓNG GÓI THÀNH PHẨM =================
 * QuyCachDG: quy cách đóng gói theo mã nhãn (quét từ thư mục 3-NHÃN: mã chai, hộp, thùng, nhãn phụ, tem…)
 * LenhDG   : kế hoạch đóng gói của từng lệnh (BTP + bao bì dự kiến). Lệnh vẫn nằm trong LenhSX (mã SP = TP.<mã QC>).
 * Bao bì (nhãn, chai, thùng, tem) và mã thành phẩm được tự tạo trong VatTu khi lập lệnh lần đầu. */
const QCDG_SH = 'QuyCachDG', LDG_SH = 'LenhDG';
const dgCode_ = s => String(s || '').trim().toUpperCase().replace(/·/g, '.').replace(/\s+/g, '').replace(/[^A-Z0-9_.+\-]/g, '');
function qcRows_() {
  if (!sheet_(QCDG_SH)) return [];
  return rows_(QCDG_SH).filter(r => str_(r[0])).map(r => ({
    qc: str_(r[0]), nhan: str_(r[1]), sp: str_(r[2]), btp: str_(r[3]).split('|').map(x => x.trim()).filter(String),
    quyCach: str_(r[4]), luong: num_(r[5]), dvl: str_(r[6]), loai: str_(r[7]), chai: str_(r[8]), moTaChai: str_(r[9]),
    hop: str_(r[10]), dvHop: num_(r[11]), thung: str_(r[12]), dvThung: num_(r[13]), nhanPhu: str_(r[14]), temChai: str_(r[15]),
    tcg: str_(r[16]), tcb: num_(r[17]), dai: str_(r[18]), bangKeo: str_(r[19]), pp: str_(r[20]), anh: str_(r[21]), bang: str_(r[22]),
    nguon: str_(r[23]), ghiChu: str_(r[24]), gom: str_(r[25]), tl: num_(r[26]) || '', ds: num_(r[27]) || '', klBB: num_(r[28]) || ''
  }));
}
function ldgSheet_() { return shX_(LDG_SH, ['Số lệnh', 'Mã QC', 'Kế hoạch (JSON)', 'Người lập', 'Thời điểm']); }
function ldgMap_() { const o = {}; if (!sheet_(LDG_SH)) return o; rows_(LDG_SH).forEach(r => { const so = str_(r[0]); if (!so) return; let p = {}; try { p = JSON.parse(str_(r[2]) || '{}'); } catch (e) {} o[so] = Object.assign({ qc: str_(r[1]) }, p); }); return o; }
/** Danh mục quy cách + kế hoạch các lệnh đóng gói (cho tab Lệnh đóng gói TP). */
function getDG(a) { needCT_(auth_(a)); return { qc: qcRows_(), lenh: ldgMap_(), dl: dlRows_() }; }

function createPackOrder(a, o) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]); needCT_(me);
  const so = String(o.so || '').trim(), dv = Math.round(num_(o.dv) * 1000) / 1000;
  if (!so) throw new Error('Nhập số lệnh.');
  if (!isYmd_(o.ngay)) throw new Error('Ngày ra lệnh không hợp lệ.');
  if (!(dv > 0)) throw new Error('Số lượng đóng gói phải lớn hơn 0.');
  if (o.fix && typeof o.fix === 'object') qcFix_(o.qc, o.fix);
const q = qcRows_().find(x => x.qc === o.qc);
  if (!q) throw new Error('Không tìm thấy quy cách ' + o.qc + ' trong trang QuyCachDG.');
  const btp = (o.btp || []).filter(b => b && b.ma);
  if (!btp.length) throw new Error('Chọn bán thành phẩm đem đóng gói.');
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const all = orders_(), trung = all.find(x => x.so.toLowerCase() === so.toLowerCase());
    if (trung && trung.trangThai !== 'Đã huỷ') throw new Error('Số lệnh ' + so + ' đã tồn tại (' + trung.trangThai + ').');
    if (trung) { let ten = trung.so + ' (huỷ)', k = 2; while (all.some(x => x.so === ten)) ten = trung.so + ' (huỷ ' + k++ + ')'; sheet_(SH.LX).getRange(orderRow_(trung.so), 1).setValue(ten); }
    let items = items_(); const has = m => items.some(i => i.ma === m), vt = sheet_(SH.VT), moi = [];
    btp.forEach(b => { if (!has(b.ma)) throw new Error('Không có mã BTP ' + b.ma + ' trong danh mục.'); });
    const tp = 'TP.' + dgCode_(q.qc), heSo = Math.round(num_(o.heSo) * 1e6) / 1e6 || 1;
    if (!has(tp)) {
      const loai = q.loai || 'chai';
      vt.appendRow([tp, (q.sp + ' · ' + q.nhan + ' · ' + (q.quyCach || loai)).slice(0, 150), 'Thành phẩm', loai, heSo, 0, 0, 'Có', 24, '', '', 'Kho thành phẩm']);
      moi.push(tp);
    }
    (o.lines || []).forEach(l => {
      const ma = String(l.ma || '').trim(); if (!ma || has(ma) || moi.indexOf(ma) >= 0) return;
      if (!/^BB\./.test(ma)) throw new Error('Không có mã vật tư ' + ma);
      vt.appendRow([ma, String(l.ten || ma).slice(0, 150), 'Bao bì', 'cái', 1, 0, 0, '', '', '', '', 'Kho bao bì']); moi.push(ma);
    });
    lxHead_();
    sheet_(SH.LX).appendRow([so, o.ngay, tp, dv, 'Đang SX', '', '', me.ten, '', String(o.ghiChu || '').slice(0, 200), String(o.khachHang || '').slice(0, 150), String(o.nguoiSX || '').slice(0, 200), '', num_(o.tt) || '']);
    const plan = { thung: num_(o.thung), le: num_(o.le), dv: dv, tt: num_(o.tt), btp: btp.map(b => ({ ma: b.ma, lo: String(b.lo || ''), kg: Math.round(num_(b.kg) * 10000) / 10000 })),
      lines: (o.lines || []).filter(l => l.ma).map(l => ({ ma: String(l.ma), ten: String(l.ten || '').slice(0, 120), sl: num_(l.sl), per: l.per || '' })), x: o.x || null };
    ldgSheet_().appendRow([so, q.qc, JSON.stringify(plan), me.ten, new Date()]);
    log_(me, 'Lập lệnh đóng gói', so, q.qc + ' · ' + dv + ' ' + (q.loai || '') + (moi.length ? ' · tạo mã mới: ' + moi.join(', ') : ''));
    return { so: so, tp: tp, moi: moi };
  } finally { lock.releaseLock(); }
}

function completePackOrder(a, so, d) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]); needCT_(me);
  if (!isYmd_(d.ngay)) throw new Error('Ngày hoàn thành không hợp lệ.');
  const dv = Math.round(num_(d.dv) * 1000) / 1000;
  if (!(dv > 0)) throw new Error('Nhập số lượng thành phẩm thực tế.');
  checkLock_(d.ngay);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const row = orderRow_(so), o = orders_().find(x => x.so === so);
    if (o.trangThai !== 'Đang SX') throw new Error('Lệnh ' + so + ' không ở trạng thái đang đóng gói.');
    const items = items_(), find = m => items.find(i => i.ma === m), sp = find(o.maSP);
    if (!sp) throw new Error('Thành phẩm ' + o.maSP + ' không còn trong danh mục.');
    const now = new Date(), base = Utilities.formatDate(now, tz_(), 'yyMMddHHmmss');
    const cfg = settings_(), mv0 = moves_(), L = lots_(items, mv0, cfg), B = balances_(items, mv0), G = outGuard_(a), out = [];
    (d.lines || []).forEach((l, k) => {
      const sl = num_(l.sl), it = find(l.ma);
      if (!it) throw new Error('Không có mã vật tư ' + l.ma);
      if (sl < 0) throw new Error('Số lượng xuất của ' + l.ma + ' không được âm.');
      if (!sl) return;
      if (it.theoLo) checkLotOut_(it, String(l.lo || '').trim(), L, d.ngay);
      const lotX = lotInfo_(it, 'Xuất', l, L, d.ngay), kgX = Math.round(sl * it.heSo * 10000) / 10000;
      outWarn_(G, it, lotX[0], kgX, L, B, d.ngay);
      out.push([base + 'X' + k, now, d.ngay, 'Xuất', it.ma, sl, it.donVi, kgX, so, 'Xuất cho lệnh đóng gói', me.ten, '', so].concat(lotX));
    });
    if (!out.length) throw new Error('Chưa nhập số lượng BTP, bao bì thực tế đã xuất.');
    outConfirm_(G, me, 'Hoàn thành lệnh đóng gói ' + so);
    const spLot = lotInfo_(sp, 'Nhập', { lo: String(d.lo || '').trim() || so, nsx: d.nsx }, L, d.ngay);
    out.push([base + 'N', now, d.ngay, 'Nhập', sp.ma, dv, sp.donVi, Math.round(dv * sp.heSo * 10000) / 10000, so, 'Nhập thành phẩm từ lệnh đóng gói', me.ten, '', so].concat(spLot));
    const ph = sheet_(SH.PH); ph.getRange(ph.getLastRow() + 1, 1, out.length, out[0].length).setValues(out);
    try { bbZero_(d.ngay, so, me.ten); } catch (e) { console.warn('bbZero_ ' + e); }
    const lx = sheet_(SH.LX); lx.getRange(row, 5, 1, 3).setValues([['Hoàn thành', d.ngay, dv]]); lx.getRange(row, 9).setValue(me.ten);
    if (d.nguoiSX !== undefined) { lxHead_(); lx.getRange(row, 12).setValue(String(d.nguoiSX || '').slice(0, 200)); }
    log_(me, 'Hoàn thành lệnh đóng gói', so, sp.ma + ' · ' + dv + ' ' + sp.donVi + ' · lô ' + spLot[0] + ' · xuất ' + (out.length - 1) + ' dòng');
    return { xuat: out.length - 1 };
  } finally { lock.releaseLock(); }
}


/** Bao bì chưa cập nhật tồn thực tế: vẫn ghi xuất để giữ lịch sử, nhưng tồn không để âm — tự thêm dòng Kiểm kê đưa tồn về 0. */
function bbZero_(ngay, ct, ten) {
const items = items_(), B = balances_(items, moves_()), now = new Date(), base = Utilities.formatDate(now, tz_(), 'yyMMddHHmmss'), out = [];
items.forEach((it, k) => {
if (it.nhom !== 'Bao bì') return;
const x = B[it.ma]; if (!x || x.kt || !(x.ton < -1e-9)) return;
const thieu = Math.round(-x.ton / (it.heSo || 1) * 1000) / 1000;
const row = [base + 'Z' + k, now, ngay, 'Kiểm kê', it.ma, 0, 'kg', Math.round(-x.ton * 10000) / 10000, ct || 'ĐC-BB-0', 'Tự đưa tồn bao bì về 0 (chưa cập nhật tồn thực tế) · xuất vượt tồn ' + thieu + ' ' + it.donVi, ten || 'Hệ thống', '', ''];
while (row.length < 17) row.push('');
out.push(row);
});
if (out.length) { const ph = sheet_(SH.PH); ph.getRange(ph.getLastRow() + 1, 1, out.length, 17).setValues(out); }
return out.length;
}
/** Chạy tay: đưa mọi mã bao bì đang âm về 0. */
function bbResetAm() { return bbZero_(Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd'), 'ĐC-BB-0', 'Hệ thống'); }

/** Bổ sung quy cách còn thiếu (từ form đóng gói) vào trang QuyCachDG. */
function qcFix_(qc, f) {
  const sh = sheet_(QCDG_SH); if (!sh || sh.getLastRow() < 2) return;
  const v = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues(), i = v.findIndex(r => str_(r[0]) === qc); if (i < 0) return;
  const r = i + 2, col = { luong: 6, dvl: 7, loai: 8, chai: 9, hop: 11, dvHop: 12, thung: 13, dvThung: 14 };
  Object.keys(col).forEach(k => { const val = f[k]; if (val === undefined || val === null || String(val).trim() === '') return;
    const c = sh.getRange(r, col[k]); if (str_(c.getValue())) return; c.setValue(['luong', 'dvHop', 'dvThung'].indexOf(k) >= 0 ? num_(val) : String(val).trim()); });
}

/** Ghi nhận đóng gói đã xong: lập lệnh + hoàn thành ngay (xuất BTP theo cân, xuất bao bì, nhập thành phẩm). */
function packDone(a, o) {
  const so = String(o.so || '').trim(); if (!so) throw new Error('Nhập số lệnh đóng gói.');
  const ex = orders_().find(x => x.so === so && x.trangThai === 'Đang SX');
  if (!(ex && ldgMap_()[so])) createPackOrder(a, o);
  const r = completePackOrder(a, so, { ngay: o.ngayHT || o.ngay, dv: o.dv, lo: o.loTP, nsx: o.ngayHT || o.ngay, nguoiSX: o.nguoiSX || '', lines: o.xuat || [] });
  return { so: so, xuat: r.xuat };
}


/** Lưu lệnh đóng gói (nhập như bảng theo dõi): tạo mới hoặc cập nhật lệnh đang mở; Hoàn thành thì trừ kho luôn. */
function savePack(a, o) {
  const so = String(o.so || '').trim(); if (!so) throw new Error('Nhập số lệnh đóng gói.');
  const ex = orders_().find(x => x.so === so && x.trangThai === 'Đang SX');
  if (ex && ldgMap_()[so]) updatePack_(a, so, o); else createPackOrder(a, o);
  if (!o.hoanThanh) return { so: so };
  const r = completePackOrder(a, so, { ngay: o.ngayHT || o.ngay, dv: o.dv, lo: o.loTP, nsx: o.ngayHT || o.ngay, nguoiSX: o.nguoiSX || '', lines: o.xuat || [] });
  return { so: so, xuat: r.xuat };
}
function updatePack_(a, so, o) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]); needCT_(me);
  const dv = Math.round(num_(o.dv) * 1000) / 1000; if (!(dv > 0)) throw new Error('Số lượng đóng gói phải lớn hơn 0.');
  if (o.ngay && !isYmd_(o.ngay)) throw new Error('Ngày bắt đầu không hợp lệ.');
  if (o.fix && typeof o.fix === 'object') qcFix_(o.qc, o.fix);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const items = items_(), has = m => items.some(i => i.ma === m), vt = sheet_(SH.VT);
    (o.lines || []).forEach(l => { const ma = String(l.ma || '').trim(); if (!ma || has(ma) || !/^BB\./.test(ma)) return;
      vt.appendRow([ma, String(l.ten || ma).slice(0, 150), 'Bao bì', 'cái', 1, 0, 0, '', '', '', '', 'Kho bao bì']); items.push({ ma: ma }); });
    const row = orderRow_(so), lx = sheet_(SH.LX); lxHead_();
    if (o.ngay) lx.getRange(row, 2).setValue(o.ngay);
    lx.getRange(row, 4).setValue(dv);
    lx.getRange(row, 10, 1, 3).setValues([[String(o.ghiChu || '').slice(0, 200), String(o.khachHang || '').slice(0, 150), String(o.nguoiSX || '').slice(0, 200)]]);
    if (num_(o.tt)) lx.getRange(row, 14).setValue(num_(o.tt));
    const plan = { thung: num_(o.thung), le: num_(o.le), dv: dv, tt: num_(o.tt), btp: (o.btp || []).filter(b => b && b.ma).map(b => ({ ma: b.ma, lo: String(b.lo || ''), kg: Math.round(num_(b.kg) * 10000) / 10000 })),
      lines: (o.lines || []).filter(l => l.ma).map(l => ({ ma: String(l.ma), ten: String(l.ten || '').slice(0, 120), sl: num_(l.sl), per: l.per || '' })), x: o.x || null };
    const sh = ldgSheet_(), v = sh.getRange(1, 1, sh.getLastRow(), 1).getValues(); let r = -1;
    for (let i = v.length - 1; i >= 1; i--) if (str_(v[i][0]) === so) { r = i + 1; break; }
    if (r > 0) sh.getRange(r, 3).setValue(JSON.stringify(plan)); else sh.appendRow([so, o.qc, JSON.stringify(plan), me.ten, new Date()]);
    log_(me, 'Sửa lệnh đóng gói', so, dv + ' · ' + ((o.x && o.x.st) || ''));
  } finally { lock.releaseLock(); }
}



/* ===== GHI + TẢI LẠI TRONG 1 LẦN GỌI: lưu phiếu xong trả luôn dữ liệu mới, máy không phải gọi getData lần nữa (nhanh hơn ~2–4 giây mỗi lần lưu) ===== */
const RUNW_OK_ = { 'createPackOrder': 1, 'completePackOrder': 1, 'packDone': 1, 'savePack': 1, 'saveMove': 1, 'deleteMove': 1, 'updateMove': 1, 'saveItem': 1, 'deleteItem': 1, 'createOrder': 1, 'updateOrderInfo': 1, 'cancelOrder': 1, 'reopenOrder': 1, 'completeOrder': 1, 'saveRecipe': 1, 'setHamLuongXn': 1, 'setQC': 1, 'setTyTrong': 1, 'setQCPhieu': 1, 'transferStock': 1, 'saveXNB': 1, 'adjustXNB': 1, 'cancelXNB': 1, 'importRows': 1, 'setLock': 1 };
function runW(fn, args) {
  if (!RUNW_OK_[fn]) throw new Error('Không hỗ trợ: ' + fn);
  args = args || [];
  const res = globalThis[fn].apply(null, args);
  let d = null;
  try { CD_C = null; ND_C = null; HS_C = null; KT_CACHE_ = null; RC_ = null; SpreadsheetApp.flush(); d = getData(args[0]); } catch (e) { d = null; }
  return { r: res === undefined ? null : res, d: d };
}


