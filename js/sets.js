/* Bonus levels «Ворожий балаган» built from the sticker pack: each has its own enemy set,
   every fifth one throws in a mixed squad. The main campaign keeps its own pieces. Characters with several pictures pull faces, react
   when picked, show a "beaten" face when smashed and sway idly on the board. */
const TIMG=n=>'img/t/'+n+'.webp';
const CHARS={};
const addChar=(id,frames,c,an)=>{CHARS[id]={id,f:frames,c,an};};
[['matA',['A0','A1','A2'],'#cb5019'],['balA',['A3','A4','A5'],'#ca670d'],['rooA',['A6','A7','A8'],'#c45a14'],
 ['drB',['B6','B7','B8'],'#97644f'],['matB',['B0','B1','B2'],'#dc4e1b'],['matD',['D0','D1','D2'],'#bd420a'],
 ['balD',['D3','D4','B4'],'#c05f0d'],['rooB',['C2','B5','C7'],'#be5e33'],['drC',['C6','C3','C4','C5'],'#9a6342'],
 ['matC',['C0','C8'],'#d7410d'],['rooD',['D5'],'#a34a1f'],['drD',['D6'],'#7c5c45'],['balB',['B3','C1'],'#d1600d'],
 ['famE',['E0'],'#9c7231'],['balE',['E1'],'#9f692e'],['rooE',['E2','E5'],'#b17a4d'],['drE',['E3','E4'],'#9c7348'],
 ['pigM',['P0'],'#a0574a'],['balZ',['P1','P5'],'#9e693e'],['rooP',['P2'],'#a05a4d'],['pigD',['P3'],'#8a6a5a'],
 ['medZ',['P4'],'#b8902e'],['pigB',['P6'],'#c07a80'],['matQ',['Q0','Q7'],'#7e6c5a'],['balQ',['Q1'],'#99663a'],
 ['rooQ',['Q2','Q9'],'#a06553'],['drQ',['Q3','Q5'],'#756d5c'],['faceQ',['Q4'],'#8e6959'],['rooH',['Q6'],'#b5503a']
].forEach(([id,fr,c])=>{
  const an=/^mat|^fam|^pigM/.test(id)?'sway':/^bal/.test(id)?'tilt':/^roo/.test(id)?'hop':/^dr|^pigD/.test(id)?'wobble':'breathe';
  addChar(id,fr.map(TIMG),c,an);
});
const GEM_COL=['#9aa1a7','#e0352b','#8a8466','#d9b24a','#c42a22','#a59680'];
for(let i=0;i<6;i++)addChar('g'+i,['img/gem-'+i+'.webp'],GEM_COL[i],i===4?'tilt':'breathe');

const SETS=[
  {name:'Совкове барахло',k:['g0','g1','g2','g3','g4','g5']},
  {name:'Матрьошкин балаган',k:['matA','balA','rooA','drB','g1','g4']},
  {name:'Скажений оркестр',k:['matD','balD','rooB','drC','g2','g3']},
  {name:'Свиняча орда',k:['pigM','balZ','rooP','pigD','medZ','pigB']},
  {name:'Болотяна нечисть',k:['famE','balE','rooE','drE','g4','rooH']}
];
const MIX={mat:['matA','matB','matD','matC','famE','matQ','pigM'],bal:['balA','balD','balB','balE','balZ','balQ'],
  roo:['rooA','rooB','rooD','rooE','rooP','rooQ','rooH'],dr:['drB','drC','drD','drE','pigD','drQ'],
  ext:['g0','g1','g2','g3','g4','g5','medZ','pigB','faceQ']};
const tsSeed=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const tsShuffle=(a,r)=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const preloaded=new Set();
let setShown='';
const BASE_COL=COLORS.slice(), BASE_PAL=PAL.map(p=>p.slice());

/* ---------- bonus levels «Ворожий балаган»: the sticker pack lives only here ---------- */
const BONUS_N=10, BONUS_BASE=100;
const isBonus=n=>n>BONUS_BASE&&n<=BONUS_BASE+BONUS_N;
/* each chapter hides two bonus stops: after its 7th and 11th level */
const bonusGate=k=>Math.floor((k-1)/2)*PER+((k-1)%2?11:7);
const bonusOpen=k=>!!S.stars[bonusGate(k)];
function bonusSet(k){
  const r=tsSeed(k*7919+5);
  if(k%5===0){
    const pick=a=>a[Math.floor(r()*a.length)], ext=tsShuffle(MIX.ext,r);
    return {name:'Змішаний наступ',k:tsShuffle([pick(MIX.mat),pick(MIX.bal),pick(MIX.roo),pick(MIX.dr)],r).concat(ext.slice(0,2))};
  }
  const s=SETS[1+((k-1)%5)%4];
  return {name:s.name,k:k<=4?s.k.slice():tsShuffle(s.k,r)};
}
function bonusDef(k){
  const d=levelDef(bonusGate(k)-1);
  /* a friendlier, bigger-reward board: no timer, a few spare moves */
  Object.assign(d,{n:BONUS_BASE+k,bonus:k,time:0,hard:0,kinds:k>=6?6:5,moves:d.moves+4});
  /* always hunt the stickers themselves: one kind to collect, two on later stops */
  const R=tsSeed(k*131+9), k1=Math.floor(R()*4), k2=(k1+1+Math.floor(R()*3))%4;
  d.collect=[[k1,10+k]]; if(k>=4)d.collect.push([k2,8+k]);
  d.moves=Math.max(d.moves+(k>=4?3:1),18+k);
  return d;
}
function useSet(def){
  if(!def.bonus){
    TILESET=null; COLORS.splice(0,6,...BASE_COL); PAL.splice(0,6,...BASE_PAL.map(p=>p.slice()));
    $('gameScreen').classList.remove('bonusLv'); return;
  }
  const s=bonusSet(def.bonus);
  TILESET=s.k.map(id=>CHARS[id]);
  COLORS.splice(0,6,...TILESET.map(c=>c.c));
  PAL.splice(0,6,...TILESET.map(c=>[c.c,c.c]));
  TILESET.forEach(c=>c.f.forEach(u=>{if(!preloaded.has(u)){preloaded.add(u);const im=new Image();im.src=u;}}));
  const gs=$('gameScreen'); gs.classList.add('bonusLv'); gs.dataset.set=s.name;
  /* show the enemy line-up once the level intro card is closed */
  let tries=0; const lv=def.n, go=()=>{if(level!==lv||$('gameScreen').hidden)return;
    if($('overlay').classList.contains('on')&&tries++<200){setTimeout(go,300);return;} enemyBanner(s,def.kinds||6);};
  setTimeout(go,calm?0:450);
}
function enemyBanner(s,kinds){
  const gs=$('gameScreen'); if(!gs||gs.hidden)return;
  gs.querySelectorAll('.enemyBan').forEach(e=>e.remove());
  const b=h('div','enemyBan'), t=h('b'); t.textContent='Ворог: '+s.name; b.appendChild(t);
  const row=h('div','enemyRow');
  TILESET.slice(0,kinds).forEach((c,j)=>{const i=h('i');bg(i,c.f[0]);i.style.setProperty('--j',j);i.dataset.an=c.an;row.appendChild(i);});
  b.appendChild(row); gs.appendChild(b);
  setTimeout(()=>b.classList.add('out'),2300); setTimeout(()=>b.remove(),2900);
}

/* ---------- faces ---------- */
function charOf(t){return(!t||t.sp||t.kind<0||!TILESET)?null:TILESET[t.kind];}
function mug(t,j,ms){
  const c=charOf(t); if(!c||c.f.length<2)return;
  bg(t.el.firstChild,c.f[Math.min(j,c.f.length-1)]); t.mugged=true;
  t.el.classList.remove('mug'); void t.el.offsetWidth; t.el.classList.add('mug');
  clearTimeout(t.mugT); if(ms)t.mugT=setTimeout(()=>unmug(t),ms);
}
function unmug(t){
  clearTimeout(t.mugT); if(!t.mugged)return; t.mugged=false; t.el.classList.remove('mug');
  if(t.el.isConnected&&!t.el.classList.contains('pop'))paint(t);
}
function lastFace(t){const c=charOf(t); if(c&&c.f.length>1){clearTimeout(t.mugT);bg(t.el.firstChild,c.f[c.f.length-1]);}}
/* every moment a couple of pieces on the board pull a face */
setInterval(()=>{
  if(!running||calm||document.hidden||!TILESET||$('gameScreen').hidden)return;
  const ts=[]; each(t=>{const c=charOf(t);if(c&&c.f.length>1&&!t.mugged&&t!==sel&&!t.el.classList.contains('pop'))ts.push(t);});
  for(let k=0;k<2&&ts.length;k++){
    const t=ts.splice(Math.floor(Math.random()*ts.length),1)[0], n=charOf(t).f.length;
    mug(t,1+Math.floor(Math.random()*(n-1)),1100+Math.random()*900);
  }
},700);
