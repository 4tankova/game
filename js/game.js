/* Board engine: matching, damage, bonuses, step-by-step falling, turn rules and level setup. */
let customDef=null, pre={};
let played=false, skipFin=false;
let amber=[], amberAdd=[], spreadOn=false, gemQueue=0, gemClock=0, gemDrop=false;
let KINDS=6, board=[], mask=[], moss=[], fog=[], entry=[], sel=null, busy=true, score=0, moves=0, timeLeft=0, running=false;
let level=1, def=null, goals={}, mode=null, combo=0, hintT=0, mudKilled=false, startBonus=0;
let removed, fired, touched, thawed, cracked, flyers, fxq, heard;
const TICK=70, STATKEYS=new Set(['ice','crate','gem','moss','mud','ember','rock']);

const at=(r,c)=>(r>=0&&r<ROWS&&c>=0&&c<COLS)?board[r][c]:null;
function each(f){for(const row of board)for(const t of row)if(t)f(t);}
const rndKind=()=>Math.floor(Math.random()*KINDS);
const pos=(r,c)=>'translate('+(c*100)+'%,'+(r*100)+'%)';
function place(t,r,c){t.r=r;t.c=c;t.el.style.transform=pos(r,c);}
function paint(t){
  bg(t.el.firstChild,t.sp?(t.sp==='crate'&&t.hp>1?SP.crate2:SP[t.sp]):face(t.kind));
  const cl=t.el.classList;
  cl.toggle('pin',t.sp==='pin'); cl.toggle('ice1',t.ice===1); cl.toggle('ice2',t.ice===2);
  cl.toggle('glow',t.sp==='gem'||t.sp==='rainbow'); cl.toggle('ember',t.timer>0);
  cl.toggle('own',!t.sp&&t.kind>=0&&!!S.custom[t.kind]);
  if(t.timer>0){
    if(!t.badge){t.badge=h('span','badge');t.el.appendChild(t.badge);}
    t.badge.textContent=String(t.timer); t.badge.classList.toggle('hot',t.timer<=3);
  }else if(t.badge){t.badge.remove();t.badge=null;}
}
function makeTile(kind,r,c,sp,hp){
  const el=h('div','tile'); el.appendChild(h('div','face')); boardEl.appendChild(el);
  el.style.setProperty('--d',(Math.random()*6).toFixed(2)+'s');
  const t={kind:sp?-1:kind,sp:sp||null,ice:0,hp:hp||1,timer:0,badge:null,el,r,c}; paint(t); place(t,r,c); return t;
}
const fixed=t=>t.ice>0||t.sp==='crate'||t.sp==='gem'||t.sp==='mud'||t.sp==='rock';
const movable=t=>!t.ice&&t.sp!=='crate'&&t.sp!=='mud'&&t.sp!=='rock';
const bonus=t=>!!t.sp&&t.sp!=='crate'&&t.sp!=='gem'&&t.sp!=='mud'&&t.sp!=='rock';
const isLine=s=>s==='row'||s==='col';

/* ---------- matching ---------- */
function findGroups(){
  const runs=[], K=(r,c)=>{const t=board[r][c];return t?t.kind:-1;};
  for(let r=0;r<ROWS;r++){let c=0;while(c<COLS){const k=K(r,c);let e=c+1;
    if(k>=0){while(e<COLS&&K(r,e)===k)e++;if(e-c>=3){const run=[];for(let i=c;i<e;i++)run.push(board[r][i]);run.dir='h';runs.push(run);}}
    c=e;}}
  for(let c=0;c<COLS;c++){let r=0;while(r<ROWS){const k=K(r,c);let e=r+1;
    if(k>=0){while(e<ROWS&&K(e,c)===k)e++;if(e-r>=3){const run=[];for(let i=r;i<e;i++)run.push(board[i][c]);run.dir='v';runs.push(run);}}
    r=e;}}
  for(let r=0;r<ROWS-1;r++)for(let c=0;c<COLS-1;c++){
    const k=K(r,c);
    if(k>=0&&K(r,c+1)===k&&K(r+1,c)===k&&K(r+1,c+1)===k){
      const run=[board[r][c],board[r][c+1],board[r+1][c],board[r+1][c+1]];run.sq=true;runs.push(run);
    }
  }
  const owner=new Map(), groups=[];
  for(const run of runs){
    let g=null;
    for(const t of run){
      const o=owner.get(t);
      if(o&&o!==g){
        if(!g)g=o;
        else{o.tiles.forEach(x=>{g.tiles.add(x);owner.set(x,g);});g.runs.push(...o.runs);o.dead=true;}
      }
    }
    if(!g){g={tiles:new Set(),runs:[]};groups.push(g);}
    g.runs.push(run); run.forEach(t=>{g.tiles.add(t);owner.set(t,g);});
  }
  return groups.filter(g=>!g.dead);
}
function findMove(){
  let b=null; each(t=>{if(!b&&bonus(t))b=t;});
  if(b)return [b];
  const ok=t=>t&&t.kind>=0&&!t.ice;
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const a=board[r][c]; if(!ok(a))continue;
    for(const n of [at(r,c+1),at(r+1,c)]){
      if(!ok(n)||n.kind===a.kind)continue;
      let k=a.kind;a.kind=n.kind;n.kind=k;
      const good=findGroups().length>0;
      k=a.kind;a.kind=n.kind;n.kind=k;
      if(good)return [a,n];
    }
  }
  return null;
}

/* ---------- damage ---------- */
function mark(r,c){if(def.amber&&r>=0&&r<ROWS&&c>=0&&c<COLS&&mask[r][c]&&!amber[r][c])amberAdd.push([r,c]);}
function begin(){amberAdd=[];removed=new Set();fired=new Set();touched=new Set();thawed=[];cracked=[];flyers=[];fxq=[];heard=new Set();}
function count(key){if(goals[key])goals[key].have++;if(STATKEYS.has(key))stat(key);}
function hit(t,weak){
  if(!t)return;
  hit0(t,weak);
  if(spreadOn&&removed.has(t))mark(t.r,t.c);
}
function hit0(t,weak){
  if(removed.has(t)||touched.has(t)||t.sp==='gem')return;
  if(t.sp==='rock'){if(weak)return;removed.add(t);count('rock');return;}
  if(t.ice){touched.add(t);t.ice--;thawed.push(t);count('ice');return;}
  if(t.sp==='crate'){
    touched.add(t);
    if(--t.hp>0){cracked.push(t);return;}
    removed.add(t);count('crate');return;
  }
  if(t.sp==='mud'){removed.add(t);count('mud');mudKilled=true;return;}
  removed.add(t);
  if(t.sp)fire(t); else{count('k'+t.kind);if(t.timer)count('ember');}
}
function blast(r,c,rad){
  fxq.push(()=>{ring(r,c,'#ffb52e',rad*2+.4);shards(r,c,['#ffb52e','#ff6f61','#fff3c4','#2f3a40'],22*rad,1.8);});
  heard.add('boom');
  for(let dr=-rad;dr<=rad;dr++)for(let dc=-rad;dc<=rad;dc++)hit(at(r+dr,c+dc));
}
function line(r,c,horiz){
  if(horiz?(r<0||r>=ROWS):(c<0||c>=COLS))return;
  fxq.push(()=>beam(r,c,horiz)); heard.add('zip');
  if(horiz)for(let i=0;i<COLS;i++)hit(at(r,i)); else for(let i=0;i<ROWS;i++)hit(at(i,c));
}
function around(r,c){hit(at(r-1,c));hit(at(r+1,c));hit(at(r,c-1));hit(at(r,c+1));}
function pickTarget(){
  const P=[[],[],[],[],[],[],[]];
  each(x=>{
    if(removed.has(x)||touched.has(x)||x.sp==='gem')return;
    if(x.timer)P[0].push(x);
    else if(x.ice)P[1].push(x);
    else if(x.sp==='crate'||x.sp==='mud'||x.sp==='rock')P[2].push(x);
    else if(x.sp)return;
    else if(moss[x.r][x.c]||(def.amber&&spreadOn&&!amber[x.r][x.c]))P[3].push(x);
    else{
      let under=false; for(let rr=0;rr<x.r;rr++){const y=board[rr][x.c];if(y&&y.sp==='gem')under=true;}
      if(under)P[4].push(x);
      else{const g=goals['k'+x.kind];(g&&g.have<g.need?P[5]:P[6]).push(x);}
    }
  });
  const pool=P.find(a=>a.length);
  return pool?pool[Math.floor(Math.random()*pool.length)]:null;
}
function launch(r,c,payload){
  const t=pickTarget(); if(!t)return;
  const tr=t.r, tc=t.c;
  flyers.push({r,c,to:{r:tr,c:tc}}); heard.add('spin');
  hit(t);
  if(payload==='bomb')blast(tr,tc,1);
  else if(payload==='row')line(tr,tc,true);
  else if(payload==='col')line(tr,tc,false);
}
function common(){
  const n=new Array(KINDS).fill(0); each(x=>{if(x.kind>=0)n[x.kind]++;});
  return n.indexOf(Math.max(...n));
}
function fire(t,kind){
  if(fired.has(t))return;
  fired.add(t); removed.add(t);
  const {r,c}=t, was=spreadOn;
  if(def.amber&&amber[r][c])spreadOn=true;
  if(spreadOn)mark(r,c);
  fire0(t,kind,r,c);
  spreadOn=was;
}
function fire0(t,kind,r,c){
  if(t.sp==='bomb')blast(r,c,1);
  else if(t.sp==='row')line(r,c,true);
  else if(t.sp==='col')line(r,c,false);
  else if(t.sp==='pin'){around(r,c);launch(r,c);}
  else if(t.sp==='rainbow'){
    if(kind===undefined||kind<0)kind=common();
    fxq.push(()=>{ring(r,c,'#ffffff',3.2);shards(r,c,COLORS,18,1.6);}); heard.add('rain');
    each(x=>{if(x.kind===kind)hit(x);});
  }
}
async function combine(a,b){
  const A=a.sp, B=b.sp, {r,c}=a;
  fired.add(a);fired.add(b);removed.add(a);removed.add(b);
  spreadOn=!!def.amber&&(amber[a.r][a.c]||amber[b.r][b.c]);
  if(spreadOn){mark(a.r,a.c);mark(b.r,b.c);}
  await combine0(a,b,A,B,r,c);
  spreadOn=false;
}
async function combine0(a,b,A,B,r,c){
  if(A==='rainbow'&&B==='rainbow'){
    fxq.push(()=>{ring(r,c,'#ffffff',7);shake();}); heard.add('rain'); heard.add('boom');
    each(hit);
  }else if(A==='rainbow'||B==='rainbow'){
    const o=A==='rainbow'?B:A, k=common(), list=[];
    each(x=>{if(x.kind===k){if(x.ice)hit(x);else list.push(x);}});
    list.forEach(x=>{
      count('k'+k); if(x.timer){count('ember');x.timer=0;}
      x.kind=-1; x.sp=isLine(o)?(Math.random()<.5?'row':'col'):o; paint(x);
    });
    sfx('rain'); await wait(420);
    list.forEach(x=>fire(x));
  }else if(isLine(A)&&isLine(B)){line(r,c,true);line(r,c,false);}
  else if((A==='bomb'&&isLine(B))||(B==='bomb'&&isLine(A))){for(let d=-1;d<=1;d++){line(r+d,c,true);line(r,c+d,false);}}
  else if(A==='bomb'&&B==='bomb')blast(r,c,2);
  else{
    const o=A==='pin'?B:A;
    around(r,c);
    if(o==='pin'){launch(r,c);launch(r,c);launch(r,c);} else launch(r,c,o);
  }
}

/* ---------- falling ----------
   Each tick every loose tile moves one cell: straight down when the cell below is free,
   otherwise diagonally into a free cell that cannot be fed from above. Ice, crates and mud stay put,
   new tiles enter only through the top cell of a column. */
function land(t){const el=t.el;el.classList.add('land');setTimeout(()=>el.classList.remove('land'),200);}
async function fall(){
  boardEl.classList.add('falling');
  let prev=new Set(), guard=0, any=false;
  for(;;){
    const now=new Set(); let born=false;
    for(let r=ROWS-2;r>=0;r--)for(let c=0;c<COLS;c++){
      const t=board[r][c];
      if(t&&movable(t)&&mask[r+1][c]&&!board[r+1][c]){board[r+1][c]=t;board[r][c]=null;t.r=r+1;now.add(t);}
    }
    for(let c=0;c<COLS;c++){
      const e=entry[c];
      if(e>=0&&!board[e][c]){
        const gem=gemDrop&&gemQueue>0; if(gem){gemDrop=false;gemQueue--;}
        const t=makeTile(rndKind(),e-1,c,gem?'gem':null);board[e][c]=t;t.r=e;now.add(t);born=true;
      }
    }
    if(!now.size){
      for(let r=ROWS-1;r>=1;r--)for(let c=0;c<COLS;c++){
        if(!mask[r][c]||board[r][c])continue;
        for(const dc of ((r+c)%2?[-1,1]:[1,-1])){
          const t=at(r-1,c+dc);
          if(t&&movable(t)&&!now.has(t)){board[r][c]=t;board[r-1][c+dc]=null;t.r=r;t.c=c;now.add(t);break;}
        }
      }
    }
    prev.forEach(t=>{if(!now.has(t))land(t);});
    if(!now.size)break;
    any=true;
    if(born)void boardEl.offsetHeight;
    now.forEach(t=>{t.el.style.transform=pos(t.r,t.c);});
    prev=now;
    await wait(TICK);
    if(++guard>300)break;
  }
  boardEl.classList.remove('falling');
  if(any){sfx('land');await wait(130);}
}
function collectGems(){
  let any=false;
  each(t=>{
    if(t.sp!=='gem')return;
    const {r,c}=t;
    if(r<ROWS-1&&mask[r+1][c])return;
    any=true; count('gem'); score+=200;
    shards(r,c,['#35e0c2','#9ff5e6','#ffffff'],16,1.4); ring(r,c,'#35e0c2',1.6); floatText(r,c,'+200');
    t.el.classList.add('pop'); const el=t.el; setTimeout(()=>el.remove(),220);
    board[r][c]=null;
  });
  if(any){sfx('gem');hud();}
  return any;
}
async function settle(){
  await fall();
  while(collectGems()){await wait(220);await fall();}
}
async function commit(spawns){
  if(flyers.length){
    const els=flyers.map(f=>{
      const el=h('div','fly'), fc=h('div','face'); bg(fc,SP.pin);
      el.appendChild(fc); el.style.transform=pos(f.r,f.c); boardEl.appendChild(el); return el;
    });
    void boardEl.offsetHeight;
    flyers.forEach((f,i)=>{els[i].style.transform=pos(f.to.r,f.to.c);});
    removed.forEach(t=>{if(t.sp==='pin')t.el.classList.add('pop');});
    sfx('spin');
    await wait(330);
    els.forEach(el=>el.remove());
  }
  thawed.forEach(t=>{t.el.classList.add('thaw');shards(t.r,t.c,['#ffffff','#bfe6fb','#8fd0f5'],12,1.1);heard.add('ice');});
  cracked.forEach(t=>{shards(t.r,t.c,['#8d99a3','#dfe6ea','#c58a4a'],8);heard.add('wood');});
  let sr=0, sc=0, n=0;
  removed.forEach(t=>{
    sr+=t.r; sc+=t.c; n++;
    if(t.sp==='crate'){shards(t.r,t.c,['#c58a4a','#8f5e2e','#e0b27a'],9);heard.add('wood');}
    else if(t.sp==='mud'){shards(t.r,t.c,['#5b3d24','#7a5535','#2f1e10'],10);heard.add('mud');}
    else if(t.sp==='rock'){shards(t.r,t.c,['#7d8790','#c9d2d8','#3d454c'],14,1.3);heard.add('wood');}
    else if(t.sp==='pin')shards(t.r,t.c,['#ffd166','#ffffff'],8);
    else if(!t.sp){shards(t.r,t.c,t.timer?['#ff8a2b','#ffe08a','#ffffff']:[COLORS[t.kind],'#ffffff',COLORS[t.kind]],t.timer?12:6);heard.add('pop');}
    if(moss[t.r][t.c]){
      moss[t.r][t.c]=false; count('moss'); heard.add(def.frost?'ice':'moss');
      $('over').children[t.r*COLS+t.c].classList.remove('moss');
      shards(t.r,t.c,def.frost?['#d8f3ff','#2f9df0','#ffffff']:['#7fd14a','#a6e36b','#4f8f2c'],8);
    }
    clearFog(t.r,t.c);clearFog(t.r-1,t.c);clearFog(t.r+1,t.c);clearFog(t.r,t.c-1);clearFog(t.r,t.c+1);
  });
  thawed.forEach(t=>clearFog(t.r,t.c));
  let poured=0;
  amberAdd.forEach(([r,c])=>{if(!amber[r][c]){amber[r][c]=true;count('amber');poured++;shards(r,c,['#ffc04d','#f0780a','#fff3c4'],4,.7);}});
  if(poured){paintAmber();heard.add('moss');}
  stat('pop',n);
  fxq.forEach(f=>f());
  if(heard.has('boom'))shake();
  comboNow=combo; heard.forEach(sfx);
  const gain=n*10*Math.max(1,combo);
  score+=gain; hud();
  const flyers2=[];
  removed.forEach(t=>{
    const key=t.sp==='crate'?'crate':t.sp==='mud'?'mud':t.sp==='rock'?'rock':(!t.sp&&t.kind>=0)?'k'+t.kind:null;
    if(key&&goals[key])flyers2.push({el:t.el,key});
  });
  thawed.forEach(t=>{if(goals.ice)flyers2.push({el:t.el,key:'ice'});});
  flyGoals(flyers2);
  if(heard.has('rain')||heard.has('boom')){flash();buzz(40);}else if(n)buzz(10);
  if(n)floatText(sr/n,sc/n,'+'+gain);
  removed.forEach(t=>t.el.classList.add('pop'));
  await wait(220);
  thawed.forEach(t=>{t.el.classList.remove('thaw');paint(t);});
  cracked.forEach(paint);
  removed.forEach(t=>{t.el.remove();if(board[t.r][t.c]===t)board[t.r][t.c]=null;});
  spawns.forEach(s=>{
    if(mask[s.r][s.c]&&!board[s.r][s.c]){board[s.r][s.c]=makeTile(-1,s.r,s.c,s.sp);if(s.sp==='rainbow')stat('rainbow');stat('bonus');}
  });
  await settle();
}
function clearFog(r,c){
  if(r<0||r>=ROWS||c<0||c>=COLS||!fog[r][c])return;
  fog[r][c]=false; count('fog');
  $('over').children[r*COLS+c].classList.remove('fog');
  shards(r,c,['#ffffff','#dfe8ee'],5,.6);
}
const CHEERS=['','','Гарно!','Чудово!','Супер!','Неймовірно!'];
async function cascade(prefer){
  for(;;){
    const groups=findGroups(); if(!groups.length)break;
    combo++; begin();
    if(combo>(S.stat.chain||0))S.stat.chain=combo;
    if(combo>1)floatText(ROWS/2-1,COLS/2-.5,CHEERS[Math.min(combo,5)],true);
    if(combo===3){say('Оце так лавина!','wow');flash();}
    const spawns=[];
    stat('match',groups.length);
    for(const g of groups){
      const lines=g.runs.filter(x=>!x.sq);
      const longest=lines.reduce((a,b)=>b.length>a.length?b:a,[]);
      const sp=longest.length>=5?'rainbow':lines.length>=2?'bomb':longest.length===4?(longest.dir==='h'?'col':'row'):lines.length<g.runs.length?'pin':null;
      if(sp){
        let spot=null;
        if(prefer)g.tiles.forEach(t=>{if(prefer.has(t))spot=t;});
        if(!spot&&lines.length>=2)spot=lines[0].find(t=>lines[1].includes(t));
        if(!spot){const base=longest.length?longest:g.runs[0];spot=base[Math.floor(base.length/2)];}
        spawns.push({r:spot.r,c:spot.c,sp});
      }
      const pour=!!def.amber&&[...g.tiles].some(t=>amber[t.r][t.c]);
      g.tiles.forEach(t=>{
        const {r,c}=t;
        if(pour)mark(r,c);
        hit(t);
        [at(r-1,c),at(r+1,c),at(r,c-1),at(r,c+1)].forEach(n=>{
          if(n&&(n.sp==='crate'||n.sp==='mud'||n.ice)&&!g.tiles.has(n)){hit(n,true);if(pour&&removed.has(n))mark(n.r,n.c);}
        });
      });
    }
    await commit(spawns);
    prefer=null;
  }
}

/* ---------- turns ---------- */
function swapCells(a,b){
  const ar=a.r,ac=a.c,br=b.r,bc=b.c;
  board[ar][ac]=b;board[br][bc]=a;place(a,br,bc);place(b,ar,ac);
}
function setSel(t){if(sel)sel.el.classList.remove('sel');sel=t;if(t)t.el.classList.add('sel');}
function clearHint(){clearTimeout(hintT);each(t=>t.el.classList.remove('hint'));}
function armHint(){clearHint();hintT=setTimeout(()=>{if(busy)return;const m=findMove();if(m)m.forEach(t=>t.el.classList.add('hint'));},6000);}
const goalsDone=()=>!def.rush&&Object.values(goals).every(g=>g.have>=g.need);
const FIXED_MSG='Лід, ящики, скелі, багно й самоцвіти не рухаються. Розбийте перешкоду збігом поруч або бонусом.';
function spend(){
  played=true;
  if(def.time)return;
  moves--; hud();
  if(moves===5)say('Залишилося 5 ходів. Шукайте бонуси!','sad');
}

async function attempt(a,b){
  if(fixed(a)||fixed(b)){setSel(null);say(FIXED_MSG);return;}
  const free=mode==='glove';
  busy=true; setSel(null); clearHint(); combo=0; mudKilled=false;
  if(free){S.inv.glove--;save();setMode(null);hud();}
  swapCells(a,b); sfx('tap'); await wait(230);
  if(a.sp||b.sp){
    if(!free)spend(); say(''); begin();
    if(a.sp&&b.sp){stat('merge');await combine(a,b);}
    else if(a.sp)fire(a,a.sp==='rainbow'?b.kind:undefined);
    else fire(b,b.sp==='rainbow'?a.kind:undefined);
    await commit([]); await cascade();
  }else{
    if(!findGroups().length){
      if(!free){swapCells(a,b);[a,b].forEach(t=>{t.el.classList.remove('nope');void t.el.offsetWidth;t.el.classList.add('nope');});buzz(25);await wait(230);busy=false;armHint();return;}
    }else if(!free)spend();
    say('');
    await cascade(new Set([a,b]));
  }
  await after(!free);
}
async function activate(t){
  busy=true; setSel(null); clearHint(); combo=0; mudKilled=false;
  spend(); say(''); begin(); fire(t);
  await commit([]); await cascade(); await after(true);
}
async function useStrike(t,horiz){
  busy=true; setMode(null); clearHint(); combo=0;
  S.inv[horiz?'rowhit':'colhit']--; save(); hud(); begin(); line(t.r,t.c,horiz);
  await commit([]); await cascade(); await after(false);
}
async function useHammer(t){
  if(t.sp==='gem'){say('Самоцвіт не розбити. Розчистіть шлях під ним.');return;}
  busy=true; setMode(null); clearHint(); combo=0;
  S.inv.hammer--; save(); hud(); begin(); hit(t);
  await commit([]); await cascade(); await after(false);
}
function spreadMud(){
  const opts=[];
  each(t=>{
    if(t.sp!=='mud')return;
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dc])=>{const n=at(t.r+dr,t.c+dc);if(n&&n.kind>=0&&!n.ice&&!n.timer)opts.push(n);});
  });
  if(!opts.length)return false;
  const n=opts[Math.floor(Math.random()*opts.length)];
  n.kind=-1; n.sp='mud'; paint(n);
  if(goals.mud)goals.mud.need++;
  shards(n.r,n.c,['#5b3d24','#7a5535'],8); sfx('mud'); hud();
  say('Багно розповзлося. Прибирайте хоча б одну пляму за хід.');
  return true;
}
async function finale(){
  const step=6;
  let n=def.time?Math.min(8,Math.floor(timeLeft/step)):Math.min(moves,8);
  if(n>0){say(def.time?'Зайвий час перетворюється на бонуси! Торкніться поля, щоб пропустити.':'Зайві ходи перетворюються на бонуси! Торкніться поля, щоб пропустити.');showSkip(true);}
  while(n-->0){
    if(skipFin)break;
    const pool=[]; each(t=>{if(t.kind>=0&&!t.ice)pool.push(t);});
    if(!pool.length)break;
    const t=pool[Math.floor(Math.random()*pool.length)];
    t.kind=-1; t.timer=0; t.sp=['row','col','pin','bomb'][Math.floor(Math.random()*4)]; paint(t);
    if(def.time)timeLeft-=step; else moves--;
    hud(); await wait(160);
    combo=0; begin(); fire(t);
    await commit([]); await cascade();
  }
  showSkip(false);
}
async function after(turn){
  if(def.rush){
    if(timeLeft<=0)return endRush();
    if(!findMove()){shuffle();await cascade();}
    busy=false; armHint(); return;
  }
  if(goalsDone()){
    running=false;
    const left=def.time?timeLeft/def.time:moves/def.moves, st=left>=.3?3:left>=.1?2:1;
    await finale();
    return end(true,st);
  }
  if(turn){
    let dead=false;
    each(t=>{if(t.timer){t.timer--;paint(t);if(t.timer<=0)dead=true;}});
    if(dead)return end(false,0,'Жарина догоріла. Забирайте камінці з цифрами, поки лічильник не дійшов до нуля.');
    if(!mudKilled&&spreadMud())await wait(260);
    if(gemQueue>0&&++gemClock>=3){gemClock=0;gemDrop=true;say('Згори падає ще один самоцвіт.');}
  }
  if(def.time?timeLeft<=0:moves<=0)return end(false);
  if(!findMove()){
    say('Ходів немає — перемішую камінці.'); await wait(600);
    shuffle(); await cascade();
    if(goalsDone())return after(false);
    if(!findMove())return end(false);
  }
  busy=false; armHint();
}
function shuffle(){
  const ts=[]; each(t=>{if(t.kind>=0&&!t.ice)ts.push(t);});
  for(let n=0;n<200;n++){
    const ks=ts.map(t=>t.kind);
    for(let i=ks.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ks[i],ks[j]]=[ks[j],ks[i]];}
    ts.forEach((t,i)=>{t.kind=ks[i];});
    if(!findGroups().length&&findMove())break;
  }
  ts.forEach(paint);
}

/* ---------- level setup ---------- */
function build(d,R){
  ROWS=d.rows||8; COLS=d.cols||7;
  const gs=$('gameScreen');
  gs.style.setProperty('--cols',COLS); gs.style.setProperty('--rows',ROWS); gs.style.setProperty('--ratio',COLS/ROWS);
  gs.classList.toggle('amberLevel',!!d.amber);
  const mk=(ROWS===9?SHAPES:MASKS)[d.mask], ri=n=>Math.floor(R()*n);
  mask=[]; for(let r=0;r<ROWS;r++){mask.push([]);for(let c=0;c<COLS;c++)mask[r].push(!(mk&&mk(r,c)));}
  entry=[]; for(let c=0;c<COLS;c++){let e=0;while(e<ROWS&&!mask[e][c])e++;entry.push(e<ROWS?e:-1);}
  const same=(r,c,k)=>{const t=at(r,c);return !!t&&t.kind===k;};
  const swapIn=(r,c,sp,hp)=>{board[r][c].el.remove();board[r][c]=makeTile(-1,r,c,sp,hp);};
  const plain=t=>!t.sp&&!t.ice&&!t.timer;
  const scatter=(n,ok,fn)=>{let guard=600;while(n>0&&guard--){const r=ri(ROWS),c=ri(COLS);if(mask[r][c]&&ok(r,c,board[r][c])){fn(r,c,board[r][c]);n--;}}};
  let tries=0;
  do{
    boardEl.textContent=''; board=[]; moss=[]; fog=[];
    for(let r=0;r<ROWS;r++){
      board.push([]); moss.push(new Array(COLS).fill(false)); fog.push(new Array(COLS).fill(false));
      for(let c=0;c<COLS;c++){
        if(!mask[r][c]){board[r].push(null);continue;}
        let k, g=0;
        do{k=ri(KINDS)}while(g++<30&&((same(r,c-1,k)&&same(r,c-2,k))||(same(r-1,c,k)&&same(r-2,c,k))||(same(r-1,c,k)&&same(r,c-1,k)&&same(r-1,c-1,k))));
        board[r].push(makeTile(k,r,c));
      }
    }
    for(let i=0,cols=[...Array(COLS).keys()];i<d.gems&&cols.length;i++){
      const c=cols.splice(ri(cols.length),1)[0];
      if(entry[c]>=0)swapIn(entry[c],c,'gem');
    }
    scatter(d.mud,(r,c,t)=>r>=ROWS-3&&plain(t),(r,c)=>swapIn(r,c,'mud'));
    scatter(d.rock,(r,c,t)=>r>=2&&plain(t),(r,c)=>swapIn(r,c,'rock'));
    scatter(d.crate,(r,c,t)=>r>=ROWS-5&&plain(t),(r,c)=>swapIn(r,c,'crate',1));
    scatter(d.crate2,(r,c,t)=>r>=ROWS-5&&plain(t),(r,c)=>swapIn(r,c,'crate',2));
    if(d.pat){
      const mr=Math.floor(ROWS/2), mc=Math.floor(COLS/2);
      for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
        const t=board[r][c]; if(!t||!plain(t))continue;
        const on=d.pat===1?Math.max(Math.abs(r-mr),Math.abs(c-mc))===2
          :d.pat===2?(r===2||r===ROWS-3)&&c>0&&c<COLS-1
          :(r===mr||c===mc)&&!(r===mr&&c===mc)&&Math.abs(r-mr)<3&&Math.abs(c-mc)<3;
        if(on){t.ice=1;paint(t);}
      }
    }else scatter(d.ice,(r,c,t)=>plain(t),(r,c,t)=>{t.ice=1;paint(t);});
    scatter(d.ice2,(r,c,t)=>plain(t),(r,c,t)=>{t.ice=2;paint(t);});
    scatter(d.ember,(r,c,t)=>r<=ROWS-4&&plain(t),(r,c,t)=>{t.timer=d.emberT;paint(t);});
    scatter(d.moss,(r,c)=>!moss[r][c],(r,c)=>{moss[r][c]=true;});
    if(d.frost)for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)moss[r][c]=mask[r][c];
    scatter(d.fog,(r,c)=>!fog[r][c],(r,c)=>{fog[r][c]=true;});
    const kinds=['row','pin','bomb'];
    for(let i=0;i<startBonus;i++)scatter(1,(r,c,t)=>plain(t),(r,c)=>swapIn(r,c,i===0&&R()<.5?'col':kinds[i]));
  }while((findGroups().length||!findMove())&&++tries<60);
  amber=[]; for(let r=0;r<ROWS;r++)amber.push(new Array(COLS).fill(false));
  if(d.amber){
    const mr=Math.floor(ROWS/2), mc=Math.floor(COLS/2), B=ROWS-1, E=COLS-1;
    const seeds=[
      [[mr,mc],[mr-1,mc],[mr,mc-1],[mr-1,mc-1]],
      [[0,mc-1],[0,mc],[0,mc+1],[B,1],[B,2],[B,E-1],[B,E-2]],
      [[1,1],[1,E-1],[B-1,1],[B-1,E-1],[1,2],[B-1,E-2]],
      [[mr-1,0],[mr,0],[mr+1,0],[mr-1,E],[mr,E],[mr+1,E]]
    ][d.seed||0];
    seeds.forEach(([r,c])=>{if(mask[r]&&mask[r][c])amber[r][c]=true;});
    if(!amber.some(row=>row.some(x=>x)))scatter(2,()=>true,(r,c)=>{amber[r][c]=true;});
  }
  const ok=(r,c)=>r>=0&&r<ROWS&&c>=0&&c<COLS&&mask[r][c];
  for(const id of ['cells','over']){
    const box=$(id); box.textContent='';
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
      const e=h('div',!mask[r][c]?'hole':id==='over'?((moss[r][c]?(d.frost?'moss frost ':'moss '):'')+(fog[r][c]?'fog':'')).trim():'');
      if(id==='cells'&&mask[r][c]){
        const sh=[]; const L='rgba(255,246,214,.9)';
        if(!ok(r-1,c))sh.push('0 -3px 0 '+L); if(!ok(r+1,c))sh.push('0 3px 0 '+L);
        if(!ok(r,c-1))sh.push('-3px 0 0 '+L); if(!ok(r,c+1))sh.push('3px 0 0 '+L);
        if(sh.length)e.style.boxShadow=sh.join(',');
        if(d.gems&&!ok(r+1,c))e.classList.add('exit');
      }
      box.appendChild(e);
    }
  }
  paintAmber();
}
function paintAmber(){
  const box=$('cells'), A=(r,c)=>r>=0&&r<ROWS&&c>=0&&c<COLS&&amber[r][c];
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const e=box.children[r*COLS+c]; if(!e)continue;
    e.classList.toggle('amber',amber[r][c]);
    if(!amber[r][c])continue;
    const u=A(r-1,c), d=A(r+1,c), l=A(r,c-1), rt=A(r,c+1), R='28%';
    e.style.borderRadius=(u||l?'0':R)+' '+(u||rt?'0':R)+' '+(d||rt?'0':R)+' '+(d||l?'0':R);
  }
}
function start(){
  hideOverlay();
  def=customDef||levelDef(level); KINDS=def.kinds;
  if(!def.rush){
    const k=[1.25,1,.85][S.diff];
    /* the game leans against the player: easier after repeated fails, tighter on a long win streak */
    def.adj=S.fails.level===level&&S.fails.n>=2?Math.min(4,S.fails.n):startBonus>=3?-2:0;
    def.moves=Math.max(8,Math.round(def.moves*k)+def.adj);
    if(def.time)def.time=Math.max(45,Math.round(def.time*k/5)*5+def.adj*5);
  }
  const ch=CH[def.ch], gs=$('gameScreen');
  gs.style.setProperty('--c1',ch.a); gs.style.setProperty('--c2',ch.b);
  if(typeof applyBg==='function')applyBg('game');
  $('lvName').textContent='Рівень '+level; $('chName').textContent=def.rush?'Монетна лихоманка':ch.name+(def.time?' · на час':'')+(def.hard===2?' · дуже складний':def.hard===1?' · складний':'');
  gs.classList.toggle('hard',def.hard>0); $('lvName').textContent=def.rush?'Міні-гра':'Рівень '+level;
  build(def,rng(level*31+7));
  score=0; moves=def.moves; timeLeft=def.time; sel=null; combo=0; setMode(null); parts=[];
  goals={};
  played=false; skipFin=false; SPEED=1; showSkip(false);
  gemQueue=def.gemsExtra||0; gemClock=0; gemDrop=false; spreadOn=false;
  let ice=0, crate=0, mossN=0, gems=gemQueue, mud=0, ember=0, rock=0, fogN=0, amberN=0;
  if(def.amber)for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(mask[r][c]&&!amber[r][c])amberN++;
  each(t=>{ice+=t.ice;if(t.sp==='crate')crate++;if(t.sp==='gem')gems++;if(t.sp==='mud')mud++;if(t.sp==='rock')rock++;if(t.timer)ember++;});
  fog.forEach(row=>row.forEach(m=>{if(m)fogN++;}));
  moss.forEach(row=>row.forEach(m=>{if(m)mossN++;}));
  if(amberN)goals.amber={need:amberN,have:0,img:AMBER};
  if(ember)goals.ember={need:ember,have:0,img:EMBER};
  if(mud)goals.mud={need:mud,have:0,img:SP.mud};
  if(rock)goals.rock={need:rock,have:0,img:SP.rock};
  if(fogN)goals.fog={need:fogN,have:0,img:FOG};
  if(ice)goals.ice={need:ice,have:0,img:ICE};
  if(crate)goals.crate={need:crate,have:0,img:SP.crate};
  if(mossN)goals.moss={need:mossN,have:0,img:def.frost?FROST:MOSS};
  if(gems)goals.gem={need:gems,have:0,img:SP.gem};
  def.collect.forEach(([k,n])=>{goals['k'+k]={need:n,have:0,kind:k};});
  if(pre.paid)applyPre();
  hud(); say(''); busy=false; running=true; armHint();
}
function applyPre(){
  if(pre.bomb){
    const pool=[]; each(t=>{if(t.kind>=0&&!t.ice&&!t.timer)pool.push(t);});
    if(pool.length){const t=pool[Math.floor(pool.length/2)];t.kind=-1;t.sp='bomb';paint(t);}
  }
  if(pre.extra){if(def.time)timeLeft+=15;else moves+=3;}
  hud();
}
