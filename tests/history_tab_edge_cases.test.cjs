// QA edge cases for the History tab (PR C): empty storage, month and year boundaries, leap years, kg, bodyweight sets,
// live sessions with no sets, custom programs, XSS in names, special-character search, filter + day interplay,
// swipe direction vs openCal, Delete / Open flows, Home tile entry, performance with many sessions, other tabs.
const {JSDOM}=require('jsdom');
const html=require('fs').readFileSync(require('path').join(__dirname,'..','src','index.html'),'utf8');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const S=(date,s,ex,more)=>Object.assign({date,s,ex,updated:new Date(date+'T18:00:00').getTime()},more||{});
const mk=(now,seed)=>{
 const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',beforeParse(w){const RD=w.Date;class FD extends RD{constructor(...a){if(a.length)super(...a);else super(FD.now())}static now(){return new RD(now).getTime()}};w.Date=FD;w.ResizeObserver=class{observe(){}disconnect(){}};w.scrollTo=()=>{};if(seed)w.localStorage.setItem('liftlog.v1',JSON.stringify(seed));w.__e=[];w.addEventListener('error',e=>w.__e.push(e.message))}});
 return dom.window};
const prof=(more)=>Object.assign({start:'2026-10-12',unit:'lb'},more||{});
const ok=(c,m)=>{if(!c)throw new Error('history_tab_edge_cases: '+m);console.log('ok  ',m)};
const stored=w=>JSON.parse(w.localStorage.getItem('liftlog.v1')).sessions;
const cards=d=>[...d.querySelectorAll('#main .hist')];
const cardOf=(d,id)=>cards(d).find(c=>c.dataset.hid===id);
const title=d=>d.querySelector('.hcmt').textContent.replace(/\s+/g,' ').trim();
const tiles=d=>Object.fromEntries([...d.querySelectorAll('.hsum .pr')].map(p=>[p.querySelector('span').textContent,[...p.children].map(x=>x.textContent.trim()).join(' ')]));
const openHist=async d=>{d.querySelector('[data-tab=history]').click();await sleep(20)};
const blanks=d=>[...d.querySelector('.hcg').children].filter(x=>x.tagName==='SPAN').length;
const allErr=[];const done=(tag,w)=>{console.log('errors'+'',w.__e);allErr.push(...w.__e.map(e=>tag+': '+e))};
(async()=>{
 // 1. brand-new user, empty storage
 {const w=mk('2026-11-28T12:00:00',null),d=w.document;await sleep(400);
  const t=d.querySelector('[data-tab=history]');if(t){t.click();await sleep(20);
   ok(/No workouts logged yet\./.test(d.querySelector('#main').textContent),'empty storage: "No workouts logged yet."')}
  else ok(true,'empty storage: onboarding shown (no tab bar yet)');
  done('empty',w)}
 {const w=mk('2026-11-28T12:00:00',{profile:prof(),sessions:{}}),d=w.document;await sleep(400);await openHist(d);
  ok(/No workouts logged yet\./.test(d.querySelector('#main').textContent)&&!d.querySelector('.hcal'),'profile with no sessions: empty state, no calendar');
  done('nosess',w)}

 // 2. one session on the 31st of the previous month; month boundaries and blanks
 {const w=mk('2026-11-28T12:00:00',{profile:prof(),sessions:{'2026-10-31_legsA':S('2026-10-31','legsA',{'Back squat':[{w:225,r:5}]})}}),d=w.document;await sleep(400);await openHist(d);
  ok(/October 2026/.test(title(d)),'only session on Oct 31 -> opens October');
  ok(d.querySelectorAll('.hcg [data-hd]').length===31&&d.querySelector('[data-hd="2026-10-31"] .hdots i'),'October has 31 days and the 31st has a dot');
  ok(blanks(d)===new Date(2026,9,1).getDay(),'October blanks = weekday of Oct 1 ('+new Date(2026,9,1).getDay()+')');
  ok(d.querySelector('[data-hm="-1"]').disabled&&!d.querySelector('[data-hm="1"]').disabled,'prev disabled at first month, next enabled');
  ok(/Workouts 1\b/.test(tiles(d).Workouts)&&/Longest streak 1 day in a row/.test(tiles(d)['Longest streak'])&&/PRs 0\b/.test(tiles(d).PRs),'one session: 1 workout, streak "1 day in a row", 0 PRs');
  d.querySelector('[data-hm="1"]').click();await sleep(10);
  ok(/November 2026/.test(title(d))&&/No workouts this month\./.test(d.querySelector('#hlist').textContent)&&/Workouts 0\b/.test(tiles(d).Workouts),'empty current month: "No workouts this month.", Workouts 0');
  ok(blanks(d)===0&&d.querySelectorAll('.hcg [data-hd]').length===30,'November 2026 starts on Sunday (0 blanks), 30 days');
  ok(d.querySelector('[data-hm="1"]').disabled,'cannot go past the current month');
  done('oct31',w)}

 // 3. Dec -> Jan year change, streak inside a month only
 {const ses={'2026-12-30_pushA':S('2026-12-30','pushA',{'Bench press':[{w:135,r:8}]}),'2026-12-31_pullA':S('2026-12-31','pullA',{'Barbell row':[{w:135,r:8}]}),
   '2027-01-01_legsA':S('2027-01-01','legsA',{'Back squat':[{w:185,r:5}]}),'2027-01-02_pushB':S('2027-01-02','pushB',{'Bench press':[{w:145,r:8}]})};
  const w=mk('2027-01-05T12:00:00',{profile:prof(),sessions:ses}),d=w.document;await sleep(400);await openHist(d);
  ok(/January 2027/.test(title(d)),'2027-01-05 opens January 2027');
  ok(/Longest streak 2 days in a row/.test(tiles(d)['Longest streak']),'Jan streak is 2 (does not count Dec 30-31)');
  ok(/PRs 1\b/.test(tiles(d).PRs),'Jan 2 bench beats Dec 30 bench -> 1 PR across the year change');
  d.querySelector('[data-hm="-1"]').click();await sleep(10);
  ok(/December 2026/.test(title(d))&&d.querySelector('[data-hd="2026-12-31"] .hdots i')&&d.querySelectorAll('.hcg [data-hd]').length===31,'prev goes to December 2026 with the 31st marked');
  ok(/Longest streak 2 days in a row/.test(tiles(d)['Longest streak'])&&d.querySelector('[data-hm="-1"]').disabled,'December streak 2, prev disabled');
  d.querySelector('[data-hm="1"]').click();await sleep(10);
  ok(/January 2027/.test(title(d)),'next goes back to January 2027');
  done('yearchange',w);
  const w2=mk('2027-01-05T12:00:00',{profile:prof(),sessions:{'2026-12-31_pullA':ses['2026-12-31_pullA']}}),d2=w2.document;await sleep(400);await openHist(d2);
  ok(/December 2026/.test(title(d2)),'January with no workouts opens December 2026');
  done('yearchange2',w2)}

 // 4. leap year
 {const w=mk('2028-03-10T12:00:00',{profile:prof({start:'2028-01-03'}),sessions:{'2028-02-29_pushA':S('2028-02-29','pushA',{'Bench press':[{w:135,r:8}]})}}),d=w.document;await sleep(400);await openHist(d);
  ok(/February 2028/.test(title(d))&&d.querySelectorAll('.hcg [data-hd]').length===29&&d.querySelector('[data-hd="2028-02-29"] .hdots i'),'Feb 2028 has 29 days and Feb 29 is marked');
  ok(blanks(d)===new Date(2028,1,1).getDay(),'Feb 2028 blanks match weekday of Feb 1');
  ok(/Tue, Feb 29/.test(d.querySelector('[data-hd="2028-02-29"]').getAttribute('aria-label')),'aria-label "Tue, Feb 29 ..."');
  done('leap',w)}

 // 5. kg, bodyweight sets, live session with no sets, several sessions on one day, old-format data
 {const ses={
   '2026-11-20_pushA':S('2026-11-20','pushA',{'Bench press':[{w:60,r:8},{w:60,r:8}],'Push-up':[{w:0,r:20},{w:0,r:15}]}),
   '2026-11-21_pullA':S('2026-11-21','pullA',{'Pull-up':[{w:0,r:8}]}),
   '2026-11-21_legsA':S('2026-11-21','legsA',{'Back squat':[{w:100,r:5}]}),
   '2026-11-21_pushB':S('2026-11-21','pushB',{'Dips':[{w:0,r:10}]}),
   // old format: no updated, string numbers, no dn
   '2026-11-10_pullB':{date:'2026-11-10',s:'pullB',ex:{'Barbell row':[{w:'70',r:'8'}]}},
   '2026-11-28_legsB':S('2026-11-28','legsB',{},{live:true,start:new Date('2026-11-28T11:40:00').getTime()})};
  const w=mk('2026-11-28T12:00:00',{profile:prof({unit:'kg'}),sessions:ses}),d=w.document;await sleep(400);const b=JSON.stringify(stored(w));await openHist(d);
  const t=tiles(d);console.log('kg summary:',JSON.stringify(t));
  ok(/ kg/.test(t.Volume)&&!/lb/.test(d.querySelector('#hlist').textContent),'kg: Volume and card meta in kg, no "lb"');
  ok(/2,020 kg/.test(t.Volume),'Volume 2,020 kg: BW sets count 0, string weights from old data count (60*16+100*5+70*8)');
  ok(/Workouts 6\b/.test(t.Workouts),'Workouts 6 (includes live session with no sets)');
  const live=cardOf(d,'2026-11-28_legsB');ok(live&&/In progress/.test(live.textContent)&&/0 sets/.test(live.querySelector('.meta').textContent),'live session with no sets: "In progress", 0 sets');
  live.querySelector('[data-hx]').click();await sleep(10);ok(/No sets logged yet\./.test(live.querySelector('.wbody').textContent),'live empty card body says "No sets logged yet."');
  const pu=cardOf(d,'2026-11-20_pushA');pu.querySelector('[data-hx]').click();await sleep(10);
  ok(/BW × 20/.test(pu.textContent)&&/60 × 8/.test(pu.textContent),'bodyweight sets show "BW × 20", weighted "60 × 8"');
  const c21=d.querySelector('[data-hd="2026-11-21"]');
  ok(c21.querySelectorAll('.hdots i').length===2,'3 sessions on one day -> at most 2 dots');
  ok(/Push B and Legs A and Pull A logged|Pull A and Legs A and Push B logged|(Pull A|Legs A|Push B) and (Pull A|Legs A|Push B) and (Pull A|Legs A|Push B) logged/.test(c21.getAttribute('aria-label')),'aria-label lists all sessions of the day');
  c21.click();await sleep(10);
  const op=cards(d).filter(c=>c.classList.contains('open')).map(c=>c.dataset.hid).sort().join();
  ok(op==='2026-11-21_legsA,2026-11-21_pullA,2026-11-21_pushB','tapping a day with 3 sessions opens all 3 and collapses the rest');
  ok(cardOf(d,'2026-11-10_pullB')&&/70 × 8/.test(cardOf(d,'2026-11-10_pullB').textContent),'old-format session (no updated, string numbers) renders');
  ok(JSON.stringify(stored(w))===b,'kg instance: sessions unchanged');
  done('kg',w)}

 // 6. custom program with non-PPL keys and colours
 {const program={name:'My split',periodize:false,days:[
    {k:'up1',n:'Upper heavy',c:'#2a63d4',ex:[{n:'Bench press',sets:3,reps:'5'}]},
    {k:'lo1',n:'Lower',c:'#E0A800',ex:[{n:'Back squat',sets:3,reps:'5'}]},
    {k:'arm',n:'Arms & abs',c:'#8a4fd6',ex:[{n:'Barbell curl',sets:3,reps:'10'}]}]};
  const ses={'2026-11-23_up1':S('2026-11-23','up1',{'Bench press':[{w:135,r:5}]},{dn:'Upper heavy'}),
   '2026-11-24_lo1':S('2026-11-24','lo1',{'Back squat':[{w:185,r:5}]},{dn:'Lower'}),
   '2026-11-25_arm':S('2026-11-25','arm',{'Barbell curl':[{w:65,r:10}]},{dn:'Arms & abs'}),
   '2026-11-26_gone':S('2026-11-26','gone',{'Deadlift':[{w:225,r:5}]})}; // day removed from program, unknown key
  const w=mk('2026-11-28T12:00:00',{profile:prof({program}),sessions:ses}),d=w.document;await sleep(400);await openHist(d);
  ok(d.querySelector('[data-hd="2026-11-25"] .hdots i').getAttribute('style').includes('#8a4fd6'),'custom colour used for the dot');
  ok(/#8a919c/.test(d.querySelector('[data-hd="2026-11-26"] .hdots i').getAttribute('style')),'unknown day key falls back to grey');
  ok(/Arms &amp; abs|Arms & abs/.test(cardOf(d,'2026-11-25_arm').querySelector('.wnm').textContent),'custom day name shown');
  d.querySelector('[data-hf="pull"]').click();await sleep(10);
  ok(cards(d).map(c=>c.dataset.hid).join()==='2026-11-23_up1','Pull chip shows the blue custom day');
  d.querySelector('[data-hf="legs"]').click();await sleep(10);
  ok(cards(d).map(c=>c.dataset.hid).join()==='2026-11-24_lo1','Legs chip matches upper-case #E0A800');
  d.querySelector('[data-hf="push"]').click();await sleep(10);
  ok(/No workouts match\./.test(d.querySelector('#hlist').textContent),'Push chip: no red days -> "No workouts match."');
  d.querySelector('[data-hd="2026-11-25"]').click();await sleep(10);
  ok(d.querySelector('[data-hf="all"]').getAttribute('aria-pressed')==='true'&&cardOf(d,'2026-11-25_arm').classList.contains('open'),'tapping an "other" day under the Push filter resets to All and opens it');
  ok(d.querySelector('.hmixl')&&/Other 2/.test(d.querySelector('.hmixl').textContent),'mix legend counts 2 Other');
  done('custom',w)}

 // 7. XSS / special characters in names and search
 {const bad='<img src=x onerror="window.__x=1">',bad2='Curl (EZ) .* [a] \\ "q" & \'s\'';
  const ses={'2026-11-20_pushA':S('2026-11-20','pushA',{[bad]:[{w:'<b>9</b>',r:'5"><i id=pw3>',e:'8<u id=pw4>'}],[bad2]:[{w:50,r:10}]},{dn:'"><b id=pw>Day</b>'}),
   '2026-11-21_pullA':S('2026-11-21','pullA',{'Barbell row':[{w:135,r:8}]})};
  const w=mk('2026-11-28T12:00:00',{profile:prof(),sessions:ses}),d=w.document;await sleep(400);await openHist(d);
  const c=cardOf(d,'2026-11-20_pushA');c.querySelector('[data-hx]').click();await sleep(10);
  d.querySelector('[data-hd="2026-11-20"]').click();await sleep(10);
  ok(!d.querySelector('#main img[src="x"]')&&!d.querySelector('#pw')&&!d.querySelector('#pw3')&&!d.querySelector('#pw4')&&!w.__x,'HTML in exercise/day names and set values is escaped (calendar, card, day line)');
  ok(c.textContent.includes(bad)&&c.textContent.includes('"><b id=pw>Day</b>'),'names show as literal text');
  const q=d.querySelector('#hq');q.focus();
  for(const [s,n] of [['.*',1],['(ez)',1],['[a]',1],['\\',1],['"q"',1],["'s'",1],['<img',1],['&',1],['   row  ',1],['$^',0]]){
   q.value=s;q.dispatchEvent(new w.Event('input',{bubbles:true}));await sleep(5);
   ok(cards(d).length===n&&d.activeElement===q,`search ${JSON.stringify(s)} -> ${n} result(s), no regex, focus kept`)}
  q.value='"><img src=y onerror=window.__y=1>';q.dispatchEvent(new w.Event('input',{bubbles:true}));await sleep(5);
  d.querySelector('[data-hf="all"]').click();await sleep(10); // re-render with q in value attribute
  ok(!w.__y&&!d.querySelector('img[src="y"]')&&d.querySelector('#hq').value.startsWith('"><img'),'search text is escaped in the re-rendered value attribute');
  done('xss',w)}

 // 8. filter + day select + search interplay, Open, Delete, Home tile entry
 {const ses={'2026-10-15_pushA':S('2026-10-15','pushA',{'Bench press':[{w:135,r:8}]}),
   '2026-11-02_pushA':S('2026-11-02','pushA',{'Bench press':[{w:135,r:8}]}),
   '2026-11-04_pullA':S('2026-11-04','pullA',{'Barbell row':[{w:135,r:8}]}),
   '2026-11-06_legsA':S('2026-11-06','legsA',{'Back squat':[{w:185,r:5}]})};
  const w=mk('2026-11-28T12:00:00',{profile:prof(),sessions:ses}),d=w.document;await sleep(400);await openHist(d);
  d.querySelector('[data-hf="pull"]').click();await sleep(10);
  d.querySelector('[data-hd="2026-11-04"]').click();await sleep(10);
  ok(d.querySelector('[data-hf="pull"]').getAttribute('aria-pressed')==='true'&&cardOf(d,'2026-11-04_pullA').classList.contains('open'),'Pull filter + Pull day: filter kept, card opened');
  d.querySelector('[data-hd="2026-11-02"]').click();await sleep(10);
  ok(d.querySelector('[data-hf="all"]').getAttribute('aria-pressed')==='true'&&cardOf(d,'2026-11-02_pushA').classList.contains('open')&&!cardOf(d,'2026-11-04_pullA').classList.contains('open'),'Pull filter + Push day: filter cleared, only 11-02 open');
  const q=d.querySelector('#hq');q.value='row';q.dispatchEvent(new w.Event('input',{bubbles:true}));await sleep(5);
  d.querySelector('[data-hd="2026-11-06"]').click();await sleep(10);
  ok(d.querySelector('#hq').value===''&&cardOf(d,'2026-11-06_legsA')&&cardOf(d,'2026-11-06_legsA').classList.contains('open'),'search + day tap: search cleared, day card open');
  d.querySelector('[data-hd="2026-11-29"]').click();await sleep(10);
  ok(d.querySelector('[data-hd="2026-11-06"]').classList.contains('on'),'disabled future day tap is ignored');
  // Open on a past session, then come back
  d.querySelector('[data-hm="-1"]').click();await sleep(10);
  cardOf(d,'2026-10-15_pushA').querySelector('[data-hx]').click();await sleep(10);
  cardOf(d,'2026-10-15_pushA').querySelector('[data-open]').click();await sleep(20);
  ok(d.querySelector('#wdate')&&d.querySelector('#wdate').value==='2026-10-15','Open on Oct 15 card goes to the Workout tab on 2026-10-15');
  await openHist(d);ok(/November 2026/.test(title(d)),'back to History via tab bar: November again');
  // Home tile entry should also reset (PR says "Reopening the tab resets the view")
  d.querySelector('[data-hm="-1"]').click();await sleep(10);d.querySelector('[data-hf="push"]').click();await sleep(10);
  d.querySelector('[data-tab=home]').click();await sleep(20);
  const tile=d.querySelector('#main [data-gotab="history"]');
  if(tile){tile.click();await sleep(20);ok(/November 2026/.test(title(d))&&d.querySelector('[data-hf="all"]').getAttribute('aria-pressed')==='true','Home "History" tile opens a reset view (November, All)')}
  // Delete: arm one card, then arm another; delete the only October session; delete everything
  await openHist(d);
  cardOf(d,'2026-11-02_pushA').querySelector('[data-del]').click();await sleep(10);
  cardOf(d,'2026-11-04_pullA').querySelector('[data-del]').click();await sleep(10);
  ok(stored(w)['2026-11-02_pushA']&&stored(w)['2026-11-04_pullA']&&/Confirm/.test(cardOf(d,'2026-11-04_pullA').querySelector('[data-del]').textContent)&&/Delete/.test(cardOf(d,'2026-11-02_pushA').querySelector('[data-del]').textContent),'arming a second card disarms the first, nothing deleted');
  d.querySelector('[data-hm="-1"]').click();await sleep(10);
  let del=cardOf(d,'2026-10-15_pushA').querySelector('[data-del]');del.click();await sleep(10);cardOf(d,'2026-10-15_pushA').querySelector('[data-del]').click();await sleep(20);
  ok(!stored(w)['2026-10-15_pushA']&&d.querySelector('.hcal')&&!w.__e.length,'deleting the only October session keeps the tab working');
  ok(/No workouts this month\./.test(d.querySelector('#hlist').textContent),'October then shows "No workouts this month."');
  d.querySelector('[data-hm="1"]').click();await sleep(10);
  for(const id of ['2026-11-02_pushA','2026-11-04_pullA','2026-11-06_legsA']){cardOf(d,id).querySelector('[data-del]').click();await sleep(5);cardOf(d,id).querySelector('[data-del]').click();await sleep(20)}
  ok(/No workouts logged yet\./.test(d.querySelector('#main').textContent)&&!Object.keys(stored(w)).length,'deleting every session shows the empty state');
  done('flows',w)}

 // 9. swipe direction matches openCal (finger left = next month)
 {const src=html;const hs=src.slice(src.indexOf('/* ---------- history tab ---------- */'),src.indexOf('/* ---------- end history tab ---------- */'));
  const oc=src.slice(src.indexOf('function openCal('));
  ok(/dx<0\?1:-1/.test(hs)&&/data-m="\$\{dx<0\?1:-1\}"/.test(oc),'both openCal and History map dx<0 (finger moves left) to +1 (next month)');
  const ses={'2026-09-15_pushA':S('2026-09-15','pushA',{'Bench press':[{w:135,r:8}]}),'2026-11-02_pushA':S('2026-11-02','pushA',{'Bench press':[{w:135,r:8}]})};
  const w=mk('2026-11-28T12:00:00',{profile:prof(),sessions:ses}),d=w.document;await sleep(400);await openHist(d);
  const sw=(x0,x1,sel)=>{const el=d.querySelector(sel||'.hcgw');el.dispatchEvent(new w.MouseEvent('pointerdown',{clientX:x0,clientY:100,bubbles:true}));el.dispatchEvent(new w.MouseEvent('pointerup',{clientX:x1,clientY:100,bubbles:true}))};
  sw(100,300);await sleep(10);sw(100,300);await sleep(10);ok(/September/.test(title(d)),'two right swipes: November -> September (through an empty October)');
  sw(300,100,'[data-hd="2026-09-10"]');await sleep(10);ok(/October/.test(title(d))&&!d.querySelector('.hday.on'),'left swipe starting on a day button: next month, no day selected');
  sw(300,100,'.hsum');await sleep(10);ok(/October/.test(title(d)),'swipe outside the grid does nothing');
  done('swipe',w)}

 // 10. performance: 2 years of history plus 120 sessions in November, 20 sets and long names
 {const ses={},LONG='Single-arm half-kneeling landmine press with a very long name that keeps going';let n=0;
  for(let i=0;i<730;i++){const dt=new Date(2024,10,28+i);const v=`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;if(v>'2026-11-28')break;
   const k=['pushA','pullA','legsA','pushB','pullB','legsB'][i%6];ses[v+'_'+k]=S(v,k,{'Bench press':[{w:100+i%50,r:8}],[LONG]:Array.from({length:20},(_,j)=>({w:20+j,r:10,e:7}))});n++}
  for(let i=0;i<120;i++){const v=`2026-11-${String(1+i%28).padStart(2,'0')}`;ses[v+'_x'+i]=S(v,'pushA',{'Bench press':[{w:135,r:8}]})}
  const w=mk('2026-11-28T12:00:00',{profile:prof({start:'2024-11-25'}),sessions:ses}),d=w.document;await sleep(800);
  let t0=Date.now();await openHist(d);const tOpen=Date.now()-t0;
  ok(cards(d).length>=120,`November with ${cards(d).length} cards renders`);
  const q=d.querySelector('#hq');q.focus();t0=Date.now();q.value='bench';q.dispatchEvent(new w.Event('input',{bubbles:true}));const tQ=Date.now()-t0;
  t0=Date.now();d.querySelector('[data-hd="2026-11-14"]').click();const tDay=Date.now()-t0;
  t0=Date.now();d.querySelector('[data-hm="-1"]').click();const tM=Date.now()-t0;
  console.log(`perf (${Object.keys(ses).length} sessions): open ${tOpen}ms, search ${tQ}ms (${d.querySelectorAll('#main .hist').length} cards), day tap ${tDay}ms, month ${tM}ms`);
  ok(tOpen<3000&&tM<3000&&tDay<3000,'open / month change / day tap under 3 s in jsdom');
  ok(tQ<3000,'one search keystroke under 3 s in jsdom');
  done('perf',w)}

 // 11. other tabs still render without errors after visiting History (Body uses .hist too)
 {const ses={'2026-11-24_pushB':S('2026-11-24','pushB',{'Bench press':[{w:155,r:8,e:8}]})};
  const w=mk('2026-11-28T12:00:00',{profile:prof({pain:{shoulder:{lvl:3,date:'2026-11-27'}}}),sessions:ses}),d=w.document;await sleep(400);await openHist(d);
  for(const t of ['home','today','program','progress','settings','history','home']){const b=d.querySelector(`[data-tab=${t}]`);if(b){b.click();await sleep(20)}}
  const body=d.querySelector('#main [data-gotab="body"]');if(body){body.click();await sleep(30)}
  ok(!w.__e.length&&d.querySelector('#main').innerHTML.length>50,'all tabs (incl. Body) render after History with no errors');
  done('tabs',w)}

 ok(!allErr.length,'no page errors in any instance '+JSON.stringify(allErr));
 process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
