/* Sổ Kho — Ô NHẬP VỪA NỘI DUNG (19/11/2026, theo anh Ghel: "tối ưu ô nhập và nội dung vừa ô nhập, tất cả")
   Áp dụng cho mọi màn hình, mọi cửa sổ nhập:
   1. Ô chữ / ô chọn nằm trong lưới nhiều cột mà nội dung dài hơn ô → tự giãn thêm vừa đủ số cột cần (2, 3… cột; hết hàng nếu cần), không cắt chữ.
   2. Ô đã hết hàng mà vẫn không đủ → chữ bị cắt hiện dấu "…" và rê chuột vào thấy đủ nội dung.
   3. Ô ngày, ô số không bị kéo giãn quá mức khi đứng một mình một hàng.
   Chỉ đổi cách hiển thị — không đổi dữ liệu, không đụng ô đang ẩn. */
"use strict";
(function () {
  const cv = document.createElement("canvas").getContext("2d");
  const wOf = (el, txt) => { const cs = getComputedStyle(el); cv.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; return cv.measureText(txt).width + (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0) + (el.tagName === "SELECT" ? 26 : 6); };
  const textOf = el => el.tagName === "SELECT" ? ((el.options[el.selectedIndex] || {}).text || "") : (el.value || "");
  const TXT = el => el.tagName === "SELECT" || (el.tagName === "INPUT" && /^(text|search|tel|email|url|)$/.test(el.getAttribute("type") || ""));
  /* ô lưới chứa ô nhập: nhãn (label) hoặc chính ô nhập, là con trực tiếp của một lưới ≥ 2 cột. Trả về {c: ô lưới, W: bề rộng từng cột, gap} */
  function cell(el) { let c = el.closest("label") || el; const p = c.parentElement; if (!p) return null; const cs = getComputedStyle(p); if (cs.display !== "grid" && cs.display !== "inline-grid") return null;
    const W = cs.gridTemplateColumns.split(" ").map(parseFloat).filter(x => x > 0); return W.length >= 2 ? { c, W, gap: parseFloat(cs.columnGap) || 0 } : null; }
  function fitOne(el) {
    if (!TXT(el) || el.disabled && !el.value) return; const cw = el.clientWidth; if (cw < 40 || !el.offsetParent) return; /* ô ẩn / chưa vẽ / đang thu nhỏ bất thường */
    const t = textOf(el); if (!t) { if (el.dataset.fitT) { el.removeAttribute("title"); delete el.dataset.fitT; } return; }
    const need = wOf(el, t);
    if (need > cw + 1) { const G = cell(el), cur = G ? +(G.c.dataset.fit || 1) : 0;
      /* giãn vừa đủ số cột cần (không phải lúc nào cũng hết hàng) để hàng vẫn cân: 1 → 2 → … → hết hàng */
      if (G && cur < G.W.length && G.c.style.gridColumn !== "1 / -1") { const cellW = G.c.getBoundingClientRect().width, extra = cellW - cw, colW = G.W[0]; let n = cur + 1;
        while (n < G.W.length && n * colW + (n - 1) * G.gap - extra < need) n++;
        G.c.dataset.fit = String(n); G.c.style.gridColumn = n >= G.W.length ? "1 / -1" : "span " + n; return; }
      if (!el.title || el.dataset.fitT) { el.title = t; el.dataset.fitT = "1"; } }
    else if (el.dataset.fitT) { el.removeAttribute("title"); delete el.dataset.fitT; }
  }
  let tm = 0;
  function run() { tm = 0; if (document.hidden || !window.innerWidth || window.innerWidth < 200) return; /* cửa sổ đang ẩn: số đo không tin được */ const A = document.querySelectorAll("input, select"); for (let i = 0; i < A.length; i++) { try { fitOne(A[i]); } catch (e) {} } }
  const later = () => { if (!tm) tm = setTimeout(run, 160); };
  document.addEventListener("input", e => { const el = e.target; if (el && el.matches && el.matches("input, select")) later(); }, true);
  document.addEventListener("change", later, true);
  window.addEventListener("resize", later);
  new MutationObserver(later).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState !== "loading") later(); else document.addEventListener("DOMContentLoaded", later);
  window.fitFields = run;
})();
