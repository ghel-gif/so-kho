/* Sổ Kho — BIỂU ĐỒ TRONG BÁO CÁO ĐÓNG GÓI / PHỐI TRỘN. SVG thuần, không thư viện ngoài.
   1) % hao hụt từng lệnh theo ngày (có vạch ngưỡng nếu có)  2) % hao hụt theo người  3) sản lượng theo ngày.
   Màu: --bd-s1 / --bd-s2 = nhận diện nhóm · --bd-good / --bd-crit = trạng thái (luôn kèm hình dạng + chữ). */
"use strict";
(function () {
  const E = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const N = (v, d) => (Math.round((+v || 0) * Math.pow(10, d == null ? 2 : d)) / Math.pow(10, d == null ? 2 : d)).toLocaleString("vi-VN");
  const P = v => { const x = Math.round((+v || 0) * 100) / 100; return (x > 0 ? "+" : "") + (x === 0 ? 0 : x).toLocaleString("vi-VN") + "%"; };
  const dm = d => String(d || "").slice(8, 10) + "/" + String(d || "").slice(5, 7);
  const step = span => [0.5, 1, 2, 5, 10, 20, 50].find(s => span / s <= 6) || 100;
  const kstep = mx => { if (!(mx > 0)) return 1; const p = Math.pow(10, Math.floor(Math.log10(mx))), f = mx / p; return (f <= 1 ? 0.2 : f <= 2 ? 0.5 : f <= 5 ? 1 : 2) * p; };
  const tip = L => E(L.filter(Boolean).join("|"));
  const INK = 'fill="currentColor"', GRID = 'stroke="currentColor" stroke-opacity=".12"';
  const head = (t, s) => `<h4 class="dgbc-h">${t}${s ? ` <small>${s}</small>` : ""}</h4>`;
  const none = t => `<p class="note bd-none">${t}</p>`;
  const legend = L => `<div class="bd-lg">${L.map(([c, t, sh]) => `<span><i class="${sh || ""}" style="--c:${c}"></i>${t}</span>`).join("")}</div>`;

  /* ---------- 1) % hao hụt từng lệnh ---------- */
  function lenh(pts, o) {
    if (!pts.length) return none(o.empty || "Chưa có lệnh nào đủ số liệu để tính hao hụt trong khoảng ngày này.");
    const ngs = o.ng ? [...new Set(pts.map(p => p.ng))].sort((a, b) => a - b) : [], ngMax = ngs.length ? ngs[ngs.length - 1] : 0;
    const ab = pts.map(p => Math.abs(p.p)).sort((a, b) => a - b), q75 = ab[Math.floor((ab.length - 1) * 0.75)] || 0;
    const cap = Math.max(o.ng ? ngMax * 3 : 6, q75 * 4), cl = v => Math.max(-cap, Math.min(cap, v));
    let hi = Math.max(ngMax, ...pts.map(p => cl(p.p)), 0.5), lo = Math.min(-ngMax, ...pts.map(p => cl(p.p)), 0);
    const st = step(hi - lo); hi = Math.ceil(hi * 1.12 / st) * st; lo = lo < 0 ? Math.floor(lo * 1.12 / st) * st : 0;
    const n = pts.length, L = 46, R = 74, T = 16, B = 30, bw = Math.max(15, Math.min(48, 800 / n)), W = Math.max(920, L + R + n * bw), H = 270, ih = H - T - B;
    const y = v => T + ih - (v - lo) / (hi - lo) * ih, x = i => L + bw * i + bw / 2;
    let g = "";
    for (let v = lo; v <= hi + 1e-9; v += st) { const yy = y(v); g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" ${GRID}/><text x="${L - 6}" y="${yy + 4}" text-anchor="end" font-size="11" ${INK} fill-opacity=".7">${N(v, 1)}%</text>`; }
    g += `<line x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}" stroke="currentColor" stroke-opacity=".45"/>`;
    ngs.forEach(ng => [ng, -ng].forEach(v => { if (v < lo || v > hi) return; const yy = y(v), nm = o.ngTen ? o.ngTen(ng) : "";
      g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" stroke="var(--bd-crit)" stroke-width="1.2" stroke-dasharray="5 4" stroke-opacity=".85"/><text x="${W - R + 5}" y="${yy + 4}" font-size="10.5" ${INK} fill-opacity=".8">${v > 0 ? "+" : "−"}${N(ng, 1)}%${nm ? " " + E(nm) : ""}</text>`; }));
    let last = "", lastX = -99;
    pts.forEach((p, i) => { const X = x(i), v = cl(p.p), Y = y(v), pin = v !== p.p, c = o.ng ? (p.vuot ? "var(--bd-crit)" : "var(--bd-good)") : "var(--bd-s1)";
      if (p.d !== last) { last = p.d; if (X - lastX > 34) { g += `<text x="${X}" y="${H - 10}" text-anchor="middle" font-size="11" ${INK} fill-opacity=".75">${dm(p.d)}</text>`; lastX = X; } g += `<line x1="${X - bw / 2}" x2="${X - bw / 2}" y1="${H - B}" y2="${H - B + 5}" stroke="currentColor" stroke-opacity=".3"/>`; }
      g += `<line x1="${X}" x2="${X}" y1="${y(0)}" y2="${Y}" stroke="${c}" stroke-width="2" stroke-opacity=".55"/>`;
      g += p.vuot && o.ng ? `<path d="M${X} ${Y - 6.5}L${X + 6} ${Y + 4.5}L${X - 6} ${Y + 4.5}Z" fill="${c}" stroke="var(--surface,#fff)" stroke-width="1.5"/>` : `<circle cx="${X}" cy="${Y}" r="4.5" fill="${c}" stroke="var(--surface,#fff)" stroke-width="1.5"/>`;
      if (pin) g += `<text x="${X}" y="${v > 0 ? Y - 10 : Y + 17}" text-anchor="middle" font-size="10.5" font-weight="700" ${INK}>${P(p.p)}</text>`;
      g += `<rect class="bd-hit" x="${X - bw / 2}" y="${T}" width="${bw}" height="${ih}" fill="transparent" data-so="${E(p.so)}" data-tip="${tip(p.tip)}"/>`; });
    return `<div class="bd-sc"><svg viewBox="0 0 ${W} ${H}" style="min-width:${W > 920 ? W : 0}px" role="img" aria-label="${E(o.aria || "Phần trăm hao hụt từng lệnh")}">${g}</svg></div>`;
  }

  /* ---------- 2) % hao hụt theo người: mỗi người 1–2 thanh ---------- */
  function nguoi(rows, o) {
    rows = rows.filter(r => r.bars.some(b => b.p != null)); if (!rows.length) return none("Chưa có số hao hụt theo người trong khoảng ngày này.");
    const all = rows.flatMap(r => r.bars.filter(b => b.p != null)), ngMax = Math.max(0, ...all.map(b => b.ng || 0));
    let hi = Math.max(ngMax, ...all.map(b => b.p), 0.5), lo = Math.min(-ngMax, ...all.map(b => b.p), 0);
    const st = step(hi - lo); hi = Math.ceil(hi * 1.15 / st) * st; lo = lo < 0 ? Math.floor(lo * 1.15 / st) * st : 0;
    const L = 190, R = 70, T = 20, bh = 16, gap = 3, rg = 14, W = 920, iw = W - L - R, x = v => L + (v - lo) / (hi - lo) * iw;
    let g = "", yy = T; const rowsY = [];
    rows.forEach(r => { const B = r.bars.filter(b => b.p != null), h = B.length * bh + (B.length - 1) * gap; rowsY.push([yy, h]); yy += h + rg; });
    const H = yy - rg + 30;
    for (let v = lo; v <= hi + 1e-9; v += st) { const X = x(v); g += `<line x1="${X}" x2="${X}" y1="${T - 6}" y2="${H - 26}" ${GRID}/><text x="${X}" y="${H - 10}" text-anchor="middle" font-size="11" ${INK} fill-opacity=".7">${N(v, 1)}%</text>`; }
    g += `<line x1="${x(0)}" x2="${x(0)}" y1="${T - 6}" y2="${H - 26}" stroke="currentColor" stroke-opacity=".45"/>`;
    rows.forEach((r, i) => { const [y0, h] = rowsY[i], B = r.bars.filter(b => b.p != null);
      g += `<text x="${L - 10}" y="${y0 + h / 2 + 4}" text-anchor="end" font-size="12.5" font-weight="600" ${INK}>${E(r.ten.length > 24 ? r.ten.slice(0, 23) + "…" : r.ten)}</text>`;
      B.forEach((b, k) => { const Y = y0 + k * (bh + gap), x0 = x(0), x1 = x(b.p), w = Math.max(2, Math.abs(x1 - x0)), xs = Math.min(x0, x1), vuot = b.ng && Math.abs(b.p) > b.ng;
        g += `<rect x="${xs}" y="${Y}" width="${w}" height="${bh}" rx="3" fill="${b.c}"/>`;
        if (b.ng) [b.p >= 0 ? b.ng : -b.ng].forEach(v => { if (v >= lo && v <= hi) g += `<line x1="${x(v)}" x2="${x(v)}" y1="${Y - 2}" y2="${Y + bh + 2}" stroke="var(--bd-crit)" stroke-width="1.6" stroke-dasharray="3 2"/>`; });
        g += `<text x="${b.p >= 0 ? x1 + 6 : x1 - 6}" y="${Y + bh / 2 + 4}" text-anchor="${b.p >= 0 ? "start" : "end"}" font-size="11.5" font-weight="${vuot ? 700 : 500}" ${INK}>${vuot ? "⚠ " : ""}${P(b.p)}</text>`;
        g += `<rect class="bd-hit" x="${L}" y="${Y - 1}" width="${iw}" height="${bh + 2}" fill="transparent" data-tip="${tip(b.tip)}"/>`; }); });
    return `<div class="bd-sc"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Phần trăm hao hụt theo người">${g}</svg></div>`;
  }

  /* ---------- 3) sản lượng theo ngày (cột chồng, tối đa 2 nhóm) ---------- */
  function ngay(a, b, items, S2, dv) {
    items = items.filter(t => t.v > 0 && t.d); if (!items.length) return none("Chưa có sản lượng trong khoảng ngày này.");
    const ds = items.map(t => t.d).sort(), d0 = a > ds[0] ? ds[0] : a, d1 = b < ds[ds.length - 1] ? ds[ds.length - 1] : b;
    const days = []; for (let t = new Date(d0 + "T00:00:00Z"); days.length < 400; t = new Date(t.getTime() + 864e5)) { const s = t.toISOString().slice(0, 10); if (s > d1) break; days.push(s); }
    const tuan = days.length > 45, key = d => { if (!tuan) return d; const t = new Date(d + "T00:00:00Z"); t.setUTCDate(t.getUTCDate() - (t.getUTCDay() + 6) % 7); return t.toISOString().slice(0, 10); };
    const K = [...new Set(days.map(key))], M = {}; K.forEach(k => M[k] = { v: S2.map(() => 0), n: 0 });
    items.forEach(t => { const m = M[key(t.d)]; if (m) { m.v[t.s] += t.v; m.n++; } });
    const mx = Math.max(...K.map(k => M[k].v.reduce((s, v) => s + v, 0))), st = kstep(mx), top = Math.ceil(mx * 1.05 / st) * st;
    const n = K.length, L = 56, R = 14, T = 14, B = 30, W = 920, H = 240, ih = H - T - B, cw = (W - L - R) / n, bw = Math.min(24, Math.max(4, cw - 4)), y = v => T + ih - v / top * ih;
    let g = "";
    for (let v = 0; v <= top + 1e-9; v += st) { const yy = y(v); g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" ${GRID}/><text x="${L - 6}" y="${yy + 4}" text-anchor="end" font-size="11" ${INK} fill-opacity=".7">${N(v, 0)}</text>`; }
    const every = Math.ceil(n / 16);
    K.forEach((k, i) => { const X = L + cw * i + cw / 2, m = M[k]; let acc = 0;
      if (i % every === 0) g += `<text x="${X}" y="${H - 10}" text-anchor="middle" font-size="11" ${INK} fill-opacity=".75">${dm(k)}</text>`;
      const tot = m.v.reduce((s, v) => s + v, 0);
      m.v.forEach((v, si) => { if (!(v > 0)) return; const y1 = y(acc + v), y0 = y(acc), h = Math.max(1.5, y0 - y1 - (acc > 0 ? 2 : 0)), topSeg = acc + v >= tot - 1e-9, r = topSeg ? Math.min(4, bw / 2, h) : 0;
        g += r ? `<path d="M${X - bw / 2} ${y1 + h}V${y1 + r}Q${X - bw / 2} ${y1} ${X - bw / 2 + r} ${y1}H${X + bw / 2 - r}Q${X + bw / 2} ${y1} ${X + bw / 2} ${y1 + r}V${y1 + h}Z" fill="${S2[si][0]}"/>` : `<rect x="${X - bw / 2}" y="${y1}" width="${bw}" height="${h}" fill="${S2[si][0]}"/>`; acc += v; });
      if (tot > 0) g += `<rect class="bd-hit" x="${L + cw * i}" y="${T}" width="${cw}" height="${ih}" fill="transparent" data-tip="${tip([(tuan ? "Tuần từ " : "Ngày ") + dm(k) + "/" + k.slice(0, 4), ...S2.map((s, si) => m.v[si] > 0 ? s[1] + ": " + N(m.v[si], 1) + " " + dv : ""), S2.length > 1 ? "Tổng: " + N(tot, 1) + " " + dv : "", m.n + " lệnh"])}"/>`; });
    return (S2.length > 1 ? legend(S2) : "") + `<div class="bd-sc"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Sản lượng theo ${tuan ? "tuần" : "ngày"}">${g}</svg></div>` + (tuan ? `<p class="note" style="margin:0">Khoảng lọc dài hơn 45 ngày nên gộp theo tuần (nhãn là ngày thứ Hai đầu tuần).</p>` : "");
  }

  /* ---------- chú giải nổi + bấm mở lệnh ---------- */
  let TIP = null;
  function wire(box, open) {
    if (!box || box._bd) return; box._bd = 1;
    const hide = () => { if (TIP) TIP.style.display = "none"; };
    box.addEventListener("mousemove", e => { const h = e.target.closest && e.target.closest("[data-tip]"); if (!h) return hide();
      if (!TIP) { TIP = document.createElement("div"); TIP.className = "bd-tip"; document.body.appendChild(TIP); }
      const L = h.getAttribute("data-tip").split("|"); TIP.innerHTML = `<b>${E(L[0])}</b>` + L.slice(1).map(t => `<span>${E(t)}</span>`).join("");
      TIP.style.display = "block"; const w = TIP.offsetWidth, hh = TIP.offsetHeight; let X = e.clientX + 14, Y = e.clientY + 14;
      if (X + w > innerWidth - 8) X = e.clientX - w - 14; if (Y + hh > innerHeight - 8) Y = e.clientY - hh - 14; TIP.style.left = Math.max(6, X) + "px"; TIP.style.top = Math.max(6, Y) + "px"; });
    box.addEventListener("mouseleave", hide); window.addEventListener("scroll", hide, true);
    box.addEventListener("click", e => { const h = e.target.closest && e.target.closest("[data-so]"); if (h && open) { hide(); open(h.getAttribute("data-so")); } });
  }
  const C1 = "var(--bd-s1)", C2 = "var(--bd-s2)";

  /* ---------- ĐÓNG GÓI ---------- */
  function dg(box, B, o) {
    if (!box) return; const R = B.R || [], has = r => r.pct != null;
    const pts = R.filter(has).map(r => ({ so: r.so, d: String(r.bd || "").slice(0, 10), p: r.pct * 100, ng: r.hhNg, vuot: Math.abs(r.pct) * 100 > r.hhNg + 1e-6, lg: r.lg,
      tip: [r.so + (r.ma ? " · " + r.ma : ""), r.sp, "Bắt đầu: " + dm(r.bd), "Hao hụt: " + P(r.pct * 100) + " (" + N(r.lg ? r.hhL : r.hhKg, 3) + (r.lg ? " L" : " kg") + ")", "Ngưỡng " + (r.lg ? "lỏng" : "rắn") + ": ±" + N(r.hhNg, 1) + "%" + (Math.abs(r.pct) * 100 > r.hhNg + 1e-6 ? " — VƯỢT" : " — trong ngưỡng"), r.nvh ? "Vận hành: " + r.nvh : "", r.lyDo ? "Lý do: " + r.lyDo : "", "Bấm để mở lệnh"] }));
    const nV = pts.filter(p => p.vuot).length;
    const rows = (B.nv || []).map(x => ({ ten: x.ten, bars: [{ p: x.dk ? (x.tk - x.dk) / x.dk * 100 : null, ng: o.ngR, c: C1, tip: [x.ten + " · dạng rắn", "Hao hụt: " + (x.dk ? P((x.tk - x.dk) / x.dk * 100) : ""), "Định mức " + N(x.dk, 3) + " kg · thực tế " + N(x.tk, 3) + " kg", "Ngưỡng ±" + N(o.ngR, 1) + "%"] },
      { p: x.dl ? (x.tl - x.dl) / x.dl * 100 : null, ng: o.ngL, c: C2, tip: [x.ten + " · dạng lỏng", "Hao hụt: " + (x.dl ? P((x.tl - x.dl) / x.dl * 100) : ""), "Định mức " + N(x.dl, 3) + " L · thực tế " + N(x.tl, 3) + " L", "Ngưỡng ±" + N(o.ngL, 1) + "%"] }] }));
    const items = R.filter(r => r.kTx > 0).map(r => ({ d: String(r.bd || "").slice(0, 10), v: +r.kTx, s: r.lg ? 1 : 0 }));
    box.className = "bcbd"; box.innerHTML =
      head("Biểu đồ: % hao hụt từng lệnh", `mỗi điểm là 1 lệnh, xếp theo ngày bắt đầu đóng gói · ${pts.length} lệnh có số hao hụt${nV ? `, <b>${nV} lệnh vượt ngưỡng</b>` : ", không lệnh nào vượt ngưỡng"} · rê chuột để xem, bấm để mở lệnh`) +
      (pts.length ? legend([["var(--bd-good)", "Trong ngưỡng", "dot"], ["var(--bd-crit)", "Vượt ngưỡng", "tri"], ["var(--bd-crit)", "Vạch ngưỡng cho phép", "dash"]]) : "") +
      lenh(pts, { ng: true, ngTen: ng => ng === o.ngR && ng !== o.ngL ? "rắn" : ng === o.ngL && ng !== o.ngR ? "lỏng" : "", aria: "Phần trăm hao hụt từng lệnh đóng gói" }) +
      head("Biểu đồ: % hao hụt theo người vận hành chính", `cộng dồn các lệnh đã ghi tồn cuối · vạch đứt đỏ cạnh mỗi thanh = ngưỡng cho phép (rắn ±${N(o.ngR, 1)}%, lỏng ±${N(o.ngL, 1)}%)`) +
      (rows.some(r => r.bars.some(b => b.p != null)) ? legend([[C1, "Dạng rắn (kg)"], [C2, "Dạng lỏng (L)"]]) : "") + nguoi(rows, {}) +
      head("Biểu đồ: BTP đã đóng theo ngày (kg)", "theo ngày bắt đầu đóng gói · chỉ tính lệnh đã ghi BTP thực xuất · dạng lỏng cũng tính bằng kg") +
      ngay(B.a, B.b, items, [[C1, "Dạng rắn"], [C2, "Dạng lỏng"]], "kg");
    wire(box, o.open);
  }

  /* ---------- PHỐI TRỘN ---------- */
  function pt(box, B, o) {
    if (!box) return; const R = B.R || [];
    const pts = R.filter(r => r.pct != null).map(r => ({ so: r.so, d: r.ngay.slice(0, 10), p: r.pct * 100,
      tip: [r.so, r.sp, "Ngày ra lệnh: " + dm(r.ngay), "Hao hụt: " + P(r.pct * 100) + " (" + N(r.hh, 3) + " kg)", "Nguyên liệu xuất " + N(r.nl, 3) + " kg · nhập kho " + N(r.tt, 3) + " kg", r.nsxN ? "Người sản xuất: " + r.nsxN : "", "Bấm để mở lệnh"] }));
    const nv = {}; R.filter(r => r.st === "Hoàn thành" && r.nl != null).forEach(r => (r.nsxN ? r.nsxN.split(/\s*[,;]\s*/).filter(Boolean) : ["(chưa ghi)"]).forEach(n => { const x = nv[n] = nv[n] || { ten: n, nl: 0, tt: 0, so: 0 }; x.nl += r.nl; x.tt += r.tt || 0; x.so++; }));
    const rows = Object.values(nv).sort((a, b) => b.so - a.so).map(x => ({ ten: x.ten, bars: [{ p: x.nl ? (x.nl - x.tt) / x.nl * 100 : null, c: C1, tip: [x.ten, "Hao hụt: " + (x.nl ? P((x.nl - x.tt) / x.nl * 100) : ""), "Nguyên liệu xuất " + N(x.nl, 3) + " kg · nhập kho " + N(x.tt, 3) + " kg", x.so + " lệnh hoàn thành có số nguyên liệu"] }] }));
    const items = R.filter(r => r.st === "Hoàn thành" && r.tt > 0).map(r => ({ d: r.ngay.slice(0, 10), v: +r.tt, s: r.gc ? 1 : 0 }));
    box.className = "bcbd"; box.innerHTML =
      head("Biểu đồ: % hao hụt từng lệnh", `mỗi điểm là 1 lệnh đã hoàn thành, xếp theo ngày ra lệnh · ${pts.length} lệnh có số · trên vạch 0 = hao hụt, dưới vạch 0 = nhập kho nhiều hơn nguyên liệu xuất · rê chuột để xem, bấm để mở lệnh`) +
      lenh(pts, { ng: false, aria: "Phần trăm hao hụt từng lệnh phối trộn", empty: "Chưa có lệnh hoàn thành nào có số nguyên liệu thực xuất trong khoảng ngày này." }) +
      head("Biểu đồ: % hao hụt theo người sản xuất", "cộng dồn các lệnh đã hoàn thành · lệnh có nhiều người thì tính cho từng người") + nguoi(rows, {}) +
      head("Biểu đồ: sản lượng nhập kho theo ngày (kg)", "theo ngày ra lệnh · chỉ tính lệnh đã hoàn thành") +
      ngay(B.a, B.b, items, [[C1, "Hàng công ty"], [C2, "Hàng gia công"]], "kg");
    wire(box, o.open);
  }
  window.bcBD = { dg, pt };
})();
