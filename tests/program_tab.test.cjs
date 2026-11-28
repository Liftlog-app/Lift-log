// Program tab: progress ring, 15-week timeline, week preview with change chips, tap-to-swap, reorder, editor.
const {JSDOM}=require('jsdom');
const html=require('fs').readFileSync(require('path').join(__dirname,'..','src','index.html'),'utf8');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function make(seed){const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',beforeParse(w){const RD=w.Date;class FD extends RD{constructor(...a){if(a.length)super(...a);else super(FD.now())}static now(){return w.__now||new RD('2026-11-28T12:00:00').getTime()}};w.Date=FD;w.ResizeObserver=class{observe(){}disconnect(){}};if(seed)w.localStorage.setItem('liftlog.v1',JSON.stringify(seed));w.__errs=[];w.addEventListener('error',e=>w.__errs.push(e.message))}});return dom.window}
const ev=(w,el,t)=>el.dispatchEvent(new w.Event(t,{bubbles:true}));
const must=(ok,msg)=>{if(!ok)throw new Error('FAIL: '+msg);console.log('ok:',msg)};
const store=w=>JSON.parse(w.localStorage.getItem('liftlog.v1'));
const txt=el=>(el?el.textContent:'').replace(/\s+/g,' ').trim();
const firstRow=d=>d.querySelector('.pday[data-pday="0"] .prow');

// Seed: PPL plan started Sat 2026-11-14. Weeks 1 and 2 complete (all six days), plus Push A today (week 3).
const ORDER=['pushA','pullA','legsA','pushB','pullB','legsB'];
const sessions={};let n=0;
for(const [ws,wk] of [['2026-11-14',1],['2026-11-21',2]])ORDER.forEach((k,i)=>{const dt=new Date(ws+'T00:00');dt.setDate(dt.getDate()+i);const date=dt.toISOString().slice(0,10);
  sessions[`${date}_${k}`]={date,s:k,ex:{'Bench press':[{w:135,r:8,e:8}]},updated:++n,dur:50}});
sessions['2026-11-28_pushA']={date:'2026-11-28',s:'pushA',ex:{'Bench press':[{w:145,r:8,e:8}]},updated:++n,dur:55};

(async()=>{
 let w=make({profile:{start:'2026-11-14',unit:'lb',swaps:{}},sessions}),d=w.document;await sleep(100);
 const before=JSON.stringify(store(w).sessions);
 d.querySelector('[data-tab=program]').click();await sleep(20);

 // 1. ring
 const ring=d.querySelector('.pring');
 must(ring&&txt(ring)==='Wk 3/15','ring centre reads Wk 3/15 ('+txt(ring)+')');
 must(/Week 3 of 15/.test(ring.getAttribute('aria-label')),'ring aria-label: '+ring.getAttribute('aria-label'));
 must(ring.getAttribute('data-pct')==='14','ring fill is 14% (data-pct='+ring.getAttribute('data-pct')+')');
 const f=d.querySelector('.pring .prf'),C=+f.getAttribute('stroke-dasharray'),off=+f.getAttribute('stroke-dashoffset');
 must(Math.abs((1-off/C)-(2+1/6)/15)<0.002,'stroke-dashoffset matches (2 + 1/6) / 15');

 // 2. timeline
 must(d.querySelectorAll('[data-ptl]').length===15,'15 timeline buttons');
 const t3=d.querySelector('[data-ptl="3"]');
 must(t3.classList.contains('now')&&t3.getAttribute('aria-pressed')==='true'&&t3.classList.contains('sel'),'week 3 is now + selected');
 must([5,10,15].every(k=>/Deload|Test/.test(d.querySelector(`[data-ptl="${k}"]`).textContent)),'deload/test markers on 5, 10, 15');

 // 3. preview
 must(d.querySelectorAll('.pday[data-pday]').length===6,'6 preview day cards');
 let r0=firstRow(d);
 must(txt(r0.querySelector('.pxn'))==='Bench press'&&/RPE 8\b/.test(txt(r0)),'Push A row 0 is Bench press, RPE 8: '+txt(r0));
 must([...r0.querySelectorAll('.pchg')].some(c=>c.textContent.includes('RPE 8 → 9')),'change chip RPE 8 → 9');
 must(/Week 3 · Hypertrophy/.test(txt(d.querySelector('.pwh h2'))),'heading: '+txt(d.querySelector('.pwh h2')));
 must([...d.querySelectorAll('.pday[data-pday] .prow')].every(r=>r.querySelector('.pth img, .pth svg')),'every preview row has a thumbnail');

 // 4. deload week 5
 d.querySelector('[data-ptl="5"]').click();await sleep(20);
 const t5=d.querySelector('[data-ptl="5"]');
 must(t5.classList.contains('sel')&&t5.getAttribute('aria-pressed')==='true'&&d.querySelector('[data-ptl="3"]').getAttribute('aria-pressed')==='false','week 5 selected');
 must(d.querySelector('[data-ptl="3"]').classList.contains('now'),'week 3 still outlined as now');
 const w4=w.pplPlan(4,'pushA');
 const rows5=[...d.querySelectorAll('.pday[data-pday="0"] .prow')];
 must(rows5.every((r,i)=>txt(r.querySelector('.pxs')).startsWith(Math.ceil(w4[i].sets/2)+' × ')),'deload rows have half the week-4 sets (rounded up)');
 r0=firstRow(d);must(/RPE 6\b/.test(txt(r0))&&/Deload/.test(txt(r0.querySelector('.pnote'))),'deload row: '+txt(r0));
 must(txt(d.querySelector('.pban'))==='Next week: Strength block','banner: '+txt(d.querySelector('.pban')));
 must(/deload/.test(txt(d.querySelector('.pwh h2'))),'heading mentions deload');

 // 5. peak week 11
 d.querySelector('[data-ptl="11"]').click();await sleep(20);
 const p11=w.pplPlan(11,'pushA')[0];r0=firstRow(d);
 must(txt(r0.querySelector('.pxn'))===p11.n&&txt(r0.querySelector('.pxs'))==='4 × 4 · RPE 8'&&txt(r0).includes('~85% of 1RM'),'week 11 row: '+txt(r0));
 must(`${p11.sets} × ${p11.reps} · RPE ${p11.rpe}`==='4 × 4 · RPE 8','matches pplPlan(11)');
 // selection survives an unrelated re-render (e.g. open + close a swap panel)
 r0.querySelector('[data-pswap]').click();await sleep(10);d.querySelector('[data-pswcancel]').click();await sleep(10);
 must(d.querySelector('[data-ptl="11"]').classList.contains('sel'),'selected week survives re-render');
 // reopening the tab resets to the current week
 d.querySelector('[data-tab=home]').click();await sleep(10);d.querySelector('[data-tab=program]').click();await sleep(10);
 must(d.querySelector('[data-ptl="3"]').classList.contains('sel'),'reopening the tab selects the current week');

 // 6. swap on PPL
 const prog0=JSON.stringify(store(w).profile.program);
 firstRow(d).querySelector('[data-pswap="0.0"]').click();await sleep(10);
 must(!!d.querySelector('.pswp .cmp'),'swap panel opens with photo compare');
 d.querySelector('[data-pdd]').click();await sleep(10);
 const opts=[...d.querySelectorAll('[data-pddpick]')];must(opts.length>1&&opts.every(o=>o.querySelector('img,svg')),'alternatives listed with photos');
 const pick=opts[1].dataset.pddpick;opts[1].click();await sleep(10);
 must(txt(d.querySelector('.pswp .cmp figure:last-child figcaption'))==='New: '+pick,'picked shows in compare');
 d.querySelector('[data-pswgo]').click();await sleep(20);
 let st=store(w);
 must(st.profile.swaps['pushA|Bench press']===pick,'swaps[pushA|Bench press] = '+pick);
 // the seed has no stored program (default PPL); putProfile stores that default, same as the Workout tab swap
 must((prog0===undefined||JSON.stringify(st.profile.program)===prog0)&&st.profile.program.ppl===true&&st.profile.program.days[0].ex[0].n==='Bench press','program unchanged (Bench press still the base lift) and still ppl');
 must(txt(firstRow(d).querySelector('.pxn'))===pick,'preview shows the new name');
 d.querySelector('[data-tab=today]').click();await sleep(20);
 if(!d.querySelector('.card[data-card] h3'))d.querySelector('[data-s=pushA]').click(),await sleep(20);
 must(txt(d.querySelector('.card[data-card] h3'))===pick,'Workout tab Push A first card shows '+pick+' ('+txt(d.querySelector('.card[data-card] h3'))+')');
 d.querySelector('[data-tab=program]').click();await sleep(10);
 firstRow(d).querySelector('[data-pswap="0.0"]').click();await sleep(10);
 must(txt(d.querySelector('[data-pswreset]'))==='Back to Bench press','Back to Bench press button');
 d.querySelector('[data-pswreset]').click();await sleep(20);
 must(!('pushA|Bench press' in store(w).profile.swaps),'Back to Bench press removes the key');
 // week 11 main lift swaps under its own base name
 d.querySelector('[data-ptl="11"]').click();await sleep(10);
 const pl=[...d.querySelectorAll('.pday[data-pday="2"] .prow')][0];must(txt(pl.querySelector('.pxn'))==='Back squat','legsA week 11 row 0 is Back squat');
 pl.querySelector('[data-pswap]').click();await sleep(10);d.querySelector('[data-pswgo]').click();await sleep(20);
 const sq=store(w).profile.swaps['legsA|Back squat'];must(!!sq&&sq!=='Back squat','week 11 swap saved under legsA|Back squat: '+sq);
 d.querySelector('.pday[data-pday="2"] [data-pswap="2.0"]').click();await sleep(10);d.querySelector('[data-pswreset]').click();await sleep(20);
 must(!('legsA|Back squat' in store(w).profile.swaps),'week 11 swap reset');
 // week 15 banner + new cycle
 d.querySelector('[data-ptl="15"]').click();await sleep(10);
 must(txt(d.querySelector('.pban'))==='Next week: New cycle','week 15 banner: New cycle');
 d.querySelector('[data-ptl="4"]').click();await sleep(10);must(txt(d.querySelector('.pban'))==='Next week: Deload','week 4 banner: Deload');
 d.querySelector('[data-ptl="10"]').click();await sleep(10);must(txt(d.querySelector('.pban'))==='Next week: Peak block','week 10 banner: Peak block');
 must(/New lift next week Barbell row/.test(txt(d.querySelector('.pday[data-pday="4"] .pnewl'))),'week 10 Pull B: Barbell row is a new lift next week');
 must([...d.querySelectorAll('.pday[data-pday="4"] .pchg')].some(c=>c.textContent==='Not in next week'),'week 10 Pull B: a lift marked Not in next week');
 d.querySelector('[data-ptl="2"]').click();await sleep(10);must(!d.querySelector('.pban'),'no banner when next week is same phase');
 must(JSON.stringify(store(w).sessions)===before,'PPL instance: sessions unchanged');

 // CSS: tap targets and reduced motion
 const rules=[];const walk=list=>{for(const r of list){if(r.cssRules&&!r.selectorText)walk(r.cssRules);else if(r.selectorText)rules.push(r)}};
 for(const s of d.styleSheets)walk(s.cssRules);
 const px=(sel,prop)=>Math.max(0,...rules.filter(r=>r.selectorText.split(',').some(x=>x.trim()===sel)).map(r=>parseFloat(r.style.getPropertyValue(prop))||0));
 must(px('[data-ptl]','min-height')>=44,'[data-ptl] min-height >= 44');
 for(const s of ['[data-pswap]','[data-pup]','[data-pdown]'])must(px(s,'min-height')>=44&&px(s,'min-width')>=44,s+' min-height/min-width >= 44');
 must([...d.querySelectorAll('style')].some(s=>/prefers-reduced-motion:\s*reduce\)\{[^}]*\.pweek[^}]*\.pswp[^}]*animation:none/.test(s.textContent)),'reduced-motion rule disables the new animations');
 console.log('errors1',w.__errs);

 // ---- custom Full Body plan (not periodized)
 w=make({profile:null,sessions:{}});d=w.document;await sleep(100);
 d.querySelector('[data-tab=today]').click();await sleep(10);d.querySelector('[data-pick=fb]').click();await sleep(10);d.querySelector('#go').click();await sleep(50);
 const before2=JSON.stringify(store(w).sessions);
 d.querySelector('[data-tab=program]').click();await sleep(20);
 must(!d.querySelector('.pring')&&!d.querySelector('[data-ptl]'),'non-periodized plan: no ring, no timeline');
 must(d.querySelectorAll('.pday[data-pday]').length===3&&txt(firstRow(d).querySelector('.pxs'))==='3 × 5–8','non-periodized day cards with plain sets × reps: '+txt(firstRow(d)));
 must(!d.querySelector('.pchg')&&!d.querySelector('.pban'),'non-periodized: no change chips or banner');
 firstRow(d).querySelector('[data-pswap="0.0"]').click();await sleep(10);
 d.querySelector('[data-pdd]').click();await sleep(10);const cp=d.querySelectorAll('[data-pddpick]')[1].dataset.pddpick;d.querySelectorAll('[data-pddpick]')[1].click();await sleep(10);
 d.querySelector('[data-pswgo]').click();await sleep(20);
 must(store(w).profile.program.days[0].ex[0].n===cp,'custom swap renames days[0].ex[0] to '+cp);
 // reorder
 const e0=store(w).profile.program.days[0].ex.map(e=>e.n);
 d.querySelector('[data-pdown="0.0"]').click();await sleep(20);
 let e1=store(w).profile.program.days[0].ex.map(e=>e.n);must(e1[0]===e0[1]&&e1[1]===e0[0],'Move down swaps ex[0] and ex[1]');
 d.querySelector('[data-pup="0.1"]').click();await sleep(20);
 e1=store(w).profile.program.days[0].ex.map(e=>e.n);must(JSON.stringify(e1)===JSON.stringify(e0),'Move up swaps them back');
 const downs=[...d.querySelectorAll('.pedit')][0].querySelectorAll('[data-pdown]');
 must(downs[downs.length-1].disabled&&!downs[0].disabled,'last row Move down is disabled');
 must(d.querySelector('[data-pup="0.0"]').disabled,'first row Move up is disabled');
 must([...d.querySelectorAll('.pxrow')].every(r=>r.querySelector('.pth img, .pth svg')),'editor rows have thumbnails');
 // editor still works
 const cnt=store(w).profile.program.days[0].ex.length;
 d.querySelector('[data-padd="0"]').click();await sleep(20);
 must(store(w).profile.program.days[0].ex.length===cnt+1,'data-padd adds an exercise');
 const nm=[...d.querySelectorAll('[data-pf=n]')].find(i=>i.value==='New exercise');nm.value='Face pull';ev(w,nm,'change');await sleep(20);
 must(store(w).profile.program.days[0].ex[cnt].n==='Face pull','data-pf=n edits the name');
 const sets=d.querySelector(`[data-pe="0.${cnt}"][data-pf=sets]`);sets.value='4';ev(w,sets,'change');await sleep(10);
 must(store(w).profile.program.days[0].ex[cnt].sets===4,'data-pf=sets edits sets');
 nm.blur&&nm.blur();sets.blur&&sets.blur();await sleep(20);
 d.querySelector('[data-pdayadd]').click();await sleep(20);
 must(store(w).profile.program.days.length===4,'data-pdayadd adds a day');
 d.querySelector('[data-pdel="3"]').click();await sleep(10);
 must(store(w).profile.program.days.length===4&&txt(d.querySelector('[data-pdel="3"]'))==='Confirm','data-pdel first tap arms');
 d.querySelector('[data-pdel="3"]').click();await sleep(20);
 must(store(w).profile.program.days.length===3,'data-pdel second tap removes the day');
 const dn=d.querySelector('[data-pd="0"]');dn.value='Monday';ev(w,dn,'change');await sleep(10);
 must(store(w).profile.program.days[0].n==='Monday','data-pd renames the day');
 must(!!d.querySelector('#exlist option'),'#exlist datalist present');
 must(JSON.stringify(store(w).sessions)===before2,'custom instance: sessions unchanged');
 console.log('errors2',w.__errs);

 // ---- periodized custom plan (Upper / Lower with blocks): ring + timeline, periodize() rows
 w=make();d=w.document;await sleep(100);
 d.querySelector('[data-tab=today]').click();await sleep(10);d.querySelector('[data-pick=ul]').click();await sleep(10);
 d.querySelector('#sper').checked=true;ev(w,d.querySelector('#sper'),'change');d.querySelector('#go').click();await sleep(50);
 d.querySelector('[data-tab=program]').click();await sleep(20);
 must(!!d.querySelector('.pring')&&d.querySelectorAll('[data-ptl]').length===15,'periodized custom plan: ring and timeline');
 must(txt(d.querySelector('.pring'))==='Wk 1/15','periodized custom plan starts at week 1');
 d.querySelector('[data-ptl="11"]').click();await sleep(10);
 must(txt(firstRow(d).querySelector('.pxs'))==='4 × 4 · RPE 8'&&txt(firstRow(d)).includes('~85% of 1RM'),'periodize() week 11 row: '+txt(firstRow(d)));
 d.querySelector('[data-ptl="15"]').click();await sleep(10);
 must(d.querySelectorAll('.pday[data-pday="0"] .prow').length===1&&/Ramp up/.test(txt(firstRow(d))),'test week shows only the main lift');
 console.log('errors3',w.__errs);
 process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
