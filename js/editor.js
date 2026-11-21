/* Game editor: game name, story texts, own pictures for bonuses and obstacles, backgrounds per chapter and per level.
   Pictures live in IndexedDB (see media.js); texts live in the saved progress S. */

/* ---------- pictures for bonuses and obstacles ---------- */
const ART_SLOTS=[
  {k:'pin',grp:'bonus',name:'Юла',get:()=>SP.pin,set:u=>{SP.pin=u;}},
  {k:'row',grp:'bonus',name:'Стріла в ряд',get:()=>SP.row,set:u=>{SP.row=u;}},
  {k:'col',grp:'bonus',name:'Стріла в стовпчик',get:()=>SP.col,set:u=>{SP.col=u;}},
  {k:'bomb',grp:'bonus',name:'Бомба',get:()=>SP.bomb,set:u=>{SP.bomb=u;}},
  {k:'rainbow',grp:'bonus',name:'Веселка',get:()=>SP.rainbow,set:u=>{SP.rainbow=u;}},
  {k:'ice',grp:'block',name:'Лід',get:()=>ICE,set:u=>{ICE=u;}},
  {k:'ice2',grp:'block',name:'Товстий лід',get:()=>ICE2,set:u=>{ICE2=u;}},
  {k:'crate',grp:'block',name:'Ящик',get:()=>SP.crate,set:u=>{SP.crate=u;}},
  {k:'crate2',grp:'block',name:'Окутий ящик',get:()=>SP.crate2,set:u=>{SP.crate2=u;}},
  {k:'rock',grp:'block',name:'Скеля',get:()=>SP.rock,set:u=>{SP.rock=u;}},
  {k:'mud',grp:'block',name:'Багно',get:()=>SP.mud,set:u=>{SP.mud=u;}},
  {k:'gem',grp:'block',name:'Самоцвіт',get:()=>SP.gem,set:u=>{SP.gem=u;}},
  {k:'fog',grp:'block',name:'Туман',get:()=>FOG,set:u=>{FOG=u;}},
  {k:'moss',grp:'block',name:'Мох',get:()=>MOSS,set:u=>{MOSS=u;}},
  {k:'frost',grp:'block',name:'Крига',get:()=>FROST,set:u=>{FROST=u;}},
  {k:'amber',grp:'block',name:'Бурштин',get:()=>AMBER,set:u=>{AMBER=u;}},
  {k:'ember',grp:'block',name:'Жарина',get:()=>EMBER,set:u=>{EMBER=u;}},
  {k:'chest',grp:'block',name:'Скриня нагород',get:()=>CHEST,set:u=>{CHEST=u;}}
];
const ART_DEF={}; ART_SLOTS.forEach(s=>{ART_DEF[s.k]=s.get();});
const artUrls={};
const GOAL_ART={ice:'ice',crate:'crate',rock:'rock',mud:'mud',gem:'gem',fog:'fog',amber:'amber',ember:'ember'};

function applyArt(){
  ART_SLOTS.forEach(s=>s.set(artUrls[s.k]||ART_DEF[s.k]));
  const root=document.documentElement.style, cls=document.documentElement.classList;
  root.setProperty('--ice-img','url("'+ICE+'")'); root.setProperty('--ice2-img','url("'+ICE2+'")'); root.setProperty('--fog-img','url("'+FOG+'")');
  root.setProperty('--moss-img','url("'+MOSS+'")'); root.setProperty('--frost-img','url("'+FROST+'")'); root.setProperty('--amber-img','url("'+AMBER+'")');
  cls.toggle('ownMoss',!!artUrls.moss); cls.toggle('ownFrost',!!artUrls.frost); cls.toggle('ownAmber',!!artUrls.amber);
  [['rPin',SP.pin],['rRow',SP.row],['rBomb',SP.bomb],['rRain',SP.rainbow],['rIce',ICE],['rCrate',SP.crate2],['rMoss',MOSS],['rGem',SP.gem],['rMud',SP.mud],['rEmber',EMBER],['rRock',SP.rock],['rFog',FOG],['rAmber',AMBER],['rFrost',FROST],['rowhitI',SP.row],['colhitI',SP.col]]
    .forEach(([id,u])=>{const e=$(id);if(e)bg(e,u);});
  /* goals keep their picture, so refresh them for a level in progress */
  if(def&&goals){
    for(const [k,a] of Object.entries(GOAL_ART))if(goals[k])goals[k].img=ART_SLOTS.find(s=>s.k===a).get();
    if(goals.moss)goals.moss.img=def.frost?FROST:MOSS;
    if(goals.crate)goals.crate.img=SP.crate;
  }
  if(!$('gameScreen').hidden){each(paint);hud();}
  if(!$('homeScreen').hidden)drawHome();
  if(!$('mapScreen').hidden)drawMap();
}
async function loadArt(){
  for(const s of ART_SLOTS){
    try{const b=await mGet('art-'+s.k);if(artUrls[s.k])URL.revokeObjectURL(artUrls[s.k]);if(b)artUrls[s.k]=URL.createObjectURL(b);else delete artUrls[s.k];}catch(e){}
  }
  applyArt(); drawArtSlots();
}
let artPick=null;
function drawArtSlots(){
  for(const grp of ['bonus','block']){
    const box=$(grp==='bonus'?'edBonus':'edBlock'); if(!box)continue; box.textContent='';
    ART_SLOTS.filter(s=>s.grp===grp).forEach(s=>{
      const w=h('div','mslot'), b=h('button','mpic'+(artUrls[s.k]?' set':'')); b.type='button';
      b.setAttribute('aria-label','Обрати картинку: '+s.name); bg(b,s.get());
      b.onclick=()=>{artPick=s.k;$('artFile').click();};
      w.appendChild(b); w.appendChild(h('span','',s.name));
      if(artUrls[s.k]){const x=h('button','mini','Скинути');x.type='button';x.onclick=async()=>{await mDel('art-'+s.k);await loadArt();};w.appendChild(x);}
      box.appendChild(w);
    });
  }
}
$('artFile').addEventListener('change',async e=>{
  const f=e.target.files[0]; e.target.value=''; if(!f||!artPick)return;
  try{const b=await shrinkPicture(f,256);await mPut('art-'+artPick,b);await loadArt();mediaNote('artMsg','Картинку замінено.');}
  catch(err){mediaNote('artMsg','Не вдалося зберегти цю картинку. Спробуйте PNG або JPG.');}
});
$('artReset').onclick=async()=>{for(const s of ART_SLOTS)await mDel('art-'+s.k);await loadArt();mediaNote('artMsg','Повернуто стандартні бонуси й перешкоди.');};

/* ---------- backgrounds for chapters and single levels ---------- */
const chBg={}, lvBg={};
async function shrinkBg(file){
  const url=URL.createObjectURL(file), img=new Image();
  await new Promise((ok,no)=>{img.onload=ok;img.onerror=no;img.src=url;});
  URL.revokeObjectURL(url);
  const k=Math.min(1,1600/Math.max(img.width,img.height)), cv=document.createElement('canvas');
  cv.width=Math.round(img.width*k); cv.height=Math.round(img.height*k);
  cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
  return new Promise(ok=>cv.toBlob(ok,'image/jpeg',.82));
}
async function loadBgs(){
  for(let i=0;i<CH.length;i++){
    try{const b=await mGet('chbg-'+i);if(chBg[i])URL.revokeObjectURL(chBg[i]);if(b)chBg[i]=URL.createObjectURL(b);else delete chBg[i];}catch(e){}
  }
  for(const n of S.lvbg||[]){
    try{const b=await mGet('lvbg-'+n);if(lvBg[n])URL.revokeObjectURL(lvBg[n]);if(b)lvBg[n]=URL.createObjectURL(b);else delete lvBg[n];}catch(e){}
  }
  drawBgSlots(); applyBg();
  if(!$('mapScreen').hidden)drawMap();
}
/* the picture a level shows: its own, then its chapter's, then none (look.js falls back further) */
function levelBg(){
  if(!def||def.rush)return null;
  return lvBg[level]||chBg[def.ch]||null;
}
function chapterBg(sec,ci){
  if(!chBg[ci])return;
  sec.style.backgroundImage='linear-gradient(rgba(4,14,20,.25),rgba(4,14,20,.6)),url("'+chBg[ci]+'")';
  sec.style.backgroundSize='cover'; sec.style.backgroundPosition='center';
}
let bgPick=null;
function drawBgSlots(){
  const box=$('edChBg'); if(!box)return; box.textContent='';
  CH.forEach((ch,i)=>{
    const w=h('div','mslot'), b=h('button','mpic wide'+(chBg[i]?' set':'')); b.type='button';
    b.setAttribute('aria-label','Фон розділу '+ch.name);
    b.style.backgroundImage=chBg[i]?'url("'+chBg[i]+'")':'linear-gradient('+ch.a+','+ch.b+')';
    b.onclick=()=>{bgPick='ch:'+i;$('edBgFile').click();};
    w.appendChild(b); w.appendChild(h('span','',(i+1)+'. '+ch.name));
    if(chBg[i]){const x=h('button','mini','Скинути');x.type='button';x.onclick=async()=>{await mDel('chbg-'+i);await loadBgs();};w.appendChild(x);}
    box.appendChild(w);
  });
  const list=$('edLvList'); list.textContent='';
  (S.lvbg||[]).slice().sort((a,b)=>a-b).forEach(n=>{
    const li=h('li'), th=h('i','thumb'); if(lvBg[n])th.style.backgroundImage='url("'+lvBg[n]+'")';
    const x=h('button','','✕'); x.type='button'; x.setAttribute('aria-label','Прибрати фон рівня '+n);
    x.onclick=async()=>{await mDel('lvbg-'+n);S.lvbg=S.lvbg.filter(v=>v!==n);save();delete lvBg[n];drawBgSlots();};
    li.appendChild(th); li.appendChild(h('span','','Рівень '+n)); li.appendChild(x); list.appendChild(li);
  });
}
$('edLvPick').onclick=()=>{
  const n=parseInt($('edLvNum').value,10);
  if(!(n>=1&&n<=TOTAL)){mediaNote('bgEdMsg','Вкажіть номер рівня від 1 до '+TOTAL+'.');return;}
  bgPick='lv:'+n; $('edBgFile').click();
};
$('edBgFile').addEventListener('change',async e=>{
  const f=e.target.files[0]; e.target.value=''; if(!f||!bgPick)return;
  try{
    const b=await shrinkBg(f), [kind,num]=bgPick.split(':'), n=+num;
    if(kind==='ch')await mPut('chbg-'+n,b);
    else{await mPut('lvbg-'+n,b);S.lvbg=[...new Set([...(S.lvbg||[]),n])];save();}
    mediaNote('bgEdMsg',kind==='ch'?'Фон розділу «'+CH[n].name+'» встановлено.':'Фон рівня '+n+' встановлено.');
    await loadBgs();
  }catch(err){mediaNote('bgEdMsg','Не вдалося зберегти цю картинку. Спробуйте JPG або PNG.');}
});

/* ---------- name and story ---------- */
const STORY_DEF={title:'РІНО',pro:PROLOGUE,epi:EPILOGUE,ch:CH.map(c=>({name:c.name,gem:c.gem,story:c.story,outro:c.outro}))};
const storyTitle=()=>(S.st&&S.st.title)||STORY_DEF.title;
function applyStory(){
  const st=S.st||{};
  PROLOGUE=st.pro||STORY_DEF.pro; EPILOGUE=st.epi||STORY_DEF.epi;
  CH.forEach((c,i)=>{const o=(st.ch&&st.ch[i])||{},d=STORY_DEF.ch[i];c.name=o.name||d.name;c.gem=o.gem||d.gem;c.story=o.story||d.story;c.outro=o.outro||d.outro;});
}
function applyName(){
  const n=S.gname||'РІНО', sub=S.gsub||'4-та бригада · Народжені бути незламними';
  document.title=n;
  document.querySelectorAll('.logo,.introLogo').forEach(e=>{e.textContent=n;});
  const s=document.querySelector('.introSub'); if(s)s.textContent=sub;
}
function field(label,id,val,area,ph){
  const l=h('label','rng'); l.setAttribute('for',id); l.appendChild(document.createTextNode(label));
  const i=document.createElement(area?'textarea':'input'); i.id=id; i.value=val||''; if(!area){i.type='text';i.maxLength=40;} else i.rows=3;
  if(ph)i.placeholder=ph;
  l.appendChild(i); return l;
}
function drawStory(){
  const box=$('edStory'); box.textContent='';
  const st=S.st||{};
  box.appendChild(field('Заголовок історії','stTitleEd',st.title,false,STORY_DEF.title));
  box.appendChild(field('Пролог (на початку гри)','stPro',st.pro,true,STORY_DEF.pro));
  CH.forEach((c,i)=>{
    const o=(st.ch&&st.ch[i])||{}, d=STORY_DEF.ch[i], g=h('details','chEd');
    g.appendChild(h('summary','',(i+1)+'. '+c.name));
    g.appendChild(field('Назва розділу','chN'+i,o.name,false,d.name));
    g.appendChild(field('Що знаходять у кінці','chG'+i,o.gem,false,d.gem));
    g.appendChild(field('Вступ до розділу','chS'+i,o.story,true,d.story));
    g.appendChild(field('Кінцівка розділу','chO'+i,o.outro,true,d.outro));
    box.appendChild(g);
  });
  box.appendChild(field('Епілог (після останнього рівня)','stEpi',st.epi,true,STORY_DEF.epi));
  box.querySelectorAll('input,textarea').forEach(i=>i.addEventListener('change',saveStory));
}
function saveStory(){
  const v=id=>($(id).value||'').trim();
  S.st={title:v('stTitleEd'),pro:v('stPro'),epi:v('stEpi'),ch:CH.map((c,i)=>({name:v('chN'+i),gem:v('chG'+i),story:v('chS'+i),outro:v('chO'+i)}))};
  save(); applyStory(); mediaNote('storyMsg','Історію збережено.');
}
$('storyReset').onclick=()=>{S.st=null;save();applyStory();drawStory();mediaNote('storyMsg','Повернуто стандартну історію.');};
$('gName').value=S.gname||''; $('gSub').value=S.gsub||'';
$('gName').addEventListener('change',()=>{S.gname=$('gName').value.trim().slice(0,30);save();applyName();});
$('gSub').addEventListener('change',()=>{S.gsub=$('gSub').value.trim().slice(0,60);save();applyName();});

/* ---------- open and navigate the editor ---------- */
function openEditor(){
  $('settings').classList.remove('on');
  drawSlots(); drawArtSlots(); drawBgSlots(); drawStory(); drawMascotSlots(); drawIntroSet(); drawAmbChoices(); drawBgPreview();
  $('bgDim').value=S.dim; $('gName').value=S.gname||''; $('gSub').value=S.gsub||'';
  $('editor').classList.add('on'); $('editor').scrollTop=0;
}
$('editBtn').onclick=openEditor; $('editBtn2').onclick=openEditor;
$('closeEditor').onclick=()=>{$('editor').classList.remove('on');if(!$('homeScreen').hidden)drawHome();if(!$('mapScreen').hidden)drawMap();};
document.querySelectorAll('#edNav button').forEach(b=>b.onclick=()=>{const t=$(b.dataset.to);if(t)t.scrollIntoView({behavior:'smooth',block:'start'});});
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('editor').classList.remove('on');});

applyStory(); applyName(); loadArt(); loadBgs();
