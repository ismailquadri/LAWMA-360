/* iOS-inspired app shell; installable web demo, not a native iOS binary. */
const standaloneMobile=location.pathname.replace(/\/+$/,'')==='/mobile';document.body.classList.toggle('ios-app',standaloneMobile);document.body.classList.toggle('desktop-app',!standaloneMobile);
defs.insertAdjacentHTML('beforeend','<symbol id="i-home" viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v11h-6v-7H9v7H3Z"/></symbol><symbol id="i-bell" viewBox="0 0 24 24"><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5ZM10 21h4M12 2v2"/></symbol><symbol id="i-more" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></symbol>');
document.querySelector('meta[name=viewport]').content='width=device-width, initial-scale=1, viewport-fit=cover';
document.title='SmartWaste360';
const appTabs=document.createElement('nav');appTabs.className='app-tabs';appTabs.setAttribute('aria-label','App navigation');document.body.append(appTabs);
const appMenu=()=>{
 drawer('Workspaces',`<div class="app-menu">${journeyNav.filter(([p])=>permitted(p)).map(([p,label,ic])=>`<button data-module="app-go" data-record="${p}">${icon(ic)}<span>${esc(label)}</span>${icon('arrow')}</button>`).join('')}</div><div class="app-menu-foot">${simBtn('Install this app','install')}<p>Demonstration data · no live LAWMA connections</p></div>`);
};
function mobileTabs(){
 const home=journeyRoles[journey.role][1];
 const work=permitted('serviceLedger')?'serviceLedger':permitted('care')?'care':permitted('recovery')?'recovery':home;
 const nav=[[home,'Home','home'],[work,'Work','file'],[permitted('fleet')?'fleet':permitted('cameras')?'cameras':'resident',permitted('fleet')?'Map':permitted('cameras')?'Cameras':'Service','map'],['alerts','Inbox','bell'],['more','More','more']];
 const seen=new Set();
 appTabs.innerHTML=nav.filter(([p])=>{if(seen.has(p)||p!=='more'&&!permitted(p))return false;seen.add(p);return true}).map(([p,label,ic])=>`<button data-module="${p==='more'?'app-menu':'app-go'}" data-record="${p}" ${journey.page===p?'aria-current="page"':''}>${icon(ic)}<span>${label}</span>${p==='alerts'&&visibleNotices().some(n=>!n.read)?'<i class="app-unread" aria-label="Unread notifications"></i>':''}</button>`).join('');
}
const mobileRender=renderJourney;
renderJourney=function(){mobileRender();mobileTabs()};
const mobileAction=runModule;
runModule=function(cmd,id){
 if(cmd==='app-menu'){appMenu();return}
 if(cmd==='app-go'){closeModal();goJourney(id);return}
 if(cmd==='sim-install'){
  drawer('Add SmartWaste360 to your Home Screen','<div class="install-steps"><p>On your iPhone, open the shared app URL in Safari.</p><ol><li>Tap the <b>Share</b> button.</li><li>Choose <b>Add to Home Screen</b>.</li><li>Keep the name <b>SmartWaste360</b> and tap <b>Add</b>.</li></ol><p>Launch from the icon for a standalone app window.</p></div>'+note('Installation requires a deployed HTTPS URL. This localhost preview is accessible only on this computer. The sample workflows can be cached; street-map tiles still need internet access.'));return;
 }
 mobileAction(cmd,id);
};
const demoCode=document.createElement('div');demoCode.className='app-access';demoCode.innerHTML='<label for="demoAccess">Demo access code</label><div><input id="demoAccess" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="246810" autocomplete="off" aria-describedby="demoAccessHint"><button class="btn" type="button" id="useDemoCode">Use demo code</button></div><small id="demoAccessHint">Use 246810 to preview sign-in. No real credentials needed.</small><p id="accessError" role="alert" hidden>Enter the demonstration code 246810.</p>';
$('entryForm').querySelector('button[type=submit]').before(demoCode);
$('useDemoCode').onclick=()=>{$('demoAccess').value='246810';$('accessError').hidden=true};
const enterWorkspace=$('entryForm').onsubmit;
$('entryForm').onsubmit=e=>{if($('demoAccess').value!=='246810'){e.preventDefault();$('accessError').hidden=false;$('demoAccess').focus();return}sim.signedIn=true;enterWorkspace(e);recordModuleAction('Demonstration sign-in: '+journeyRoles[journey.role][0])};
document.querySelector('.entry-note').textContent='Use the demo code to explore a role. All records, payments, camera scenes and alerts are simulated. No real account is created.';
document.querySelector('.entry-form h2').textContent='Welcome to SmartWaste360';
document.querySelector('.entry-form>p').textContent='Choose your role to begin.';
// Offline shell caching applies only to the local app. External map assets are not cached here.
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
mobileTabs();
function mobileRecordLists(root){
 root.querySelectorAll('.table-scroll table').forEach(t=>{
  const labels=[...t.querySelectorAll('thead th')].map(x=>x.textContent.trim());t.classList.add('mobile-records');t.setAttribute('role','table');
  t.querySelectorAll('tr').forEach(r=>r.setAttribute('role','row'));
  t.querySelectorAll('th').forEach(th=>th.setAttribute('role','columnheader'));
  t.querySelectorAll('tbody tr').forEach(r=>{[...r.children].forEach((c,i)=>{c.dataset.label=labels[i]||'';c.setAttribute('role','cell');if(c.querySelector('button'))c.classList.add('record-action')})});
 });
}
const listRender=renderJourney;
renderJourney=function(){listRender();mobileRecordLists(journeyMain)};
const sheetDialog=dialog;
dialog=function(...args){sheetDialog(...args);mobileRecordLists($('modal'))};
