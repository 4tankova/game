/* Military theme for «Пригоди носоріжок»: Rino the rhino, patch-style stones, drones, tanks, grenades,
   military obstacles, ranks instead of amulets. Loaded right after core.js and before everything else. */

/* ---------- stones: sewn-on patches, each with its own silhouette and badge ---------- */
const PATCHES=[
  {p:"M28 8H72Q92 8 92 28V72Q92 92 72 92H28Q8 92 8 72V28Q8 8 28 8Z",c:['#ff9a8f','#e5332a','#8f120c'],h:[30,22],
   icon:"<path d='M42 26H58V42H74V58H58V74H42V58H26V42H42Z' fill='#fff' stroke='#8f120c' stroke-width='2' stroke-linejoin='round'/>"},
  {p:starPath(50,54,47,23),c:['#fff1a0','#f2b51c','#9c6500'],h:[44,34],w:6,
   icon:"<circle cx='50' cy='55' r='9' fill='#fff' opacity='.85'/><circle cx='50' cy='55' r='5' fill='#c98a00'/>"},
  {p:"M8 74Q8 20 50 14Q92 20 92 74Q92 86 80 86H20Q8 86 8 74Z",c:['#c4de95','#5f8f2c','#2c4a10'],h:[32,30],
   icon:"<ellipse cx='30' cy='52' rx='9' ry='6' fill='#2c4a10' opacity='.45'/><ellipse cx='66' cy='38' rx='10' ry='6' fill='#8a7a3a' opacity='.55'/><ellipse cx='70' cy='62' rx='8' ry='5' fill='#2c4a10' opacity='.45'/>"+
        "<path d='M10 72Q50 82 90 72' stroke='#24400c' stroke-width='6' fill='none' stroke-linecap='round'/><path d='"+starPath(50,48,11,5)+"' fill='#fff'/>"},
  {p:"M50 5L89 17V47Q89 79 50 95Q11 79 11 47V17Z",c:['#bfe0ff','#2f7fe0','#123e8a'],h:[36,24],
   icon:"<path d='M30 38L50 54L70 38M30 56L50 72L70 56' stroke='#fff' stroke-width='7' fill='none' stroke-linecap='round' stroke-linejoin='round'/>"},
  {p:"M50 6A44 44 0 1 1 49.9 6Z",c:['#e6ccff','#9150e0','#4a1888'],h:[35,26],
   icon:"<circle cx='50' cy='50' r='26' fill='none' stroke='#fff' stroke-width='3' opacity='.7'/><path d='M50 22L58 50H42Z' fill='#ff5a4e'/><path d='M50 78L58 50H42Z' fill='#fff'/><circle cx='50' cy='50' r='4' fill='#4a1888'/>"},
  {p:"M28 6H72Q88 6 88 22V80Q88 94 72 94H28Q12 94 12 80V22Q12 6 28 6Z",c:['#ffffff','#b8c2cc','#5e6a75'],h:[30,24],
   icon:"<circle cx='50' cy='20' r='6' fill='#3d4750'/><path d='M28 44H72M28 57H62M28 70H68' stroke='#3d4750' stroke-width='5' stroke-linecap='round' opacity='.5'/>"}
];
const patchArt=g=>svg(
  "<defs><linearGradient id='g' x1='0' y1='0' x2='.35' y2='1'><stop offset='0' stop-color='"+g.c[0]+"'/><stop offset='.5' stop-color='"+g.c[1]+"'/><stop offset='1' stop-color='"+g.c[2]+"'/></linearGradient>"+
  "<radialGradient id='h' cx='.5' cy='.4' r='.55'><stop offset='0' stop-color='#fff' stop-opacity='.45'/><stop offset='1' stop-color='#fff' stop-opacity='0'/></radialGradient></defs>"+
  "<path d='"+g.p+"' fill='#000' opacity='.32' transform='translate(0 4)'/>"+
  "<path d='"+g.p+"' fill='url(#g)' stroke='"+g.c[2]+"' stroke-width='"+(g.w||3.5)+"' stroke-linejoin='round'/>"+
  "<path d='"+g.p+"' fill='url(#h)' transform='translate(50 52) scale(.7) translate(-50 -50)'/>"+
  "<path d='"+g.p+"' fill='none' stroke='#fff' stroke-opacity='.6' stroke-width='2.2' stroke-dasharray='5 4' stroke-linejoin='round' transform='translate(50 50) scale(.82) translate(-50 -50)'/>"+
  g.icon+
  "<ellipse cx='"+g.h[0]+"' cy='"+g.h[1]+"' rx='11' ry='5' fill='#fff' opacity='.75' transform='rotate(-28 "+g.h[0]+" "+g.h[1]+")'/>");
/* the board is made of occupier junk that the player smashes: hammer and sickle, red star, helmet,
   propaganda poster, flag, ushanka (pictures from the player's set) */
for(let i=0;i<6;i++)defaults[i]='img/gem-'+i+'.webp';
PAL.splice(0,6,['#c9ced3','#6d747a'],['#ff7a6e','#c8221a'],['#b9b48e','#5f5a3e'],['#f1e4c0','#b39a64'],['#ff8f7a','#a8160f'],['#d8cbb6','#7a6a55']);
COLORS.splice(0,6,'#9aa1a7','#e0352b','#8a8466','#e3d3a6','#c42a22','#a59680');

/* ---------- Rino ---------- */
function rinoMarkup(m,helmet){
  const eye=x=>"<ellipse cx='"+x+"' cy='57' rx='8.5' ry='9.5' fill='#fff'/><circle cx='"+(x+(m==='sad'?-1:1.5))+"' cy='"+(m==='sad'?60:58)+"' r='4.8' fill='#1d2a30'/><circle cx='"+(x+3)+"' cy='55' r='1.8' fill='#fff'/>"+
    "<ellipse cx='"+x+"' cy='57' rx='9.5' ry='0' fill='#a3aeb5'><animate attributeName='ry' values='0;0;10.5;0;0' keyTimes='0;.88;.92;.96;1' dur='4.4s' repeatCount='indefinite'/></ellipse>";
  const mouth=m==='wow'?"<ellipse cx='50' cy='88' rx='5' ry='4.5' fill='#3a1d24'/>"
    :m==='sad'?"<path d='M43 90Q50 85 57 90' stroke='#3a1d24' stroke-width='3' fill='none' stroke-linecap='round'/>"
    :"<path d='M41 86Q50 93 59 86' stroke='#3a1d24' stroke-width='3' fill='none' stroke-linecap='round'/>";
  return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>"+
    "<defs><radialGradient id='rb' cx='.4' cy='.35' r='.75'><stop offset='0' stop-color='#e2e8ec'/><stop offset='.55' stop-color='#a5b0b8'/><stop offset='1' stop-color='#6a7780'/></radialGradient>"+
    "<linearGradient id='hl' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#8a9c55'/><stop offset='.6' stop-color='#566b2c'/><stop offset='1' stop-color='#34421a'/></linearGradient>"+
    "<linearGradient id='hn' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#fffaf0'/><stop offset='1' stop-color='#d6c095'/></linearGradient></defs>"+
    "<ellipse cx='50' cy='97' rx='30' ry='3' fill='#000' opacity='.25'/>"+
    "<ellipse cx='17' cy='40' rx='8' ry='13' transform='rotate(-28 17 40)' fill='#9aa6ae' stroke='#55616a' stroke-width='2.5'/><ellipse cx='17' cy='41' rx='4' ry='7' transform='rotate(-28 17 41)' fill='#e9a4b0'/>"+
    "<ellipse cx='83' cy='40' rx='8' ry='13' transform='rotate(28 83 40)' fill='#9aa6ae' stroke='#55616a' stroke-width='2.5'/><ellipse cx='83' cy='41' rx='4' ry='7' transform='rotate(28 83 41)' fill='#e9a4b0'/>"+
    "<path d='M14 58Q14 28 50 26Q86 28 86 58Q86 94 50 95Q14 94 14 58Z' fill='url(#rb)' stroke='#55616a' stroke-width='3'/>"+
    "<ellipse cx='50' cy='80' rx='25' ry='15' fill='#c4ccd2' stroke='#74818a' stroke-width='2'/>"+
    "<ellipse cx='42' cy='81' rx='3' ry='2.2' fill='#4a555d'/><ellipse cx='58' cy='81' rx='3' ry='2.2' fill='#4a555d'/>"+
    "<path d='M48 52C49 48 51 45 54 43C54 47 54 50 55 53Z' fill='url(#hn)' stroke='#a8916a' stroke-width='1.5'/>"+
    "<path d='M42 71C43 61 48 53 57 47C56 56 57 64 58 71Z' fill='url(#hn)' stroke='#a8916a' stroke-width='2' stroke-linejoin='round'/>"+
    eye(33)+eye(67)+mouth+
    (m==='sad'?"<path d='M29 70Q27 75 30 77Q33 75 31 70Z' fill='#7cc8ff'/>":"")+
    "<ellipse cx='24' cy='72' rx='5' ry='3.5' fill='#ff8fa3' opacity='.55'/><ellipse cx='76' cy='72' rx='5' ry='3.5' fill='#ff8fa3' opacity='.55'/>"+
    (helmet===false?"":"<g class='helm'>"+
      "<path d='M8 46Q8 6 50 4Q92 6 92 46Z' fill='url(#hl)' stroke='#2b3514' stroke-width='3'/>"+
      "<ellipse cx='30' cy='26' rx='9' ry='5' fill='#3e4a20' opacity='.65'/><ellipse cx='62' cy='18' rx='11' ry='5' fill='#8a7a4a' opacity='.6'/><ellipse cx='72' cy='34' rx='8' ry='4' fill='#3e4a20' opacity='.6'/><ellipse cx='46' cy='38' rx='7' ry='3.5' fill='#8a7a4a' opacity='.5'/>"+
      "<path d='M20 26Q30 12 48 10' stroke='#fff' stroke-width='3.5' fill='none' stroke-linecap='round' opacity='.35'/>"+
      "<path d='M4 45Q50 54 96 45L95 50Q50 59 5 50Z' fill='#3f4f1e' stroke='#2b3514' stroke-width='2'/>"+
      "<rect x='43' y='20' width='14' height='12' rx='2' fill='#2f6fd6' stroke='#1d2b0a' stroke-width='1.5'/><rect x='43' y='26' width='14' height='6' fill='#ffd23a'/></g>")+
    "</svg>";
}
const rino=(m,helmet)=>'data:image/svg+xml,'+encodeURIComponent(rinoMarkup(m,helmet));
/* Rino is drawn from the player's sticker set; each mood is its own picture */
const RINO_IMG=n=>'img/rino-'+n+'.webp';
Object.assign(BUDDY,{ok:RINO_IMG('think-anim'),wow:RINO_IMG('fire'),sad:RINO_IMG('ponder-anim'),sweat:RINO_IMG('sweat'),
  salute:RINO_IMG('salute'),flex:RINO_IMG('flex'),thumb:RINO_IMG('thumb'),point:RINO_IMG('point'),proud:RINO_IMG('proud'),cheer:RINO_IMG('cheer-anim')});

/* ---------- helpers: drone, tanks, grenade, salvo ---------- */
const TANK_UP="<defs><linearGradient id='t' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#4c5e26'/><stop offset='.5' stop-color='#7d9444'/><stop offset='1' stop-color='#4c5e26'/></linearGradient></defs>"+
  "<rect x='14' y='22' width='72' height='70' rx='10' fill='#000' opacity='.3'/>"+
  "<rect x='12' y='18' width='18' height='72' rx='6' fill='#2b2f22' stroke='#15180f' stroke-width='2'/><rect x='70' y='18' width='18' height='72' rx='6' fill='#2b2f22' stroke='#15180f' stroke-width='2'/>"+
  [24,34,44,54,64,74,84].map(y=>"<path d='M14 "+y+"H28M72 "+y+"H86' stroke='#55603f' stroke-width='3'/>").join('')+
  "<rect x='24' y='22' width='52' height='64' rx='9' fill='url(#t)' stroke='#2b3514' stroke-width='2.5'/>"+
  "<rect x='45' y='2' width='10' height='46' rx='3' fill='#3f4f1e' stroke='#1d2410' stroke-width='2'/><rect x='43' y='2' width='14' height='7' rx='2' fill='#2b3514'/>"+
  "<circle cx='50' cy='58' r='17' fill='#6a7f36' stroke='#2b3514' stroke-width='2.5'/><circle cx='56' cy='62' r='5' fill='#3f4f1e'/>"+
  "<path d='M38 50Q44 44 52 43' stroke='#fff' stroke-width='3' fill='none' stroke-linecap='round' opacity='.45'/>"+
  "<rect x='28' y='76' width='12' height='6' fill='#2f6fd6'/><rect x='28' y='79' width='12' height='3' fill='#ffd23a'/>";
SP.col=svg(TANK_UP);
SP.row=svg("<g transform='rotate(90 50 50)'>"+TANK_UP+"</g>");
SP.pin=svg("<defs><linearGradient id='b' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#8a9c55'/><stop offset='1' stop-color='#3e4a20'/></linearGradient></defs>"+
  "<ellipse cx='50' cy='56' rx='30' ry='30' fill='#000' opacity='.18'/>"+
  "<path d='M24 24L76 76M76 24L24 76' stroke='#2d333a' stroke-width='8' stroke-linecap='round'/>"+
  [[24,24],[76,24],[24,76],[76,76]].map(([x,y],i)=>"<circle cx='"+x+"' cy='"+y+"' r='16' fill='rgba(210,225,235,.32)' stroke='#9fb0bb' stroke-width='2'/>"+
    "<g><path d='M"+(x-14)+" "+y+"H"+(x+14)+"' stroke='#e8eef2' stroke-width='3' stroke-linecap='round'/><animateTransform attributeName='transform' type='rotate' from='0 "+x+" "+y+"' to='"+(i%2?-360:360)+" "+x+" "+y+"' dur='.25s' repeatCount='indefinite'/></g>"+
    "<circle cx='"+x+"' cy='"+y+"' r='3.5' fill='#2d333a'/>").join('')+
  "<rect x='36' y='36' width='28' height='28' rx='8' fill='url(#b)' stroke='#1d2410' stroke-width='2.5'/>"+
  "<circle cx='50' cy='50' r='5' fill='#ff3b2b'><animate attributeName='opacity' values='1;.2;1' dur='.8s' repeatCount='indefinite'/></circle>");
SP.bomb=svg("<defs><radialGradient id='g' cx='.38' cy='.35' r='.75'><stop offset='0' stop-color='#a3b56a'/><stop offset='.5' stop-color='#56692b'/><stop offset='1' stop-color='#26300f'/></radialGradient></defs>"+
  "<ellipse cx='50' cy='94' rx='24' ry='4' fill='#000' opacity='.3'/>"+
  "<ellipse cx='50' cy='60' rx='28' ry='32' fill='url(#g)' stroke='#1d2410' stroke-width='3'/>"+
  "<path d='M24 50H76M23 66H77M50 30V90M36 33Q32 60 37 88M64 33Q68 60 63 88' stroke='#1d2410' stroke-width='2.5' fill='none' opacity='.55'/>"+
  "<rect x='40' y='18' width='20' height='14' rx='3' fill='#7a8590' stroke='#3d4750' stroke-width='2'/>"+
  "<path d='M58 22Q80 18 76 44' stroke='#9aa5ae' stroke-width='6' fill='none' stroke-linecap='round'/>"+
  "<circle cx='34' cy='18' r='9' fill='none' stroke='#c9a64a' stroke-width='3.5'/><path d='M41 22L46 24' stroke='#c9a64a' stroke-width='3'/>"+
  "<ellipse cx='38' cy='46' rx='8' ry='5' fill='#fff' opacity='.4' transform='rotate(-30 38 46)'/>");
SP.rainbow=svg("<circle cx='50' cy='53' r='44' fill='#000' opacity='.28'/>"+[0,1,2,3,4,5].map(wedge).join('')+
  "<circle cx='50' cy='50' r='31' fill='#fff' stroke='#1d2a30' stroke-width='2'/><circle cx='50' cy='50' r='22' fill='none' stroke='#e5332a' stroke-width='5'/><circle cx='50' cy='50' r='11' fill='#e5332a'/>"+
  "<path d='M50 12V32M50 68V88M12 50H32M68 50H88' stroke='#1d2a30' stroke-width='4' stroke-linecap='round'/>"+
  "<circle cx='50' cy='50' r='44' fill='none' stroke='#ffd23a' stroke-width='5'/><ellipse cx='32' cy='24' rx='10' ry='5' fill='#fff' opacity='.7' transform='rotate(-30 32 24)'/>");

/* ---------- obstacles ---------- */
const wire=(extra)=>svg("<path d='M-4 32Q25 18 50 32T104 32M-4 70Q25 56 50 70T104 70"+(extra||'')+"' stroke='#3d454c' stroke-width='6' fill='none'/>"+
  "<path d='M-4 32Q25 18 50 32T104 32M-4 70Q25 56 50 70T104 70"+(extra||'')+"' stroke='#c9ced3' stroke-width='3' fill='none'/>"+
  [[12,24],[38,27],[62,36],[88,38],[12,62],[38,65],[62,74],[88,76]].map(([x,y])=>"<path d='M"+(x-5)+" "+(y-5)+"L"+(x+5)+" "+(y+5)+"M"+(x+5)+" "+(y-5)+"L"+(x-5)+" "+(y+5)+"' stroke='#e2e6e9' stroke-width='2.5' stroke-linecap='round'/>").join(''));
ICE=wire(); ICE2=wire('M-4 -4L104 104M104 -4L-4 104');
const crateArt=bands=>svg("<rect x='4' y='8' width='92' height='86' rx='8' fill='#000' opacity='.3'/>"+
  "<rect x='4' y='4' width='92' height='86' rx='8' fill='#5c6b31' stroke='#2b3514' stroke-width='4'/>"+
  "<path d='M6 34H94M6 62H94' stroke='#3f4b20' stroke-width='3'/>"+
  "<rect x='10' y='10' width='80' height='74' rx='4' fill='none' stroke='#7d8f4a' stroke-width='2' opacity='.6'/>"+
  "<text x='50' y='58' text-anchor='middle' font-family='Arial,sans-serif' font-weight='900' font-size='26' fill='#e8d77a'>БК</text>"+
  (bands?"<rect x='4' y='18' width='92' height='9' fill='#9aa5ae' stroke='#4b555d' stroke-width='2'/><rect x='4' y='66' width='92' height='9' fill='#9aa5ae' stroke='#4b555d' stroke-width='2'/>"+
    [14,50,86].map(x=>"<circle cx='"+x+"' cy='22.5' r='2.5' fill='#4b555d'/><circle cx='"+x+"' cy='70.5' r='2.5' fill='#4b555d'/>").join(''):""));
/* orcs sit on cells and take hits; the helmeted one needs two */
SP.crate='img/orc1.webp'; SP.crate2='img/orc2.webp';
SP.rock=svg("<ellipse cx='50' cy='88' rx='38' ry='8' fill='#000' opacity='.3'/>"+
  "<path d='M14 86L86 14M14 14L86 86' stroke='#2e3338' stroke-width='16' stroke-linecap='round'/><path d='M50 8V92' stroke='#2e3338' stroke-width='16' stroke-linecap='round'/>"+
  "<path d='M14 86L86 14M14 14L86 86M50 8V92' stroke='#7b848c' stroke-width='9' stroke-linecap='round'/>"+
  "<path d='M20 78L78 20M50 14V50' stroke='#b6bec4' stroke-width='3' stroke-linecap='round'/>");
SP.gem=svg("<path d='M10 28H40L46 20H90V86H10Z' fill='#000' opacity='.3' transform='translate(0 4)'/>"+
  "<path d='M10 28H40L46 20H90V86H10Z' fill='#d8b065' stroke='#7a5a1e' stroke-width='3' stroke-linejoin='round'/>"+
  "<path d='M10 36H90' stroke='#b48a3e' stroke-width='3'/>"+
  "<rect x='22' y='48' width='56' height='22' rx='3' fill='none' stroke='#d2332a' stroke-width='4' transform='rotate(-8 50 59)'/>"+
  "<text x='50' y='65' text-anchor='middle' font-family='Arial,sans-serif' font-weight='900' font-size='13' fill='#d2332a' transform='rotate(-8 50 59)'>ТАЄМНО</text>"+
  "<path d='"+starPath(78,28,8,3.5)+"' fill='#ffd23a' stroke='#7a5a1e' stroke-width='1.5'/>");
FOG=svg("<rect x='2' y='2' width='96' height='96' rx='22' fill='#6d767c'/><circle cx='32' cy='60' r='22' fill='#a5adb2'/><circle cx='60' cy='42' r='26' fill='#b8bfc3'/><circle cx='72' cy='68' r='18' fill='#959ea4'/><circle cx='38' cy='34' r='14' fill='#c7cdd0'/>");
MOSS=svg("<rect x='4' y='4' width='92' height='92' rx='18' fill='#4f5f2a' opacity='.35'/>"+
  [10,26,42,58,74,90].map(v=>"<path d='M"+v+" 4L"+(v-86)+" 96M"+v+" 4L"+(v+86)+" 96' stroke='#6f8a3a' stroke-width='4'/>").join('')+
  "<circle cx='26' cy='30' r='7' fill='#8a7a4a'/><circle cx='70' cy='64' r='8' fill='#3e4a20'/><circle cx='64' cy='26' r='6' fill='#a3b56a'/>"+
  "<rect x='4' y='4' width='92' height='92' rx='18' fill='none' stroke='#3e4a20' stroke-width='6'/>");
FROST=svg("<rect x='46' y='56' width='8' height='40' fill='#7a5a36'/><path d='M50 6L94 78H6Z' fill='#e5332a' stroke='#fff' stroke-width='5' stroke-linejoin='round'/>"+
  "<text x='50' y='66' text-anchor='middle' font-family='Arial,sans-serif' font-weight='900' font-size='19' fill='#fff'>МІНИ</text>");
AMBER=svg("<rect x='14' y='6' width='6' height='90' rx='3' fill='#7a5a36'/>"+
  "<path d='M20 10Q40 2 58 10T92 10V38Q74 30 58 38T20 38Z' fill='#2f6fd6' stroke='#123e8a' stroke-width='2'/>"+
  "<path d='M20 38Q40 30 58 38T92 38V66Q74 58 58 66T20 66Z' fill='#ffd23a' stroke='#b88a00' stroke-width='2'/>");
EMBER=svg("<ellipse cx='50' cy='62' rx='42' ry='26' fill='#2e3338' stroke='#15181b' stroke-width='3'/><ellipse cx='50' cy='56' rx='34' ry='18' fill='#4a5157'/>"+
  "<circle cx='50' cy='52' r='13' fill='#fff' stroke='#15181b' stroke-width='2.5'/><path d='M50 44V52L56 56' stroke='#e5332a' stroke-width='3' fill='none' stroke-linecap='round'/>"+
  "<circle cx='76' cy='48' r='5' fill='#ff3b2b'/>");
CHEST=svg("<rect x='8' y='40' width='84' height='50' rx='6' fill='#000' opacity='.3' transform='translate(0 4)'/>"+
  "<rect x='8' y='40' width='84' height='50' rx='6' fill='#5c6b31' stroke='#2b3514' stroke-width='4'/>"+
  "<path d='M8 46Q8 18 50 18Q92 18 92 46Z' fill='#6f8a3a' stroke='#2b3514' stroke-width='4'/>"+
  "<rect x='42' y='36' width='16' height='20' rx='3' fill='#ffd23a' stroke='#2b3514' stroke-width='3'/>"+
  "<path d='"+starPath(50,72,10,4.5)+"' fill='#ffd23a'/>");
SP.mud=svg("<path d='M8 58Q4 30 28 22Q40 4 60 16Q88 10 92 40Q100 66 82 84Q62 100 40 90Q10 92 8 58Z' fill='#5b4429' stroke='#2f2212' stroke-width='5'/><circle cx='36' cy='42' r='10' fill='#7a5c38'/><circle cx='64' cy='62' r='13' fill='#7a5c38'/><circle cx='62' cy='32' r='6' fill='#8c6c45'/><circle cx='33' cy='39' r='3' fill='#c9a67c'/>");

/* ranks instead of amulets: a medal on a blue and yellow ribbon */
amulet=(a,b)=>svg("<path d='M28 2H48L42 44H22Z' fill='#2f6fd6' stroke='#123e8a' stroke-width='2'/><path d='M52 2H72L78 44H58Z' fill='#ffd23a' stroke='#b88a00' stroke-width='2'/>"+
  "<circle cx='50' cy='66' r='28' fill='#000' opacity='.25' transform='translate(0 3)'/>"+
  "<circle cx='50' cy='66' r='28' fill='#f2b51c' stroke='#9c6500' stroke-width='3'/><circle cx='50' cy='66' r='20' fill='"+a+"' stroke='#9c6500' stroke-width='2'/>"+
  "<path d='"+starPath(50,68,13,6)+"' fill='#fff'/><ellipse cx='40' cy='52' rx='7' ry='3.5' fill='#fff' opacity='.6' transform='rotate(-30 40 52)'/>");

/* map scenery per location */
SCENE.splice(0,SCENE.length,...[
  "<circle cx='50' cy='50' r='40' fill='none' stroke='#fff' stroke-width='7'/><circle cx='50' cy='50' r='24' fill='none' stroke='#fff' stroke-width='7'/><circle cx='50' cy='50' r='8' fill='#fff'/>",
  "<path d='M50 6 74 40H60L80 68H58L64 94H36L42 68H20L40 40H26Z' fill='#fff'/>",
  "<path d='M6 94V50H24V30H40V94M46 94V16H66V94M72 94V42H94V94' fill='#fff'/>",
  "<path d='M50 6V94M12 28L88 72M88 28L12 72' stroke='#fff' stroke-width='8' stroke-linecap='round'/><path d='M38 12L50 22L62 12M38 88L50 78L62 88' stroke='#fff' stroke-width='6' fill='none' stroke-linecap='round'/>",
  "<circle cx='50' cy='36' r='16' fill='#fff'/>"+[0,45,90,135,180,225,270,315].map(d=>"<ellipse cx='50' cy='12' rx='6' ry='10' fill='#fff' transform='rotate("+d+" 50 36)'/>").join('')+"<path d='M50 52V96M50 76Q64 66 74 70' stroke='#fff' stroke-width='6' fill='none' stroke-linecap='round'/>"
].map(svg));

/* ---------- locations, ranks and story («РІНО. 4-та бригада. Народжені бути незламними») ---------- */
const RANKS=['Солдат','Старший солдат','Сержант','Лейтенант','Капітан'];
CH.splice(5);
[
  ['Перший рубіж','#6b7b3a','#232b12',
   'Дорога привела Ріно на схід України. Будинки, де колись лунав дитячий сміх, зруйновані, а соняшникові поля понівечені війною. Ріно одягнув маленький бронежилет і перший шолом. Йому страшно, але сміливий — це той, хто навіть зі страхом у серці робить те, що потрібно. Збирайте по три однакові шеврони й відбивайте перші атаки.',
   'Перший бій був важким, але Ріно вистояв. Бронежилет у пилу, ріжок подряпаний, а в очах горить рішучість: «Це тільки початок!»'],
  ['Ліс незламних','#3f6b3a','#13221a',
   'Серед густих дерев Ріно зустрів розвідників і вчиться діяти разом із командою. Ворог ховається під маскувальними сітками: робіть збіги просто на сітках, щоб їх зняти.',
   'Спритний носоріжок-розвідник помітив ворога там, де той ховався найкраще. «Ти більше не сам, Ріно!» — сказали нові друзі.'],
  ['Місто мужності','#6d7480','#22262e',
   'Ріно допомагає захищати місто, рятувати мешканців і звільняти вулиці від загарбників. На вулицях протитанкові їжаки й дим: їжаки бере лише техніка, а тут Ріно зустрів носорога-танкіста, що приборкує сталеві машини.',
   'Місто вистояло. До команди приєдналися танкіст, артилерист і майстер безпілотників. Один носоріг може бути сильним, але коли носороги об\'єднуються, народжується сила, яку неможливо зламати!'],
  ['Зимова фортеця','#7fa6c4','#1d3346',
   'Мороз, сніг і сильний вітер випробовують витривалість героїв. На підступах до фортеці міни з таймером: знешкодьте їх збігом, поки лічильник не дійшов до нуля. Справжня дружба зігріває краще за будь-яке багаття.',
   'Фортеця тримається. Ріно вже не той наляканий носоріжок: тепер він знає ціну свободи.'],
  ['Степ перемоги','#b8953e','#3a2d0e',
   'Разом із побратимами Ріно вступає в нове протистояння, щоб зупинити ворога й повернути мир на рідну землю. Степ розкис від бруду: якщо за хід не прибрати жодної плями, він захопить сусідній шеврон.',
   '«Ми носороги! Ми стоїмо разом! Ми боремося за своє! І ми не віддамо Україну!»']
].forEach(([name,a,b,story,outro],i)=>Object.assign(CH[i],{name,a,b,story,outro,gem:'Звання «'+RANKS[i]+'»'}));
PROLOGUE='Обирай свою локацію. Знаходь побратимів. Виконуй місії. Зупиняй ворога. Захищай Україну.';
EPILOGUE='Історія Ріно ще триває. Героями не народжуються великими: героями стають завдяки своїм вчинкам. Одного дня над усією Україною знову буде мирне небо, і тоді Ріно зніме свій шолом, подивиться на друзів і скаже: «Ми це зробили. Ми захистили наш дім!» А поки що Ріно чекає на тебе: перепроходьте рівні, де бракує зірок.';
Object.assign(TIPS,{
  amber:'Звільняйте територію! Зробіть збіг так, щоб хоч один шеврон стояв на звільненій клітинці, і прапор пошириться на всі клітинки цього збігу. Звільніть усе поле.',
  frost:'Поле заміноване. Міна під шевроном знешкоджується, коли він потрапляє у збіг або під удар. Розмінуйте всі клітинки.',
  gems:'Розвіддані падають згори. Прибирайте шеврони під ними, щоб доставити кожну папку до нижнього краю поля.',
  rock:'Протитанковий їжак не боїться звичайного збігу. Знадобиться техніка: танк, дрон чи граната.',
  fog:'Дим ховає шеврони. Він розвіюється від збігу або вибуху поруч.',
  time:'Тут іде відлік часу: ходи не рахуються, діяти треба швидко.'
});
const ACH_ALL=ACH.find(a=>a.id==='all'); if(ACH_ALL){ACH_ALL.name='Незламний';ACH_ALL.text='Пройти всі п\'ять локацій';}

/* the full story, shown in the journal */
const STORY_BOOK=[
['Пролог. Народження маленького героя',`8 березня 2022 року, коли весна тільки починала пробуджувати землю, на світ з'явився маленький носоріжок на ім'я Ріно.
Він був зовсім крихітним, мав маленький ріжок, великі допитливі очі та неймовірно добре серце.
Ріно народився в Україні — країні безкраїх полів, квітучих садів, високих гір і синього неба.
Він мріяв про пригоди, нових друзів та великі відкриття. Але світ, у який він прийшов, уже змінився.
Навколо лунали незнайомі звуки. Небо іноді здригалося від вибухів, а дорослі говорили про якусь страшну війну.
— Чому всі такі сумні? — запитував маленький Ріно.
— Тому що нашу землю хочуть забрати, — відповідали йому.
Але Ріно ніяк не міг зрозуміти:
— Як це — забрати країну? Хіба можна забрати чийсь дім?
Тоді він ще не знав, що зовсім скоро йому доведеться знайти відповідь на це запитання.`],
['Розділ 1. Дорога на Схід',`Одного дня доля привела маленького Ріно на схід України.
Там він побачив зовсім інший світ.
Будинки, у яких колись лунав дитячий сміх, стояли зруйнованими. Поля, де росли соняшники, були понівечені війною. А замість співу пташок іноді було чути гуркіт ворожої техніки.
Ріно зустрів старенького носорога, який дивився на обрій.
— Хто це зробив? — тихо запитав малюк.
— Наш сусід, який вирішив, що має право забрати нашу землю, — відповів старий.
— Але ж це наша Україна!
— Саме так, Ріно. І зараз вона потребує захисників.
У ту мить маленький носоріжок уперше по-справжньому зрозумів, що відбувається.
Ворог прийшов не просто руйнувати міста. Він хотів забрати його дім, його свободу, його майбутнє.
Ріно міцно стиснув маленькі копитця, підняв голову і промовив:
— Я маленький, але моя любов до України — величезна! І я не дозволю нікому забрати мій дім!
Саме цього дня почалася історія справжнього героя.`],
['Розділ 2. Перший бій',`Ріно не став чекати, поки хтось інший захистить його країну.
Він одягнув маленький бронежилет, узяв свій перший захисний шолом і вирушив назустріч небезпеці.
Звичайно, йому було страшно.
Його лапки іноді тремтіли, а серце билося так швидко, ніби хотіло вистрибнути з грудей.
Але Ріно зрозумів одну важливу річ:
Сміливий — не той, хто ніколи не боїться. Сміливий — той, хто навіть зі страхом у серці робить те, що потрібно.
Перший бій був важким.
Ворог виявився сильним і підступним. Та маленький носоріжок мав те, чого не було у загарбників, — незламний дух і віру в перемогу.
Він вистояв.
І хоча його бронежилет був укритий пилом, а маленький ріжок подряпаний, в очах Ріно горіла рішучість.
— Це тільки початок! — сказав він.`],
['Розділ 3. Один носоріг — добре, а ціла бригада — сила!',`Подорожуючи українськими землями, Ріно відкривав нові локації.
Кожна з них мала власну історію, свої випробування та своїх героїв.
На одній локації він зустрів сильного носорога-танкіста, який умів приборкувати величезні сталеві машини.
На іншій — спритного носоріжка-розвідника, який помічав ворога навіть там, де той намагався сховатися.
Далі Ріно познайомився з носорогом-артилеристом, майстром влучності, та винахідливим носоріжком, який керував безпілотниками.
А ще були носороги-медики, інженери, зв'язківці, логісти, піхотинці та багато інших.
Кожен мав свій характер, особливі здібності й власну історію.
Але всіх їх об'єднувало одне — любов до України.
— Ти більше не сам, Ріно! — сказали нові друзі.
І тоді маленький герой усвідомив:
Один носоріг може бути сильним.
Два носороги можуть бути ще сильнішими.
А коли носороги об'єднуються — народжується сила, яку неможливо зламати!
Так з'явилася команда, яка згодом стала справжньою бойовою родиною.`],
['Розділ 4. Нові землі — нові випробування',`Попереду на Ріно чекали десятки пригод.
Перший рубіж. Тут Ріно навчився долати страх, захищати друзів та відбивати перші ворожі атаки.
Ліс незламних. Серед густих дерев Ріно зустрів розвідників і навчився діяти разом із командою.
Місто мужності. Ріно допомагав захищати місто, рятувати мешканців та звільняти вулиці від загарбників.
Зимова фортеця. Мороз, сніг і сильний вітер випробовували витривалість героїв. Але справжня дружба зігрівала краще за будь-яке багаття.
Степ перемоги. Тут Ріно разом із побратимами вступив у нове протистояння, щоб зупинити ворога та повернути мир на рідну землю.
З кожною новою локацією Ріно ставав сильнішим, мудрішим і досвідченішим.
Він знаходив нових друзів, здобував нові вміння, відкривав спорядження та отримував особливі нагороди.
А головне — розумів, що перемога залежить не лише від сили, а й від єдності, взаємодопомоги та віри одне в одного.`],
['Розділ 5. Носороги не відступають!',`Минали дні. За днями — місяці.
Маленький Ріно вже не був тим наляканим носоріжком, який колись не розумів, чому над його країною лунають вибухи.
Тепер він знав ціну свободи.
Кожного дня разом зі своїми побратимами він зупиняв ворога, знищував ворожу техніку, відбивав атаки та захищав українські міста й села.
Бували важкі дні.
Бували моменти, коли здавалося, що сил більше немає.
Але тоді Ріно дивився на своїх друзів і згадував, заради чого вони борються.
Заради дітей, які мають сміятися, а не ховатися.
Заради батьків, які мають повертатися додому.
Заради полів, які повинні квітнути.
Заради України, яка має бути вільною.
І щоразу він повторював слова, які стали девізом усієї команди:
— Ми носороги! Ми стоїмо разом! Ми боремося за своє! І ми не віддамо Україну!`],
['Фінал, який ще не написаний',`Історія Ріно ще триває.
Щодня на нього чекають нові пригоди, складні завдання, небезпечні вороги та нові друзі.
Він росте разом зі своєю командою.
Кожна перемога робить його сильнішим.
Кожен врятований друг нагадує, що він обрав правильний шлях.
І хоча Ріно досі маленький носоріжок, тепер він знає найважливіше:
Героями не народжуються великими. Героями стають завдяки своїм вчинкам.
Одного дня над усією Україною знову буде мирне небо.
І тоді Ріно зніме свій шолом, подивиться на друзів та скаже:
— Ми це зробили. Ми захистили наш дім!
А поки що...
РІНО ЧЕКАЄ НА ТЕБЕ!
Обирай свою локацію. Знаходь побратимів. Виконуй місії. Зупиняй ворога. Захищай Україну.`]
];

/* ---------- bosses: the last level of every location is a fight with a pig-orc commander ---------- */
const PIG=n=>'img/pig-'+n+'.webp';
const BOSSES=[
  {name:'Хряк-штурмовик',img:'img/boss-0.webp',
   intro:'Хряк-штурмовик вліз на наш рубіж у дірявому шоломі й трусах. Кожен збіг б\'є по ньому, а його орки сідають на поле.',
   taunt:['Хрю! Підкріплення!','Заходимо, хрю!','Наших тут багато!'],hurt:['Ай, хрю!','Не по шолому!','Мамо…']},
  {name:'Хряк-мародер',img:'img/boss-1.webp',
   intro:'Хряк-мародер тягне з наших домівок усе, навіть унітази. Розбийте його, поки він не наскликав орків.',
   taunt:['Це тепер моє, хрю!','Тягніть усе!','Балалайка, вперед!'],hurt:['Мій унітаз!','Хрю-у-у!','Не чіпай балалайку!']},
  {name:'Хряк-пахан',img:'img/boss-2.webp',
   intro:'Хряк-пахан командує всією свинячою ордою. Він хитрий і кличе по три орки за раз. Носороги, разом!',
   taunt:['Шестірки, до мене!','Хрю-хрю, по позиціях!','Розумієш, хто тут головний?'],hurt:['Око! Друге око!','Відступаємо, хрю!','Це не за поняттями!']}
];
const BOSS_OF=[0,1,2,1,2];
Object.assign(BUDDY,{boss0:BOSSES[0].img,boss1:BOSSES[1].img,boss2:BOSSES[2].img,pigko:PIG('ko'),pigsmug:PIG('smug')});
const pick1=a=>a[Math.floor(Math.random()*a.length)];
let bossClock=0, bossFaceT=0;
function bossShow(src,ms){
  const e=$('bossImg'); if(!e)return;
  clearTimeout(bossFaceT); bg(e,src); e.classList.toggle('head',src!==BOSSES[def.boss].img);
  if(ms)bossFaceT=setTimeout(()=>{if(def&&def.boss!=null&&goals.boss&&goals.boss.have<goals.boss.need)bossShow(BOSSES[def.boss].img);},ms);
}
function bossBar(){
  const bar=$('bossBar'); if(!bar)return;
  const on=!!def&&def.boss!=null&&!!goals.boss; bar.hidden=!on;
  $('gameScreen').classList.toggle('bossLevel',on);
  if(!on)return;
  const g=goals.boss, left=Math.max(0,g.need-g.have);
  $('bossName').textContent=BOSSES[def.boss].name;
  $('bossHp').style.width=(100*left/g.need)+'%';
  $('bossHpT').textContent=left+' / '+g.need;
  const n=def.bossEvery-bossClock;
  $('bossNext').textContent=left?(n<=1?'Кличе орків після цього ходу!':'Кличе орків через '+n+' ходи'):'Розбитий!';
  $('bossNext').classList.toggle('hot',n<=1&&left>0);
}
function bossStart(){
  bossClock=0;
  if(def.boss==null){bossBar();return;}
  goals={boss:{need:def.bossHp,have:0,img:PIG('mad')},...goals};
  delete goals.crate;
  bossShow(BOSSES[def.boss].img); bossBar();
}
function bossHit(dmg){
  if(!dmg||!goals.boss)return;
  const g=goals.boss, was=g.have; g.have=Math.min(g.need,g.have+dmg); if(g.have===was)return;
  bossBar();
  const bar=$('bossBar'); bar.classList.remove('hit'); void bar.offsetWidth; bar.classList.add('hit');
  const f=h('b','bossDmg','−'+(g.have-was)); bar.appendChild(f); setTimeout(()=>f.remove(),900);
  if(g.have>=g.need){bossShow(PIG('ko'));say('Хряка розбито! Носороги, вперед!','cheer');return;}
  if(dmg>=9){bossShow(pick1([PIG('hurt'),PIG('cry'),PIG('band')]),1100);say(pick1(BOSSES[def.boss].hurt),'wow');}
}
/* every few turns the boss calls fresh orcs onto plain cells in the lower part of the board */
async function bossTurn(){
  if(def.boss==null||!goals.boss||goals.boss.have>=goals.boss.need)return;
  if(++bossClock<def.bossEvery){bossBar();return;}
  bossClock=0;
  const pool=[]; each(t=>{if(t.kind>=0&&!t.sp&&!t.ice&&!t.timer&&t.r>=2)pool.push(t);});
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  const n=Math.min(def.bossSpawn,pool.length);
  bossShow(PIG('smug'),1400); say(pick1(BOSSES[def.boss].taunt),'sweat');
  const bar=$('bossBar'); bar.classList.remove('roar'); void bar.offsetWidth; bar.classList.add('roar');
  for(let i=0;i<n;i++){
    const t=pool[i]; t.kind=-1; t.sp='crate'; t.hp=def.bossTough&&i===0?2:1; paint(t);
    t.el.classList.remove('drop'); void t.el.offsetWidth; t.el.classList.add('drop');
    shards(t.r,t.c,['#6fbf2a','#3d6b17','#c9b98a'],8); sfx('wood');
    await wait(140);
  }
  bossBar(); await wait(260);
}
