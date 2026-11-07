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
/* máy của kế hoạch vừa chạy BTP khác mà chưa có biên bản vệ sinh BM.05 Đạt */
const kodes=s=>String(s||"").split(",").map(x=>x.trim()).filter(String),kkey=k=>k.bdTT||((k.ngay||"")+" "+(k.bd||"00:00"));
function vsMiss(id){const r=(K.data.kh||[]).find(x=>x.id===id);if(!r||!/^AHK\./i.test(r.so))return[];const oc=S.lenh.find(x=>x.so===r.so)||{},out=[];
  kodes(r.may).forEach(code=>{const prev=(K.data.kh||[]).filter(p=>p.so!==r.so&&kodes(p.may).includes(code)&&kkey(p)<kkey(r)&&(S.lenh.find(x=>x.so===p.so)||{}).trangThai!=="Đã huỷ").sort((a,b)=>kkey(a)<kkey(b)?1:-1)[0];
    if(!prev)return;const op=S.lenh.find(x=>x.so===prev.so)||{};if(!op.maSP||op.maSP===oc.maSP)return;
    if(!(K.data.vs||[]).some(v=>v.lenh===prev.so&&v.kq==="Đạt"&&v.may.includes(code)))out.push({code,so:prev.so,maSP:op.maSP})});return out}
window.khReload=()=>{if(K.data)load(true).then(()=>{if(document.getElementById("khBox")&&!document.getElementById("tab-khpt").hidden)khRender()}).catch(()=>{})};

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
function actBtns(r){const vs=/^AHK\./i.test(r.so)&&(r.tt==="Hoàn thành"||r.tt==="Xong phối trộn")?`<button class="btn small" type="button" data-vsl="${esc(r.so)}" title="Biên bản vệ sinh thiết bị (BM.05)">Vệ sinh</button>`:"";
  if(!canKH()||r.tt==="Hoàn thành"||r.tt==="Đã huỷ")return r.tt==="Hoàn thành"?`<button class="btn small" type="button" data-lenh="${esc(r.so)}">Xem lệnh</button>`+vs:"";
  if(r.tt==="Xong phối trộn")return `<button class="btn small primary" type="button" data-lenh="${esc(r.so)}">Hoàn thành lệnh</button>`+vs;
  if(r.tt==="Đang SX")return `<button class="btn small primary" type="button" data-act="kt" data-k="${esc(r.id)}">Kết thúc</button>`;
  return `<button class="btn small" type="button" data-act="bd" data-k="${esc(r.id)}">Bắt đầu</button>`}
function bindRows(v){
  v.querySelectorAll("tr[data-id]").forEach(tr=>tr.onclick=e=>{if(e.target.closest("button"))return;const r=rowsAll().find(x=>x.id===tr.dataset.id);if(r)khForm(r)});
  v.querySelectorAll("[data-act]").forEach(b=>b.onclick=async e=>{e.stopPropagation();if(b.dataset.act==="bd"&&!b.dataset.ok){const miss=vsMiss(b.dataset.k);if(miss.length&&window.vsWarn)return vsWarn(miss,()=>{b.dataset.ok="1";b.click()})}b.disabled=true;try{await api("webKHAct",S.auth,b.dataset.k,b.dataset.act);toast(b.dataset.act==="bd"?"Đã ghi giờ bắt đầu":"Đã ghi giờ kết thúc phối trộn");await load(true);khRender()}catch(x){handleErr(x);b.disabled=false}});
  v.querySelectorAll("[data-vsl]").forEach(b=>b.onclick=e=>{e.stopPropagation();if(window.vsDlg)vsDlg(b.dataset.vsl)});
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
  pg.textContent="@media print{@page{size:A4 "+(land?"landscape;margin:8mm}":"portrait;margin:10mm}")+"html,body,#printArea{margin:0!important;padding:0!important}#printArea table{border-collapse:collapse}#printArea table{max-width:calc(100% - 2px)}#printArea td,#printArea th{color:#000!important}}";
  /* tràn trang rất ít (≤10 %) → thu nhỏ vừa 1 trang, tránh in thừa trang trắng */
  try{const mm=96/25.4,W=(land?281:190)*mm,H=(land?194:277)*mm,t=document.createElement("div");t.style.cssText="position:absolute;left:-99999px;top:0;width:"+W+"px";t.innerHTML=html;document.body.appendChild(t);const h=t.scrollHeight;t.remove();
    if(h>H&&h<=H*1.2)pg.textContent=pg.textContent.replace(/\}$/,"#printArea{zoom:"+(Math.floor(H/h*1000)/1000-0.005)+"}}")}catch(e){}
  khPrintNow(pg)};
/* Mẫu in chung: Times New Roman 12.5pt, khung đều, tiêu đề mục nền xám nhạt */
const PCSS=`<style>
.pq{font:12.5pt/1.4 "Times New Roman",Times,serif;color:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pq table{width:100%;border-collapse:collapse;table-layout:fixed}.pq td,.pq th{border:1px solid #000;padding:5px 8px;vertical-align:middle;color:#000;word-wrap:break-word}
.pq .hd td{padding:4px 8px}.pq .hd .lg{width:23%;text-align:center}.pq .hd .lg img{height:22mm;max-width:100%;object-fit:contain}.pq .hd .tt{text-align:center;font-size:17pt;font-weight:700;line-height:1.3}
.pq .hd .mt{width:28%;font-size:11.5pt;line-height:1.55}
.pq .sec td{background:#f0f0f0;font-weight:700;padding:4px 8px}.pq .lb{color:#000}.pq b{font-weight:700}
.pq .gap{height:10px}.pq th{background:#f0f0f0;text-align:center;font-weight:700}.pq .c{text-align:center}.pq .r{text-align:right}
.pq .kl td{border:0;padding:3px 4px;text-align:center;width:50%}.pq .klb td{text-align:left;padding:3px 4px 3px 8mm}.pq .klb .kx{display:inline-block;width:1.5em}.pq .klb .kd{display:inline-block;margin-left:1.5em}.pq .kl{margin:2px 0}
.pq .sg{margin-top:12px}.pq .sg td{border:0;text-align:center;vertical-align:top;padding:0 4px}.pq .sg .nm{height:24mm;vertical-align:bottom;padding-bottom:2px}
.pq p{margin:8px 0}
</style>`;
const head=(title,meta)=>`<table class="hd"><tr><td class="lg"><img src="${LOGO()}"></td><td class="tt">${title}</td><td class="mt">${meta}</td></tr></table>`;
const box=c=>`<span style="font-size:14pt;vertical-align:-1px">${c?"☑":"☐"}</span>`;
const sign=L=>`<table class="sg"><tr>${L.map(x=>`<td><b>${x[0]}</b><br><i>(Ký và ghi rõ họ tên)</i></td>`).join("")}</tr><tr>${L.map(x=>`<td class="nm">${esc(x[1]||"")}</td>`).join("")}</tr></table>`;

/* Nút chung cho BM.06 / BM.08: Đóng · Lưu (phiếu mới) · Cập nhật (phiếu đã lưu) · In (chỉ in bản đã lưu) */
const btn4=(canW,saved)=>`<span style="flex:1"></span><button class="btn" type="button" data-x="close">Đóng</button>${canW?`<button class="btn" type="button" data-x="save"${saved?" disabled":""}>Lưu</button><button class="btn" type="button" data-x="upd"${saved?"":" disabled"}>Cập nhật</button>`:""}<button class="btn primary" type="button" data-x="in"${canW&&!saved?" disabled":""}>In</button>`;
function btnState(w,st){const q=x=>w.querySelector('[data-x="'+x+'"]');if(q("save"))q("save").disabled=st.saved;if(q("upd"))q("upd").disabled=!st.saved;if(q("in"))q("in").disabled=st.canW&&!st.saved}
function btnWire(w,st,save,print){w.addEventListener("input",()=>{st.dirty=true});w.addEventListener("change",()=>{st.dirty=true});
  w.querySelectorAll("[data-x]").forEach(b=>b.onclick=async()=>{const x=b.dataset.x;if(x==="close")return w.remove();
    if(x==="in"){if(st.canW&&st.dirty)return toast("Có thay đổi chưa lưu — bấm Cập nhật trước khi in.");return print()}
    b.disabled=true;try{const ok=await save();if(ok!==false){st.saved=true;st.dirty=false;toast(x==="upd"?"Đã cập nhật":"Đã lưu")}}catch(e){handleErr(e)}btnState(w,st)})}
/* ---------- nút trong chi tiết lệnh SX ---------- */
/* BM.06 / BM.08 chỉ dùng cho lô sản xuất mã AHK.… */
const isAHK=s=>/^AHK\./i.test(String(s||"").trim());
window.bbBtn=function(o,v){const sp=itemBy(o.maSP);if(!sp||sp.nhom!=="Bán thành phẩm"||!isAHK(o.so))return;
  const h2=v.querySelector("h2"),ins=d=>{(h2?h2.nextSibling:v.firstChild)?v.insertBefore(d,h2?h2.nextSibling:v.firstChild):v.appendChild(d)};
  if(window.qcTiles){const IC=window.QC_IC,d=document.createElement("div"),emp=x=>x===undefined||x===null||String(x).trim()==="";
    qcTiles(d,[{f:"bb",code:"BM.06",name:"Biên bản sản xuất BTP",icon:IC.doc,open:()=>bbDlg(o.so)},{f:"hl",code:"BM.08",name:"Phiếu kiểm nghiệm hoá lý",icon:IC.flask,open:()=>hlForm(o.maSP,o.so)},{f:"vs",code:"BM.05",name:"Vệ sinh thiết bị khuấy trộn",icon:IC.home,open:()=>vsDlg(o.so)}],async()=>{
      const [B,H,V]=await Promise.all([api("webBBGet",S.auth,o.so).catch(()=>null),api("webHLGet",S.auth,o.maSP,o.so,"").catch(()=>null),api("webVSGet",S.auth,o.so,"").catch(()=>null)]);const R={};
      const b=B&&B.bb;R.bb={n:b?1:0,gaps:b?[emp(b.ketLuan)&&"kết luận",emp(b.may)&&"thiết bị",!b.tg&&"thời gian sản xuất"].filter(Boolean):[]};
      const h=H&&H.p,kq=(h&&h.kq)||{};R.hl={n:h?1:0,gaps:h?[!Object.keys(kq).some(k=>!/^[#_]/.test(k)&&!emp(kq[k]))&&"kết quả kiểm",emp(h.ketLuan)&&"kết luận"].filter(Boolean):[]};
      const x=V&&V.p&&V.p.lenh===o.so?V.p:null;R.vs={n:x?1:0,gaps:x?[!(x.tb||[]).length&&"thiết bị",emp(x.kq)&&"kết quả vệ sinh"].filter(Boolean):[]};return R});
    ins(d);return}
  const d=document.createElement("div");d.className="actions";d.style.marginTop="6px";
  d.innerHTML=`<button class="btn" type="button" data-bb>Biên bản SX (BM.06)</button><button class="btn" type="button" data-hl>Phiếu hoá lý (BM.08)</button><button class="btn" type="button" data-vs>Vệ sinh thiết bị (BM.05)</button>`;
  ins(d);d.querySelector("[data-bb]").onclick=()=>bbDlg(o.so);d.querySelector("[data-hl]").onclick=()=>hlForm(o.maSP,o.so);d.querySelector("[data-vs]").onclick=()=>vsDlg(o.so)};

/* ---------- BM.06 ---------- */
/* Thời gian theo kế hoạch: lấy ngày + giờ của kế hoạch phối trộn; chưa có kế hoạch → giờ hành chính 07:30–16:30. */
function bbKH(o,kh){const n=(kh&&kh.ngay)||o.ngay||"";return{bdN:n,bdG:(kh&&kh.bd)||"07:30",htN:n,htG:(kh&&kh.kt)||"16:30"}}
/* Thời gian in: ô thực tế nào có thì dùng, ô nào trống thì theo kế hoạch. */
function bbTG(t,p){t=t||{};return{bdN:t.bdN||p.bdN,bdG:t.bdG||p.bdG,htN:t.htN||p.htN,htG:t.htG||p.htG}}
async function bbDlg(so){let D;try{D=await api("webBBGet",S.auth,so)}catch(e){return handleErr(e)}
  const o=D.o,sp=itemBy(o.maSP)||{ten:o.maSP},kh=D.kh,done=o.trangThai==="Hoàn thành";
  const mayParse=v=>{v=String(v||"").trim();if(!v)return[];if(v[0]==="["){try{return JSON.parse(v).filter(x=>x&&(x.ten||x.ma))}catch(e){}}return v.split(",").map(x=>x.trim()).filter(String).map(ma=>{const m=(D.may||[]).find(x=>x.ma===ma);return{ma,ten:m?m.ten:""}})};
  const mayL=mayParse((D.bb&&D.bb.may)||(kh&&kh.may));if(!mayL.length)mayL.push({ten:"",ma:""});
  const rowsMay=()=>mayL.map((m,i)=>`<tr><td><input data-j="${i}" data-g="ten" value="${esc(m.ten)}" placeholder="VD: Bồn khuấy SL 3000 lít"></td><td><input data-j="${i}" data-g="ma" value="${esc(m.ma)}" placeholder="VD: BKT-01"></td><td><button class="btn small danger" type="button" data-dm="${i}">×</button></td></tr>`).join("");
  const GBD="07:30",GKT="16:30",sl5=(v,a,b)=>v?String(v).slice(a,b):"";
  const kp=bbKH(o,kh),tg0=(D.bb&&D.bb.tg)||{},tg={bdN:tg0.bdN||sl5(kh&&kh.bdTT,0,10),bdG:tg0.bdG||sl5(kh&&kh.bdTT,11,16),htN:tg0.htN||sl5(kh&&kh.ktTT,0,10)||(done?o.ngayHT||"":""),htG:tg0.htG||sl5(kh&&kh.ktTT,11,16)},te=bbTG(tg,kp);
  const me=(D.bb&&D.bb.me&&D.bb.me.length)?D.bb.me:[{ngay:o.ngayHT||(kh&&kh.ngay)||o.ngay,tu:te.bdG,den:te.htG,nguoi:o.nguoiSX||[kh&&kh.pc1,kh&&kh.pc2].filter(Boolean).join(", "),kg:done?o.slThucTe:""}];
  const w=document.createElement("div");w.className="cfm";
  const rowsMe=()=>me.map((m,i)=>`<tr><td><input type="date" data-i="${i}" data-f="ngay" value="${esc(m.ngay||"")}"></td><td><input type="time" data-i="${i}" data-f="tu" value="${esc(m.tu||"")}"></td><td><input type="time" data-i="${i}" data-f="den" value="${esc(m.den||"")}"></td><td><input data-i="${i}" data-f="nguoi" value="${esc(m.nguoi||"")}"></td><td><input type="number" step="any" data-i="${i}" data-f="kg" value="${esc(m.kg===""?"":m.kg)}"></td><td><button class="btn small danger" type="button" data-del="${i}">×</button></td></tr>`).join("");
  w.innerHTML=`<div class="cfm-box kh-dlg"><h2>Biên bản sản xuất BTP · ${esc(o.so)}</h2><p class="note">${esc(sp.ten)} · lô ${esc(D.lo)} · ${done?"thực tế "+kg(o.slThucTe)+" kg":"đang SX, dự kiến "+kg(o.slDuKien)+" kg"}. Nguyên liệu tech, máy, khối lượng, hao hụt tự lấy từ lệnh và kế hoạch phối trộn.</p>
   <b>1. Thời gian sản xuất</b>
   <p class="note" style="margin:4px 0">Theo kế hoạch${kh?"":" (chưa có kế hoạch → giờ hành chính)"}: <b>${dmy(kp.bdN)} ${esc(kp.bdG)} – ${kp.htN!==kp.bdN?dmy(kp.htN)+" ":""}${esc(kp.htG)}</b>. Có thời gian thực tế thì nhập bên dưới; để trống thì biên bản in theo kế hoạch.</p>
   <div class="two"><label>Thực tế – ngày bắt đầu<input type="date" id="bbBdN" value="${esc(tg.bdN||"")}"></label><label>Giờ bắt đầu<input type="time" id="bbBdG" value="${esc(tg.bdG||"")}"></label></div>
   <div class="two"><label>Thực tế – ngày hoàn thành<input type="date" id="bbHtN" value="${esc(tg.htN||"")}"></label><label>Giờ hoàn thành<input type="time" id="bbHtG" value="${esc(tg.htG||"")}"></label></div>
   <b style="display:block;margin-top:10px">3. Máy móc, thiết bị</b>${kh&&kh.may?' <small class="note">(lấy từ kế hoạch phối trộn, sửa được)</small>':""}<div class="dgx"><table><thead><tr><th>Tên thiết bị</th><th>Mã số</th><th></th></tr></thead><tbody id="bbMayT">${rowsMay()}</tbody></table></div>
   <div class="kh-bar" style="margin-top:6px"><input type="search" id="bbMayQ" placeholder="🔍 Tìm nhanh máy theo mã hoặc tên (VD: AHK-12, nghiền bi, khuấy)…" autocomplete="off"><button class="btn small" type="button" id="bbMayAdd">+ Dòng trống</button></div><div class="kh-pick" id="bbMayL"></div>
   <b style="display:block;margin-top:10px">4. Bán thành phẩm từng mẻ</b><div class="dgx"><table><thead><tr><th>Ngày SX</th><th>Từ giờ</th><th>Đến giờ</th><th>Thực hiện</th><th>Số lượng (kg)</th><th></th></tr></thead><tbody id="bbMe">${rowsMe()}</tbody></table></div>
   <button class="btn small" type="button" id="bbAdd" style="margin-top:6px">+ Thêm mẻ</button>


   <label>Kết luận<select id="bbKL"><option value="">— chưa kết luận —</option>${D.ketLuan.map(k=>`<option${D.bb&&D.bb.ketLuan===k?" selected":""}>${esc(k)}</option>`).join("")}</select></label>
   <label>Ghi chú<input id="bbGC" value="${esc(D.bb?D.bb.ghiChu:"")}"></label>
   ${D.bb?`<p class="note">Lưu lần cuối: ${esc(D.bb.nguoi)} · ${esc(D.bb.luc)}</p>`:""}
   <div class="actions">${btn4(can.phieu(),!!D.bb)}</div></div>`;
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
  const getD=()=>({me,tg:{bdN:$("bbBdN").value,bdG:$("bbBdG").value,htN:$("bbHtN").value,htG:$("bbHtG").value},ketLuan:$("bbKL").value,ghiChu:$("bbGC").value,may:JSON.stringify(mayL.map(m=>({ten:String(m.ten||"").trim(),ma:String(m.ma||"").trim()})).filter(m=>m.ten||m.ma))});
  btnWire(w,{canW:can.phieu(),saved:!!D.bb,dirty:false},()=>api("webBBSave",S.auth,so,getD()),()=>bbPrint(D,getD()))}
function bbPrint(D,d){const o=D.o,sp=itemBy(o.maSP)||{ten:o.maSP},kh=D.kh,tt=+D.tt||0,done=o.trangThai==="Hoàn thành";
  const mayP=v=>{v=String(v||"").trim();if(!v)return[];if(v[0]==="["){try{return JSON.parse(v)}catch(e){}}return v.split(",").map(x=>x.trim()).filter(String).map(ma=>{const m=(D.may||[]).find(x=>x.ma===ma);return{ma,ten:m?m.ten:""}})};const may=mayP(d.may||(kh&&kh.may));
  const nl=(()=>{const g={};D.nl.forEach(n=>{const k=n.ma+"|"+(n.lo||"");if(g[k])g[k].kg+=n.kg;else g[k]=Object.assign({},n)});const a=Object.values(g);return a.length?a:[null]})();if(!may.length)may.push(null);const me=(d.me||[]).filter(m=>m&&(m.ngay||m.nguoi||m.kg));if(!me.length)me.push(null);
  const tg=d.tg||{},te=bbTG(tg,bbKH(o,kh)),bd=te.bdN,ht=te.htN,KHN='<br><i style="font-size:10.5pt">(theo kế hoạch)</i>';
  const khKg=+o.slDuKien||0,tu=done?+o.slThucTe:0,hh=khKg&&tu?(khKg-tu)/khKg*100:null,L=v=>tt&&v?kg(v/tt)+" L":"";
  const sec=t=>`<tr class="sec"><td colspan="4">${t}</td></tr>`,n=(i,a)=>a.length>1?" ("+(i+1)+")":"";
  const qc=o.qcSX||(kh&&kh.qc)||"",nv=o.nguoiSX||[kh&&kh.pc1,kh&&kh.pc2].filter(Boolean).join(", ");
  const KL=[["Đạt - Chuyển lưu kho BTP","Dán giấy trắng"],["Đạt - Chờ phối trộn","Dán giấy vàng"],["Phối lại","Dán giấy vàng"],["Chưa đạt - Chờ xử lý","Dán giấy đỏ"]];
  pr(`${PCSS}<div class="pq">${head("BIÊN BẢN SẢN XUẤT<br>BÁN THÀNH PHẨM","Mã số: BM.06-QC-QT.03<br>Phiên bản: 02<br>Ngày hiệu lực: 02/01/2026")}
  <table style="margin-top:-1px"><colgroup><col style="width:26%"><col style="width:24%"><col style="width:25%"><col style="width:25%"></colgroup>
   ${sec("1. THÔNG TIN CHUNG")}
   <tr><td colspan="2">Tên sản phẩm: <b>${esc(sp.ten)}</b><br>Mã vật tư: <b>${esc(o.maSP||"")}</b></td><td colspan="2">Số lô SX: <b>${esc(D.lo)}</b></td></tr>
   <tr><td colspan="2">Ngày bắt đầu: <b>${dmy(bd)}</b>${te.bdG?" lúc "+esc(te.bdG):""}${tg.bdN||tg.bdG?"":KHN}</td><td colspan="2">Ngày hoàn thành: <b>${dmy(ht)}</b>${ht&&te.htG?" lúc "+esc(te.htG):""}${tg.htN||tg.htG?"":KHN}</td></tr>
   ${sec("2. NGUYÊN LIỆU THUỐC KỸ THUẬT SỬ DỤNG")}
   ${nl.map((x,i)=>`<tr><td colspan="2">Tên tech${n(i,nl)}: <b>${x?esc(x.ten||x.ma):""}</b>${x&&x.ma?`<br>Mã vật tư: <b>${esc(x.ma)}</b>`:""}</td><td>Số lô: <b>${x?esc(x.lo||""):""}</b></td><td>Số lượng: <b>${x?kg(x.kg)+" kg":""}</b></td></tr>`).join("")}
   ${sec("3. MÁY MÓC, THIẾT BỊ DÙNG SẢN XUẤT")}
   ${may.map((m,i)=>`<tr><td colspan="2">Tên thiết bị${n(i,may)}: <b>${m?esc(m.ten):""}</b></td><td colspan="2">Mã số: <b>${m?esc(m.ma):""}</b></td></tr>`).join("")}
   ${sec('4. BÁN THÀNH PHẨM <i style="font-weight:400">(ghi nhận lại chi tiết nếu lệnh SX có nhiều mẻ)</i>')}
   ${me.map(m=>`<tr><td>Ngày SX: <b>${m&&m.ngay?dmy(m.ngay):""}</b>${m&&(m.tu||m.den)?`<br>${esc(m.tu||"")} – ${esc(m.den||"")}`:""}</td><td colspan="2">Thực hiện: ${m?esc(m.nguoi||""):""}</td><td>Số lượng: <b>${m&&m.kg!==""&&m.kg!=null?kg(m.kg)+" kg":""}</b></td></tr>`).join("")}
   ${sec("5. KẾT QUẢ")}
   <tr><td>*Khối lượng theo KH:</td><td class="r"><b>${kg(khKg)}</b> kg</td><td>Thể tích: <b>${L(khKg)}</b></td><td rowspan="2" class="c">Hao hụt (%)<br><b style="font-size:14pt">${hh===null?"":nf.format(Math.round(hh*100)/100)}</b></td></tr>
   <tr><td>*Khối lượng thu được:</td><td class="r"><b>${tu?kg(tu):""}</b> kg</td><td>Thể tích: <b>${L(tu)}</b></td></tr>
   <tr><td>Tỷ trọng (nếu có):</td><td class="r"><b>${tt?f3(tt):""}</b>${tt?" g/mL":""}</td><td colspan="2"></td></tr>
   <tr><td><b>*Kết luận:</b></td><td colspan="3"><table class="kl klb"><tr>${KL.slice(0,2).map(k=>`<td><span class="kx">${box(d.ketLuan===k[0])}</span><b>${k[0]}</b><br><i class="kd">(${k[1]})</i></td>`).join("")}</tr><tr>${KL.slice(2).map(k=>`<td><span class="kx">${box(d.ketLuan===k[0])}</span><b>${k[0]}</b><br><i class="kd">(${k[1]})</i></td>`).join("")}</tr></table>${d.ghiChu?`<div style="margin-top:4px">Ghi chú: ${esc(d.ghiChu)}</div>`:""}</td></tr>
  </table>
  ${sign([["Nhân viên phối trộn",""],["Thủ kho",""],["Nhân viên QC",""]])}</div>`)}

/* ---------- BM.08 ---------- */
/* Chỉ tiêu BTP theo QC-QĐ.03 "Quy định chất lượng bán thành phẩm" (cốt lõi QCVN 01-188:2018/BNNPTNT) + mẫu BM.08.
   Không gồm độ bền bảo quản (theo dõi ở sổ BM.10) và hàm lượng (phiếu kết quả hàm lượng riêng).
   [mã, tên, ĐVT, dạng áp dụng (null = mọi dạng), yêu cầu] */
const LIQ=["SL","SC","EC","OD","FS","EW","ME","SE","CS","DC","ES","PB-L"];
/* Phân bón: PB-L (lỏng) / PB-R (rắn) — chỉ tiêu hoá lý kiểm tại công ty theo QC-HD.35/37/50/51/52; hàm lượng dinh dưỡng gửi tổ chức thử nghiệm bên ngoài */
const isPB=dg=>/^PB-/.test(dg||"");
const pbOf=sp=>{const t=String((sp&&sp.ten)||""),m=String((sp&&sp.ma)||"");if(!/\bPB\b|PHÂN BÓN|^PB\./i.test(t+" "+m)&&!/^PB\./i.test(m))return "";return /RẮN|BỘT|HẠT|VIÊN|MẢNH/i.test(t)?"PB-R":"PB-L"};
const dangHL=sp=>pbOf(sp)||dangOf(sp);
const CT=[["1","Ngoại quan","-",null,"Đồng nhất, không phân lớp bất thường, không tạp chất lạ, không mùi bất thường"],
  ["pb1","Ngoại quan","-",["PB-L"],"Đồng nhất; màu đúng TCCS; không lắng cặn, không tách lớp, không vẩn đục bất thường; không có vật lạ"],
  ["pb1r","Ngoại quan","-",["PB-R"],"Màu và dạng đúng TCCS; đồng nhất; không vón cục, không chảy nước; không có tạp chất lạ"],
  ["2","pH","-",null,"Theo TCCS"],["2t","Nhiệt độ đo pH","°C",null,""],
  ["pbA","Độ ẩm","%",["PB-R"],"Theo TCCS"],
  ["pbC","Cỡ hạt (tỷ lệ hạt đạt cỡ)","%",["PB-R"],"Theo TCCS"],
  ["pbT","Độ tan (phân bón hoà tan, phân bón lá dạng rắn)","-",["PB-R"],"Tan hoàn toàn hoặc cặn không đáng kể theo TCCS; không làm tắc vòi phun"],
  ["3","Tỷ trọng (đối với dạng lỏng)","g/mL",LIQ,"Theo TCCS"],
  ["4","Độ bọt (sau 1 phút)","mL",["EC","EW","ME","SC","FS","OD","SE","SL","WP","WG"],"≤ 60 mL"],
  ["5","Độ mịn thử rây ướt (cặn trên rây 75 µm)","%",["SC","FS","WP","WG"],"≤ 2 %"],
  ["5d","Phân bố kích thước hạt (D90 / D50)","µm",["SC","FS","WP","WG"],"SC, FS: D90 ≤ 2,5 µm; D50 ≤ 2 µm · WP, WG: D90 ≤ 5 µm; D50 ≤ 2,5 µm (hoạt chất dễ phân huỷ / nóng chảy thấp: D90 ≤ 10 µm; D50 ≤ 5 µm)"],
  ["11","Quan sát kích thước hạt (kính hiển vi)","-",["SC","FS","WP","WG","OD"],"Theo QC-HD.45: dạng hạt, mức kết tụ, khoảng kích thước quan sát"],
  ["6","Độ thấm ướt","s",["WP","WG"],"Thấm ướt hoàn toàn trong 1 phút"],
  ["12","Tỷ suất lơ lửng","%",["SC","FS","WP","WG"],"≥ 60 %"],
  ["7","Độ bền nhũ tương — độ tự nhũ ban đầu","-",["EC","EW","ME"],"Hoàn toàn"],
  ["7.1","Độ bền nhũ tương sau 0,5 h — lớp kem","mL",["EC","EW","ME"],"≤ 2 mL"],
  ["7.2","Độ bền nhũ tương sau 2 h — lớp kem (khi nghi ngờ)","mL",["EC","EW","ME"],"≤ 4 mL"],
  ["8","Độ bền pha loãng (sau 18 h)","-",["SL"],"Đồng nhất, trong suốt hoặc trắng sữa, không lắng cặn"],
  ["9","Độ bền phân tán — độ phân tán ban đầu","-",["OD","SE"],"Hoàn toàn"],
  ["9.1k","Độ bền phân tán sau 0,5 h — lớp kem / lớp dầu","mL",["OD","SE"],"≤ 2 mL"],
  ["9.1c","Độ bền phân tán sau 0,5 h — lớp cặn","mL",["OD","SE"],"≤ 0,2 mL"],
  ["17","Kích thước hạt","-",["GR"],"Tỷ lệ đường kính lớn nhất/nhỏ nhất ≤ 4; ≥ 85 % hạt trong khoảng công bố"],
  ["10","Độ bụi (lượng bụi qua rây 50 µm)","%",["GR"],"≤ 1 %"]];
/* tỷ trọng: mặc định 3 số lẻ, dấu phẩy thập phân */
const f3=x=>{const t=String(x==null?"":x).trim();if(!/^\d+([.,]\d+)?$/.test(t))return t;return Number(t.replace(",",".")).toFixed(3).replace(".",",")};
const PBC=new Set(["2","2t","3"]);
const ap=(c,dg)=>isPB(dg)?(c[3]?c[3].includes(dg):PBC.has(c[0])):(c[3]?(!dg?!c[3].every(isPB):c[3].includes(dg)):true);
const fam=(c,dg)=>isPB(dg)?(PBC.has(c[0])||!!(c[3]&&c[3].some(isPB))):!(c[3]&&c[3].every(isPB));
const PHU=new Set(["5d","11"]);
const GN=new Set([]); /* chỉ tiêu chỉ ghi nhận (TCCS không quy định) — không đánh giá Đạt/Không đạt */ /* chỉ tiêu phụ (theo dõi kích thước hạt) — in thành bảng riêng */
/* Phương pháp thử mặc định = hướng dẫn nội bộ trong 8-HƯỚNG DẪN/QC - Hướng dẫn (sửa được trên phiếu) */
const PP={"1":"QC-HD.36","2":"QC-HD.35","3":"QC-HD.37","4":"QC-HD.38","5":"QC-HD.39","6":"QC-HD.40","7":"QC-HD.41","7.1":"QC-HD.41","7.2":"QC-HD.41","8":"QC-HD.42","9":"QC-HD.43","9.1k":"QC-HD.44","9.1c":"QC-HD.44","10":"QC-HD.54","17":"QC-HD.53","11":"QC-HD.45","12":"QC-HD.46","pb1":"QC-HD.52","pb1r":"QC-HD.52","pbA":"QC-HD.51","pbC":"QC-HD.52","pbT":"QC-HD.52"};
/* Thông tin mẫu lưu kèm trong kq với khoá bắt đầu bằng "_" ; đánh giá từng chỉ tiêu "~mã"; phương pháp sửa tay "@mã" */
const HD_DANG={EC:"07",EW:"08",GR:"09",ME:"10",SC:"11",SL:"12",WP:"13",WG:"14",GB:"22",AB:"23",CS:"24",DC:"25",OD:"26",FS:"27",PA:"28",RB:"29",SP:"30",SG:"31",DP:"32",SE:"33",ZC:"34","PB-L":"50","PB-R":"50"};
const hdLM=dg=>HD_DANG[dg]?"QC-HD."+HD_DANG[dg]:"";
/* mẫu lỏng: mL, chai PET / PE-PA kín; mẫu rắn: g, túi màng PE / chai PET kín */
const lmL=dg=>LIQ.includes(dg)||!dg,lmU=dg=>lmL(dg)?"mL":"g",lmBB=dg=>lmL(dg)?["Chai PET kín","Chai PE/PA kín"]:["Túi màng PE kín","Chai PET kín"];
const HLI=[["_lmt","Lấy mẫu theo","","VD: QC-HD.12"],["_ngm","Ngày nhận mẫu","date"],["_lm","Lượng mẫu"],["_bb","Bao bì mẫu"]];
async function hlForm(ma,lo,soPhieu){let D;try{D=await api("webHLGet",S.auth,ma,lo,soPhieu||"")}catch(e){return handleErr(e)}
  const it=D.it||itemBy(D.ma)||{ten:D.ma},p=D.p,ro=!S.me.qc,kq=p?Object.assign({},p.kq):{};let dg=(p&&p.dang)||dangHL(it);
  if(!p&&D.tt&&LIQ.includes(dg))kq["3"]=f3(D.tt);
  if(!p){kq._ngm=S.today;kq._lm="500";Object.assign(kq,D.muc||{})}if(!kq._lmt)kq._lmt=hdLM(dg);
  const w=document.createElement("div");w.className="cfm";let all=false;const dis=ro?"disabled":"";let hlCu=p?p.so:"";
  const row1=c=>{const k=c[0],ph=PHU.has(k);return `<tr><td>${esc(c[1])}${c[2]&&c[2]!=="-"?` <span class="note">(${esc(c[2])})</span>`:""}${k==="2t"?"":`<input class="hl-mu" data-m="${k}" value="${esc(kq["#"+k]||(/TCCS/.test(c[4]||"")?"":c[4]||""))}" ${dis} placeholder="${/TCCS/.test(c[4]||"")?"Mức TCCS, VD: 5,0 – 7,0":"Mức yêu cầu"}" title="Mức yêu cầu" style="margin-top:4px;font-size:12.5px;padding:5px 8px">`}</td><td><textarea class="hl-kq" rows="1" data-k="${k}" ${dis} placeholder="bỏ trống nếu không kiểm">${esc(kq[k]||"")}</textarea></td>
    <td>${k==="2t"?"":`<input class="hl-pp" style="font-size:13px;padding-left:6px;padding-right:4px" data-p="${k}" value="${esc(kq["@"+k]||PP[k]||"")}" ${dis} placeholder="PP thử">`}</td>
    <td>${k==="2t"?"":ph?'<span class="note">Theo dõi</span>':GN.has(k)?'<span class="note">Ghi nhận</span>':`<select class="hl-dg" data-g="${k}" ${dis}><option value="">—</option>${["Đạt","Không đạt"].map(x=>`<option${kq["~"+k]===x?" selected":""}>${x}</option>`).join("")}</select>`}</td></tr>`};
  const rows=()=>{const L=CT.filter(c=>all?fam(c,dg):ap(c,dg)),a=L.filter(c=>!PHU.has(c[0])),b=L.filter(c=>PHU.has(c[0]));return a.map(row1).join("")+(b.length?`<tr><td colspan="4" style="background:var(--accent-soft);font-weight:700">Chỉ tiêu phụ — kích thước hạt (theo dõi, không dùng để kết luận)</td></tr>`+b.map(row1).join(""):"")};
  const inf=x=>`<label>${x[1]}<input id="hl${x[0]}" ${x[2]?`type="${x[2]}"`:""} value="${esc(kq[x[0]]||"")}" ${dis} placeholder="${esc(x[3]||"")}"></label>`;
  w.innerHTML=`<div class="cfm-box kh-dlg"><h2>Phiếu kiểm nghiệm hoá lý BTP${p?" · "+esc(p.so):""}</h2><p class="note">${esc(it.ten)} · mã ${esc(D.ma)} · lô <b>${esc(D.lo)}</b>${D.nsx?" · NSX "+dmy(String(D.nsx).slice(0,10)):""}</p>
   <div class="two"><label>Số phiếu<input id="hlSo" value="${esc(p?p.so:D.soMoi)}" ${dis}></label><label>Ngày ra phiếu<input id="hlNgay" type="date" value="${esc(p?p.ngay:S.today)}" ${dis}></label></div>
   <label>Dạng chế phẩm <small class="note">(phân bón: PB-L lỏng, PB-R rắn)</small><input id="hlDang" value="${esc(dg)}" ${dis} placeholder="SC, EC, WP… / PB-L, PB-R" list="hlDangL"></label><datalist id="hlDangL"><option value="PB-L">Phân bón lỏng</option><option value="PB-R">Phân bón rắn</option></datalist>
   <b style="display:block;margin-top:8px">Thông tin mẫu</b>
   <div class="two">${inf(HLI[0])}${inf(HLI[1])}</div><div class="two"><label>Lượng mẫu (<span id="hlU">${lmU(dg)}</span>)<input id="hl_lm" type="number" min="0" step="any" value="${esc(/^[\d.,]+$/.test(kq._lm||"")?String(kq._lm).replace(",","."):"")}" ${dis}></label><label>Bao bì mẫu<select id="hl_bb" ${dis}></select></label></div>
   <div class="kh-bar" style="margin:8px 0"><b>Chỉ tiêu</b><label class="kh-chk"><input type="checkbox" id="hlAll"><span>Hiện tất cả chỉ tiêu (không chỉ theo dạng)</span></label></div>
   <div class="dgx hl-tb"><table><colgroup><col style="width:34%"><col style="width:32%"><col style="width:19%"><col style="width:15%"></colgroup><thead><tr><th>Chỉ tiêu · mức yêu cầu (<span id="hlCC">${isPB(dg)?"TCCS":"QC-QĐ.03"}</span>)</th><th>Kết quả</th><th>Phương pháp</th><th>Đánh giá</th></tr></thead><tbody id="hlRows">${rows()}</tbody></table></div>
   <label>Kết luận<select id="hlKL" ${dis}><option value="">— chưa kết luận —</option><option value="Đạt"${p&&p.ketLuan==="Đạt"?" selected":""}>Đạt – cho phép đóng gói</option><option value="Không đạt"${p&&p.ketLuan==="Không đạt"?" selected":""}>Không đạt – xử lý theo quy trình SP không phù hợp</option></select></label>
   <label>Nhận xét<input id="hlNX" value="${esc(p?p.nhanXet:"")}" ${dis}></label>
   <p class="note">Phiếu <b>Đạt</b> tự vào hồ sơ lô (Phiếu kiểm hoá lý: ĐÃ CÓ). Tỷ trọng ghi ở đây cũng cập nhật vào lô. Chỉ tiêu bỏ trống (không kiểm) sẽ không in.${p?" Lưu lần cuối: "+esc(p.nguoi)+" · "+esc(p.luc):""}</p>
   <div class="actions">${ro&&!p?'<span style="flex:1"></span><button class="btn" type="button" data-x="close">Đóng</button>':btn4(!ro,!!p)}</div></div>`;
  document.body.appendChild(w);
  const keep=()=>{w.querySelectorAll("#hlRows .hl-kq").forEach(x=>{kq[x.dataset.k]=x.value});
    w.querySelectorAll("#hlRows .hl-pp").forEach(x=>{const k=x.dataset.p,v=x.value.trim();kq["@"+k]=v&&v!==(PP[k]||"")?v:(v?"":"-")});
    w.querySelectorAll("#hlRows .hl-mu").forEach(x=>{const k=x.dataset.m,c=CT.find(y=>y[0]===k),v=x.value.trim();kq["#"+k]=v&&v!==(c[4]||"")?v:""});w.querySelectorAll("#hlRows .hl-dg").forEach(x=>{kq["~"+x.dataset.g]=x.value});HLI.forEach(x=>{kq[x[0]]=$("hl"+x[0]).value.trim()})};
  const grow=()=>w.querySelectorAll("#hlRows .hl-kq").forEach(t=>{const f=()=>{t.style.height="auto";t.style.height=Math.max(38,t.scrollHeight+2)+"px"};t.oninput=f;f()});
  grow();$("hlAll").onchange=e=>{keep();all=e.target.checked;$("hlRows").innerHTML=rows();grow()};
  const bbOpt=()=>{const L=lmBB(dg),cur=kq._bb&&L.includes(kq._bb)?kq._bb:L[0];$("hl_bb").innerHTML=L.map(x=>`<option${x===cur?" selected":""}>${x}</option>`).join("");$("hlU").textContent=lmU(dg)};bbOpt();
  $("hlDang").oninput=()=>{keep();const o=hdLM(dg);dg=$("hlDang").value.trim().toUpperCase();if(!kq._lmt||kq._lmt===o){kq._lmt=hdLM(dg);$("hl_lmt").value=kq._lmt};bbOpt();$("hlCC").textContent=isPB(dg)?"TCCS":"QC-QĐ.03";$("hlRows").innerHTML=rows();grow()};
  w.onclick=e=>{if(e.target===w)w.remove()};
  const getD=()=>{if(!ro)keep();const d={so:$("hlSo").value.trim(),soCu:hlCu,ma:D.ma,lo:D.lo,ngay:$("hlNgay").value,dang:$("hlDang").value.trim().toUpperCase(),kq,ketLuan:$("hlKL").value,nhanXet:$("hlNX").value.trim(),nguoi:p?p.nguoi:S.me.ten};
    if(!all)CT.forEach(c=>{if(!ap(c,d.dang)){delete kq[c[0]];delete kq["~"+c[0]];delete kq["@"+c[0]];delete kq["#"+c[0]]}}); /* bỏ chỉ tiêu không thuộc dạng (VD: SL không có kích thước hạt) */
    return d};
  btnWire(w,{canW:!ro,saved:!!p,dirty:false},async()=>{const d=getD(),kd=CT.filter(c=>String(kq[c[0]]||"").trim()&&kq["~"+c[0]]==="Không đạt").map(c=>c[1]);
    if(d.ketLuan==="Đạt"&&kd.length&&!confirm("Có chỉ tiêu đánh giá Không đạt ("+kd.join("; ")+") nhưng kết luận Đạt. Vẫn lưu?"))return false;
    await api("webHLSave",S.auth,d);hlCu=d.so;Promise.resolve().then(refresh).catch(()=>{})},()=>hlPrint(it,D,getD()))}
function hlPrint(it,D,d){const dg=d.dang,kq=d.kq||{},v=k=>String(kq[k]||"").trim(),dd=k=>v(k)?dmy(v(k)):"";
  const pp=k=>{const m=v("@"+k);return m==="-"?"":(m||PP[k]||"")};
  const R=[],P=[];CT.forEach(c=>{const k=c[0];if(k==="2t")return;let val=k==="3"?f3(v(k)):k==="2"&&/^\d+([.,]\d+)?$/.test(v(k))?Number(v(k).replace(",",".")).toFixed(1).replace(".",","):k==="12"&&/^\d+([.,]\d+)?$/.test(v(k))?Number(v(k).replace(",",".")).toFixed(1).replace(".",","):v(k);if(val&&!ap(c,dg)&&!v("~"+k)&&PHU.has(k))return;if(k==="2"&&val&&v("2t"))val+=" (ở "+v("2t")+" °C)";if(!val)return;(PHU.has(k)?P:R).push([c[1],c[2],v("#"+k)||c[4]||"",val,pp(k),PHU.has(k)?"Theo dõi":GN.has(k)?"Ghi nhận":v("~"+k)])});
  const tb=(L,empty)=>`<table class="kq"><colgroup><col style="width:5%"><col style="width:22%"><col style="width:6%"><col style="width:23%"><col style="width:24%"><col style="width:11%"><col style="width:9%"></colgroup><thead><tr><th>STT</th><th>Chỉ tiêu</th><th>ĐVT</th><th>Mức yêu cầu</th><th>Kết quả</th><th>Phương pháp thử</th><th>Đánh giá</th></tr></thead><tbody>${L.length?L.map((r,i)=>`<tr><td class="c">${i+1}</td><td>${esc(r[0])}</td><td class="c">${esc(r[1])}</td><td class="sm">${esc(r[2])}</td><td class="c" style="white-space:pre-wrap">${esc(r[3])}</td><td class="c">${esc(r[4])}</td><td class="c">${esc(r[5])}</td></tr>`).join(""):`<tr><td colspan="7" class="c"><i>${empty}</i></td></tr>`}</tbody></table>`;
  const sec=t=>`<tr class="sec"><td colspan="4">${t}</td></tr>`;
  pr(`${PCSS}<style>.pq{font-size:11.5pt;line-height:1.28}.pq p{margin:5px 0}.pq td,.pq th{padding:4px 7px}.pq .kq td,.pq .kq th{font-size:10.5pt;padding:3px 4px;line-height:1.25}.pq .sgw{flex:1 0 26mm;display:flex;margin-top:10px}.pq .sgw .sc{flex:1;text-align:center}.pq .sgw .dt{margin-bottom:3px}.pq .kq .sm{font-size:9.5pt}.pq .tin .lb{background:#fafafa}.pq.dense{font-size:10.5pt;line-height:1.18}.pq.dense td,.pq.dense th{padding:2px 5px}.pq.dense .kq td,.pq.dense .kq th{font-size:9.5pt;padding:2px 3px;line-height:1.15}.pq.dense .hd .lg img{height:17mm}.pq.dense p{margin:3px 0}.pq.hlp{display:flex;flex-direction:column;box-sizing:border-box;min-height:272mm;padding-bottom:15mm}@media print{.pq.hlp .ft{position:fixed;left:0;right:0;bottom:0;background:#fff}}.pq.hlp>table,.pq.hlp>p{flex:none}.pq .ft{font-size:8pt;font-style:italic;line-height:1.25;margin-top:auto;border-top:1px solid #000;padding-top:4px}.pq .ft div{margin:1px 0}</style>
  <div class="pq hlp${R.length+P.length>=8?" dense":""}">${head("PHIẾU KIỂM NGHIỆM<br>HÓA LÝ BÁN THÀNH PHẨM","Mã hiệu: BM.08-QC-QT.03<br>Lần ban hành: 02<br>Ngày ban hành: 02/01/2026<br>Trang: 1/1")}
  <p style="text-align:right;margin:4px 0">Số phiếu: <b>${esc(d.so)}</b></p>
  <table class="tin"><colgroup><col style="width:17%"><col style="width:35%"><col style="width:16%"><col style="width:32%"></colgroup>
   ${sec("1. THÔNG TIN MẪU")}
   <tr><td class="lb">Tên sản phẩm</td><td><b>${esc(it.ten)}</b></td><td class="lb">Mã vật tư</td><td><b>${esc(D.ma||it.ma||"")}</b></td></tr>
   ${(()=>{const sp=itemBy(D.ma)||it,h=(sp&&sp.hamLuong)||(window.hlGoiY?hlGoiY(sp):"");return h?`<tr><td class="lb">Hàm lượng ĐK</td><td colspan="3"><b>${esc(h)}</b></td></tr>`:""})()}
   <tr><td class="lb">Số lô SX</td><td><b>${esc(D.lo)}</b></td><td class="lb">Ngày SX</td><td><b>${D.nsx?dmy(String(D.nsx).slice(0,10)):""}</b></td></tr>
   <tr><td class="lb">${isPB(dg)?"Dạng phân bón":"Dạng chế phẩm"}</td><td><b>${esc(isPB(dg)?(dg==="PB-L"?"Phân bón dạng lỏng":"Phân bón dạng rắn"):dg)}</b></td><td class="lb">Lấy mẫu theo</td><td><b>${esc(v("_lmt"))}</b></td></tr>
   <tr><td class="lb">Ngày nhận mẫu</td><td><b>${dd("_ngm")}</b></td><td class="lb">Lượng mẫu</td><td>${v("_lm")?`<b>${esc(/^[\d.,]+$/.test(v("_lm"))?v("_lm").replace(".",",")+" "+lmU(dg):v("_lm"))}</b>`:""}${v("_bb")?" – "+esc(v("_bb").charAt(0).toLowerCase()+v("_bb").slice(1)):""}</td></tr>
  </table>
  <p style="margin:8px 0 2px"><b>2. KẾT QUẢ KIỂM NGHIỆM</b></p><p style="margin:0 0 4px;font-size:10.5pt"><i>${isPB(dg)?"Căn cứ mức yêu cầu: Tiêu chuẩn cơ sở (TCCS) / hồ sơ công bố hợp quy của sản phẩm; QCVN 106:2025/BNNMT – Quy chuẩn kỹ thuật quốc gia về chất lượng phân bón. Hàm lượng các chất dinh dưỡng do tổ chức thử nghiệm bên ngoài thực hiện (phiếu kết quả riêng).":"Căn cứ mức yêu cầu: Tiêu chuẩn cơ sở (TCCS) của sản phẩm; QC-QĐ.03 – Quy định chất lượng bán thành phẩm; QCVN 01-188:2018/BNNPTNT – Quy chuẩn kỹ thuật quốc gia về chất lượng thuốc bảo vệ thực vật."}</i></p>
  ${tb(R,"Chưa ghi kết quả chỉ tiêu nào")}
  ${P.length?`<p style="margin:8px 0 4px"><b>Chỉ tiêu phụ — kích thước hạt</b> <i>(theo dõi, không dùng để kết luận)</i></p>${tb(P,"")}`:""}
  <p style="margin:8px 0 2px"><b>3. KẾT LUẬN:</b>&nbsp;&nbsp; ${box(d.ketLuan==="Đạt")} Đạt – cho phép đóng gói &nbsp;&nbsp;&nbsp; ${box(d.ketLuan==="Không đạt")} Không đạt – xử lý theo quy trình sản phẩm không phù hợp</p>
  <p style="margin:4px 0"><b>Nhận xét:</b> ${esc(d.nhanXet||"")}</p>
  <div class="sgw"><div class="sc"><div class="dt">&nbsp;</div><b>Người kiểm nghiệm</b><br><i>(Ký và ghi rõ họ tên)</i></div><div class="sc"><div class="dt"><i>${(()=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(d.ngay||"");return m?`${(d.ngay||"")<"2025-07-01"?"Long An":"Tây Ninh"}, ngày ${m[3]} tháng ${m[2]} năm ${m[1]}`:"Tây Ninh, ngày ...... tháng ...... năm .........."})()}</i></div><b>Trưởng phòng QA/QC</b><br><i>(Phê duyệt – ký và ghi rõ họ tên)</i></div></div>
  <div class="ft"><div>- Kết quả chỉ có giá trị đối với mẫu thử của lô nêu trên. Không trích sao một phần phiếu khi chưa có sự đồng ý của phòng QA/QC.</div>
   <div>- Phiếu kiểm soát chất lượng nội bộ theo ISO 9001:2015, làm căn cứ cho phép chuyển công đoạn. Phòng thử nghiệm của công ty chưa được công nhận ISO/IEC 17025; phiếu không thay thế kết quả của tổ chức thử nghiệm được chỉ định / công nhận.</div>
   <div>- Phương pháp thử theo các hướng dẫn nội bộ QC-HD hiện hành; thiết bị đo được kiểm tra, hiệu chuẩn theo kế hoạch của công ty.</div></div>`)}

/* ---------- BM.05-QC-QT.03 Biên bản vệ sinh thiết bị khuấy trộn ---------- */
async function vsDlg(lenh,soPhieu){let D;try{D=await api("webVSGet",S.auth,lenh||"",soPhieu||"")}catch(e){return handleErr(e)}
  const o=D.o,p=D.p,sp=itemBy(o.maSP)||{ten:o.maSP},canW=can.phieu(),dis=canW?"":"disabled",DM=(D.may&&D.may.length?D.may:MAY_TM);
  const tenOf=ma=>{const m=DM.find(x=>x.ma===ma);return m?m.ten:""};
  const now=new Date(),hm=String(now.getHours()).padStart(2,"0")+":"+String(now.getMinutes()).padStart(2,"0");
  const tb=p?p.tb.map(t=>Object.assign({},t)):D.tb.map(t=>({ma:t.ma,ten:t.ten||tenOf(t.ma),quet:1,nuoc:1,dm:0})).concat([{ma:"",ten:"Sàn khu vực làm việc",quet:1,nuoc:0,dm:0}]);
  if(!tb.length)tb.push({ma:"",ten:"",quet:1,nuoc:1,dm:0});
  const ck=(i,f)=>`<input type="checkbox" data-i="${i}" data-f="${f}" ${tb[i][f]?"checked":""} ${dis}>`;
  const rows=()=>tb.map((t,i)=>`<tr><td><input data-i="${i}" data-f="ten" value="${esc(t.ten)}" ${dis}></td><td><input data-i="${i}" data-f="ma" value="${esc(t.ma)}" ${dis} style="width:90px"></td><td class="c">${ck(i,"quet")}</td><td class="c">${ck(i,"nuoc")}</td><td class="c">${ck(i,"dm")}</td><td>${canW?`<button class="btn small danger" type="button" data-del="${i}">×</button>`:""}</td></tr>`).join("");
  const sau=D.sau||[],ls=p?p.lenhSau:(sau[0]?sau[0].so:"");
  const w=document.createElement("div");w.className="cfm";
  w.innerHTML=`<div class="cfm-box kh-dlg"><h2>Biên bản vệ sinh thiết bị khuấy trộn${p?" · "+esc(p.so):""}</h2>
   <p class="note">Sau lệnh <b>${esc(o.so)}</b> · ${esc(sp.ten)}. Thiết bị lấy từ biên bản SX / kế hoạch phối trộn của lệnh, sửa được.</p>
   <div class="two"><label>Số phiếu<input id="vsSo" value="${esc(p?p.so:D.soMoi)}" ${p||!canW?"disabled":""}></label><label>BTP sẽ chạy (nếu có)<select id="vsSau" ${dis}><option value="">— không có / chưa biết —</option>${sau.map(x=>`<option value="${esc(x.so)}"${x.so===ls?" selected":""}>${esc(x.so)} · ${esc((itemBy(x.maSP)||{ten:x.maSP}).ten)} · ${esc(dmy(x.ngay))}</option>`).join("")}${ls&&!sau.some(x=>x.so===ls)?`<option value="${esc(ls)}" selected>${esc(ls)}</option>`:""}</select></label></div>
   <div class="two"><label>Ngày thực hiện<input type="date" id="vsNgay" value="${esc(p?p.ngay:S.today)}" ${dis}></label><label>Giờ thực hiện<input type="time" id="vsGio" value="${esc(p?p.gio:hm)}" ${dis}></label></div>
   <b style="display:block;margin-top:8px">Thao tác thực hiện</b> <small class="note">(đánh dấu = đã thực hiện; bỏ trống = không thực hiện)</small>
   <div class="dgx"><table><thead><tr><th>Vị trí vệ sinh</th><th>Mã thiết bị</th><th>Quét</th><th>Tráng nước</th><th>Tráng dung môi</th><th></th></tr></thead><tbody id="vsT">${rows()}</tbody></table></div>
   ${canW?`<div class="kh-bar" style="margin-top:6px"><select id="vsAddM"><option value="">+ Thêm thiết bị từ danh mục…</option>${DM.filter(m=>!m.ngung).map(m=>`<option value="${esc(m.ma)}">${esc(m.ma)} · ${esc(m.ten)}</option>`).join("")}</select><button class="btn small" type="button" id="vsAdd">+ Dòng trống</button></div>`:""}
   <label>Dung môi tráng<input id="vsDM" value="${esc(p?p.dm:"")}" ${dis} placeholder="VD: nước, Solvesso 150, NMP… (khi có tráng dung môi)"></label>
   <label>Ghi chú<input id="vsGC" value="${esc(p?p.ghiChu:"")}" ${dis}></label>
   <label>Kết quả vệ sinh <small class="note">(QC kết luận)</small><select id="vsKQ" ${canW&&S.me.qc?"":"disabled"}><option value="">— chưa kết luận —</option>${["Đạt","Không đạt"].map(x=>`<option${p&&p.kq===x?" selected":""}>${x}</option>`).join("")}</select></label>
   ${p?`<p class="note">Lưu lần cuối: ${esc(p.nguoi)} · ${esc(p.luc)}</p>`:""}
   <div class="actions">${btn4(canW,!!p)}</div></div>`;
  document.body.appendChild(w);
  const bind=()=>{w.querySelectorAll("#vsT input").forEach(x=>{const f=x.dataset.f,i=+x.dataset.i;x.oninput=x.onchange=()=>{tb[i][f]=x.type==="checkbox"?(x.checked?1:0):x.value}});
    w.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{tb.splice(+b.dataset.del,1);$("vsT").innerHTML=rows();bind()})};bind();
  if(canW){$("vsAdd").onclick=()=>{tb.push({ma:"",ten:"",quet:1,nuoc:1,dm:0});$("vsT").innerHTML=rows();bind()};
    $("vsAddM").onchange=e=>{const ma=e.target.value;if(!ma)return;tb.splice(Math.max(0,tb.length-1),0,{ma,ten:tenOf(ma),quet:1,nuoc:1,dm:0});e.target.value="";$("vsT").innerHTML=rows();bind()}}
  w.onclick=e=>{if(e.target===w)w.remove()};
  const getD=()=>({so:$("vsSo").value.trim(),lenh:o.so,lenhSau:$("vsSau").value,ngay:$("vsNgay").value,gio:$("vsGio").value,tb,dm:$("vsDM").value.trim(),ghiChu:$("vsGC").value.trim(),kq:$("vsKQ").value});
  btnWire(w,{canW,saved:!!p,dirty:false},async()=>{await api("webVSSave",S.auth,getD());$("vsSo").disabled=true;if(window.khReload)window.khReload()},()=>vsPrint(D,getD()))}
function vsPrint(D,d){const o=D.o,sp=itemBy(o.maSP)||{ten:o.maSP},ss=d.lenhSau?((D.sau||[]).find(x=>x.so===d.lenhSau)||{so:d.lenhSau,maSP:""}):null,spS=ss?(itemBy(ss.maSP)||{ten:ss.maSP}):null;
  const tb=(d.tb||[]).filter(t=>t.ma||t.ten),mk=v=>v?"✓":"X",may=tb.filter(t=>t.ma);
  pr(`${PCSS}<style>.pq .vs td,.pq .vs th{padding:5px 6px}.pq .vs .c{font-size:13pt}.pq .tin .lb{background:#fafafa}</style><div class="pq">${head("BIÊN BẢN VỆ SINH<br>THIẾT BỊ KHUẤY TRỘN","Mã hiệu: BM.05-QC-QT.03<br>Lần ban hành: 02<br>Ngày ban hành: 02/01/2026<br>Trang: 1/1")}
  <p style="text-align:right;margin:4px 0">Số phiếu: <b>${esc(d.so)}</b></p>
  <table class="tin"><colgroup><col style="width:19%"><col style="width:31%"><col style="width:19%"><col style="width:31%"></colgroup>
   <tr><td class="lb">Tên máy</td><td><b>${esc(may.map(t=>t.ten).join("; "))}</b></td><td class="lb">Mã thiết bị</td><td><b>${esc(may.map(t=>t.ma).join(", "))}</b></td></tr>
   <tr><td class="lb">Ngày thực hiện</td><td><b>${dmy(d.ngay)}</b></td><td class="lb">Thời gian thực hiện</td><td><b>${esc(d.gio||"")}</b></td></tr>
   <tr><td class="lb">Tên BTP vừa chạy</td><td><b>${esc(sp.ten)}</b><br>Lô: ${esc(o.so)}</td><td class="lb">Tên BTP sẽ chạy (nếu có)</td><td>${ss?`<b>${esc(spS.ten)}</b><br>Lô: ${esc(ss.so)}`:""}</td></tr>
  </table>
  <p style="margin:10px 0 4px"><b>Thao tác thực hiện:</b></p>
  <table class="vs"><colgroup><col style="width:7%"><col style="width:37%"><col style="width:16%"><col style="width:11%"><col style="width:12%"><col style="width:17%"></colgroup>
   <thead><tr><th>STT</th><th>Vị trí vệ sinh</th><th>Mã thiết bị</th><th>Quét</th><th>Tráng nước</th><th>Tráng dung môi</th></tr></thead>
   <tbody>${tb.map((t,i)=>`<tr><td class="c" style="font-size:12pt">${i+1}</td><td>${esc(t.ten)}</td><td class="c" style="font-size:12pt">${esc(t.ma)}</td><td class="c">${mk(t.quet)}</td><td class="c">${mk(t.nuoc)}</td><td class="c">${mk(t.dm)}</td></tr>`).join("")}</tbody></table>
  <p style="margin:4px 0;font-size:11pt"><i>(Ghi chú: ✓ Đã thực hiện, X Không thực hiện)</i></p>
  ${d.dm?`<p style="margin:4px 0"><b>Dung môi tráng:</b> ${esc(d.dm)}</p>`:""}
  <p><b>Ghi chú:</b> ${esc(d.ghiChu||"")}</p>
  <table style="margin-top:6px"><colgroup><col style="width:30%"><col style="width:70%"></colgroup><tr><td><b>Kết quả vệ sinh</b></td><td>${box(d.kq==="Đạt")} ĐẠT &nbsp;&nbsp;&nbsp;&nbsp; ${box(d.kq==="Không đạt")} KHÔNG ĐẠT</td></tr></table>
  ${sign([["Nhân viên pha chế",""],["NV QC",""]])}</div>`)}
/* Cảnh báo trước khi bắt đầu lệnh: máy vừa chạy BTP khác mà chưa có biên bản vệ sinh Đạt */
window.vsWarn=function(miss,onGo){const w=document.createElement("div");w.className="cfm";
  w.innerHTML=`<div class="cfm-box"><h2>Chưa có biên bản vệ sinh thiết bị</h2><p>Các máy sau vừa chạy BTP khác nhưng chưa có biên bản vệ sinh (BM.05) kết quả <b>Đạt</b>:</p><ul>${miss.map(m=>`<li><b>${esc(m.code)}</b> — sau lệnh ${esc(m.so)} (${esc((itemBy(m.maSP)||{ten:m.maSP}).ten)})</li>`).join("")}</ul>
   <div class="actions"><span style="flex:1"></span><button class="btn" type="button" data-x="huy">Huỷ</button><button class="btn" type="button" data-x="go">Vẫn bắt đầu</button><button class="btn primary" type="button" data-x="vs">Lập biên bản vệ sinh</button></div></div>`;
  document.body.appendChild(w);w.querySelectorAll("[data-x]").forEach(b=>b.onclick=()=>{w.remove();if(b.dataset.x==="go")onGo();else if(b.dataset.x==="vs")vsDlg(miss[0].so)})};
/* ---------- mở phiếu từ hồ sơ lô (#hl:số phiếu) + nút lập phiếu trên thẻ lô ---------- */
document.addEventListener("click",e=>{const a=e.target.closest&&e.target.closest('a[href^="#hl:"]');if(!a)return;e.preventDefault();e.stopPropagation();const lc=document.getElementById("lotCard");if(lc)lc.remove();hlForm("","",decodeURIComponent(a.getAttribute("href").slice(4)))},true);
window.hlLotHook=function(boxEl,ma,lo,r){if(!r||!r.btp||!S.me||!S.me.qc||!isAHK(lo))return;const has=(r.hs||[]).some(x=>x.loai==="Phiếu kiểm hoá lý");
  const b=document.createElement("button");b.type="button";b.className="btn small";b.style.margin="6px 0";b.textContent=has?"Xem / sửa phiếu hoá lý (BM.08)":"Lập phiếu hoá lý (BM.08)";
  b.onclick=()=>{const lc=document.getElementById("lotCard");if(lc)lc.remove();hlForm(ma,lo)};boxEl.insertBefore(b,boxEl.firstChild.nextSibling||null)};
window.hlForm=hlForm;window.bbDlg=bbDlg;window.vsDlg=vsDlg;window.BMK={PCSS,head,box,sign,pr,btn4,btnWire};
})();
