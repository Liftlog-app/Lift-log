// Custom dropdowns, calendar picker, haptics setting and intro animation.
const {JSDOM}=require('jsdom');
const html=require('fs').readFileSync(require('path').join(__dirname,'..','src','index.html'),'utf8');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const seed={profile:{start:'2026-11-16',unit:'lb'},sessions:{'2026-11-23_pushA':{date:'2026-11-23',W:2,wk:2,s:'pushA',ex:{'Bench press':[{w:135,r:8}]},updated:5}}};
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',beforeParse(w){const RD=w.Date;class FD extends RD{constructor(...a){if(a.length)super(...a);else super(FD.now())}static now(){return new RD('2026-11-25T12:00:00').getTime()}};w.Date=FD;w.ResizeObserver=class{observe(){}disconnect(){}};w.localStorage.setItem('liftlog.v1',JSON.stringify(seed));w.__e=[];w.addEventListener('error',e=>w.__e.push(e.message))}});
const w=dom.window,d=w.document,$=s=>d.querySelector(s);
const ok=(c,m)=>{if(!c)throw new Error('FAILED: '+m);console.log('ok  ',m)};
(async()=>{await sleep(100);
 ok($('#intro')&&$('#intro svg .ick'),'intro with logo is shown on open');
 $('[data-tab=today]').click();await sleep(20);
 // calendar
 const wd=$('#wdate'),cb=wd._cf;ok(wd.classList.contains('nat')&&cb&&cb.classList.contains('cdate'),'native date input replaced by custom button');
 ok(/Nov 25/.test(cb.textContent),'date button shows formatted date: '+cb.textContent);
 cb.click();await sleep(10);const sh=$('.clayer .csheet');ok(sh,'tapping the date opens the custom calendar sheet');
 ok($('.cmon').textContent.trim()==='November 2026','calendar shows the current month');
 ok($('.cday.td[data-v="2026-11-25"]')&&$('.cday.on[data-v="2026-11-25"]'),'today ringed and selected');
 ok($('.cday.has[data-v="2026-11-23"]'),'day with a logged workout has a dot');
 $('[data-m="1"]').click();await sleep(5);ok($('.cmon').textContent.trim()==='December 2026','next month arrow');
 $('[data-v="2026-12-02"]').click();await sleep(450);
 ok(!$('.clayer')||$('.clayer.out'),'sheet closes after picking');
 ok($('#wdate').value==='2026-12-02','picked date drives the workout date (re-rendered)');
 ok(/Dec 2/.test($('#wdate')._cf.textContent),'button shows new date');
 // calendar Today button + min/max on bodyweight date
 $('[data-tab=progress]').click();await sleep(10);$('[data-pseg=body]').click();await sleep(10);
 $('#bwd')._cf.click();await sleep(10);ok($('.cday[data-v="2026-11-26"]').disabled,'dates after max are disabled');ok($('[data-m="1"]').disabled,'cannot go past max month');
 d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));$('.clayer').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await sleep(250);ok(!$('.clayer'),'Escape closes calendar');
 $('#bwby')._cf.click();await sleep(10);ok($('[data-c=clear]'),'goal date calendar offers Clear');$('[data-c=today]').click();await sleep(450);ok($('#bwby').value==='2026-11-25','Today button picks today');
 // dropdown
 $('[data-tab=settings]')?$('[data-tab=settings]').click():$('.gear').click();await sleep(20);
 const u=$('#unit');ok(u&&u._cf&&u._cf.classList.contains('csel'),'units select replaced by custom dropdown');ok(/Pounds/.test(u._cf.textContent),'dropdown shows selected text');
 u._cf.click();await sleep(10);const opts=d.querySelectorAll('.cmenu [role=option]');ok(opts.length===2&&opts[0].getAttribute('aria-selected')==='true','dropdown lists options with selection');
 ok(u._cf.getAttribute('aria-expanded')==='true','button marked expanded');
 opts[1].click();await sleep(300);ok(JSON.parse(w.localStorage.getItem('liftlog.v1')).profile.unit==='kg','choosing an option saves the setting');
 ok(/Kilograms/.test($('#unit')._cf.textContent),'dropdown shows new choice');
 $('#rpedef')._cf.click();await sleep(10);$('.cbd').click();await sleep(250);ok(!$('.clayer'),'tapping outside closes dropdown');
 ok(d.querySelectorAll('select:not(.nat),input[type=date]:not(.nat)').length===0,'no native dropdown/date pickers left on screen');
 // haptics toggle
 ok($('#haptics')&&$('#haptics').checked,'vibrate-on-tap setting on by default');
 $('#haptics').click();await sleep(20);ok(JSON.parse(w.localStorage.getItem('liftlog.v1')).profile.haptics===false,'vibrate-on-tap can be turned off');
 await sleep(2300);ok(!$('#intro'),'intro removes itself');
 console.log('errors',w.__e);process.exit(w.__e.length?1:0)})().catch(e=>{console.log(e.message);console.log('errors',[e.message]);process.exit(1)});
