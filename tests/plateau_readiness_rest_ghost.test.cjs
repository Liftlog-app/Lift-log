const {JSDOM}=require('jsdom');
const html=require('fs').readFileSync(require('path').join(__dirname,'..','src','index.html'),'utf8');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ses={};const dates=['2026-10-05','2026-10-12','2026-10-19','2026-10-26','2026-11-02','2026-11-09','2026-11-16'];
const bench=[[185,8],[190,8],[190,7],[185,8],[190,7],[185,8],[190,7]];
dates.forEach((d,j)=>{ses[d+'_pushA']={date:d,W:1,wk:1,s:'pushA',ex:{'Bench press':[{w:bench[j][0],r:bench[j][1]},{w:bench[j][0],r:bench[j][1]-1}]},updated:j}});
const seed={profile:{start:'2026-11-16',unit:'lb'},sessions:ses};
function mk(){const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',beforeParse(w){const RD=w.Date;class FD extends RD{constructor(...a){if(a.length)super(...a);else super(FD.now())}static now(){return w.__now||new RD('2026-11-23T12:00:00').getTime()}};w.Date=FD;w.ResizeObserver=class{observe(){}disconnect(){}};w.localStorage.setItem('liftlog.v1',JSON.stringify(seed));w.__e=[];w.addEventListener('error',e=>w.__e.push(e.message))}});return dom.window}
const w=mk(),d=w.document,ev=(el,t)=>el.dispatchEvent(new w.Event(t,{bubbles:true}));
(async()=>{await sleep(100);/*GOTODAY*/d.querySelector('[data-tab=today]').click();await sleep(10);
 d.querySelector('[data-s=pushA]').click();await sleep(20);
 console.log('ready card:',!!d.querySelector('.ready'),'| save disabled:',d.querySelector('[data-rsave]').disabled);
 for(const [k,v] of [['sl',2],['so',2],['en',2]]){d.querySelector(`[data-rk=${k}][data-rv="${v}"]`).click();await sleep(5)}
 d.querySelector('[data-rsave]').click();await sleep(30);
 console.log('ready hint:',d.querySelector('.hint').textContent.trim());
 let c0=d.querySelector('.card[data-card="0"]');
 console.log('bench meta:',c0.querySelector('.meta').textContent);
 console.log('plateau:',c0.querySelector('.plat')&&c0.querySelector('.plat').textContent);
 console.log('sug:',c0.querySelector('.sug').textContent);
 console.log('ghosts:',[...c0.querySelectorAll('.ghost')].map(g=>g.textContent).join(' / '));
 const plbtn=c0.querySelector('.plat button');if(plbtn){plbtn.click();await sleep(20);c0=d.querySelector('.card[data-card="0"]');console.log('after plateau btn:',c0.querySelector('.meta').textContent,'| rows:',c0.querySelectorAll('input[data-f=w]').length,'| ph:',[...c0.querySelectorAll('input[data-f=w]')].map(i=>i.placeholder).join(','))}
 // log set 1 and check ghost + adaptive rest
 const wi=c0.querySelector('input[data-f=w][data-k="0"]'),ri=c0.querySelector('input[data-f=r][data-k="0"]'),ei=c0.querySelector('input[data-f=e][data-k="0"]');
 wi.value='195';ev(wi,'input');ri.value='8';ev(ri,'input');ev(ri,'change');await sleep(300);
 console.log('timer:',d.querySelector('#tleft').textContent,'|',d.querySelector('#twhy').textContent);
 ei.value='9.5';ev(ei,'input');ev(ei,'change');await sleep(300);
 console.log('timer after RPE 9.5:',d.querySelector('#tleft').textContent,'|',d.querySelector('#twhy').textContent);
 console.log('ghost row0:',c0.querySelector('.ghost[data-gk="0"]').textContent,c0.querySelector('.ghost[data-gk="0"]').className);
 await sleep(1500);d.querySelector('[data-tab=history]').click();d.querySelector('[data-tab=today]').click();await sleep(20);
 console.log('race:',d.querySelector('.race')&&d.querySelector('.race').textContent);
 const st=JSON.parse(w.localStorage.getItem('liftlog.v1'));const td=Object.values(st.sessions).find(x=>x.date==='2026-11-23');console.log('saved rd:',JSON.stringify(td.rd),JSON.stringify(td.ex));
 d.querySelector('[data-rchange]').click();await sleep(20);console.log('change -> card again:',!!d.querySelector('.ready'));
 for(const [k,v] of [['sl',5],['so',5],['en',4]]){d.querySelector(`[data-rk=${k}][data-rv="${v}"]`).click();await sleep(5)}d.querySelector('[data-rsave]').click();await sleep(20);
 console.log('great day:',d.querySelector('.hint').textContent.trim(),'|',d.querySelector('.card[data-card="0"] .sug').textContent);
 d.querySelector('[data-tab=settings]').click();console.log('adapt setting:',!!d.querySelector('#tadapt'));
 console.log('errors',w.__e);process.exit(0)})();
