const $=s=>document.querySelector(s),pad=n=>String(n).padStart(2,'0');
const app=$('#app'),pH=$('#pH'),pM=$('#pM'),pS=$('#pS'),dH=$('#dH'),dM=$('#dM'),dS=$('#dS'),lS=$('#lS');
let S={theme:'flip',ms:false,sound:true,vib:true,wake:false,labels:true,ds:'soft',rain:true,tap:'dbl',label:'',tp:[],zones:[],alarms:[],iv:{w:1500,b:300,l:900,n:4,auto:true,rounds:0,v:2},custom:{a:'#000000',b:'#000000',fa:'#4dd0ff',fb:'#ffffff',font:'Bebas Neue',glow:true,out:false,split:false},clk:{h24:false,sec:true,date:true}};
try{Object.assign(S,JSON.parse(localStorage.getItem('chrono')||'{}'))}catch(e){}
if(!S.iv.v){S.iv.w*=60;S.iv.b*=60;S.iv.l*=60;S.iv.v=2}S.iv.rounds=S.iv.rounds|0;if(S.clk.date===undefined)S.clk.date=true;
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
  const setup=app.classList.contains('setup');
  const ps=[...document.querySelectorAll('.panel')].filter(p=>getComputedStyle(p).display!=='none');
  ps.forEach(p=>{
    const d=p.querySelector('.digits');d.style.fontSize='100px';d.style.translate='none';
    const w=d.getBoundingClientRect().width||1,mt=metrics(d),mini=layout===3&&p===pS;
    const f=mini?.26:(setup?.45:.68),wf=mini?.7:.92;
    p._s=Math.min(p.clientHeight*f/mt.h*100,p.clientWidth*wf/w*100);p._m=mt;
  });
  if(layout>=3){const u=Math.min(pH._s,pM._s);pH._s=pM._s=u}
  ps.forEach(p=>{
    const d=p.querySelector('.digits');d.style.fontSize=p._s+'px';
    let y=p._m.off*p._s/100;
    if(layout===3&&p===pS)y+=(pM._m.h*pM._s-pS._m.h*pS._s)/200;
    d.style.translate='0 '+y+'px';
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
  pH.querySelector('.lbl').textContent=(clk&&ap)?ap:'HOURS';
  const key=l+':'+tH.length;if(key!==lastKey){lastKey=key;need=true}
  lS.textContent=(mode==='sw'&&S.ms)?'SECONDS  .'+pad(Math.floor(v%1000/10)):'SECONDS';
  if(need)fit();
  $('#go').textContent=cur.fin?'■':(cur.run?'❚❚':'▶');
  $('#bLap').style.display=mode==='sw'?'':'none';
  chipsUpdate();
  const ph=$('#phase');ph.style.display=mode==='iv'?'block':'none';
  if(mode==='iv'){const n=S.iv.n,k=cur.phase==='work'?(cur.done%n)+1:(cur.done%n||n);ph.textContent=cur.fin?'Done':({work:'Focus',break:'Break',long:'Long break'})[cur.phase]+'  '+k+'/'+n+(S.iv.rounds?'  R'+(cur.done+(cur.phase==='work'?1:0))+'/'+S.iv.rounds:'')}
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
function beep(){
  try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();
  const o=actx.createOscillator(),g=actx.createGain();o.type='square';o.frequency.value=880;
  g.gain.value=.15;o.connect(g);g.connect(actx.destination);o.start();o.stop(actx.currentTime+.18)}catch(e){}
}
function stopAlarm(){clearInterval(alarmT);alarmT=0}
function finish(){
  if(mode==='tm')addHist({k:'tm',d:cur.target,l:cur.label||S.label||''});cur.run=false;cur.base=cur.target;cur.fin=true;cur.rec=true;releaseWake();render();persist();
  if(S.vib&&navigator.vibrate)navigator.vibrate([400,200,400,200,400]);
  if(S.sound){beep();alarmT=setInterval(beep,650);setTimeout(stopAlarm,30000)}
}
async function getWake(){try{if(S.wake&&'wakeLock' in navigator&&!wl){wl=await navigator.wakeLock.request('screen');wl.addEventListener('release',()=>wl=null)}}catch(e){}}
function releaseWake(){try{wl&&wl.release()}catch(e){}wl=null}
function toggle(){if(mode==='clk')return;
  if(cur.fin){reset();return}
  if(cur.run){cur.base+=Date.now()-cur.t0;cur.run=false;cancelAnimationFrame(raf);releaseWake();render()}
  else{if(mode==='tm'&&cur.target<=0)return;cur.t0=Date.now();cur.run=true;getWake();if(!actx)beep0();loop()}
  poke();persist();
}
function beep0(){try{actx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}
function reset(){if(!cur.rec)recordSession();cur.rec=false;cur.label='';cur.run=false;cur.base=0;cur.laps=[];cur.fin=false;if(mode==='iv')ivReset();stopAlarm();cancelAnimationFrame(raf);releaseWake();render();drawLaps();persist()}
const fmt=ms=>{const t=Math.floor(ms/10),c=t%100,s=Math.floor(t/100)%60,m=Math.floor(t/6000)%60,h=Math.floor(t/360000);return(h?h+':'+pad(m):m)+':'+pad(s)+'.'+pad(c)};
function lap(){
  if(mode!=='sw'||(!cur.run&&cur.base===0))return;
  const t=el(),prev=cur.laps.length?cur.laps[0].total:0;
  cur.laps.unshift({n:cur.laps.length+1,split:t-prev,total:t,note:''});drawLaps();persist();
}
function drawLaps(){
  const L=st.sw.laps,sw=mode==='sw';
  $('#bLaps').textContent=sw&&L.length?'Laps ('+L.length+')':'Laps';
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
  S.theme=t;document.body.dataset.theme=t;applyCustom();document.body.classList.toggle('has-div',t==='neon'||t==='matrix');rain(t==='matrix'&&S.rain);save();
  document.querySelectorAll('.th').forEach(b=>b.classList.toggle('sel',b.dataset.t===t));
  (document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(fit);fit();
}
const THEMES=[['flip','Flip Classic','#000000','#ffffff'],['neon','Neon Glass','#2a1a7a','#2dffa0'],['amber','Amber Night','#000000','#ffb000'],['matrix','Matrix','#000000','#00ff41'],['paper','Paper Light','#ffffff','#000000'],['sunset','Sunset','#6a2a7a','#ff9a56'],['cyber','Cyberpunk','#ff3ec9','#2cf6ff'],['forest','Forest','#0a2a17','#c8f7c5'],['ice','Ice','#0b2c52','#9fe7ff'],['custom','Custom','#000000','#4dd0ff']];
const FONTS={'Bebas Neue':["'Bebas Neue',Impact,sans-serif",400],'Oswald':['Oswald,sans-serif',600],'Rajdhani':['Rajdhani,sans-serif',700],'Share Tech Mono':["'Share Tech Mono',monospace",400],'Orbitron':['Orbitron,sans-serif',800],'Anton':['Anton,Impact,sans-serif',400],'Exo 2':["'Exo 2',sans-serif",700],'Teko':['Teko,sans-serif',600],'System bold':['system-ui,sans-serif',800]};
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
const open=(id,on)=>{document.querySelectorAll('.sheet').forEach(x=>x.classList.remove('open'));$(id).classList.toggle('open',on);poke()};
$('#bSet').onclick=()=>open('#set',!$('#set').classList.contains('open'));$('#xSet').onclick=()=>open('#set',false);
$('#bLaps').onclick=()=>{drawLaps();open('#lapsheet',!$('#lapsheet').classList.contains('open'))};$('#xLap').onclick=()=>open('#lapsheet',false);
$('#bFs').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else{await document.documentElement.requestFullscreen();try{await screen.orientation.lock('landscape')}catch(e){}}}catch(e){}};
$('#rotOk').onclick=()=>$('#rot').classList.add('off');
[['#oMs','ms'],['#oLbl','labels'],['#oSnd','sound'],['#oVib','vib'],['#oWake','wake']].forEach(([id,k])=>{
  const i=$(id);i.checked=!!S[k];
  i.onchange=()=>{S[k]=i.checked;save();document.body.classList.toggle('nolbl',!S.labels);if(k==='wake'){S.wake?(cur.run&&getWake()):releaseWake()}render()};
});
document.body.classList.toggle('nolbl',!S.labels);
// auto-hide chrome while running
function poke(){
  const ui=$('#ui');ui.classList.remove('hide');clearTimeout(hideT);
  hideT=setTimeout(()=>{if((cur.run||mode==='clk')&&!document.querySelector('.sheet.open'))ui.classList.add('hide')},3500);
}
['pointerdown','pointermove','keydown'].forEach(ev=>document.addEventListener(ev,poke,{passive:true}));
document.addEventListener('keydown',e=>{
  if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  if(e.code==='Space'){e.preventDefault();toggle()}
  else if(e.key==='l'||e.key==='L')lap();
  else if(e.key==='r'||e.key==='R')reset();
  else if(e.key==='f'||e.key==='F')$('#bFs').click();
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&cur.run){getWake();loop()}});
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
document.querySelectorAll('.sec').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)document.querySelectorAll('.sec').forEach(o=>{if(o!==d)o.open=false})}));
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
  const box=$('#chips'),tI=mode==='tm'&&idle(),iI=mode==='iv'&&idle();
  box.classList.toggle('show',tI||iI);if(!(tI||iI))return;
  const key=mode+JSON.stringify(S.tp);if(key===box._k)return;box._k=key;
  box.innerHTML=tI?'<button class="g" data-add="10000">+10s</button><button class="g" data-add="60000">+1m</button><button class="g" data-add="300000">+5m</button><button class="g" data-add="600000">+10m</button><button class="g" data-add="3600000">+1h</button><button class="g" data-add="0">Clear</button><button class="g" data-save="1">＋ Save</button>'+S.tp.map((p,i)=>'<button class="g on" data-tp="'+i+'">'+esc(p.n)+' '+hms(p.s)+'</button>').join(''):IVP.map((p,i)=>'<button class="g" data-ivp="'+i+'">'+p.n+'</button>').join('');
}
$('#chips').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.add!==undefined){if(mode!=='tm'||!idle())return;const a=+b.dataset.add;cur.target=a?Math.min(cur.target+a,359999000):0;persist();render()}
  else if(b.dataset.save){if(cur.target<1000)return;ask('Preset ka naam','',n=>{n=n.trim();if(!n)return;S.tp.push({n:n,s:Math.round(cur.target/1000)});save();drawPresets();render()})}
  else if(b.dataset.tp!==undefined){const p=S.tp[+b.dataset.tp];if(!p||!idle())return;cur.target=p.s*1000;cur.label=p.n;toggle()}
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
let lastTap=0;
$('#app').addEventListener('pointerup',e=>{
  if(S.tap==='off'||mode==='clk'||e.target.closest('.arr'))return;
  if(swallow){swallow=false;return}
  if(S.tap==='any'){toggle();return}
  const n=Date.now();if(n-lastTap<350){lastTap=0;toggle()}else lastTap=n;
});
$('#lapList').onclick=e=>{const r=e.target.closest('.lap');if(!r)return;const l=st.sw.laps[+r.dataset.i];if(l)ask('Lap '+l.n+' note',l.note||'',v=>{l.note=v.trim();persist();drawLaps()})};
function renderHist(){
  const days={},labs={};
  HIST.forEach(h=>{const d=new Date(h.t).toLocaleDateString(undefined,{day:'numeric',month:'short'});days[d]=(days[d]||0)+h.d;const l=h.l||'(bina label)';labs[l]=(labs[l]||0)+h.d});
  const sec=(t,o)=>'<h3>'+t+'</h3>'+(Object.keys(o).slice(0,7).map(k=>'<div class="hrow"><span>'+esc(k)+'</span><b>'+dur(o[k])+'</b></div>').join('')||'<p class="empty">Kuch nahi</p>');
  $('#hBody').innerHTML=sec('Din ke hisaab se',days)+sec('Label ke hisaab se',labs)+'<h3>Recent</h3>'+(HIST.slice(0,15).map(h=>'<div class="hrow"><span>'+new Date(h.t).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+' · '+({sw:'Stopwatch',tm:'Timer',iv:'Focus'})[h.k]+(h.l?' · '+esc(h.l):'')+'</span><b>'+dur(h.d)+'</b></div>').join('')||'<p class="empty">Abhi koi session nahi.</p>');
}
$('#secH').addEventListener('toggle',()=>{if($('#secH').open)renderHist()});
$('#hLabel').value=S.label;$('#hLabel').oninput=()=>{S.label=$('#hLabel').value.slice(0,30);save()};
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
function drawAlarms(){$('#aList').innerHTML=S.alarms.map((a,i)=>'<div class="hrow"><label><input type="checkbox" data-ai="'+i+'" '+(a.on?'checked':'')+'> '+a.t+'</label><button class="g x" data-ad="'+i+'">×</button></div>').join('')||'<p class="empty">Koi alarm nahi.</p>'}
$('#aAdd').onclick=()=>{const t=$('#aTime').value;if(t&&S.alarms.length<10){S.alarms.push({t,on:true});S.alarms.sort((a,b)=>a.t<b.t?-1:1);save();drawAlarms()}};
$('#aList').onclick=e=>{const d=e.target.closest('[data-ad]');if(d){S.alarms.splice(+d.dataset.ad,1);save();drawAlarms()}};
$('#aList').onchange=e=>{const c=e.target.closest('[data-ai]');if(c){S.alarms[+c.dataset.ai].on=c.checked;save()}};
function clkx(){
  const d=new Date();
  $('#cdate').textContent=S.clk.date?d.toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric'}):'';
  $('#cworld').innerHTML=S.zones.map(z=>{let t='';try{t=d.toLocaleTimeString([],{timeZone:z.z,hour:'2-digit',minute:'2-digit',hour12:!S.clk.h24})}catch(e){}return '<span><small>'+esc(z.n)+'</small> '+t+'</span>'}).join('');
}
let lastRing='';
function stopRing(){$('#ring').classList.remove('on');stopAlarm()}
function ring(t){$('#ringT').textContent='⏰ Alarm '+t;$('#ring').classList.add('on');stopAlarm();beep();alarmT=setInterval(beep,650);if(navigator.vibrate)navigator.vibrate([500,250,500]);setTimeout(stopRing,60000)}
$('#ringX').onclick=stopRing;
setInterval(()=>{const d=new Date(),t=pad(d.getHours())+':'+pad(d.getMinutes()),k=d.toDateString()+t;if(k===lastRing)return;if(S.alarms.some(a=>a.on&&a.t===t)){lastRing=k;ring(t)}},1000);
document.addEventListener('pointerdown',()=>{if(!actx)beep0();if(actx&&actx.state==='suspended')actx.resume()});
ivInputs();drawPresets();drawZones();drawAlarms();clkx();
{const c=st.iv;if(!c.run&&c.base===0&&!c.fin)c.target=ivDur(c.phase)}
['Sw','Tm','Iv','Clk'].forEach((n,i)=>$('#t'+n).classList.toggle('on',['sw','tm','iv','clk'][i]===mode));
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{});
theme(S.theme);render();drawLaps();if(cur.run)loop();
