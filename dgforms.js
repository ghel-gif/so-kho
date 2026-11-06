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
const tick=v=>v==="Đạt"?"☑":v==="Không đạt"?"☒":v==="Không kiểm"?"—":"";
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

/* Thiết bị đóng gói, chiết rót, seal, in date, cân… theo Bản thuyết minh điều kiện SX (mục 4.1–4.3 và thiết bị phụ trợ). n: R rắn, L lỏng, G gói, * dùng chung */
const TB_DG=[{"ma": "AHK-07", "ten": "Máy đóng gói tự động dạng hạt, bột, cốm", "n": "R"}, {"ma": "AHK-23", "ten": "Máy đóng gói bán tự động dạng bột, hạt, cốm", "n": "R"}, {"ma": "AHK-24", "ten": "Máy đóng gói bán tự động dạng hạt, bột, cốm", "n": "R"}, {"ma": "AHK-25", "ten": "Máy đóng gói bán tự động dạng hạt, bột, cốm", "n": "R"}, {"ma": "AHK-01", "ten": "Máy chiết rót tự động 12 vòi", "n": "L"}, {"ma": "AHK-02", "ten": "Máy chiết rót tự động 12 vòi", "n": "L"}, {"ma": "AHK-26", "ten": "Máy chiết rót bán tự động 6 vòi", "n": "L"}, {"ma": "AHK-81", "ten": "Máy chiết rót 2 vòi", "n": "L"}, {"ma": "AHK-40", "ten": "Máy chiết rót 2 vòi", "n": "L"}, {"ma": "AHK-46", "ten": "Máy chiết rót 6 vòi", "n": "L"}, {"ma": "AHK-47", "ten": "Máy chiết rót 6 vòi", "n": "L"}, {"ma": "AHK-48", "ten": "Máy chiết rót 2 vòi", "n": "L"}, {"ma": "AHK-49", "ten": "Máy chiết rót 2 vòi", "n": "L"}, {"ma": "AHK-03", "ten": "Máy đóng gói dạng lỏng tự động", "n": "LG"}, {"ma": "AHK-04", "ten": "Máy đóng gói dạng lỏng tự động", "n": "LG"}, {"ma": "AHK-05", "ten": "Máy đóng gói dạng lỏng tự động", "n": "LG"}, {"ma": "AHK-27", "ten": "Máy seal nắp chai tự động", "n": "L"}, {"ma": "AHK-28", "ten": "Máy seal nắp chai tự động", "n": "L"}, {"ma": "AHK-29", "ten": "Máy seal nắp chai tự động", "n": "L"}, {"ma": "AHK-52", "ten": "Máy seal GLF-1800", "n": "L"}, {"ma": "AHK-53", "ten": "Máy hàn miệng túi liên tục", "n": "G"}, {"ma": "AHK-54", "ten": "Máy hàn miệng túi liên tục", "n": "G"}, {"ma": "AHK-55", "ten": "Máy hàn miệng túi liên tục", "n": "G"}, {"ma": "AHK-56", "ten": "Máy hàn miệng túi liên tục - dạng đứng", "n": "G"}, {"ma": "AHK-57", "ten": "Máy sang cuộn", "n": "*"}, {"ma": "AHK-32", "ten": "Máy đai thùng", "n": "*"}, {"ma": "AHK-33", "ten": "Máy đai thùng", "n": "*"}, {"ma": "AHK-30", "ten": "Máy đóng date tự động", "n": "*"}, {"ma": "AHK-31", "ten": "Máy đóng date tự động", "n": "*"}, {"ma": "AHK-10", "ten": "Máy dán nhãn tự động", "n": "L"}, {"ma": "AHK-58", "ten": "Máy dán nhãn chai tròn tự động", "n": "L"}, {"ma": "AHK-59", "ten": "Cân sàn điện tử 2000kg (Marcus)", "n": "*"}, {"ma": "AHK-67", "ten": "Cân sàn điện tử 2000kg (TPS)", "n": "*"}, {"ma": "AHK-60", "ten": "Cân điện tử 100kg (Marcus)", "n": "*"}, {"ma": "AHK-61", "ten": "Cân điện tử 60kg (Marcus)", "n": "*"}, {"ma": "AHK-62", "ten": "Cân điện tử 50kg", "n": "*"}, {"ma": "AHK-63", "ten": "Cân điện tử 40kg (ACS)", "n": "*"}, {"ma": "AHK-64", "ten": "Cân điện tử 3kg (Marcus)", "n": "*"}, {"ma": "AHK-65", "ten": "Cân điện tử 3kg (Marcus)", "n": "*"}, {"ma": "AHK-66", "ten": "Cân điện tử 3kg (Marcus)", "n": "*"}, {"ma": "AHK-82", "ten": "Cân điện tử 3kg (Vibra)", "n": "*"}, {"ma": "AHK-83", "ten": "Cân điện tử 3kg (Vibra)", "n": "*"}];
const TAY="Chiết tay / đóng tay (thủ công)";
const fold=t=>String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/gi,"d").toLowerCase();
function mayPick(P,dis){return dis?"":`<div class="kh-bar" style="margin-top:4px"><input type="search" id="${P}Q" placeholder="🔍 Tìm thiết bị theo mã hoặc tên (VD: AHK-01, chiết rót, seal, cân)…" autocomplete="off"><button class="btn small" type="button" id="${P}Tay">Chiết tay / đóng tay</button><button class="btn small" type="button" id="${P}Clr">Xoá chọn</button></div><div class="kh-pick" id="${P}L"></div>`}
function mayBind(P,D,idMa,idTen){const q=$(P+"Q");if(!q)return;const goi=isGoi(D.q),liq=liqOf(D.q),M=$(idMa),T=$(idTen);
  const all=TB_DG.concat((D.may||[]).filter(m=>!TB_DG.some(x=>x.ma===m.ma)).map(m=>({ma:m.ma,ten:m.ten,n:"*"})));
  const fit=m=>m.n==="*"||(goi?/G|R/.test(m.n)&&!(liq&&m.n==="R"):/L/.test(m.n)&&m.n!=="G");
  const sp=v=>String(v||"").split(/\s*[,;]\s*/).filter(Boolean);
  const draw=()=>{const k=fold(q.value).trim(),have=sp(M.value),L=all.filter(m=>!have.includes(m.ma)&&(k?k.split(/\s+/).every(w=>fold(m.ma+" "+m.ten).includes(w)):fit(m))).slice(0,16);
    $(P+"L").innerHTML=L.map(m=>`<button type="button" class="kh-pk" data-ma="${esc(m.ma)}"><b>${esc(m.ma)}</b> ${esc(m.ten)}</button>`).join("")||'<span class="note">Không thấy thiết bị phù hợp — gõ tay vào ô mã / tên.</span>';
    $(P+"L").querySelectorAll("[data-ma]").forEach(b=>b.onclick=()=>{const m=all.find(x=>x.ma===b.dataset.ma);if(T.value===TAY){T.value="";M.value=""}
      M.value=sp(M.value).concat([m.ma]).join(", ");const tn=sp(T.value.replace(/;/g,","));if(!tn.includes(m.ten))T.value=(T.value?T.value+"; ":"")+m.ten;
      q.value="";M.dispatchEvent(new Event("input",{bubbles:true}));draw()})};
  q.oninput=draw;draw();
  $(P+"Tay").onclick=()=>{M.value="";T.value=TAY;M.dispatchEvent(new Event("input",{bubbles:true}));draw()};
  $(P+"Clr").onclick=()=>{M.value="";T.value="";M.dispatchEvent(new Event("input",{bubbles:true}));draw()}}
/* ---------- BM.05 Phiếu thông tin đóng gói thành phẩm ---------- */
const BB_LOAI=["Chai có nhãn, không nắp","Chai không nhãn, không nắp","Chai có nhãn, có nắp","Gói thuốc"];
function f05(D,p){const I=info(D),TK=isGoi(I.q)?"BM05G":"BM05C",d=Object.assign({ngay:today(),maMay:"",mayTen:"",nhietDo:"",tocDo:"",seal:"",nhietEp:"",tlThuoc:+I.q.tl>0?+I.q.tl:isFinite(I.thuoc)?Math.round(I.thuoc*10)/10:"",ds:+I.q.ds>0?+I.q.ds:"",tMin:+I.q.tl>0&&+I.q.ds>0?Math.round((I.q.tl-I.q.ds)*100)/100:"",tMax:+I.q.tl>0&&+I.q.ds>0?Math.round((+I.q.tl+ +I.q.ds)*100)/100:"",loaiBB:isGoi(I.q)?"Gói thuốc":"Chai có nhãn, không nắp",klBB:+I.q.klBB>0?+I.q.klBB:"",dvThung:I.q.dvThung||"",dvHop:+I.q.dvHop>0?+I.q.dvHop:"",hopThung:+I.q.dvHop>0&&+I.q.dvThung>0?Math.round(I.q.dvThung/I.q.dvHop*100)/100:"",tyTrong:I.tt?I.tt:"",thungPallet:"",lop:"",thungLop:"",mangCo:"",klThung:"",bangKeo:"",ghiChu:""},p?p.d:{}),canW=can.phieu(),dis=canW?"":"disabled";
  d.tb=tbInit(TK,d);
  const w=dlg(`<h2>Phiếu thông tin đóng gói thành phẩm (BM.05) · ${esc(I.o.so)}</h2><p class="note">${esc(I.tenSP)} · mã ${esc(I.maSP)} · BTP ${esc(I.b.lo||"")}${I.tt?" · tỷ trọng "+String(I.tt).replace(".",","):""}. Trọng lượng thuốc chuẩn tự tính từ định lượng ${esc(I.q.luong||"")} ${esc(I.q.dvl||"")}${I.liq?" × tỷ trọng":""}, sửa được.</p>
   <div class="two">${inp("f5Ngay","Ngày lập phiếu",d.ngay,`type="date" ${dis}`)}<span></span></div>
   <b style="display:block;margin-top:8px">Thiết bị sản xuất chính</b>${tbHtml(TK,D,d.tb,dis)}
   <b style="display:block;margin-top:8px">Thông số máy (tham khảo)</b>
   <div class="two">${inp("f5Nd","Nhiệt độ cài đặt",d.nhietDo,dis)}${inp("f5Td","Tốc độ băng tải",d.tocDo,dis)}</div><div class="two">${inp("f5Seal","Seal",d.seal,dis)}${inp("f5Ep","Nhiệt ép",d.nhietEp,dis)}</div>
   <b style="display:block;margin-top:8px">Trọng lượng</b>
   <div class="three" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">${inp("f5Tl","TL thuốc chuẩn (g)",d.tlThuoc,`type="number" step="any" ${dis}`)}${inp("f5Lo","Cận dưới (g)",d.tMin!==undefined&&d.tMin!==""?d.tMin:(num(d.ds)>0?Math.round((num(d.tlThuoc)-num(d.ds))*100)/100:""),`type="number" step="any" ${dis}`)}${inp("f5Hi","Cận trên (g)",d.tMax!==undefined&&d.tMax!==""?d.tMax:(num(d.ds)>0?Math.round((num(d.tlThuoc)+num(d.ds))*100)/100:""),`type="number" step="any" ${dis}`)}</div>
   ${I.liq||d.tyTrong?`<div class="two">${inp("f5Tt","Tỷ trọng BTP (g/ml)",d.tyTrong,`type="number" step="any" ${dis}`)}<span></span></div>`:""}
   <div class="two"><label>Loại bao bì tính khối lượng<select id="f5Lbb" ${dis}>${BB_LOAI.map(x=>`<option${x===d.loaiBB?" selected":""}>${x}</option>`).join("")}</select></label>${inp("f5Kbb","Khối lượng bao bì (g)",d.klBB,`type="number" step="any" ${dis}`)}</div>
   <b style="display:block;margin-top:8px">Quy cách đóng gói</b>
   <div class="two">${inp("f5Dvh",(isGoi(I.q)?"Gói":"Chai")+" / hộp (bỏ trống nếu không có hộp)",d.dvHop,`type="number" ${dis}`)}${inp("f5Ht","Hộp / thùng carton lớn",d.hopThung,`type="number" ${dis}`)}</div>
   <div class="two">${inp("f5Dvt",(isGoi(I.q)?"Gói":"Chai")+" / thùng carton lớn",d.dvThung,`type="number" ${dis}`)}${inp("f5Kt","Khối lượng thùng carton (kg, gồm tấm lót)",d.klThung,`type="number" step="any" ${dis}`)}</div>
   <div class="two">${inp("f5Tp","Thùng / pallet",d.thungPallet,`type="number" ${dis}`)}<label>Pallet quấn màng co<select id="f5Mc" ${dis}><option value=""></option>${["Có","Không"].map(x=>`<option${x===d.mangCo?" selected":""}>${x}</option>`).join("")}</select></label></div>
   <div class="two">${inp("f5Lop","Số lớp / pallet",d.lop,`type="number" ${dis}`)}${inp("f5Tl2","Số thùng / lớp",d.thungLop,`type="number" ${dis}`)}</div>
   <label>Thùng carton kéo băng keo<select id="f5Bk" ${dis}><option value=""></option>${["logo Asata","logo khách","không thông tin"].map(x=>`<option${x===d.bangKeo?" selected":""}>${x}</option>`).join("")}</select></label>
   ${inp("f5Gc","Ghi chú",d.ghiChu,dis)}<p class="note" id="f5Sum"></p>
   ${p?`<p class="note">Lưu lần cuối: ${esc(p.nguoi)} · ${esc(p.luc)}</p>`:""}<div class="actions">${B().btn4(canW,!!p)}</div>`);
  const g=()=>{const tb=tbRead(TK,D,w,d.tb);return {tb,maMay:tb.map(t=>t.ma).filter(Boolean).join(", "),mayTen:tb.map(t=>t.ten).filter(Boolean).join("; "),ngay:$("f5Ngay").value,nhietDo:$("f5Nd").value.trim(),tocDo:$("f5Td").value.trim(),seal:$("f5Seal").value.trim(),nhietEp:$("f5Ep").value.trim(),tlThuoc:$("f5Tl").value,tMin:$("f5Lo").value,tMax:$("f5Hi").value,loaiBB:$("f5Lbb").value,klBB:$("f5Kbb").value,dvThung:$("f5Dvt").value,dvHop:$("f5Dvh").value,hopThung:$("f5Ht").value,tyTrong:$("f5Tt")?$("f5Tt").value:(d.tyTrong||""),thungPallet:$("f5Tp").value,lop:$("f5Lop").value,thungLop:$("f5Tl2").value,mangCo:$("f5Mc").value,klThung:$("f5Kt").value,bangKeo:$("f5Bk").value,ghiChu:$("f5Gc").value.trim()}};
  const sum=()=>{const c=c05(g());$("f5Sum").innerHTML=isFinite(c.t)?`Thuốc ${f2(c.t)} g (${f2(c.tMin)} – ${f2(c.tMax)}) · nguyên ${isGoi(I.q)?"gói":"chai"} ${f2(c.n)} g (${f2(c.nMin)} – ${f2(c.nMax)})${isFinite(c.th)?` · thùng ${f2(c.thMin)} – ${f2(c.thMax)} kg`:""}`:""};
  w.addEventListener("input",e=>{if(e.target&&(e.target.id==="f5Dvh"||e.target.id==="f5Dvt")){const h=num($("f5Dvh").value),t=num($("f5Dvt").value);if(h>0&&t>0)$("f5Ht").value=Math.round(t/h*100)/100}sum()});sum();
  B().btnWire(w,{canW,saved:!!p,dirty:false},async()=>{const d=g();p=p||{};p.d=d;await save(D,"BM05",p,d,d.ngay,"");D.forms=(D.forms||[]).filter(x=>x.loai!=="BM05").concat([Object.assign({loai:"BM05",id:p._id},p)])},()=>p05(I,g()))}
function c05(d){const t=num(d.tlThuoc),ds=num(d.ds)||0,bb=num(d.klBB)||0,n=t+bb,kt0=num(d.klThung),k=isFinite(kt0)?num(d.dvThung):NaN,kt=isFinite(kt0)?kt0:0;
  let lo=num(d.tMin),hi=num(d.tMax);if(!isFinite(lo))lo=t-ds;if(!isFinite(hi))hi=t+ds;
  return {t,tMin:lo,tMax:hi,n,nMin:lo+bb,nMax:hi+bb,th:k?n*k/1000+kt:NaN,thMin:k?(lo+bb)*k/1000+kt:NaN,thMax:k?(hi+bb)*k/1000+kt:NaN}}
const fw=v=>isFinite(v)?String(Math.round(v*100)/100).replace(/^(-?\d+)$/,"$1.0"):"……";
function p05(I,d){const c=c05(d),K=B(),bx=v=>K.box(v),u=isGoi(I.q)?"GÓI":"CHAI";
  K.pr(`${K.PCSS}<style>.pq .t3 td{vertical-align:top;font-size:11.5pt;line-height:1.5}.pq .t3 th{font-size:11.5pt}.pq .klc{font-size:15pt;line-height:1.4;margin-bottom:3px}.pq .klc b{font-size:20pt;white-space:nowrap}.pq .hd .lg img{height:17mm}.pq .t3 td{line-height:1.35}.pq .gc{font-size:10.5pt;line-height:1.3}.pq .ds{display:inline-block;margin:0 5mm}.pq .qcd{font-size:13pt;line-height:1.45}.pq .qcd b{font-size:16pt}.pq .sg{margin-top:8px}.pq .sg .nm{height:15mm}</style><div class="pq">${K.head("PHIẾU THÔNG TIN ĐÓNG GÓI<br>THÀNH PHẨM",META("BM.05-QC-QT.04"))}
  <p style="margin:8px 0">Ngày lập phiếu: <b>${dmy(d.ngay)}</b> &nbsp;&nbsp; Lệnh đóng gói: <b>${esc(I.o.so)}</b> &nbsp;&nbsp; Thiết bị SX chính: <b>${esc(d.mayTen||"……")}</b>${d.maMay?" (mã "+esc(d.maMay)+")":""}</p>
  <table class="t3"><colgroup><col style="width:21%"><col style="width:47%"><col style="width:32%"></colgroup>
   <tr><td colspan="2">Tên sản phẩm: <b>${esc(I.tenSP)}</b></td><td>Mã sản phẩm: <b>${esc(I.maSP)}</b></td></tr>
   <tr><th>THÔNG SỐ MÁY</th><th>TRỌNG LƯỢNG ${u}/GÓI THUỐC (gr)</th><th>QUY CÁCH ĐÓNG GÓI</th></tr>
   <tr><td><div class="qcd">${(()=>{const T=[["Nhiệt độ cài đặt",d.nhietDo],["Tốc độ băng tải (*)",d.tocDo],["Seal (*)",d.seal],["Nhiệt ép (*)",d.nhietEp]],F=T.filter(t=>t[1]);return (F.length?F.map(t=>`${t[0]}: <b>${esc(t[1])}</b>`):T.map(t=>`${t[0]}: ……`)).join("<br>")})()}</div></td>
    <td><div class="klc">${num(d.tyTrong)>0?`Tỷ trọng BTP: <b>${(+d.tyTrong).toFixed(3).replace(".",",")}</b> g/ml<br>`:""}Trọng lượng của thuốc chuẩn (*): <b>${fw(c.t)} gr</b><br>dung sai: <b>${fw(c.tMin)}</b><span class="ds">–</span><b>${fw(c.tMax)}</b> gr<br>Trọng lượng nguyên ${isGoi(I.q)?"gói thuốc":"chai"} chuẩn (*): <b>${fw(c.n)} gr</b><br>dung sai: <b>${fw(c.nMin)}</b><span class="ds">–</span><b>${fw(c.nMax)}</b> gr</div><div class="gc"><i>Ghi chú:</i><br>${d.loaiBB?`${bx(true)} ${esc(d.loaiBB.toLowerCase())}; KL bao bì: <b>${d.klBB!==""?fw(num(d.klBB)):"……"}</b> gr`:BB_LOAI.map(x=>`${bx(false)} ${x.toLowerCase()}; KL bao bì: …… gr`).join("<br>")}</div></td>
    <td><div class="qcd">${num(d.dvHop)>0?`<b>${esc(d.dvHop)}</b> ${u} / 1 hộp<br><b>${esc(d.hopThung||"……")}</b> hộp / 1 thùng carton lớn<br>`:""}<b>${esc(d.dvThung||"……")}</b> ${u} / 1 thùng carton lớn</div><b>${esc(d.thungPallet||"……")}</b> thùng carton / 1 pallet<br>(số lớp <b>${esc(d.lop||"…")}</b> × số thùng/lớp <b>${esc(d.thungLop||"…")}</b>)<br>Pallet quấn màng co: ${bx(d.mangCo==="Có")} Có ${bx(d.mangCo==="Không")} Không<br>Trọng lượng thùng carton lớn: ${isFinite(c.th)?`<b>${f2(c.thMin)}</b><span class="ds">–</span><b>${f2(c.thMax)}</b>`:"……<span class=\"ds\">–</span>……"} kg<br><i>Ghi chú:</i> KL bao bì thùng carton: ${d.klThung!==""?f2(num(d.klThung)):"……"} kg (đã bao gồm tấm lót thùng)</td></tr>
   <tr><td colspan="3"><b>Thông tin bán thành phẩm</b><br>Tên: ${esc(I.b.ten||"")} &nbsp; NSX: ${I.b.nsx?dmy(String(I.b.nsx).slice(0,10)):""} &nbsp; Số lô SX: <b>${esc(I.b.lo||"")}</b> &nbsp; Tỷ trọng (nếu có): ${num(d.tyTrong)>0?(+d.tyTrong).toFixed(3).replace(".",",")+" g/ml":""}<br><i>(*) Thông số tham khảo, sẽ được điều chỉnh tùy thuộc vào tình hình thực tế</i></td></tr>
   <tr><td colspan="3">Lưu ý: thùng carton kéo bằng băng keo: ${bx(d.bangKeo==="logo Asata")} logo Asata ${bx(d.bangKeo==="logo khách")} logo khách ${bx(d.bangKeo==="không thông tin")} không thông tin${d.ghiChu?"<br>Ghi chú: "+esc(d.ghiChu):""}</td></tr></table>
  ${K.sign([["Người lập phiếu",""],["Nhân viên QC",""],["Phòng R&D",""]])}</div>`,true)}

/* ---------- BM.04 / BM.06 Phiếu kiểm tra quá trình ---------- */
/* Thiết bị theo từng dòng (BM.04 / BM.06): máy chính + máy phụ (in date, máy ép / seal, dán nhãn nếu có) */
const TBV={BM04:[["chinh","Thiết bị đóng gói chính",m=>m.n==="R"||m.n==="LG",1],["date","Máy in date",m=>/date/i.test(m.ten)],["ep","Máy ép / hàn miệng túi (nếu có)",m=>/hàn miệng|ép|seal/i.test(m.ten)&&m.n!=="L"]],
  BM06:[["chinh","Máy chiết rót chính",m=>/chiết/i.test(m.ten),1],["seal","Máy seal nắp (nếu có)",m=>/seal/i.test(m.ten)],["date","Máy in date",m=>/date/i.test(m.ten)],["nhan","Máy dán nhãn (nếu có)",m=>/dán nhãn/i.test(m.ten)]]};
TBV.BM05G=[TBV.BM04[0]];TBV.BM05C=[TBV.BM06[0]];
function tbInit(loai,d){if(Array.isArray(d.tb)&&d.tb.length)return d.tb;const codes=String(d.maMay||"").split(/\s*[,;]\s*/).filter(Boolean);
  return TBV[loai].map(([k,vai,f],i)=>{const m=TB_DG.find(x=>codes.includes(x.ma)&&f(x));if(m)return {k,vai,ma:m.ma,ten:m.ten};if(i===0&&d.mayTen===TAY)return {k,vai,ma:"",ten:TAY};return {k,vai,ma:"",ten:""}})}
function tbHtml(loai,D,tb,dis){const ex=(D.may||[]).filter(m=>!TB_DG.some(x=>x.ma===m.ma));
  return `<div class="dgx"><table><thead><tr><th style="width:38%">Thiết bị</th><th>Mã — tên thiết bị</th></tr></thead><tbody>${TBV[loai].map(([k,vai,f,req],i)=>{const t=tb[i]||{},L=TB_DG.filter(f).concat(ex),cur=t.ten===TAY?"__tay":t.ma;
    return `<tr><td>${esc(vai)}</td><td><select data-tb="${i}" ${dis}><option value="">${req?"— chọn —":"— không dùng —"}</option>${req?`<option value="__tay"${cur==="__tay"?" selected":""}>${TAY}</option>`:""}${L.map(m=>`<option value="${esc(m.ma)}"${m.ma===cur?" selected":""}>${esc(m.ma)} — ${esc(m.ten)}</option>`).join("")}${t.ma&&!L.some(m=>m.ma===t.ma)?`<option value="${esc(t.ma)}" selected>${esc(t.ma)} — ${esc(t.ten)}</option>`:""}</select></td></tr>`}).join("")}</tbody></table></div>`}
function tbRead(loai,D,w,tb){w.querySelectorAll("[data-tb]").forEach(x=>{const i=+x.dataset.tb,[k,vai]=TBV[loai][i],v=x.value,m=TB_DG.concat(D.may||[]).find(y=>y.ma===v);tb[i]={k,vai,ma:v==="__tay"?"":v,ten:v==="__tay"?TAY:m?m.ten:""}});return tb}

const CR={BM04:[["Nhãn phụ, tem",[["np","Nhãn phụ: đúng chủng loại"],["tem","Tem: đúng chủng loại, đúng vị trí"]]],["Nhãn gói",[["ng","Đúng chủng loại"],["han","Đường hàn, cạnh biên, vết xé túi"],["vs","Vệ sinh bao bì"]]],["Mối ép nhiệt",[["ep","Nhiệt độ ép (°C)",1],["dinh","Mối ép dính đều"],["luc","Thử lực không bị bung, xì chảy"]]],["Thùng carton",[["nt","Nhãn dán thùng đúng loại"],["dut","Đủ gói/ thùng"],["duh","Đủ gói/ hộp"]]],["In phun",[["in1","NSX/SL: in đúng"],["in2","In rõ ràng, ngay ngắn trên gói"]]]],
  BM06:[["Nhãn phụ, tem",[["np","Nhãn phụ: đúng chủng loại"],["tem","Tem: đúng chủng loại, dán đúng vị trí"]]],["Nhãn chai",[["nc","Đúng chủng loại"],["phang","Nhãn phẳng, không nhăn, không dùn"],["vs","Vệ sinh bao bì"]]],["Seal",[["seal","Công suất seal (%)",1],["sd","Seal dính đều"]]],["Thùng carton",[["nt","Nhãn dán thùng đúng loại"],["dut","Đủ chai/ thùng"],["coc","Đủ cốc đong/ thùng"]]],["In phun",[["in1","NSX/SL: in đúng"],["in2","In rõ ràng, ngay ngắn trên nhãn"]]]]};
const NS={BM04:10,BM06:12},TEN={BM04:"PHIẾU KIỂM TRA QUÁ TRÌNH<br>ĐÓNG GÓI",BM06:"PHIẾU KIỂM TRA QUÁ TRÌNH<br>ĐÓNG CHAI"};
const RL=["Đầu ca","Sau 2h tiếp theo","Sau 2h tiếp theo","Sau 2h tiếp theo"];
function fKT(D,loai,p){const I=info(D),f5=b05(D),c5=f5?c05(f5.d):{},n=NS[loai],canW=can.phieu(),dis=canW?"":"disabled",qc=S.me&&S.me.qc;
  const d=Object.assign({ngay:today(),ca:"Hành chính",maMay:f5?f5.d.maMay:"",mayTen:f5?f5.d.mayTen:"",cach:"tong",tMin:isFinite(c5.tMin)?Math.round(c5.tMin*100)/100:"",tMax:isFinite(c5.tMax)?Math.round(c5.tMax*100)/100:"",nMin:isFinite(c5.nMin)?Math.round(c5.nMin*100)/100:"",nMax:isFinite(c5.nMax)?Math.round(c5.nMax*100)/100:"",rounds:[{gio:"07:30",c:{},v:{},e:{},kl:[]}],kph:{loi:"",sl:"",kp:"",tg:""}},p?JSON.parse(JSON.stringify(p.d)):{}),crit=CR[loai];
  let kl=p?p.kl:"";d.tb=tbInit(loai,d);
  d.rounds.forEach(r=>{r.e=r.e||{}});
  const sel=(r,k)=>{const R0=d.rounds[r],kd=R0.c[k]==="Không đạt";return `<select data-r="${r}" data-k="${k}" ${dis}><option value=""></option><option${R0.c[k]==="Đạt"?" selected":""}>Đạt</option><option${kd?" selected":""}>Không đạt</option><option${R0.c[k]==="Không kiểm"?" selected":""}>Không kiểm</option></select><input data-r="${r}" data-e="${k}" value="${esc(R0.e[k]||"")}" placeholder="${R0.c[k]==="Không kiểm"?"Lý do không kiểm (nếu có)":"Lỗi / lý do"}" ${dis} style="margin-top:4px;font-size:12.5px;${kd||R0.c[k]==="Không kiểm"?"":"display:none"}">`};
  const lim=()=>d.cach==="thuoc"?[num(d.tMin),num(d.tMax)]:[num(d.nMin),num(d.nMax)];
  const body=()=>{const R=d.rounds,[lo,hi]=lim();
    return `<div class="dgx"><table><thead><tr><th>Tiêu chí / Danh mục</th>${R.map((r,i)=>`<th>${RL[i]||"Lần "+(i+1)}<br><input data-g="${i}" type="time" value="${esc(r.gio||"")}" ${dis} style="width:105px"><label style="display:flex;gap:4px;align-items:center;justify-content:center;font-weight:400;font-size:12.5px;margin-top:4px"><input type="checkbox" data-nk="${i}" ${r.nk?"checked":""} ${dis}>Không kiểm</label>${r.nk?`<input data-nkl="${i}" value="${esc(r.nkLy||"")}" placeholder="Lý do (VD: SX chưa chạy)" ${dis} style="font-size:12px;margin-top:3px;width:140px">`:""}</th>`).join("")}</tr></thead><tbody>
     ${crit.map(([g,items])=>`<tr><td colspan="${R.length+1}" style="background:var(--accent-soft);font-weight:700">${esc(g)}</td></tr>`+items.map(([k,t,isV])=>`<tr><td>${esc(t)}</td>${R.map((r,i)=>r.nk?'<td class="note" style="text-align:center">—</td>':`<td>${isV?`<input data-r="${i}" data-v="${k}" value="${esc(r.v[k]||"")}" ${dis} style="width:80px">`:sel(i,k)}</td>`).join("")}</tr>`).join("")).join("")}
     <tr><td colspan="${R.length+1}" style="background:var(--accent-soft);font-weight:700">Thuốc — ${d.cach==="thuoc"?"trọng lượng thuốc (đã trừ bì, g)":"tổng trọng lượng "+(loai==="BM04"?"gói":"chai")+" (gồm bao bì, g)"}, ${n} mẫu/lần${isFinite(lo)&&isFinite(hi)?` · cho phép ${f2(lo)} – ${f2(hi)} g`:""}</td></tr>
     ${Array.from({length:n},(_,j)=>`<tr><td>Mẫu ${j+1}${loai==="BM06"?" <small class=\"note\">(vòi "+(j+1)+")</small>":""}</td>${R.map((r,i)=>{if(r.nk)return '<td class="note" style="text-align:center">—</td>';const v=num(r.kl[j]),bad=isFinite(v)&&isFinite(lo)&&isFinite(hi)&&(v<lo||v>hi);return `<td><input data-r="${i}" data-s="${j}" type="number" step="any" value="${esc(r.kl[j]??"")}" ${dis} style="width:90px${bad?";border-color:#d93025;background:#fde8e6":""}"></td>`}).join("")}</tr>`).join("")}
     </tbody></table></div>`};
  const w=dlg(`<h2>${loai==="BM04"?"Phiếu kiểm tra quá trình đóng gói (BM.04)":"Phiếu kiểm tra quá trình đóng chai (BM.06)"} · ${esc(I.o.so)}</h2><p class="note">${esc(I.tenSP)} · lô BTP ${esc(I.b.lo||"")}. Tần suất: ${n} mẫu/lần — đầu ca, định kỳ sau mỗi 2 h. ${f5?"Trọng lượng cho phép lấy từ phiếu BM.05.":"Chưa có phiếu BM.05 — nhập trọng lượng cho phép bên dưới."}</p>
   <div class="two">${inp("fkNgay","Ngày đóng gói",d.ngay,`type="date" ${dis}`)}<label>Ca làm việc<select id="fkCa" ${dis}>${(["Hành chính","Tăng ca"].concat(d.ca&&!["Hành chính","Tăng ca"].includes(d.ca)?[d.ca]:[])).map(x=>`<option${x===d.ca?" selected":""}>${esc(x)}</option>`).join("")}</select></label></div>
   <b style="display:block;margin-top:8px">Thiết bị sử dụng</b>${tbHtml(loai,D,d.tb,dis)}
   <label>Cách cân mẫu<select id="fkCach" ${dis}><option value="tong"${d.cach!=="thuoc"?" selected":""}>Cân tổng (gồm bao bì)</option><option value="thuoc"${d.cach==="thuoc"?" selected":""}>Chỉ cân trọng lượng thuốc (đã trừ bì)</option></select></label>
   <div class="two">${inp("fkTmin","TL thuốc cho phép từ (g)",d.tMin,`type="number" step="any" ${dis}`)}${inp("fkTmax","đến (g)",d.tMax,`type="number" step="any" ${dis}`)}</div>
   <div class="two">${inp("fkNmin","Tổng TL gồm bao bì từ (g)",d.nMin,`type="number" step="any" ${dis}`)}${inp("fkNmax","đến (g)",d.nMax,`type="number" step="any" ${dis}`)}</div>
   <div id="fkT">${body()}</div>${canW?`<div class="kh-bar" style="margin-top:6px"><button class="btn small" type="button" id="fkAdd">+ Thêm lần kiểm (sau 2 h)</button><button class="btn small" type="button" id="fkDel">− Bớt lần cuối</button></div>`:""}
   <b style="display:block;margin-top:8px">Sự không phù hợp (nếu có)</b>
   <div class="two">${inp("fkLoi","Lỗi",d.kph.loi,dis)}${inp("fkSl","Số lượng lỗi",d.kph.sl,dis)}</div><div class="two">${inp("fkKp","Sự khắc phục",d.kph.kp,dis)}${inp("fkTg","Thời gian",d.kph.tg,dis)}</div>
   <label>Kết luận <small class="note">(QC)</small>${DD("fkKL",kl,canW&&qc?"":"disabled")}</label>
   ${p?`<p class="note">Lưu lần cuối: ${esc(p.nguoi)} · ${esc(p.luc)}</p>`:""}<div class="actions">${B().btn4(canW,!!p)}</div>`);
  const bind=()=>{w.querySelectorAll("#fkT [data-k]").forEach(x=>x.onchange=()=>{d.rounds[+x.dataset.r].c[x.dataset.k]=x.value;const e=x.nextElementSibling;if(e){e.style.display=x.value==="Không đạt"||x.value==="Không kiểm"?"":"none";e.placeholder=x.value==="Không kiểm"?"Lý do không kiểm (nếu có)":"Lỗi / lý do";if(x.value==="Không đạt")e.focus()}});w.querySelectorAll("#fkT [data-e]").forEach(x=>x.oninput=()=>{d.rounds[+x.dataset.r].e[x.dataset.e]=x.value});
    w.querySelectorAll("#fkT [data-v]").forEach(x=>x.oninput=()=>{d.rounds[+x.dataset.r].v[x.dataset.v]=x.value});
    w.querySelectorAll("#fkT [data-s]").forEach(x=>x.oninput=()=>{d.rounds[+x.dataset.r].kl[+x.dataset.s]=x.value;const v=num(x.value),[lo,hi]=lim(),bad=isFinite(v)&&isFinite(lo)&&isFinite(hi)&&(v<lo||v>hi);x.style.borderColor=bad?"#d93025":"";x.style.background=bad?"#fde8e6":""});
    w.querySelectorAll("#fkT [data-g]").forEach(x=>x.oninput=()=>{d.rounds[+x.dataset.g].gio=x.value});
    w.querySelectorAll("#fkT [data-nk]").forEach(x=>x.onchange=()=>{const r=d.rounds[+x.dataset.nk];r.nk=x.checked;if(r.nk&&!r.nkLy)r.nkLy="SX chưa chạy";rer()});
    w.querySelectorAll("#fkT [data-nkl]").forEach(x=>x.oninput=()=>{d.rounds[+x.dataset.nkl].nkLy=x.value})};bind();
  const rer=()=>{$("fkT").innerHTML=body();bind()};
  ["fkNmin","fkNmax","fkTmin","fkTmax","fkCach"].forEach(id=>$(id).addEventListener("change",()=>{d.nMin=$("fkNmin").value;d.nMax=$("fkNmax").value;d.tMin=$("fkTmin").value;d.tMax=$("fkTmax").value;d.cach=$("fkCach").value;rer()}));
  if(canW){$("fkAdd").onclick=()=>{if(d.rounds.length>=4)return toast("Tối đa 4 lần kiểm / phiếu — lập phiếu mới cho ca sau.");const l=d.rounds[d.rounds.length-1],m=/(\d+):(\d+)/.exec(l.gio||"");d.rounds.push({gio:m?String((+m[1]+2)%24).padStart(2,"0")+":"+m[2]:"",c:{},v:{},e:{},kl:[]});rer()};
    $("fkDel").onclick=()=>{if(d.rounds.length>1){d.rounds.pop();rer()}}}
  const g=()=>{Object.assign(d,{ngay:$("fkNgay").value,ca:$("fkCa").value.trim(),tb:tbRead(loai,D,w,d.tb),cach:$("fkCach").value,tMin:$("fkTmin").value.trim(),tMax:$("fkTmax").value.trim(),nMin:$("fkNmin").value,nMax:$("fkNmax").value,kph:{loi:$("fkLoi").value.trim(),sl:$("fkSl").value.trim(),kp:$("fkKp").value.trim(),tg:$("fkTg").value.trim()}});d.maMay=d.tb.map(t=>t.ma).filter(Boolean).join(", ");d.mayTen=d.tb.map(t=>t.ten).filter(Boolean).join("; ");return d};
  B().btnWire(w,{canW,saved:!!p,dirty:false},async()=>{g();if(!d.tb[0].ten){toast("Chọn "+TBV[loai][0][1].toLowerCase()+".");w.querySelector('[data-tb="0"]').focus();return false}kl=$("fkKL").value;const miss=[];d.rounds.forEach((r,i)=>!r.nk&&Object.keys(r.c).forEach(k=>{if(r.c[k]==="Không đạt"&&!String(r.e[k]||"").trim())miss.push(k)}));if(miss.length){toast("Ghi lỗi / lý do cho các mục Không đạt.");const x=w.querySelector('#fkT [data-e="'+miss[0]+'"]');if(x)x.focus();return false}p=p||{};p.d=JSON.parse(JSON.stringify(d));await save(D,loai,p,p.d,d.ngay,kl)},()=>{g();pKT(I,loai,d,$("fkKL").value)})}
function pKT(I,loai,d,kl){const K=B(),R=d.rounds,n=NS[loai],th=d.cach==="thuoc",lo=num(th?d.tMin:d.nMin),hi=num(th?d.tMax:d.nMax),tlo=num(d.tMin),thi=num(d.tMax),nlo=num(d.nMin),nhi=num(d.nMax),cw=Math.floor(48/Math.max(R.length,1));
  const why=k=>R.map((r,i)=>{if(r.nk)return "";const e=((r.e||{})[k]||"").trim();return e&&(r.c[k]==="Không đạt"||r.c[k]==="Không kiểm")?(R.length>1?(RL[i]==="Đầu ca"?"Đầu ca":"Lần "+(i+1))+": ":"")+e:""}).filter(Boolean).join("; ");
  const rows=CR[loai].map(([g,items])=>`<tr class="sec"><td colspan="${R.length+2}">${esc(g)}</td></tr>`+items.map(([k,t,isV])=>`<tr><td>${esc(t)}</td>${R.map(r=>`<td class="c">${r.nk?"—":isV?esc(r.v[k]||""):tick(r.c[k])}</td>`).join("")}<td style="font-size:9.5pt">${isV?"":esc(why(k))}</td></tr>`).join("")).join("");
  const sw=Math.floor(80/n);
  const klT=`<table class="kl8"><colgroup><col style="width:20%">${Array.from({length:n},()=>`<col style="width:${sw}%">`).join("")}</colgroup><tr><th>Lần kiểm</th>${Array.from({length:n},(_,j)=>`<th>${j+1}</th>`).join("")}</tr>${R.map((r,i)=>`<tr><td>${RL[i]||"Lần "+(i+1)}${r.gio?" ("+esc(r.gio)+")":""}</td>${r.nk?`<td colspan="${n}" class="c"><i>Không kiểm${r.nkLy?" – "+esc(r.nkLy):""}</i></td>`:Array.from({length:n},(_,j)=>{const v=num(r.kl[j]),bad=isFinite(v)&&isFinite(lo)&&isFinite(hi)&&(v<lo||v>hi);return `<td class="c">${isFinite(v)?f2(v)+(bad?"*":""):""}</td>`}).join("")}</tr>`).join("")}</table>`;
  K.pr(`${K.PCSS}<style>.pq{font-size:10.5pt;line-height:1.25}.pq td,.pq th{padding:2px 5px}.pq .hd .lg img{height:16mm}.pq .kl8 td,.pq .kl8 th{font-size:9pt;padding:1px 2px}.pq .sg .nm{height:16mm}.pq .sg{margin-top:6px}</style><div class="pq">${K.head(TEN[loai],META(loai==="BM04"?"BM.04-QC-QT.04":"BM.06-QC-QT.04"))}
  <table style="margin-top:6px"><colgroup><col style="width:50%"><col style="width:50%"></colgroup>
   <tr><td colspan="2">Tên sản phẩm: <b>${esc(I.tenSP)}</b></td></tr>
   <tr><td>Ngày đóng gói: <b>${dmy(d.ngay)}</b>${d.ca?" · Ca: <b>"+esc(d.ca)+"</b>":""}</td><td>Số LĐG: <b>${esc(I.o.so)}</b></td></tr>
   <tr><td>Số lô BTP: <b>${esc(I.b.lo||"")}</b></td><td>Ngày sản xuất: <b>${I.b.nsx?dmy(String(I.b.nsx).slice(0,10)):""}</b></td></tr>
   <tr><td>Trọng lượng thuốc cho phép (g): <b>${isFinite(tlo)?f2(tlo):""}${isFinite(thi)?" – "+f2(thi):""}</b></td><td>Tổng TL (gồm bao bì) (g): <b>${isFinite(nlo)?f2(nlo):""}${isFinite(nhi)?" – "+f2(nhi):""}</b></td></tr>
   ${tbInit(loai,d).filter((t,i)=>i===0||t.ten).map(t=>`<tr><td>${esc(t.vai.replace(/ \(nếu có\)/,""))}: <b>${esc(t.ten)}</b></td><td>Mã thiết bị: <b>${esc(t.ma||(t.ten===TAY?"—":""))}</b></td></tr>`).join("")}
   <tr><td>Tần suất kiểm tra: ${n} mẫu/lần — đầu ca, định kỳ sau mỗi 2 h</td><td>Đạt (☑), không đạt (☒), không kiểm (—)</td></tr></table>
  <table style="margin-top:6px"><colgroup><col style="width:32%">${R.map(()=>`<col style="width:${cw}%">`).join("")}<col style="width:20%"></colgroup><tr><th>Tiêu chí / Danh mục kiểm tra</th>${R.map((r,i)=>`<th>${RL[i]||"Lần "+(i+1)}${r.gio?"<br>"+esc(r.gio):""}${r.nk?`<br><span style="font-weight:400;font-style:italic">Không kiểm${r.nkLy?" – "+esc(r.nkLy):""}</span>`:""}</th>`).join("")}<th>Lỗi / lý do</th></tr>${rows}</table>
  <p style="margin:6px 0 3px"><b>Thuốc:</b> ${th?"trọng lượng thuốc (đã trừ bì) (g)":"tổng trọng lượng "+(loai==="BM04"?"gói":"chai")+" (gồm bao bì) (g)"} — khối lượng từng mẫu${loai==="BM06"?" (mỗi mẫu tương ứng thứ tự 1 vòi thuốc)":""}; (*) ngoài khoảng cho phép</p>${klT}
  <table style="margin-top:6px"><colgroup><col style="width:25%"><col style="width:25%"><col style="width:25%"><col style="width:25%"></colgroup><tr class="sec"><td colspan="4">Sự không phù hợp</td></tr><tr><td>Lỗi (nếu có): ${esc(d.kph.loi)}</td><td>Số lượng lỗi: ${esc(d.kph.sl)}</td><td>Sự khắc phục: ${esc(d.kph.kp)}</td><td>Thời gian: ${esc(d.kph.tg)}</td></tr></table>
  <p style="margin:6px 0"><b>Kết luận:</b> ${K.box(kl==="Đạt")} Đạt &nbsp;&nbsp; ${K.box(kl==="Không đạt")} Không đạt</p>
  ${K.sign([["QLSX - Xác nhận cuối ca",""],["Nhân viên vận hành",""],["Nhân viên QC",""]])}</div>`)}

/* ---------- BM.07 Biên bản vệ sinh thiết bị đóng gói ---------- */
const BP=["Bồn chứa","Đường ống","Máy bơm màng/ Vít tải","Vòi chiết","Mâm hứng","Băng tải","Sàn làm việc"];
function f07(D,p){const kt0=(D.forms||[]).filter(f=>f.loai==="BM04"||f.loai==="BM06").pop()||null;const I=info(D),f5=b05(D),canW=can.phieu(),dis=canW?"":"disabled",qc=S.me&&S.me.qc,now=new Date();
  const d=Object.assign({ngay:today(),gio:String(now.getHours()).padStart(2,"0")+":"+String(now.getMinutes()).padStart(2,"0"),maMay:(kt0||f5||{d:{}}).d.maMay||"",mayTen:(kt0||f5||{d:{}}).d.mayTen||"",truoc:I.o.so,sau:D.sau||"",loai:"Quét dọn",dungMoi:"",bot:"",parts:BP.map(t=>({t,th:0,dg:""})),ghiChu:""},p?JSON.parse(JSON.stringify(p.d)):{});let kl=p?p.kl:"";
  const rows=()=>d.parts.map((x,i)=>`<tr><td>${esc(x.t)}</td><td class="c"><input type="checkbox" data-th="${i}" ${x.th?"checked":""} ${dis}></td><td><select data-dg="${i}" ${dis||(x.th?"":"disabled")} title="${x.th?"":"Tick Đã thực hiện trước"}"><option value=""></option>${["Đạt","Không đạt"].map(v=>`<option${x.dg===v?" selected":""}>${v}</option>`).join("")}</select><input data-ly="${i}" value="${esc(x.ly||"")}" placeholder="Lỗi / lý do" ${dis} style="margin-top:4px;font-size:12.5px;${x.dg==="Không đạt"?"":"display:none"}"></td></tr>`).join("");
  const w=dlg(`<h2>Biên bản vệ sinh thiết bị đóng gói (BM.07) · ${esc(I.o.so)}</h2>
   <div class="two">${inp("f7Ma","Mã máy",d.maMay,dis)}${inp("f7Ten","Tên máy",d.mayTen,dis)}</div>${mayPick("f7P",dis)}
   <div class="two">${inp("f7Ngay","Ngày thực hiện",d.ngay,`type="date" ${dis}`)}${inp("f7Gio","Thời gian thực hiện",d.gio,`type="time" ${dis}`)}</div>
   <div class="two">${inp("f7Tr","Lệnh / BTP vừa chạy",d.truoc,dis)}${inp("f7Sau","Lệnh / BTP sẽ chạy (nếu có)",d.sau,dis)}</div>
   <div class="two"><label>Loại vệ sinh<select id="f7L" ${dis}>${["Quét dọn","Không xúc máy","Xúc máy"].map(x=>`<option${x===d.loai?" selected":""}>${x}</option>`).join("")}</select></label>${inp("f7Dm","Dung môi tráng",d.dungMoi,dis)}</div>
   ${inp("f7Bot","Loại bột tráng (nếu có)",d.bot,dis)}
   <b style="display:block;margin-top:8px">Đánh giá vệ sinh từng bộ phận</b><div class="dgx"><table><thead><tr><th>Bộ phận</th><th>Đã thực hiện</th><th>Đánh giá</th></tr></thead><tbody id="f7T">${rows()}</tbody></table></div>
   ${inp("f7Gc","Ghi chú",d.ghiChu,dis)}<label>Nhận xét / kết quả <small class="note">(QC)</small>${DD("f7KL",kl,canW&&qc?"":"disabled")}</label>
   ${p?`<p class="note">Lưu lần cuối: ${esc(p.nguoi)} · ${esc(p.luc)}</p>`:""}<div class="actions">${B().btn4(canW,!!p)}</div>`);
  mayBind("f7P",D,"f7Ma","f7Ten");
  w.querySelectorAll("[data-th]").forEach(x=>x.onchange=()=>{const i=+x.dataset.th,P=d.parts[i],sel=w.querySelector('[data-dg="'+i+'"]'),ly=w.querySelector('[data-ly="'+i+'"]');P.th=x.checked?1:0;sel.disabled=!x.checked;sel.title=x.checked?"":"Tick Đã thực hiện trước";if(!x.checked){P.dg="";P.ly="";sel.value="";if(ly){ly.value="";ly.style.display="none"}}else sel.focus()});w.querySelectorAll("[data-dg]").forEach(x=>x.onchange=()=>{d.parts[+x.dataset.dg].dg=x.value;const e=x.nextElementSibling;if(e){e.style.display=x.value==="Không đạt"?"":"none";if(x.value==="Không đạt")e.focus()}});w.querySelectorAll("[data-ly]").forEach(x=>x.oninput=()=>{d.parts[+x.dataset.ly].ly=x.value});
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

/* ===== DANH MỤC QUY CÁCH ĐÓNG GÓI: thêm mã nhãn / quy cách mới, sửa thông số (Quản lý, Kế toán) ===== */
/* Mã mới / thông số mới lấy từ phiếu thông tin đóng gói của R&D (thư mục "Lệnh đóng gói 2026") */
const RD_QC=[
 {qc:"FTN-D5",nhan:"FTN-D5",sp:"FENTINAT 48SC",btp:"BTP.FENT.48",quyCach:"gói 18 ml",luong:18,dvl:"ml",loai:"gói",hop:"H50G",dvHop:50,thung:"D-T20-1X360",dvThung:400,nhanPhu:"Không",temChai:"Không",tcg:"Asata",tcb:2,dai:"Không",bangKeo:"Asata",pp:"Công Ty TNHH BVTV Đồng Phát",tl:22.2,ds:1.2,klBB:2.6,bang:"1CROJGgHDMY55LZB0yIEIgPvaL1Dk-mdm",
  nguon:"Bảng thông tin chi tiết FTN-D5 + phiếu BM.05 R&D 05/11/2026",ghiChu:"8 hộp x 50 gói x 18 ml = 7,2 L/thùng; tem decal dán hộp, thùng; tem cảnh báo vận chuyển 2 tem/thùng (SC)"},
 {qc:"DFB150-D3M",upd:1,tl:8.5,ds:0.5,klBB:3,nguon:"Phiếu BM.05 R&D 04/11/2026 – 2611.Dofaben 150WG - 8G - D3M (Con hổ)"}];
const QF=[["qc","Mã quy cách (mã QC) *"],["nhan","Mã nhãn"],["sp","Sản phẩm *"],["btp","Mã BTP mặc định"],["quyCach","Quy cách (VD gói 18 ml)"],["luong","Lượng / đơn vị *","n"],["dvl","ĐVT lượng","s:ml,g,L,kg"],["loai","Loại bao bì","s:gói,chai,can,xô,túi,bao,hũ"],
 ["chai","Mã chai / can / xô"],["moTaChai","Mô tả chai"],["hop","Mã hộp"],["dvHop","Đơn vị / hộp","n"],["thung","Mã thùng"],["dvThung","Đơn vị / thùng","n"],["nhanPhu","Nhãn phụ","s:,Có,Không"],["temChai","Tem dán chai","s:,Có,Không"],
 ["pp","Phân phối"],["tl","TL thuốc chuẩn (g)","n"],["ds","Dung sai (± g)","n"],["klBB","KL bao bì (g)","n"],["gom","Gồm mã nhãn (cặp đôi, nối bằng +)"],["nguon","Nguồn"],["ghiChu","Ghi chú / cần kiểm"]];
const canQC=()=>["Quản lý","Kế toán"].includes(S.me&&S.me.vaiTro);
const qcList=()=>(S.dg&&S.dg.qc)||[];
const qcFind=c=>qcList().find(x=>x.qc.toUpperCase()===String(c||"").trim().toUpperCase());
const rdTodo=()=>!qcList().length?[]:RD_QC.filter(r=>{const q=qcFind(r.qc);return r.upd?(q&&!(+q.tl>0)):!q});
function qcDlg(q0,sua){const v=Object.assign({},q0||{});if(Array.isArray(v.btp))v.btp=v.btp.join(" | ");
  const sps=[...new Set(qcList().map(x=>x.sp).filter(Boolean))].sort();
  const fld=([k,l,t])=>{const val=v[k]==null?"":String(v[k]),dis=sua&&k==="qc"?"readonly":"";
    if(t&&t.startsWith("s:")){const o=t.slice(2).split(",");if(val&&!o.includes(val))o.push(val);return `<label>${l}<select data-k="${k}">${o.map(x=>`<option value="${esc(x)}"${x===val?" selected":""}>${esc(x||"—")}</option>`).join("")}</select></label>`}
    return `<label>${l}<input data-k="${k}" ${t==="n"?'type="number" step="any" inputmode="decimal"':""} ${k==="sp"?'list="qcSpL"':""} value="${esc(val)}" ${dis} autocomplete="off"></label>`};
  const w=dlg(`<h2>${sua?"Sửa quy cách · "+esc(v.qc):"Thêm mã nhãn / quy cách mới"}</h2>
   <p class="note">Lưu vào trang QuyCachDG — dùng ngay khi lập lệnh đóng gói. TL thuốc chuẩn, dung sai, KL bao bì lấy theo phiếu thông tin đóng gói của R&D, tự điền vào BM.05 / BM.04 / BM.06.</p>
   ${sua?"":`<label>Sao chép thông số từ mã có sẵn<input id="qcCp" list="qcCpL" placeholder="VD FTN-D2" autocomplete="off"></label><datalist id="qcCpL">${qcList().map(x=>`<option value="${esc(x.qc)}">${esc(x.sp+" · "+(x.quyCach||""))}</option>`).join("")}</datalist>`}
   <datalist id="qcSpL">${sps.map(x=>`<option value="${esc(x)}">`).join("")}</datalist>
   <div class="two">${QF.map(fld).join("")}</div><p class="note" id="qcSum"></p>
   <div class="actions"><button class="btn" type="button" data-x>Đóng</button><button class="btn primary" type="button" id="qcOk">Lưu</button></div>`);
  const box=w.querySelector(".cfm-box"),get=()=>{const o={};box.querySelectorAll("[data-k]").forEach(e=>o[e.dataset.k]=e.value.trim());return o};
  const sum=()=>{const o=get(),t=num(o.tl),d=num(o.ds)||0,b=num(o.klBB)||0;$("qcSum").textContent=isFinite(t)?`Thuốc ${f2(t-d)} – ${f2(t+d)} g · nguyên ${o.loai||"đơn vị"} ${f2(t+b)} g (${f2(t+b-d)} – ${f2(t+b+d)} g)${num(o.dvHop)>0&&num(o.dvThung)>0?` · ${f2(num(o.dvThung)/num(o.dvHop))} hộp / thùng`:""}`:""};
  box.addEventListener("input",sum);sum();
  const sp=box.querySelector('[data-k="sp"]');sp.addEventListener("change",()=>{const b=box.querySelector('[data-k="btp"]');if(b.value)return;const q=qcList().find(x=>x.sp===sp.value&&x.btp&&x.btp.length);if(q)b.value=q.btp.join(" | ")});
  ["luong","dvl","loai"].forEach(k=>box.querySelector(`[data-k="${k}"]`).addEventListener("change",()=>{const o=get(),e=box.querySelector('[data-k="quyCach"]');if(!e.dataset.t&&o.luong)e.value=`${o.loai||"gói"} ${o.luong} ${o.dvl||""}`.trim()}));
  box.querySelector('[data-k="quyCach"]').addEventListener("input",e=>e.target.dataset.t=1);
  if($("qcCp"))$("qcCp").onchange=e=>{const q=qcFind(e.target.value);if(!q)return;const keep=get();QF.forEach(([k])=>{if(["qc","nhan","nguon","ghiChu","tl","ds","klBB"].includes(k))return;const el=box.querySelector(`[data-k="${k}"]`);let x=q[k];if(Array.isArray(x))x=x.join(" | ");if(el&&!keep[k]||el&&el.tagName==="SELECT")el.value=x==null?"":String(x)});sum();toast("Đã chép thông số từ "+q.qc+" — sửa lại chỗ khác")};
  w.querySelector("[data-x]").onclick=()=>w.remove();
  $("qcOk").onclick=async()=>{const QK=QF.map(f=>f[0]),o=get();["tcg","tcb","dai","bangKeo","anh","bang"].forEach(k=>{if(!QK.includes(k)&&v[k]!=null&&v[k]!==""&&!sua)o[k]=v[k]});if(sua)o.sua=true;const b=$("qcOk");b.disabled=true;
    try{const L=await api("webQCSave",S.auth,o);S.dg.qc=L;S._tpQ=null;S.dgQ={};L.forEach(q=>S.dgQ[q.qc]=q);w.remove();toast((sua?"Đã cập nhật ":"Đã thêm ")+o.qc);if(S.dgv==="new"){if(typeof dgHits==="function")dgHits()}else if(typeof dgListRender==="function")dgListRender()}
    catch(e){toast(e.message);b.disabled=false}}}
window.qcDlg=qcDlg;
/* thanh công cụ trên danh sách lệnh đóng gói */
window.qcBar=function(box){if(!box||!canQC()||box.querySelector(".qc-bar"))return;const T=rdTodo();
  const el=document.createElement("div");el.className="qc-bar";el.style.cssText="margin:8px 0;padding:10px 12px;border:1px solid var(--line,#d5dde8);border-radius:10px";
  el.innerHTML=`<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><b>Danh mục quy cách</b><span class="note">${qcList().length} mã</span><input id="qcFind" list="qcFindL" placeholder="Mã cần sửa…" style="max-width:180px" autocomplete="off"><datalist id="qcFindL">${qcList().map(x=>`<option value="${esc(x.qc)}">${esc(x.sp+" · "+(x.quyCach||""))}</option>`).join("")}</datalist><button class="btn" type="button" id="qcEd">Sửa</button><button class="btn primary" type="button" id="qcAdd">＋ Mã nhãn / quy cách mới</button></div>
  ${T.length?`<div style="margin-top:8px"><span class="note">Phiếu thông tin đóng gói R&D có mã / thông số chưa cập nhật:</span> ${T.map((r,i)=>`<button class="btn" type="button" data-rd="${i}">${r.upd?"Cập nhật TL chuẩn ":"Thêm "}${esc(r.qc)}</button>`).join(" ")}</div>`:""}`;
  const tools=box.querySelector(".tools");(tools?tools.parentNode:box).insertBefore(el,tools?tools.nextSibling:box.firstChild);
  $("qcAdd").onclick=()=>qcDlg({dvl:"ml",loai:"gói"},false);
  $("qcEd").onclick=()=>{const q=qcFind($("qcFind").value);if(!q)return toast("Không thấy mã "+$("qcFind").value);qcDlg(q,true)};
  el.querySelectorAll("[data-rd]").forEach(b=>b.onclick=()=>{const r=T[+b.dataset.rd];if(r.upd){const q=qcFind(r.qc);qcDlg(Object.assign({},q,{tl:r.tl,ds:r.ds,klBB:r.klBB,nguon:r.nguon}),true)}else qcDlg(r,false)})};
})();
