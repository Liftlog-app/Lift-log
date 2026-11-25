// QA follow-ups for PR #1: goal above trend, + sign on gain %, future weigh-ins ignored,
// Enter logs the weight, PR chance above work weight, gear() guards bad plates. Fixed date 2026-11-24.
const {JSDOM}=require('jsdom');
const html=require('fs').readFileSync(require('path').join(__dirname,'..','src','index.html'),'utf8');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const NOW=new Date('2026-11-24T08:00:00').getTime();
const fail=m=>{throw new Error('FAILED: '+m)},ok=(c,m)=>{if(!c)fail(m)};
const allErrors=[];
function boot(seed){
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',beforeParse(w){const RD=w.Date;class FD extends RD{constructor(...a){if(a.length)super(...a);else super(FD.now())}static now(){return w.__now||NOW}};w.Date=FD;w.ResizeObserver=class{observe(){}disconnect(){}};w.scrollTo=()=>{};w.localStorage.setItem('liftlog.v1',JSON.stringify(seed));w.__now=NOW;w.__e=[];w.addEventListener('error',e=>w.__e.push(e.message))}});
  const w=dom.window,d=w.document,$=s=>d.querySelector(s);allErrors.push(w.__e);
  return {w,d,$,tab:async t=>{$(`[data-tab=${t}]`).click();await sleep(15)},store:()=>JSON.parse(w.localStorage.getItem('liftlog.v1'))};
}
const base=()=>({profile:{start:'2026-11-16',unit:'lb'},sessions:{'2026-11-23_pushA':{date:'2026-11-23',W:2,wk:2,s:'pushA',ex:{'Bench press':[{w:185,r:8}]},updated:1,dur:50}}});
const goalView=async(w,goal,by)=>{const s=base();s.profile.bw=[{d:'2026-11-24',w,u:'lb'}];s.profile.cut={goal,u:'lb',by};const A=boot(s);await sleep(120);await A.tab('progress');return {g:A.$('.bwgoal').textContent,warn:(A.$('#bwsec .hint.plat')||{}).textContent||''}};
(async()=>{
 // 1. goal above trend / at goal
 {let r=await goalView(160,175,'2027-06-01');console.log('160 → 175 by Jun 1:',r.g,'|',r.warn||'no warning');
  ok(/Your goal is above your current trend: you'd need to gain about 0\.56 lb\/wk \(0\.35%\/wk\)\./.test(r.g)&&!r.warn&&!/already/.test(r.g),'goal above trend text');
  r=await goalView(160,175,'2027-01-05');console.log('160 → 175 by Jan 5:',r.g,'|',r.warn);
  ok(/gain about 2\.50 lb\/wk \(1\.56%\/wk\)/.test(r.g)&&/That's faster than lean gaining usually goes \(about 0\.25–0\.5% a week\)\./.test(r.warn)&&!/1% a week/.test(r.warn),'fast gain warning');
  for(const w of [164.9,165.2]){r=await goalView(w,165,'2027-06-01');ok(/You're at your goal\./.test(r.g)&&!r.warn,`at goal for ${w}: ${r.g}`)}
  r=await goalView(165.3,165,'2027-06-01');ok(/needs 0\.01 lb\/wk/.test(r.g),'just above goal still shows needed rate: '+r.g);
  console.log('within 0.2 → "You\'re at your goal." ok');}
 // 2. + sign on % when gaining; loss keeps the roadmap format
 {const s=base();s.profile.bw=Array.from({length:14},(_,i)=>({d:new Date(Date.UTC(2026,10,11+i)).toISOString().slice(0,10),w:+(170+0.1*i).toFixed(2),u:'lb'}));const A=boot(s);await sleep(120);await A.tab('progress');
  const t=A.$('#bwrate').textContent;console.log('gaining rate:',t);ok(/\+0\.7 lb\/wk/.test(t)&&/\+0\.41%\/wk/.test(t)&&/Gaining/.test(t),'gain sign');}
 {const s=base();s.profile.bw=Array.from({length:14},(_,i)=>({d:new Date(Date.UTC(2026,10,11+i)).toISOString().slice(0,10),w:+(180-0.2*i).toFixed(2),u:'lb'}));const A=boot(s);await sleep(120);await A.tab('progress');
  const t=A.$('#bwrate').textContent;ok(/−1\.4 lb\/wk/.test(t)&&/[^+−]0\.78%\/wk/.test(t),'loss format changed: '+t);}
 // 3. future weigh-ins ignored but kept
 {const s=base();s.profile.bw=[{d:'2026-11-23',w:180,u:'lb'},{d:'2026-11-25',w:150,u:'lb'}];const A=boot(s);await sleep(120);await A.tab('progress');
  const tr=A.$('#bwsec .pr b').textContent,rows=A.d.querySelectorAll('.bwrow');console.log('future entry: trend',tr,'| recent rows',rows.length,'| stored',A.store().profile.bw.length);
  ok(tr==='180.0 lb'&&rows.length===1&&!/Nov 25/.test(rows[0].textContent)&&A.store().profile.bw.length===2,'future weigh-in counted or deleted');
  ok(A.$('#bwchart').querySelectorAll('.bwdot').length===1,'future weigh-in on chart');}
 // 4. Enter / Go logs the weight
 {const A=boot(base());await sleep(120);await A.tab('progress');const i=A.$('#bww');i.focus();i.value='181.6';i.dispatchEvent(new A.w.Event('input',{bubbles:true}));
  i.dispatchEvent(new A.w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await sleep(40);
  const bw=A.store().profile.bw;console.log('Enter on #bww →',JSON.stringify(bw),'| row:',(A.$('.bwrow')||{}).textContent);
  ok(bw&&bw.length===1&&bw[0].w===181.6&&A.$('.bwrow')&&/181\.6/.test(A.$('.bwrow').textContent),'Enter did not log');}
 // 5. PR chance strictly above the working weight
 const legs=()=>({'2026-11-17_legsA':{date:'2026-11-17',W:0,wk:0,s:'legsA',ex:{'Back squat':[{w:247,r:6,e:8}],'Romanian deadlift':[{w:203,r:9}]},updated:1,dur:50}});
 for(const plates of [[45],[45,35,25,10,5,2.5],[45,25,10,5]]){
  const A=boot({profile:{start:'2026-11-02',unit:'lb',ready:{date:'2026-11-24',sl:5,so:5,en:5},gear:{lb:{bar:45,plates}}},sessions:legs()});await sleep(120);await A.tab('today');A.$('[data-s=legsA]').click();await sleep(20);
  const sug=A.$('.card[data-card="0"] .sug').textContent,work=parseFloat(sug.match(/Suggested: ([\d.]+)/)[1]),m=sug.match(/top set of ([\d.]+)/);
  if(plates.length===1){console.log(`plates 45 only: work ${work}, PR chance hidden: ${!m}`);ok(!m,'PR chance shown with only 45s (jump > 5%)');continue}
  ok(m,'no PR chance line');if(plates.length===6)ok(work===240&&+m[1]===245,'default gear PR chance differs from main (240 work → 245 on main)');ok(+m[1]<=work*1.05+1e-9,`PR chance ${m[1]} more than 5% above ${work}`);const top=+m[1],step=2*Math.min(...plates);
  console.log(`plates ${plates.join('/')}: work ${work}, PR chance ${top}`);ok(top>work&&(top-45)%step===0,`PR chance ${top} not above work ${work} on a ${step} step`)}
 // 6. bad plates in a restored backup: ignored, no hang
 for(const [plates,exp] of [[[0,-5,'x',null],'45, 35, 25, 10, 5, 2.5'],[[0,45],'45']]){
  const A=boot({profile:{start:'2026-11-02',unit:'lb',gear:{lb:{bar:45,plates}}},sessions:legs()});await sleep(120);await A.tab('today');A.$('[data-s=legsA]').click();await sleep(20);
  const load=(A.$('.card[data-card="0"] .sug .meta')||{}).textContent||'';console.log(`plates ${JSON.stringify(plates)} → ${load}`);ok(/^Load: /.test(load)&&!/NaN|undefined/.test(load),'bad plates load line');
  A.$('.gear').click();await sleep(10);ok(A.$('#gpl').value===exp,'settings shows bad plates: '+A.$('#gpl').value);console.log('  settings plates:',A.$('#gpl').value)}
 const errs=allErrors.flat();console.log('errors',errs);if(errs.length)fail('page errors: '+errs.join('; '));
 console.log('ALL QA FIX CHECKS PASSED');process.exit(0)})().catch(e=>{console.log(e.message);process.exit(1)});
