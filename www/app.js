(function(){
"use strict";
const APP_VER="__VER__";
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const pick=a=>a[Math.random()*a.length|0];
const MIN=6e4,DAY=864e5,IV=[0,10*MIN,DAY,3*DAY,7*DAY,16*DAY,35*DAY,90*DAY];
const now=()=>Date.now();
const dkey=d=>{d=d||new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const RM=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}})();
const CAP=!!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform());
const plug=n=>CAP?((window.Capacitor.Plugins&&window.Capacitor.Plugins[n])||(window.Capacitor.registerPlugin&&window.Capacitor.registerPlugin(n))||null):null;
const ICON={gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="20" height="20"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>'};
const fmt=(n,dp)=>{if(!isFinite(n))return '계산 불가';return Number(n).toLocaleString('ko-KR',{minimumFractionDigits:0,maximumFractionDigits:dp==null?2:dp})};

/* ---------- 데이터 ---------- */
const CS=window.COURSES||[],GL=window.GLOSS||[],CALCS=window.CALCS||[];const CM={},UM={},QM={},ALLQ=[];
CS.forEach(c=>{CM[c.id]=c;c.units.forEach((u,ui)=>{u.c=c;u.ui=ui;UM[u.id]=u;u.q.forEach((q,i)=>{q.id=u.id+':'+i;q.u=u;QM[q.id]=q;ALLQ.push(q)})})});
const GCATS=[...new Set(GL.map(g=>g[1]))];
const GQ=GL.map((g,i)=>({id:'g:'+g[0],k:'term',term:g[0],cat:g[1],def:g[2],ex:g[3],u:{t:'용어 퀴즈',c:{name:'용어',g:'nw'}}}));GQ.forEach(q=>QM[q.id]=q);

/* ---------- 저장 ---------- */
const KEY='haru-tooja-v1';
const DEF_SET={len:10,goal:50,fast:true,sfx:true,intro:true};
function normS(x){x=x&&typeof x==='object'?x:{};return {q:x.q&&typeof x.q==='object'?x.q:{},xp:+x.xp||0,streak:x.streak&&x.streak.last!=null?x.streak:{last:'',n:0},today:x.today||{d:'',xp:0},days:x.days||{},badges:x.badges||{},stat:Object.assign({lessons:0,perfect:0,bestCombo:0,calcs:0,exams:0,examBest:0,terms:0,maxStreak:0},x.stat||{}),set:Object.assign({},DEF_SET,x.set||{}),ui:x.ui&&typeof x.ui==='object'?x.ui:{}}}
let S;try{S=normS(JSON.parse(lsGet(KEY)))}catch(e){S=normS(null)}
const save=()=>lsSet(KEY,JSON.stringify(S));
const st=id=>S.q[id];
const isLearned=id=>{const s=st(id);return !!s&&s.b>=2};
const isDue=(id,t)=>{const s=st(id);return !!s&&s.due<=t};
function grade(q,ok,o){o=o||{};let s=S.q[q.id];const first=!s;if(!s)s=S.q[q.id]={b:0,due:0,n:0,w:0};s.n++;s.last=now();let nb=s.b;
  if(ok){if(first)nb=o.hard?3:2;else if(s.due<=now())nb=Math.min(7,s.b+1);}else{s.w++;nb=s.b>=4?2:1;}
  if(nb!==s.b||!ok||first){s.b=nb;s.due=now()+IV[nb];}}
function todayXP(){return S.today.d===dkey()?S.today.xp:0}
function streakN(){const y=new Date(now()-DAY);return (S.streak.last===dkey()||S.streak.last===dkey(y))?S.streak.n:0}
function addXP(x){if(!x)return;const d=dkey();if(S.today.d!==d)S.today={d,xp:0};S.today.xp+=x;S.xp+=x;S.days[d]=(S.days[d]||0)+x;
  if(S.streak.last!==d){S.streak={last:d,n:S.streak.last===dkey(new Date(now()-DAY))?S.streak.n+1:1};}S.stat.maxStreak=Math.max(S.stat.maxStreak,S.streak.n);}
const uLearned=u=>u.q.filter(q=>isLearned(q.id)).length;
const uDue=(u,t)=>u.q.filter(q=>isDue(q.id,t)).length;
const cPct=c=>{let a=0,b=0;c.units.forEach(u=>{a+=uLearned(u);b+=u.q.length});return b?a/b:0};

/* ---------- 마스코트 올리 · 소리 · 폭죽 · 급수 · 업적 ---------- */
function mascot(mood,size){size=size||64;const K='#22303A';
  const eyes={idle:`<circle cx="40" cy="44" r="4.6" fill="${K}"/><circle cx="60" cy="44" r="4.6" fill="${K}"/><circle cx="41.5" cy="42.5" r="1.4" fill="#fff"/><circle cx="61.5" cy="42.5" r="1.4" fill="#fff"/>`,
    happy:`<path d="M34 46q6-7 12 0M54 46q6-7 12 0" stroke="${K}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`,
    cheer:`<path d="M34 46q6-8 12 0M54 46q6-8 12 0" stroke="${K}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`,
    oops:`<path d="M36 40l8 8M44 40l-8 8M56 40l8 8M64 40l-8 8" stroke="${K}" stroke-width="3" stroke-linecap="round"/>`,
    sleep:`<path d="M34 45q6 3 12 0M54 45q6 3 12 0" stroke="${K}" stroke-width="3" fill="none" stroke-linecap="round"/>`}[mood]||'';
  const extra=mood==='cheer'?`<g fill="#F2C14E"><path d="M8 24l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M88 14l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z"/></g>`:mood==='sleep'?`<text x="82" y="20" font-size="13" font-weight="900" fill="#94A3B8" font-family="sans-serif">z</text>`:'';
  return `<svg class="mascot m-${mood}" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="95" rx="25" ry="3.5" fill="rgba(0,0,0,.14)"/><g class="m-body"><path d="M24 30L20 12l14 10M76 30l4-18-14 10" fill="#7A5A3A"/><ellipse cx="50" cy="58" rx="30" ry="34" fill="#8B6A47"/><ellipse cx="50" cy="66" rx="19" ry="22" fill="#F3E2C3"/><path d="M40 62q3 2 0 4M50 64q3 2 0 4M60 62q3 2 0 4M45 74q3 2 0 4M55 74q3 2 0 4" stroke="#C9A97A" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="40" cy="44" r="11" fill="#fff"/><circle cx="60" cy="44" r="11" fill="#fff"/>${eyes}<circle cx="40" cy="44" r="12" fill="none" stroke="#0F766E" stroke-width="2.6"/><circle cx="60" cy="44" r="12" fill="none" stroke="#0F766E" stroke-width="2.6"/><path d="M52 44h-4" stroke="#0F766E" stroke-width="2.6"/><path d="M46 54l4 5 4-5z" fill="#F2A23C"/><path d="M28 88q6 4 12 0M60 88q6 4 12 0" stroke="#F2A23C" stroke-width="3" fill="none" stroke-linecap="round"/></g>${extra}</svg>`;}
let AC=null;
function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){AC=null}}if(AC&&AC.state==='suspended'){try{AC.resume()}catch(e){}}return AC}
function tone(f,t0,d,type,g){const a=ac();if(!a)return;const o=a.createOscillator(),v=a.createGain();o.type=type||'sine';o.frequency.value=f;const t=a.currentTime+t0;v.gain.setValueAtTime(.0001,t);v.gain.linearRampToValueAtTime(g||.12,t+.012);v.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(v);v.connect(a.destination);o.start(t);o.stop(t+d+.05)}
const SFX={ok:()=>{tone(880,0,.14,'triangle');tone(1318.5,.09,.26,'triangle')},ng:()=>{tone(233,0,.16,'square',.05);tone(174.6,.11,.26,'square',.05)},done:()=>{[523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(f,i*.11,.32,'triangle'))},badge:()=>{[783.99,987.77,1174.66,1567.98].forEach((f,i)=>tone(f,i*.08,.28,'sine',.1))},combo:()=>{tone(1046.5,0,.1,'triangle',.08);tone(1568,.07,.16,'triangle',.08)}};
function sfx(k){if(S.set.sfx)try{SFX[k]()}catch(e){}}
function confetti(){if(RM)return;const c=document.createElement('canvas');c.className='confetti';document.body.appendChild(c);const dpr=window.devicePixelRatio||1,W=innerWidth,H=innerHeight;c.width=W*dpr;c.height=H*dpr;const x=c.getContext('2d');x.scale(dpr,dpr);
  const cols=['#0F766E','#F2C14E','#2F6EA8','#B45309','#8B3FD1','#5FD3B6'];const P=Array.from({length:120},()=>({x:W/2+(Math.random()-.5)*120,y:H*.32,vx:(Math.random()-.5)*10,vy:-Math.random()*11-4,r:Math.random()*6+5,c:pick(cols),a:Math.random()*6,va:(Math.random()-.5)*.35}));
  const t0=performance.now();let last=t0;(function f(t){const dt=Math.min(40,t-last)/16;last=t;x.clearRect(0,0,W,H);for(const p of P){p.vy+=.33*dt;p.vx*=.992;p.x+=p.vx*dt;p.y+=p.vy*dt;p.a+=p.va*dt;x.save();x.translate(p.x,p.y);x.rotate(p.a);x.fillStyle=p.c;x.fillRect(-p.r/2,-p.r/4,p.r,p.r/2);x.restore();}if(t-t0<2400)requestAnimationFrame(f);else c.remove();})(t0);}
const RANKN=['새내기 투자자','적금 졸업생','지수 추종자','배당 수집가','재무제표 탐정','밸류 헌터','포트폴리오 매니저','애널리스트','펀드매니저','투자 고수'];
const cumXP=n=>20*(n-1)*n;
function levelOf(xp){let L=1;while(L<20&&xp>=cumXP(L+1))L++;return L}
const rankOf=L=>RANKN[Math.floor((L-1)/2)]+(L%2?' I':' II');
function levelInfo(xp){const L=levelOf(xp),a=cumXP(L),b=L<20?cumXP(L+1):a;return {L,rank:rankOf(L),pct:L<20?(xp-a)/(b-a)*100:100,left:b-xp}}
const cDone=id=>CM[id].units.every(u=>uLearned(u)===u.q.length);
const BADGES=[
 ['first','1st','첫 레슨','레슨을 처음으로 끝냈어요',s=>s.stat.lessons>=1],
 ['perfect','100','만점','레슨을 하나도 안 틀리고 끝냈어요',s=>s.stat.perfect>=1],
 ['combo10','x10','10연속','10문제를 연속으로 맞혔어요',s=>s.stat.bestCombo>=10],
 ['calc20','Σ','계산왕','계산 문제를 20번 맞혔어요',s=>s.stat.calcs>=20],
 ['exam','A+','모의고사','투자론 모의고사를 80점 이상으로 마쳤어요',s=>s.stat.examBest>=80],
 ['terms50','辭','용어 50','경제 용어 50개를 익혔어요',()=>GQ.filter(q=>isLearned(q.id)).length>=50],
 ['s3','3d','3일 연속','3일 연속으로 공부했어요',s=>s.stat.maxStreak>=3],
 ['s7','7d','7일 연속','7일 연속으로 공부했어요',s=>s.stat.maxStreak>=7],
 ['s30','30d','30일 연속','30일 연속으로 공부했어요',s=>s.stat.maxStreak>=30],
 ['goal7','★','목표 7번','하루 목표를 7일 채웠어요',s=>Object.values(s.days).filter(v=>v>=s.set.goal).length>=7],
 ['iv','投','투자론 수료','투자론 단원을 모두 익혔어요',()=>cDone('iv')],
 ['fs','表','재무제표 수료','재무제표 단원을 모두 익혔어요',()=>cDone('fs')],
 ['ma','經','거시·미시 수료','경제학 단원을 모두 익혔어요',()=>cDone('ma')],
 ['nw','新','뉴스·실전 수료','뉴스·실전 단원을 모두 익혔어요',()=>cDone('nw')]];
function checkBadges(){const got=[];for(const b of BADGES){if(S.badges[b[0]])continue;let ok=false;try{ok=b[4](S)}catch(e){}if(ok){S.badges[b[0]]=now();got.push(b)}}if(got.length)save();return got}
function badgeToast(got){if(!got.length)return;sfx('badge');toast('업적 달성: '+got.map(b=>b[2]).join(', '))}
const bdgHtml=(b,lock)=>`<button class="bdg ${lock?'lock':''}" data-bdg="${b[0]}" aria-label="${esc(b[2])}: ${esc(b[3])}"><b style="font-size:${b[1].length>2?'.85rem':'1.1rem'}">${esc(b[1])}</b>${esc(b[2])}</button>`;

/* ---------- 계산기 위젯 ---------- */
let CW=0;
function calcHtml(spec,title){const id='cw'+(++CW);return `<div class="calc" data-calc="${id}">${title?`<h4>${esc(title)}</h4>`:'<h4>직접 계산해 보기</h4>'}<div class="ins">${spec.in.map(([k,l,v])=>`<label>${esc(l)}<input inputmode="decimal" data-k="${k}" value="${v}"></label>`).join('')}</div><div class="outs">${spec.out.map((o,i)=>`<div class="o"><span>${esc(o[0])}</span><b data-o="${i}"></b></div>`).join('')}</div></div>`}
const CALC_SPECS={};
function bindCalc(root,spec){root.querySelectorAll('[data-calc]').forEach(el=>{if(el.dataset.bound)return;el.dataset.bound=1;const sp=spec||CALC_SPECS[el.dataset.calc];if(!sp)return;
  const run=()=>{const vals={};el.querySelectorAll('input').forEach(i=>{vals[i.dataset.k]=parseFloat(String(i.value).replace(/,/g,''))});
    sp.out.forEach((o,i)=>{let r=NaN;try{r=new Function(...Object.keys(vals),'return ('+o[1]+')')(...Object.values(vals))}catch(e){}el.querySelector(`[data-o="${i}"]`).textContent=isFinite(r)?fmt(r,o[3])+(o[2]?' '+o[2]:''):'계산 불가'})};
  el.addEventListener('input',run);run();})}

/* ---------- 레슨 ---------- */
let L=null;
const qv=$('#qv'),footIn=$('#footIn'),lFoot=$('#lFoot');
function pickQs(u,mode){const len=S.set.len,t=now();
  if(mode==='review')return ALLQ.concat(GQ).filter(q=>isDue(q.id,t)).sort((a,b)=>st(b.id).w-st(a.id).w||st(a.id).due-st(b.id).due).slice(0,len);
  if(mode==='exam')return shuffle(CM.iv.units.flatMap(x=>x.q)).slice(0,20);
  if(mode==='terms'){const due=GQ.filter(q=>isDue(q.id,t)),fresh=shuffle(GQ.filter(q=>!st(q.id)));return due.slice(0,4).concat(fresh).slice(0,len)}
  const due=u.q.filter(q=>isDue(q.id,t)),fresh=u.q.filter(q=>!st(q.id));
  let items=due.slice(0,Math.ceil(len*.4)).concat(fresh).slice(0,len);
  if(items.length<len)items=items.concat(shuffle(u.q.filter(q=>!items.includes(q))).slice(0,len-items.length));
  return items}
function start(mode,uid){const u=uid?UM[uid]:null;const qs=pickQs(u,mode);if(!qs.length){toast(mode==='review'?'지금 복습할 문제가 없어요':'연습할 문제가 없어요');return}
  if(u){S.ui.cur=u.id;save();}closeUSheet(true);
  L={mode,u,qs:qs.map(q=>({q,retry:false})),i:0,ok:0,tot:0,xp:0,combo:0,best:0,t0:now(),miss:[],state:'ask',tok:0};
  $('#lesson').hidden=false;document.body.style.overflow='hidden';renderQ();}
function setBar(){$('#lBar').style.width=(L.i/L.qs.length*100)+'%';$('#combo').textContent=L.mode==='exam'?`${L.i+1}/${L.qs.length}`:L.combo>=3?L.combo+'연속':''}
function head(title,it){const q=it.q,c=q.u.c;return `<div class="q-head"><h2>${title}</h2>${it.retry?'<span class="tag retry">다시 한 번</span>':!st(q.id)?'<span class="tag new">새 문제</span>':''}<span class="lv" style="border-color:var(--g-${c.g});color:var(--g-${c.g})">${esc(q.u.t)}</span></div>`}
function termOpts(q){const same=shuffle(GQ.filter(x=>x!==q&&x.cat===q.cat)),other=shuffle(GQ.filter(x=>x!==q&&x.cat!==q.cat));return shuffle([q.term].concat(same.concat(other).slice(0,3).map(x=>x.term)))}
function renderQ(){const it=L.qs[L.i],q=it.q;L.state='ask';L.sel=null;L.tok++;L.hint=false;setBar();lFoot.className='l-foot';let h='';
  if(q.k==='mc'){if(!it.ord)it.ord=q.ox?q.o.map((_,i)=>i).sort((a,b)=>q.o[a].startsWith('O')?-1:1):shuffle(q.o.map((_,i)=>i));
    h=head(q.ox?'O / X':'고르세요',it)+`<p class="q-text">${esc(q.q)}</p><div class="opts ${q.ox?'ox':''}">${it.ord.map((oi,i)=>`<button class="btn opt" data-opt="${i}"><span class="n">${i+1}</span><span class="c"><span>${esc(q.o[oi])}</span></span></button>`).join('')}</div>`;}
  else if(q.k==='term'){if(!it.opts)it.opts=termOpts(q);h=head('어떤 용어일까요?',it)+`<p class="q-text">${esc(q.def)}</p>${q.ex?`<p class="need">뉴스 예문: ${esc(q.ex.replace(q.term,'○○'))}</p>`:''}<div class="opts">${it.opts.map((o,i)=>`<button class="btn opt" data-opt="${i}"><span class="n">${i+1}</span><span class="c"><span>${esc(o)}</span></span></button>`).join('')}</div>`;}
  else if(q.k==='calc'){h=head('계산 문제',it)+`<p class="q-text">${esc(q.q)}</p><div class="ans-in"><input id="ansIn" inputmode="decimal" autocomplete="off" placeholder="답 입력" aria-label="답"><span class="u">${esc(q.unit)}</span></div><p class="need">${q.dp===0?'정수로':`소수 ${q.dp}자리까지`} 입력하면 돼요. 쉼표는 써도, 안 써도 괜찮아요. 작은 반올림 차이는 정답으로 쳐요.</p>${q.f?`<button class="hint-btn" id="hintBtn">공식 힌트 보기</button><div class="formula" id="hintBox" hidden>${esc(q.f)}</div>`:''}`;}
  qv.innerHTML=h;$('#lBody').scrollTop=0;if(!RM){qv.classList.remove('q-in');void qv.offsetWidth;qv.classList.add('q-in');}
  const ai=$('#ansIn');if(ai){ai.addEventListener('input',refreshCheck);setTimeout(()=>ai.focus(),200);}
  renderFootAsk();}
function renderFootAsk(){const q=L.qs[L.i].q;footIn.classList.remove('rise-up');const fast=S.set.fast&&q.k!=='calc'&&L.mode!=='exam';
  footIn.innerHTML=`<div class="foot-row">${fast?`<span class="muted" style="font-size:.8rem;margin-left:auto">누르면 바로 채점돼요</span>`:`<button class="btn primary" id="checkBtn" disabled>확인</button>`}</div>`;}
function canCheck(){const q=L.qs[L.i].q;if(q.k==='calc'){const v=$('#ansIn');return !!v&&v.value.trim()!==''}return L.sel!==null}
function refreshCheck(){const b=$('#checkBtn');if(b)b.disabled=!canCheck()}
const parseNum=s=>{s=String(s).replace(/[,\s원%배년회억조주]/g,'').replace(/−/g,'-').replace(/p$/,'');return s===''?NaN:Number(s)};
function check(){if(L.state!=='ask'||!canCheck())return;const it=L.qs[L.i],q=it.q;let ok=false;
  if(q.k==='mc'){const oi=it.ord[L.sel];ok=oi===0;qv.querySelectorAll('[data-opt]').forEach((b,i)=>{b.classList.remove('sel');if(it.ord[i]===0)b.classList.add('right');else if(i===L.sel)b.classList.add('wrong')});}
  else if(q.k==='term'){ok=it.opts[L.sel]===q.term;qv.querySelectorAll('[data-opt]').forEach((b,i)=>{b.classList.remove('sel');if(it.opts[i]===q.term)b.classList.add('right');else if(i===L.sel)b.classList.add('wrong')});}
  else if(q.k==='calc'){const v=parseNum($('#ansIn').value);ok=isFinite(v)&&Math.abs(v-q.ans)<=q.tol;$('#ansIn').readOnly=true;if(ok&&!it.retry)S.stat.calcs++;}
  finish(ok);}
function finish(ok){const it=L.qs[L.i],q=it.q;L.state='done';L.tot++;
  if(ok){L.ok++;L.combo++;L.xp+=it.retry?5:(q.k==='calc'?(L.hint?10:15):10);L.best=Math.max(L.best,L.combo);sfx([5,10,15,20].includes(L.combo)?'combo':'ok');if(L.combo>=3&&L.mode!=='exam'){const cb=$('#combo');cb.classList.remove('pop');void cb.offsetWidth;cb.classList.add('pop');}}else{L.combo=0;sfx('ng');}
  if(!it.retry){grade(q,ok,{hard:q.k==='calc'});if(!ok){L.miss.push(q);if(L.mode!=='exam')L.qs.push({q,retry:true});}}
  save();setBar();renderFootResult(ok);}
function ansText(q){if(q.k==='calc')return `${fmt(q.ans,q.dp)} ${q.unit}`;if(q.k==='term')return q.term;return q.o[0]}
function renderFootResult(ok){const it=L.qs[L.i],q=it.q;lFoot.className='l-foot '+(ok?'ok':'ng');
  const exp=q.k==='term'?`<span class="nt">${esc(q.term)}: ${esc(q.def)}${q.ex?`\n예) ${esc(q.ex)}`:''}</span>`:`${q.f?`<pre class="formula" style="margin:4px 0">${esc(q.f)}</pre>`:''}${q.e?`<span class="nt">${esc(q.e)}</span>`:''}`;
  const title=ok?pick(['정답!','좋아요!','완벽해요!','훌륭해요!']):'아쉬워요, 정답은';
  footIn.innerHTML=`<div class="fb-scroll"><div class="fb">${mascot(ok?(L.combo>=5?'cheer':'happy'):'oops',50)}<div class="body"><h3>${title}</h3><span class="ko">${esc(ansText(q))}</span>${exp}</div></div></div><div class="foot-row"><button class="btn ${ok?'ok':'ng'}" id="nextBtn">계속</button></div>`;
  if(!RM){footIn.classList.remove('rise-up');void footIn.offsetWidth;footIn.classList.add('rise-up');}
  $('#nextBtn').focus({preventScroll:true});}
function next(){if(!L)return;L.i++;if(L.i>=L.qs.length)return renderDone();renderQ();}
function renderDone(){const secs=Math.round((now()-L.t0)/1000);const acc=L.tot?Math.round(L.ok/L.tot*100):0;
  let bonus=L.tot&&L.ok===L.tot?10:0;L.xp+=bonus;const lv0=levelOf(S.xp);addXP(L.xp);S.stat.lessons++;if(bonus)S.stat.perfect++;S.stat.bestCombo=Math.max(S.stat.bestCombo,L.best);
  if(L.mode==='exam'){S.stat.exams++;S.stat.examBest=Math.max(S.stat.examBest,acc)}save();L.state='end';
  const lv1=levelOf(S.xp),got=checkBadges();sfx(got.length?'badge':'done');if(acc>=70||lv1>lv0||got.length)setTimeout(confetti,150);
  $('#lBar').style.width='100%';$('#combo').textContent='';lFoot.className='l-foot';
  const miss=[...new Set(L.miss)];const title=L.mode==='exam'?`모의고사 ${acc}점`:acc>=90?'완벽하게 해냈어요':acc>=70?'잘했어요':'끝까지 해냈어요';
  qv.innerHTML=`<div class="q done"><div class="done-hero">${mascot(acc>=70?'cheer':'happy',110)}</div><h2>${title}</h2><p class="muted">${L.mode==='exam'?'투자론 20문제':L.mode==='terms'?'용어 퀴즈':L.u?esc(L.u.t):'복습'} · 문제 ${L.tot}개</p>
  <div class="done-stats"><div class="stat goal"><span class="k">얻은 XP</span><span class="v">+<span data-count="${L.xp}">${L.xp}</span></span></div><div class="stat"><span class="k">정답률</span><span class="v">${acc}<small>%</small></span></div><div class="stat fire"><span class="k">걸린 시간</span><span class="v">${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}</span></div></div>
  ${lv1>lv0?`<div class="lvup"><b style="font-family:var(--kr)">Lv.${lv1}</b><span>${esc(rankOf(lv1))}(으)로 올라갔어요!</span></div>`:''}${got.length?`<div class="newb"><span style="width:100%;font-weight:800">새 업적</span>${got.map(b=>bdgHtml(b,false)).join('')}</div>`:''}
  ${miss.length?`<div class="miss"><h3>틀린 문제 · 10분 뒤 복습에 다시 나와요</h3>${miss.map(q=>`<div class="miss-row"><div class="c"><span>${esc(q.k==='term'?q.term:q.q)}</span><small>정답: ${esc(ansText(q))}</small>${q.e?`<small>${esc(q.e)}</small>`:''}</div></div>`).join('')}</div>`:''}</div>`;
  countUp(qv);
  footIn.innerHTML=`<div class="foot-row"><button class="btn" id="homeBtn">그만하기</button><button class="btn primary" id="againBtn">한 판 더</button></div>`;}
function closeLesson(){if(L&&L.state!=='end'&&L.tot>0){addXP(L.xp);save();}L=null;$('#lesson').hidden=true;document.body.style.overflow='';animNext=true;refreshViews();}
$('#lesson').addEventListener('click',e=>{if(!L)return;const it=L.qs[L.i],t=e.target;
  if(t.closest('#lClose')||t.closest('#homeBtn'))return closeLesson();
  if(t.closest('#againBtn')){const m=L.mode,u=L.u&&L.u.id;L=null;start(m,u);if(!L)closeLesson();return}
  if(t.closest('#nextBtn'))return next();
  if(t.closest('#checkBtn'))return check();
  if(t.closest('#hintBtn')){L.hint=true;$('#hintBox').hidden=false;t.closest('#hintBtn').remove();return}
  if(L.state!=='ask')return;const q=it&&it.q;if(!q)return;
  const ob=t.closest('[data-opt]');if(ob){L.sel=+ob.dataset.opt;qv.querySelectorAll('[data-opt]').forEach(b=>b.classList.toggle('sel',b===ob));refreshCheck();if(S.set.fast&&L.mode!=='exam')check();}});

/* ---------- 학습 탭 ---------- */
let animNext=true,installEvt=null;
function curCourse(){return CM[S.ui.course]||CS[0]}
function nextUnit(c){return c.units.find(u=>uLearned(u)<u.q.length)||null}
function renderLearn(){const t=now(),c=curCourse(),goal=S.set.goal,tx=todayXP(),sk=streakN(),li=levelInfo(S.xp);
  const dueN=ALLQ.concat(GQ).filter(q=>isDue(q.id,t)).length;const nu=nextUnit(c);const hr=new Date().getHours();
  const learnedAll=ALLQ.filter(q=>isLearned(q.id)).length;const mood=(hr>=23||hr<5)&&!dueN?'sleep':tx>=goal?'cheer':'idle';
  const msg=tx>=goal?'오늘 목표 달성! 복리는 꾸준함에서 나와요.':dueN?`복습할 문제가 ${dueN}개 있어요. 잊기 전에 한 판!`:tx>0?`목표까지 ${goal-tx} XP 남았어요.`:sk>0?`${sk}일째 이어 가는 중! 오늘도 한 단원?`:nu?`오늘은 「${esc(nu.t)}」부터 볼까요?`:'모든 단원을 마쳤어요. 모의고사로 실력을 확인해 봐요!';
  const wk=[];for(let i=6;i>=0;i--){const d=new Date(now()-i*DAY),k=dkey(d),v=S.days[k]||0;wk.push(`<div class="${v>=goal?'gold':v>0?'on':''} ${i===0?'today':''}"><i>${v>=goal?'★':'✓'}</i>${'일월화수목금토'[d.getDay()]}</div>`)}
  const X=[0,52,74,52,0,-52,-74,-52];
  let h=`<header class="top"><div class="brand"><h1>하루<i>투자</i></h1><p>하루 10분, 시장을 읽는 힘</p></div>${installEvt?`<button class="btn primary" id="installBtn" style="padding:8px 12px">앱 설치</button>`:''}<button class="icon-btn" data-open-set aria-label="설정">${ICON.gear}</button></header>
  <section class="hero">${mascot(mood,84)}<div class="bubble-s"><p class="hello">${hr<11?'좋은 아침이에요!':hr<18?'안녕하세요!':'좋은 저녁이에요!'}</p>${msg}</div><div class="lvl"><span class="rank" style="font-family:var(--kr)">${esc(li.rank)}</span><span class="n">Lv.${li.L} · ${S.xp} XP</span><div class="bar"><span style="width:${li.pct}%"></span></div><span class="next">${li.L<20?`다음 단계 ${esc(rankOf(li.L+1))}까지 ${li.left} XP`:'최고 단계예요'}</span></div></section>
  <div class="stats"><div class="stat fire"><span class="k">연속 학습</span><span class="v"><span data-count="${sk}">${sk}</span><small>일</small></span></div><div class="stat goal"><span class="k">오늘 XP</span><span class="v"><span data-count="${tx}">${tx}</span><small>/${goal}</small></span><div class="meter"><span style="width:${Math.min(100,tx/goal*100)}%"></span></div></div><div class="stat"><span class="k">익힌 문제</span><span class="v"><span data-count="${learnedAll}">${learnedAll}</span><small>/${ALLQ.length}</small></span></div></div>
  <div class="week" aria-label="최근 7일 학습">${wk.join('')}</div>
  ${dueN?`<button class="btn primary go-main" data-review="1"><span class="t">복습 먼저</span><span class="u">잊기 직전인 문제 ${dueN}개</span><span class="s">이번 판에 ${Math.min(dueN,S.set.len)}개</span></button>`:''}
  <button class="btn exam-card" data-exam="1">${mascot('idle',48)}<span><b>투자론 모의고사</b><small>투자론 전 범위에서 20문제 · 계산 문제 포함${S.stat.examBest?` · 최고 ${S.stat.examBest}점`:''}</small></span></button>
  <section class="group"><h2>코스</h2><div class="courses">${CS.map(x=>`<button class="btn course" data-course="${x.id}" aria-pressed="${x===c}" style="--gc:var(--g-${x.g});--gs:var(--g-${x.g}-s)"><span class="c-ic">${esc(x.units[0].ic)}</span><b>${esc(x.name)}</b><span class="cp">${Math.round(cPct(x)*100)}% · ${x.units.length}단원</span><div class="meter"><span style="width:${cPct(x)*100}%"></span></div></button>`).join('')}</div><p class="note">${esc(c.d)}</p></section>
  <section class="group"><h2>${esc(c.name)} 학습 경로<span>${c.units.filter(u=>uLearned(u)===u.q.length).length}/${c.units.length} 단원</span></h2><div class="path">${c.units.map((u,i)=>{const n=uLearned(u),tot=u.q.length,dn=uDue(u,t),done=n===tot,isNext=u===nu;const C=2*Math.PI*38;
    return `<button class="node ${n?'':'todo'} ${isNext?'next':''}" data-unit="${u.id}" style="--x:${X[i%8]}px;--gc:var(--g-${c.g})">${isNext?`<span class="start-tip">${n?'이어서':'시작'}</span>`:''}<span class="ring"><svg class="pr" viewBox="0 0 84 84"><circle cx="42" cy="42" r="38" stroke="var(--line)"/><circle cx="42" cy="42" r="38" stroke="var(--gc)" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-n/tot)}"/></svg><span class="bub" style="${u.ic.length>2?'font-size:.85rem':''}">${esc(u.ic)}</span>${done?'<span class="crown">✓</span>':''}${dn?`<span class="dueb">복습 ${dn}</span>`:''}</span><span class="nl">${i+1}. ${esc(u.t)}</span><span class="nd">${n}/${tot}</span></button>`}).join('')}</div></section>
  <section class="group"><h2>업적<span>${BADGES.filter(b=>S.badges[b[0]]).length}/${BADGES.length}</span></h2><div class="badges">${BADGES.map(b=>bdgHtml(b,!S.badges[b[0]])).join('')}</div></section>
  <p class="note">교육용 앱이에요. 특정 종목 추천이나 투자 권유가 아니며, 세법·제도는 바뀔 수 있어요.</p>`;
  const vl=$('#vLearn');vl.innerHTML=h;if(animNext){animNext=false;enter(vl);countUp(vl);growBars(vl);}}
$('#vLearn').addEventListener('click',e=>{const t=e.target;
  const cb=t.closest('[data-course]');if(cb){S.ui.course=cb.dataset.course;save();animNext=true;renderLearn();return}
  const nb=t.closest('[data-unit]');if(nb)return openUSheet(nb.dataset.unit);
  if(t.closest('[data-review]'))return start('review');
  if(t.closest('[data-exam]'))return start('exam');
  const bb=t.closest('[data-bdg]');if(bb){const b=BADGES.find(x=>x[0]===bb.dataset.bdg);if(b)toast((S.badges[b[0]]?'달성 · ':'아직 · ')+b[3]);return}
  if(t.closest('#installBtn')&&installEvt){installEvt.prompt();installEvt.userChoice.finally(()=>{installEvt=null;renderLearn()});}});

/* ---------- 단원 시트 · 개념 카드 ---------- */
function openUSheet(id){const u=UM[id],c=u.c,n=uLearned(u),dn=uDue(u,now());
  $('#usheetIn').innerHTML=`<div class="u-head" style="--gc:var(--g-${c.g});--gs:var(--g-${c.g}-s)"><span class="c-ic" style="${u.ic.length>2?'font-size:.85rem':''}">${esc(u.ic)}</span><div><h2>${u.ui+1}. ${esc(u.t)}</h2><p>${esc(u.d)}</p></div></div><div class="meter"><span style="width:${n/u.q.length*100}%;background:var(--g-${c.g})"></span></div><p class="note">${n}/${u.q.length} 문제 익힘${dn?` · 복습할 문제 ${dn}개`:''} · 계산 문제 ${u.q.filter(q=>q.k==='calc').length}개</p>
  <div class="u-acts"><button class="btn" data-ucards="${u.id}">개념 카드 보기 <span>${u.cards.length}장 · 공식·계산기</span></button><button class="btn primary" data-ustart="${u.id}">${n?'연습 이어서 하기':'연습 시작'} <span>문제 ${Math.min(S.set.len,u.q.length)}개</span></button><button class="btn" id="uClose">닫기</button></div>`;
  $('#usheet').hidden=false;}
function closeUSheet(immediate){const sh=$('#usheet');if(sh.hidden)return;if(immediate||RM){sh.hidden=true;return}sh.classList.add('closing');setTimeout(()=>{sh.classList.remove('closing');sh.hidden=true},210)}
$('#usheet').addEventListener('click',e=>{const t=e.target;if(t.id==='usheet'||t.closest('#uClose'))return closeUSheet();
  const s=t.closest('[data-ustart]');if(s)return start('unit',s.dataset.ustart);
  const c=t.closest('[data-ucards]');if(c){closeUSheet(true);openViewer(c.dataset.ucards,0);}});
const V={u:null,i:0};
function openViewer(uid,i){V.u=UM[uid];V.i=i||0;$('#viewer').hidden=false;document.body.style.overflow='hidden';renderViewer();}
function closeViewer(){$('#viewer').hidden=true;document.body.style.overflow='';}
function renderViewer(){const u=V.u,cd=u.cards[V.i],last=V.i===u.cards.length-1;
  $('#vTitle').textContent=`${u.ui+1}. ${u.t}`;$('#vDots').innerHTML=u.cards.map((_,k)=>`<i class="${k===V.i?'on':''}"></i>`).join('');
  $('#vIn').innerHTML=`<p class="need" style="font-weight:700;color:var(--g-${u.c.g})">${esc(u.c.name)} · 개념 ${V.i+1}/${u.cards.length}</p><h2>${esc(cd.h)}</h2><p class="p">${cd.p}</p>${cd.f?`<div class="formula">${esc(cd.f)}</div>`:''}${cd.calc?calcHtml(cd.calc):''}`;
  if(cd.calc)bindCalc($('#vIn'),cd.calc);
  if(!RM){const v=$('#vIn');v.classList.remove('v-anim');void v.offsetWidth;v.classList.add('v-anim');}
  $('#vBody').scrollTop=0;
  $('#vFoot').innerHTML=`<button class="btn" id="vPrev" ${V.i?'':'disabled'}>이전</button>${last?`<button class="btn primary" data-ustart="${u.id}">연습 시작</button>`:`<button class="btn primary" id="vNext">다음</button>`}`;}
$('#viewer').addEventListener('click',e=>{const t=e.target;
  if(t.closest('#vClose'))return closeViewer();
  if(t.closest('#vPrev')&&V.i>0){V.i--;return renderViewer()}
  if(t.closest('#vNext')){V.i++;return renderViewer()}
  const s=t.closest('[data-ustart]');if(s){closeViewer();return start('unit',s.dataset.ustart)}});

/* ---------- 용어 탭 ---------- */
const T={q:'',cat:''};
function renderTerms(){const learned=GQ.filter(q=>isLearned(q.id)).length;
  $('#vTerms').innerHTML=`<header class="top"><div class="brand"><h1>경제 용어</h1><p>뉴스에 자주 나오는 말 ${GL.length}개</p></div><button class="icon-btn" data-open-set aria-label="설정">${ICON.gear}</button></header>
  <button class="btn primary go-main" data-tquiz="1"><span class="t">용어 퀴즈 · 익힌 용어 ${learned}/${GL.length}</span><span class="u">설명 보고 용어 맞히기</span><span class="s">한 판에 ${S.set.len}문제 · 틀린 용어는 복습에 다시 나와요</span></button>
  <input class="search" id="tSearch" type="search" placeholder="용어나 뜻으로 검색 (예: 금리, 공매도)" value="${esc(T.q)}" aria-label="용어 검색">
  <div class="chips" id="tCats"><button data-tc="" aria-pressed="${!T.cat}">전체</button>${GCATS.map(c=>`<button data-tc="${esc(c)}" aria-pressed="${T.cat===c}">${esc(c)}</button>`).join('')}</div>
  <div class="terms" id="tList"></div>`;renderTermList();}
function renderTermList(){const q=T.q.trim().toLowerCase();const list=GL.filter(g=>(!T.cat||g[1]===T.cat)&&(!q||(g[0]+g[2]).toLowerCase().includes(q)));
  $('#tList').innerHTML=list.length?list.map(g=>`<details class="term"><summary><b>${esc(g[0])}</b>${isLearned('g:'+g[0])?'<span class="cat" style="background:var(--matcha-soft);color:var(--matcha)">익힘</span>':''}<span class="cat">${esc(g[1])}</span></summary><div class="td"><span>${esc(g[2])}</span>${g[3]?`<span class="ex">${esc(g[3])}</span>`:''}</div></details>`).join(''):'<p class="note">찾는 용어가 없어요.</p>';}
$('#vTerms').addEventListener('input',e=>{if(e.target.id==='tSearch'){T.q=e.target.value;renderTermList()}});
$('#vTerms').addEventListener('click',e=>{const t=e.target;const c=t.closest('[data-tc]');if(c){T.cat=c.dataset.tc;$('#tCats').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b===c));renderTermList();return}
  if(t.closest('[data-tquiz]'))start('terms');});

/* ---------- 계산기 탭 ---------- */
function renderCalcTab(){const groups=CS.map(c=>[c,CALCS.filter(x=>x[1]===c.id)]).filter(x=>x[1].length);
  $('#vCalc').innerHTML=`<header class="top"><div class="brand"><h1>계산기</h1><p>투자론·재무·경제 공식 ${CALCS.length}가지</p></div><button class="icon-btn" data-open-set aria-label="설정">${ICON.gear}</button></header>
  ${groups.map(([c,list])=>`<section class="group"><h2><i style="background:var(--g-${c.g})"></i>${esc(c.name)}<span>${list.length}개</span></h2><div class="calc-list">${list.map(x=>`<details class="calc-item"><summary><span class="c-ic" style="--gc:var(--g-${c.g});--gs:var(--g-${c.g}-s);font-size:.8rem">Σ</span>${esc(x[0])}</summary>${calcHtml(x[2],' ')}</details>`).join('')}</div></section>`).join('')}`;
  const items=[...$('#vCalc').querySelectorAll('.calc-item')];let k=0;groups.forEach(([c,list])=>list.forEach(x=>{const el=items[k++];el.addEventListener('toggle',()=>{if(el.open){bindCalc(el,x[2]);S.stat.calcOpen=(S.stat.calcOpen||0)+1;}})}));}

/* ---------- 모션 도우미 ---------- */
function stagger(root){[...root.children].forEach((c,i)=>c.style.setProperty('--i',Math.min(i,12)));root.querySelectorAll('.badges,.path,.courses').forEach(u=>[...u.children].forEach((c,i)=>c.style.setProperty('--i',Math.min(i,14))))}
function enter(root){if(RM)return;stagger(root);root.classList.remove('enter');void root.offsetWidth;root.classList.add('enter');setTimeout(()=>root.classList.remove('enter'),1400)}
function countUp(root){if(RM)return;root.querySelectorAll('[data-count]').forEach(el=>{const to=+el.dataset.count;if(!to)return;const t0=performance.now(),d=700;(function f(t){const k=Math.min(1,(t-t0)/d),e=1-Math.pow(1-k,3);el.textContent=Math.round(to*e);if(k<1)requestAnimationFrame(f)})(t0)})}
function growBars(root){if(RM)return;const bars=[...root.querySelectorAll('.meter>span,.lvl .bar>span')];const w=bars.map(b=>b.style.width);bars.forEach(b=>{b.style.transition='none';b.style.width='0'});void root.offsetWidth;requestAnimationFrame(()=>bars.forEach((b,i)=>{b.style.transition='';b.style.width=w[i]}))}
function moveInd(){const ind=$('#navInd'),b=document.querySelector('.nav [aria-current="page"]');if(!ind||!b)return;ind.style.width=b.offsetWidth+'px';ind.style.transform=`translateX(${b.offsetLeft}px)`}
addEventListener('resize',moveInd);

/* ---------- 탭 · 설정 ---------- */
let tab=lsGet('tooja-tab')||'learn';
function setTab(t){if(!['learn','terms','calc'].includes(t))t='learn';tab=t;lsSet('tooja-tab',t);
  $('#vLearn').hidden=t!=='learn';$('#vTerms').hidden=t!=='terms';$('#vCalc').hidden=t!=='calc';
  document.querySelectorAll('.nav [data-tab]').forEach(b=>{if(b.dataset.tab===t)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
  animNext=true;refreshViews();window.scrollTo(0,0);moveInd();if(t!=='learn')enter($(t==='terms'?'#vTerms':'#vCalc'));}
function refreshViews(){if(tab==='learn')renderLearn();else if(tab==='terms')renderTerms();else renderCalcTab();}
document.addEventListener('click',e=>{const tb=e.target.closest('.nav [data-tab]');if(tb){setTab(tb.dataset.tab);return}if(e.target.closest('[data-open-set]'))openSheet();});
document.addEventListener('keydown',e=>{if(!$('#sheet').hidden&&e.key==='Escape')return closeSheet();if(!L)return;if(e.key==='Escape')return closeLesson();
  if(e.key==='Enter'){if(e.target.closest&&e.target.closest('button')&&!['nextBtn','checkBtn','againBtn'].includes(e.target.id))return;e.preventDefault();if(L.state==='ask')check();else if(L.state==='done')next();else if(L.state==='end')$('#againBtn').click();}
  else if(L.state==='ask'&&e.target.id!=='ansIn'&&/^[1-4]$/.test(e.key)){const b=qv.querySelector(`[data-opt="${+e.key-1}"]`);if(b)b.click()}});
function syncSheet(){['setLen','setGoal'].forEach(id=>{const el=$('#'+id),k=el.dataset.k;el.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v)===String(S.set[k])))});
  $('#setTypes').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',!!S.set[b.dataset.k]));$('#verNote').textContent='버전 '+APP_VER+(CAP?' · 안드로이드 앱':' · 웹앱');}
function openSheet(){syncSheet();$('#bk').value='';$('#reset').textContent='진도 초기화';$('#sheet').hidden=false;}
function closeSheet(){const sh=$('#sheet');if(RM||sh.hidden){sh.hidden=true;return refreshViews()}sh.classList.add('closing');setTimeout(()=>{sh.classList.remove('closing');sh.hidden=true;refreshViews()},210)}
$('#sClose').onclick=closeSheet;
$('#sheet').addEventListener('click',e=>{if(e.target.id==='sheet')return closeSheet();
  const sb=e.target.closest('.seg button');if(sb){const k=sb.parentElement.dataset.k;S.set[k]=+sb.dataset.v;save();syncSheet();return}
  const cb=e.target.closest('.chk button');if(cb){S.set[cb.dataset.k]=!S.set[cb.dataset.k];save();syncSheet();}});
$('#bkCopy').onclick=()=>{const txt=JSON.stringify(S);$('#bk').value=txt;try{navigator.clipboard.writeText(txt).then(()=>toast('진도를 복사했어요'),()=>{$('#bk').select();toast('위 글을 직접 복사하세요')})}catch(e){$('#bk').select()}};
$('#bkLoad').onclick=()=>{try{const x=JSON.parse($('#bk').value);if(!x||typeof x.q!=='object')throw 0;S=normS(x);save();syncSheet();toast('진도를 복원했어요')}catch(e){toast('복원할 수 없는 내용이에요')}};
$('#reset').onclick=e=>{const b=e.currentTarget;if(b.dataset.arm!=='1'){b.dataset.arm='1';b.textContent='정말 지울까요? 한 번 더 누르세요';setTimeout(()=>{b.dataset.arm='';b.textContent='진도 초기화'},4000);return}
  S=normS({set:S.set,ui:{onboarded:true}});save();b.dataset.arm='';b.textContent='진도 초기화';toast('진도를 초기화했어요')};

/* ---------- 인트로 · 첫 안내 ---------- */
function runIntro(done){const el=$('#intro');if(S.set.intro===false){el.remove();return done()}
  let closed=false;const close=()=>{if(closed)return;closed=true;el.classList.add('out');setTimeout(()=>el.remove(),550);done()};el.addEventListener('click',close);
  $('#introM').innerHTML=mascot('cheer',96);$('#introM').style.animationDelay='1.2s';$('#introLogo').style.animationDelay='1.4s';$('#introSub').style.animationDelay='1.7s';setTimeout(close,RM?900:3300);}
const ONB={i:0,goal:50,c:'iv'};
function renderOnb(){const o=$('#onbIn');const dots=`<div class="onb-dots">${[0,1,2].map(k=>`<i class="${k===ONB.i?'on':''}"></i>`).join('')}</div>`;
  if(ONB.i===0)o.innerHTML=`${mascot('happy',120)}<h2 style="font-family:var(--kr)">반가워요!<br>공부하는 부엉이, 올리예요</h2><p class="lead">시험 대비와 실전 투자, 둘 다 챙길 수 있게 만들었어요.</p><ul><li><b>投</b><span><strong>투자론</strong> 강의 목차 1~8장 + CAPM, 계산 문제와 모의고사</span></li><li><b>表</b><span><strong>재무제표</strong> 읽는 법부터 PER·DCF 가치평가까지</span></li><li><b>經</b><span>금리·환율·물가 같은 <strong>거시·미시 경제</strong></span></li><li><b>新</b><span><strong>경제뉴스 용어</strong> ${GL.length}개와 실전 투자 상식</span></li></ul>${dots}<button class="btn primary onb-go" data-onb="next">다음</button>`;
  else if(ONB.i===1)o.innerHTML=`${mascot('idle',100)}<h2 style="font-family:var(--kr)">하루에 얼마나 할까요?</h2><p class="lead">설정에서 언제든 바꿀 수 있어요.</p><div class="onb-pick">${[[30,'가볍게','하루 5분 정도'],[50,'꾸준히','하루 10분 정도'],[100,'시험 기간','하루 20분 정도']].map(([v,a,b])=>`<button class="btn" data-goal="${v}" aria-pressed="${ONB.goal===v}"><b>${a} · ${v} XP</b><span>${b}</span></button>`).join('')}</div>${dots}<button class="btn primary onb-go" data-onb="next">다음</button>`;
  else o.innerHTML=`${mascot('cheer',100)}<h2 style="font-family:var(--kr)">어디서 시작할까요?</h2><p class="lead">다른 코스도 언제든 바꿀 수 있어요.</p><div class="onb-pick">${CS.map(x=>`<button class="btn" data-oc="${x.id}" aria-pressed="${ONB.c===x.id}"><b>${esc(x.name)}</b><span>${esc(x.d)}</span></button>`).join('')}</div>${dots}<button class="btn primary onb-go" data-onb="done">공부 시작!</button>`;}
function showOnb(){if(S.ui.onboarded)return;if(Object.keys(S.q).length){S.ui.onboarded=true;save();return}$('#onb').hidden=false;renderOnb();}
$('#onb').addEventListener('click',e=>{const t=e.target;const g=t.closest('[data-goal]');if(g){ONB.goal=+g.dataset.goal;return renderOnb()}
  const c=t.closest('[data-oc]');if(c){ONB.c=c.dataset.oc;return renderOnb()}
  const b=t.closest('[data-onb]');if(!b)return;if(b.dataset.onb==='next'){ONB.i++;renderOnb();$('#onb').scrollTop=0;return}
  S.set.goal=ONB.goal;S.ui.course=ONB.c;S.ui.onboarded=true;save();$('#onb').hidden=true;animNext=true;refreshViews();confetti();sfx('done');});

let tT=0;function toast(m){const el=$('#toast');el.textContent=m;el.hidden=true;void el.offsetWidth;el.hidden=false;clearTimeout(tT);tT=setTimeout(()=>el.hidden=true,2400)}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;if(tab==='learn'&&!L)renderLearn()});
setTab(tab);requestAnimationFrame(moveInd);setTimeout(moveInd,600);
runIntro(showOnb);
if(CAP){const App=plug('App');if(App)App.addListener('backButton',()=>{if(!$('#sheet').hidden)return closeSheet();if(!$('#usheet').hidden)return closeUSheet();if(!$('#viewer').hidden)return closeViewer();if(L)return closeLesson();if(tab!=='learn')return setTab('learn');App.exitApp()});}
else if('serviceWorker' in navigator&&location.protocol==='https:'){navigator.serviceWorker.register('sw.js').catch(()=>{})}
window.__tooja={ALLQ,GQ,CALCS,QM};
})();
