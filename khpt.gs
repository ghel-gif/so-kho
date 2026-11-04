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
  return { kh, may: mayList_(), nsx: g.nsx, qc: g.qc };
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
  return { p: p || null, ma, lo, it, nsx: nh ? (nh.nsx || nh.ngay) : (od ? (od.ngayHT || od.ngay) : ''), soMoi: 'CL-' + nam + '-' + String(mx + 1).padStart(3, '0'), tt: ttMap_()[lotKey_(ma, lo)] || (od ? od.tyTrong : 0) || 0 };
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
