// Motion supports orientation; reduced-motion users receive immediate state changes.
const reducedMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function entrance(el,kind='page'){
 if(!el||reducedMotion())return;
 el.getAnimations().forEach(a=>a.cancel());
 const from=kind==='drawer'?{opacity:0,transform:'translateX(22px)'}:kind==='modal'?{opacity:0,transform:'translateY(12px) scale(.985)'}:{opacity:0,transform:'translateY(7px)'};
 el.animate([from,{opacity:1,transform:'none'}],{duration:kind==='page'?190:230,easing:'cubic-bezier(.2,.8,.2,1)'});
}
let mapBootPromise;
function ensureFleetMap(){
 if(map){map.resize();return Promise.resolve()}
 if(mapBootPromise)return mapBootPromise;
 $('mapLoading').hidden=false;$('map').setAttribute('aria-busy','true');
 mapBootPromise=new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
  try{
   if(!window.maplibregl){const script=document.createElement('script');script.textContent=$('mapEngineSource').textContent;document.head.append(script);script.remove()}
   initMap();resolve();
  }catch(err){$('mapError').hidden=false;$('mapLoading').hidden=true;$('map').setAttribute('aria-busy','false');mapBootPromise=null;resolve()}
 })));
 return mapBootPromise;
}
function lockDialogBackground(locked){
 document.body.classList.toggle('dialog-open',locked);
 [...document.body.children].forEach(el=>{if(el.id!=='modalBack'&&el.id!=='toast'&&el.tagName!=='SCRIPT')el.inert=locked});
}
let modalExit;
const baseDialog=dialog;
dialog=function(title,content,footer=''){
 if(modalExit){modalExit.cancel();modalExit=null}
 $('modalBack').getAnimations().forEach(a=>a.cancel());
 baseDialog(title,content,footer);lockDialogBackground(true);
 entrance($('modal'),'modal');
 if(!reducedMotion())$('modalBack').animate([{opacity:0},{opacity:1}],{duration:150});
};
closeModal=function(){
 if($('modalBack').hidden||modalExit)return;
 const finish=()=>{$('modalBack').hidden=true;lockDialogBackground(false);modalExit=null;if(lastFocus?.isConnected)lastFocus.focus();else document.querySelector('main:not([hidden]) h1')?.focus()};
 if(reducedMotion()){finish();return}
 modalExit=$('modalBack').animate([{opacity:1},{opacity:0}],{duration:130,easing:'ease-out'});modalExit.onfinish=finish;
};
const baseRenderDetail=renderDetail;
renderDetail=function(){const opening=$('detail').hidden;baseRenderDetail();if(opening&&!$('detail').hidden)entrance($('detail'),'drawer')};
const baseCloseDetail=closeDetail;
let drawerExit;
closeDetail=function(){
 if($('detail').hidden||reducedMotion()){baseCloseDetail();return}
 // Clear selection immediately; animate a non-interactive visual copy during exit.
 const ghost=$('detail').cloneNode(true);ghost.removeAttribute('id');ghost.setAttribute('aria-hidden','true');ghost.inert=true;ghost.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));$('detail').after(ghost);baseCloseDetail();
 const a=ghost.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateX(18px)'}],{duration:140,easing:'ease-out'});a.onfinish=()=>ghost.remove();
};
const baseGoJourney=goJourney;
goJourney=function(page){const changed=journey.page!==page;baseGoJourney(page);if(changed)entrance(page==='fleet'?oldMain:journeyMain)};
const baseRenderJourney=renderJourney;
renderJourney=function(){baseRenderJourney();document.querySelectorAll('.journey-steps .current').forEach(el=>el.setAttribute('aria-current','step'))};
// Quiet and accessible feedback: status text stays available without relying on motion.
$('toast').setAttribute('aria-atomic','true');
$('layersBtn').setAttribute('aria-label','Map display');
$('modalBack').addEventListener('click',e=>{if(e.target===$('modalBack'))closeModal()});
document.addEventListener('keydown',e=>{
 const tab=e.target.closest('[role=tab]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
 e.preventDefault();const tabs=[...tab.parentElement.querySelectorAll('[role=tab]')];let i=tabs.indexOf(tab);i=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;const next=tabs[i].dataset.tab;state.tab=next;renderDetail();$('detail').querySelector('[data-tab="'+next+'"]').focus();
});
if(journey.page==='fleet')ensureFleetMap();
const themeControl=document.createElement('label');themeControl.className='theme-control';themeControl.innerHTML='<span class="sr">Appearance</span><svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z"/></svg><select id="appearance" aria-label="Appearance"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select>';document.querySelector('.account').prepend(themeControl);
let themePreference='system';try{themePreference=localStorage.getItem('lawma-appearance')||'system'}catch{}
const themeMedia=window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme(preference){
 const next=preference==='system'?(themeMedia.matches?'dark':'light'):preference;
 const changed=document.documentElement.dataset.theme!==next;
 document.documentElement.dataset.theme=next;document.documentElement.style.colorScheme=next;
 $('appearance').value=preference;
 if(changed&&map){const camera={center:map.getCenter(),zoom:map.getZoom()};initMap();map.once('load',()=>{map.stop();map.jumpTo(camera)})}
}
$('appearance').onchange=e=>{themePreference=e.target.value;try{localStorage.setItem('lawma-appearance',themePreference)}catch{}applyTheme(themePreference);toast('Appearance: '+themePreference)};
themeMedia.addEventListener('change',()=>{if(themePreference==='system')applyTheme('system')});applyTheme(themePreference);
