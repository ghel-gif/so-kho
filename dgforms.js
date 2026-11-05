/* Sổ Kho bản web — BIỂU MẪU ĐÓNG GÓI (QC-QT.04)
 * BM.05 Phiếu thông tin đóng gói thành phẩm · BM.04 / BM.06 Phiếu kiểm tra quá trình đóng gói / đóng chai
 * BM.07 Biên bản vệ sinh thiết bị đóng gói · BM.02 Kế hoạch kiểm tra hằng ngày · BM.08 Phiếu báo cáo chất lượng thành phẩm.
 * Thông tin sản phẩm, quy cách, lô BTP, tỷ trọng lấy từ lệnh đóng gói + trang QuyCachDG; chỉ nhập phần đo / kiểm thực tế. */
(function(){
const B=()=>window.BMK;
const META=(m,lbh)=>`Mã hiệu: ${m}<br>Lần ban hành: ${lbh||"02"}<br>Ngày ban hành: 02/01/2026<br>Trang: 1/1`;
const isGoi=q=>/gói|túi|bao|sachet/i.test(((q&&q.loai)||"")+" "+((q&&q.quyCach)||""));
const num=v=>{const t=String(v==null?"":v).trim().replace(",",".");return t===""?NaN:+t};
const f2=v=>isFinite(v)&&v!==""?(Math.round(v*100)/100).toLocaleString("vi-VN",{maximumFractionDigits:2}):"";
const liqOf=q=>/^\s*(ml|l|lít)/i.test((q&&q.dvl)||"");
/* định lượng → gam: g ×1, kg ×1000, ml × tỷ trọng, L × 1000 × tỷ trọng */
const toG=(q,tt)=>{const u=String((q&&q.dvl)||"g").trim().toLowerCase(),v=+(q&&q.luong)||0;if(!v)return NaN;if(/^kg/.test(u))return v*1000;if(/^ml/.test(u))return tt?v*tt:NaN;if(/^(l|lít)/.test(u))return tt?v*1000*tt:NaN;return v};
const tick=v=>v==="Đạt"?"☑":v==="Không đạt"?"☒":"";
const DD=(id,v,dis)=>`<select id="${id}" ${dis}><option value="">— chưa kết luận —</option>${["Đạt","Không đạt"].map(x=>`<option${v===x?" selected":""}>${x}</option>`).join("")}</select>`;
const today=()=>S.today;
async function getD(so){return api("webDGFGet",S.auth,so)}
function info(D){const o=D.o,q=D.q||{},sp=itemBy(o.maSP)||{ten:o.maSP},b=D.btp[0]||{},X=(D.P&&D.P.x)||{};
  const liq=liqOf(q),tt=+b.tt||0,thuoc=toG(q,tt);
  return {o,q,sp,b,X,liq,tt,thuoc,tenSP:(q.sp?q.sp+(q.quyCach?" – "+q.quyCach:""):sp.ten),maSP:q.nhan||o.maSP}}
const b05=D=>(D.forms||[]).filter(f=>f.loai==="BM05").pop()||null;

/* ---------- thanh nút trong lệnh đóng gói ---------- */
window.dgfHook=function(box,so){if(!box||!so||box.querySelector(".dgf-bar"))return;
  const bar=document.createElement("div");bar.className="actions dgf-bar";bar.style.cssText="margin:6px 0 10px;flex-wrap:wrap;justify-content:flex-start;gap:6px";
  bar.innerHTML=`<span class="note" style="align-self:center">Biểu mẫu QC:</span><button class="btn small" type="button" data-f="BM05">Thông tin đóng gói (BM.05)</button><button class="btn small" type="button" data-f="KT">Kiểm tra quá trình (BM.04/06)</button><button class="btn small" type="button" data-f="BM07">Vệ sinh thiết bị (BM.07)</button>`;
  const h2=box.querySelector("h2");if(h2&&h2.parentNode===box)h2.after(bar);else box.prepend(bar);
  bar.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>dgfOpen(so,b.dataset.f))};
async function dgfOpen(so,f){let D;try{D=await getD(so)}catch(e){return handleErr(e)}
  const loai=f==="KT"?(isGoi(D.q)?"BM04":"BM06"):f,L=(D.forms||[]).filter(x=>x.loai===loai);
  if(loai==="BM05")return f05(D,L.pop()||null);
  if(!L.length)return loai==="BM07"?f07(D,null):fKT(D,loai,null);
  const w=document.createElement("div");w.className="cfm";const nm={BM04:"Phiếu kiểm tra quá trình đóng gói (BM.04)",BM06:"Phiếu kiểm tra quá trình đóng chai (BM.06)",BM07:"Biên bản vệ sinh thiết bị đóng gói (BM.07)"}[loai];
  w.innerHTML=`<div class="cfm-box"><h2>${nm}</h2><p class="note">Lệnh ${esc(so)} đã có ${L.length} phiếu. Mở phiếu cũ hoặc lập phiếu mới (VD: ca khác, ngày khác).</p><div class="list">${L.map((x,i)=>`<div class="row click" data-i="${i}"><div class="name">${esc(dmy(x.ngay))} · ${esc(x.d.ca||x.d.gio||"")} ${x.kl?`<span class="chip">${esc(x.kl)}</span>`:""}</div><div class="meta">${esc(x.nguoi)} · ${esc(x.luc)}</div></div>`).join("")}</div>
   <div class="actions"><span style="flex:1"></span><button class="btn" type="button" data-x="close">Đóng</button><button class="btn primary" type="button" data-x="new">+ Phiếu mới</button></div></div>`;
  document.body.appendChild(w);const go=x=>{w.remove();loai==="BM07"?f07(D,x):fKT(D,loai,x)};
  w.querySelectorAll("[data-i]").forEach(r=>r.onclick=()=>go(L[+r.dataset.i]));w.querySelector('[data-x="new"]').onclick=()=>go(null);w.querySelector('[data-x="close"]').onclick=()=>w.remove();w.onclick=e=>{if(e.target===w)w.remove()}}
async function save(D,loai,p,data,ngay,kl){const id=await api("webDGFSave",S.auth,{id:p&&p.id||p&&p._id||"",loai,so:D.o.so,ngay,data,kl});if(p)p._id=id;return id}
function dlg(html){const w=document.createElement("div");w.className="cfm";w.innerHTML=`<div class="cfm-box kh-dlg">${html}</div>`;document.body.appendChild(w);w.onclick=e=>{if(e.target===w)w.remove()};return w}
const inp=(id,lb,v,ex)=>`<label>${lb}<input id="${id}" value="${esc(v==null?"":v)}" ${ex||""}></label>`;
const mayDL=D=>`<datalist id="dgfMay">${(D.may||[]).map(m=>`<option value="${esc(m.ma)}">${esc(m.ten)}</option>`).join("")}</datalist>`;

/* ---------- BM.05 Phiếu thông tin đóng gói thành phẩm ---------- */
const BB_LOAI=["Chai có nhãn, không nắp","Chai không nhãn, không nắp","Chai có nhãn, có nắp","Gói thuốc"];
function f05(D,p){const I=info(D),d=Object.assign({ngay:today(),maMay:"",mayTen:"",nhietDo:"",tocDo:"",seal:"",nhietEp:"",tlThuoc:isFinite(I.thuoc)?Math.round(I.thuoc*10)/10:"",ds:"",loaiBB:isGoi(I.q)?"Gói thuốc":"Chai có nhãn, không nắp",klBB:"",dvThung:I.q.dvThung||"",thungPallet:"",lop:"",thungLop:"",mangCo:"",klThung:"",bangKeo:"",ghiChu:""},p?p.d:{}),canW=can.phieu(),dis=canW?"":"disabled";
  const w=dlg(`<h2>Phiếu thông tin đóng gói thành phẩm (BM.05) · ${esc(I.o.so)}</h2><p class="note">${esc(I.tenSP)} · mã ${esc(I.maSP)} · BTP ${esc(I.b.lo||"")}${I.tt?" · tỷ trọng "+String(I.tt).replace(".",","):""}. Trọng lượng thuốc chuẩn tự tính từ định lượng ${esc(I.q.luong||"")} ${esc(I.q.dvl||"")}${I.liq?" × tỷ trọng":""}, sửa được.</p>
   <div class="two">${inp("f5Ngay","Ngày lập phiếu",d.ngay,`type="date" ${dis}`)}${inp("f5MaMay","Mã thiết bị",d.maMay,`list="dgfMay" ${dis}`)}</div>${mayDL(D)}
   ${inp("f5MayTen","Tên thiết bị",d.mayTen,dis)}
   <b style="display:block;margin-top:8px">Thông số máy (tham khảo)</b>
   <div class="two">${inp("f5Nd","Nhiệt độ cài đặt",d.nhietDo,dis)}${inp("f5Td","Tốc độ băng tải",d.tocDo,dis)}</div><div class="two">${inp("f5Seal","Seal",d.seal,dis)}${inp("f5Ep","Nhiệt ép",d.nhietEp,dis)}</div>
   <b style="display:block;margin-top:8px">Trọng lượng</b>
   <div class="two">${inp("f5Tl","Trọng lượng thuốc chuẩn (g)",d.tlThuoc,`type="number" step="any" ${dis}`)}${inp("f5Ds","Dung sai ± (g)",d.ds,`type="number" step="any" ${dis}`)}</div>
   <div class="two"><label>Loại bao bì tính khối lượng<select id="f5Lbb" ${dis}>${BB_LOAI.map(x=>`<option${x===d.loaiBB?" selected":""}>${x}</option>`).join("")}</select></label>${inp("f5Kbb","Khối lượng bao bì (g)",d.klBB,`type="number" step="any" ${dis}`)}</div>
   <b style="display:block;margin-top:8px">Quy cách đóng gói</b>
   <div class="two">${inp("f5Dvt",(isGoi(I.q)?"Gói":"Chai")+" / thùng carton lớn",d.dvThung,`type="number" ${dis}`)}${inp("f5Kt","Khối lượng thùng carton (kg, gồm tấm lót)",d.klThung,`type="number" step="any" ${dis}`)}</div>
   <div class="two">${inp("f5Tp","Thùng / pallet",d.thungPallet,`type="number" ${dis}`)}<label>Pallet quấn màng co<select id="f5Mc" ${dis}><option value=""></option>${["Có","Không"].map(x=>`<option${x===d.mangCo?" selected":""}>${x}</option>`).join("")}</select></label></div>
   <div class="two">${inp("f5Lop","Số lớp / pallet",d.lop,`type="number" ${dis}`)}${inp("f5Tl2","Số thùng / lớp",d.thungLop,`type="number" ${dis}`)}</div>
   <label>Thùng carton kéo băng keo<select id="f5Bk" ${dis}><option value=""></option>${["logo Asata","logo khách","không thông tin"].map(x=>`<option${x===d.bangKeo?" selected":""}>${x}</option>`).join("")}</select></label>
   ${inp("f5Gc","Ghi chú",d.ghiChu,dis)}<p class="note" id="f5Sum"></p>
   ${p?`<p class="note">Lưu lần cuối: ${esc(p.nguoi)} · ${esc(p.luc)}</p>`:""}<div class="actions">${B().btn4(canW,!!p)}</div>`);
  const g=()=>({ngay:$("f5Ngay").value,maMay:$("f5MaMay").value.trim(),mayTen:$("f5MayTen").value.trim(),nhietDo:$("f5Nd").value.trim(),tocDo:$("f5Td").value.trim(),seal:$("f5Seal").value.trim(),nhietEp:$("f5Ep").value.trim(),tlThuoc:$("f5Tl").value,ds:$("f5Ds").value,loaiBB:$("f5Lbb").value,klBB:$("f5Kbb").value,dvThung:$("f5Dvt").value,thungPallet:$("f5Tp").value,lop:$("f5Lop").value,thungLop:$("f5Tl2").value,mangCo:$("f5Mc").value,klThung:$("f5Kt").value,bangKeo:$("f5Bk").value,ghiChu:$("f5Gc").value.trim()});
  const sum=()=>{const c=c05(g());$("f5Sum").innerHTML=isFinite(c.t)?`Thuốc ${f2(c.t)} g (${f2(c.tMin)} – ${f2(c.tMax)}) · nguyên ${isGoi(I.q)?"gói":"chai"} ${f2(c.n)} g (${f2(c.nMin)} – ${f2(c.nMax)})${isFinite(c.th)?` · thùng ${f2(c.thMin)} – ${f2(c.thMax)} kg`:""}`:""};
  w.addEventListener("input",sum);sum();
  $("f5MaMay").onchange=()=>{const m=(D.may||[]).find(x=>x.ma===$("f5MaMay").value.trim());if(m&&!$("f5MayTen").value)$("f5MayTen").value=m.ten};
  B().btnWire(w,{canW,saved:!!p,dirty:false},async()=>{const d=g();p=p||{};p.d=d;await save(D,"BM05",p,d,d.ngay,"");D.forms=(D.forms||[]).filter(x=>x.loai!=="BM05").concat([Object.assign({loai:"BM05",id:p._id},p)])},()=>p05(I,g()))}
function c05(d){const t=num(d.tlThuoc),ds=num(d.ds)||0,bb=num(d.klBB)||0,n=t+bb,k=num(d.dvThung),kt=num(d.klThung)||0;
  return {t,tMin:t-ds,tMax:t+ds,n,nMin:n-ds,nMax:n+ds,th:k?n*k/1000+kt:NaN,thMin:k?(n-ds)*k/1000+kt:NaN,thMax:k?(n+ds)*k/1000+kt:NaN}}
function p05(I,d){const c=c05(d),K=B(),bx=v=>K.box(v),u=isGoi(I.q)?"GÓI":"CHAI";
  K.pr(`${K.PCSS}<style>.pq .t3 td{vertical-align:top;font-size:11.5pt;line-height:1.5}.pq .t3 th{font-size:11.5pt}</style><div class="pq">${K.head("PHIẾU THÔNG TIN ĐÓNG GÓI<br>THÀNH PHẨM",META("BM.05-QC-QT.04"))}
  <p style="margin:8px 0">Ngày lập phiếu: <b>${dmy(d.ngay)}</b> &nbsp;&nbsp; Lệnh đóng gói: <b>${esc(I.o.so)}</b> &nbsp;&nbsp; Mã thiết bị: <b>${esc(d.maMay)}</b>${d.mayTen?" ("+esc(d.mayTen)+")":""}</p>
  <table class="t3"><colgroup><col style="width:30%"><col style="width:38%"><col style="width:32%"></colgroup>
   <tr><td colspan="2">Tên sản phẩm: <b>${esc(I.tenSP)}</b></td><td>Mã sản phẩm: <b>${esc(I.maSP)}</b></td></tr>
   <tr><th>THÔNG SỐ MÁY</th><th>TRỌNG LƯỢNG ${u}/GÓI THUỐC (gr)</th><th>QUY CÁCH ĐÓNG GÓI</th></tr>
   <tr><td>Nhiệt độ cài đặt: ${esc(d.nhietDo)}<br>Tốc độ băng tải (*): ${esc(d.tocDo)}<br>Seal (*): ${esc(d.seal)}<br>Nhiệt ép (*): ${esc(d.nhietEp)}</td>
    <td>Trọng lượng của thuốc chuẩn (*): <b>${f2(c.t)} gr</b><br>dung sai: (${f2(c.tMin)} – ${f2(c.tMax)}) gr<br>Trọng lượng nguyên ${u.toLowerCase()} chuẩn (*): <b>${f2(c.n)} gr</b><br>dung sai: (${f2(c.nMin)} – ${f2(c.nMax)}) gr<br><i>Ghi chú:</i><br>${BB_LOAI.map(x=>`${bx(d.loaiBB===x)} ${x.toLowerCase()}; KL bao bì: ${d.loaiBB===x&&d.klBB!==""?f2(num(d.klBB)):"……"} gr`).join("<br>")}</td>
    <td><b>${esc(d.dvThung||"……")}</b> ${u} / 1 thùng carton lớn<br><b>${esc(d.thungPallet||"……")}</b> thùng carton / 1 pallet (số lớp ${esc(d.lop||"…")} × số thùng ${esc(d.thungLop||"…")})<br>Pallet quấn màng co: ${bx(d.mangCo==="Có")} Có ${bx(d.mangCo==="Không")} Không<br>Trọng lượng thùng carton lớn: ${isFinite(c.th)?`(${f2(c.thMin)} ÷ ${f2(c.thMax)})`:"( ÷ )"} kg<br><i>Ghi chú:</i> KL bao bì thùng carton: ${d.klThung!==""?f2(num(d.klThung)):"……"} kg (đã bao gồm tấm lót thùng)</td></tr>
   <tr><td colspan="3"><b>Thông tin bán thành phẩm</b><br>Tên: ${esc(I.b.ten||"")} &nbsp; NSX: ${I.b.nsx?dmy(String(I.b.nsx).slice(0,10)):""} &nbsp; Số lô SX: <b>${esc(I.b.lo||"")}</b> &nbsp; Tỷ trọng (nếu có): ${I.tt?String((+I.tt).toFixed(3)).replace(".",","):""}<br><i>(*) Thông số tham khảo, sẽ được điều chỉnh tùy thuộc vào tình hình thực tế</i></td></tr>
   <tr><td colspan="3">Lưu ý: thùng carton kéo bằng băng keo: ${bx(d.bangKeo==="logo Asata")} logo Asata ${bx(d.bangKeo==="logo khách")} logo khách ${bx(d.bangKeo==="không thông tin")} không thông tin${d.ghiChu?"<br>Ghi chú: "+esc(d.ghiChu):""}</td></tr></table>
  ${K.sign([["Người lập phiếu",""],["Nhân viên QC",""],["Phòng R&D",""]])}</div>`)}

/* ---------- BM.04 / BM.06 Phiếu kiểm tra quá trình ---------- */
const CR={BM04:[["Nhãn phụ, tem",[["np","Nhãn phụ: đúng chủng loại"],["tem","Tem: đúng chủng loại, đúng vị trí"]]],["Nhãn gói",[["ng","Đúng chủng loại"],["han","Đường hàn, cạnh biên, vết xé túi"],["vs","Vệ sinh bao bì"]]],["Mối ép nhiệt",[["ep","Nhiệt độ ép (°C)",1],["dinh","Mối ép dính đều"],["luc","Thử lực không bị bung, xì chảy"]]],["Thùng carton",[["nt","Nhãn dán thùng đúng loại"],["dut","Đủ gói/ thùng"],["duh","Đủ gói/ hộp"]]],["In phun",[["in1","NSX/SL: in đúng"],["in2","In rõ ràng, ngay ngắn trên gói"]]]],
  BM06:[["Nhãn phụ, tem",[["np","Nhãn phụ: đúng chủng loại"],["tem","Tem: đúng chủng loại, dán đúng vị trí"]]],["Nhãn chai",[["nc","Đúng chủng loại"],["phang","Nhãn phẳng, không nhăn, không dùn"],["vs","Vệ sinh bao bì"]]],["Seal",[["seal","Công suất seal (%)",1],["sd","Seal dính đều"]]],["Thùng carton",[["nt","Nhãn dán thùng đúng loại"],["dut","Đủ chai/ thùng"],["coc","Đủ cốc đong/ thùng"]]],["In phun",[["in1","NSX/SL: in đúng"],["in2","In rõ ràng, ngay ngắn trên nhãn"]]]]};
const NS={BM04:10,BM06:12},TEN={BM04:"PHIẾU KIỂM TRA QUÁ TRÌNH<br>ĐÓNG GÓI",BM06:"PHIẾU KIỂM TRA QUÁ TRÌNH<br>ĐÓNG CHAI"};
const RL=["Đầu ca","Sau 2h tiếp theo","Sau 2h tiếp theo","Sau 2h tiếp theo"];
function fKT(D,loai,p){const I=info(D),f5=b05(D),c5=f5?c05(f5.d):{},n=NS[loai],canW=can.phieu(),dis=canW?"":"disabled",qc=S.me&&S.me.qc;
  const d=Object.assign({ngay:today(),ca:"",maMay:f5?f5.d.maMay:"",mayTen:f5?f5.d.mayTen:"",cach:"tong",tMin:isFinite(c5.tMin)?Math.round(c5.tMin*100)/100:"",tMax:isFinite(c5.tMax)?Math.round(c5.tMax*100)/100:"",nMin:isFinite(c5.nMin)?Math.round(c5.nMin*100)/100:"",nMax:isFinite(c5.nMax)?Math.round(c5.nMax*100)/100:"",rounds:[{gio:"07:30",c:{},v:{},e:{},kl:[]}],kph:{loi:"",sl:"",kp:"",tg:""}},p?JSON.parse(JSON.stringify(p.d)):{}),crit=CR[loai];
  let kl=p?p.kl:"";
  d.rounds.forEach(r=>{r.e=r.e||{}});
  const sel=(r,k)=>{const R0=d.rounds[r],kd=R0.c[k]==="Không đạt";return `<select data-r="${r}" data-k="${k}" ${dis}><option value=""></option><option${R0.c[k]==="Đạt"?" selected":""}>Đạt</option><option${kd?" selected":""}>Không đạt</option></select><input data-r="${r}" data-e="${k}" value="${esc(R0.e[k]||"")}" placeholder="Lỗi / lý do" ${dis} style="margin-top:4px;font-size:12.5px;${kd?"":"display:none"}">`};
  const lim=()=>d.cach==="thuoc"?[num(d.tMin),num(d.tMax)]:[num(d.nMin),num(d.nMax)];
  const body=()=>{const R=d.rounds,[lo,hi]=lim();
    return `<div class="dgx"><table><thead><tr><th>Tiêu chí / Danh mục</th>${R.map((r,i)=>`<th>${RL[i]||"Lần "+(i+1)}<br><input data-g="${i}" type="time" value="${esc(r.gio||"")}" ${dis} style="width:105px"></th>`).join("")}</tr></thead><tbody>
     ${crit.map(([g,items])=>`<tr><td colspan="${R.length+1}" style="background:var(--accent-soft);font-weight:700">${esc(g)}</td></tr>`+items.map(([k,t,isV])=>`<tr><td>${esc(t)}</td>${R.map((r,i)=>`<td>${isV?`<input data-r="${i}" data-v="${k}" value="${esc(r.v[k]||"")}" ${dis} style="width:80px">`:sel(i,k)}</td>`).join("")}</tr>`).join("")).join("")}
     <tr><td colspan="${R.length+1}" style="background:var(--accent-soft);font-weight:700">Thuốc — ${d.cach==="thuoc"?"trọng lượng thuốc (đã trừ bì, g)":"tổng trọng lượng "+(loai==="BM04"?"gói":"chai")+" (gồm bao bì, g)"}, ${n} mẫu/lần${isFinite(lo)&&isFinite(hi)?` · cho phép ${f2(lo)} – ${f2(hi)} g`:""}</td></tr>
     ${Array.from({length:n},(_,j)=>`<tr><td>Mẫu ${j+1}${loai==="BM06"?" <small class=\"note\">(vòi "+(j+1)+")</small>":""}</td>${R.map((r,i)=>{const v=num(r.kl[j]),bad=isFinite(v)&&isFinite(lo)&&isFinite(hi)&&(v<lo||v>hi);return `<td><input data-r="${i}" data-s="${j}" type="number" step="any" value="${esc(r.kl[j]??"")}" ${dis} style="width:90px${bad?";border-color:#d93025;background:#fde8e6":""}"></td>`}).join("")}</tr>`).join("")}
     </tbody></table></div>`};
  const w=dlg(`<h2>${loai==="BM04"?"Phiếu kiểm tra quá trình đóng gói (BM.04)":"Phiếu kiểm tra quá trình đóng chai (BM.06)"} · ${esc(I.o.so)}</h2><p class="note">${esc(I.tenSP)} · lô BTP ${esc(I.b.lo||"")}. Tần suất: ${n} mẫu/lần — đầu ca, định kỳ sau mỗi 2 h. ${f5?"Trọng lượng cho phép lấy từ phiếu BM.05.":"Chưa có phiếu BM.05 — nhập trọng lượng cho phép bên dưới."}</p>
   <div class="two">${inp("fkNgay","Ngày đóng gói",d.ngay,`type="date" ${dis}`)}${inp("fkCa","Ca / ghi chú ca",d.ca,`placeholder="VD: Ca 1" ${dis}`)}</div>
   <div class="two">${inp("fkMa","Mã thiết bị",d.maMay,`list="dgfMay" ${dis}`)}${inp("fkTen","Tên thiết bị",d.mayTen,dis)}</div>${mayDL(D)}
   <label>Cách cân mẫu<select id="fkCach" ${dis}><option value="tong"${d.cach!=="thuoc"?" selected":""}>Cân tổng (gồm bao bì)</option><option value="thuoc"${d.cach==="thuoc"?" selected":""}>Chỉ cân trọng lượng thuốc (đã trừ bì)</option></select></label>
   <div class="two">${inp("fkTmin","TL thuốc cho phép từ (g)",d.tMin,`type="number" step="any" ${dis}`)}${inp("fkTmax","đến (g)",d.tMax,`type="number" step="any" ${dis}`)}</div>
   <div class="two">${inp("fkNmin","Tổng TL gồm bao bì từ (g)",d.nMin,`type="number" step="any" ${dis}`)}${inp("fkNmax","đến (g)",d.nMax,`type="number" step="any" ${dis}`)}</div>
   <div id="fkT">${body()}</div>${canW?`<div class="kh-bar" style="margin-top:6px"><button class="btn small" type="button" id="fkAdd">+ Thêm lần kiểm (sau 2 h)</button><button class="btn small" type="button" id="fkDel">− Bớt lần cuối</button></div>`:""}
   <b style="display:block;margin-top:8px">Sự không phù hợp (nếu có)</b>
   <div class="two">${inp("fkLoi","Lỗi",d.kph.loi,dis)}${inp("fkSl","Số lượng lỗi",d.kph.sl,dis)}</div><div class="two">${inp("fkKp","Sự khắc phục",d.kph.kp,dis)}${inp("fkTg","Thời gian",d.kph.tg,dis)}</div>
   <label>Kết luận <small class="note">(QC)</small>${DD("fkKL",kl,canW&&qc?"":"disabled")}</label>
   ${p?`<p class="note">Lưu lần cuối: ${esc(p.nguoi)} · ${esc(p.luc)}</p>`:""}<div class="actions">${B().btn4(canW,!!p)}</div>`);
  const bind=()=>{w.querySelectorAll("#fkT [data-k]").forEach(x=>x.onchange=()=>{d.rounds[+x.dataset.r].c[x.dataset.k]=x.value;const e=x.nextElementSibling;if(e){e.style.display=x.value==="Không đạt"?"":"none";if(x.value==="Không đạt")e.focus()}});w.querySelectorAll("#fkT [data-e]").forEach(x=>x.oninput=()=>{d.rounds[+x.dataset.r].e[x.dataset.e]=x.value});
    w.querySelectorAll("#fkT [data-v]").forEach(x=>x.oninput=()=>{d.rounds[+x.dataset.r].v[x.dataset.v]=x.value});
    w.querySelectorAll("#fkT [data-s]").forEach(x=>x.oninput=()=>{d.rounds[+x.dataset.r].kl[+x.dataset.s]=x.value;const v=num(x.value),[lo,hi]=lim(),bad=isFinite(v)&&isFinite(lo)&&isFinite(hi)&&(v<lo||v>hi);x.style.borderColor=bad?"#d93025":"";x.style.background=bad?"#fde8e6":""});
    w.querySelectorAll("#fkT [data-g]").forEach(x=>x.oninput=()=>{d.rounds[+x.dataset.g].gio=x.value})};bind();
  const rer=()=>{$("fkT").innerHTML=body();bind()};
  ["fkNmin","fkNmax","fkTmin","fkTmax","fkCach"].forEach(id=>$(id).addEventListener("change",()=>{d.nMin=$("fkNmin").value;d.nMax=$("fkNmax").value;d.tMin=$("fkTmin").value;d.tMax=$("fkTmax").value;d.cach=$("fkCach").value;rer()}));
  if(canW){$("fkAdd").onclick=()=>{if(d.rounds.length>=4)return toast("Tối đa 4 lần kiểm / phiếu — lập phiếu mới cho ca sau.");const l=d.rounds[d.rounds.length-1],m=/(\d+):(\d+)/.exec(l.gio||"");d.rounds.push({gio:m?String((+m[1]+2)%24).padStart(2,"0")+":"+m[2]:"",c:{},v:{},e:{},kl:[]});rer()};
    $("fkDel").onclick=()=>{if(d.rounds.length>1){d.rounds.pop();rer()}}}
  const g=()=>Object.assign(d,{ngay:$("fkNgay").value,ca:$("fkCa").value.trim(),maMay:$("fkMa").value.trim(),mayTen:$("fkTen").value.trim(),cach:$("fkCach").value,tMin:$("fkTmin").value.trim(),tMax:$("fkTmax").value.trim(),nMin:$("fkNmin").value,nMax:$("fkNmax").value,kph:{loi:$("fkLoi").value.trim(),sl:$("fkSl").value.trim(),kp:$("fkKp").value.trim(),tg:$("fkTg").value.trim()}});
  B().btnWire(w,{canW,saved:!!p,dirty:false},async()=>{g();kl=$("fkKL").value;const miss=[];d.rounds.forEach((r,i)=>Object.keys(r.c).forEach(k=>{if(r.c[k]==="Không đạt"&&!String(r.e[k]||"").trim())miss.push(k)}));if(miss.length){toast("Ghi lỗi / lý do cho các mục Không đạt.");const x=w.querySelector('#fkT [data-e="'+miss[0]+'"]');if(x)x.focus();return false}p=p||{};p.d=JSON.parse(JSON.stringify(d));await save(D,loai,p,p.d,d.ngay,kl)},()=>{g();pKT(I,loai,d,$("fkKL").value)})}
function pKT(I,loai,d,kl){const K=B(),R=d.rounds,n=NS[loai],th=d.cach==="thuoc",lo=num(th?d.tMin:d.nMin),hi=num(th?d.tMax:d.nMax),tlo=num(d.tMin),thi=num(d.tMax),nlo=num(d.nMin),nhi=num(d.nMax),cw=Math.floor(48/Math.max(R.length,1));
  const why=k=>R.map((r,i)=>{const e=((r.e||{})[k]||"").trim();return e&&r.c[k]==="Không đạt"?(R.length>1?(RL[i]==="Đầu ca"?"Đầu ca":"Lần "+(i+1))+": ":"")+e:""}).filter(Boolean).join("; ");
  const rows=CR[loai].map(([g,items])=>`<tr class="sec"><td colspan="${R.length+2}">${esc(g)}</td></tr>`+items.map(([k,t,isV])=>`<tr><td>${esc(t)}</td>${R.map(r=>`<td class="c">${isV?esc(r.v[k]||""):tick(r.c[k])}</td>`).join("")}<td style="font-size:9.5pt">${isV?"":esc(why(k))}</td></tr>`).join("")).join("");
  const sw=Math.floor(80/n);
  const klT=`<table class="kl8"><colgroup><col style="width:20%">${Array.from({length:n},()=>`<col style="width:${sw}%">`).join("")}</colgroup><tr><th>Lần kiểm</th>${Array.from({length:n},(_,j)=>`<th>${j+1}</th>`).join("")}</tr>${R.map((r,i)=>`<tr><td>${RL[i]||"Lần "+(i+1)}${r.gio?" ("+esc(r.gio)+")":""}</td>${Array.from({length:n},(_,j)=>{const v=num(r.kl[j]),bad=isFinite(v)&&isFinite(lo)&&isFinite(hi)&&(v<lo||v>hi);return `<td class="c">${isFinite(v)?f2(v)+(bad?"*":""):""}</td>`}).join("")}</tr>`).join("")}</table>`;
  K.pr(`${K.PCSS}<style>.pq{font-size:10.5pt;line-height:1.25}.pq td,.pq th{padding:2px 5px}.pq .hd .lg img{height:16mm}.pq .kl8 td,.pq .kl8 th{font-size:9pt;padding:1px 2px}.pq .sg .nm{height:16mm}.pq .sg{margin-top:6px}</style><div class="pq">${K.head(TEN[loai],META(loai==="BM04"?"BM.04-QC-QT.04":"BM.06-QC-QT.04"))}
  <table style="margin-top:6px"><colgroup><col style="width:50%"><col style="width:50%"></colgroup>
   <tr><td colspan="2">Tên sản phẩm: <b>${esc(I.tenSP)}</b></td></tr>
   <tr><td>Ngày đóng gói: <b>${dmy(d.ngay)}</b>${d.ca?" · "+esc(d.ca):""}</td><td>Số LĐG: <b>${esc(I.o.so)}</b></td></tr>
   <tr><td>Số lô BTP: <b>${esc(I.b.lo||"")}</b></td><td>Ngày sản xuất: <b>${I.b.nsx?dmy(String(I.b.nsx).slice(0,10)):""}</b></td></tr>
   <tr><td>Trọng lượng thuốc cho phép (g): <b>${isFinite(tlo)?f2(tlo):""}${isFinite(thi)?" – "+f2(thi):""}</b></td><td>Tổng TL (gồm bao bì) (g): <b>${isFinite(nlo)?f2(nlo):""}${isFinite(nhi)?" – "+f2(nhi):""}</b></td></tr>
   <tr><td>Tên thiết bị: <b>${esc(d.mayTen)}</b></td><td>Mã thiết bị: <b>${esc(d.maMay)}</b></td></tr>
   <tr><td>Tần suất kiểm tra: ${n} mẫu/lần — đầu ca, định kỳ sau mỗi 2 h</td><td>Đạt (☑), không đạt (☒)</td></tr></table>
  <table style="margin-top:6px"><colgroup><col style="width:32%">${R.map(()=>`<col style="width:${cw}%">`).join("")}<col style="width:20%"></colgroup><tr><th>Tiêu chí / Danh mục kiểm tra</th>${R.map((r,i)=>`<th>${RL[i]||"Lần "+(i+1)}${r.gio?"<br>"+esc(r.gio):""}</th>`).join("")}<th>Lỗi / lý do</th></tr>${rows}</table>
  <p style="margin:6px 0 3px"><b>Thuốc:</b> ${th?"trọng lượng thuốc (đã trừ bì) (g)":"tổng trọng lượng "+(loai==="BM04"?"gói":"chai")+" (gồm bao bì) (g)"} — khối lượng từng mẫu${loai==="BM06"?" (mỗi mẫu tương ứng thứ tự 1 vòi thuốc)":""}; (*) ngoài khoảng cho phép</p>${klT}
  <table style="margin-top:6px"><colgroup><col style="width:25%"><col style="width:25%"><col style="width:25%"><col style="width:25%"></colgroup><tr class="sec"><td colspan="4">Sự không phù hợp</td></tr><tr><td>Lỗi (nếu có): ${esc(d.kph.loi)}</td><td>Số lượng lỗi: ${esc(d.kph.sl)}</td><td>Sự khắc phục: ${esc(d.kph.kp)}</td><td>Thời gian: ${esc(d.kph.tg)}</td></tr></table>
  <p style="margin:6px 0"><b>Kết luận:</b> ${K.box(kl==="Đạt")} Đạt &nbsp;&nbsp; ${K.box(kl==="Không đạt")} Không đạt</p>
  ${K.sign([["QLSX - Xác nhận cuối ca",""],["Nhân viên vận hành",""],["Nhân viên QC",""]])}</div>`)}

/* ---------- BM.07 Biên bản vệ sinh thiết bị đóng gói ---------- */
const BP=["Bồn chứa","Đường ống","Máy bơm màng/ Vít tải","Vòi chiết","Mâm hứng","Băng tải","Sàn làm việc"];
function f07(D,p){const I=info(D),f5=b05(D),canW=can.phieu(),dis=canW?"":"disabled",qc=S.me&&S.me.qc,now=new Date();
  const d=Object.assign({ngay:today(),gio:String(now.getHours()).padStart(2,"0")+":"+String(now.getMinutes()).padStart(2,"0"),maMay:f5?f5.d.maMay:"",mayTen:f5?f5.d.mayTen:"",truoc:I.o.so,sau:D.sau||"",loai:"Quét dọn",dungMoi:"",bot:"",parts:BP.map(t=>({t,th:1,dg:""})),ghiChu:""},p?JSON.parse(JSON.stringify(p.d)):{});let kl=p?p.kl:"";
  const rows=()=>d.parts.map((x,i)=>`<tr><td>${esc(x.t)}</td><td class="c"><input type="checkbox" data-th="${i}" ${x.th?"checked":""} ${dis}></td><td><select data-dg="${i}" ${dis}><option value=""></option>${["Đạt","Không đạt"].map(v=>`<option${x.dg===v?" selected":""}>${v}</option>`).join("")}</select><input data-ly="${i}" value="${esc(x.ly||"")}" placeholder="Lỗi / lý do" ${dis} style="margin-top:4px;font-size:12.5px;${x.dg==="Không đạt"?"":"display:none"}"></td></tr>`).join("");
  const w=dlg(`<h2>Biên bản vệ sinh thiết bị đóng gói (BM.07) · ${esc(I.o.so)}</h2>
   <div class="two">${inp("f7Ma","Mã máy",d.maMay,`list="dgfMay" ${dis}`)}${inp("f7Ten","Tên máy",d.mayTen,dis)}</div>${mayDL(D)}
   <div class="two">${inp("f7Ngay","Ngày thực hiện",d.ngay,`type="date" ${dis}`)}${inp("f7Gio","Thời gian thực hiện",d.gio,`type="time" ${dis}`)}</div>
   <div class="two">${inp("f7Tr","Lệnh / BTP vừa chạy",d.truoc,dis)}${inp("f7Sau","Lệnh / BTP sẽ chạy (nếu có)",d.sau,dis)}</div>
   <div class="two"><label>Loại vệ sinh<select id="f7L" ${dis}>${["Quét dọn","Không xúc máy","Xúc máy"].map(x=>`<option${x===d.loai?" selected":""}>${x}</option>`).join("")}</select></label>${inp("f7Dm","Dung môi tráng",d.dungMoi,dis)}</div>
   ${inp("f7Bot","Loại bột tráng (nếu có)",d.bot,dis)}
   <b style="display:block;margin-top:8px">Đánh giá vệ sinh từng bộ phận</b><div class="dgx"><table><thead><tr><th>Bộ phận</th><th>Đã thực hiện</th><th>Đánh giá</th></tr></thead><tbody id="f7T">${rows()}</tbody></table></div>
   ${inp("f7Gc","Ghi chú",d.ghiChu,dis)}<label>Nhận xét / kết quả <small class="note">(QC)</small>${DD("f7KL",kl,canW&&qc?"":"disabled")}</label>
   ${p?`<p class="note">Lưu lần cuối: ${esc(p.nguoi)} · ${esc(p.luc)}</p>`:""}<div class="actions">${B().btn4(canW,!!p)}</div>`);
  w.querySelectorAll("[data-th]").forEach(x=>x.onchange=()=>{d.parts[+x.dataset.th].th=x.checked?1:0});w.querySelectorAll("[data-dg]").forEach(x=>x.onchange=()=>{d.parts[+x.dataset.dg].dg=x.value;const e=x.nextElementSibling;if(e){e.style.display=x.value==="Không đạt"?"":"none";if(x.value==="Không đạt")e.focus()}});w.querySelectorAll("[data-ly]").forEach(x=>x.oninput=()=>{d.parts[+x.dataset.ly].ly=x.value});
  const g=()=>Object.assign(d,{maMay:$("f7Ma").value.trim(),mayTen:$("f7Ten").value.trim(),ngay:$("f7Ngay").value,gio:$("f7Gio").value,truoc:$("f7Tr").value.trim(),sau:$("f7Sau").value.trim(),loai:$("f7L").value,dungMoi:$("f7Dm").value.trim(),bot:$("f7Bot").value.trim(),ghiChu:$("f7Gc").value.trim()});
  B().btnWire(w,{canW,saved:!!p,dirty:false},async()=>{g();kl=$("f7KL").value;const mi=d.parts.findIndex(x=>x.dg==="Không đạt"&&!String(x.ly||"").trim());if(mi>=0){toast("Ghi lỗi / lý do cho bộ phận Không đạt.");const x=w.querySelector('[data-ly="'+mi+'"]');if(x)x.focus();return false}p=p||{};p.d=JSON.parse(JSON.stringify(d));await save(D,"BM07",p,p.d,d.ngay,kl)},()=>{g();p07(d,$("f7KL").value)})}
function p07(d,kl){const K=B(),sp=so=>{const o=S.lenh.find(x=>x.so===so);if(!o)return esc(so||"");const it=itemBy(o.maSP);return `<b>${esc(it?it.ten:o.maSP)}</b><br>Lệnh: ${esc(so)}`};
  K.pr(`${K.PCSS}<style>.pq .tin .lb{background:#fafafa}.pq td,.pq th{padding:4px 7px}.pq .sg .nm{height:18mm}</style><div class="pq">${K.head("BIÊN BẢN VỆ SINH<br>THIẾT BỊ ĐÓNG GÓI",META("BM.07-QC-QT.04"))}
  <table class="tin" style="margin-top:8px"><colgroup><col style="width:19%"><col style="width:31%"><col style="width:19%"><col style="width:31%"></colgroup>
   <tr><td class="lb">Tên máy</td><td><b>${esc(d.mayTen)}</b></td><td class="lb">Mã máy</td><td><b>${esc(d.maMay)}</b></td></tr>
   <tr><td class="lb">Ngày thực hiện</td><td><b>${dmy(d.ngay)}</b></td><td class="lb">Thời gian thực hiện</td><td><b>${esc(d.gio)}</b></td></tr>
   <tr><td class="lb">Tên BTP vừa chạy</td><td>${sp(d.truoc)}</td><td class="lb">Tên BTP sẽ chạy (nếu có)</td><td>${d.sau?sp(d.sau):""}</td></tr></table>
  <p style="margin:10px 0 4px"><b>Thao tác thực hiện:</b></p>
  <table><colgroup><col style="width:34%"><col style="width:22%"><col style="width:22%"><col style="width:22%"></colgroup>
   <tr><th>Công việc thực hiện</th><th>Quét dọn</th><th>Không xúc máy</th><th>Xúc máy</th></tr>
   <tr><td>Loại vệ sinh</td>${["Quét dọn","Không xúc máy","Xúc máy"].map(x=>`<td class="c">${K.box(d.loai===x)}</td>`).join("")}</tr>
   <tr><td>Loại dung môi tráng</td><td colspan="3">${esc(d.dungMoi)}</td></tr><tr><td>Loại bột tráng</td><td colspan="3">${esc(d.bot)}</td></tr></table>
  <p style="margin:10px 0 4px"><b>Đánh giá vệ sinh:</b></p>
  <table><colgroup><col style="width:7%"><col style="width:27%"><col style="width:11%"><col style="width:11%"><col style="width:9%"><col style="width:10%"><col style="width:25%"></colgroup>
   <tr><th rowspan="2">STT</th><th rowspan="2">Các bộ phận</th><th rowspan="2">Đã thực hiện</th><th rowspan="2">Không thực hiện</th><th colspan="2">Đánh giá</th><th rowspan="2">Lỗi / lý do</th></tr><tr><th>Đạt</th><th>Không đạt</th></tr>
   ${d.parts.map((x,i)=>`<tr><td class="c">${i+1}</td><td>${esc(x.t)}</td><td class="c">${x.th?"✓":""}</td><td class="c">${x.th?"":"X"}</td><td class="c">${x.dg==="Đạt"?"✓":""}</td><td class="c">${x.dg==="Không đạt"?"✓":""}</td><td style="font-size:10.5pt">${x.dg==="Không đạt"?esc(x.ly||""):""}</td></tr>`).join("")}</table>
  <p><b>Ghi chú:</b> ${esc(d.ghiChu||"")}</p>
  <table><colgroup><col style="width:30%"><col style="width:70%"></colgroup><tr><td><b>Nhận xét</b></td><td>${K.box(kl==="Đạt")} ĐẠT &nbsp;&nbsp;&nbsp; ${K.box(kl==="Không đạt")} KHÔNG ĐẠT</td></tr></table>
  ${K.sign([["Nhân viên thực hiện",""],["Nhân viên QC",""]])}</div>`)}

/* ---------- Tab "Biểu mẫu QC" trong Lệnh đóng gói: BM.02 + BM.08 theo ngày ---------- */
function dgRowsOn(day){const L=[];(S.lenh||[]).forEach(o=>{if(!dgIsTP(o))return;if(o.trangThai==="Đã huỷ"||/\(huỷ/.test(o.so))return;
  const P=(S.dg&&S.dg.lenh||{})[o.so];if(!P)return;const X=P.x||{},bd=X.ngayBD||o.ngay,ht=o.trangThai==="Hoàn thành"?(o.ngayHT||X.ngayHT):"";if(bd>day)return;if(ht&&ht<day)return;L.push({o,P,X,q:(S.dgQ||{})[P.qc]||{}})});return L}
window.dgfTab=async function(box){const day=S.dgfDay||S.today;
  box.insertAdjacentHTML("beforeend",`<div class="tools" style="margin-top:8px"><label style="display:flex;gap:8px;align-items:center">Ngày<input type="date" id="dgfDay" value="${esc(day)}"></label><button class="btn" type="button" id="dgf02">In BM.02 – Kế hoạch kiểm tra hằng ngày</button><button class="btn" type="button" id="dgf08">In BM.08 – Báo cáo chất lượng thành phẩm</button></div><div id="dgfList"><p class="note">Đang tải…</p></div>
   <p class="note">BM.02 lấy các lệnh đóng gói đang chạy trong ngày; BM.08 lấy các lệnh hoàn thành trong ngày, đánh giá theo kết luận phiếu kiểm tra quá trình (BM.04/BM.06). Phiếu BM.05, BM.04/06, BM.07 lập trong từng lệnh đóng gói.</p>`);
  $("dgfDay").onchange=e=>{S.dgfDay=e.target.value||S.today;if(window.dgListRender)dgListRender()};
  let F=[];try{F=await api("webDGFAll",S.auth,"","")}catch(e){}
  const L=dgRowsOn(day),fs=so=>F.filter(x=>x.so===so);
  const el=$("dgfList");if(!el)return;
  el.innerHTML=L.length?`<div class="list">${L.map(r=>{const f=fs(r.o.so),has=t=>f.some(x=>x.loai===t);return `<div class="row"><div class="name"><span class="code">${esc(r.o.so)}</span>${esc(r.q.sp||(itemBy(r.o.maSP)||{}).ten||r.o.maSP)} · ${esc(r.q.quyCach||"")}</div><div class="kg"><small>${["BM05","BM04","BM06","BM07"].filter(has).map(t=>"BM."+t.slice(2)).join(" · ")||"chưa có phiếu"}</small></div></div>`}).join("")}</div>`:'<div class="empty">Không có lệnh đóng gói trong ngày này.</div>';
  $("dgf02").onclick=()=>p02(day,L,F);$("dgf08").onclick=()=>p08(day,L.filter(r=>r.o.trangThai==="Hoàn thành"&&(r.o.ngayHT||r.X.ngayHT)===day),F)};
function klOf(F,so){const k=F.filter(x=>x.so===so&&(x.loai==="BM04"||x.loai==="BM06"));if(!k.length)return"";return k.some(x=>x.kl==="Không đạt")?"Fail":k.every(x=>x.kl==="Đạt")?"Pass":""}
function p02(day,L,F){const K=B(),may=so=>{const x=F.filter(f=>f.so===so&&f.may).pop();return x?(x.maMay||x.may):""};
  K.pr(`${K.PCSS}<style>.pq{font-size:9.5pt}.pq td,.pq th{padding:3px 3px;font-size:9pt}</style><div class="pq">${K.head("KẾ HOẠCH KIỂM TRA HẰNG NGÀY<br>"+dmy(day),META("BM.02-QC-QT.04"))}
  <table style="margin-top:6px"><tr><th rowspan="2">Người phụ trách</th><th rowspan="2">Thiết bị</th><th rowspan="2">Mã ĐH</th><th rowspan="2">Sản phẩm</th><th rowspan="2">Nhà phân phối</th><th rowspan="2">NSX</th><th rowspan="2">Định lượng (g/ml)</th><th rowspan="2">Quy cách</th><th rowspan="2">SL YC</th><th rowspan="2">Số lô in/dập</th><th rowspan="2">SL đã SX</th><th rowspan="2">Tại khu vực tập kết</th><th colspan="3">Thực tế</th><th rowspan="2">Lô BTP</th><th rowspan="2">Ghi chú</th><th rowspan="2">Biểu mẫu sử dụng</th></tr><tr><th>Bắt đầu</th><th>Kết thúc</th><th>SL</th></tr>
  ${L.map(r=>{const o=r.o,q=r.q,ht=o.trangThai==="Hoàn thành",it=itemBy(o.maSP)||{};return `<tr><td>${esc(r.X.nvh||"")}</td><td>${esc(may(o.so))}</td><td>${esc(o.so)}</td><td>${esc(q.sp||it.ten||o.maSP)}</td><td>${esc(q.pp||o.khachHang||"")}</td><td>${r.X.ngayBD?dmy(r.X.ngayBD):""}</td><td class="c">${esc(q.luong?q.luong+" "+(q.dvl||""):"")}</td><td>${esc(q.quyCach||"")}</td><td class="r">${esc(String(o.slDuKien||""))}</td><td>${esc(r.X.loTP||o.so)}</td><td class="r">${ht?esc(String(o.slThucTe||"")):""}</td><td></td><td>${r.X.ngayBD?dmy(r.X.ngayBD):""}</td><td>${ht&&o.ngayHT?dmy(o.ngayHT):""}</td><td class="r">${ht?esc(String(o.slThucTe||"")):""}</td><td>${esc((r.P.btp||[]).map(b=>b.lo).join(", "))}</td><td>${esc(o.ghiChu||"")}</td><td>${isGoi(q)?"BM.04":"BM.06"}, BM.05, BM.07</td></tr>`}).join("")||'<tr><td colspan="18" class="c"><i>Không có lệnh đóng gói trong ngày</i></td></tr>'}
  <tr class="sec"><td colspan="18">THỦ CÔNG</td></tr><tr><td colspan="18" style="height:22px"></td></tr>
  <tr class="sec"><td colspan="18">THÀNH PHẨM TẬP KẾT TẠI KHU VỰC THÀNH PHẨM MÀ KHÔNG CÓ TRONG KẾ HOẠCH SẢN XUẤT</td></tr><tr><td colspan="18" style="height:22px"></td></tr></table></div>`,true)}
function p08(day,L,F){const K=B(),m=/^(\d{4})-(\d{2})-(\d{2})/.exec(day);
  K.pr(`${K.PCSS}<style>.pq td,.pq th{font-size:11pt;padding:4px 4px}</style><div class="pq">${K.head("PHIẾU BÁO CÁO CHẤT LƯỢNG THÀNH PHẨM",META("BM.08-QC-QT.04"))}
  <table style="margin-top:8px"><colgroup><col style="width:6%"><col style="width:22%"><col style="width:14%"><col style="width:13%"><col style="width:10%"><col style="width:11%"><col style="width:10%"><col style="width:8%"><col style="width:6%"></colgroup>
   <tr><th>STT</th><th>Tên sản phẩm</th><th>Mã nhãn</th><th>NSX</th><th>Định lượng (gr-ml)</th><th>Quy cách</th><th>Số lượng</th><th>Đánh giá</th><th>Ghi chú</th></tr>
   ${L.map((r,i)=>{const o=r.o,q=r.q,it=itemBy(o.maSP)||{};return `<tr><td class="c">${i+1}</td><td>${esc(q.sp||it.ten||o.maSP)}</td><td>${esc(q.nhan||r.P.qc||"")}</td><td class="c">${o.ngayHT?dmy(o.ngayHT):""}</td><td class="c">${esc(q.luong?q.luong+" "+(q.dvl||""):"")}</td><td>${esc(q.quyCach||"")}</td><td class="r">${esc(String(o.slThucTe||""))} ${esc(it.donVi||"")}</td><td class="c">${klOf(F,o.so)}</td><td></td></tr>`}).join("")||'<tr><td colspan="9" class="c"><i>Không có lệnh hoàn thành trong ngày</i></td></tr>'}</table>
  <p style="text-align:right;margin:14px 0 0;font-style:italic">Tây Ninh, ngày ${m?m[3]:"……"} tháng ${m?m[2]:"……"} năm ${m?m[1]:"……"}</p>
  <table class="sg"><tr><td style="width:50%"></td><td><b>Nhân viên QC</b><br><i>(Ký và ghi rõ họ tên)</i></td></tr><tr><td></td><td class="nm"></td></tr></table></div>`)}
})();
