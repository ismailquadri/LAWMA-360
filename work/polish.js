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
 [...document.body.children].forEach(el=>{if(el.id!=='modalBack'&&el.id!=='toast'&&el.tagName!=='SCRIPT'&&!el.classList.contains('tour-overlay'))el.inert=locked});
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
// Brief skeleton shimmer over the content area on navigation, purely visual: the real
// render below still happens synchronously so focus/scroll calls right after goJourney()/
// renderJourney() keep working; the skeleton just covers the target area for a moment.
function showSkeleton(target){
 if(!target||document.body.classList.contains('tour-open'))return null;
 // Appended to <body> (not the target) and positioned fixed over its rect: the target's
 // innerHTML is about to be replaced synchronously by the real render, which would wipe
 // out a skeleton appended as a child.
 const r=target.getBoundingClientRect();
 const skel=document.createElement('div');skel.className='skeleton-veil';skel.setAttribute('aria-hidden','true');
 skel.style.top=r.top+'px';skel.style.left=r.left+'px';skel.style.width=r.width+'px';skel.style.height=r.height+'px';
 skel.innerHTML='<div class="skeleton-bar w1"></div><div class="skeleton-bar w2"></div><div class="skeleton-bar w3"></div><div class="skeleton-panel"></div>';
 document.body.appendChild(skel);
 const delay=reducedMotion()?120:450+Math.round(Math.random()*150);
 const finish=()=>{if(!skel.isConnected)return;if(reducedMotion()){skel.remove();return}const a=skel.animate([{opacity:1},{opacity:0}],{duration:160,easing:'ease-out'});a.onfinish=()=>skel.remove()};
 setTimeout(finish,delay);
 return skel;
}
const baseGoJourney=goJourney;
goJourney=function(page){const target=page==='fleet'?oldMain:journeyMain;showSkeleton(target);const changed=journey.page!==page;baseGoJourney(page);if(changed)entrance(target)};
let lastSkeletonPage=journey.page;
const baseRenderJourney=renderJourney;
renderJourney=function(){
 if(journey.page!==lastSkeletonPage){showSkeleton(journey.page==='fleet'?oldMain:journeyMain);lastSkeletonPage=journey.page}
 baseRenderJourney();document.querySelectorAll('.journey-steps .current').forEach(el=>el.setAttribute('aria-current','step'));
};
// Quiet and accessible feedback: status text stays available without relying on motion.
$('toast').setAttribute('aria-atomic','true');
$('layersBtn').setAttribute('aria-label','Map display');
$('modalBack').addEventListener('click',e=>{if(e.target===$('modalBack'))closeModal()});
document.addEventListener('keydown',e=>{
 const tab=e.target.closest('[role=tab]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
 e.preventDefault();const tabs=[...tab.parentElement.querySelectorAll('[role=tab]')];let i=tabs.indexOf(tab);i=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;const next=tabs[i].dataset.tab;state.tab=next;renderDetail();$('detail').querySelector('[data-tab="'+next+'"]').focus();
});
if(journey.page==='fleet')ensureFleetMap();
const themeControl=document.createElement('div');themeControl.className='theme-control';themeControl.setAttribute('role','group');themeControl.setAttribute('aria-label','Appearance');themeControl.innerHTML='<button type="button" class="theme-opt" data-appearance="light" aria-label="Light theme" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"/></svg></button><button type="button" class="theme-opt" data-appearance="dark" aria-label="Dark theme" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5a8.5 8.5 0 1 1-9.5-9.4 7 7 0 0 0 9.5 9.4Z"/></svg></button><button type="button" class="theme-opt" data-appearance="system" aria-label="System theme" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z"/></svg></button>';document.querySelector('.account').prepend(themeControl);
let themePreference='system';try{themePreference=localStorage.getItem('lawma-appearance')||'system'}catch{}
const themeMedia=window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme(preference){
 const next=preference==='system'?(themeMedia.matches?'dark':'light'):preference;
 const changed=document.documentElement.dataset.theme!==next;
 document.documentElement.dataset.theme=next;document.documentElement.style.colorScheme=next;
 themeControl.querySelectorAll('.theme-opt').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.appearance===preference)));
 if(changed&&map){const camera={center:map.getCenter(),zoom:map.getZoom()};initMap();map.once('load',()=>{map.stop();map.jumpTo(camera)})}
}
themeControl.addEventListener('click',e=>{const b=e.target.closest('.theme-opt');if(!b)return;themePreference=b.dataset.appearance;try{localStorage.setItem('lawma-appearance',themePreference)}catch{}applyTheme(themePreference);toast('Appearance: '+themePreference)});
themeMedia.addEventListener('change',()=>{if(themePreference==='system')applyTheme('system')});applyTheme(themePreference);
// First-time guided tour: five coach-marks over real controls, dimmed overlay with a
// spotlight cutout. Reuses lockDialogBackground()'s inert approach so background content
// is non-interactive while the tour is open. Gracefully skips any step whose target is
// missing for the current role/view.
const tourSteps=[
 {sel:'#persona',title:'Switch roles',text:'Switch roles to see each team’s workspace.'},
 {sel:'.journey-nav',title:'Every module',text:'Every module of the service, one click away.'},
 {sel:'#journeyGuide',title:'Guided walkthrough',text:'Follow a guided walkthrough of a full collection.'},
 {sel:'.theme-control',title:'Appearance',text:'Light or dark, your choice sticks.'},
 {sel:'#resetJourney',title:'Reset anytime',text:'Start fresh anytime.'}
];
let tourState=null;
function closeTour(){
 if(!tourState)return;
 const {overlay,resize}=tourState;
 window.removeEventListener('resize',resize);document.removeEventListener('keydown',tourKeydown,true);
 lockDialogBackground(false);
 overlay.remove();
 document.body.classList.remove('tour-open');
 if(tourState.lastFocus?.isConnected)tourState.lastFocus.focus();
 tourState=null;
 try{localStorage.setItem('lawma-tour-v1','done')}catch{}
}
function tourKeydown(e){
 if(!tourState)return;
 if(e.key==='Escape'){e.preventDefault();closeTour();return}
 if(e.key==='ArrowRight'){e.preventDefault();tourGo(tourState.index+1);return}
 if(e.key==='ArrowLeft'){e.preventDefault();tourGo(tourState.index-1);return}
 if(e.key==='Tab'){
  const focusables=[...tourState.card.querySelectorAll('button')];
  if(!focusables.length)return;
  const first=focusables[0],last=focusables[focusables.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
 }
}
function tourPlaceCard(target){
 const {card,ring}=tourState;
 const r=target.getBoundingClientRect();
 const pad=8;
 ring.style.top=(r.top-pad)+'px';ring.style.left=(r.left-pad)+'px';ring.style.width=(r.width+pad*2)+'px';ring.style.height=(r.height+pad*2)+'px';
 const cardH=card.offsetHeight||160,cardW=card.offsetWidth||300;
 let top=r.bottom+14;
 if(top+cardH>window.innerHeight-10)top=Math.max(10,r.top-cardH-14);
 let left=Math.min(Math.max(10,r.left),window.innerWidth-cardW-10);
 card.style.top=top+'px';card.style.left=left+'px';
}
function tourGo(index){
 if(!tourState)return;
 const steps=tourState.steps;
 if(index<0)return;
 if(index>=steps.length){closeTour();return}
 let i=index;
 let target=document.querySelector(steps[i].sel);
 while(!target&&i<steps.length-1){i++;target=document.querySelector(steps[i].sel)}
 if(!target){closeTour();return}
 tourState.index=i;
 const step=steps[i];
 const {card}=tourState;
 target.scrollIntoView({block:'center',behavior:reducedMotion()?'auto':'smooth'});
 card.innerHTML='<h2 id="tourTitle">'+esc(step.title)+'</h2><p id="tourText">'+esc(step.text)+'</p><div class="tour-dots">'+steps.map((s,n)=>'<span class="'+(n===i?'on':'')+'"></span>').join('')+'</div><div class="tour-actions">'+(i>0?'<button type="button" class="btn" data-tour="back">Back</button>':'')+'<button type="button" class="text-action" data-tour="skip">Skip</button><button type="button" class="btn primary" data-tour="next">'+(i===steps.length-1?'Done':'Next')+'</button></div>';
 requestAnimationFrame(()=>{tourPlaceCard(target);card.querySelector('[data-tour="next"]')?.focus()});
}
function startTour(){
 if(tourState)return;
 const steps=tourSteps.filter(s=>document.querySelector(s.sel));
 if(!steps.length)return;
 const overlay=document.createElement('div');overlay.className='tour-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','tourTitle');overlay.setAttribute('aria-describedby','tourText');
 overlay.innerHTML='<div class="tour-ring"></div><div class="tour-card"></div>';
 document.body.append(overlay);
 document.body.classList.add('tour-open');
 lockDialogBackground(true);
 const resize=()=>{if(tourState)tourPlaceCard(document.querySelector(tourState.steps[tourState.index].sel))};
 window.addEventListener('resize',resize);
 document.addEventListener('keydown',tourKeydown,true);
 overlay.addEventListener('click',e=>{const b=e.target.closest('[data-tour]');if(b){if(b.dataset.tour==='back')tourGo(tourState.index-1);else if(b.dataset.tour==='skip')closeTour();else tourGo(tourState.index+1);return}if(e.target===overlay)closeTour()});
 tourState={overlay,ring:overlay.querySelector('.tour-ring'),card:overlay.querySelector('.tour-card'),resize,steps,index:0,lastFocus:document.activeElement};
 tourGo(0);
}
function maybeStartTour(){
 let done=false;try{done=localStorage.getItem('lawma-tour-v1')==='done'}catch{}
 if(!done)startTour();
}
const tourBtn=document.getElementById('lawmaTourBtn');
if(tourBtn)tourBtn.onclick=()=>{try{localStorage.removeItem('lawma-tour-v1')}catch{}startTour()};
