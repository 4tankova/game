/* Everything around the levels: daily rewards, wheel, quests, star chest, mini-games and map scenery. */
const today=()=>new Date().toISOString().slice(0,10);
const BOOST_NAME={hammer:'снайпер',glove:'маневр',mix:'перегрупування',rowhit:'танк у ряд',colhit:'танк у стовпчик'};
function give(r){
  const parts=[];
  if(r.coins){S.coins+=r.coins;parts.push(r.coins+' монет');}
  for(const k of ['hammer','glove','mix','rowhit','colhit'])if(r[k]){S.inv[k]+=r[k];parts.push(BOOST_NAME[k]+(r[k]>1?' ×'+r[k]:''));}
  save();
  return parts.join(' і ');
}
function openMini(title){
  $('miniTitle').textContent=title;
  const body=$('miniBody'); body.textContent='';
  $('mini').classList.add('on');
  return body;
}
function closeMini(){$('mini').classList.remove('on');refresh();}

function refresh(){drawHome();if(!$('mapScreen').hidden)drawMap();}
function prize(r,why){
  const txt=give(r);
  sfx('win');
  tell('Чудова робота!',why+' Нагорода: '+txt+'.',BUDDY.cheer||BUDDY.wow,refresh,null,true);
}

/* ---------- lives ---------- */
const LIFE_MAX=5, LIFE_MS=15*60e3;
function lives(){
  const L=S.lives;
  if(L.n<LIFE_MAX){
    const add=Math.floor((Date.now()-L.t)/LIFE_MS);
    if(add>0){L.n=Math.min(LIFE_MAX,L.n+add);L.t+=add*LIFE_MS;}
  }
  return L.n;
}
function loseLife(){
  if(lives()>=LIFE_MAX)S.lives.t=Date.now();
  S.lives.n=Math.max(0,S.lives.n-1); save();
}
function lifeText(){
  const n=lives();
  if(n>=LIFE_MAX)return n+'/'+LIFE_MAX;
  return n+'/'+LIFE_MAX+' · '+fmtTime(Math.ceil((S.lives.t+LIFE_MS-Date.now())/1000));
}
function noLives(){
  tell('Життя закінчилися','Одне життя відновлюється за 15 хвилин. Наступне буде через '+fmtTime(Math.ceil((S.lives.t+LIFE_MS-Date.now())/1000))+'. Міні-ігри й колесо удачі життів не потребують.',BUDDY.sad,toHome,
    S.coins>=80?['Поповнити всі за 80 монет',()=>{S.coins-=80;S.lives.n=LIFE_MAX;save();toHome();}]:null);
}

/* ---------- reward track for passed levels ---------- */
const TRACK=[{coins:15},{mix:1},{coins:20},{hammer:1},{coins:25},{glove:1},{coins:30,rowhit:1}];
const passed=()=>Object.keys(S.stars).length;
function claimTrack(){
  const need=(S.track+1)*5; if(passed()<need)return;
  const r=TRACK[S.track%TRACK.length]; S.track++;
  prize(r,'Пройдено рівнів: '+need+'.');
}
function drawTrack(){
  const box=$('track'); box.textContent='';
  const p=passed(); let cur=null;
  for(let i=0;i<TOTAL/5;i++){
    const need=(i+1)*5, got=i<S.track, ready=!got&&p>=need;
    const d=h('div','mile'+(got?' got':ready?' ready':'')), ic=h('i');
    bg(ic,CHEST); d.appendChild(ic); d.appendChild(h('span','',got?'✓':String(need)));
    if(!got&&!cur)cur=d;
    box.appendChild(d);
  }
  const need=(S.track+1)*5, b=$('trackBtn');
  if(S.track>=TOTAL/5){b.textContent='Усі нагороди зібрано';b.disabled=true;b.className='';}
  else if(p>=need){b.textContent='Забрати нагороду за '+need+' рівнів';b.disabled=false;b.className='primary';}
  else{b.textContent='Ще '+(need-p)+' до нагороди';b.disabled=true;b.className='';}
  b.onclick=claimTrack;
  if(cur)try{box.scrollLeft=Math.max(0,cur.offsetLeft-60);}catch(e){}
}
function drawHome(){
  const n=unlocked();
  $('playBtn').textContent=(chapterDone(CH.length-1)?'Грати знову · Рівень ':'Грати · Рівень ')+n;
  $('playBtn').onclick=()=>openLevel(n);
  $('streak').textContent=S.streak>0?'Серія перемог: '+S.streak+' — на старті чекатимуть бонуси':'';
  drawTrack(); drawHub(); wallet();
}

/* ---------- daily login ladder ---------- */
const LOGIN=[{coins:5},{coins:8},{mix:1},{coins:10},{coins:12},{glove:1},{coins:30,hammer:1}];
function loginState(){
  const t=today(), L=S.login;
  if(L.day===t)return {ready:false,n:L.n};
  const y=new Date(Date.now()-864e5).toISOString().slice(0,10);
  return {ready:true,n:L.day===y?L.n%7+1:1};
}
function claimLogin(){
  const st=loginState(); if(!st.ready)return;
  S.login={day:today(),n:st.n};
  prize(LOGIN[st.n-1],'Подарунок за день '+st.n+' з 7. Заходьте завтра по наступний.');
}

/* ---------- daily quests ---------- */
const QUESTS=[
  {k:'wins',n:1,text:'Пройти перший рівень дня',coins:6},
  {k:'match',n:40,text:'Зробити 40 збігів',coins:6},
  {k:'firstTry',n:1,text:'Пройти рівень з першої спроби',coins:10},
  {k:'wins',n:3,text:'Виграти 3 рівні',coins:10},
  {k:'bonus',n:8,text:'Створити 8 бонусів',coins:6},
  {k:'pop',n:150,text:'Прибрати 150 предметів',coins:6},
  {k:'merge',n:2,text:'З\'єднати бонуси 2 рази',coins:8},
  {k:'starsEarned',n:5,text:'Заробити 5 зірок',coins:10},
  {k:'ice',n:10,text:'Розбити 10 шарів льоду',coins:6},
  {k:'crate',n:8,text:'Розбити 8 орків',coins:6}
];
function daily(){
  const t=today();
  if(!S.daily||S.daily.day!==t){
    const R=rng(Number(t.replace(/-/g,''))), pool=QUESTS.map((q,i)=>i), ids=[];
    while(ids.length<3)ids.push(pool.splice(Math.floor(R()*pool.length),1)[0]);
    S.daily={day:t,ids,base:ids.map(i=>S.stat[QUESTS[i].k]||0),done:[0,0,0]};
    save();
  }
  return S.daily;
}
function claimQuest(j){
  const d=daily(), q=QUESTS[d.ids[j]];
  if(d.done[j]||(S.stat[q.k]||0)-d.base[j]<q.n)return;
  d.done[j]=1; prize({coins:q.coins},'Завдання дня виконано.');
}

/* ---------- star chest ---------- */
function claimChest(){
  if(starsAll()<S.chestAt)return;
  const k=['hammer','glove','mix','rowhit','colhit'][Math.floor(Math.random()*5)];
  S.chestAt+=15;
  prize({coins:15,[k]:1},'Зоряну скриню відкрито.');
}

/* ---------- wheel of fortune ---------- */
const WHEEL=[{coins:3},{hammer:1},{coins:5},{glove:1},{coins:10},{mix:1},{coins:25},{coins:4}];
const WHEEL_TXT=['3','Снайпер','5','Маневр','10','Мішати','25','4'];
function openWheel(){
  const body=openMini('Колесо удачі');
  const box=h('div','wheelBox'), wheel=h('div','wheel'), pin=h('i','wheelPin');
  WHEEL_TXT.forEach((t,i)=>{
    const a=(i*45+22.5-90)*Math.PI/180, s=h('span','',t);
    s.style.left=(50+31*Math.cos(a))+'%'; s.style.top=(50+31*Math.sin(a))+'%';
    s.style.transform='translate(-50%,-50%)'; wheel.appendChild(s);
  });
  box.appendChild(wheel); box.appendChild(pin); body.appendChild(box);
  const msg=h('p','miniMsg',''), btn=h('button','primary'), close=h('button','','Закрити');
  btn.type='button'; close.type='button'; close.onclick=closeMini;
  let turn=0, spinning=false;
  const label=()=>{
    const free=S.wheel!==today();
    btn.textContent=free?'Крутити безплатно':'Крутити за 60 монет';
    btn.disabled=spinning||(!free&&S.coins<60);
    msg.textContent=msg.textContent||(free?'Один безплатний оберт щодня.':'Безплатний оберт уже використано. Монет: '+S.coins+'.');
  };
  btn.onclick=()=>{
    if(spinning)return;
    if(S.wheel===today()){if(S.coins<60)return;S.coins-=60;}
    S.wheel=today(); save(); spinning=true; msg.textContent='Крутиться…'; label();
    const idx=Math.floor(Math.random()*8); turn+=5;
    const R=turn*360+(360-idx*45-22.5);
    wheel.style.transform='rotate('+R+'deg)';
    wheel.querySelectorAll('span').forEach(x=>{x.style.transform='translate(-50%,-50%) rotate('+(-R)+'deg)';});
    sfx('spin');
    setTimeout(()=>{spinning=false;msg.textContent='Ви виграли: '+give(WHEEL[idx])+'.';sfx('gem');label();},3200);
  };
  body.appendChild(msg);
  const line=h('div','line'); line.appendChild(btn); line.appendChild(close); body.appendChild(line);
  label();
}

/* ---------- mini-games on the map ---------- */
const STOP_KIND=['puzzle','whack','mahjong','memory','tetris','mines','slide','chest','rush'];
const STOP_NAME={memory:'Знайди пару',chest:'Три ящики',rush:'Штурм',puzzle:'Пазл',whack:'Бий хряка',tetris:'Тетріс',mines:'Розмінування',slide:'П\'ятнашки'};
const stopKind=id=>STOP_KIND[id%STOP_KIND.length];
function openStop(id,ci){
  const kind=stopKind(id);
  if(kind==='memory')playMemory(id);
  else if(kind==='chest')playChests(id);
  else if(kind==='puzzle')playPuzzle(id,ci);
  else if(kind==='whack')playWhack(id);
  else if(kind==='tetris')playTetris(id);
  else if(kind==='mines')playMines(id);
  else if(kind==='slide')playSlide(id);
  else playRush(id,ci);
}
function finishStop(id){S.stops[id]=1;save();}
function playMemory(id){
  const body=openMini('Знайди пару');
  const msg=h('p','miniMsg','Відкривайте по дві картки. Менше помилок — більше монет.');
  const grid=h('div','memory'), cards=[];
  const kinds=[0,1,2,3,4,5,0,1,2,3,4,5];
  for(let i=kinds.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[kinds[i],kinds[j]]=[kinds[j],kinds[i]];}
  let open=[], found=0, miss=0, lock=false;
  kinds.forEach(k=>{
    const b=h('button','card'); b.type='button'; b.setAttribute('aria-label','Картка');
    const c={k,el:b,up:false};
    b.onclick=()=>{
      if(lock||c.up)return;
      c.up=true; b.classList.add('up'); bg(b,face(k)); sfx('tap');
      open.push(c);
      if(open.length<2)return;
      const [a,d]=open; open=[];
      if(a.k===d.k){
        found++; sfx('pop'); a.el.classList.add('ok'); d.el.classList.add('ok');
        if(found===6){
          const coins=Math.max(3,15-miss*2);
          finishStop(id); msg.textContent='Усі пари знайдено! Помилок: '+miss+'. Нагорода: '+give({coins})+'.'; sfx('win');
        }
      }else{
        miss++; lock=true;
        setTimeout(()=>{[a,d].forEach(x=>{x.up=false;x.el.classList.remove('up');x.el.style.backgroundImage='';});lock=false;},700);
      }
    };
    cards.push(c); grid.appendChild(b);
  });
  body.appendChild(msg); body.appendChild(grid);
  const close=h('button','primary','До карти'); close.type='button'; close.onclick=closeMini; body.appendChild(close);
}
function playChests(id){
  const body=openMini('Три ящики');
  const msg=h('p','miniMsg','Оберіть одну скриню. В одній із них найбільший скарб.');
  const row=h('div','chests');
  const prizes=[{coins:20,hammer:1},{coins:10},{coins:4}];
  for(let i=2;i>0;i--){const j=Math.floor(Math.random()*(i+1));[prizes[i],prizes[j]]=[prizes[j],prizes[i]];}
  let done=false;
  prizes.forEach(p=>{
    const b=h('button','chest'); b.type='button'; b.setAttribute('aria-label','Скриня'); bg(b,CHEST);
    b.onclick=()=>{
      if(done)return; done=true;
      finishStop(id);
      row.childNodes.forEach(x=>{x.disabled=true;x.classList.add('dim');});
      b.classList.remove('dim'); b.classList.add('pick');
      msg.textContent='У скрині: '+give(p)+'.'; sfx('gem');
    };
    row.appendChild(b);
  });
  body.appendChild(msg); body.appendChild(row);
  const close=h('button','primary','До карти'); close.type='button'; close.onclick=closeMini; body.appendChild(close);
}
function playRush(id,ci){
  customDef={n:level,ch:ci,kinds:5,mask:0,ice:0,ice2:0,crate:0,crate2:0,moss:0,gems:0,mud:0,ember:0,emberT:0,rock:0,fog:0,hard:0,collect:[],time:40,moves:99,rows:8,cols:7,amber:0,gemsExtra:0,rush:id+1};
  pre={}; startBonus=2; level=ci*PER+1;
  showScreen('game'); start(); running=false;
  showOverlay('Штурм','40 секунд без цілей і без ліку ходів. Кожні 400 очок дають монету, тож робіть бонуси й комбо.',
    [['Почати',()=>{busy=false;running=true;armHint();},'primary'],['До карти',toMap,'']]);
}
function endRush(){
  running=false; busy=true; clearHint();
  const coins=Math.min(25,Math.floor(score/400));
  finishStop(def.rush-1); give({coins}); hud(); sfx('win'); confetti();
  showOverlay('Час вийшов!','Рахунок '+score+'. Нагорода: '+coins+' монет.',[['До карти',toMap,'primary']]);
}

/* ---------- hub on the map ---------- */
let mapMsg='';
function talkMap(t){mapMsg=t;$('hubTalk').textContent=t;}
function hubCard(title,sub){
  const c=h('div','card'); c.appendChild(h('b','',title)); if(sub)c.appendChild(h('span','',sub)); return c;
}
function progress(now,need){const bar=h('div','prog'),f=h('i');f.style.width=Math.min(100,now/need*100)+'%';bar.appendChild(f);return bar;}
function drawHub(){
  const hub=$('hub'); hub.textContent='';
  const lg=loginState(), c1=hubCard('Подарунок дня','День '+lg.n+' з 7'+(lg.ready?'':' · отримано'));
  const days=h('div','days'); for(let i=1;i<=7;i++)days.appendChild(h('i',i<lg.n||(i===lg.n&&!lg.ready)?'got':i===lg.n?'now':'',String(i)));
  c1.appendChild(days);
  const b1=h('button',lg.ready?'primary':'',lg.ready?'Забрати':'Завтра'); b1.type='button'; b1.disabled=!lg.ready; b1.onclick=claimLogin; c1.appendChild(b1);
  hub.appendChild(c1);

  const free=S.wheel!==today(), c2=hubCard('Колесо удачі',free?'Безплатний оберт чекає':'Наступний оберт за 60 монет');
  const w=h('i','miniWheel'); c2.appendChild(w);
  const b2=h('button',free?'primary':'','Крутити'); b2.type='button'; b2.onclick=openWheel; c2.appendChild(b2);
  hub.appendChild(c2);

  const st=starsAll(), base=S.chestAt-15, c3=hubCard('Зоряна скриня','★ '+Math.min(st,S.chestAt)+' з '+S.chestAt);
  const ch=h('i','chestIcon'); bg(ch,CHEST); c3.appendChild(ch);
  c3.appendChild(progress(st-base,15));
  const b3=h('button',st>=S.chestAt?'primary':'',st>=S.chestAt?'Відкрити':'Збирайте зірки'); b3.type='button'; b3.disabled=st<S.chestAt; b3.onclick=claimChest; c3.appendChild(b3);
  hub.appendChild(c3);

  const bn=badgeGot(), c5=hubCard('Відзнака',bn>=5?'Зібрана повністю!':'Частин: '+bn+' з 5');
  const bm=h('i','badgeMini'); bg(bm,badgeImg(bn)); c5.appendChild(bm);
  const b5=h('button','','Переглянути'); b5.type='button'; b5.onclick=()=>{drawJournal();$('journal').classList.add('on');}; c5.appendChild(b5);
  hub.appendChild(c5);

  const c6=hubCard('Полігон','5 міні-ігор для тренування');
  const rg=h('i','badgeMini'); bg(rg,BOSSES[0].img); c6.appendChild(rg);
  const b6=h('button','','Грати'); b6.type='button'; b6.onclick=openRange; c6.appendChild(b6);
  hub.appendChild(c6);

  const d=daily(), c4=hubCard('Завдання дня','');
  c4.classList.add('wide');
  d.ids.forEach((qi,j)=>{
    const q=QUESTS[qi], now=Math.min(q.n,(S.stat[q.k]||0)-d.base[j]);
    const row=h('div','quest'), tx=h('div');
    tx.appendChild(h('span','',q.text+' · '+now+'/'+q.n)); tx.appendChild(progress(now,q.n));
    const b=h('button',now>=q.n&&!d.done[j]?'primary':'',d.done[j]?'✓':'+'+q.coins); b.type='button';
    b.disabled=d.done[j]||now<q.n; b.onclick=()=>claimQuest(j);
    row.appendChild(tx); row.appendChild(b); c4.appendChild(row);
  });
  hub.appendChild(c4);
  bg($('hubBuddy'),BUDDY.point||BUDDY.ok);
  $('hubTalk').textContent=mapMsg||BUDDY_TIPS[new Date().getDate()%BUDDY_TIPS.length];
}
const BUDDY_TIPS=[
  'Я '+(S.mname&&S.mname!=='Кремінчик'?S.mname:'Ріно')+'! Квадрат із чотирьох предметів дає дрон: він сам летить до перешкод.',
  'Чотири в ряд дають танк. Він прострілює цілий ряд або стовпчик.',
  'Збіг кутом чи літерою Т дає гранату. А п\'ять у ряд викликають РСЗВ: ракети летять по всіх предметах одного виду.',
  'Техніку можна з\'єднувати: проведіть танк на гранату й подивіться, що буде.',
  'Протитанковий їжак не боїться звичайного збігу. Потрібен танк, дрон чи граната.',
  'Червоні рівні на карті складні, зате платять удвічі чи втричі більше.',
  'Серія перемог дає готову техніку на старті. Не здаємося!'
];
