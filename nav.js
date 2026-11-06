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
const needOk=e=>{if(!e||!e.matches)return false;if(e.matches("input[type=checkbox],input[type=radio],input[type=hidden],input[type=search],input[type=file],input[type=range],input[type=color],[readonly],:disabled,[data-opt]"))return false;
  if(!e.closest(".cfm,.kh-dlg,form,#dgView,#pNhap,#pXuat,#pKK,.nhapForm,.card"))return false;if(NEED_SKIP.test(e.id||"")||/^Tìm|^Lọc|^Mã cần/i.test(e.placeholder||""))return false;
  if(/ghi chú|ghichu|note/i.test((e.id||"")+" "+(e.placeholder||"")+" "+((e.closest("label")||{}).textContent||"").slice(0,30)))return false;return true};
const needUpd=e=>{if(!needOk(e)){e.classList&&e.classList.remove("need-in");return}const v=e.tagName==="SELECT"?(e.value||"").trim():String(e.value||"").trim();e.classList.toggle("need-in",v==="")};
const needScan=r=>{try{(r.querySelectorAll?r:document).querySelectorAll("input,select").forEach(needUpd)}catch(_){}};
document.addEventListener("input",e=>needUpd(e.target),true);document.addEventListener("change",e=>needUpd(e.target),true);
let needT=0;try{new MutationObserver(()=>{clearTimeout(needT);needT=setTimeout(()=>needScan(document),120)}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["readonly","disabled","value"]})}catch(_){}
setTimeout(()=>needScan(document),500);
/* ---------- Thông báo nổi: tô màu theo nội dung ---------- */
try{const T=document.getElementById("toast");if(T){new MutationObserver(()=>{if(T.hidden)return;const m=T.textContent||"";T.classList.remove("t-ok","t-err","t-warn");
  if(/lỗi|không (được|thể|tìm|hợp lệ|đủ)|chưa (có|đủ|nhập|chọn|lưu)|thiếu|sai|quá |vượt|bị chặn|chỉ .* (được|mới)|phải |error|failed|denied/i.test(m))T.classList.add("t-err");
  else if(/cảnh báo|lưu ý|kiểm tra lại|⚠|lệch/i.test(m))T.classList.add("t-warn");
  else if(/^đã |thành công|xong|✓/i.test(m.trim()))T.classList.add("t-ok");
  T.style.animation="none";void T.offsetWidth;T.style.animation=""}).observe(T,{attributes:true,attributeFilter:["hidden"],childList:true,characterData:true,subtree:true})}}catch(_){}
}catch(e){}})();
