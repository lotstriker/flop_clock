"""Chrono headless-Chrome tests.  Run: pip install playwright && playwright install chromium
python3 tests/run_tests.py   (project root se).  Screenshots: tests/out/"""
import sys, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails = []
def check(name, cond, extra=''):
    print(('PASS ' if cond else 'FAIL ') + name + (' ' + str(extra) if extra and not cond else ''))
    if not cond: fails.append(name)
url = 'file://' + str(ROOT / 'index.html')
with sync_playwright() as p:
    b = p.chromium.launch()
    # ---- first-run guide (fresh context, bina guide flag) ----
    c0 = b.new_context(viewport={'width': 844, 'height': 390}); g = c0.new_page(); g.goto(url); g.wait_for_timeout(400)
    check('first-run guide shows', g.evaluate("document.getElementById('guide').classList.contains('on')"))
    g.click('#gOk'); g.reload(); g.wait_for_timeout(300)
    check('guide not shown again', not g.evaluate("document.getElementById('guide').classList.contains('on')")); c0.close()
    # ---- main context ----
    ctx = b.new_context(viewport={'width': 844, 'height': 390}); ctx.add_init_script("try{if(!localStorage.getItem('chrono'))localStorage.setItem('chrono','{\"guide\":true}')}catch(e){}")
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_INTERNET' not in m.text else None)
    pg.goto(url); pg.wait_for_timeout(500); ev = pg.evaluate
    ev("S.ds='plain';S.burn=false;burnShift()")
    for ms, cls in [(30000, 'l1'), (90000, 'l2'), (3700000, 'l3')]:
        ev(f"cur.base={ms};render()"); pg.wait_for_timeout(100)
        check('layout ' + cls, cls in ev("document.getElementById('app').className"))
    fs = ev("[getComputedStyle(dH).fontSize,getComputedStyle(dM).fontSize,getComputedStyle(dS).fontSize]")
    check('l3 hours=minutes size, seconds smaller', fs[0] == fs[1] and float(fs[2][:-2]) < float(fs[1][:-2]), fs)
    ev("cur.base=12*3600000+34*60000+56000;render()"); pg.wait_for_timeout(150)
    gp = ev("(()=>{const h=dH.getBoundingClientRect(),m=dM.getBoundingClientRect(),s=dS.getBoundingClientRect(),W=innerWidth;return {gapHM:m.left-h.right,gapMS:s.left-m.right,sw:s.width,mw:m.width,W}})()")
    check('double-digit hours: gap hours-minutes >= 5% width', gp['gapHM'] >= gp['W'] * 0.05, gp)
    check('seconds much smaller than minutes', gp['sw'] < gp['mw'] * 0.5, gp)
    check('gap minutes-seconds >= 2% width', gp['gapMS'] >= gp['W'] * 0.02, gp)
    ev("cur.base=30000;render()"); pg.wait_for_timeout(100)
    r = ev("(()=>{const p=pS.getBoundingClientRect(),d=dS.getBoundingClientRect(),ty=parseFloat((dS.style.translate||'0 0').split(' ')[1])||0;return Math.abs((d.top+d.bottom)/2-ty-(p.top+p.bottom)/2)/p.height})()")
    check('digit vertically centered', r < 0.04, r)
    ev("reset();S.ds='soft'")
    # timer + presets
    pg.click('#tTm'); pg.wait_for_timeout(200)
    pg.click('#pM .arr.up'); pg.click('#pS .arr.dn')
    check('timer arrows', ev("val()") == 359000, ev("val()"))
    pg.click('#chips [data-save]'); pg.fill('#dI', 'Chai'); pg.click('#dY'); pg.wait_for_timeout(100)
    check('preset saved', ev("S.tp.length") == 1)
    pg.click('#chips [data-tp="0"]'); pg.wait_for_timeout(300)
    check('preset starts timer', ev("cur.run") is True); ev("reset()")
    # interval
    pg.click('#tIv'); pg.wait_for_timeout(200); pg.click('#chips [data-ivp="3"]'); pg.wait_for_timeout(100)
    check('workout preset 40s', ev("st.iv.target") == 40000 and ev("S.iv.rounds") == 8, ev("st.iv.target"))
    ev("S.iv.rounds=1;S.iv.w=3;ivReset();cur.target=3000;cur.base=0;cur.t0=Date.now()-3500;cur.run=true;loop()"); pg.wait_for_timeout(300)
    check('interval stops after rounds', ev("cur.fin") is True and ev("cur.run") is False); ev("S.iv.rounds=0;S.iv.w=1500;reset()")
    # tag picker
    pg.click('#tSw'); pg.wait_for_timeout(150); pg.mouse.move(300, 200)
    pg.click('#chips .tag'); check('tag picker opens', ev("document.getElementById('tagdlg').classList.contains('on')"))
    pg.click('#tagList [data-t="Padhai"]'); check('tag chosen', ev("S.label") == 'Padhai'); ev("S.label=''")
    # laps
    ev("cur.base=0;cur.t0=Date.now();cur.run=true;loop()")
    for w in (300, 700, 450): pg.wait_for_timeout(w); ev("lap()")
    pg.mouse.move(300, 200); pg.wait_for_timeout(100); pg.click('#bLaps'); pg.wait_for_timeout(400)
    check('best/worst lap marked', pg.locator('.lap.best').count() == 1 and pg.locator('.lap.worst').count() == 1)
    pg.click('.lap >> nth=0'); pg.fill('#dI', 'sprint'); pg.click('#dY'); check('lap note', ev("st.sw.laps[0].note") == 'sprint')
    pg.mouse.click(700, 300); pg.wait_for_timeout(300)
    check('outside tap closes laps', not ev("document.getElementById('lapsheet').classList.contains('open')"))
    # persistence + history
    pg.wait_for_timeout(1200); pg.reload(); pg.wait_for_timeout(500)
    check('state persists after reload', ev("cur.run") is True and ev("el()") > 2000, ev("el()"))
    ev("S.burn=false;cur.t0=Date.now()-5000;cur.base=0;reset()")
    check('history recorded', ev("HIST.length") >= 1 and ev("HIST[0].k") == 'sw')
    # taps
    ev("S.tap='any'"); pg.mouse.click(400, 150); pg.wait_for_timeout(200)
    check('tap anywhere starts', ev("cur.run") is True); pg.mouse.click(400, 150); pg.wait_for_timeout(200)
    check('tap anywhere pauses', ev("cur.run") is False); ev("reset();S.tap='dbl'")
    pg.mouse.dblclick(400, 150); pg.wait_for_timeout(200); check('double tap starts', ev("cur.run") is True); ev("reset()")
    # swipe
    pg.mouse.move(600, 200); pg.mouse.down(); pg.mouse.move(200, 210, steps=8); pg.mouse.up(); pg.wait_for_timeout(200)
    check('swipe left -> timer', ev("mode") == 'tm', ev("mode"))
    pg.mouse.move(200, 200); pg.mouse.down(); pg.mouse.move(600, 205, steps=8); pg.mouse.up(); pg.wait_for_timeout(200)
    check('swipe right -> stopwatch', ev("mode") == 'sw', ev("mode"))
    # pinch
    ev("""(()=>{const a=document.getElementById('app'),f=(t,id,x,y)=>a.dispatchEvent(new PointerEvent(t,{pointerId:id,clientX:x,clientY:y,bubbles:true}));f('pointerdown',1,300,200);f('pointerdown',2,400,200);f('pointermove',2,350,200);f('pointerup',2,350,200);f('pointerup',1,300,200)})()""")
    check('pinch changes size', ev("S.scale") < 0.9, ev("S.scale")); ev("S.scale=1;fit()")
    # keep screen on button, burn-in
    pg.mouse.move(300, 200); pg.click('#bWake'); check('wake button on', ev("S.wake") is True and 'on' in ev("document.getElementById('bWake').className"))
    pg.click('#bWake'); check('wake button off', ev("S.wake") is False)
    ev("S.burn=true;burnShift()"); check('burn-in shift within 3px', abs(ev("bx")) <= 3 and abs(ev("by")) <= 3)
    ev("S.burn=false;burnShift()"); check('burn-in off resets', ev("bx") == 0 and ev("by") == 0)
    # settings page
    pg.click('#bSet'); pg.wait_for_timeout(300)
    check('settings is full page', ev("(()=>{const r=document.getElementById('set').getBoundingClientRect();return r.width>=innerWidth-2&&r.height>=innerHeight-2})()"))
    pg.screenshot(path=str(OUT / 'settings_look.png'))
    for n in ['display', 'control', 'timer', 'clock', 'alerts', 'data', 'help']:
        pg.click(f'#nav [data-go="{n}"]'); check('page ' + n, ev(f"document.querySelectorAll('.pg.on').length===1&&document.querySelector('.pg.on').dataset.pg==='{n}'"))
    pg.click('#nav [data-go="data"]'); pg.click('#bkEx'); check('backup json', '"app":"chrono"' in ev("document.getElementById('bkTxt').value"))
    pg.click('#xSet'); pg.wait_for_timeout(200); check('settings back button closes', not ev("document.getElementById('set').classList.contains('open')"))
    # card style / background / font / language
    ev("S.card=true;applyFlags()"); pg.wait_for_timeout(100); check('card style', 'cardstyle' in ev("document.body.className") and ev("getComputedStyle(pS).borderRadius") != '0px')
    pg.screenshot(path=str(OUT / 'cardstyle.png')); ev("S.card=false;applyFlags()")
    ev("S.bg='stars';applyFlags()"); pg.wait_for_timeout(100); check('background art', 'hasbg' in ev("document.body.className") and ev("getComputedStyle(document.getElementById('bg')).backgroundImage").startswith('url('))
    pg.screenshot(path=str(OUT / 'bg_stars.png')); ev("S.bg='city';applyFlags()"); pg.wait_for_timeout(100); pg.screenshot(path=str(OUT / 'bg_city.png')); ev("S.bg='mountains';applyFlags()"); pg.wait_for_timeout(100); pg.screenshot(path=str(OUT / 'bg_mountains.png')); ev("S.bg='none';applyFlags()")
    ev("S.font='7-Segment (built-in)';theme(S.theme)"); pg.wait_for_timeout(300); check('7-segment font', 'Chrono7Seg' in ev("getComputedStyle(dS).fontFamily"))
    pg.screenshot(path=str(OUT / 'font_7seg.png')); ev("S.font='Pixel (built-in)';theme(S.theme)"); pg.wait_for_timeout(300); pg.screenshot(path=str(OUT / 'font_pixel.png')); ev("S.font='theme';theme(S.theme)")
    ev("S.lang='hi';applyLang()"); check('hindi labels', ev("document.getElementById('tSw').textContent") == 'स्टॉपवॉच'); ev("S.lang='en';applyLang()")
    # flip card
    ev("S.ds='card';[dH,dM,dS].forEach(d=>{d.dataset.v='';d.textContent=''});cur.base=5000;render();cur.base=6000;render()")
    check('flip card layers', ev("dS.querySelectorAll('.fl').length") >= 4); ev("S.ds='soft';cur.base=0;render()")
    # clock: date placement, world clock, alarms, screen off, chime
    pg.mouse.move(300, 200); pg.click('#tClk'); pg.wait_for_timeout(300)
    check('date + day (bottom)', len(ev("cdate.textContent")) > 8)
    ev("S.clk.dp='top';render();clkx()"); pg.wait_for_timeout(100)
    import re as _re
    check('date above hours, weekday above minutes', bool(_re.match(r'\d\d/\d\d/\d\d', ev("LB.textContent"))) and ev("LM.textContent").isalpha(), (ev("LB.textContent"), ev("LM.textContent")))
    pg.screenshot(path=str(OUT / 'clock_top.png')); ev("S.clk.dp='bottom';render();clkx()")
    ev("S.zones=[{n:'Tokyo',z:'Asia/Tokyo'},{n:'New York',z:'America/New_York'}];clkx()")
    wc = ev("cworld.textContent"); check('world clock: diff, day, local', bool(_re.search(r'[+-]\d+:\d\d', wc)) and any(k in wc for k in ('Today', 'Tomorrow', 'Yesterday')) and 'Local' in wc, wc)
    ev("S.alarms=[{t:'23:59',on:true,n:'Gym',d:[],snd:'bell',skip:false}];clkx()"); check('next alarm shown on clock', 'Gym' in ev("cnext.textContent"), ev("cnext.textContent"))
    ev("S.alarms[0].skip=true;clkx()"); check('skip next hides one-shot alarm', ev("nextAlarm()") is None)
    ev("S.alarms=[{t:pad(new Date().getHours())+':'+pad(new Date().getMinutes()),on:true,n:'Wake',d:[new Date().getDay()],snd:'chime',skip:false}];lastRing=''"); pg.wait_for_timeout(1600)
    check('repeat alarm rings with name', ev("document.getElementById('ring').classList.contains('on')") and 'Wake' in ev("ringT.textContent")); ev("stopRing()")
    ev("S.alarms=[{t:pad(new Date().getHours())+':'+pad(new Date().getMinutes()),on:true,n:'',d:[],snd:'beep',skip:false}];lastRing=''"); pg.wait_for_timeout(1600)
    check('one-shot alarm turns off after ringing', ev("S.alarms[0].on") is False); ev("stopRing();S.alarms=[]")
    ev("S.chime.m='hour';doChime(new Date())")
    pg.mouse.dblclick(400, 150); pg.wait_for_timeout(200); check('double tap -> screen off (clock)', ev("document.getElementById('off').classList.contains('on')"))
    pg.mouse.click(400, 150); pg.wait_for_timeout(200); check('tap wakes screen', not ev("document.getElementById('off').classList.contains('on')"))
    pg.screenshot(path=str(OUT / 'clock.png'))
    # themes
    for t in ['flip', 'neon', 'amber', 'matrix', 'paper', 'sunset', 'cyber', 'forest', 'ice', 'custom']:
        ev(f"theme('{t}')"); pg.wait_for_timeout(300); pg.screenshot(path=str(OUT / f'theme_{t}.png'))
    ev("S.rain=false;theme('matrix')"); ev("theme('flip')")
    check('no console errors', not errs, errs[:3]); ctx.close()
    # ---- portrait ----
    c2 = b.new_context(viewport={'width': 390, 'height': 844}); c2.add_init_script("localStorage.setItem('chrono','{\"guide\":true,\"ori\":\"both\"}')")
    q = c2.new_page(); q.goto(url); q.wait_for_timeout(500)
    q.evaluate("S.ds='plain';cur.base=90000;render()"); q.wait_for_timeout(150)
    top = q.evaluate("[pM.getBoundingClientRect().top,pS.getBoundingClientRect().top,getComputedStyle(document.getElementById('rot')).display]")
    check('portrait: minutes above seconds, no rotate message', top[0] < top[1] and top[2] == 'none', top)
    q.screenshot(path=str(OUT / 'portrait.png')); c2.close(); b.close()
print('\nFAILED: ' + ', '.join(fails) if fails else '\nALL PASSED'); sys.exit(1 if fails else 0)
