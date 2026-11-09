/* Sổ Kho — thông báo đẩy trên điện thoại / máy tính (Web Push qua Edge Function "push" của Supabase). */
"use strict";
(function () {
  const ok = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  async function call(body) {
    /* chỉ gửi phiên đăng nhập (Authorization) — hàm "push" xác thực theo người dùng, không đọc apikey */
    const { data: ss } = await window.SOKHO_SB.auth.getSession(), tok = ss && ss.session && ss.session.access_token;
    if (!tok) throw new Error("Phiên đăng nhập đã hết — đăng nhập lại Sổ Kho.");
    const r = await fetch(window.SOKHO_CFG.url + "/functions/v1/push", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + tok }, body: JSON.stringify(body) });
    let j = null; try { j = await r.json(); } catch (e) {}
    if (!r.ok || (j && j.error)) {
      const m = (j && (j.error || j.message)) || ("Lỗi " + r.status);
      throw new Error(r.status === 404 ? "Chưa có hàm gửi thông báo (push) trên Supabase." : m);
    }
    return j;
  }
  const b64u = s => { const p = "=".repeat((4 - s.length % 4) % 4), b = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(b, c => c.charCodeAt(0)); };
  const reg = () => navigator.serviceWorker.register("sw.js", { scope: "./" });
  if (ok()) { reg().catch(() => {}); navigator.serviceWorker.addEventListener("message", e => { if (e.data && e.data.sokhoGo) { try { location.href = e.data.sokhoGo; } catch (x) {} } }); }

  async function state() {
    if (!ok()) return ios && !standalone() ? "ios-browser" : "ns";
    const r = await navigator.serviceWorker.getRegistration("./"); const s = r && await r.pushManager.getSubscription();
    return s ? "on" : (Notification.permission === "denied" ? "denied" : "off");
  }
  async function on() {
    if (!ok()) throw new Error(ios && !standalone() ? "Trên iPhone phải mở Sổ Kho từ biểu tượng ngoài màn hình chính (đã cài như app) mới bật được thông báo." : "Máy / trình duyệt này không hỗ trợ thông báo đẩy.");
    const p = await Notification.requestPermission();
    if (p !== "granted") throw new Error("Chưa cho phép thông báo. Vào Cài đặt → Thông báo → Sổ Kho để bật lại.");
    const r = await reg(); await navigator.serviceWorker.ready;
    const { pub } = await call({ a: "key" });
    let s = await r.pushManager.getSubscription();
    if (!s) s = await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(pub) });
    await call({ a: "sub", sub: s.toJSON(), ua: navigator.userAgent });
  }
  async function off() {
    const r = await navigator.serviceWorker.getRegistration("./"); const s = r && await r.pushManager.getSubscription();
    if (s) { try { await call({ a: "unsub", endpoint: s.endpoint }); } catch (e) {} await s.unsubscribe(); }
  }
  const send = (title, body, to, tag) => (window.SOKHO_WEB && SOKHO_WEB.khoThu && SOKHO_WEB.khoThu()) ? Promise.resolve() : call({ a: "send", title, body, to, tag, url: "./" }).catch(e => console.warn("push", e.message));
  window.SKPush = { ok, state, on, off, test: () => call({ a: "test" }), send };

  /* ----- Sự kiện gửi thông báo (gọi sau khi lưu thành công) ----- */
  const me = () => (window.S && S.me && S.me.ten) || "";
  const QL = ["Quản lý"], KHO = ["Quản lý", "Thủ kho", "Kế toán kho", "Kế toán"];
  window.pushHook = function (fn, args, r) {
    try {
      const o = args[1] || {};
      if (fn === "createOrder") send("Lệnh SX BTP mới: " + (o.so || ""), [o.maSP, o.slDuKien ? o.slDuKien + " kg" : "", "lập bởi " + me()].filter(Boolean).join(" · "), { qc: true, roles: QL, ten: ["Phan Thị Cẩm Tiên"] }, "lsx-" + o.so);
      else if (fn === "savePack" && !o.hoanThanh && !((window.S && S.lenh) || []).some(x => x.so === o.so)) send("Lệnh đóng gói mới: " + (o.so || ""), [o.qc, o.dv ? o.dv + " gói/chai" : "", "lập bởi " + me()].filter(Boolean).join(" · "), { qc: true, roles: KHO }, "dg-" + o.so);
      else if (fn === "savePack" && o.hoanThanh && String(o.ngay || "") >= "2026-11-05") setTimeout(async () => { try {
        const D = await api0("webDGFGet", S.auth, o.so), F = (D && D.forms) || [], miss = [];
        if (!F.some(x => x.loai === "BM05")) miss.push("BM.05"); if (!F.some(x => /^BM0[46]$/.test(x.loai))) miss.push("BM.04/06"); if (!F.some(x => x.loai === "BM07")) miss.push("BM.07");
        if (miss.length) send("📋 Thiếu biểu mẫu QC: " + o.so, "Lệnh đã hoàn thành nhưng chưa lập " + miss.join(", ") + " · " + (o.qc || ""), { qc: true }, "bm-" + o.so);
      } catch (e) {} }, 1500);
      else if (fn === "createPackOrder") send("Lệnh đóng gói mới: " + (o.so || ""), [o.qc, o.sp, "lập bởi " + me()].filter(Boolean).join(" · "), { qc: true, roles: KHO }, "dg-" + o.so);
      else if (fn === "setQC" && (args[3] === "Đạt" || args[3] === "Không đạt")) send((args[3] === "Đạt" ? "✅ QC Đạt: " : "⛔ QC Không đạt: ") + args[1], "Lô " + args[2] + (args[4] ? " · " + args[4] : "") + " · " + me(), { roles: KHO, ten: ["Phan Thị Cẩm Tiên"] }, "qc-" + args[1] + args[2]);
      else if (fn === "saveMove" && o.loai === "Nhập") send("Nhập kho: " + (o.ma || ""), [o.lo ? "Lô " + o.lo : "", o.soLuong ? o.soLuong + " kg" : "", "nhập bởi " + me(), "kiểm QC nếu cần"].filter(Boolean).join(" · "), { qc: true }, "nhap-" + o.ma + o.lo);
    } catch (e) {}
  };

  /* ----- Bản tin buổi sáng: email + bật/tắt từng người ----- */
  const E = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  window.briefDlg = async function () {
    const w = document.createElement("div"); w.className = "cfm";
    w.innerHTML = `<div class="cfm-box" style="max-width:min(900px,96vw);width:900px"><h2>☀️ Bản tin buổi sáng</h2><div id="btBody"><p class="note">Đang tải…</p></div><div class="actions"><button class="btn" type="button" data-x>Đóng</button></div></div>`;
    document.body.appendChild(w); w.querySelector("[data-x]").onclick = () => w.remove();
    const B = w.querySelector("#btBody");
    let D; try { D = await call({ a: "bcfg" }); } catch (e) { B.innerHTML = `<p class="note" style="color:#c62828">${E(e.message)}</p>`; return; }
    const me = D.me, chk = (v, k) => `<label style="display:inline-flex;gap:6px;align-items:center;margin-right:14px"><input type="checkbox" data-k="${k}" ${v !== false ? "checked" : ""}> ${k === "email_on" ? "Nhận qua email" : "Nhận thông báo điện thoại"}</label>`;
    B.innerHTML = `<p class="note">Khoảng <b>7 giờ sáng</b> mỗi ngày, mỗi người nhận bản tin <b>chỉ gồm việc của mình</b>: QC thấy lô chờ QC và biểu mẫu còn thiếu; thủ kho, kế toán thấy âm kho, hết hạn, lệnh thiếu BTP / nguyên liệu; nhân viên thấy lệnh do mình lập; Quản lý thấy tất cả. Ngày không có việc tồn thì không gửi.</p>
      <h3 style="margin:10px 0 6px">Bản tin của tôi (${E(me.ten)})</h3>
      <div data-row="${E(me.ten)}" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center"><input type="email" data-k="email" placeholder="Email nhận bản tin, VD ten@gmail.com" value="${E(me.email || "")}" style="flex:1 1 260px;min-width:220px">${chk(me.email_on, "email_on")}${chk(me.push_on, "push_on")}<button class="btn primary small" type="button" data-save>Lưu</button></div>
      <div style="margin-top:8px"><button class="btn small" type="button" id="btMe">Xem bản tin hôm nay của tôi</button> <span class="note">(gửi luôn 1 thông báo thử lên máy đã bật)</span></div><div id="btPrev"></div>
      ${D.all ? `<h3 style="margin:16px 0 6px">Tất cả tài khoản (Quản lý điền email giúp)</h3><div class="dgx"><table><thead><tr><th>Người dùng</th><th>Vai trò</th><th>Email</th><th>Email</th><th>Điện thoại</th><th></th></tr></thead><tbody>${D.all.map(u => `<tr data-row="${E(u.ten)}"><td><b>${E(u.ten)}</b></td><td>${E(u.vai_tro || "")}${u.qc ? " · QC" : ""}</td><td><input type="email" data-k="email" value="${E(u.email || "")}" placeholder="email…" style="min-width:200px"></td><td style="text-align:center"><input type="checkbox" data-k="email_on" ${u.email_on !== false ? "checked" : ""}></td><td style="text-align:center"><input type="checkbox" data-k="push_on" ${u.push_on !== false ? "checked" : ""}></td><td><button class="btn small" type="button" data-save>Lưu</button></td></tr>`).join("")}</tbody></table></div>
      <details style="margin-top:14px"><summary><b>Cài gửi email tự động bằng Gmail (làm 1 lần)</b></summary>
        <ol style="margin:8px 0 0;padding-left:20px;line-height:1.6"><li>Mở dự án <b>Apps Script</b> của Sổ Kho cũ (script.google.com) → bấm <b>+</b> cạnh Tệp → <b>Tập lệnh</b>, đặt tên <b>BanTin</b>.</li><li>Xoá nội dung có sẵn, dán đoạn code bên dưới (đã điền sẵn mã bản tin) → bấm 💾 Lưu.</li><li>Ở thanh trên chọn hàm <b>caiBanTin</b> → bấm <b>Chạy</b> → Google hỏi quyền → chọn tài khoản → <b>Cho phép</b>.</li><li>Xong: gửi thử ngay 1 lần, sau đó tự gửi mỗi sáng khoảng 7 giờ từ Gmail của anh.</li></ol>
        <p class="note" style="color:#b26a00">Mã bản tin là mã bí mật — chỉ dán vào Apps Script, không gửi cho ai.</p>
        <div style="display:flex;gap:8px;margin:6px 0"><button class="btn small primary" type="button" id="btCopy">📋 Chép code Apps Script</button></div>
        <textarea id="btCode" readonly style="width:100%;height:180px;font:12px/1.4 ui-monospace,Consolas,monospace"></textarea></details>` : ""}`;
    B.querySelectorAll("[data-save]").forEach(btn => btn.onclick = async () => {
      const r = btn.closest("[data-row]"), g = k => r.querySelector(`[data-k="${k}"]`);
      btn.disabled = true;
      try { await call({ a: "bset", ten: r.dataset.row, email: g("email").value.trim(), email_on: g("email_on").checked, push_on: g("push_on").checked }); toast("Đã lưu bản tin của " + r.dataset.row); }
      catch (e) { toast(e.message); } btn.disabled = false;
    });
    B.querySelector("#btMe").onclick = async ev => {
      const b = ev.target; b.disabled = true; const P = B.querySelector("#btPrev"); P.innerHTML = `<p class="note">Đang lập bản tin… (khoảng 5–15 giây)</p>`;
      try { const r = await call({ a: "bme", force: true }); P.innerHTML = `<div style="margin-top:8px;border:1px solid var(--line,#dde3ea);border-radius:10px;padding:10px 12px;background:#fff;color:#1d2a22;max-height:420px;overflow:auto">${r.html}</div>`; }
      catch (e) { P.innerHTML = `<p class="note" style="color:#c62828">${E(e.message)}</p>`; } b.disabled = false;
    };
    if (D.all) {
      try { const src = await (await fetch("apps-script/BanTin.gs?v=" + Date.now(), { cache: "no-store" })).text(); B.querySelector("#btCode").value = src.replace("DAN_MA_BAN_TIN_O_DAY", D.token || ""); } catch (e) {}
      B.querySelector("#btCopy").onclick = async () => { const t = B.querySelector("#btCode"); try { await navigator.clipboard.writeText(t.value); } catch (e) { t.select(); document.execCommand("copy"); } toast("Đã chép code — dán vào tệp BanTin trong Apps Script"); };
    }
  };

  /* ----- Dòng bật / tắt trong ô chuông ----- */
  window.pushRow = async function (box) {
    const st = await state().catch(() => "ns");
    const T = { on: ["🔔 Thông báo trên máy này: <b style='color:#2e7d32'>Đang bật</b>", "Tắt", "Gửi thử"], off: ["🔕 Thông báo trên máy này: <b>Đang tắt</b>", "Bật thông báo"], denied: ["🔕 Máy đã chặn thông báo của Sổ Kho — bật lại trong Cài đặt của điện thoại / trình duyệt."], "ios-browser": ["📲 Muốn nhận thông báo trên iPhone: cài Sổ Kho ra màn hình chính rồi mở từ biểu tượng đó."], ns: ["Máy / trình duyệt này không hỗ trợ thông báo đẩy."] }[st];
    box.innerHTML = `<div style="padding:10px 12px;border-top:1px solid var(--line,#e3e8ee);font-size:13.5px"><div>${T[0]}</div><div style="margin-top:8px"><button class="btn small" type="button" data-p="brief">☀️ Bản tin buổi sáng…</button></div>${T[1] ? `<div style="display:flex;gap:6px;margin-top:6px"><button class="btn small${st === "off" ? " primary" : ""}" type="button" data-p="${st === "on" ? "off" : "on"}">${T[1]}</button>${T[2] ? `<button class="btn small" type="button" data-p="test">${T[2]}</button>` : ""}</div>` : ""}</div>`;
    box.querySelectorAll("[data-p]").forEach(b => b.onclick = async ev => {
      ev.stopPropagation(); b.disabled = true;
      try {
        const k = b.dataset.p;
        if (k === "brief") { const bp = document.getElementById("bellPop"); if (bp) bp.remove(); window.briefDlg(); return; }
        if (k === "on") { await on(); toast("Đã bật thông báo trên máy này"); }
        else if (k === "off") { await off(); toast("Đã tắt thông báo trên máy này"); }
        else { const r = await call({ a: "test" }); toast(r.sent ? "Đã gửi thử — xem thông báo trên máy" : "Chưa gửi được — thử tắt rồi bật lại"); }
      } catch (e) { toast(e.message); }
      window.pushRow(box);
    });
  };
})();
