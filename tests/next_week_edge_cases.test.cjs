// QA edge cases for the next-week fix (PR #10): partial weeks, live workouts, test week / end of the 15-week plan,
// a 2-day program without blocks in kg, a brand-new user, History + backup/restore of `<date>_<day>_w<N>` ids,
// ghost "last cycle" lookups, and a live future-week workout that shares a day with a finished one.
const {JSDOM}=require('jsdom');
const html=require('fs').readFileSync(require('path').join(__dirname,'..','src','index.html'),'utf8');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const fails=[];const ok=(c,m)=>{if(!c){fails.push(m);console.log('FAIL',m)}else console.log('ok  ',m)};
const DAYS=['pushA','pullA','legsA','pushB','pullB','legsB'];
const sess=(date,s,W,extra)=>Object.assign({date,W,wk:((W-1)%15)+1,s,ex:{'Bench press':[{w:135,r:8}]},updated:1,start:1,end:2,dur:50},extra||{});
const addD=(iso,n)=>{const d=new Date(iso+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
function boot(seed,now){
  return new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',beforeParse(w){const RD=w.Date;class FD extends RD{constructor(...a){if(a.length)super(...a);else super(FD.now())}static now(){return w.__now||new RD(now).getTime()}};w.Date=FD;w.ResizeObserver=class{observe(){}disconnect(){}};w.scrollTo=()=>{};w.HTMLCanvasElement.prototype.getContext=()=>null;if(seed)w.localStorage.setItem('liftlog.v1',JSON.stringify(seed));w.__e=[];w.addEventListener('error',e=>w.__e.push(e.message));w.console.error=(...a)=>w.__e.push(a.join(' '))}}).window;
}
const txt=(d,q)=>{const e=d.querySelector(q);return e?e.textContent:''};
const blockCard=d=>{const c=[...d.querySelectorAll('.hcard')].find(x=>x.querySelector('.bar15'));return c?c.textContent:''};
const store=w=>JSON.parse(w.localStorage.getItem('liftlog.v1'));
const ev=(w,el,t)=>el.dispatchEvent(new w.Event(t,{bubbles:true}));
async function logSet(w,d,weight){const wi=d.querySelector('.card[data-card="0"] input[data-f=w][data-k="0"]'),ri=d.querySelector('.card[data-card="0"] input[data-f=r][data-k="0"]');
  wi.value=String(weight);ev(w,wi,'input');ri.value='8';ev(w,ri,'input');ev(w,ri,'change');await sleep(1400)}
async function endW(w,d){w.__now+=30*60e3;d.querySelector('[data-wend="2"]').click();await sleep(10);d.querySelector('[data-wend="2"]').click();await sleep(60)}
const errs=(w,label)=>{ok(!w.__e.length,label+': no page errors '+JSON.stringify(w.__e))};
const week1Done=()=>{const s={};const dates=['2026-11-23','2026-11-24','2026-11-24','2026-11-25','2026-11-26','2026-11-26'];DAYS.forEach((k,i)=>{s[`${dates[i]}_${k}`]=sess(dates[i],k,1,{updated:i+1})});return s};
const NOW='2026-11-27T17:00:00';

(async()=>{
 // ---------- A. Partial week (5 of 6) stays on Week 1; last day live (started, not ended) still Week 1.
 {const s=week1Done();delete s['2026-11-26_legsB'];
  s['2026-11-27_legsB']=Object.assign(sess('2026-11-27','legsB',1),{live:true,start:new Date(NOW).getTime()-10*60e3,end:undefined,dur:undefined});
  const w=boot({profile:{start:'2026-11-23',unit:'lb'},sessions:s},NOW),d=w.document;w.__now=new w.Date(NOW).getTime();await sleep(300);
  d.querySelector('[data-tab=home]').click();await sleep(20);
  ok(/Week 1 of 15/.test(blockCard(d)),'A: 5 done + 1 live -> still Week 1');
  ok(/in progress/i.test(txt(d,'.hero .eyebrow')),'A: Home shows the workout in progress');
  d.querySelector('[data-hgo]').click();await sleep(20);
  ok(!!d.querySelector('[data-wend]')&&/Week 1/.test(txt(d,'.head .meta')),'A: Continue opens the live Week 1 Legs B with End: '+txt(d,'.head .meta'));
  await endW(w,d);
  d.querySelector('[data-tab=home]').click();await sleep(20);
  ok(/Week 2 of 15/.test(blockCard(d)),'A: ending the live last day moves Home to Week 2');
  errs(w,'A');
 }
 // ---------- B. Week 4 started from the strip on a day that already has a finished Week 2 Push A, then left live.
 //      Continue from Home (and reopening the app) must land on the live Week 4 workout, not the finished Week 2 one.
 {const s=week1Done();s['2026-11-27_pushA']=sess('2026-11-27','pushA',2,{pw:2,updated:10});
  const w=boot({profile:{start:'2026-11-23',unit:'lb'},sessions:s},NOW),d=w.document;w.__now=new w.Date(NOW).getTime();await sleep(300);
  d.querySelector('[data-tab=today]').click();await sleep(20);
  d.querySelector('[data-jw="4"]').click();await sleep(20);d.querySelector('[data-s=pushA]').click();await sleep(20);
  d.querySelector('[data-wstart]').click();await sleep(40);await logSet(w,d,150);
  const st=store(w);ok(st.sessions['2026-11-27_pushA_w4']&&st.sessions['2026-11-27_pushA_w4'].live,'B: live Week 4 saved as 2026-11-27_pushA_w4');
  d.querySelector('[data-tab=home]').click();await sleep(20);
  ok(/in progress/i.test(txt(d,'.hero .eyebrow')),'B: Home shows workout in progress');
  d.querySelector('[data-hgo]').click();await sleep(20);
  ok(!!d.querySelector('[data-wend]')&&/Week 4/.test(txt(d,'.head .meta')),'B: Home "Continue workout" opens the live Week 4 Push A (End button): '+txt(d,'.head .meta'));
  errs(w,'B');
  const w2=boot(store(w),NOW),d2=w2.document;w2.__now=w.__now;await sleep(300);
  d2.querySelector('[data-tab=today]').click();await sleep(20);
  ok(!!d2.querySelector('[data-wend]'),'B: reopening the app, the Workout tab shows the live workout with End: '+txt(d2,'.head .meta'));
  // History lists both same-day Push A rows and Open goes to the right week
  d2.querySelector('[data-tab=history]').click();await sleep(20);
  const rows=[...d2.querySelectorAll('.hist')].filter(r=>/Push A/.test(r.textContent));
  ok(rows.length>=2,'B: History lists both same-day Push A sessions ('+rows.length+')');
  d2.querySelector('[data-open="2026-11-27_pushA_w4"]').click();await sleep(20);
  ok(/Week 4/.test(txt(d2,'.head .meta'))&&!!d2.querySelector('[data-wend]'),'B: History Open on the _w4 id shows Week 4 live');
  d2.querySelector('[data-tab=history]').click();await sleep(20);d2.querySelector('[data-open="2026-11-27_pushA"]').click();await sleep(20);
  ok(/Week 2/.test(txt(d2,'.head .meta')),'B: History Open on the plain id shows Week 2');
  errs(w2,'B reopen');
 }
 // ---------- C. Backup/restore keeps `_w<N>` ids and `pw`.
 {const s=week1Done();s['2026-11-27_pushA']=sess('2026-11-27','pushA',2,{pw:2});s['2026-11-27_pushA_w4']=sess('2026-11-27','pushA',4,{pw:4,ex:{'Bench press':[{w:150,r:6}]}});
  const w=boot({profile:{start:'2026-11-23',unit:'kg'},sessions:s},NOW),d=w.document;await sleep(300);
  d.querySelector('.gear').click();await sleep(20);d.querySelector('#copy').click();await sleep(40);const backup=d.querySelector('#io').value;
  const w2=boot(null,NOW),d2=w2.document;await sleep(300);
  d2.querySelector('.gear').click();await sleep(20);d2.querySelector('#io').value=backup;d2.querySelector('#imp').click();await sleep(10);d2.querySelector('#imp').click();await sleep(80);
  const st=store(w2);
  ok(st.sessions['2026-11-27_pushA_w4']&&st.sessions['2026-11-27_pushA_w4'].pw===4&&st.sessions['2026-11-27_pushA'].pw===2,'C: restore keeps _w4 id and pw');
  d2.querySelector('[data-tab=home]').click();await sleep(20);
  ok(/Week 2 of 15/.test(blockCard(d2)),'C: restored app is on Week 2');
  d2.querySelector('[data-tab=today]').click();await sleep(20);d2.querySelector('[data-jw="4"]').click();await sleep(20);d2.querySelector('[data-s=pushA]').click();await sleep(20);
  ok(d2.querySelector('[data-s=pushA]').classList.contains('done'),'C: restored Week 4 Push A shows its checkmark');
  errs(w,'C src');errs(w2,'C dst');
 }
 // ---------- D. Test week (Week 15) and end of the plan: weeks 1-14 done in their calendar weeks, Week 15 test days done.
 {const s={},start='2026-08-24';for(let W=1;W<=14;W++)DAYS.forEach((k,i)=>{const dt=addD(start,(W-1)*7+i);s[`${dt}_${k}`]=sess(dt,k,W)});
  const t0=addD(start,14*7);// Monday of calendar week 15 = 2026-11-30
  const now=addD(t0,2)+'T17:00:00';
  ['pushA','legsA'].forEach((k,i)=>{const dt=addD(t0,i);s[`${dt}_${k}`]=sess(dt,k,15)});
  {const w=boot({profile:{start,unit:'lb'},sessions:s},now),d=w.document;await sleep(300);
   d.querySelector('[data-tab=home]').click();await sleep(20);
   ok(/Week 15 of 15/.test(blockCard(d)),'D: 2 of 3 test days done -> still Week 15: '+blockCard(d).slice(0,40));
   d.querySelector('[data-tab=today]').click();await sleep(20);
   ok(/Pull B/.test(txt(d,'.wbanner h2'))||!!d.querySelector('[data-s=pullB]'),'D: Pull B (test day) available');errs(w,'D partial');}
  const dt=addD(t0,2);s[`${dt}_pullB`]=sess(dt,'pullB',15);
  const w=boot({profile:{start,unit:'lb'},sessions:s},now),d=w.document;await sleep(300);
  d.querySelector('[data-tab=home]').click();await sleep(20);
  ok(/Week 1 of 15/.test(blockCard(d)),'D: Week 15 test days done -> next cycle Week 1 of 15 (no Week 16): '+blockCard(d).slice(0,40));
  ok(!/Week 16/.test(d.body.textContent),'D: Home never says Week 16');
  d.querySelector('[data-tab=today]').click();await sleep(20);
  ok(!/Week 16/.test(d.body.textContent)&&/Week 1 /.test(txt(d,'.head .meta'))&&txt(d,'.strip .now')==='1'&&!!d.querySelector('.strip [data-jw="16"].now'),'D: Workout tab shows cycle-2 Week 1 (strip 1 = W16), no Week 16: '+txt(d,'.head .meta'));
  ok(!!d.querySelector('[data-wstart]'),'D: Start button for cycle 2 Week 1');
  d.querySelector('[data-s=pushA]').click();await sleep(20);
  ok(/last cycle/.test(d.querySelector('.card[data-card="0"]').textContent),'D: ghost sets come from last cycle (Week 1 Push A)');
  d.querySelector('[data-s=pushA]').click();await sleep(20);d.querySelector('[data-wstart]').click();await sleep(40);await logSet(w,d,185);await endW(w,d);
  const nw=Object.values(store(w).sessions).find(x=>x.W===16);ok(nw&&nw.wk===1&&nw.pw===16&&nw.s==='pushA','D: cycle-2 session saved W:16 wk:1 pw:16 '+JSON.stringify(nw&&{W:nw.W,wk:nw.wk,pw:nw.pw}));
  errs(w,'D');
 }
 // ---------- E. Two-day custom program without blocks, kilograms: both days done early -> Week 2, start/end tags Week 2.
 {const program={name:'Two day',periodize:false,days:[{k:'d1',n:'Day A',c:'#d8342c',ex:[{n:'Bench press',sets:3,reps:'8'}]},{k:'d2',n:'Day B with a very long exercise list name for a lifter',c:'#2a63d4',ex:[{n:'Back squat',sets:3,reps:'5'}]},{k:'d3',n:'Empty day',c:'#e0a800',ex:[]}]};
  const s={'2026-11-23_d1':sess('2026-11-23','d1',1),'2026-11-25_d2':sess('2026-11-25','d2',1,{ex:{'Back squat':[{w:100,r:5}]}})};
  const w=boot({profile:{start:'2026-11-23',unit:'kg',program},sessions:s},NOW),d=w.document;w.__now=new w.Date(NOW).getTime();await sleep(300);
  d.querySelector('[data-tab=today]').click();await sleep(20);
  ok(/Week 2/.test(txt(d,'.head .meta')),'E: 2-day program (plus an empty day) moves to Week 2: '+txt(d,'.head .meta'));
  d.querySelector('[data-s=d1]').click();await sleep(20);
  ok(!!d.querySelector('[data-wstart]'),'E: Start for Week 2 Day A');
  d.querySelector('[data-wstart]').click();await sleep(40);await logSet(w,d,60);await endW(w,d);
  const x=store(w).sessions['2026-11-27_d1'];ok(x&&x.W===2&&x.pw===2,'E: saved as Week 2 '+JSON.stringify(x&&{W:x.W,pw:x.pw}));
  d.querySelector('[data-tab=home]').click();await sleep(20);ok(/kg/.test(d.body.textContent),'E: Home shows kg');
  errs(w,'E');
 }
 // ---------- F. Brand-new user (empty storage) and a fresh PPL profile with no sessions.
 {const w=boot(null,NOW),d=w.document;await sleep(300);
  ok(!!d.querySelector('#go')||/Pick a program/.test(txt(d,'#sub')),'F: new user sees setup');
  d.querySelector('#go')&&d.querySelector('#go').click();await sleep(60);
  d.querySelector('[data-tab=home]').click();await sleep(20);ok(!!d.querySelector('.hero [data-hstart]'),'F: after setup (default pick) Home has a Start button');
  d.querySelector('[data-tab=today]').click();await sleep(20);ok(!!d.querySelector('[data-wstart]'),'F: Start button for Week 1');
  errs(w,'F');
 }
 // ---------- G. Changing program after being ahead: switch preset -> back to calendar week, no crash.
 {const w=boot({profile:{start:'2026-11-23',unit:'lb'},sessions:week1Done()},NOW),d=w.document;await sleep(300);
  d.querySelector('.gear').click();await sleep(20);
  const sel=d.querySelector('#newp');ok(!!sel,'G: program switcher found');if(sel){sel.value='ul';ev(w,sel,'change');d.querySelector('#swp').click();await sleep(10);d.querySelector('#newp').value='ul';d.querySelector('#swp').click();await sleep(60)}
  d.querySelector('[data-tab=home]').click();await sleep(20);d.querySelector('[data-tab=today]').click();await sleep(20);
  ok(/Week 1/.test(txt(d,'.head .meta'))&&!!d.querySelector('[data-wstart]'),'G: after switching to Upper/Lower the week is the calendar week again: '+txt(d,'.head .meta'));
  errs(w,'G');
 }
 // ---------- H. Ahead of the calendar, typing a past date this calendar week to fill in a missed set.
 {const w=boot({profile:{start:'2026-11-23',unit:'lb'},sessions:week1Done()},NOW),d=w.document;await sleep(300);
  d.querySelector('[data-tab=today]').click();await sleep(20);
  const di=d.querySelector('#wdate');di.value='2026-11-25';ev(w,di,'change');await sleep(20);d.querySelector('[data-s=pullA]').click();await sleep(20);
  console.log('info H: past date 2026-11-25 Pull A shows',JSON.stringify(txt(d,'.head .meta')));
  errs(w,'H');
 }
 // ---------- I. The 1-15 strip is hidden by CSS (#stripbox{display:none}), so on a phone the › arrow is the way to a future week.
 {const w=boot({profile:{start:'2026-11-23',unit:'lb'},sessions:week1Done()},NOW),d=w.document;await sleep(300);
  d.querySelector('[data-tab=today]').click();await sleep(20);
  d.querySelector('[data-wnav="7"]').click();await sleep(20);
  ok(/Week 3/.test(txt(d,'.head .meta'))&&!!d.querySelector('[data-wstart]')&&[...d.querySelectorAll('.stp')].some(b=>/Looking ahead to Week 3/.test(b.textContent)),'I: › from Week 2 opens Week 3 with Start and the looking-ahead pill: '+txt(d,'.head .meta'));
  d.querySelector('[data-wtoday]').click();await sleep(20);
  ok(/Week 2/.test(txt(d,'.head .meta')),'I: "back to this week" returns to Week 2');
  errs(w,'I');
 }
 console.log(fails.length?'FAILED '+fails.length+':\n - '+fails.join('\n - '):'all edge cases pass');
 process.exit(fails.length?1:0);
})().catch(e=>{console.log(e.stack);process.exit(1)});
