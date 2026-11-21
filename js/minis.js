/* Extra mini-games between levels: jigsaw, sliding puzzle, tetris, mine clearing, whack-a-pig.
   Each map stop pays once; the same games can be played for practice from the «Полігон» card. */
let miniStopFn=null;
function stopMiniLoop(){if(miniStopFn){try{miniStopFn();}catch(e){}miniStopFn=null;}}
{
  const close0=closeMini;
  closeMini=function(){stopMiniLoop();close0();};
}
/* pictures for the puzzles: a sticker over camo. The player can add own pictures later. */
const PUZZLE_IMGS=[
  ['img/rino-proud.webp','Ріно на посту'],['img/boss-1.webp','Хряк-мародер'],['img/rino-flex.webp','Сила носорога'],
  ['img/boss-0.webp','Хряк-штурмовик'],['img/rino-salute.webp','Честь віддано'],['img/boss-2.webp','Хряк-пахан']
];
const puzzleBg=(src,n,i)=>{
  const x=n>1?(i%n)*100/(n-1):0, y=n>1?Math.floor(i/n)*100/(n-1):0;
  return {backgroundImage:'url("'+src+'"),url("img/camo.webp")',backgroundSize:(n*100*.86)+'% auto,'+(n*100)+'% '+(n*100)+'%',
    backgroundPosition:x+'% '+y+'%,'+x+'% '+y+'%',backgroundRepeat:'no-repeat'};
};
function applyStyle(el,st){for(const k in st)el.style[k]=st[k];}
function miniReward(id,coins,msg,text){
  if(id==null||id<0){msg.textContent=text+' Це тренування на полігоні, монети дають лише за міні-ігри на карті.';return;}
  if(S.stops[id]){msg.textContent=text;return;}
  finishStop(id);
  msg.textContent=text+' Нагорода: '+(coins>0?give({coins}):'немає')+'.';
}
function miniButtons(body,id,again){
  const line=h('div','line');
  if(again){const b=h('button','','Ще раз');b.type='button';b.onclick=again;line.appendChild(b);}
  const c=h('button','primary',id==null?'До полігону':'До карти'); c.type='button';
  c.onclick=id==null?()=>{stopMiniLoop();openRange();}:closeMini; line.appendChild(c);
  body.appendChild(line);
}
const shuffled=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};

/* ---------- jigsaw: swap pieces until the picture is whole ---------- */
function playPuzzle(id,ci){
  stopMiniLoop();
  const body=openMini('Пазл'), n=(ci||0)>=2?4:3, N=n*n;
  const [src,name]=PUZZLE_IMGS[Math.floor(Math.random()*PUZZLE_IMGS.length)];
  const msg=h('p','miniMsg','Торкніться двох шматочків, щоб поміняти їх місцями. Зберіть картину «'+name+'».');
  const grid=h('div','pz'); grid.style.gridTemplateColumns='repeat('+n+',1fr)';
  let order; do{order=shuffled([...Array(N).keys()]);}while(order.every((v,i)=>v===i));
  let sel=-1, moves=0, done=false;
  const cells=[];
  const draw=()=>cells.forEach((c,i)=>{applyStyle(c,puzzleBg(src,n,order[i]));c.classList.toggle('ok',order[i]===i);c.classList.toggle('sel',i===sel);});
  for(let i=0;i<N;i++){
    const c=h('button','pc'); c.type='button'; c.setAttribute('aria-label','Шматочок '+(i+1));
    c.onclick=()=>{
      if(done)return;
      if(sel<0){sel=i;sfx('tap');draw();return;}
      if(sel!==i){[order[sel],order[i]]=[order[i],order[sel]];moves++;sfx(order[i]===i||order[sel]===sel?'pop':'tap');}
      sel=-1; draw();
      if(order.every((v,k)=>v===k)){
        done=true; grid.classList.add('whole'); sfx('win'); confettiMini(grid);
        miniReward(id,Math.max(6,(n===4?22:16)-Math.floor(moves/4)),msg,'Картину зібрано за '+moves+' обмінів!');
      }
    };
    cells.push(c); grid.appendChild(c);
  }
  draw();
  body.appendChild(msg); body.appendChild(grid); miniButtons(body,id,id==null?()=>playPuzzle(null,ci):null);
}

/* ---------- sliding puzzle (п'ятнашки) ---------- */
function playSlide(id){
  stopMiniLoop();
  const body=openMini('П\'ятнашки'), n=3, N=9;
  const [src,name]=PUZZLE_IMGS[Math.floor(Math.random()*PUZZLE_IMGS.length)];
  const msg=h('p','miniMsg','Посувайте шматочки в порожню клітинку, щоб скласти «'+name+'».');
  const grid=h('div','pz slide'); grid.style.gridTemplateColumns='repeat(3,1fr)';
  let order=[...Array(N).keys()], empty=N-1, moves=0, done=false;
  const nb=i=>[i-n,i+n,(i%n)?i-1:-1,(i%n<n-1)?i+1:-1].filter(x=>x>=0&&x<N);
  for(let k=0;k<160;k++){const o=nb(empty);const j=o[Math.floor(Math.random()*o.length)];[order[empty],order[j]]=[order[j],order[empty]];empty=j;}
  if(order.every((v,i)=>v===i)){const j=nb(empty)[0];[order[empty],order[j]]=[order[j],order[empty]];empty=j;}
  const cells=[];
  const draw=()=>cells.forEach((c,i)=>{
    const v=order[i];
    if(v===N-1&&!done){c.className='pc hole';c.style.backgroundImage='none';}
    else{c.className='pc'+(v===i?' ok':'');applyStyle(c,puzzleBg(src,n,v));}
  });
  for(let i=0;i<N;i++){
    const c=h('button','pc'); c.type='button';
    c.onclick=()=>{
      if(done||!nb(i).includes(empty))return;
      [order[empty],order[i]]=[order[i],order[empty]]; empty=i; moves++; sfx('tap'); draw();
      if(order.every((v,k)=>v===k)){
        done=true; draw(); grid.classList.add('whole'); sfx('win'); confettiMini(grid);
        miniReward(id,Math.max(6,20-Math.floor(moves/8)),msg,'Складено за '+moves+' ходів!');
      }
    };
    cells.push(c); grid.appendChild(c);
  }
  draw();
  body.appendChild(msg); body.appendChild(grid); miniButtons(body,id,id==null?()=>playSlide(null):null);
}

/* ---------- tetris with the occupier junk as blocks ---------- */
const TET=[[[0,1],[1,1],[2,1],[3,1]],[[0,0],[1,0],[0,1],[1,1]],[[1,0],[0,1],[1,1],[2,1]],[[0,0],[0,1],[1,1],[2,1]],[[2,0],[0,1],[1,1],[2,1]],[[1,0],[2,0],[0,1],[1,1]],[[0,0],[1,0],[1,1],[2,1]]];
const TET_COL=['#6d747a','#c8221a','#5f5a3e','#b39a64','#a8160f','#7a6a55','#4c5e26'];
function playTetris(id){
  stopMiniLoop();
  const body=openMini('Тетріс'), W=10, H=16, LIMIT=120;
  const msg=h('p','miniMsg','Складайте повні ряди. Свайп або кнопки: ◀ ▶ рух, ⟳ поворот, ⤓ скинути. Дві хвилини.');
  const top=h('div','tetTop'), info=h('b','','Ряди: 0'), clock=h('b','','2:00'); top.appendChild(info); top.appendChild(clock);
  const cv=h('canvas','tet'), g=cv.getContext('2d');
  const imgs=defaults.slice(0,6).map(u=>{const im=new Image();im.src=u;return im;});
  let cell=24;
  const size=()=>{const wmax=Math.min(300,(innerWidth||360)-80), hmax=Math.max(240,(innerHeight||640)-330);cell=Math.floor(Math.min(wmax/W,hmax/H));
    const d=window.devicePixelRatio||1; cv.width=W*cell*d; cv.height=H*cell*d; cv.style.width=W*cell+'px'; cv.style.height=H*cell+'px'; g.setTransform(d,0,0,d,0,0);};
  size();
  const grid=[...Array(H)].map(()=>new Array(W).fill(-1));
  let cur=null, lines=0, over=false, left=LIMIT, drop=0, last=0, speed=.75, flashRows=[], flashT=0, raf=0, tick=0;
  const spawn=()=>{const k=Math.floor(Math.random()*7);cur={k,cells:TET[k].map(p=>p.slice()),x:3,y:0};if(hits(cur.cells,cur.x,cur.y))finish(false);};
  const hits=(cs,x,y)=>cs.some(([a,b])=>{const X=a+x,Y=b+y;return X<0||X>=W||Y>=H||(Y>=0&&grid[Y][X]>=0);});
  const rot=()=>{if(!cur||cur.k===1)return;const cs=cur.cells.map(([a,b])=>[2-b,a]);for(const dx of [0,-1,1,-2,2])if(!hits(cs,cur.x+dx,cur.y)){cur.cells=cs;cur.x+=dx;sfx('tap');return;}};
  const move=dx=>{if(cur&&!hits(cur.cells,cur.x+dx,cur.y)){cur.x+=dx;}};
  const lock=()=>{
    cur.cells.forEach(([a,b])=>{const Y=b+cur.y;if(Y>=0)grid[Y][a+cur.x]=cur.k;});
    const full=[]; for(let y=0;y<H;y++)if(grid[y].every(v=>v>=0))full.push(y);
    if(full.length){
      full.forEach(y=>{grid.splice(y,1);grid.unshift(new Array(W).fill(-1));});
      lines+=full.length; info.textContent='Ряди: '+lines; sfx(full.length>=3?'boom':'pop'); buzz(20);
      flashRows=full; flashT=.25; speed=Math.max(.18,.75-lines*.035);
    }else sfx('land');
    spawn();
  };
  const down=()=>{if(!cur||over)return;if(!hits(cur.cells,cur.x,cur.y+1))cur.y++;else lock();};
  const hard=()=>{if(!cur||over)return;while(!hits(cur.cells,cur.x,cur.y+1))cur.y++;lock();};
  const block=(x,y,k)=>{
    g.fillStyle=TET_COL[k]; g.fillRect(x*cell+1,y*cell+1,cell-2,cell-2);
    g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(x*cell+1,y*cell+1,cell-2,3);
    const im=imgs[k%6]; if(im.complete&&im.naturalWidth)g.drawImage(im,x*cell+2,y*cell+2,cell-4,cell-4);
  };
  const draw=()=>{
    g.fillStyle='#16200f'; g.fillRect(0,0,W*cell,H*cell);
    g.strokeStyle='rgba(255,255,255,.05)'; for(let x=1;x<W;x++){g.beginPath();g.moveTo(x*cell,0);g.lineTo(x*cell,H*cell);g.stroke();}
    for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(grid[y][x]>=0)block(x,y,grid[y][x]);
    if(cur&&!over){
      let gy=cur.y; while(!hits(cur.cells,cur.x,gy+1))gy++;
      g.globalAlpha=.22; cur.cells.forEach(([a,b])=>{g.fillStyle='#fff';g.fillRect((a+cur.x)*cell+2,(b+gy)*cell+2,cell-4,cell-4);}); g.globalAlpha=1;
      cur.cells.forEach(([a,b])=>{if(b+cur.y>=0)block(a+cur.x,b+cur.y,cur.k);});
    }
    if(flashT>0){g.fillStyle='rgba(255,230,140,'+(flashT*3)+')';g.fillRect(0,0,W*cell,H*cell);}
  };
  const loop=now=>{
    const dt=Math.min(.1,(now-(last||now))/1000); last=now;
    if(!over){
      drop+=dt; if(drop>=speed){drop=0;down();}
      tick+=dt; if(tick>=1){tick-=1;left--;clock.textContent=Math.floor(left/60)+':'+String(left%60).padStart(2,'0');if(left<=0)finish(true);}
    }
    flashT=Math.max(0,flashT-dt);
    draw(); raf=requestAnimationFrame(loop);
  };
  const finish=ok=>{
    if(over)return; over=true;
    const coins=Math.min(20,lines*2);
    sfx(lines?'win':'lose');
    miniReward(id,coins,msg,(ok?'Час вийшов! ':'Поле заповнене! ')+'Складено рядів: '+lines+'.');
  };
  const ctl=h('div','tetCtl');
  [['◀',()=>move(-1)],['⟳',rot],['▶',()=>move(1)],['▼',down],['⤓',hard]].forEach(([t,f])=>{
    const b=h('button','',t); b.type='button';
    b.addEventListener('pointerdown',e=>{e.preventDefault();if(!over){f();draw();}});
    ctl.appendChild(b);
  });
  let sx=0, sy=0, moved=false;
  cv.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY;moved=false;});
  cv.addEventListener('pointermove',e=>{
    if(e.buttons===0&&e.pointerType==='mouse')return;
    const dx=e.clientX-sx; if(Math.abs(dx)>cell){move(dx>0?1:-1);sx=e.clientX;moved=true;}
    if(e.clientY-sy>cell*3&&!moved){hard();moved=true;sy=e.clientY;}
  });
  cv.addEventListener('pointerup',()=>{if(!moved&&!over)rot();});
  const key=e=>{
    if(over||!$('mini').classList.contains('on'))return;
    const k=e.key; if(k==='ArrowLeft')move(-1); else if(k==='ArrowRight')move(1); else if(k==='ArrowUp')rot(); else if(k==='ArrowDown')down(); else if(k===' ')hard(); else return;
    e.preventDefault();
  };
  document.addEventListener('keydown',key);
  miniStopFn=()=>{cancelAnimationFrame(raf);document.removeEventListener('keydown',key);over=true;};
  body.appendChild(msg); body.appendChild(top); body.appendChild(cv); body.appendChild(ctl);
  miniButtons(body,id,id==null?()=>playTetris(null):null);
  spawn(); raf=requestAnimationFrame(loop);
}

/* ---------- mine clearing (розмінування) ---------- */
function playMines(id){
  stopMiniLoop();
  const body=openMini('Розмінування'), n=8, M=9;
  const msg=h('p','miniMsg','Відкривайте клітинки. Цифра показує, скільки мін поруч. Позначте міни прапорцем і відкрийте все безпечне.');
  const grid=h('div','mines'); grid.style.gridTemplateColumns='repeat('+n+',1fr)';
  const mine=new Array(n*n).fill(false), open=new Array(n*n).fill(false), flag=new Array(n*n).fill(false);
  let first=true, done=false, flagMode=false, opened=0;
  const nbs=i=>{const r=Math.floor(i/n),c=i%n,o=[];for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;const R=r+dr,C=c+dc;if(R>=0&&R<n&&C>=0&&C<n)o.push(R*n+C);}return o;};
  const cnt=i=>nbs(i).filter(j=>mine[j]).length;
  const cells=[];
  const paintCell=i=>{
    const c=cells[i]; c.className='mc'+(open[i]?' open':'')+(flag[i]?' flag':'')+(open[i]&&mine[i]?' boom':'');
    c.textContent=open[i]&&!mine[i]&&cnt(i)?String(cnt(i)):'';
    if(open[i]&&!mine[i])c.dataset.n=cnt(i);
  };
  const reveal=i=>{
    if(open[i]||flag[i])return; open[i]=true; opened++;
    if(!mine[i]&&cnt(i)===0)nbs(i).forEach(reveal);
  };
  const flagBtn=h('button','','Режим: відкривати'); flagBtn.type='button';
  flagBtn.onclick=()=>{flagMode=!flagMode;flagBtn.textContent=flagMode?'Режим: прапорці 🚩':'Режим: відкривати';flagBtn.classList.toggle('on',flagMode);};
  const act=(i,asFlag)=>{
    if(done||open[i])return;
    if(asFlag){flag[i]=!flag[i];sfx('tap');paintCell(i);return;}
    if(flag[i])return;
    if(first){first=false;const safe=new Set([i,...nbs(i)]);let k=0;while(k<M){const j=Math.floor(Math.random()*n*n);if(!mine[j]&&!safe.has(j)){mine[j]=true;k++;}}}
    if(mine[i]){
      open[i]=true; done=true; mine.forEach((m,j)=>{if(m)open[j]=true;}); cells.forEach((c,j)=>paintCell(j));
      sfx('boom'); buzz(80); grid.classList.add('lost');
      msg.textContent='Бах! Міна спрацювала. Спробуйте ще раз, сапер помиляється лише раз… у грі можна більше.';
      return;
    }
    reveal(i); sfx('pop'); cells.forEach((c,j)=>paintCell(j));
    if(opened===n*n-M){done=true;mine.forEach((m,j)=>{if(m){flag[j]=true;paintCell(j);}});sfx('win');confettiMini(grid);miniReward(id,18,msg,'Поле розміновано!');}
  };
  for(let i=0;i<n*n;i++){
    const c=h('button','mc'); c.type='button'; let lp=0, long=false;
    c.addEventListener('pointerdown',()=>{long=false;lp=setTimeout(()=>{long=true;act(i,true);buzz(15);},420);});
    c.addEventListener('pointerup',()=>{clearTimeout(lp);if(!long)act(i,flagMode);});
    c.addEventListener('pointerleave',()=>clearTimeout(lp));
    c.addEventListener('contextmenu',e=>{e.preventDefault();});
    cells.push(c); grid.appendChild(c); paintCell(i);
  }
  body.appendChild(msg); body.appendChild(flagBtn); body.appendChild(grid);
  miniButtons(body,id,()=>playMines(id));
}

/* ---------- whack-a-pig ---------- */
function playWhack(id){
  stopMiniLoop();
  const body=openMini('Бий хряка'), T=30;
  const msg=h('p','miniMsg','Бийте хряків, поки вони визирають. Хряк у касці потребує двох ударів. Ріно не чіпайте — це свій!');
  const top=h('div','tetTop'), info=h('b','','Влучань: 0'), clock=h('b','','0:30'); top.appendChild(info); top.appendChild(clock);
  const grid=h('div','whack'), holes=[];
  let score=0, left=T, over=false, started=false, timers=[];
  for(let i=0;i<9;i++){
    const hEl=h('div','hole'), who=h('button','who'); who.type='button'; hEl.appendChild(who); grid.appendChild(hEl);
    const o={el:hEl,who,up:false,kind:null,hp:0};
    who.addEventListener('pointerdown',e=>{
      e.preventDefault(); if(!o.up||over)return;
      if(o.kind==='rino'){score=Math.max(0,score-3);sfx('lose');buzz(60);hEl.classList.add('oops');setTimeout(()=>hEl.classList.remove('oops'),300);hide(o);}
      else{o.hp--;sfx(o.hp>0?'wood':'pop');buzz(15);who.classList.remove('bonk');void who.offsetWidth;who.classList.add('bonk');
        if(o.hp<=0){score+=o.kind==='orc2'?2:1;bg(who,PIG('ko'));setTimeout(()=>hide(o),180);}else bg(who,'img/orc1.webp');}
      info.textContent='Влучань: '+score;
    });
    holes.push(o);
  }
  const hide=o=>{o.up=false;o.el.classList.remove('up');};
  const pop=()=>{
    if(over)return;
    const free=holes.filter(o=>!o.up); if(free.length){
      const o=free[Math.floor(Math.random()*free.length)], r=Math.random();
      o.kind=r<.15?'rino':r<.4?'orc2':'pig'; o.hp=o.kind==='orc2'?2:1; o.up=true;
      bg(o.who,o.kind==='rino'?'img/rino-thumb.webp':o.kind==='orc2'?'img/orc2.webp':pick1(['img/orc1.webp',PIG('mad'),PIG('smug')]));
      o.el.classList.add('up');
      const stay=Math.max(520,1150-(T-left)*20);
      timers.push(setTimeout(()=>{if(o.up)hide(o);},stay));
    }
    timers.push(setTimeout(pop,Math.max(330,820-(T-left)*15)));
  };
  const sec=setInterval(()=>{
    if(!started||over)return; left--; clock.textContent='0:'+String(Math.max(0,left)).padStart(2,'0');
    if(left<=0){over=true;holes.forEach(hide);sfx('win');miniReward(id,Math.min(20,Math.floor(score/2)),msg,'Час вийшов! Влучань: '+score+'.');}
  },1000);
  miniStopFn=()=>{over=true;clearInterval(sec);timers.forEach(clearTimeout);};
  const go=h('button','primary','Почати!'); go.type='button';
  go.onclick=()=>{go.remove();started=true;pop();setTimeout(pop,400);};
  body.appendChild(msg); body.appendChild(top); body.appendChild(grid); body.appendChild(go);
  miniButtons(body,id,id==null?()=>playWhack(null):null);
}

function confettiMini(el){
  if(calm)return;
  for(let i=0;i<24;i++){
    const p=h('i','cf'); p.style.left=(Math.random()*100)+'%'; p.style.background=COLORS[i%6];
    p.style.animationDelay=(Math.random()*.3)+'s'; el.appendChild(p); setTimeout(()=>p.remove(),1500);
  }
}

/* ---------- «Полігон»: every mini-game for practice, no rewards ---------- */
const RANGE=[['puzzle','Пазл','Зберіть картину зі шматочків',()=>playPuzzle(null,2)],['slide','П\'ятнашки','Посувайте шматочки на місце',()=>playSlide(null)],
  ['tetris','Тетріс','Складайте ряди з трофеїв',()=>playTetris(null)],['mines','Розмінування','Знайдіть усі міни',()=>playMines(null)],
  ['whack','Бий хряка','Влучайте по хряках, не чіпайте своїх',()=>playWhack(null)]];
function openRange(){
  stopMiniLoop();
  const body=openMini('Полігон');
  body.appendChild(h('p','miniMsg','Тренування без нагород. Монети дають за міні-ігри на карті між рівнями.'));
  const list=h('div','range');
  RANGE.forEach(([k,name,sub,fn])=>{
    const b=h('button','rg '+k); b.type='button'; b.appendChild(h('b','',name)); b.appendChild(h('span','',sub)); b.onclick=fn; list.appendChild(b);
  });
  body.appendChild(list);
  const c=h('button','primary','Закрити'); c.type='button'; c.onclick=closeMini; body.appendChild(c);
}
