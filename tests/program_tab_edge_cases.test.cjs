// QA edge cases for the Program tab (PR B): every preset with and without blocks, switching program,
// empty days / empty program, many exercises, long names, bad numbers, kg, swaps (PPL + custom + back),
// editor actions, week 15 / later cycles, old-format data, state across re-renders, other tabs still work.
const {JSDOM}=require('jsdom');
const html=require('fs').readFileSync(require('path').join(__dirname,'..','src','index.html'),'utf8');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function make(seed,now){const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',beforeParse(w){const RD=w.Date;const T=new RD(now||'2026-11-28T12:00:00').getTime();class FD extends RD{constructor(...a){if(a.length)super(...a);else super(FD.now())}static now(){return w.__now||T}};w.Date=FD;w.ResizeObserver=class{observe(){}disconnect(){}};if(seed)w.localStorage.setItem('liftlog.v1',JSON.stringify(seed));w.__errs=[];w.addEventListener('error',e=>w.__errs.push(e.message));w.scrollTo=()=>{}}});return dom.window}
const ev=(w,el,t)=>el.dispatchEvent(new w.Event(t,{bubbles:true}));
const must=(ok,msg)=>{if(!ok)throw new Error('FAIL: '+msg);console.log('ok:',msg)};
const note=msg=>console.log('note:',msg);
const store=w=>JSON.parse(w.localStorage.getItem('liftlog.v1'));
const txt=el=>(el?el.textContent:'').replace(/\s+/g,' ').trim();
const tab=async(d,t)=>{d.querySelector(`[data-tab=${t}]`).click();await sleep(25)};
const rows=(d,di)=>[...d.querySelectorAll(`.pday[data-pday="${di}"] .prow`)];
const clean=(d,label)=>{const t=d.querySelector('#main').textContent;must(!/undefined|NaN|null|\[object/.test(t),label+': no undefined/NaN/null in the page text')};
const ORDER=['pushA','pullA','legsA','pushB','pullB','legsB'];
async function onboard(id,per){const w=make();const d=w.document;await sleep(100);await tab(d,'today');
  d.querySelector(`[data-pick=${id}]`).click();await sleep(10);const s=d.querySelector('#sper');if(per!=null&&!s.disabled){s.checked=per;ev(w,s,'change')}
  d.querySelector('#go').click();await sleep(50);return w}
const errs=[],bugs=[];

(async()=>{
 // ---------- 1. every preset, with and without 15-week blocks
 for(const id of ['ppl','ul','fb','bro','custom'])for(const per of [false,true]){
  if(id==='ppl'&&!per)continue;
  const w=await onboard(id,per),d=w.document,p=store(w).profile.program,isPer=!!(p.ppl||p.periodize);
  await tab(d,'program');
  must(d.querySelectorAll('.pday[data-pday]').length===p.days.length,`${id}${per?'+blocks':''}: ${p.days.length} preview cards`);
  must(!!d.querySelector('.pring')===isPer&&(d.querySelectorAll('[data-ptl]').length===(isPer?15:0)),`${id}${per?'+blocks':''}: ring/timeline only when periodized (${isPer})`);
  if(isPer){must(txt(d.querySelector('.pring'))==='Wk 1/15','ring Wk 1/15 for a brand-new user');
    for(let k=1;k<=15;k++){d.querySelector(`[data-ptl="${k}"]`).click();await sleep(5);clean(d,`${id} week ${k}`)}}
  else clean(d,id);
  if(id==='custom')must(/No exercises yet/.test(txt(d.querySelector('.pday[data-pday="0"]'))),'Build my own: empty day says No exercises yet');
  if(w.__errs.length)errs.push(id+': '+w.__errs.join(' | '));
 }

 // ---------- 2. old-format user: months of sessions, no program, no swaps, no start; kg
 {const ss={};let n=0;for(let i=0;i<120;i+=2){const dt=new Date('2026-06-01T00:00');dt.setDate(dt.getDate()+i);const date=dt.toISOString().slice(0,10),k=ORDER[(i/2)%6];ss[`${date}_${k}`]={date,s:k,ex:{'Bench press':[{w:100,r:5}]}}}
  const w=make({profile:{unit:'kg'},sessions:ss}),d=w.document;await sleep(100);const before=JSON.stringify(store(w).sessions);
  await tab(d,'program');
  must(!!d.querySelector('.pring')&&d.querySelectorAll('.pday[data-pday]').length===6,'old-format kg user (no program/start/swaps): default PPL renders');
  clean(d,'old-format user');
  must(JSON.stringify(store(w).sessions)===before,'old-format user: sessions untouched by opening Program');
  if(w.__errs.length)errs.push('old: '+w.__errs.join(' | '))}

 // ---------- 3. PPL user in a later cycle (week 20 overall = week 5 of cycle 2)
 {const w=make({profile:{start:'2026-07-18',unit:'lb'},sessions:{}}),d=w.document;await sleep(100);await tab(d,'program');
  const r=d.querySelector('.pring');
  must(txt(r)==='Wk 5/15'&&/deload/i.test(txt(d.querySelector('.phead'))),'cycle 2: ring reads Wk 5/15 and header says deload ('+txt(r)+')');
  must(d.querySelector('[data-ptl="5"]').classList.contains('now')&&d.querySelectorAll('[data-ptl].past').length===4,'cycle 2: week 5 is now, 4 past weeks');
  clean(d,'cycle 2')}

 // ---------- 4. week 15 / test week on PPL
 {const w=make({profile:{start:'2026-08-22',unit:'lb'},sessions:{}}),d=w.document;await sleep(100);await tab(d,'program');
  must(txt(d.querySelector('.pring'))==='Wk 15/15','week 15: ring Wk 15/15');
  must(/test week/.test(txt(d.querySelector('.pwh h2'))),'week 15 heading says test week');
  must(txt(d.querySelector('.pban'))==='Next week: New cycle','week 15 banner New cycle');
  must(/New cycle next week/.test(txt(d.querySelector('.pnx'))),'week 15 header pill: New cycle next week');
  must(txt(rows(d,0)[0].querySelector('.pxn'))==='Bench press'&&/Ramp up/.test(txt(rows(d,0)[0])),'week 15 Push A row 0 is the Bench press test');
  // days without a test lift (Pull A, Push B, Legs B): what does the preview say?
  const pa=txt(d.querySelector('.pday[data-pday="1"]'));
  note('week 15 Pull A card reads: '+pa.slice(0,120));
  if(/No exercises yet\. Add some below/.test(pa))bugs.push('week 15 (test week): Pull A has no test lift but the preview says "No exercises yet. Add some below." (Workout tab says "Test week: no lifting on this day")');
  const ar=d.querySelector('.pring').getAttribute('aria-label');must(/Week 15 of 15/.test(ar),'week 15 aria-label: '+ar);
  // Workout tab on a week 15 swap
  rows(d,0)[0].querySelector('[data-pswap]').click();await sleep(10);
  const inp=d.querySelector('#pswcustom');inp.value='Floor press';d.querySelector('[data-pswgo]').click();await sleep(20);
  must(store(w).profile.swaps['pushA|Bench press']==='Floor press','typed custom name saved as a PPL swap');
  await tab(d,'today');if(!d.querySelector('.card[data-card] h3')){d.querySelector('[data-s=pushA]').click();await sleep(20)}
  must(txt(d.querySelector('.card[data-card] h3'))==='Floor press','Workout tab shows the typed swap in week 15');
  await tab(d,'program');rows(d,0)[0].querySelector('[data-pswap]').click();await sleep(10);
  d.querySelector('#pswcustom').value='  Bench press ';d.querySelector('[data-pswgo]').click();await sleep(20);
  must(!('pushA|Bench press' in store(w).profile.swaps),'typing the original name back removes the swap key');
  clean(d,'week 15');if(w.__errs.length)errs.push('w15: '+w.__errs.join(' | '))}

 // ---------- 5. PPL swap chain: A -> B -> C -> back; preview, editor and Workout tab agree
 {const w=make({profile:{start:'2026-11-14',unit:'kg',swaps:{}},sessions:{}}),d=w.document;await sleep(100);await tab(d,'program');
  const base=JSON.stringify(store(w).profile.program||null);
  const sw=async idx=>{rows(d,3)[1].querySelector('[data-pswap]').click();await sleep(10);d.querySelector('[data-pdd]').click();await sleep(10);
    const o=[...d.querySelectorAll('[data-pddpick]')].filter(o=>o.dataset.pddpick!==orig)[idx];const n=o.dataset.pddpick;o.click();await sleep(10);d.querySelector('[data-pswgo]').click();await sleep(20);return n};
  const orig=txt(rows(d,3)[1].querySelector('.pxn'));
  const a=await sw(0);must(store(w).profile.swaps['pushB|'+orig]===a,`Push B row 1: ${orig} -> ${a}`);
  must(/Swapped from/.test(txt(rows(d,3)[1])),'preview row says Swapped from');
  const b=await sw(1);must(store(w).profile.swaps['pushB|'+orig]===b&&Object.keys(store(w).profile.swaps).length===1,`swap of a swapped lift keeps the original key: ${orig} -> ${b}`);
  must([...d.querySelectorAll('.pedit')][3].querySelectorAll('[data-pf=n]')[1].value===b,'editor row shows the swapped name');
  // swap shows up in other weeks that contain the same lift
  d.querySelector('[data-ptl="4"]').click();await sleep(10);must(txt(rows(d,3)[1].querySelector('.pxn'))===b,'swap applies in week 4 too');
  await tab(d,'program');
  await tab(d,'today');d.querySelector('[data-s=pushB]')&&d.querySelector('[data-s=pushB]').click();await sleep(20);
  must([...d.querySelectorAll('.card[data-card] h3')].some(h=>txt(h)===b),'Workout tab Push B shows '+b);
  await tab(d,'program');rows(d,3)[1].querySelector('[data-pswap]').click();await sleep(10);
  must(txt(d.querySelector('[data-pswreset]'))==='Back to '+orig,'Back to '+orig);
  d.querySelector('[data-pswreset]').click();await sleep(20);
  must(!Object.keys(store(w).profile.swaps).length&&store(w).profile.program.ppl===true,'back to original: no swaps, still ppl');
  await tab(d,'today');must([...d.querySelectorAll('.card[data-card] h3')].some(h=>txt(h)===orig),'Workout tab back to '+orig);
  // cancel does nothing
  await tab(d,'program');rows(d,0)[0].querySelector('[data-pswap]').click();await sleep(10);d.querySelector('[data-pswcancel]').click();await sleep(10);
  must(!d.querySelector('.pswp')&&!Object.keys(store(w).profile.swaps).length,'Cancel closes the panel and saves nothing');
  // toggling the same swap button closes it; only one panel open at a time
  rows(d,0)[0].querySelector('[data-pswap]').click();await sleep(10);rows(d,0)[1].querySelector('[data-pswap]').click();await sleep(10);
  must(d.querySelectorAll('.pswp').length===1&&rows(d,0)[1].querySelector('[data-pswap]').getAttribute('aria-expanded')==='true','one swap panel at a time');
  rows(d,0)[1].querySelector('[data-pswap]').click();await sleep(10);must(!d.querySelector('.pswp'),'tapping the swap button again closes it');
  // week change closes the panel and keeps the selection
  rows(d,0)[0].querySelector('[data-pswap]').click();await sleep(10);d.querySelector('[data-ptl="7"]').click();await sleep(10);
  must(!d.querySelector('.pswp')&&d.querySelector('[data-ptl="7"]').classList.contains('sel'),'changing week closes the swap panel');
  // re-render from an editor edit keeps the selected week (PPL -> custom block pattern)
  const nm=d.querySelector('[data-pd="0"]');nm.value='Chest day';ev(w,nm,'change');await sleep(20);
  must(store(w).profile.program.ppl===false&&store(w).profile.program.periodize===true,'editing PPL switches to the block pattern (still periodized)');
  must(d.querySelector('[data-ptl="7"]').classList.contains('sel'),'selected week survives a save re-render');
  must(txt(d.querySelector('.pday[data-pday="0"] h3'))==='Chest day','renamed day shows in the preview');
  clean(d,'PPL swaps');if(w.__errs.length)errs.push('ppl swaps: '+w.__errs.join(' | '))}

 // ---------- 6. custom plan: swap, duplicate names, long names, many exercises, bad numbers, 0 and 20 sets
 {const long='Single-arm landmine Meadows row with a pause at the top and straps'.slice(0,60),word='Supercalifragilisticexpialidociouspressdownthingamajigwhatsit';
  const ex=[{n:'Bench press',sets:3,reps:'8'},{n:'Bench press',sets:2,reps:'12'},{n:long,sets:0,reps:'AMRAP 10+'},{n:word,sets:20,reps:'5'}];
  for(let i=0;i<16;i++)ex.push({n:'Face pull',sets:3,reps:'15'});
  const program={name:'My plan',periodize:false,days:[{k:'dA',n:'Day A',c:'#d8342c',ex},{k:'dB',n:'Empty day',c:'#2a63d4',ex:[]}]};
  const w=make({profile:{start:'2026-11-14',unit:'kg',program},sessions:{}}),d=w.document;await sleep(100);await tab(d,'program');
  must(rows(d,0).length===20,'20 exercises render');
  must(txt(rows(d,0)[2].querySelector('.pxs'))==='0 × AMRAP 10+','0 sets and a text rep range render as-is: '+txt(rows(d,0)[2].querySelector('.pxs')));
  must(/No exercises yet/.test(txt(d.querySelector('.pday[data-pday="1"]'))),'empty day: No exercises yet');
  // swap the SECOND Bench press row
  rows(d,0)[1].querySelector('[data-pswap]').click();await sleep(10);d.querySelector('#pswcustom').value='DB bench press';d.querySelector('[data-pswgo]').click();await sleep(20);
  const names=store(w).profile.program.days[0].ex.map(e=>e.n);
  if(names[1]==='DB bench press'&&names[0]==='Bench press')must(true,'duplicate names: swapping row 2 renames row 2');
  else note(`BUG (nice to have): two rows named Bench press; swapping row 2 renamed row ${names.indexOf('DB bench press')+1} instead (same find-by-name logic as the Workout tab)`);
  // editor: letters in sets/reps are ignored, sets clamp to 10
  const sI=d.querySelector('[data-pe="0.4"][data-pf=sets]');sI.value='abc';ev(w,sI,'change');await sleep(20);
  must(store(w).profile.program.days[0].ex[4].sets===3,'letters in Sets are ignored');
  const sJ=d.querySelector('[data-pe="0.4"][data-pf=sets]');sJ.value='25';ev(w,sJ,'change');await sleep(20);
  must(store(w).profile.program.days[0].ex[4].sets===10,'Sets over 10 clamp to 10');
  const rI=d.querySelector('[data-pe="0.4"][data-pf=reps]');rI.value='lots';ev(w,rI,'change');await sleep(20);
  must(store(w).profile.program.days[0].ex[4].reps==='15','Reps without a digit are ignored');
  const nI=d.querySelector('[data-pe="0.4"][data-pf=n]');nI.value='   ';ev(w,nI,'change');await sleep(20);
  must(store(w).profile.program.days[0].ex[4].n==='Face pull','blank exercise name is ignored');
  // HTML in a name is escaped everywhere
  const nJ=d.querySelector('[data-pe="0.4"][data-pf=n]');nJ.value='<img src=x onerror=alert(1)>"quoted"';ev(w,nJ,'change');await sleep(20);
  must(!d.querySelector('#main img[src="x"]')&&txt(rows(d,0)[4].querySelector('.pxn')).includes('<img'),'HTML in an exercise name is shown as text');
  rows(d,0)[4].querySelector('[data-pswap]').click();await sleep(10);must(!!d.querySelector('.pswp')&&!d.querySelector('#main img[src="x"]'),'swap panel escapes the name');
  d.querySelector('[data-pswcancel]').click();await sleep(10);
  // remove exercise, reorder at edges
  const n0=store(w).profile.program.days[0].ex.length;d.querySelector('[data-pxdel="0.19"]').click();await sleep(20);
  must(store(w).profile.program.days[0].ex.length===n0-1,'Remove exercise (×) deletes the last row');
  const last=d.querySelectorAll('.pedit')[0].querySelectorAll('[data-pdown]');must(last[last.length-1].disabled,'new last row Move down disabled after a delete');
  // stale swap panel after reorder
  rows(d,0)[0].querySelector('[data-pswap]').click();await sleep(10);const was=txt(d.querySelector('.pswp figcaption'));
  d.querySelector('[data-pdown="0.0"]').click();await sleep(20);const now=d.querySelector('.pswp')&&txt(d.querySelector('.pswp figcaption'));
  if(now&&now!==was)note(`BUG (nice to have): swap panel stays open on row 1 after Move down, now for a different lift ("${was}" -> "${now}")`);
  // empty day: add exercise from the editor, then it shows in the preview
  d.querySelector('[data-padd="1"]').click();await sleep(20);
  must(rows(d,1).length===1&&txt(rows(d,1)[0].querySelector('.pxn'))==='New exercise','Add exercise on an empty day shows in the preview');
  // two-tap delete: arming one day then tapping another day's Remove does not delete the first
  d.querySelector('[data-pdel="0"]').click();await sleep(10);must(txt(d.querySelector('[data-pdel="0"]'))==='Confirm','first tap arms day 1');
  d.querySelector('[data-pdel="1"]').click();await sleep(10);
  must(store(w).profile.program.days.length===2&&txt(d.querySelector('[data-pdel="0"]'))==='Remove'&&txt(d.querySelector('[data-pdel="1"]'))==='Confirm','tapping another day moves the arm, nothing deleted');
  d.querySelector('[data-pdel="1"]').click();await sleep(20);must(store(w).profile.program.days.length===1,'second tap deletes that day');
  d.querySelector('[data-pdel="0"]').click();await sleep(10);d.querySelector('[data-pdel="0"]').click();await sleep(20);
  must(store(w).profile.program.days.length===0&&/No days in your program yet/.test(txt(d.querySelector('#main'))),'deleting every day shows the empty message');
  d.querySelector('[data-pdayadd]').click();await sleep(20);must(store(w).profile.program.days.length===1&&d.querySelectorAll('.pday[data-pday]').length===1,'+ Add day from zero days');
  for(const t of ['home','today','history','settings','program'])if(d.querySelector(`[data-tab=${t}]`))await tab(d,t);
  clean(d,'custom edge');if(w.__errs.length)errs.push('custom: '+w.__errs.join(' | '))}

 // ---------- 7. periodized custom plan with an empty day and a past/live session
 {const program={name:'Two day',periodize:true,days:[{k:'dA',n:'Day A',c:'#e0a800',ex:[{n:'Back squat',sets:4,reps:'6–8'},{n:'Leg curl',sets:3,reps:'10'}]},{k:'dB',n:'Day B',c:'#2a63d4',ex:[]}]};
  const ss={'2026-11-23_dA':{date:'2026-11-23',s:'dA',ex:{'Back squat':[{w:100,r:6,e:8}]},updated:1}};
  const w=make({profile:{start:'2026-11-09',unit:'kg',program},sessions:ss}),d=w.document;await sleep(100);await tab(d,'program');
  must(txt(d.querySelector('.pring'))==='Wk 3/15','2-day periodized plan: week 3');
  must(/Done/.test(txt(d.querySelector('.pday[data-pday="0"] .pdm'))),'past-date log inside this week counts as Done');
  must(d.querySelector('.pring').getAttribute('data-pct')===String(Math.round((2+1/2)/15*100)),'ring counts 1 of 2 days ('+d.querySelector('.pring').getAttribute('data-pct')+'%)');
  must(/1 of 2 workouts done/.test(txt(d.querySelector('.phead'))),'header: 1 of 2 workouts done');
  for(const k of [5,6,10,11,15]){d.querySelector(`[data-ptl="${k}"]`).click();await sleep(5);clean(d,'2-day week '+k);must(/No exercises yet/.test(txt(d.querySelector('.pday[data-pday="1"]'))),`empty periodized day in week ${k}`)}
  // week 11: swap the main lift on a periodized custom plan renames ex[0]
  d.querySelector('[data-ptl="11"]').click();await sleep(10);rows(d,0)[0].querySelector('[data-pswap]').click();await sleep(10);
  d.querySelector('#pswcustom').value='Safety-bar squat';d.querySelector('[data-pswgo]').click();await sleep(20);
  must(store(w).profile.program.days[0].ex[0].n==='Safety-bar squat','week 11 custom swap renames ex[0]');
  must(JSON.stringify(store(w).sessions)===JSON.stringify(ss),'sessions untouched');
  if(w.__errs.length)errs.push('per custom: '+w.__errs.join(' | '))}

 // ---------- 8. workout started and never ended (live) shows as Done?
 {const ss={'2026-11-28_pushA':{date:'2026-11-28',s:'pushA',live:true,start:Date.parse('2026-11-28T08:00:00'),ex:{'Bench press':[{w:60,r:8}]},updated:1}};
  const w=make({profile:{start:'2026-11-14',unit:'kg'},sessions:ss}),d=w.document;await sleep(100);await tab(d,'program');
  const m=txt(d.querySelector('.pday[data-pday="0"] .pdm'));
  if(/Done/.test(m))note('nice to have: a workout still in progress (live, never ended) shows "Done ✓" on the Program tab and counts toward the ring');
  else must(true,'live session not shown as Done');
  clean(d,'live');if(w.__errs.length)errs.push('live: '+w.__errs.join(' | '))}

 // ---------- 9. switching program in Settings while on a selected week
 {const w=make({profile:{start:'2026-11-14',unit:'lb',swaps:{'pushA|Bench press':'DB bench press'}},sessions:{}}),d=w.document;await sleep(100);
  await tab(d,'program');d.querySelector('[data-ptl="9"]').click();await sleep(10);
  must(txt(rows(d,0)[0].querySelector('.pxn'))==='DB bench press','stored swap applied in preview');
  await tab(d,'settings');d.querySelector('#newp').value='bro';d.querySelector('#swp').click();await sleep(10);if(d.querySelector('#newp').value!=='bro')note('pre-existing (main too): Settings > Switch program select resets to the first preset after the first tap; re-picking bro');d.querySelector('#newp').value='bro';d.querySelector('#swp').click();await sleep(30);
  await tab(d,'program');
  must(!d.querySelector('.pring')&&d.querySelectorAll('.pday[data-pday]').length===5&&txt(d.querySelector('.pday[data-pday="0"] h3'))==='Chest','switched to Body-Part Split: 5 cards, no ring');
  await tab(d,'settings');d.querySelector('#newp').value='ppl';d.querySelector('#swp').click();await sleep(10);if(d.querySelector('#newp').value!=='ppl')note('pre-existing (main too): Settings > Switch program select resets to the first preset after the first tap; re-picking ppl');d.querySelector('#newp').value='ppl';d.querySelector('#swp').click();await sleep(30);
  await tab(d,'program');must(d.querySelector('[data-ptl="3"]').classList.contains('sel')&&txt(rows(d,0)[0].querySelector('.pxn'))==='Bench press','switched back to PPL: week 3 selected, swaps cleared');
  if(w.__errs.length)errs.push('switch: '+w.__errs.join(' | '))}

 // ---------- 10. CSS tap targets for the rest of the new controls
 {const w=make({profile:{start:'2026-11-14'},sessions:{}}),d=w.document;await sleep(100);
  const rules=[];const walk=l=>{for(const r of l){if(r.cssRules&&!r.selectorText)walk(r.cssRules);else if(r.selectorText)rules.push(r)}};for(const s of d.styleSheets)walk(s.cssRules);
  const px=(sel,prop)=>Math.max(0,...rules.filter(r=>r.selectorText.split(',').some(x=>x.trim()===sel)).map(r=>parseFloat(r.style.getPropertyValue(prop))||0));
  must(px('.padd','min-height')>=44,'+ Add exercise min-height >= 44');
  must(px('.pib','min-height')>=44&&px('.pib','min-width')>=44,'.pib icon buttons >= 44');
  must(rules.some(r=>r.selectorText.split(',').some(x=>x.trim()==='.pxn')&&/anywhere|break-word/.test(r.style.getPropertyValue('overflow-wrap'))),'.pxn wraps long unbroken names (no page-level horizontal scroll at 360 px)');
  must(px('.btn','min-height')>=44,'.btn (Remove day, Use it, Cancel, Add day) >= 44');
  console.log('errors',w.__errs)}

 console.log('errors',errs);
 if(bugs.length)throw new Error('FAIL (real bugs, see QA report):\n - '+bugs.join('\n - '));
 process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
