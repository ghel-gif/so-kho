// Sổ Kho — Edge Function "push": gửi thông báo đẩy (Web Push) tới điện thoại / máy tính.
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

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    try {
      const db = ctx.supabaseAdmin;
      const uid = (ctx.userClaims as any)?.id || (ctx.jwtClaims as any)?.sub;
      if (!uid) return Response.json({ error: "Chưa đăng nhập Sổ Kho." }, { status: 401 });
      const { data: me } = await db.from("nguoi_dung").select("ten,vai_tro,quyen_qc").eq("auth_uid", uid).maybeSingle();
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

      let names: string[] = [];
      if (b.a === "test") names = [me.ten];
      else if (b.a === "send") {
        if (me.vai_tro === "Chỉ xem") return Response.json({ error: "Tài khoản chỉ xem không gửi thông báo." }, { status: 403 });
        const to = b.to || {};
        const { data: U } = await db.from("nguoi_dung").select("ten,vai_tro,quyen_qc");
        names = (U || []).filter((x: any) => to.all || (to.qc && x.quyen_qc) || (to.roles || []).includes(x.vai_tro) || (to.ten || []).includes(x.ten))
          .map((x: any) => x.ten).filter((t: string) => t !== me.ten);
      } else return Response.json({ error: "Thao tác không hợp lệ." }, { status: 400 });
      if (!names.length) return Response.json({ sent: 0, devices: 0 });

      const { data: S } = await db.from("push_sub").select("*").in("ten", names);
      const payload = JSON.stringify({
        title: String(b.title || "Sổ Kho").slice(0, 120),
        body: String(b.body || (b.a === "test" ? "Thông báo thử: máy này đã nhận được thông báo từ Sổ Kho." : "")).slice(0, 400),
        url: String(b.url || "./").slice(0, 300), tag: String(b.tag || "").slice(0, 60), from: me.ten,
      });
      let sent = 0;
      await Promise.all((S || []).map(async (s: any) => {
        try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86400, urgency: "high" }); sent++; }
        catch (e: any) { if (e?.statusCode === 404 || e?.statusCode === 410) await db.from("push_sub").delete().eq("endpoint", s.endpoint); }
      }));
      return Response.json({ sent, devices: (S || []).length });
    } catch (e: any) {
      return Response.json({ error: String(e?.message || e) }, { status: 500 });
    }
  }),
};
