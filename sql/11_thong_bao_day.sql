-- Sổ Kho — Thông báo đẩy (Web Push) cho điện thoại / máy tính
-- Chạy 1 lần trong Supabase → SQL Editor.
-- 2 bảng chỉ hàm máy chủ "push" (Edge Function, dùng khoá service role có sẵn) đọc/ghi được;
-- người dùng web KHÔNG đọc trực tiếp được (bật RLS, không có policy).

create table if not exists public.push_sub (
  endpoint  text primary key,          -- địa chỉ nhận thông báo của 1 máy
  ten       text not null,             -- người dùng (nguoi_dung.ten)
  p256dh    text not null,
  auth      text not null,
  ua        text,                      -- loại máy / trình duyệt
  tao       timestamptz default now(),
  lan_cuoi  timestamptz
);
create index if not exists push_sub_ten on public.push_sub (ten);
alter table public.push_sub enable row level security;

-- Cặp khoá VAPID: hàm "push" tự tạo ở lần chạy đầu và cất ở đây (không ai phải chép khoá bằng tay)
create table if not exists public.push_cfg (
  id   int primary key default 1 check (id = 1),
  pub  text not null,
  priv text not null
);
alter table public.push_cfg enable row level security;

revoke all on public.push_sub, public.push_cfg from anon, authenticated;
