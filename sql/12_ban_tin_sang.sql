-- Sổ Kho — Bản tin buổi sáng: email + bật/tắt cho từng tài khoản.
-- Chạy 1 lần trong Supabase → SQL Editor (sau file 11_thong_bao_day.sql).
create table if not exists public.ban_tin_cfg (
  ten       text primary key,        -- nguoi_dung.ten
  email     text,                    -- email nhận bản tin (trống = không gửi email)
  email_on  boolean default true,
  push_on   boolean default true,
  sua_luc   timestamptz default now()
);
alter table public.ban_tin_cfg enable row level security;
revoke all on public.ban_tin_cfg from anon, authenticated;

-- mã bí mật để Apps Script (Gmail) gọi bản tin hằng ngày — hàm "push" tự tạo, Quản lý xem trong Sổ Kho
alter table public.push_cfg add column if not exists brief_token text;
