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
  const o = { list: L, tm: t(d.tm), nc: Math.min(3, Math.max(1, Math.round(num_(d.nc) || 1))), hl: String(d.hl || '').trim().slice(0, 300) };
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
function webDGFGet(a, so) {
  needCT_(auth_(a));
  const od = orders_().find(x => x.so === so); if (!od) throw new Error('Không tìm thấy lệnh ' + so);
  const P = ldgMap_()[so] || {}, q = qcRows_().find(x => x.qc === P.qc) || null, TT = ttMap_(), mv = moves_();
  const btp = (P.btp || []).map(b => { const nh = mv.find(m => m.ma === b.ma && m.lo === b.lo && m.loai === 'Nhập' && !m.trangThai), it = items_().find(i => i.ma === b.ma) || {};
    return { ma: b.ma, ten: it.ten || '', lo: b.lo, kg: b.kg, nsx: nh ? (nh.nsx || nh.ngay) : '', tt: TT[lotKey_(b.ma, b.lo)] || 0 }; });
  // lệnh đóng gói trước / sau (gợi ý BTP vừa chạy, sẽ chạy cho BM.07)
  const all = orders_().filter(x => x.trangThai !== 'Đã huỷ' && /^TP\./.test(x.maSP || '')).sort((x, y) => (x.ngay + x.so < y.ngay + y.so ? -1 : 1)), i = all.findIndex(x => x.so === so);
  return { o: od, P, q, btp, forms: dgfAll_().filter(x => x.so === so), may: mayList_(), truoc: i > 0 ? all[i - 1].so : '', sau: i >= 0 && i < all.length - 1 ? all[i + 1].so : '' };
}
function webDGFAll(a, tu, den) {
  needCT_(auth_(a));
  return dgfAll_().filter(x => (!tu || x.ngay >= tu) && (!den || x.ngay <= den)).map(x => ({ id: x.id, loai: x.loai, so: x.so, ngay: x.ngay, kl: x.kl, may: (x.d && (x.d.mayTen || x.d.may)) || '', maMay: (x.d && x.d.maMay) || '' }));
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
function webDGFDel(a, id) {
  const me = auth_(a, [ROLES.QL, ROLES.KT]);
  const R = sheet_(DGF_SH) ? rows_(DGF_SH) : [], i = R.findIndex(r => str_(r[0]) === id); if (i < 0) throw new Error('Không tìm thấy phiếu.');
  sheet_(DGF_SH).getRange(i + 2, 9).setValue('Đã xoá'); log_(me, 'Xoá biểu mẫu đóng gói', id, ''); return id;
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
const CBB_SH = 'CanBaoBi', CBB_HEAD_ = ['Mã QC', 'Loại', 'Khối lượng', 'Đơn vị', 'Ngày cân', 'Người cân', 'Số lệnh', 'Thời điểm'];
const CBB_LOAI_ = { klBB: 'g', klHop: 'g', klThung: 'kg' };
function cbbRows_() {
  if (!sheet_(CBB_SH)) return [];
  return rows_(CBB_SH).filter(r => str_(r[0]) && CBB_LOAI_[str_(r[1])]).map(r => ({ qc: str_(r[0]), loai: str_(r[1]), v: num_(r[2]), dv: str_(r[3]), ngay: str_(r[4]), nguoi: str_(r[5]), so: str_(r[6]) }));
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
    add.push([qc, k, v, CBB_LOAI_[k], ngay, me.ten, String(o.so || '').slice(0, 60), new Date()]); });
  if (add.length) { const lock = LockService.getScriptLock(); lock.waitLock(20000); try { const sh = shX_(CBB_SH, CBB_HEAD_); add.forEach(r => sh.appendRow(r)); } finally { lock.releaseLock(); } }
  return cbbRows_().concat([]);
}
