// Bodyweight and cut tracker (profile.bw / profile.cut) plus loadable barbell rounding.
// Fixed date: Tuesday 2026-11-24.
const {JSDOM}=require('jsdom');
const html=require('fs').readFileSync(require('path').join(__dirname,'..','src','index.html'),'utf8');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const NOW=new Date('2026-11-24T08:00:00').getTime();
const fail=m=>{throw new Error('FAILED: '+m)};
const ok=(c,m)=>{if(!c)fail(m)};
const allErrors=[];
function boot(seed){
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',beforeParse(w){const RD=w.Date;class FD extends RD{constructor(...a){if(a.length)super(...a);else super(FD.now())}static now(){return w.__now||NOW}};w.Date=FD;w.ResizeObserver=class{observe(){}disconnect(){}};w.scrollTo=()=>{};w.localStorage.setItem('liftlog.v1',JSON.stringify(seed));w.__now=NOW;w.__e=[];w.addEventListener('error',e=>w.__e.push(e.message))}});
  const w=dom.window,d=w.document;
  const $=s=>d.querySelector(s),tab=async t=>{$(`[data-tab=${t}]`).click();await sleep(15);if(t==='progress'){const b=$('[data-pseg=body]');if(b){b.click();await sleep(15)}}};
  const store=()=>JSON.parse(w.localStorage.getItem('liftlog.v1'));
  const set=(sel,v,evt)=>{const el=$(sel);el.value=v;el.dispatchEvent(new w.Event(evt||'input',{bubbles:true}))};
  const logW=async(v,date)=>{if(date)set('#bwd',date);set('#bww',v);$('#bwlog').click();await sleep(20)};
  allErrors.push(w.__e);
  return {w,d,$,tab,store,set,logW};
}
const base=()=>({profile:{start:'2026-11-16',unit:'lb'},sessions:{'2026-11-23_pushA':{date:'2026-11-23',W:2,wk:2,s:'pushA',ex:{'Bench press':[{w:185,r:8}]},updated:1,dur:50}}});
const series=(step)=>Array.from({length:14},(_,i)=>{const dt=new Date(Date.UTC(2026,10,11+i));return {d:dt.toISOString().slice(0,10),w:+(180+step*i).toFixed(1),u:'lb'}});
const ema=a=>{let t=null;for(const e of a)t=t==null?e.w:t+0.1*(e.w-t);return t};

(async()=>{
 // ---------- 1. old data, Home button, logging, validation, remove ----------
 {const A=boot(base());await sleep(200);
  for(const t of ['home','today','progress','history'])await A.tab(t);A.$('.gear').click();await sleep(10);
  ok(A.$('#unit'),'settings did not render');
  console.log('old data renders all tabs, errors so far:',A.w.__e.length);
  await A.tab('home');
  const hb=A.$('[data-bwfocus]');ok(hb&&/Log today's weight/.test(hb.textContent)&&hb.dataset.gotab==='progress','home log button missing');
  console.log('home card:',A.$('.bwhome').textContent.replace(/\s+/g,' ').trim());
  hb.click();await sleep(20);
  ok(A.$('[data-tab=progress]').getAttribute('aria-current')==='true','home button did not open Progress');
  ok(A.d.activeElement&&A.d.activeElement.id==='bww','#bww not focused');
  const sec=A.$('#bwsec');ok(sec&&A.$('#main').firstElementChild.classList.contains('seg')&&A.$('#main').children[1]===sec&&A.$('[data-pseg=body]').getAttribute('aria-selected')==='true','Home button should open Progress on the Body view with the Bodyweight section first');
  ok(A.$('#bww').type==='number'&&A.$('#bww').getAttribute('inputmode')==='decimal','weight input attrs');
  ok(A.$('label[for=bww]').textContent==='Morning weight (lb)','weight label');
  ok(A.$('#bwd').type==='date'&&A.$('#bwd').value==='2026-11-24'&&A.$('#bwd').max==='2026-11-24','date input default/max');
  await A.logW('180.4');
  let bw=A.store().profile.bw;console.log('after 180.4:',JSON.stringify(bw));
  ok(JSON.stringify(bw)===JSON.stringify([{d:'2026-11-24',w:180.4,u:'lb'}]),'180.4 not saved as expected');
  await A.logW('180.0');bw=A.store().profile.bw;
  ok(bw.length===1&&bw[0].w===180,'same-date log did not replace');
  await A.logW('181.2','2026-11-20');bw=A.store().profile.bw;console.log('after past date:',JSON.stringify(bw));
  ok(bw.length===2&&bw[0].d==='2026-11-20'&&bw[1].d==='2026-11-24','past date not added in order');
  for(const v of ['0','5','900','']){await A.logW(v,'2026-11-22');const m=A.$('#bwmsg');ok(m&&/between 30 and 700/.test(m.textContent),'no message for '+JSON.stringify(v));ok(A.store().profile.bw.length===2,'saved invalid '+JSON.stringify(v))}
  await A.logW('179','2026-11-25');ok(/future/.test(A.$('#bwmsg').textContent)&&A.store().profile.bw.length===2,'future date accepted');
  console.log('rejects 0/5/900/empty/future: ok · last message:',A.$('#bwmsg').textContent);
  // disclaimer and wording
  const txt=A.$('#main').textContent;
  ok(/Rate colours follow research guidelines for keeping strength while cutting \(about 0\.5–1% of bodyweight a week\)\. This is training guidance, not medical or diet advice\./.test(txt),'disclaimer missing');
  ok(!/calori|macro/i.test(A.d.body.textContent)&&!/diet(?! advice)/i.test(A.d.body.textContent),'calorie/macro/diet wording found');
  // chart
  const ch=A.$('#bwchart');ok(ch.getAttribute('role')==='img'&&ch.getAttribute('aria-label'),'chart a11y');
  ok(ch.querySelectorAll('.bwdot').length===2&&ch.querySelector('.bwtrend'),'chart dots/trend');
  // home after logging
  await A.tab('home');const hc=A.$('.bwhome').textContent.replace(/\s+/g,' ');console.log('home after log:',hc.trim());
  ok(/180\.0 lb today · trend 181\.1 lb/.test(hc)&&!A.$('[data-bwfocus]'),'home does not show today');
  // remove needs two taps
  await A.tab('progress');let rm=A.$('[data-bwdel="2026-11-20"]');rm.click();await sleep(15);
  rm=A.$('[data-bwdel="2026-11-20"]');ok(rm.textContent==='Confirm'&&A.store().profile.bw.length===2,'first tap removed it');
  rm.click();await sleep(15);bw=A.store().profile.bw;ok(bw.length===1&&bw[0].d==='2026-11-24','second tap did not remove');
  console.log('remove: two taps ok →',JSON.stringify(bw));
  // rate placeholder with < 4 weigh-ins
  ok(/Log 4 weigh-ins over a week to see your rate\./.test(A.$('#bwrate').textContent)&&!A.$('#bwrate b'),'rate placeholder');
 }
 // ---------- 2. rate, trend, colours ----------
 for(const [step,pct,cls,wk] of [[-0.2,0.78,'warn','−1.4'],[-0.1,0.39,'good','−0.7'],[-0.3,1.18,'pain','−2.1']]){
  const s=base(),bw=series(step);s.profile.bw=bw;const A=boot(s);await sleep(150);await A.tab('progress');
  const r=A.$('#bwrate'),t=r.textContent,m=t.match(/([\d.]+)%\/wk/);
  ok(t.includes(wk+' lb/wk'),`rate lb/wk for ${step}: ${t}`);ok(m&&Math.abs(+m[1]-pct)<=0.02,`rate % for ${step}: ${t}`);ok(r.classList.contains(cls),`rate class for ${step}: ${r.className}`);
  const trend=A.$('#bwsec .pr b').textContent;ok(trend===ema(bw).toFixed(1)+' lb',`trend ${trend} vs ${ema(bw).toFixed(1)}`);
  console.log(`step ${step}/day → rate "${t.replace(/\s+/g,' ').trim()}" class=${cls} trend=${trend} (EMA ${ema(bw).toFixed(3)})`);
 }
 {const s=base();s.profile.bw=series(-0.2).slice(-3);const A=boot(s);await sleep(150);await A.tab('progress');
  ok(/Log 4 weigh-ins/.test(A.$('#bwrate').textContent)&&!/lb\/wk/.test(A.$('#bwrate').textContent),'3 weigh-ins showed a rate');console.log('3 weigh-ins → placeholder ok');}
 // ---------- 3. goal ----------
 {const s=base();s.profile.bw=[{d:'2026-11-24',w:180,u:'lb'}];const A=boot(s);await sleep(150);await A.tab('progress');
  A.set('#bwgoal','165');A.set('#bwby','2027-06-01');A.$('#bwgoalsave').click();await sleep(20);
  const cut=A.store().profile.cut;ok(cut&&cut.goal===165&&cut.u==='lb'&&cut.by==='2027-06-01','cut not saved: '+JSON.stringify(cut));
  let g=A.$('.bwgoal').textContent;console.log('goal 1:',g);
  ok(/Goal: 165 lb by Jun 1 · needs 0\.5[5-7] lb\/wk \(0\.3[0-2]%\/wk\)/.test(g),'goal text');ok(!A.$('#bwsec .hint.plat'),'unexpected warning');
  A.set('#bwgoal','165');A.set('#bwby','2027-01-05');A.$('#bwgoalsave').click();await sleep(20);
  console.log('goal 2:',A.$('.bwgoal').textContent,'|',A.$('#bwsec .hint.plat')&&A.$('#bwsec .hint.plat').textContent);
  ok(A.$('#bwsec .hint.plat')&&/faster than 1% a week/.test(A.$('#bwsec .hint.plat').textContent),'fast-goal warning missing');
  A.$('#bwgoalclr').click();await sleep(20);ok(!('cut' in A.store().profile)&&!A.$('.bwgoal'),'clear goal did not remove cut');console.log('clear goal → cut removed');
  // ---------- 4. units ----------
  A.$('.gear').click();await sleep(10);A.set('#unit','kg','change');await sleep(20);await A.tab('progress');
  const row=A.$('.bwrow').textContent;console.log('kg view:',row.replace(/\s+/g,' ').trim(),'| stored:',JSON.stringify(A.store().profile.bw));
  ok(/81\.6 kg/.test(row),'kg conversion');ok(A.store().profile.bw[0].w===180&&A.store().profile.bw[0].u==='lb','stored entry changed');
  ok(A.$('label[for=bww]').textContent==='Morning weight (kg)','kg label');
  // ---------- 5. backup / restore ----------
  A.$('.gear').click();await sleep(10);A.$('#copy').click();await sleep(20);
  const bk=JSON.parse(A.$('#io').value);ok(Array.isArray(bk.profile.bw)&&bk.profile.bw.length===1,'copy lacks bw');
  const restore=async j=>{A.$('#io').value=JSON.stringify(j);A.$('#imp').click();await sleep(10);A.$('#imp').click();await sleep(30)};
  await restore({profile:{start:'2026-11-16',unit:'lb'},sessions:{}});ok(A.store().profile.bw&&A.store().profile.bw.length===1,'restore without bw wiped bw');
  await restore({profile:{start:'2026-11-16',unit:'lb',bw:[{d:'2026-11-01',w:185,u:'lb'},{d:'2026-11-02',w:184,u:'lb'}]},sessions:{}});
  ok(A.store().profile.bw.length===2&&A.store().profile.bw[0].d==='2026-11-01','restore with bw did not bring it back');
  console.log('backup includes bw; restore without bw keeps it; restore with bw replaces it: ok');
  // ---------- layout (CSS rules; jsdom has no layout engine) ----------
  await A.tab('progress');
  for(const sel of ['#bww','#bwd','#bwgoal','#bwby','#bwlog','#bwgoalsave','#bwgoalclr','.bwrow .btn']){const el=A.$(sel);if(!el)continue;const mh=parseFloat(A.w.getComputedStyle(el).minHeight);ok(mh>=44,`${sel} min-height ${mh}`)}
  ok(A.d.documentElement.scrollWidth<=390,'horizontal scroll');console.log('min-height >= 44px on bodyweight inputs/buttons (computed CSS): ok');
 }
 // ---------- 6. Fix 1: loadable barbell weights ----------
 const legs=()=>{const ses={};const add=(date,ex)=>{ses[date+'_legsA']={date,W:0,wk:0,s:'legsA',ex,updated:1,dur:50}};
  add('2026-11-03',{'Back squat':[{w:225,r:8}],'Leg press':[{w:300,r:12}],'Romanian deadlift':[{w:185,r:10}]});
  add('2026-11-10',{'Back squat':[{w:235,r:8}],'Leg press':[{w:320,r:12}],'Romanian deadlift':[{w:195,r:10}]});
  add('2026-11-14',{'Back squat':[{w:230,r:8}],'Leg press':[{w:310,r:12}],'Romanian deadlift':[{w:190,r:10}]});
  add('2026-11-17',{'Back squat':[{w:230,r:8}],'Leg press':[{w:315,r:12}],'Romanian deadlift':[{w:190,r:10}]});return ses};
 const legsView=async(profile)=>{const A=boot({profile,sessions:legs()});await sleep(150);await A.tab('today');A.$('[data-s=legsA]').click();await sleep(20);
  const cards=[...A.d.querySelectorAll('.card[data-card]')].map(c=>({n:c.querySelector('h3').textContent,sug:c.querySelector('.sug b')&&parseFloat(c.querySelector('.sug b').textContent),ph:[...c.querySelectorAll('input[data-f=w]')].map(i=>+i.placeholder).filter(v=>v>0),wu:[...c.querySelectorAll('.wurow b')].map(b=>b.textContent),load:(c.querySelector('.sug .meta')||{}).textContent||'',hint:(c.querySelector('.hint.plat')||{}).textContent||''}));return {A,cards}};
 {const {cards}=await legsView({start:'2026-11-02',unit:'lb'});
  const sq=cards.find(c=>c.n==='Back squat'),lp=cards.find(c=>c.n==='Leg press');
  console.log('default lb squat:',sq.sug,sq.ph.join(','),'| warm-ups:',sq.wu.join(' / '),'|',sq.load);
  console.log('plateau hints:',sq.hint,'||',lp.hint);
  ok(/add just 5 lb \(2\.5 per side\)/.test(sq.hint),'barbell plateau hint');ok(/add just 2\.5 lb instead/.test(lp.hint),'non-barbell plateau hint changed');
  ok(sq.sug%5===0&&lp.sug%5===0,'default gear not multiple of 5');}
 {const {cards}=await legsView({start:'2026-11-02',unit:'lb',gear:{lb:{bar:45,plates:[45,25,10,5]}}});
  for(const c of cards){if(!c.sug)continue;const bar=/squat|deadlift/i.test(c.n)&&!/leg press/i.test(c.n);
   const vals=[c.sug,...c.ph,...c.wu.map(t=>t.startsWith('Bar')?45:parseFloat(t))];
   if(bar){ok(vals.every(v=>(v-45)%10===0),`${c.n} not 45+10k: ${vals}`);ok(!/short/.test(c.load),`${c.n} load short: ${c.load}`);console.log(`plates 45/25/10/5 · ${c.n}: ${vals.join(', ')} · ${c.load}`)}
   else{ok(vals.every(v=>v%5===0),`${c.n} not multiple of 5: ${vals}`);console.log(`plates 45/25/10/5 · ${c.n} (not barbell): ${vals.join(', ')}`)}}
  const sq=cards.find(c=>c.n==='Back squat');ok(/add just 10 lb \(5 per side\)/.test(sq.hint),'plateau hint with 5 lb plates');}
 {const {cards}=await legsView({start:'2026-11-02',unit:'kg'});
  for(const c of cards){if(!c.sug)continue;const vals=[c.sug,...c.ph];ok(vals.every(v=>Math.abs(v/2.5-Math.round(v/2.5))<1e-9),`kg ${c.n}: ${vals}`)}
  console.log('kg default:',cards.filter(c=>c.sug).map(c=>c.n+' '+c.sug).join(' / '));}
 const errs=allErrors.flat();
 console.log('errors',errs);
 if(errs.length)fail('page errors: '+errs.join('; '));
 console.log('ALL BODYWEIGHT TRACKER CHECKS PASSED');process.exit(0)})().catch(e=>{console.log(e.message);process.exit(1)});
