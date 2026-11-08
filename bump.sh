#!/bin/bash
# Tăng số phiên bản (3.4.0 -> 3.4.1, 3.4.9 -> 3.5.0) ở index.html và version.txt. Dùng: ./bump.sh [minor|patch] "Ghi chú thay đổi"
set -e; cd "$(dirname "$0")"
cur=$(grep -o 'const APP_VER="[0-9.]*"' index.html | grep -o '[0-9.]*[0-9]')
IFS=. read -r a b c <<<"$cur"
if [ "$1" = minor ]; then b=$((b+1)); c=0; shift; elif [ "$1" = patch ]; then c=$((c+1)); shift; else c=$((c+1)); fi
if [ "$c" -gt 9 ]; then b=$((b+1)); c=0; fi  # số cuối chỉ 1 chữ số: 3.7.9 -> 3.8.0
new="$a.$b.$c"; d=$(TZ=Asia/Ho_Chi_Minh date +%d/%m/%Y)
python3 - "$cur" "$new" "$d" "$1" <<'P'
import sys,json,re
cur,new,d,note=sys.argv[1:5]
s=open('index.html').read()
s=s.replace(f'const APP_VER="{cur}"',f'const APP_VER="{new}"',1)
s=re.sub(r'APP_DATE="[^"]*"',f'APP_DATE="{d}"',s,count=1)
if note:
  i=s.find('APP_NEWS=[')+len('APP_NEWS=[')
  s=s[:i]+json.dumps(note,ensure_ascii=False)+','+s[i:]
open('index.html','w').write(s)
open('version.txt','w').write(new+'\n')
print(new)
P
