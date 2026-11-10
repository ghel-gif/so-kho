/* Điều hướng bằng phím mũi tên giữa các ô nhập + bỏ nút tăng/giảm ở ô số — áp dụng toàn phần mềm */
(()=>{try{
const st=document.createElement("style");
st.textContent="input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}input[type=number]{-moz-appearance:textfield;appearance:textfield}"+"input[type=number],input[inputmode=decimal],input[inputmode=numeric]{font-variant-numeric:tabular-nums}"+"td>input[type=number],td>input[inputmode=decimal],td>input[inputmode=numeric]{width:8.5ch!important;min-width:0;text-align:center;padding-left:4px;padding-right:4px}"+"input[type=number]:invalid,input.in-bad{border-color:#d93025!important;background:#fde8e6!important;color:#a50e0e}"+"input.in-warn{border-color:#d4a017!important;background:#fff6d6!important}"+"input.in-ok{border-color:#2e7d32!important;background:#e8f5e9!important}"+"input:focus.in-bad,input:focus.in-ok,input[type=number]:focus:invalid{outline:2px solid currentColor;outline-offset:0}";
/* tiện ích dùng chung: tô màu ô theo giới hạn */
window.inMark=(el,v,lo,hi)=>{if(!el)return;const n=+String(v??"").replace(",","."),has=String(v??"").trim()!==""&&isFinite(n);el.classList.toggle("in-bad",has&&((isFinite(lo)&&n<lo)||(isFinite(hi)&&n>hi)));el.classList.toggle("in-ok",has&&isFinite(lo)&&isFinite(hi)&&n>=lo&&n<=hi)};
document.head.appendChild(st);
const OK=new Set(["","text","number","search","tel","email","url","password"]);
const isField=e=>e&&e.tagName==="INPUT"&&OK.has((e.getAttribute("type")||"").toLowerCase());
const vis=e=>{if(e.disabled||e.readOnly||e.type==="hidden")return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=="hidden"};
const scope=e=>e.closest(".cfm-box,.cfm,dialog,[role=dialog]")||document.body;
function go(x,dir){
  const S=scope(x),a=x.getBoundingClientRect(),ax=a.left+a.width/2,ay=a.top+a.height/2;
  let best=null,bs=1e9;
  S.querySelectorAll("input").forEach(e=>{if(e===x||!isField(e)||!vis(e)||scope(e)!==S)return;
    const r=e.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let d,o;
    if(dir==="d"){if(r.top<a.bottom-2)return;d=r.top-a.bottom;o=Math.abs(cx-ax)}
    else if(dir==="u"){if(r.bottom>a.top+2)return;d=a.top-r.bottom;o=Math.abs(cx-ax)}
    else if(dir==="r"){if(r.left<a.right-2)return;d=r.left-a.right;o=Math.abs(cy-ay)}
    else{if(r.right>a.left+2)return;d=a.left-r.right;o=Math.abs(cy-ay)}
    const same=(dir==="d"||dir==="u")?(r.left<a.right&&r.right>a.left):(r.top<a.bottom&&r.bottom>a.top);
    const sc=(same?0:100000)+d+o*3;if(sc<bs){bs=sc;best=e}});
  if(best){best.focus();if(best.select&&isField(best))try{best.select()}catch(_){}}
  return best}
document.addEventListener("keydown",e=>{
  if(e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey)return;
  const x=e.target;if(!isField(x))return;
  const D={ArrowDown:"d",ArrowUp:"u",ArrowRight:"r",ArrowLeft:"l"}[e.key];if(!D)return;
  if(x.getAttribute("list")&&(D==="d"||D==="u"))return; // ô có gợi ý (datalist): giữ phím lên/xuống để chọn gợi ý
  if(D==="l"||D==="r"){let s=null,en=null;try{s=x.selectionStart;en=x.selectionEnd}catch(_){}
    if(s!=null){const L=x.value.length,all=s===0&&en===L&&L>0;if(!all&&(D==="l"?s>0||en>0:en<L||s<L))return}}
  if(x.type==="number"){e.preventDefault();go(x,D);return}
  if(go(x,D))e.preventDefault()},false);
document.addEventListener("wheel",e=>{const x=e.target;if(x&&x.type==="number"&&document.activeElement===x)x.blur()},{passive:true});
/* nút chỉ có biểu tượng: thêm nhãn cho trình đọc màn hình từ title */
const lab=r=>{(r.querySelectorAll?r:document).querySelectorAll("button:not([aria-label])").forEach(b=>{const t=(b.textContent||"").trim();if(b.title&&(!t||t.length<=2))b.setAttribute("aria-label",b.title)})};
try{lab(document);new MutationObserver(m=>m.forEach(x=>x.addedNodes.forEach(n=>{if(n.nodeType===1)lab(n)}))).observe(document.body,{childList:true,subtree:true})}catch(_){}

/* ---------- Ô cần nhập: tô vàng khi còn trống (ô tự điền / chỉ đọc màu xám) ---------- */
const NEED_SKIP=/^(q|dgQ|dlQ|lsQ|vtQ|qcQ)$|search|tim|loc|find/i;
const needOk=e=>{if(!e||!e.matches)return false;if(e.matches("[data-need]"))return !e.matches("[readonly],:disabled,[data-opt]");if(e.matches("textarea")&&!e.matches(".rd-kqv"))return false;if(e.matches("input[type=checkbox],input[type=radio],input[type=hidden],input[type=search],input[type=file],input[type=range],input[type=color],[readonly],:disabled,[data-opt]"))return false;
  if(!e.closest(".cfm,.kh-dlg,form,#dgView,#pNhap,#pXuat,#pKK,.nhapForm,.card"))return false;if(NEED_SKIP.test(e.id||"")||/^Tìm|^Lọc|^Mã cần|nếu có|không bắt buộc|tùy chọn/i.test(e.placeholder||""))return false;
  if(/ghi chú|ghichu|note/i.test((e.id||"")+" "+(e.placeholder||"")+" "+((e.closest("label")||{}).textContent||"").slice(0,30)))return false;return true};
/* Kết luận Đạt / Không đạt / Không kiểm: tô màu ngay khi chọn */
const vUpd=e=>{if(!e||e.tagName!=="SELECT")return;const o=e.options[e.selectedIndex],t=((o&&o.text)||"").trim().toLowerCase();
  const c=/^(không đạt|ko đạt|loại|hủy|fail)/.test(t)?"v-bad":/^(đạt|ok|pass|hoàn thành)/.test(t)?"v-ok":/^(không kiểm|chờ kiểm|chờ)/.test(t)?"v-na":"";
  e.classList.remove("v-ok","v-bad","v-na");if(c){e.classList.add(c);e.classList.remove("need-in")}};
/* nhãn của ô (label bọc trực tiếp ô): tô màu theo ô */
const fieldLb=e=>{const p=e&&e.parentElement;return p&&p.tagName==="LABEL"?p:null};
const lbSync=e=>{const l=fieldLb(e);if(l)l.classList.toggle("need-lb",!!l.querySelector(":scope>.need-in"))};
const needUpd=e=>{vUpd(e);if(e&&e.classList&&/v-(ok|bad|na)/.test(e.className)){e.classList.remove("need-in");lbSync(e);return}if(!needOk(e)){if(e.classList){e.classList.remove("need-in","need-nx");lbSync(e)}return}const v=e.tagName==="SELECT"?((e.value||"").trim()||(/không dùng|không có|chưa có|nếu có/i.test((e.options[e.selectedIndex]||{}).text||"")?"x":"")):String(e.value||"").trim();e.classList.toggle("need-in",v==="");if(v!=="")e.classList.remove("need-nx");lbSync(e)};
const needScan=r=>{try{(r.querySelectorAll?r:document).querySelectorAll("input,select,textarea.rd-kqv").forEach(needUpd)}catch(_){}needFocus()};

/* ---------- Chỉ chỗ cần điền: ô kế tiếp nhấp nháy + "Còn n ô cần điền" cạnh nút Lưu (bấm để tới ô) ---------- */
const NSC=".cfm-box,details,form,.card,.box";
const shown=e=>!!e&&e.getClientRects().length>0;
const nameOf=e=>{const l=fieldLb(e);let t="";if(l)t=[...l.childNodes].filter(n=>(n.nodeType===3&&n.textContent.trim())||(n.nodeType===1&&/^(SPAN|B)$/.test(n.tagName)))[0]?.textContent||"";
  if(!t.trim()){const r=e.closest(".line,.xline,.row,[data-bi],tr");const lb=r&&r.querySelector(".lbl,.name,th");if(lb&&!lb.contains(e))t=(lb.firstChild&&lb.firstChild.nodeType===3?lb.firstChild.textContent:"")||lb.textContent}
  if(!t.trim())t=e.getAttribute("aria-label")||"";t=t.replace(/\s*\*\s*$/,"").replace(/\s+/g," ").trim();return t.length>34?t.slice(0,32)+"…":t};
function needJump(sc){const L=(sc&&sc._needs||[]).filter(shown),e=L[0];if(!e)return;
  e.scrollIntoView({block:"center",behavior:"smooth"});
  setTimeout(()=>{try{e.focus({preventScroll:true})}catch(_){try{e.focus()}catch(_){}}e.classList.remove("need-flash");void e.offsetWidth;e.classList.add("need-flash");setTimeout(()=>e.classList.remove("need-flash"),1700)},280)}
let nfT=0;function needFocus(){clearTimeout(nfT);nfT=setTimeout(needFocus0,90)}
function needFocus0(){try{
  const M=new Map();
  document.querySelectorAll("input,select,textarea.rd-kqv").forEach(e=>{if(!needOk(e)||!shown(e))return;const sc=e.closest(NSC);if(!sc||sc.matches(".login")||sc.closest(".login"))return;
    let r=M.get(sc);if(!r)M.set(sc,r={need:[]});if(e.classList.contains("need-in"))r.need.push(e)});
  /* ô kế tiếp: trong hộp thoại đang mở (trên cùng) → khung đang gõ → khung đầu tiên còn ô trống */
  const dl=[...document.querySelectorAll(".cfm")].filter(shown).pop(),ae=document.activeElement;
  const C=[...M].filter(([sc,r])=>r.need.length&&(!dl||dl.contains(sc)));
  const A=C.find(([sc])=>sc.contains(ae))||C[0],nx=A?A[1].need[0]:null;
  document.querySelectorAll(".need-nx").forEach(x=>{if(x!==nx)x.classList.remove("need-nx")});
  document.querySelectorAll("label.need-nxl").forEach(x=>{if(!nx||x!==fieldLb(nx))x.classList.remove("need-nxl")});
  if(nx){nx.classList.add("need-nx");const l=fieldLb(nx);if(l)l.classList.add("need-nxl")}
  /* đếm ô còn trống của từng khung, đặt ở thanh nút cuối khung */
  const used=new Set();
  M.forEach((r,sc)=>{const n=r.need.length;sc._needs=r.need;if(n)sc._hadNeed=1;else if(!sc._hadNeed)return; /* khung chưa từng thiếu ô (VD bộ lọc báo cáo): không hiện */
    const a=[...sc.querySelectorAll(".actions")].filter(x=>x.closest(NSC)===sc&&shown(x)).pop();if(!a)return;used.add(a);
    let c=a.querySelector(":scope>.need-cnt");if(!c){c=document.createElement("button");c.type="button";c.className="need-cnt";c.onclick=()=>needJump(c.closest(NSC));a.prepend(c)}
    const nm=n?nameOf(r.need[0]):"",key=n+"|"+nm;if(c.dataset.k===key)return;c.dataset.k=key;c.classList.toggle("ok",!n);
    c.innerHTML=n?`<i aria-hidden="true"></i><span><b>Còn ${n} ô cần điền</b><small>${nm?"Tiếp: "+nm.replace(/[&<>"]/g,""):"Bấm để tới ô còn trống"}</small></span>`:"<b>✓ Đã điền đủ các ô</b>";
    c.title=n?"Bấm để tới ô còn trống":"";c.setAttribute("aria-label",n?`Còn ${n} ô cần điền, bấm để tới ô`:"Đã điền đủ các ô")});
  document.querySelectorAll(".need-cnt").forEach(c=>{if(!used.has(c.parentElement))c.remove()});
}catch(_){}}
document.addEventListener("input",e=>{needUpd(e.target);needFocus()},true);document.addEventListener("change",e=>{needUpd(e.target);needFocus()},true);
document.addEventListener("focusin",needFocus,true);document.addEventListener("toggle",needFocus,true);
let needT=0;try{new MutationObserver(()=>{clearTimeout(needT);needT=setTimeout(()=>needScan(document),120)}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["readonly","disabled","value","hidden","open","data-opt","data-need"]})}catch(_){}
setTimeout(()=>needScan(document),500);
/* ---------- Thông báo nổi: tô màu theo nội dung ---------- */
try{const T=document.getElementById("toast");if(T){new MutationObserver(()=>{if(T.hidden)return;const m=T.textContent||"";T.classList.remove("t-ok","t-err","t-warn");
  if(/lỗi|không (được|thể|tìm|hợp lệ|đủ)|chưa (có|đủ|nhập|chọn|lưu)|thiếu|sai|quá |vượt|bị chặn|chỉ .* (được|mới)|phải |error|failed|denied/i.test(m)||/^(ghi|chọn|nhập|điền) (?!xong)/i.test(m.trim()))T.classList.add("t-err");
  else if(/cảnh báo|lưu ý|kiểm tra lại|⚠|lệch/i.test(m))T.classList.add("t-warn");
  else if(/^đã |thành công|xong|✓/i.test(m.trim()))T.classList.add("t-ok");
  T.style.animation="none";void T.offsetWidth;T.style.animation="";
  /* báo lỗi khi lưu: ô đang được trỏ tới rung + viền đỏ; bộ đếm ô còn trống rung */
  if(T.classList.contains("t-err")&&T._lm!==m){T._lm=m;setTimeout(()=>{T._lm="";},1500);
    const a=document.activeElement;if(a&&a.matches&&a.matches("input,select,textarea")){a.classList.remove("in-miss");void a.offsetWidth;a.classList.add("in-miss");clearTimeout(a._mt);a._mt=setTimeout(()=>a.classList.remove("in-miss"),1800)}
    document.querySelectorAll(".need-cnt:not(.ok)").forEach(c=>{c.classList.remove("shake");void c.offsetWidth;c.classList.add("shake");setTimeout(()=>c.classList.remove("shake"),900)})}
  }).observe(T,{attributes:true,attributeFilter:["hidden"],childList:true,characterData:true,subtree:true})}}catch(_){}
}catch(e){}})();
