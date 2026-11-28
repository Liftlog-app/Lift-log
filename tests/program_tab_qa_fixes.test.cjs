// Program tab, round 2 QA fixes: week 15 test-week wording and ring count, live workouts are not "Done",
// past-week checkmarks only for completed weeks, swap by row index on duplicate names, swap panel closes on reorder/remove.
const {JSDOM}=require('jsdom');
const html=require('fs').readFileSync(require('path').join(__dirname,'..','src','index.html'),'utf8');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function make(seed){const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',beforeParse(w){const RD=w.Date;const T=new RD('2026-11-28T12:00:00').getTime();class FD extends RD{constructor(...a){if(a.length)super(...a);else super(FD.now())}static now(){return T}};w.Date=FD;w.ResizeObserver=class{observe(){}disconnect(){}};if(seed)w.localStorage.setItem('liftlog.v1',JSON.stringify(seed));w.__errs=[];w.addEventListener('error',e=>w.__errs.push(e.message));w.scrollTo=()=>{}}});return dom.window}
const must=(ok,msg)=>{if(!ok)throw new Error('FAIL: '+msg);console.log('ok:',msg)};
const store=w=>JSON.parse(w.localStorage.getItem('liftlog.v1'));
const txt=el=>(el?el.textContent:'').replace(/\s+/g,' ').trim();
const tab=async(d,t)=>{d.querySelector(`[data-tab=${t}]`).click();await sleep(25)};
const rows=(d,di)=>[...d.querySelectorAll(`.pday[data-pday="${di}"] .prow`)];
const ORDER=['pushA','pullA','legsA','pushB','pullB','legsB'];
const sess=(date,k,extra)=>({[`${date}_${k}`]:Object.assign({date,s:k,ex:{'Bench press':[{w:60,r:8}]},updated:1},extra||{})});
const errs=[];

(async()=>{
 // ---------- 1. week 15 on PPL: test-week wording, ring and count only use days with a test lift
 {const ss=sess('2026-11-28','pushA',{start:1,end:2,dur:40,live:false});
  const w=make({profile:{start:'2026-08-22',unit:'lb'},sessions:ss}),d=w.document;await sleep(100);await tab(d,'program');
  const act=ORDER.filter(k=>w.pplPlan(15,k).length),idle=ORDER.filter(k=>!w.pplPlan(15,k).length);
  must(act.length>0&&idle.length>0,`week 15 has ${act.length} test days and ${idle.length} days without a test lift`);
  for(const k of idle){const di=ORDER.indexOf(k),c=txt(d.querySelector(`.pday[data-pday="${di}"]`));
    must(/Test week: no lifting on this day/.test(c)&&!/No exercises yet/.test(c),`${k}: shows test-week wording, not "No exercises yet"`);
    must(txt(d.querySelector(`.pday[data-pday="${di}"] .pdm`))==='No lifting',`${k}: card meta reads No lifting`)}
  must(new RegExp(`1 of ${act.length} workouts? done this week`).test(txt(d.querySelector('.phead'))),`header counts 1 of ${act.length} (only days with lifts)`);
  must(d.querySelector('.pring').getAttribute('data-pct')===String(Math.round((14+1/act.length)/15*100)),'ring fill uses test days only ('+d.querySelector('.pring').getAttribute('data-pct')+'%)');
  must(/Done/.test(txt(d.querySelector('.pday[data-pday="0"] .pdm'))),'ended Push A session shows Done');
  // a periodized custom plan's genuinely empty day keeps the editor hint in week 15
  if(w.__errs.length)errs.push('w15: '+w.__errs.join(' | '))}
 {const program={name:'Two day',periodize:true,days:[{k:'dA',n:'Day A',c:'#e0a800',ex:[{n:'Back squat',sets:4,reps:'6'},{n:'Leg curl',sets:3,reps:'10'}]},{k:'dB',n:'Day B',c:'#2a63d4',ex:[]}]};
  const w=make({profile:{start:'2026-08-22',unit:'kg',program},sessions:{}}),d=w.document;await sleep(100);await tab(d,'program');
  must(/No exercises yet/.test(txt(d.querySelector('.pday[data-pday="1"]'))),'custom week 15: empty day still says No exercises yet');
  must(/0 of 1 workout done/.test(txt(d.querySelector('.phead'))),'custom week 15: header counts only the day with a test lift (0 of 1)');
  if(w.__errs.length)errs.push('w15 custom: '+w.__errs.join(' | '))}

 // ---------- 2. live (unfinished) workout is not Done and does not fill the ring
 {const ss=Object.assign(sess('2026-11-28','pushA',{live:true,start:Date.parse('2026-11-28T08:00:00')}),sess('2026-11-28','pullA',{start:1,end:2,dur:50,live:false}));
  const w=make({profile:{start:'2026-11-14',unit:'kg'},sessions:ss}),d=w.document;await sleep(100);await tab(d,'program');
  must(!/Done/.test(txt(d.querySelector('.pday[data-pday="0"] .pdm'))),'live Push A is not shown as Done');
  must(/Done/.test(txt(d.querySelector('.pday[data-pday="1"] .pdm'))),'ended Pull A is shown as Done');
  must(/1 of 6 workouts done/.test(txt(d.querySelector('.phead'))),'header counts only the ended workout');
  must(d.querySelector('.pring').getAttribute('data-pct')===String(Math.round((2+1/6)/15*100)),'ring counts 1 of 6');
  if(w.__errs.length)errs.push('live: '+w.__errs.join(' | '))}

 // ---------- 3. past weeks: check only when every day was done that week
 {const ss={};['2026-11-14','2026-11-15','2026-11-16','2026-11-17','2026-11-18','2026-11-19'].forEach((dt,i)=>Object.assign(ss,sess(dt,ORDER[i])));
  Object.assign(ss,sess('2026-11-21','pushA'),sess('2026-11-22','pullA',{live:true,start:1}));
  const w=make({profile:{start:'2026-11-14',unit:'kg'},sessions:ss}),d=w.document;await sleep(100);await tab(d,'program');
  const b1=d.querySelector('[data-ptl="1"]'),b2=d.querySelector('[data-ptl="2"]');
  must(b1.classList.contains('past')&&txt(b1.querySelector('small'))==='✓'&&/completed/.test(b1.getAttribute('aria-label')),'week 1 (all 6 done) shows ✓ and "completed"');
  must(b2.classList.contains('past')&&txt(b2.querySelector('small'))===''&&!/completed/.test(b2.getAttribute('aria-label')),'week 2 (partial) is past without ✓');
  if(w.__errs.length)errs.push('past: '+w.__errs.join(' | '))}
 {const w=make({profile:{start:'2026-07-18',unit:'lb'},sessions:{}}),d=w.document;await sleep(100);await tab(d,'program');
  must(d.querySelectorAll('[data-ptl].past').length===4&&![...d.querySelectorAll('[data-ptl].past small')].some(s=>txt(s)==='✓'),'cycle 2 with no logs: 4 past weeks, no ✓');
  if(w.__errs.length)errs.push('cycle2: '+w.__errs.join(' | '))}

 // ---------- 4. custom plan duplicate names: swap renames the tapped row (non-periodized and periodized)
 for(const per of [false,true]){
  const program={name:'Dupes',periodize:per,days:[{k:'dA',n:'Day A',c:'#d8342c',ex:[{n:'Bench press',sets:3,reps:'8'},{n:'Bench press',sets:2,reps:'12'},{n:'Face pull',sets:3,reps:'15'}]}]};
  const w=make({profile:{start:'2026-11-14',unit:'kg',program},sessions:{}}),d=w.document;await sleep(100);await tab(d,'program');
  rows(d,0)[1].querySelector('[data-pswap]').click();await sleep(10);d.querySelector('#pswcustom').value='DB bench press';d.querySelector('[data-pswgo]').click();await sleep(20);
  const n=store(w).profile.program.days[0].ex.map(e=>e.n);
  must(n[0]==='Bench press'&&n[1]==='DB bench press'&&n[2]==='Face pull',`${per?'periodized':'plain'} custom: swapping row 2 renames row 2 (${n.join(', ')})`);
  if(w.__errs.length)errs.push('dupes: '+w.__errs.join(' | '))}

 // ---------- 5. swap panel closes on Move down / Move up / Remove exercise
 {const program={name:'Three',periodize:false,days:[{k:'dA',n:'Day A',c:'#d8342c',ex:[{n:'Bench press',sets:3,reps:'8'},{n:'Barbell row',sets:3,reps:'8'},{n:'Face pull',sets:3,reps:'15'}]}]};
  const w=make({profile:{start:'2026-11-14',unit:'kg',program},sessions:{}}),d=w.document;await sleep(100);await tab(d,'program');
  for(const sel of ['[data-pdown="0.0"]','[data-pup="0.1"]','[data-pxdel="0.2"]']){
   rows(d,0)[0].querySelector('[data-pswap]').click();await sleep(10);must(!!d.querySelector('.pswp'),'swap panel open before '+sel);
   d.querySelector(sel).click();await sleep(20);must(!d.querySelector('.pswp'),sel+' closes the swap panel')}
  const n=store(w).profile.program.days[0].ex.map(e=>e.n);
  must(n.join('|')==='Bench press|Barbell row','reorder and remove still saved ('+n.join(', ')+')');
  if(w.__errs.length)errs.push('stale: '+w.__errs.join(' | '))}

 console.log('errors',errs);
 if(errs.length)throw new Error('page errors: '+errs.join(' ; '));
 process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
