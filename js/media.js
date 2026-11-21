/* Background music (built-in generated tracks or the player's own files), start-up intro and own mascot.
   Big files (music, video, mascot pictures) live in IndexedDB, which holds far more than localStorage. */

/* ---------- storage ---------- */
let idb=null;
function db(){
  if(idb)return idb;
  idb=new Promise((ok,no)=>{
    try{
      const r=indexedDB.open('kaminci-media',1);
      r.onupgradeneeded=()=>r.result.createObjectStore('files');
      r.onsuccess=()=>ok(r.result); r.onerror=()=>no(r.error);
    }catch(e){no(e);}
  });
  return idb;
}
async function mPut(k,v){const d=await db();return new Promise((ok,no)=>{const t=d.transaction('files','readwrite');t.objectStore('files').put(v,k);t.oncomplete=()=>ok();t.onerror=()=>no(t.error);});}
async function mGet(k){const d=await db();return new Promise((ok,no)=>{const r=d.transaction('files').objectStore('files').get(k);r.onsuccess=()=>ok(r.result||null);r.onerror=()=>no(r.error);});}
async function mDel(k){const d=await db();return new Promise((ok)=>{const t=d.transaction('files','readwrite');t.objectStore('files').delete(k);t.oncomplete=()=>ok();t.onerror=()=>ok();});}
const mediaNote=(id,t)=>{const e=$(id);if(e)e.textContent=t;};

/* ---------- built-in music: a small generative band, one tune per chapter ---------- */
const SCALES={major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10],dorian:[0,2,3,5,7,9,10]};
const SONGS={
  intro:{bpm:76,root:57,sc:'minor',prog:[0,5,2,6],arp:'triangle',lead:'brass',drums:0,echo:1,seed:7},
  menu:{bpm:108,root:58,sc:'major',prog:[0,3,4,0],arp:'triangle',lead:'brass',drums:1,march:1,seed:13},
  ch0:{bpm:112,root:60,sc:'major',prog:[0,4,5,3],arp:'triangle',lead:'brass',drums:1,march:1,seed:21},
  ch1:{bpm:92,root:57,sc:'dorian',prog:[0,3,6,4],arp:'sine',lead:'triangle',drums:1,seed:32},
  ch2:{bpm:84,root:62,sc:'minor',prog:[0,5,2,6],arp:'sine',lead:'brass',drums:0,echo:1,seed:43},
  ch3:{bpm:76,root:50,sc:'minor',prog:[0,5,3,4],arp:'triangle',lead:'sine',drums:0,echo:1,seed:54},
  ch4:{bpm:100,root:65,sc:'major',prog:[0,3,4,0],arp:'triangle',lead:'triangle',drums:1,march:1,seed:65},
  ch5:{bpm:88,root:55,sc:'dorian',prog:[0,6,3,4],arp:'square',lead:'triangle',drums:1,seed:76},
  ch6:{bpm:120,root:57,sc:'minor',prog:[0,5,6,4],arp:'triangle',lead:'brass',drums:2,march:2,seed:87},
  rush:{bpm:140,root:60,sc:'major',prog:[0,4,5,3],arp:'square',lead:'brass',drums:2,march:2,seed:98}
};
const midi=n=>440*Math.pow(2,(n-69)/12);
let mac=null, mOut=null, mEcho=null, mNoise=null, song=null, songName='', mStep=0, mNext=0, mTimer=0, melody=[];
function musicCtx(){
  if(mac)return mac;
  try{
    mac=new (window.AudioContext||window.webkitAudioContext)();
    const comp=mac.createDynamicsCompressor(); comp.connect(mac.destination);
    mOut=mac.createGain(); mOut.gain.value=0; mOut.connect(comp);
    mEcho=mac.createDelay(1); mEcho.delayTime.value=.33;
    const fb=mac.createGain(); fb.gain.value=.32; const wet=mac.createGain(); wet.gain.value=.35;
    mEcho.connect(fb); fb.connect(mEcho); mEcho.connect(wet); wet.connect(mOut);
    const n=mac.sampleRate*.3; mNoise=mac.createBuffer(1,n,mac.sampleRate);
    const d=mNoise.getChannelData(0); for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
  }catch(e){mac=null;}
  return mac;
}
function degNote(sg,deg,oct){
  const s=SCALES[sg.sc], i=((deg%7)+7)%7, o=Math.floor(deg/7);
  return sg.root+s[i]+12*(o+(oct||0));
}
function makeMelody(sg){
  /* an 8-bar phrase that repeats, so the tune is recognisable */
  const R=rng(sg.seed), out=[]; let deg=4;
  const rhythm=[0,3,6,8,10,12,14];
  for(let bar=0;bar<8;bar++){
    const ch=sg.prog[bar%sg.prog.length];
    for(const st of rhythm){
      if(R()<.42)continue;
      const tones=[ch,ch+2,ch+4,ch+7];
      deg=R()<.6?tones[Math.floor(R()*tones.length)]:deg+(R()<.5?1:-1);
      deg=Math.max(-2,Math.min(11,deg));
      out.push({step:bar*16+st,deg,len:R()<.3?4:2});
    }
  }
  return out;
}
function voice(type,freq,t,dur,vol,dest,attack){
  const o=mac.createOscillator(), g=mac.createGain();
  o.type=type; o.frequency.setValueAtTime(freq,t);
  g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(vol,t+(attack||.01));
  g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g); g.connect(dest||mOut); o.start(t); o.stop(t+dur+.05);
  return g;
}
function brass(freq,t,dur,vol){
  const f=mac.createBiquadFilter(), g=mac.createGain();
  f.type='lowpass'; f.Q.value=2;
  f.frequency.setValueAtTime(500,t); f.frequency.linearRampToValueAtTime(2400,t+.06); f.frequency.exponentialRampToValueAtTime(900,t+dur);
  g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(vol,t+.04); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  f.connect(g); g.connect(mOut);
  [-6,6].forEach(c=>{const o=mac.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(freq,t);o.detune.value=c;o.connect(f);o.start(t);o.stop(t+dur+.05);});
  return g;
}
function snare(t,vol){
  const src=mac.createBufferSource(), f=mac.createBiquadFilter(), g=mac.createGain();
  src.buffer=mNoise; f.type='bandpass'; f.frequency.value=1700; f.Q.value=.8;
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.0001,t+.13);
  src.connect(f); f.connect(g); g.connect(mOut); src.start(t); src.stop(t+.15);
}
function playStep(t){
  const sg=song, bar=Math.floor(mStep/16)%8, st=mStep%16, beat=60/sg.bpm, s16=beat/4;
  const ch=sg.prog[bar%sg.prog.length];
  if(st===0){
    [0,2,4].forEach(k=>{
      const g=voice('triangle',midi(degNote(sg,ch+k,-1)),t,beat*4.2,.05,null,.35);
      if(sg.echo)g.connect(mEcho);
    });
    voice('sine',midi(degNote(sg,ch,-2)),t,beat*1.8,.16);
  }
  if(st===8)voice('sine',midi(degNote(sg,ch,-2)),t,beat*1.6,.13);
  if(st%2===0){
    const pat=[0,2,4,7,4,2,0,4], k=pat[(st/2)%8];
    const g=voice(sg.arp,midi(degNote(sg,ch+k,0)),t,s16*1.8,sg.arp==='sawtooth'||sg.arp==='square'?.022:.045);
    if(sg.echo)g.connect(mEcho);
  }
  const m=melody.find(x=>x.step===(mStep%128));
  if(m){
    const g=sg.lead==='brass'?brass(midi(degNote(sg,m.deg,0)),t,s16*m.len*1.2,.05):voice(sg.lead,midi(degNote(sg,m.deg,1)),t,s16*m.len*1.1,sg.lead==='square'?.03:.06,null,.02);
    if(sg.echo||sg.lead==='sine')g.connect(mEcho);
  }
  if(sg.march){
    if(st===4||st===12)snare(t,.15);
    if((sg.march>1||bar%4===3)&&(st===14||st===15))snare(t,.07);
    if(sg.march>1&&st===13)snare(t,.05);
  }
  if(sg.drums){
    if(st===0||st===8||(sg.drums>1&&(st===4||st===12))){
      const o=mac.createOscillator(), g=mac.createGain();
      o.frequency.setValueAtTime(130,t); o.frequency.exponentialRampToValueAtTime(42,t+.12);
      g.gain.setValueAtTime(.32,t); g.gain.exponentialRampToValueAtTime(.0001,t+.2);
      o.connect(g); g.connect(mOut); o.start(t); o.stop(t+.22);
    }
    if(st%4===2||(sg.drums>1&&st%2===1)){
      const src=mac.createBufferSource(), f=mac.createBiquadFilter(), g=mac.createGain();
      src.buffer=mNoise; f.type='highpass'; f.frequency.value=7000;
      g.gain.setValueAtTime(.05,t); g.gain.exponentialRampToValueAtTime(.0001,t+.05);
      src.connect(f); f.connect(g); g.connect(mOut); src.start(t); src.stop(t+.06);
    }
    if(st===12&&sg.drums>0){
      const src=mac.createBufferSource(), f=mac.createBiquadFilter(), g=mac.createGain();
      src.buffer=mNoise; f.type='bandpass'; f.frequency.value=1800;
      g.gain.setValueAtTime(.1,t); g.gain.exponentialRampToValueAtTime(.0001,t+.12);
      src.connect(f); f.connect(g); g.connect(mOut); src.start(t); src.stop(t+.14);
    }
  }
}
function schedule(){
  if(!mac||!song)return;
  while(mNext<mac.currentTime+.15){playStep(mNext);mNext+=60/song.bpm/4;mStep++;}
}
function setSong(name){
  if(!SONGS[name])name='menu';
  if(name===songName)return;
  songName=name;
  if(!mac)return;
  const t=mac.currentTime;
  mOut.gain.cancelScheduledValues(t); mOut.gain.setValueAtTime(mOut.gain.value,t); mOut.gain.linearRampToValueAtTime(0,t+.35);
  setTimeout(()=>{
    song=SONGS[songName]; melody=makeMelody(song); mStep=0; mNext=mac.currentTime+.05;
    const v=(S.mvol??.5)*.55, t2=mac.currentTime;
    mOut.gain.cancelScheduledValues(t2); mOut.gain.setValueAtTime(0,t2); mOut.gain.linearRampToValueAtTime(v,t2+1);
  },380);
}

/* ---------- own music ---------- */
const player=new Audio(); player.preload='auto';
let ownUrl=null, ownIdx=-1;
async function playOwn(next){
  const list=S.tracks||[]; if(!list.length)return;
  ownIdx=next?(ownIdx+1)%list.length:Math.floor(Math.random()*list.length);
  try{
    const blob=await mGet('track:'+list[ownIdx].id); if(!blob)return;
    if(ownUrl)URL.revokeObjectURL(ownUrl);
    ownUrl=URL.createObjectURL(blob); player.src=ownUrl; player.volume=S.mvol??.5;
    await player.play();
  }catch(e){}
}
player.addEventListener('ended',()=>{if((S.music||'main')==='own')playOwn(true);});
const MAIN_SRC='audio/main.mp3';
function playMain(){
  if(!player.src||!player.src.endsWith(MAIN_SRC)){player.src=MAIN_SRC;player.loop=true;}
  player.volume=S.mvol??.5;
  if(player.paused)player.play().catch(()=>{});
}

/* ---------- which music plays where ---------- */
let musicReady=false, scene='menu';
function musicScene(name){
  scene=name;
  if(!musicReady)return;
  const mode=S.music||'main';
  if(mode!=='main'&&player.src&&player.src.endsWith(MAIN_SRC)){player.pause();player.removeAttribute('src');player.loop=false;}
  if(mode==='main'&&!document.hidden){if(mac)mac.suspend();playMain();return;}
  if(mode==='built'&&!document.hidden){
    if(!musicCtx())return;
    if(mac.state==='suspended')mac.resume();
    if(!mTimer)mTimer=setInterval(schedule,40);
    if(!song){song=SONGS[name]||SONGS.menu;songName='';}
    setSong(name);
  }else if(mac){mac.suspend();}
  if(mode==='own'&&!document.hidden){if(player.paused){if(player.src)player.play().catch(()=>{});else playOwn(false);}}
  else player.pause();
}
function startMusic(){
  if(musicReady)return;
  musicReady=true; musicScene(scene);
}
document.addEventListener('pointerdown',startMusic,{once:true});
document.addEventListener('keydown',startMusic,{once:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(mac)mac.suspend();player.pause();}else musicScene(scene);});
function sceneFor(name){return name==='game'&&def?(def.rush?'rush':'ch'+def.ch):'menu';}

/* ---------- intro: a short animated story, then the title ---------- */
let introVideo=null, scIdx=0, scTimer=0, seq=[], seqPos=0;
const SCN=6, SC_TIME=[5200,6500,6500,7000,7000,0];
function hideIntro(){
  clearTimeout(scTimer);
  const v=$('introVideo'); v.pause(); v.removeAttribute('src'); v.load();
  if(introVideo){URL.revokeObjectURL(introVideo);introVideo=null;}
  $('intro').classList.remove('on','vid');
  musicScene(!$('gameScreen').hidden?sceneFor('game'):'menu');
}
function goScene(i){
  scIdx=i;
  document.querySelectorAll('#intro .scn').forEach((s,k)=>s.classList.toggle('on',k===i));
  document.querySelectorAll('#introDots i').forEach((d,k)=>d.classList.toggle('on',k===i));
  $('introDots').hidden=i===0;
}
function goStep(p){
  seqPos=p; clearTimeout(scTimer); goScene(seq[p]);
  const last=p>=seq.length-1;
  $('introSkip').hidden=last;
  if(!last)scTimer=setTimeout(()=>goStep(p+1),SC_TIME[seq[p]]);
}
function showIntro(force){
  if(S.intro===false&&!force)return;
  [['rinoE','proud'],['rinoA','thumb'],['rinoB','sad'],['rinoC','salute'],['rinoD','flex']].forEach(([id,k])=>{$(id).innerHTML='<img alt="" src="'+BUDDY[k]+'">';});
  $('intro').classList.add('on');
  musicScene('intro');
  seq=force||!S.introSeen?[0,1,2,3,4,5]:[0,5];
  goStep(0);
  if(!S.introSeen){S.introSeen=true;save();}
}
$('intro').addEventListener('click',async e=>{
  if(e.target.closest('#introSkip'))return;
  if($('intro').classList.contains('vid'))return;
  startMusic();
  if(seqPos<seq.length-1){goStep(seqPos+1);return;}
  let blob=null; try{blob=await mGet('intro');}catch(err){}
  if(!blob){hideIntro();return;}
  introVideo=URL.createObjectURL(blob);
  const v=$('introVideo'); v.src=introVideo; v.muted=false;
  $('intro').classList.add('vid'); $('introSkip').hidden=false;
  if(mac)mac.suspend(); player.pause();
  v.onended=hideIntro;
  v.play().catch(()=>{v.muted=true;v.play().catch(()=>{});});
});
$('introSkip').onclick=e=>{
  e.stopPropagation();
  if($('intro').classList.contains('vid')){hideIntro();return;}
  startMusic(); goStep(seq.length-1);
};
$('replayIntro').onclick=()=>{$('settings').classList.remove('on');showIntro(true);};

/* ---------- own mascot ---------- */
const BUDDY_DEF={ok:BUDDY.ok,wow:BUDDY.wow,sad:BUDDY.sad};
const MASCOT_SLOTS=[['ok','Звичайний'],['wow','Радіє'],['sad','Сумує']];
let mascotUrls={};
async function loadMascot(){
  for(const [k] of MASCOT_SLOTS){
    try{const b=await mGet('mascot-'+k);if(b){if(mascotUrls[k])URL.revokeObjectURL(mascotUrls[k]);mascotUrls[k]=URL.createObjectURL(b);}else delete mascotUrls[k];}catch(e){}
  }
  BUDDY.ok=mascotUrls.ok||BUDDY_DEF.ok;
  BUDDY.wow=mascotUrls.wow||mascotUrls.ok||BUDDY_DEF.wow;
  BUDDY.sad=mascotUrls.sad||mascotUrls.ok||BUDDY_DEF.sad;
  document.documentElement.classList.toggle('ownMascot',!!mascotUrls.ok);
  drawMascotSlots();
  if(!$('homeScreen').hidden)drawHome();
  if(!$('mapScreen').hidden)drawMap();
  if(!$('gameScreen').hidden)bg($('buddy'),BUDDY.ok);
}
function drawMascotSlots(){
  const box=$('mascotSlots'); if(!box)return; box.textContent='';
  MASCOT_SLOTS.forEach(([k,label])=>{
    const w=h('div','mslot'), b=h('button','mpic'); b.type='button';
    b.setAttribute('aria-label','Обрати картинку: '+label); bg(b,BUDDY[k]);
    b.onclick=()=>{mascotSlot=k;$('mascotFile').click();};
    w.appendChild(b); w.appendChild(h('span','',label)); box.appendChild(w);
  });
  $('mascotName').value=S.mname||'Кремінчик';
}
let mascotSlot='ok';
async function shrinkPicture(file,max){
  /* animated GIF, WebP and APNG stay as they are so the character keeps moving */
  if(/gif|webp|apng/.test(file.type)&&file.size<3e6)return file;
  const url=URL.createObjectURL(file), img=new Image();
  await new Promise((ok,no)=>{img.onload=ok;img.onerror=no;img.src=url;});
  URL.revokeObjectURL(url);
  const k=Math.min(1,max/Math.max(img.width,img.height)), cv=document.createElement('canvas');
  cv.width=Math.round(img.width*k); cv.height=Math.round(img.height*k);
  cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
  return new Promise(ok=>cv.toBlob(ok,'image/png'));
}
$('mascotFile').addEventListener('change',async e=>{
  const f=e.target.files[0]; e.target.value=''; if(!f)return;
  try{const b=await shrinkPicture(f,384);await mPut('mascot-'+mascotSlot,b);mediaNote('mascotMsg','Персонажа оновлено.');await loadMascot();}
  catch(err){mediaNote('mascotMsg','Не вдалося зберегти цю картинку. Спробуйте PNG або JPG.');}
});
$('mascotReset').onclick=async()=>{for(const [k] of MASCOT_SLOTS)await mDel('mascot-'+k);mediaNote('mascotMsg','Повернуто Кремінчика.');S.mname='Кремінчик';save();await loadMascot();};
$('mascotName').addEventListener('change',()=>{S.mname=$('mascotName').value.trim().slice(0,20)||'Кремінчик';save();});

/* ---------- settings: music ---------- */
function drawMusic(){
  const box=$('musicModes'); box.textContent='';
  [['main','Головна тема'],['built','Марші'],['own','Моя музика'],['off','Вимкнено']].forEach(([k,label])=>{
    const b=h('button','ambOpt'+((S.music||'main')===k?' on':''),label); b.type='button';
    b.setAttribute('aria-pressed',(S.music||'main')===k?'true':'false');
    b.onclick=()=>{S.music=k;save();drawMusic();startMusic();musicScene(scene);};
    box.appendChild(b);
  });
  const list=$('trackList'); list.textContent='';
  (S.tracks||[]).forEach((t,i)=>{
    const li=h('li'), x=h('button','','✕'); x.type='button'; x.setAttribute('aria-label','Прибрати '+t.name);
    x.onclick=async()=>{await mDel('track:'+t.id);S.tracks.splice(i,1);save();if(ownIdx===i){player.pause();player.removeAttribute('src');}drawMusic();};
    li.appendChild(h('span','',t.name)); li.appendChild(x); list.appendChild(li);
  });
  $('trackHint').textContent=(S.tracks||[]).length?'Треки грають по черзі.':'Своїх треків ще немає.';
  $('mvol').value=Math.round((S.mvol??.5)*100);
}
$('trackAdd').onclick=()=>$('trackFile').click();
$('trackFile').addEventListener('change',async e=>{
  const files=[...e.target.files]; e.target.value='';
  S.tracks=S.tracks||[]; let added=0;
  for(const f of files){
    if(!/^audio\//.test(f.type)&&!/\.(mp3|ogg|m4a|wav|aac|opus)$/i.test(f.name))continue;
    const id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
    try{await mPut('track:'+id,f);S.tracks.push({id,name:f.name.replace(/\.[^.]+$/,'').slice(0,40)});added++;}
    catch(err){mediaNote('musicMsg','Не вистачило місця в браузері для «'+f.name+'».');break;}
  }
  if(added){S.music='own';save();mediaNote('musicMsg','Додано треків: '+added+'.');startMusic();player.pause();player.removeAttribute('src');player.loop=false;musicScene(scene);}
  drawMusic();
});
$('mvol').addEventListener('input',()=>{
  S.mvol=$('mvol').value/100; save(); player.volume=S.mvol;
  if(mac&&mOut){const t=mac.currentTime;mOut.gain.cancelScheduledValues(t);mOut.gain.setValueAtTime(S.mvol*.55,t);}
});

/* ---------- settings: intro ---------- */
async function drawIntroSet(){
  $('introT').checked=S.intro!==false;
  let has=false; try{has=!!(await mGet('intro'));}catch(e){}
  $('introClear').disabled=!has;
  $('introState').textContent=has?'Своє відео заставки додано. Воно грає після дотику до заставки.':'Зараз вбудована анімована заставка.';
}
$('introT').addEventListener('change',()=>{S.intro=$('introT').checked;save();});
$('introPick').onclick=()=>$('introFile').click();
$('introFile').addEventListener('change',async e=>{
  const f=e.target.files[0]; e.target.value=''; if(!f)return;
  if(!/^video\//.test(f.type)){mediaNote('introMsg','Це не відеофайл. Оберіть MP4 або WebM.');return;}
  try{await mPut('intro',f);mediaNote('introMsg','Відео заставки збережено.');}
  catch(err){mediaNote('introMsg','Відео завелике для збереження в браузері. Оберіть коротше або менше.');}
  drawIntroSet();
});
$('introClear').onclick=async()=>{await mDel('intro');mediaNote('introMsg','Відео прибрано.');drawIntroSet();};
$('introPlay').onclick=()=>{$('settings').classList.remove('on');showIntro(true);};

['gear','gear2'].forEach(id=>$(id).addEventListener('click',()=>{drawMusic();drawIntroSet();drawMascotSlots();}));
drawMusic(); drawIntroSet();
loadMascot().then(()=>showIntro(false)).catch(()=>showIntro(false));
