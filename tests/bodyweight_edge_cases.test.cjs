// QA edge cases for the bodyweight and cut tracker (profile.bw / profile.cut) and loadable barbell rounding.
// Fixed date: Tuesday 2026-11-24. Covers: brand-new user, junk/old data, kg users, letters in number fields,
// hosted `db` sync of bw/cut (fake db), render guard while typing, odd plate lists, and default-gear numbers
// pinned to what `main` printed before the rounding change.
const {JSDOM}=require('jsdom');
const html=require('fs').readFileSync(require('path').join(__dirname,'..','src','index.html'),'utf8');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const NOW=new Date('2026-11-24T08:00:00').getTime();
const fail=m=>{throw new Error('FAILED: '+m)};
const ok=(c,m)=>{if(!c)fail(m)};
const allErrors=[];

// Minimal fake of the hosted artifact db: JSON round-trips like a real store, fires snapshots on set.
function fakeDb(initialProfile){
  const store={profile:initialProfile?JSON.parse(JSON.stringify(initialProfile)):null,sessions:{}},pl=[],sl=[],sets=[];
  const snapP=()=>({exists:!!store.profile,data:()=>JSON.parse(JSON.stringify(store.profile)),metadata:{fromCache:false}});
  const snapS=()=>{const docs=Object.entries(store.sessions).map(([id,v])=>({id,data:()=>JSON.parse(JSON.stringify(v))}));return {docs,empty:!docs.length,metadata:{fromCache:false}}};
  const profRef={
    set:async p=>{store.profile=JSON.parse(JSON.stringify(p));sets.push(store.profile);setTimeout(()=>pl.forEach(f=>f(snapP())),0)},
    onSnapshot:f=>{pl.push(f);setTimeout(()=>f(snapP()),0);return ()=>{}},
    collection:()=>({onSnapshot:f=>{sl.push(f);setTimeout(()=>f(snapS()),0);return ()=>{}},
      doc:id=>({set:async v=>{store.sessions[id]=JSON.parse(JSON.stringify(v));setTimeout(()=>sl.forEach(f=>f(snapS())),0)},delete:async()=>{delete store.sessions[id]}})})};
  return {store,sets,remote:p=>{store.profile=JSON.parse(JSON.stringify(p));pl.forEach(f=>f(snapP()))},
    claude:{use:async k=>k==='db'?{doc:()=>profRef}:{id:async()=>'u1'}}};
}

function boot(seed,opts={}){
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',beforeParse(w){const RD=w.Date;class FD extends RD{constructor(...a){if(a.length)super(...a);else super(FD.now())}static now(){return NOW}};w.Date=FD;w.ResizeObserver=class{observe(){}disconnect(){}};w.scrollTo=()=>{};if(seed)w.localStorage.setItem('liftlog.v1',JSON.stringify(seed));if(opts.claude)w.claude=opts.claude;w.__e=[];w.addEventListener('error',e=>w.__e.push(e.message))}});
  const w=dom.window,d=w.document;
  const $=s=>d.querySelector(s),tab=async t=>{$(`[data-tab=${t}]`).click();await sleep(15)};
  const store=()=>JSON.parse(w.localStorage.getItem('liftlog.v1')||'null');
  const set=(sel,v,evt)=>{const el=$(sel);el.value=v;el.dispatchEvent(new w.Event(evt||'input',{bubbles:true}))};
  const logW=async(v,date)=>{if(date)set('#bwd',date);set('#bww',v);$('#bwlog').click();await sleep(30)};
  const noNaN=where=>{const t=[...d.body.children].filter(e=>e.tagName!=='SCRIPT').map(e=>e.textContent).join(' ');ok(!/NaN|undefined|Infinity|\[object/.test(t),`${where}: bad text "${(t.match(/.{0,40}(NaN|undefined|Infinity|\[object).{0,20}/)||[''])[0]}"`)};
  allErrors.push(w.__e);
  return {w,d,$,tab,store,set,logW,noNaN};
}
const base=()=>({profile:{start:'2026-11-16',unit:'lb'},sessions:{'2026-11-23_pushA':{date:'2026-11-23',W:2,wk:2,s:'pushA',ex:{'Bench press':[{w:185,r:8}]},updated:1,dur:50}}});

(async()=>{
 // ---------- 1. brand-new user, empty storage: no profile yet ----------
 {const A=boot(null);await sleep(150);
  ok(A.store()===null||!A.store().profile,'storage should start empty');
  for(const t of ['home','today','progress','history'])await A.tab(t);
  A.noNaN('new user');ok(!A.w.__e.length,'new user page errors: '+A.w.__e.join('; '));
  console.log('brand-new user (profile null): all tabs render, no errors');}

 // ---------- 2. months of old-format data plus junk bw/cut values ----------
 {const s=base();
  for(let i=0;i<120;i+=3){const dt=new Date(Date.UTC(2026,6,1+i)).toISOString().slice(0,10);s.sessions[dt+'_legsA']={date:dt,W:0,wk:0,s:'legsA',ex:{'Back squat':[{w:200+i/3,r:5}]},updated:1,dur:45}}
  s.profile.bw=[null,'x',{d:'bad',w:180},{d:'2026-11-18',w:'abc'},{d:'2026-11-19',w:'179.5'},{d:'2026-11-20',w:80,u:'kg'},{d:'2026-11-21',w:-5},{d:'2026-11-22',w:178,u:'stone'}];
  s.profile.cut={goal:'abc',u:'lb',by:'2027-06-01'};
  const A=boot(s);await sleep(150);
  for(const t of ['home','today','progress','history'])await A.tab(t);A.$('.gear').click();await sleep(10);
  await A.tab('progress');A.noNaN('junk bw');
  const rows=[...A.d.querySelectorAll('.bwrow b')].map(b=>b.textContent);console.log('junk data recent list:',rows.join(' / '));
  ok(rows.length===3,'expected 3 valid weigh-ins from junk list, got '+rows.length);
  ok(rows.includes('176.4 lb'),'80 kg entry should show as 176.4 lb');
  ok(!A.$('.bwgoal'),'invalid cut.goal should not show a goal line');
  // logging on top of junk keeps the junk entries untouched (no rewrite) and adds the new one
  await A.logW('177.8');const bw=A.store().profile.bw;
  ok(bw.length===9&&bw.some(e=>e&&e.d==='2026-11-24'&&e.w===177.8&&e.u==='lb'),'log on top of junk: '+JSON.stringify(bw));
  ok(JSON.stringify(A.store().sessions)===JSON.stringify(s.sessions),'sessions changed by bodyweight logging');
  console.log('old data (40 sessions) + junk bw/cut: renders, no NaN, sessions untouched');
  // bw stored as a non-array object
  const s2=base();s2.profile.bw={d:'2026-11-24',w:180};s2.profile.cut='165';const B=boot(s2);await sleep(150);await B.tab('progress');await B.tab('home');B.noNaN('bw object');
  ok(B.$('[data-bwfocus]'),'bw object should be treated as empty');console.log('bw as object / cut as string: treated as empty, no errors');}

 // ---------- 3. kg user: range, stored unit, letters ----------
 {const s=base();s.profile.unit='kg';const A=boot(s);await A.tab('progress');await sleep(100);await A.tab('progress');
  ok(A.$('label[for=bww]').textContent==='Morning weight (kg)','kg label');
  await A.logW('400');ok(!A.store().profile.bw&&/between 14 and 318 kg/.test(A.$('#bwmsg').textContent),'400 kg accepted');
  await A.logW('abc');ok(!A.store().profile.bw,'letters accepted');
  await A.logW('1e3');ok(!A.store().profile.bw,'1e3 accepted');
  await A.logW('82.55');let bw=A.store().profile.bw;ok(bw.length===1&&bw[0].u==='kg'&&bw[0].w===82.6,'kg entry: '+JSON.stringify(bw));
  // switch to lb: shows 182.1 lb, stored entry unchanged
  A.$('.gear').click();await sleep(10);A.set('#unit','lb','change');await sleep(20);await A.tab('progress');
  ok(/182\.1 lb/.test(A.$('.bwrow').textContent),'kg→lb display: '+A.$('.bwrow').textContent);
  ok(A.store().profile.bw[0].w===82.6&&A.store().profile.bw[0].u==='kg','stored kg entry rewritten');
  // goal saved in kg, viewed in lb
  A.$('.gear').click();await sleep(10);A.set('#unit','kg','change');await sleep(20);await A.tab('progress');
  A.set('#bwgoal','75');A.set('#bwby','2027-06-01');A.$('#bwgoalsave').click();await sleep(20);
  ok(JSON.stringify(A.store().profile.cut)==='{"goal":75,"u":"kg","by":"2027-06-01"}','kg goal: '+JSON.stringify(A.store().profile.cut));
  A.$('.gear').click();await sleep(10);A.set('#unit','lb','change');await sleep(20);await A.tab('progress');
  ok(/Goal: 165\.3 lb/.test(A.$('.bwgoal').textContent),'kg goal in lb: '+A.$('.bwgoal').textContent);A.noNaN('kg');
  console.log('kg user: range 14–318, letters/1e3 rejected, stored in kg, shown in lb as',A.$('.bwrow b').textContent,'| goal line:',A.$('.bwgoal').textContent);}

 // ---------- 4. goal edge cases ----------
 {const s=base();s.profile.bw=[{d:'2026-11-24',w:180,u:'lb'}];const A=boot(s);await sleep(150);await A.tab('progress');
  A.set('#bwgoal','165');A.set('#bwby','2026-11-24');A.$('#bwgoalsave').click();await sleep(20);ok(!A.store().profile.cut,'goal date of today accepted');
  A.set('#bwgoal','');A.set('#bwby','2027-06-01');A.$('#bwgoalsave').click();await sleep(20);ok(!A.store().profile.cut,'empty goal accepted');
  A.set('#bwgoal','abc');A.$('#bwgoalsave').click();await sleep(20);ok(!A.store().profile.cut,'letters goal accepted');
  // goal date already passed (old data)
  const s2=base();s2.profile.bw=[{d:'2026-11-24',w:180,u:'lb'}];s2.profile.cut={goal:165,u:'lb',by:'2026-11-01'};const B=boot(s2);await sleep(150);await B.tab('progress');
  ok(/passed/.test(B.$('.bwgoal').textContent)&&!/needs/.test(B.$('.bwgoal').textContent),'passed goal: '+B.$('.bwgoal').textContent);
  // trend within 0.2 of the goal (Product Lead decision on QA item 1: "You're at your goal.")
  const s3=base();s3.profile.bw=[{d:'2026-11-24',w:165.1,u:'lb'}];s3.profile.cut={goal:165,u:'lb',by:'2027-06-01'};const C=boot(s3);await sleep(150);await C.tab('progress');
  ok(/You're at your goal\./.test(C.$('.bwgoal').textContent)&&!C.$('#bwsec .hint.plat'),'reached goal: '+C.$('.bwgoal').textContent);
  // no weigh-ins yet but a goal
  const s4=base();s4.profile.cut={goal:165,u:'lb',by:'2027-06-01'};const D=boot(s4);await sleep(150);await D.tab('progress');D.noNaN('goal no weigh-ins');
  ok(/log a weigh-in/.test(D.$('.bwgoal').textContent),'goal without weigh-ins: '+D.$('.bwgoal').textContent);
  console.log('goal: today/empty/letters rejected; passed, reached and no-weigh-in messages ok');}

 // ---------- 5. 20 weigh-ins: Recent shows 7 newest first, chart only plots last 56 days ----------
 {const s=base();s.profile.bw=Array.from({length:80},(_,i)=>{const dt=new Date(Date.UTC(2026,8,6+i));return {d:dt.toISOString().slice(0,10),w:+(190-i*0.12).toFixed(1),u:'lb'}});
  const A=boot(s);await sleep(150);await A.tab('progress');
  const dates=[...A.d.querySelectorAll('[data-bwdel]')].map(b=>b.dataset.bwdel);
  ok(dates.length===7&&dates[0]==='2026-11-24'&&dates[6]==='2026-11-18','recent list: '+dates);
  const dots=A.d.querySelectorAll('#bwchart .bwdot').length;ok(dots===56,'chart dots in last 56 days: '+dots);
  console.log('80 weigh-ins: Recent =',dates.length,'newest first; chart dots =',dots);}

 // ---------- 6. hosted db: bw/cut sync and render guard while typing ----------
 {const s=base();const F=fakeDb(s.profile);const A=boot(null,{claude:F.claude});await sleep(200);await A.tab('progress');
  ok(A.$('#bwsec'),'hosted: bodyweight section missing');
  await A.logW('180.4');await sleep(20);
  let last=F.sets[F.sets.length-1];ok(last&&JSON.stringify(last.bw)==='[{"d":"2026-11-24","w":180.4,"u":"lb"}]','hosted: bw not sent to db: '+JSON.stringify(last));
  A.set('#bwgoal','165');A.set('#bwby','2027-06-01');A.$('#bwgoalsave').click();await sleep(30);
  ok(F.store.profile.cut&&F.store.profile.cut.goal===165,'hosted: cut not synced');
  A.$('#bwgoalclr').click();await sleep(30);ok(!('cut' in F.store.profile),'hosted: clear goal left cut in db: '+JSON.stringify(F.store.profile.cut));
  ok(/180\.4 lb/.test(A.$('.bwrow').textContent),'hosted: entry not shown after snapshot');
  // another device adds a weigh-in while the user is typing in #bww
  const inp=A.$('#bww');inp.focus();inp.value='179.9';inp.dispatchEvent(new A.w.Event('input',{bubbles:true}));
  F.remote(Object.assign({},F.store.profile,{bw:[{d:'2026-11-23',w:181,u:'lb'},{d:'2026-11-24',w:180.4,u:'lb'}]}));await sleep(20);
  ok(A.$('#bww')===inp&&inp.value==='179.9','render guard: typed weight was wiped by a sync render');
  inp.blur();await sleep(30);ok(A.d.querySelectorAll('.bwrow').length===2,'deferred render did not run after blur');
  ok(!A.w.__e.length,'hosted errors: '+A.w.__e.join('; '));
  console.log('hosted db: bw and cut sync, clear goal removes cut in db, typing survives a remote snapshot');}

 // ---------- 7. Fix 1: default gear numbers pinned to main, odd plate lists ----------
 const legs=()=>{const ses={};const add=(date,ex)=>{ses[date+'_legsA']={date,W:0,wk:0,s:'legsA',ex,updated:1,dur:50}};
  add('2026-11-10',{'Back squat':[{w:227,r:7,e:8.5}],'Leg press':[{w:313,r:12}],'Romanian deadlift':[{w:193,r:10}]});
  add('2026-11-17',{'Back squat':[{w:247,r:6,e:8}],'Leg press':[{w:333,r:12}],'Romanian deadlift':[{w:203,r:9}]});return ses};
 const view=async profile=>{const A=boot({profile,sessions:legs()});await sleep(150);await A.tab('today');A.$('[data-s=legsA]').click();await sleep(20);
  for(const t of A.d.querySelectorAll('[data-wu]'))t.click();await sleep(10);
  return [...A.d.querySelectorAll('.card[data-card]')].map(c=>({n:c.querySelector('h3').textContent,ph:[...c.querySelectorAll('input[data-f=w]')].map(i=>i.placeholder).filter(Boolean).map(Number),wu:[...c.querySelectorAll('.wurow b')].map(b=>b.textContent),sug:(c.querySelector('.sug')||{}).textContent||''}))};
 const fmt=cs=>cs.filter(c=>c.ph.length).map(c=>`${c.n}: ${c.ph[0]} [${c.wu.join(', ')}]`).join(' | ');
 {// Printed by main (before the change) for this fixture; default gear must not move.
  const lb=fmt(await view({start:'2026-11-02',unit:'lb'})),kg=fmt(await view({start:'2026-11-02',unit:'kg'}));
  console.log('default lb:',lb);console.log('default kg:',kg);
  const MAIN_LB='Back squat: 240 [Bar × 10, 95 lb × 5, 145 lb × 3, 190 lb × 2] | Romanian deadlift: 195 [Bar × 10, 80 lb × 5, 115 lb × 3, 155 lb × 2] | Leg press: 325 []',MAIN_KG='Back squat: 240 [Bar × 10, 95 kg × 5, 145 kg × 3, 192.5 kg × 2] | Romanian deadlift: 192.5 [Bar × 10, 77.5 kg × 5, 115 kg × 3, 155 kg × 2] | Leg press: 325 []';
  ok(lb===MAIN_LB,'default lb gear changed vs main:\n  main: '+MAIN_LB+'\n  now:  '+lb);
  ok(kg===MAIN_KG,'default kg gear changed vs main:\n  main: '+MAIN_KG+'\n  now:  '+kg);}
 {// only 45 lb plates: barbell steps of 90 from the bar
  const cs=await view({start:'2026-11-02',unit:'lb',gear:{lb:{bar:45,plates:[45]}}});
  for(const c of cs)if(/squat|deadlift/i.test(c.n)&&c.ph.length){ok(c.ph.every(v=>(v-45)%90===0),`${c.n} with only 45s: ${c.ph}`);ok(!/short/.test(c.sug),`${c.n} load short with only 45s`)}
  console.log('only 45s:',fmt(cs));}
 {// 15 kg bar, smallest plate 2.5 kg: barbell steps of 5 from 15
  const cs=await view({start:'2026-11-02',unit:'kg',gear:{kg:{bar:15,plates:[20,10,5,2.5]}}});
  for(const c of cs)if(/squat|deadlift/i.test(c.n)&&c.ph.length){const vals=[...c.ph,...c.wu.filter(t=>!t.startsWith('Bar')).map(parseFloat)];ok(vals.every(v=>Math.abs((v-15)/5-Math.round((v-15)/5))<1e-9),`${c.n} 15 kg bar: ${vals}`);ok(!/short/.test(c.sug),`${c.n} load short 15 kg bar`)}
  const lp=cs.find(c=>c.n==='Leg press');ok(lp.ph.every(v=>Math.abs(v/2.5-Math.round(v/2.5))<1e-9),'leg press kg not 2.5 steps');
  console.log('15 kg bar + 2.5 kg plates:',fmt(cs));}
 {// unusual plate lists Settings can save (it filters to 0 < p <= 100): no NaN
  for(const plates of [[2.5],[100,0.5],[45,0.25]]){const cs=await view({start:'2026-11-02',unit:'lb',gear:{lb:{bar:45,plates}}});
   for(const c of cs)ok(c.ph.every(v=>Number.isFinite(v))&&!/NaN/.test(c.sug),`plates ${JSON.stringify(plates)} gave NaN in ${c.n}`)}
  console.log('odd plate lists ([2.5], [100,0.5], [45,0.25]): no NaN');}

 const errs=allErrors.flat();
 console.log('errors',errs);
 if(errs.length)fail('page errors: '+errs.join('; '));
 console.log('ALL BODYWEIGHT EDGE CASES PASSED');process.exit(0)})().catch(e=>{console.log(e.message);process.exit(1)});
