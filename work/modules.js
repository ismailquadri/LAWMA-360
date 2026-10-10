/* LAWMA workspaces. Local presentation workflows; all operational writes stay in this tab. */
(() => {
'use strict';
const legacyRender=renderJourney, legacyGo=goJourney, legacyRun=runJourney;
const ui={partnerQuery:'',partnerType:'All categories',assetTab:'Vehicles',incidentFilter:'Open',facility:'FAC-001'};
const screens={};
const visibleFacilities=()=>modules.facilities.filter(f=>journey.role!=='partner'||f.partner===modules.partnerContext);
const visibleVisits=()=>modules.visits.filter(v=>visibleFacilities().some(f=>f.id===v.facility));
const stamp=value=>new Date(value).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
const button=(label,cmd,id='',primary=false)=>`<button class="btn ${primary?'primary':''}" data-module="${cmd}" data-record="${esc(id)}">${esc(label)}</button>`;
const link=(label,cmd,id)=>`<button class="text-action" data-module="${cmd}" data-record="${esc(id)}">${esc(label)} ${icon('arrow')}</button>`;
const status=s=>pill(esc(s),['Active','Resolved','Completed','Approved','Available'].includes(s)?'good':['Open','High','Pending review','Awaiting verification','Over capacity'].includes(s)?'amber':'');
const empty=(title,body,cta='')=>`<div class="empty-state"><div><strong>${esc(title)}</strong><small>${esc(body)}</small>${cta}</div></div>`;
const selectOptions=(values,selected)=>values.map(v=>{const x=typeof v==='string'?{value:v,label:v}:v;return `<option value="${esc(x.value)}" ${x.value===selected?'selected':''}>${esc(x.label)}</option>`}).join('');
const partnerOptions=(filter=()=>true)=>modules.partners.filter(filter).map(p=>({value:p.id,label:p.name+' · '+p.type}));
const field=(id,label,extra={})=>({id,label,...extra});
const textField=(id,label,value='')=>field(id,label,{value});
const saveAndRender=message=>{saveModules();renderJourney();toast(message)};
const moduleFooter='<footer class="journey-footer"><span>Prepared for LAWMA · Fastspeed Solutions Limited</span><span>Sample data · changes saved on this device</span></footer>';

journeyRoles.partner=['Partner coordinator','partner','Organisation records, service responsibilities and follow-ups'];
journeyRoles.psp[0]='Collection dispatcher (PSP)';
journeyRoles.admin[2]='Users, partner categories and activity history';
const pages=['overview','partners','registry','fleet','dispatch','facility','capacity','incidents','compliance','finance','care','connectedService','enforcement','recovery','systems'];
personaPages.management=[...pages,'crew'];
personaPages.admin=[...pages,'crew'];
personaPages.operations=['overview','partners','registry','fleet','dispatch','facility','capacity','incidents','compliance','care'];
personaPages.partner=['partner','incidents'];
personaPages.psp=['partner','dispatch','fleet','crew','incidents'];
personaPages.facility=['facility','capacity','incidents'];
personaPages.enforcement=['enforcement','compliance','incidents'];
personaPages.recovery=['recovery','partners','incidents'];
personaPages.care=['care','incidents','finance'];
personaPages.resident=['resident'];
journeyNav.splice(0,journeyNav.length,...[
 ['overview','Overview','layers'],['partners','Partners','partners'],['partner','My organisation','partners'],['registry','People & vehicles','truck'],
 ['fleet','Fleet map','map'],['dispatch','Collection operations','truck'],['crew','Field shift','pin'],['facility','Facility intake','layers'],
 ['capacity','Site capacity','capacity'],['incidents','Incidents','alert'],['compliance','Compliance','check'],['finance','Revenue','file'],
 ['care','Citizen care','help'],['enforcement','Enforcement','alert'],['recovery','Recovery','recycle'],['resident','My service','help'],['systems','Administration','settings']
]);
const defs=document.querySelector('.symbols defs');
defs.insertAdjacentHTML('beforeend','<symbol id="i-partners" viewBox="0 0 24 24"><path d="M3 21V5h11v16M14 10h7v11M6 9h5M6 13h5M6 17h5M17 14h1M17 18h1M1 21h22"/></symbol><symbol id="i-capacity" viewBox="0 0 24 24"><path d="M3 21V9l9-6 9 6v12M7 21v-9h10v9M10 12v9M14 12v9M3 21h18"/></symbol><symbol id="i-recycle" viewBox="0 0 24 24"><path d="m9 5 3-3 6 9M14 10l4 1 2-4M20 14v5H9M11 16l-2 3 2 3M5 18l-3-4 6-9M4 5h4l1 4"/></symbol><symbol id="i-settings" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="9" cy="18" r="2"/></symbol>');
$('persona').innerHTML=Object.entries(journeyRoles).map(([id,r])=>`<option value="${id}">${esc(r[0])}</option>`).join('');
document.querySelector('.product').textContent='LAWMA 360';

function permitted(page){return (personaPages[journey.role]||[]).includes(page)}
function validateModuleFields(fields,data){
 for(const f of fields){
  const value=data[f.id];
  if(f.optional&&(value===undefined||value===''))continue;
  if(f.options&&!f.options.some(o=>String(typeof o==='string'?o:o.value)===value))return 'Choose a valid '+f.label.toLowerCase()+'.';
  if(f.type==='number'){
   const n=Number(value),min=f.min??0,max=f.max??100000,step=f.step??1;
   if(!Number.isFinite(n)||n<min||n>max)return f.label+' must be between '+min+' and '+max+'.';
   if(step!=='any'&&Math.abs((n-min)/Number(step)-Math.round((n-min)/Number(step)))>0.000001)return 'Use increments of '+step+' for '+f.label.toLowerCase()+'.';
  }
 }
 return null;
}
const plateKey=value=>String(value).toUpperCase().replace(/[^A-Z0-9]/g,'');
function openForm(title,intro,fields,submit,onSave){
  $('modalBack').classList.remove('drawer-back');
  const content=fields.map(f=>{
    const req=f.optional?'':'required';
    const attrs=`id="mf-${f.id}" name="${f.id}" ${req}`;
    let control=f.options?`<select ${attrs}>${selectOptions(f.options,f.value)}</select>`:
      f.type==='textarea'?`<textarea ${attrs} rows="3" maxlength="1200">${esc(f.value||'')}</textarea>`:
      f.type==='checkbox'?`<input ${attrs} type="checkbox" ${f.value?'checked':''}>`:
      `<input ${attrs} type="${f.type||'text'}" value="${esc(f.value??'')}" ${f.type==='number'?`min="${f.min??0}" max="${f.max??100000}" step="${f.step||1}"`:'maxlength="180"'}>`;
    return `<div class="module-field"><label for="mf-${f.id}">${esc(f.label)}${f.optional?' <small>(optional)</small>':''}</label>${control}${f.help?`<small>${esc(f.help)}</small>`:''}</div>`;
  }).join('');
  dialog(title,`<p>${esc(intro)}</p><form id="moduleForm">${content}<p class="error-text" id="moduleError" role="alert" hidden><span class="form-error-art">${swGlyph('sw-warning-scale',22)}</span><span id="moduleErrorText"></span></p><div class="form-footer"><button class="btn" type="button" data-module="cancel">Cancel</button><button type="submit" class="btn primary">${esc(submit)}</button></div></form>`);
  $('moduleForm').onsubmit=e=>{
    e.preventDefault();
    const data=Object.fromEntries([...new FormData(e.target)].map(([k,v])=>[k,typeof v==='string'?v.trim():v]));
    let error=fields.some(f=>!f.optional&&!data[f.id])?'Complete all required fields.':null;
    if(!error)error=validateModuleFields(fields.map(f=>f.options?{...f,options:[...e.target.elements.namedItem(f.id).options].map(o=>o.value)}:f),data);
    if(!error)error=onSave(data);
    if(error){$('moduleErrorText').textContent=error;$('moduleError').hidden=false;$('moduleError').tabIndex=-1;$('moduleError').focus();return}
    saveModules();closeModal();renderJourney();toast('Saved to this demonstration.');
  };
  $('moduleForm').querySelector('input,select,textarea')?.focus();
}
function drawer(title,body){dialog(esc(title),body);$('modalBack').classList.add('drawer-back');entrance($('modal'),'drawer')}
const moduleDialogBase=dialog;
dialog=function(...args){$('modalBack').classList.remove('drawer-back');return moduleDialogBase(...args)};

function partnerRows(){
 const q=ui.partnerQuery.toLowerCase();const found=modules.partners.filter(p=>(ui.partnerType==='All categories'||p.type===ui.partnerType)&&[p.id,p.name,p.type,p.area].join(' ').toLowerCase().includes(q));
 return found.length?table(['Organisation','Category / responsibility','Service area','Status',''],found.map(p=>[
 `<b>${esc(p.name)}</b><small class="cell-sub">${p.id}</small>`,`${esc(p.type)}<small class="cell-sub">${esc(p.service)}</small>`,esc(p.area),status(p.status),link('View partner','partnerDetail',p.id)
 ])):empty('No matching partners','Change the search or category to see more organisations.');
}
screens.partners=()=>pageHead('PARTNER MANAGEMENT','One authority. Many partners.','Manage each organisation by its role, service area and responsibilities.',canMaintain()?button('Register partner','registerPartner','',true):'')+
 stats([['Registered partners',modules.partners.length,'All organisation categories'],['PSP partners',modules.partners.filter(p=>p.type==='PSP').length,'Collection is one service responsibility'],['Other partners',modules.partners.filter(p=>p.type!=='PSP').length,'Recovery, facilities, transport and support'],['Awaiting review',modules.partners.filter(p=>p.status==='Pending review').length,'Registration checks pending']])+
 panel('Partner directory','Illustrative categories can be managed in Administration.',`<div class="module-toolbar"><label class="module-search"><span class="sr">Search partners</span>${icon('search')}<input id="partnerQuery" aria-label="Search partners" placeholder="Search name, reference or area" value="${esc(ui.partnerQuery)}"></label><label><span class="sr">Partner category</span><select id="partnerType" aria-label="Partner category">${selectOptions(['All categories',...modules.categories],ui.partnerType)}</select></label></div><div id="partnerRows">${partnerRows()}</div>`);

function partnerDetail(id){
 const p=partnerByID(id);if(!p)return;
 const vehicles=partnerFleet(id),people=modules.personnel.filter(x=>x.partner===id),issues=modules.incidents.filter(x=>x.partner===id&&x.status!=='Resolved');
 drawer(p.name,`<div class="drawer-intro">${status(p.status)}<span>${esc(p.id)}</span></div>`+rowKV('Partner category',esc(p.type))+rowKV('Service responsibility',esc(p.service))+rowKV('Service area',esc(p.area))+rowKV('Registration reference',esc(p.reference))+rowKV('Coordinator',esc(p.contact))+
 `<h3>Organisation records</h3>`+stats([['Vehicles',vehicles.length,'Linked fleet records'],['People',people.length,'Registered personnel'],['Open incidents',issues.length,'Assigned to this organisation']])+
 `<div class="drawer-actions">${canMaintain()?button('Edit details','editPartner',p.id):''}${canMaintain()&&p.status==='Pending review'?button('Review registration','approvePartner',p.id,true):''}${isAuthority()?button('Add person','addPerson',p.id):''}${isAuthority()&&['Collection','Transport'].includes(p.service)?button('Register vehicle','addVehicle',p.id):''}${button('Record incident','newIncident',p.id)}</div>`+
 note(p.type==='PSP'?'PSP is a partner category. Collection workflows apply to organisations with the Collection responsibility.':'This organisation uses its own service responsibility; collection routes and customer billing do not automatically apply.')+
 (issues.length?table(['Open incident','Status'],issues.map(x=>[link(x.id,'incidentDetail',x.id),status(x.status)])):'')
 );
}

screens.registry=()=>{
 const isVehicles=ui.assetTab==='Vehicles';const records=isVehicles?modules.vehicleRecords:modules.personnel;
 return pageHead('PARTNER RESOURCES','People and vehicles','Keep personnel and vehicle registrations linked to the responsible organisation.',isAuthority()?button(isVehicles?'Register vehicle':'Add person',isVehicles?'addVehicle':'addPerson','',true):'')+
 `<div class="module-tabs" role="group" aria-label="Resource type">${['Vehicles','Personnel'].map(t=>`<button class="btn ${t===ui.assetTab?'primary':''}" data-module="assetTab" data-record="${t}" aria-pressed="${t===ui.assetTab}">${t}</button>`).join('')}</div>`+
 (isVehicles?stats([['Fleet snapshot',fleet.length,'Demonstration vehicle positions'],['Registration records',records.length,'Added through this workflow'],['Partner organisations',modules.partners.filter(p=>['Collection','Transport'].includes(p.service)).length,'Transport or collection responsibility']]):'')+
 panel(isVehicles?'Vehicle registration records':'Personnel register',isVehicles?'GPS snapshot vehicles can be linked by fleet ID. Plates are entered manually.':'Personnel belong to their organisation, including non-PSP partners.',records.length?table(isVehicles?['Fleet ID','Registration plate','Organisation','Class','']:['Person','Organisation','Role','Status',''],records.map(r=>isVehicles?[esc(r.vehicle),esc(r.plate),esc(partnerName(r.partner)),esc(r.kind),link('View','vehicleRecord',r.id)]:[esc(r.name),esc(partnerName(r.partner)),esc(r.role),status(r.status),link('Edit','editPerson',r.id)])):empty('No registration records yet','Add a registration to link a plate to an existing fleet vehicle.'));
};

screens.partner=()=>{
 const p=currentPartner(),issues=modules.incidents.filter(i=>i.partner===p.id&&i.status!=='Resolved');
 const tasks=p.service==='Collection'?routeButton('Open collection operations','dispatch'):p.service==='Recovery'?routeButton('Open material register','recovery'):p.service==='Facility operations'?routeButton('Open facility intake','facility'):button('View organisation','partnerDetail',p.id);
 return pageHead('PARTNER WORKSPACE',esc(p.name),'Your organisation’s responsibilities, records and follow-ups.',button('View organisation','partnerDetail',p.id))+
 `<div class="module-toolbar"><label for="partnerContext">Preview organisation</label><select id="partnerContext">${selectOptions(partnerOptions(),p.id)}</select><span class="module-hint">Demonstration organisation switch</span></div>`+
 stats([['Category',esc(p.type),esc(p.service)],['Service area',esc(p.area),'Illustrative assignment'],['Status',p.status,'Registration review'],['Open follow-ups',issues.length,'For this organisation']])+
 panel('Service workspace','Available actions follow the organisation’s responsibility.',`<div class="module-pad">${p.status==='Active'?tasks:note('Registration must be reviewed before operational assignments are enabled.')}</div>`)+
 panel('Your open incidents','Update progress and submit a resolution for authority review.',issues.length?table(['Reference','Issue','Priority','Status',''],issues.map(i=>[i.id,esc(i.type),status(i.priority),status(i.status),link('Open','incidentDetail',i.id)])):empty('No open follow-ups','New assignments will appear here.'));
};

function facilityPanel(f){const n=occupancy(f),over=n>f.capacity;
 return `<article class="site-card"><div class="site-heading"><div><small>${esc(f.kind)} · ${f.id}</small><h2>${esc(f.name)}</h2></div>${status(over?'Over capacity':n===f.capacity?'At capacity':'Within capacity')}</div><div class="site-count"><strong>${n}<span> / ${f.capacity}</span></strong><span>vehicles present</span></div><meter min="0" max="${Math.max(n,f.capacity)}" value="${n}" optimum="0" high="${f.capacity}" aria-label="${esc(f.name)} occupancy">${n}</meter><div class="site-footer"><span>Expected: <b>${f.expected}</b>${over?' · '+(n-f.capacity)+' above capacity':''}</span>${link('Open site','siteDetail',f.id)}</div></article>`;
}
screens.capacity=()=>pageHead('FACILITY OVERSIGHT','See pressure before it builds.','Manual occupancy counts and vehicle visits, with clear escalation ownership.',button('Record vehicle arrival','arrival','',true))+
 stats([['Sites',visibleFacilities().length,'Illustrative facilities'],['Vehicles present',visibleFacilities().reduce((n,f)=>n+occupancy(f),0),'Baseline count plus open visits'],['Over capacity',visibleFacilities().filter(f=>occupancy(f)>f.capacity).length,'Requires supervisor attention'],['Open visits',visibleVisits().filter(v=>!v.departed).length,'Recorded in this session']])+
 `<div class="site-grid">${visibleFacilities().map(f=>facilityPanel(f)).join('')}</div>`+
 note('Occupancy is manually recorded. These sample capacities and site names require LAWMA validation. Location data alone does not prove entry or disposal.')+
 panel('Vehicle visit register','Arrival → on site → departure. Historical baseline vehicles are counted but not individually identified.',visibleVisits().length?table(['Visit / site','Vehicle / partner','Arrived','Status',''],visibleVisits().map(v=>[`${v.id}<small class="cell-sub">${esc(visibleFacilities().find(f=>f.id===v.facility)?.name||'')}</small>`,`${esc(v.vehicle)}<small class="cell-sub">${esc(partnerName(v.partner))}</small>`,stamp(v.arrived),status(v.departed?'Departed':'On site'),v.departed?stamp(v.departed):button('Record departure','departure',v.id)])):empty('No individual visits recorded','Record an arrival to build a traceable visit history.'));

function siteDetail(id){const f=visibleFacilities().find(f=>f.id===id);if(!f)return;
 const visits=visibleVisits().filter(v=>v.facility===id&&!v.departed);
 drawer(f.name,facilityPanel(f)+rowKV('Baseline manual count',f.baseline)+rowKV('Open recorded visits',visits.length)+rowKV('Observation source','Manual demonstration records')+
 `<div class="drawer-actions">${button('Record arrival','arrival',id,true)}${button('Raise incident','siteIncident',id)}${isAuthority()?button('Edit site settings','editSite',id):''}</div>`+
 (visits.length?table(['Vehicle','Arrival',''],visits.map(v=>[esc(v.vehicle),stamp(v.arrived),button('Departure','departure',v.id)])):empty('No individually recorded vehicles','The baseline count is an aggregate. Register new arrivals to identify vehicles.')));
}

const visibleIncidents=()=>modules.incidents.filter(i=>!['partner','psp'].includes(journey.role)||i.partner===modules.partnerContext);
screens.incidents=()=>{
 const all=visibleIncidents(),rows=all.filter(i=>ui.incidentFilter==='All'||(ui.incidentFilter==='Open'?i.status!=='Resolved':i.status==='Resolved'));
 return pageHead('OPERATIONS FOLLOW-UP','Every exception has an owner.','Record the issue, assign responsibility and confirm the outcome.',button('Record incident','newIncident','',true))+
 stats([['Open',all.filter(i=>i.status!=='Resolved').length,'Including assigned and in progress'],['High priority',all.filter(i=>i.priority==='High'&&i.status!=='Resolved').length,'Open incidents'],['Awaiting verification',all.filter(i=>i.status==='Awaiting verification').length,'Authority review required'],['Resolved',all.filter(i=>i.status==='Resolved').length,'Outcome recorded']])+
 panel('Incident register','Partner follow-ups remain linked to the organisation.',`<div class="module-toolbar"><label for="incidentFilter">Show</label><select id="incidentFilter">${selectOptions(['Open','Resolved','All'],ui.incidentFilter)}</select></div>`+(rows.length?table(['Reference / issue','Linked record','Responsible partner','Priority','Owner / status',''],rows.map(i=>[`${i.id}<small class="cell-sub">${esc(i.type)}</small>`,esc(i.subject),esc(partnerName(i.partner)),status(i.priority),`${esc(i.owner)}<small class="cell-sub">${status(i.status)}</small>`,link('Review','incidentDetail',i.id)])):empty('No incidents in this view','Choose another status or record an operational issue.')));
};
function incidentDetail(id){const i=visibleIncidents().find(x=>x.id===id);if(!i){toast('This incident is outside the current workspace.');return}
 drawer(i.id+' · '+i.type,`<div class="drawer-intro">${status(i.status)}${status(i.priority)}</div><p>${esc(i.description)}</p>`+rowKV('Linked record',esc(i.subject))+rowKV('Partner',esc(partnerName(i.partner)))+rowKV('Owner',esc(i.owner))+rowKV('Created',stamp(i.created))+
 `<div class="drawer-actions">${i.status!=='Resolved'?button('Update progress','updateIncident',id,true):''}</div>`+
 (i.resolution?`<h3>Resolution submitted</h3><p>${esc(i.resolution)}</p>`:'')+
 `<h3>Case history</h3><ol class="module-timeline"><li>Incident recorded<small>${stamp(i.created)}</small></li>${i.notes.map(n=>`<li>${esc(n.text)}<small>${esc(n.actor)} · ${stamp(n.time)}</small></li>`).join('')}</ol>`);
}

screens.compliance=()=>pageHead('COMPLIANCE REVIEW','Evidence, decisions and accountability.','Review partner performance against proposed rules. Record an accountable human decision.',button('Start partner review','newReview','',true))+
 panel('Policy register','Draft review rules. No automated penalties are issued.',table(['Rule','When to review','Response','Status'],modules.policies.map(p=>[esc(p.name),esc(p.trigger),esc(p.response),status(p.status)])))+
 panel('Partner reviews','Each decision retains its supporting note and reviewer.',modules.reviews.length?table(['Reference','Partner','Finding','Decision',''],modules.reviews.map(r=>[r.id,esc(partnerName(r.partner)),esc(r.finding),status(r.status),link('Open review','reviewDetail',r.id)])):empty('No reviews recorded','Start a review using service records or a linked incident.'));

screens.systems=()=>pageHead('ADMINISTRATION','Manage access and operating records.','Maintain demonstration users, partner categories and a visible activity history.',button('Add demo user','addUser','',true))+
 `<div class="journey-grid wide">`+panel('Users and workspace roles','Presentation profiles; these do not create authenticated accounts.',table(['Name','Role','Status',''],modules.users.map(u=>[esc(u.name),esc(journeyRoles[u.role]?.[0]||u.role),status(u.status),button('Edit','editUser',u.id)])))+
 panel('Partner categories','Proposed classifications, editable as LAWMA confirms its partner landscape.',`<div class="category-list">${modules.categories.map(c=>`<span>${esc(c)}</span>`).join('')}</div>`+button('Add category','addCategory'))+'</div>'+
 panel('Workspace access','Navigation boundaries are demonstrated in the interface; production authorization is not implemented.',table(['Persona','Available workspaces'],Object.entries(personaPages).map(([role,p])=>[esc(journeyRoles[role][0]),p.map(x=>journeyNav.find(n=>n[0]===x)?.[1]||x).join(' · ')])))+
 panel('Activity history','Local session activity, including partner and operational changes.',modules.audit.length||journey.audit.length?table(['When','Actor view','Action'],[...modules.audit.map(a=>[stamp(a.time),esc(a.actor),esc(a.text)]),...journey.audit.map(a=>[esc(a.time),esc(a.role),esc(a.text)])]):empty('No activity yet','Saved workflow actions will appear here.'));

screens.resident=()=>{
 const r=modules.resident,p=partnerByID(r.partner);
 return pageHead('RESIDENT SERVICES',`Hello, ${esc(r.name)}.`, 'Your collection provider, account and service requests.',button('Report a service issue','residentReport','',true))+
 `<div class="journey-grid wide">`+panel('Your service provider',esc(r.property)+' · '+esc(r.area),`<div class="module-pad"><h2>${esc(p?.name||'No provider linked')}</h2><p>${esc(p?.service||'Select your collection provider')} · ${esc(r.address)}</p>${button('Find or change provider','residentSetup')}</div>`)+
 panel('Your account','Sample invoice linked to your household.',`<div class="module-pad"><div class="balance">₦15,000</div>${status(journey.settled?'Reconciled':'Outstanding')}<p>INV-0182 · illustrative tariff</p>${action('View bill details','residentBill')}</div>`)+ '</div>'+
 panel('Service requests','Track the reference and follow-up for every issue.',table(['Reference','Issue','Status',''],[['CC-1048','Missed collection',status(['Received','Recovery assigned','Resolved'][journey.caseStage]),action('View progress','caseStatus')],...modules.serviceRequests.map(x=>[x.id,esc(x.type),status(x.status),link('View request','residentRequest',x.id)])]));
};

// Extend the existing overview and facility / care workflows instead of replacing their service records.
function decorateExisting(page){
 if(journey.role==='partner'&&((page==='facility'&&modules.partnerContext!=='PAR-020')||(page==='recovery'&&modules.partnerContext!=='PAR-019'))){
  journeyMain.innerHTML=pageHead('PARTNER SERVICES',page==='facility'?'Facility operations':'Resource recovery',esc(currentPartner().name))+panel('Assigned records','Records are scoped to this organisation.',empty('No service records assigned','LAWMA must link the relevant facility or material records to this partner.'))+moduleFooter;
 }

 if(page==='crew'&&['partner','psp'].includes(journey.role)&&modules.partnerContext!=='PAR-006'){
  journeyMain.innerHTML=pageHead('FIELD SHIFT','Your collection assignments',esc(currentPartner().name)+' · assigned routes and manual field records')+(scopedAssignments().length?'':panel('Shift assignments','Assigned work appears here.',empty('No routes assigned','Ask the dispatcher to assign a vehicle and crew.')))+moduleFooter;
 }

 if(page==='overview'){
  const intro=document.createElement('section');intro.className='module-overview';intro.innerHTML=`<div><span class="eyebrow">LAWMA PARTNER ECOSYSTEM</span><h2>Collection is part of the bigger picture.</h2><p>${modules.partners.length} partner organisations · ${modules.categories.length} proposed categories · ${modules.incidents.filter(i=>i.status!=='Resolved').length} open incidents</p></div><div>${routeButton('Partner directory','partners')}${routeButton('Review site capacity','capacity')}</div>`;
  journeyMain.querySelector('.journey-head').after(intro);
 }
 if(page==='facility'&&!(journey.role==='partner'&&modules.partnerContext!=='PAR-020')){
  const section=document.createElement('div');section.innerHTML=panel('Site occupancy','Review capacity before processing the next load.',`<div class="module-pad">${modules.facilities.map(f=>`<div class="capacity-line"><span>${esc(f.name)}</span><b>${occupancy(f)} / ${f.capacity}</b>${status(occupancy(f)>f.capacity?'Over capacity':'Within capacity')}</div>`).join('')}${routeButton('Open site capacity and visits','capacity')}</div>`);journeyMain.querySelector('.journey-footer').before(section);
 }
 if(page==='care'){
  const section=document.createElement('div');section.innerHTML=panel('Resident portal requests','Requests created through the resident journey.',modules.serviceRequests.length?table(['Reference','Issue','Partner','Status',''],modules.serviceRequests.map(r=>[r.id,esc(r.type),esc(partnerName(r.partner)),status(r.status),link('Review','careRequest',r.id)])):empty('No new portal requests','Reports submitted from the resident workspace will appear here.'));journeyMain.querySelector('.journey-footer').before(section);
 }
}
function changePartnerContext(id){
 modules.partnerContext=id;
 const service=currentPartner().service;
 const extras=service==='Collection'?['dispatch','fleet','crew']:service==='Recovery'?['recovery']:service==='Facility operations'?['facility','capacity']:[];
 personaPages.partner=['partner',...extras,'incidents'];
 // Collection dispatcher is scoped to collection partners only.
 if(journey.role==='psp'&&service!=='Collection'){modules.partnerContext=(modules.partners.find(p=>p.id==='PAR-006'&&p.service==='Collection'&&p.status==='Active')||modules.partners.find(p=>p.service==='Collection'&&p.status==='Active')).id}
 saveModules();
}
function partnerForm(id){
 const p=partnerByID(id);
 openForm(p?'Edit partner':'Register a partner','Create an organisation record. Category and service responsibility are separate.',[
 textField('name','Organisation name',p?.name),field('type','Partner category',{options:modules.categories,value:p?.type}),
 field('service','Primary service responsibility',{options:['Collection','Recovery','Facility operations','Transport','Technical support'],value:p?.service}),
 textField('area','Service area',p?.area),textField('reference','Registration reference',p?.reference),textField('contact','Coordinator name',p?.contact)
 ],p?'Save changes':'Submit for review',d=>{
  if(modules.partners.some(x=>x.id!==id&&(x.name.toLowerCase()===d.name.toLowerCase()||x.reference.toLowerCase()===d.reference.toLowerCase())))return'An organisation with this name or registration reference already exists.';
  if(p){Object.assign(p,d);fleet.filter(v=>v.partnerId===p.id).forEach(v=>v.psp=p.name);recordModuleAction(p.id+' partner details updated')}
  else{const r={id:moduleID('PAR',modules.partners),...d,status:'Pending review'};modules.partners.push(r);recordModuleAction(r.id+' registration submitted for review')}
 });
}
function newIncident(partner='',site=''){
 const f=modules.facilities.find(x=>x.id===site);
 openForm('Record an incident','Link the exception to an operational record and a responsible partner.',[
 field('type','Issue type',{options:['Missed collection','Capacity breach','Vehicle fault','Service delay','Missing evidence','Other']}),
 textField('subject','Related vehicle, facility or service reference',site||''),
 field('partner','Responsible partner',{options:['partner','psp'].includes(journey.role)?partnerOptions(p=>p.id===modules.partnerContext):partnerOptions(),value:partner||modules.partnerContext}),
 textField('area','Area',f?.area||''),field('priority','Priority',{options:['Normal','High','Low']}),field('description','What happened?',{type:'textarea'})
 ],'Create incident',d=>{const r={id:moduleID('INC',modules.incidents),...d,status:'Open',owner:'Unassigned',resolution:'',notes:[],created:new Date().toISOString()};modules.incidents.unshift(r);ui.incidentFilter='Open';recordModuleAction(r.id+' incident created: '+d.type)});
}
function actionAllowed(cmd){
 const admin=['registerPartner','editPartner','approvePartner','addCategory','addUser','editUser','editSite'];
 if(admin.includes(cmd))return canMaintain()||(cmd==='editSite'&&journey.role==='operations');
 if(['addPerson','editPerson','addVehicle'].includes(cmd))return isAuthority();
 if(['arrival','departure','siteIncident'].includes(cmd))return permitted('capacity');
 if(['newReview','decideReview'].includes(cmd))return permitted('compliance');
 if(['careRequest'].includes(cmd))return permitted('care');
 if(['residentSetup','residentReport','residentRequest'].includes(cmd))return journey.role==='resident';
 return true;
}
function runModule(cmd,id){
 if(!actionAllowed(cmd)){toast('This action is not available in the current workspace.');return}
 if(cmd==='cancel'){closeModal();return}
 if(cmd==='entry'){showEntry();return}
 if(cmd==='fullscreen'){
  if(document.fullscreenElement){document.exitFullscreen?.().catch(()=>toast('Use your browser to exit full screen.'))}
  else document.documentElement.requestFullscreen?.().catch(()=>toast('Use your browser’s full-screen control.'));
  return;
 }
 if(cmd==='partnerDetail'){partnerDetail(id);return}
 if(cmd==='registerPartner'||cmd==='editPartner'){partnerForm(id);return}
 if(cmd==='approvePartner'){
  const p=partnerByID(id);if(!p)return;
  openForm('Review registration',p.name+' · '+p.reference,[field('decision','Registration decision',{options:['Activate partner','Request corrections']}),field('note','Review note',{type:'textarea'}),field('confirm','I have reviewed the sample organisation and service details',{type:'checkbox'})],'Save decision',d=>{p.status=d.decision==='Activate partner'?'Active':'Pending review';p.reviewNote=d.note;recordModuleAction(p.id+' registration: '+d.decision+' — '+d.note)});return;
 }
 if(cmd==='assetTab'){ui.assetTab=id;renderJourney();return}
 if(cmd==='addPerson'||cmd==='editPerson'){
  const r=cmd==='editPerson'?modules.personnel.find(p=>p.id===id):null;
  openForm(r?'Edit person':'Add partner personnel','Record the person under their responsible organisation.',[textField('name','Full name',r?.name),field('partner','Organisation',{options:partnerOptions(),value:r?.partner||id}),field('role','Responsibility',{options:['Driver','Crew member','Coordinator','Facility operator','Technician','Recovery officer'],value:r?.role}),field('status','Availability',{options:['Available','Unavailable'],value:r?.status})],'Save person',d=>{if(r)Object.assign(r,d);else modules.personnel.push({id:moduleID('PER',modules.personnel),...d});recordModuleAction('Personnel record saved: '+d.name+' · '+partnerName(d.partner))});return;
 }
 if(cmd==='addVehicle'){
  openForm('Register a fleet vehicle','Link a registration to a vehicle in the existing sample fleet. Example: FLT-0042 belongs to PSP partner 06.',[
   textField('vehicle','Fleet ID','FLT-0042'),textField('plate','Registration plate'),field('partner','Responsible organisation',{options:partnerOptions(p=>p.status==='Active'&&['Collection','Transport'].includes(p.service)),value:id||'PAR-006'}),field('kind','Vehicle class',{options:['Waste compactor','Tipper','Haulage truck','Support vehicle']})
  ],'Save registration',d=>{
   d.vehicle=d.vehicle.toUpperCase();d.plate=d.plate.toUpperCase();const v=fleet.find(x=>x.code===d.vehicle);
   if(!v)return'Fleet ID not found. Use an existing ID from the fleet map.';
   if(!plateKey(d.plate))return'Enter a registration plate containing letters or numbers.';
   if(v.partnerId!==d.partner)return'This vehicle belongs to '+v.psp+'. Choose its existing organisation. Ownership transfers require a separate approval.';
   if(modules.vehicleRecords.some(x=>x.vehicle===d.vehicle||plateKey(x.plate)===plateKey(d.plate)))return'The fleet ID or registration plate is already registered.';
   modules.vehicleRecords.push({id:moduleID('VEH',modules.vehicleRecords),...d});recordModuleAction('Vehicle registration added: '+d.vehicle);
  });return;
 }
 if(cmd==='vehicleRecord'){const r=modules.vehicleRecords.find(x=>x.id===id);if(r)drawer(r.vehicle,rowKV('Plate',esc(r.plate))+rowKV('Organisation',esc(partnerName(r.partner)))+rowKV('Class',esc(r.kind))+button('Locate on fleet map','locate',r.vehicle,true));return}
 if(cmd==='locate'){
  closeModal();goJourney('fleet');const v=fleet.find(x=>x.code===id);if(v){state.query=v.code.toLowerCase();state.status='all';state.district='all';state.viewport=false;$('search').value=v.code;$('status').value='all';$('district').value='all';$('viewportOnly').checked=false;changeFilter(false);selectVehicle(v.id)}return;
 }
 if(cmd==='siteDetail'){siteDetail(id);return}
 if(cmd==='arrival'){
  if(!visibleFacilities().length){toast('No facilities assigned to this organisation.');return}
  openForm('Record vehicle arrival','Manual entry creates a visit and updates the site occupancy.',[field('facility','Facility',{options:visibleFacilities().map(f=>({value:f.id,label:f.name})),value:id||ui.facility}),textField('vehicle','Fleet ID','FLT-0042')],'Record arrival',d=>{
   d.vehicle=d.vehicle.toUpperCase();const v=fleet.find(x=>x.code===d.vehicle);
   if(!v)return'Fleet ID not found. Choose a vehicle from the fleet register.';
   if(modules.visits.some(x=>!x.departed&&x.vehicle===d.vehicle))return'This vehicle already has an open visit. Record its departure first.';
   const p=partnerByID(v.partnerId);const visit={id:moduleID('VIS',modules.visits),...d,partner:p?.id||'',arrived:new Date().toISOString(),departed:null};modules.visits.unshift(visit);ui.facility=d.facility;recordModuleAction(visit.id+' arrival: '+d.vehicle+' at '+d.facility);
  });return;
 }
 if(cmd==='departure'){
  const v=modules.visits.find(x=>x.id===id);if(!v||v.departed)return;
  openForm('Record departure',v.vehicle+' · '+id,[field('confirm','Confirm the vehicle has left the facility',{type:'checkbox'}),textField('note','Departure note')],'Confirm departure',d=>{v.departed=new Date().toISOString();v.note=d.note;recordModuleAction(id+' departure recorded: '+d.note)});return;
 }
 if(cmd==='editSite'){
  const f=modules.facilities.find(x=>x.id===id);if(!f)return;
  openForm('Edit site settings','The baseline is the number present before individually recorded visits. Avoid counting new visits twice.',[field('capacity','Maximum vehicle capacity',{type:'number',min:1,value:f.capacity}),field('expected','Expected vehicle count',{type:'number',value:f.expected}),field('baseline','Baseline count (excluding open visits)',{type:'number',value:f.baseline}),textField('note','Reason for change')],'Save site settings',d=>{f.capacity=+d.capacity;f.expected=+d.expected;f.baseline=+d.baseline;recordModuleAction(f.id+' site settings updated: '+d.note)});return;
 }
 if(cmd==='siteIncident'){newIncident('',id);return}
 if(cmd==='newIncident'){newIncident(id);return}
 if(cmd==='incidentDetail'){incidentDetail(id);return}
 if(cmd==='updateIncident'){
  const i=visibleIncidents().find(x=>x.id===id);if(!i||i.status==='Resolved')return;
  const canClose=isAuthority();
  const opts={Open:['Assigned'],Assigned:['In progress','Awaiting verification'],'In progress':['Awaiting verification'],'Awaiting verification':canClose?['Resolved','In progress']:['In progress']}[i.status]||[];
  openForm('Update '+id,'Record the responsible owner and the next step. Resolutions require an authority reviewer.',[textField('owner','Responsible owner',i.owner==='Unassigned'?'':i.owner),field('status','Next status',{options:opts}),field('note','Progress / outcome note',{type:'textarea'})],'Save progress',d=>{
   i.owner=d.owner;i.status=d.status;
   if(d.status==='Awaiting verification'||d.status==='Resolved')i.resolution=d.note;
   i.notes.push({text:d.status+': '+d.note,actor:journeyRoles[journey.role][0],time:new Date().toISOString()});recordModuleAction(id+' moved to '+d.status);
  });return;
 }
 if(cmd==='newReview'){
  openForm('Start a partner compliance review','Use a specific record or observation. Policy thresholds remain drafts.',[field('partner','Partner organisation',{options:partnerOptions()}),textField('subject','Service or incident reference'),field('finding','Finding',{type:'textarea'})],'Create review',d=>{const r={id:moduleID('REV',modules.reviews),...d,status:'Awaiting review',decision:'',reviewer:''};modules.reviews.unshift(r);recordModuleAction(r.id+' compliance review opened')});return;
 }
 if(cmd==='reviewDetail'){
  const r=modules.reviews.find(x=>x.id===id);if(!r)return;
  drawer(id+' · '+partnerName(r.partner),rowKV('Linked reference',esc(r.subject))+rowKV('Status',esc(r.status))+`<h3>Finding</h3><p>${esc(r.finding)}</p>`+(r.decision?`<h3>Reviewer decision</h3><p>${esc(r.decision)}</p><small>${esc(r.reviewer)}</small>`:'')+button('Record decision','decideReview',id,true));return;
 }
 if(cmd==='decideReview'){
  const r=modules.reviews.find(x=>x.id===id);if(!r)return;
  openForm('Record review decision','A review records a human finding. This workflow does not issue fines.',[field('status','Decision',{options:['Evidence requested','Follow-up required','Closed — no further action']}),field('decision','Reason and supporting evidence',{type:'textarea'})],'Save decision',d=>{Object.assign(r,d,{reviewer:journeyRoles[journey.role][0]});recordModuleAction(id+': '+d.status+' — '+d.decision)});return;
 }
 if(cmd==='residentSetup'){
  const r=modules.resident;
  openForm('Set up your collection service','Choose your area first. Only active PSP collection partners listed for that area can be linked.',[textField('name','Preferred name',r.name),field('area','Service area',{options:[...new Set(modules.partners.filter(p=>p.type==='PSP'&&p.service==='Collection'&&p.status==='Active').map(p=>p.area))],value:r.area}),textField('address','Service address',r.address),field('partner','Collection provider',{options:partnerOptions(p=>p.type==='PSP'&&p.service==='Collection'&&p.status==='Active'&&p.area===r.area),value:r.partner})],'Save service provider',d=>{
   const p=partnerByID(d.partner);if(!p||p.area!==d.area||p.status!=='Active'||p.type!=='PSP'||p.service!=='Collection')return'Choose an active collection PSP serving your selected area.';
   Object.assign(r,d);recordModuleAction('Resident '+r.property+' linked to '+p.name);
  });
  $('mf-area').onchange=e=>{$('mf-partner').innerHTML=selectOptions(partnerOptions(p=>p.type==='PSP'&&p.service==='Collection'&&p.status==='Active'&&p.area===e.target.value))};return;
 }
 if(cmd==='residentReport'){
  openForm('Report a service issue','Your report will be linked to your property and current collection provider.',[field('type','Issue',{options:['Missed collection','Incorrect bill','Illegal dumping','Damaged bin']}),field('description','What happened?',{type:'textarea'})],'Submit report',d=>{
   const r={id:moduleID('REQ',modules.serviceRequests),...d,property:modules.resident.property,partner:modules.resident.partner,status:'Received',created:new Date().toISOString(),notes:[]};modules.serviceRequests.unshift(r);recordModuleAction(r.id+' resident report received');
  });return;
 }
 if(cmd==='residentRequest'){
  const r=modules.serviceRequests.find(x=>x.id===id);if(!r)return;
  drawer(id+' · '+r.type,`<div class="drawer-intro">${status(r.status)}</div><p>${esc(r.description)}</p>`+rowKV('Property',esc(r.property))+rowKV('Provider',esc(partnerName(r.partner)))+rowKV('Submitted',stamp(r.created))+`<ol class="module-timeline">${r.notes.map(n=>`<li>${esc(n.text)}<small>${stamp(n.time)}</small></li>`).join('')}</ol>`);return;
 }
 if(cmd==='careRequest'){
  const r=modules.serviceRequests.find(x=>x.id===id);if(!r)return;
  if(r.status==='Resolved'){drawer(id+' · resolved',`<p>${esc(r.description)}</p><ol class="module-timeline">${r.notes.map(n=>`<li>${esc(n.text)}<small>${stamp(n.time)}</small></li>`).join('')}</ol>`);return}
  const next=r.status==='Received'?'Recovery assigned':'Resolved';
  openForm('Review '+id,r.type+' · '+r.property,[field('note',next==='Resolved'?'Recovery outcome':'Owner and recovery action',{type:'textarea'}),...(next==='Resolved'?[field('confirmed','Resident has confirmed the issue is resolved',{type:'checkbox'})]:[])],next==='Resolved'?'Resolve request':'Assign recovery',d=>{r.status=next;r.notes.push({text:next+': '+d.note,time:new Date().toISOString()});recordModuleAction(id+' '+next)});return;
 }
 if(cmd==='addCategory'){
  openForm('Add partner category','Use a category that reflects a distinct relationship with LAWMA.',[textField('name','Category name')],'Add category',d=>{if(modules.categories.some(c=>c.toLowerCase()===d.name.toLowerCase()))return'This category already exists.';modules.categories.push(d.name);recordModuleAction('Partner category added: '+d.name)});return;
 }
 if(cmd==='addUser'||cmd==='editUser'){
  const u=modules.users.find(x=>x.id===id);
  openForm(u?'Edit demonstration user':'Add demonstration user','This is a local access register. It does not provision accounts or send invitations.',[textField('name','Display name',u?.name),field('role','Workspace role',{options:Object.entries(journeyRoles).map(([value,r])=>({value,label:r[0]})),value:u?.role}),field('status','Status',{options:['Active','Disabled'],value:u?.status})],'Save user',d=>{if(u)Object.assign(u,d);else modules.users.push({id:moduleID('USR',modules.users),...d});recordModuleAction('Demo user saved: '+d.name)});return;
 }
}
modules.assignments ||= [];
const scopedAssignments=()=>modules.assignments.filter(a=>!['partner','psp','crew'].includes(journey.role)||a.partner===modules.partnerContext);
screens.dispatch=()=>{
 const partnerScoped=['partner','psp'].includes(journey.role);
 const sampleVisible=!partnerScoped||modules.partnerContext==='PAR-006';
 return pageHead('COLLECTION OPERATIONS','Prepare the shift. Track the outcome.','Collection is a responsibility within the wider partner network.',button('Assign route','assignRoute','',true))+
 (sampleVisible?scenarioRecord()+panel('Connected collection journey','PSP partner 06 · IKJ-07 · FLT-0042',`<div class="module-pad">${steps(['Ready','Assigned','Evidence received'],journey.synced?3:journey.assigned?1:0)}${action(journey.assigned?'Review assignment':'Assign collection','assign',true)} ${routeButton('Open field shift','crew')}</div>`):'')+
 panel('Route assignments','New assignments use the selected partner’s vehicles and registered personnel.',scopedAssignments().length?table(['Assignment / route','Partner','Vehicle / lead','Status',''],scopedAssignments().map(a=>[`${a.id}<small class="cell-sub">${esc(a.route)}</small>`,esc(partnerName(a.partner)),`${esc(a.vehicle)}<small class="cell-sub">${esc(a.crew)}</small>`,status(a.status),link('Open','assignmentDetail',a.id)])):empty('No additional assignments','Assign a route after registering the organisation’s crew.'));
};
const moduleRun=runModule;
runModule=function(cmd,id){
 if(cmd==='assignRoute'){
  if(!permitted('dispatch'))return;
  const choices=modules.partners.filter(p=>p.status==='Active'&&p.service==='Collection'&&(!['partner','psp'].includes(journey.role)||p.id===modules.partnerContext));
  if(!choices.length){toast('No active collection partner is available.');return}
  const first=choices.find(p=>p.id==='PAR-006')||choices[0];
  const vehicleOptions=pid=>partnerFleet(pid).map(v=>({value:v.code,label:v.code+' · '+v.district}));
  const peopleOptions=pid=>modules.personnel.filter(p=>p.partner===pid&&p.status==='Available'&&['Driver','Crew member','Coordinator'].includes(p.role)).map(p=>({value:p.id,label:p.name+' · '+p.role}));
  openForm('Assign a collection route','Choose an active collection partner, vehicle and available crew member.',[field('partner','Collection partner',{options:choices.map(p=>({value:p.id,label:p.name})),value:first.id}),field('vehicle','Vehicle',{options:vehicleOptions(first.id)}),field('crew','Crew lead',{options:peopleOptions(first.id),help:'Missing crew? Add personnel in People & vehicles.'}),field('route','Planned route area',{options:ROUTES.map(r=>r.name)}),field('ready','Crew and vehicle readiness checked',{type:'checkbox'})],'Assign route',d=>{
   const p=partnerByID(d.partner),v=fleet.find(v=>v.code===d.vehicle),person=modules.personnel.find(x=>x.id===d.crew);
   if(!p||p.status!=='Active'||p.service!=='Collection'||!v||v.partnerId!==p.id||!person||person.partner!==p.id||person.status!=='Available')return'Choose a valid partner, vehicle and available crew member.';
   if(modules.assignments.some(a=>a.vehicle===d.vehicle&&a.status!=='Completed'))return'This vehicle already has an open assignment.';
   if(v.status==='No signal')return'The vehicle has a stale location signal. Choose a vehicle with current sample telemetry.';
   const a={id:moduleID('ASN',modules.assignments),partner:p.id,vehicle:v.code,crew:person.name,route:d.route,status:'Assigned',evidence:'',created:new Date().toISOString()};modules.assignments.unshift(a);recordModuleAction(a.id+' assigned to '+v.code);
  });
  $('mf-partner').onchange=e=>{$('mf-vehicle').innerHTML=selectOptions(vehicleOptions(e.target.value));$('mf-crew').innerHTML=selectOptions(peopleOptions(e.target.value))};return;
 }
 if(cmd==='assignmentDetail'){
  const a=scopedAssignments().find(x=>x.id===id);if(!a)return;
  drawer(id+' · '+a.route,rowKV('Partner',esc(partnerName(a.partner)))+rowKV('Vehicle',esc(a.vehicle))+rowKV('Crew lead',esc(a.crew))+rowKV('Status',esc(a.status))+(a.evidence?`<h3>Evidence note</h3><p>${esc(a.evidence)}</p>`:'')+
   (a.status==='Assigned'?button('Start route','startAssignment',id,true):a.status==='In progress'?button('Submit completion evidence','completeAssignment',id,true):'')+
   note('This manual completion record does not independently verify collection or authorise payment.'));return;
 }
 if(cmd==='startAssignment'||cmd==='completeAssignment'){
  const a=scopedAssignments().find(x=>x.id===id);if(!a||!['Assigned','In progress'].includes(a.status))return;
  const next=a.status==='Assigned'?'In progress':'Completed';
  openForm(next==='Completed'?'Record completion':'Start route',id+' · '+a.vehicle,[field('evidence',next==='Completed'?'Outcome and evidence reference':'Shift acknowledgement',{type:'textarea'})],next==='Completed'?'Record completion':'Start route',d=>{a.status=next;a.evidence=d.evidence;recordModuleAction(id+' '+next+': '+d.evidence)});return;
 }
 moduleRun(cmd,id);
};

const baseMatches=matches;
matches=function(v){return baseMatches(v)&&(!['partner','psp'].includes(journey.role)||v.partnerId===modules.partnerContext)};
const originalMetrics=metrics;
metrics=function(){
 if(!['partner','psp'].includes(journey.role)){originalMetrics();return}
 const owned=partnerFleet(modules.partnerContext);
 const rows=[['all','Partner fleet',owned.length],...Object.keys(COLORS).map(s=>[s,s,owned.filter(v=>v.status===s).length])];
 $('metrics').innerHTML=rows.map(([s,label,n])=>`<button class="metric ${state.status===s?'active':''}" data-status="${s}" aria-pressed="${state.status===s}"><label>${label}</label><b>${n}<small>vehicles</small></b></button>`).join('');
 $('metrics').querySelectorAll('button').forEach(b=>b.onclick=()=>{state.status=b.dataset.status;$('status').value=state.status;changeFilter(false)});
};
function bindModules(){
 if($('partnerQuery'))$('partnerQuery').oninput=e=>{ui.partnerQuery=e.target.value;$('partnerRows').innerHTML=partnerRows()};
 if($('partnerType'))$('partnerType').onchange=e=>{ui.partnerType=e.target.value;$('partnerRows').innerHTML=partnerRows()};
 if($('incidentFilter'))$('incidentFilter').onchange=e=>{ui.incidentFilter=e.target.value;renderJourney();$('incidentFilter').focus()};
 if($('partnerContext')){
  if(journey.role==='psp')$('partnerContext').innerHTML=selectOptions(partnerOptions(p=>p.service==='Collection'&&p.status==='Active'),modules.partnerContext);
  $('partnerContext').onchange=e=>{changePartnerContext(e.target.value);renderJourney();$('partnerContext').focus()};
 }
 journeyMain.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>goJourney(b.dataset.go));
 journeyMain.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>runJourney(b.dataset.action));
 navRail.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>goJourney(b.dataset.go));
}
function renderNav(){
 const groups=[
  ['Organisation',['overview','partners','partner','registry']],
  ['Operations',['fleet','dispatch','serviceLedger','crew','facility','capacity','cameras','partnerWork']],
  ['Service & assurance',['incidents','compliance','finance','care','connectedService','enforcement','recovery','resident','alerts']],
  ['Governance',['systems','reports','scenarios']]
 ];
 navRail.innerHTML=groups.map(([label,pages])=>{
  const links=pages.map(p=>journeyNav.find(n=>n[0]===p)).filter(n=>n&&permitted(n[0]));
  if(!links.length)return '';
  return `<span class="nav-section">${label}</span>`+links.map(([p,name,ic])=>`<button data-go="${p}" class="${journey.page===p?'active':''}" ${journey.page===p?'aria-current="page"':''}>${icon(ic)}${name}</button>`).join('');
 }).join('');
}
renderJourney=function(){
 if(!permitted(journey.page))journey.page=journeyRoles[journey.role]?.[1]||'overview';
 const p=journey.page;
 if(screens[p]){oldMain.hidden=true;journeyMain.hidden=false;skip.href='#journeyMain';journeyMain.innerHTML=screens[p]()+moduleFooter;$('persona').value=journey.role}
 else {legacyRender();decorateExisting(p)}
 if(p==='crew'&&scopedAssignments().length){
  const section=document.createElement('div');section.innerHTML=panel('Additional assignments','Assignments from the collection operations workspace.',table(['Assignment','Route','Status',''],scopedAssignments().map(a=>[a.id,esc(a.route),status(a.status),link('Open','assignmentDetail',a.id)])));journeyMain.querySelector('.journey-footer').before(section);
 }
 if(p==='fleet'){metrics();list();updateMap()}
 renderNav();bindModules();saveJourney();
 document.querySelector('.user').innerHTML=`<b>${esc(journeyRoles[journey.role][0])}</b><small>${['partner','psp'].includes(journey.role)?esc(currentPartner().name):'Demonstration workspace'}</small>`;
 journeyMain.querySelectorAll('.journey-steps .current').forEach(x=>x.setAttribute('aria-current','step'));
};
goJourney=function(page){
 if(!permitted(page)){toast('Switch workspace to access '+(journeyNav.find(n=>n[0]===page)?.[1]||page)+'.');return}
 if(page==='fleet'&&state.selected&&!matches(fleet[state.selected-1]))closeDetail();
 legacyGo(page);
};
runJourney=function(a){
 if(a==='assign'&&['partner','psp'].includes(journey.role)&&currentPartner().status!=='Active'){toast('The partner registration requires review before dispatch.');return}
 legacyRun(a);
};
$('persona').onchange=e=>{
 journey.role=e.target.value;changePartnerContext(journey.role==='crew'?'PAR-006':modules.partnerContext);state.query='';state.status='all';state.district='all';state.viewport=false;closeDetail();
 $('search').value='';$('status').value='all';$('district').value='all';$('viewportOnly').checked=false;
 journey.page=journeyRoles[journey.role][1];renderJourney();window.scrollTo({top:0,behavior:'instant'});entrance(journey.page==='fleet'?oldMain:journeyMain);toast('Previewing '+journeyRoles[journey.role][0]+'.');
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-module]');if(b){e.preventDefault();runModule(b.dataset.module,b.dataset.record||'')}});
// Clear all local workflow stores together when the existing reset dialog is confirmed.
document.addEventListener('click',e=>{if(e.target.id==='confirmReset'){try{localStorage.removeItem('lawma-demo-saved-v1');sessionStorage.removeItem('lawma-modules-v1');sessionStorage.removeItem('lawma-entry-v1')}catch{}}},true);
$('journeyGuide').onclick=()=>dialog('Explore LAWMA 360','<ol class="guide-list"><li><b>Management:</b> register a partner, choose its category and service responsibility, then review registration.</li><li><b>Operations:</b> register people and vehicles, assign a route and record field progress.</li><li><b>Facility operator:</b> record arrival, review occupancy, process a load and record departure.</li><li><b>Supervisor:</b> assign an incident, review its outcome and close it.</li><li><b>Resident:</b> choose an eligible collection provider and submit a report. Switch to Customer care to progress it.</li><li><b>Administrator:</b> review local activity, demonstration users and partner categories.</li></ol>'+note('All records are simulated. Role selection previews workflows; it is not authentication. Integrations are deferred.'));
const switchButton=document.createElement('button');switchButton.className='btn';switchButton.textContent='Switch workspace';switchButton.dataset.module='entry';document.querySelector('.account').append(switchButton);
const fullButton=document.createElement('button');fullButton.className='iconbtn';fullButton.innerHTML=icon('fit');fullButton.setAttribute('aria-label','Toggle full-screen control room');fullButton.dataset.module='fullscreen';document.querySelector('.account').append(fullButton);

const entry=document.createElement('section');entry.id='workspaceEntry';entry.hidden=true;
entry.innerHTML=`<div class="entry-story"><img src="${document.querySelector('.brand img').src}" alt="Lagos Waste Management Authority"><div><span class="eyebrow">LAWMA 360 · SERVICE ASSURANCE</span><h1>One view of the work.<br>A clear path to action.</h1><p>Connect authority oversight, partner operations and resident services across Lagos.</p></div><div class="entry-chain"><span>01 <b>Organise partners</b></span><span>02 <b>Coordinate services</b></span><span>03 <b>Resolve exceptions</b></span><span>04 <b>Record outcomes</b></span></div><small>Prepared for LAWMA · Fastspeed Solutions Limited</small></div><div class="entry-form"><h2>Choose your workspace</h2><p>Explore the responsibilities and actions of each role.</p><form id="entryForm"><label for="entryRole">Workspace role</label><select id="entryRole">${Object.entries(journeyRoles).map(([id,r])=>`<option value="${id}">${esc(r[0])}</option>`).join('')}</select><p id="entryDescription"></p><button type="submit" class="btn primary">Enter workspace ${icon('arrow')}</button></form><div class="entry-note">Sample records and local workflows. No password is required for this demonstration. Operational connections and authenticated access are not enabled.</div><div class="entry-foot">LAWMA partner network <span>PSPs · recovery · facilities · other services</span></div></div>`;
document.body.append(entry);
function showEntry(){
 if(!$('modalBack').hidden)closeModal();
 document.body.classList.add('entry-open');entry.hidden=false;$('entryRole').value=journey.role;$('entryDescription').textContent=journeyRoles[journey.role][2];$('entryRole').focus();entrance(entry);
}
$('entryRole').onchange=e=>$('entryDescription').textContent=journeyRoles[e.target.value][2];
$('entryForm').onsubmit=e=>{
 e.preventDefault();journey.role=$('entryRole').value;changePartnerContext(journey.role==='crew'?'PAR-006':modules.partnerContext);journey.page=journeyRoles[journey.role][1];
 entry.hidden=true;document.body.classList.remove('entry-open');try{sessionStorage.setItem('lawma-entry-v1','entered')}catch{}
 renderJourney();journeyMain.querySelector('h1')?.focus();entrance(journey.page==='fleet'?oldMain:journeyMain);
 if(typeof maybeStartTour==='function')setTimeout(maybeStartTour,reducedMotion()?0:350);
};
// Restore partner renames consistently on the immutable sample fleet after a reload.
modules.partners.forEach(p=>{const n=Number(p.id.replace('PAR-',''));if(n<=18){fleet.filter(v=>v.partnerId===p.id).forEach(v=>v.psp=p.name)}});
/*SIMULATIONJS*/
/*MOBILEJS*/
/*PRESENTATIONJS*/
/*TLSJS*/
/*TLSENTRYJS*/
/*TLSLIFECYCLEJS*/
/*EXPERIENCEJS*/
changePartnerContext(modules.partnerContext);renderJourney();
let entered=false;try{entered=sessionStorage.getItem('lawma-entry-v1')==='entered'}catch{}
if(!entered && location.hash==='#app')showEntry();
})();
