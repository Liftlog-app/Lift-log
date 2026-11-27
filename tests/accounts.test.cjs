// Accounts + cloud backup against a fake Supabase server shared by two "phones".
// Covers: sign up (with and without email confirmation), login, wrong password, backup, restore on a new phone,
// merging both phones' workouts, deletions not coming back, offline, token refresh, log out keeps data,
// delete account, and the password-reset link.
const {JSDOM}=require('jsdom');
const html=require('fs').readFileSync(require('path').join(__dirname,'..','src','index.html'),'utf8');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ok=(c,m)=>{if(!c)throw new Error('FAILED: '+m);console.log('ok  ',m)};
const URL0='https://dbdjwtjxairfahdfufkh.supabase.co';

// ---- fake Supabase ----
const srv={users:{},tokens:{},rows:{},confirm:false,offline:false,calls:[],n:0};
const resp=(status,body)=>({ok:status<300,status,text:async()=>body==null?'':JSON.stringify(body)});
function tok(uid){const at='at'+(++srv.n),rt='rt'+srv.n;srv.tokens[at]=uid;srv.tokens[rt]=uid;const u=Object.values(srv.users).find(x=>x.id===uid);return {access_token:at,refresh_token:rt,expires_in:3600,user:{id:uid,email:u.email}}}
async function fakeFetch(url,o={}){
  if(srv.offline)throw new TypeError('Failed to fetch');
  const u=new URL(url),m=o.method||'GET',h=o.headers||{},body=o.body?JSON.parse(o.body):null,bearer=(h.Authorization||'').replace('Bearer ',''),uid=srv.tokens[bearer];
  srv.calls.push(m+' '+u.pathname+u.search);
  if(!url.startsWith(URL0))return resp(404,{});
  if(h.apikey!=='sb_publishable_pwtPG7V9ZiKXGIYn2f5_Ww_hFpO_dqV')return resp(401,{message:'No API key'});
  const p=u.pathname;
  if(p==='/auth/v1/signup'){if(srv.users[body.email])return resp(422,{msg:'User already registered'});srv.users[body.email]={id:'u'+(++srv.n),email:body.email,pw:body.password,ok:!srv.confirm};
    return resp(200,srv.confirm?{id:srv.users[body.email].id,email:body.email}:tok(srv.users[body.email].id))}
  if(p==='/auth/v1/token'){const g=u.searchParams.get('grant_type');
    if(g==='password'){const x=srv.users[body.email];if(!x||x.pw!==body.password)return resp(400,{error:'invalid_grant',error_description:'Invalid login credentials'});if(!x.ok)return resp(400,{error_code:'email_not_confirmed',msg:'Email not confirmed'});return resp(200,tok(x.id))}
    if(g==='refresh_token'){const id=srv.tokens[body.refresh_token];if(!id)return resp(400,{error_description:'Invalid Refresh Token'});srv.refreshed=(srv.refreshed||0)+1;return resp(200,tok(id))}}
  if(p==='/auth/v1/recover')return resp(200,{});
  if(p==='/auth/v1/logout'){delete srv.tokens[bearer];return resp(204,null)}
  if(p==='/auth/v1/user'){if(!uid)return resp(401,{msg:'bad jwt'});const x=Object.values(srv.users).find(v=>v.id===uid);if(m==='PUT'){x.pw=body.password;return resp(200,{id:uid,email:x.email})}return resp(200,{id:uid,email:x.email})}
  if(p==='/rest/v1/liftlog_data'){if(!uid)return resp(401,{message:'JWT expired'});
    if(m==='GET'){const want=(u.searchParams.get('user_id')||'').replace('eq.','');return resp(200,want===uid&&srv.rows[uid]?[srv.rows[uid]]:[])}
    if(m==='POST'){if(body.user_id!==uid)return resp(403,{message:'row-level security'});srv.rows[uid]={data:JSON.parse(JSON.stringify(body.data)),updated_at:body.updated_at};return resp(201,null)}}
  if(p==='/rest/v1/rpc/delete_my_account'){if(!uid)return resp(401,{});const x=Object.values(srv.users).find(v=>v.id===uid);delete srv.users[x.email];delete srv.rows[uid];return resp(204,null)}
  return resp(404,{message:'not found '+p})}

function phone(seed,hash='',au=null){
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://liftlog-app.github.io/Lift-log/'+hash,beforeParse(w){
    const RD=w.Date;class FD extends RD{constructor(...a){if(a.length)super(...a);else super(FD.now())}static now(){return RD.now()}};w.Date=FD;
    w.ResizeObserver=class{observe(){}disconnect(){}};w.fetch=fakeFetch;w.__e=[];w.addEventListener('error',e=>w.__e.push(e.message));
    if(seed)w.localStorage.setItem('liftlog.v1',JSON.stringify(seed));if(au)w.localStorage.setItem('liftlog.auth',JSON.stringify(au))}});
  const w=dom.window,d=w.document,$=s=>d.querySelector(s);
  return {w,d,$,data:()=>JSON.parse(w.localStorage.getItem('liftlog.v1')||'null'),auth:()=>JSON.parse(w.localStorage.getItem('liftlog.auth')||'null'),
    settings:async()=>{d.querySelector('[data-tab=settings]')?d.querySelector('[data-tab=settings]').click():d.querySelector('.gear').click();await sleep(30)},
    type:(id,v)=>{$('#'+id).value=v},act:async(k,wait=120)=>{$(`[data-acct="${k}"]`).click();await sleep(wait)},acct:()=>$('#acct').textContent.replace(/\s+/g,' ')}}
const sess=(id,date,s,upd)=>({[id]:{date,W:1,wk:1,s,dn:s,ex:{'Bench press':[{w:135,r:8}]},updated:upd}});

(async()=>{
  // Phone A has 2 workouts, makes an account (email confirmation off) → backed up
  const A=phone({profile:{start:'2026-11-16',unit:'lb'},sessions:{...sess('a1','2026-11-17','pushA',1000),...sess('a2','2026-11-19','pullA',2000)}});
  await sleep(100);await A.settings();
  ok(/Optional/.test(A.acct())&&A.$('#acEmail')&&A.$('#acPass'),'signed out: optional account form in Settings');
  A.type('acEmail','nheil@example.com');A.type('acPass','123');await A.act('signup');
  ok(/at least 6/.test(A.acct()),'short password is rejected before any network call');
  A.type('acPass','gains123');await A.act('signup',300);
  ok(A.auth()&&A.auth().email==='nheil@example.com','account created and signed in');
  const uidA=A.auth().uid;ok(srv.rows[uidA]&&Object.keys(srv.rows[uidA].data.sessions).sort().join()==='a1,a2','both workouts backed up to the cloud');
  ok(/Last backed up just now/.test(A.acct()),'shows "Last backed up just now"');
  ok(!JSON.stringify(srv.rows[uidA].data).includes('gains123'),'password is never stored in the backup');

  // Phone B: brand new install with one workout of its own → logs in → gets A's workouts, cloud gets B's
  const B=phone({profile:{start:'2026-11-16',unit:'lb'},sessions:sess('b1','2026-11-20','legsA',3000)});
  await sleep(100);await B.settings();B.type('acEmail','nheil@example.com');B.type('acPass','wrongpass');await B.act('login');
  ok(/Wrong email or password/.test(B.acct())&&!B.auth(),'wrong password shows a clear message');
  B.type('acPass','gains123');await B.act('login',300);
  ok(Object.keys(B.data().sessions).sort().join()==='a1,a2,b1','new phone: restored A\'s workouts and kept its own');
  ok(Object.keys(srv.rows[uidA].data.sessions).sort().join()==='a1,a2,b1','cloud now has workouts from both phones');
  await A.act('sync',300);ok(Object.keys(A.data().sessions).sort().join()==='a1,a2,b1','phone A picks up phone B\'s workout');

  // Edits: newest wins. Deletes: don't come back from the other phone.
  const M=A.w.__cloud.merge,t=Date.now();
  const m1=M({sessions:{x:{updated:5,v:'old'}},del:{}},{sessions:{x:{updated:9,v:'new'}},del:{}});ok(m1.sessions.x.v==='new','merge: newer edit of a workout wins');
  const m2=M({sessions:{},del:{x:t}},{sessions:{x:{updated:t-1000}},del:{}});ok(!m2.sessions.x&&m2.del.x===t,'merge: a deleted workout is not brought back');
  const m3=M({sessions:{},del:{x:t-5000}},{sessions:{x:{updated:t}},del:{}});ok(m3.sessions.x,'merge: a workout edited after the delete is kept');
  const m4=M({profile:{unit:'lb'},pAt:10},{profile:{unit:'kg'},pAt:20});ok(m4.profile.unit==='kg','merge: newest settings win');
  // a real delete on phone A (saved with a deletion marker) propagates to B
  const dA=A.data();delete dA.sessions.a1;dA.del={a1:Date.now()};
  const A3=phone(dA,'',A.auth());await sleep(100);await A3.w.__cloud.sync();
  await B.act('sync',300);ok(!B.data().sessions.a1&&B.data().sessions.a2,'a workout deleted on one phone disappears on the other');

  // Offline: local data safe, clear status, catches up when back online
  srv.offline=true;await B.act('sync',200);ok(/Offline/.test(B.acct())&&Object.keys(B.data().sessions).length===2,'offline: shows "Offline", workouts stay on the phone');
  srv.offline=false;await B.act('sync',300);ok(/Last backed up/.test(B.acct()),'back online: backs up again');

  // Expired token refreshes automatically
  const au=B.auth();au.exp=0;
  const B2=phone(B.data(),'',au);await sleep(100);const before=srv.refreshed||0;await B2.w.__cloud.sync();
  ok((srv.refreshed||0)>before&&B2.auth().exp>Date.now(),'expired login refreshes itself');

  // Log out keeps local workouts
  await B.act('logout',150);ok(!B.auth()&&Object.keys(B.data().sessions).length===2&&/still on this phone/.test(B.acct()),'log out: signed out, workouts stay on the phone');

  // Signup with email confirmation on
  srv.confirm=true;const C=phone(null);await sleep(100);await C.settings();C.type('acEmail','friend@example.com');C.type('acPass','squat123');await C.act('signup',200);
  ok(!C.auth()&&/confirmation link to friend@example.com/.test(C.acct()),'email confirmation: tells the user to check their email');
  await C.act('login',200);ok(/Confirm your email first/.test(C.acct()),'logging in before confirming explains why');
  C.type('acEmail','friend@example.com');await C.act('forgot',200);ok(/reset link/.test(C.acct())&&srv.calls.some(c=>c.includes('/auth/v1/recover?redirect_to=https%3A%2F%2Fliftlog-app.github.io%2FLift-log%2F')),'forgot password sends a reset link back to the web app');

  // Password reset link opens the app with a recovery session → set new password
  srv.users['friend@example.com'].ok=true;const t2=tok(srv.users['friend@example.com'].id);
  const D=phone(null,`#access_token=${t2.access_token}&refresh_token=${t2.refresh_token}&expires_in=3600&type=recovery`);await sleep(900);
  ok(D.$('#acNew')&&/Set a new password/.test(D.acct()),'reset link: app opens "Set a new password"');
  ok(!D.w.location.hash,'tokens are removed from the address bar');
  D.type('acNew','newpass99');await D.act('setpw',300);ok(srv.users['friend@example.com'].pw==='newpass99'&&/Password updated/.test(D.acct()),'new password saved');

  // Delete account needs a second tap, then removes the cloud copy only
  const E=phone({profile:{start:'2026-11-16',unit:'lb'},sessions:sess('e1','2026-11-21','pushA',4000)});await sleep(100);await E.settings();
  srv.confirm=false;E.type('acEmail','temp@example.com');E.type('acPass','temp1234');await E.act('signup',300);const uidE=E.auth().uid;ok(srv.rows[uidE],'temp account backed up');
  await E.act('delete',100);ok(srv.rows[uidE]&&/Tap again/.test(E.acct()),'delete account asks for a second tap');
  await E.act('delete',300);ok(!srv.rows[uidE]&&!srv.users['temp@example.com']&&!E.auth()&&E.data().sessions.e1,'delete account: cloud data and login gone, workouts stay on the phone');

  // API key only, never a secret key; only our project is contacted
  ok(!/sb_secret_|service_role/.test(html),'no secret or service_role key in the app');
  const errs=[A,B,C,D,E].flatMap(p=>p.w.__e);console.log('errors',errs);process.exit(errs.length?1:0);
})().catch(e=>{console.log(e.message);console.log('errors',[e.message]);process.exit(1)});
