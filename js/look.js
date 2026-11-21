/* Look settings: own background picture, moving particles over it, glass shine on own stone pictures. */
const AMB_TYPES=[['none','Немає'],['sparkle','Іскри'],['snow','Сніг'],['bubbles','Бульбашки'],['leaves','Листя'],['hearts','Сердечка'],['fireflies','Світлячки'],['stars','Зорі']];
const BG_KEY='kaminci-bg';
let bgData=null;
try{bgData=localStorage.getItem(BG_KEY);}catch(e){bgData=null;}

/* ---------- background layer ---------- */
let bgScreen='home';
const CAMO='img/camo.webp';
function applyBg(name){
  if(name)bgScreen=name;
  const L=$('bgLayer'), dim=(S.dim||0)/100;
  const shade='linear-gradient(rgba(4,14,20,'+dim+'),rgba(4,14,20,'+(dim+.1)+'))';
  const own=bgScreen==='game'&&typeof levelBg==='function'?levelBg():null;
  if(own){
    L.style.background=shade+',url("'+own+'") center/cover no-repeat';
  }else if(bgData){
    L.style.background=shade+',url("'+bgData+'") center/cover no-repeat';
  }else if(bgScreen==='game'){
    const gs=$('gameScreen'), c1=gs.style.getPropertyValue('--c1')||'#0f6b78', c2=gs.style.getPropertyValue('--c2')||'#082c3a';
    /* pixel camo tinted with the location colours, darker towards the edges */
    L.style.background='radial-gradient(130% 85% at 50% 30%,transparent 0,color-mix(in srgb,'+c2+' 80%,transparent) 100%),'+
      'linear-gradient(color-mix(in srgb,'+c1+' 42%,transparent),color-mix(in srgb,'+c2+' 62%,transparent)),url("'+CAMO+'") center/360px repeat';
  }else{
    L.style.background='radial-gradient(120% 80% at 50% 20%,rgba(20,26,10,.1) 0,rgba(12,16,6,.78) 100%),url("'+CAMO+'") center/360px repeat';
  }
  kickAmb();
}

/* ---------- moving particles ---------- */
const amb=$('amb'), actx=amb.getContext('2d');
let ambParts=[], ambRaf=0, ambLast=0, ambT=0, ambCur='none';
const ambType=()=>(bgScreen==='game'&&typeof def!=='undefined'&&def&&!def.rush&&def.ch===3)?'snow':(S.amb&&S.amb!=='none'?S.amb:'embers');
const sprite=(inner,outer)=>{
  const c=document.createElement('canvas'); c.width=c.height=64;
  const g=c.getContext('2d'), rg=g.createRadialGradient(32,32,0,32,32,32);
  rg.addColorStop(0,inner); rg.addColorStop(.3,outer); rg.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=rg; g.fillRect(0,0,64,64); return c;
};
const GLOWS={white:sprite('rgba(255,255,255,1)','rgba(255,255,255,.35)'),gold:sprite('rgba(255,250,220,1)','rgba(255,200,90,.45)'),fly:sprite('rgba(250,255,200,1)','rgba(190,255,90,.5)')};
const R=(a,b)=>a+Math.random()*(b-a);
function newPart(type,w,hh,fresh){
  const p={x:R(0,w),y:fresh?R(0,hh):0,ph:R(0,6.28),s:1};
  if(type==='snow'){p.s=R(2,5.5);p.vy=R(20,60);p.y=fresh?p.y:-10;p.a=R(.6,1);}
  else if(type==='embers'){p.s=R(1.2,3);p.vy=-R(14,38);p.vx=R(-8,8);p.y=fresh?p.y:hh+10;p.a=R(.3,.75);}
  else if(type==='sparkle'){p.s=R(1.4,3.2);p.vy=-R(10,30);p.y=fresh?p.y:hh+10;p.a=R(.5,1);}
  else if(type==='bubbles'){p.s=R(4,13);p.vy=-R(18,48);p.y=fresh?p.y:hh+20;p.a=R(.35,.7);}
  else if(type==='leaves'){p.s=R(5,10);p.vy=R(22,50);p.y=fresh?p.y:-20;p.rot=R(0,6.28);p.vr=R(-2,2);p.col=['#7fd14a','#ffb347','#e9d14a','#d9623b'][Math.floor(R(0,4))];}
  else if(type==='hearts'){p.s=R(8,15);p.vy=-R(14,34);p.y=fresh?p.y:hh+20;p.a=R(.6,.95);p.col=['#ff6f9a','#ff9fc0','#ff4d6d'][Math.floor(R(0,3))];}
  else if(type==='fireflies'){p.s=R(6,13);p.vx=R(-20,20);p.vy=R(-20,20);p.y=R(0,hh);}
  else if(type==='stars'){p.s=R(.8,2.2);p.y=R(0,hh);p.vy=R(1,4);}
  return p;
}
function ambSize(){
  const d=window.devicePixelRatio||1, w=innerWidth, hh=innerHeight;
  if(amb.width!==Math.round(w*d)||amb.height!==Math.round(hh*d)){amb.width=Math.round(w*d);amb.height=Math.round(hh*d);}
  return {w,h:hh,d};
}
function ambReset(){
  const {w,h:hh}=ambSize(), type=ambCur=ambType();
  const n=type==='none'?0:Math.round(Math.min(70,Math.max(18,w*hh/(type==='stars'?9000:16000))));
  ambParts=[]; for(let i=0;i<n;i++)ambParts.push(newPart(type,w,hh,true));
}
function heart(x,y,s){
  actx.beginPath(); actx.moveTo(x,y+s*.35);
  actx.bezierCurveTo(x,y,x-s*.5,y-s*.1,x-s*.5,y+s*.25); actx.bezierCurveTo(x-s*.5,y+s*.55,x,y+s*.75,x,y+s);
  actx.bezierCurveTo(x,y+s*.75,x+s*.5,y+s*.55,x+s*.5,y+s*.25); actx.bezierCurveTo(x+s*.5,y-s*.1,x,y,x,y+s*.35); actx.fill();
}
function ambTick(now){
  ambRaf=0;
  const type=ambCur;
  if(type==='none'||calm||document.hidden){actx.clearRect(0,0,amb.width,amb.height);return;}
  const dt=Math.max(0,Math.min(.05,(now-ambLast)/1000)); ambLast=now; ambT+=dt;
  const {w,h:hh,d}=ambSize();
  actx.setTransform(d,0,0,d,0,0); actx.clearRect(0,0,w,hh);
  if(!$('mapScreen').hidden){ambRaf=requestAnimationFrame(ambTick);return;}
  for(let i=0;i<ambParts.length;i++){
    const p=ambParts[i];
    if(type==='fireflies'){
      p.vx+=R(-30,30)*dt; p.vy+=R(-30,30)*dt; p.vx=Math.max(-25,Math.min(25,p.vx)); p.vy=Math.max(-25,Math.min(25,p.vy));
      p.x=(p.x+p.vx*dt+w)%w; p.y=(p.y+p.vy*dt+hh)%hh;
    }else{
      p.y+=p.vy*dt;
      if(type==='snow'||type==='leaves'||type==='hearts'||type==='bubbles')p.x+=Math.sin(ambT*1.3+p.ph)*(type==='bubbles'?14:22)*dt;
      if(p.rot!==undefined)p.rot+=p.vr*dt;
      if(p.y>hh+30||p.y<-30||p.x<-30||p.x>w+30){ambParts[i]=newPart(type,w,hh,false);continue;}
    }
    const tw=.55+.45*Math.sin(ambT*2.2+p.ph);
    if(type==='snow'){actx.globalAlpha=p.a;actx.fillStyle='#fff';actx.beginPath();actx.arc(p.x,p.y,p.s,0,6.283);actx.fill();}
    else if(type==='embers'){p.x+=p.vx*dt+Math.sin(ambT*1.7+p.ph)*10*dt;actx.globalCompositeOperation='lighter';actx.globalAlpha=p.a*tw;actx.drawImage(GLOWS.gold,p.x-p.s*4,p.y-p.s*4,p.s*8,p.s*8);actx.globalCompositeOperation='source-over';}
    else if(type==='sparkle'){actx.globalCompositeOperation='lighter';actx.globalAlpha=p.a*tw;actx.drawImage(GLOWS.gold,p.x-p.s*5,p.y-p.s*5,p.s*10,p.s*10);actx.globalCompositeOperation='source-over';}
    else if(type==='stars'){actx.globalAlpha=tw;actx.drawImage(GLOWS.white,p.x-p.s*4,p.y-p.s*4,p.s*8,p.s*8);if(p.y>hh+10)p.y=-10;}
    else if(type==='fireflies'){actx.globalCompositeOperation='lighter';actx.globalAlpha=.35+.65*tw;actx.drawImage(GLOWS.fly,p.x-p.s,p.y-p.s,p.s*2,p.s*2);actx.globalCompositeOperation='source-over';}
    else if(type==='bubbles'){
      actx.globalAlpha=p.a;actx.strokeStyle='#fff';actx.lineWidth=1.5;actx.beginPath();actx.arc(p.x,p.y,p.s,0,6.283);actx.stroke();
      actx.fillStyle='rgba(255,255,255,.18)';actx.fill();actx.globalAlpha=p.a*1.2;actx.fillStyle='#fff';actx.beginPath();actx.arc(p.x-p.s*.35,p.y-p.s*.35,p.s*.22,0,6.283);actx.fill();
    }
    else if(type==='leaves'){
      actx.globalAlpha=.85;actx.save();actx.translate(p.x,p.y);actx.rotate(p.rot);actx.fillStyle=p.col;
      actx.beginPath();actx.ellipse(0,0,p.s,p.s*.45,0,0,6.283);actx.fill();
      actx.strokeStyle='rgba(0,0,0,.25)';actx.lineWidth=1;actx.beginPath();actx.moveTo(-p.s,0);actx.lineTo(p.s,0);actx.stroke();actx.restore();
    }
    else if(type==='hearts'){actx.globalAlpha=p.a;actx.fillStyle=p.col;heart(p.x,p.y,p.s);}
  }
  actx.globalAlpha=1;
  ambRaf=requestAnimationFrame(ambTick);
}
function kickAmb(){
  if(ambType()!==ambCur)ambReset();
  document.documentElement.classList.toggle('amb',ambCur!=='none'&&!calm);
  if(!ambRaf){ambLast=performance.now();ambRaf=requestAnimationFrame(ambTick);}
}
addEventListener('resize',()=>{ambReset();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)kickAmb();});

/* ---------- settings controls ---------- */
function drawAmbChoices(){
  const box=$('ambs'); box.textContent='';
  AMB_TYPES.forEach(([k,label])=>{
    const b=h('button','ambOpt'+((S.amb||'none')===k?' on':''),label); b.type='button';
    b.setAttribute('aria-pressed',(S.amb||'none')===k?'true':'false');
    b.onclick=()=>{S.amb=k;save();ambReset();drawAmbChoices();kickAmb();};
    box.appendChild(b);
  });
}
function drawBgPreview(){
  const p=$('bgPrev');
  p.style.backgroundImage=bgData?'url("'+bgData+'")':'';
  p.classList.toggle('empty',!bgData);
  $('bgClear').disabled=!bgData;
}
function setGloss(){document.documentElement.classList.toggle('gloss',S.gloss!==false);$('glossT').checked=S.gloss!==false;}
$('bgPick').onclick=()=>$('bgFile').click();
$('bgClear').onclick=()=>{bgData=null;try{localStorage.removeItem(BG_KEY);}catch(e){}$('bgMsg').textContent='Повернуто стандартний фон.';drawBgPreview();applyBg();};
$('bgFile').addEventListener('change',e=>{
  const f=e.target.files[0]; e.target.value=''; if(!f)return;
  const url=URL.createObjectURL(f), img=new Image();
  img.onload=()=>{
    URL.revokeObjectURL(url);
    let saved=null;
    for(const [max,q] of [[1600,.82],[1200,.7],[900,.6]]){
      const k=Math.min(1,max/Math.max(img.width,img.height)), cv=document.createElement('canvas');
      cv.width=Math.round(img.width*k); cv.height=Math.round(img.height*k);
      cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
      const data=cv.toDataURL('image/jpeg',q);
      try{localStorage.setItem(BG_KEY,data);saved=data;break;}catch(err){}
    }
    if(saved){bgData=saved;$('bgMsg').textContent='Фон встановлено.';}
    else{bgData=null;$('bgMsg').textContent='Ця картинка завелика для збереження в браузері. Оберіть меншу.';}
    drawBgPreview(); applyBg();
  };
  img.onerror=()=>{URL.revokeObjectURL(url);$('bgMsg').textContent='Не вдалося відкрити цей файл. Оберіть PNG або JPG.';};
  img.src=url;
});
$('bgDim').value=S.dim;
$('bgDim').addEventListener('input',()=>{S.dim=+$('bgDim').value;save();applyBg();});
$('glossT').addEventListener('change',()=>{S.gloss=$('glossT').checked;save();setGloss();});

['gear','gear2'].forEach(id=>$(id).addEventListener('click',()=>{drawAmbChoices();drawBgPreview();$('bgDim').value=S.dim;}));
setGloss(); drawAmbChoices(); drawBgPreview(); ambReset(); applyBg(bgScreen);
