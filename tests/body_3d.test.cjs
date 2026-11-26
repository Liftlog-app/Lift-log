// 3D body pain map: geometry picking, region mapping, search, exact-spot saving, new pain areas, and the no-WebGL fallback.
const {JSDOM}=require('jsdom');
const html=require('fs').readFileSync(require('path').join(__dirname,'..','src','index.html'),'utf8');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const seed={profile:{start:'2026-11-16',unit:'lb',pain:{'knee-L':{lvl:5,date:'2026-11-20',pt:[0.151,0.504,0.08]}}},sessions:{}};
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',beforeParse(w){const RD=w.Date;class FD extends RD{constructor(...a){if(a.length)super(...a);else super(FD.now())}static now(){return new RD('2026-11-26T12:00:00').getTime()}};w.Date=FD;w.ResizeObserver=class{observe(){}disconnect(){}};w.localStorage.setItem('liftlog.v1',JSON.stringify(seed));w.__e=[];w.addEventListener('error',e=>w.__e.push(e.message))}});
const w=dom.window,d=w.document,$=s=>d.querySelector(s),store=()=>JSON.parse(w.localStorage.getItem('liftlog.v1')).profile;
const ok=(c,m)=>{if(!c)throw new Error('FAILED: '+m);console.log('ok  ',m)};
(async()=>{await sleep(100);const B=w.__b3;ok(B&&B.keys.length===32,'32 body regions');
 // every region has a pain area and label
 ok(B.keys.every(k=>{try{return !!B.label(k)}catch(e){return false}}),'every region has a label: '+B.keys.map(B.label).join(', '));
 // ray picking on the real body mesh hits the right part from the right side
 const hit=(o,dir)=>{const h=B.ray(o,dir);return h&&h.key};
 ok(hit([0,1.32,2],[0,0,-1])==='chest','front of upper torso = chest');
 ok(hit([0,1.32,-2],[0,0,1])==='back','back of upper torso = upper back');
 ok(hit([0,1.12,2],[0,0,-1])==='abs'&&hit([0,1.10,-2],[0,0,1])==='lowback','abs in front, lower back behind');
 ok(hit([0.151,0.504,2],[0,0,-1])==='knee-L'&&hit([-0.151,0.504,2],[0,0,-1])==='knee-R','knees: person\'s left is on viewer\'s right');
 ok(hit([0.13,0.71,2],[0,0,-1])==='quad-L'&&hit([0.13,0.71,-2],[0,0,1])==='hamstring-L','thigh front = quad, back = hamstring');
 ok(hit([0,1.65,2],[0,0,-1])==='head','head');ok(hit([0,1.49,2],[0,0,-1])==='neck'&&hit([0,1.49,-2],[0,0,1])==='neck','neck front and back');ok(hit([0,2.5,2],[0,0,-1])===null,'miss above head');
 // every region exists on the mesh and its zoom target can be seen from the camera direction it uses
 const G=B.load();ok(G.nv>10000&&G.nt>20000,`real mesh loaded (${G.nv} vertices, ${G.nt} triangles)`);
 const bad=B.keys.filter((k,r)=>{const a=B.anchor(r),dv=[-Math.sin(a.yaw),0,Math.cos(a.yaw)],h=B.ray([a.p[0]+dv[0]*2,a.p[1],a.p[2]+dv[2]*2],[-dv[0],0,-dv[2]]);return !isFinite(a.dist)||!h||h.r!==r});
 ok(!bad.length,'search zoom lands on and faces every region'+(bad.length?' (bad: '+bad+')':''));
 ok(B.near([0.151,0.504,0.5]).d>0.1&&B.near([0.151,0.504,0.5]).p[2]<0.2,'off-surface spots snap to the body surface');
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
 const kl=store().pain['knee-L'];ok(kl.lvl===7&&kl.pt&&kl.pt[1]===0.504,'re-rating keeps the saved spot');
 $('[data-pclear="knee-L"]').click();await sleep(30);ok(!store().pain['knee-L'],'clearing removes it');
 console.log('errors',w.__e);process.exit(w.__e.length?1:0)})().catch(e=>{console.log(e.message);console.log('errors',[e.message]);process.exit(1)});
