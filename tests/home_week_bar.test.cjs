// Regression: the Home "Week X of 15" bar must not pick up the 3D body viewer's styles (Peak weeks turned into tall columns).
const {JSDOM}=require('jsdom');
const html=require('fs').readFileSync(require('path').join(__dirname,'..','src','index.html'),'utf8');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const seed={profile:{start:'2026-11-16',unit:'lb'},sessions:{}};
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',beforeParse(w){const RD=w.Date;class FD extends RD{constructor(...a){if(a.length)super(...a);else super(FD.now())}static now(){return new RD('2026-11-26T12:00:00').getTime()}};w.Date=FD;w.ResizeObserver=class{observe(){}disconnect(){}};w.localStorage.setItem('liftlog.v1',JSON.stringify(seed));w.__e=[];w.addEventListener('error',e=>w.__e.push(e.message))}});
const w=dom.window,d=w.document;const ok=(c,m)=>{if(!c)throw new Error('FAILED: '+m);console.log('ok  ',m)};
(async()=>{await sleep(100);d.querySelector('[data-tab=home]').click();await sleep(20);
 const segs=[...d.querySelectorAll('.bar15 i')];ok(segs.length===15,'15 week squares on Home');
 const peak=segs.filter(i=>i.classList.contains('b3'));ok(peak.length===5,'5 Peak-block squares');
 const h=segs.map(i=>w.getComputedStyle(i).height),mh=segs.map(i=>w.getComputedStyle(i).minHeight);
 ok(h.every(x=>x==='10px'),'every square is 10px tall: '+[...new Set(h)].join());
 ok(mh.every(x=>x==='0px'||x==='auto'||x===''),'no square has a min-height from other components');
 // the CSS for the 3D body must not use the bare .b3 class any more
 const css=[...d.querySelectorAll('style')].map(s=>s.textContent).join('');ok(!/\.b3[{ .:]/.test(css.replace(/\.bar15 i\.b3|\.strip \.b3/g,'')),'3D viewer styles no longer target the shared .b3 class');
 console.log('errors',w.__e);process.exit(w.__e.length?1:0)})().catch(e=>{console.log(e.message);console.log('errors',[e.message]);process.exit(1)});
