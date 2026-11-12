/* ================= KẾ HOẠCH PHỐI TRỘN (bản web) =================
 * Mỗi kế hoạch gắn với 1 lệnh SX BTP: ngày phối trộn, máy, giờ, ưu tiên, người phối chế, QC theo dõi.
 * Trang KeHoachPT: 1 dòng / kế hoạch. Trang MayMoc: danh mục máy phối trộn.
 * Trạng thái hiển thị = lệnh SX (Hoàn thành / Đã huỷ) + tiến độ kế hoạch (Tạo mới → Đã gửi → Đang SX). */
const KH_SH = 'KeHoachPT', MAY_SH = 'MayMoc';
const KH_HEAD = ['ID', 'Số lệnh', 'Ngày phối trộn', 'Máy', 'Giờ bắt đầu', 'Giờ kết thúc', 'Ưu tiên', 'Phối chế 1', 'Phối chế 2', 'QC theo dõi',
  'Trạng thái', 'Gửi lúc', 'Bắt đầu thực tế', 'Kết thúc thực tế', 'Ghi chú', 'Người lập', 'Lúc lập', 'Người gửi'];
const MAY_HEAD = ['Mã máy', 'Tên máy', 'Dạng BTP', 'Ghi chú', 'Ngừng dùng'];
const KH_UU = ['Gấp', 'Cao', 'Bình thường', 'Thấp'];
const khTs_ = v => v instanceof Date ? Utilities.formatDate(v, tz_(), 'yyyy-MM-dd HH:mm') : str_(v);
const khHm_ = v => v instanceof Date ? Utilities.formatDate(v, tz_(), 'HH:mm') : str_(v);
function khRows_() { return sheet_(KH_SH) ? rows_(KH_SH) : []; }
function khObj_(r) {
  return { id: str_(r[0]), so: str_(r[1]), ngay: str_(r[2]), may: str_(r[3]), bd: khHm_(r[4]), kt: khHm_(r[5]), uuTien: str_(r[6]) || 'Bình thường',
    pc1: str_(r[7]), pc2: str_(r[8]), qc: str_(r[9]), tt: str_(r[10]) || 'Tạo mới', gui: khTs_(r[11]), bdTT: khTs_(r[12]), ktTT: khTs_(r[13]),
    ghiChu: str_(r[14]), nguoiLap: str_(r[15]), lap: khTs_(r[16]), nguoiGui: str_(r[17]) };
}
function mayList_() {
  return (sheet_(MAY_SH) ? rows_(MAY_SH) : []).filter(r => str_(r[0])).map(r => ({ ma: str_(r[0]), ten: str_(r[1]), dang: str_(r[2]), ghiChu: str_(r[3]), ngung: str_(r[4]) === 'Có' }));
}
function webKHGet(a) {
  auth_(a);
  const kh = khRows_().filter(r => str_(r[0])).map(khObj_).filter(x => x.tt !== 'Đã xoá');
  const g = lxGoiY_(orders_());
  const vs = vsAll_().map(v => ({ so: v.so, lenh: v.lenh, kq: v.kq, may: v.tb.map(t => t.ma).filter(String) }));
  return { kh, vs, may: mayList_(), nsx: g.nsx, qc: g.qc };
}
function khRow_(id) {
  const R = khRows_(), i = R.findIndex(r => str_(r[0]) === String(id || ''));
  if (i < 0) throw new Error('Không tìm thấy kế hoạch (có thể đã bị xoá). Tải lại trang.');
  return { row: i + 2, o: khObj_(R[i]) };
}
function webKHSave(a, d) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]); needCT_(me);
  d = d || {};
  if (!isYmd_(d.ngay)) throw new Error('Chọn ngày phối trộn.');
  const hm = v => { v = String(v || '').trim(); if (v && !/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) throw new Error('Giờ ghi dạng HH:mm, VD 07:30.'); return v; };
  const bd = hm(d.bd), kt = hm(d.kt);
  if (bd && kt && kt <= bd) throw new Error('Giờ kết thúc phải sau giờ bắt đầu.');
  const cut = (v, n) => String(v || '').trim().slice(0, n);
  const so = cut(d.so, 100);
  if (!so) throw new Error('Ghi số lệnh.');
  if (d.moi) createOrder(a, { so, ngay: d.ngay, maSP: d.maSP, slDuKien: d.slDuKien, khachHang: d.khachHang, tyTrong: d.tyTrong,
    ghiChu: cut(d.ghiChu, 200), nguoiSX: [d.pc1, d.pc2].map(x => cut(x, 80)).filter(String).join(', '), qcSX: cut(d.qc, 80) });
  const od = orders_().find(x => x.so === so);
  if (!od) throw new Error('Không tìm thấy lệnh ' + so + '.');
  if (od.trangThai === 'Đã huỷ') throw new Error('Lệnh ' + so + ' đã huỷ.');
  const uu = KH_UU.indexOf(d.uuTien) >= 0 ? d.uuTien : 'Bình thường';
  const vals = [cut(d.may, 200), bd, kt, uu, cut(d.pc1, 80), cut(d.pc2, 80), cut(d.qc, 80)];
  const sh = shX_(KH_SH, KH_HEAD);
  let id = String(d.id || '');
  if (id) {
    const k = khRow_(id);
    sh.getRange(k.row, 2, 1, 9).setValues([[so, d.ngay].concat(vals)]);
    sh.getRange(k.row, 15).setValue(cut(d.ghiChu, 300));
    if (k.o.tt === 'Đã gửi') sh.getRange(k.row, 11).setValue('Sửa sau khi gửi');
    log_(me, 'Sửa kế hoạch phối trộn', so, d.ngay + ' · ' + (vals[0] || 'chưa chọn máy') + ' · ' + (bd || '?') + '–' + (kt || '?'));
  } else {
    if (khRows_().some(r => str_(r[1]) === so && str_(r[10]) !== 'Đã xoá')) throw new Error('Lệnh ' + so + ' đã có kế hoạch. Bấm vào kế hoạch đó để sửa.');
    id = 'KH' + Utilities.formatDate(new Date(), tz_(), 'yyMMddHHmmss') + Math.floor(Math.random() * 90 + 10);
    sh.appendRow([id, so, d.ngay].concat(vals).concat(['Tạo mới', '', '', '', cut(d.ghiChu, 300), me.ten, new Date(), '']));
    log_(me, 'Lập kế hoạch phối trộn', so, od.maSP + ' · ' + d.ngay + ' · ' + (vals[0] || 'chưa chọn máy') + ' · ' + (bd || '?') + '–' + (kt || '?'));
  }
  // người phối chế / QC ghi luôn lên lệnh SX (in thẻ nhận diện BTP)
  if (od.trangThai === 'Đang SX') {
    const nsx = [d.pc1, d.pc2].map(x => cut(x, 80)).filter(String).join(', ');
    if (nsx || d.qc) { lxHead_(); const row = orderRow_(so), lx = sheet_(SH.LX); if (nsx) lx.getRange(row, 12).setValue(nsx.slice(0, 200)); if (d.qc) lx.getRange(row, 13).setValue(cut(d.qc, 80)); }
  }
  return id;
}
/** Gửi kế hoạch: đánh dấu Đã gửi + giờ gửi (xưởng xem ở mục Hôm nay / Ngày mai). */
function webKHGui(a, ids) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]); needCT_(me);
  const sh = sheet_(KH_SH); if (!sh) throw new Error('Chưa có kế hoạch nào.');
  let n = 0; const now = new Date(), so = [];
  (ids || []).forEach(id => { const k = khRow_(id); if (k.o.bdTT) return; sh.getRange(k.row, 11, 1, 2).setValues([['Đã gửi', now]]); sh.getRange(k.row, 18).setValue(me.ten); so.push(k.o.so); n++; });
  if (n) log_(me, 'Gửi kế hoạch phối trộn', n + ' lệnh', so.join(', ').slice(0, 900));
  return n;
}
/** act: bd (bắt đầu), kt (kết thúc phối trộn), huybd (bỏ ghi bắt đầu), xoa (xoá kế hoạch, giữ lệnh SX). */
function webKHAct(a, id, act) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]); needCT_(me);
  const sh = sheet_(KH_SH), k = khRow_(id), now = new Date();
  if (act === 'bd') { sh.getRange(k.row, 11).setValue('Đang SX'); sh.getRange(k.row, 13).setValue(now); }
  else if (act === 'kt') { if (!k.o.bdTT) sh.getRange(k.row, 13).setValue(now); sh.getRange(k.row, 14).setValue(now); sh.getRange(k.row, 11).setValue('Xong phối trộn'); }
  else if (act === 'huybd') { sh.getRange(k.row, 13, 1, 2).setValues([['', '']]); sh.getRange(k.row, 11).setValue(k.o.gui ? 'Đã gửi' : 'Tạo mới'); }
  else if (act === 'xoa') { if ([ROLES.QL, ROLES.KT].indexOf(me.vaiTro) < 0 && k.o.nguoiLap !== me.ten) throw new Error('Chỉ Quản lý, Kế toán hoặc người lập mới xoá được.'); sh.getRange(k.row, 11).setValue('Đã xoá'); }
  else throw new Error('Thao tác không hợp lệ.');
  log_(me, { bd: 'Bắt đầu phối trộn', kt: 'Kết thúc phối trộn', huybd: 'Bỏ ghi bắt đầu phối trộn', xoa: 'Xoá kế hoạch phối trộn' }[act], k.o.so, Utilities.formatDate(now, tz_(), 'dd/MM/yyyy HH:mm'));
  return true;
}
/** Danh mục máy: ghi đè cả danh sách (Quản lý). */
function webMaySave(a, list) {
  const me = auth_(a, [ROLES.QL]);
  const clean = (list || []).map(m => [String(m.ma || '').trim().slice(0, 40), String(m.ten || '').trim().slice(0, 120), String(m.dang || '').trim().slice(0, 60), String(m.ghiChu || '').trim().slice(0, 200), m.ngung ? 'Có' : '']).filter(r => r[0]);
  const seen = {}; clean.forEach(r => { const k = r[0].toUpperCase(); if (seen[k]) throw new Error('Trùng mã máy ' + r[0]); seen[k] = 1; if (!r[1]) throw new Error('Ghi tên máy cho mã ' + r[0]); });
  const sh = shX_(MAY_SH, MAY_HEAD), old = Math.max(0, sh.getLastRow() - 1);
  if (old) sh.getRange(2, 1, old, 5).clearContent();
  if (clean.length) sh.getRange(2, 1, clean.length, 5).setValues(clean);
  log_(me, 'Sửa danh mục máy', clean.length + ' máy', clean.map(r => r[0]).join(', ').slice(0, 900));
  return mayList_();
}

/* ================= BIÊN BẢN SẢN XUẤT BTP (BM.06-QC-QT.03) =================
 * Trang BienBanSX: Số lệnh | Mẻ (JSON [{ngay, nguoi, kg}]) | Kết luận | Ghi chú | Người cập nhật | Lúc cập nhật */
const BB_SH = 'BienBanSX', BB_HEAD = ['Số lệnh', 'Mẻ (JSON)', 'Kết luận', 'Ghi chú', 'Người cập nhật', 'Lúc cập nhật', 'Máy', 'Thời gian (JSON)'];
const BB_KL = ['Đạt - Chuyển lưu kho BTP', 'Đạt - Chờ phối trộn', 'Phối lại', 'Chưa đạt - Chờ xử lý'];
function webBBGet(a, so) {
  needCT_(auth_(a));
  const od = orders_().find(x => x.so === so); if (!od) throw new Error('Không tìm thấy lệnh ' + so);
  const IM = {}; items_().forEach(i => IM[i.ma] = i);
  const mv = moves_().filter(m => m.lenh === so && !m.trangThai);
  const nl = mv.filter(m => m.loai === 'Xuất' && (IM[m.ma] || {}).nhom === 'Nguyên liệu').map(m => ({ ma: m.ma, ten: (IM[m.ma] || {}).ten || '', lo: m.lo, kg: m.kg }));
  const nh = mv.find(m => m.loai === 'Nhập');
  const lo = nh ? nh.lo : so, k = khRows_().map(khObj_).find(x => x.so === so && x.tt !== 'Đã xoá') || null;
  const r = (sheet_(BB_SH) ? rows_(BB_SH) : []).find(x => str_(x[0]) === so);
  let me = []; try { me = r ? JSON.parse(str_(r[1]) || '[]') : []; } catch (e) { me = []; }
  const q = qcMap_()[lotKey_(od.maSP, lo)] || null, tt = ttMap_()[lotKey_(od.maSP, lo)] || od.tyTrong || 0;
  return { o: od, lo, nsx: nh ? nh.nsx : '', nl, kh: k, may: mayList_(), qc: q, tt,
    bb: r ? { me, ketLuan: str_(r[2]), ghiChu: str_(r[3]), nguoi: str_(r[4]), luc: khTs_(r[5]), may: str_(r[6]), tg: (() => { try { return JSON.parse(str_(r[7]) || 'null'); } catch (e) { return null; } })() } : null, ketLuan: BB_KL };
}
function webBBSave(a, so, d) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]); needCT_(me);
  if (!orders_().some(x => x.so === so)) throw new Error('Không tìm thấy lệnh ' + so);
  const hm = v => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v || '')) ? String(v) : '';
  const mes = (d.me || []).map(m => ({ ngay: isYmd_(m.ngay) ? m.ngay : '', tu: hm(m.tu), den: hm(m.den), nguoi: String(m.nguoi || '').trim().slice(0, 120), kg: num_(m.kg) || 0 })).filter(m => m.ngay || m.nguoi || m.kg || m.tu).slice(0, 30);
  const kl = BB_KL.indexOf(d.ketLuan) >= 0 ? d.ketLuan : '';
  const sh = shX_(BB_SH, BB_HEAD), R = rows_(BB_SH), i = R.findIndex(x => str_(x[0]) === so);
  const row = [so, JSON.stringify(mes), kl, String(d.ghiChu || '').trim().slice(0, 300), me.ten, new Date(), String(d.may || '').trim().slice(0, 300), JSON.stringify((t => ({ bdN: isYmd_(t.bdN) ? t.bdN : '', bdG: hm(t.bdG), htN: isYmd_(t.htN) ? t.htN : '', htG: hm(t.htG) }))(d.tg || {}))];
  if (i >= 0) sh.getRange(i + 2, 1, 1, 8).setValues([row]); else sh.appendRow(row);
  log_(me, 'Biên bản SX BTP', so, mes.length + ' mẻ · ' + (kl || 'chưa kết luận'));
  return true;
}

/* ================= THẺ NHẬN DIỆN BTP (BM.07-QC-QT.03): lưu danh sách phuy / tank theo lệnh ================= */
const TND_SH = 'TheNhanDien', TND_HEAD = ['Số lệnh', 'Dữ liệu (JSON)', 'Người lưu', 'Thời điểm'];
function webTNDGet(a, so) {
  auth_(a); if (!sheet_(TND_SH)) return null;
  const r = rows_(TND_SH).find(x => str_(x[0]) === String(so || '')); if (!r) return null;
  let d = null; try { d = JSON.parse(str_(r[1]) || 'null'); } catch (e) { d = null; }
  return d ? { d, nguoi: str_(r[2]), luc: khTs_(r[3]) } : null;
}
function webTNDSave(a, so, d) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]);
  so = String(so || '').trim(); if (!orders_().some(x => x.so === so)) throw new Error('Không tìm thấy lệnh ' + so);
  d = d || {}; const t = v => String(v == null ? '' : v).trim().slice(0, 60), n = v => (v === '' || v == null) ? '' : (num_(v) || 0);
  const L = (d.list || []).slice(0, 300).map(c => ({ me: t(c.me), loai: t(c.loai), bi: n(c.bi), net: n(c.net), le: c.le ? 1 : 0 }));
  if (!L.length) throw new Error('Chưa có thẻ nào.');
  const o = { list: L, tm: t(d.tm), nc: Math.min(3, Math.max(1, Math.round(num_(d.nc) || 1))), hl: String(d.hl || '').trim().slice(0, 300),
    dang: d.dang === 'ran' || d.dang === 'long' ? d.dang : '', kho: d.kho === 'a5r' || d.kho === 'a6' ? d.kho : '' }; /* dạng rắn / lỏng · khổ thẻ A6 (bao) / A5 (rum) */
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try { const sh = shX_(TND_SH, TND_HEAD), R = rows_(TND_SH), i = R.findIndex(x => str_(x[0]) === so), row = [so, JSON.stringify(o), me.ten, new Date()];
    if (i >= 0) sh.getRange(i + 2, 1, 1, 4).setValues([row]); else sh.appendRow(row); } finally { lock.releaseLock(); }
  log_(me, 'Thẻ nhận diện BTP', so, L.length + ' thẻ');
  return { d: o, nguoi: me.ten, luc: new Date() };
}

/* ================= PHIẾU KIỂM NGHIỆM HOÁ LÝ BTP (BM.08-QC-QT.03) =================
 * Trang PhieuHoaLy: Số phiếu | Mã BTP | Số lô | Ngày kiểm | Dạng | Kết quả (JSON) | Kết luận | Nhận xét | Người thực hiện | Lúc | Trạng thái
 * Phiếu Đạt tự ghi vào hồ sơ lô (loại "Phiếu kiểm hoá lý", link #hl:<số phiếu>) → lô hiện ĐÃ CÓ và QC duyệt Đạt được. */
const PHL_SH = 'PhieuHoaLy', PHL_HEAD = ['Số phiếu', 'Mã BTP', 'Số lô', 'Ngày kiểm', 'Dạng', 'Kết quả (JSON)', 'Kết luận', 'Nhận xét', 'Người thực hiện', 'Lúc', 'Trạng thái'];
const PHL_KL = ['Đạt', 'Không đạt'];
function phlObj_(r) { let kq = {}; try { kq = JSON.parse(str_(r[5]) || '{}'); } catch (e) {}
  return { so: str_(r[0]), ma: str_(r[1]), lo: str_(r[2]), ngay: str_(r[3]), dang: str_(r[4]), kq, ketLuan: str_(r[6]), nhanXet: str_(r[7]), nguoi: str_(r[8]), luc: khTs_(r[9]), tt: str_(r[10]) }; }
function phlRows_() { return sheet_(PHL_SH) ? rows_(PHL_SH) : []; }
function webHLGet(a, ma, lo, so) {
  auth_(a); lo = String(lo || '');
  const L = phlRows_().map(phlObj_).filter(x => x.so && x.tt !== 'Đã xoá');
  const p = so ? L.find(x => x.so === so) : L.filter(x => x.ma === ma && x.lo === lo).pop();
  if (p) { ma = p.ma; lo = p.lo; }
  const it = items_().find(i => i.ma === ma) || null;
  const nh = moves_().find(m => m.ma === ma && m.lo === lo && m.loai === 'Nhập' && !m.trangThai);
  const od = orders_().find(x => x.so === lo) || null;
  const nam = Utilities.formatDate(new Date(), tz_(), 'yyyy');
  let mx = 0; L.forEach(x => { const m = new RegExp('^CL-' + nam + '-(\\d+)$').exec(x.so); if (m) mx = Math.max(mx, +m[1]); });
  // mức yêu cầu TCCS (khoá '#...') lấy theo phiếu gần nhất của cùng sản phẩm
  const muc = {}; L.filter(x => x.ma === ma).forEach(x => Object.keys(x.kq || {}).forEach(k => { if (k[0] === '#') muc[k] = x.kq[k]; }));
  return { muc, p: p || null, ma, lo, it, nsx: nh ? (nh.nsx || nh.ngay) : (od ? (od.ngayHT || od.ngay) : ''), soMoi: 'CL-' + nam + '-' + String(mx + 1).padStart(3, '0'), tt: ttMap_()[lotKey_(ma, lo)] || (od ? od.tyTrong : 0) || 0 };
}
function webHLSave(a, d) {
  const me = auth_(a);
  if (!me.qc) throw new Error('Tài khoản ' + me.ten + ' chưa có quyền QC.');
  const it = items_().find(i => i.ma === d.ma);
  if (!it || it.nhom !== 'Bán thành phẩm') throw new Error('Chọn bán thành phẩm.');
  const lo = String(d.lo || '').trim(); if (!lo) throw new Error('Ghi số lô.');
  if (!isYmd_(d.ngay)) throw new Error('Ngày kiểm nghiệm không hợp lệ.');
  const so = String(d.so || '').trim().slice(0, 40); if (!so) throw new Error('Ghi số phiếu.');
  const kl = PHL_KL.indexOf(d.ketLuan) >= 0 ? d.ketLuan : '';
  const kq = {}; Object.keys(d.kq || {}).forEach(k => { const v = String(d.kq[k] == null ? '' : d.kq[k]).trim().slice(0, 500); if (v) kq[String(k).slice(0, 10)] = v; });
  const sh = shX_(PHL_SH, PHL_HEAD), R = phlRows_();
  // đổi số phiếu: phiếu cũ (soCu) mang số mới, cập nhật luôn liên kết trong hồ sơ lô
  const cu = String(d.soCu || '').trim();
  if (cu && cu !== so) {
    if (R.some(r => str_(r[0]) === so && str_(r[10]) !== 'Đã xoá')) throw new Error('Số phiếu ' + so + ' đã có. Chọn số khác.');
    const k = R.findIndex(r => str_(r[0]) === cu && str_(r[10]) !== 'Đã xoá');
    if (k >= 0) { sh.getRange(k + 2, 1).setValue(so); R[k][0] = so;
      const H0 = sheet_(SH.HS) ? rows_(SH.HS) : [], j0 = H0.findIndex(r => str_(r[4]) === '#hl:' + cu);
      if (j0 >= 0) { sheet_(SH.HS).getRange(j0 + 2, 5).setValue('#hl:' + so); HS_C = null; } }
  }
  const i = R.findIndex(r => str_(r[0]) === so && str_(r[10]) !== 'Đã xoá');
  if (i >= 0 && (str_(R[i][1]) !== it.ma || str_(R[i][2]) !== lo)) throw new Error('Số phiếu ' + so + ' đã dùng cho lô khác.');
  const row = [so, it.ma, lo, d.ngay, String(d.dang || '').slice(0, 20), JSON.stringify(kq), kl, String(d.nhanXet || '').trim().slice(0, 500), me.ten, new Date(), ''];
  if (i >= 0) sh.getRange(i + 2, 1, 1, 11).setValues([row]); else sh.appendRow(row);
  // hồ sơ lô: phiếu Đạt → "Phiếu kiểm hoá lý"; không đạt → đổi loại để không tính là đã có phiếu đạt
  const link = '#hl:' + so, H = sheet_(SH.HS) ? rows_(SH.HS) : [], j = H.findIndex(r => str_(r[4]) === link);
  const loai = kl === 'Đạt' ? 'Phiếu kiểm hoá lý' : 'Khác', ten = 'BM.08 · ' + so + (kl ? ' · ' + kl : '') + ' (phiếu trên phần mềm)';
  HS_C = null;
  if (j >= 0) sheet_(SH.HS).getRange(j + 2, 3, 1, 2).setValues([[loai, ten]]);
  else if (kl === 'Đạt') sheet_(SH.HS).appendRow([it.ma, lo, loai, ten, link, me.ten, new Date(), '']);
  if (d.kq && d.kq['3']) { const t = num_(String(d.kq['3']).replace(',', '.')); if (t >= 0.3 && t <= 3) { try { setTyTrong(a, it.ma, lo, t); } catch (e) {} } }
  log_(me, 'Phiếu kiểm hoá lý BTP', it.ma + ' lô ' + lo + ' · ' + so, kl || 'chưa kết luận');
  return so;
}

/* ===== BM.05-QC-QT.03 BIÊN BẢN VỆ SINH THIẾT BỊ KHUẤY TRỘN =====
 * 1 phiếu / lần vệ sinh sau lệnh vừa chạy. Thiết bị lấy từ biên bản SX (BM.06) hoặc kế hoạch phối trộn của lệnh.
 * Thiết bị (JSON): [{ma, ten, quet, nuoc, dm}] — quet/nuoc/dm: 1 = đã thực hiện, 0 = không thực hiện. */
const VS_SH = 'VeSinhTB', VS_HEAD = ['Số phiếu', 'Lệnh vừa chạy', 'BTP vừa chạy', 'Lệnh sẽ chạy', 'BTP sẽ chạy', 'Ngày', 'Giờ', 'Thiết bị (JSON)', 'Dung môi tráng', 'Ghi chú', 'Kết quả', 'Người lập', 'Lúc', 'Trạng thái'];
function vsObj_(r) { let tb = []; try { tb = JSON.parse(str_(r[7]) || '[]'); } catch (e) { tb = []; }
  return { so: str_(r[0]), lenh: str_(r[1]), sp: str_(r[2]), lenhSau: str_(r[3]), spSau: str_(r[4]), ngay: str_(r[5]), gio: khHm_(r[6]), tb, dm: str_(r[8]), ghiChu: str_(r[9]), kq: str_(r[10]), nguoi: str_(r[11]), luc: khTs_(r[12]), tt: str_(r[13]) }; }
function vsAll_() { return (sheet_(VS_SH) ? rows_(VS_SH) : []).filter(r => str_(r[0])).map(vsObj_).filter(x => x.tt !== 'Đã xoá'); }
const khCodes_ = s => String(s || '').split(',').map(x => x.trim()).filter(String);
const khKey_ = k => (k.bdTT || ((k.ngay || '') + ' ' + (k.bd || '00:00')));
function lenhMay_(so, k) {
  const r = (sheet_(BB_SH) ? rows_(BB_SH) : []).find(x => str_(x[0]) === so), M = {}; mayList_().forEach(m => M[m.ma] = m.ten);
  if (r && str_(r[6])) { try { const a = JSON.parse(str_(r[6])); if (a && a.length) return a.filter(x => x && (x.ma || x.ten)).map(x => ({ ma: str_(x.ma), ten: str_(x.ten) || M[x.ma] || '' })); } catch (e) {} }
  return khCodes_(k && k.may).map(ma => ({ ma, ten: M[ma] || '' }));
}
function webVSGet(a, lenh, so) {
  auth_(a);
  const V = vsAll_(), p = so ? V.find(x => x.so === so) : null; if (p) lenh = p.lenh;
  const od = orders_().find(x => x.so === lenh); if (!od) throw new Error('Không tìm thấy lệnh ' + lenh);
  const KH = khRows_().filter(r => str_(r[0])).map(khObj_).filter(x => x.tt !== 'Đã xoá');
  const k = KH.find(x => x.so === lenh) || null, tb = lenhMay_(lenh, k), codes = tb.map(t => t.ma).filter(String);
  const OD = {}; orders_().forEach(o => OD[o.so] = o);
  const sau = KH.filter(x => x.so !== lenh && OD[x.so] && OD[x.so].trangThai !== 'Đã huỷ' && (!k || khKey_(x) > khKey_(k)) && khCodes_(x.may).some(c => codes.indexOf(c) >= 0))
    .sort((x, y) => khKey_(x) < khKey_(y) ? -1 : 1).slice(0, 8).map(x => ({ so: x.so, maSP: OD[x.so].maSP, ngay: x.ngay, bd: x.bd }));
  const nam = Utilities.formatDate(new Date(), tz_(), 'yyyy'); let mx = 0;
  V.forEach(x => { const m = new RegExp('^VS-' + nam + '-(\\d+)$').exec(x.so); if (m) mx = Math.max(mx, +m[1]); });
  return { o: od, kh: k, tb, sau, p: p || V.filter(x => x.lenh === lenh).pop() || null, soMoi: 'VS-' + nam + '-' + String(mx + 1).padStart(3, '0'), may: mayList_() };
}
function webVSSave(a, d) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]);
  d = d || {};
  const so = String(d.so || '').trim().slice(0, 40); if (!so) throw new Error('Ghi số phiếu.');
  const od = orders_().find(x => x.so === d.lenh); if (!od) throw new Error('Không tìm thấy lệnh ' + d.lenh);
  if (!isYmd_(d.ngay)) throw new Error('Ngày thực hiện không hợp lệ.');
  const gio = String(d.gio || '').trim(); if (gio && !/^([01]\d|2[0-3]):[0-5]\d$/.test(gio)) throw new Error('Giờ ghi dạng HH:mm.');
  const kq = ['Đạt', 'Không đạt'].indexOf(d.kq) >= 0 ? d.kq : '';
  if (kq && !me.qc) throw new Error('Chỉ QC được kết luận kết quả vệ sinh.');
  const b = v => v ? 1 : 0, tb = (d.tb || []).slice(0, 30).map(t => ({ ma: String(t.ma || '').trim().slice(0, 30), ten: String(t.ten || '').trim().slice(0, 120), quet: b(t.quet), nuoc: b(t.nuoc), dm: b(t.dm) })).filter(t => t.ma || t.ten);
  if (!tb.length) throw new Error('Chưa có vị trí / thiết bị vệ sinh.');
  const sau = d.lenhSau ? orders_().find(x => x.so === d.lenhSau) : null;
  const sh = shX_(VS_SH, VS_HEAD), R = sheet_(VS_SH) ? rows_(VS_SH) : [], i = R.findIndex(r => str_(r[0]) === so && str_(r[13]) !== 'Đã xoá');
  if (i >= 0 && str_(R[i][1]) !== od.so) throw new Error('Số phiếu ' + so + ' đã dùng cho lệnh khác.');
  const row = [so, od.so, od.maSP, sau ? sau.so : '', sau ? sau.maSP : '', d.ngay, gio, JSON.stringify(tb), String(d.dm || '').trim().slice(0, 100), String(d.ghiChu || '').trim().slice(0, 300), kq, me.ten, new Date(), ''];
  if (i >= 0) sh.getRange(i + 2, 1, 1, VS_HEAD.length).setValues([row]); else sh.appendRow(row);
  log_(me, 'Biên bản vệ sinh thiết bị', od.so + ' · ' + so, kq || 'chưa kết luận');
  return so;
}

/* ===== BIỂU MẪU ĐÓNG GÓI (QC-QT.04): BM.04/BM.06 kiểm tra quá trình, BM.05 thông tin đóng gói, BM.07 vệ sinh thiết bị đóng gói =====
 * 1 dòng / phiếu. Dữ liệu chi tiết lưu JSON. BM.02 (kế hoạch kiểm tra hằng ngày) và BM.08 (báo cáo chất lượng TP) lập tự động từ lệnh đóng gói + các phiếu này. */
const DGF_SH = 'BieuMauDG', DGF_HEAD = ['ID', 'Loại', 'Số lệnh', 'Ngày', 'Dữ liệu (JSON)', 'Kết luận', 'Người lập', 'Lúc', 'Trạng thái'], DGF_LOAI = ['BM04', 'BM05', 'BM06', 'BM07'];
function dgfAll_() { return (sheet_(DGF_SH) ? rows_(DGF_SH) : []).filter(r => str_(r[0]) && str_(r[8]) !== 'Đã xoá').map(r => { let d = {}; try { d = JSON.parse(str_(r[4]) || '{}'); } catch (e) {}
  return { id: str_(r[0]), loai: str_(r[1]), so: str_(r[2]), ngay: str_(r[3]), d, kl: str_(r[5]), nguoi: str_(r[6]), luc: khTs_(r[7]) }; }); }
function dgfDel_(so) { return (sheet_(DGF_SH) ? rows_(DGF_SH) : []).filter(r => str_(r[0]) && str_(r[2]) === so && str_(r[8]) === 'Đã xoá').map(r => ({ id: str_(r[0]), loai: str_(r[1]), ngay: str_(r[3]), kl: str_(r[5]), nguoi: str_(r[6]), luc: khTs_(r[7]) })); }
function webDGFGet(a, so) {
  { const me = auth_(a); if (!me.ct && !ldgMap_()[so]) needCT_(me); }
  const od = orders_().find(x => x.so === so); if (!od) throw new Error('Không tìm thấy lệnh ' + so);
  const P = ldgMap_()[so] || {}, q = qcRows_().find(x => x.qc === P.qc) || null, TT = ttMap_(), mv = moves_();
  const btp = (P.btp || []).map(b => { const nh = mv.find(m => m.ma === b.ma && m.lo === b.lo && m.loai === 'Nhập' && !m.trangThai), it = items_().find(i => i.ma === b.ma) || {};
    return { ma: b.ma, ten: it.ten || '', lo: b.lo, kg: b.kg, nsx: nh ? (nh.nsx || nh.ngay) : '', tt: TT[lotKey_(b.ma, b.lo)] || 0 }; });
  // lệnh đóng gói trước / sau (gợi ý BTP vừa chạy, sẽ chạy cho BM.07)
  const all = orders_().filter(x => x.trangThai !== 'Đã huỷ' && /^TP\./.test(x.maSP || '')).sort((x, y) => (x.ngay + x.so < y.ngay + y.so ? -1 : 1)), i = all.findIndex(x => x.so === so);
  return { o: od, P, q, btp, forms: dgfAll_().filter(x => x.so === so), xoa: dgfDel_(so), may: mayList_(), truoc: i > 0 ? all[i - 1].so : '', sau: i >= 0 && i < all.length - 1 ? all[i + 1].so : '' };
}
function webDGFAll(a, tu, den) {
  auth_(a); // biểu mẫu đóng gói: ai đăng nhập cũng xem được
  return dgfAll_().filter(x => (!tu || x.ngay >= tu) && (!den || x.ngay <= den)).map(x => ({ id: x.id, loai: x.loai, so: x.so, ngay: x.ngay, kl: x.kl, may: (x.d && (x.d.mayTen || x.d.may)) || '', maMay: (x.d && x.d.maMay) || '', dlSrc: (x.d && x.d.dlSrc) || '' }));
}
function webDGFSave(a, d) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]); needCT_(me);
  d = d || {};
  if (DGF_LOAI.indexOf(d.loai) < 0) throw new Error('Loại biểu mẫu không hợp lệ.');
  const od = orders_().find(x => x.so === d.so); if (!od) throw new Error('Không tìm thấy lệnh ' + d.so);
  if (!isYmd_(d.ngay)) throw new Error('Ngày không hợp lệ.');
  const kl = ['Đạt', 'Không đạt'].indexOf(d.kl) >= 0 ? d.kl : '';
  if (kl && (d.loai === 'BM04' || d.loai === 'BM06' || d.loai === 'BM07') && !me.qc) throw new Error('Chỉ QC được kết luận.');
  const js = JSON.stringify(d.data || {}); if (js.length > 45000) throw new Error('Phiếu quá dài.');
  const sh = shX_(DGF_SH, DGF_HEAD), R = sheet_(DGF_SH) ? rows_(DGF_SH) : [];
  let id = String(d.id || ''), i = id ? R.findIndex(r => str_(r[0]) === id) : -1;
  if (id && i < 0) throw new Error('Không tìm thấy phiếu (có thể đã bị xoá).');
  if (!id) id = d.loai + '-' + Utilities.formatDate(new Date(), tz_(), 'yyMMddHHmmss') + Math.floor(Math.random() * 90 + 10);
  const row = [id, d.loai, od.so, d.ngay, js, kl, me.ten, new Date(), ''];
  if (i >= 0) sh.getRange(i + 2, 1, 1, DGF_HEAD.length).setValues([row]); else sh.appendRow(row);
  log_(me, 'Biểu mẫu đóng gói ' + d.loai, od.so + ' · ' + id, kl || 'chưa kết luận');
  return id;
}
/* Xoá mềm (giữ dữ liệu, khôi phục được). Quản lý, Kế toán hoặc chính người lập phiếu. */
function webDGFDel(a, id) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]);
  const R = sheet_(DGF_SH) ? rows_(DGF_SH) : [], i = R.findIndex(r => str_(r[0]) === id); if (i < 0) throw new Error('Không tìm thấy phiếu.');
  if ([ROLES.QL, ROLES.KT].indexOf(me.vaiTro) < 0 && str_(R[i][6]) !== me.ten) throw new Error('Chỉ người lập phiếu (' + str_(R[i][6]) + ') hoặc Quản lý mới xoá được phiếu này.');
  sheet_(DGF_SH).getRange(i + 2, 9).setValue('Đã xoá'); log_(me, 'Xoá biểu mẫu đóng gói', str_(R[i][2]) + ' · ' + id, str_(R[i][1]) + ' ngày ' + str_(R[i][3])); return id;
}
function webDGFRestore(a, id) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]);
  const R = sheet_(DGF_SH) ? rows_(DGF_SH) : [], i = R.findIndex(r => str_(r[0]) === id); if (i < 0) throw new Error('Không tìm thấy phiếu.');
  if (str_(R[i][8]) !== 'Đã xoá') return id;
  if ([ROLES.QL, ROLES.KT].indexOf(me.vaiTro) < 0 && str_(R[i][6]) !== me.ten) throw new Error('Chỉ người lập phiếu (' + str_(R[i][6]) + ') hoặc Quản lý mới khôi phục được phiếu này.');
  sheet_(DGF_SH).getRange(i + 2, 9).setValue(''); log_(me, 'Khôi phục biểu mẫu đóng gói', str_(R[i][2]) + ' · ' + id, str_(R[i][1]) + ' ngày ' + str_(R[i][3])); return id;
}


/* ================= DANH MỤC QUY CÁCH ĐÓNG GÓI (QuyCachDG): thêm mã nhãn / mã quy cách mới, sửa thông số =================
 * Cột 1–26 như cũ; thêm 27 TL thuốc chuẩn (g) · 28 Dung sai (± g) · 29 KL bao bì (g) — theo phiếu thông tin đóng gói của R&D (BM.05-QC-QT.04). */
const QC_HEAD_ = ['Mã QC', 'Mã nhãn', 'Sản phẩm', 'Mã BTP (mặc định)', 'Quy cách', 'Lượng / đơn vị', 'ĐVT lượng', 'Loại bao bì', 'Mã chai / can / xô', 'Mô tả chai', 'Mã hộp', 'Đơn vị / hộp', 'Mã thùng', 'Đơn vị / thùng', 'Nhãn phụ', 'Tem dán chai', 'Tem chống giả', 'Tem cảnh báo / thùng', 'Đai thùng', 'Băng keo', 'Phân phối', 'Ảnh nhãn (file ID)', 'Bảng thông tin (file ID)', 'Nguồn', 'Ghi chú / cần kiểm', 'Gồm mã nhãn (cặp đôi)', 'TL thuốc chuẩn (g)', 'Dung sai (± g)', 'KL bao bì (g)'];
const QC_KEY_ = ['qc', 'nhan', 'sp', 'btp', 'quyCach', 'luong', 'dvl', 'loai', 'chai', 'moTaChai', 'hop', 'dvHop', 'thung', 'dvThung', 'nhanPhu', 'temChai', 'tcg', 'tcb', 'dai', 'bangKeo', 'pp', 'anh', 'bang', 'nguon', 'ghiChu', 'gom', 'tl', 'ds', 'klBB'];
const QC_NUM_ = { luong: 1, dvHop: 1, dvThung: 1, tcb: 1, tl: 1, ds: 1, klBB: 1 };
/** o: {qc, ...trường}; o.sua = true để ghi đè mã đã có (chỉ các trường gửi lên). Trả lại danh mục mới. */
function webQCSave(a, o) {
  const me = auth_(a, [ROLES.QL, ROLES.KT]); needCT_(me);
  o = o || {}; const qc = String(o.qc || '').trim().slice(0, 60);
  if (!qc) throw new Error('Nhập mã quy cách (mã QC).');
  if (!/^[A-Za-z0-9][A-Za-z0-9 ._·+\-()]*$/.test(qc)) throw new Error('Mã quy cách chỉ gồm chữ, số, dấu - . + ·');
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = shX_(QCDG_SH, QC_HEAD_), n = QC_HEAD_.length;
    const h = sh.getRange(1, 1, 1, n).getValues()[0];
    if (QC_HEAD_.some((t, i) => !str_(h[i]))) sh.getRange(1, 1, 1, n).setValues([QC_HEAD_.map((t, i) => str_(h[i]) || t)]);
    const last = sh.getLastRow(), ids = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().map(r => str_(r[0]).toUpperCase()) : [];
    const i = ids.indexOf(qc.toUpperCase());
    const val = k => { let v = o[k]; if (k === 'btp' && Array.isArray(v)) v = v.join(' | ');
      if (v === undefined || v === null) return undefined; v = String(v).trim();
      if (QC_NUM_[k]) { if (v === '') return ''; const x = num_(v.replace(',', '.')); if (!(x >= 0)) throw new Error('Số không hợp lệ ở ' + QC_HEAD_[QC_KEY_.indexOf(k)]); return x; }
      return v.slice(0, 300); };
    if (i < 0) {
      if (!str_(o.sp)) throw new Error('Nhập tên sản phẩm.');
      if (!(num_(o.luong) > 0)) throw new Error('Nhập lượng / đơn vị (VD 18).');
      const row = QC_KEY_.map(k => k === 'qc' ? qc : (k === 'nhan' ? (val('nhan') || qc.split('·')[0]) : (val(k) === undefined ? '' : val(k))));
      if (!row[23]) row[23] = 'Nhập tay ' + Utilities.formatDate(new Date(), tz_(), 'dd/MM/yyyy') + ' · ' + me.ten;
      sh.getRange(last + 1, 1, 1, n).setValues([row]);
      log_(me, 'Thêm quy cách đóng gói', qc, [row[2], row[4], row[12], row[13]].join(' · '));
    } else {
      if (!o.sua) throw new Error('Mã ' + qc + ' đã có trong danh mục. Chọn “Sửa” để cập nhật.');
      const r = i + 2, cur = sh.getRange(r, 1, 1, n).getValues()[0];
      QC_KEY_.forEach((k, j) => { if (j === 0) return; const v = val(k); if (v !== undefined) cur[j] = v; });
      sh.getRange(r, 1, 1, n).setValues([cur]);
      log_(me, 'Sửa quy cách đóng gói', qc, [cur[2], cur[4], cur[12], cur[13]].join(' · '));
    }
  } finally { lock.releaseLock(); }
  return qcRows_();
}

/* ===== Bảng định lượng QC-QĐ.04 (mục 5.1) — sửa trên phần mềm, BM.05 tự lấy ===== */
const DL_EDITOR_ = 'Nguyễn Ô Ghel', DL_SH = 'DinhLuongQD04', DL_HEAD_ = ['Sản phẩm', 'Quy cách', 'ĐVT', 'Mức dưới', 'Mức chuẩn', 'Mức trên', 'Ghi chú'];
/* Số liệu gốc theo QC-QĐ.04 lần ban hành 01 (11/08/2025) — dùng khi chưa có trang tính */
const DL_DEF_ = [
 ['Atoxa 250SC',100,'ml',99,102,104],['Foszatin 10.5GR',1000,'g',990,1000,1010],['Foszatin 10.5GR',500,'g',495,500,505],
 ['Azomor 300WG',100,'g',99,102,104],['Azomor 300WG',20,'g',20,21,22],['Bostrobin 380SC',200,'ml',198,202,206],['Bostrobin 380SC',100,'ml',99,102,104],
 ['Osaku 435WP',100,'g',99,102,104],['Osaku 435WP',20,'g',20,21,22],['Abi copper 230EC',100,'ml',99,102,104],['Asaquat 200SL',900,'ml',891,900,909],
 ['US-sinate 200SL',4500,'ml',4450,4500,4550],['US-sinate 200SL',900,'ml',891,900,909],['US-sinate 200SL',450,'ml',445,450,455],['US-sinate 200SL',100,'ml',98,100,102],
 ['Ataflu 240SC',100,'ml',99,102,104],['Ataflu 240SC',25,'ml',25,26,27],['Bifenzin 300SC',100,'ml',99,102,104],['Apro 200SC',200,'ml',198,202,206],['Apro 200SC',100,'ml',99,102,104],
 ['Asapyr 300SC',100,'ml',99,102,104],['Asapyr 300SC',20,'ml',20,21,22],
 ['Alupyr 250SC',200,'ml',198,202,206],['Alupyr 250SC',150,'ml',148,151,155],['Alupyr 250SC',100,'ml',99,102,104],['Alupyr 250SC',25,'ml',25,26,27],['Alupyr 250SC',20,'ml',21.5,22.5,23.5],
 ['Asa Ray 350OD',240,'ml',238,243,247],['Asa Ray 350OD',25,'ml',25,26,27],['Aspiro 150OD',200,'ml',198,202,206],['Aspiro 150OD',100,'ml',99,102,104],
 ['Trithizole 325SC',200,'ml',198,202,206],['Trithizole 325SC',100,'ml',99,102,104],['Trithizole 325SC',20,'ml',20,21,22],
 ['Cycozeb 720WP',1000,'g',990,1000,1010],['Cycozeb 720WP',500,'g',495,500,505],['Cycozeb 720WP',450,'g',445,450,455],['Cycozeb 720WP',100,'g',98,100,102],
 ['Parma 3.6EC',450,'ml',440,445,450],['Parma 3.6EC',20,'ml',20,21,22],['Dofamec 177EC',200,'ml',198,202,206],['Dofamec 177EC',100,'ml',99,102,104],
 ['Dofama 77EC',150,'ml',148,151,155],['Dofama 77EC',100,'ml',99,102,104],
 ['Dofama 150WG',50,'g',50,52,54],['Dofama 150WG',12,'g',12.5,13,13.5],['Dofama 150WG',10,'g',10.5,11,11.5],['Dofama 150WG',8,'g',8.5,9,9.5],
 ['Partin 25WP',100,'g',98,100,102],['Party 400WP',65,'g',64,66,68],['Party 400WP',50,'g',49,52,53],['Party 400WP',15,'g',15,16,17],
 ['Dorino 285EC',200,'ml',198,202,206],['Dorino 285EC',180,'ml',178,182,186],['Dorino 285EC',100,'ml',99,102,104],['Dorino 285EC',30,'ml',29,30,31],['Dorino 285EC',25,'ml',26,27,28],
 ['Dofacar 5GR',1000,'g',985,995,1005],['Dorema 200EC',200,'ml',198,202,206],
 ['Dofaben 22EC',450,'ml',445,450,455],['Dofaben 22EC',100,'ml',99,102,104],['Dofaben 22EC',50,'ml',49,51,53],
 ['Dofaben 150WG',50,'g',49,51,53],['Dofaben 150WG',8,'g',8,8.5,9],['Dofaben 150WG',6,'g',6,6.5,7],
 ['Dotrine 0.6SL',200,'ml',198,202,206],['Dotrine 0.6SL',100,'ml',99,102,104],['Dotrine 0.6SL',25,'ml',25,26,27],
 ['Fentinat 48SC',100,'ml',99,102,104],['Fentinat 48SC',18,'ml',18,19,20],['Fentinat 48SC',15,'ml',15.5,16.5,17.5],
 ['Doctor 5SC',1000,'ml',990,1000,1010],['Doctor 5SC',450,'ml',445,450,455],['Doctor 5SC',100,'ml',98,100,102],
 ['Dofazeb 800WP',1000,'g',990,1000,1010],['Dofazeb 800WP',100,'g',98,100,102],['Dofine 0.6SL',250,'ml',245,250,255],['Dofine 0.6SL',240,'ml',235,240,245],
 ['Propytil 250EC',240,'ml',238,243,247],
 ['Dimida 600FS',200,'ml',198,202,206],['Dimida 600FS',180,'ml',178,182,186],['Dimida 600FS',100,'ml',99,102,104],['Dimida 600FS',10,'ml',11,11.5,12],
 ['Thalonil 75WP',500,'g',495,500,505],['Thalonil 75WP',450,'g',445,450,455],['Thalonil 75WP',250,'g',245,250,255],['Thalonil 75WP',100,'g',98,100,102],['Thalonil 75WP',50,'g',48,50,52],['Thalonil 75WP',45,'g',44,46,47],
 ['Forgon 40EC',450,'ml',440,450,455],
 ['Beamvil-super 250SC',250,'ml',245,250,255],['Beamvil-super 250SC',240,'ml',235,240,245],['Beamvil-super 250SC',100,'ml',98,102,102],['Beamvil-super 250SC',25,'ml',25,26,27],
 ['Asmiltatop super 400SC',240,'ml',238,243,247],['Asmiltatop super 400SC',100,'ml',98,100,102],['Asmiltatop super 400SC',15,'ml',15,16,17],
 ['Be-amusa 810WP',100,'g',99,102,104],['Be-amusa 810WP',45,'g',44,46,47],['Be-amusa 810WP',30,'g',29,31,32],['Be-amusa 810WP',20,'g',19,20.5,21],
 ['Antimer-so 800WP',250,'g',248,252,257],['Antimer-so 800WP',100,'g',99,102,104],['Antimer-so 800WP',50,'g',49,51,53],['Antimer-so 800WP',40,'g',39,41,42],
 ['Rildzomigol super 68WG',1000,'g',990,1000,1010],['Rildzomigol super 68WG',500,'g',495,500,505],
 ['Notralis 18GR',800,'g',785,793,800],['Notralis 18GR',400,'g',388,394,400],['Kasugacin 3SL',250,'ml',248,252,257],
 ['Dopha Zn 4',500,'ml',490,500,505],['Asata Combi',500,'ml',490,500,505],['Asata Combi',25,'ml',25,26,27],
 ['Chlorfen Asa 240SC',240,'ml',238,243,247],['Chlorfen Asa 240SC',200,'ml',198,202,206]];
function dlRows_() {
  const R = sheet_(DL_SH) ? rows_(DL_SH).filter(r => str_(r[0])) : DL_DEF_.map(r => r.concat(['']));
  return R.map(r => ({ sp: str_(r[0]), qn: num_(r[1]), dv: str_(r[2]).toLowerCase() === 'g' ? 'g' : 'ml', lo: num_(r[3]), std: num_(r[4]), hi: num_(r[5]), gc: str_(r[6]) }));
}
/** Bảng định lượng: ghi đè cả bảng — chỉ Trưởng phòng QA/QC (DL_EDITOR_). */
function webDLSave(a, list) {
  const me = auth_(a, [ROLES.QL]); needCT_(me);
  if (me.ten !== DL_EDITOR_) throw new Error('Chỉ ' + DL_EDITOR_ + ' (Trưởng phòng QA/QC) mới được sửa bảng định lượng QC-QĐ.04.');
  const clean = (list || []).map(x => [String(x.sp || '').trim().slice(0, 80), num_(x.qn), String(x.dv || '').trim().toLowerCase() === 'g' ? 'g' : 'ml', num_(x.lo), num_(x.std), num_(x.hi), String(x.gc || '').trim().slice(0, 200)]).filter(r => r[0]);
  const seen = {};
  clean.forEach(r => {
    if (!(r[1] > 0)) throw new Error('Ghi quy cách (số) cho ' + r[0]);
    if (!(r[3] > 0 && r[4] > 0 && r[5] > 0)) throw new Error('Ghi đủ mức dưới / chuẩn / trên cho ' + r[0] + ' ' + r[1] + ' ' + r[2]);
    if (!(r[3] <= r[4] && r[4] <= r[5])) throw new Error('Mức dưới ≤ chuẩn ≤ trên: ' + r[0] + ' ' + r[1] + ' ' + r[2]);
    const k = (r[0] + '|' + r[1] + '|' + r[2]).toUpperCase(); if (seen[k]) throw new Error('Trùng dòng ' + r[0] + ' ' + r[1] + ' ' + r[2]); seen[k] = 1;
  });
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = shX_(DL_SH, DL_HEAD_), old = Math.max(0, sh.getLastRow() - 1);
    if (old) sh.getRange(2, 1, old, DL_HEAD_.length).clearContent();
    if (clean.length) sh.getRange(2, 1, clean.length, DL_HEAD_.length).setValues(clean);
    log_(me, 'Sửa bảng định lượng QC-QĐ.04', clean.length + ' dòng', '');
  } finally { lock.releaseLock(); }
  return clean.map(r => ({ sp: r[0], qn: r[1], dv: r[2], lo: r[3], std: r[4], hi: r[5], gc: r[6] }));
}

/* ===== Bảng định lượng QC-QĐ.04 mục 5.2 (hàng gia công — quy tắc theo quy cách danh nghĩa) ===== */
const DL52_SH = 'DinhLuongQD04_52', DL52_HEAD_ = ['Dạng (g/ml)', 'Trên (A >)', 'Đến (A ≤)', 'Kiểu mức dưới (%/đv)', 'Mức dưới', 'Kiểu mức trên (%/đv)', 'Mức trên'];
const DL52_DEF_ = (() => { const R = [];
  [['g', [4, 2], [8, 4]], ['ml', [4, 2], [8, 2]]].forEach(([d, a50, a200]) => {
    [[0, 5, '%', 7, '%', 4], [5, 50, '%', 7, '%', 4], [50, 100, 'đv', a50[0], 'đv', a50[1]], [100, 200, '%', 4, '%', 2], [200, 300, 'đv', a200[0], 'đv', a200[1]], [300, 500, '%', 2, '%', 1],
     [500, 1000, 'đv', 15, 'đv', 5], [1000, 10000, '%', 1, '%', 0.5], [10000, 15000, 'đv', 100, 'đv', 50], [15000, '', '%', 1, '%', 0.5]].forEach(r => R.push([d].concat(r)));
  }); return R; })();
function dl52Rows_() {
  let R = sheet_(DL52_SH) ? rows_(DL52_SH).filter(r => str_(r[0])) : DL52_DEF_;
  /* TT 21/2014 Phụ lục IV: Qn ≤ 5 g/mL không có T (chỉ yêu cầu trung bình ≥ Qn) → QC-QĐ.04 dùng mức kiểm soát nội bộ −7 % / +4 %.
     Bảng đã lưu trước khi có dòng này thì tự thêm vào (lưu bảng lần sau là ghi luôn). */
  ['g', 'ml'].forEach(d => { if (!R.some(r => str_(r[0]).toLowerCase() === d && num_(r[1]) === 0)) R = [[d, 0, 5, '%', 7, '%', 4]].concat(R); });
  R = R.slice().sort((x, y) => (str_(x[0]).toLowerCase() === 'g' ? 0 : 1) - (str_(y[0]).toLowerCase() === 'g' ? 0 : 1) || num_(x[1]) - num_(y[1]));
  return R.map(r => ({ dv: str_(r[0]).toLowerCase() === 'g' ? 'g' : 'ml', tu: num_(r[1]), den: str_(r[2]) === '' ? '' : num_(r[2]), loK: str_(r[3]) === '%' ? '%' : 'đv', lo: num_(r[4]), hiK: str_(r[5]) === '%' ? '%' : 'đv', hi: num_(r[6]) }));
}
function webDL52Save(a, list) {
  const me = auth_(a, [ROLES.QL]); needCT_(me);
  if (me.ten !== DL_EDITOR_) throw new Error('Chỉ ' + DL_EDITOR_ + ' (Trưởng phòng QA/QC) mới được sửa bảng định lượng QC-QĐ.04.');
  const clean = (list || []).map(x => [String(x.dv || '').toLowerCase() === 'g' ? 'g' : 'ml', num_(x.tu), String(x.den == null ? '' : x.den).trim() === '' ? '' : num_(x.den), x.loK === '%' ? '%' : 'đv', num_(x.lo), x.hiK === '%' ? '%' : 'đv', num_(x.hi)]);
  clean.forEach(r => {
    if (!(r[1] >= 0)) throw new Error('Ghi giá trị "Trên" cho mỗi khoảng.');
    if (r[2] !== '' && !(r[2] > r[1])) throw new Error('Khoảng ' + r[1] + ' – ' + r[2] + ' ' + r[0] + ': "Đến" phải lớn hơn "Trên".');
    if (!(r[4] >= 0 && r[6] >= 0)) throw new Error('Ghi mức dưới / mức trên cho khoảng ' + r[1] + ' – ' + (r[2] || '…') + ' ' + r[0]);
  });
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = shX_(DL52_SH, DL52_HEAD_), old = Math.max(0, sh.getLastRow() - 1);
    if (old) sh.getRange(2, 1, old, DL52_HEAD_.length).clearContent();
    if (clean.length) sh.getRange(2, 1, clean.length, DL52_HEAD_.length).setValues(clean);
    log_(me, 'Sửa bảng định lượng QC-QĐ.04 mục 5.2', clean.length + ' khoảng', '');
  } finally { lock.releaseLock(); }
  return clean.map(r => ({ dv: r[0], tu: r[1], den: r[2], loK: r[3], lo: r[4], hiK: r[5], hi: r[6] }));
}

/* ===== Khối lượng bao bì do QC cân (lưu theo mã quy cách, lần cân mới nhất dùng làm mặc định) ===== */
const CBB_SH = 'CanBaoBi', CBB_HEAD_ = ['Mã QC', 'Loại', 'Khối lượng', 'Đơn vị', 'Ngày cân', 'Người cân', 'Số lệnh', 'Thời điểm', 'Loại bao bì tính KL', 'Trạng thái', 'Người xoá / khôi phục', 'Lúc xoá / khôi phục'];
const CBB_LOAI_ = { klBB: 'g', klHop: 'g', klThung: 'kg' };
function cbbRows_() {
  if (!sheet_(CBB_SH)) return [];
  let B5 = null; /* lần cân cũ chưa ghi loại bao bì → lấy theo phiếu BM.05 của lệnh đó */
  const bbOf = so => { if (!B5) { B5 = {}; try { dgfAll_().forEach(f => { if (f.loai === 'BM05' && f.d && f.d.loaiBB) B5[f.so] = f.d.loaiBB; }); } catch (e) {} } return B5[so] || ''; };
  return rows_(CBB_SH).map((r, i) => [r, i]).filter(([r]) => str_(r[0]) && CBB_LOAI_[str_(r[1])]).map(([r, i]) => ({ id: i + 2, qc: str_(r[0]), loai: str_(r[1]), v: num_(r[2]), dv: str_(r[3]), ngay: str_(r[4]), nguoi: str_(r[5]), so: str_(r[6]),
    bb: str_(r[1]) === 'klBB' ? (str_(r[8]) || bbOf(str_(r[6]))) : '', xoa: str_(r[9]) === 'Đã xoá' ? 1 : 0, xNguoi: str_(r[10]), xLuc: r[11] ? khTs_(r[11]) : '' }));
}
/** o: {qc, so, ngay, vals:{klBB, klHop, klThung}} — ghi các lần cân mới; trả lại toàn bộ lịch sử cân. */
function webCanBBSave(a, o) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]); needCT_(me);
  if (!me.qc && [ROLES.QL, ROLES.KT].indexOf(me.vaiTro) < 0) throw new Error('Chỉ QC ghi khối lượng bao bì cân được.');
  o = o || {}; const qc = String(o.qc || '').trim(); if (!qc) throw new Error('Thiếu mã quy cách.');
  const ngay = isYmd_(o.ngay) ? o.ngay : Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd');
  const add = [];
  Object.keys(CBB_LOAI_).forEach(k => { const s = String((o.vals || {})[k] == null ? '' : o.vals[k]).trim(); if (s === '') return; const v = num_(s);
    if (!(v > 0)) throw new Error('Khối lượng không hợp lệ: ' + k); if (k === 'klThung' ? v > 20 : v > 2000) throw new Error('Khối lượng quá lớn, kiểm tra lại đơn vị: ' + k);
    add.push([qc, k, v, CBB_LOAI_[k], ngay, me.ten, String(o.so || '').slice(0, 60), new Date(), k === 'klBB' ? String(o.bb || '').trim().slice(0, 80) : '']); });
  if (add.length) { const lock = LockService.getScriptLock(); lock.waitLock(20000); try { const sh = shX_(CBB_SH, CBB_HEAD_); add.forEach(r => sh.appendRow(r)); } finally { lock.releaseLock(); } }
  return cbbRows_().concat([]);
}
/** Xoá (mềm) / khôi phục 1 lần cân bao bì ghi sai — người cân hoặc Quản lý / Kế toán. */
function webCanBBDel(a, id, khoiPhuc) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]); needCT_(me);
  const sh = sheet_(CBB_SH); if (!sh) throw new Error('Chưa có lịch sử cân bao bì.');
  const R = rows_(CBB_SH), i = Number(id) - 2, r = R[i];
  if (!(i >= 0) || !r || !str_(r[0])) throw new Error('Không tìm thấy lần cân này — tải lại trang rồi thử lại.');
  if (str_(r[5]) !== me.ten && [ROLES.QL, ROLES.KT].indexOf(me.vaiTro) < 0) throw new Error('Chỉ người cân (' + str_(r[5]) + ') hoặc Quản lý / Kế toán được ' + (khoiPhuc ? 'khôi phục.' : 'xoá.'));
  const da = str_(r[9]) === 'Đã xoá'; if (!khoiPhuc && da) throw new Error('Lần cân này đã xoá rồi.'); if (khoiPhuc && !da) throw new Error('Lần cân này chưa bị xoá.');
  sh.getRange(i + 2, 10, 1, 3).setValues([[khoiPhuc ? '' : 'Đã xoá', me.ten, new Date()]]);
  log_(me, khoiPhuc ? 'Khôi phục lần cân bao bì' : 'Xoá lần cân bao bì', str_(r[0]) + ' · ' + str_(r[1]), num_(r[2]) + ' ' + str_(r[3]) + ' ngày ' + str_(r[4]) + ' · ' + str_(r[6]));
  return cbbRows_();
}

/* ================= HỒ SƠ LÔ MỘT CHẠM: truy xuất 1 lô (lên nguồn + xuống nơi dùng) ================= */
function webHoSoLo(a, ma, lo) {
  const me = auth_(a); lo = String(lo || '');
  const items = items_(), IM = {}; items.forEach(i => IM[i.ma] = i);
  if (!IM[ma]) throw new Error('Không có mã ' + ma);
  const all = moves_(), mv = all.filter(m => !m.trangThai), Q = qcMap_(), HL = hlMap_(), cfg = settings_(), L = lots_(items, all, cfg, Q), TT = ttMap_();
  const O = {}; orders_().forEach(o => O[o.so] = o);
  const LD = ldgMap_(), DF = dgfAll_(), HS = sheet_(SH.HS) ? rows_(SH.HS) : [];
  const ct = me.ct;
  const info = (m, l) => {
    const x = (L[m] || {})[l] || {}, q = Q[lotKey_(m, l)] || {}, it = IM[m] || {};
    return { ma: m, ten: it.ten || '', nhom: it.nhom || '', lo: l, nsx: x.nsx || '', hsd: x.hsd || '', ton: Math.round((x.ton || 0) * 1000) / 1000,
      qc: q.tt || x.qc || '', qcNgay: q.ngay || '', qcNguoi: q.nguoi || '', qcGhi: q.ghiChu || '', hl: HL[lotKey_(m, l)] || '', tt: TT[lotKey_(m, l)] || '',
      hs: HS.filter(r => str_(r[0]) === m && str_(r[1]) === l).map(r => ({ loai: str_(r[2]), ten: str_(r[3]), link: str_(r[4]), so: hsSo_(r) })) };
  };
  const ord = so => { const o = O[so]; if (!o) return null; const P = LD[so];
    return { so, ngay: o.ngay, ngayHT: o.ngayHT, maSP: o.maSP, tenSP: (IM[o.maSP] || {}).ten || '', sl: o.trangThai === 'Hoàn thành' ? o.slThucTe : o.slDuKien, trangThai: o.trangThai,
      nguoiLap: o.nguoiLap, nguoiSX: o.nguoiSX, qcSX: o.qcSX, khachHang: o.khachHang, dg: !!P, qcMa: P ? P.qc : '',
      forms: DF.filter(f => f.so === so).map(f => ({ loai: f.loai, ngay: f.ngay, nguoi: f.nguoi, kl: f.kl })) }; };
  /* nguồn: lệnh đã nhập ra lô này → các lô nguyên liệu / BTP / bao bì đã xuất cho lệnh đó */
  const nguon = (m, l, depth) => {
    const nh = mv.filter(x => x.ma === m && x.lo === l && x.loai === 'Nhập' && x.lenh);
    return [...new Set(nh.map(x => x.lenh))].map(so => {
      const o = ord(so); if (!o) return null;
      const X = mv.filter(x => x.lenh === so && x.loai === 'Xuất'), vao = [];
      X.forEach(x => { const it = IM[x.ma] || {}; const r = { ma: x.ma, ten: it.ten || '', nhom: it.nhom || '', lo: x.lo, kg: x.kg, sl: x.soLuong, dv: x.donVi, ngay: x.ngay };
        if (it.nhom === 'Bán thành phẩm' || it.nhom === 'Nguyên liệu') { Object.assign(r, info(x.ma, x.lo), { kg: x.kg }); if (depth > 0 && it.nhom === 'Bán thành phẩm') r.nguon = nguon(x.ma, x.lo, depth - 1); }
        if (!ct && o.dg === false && it.nhom !== 'Bán thành phẩm') return; /* không xem công thức: ẩn nguyên liệu của lệnh SX */
        vao.push(r); });
      return { lenh: o, nhapKg: nh.filter(x => x.lenh === so).reduce((s, x) => s + x.kg, 0), vao };
    }).filter(Boolean);
  };
  /* nơi dùng: lô này đã xuất cho lệnh nào → lệnh đó nhập ra lô thành phẩm / BTP nào */
  const dung = (m, l) => mv.filter(x => x.ma === m && x.lo === l && x.loai === 'Xuất' && x.lenh).map(x => {
    const o = ord(x.lenh), ra = mv.filter(y => y.lenh === x.lenh && y.loai === 'Nhập').map(y => ({ ma: y.ma, ten: (IM[y.ma] || {}).ten || '', lo: y.lo, kg: y.kg, sl: y.soLuong, dv: y.donVi }));
    return { lenh: o, kg: x.kg, ngay: x.ngay, ra };
  });
  const the = mv.filter(x => x.ma === ma && x.lo === lo).sort((p, q) => (p.ngay + p.id < q.ngay + q.id ? -1 : 1))
    .map(x => ({ ngay: x.ngay, loai: x.loai, kg: x.kg, sl: x.soLuong, dv: x.donVi, chungTu: x.chungTu, lenh: x.lenh, nguoi: x.nguoiLap, ghiChu: x.ghiChu }));
  return { lot: info(ma, lo), nguon: nguon(ma, lo, 2), dung: dung(ma, lo), the, luc: Utilities.formatDate(new Date(), tz_(), 'dd/MM/yyyy HH:mm'), nguoi: me.ten,
    cty: str_(settings_raw_('Địa chỉ công ty')) };
}

/* ================= BIỂU ĐỒ (Báo cáo → Biểu đồ) ================= */
function webBieuDo(a, n) {
  auth_(a, [ROLES.QL]);
  n = Math.min(24, Math.max(3, Math.round(num_(n)) || 12));
  const now = new Date(), M = [];
  for (let i = n - 1; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 15); M.push(Utilities.formatDate(d, tz_(), 'yyyy-MM')); }
  const items = items_(), IM = {}; items.forEach(i => IM[i.ma] = i);
  const mv = moves_().filter(m => !m.trangThai && M.indexOf(String(m.ngay).slice(0, 7)) >= 0);
  /* nguyên liệu, phụ gia xuất cho lệnh SX theo tháng */
  const NH = ['Nguyên liệu', 'Phụ gia / dung môi'], nl = {}, tong = {}, top = {};
  NH.forEach(h => nl[h] = M.map(() => 0));
  mv.forEach(m => { if (m.loai !== 'Xuất' || !m.lenh) return; const it = IM[m.ma] || {}; if (NH.indexOf(it.nhom) < 0) return;
    const i = M.indexOf(String(m.ngay).slice(0, 7)); nl[it.nhom][i] += m.kg; top[m.ma] = (top[m.ma] || 0) + m.kg; });
  const T = Object.keys(top).sort((x, y) => top[y] - top[x]).slice(0, 8).map(ma => ({ ma, ten: (IM[ma] || {}).ten || '', s: M.map(mo => mv.filter(m => m.ma === ma && m.loai === 'Xuất' && m.lenh && String(m.ngay).slice(0, 7) === mo).reduce((s, m) => s + m.kg, 0)) }));
  /* sản lượng: BTP nhập từ lệnh SX, thành phẩm nhập từ lệnh đóng gói */
  const sl = { btp: M.map(() => 0), tp: M.map(() => 0) };
  mv.forEach(m => { if (m.loai !== 'Nhập' || !m.lenh) return; const nh = (IM[m.ma] || {}).nhom, i = M.indexOf(String(m.ngay).slice(0, 7)); if (nh === 'Bán thành phẩm') sl.btp[i] += m.kg; else if (nh === 'Thành phẩm') sl.tp[i] += m.kg; });
  /* QC: kết luận cuối cùng của từng lô, theo tháng kết luận */
  const qc = { dat: M.map(() => 0), kd: M.map(() => 0) };
  Object.values(qcMap_()).forEach(q => { const i = M.indexOf(String(q.ngay).slice(0, 7)); if (i < 0) return; if (q.tt === 'Đạt') qc.dat[i]++; else if (q.tt === 'Không đạt') qc.kd[i]++; });
  const r = v => Math.round(v * 10) / 10;
  Object.keys(nl).forEach(k => nl[k] = nl[k].map(r)); T.forEach(t => t.s = t.s.map(r)); sl.btp = sl.btp.map(r); sl.tp = sl.tp.map(r);
  return { M, nl, top: T, sl, qc };
}

/* ================= PHÒNG RD (RD-QT.01): BM.04 yêu cầu · BM.02 công thức – phiếu KT pha chế · BM.03 giao mẫu · BM.01 sổ (tổng hợp) · BB thử nghiệm tương thích bao bì =================
   Quản lý (TP. LAB/RD) lập yêu cầu, lập công thức thử và giao người thực hiện; người được giao ghi kết quả và báo kết quả; Quản lý kết luận. */
const RD_SH = 'PhongRD', RD_HEAD = ['ID', 'Loại', 'Ngày', 'Dữ liệu (JSON)', 'Người lập', 'Lúc', 'Trạng thái', 'Người sửa cuối'], RD_LOAI = ['YC', 'PT', 'GM', 'BB'];
function rdRows_() { return (sheet_(RD_SH) ? rows_(RD_SH) : []).filter(r => str_(r[0])).map((r, i) => { let d = {}; try { d = JSON.parse(str_(r[3]) || '{}'); } catch (e) {}
  return { id: str_(r[0]), loai: str_(r[1]), ngay: str_(r[2]), d, nguoi: str_(r[4]), luc: khTs_(r[5]), xoa: str_(r[6]) === 'Đã xoá' ? 1 : 0, sua: str_(r[7]) }; }); }
function webRDAll(a) { const me = auth_(a); needCT_(me); return rdRows_(); }
/* Phòng R&D: chỉ TP. LAB/RD (Nguyễn Ô Ghel, vai trò Quản lý) lập / sửa công thức, yêu cầu, đánh giá */
function rdEd_(me) { return me.vaiTro === ROLES.QL && me.ten === DL_EDITOR_; }
/* ----- công thức thử: người thực hiện điều chỉnh phụ gia / dung môi theo thực tế; dòng hoạt chất (tech) do TP. LAB/RD ghi, giữ nguyên ----- */
const RD_TECH_MOI_ = 'Thử nghiệm lô tech mới';
const RD_SOLV_ = /(nước|water|dầu|\boil\b|\bMES\b|solvesso|\bS-?\s?(100|150|200)\b|xylen|toluen|\bNMP\b|pyrrolidon|\bDMSO\b|\bDMF\b|cyclohexanon|isophoron|methanol|ethanol|\bIPA\b|isopropanol|butanol|aceton|methyl oleat|metyl oleat|\bMSO\b|paraffin|dung môi|solvent)/i;
/* loại dòng nguyên liệu — cùng cách đoán với màn hình (rd.js loaiOf) */
function rdLoai_(r, IM) {
  if (r.loai && ['tech', 'dm', 'pg', 'pb'].indexOf(r.loai) >= 0) return r.loai;
  const t = String(r.ten || '').trim(); if (!t && !r.ma) return '';
  const it = r.ma ? IM[r.ma] : null, nh = it ? it.nhom : '';
  if (nh === 'Nguyên liệu') return 'tech'; if (nh === 'Phân bón') return 'pb'; if (r.bu || RD_SOLV_.test(t)) return 'dm'; if (nh) return 'pg';
  return /\d{2,3}(?:[.,]\d+)?\s*%|\btech\b|\bTC\b|kỹ thuật/i.test(t) ? 'tech' : 'pg';
}
const rdNlKey_ = r => String(r.ma || '').trim().toUpperCase() || String(r.ten || '').trim().toLowerCase();
/* chữ ký công thức để so sánh: mã, tên, %w/w, dòng bù (kemGc = kể cả ghi chú dòng) */
function rdNlSig_(nl, kemGc) {
  return JSON.stringify((Array.isArray(nl) ? nl : []).filter(r => r && (String(r.ten || '').trim() || String(r.ma || '').trim() || String(r.pct == null ? '' : r.pct).trim()))
    .map(r => [String(r.ma || '').trim(), String(r.ten || '').trim(), r.pct === '' || r.pct == null ? '' : Math.round(num_(r.pct) * 1000) / 1000, r.bu ? 1 : 0].concat(kemGc ? [String(r.gc || '')] : [])));
}
/* dòng MỚI do người thực hiện thêm: chỉ coi là hoạt chất khi danh mục ghi nhóm "Nguyên liệu" hoặc tên ghi rõ tech / TC / kỹ thuật
   (tên có "20%" chưa chắc là hoạt chất: NaOH 32%, Proxel 20%… → phụ gia) */
function rdLoaiMoi_(r, IM) {
  const t = String(r.ten || '').trim(), it = r.ma ? IM[r.ma] : null, nh = it ? it.nhom : '';
  if (nh === 'Nguyên liệu') return 'tech'; if (nh === 'Phân bón') return 'pb'; if (r.bu || RD_SOLV_.test(t)) return 'dm';
  return !nh && /\btech\b|\bTC\b|kỹ thuật/i.test(t) ? 'tech' : 'pg';
}
/* công thức do người thực hiện gửi lên: giữ đủ và đúng các dòng hoạt chất của công thức giao, không thêm hoạt chất; phụ gia / dung môi sửa tự do */
function rdNlNV_(nl, goc, IM) {
  const B = {}, BM = {}; (goc || []).forEach(r => { const k = rdNlKey_(r); if (k && !B[k]) B[k] = r; if (r.ma) BM[String(r.ma).trim().toUpperCase()] = 1; });
  const out = (Array.isArray(nl) ? nl : []).filter(r => r && (String(r.ten || '').trim() || String(r.ma || '').trim())).slice(0, 60).map(r => {
    const x = { ma: String(r.ma || '').trim().slice(0, 60), ten: String(r.ten || '').trim().slice(0, 150), pct: r.pct === '' || r.pct == null ? '' : Math.round(num_(r.pct) * 1000) / 1000 };
    if (x.ma && !IM[x.ma] && !BM[x.ma.toUpperCase()]) x.ma = ''; if (r.bu) x.bu = true; if (r.gc) x.gc = String(r.gc).slice(0, 200);
    const b = B[rdNlKey_(x)], k = b ? rdLoai_(b, IM) : rdLoaiMoi_(x, IM); /* dòng có trong công thức giao: theo loại ở công thức giao · dòng mới: không tin "loại" máy gửi lên */
    if (k) x.loai = k; return x; });
  if (!out.length) throw new Error('Công thức không còn dòng nào.');
  const T0 = (goc || []).filter(r => rdLoai_(r, IM) === 'tech'), T1 = out.filter(r => r.loai === 'tech'), same = (x, t) => rdNlKey_(x) === rdNlKey_(t);
  T0.forEach(t => { const ten = t.ten || t.ma, i = T1.findIndex(x => same(x, t) && Math.abs(num_(x.pct) - num_(t.pct)) < 1e-6);
    if (i >= 0) { T1.splice(i, 1); return; }
    if (T1.some(x => same(x, t))) throw new Error('Dòng hoạt chất "' + ten + '": giữ nguyên ' + num_(t.pct) + ' %. Người thực hiện chỉ điều chỉnh phụ gia, dung môi.');
    throw new Error('Dòng hoạt chất "' + ten + '" do TP. LAB/RD ghi — không bỏ được. Người thực hiện chỉ điều chỉnh phụ gia, dung môi.'); });
  if (T1.length) throw new Error('Không thêm hoạt chất "' + (T1[0].ten || T1[0].ma) + '" — hoạt chất do TP. LAB/RD ghi. Người thực hiện chỉ điều chỉnh phụ gia, dung môi.');
  return out;
}
function webRDSave(a, o) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]); needCT_(me);
  o = o || {}; const ql = rdEd_(me);
  if (RD_LOAI.indexOf(o.loai) < 0) throw new Error('Loại hồ sơ RD không hợp lệ.');
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = shX_(RD_SH, RD_HEAD), R = sheet_(RD_SH) ? rows_(RD_SH) : [];
    let id = String(o.id || ''), i = id ? R.findIndex(r => str_(r[0]) === id) : -1;
    if (id && i < 0) throw new Error('Không tìm thấy hồ sơ (có thể đã bị xoá).');
    const cu = i >= 0 ? (() => { try { return JSON.parse(str_(R[i][3]) || '{}'); } catch (e) { return {}; } })() : null;
    let d = o.d || {};
    if (o.loai === 'YC' && !ql) throw new Error('Chỉ TP. LAB/RD (Nguyễn Ô Ghel) lập / sửa yêu cầu nghiên cứu.');
    if (o.loai === 'PT') {
      const nowT = Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd HH:mm');
      const soMoi = () => { const ym = Utilities.formatDate(new Date(), tz_(), 'yyMM'), n = R.filter(r => str_(r[1]) === 'PT' && (() => { try { return String(JSON.parse(str_(r[3]) || '{}').so || '').indexOf('PT-' + ym) === 0; } catch (e) { return false; } })()).length + 1; return 'PT-' + ym + '-' + ('0' + n).slice(-2); };
      if (!ql) { /* người được giao: ghi kết quả, đề xuất, báo kết quả; ĐIỀU CHỈNH CÔNG THỨC theo thực tế pha chế (phụ gia, dung môi — không đổi hoạt chất); lập phiếu "thử tỷ lệ khác" */
        const IM = {}; items_().forEach(it => { IM[it.ma] = it; });
        const KQ_K = ['kq', 'kqbd', 'deXuat', 'ngayBD', 'ngayKT', 'nvGhi', 'dat54', 'dat0', 'hong', 'meSL', 'meDV', 'danhGia', 'xuLy', 'ghiChu'];
        const lyCo = d.nlLy != null, ly = String(d.nlLy || '').trim().slice(0, 300); /* lý do điều chỉnh công thức (người thực hiện ghi) */
        if (!cu) { /* phiếu thử tỷ lệ khác: chép từ phiếu đang được giao cho chính mình */
          let src = null; if (d.tu) R.forEach(r => { if (src || str_(r[1]) !== 'PT' || str_(r[6]) === 'Đã xoá') return; try { const x = JSON.parse(str_(r[3]) || '{}'); if (x.so && x.so === d.tu) src = x; } catch (e) {} });
          if (!src) throw new Error('Chỉ TP. LAB/RD (Nguyễn Ô Ghel) lập công thức thử nghiệm.');
          if (src.nguoiTH !== me.ten) throw new Error('Phiếu ' + src.so + ' giao cho ' + (src.nguoiTH || 'người khác') + ' — không lập phiếu thử tỷ lệ khác từ phiếu này được.');
          if ((src.loaiTN || '') === RD_TECH_MOI_) throw new Error('Thử nghiệm lô tech mới: giữ nguyên công thức, không lập phiếu tỷ lệ khác.');
          const goc = src.nlGoc || src.nl || [], nd = {};
          ['sp', 'hl', 'loaiTN', 'yc', 'dang', 'tyTrong', 'quyTrinh', 't54', 't0', 'dvHL'].forEach(k => { if (src[k] !== undefined) nd[k] = src[k]; });
          KQ_K.forEach(k => { if (k in d && k !== 'danhGia' && k !== 'xuLy') nd[k] = d[k]; });
          if (!Array.isArray(nd.kq) || !nd.kq.length) nd.kq = (src.kq || []).map(r => ({ ct: r.ct, yc: r.yc, pp: r.pp, w: r.w, nb: r.nb }));
          nd.nl = rdNlNV_(d.nl, goc, IM); nd.nlGoc = goc; nd.nlSua = { nguoi: me.ten, luc: nowT, ly: ly, tu: src.so };
          nd.maCT = String(d.maCT || '').trim().slice(0, 40); nd.nguoiTH = me.ten; nd.ngayLap = Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd');
          nd.tu = src.so; nd.lan = (num_(src.lan) || 1) + 1; nd.tuNV = 1; nd.so = soMoi();
          nd.tt = d.tt === 'Đã báo KQ' ? 'Đã báo KQ' : 'Đang thử'; if (nd.tt === 'Đã báo KQ') nd.baoLuc = nowT;
          d = nd;
        } else {
          if (cu.nguoiTH && cu.nguoiTH !== me.ten) throw new Error('Phiếu này giao cho ' + cu.nguoiTH + '.');
          if (cu.tt === 'Đã duyệt') throw new Error('Phiếu đã được duyệt, không sửa kết quả được nữa.');
          const keep = Object.assign({}, cu); KQ_K.forEach(k => { if (k in d) keep[k] = d[k]; });
          if (d.nlDoi && Array.isArray(d.nl) && cu.nguoiTH === me.ten && (cu.loaiTN || '') !== RD_TECH_MOI_ && rdNlSig_(d.nl, 1) !== rdNlSig_(cu.nl, 1)) { /* người thực hiện có sửa công thức (tỷ lệ, dòng, ghi chú dòng); lô tech mới: giữ nguyên công thức đã lưu */
            const goc = cu.nlGoc || cu.nl || [];
            keep.nl = rdNlNV_(d.nl, goc, IM);
            if (rdNlSig_(keep.nl) !== rdNlSig_(goc)) { keep.nlGoc = goc; keep.nlSua = { nguoi: me.ten, luc: nowT, ly: lyCo ? ly : (cu.nlSua && cu.nlSua.ly) || '' }; if (cu.nlSua && cu.nlSua.tu) keep.nlSua.tu = cu.nlSua.tu; }
            else if (!cu.tuNV) { delete keep.nlGoc; delete keep.nlSua; } /* trả về đúng công thức giao: bỏ dấu "đã điều chỉnh" */
          } else if (cu.nlSua && lyCo && cu.nguoiTH === me.ten && ly !== (cu.nlSua.ly || '')) keep.nlSua = Object.assign({}, cu.nlSua, { ly: ly });
          keep.tt = d.tt === 'Đã báo KQ' ? 'Đã báo KQ' : (cu.tt === 'Giao' ? 'Đang thử' : cu.tt);
          if (keep.tt === 'Đã báo KQ') keep.baoLuc = nowT;
          d = keep;
        }
      } else {
        if (!String(d.sp || '').trim()) throw new Error('Ghi tên sản phẩm thử nghiệm.');
        if (!d.so) d.so = soMoi();
        if (!d.tt) d.tt = d.nguoiTH ? 'Giao' : 'Đang thử';
        /* TP. LAB/RD sửa công thức → công thức mới là công thức giao: bỏ dấu "người thực hiện đã điều chỉnh" */
        if (cu && (d.nlGoc || d.nlSua) && rdNlSig_(d.nl) !== rdNlSig_(cu.nl)) { delete d.nlGoc; delete d.nlSua; }
        if (d.danhGia && ['Đạt', 'Không đạt'].indexOf(d.danhGia) >= 0) { d.tt = 'Đã duyệt'; d.duyetBoi = me.ten; d.duyetLuc = nowT; }
        else if (d.tt === 'Đã duyệt') { d.tt = d.baoLuc ? 'Đã báo KQ' : 'Đang thử'; d.duyetBoi = ''; d.duyetLuc = ''; } /* bỏ chọn kết luận = mở lại phiếu */
      }
    }
    if (o.loai === 'BB') d = rdBB_(me, ql, d, cu, R);
    const js = JSON.stringify(d); if (js.length > 45000) throw new Error('Hồ sơ quá dài.');
    const ngay = isYmd_(o.ngay) ? o.ngay : Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd');
    if (!id) id = o.loai + '-' + Utilities.formatDate(new Date(), tz_(), 'yyMMddHHmmss') + Math.floor(Math.random() * 90 + 10);
    if (i >= 0) sh.getRange(i + 2, 1, 1, RD_HEAD.length).setValues([[id, o.loai, ngay, js, str_(R[i][4]), R[i][5], '', me.ten]]);
    else sh.appendRow([id, o.loai, ngay, js, me.ten, new Date(), '', me.ten]);
    log_(me, 'Phòng RD ' + o.loai, id, (d.so || d.sp || d.noiDung || d.ten || '').toString().slice(0, 120) + (d.tt ? ' · ' + d.tt : ''));
    return { id, d };
  } finally { lock.releaseLock(); }
}
/* ----- THỬ NGHIỆM TƯƠNG THÍCH BAO BÌ (BB): sản phẩm đóng vào bao bì thương mại, lưu 54±2 °C 14 ngày; theo dõi khối lượng (hao hụt),
   tình trạng bao bì, chỉ tiêu hoá lý trước / sau lưu. TP. LAB/RD lập & giao việc, người được giao ghi kết quả + báo kết quả, TP. LAB/RD duyệt. ----- */
function rdBB_(me, ql, d, cu, R) {
  const nowT = Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd HH:mm');
  if (!ql) {
    if (!cu) throw new Error('Chỉ TP. LAB/RD (Nguyễn Ô Ghel) lập phiếu thử nghiệm bao bì.');
    if (cu.nguoiTH && cu.nguoiTH !== me.ten) throw new Error('Phiếu này giao cho ' + cu.nguoiTH + '.');
    if (cu.tt === 'Đã duyệt') throw new Error('Phiếu đã được duyệt, không sửa kết quả được nữa.');
    const keep = Object.assign({}, cu);
    ['mau', 'kt', 'bi', 'ngayBD', 'ngayKT', 'nhanXet', 'deXuat', 'danhGia', 'ghiChu'].forEach(k => { if (k in d) keep[k] = d[k]; });
    /* người thực hiện không đổi chỉ tiêu / mức yêu cầu do TP. LAB/RD ghi — chỉ ghi kết quả trước / sau lưu */
    if (Array.isArray(d.kq) && Array.isArray(cu.kq)) keep.kq = cu.kq.map((r, i) => { const x = d.kq[i] || {}; return Object.assign({}, r, { a: String(x.a == null ? (r.a || '') : x.a).slice(0, 300), b: String(x.b == null ? (r.b || '') : x.b).slice(0, 300) }); });
    if (Array.isArray(keep.mau)) keep.mau = keep.mau.slice(0, 30);
    keep.tt = d.tt === 'Đã báo KQ' ? 'Đã báo KQ' : (cu.tt === 'Giao' ? 'Đang thử' : cu.tt);
    if (keep.tt === 'Đã báo KQ') keep.baoLuc = nowT;
    return keep;
  }
  if (!String(d.sp || '').trim()) throw new Error('Ghi tên sản phẩm thử nghiệm.');
  if (!d.bao || !String(d.bao.loai || '').trim()) throw new Error('Ghi loại bao bì thử (chai, gói, túi…).');
  if (!d.so) { const ym = Utilities.formatDate(new Date(), tz_(), 'yyMM');
    const n = R.filter(r => str_(r[1]) === 'BB' && (() => { try { return String(JSON.parse(str_(r[3]) || '{}').so || '').indexOf('BB-' + ym) === 0; } catch (e) { return false; } })()).length + 1;
    d.so = 'BB-' + ym + '-' + ('0' + n).slice(-2); }
  if (!d.tt) d.tt = d.nguoiTH ? 'Giao' : 'Đang thử';
  if (d.danhGia && ['Đạt', 'Không đạt'].indexOf(d.danhGia) >= 0) { if (!cu || cu.tt !== 'Đã duyệt' || cu.danhGia !== d.danhGia) { d.duyetBoi = me.ten; d.duyetLuc = nowT; } d.tt = 'Đã duyệt'; }
  else if (d.tt === 'Đã duyệt') { d.tt = d.baoLuc ? 'Đã báo KQ' : 'Đang thử'; d.duyetBoi = ''; d.duyetLuc = ''; }
  return d;
}
function webRDDel(a, id, khoiPhuc) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]); needCT_(me);
  const R = sheet_(RD_SH) ? rows_(RD_SH) : [], i = R.findIndex(r => str_(r[0]) === String(id));
  if (i < 0) throw new Error('Không tìm thấy hồ sơ.');
  if (!rdEd_(me) && str_(R[i][4]) !== me.ten) throw new Error('Chỉ người lập hoặc ' + DL_EDITOR_ + ' được ' + (khoiPhuc ? 'khôi phục.' : 'xoá.'));
  sheet_(RD_SH).getRange(i + 2, 7, 1, 2).setValues([[khoiPhuc ? '' : 'Đã xoá', me.ten]]);
  log_(me, khoiPhuc ? 'Khôi phục hồ sơ RD' : 'Xoá hồ sơ RD', String(id), '');
  return rdRows_();
}

/* ================= PHÒNG QA/QC: QC-QT.02 kiểm tra vật tư nhập kho (BM.01–05) · QC-QT.05 sổ theo dõi sự KPH (BM.01) =================
   QC ghi vật tư về (phần Quản lý kho) và kết quả kiểm tra; TP. QA/QC (Nguyễn Ô Ghel) xác nhận; cột thu mua để trống, ký tay khi in. */
const QA_SH = 'PhongQAQC', QA_HEAD = ['ID', 'Loại', 'Ngày', 'Dữ liệu (JSON)', 'Người lập', 'Lúc', 'Trạng thái', 'Người sửa cuối'], QA_VT = ['NHAN', 'TUI', 'CHAI', 'THUNG'], QA_LOAI = QA_VT.concat(['KH', 'KPH']);
function qaRows_() { return (sheet_(QA_SH) ? rows_(QA_SH) : []).filter(r => str_(r[0])).map(r => { let d = {}; try { d = JSON.parse(str_(r[3]) || '{}'); } catch (e) {}
  return { id: str_(r[0]), loai: str_(r[1]), ngay: str_(r[2]), d, nguoi: str_(r[4]), luc: khTs_(r[5]), xoa: str_(r[6]) === 'Đã xoá' ? 1 : 0, sua: str_(r[7]) }; }); }
function webQAAll(a) { auth_(a); let A = {}; try { A = anMap_(); } catch (e) {} /* kèm số ảnh chụp khi ghi bao bì về */
  return qaRows_().map(r => { const n = (A['QA:' + r.id] || []).length; if (n) r.anh = n; return r; }); }
function qaTP_(me) { return me.vaiTro === ROLES.QL && me.ten === DL_EDITOR_; } /* TP. QA/QC xác nhận */
function qaQC_(me) { return !!me.qc || me.vaiTro === ROLES.QL; }
const QA_XN_ = ['xnQL', 'xnQLNguoi', 'xnQLLuc', 'kqXuLy'];
/** QC ghi mã bao bì mới vào Danh mục vật tư (nhóm Bao bì, không theo lô, không tồn đầu) ngay khi ghi bao bì về. */
function webBBNew(a, it) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]);
  if (!qaQC_(me) && [ROLES.QL, ROLES.KT].indexOf(me.vaiTro) < 0) throw new Error('Chỉ QC, Quản lý hoặc Kế toán ghi mã bao bì mới.');
  it = it || {};
  const ma = String(it.ma || '').trim().toUpperCase().replace(/\s+/g, ''), ten = String(it.ten || '').trim().slice(0, 200), dv = String(it.donVi || '').trim().slice(0, 20) || 'cái';
  if (!/^BB\.[A-Z0-9][A-Z0-9._\-+]*$/.test(ma)) throw new Error('Mã bao bì bắt đầu bằng BB. (VD BB.NHAN.ALP-D7), chỉ gồm chữ, số, dấu chấm, gạch.');
  if (!ten) throw new Error('Ghi tên bao bì.');
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = sheet_(SH.VT), codes = rows_(SH.VT).map(r => str_(r[0]).toLowerCase());
    if (codes.indexOf(ma.toLowerCase()) >= 0) throw new Error('Mã ' + ma + ' đã có trong Danh mục vật tư.');
    if (!str_(sh.getRange(1, 12).getValue())) sh.getRange(1, 12).setValue('Kho').setFontWeight('bold');
    sh.appendRow([ma, ten, 'Bao bì', dv, 1, 0, 0, '', '', '', '', 'Kho bao bì']);
    log_(me, 'Thêm vật tư (QC ghi bao bì về)', ma, ten);
  } finally { lock.releaseLock(); }
  return { ma, ten, nhom: 'Bao bì', donVi: dv, heSo: 1 };
}
function webQASave(a, o) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]);
  if (!qaQC_(me)) throw new Error('Chỉ QC hoặc Quản lý ghi sổ QA/QC.');
  o = o || {}; if (QA_LOAI.indexOf(o.loai) < 0) throw new Error('Loại sổ không hợp lệ.');
  const tp = qaTP_(me), now = Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd HH:mm');
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = shX_(QA_SH, QA_HEAD), R = sheet_(QA_SH) ? rows_(QA_SH) : [];
    let id = String(o.id || ''), i = id ? R.findIndex(r => str_(r[0]) === id) : -1;
    if (id && i < 0) throw new Error('Không tìm thấy hồ sơ (có thể đã bị xoá).');
    const cu = i >= 0 ? (() => { try { return JSON.parse(str_(R[i][3]) || '{}'); } catch (e) { return {}; } })() : null;
    const d = Object.assign({}, o.d || {});
    if (QA_VT.indexOf(o.loai) >= 0) {
      if (!String(d.ten || '').trim()) throw new Error('Ghi tên vật tư.');
      if (!isYmd_(d.ngayNhap)) throw new Error('Ghi ngày nhập (ngày vật tư về).');
      if (cu && cu.xnQL && !tp) throw new Error('Phiếu đã được TP. QA/QC xác nhận, không sửa được nữa.');
      if (!tp) QA_XN_.forEach(k => { if (cu && k in cu) d[k] = cu[k]; else delete d[k]; }); /* QC không tự xác nhận */
      else if (String(d.xnQL || '') !== String((cu && cu.xnQL) || '')) { d.xnQLNguoi = d.xnQL ? me.ten : ''; d.xnQLLuc = d.xnQL ? now : ''; }
      if (d.ketLuan && ['Đạt', 'Không đạt'].indexOf(d.ketLuan) < 0) throw new Error('Kết luận chỉ Đạt / Không đạt.');
      if (d.ketLuan && !d.nguoiKT) d.nguoiKT = me.ten;
      if (d.ketLuan && !isYmd_(d.ngayKT)) d.ngayKT = now.slice(0, 10);
      if (d.ketLuan && !(cu && cu.ketLuan)) d.kiemLuc = now;
      d.tt = d.xnQL ? 'Đã xác nhận' : d.ketLuan ? 'Chờ xác nhận' : 'Chờ kiểm';
    } else if (o.loai === 'KH') {
      if (!String(d.ten || '').trim()) throw new Error('Ghi tên hàng dự kiến giao.');
      if (!isYmd_(d.duKien)) throw new Error('Ghi ngày dự kiến giao.');
    } else if (o.loai === 'KPH') {
      if (!String(d.suKPH || '').trim()) throw new Error('Ghi sự không phù hợp.');
      if (!isYmd_(d.ngay)) d.ngay = now.slice(0, 10);
      if (!d.so) { const ym = d.ngay.slice(2, 4) + d.ngay.slice(5, 7), n = R.filter(r => str_(r[1]) === 'KPH' && (() => { try { return String(JSON.parse(str_(r[3]) || '{}').so || '').indexOf('KPH-' + ym) === 0; } catch (e) { return false; } })()).length + 1; d.so = 'KPH-' + ym + '-' + ('0' + n).slice(-2); }
      if (d.dong && !(cu && cu.dong)) { d.dongNguoi = me.ten; d.dongLuc = now; }
    }
    if (i >= 0 && str_(R[i][6]) === 'Đã xoá') throw new Error('Phiếu đã xoá — khôi phục trước rồi mới sửa.');
    if (!id) id = o.loai + '-' + Utilities.formatDate(new Date(), tz_(), 'yyMMddHHmmss') + Math.floor(Math.random() * 90 + 10);
    /* QC nhập kho bao bì luôn khi ghi sổ kiểm: phiếu nhập đi kèm (máy chủ giữ mã phiếu, máy không tự ghi được) */
    if (o.loai === 'TUI') qaCanLech_(R, id, d); /* cân túi rỗng lệch quá ngưỡng so với lần cân trước cùng mã → ghi d.canLech */
    let pn = null;
    if (QA_VT.indexOf(o.loai) >= 0) { QA_PN_K_.forEach(k => { if (cu && cu[k] !== undefined && cu[k] !== '') d[k] = cu[k]; else delete d[k]; }); pn = qaPN_(me, id, o.loai, d, false); }
    const js = JSON.stringify(d); if (js.length > 45000) throw new Error('Hồ sơ quá dài.');
    const ngay = o.loai === 'KH' ? d.duKien : o.loai === 'KPH' ? d.ngay : d.ngayNhap;
    if (i >= 0) sh.getRange(i + 2, 1, 1, QA_HEAD.length).setValues([[id, o.loai, ngay, js, str_(R[i][4]), R[i][5], '', me.ten]]);
    else sh.appendRow([id, o.loai, ngay, js, me.ten, new Date(), '', me.ten]);
    log_(me, 'Phòng QA/QC ' + o.loai, id, String(d.ten || d.suKPH || '').slice(0, 120) + (d.tt ? ' · ' + d.tt : d.so ? ' · ' + d.so : ''));
    const ct = o.loai === 'TUI' ? qaCanTui_(me, id, d) : null; /* túi ép 3 biên: số cân túi rỗng → khối lượng bao bì theo mã hàng */
    return { id, d, canQC: ct ? ct.qcs : [], cbb: ct && ct.ch ? cbbRows_() : null, pn: pn ? pn.doi : '' };
  } finally { lock.releaseLock(); }
}
/* BM.02 túi ép 3 biên: so khối lượng trung bình 1 túi rỗng với LẦN CÂN TRƯỚC của cùng mã bao bì.
   Lệch quá ngưỡng (Báo cáo → Cảnh báo: "Cân túi rỗng lệch quá (%)", mặc định 5 %) → d.canLech = { p: % lệch, tb: g lần trước, ngay, ncc, ng: ngưỡng }
   để phiếu, danh sách và thông báo cảnh báo. Trong ngưỡng / chưa có lần trước / không phải túi ép 3 biên → bỏ d.canLech. */
function qaCanLech_(R, id, d) {
  delete d.canLech;
  const v = num_(d.tlTui), ma = String(d.ma || '').trim().toUpperCase();
  if (d.loaiVT !== 'Túi ép 3 biên' || !(v > 0) || !ma) return;
  const ngay = isYmd_(d.ngayKT) ? d.ngayKT : (isYmd_(d.ngayNhap) ? d.ngayNhap : '');
  let p = null;
  (R || []).forEach(r => { const rid = str_(r[0]); if (str_(r[1]) !== 'TUI' || rid === id || str_(r[6]) === 'Đã xoá') return;
    let x; try { x = JSON.parse(str_(r[3]) || '{}'); } catch (e) { return; }
    if (x.loaiVT !== 'Túi ép 3 biên' || !(num_(x.tlTui) > 0) || String(x.ma || '').trim().toUpperCase() !== ma) return;
    const n = isYmd_(x.ngayKT) ? x.ngayKT : (isYmd_(x.ngayNhap) ? x.ngayNhap : '');
    if (ngay && n && n > ngay) return; if (ngay && n === ngay && rid > id) return; /* chỉ so với lần cân trước đó */
    if (!p || n > p.ngay || (n === p.ngay && rid > p.id)) p = { id: rid, ngay: n, tb: num_(x.tlTui), ncc: String(x.ncc || '') }; });
  if (!p) return;
  const ng = settings_().canLech || 5, pct = Math.round((v - p.tb) / p.tb * 10000) / 100;
  if (Math.abs(pct) > ng) d.canLech = { p: pct, tb: p.tb, ngay: p.ngay, ncc: p.ncc.slice(0, 80), ng: ng };
}
/* BM.02 túi ép 3 biên: QC cân túi rỗng → khối lượng bao bì (klBB, g) cho mọi mã quy cách đóng gói dùng túi này
   (mã bao bì BB.GOI.<mã nhãn> ↔ cột Mã nhãn của QuyCachDG). Phiếu BM.05 lấy lần cân mới nhất của mã hàng làm mặc định.
   Mỗi phiếu giữ dòng cân riêng (cột Số lệnh = 'QA:<id>'): sửa phiếu thì sửa dòng đó, bỏ cân / đổi loại / xoá phiếu thì xoá mềm. */
function qaCanTui_(me, id, d) {
  d = d || {}; const so = 'QA:' + id, v = Math.round(num_(d.tlTui) * 1000) / 1000;
  const cd = s => String(s || '').trim().toUpperCase().replace(/·/g, '.').replace(/\s+/g, '').replace(/[^A-Z0-9_.+\-]/g, '');
  const m = /^BB\.(?:GOI|TUI|BAO)\.(.+)$/.exec(cd(d.ma)), on = d.loaiVT === 'Túi ép 3 biên' && v > 0 && v <= 2000 && !!m;
  const qcs = on ? qcRows_().filter(q => cd(q.nhan) === m[1]).map(q => q.qc).filter((x, k, A) => x && A.indexOf(x) === k) : [];
  const R = sheet_(CBB_SH) ? rows_(CBB_SH) : [];
  if (!qcs.length && !R.some(r => str_(r[6]) === so)) return { qcs, ch: false };
  const ngay = isYmd_(d.ngayKT) ? d.ngayKT : isYmd_(d.ngayNhap) ? d.ngayNhap : Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd');
  const nguoi = String(d.nguoiKT || me.ten).slice(0, 80), sh = shX_(CBB_SH, CBB_HEAD_), co = {}; let ch = false;
  R.forEach((r, i) => { if (str_(r[6]) !== so || str_(r[1]) !== 'klBB') return; const q = str_(r[0]), del = str_(r[9]) === 'Đã xoá';
    if (qcs.indexOf(q) >= 0 && !co[q]) { co[q] = 1;
      if (del || Math.abs(num_(r[2]) - v) > 1e-9 || str_(r[4]).slice(0, 10) !== ngay || str_(r[5]) !== nguoi) { sh.getRange(i + 2, 1, 1, CBB_HEAD_.length).setValues([[q, 'klBB', v, 'g', ngay, nguoi, so, new Date(), 'Gói thuốc', '', '', '']]); ch = true; } }
    else if (!del) { sh.getRange(i + 2, 10, 1, 3).setValues([['Đã xoá', me.ten, new Date()]]); ch = true; } });
  qcs.forEach(q => { if (!co[q]) { sh.appendRow([q, 'klBB', v, 'g', ngay, nguoi, so, new Date(), 'Gói thuốc', '', '', '']); ch = true; } });
  return { qcs, ch };
}
/* ---- QC nhập kho bao bì ngay khi ghi sổ kiểm (BM.01–04): phiếu nhập (sheet Phieu) đi kèm phiếu kiểm, 2 sổ luôn khớp ----
   d.nhapKho: có nhập kho · d.pnId: ID phiếu nhập đi kèm (máy chủ tự ghi, máy không gửi lên được) · d.pnSl/pnDv/pnNgay/pnMa/pnNguoi: phiếu đã ghi (để hiện).
   Sửa số lượng / ngày / NCC / chứng từ / mã ở phiếu kiểm → phiếu nhập sửa theo; bỏ chọn hoặc xoá phiếu kiểm → phiếu nhập xoá (mềm), khôi phục thì ghi lại.
   Ngược lại: phiếu nhập bao bì lập ở tab Phiếu nhập vật tư → tự có phiếu kiểm "Chờ kiểm" đi kèm (qaAutoPN_); sửa / xoá phiếu nhập ở Lịch sử → phiếu kiểm theo (qaPNSync_, qaPNUnlink_). */
const QA_BM_ = { NHAN: 'BM.01', TUI: 'BM.02', CHAI: 'BM.03', THUNG: 'BM.04' }, QA_PN_K_ = ['pnId', 'pnSl', 'pnDv', 'pnNgay', 'pnMa', 'pnNguoi'];
function qaSoOf_(ma) { const m = String(ma || '').toUpperCase();
  return /^BB\.(GOI|TUI|BAO)\./.test(m) ? 'TUI' : /^BB\.(CHAI|CAN|XO|NAP|HU)\./.test(m) ? 'CHAI' : /^BB\.(THUNG|HOP|DAI)/.test(m) ? 'THUNG' : 'NHAN'; }
const qaDvEq_ = (x, y) => String(x || '').trim().toLowerCase() === String(y || '').trim().toLowerCase();
function qaPNRow_(pid) {
  pid = String(pid || ''); if (!pid || !sheet_(SH.PH)) return null; const sh = sheet_(SH.PH), n = sh.getLastRow() - 1; if (n < 1) return null;
  const i = sh.getRange(2, 1, n, 1).getValues().findIndex(r => str_(r[0]) === pid); if (i < 0) return null;
  const r = sh.getRange(i + 2, 1, 1, 17).getValues()[0];
  return { id: pid, row: i + 2, ngay: str_(r[2]), loai: str_(r[3]), ma: str_(r[4]), sl: num_(r[5]), dv: str_(r[6]), ct: str_(r[8]), gc: str_(r[9]), nguoi: str_(r[10]), tt: str_(r[11]), lenh: str_(r[12]), ncc: str_(r[16]) };
}
function qaPNDel_(me, P, why) {
  checkLock_(P.ngay);
  sheet_(SH.PH).getRange(P.row, 12).setValue('Đã xoá bởi ' + me.ten + ' lúc ' + Utilities.formatDate(new Date(), tz_(), 'dd/MM/yyyy HH:mm') + ' (' + why + ')');
  log_(me, 'Xoá phiếu', P.id, ['Nhập', P.ma, P.sl + ' ' + P.dv, 'ngày ' + P.ngay, 'người lập ' + P.nguoi, why].join(' · '));
}
function qaPN_(me, id, so, d, del) {
  const want = !del && !!d.nhapKho, P = qaPNRow_(d.pnId), live = !!P && !P.tt && P.loai === 'Nhập' && !P.lenh, bm = QA_BM_[so] || so;
  const clr = () => QA_PN_K_.forEach(k => { delete d[k]; });
  if (!want) { if (live) { qaPNDel_(me, P, (del ? 'xoá phiếu kiểm ' : 'bỏ nhập kho ở phiếu kiểm ') + bm + ' ' + id); clr(); return { doi: 'xoa' }; } clr(); return { doi: '' }; }
  const it = items_().find(x => x.ma.toLowerCase() === String(d.ma || '').trim().toLowerCase());
  if (!it) throw new Error('Mã bao bì "' + (d.ma || '') + '" chưa có trong Danh mục vật tư — chọn đúng mã, hoặc bỏ chọn “Nhập kho luôn”.');
  if (it.nhom !== 'Bao bì') throw new Error(it.ma + ' thuộc nhóm "' + it.nhom + '", không phải bao bì — nhập ở tab Phiếu nhập vật tư.');
  const cung = qaDvEq_(d.dvt || it.donVi, it.donVi), sl = Math.round(num_(cung ? d.sl : d.slKho) * 10000) / 10000;
  if (!(sl > 0)) throw new Error(cung ? 'Ghi số lượng thực tế để nhập kho (hoặc bỏ chọn “Nhập kho luôn”).' : 'Sổ kiểm ghi đơn vị "' + d.dvt + '", kho tính ' + it.ma + ' theo "' + it.donVi + '": ghi Số lượng nhập kho theo ' + it.donVi + '.');
  if (!isYmd_(d.ngayNhap)) throw new Error('Ghi ngày nhập.');
  const kg = Math.round(sl * it.heSo * 10000) / 10000, ncc = String(d.ncc || '').trim().slice(0, 100), ct = String(d.chungTu || '').trim().slice(0, 100), sh = sheet_(SH.PH);
  if (live && P.ma === it.ma) {
    const doi = [['Ngày', P.ngay, d.ngayNhap], ['SL', P.sl, sl], ['NCC', P.ncc, ncc], ['CT', P.ct, ct]].filter(x => String(x[1]) !== String(x[2]));
    if (doi.length) {
      checkLock_(P.ngay); checkLock_(d.ngayNhap); if (ncc) nccHead_();
      sh.getRange(P.row, 3).setValue(d.ngayNhap); sh.getRange(P.row, 6, 1, 5).setValues([[sl, it.donVi, kg, ct, P.gc]]); sh.getRange(P.row, 17).setValue(ncc);
      log_(me, 'Sửa phiếu nhập (theo sổ kiểm bao bì ' + bm + ')', it.ma + ' · ' + P.id, doi.map(x => x[0] + ': ' + x[1] + ' → ' + x[2]).join(' · '));
    }
    Object.assign(d, { pnId: P.id, pnSl: sl, pnDv: it.donVi, pnNgay: d.ngayNhap, pnMa: it.ma, pnNguoi: P.nguoi });
    return { doi: doi.length ? 'sua' : '' };
  }
  if (live) qaPNDel_(me, P, 'đổi mã ở phiếu kiểm ' + bm + ' ' + id + ': ' + P.ma + ' → ' + it.ma);
  checkLock_(d.ngayNhap); if (ncc) nccHead_();
  const pid = Utilities.formatDate(new Date(), tz_(), 'yyMMddHHmmss') + Math.floor(Math.random() * 900 + 100);
  sh.appendRow([pid, new Date(), d.ngayNhap, 'Nhập', it.ma, sl, it.donVi, kg, ct, ('Sổ kiểm bao bì ' + bm + ' · ' + id).slice(0, 200), me.ten, '', '', '', '', '', ncc]);
  log_(me, 'Nhập kho bao bì (QC, sổ kiểm ' + bm + ')', it.ma + ' · ' + pid, sl + ' ' + it.donVi + ' · ngày ' + d.ngayNhap + (ncc ? ' · NCC ' + ncc : '') + ' · phiếu kiểm ' + id);
  Object.assign(d, { pnId: pid, pnSl: sl, pnDv: it.donVi, pnNgay: d.ngayNhap, pnMa: it.ma, pnNguoi: me.ten });
  return { doi: live ? 'doima' : 'moi' };
}
/** Phiếu nhập bao bì lập ở tab Phiếu nhập vật tư (không qua sổ kiểm) → tự tạo phiếu kiểm "Chờ kiểm" đi kèm, QC thấy số nhấp nháy ở menu. */
function qaAutoPN_(me, pid, it, p, sl, ncc) {
  if (!it || it.nhom !== 'Bao bì') return '';
  const so = qaSoOf_(it.ma), id = so + '-' + Utilities.formatDate(new Date(), tz_(), 'yyMMddHHmmss') + Math.floor(Math.random() * 90 + 10);
  const d = { ngayNhap: p.ngay, ncc: ncc || '', ma: it.ma, ten: it.ten, sl: String(sl), dvt: it.donVi, tinhTrangKho: 'Bình thường', nhapKho: true, chungTu: String(p.chungTu || '').trim().slice(0, 100),
    pnId: pid, pnSl: sl, pnDv: it.donVi, pnNgay: p.ngay, pnMa: it.ma, pnNguoi: me.ten, tuPN: 1, nguon: 'tự tạo từ phiếu nhập kho của ' + me.ten, tt: 'Chờ kiểm' };
  shX_(QA_SH, QA_HEAD).appendRow([id, so, p.ngay, JSON.stringify(d), me.ten, new Date(), '', me.ten]);
  log_(me, 'Phòng QA/QC ' + so, id, 'Tự tạo phiếu kiểm (chờ kiểm) từ phiếu nhập bao bì ' + pid + ' · ' + it.ma);
  return id;
}
/* phiếu kiểm đang gắn với phiếu nhập pid (bỏ qua phiếu kiểm đã xoá) */
function qaByPN_(pid) { const R = sheet_(QA_SH) ? rows_(QA_SH) : []; for (let i = 0; i < R.length; i++) { if (QA_VT.indexOf(str_(R[i][1])) < 0 || str_(R[i][6]) === 'Đã xoá') continue;
  let d; try { d = JSON.parse(str_(R[i][3]) || '{}'); } catch (e) { continue; } if (String(d.pnId || '') === String(pid)) return { i, id: str_(R[i][0]), so: str_(R[i][1]), d }; } return null; }
/** Sửa phiếu nhập ở Lịch sử → phiếu kiểm đi kèm sửa theo (ngày, số lượng, NCC, chứng từ). */
function qaPNSync_(me, pid, v) {
  const q = qaByPN_(pid); if (!q) return; const d = q.d, it = items_().find(x => x.ma === d.pnMa || x.ma === d.ma);
  if (it && qaDvEq_(d.dvt || it.donVi, it.donVi)) d.sl = String(v.sl); else d.slKho = String(v.sl);
  Object.assign(d, { ngayNhap: v.ngay, ncc: v.ncc, chungTu: v.ct, pnSl: v.sl, pnNgay: v.ngay });
  sheet_(QA_SH).getRange(q.i + 2, 3, 1, 2).setValues([[v.ngay, JSON.stringify(d)]]);
  log_(me, 'Phòng QA/QC ' + q.so, q.id, 'Sửa theo phiếu nhập ' + pid + ': ' + v.sl + ' · ngày ' + v.ngay);
}
/** Xoá phiếu nhập ở Lịch sử → phiếu kiểm tự tạo còn chờ kiểm thì xoá theo; phiếu kiểm QC đã ghi thì giữ, chỉ bỏ "nhập kho". */
function qaPNUnlink_(me, pid) {
  const q = qaByPN_(pid); if (!q) return; const d = q.d, bo = d.tuPN && !d.ketLuan && !d.xnQL;
  d.nhapKho = false; QA_PN_K_.forEach(k => { delete d[k]; });
  sheet_(QA_SH).getRange(q.i + 2, 4).setValue(JSON.stringify(d));
  if (bo) sheet_(QA_SH).getRange(q.i + 2, 7, 1, 2).setValues([['Đã xoá', me.ten]]);
  log_(me, bo ? 'Xoá hồ sơ QA/QC' : 'Phòng QA/QC ' + q.so, q.id, (bo ? 'Xoá theo' : 'Bỏ nhập kho theo') + ' phiếu nhập ' + pid + ' đã xoá');
}
function webQADel(a, id, khoiPhuc) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]);
  const R = sheet_(QA_SH) ? rows_(QA_SH) : [], i = R.findIndex(r => str_(r[0]) === String(id));
  if (i < 0) throw new Error('Không tìm thấy hồ sơ.');
  let d = {}; try { d = JSON.parse(str_(R[i][3]) || '{}'); } catch (e) {}
  /* phiếu kiểm tự tạo từ phiếu nhập kho: QC nào cũng xoá được (VD ghi trùng) */
  if (!qaTP_(me) && str_(R[i][4]) !== me.ten && !(d.tuPN && qaQC_(me))) throw new Error('Chỉ người lập hoặc TP. QA/QC (' + DL_EDITOR_ + ') được ' + (khoiPhuc ? 'khôi phục.' : 'xoá.'));
  if (!khoiPhuc && d.xnQL && !qaTP_(me)) throw new Error('Phiếu đã được TP. QA/QC xác nhận, không xoá được.');
  const so = str_(R[i][1]);
  if (QA_VT.indexOf(so) >= 0 && (d.nhapKho || d.pnId)) { /* phiếu nhập kho đi kèm: xoá theo; khôi phục thì ghi lại */
    const pn = qaPN_(me, String(id), so, d, !khoiPhuc);
    if (pn.doi) sheet_(QA_SH).getRange(i + 2, 4).setValue(JSON.stringify(d));
  }
  sheet_(QA_SH).getRange(i + 2, 7, 1, 2).setValues([[khoiPhuc ? '' : 'Đã xoá', me.ten]]);
  if (so === 'TUI') qaCanTui_(me, String(id), khoiPhuc ? d : {}); /* xoá phiếu thì bỏ số cân túi của phiếu; khôi phục thì ghi lại */
  log_(me, khoiPhuc ? 'Khôi phục hồ sơ QA/QC' : 'Xoá hồ sơ QA/QC', String(id), '');
  return qaRows_();
}

/* ================= THIẾT BỊ NHÀ XƯỞNG + KIỂM TRA CÂN — QC-QT.01 kiểm soát thiết bị đo lường (BM.01, BM.02) · QC-HD.01 =================
   Loại: TB = thiết bị (danh mục + lịch kiểm định / hiệu chuẩn), NK = nhật ký bảo trì / sửa chữa / HCKĐ, KC = sổ kiểm tra cân (BM.02).
   QC hoặc Quản lý ghi; người lập hoặc TP. QA/QC (Nguyễn Ô Ghel) được xoá. */
const TB_SH = 'ThietBi', TB_HEAD = ['ID', 'Loại', 'Ngày', 'Dữ liệu (JSON)', 'Người lập', 'Lúc', 'Trạng thái', 'Người sửa cuối'], TB_LOAI = ['TB', 'NK', 'KC'];
function tbRows_() { return (sheet_(TB_SH) ? rows_(TB_SH) : []).filter(r => str_(r[0])).map(r => { let d = {}; try { d = JSON.parse(str_(r[3]) || '{}'); } catch (e) {}
  return { id: str_(r[0]), loai: str_(r[1]), ngay: str_(r[2]), d, nguoi: str_(r[4]), luc: khTs_(r[5]), xoa: str_(r[6]) === 'Đã xoá' ? 1 : 0, sua: str_(r[7]) }; }); }
function webTBAll(a) { auth_(a); return tbRows_(); }
function tbCheck_(loai, d, R, id) {
  if (TB_LOAI.indexOf(loai) < 0) throw new Error('Loại hồ sơ thiết bị không hợp lệ.');
  if (loai === 'TB') {
    if (!String(d.ten || '').trim()) throw new Error('Ghi tên thiết bị.');
    ['hcNgay', 'denHan'].forEach(k => { if (d[k] && !isYmd_(d[k])) throw new Error('Ngày kiểm định / hiệu chuẩn không hợp lệ.'); });
  } else if (loai === 'NK') {
    if (!isYmd_(d.ngay)) throw new Error('Ghi ngày thực hiện.');
    if (!String(d.noiDung || d.loaiCV || '').trim()) throw new Error('Ghi nội dung công việc.');
    if (d.ngayTiep && !isYmd_(d.ngayTiep)) throw new Error('Ngày dự kiến tiếp theo không hợp lệ.');
  } else {
    if (!isYmd_(d.ngay)) throw new Error('Ghi ngày kiểm tra.');
    if (['M1', 'F1'].indexOf(d.so) < 0) throw new Error('Sổ kiểm tra cân không hợp lệ.');
    if (!d.khongSX && !(Array.isArray(d.rows) && d.rows.length)) throw new Error('Chưa có cân nào trong sổ kiểm tra.');
    if (loai === 'KC' && d.khongSX && !String(d.lyDo || '').trim()) throw new Error('Ghi lý do hôm nay không sử dụng cân để đóng gói.');
    const trung = R.find(r => str_(r[1]) === 'KC' && str_(r[0]) !== String(id || '') && str_(r[6]) !== 'Đã xoá' && (() => { try { const x = JSON.parse(str_(r[3]) || '{}'); return x.so === d.so && x.ngay === d.ngay; } catch (e) { return false; } })());
    if (trung) throw new Error('Ngày ' + d.ngay.split('-').reverse().join('/') + ' đã có sổ kiểm tra cân này — mở sổ đó để sửa.');
  }
}
const tbNgay_ = (loai, d) => loai === 'TB' ? (d.denHan || '') : (d.ngay || '');
function webTBSave(a, o) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]);
  if (!qaQC_(me)) throw new Error('Chỉ QC hoặc Quản lý ghi thiết bị / sổ kiểm tra cân.');
  o = o || {};
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = shX_(TB_SH, TB_HEAD), R = sheet_(TB_SH) ? rows_(TB_SH) : [];
    let id = String(o.id || ''), i = id ? R.findIndex(r => str_(r[0]) === id) : -1;
    if (id && i < 0) throw new Error('Không tìm thấy hồ sơ (có thể đã bị xoá).');
    if (i >= 0 && str_(R[i][1]) !== o.loai) throw new Error('Sai loại hồ sơ.');
    const d = Object.assign({}, o.d || {}); tbCheck_(o.loai, d, R, id);
    const js = JSON.stringify(d); if (js.length > 45000) throw new Error('Hồ sơ quá dài.');
    if (!id) id = o.loai + '-' + Utilities.formatDate(new Date(), tz_(), 'yyMMddHHmmss') + Math.floor(Math.random() * 90 + 10);
    if (i >= 0) sh.getRange(i + 2, 1, 1, TB_HEAD.length).setValues([[id, o.loai, tbNgay_(o.loai, d), js, str_(R[i][4]), R[i][5], '', me.ten]]);
    else sh.appendRow([id, o.loai, tbNgay_(o.loai, d), js, me.ten, new Date(), '', me.ten]);
    log_(me, o.loai === 'KC' ? 'Kiểm tra cân ' + d.so : o.loai === 'NK' ? 'Nhật ký thiết bị' : 'Thiết bị', id, String(o.loai === 'KC' ? d.ngay + ' · ' + (d.khongSX ? 'không SX' : d.ketQua || '') : (d.ma ? d.ma + ' ' : '') + (d.ten || '') + (o.loai === 'NK' ? ' · ' + (d.loaiCV || '') : '')).slice(0, 150));
    return { id, d };
  } finally { lock.releaseLock(); }
}
/* nhập nhiều hồ sơ một lần (chuyển từ file Excel) — chỉ TP. QA/QC */
function webTBNhap(a, L) {
  const me = auth_(a, [ROLES.QL]);
  if (!qaTP_(me)) throw new Error('Chỉ TP. QA/QC (' + DL_EDITOR_ + ') nhập danh sách thiết bị.');
  if (!Array.isArray(L) || !L.length || L.length > 600) throw new Error('Danh sách nhập không hợp lệ.');
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = shX_(TB_SH, TB_HEAD), R = sheet_(TB_SH) ? rows_(TB_SH).slice() : [], have = new Set(R.map(r => str_(r[0]))), now = new Date(), out = [];
    L.forEach((o, k) => {
      const d = Object.assign({}, (o && o.d) || {}); tbCheck_(o.loai, d, R, o.id);
      const id = String(o.id || (o.loai + '-' + Utilities.formatDate(now, tz_(), 'yyMMddHHmmss') + ('00' + k).slice(-3)));
      if (have.has(id)) throw new Error('Trùng mã hồ sơ ' + id + '.');
      const js = JSON.stringify(d); if (js.length > 45000) throw new Error('Hồ sơ quá dài: ' + (d.ten || id));
      const row = [id, o.loai, tbNgay_(o.loai, d), js, me.ten, now, '', me.ten]; have.add(id); R.push(row); out.push(row);
    });
    sh.getRange(sh.getLastRow() + 1, 1, out.length, TB_HEAD.length).setValues(out);
    log_(me, 'Nhập danh sách thiết bị', String(out.length), out.length + ' hồ sơ');
    return tbRows_().length;
  } finally { lock.releaseLock(); }
}
function webTBDel(a, id, khoiPhuc) {
  const me = auth_(a, [ROLES.QL, ROLES.KT, ROLES.TK, ROLES.NV, ROLES.KTK]);
  const R = sheet_(TB_SH) ? rows_(TB_SH) : [], i = R.findIndex(r => str_(r[0]) === String(id));
  if (i < 0) throw new Error('Không tìm thấy hồ sơ.');
  if (!qaTP_(me) && str_(R[i][4]) !== me.ten) throw new Error('Chỉ người lập hoặc TP. QA/QC (' + DL_EDITOR_ + ') được ' + (khoiPhuc ? 'khôi phục.' : 'xoá.'));
  sheet_(TB_SH).getRange(i + 2, 7, 1, 2).setValues([[khoiPhuc ? '' : 'Đã xoá', me.ten]]);
  log_(me, khoiPhuc ? 'Khôi phục hồ sơ thiết bị' : 'Xoá hồ sơ thiết bị', String(id), '');
  return tbRows_();
}
