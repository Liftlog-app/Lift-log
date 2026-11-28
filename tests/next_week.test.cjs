// Bug fix: after every Week 1 workout is done, Home and the Workout tab move on to Week 2 (and Week 3 after Week 2),
// every week's workouts can be started, and sessions are tagged to the week they were done for.
const {JSDOM}=require('jsdom');
const html=require('fs').readFileSync(require('path').join(__dirname,'..','src','index.html'),'utf8');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ok=(c,m)=>{if(!c)throw new Error('FAILED: '+m);console.log('ok  ',m)};
const DAYS=['pushA','pullA','legsA','pushB','pullB','legsB'];
const sess=(date,s,W,extra)=>Object.assign({date,W,wk:W,s,ex:{'Bench press':[{w:135,r:8}]},updated:1,start:1,end:2,dur:50},extra||{});
function boot(seed,now){
  return new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',beforeParse(w){const RD=w.Date;class FD extends RD{constructor(...a){if(a.length)super(...a);else super(FD.now())}static now(){return w.__now||new RD(now).getTime()}};w.Date=FD;w.ResizeObserver=class{observe(){}disconnect(){}};w.scrollTo=()=>{};w.localStorage.setItem('liftlog.v1',JSON.stringify(seed));w.__e=[];w.addEventListener('error',e=>w.__e.push(e.message))}}).window;
}
const txt=(d,q)=>{const e=d.querySelector(q);return e?e.textContent:''};
const blockCard=d=>{const c=[...d.querySelectorAll('.hcard')].find(x=>x.querySelector('.bar15'));return c?c.textContent:''};
const store=w=>JSON.parse(w.localStorage.getItem('liftlog.v1'));
async function logAndEnd(w,d,weight){
  const ev=(el,t)=>el.dispatchEvent(new w.Event(t,{bubbles:true}));
  d.querySelector('[data-wstart]').click();await sleep(40);
  const wi=d.querySelector('.card[data-card="0"] input[data-f=w][data-k="0"]'),ri=d.querySelector('.card[data-card="0"] input[data-f=r][data-k="0"]');
  wi.value=String(weight);ev(wi,'input');ri.value='8';ev(ri,'input');ev(ri,'change');await sleep(1400);
  w.__now+=40*60e3;d.querySelector('[data-wend="2"]').click();await sleep(10);d.querySelector('[data-wend="2"]').click();await sleep(60);
}
(async()=>{
 // ---------- Scenario 1: all of Week 1 done early (Mon-Thu), today is Fri of calendar week 1. Old-format sessions (no pw).
 {const s1={};const dates=['2026-11-23','2026-11-24','2026-11-24','2026-11-25','2026-11-26','2026-11-26'];
  DAYS.forEach((k,i)=>{s1[`${dates[i]}_${k}`]=sess(dates[i],k,1,{updated:i+1})});
  const seed={profile:{start:'2026-11-23',unit:'lb',ready:{date:'2026-11-27',sl:4,so:4,en:4}},sessions:s1};
  const w=boot(seed,'2026-11-27T17:00:00'),d=w.document;w.__now=new w.Date('2026-11-27T17:00:00').getTime();await sleep(300);
  d.querySelector('[data-tab=home]').click();await sleep(20);
  ok(/Week 2 of 15/.test(blockCard(d)),'Home week card says Week 2 of 15');
  const segs=[...d.querySelectorAll('.bar15 i')];ok(segs[1].classList.contains('now')&&segs[0].classList.contains('past'),'Home bar marks Week 1 past and Week 2 now');
  ok(/Week 2/.test(txt(d,'.hero .eyebrow')),'Home next-workout card is Week 2: '+txt(d,'.hero .eyebrow'));
  ok(/Push A/i.test(txt(d,'.hero h2')),'Home next workout is the first day of Week 2: '+txt(d,'.hero h2'));
  d.querySelector('[data-tab=today]').click();await sleep(20);
  ok(/Week 2/.test(txt(d,'.head .meta')),'Workout banner says Week 2: '+txt(d,'.head .meta'));
  ok(txt(d,'.strip .now')==='2','strip marks Week 2 as this week');
  ok(![...d.querySelectorAll('.chip')].some(c=>c.classList.contains('done')),'Week 2 day list has no checkmarks yet');
  ok(!!d.querySelector('[data-wstart]'),'Start workout button is there for Week 2');
  const rpe2=7.5;/* RPE table in src/index.html: week 2 = 7.5, week 4 = 9 */ok(txt(d,'.card[data-card="0"] .meta').includes('RPE '+rpe2),`targets are Week 2's (RPE ${rpe2}): `+txt(d,'.card[data-card="0"] .meta').slice(0,40));
  await logAndEnd(w,d,140);
  let st=store(w),s=st.sessions['2026-11-27_pushA'];
  ok(s&&s.W===2&&s.wk===2&&s.pw===2&&!s.live&&s.dur>0&&s.ex['Bench press'],'ended Week 2 Push A saved tagged to Week 2: '+JSON.stringify(s&&{W:s.W,wk:s.wk,pw:s.pw,dur:s.dur}));
  ok(Object.keys(st.sessions).length===7&&DAYS.every(k=>Object.values(st.sessions).some(x=>x.s===k&&x.W===1)),'Week 1 sessions are untouched');
  ok(d.querySelector('[data-s=pushA]').classList.contains('done'),'Push A is checked for Week 2');
  ok(!d.querySelector('[data-s=pullA]').classList.contains('done'),'Pull A is not checked for Week 2');
  // look back at Week 1
  d.querySelector('[data-wnav="-7"]').click();await sleep(20);
  ok(/Week 1/.test(txt(d,'.head .meta')),'previous-week arrow shows Week 1: '+txt(d,'.head .meta'));
  ok([...d.querySelectorAll('.chip')].every(c=>c.classList.contains('done')),'Week 1 day list is all checked');
  d.querySelector('[data-wnav="7"]').click();await sleep(20);
  ok(/Week 2/.test(txt(d,'.head .meta'))&&d.querySelector('[data-s=pushA]').classList.contains('done'),'next-week arrow returns to Week 2');
  // look ahead and start a future week (rule: this and future weeks open on today and can be started)
  d.querySelector('[data-jw="4"]').click();await sleep(20);d.querySelector('[data-s=pushA]').click();await sleep(20);
  ok(/Week 4/.test(txt(d,'.head .meta')),'strip opens Week 4: '+txt(d,'.head .meta'));
  ok([...d.querySelectorAll('.stp')].some(b=>/Looking ahead to Week 4/.test(b.textContent)),'Week 4 shows a looking-ahead pill');
  ok(!!d.querySelector('[data-wstart]'),'Start workout button is there for future Week 4');
  ok(txt(d,'.card[data-card="0"] .meta').includes('RPE 9'),'Week 4 shows Week 4 targets');
  await logAndEnd(w,d,150);
  st=store(w);const f=Object.values(st.sessions).find(x=>x.s==='pushA'&&x.W===4);
  ok(f&&f.pw===4&&f.date==='2026-11-27'&&!f.live,'future Week 4 Push A saved today tagged to Week 4');
  ok(st.sessions['2026-11-27_pushA'].W===2&&st.sessions['2026-11-27_pushA'].ex['Bench press'][0].w===140,'same-day Week 2 Push A was not overwritten');
  d.querySelector('[data-tab=home]').click();await sleep(20);
  ok(/Week 2 of 15/.test(blockCard(d)),'Home still on Week 2 (Week 2 is not finished)');
  console.log('errors',w.__e);if(w.__e.length)process.exit(1);
 }
 // ---------- Scenario 2: Weeks 1 and 2 both complete -> Week 3. Week 2 partly done early (pw) and partly in its calendar week.
 {const s2={};const d1=['2026-11-23','2026-11-24','2026-11-24','2026-11-25','2026-11-26','2026-11-26'],d2=['2026-11-27','2026-11-28','2026-11-29','2026-11-30','2026-12-01','2026-12-01'];
  DAYS.forEach((k,i)=>{s2[`${d1[i]}_${k}`]=sess(d1[i],k,1)});
  DAYS.forEach((k,i)=>{s2[`${d2[i]}_${k}`]=sess(d2[i],k,2,d2[i]<'2026-11-30'?{pw:2}:{})});
  const seed={profile:{start:'2026-11-23',unit:'lb',ready:{date:'2026-12-02',sl:4,so:4,en:4}},sessions:s2};
  const w=boot(seed,'2026-12-02T17:00:00'),d=w.document;w.__now=new w.Date('2026-12-02T17:00:00').getTime();await sleep(300);
  d.querySelector('[data-tab=home]').click();await sleep(20);
  ok(/Week 3 of 15/.test(blockCard(d)),'Home shows Week 3 of 15 after Weeks 1 and 2');
  d.querySelector('[data-tab=today]').click();await sleep(20);
  ok(txt(d,'.strip .now')==='3'&&/Week 3/.test(txt(d,'.head .meta')),'Workout tab shows Week 3: '+txt(d,'.head .meta'));
  ok(!!d.querySelector('[data-wstart]'),'Start workout button is there for Week 3');
  d.querySelector('[data-jw="2"]').click();await sleep(20);
  ok([...d.querySelectorAll('.chip')].every(c=>c.classList.contains('done')),'Week 2 checkmarks include the sessions done early');
  console.log('errors',w.__e);if(w.__e.length)process.exit(1);
 }
 // ---------- Scenario 4: the last Week 1 workout is finished today in the app -> Home and Workout move to Week 2 right away.
 {const s4={};const dates=['2026-11-23','2026-11-24','2026-11-24','2026-11-25','2026-11-26'];
  DAYS.slice(0,5).forEach((k,i)=>{s4[`${dates[i]}_${k}`]=sess(dates[i],k,1,{updated:i+1})});
  const seed={profile:{start:'2026-11-23',unit:'lb',ready:{date:'2026-11-27',sl:4,so:4,en:4}},sessions:s4};
  const w=boot(seed,'2026-11-27T17:00:00'),d=w.document;w.__now=new w.Date('2026-11-27T17:00:00').getTime();await sleep(300);
  d.querySelector('[data-tab=home]').click();await sleep(20);
  ok(/Week 1 of 15/.test(blockCard(d))&&/Legs B/.test(txt(d,'.hero h2')),'before: Home is Week 1, Legs B up next');
  d.querySelector('[data-hstart]').click();await sleep(40);
  const ev=(el,t)=>el.dispatchEvent(new w.Event(t,{bubbles:true}));const wi=d.querySelector('.card[data-card="0"] input[data-f=w][data-k="0"]'),ri=d.querySelector('.card[data-card="0"] input[data-f=r][data-k="0"]');
  wi.value='225';ev(wi,'input');ri.value='8';ev(ri,'input');ev(ri,'change');await sleep(1400);
  w.__now+=20*60e3;d.querySelector('[data-wend="2"]').click();await sleep(10);d.querySelector('[data-wend="2"]').click();await sleep(60);
  ok(store(w).sessions['2026-11-27_legsB'].W===1&&!store(w).sessions['2026-11-27_legsB'].pw,'Legs B saved as Week 1');
  d.querySelector('[data-tab=home]').click();await sleep(20);
  ok(/Week 2 of 15/.test(blockCard(d)),'after: Home shows Week 2 of 15');
  ok(/Push A/.test(txt(d,'.hero h2'))&&/Week 2/.test(txt(d,'.hero .eyebrow')),'after: Home next workout is Week 2 Push A: '+txt(d,'.hero .eyebrow'));
  d.querySelector('[data-tab=today]').click();await sleep(20);d.querySelector('[data-wtoday]')&&d.querySelector('[data-wtoday]').click();await sleep(20);
  d.querySelector('[data-tab=home]').click();await sleep(20);d.querySelector('[data-hgo]').click();await sleep(20);
  ok(/Week 2/.test(txt(d,'.head .meta'))&&!!d.querySelector('[data-wstart]'),'after: Workout tab opens Week 2 with a Start button: '+txt(d,'.head .meta'));
  console.log('errors',w.__e);if(w.__e.length)process.exit(1);
 }
 // ---------- Scenario 3: old data, Week 1 not finished: stays on the calendar week as before.
 {const seed={profile:{start:'2026-11-23',unit:'lb'},sessions:{'2026-11-23_pushA':sess('2026-11-23','pushA',1)}};
  const w=boot(seed,'2026-11-27T17:00:00'),d=w.document;await sleep(300);
  d.querySelector('[data-tab=home]').click();await sleep(20);
  ok(/Week 1 of 15/.test(blockCard(d)),'unfinished Week 1 stays Week 1');
  d.querySelector('[data-tab=today]').click();await sleep(20);
  ok(/Week 1/.test(txt(d,'.head .meta'))&&!!d.querySelector('[data-wstart]'),'Week 1 workout can still be started');
  console.log('errors',w.__e);process.exit(w.__e.length?1:0);
 }
})().catch(e=>{console.log(e.message);console.log('errors',[e.message]);process.exit(1)});
