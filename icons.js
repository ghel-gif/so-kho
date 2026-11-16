/* Sổ Kho — biểu tượng nét vẽ thay emoji (16/11/2026).
   Giao diện dùng 2 kiểu biểu tượng lẫn nhau: nét vẽ (thanh trái) và emoji màu (trong nút, tiêu đề, phiếu). File này đổi emoji trong CHỮ ĐÃ HIỆN
   trên trang thành biểu tượng nét vẽ cùng kiểu, cùng màu chữ — không đụng tới mã nguồn các mục, nên chữ trong ô nhập, danh sách chọn, bản in,
   thông báo đẩy vẫn giữ nguyên. Emoji không có trong bảng thì để nguyên. */
(function () {
  "use strict";
  const P = {
    print: "M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z",
    box: "M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8",
    send: "M22 2L11 13M22 2l-7 20-4-9-9-4z",
    okc: "M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4L12 14l-3-3",
    ban: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM4.9 4.9l14.2 14.2",
    right: "M5 12h14M13 6l6 6-6 6",
    lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
    unlock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 7.5-2",
    clip: "M9 2h6v4H9zM15 4h3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3M9 12h6M9 16h6",
    scale: "M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z",
    search: "M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM21 21l-4.3-4.3",
    save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8",
    cam: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
    down: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
    up: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
    key: "M7.5 12.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM10.7 13.8L21 3.5M17 7.5l3 3M14 10.5l2.5 2.5",
    tool: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z",
    flask: "M9 3h6M10 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3L14 9V3M7 15h10",
    trash: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6",
    clock: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2",
    hour: "M5 22h14M5 2h14M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4a2 2 0 0 0 .6-1.4V2",
    sun: "M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8",
    moon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z",
    eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    home: "M3 21h18M6 21V10l6-6 6 6v11M10 21v-5h4v5",
    file: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5",
    cart: "M9 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM19 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM1 2h4l2.7 12.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L22 7H6",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
    belloff: "M18 8a6 6 0 0 0-9.3-5M6 8c0 7-3 9-3 9h13M13.7 21a2 2 0 0 1-3.4 0M2 2l20 20",
    chart: "M18 20V10M12 20V4M6 20v-6",
    attach: "M21.4 11.1l-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5",
    img: "M3 3h18v18H3zM8.5 7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM21 15l-5-5L5 21",
    alert: "M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01",
    pen: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
    bulb: "M9 18h6M10 22h4M15.1 14c.2-1 .7-1.7 1.4-2.5A4.6 4.6 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.2 1.5 1.4 2.5z",
    tdown: "M23 18l-9.5-9.5-5 5L1 6M17 18h6v-6",
    spark: "M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z",
    cal: "M3 4h18v18H3zM16 2v4M8 2v4M3 10h18",
    phone: "M6 2h12v20H6zM12 18h.01",
    like: "M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.3a2 2 0 0 0 2-1.7l1.4-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
  };
  /* emoji → [tên biểu tượng, lớp màu] */
  const M = {
    "🖨": ["print"], "📦": ["box"], "📨": ["send"], "✅": ["okc", "ok"], "⛔": ["ban", "bad"], "👉": ["right"], "🔒": ["lock"], "🔓": ["unlock"],
    "📋": ["clip"], "⚖": ["scale"], "🔍": ["search"], "🔎": ["search"], "💾": ["save"], "📷": ["cam"], "📥": ["down"], "⬆": ["up"], "🔑": ["key"],
    "🛠": ["tool"], "🧪": ["flask"], "⚗": ["flask"], "🗑": ["trash"], "🕒": ["clock"], "⏳": ["hour"], "⌛": ["hour"], "☀": ["sun"], "🌙": ["moon"],
    "👁": ["eye"], "🏢": ["home"], "📄": ["file"], "📝": ["file"], "🛒": ["cart"], "🔔": ["bell"], "🔕": ["belloff"], "📊": ["chart"], "📎": ["attach"],
    "🖼": ["img"], "⚠": ["alert"], "🚨": ["alert", "bad"], "✍": ["pen"], "✏": ["pen"], "💡": ["bulb"], "📉": ["tdown"], "🧽": ["spark"], "📅": ["cal"],
    "📲": ["phone"], "👍": ["like"]
  };
  const RE = new RegExp("(" + Object.keys(M).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")\\uFE0F?", "gu");
  const SKIP = /^(SCRIPT|STYLE|TEXTAREA|OPTION|SELECT|TITLE|INPUT|svg|CANVAS)$/i, NS = "http://www.w3.org/2000/svg";
  const skip = el => { for (let p = el; p && p.nodeType === 1; p = p.parentElement) { if (SKIP.test(p.nodeName) || p.id === "printArea" || p.isContentEditable || (p.classList && (p.classList.contains("noic") || p.classList.contains("pq")))) return true; } return false; };
  const svg = (n, c, ch) => { const s = document.createElementNS(NS, "svg"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("class", "ei" + (c ? " " + c : "")); s.setAttribute("aria-hidden", "true"); s.dataset.e = ch;
    const p = document.createElementNS(NS, "path"); p.setAttribute("d", P[n]); s.appendChild(p); return s; };
  function text(t) {
    const v = t.nodeValue; if (!v || v.length < 1) return; RE.lastIndex = 0; if (!RE.test(v)) return; if (!t.parentElement || skip(t.parentElement)) return;
    const f = document.createDocumentFragment(); let i = 0, m; RE.lastIndex = 0;
    while ((m = RE.exec(v))) { if (m.index > i) f.appendChild(document.createTextNode(v.slice(i, m.index))); const d = M[m[1]]; f.appendChild(svg(d[0], d[1], m[1])); i = m.index + m[0].length; }
    if (i < v.length) f.appendChild(document.createTextNode(v.slice(i)));
    t.parentNode.replaceChild(f, t);
  }
  function walk(root) {
    if (!root) return; if (root.nodeType === 3) return text(root); if (root.nodeType !== 1 || SKIP.test(root.nodeName)) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), L = []; let n; while ((n = w.nextNode())) if (n.nodeValue && n.nodeValue.length && /[←-⯿\uD83C-\uD83E]/.test(n.nodeValue)) L.push(n);
    L.forEach(text);
  }
  function start() {
    walk(document.body);
    try { new MutationObserver(R => { for (const r of R) { if (r.type === "characterData") text(r.target); else r.addedNodes.forEach(walk); } }).observe(document.body, { childList: true, subtree: true, characterData: true }); } catch (e) {}
  }
  window.sokhoIcons = { walk };
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();
