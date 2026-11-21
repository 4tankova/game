/* Extra mini-games between levels: jigsaw, sliding puzzle, tetris, mine clearing, whack-a-pig.
   Each map stop pays once; the same games can be played for practice from the «Полігон» card. */
let miniStopFn=null;
function stopMiniLoop(){if(miniStopFn){try{miniStopFn();}catch(e){}miniStopFn=null;}}
{
  const close0=closeMini;
  closeMini=function(){stopMiniLoop();close0();};
}
/* pictures for the puzzles: the player's own photos (3:4) */
const PUZZLE_IMGS=[
  ['img/pz-0.webp','Бандура і броня'],['img/pz-1.webp','Броня на світанку'],['img/pz-2.webp','Пікап на передову'],
  ['img/pz-3.webp','Рідне місто'],['img/pz-4.webp','Донбас — це Україна']
];
const PZ_AR=4/3;
const loadImg=src=>new Promise(res=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>res(null);im.src=src;});
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

/* ---------- jigsaw: real interlocking pieces, drag them onto the board ---------- */
const PZ_SIZES=[[3,4,'Новобранець'],[4,5,'Боєць'],[5,7,'Ветеран']];
function puzzleMenu(){
  stopMiniLoop();
  const body=openMini('Пазл');
  body.appendChild(h('p','miniMsg','Оберіть картину та складність.'));
  let lvl=1;
  const seg=h('div','seg');
  PZ_SIZES.forEach(([c,r,name],i)=>{const b=h('button',i===lvl?'on':'',name+' · '+c*r);b.type='button';b.onclick=()=>{lvl=i;seg.querySelectorAll('button').forEach((x,k)=>x.classList.toggle('on',k===i));};seg.appendChild(b);});
  body.appendChild(seg);
  const g=h('div','pzPick');
  PUZZLE_IMGS.forEach(([src,name],k)=>{const b=h('button','pzThumb');b.type='button';b.style.backgroundImage='url("'+src+'")';b.appendChild(h('span','',name));b.onclick=()=>playJigsaw(null,k,lvl);g.appendChild(b);});
  body.appendChild(g);
  miniButtons(body,null,null);
}
function playPuzzle(id,ci){
  const lvl=(ci||0)>=4?2:(ci||0)>=2?1:0;
  playJigsaw(id,(id==null?Math.floor(Math.random()*PUZZLE_IMGS.length):(id*7+3)%PUZZLE_IMGS.length),lvl);
}
async function playJigsaw(id,imgIdx,lvl){
  stopMiniLoop();
  const [src,name]=PUZZLE_IMGS[imgIdx], [C,R]=PZ_SIZES[lvl], N=C*R;
  const body=openMini('Пазл · '+name);
  const top=h('div','pzTop'), cnt=h('b','','0 / '+N), clock=h('b','','0:00'); top.appendChild(cnt); top.appendChild(clock);
  const msg=h('p','miniMsg','Перетягуйте шматочки на поле. Поруч зі своїм місцем шматочок сам стане на місце.');
  const wrap=h('div','pzWrap'), cv=h('canvas','pzCanvas'); wrap.appendChild(cv);
  const tools=h('div','pzTools');
  const bHint=h('button','','👁 Підказка'), bEdge=h('button','','▦ Краї'), bMix=h('button','','⟲ Розкласти');
  [bHint,bEdge,bMix].forEach(b=>{b.type='button';tools.appendChild(b);});
  body.appendChild(top); body.appendChild(wrap); body.appendChild(tools); body.appendChild(msg);
  miniButtons(body,id,id==null?()=>puzzleMenu():null);
  const img=await loadImg(src); if(!img){msg.textContent='Не вдалося завантажити картинку.';return;}
  /* layout: board on top, tray below */
  const d=window.devicePixelRatio||1, W=Math.max(280,Math.min(560,wrap.clientWidth||320));
  const availH=Math.max(420,Math.min(900,(innerHeight||700)-210));
  let bh=Math.min(availH*.56,W*.8*PZ_AR), bw=bh/PZ_AR;
  const H=Math.round(bh+Math.max(170,availH-bh)+16), bx=(W-bw)/2, by=8, cw=bw/C, chh=bh/R, tab=Math.min(cw,chh)*.22, M=tab*1.25;
  cv.width=W*d; cv.height=H*d; cv.style.width=W+'px'; cv.style.height=H+'px';
  const g=cv.getContext('2d'); g.setTransform(d,0,0,d,0,0);
  /* edge shapes: +1 tab out, -1 tab in, 0 flat */
  const hz=[...Array(R+1)].map((_,r)=>[...Array(C)].map(()=>r===0||r===R?0:(Math.random()<.5?1:-1)));
  const vt=[...Array(R)].map(()=>[...Array(C+1)].map((_,c)=>c===0||c===C?0:(Math.random()<.5?1:-1)));
  const edge=(P,x0,y0,x1,y1,t)=>{
    /* from (x0,y0) to (x1,y1); t bulges to the left of the direction of travel */
    if(!t){P.lineTo(x1,y1);return;}
    const dx=x1-x0, dy=y1-y0, L=Math.hypot(dx,dy), ux=dx/L, uy=dy/L, nx=uy*t, ny=-ux*t;
    const q=(a,b)=>[x0+ux*a*L+nx*b*tab, y0+uy*a*L+ny*b*tab];
    P.lineTo(...q(.34,0));
    P.bezierCurveTo(...q(.42,0),...q(.40,.55),...q(.36,.85));
    P.bezierCurveTo(...q(.30,1.35),...q(.70,1.35),...q(.64,.85));
    P.bezierCurveTo(...q(.60,.55),...q(.58,0),...q(.66,0));
    P.lineTo(x1,y1);
  };
  const pathOf=(c,r)=>{
    const P=new Path2D(), x=M, y=M;
    P.moveTo(x,y);
    edge(P,x,y,x+cw,y,hz[r][c]);            /* top: outward (up) is +1 */
    edge(P,x+cw,y,x+cw,y+chh,vt[r][c+1]);   /* right: outward (right) is +1 */
    edge(P,x+cw,y+chh,x,y+chh,-hz[r+1][c]);
    edge(P,x,y+chh,x,y,-vt[r][c]);
    P.closePath(); return P;
  };
  const pieces=[];
  for(let r=0;r<R;r++)for(let c=0;c<C;c++){
    /* the shared edge must bulge out of one piece and into the other */
    const path=pathOf(c,r);
    const oc=document.createElement('canvas'), ow=cw+2*M, oh=chh+2*M; oc.width=Math.ceil(ow*d); oc.height=Math.ceil(oh*d);
    const o=oc.getContext('2d'); o.setTransform(d,0,0,d,0,0);
    o.save(); o.clip(path);
    const sx=img.width/bw, sy=img.height/bh;
    o.drawImage(img,(c*cw-M)*sx,(r*chh-M)*sy,ow*sx,oh*sy,0,0,ow,oh);
    o.restore();
    o.lineJoin='round';
    o.save(); o.clip(path); o.translate(-1.2,-1.2); o.strokeStyle='rgba(255,255,255,.55)'; o.lineWidth=2.4; o.stroke(path); o.restore();
    o.save(); o.clip(path); o.translate(1.4,1.4); o.strokeStyle='rgba(0,0,0,.45)'; o.lineWidth=2.6; o.stroke(path); o.restore();
    o.strokeStyle='rgba(20,24,12,.55)'; o.lineWidth=1; o.stroke(path);
    pieces.push({c,r,path,oc,ow,oh,x:0,y:0,s:1,tx:bx+c*cw-M,ty:by+r*chh-M,placed:false,edge:r===0||c===0||r===R-1||c===C-1,anim:null});
  }
  const trayTop=by+bh+14;
  /* pieces wait in the tray at a smaller size, laid out in a neat grid */
  const trayH=H-trayTop-4; let TS=.8;
  for(;TS>.3;TS-=.02){const k=Math.max(1,Math.floor((W-6)/(cw*TS*1.18)));if(Math.ceil(N/k)*chh*TS*1.18<=trayH)break;}
  const scatter=(list,edgesFirst)=>{
    let L=list.filter(p=>!p.placed);
    L=edgesFirst?L.sort((a,b)=>(b.edge?1:0)-(a.edge?1:0)):shuffled(L);
    const k=Math.max(1,Math.floor((W-6)/(cw*TS*1.18))), sx=(W-6)/k, rows=Math.ceil(L.length/k), sy=Math.min(chh*TS*1.3,trayH/Math.max(1,rows));
    L.forEach((p,i)=>{
      const cx=3+sx*(i%k)+sx/2, cy=trayTop+sy*Math.floor(i/k)+sy/2;
      p.anim={fx:p.x,fy:p.y,fs:p.s,ts:TS,tx:cx-(M+cw/2)*TS+(Math.random()-.5)*4,ty:cy-(M+chh/2)*TS+(Math.random()-.5)*4,t:0,dur:.3+i*.012};
    });
    const rest=pieces.filter(p=>p.placed); pieces.length=0; pieces.push(...rest,...L);
    kick2();
  };
  pieces.forEach(p=>{p.x=bx+bw/2-p.ow/2;p.y=by+bh/2-p.oh/2;});
  let ghost=.14, hintT=0, drag=null, done=false, placedN=0, hints=0, t0=0, sec=0, raf=0, last=0, shine=-1, sparks=[];
  const draw=()=>{
    g.clearRect(0,0,W,H);
    /* tray mat */
    g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(0,trayTop-6,W,H-trayTop+6);
    /* board */
    g.save(); g.shadowColor='rgba(0,0,0,.5)'; g.shadowBlur=16; g.fillStyle='#1a2410'; g.fillRect(bx-4,by-4,bw+8,bh+8); g.restore();
    g.globalAlpha=Math.min(1,ghost+hintT); g.drawImage(img,bx,by,bw,bh); g.globalAlpha=1;
    if(!done){g.strokeStyle='rgba(255,255,255,.07)';g.lineWidth=1;for(let c=1;c<C;c++){g.beginPath();g.moveTo(bx+c*cw,by);g.lineTo(bx+c*cw,by+bh);g.stroke();}for(let r=1;r<R;r++){g.beginPath();g.moveTo(bx,by+r*chh);g.lineTo(bx+bw,by+r*chh);g.stroke();}}
    g.strokeStyle='#c9a64a'; g.lineWidth=3; g.strokeRect(bx-2,by-2,bw+4,bh+4);
    if(done){g.drawImage(img,bx,by,bw,bh);}
    else for(const p of pieces){
      const lift=p===drag?1:0;
      if(!p.placed){g.save();g.shadowColor='rgba(0,0,0,.55)';g.shadowBlur=lift?18:6;g.shadowOffsetY=lift?10:3;}
      const sc=p.s*(lift?1.05:1);
      g.drawImage(p.oc,p.x-(sc-p.s)*p.ow/2,p.y-(sc-p.s)*p.oh/2,p.ow*sc,p.oh*sc);
      if(!p.placed)g.restore();
    }
    if(shine>=0){
      const x=bx-bw+shine*(bw*3); const lg=g.createLinearGradient(x,by,x+bw*.6,by+bh);
      lg.addColorStop(0,'rgba(255,255,255,0)'); lg.addColorStop(.5,'rgba(255,250,220,.55)'); lg.addColorStop(1,'rgba(255,255,255,0)');
      g.save(); g.beginPath(); g.rect(bx,by,bw,bh); g.clip(); g.fillStyle=lg; g.fillRect(bx,by,bw,bh); g.restore();
    }
    for(const s of sparks){g.globalAlpha=Math.max(0,1-s.t/s.m);g.fillStyle=s.col;g.beginPath();g.arc(s.x,s.y,s.r*(1-s.t/s.m)+.5,0,7);g.fill();}
    g.globalAlpha=1;
  };
  const step=now=>{
    const dt=Math.min(.05,(now-(last||now))/1000); last=now; let busy=!!drag;
    for(const p of pieces)if(p.anim){const a=p.anim;a.t+=dt;const k=Math.min(1,a.t/a.dur),e=1-Math.pow(1-k,3);p.x=a.fx+(a.tx-a.fx)*e;p.y=a.fy+(a.ty-a.fy)*e;if(a.ts!=null)p.s=a.fs+(a.ts-a.fs)*e;if(k>=1){p.anim=null;if(a.cb)a.cb();}busy=true;}
    if(hintT>0){hintT=Math.max(0,hintT-dt*.6);busy=true;}
    if(shine>=0){shine+=dt*.7;if(shine>1)shine=-1;busy=true;}
    sparks=sparks.filter(s=>(s.t+=dt)<s.m);sparks.forEach(s=>{s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=300*dt;}); if(sparks.length)busy=true;
    if(t0&&!done){const n=Math.floor((now-t0)/1000);if(n!==sec){sec=n;clock.textContent=Math.floor(n/60)+':'+String(n%60).padStart(2,'0');}busy=true;}
    draw(); raf=busy?requestAnimationFrame(step):0;
  };
  const kick2=()=>{if(!raf){last=0;raf=requestAnimationFrame(step);}};
  miniStopFn=()=>{cancelAnimationFrame(raf);raf=-1;done=true;};
  const burst=(x,y,n,cols)=>{for(let i=0;i<n;i++)sparks.push({x,y,vx:(Math.random()-.5)*260,vy:-Math.random()*240,r:2+Math.random()*3,t:0,m:.5+Math.random()*.4,col:cols[i%cols.length]});};
  const at2=e=>{const b=cv.getBoundingClientRect();return [(e.clientX-b.left)*W/b.width,(e.clientY-b.top)*H/b.height];};
  let ox=0, oy=0;
  cv.addEventListener('pointerdown',e=>{
    if(done)return; const [x,y]=at2(e);
    for(let i=pieces.length-1;i>=0;i--){const p=pieces[i];if(p.placed||p.anim)continue;
      g.save(); g.setTransform(1,0,0,1,0,0); const hit=g.isPointInPath(p.path,(x-p.x)/p.s,(y-p.y)/p.s); g.restore();
      if(hit){
        drag=p; ox=(x-p.x)/p.s; oy=(y-p.y)/p.s; p.s=1; p.x=x-ox; p.y=y-oy; pieces.splice(i,1); pieces.push(p); cv.setPointerCapture(e.pointerId); sfx('tap');
        if(!t0)t0=performance.now(); kick2(); e.preventDefault(); return;}}
  });
  cv.addEventListener('pointermove',e=>{if(!drag)return;const [x,y]=at2(e);drag.x=Math.max(-drag.ow*.4,Math.min(W-drag.ow*.6,x-ox));drag.y=Math.max(-drag.oh*.3,Math.min(H-drag.oh*.6,y-oy));kick2();});
  const drop=()=>{
    if(!drag)return; const p=drag; drag=null;
    const dist=Math.hypot(p.x-p.tx,p.y-p.ty);
    if(dist<Math.min(cw,chh)*.38){
      p.placed=true; placedN++; cnt.textContent=placedN+' / '+N;
      p.anim={fx:p.x,fy:p.y,tx:p.tx,ty:p.ty,t:0,dur:.12,cb:()=>{burst(p.tx+p.ow/2,p.ty+p.oh/2,10,['#ffd23a','#fff3c4','#7fd14a']);}};
      pieces.splice(pieces.indexOf(p),1); pieces.unshift(p);
      sfx('pop'); buzz(12);
      if(placedN===N)setTimeout(win,260);
    }else{
      sfx('land');
      if(p.y+p.oh*.5>trayTop){const cx=p.x+p.ow/2, cy=Math.max(trayTop+chh*TS*.5,p.y+p.oh/2);p.anim={fx:p.x,fy:p.y,fs:1,ts:TS,tx:cx-p.ow*TS/2,ty:cy-p.oh*TS/2,t:0,dur:.15};}
    }
    kick2();
  };
  cv.addEventListener('pointerup',drop); cv.addEventListener('pointercancel',drop);
  const win=()=>{
    done=true; shine=0; sfx('win'); confettiMini(wrap);
    for(let i=0;i<6;i++)setTimeout(()=>burst(bx+Math.random()*bw,by+Math.random()*bh,18,['#ffd23a','#2f6fd6','#fff3c4']),i*120);
    const secs=Math.round((performance.now()-t0)/1000), par=N*6, st=Math.max(1,3-(secs>par?1:0)-(secs>par*2?1:0)-(hints>1?1:0));
    const coins=Math.round([8,14,22][lvl]*(st/3+.34));
    miniReward(id,coins,msg,'★'.repeat(st)+'☆'.repeat(3-st)+' Картину «'+name+'» зібрано за '+Math.floor(secs/60)+':'+String(secs%60).padStart(2,'0')+'!');
    kick2();
  };
  bHint.onclick=()=>{if(done)return;hints++;hintT=.75;sfx('spin');kick2();};
  bEdge.onclick=()=>{if(done)return;scatter(pieces,true);sfx('tap');};
  bMix.onclick=()=>{if(done)return;scatter(pieces,false);sfx('tap');};
  draw(); setTimeout(()=>scatter(pieces,false),350); kick2();
}

/* ---------- sliding puzzle (п'ятнашки) with the player's photos ---------- */
function playSlide(id){
  stopMiniLoop();
  const C=3, R=4, N=C*R, [src,name]=PUZZLE_IMGS[Math.floor(Math.random()*PUZZLE_IMGS.length)];
  const body=openMini('П\'ятнашки · '+name);
  const top=h('div','pzTop'), mv=h('b','','Ходів: 0'), clock=h('b','','0:00'); top.appendChild(mv); top.appendChild(clock);
  const msg=h('p','miniMsg','Торкніться шматочка поруч із порожньою клітинкою, щоб посунути його. Номери в кутках підкажуть порядок.');
  const board=h('div','slideBoard'); board.style.aspectRatio=C+'/'+R;
  const prev=h('i','slidePrev'); prev.style.backgroundImage='url("'+src+'")';
  let pos=[...Array(N).keys()], empty=N-1, moves=0, done=false, t0=0;
  const nb=i=>[i-C,i+C,(i%C)?i-1:-1,(i%C<C-1)?i+1:-1].filter(x=>x>=0&&x<N);
  /* pos[cell]=tile; shuffle by legal moves so it is always solvable */
  for(let k=0;k<220;k++){const o=nb(empty).filter(x=>true);const j=o[Math.floor(Math.random()*o.length)];[pos[empty],pos[j]]=[pos[j],pos[empty]];empty=j;}
  const tiles=[];
  for(let t=0;t<N;t++){
    const el=h('button','sl'); el.type='button';
    el.style.width=(100/C)+'%'; el.style.height=(100/R)+'%';
    el.style.backgroundImage='url("'+src+'")'; el.style.backgroundSize=(C*100)+'% '+(R*100)+'%';
    el.style.backgroundPosition=((t%C)*100/(C-1))+'% '+(Math.floor(t/C)*100/(R-1))+'%';
    el.appendChild(h('span','',String(t+1)));
    if(t===N-1)el.classList.add('last');
    el.onclick=()=>tap(t);
    tiles.push(el); board.appendChild(el);
  }
  const place=()=>pos.forEach((t,cell)=>{const el=tiles[t];el.style.transform='translate('+(cell%C)*100+'%,'+Math.floor(cell/C)*100+'%)';el.classList.toggle('ok',t===cell);});
  const timer=setInterval(()=>{if(t0&&!done){const n=Math.floor((Date.now()-t0)/1000);clock.textContent=Math.floor(n/60)+':'+String(n%60).padStart(2,'0');}},500);
  miniStopFn=()=>clearInterval(timer);
  const tap=t=>{
    if(done)return; const cell=pos.indexOf(t); if(!nb(cell).includes(empty))return;
    if(!t0)t0=Date.now();
    pos[empty]=t; pos[cell]=N-1; empty=cell; moves++; mv.textContent='Ходів: '+moves; sfx('tap'); place();
    if(pos.every((v,i)=>v===i)){
      done=true; board.classList.add('whole'); sfx('win'); confettiMini(board);
      const secs=Math.round((Date.now()-t0)/1000);
      miniReward(id,Math.max(6,20-Math.floor(moves/10)),msg,'Складено за '+moves+' ходів і '+Math.floor(secs/60)+':'+String(secs%60).padStart(2,'0')+'!');
    }
  };
  place();
  const row=h('div','slideRow'); row.appendChild(board); row.appendChild(prev);
  body.appendChild(top); body.appendChild(row); body.appendChild(msg); miniButtons(body,id,id==null?()=>playSlide(null):null);
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
    }else{
      sfx('land');
      if(p.y+p.oh*.5>trayTop){const cx=p.x+p.ow/2, cy=Math.max(trayTop+chh*TS*.5,p.y+p.oh/2);p.anim={fx:p.x,fy:p.y,fs:1,ts:TS,tx:cx-p.ow*TS/2,ty:cy-p.oh*TS/2,t:0,dur:.15};}
    }
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
      const ft=h('b','whFt',o.kind==='rino'?'−3':o.hp>0?'Бум!':(o.kind==='orc2'?'+2':'+1')); if(o.kind==='rino')ft.classList.add('bad'); ft.style.left=(hEl.offsetLeft+hEl.offsetWidth/2)+'px'; ft.style.top=(hEl.offsetTop+hEl.offsetHeight*.15)+'px'; grid.appendChild(ft); setTimeout(()=>ft.remove(),700);
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
const RANGE=[['puzzle','Пазл','Справжній пазл: 12, 20 або 35 шматочків',puzzleMenu],['slide','П\'ятнашки','Посувайте шматочки на місце',()=>playSlide(null)],
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

/* ---------- memory with flipping cards (replaces the simple version) ---------- */
function playMemory(id){
  stopMiniLoop();
  const body=openMini('Знайди пару');
  const pics=[...defaults.slice(0,6),SP.row,DRONE_FULL];
  const top=h('div','pzTop'), mv=h('b','','Спроб: 0'), clock=h('b','','0:00'); top.appendChild(mv); top.appendChild(clock);
  const msg=h('p','miniMsg','Відкривайте по дві картки й шукайте однакові. Менше помилок — більше нагорода.');
  const grid=h('div','mem');
  const kinds=shuffled([...Array(8).keys(),...Array(8).keys()]);
  let open=[], found=0, tries=0, lock=false, t0=0;
  const timer=setInterval(()=>{if(t0&&found<8){const n=Math.floor((Date.now()-t0)/1000);clock.textContent=Math.floor(n/60)+':'+String(n%60).padStart(2,'0');}},500);
  miniStopFn=()=>clearInterval(timer);
  kinds.forEach((k,i)=>{
    const b=h('button','mcard'); b.type='button'; b.style.animationDelay=(i*30)+'ms';
    const inn=h('div','in'), fr=h('div','fr'), bk=h('div','bk'); bg(fr,pics[k]);
    inn.appendChild(bk); inn.appendChild(fr); b.appendChild(inn);
    const c={k,el:b,up:false};
    b.onclick=()=>{
      if(lock||c.up)return; if(!t0)t0=Date.now();
      c.up=true; b.classList.add('up'); sfx('tap'); open.push(c);
      if(open.length<2)return;
      const [a,d]=open; open=[]; tries++; mv.textContent='Спроб: '+tries;
      if(a.k===d.k){
        found++; setTimeout(()=>{sfx('pop');a.el.classList.add('ok');d.el.classList.add('ok');},250);
        if(found===8){
          setTimeout(()=>{sfx('win');confettiMini(grid);},500);
          const miss=tries-8, st=miss<=6?3:miss<=12?2:1;
          miniReward(id,[5,10,16][st-1],msg,'★'.repeat(st)+'☆'.repeat(3-st)+' Усі пари знайдено за '+tries+' спроб!');
        }
      }else{
        lock=true;
        setTimeout(()=>{a.el.classList.add('no');d.el.classList.add('no');},350);
        setTimeout(()=>{[a,d].forEach(x=>{x.up=false;x.el.classList.remove('up','no');});lock=false;},900);
      }
    };
    grid.appendChild(b);
  });
  body.appendChild(top); body.appendChild(grid); body.appendChild(msg); miniButtons(body,id,id==null?()=>playMemory(null):null);
}
RANGE.splice(1,0,['memory','Знайди пару','16 карток, знайдіть усі пари',()=>playMemory(null)]);
