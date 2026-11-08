/* Sổ Kho — BIỂU ĐỒ THEO DÕI (Báo cáo → Biểu đồ). Vẽ SVG thuần, không cần thư viện ngoài. */
"use strict";
(function () {
  const E = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const NF = v => (Math.round((+v || 0) * 10) / 10).toLocaleString("vi-VN");
  const COL = ["#0f766e", "#2563eb", "#d97706", "#7c3aed", "#c62828", "#0891b2", "#65a30d", "#db2777"];
  const mLb = m => m.slice(5) + "/" + m.slice(2, 4);
  const nice = v => { if (!(v > 0)) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; };

  /* biểu đồ cột (stack tuỳ chọn) / đường — series: [{name, data:[], color}] */
  function chart(labels, series, o = {}) {
    const W = 900, H = o.h || 250, L = 56, R = 12, T = 14, B = 34, iw = W - L - R, ih = H - T - B, n = labels.length;
    const stack = !!o.stack, line = o.type === "line";
    const vals = stack ? labels.map((_, i) => series.reduce((s, x) => s + (+x.data[i] || 0), 0)) : series.flatMap(x => x.data.map(v => +v || 0));
    const lo0 = Math.min(0, ...vals.filter(v => isFinite(v))), mn = lo0 < 0 ? -nice(-lo0 * 1.08) : 0, mx = Math.max(nice(Math.max(o.min || 0, ...vals) * 1.08), mn < 0 ? 0.0001 : 0), y = v => T + ih - ((v - mn) / (mx - mn)) * ih, bw = iw / n;
    let g = "";
    for (let k = 0; k <= 4; k++) { const v = mn + (mx - mn) * k / 4, yy = y(v); g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" stroke="currentColor" stroke-opacity=".12"/><text x="${L - 6}" y="${yy + 4}" text-anchor="end" font-size="11" fill="currentColor" fill-opacity=".7">${NF(v)}${o.unit === "%" ? "%" : ""}</text>`; }
    labels.forEach((lb, i) => { if (n > 14 && i % 2) return; g += `<text x="${L + bw * i + bw / 2}" y="${H - 12}" text-anchor="middle" font-size="11" fill="currentColor" fill-opacity=".75">${E(lb)}</text>`; });
    if (line) series.forEach((s, si) => {
      const c = s.color || COL[si % COL.length], P = s.data.map((v, i) => v == null || v === "" ? null : [L + bw * i + bw / 2, y(+v)]);
      let d = "", on = false; P.forEach(p => { if (!p) { on = false; return; } d += (on ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); on = true; });
      g += `<path d="${d}" fill="none" stroke="${c}" stroke-width="2.4" stroke-linejoin="round"/>` + P.map((p, i) => p ? `<circle cx="${p[0]}" cy="${p[1]}" r="3.4" fill="${c}"><title>${E(s.name)} · ${E(labels[i])}: ${NF(s.data[i])}${o.unit === "%" ? "%" : " " + (o.unit || "")}</title></circle>` : "").join("");
    });
    else labels.forEach((lb, i) => {
      if (stack) { let acc = 0; series.forEach((s, si) => { const v = +s.data[i] || 0; if (!v) return; const y1 = y(acc + v), h = y(acc) - y1; acc += v; g += `<rect x="${L + bw * i + bw * .18}" y="${y1}" width="${bw * .64}" height="${Math.max(0, h)}" rx="2" fill="${s.color || COL[si]}"><title>${E(s.name)} · ${E(lb)}: ${NF(v)} ${o.unit || ""}</title></rect>`; }); }
      else { const m = series.length, w = bw * .72 / m; series.forEach((s, si) => { const v = +s.data[i] || 0, y1 = y(v); const y0 = y(0); g += `<rect x="${L + bw * i + bw * .14 + w * si}" y="${Math.min(y1, y0)}" width="${Math.max(1, w - 1)}" height="${Math.abs(y0 - y1)}" rx="2" fill="${s.color || COL[si]}"><title>${E(s.name)} · ${E(lb)}: ${NF(v)} ${o.unit || ""}</title></rect>`; }); }
    });
    const leg = series.length > 1 || o.legend ? `<div style="display:flex;flex-wrap:wrap;gap:6px 14px;margin:2px 0 0 ${L}px;font-size:12.5px">${series.map((s, si) => `<span style="display:inline-flex;align-items:center;gap:5px"><i style="width:11px;height:11px;border-radius:3px;background:${s.color || COL[si % COL.length]};display:inline-block"></i>${E(s.name)}</span>`).join("")}</div>` : "";
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;color:var(--ink,#1d2a22)" role="img">${g}</svg>${leg}`;
  }
  const card = (t, sub, body) => `<div style="border:1px solid var(--line,#e3e8ee);border-radius:14px;padding:12px 14px;margin:12px 0;background:var(--surface,#fff)"><h3 style="margin:0 0 2px;font-size:16px">${t}</h3>${sub ? `<p class="note" style="margin:0 0 8px">${sub}</p>` : ""}${body}</div>`;

  window.bieuDo = async function () {
    const out = document.getElementById("bdOut"); if (!out) return;
    const sel = document.getElementById("bdN"); sel.onchange = () => window.bieuDo();
    out.innerHTML = `<p class="note">Đang tải số liệu…</p>`;
    let R; try { R = await api("webBieuDo", S.auth, +sel.value || 12); } catch (e) { out.innerHTML = `<p class="note" style="color:#c62828">${E(e.message)}</p>`; return; }
    try { if (!S.dg && typeof dgLoad === "function") await dgLoad(); } catch (e) {}
    const M = R.M, LB = M.map(mLb);
    /* hao hụt đóng gói: từ bảng theo dõi đóng gói */
    let hh = "", nv = "";
    try {
      const rows = (typeof dgRows === "function" ? dgRows() : []).filter(r => r.pct != null && M.includes(String(r.bd).slice(0, 7)));
      const avg = M.map(m => { const L = rows.filter(r => String(r.bd).slice(0, 7) === m); return L.length ? L.reduce((s, r) => s + r.pct, 0) / L.length * 100 : null; });
      hh = chart(LB, [{ name: "Hao hụt TB", data: avg, color: "#c62828" }], { type: "line", unit: "%", min: 1 });
      const by = {}; rows.forEach(r => { const k = r.nvh || "(chưa ghi)"; (by[k] = by[k] || []).push(r.pct * 100); });
      const K = Object.keys(by).sort((a, b) => by[b].length - by[a].length).slice(0, 10);
      nv = K.length ? `<div class="dgx" style="margin-top:8px"><table><thead><tr><th>Người vận hành</th><th>Số lệnh</th><th>Hao hụt TB</th><th style="width:45%"></th></tr></thead><tbody>${K.map(k => { const a = by[k].reduce((s, v) => s + v, 0) / by[k].length; return `<tr><td>${E(k)}</td><td style="text-align:center">${by[k].length}</td><td style="text-align:right"><b style="color:${a > 1 ? "#c62828" : a < -0.5 ? "#b26a00" : "#2e7d32"}">${NF(a)}%</b></td><td><div style="height:10px;border-radius:5px;background:${a > 1 ? "#c62828" : "#0f766e"};width:${Math.min(100, Math.abs(a) * 20)}%"></div></td></tr>`; }).join("")}</tbody></table></div>` : "";
      if (!rows.length) hh = `<p class="note">Chưa có lệnh đóng gói nào có số hao hụt trong khoảng này.</p>`;
    } catch (e) { hh = `<p class="note">Không tính được hao hụt.</p>`; }
    /* cân bao bì theo mã */
    const cb = ((S.dg && S.dg.cbb) || []).filter(x => !x.xoa), cnt = {}; cb.forEach(x => cnt[x.qc] = (cnt[x.qc] || 0) + 1);
    const codes = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]);
    out.innerHTML =
      card("Sản lượng theo tháng", "BTP nhập từ lệnh SX và thành phẩm nhập từ lệnh đóng gói (kg).", chart(LB, [{ name: "BTP (kg)", data: R.sl.btp, color: "#7c3aed" }, { name: "Thành phẩm (kg)", data: R.sl.tp, color: "#0f766e" }], { unit: "kg" })) +
      card("Hao hụt đóng gói", "Trung bình (BTP thực tế − định mức) / định mức của các lệnh trong tháng. Dương = hao, âm = dư.", hh + nv) +
      card("Kết quả QC lô theo tháng", "Kết luận cuối cùng của từng lô (Đạt / Không đạt), theo tháng kết luận.", chart(LB, [{ name: "Đạt", data: R.qc.dat, color: "#2e7d32" }, { name: "Không đạt", data: R.qc.kd, color: "#c62828" }], { stack: true, unit: "lô" })) +
      card("Nguyên liệu, phụ gia xuất cho sản xuất", "Tổng kg xuất cho lệnh SX mỗi tháng, theo nhóm.", chart(LB, Object.keys(R.nl).map((k, i) => ({ name: k, data: R.nl[k], color: COL[i] })), { stack: true, unit: "kg" })) +
      (R.top.length ? card("8 nguyên liệu dùng nhiều nhất", "kg xuất cho sản xuất mỗi tháng.", chart(LB, R.top.map((t, i) => ({ name: t.ma, data: t.s, color: COL[i % COL.length] })), { type: "line", unit: "kg" })) : "") +
      card("Cân bao bì theo mã hàng", "Các lần QC cân bao bì (gói/chai, hộp, thùng) — thấy ngay lô bao bì nhẹ / nặng bất thường.",
        codes.length ? `<div class="tools"><select id="bdCb" style="max-width:360px">${codes.map(c => `<option value="${E(c)}">${E(c)} · ${cnt[c]} lần cân</option>`).join("")}</select></div><div id="bdCbOut"></div>` : `<p class="note">Chưa có lần cân bao bì nào (cân và ghi ở phiếu BM.05).</p>`);
    const drawCb = () => {
      const c = document.getElementById("bdCb").value, L = cb.filter(x => x.qc === c).sort((a, b) => String(a.ngay).localeCompare(String(b.ngay)));
      const NM = { klBB: "Bao bì", klHop: "Hộp", klThung: "Thùng" }, keys = [...new Set(L.map(x => x.loai + "|" + (x.bb || "")))];
      const html = keys.map((k, i) => { const [lo, bb] = k.split("|"), P = L.filter(x => x.loai === lo && (x.bb || "") === bb), dv = (P[0] || {}).dv || "";
        return `<p style="margin:10px 0 2px"><b>${E(NM[lo] || lo)}${bb ? " · " + E(bb) : ""}</b> (${dv}) — ${P.length} lần, thấp ${NF(Math.min(...P.map(x => +x.v)))} · cao ${NF(Math.max(...P.map(x => +x.v)))}</p>` + chart(P.map(x => String(x.ngay).slice(8, 10) + "/" + String(x.ngay).slice(5, 7)), [{ name: NM[lo] || lo, data: P.map(x => +x.v), color: COL[i % COL.length] }], { type: "line", unit: dv, h: 200 }); }).join("");
      document.getElementById("bdCbOut").innerHTML = html;
    };
    const s2 = document.getElementById("bdCb"); if (s2) { s2.onchange = drawCb; drawCb(); }
  };
})();
