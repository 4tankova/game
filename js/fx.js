/* Particles on the canvas over the board, floating texts and synthesized sounds. */
const boardEl=$('board');
const fx=$('fx'), ctx=fx.getContext('2d');
const calm=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches);
let parts=[], raf=0, last=0;
let GLOW=null;
try{
  GLOW=document.createElement('canvas'); GLOW.width=GLOW.height=64;
  const g=GLOW.getContext('2d'), rg=g.createRadialGradient(32,32,0,32,32,32);
  rg.addColorStop(0,'rgba(255,255,240,1)'); rg.addColorStop(.25,'rgba(255,230,160,.8)'); rg.addColorStop(1,'rgba(255,200,80,0)');
  g.fillStyle=rg; g.fillRect(0,0,64,64);
}catch(e){GLOW=null;}
function geo(){
  const b=boardEl.getBoundingClientRect(), d=window.devicePixelRatio||1;
  const w=Math.round(b.width*d), hh=Math.round(b.height*d);
  if(fx.width!==w||fx.height!==hh){fx.width=w;fx.height=hh;}
  return {w:b.width,h:b.height,d,cw:b.width/COLS,ch:b.height/ROWS};
}
function kick(){if(!raf){last=performance.now();raf=requestAnimationFrame(tick);}}
function shards(r,c,cols,n,power){
  if(calm)return; const g=geo(); power=power||1;
  for(let i=0;i<n;i++)parts.push({type:'s',x:(c+.5)*g.cw,y:(r+.5)*g.ch,
    vx:(Math.random()-.5)*g.cw*9*power,vy:(Math.random()-.75)*g.ch*9*power,
    rot:Math.random()*6,vr:(Math.random()-.5)*16,size:g.cw*(.1+Math.random()*.16),
    col:cols[i%cols.length],life:0,max:.4+Math.random()*.3,grav:g.ch*22});
  if(GLOW)for(let i=0;i<Math.ceil(n/2);i++)parts.push({type:'g',x:(c+.5)*g.cw,y:(r+.5)*g.ch,
    vx:(Math.random()-.5)*g.cw*5*power,vy:(Math.random()-.6)*g.ch*5*power,size:g.cw*(.18+Math.random()*.25),life:0,max:.35+Math.random()*.35});
  kick();
}
function buzz(ms){try{if(!S.muted&&navigator.vibrate)navigator.vibrate(ms);}catch(e){}}
function flash(){
  if(calm)return;
  const e=h('div','flash'); $('pops').appendChild(e); setTimeout(()=>e.remove(),420);
}
/* collected pieces fly up to their goal counter */
function flyGoals(items){
  if(calm||!items.length)return;
  items.slice(0,10).forEach((it,n)=>{
    const chip=document.querySelector('#goals .chip[data-key="'+it.key+'"] i'); if(!chip||!it.el)return;
    const a=it.el.getBoundingClientRect(), b=chip.getBoundingClientRect();
    if(!a.width||!b.width)return;
    const f=h('i','goalFly'); f.style.backgroundImage=chip.style.backgroundImage;
    f.style.left=a.left+'px'; f.style.top=a.top+'px'; f.style.width=a.width+'px'; f.style.height=a.height+'px';
    f.style.transitionDelay=(n*35)+'ms';
    document.body.appendChild(f);
    const dx=b.left+b.width/2-(a.left+a.width/2), dy=b.top+b.height/2-(a.top+a.height/2), k=b.width/a.width;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{f.style.transform='translate('+dx+'px,'+dy+'px) scale('+k+')';}));
    setTimeout(()=>{
      f.remove();
      const c=document.querySelector('#goals .chip[data-key="'+it.key+'"]');
      if(c){c.classList.remove('bump');void c.offsetWidth;c.classList.add('bump');}
    },560+n*35);
  });
}
function confetti(){
  if(calm)return; const g=geo();
  for(let i=0;i<90;i++)parts.push({type:'s',x:Math.random()*g.w,y:-Math.random()*g.h*.4,
    vx:(Math.random()-.5)*g.cw*3,vy:g.ch*(1+Math.random()*3),rot:Math.random()*6,vr:(Math.random()-.5)*14,
    size:g.cw*(.14+Math.random()*.14),col:COLORS[i%6],life:0,max:1.4+Math.random()*.8,grav:g.ch*5});
  kick();
}
function ring(r,c,col,size){if(calm)return;const g=geo();parts.push({type:'r',x:(c+.5)*g.cw,y:(r+.5)*g.ch,R:g.cw*size,col,life:0,max:.42});kick();}
function beam(r,c,horiz){if(calm)return;parts.push({type:'b',r,c,horiz,life:0,max:.38});kick();}
function tick(now){
  const dt=Math.max(0,Math.min(.05,(now-last)/1000)); last=now;
  const g=geo(); ctx.setTransform(g.d,0,0,g.d,0,0); ctx.clearRect(0,0,g.w,g.h);
  parts=parts.filter(p=>(p.life+=dt)<p.max);
  for(const p of parts){
    const a=1-p.life/p.max;
    if(p.type==='s'){
      p.vy+=p.grav*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.rot+=p.vr*dt;
      ctx.save(); ctx.globalAlpha=Math.min(1,a*2); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.fillStyle=p.col;
      ctx.beginPath(); ctx.moveTo(-p.size/2,-p.size/2); ctx.lineTo(p.size/2,-p.size/4); ctx.lineTo(0,p.size/2); ctx.closePath(); ctx.fill(); ctx.restore();
    }else if(p.type==='g'){
      p.x+=p.vx*dt; p.y+=p.vy*dt; p.vx*=.94; p.vy*=.94;
      ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=a;
      ctx.drawImage(GLOW,p.x-p.size,p.y-p.size,p.size*2,p.size*2);
      ctx.globalCompositeOperation='source-over';
    }else if(p.type==='r'){
      const k=p.life/p.max;
      ctx.globalAlpha=a*.5; ctx.fillStyle=p.col; ctx.beginPath(); ctx.arc(p.x,p.y,p.R*k*.8,0,7); ctx.fill();
      ctx.globalAlpha=a; ctx.strokeStyle='#fff'; ctx.lineWidth=g.cw*.14*a+1; ctx.beginPath(); ctx.arc(p.x,p.y,p.R*k,0,7); ctx.stroke();
    }else{
      const k=Math.min(1,p.life/p.max*2.5), th=(p.horiz?g.ch:g.cw)*(.25+.6*a);
      ctx.globalAlpha=a; ctx.fillStyle='#fff1b8';
      if(p.horiz){const cx=(p.c+.5)*g.cw;ctx.fillRect(cx-g.w*k,(p.r+.5)*g.ch-th/2,g.w*2*k,th);}
      else{const cy=(p.r+.5)*g.ch;ctx.fillRect((p.c+.5)*g.cw-th/2,cy-g.h*k,th,g.h*2*k);}
    }
  }
  ctx.globalAlpha=1;
  raf=parts.length?requestAnimationFrame(tick):0;
}
function shake(){const w=$('wrap');w.classList.remove('shake');void w.offsetWidth;w.classList.add('shake');}
function floatText(r,c,text,big){
  if(calm)return;
  const e=h('div','pts'+(big?' big':''),text);
  e.style.left=((c+.5)/COLS*100)+'%'; e.style.top=((r+.5)/ROWS*100)+'%';
  $('pops').appendChild(e); setTimeout(()=>e.remove(),950);
}

/* ---------- sound ---------- */
let ac=null;
function audio(){
  if(S.muted)return;
  try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();}catch(e){ac=null;}
}
function tone(f0,f1,dur,type,vol,delay){
  const t=ac.currentTime+(delay||0), o=ac.createOscillator(), g=ac.createGain();
  o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f1,t+dur);
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t+dur+.02);
}
function noise(dur,kind,freq,vol){
  const n=Math.floor(ac.sampleRate*dur), buf=ac.createBuffer(1,n,ac.sampleRate), d=buf.getChannelData(0);
  for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
  const src=ac.createBufferSource(), f=ac.createBiquadFilter(), g=ac.createGain(), t=ac.currentTime;
  src.buffer=buf; f.type=kind; f.frequency.value=freq;
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.001,t+dur);
  src.connect(f); f.connect(g); g.connect(ac.destination); src.start(t);
}
let comboNow=0;
function sfx(name){
  if(S.muted||!ac)return;
  try{
    const cb=Math.min(comboNow,6);
    if(name==='pop')tone(420+cb*70,760+cb*90,.12,'triangle',.18);
    else if(name==='ice'){noise(.18,'highpass',3500,.35);tone(2400,900,.1,'square',.05);tone(3100,1400,.08,'square',.04,.05);}
    else if(name==='boom'){noise(.5,'lowpass',500,.7);tone(140,40,.45,'sine',.5);}
    else if(name==='zip'){noise(.3,'bandpass',1800,.3);tone(300,1500,.25,'sawtooth',.07);}
    else if(name==='wood'){noise(.12,'lowpass',900,.5);tone(180,90,.1,'square',.08);}
    else if(name==='moss')noise(.15,'bandpass',700,.25);
    else if(name==='mud'){noise(.2,'lowpass',300,.5);tone(160,70,.18,'sine',.2);}
    else if(name==='spin')tone(500,1300,.3,'sine',.12);
    else if(name==='gem')[1047,1319,1568].forEach((f,i)=>tone(f,f,.2,'sine',.16,i*.07));
    else if(name==='rain')[523,659,784,1047].forEach((f,i)=>tone(f,f,.18,'triangle',.14,i*.06));
    else if(name==='win')[523,659,784,1047,1319].forEach((f,i)=>tone(f,f,.22,'triangle',.16,i*.1));
    else if(name==='lose')[392,330,262].forEach((f,i)=>tone(f,f*.97,.3,'triangle',.14,i*.16));
    else if(name==='tap')tone(700,900,.06,'sine',.1);
    else if(name==='land')tone(220,150,.05,'sine',.05);
    else if(name==='tick')tone(1200,1100,.05,'square',.05);
  }catch(e){}
}
document.addEventListener('pointerdown',audio);
