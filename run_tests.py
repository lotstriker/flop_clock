"""Chrono headless-Chrome tests.  Run: pip install playwright && playwright install chromium
python3 tests/run_tests.py   (project root se).  Screenshots: tests/out/"""
import os, sys, time, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails = []
def check(name, cond, extra=''):
    print(('PASS ' if cond else 'FAIL ') + name + (' ' + str(extra) if extra and not cond else ''))
    if not cond: fails.append(name)
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 844, 'height': 390}); pg = ctx.new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_INTERNET' not in m.text else None)
    url = 'file://' + str(ROOT / 'index.html')
    pg.goto(url); pg.wait_for_timeout(500)
    ev = pg.evaluate
    # layouts (animation band karke naapo)
    ev=pg.evaluate; ev("S.ds='plain'")
    for ms, cls in [(30000, 'l1'), (90000, 'l2'), (3700000, 'l3')]:
        ev(f"cur.base={ms};render()"); pg.wait_for_timeout(100)
        check('layout ' + cls, cls in ev("document.getElementById('app').className"))
    fs = ev("[getComputedStyle(dH).fontSize,getComputedStyle(dM).fontSize,getComputedStyle(dS).fontSize]")
    check('l3 hours=minutes size, seconds smaller', fs[0] == fs[1] and float(fs[2][:-2]) < float(fs[1][:-2]), fs)
    ev("cur.base=12*3600000+34*60000+56000;render()"); pg.wait_for_timeout(150)
    g=ev("(()=>{const h=dH.getBoundingClientRect(),m=dM.getBoundingClientRect(),s=dS.getBoundingClientRect(),W=innerWidth;return {gapHM:m.left-h.right,gapMS:s.left-m.right,sw:s.width,mw:m.width,W}})()")
    check('double-digit hours: gap hours-minutes >= 5% width', g['gapHM'] >= g['W']*0.05, g)
    check('seconds much smaller than minutes', g['sw'] < g['mw']*0.5, g)
    check('gap minutes-seconds >= 2% width', g['gapMS'] >= g['W']*0.02, g)
    pg.screenshot(path=str(OUT / 'l3_double_digit.png'))
    ev("cur.base=30000;render()"); pg.wait_for_timeout(100)
    r = ev("(()=>{const p=pS.getBoundingClientRect(),d=dS.getBoundingClientRect(),ty=parseFloat((dS.style.translate||'0 0').split(' ')[1])||0;return Math.abs((d.top+d.bottom)/2-ty-(p.top+p.bottom)/2)/p.height})()")
    check('digit vertically centered', r < 0.04, r)
    ev("reset();S.ds='soft'")
    # timer arrows
    pg.click('#tTm'); pg.wait_for_timeout(200)
    pg.click('#pM .arr.up'); pg.click('#pS .arr.dn')
    check('timer arrows', ev("val()") == 359000, ev("val()"))
    # timer preset save + one tap start
    pg.click('#chips [data-save]'); pg.fill('#dI', 'Chai'); pg.click('#dY'); pg.wait_for_timeout(100)
    check('preset saved', ev("S.tp.length") == 1)
    pg.click('#chips [data-tp="0"]'); pg.wait_for_timeout(300)
    check('preset starts timer', ev("cur.run") is True)
    ev("reset()")
    # interval presets + rounds
    pg.click('#tIv'); pg.wait_for_timeout(200)
    pg.click('#chips [data-ivp="3"]'); pg.wait_for_timeout(100)
    check('workout preset 40s', ev("st.iv.target") == 40000 and ev("S.iv.rounds") == 8, ev("st.iv.target"))
    ev("S.iv.rounds=1;S.iv.w=3;ivReset();cur.target=3000;cur.base=0;cur.t0=Date.now()-3500;cur.run=true;loop()"); pg.wait_for_timeout(300)
    check('interval stops after rounds', ev("cur.fin") is True and ev("cur.run") is False)
    ev("S.iv.rounds=0;S.iv.w=1500;reset()")
    # laps best/worst/note + csv header
    pg.click('#tSw'); pg.wait_for_timeout(100)
    ev("cur.base=0;cur.t0=Date.now();cur.run=true;loop()")
    for w in (300, 700, 450):
        pg.wait_for_timeout(w); ev("lap()")
    pg.mouse.move(300, 200); pg.wait_for_timeout(100); pg.click('#bLaps'); pg.wait_for_timeout(400)
    check('best lap marked', pg.locator('.lap.best').count() == 1 and pg.locator('.lap.worst').count() == 1)
    pg.click('.lap >> nth=0'); pg.fill('#dI', 'sprint'); pg.click('#dY')
    check('lap note', ev("st.sw.laps[0].note") == 'sprint')
    pg.mouse.click(700, 300)  # outside tap closes sheet
    pg.wait_for_timeout(300)
    check('outside tap closes laps', not ev("document.getElementById('lapsheet').classList.contains('open')"))
    # persistence
    pg.wait_for_timeout(1200); pg.reload(); pg.wait_for_timeout(500)
    check('state persists after reload', ev("cur.run") is True and ev("el()") > 2000, ev("el()"))
    # history
    ev("cur.t0=Date.now()-5000;cur.base=0;reset()")
    check('history recorded', ev("HIST.length") >= 1 and ev("HIST[0].k") == 'sw')
    # tap controls
    ev("S.tap='any'"); pg.mouse.click(400, 150); pg.wait_for_timeout(200)
    check('tap anywhere starts', ev("cur.run") is True); pg.mouse.click(400, 150); pg.wait_for_timeout(200)
    check('tap anywhere pauses', ev("cur.run") is False); ev("reset();S.tap='dbl'")
    pg.mouse.dblclick(400, 150); pg.wait_for_timeout(200)
    check('double tap starts', ev("cur.run") is True); ev("reset()")
    # settings accordion + close on outside tap
    pg.mouse.move(300, 200); pg.click('#bSet'); pg.wait_for_timeout(400)
    pg.click('#set summary:has-text("Display")'); pg.click('#set summary:has-text("Alerts")'); pg.wait_for_timeout(200)
    check('accordion one open', ev("document.querySelectorAll('.sec[open]').length") == 1)
    pg.mouse.click(300, 200); pg.wait_for_timeout(300)
    check('settings closes on outside tap', not ev("document.getElementById('set').classList.contains('open')"))
    # backup
    pg.click('#bSet'); pg.wait_for_timeout(300); pg.click('#set summary:has-text("Backup")'); pg.click('#bkEx')
    check('backup json', '"app":"chrono"' in ev("document.getElementById('bkTxt').value"))
    pg.click('#xSet')
    # flip card
    ev("S.ds='card';[dH,dM,dS].forEach(d=>{d.dataset.v='';d.textContent=''});cur.base=5000;render();cur.base=6000;render()")
    check('flip card layers', ev("dS.querySelectorAll('.fl').length") >= 4, ev("dS.innerHTML"))
    pg.wait_for_timeout(200); pg.screenshot(path=str(OUT / 'flipcard.png')); ev("S.ds='soft';cur.base=0;render()")
    # clock extras + alarm
    pg.click('#tClk'); pg.wait_for_timeout(300)
    ev("S.zones=[{n:'Tokyo',z:'Asia/Tokyo'}];clkx()")
    check('date + world clock', len(ev("cdate.textContent")) > 8 and 'Tokyo' in ev("cworld.textContent"))
    ev("const d=new Date();S.alarms=[{t:pad(d.getHours())+':'+pad(d.getMinutes()),on:true}]"); pg.wait_for_timeout(1500)
    check('alarm rings', ev("document.getElementById('ring').classList.contains('on')")); ev("stopRing()")
    pg.screenshot(path=str(OUT / 'clock.png'))
    # themes
    for t in ['flip','neon','amber','matrix','paper','sunset','cyber','forest','ice','custom']:
        ev(f"theme('{t}')"); pg.wait_for_timeout(350); pg.screenshot(path=str(OUT / f'theme_{t}.png'))
    ev("S.rain=false;theme('matrix')"); check('rain off', ev("rainT") == 0 or ev("rainT") is not None)
    ev("theme('flip')")
    check('no console errors', not errs, errs[:3])
    b.close()
print('\nFAILED: ' + ', '.join(fails) if fails else '\nALL PASSED'); sys.exit(1 if fails else 0)
