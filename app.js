const $=s=>document.querySelector(s),pad=n=>String(n).padStart(2,'0');
const app=$('#app'),pH=$('#pH'),pM=$('#pM'),pS=$('#pS'),dH=$('#dH'),dM=$('#dM'),dS=$('#dS'),lS=$('#lS');
let S={theme:'flip',ms:false,sound:true,vib:true,wake:false,labels:true,ds:'soft',rain:true,tap:'dbl',label:'',tp:[],zones:[],alarms:[],font:'theme',card:false,bg:'none',ori:'land',lang:'en',burn:true,swipe:true,pinch:true,off:'dbl',scale:1,sk:'beep',tags:['Padhai','Workout','Kaam','Reading'],guide:false,iv:{w:1500,b:300,l:900,n:4,auto:true,rounds:0,v:2},custom:{a:'#000000',b:'#000000',fa:'#4dd0ff',fb:'#ffffff',font:'Bebas Neue',glow:true,out:false,split:false},clk:{h24:false,sec:true,date:true,dp:'bottom',df:'dmy',lc:'',next:true},chime:{m:'off',say:true,snd:true,from:'07:00',to:'22:00'}};
try{Object.assign(S,JSON.parse(localStorage.getItem('chrono')||'{}'))}catch(e){}
if(!S.iv.v){S.iv.w*=60;S.iv.b*=60;S.iv.l*=60;S.iv.v=2}S.iv.rounds=S.iv.rounds|0;S.clk=Object.assign({h24:false,sec:true,date:true,dp:'bottom',df:'dmy',lc:'',next:true},S.clk);S.chime=Object.assign({m:'off',say:true,snd:true,from:'07:00',to:'22:00'},S.chime);let bx=0,by=0;
const save=()=>{try{localStorage.setItem('chrono',JSON.stringify(S))}catch(e){}};
const mk=()=>({base:0,run:false,t0:0,laps:[],fin:false});
const st={sw:mk(),tm:Object.assign(mk(),{target:300000}),iv:Object.assign(mk(),{target:1500000,phase:'work',done:0}),clk:mk()};
let mode='sw',cur=st.sw,layout=0,raf=0,lastKey='',cls='',lastSetup=null,hideT,alarmT,wl=null,actx=null;
try{const R=JSON.parse(localStorage.getItem('chrono_st')||'null');if(R){for(const k of ['sw','tm','iv'])Object.assign(st[k],R.st[k]||{});if(['sw','tm','iv'].includes(R.mode)){mode=R.mode;cur=st[mode]}}}catch(e){}
const persist=()=>{try{localStorage.setItem('chrono_st',JSON.stringify({mode,st:{sw:st.sw,tm:st.tm,iv:st.iv}}))}catch(e){}};
const el=()=>cur.base+(cur.run?Math.max(0,Date.now()-cur.t0):0);
const val=()=>mode==='sw'?el():Math.max(0,cur.target-el());
const idle=()=>!cur.run&&cur.base===0&&!cur.fin;

const cv=document.createElement('canvas').getContext('2d');
function metrics(d){
  const cs=getComputedStyle(d);cv.font=cs.fontWeight+' 100px '+cs.fontFamily;
  const m=cv.measureText('0123456789'),a=m.actualBoundingBoxAscent,b=m.actualBoundingBoxDescent;
  return{h:(a+b)||70,off:((m.fontBoundingBoxDescent-m.fontBoundingBoxAscent)/2+(a-b)/2)||0};
}
function fit(){
  const setup=app.classList.contains('setup'),por=innerHeight>innerWidth&&document.body.classList.contains('pm'),sc=S.scale||1;
  const ps=[...document.querySelectorAll('.panel')].filter(p=>getComputedStyle(p).display!=='none');
  ps.forEach(p=>{
    const d=p.querySelector('.digits');d.style.fontSize='100px';d.style.translate='none';
    const w=d.getBoundingClientRect().width||1,mt=metrics(d),mini=layout===3&&p===pS;
    const f=(mini?(por?.5:.18):(setup?.40:.68))*sc,wf=mini?(por?.5:.62):(layout>=3&&!por?.84:.92);
    p._s=Math.min(p.clientHeight*f/mt.h*100,p.clientWidth*wf/w*100);p._m=mt;
  });
  if(layout>=3){const u=Math.min(pH._s,pM._s);pH._s=pM._s=u}
  ps.forEach(p=>{
    const d=p.querySelector('.digits');d.style.fontSize=p._s+'px';
    let y=p._m.off*p._s/100;
    if(layout===3&&p===pS&&!por)y+=(pM._m.h*pM._s-pS._m.h*pS._s)/200;
    let x=0;if(layout>=3&&!por){if(p===pH)x=-p.clientWidth*.05;else if(p===pM)x=p.clientWidth*.04}
    d.style.translate=(x+bx)+'px '+(y+by)+'px';
  });
}
function setT(e,t){
  const ds=S.ds,mk2=(a,b)=>'<span class="sz">'+t+'</span><span class="fl a">'+t+'</span><span class="fl b">'+b+'</span>';
  if(ds==='card'){
    if(e.dataset.v===t)return;
    const o=e.dataset.v?e.dataset.v:t;e.dataset.v=t;
    if(o===t){e.innerHTML=mk2(t,t);return}
    e.innerHTML=mk2(t,o)+'<span class="fl c">'+o+'</span><span class="fl d">'+t+'</span>';
    clearTimeout(e._t);e._t=setTimeout(()=>{if(e.dataset.v===t)e.innerHTML=mk2(t,t)},650);return;
  }
  if(e.dataset.v){e.dataset.v='';e.textContent=''}
  if(e.textContent===t)return;e.textContent=t;
  if(ds==='soft'){e.classList.remove('flip');void e.offsetWidth;e.classList.add('flip')}
}
function render(){
  const clk=mode==='clk',v=clk?0:val(),tm=mode==='tm',cd=mode!=='sw',secs=cd?Math.ceil(v/1000):Math.floor(v/1000);
  let h=Math.floor(secs/3600),m=Math.floor(secs%3600/60),s=secs%60,ap='';const setup=tm&&idle();
  let l=h>0?3:(secs>=60||setup?2:1);let need=false;
  if(clk){const d=new Date();h=d.getHours();m=d.getMinutes();s=d.getSeconds();if(!S.clk.h24){ap=h>=12?'PM':'AM';h=h%12||12}l=S.clk.sec?3:4}
  if(setup!==lastSetup){lastSetup=setup;need=true}
  if(l!==layout){layout=l;need=true}
  const c='l'+l+(setup?' setup':'')+(cur.fin?' flash':'')+(mode==='iv'?' ph-'+cur.phase:'');
  if(c!==cls){cls=c;app.className=c}
  pH.dataset.slot='a';pM.dataset.slot=l>=3?'b':'a';pS.dataset.slot=l===1?'a':'b';
  const tH=(clk&&S.clk.h24)?pad(h):String(h),tM=pad(m),tS=pad(s);
  setT(dH,tH);setT(dM,tM);setT(dS,tS);
  labels(clk,ap);
  const key=l+':'+tH.length;if(key!==lastKey){lastKey=key;need=true}
  lS.textContent=(mode==='sw'&&S.ms)?T('seconds')+'  .'+pad(Math.floor(v%1000/10)):T('seconds');
  if(need)fit();
  $('#go').textContent=cur.fin?'■':(cur.run?'❚❚':'▶');
  $('#bLap').style.display=mode==='sw'?'':'none';
  chipsUpdate();
  const ph=$('#phase');ph.style.display=mode==='iv'?'block':'none';
  if(mode==='iv'){const n=S.iv.n,k=cur.phase==='work'?(cur.done%n)+1:(cur.done%n||n);ph.textContent=cur.fin?T('done'):T(cur.phase==='work'?'focus':cur.phase)+'  '+k+'/'+n+(S.iv.rounds?'  R'+(cur.done+(cur.phase==='work'?1:0))+'/'+S.iv.rounds:'')}
}
function loop(){render();if(mode!=='sw'&&cur.run&&val()<=0){if(mode==='iv')ivNext(Math.max(0,el()-cur.target));else{finish();return}}if(cur.run){cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}}
const ivDur=p=>(p==='work'?S.iv.w:p==='break'?S.iv.b:S.iv.l)*1000;
function ivReset(){const c=st.iv;c.phase='work';c.done=0;c.base=0;c.run=false;c.fin=false;c.rec=false;c.target=ivDur('work')}
function ivNext(over){
  over=over||0;
  if(cur.phase==='work'){
    addHist({k:'iv',d:cur.target,l:cur.label||S.label||''});cur.done++;
    if(S.iv.rounds&&cur.done>=S.iv.rounds){finish();return}
    cur.phase=cur.done%S.iv.n===0?'long':'break';
  }else cur.phase='work';
  cur.target=ivDur(cur.phase);cur.base=0;cur.t0=Date.now()-over;cur.run=S.iv.auto;
  if(over<2000){if(S.sound){beep();setTimeout(beep,250)}if(S.vib&&navigator.vibrate)navigator.vibrate([300,150,300])}
  render();persist();
}
function tone(f,t0,d,type,vol,f2){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const o=actx.createOscillator(),g=actx.createGain(),t=actx.currentTime+t0;o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.linearRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(actx.destination);o.start(t);o.stop(t+d)}catch(e){}}
function playSound(k){({beep:()=>tone(880,0,.18,'square',.15),chime:()=>{tone(660,0,.35,'sine',.3);tone(880,.3,.5,'sine',.3)},siren:()=>tone(600,0,.6,'sawtooth',.12,950),soft:()=>{[523,659,784].forEach((f,i)=>tone(f,i*.16,.3,'triangle',.25))},bell:()=>tone(1046,0,1.2,'sine',.35)})[k||'beep']()}
function beep(){playSound(S.sk)}
function stopAlarm(){clearInterval(alarmT);alarmT=0}
function finish(){
  if(mode==='tm')addHist({k:'tm',d:cur.target,l:cur.label||S.label||''});cur.run=false;cur.base=cur.target;cur.fin=true;cur.rec=true;wakeSync();screenOff(false);render();persist();
  if(S.vib&&navigator.vibrate)navigator.vibrate([400,200,400,200,400]);
  if(S.sound){beep();alarmT=setInterval(beep,650);setTimeout(stopAlarm,30000)}
}
async function getWake(){try{if(S.wake&&'wakeLock' in navigator&&!wl){wl=await navigator.wakeLock.request('screen');wl.addEventListener('release',()=>wl=null)}}catch(e){}}
function releaseWake(){try{wl&&wl.release()}catch(e){}wl=null}
function toggle(){if(mode==='clk')return;
  if(cur.fin){reset();return}
  if(cur.run){cur.base+=Date.now()-cur.t0;cur.run=false;cancelAnimationFrame(raf);wakeSync();render()}
  else{if(mode==='tm'&&cur.target<=0)return;cur.t0=Date.now();cur.run=true;getWake();if(!actx)beep0();loop()}
  poke();persist();
}
function beep0(){try{actx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}
function reset(){if(!cur.rec)recordSession();cur.rec=false;cur.label='';cur.run=false;cur.base=0;cur.laps=[];cur.fin=false;if(mode==='iv')ivReset();stopAlarm();cancelAnimationFrame(raf);wakeSync();render();drawLaps();persist()}
const fmt=ms=>{const t=Math.floor(ms/10),c=t%100,s=Math.floor(t/100)%60,m=Math.floor(t/6000)%60,h=Math.floor(t/360000);return(h?h+':'+pad(m):m)+':'+pad(s)+'.'+pad(c)};
function lap(){
  if(mode!=='sw'||(!cur.run&&cur.base===0))return;
  const t=el(),prev=cur.laps.length?cur.laps[0].total:0;
  cur.laps.unshift({n:cur.laps.length+1,split:t-prev,total:t,note:''});drawLaps();persist();
}
function drawLaps(){
  const L=st.sw.laps,sw=mode==='sw';
  $('#bLaps').textContent=sw&&L.length?T('laps')+' ('+L.length+')':T('laps');
  let mn=0,mx=0;if(L.length>1){const a=L.map(l=>l.split);mn=Math.min(...a);mx=Math.max(...a)}
  $('#lapList').innerHTML=(sw&&L.length)?L.map((l,i)=>'<div class="lap'+(mn!==mx&&l.split===mn?' best':mn!==mx&&l.split===mx?' worst':'')+'" data-i="'+i+'"><b>'+l.n+'</b><span>'+fmt(l.split)+'</span><b>'+fmt(l.total)+'</b><em>'+(l.note?esc(l.note):'+ note')+'</em></div>').join(''):'<p class="empty">Abhi koi lap nahi. Stopwatch chalte time Lap dabao.</p>';
}
function setMode(m){
  if(m===mode)return;
  if(cur.run)toggle();
  mode=m;cur=st[m];stopAlarm();clearTimeout(clkT);document.body.classList.toggle('m-clk',m==='clk');if(m==='clk')clkTick();
  $('#tSw').classList.toggle('on',m==='sw');$('#tTm').classList.toggle('on',m==='tm');$('#tIv').classList.toggle('on',m==='iv');$('#tClk').classList.toggle('on',m==='clk');
  layout=0;lastKey='';render();drawLaps();persist();clkx();
}
function theme(t){
  S.theme=t;document.body.dataset.theme=t;applyCustom();applyFont();document.body.classList.toggle('has-div',t==='neon'||t==='matrix');rain(t==='matrix'&&S.rain);save();
  document.querySelectorAll('.th').forEach(b=>b.classList.toggle('sel',b.dataset.t===t));
  (document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(fit);fit();
}
const THEMES=[['flip','Flip Classic','#000000','#ffffff'],['neon','Neon Glass','#2a1a7a','#2dffa0'],['amber','Amber Night','#000000','#ffb000'],['matrix','Matrix','#000000','#00ff41'],['paper','Paper Light','#ffffff','#000000'],['sunset','Sunset','#6a2a7a','#ff9a56'],['cyber','Cyberpunk','#ff3ec9','#2cf6ff'],['forest','Forest','#0a2a17','#c8f7c5'],['ice','Ice','#0b2c52','#9fe7ff'],['custom','Custom','#000000','#4dd0ff']];
const FONTS={'Bebas Neue':["'Bebas Neue',Impact,sans-serif",400],'Oswald':['Oswald,sans-serif',600],'Rajdhani':['Rajdhani,sans-serif',700],'Share Tech Mono':["'Share Tech Mono',monospace",400],'Orbitron':['Orbitron,sans-serif',800],'Anton':['Anton,Impact,sans-serif',400],'Exo 2':["'Exo 2',sans-serif",700],'Teko':['Teko,sans-serif',600],'System bold':['system-ui,sans-serif',800],'7-Segment (built-in)':['Chrono7Seg,monospace',400],'Pixel (built-in)':['ChronoPixel,monospace',400],'Stencil':["'Allerta Stencil',sans-serif",400],'Outline':["'Bungee Outline',sans-serif",400],'Audiowide':['Audiowide,sans-serif',400],'Black Ops':["'Black Ops One',sans-serif",400],'Playfair 900':["'Playfair Display',serif",900],'Nunito 900':['Nunito,sans-serif',900]};
function applyCustom(){
  const b=document.body.style,c=S.custom,on=S.theme==='custom',f=FONTS[c.font]||FONTS['Bebas Neue'];
  const L=parseInt(c.a.slice(1,3),16)*.3+parseInt(c.a.slice(3,5),16)*.59+parseInt(c.a.slice(5,7),16)*.11;
  const m={'--bgA':c.a,'--bgB':c.b,'--fgA':c.fa,'--fgB':c.fb,'--glow':c.glow?'0 0 .1em currentColor':'none','--font':f[0],'--w':f[1],'--ui':L>150?'#161616':'#fff'};
  for(const k in m)on?b.setProperty(k,m[k]):b.removeProperty(k);
  document.body.classList.toggle('c-out',on&&!!c.out);document.body.classList.toggle('c-split',on&&!!c.split);
  const sw=document.querySelector('.th[data-t=custom] i');if(sw)sw.style.background='linear-gradient(90deg,'+c.a+' 50%,'+c.fa+' 50%)';
}
$('#themes').innerHTML=THEMES.map(t=>'<button class="th" data-t="'+t[0]+'"><i style="background:linear-gradient(90deg,'+t[2]+' 50%,'+t[3]+' 50%)"></i><span>'+t[1]+'</span></button>').join('');
$('#themes').addEventListener('click',e=>{const b=e.target.closest('.th');if(b)theme(b.dataset.t)});

// controls
$('#go').onclick=toggle;$('#bReset').onclick=reset;$('#bLap').onclick=lap;
$('#tSw').onclick=()=>setMode('sw');$('#tTm').onclick=()=>setMode('tm');$('#tIv').onclick=()=>setMode('iv');$('#tClk').onclick=()=>setMode('clk');
document.querySelectorAll('.arr').forEach(b=>{let t=0,iv=0;
  const step=()=>{if(!(mode==='tm'&&idle()))return;cur.target=Math.max(0,Math.min(359999000,cur.target+(+b.dataset.u)*(+b.dataset.d)));persist();render()};
  const stop=()=>{clearTimeout(t);clearInterval(iv)};
  b.addEventListener('pointerdown',e=>{e.preventDefault();step();stop();t=setTimeout(()=>{iv=setInterval(step,90)},450)});
  ['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,stop));
});
const open=(id,on)=>{document.querySelectorAll('.sheet,#set').forEach(x=>x.classList.remove('open'));$(id).classList.toggle('open',on);poke()};
$('#bSet').onclick=()=>{const o=!$('#set').classList.contains('open');open('#set',o);if(o)goPage(lastPg)};$('#xSet').onclick=()=>open('#set',false);
$('#bLaps').onclick=()=>{drawLaps();open('#lapsheet',!$('#lapsheet').classList.contains('open'))};$('#xLap').onclick=()=>open('#lapsheet',false);
$('#bFs').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else{await document.documentElement.requestFullscreen();try{await screen.orientation.lock('landscape')}catch(e){}}}catch(e){}};
$('#rotOk').onclick=()=>$('#rot').classList.add('off');
[['#oMs','ms'],['#oLbl','labels'],['#oSnd','sound'],['#oVib','vib'],['#oWake','wake']].forEach(([id,k])=>{
  const i=$(id);i.checked=!!S[k];
  i.onchange=()=>{S[k]=i.checked;save();document.body.classList.toggle('nolbl',!S.labels);if(k==='wake'){wakeSync()}render()};
});
document.body.classList.toggle('nolbl',!S.labels);
// auto-hide chrome while running
function poke(){
  const ui=$('#ui');ui.classList.remove('hide');clearTimeout(hideT);
  hideT=setTimeout(()=>{if((cur.run||mode==='clk')&&!document.querySelector('.sheet.open,#set.open'))ui.classList.add('hide')},3500);
}
['pointerdown','pointermove','keydown'].forEach(ev=>document.addEventListener(ev,poke,{passive:true}));
document.addEventListener('keydown',e=>{
  if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  if(e.code==='Escape'){open('#set',false);screenOff(false)}else if(e.code==='Space'){e.preventDefault();toggle()}
  else if(e.key==='l'||e.key==='L')lap();
  else if(e.key==='r'||e.key==='R')reset();
  else if(e.key==='f'||e.key==='F')$('#bFs').click();
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(S.wake)getWake();if(cur.run)loop()}});
setInterval(()=>{if(document.hidden&&cur.run)loop()},1000);
window.addEventListener('resize',fit);
[['#cA','a'],['#cB','b'],['#cFA','fa'],['#cFB','fb']].forEach(([id,k])=>{const i=$(id);i.value=S.custom[k];i.oninput=()=>{S.custom[k]=i.value;theme('custom')}});
const cf=$('#cFont');cf.innerHTML=Object.keys(FONTS).map(n=>'<option>'+n+'</option>').join('');cf.value=S.custom.font;cf.onchange=()=>{S.custom.font=cf.value;theme('custom')};
const cg=$('#cGlow');cg.checked=!!S.custom.glow;cg.onchange=()=>{S.custom.glow=cg.checked;theme('custom')};
const ia=$('#ivAuto');ia.checked=!!S.iv.auto;ia.onchange=()=>{S.iv.auto=ia.checked;save()};
$('#bCsv').onclick=()=>{
  const L=st.sw.laps.slice().reverse();if(!L.length)return;
  const csv='Lap,Split,Total,Note\n'+L.map(l=>l.n+','+fmt(l.split)+','+fmt(l.total)+',\"'+String(l.note||'').replace(/\"/g,'\"\"')+'\"').join('\n');
  try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='laps.csv';document.body.appendChild(a);a.click();a.remove()}catch(e){}
  try{navigator.clipboard.writeText(csv).catch(()=>{})}catch(e){}
  const b=$('#bCsv');b.textContent='Done';setTimeout(()=>b.textContent='Export CSV',1500);
};
const co=$('#cOut');co.checked=!!S.custom.out;co.onchange=()=>{S.custom.out=co.checked;theme('custom')};
const cs=$('#cSplit');cs.checked=!!S.custom.split;cs.onchange=()=>{S.custom.split=cs.checked;theme('custom')};
[['#k24','h24'],['#kSec','sec'],['#kDate','date']].forEach(([id,k])=>{const i=$(id);i.checked=!!S.clk[k];i.onchange=()=>{S.clk[k]=i.checked;save();layout=0;lastKey='';render();clkx()}});
let swallow=false;
document.addEventListener('pointerdown',e=>{if(e.target.closest('#dlg'))return;if(!e.target.closest('.sheet,#bSet,#bLaps')){const o=document.querySelectorAll('.sheet.open');if(o.length)swallow=true;o.forEach(x=>x.classList.remove('open'))}});
const inField=e=>{const t=e.target.nodeType===1?e.target:e.target.parentElement;return t&&t.closest&&t.closest('input,select,textarea')};
document.addEventListener('selectstart',e=>{if(!inField(e))e.preventDefault()});
document.addEventListener('contextmenu',e=>{if(!inField(e))e.preventDefault()});
let clkT=0;function clkTick(){render();clkx();clkT=setTimeout(clkTick,1000-Date.now()%1000+15)}
const rc=$('#rain'),rx=rc.getContext('2d');let rainT=0;
function rain(on){
  clearInterval(rainT);if(!on)return;
  rc.width=innerWidth;rc.height=innerHeight;
  const fs=Math.max(14,Math.round(innerHeight/26)),cols=Array.from({length:Math.ceil(innerWidth/fs)},()=>Math.random()*rc.height/fs|0);
  rx.fillStyle='#000';rx.fillRect(0,0,rc.width,rc.height);
  rainT=setInterval(()=>{
    rx.fillStyle='rgba(0,0,0,.12)';rx.fillRect(0,0,rc.width,rc.height);rx.font=fs+'px monospace';rx.fillStyle='rgba(0,255,65,.6)';
    cols.forEach((y,i)=>{rx.fillText(String.fromCharCode(0x30A0+Math.random()*96),i*fs,y*fs);cols[i]=(y*fs>rc.height&&Math.random()>.975)?0:y+1});
  },70);
}
window.addEventListener('resize',()=>{if(S.theme==='matrix')rain(true)});

// ===== v5 modules =====
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function hms(s){return s>=3600?Math.floor(s/3600)+':'+pad(Math.floor(s%3600/60))+':'+pad(s%60):Math.floor(s/60)+':'+pad(s%60)}
function dur(ms){const s=Math.round(ms/1000);return s>=3600?Math.floor(s/3600)+'h '+Math.floor(s%3600/60)+'m':Math.floor(s/60)+'m '+pad(s%60)+'s'}
let HIST=[];try{HIST=JSON.parse(localStorage.getItem('chrono_hist')||'[]')}catch(e){}
const saveH=()=>{try{localStorage.setItem('chrono_hist',JSON.stringify(HIST))}catch(e){}};
function addHist(o){o.t=Date.now();HIST.unshift(o);if(HIST.length>500)HIST.length=500;saveH()}
function recordSession(){
  if(mode==='clk'||cur.rec)return;
  const d=mode==='sw'?el():(mode==='tm'?Math.min(el(),cur.target):(cur.phase==='work'?Math.min(el(),cur.target):0));
  if(d>=3000)addHist({k:mode,d:d,l:cur.label||S.label||''});
}
let askCb=null;
function ask(title,def,cb){$('#dT').textContent=title;const i=$('#dI');i.style.display=def===null?'none':'';i.value=def||'';askCb=cb;$('#dlg').classList.add('on');if(def!==null)setTimeout(()=>i.focus(),50)}
$('#dY').onclick=()=>{const v=$('#dI').value,f=askCb;$('#dlg').classList.remove('on');askCb=null;f&&f(v)};
$('#dN').onclick=()=>{$('#dlg').classList.remove('on');askCb=null};
$('#dI').addEventListener('keydown',e=>{if(e.key==='Enter')$('#dY').click()});
const IVP=[{n:'Pomodoro 25/5',v:{w:1500,b:300,l:900,n:4,rounds:0}},{n:'50/10',v:{w:3000,b:600,l:1800,n:4,rounds:0}},{n:'52/17',v:{w:3120,b:1020,l:1800,n:4,rounds:0}},{n:'Workout 40/20',v:{w:40,b:20,l:120,n:4,rounds:8}}];
function chipsUpdate(){
  const box=$('#chips'),sI=mode==='sw'&&idle(),tI=mode==='tm'&&idle(),iI=mode==='iv'&&idle();
  box.classList.toggle('show',sI||tI||iI);if(!(sI||tI||iI))return;
  const key=mode+JSON.stringify(S.tp)+S.label+S.lang;if(key===box._k)return;box._k=key;
  const tag='<button class="g tag" data-tag="1">🏷 '+esc(S.label||T('label'))+'</button>';
  box.innerHTML=(tI?'<button class="g" data-add="10000">+10s</button><button class="g" data-add="60000">+1m</button><button class="g" data-add="300000">+5m</button><button class="g" data-add="600000">+10m</button><button class="g" data-add="3600000">+1h</button><button class="g" data-add="0">Clear</button><button class="g" data-save="1">＋ Save</button>'+S.tp.map((p,i)=>'<button class="g on" data-tp="'+i+'">'+esc(p.n)+' '+hms(p.s)+'</button>').join(''):iI?IVP.map((p,i)=>'<button class="g" data-ivp="'+i+'">'+p.n+'</button>').join(''):'')+tag;
}
$('#chips').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.add!==undefined){if(mode!=='tm'||!idle())return;const a=+b.dataset.add;cur.target=a?Math.min(cur.target+a,359999000):0;persist();render()}
  else if(b.dataset.save){if(cur.target<1000)return;ask('Preset ka naam','',n=>{n=n.trim();if(!n)return;S.tp.push({n:n,s:Math.round(cur.target/1000)});save();drawPresets();render()})}
  else if(b.dataset.tp!==undefined){const p=S.tp[+b.dataset.tp];if(!p||!idle())return;cur.target=p.s*1000;cur.label=p.n;toggle()}
  else if(b.dataset.tag)pickTag();
  else if(b.dataset.ivp!==undefined)ivPreset(+b.dataset.ivp);
});
function drawPresets(){$('#tpList').innerHTML=S.tp.map((p,i)=>'<div class="hrow"><span>'+esc(p.n)+' · '+hms(p.s)+'</span><span><button class="g x" data-te="'+i+'">✎</button><button class="g x" data-td="'+i+'">×</button></span></div>').join('')||'<p class="empty">Timer tab me time set karke "＋ Save" dabao.</p>'}
$('#tpList').onclick=e=>{const d=e.target.closest('[data-td]'),r=e.target.closest('[data-te]');if(d){S.tp.splice(+d.dataset.td,1);save();drawPresets();render()}else if(r){const p=S.tp[+r.dataset.te];ask('Naya naam',p.n,n=>{n=n.trim();if(n){p.n=n;save();drawPresets();render()}})}};
const parseT=v=>{v=String(v).trim();if(v.includes(':')){const[a,b]=v.split(':');return Math.max(1,(+a||0)*60+(+b||0))}return Math.max(1,Math.round((+v||1)*60))};
const ivInputs=()=>{[['#ivW','w'],['#ivB','b'],['#ivL','l']].forEach(([id,k])=>$(id).value=hms(S.iv[k]));$('#ivN').value=S.iv.n;$('#ivR').value=S.iv.rounds};
function ivApply(){save();ivInputs();const c=st.iv;if(!c.run&&c.base===0&&!c.fin)c.target=ivDur(c.phase);persist();render()}
function ivPreset(i){Object.assign(S.iv,IVP[i].v);const c=st.iv;if(!c.run&&c.base===0)ivReset();ivApply()}
[['#ivW','w'],['#ivB','b'],['#ivL','l']].forEach(([id,k])=>{$(id).onchange=()=>{S.iv[k]=Math.min(parseT($(id).value),21600);ivApply()}});
$('#ivN').onchange=()=>{S.iv.n=Math.max(1,Math.min(12,Math.round(+$('#ivN').value)||1));ivApply()};
$('#ivR').onchange=()=>{S.iv.rounds=Math.max(0,Math.min(99,Math.round(+$('#ivR').value)||0));ivApply()};
$('#ivPresets').innerHTML=IVP.map((p,i)=>'<button class="g x" data-ivp="'+i+'">'+p.n+'</button>').join('');
$('#ivPresets').onclick=e=>{const b=e.target.closest('[data-ivp]');if(b)ivPreset(+b.dataset.ivp)};
const sel=(id,k,fn)=>{const e=$(id);e.value=S[k];e.onchange=()=>{S[k]=e.value;save();fn&&fn()}};
sel('#oDs','ds',()=>{[dH,dM,dS].forEach(d=>{d.dataset.v='';d.textContent=''});render()});
sel('#oTap','tap');
$('#oRain').checked=S.rain;$('#oRain').onchange=e=>{S.rain=e.target.checked;save();rain(S.theme==='matrix'&&S.rain)};
$('#lapList').onclick=e=>{const r=e.target.closest('.lap');if(!r)return;const l=st.sw.laps[+r.dataset.i];if(l)ask('Lap '+l.n+' note',l.note||'',v=>{l.note=v.trim();persist();drawLaps()})};
function renderHist(){
  const days={},labs={};
  HIST.forEach(h=>{const d=new Date(h.t).toLocaleDateString(undefined,{day:'numeric',month:'short'});days[d]=(days[d]||0)+h.d;const l=h.l||'(bina label)';labs[l]=(labs[l]||0)+h.d});
  const sec=(t,o)=>'<h3>'+t+'</h3>'+(Object.keys(o).slice(0,7).map(k=>'<div class="hrow"><span>'+esc(k)+'</span><b>'+dur(o[k])+'</b></div>').join('')||'<p class="empty">Kuch nahi</p>');
  $('#hBody').innerHTML=sec('Din ke hisaab se',days)+sec('Label ke hisaab se',labs)+'<h3>Recent</h3>'+(HIST.slice(0,15).map(h=>'<div class="hrow"><span>'+new Date(h.t).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+' · '+({sw:'Stopwatch',tm:'Timer',iv:'Focus'})[h.k]+(h.l?' · '+esc(h.l):'')+'</span><b>'+dur(h.d)+'</b></div>').join('')||'<p class="empty">Abhi koi session nahi.</p>');
}
$('#hClear').onclick=()=>ask('Pura history clear karna hai?',null,()=>{HIST=[];saveH();renderHist()});
const dl=(name,txt,type)=>{try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type}));a.download=name;document.body.appendChild(a);a.click();a.remove()}catch(e){}try{navigator.clipboard.writeText(txt).catch(()=>{})}catch(e){}};
$('#bkEx').onclick=()=>{const j=JSON.stringify({app:'chrono',v:5,settings:S,history:HIST});$('#bkTxt').value=j;dl('chrono-backup.json',j,'application/json')};
function importJSON(t){try{const o=JSON.parse(t);if(o.app!=='chrono'||!o.settings)throw 0;Object.assign(S,o.settings);if(Array.isArray(o.history))HIST=o.history.slice(0,500);save();saveH();location.reload()}catch(e){$('#bkPaste').textContent='Galat JSON';setTimeout(()=>$('#bkPaste').textContent='Paste se import',1800)}}
$('#bkIm').onclick=()=>$('#bkFile').click();
$('#bkFile').onchange=e=>{const f=e.target.files[0];if(f)f.text().then(importJSON)};
$('#bkPaste').onclick=()=>importJSON($('#bkTxt').value);
const ZONES=[['Delhi (India)','Asia/Kolkata'],['Dubai','Asia/Dubai'],['Riyadh','Asia/Riyadh'],['Karachi','Asia/Karachi'],['Dhaka','Asia/Dhaka'],['Kathmandu','Asia/Kathmandu'],['London','Europe/London'],['Paris','Europe/Paris'],['Istanbul','Europe/Istanbul'],['Moscow','Europe/Moscow'],['Cairo','Africa/Cairo'],['New York','America/New_York'],['Toronto','America/Toronto'],['Los Angeles','America/Los_Angeles'],['Singapore','Asia/Singapore'],['Hong Kong','Asia/Hong_Kong'],['Beijing','Asia/Shanghai'],['Tokyo','Asia/Tokyo'],['Sydney','Australia/Sydney'],['Auckland','Pacific/Auckland']];
$('#zSel').innerHTML=ZONES.map(z=>'<option value="'+z[1]+'">'+z[0]+'</option>').join('');
function drawZones(){$('#zList').innerHTML=S.zones.map((z,i)=>'<div class="hrow"><span>'+esc(z.n)+'</span><button class="g x" data-zi="'+i+'">×</button></div>').join('')}
$('#zAdd').onclick=()=>{const o=$('#zSel').selectedOptions[0];if(S.zones.length<6&&!S.zones.some(z=>z.z===o.value)){S.zones.push({n:o.textContent,z:o.value});save();drawZones();clkx()}};
$('#zList').onclick=e=>{const b=e.target.closest('[data-zi]');if(b){S.zones.splice(+b.dataset.zi,1);save();drawZones();clkx()}};
let lastRing='';
function stopRing(){$('#ring').classList.remove('on');stopAlarm()}
$('#ringX').onclick=stopRing;
document.addEventListener('pointerdown',()=>{if(!actx)beep0();if(actx&&actx.state==='suspended')actx.resume()});

// ===== v7 modules =====
const MODES=['sw','tm','iv','clk'];
const I18N={en:{sw:'Stopwatch',tm:'Timer',iv:'Interval',clk:'Clock',reset:'Reset',lap:'Lap',laps:'Laps',hours:'HOURS',minutes:'MINUTES',seconds:'SECONDS',focus:'Focus',break:'Break',long:'Long break',done:'Done',today:'Today',tmr:'Tomorrow',yst:'Yesterday',label:'Label',none:'(no label)',local:'Local',gT:'Quick gestures',g1:'Swipe left/right: Stopwatch, Timer, Interval, Clock',g2:'Pinch: change digit size',g3:'Double-tap: start/pause (Clock: screen off)',g4:'☀ keeps screen on, ⚙ opens settings',ok:'Got it'},
hi:{sw:'स्टॉपवॉच',tm:'टाइमर',iv:'इंटरवल',clk:'घड़ी',reset:'रीसेट',lap:'लैप',laps:'लैप्स',hours:'घंटे',minutes:'मिनट',seconds:'सेकंड',focus:'फोकस',break:'ब्रेक',long:'लंबा ब्रेक',done:'पूरा',today:'आज',tmr:'कल',yst:'बीता कल',label:'लेबल',none:'(कोई नहीं)',local:'स्थानीय',gT:'जल्दी के इशारे',g1:'बाएँ/दाएँ स्वाइप: स्टॉपवॉच, टाइमर, इंटरवल, घड़ी',g2:'पिंच: अंकों का आकार बदलें',g3:'डबल-टैप: शुरू/रोकें (घड़ी में: स्क्रीन बंद)',g4:'☀ स्क्रीन चालू रखता है, ⚙ सेटिंग्स',ok:'ठीक है'}};
const T=k=>(I18N[S.lang]||I18N.en)[k]||I18N.en[k]||k;
const LB=pH.querySelector('.lbl'),LM=pM.querySelector('.lbl'),APM=pH.querySelector('.apm');
const sT=(e,t)=>{if(e.textContent!==t)e.textContent=t};
function fmtDate(d){const dd=pad(d.getDate()),mm=pad(d.getMonth()+1),yy=String(d.getFullYear()).slice(2),f=S.clk.df;return f==='mdy'?mm+'/'+dd+'/'+yy:f==='ymd'?d.getFullYear()+'-'+mm+'-'+dd:f==='long'?d.getDate()+' '+d.toLocaleDateString(S.lang==='hi'?'hi-IN':'en-US',{month:'short'})+' '+d.getFullYear():dd+'/'+mm+'/'+yy}
function labels(clk,ap){
  const top=clk&&S.clk.dp==='top',d=new Date();
  sT(LB,top?fmtDate(d):(clk&&ap?ap:T('hours')));
  sT(LM,top?d.toLocaleDateString(S.lang==='hi'?'hi-IN':'en-US',{weekday:'long'}):T('minutes'));
  sT(APM,top&&ap?ap:'');document.body.classList.toggle('dptop',top);
}
function applyLang(){[['#tSw','sw'],['#tTm','tm'],['#tIv','iv'],['#tClk','clk'],['#bReset','reset'],['#bLap','lap']].forEach(([i,k])=>$(i).textContent=T(k));$('#gT').textContent=T('gT');$('#gL').innerHTML=['g1','g2','g3','g4'].map(k=>'<li>'+T(k)+'</li>').join('');$('#gOk').textContent=T('ok');lastKey='';render();drawLaps();clkx()}
function applyFlags(){const b=document.body;b.classList.toggle('cardstyle',!!S.card);b.dataset.bg=S.bg||'none';b.classList.toggle('hasbg',!!S.bg&&S.bg!=='none');b.classList.toggle('pm',S.ori==='both');b.classList.toggle('nolbl',!S.labels);setTimeout(fit,30)}
function applyFont(){const b=document.body.style,f=FONTS[S.font];
  if(S.font&&S.font!=='theme'&&f){b.setProperty('--font',f[0]);b.setProperty('--w',f[1]);if(document.fonts&&document.fonts.load)document.fonts.load('400 100px "'+f[0].split(',')[0].replace(/'/g,'')+'"').then(()=>setTimeout(fit,30)).catch(()=>{})}
  else if(S.theme!=='custom'){b.removeProperty('--font');b.removeProperty('--w')}}
function burnShift(){if(S.burn){bx=Math.round(Math.random()*6-3);by=Math.round(Math.random()*6-3)}else{bx=by=0}document.body.style.setProperty('--bx',bx+'px');document.body.style.setProperty('--by',by+'px');fit()}
setInterval(burnShift,60000);
function wakeSync(){S.wake?getWake():releaseWake();wakeBtn()}
function wakeBtn(){$('#bWake').classList.toggle('on',!!S.wake);const c=$('#oWake');if(c)c.checked=!!S.wake}
$('#bWake').onclick=()=>{S.wake=!S.wake;save();wakeSync()};
function screenOff(on){$('#off').classList.toggle('on',!!on)}
$('#off').addEventListener('pointerup',()=>screenOff(false));
// settings pages
const PG={look:'Look',display:'Display',control:'Controls',timer:'Timer & Interval',clock:'Clock',alerts:'Alarms & Alerts',data:'History & Backup',help:'Help'};
let lastPg='look';
function goPage(n){lastPg=n;document.querySelectorAll('#pages .pg').forEach(p=>p.classList.toggle('on',p.dataset.pg===n));document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.go===n));$('#pgT').textContent=PG[n];if(n==='data')renderHist()}
$('#nav').onclick=e=>{const b=e.target.closest('[data-go]');if(b)goPage(b.dataset.go)};
const bind=(id,o,k,fn)=>{const e=$(id);if(e.type==='checkbox')e.checked=!!o[k];else e.value=o[k];e.onchange=()=>{o[k]=e.type==='checkbox'?e.checked:e.value;save();fn&&fn()}};
const SK=[['beep','Beep'],['chime','Chime'],['siren','Siren'],['soft','Soft'],['bell','Bell']];
$('#oSk').innerHTML=$('#aSnd').innerHTML=SK.map(k=>'<option value="'+k[0]+'">'+k[1]+'</option>').join('');
$('#oFont').innerHTML='<option value="theme">Theme ka</option>'+Object.keys(FONTS).map(n=>'<option>'+n+'</option>').join('');
bind('#oFont',S,'font',()=>theme(S.theme));bind('#oCard',S,'card',applyFlags);bind('#oBg',S,'bg',applyFlags);bind('#oOri',S,'ori',applyFlags);
bind('#oLang',S,'lang',applyLang);bind('#oBurn',S,'burn',burnShift);bind('#oSwipe',S,'swipe');bind('#oPinch',S,'pinch');bind('#oOff',S,'off');bind('#oSk',S,'sk');
$('#szReset').onclick=()=>{S.scale=1;save();fit()};
bind('#kDp',S.clk,'dp',()=>{render();clkx()});bind('#kDf',S.clk,'df',()=>{render();clkx()});bind('#kLc',S.clk,'lc',clkx);bind('#kNext',S.clk,'next',clkx);
['m','say','snd','from','to'].forEach(k=>bind('#cm'+k[0].toUpperCase()+k.slice(1),S.chime,k));
$('#cmTest').onclick=()=>doChime(new Date());
// gestures: swipe, pinch, taps
const ptr=new Map();let sx=0,sy=0,pinch=null,gestured=false,lastTap=0;const appEl=$('#app');
appEl.addEventListener('pointerdown',e=>{if(e.target.closest('.arr'))return;ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});if(ptr.size===1){sx=e.clientX;sy=e.clientY;gestured=false}else if(ptr.size===2&&S.pinch){const[a,b]=[...ptr.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,s:S.scale||1};gestured=true}});
appEl.addEventListener('pointermove',e=>{if(!ptr.has(e.pointerId))return;ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pinch&&ptr.size===2){const[a,b]=[...ptr.values()];S.scale=Math.max(.5,Math.min(1.15,pinch.s*Math.hypot(a.x-b.x,a.y-b.y)/pinch.d));fit()}});
const gend=e=>{if(!ptr.has(e.pointerId))return;if(ptr.size===1&&!pinch&&S.swipe&&e.type==='pointerup'){const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.6){gestured=true;setMode(MODES[(MODES.indexOf(mode)+(dx<0?1:3))%4])}}ptr.delete(e.pointerId);if(!ptr.size&&pinch){pinch=null;save()}};
appEl.addEventListener('pointerup',gend);appEl.addEventListener('pointercancel',gend);
appEl.addEventListener('pointerup',e=>{
  if(e.target.closest('.arr'))return;
  if(gestured){if(!ptr.size)gestured=false;return}
  if(swallow){swallow=false;return}
  const n=Date.now();
  if(mode==='clk'){if(S.off==='off')return;if(S.off==='one'||n-lastTap<350){lastTap=0;screenOff(true)}else lastTap=n;return}
  if(S.tap==='off')return;
  if(S.tap==='any'){toggle();return}
  if(n-lastTap<350){lastTap=0;toggle()}else lastTap=n;
});
// alarms
const DN=['Su','Mo','Tu','We','Th','Fr','Sa'],DORD=[1,2,3,4,5,6,0];let newD=[];
$('#aDays').innerHTML=DORD.map(d=>'<button class="g x dd" data-d="'+d+'">'+DN[d]+'</button>').join('');
$('#aDays').onclick=e=>{const b=e.target.closest('[data-d]');if(!b)return;const d=+b.dataset.d;newD=newD.includes(d)?newD.filter(x=>x!==d):[...newD,d];b.classList.toggle('on',newD.includes(d))};
function drawAlarms(){$('#aList').innerHTML=S.alarms.map((a,i)=>{const ds=a.d||[];return '<div class="hrow arow"><div><b>'+a.t+'</b> '+esc(a.n||'')+'<br><small>'+(ds.length?DORD.filter(d=>ds.includes(d)).map(d=>DN[d]).join(' '):'Once')+' · '+(a.snd||'beep')+(a.skip?' · skip next':'')+'</small></div><span><label><input type="checkbox" data-ai="'+i+'" '+(a.on?'checked':'')+'></label><button class="g x'+(a.skip?' on':'')+'" data-ak="'+i+'">Skip</button><button class="g x" data-ad="'+i+'">×</button></span></div>'}).join('')||'<p class="empty">Koi alarm nahi.</p>'}
$('#aAdd').onclick=()=>{const t=$('#aTime').value;if(t&&S.alarms.length<10){S.alarms.push({t,on:true,n:$('#aName').value.trim().slice(0,24),d:[...newD],snd:$('#aSnd').value,skip:false});S.alarms.sort((a,b)=>a.t<b.t?-1:1);save();$('#aName').value='';drawAlarms();clkx()}};
$('#aList').onclick=e=>{const d=e.target.closest('[data-ad]'),k=e.target.closest('[data-ak]');if(d)S.alarms.splice(+d.dataset.ad,1);else if(k)S.alarms[+k.dataset.ak].skip=!S.alarms[+k.dataset.ak].skip;else return;save();drawAlarms();clkx()};
$('#aList').onchange=e=>{const c=e.target.closest('[data-ai]');if(c){S.alarms[+c.dataset.ai].on=c.checked;save();clkx()}};
function nextAlarm(){let best=null;const now=new Date();
  for(const a of S.alarms){if(!a.on)continue;const ds=a.d||[];if(!ds.length&&a.skip)continue;const[h,m]=a.t.split(':').map(Number);let sk=a.skip?1:0;
    for(let i=0;i<9;i++){const c=new Date(now.getFullYear(),now.getMonth(),now.getDate()+i,h,m,0);if(c<=now)continue;if(ds.length&&!ds.includes(c.getDay()))continue;if(sk>0){sk--;continue}if(!best||c<best.c)best={c,a};break}}
  return best}
function ring(t,a){screenOff(false);$('#ringT').textContent='⏰ '+t+(a&&a.n?' '+a.n:'');$('#ring').classList.add('on');stopAlarm();const k=a&&a.snd?a.snd:'beep';playSound(k);alarmT=setInterval(()=>playSound(k),1100);if(navigator.vibrate)navigator.vibrate([500,250,500]);setTimeout(stopRing,60000)}
setInterval(()=>{const d=new Date(),t=pad(d.getHours())+':'+pad(d.getMinutes()),k=d.toDateString()+t;if(k===lastRing)return;
  for(const a of S.alarms){const ds=a.d||[];if(!a.on||a.t!==t||(ds.length&&!ds.includes(d.getDay())))continue;lastRing=k;
    if(a.skip){a.skip=false;if(!ds.length)a.on=false;save();drawAlarms();clkx();return}
    if(!ds.length){a.on=false;save();drawAlarms();clkx()}
    ring(t,a);return}},1000);
// clock info (date, next alarm, world clock with day + hour difference)
function zinfo(z,d){const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:z,hourCycle:'h23',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',second:'numeric'}).formatToParts(d).filter(x=>x.type!=='literal').map(x=>[x.type,+x.value]));
  return{off:Math.round((Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second)-Math.floor(d/1000)*1000)/60000),dd:Math.round((Date.UTC(p.year,p.month-1,p.day)-Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()))/864e5)}}
const fdiff=m=>{const a=Math.abs(m);return (m<0?'-':'+')+Math.floor(a/60)+':'+pad(a%60)};
function clkx(){
  const d=new Date(),loc=S.lang==='hi'?'hi-IN':undefined,hf=!S.clk.h24,tf=z=>d.toLocaleTimeString([],{timeZone:z,hour:'2-digit',minute:'2-digit',hour12:hf});
  sT($('#cdate'),(S.clk.date&&S.clk.dp!=='top')?d.toLocaleDateString(loc,{weekday:'long',day:'numeric',month:'long',year:'numeric'}):'');
  const na=S.clk.next?nextAlarm():null;
  sT($('#cnext'),na?'⏰ '+na.a.t+(na.a.n?' '+na.a.n:'')+' · '+na.c.toLocaleDateString(loc,{weekday:'short'}):'');
  const tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'',lc=S.clk.lc||tz.split('/').pop().replace(/_/g,' ');
  let h=S.zones.length?'<span><small>'+esc(lc)+' · '+T('local')+'</small> '+tf(tz||undefined)+'</span>':'';
  h+=S.zones.map(z=>{let t='',x='';try{t=tf(z.z);const i=zinfo(z.z,d),L=-d.getTimezoneOffset();x=fdiff(i.off-L)+' · '+T(i.dd===0?'today':i.dd>0?'tmr':'yst')}catch(e){}return '<span><small>'+esc(z.n)+'</small> '+t+' <i>'+x+'</i></span>'}).join('');
  const w=$('#cworld');if(w._h!==h){w._h=h;w.innerHTML=h}
}
// chime + speak time
let lastChime='';
function doChime(d){const c=S.chime;if(c.snd)playSound('bell');
  if(c.say&&'speechSynthesis' in window){const h=d.getHours()%12||12,m=d.getMinutes(),hi=S.lang==='hi';
    const txt=hi?(m?'अभी '+h+' बजकर '+m+' मिनट हुए हैं':'अभी '+h+' बजे हैं'):(m?'It is '+h+':'+pad(m):'It is '+h+" o'clock");
    const u=new SpeechSynthesisUtterance(txt);u.lang=hi?'hi-IN':'en-IN';setTimeout(()=>{try{speechSynthesis.speak(u)}catch(e){}},c.snd?1200:0)}}
setInterval(()=>{const c=S.chime;if(c.m==='off')return;const d=new Date(),mi=d.getMinutes();if(!(mi===0||(c.m==='half'&&mi===30)))return;
  const k=d.toDateString()+d.getHours()+':'+mi;if(k===lastChime)return;const hm=pad(d.getHours())+':'+pad(mi);
  if(c.from<=c.to?(hm<c.from||hm>c.to):(hm<c.from&&hm>c.to))return;lastChime=k;doChime(d)},1000);
// tags
function drawTags(){const h=$('#hLabel');h.innerHTML='<option value="">'+T('none')+'</option>'+S.tags.map(t=>'<option>'+esc(t)+'</option>').join('');h.value=S.label||'';$('#tgList').innerHTML=S.tags.map((t,i)=>'<div class="hrow"><span>'+esc(t)+'</span><button class="g x" data-tdl="'+i+'">×</button></div>').join('')}
$('#hLabel').onchange=()=>{S.label=$('#hLabel').value;save();render()};
$('#tgList').onclick=e=>{const b=e.target.closest('[data-tdl]');if(b){S.tags.splice(+b.dataset.tdl,1);save();drawTags()}};
$('#tgAdd').onclick=()=>ask('Naya tag','',n=>{n=n.trim().slice(0,20);if(n&&!S.tags.includes(n)&&S.tags.length<20){S.tags.push(n);save();drawTags()}});
function pickTag(){$('#tagList').innerHTML='<button class="g" data-t="">'+T('none')+'</button>'+S.tags.map(t=>'<button class="g'+(t===S.label?' on':'')+'" data-t="'+esc(t)+'">'+esc(t)+'</button>').join('');$('#tagdlg').classList.add('on')}
$('#tagList').onclick=e=>{const b=e.target.closest('[data-t]');if(!b)return;S.label=b.dataset.t;save();drawTags();$('#tagdlg').classList.remove('on');render()};
$('#tagNew').onclick=()=>{$('#tagdlg').classList.remove('on');$('#tgAdd').click()};
$('#tagX').onclick=()=>$('#tagdlg').classList.remove('on');
// first-run guide
function showGuide(){$('#guide').classList.add('on')}
$('#gOk').onclick=()=>{$('#guide').classList.remove('on');S.guide=true;save()};
$('#gRe').onclick=()=>{open('#set',false);showGuide()};
ivInputs();drawPresets();drawZones();drawAlarms();drawTags();applyFlags();applyFont();wakeBtn();if(S.wake)getWake();burnShift();goPage('look');applyLang();if(!S.guide)showGuide();
{const c=st.iv;if(!c.run&&c.base===0&&!c.fin)c.target=ivDur(c.phase)}
['Sw','Tm','Iv','Clk'].forEach((n,i)=>$('#t'+n).classList.toggle('on',['sw','tm','iv','clk'][i]===mode));
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{});
theme(S.theme);render();drawLaps();if(cur.run)loop();
