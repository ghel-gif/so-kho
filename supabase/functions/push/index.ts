// Sổ Kho — Edge Function "push": thông báo đẩy (Web Push) + bản tin buổi sáng.
// Dán nguyên file này vào Supabase → Edge Functions → Deploy a new function → Via Editor, tên hàm: push.
// Không cần nhập khoá nào: supabaseAdmin dùng khoá secret có sẵn của dự án; cặp khoá VAPID tự tạo ở lần chạy đầu.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";
import webpush from "npm:web-push@3.6.7";

let KEYS: { pub: string; priv: string } | null = null;
async function keys(db: any) {
  if (KEYS) return KEYS;
  let { data } = await db.from("push_cfg").select("pub,priv").eq("id", 1).maybeSingle();
  if (!data) {
    const k = webpush.generateVAPIDKeys();
    const ins = await db.from("push_cfg").insert({ id: 1, pub: k.publicKey, priv: k.privateKey });
    if (ins.error) data = (await db.from("push_cfg").select("pub,priv").eq("id", 1).single()).data;
    else data = { pub: k.publicKey, priv: k.privateKey };
  }
  webpush.setVapidDetails("https://ghel-gif.github.io/so-kho/", data.pub, data.priv);
  KEYS = data;
  return data;
}

async function pushTo(db: any, names: string[], msg: any) {
  if (!names.length) return { sent: 0, devices: 0 };
  await keys(db);
  const { data: S } = await db.from("push_sub").select("*").in("ten", names);
  const payload = JSON.stringify(msg);
  let sent = 0;
  await Promise.all((S || []).map(async (s: any) => {
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86400, urgency: "high" }); sent++; }
    catch (e: any) { if (e?.statusCode === 404 || e?.statusCode === 410) await db.from("push_sub").delete().eq("endpoint", s.endpoint); }
  }));
  return { sent, devices: (S || []).length };
}

/* ---------- Bản tin buổi sáng: logic nằm ở brief.js trên web (sửa không cần triển khai lại hàm) ---------- */
const WEB = "https://ghel-gif.github.io/so-kho/";
async function briefToken(db: any) {
  const { data } = await db.from("push_cfg").select("brief_token").eq("id", 1).maybeSingle();
  if (data?.brief_token) return data.brief_token;
  await keys(db);
  const t = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  await db.from("push_cfg").update({ brief_token: t }).eq("id", 1);
  return t;
}
async function buildBriefs(db: any, users: any[]) {
  const sheets: Record<string, any[]> = {};
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("sheet_rows").select("sheet,idx,data").not("sheet", "like", "ao:%").order("sheet").order("idx").range(from, from + 999);
    if (error) throw error;
    (data || []).forEach((r: any) => { (sheets[r.sheet] = sheets[r.sheet] || [])[r.idx] = r.data || []; });
    if (!data || data.length < 1000) break;
  }
  Object.values(sheets).forEach(a => { for (let i = 0; i < a.length; i++) if (!a[i]) a[i] = []; });
  const v = "?t=" + Date.now(), get = (f: string) => fetch(WEB + f + v, { cache: "no-store" }).then(r => { if (!r.ok) throw new Error("Không tải được " + f); return r.text(); });
  const [srv, kh, br] = await Promise.all([get("server.gs"), get("khpt.gs"), get("brief.js")]);
  new Function(br)();
  return (globalThis as any).SOKHO_BRIEF.build(sheets, srv + "\n" + kh, users);
}
async function runDaily(db: any, b: any) {
  const tok = await briefToken(db);
  if (!b || b.token !== tok) return Response.json({ error: "Sai mã bản tin." }, { status: 401 });
  const { data: U } = await db.from("nguoi_dung").select("ten,vai_tro,quyen_qc,kho_thu").eq("kho_thu", false);
  const { data: C } = await db.from("ban_tin_cfg").select("*");
  const cfg = (t: string, role: string) => (C || []).find((x: any) => x.ten === t) || { email: "", email_on: true, push_on: role !== "Chỉ xem" };
  const users = (U || []).filter((u: any) => { const c = cfg(u.ten, u.vai_tro); return c.push_on || (c.email_on && c.email); });
  const R = await buildBriefs(db, users), mails: any[] = [];
  let pushed = 0;
  for (const r of R) {
    const u = users.find((x: any) => x.ten === r.ten), c = cfg(r.ten, u.vai_tro);
    if (!r.n) continue;
    if (c.push_on) { const x = await pushTo(db, [r.ten], { title: "☀️ Bản tin sáng Sổ Kho", body: r.push, url: "./", tag: "bantin" }); pushed += x.sent; }
    if (c.email_on && c.email) mails.push({ to: c.email, subject: r.subject, html: r.html });
  }
  return Response.json({ ok: 1, users: users.length, pushed, mails });
}

export default {
  fetch: withSupabase({ auth: ["user", "none"] }, async (req, ctx) => {
    try {
      const db = ctx.supabaseAdmin;
      if (ctx.authMode === "none") return await runDaily(db, await req.json().catch(() => ({})));
      const uid = (ctx.userClaims as any)?.id || (ctx.jwtClaims as any)?.sub;
      if (!uid) return Response.json({ error: "Chưa đăng nhập Sổ Kho." }, { status: 401 });
      const { data: me } = await db.from("nguoi_dung").select("ten,vai_tro,quyen_qc,kho_thu").eq("auth_uid", uid).maybeSingle();
      if (!me) return Response.json({ error: "Không tìm thấy người dùng." }, { status: 403 });
      const b = await req.json().catch(() => ({}));
      const k = await keys(db);

      if (b.a === "key") return Response.json({ pub: k.pub });
      if (b.a === "sub") {
        const s = b.sub || {};
        if (!s.endpoint || !s.keys?.p256dh || !s.keys?.auth) return Response.json({ error: "Thiếu dữ liệu đăng ký." }, { status: 400 });
        const { error } = await db.from("push_sub").upsert({ endpoint: s.endpoint, ten: me.ten, p256dh: s.keys.p256dh, auth: s.keys.auth, ua: String(b.ua || "").slice(0, 300), lan_cuoi: new Date().toISOString() });
        if (error) throw error;
        return Response.json({ ok: 1 });
      }
      if (b.a === "unsub") { await db.from("push_sub").delete().eq("endpoint", String(b.endpoint || "")); return Response.json({ ok: 1 }); }
      if (me.kho_thu && b.a !== "test") return Response.json({ error: "Tài khoản kho thử không dùng chức năng này." }, { status: 403 });
      const QL = me.vai_tro === "Quản lý";
      if (b.a === "bcfg") {
        const { data: C } = await db.from("ban_tin_cfg").select("*");
        const mine = (C || []).find((x: any) => x.ten === me.ten) || { ten: me.ten, email: "", email_on: true, push_on: true };
        if (!QL) return Response.json({ me: mine });
        const { data: U } = await db.from("nguoi_dung").select("ten,vai_tro,quyen_qc,kho_thu").eq("kho_thu", false);
        const all = (U || []).map((u: any) => Object.assign({ vai_tro: u.vai_tro, qc: !!u.quyen_qc }, (C || []).find((x: any) => x.ten === u.ten) || { ten: u.ten, email: "", email_on: true, push_on: u.vai_tro !== "Chỉ xem" }));
        return Response.json({ me: mine, all, token: await briefToken(db) });
      }
      if (b.a === "bset") {
        const ten = String(b.ten || me.ten);
        if (ten !== me.ten && !QL) return Response.json({ error: "Chỉ Quản lý sửa được bản tin của người khác." }, { status: 403 });
        const email = String(b.email || "").trim();
        if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Response.json({ error: "Email không hợp lệ: " + email }, { status: 400 });
        const { error } = await db.from("ban_tin_cfg").upsert({ ten, email, email_on: b.email_on !== false, push_on: b.push_on !== false, sua_luc: new Date().toISOString() });
        if (error) throw error;
        return Response.json({ ok: 1 });
      }
      if (b.a === "bme") {
        const [r] = await buildBriefs(db, [me]);
        if (r.push || b.force) await pushTo(db, [me.ten], { title: "☀️ Bản tin sáng Sổ Kho", body: r.push || "Không có việc tồn trong phần việc của bạn.", url: "./", tag: "bantin" });
        return Response.json({ n: r.n, subject: r.subject, html: r.html, push: r.push });
      }

      let names: string[] = [];
      if (b.a === "test") names = [me.ten];
      else if (b.a === "send") {
        if (me.vai_tro === "Chỉ xem") return Response.json({ error: "Tài khoản chỉ xem không gửi thông báo." }, { status: 403 });
        const to = b.to || {};
        const { data: U } = await db.from("nguoi_dung").select("ten,vai_tro,quyen_qc,kho_thu").eq("kho_thu", false);
        names = (U || []).filter((x: any) => to.all || (to.qc && x.quyen_qc) || (to.roles || []).includes(x.vai_tro) || (to.ten || []).includes(x.ten))
          .map((x: any) => x.ten).filter((t: string) => t !== me.ten);
      } else return Response.json({ error: "Thao tác không hợp lệ." }, { status: 400 });
      if (!names.length) return Response.json({ sent: 0, devices: 0 });

      const r = await pushTo(db, names, { title: String(b.title || "Sổ Kho").slice(0, 120), body: String(b.body || (b.a === "test" ? "Thông báo thử: máy này đã nhận được thông báo từ Sổ Kho." : "")).slice(0, 400), url: String(b.url || "./").slice(0, 300), tag: String(b.tag || "").slice(0, 60), from: me.ten });
      return Response.json(r);
    } catch (e: any) {
      return Response.json({ error: String(e?.message || e) }, { status: 500 });
    }
  }),
};
