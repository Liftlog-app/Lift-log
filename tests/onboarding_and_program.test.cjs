const {JSDOM}=require('jsdom');
const html=require('fs').readFileSync(require('path').join(__dirname,'..','src','index.html'),'utf8');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function make(seed){const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',beforeParse(w){const RD=w.Date;class FD extends RD{constructor(...a){if(a.length)super(...a);else super(FD.now())}static now(){return w.__now||new RD('2026-11-23T12:00:00').getTime()}};w.Date=FD;w.ResizeObserver=class{observe(){}disconnect(){}};if(seed)w.localStorage.setItem('liftlog.v1',JSON.stringify(seed));w.__errs=[];w.addEventListener('error',e=>w.__errs.push(e.message))}});return dom.window}
const ev=(w,el,t)=>el.dispatchEvent(new w.Event(t,{bubbles:true}));
(async()=>{
 // new user
 let w=make(),d=w.document;await sleep(100);d.querySelector('[data-tab=today]').click();await sleep(10);
 console.log('setup shown:',!!d.querySelector('[data-pick]'),'| bar hidden:',d.querySelector('#tbar').hidden);
 d.querySelector('[data-pick=fb]').click();d.querySelector('#sper').checked=true;ev(w,d.querySelector('#sper'),'change');
 d.querySelector('#go').click();await sleep(50);/*GOTODAY*/console.log('home after setup:',!!d.querySelector('.hero'));d.querySelector('[data-tab=today]').click();await sleep(10);
 console.log('sub:',d.querySelector('#sub').textContent);
 console.log('chips:',[...d.querySelectorAll('.chip')].map(c=>c.textContent).join(','),'| first card:',d.querySelector('.card h3').textContent,d.querySelector('.card .meta').textContent);
 let r=d.querySelector('input[data-f=r][data-i="0"][data-k="0"]'),wt=d.querySelector('input[data-f=w][data-i="0"][data-k="0"]');
 wt.value='100';ev(w,wt,'input');r.value='5';ev(w,r,'input');ev(w,r,'change');await sleep(300);
 console.log('timer running:',!d.querySelector('#trun').hidden,d.querySelector('#tleft').textContent,'| clock:',d.querySelector('#wclock').textContent);
 await sleep(1400);
 const st=JSON.parse(w.localStorage.getItem('liftlog.v1'));console.log('saved sessions:',Object.keys(st.sessions),JSON.stringify(Object.values(st.sessions)[0].ex));
 d.querySelector('[data-tstop]').click();console.log('after skip running:',!d.querySelector('#trun').hidden);
 d.querySelector('[data-tab=program]').click();await sleep(20);
 d.querySelector('[data-padd="0"]').click();await sleep(20);
 let nm=[...d.querySelectorAll('[data-pf=n]')].find(i=>i.value==='New exercise');nm.value='Face pull';ev(w,nm,'change');await sleep(20);
 console.log('day A exercises:',JSON.parse(w.localStorage.getItem('liftlog.v1')).profile.program.days[0].ex.map(e=>e.n).join(' | '));
 d.querySelector('[data-pdayadd]').click();await sleep(20);console.log('days:',JSON.parse(w.localStorage.getItem('liftlog.v1')).profile.program.days.length);
 d.querySelector('[data-tab=today]').click();await sleep(20);
 d.querySelector('[data-swap="1"]').click();await sleep(10);d.querySelector('[data-ddtoggle]').click();await sleep(10);d.querySelectorAll('[data-ddpick]')[1].click();await sleep(10);console.log('picked shows:',d.querySelector('.cmp figcaption:last-child')?.textContent||[...d.querySelectorAll('.cmp figcaption')].pop().textContent);d.querySelector('[data-swapgo="1"]').click();await sleep(20);
 console.log('after swap card2:',d.querySelectorAll('.card h3')[1].textContent);
 d.querySelector('[data-tab=progress]').click();console.log('progress prs:',d.querySelectorAll('.pr:not(.bwbox .pr)').length);
 d.querySelector('[data-tab=history]').click();console.log('history:',d.querySelector('.hist').textContent.replace(/\s+/g,' '));
 d.querySelector('[data-tab=settings]').click();console.log('settings ok:',!!d.querySelector('#trest'));
 console.log('errors1',w.__errs);
 // existing PPL user
 w=make({profile:{start:'2026-11-16',unit:'lb',swaps:{'pushA|Incline DB press':'Machine chest press'}},sessions:{'w1-pushA':{date:'2026-11-19',W:1,wk:1,s:'pushA',ex:{'Bench press':[{w:135,r:10}]},updated:1}}});d=w.document;await sleep(100);d.querySelector('[data-tab=today]').click();await sleep(10);
 console.log('PPL sub:',d.querySelector('#sub').textContent,'| strip:',d.querySelectorAll('.strip span').length);
 console.log('PPL chips:',[...d.querySelectorAll('.chip')].map(c=>c.textContent).join(','),'| day:',d.querySelector('.head h2').textContent);
 d.querySelector('[data-s=pushA]').click();await sleep(20);
 console.log('pushA cards:',[...d.querySelectorAll('.card h3')].map(x=>x.textContent).join(' | '));
 console.log('hint:',d.querySelector('.hint')&&d.querySelector('.hint').textContent);
 d.querySelector('[data-tab=history]').click();d.querySelector('[data-open]').click();await sleep(20);
 console.log('open old:',d.querySelector('.head h2').textContent,d.querySelector('input[data-f=w]').value);
 console.log('errors2',w.__errs);
 process.exit(0);
})();
