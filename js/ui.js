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
  bg($('buddy'),BUDDY[mood||'ok']);
}
function showOverlay(title,text,btns,stars,keepGoals){
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
  try{window.scrollTo(0,0);}catch(e){}
}
function toMap(){clearHint();busy=true;running=false;showScreen('map');drawMap();wallet();}
function toHome(){clearHint();busy=true;running=false;showScreen('home');drawHome();}
function tell(title,text,art,cb,alt,party){
  $('stTitle').textContent=title; $('stText').textContent=text;
  const a=$('stArt'); a.hidden=!art; if(art)bg(a,art);
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
  level=n; startBonus=Math.min(S.streak,3);
  showScreen('game'); start();
  const first=!S.seen.includes(def.ch)&&(n-1)%PER===0;
  if(first){S.seen.push(def.ch);save();}
  drawGoals($('ovGoals'));
  let text=first?CH[def.ch].story:'Зберіть усе '+(def.time?'за '+fmtTime(def.time)+'. Ходи не рахуються, поспішайте.':'за '+def.moves+' ходів.');
  if(startBonus)text+=' Серія перемог: '+S.streak+'. На полі вже чекають бонуси: '+startBonus+'.';
  for(const k of ['amber','gems','rock','fog','time']){
    if(def[k]&&!S.tips.includes(k)){S.tips.push(k);save();text=TIPS[k]+' '+(def.time?'Час: '+fmtTime(def.time)+'.':'Ходів: '+def.moves+'.');break;}
  }
  if(def.adj>0)text+=' Після невдач Кремінчик додав '+(def.time?def.adj*5+' секунд.':def.adj+' ходи.');
  if(def.adj<0)text+=' Через довгу серію перемог запас менший на '+(def.time?'10 секунд.':'2 ходи.');
  if(def.hard)text+=def.hard===2?' Дуже складний рівень: потрійна нагорода.':' Складний рівень: подвійна нагорода.';
  running=false;
  const extra=$('ovExtra'); extra.textContent='';
  [['bomb','Бомба на старті'],['extra',def.time?'Ще 15 секунд':'Ще 3 ходи']].forEach(([k,label])=>{
    const b=h('button','opt',label+' · 15'); b.type='button';
    b.onclick=()=>{
      const cost=15*((pre.bomb?1:0)+(pre.extra?1:0)+(pre[k]?-1:1));
      if(cost>S.coins){say('Бракує монет на цей бонус.','sad');return;}
      pre[k]=!pre[k]; b.classList.toggle('on',pre[k]);
    };
    extra.appendChild(b);
  });
  showOverlay((def.hard?'Складний рівень ':'Рівень ')+n+' · '+CH[def.ch].name,text,[['Грати',()=>{
    const cost=15*((pre.bomb?1:0)+(pre.extra?1:0));
    if(cost){S.coins-=cost;save();pre.paid=true;applyPre();}
    busy=false;running=true;armHint();
    say(def.hard?'':'Щасти! Я підкажу хід, якщо задумаєтеся.');
  },'primary']],0,true);
}
function end(win,st,msg){
  clearHint(); running=false; busy=true; SPEED=1; showSkip(false);
  if(win){
    score+=def.time?Math.max(0,timeLeft)*10:moves*50;
    const first=!S.stars[level], last=level%PER===0, chapterEnd=first&&last;
    const gain=Math.round((10+st*5)*[1,2,3][def.hard]*[.8,1,1.5][S.diff])+(chapterEnd?50:0);
    stat('starsEarned',Math.max(0,st-(S.stars[level]||0)));
    const record=score>(S.best[level]||0); if(record)S.best[level]=score;
    S.stars[level]=Math.max(S.stars[level]||0,st); S.coins+=gain;
    S.streak++; if(S.streak>(S.stat.bestStreak||0))S.stat.bestStreak=S.streak;
    stat('wins'); if(S.failed!==level)stat('firstTry'); S.failed=0; S.fails={level:0,n:0};
    const got=checkAch(); save();
    hud(); sfx('win'); confetti();
    let text='Рахунок '+score+(record?' — ваш рекорд':'')+'. Нагорода: '+gain+' монет.';
    if(got.length)text+=' Досягнення: '+got.map(a=>a.name+' (+'+a.coins+')').join(', ')+'.';
    const ch=CH[def.ch], lv=level;
    const next=()=>{
      if(chapterEnd)tell(ch.gem,ch.outro,amulet(ch.a,ch.b),()=>{
        if(lv===TOTAL)tell('Камінне коло',EPILOGUE,null,toMap); else toMap();
      });
      else if(lv<TOTAL)openLevel(lv+1); else toMap();
    };
    const btns=[[chapterEnd?'Далі':lv<TOTAL?'Наступний рівень':'До карти',next,'primary']];
    if(!chapterEnd&&lv<TOTAL)btns.push(['До карти',toMap,'']);
    showOverlay('Рівень пройдено!',text,btns,st);
  }else{
    S.streak=0; S.failed=level; S.fails=S.fails.level===level?{level,n:S.fails.n+1}:{level,n:1}; loseLife(); sfx('lose'); say('Мінус одне життя. Залишилося: '+lives()+'.','sad');
    const btns=[], rich=S.coins>=30&&!msg;
    if(rich)btns.push([def.time?'Ще 20 секунд за 30 монет':'Ще 5 ходів за 30 монет',()=>{
      S.coins-=30;save();if(def.time)timeLeft+=20;else moves+=5;hud();busy=false;running=true;armHint();},'primary']);
    btns.push(['Грати ще',()=>{if(lives()<=0)noLives();else start();},rich?'':'primary']);
    btns.push(['Головне меню',toHome,'']);
    drawGoals($('ovGoals')); $('ovExtra').textContent='';
    const more=S.fails.n>=2?' Наступна спроба буде трохи легшою.':'';
    showOverlay(msg?'Жарина догоріла':'Майже вийшло!',(msg||(def.time?'Час вийшов, а ціль не зібрано.':'Трохи не вистачило. Не здавайтеся, наступного разу пощастить.'))+' Життів: '+lives()+' з '+LIFE_MAX+'.'+more,btns,0,true);
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
    bg(am,amulet(ch.a,ch.b));
    const tx=h('div');
    tx.appendChild(h('h2','','Розділ '+(ci+1)+'. '+ch.name));
    tx.appendChild(h('p','','★ '+got+' з '+PER*3+(chapterDone(ci)?' · '+ch.gem+' знайдено':'')));
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
      const n=ci*PER+i+1, st=S.stars[n]||0, timed=ci>=1&&i===6, hard=n>10?(i===PER-1?2:i===4?1:0):0;
      const deco=h('i','deco'); bg(deco,SCENE[ci]);
      const dx=x<150?x+95+(i%3)*18:x-95-(i%3)*18;
      deco.style.left=(Math.max(18,Math.min(282,dx))/3)+'%'; deco.style.top=(y+(i%2?-14:10))+'px';
      deco.style.width=deco.style.height=(38+(i*7)%26)+'px';
      path.appendChild(deco);
      if(i===4||i===PER-1){
        const id=ci*2+(i===4?0:1), kind=STOP_KIND[id%3];
        const s=h('button','stop'+(S.stops[id]?' done':st?' open':' lock')); s.type='button';
        bg(s,CHEST);
        s.style.left=((x<150?x+62:x-62)/3)+'%'; s.style.top=(y+34)+'px';
        s.setAttribute('aria-label','Міні-гра: '+STOP_NAME[kind]+(S.stops[id]?', пройдено':st?'':', закрито'));
        s.title=STOP_NAME[kind];
        if(S.stops[id]||!st)s.disabled=true; else s.onclick=()=>openStop(id,ci);
        path.appendChild(s);
      }
      const b=h('button','node'+(st?' done':n===open?' now':n>open?' lock':'')+(timed?' timed':'')+(hard?' hard'+hard:''),String(n));
      b.type='button'; b.style.left=(x/3)+'%'; b.style.top=y+'px';
      b.setAttribute('aria-label','Рівень '+n+(timed?', на час':'')+(hard?', складний':'')+(n>open?', закрито':''));
      if(n>open)b.disabled=true; else b.onclick=()=>openLevel(n);
      if(st)b.appendChild(h('span','st','★'.repeat(st)+'☆'.repeat(3-st)));
      if(n===open){nowEl=b;const me=h('i','me');bg(me,BUDDY.ok);me.style.left=b.style.left;me.style.top=(y-34)+'px';path.appendChild(me);}
      path.appendChild(b);
    });
    inner.appendChild(path); sec.appendChild(inner); map.appendChild(sec);
  });
  $('finish').textContent=chapterDone(CH.length-1)?'Обереги повернуто. Перепроходьте рівні, щоб зібрати всі зірки.':'Вулкан — остання зупинка. Обереги чекають.';
  if(nowEl)try{nowEl.scrollIntoView({block:'center'});}catch(e){}
}

/* ---------- journal ---------- */
function drawJournal(){
  const box=$('journalBody'); box.textContent='';
  box.appendChild(h('h3','','Помічники'));
  const inv=h('div','amulets');
  [['hammer','Молоток'],['rowhit','Удар у ряд'],['colhit','Удар у стовпчик'],['glove','Обмін'],['mix','Перемішати']].forEach(([k,name])=>{
    const d=h('div','amu got'), i=h('i'); i.style.backgroundImage=$(k+'I').style.backgroundImage;
    d.appendChild(i); d.appendChild(h('span','',name+' × '+S.inv[k])); inv.appendChild(d);
  });
  box.appendChild(inv);
  box.appendChild(h('h3','','Обереги'));
  const row=h('div','amulets');
  CH.forEach((ch,ci)=>{
    const d=h('div','amu'+(chapterDone(ci)?' got':'')), i=h('i');
    bg(i,amulet(ch.a,ch.b)); d.appendChild(i); d.appendChild(h('span','',chapterDone(ci)?ch.gem:'Не знайдено'));
    row.appendChild(d);
  });
  box.appendChild(row);
  box.appendChild(h('h3','','Історія'));
  box.appendChild(h('p','entry',PROLOGUE));
  CH.forEach((ch,ci)=>{
    if(!S.seen.includes(ci))return;
    const e=h('p','entry'); e.appendChild(h('b','',ch.name+'. ')); e.appendChild(document.createTextNode(ch.story+(chapterDone(ci)?' '+ch.outro:'')));
    box.appendChild(e);
  });
  if(chapterDone(CH.length-1))box.appendChild(h('p','entry',EPILOGUE));
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
function buy(what){
  if(S.inv[what]>0)return true;
  if(S.coins<20){say('Бракує монет: потрібно 20. Монети дають за пройдені рівні та досягнення.');return false;}
  S.coins-=20; S.inv[what]++; save(); hud(); say('Куплено за 20 монет.');
  return true;
}
const MODE_TIP={
  hammer:'Молоток: торкніться клітинки, яку треба розбити. Хід не витрачається.',
  rowhit:'Удар у ряд: торкніться клітинки, і весь її ряд буде вибито.',
  colhit:'Удар у стовпчик: торкніться клітинки, і весь її стовпчик буде вибито.',
  glove:'Обмін: поміняйте місцями два сусідні камінці, навіть якщо збігу немає. Хід не витрачається.'
};
for(const k of ['hammer','rowhit','colhit','glove'])$(k).onclick=()=>{
  if(busy)return;
  if(mode===k){setMode(null);say('');return;}
  if(!buy(k))return;
  setMode(k); setSel(null); say(MODE_TIP[k]);
};
$('mix').onclick=async()=>{
  if(busy||!buy('mix'))return;
  busy=true; S.inv.mix--; save(); setMode(null); setSel(null); clearHint(); combo=0; hud();
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
  const keep={custom:S.custom,muted:S.muted,amb:S.amb,gloss:S.gloss,dim:S.dim};
  S=Object.assign(freshSave(),keep); save();
  $('wipe').textContent='Скинути прогрес'; wipeArmed=0;
  $('settings').classList.remove('on'); toMap();
};
[['rPin',SP.pin],['rRow',SP.row],['rBomb',SP.bomb],['rRain',SP.rainbow],['rIce',ICE],['rCrate',SP.crate2],['rMoss',MOSS],['rGem',SP.gem],['rMud',SP.mud],['rEmber',EMBER],['rRock',SP.rock],['rFog',FOG],['rAmber',AMBER],['rFrost',FROST]].forEach(([id,u])=>bg($(id),u));
document.documentElement.style.setProperty('--ice-img','url("'+ICE+'")');
document.documentElement.style.setProperty('--ice2-img','url("'+ICE2+'")');
document.documentElement.style.setProperty('--star-img','url("'+STAR+'")');
document.documentElement.style.setProperty('--star-off','url("'+STAR_OFF+'")');
document.documentElement.style.setProperty('--heart-img','url("'+HEART+'")');
document.documentElement.style.setProperty('--fog-img','url("'+FOG+'")');
$('closeMini').onclick=closeMini;

bg($('hammerI'),svg("<rect x='44' y='40' width='12' height='54' rx='5' fill='#c58a4a' stroke='#6f4620' stroke-width='3'/><rect x='18' y='10' width='64' height='36' rx='8' fill='#b9c2c9' stroke='#4b555d' stroke-width='4'/><rect x='24' y='15' width='24' height='8' rx='4' fill='#fff' opacity='.6'/>"));
bg($('rowhitI'),SP.row); bg($('colhitI'),SP.col);
bg($('gloveI'),svg("<path d='M14 34H70M56 18 74 34 56 50' stroke='#7fe09a' stroke-width='10' fill='none' stroke-linecap='round' stroke-linejoin='round'/><path d='M86 68H30M44 52 26 68 44 84' stroke='#74bdff' stroke-width='10' fill='none' stroke-linecap='round' stroke-linejoin='round'/>"));
bg($('mixI'),svg("<path d='M50 14A36 36 0 1 1 18 34' stroke='#ffd166' stroke-width='10' fill='none' stroke-linecap='round'/><path d='M4 22 20 40 34 20Z' fill='#ffd166'/>"));
soundLabel(); drawSlots(); showScreen('home'); drawHome();
if(!S.told.includes('pro')){S.told.push('pro');save();tell('Камінне коло',PROLOGUE,amulet('#ffd166','#12808f'));}
