/* Sổ Kho — Ô NHẬP VỪA NỘI DUNG (19/11/2026, theo anh Ghel: "bố trí các ô vừa đủ nội dung thông tin nhập")
   Mỗi ô nhập rộng đúng bằng thứ cần ghi trong đó, không chia đều cột:
   - ô ngày, giờ, tháng: vừa một ngày;  ô số: vừa một con số;  ô chọn: vừa lựa chọn dài nhất;
   - ô chữ: theo nội dung đang có / gợi ý trong ô (tên, khách hàng… thì rộng; mã, số lô thì ngắn), dài quá thì hết hàng;
   - nhãn của ô dài hơn nội dung thì lấy theo nhãn.
   Áp dụng cho các hàng ô nhập (.two, .qa-g) ở mọi màn hình trên máy tính; điện thoại giữ mỗi ô một hàng như cũ.
   Chỉ đổi cách hiển thị — không đổi dữ liệu. */
"use strict";
(function () {
  const cv = document.createElement("canvas").getContext("2d");
  const tw = (el, txt) => { const cs = getComputedStyle(el); cv.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; return cv.measureText(String(txt || "")).width * 1.1 + (parseFloat(cs.letterSpacing) || 0) * String(txt || "").length; }; /* ×1,1: phông chữ web đo bằng canvas hay hụt một chút */
  const pad = el => { const cs = getComputedStyle(el); return (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0) + (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.borderRightWidth) || 0); };
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  /* bề rộng cần cho 1 ô nhập (px), null = để nguyên / hết hàng */
  function wField(el) {
    const tag = el.tagName, ty = (el.getAttribute("type") || "text").toLowerCase(), p = pad(el);
    if (tag === "TEXTAREA") return null;
    if (tag === "SELECT") { let m = 0; for (const o of el.options) m = Math.max(m, tw(el, o.text)); return cl(m + p + 34, 110, 2000); }
    if (ty === "date") return 168; if (ty === "month") return 170; if (ty === "time") return 118; if (ty === "datetime-local") return 220;
    if (ty === "checkbox" || ty === "radio" || ty === "file" || ty === "hidden" || ty === "range") return null;
    if (ty === "number") return cl(tw(el, el.value || el.placeholder || "0000000") + p + 30, 104, 190);
    /* ô chữ: theo nội dung đang có; trống thì theo gợi ý trong ô (cắt bớt), ô có danh sách gợi ý (tên, đơn vị…) rộng hơn */
    const v = el.value || "", ph = (el.placeholder || "").slice(0, 34), base = el.getAttribute("list") ? 250 : 150;
    return cl(Math.max(tw(el, v), tw(el, ph) * (v ? 0 : 1)) + p + 14, base, 2000);
  }
  /* bề rộng chữ của nhãn (dòng chữ phía trên ô) */
  function wLabel(lb, field) { let w = 0; for (const n of lb.childNodes) { if (n === field) break; if (n.nodeType === 3) w += tw(lb, n.textContent.trim()); else if (n.nodeType === 1 && !n.matches("input,select,textarea,datalist")) w += n.getBoundingClientRect().width + 4; } return w; }
  const ROW = el => el.classList && (el.classList.contains("two") || el.classList.contains("qa-g"));
  function fitRow(row) {
    if (!row.offsetParent) return; const kids = [...row.children].filter(k => k.tagName !== "DATALIST" && k.tagName !== "SCRIPT"); if (kids.length < 2) return;
    const L = kids.filter(k => k.tagName === "LABEL" && k.querySelector("input,select,textarea")); if (L.length < 2 && !row.classList.contains("fitrow")) return;
    const full = row.clientWidth; if (full < 200) return; row.classList.add("fitrow");
    kids.forEach(k => {
      if (getComputedStyle(k).display === "none") return;
      const f = k.tagName === "LABEL" ? k.querySelector("input:not([type=checkbox]):not([type=radio]):not([type=hidden]),select,textarea") : null;
      let w = null; if (f) { w = wField(f); if (w != null) w = Math.max(w, wLabel(k, f) + 2); }
      if (w == null || w >= full - 8) { k.style.flex = "0 0 100%"; k.style.maxWidth = "100%"; k.style.width = ""; }
      else { w = Math.ceil(w); if (k.dataset.fw === String(w)) return; k.dataset.fw = String(w); k.style.flex = "0 0 " + w + "px"; k.style.width = w + "px"; k.style.maxWidth = "100%"; }
    });
  }
  let tm = 0;
  function run() { tm = 0; if (document.hidden || !window.innerWidth) return;
    const big = window.innerWidth >= 700;
    document.querySelectorAll(".two, .qa-g").forEach(r => { try { if (big) fitRow(r); else if (r.classList.contains("fitrow")) { r.classList.remove("fitrow"); [...r.children].forEach(k => { k.style.flex = ""; k.style.width = ""; k.style.maxWidth = ""; delete k.dataset.fw; }); } } catch (e) {} });
    /* ô chữ đã hết hàng mà nội dung vẫn dài hơn: rê chuột thấy đủ */
    document.querySelectorAll("input:not([type]), input[type=text]").forEach(el => { if (!el.offsetParent || !el.value) return; if (el.scrollWidth > el.clientWidth + 2) { if (!el.title || el.dataset.fitT) { el.title = el.value; el.dataset.fitT = "1"; } } else if (el.dataset.fitT) { el.removeAttribute("title"); delete el.dataset.fitT; } }); }
  const later = () => { if (!tm) tm = setTimeout(run, 140); };
  document.addEventListener("change", later, true);
  document.addEventListener("focusout", e => { const el = e.target; if (el && el.matches && el.matches("input,select")) later(); }, true);
  window.addEventListener("resize", later);
  new MutationObserver(later).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState !== "loading") later(); else document.addEventListener("DOMContentLoaded", later);
  window.fitFields = run;
})();
