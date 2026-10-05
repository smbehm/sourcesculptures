(()=>{
const board=document.querySelector('.storyboard'),scenes=[...board.querySelectorAll('.scene')],links=[...document.querySelectorAll('.film-timeline a')];let current=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function go(index){index=Math.max(0,Math.min(scenes.length-1,index));board.scrollTo({left:scenes[index].offsetLeft-scenes[0].offsetLeft,behavior:reduced?'instant':'smooth'});history.replaceState(null,'','#'+scenes[index].id)}
document.querySelector('#previous').onclick=()=>go(current-1);document.querySelector('#next').onclick=()=>go(current+1);
links.forEach((a,i)=>a.onclick=e=>{e.preventDefault();go(i)});
board.addEventListener('keydown',e=>{if(e.target!==board)return;if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();go(e.key==='Home'?0:e.key==='End'?17:current+(e.key==='ArrowRight'?1:-1))}});
let pending=false;board.addEventListener('scroll',()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{current=scenes.reduce((best,s,i)=>Math.abs(s.offsetLeft-scenes[0].offsetLeft-board.scrollLeft)<Math.abs(scenes[best].offsetLeft-scenes[0].offsetLeft-board.scrollLeft)?i:best,0);links.forEach((a,i)=>{if(i===current)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current')});document.querySelector('#scene-position').textContent=`Scene ${String(current+1).padStart(2,'0')} of 18 · ${scenes[current].querySelector('h2').textContent}`;document.querySelector('#previous').disabled=current===0;document.querySelector('#next').disabled=current===17;pending=false})},{passive:true});
function hash(){const i=scenes.findIndex(s=>'#'+s.id===location.hash);if(i>=0)go(i)}window.addEventListener('hashchange',hash);hash();board.dispatchEvent(new Event('scroll'));
})();
