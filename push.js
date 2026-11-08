/* Sổ Kho — thông báo đẩy trên điện thoại / máy tính (Web Push qua Edge Function "push" của Supabase). */
"use strict";
(function () {
  const ok = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  async function call(body) {
    const { data, error } = await window.SOKHO_SB.functions.invoke("push", { body });
    if (error) { let m = error.message; try { const j = await error.context.json(); if (j && j.error) m = j.error; } catch (e) {} throw new Error(m); }
    if (data && data.error) throw new Error(data.error);
    return data;
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
  const send = (title, body, to, tag) => call({ a: "send", title, body, to, tag, url: "./" }).catch(e => console.warn("push", e.message));
  window.SKPush = { ok, state, on, off, test: () => call({ a: "test" }), send };

  /* ----- Sự kiện gửi thông báo (gọi sau khi lưu thành công) ----- */
  const me = () => (window.S && S.me && S.me.ten) || "";
  const QL = ["Quản lý"], KHO = ["Quản lý", "Thủ kho", "Kế toán kho", "Kế toán"];
  window.pushHook = function (fn, args, r) {
    try {
      const o = args[1] || {};
      if (fn === "createOrder") send("Lệnh SX BTP mới: " + (o.so || ""), [o.maSP, o.slDuKien ? o.slDuKien + " kg" : "", "lập bởi " + me()].filter(Boolean).join(" · "), { qc: true, roles: QL, ten: ["Phan Thị Cẩm Tiên"] }, "lsx-" + o.so);
      else if (fn === "savePack" && !o.hoanThanh && !((window.S && S.lenh) || []).some(x => x.so === o.so)) send("Lệnh đóng gói mới: " + (o.so || ""), [o.qc, o.dv ? o.dv + " gói/chai" : "", "lập bởi " + me()].filter(Boolean).join(" · "), { qc: true, roles: KHO }, "dg-" + o.so);
      else if (fn === "createPackOrder") send("Lệnh đóng gói mới: " + (o.so || ""), [o.qc, o.sp, "lập bởi " + me()].filter(Boolean).join(" · "), { qc: true, roles: KHO }, "dg-" + o.so);
      else if (fn === "webKHGui" && r) send("Kế hoạch phối trộn đã gửi", r + " lệnh · gửi bởi " + me(), { all: true }, "kh");
      else if (fn === "setQC" && (args[3] === "Đạt" || args[3] === "Không đạt")) send((args[3] === "Đạt" ? "✅ QC Đạt: " : "⛔ QC Không đạt: ") + args[1], "Lô " + args[2] + (args[4] ? " · " + args[4] : "") + " · " + me(), { roles: KHO, ten: ["Phan Thị Cẩm Tiên"] }, "qc-" + args[1] + args[2]);
      else if (fn === "saveMove" && o.loai === "Nhập") send("Nhập kho: " + (o.ma || ""), [o.lo ? "Lô " + o.lo : "", o.soLuong ? o.soLuong + " kg" : "", "nhập bởi " + me(), "kiểm QC nếu cần"].filter(Boolean).join(" · "), { qc: true }, "nhap-" + o.ma + o.lo);
    } catch (e) {}
  };

  /* ----- Dòng bật / tắt trong ô chuông ----- */
  window.pushRow = async function (box) {
    const st = await state().catch(() => "ns");
    const T = { on: ["🔔 Thông báo trên máy này: <b style='color:#2e7d32'>Đang bật</b>", "Tắt", "Gửi thử"], off: ["🔕 Thông báo trên máy này: <b>Đang tắt</b>", "Bật thông báo"], denied: ["🔕 Máy đã chặn thông báo của Sổ Kho — bật lại trong Cài đặt của điện thoại / trình duyệt."], "ios-browser": ["📲 Muốn nhận thông báo trên iPhone: cài Sổ Kho ra màn hình chính rồi mở từ biểu tượng đó."], ns: ["Máy / trình duyệt này không hỗ trợ thông báo đẩy."] }[st];
    box.innerHTML = `<div style="padding:10px 12px;border-top:1px solid var(--line,#e3e8ee);font-size:13.5px"><div>${T[0]}</div>${T[1] ? `<div style="display:flex;gap:6px;margin-top:6px"><button class="btn small${st === "off" ? " primary" : ""}" type="button" data-p="${st === "on" ? "off" : "on"}">${T[1]}</button>${T[2] ? `<button class="btn small" type="button" data-p="test">${T[2]}</button>` : ""}</div>` : ""}</div>`;
    box.querySelectorAll("[data-p]").forEach(b => b.onclick = async ev => {
      ev.stopPropagation(); b.disabled = true;
      try {
        const k = b.dataset.p;
        if (k === "on") { await on(); toast("Đã bật thông báo trên máy này"); }
        else if (k === "off") { await off(); toast("Đã tắt thông báo trên máy này"); }
        else { const r = await call({ a: "test" }); toast(r.sent ? "Đã gửi thử — xem thông báo trên máy" : "Chưa gửi được — thử tắt rồi bật lại"); }
      } catch (e) { toast(e.message); }
      window.pushRow(box);
    });
  };
})();
