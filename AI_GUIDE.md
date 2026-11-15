# Chrono – Stopwatch & Timer: AI Guide

**Current version: v7** (zip: `chrono_v7_settings-page-gestures-alarms-fonts-bg.zip`)

## 1. MANDATORY RULES (jo bhi AI is project par kaam kare, use ye follow karna hi hai)

1. Kaam shuru karne se pehle ye poori file padho.
2. Har baar kaam ke baad **zip ka version badhao**: v1 -> v2 -> v3.
3. **Zip ka naam**: `chrono_v<N>_<kya-badla>.zip`, jaise `chrono_v3_pwa-offline.zip`, `chrono_v4_theme-change.zip`. Naam me chhota sa batao is version me kya hua. Purane zips delete mat karo.
4. Zip ke andar folder `chrono_v<N>/` ho. `index.html` ke top ka comment `<!-- Chrono vN -->` update karo.
5. Is file me update karo: "Current version" (upar), Section 5 (Pending), Section 6 (Bugs), Section 7 (Suggestions), aur Section 8 (Changelog).
6. Jo feature ho gaya use Pending se hata kar Changelog me likho. Naya bug mile to Section 6 me jodo. Bug theek karo to Changelog me **bug ki wajah (root cause)** aur fix likho.
7. Koi purana feature bina user ki permission ke mat hatao.
8. Code **3 alag files** me rahe: `index.html` (structure), `style.css` (design), `app.js` (logic). Naye files tabhi jab zaroori ho (jaise PWA ka `sw.js`).
9. Sirf ye scripts/styles bahar se load ho sakte hain: cdnjs.cloudflare.com, cdn.jsdelivr.net/npm, Google Fonts. Pinned version.
10. Kaam ke baad Section 3 ki checklist chalao. `node --check app.js` se JS syntax dekho.
11. User ko reply Hinglish me do: kya badla, kya baaki hai, kya bug mila.
12. **FINAL PROJECT RULE** (`docs/CHRONO_ANDROID_APP_PLAN.md` se): existing timer ki calculation, modes, themes ya layout ko kisi bhi naye feature (khaas kar Android integration) ke side effect me mat badlo. Pehle maujooda project ko audit/preserve karo, phir har approved feature ko alag module ki tarah jodo.
13. `docs/CHRONO_ANDROID_APP_PLAN.md` sirf **proposal** hai. Usme likhi koi cheez tab tak implement mat karo jab tak user saaf na bole. Section 5 me uski khuli decisions likhi hain.
14. **Navigation fixed hai**: upar sirf 4 mode tabs (Stopwatch, Timer, Interval, Clock). History, Tools aur Settings menu/settings me chhupe rahein. Naya tab user ki permission ke bina mat jodo.
15. **Tests zaroori**: zip me `tests/` folder hamesha jaye. Zip banane se pehle `python3 tests/run_tests.py` chalao (headless Chrome, playwright) aur "ALL PASSED" aana chahiye. Naya feature jode to uska test bhi `tests/run_tests.py` me jodo. Test fail ho to zip mat banao.
16. **Phase 4 (Android APK) se pehle 3 faisle user se lo**: (a) app ka naam aur package ID, (b) APK direct ya Google Play, (c) weather provider.
18. **Design originality**: reference apps (jaise Flip Clock screenshots) se sirf *feature ki soch* lo. Unke icons, illustrations, theme images, naam ya layout copy mat karo. Apna design banao (backgrounds `tools/gen_assets.py` me hamare apne SVG hain).
19. **Jo nahi karna (user ne tay kiya)**: Paid/Premium; Google Drive auto-backup aur crash reports (JSON export kaafi); floating clock, live wallpaper, pocket mode; Share/Rate/Feedback/privacy policy page (Play Store tak); seasonal themes (Halloween, Festive); calendar/analog widgets aur "Start week on"; side rail ke 5 icons (navigation rule 14).
20. `extras.css` auto-generated hai (`python3 tools/gen_assets.py`); haath se mat badlo. Built-in fonts (7-Segment, Pixel) aur backgrounds wahin se aate hain.
17. Har version me `sw.js` ka cache naam (`chrono-vN`) aur `FILES` list (ab `extras.css` bhi) update karo, warna PWA purana code dikhayega.

## 2. Project overview

Landscape me chalne wala stopwatch + timer + interval. Bade digits, adaptive layout:

| Time | Layout |
|---|---|
| 1 minute se kam | `l1`: sirf seconds poori screen |
| 1 minute se 1 ghanta | `l2`: minutes aur seconds half-half |
| 1 ghanta ya zyada | `l3`: hours (thoda left) aur minutes (thoda right) barabar bade aur beech me saaf gap, seconds bahut chhota, right column (20%) me, uski baseline minutes ke digit ki baseline ke barabar |

Gestures: left/right swipe = mode badlo, pinch = digit size, double-tap = start/pause (Clock me screen off). Modes: Stopwatch (`sw`), Timer (`tm`), Interval/Pomodoro (`iv`), Clock/live time (`clk`, layout `l3` seconds ke saath ya `l4` bina seconds).

Files:
- `index.html`: HTML structure (tabs, panels, bar, settings, laps sheet).
- `style.css`: sab design, themes, animations.
- `app.js`: sab logic.
- `extras.css`: auto-generated (built-in fonts + background art). `tools/gen_assets.py` isko banata hai.
- `build_single.py`: `python3 build_single.py` se css+js ko ek `chrono_single.html` me jodta hai (preview/hosting ke liye jahan alag files na chalein).
- `docs/CHRONO_ANDROID_APP_PLAN.md`: Android app ka proposal (Capacitor, weather, widgets, roadmap). Sirf planning.
- `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`: PWA (offline install). HTTPS hosting par kaam karte hain.
- `tests/run_tests.py`: headless Chrome tests (screenshots `tests/out/` me).
- `AI_GUIDE.md`: ye file.

## 3. Test checklist (har change ke baad)

- [ ] `python3 tests/run_tests.py` -> ALL PASSED.
- [ ] Settings ek full-screen page hai (left categories, back button).
- [ ] ☀ button se screen-on poore app me kaam kare (sirf chalte time nahi).
- [ ] Clock me double-tap se screen off, tap se wapas.
- [ ] Swipe se mode badle, pinch se size; tap logic na bigde.
- [ ] Settings (⚙) aur Laps dono khulte hain; bahar (main screen) touch karne par band ho jate hain.
- [ ] Settings ke sections collapsed hain, ek time me ek hi khulta hai.
- [ ] Timer ke ▲▼ arrows kaam karein (dabaye rakho to repeat), aur Chrome me text select / Google search popup na aaye.
- [ ] Clock tab: live time, 12/24 ghante, seconds on/off.
- [ ] Har built-in theme (Flip, Neon, Amber, Matrix, Paper, Sunset) check karo. Flip/Amber/Matrix me background asli AMOLED black (#000) aur Flip/Paper me digit pure #fff/#000.
- [ ] Browser test: `playwright` (python) se headless Chromium me screenshot lo (koi `elementFromPoint` se bhi click check kar sakta hai).
- [ ] Stopwatch: seconds poori screen, digit beech me.
- [ ] 59 -> 60 sec par `l2`. 59:59 -> 1:00:00 par `l3`.
- [ ] `l3`: hours/minutes barabar, seconds chhota, right me, baseline minutes ke saath.
- [ ] Timer set -> chalao -> khatam: alarm + flash; Reset par band.
- [ ] Interval: Focus -> Break -> Focus, 4 focus ke baad Long break; label (Focus 1/4) sahi.
- [ ] Lap -> Export CSV file banata hai.
- [ ] Har theme + Custom theme me digits dikhein; settings yaad rahein.
- [ ] Flip animation chale; Settings me band ho jaye.
- [ ] Buttons digits ko na dhakein; chalte time chhup jayein.
- [ ] Portrait me "landscape karo" message.

## 4. Process: feature badalna ya jodna

Code map:

- **Layout / digit size**: `style.css` (`#app.l1/.l2/.l3`, grid areas) aur `app.js` `fit()` + `metrics()`.
  - `metrics()` canvas se digit ki asli height/offset naapta hai (digit ko box ke beech rakhne ke liye). Hatao mat.
  - `fit()` me height ka hissa: `.68` (setup `.45`, seconds mini `.18`). `l3/l4` me hours/minutes ki width `.84`, seconds `.62`; hours panel ka digit `-5%` left aur minutes ka `+4%` right khiskata hai (`translate` ka x), taaki double-digit hours minutes se na chipken. `translate` property se digit ko vertically center aur `l3` me seconds ki baseline align hoti hai. Digit par `transform` mat lagao (flip animation use karti hai).
- **Themes**: `style.css` `body[data-theme=...]` (variables `--bgA --bgB --fgA --fgB --glow --font --w --ui`) + `app.js` `THEMES`. Naya theme = CSS block + `THEMES` entry + font ho to Google Fonts link.
- **Themes ka naya system**: panel par `--fg` variable (digit rang), `--dfill` (outline theme me fill), `--sw` (outline motai). Neon/Matrix me beech ka divider `body.has-div #app::before`. Matrix ki digital rain `rain()` + `<canvas id="rain">`.
- **Custom theme**: `app.js` `applyCustom()`, `FONTS`, `S.custom` (4 rang, font, glow, outline, split line). Settings me "Custom theme" section.
- **Clock mode**: `render()` me `clk` branch, `clkTick()`, `S.clk` (`h24`, `sec`). Controls `body.m-clk` se chhupte hain.
- **Settings sections**: `index.html` `<details class="sec">`; accordion JS `app.js` ke end me (ek time me ek khula).
- **Sheets band karna**: `document` `pointerdown` handler (sheet ke bahar touch).
- **Stopwatch/Timer/Interval logic**: `app.js` `st`, `cur`, `el()`, `val()`, `toggle()`, `reset()`, `finish()`, `loop()`.
- **Interval**: `ivDur()`, `ivReset()`, `ivNext()`; settings `S.iv`; label `#phase`; phase rang `style.css` `.ph-break/.ph-long`.
- **Timer set karna**: `#chips` + `.arr` (sirf `idle()` aur `tm` me).
- **Laps + CSV**: `lap()`, `drawLaps()`, `#bCsv` handler.
- **Flip animation**: `setT()` (`app.js`) + `.digits.flip` (`style.css`). Setting `S.flip`.
- **Settings**: `index.html` `#set`. Naya option = HTML row + `S` default + listener.
- **Buttons**: `#bar` (neeche), `#tabs` (upar left), `#tools` (upar right), `#chips`.

- **Timing/persistence**: sab time `Date.now()` timestamps par (`el()`, `cur.t0`). Running state `persist()` se localStorage (`chrono_st`) me; load par restore aur `loop()` dobara. `ivNext(over)` overdue time carry karta hai.
- **Tap control**: `S.tap` (`off`/`dbl`/`any`), `#app` ka `pointerup` handler; sheet band karne wala tap `swallow` se nigla jata hai.
- **Presets**: timer presets `S.tp`, chips `chipsUpdate()`; interval presets `IVP`, seconds me (`S.iv.w/b/l`), `S.iv.rounds`.
- **Laps**: best/worst `drawLaps()`, note `ask()` dialog, CSV me Note.
- **History**: `HIST` (localStorage `chrono_hist`, max 500), `addHist()`, `recordSession()`, `renderHist()`.
- **Backup**: Settings > Backup, `importJSON()`.
- **Clock extras**: `clkx()`, `ZONES`, `S.zones`, `S.alarms`, `ring()`.
- **Digit style**: `S.ds` (`plain`/`soft`/`card`), `setT()` aur CSS `.fl.a/.b/.c/.d` (asli flip-card). Digit par `transform` mat lagao, `translate` use hota hai.
- **PWA**: `manifest.json`, `sw.js`, registration `app.js` ke end me (sirf http/https par).

- **Settings page**: `index.html` `#set` (`.page`), `.pg[data-pg]` sections, nav `#nav`; JS `goPage()`, `PG`. Naya option = HTML row + `bind('#id',obj,'key',fn)`.
- **Gestures**: `app.js` me `ptr`, `gend`, pointer handlers on `#app` (swipe `setMode`, pinch `S.scale`, taps). `#app{touch-action:none}`.
- **Screen off / wake / burn-in**: `screenOff()`, `#off`; `wakeSync()`, `#bWake`; `burnShift()` (`bx/by` + `--bx/--by`, `fit()` me jode jate hain).
- **Card style**: `body.cardstyle` CSS; **backgrounds**: `body[data-bg]`, `#bg` (CSS `extras.css`); **portrait**: `body.pm` + `@media (orientation:portrait)`.
- **Alarms**: `S.alarms[{t,on,n,d[],snd,skip}]`, `drawAlarms()`, `nextAlarm()`, `ring()`, `playSound()` (`tone()`).
- **Clock info**: `labels()`, `fmtDate()`, `clkx()`, `zinfo()` (world clock diff/day), `S.clk.dp/df/lc/next`.
- **Chime**: `doChime()`, `S.chime`. **Tags**: `S.tags`, `pickTag()`, `drawTags()`. **Language**: `I18N`, `T()`, `applyLang()` (settings ka text Hinglish hi hai). **Guide**: `showGuide()`, `S.guide`.
- **Fonts**: `FONTS` (+ built-in `Chrono7Seg`, `ChronoPixel`), `S.font`, `applyFont()`.

Naya feature jodna: (1) Section 5 se chuno, (2) chhota plan, (3) code, (4) checklist, (5) version badhao + zip + guide update.

## 5. Pending features

### 5A. Phase 4: Android APK (Capacitor) - sab yahi pending hai
- Alarm **silent mode me bhi** aur **band app me bhi** bajna (native alarm, notification).
- **Quick start notification**: notification bar se Pomodoro/Stopwatch/Timer shuru.
- **Keep running guide page**: battery optimisation hatana, notification permission, "recent apps me lock" (template).
- **Charging par standby** aur **Always-on hours** ("charge hote time clock chalu", "subah 5:30 se 7:30"), brightness aur screen timeout.
- **Permission samjhane wala dialog**.
- **Widgets**: pehle sirf "chalta hua timer"; baad me flip clock / world clock widget.
- Time chime/speak band app me (web me sirf app khula ho tab).
- **Pehle 3 faisle chahiye** (rule 16): app naam + package ID, APK direct ya Google Play, weather provider.
- Is sandbox me APK nahi ban sakta; Capacitor project/steps bana sakte hain. Plan: `docs/CHRONO_ANDROID_APP_PLAN.md` (sirf proposal).

### 5B. Phase 5: baad me
- Weather (pehle manual city, temperature + condition), phir location aur forecast.

### 5C. Kam zaroori (pending)
- Compass, battery info, Quick Settings tile.

### 5D. Chhote sudhaar jo dikhe
- Settings ka text abhi Hinglish me hai (sirf main labels Hindi/English me badalte hain).
- Fonts ke liye "dim unlit segments" wala asli 7-segment look (ab sirf lit segments).
- History/presets ko IndexedDB me (abhi localStorage).

## 6. Known bugs / problems

- Timer/alarm clock ka alert tab hi bajta hai jab page/app khula ho (browser tab ya PWA). Band app me alert ke liye Android native chahiye (Phase 4).
- Chime/speak aur alarm tab hi chalte hain jab app khula ho. Browser ko ek baar screen touch bhi chahiye.
- "Double-tap screen off" asli screen band nahi karta; AMOLED par poori kaali screen dikhata hai (pixel band). Screen on rakhne ke liye ☀ alag hai.
- Pinch sirf touch screen par; desktop par test synthetic events se hota hai.
- Alarm ki awaaz ke liye browser ko ek baar screen touch chahiye (audio permission); touch ke bina alarm chup reh sakta hai.
- History aur presets `localStorage` me hain (max 500 history entries). Browser data saaf karne par ja sakte hain; Settings > Backup se export karo. Fix idea: IndexedDB.
- PWA ka service worker sirf HTTPS/localhost par chalta hai. Tests `file://` par chalte hain, to SW ka offline behaviour abhi test nahi hua. claude.ai preview me SW register nahi hota.
- Digit style ka default "Soft flip" hai (purana look). "Flip card" Settings > Display me chunna padta hai.
- Timer ke ▲▼ arrows sirf `l1/l2` me. 1 ghante se upar ke target me sirf chips.
- Clock mode me "SECONDS" label ko upar ke buttons kabhi dhak dete hain (sirf label).
- Neon ka beech wala circle kabhi digit ke kinare ko chhoo sakta hai.
- Matrix rain battery leti hai; Settings > Display se band karo.
- Fullscreen/orientation lock iPhone Safari me nahi chalta.
- Asli phone par test abhi nahi hua; digit centering canvas measurement par hai.

## 7. Suggestions

- Alag alarm sounds.
- Timer presets ko naam dekar save karna.
- Best/worst lap highlight.
- "Tap anywhere to start/pause" option.
- Interval ke presets (52/17, 50/10, workout 40/20).
- Interval me total rounds ke baad band hone ka option.

## 8. Changelog

### v7 (`chrono_v7_settings-page-gestures-alarms-fonts-bg`)
- **Settings** ab alag full-screen page (left categories: Look, Display, Controls, Timer, Clock, Alarms, Data, Help), back button.
- **Keep screen on**: ☀ button + Settings; ab poore app me (clock/idle me bhi), pehle sirf chalte time.
- **Burn-in protection** (digits har minute 2-3 px), **Clock screen off** (double/single tap), **swipe** se mode, **pinch** se digit size.
- **Card style** (option, purana look default), **Date/din digits ke upar** + AM/PM kone me (option), date formats.
- **Alarm**: naam, Mo-Su repeat, "skip next", sound choice (5), clock par "agla alarm". **World clock**: aaj/kal + ghante ka fark, local city naam.
- **Fonts**: built-in 7-Segment aur Pixel (offline, fontTools se banaye), Stencil, Outline, Audiowide, Black Ops, Playfair, Nunito; global "Digit font".
- **Time chime** (har ghante/aadhe ghante, bolkar bhi, quiet hours), **tag picker** (labels), **backgrounds** (starry sky, city, mountains: apne SVG), **portrait option**, **Hindi/English labels**, **first-run gesture guide**.
- Bug fix: timer set ke neeche wale arrows ko naya label chip dhak raha tha; arrows aur chips ki jagah theek ki (digit factor `.45` -> `.40`).
- Tests: ~60 checks; portrait aur first-run guide ke alag contexts.
- Android items (5A) aur "nahi karna" list guide me lock.

### v6 (`chrono_v6_hours-layout-spacing`)
- Hours wale layout (`l3`) me seconds aur chhota (height `.26` -> `.18`, width `.7` -> `.62`) aur seconds column `24%` -> `20%`.
- Minutes right ki taraf (+4% panel width) aur hours left ki taraf (-5%) khiskaye; hours/minutes ki digit width `.92` -> `.84`. Double-digit hours (jaise 12) ab minutes se mile hue nahi lagte. Clock mode (`l4`) me bhi wahi.
- Neon/Matrix ka divider `l3` me `40%` par (column badalne ki wajah se).
- Test: `tests/run_tests.py` me 3 naye checks (hours-minutes gap, seconds size, minutes-seconds gap). `sw.js` cache `chrono-v6`.

### v5 (`chrono_v5_phase1-3-pwa-tests`)
- **Phase 1**: timer ka hisaab `Date.now()` timestamps par (pehle `performance.now()`, jo kuch phones par sleep me ruk sakti thi). Running state save hota hai, refresh/app band hone ke baad bhi sahi time. Tap se start/pause: Off / Double-tap / Tap anywhere (Settings > Display).
- **Phase 2**: Interval presets (25/5, 50/10, 52/17, Workout 40s/20s) aur interval ab `mm:ss` (seconds support); "kitne rounds ke baad band". Timer presets save (naam + ek tap start). Laps: best/worst highlight, note, CSV me note. History: din aur label ke hisaab se total. Backup: Export/Import JSON.
- **Phase 3**: Clock me date aur din, world clock (20 shehar), alarm clock. Digit style: Plain / Soft flip / asli Flip card. Matrix rain on/off. Naye themes: Cyberpunk, Forest, Ice.
- **PWA**: `manifest.json`, `sw.js`, icons.
- **Tests**: `tests/run_tests.py` (28 checks, headless Chrome) zip me.
- Wajah/fix notes: render() ek buggy regex se kat gaya tha patch ke time, `render` wapas jodi aur test se pakda; clipboard promise ka unhandled error `.catch` se theek.
- Interval ka purana minutes data seconds me convert hota hai (migration).

### v4 (`chrono_v4_pending-plan-android-doc`)
- Code me koi badlav nahi (sirf `index.html` ke comment me version).
- User ki 8 feature requests Section 5A me pending list me jodi.
- `docs/CHRONO_ANDROID_APP_PLAN.md` zip me jodi; Section 5B me uska saar aur 10 khuli decisions.
- Naye rules 12 aur 13 (Final Project Rule, plan sirf proposal).
- Section 6 me naye possible bugs: `performance.now()` sleep me ruk sakti hai, state save nahi hota, interval seconds support nahi.
- Conflict note: plan "plain digits" ki baat karta hai, user flip-card chahta hai -> Digit style option (5A-6).

### v3 (`chrono_v3_amoled-themes-clock-settings-fixes`)
- **Bug fix (timer ▲▼ arrows kaam nahi karte the)**: wajah ye thi ki bada `.digits` element upar wale arrow ko dhak leta tha aur click usi ko lagta tha (`elementFromPoint` se confirm hua). Fix: `.digits{pointer-events:none}`, arrows par `z-index`, aur `pointerdown` par chalte hain (dabaye rakho to repeat).
- **Bug fix (Chrome me arrow dabane par text select hota aur Google search aata tha)**: wajah double-tap par text selection tha. Fix: `user-select:none` sab par, `selectstart` aur `contextmenu` band (input/select chhodkar), `-webkit-touch-callout:none`.
- **AMOLED**: Flip, Amber, Matrix ka background `#000`, settings panel bhi `#000`. Flip digits `#fff`, Paper theme `#fff` background aur `#000` digits.
- **Themes naye sire se**:
  - Neon Glass: reference image jaisa (navy-purple aur green halves, glass outline digits + glow, beech me glowing divider aur circle, font Exo 2).
  - Matrix: asli black, `#00ff41` digits, Share Tech Mono, digital rain background, hari divider line.
  - Sunset: sky gradient (indigo se orange), cream digits, Anton font.
  - Amber: asli black, amber digits.
- **Custom theme**: naye options Outline digits aur Flip split line; default rang saaf (black + cyan/white). Theme badalte hi live update.
- **Settings**: ab collapsed sections (Theme, Custom theme, Display, Alerts, Interval, Clock, Shortcuts), ek time me ek khulta hai. Settings ya Laps ke bahar touch karne par band. Gear/Laps button dobara dabane par toggle.
- **Naya**: Clock tab (live time, 12/24 ghante, seconds on/off, AM/PM label). Seconds baseline minutes ke saath.
- **UI**: upar ke tabs aur tools chhote.

### v2 (`chrono_v2_interval-csv-customtheme-flip-fixes`)
- **Bug fix (Settings aur Laps nahi khulte the)**: wajah CSS specificity thi. `#set`/`#lapsheet` (ID selector) ka `transform:translateX(105%)` `.sheet.open{transform:none}` se zyada taqatwar tha, isliye `open` class lagne par bhi panel bahar hi rehta tha. Fix: `#set.open,#lapsheet.open{transform:none}`.
- **Bug fix**: Paper theme me sheets ke buttons (Close/Export) dark rang me dikhte the; ab `.sheet button.g{color:#eee}`.
- **Layout `l3`**: seconds ka size aur chhota (`.26`), baseline minutes ke digit ki baseline ke barabar (bottom aligned).
- **Naya**: Interval/Pomodoro mode (Focus, Break, Long break, auto-start, phase label, phase ke hisaab se rang).
- **Naya**: Lap CSV export (download + clipboard).
- **Naya**: Custom theme (4 rang, 8 fonts, glow).
- **Naya**: Flip animation (Settings me on/off).
- **Code**: ek file se 3 files (`index.html`, `style.css`, `app.js`) + `build_single.py`.
- Settings me ab: Milliseconds, Labels, Alarm sound, Vibration, Screen on rakho, Flip animation, Interval (4 numbers + auto-start), Custom theme (4 rang, font, glow), Theme grid (7 theme).

### v1 (`chrono_v1`)
- Pehla zip: stopwatch + timer, adaptive layout, 6 themes, settings, laps, timer chips/arrows, alarm, auto-hide buttons, fullscreen, shortcuts.
- Digit centering (canvas se), `l3` me hours/minutes barabar size, buttons chhote.
