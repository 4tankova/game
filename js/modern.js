/* Modern look: painted scenery backgrounds for every location and the menu, a new wheel of fortune
   and a new «Полігон» screen. Loaded last, so it can replace the older drawing functions. */

/* ---------- scenery ---------- */
const SCN_W=480, SCN_H=900;
const srnd=s=>()=>{s=(s*16807)%2147483647;return(s-1)/2147483646;};
const hills=(y,amp,seg,col,r,extra)=>{
  let d='M0 '+SCN_H+' L0 '+y;
  for(let x=0;x<=SCN_W;x+=SCN_W/seg){const yy=y+(r()-.5)*amp;d+=' Q'+(x-SCN_W/seg/2)+' '+(yy-amp*.35)+' '+x+' '+yy;}
  return "<path d='"+d+" L"+SCN_W+" "+SCN_H+"Z' fill='"+col+"' "+(extra||'')+"/>";
};
const pine=(x,base,hh,col)=>{
  const w=hh*.42; let s='';
  for(let k=0;k<3;k++){const top=base-hh+k*hh*.24, bot=base-hh*.18-(2-k)*hh*.2+hh*.08*k;
    s+="<path d='M"+x+" "+top+" L"+(x+w*(.55+k*.22))+" "+bot+" L"+(x-w*(.55+k*.22))+" "+bot+"Z'/>";}
  return "<g fill='"+col+"'>"+s+"<rect x='"+(x-hh*.035)+"' y='"+(base-hh*.2)+"' width='"+(hh*.07)+"' height='"+(hh*.22)+"'/></g>";
};
const skyGrad=(id,stops)=>"<linearGradient id='"+id+"' x1='0' y1='0' x2='0' y2='1'>"+stops.map(([o,c])=>"<stop offset='"+o+"' stop-color='"+c+"'/>").join('')+"</linearGradient>";
const glow=(x,y,r,c,op)=>"<radialGradient id='gl"+x+"'><stop offset='0' stop-color='"+c+"' stop-opacity='"+op+"'/><stop offset='1' stop-color='"+c+"' stop-opacity='0'/></radialGradient><circle cx='"+x+"' cy='"+y+"' r='"+r+"' fill='url(#gl"+x+")'/>";
const fogBand=(y,h2,c,op)=>"<rect x='0' y='"+y+"' width='"+SCN_W+"' height='"+h2+"' fill='"+c+"' opacity='"+op+"' filter='url(#blur)'/>";
function starsLayer(r,n,maxY){let s='';for(let i=0;i<n;i++)s+="<circle cx='"+(r()*SCN_W).toFixed(1)+"' cy='"+(r()*maxY).toFixed(1)+"' r='"+(r()*1.3+.3).toFixed(2)+"' fill='#fff' opacity='"+(r()*.6+.3).toFixed(2)+"'/>";return s;}

const SCENES={
  home(r){
    let s="<defs>"+skyGrad('sk',[[0,'#0b1626'],[.45,'#1d3550'],[.72,'#3f5f6a'],[.86,'#c9a35a'],[1,'#e8c46a']])+"</defs><rect width='100%' height='100%' fill='url(#sk)'/>"+starsLayer(r,90,420);
    s+=glow(240,690,260,'#ffd36a',.55);
    s+=hills(610,40,5,'#2a3d3f',r,"opacity='.85'");
    /* distant city of the defenders */
    let city=''; for(let x=0;x<SCN_W;){const w=18+r()*30,hh=30+r()*90;city+="<rect x='"+x.toFixed(0)+"' y='"+(640-hh).toFixed(0)+"' width='"+w.toFixed(0)+"' height='"+hh.toFixed(0)+"'/>";
      for(let k=0;k<3;k++)if(r()<.5)city+="<rect x='"+(x+4+r()*(w-8)).toFixed(0)+"' y='"+(640-hh+6+r()*(hh-12)).toFixed(0)+"' width='3' height='4' fill='#ffd36a' opacity='.8'/>";x+=w+2;}
    s+="<g fill='#1b2a2e'>"+city+"</g>";
    s+=hills(675,30,6,'#22331f',r)+hills(735,36,5,'#3a4a1e',r);
    /* wheat field */
    let wh=''; for(let i=0;i<160;i++){const x=r()*SCN_W,y=760+r()*140,hh=18+r()*26;wh+="<path d='M"+x.toFixed(0)+" "+y.toFixed(0)+" q"+(r()*6-3).toFixed(1)+" "+(-hh/2).toFixed(0)+" "+(r()*8-4).toFixed(1)+" "+(-hh).toFixed(0)+"' stroke='"+(r()<.5?'#c9a040':'#a8822c')+"' stroke-width='2' fill='none'/>";}
    s+=hills(770,24,6,'#6b5a1e',r)+wh+hills(860,20,4,'#3e3412',r);
    return s;
  },
  0(r){ /* Перший рубіж: dawn over the training ground */
    let s="<defs>"+skyGrad('sk',[[0,'#253a52'],[.5,'#7c6a7a'],[.78,'#e8a06a'],[1,'#f6d28a']])+"</defs><rect width='100%' height='100%' fill='url(#sk)'/>";
    s+=glow(330,560,220,'#ffe0a0',.7)+"<circle cx='330' cy='560' r='46' fill='#ffe7b0' opacity='.9'/>";
    s+=hills(560,50,4,'#5e6b5a',r,"opacity='.7'")+hills(640,40,5,'#46563a',r);
    let hg=''; for(let i=0;i<7;i++){const x=30+i*66+r()*20,y=700+r()*30,k=14+r()*8;
      hg+="<g stroke='#26301c' stroke-width='5' stroke-linecap='round'><path d='M"+(x-k)+" "+y+"L"+(x+k)+" "+(y-k*1.4)+"'/><path d='M"+(x+k)+" "+y+"L"+(x-k)+" "+(y-k*1.4)+"'/><path d='M"+x+" "+(y+2)+"L"+x+" "+(y-k*1.6)+"'/></g>";}
    s+=hills(700,30,5,'#36452a',r)+hg;
    let wire="<path d='M0 790 Q60 778 120 790 T240 790 T360 790 T480 790' stroke='#1d2416' stroke-width='2' fill='none'/>";
    for(let x=10;x<SCN_W;x+=60)wire+="<rect x='"+x+"' y='760' width='5' height='44' fill='#1d2416'/>";
    s+=hills(780,24,4,'#2b3920',r)+wire+hills(850,18,4,'#1c2615',r);
    return s;
  },
  1(r){ /* Ліс незламних: misty pine forest */
    let s="<defs>"+skyGrad('sk',[[0,'#0f2a2a'],[.5,'#3d6e5e'],[1,'#b8d3a6']])+"<filter id='blur'><feGaussianBlur stdDeviation='12'/></filter></defs><rect width='100%' height='100%' fill='url(#sk)'/>";
    s+=glow(120,330,200,'#f2f6d0',.55);
    [[470,'#5f8b72',90,.8],[560,'#3f6b52',120,1],[660,'#284a38',150,1],[790,'#14291e',190,1]].forEach(([base,col,hh,op],li)=>{
      let g=''; for(let x=-20;x<SCN_W+30;x+=hh*.34+r()*hh*.2)g+=pine(x,base+r()*20,hh*(.75+r()*.4),col);
      s+="<g opacity='"+op+"'>"+g+"</g>"+fogBand(base-30,60,'#d9ead2',li<2?.35:.18);
    });
    return s+hills(840,20,4,'#0d1c14',r);
  },
  2(r){ /* Місто мужності: city at dusk */
    let s="<defs>"+skyGrad('sk',[[0,'#141a33'],[.55,'#4a4a72'],[.82,'#c26a5a'],[1,'#f2a46a']])+"<filter id='blur'><feGaussianBlur stdDeviation='14'/></filter></defs><rect width='100%' height='100%' fill='url(#sk)'/>"+starsLayer(r,40,300);
    s+=glow(380,600,220,'#ffb070',.5);
    const row=(base,minH,maxH,col,win)=>{let g='';for(let x=-10;x<SCN_W;){const w=26+r()*44,hh=minH+r()*(maxH-minH);
      g+="<rect x='"+x.toFixed(0)+"' y='"+(base-hh).toFixed(0)+"' width='"+w.toFixed(0)+"' height='"+(hh+200).toFixed(0)+"' fill='"+col+"'/>";
      if(r()<.25)g+="<rect x='"+(x+w*.4).toFixed(0)+"' y='"+(base-hh-26).toFixed(0)+"' width='3' height='26' fill='"+col+"'/>";
      if(win)for(let k=0;k<hh/14;k++)if(r()<.28)g+="<rect x='"+(x+4+r()*(w-10)).toFixed(0)+"' y='"+(base-hh+8+r()*(hh-14)).toFixed(0)+"' width='5' height='6' fill='#ffd88a' opacity='"+(.5+r()*.5).toFixed(2)+"'/>";
      x+=w+3;}return g;};
    s+=row(600,60,210,'#3a3d5e',false);
    s+="<path d='M300 600V250M300 262H420M300 262L250 290M408 262V300' stroke='#2c2f4a' stroke-width='6' fill='none'/>";
    s+=fogBand(520,120,'#f0a070',.22);
    s+=row(700,50,160,'#24263c',true)+row(820,40,120,'#14152a',true);
    for(let i=0;i<3;i++){const x=60+r()*360;s+="<ellipse cx='"+x+"' cy='"+(420+r()*80)+"' rx='70' ry='160' fill='#2a2638' opacity='.35' filter='url(#blur)'/>";}
    return s;
  },
  3(r){ /* Зимова фортеця: snowy mountains and a fortress */
    let s="<defs>"+skyGrad('sk',[[0,'#1a2c48'],[.55,'#5d84a8'],[1,'#d7e8f4']])+"<filter id='blur'><feGaussianBlur stdDeviation='10'/></filter></defs><rect width='100%' height='100%' fill='url(#sk)'/>"+starsLayer(r,50,300);
    s+=glow(110,260,170,'#e8f4ff',.55)+"<circle cx='110' cy='260' r='34' fill='#f4f9ff' opacity='.9'/>";
    const mts=(base,hMin,hMax,col,cap)=>{let g='';for(let x=-80;x<SCN_W+80;){const w=140+r()*120,hh=hMin+r()*(hMax-hMin),px=x+w/2;
      g+="<path d='M"+x+" "+base+" L"+px+" "+(base-hh)+" L"+(x+w)+" "+base+"Z' fill='"+col+"'/>";
      g+="<path d='M"+(px-w*.17)+" "+(base-hh*.66)+" L"+px+" "+(base-hh)+" L"+(px+w*.17)+" "+(base-hh*.66)+" L"+(px+w*.06)+" "+(base-hh*.6)+" L"+(px-w*.04)+" "+(base-hh*.7)+"Z' fill='"+cap+"'/>";
      x+=w*.6;}return g;};
    s+=mts(600,160,300,'#7d98b5','#eef6ff')+fogBand(540,80,'#e6f0fa',.35)+mts(690,120,220,'#4f6b8a','#f6fbff');
    /* fortress wall with towers */
    let f="<rect x='0' y='690' width='480' height='80' fill='#2f4258'/>";
    for(let x=0;x<480;x+=24)f+="<rect x='"+x+"' y='680' width='14' height='12' fill='#2f4258'/>";
    [70,250,410].forEach(x=>{f+="<rect x='"+(x-26)+"' y='610' width='52' height='160' fill='#273a50'/>";for(let k=0;k<3;k++)f+="<rect x='"+(x-26+k*19)+"' y='598' width='12' height='14' fill='#273a50'/>";f+="<rect x='"+(x-5)+"' y='640' width='10' height='16' fill='#ffd88a' opacity='.85'/>";});
    s+=f+"<path d='M0 690h480' stroke='#eef6ff' stroke-width='5'/>";
    s+=hills(780,26,5,'#dfeaf4',r)+hills(850,20,4,'#c4d6e6',r);
    return s;
  },
  4(r){ /* Степ перемоги: golden steppe with sunflowers */
    let s="<defs>"+skyGrad('sk',[[0,'#2a2444'],[.45,'#8a4a52'],[.75,'#e88a4a'],[1,'#f8d27a']])+"</defs><rect width='100%' height='100%' fill='url(#sk)'/>";
    s+=glow(240,600,260,'#ffd27a',.75)+"<circle cx='240' cy='600' r='70' fill='#ffe3a0'/>";
    s+=hills(610,30,4,'#7a5a3a',r,"opacity='.8'")+hills(660,24,5,'#8a6a2a',r);
    let sf=''; for(let i=0;i<40;i++){const x=r()*SCN_W,y=680+r()*200,k=(y-640)/240,sz=6+k*16;
      sf+="<path d='M"+x.toFixed(0)+" "+y.toFixed(0)+"v"+(sz*2.6).toFixed(0)+"' stroke='#3e4a1a' stroke-width='"+(1+k*2).toFixed(1)+"'/>";
      sf+="<circle cx='"+x.toFixed(0)+"' cy='"+y.toFixed(0)+"' r='"+sz.toFixed(1)+"' fill='#f2b51c'/><circle cx='"+x.toFixed(0)+"' cy='"+y.toFixed(0)+"' r='"+(sz*.5).toFixed(1)+"' fill='#5a3a14'/>";}
    s+=hills(700,20,5,'#6b6a24',r)+sf+hills(870,16,4,'#3e4214',r);
    return s;
  }
};
const scnCache={};
function sceneryUrl(key){
  if(scnCache[key])return scnCache[key];
  const r=srnd(String(key).split('').reduce((a,c)=>a*31+c.charCodeAt(0),7)%2147483646+1);
  const body=SCENES[key](r);
  const svg="<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 "+SCN_W+" "+SCN_H+"' preserveAspectRatio='xMidYMax slice'>"+body+"</svg>";
  return scnCache[key]='data:image/svg+xml,'+encodeURIComponent(svg);
}
/* replace the pixel camo with the painted scenery (own pictures still win) */
applyBg=function(name){
  if(name)bgScreen=name;
  const L=$('bgLayer'), dim=(S.dim||0)/100;
  const shade='linear-gradient(rgba(4,14,20,'+dim+'),rgba(4,14,20,'+(dim+.1)+'))';
  const own=bgScreen==='game'&&typeof levelBg==='function'?levelBg():null;
  if(own)L.style.background=shade+',url("'+own+'") center/cover no-repeat';
  else if(bgData)L.style.background=shade+',url("'+bgData+'") center/cover no-repeat';
  else if(bgScreen==='game'){
    const ch=(typeof def!=='undefined'&&def&&def.ch!=null)?def.ch%5:0;
    /* the board needs calm contrast: darken the middle a little, keep the sky alive */
    L.style.background='radial-gradient(90% 60% at 50% 52%,rgba(6,10,16,.5) 0,rgba(6,10,16,.18) 70%,rgba(6,10,16,.35) 100%),url("'+sceneryUrl(ch)+'") center bottom/cover no-repeat,#0b1626';
  }else L.style.background='linear-gradient(rgba(6,12,20,.12),rgba(6,12,20,.38)),url("'+sceneryUrl('home')+'") center bottom/cover no-repeat,#0b1626';
  kickAmb();
};
const oldChapterBg=chapterBg;
chapterBg=function(sec,ci){
  sec.style.backgroundImage='linear-gradient(rgba(6,12,20,.15),rgba(6,12,20,.45)),url("'+sceneryUrl(ci%5)+'")';
  sec.style.backgroundSize='cover'; sec.style.backgroundPosition='center bottom';
  oldChapterBg(sec,ci);
};

/* ---------- wheel of fortune ---------- */
const HELP_IMG=k=>{const el=$(k+'I');return el?el.style.backgroundImage:'';};
const WHEEL_COL=[['#ffcf4a','#e08a12'],['#3a8dff','#1a4fb8'],['#ffcf4a','#e08a12'],['#2fc47a','#13804a'],['#ffcf4a','#e08a12'],['#b06cff','#6a2fc0'],['#ff6a4a','#c0281a'],['#ffcf4a','#e08a12']];
const WHEEL_ICON=['coin','hammer','coin','glove','coin','mix','coin','coin'];
openWheel=function(){
  const body=openMini('Колесо удачі');
  body.classList.add('wheelBody');
  const stage=h('div','wheel2'), rim=h('div','w2rim'), disc=h('div','w2disc'), hub=h('div','w2hub'), ptr=h('div','w2ptr');
  /* segments as one SVG */
  const NS='http://www.w3.org/2000/svg', sv=document.createElementNS(NS,'svg'); sv.setAttribute('viewBox','-100 -100 200 200');
  let defs='';
  WHEEL.forEach((w,i)=>{
    const a0=(i*45-90-22.5)*Math.PI/180, a1=((i+1)*45-90-22.5)*Math.PI/180, R=96;
    defs+="<radialGradient id='ws"+i+"' cx='0' cy='0' r='96' gradientUnits='userSpaceOnUse'><stop offset='.15' stop-color='"+WHEEL_COL[i][0]+"'/><stop offset='1' stop-color='"+WHEEL_COL[i][1]+"'/></radialGradient>";
    sv.insertAdjacentHTML('beforeend',"<path class='seg' data-i='"+i+"' d='M0 0L"+(R*Math.cos(a0)).toFixed(2)+" "+(R*Math.sin(a0)).toFixed(2)+"A"+R+" "+R+" 0 0 1 "+(R*Math.cos(a1)).toFixed(2)+" "+(R*Math.sin(a1)).toFixed(2)+"Z' fill='url(#ws"+i+")' stroke='rgba(255,255,255,.55)' stroke-width='1.2'/>");
  });
  sv.insertAdjacentHTML('afterbegin','<defs>'+defs+'</defs>');
  sv.insertAdjacentHTML('beforeend',"<circle r='96' fill='none' stroke='rgba(0,0,0,.25)' stroke-width='3'/><circle r='60' fill='none' stroke='rgba(255,255,255,.18)' stroke-width='1'/>");
  disc.appendChild(sv);
  WHEEL.forEach((w,i)=>{
    const a=(i*45-90)*Math.PI/180, lab=h('div','w2lab');
    lab.style.left=(50+33*Math.cos(a))+'%'; lab.style.top=(50+33*Math.sin(a))+'%';
    lab.style.transform='translate(-50%,-50%) rotate('+(i*45)+'deg)';
    const ic=h('i','w2ic '+WHEEL_ICON[i]); if(WHEEL_ICON[i]!=='coin')ic.style.backgroundImage=HELP_IMG(WHEEL_ICON[i]);
    lab.appendChild(ic); lab.appendChild(h('b','',w.coins?String(w.coins):WHEEL_TXT[i]));
    disc.appendChild(lab);
  });
  for(let i=0;i<16;i++){const b=h('i','bulb');b.style.setProperty('--a',(i*22.5)+'deg');b.style.setProperty('--k',i%2);rim.appendChild(b);}
  bg(hub,typeof pieceImg==='function'?pieceImg(4):'img/piece-4.webp');
  stage.appendChild(rim); stage.appendChild(disc); stage.appendChild(hub); stage.appendChild(ptr);
  body.appendChild(stage);
  const msg=h('p','miniMsg w2msg',''), btn=h('button','primary w2btn');
  btn.type='button';
  let turn=0, spinning=false, rot=0;
  const label=(text)=>{
    const free=S.wheel!==today();
    btn.innerHTML=free?'Крутити <small>безплатно</small>':'Крутити <small>· 60 монет</small>';
    btn.disabled=spinning||(!free&&S.coins<60);
    if(text!=null)msg.textContent=text;
    else if(!msg.textContent)msg.textContent=free?'Один безплатний оберт щодня.':'Безплатний оберт уже використано. Монет: '+S.coins+'.';
  };
  btn.onclick=()=>{
    if(spinning)return;
    if(S.wheel===today()){if(S.coins<60)return;S.coins-=60;}
    S.wheel=today(); save(); spinning=true; stage.classList.add('spin'); stage.classList.remove('won');
    disc.querySelectorAll('.seg').forEach(p=>p.classList.remove('win'));
    label('Крутиться…');
    const idx=Math.floor(Math.random()*8); turn+=6;
    rot=turn*360+(360-idx*45)+(Math.random()*24-12);
    disc.style.transform='rotate('+rot+'deg)';
    sfx('spin');
    /* the pointer clicks over the pegs while the wheel slows down */
    let ticks=0; const tk=setInterval(()=>{ptr.classList.remove('tick');void ptr.offsetWidth;ptr.classList.add('tick');if(++ticks>40)clearInterval(tk);},90);
    setTimeout(()=>{
      clearInterval(tk); spinning=false; stage.classList.remove('spin'); stage.classList.add('won');
      const seg=disc.querySelector('.seg[data-i="'+idx+'"]'); if(seg)seg.classList.add('win');
      label('Ви виграли: '+give(WHEEL[idx])+'!'); sfx('gem'); if(typeof confetti==='function')confetti();
    },4600);
  };
  body.appendChild(msg); body.appendChild(btn);
  label();
};

/* ---------- «Полігон» ---------- */
const RANGE_ART={puzzle:['img/pz-0.webp','#3a6df0','#1b2f7a'],memory:['img/gem-3.webp','#e0406a','#6a1430'],slide:['img/pz-2.webp','#f0a020','#7a4a08'],
  tetris:['img/gem-1.webp','#2fc4a0','#0c5a4a'],mines:['img/piece-4.webp','#8a8f98','#2a2e36'],whack:['img/pig-mad.webp','#6cc04a','#24521a'],mahjong:['img/gem-0.webp','#b06cff','#3e1a7a']};
openRange=function(){
  stopMiniLoop();
  const body=openMini('Полігон');
  body.appendChild(h('p','miniMsg rgIntro','Тренування без нагород. Монети дають за міні-ігри на карті між рівнями.'));
  const list=h('div','range2');
  RANGE.forEach(([k,name,sub,fn],i)=>{
    const a=RANGE_ART[k]||['img/piece-4.webp','#5a6a7a','#20262e'];
    const b=h('button','rg2'); b.type='button'; b.style.setProperty('--c1',a[1]); b.style.setProperty('--c2',a[2]); b.style.animationDelay=(i*60)+'ms';
    const art=h('i','rgArt'); bg(art,a[0]); b.appendChild(art);
    const tx=h('div','rgTx'); tx.appendChild(h('b','',name)); tx.appendChild(h('span','',sub)); b.appendChild(tx);
    b.appendChild(h('em','','Грати ▸'));
    b.onclick=fn; list.appendChild(b);
  });
  body.appendChild(list);
};

/* first paint with the new scenery */
try{applyBg();}catch(e){}
