/* In sau khi vòng xoay "Đang lưu" đã tắt hẳn (tránh treo vòng xoay phía sau hộp thoại in) */
window.khPrintNow=function(pg){let n=0;const go=()=>{const ov=document.getElementById("busyOv");if(ov&&ov.classList.contains("on")&&n++<40)return setTimeout(go,150);
  try{window.print()}catch(e){toast("Không mở được hộp thoại in: "+e.message)}setTimeout(()=>{if(pg)pg.textContent=""},1500)};setTimeout(go,200)};
/* Sổ Kho bản web — KẾ HOẠCH PHỐI TRỘN
 * Kế hoạch gắn với lệnh SX BTP: ngày phối trộn, máy, giờ, ưu tiên, người phối chế, QC.
 * Xem: Theo ngày · Hôm nay · Ngày mai · Kanban · Lịch · Giờ máy · Danh mục máy. Gửi kế hoạch → xưởng xem + copy dán Zalo + in. */
/* Danh sách thiết bị sản xuất theo Bản thuyết minh điều kiện SX (mục 4.1–4.3) — dùng khi chưa khai báo Danh mục máy */
window.MAY_TM=[{"ma": "AHK-17", "ten": "Hệ thống trộn tạo hạt", "dang": "AB, GR, RB, SP, WG, WP", "ghiChu": "Sản lượng: 400-500kg/h"}, {"ma": "AHK-36", "ten": "Máy nghiền búa tự động", "dang": "AB, GR, RB, SP, WG, WP", "ghiChu": "Sản lượng: 400 – 500kg/h"}, {"ma": "AHK-37", "ten": "Máy nghiền búa", "dang": "AB, GR, RB, SP, WG, WP", "ghiChu": "Sản lượng: 200 – 300kg/h"}, {"ma": "AHK-38", "ten": "Máy vo viên tạo hạt", "dang": "AB, GR, RB, SP, WG, WP", "ghiChu": "Sản lượng: 400 – 500kg/h"}, {"ma": "AHK-09", "ten": "Hệ thống máy nghiền tự động Jet Mill", "dang": "AB, GR, RB, SP, WG, WP", "ghiChu": "Sản lượng: 400-500kg/h"}, {"ma": "AHK-34", "ten": "Máy trộn ướt", "dang": "AB, GR, RB, SP, WG, WP", "ghiChu": "Sản lượng: 250kg/h"}, {"ma": "AHK-08", "ten": "Máy đùn tự động dạng cốm", "dang": "AB, GR, RB, SP, WG, WP", "ghiChu": "Sản lượng: 250kg/h"}, {"ma": "AHK-39", "ten": "Máy sấy", "dang": "AB, GR, RB, SP, WG, WP", "ghiChu": "Sản lượng: 100-200kg/mẻ"}, {"ma": "AHK-18", "ten": "Máy sàng rung", "dang": "AB, GR, RB, SP, WG, WP", "ghiChu": "Công suất: 7kW;"}, {"ma": "AHK-41", "ten": "Máy sàng rung", "dang": "AB, GR, RB, SP, WG, WP", "ghiChu": "Công suất: 7kW;"}, {"ma": "AHK-21", "ten": "Máy khuấy phân tán 03 (Có bồn cố định)", "dang": "CS, EC, ME, SL", "ghiChu": "Dung tích: 5000L Tốc độ khuấy: 1000-1500 vòng/phút"}, {"ma": "AHK-20", "ten": "Máy khuấy phân tán 02 (Có bồn cố định)", "dang": "CS, EC, ME, SL", "ghiChu": "Dung tích: 2000L Tốc độ khuấy: 1000-1500 vòng/phút"}, {"ma": "AHK-42", "ten": "Bồn phối trộn, dung tích: 1000L", "dang": "CS, EC, ME, SL", "ghiChu": "Dung tích: 1000L"}, {"ma": "AHK-43", "ten": "Bồn phối trộn, dung tích: 1000L", "dang": "CS, EC, ME, SL", "ghiChu": "Dung tích: 1000L"}, {"ma": "AHK-12", "ten": "Máy nghiền bi ngang", "dang": "FS, OD, SC", "ghiChu": "Thể tích buồng nghiền: 50L Sản lượng: 300-500kg/h"}, {"ma": "AHK-13", "ten": "Máy nghiền bi ngang", "dang": "FS, OD, SC", "ghiChu": "Thể tích buồng nghiền: 50L Sản lượng: 300-500kg/h"}, {"ma": "AHK-14", "ten": "Máy nghiền bi ngang", "dang": "FS, OD, SC", "ghiChu": "Thể tích buồng nghiền: 50L Sản lượng: 300-500kg/h"}, {"ma": "AHK-15", "ten": "Máy nghiền bi ngang", "dang": "FS, OD, SC", "ghiChu": "Thể tích buồng nghiền: 30L Sản lượng: 300-500kg/h"}, {"ma": "AHK-16", "ten": "Máy nghiền bi đứng", "dang": "FS, OD, SC", "ghiChu": "Thể tích buồng nghiền: 30L Sản lượng: 200-400kg/h"}, {"ma": "AHK-77", "ten": "Máy nghiền bi đứng", "dang": "FS, OD, SC", "ghiChu": "Thể tích buồng nghiền: 5L Sản lượng: 50-100kg/h"}, {"ma": "AHK-78", "ten": "Máy nghiền bi đứng", "dang": "FS, OD, SC", "ghiChu": "Thể tích buồng nghiền: 5L Sản lượng: 50-100kg/h"}, {"ma": "AHK-79", "ten": "Máy nghiền bi ngang", "dang": "FS, OD, SC", "ghiChu": "Thể tích buồng nghiền: 20L Sản lượng: 200-300kg/h"}, {"ma": "AHK-19", "ten": "Máy khuấy phân tán 01 (Có bồn cố định)", "dang": "FS, OD, SC", "ghiChu": "Dung tích 2000L Tốc độ khuấy: 1000-1500 vòng/phút"}, {"ma": "AHK-22", "ten": "Máy khuấy phân tán 04", "dang": "FS, OD, SC", "ghiChu": "Tốc độ khuấy: 1000-1500 vòng/phút"}, {"ma": "AHK-44", "ten": "Bồn phối trộn, dung tích: 1000L", "dang": "FS, OD, SC", "ghiChu": "Dung tích: 1000L"}, {"ma": "AHK-45", "ten": "Bồn phối trộn, dung tích: 1000L", "dang": "FS, OD, SC", "ghiChu": "Dung tích: 1000L"}];
(function(){
const K={data:null,view:"ngay",tu:"",den:"",q:"",thang:"",loading:null};
const UU=["Gấp","Cao","Bình thường","Thấp"],UUC={"Gấp":"kh-gap","Cao":"kh-cao","Bình thường":"","Thấp":"kh-thap"};
const TT_ORDER=["Tạo mới","Sửa sau khi gửi","Đã gửi","Đang SX","Xong phối trộn","Hoàn thành","Đã huỷ"];
const TTC={"Tạo mới":"kh-moi","Sửa sau khi gửi":"kh-sua","Đã gửi":"kh-gui","Đang SX":"kh-run","Xong phối trộn":"kh-xong","Hoàn thành":"kh-ht","Đã huỷ":"kh-huy"};
const addD=(ymd,n)=>{const t=new Date(ymd+"T12:00:00");t.setDate(t.getDate()+n);return t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(t.getDate()).padStart(2,"0")};
const thu=ymd=>["CN","T2","T3","T4","T5","T6","T7"][new Date(ymd+"T12:00:00").getDay()];
const mins=(a,b)=>{if(!a||!b)return 0;const p=s=>{const m=/(\d{1,2}):(\d{2})$/.exec(s);return m?(+m[1])*60+(+m[2]):NaN};const v=p(b)-p(a);return v>0?v:0};
const minsTs=(a,b)=>{if(!a||!b)return 0;const v=(new Date(b.replace(" ","T"))-new Date(a.replace(" ","T")))/6e4;return v>0?Math.round(v):0};
const gio=m=>m?(m>=60?Math.floor(m/60)+" giờ"+(m%60?" "+(m%60)+"′":""):m+" phút"):"—";
const mayTen=s=>String(s||"").split(",").map(x=>x.trim()).filter(String).map(ma=>{const m=(K.data.may||[]).find(x=>x.ma===ma);return m?m.ten:ma}).join(" + ");
const dang=sp=>{const m=/\d\s*(?:%\s*W\/[WV]\s*)?(WP|WG|WDG|SC|EC|SL|OD|FS|EW|ME|SE|CS|GR|SP|DF|SG|DC)\b/i.exec((sp&&sp.ten)||"");return m?m[1].toUpperCase():""};
function full(k){const o=S.lenh.find(x=>x.so===k.so)||{},sp=itemBy(o.maSP)||{ma:o.maSP||"",ten:""};
  const tt=o.trangThai==="Đã huỷ"?"Đã huỷ":o.trangThai==="Hoàn thành"?"Hoàn thành":k.ktTT?"Xong phối trộn":k.bdTT?"Đang SX":k.tt==="Sửa sau khi gửi"?"Sửa sau khi gửi":k.gui?"Đã gửi":"Tạo mới";
  return Object.assign({},k,{o,sp,tt,sl:o.trangThai==="Hoàn thành"?o.slThucTe:o.slDuKien,phut:mins(k.bd,k.kt),phutTT:minsTs(k.bdTT,k.ktTT)})}
const canKH=()=>typeof can!=="undefined"&&can.phieu()&&S.me&&S.me.ct;
async function load(force){if(K.data&&!force)return K.data;K.loading=K.loading||api("webKHGet",S.auth).then(d=>{if(!d.may||!d.may.length){d.may=MAY_TM.map(x=>Object.assign({},x));d.mayTM=1}K.data=d;return d}).finally(()=>K.loading=null);return K.loading}
function rowsAll(){return (K.data.kh||[]).map(full)}

/* ---------- khung chính ---------- */
window.khRender=async function(){const box=$("khBox");if(!box)return;
  if(!K.tu){K.tu=addD(S.today,-3);K.den=addD(S.today,7);K.thang=S.today.slice(0,7)}
  if(!K.data)box.innerHTML='<p class="note">Đang tải kế hoạch…</p>';
  try{await load()}catch(e){box.innerHTML='<div class="warnbox">'+esc(e.message)+'</div>';return}
  const V=[["ngay","Theo ngày"],["homnay","Hôm nay"],["mai","Ngày mai"],["kanban","Kanban"],["lich","Lịch"],["gio","Giờ máy"]].concat(S.me.vaiTro==="Quản lý"?[["may","Danh mục máy"]]:[]);
  box.innerHTML=`<div class="kh-bar kh-tools"><div class="seg kh-seg">${V.map(v=>`<button type="button" data-v="${v[0]}" aria-pressed="${K.view===v[0]}">${v[1]}</button>`).join("")}</div>
    ${canKH()?'<button class="btn primary" type="button" id="khNew">+ Lập kế hoạch</button>':""}</div><div id="khView"></div>`;
  box.querySelectorAll(".kh-seg button").forEach(b=>b.onclick=()=>{K.view=b.dataset.v;khRender()});
  if($("khNew"))$("khNew").onclick=()=>khForm(null,K.view==="mai"?addD(S.today,1):S.today);
  ({ngay:vNgay,homnay:()=>vNgay(S.today,S.today),mai:()=>vNgay(addD(S.today,1),addD(S.today,1)),kanban:vKanban,lich:vLich,gio:vGio,may:vMay})[K.view]();
};

/* ---------- Theo ngày / Hôm nay / Ngày mai ---------- */
function vNgay(tu,den){const one=!!tu;tu=tu||K.tu;den=den||K.den;const v=$("khView");
  const q=K.q.toLowerCase(),R=rowsAll().filter(r=>r.ngay>=tu&&r.ngay<=den&&r.tt!=="Đã huỷ"&&(!q||(r.so+" "+r.sp.ma+" "+r.sp.ten+" "+mayTen(r.may)+" "+r.may+" "+r.pc1+" "+r.pc2+" "+r.qc).toLowerCase().includes(q)));
  const byD={};R.forEach(r=>(byD[r.ngay]=byD[r.ngay]||[]).push(r));
  const days=Object.keys(byD).sort((a,b)=>b.localeCompare(a));
  days.forEach(d=>byD[d].sort((a,b)=>(a.bd||"99").localeCompare(b.bd||"99")||UU.indexOf(a.uuTien)-UU.indexOf(b.uuTien)));
  v.innerHTML=(one?"":`<div class="kh-bar"><label class="kh-inl">Từ <input type="date" id="khTu" value="${tu}"></label><label class="kh-inl">đến <input type="date" id="khDen" value="${den}"></label>
      <input type="search" id="khQ" placeholder="Tìm lệnh, BTP, máy, người…" value="${esc(K.q)}" autocomplete="off"></div>`)+
    (days.length?days.map(d=>dayBlock(d,byD[d])).join(""):`<div class="list"><div class="row"><div class="name">${one?"Chưa có kế hoạch phối trộn cho "+thu(tu)+" "+dmy(tu)+".":"Không có kế hoạch trong khoảng ngày này."}</div></div></div>`)+
    `<p class="note">Bấm vào dòng để sửa. Trạng thái: Tạo mới → <b>Gửi</b> (xưởng thấy ở Hôm nay / Ngày mai, copy dán Zalo) → Bắt đầu → Kết thúc phối trộn → hoàn thành lệnh SX để trừ nguyên liệu, nhập BTP.</p>`;
  if(!one){$("khTu").onchange=e=>{K.tu=e.target.value||K.tu;khRender()};$("khDen").onchange=e=>{K.den=e.target.value||K.den;khRender()};
    const qi=$("khQ");qi.oninput=()=>{K.q=qi.value;clearTimeout(qi._t);qi._t=setTimeout(()=>{const p=qi.selectionStart;khRender().then(()=>{const n=$("khQ");if(n){n.focus();try{n.setSelectionRange(p,p)}catch(e){}}})},250)}}
  bindRows(v);
}
function dayBlock(d,L){const chua=L.filter(r=>!r.bdTT&&["Tạo mới","Sửa sau khi gửi"].includes(r.tt)).length,tong=L.reduce((s,r)=>s+(+r.sl||0),0);
  return `<div class="kh-day"><div class="kh-dh"><b>${thu(d)} ${dmy(d)}</b><span class="note">${L.length} lệnh · ${kg(tong)} kg${d===S.today?" · <b>hôm nay</b>":d===addD(S.today,1)?" · ngày mai":""}</span>
    <span class="kh-dact">${canKH()&&chua?`<button class="btn small primary" type="button" data-gui="${d}">Gửi kế hoạch (${chua})</button>`:""}<button class="btn small" type="button" data-zalo="${d}">Copy gửi Zalo</button><button class="btn small" type="button" data-in="${d}">In</button></span></div>
  <div class="dgx kh-tb"><table><thead><tr><th>#</th><th>Lệnh / số lô</th><th>Bán thành phẩm</th><th class="n">SL (kg)</th><th>Máy</th><th>Giờ</th><th>Ưu tiên</th><th>Phối chế · QC</th><th>Trạng thái</th><th></th></tr></thead><tbody>
  ${L.map((r,i)=>`<tr data-id="${esc(r.id)}" class="${r.tt==="Hoàn thành"?"kh-dim":""}"><td>${i+1}</td><td><b>${esc(r.so)}</b></td><td>${esc(r.sp.ten||r.sp.ma)}${dang(r.sp)?` <span class="kh-tt">${esc(dang(r.sp))}</span>`:""}${r.ghiChu?`<br><small class="note">${esc(r.ghiChu)}</small>`:""}</td><td class="n">${kg(r.sl)}</td>
    <td>${esc(mayTen(r.may))||'<span class="note">chưa chọn</span>'}</td><td>${r.bd||"?"} – ${r.kt||"?"}${r.phut?` <small class="note">(${gio(r.phut)})</small>`:""}${r.bdTT?`<br><small class="note">thực tế ${esc(r.bdTT.slice(11))}${r.ktTT?"–"+esc(r.ktTT.slice(11)):""}</small>`:""}</td>
    <td><span class="kh-uu ${UUC[r.uuTien]||""}">${esc(r.uuTien)}</span></td><td>${esc([r.pc1,r.pc2].filter(Boolean).join(", "))||"—"}<br><small class="note">QC: ${esc(r.qc)||"—"}</small></td>
    <td><span class="kh-tt ${TTC[r.tt]}">${esc(r.tt)}</span>${r.gui&&r.tt!=="Tạo mới"?`<br><small class="note">gửi ${esc(dmy(r.gui.slice(0,10)).slice(0,5))} ${esc(r.gui.slice(11))}</small>`:""}</td>
    <td class="kh-act">${actBtns(r)}</td></tr>`).join("")}</tbody></table></div></div>`}
function actBtns(r){if(!canKH()||r.tt==="Hoàn thành"||r.tt==="Đã huỷ")return r.tt==="Hoàn thành"?`<button class="btn small" type="button" data-lenh="${esc(r.so)}">Xem lệnh</button>`:"";
  if(r.tt==="Xong phối trộn")return `<button class="btn small primary" type="button" data-lenh="${esc(r.so)}">Hoàn thành lệnh</button>`;
  if(r.tt==="Đang SX")return `<button class="btn small primary" type="button" data-act="kt" data-k="${esc(r.id)}">Kết thúc</button>`;
  return `<button class="btn small" type="button" data-act="bd" data-k="${esc(r.id)}">Bắt đầu</button>`}
function bindRows(v){
  v.querySelectorAll("tr[data-id]").forEach(tr=>tr.onclick=e=>{if(e.target.closest("button"))return;const r=rowsAll().find(x=>x.id===tr.dataset.id);if(r)khForm(r)});
  v.querySelectorAll("[data-act]").forEach(b=>b.onclick=async e=>{e.stopPropagation();b.disabled=true;try{await api("webKHAct",S.auth,b.dataset.k,b.dataset.act);toast(b.dataset.act==="bd"?"Đã ghi giờ bắt đầu":"Đã ghi giờ kết thúc phối trộn");await load(true);khRender()}catch(x){handleErr(x);b.disabled=false}});
  v.querySelectorAll("[data-lenh]").forEach(b=>b.onclick=e=>{e.stopPropagation();setTab("lsx");setTimeout(()=>openOrder(b.dataset.lenh),50)});
  v.querySelectorAll("[data-gui]").forEach(b=>b.onclick=()=>guiNgay(b.dataset.gui,b));
  v.querySelectorAll("[data-zalo]").forEach(b=>b.onclick=()=>copyZalo(b.dataset.zalo));
  v.querySelectorAll("[data-in]").forEach(b=>b.onclick=()=>inNgay(b.dataset.in));
  v.querySelectorAll(".kh-card[data-id]").forEach(c=>c.onclick=()=>{const r=rowsAll().find(x=>x.id===c.dataset.id);if(r)khForm(r)});
}
function ngayRows(d){return rowsAll().filter(r=>r.ngay===d&&r.tt!=="Đã huỷ").sort((a,b)=>(a.bd||"99").localeCompare(b.bd||"99"))}
async function guiNgay(d,b){const L=ngayRows(d).filter(r=>!r.bdTT&&["Tạo mới","Sửa sau khi gửi"].includes(r.tt));if(!L.length)return;
  b.disabled=true;try{const n=await api("webKHGui",S.auth,L.map(r=>r.id));await load(true);toast("Đã gửi kế hoạch "+n+" lệnh ngày "+dmy(d)+". Đã copy nội dung để dán vào nhóm Zalo.");copyZalo(d,true);khRender()}catch(e){handleErr(e);b.disabled=false}}
function zaloText(d){const L=ngayRows(d);
  return "KẾ HOẠCH PHỐI TRỘN "+({CN:"CHỦ NHẬT",T2:"THỨ 2",T3:"THỨ 3",T4:"THỨ 4",T5:"THỨ 5",T6:"THỨ 6",T7:"THỨ 7"})[thu(d)]+" "+dmy(d)+" ("+L.length+" lệnh)\n"+L.map((r,i)=>(i+1)+". "+(r.bd||"?")+"–"+(r.kt||"?")+" · "+(mayTen(r.may)||"chưa chọn máy")+"\n   "+(r.sp.ten||r.sp.ma)+" · lô "+r.so+" · "+kg(r.sl)+" kg"+(r.uuTien!=="Bình thường"?" · ƯU TIÊN "+r.uuTien.toUpperCase():"")+
    "\n   Phối chế: "+([r.pc1,r.pc2].filter(Boolean).join(", ")||"—")+" · QC: "+(r.qc||"—")+(r.ghiChu?"\n   Ghi chú: "+r.ghiChu:"")).join("\n")}
async function copyZalo(d,quiet){const t=zaloText(d);try{await navigator.clipboard.writeText(t);if(!quiet)toast("Đã copy kế hoạch ngày "+dmy(d)+". Mở nhóm Zalo và dán (Ctrl+V).")}
  catch(e){const w=document.createElement("div");w.className="cfm";w.innerHTML=`<div class="cfm-box"><h2>Copy gửi Zalo</h2><textarea style="width:100%;height:300px">${esc(t)}</textarea><div class="actions"><button class="btn primary" type="button">Đóng</button></div></div>`;document.body.appendChild(w);w.querySelector("textarea").select();w.querySelector("button").onclick=()=>w.remove()}}
function inNgay(d){const L=ngayRows(d);
  $("printArea").innerHTML=`<div style="font:12px/1.35 Arial,sans-serif;color:#000"><div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #000;padding-bottom:4px;margin-bottom:6px"><div><b style="font-size:13px">CÔNG TY CP BVTV ASATA HOA KỲ</b></div><div style="font-size:18px;font-weight:700">KẾ HOẠCH PHỐI TRỘN NGÀY ${dmy(d)}</div><div>${thu(d)} · ${L.length} lệnh</div></div>
  <table style="width:100%;border-collapse:collapse" border="1" cellpadding="4"><thead><tr style="background:#eee"><th>#</th><th>Giờ</th><th>Máy</th><th>Bán thành phẩm</th><th>Lô</th><th>SL (kg)</th><th>Ưu tiên</th><th>Phối chế</th><th>QC</th><th>Bắt đầu TT</th><th>Kết thúc TT</th><th>Ghi chú</th></tr></thead><tbody>
  ${L.map((r,i)=>`<tr><td>${i+1}</td><td>${r.bd||""}–${r.kt||""}</td><td>${esc(mayTen(r.may))}</td><td>${esc(r.sp.ten||r.sp.ma)}</td><td>${esc(r.so)}</td><td style="text-align:right">${kg(r.sl)}</td><td>${esc(r.uuTien)}</td><td>${esc([r.pc1,r.pc2].filter(Boolean).join(", "))}</td><td>${esc(r.qc)}</td><td>${r.bdTT?esc(r.bdTT.slice(11)):""}</td><td>${r.ktTT?esc(r.ktTT.slice(11)):""}</td><td>${esc(r.ghiChu)}</td></tr>`).join("")}</tbody></table>
  <div style="display:flex;justify-content:space-around;margin-top:14px;text-align:center"><div><b>Người lập</b><br><br><br></div><div><b>Tổ trưởng SX</b><br><br><br></div><div><b>QC</b><br><br><br></div></div></div>`;
  let pg=document.getElementById("pgA4");if(!pg){pg=document.createElement("style");pg.id="pgA4";document.head.appendChild(pg)}pg.textContent="@media print{@page{size:A4 landscape;margin:8mm}html,body,#printArea{margin:0!important;padding:0!important}}";
  khPrintNow(pg)}

/* ---------- Kanban ---------- */
function vKanban(){const v=$("khView"),from=addD(S.today,-14),R=rowsAll().filter(r=>r.ngay>=from&&r.tt!=="Đã huỷ");
  const cols=["Tạo mới","Đã gửi","Đang SX","Xong phối trộn","Hoàn thành"],col=r=>r.tt==="Sửa sau khi gửi"?"Tạo mới":r.tt;
  v.innerHTML=`<div class="kh-kb">${cols.map(c=>{const L=R.filter(r=>col(r)===c).sort((a,b)=>a.ngay.localeCompare(b.ngay)||(a.bd||"").localeCompare(b.bd||""));
    if(c==="Hoàn thành")L.reverse();const show=c==="Hoàn thành"?L.slice(0,20):L;
    return `<div class="kh-kcol"><div class="kh-kh"><span class="kh-tt ${TTC[c]}">${c}</span><b>${L.length}</b></div>${show.map(r=>`<div class="kh-card" data-id="${esc(r.id)}"><div class="kh-c1"><b>${esc(r.so)}</b><span class="kh-uu ${UUC[r.uuTien]||""}">${esc(r.uuTien)}</span></div><div>${esc(r.sp.ten||r.sp.ma)}</div><div class="note">${thu(r.ngay)} ${dmy(r.ngay).slice(0,5)} · ${r.bd||"?"}–${r.kt||"?"} · ${kg(r.sl)} kg</div><div class="note">${esc(mayTen(r.may))||"chưa chọn máy"}${r.pc1?" · "+esc(r.pc1):""}</div></div>`).join("")||'<p class="note">—</p>'}</div>`}).join("")}</div><p class="note">Kế hoạch từ ${dmy(from)} trở đi. Bấm thẻ để sửa.</p>`;
  bindRows(v)}

/* ---------- Lịch tháng ---------- */
function vLich(){const v=$("khView"),[y,m]=K.thang.split("-").map(Number),first=new Date(y,m-1,1),days=new Date(y,m,0).getDate(),lead=(first.getDay()+6)%7;
  const R=rowsAll().filter(r=>r.ngay.slice(0,7)===K.thang&&r.tt!=="Đã huỷ"),by={};R.forEach(r=>(by[r.ngay]=by[r.ngay]||[]).push(r));
  let cells="";for(let i=0;i<lead;i++)cells+='<div class="kh-cd kh-cd0"></div>';
  for(let d=1;d<=days;d++){const k=K.thang+"-"+String(d).padStart(2,"0"),L=(by[k]||[]).sort((a,b)=>(a.bd||"").localeCompare(b.bd||""));
    cells+=`<div class="kh-cd${k===S.today?" kh-today":""}" data-d="${k}"><div class="kh-cdn">${d}</div>${L.slice(0,4).map(r=>`<div class="kh-ev ${TTC[r.tt]}" data-id="${esc(r.id)}" title="${esc(r.so+" · "+(r.sp.ten||""))}">${esc(r.bd||"")} ${esc((r.sp.ten||r.sp.ma).replace(/^BTP\s+/i,""))}</div>`).join("")}${L.length>4?`<div class="note">+${L.length-4} lệnh</div>`:""}</div>`}
  const mm=(dlt)=>{const t=new Date(y,m-1+dlt,1);return t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")};
  v.innerHTML=`<div class="kh-bar"><button class="btn small" type="button" id="khPrev">‹</button><b>Tháng ${m}/${y}</b><button class="btn small" type="button" id="khNext">›</button><button class="btn small" type="button" id="khNow">Tháng này</button><span class="note">${R.length} lệnh</span></div>
    <div class="kh-cal">${["T2","T3","T4","T5","T6","T7","CN"].map(x=>`<div class="kh-cw">${x}</div>`).join("")}${cells}</div>`;
  $("khPrev").onclick=()=>{K.thang=mm(-1);khRender()};$("khNext").onclick=()=>{K.thang=mm(1);khRender()};$("khNow").onclick=()=>{K.thang=S.today.slice(0,7);khRender()};
  v.querySelectorAll(".kh-ev").forEach(e=>e.onclick=ev=>{ev.stopPropagation();const r=rowsAll().find(x=>x.id===e.dataset.id);if(r)khForm(r)});
  v.querySelectorAll(".kh-cd[data-d]").forEach(c=>c.onclick=()=>{K.tu=c.dataset.d;K.den=c.dataset.d;K.view="ngay";khRender()})}

/* ---------- Giờ máy ---------- */
function vGio(){const v=$("khView"),R=rowsAll().filter(r=>r.ngay.slice(0,7)===K.thang&&r.tt!=="Đã huỷ"),by={};
  R.forEach(r=>{const ms=String(r.may||"").split(",").map(x=>x.trim()).filter(String);(ms.length?ms:["(chưa chọn máy)"]).forEach(ma=>{const x=by[ma]=by[ma]||{me:0,kg:0,kh:0,tt:0,ttMe:0};x.me++;x.kg+=(+r.sl||0)/ms.length||0;x.kh+=r.phut;if(r.phutTT){x.tt+=r.phutTT;x.ttMe++}})});
  const ks=Object.keys(by).sort((a,b)=>by[b].kh-by[a].kh),[y,m]=K.thang.split("-");
  v.innerHTML=`<div class="kh-bar"><label class="kh-inl">Tháng <input type="month" id="khM" value="${K.thang}"></label><span class="note">${R.length} lệnh trong tháng</span></div>
   <div class="dgx"><table><thead><tr><th>Máy</th><th class="n">Số mẻ</th><th class="n">KL (kg)</th><th class="n">Giờ kế hoạch</th><th class="n">Giờ thực tế</th><th class="n">TB / mẻ (thực tế)</th></tr></thead><tbody>
   ${ks.length?ks.map(k=>{const x=by[k];return `<tr><td><b>${esc(k)}</b> ${esc(mayTen(k)!==k?mayTen(k):"")}</td><td class="n">${x.me}</td><td class="n">${kg(x.kg)}</td><td class="n">${gio(x.kh)}</td><td class="n">${x.ttMe?gio(x.tt):"—"}</td><td class="n">${x.ttMe?gio(Math.round(x.tt/x.ttMe)):"—"}</td></tr>`}).join(""):'<tr><td colspan="6">Chưa có kế hoạch trong tháng.</td></tr>'}</tbody></table></div>
   <p class="note">Giờ thực tế tính từ lúc bấm <b>Bắt đầu</b> đến <b>Kết thúc</b>. Lệnh chạy nhiều máy thì KL chia đều cho các máy.</p>`;
  $("khM").onchange=e=>{K.thang=e.target.value||S.today.slice(0,7);khRender()}}

/* ---------- Danh mục máy ---------- */
function vMay(){const v=$("khView"),L=K.data.mayTM?[]:(K.data.may||[]).map(x=>Object.assign({},x));if(!L.length)L.push({ma:"",ten:"",dang:"",ghiChu:"",ngung:false});
  const draw=()=>{v.innerHTML=`<div class="dgx"><table><thead><tr><th>Mã máy</th><th>Tên máy</th><th>Dạng BTP chạy</th><th>Ghi chú</th><th>Ngừng dùng</th><th></th></tr></thead><tbody>
    ${L.map((m,i)=>`<tr><td><input data-i="${i}" data-f="ma" value="${esc(m.ma)}" placeholder="VD: MNJ-01"></td><td><input data-i="${i}" data-f="ten" value="${esc(m.ten)}" placeholder="Máy nghiền Jetmill 01"></td><td><input data-i="${i}" data-f="dang" value="${esc(m.dang)}" placeholder="WP, WG"></td><td><input data-i="${i}" data-f="ghiChu" value="${esc(m.ghiChu)}"></td><td style="text-align:center"><input type="checkbox" data-i="${i}" data-f="ngung" ${m.ngung?"checked":""} style="width:auto"></td><td><button class="btn small danger" type="button" data-del="${i}">Xoá</button></td></tr>`).join("")}</tbody></table></div>
    <div class="kh-bar"><button class="btn" type="button" id="mayAdd">+ Thêm máy</button><button class="btn" type="button" id="mayTM">Nạp thiết bị từ bản thuyết minh (${MAY_TM.length})</button><button class="btn primary" type="button" id="maySave">Lưu danh mục máy</button></div>
    <p class="note">Máy ngừng dùng không hiện khi lập kế hoạch mới nhưng vẫn giữ trong kế hoạch cũ.</p>`;
    v.querySelectorAll("input[data-f]").forEach(x=>x.oninput=x.onchange=()=>{L[+x.dataset.i][x.dataset.f]=x.type==="checkbox"?x.checked:x.value});
    v.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{L.splice(+b.dataset.del,1);draw()});
    $("mayTM").onclick=()=>{let n=0;MAY_TM.forEach(m=>{if(!L.some(x=>x.ma.toUpperCase()===m.ma.toUpperCase())){L.push(Object.assign({ngung:false},m));n++}});for(let i=L.length-1;i>=0;i--)if(!L[i].ma&&!L[i].ten)L.splice(i,1);draw();toast("Đã thêm "+n+" thiết bị. Bấm Lưu danh mục máy để lưu.")};
    $("mayAdd").onclick=()=>{L.push({ma:"",ten:"",dang:"",ghiChu:"",ngung:false});draw();const ins=v.querySelectorAll('input[data-f="ma"]');ins[ins.length-1].focus()};
    $("maySave").onclick=async()=>{$("maySave").disabled=true;try{K.data.may=await api("webMaySave",S.auth,L);toast("Đã lưu danh mục máy");khRender()}catch(e){handleErr(e);$("maySave").disabled=false}}};
  draw()}

/* ---------- form lập / sửa kế hoạch ---------- */
function soGoiY(ngay){let mx=0;S.lenh.forEach(o=>{const m=/^AHK\.\d{4}\.(\d{3})$/.exec(o.so);if(m)mx=Math.max(mx,+m[1])});return "AHK."+ngay.slice(2,4)+ngay.slice(5,7)+"."+String(mx+1).padStart(3,"0")}
function khForm(r,ngay){if(!canKH()&&!r)return;const ro=!canKH()||(r&&(r.tt==="Hoàn thành"||r.tt==="Đã huỷ"));
  const used=new Set(rowsAll().filter(x=>!r||x.id!==r.id).map(x=>x.so));
  const cho=S.lenh.filter(o=>o.trangThai==="Đang SX"&&!used.has(o.so)&&(itemBy(o.maSP)||{}).nhom==="Bán thành phẩm");
  const may=(K.data.may||[]).filter(m=>!m.ngung||(r&&String(r.may).split(",").map(x=>x.trim()).includes(m.ma)));
  const curMay=r?String(r.may||"").split(",").map(x=>x.trim()).filter(String):[];
  const dl=(id,a)=>`<datalist id="${id}">${(a||[]).map(x=>`<option value="${esc(x)}"></option>`).join("")}</datalist>`;
  const d=r||{ngay:ngay||S.today,bd:"07:30",kt:"16:30",uuTien:"Bình thường",pc1:"",pc2:"",qc:"",ghiChu:"",may:""};
  const w=document.createElement("div");w.className="cfm";w.id="khDlg";
  w.innerHTML=`<form class="cfm-box kh-dlg" novalidate><h2>${r?"Kế hoạch phối trộn · "+esc(r.so):"Lập kế hoạch phối trộn"}</h2>
   ${r?`<p class="note">${esc(r.sp.ten||r.sp.ma)} · ${kg(r.sl)} kg · <span class="kh-tt ${TTC[r.tt]}">${esc(r.tt)}</span>${r.nguoiLap?" · lập bởi "+esc(r.nguoiLap):""}</p>`:
   `<div class="seg kh-seg2"><button type="button" data-m="cu" aria-pressed="${cho.length?"true":"false"}">Lệnh SX đang chờ (${cho.length})</button><button type="button" data-m="moi" aria-pressed="${cho.length?"false":"true"}">Lập lệnh mới</button></div>
   <div id="khCu" ${cho.length?"":"hidden"}><label>Lệnh SX<select id="khSo">${cho.map(o=>{const sp=itemBy(o.maSP)||{};return `<option value="${esc(o.so)}">${esc(o.so)} · ${esc(sp.ten||o.maSP)} · ${kg(o.slDuKien)} kg</option>`}).join("")}</select></label></div>
   <div id="khMoi" ${cho.length?"hidden":""}><div class="two"><label>Số lệnh = số lô<input id="khSoM" value=""></label><label>Bán thành phẩm<select id="khSP"><option value="">— Chọn BTP —</option>${itemOpts(i=>i.nhom==="Bán thành phẩm"&&inScope(i))}</select></label></div>
     <div class="two"><label>Khối lượng (kg)<input id="khSL" type="number" inputmode="decimal" step="any" min="0"></label><label id="khTTw">Tỷ trọng (g/ml)<input id="khTT" type="number" inputmode="decimal" step="0.001" min="0" placeholder="dạng lỏng bắt buộc"></label></div>
     <label>Khách hàng (in thẻ nhận diện)<input id="khKH" list="khKHdl">${dl("khKHdl",(S.goiY&&S.goiY.kh)||[])}</label></div>`}
   <div class="two"><label>Ngày phối trộn<input id="khNgay" type="date" value="${esc(d.ngay)}"></label><label>Ưu tiên<select id="khUu">${UU.map(u=>`<option${u===d.uuTien?" selected":""}>${u}</option>`).join("")}</select></label></div>
   <div class="two"><label>Giờ bắt đầu<input id="khBd" type="time" value="${esc(d.bd)}"></label><label>Giờ kết thúc<input id="khKt" type="time" value="${esc(d.kt)}"></label></div>
   <div class="kh-mayl"><span class="lb">Máy${may.length?"":' <small class="note">(chưa có danh mục máy'+(S.me.vaiTro==="Quản lý"?' — vào mục "Danh mục máy" để khai báo':"")+')</small>'}</span>${may.length>6?'<input type="search" id="khMayQ" placeholder="🔍 Tìm nhanh máy theo mã hoặc tên…" autocomplete="off" style="margin:6px 0">':""}<div class="kh-mays">${may.map(m=>`<label class="kh-chk" data-s="${esc((m.ma+" "+m.ten).toLowerCase())}"><input type="checkbox" value="${esc(m.ma)}" ${curMay.includes(m.ma)?"checked":""}><span><b>${esc(m.ma)}</b> ${esc(m.ten)}${m.dang?` <small class="note">${esc(m.dang)}</small>`:""}</span></label>`).join("")}</div>
     <input id="khMayX" placeholder="Máy khác (gõ tay, cách nhau dấu phẩy)" value="${esc(curMay.filter(x=>!may.some(m=>m.ma===x)).join(", "))}"></div>
   <div class="two"><label>Phối chế 1<input id="khP1" list="khNdl" value="${esc(d.pc1)}"></label><label>Phối chế 2<input id="khP2" list="khNdl" value="${esc(d.pc2)}"></label></div>${dl("khNdl",K.data.nsx)}
   <label>QC theo dõi<input id="khQC" list="khQdl" value="${esc(d.qc)}"></label>${dl("khQdl",K.data.qc)}
   <label>Ghi chú<input id="khGC" value="${esc(d.ghiChu)}" placeholder="VD: Nghiền tráng vệ sinh máy"></label>
   <p class="note" id="khTime"></p>
   <div class="actions">${r&&canKH()&&!ro?'<button class="btn danger" type="button" data-x="del">Xoá kế hoạch</button>':""}${r&&r.bdTT&&!r.ktTT&&canKH()&&!ro?'<button class="btn" type="button" data-x="huybd">Bỏ ghi bắt đầu</button>':""}<span style="flex:1"></span><button class="btn" type="button" data-x="close">Đóng</button>${ro?"":'<button class="btn primary" type="submit">Lưu kế hoạch</button>'}</div></form>`;
  document.body.appendChild(w);const f=w.querySelector("form"),close=()=>w.remove();
  if(ro)f.querySelectorAll("input,select").forEach(x=>x.disabled=true);
  let mode=r?"":(cho.length?"cu":"moi");
  w.querySelectorAll(".kh-seg2 button").forEach(b=>b.onclick=()=>{mode=b.dataset.m;w.querySelectorAll(".kh-seg2 button").forEach(x=>x.setAttribute("aria-pressed",x===b));$("khCu").hidden=mode!=="cu";$("khMoi").hidden=mode!=="moi"});
  if($("khSoM")){$("khSoM").value=soGoiY(d.ngay);$("khSP").onchange=()=>{const sp=itemBy($("khSP").value);$("khTTw").firstChild.textContent="Tỷ trọng (g/ml)"+(isLiq(sp)?" *":"");if(sp&&!$("khTT").value){const t=lastTT(sp.ma);if(t)$("khTT").value=t}if(sp&&!$("khKH").value)$("khKH").value=khMacDinh(sp)}}
  const tm=()=>{const p=mins($("khBd").value,$("khKt").value);$("khTime").textContent=p?"Thời gian phối trộn: "+gio(p):""};$("khBd").oninput=$("khKt").oninput=tm;tm();
  if($("khMayQ")){const fd=t=>String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/gi,"d").toLowerCase();$("khMayQ").oninput=()=>{const q=fd($("khMayQ").value).trim();w.querySelectorAll(".kh-mays .kh-chk").forEach(l=>{l.hidden=q&&!fd(l.dataset.s).includes(q)&&!l.querySelector("input").checked})}}
  w.onclick=e=>{if(e.target===w)close()};
  w.querySelectorAll("[data-x]").forEach(b=>b.onclick=async()=>{const x=b.dataset.x;if(x==="close")return close();
    if(x==="del"&&!confirm("Xoá kế hoạch phối trộn của lệnh "+r.so+"? (Lệnh SX vẫn giữ nguyên)"))return;
    b.disabled=true;try{await api("webKHAct",S.auth,r.id,x==="del"?"xoa":"huybd");await load(true);close();toast(x==="del"?"Đã xoá kế hoạch":"Đã bỏ giờ bắt đầu");khRender()}catch(e){handleErr(e);b.disabled=false}});
  f.onsubmit=async e=>{e.preventDefault();if(ro)return;
    const may=[...w.querySelectorAll(".kh-mays input:checked")].map(x=>x.value).concat($("khMayX").value.split(",").map(x=>x.trim()).filter(String));
    const o={id:r?r.id:"",ngay:$("khNgay").value,bd:$("khBd").value,kt:$("khKt").value,uuTien:$("khUu").value,may:[...new Set(may)].join(", "),pc1:$("khP1").value.trim(),pc2:$("khP2").value.trim(),qc:$("khQC").value.trim(),ghiChu:$("khGC").value.trim()};
    if(r)o.so=r.so;else if(mode==="cu"){o.so=$("khSo").value}else{Object.assign(o,{moi:1,so:$("khSoM").value.trim(),maSP:$("khSP").value,slDuKien:$("khSL").value,tyTrong:$("khTT").value,khachHang:$("khKH").value.trim()});
      const sp=itemBy(o.maSP);if(!o.so){$("khSoM").focus();return toast("Ghi số lệnh.")}if(!sp){$("khSP").focus();return toast("Chọn bán thành phẩm.")}if(!(parseFloat(o.slDuKien)>0)){$("khSL").focus();return toast("Ghi khối lượng.")}
      if(isLiq(sp)&&!(parseFloat(o.tyTrong)>0)){$("khTT").focus();return toast(sp.ten+" là dạng lỏng: ghi tỷ trọng (g/ml).")}if(!o.khachHang){$("khKH").focus();return toast("Ghi tên khách hàng để in thẻ nhận diện.")}}
    if(!o.so)return toast("Chọn lệnh SX.");if(!o.ngay)return toast("Chọn ngày phối trộn.");if(o.bd&&o.kt&&o.kt<=o.bd)return toast("Giờ kết thúc phải sau giờ bắt đầu.");
    const sb=f.querySelector('[type="submit"]');sb.disabled=true;
    try{await api("webKHSave",S.auth,o);if(o.moi)await refresh();await load(true);close();toast(r?"Đã sửa kế hoạch "+o.so:"Đã lập kế hoạch "+o.so+(o.moi?" (đã lập lệnh SX)":""));if(K.view!=="ngay"&&K.view!=="kanban"&&K.view!=="lich"){K.view="ngay"}if(o.ngay<K.tu)K.tu=o.ngay;if(o.ngay>K.den)K.den=o.ngay;khRender()}
    catch(x){handleErr(x);sb.disabled=false}};
  setTimeout(()=>{const fi=f.querySelector("select,input:not([type=hidden])");if(fi&&!ro)fi.focus()},50)}
window.khReload=()=>{K.data=null};
})();

/* ===== Biên bản SX BTP (BM.06-QC-QT.03) + Phiếu kiểm nghiệm hoá lý BTP (BM.08-QC-QT.03) ===== */
(function(){
const LOGO=()=>{const i=document.querySelector(".brand img");return i?i.src:""};
const T13='font:13px/1.35 "Times New Roman",Times,serif;color:#000';
const dangOf=sp=>{const m=/\d\s*(?:%\s*W\/[WV]\s*)?(WP|WG|WDG|SC|EC|SL|OD|FS|EW|ME|SE|CS|GR|SP|DF|SG|DC)\b/i.exec((sp&&sp.ten)||"");return m?m[1].toUpperCase():""};
const pr=(html,land)=>{$("printArea").innerHTML=html;let pg=document.getElementById("pgA4");if(!pg){pg=document.createElement("style");pg.id="pgA4";document.head.appendChild(pg)}
  pg.textContent="@media print{@page{size:A4 "+(land?"landscape":"portrait")+";margin:10mm}html,body,#printArea{margin:0!important;padding:0!important}#printArea table{border-collapse:collapse}#printArea td,#printArea th{color:#000!important}}";
  khPrintNow(pg)};
const head=(title,meta)=>`<table style="width:100%;border-collapse:collapse;${T13}" border="1" cellpadding="4"><tr><td style="width:24%;text-align:center"><img src="${LOGO()}" style="height:16mm"></td><td style="text-align:center;font-size:19px;font-weight:700">${title}</td><td style="width:27%;font-size:12.5px;line-height:1.5">${meta}</td></tr></table>`;
const box=c=>c?"☑":"☐";

/* ---------- nút trong chi tiết lệnh SX ---------- */
window.bbBtn=function(o,v){const sp=itemBy(o.maSP);if(!sp||sp.nhom!=="Bán thành phẩm")return;
  const d=document.createElement("div");d.className="actions";d.style.marginTop="6px";
  d.innerHTML=`<button class="btn" type="button" data-bb>Biên bản SX (BM.06)</button><button class="btn" type="button" data-hl>Phiếu hoá lý (BM.08)</button>`;
  const h2=v.querySelector("h2");(h2?h2.nextSibling:v.firstChild)?v.insertBefore(d,h2?h2.nextSibling:v.firstChild):v.appendChild(d);
  d.querySelector("[data-bb]").onclick=()=>bbDlg(o.so);d.querySelector("[data-hl]").onclick=()=>hlForm(o.maSP,o.so)};

/* ---------- BM.06 ---------- */
async function bbDlg(so){let D;try{D=await api("webBBGet",S.auth,so)}catch(e){return handleErr(e)}
  const o=D.o,sp=itemBy(o.maSP)||{ten:o.maSP},kh=D.kh,done=o.trangThai==="Hoàn thành";
  const mayParse=v=>{v=String(v||"").trim();if(!v)return[];if(v[0]==="["){try{return JSON.parse(v).filter(x=>x&&(x.ten||x.ma))}catch(e){}}return v.split(",").map(x=>x.trim()).filter(String).map(ma=>{const m=(D.may||[]).find(x=>x.ma===ma);return{ma,ten:m?m.ten:""}})};
  const mayL=mayParse((D.bb&&D.bb.may)||(kh&&kh.may));if(!mayL.length)mayL.push({ten:"",ma:""});
  const rowsMay=()=>mayL.map((m,i)=>`<tr><td><input data-j="${i}" data-g="ten" value="${esc(m.ten)}" placeholder="VD: Bồn khuấy SL 3000 lít"></td><td><input data-j="${i}" data-g="ma" value="${esc(m.ma)}" placeholder="VD: BKT-01"></td><td><button class="btn small danger" type="button" data-dm="${i}">×</button></td></tr>`).join("");
  const GBD="07:30",GKT="16:30",sl5=(v,a,b)=>v?String(v).slice(a,b):"";
  const tg=(D.bb&&D.bb.tg)||{bdN:sl5(kh&&kh.bdTT,0,10)||(kh&&kh.ngay)||o.ngay,bdG:sl5(kh&&kh.bdTT,11,16)||(kh&&kh.bd)||GBD,htN:o.ngayHT||sl5(kh&&kh.ktTT,0,10)||"",htG:sl5(kh&&kh.ktTT,11,16)||(kh&&kh.kt)||GKT};
  const me=(D.bb&&D.bb.me&&D.bb.me.length)?D.bb.me:[{ngay:o.ngayHT||(kh&&kh.ngay)||o.ngay,tu:tg.bdG,den:tg.htG,nguoi:o.nguoiSX||[kh&&kh.pc1,kh&&kh.pc2].filter(Boolean).join(", "),kg:done?o.slThucTe:""}];
  const w=document.createElement("div");w.className="cfm";
  const rowsMe=()=>me.map((m,i)=>`<tr><td><input type="date" data-i="${i}" data-f="ngay" value="${esc(m.ngay||"")}"></td><td><input type="time" data-i="${i}" data-f="tu" value="${esc(m.tu||"")}"></td><td><input type="time" data-i="${i}" data-f="den" value="${esc(m.den||"")}"></td><td><input data-i="${i}" data-f="nguoi" value="${esc(m.nguoi||"")}"></td><td><input type="number" step="any" data-i="${i}" data-f="kg" value="${esc(m.kg===""?"":m.kg)}"></td><td><button class="btn small danger" type="button" data-del="${i}">×</button></td></tr>`).join("");
  w.innerHTML=`<div class="cfm-box kh-dlg"><h2>Biên bản sản xuất BTP · ${esc(o.so)}</h2><p class="note">${esc(sp.ten)} · lô ${esc(D.lo)} · ${done?"thực tế "+kg(o.slThucTe)+" kg":"đang SX, dự kiến "+kg(o.slDuKien)+" kg"}. Nguyên liệu tech, máy, khối lượng, hao hụt tự lấy từ lệnh và kế hoạch phối trộn.</p>
   <b>1. Thời gian sản xuất</b> <small class="note">(chưa có giờ thì để giờ hành chính 07:30 – 16:30)</small>
   <div class="two"><label>Ngày bắt đầu<input type="date" id="bbBdN" value="${esc(tg.bdN||"")}"></label><label>Giờ bắt đầu<input type="time" id="bbBdG" value="${esc(tg.bdG||"")}"></label></div>
   <div class="two"><label>Ngày hoàn thành<input type="date" id="bbHtN" value="${esc(tg.htN||"")}"></label><label>Giờ hoàn thành<input type="time" id="bbHtG" value="${esc(tg.htG||"")}"></label></div>
   <b style="display:block;margin-top:10px">3. Máy móc, thiết bị</b>${kh&&kh.may?' <small class="note">(lấy từ kế hoạch phối trộn, sửa được)</small>':""}<div class="dgx"><table><thead><tr><th>Tên thiết bị</th><th>Mã số</th><th></th></tr></thead><tbody id="bbMayT">${rowsMay()}</tbody></table></div>
   <div class="kh-bar" style="margin-top:6px"><input type="search" id="bbMayQ" placeholder="🔍 Tìm nhanh máy theo mã hoặc tên (VD: AHK-12, nghiền bi, khuấy)…" autocomplete="off"><button class="btn small" type="button" id="bbMayAdd">+ Dòng trống</button></div><div class="kh-pick" id="bbMayL"></div>
   <b style="display:block;margin-top:10px">4. Bán thành phẩm từng mẻ</b><div class="dgx"><table><thead><tr><th>Ngày SX</th><th>Từ giờ</th><th>Đến giờ</th><th>Thực hiện</th><th>Số lượng (kg)</th><th></th></tr></thead><tbody id="bbMe">${rowsMe()}</tbody></table></div>
   <button class="btn small" type="button" id="bbAdd" style="margin-top:6px">+ Thêm mẻ</button>


   <label>Kết luận<select id="bbKL"><option value="">— chưa kết luận —</option>${D.ketLuan.map(k=>`<option${D.bb&&D.bb.ketLuan===k?" selected":""}>${esc(k)}</option>`).join("")}</select></label>
   <label>Ghi chú<input id="bbGC" value="${esc(D.bb?D.bb.ghiChu:"")}"></label>
   ${D.bb?`<p class="note">Lưu lần cuối: ${esc(D.bb.nguoi)} · ${esc(D.bb.luc)}</p>`:""}
   <div class="actions"><span style="flex:1"></span><button class="btn" type="button" data-x="close">Đóng</button><button class="btn" type="button" data-x="save">Lưu</button><button class="btn primary" type="button" data-x="print">Lưu & In</button></div></div>`;
  document.body.appendChild(w);
  const bind=()=>{w.querySelectorAll("#bbMe input").forEach(x=>x.oninput=()=>{me[+x.dataset.i][x.dataset.f]=x.value});w.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{me.splice(+b.dataset.del,1);$("bbMe").innerHTML=rowsMe();bind()})};bind();
  const bindMay=()=>{w.querySelectorAll("#bbMayT input").forEach(x=>x.oninput=()=>{mayL[+x.dataset.j][x.dataset.g]=x.value});w.querySelectorAll("[data-dm]").forEach(b=>b.onclick=()=>{mayL.splice(+b.dataset.dm,1);if(!mayL.length)mayL.push({ten:"",ma:""});$("bbMayT").innerHTML=rowsMay();bindMay()})};bindMay();
  $("bbMayAdd").onclick=()=>{mayL.push({ten:"",ma:""});$("bbMayT").innerHTML=rowsMay();bindMay()};
  const DM=(D.may&&D.may.length?D.may:MAY_TM).filter(m=>!m.ngung),fold=t=>String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/gi,"d").toLowerCase();
  const pick=()=>{const q=fold($("bbMayQ").value).trim(),dg=dangOf(sp),L=DM.filter(m=>!mayL.some(x=>x.ma===m.ma)&&(!q?(!dg||String(m.dang||"").toUpperCase().includes(dg)):fold(m.ma+" "+m.ten).includes(q))).slice(0,14);
    $("bbMayL").innerHTML=L.map(m=>`<button type="button" class="kh-pk" data-ma="${esc(m.ma)}"><b>${esc(m.ma)}</b> ${esc(m.ten)}</button>`).join("")||'<span class="note">Không thấy máy phù hợp — gõ tay ở dòng trống.</span>';
    $("bbMayL").querySelectorAll("[data-ma]").forEach(b=>b.onclick=()=>{const m=DM.find(x=>x.ma===b.dataset.ma);const i=mayL.findIndex(x=>!x.ten&&!x.ma);const o={ten:m.ten,ma:m.ma};if(i>=0)mayL[i]=o;else mayL.push(o);$("bbMayT").innerHTML=rowsMay();bindMay();$("bbMayQ").value="";pick()})};
  $("bbMayQ").oninput=pick;pick();
  $("bbAdd").onclick=()=>{me.push({ngay:me.length?me[me.length-1].ngay:o.ngay,tu:"07:30",den:"16:30",nguoi:me.length?me[me.length-1].nguoi:"",kg:""});$("bbMe").innerHTML=rowsMe();bind()};
  w.onclick=e=>{if(e.target===w)w.remove()};
  w.querySelectorAll("[data-x]").forEach(b=>b.onclick=async()=>{const x=b.dataset.x;if(x==="close")return w.remove();
    const d={me,tg:{bdN:$("bbBdN").value,bdG:$("bbBdG").value,htN:$("bbHtN").value,htG:$("bbHtG").value},ketLuan:$("bbKL").value,ghiChu:$("bbGC").value,may:JSON.stringify(mayL.map(m=>({ten:String(m.ten||"").trim(),ma:String(m.ma||"").trim()})).filter(m=>m.ten||m.ma))};b.disabled=true;
    try{if(can.phieu())await api("webBBSave",S.auth,so,d);toast("Đã lưu biên bản "+so);if(x==="print"){bbPrint(D,d);}w.remove()}catch(e){handleErr(e);b.disabled=false}})}
function bbPrint(D,d){const o=D.o,sp=itemBy(o.maSP)||{ten:o.maSP},kh=D.kh,tt=+D.tt||0,done=o.trangThai==="Hoàn thành";
  const mayP=v=>{v=String(v||"").trim();if(!v)return[];if(v[0]==="["){try{return JSON.parse(v)}catch(e){}}return v.split(",").map(x=>x.trim()).filter(String).map(ma=>{const m=(D.may||[]).find(x=>x.ma===ma);return{ma,ten:m?m.ten:""}})};const may=mayP(d.may||(kh&&kh.may));
  const nl=(()=>{const g={};D.nl.forEach(n=>{const k=n.ma+"|"+(n.lo||"");if(g[k])g[k].kg+=n.kg;else g[k]=Object.assign({},n)});const a=Object.values(g);return a.length?a:[null]})();if(!may.length)may.push(null);const me=(d.me||[]).filter(m=>m&&(m.ngay||m.nguoi||m.kg));if(!me.length)me.push(null);
  const tg=d.tg||{},bd=tg.bdN||(kh&&kh.bdTT?kh.bdTT.slice(0,10):(kh?kh.ngay:o.ngay)),ht=tg.htN||o.ngayHT||(kh&&kh.ktTT?kh.ktTT.slice(0,10):"");
  const khKg=+o.slDuKien||0,tu=done?+o.slThucTe:0,hh=khKg&&tu?(khKg-tu)/khKg*100:null,L=v=>tt&&v?kg(v/tt):"";
  const sec=t=>`<tr><td colspan="4" style="font-weight:700;background:#fff">${t}</td></tr>`,c="padding:3px 6px";
  const qc=o.qcSX||(kh&&kh.qc)||"",nv=o.nguoiSX||[kh&&kh.pc1,kh&&kh.pc2].filter(Boolean).join(", ");
  pr(`<div style="${T13}">${head("BIÊN BẢN SẢN XUẤT BÁN<br>THÀNH PHẨM","Mã số: BM.06-QC-QT.03<br>Phiên bản: 02<br>Ngày hiệu lực: 02/01/2026")}
  <table style="width:100%;border-collapse:collapse;margin-top:-1px;${T13}" border="1">
   ${sec("1. THÔNG TIN CHUNG")}
   <tr><td style="${c};width:50%" colspan="2">Tên sản phẩm: <b>${esc(sp.ten)}</b></td><td style="${c}" colspan="2">Số lô SX: <b>${esc(D.lo)}</b></td></tr>
   <tr><td style="${c}" colspan="2">Ngày bắt đầu: ${dmy(bd)}${tg.bdG?" lúc "+esc(tg.bdG):""}</td><td style="${c}" colspan="2">Ngày hoàn thành: ${dmy(ht)}${ht&&tg.htG?" lúc "+esc(tg.htG):""}</td></tr>
   ${sec("2. NGUYÊN LIỆU THUỐC KỸ THUẬT SỬ DỤNG")}
   ${nl.map((n,i)=>`<tr><td style="${c}" colspan="2">Tên tech${nl.length>1?" ("+(i+1)+")":""}: ${n?esc(n.ten||n.ma):""}</td><td style="${c}">Số lô: ${n?esc(n.lo||""):""}</td><td style="${c}">Số lượng: ${n?kg(n.kg)+" kg":""}</td></tr>`).join("")}
   ${sec("3. MÁY MÓC, THIẾT BỊ DÙNG SẢN XUẤT")}
   ${may.map((m,i)=>`<tr><td style="${c}" colspan="2">Tên thiết bị${may.length>1?" ("+(i+1)+")":""}: ${m?esc(m.ten):""}</td><td style="${c}" colspan="2">Mã số: ${m?esc(m.ma):""}</td></tr>`).join("")}
   ${sec('4. BÁN THÀNH PHẨM <i style="font-weight:400">(ghi nhận lại chi tiết nếu lệnh SX có nhiều mẻ)</i>')}
   ${me.map(m=>`<tr><td style="${c};width:30%">Ngày SX: ${m&&m.ngay?dmy(m.ngay):""}${m&&(m.tu||m.den)?` <span style="white-space:nowrap">(${esc(m.tu||"")} – ${esc(m.den||"")})</span>`:""}</td><td style="${c}">Thực hiện: ${m?esc(m.nguoi||""):""}</td><td style="${c}" colspan="2">Số lượng: ${m&&m.kg!==""&&m.kg!=null?kg(m.kg)+" kg":""}</td></tr>`).join("")}
   ${sec("5. KẾT QUẢ")}
   <tr><td style="${c}">*Khối lượng theo KH: <b>${kg(khKg)}</b> kg</td><td style="${c}">Thể tích: ${L(khKg)}${L(khKg)?" L":""}</td><td style="${c}" colspan="2" rowspan="2">Hao hụt (%): <b>${hh===null?"":nf.format(Math.round(hh*100)/100)}</b></td></tr>
   <tr><td style="${c}">*Khối lượng thu được: <b>${tu?kg(tu):""}</b> kg</td><td style="${c}">Thể tích: ${L(tu)}${L(tu)?" L":""}</td></tr>
   <tr><td style="${c}" colspan="4">Tỷ trọng (nếu có): ${tt?String(tt).replace(".",",")+" g/ml":""}</td></tr>
   <tr><td style="${c};font-weight:700">*Kết luận:</td><td style="${c}" colspan="3">${[["Đạt - Chuyển lưu kho BTP","Dán giấy trắng"],["Đạt - Chờ phối trộn","Dán giấy vàng"],["Phối lại","Dán giấy vàng"],["Chưa đạt - Chờ xử lý","Dán giấy đỏ"]].map(k=>`<span style="display:inline-block;width:48%;margin:3px 0;text-align:center">${box(d.ketLuan===k[0])} <b>${k[0]}</b><br><i>(${k[1]})</i></span>`).join("")}${d.ghiChu?`<div>Ghi chú: ${esc(d.ghiChu)}</div>`:""}</td></tr>
  </table>
  <table style="width:100%;margin-top:10px;text-align:center;${T13}"><tr style="vertical-align:top"><td><b>Nhân viên phối trộn</b><br><i>(Ký và ghi rõ họ tên)</i><br><br><br><br>${esc(nv)}</td><td><b>Thủ kho</b><br><i>(Ký và ghi rõ họ tên)</i><br><br><br><br></td><td><b>Nhân viên QC</b><br><i>(Ký và ghi rõ họ tên)</i><br><br><br><br>${esc(qc)}</td></tr></table></div>`)}

/* ---------- BM.08 ---------- */
const LIQ=["SL","SC","EC","OD","FS","EW","ME","SE","CS","DC"];
const CT=[["1","Ngoại quan","-",null],["2","pH (theo TCCS)","-",null],["2t","Nhiệt độ đo pH","°C",null],["3","Tỷ trọng (đối với dạng lỏng)","g/mL",LIQ],["4","Độ bọt (sau 1 phút)","mL",null],
  ["5","Độ mịn thử rây ướt (FS, OD, SC, WP, WG)","%",["FS","OD","SC","WP","WG"]],["6","Độ thấm ướt (WP, WG)","s",["WP","WG"]],["7","Độ bền nhũ tương (EC, ME), ban đầu","-",["EC","ME"]],
  ["7.1","+ Độ bền nhũ tương sau 0.5h — lớp kem","mL",["EC","ME"]],["7.2","+ Độ bền nhũ tương sau 2h — lớp kem","mL",["EC","ME"]],["8","Độ bền pha loãng (SL)","-",["SL"]],
  ["9","Độ bền phân tán (OD), ban đầu","-",["OD"]],["9.1k","+ Độ phân tán sau khi pha mẫu 0.5h — lớp kem","mL",["OD"]],["9.1c","+ Độ phân tán sau khi pha mẫu 0.5h — lớp cặn","mL",["OD"]],
  ["10","Độ bụi (GR)","%",["GR"]],["11","Quan sát kích thước hạt","-",null]];
const ap=(c,dg)=>!c[3]||!dg||c[3].includes(dg);
async function hlForm(ma,lo,soPhieu){let D;try{D=await api("webHLGet",S.auth,ma,lo,soPhieu||"")}catch(e){return handleErr(e)}
  const it=D.it||itemBy(D.ma)||{ten:D.ma},p=D.p,ro=!S.me.qc,kq=p?Object.assign({},p.kq):{};let dg=(p&&p.dang)||dangOf(it);
  if(!p&&D.tt&&LIQ.includes(dg))kq["3"]=String(D.tt).replace(".",",");
  const w=document.createElement("div");w.className="cfm";let all=false;
  const rows=()=>CT.filter(c=>all||ap(c,dg)).map(c=>`<tr><td>${esc(c[0].replace(/[tkc]$/,""))}</td><td>${esc(c[1])}</td><td>${esc(c[2])}</td><td><input data-k="${c[0]}" value="${esc(kq[c[0]]||"")}" ${ro?"disabled":""}></td></tr>`).join("");
  w.innerHTML=`<div class="cfm-box kh-dlg"><h2>Phiếu kiểm nghiệm hoá lý BTP${p?" · "+esc(p.so):""}</h2><p class="note">${esc(it.ten)} · lô <b>${esc(D.lo)}</b>${D.nsx?" · NSX "+dmy(String(D.nsx).slice(0,10)):""}</p>
   <div class="two"><label>Số phiếu<input id="hlSo" value="${esc(p?p.so:D.soMoi)}" ${ro?"disabled":""}></label><label>Ngày kiểm nghiệm<input id="hlNgay" type="date" value="${esc(p?p.ngay:S.today)}" ${ro?"disabled":""}></label></div>
   <label>Dạng chế phẩm<input id="hlDang" value="${esc(dg)}" ${ro?"disabled":""} placeholder="SC, EC, WP…"></label>
   <div class="kh-bar" style="margin:8px 0"><b>Chỉ tiêu</b><label class="kh-chk"><input type="checkbox" id="hlAll"><span>Hiện tất cả chỉ tiêu (không chỉ theo dạng)</span></label></div>
   <div class="dgx"><table><thead><tr><th>STT</th><th>Chỉ tiêu</th><th>ĐVT</th><th>Kết quả</th></tr></thead><tbody id="hlRows">${rows()}</tbody></table></div>
   <label>Kết luận<select id="hlKL" ${ro?"disabled":""}><option value="">— chưa kết luận —</option><option value="Đạt"${p&&p.ketLuan==="Đạt"?" selected":""}>Đạt – cho phép đóng gói</option><option value="Không đạt"${p&&p.ketLuan==="Không đạt"?" selected":""}>Không đạt – xử lý theo quy trình SP không phù hợp</option></select></label>
   <label>Nhận xét<input id="hlNX" value="${esc(p?p.nhanXet:"")}" ${ro?"disabled":""}></label>
   <p class="note">Phiếu <b>Đạt</b> tự vào hồ sơ lô (Phiếu kiểm hoá lý: ĐÃ CÓ), không cần chụp tải lên nữa. Tỷ trọng ghi ở đây cũng cập nhật vào lô.${p?" Lưu lần cuối: "+esc(p.nguoi)+" · "+esc(p.luc):""}</p>
   <div class="actions"><span style="flex:1"></span><button class="btn" type="button" data-x="close">Đóng</button>${ro?(p?'<button class="btn primary" type="button" data-x="in">In</button>':""):'<button class="btn" type="button" data-x="save">Lưu</button><button class="btn primary" type="button" data-x="print">Lưu & In</button>'}</div></div>`;
  document.body.appendChild(w);
  const keep=()=>w.querySelectorAll("#hlRows input").forEach(x=>{kq[x.dataset.k]=x.value});
  $("hlAll").onchange=e=>{keep();all=e.target.checked;$("hlRows").innerHTML=rows()};
  $("hlDang").oninput=()=>{keep();dg=$("hlDang").value.trim().toUpperCase();$("hlRows").innerHTML=rows()};
  w.onclick=e=>{if(e.target===w)w.remove()};
  w.querySelectorAll("[data-x]").forEach(b=>b.onclick=async()=>{const x=b.dataset.x;if(x==="close")return w.remove();keep();
    const d={so:$("hlSo").value.trim(),ma:D.ma,lo:D.lo,ngay:$("hlNgay").value,dang:$("hlDang").value.trim().toUpperCase(),kq,ketLuan:$("hlKL").value,nhanXet:$("hlNX").value.trim()};
    if(x==="in")return hlPrint(it,D,d);
    b.disabled=true;try{await api("webHLSave",S.auth,d);toast("Đã lưu phiếu hoá lý "+d.so);if(x==="print")hlPrint(it,D,d);w.remove();try{await refresh()}catch(e){}}catch(e){handleErr(e);b.disabled=false}})}
function hlPrint(it,D,d){const c="padding:4px 6px",dg=d.dang,v=k=>esc(d.kq[k]||""),na=k=>{const x=CT.find(c=>c[0]===k);return !ap(x,dg)};
  const r=(stt,ct,dv,kqv,k)=>`<tr><td style="${c};text-align:center">${stt}</td><td style="${c}">${ct}</td><td style="${c};text-align:center">${dv}</td><td style="${c}">${k&&na(k)&&!kqv?"—":kqv}</td></tr>`;
  pr(`<div style="${T13}">${head("PHIẾU KIỂM NGHIỆM HÓA LÝ<br>BÁN THÀNH PHẨM","Mã hiệu: BM.08-QC-QT.03<br>Lần ban hành: 02<br>Ngày ban hành: 02/01/2026<br>Trang: 1/1")}
  <table style="width:100%;border-collapse:collapse;margin-top:8px;${T13}" border="1"><tr><td style="${c}">Tên sản phẩm: <b>${esc(it.ten)}</b></td><td style="${c}">Dạng chế phẩm: <b>${esc(dg)}</b></td></tr>
   <tr><td style="${c}">Số lô SX: <b>${esc(D.lo)}</b></td><td style="${c}">Ngày SX: ${D.nsx?dmy(String(D.nsx).slice(0,10)):""}</td></tr>
   <tr><td style="${c}">Ngày kiểm nghiệm: ${dmy(d.ngay)}</td><td style="${c}">Số phiếu: <b>${esc(d.so)}</b></td></tr></table>
  <p style="margin:8px 0">Căn cứ đánh giá: Theo Tiêu chuẩn cơ sở (TCCS) hiện hành của sản phẩm. Chỉ thực hiện các chỉ tiêu áp dụng theo dạng chế phẩm:</p>
  <table style="width:100%;border-collapse:collapse;${T13}" border="1"><thead><tr><th style="${c};width:8%">STT</th><th style="${c}">Chỉ tiêu</th><th style="${c};width:13%">Đơn vị tính</th><th style="${c};width:30%">Kết quả</th></tr></thead><tbody>
   ${r(1,"Ngoại quan","-",v("1"),"1")}${r(2,"pH (theo TCCS), nhiệt độ đo (<sup>o</sup>C)","-",v("2")+(d.kq["2t"]?" ("+v("2t")+" °C)":""),"2")}${r(3,"Tỷ trọng (đối với dạng lỏng)","g/mL",v("3"),"3")}${r(4,"Độ bọt (sau 1 phút)","mL",v("4"),"4")}
   ${r(5,"Độ mịn thử rây ướt (FS, OD, SC, WP, WG)","%",v("5"),"5")}${r(6,"Độ thấm ướt (WP, WG)","s",v("6"),"6")}${r(7,"Độ bền nhũ tương (EC, ME), ban đầu","-",v("7"),"7")}
   ${r("7.1","+ Độ bền nhũ tương sau 0.5h","-",na("7.1")&&!d.kq["7.1"]?"":"Lớp kem: "+(v("7.1")||"…….")+" mL","7.1")}${r("7.2","+ Độ bền nhũ tương sau 2h","-",na("7.2")&&!d.kq["7.2"]?"":"Lớp kem: "+(v("7.2")||"…….")+" mL","7.2")}
   ${r(8,"Độ bền pha loãng (SL)","-",v("8"),"8")}${r(9,"Độ bền phân tán (OD), ban đầu","-",v("9"),"9")}
   ${r("9.1","+ Độ phân tán sau khi pha mẫu 0.5h","-",na("9.1k")&&!d.kq["9.1k"]&&!d.kq["9.1c"]?"":"Lớp kem: "+(v("9.1k")||"…….")+" mL<br>Lớp cặn: "+(v("9.1c")||"…….")+" mL","9.1k")}
   ${r(10,"Độ bụi (GR)","%",v("10"),"10")}${r(11,"Quan sát kích thước hạt","-",v("11"),null)}</tbody></table>
  <p style="margin:10px 0 4px"><b>Kết luận:</b> &nbsp; ${box(d.ketLuan==="Đạt")} Đạt – cho phép đóng gói &nbsp;&nbsp; ${box(d.ketLuan==="Không đạt")} Không đạt – Xử lý theo quy trình sản phẩm không phù hợp</p>
  <p style="margin:4px 0"><b>Nhận xét:</b> ${esc(d.nhanXet||"")}</p>
  <table style="width:100%;margin-top:14px;text-align:center;${T13}"><tr style="vertical-align:top"><td><b>Người thực hiện</b><br><br><br><br><br>${esc(S.me.ten)}</td><td><b>Trưởng phòng QA/QC</b><br><br><br><br><br></td></tr></table></div>`)}

/* ---------- mở phiếu từ hồ sơ lô (#hl:số phiếu) + nút lập phiếu trên thẻ lô ---------- */
document.addEventListener("click",e=>{const a=e.target.closest&&e.target.closest('a[href^="#hl:"]');if(!a)return;e.preventDefault();e.stopPropagation();const lc=document.getElementById("lotCard");if(lc)lc.remove();hlForm("","",decodeURIComponent(a.getAttribute("href").slice(4)))},true);
window.hlLotHook=function(boxEl,ma,lo,r){if(!r||!r.btp||!S.me||!S.me.qc)return;const has=(r.hs||[]).some(x=>x.loai==="Phiếu kiểm hoá lý");
  const b=document.createElement("button");b.type="button";b.className="btn small";b.style.margin="6px 0";b.textContent=has?"Xem / sửa phiếu hoá lý (BM.08)":"Lập phiếu hoá lý (BM.08)";
  b.onclick=()=>{const lc=document.getElementById("lotCard");if(lc)lc.remove();hlForm(ma,lo)};boxEl.insertBefore(b,boxEl.firstChild.nextSibling||null)};
window.hlForm=hlForm;window.bbDlg=bbDlg;
})();
