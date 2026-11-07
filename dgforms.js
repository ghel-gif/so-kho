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
  const liq=liqOf(q),tt=+b.tt||+(D.P&&D.P.tt)||0,thuoc=toG(q,tt);
  return {o,q,sp,b,X,liq,tt,thuoc,tenSP:(q.sp?q.sp+(q.quyCach?" – "+q.quyCach:""):sp.ten),maSP:q.nhan||o.maSP}}
const b05=D=>(D.forms||[]).filter(f=>f.loai==="BM05").pop()||null;

/* ---------- thanh nút trong lệnh đóng gói ---------- */
/* ---------- Ô biểu mẫu QC dùng chung (lệnh đóng gói + lệnh SX BTP): trạng thái Chưa lập / Cần bổ sung / Đủ ---------- */
const IC={box:"M4 7l8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10",chk:"M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9",home:"M3 21h18M6 21V10l6-6 6 6v11M10 21v-5h4v5",doc:"M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5",flask:"M9 3h6M10 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3L14 9V3M7 15h10"};
window.QC_IC=IC;
window.qcTiles=function(bar,T,stat,title){bar.className="dgf-bar";
  bar.innerHTML=`<div class="dgf-h">${title||"Biểu mẫu QC của lệnh này"} <small>bấm để mở / lập phiếu</small></div><div class="dgf-g">${T.map(t=>`<button type="button" class="dgf-t" data-f="${t.f}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${t.icon}"/></svg><span class="dgf-x"><b>${t.code}</b><span>${esc(t.name)}</span><small class="dgf-gap" data-g="${t.f}" hidden></small></span><em class="dgf-s" data-s="${t.f}">…</em></button>`).join("")}</div>`;
  T.forEach(t=>bar.querySelector(`[data-f="${t.f}"]`).onclick=t.open);
  bar.upd=()=>stat().then(R=>T.forEach(t=>{const r=R[t.f]||{n:0,gaps:[]},b=bar.querySelector(`[data-f="${t.f}"]`),e=b.querySelector(".dgf-s"),g=b.querySelector(".dgf-gap");
    const st=!r.n?"no":r.gaps.length?"warn":"ok";b.classList.remove("done","need");if(st==="ok")b.classList.add("done");if(st==="warn")b.classList.add("need");
    e.className="dgf-s "+st;e.textContent=st==="no"?"Chưa lập":st==="warn"?"⚠ Cần bổ sung":"✓ Đủ thông tin"+(r.n>1?" · "+r.n+" phiếu":"");
    g.hidden=!r.gaps.length;g.textContent=r.gaps.length?"Thiếu: "+r.gaps.join("; "):"";b.title=r.gaps.length?"Cần bổ sung: "+r.gaps.join("; "):""})).catch(()=>bar.querySelectorAll(".dgf-s").forEach(e=>e.textContent=""));
  bar.upd();return bar};
/* Phiếu đã lập nhưng còn thiếu gì */
function dgfGap(D,f){const d=f.d||{},G=[],emp=v=>v===undefined||v===null||String(v).trim()==="",pos=v=>num(v)>0;
  if(f.loai==="BM05"){const g=isGoi(D.q||{});
    if(emp(d.maMay)&&!(d.tb||[]).some(t=>t&&t.ten))G.push("thiết bị đóng gói");
    if(!pos(d.tlThuoc))G.push("TL thuốc chuẩn");if(!pos(d.tMin)||!pos(d.tMax))G.push("dung sai");
    if(!pos(d.klBB))G.push("KL bao bì "+(g?"gói":"chai"));if(!pos(d.dvThung))G.push(g?"số gói/thùng":"số chai/thùng");
    if(pos(d.dvHop)&&!pos(d.klHop))G.push("KL hộp");if(!pos(d.klThung))G.push("KL thùng carton");
    if(g?emp(d.nhietEp):emp(d.seal))G.push(g?"nhiệt ép":"công suất seal");return G}
  if(/^BM0[46]$/.test(f.loai)){const items=[].concat(...(CR[f.loai]||[]).map(x=>x[1])),n=nsOf(f.loai,d);
    {const M=tbMiss(f.loai,d.tb);if(M.length&&!(!(d.tb||[]).length&&!emp(d.maMay)))G.push(M.join(", ").toLowerCase())}
    (d.rounds||[]).forEach((r,i)=>{if(r.nk)return;const lb=RL[i]||"Lần "+(i+1),m=items.filter(([k,,isV])=>isV?emp((r.v||{})[k]):!(r.c||{})[k]).length,c=(r.kl||[]).filter(v=>!emp(v)).length;
      const q=[m?m+" mục chưa đánh giá":"",c<n?"thiếu "+(n-c)+"/"+n+" mẫu cân":""].filter(Boolean);if(q.length)G.push(lb+": "+q.join(", "))});
    if(emp(f.kl))G.push("kết luận");return G}
  if(f.loai==="BM07"){const P=d.parts||[];if(emp(d.maMay))G.push("mã máy");if(!P.some(x=>x.th))G.push("chưa tick bộ phận đã vệ sinh");
    const m=P.filter(x=>x.th&&!x.dg).length;if(m)G.push(m+" bộ phận chưa đánh giá");if(emp(f.kl))G.push("kết luận");return G}
  return G}
window.dgfGap=dgfGap;
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest('.cfm [data-x="save"],.cfm [data-x="upd"],.cfm [data-x="close"],.cfm [data-x="del"]'))setTimeout(()=>document.querySelectorAll(".dgf-bar").forEach(b=>b.upd&&b.upd()),900)},true);
window.dgfHook=function(box,so){if(!box||!so||box.querySelector(".dgf-bar"))return;
  const bar=document.createElement("div");
  qcTiles(bar,[["BM05","BM.05","Thông tin đóng gói",IC.box],["KT","BM.04/06","Kiểm tra quá trình",IC.chk],["BM07","BM.07","Vệ sinh thiết bị",IC.home]].map(([f,m,t,ic])=>({f,code:m,name:t,icon:ic,open:()=>dgfOpen(so,f)})),async()=>{const D=await getD(so),F=D.forms||[];const R={};
    ["BM05","KT","BM07"].forEach(f=>{const L=F.filter(x=>f==="KT"?/^BM0[46]$/.test(x.loai):x.loai===f);R[f]={n:L.length,gaps:[].concat(...L.map((x,i)=>dgfGap(D,x).map(g=>L.length>1?dmy(x.ngay)+": "+g:g)))}});return R});
  /* thứ tự: nút quay lại → tiêu đề lệnh → ô biểu mẫu */const h2=box.querySelector("h2"),bk=box.querySelector("#dgBack,button.back,[data-back]");if(h2)h2.after(bar);else if(bk)bk.after(bar);else box.prepend(bar);
};
async function dgfOpen(so,f){let D;try{D=await getD(so)}catch(e){return handleErr(e)}
  const loai=f==="KT"?(isGoi(D.q)?"BM04":"BM06"):f,L=(D.forms||[]).filter(x=>x.loai===loai);
  if(loai==="BM05")return f05(D,L.pop()||null);
  const X=(D.xoa||[]).filter(x=>x.loai===loai),mine=x=>["Quản lý","Kế toán"].includes(S.me.vaiTro)||x.nguoi===S.me.ten,cw=can.phieu();
  if(!L.length&&!X.length)return loai==="BM07"?f07(D,null):fKT(D,loai,null);
  const w=document.createElement("div");w.className="cfm";const nm={BM04:"Phiếu kiểm tra quá trình đóng gói (BM.04)",BM06:"Phiếu kiểm tra quá trình đóng chai (BM.06)",BM07:"Biên bản vệ sinh thiết bị đóng gói (BM.07)"}[loai];
  w.innerHTML=`<div class="cfm-box"><h2>${nm}</h2><p class="note">Lệnh ${esc(so)} đã có ${L.length} phiếu. Mở phiếu cũ hoặc lập phiếu mới (VD: ca khác, ngày khác).</p><div class="list">${L.map((x,i)=>`<div class="row click" data-i="${i}" style="display:flex;align-items:center;gap:8px"><div style="flex:1;min-width:0"><div class="name">${esc(dmy(x.ngay))} · ${esc(x.d.ca||x.d.gio||"")} ${x.kl?`<span class="chip">${esc(x.kl)}</span>`:""}</div><div class="meta">${esc(x.nguoi)} · ${esc(x.luc)}</div></div>${cw&&mine(x)?`<button class="btn small danger" type="button" data-del="${i}" title="Xoá phiếu này (khôi phục được)">🗑 Xoá</button>`:""}</div>`).join("")||'<p class="note">Chưa có phiếu nào đang dùng.</p>'}</div>
   ${X.length?`<details class="dgf-del" ${L.length?"":"open"}><summary>Phiếu đã xoá (${X.length}) — bấm để xem / khôi phục</summary><div class="list">${X.map((x,i)=>`<div class="row" style="display:flex;align-items:center;gap:8px;opacity:.85"><div style="flex:1;min-width:0"><div class="name"><s>${esc(dmy(x.ngay))}</s> ${x.kl?`<span class="chip">${esc(x.kl)}</span>`:""}</div><div class="meta">Lập: ${esc(x.nguoi)} · ${esc(x.luc)}</div></div>${cw&&mine(x)?`<button class="btn small" type="button" data-res="${i}">↺ Khôi phục</button>`:""}</div>`).join("")}</div></details>`:""}
   <div class="actions"><span style="flex:1"></span><button class="btn" type="button" data-x="close">Đóng</button><button class="btn primary" type="button" data-x="new">+ Phiếu mới</button></div></div>`;
  document.body.appendChild(w);const go=x=>{w.remove();loai==="BM07"?f07(D,x):fKT(D,loai,x)};
  w.querySelectorAll("[data-i]").forEach(r=>r.onclick=e=>{if(e.target.closest("[data-del]"))return;go(L[+r.dataset.i])});
  const again=()=>{w.remove();dgfOpen(so,f);document.querySelectorAll(".dgf-bar").forEach(b=>b.upd&&b.upd())};
  w.querySelectorAll("[data-del]").forEach(b=>b.onclick=async e=>{e.stopPropagation();const x=L[+b.dataset.del];b.disabled=true;
    try{await api("webDGFDel",S.auth,x.id);toast("Đã xoá phiếu ngày "+dmy(x.ngay)+" — có thể khôi phục ở mục “Phiếu đã xoá”");again()}catch(er){b.disabled=false;handleErr(er)}});
  w.querySelectorAll("[data-res]").forEach(b=>b.onclick=async()=>{const x=X[+b.dataset.res];b.disabled=true;
    try{await api("webDGFRestore",S.auth,x.id);toast("Đã khôi phục phiếu ngày "+dmy(x.ngay));again()}catch(er){b.disabled=false;handleErr(er)}});w.querySelector('[data-x="new"]').onclick=()=>go(null);w.querySelector('[data-x="close"]').onclick=()=>w.remove();w.onclick=e=>{if(e.target===w)w.remove()}}
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
const cbbList=()=>(S.dg&&S.dg.cbb)||[];
const cbbLast=(qc,k)=>{const L=cbbList().filter(x=>x.qc===qc&&x.loai===k);return L.length?L[L.length-1]:null};
const cbbNote=x=>x?`cân gần nhất ${f2(x.v)} ${x.dv} · ${dmy(x.ngay)} · ${esc(x.nguoi)}${x.so?" · "+esc(x.so):""}`:"chưa có lần cân nào";
function f05(D,p){const I=info(D),TK=isGoi(I.q)?"BM05G":"BM05C",SRC0=(p&&p.d&&p.d.dlSrc)||"auto",QL=dlOf(I.q,SRC0),QG=dlG(QL,I.tt),d=Object.assign({ngay:today(),maMay:"",mayTen:"",nhietDo:"",tocDo:"",seal:"",nhietEp:"",tlThuoc:QG?QG.std:+I.q.tl>0?+I.q.tl:isFinite(I.thuoc)?Math.round(I.thuoc*10)/10:"",ds:QG?"":+I.q.ds>0?+I.q.ds:"",tMin:QG?QG.lo:+I.q.tl>0&&+I.q.ds>0?Math.round((I.q.tl-I.q.ds)*100)/100:"",tMax:QG?QG.hi:+I.q.tl>0&&+I.q.ds>0?Math.round((+I.q.tl+ +I.q.ds)*100)/100:"",loaiBB:isGoi(I.q)?"Gói thuốc":"Chai có nhãn, không nắp",klBB:cbbLast(I.q.qc,"klBB")?cbbLast(I.q.qc,"klBB").v:+I.q.klBB>0?+I.q.klBB:"",dvThung:I.q.dvThung||"",dvHop:+I.q.dvHop>0?+I.q.dvHop:"",klHop:cbbLast(I.q.qc,"klHop")?cbbLast(I.q.qc,"klHop").v:"",hopThung:+I.q.dvHop>0&&+I.q.dvThung>0?Math.round(I.q.dvThung/I.q.dvHop*100)/100:"",tyTrong:I.tt?I.tt:"",thungPallet:"",lop:"",thungLop:"",mangCo:"",klThung:cbbLast(I.q.qc,"klThung")?cbbLast(I.q.qc,"klThung").v:"",bangKeo:"",ghiChu:""},p?p.d:{}),canW=can.phieu(),dis=canW?"":"disabled";
  d.tb=tbInit(TK,d);
  const w=dlg(`<h2>Phiếu thông tin đóng gói thành phẩm (BM.05) · ${esc(I.o.so)}</h2><p class="note">${esc(I.tenSP)} · mã ${esc(I.maSP)} · BTP ${esc(I.b.lo||"")}${I.tt?" · tỷ trọng "+String(I.tt).replace(".",","):""}. Trọng lượng thuốc chuẩn tự tính từ định lượng ${esc(I.q.luong||"")} ${esc(I.q.dvl||"")}${I.liq?" × tỷ trọng":""}, sửa được.</p>
   <div class="two">${inp("f5Ngay","Ngày lập phiếu",d.ngay,`type="date" ${dis}`)}</div><div class="two">${inp("f5LoB","Số lô BTP",d.loBTP||I.b.lo||"",dis)}${inp("f5NsxB","NSX BTP",String(d.nsxBTP||I.b.nsx||"").slice(0,10),`type="date" ${dis}`)}</div>
   <b style="display:block;margin-top:8px">Thiết bị sản xuất chính</b>${tbHtml(TK,D,d.tb,dis)}
   <b style="display:block;margin-top:8px">Thông số máy (tham khảo)</b>
   <div class="two">${TK==="BM05G"?inp("f5Ep","Nhiệt ép (°C)",d.nhietEp,dis):inp("f5Seal","Công suất seal (%)",d.seal,dis)}</div>
   <b style="display:block;margin-top:8px">Trọng lượng</b>
   <div class="three" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">${inp("f5Tl","TL thuốc chuẩn (g)",d.tlThuoc,`type="number" step="any" ${dis}`)}${inp("f5Lo","Cận dưới (g)",d.tMin!==undefined&&d.tMin!==""?d.tMin:(num(d.ds)>0?Math.round((num(d.tlThuoc)-num(d.ds))*100)/100:""),`type="number" step="any" ${dis}`)}${inp("f5Hi","Cận trên (g)",d.tMax!==undefined&&d.tMax!==""?d.tMax:(num(d.ds)>0?Math.round((num(d.tlThuoc)+num(d.ds))*100)/100:""),`type="number" step="any" ${dis}`)}</div>
   <div class="two">${inp("f5Tt","Tỷ trọng BTP (g/ml)"+(I.liq?"":" – nếu có"),d.tyTrong,`type="number" step="0.001" ${dis}`)}<span></span></div>
   <div class="dlsrc"><div class="dlsrc-h">Căn cứ định lượng (QC-QĐ.04):</div><div class="seg seg2" id="f5Src">${[["auto","Tự động"],["51","Mục 5.1 · tên riêng"],["52","Mục 5.2 · gia công"]].map(([v,t])=>`<button type="button" data-src="${v}" aria-pressed="${v===SRC0}" ${dis}>${t}</button>`).join("")}</div><div class="note" style="margin:4px 0 0"><span id="f5Dl">${QL?dlTxt(QL,d.tyTrong||I.tt):dlNone(SRC0)}</span>${canW?` <button class="btn small" type="button" id="f5DlGo" ${QL?"":"hidden"}>Lấy lại theo QĐ.04</button>`:""}</div></div>
   <div class="two"><label>Loại bao bì tính khối lượng<select id="f5Lbb" ${dis}>${BB_LOAI.map(x=>`<option${x===d.loaiBB?" selected":""}>${x}</option>`).join("")}</select></label>${inp("f5Kbb","Khối lượng bao bì (g)",d.klBB,`type="number" step="any" ${dis}`)}</div>
   <p class="note" style="margin:0 0 4px;text-align:right">KL bao bì: ${cbbNote(cbbLast(I.q.qc,"klBB"))}${+I.q.klBB>0?` · R&D ${f2(+I.q.klBB)} g`:""}</p>
   <b style="display:block;margin-top:10px">Quy cách đóng gói</b>
   <div class="note" style="margin:2px 0 4px">Có hộp: nhập ${isGoi(I.q)?"gói":"chai"}/hộp và hộp/thùng → ${isGoi(I.q)?"gói":"chai"}/thùng tự tính. Không có hộp (hoặc thùng nhỏ): bỏ trống 2 ô hộp, nhập ${isGoi(I.q)?"gói":"chai"}/thùng.</div>
   <div class="three" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">${inp("f5Dvh",(isGoi(I.q)?"Gói":"Chai")+" / hộp",d.dvHop,`type="number" ${dis}`)}${inp("f5Ht","Hộp / thùng",d.hopThung,`type="number" ${dis}`)}${inp("f5Dvt",(isGoi(I.q)?"Gói":"Chai")+" / thùng",d.dvThung,`type="number" ${dis}`)}</div>
   <b style="display:block;margin-top:10px">Khối lượng bao bì thùng</b>
   <div class="two">${inp("f5Kt","Thùng carton rỗng (kg, gồm tấm lót)",d.klThung,`type="number" step="any" ${dis}`)}${inp("f5Kh","1 hộp / thùng nhỏ rỗng (g)",d.klHop,`type="number" step="any" ${dis}`)}</div>
   <p class="note" style="margin:0 0 4px">Theo dõi riêng mã hàng <b>${esc(I.q.qc||"")}</b> — Thùng: ${cbbNote(cbbLast(I.q.qc,"klThung"))} &nbsp;·&nbsp; Hộp/thùng nhỏ: ${cbbNote(cbbLast(I.q.qc,"klHop"))}. Số cân mới sẽ được lưu làm mặc định cho lần sau.</p>
   <b style="display:block;margin-top:10px">Pallet</b>
   <div class="two">${inp("f5Tp","Thùng / pallet",d.thungPallet,`type="number" ${dis}`)}${inp("f5Tl2","Thùng / lớp",d.thungLop,`type="number" ${dis}`)}</div><p class="note" id="f5Pal" style="margin:2px 0 6px"></p>
   <label>Pallet quấn màng co<select id="f5Mc" ${dis}><option value=""></option>${["Có","Không"].map(x=>`<option${x===d.mangCo?" selected":""}>${x}</option>`).join("")}</select></label>
   <label>Thùng carton kéo băng keo<select id="f5Bk" ${dis}><option value=""></option>${["logo Asata","logo khách","băng keo trong"].map(x=>`<option${x===(d.bangKeo==="không thông tin"?"băng keo trong":d.bangKeo)?" selected":""}>${x}</option>`).join("")}</select></label>
   ${inp("f5Gc","Ghi chú",d.ghiChu,dis)}<p class="note" id="f5Sum"></p>
   ${p?`<p class="note">Lưu lần cuối: ${esc(p.nguoi)} · ${esc(p.luc)}</p>`:""}<div class="actions">${B().btn4(canW,!!p)}</div>`);
  const g0=()=>{const tb=tbRead(TK,D,w,d.tb);return {tb,maMay:tb.map(t=>t.ma).filter(Boolean).join(", "),mayTen:tb.map(t=>t.ten).filter(Boolean).join("; "),ngay:$("f5Ngay").value,loBTP:$("f5LoB").value.trim(),nsxBTP:$("f5NsxB").value,seal:$("f5Seal")?$("f5Seal").value.trim():"",nhietEp:$("f5Ep")?$("f5Ep").value.trim():"",tlThuoc:$("f5Tl").value,tMin:$("f5Lo").value,tMax:$("f5Hi").value,loaiBB:$("f5Lbb").value,klBB:$("f5Kbb").value,dvThung:$("f5Dvt").value,dvHop:$("f5Dvh").value,hopThung:$("f5Ht").value,klHop:$("f5Kh").value,tyTrong:$("f5Tt").value,thungPallet:$("f5Tp").value,lop:(num($("f5Tp").value)>0&&num($("f5Tl2").value)>0)?String(Math.ceil(num($("f5Tp").value)/num($("f5Tl2").value))):"",thungLop:$("f5Tl2").value,mangCo:$("f5Mc").value,klThung:$("f5Kt").value,bangKeo:$("f5Bk").value,ghiChu:$("f5Gc").value.trim(),dlSrc:(typeof DL!=="undefined"?DL.src:"auto")}},g=()=>{const o=g0(),h=num(o.dvHop),n=num(o.hopThung);if(!(num(o.dvThung)>0)&&h>0&&n>0)o.dvThung=String(Math.round(h*n*100)/100);return o};
  const warn=(id,k,ref)=>{const el=$(id);if(!el)return;const v=num(el.value),r=+ref||0,on=v>0&&r>0&&Math.abs(v-r)/r>0.1;el.classList.toggle("in-warn",on);el.title=on?`Lệch ${Math.round(Math.abs(v-r)/r*100)} % so với ${f2(r)} — kiểm tra lại cân / loại bao bì`:""};
  const sum=()=>{const c=c05(g()),t=num($("f5Tl").value);warn("f5Kbb","klBB",(cbbLast(I.q.qc,"klBB")||{}).v||I.q.klBB);warn("f5Kh","klHop",(cbbLast(I.q.qc,"klHop")||{}).v);warn("f5Kt","klThung",(cbbLast(I.q.qc,"klThung")||{}).v);if(window.inMark){inMark($("f5Lo"),$("f5Lo").value,-Infinity,isFinite(t)?t-1e-9:Infinity);inMark($("f5Hi"),$("f5Hi").value,isFinite(t)?t+1e-9:-Infinity,Infinity);$("f5Lo").classList.remove("in-ok");$("f5Hi").classList.remove("in-ok")}$("f5Sum").innerHTML=isFinite(c.t)?`Thuốc ${f2(c.t)} g (${f2(c.tMin)} – ${f2(c.tMax)}) · nguyên ${isGoi(I.q)?"gói":"chai"} ${f2(c.n)} g (${f2(c.nMin)} – ${f2(c.nMax)})${isFinite(c.th)?` · thùng ${f2(c.thMin)} – ${f2(c.thMax)} kg`:""}`:""};
  const palT=()=>{const tp=num($("f5Tp").value),tl=num($("f5Tl2").value),el=$("f5Pal");if(!(tp>0&&tl>0)){el.textContent="";el.style.color="";return 0}const f=Math.floor(tp/tl),r=Math.round((tp-f*tl)*100)/100,L=Math.ceil(tp/tl);el.innerHTML=L>7?`⚠ ${L} lớp – quá 7 lớp, nhập lại số thùng/pallet hoặc thùng/lớp`:`→ <b>${L}</b> lớp: ${f} lớp × ${tl} thùng${r>0?` + 1 lớp lẻ ${r} thùng`:""}`;el.style.color=L>7?"#c0392b":"";el.style.fontWeight=L>7?"700":"";return L};const lockT=()=>{const h=num($("f5Dvh").value),n=num($("f5Ht").value),t=$("f5Dvt"),on=h>0&&n>0;if(on)t.value=Math.round(h*n*100)/100;t.readOnly=on;t.style.background=on?"#eef3ea":""};lockT();palT();
  const DL={q:QL,src:SRC0};
  const dlApply=quiet=>{const G=dlG(DL.q,num($("f5Tt").value));if(!G){if(!quiet)toast(DL.q?"Nhập tỷ trọng BTP trước để quy ra gram":"Không có định lượng theo lựa chọn này");return}$("f5Tl").value=G.std;$("f5Lo").value=G.lo;$("f5Hi").value=G.hi;$("f5Tl").dispatchEvent(new Event("input",{bubbles:true}));toast("Đã lấy theo QC-QĐ.04 "+DL.q.src)};
  if($("f5DlGo"))$("f5DlGo").onclick=()=>dlApply();
  $("f5Src").querySelectorAll("[data-src]").forEach(b=>b.onclick=()=>{if(!canW)return;DL.src=b.dataset.src;DL.q=dlOf(I.q,DL.src);$("f5Src").querySelectorAll("[data-src]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));
    $("f5Dl").innerHTML=DL.q?dlTxt(DL.q,num($("f5Tt").value)):dlNone(DL.src);if($("f5DlGo"))$("f5DlGo").hidden=!DL.q;if(DL.q)dlApply(true)});
  w.addEventListener("input",e=>{palT();if(DL.q&&e.target&&e.target.id==="f5Tt")$("f5Dl").innerHTML=dlTxt(DL.q,num(e.target.value));lockT();sum()});sum();
  B().btnWire(w,{canW,saved:!!p,dirty:false},async()=>{if(palT()>7){toast("Quá 7 lớp/pallet – kiểm tra lại số thùng/pallet hoặc thùng/lớp");$("f5Tp").focus();return false}const d=g();p=p||{};p.d=d;await save(D,"BM05",p,d,d.ngay,"");try{const V={};[["klBB","klBB"],["klHop","klHop"],["klThung","klThung"]].forEach(([k,f])=>{const v=num(d[f]),l=cbbLast(I.q.qc,k);if(v>0&&(!l||Math.abs(l.v-v)>1e-9))V[k]=v});if(Object.keys(V).length&&I.q.qc){const R=await api("webCanBBSave",S.auth,{qc:I.q.qc,so:D.o.so,ngay:d.ngay,vals:V});if(S.dg)S.dg.cbb=R}}catch(e){toast("Chưa lưu được KL bao bì cân: "+e.message)}D.forms=(D.forms||[]).filter(x=>x.loai!=="BM05").concat([Object.assign({loai:"BM05",id:p._id},p)])},()=>p05(I,g()))}
function c05(d){const t=num(d.tlThuoc),ds=num(d.ds)||0,bb=num(d.klBB)||0,n=t+bb,kt0=num(d.klThung),k=isFinite(kt0)?num(d.dvThung):NaN,kt=isFinite(kt0)?kt0:0,nh=num(d.dvHop)>0?(num(d.hopThung)||0):0,kh=nh*(num(d.klHop)||0)/1000,kx=kt+kh;
  let lo=num(d.tMin),hi=num(d.tMax);if(!isFinite(lo))lo=t-ds;if(!isFinite(hi))hi=t+ds;
  return {t,tMin:lo,tMax:hi,n,nMin:lo+bb,nMax:hi+bb,th:k?n*k/1000+kx:NaN,thMin:k?(lo+bb)*k/1000+kx:NaN,thMax:k?(hi+bb)*k/1000+kx:NaN,nh,kh}}
const fw=v=>isFinite(v)?String(Math.round(v*100)/100).replace(/^(-?\d+)$/,"$1.0"):"……";
function p05(I,d){const c=c05(d),K=B(),bx=v=>K.box(v),u=isGoi(I.q)?"GÓI":"CHAI";
  K.pr(`${K.PCSS}<style>.pq .t3 td{vertical-align:top;font-size:11.5pt;line-height:1.5}.pq .t3 th{font-size:11.5pt}.pq .klc{font-size:15pt;line-height:1.3;margin-bottom:2px}.pq .klc b{font-size:20pt;white-space:nowrap}.pq .hd .lg img{height:20mm}.pq .t3 td{line-height:1.35}.pq .gc{font-size:10.5pt;line-height:1.3}.pq .ds{display:inline-block;margin:0 5mm}.pq td.bt{position:relative}.pq .klc .sep{border-top:1px dashed #888;margin:2.5mm 0 2.5mm}.klc .kl2{font-size:16pt}.klc .kl2 b{font-size:23pt}.pq .sg .nm{height:20mm}.pq td.b14{padding-bottom:15mm}.pq td.b10{padding-bottom:11mm}.pq td.bt .ftn{position:absolute;left:5px;right:5px;bottom:4px}.pq table.lut{border-collapse:collapse;margin:2px 0 0}.pq table.lut td{border:0;padding:1px 4px 1px 0;font-size:11.5pt}.pq table.lut td:first-child{width:62mm}.pq table.lut span.op{display:inline-block;min-width:38mm}.pq table.qct{width:100%;border-collapse:collapse;margin:0}.pq table.qct td{border:0;border-bottom:1px dotted #999;padding:2px 2px;font-size:11.5pt;vertical-align:middle}.pq table.qct tr:last-child td{border-bottom:0}.pq table.qct td:last-child{font-weight:700;font-size:14pt;text-align:right}.pq table.qct .ds{margin:0 2mm}.pq .qcd{font-size:13pt;line-height:1.45}.pq .qcd b{font-size:16pt;white-space:nowrap}.pq .sg{margin-top:8px}.pq .sg .nm{height:15mm}</style><div class="pq">${K.head("PHIẾU THÔNG TIN ĐÓNG GÓI<br>THÀNH PHẨM",META("BM.05-QC-QT.04"))}
  <p style="margin:8px 0">Ngày lập phiếu: <b>${dmy(d.ngay)}</b> &nbsp;&nbsp; Lệnh đóng gói: <b>${esc(I.o.so)}</b> &nbsp;&nbsp; Thiết bị SX chính: <b>${esc(d.mayTen||"……")}</b>${d.maMay?" (mã "+esc(d.maMay)+")":""}</p>
  <table class="t3"><colgroup><col style="width:21%"><col style="width:47%"><col style="width:32%"></colgroup>
   <tr><td colspan="2">Tên sản phẩm: <b>${esc(I.tenSP)}</b></td><td>Mã sản phẩm: <b>${esc(I.maSP)}</b></td></tr>
   <tr><th>THÔNG SỐ MÁY</th><th>TRỌNG LƯỢNG ${u}/GÓI THUỐC (gr)</th><th>QUY CÁCH ĐÓNG GÓI</th></tr>
   <tr><td class="bt b14"><div class="qcd">${(()=>{const U=(v,u)=>v&&!/[°%a-zA-Z]/.test(String(v))?v+" "+u:v,T=isGoi(I.q)?[["Nhiệt ép<sup>(1)</sup>",U(d.nhietEp,"°C")]]:[["Công suất seal<sup>(1)</sup>",U(d.seal,"%")]],F=T.filter(t=>t[1]);return (F.length?F.map(t=>`${t[0]}: <b>${esc(t[1])}</b>`):T.map((t,i)=>`${t[0]}: ……${isGoi(I.q)?" °C":" %"}`)).join("<br>")})()}</div><div class="gc ftn"><i><sup>(1)</sup> Thông số tham khảo, sẽ được điều chỉnh tùy thuộc vào tình hình thực tế</i></div></td>
    <td class="bt b10"><div class="klc">Trọng lượng của thuốc chuẩn: <b>${fw(c.t)} gr</b><br>dung sai: <b>${fw(c.tMin)}</b><span class="ds">–</span><b>${fw(c.tMax)}</b> gr<div class="sep"></div><div class="kl2">Trọng lượng nguyên ${isGoi(I.q)?"gói thuốc":"chai"} chuẩn<sup>(2)</sup>: <b>${fw(c.n)} gr</b><br>dung sai: <b>${fw(c.nMin)}</b><span class="ds">–</span><b>${fw(c.nMax)}</b> gr</div></div><div class="gc ftn"><i><sup>(2)</sup> Ghi chú:</i><br>${d.loaiBB?`${bx(true)} ${esc(d.loaiBB.toLowerCase())}; KL bao bì: <b>${d.klBB!==""?fw(num(d.klBB)):"……"}</b> gr`:BB_LOAI.map(x=>`${bx(false)} ${x.toLowerCase()}; KL bao bì: …… gr`).join("<br>")}</div></td>
    <td>${(()=>{const ul=u.toLowerCase(),tp=num(d.thungPallet),tl=num(d.thungLop),L=num(d.lop),tpx=tp>0?tp:(L>0&&tl>0?L*tl:NaN);
      let xp="……";if(tp>0&&tl>0){const f=Math.floor(tp/tl),r=Math.round((tp-f*tl)*100)/100;xp=`${f} lớp × ${tl} thùng${r>0?`<br>+ 1 lớp lẻ ${r} thùng`:""}`}else if(L>0&&tl>0)xp=`${L} lớp × ${tl} thùng`;
      const R=[];if(num(d.dvHop)>0){R.push([ul[0].toUpperCase()+ul.slice(1)+" / hộp",esc(d.dvHop)]);R.push(["Hộp / thùng",esc(d.hopThung||"……")])}
      R.push([ul[0].toUpperCase()+ul.slice(1)+" / thùng",esc(d.dvThung||"……")]);
      R.push(["Trọng lượng thùng<sup>(3)</sup>",isFinite(c.th)?`${f2(c.thMin)}<span class="ds">–</span>${f2(c.thMax)} kg`:`……<span class="ds">–</span>…… kg`]);
      R.push(["Thùng / pallet",isFinite(tpx)?String(tpx):"……"]);R.push(["Xếp pallet dự kiến",xp]);
      const kt=String(d.klThung??"").trim(),kh=String(d.klHop??"").trim();return `<table class="qct">${R.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("")}</table><div class="gc" style="margin-top:4px"><i><sup>(3)</sup> Ghi chú:</i> trọng lượng thùng đã bao gồm khối lượng bao bì dưới đây<br>KL bì thùng carton: <b>${kt!==""?f2(num(kt)):"……"}</b> kg (gồm tấm lót)${num(d.dvHop)>0?`<br>KL bì hộp: <b>${kh!==""?fw(num(kh)):"……"}</b> g / hộp`:""}</div>`})()}</td></tr>
   <tr><td colspan="3"><b>Thông tin bán thành phẩm</b><br>Tên: ${esc(I.b.ten||"")} &nbsp; NSX: ${(d.nsxBTP||I.b.nsx)?dmy(String(d.nsxBTP||I.b.nsx).slice(0,10)):""} &nbsp; Số lô SX: <b>${esc(d.loBTP||I.b.lo||"")}</b> &nbsp; Tỷ trọng (nếu có): ${num(d.tyTrong)>0?(+d.tyTrong).toFixed(3).replace(".",",")+" g/ml":""}</td></tr>
   <tr><td colspan="3"><b>Lưu ý</b><table class="lut"><tr><td>Băng keo dán thùng carton</td><td>${["logo Asata","logo khách","băng keo trong"].map(x=>`<span class="op">${bx((d.bangKeo==="không thông tin"?"băng keo trong":d.bangKeo)===x)} ${x}</span>`).join("")}</td></tr><tr><td>Pallet quấn màng co</td><td>${["Có","Không"].map(x=>`<span class="op">${bx(d.mangCo===x)} ${x}</span>`).join("")}</td></tr>${d.ghiChu?`<tr><td>Ghi chú</td><td>${esc(d.ghiChu)}</td></tr>`:""}</table></td></tr></table>
  ${K.sign([["Người lập phiếu",""],["Phòng QC",""]])}</div>`,true)}

/* ---------- BM.04 / BM.06 Phiếu kiểm tra quá trình ---------- */
/* Thiết bị theo từng dòng (BM.04 / BM.06): máy chính + máy phụ (in date, máy ép / seal, dán nhãn nếu có) */
/* [khoá, vai trò, lọc máy, bắt buộc, nhãn lựa chọn thủ công] */
const TBV={BM04:[["chinh","Thiết bị đóng gói chính",m=>m.n==="R"||m.n==="LG",1,TAY],["date","Máy in date",m=>/date/i.test(m.ten),1],["ep","Máy ép / hàn miệng túi (nếu có)",m=>/hàn miệng|ép|seal/i.test(m.ten)&&m.n!=="L"]],
  BM06:[["chinh","Máy chiết rót chính",m=>/chiết/i.test(m.ten),1,TAY],["seal","Máy seal nắp",m=>/seal/i.test(m.ten),1],["date","Máy in date",m=>/date/i.test(m.ten),1],["nhan","Dán nhãn",m=>/dán nhãn/i.test(m.ten),1,"Dán thủ công"]]};
const tbMiss=(loai,tb)=>(TBV[loai]||[]).map((r,i)=>r[3]&&!((tb||[])[i]||{}).ten?r[1]:"").filter(Boolean);
TBV.BM05G=[TBV.BM04[0]];TBV.BM05C=[TBV.BM06[0]];
function tbInit(loai,d){if(Array.isArray(d.tb)&&d.tb.length)return d.tb;const codes=String(d.maMay||"").split(/\s*[,;]\s*/).filter(Boolean);
  return TBV[loai].map(([k,vai,f],i)=>{const m=TB_DG.find(x=>codes.includes(x.ma)&&f(x));if(m)return {k,vai,ma:m.ma,ten:m.ten};if(i===0&&d.mayTen===TAY)return {k,vai,ma:"",ten:TAY};return {k,vai,ma:"",ten:""}})}
function tbHtml(loai,D,tb,dis){const ex=(D.may||[]).filter(m=>!TB_DG.some(x=>x.ma===m.ma));
  return `<div class="dgx"><table><thead><tr><th style="width:38%">Thiết bị</th><th>Mã — tên thiết bị</th></tr></thead><tbody>${TBV[loai].map(([k,vai,f,req,man],i)=>{const t=tb[i]||{},L=TB_DG.filter(f).concat(ex),cur=man&&t.ten===man?"__tay":t.ma;
    return `<tr><td>${esc(vai)}${req?' <b style="color:#c62828" title="Bắt buộc chọn">*</b>':""}</td><td><select data-tb="${i}" ${dis}${req?' data-req="1"':""}><option value="">${req?"— chọn (bắt buộc) —":"— không dùng —"}</option>${man?`<option value="__tay"${cur==="__tay"?" selected":""}>${esc(man)}</option>`:""}${L.map(m=>`<option value="${esc(m.ma)}"${m.ma===cur?" selected":""}>${esc(m.ma)} — ${esc(m.ten)}</option>`).join("")}${t.ma&&!L.some(m=>m.ma===t.ma)?`<option value="${esc(t.ma)}" selected>${esc(t.ma)} — ${esc(t.ten)}</option>`:""}</select></td></tr>`}).join("")}</tbody></table></div>`}
function tbRead(loai,D,w,tb){w.querySelectorAll("[data-tb]").forEach(x=>{const i=+x.dataset.tb,[k,vai,,,man]=TBV[loai][i],v=x.value,m=TB_DG.concat(D.may||[]).find(y=>y.ma===v);tb[i]={k,vai,ma:v==="__tay"?"":v,ten:v==="__tay"?(man||TAY):m?m.ten:""}});return tb}

const CR={BM04:[["Nhãn phụ, tem",[["np","Nhãn phụ: đúng chủng loại"],["tem","Tem: đúng chủng loại, đúng vị trí"]]],["Nhãn gói",[["ng","Đúng chủng loại"],["han","Đường hàn, cạnh biên, vết xé túi"],["vs","Vệ sinh bao bì"]]],["Mối ép nhiệt",[["ep","Nhiệt độ ép (°C)",1],["dinh","Mối ép dính đều"],["luc","Thử lực không bị bung, xì chảy"]]],["Thùng carton",[["nt","Nhãn dán thùng đúng loại"],["dut","Đủ gói/ thùng"],["duh","Đủ gói/ hộp"]]],["In phun",[["in1","NSX/SL: in đúng"],["in2","In rõ ràng, ngay ngắn trên gói"]]]],
  BM06:[["Nhãn phụ, tem",[["np","Nhãn phụ: đúng chủng loại"],["tem","Tem: đúng chủng loại, dán đúng vị trí"]]],["Nhãn chai",[["nc","Đúng chủng loại"],["phang","Nhãn phẳng, không nhăn, không dùn"],["vs","Vệ sinh bao bì"]]],["Seal",[["seal","Công suất seal (%)",1],["sd","Seal dính đều"]]],["Thùng carton",[["nt","Nhãn dán thùng đúng loại"],["dut","Đủ chai/ thùng"],["coc","Đủ cốc đong/ thùng"]]],["In phun",[["in1","NSX/SL: in đúng"],["in2","In rõ ràng, ngay ngắn trên nhãn"]]]]};
const NS={BM04:10,BM06:12},TEN={BM04:"PHIẾU KIỂM TRA QUÁ TRÌNH<br>ĐÓNG GÓI",BM06:"PHIẾU KIỂM TRA QUÁ TRÌNH<br>ĐÓNG CHAI"};
/* số vòi của máy chính (đọc từ tên máy, VD "Máy chiết rót 6 vòi") → số mẫu cân mỗi lần: ≤10 vòi: 10 mẫu, >10 vòi: bằng số vòi */
const voiOf=tb=>{for(const t of (tb||[])){const m=/(\d+)\s*vòi/i.exec((t&&t.ten)||"");if(m&&+m[1]>0)return +m[1]}return 0};
const nsOf=(loai,d)=>{const V=voiOf(d&&d.tb);return V?Math.max(10,V):NS[loai]};
const mLb=(loai,d,j)=>{const V=voiOf(d&&d.tb);return V?"Vòi "+((j%V)+1):loai==="BM06"?"vòi "+(j+1):""};
const RL=["Đầu ca","Sau 2h tiếp theo","Sau 2h tiếp theo","Sau 2h tiếp theo"];
function fKT(D,loai,p){const I=info(D),f5=b05(D),c5=f5?c05(f5.d):{},canW=can.phieu(),dis=canW?"":"disabled",qc=S.me&&S.me.qc;
  const d=Object.assign({ngay:today(),ca:"Hành chính",maMay:f5?f5.d.maMay:"",mayTen:f5?f5.d.mayTen:"",cach:"tong",tMin:isFinite(c5.tMin)?Math.round(c5.tMin*100)/100:"",tMax:isFinite(c5.tMax)?Math.round(c5.tMax*100)/100:"",nMin:isFinite(c5.nMin)?Math.round(c5.nMin*100)/100:"",nMax:isFinite(c5.nMax)?Math.round(c5.nMax*100)/100:"",rounds:[{gio:"07:30",c:{},v:{},e:{},kl:[]}],kph:{loi:"",sl:"",kp:"",tg:""}},p?JSON.parse(JSON.stringify(p.d)):{}),crit=CR[loai];
  let kl=p?p.kl:"";d.tb=tbInit(loai,d);let n=nsOf(loai,d);
  d.rounds.forEach(r=>{r.e=r.e||{}});
  const sel=(r,k)=>{const R0=d.rounds[r],kd=R0.c[k]==="Không đạt";return `<select data-r="${r}" data-k="${k}" ${dis}><option value=""></option><option${R0.c[k]==="Đạt"?" selected":""}>Đạt</option><option${kd?" selected":""}>Không đạt</option><option${R0.c[k]==="Không kiểm"?" selected":""}>Không kiểm</option></select><input data-r="${r}" data-e="${k}" value="${esc(R0.e[k]||"")}" placeholder="Lỗi / lý do" ${dis} style="margin-top:4px;font-size:12.5px;${kd?"":"display:none"}">`};
  const lim=()=>d.cach==="thuoc"?[num(d.tMin),num(d.tMax)]:[num(d.nMin),num(d.nMax)];
  const body=()=>{const R=d.rounds,[lo,hi]=lim();
    return `<div class="dgx"><table><thead><tr><th>Tiêu chí / Danh mục</th>${R.map((r,i)=>`<th>${RL[i]||"Lần "+(i+1)}<br><input data-g="${i}" type="time" value="${esc(r.gio||"")}" ${dis} style="width:105px"><label style="display:flex;gap:4px;align-items:center;justify-content:center;font-weight:400;font-size:12.5px;margin-top:4px"><input type="checkbox" data-nk="${i}" ${r.nk?"checked":""} ${dis}>Không kiểm</label></th>`).join("")}</tr></thead><tbody>
     ${crit.map(([g,items])=>`<tr><td colspan="${R.length+1}" style="background:var(--accent-soft);font-weight:700">${esc(g)}</td></tr>`+items.map(([k,t,isV])=>`<tr><td>${esc(t)}</td>${R.map((r,i)=>r.nk?'<td class="note" style="text-align:center">—</td>':`<td>${isV?`<input data-r="${i}" data-v="${k}" value="${esc(r.v[k]||"")}" ${dis} style="width:80px">`:sel(i,k)}</td>`).join("")}</tr>`).join("")).join("")}
     <tr><td colspan="${R.length+1}" style="background:var(--accent-soft);font-weight:700">Thuốc — ${d.cach==="thuoc"?"trọng lượng thuốc (đã trừ bì, g)":"tổng trọng lượng "+(loai==="BM04"?"gói":"chai")+" (gồm bao bì, g)"}, ${n} mẫu/lần${isFinite(lo)&&isFinite(hi)?` · cho phép ${f2(lo)} – ${f2(hi)} g`:""}</td></tr>
     ${Array.from({length:n},(_,j)=>`<tr><td>Mẫu ${j+1}${mLb(loai,d,j)?" <small class=\"note\">("+mLb(loai,d,j)+")</small>":""}</td>${R.map((r,i)=>{if(r.nk)return '<td class="note" style="text-align:center">—</td>';const v=num(r.kl[j]),bad=isFinite(v)&&isFinite(lo)&&isFinite(hi)&&(v<lo||v>hi);return `<td><input data-r="${i}" data-s="${j}" type="text" inputmode="decimal" autocomplete="off" value="${esc(r.kl[j]??"")}" ${dis} class="${bad?"in-bad":isFinite(v)&&isFinite(lo)&&isFinite(hi)?"in-ok":""}"></td>`}).join("")}</tr>`).join("")}
     </tbody></table></div>`};
  const w=dlg(`<h2>${loai==="BM04"?"Phiếu kiểm tra quá trình đóng gói (BM.04)":"Phiếu kiểm tra quá trình đóng chai (BM.06)"} · ${esc(I.o.so)}</h2><p class="note">${esc(I.tenSP)} · lô BTP ${esc(I.b.lo||"")}. Tần suất: ${n} mẫu/lần — đầu ca, định kỳ sau mỗi 2 h. ${f5?"Trọng lượng cho phép lấy từ phiếu BM.05.":"Chưa có phiếu BM.05 — nhập trọng lượng cho phép bên dưới."}</p>
   <div class="two">${inp("fkLoB","Số lô BTP",d.loBTP||I.b.lo||"",dis)}${inp("fkNsxB","NSX BTP",String(d.nsxBTP||I.b.nsx||"").slice(0,10),`type="date" ${dis}`)}</div><div class="two">${inp("fkNgay","Ngày đóng gói",d.ngay,`type="date" ${dis}`)}<label>Ca làm việc<select id="fkCa" ${dis}>${(["Hành chính","Tăng ca"].concat(d.ca&&!["Hành chính","Tăng ca"].includes(d.ca)?[d.ca]:[])).map(x=>`<option${x===d.ca?" selected":""}>${esc(x)}</option>`).join("")}</select></label></div>
   <b style="display:block;margin-top:8px">Thiết bị sử dụng</b>${tbHtml(loai,D,d.tb,dis)}
   <label>Cách cân mẫu<select id="fkCach" ${dis}><option value="tong"${d.cach!=="thuoc"?" selected":""}>Cân tổng (gồm bao bì)</option><option value="thuoc"${d.cach==="thuoc"?" selected":""}>Chỉ cân trọng lượng thuốc (đã trừ bì)</option></select></label>
   <div class="two">${inp("fkTmin","TL thuốc cho phép từ (g)",d.tMin,`type="number" step="any" ${dis}`)}${inp("fkTmax","đến (g)",d.tMax,`type="number" step="any" ${dis}`)}</div>
   <div class="two">${inp("fkNmin","Tổng TL gồm bao bì từ (g)",d.nMin,`type="number" step="any" ${dis}`)}${inp("fkNmax","đến (g)",d.nMax,`type="number" step="any" ${dis}`)}</div>
   <div id="fkT">${body()}</div>${canW?`<div class="kh-bar" style="margin-top:6px"><button class="btn small" type="button" id="fkAdd">+ Thêm lần kiểm (sau 2 h)</button><button class="btn small" type="button" id="fkDel">− Bớt lần cuối</button></div>`:""}
   <b style="display:block;margin-top:8px">Sự không phù hợp (nếu có)</b>
   <div class="two">${inp("fkLoi","Lỗi",d.kph.loi,dis)}${inp("fkSl","Số lượng lỗi",d.kph.sl,dis)}</div><div class="two">${inp("fkKp","Sự khắc phục",d.kph.kp,dis)}${inp("fkTg","Thời gian",d.kph.tg,dis)}</div>
   <label>Kết luận <small class="note">(QC)</small>${DD("fkKL",kl,canW&&qc?"":"disabled")}</label>
   ${p?`<p class="note">Lưu lần cuối: ${esc(p.nguoi)} · ${esc(p.luc)}</p>`:""}<div class="actions">${B().btn4(canW,!!p)}</div>`);
  const bind=()=>{w.querySelectorAll("#fkT [data-k]").forEach(x=>x.onchange=()=>{d.rounds[+x.dataset.r].c[x.dataset.k]=x.value;const e=x.nextElementSibling;if(e){e.style.display=x.value==="Không đạt"?"":"none";e.placeholder="Lỗi / lý do";if(x.value==="Không đạt")e.focus()}});w.querySelectorAll("#fkT [data-e]").forEach(x=>x.oninput=()=>{d.rounds[+x.dataset.r].e[x.dataset.e]=x.value});
    w.querySelectorAll("#fkT [data-v]").forEach(x=>x.oninput=()=>{d.rounds[+x.dataset.r].v[x.dataset.v]=x.value});
    w.querySelectorAll("#fkT [data-s]").forEach(x=>x.oninput=()=>{d.rounds[+x.dataset.r].kl[+x.dataset.s]=x.value;const [lo,hi]=lim();window.inMark&&inMark(x,x.value,lo,hi)});
    w.querySelectorAll("#fkT [data-g]").forEach(x=>x.oninput=()=>{d.rounds[+x.dataset.g].gio=x.value});
    w.querySelectorAll("#fkT [data-nk]").forEach(x=>x.onchange=()=>{const r=d.rounds[+x.dataset.nk];r.nk=x.checked;rer()});
    w.querySelectorAll("#fkT [data-nkl]").forEach(x=>x.oninput=()=>{d.rounds[+x.dataset.nkl].nkLy=x.value})};bind();
  const rer=()=>{$("fkT").innerHTML=body();bind()};
  w.addEventListener("change",e=>{if(e.target.matches&&e.target.matches("[data-tb]")){e.target.classList.remove("in-bad");tbRead(loai,D,w,d.tb);const m=nsOf(loai,d);if(m!==n){n=m;toast(voiOf(d.tb)?`Máy ${voiOf(d.tb)} vòi → ${n} mẫu mỗi lần kiểm`:`${n} mẫu mỗi lần kiểm`)}rer()}});
  $("fkT").addEventListener("keydown",e=>{const x=e.target;if(!x.matches||!x.matches("input[data-s]"))return;const K={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1],Enter:[0,1]}[e.key];if(!K)return;
    const A=[...$("fkT").querySelectorAll("input[data-s]")].filter(i=>!i.disabled),r=+x.dataset.r,c=+x.dataset.s,at=(rr,cc)=>A.find(i=>+i.dataset.r===rr&&+i.dataset.s===cc),R=[...new Set(A.map(i=>+i.dataset.r))].sort((a,b)=>a-b);
    let t=null;if(K[0]){const nr=R[R.indexOf(r)+K[0]];if(nr!=null)t=at(nr,c)}else{t=at(r,c+K[1]);if(!t&&e.key==="Enter"){const nr=R[R.indexOf(r)+1];if(nr!=null)t=at(nr,0)}}
    e.preventDefault();if(t&&t!==x){t.focus();t.select&&t.select()}});
  ["fkNmin","fkNmax","fkTmin","fkTmax","fkCach"].forEach(id=>$(id).addEventListener("change",()=>{d.nMin=$("fkNmin").value;d.nMax=$("fkNmax").value;d.tMin=$("fkTmin").value;d.tMax=$("fkTmax").value;d.cach=$("fkCach").value;rer()}));
  if(canW){$("fkAdd").onclick=()=>{if(d.rounds.length>=4)return toast("Tối đa 4 lần kiểm / phiếu — lập phiếu mới cho ca sau.");const l=d.rounds[d.rounds.length-1],m=/(\d+):(\d+)/.exec(l.gio||"");d.rounds.push({gio:m?String((+m[1]+2)%24).padStart(2,"0")+":"+m[2]:"",c:{},v:{},e:{},kl:[]});rer()};
    $("fkDel").onclick=()=>{if(d.rounds.length>1){d.rounds.pop();rer()}}}
  const g=()=>{Object.assign(d,{loBTP:$("fkLoB").value.trim(),nsxBTP:$("fkNsxB").value,ngay:$("fkNgay").value,ca:$("fkCa").value.trim(),tb:tbRead(loai,D,w,d.tb),cach:$("fkCach").value,tMin:$("fkTmin").value.trim(),tMax:$("fkTmax").value.trim(),nMin:$("fkNmin").value,nMax:$("fkNmax").value,kph:{loi:$("fkLoi").value.trim(),sl:$("fkSl").value.trim(),kp:$("fkKp").value.trim(),tg:$("fkTg").value.trim()}});d.maMay=d.tb.map(t=>t.ma).filter(Boolean).join(", ");d.mayTen=d.tb.map(t=>t.ten).filter(Boolean).join("; ");return d};
  B().btnWire(w,{canW,saved:!!p,dirty:false},async()=>{g();{const M=tbMiss(loai,d.tb);if(M.length){toast("⚠ Bắt buộc chọn thiết bị: "+M.join(", ")+".");const i=TBV[loai].findIndex((r,j)=>r[3]&&!(d.tb[j]||{}).ten),x=w.querySelector('[data-tb="'+i+'"]');if(x){x.classList.add("in-bad");x.focus();setTimeout(()=>x.classList.remove("in-bad"),2500)}return false}}kl=$("fkKL").value;const miss=[];d.rounds.forEach((r,i)=>!r.nk&&Object.keys(r.c).forEach(k=>{if(r.c[k]==="Không đạt"&&!String(r.e[k]||"").trim())miss.push(k)}));if(miss.length){toast("Ghi lỗi / lý do cho các mục Không đạt.");const x=w.querySelector('#fkT [data-e="'+miss[0]+'"]');if(x)x.focus();return false}p=p||{};p.d=JSON.parse(JSON.stringify(d));await save(D,loai,p,p.d,d.ngay,kl)},()=>{g();pKT(I,loai,d,$("fkKL").value)})}
function pKT(I,loai,d,kl){const K=B(),R=d.rounds,n=nsOf(loai,d),th=d.cach==="thuoc",lo=num(th?d.tMin:d.nMin),hi=num(th?d.tMax:d.nMax),tlo=num(d.tMin),thi=num(d.tMax),nlo=num(d.nMin),nhi=num(d.nMax),cw=R.length<=4?11:Math.max(7,Math.floor(46/R.length)),cl=16,cc=100-cw*R.length-cl;
  const why=k=>R.map((r,i)=>{if(r.nk)return "";const e=((r.e||{})[k]||"").trim();return e&&r.c[k]==="Không đạt"?(R.length>1?(RL[i]==="Đầu ca"?"Đầu ca":"Lần "+(i+1))+": ":"")+e:""}).filter(Boolean).join("; ");
  const rows=CR[loai].map(([g,items])=>`<tr class="sec"><td colspan="${R.length+2}">${esc(g)}</td></tr>`+items.map(([k,t,isV])=>`<tr><td>${esc(t)}</td>${R.map(r=>`<td class="c">${r.nk?"—":isV?esc(r.v[k]||""):tick(r.c[k])}</td>`).join("")}<td style="font-size:10.5pt">${isV?"":esc(why(k))}</td></tr>`).join("")).join("");
  const sw=Math.floor(73/n);
  const klT=`<table class="kl8"><colgroup><col style="width:27%">${Array.from({length:n},()=>`<col style="width:${sw}%">`).join("")}</colgroup><tr><th>Lần kiểm</th>${Array.from({length:n},(_,j)=>`<th>${j+1}${voiOf(d.tb)?`<br><small style="font-weight:400">V${(j%voiOf(d.tb))+1}</small>`:""}</th>`).join("")}</tr>${R.map((r,i)=>`<tr><td>${RL[i]||"Lần "+(i+1)}${r.gio?" ("+esc(r.gio)+")":""}</td>${r.nk?`<td colspan="${n}" class="c"><i>Không kiểm</i></td>`:Array.from({length:n},(_,j)=>{const v=num(r.kl[j]),bad=isFinite(v)&&isFinite(lo)&&isFinite(hi)&&(v<lo||v>hi);return `<td class="c">${isFinite(v)?(Math.round(v*10)/10).toFixed(1)+(bad?"*":""):""}</td>`}).join("")}</tr>`).join("")}</table>`;
  K.pr(`${K.PCSS}<style>${(()=>{const L=R.length+Math.max(0,((d.tb||[]).length||1)-1)+((d.skph&&d.skph.length)?1:0),f=L<=2?14:L<=4?13.5:L<=5?13:12.5,p=L<=3?"2px 5px":"1px 4px";return `.pq{font-size:${f}pt;line-height:1.12}.pq td,.pq th{padding:${p};font-size:${f}pt}.pq .kl8 td,.pq .kl8 th{font-size:${Math.min(f,13)}pt!important;padding:3px 2px!important}`})()}.pq .hd td{font-size:revert}.pq .hd .lg img{height:16mm}.pq .kl8 td,.pq .kl8 th{font-size:11.5pt;padding:2px 2px}.pq .sg .nm{height:13mm}.pq th.rth{font-size:11pt!important;font-weight:700;line-height:1.12;padding:2px 2px!important}.pq .sg{margin-top:6px}</style><div class="pq">${K.head(TEN[loai],META(loai==="BM04"?"BM.04-QC-QT.04":"BM.06-QC-QT.04"))}
  <table style="margin-top:4px"><colgroup><col style="width:50%"><col style="width:50%"></colgroup>
   <tr><td colspan="2">Tên sản phẩm: <b>${esc(I.tenSP)}</b></td></tr>
   <tr><td>Ngày đóng gói: <b>${dmy(d.ngay)}</b>${d.ca?" · Ca: <b>"+esc(d.ca)+"</b>":""}</td><td>Số LĐG: <b>${esc(I.o.so)}</b></td></tr>
   <tr><td>Số lô BTP: <b>${esc(d.loBTP||I.b.lo||"")}</b></td><td>Ngày sản xuất: <b>${(d.nsxBTP||I.b.nsx)?dmy(String(d.nsxBTP||I.b.nsx).slice(0,10)):""}</b></td></tr>
   <tr><td>Trọng lượng thuốc cho phép (g): <b>${isFinite(tlo)?f2(tlo):""}${isFinite(thi)?" – "+f2(thi):""}</b></td><td>Tổng TL (gồm bao bì) (g): <b>${isFinite(nlo)?f2(nlo):""}${isFinite(nhi)?" – "+f2(nhi):""}</b></td></tr>
   ${tbInit(loai,d).filter((t,i)=>i===0||t.ten).map(t=>`<tr><td>${esc(t.vai.replace(/ \(nếu có\)/,""))}: <b>${esc(t.ten)}</b></td><td>Mã thiết bị: <b>${esc(t.ma||(t.ten===TAY?"—":""))}</b></td></tr>`).join("")}
   <tr><td>Tần suất kiểm tra: ${n} mẫu/lần — đầu ca, định kỳ sau mỗi 2 h</td><td>Đạt (☑), không đạt (☒), không kiểm (—)</td></tr></table>
  <table style="margin-top:4px"><colgroup><col style="width:${cc}%">${R.map(()=>`<col style="width:${cw}%">`).join("")}<col style="width:${cl}%"></colgroup><tr><th>Tiêu chí / Danh mục kiểm tra</th>${R.map((r,i)=>`<th class="rth">${RL[i]||"Lần "+(i+1)}${r.gio?"<br>"+esc(r.gio):""}${r.nk?`<br><span style="font-weight:400;font-style:italic">Không kiểm</span>`:""}</th>`).join("")}<th>Lỗi / lý do</th></tr>${rows}</table>
  <p style="margin:4px 0 2px"><b>Thuốc:</b> ${th?"trọng lượng thuốc (đã trừ bì) (g)":"tổng trọng lượng "+(loai==="BM04"?"gói":"chai")+" (gồm bao bì) (g)"} — khối lượng từng mẫu${voiOf(d.tb)?` (máy ${voiOf(d.tb)} vòi: V1…V${voiOf(d.tb)} là thứ tự vòi${voiOf(d.tb)<n?", lặp lại cho đủ "+n+" mẫu":""})`:loai==="BM06"?" (mỗi mẫu tương ứng thứ tự 1 vòi thuốc)":""}; (*) ngoài khoảng cho phép</p>${klT}
  <table style="margin-top:4px"><colgroup><col style="width:25%"><col style="width:25%"><col style="width:25%"><col style="width:25%"></colgroup><tr class="sec"><td colspan="4">Sự không phù hợp</td></tr><tr><td>Lỗi (nếu có): ${esc(d.kph.loi)}</td><td>Số lượng lỗi: ${esc(d.kph.sl)}</td><td>Sự khắc phục: ${esc(d.kph.kp)}</td><td>Thời gian: ${esc(d.kph.tg)}</td></tr></table>
  <p style="margin:4px 0"><b>Kết luận:</b> ${K.box(kl==="Đạt")} Đạt &nbsp;&nbsp; ${K.box(kl==="Không đạt")} Không đạt</p>
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
   ${sua?(()=>{const H=cbbList().filter(x=>x.qc===v.qc).slice().reverse();const nm={klBB:"Bao bì gói/chai",klHop:"Hộp / thùng nhỏ rỗng",klThung:"Thùng carton rỗng"};return `<details style="margin-top:10px"${H.length?" open":""}><summary><b>Lịch sử cân bao bì (QC)</b> · ${H.length} lần</summary>${H.length?`<div class="dgx" style="max-height:220px;overflow:auto"><table><thead><tr><th>Ngày cân</th><th>Loại</th><th>Khối lượng</th><th>Người cân</th><th>Số lệnh</th></tr></thead><tbody>${H.map(x=>`<tr><td>${dmy(x.ngay)}</td><td>${nm[x.loai]||x.loai}</td><td style="text-align:right"><b>${f2(x.v)}</b> ${x.dv}</td><td>${esc(x.nguoi)}</td><td>${esc(x.so)}</td></tr>`).join("")}</tbody></table></div>`:`<p class="note">Chưa có lần cân nào — số cân trên BM.05 sẽ tự ghi vào đây, theo dõi riêng từng mã hàng.</p>`}</details>`})():""}
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
/* ===== Bảng định lượng QC-QĐ.04 ===== */
const dlList=()=>(S.dg&&S.dg.dl)||[];
const nrm=x=>String(x||"").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/đ/gi,"d").toLowerCase().replace(/[^a-z0-9]/g,"");
const DL52={g:[[50,"p",7,4],[100,"a",4,2],[200,"p",4,2],[300,"a",8,4],[500,"p",2,1],[1000,"a",15,5],[10000,"p",1,.5],[15000,"a",100,50],[1e12,"p",1,.5]],
            ml:[[50,"p",7,4],[100,"a",4,2],[200,"p",4,2],[300,"a",8,2],[500,"p",2,1],[1000,"a",15,5],[10000,"p",1,.5],[15000,"a",100,50],[1e12,"p",1,.5]]};
const dl52List=()=>(S.dg&&S.dg.dl52&&S.dg.dl52.length)?S.dg.dl52:["g","ml"].flatMap(dv=>DL52[dv].map((r,i,A)=>({dv,tu:i?A[i-1][0]:5,den:r[0]>=1e12?"":r[0],loK:r[1]==="p"?"%":"đv",lo:r[2],hiK:r[1]==="p"?"%":"đv",hi:r[3]})));
/* trả mức định lượng theo QĐ.04 cho quy cách q: {qn,dv,lo,std,hi,src,ten,warn} (đơn vị g hoặc ml của sản phẩm) */
function dlOf(q,mode){if(!q)return null;mode=mode||"auto";const u=String(q.dvl||"").trim().toLowerCase(),v=+q.luong||0;if(!(v>0))return null;
  const dv=/^(ml|l|lít)/.test(u)?"ml":"g",qn=/^(l|lít)$/.test(u)||u==="kg"?v*1000:v,sp=nrm(q.sp);
  const r=sp&&dlList().find(x=>nrm(x.sp)===sp&&Math.abs(+x.qn-qn)<1e-6&&x.dv===dv);
  if(r&&mode!=="52")return {qn,dv,lo:+r.lo,std:+r.std,hi:+r.hi,src:"mục 5.1",ten:r.sp,warn:+r.std<qn};
  if(mode==="51")return null;
  const T=dl52List().filter(x=>x.dv===dv),R=T.find(x=>qn>+x.tu&&(x.den===""||x.den==null||qn<=+x.den));if(!R)return null;const f=(t,k)=>t==="%"?qn*k/100:+k,lo=Math.round((qn-f(R.loK,R.lo))*100)/100,hi=Math.round((qn+f(R.hiK,R.hi))*100)/100;
  return {qn,dv,lo,std:qn,hi,src:"mục 5.2",ten:"",warn:false}}
/* đổi sang gram thuốc: lỏng × tỷ trọng */
const dlG=(L,tt)=>{if(!L)return null;const k=L.dv==="ml"?Math.round((+tt||0)*1000)/1000:1;if(!(k>0))return null;const e=1e-9,up=x=>Math.ceil(x*k*10-e)/10,dn=x=>Math.floor(x*k*10+e)/10,rd=x=>Math.round(x*k*10)/10;return {lo:up(L.lo),std:rd(L.std),hi:dn(L.hi),k}};
const dlTxt=(L,tt)=>{if(!L)return "";const G=dlG(L,tt),u=L.dv;return `Theo QC-QĐ.04 ${L.src}${L.ten?" ("+esc(L.ten)+")":""}: ${f2(L.qn)} ${u} → ${f2(L.lo)} – ${f2(L.hi)} ${u} (chuẩn ${f2(L.std)})${u==="ml"?(G?` × tỷ trọng ${(+tt).toFixed(3).replace(".",",")} = <b>${f2(G.lo)} – ${f2(G.hi)} g</b> (chuẩn ${f2(G.std)} g)`:" — cần tỷ trọng để quy ra gram"):""}${L.warn?` <span style="color:#c0392b;font-weight:700">⚠ mức chuẩn thấp hơn danh định ${f2(L.qn)} ${u} (TT 21/2014: trung bình lô phải ≥ danh định)</span>`:""}`};
const dlNone=m=>m==="51"?'<span style="color:#b45309;font-weight:700">⚠ Sản phẩm này không có trong mục 5.1 (tên riêng) — chọn Mục 5.2 hoặc nhập tay.</span>':m==="52"?'<span style="color:#b45309;font-weight:700">⚠ Quy cách này không nằm trong khoảng nào của mục 5.2.</span>':'<span style="color:#b45309">Không tìm thấy định lượng trong QC-QĐ.04 — nhập tay theo phiếu R&amp;D / yêu cầu khách.</span>';
const f1=v=>v===""||v==null||!isFinite(+String(v).replace(",","."))?(v??""):(+String(v).replace(",",".")).toFixed(1);
function dlDlg(){const ed=!!(S.me&&S.me.ten==="Nguyễn Ô Ghel"&&S.me.vaiTro==="Quản lý");let L=dlList().map(x=>Object.assign({},x)),mode="xem";
  let tab="51",L2=dl52List().map(x=>Object.assign({},x));
  const w=dlg(`<h2 id="dlTt">Bảng định lượng QC-QĐ.04</h2><div style="display:flex;gap:6px;margin:4px 0 6px"><button class="btn small" type="button" data-tab="51">Mục 5.1 · Sản phẩm tên riêng</button><button class="btn small" type="button" data-tab="52">Mục 5.2 · Hàng gia công</button></div>
   <p class="note">Đơn vị: g hoặc ml của sản phẩm. BM.05 tự lấy theo tên sản phẩm + quy cách; hàng lỏng nhân tỷ trọng ra gram. ${ed?"":"<b>Chỉ Trưởng phòng QA/QC được sửa — bạn chỉ xem.</b>"}</p>
   <div style="display:flex;gap:8px;align-items:center;margin:6px 0;flex-wrap:wrap"><input id="dlQ" placeholder="Tìm sản phẩm…" style="max-width:260px" autocomplete="off"><span class="note" id="dlN"></span><span style="flex:1"></span>${ed?`<button class="btn" type="button" id="dlAdd" style="display:none">＋ Thêm dòng</button><button class="btn" type="button" id="dlMode">✎ Sửa bảng</button>`:""}</div>
   <div class="dlw" style="max-height:62vh;overflow:auto;border:1px solid var(--line,#d5dde8);border-radius:10px"><table class="dlt"><thead id="dlH"></thead><tbody id="dlB"></tbody></table></div>
   <div class="actions"><button class="btn" type="button" data-x>Đóng</button>${ed?`<button class="btn primary" type="button" id="dlOk" style="display:none">Lưu bảng</button>`:""}</div>`);
  const box=w.querySelector(".cfm-box");box.style.setProperty("max-width","min(1100px,96vw)","important");box.style.width="min(1100px,96vw)";
  const stl=document.createElement("style");stl.textContent=`
   .dlt{width:100%;border-collapse:separate;border-spacing:0;font-size:15px}
   .dlt thead th{position:sticky;top:0;z-index:3;background:#1f5f4a;color:#fff;font-weight:700;padding:9px 8px;text-align:center;border-bottom:2px solid #174a39}
   .dlt thead th.c-lo{background:#b45309}.dlt thead th.c-std{background:#1b7a3a}.dlt thead th.c-hi{background:#1a5fb4}
   .dlt td{padding:7px 8px;border-bottom:1px solid var(--line,#e3e8ef);text-align:center;color:var(--ink,#1b1f24);background:var(--surface,#fff)!important}
   .dlt td.sp{text-align:left;font-weight:700;border-right:1px solid var(--line,#e3e8ef);vertical-align:top;background:rgba(127,140,160,.08)!important}
   .dlt td.c-lo{background:rgba(234,120,20,.12)!important}.dlt td.c-std{background:rgba(30,150,70,.15)!important;font-weight:800;font-size:16px}.dlt td.c-hi{background:rgba(40,100,220,.12)!important}
   .dlt tr.g1 td{border-top:2px solid var(--line,#c9d3df)}
   .dlt tr.bad td.c-std,.dlt tr.bad td.c-lo,.dlt tr.bad td.c-hi{background:rgba(217,48,37,.2)!important;color:#d93025!important}
   .dlt td.gc{opacity:.8;font-size:13px;text-align:left}
   .dlt input,.dlt select{font-size:15px;padding:5px 6px;text-align:center;width:100%;box-sizing:border-box}.dlt td.sp input{text-align:left;font-weight:700}
   .dlt.edit td{padding:4px}.dlt .rm{padding:2px 8px}`;box.appendChild(stl);
  const f1v=v=>{const n=+String(v??"").replace(",",".");return String(v??"").trim()===""||!isFinite(n)?"":n.toFixed(1).replace(".",",")};
  const isBad=x=>(+x.std>0&&+x.qn>0&&+x.std<+x.qn)||(+x.lo>0&&+x.std>0&&+x.hi>0&&!(+x.lo<=+x.std&&+x.std<=+x.hi));
  const sel=(k,v)=>`<select data-k="${k}">${["%","đv"].map(o=>`<option value="${o}"${o===v?" selected":""}>${o==="%"?"%":"g/ml"}</option>`).join("")}</select>`;
  const nf=v=>{const n=+String(v??"").replace(",",".");return String(v??"").trim()===""||!isFinite(n)?"":String(Math.round(n*1000)/1000).replace(".",",")};
  const draw52=()=>{const T=w.querySelector(".dlt");T.classList.toggle("edit",mode==="sua");$("dlQ").style.display="none";
    const sym=d=>d==="g"?"A":"B",u=d=>d==="g"?"g":"ml",lv=(d,k,v,sg)=>`${sym(d)} ${sg} ${nf(v)}${k==="%"?"%":" "+u(d)}`;
    if(mode==="xem"){$("dlH").innerHTML=`<tr><th>Dạng</th><th>Quy cách danh nghĩa</th><th class="c-lo">Mức dưới</th><th class="c-std">Mức chuẩn</th><th class="c-hi">Mức trên</th></tr>`;
      let h="";["g","ml"].forEach(d=>{const R=L2.filter(x=>x.dv===d).sort((a,b)=>a.tu-b.tu);R.forEach((x,m)=>{h+=`<tr class="${m===0?"g1":""}">${m===0?`<td class="sp" rowspan="${R.length}">${d==="g"?"5.2.1 Dạng rắn<br><span style='font-weight:400'>A (gram)</span>":"5.2.2 Dạng lỏng<br><span style='font-weight:400'>B (ml)</span>"}</td>`:""}<td><b>${x.den===""||x.den==null?"Trên "+nf(x.tu):!(+x.tu)?"Đến "+nf(x.den)+" <small style=\"font-weight:400\">(TT 21: chỉ yêu cầu trung bình ≥ danh định – mức nội bộ)</small>":"Trên "+nf(x.tu)+" đến "+nf(x.den)}</b></td><td class="c-lo">${lv(d,x.loK,x.lo,"–")}</td><td class="c-std">${sym(d)}</td><td class="c-hi">${lv(d,x.hiK,x.hi,"+")}</td></tr>`})});
      $("dlB").innerHTML=h;$("dlN").innerHTML=`${L2.length} khoảng · áp dụng cho hàng gia công và sản phẩm chưa có trong mục 5.1`}
    else{$("dlH").innerHTML=`<tr><th style="width:9%">Dạng</th><th>Trên (A &gt;)</th><th>Đến (A ≤)</th><th class="c-lo" colspan="2">Mức dưới (trừ)</th><th class="c-hi" colspan="2">Mức trên (cộng)</th><th></th></tr>`;
      $("dlB").innerHTML=L2.map((x,i)=>`<tr data-j="${i}"><td><select data-k="dv">${["g","ml"].map(o=>`<option${o===x.dv?" selected":""}>${o}</option>`).join("")}</select></td><td><input data-k="tu" inputmode="decimal" value="${esc(nf(x.tu))}"></td><td><input data-k="den" inputmode="decimal" placeholder="(không giới hạn)" value="${esc(nf(x.den))}"></td><td class="c-lo"><input data-k="lo" inputmode="decimal" value="${esc(nf(x.lo))}"></td><td class="c-lo">${sel("loK",x.loK)}</td><td class="c-hi"><input data-k="hi" inputmode="decimal" value="${esc(nf(x.hi))}"></td><td class="c-hi">${sel("hiK",x.hiK)}</td><td><button class="btn small rm" type="button" data-del2="${i}">✕</button></td></tr>`).join("");$("dlN").textContent=L2.length+" khoảng"}};
  const draw=()=>{w.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("primary",b.dataset.tab===tab));if(tab==="52")return draw52();$("dlQ").style.display="";const q=nrm($("dlQ").value),T=w.querySelector(".dlt");T.classList.toggle("edit",mode==="sua");
    const idx=L.map((x,i)=>i).filter(i=>!q||nrm(L[i].sp).includes(q));
    if(mode==="xem"){$("dlH").innerHTML=`<tr><th style="width:28%">Sản phẩm</th><th>Quy cách</th><th class="c-lo">Mức dưới</th><th class="c-std">Mức chuẩn</th><th class="c-hi">Mức trên</th><th>Khoảng cho phép</th><th>Ghi chú</th></tr>`;
      let h="",k=0;while(k<idx.length){const sp=L[idx[k]].sp;let n=1;while(k+n<idx.length&&L[idx[k+n]].sp===sp)n++;
        for(let m=0;m<n;m++){const x=L[idx[k+m]],u=x.dv;h+=`<tr class="${m===0?"g1":""} ${isBad(x)?"bad":""}">${m===0?`<td class="sp" rowspan="${n}">${esc(sp)}</td>`:""}<td><b>${f1v(x.qn).replace(/,0$/,"")} ${u}</b></td><td class="c-lo">${f1v(x.lo)}</td><td class="c-std">${f1v(x.std)}</td><td class="c-hi">${f1v(x.hi)}</td><td>${f1v(x.lo)} – ${f1v(x.hi)} ${u}</td><td class="gc">${esc(x.gc||"")}${isBad(x)?`<div style="color:#a50e0e;font-weight:700">⚠ chuẩn &lt; danh định</div>`:""}</td></tr>`}
        k+=n}
      $("dlB").innerHTML=h||`<tr><td colspan="7" class="note">Không có dòng nào</td></tr>`}
    else{$("dlH").innerHTML=`<tr><th style="width:26%">Sản phẩm</th><th style="width:9%">Quy cách</th><th style="width:8%">ĐVT</th><th class="c-lo">Mức dưới</th><th class="c-std">Mức chuẩn</th><th class="c-hi">Mức trên</th><th>Ghi chú</th><th></th></tr>`;
      $("dlB").innerHTML=idx.map(i=>{const x=L[i];return `<tr data-i="${i}" class="${isBad(x)?"bad":""}"><td class="sp"><input data-k="sp" value="${esc(x.sp)}"></td><td><input data-k="qn" inputmode="decimal" value="${esc(f1(x.qn))}"></td><td><select data-k="dv">${["ml","g"].map(u=>`<option${u===x.dv?" selected":""}>${u}</option>`).join("")}</select></td>${["lo","std","hi"].map(k=>`<td class="c-${k}"><input data-k="${k}" inputmode="decimal" value="${esc(f1(x[k]))}"></td>`).join("")}<td><input data-k="gc" value="${esc(x.gc||"")}"></td><td><button class="btn small rm" type="button" data-del="${i}" title="Xoá dòng">✕</button></td></tr>`}).join("")}
    const nb=L.filter(isBad).length;$("dlN").innerHTML=`${L.length} dòng · ${new Set(L.map(x=>nrm(x.sp))).size} sản phẩm${nb?` · <span style="color:#c0392b;font-weight:700">${nb} dòng cần xem lại</span>`:""}`};
  draw();$("dlQ").oninput=draw;
  w.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;draw()});
  const up2=e=>{const t=e.target,tr=t.closest("tr");if(!tr||tr.dataset.j==null||!t.dataset.k)return;const x=L2[+tr.dataset.j],k=t.dataset.k;x[k]=["dv","loK","hiK"].includes(k)?t.value:(String(t.value).trim()===""&&k==="den"?"":String(t.value).replace(",","."))};
  $("dlB").addEventListener("input",up2);$("dlB").addEventListener("change",up2);
  $("dlB").addEventListener("click",e=>{const b=e.target.closest("[data-del2]");if(!b)return;L2.splice(+b.dataset.del2,1);draw()});
  $("dlB").addEventListener("input",e=>{const t=e.target,tr=t.closest("tr");if(!tr||!t.dataset.k||tr.dataset.i==null)return;const x=L[+tr.dataset.i];x[t.dataset.k]=["sp","gc","dv"].includes(t.dataset.k)?t.value:String(t.value).replace(",",".");tr.classList.toggle("bad",isBad(x))});
  $("dlB").addEventListener("change",e=>{if(e.target.dataset.k==="dv")L[+e.target.closest("tr").dataset.i].dv=e.target.value});
  $("dlB").addEventListener("focusout",e=>{const t=e.target;if(["qn","lo","std","hi"].includes(t.dataset&&t.dataset.k)&&t.value.trim()!=="")t.value=f1(t.value)});
  $("dlB").addEventListener("click",e=>{const b=e.target.closest("[data-del]");if(!b)return;L.splice(+b.dataset.del,1);draw()});
  if($("dlMode"))$("dlMode").onclick=()=>{mode=mode==="xem"?"sua":"xem";$("dlMode").textContent=mode==="xem"?"✎ Sửa bảng":"👁 Xem bảng";$("dlAdd").style.display=mode==="sua"?"":"none";$("dlOk").style.display=mode==="sua"?"":"none";draw()};
  if($("dlAdd"))$("dlAdd").onclick=()=>{if(tab==="52"){L2.push({dv:"g",tu:"",den:"",loK:"%",lo:"",hiK:"%",hi:""});draw();return}L.unshift({sp:$("dlQ").value.trim(),qn:"",dv:"ml",lo:"",std:"",hi:"",gc:""});$("dlQ").value="";draw();const f=$("dlB").querySelector("input");f&&f.focus()};
  w.querySelector("[data-x]").onclick=()=>w.remove();
  if($("dlOk"))$("dlOk").onclick=async()=>{const b=$("dlOk");b.disabled=true;if(tab==="52"){try{const R=await api("webDL52Save",S.auth,L2);S.dg.dl52=R;L2=R.map(x=>Object.assign({},x));mode="xem";$("dlMode").textContent="✎ Sửa bảng";$("dlAdd").style.display="none";b.style.display="none";draw();toast("Đã lưu bảng mục 5.2 ("+R.length+" khoảng)")}catch(e){toast(e.message)}b.disabled=false;return}try{const R=await api("webDLSave",S.auth,L);S.dg.dl=R;L=R.map(x=>Object.assign({},x));mode="xem";$("dlMode").textContent="✎ Sửa bảng";$("dlAdd").style.display="none";b.style.display="none";draw();toast("Đã lưu bảng định lượng ("+R.length+" dòng)")}catch(e){toast(e.message)}b.disabled=false}}
window.dlDlg=dlDlg;window.dlOf=dlOf;window.dlG=dlG;
window.qcBar=function(box){if(!box||box.querySelector(".qc-bar"))return;
  if(!canQC()){if(!(S.me&&S.me.qc))return;const el=document.createElement("div");el.className="qc-bar";el.style.cssText="margin:8px 0;display:flex;justify-content:flex-end";el.innerHTML=`<button class="btn dl-open" type="button" id="dlOpen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18M3 12h18M3 19h18M9 5v14M15 5v14"/></svg>Bảng định lượng (QC-QĐ.04)</button>`;const tools=box.querySelector(".tools");(tools?tools.parentNode:box).insertBefore(el,tools?tools.nextSibling:box.firstChild);$("dlOpen").onclick=()=>dlDlg();return}
  const T=rdTodo();
  const el=document.createElement("div");el.className="qc-bar";el.style.cssText="margin:8px 0;padding:10px 12px;border:1px solid var(--line,#d5dde8);border-radius:10px";
  el.innerHTML=`<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><b>Danh mục quy cách</b><span class="note">${qcList().length} mã</span><input id="qcFind" list="qcFindL" placeholder="Mã cần sửa…" style="max-width:180px" autocomplete="off"><datalist id="qcFindL">${qcList().map(x=>`<option value="${esc(x.qc)}">${esc(x.sp+" · "+(x.quyCach||""))}</option>`).join("")}</datalist><button class="btn" type="button" id="qcEd">Sửa</button><button class="btn primary" type="button" id="qcAdd">＋ Mã nhãn / quy cách mới</button><span style="flex:1"></span><button class="btn dl-open" type="button" id="dlOpen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18M3 12h18M3 19h18M9 5v14M15 5v14"/></svg>Bảng định lượng (QC-QĐ.04)</button></div>
  ${T.length?`<div style="margin-top:8px"><span class="note">Phiếu thông tin đóng gói R&D có mã / thông số chưa cập nhật:</span> ${T.map((r,i)=>`<button class="btn" type="button" data-rd="${i}">${r.upd?"Cập nhật TL chuẩn ":"Thêm "}${esc(r.qc)}</button>`).join(" ")}</div>`:""}`;
  const tools=box.querySelector(".tools");(tools?tools.parentNode:box).insertBefore(el,tools?tools.nextSibling:box.firstChild);
  $("qcAdd").onclick=()=>qcDlg({dvl:"ml",loai:"gói"},false);
  $("dlOpen").onclick=()=>dlDlg();
  $("qcEd").onclick=()=>{const q=qcFind($("qcFind").value);if(!q)return toast("Không thấy mã "+$("qcFind").value);qcDlg(q,true)};
  el.querySelectorAll("[data-rd]").forEach(b=>b.onclick=()=>{const r=T[+b.dataset.rd];if(r.upd){const q=qcFind(r.qc);qcDlg(Object.assign({},q,{tl:r.tl,ds:r.ds,klBB:r.klBB,nguon:r.nguon}),true)}else qcDlg(r,false)})};
})();
