/**
 * Sổ Kho — BẢN TIN BUỔI SÁNG qua Gmail.
 * 1) Dán file này vào dự án Apps Script của Sổ Kho cũ (thêm tệp mới tên BanTin).
 * 2) Thay dòng BT_MA bằng mã bản tin (Sổ Kho → chuông 🔔 → Bản tin buổi sáng → Mã bản tin).
 * 3) Chọn hàm caiBanTin → bấm Chạy (lần đầu Google hỏi quyền gửi email → Cho phép).
 * Mỗi sáng khoảng 7 giờ: ai bật thông báo nhận trên điện thoại, ai có email nhận qua Gmail — mỗi người chỉ thấy việc của mình.
 */
const BT_URL = 'https://boioqznuvhhqfllocxbo.supabase.co/functions/v1/push';
const BT_MA = 'DAN_MA_BAN_TIN_O_DAY';
const BT_GIO = 7;

function banTinSang() {
  const r = UrlFetchApp.fetch(BT_URL, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ a: 'run', token: BT_MA })
  });
  const txt = r.getContentText() || '{}';
  if (r.getResponseCode() !== 200) throw new Error('Bản tin lỗi ' + r.getResponseCode() + ': ' + txt.slice(0, 300));
  const j = JSON.parse(txt);
  (j.mails || []).forEach(m => MailApp.sendEmail({ to: m.to, subject: m.subject, htmlBody: m.html, name: 'Sổ Kho' }));
  const kq = 'Bản tin: ' + (j.mails || []).length + ' email, ' + (j.pushed || 0) + ' thông báo điện thoại.';
  Logger.log(kq);
  return kq;
}

/** Chạy 1 lần: hẹn giờ gửi mỗi sáng và gửi thử ngay. */
function caiBanTin() {
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === 'banTinSang') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('banTinSang').timeBased().everyDays(1).atHour(BT_GIO).nearMinute(0).inTimezone('Asia/Ho_Chi_Minh').create();
  return banTinSang();
}

/** Tắt bản tin hằng ngày. */
function tatBanTin() {
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === 'banTinSang') ScriptApp.deleteTrigger(t); });
}
