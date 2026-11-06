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
}catch(e){}})();
