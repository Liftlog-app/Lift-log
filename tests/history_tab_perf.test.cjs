// History tab round 2 (QA fixes): debounced search for long histories, capped search results with "Show more",
// card bodies built only when opened, day tap scrolls the opened card to the top (block:'start'), wrap/nowrap CSS.
const {JSDOM}=require('jsdom');
const html=require('fs').readFileSync(require('path').join(__dirname,'..','src','index.html'),'utf8');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const S=(date,s,ex,more)=>Object.assign({date,s,ex,updated:new Date(date+'T18:00:00').getTime()},more||{});
const mk=(now,seed,scrolls)=>{
 const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',beforeParse(w){const RD=w.Date;class FD extends RD{constructor(...a){if(a.length)super(...a);else super(FD.now())}static now(){return new RD(now).getTime()}};w.Date=FD;w.ResizeObserver=class{observe(){}disconnect(){}};w.scrollTo=()=>{};
  if(scrolls)w.Element.prototype.scrollIntoView=function(o){scrolls.push({id:this.dataset&&this.dataset.hid,open:this.classList.contains('open'),opt:o})};
  w.localStorage.setItem('liftlog.v1',JSON.stringify(seed));w.__e=[];w.addEventListener('error',e=>w.__e.push(e.message))}});
 return dom.window};
const ok=(c,m)=>{if(!c)throw new Error('history_tab_perf: '+m);console.log('ok  ',m)};
const stored=w=>JSON.parse(w.localStorage.getItem('liftlog.v1')).sessions;
const cards=d=>[...d.querySelectorAll('#main .hist')];
const cardOf=(d,id)=>cards(d).find(c=>c.dataset.hid===id);
const type=(w,q,v)=>{q.value=v;q.dispatchEvent(new w.Event('input',{bubbles:true}))};
const iso=dt=>`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
(async()=>{
 const allErr=[];
 // 1. long history: 300 sessions, every one has bench
 {const ses={},K=['pushA','pullA','legsA','pushB','pullB','legsB'];
  for(let i=0;i<300;i++){const v=iso(new Date(2026,10,28-i)),k=K[i%6];ses[v+'_'+k]=S(v,k,{'Bench press':[{w:100+i%40,r:8,e:8}],'Back squat':[{w:150,r:5}]})}
  const w=mk('2026-11-28T12:00:00',{profile:{start:'2025-12-01',unit:'lb'},sessions:ses}),d=w.document;await sleep(600);const before=JSON.stringify(stored(w));
  d.querySelector('[data-tab=history]').click();await sleep(20);
  // lazy bodies: collapsed cards carry no set chips or photos, but keep Open/Delete and the meta line
  ok(cards(d).length===28,'November lists all 28 cards (month view is not capped)');
  ok(!d.querySelector('#main .wcard .wex')&&!d.querySelector('#main .wcard .wset'),'collapsed cards have no exercise rows built');
  ok(cards(d).every(c=>c.querySelector('[data-open]')&&c.querySelector('[data-del]')&&c.querySelector('.meta')),'collapsed cards still have [data-open], [data-del] and .meta');
  ok(/<span class="wvol">[\d,]+ lb<\/span>/.test(cards(d)[0].querySelector('.meta').innerHTML),'volume in the meta line is wrapped in .wvol (no lone "lb" wrap)');
  const c=cardOf(d,'2026-11-27_pullA');c.querySelector('[data-hx]').click();await sleep(10);
  ok(c.querySelectorAll('.wex').length===2&&/101 × 8 · RPE 8/.test(c.textContent)&&c.querySelector('.wex .thumb img,.wex .thumb svg'),'expanding builds the body: 2 exercises, "101 × 8 · RPE 8", photo or figure');
  ok(cards(d).filter(x=>x.querySelector('.wex')).length===1,'only the expanded card has a body');
  c.querySelector('[data-hx]').click();await sleep(10);
  ok(!c.classList.contains('open')&&c.querySelectorAll('.wex').length===2,'collapsing keeps the built body (no rebuild on re-open)');
  // debounce: with a long history the list is not rebuilt on every keystroke
  const q=d.querySelector('#hq');q.focus();
  let rebuilds=0;const mo=new w.MutationObserver(()=>rebuilds++);mo.observe(d.querySelector('#hlist'),{childList:true});
  for(const s of ['b','be','ben','benc','bench']){type(w,q,s);await sleep(20)}
  ok(!/Results in all months/.test(d.querySelector('#hlist').textContent)&&rebuilds===0,'typing fast: list not rebuilt yet (debounced)');
  await sleep(250);
  ok(rebuilds===1,'one rebuild after typing stops (got '+rebuilds+')');
  ok(/Results in all months/.test(d.querySelector('#hlist').textContent)&&/Results in all months\s*300/.test(d.querySelector('.hlh').textContent),'search heading counts all 300 results');
  ok(d.activeElement===q&&d.querySelector('#hq')===q,'search box keeps focus');
  // cap: 30 cards and a "Show more" button
  ok(cards(d).length===30,'search shows the first 30 results (got '+cards(d).length+')');
  let more=d.querySelector('#hlist [data-hmore]');
  ok(more&&/Show 30 more/.test(more.textContent)&&/270 left/.test(more.textContent),'"Show 30 more (270 left)" button');
  ok(more.classList.contains('btn')&&/\.hmore\{[^}]*min-height:44px/.test(html),'Show more is a .btn with min-height 44px');
  more.click();await sleep(10);
  ok(cards(d).length===60&&/240 left/.test(d.querySelector('#hlist [data-hmore]').textContent),'Show more adds 30 (60 shown, 240 left)');
  ok(d.activeElement===cards(d)[30].querySelector('[data-hx]'),'focus moves to the first newly shown card');
  for(let i=0;i<8;i++){const m=d.querySelector('#hlist [data-hmore]');if(m){m.click();await sleep(5)}}
  ok(cards(d).length===300&&!d.querySelector('#hlist [data-hmore]'),'all 300 shown, no Show more button left');
  // a new query resets the cap
  type(w,q,'squat');await sleep(250);
  ok(cards(d).length===30,'new query resets the cap to 30');
  // filter while searching re-renders right away and keeps the cap
  d.querySelector('[data-hf="legs"]').click();await sleep(10);
  ok(cards(d).length===30&&cards(d).every(x=>/legs/.test(x.dataset.hid))&&/Results in all months\s*100/.test(d.querySelector('.hlh').textContent),'search + Legs filter: 100 results, 30 shown');
  d.querySelector('[data-hf="all"]').click();await sleep(10);
  // typing then tapping a day before the debounce fires: the pending rebuild is dropped, day card stays open
  const q2=d.querySelector('#hq');type(w,q2,'row');d.querySelector('[data-hd="2026-11-20"]').click();await sleep(250);
  ok(d.querySelector('#hq').value===''&&cardOf(d,'2026-11-20_legsA')&&cardOf(d,'2026-11-20_legsA').classList.contains('open')&&!/Results in all months/.test(d.querySelector('#hlist').textContent),'day tap during a pending search: search cleared, card open, no late rebuild');
  ok(cardOf(d,'2026-11-20_legsA').querySelectorAll('.wex').length===2,'day tap builds the opened card body');
  // leaving the tab with a pending search does not touch other tabs
  type(w,d.querySelector('#hq'),'bench');d.querySelector('[data-tab=home]').click();await sleep(250);
  ok(!d.querySelector('#hlist')&&!w.__e.length,'pending search after leaving the tab does nothing');
  ok(JSON.stringify(stored(w))===before,'sessions unchanged');
  allErr.push(...w.__e)}

 // 2. short history: search updates immediately (no debounce needed)
 {const ses={'2026-11-02_pushA':S('2026-11-02','pushA',{'Bench press':[{w:135,r:8}]}),'2026-11-04_pullA':S('2026-11-04','pullA',{'Barbell row':[{w:135,r:8}]}),
   '2026-11-26_legsB':S('2026-11-26','legsB',{'Deadlift':[{w:225,r:5}]})};
  const w=mk('2026-11-28T12:00:00',{profile:{start:'2026-10-12',unit:'lb'},sessions:ses}),d=w.document;await sleep(400);
  d.querySelector('[data-tab=history]').click();await sleep(20);
  const q=d.querySelector('#hq');q.focus();type(w,q,'bench');
  ok(cards(d).map(c=>c.dataset.hid).join()==='2026-11-02_pushA','short history: search result shows synchronously');
  ok(!d.querySelector('[data-hmore]'),'no Show more when under 30 results');
  type(w,q,'');
  // legsB has no RPE: check it on an expanded body (bodies are lazy now)
  cardOf(d,'2026-11-26_legsB').querySelector('[data-hx]').click();await sleep(10);
  ok(/225 × 5/.test(cardOf(d,'2026-11-26_legsB').querySelector('.wbody').textContent)&&!/RPE/.test(cardOf(d,'2026-11-26_legsB').querySelector('.wbody').textContent),'expanded card without logged RPE shows no RPE');
  allErr.push(...w.__e)}

 // 3. day tap scrolls the opened card to the top, after it is expanded
 {const ses={};for(let i=1;i<=20;i++){const v=`2026-11-${String(i).padStart(2,'0')}`;ses[v+'_pushA']=S(v,'pushA',{'Bench press':[{w:100+i,r:8}]})}
  const scrolls=[];const w=mk('2026-11-28T12:00:00',{profile:{start:'2026-10-12',unit:'lb'},sessions:ses},scrolls),d=w.document;await sleep(400);
  d.querySelector('[data-tab=history]').click();await sleep(20);
  cardOf(d,'2026-11-20_pushA').querySelector('[data-hx]').click();await sleep(10);
  d.querySelector('[data-hd="2026-11-03"]').click();
  ok(!scrolls.length,'no scroll before the other cards finish collapsing');
  await sleep(400);
  const s=scrolls.filter(x=>x.id);
  ok(s.length===1&&s[0].id==='2026-11-03_pushA'&&s[0].open&&s[0].opt&&s[0].opt.block==='start','scrollIntoView({block:"start"}) on the opened 11-03 card ('+JSON.stringify(s)+')');
  ok(!cardOf(d,'2026-11-20_pushA').classList.contains('open'),'other card collapsed');
  allErr.push(...w.__e)}

 // 4. CSS: scroll-margin clears the bottom nav, long names wrap, volume does not split
 ok(/\.hist\.wcard\{[^}]*scroll-margin:12px 0 calc\(76px \+ env\(safe-area-inset-bottom\)\)/.test(html),'.wcard has scroll-margin covering the 58px bottom nav');
 ok(/\.wnm\{[^}]*overflow-wrap:anywhere/.test(html)&&/\.wexm>b\{[^}]*overflow-wrap:anywhere/.test(html),'.wnm and .wexm>b use overflow-wrap:anywhere');
 ok(/\.wvol\{white-space:nowrap\}/.test(html),'.wvol is nowrap');
 ok(!allErr.length,'no page errors '+JSON.stringify(allErr));
 process.exit(0)
})().catch(e=>{console.error(e);process.exit(1)});
