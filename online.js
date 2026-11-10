/* ============================================================================
   Sổ Kho · Ai đang online — tài khoản Quản lý xem ai đang mở web, đang ở trang nào.
   Dùng Supabase Realtime Presence: mỗi máy báo "đang có mặt" qua kết nối trực tiếp,
   không ghi gì vào cơ sở dữ liệu; đóng trang / mất mạng là tự biến mất khỏi danh sách.
   ========================================================================== */
"use strict";
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hm = t => { const d = new Date(t); return isNaN(d) ? "" : d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }); };
  let ch = null, me = null, tab = "", since = 0, state = {}, st = "", tries = 0, retryT = 0;
  const QL = () => !!(me && me.vaiTro === "Quản lý");
  const dev = () => /iPad|Tablet/i.test(navigator.userAgent) ? "Máy tính bảng" : /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "Điện thoại" : "Máy tính";
  const devKey = () => { let k = ""; try { k = localStorage.getItem("sokho_dev") || ""; if (!k) { k = Math.random().toString(36).slice(2, 10); localStorage.setItem("sokho_dev", k); } } catch (e) { k = k || Math.random().toString(36).slice(2, 10); } return k; };
  const tabName = t => { const b = document.querySelector(`nav button[data-tab="${t}"]`); if (!b) return t || ""; const c = b.cloneNode(true); c.querySelectorAll(".badge,.cnt,.nbadge,span[class*=cnt],span[class*=badge]").forEach(x => x.remove()); return c.textContent.replace(/\s+/g, " ").trim().replace(/\s*\(\d+\)$/, ""); };
  const payload = () => ({ ten: me.ten, vt: me.vaiTro || "", tab, tn: tabName(tab), dv: dev(), since, at: Date.now(), nen: document.visibilityState === "hidden" });
  async function track() { if (!ch || st !== "SUBSCRIBED") return; try { await ch.track(payload()); } catch (e) { } }

  /* danh sách người: gộp theo tên, mỗi máy một dòng */
  function people() {
    const P = {};
    Object.values(state || {}).forEach(metas => {
      const m = (metas || []).slice().sort((a, b) => (b.at || 0) - (a.at || 0))[0]; if (!m || !m.ten) return;
      const x = P[m.ten] || (P[m.ten] = { ten: m.ten, vt: m.vt, may: [] }); x.may.push(m);
    });
    return Object.values(P).map(x => { x.may.sort((a, b) => (b.at || 0) - (a.at || 0)); x.nen = x.may.every(m => m.nen); return x; })
      .sort((a, b) => (a.ten === me.ten ? -1 : b.ten === me.ten ? 1 : 0) || (a.nen - b.nen) || String(a.ten).localeCompare(String(b.ten), "vi"));
  }
  function btn() {
    if (!QL()) return; let b = $("onlBtn"); const bell = $("bellBtn");
    if (!b && bell) {
      b = document.createElement("button"); b.id = "onlBtn"; b.type = "button"; b.className = "onlb"; b.title = "Ai đang online"; b.setAttribute("aria-label", "Ai đang online");
      b.innerHTML = '<span class="onl-dot"></span><span id="onlCnt">…</span>'; bell.parentNode.insertBefore(b, bell);
      b.onclick = e => { e.stopPropagation(); const p = $("onlPop"); if (p) p.remove(); else pop(); };
    }
    return b;
  }
  function upd() {
    if (!QL()) return; const b = btn(); if (!b) return; const L = people(), n = L.filter(x => !x.nen).length;
    $("onlCnt").textContent = st === "SUBSCRIBED" ? String(n) : "…"; b.classList.toggle("off", st !== "SUBSCRIBED");
    b.title = st === "SUBSCRIBED" ? `${n} người đang online${L.length > n ? " · " + (L.length - n) + " người để trang chạy nền" : ""}` : "Đang kết nối danh sách online…";
    if ($("onlPop")) pop(true);
  }
  function pop(keep) {
    let p = $("onlPop"); if (!p && keep) return;
    if (!p) { p = document.createElement("div"); p.id = "onlPop"; p.className = "bellpop onlpop"; document.body.appendChild(p); }
    const L = people(), n = L.filter(x => !x.nen).length;
    const row = x => `<div class="onl-i${x.nen ? " nen" : ""}"><span class="onl-d"></span><div class="onl-x"><div><b>${esc(x.ten)}</b>${x.vt ? ` <small>${esc(x.vt)}</small>` : ""}${x.ten === me.ten ? ' <span class="onl-me">bạn</span>' : ""}</div>${x.may.map(m => `<div class="onl-m">${m.nen ? "Để chạy nền · " : ""}<b>${esc(m.tn || "Bàn làm việc")}</b> · ${esc(m.dv || "")} · online từ ${hm(m.since)}</div>`).join("")}</div></div>`;
    p.innerHTML = `<div class="bh"><b>Đang online${st === "SUBSCRIBED" ? " · " + n + " người" : ""}</b><small>Tự cập nhật · chỉ Quản lý thấy</small></div>` +
      (st === "SUBSCRIBED" ? (L.length ? L.map(row).join("") : '<div class="none">Chưa thấy ai.</div>') :
        st === "CHANNEL_ERROR" || st === "TIMED_OUT" || st === "CLOSED" ? '<div class="none">Không kết nối được danh sách online. Kiểm tra mạng rồi tải lại trang.</div>' : '<div class="none">Đang kết nối…</div>') +
      '<div class="onl-n">Danh sách gồm những ai đang mở Sổ Kho bản web. Đóng trang hoặc mất mạng thì sau khoảng nửa phút sẽ tự biến mất.</div>';
  }
  document.addEventListener("click", e => { const p = $("onlPop"); if (p && !p.contains(e.target) && !(e.target.closest && e.target.closest("#onlBtn"))) p.remove(); });

  window.onlStart = function () {
    const sb = window.SOKHO_SB; if (!sb || typeof sb.channel !== "function" || typeof S === "undefined" || !S.me) return;
    window.onlStop(true); me = S.me; since = since || Date.now(); tab = S.tab || "";
    ch = sb.channel("sokho-online", { config: { presence: { key: me.ten + "|" + devKey() } } });
    ch.on("presence", { event: "sync" }, () => { state = ch.presenceState(); upd(); });
    ch.subscribe(s => {
      st = s; if (s === "SUBSCRIBED") { tries = 0; track(); }
      if ((s === "CHANNEL_ERROR" || s === "TIMED_OUT") && tries < 5) { clearTimeout(retryT); retryT = setTimeout(() => { tries++; window.onlStart(); }, 15000 * (tries + 1)); }
      upd();
    });
    btn(); upd();
  };
  window.onlStop = function (keepSince) {
    clearTimeout(retryT); if (ch) { const c = ch; ch = null; try { c.untrack(); } catch (e) { } try { window.SOKHO_SB.removeChannel(c); } catch (e) { } }
    st = ""; state = {}; if (!keepSince) { since = 0; const b = $("onlBtn"); if (b) b.remove(); const p = $("onlPop"); if (p) p.remove(); }
  };
  window.onlTab = function (t) { tab = t; track(); };
  document.addEventListener("visibilitychange", () => { track(); if (document.visibilityState === "visible" && ch && st && st !== "SUBSCRIBED" && st !== "joining") window.onlStart(); });
})();
