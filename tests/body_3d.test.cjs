// 3D body pain map: geometry picking, region mapping, search, exact-spot saving, new pain areas, and the no-WebGL fallback.
const {JSDOM}=require('jsdom');
const html=require('fs').readFileSync(require('path').join(__dirname,'..','src','index.html'),'utf8');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const seed={profile:{start:'2026-11-16',unit:'lb',pain:{'knee-L':{lvl:5,date:'2026-11-20',pt:[0.11,0.53,0.05]}}},sessions:{}};
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',beforeParse(w){const RD=w.Date;class FD extends RD{constructor(...a){if(a.length)super(...a);else super(FD.now())}static now(){return new RD('2026-11-26T12:00:00').getTime()}};w.Date=FD;w.ResizeObserver=class{observe(){}disconnect(){}};w.localStorage.setItem('liftlog.v1',JSON.stringify(seed));w.__e=[];w.addEventListener('error',e=>w.__e.push(e.message))}});
const w=dom.window,d=w.document,$=s=>d.querySelector(s),store=()=>JSON.parse(w.localStorage.getItem('liftlog.v1')).profile;
const ok=(c,m)=>{if(!c)throw new Error('FAILED: '+m);console.log('ok  ',m)};
(async()=>{await sleep(100);const B=w.__b3;ok(B&&B.keys.length===32,'32 body regions');
 // every region has a pain area and label
 ok(B.keys.every(k=>{try{return !!B.label(k)}catch(e){return false}}),'every region has a label: '+B.keys.map(B.label).join(', '));
 // ray picking hits the right part from the right side
 const hit=(o,dir)=>{const h=B.ray(o,dir);return h&&h.key};
 ok(hit([0,1.32,2],[0,0,-1])==='chest','front of torso = chest');
 ok(hit([0,1.32,-2],[0,0,1])==='back','back of torso = upper back');
 ok(hit([0,1.12,2],[0,0,-1])==='abs'&&hit([0,1.12,-2],[0,0,1])==='lowback','abs in front, lower back behind');
 ok(hit([0.096,0.522,2],[0,0,-1])==='knee-L'&&hit([-0.096,0.522,2],[0,0,-1])==='knee-R','knees: person\'s left is on viewer\'s right');
 ok(hit([0.093,0.75,2],[0,0,-1])==='quad-L'&&hit([0.093,0.75,-2],[0,0,1])==='hamstring-L','thigh front = quad, back = hamstring');
 ok(hit([-0.3,0.79,2],[0,0,-1])==='hand-R','right hand');ok(hit([0,1.65,2],[0,0,-1])==='head','head');ok(hit([0,2.5,2],[0,0,-1])===null,'miss above head');
 // camera anchor for every region lands on that region
 const bad=B.keys.filter((k,r)=>{const a=B.anchor(r),m=B.map(a.p);return !isFinite(a.dist)||B.region(m[1],a.p)!==r||Math.abs(m[0])>0.01});
 ok(!bad.length,'search zoom target sits on the surface of every region'+(bad.length?' (bad: '+bad+')':''));
 // search
 const S=q=>B.search(q).map(r=>B.keys[r]);
 ok(S('tennis elbow').join()==='elbow-R,elbow-L','"tennis elbow" → both elbows');
 ok(S('right knee').join()==='knee-R','"right knee" → right knee only');
 ok(S('lats').join()==='back','"lats" → upper back');ok(S('glute').join()==='hip-R,hip-L','"glute" → hips');
 ok(S('shin splints')[0].startsWith('calf'),'"shin splints" → calf/shin');ok(S('achilles')[0].startsWith('ankle'),'"achilles" → ankle');
 ok(S('rotator cuff')[0].startsWith('shoulder'),'"rotator cuff" → shoulder');ok(S('zzz').length===0&&S('').length===0,'nonsense finds nothing');
 // no-WebGL fallback still shows the classic map
 d.querySelector('[data-gotab=body]').click();await sleep(20);
 ok($('.bodymap svg')&&!$('#b3stage'),'without WebGL the 2D body map is shown');
 // changing a level keeps the exact spot
 $('[data-pk="knee-L"] circle').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));await sleep(10);$('[data-pl="7"]').click();await sleep(30);
 const kl=store().pain['knee-L'];ok(kl.lvl===7&&kl.pt&&kl.pt[1]===0.53,'re-rating keeps the saved spot');
 $('[data-pclear="knee-L"]').click();await sleep(30);ok(!store().pain['knee-L'],'clearing removes it');
 console.log('errors',w.__e);process.exit(w.__e.length?1:0)})().catch(e=>{console.log(e.message);console.log('errors',[e.message]);process.exit(1)});
