/* Screens, HUD, overlays, map, journal, settings, boosters and input. */
let ovActs=[];
const fmtTime=s=>Math.floor(Math.max(0,s)/60)+':'+String(Math.max(0,s)%60).padStart(2,'0');

function drawGoals(box){
  box.textContent='';
  for(const [key,g] of Object.entries(goals)){
    const left=Math.max(0,g.need-g.have);
    const chip=h('div','chip'+(left?'':' done')), i=h('i');
    chip.setAttribute('data-key',key);
    bg(i,g.img||face(g.kind)); if(!g.img&&S.custom[g.kind])i.classList.add('glassy');
    chip.appendChild(i); chip.appendChild(document.createTextNode(left?left:'✓'));
    box.appendChild(chip);
  }
}
function hud(){
  if(!def)return;
  $('score').textContent=score;
  $('moves').textContent=def.time?fmtTime(timeLeft):moves;
  $('movesLabel').textContent=def.time?'Час':'Ходів';
  const badge=$('movesBadge');
  badge.classList.toggle('low',def.time?timeLeft<=15:moves<=5);
  $('gameScreen').classList.toggle('danger',!def.rush&&running&&(def.time?timeLeft<=10:moves<=3));
  badge.classList.toggle('timed',!!def.time);
  wallet();
  for(const k of ['hammer','rowhit','colhit','glove','mix']){$(k+'N').textContent=S.inv[k]>0?S.inv[k]:'+';$(k+'N').classList.toggle('none',S.inv[k]<=0);}
  drawGoals($('goals'));
}
function showSkip(on){const b=$('skip');if(b)b.hidden=!on;}
function skipFinale(){if(skipFin||$('skip').hidden)return;skipFin=true;SPEED=.12;showSkip(false);say('Пропускаю…');}
$('skip').onclick=skipFinale;
function wallet(){
  for(const id of ['coins','coins2','coins3'])$(id).textContent=S.coins;
  for(const id of ['starsAll','stars3'])$(id).textContent=starsAll();
  for(const id of ['lives','lives3'])$(id).textContent=lifeText();
}
function say(t,mood){
  $('toast').textContent=t||(def&&def.hard?'Складний рівень. Бережіть ходи й з\'єднуйте бонуси.':'');
  const b=$('buddy'); bg(b,BUDDY[mood||'ok']);
  if(mood){b.classList.remove('react');void b.offsetWidth;b.classList.add('react');}
}
function hero(k){const e=$('ovHero');if(!e||!BUDDY[k])return;bg(e,BUDDY[k]);e.hidden=false;}
function showOverlay(title,text,btns,stars,keepGoals){
  $('ovHero').hidden=true;
  $('ovTitle').textContent=title; $('ovText').textContent=text;
  const sb=$('ovStars'); sb.textContent='';
  if(stars)for(let i=0;i<3;i++){const e=h('i','star'+(i<stars?' on':''));e.style.animationDelay=(.25+i*.25)+'s';sb.appendChild(e);}
  $('overlay').classList.toggle('win',!!stars);
  if(!keepGoals){$('ovGoals').textContent='';$('ovExtra').textContent='';}
  const box=$('ovBtns'); box.textContent=''; ovActs=[];
  btns.forEach(([label,fn,cls])=>{
    const b=h('button',cls,label); b.type='button';
    const act=()=>{hideOverlay();fn();};
    b.onclick=act; ovActs.push(act); box.appendChild(b);
  });
  $('overlay').classList.add('on'); busy=true;
}
function hideOverlay(){$('overlay').classList.remove('on');}
function showScreen(name){
  $('homeScreen').hidden=name!=='home'; $('mapScreen').hidden=name!=='map'; $('gameScreen').hidden=name!=='game';
  $('tabs').hidden=name==='game';
  $('tabHome').classList.toggle('on',name==='home'); $('tabMap').classList.toggle('on',name==='map');
  if(typeof applyBg==='function')applyBg(name);
  if(typeof musicScene==='function')musicScene(sceneFor(name));
  try{window.scrollTo(0,0);}catch(e){}
}
function toMap(){clearHint();busy=true;running=false;showScreen('map');drawMap();wallet();}
function toHome(){clearHint();busy=true;running=false;showScreen('home');drawHome();}
function tell(title,text,art,cb,alt,party){
  $('stTitle').textContent=title; $('stText').textContent=text;
  const a=$('stArt'); a.hidden=!art; if(art)bg(a,art); a.classList.toggle('medal',String(art||'').includes('img/badge-'));
  const close=fn=>()=>{$('story').classList.remove('on','party');if(fn)fn();};
  $('stBtn').textContent=party?'Забрати':'Далі';
  $('stBtn').onclick=close(cb);
  const b=$('stAlt'); b.hidden=!alt;
  if(alt){b.textContent=alt[0];b.onclick=close(alt[1]);}
  $('story').classList.toggle('party',!!party);
  $('story').classList.add('on');
}
$('tabHome').onclick=toHome; $('tabMap').onclick=toMap;

/* ---------- level flow ---------- */
function openLevel(n){
  if(lives()<=0){noLives();return;}
  customDef=null; pre={};
  level=n; startBonus=Math.min(2,Math.floor(S.streak/2));
  showScreen('game'); start();
  const first=!def.bonus&&!S.seen.includes(def.ch)&&(n-1)%PER===0;
  if(first){S.seen.push(def.ch);save();}
  drawGoals($('ovGoals'));
  let text=first?CH[def.ch].story:'Зберіть усе '+(def.time?'за '+fmtTime(def.time)+'. Ходи не рахуються, поспішайте.':'за '+def.moves+' ходів.');
  if(startBonus)text+=' Серія перемог: '+S.streak+'. На полі вже чекає техніка: '+startBonus+'.';
  for(const k of ['amber','gems','rock','fog','time']){
    if(def[k]&&!S.tips.includes(k)){S.tips.push(k);save();text=TIPS[k]+' '+(def.time?'Час: '+fmtTime(def.time)+'.':'Ходів: '+def.moves+'.');break;}
  }
  if(def.adj>0)text+=' Після невдач '+(S.mname&&S.mname!=='Кремінчик'?S.mname:'Ріно')+' виклопотав '+(def.time?def.adj*5+' секунд.':def.adj+' ходи.');
  if(def.adj<0)text+=' Через довгу серію перемог запас менший на '+(def.time?'10 секунд.':'2 ходи.');
  if(def.hard)text+=def.hard===2?' Дуже складний рівень: потрійна нагорода.':' Складний рівень: подвійна нагорода.';
  if(def.bonus)text='Бонусний рівень із ворожого балагану: матрьошки, балалайки, півні й п\'яниці. Розтрощіть їх за '+def.moves+' ходів. Подвійна нагорода, а за першу перемогу ще й помічник у подарунок.'+(startBonus?' На полі вже чекає техніка: '+startBonus+'.':'');
  if(def.boss!=null)text=BOSSES[def.boss].intro+' Ходів: '+def.moves+'. Перемога дає потрійну нагороду.'+(def.adj>0?' Після невдач Ріно виклопотав '+def.adj+' ходи.':'');
  running=false;
  const extra=$('ovExtra'); extra.textContent='';
  [['bomb','Граната на старті'],['extra',def.time?'Ще 10 секунд':'Ще 2 ходи']].forEach(([k,label])=>{
    const b=h('button','opt',label+' · 50'); b.type='button';
    b.onclick=()=>{
      const cost=50*((pre.bomb?1:0)+(pre.extra?1:0)+(pre[k]?-1:1));
      if(cost>S.coins){say('Бракує монет на цей бонус.','sad');return;}
      pre[k]=!pre[k]; b.classList.toggle('on',pre[k]);
    };
    extra.appendChild(b);
  });
  showOverlay(def.boss!=null?'Бос: '+BOSSES[def.boss].name:def.bonus?'Бонусний рівень '+def.bonus+' · '+bonusSet(def.bonus).name:(def.hard?'Складний рівень ':'Рівень ')+n+' · '+CH[def.ch].name,text,[['Грати',()=>{
    const cost=50*((pre.bomb?1:0)+(pre.extra?1:0));
    if(cost){S.coins-=cost;save();pre.paid=true;applyPre();}
    busy=false;running=true;armHint();
    say(def.hard?'':'Щасти! Я підкажу хід, якщо задумаєтеся.','thumb');
  },'primary']],0,true);
  hero(def.boss!=null?'boss'+def.boss:'salute');
}
function end(win,st,msg){
  clearHint(); running=false; busy=true; SPEED=1; showSkip(false);
  if(win){
    score+=def.time?Math.max(0,timeLeft)*10:moves*50;
    const first=!S.stars[level], last=!def.bonus&&level%PER===0, chapterEnd=first&&last;
    let gain=Math.round((2+st*2)*[1,1.5,2][def.hard]*[.8,1,1.3][S.diff])+(chapterEnd?25:0);
    if(def.bonus)gain*=2;
    let gift=''; if(def.bonus&&first){const ks=[['hammer','Снайпер'],['rowhit','Танк у ряд'],['colhit','Танк у стовпчик'],['glove','Маневр'],['mix','Перегрупування']],g=ks[def.bonus%ks.length];S.inv[g[0]]=(S.inv[g[0]]||0)+1;gift=g[1];}
    stat('starsEarned',Math.max(0,st-(S.stars[level]||0)));
    const record=score>(S.best[level]||0); if(record)S.best[level]=score;
    S.stars[level]=Math.max(S.stars[level]||0,st); S.coins+=gain;
    S.streak++; if(S.streak>(S.stat.bestStreak||0))S.stat.bestStreak=S.streak;
    stat('wins'); if(S.failed!==level)stat('firstTry'); S.failed=0; S.fails={level:0,n:0};
    const got=checkAch(); save();
    hud(); sfx('win'); confetti(); fireworks(7);
    let text='Рахунок '+score+(record?' — ваш рекорд':'')+'. Нагорода: '+gain+' монет.';
    if(gift)text+=' Подарунок: помічник «'+gift+'».';
    if(got.length)text+=' Досягнення: '+got.map(a=>a.name+' (+'+a.coins+')').join(', ')+'.';
    const ch=CH[def.ch], lv=level;
    const next=()=>{
      if(chapterEnd){const bn=badgeGot();tell(bn>=5?BADGE+' зібрана!':ch.gem,ch.outro+(bn>=5?' Усі п\'ять частин на місці: відзнака «Лють керує зброєю» тепер ціла. Носороги не відступають!':' Ви здобули частину відзнаки «Лють керує зброєю». Зібрано '+bn+' з 5.'),badgeImg(bn),()=>{
        if(lv===TOTAL)tell('Фінал, який ще не написаний',EPILOGUE,null,toMap); else toMap();
      });}
      else if(lv<TOTAL)openLevel(lv+1); else toMap();
    };
    let btns=[[chapterEnd?'Далі':lv<TOTAL?'Наступний рівень':'До карти',next,'primary']];
    if(!chapterEnd&&lv<TOTAL)btns.push(['До карти',toMap,'']);
    if(def.bonus){const k=def.bonus+1;btns=k<=BONUS_N&&bonusOpen(k)&&!S.stars[BONUS_BASE+k]?[['Наступний бонус',()=>openLevel(BONUS_BASE+k),'primary'],['До карти',toMap,'']]:[['До карти',toMap,'primary']];}
    showOverlay(def.boss!=null?'Хряка розбито!':'Рівень пройдено!',text,btns,st);
    hero(st===3?'cheer':'flex');
  }else{
    S.streak=0; S.failed=level; S.fails=S.fails.level===level?{level,n:S.fails.n+1}:{level,n:1}; loseLife(); sfx('lose'); say('Мінус одне життя. Залишилося: '+lives()+'.','sad');
    const price=60*(1+(def.bought||0)), btns=[], rich=S.coins>=price&&!msg&&(def.bought||0)<2;
    if(rich)btns.push([(def.time?'Ще 15 секунд за ':'Ще 3 ходи за ')+price+' монет',()=>{
      S.coins-=price;def.bought=(def.bought||0)+1;S.failed=0;S.fails=S.fails.level===level?{level,n:Math.max(0,S.fails.n-1)}:S.fails;S.lives.n=Math.min(LIFE_MAX,S.lives.n+1);
      save();if(def.time)timeLeft+=15;else moves+=3;hud();busy=false;running=true;armHint();},'primary']);
    btns.push(['Грати ще',()=>{if(lives()<=0)noLives();else start();},rich?'':'primary']);
    btns.push(['Головне меню',toHome,'']);
    drawGoals($('ovGoals')); $('ovExtra').textContent='';
    const more=S.fails.n>=2?' Наступна спроба буде трохи легшою.':'';
    const boss=def.boss!=null;
    showOverlay(msg?'Міна спрацювала':boss?'Хряк ще тримається':'Майже вийшло!',(msg||(boss?'Бийте технікою та розбивайте орків: це б\'є по босу найсильніше.':def.time?'Час вийшов, а ціль не зібрано.':'Трохи не вистачило. Не здавайтеся, наступного разу пощастить.'))+' Життів: '+lives()+' з '+LIFE_MAX+'.'+more,btns,0,true);
    hero(boss?'pigsmug':'sad');
  }
}
setInterval(()=>{
  if($('gameScreen').hidden&&S.lives.n<LIFE_MAX)wallet();
  if(!def||!def.time||!running||timeLeft<=0)return;
  if($('gameScreen').hidden||document.hidden||document.querySelector('.modal.on'))return;
  timeLeft--; hud();
  if(timeLeft<=10&&timeLeft>0)sfx('tick');
  if(timeLeft<=0&&!busy){busy=true;if(def.rush)endRush();else end(false);}
},1000);

/* ---------- map ---------- */
function drawMap(){
  const map=$('map'); map.textContent='';
  const open=unlocked(), STEP=86, H=PER*STEP+30;
  let nowEl=null;
  CH.forEach((ch,ci)=>{
    const sec=h('section','chapter'), inner=h('div','inner');
    sec.style.setProperty('--a',ch.a); sec.style.setProperty('--b',CH[ci+1]?CH[ci+1].a:ch.b);
    let got=0; for(let i=1;i<=PER;i++)got+=S.stars[ci*PER+i]||0;
    const head=h('div','chHead'), am=h('i','am'+(chapterDone(ci)?' got':''));
    bg(am,pieceImg(ci));
    const tx=h('div');
    tx.appendChild(h('h2','','Локація '+(ci+1)+'. '+ch.name));
    tx.appendChild(h('p','','★ '+got+' з '+PER*3+(chapterDone(ci)?' · частину відзнаки здобуто':' · бос охороняє частину відзнаки')));
    head.appendChild(am); head.appendChild(tx); inner.appendChild(head);
    const path=h('div','path'); path.style.height=H+'px';
    const pts=[]; for(let i=0;i<PER;i++)pts.push([150+Math.sin((ci*PER+i)*1.05)*100,48+i*STEP]);
    let dd='M'+pts[0][0]+' '+pts[0][1];
    for(let i=1;i<PER;i++)dd+=' C'+pts[i-1][0]+' '+(pts[i-1][1]+STEP/2)+' '+pts[i][0]+' '+(pts[i][1]-STEP/2)+' '+pts[i][0]+' '+pts[i][1];
    const NS='http://www.w3.org/2000/svg', sv=document.createElementNS(NS,'svg'), p=document.createElementNS(NS,'path');
    sv.setAttribute('viewBox','0 0 300 '+H); sv.setAttribute('preserveAspectRatio','none');
    p.setAttribute('d',dd); p.setAttribute('fill','none'); p.setAttribute('stroke','rgba(255,255,255,.45)');
    p.setAttribute('stroke-width','5'); p.setAttribute('stroke-dasharray','2 12'); p.setAttribute('stroke-linecap','round');
    p.setAttribute('vector-effect','non-scaling-stroke');
    sv.appendChild(p); path.appendChild(sv);
    pts.forEach(([x,y],i)=>{
      const n=ci*PER+i+1, st=S.stars[n]||0, timed=ci>=1&&i===6, hard=n>10?(i===PER-1?2:(i===4||i===9)?1:0):0;
      const deco=h('i','deco'); bg(deco,SCENE[ci]);
      const dx=x<150?x+95+(i%3)*18:x-95-(i%3)*18;
      deco.style.left=(Math.max(18,Math.min(282,dx))/3)+'%'; deco.style.top=(y+(i%2?-14:10))+'px';
      deco.style.width=deco.style.height=(38+(i*7)%26)+'px';
      path.appendChild(deco);
      if(i===3||i===7||i===11){
        const id=ci*3+(i===3?0:i===7?1:2), kind=stopKind(id);
        const s=h('button','stop'+(S.stops[id]?' done':st?' open':' lock')); s.type='button';
        bg(s,CHEST);
        s.style.left=((x<150?x+62:x-62)/3)+'%'; s.style.top=(y+34)+'px';
        s.setAttribute('aria-label','Міні-гра: '+STOP_NAME[kind]+(S.stops[id]?', пройдено':st?'':', закрито'));
        s.title=STOP_NAME[kind];
        if(S.stops[id]||!st)s.disabled=true; else s.onclick=()=>openStop(id,ci);
        path.appendChild(s);
      }
      if(i===6||i===10){
        const k=ci*2+(i===6?1:2), bst=S.stars[BONUS_BASE+k]||0, op=bonusOpen(k), bs=bonusSet(k);
        const bb=h('button','bonusNode'+(bst?' done':op?' open':' lock')); bb.type='button';
        bb.style.setProperty('--bi','url("'+CHARS[bs.k.find(id=>id[0]!=='g')].f[0]+'")');
        bb.style.left=((x<150?x+78:x-78)/3)+'%'; bb.style.top=(y-6)+'px';
        bb.setAttribute('aria-label','Бонусний рівень '+k+': '+bs.name+(op?'':', відкриється після рівня '+n));
        bb.title='Бонус '+k+': '+bs.name;
        bb.appendChild(h('b','','Б'+k));
        if(bst)bb.appendChild(h('span','st','★'.repeat(bst)+'☆'.repeat(3-bst)));
        if(op)bb.onclick=()=>openLevel(BONUS_BASE+k); else bb.disabled=true;
        path.appendChild(bb);
      }
      const b=h('button','node'+(st?' done':n===open?' now':n>open?' lock':'')+(timed?' timed':'')+(hard?' hard'+hard:''),String(n));
      b.type='button'; b.style.left=(x/3)+'%'; b.style.top=y+'px';
      b.setAttribute('aria-label','Рівень '+n+(timed?', на час':'')+(hard?', складний':'')+(n>open?', закрито':''));
      if(n>open)b.disabled=true; else b.onclick=()=>openLevel(n);
      if(st)b.appendChild(h('span','st','★'.repeat(st)+'☆'.repeat(3-st)));
      if(n===open){nowEl=b;const me=h('i','me');bg(me,BUDDY.thumb||BUDDY.ok);me.style.left=b.style.left;me.style.top=(y-34)+'px';path.appendChild(me);}
      path.appendChild(b);
      if(n%PER===0){
        const B=BOSSES[BOSS_OF[ci]], m=h('i','bossMark'+(st?' ko':'')+(B.solo?' solo':'')); bg(m,st&&!B.solo?PIG('ko'):B.img);
        m.style.left=((x<150?x+70:x-70)/3)+'%'; m.style.top=(y-14)+'px'; m.title=BOSSES[BOSS_OF[ci]].name; path.appendChild(m);
      }
    });
    inner.appendChild(path); sec.appendChild(inner); map.appendChild(sec);
    if(typeof chapterBg==='function')chapterBg(sec,ci);
  });
  $('finish').textContent=chapterDone(CH.length-1)?'Усі локації пройдено. Перепроходьте рівні, щоб зібрати всі зірки.':'Степ перемоги чекає на Ріно.';
  if(nowEl)try{nowEl.scrollIntoView({block:'center'});}catch(e){}
}

/* ---------- journal ---------- */
function drawJournal(){
  const box=$('journalBody'); box.textContent='';
  box.appendChild(h('h3','','Помічники'));
  const inv=h('div','amulets');
  [['hammer','Снайпер'],['rowhit','Танк у ряд'],['colhit','Танк у стовпчик'],['glove','Маневр'],['mix','Перегрупування']].forEach(([k,name])=>{
    const d=h('div','amu got'), i=h('i'); i.style.backgroundImage=$(k+'I').style.backgroundImage;
    d.appendChild(i); d.appendChild(h('span','',name+' × '+S.inv[k])); inv.appendChild(d);
  });
  box.appendChild(inv);
  box.appendChild(h('h3','',BADGE));
  const bn=badgeGot(), bw=h('div','badgeBox'), bi=h('i','badgeBig'+(bn>=5?' whole':''));
  bg(bi,badgeImg(bn)); bw.appendChild(bi);
  bw.appendChild(h('p','',bn>=5?'Відзнака зібрана повністю. Ви справжній носоріг!':'Зібрано частин: '+bn+' з 5. Кожну частину охороняє бос в кінці локації.'));
  const row=h('div','amulets');
  CH.forEach((ch,ci)=>{
    const d=h('div','amu'+(chapterDone(ci)?' got':'')), i=h('i');
    bg(i,pieceImg(ci)); d.appendChild(i); d.appendChild(h('span','',chapterDone(ci)?ch.name:'Ще попереду'));
    row.appendChild(d);
  });
  bw.appendChild(row); box.appendChild(bw);
  box.appendChild(h('h3','','Історія'));
  STORY_BOOK.forEach(([title,text],k)=>{
    const d=h('details','book'); if(k===0)d.open=true;
    d.appendChild(h('summary','',title));
    text.split('\n').forEach(t=>{if(t.trim())d.appendChild(h('p','entry',t));});
    box.appendChild(d);
  });
  box.appendChild(h('h3','','Досягнення'));
  const list=h('ul','ach');
  ACH.forEach(a=>{
    const li=h('li',S.ach[a.id]?'got':''), now=Math.min(a.need,a.now());
    const tx=h('div'); tx.appendChild(h('b','',a.name)); tx.appendChild(h('span','',a.text+' · +'+a.coins+' монет'));
    const bar=h('div','prog'), fill=h('i'); fill.style.width=(now/a.need*100)+'%'; bar.appendChild(fill);
    tx.appendChild(bar);
    li.appendChild(tx); li.appendChild(h('em','',S.ach[a.id]?'✓':now+'/'+a.need));
    list.appendChild(li);
  });
  box.appendChild(list);
}
$('journalBtn').onclick=()=>{drawJournal();$('journal').classList.add('on');};
$('closeJournal').onclick=()=>$('journal').classList.remove('on');

/* ---------- input ---------- */
let down=null;
function cellAt(x,y){
  const b=boardEl.getBoundingClientRect();
  return at(Math.floor((y-b.top)/(b.height/ROWS)),Math.floor((x-b.left)/(b.width/COLS)));
}
function drag(e){
  if(!down)return false;
  const {t,x,y}=down, dx=e.clientX-x, dy=e.clientY-y;
  const cell=boardEl.getBoundingClientRect().width/COLS;
  if(Math.max(Math.abs(dx),Math.abs(dy))<cell*0.33)return false;
  down=null;
  let r=t.r,c=t.c;
  if(Math.abs(dx)>Math.abs(dy))c+=dx>0?1:-1; else r+=dy>0?1:-1;
  const n=at(r,c); if(n)attempt(t,n);
  return true;
}
boardEl.addEventListener('pointerdown',e=>{
  if(busy){if(!$('skip').hidden)skipFinale();return;}
  const t=cellAt(e.clientX,e.clientY); if(!t)return;
  down={t,x:e.clientX,y:e.clientY};
  try{boardEl.setPointerCapture(e.pointerId)}catch(_){}
});
boardEl.addEventListener('pointermove',e=>{if(down&&!busy&&(!mode||mode==='glove'))drag(e);});
boardEl.addEventListener('pointerup',e=>{
  if(!down||busy){down=null;return;}
  const t=down.t;
  if(mode==='hammer'){down=null;useHammer(t);return;}
  if(mode==='rowhit'||mode==='colhit'){down=null;useStrike(t,mode==='rowhit');return;}
  if(drag(e))return;
  down=null;
  if(sel&&sel!==t&&Math.abs(sel.r-t.r)+Math.abs(sel.c-t.c)===1)attempt(sel,t);
  else if(bonus(t)&&mode!=='glove')activate(t);
  else if(fixed(t)){setSel(null);say(FIXED_MSG);}
  else{clearHint();setSel(sel===t?null:t);armHint();}
});
boardEl.addEventListener('pointercancel',()=>{down=null;});

/* ---------- boosters ---------- */
function setMode(m){
  mode=m; boardEl.classList.toggle('aim',!!m);
  for(const k of ['hammer','rowhit','colhit','glove'])$(k).classList.toggle('on',m===k);
}
/* boosters are scarce on purpose: they cost a lot and only two may be used per level */
const BOOST_PRICE={hammer:90,rowhit:120,colhit:120,glove:70,mix:50}, BOOST_LIMIT=2;
function buy(what){
  if(def&&(def.boosts||0)>=BOOST_LIMIT){say('За один рівень можна використати лише '+BOOST_LIMIT+' підсилення. Далі тільки власними силами!','sweat');return false;}
  if(S.inv[what]>0)return true;
  const p=BOOST_PRICE[what];
  if(S.coins<p){say('Бракує монет: потрібно '+p+'. Монети дають за зірки, босів і міні-ігри.','sad');return false;}
  S.coins-=p; S.inv[what]++; save(); hud(); say('Куплено за '+p+' монет.');
  return true;
}
const MODE_TIP={
  hammer:'Снайпер: торкніться клітинки, по якій треба влучити. Хід не витрачається.',
  rowhit:'Танк у ряд: торкніться клітинки, і танк прострілить увесь її ряд.',
  colhit:'Танк у стовпчик: торкніться клітинки, і танк прострілить увесь її стовпчик.',
  glove:'Маневр: поміняйте місцями два сусідні предмети, навіть якщо збігу немає. Хід не витрачається.'
};
for(const k of ['hammer','rowhit','colhit','glove'])$(k).onclick=()=>{
  if(busy)return;
  if(mode===k){setMode(null);say('');return;}
  if(!buy(k))return;
  setMode(k); setSel(null); say(MODE_TIP[k]);
};
$('mix').onclick=async()=>{
  if(busy||!buy('mix'))return;
  busy=true; S.inv.mix--; def.boosts=(def.boosts||0)+1; save(); setMode(null); setSel(null); clearHint(); combo=0; hud();
  shuffle(); await cascade(); await after(false);
};
function quit(){
  if(running&&played&&!def.rush){S.streak=0;S.failed=level;loseLife();}
}
$('restart').onclick=()=>{
  if(busy)return;
  quit();
  if(!def.rush&&lives()<=0){noLives();return;}
  start();
};
$('back').onclick=()=>{quit();toHome();};

/* ---------- settings ---------- */
function soundLabel(){
  $('sound').textContent='Звук: '+(S.muted?'вимк.':'увімк.');
  $('diff').textContent='Складність: '+['легка','звичайна','висока'][S.diff];
}
$('diff').onclick=()=>{S.diff=(S.diff+1)%3;save();soundLabel();};
$('sound').onclick=()=>{S.muted=!S.muted;save();soundLabel();if(!S.muted)audio();};
$('full').onclick=()=>{
  try{
    if(document.fullscreenElement)document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(()=>{});
  }catch(e){}
};
$('gear').onclick=$('gear2').onclick=()=>$('settings').classList.add('on');
$('closeSet').onclick=()=>$('settings').classList.remove('on');
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){$('settings').classList.remove('on');$('journal').classList.remove('on');$('mini').classList.remove('on');if(mode)setMode(null);}
});
let slot=0, wipeArmed=0;
function drawSlots(){
  const box=$('slots'); box.textContent='';
  for(let i=0;i<NSYM;i++){
    const b=h('button','slot'); b.type='button';
    b.setAttribute('aria-label','Замінити символ '+(i+1));
    bg(b,face(i)); b.classList.toggle('glassy',!!S.custom[i]);
    b.onclick=()=>{slot=i;$('file').click();};
    box.appendChild(b);
  }
}
function repaint(){each(paint);drawSlots();hud();}
$('file').addEventListener('change',e=>{
  const f=e.target.files[0]; e.target.value=''; if(!f)return;
  const url=URL.createObjectURL(f), img=new Image();
  img.onload=()=>{
    const Z=192, cv=document.createElement('canvas'); cv.width=cv.height=Z;
    const s=Math.min(img.width,img.height);
    cv.getContext('2d').drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,Z,Z);
    S.custom[slot]=cv.toDataURL('image/png');
    URL.revokeObjectURL(url); save(); repaint();
  };
  img.onerror=()=>{URL.revokeObjectURL(url);};
  img.src=url;
});
$('resetImgs').onclick=()=>{S.custom=new Array(NSYM).fill(null);save();repaint();};
$('wipe').onclick=()=>{
  if(Date.now()-wipeArmed>4000){wipeArmed=Date.now();$('wipe').textContent='Натисніть ще раз, щоб скинути';return;}
  const keep={custom:S.custom,muted:S.muted,amb:S.amb,gloss:S.gloss,dim:S.dim,music:S.music,mvol:S.mvol,tracks:S.tracks,intro:S.intro,mname:S.mname,gname:S.gname,gsub:S.gsub,st:S.st,lvbg:S.lvbg};
  S=Object.assign(freshSave(),keep); save();
  $('wipe').textContent='Скинути прогрес'; wipeArmed=0;
  $('settings').classList.remove('on'); toMap();
};
[['rBoss',BOSSES[2].img],['rPin',DRONE_FULL],['rRow',SP.row],['rBomb',SP.bomb],['rRain',SP.rainbow],['rIce',ICE],['rCrate',SP.crate2],['rMoss',MOSS],['rGem',SP.gem],['rMud',SP.mud],['rEmber',EMBER],['rRock',SP.rock],['rFog',FOG],['rAmber',AMBER],['rFrost',FROST]].forEach(([id,u])=>bg($(id),u));
document.documentElement.style.setProperty('--ice-img','url("'+ICE+'")');
document.documentElement.style.setProperty('--ice2-img','url("'+ICE2+'")');
document.documentElement.style.setProperty('--star-img','url("'+STAR+'")');
document.documentElement.style.setProperty('--star-off','url("'+STAR_OFF+'")');
document.documentElement.style.setProperty('--heart-img','url("'+HEART+'")');
document.documentElement.style.setProperty('--fog-img','url("'+FOG+'")');
$('closeMini').onclick=closeMini;

bg($('hammerI'),svg("<circle cx='50' cy='50' r='34' fill='none' stroke='#1d2a30' stroke-width='11'/><circle cx='50' cy='50' r='34' fill='none' stroke='#e5332a' stroke-width='6'/><path d='M50 4V32M50 68V96M4 50H32M68 50H96' stroke='#1d2a30' stroke-width='10' stroke-linecap='round'/><path d='M50 6V30M50 70V94M6 50H30M70 50H94' stroke='#fff' stroke-width='5' stroke-linecap='round'/><circle cx='50' cy='50' r='6' fill='#e5332a'/>"));
bg($('rowhitI'),SP.row); bg($('colhitI'),SP.col);
bg($('gloveI'),svg("<path d='M14 34H70M56 18 74 34 56 50' stroke='#7fe09a' stroke-width='10' fill='none' stroke-linecap='round' stroke-linejoin='round'/><path d='M86 68H30M44 52 26 68 44 84' stroke='#74bdff' stroke-width='10' fill='none' stroke-linecap='round' stroke-linejoin='round'/>"));
bg($('mixI'),svg("<path d='M50 14A36 36 0 1 1 18 34' stroke='#ffd166' stroke-width='10' fill='none' stroke-linecap='round'/><path d='M4 22 20 40 34 20Z' fill='#ffd166'/>"));
soundLabel(); drawSlots(); showScreen('home'); drawHome();
if(!S.told.includes('pro'))setTimeout(()=>{S.told.push('pro');save();tell('РІНО чекає на тебе!',PROLOGUE,BUDDY.salute||amulet('#ffd166','#12808f'));},0);
