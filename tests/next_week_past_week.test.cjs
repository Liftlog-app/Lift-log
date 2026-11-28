// Past week while ahead of the calendar: Week 1 is done, today (Fri 2026-11-27, calendar Week 1) has a finished
// Week 2 Push A. Going ‹ back to Week 1 must open the finished Week 1 Push A, not offer Start (which would save a
// duplicate 2026-11-27_pushA_w1). Also: Continue from Home lands on a live session even when a finished one shares the day.
const {JSDOM}=require('jsdom');
const html=require('fs').readFileSync(require('path').join(__dirname,'..','src','index.html'),'utf8');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const DAYS=['pushA','pullA','legsA','pushB','pullB','legsB'];
const sess=(date,s,W,extra)=>Object.assign({date,W,wk:((W-1)%15)+1,s,ex:{'Bench press':[{w:135,r:8}]},updated:1,start:1,end:2,dur:50},extra||{});
function boot(seed,now){
  return new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',beforeParse(w){const RD=w.Date;class FD extends RD{constructor(...a){if(a.length)super(...a);else super(FD.now())}static now(){return w.__now||new RD(now).getTime()}};w.Date=FD;w.ResizeObserver=class{observe(){}disconnect(){}};w.scrollTo=()=>{};w.HTMLCanvasElement.prototype.getContext=()=>null;if(seed)w.localStorage.setItem('liftlog.v1',JSON.stringify(seed));w.__e=[];w.addEventListener('error',e=>w.__e.push(e.message));w.console.error=(...a)=>w.__e.push(a.join(' '))}}).window;
}
const txt=(d,q)=>{const e=d.querySelector(q);return e?e.textContent:''};
const store=w=>JSON.parse(w.localStorage.getItem('liftlog.v1'));
const NOW='2026-11-27T17:00:00';
(async()=>{
  const s={};const dates=['2026-11-23','2026-11-24','2026-11-24','2026-11-25','2026-11-26','2026-11-26'];
  DAYS.forEach((k,i)=>{s[`${dates[i]}_${k}`]=sess(dates[i],k,1,{updated:i+1})});
  s['2026-11-27_pushA']=sess('2026-11-27','pushA',2,{pw:2,updated:10});
  const w=boot({profile:{start:'2026-11-23',unit:'lb'},sessions:s},NOW),d=w.document;w.__now=new w.Date(NOW).getTime();await sleep(300);
  d.querySelector('[data-tab=today]').click();await sleep(20);
  d.querySelector('[data-s=pushA]').click();await sleep(20);
  const m2=txt(d,'.head .meta');console.log('info','Week 2 Push A today:',m2);
  if(!/Week 2/.test(m2))throw new Error('expected Week 2 Push A first, got '+m2);
  d.querySelector('[data-wnav="-7"]').click();await sleep(20);
  const m1=txt(d,'.head .meta');console.log('info','after ‹:',m1,'| date',d.querySelector('#wdate').value);
  if(!/Week 1/.test(m1))throw new Error('‹ did not go to Week 1: '+m1);
  if(d.querySelector('[data-wstart]'))throw new Error('finished past Week 1 Push A still offers Start (would duplicate it)');
  if(d.querySelector('#wdate').value!=='2026-11-23')throw new Error('expected the finished Week 1 Push A on 2026-11-23, got '+d.querySelector('#wdate').value);
  if(!d.querySelector('#save'))throw new Error('no Save button on the finished past session');
  console.log('ok  ','‹ to finished Week 1 opens its Push A (2026-11-23) with Save, no Start');
  d.querySelector('#save').click();await sleep(60);
  if(Object.keys(store(w).sessions).some(id=>/_w1$/.test(id)))throw new Error('a duplicate _w1 session was created');
  console.log('ok  ','Save did not create a duplicate _w1 session');
  if(w.__e.length)throw new Error('page errors '+JSON.stringify(w.__e));
  console.log('ok   no page errors');process.exit(0);
})().catch(e=>{console.log(e.stack||e);process.exit(1)});
