/* app shell for the web, Android and PC builds: offline cache, back button, fullscreen */
(function(){
  if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)&&location.hostname!=='localhost'&&!/RinoApp|Electron/.test(navigator.userAgent)){
    window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
  }
  /* Android back button and Esc on PC: close the top window first, then go home, then leave */
  window.rinoBack=function(){
    const open=[...document.querySelectorAll('.modal.on')];
    if(open.length){const m=open[open.length-1];
      if(m.id==='mini'&&typeof closeMini==='function')closeMini();
      else if(m.id==='story'){const b=document.getElementById('stBtn');if(b)b.click();}
      else m.classList.remove('on');
      return 'ok';}
    if(document.getElementById('intro').classList.contains('on'))return 'ok';
    const ov=document.getElementById('overlay');
    if(!document.getElementById('gameScreen').hidden){const b=document.getElementById('back');if(b)b.click();return 'ok';}
    if(!document.getElementById('mapScreen').hidden){if(typeof toHome==='function')toHome();return 'ok';}
    return 'exit';
  };
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.fullscreenElement){window.rinoBack();}
    if(e.key==='F11'&&document.documentElement.requestFullscreen&&!window.RINO_NATIVE){e.preventDefault();document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen().catch(()=>{});}});
})();
