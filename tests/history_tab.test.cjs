// History tab: month calendar, month summary, expandable workout cards, day taps, filters, search, delete.
const {JSDOM}=require('jsdom');
const html=require('fs').readFileSync(require('path').join(__dirname,'..','src','index.html'),'utf8');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const S=(date,s,ex,more)=>Object.assign({date,s,ex,updated:new Date(date+'T18:00:00').getTime()},more||{});
const base={
 '2026-10-15_pushA':S('2026-10-15','pushA',{'Bench press':[{w:135,r:8}]}),
 '2026-11-02_pushA':S('2026-11-02','pushA',{'Bench press':[{w:135,r:8},{w:135,r:8}]}),
 '2026-11-04_pullA':S('2026-11-04','pullA',{'Barbell row':[{w:135,r:8}]}),
 '2026-11-06_legsA':S('2026-11-06','legsA',{'Back squat':[{w:185,r:5}]}),
 '2026-11-24_pushB':S('2026-11-24','pushB',{'Bench press':[{w:155,r:8,e:8}]}),
 '2026-11-25_pullB':S('2026-11-25','pullB',{'Pull-up (weighted)':[{w:25,r:6}]},{dur:52}),
 '2026-11-26_legsB':S('2026-11-26','legsB',{'Deadlift':[{w:225,r:5}]})};
const mk=(now,sessions)=>{const seed={profile:{start:'2026-10-12',unit:'lb'},sessions};
 const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',beforeParse(w){const RD=w.Date;class FD extends RD{constructor(...a){if(a.length)super(...a);else super(FD.now())}static now(){return new RD(now).getTime()}};w.Date=FD;w.ResizeObserver=class{observe(){}disconnect(){}};w.scrollTo=()=>{};w.localStorage.setItem('liftlog.v1',JSON.stringify(seed));w.__e=[];w.addEventListener('error',e=>w.__e.push(e.message))}});
 return dom.window};
const ok=(c,m)=>{if(!c)throw new Error('history_tab: '+m);console.log('ok  ',m)};
const stored=w=>JSON.parse(w.localStorage.getItem('liftlog.v1')).sessions;
const cards=d=>[...d.querySelectorAll('#main .hist')];
const cardOf=(d,id)=>cards(d).find(c=>c.dataset.hid===id);
const tiles=d=>Object.fromEntries([...d.querySelectorAll('.hsum .pr')].map(p=>[p.querySelector('span').textContent,[...p.children].map(x=>x.textContent.trim()).join(' ')]));
(async()=>{
 const w=mk('2026-11-28T12:00:00',base),d=w.document;await sleep(400);
 const before=JSON.stringify(stored(w));
 d.querySelector('[data-tab=history]').click();await sleep(20);
 // calendar
 ok(/November/.test(d.querySelector('.hcmt').textContent)&&/2026/.test(d.querySelector('.hcmt').textContent),'opens on November 2026');
 for(const [dt,s] of [['02','pushA'],['04','pullA'],['06','legsA'],['24','pushB'],['25','pullB'],['26','legsB']]){
  const c=d.querySelector(`[data-hd="2026-11-${dt}"]`),dot=c.querySelector('.hdots i'),col=/* dayColor of the default PPL days */({push:'#d8342c',pull:'#2a63d4',legs:'#e0a800'})[s.slice(0,4)];
  ok(dot&&dot.getAttribute('style').includes(col),`Nov ${dt} has a ${s} dot (${col})`)}
 ok(d.querySelectorAll('.hcg [data-hd]').length===30,'30 day buttons in November');
 ok(d.querySelectorAll('.hcg .hdots i').length===6,'only the 6 workout days have dots');
 ok(!d.querySelector('[data-hd="2026-11-10"] .hdots i'),'Nov 10 has no dot');
 ok(d.querySelector('[data-hd="2026-11-28"]').classList.contains('td'),'today has .td');
 ok(/Tue, Nov 24, Push B logged/.test(d.querySelector('[data-hd="2026-11-24"]').getAttribute('aria-label')),'aria-label "Tue, Nov 24, Push B logged"');
 // summary
 const t=tiles(d);console.log('summary:',JSON.stringify(t));
 ok(/Workouts 6\b/.test(t.Workouts),'summary Workouts 6');
 ok(/6,680 lb/.test(t.Volume),'summary Volume 6,680 lb');
 ok(/PRs 1\b/.test(t.PRs),'summary PRs 1');
 ok(/Longest streak 3 days in a row/.test(t['Longest streak']),'summary Longest streak 3 days in a row');
 // cards
 const cs=cards(d);ok(cs.length===6,'six .hist cards in November');
 ok(cs.map(c=>c.dataset.hid).join()==='2026-11-26_legsB,2026-11-25_pullB,2026-11-24_pushB,2026-11-06_legsA,2026-11-04_pullA,2026-11-02_pushA','cards newest first');
 ok(cs.every(c=>c.querySelector('[data-open]')&&c.querySelector('[data-del]')),'each card has [data-open] and [data-del]');
 ok(/52 min/.test(cardOf(d,'2026-11-25_pullB').querySelector('.meta').textContent),'11-25 .meta contains "52 min"');
 ok(cardOf(d,'2026-11-25_pullB').querySelector('.meta').textContent==='Wed, Nov 25 · 1 set · 150 lb · 52 min','.meta keeps the old text format');
 ok(/1 PR/.test((cardOf(d,'2026-11-24_pushB').querySelector('.whead .wpr')||{}).textContent||''),'11-24 card has a PR badge');
 ok(!cardOf(d,'2026-11-02_pushA').querySelector('.whead .wpr'),'11-02 card has no PR badge (equal to first log)');
 // expand / collapse
 let hx=cardOf(d,'2026-11-24_pushB').querySelector('[data-hx]');hx.click();await sleep(10);
 ok(hx.getAttribute('aria-expanded')==='true'&&cardOf(d,'2026-11-24_pushB').classList.contains('open'),'tap header expands 11-24');
 const body=cardOf(d,'2026-11-24_pushB').querySelector('.wbody').textContent;
 ok(body.includes('155 × 8')&&body.includes('RPE 8'),'expanded card shows "155 × 8" and "RPE 8"');
 ok(cardOf(d,'2026-11-24_pushB').querySelector('.wset.ispr'),'PR set is marked');
 ok(cardOf(d,'2026-11-24_pushB').querySelector('.wex .thumb img,.wex .thumb svg'),'exercise row has a photo or figure');
 ok(!/RPE/.test(cardOf(d,'2026-11-26_legsB').querySelector('.wbody').textContent),'no RPE shown when not logged');
 cardOf(d,'2026-11-25_pullB').querySelector('[data-hx]').click();await sleep(10);
 ok(cardOf(d,'2026-11-24_pushB').classList.contains('open')&&cardOf(d,'2026-11-25_pullB').classList.contains('open'),'several cards open at once');
 d.querySelector('[data-hf="all"]').click();await sleep(10);
 ok(cardOf(d,'2026-11-24_pushB').classList.contains('open'),'open state survives a re-render');
 hx=cardOf(d,'2026-11-24_pushB').querySelector('[data-hx]');hx.click();await sleep(10);
 ok(hx.getAttribute('aria-expanded')==='false','tap again collapses');
 // tap a day
 d.querySelector('[data-hd="2026-11-02"]').click();await sleep(10);
 ok(cards(d).filter(c=>c.classList.contains('open')).map(c=>c.dataset.hid).join()==='2026-11-02_pushA','day tap expands only the 11-02 card');
 ok(d.querySelector('[data-hd="2026-11-02"]').classList.contains('on')&&d.querySelector('[data-hd="2026-11-02"]').getAttribute('aria-pressed')==='true','11-02 marked .on');
 d.querySelector('[data-hd="2026-11-02"]').click();await sleep(10);
 ok(!d.querySelector('.hday.on'),'tapping the selected day again clears it');
 d.querySelector('[data-hd="2026-11-10"]').click();await sleep(10);
 ok(/No workout on Tue, Nov 10\./.test(d.querySelector('#hday').textContent),'empty day shows "No workout on Tue, Nov 10."');
 ok(d.querySelector('[data-hd="2026-11-29"]').disabled,'future days are disabled');
 // months
 ok(d.querySelector('[data-hm="1"]').disabled,'next month disabled in November');
 d.querySelector('[data-hm="-1"]').click();await sleep(10);
 ok(/October/.test(d.querySelector('.hcmt').textContent),'prev arrow shows October');
 ok(d.querySelectorAll('.hcg .hdots i').length===1&&d.querySelector('[data-hd="2026-10-15"] .hdots i'),'October: one dot on the 15th');
 ok(/Workouts 1\b/.test(tiles(d).Workouts)&&/PRs 0\b/.test(tiles(d).PRs),'October summary: 1 workout, 0 PRs (first log)');
 ok(cards(d).length===1,'October shows one card');
 d.querySelector('[data-hm="1"]').click();await sleep(10);
 ok(/November/.test(d.querySelector('.hcmt').textContent),'next arrow returns to November');
 // swipe
 // Direction matches the date picker (openCal): finger moves right (dx>0) = previous month, finger moves left (dx<0) = next month.
 const swipe=(x0,x1,y1)=>{const gw=d.querySelector('.hcgw');gw.dispatchEvent(new w.MouseEvent('pointerdown',{clientX:x0,clientY:100,bubbles:true}));gw.dispatchEvent(new w.MouseEvent('pointerup',{clientX:x1,clientY:y1||100,bubbles:true}))};
 swipe(300,200);await sleep(10);
 ok(/November/.test(d.querySelector('.hcmt').textContent),'swipe 300 → 200 in November does nothing (next month is disabled)');
 swipe(200,300);await sleep(10);
 ok(/October/.test(d.querySelector('.hcmt').textContent),'swipe 200 → 300 goes back to October');
 swipe(200,300);await sleep(10);
 ok(/October/.test(d.querySelector('.hcmt').textContent),'no swipe past the first month with workouts');
 swipe(300,200);await sleep(10);
 ok(/November/.test(d.querySelector('.hcmt').textContent),'swipe 300 → 200 goes forward to November');
 swipe(200,240,180);await sleep(10);
 ok(/November/.test(d.querySelector('.hcmt').textContent),'short or mostly vertical drag does not change month');
 // filters
 d.querySelector('[data-hf="pull"]').click();await sleep(10);
 ok(cards(d).map(c=>c.dataset.hid).join()==='2026-11-25_pullB,2026-11-04_pullA','Pull filter leaves 11-25 and 11-04');
 ok(/Workouts 6\b/.test(tiles(d).Workouts),'summary still 6 with a filter');
 ok(d.querySelector('[data-hf="pull"]').getAttribute('aria-pressed')==='true','Pull chip pressed');
 d.querySelector('[data-hf="all"]').click();await sleep(10);
 const q=d.querySelector('#hq');q.focus();q.value='bench';q.dispatchEvent(new w.Event('input',{bubbles:true}));await sleep(10);
 ok(/Results in all months/.test(d.querySelector('#hlist').textContent),'search heading "Results in all months"');
 ok(cards(d).map(c=>c.dataset.hid).join()==='2026-11-24_pushB,2026-11-02_pushA,2026-10-15_pushA','search "bench" finds 11-24, 11-02, 10-15');
 ok(d.querySelector('#hq')===q&&d.activeElement===q,'search box keeps focus (not re-rendered)');
 d.querySelector('[data-hf="legs"]').click();await sleep(10);
 ok(/No workouts match\./.test(d.querySelector('#hlist').textContent),'search + Legs filter combine to no results');
 d.querySelector('[data-hf="all"]').click();await sleep(10);
 const q2=d.querySelector('#hq');q2.value='zzz';q2.dispatchEvent(new w.Event('input',{bubbles:true}));await sleep(10);
 ok(/No workouts match\./.test(d.querySelector('#hlist').textContent),'search "zzz" shows "No workouts match."');
 q2.value='';q2.dispatchEvent(new w.Event('input',{bubbles:true}));await sleep(10);
 ok(JSON.stringify(stored(w))===before,'sessions unchanged before Delete');
 // tab reopen resets state
 d.querySelector('[data-tab=home]').click();d.querySelector('[data-tab=history]').click();await sleep(10);
 ok(cards(d).length===6&&!d.querySelector('.wcard.open'),'reopening the tab resets to November, all collapsed');
 // delete (two taps)
 let del=cardOf(d,'2026-11-04_pullA').querySelector('[data-del]');del.click();await sleep(10);
 ok(stored(w)['2026-11-04_pullA']&&/Confirm/.test(cardOf(d,'2026-11-04_pullA').querySelector('[data-del]').textContent),'first Delete tap only arms');
 cardOf(d,'2026-11-04_pullA').querySelector('[data-del]').click();await sleep(20);
 const after=stored(w);ok(!after['2026-11-04_pullA']&&Object.keys(after).length===6,'second tap deletes only that session');
 const exp=JSON.parse(before);delete exp['2026-11-04_pullA'];ok(JSON.stringify(after)===JSON.stringify(exp),'other sessions byte-for-byte unchanged');
 // CSS
 const css=[...d.querySelectorAll('style')].map(s=>s.textContent).join('\n'),blk=css.slice(css.indexOf('/* history tab */'));
 const rule=sel=>{const m=blk.match(new RegExp('(^|\\n|\\})'+sel.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\{([^}]*)\\}'));return m?m[2]:''};
 const mh=sel=>{const m=rule(sel).match(/min-height:(\d+)px/);return m?+m[1]:0};
 ok(mh('.hday')>=44&&mh('.hcnav button')>=44&&mh('.whead')>=44&&mh('.hf')>=44,'[data-hd] [data-hm] [data-hx] [data-hf] min-height >= 44px');
 ok(/repeat\(7,minmax\(0,1fr\)\)/.test(rule('.hdow,.hcg')),'7 day columns shrink to fit (minmax(0,1fr))');
 ok(/prefers-reduced-motion:reduce\)\{[^\n]*\.wbody/.test(blk),'reduced-motion rule disables history transitions');
 console.log('errors',w.__e);

 // second instance: Dec 3, no December workouts -> opens on November
 const w2=mk('2026-12-03T12:00:00',base),d2=w2.document;await sleep(400);d2.querySelector('[data-tab=history]').click();await sleep(20);
 ok(/November/.test(d2.querySelector('.hcmt').textContent),'on 2026-12-03 opens on November (latest workout month)');
 ok(!d2.querySelector('[data-hm="1"]').disabled,'from November, next is enabled up to December');
 console.log('errors2',w2.__e);

 // third instance: live session today
 const live=Object.assign({},base,{'2026-11-28_pushA':S('2026-11-28','pushA',{},{live:true,start:new Date('2026-11-28T11:30:00').getTime()})});
 const w3=mk('2026-11-28T12:00:00',live),d3=w3.document;await sleep(400);const b3=JSON.stringify(stored(w3));
 d3.querySelector('[data-tab=history]').click();await sleep(20);
 const c28=d3.querySelector('[data-hd="2026-11-28"]');
 ok(c28.querySelector('.hdots i')&&/in progress/.test(c28.getAttribute('aria-label')),'live session shows on the 28th');
 ok(/Workouts 7\b/.test(tiles(d3).Workouts),'live session counts in Workouts');
 const lc=cardOf(d3,'2026-11-28_pushA');ok(lc&&/In progress/.test(lc.querySelector('.meta').textContent),'live card says "In progress"');
 lc.querySelector('[data-open]').click();await sleep(20);
 ok(d3.querySelector('#wdate').value==='2026-11-28'&&d3.querySelector('[data-s=pushA]').getAttribute('aria-pressed')==='true','Open goes to the Workout tab on that day');
 ok(d3.querySelector('[data-tab=today]').getAttribute('aria-current')==='true','Workout tab is current');
 ok(JSON.stringify(stored(w3))===b3,'sessions unchanged in live instance');
 console.log('errors3',w3.__e);
 process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
