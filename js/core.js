/* Shared helpers, pictures, saved progress, chapters, story and level definitions. */
let ROWS=8, COLS=7;
const NSYM=6, PER=10, TOTAL=70, STORE='kaminci-v2';
const $=id=>document.getElementById(id);
let SPEED=1;
const wait=ms=>new Promise(r=>setTimeout(r,ms*SPEED));
const h=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
const svg=s=>'data:image/svg+xml,'+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>"+s+"</svg>");
const bg=(el,u)=>{el.style.backgroundImage='url("'+u+'")';};
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

/* ---------- pictures ---------- */
const PAL=[['#ff8a78','#c8322b'],['#ffd166','#d9860b'],['#7fe09a','#1f8748'],['#74bdff','#1f62c0'],['#c99bff','#6b35b8'],['#ff9fd0','#c2377f']];
const COLORS=PAL.map(p=>p[0]);
const GLYPHS=[
  "<circle cx='50' cy='53' r='15'/>",
  "<path d='M50 34 68 66H32Z'/>",
  "<rect x='36' y='39' width='28' height='28' rx='3'/>",
  "<path d='M50 32 69 53 50 74 31 53Z'/>",
  "<path d='M50 31l6 14 15 1-12 10 4 15-13-8-13 8 4-15-12-10 15-1Z'/>",
  "<path d='M44 35h12v12h12v12H56v12H44V59H32V47h12Z'/>"
];
/* glossy gems: each colour has its own silhouette so the board reads at a glance */
const starPath=(cx,cy,R,r)=>{let d='';for(let k=0;k<10;k++){const a=(-90+k*36)*Math.PI/180,rr=k%2?r:R;d+=(k?'L':'M')+(cx+rr*Math.cos(a)).toFixed(1)+' '+(cy+rr*Math.sin(a)).toFixed(1);}return d+'Z';};
const GEMS=[
  {p:"M50 90C22 72 7 55 7 35C7 19 19 8 33 8C41 8 47 12 50 19C53 12 59 8 67 8C81 8 93 19 93 35C93 55 78 72 50 90Z",c:['#ffc2b8','#ff5a4e','#a8180f'],h:[30,27]},
  {p:starPath(50,54,47,23),c:['#fff4b0','#ffc82e','#b86a00'],h:[44,34],w:6},
  {p:"M50 5 90 27V73L50 95 10 73V27Z",c:['#c2f7cf','#3fcf6e','#0f6a33'],h:[34,26]},
  {p:"M50 6A44 44 0 1 1 49.9 6Z",c:['#c6e6ff','#3c9bff','#123f9c'],h:[35,28]},
  {p:"M50 4 93 50 50 96 7 50Z",c:['#ecd4ff','#a45cf0','#4f1693'],h:[40,30]},
  {p:"M28 8H72Q92 8 92 28V72Q92 92 72 92H28Q8 92 8 72V28Q8 8 28 8Z",c:['#ffd6ec','#ff6fb5','#a01d62'],h:[31,24]}
];
const gemArt=(g,inner)=>svg(
  "<defs><linearGradient id='g' x1='0' y1='0' x2='.35' y2='1'><stop offset='0' stop-color='"+g.c[0]+"'/><stop offset='.5' stop-color='"+g.c[1]+"'/><stop offset='1' stop-color='"+g.c[2]+"'/></linearGradient>"+
  "<radialGradient id='h' cx='.5' cy='.42' r='.55'><stop offset='0' stop-color='#fff' stop-opacity='.6'/><stop offset='1' stop-color='#fff' stop-opacity='0'/></radialGradient></defs>"+
  "<path d='"+g.p+"' fill='#000' opacity='.3' transform='translate(0 4)'/>"+
  "<path d='"+g.p+"' fill='url(#g)' stroke='"+g.c[2]+"' stroke-width='"+(g.w||3)+"' stroke-linejoin='round'/>"+
  "<path d='"+g.p+"' fill='url(#h)' transform='translate(50 53) scale(.68) translate(-50 -50)'/>"+
  "<path d='"+g.p+"' fill='none' stroke='#fff' stroke-opacity='.4' stroke-width='2.5' stroke-linejoin='round' transform='translate(50 50) scale(.84) translate(-50 -50)'/>"+
  (inner||"")+
  "<ellipse cx='"+g.h[0]+"' cy='"+g.h[1]+"' rx='12' ry='5.5' fill='#fff' opacity='.85' transform='rotate(-28 "+g.h[0]+" "+g.h[1]+")'/>"+
  "<circle cx='"+(g.h[0]+19)+"' cy='"+(g.h[1]-5)+"' r='2.6' fill='#fff' opacity='.85'/>");
const defaults=GEMS.map(g=>gemArt(g));
const wedge=i=>{
  const p=a=>(50+44*Math.cos(a*Math.PI/180)).toFixed(1)+' '+(50+44*Math.sin(a*Math.PI/180)).toFixed(1);
  return "<path d='M50 50L"+p(i*60-90)+"A44 44 0 0 1 "+p(i*60-30)+"Z' fill='"+COLORS[i]+"'/>";
};
const blade=(deg,col)=>"<path transform='rotate("+deg+" 50 50)' d='M50 50 44 2 74 44Z' fill='"+col+"' stroke='#fff' stroke-width='2.5' stroke-linejoin='round'/>";
const arrow="<rect x='18' y='34' width='64' height='32' fill='#ffd166' stroke='#fff' stroke-width='3'/><path d='M3 50 32 18V82Z' fill='#ff6f61' stroke='#fff' stroke-width='3' stroke-linejoin='round'/><path d='M97 50 68 18V82Z' fill='#ff6f61' stroke='#fff' stroke-width='3' stroke-linejoin='round'/>";
const crateBody="<rect x='2' y='2' width='96' height='96' rx='12' fill='#c58a4a'/><path d='M10 10 90 90M90 10 10 90' stroke='#8f5e2e' stroke-width='12'/><rect x='7' y='7' width='86' height='86' rx='8' fill='none' stroke='#6f4620' stroke-width='10'/>";
const SP={
  row:svg(arrow), col:svg("<g transform='rotate(90 50 50)'>"+arrow+"</g>"),
  pin:svg("<circle cx='50' cy='50' r='48' fill='#fff' opacity='.16'/>"+blade(0,'#ffd166')+blade(90,'#ff6f61')+blade(180,'#5bc0eb')+blade(270,'#9bdb6f')+"<circle cx='50' cy='50' r='9' fill='#fff'/>"),
  bomb:svg("<path d='M62 30 74 14' stroke='#e2c27a' stroke-width='7' stroke-linecap='round'/><circle cx='78' cy='11' r='9' fill='#ffb52e'/><circle cx='47' cy='58' r='36' fill='#2f3a40' stroke='#fff' stroke-width='5'/><circle cx='34' cy='45' r='10' fill='#fff' opacity='.35'/>"),
  rainbow:svg([0,1,2,3,4,5].map(wedge).join('')+"<circle cx='50' cy='50' r='44' fill='none' stroke='#fff' stroke-width='6'/><circle cx='50' cy='50' r='12' fill='#fff'/>"),
  crate:svg(crateBody),
  crate2:svg(crateBody+"<rect x='2' y='40' width='96' height='20' fill='#8d99a3' stroke='#4b555d' stroke-width='3'/><rect x='40' y='2' width='20' height='96' fill='#8d99a3' stroke='#4b555d' stroke-width='3'/><circle cx='50' cy='50' r='7' fill='#dfe6ea'/>"),
  gem:svg("<path d='M50 6 90 38 50 94 10 38Z' fill='#35e0c2' stroke='#fff' stroke-width='5' stroke-linejoin='round'/><path d='M50 6 68 38 50 94 32 38Z' fill='#9ff5e6'/><path d='M10 38H90' stroke='#fff' stroke-width='3'/>"),
  mud:svg("<path d='M8 58Q4 30 28 22Q40 4 60 16Q88 10 92 40Q100 66 82 84Q62 100 40 90Q10 92 8 58Z' fill='#5b3d24' stroke='#2f1e10' stroke-width='5'/><circle cx='36' cy='42' r='10' fill='#7a5535'/><circle cx='64' cy='62' r='13' fill='#7a5535'/><circle cx='62' cy='32' r='6' fill='#8c6642'/><circle cx='33' cy='39' r='3' fill='#c9a67c'/>")
};
SP.rock=svg("<path d='M10 70Q4 40 26 22Q48 2 74 18Q98 34 92 66Q88 94 54 94Q18 96 10 70Z' fill='#7d8790' stroke='#3d454c' stroke-width='5'/><path d='M30 34 46 50 38 70M62 28 58 48 74 60' stroke='#4b555d' stroke-width='4' fill='none'/><path d='M24 40Q34 20 56 18' stroke='#c9d2d8' stroke-width='5' fill='none' stroke-linecap='round'/>");
const FOG=svg("<rect x='2' y='2' width='96' height='96' rx='22' fill='#cfdbe3'/><circle cx='32' cy='58' r='22' fill='#fff'/><circle cx='60' cy='42' r='26' fill='#fff'/><circle cx='72' cy='66' r='18' fill='#eef3f6'/><circle cx='40' cy='34' r='14' fill='#eef3f6'/>");
const CHEST=svg("<rect x='10' y='42' width='80' height='46' rx='8' fill='#b9722a' stroke='#6f4620' stroke-width='5'/><path d='M10 48Q10 16 50 16Q90 16 90 48Z' fill='#d8923c' stroke='#6f4620' stroke-width='5'/><rect x='42' y='38' width='16' height='22' rx='4' fill='#ffd166' stroke='#6f4620' stroke-width='4'/><path d='M22 30Q34 22 46 22' stroke='#ffe0a8' stroke-width='5' fill='none' stroke-linecap='round'/>");
const buddy=m=>{
  const eye=(x)=>"<ellipse cx='"+x+"' cy='50' rx='10' ry='11' fill='#fff'/><circle cx='"+(x+(m==='sad'?-1:2))+"' cy='"+(m==='sad'?54:52)+"' r='5.5' fill='#1d2a30'/><circle cx='"+(x+4)+"' cy='48' r='2' fill='#fff'/>"+
    "<ellipse cx='"+x+"' cy='50' rx='11' ry='0' fill='#9fb6c1'><animate attributeName='ry' values='0;0;12;0;0' keyTimes='0;.88;.92;.96;1' dur='4.2s' repeatCount='indefinite'/></ellipse>";
  const mouth=m==='wow'?"<ellipse cx='51' cy='74' rx='7' ry='9' fill='#3a1d24'/><ellipse cx='51' cy='78' rx='4' ry='3' fill='#ff7a8a'/>"
    :m==='sad'?"<path d='M40 78Q51 68 62 78' stroke='#1d2a30' stroke-width='4' fill='none' stroke-linecap='round'/>"
    :"<path d='M38 68Q51 84 64 68Q51 74 38 68Z' fill='#3a1d24' stroke='#3a1d24' stroke-width='3' stroke-linejoin='round'/><path d='M44 73Q51 79 58 73' fill='#ff7a8a'/>";
  return svg("<defs><radialGradient id='b' cx='.38' cy='.3' r='.75'><stop offset='0' stop-color='#eef5f8'/><stop offset='.55' stop-color='#a9bfca'/><stop offset='1' stop-color='#5f7886'/></radialGradient></defs>"+
    "<ellipse cx='50' cy='94' rx='30' ry='4' fill='#000' opacity='.25'/>"+
    "<path d='M12 62Q6 30 30 16Q52 2 76 16Q98 32 90 64Q84 94 50 94Q18 94 12 62Z' fill='url(#b)' stroke='#4b6170' stroke-width='3'/>"+
    "<path d='M26 30Q36 16 56 15' stroke='#fff' stroke-width='5' fill='none' stroke-linecap='round' opacity='.8'/>"+
    "<path d='M52 14Q50 2 60 0Q64 8 54 14Z' fill='#7fd14a' stroke='#3f7d22' stroke-width='2'/>"+
    eye(38)+eye(64)+mouth+
    "<ellipse cx='26' cy='66' rx='6' ry='4' fill='#ff8fa3' opacity='.6'/><ellipse cx='76' cy='66' rx='6' ry='4' fill='#ff8fa3' opacity='.6'/>"+
    (m==='sad'?"<path d='M30 38 42 41M72 38 60 41' stroke='#4b6170' stroke-width='3' stroke-linecap='round'/>":""));
};
const BUDDY={ok:buddy('ok'),wow:buddy('wow'),sad:buddy('sad')};
const SCENE=[
  "<path d='M5 56Q20 36 35 56T65 56T95 56M15 78Q30 60 45 78T75 78' stroke='#fff' stroke-width='8' fill='none' stroke-linecap='round'/>",
  "<path d='M50 8 78 48H62L84 80H16L38 48H22Z' fill='#fff'/><rect x='44' y='80' width='12' height='14' fill='#fff'/>",
  "<path d='M4 90 38 22 56 56 68 40 96 90Z' fill='#fff'/>",
  "<path d='M30 90 22 50 38 14 52 50 46 90ZM58 90 54 60 68 34 82 60 76 90Z' fill='#fff'/>",
  "<path d='M10 50Q40 18 70 50Q40 82 10 50ZM68 50 94 30V70Z' fill='#fff'/>",
  "<path d='M30 96V40M50 96V24M70 96V46' stroke='#fff' stroke-width='5'/><rect x='25' y='22' width='10' height='26' rx='5' fill='#fff'/><rect x='45' y='6' width='10' height='26' rx='5' fill='#fff'/><rect x='65' y='28' width='10' height='26' rx='5' fill='#fff'/>",
  "<path d='M50 6Q78 40 68 62Q86 54 80 40Q100 70 76 90Q50 104 26 90Q4 70 26 40Q28 58 40 60Q30 36 50 6Z' fill='#fff'/>"
].map(svg);
/* glossy bonus pieces */
SP.row=svg("<defs><linearGradient id='a' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#fff6c4'/><stop offset='.5' stop-color='#ffc93c'/><stop offset='1' stop-color='#d97e00'/></linearGradient><linearGradient id='b' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#ffb3a8'/><stop offset='1' stop-color='#d3271c'/></linearGradient></defs>"+
  "<rect x='20' y='33' width='60' height='38' rx='19' fill='#000' opacity='.25'/><rect x='20' y='30' width='60' height='38' rx='19' fill='url(#a)' stroke='#9c5200' stroke-width='3'/>"+
  "<path d='M3 49 27 24V74Z' fill='url(#b)' stroke='#8c140c' stroke-width='3' stroke-linejoin='round'/><path d='M97 49 73 24V74Z' fill='url(#b)' stroke='#8c140c' stroke-width='3' stroke-linejoin='round'/>"+
  "<rect x='30' y='36' width='40' height='8' rx='4' fill='#fff' opacity='.75'/><circle cx='50' cy='49' r='7' fill='#fff' opacity='.9'/>");
SP.col=svg("<g transform='rotate(90 50 50)'>"+decodeURIComponent(SP.row.split(',')[1]).replace(/^<svg[^>]*>|<\/svg>$/g,'')+"</g>");
SP.bomb=svg("<defs><radialGradient id='a' cx='.35' cy='.32' r='.75'><stop offset='0' stop-color='#7d8ea8'/><stop offset='.45' stop-color='#2c3548'/><stop offset='1' stop-color='#0b0f19'/></radialGradient><radialGradient id='f' cx='.5' cy='.5' r='.5'><stop offset='0' stop-color='#fff'/><stop offset='.4' stop-color='#ffe066'/><stop offset='1' stop-color='#ff7a00' stop-opacity='0'/></radialGradient></defs>"+
  "<ellipse cx='48' cy='92' rx='28' ry='5' fill='#000' opacity='.3'/><path d='M60 26Q66 10 78 12' stroke='#c9a66b' stroke-width='6' fill='none' stroke-linecap='round'/>"+
  "<rect x='52' y='22' width='16' height='12' rx='3' fill='#6b7280' transform='rotate(30 60 28)'/>"+
  "<circle cx='46' cy='58' r='34' fill='url(#a)' stroke='#05070c' stroke-width='3'/><ellipse cx='34' cy='44' rx='11' ry='7' fill='#fff' opacity='.55' transform='rotate(-30 34 44)'/>"+
  "<circle cx='80' cy='12' r='12' fill='url(#f)'><animate attributeName='r' values='9;13;9' dur='.4s' repeatCount='indefinite'/></circle>");
SP.rainbow=svg("<defs><radialGradient id='w' cx='.5' cy='.5' r='.5'><stop offset='0' stop-color='#fff' stop-opacity='.9'/><stop offset='.3' stop-color='#fff' stop-opacity='.25'/><stop offset='.7' stop-color='#fff' stop-opacity='0'/><stop offset='1' stop-color='#000' stop-opacity='.25'/></radialGradient><linearGradient id='r' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#fff3b0'/><stop offset='1' stop-color='#e6a000'/></linearGradient></defs>"+
  "<circle cx='50' cy='53' r='44' fill='#000' opacity='.28'/>"+[0,1,2,3,4,5].map(wedge).join('')+"<circle cx='50' cy='50' r='44' fill='url(#w)'/>"+
  "<circle cx='50' cy='50' r='44' fill='none' stroke='url(#r)' stroke-width='6'/>"+
  "<path d='"+starPath(50,52,17,8)+"' fill='#fff' stroke='#ffd166' stroke-width='3' stroke-linejoin='round'/><ellipse cx='34' cy='26' rx='12' ry='6' fill='#fff' opacity='.8' transform='rotate(-30 34 26)'/>");
SP.pin=svg("<defs><linearGradient id='a' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#ff8f8f'/><stop offset='1' stop-color='#c41d1d'/></linearGradient><radialGradient id='c' cx='.4' cy='.35' r='.7'><stop offset='0' stop-color='#fff'/><stop offset='1' stop-color='#9aa7b0'/></radialGradient></defs>"+
  [0,90,180,270].map(d=>"<path transform='rotate("+d+" 50 50)' d='M50 50Q30 26 44 4Q66 2 64 30Q62 44 50 50Z' fill='url(#a)' stroke='#7a0e0e' stroke-width='2.5' stroke-linejoin='round'/><path transform='rotate("+d+" 50 50)' d='M47 12Q56 10 57 20' stroke='#fff' stroke-width='3' fill='none' stroke-linecap='round' opacity='.7'/>").join('')+
  "<circle cx='50' cy='50' r='15' fill='#ffd166' stroke='#a86a00' stroke-width='3'/><circle cx='50' cy='50' r='9' fill='url(#c)'/>"+
  "<circle cx='50' cy='50' r='15' fill='none' stroke='#7fe09a' stroke-width='3' stroke-dasharray='6 6'/>");
const STAR=svg("<defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#fff6c4'/><stop offset='.5' stop-color='#ffc82e'/><stop offset='1' stop-color='#e07b00'/></linearGradient></defs><path d='"+starPath(50,54,46,22)+"' fill='#000' opacity='.3' transform='translate(0 4)'/><path d='"+starPath(50,54,46,22)+"' fill='url(#s)' stroke='#a85a00' stroke-width='5' stroke-linejoin='round'/><path d='"+starPath(50,56,30,14)+"' fill='#fff' opacity='.25'/><ellipse cx='42' cy='36' rx='9' ry='4' fill='#fff' opacity='.85' transform='rotate(-30 42 36)'/>");
const STAR_OFF=svg("<path d='"+starPath(50,54,46,22)+"' fill='#0b2530' stroke='#ffffff40' stroke-width='5' stroke-linejoin='round'/>");
const iceArt=(fill,extra)=>svg("<rect x='2' y='2' width='96' height='96' rx='22' fill='"+fill+"'/><path d='M14 62 62 14M38 88 88 38M10 30 30 10' stroke='#fff' stroke-width='7' stroke-linecap='round' opacity='.85'/>"+extra+"<rect x='5' y='5' width='90' height='90' rx='19' fill='none' stroke='#fff' stroke-width='6'/>");
const ICE=iceArt('#bfe6fb',''), ICE2=iceArt('#8fd0f5',"<path d='M20 84 84 20M60 90 90 60' stroke='#fff' stroke-width='9' stroke-linecap='round'/>");
const MOSS=svg("<rect x='8' y='8' width='84' height='84' rx='20' fill='none' stroke='#7fd14a' stroke-width='12'/><circle cx='22' cy='78' r='13' fill='#7fd14a'/><circle cx='78' cy='22' r='11' fill='#a6e36b'/>");
const EMBER=svg("<rect x='2' y='2' width='96' height='96' rx='22' fill='#3a1408'/><path d='M50 12Q74 40 66 60Q82 52 76 38Q96 66 74 86Q50 100 28 86Q8 68 28 40Q30 56 40 58Q30 36 50 12Z' fill='#ff8a2b'/><path d='M50 46Q62 62 56 74Q50 86 42 76Q36 64 50 46Z' fill='#ffe08a'/>");
const AMBER=svg("<defs><linearGradient id='a' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#ffc04d'/><stop offset='1' stop-color='#f0780a'/></linearGradient></defs><rect x='4' y='4' width='92' height='92' rx='22' fill='url(#a)' stroke='#ffe2a8' stroke-width='5'/><path d='M18 40Q22 18 46 16' stroke='#fff' stroke-width='7' fill='none' stroke-linecap='round' opacity='.7'/><circle cx='66' cy='64' r='7' fill='#fff' opacity='.35'/>");
const FROST=svg("<rect x='4' y='4' width='92' height='92' rx='20' fill='#2f9df0'/><path d='M4 40 34 30 46 4M34 30 52 56 96 44M52 56 40 96M52 56 78 80 96 70M78 80 70 96' stroke='#d8f3ff' stroke-width='5' fill='none' stroke-linejoin='round'/><rect x='4' y='4' width='92' height='92' rx='20' fill='none' stroke='#d8f3ff' stroke-width='6'/>");
const HEART=svg("<path d='M50 88Q8 58 8 34Q8 12 28 12Q42 12 50 26Q58 12 72 12Q92 12 92 34Q92 58 50 88Z' fill='#ff4d5e' stroke='#fff' stroke-width='5' stroke-linejoin='round'/><path d='M24 28Q30 20 38 22' stroke='#fff' stroke-width='5' fill='none' stroke-linecap='round' opacity='.7'/>");
const amulet=(a,b)=>svg("<circle cx='50' cy='54' r='40' fill='"+b+"' stroke='#ffe08a' stroke-width='6'/><path d='M50 22 74 46 50 88 26 46Z' fill='"+a+"' stroke='#fff' stroke-width='3' stroke-linejoin='round'/><path d='M50 22 60 46 50 88 40 46Z' fill='#fff' opacity='.45'/><rect x='42' y='2' width='16' height='14' rx='5' fill='#ffe08a'/>");

/* ---------- saved progress ---------- */
const freshSave=()=>({custom:new Array(NSYM).fill(null),muted:false,stars:{},coins:0,inv:{hammer:3,mix:3,glove:2,rowhit:1,colhit:1},gift:'',seen:[],told:[],streak:0,ach:{},stat:{},amb:'sparkle',gloss:true,dim:30,lives:{n:5,t:0},track:0,failed:0,fails:{level:0,n:0},tips:[],diff:1,stops:{},chestAt:15,wheel:'',login:{day:'',n:0},daily:null,best:{}});
let S=freshSave();
try{
  const s=JSON.parse(localStorage.getItem(STORE)||'{}');
  if(Array.isArray(s.custom))S.custom=s.custom.concat(new Array(NSYM).fill(null)).slice(0,NSYM);
  S.muted=!!s.muted;
  if(s.stars)S.stars=s.stars;
  if(typeof s.coins==='number')S.coins=s.coins;
  if(s.inv)S.inv={hammer:s.inv.hammer|0,mix:s.inv.mix|0,glove:s.inv.glove===undefined?2:s.inv.glove|0,rowhit:s.inv.rowhit===undefined?1:s.inv.rowhit|0,colhit:s.inv.colhit===undefined?1:s.inv.colhit|0};
  if(Array.isArray(s.tips))S.tips=s.tips;
  if(s.lives&&typeof s.lives.n==='number')S.lives={n:s.lives.n,t:s.lives.t||0};
  S.track=s.track|0; S.failed=s.failed|0;
  if(typeof s.amb==='string')S.amb=s.amb; if(s.gloss===false)S.gloss=false; if(typeof s.dim==='number')S.dim=s.dim;
  if(s.fails&&s.fails.level)S.fails={level:s.fails.level|0,n:s.fails.n|0};
  S.gift=s.gift||'';
  if(Array.isArray(s.seen))S.seen=s.seen;
  if(Array.isArray(s.told))S.told=s.told;
  S.streak=s.streak|0;
  if(s.ach)S.ach=s.ach;
  if(s.stat)S.stat=s.stat;
  if(s.diff===0||s.diff===2)S.diff=s.diff;
  if(s.stops)S.stops=s.stops;
  if(s.chestAt>0)S.chestAt=s.chestAt;
  S.wheel=s.wheel||'';
  if(s.login&&s.login.day)S.login={day:s.login.day,n:s.login.n|0};
  if(s.daily&&s.daily.ids)S.daily=s.daily;
  if(s.best)S.best=s.best;
}catch(e){}
function save(){try{localStorage.setItem(STORE,JSON.stringify(S))}catch(e){}}
const face=k=>S.custom[k]||defaults[k];
const unlocked=()=>{let n=1;while(S.stars[n]&&n<TOTAL)n++;return n;};
const starsAll=()=>Object.values(S.stars).reduce((a,b)=>a+b,0);
const stat=(k,n)=>{S.stat[k]=(S.stat[k]||0)+(n===undefined?1:n);};
const chapterDone=ci=>{for(let i=1;i<=PER;i++)if(!S.stars[ci*PER+i])return false;return true;};

/* ---------- chapters and story ---------- */
const CH=[
  {name:'Річка',a:'#12808f',b:'#0a3f52',gem:'Оберіг Води',
   story:'Перший оберіг змило в річку. Течія несе камінці вниз. Збирайте по три однакові, поки не знайдете його.',
   outro:'На дні, під останнім каменем, блиснув Оберіг Води. Річка заспокоїлася, а стежка повела до лісу.'},
  {name:'Ліс',a:'#2f8a55',b:'#12402c',gem:'Оберіг Листя',
   story:'У лісі все заросло мохом, і він ховає сліди. Робіть збіги просто на зелених рамках, щоб його зчистити.',
   outro:'Під корінням старого дуба лежав Оберіг Листя. Мох відступив, попереду засніжені гори.'},
  {name:'Гори',a:'#6a6fb0',b:'#262a55',gem:'Оберіг Вітру',
   story:'Мороз скував каміння товстим льодом, а пастухи покинули тут окуті ящики. І те, і те доведеться бити двічі.',
   outro:'Оберіг Вітру знайшовся на перевалі. Вітер стих і показав вхід до печери.'},
  {name:'Печера',a:'#9a6630',b:'#2e1c10',gem:'Оберіг Глибин',
   story:'У темряві блищать самоцвіти. Самі вони не рухаються. Розчистіть під ними шлях, щоб вони скотилися на дно поля.',
   outro:'Серед самоцвітів засяяв Оберіг Глибин. Підземна ріка винесла вас до моря.'},
  {name:'Море',a:'#2a7fd0',b:'#0a2858',gem:'Оберіг Хвиль',
   story:'На березі хвилі перемішали все: лід, ящики, мох і самоцвіти. Тут знадобляться з\'єднані бонуси.',
   outro:'Приплив викинув на пісок Оберіг Хвиль. Далі дорога йде через болото.'},
  {name:'Болото',a:'#6f8a34',b:'#1f2a12',gem:'Оберіг Туману',
   story:'Багно розповзається. Якщо за хід не прибрати жодної плями, воно захопить сусідній камінець.',
   outro:'З трясовини виринув Оберіг Туману. Попереду димить вулкан.'},
  {name:'Вулкан',a:'#c2452d',b:'#3a0f0a',gem:'Оберіг Вогню',
   story:'Розпечені жарини мають лічильник. Заберіть їх зі збігом раніше, ніж число дійде до нуля.',
   outro:'Останній, Оберіг Вогню, лежав біля самого кратера. Час повертатися на гору.'}
];
const PROLOGUE='На вершині гори стояло Камінне коло: сім оберегів, що тримали погоду в долині. Уночі буря розкидала їх по всьому краю. Ви збирач камінців. Пройдіть від річки до вулкана й поверніть обереги на місце.';
const EPILOGUE='Сім оберегів знову стоять у Камінному колі, і над долиною ясне небо. Мандрівку завершено. Поверніться на рівні, де бракує зірок, щоб зібрати їх усі.';

/* ---------- achievements ---------- */
const ACH=[
  {id:'first',name:'Перший крок',text:'Пройти перший рівень',coins:20,now:()=>S.stars[1]?1:0,need:1},
  {id:'stars30',name:'Зоряна стежка',text:'Зібрати 30 зірок',coins:50,now:starsAll,need:30},
  {id:'stars100',name:'Сузір\'я',text:'Зібрати 100 зірок',coins:150,now:starsAll,need:100},
  {id:'perfect10',name:'Без помилок',text:'Пройти 10 рівнів на три зірки',coins:60,now:()=>Object.values(S.stars).filter(x=>x===3).length,need:10},
  {id:'merge10',name:'Алхімік',text:'З\'єднати два бонуси 10 разів',coins:40,now:()=>S.stat.merge||0,need:10},
  {id:'rainbow5',name:'Після дощу',text:'Створити 5 веселок',coins:40,now:()=>S.stat.rainbow||0,need:5},
  {id:'chain5',name:'Лавина',text:'Зробити комбо ×5',coins:30,now:()=>S.stat.chain||0,need:5},
  {id:'ice100',name:'Криголам',text:'Розбити 100 шарів льоду',coins:40,now:()=>S.stat.ice||0,need:100},
  {id:'crate100',name:'Тесля',text:'Розбити 100 ящиків',coins:40,now:()=>S.stat.crate||0,need:100},
  {id:'gem20',name:'Шукач скарбів',text:'Зібрати 20 самоцвітів',coins:50,now:()=>S.stat.gem||0,need:20},
  {id:'streak5',name:'На хвилі',text:'Виграти 5 рівнів поспіль',coins:50,now:()=>S.stat.bestStreak||0,need:5},
  {id:'all',name:'Камінне коло',text:'Повернути всі сім оберегів',coins:300,now:()=>CH.filter((c,i)=>chapterDone(i)).length,need:CH.length}
];
function checkAch(){
  const got=[];
  for(const a of ACH)if(!S.ach[a.id]&&a.now()>=a.need){S.ach[a.id]=1;S.coins+=a.coins;got.push(a);}
  if(got.length)save();
  return got;
}

/* ---------- levels ---------- */
const MASKS=[null,
  (r,c)=>(r===0||r===7)&&(c===0||c===6),
  (r,c)=>(r+c<2)||(r+6-c<2)||(7-r+c<2)||(13-r-c<2),
  (r,c)=>c===3&&(r===3||r===4),
  (r,c)=>(c===0||c===6)&&(r===3||r===4),
  (r,c)=>r===0&&(c<2||c>4),
  (r,c)=>(r===3||r===4)&&(c===1||c===5)
];
/* shapes for the large 9×9 boards */
const SHAPES=[null,
  (r,c)=>(r+c<2)||(r+8-c<2)||(8-r+c<2)||(16-r-c<2),
  (r,c)=>(r<2||r>6)&&(c<2||c>6),
  (r,c)=>Math.abs(r-4)+Math.abs(c-4)>6,
  (r,c)=>(r===4&&(c<2||c>6))||((r===3||r===5)&&(c<1||c>7)),
  (r,c)=>(r<1||r>7)&&(c<3||c>5)||((r===1||r===7)&&(c<1||c>7)),
  (r,c)=>c===4&&r>1&&r<5,
  (r,c)=>(r===0&&(c===0||c===8||c===4))||(r===8&&(c<2||c>6)),
  (r,c)=>((r===0||r===8)&&(c===0||c===8))||Math.abs(r-4)+Math.abs(c-4)<=1,
  (r,c)=>(r===0&&(c<1||c>7))||(r===3&&(c===2||c===6))||(r>=7&&c>=3&&c<=5)||(r===8&&(c===0||c===8)),
  (r,c)=>((r===2||r===6)&&(c===2||c===6))||(r===4&&c===4)||((r===0||r===8)&&(c===4)),
  (r,c)=>(r<2&&c>=3&&c<=5)||(r>6&&(c<2||c>6))||(r===4&&(c===0||c===8))
];
const TIPS={
  amber:'Бурштин розтікається. Зробіть збіг так, щоб хоч один камінець стояв на бурштині, і він заллє всі клітинки цього збігу. Залийте все поле.',
  frost:'Під кожним камінцем крига. Вона ламається, коли камінець на ній потрапляє у збіг або під удар бонуса. Розбийте всю кригу на полі.',
  gems:'Самоцвіти падають згори. Прибирайте камінці під ними, щоб довести кожен до нижнього краю поля.',
  rock:'Скелю не бере звичайний збіг. Потрібен бонус: стріла, бомба чи юла.',
  fog:'Туман ховає камінці. Він розвіюється від збігу або вибуху поруч.',
  time:'Цей рівень на час: ходи не рахуються, поспішайте.'
};
const INTRO=[null,['moss'],['ice2','crate2'],['gems'],['collect','moss','ice'],['mud'],['ember','collect']];
/* moves a careful player needs on each level, measured by simulated play */
const P75=[3,5,5,5,20,24,8,16,9,10,10,17,7,33,6,22,18,14,24,24,13,13,17,34,18,25,22,18,30,50,19,10,30,24,9,20,22,24,27,25,14,15,11,32,11,24,19,14,33,46,11,19,23,33,27,19,22,26,33,34,11,10,24,32,14,28,34,40,35,31];
function levelDef(n){
  const R=rng(n*977+13), ch=Math.floor((n-1)/PER)%CH.length, i=(n-1)%PER, hard=Math.min(1,(n-1)/60);
  const d={n,ch,kinds:n<=4?4:((ch>=4&&i>=6)||(i===PER-1&&ch>=2))?6:5,mask:0,ice:0,ice2:0,crate:0,crate2:0,moss:0,gems:0,mud:0,ember:0,emberT:0,rock:0,fog:0,hard:0,collect:[],time:0,rows:8,cols:7,amber:0,gemsExtra:0,frost:0,seed:0,pat:0};
  const big=n>10&&i%2===1, sc=big?1.35:1;
  if(big){d.rows=9;d.cols=9;}
  const k1=Math.floor(R()*d.kinds), k2=(k1+1+Math.floor(R()*(d.kinds-1)))%d.kinds;
  const feats=['collect','ice','crate'];
  if(ch>=1)feats.push('moss','gems'); if(ch>=2)feats.push('ice2','crate2','rock');   if(ch>=4)feats.push('fog'); if(ch>=5)feats.push('mud'); if(ch>=6)feats.push('ember');
  let pick;
  if(n===1)pick=['collect']; else if(n===2)pick=['collect','collect2']; else if(n===3)pick=['ice']; else if(n===4)pick=['crate'];
  else if(n===5)pick=['frost'];
  else if(n===6)pick=['amber'];
  else if(n===8)pick=['gems'];
  else if(i===0&&ch>=1)pick=INTRO[ch];
  else if(ch>=1&&i===5){pick=['frost']; if(R()<.5)pick.push(ch>=2&&R()<.5?'rock':'crate');}
  else if(ch>=1&&(i===3||i===8)){
    const blk=['ice','crate']; if(ch>=2)blk.push('ice2','rock'); if(ch>=4)blk.push('fog');
    pick=['amber',blk[Math.floor(R()*blk.length)]];
    if(R()<.4)pick.push(blk[Math.floor(R()*blk.length)]);
    pick=[...new Set(pick)];
  }
  else{
    const pool=feats.slice(); pick=[];
    if(ch>=5&&R()<.55)pick.push(pool.splice(pool.indexOf(ch===5?'mud':'ember'),1)[0]);
    const cnt=Math.min(3,1+(R()<.65?1:0)+(hard>.35&&R()<.4?1:0)+(i===PER-1?1:0));
    while(pick.length<cnt&&pool.length)pick.push(pool.splice(Math.floor(R()*pool.length),1)[0]);
  }
  const q=(base,grow)=>Math.round((base+hard*grow+R()*2)*sc);
  for(const f of pick){
    if(f==='collect')d.collect.push([k1,q(10,8)]);
    if(f==='collect2')d.collect.push([k2,q(9,7)]);
    if(f==='ice'){d.ice=q(5,5);if(n>8&&R()<.55)d.pat=1+Math.floor(R()*3);}
    if(f==='ice2')d.ice2=q(3,3);
    if(f==='crate')d.crate=q(5,5);
    if(f==='crate2')d.crate2=q(3,3);
    if(f==='moss')d.moss=q(8,8);
    if(f==='gems'){d.gems=2;d.gemsExtra=n===8?1:1+Math.round(hard*2);}
    if(f==='amber'){d.amber=1;d.seed=n===6?0:Math.floor(R()*4);}
    if(f==='frost')d.frost=1;
    if(f==='mud')d.mud=q(3,3);
    if(f==='rock')d.rock=q(2,2);
    if(f==='fog')d.fog=q(6,6);
    if(f==='ember'){d.ember=hard>.9?4:3;d.emberT=12-Math.round(R()*2);}
  }
  if(big)d.mask=1+Math.floor(R()*(SHAPES.length-1));
  else if(n>20&&(i===2||i===6))d.mask=1+Math.floor(R()*(MASKS.length-1));
  if(n>10)d.hard=i===PER-1?2:i===4?1:0;
  /* difficulty: the spare moves shrink through the game and inside each chapter,
     then relax a little at the start of the next chapter */
  const prog=Math.min(1,(n-1)/(TOTAL-1)), tight=1.55-.32*prog-.015*i;
  d.moves=Math.max(10,Math.round((Math.round((P75[n-1]||14)*tight)+Math.round(6-3*prog))*[1,.92,.86][d.hard]));
  if(ch>=1&&i===6)d.time=Math.max(60,Math.min(180,Math.round(d.moves*4.5/5)*5));
  return d;
}
