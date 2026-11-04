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
