/* SỔ KHO — bản mới chạy trên Supabase (chạy song song với Sổ Kho cũ trên Google Sheet) */
"use strict";
const sb = supabase.createClient(SOKHO_CFG.url, SOKHO_CFG.key, { auth: { persistSession: true, autoRefreshToken: true } });
const S = { me: null, items: [], IM: {}, ton: {}, lots: {}, qc: {}, tab: "ton", nhom: "", q: "", form: { loai: "Nhập" } };
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nf = (v, d = 3) => (+v || 0).toLocaleString("vi-VN", { maximumFractionDigits: d });
const dmy = s => s ? String(s).slice(0, 10).split("-").reverse().join("/") : "";
const today = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const lk = (ma, lo) => ma + "|" + (lo || "");
function toast(m, ms = 2600) { const t = $("toast"); t.textContent = m; t.classList.add("on"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("on"), ms); }
function err(e) { const m = (e && (e.message || e.error_description)) || String(e); return m.replace(/^.*?ERROR:\s*/, ""); }

/* ---------------- ĐĂNG NHẬP ---------------- */
async function showLogin(msg) {
  let ds = [];
  const { data, error } = await sb.rpc("ds_dang_nhap");
  if (!error) ds = data || [];
  $("app").innerHTML = `<div class="login card">
    <h1>Sổ Kho</h1><p class="mu">Bản mới (Supabase) · chạy song song với Sổ Kho cũ</p>
    ${msg ? `<div class="msg err">${esc(msg)}</div>` : ""}
    ${error ? `<div class="msg err">Không tải được danh sách người dùng: ${esc(err(error))}</div>` : ""}
    <label>Tên<select id="lgTen">${ds.map(u => `<option value="${esc(u.email)}" data-kh="${u.da_kich_hoat ? 1 : 0}">${esc(u.ten)}</option>`).join("")}</select></label>
    <label style="margin-top:10px">Mật khẩu<input id="lgPw" type="password" autocomplete="current-password" minlength="6"></label>
    <div id="lgNew" class="hide"><label style="margin-top:10px">Nhập lại mật khẩu<input id="lgPw2" type="password" autocomplete="new-password"></label>
      <p class="mu">Lần đầu dùng bản mới: tự đặt mật khẩu (ít nhất 6 ký tự). Lần sau chỉ cần nhập mật khẩu này.</p></div>
    <div id="lgMsg"></div>
    <button class="btn pr" id="lgBtn" style="width:100%;margin-top:12px">Đăng nhập</button></div>`;
  const sync = () => { const o = $("lgTen").selectedOptions[0]; const moi = o && o.dataset.kh === "0"; $("lgNew").classList.toggle("hide", !moi); $("lgBtn").textContent = moi ? "Kích hoạt & đăng nhập" : "Đăng nhập"; };
  $("lgTen").onchange = sync; sync();
  try { const last = localStorage.getItem("sk_last"); if (last) { $("lgTen").value = last; sync(); } } catch (e) {}
  $("lgPw").onkeydown = e => { if (e.key === "Enter") $("lgBtn").click(); };
  $("lgBtn").onclick = async () => {
    const o = $("lgTen").selectedOptions[0]; if (!o) return;
    const email = o.value, pw = $("lgPw").value, moi = o.dataset.kh === "0";
    const show = m => $("lgMsg").innerHTML = `<div class="msg err">${esc(m)}</div>`;
    if (pw.length < 6) return show("Mật khẩu ít nhất 6 ký tự.");
    if (moi && pw !== $("lgPw2").value) return show("Hai lần nhập mật khẩu không giống nhau.");
    $("lgBtn").disabled = true;
    try {
      if (moi) {
        const { data, error } = await sb.auth.signUp({ email, password: pw });
        if (error) throw error;
        if (!data.session) throw new Error("Đã tạo tài khoản nhưng Supabase đang bật “Confirm email”. Quản lý cần tắt mục này (xem hướng dẫn).");
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password: pw });
        if (error) throw new Error(/Invalid login/i.test(error.message) ? "Sai mật khẩu." : error.message);
      }
      try { localStorage.setItem("sk_last", email); } catch (e) {}
      await start();
    } catch (e) { show(err(e)); $("lgBtn").disabled = false; }
  };
}

/* ---------------- TẢI DỮ LIỆU ---------------- */
async function all(q) { // PostgREST trả tối đa 1000 dòng/lần → lấy theo trang
  let out = [], from = 0;
  for (;;) { const { data, error } = await q().range(from, from + 999); if (error) throw error; out = out.concat(data); if (data.length < 1000) return out; from += 1000; }
}
async function loadAll() {
  const t0 = performance.now();
  const [items, ton, lots, qc, cd] = await Promise.all([
    all(() => sb.from("vat_tu").select("*").order("ma")),
    all(() => sb.from("ton_kho").select("ma,ton_kg")),
    all(() => sb.from("ton_lo").select("*").neq("ton_kg", 0)),
    all(() => sb.from("lo_qc").select("*")),
    sb.from("cai_dat").select("*")
  ]);
  S.items = items; S.IM = {}; items.forEach(i => S.IM[i.ma] = i);
  S.ton = {}; ton.forEach(r => S.ton[r.ma] = +r.ton_kg);
  S.lots = {}; lots.forEach(r => (S.lots[r.ma] = S.lots[r.ma] || []).push(r));
  S.qc = {}; qc.forEach(r => S.qc[lk(r.ma, r.lo)] = r);
  S.cd = {}; (cd.data || []).forEach(r => S.cd[r.khoa] = r.gia_tri);
  S.nhomQC = String(S.cd["Nhóm cần QC theo lô"] ?? "Nguyên liệu, Bán thành phẩm").split(",").map(s => s.trim()).filter(Boolean);
  S.loadMs = Math.round(performance.now() - t0);
}
async function reloadMa(ma) { // sau khi lưu: chỉ tải lại 1 mã
  const [t, l, q] = await Promise.all([
    sb.from("ton_kho").select("ma,ton_kg").eq("ma", ma),
    sb.from("ton_lo").select("*").eq("ma", ma).neq("ton_kg", 0),
    sb.from("lo_qc").select("*").eq("ma", ma)
  ]);
  if (t.data && t.data[0]) S.ton[ma] = +t.data[0].ton_kg;
  S.lots[ma] = l.data || [];
  Object.keys(S.qc).forEach(k => { if (k.startsWith(ma + "|")) delete S.qc[k]; });
  (q.data || []).forEach(r => S.qc[lk(r.ma, r.lo)] = r);
}
const canQC = it => it && it.theo_lo && S.nhomQC.includes(it.nhom);
function qcOf(ma, lo) { const it = S.IM[ma]; if (!canQC(it)) return ""; const q = S.qc[lk(ma, lo)]; return q ? q.trang_thai : "Đạt"; }
function qcTag(t) { return !t ? "" : `<span class="tag ${t === "Đạt" ? "t-ok" : t === "Không đạt" ? "t-err" : "t-wa"}">${esc(t)}</span>`; }
function hsdOf(ma, lo, l) { const q = S.qc[lk(ma, lo)]; return (q && q.hsd_moi) || l.hsd || ""; }

/* ---------------- KHUNG ---------------- */
async function start() {
  const { data: u } = await sb.auth.getUser();
  if (!u || !u.user) return showLogin();
  const { data: me, error } = await sb.rpc("toi");
  if (error || !me || !me.ten) { await sb.auth.signOut(); return showLogin(error ? err(error) : "Tài khoản chưa liên kết với người dùng Sổ Kho."); }
  S.me = me;
  $("app").innerHTML = `<header><h1>Sổ Kho <span class="mu">· bản mới</span></h1>
      <div class="who">${esc(me.ten)} · ${esc(me.vai_tro)}<br><a href="#" id="logout">Đăng xuất</a></div></header>
    <nav id="nav">${[["ton", "Tồn kho"], ["phieu", "Lập phiếu"], ["ls", "Lịch sử"], ["qc", "QC lô"]].map(([k, t]) => `<button data-t="${k}">${t}</button>`).join("")}</nav>
    <main id="main"><div class="card">Đang tải dữ liệu…</div></main>`;
  $("logout").onclick = async e => { e.preventDefault(); await sb.auth.signOut(); showLogin(); };
  $("nav").onclick = e => { const b = e.target.closest("button"); if (b) setTab(b.dataset.t); };
  try { await loadAll(); } catch (e) { $("main").innerHTML = `<div class="msg err">${esc(err(e))}</div>`; return; }
  setTab(S.tab);
}
function setTab(t) {
  S.tab = t; document.querySelectorAll("#nav button").forEach(b => b.classList.toggle("on", b.dataset.t === t));
  ({ ton: renderTon, phieu: renderPhieu, ls: renderLS, qc: renderQC })[t]();
}

/* ---------------- TỒN KHO ---------------- */
function renderTon() {
  const nhoms = [...new Set(S.items.map(i => i.nhom))];
  $("main").innerHTML = `<div class="card">
    <div class="row"><label style="flex:3 1 260px">Tìm mã / tên<input id="tq" value="${esc(S.q)}" placeholder="VD: azoxy, TE.ABA95…"></label>
      <div class="mu" style="flex:1 1 160px;text-align:right">Tải dữ liệu: ${S.loadMs} ms</div></div>
    <div class="chips" id="tn"><button class="chip ${S.nhom ? "" : "on"}" data-n="">Tất cả</button>${nhoms.map(n => `<button class="chip ${S.nhom === n ? "on" : ""}" data-n="${esc(n)}">${esc(n)}</button>`).join("")}</div>
    <div class="tbl"><table><thead><tr><th>Mã</th><th>Tên</th><th class="hide-m">Nhóm</th><th class="n">Tồn (kg)</th><th class="n hide-m">Theo ĐV</th><th class="hide-m">Lô</th></tr></thead><tbody id="tb"></tbody></table></div></div>`;
  const draw = () => {
    const q = S.q.toLowerCase().trim();
    const rows = S.items.filter(i => (!S.nhom || i.nhom === S.nhom) && (!q || (i.ma + " " + i.ten).toLowerCase().includes(q)));
    $("tb").innerHTML = rows.slice(0, 600).map(i => {
      const t = S.ton[i.ma] || 0, ls = S.lots[i.ma] || [], cho = ls.filter(l => l.ton_kg > 0 && qcOf(i.ma, l.lo) && qcOf(i.ma, l.lo) !== "Đạt").length;
      return `<tr class="click" data-ma="${esc(i.ma)}"><td>${esc(i.ma)}</td><td>${esc(i.ten)}</td><td class="hide-m mu">${esc(i.nhom)}</td>
        <td class="n ${t < -1e-6 ? "neg" : ""}">${nf(t)}</td><td class="n hide-m mu">${i.he_so && i.he_so !== 1 ? nf(t / i.he_so) + " " + esc(i.don_vi) : ""}</td>
        <td class="hide-m">${i.theo_lo ? `<span class="mu">${ls.filter(l => l.ton_kg > 0).length} lô</span> ${cho ? `<span class="tag t-wa">${cho} chờ QC</span>` : ""}` : ""}</td></tr>`;
    }).join("") || `<tr><td colspan="6" class="mu">Không có mã phù hợp.</td></tr>`;
  };
  $("tq").oninput = e => { S.q = e.target.value; draw(); };
  $("tn").onclick = e => { const b = e.target.closest(".chip"); if (!b) return; S.nhom = b.dataset.n; renderTon(); };
  $("tb").onclick = e => { const r = e.target.closest("tr[data-ma]"); if (r) showItem(r.dataset.ma); };
  draw();
}
async function showItem(ma) {
  const it = S.IM[ma]; if (!it) return;
  const d = document.createElement("div"); d.className = "side";
  d.innerHTML = `<div><div class="row" style="justify-content:space-between;align-items:center"><h2 style="margin:0;font-size:18px">${esc(it.ma)}</h2><button class="btn sm" id="sx">Đóng</button></div>
    <p style="margin:4px 0 12px">${esc(it.ten)} <span class="mu">· ${esc(it.nhom)}${it.chu_hang ? " · " + esc(it.chu_hang) : ""}${it.kho ? " · " + esc(it.kho) : ""}</span></p>
    <div class="stat"><div><span class="mu">Tồn</span><b class="${(S.ton[ma] || 0) < 0 ? "neg" : ""}">${nf(S.ton[ma])} kg</b></div><div><span class="mu">Đầu kỳ</span><b>${nf(it.dau_ky)} kg</b></div></div>
    ${it.theo_lo ? `<h3 style="font-size:15px;margin:16px 0 6px">Tồn theo lô</h3><table><thead><tr><th>Lô</th><th class="n">Tồn (kg)</th><th>NSX</th><th>HSD</th><th>QC</th></tr></thead><tbody>
      ${(S.lots[ma] || []).sort((a, b) => (hsdOf(ma, a.lo, a) || "9").localeCompare(hsdOf(ma, b.lo, b) || "9")).map(l => `<tr><td>${esc(l.lo || "(không lô)")}</td><td class="n">${nf(l.ton_kg)}</td><td>${dmy(l.nsx)}</td><td>${dmy(hsdOf(ma, l.lo, l))}</td><td>${qcTag(qcOf(ma, l.lo))}</td></tr>`).join("") || `<tr><td colspan="5" class="mu">Không còn lô nào.</td></tr>`}</tbody></table>` : ""}
    <h3 style="font-size:15px;margin:16px 0 6px">Phiếu gần nhất</h3><div id="sxh" class="mu">Đang tải…</div>
    <div style="margin-top:14px"><button class="btn pr" id="sxp">Lập phiếu cho mã này</button></div></div>`;
  document.body.appendChild(d);
  const close = () => d.remove();
  d.onclick = e => { if (e.target === d) close(); };
  $("sx").onclick = close;
  $("sxp").onclick = () => { close(); S.form.ma = ma; setTab("phieu"); };
  const { data, error } = await sb.from("phieu").select("*").eq("ma", ma).order("ngay", { ascending: false }).order("created_at", { ascending: false }).limit(100);
  $("sxh").innerHTML = error ? esc(err(error)) : histTable(data, false);
}

/* ---------------- LẬP PHIẾU ---------------- */
function renderPhieu() {
  const F = S.form; F.ngay = F.ngay || today();
  $("main").innerHTML = `<div class="card">
    <div class="seg" id="fl">${["Nhập", "Xuất", "Kiểm kê"].map(l => `<button data-l="${l}" class="${F.loai === l ? "on" : ""}">${l}</button>`).join("")}</div>
    <div class="row" style="margin-top:14px">
      <label style="flex:3 1 280px">Mã vật tư<input id="fma" list="dlma" value="${esc(F.ma || "")}" placeholder="Gõ mã hoặc tên…" autocomplete="off"></label>
      <label style="flex:1 1 140px">Ngày<input id="fng" type="date" value="${esc(F.ngay)}"></label></div>
    <datalist id="dlma">${S.items.map(i => `<option value="${esc(i.ma)}">${esc(i.ten)}</option>`).join("")}</datalist>
    <div id="finfo" class="mu" style="margin:8px 0"></div>
    <div id="flot"></div>
    <div class="row" style="margin-top:10px">
      <label id="fslL">Số lượng<input id="fsl" type="number" step="any" min="0" inputmode="decimal"></label>
      <label>Chứng từ<input id="fct" placeholder="Số chứng từ / lệnh"></label></div>
    <label style="margin-top:10px">Ghi chú<input id="fgc"></label>
    <div id="fmsg"></div>
    <div style="margin-top:14px"><button class="btn pr" id="fsave">Lưu phiếu</button></div></div>`;
  $("fl").onclick = e => { const b = e.target.closest("button"); if (!b) return; F.loai = b.dataset.l; renderPhieu(); };
  $("fma").oninput = () => { F.ma = $("fma").value.trim(); drawLot(); };
  $("fng").onchange = () => F.ngay = $("fng").value;
  $("fsave").onclick = () => savePhieu(false);
  drawLot();
}
function drawLot() {
  const F = S.form, it = S.IM[F.ma];
  $("fslL").firstChild.textContent = F.loai === "Kiểm kê" ? "Tồn thực tế (kg)" : `Số lượng${it ? " (" + it.don_vi + ")" : ""}`;
  if (!it) { $("finfo").textContent = F.ma ? "Chưa có mã này trong danh mục." : ""; $("flot").innerHTML = ""; return; }
  $("finfo").innerHTML = `${esc(it.ten)} · ${esc(it.nhom)} · tồn <b>${nf(S.ton[it.ma])} kg</b>${it.theo_lo ? " · theo dõi lô" : ""}`;
  if (!it.theo_lo) { $("flot").innerHTML = ""; return; }
  if (F.loai === "Nhập") {
    $("flot").innerHTML = `<div class="row"><label>Số lô<input id="flo"></label><label>NSX<input id="fnsx" type="date"></label>
      <label>HSD <span class="mu">(trống = tự tính)</span><input id="fhsd" type="date"></label><label>Nhà cung cấp<input id="fncc"></label></div>`;
  } else {
    const ls = (S.lots[it.ma] || []).filter(l => F.loai === "Kiểm kê" || l.ton_kg > 0).sort((a, b) => (hsdOf(it.ma, a.lo, a) || "9").localeCompare(hsdOf(it.ma, b.lo, b) || "9"));
    $("flot").innerHTML = `<label>Lô<select id="flo">${ls.map(l => `<option value="${esc(l.lo)}">${esc(l.lo || "(không lô)")} · ${nf(l.ton_kg)} kg · HSD ${dmy(hsdOf(it.ma, l.lo, l)) || "–"}${qcOf(it.ma, l.lo) ? " · QC " + qcOf(it.ma, l.lo) : ""}</option>`).join("")}
      ${F.loai === "Kiểm kê" ? `<option value="">(không lô)</option>` : ""}</select></label>${F.loai === "Xuất" ? `<p class="mu">Lô xếp theo hạn dùng gần nhất trước (FEFO).</p>` : ""}`;
  }
}
async function savePhieu(xacNhan) {
  const F = S.form, it = S.IM[F.ma];
  const show = (m, c = "err") => $("fmsg").innerHTML = `<div class="msg ${c}">${m}</div>`;
  if (!it) return show("Chọn mã vật tư.");
  const p = { loai: F.loai, ngay: $("fng").value, ma: it.ma, so_luong: $("fsl").value, chung_tu: $("fct").value.trim(), ghi_chu: $("fgc").value.trim(),
    lo: $("flo") ? $("flo").value.trim() : "", nsx: $("fnsx")?.value || "", hsd: $("fhsd")?.value || "", ncc: $("fncc")?.value.trim() || "", xac_nhan: xacNhan };
  if (p.so_luong === "") return show("Nhập số lượng.");
  $("fsave").disabled = true; const t0 = performance.now();
  try {
    const { data, error } = await sb.rpc("luu_phieu", { p });
    if (error) throw error;
    if (data && data.can_xac_nhan) {
      $("fmsg").innerHTML = `<div class="msg wa"><b>Kiểm tra lại:</b><ul style="margin:6px 0">${data.can_xac_nhan.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
        <button class="btn sm" id="fok">Vẫn lưu</button> <button class="btn sm" id="fno">Quay lại sửa</button></div>`;
      $("fok").onclick = () => savePhieu(true); $("fno").onclick = () => $("fmsg").innerHTML = "";
      return;
    }
    await reloadMa(it.ma);
    const ms = Math.round(performance.now() - t0);
    toast(`Đã lưu phiếu ${F.loai.toLowerCase()} ${it.ma} · ${nf(data.kg)} kg · ${ms} ms`);
    $("fsl").value = ""; $("fct").value = ""; $("fgc").value = "";
    drawLot(); show(`Đã lưu (${ms} ms). Tồn ${esc(it.ma)} còn <b>${nf(S.ton[it.ma])} kg</b>.`, "ok");
  } catch (e) { show(esc(err(e))); } finally { $("fsave").disabled = false; }
}

/* ---------------- LỊCH SỬ ---------------- */
function histTable(rows, withMa) {
  const can = r => !r.trang_thai && !r.lenh && (["Quản lý", "Kế toán"].includes(S.me.vai_tro) || r.nguoi_lap === S.me.ten);
  return `<div class="tbl"><table><thead><tr><th>Ngày</th><th>Loại</th>${withMa ? "<th>Mã</th>" : ""}<th class="n">Kg</th><th>Lô</th><th class="hide-m">Chứng từ / ghi chú</th><th class="hide-m">Người lập</th><th></th></tr></thead><tbody>
    ${(rows || []).map(r => `<tr style="${r.trang_thai ? "opacity:.5;text-decoration:line-through" : ""}"><td>${dmy(r.ngay)}</td><td>${esc(r.loai)}</td>${withMa ? `<td>${esc(r.ma)}</td>` : ""}
      <td class="n">${r.loai === "Xuất" ? "−" : r.loai === "Kiểm kê" && r.kg > 0 ? "+" : ""}${nf(Math.abs(r.kg))}</td><td>${esc(r.lo)}</td>
      <td class="hide-m mu">${esc([r.chung_tu, r.ghi_chu].filter(Boolean).join(" · "))}${r.trang_thai ? `<br>${esc(r.trang_thai)}` : ""}</td><td class="hide-m mu">${esc(r.nguoi_lap)}</td>
      <td>${can(r) ? `<button class="btn sm" data-huy="${esc(r.id)}">Huỷ</button>` : ""}</td></tr>`).join("") || `<tr><td colspan="8" class="mu">Chưa có phiếu.</td></tr>`}</tbody></table></div>`;
}
async function renderLS() {
  S.lsThang = S.lsThang || today().slice(0, 7);
  $("main").innerHTML = `<div class="card"><div class="row"><label>Tháng<input id="lt" type="month" value="${S.lsThang}"></label>
    <label style="flex:2 1 220px">Mã (để trống = tất cả)<input id="lm" list="dlm2" value="${esc(S.lsMa || "")}"></label></div>
    <datalist id="dlm2">${S.items.map(i => `<option value="${esc(i.ma)}">${esc(i.ten)}</option>`).join("")}</datalist>
    <div id="lsb" style="margin-top:12px" class="mu">Đang tải…</div></div>`;
  const load = async () => {
    const [y, m] = S.lsThang.split("-").map(Number), to = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
    let q = sb.from("phieu").select("*").gte("ngay", S.lsThang + "-01").lt("ngay", to).order("ngay", { ascending: false }).order("created_at", { ascending: false }).limit(1000);
    if (S.lsMa) q = q.eq("ma", S.lsMa);
    const { data, error } = await q;
    $("lsb").innerHTML = error ? esc(err(error)) : `<p class="mu">${data.length} phiếu</p>` + histTable(data, true);
  };
  $("lt").onchange = e => { S.lsThang = e.target.value; load(); };
  $("lm").onchange = e => { S.lsMa = e.target.value.trim(); load(); };
  $("lsb").onclick = async e => {
    const b = e.target.closest("[data-huy]"); if (!b) return;
    const ly = prompt("Lý do huỷ phiếu?"); if (ly === null) return;
    b.disabled = true;
    const { error } = await sb.rpc("huy_phieu", { p_id: b.dataset.huy, p_ly_do: ly });
    if (error) { toast(err(error)); b.disabled = false; return; }
    const ma = (await sb.from("phieu").select("ma").eq("id", b.dataset.huy)).data?.[0]?.ma; if (ma) await reloadMa(ma);
    toast("Đã huỷ phiếu"); load();
  };
  load();
}

/* ---------------- QC LÔ ---------------- */
function renderQC() {
  const rows = [];
  Object.keys(S.lots).forEach(ma => (S.lots[ma] || []).forEach(l => { const t = qcOf(ma, l.lo); if (t && l.ton_kg > 0) rows.push({ ma, l, t }); }));
  rows.sort((a, b) => (a.t === "Đạt") - (b.t === "Đạt") || a.ma.localeCompare(b.ma));
  const quyen = S.me.quyen_qc || S.me.vai_tro === "Quản lý";
  $("main").innerHTML = `<div class="card"><p class="mu">Lô còn tồn thuộc nhóm cần QC (${esc(S.nhomQC.join(", "))}). Lô chưa “Đạt” không xuất được.</p>
    <div class="tbl"><table><thead><tr><th>Mã</th><th>Lô</th><th class="n">Tồn (kg)</th><th>HSD</th><th>QC</th>${quyen ? "<th></th>" : ""}</tr></thead><tbody id="qcb">
    ${rows.map(r => `<tr><td>${esc(r.ma)}<br><span class="mu">${esc(S.IM[r.ma]?.ten)}</span></td><td>${esc(r.l.lo || "(không lô)")}</td><td class="n">${nf(r.l.ton_kg)}</td><td>${dmy(hsdOf(r.ma, r.l.lo, r.l))}</td><td>${qcTag(r.t)}</td>
      ${quyen ? `<td style="white-space:nowrap">${r.t !== "Đạt" ? `<button class="btn sm" data-ma="${esc(r.ma)}" data-lo="${esc(r.l.lo)}" data-tt="Đạt">Đạt</button>` : ""} ${r.t !== "Không đạt" ? `<button class="btn sm" data-ma="${esc(r.ma)}" data-lo="${esc(r.l.lo)}" data-tt="Không đạt">Không đạt</button>` : ""}</td>` : ""}</tr>`).join("") || `<tr><td colspan="6" class="mu">Không có lô nào.</td></tr>`}
    </tbody></table></div></div>`;
  $("qcb").onclick = async e => {
    const b = e.target.closest("[data-tt]"); if (!b) return;
    const gc = b.dataset.tt === "Không đạt" ? prompt("Ghi chú (lý do không đạt)?") : ""; if (gc === null) return;
    b.disabled = true;
    const { error } = await sb.rpc("luu_qc", { p_ma: b.dataset.ma, p_lo: b.dataset.lo, p_tt: b.dataset.tt, p_ghi_chu: gc || "" });
    if (error) { toast(err(error)); b.disabled = false; return; }
    await reloadMa(b.dataset.ma); toast(`QC ${b.dataset.ma} lô ${b.dataset.lo}: ${b.dataset.tt}`); renderQC();
  };
}

/* ---------------- CHẠY ---------------- */
sb.auth.onAuthStateChange((ev) => { if (ev === "SIGNED_OUT") S.me = null; });
start().catch(e => showLogin(err(e)));
