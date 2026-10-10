/* Connected, deterministic presentation simulator. No operational network writes. */
const simNow=()=>new Date().toISOString();
const makeDemo=()=>({version:1,online:true,telemetry:0,camera:'CAM-01',cameraPaused:false,sensorGap:4.6,sensorThreshold:3,gateClosed:false,failover:false,
 orders:[],invoices:[],payments:[],notices:[],cases:[],batches:[],workOrders:[],signedIn:false,
 properties:Array.from({length:27},(_,i)=>({id:i===0?'PR-0182':'PR-'+String(182+i).padStart(4,'0'),area:ROUTES[Math.floor(i/3)%ROUTES.length].name,partner:i<3?'PAR-006':'PAR-'+String(1+Math.floor(i/3)).padStart(3,'0'),name:['Amina household','Market unit','Residential block'][i%3],tariff:[15000,24000,18000][i%3],matched:i!==26})),
 cameras:[{id:'CAM-01',name:'Entry lane',site:'FAC-001',online:true,night:false},{id:'CAM-02',name:'Tipping bay',site:'FAC-001',online:true,night:false},{id:'CAM-03',name:'Holding area',site:'FAC-002',online:true,night:false},{id:'CAM-04',name:'Black spot watch',site:'FAC-003',online:true,night:true}],
 policy:{target:90,penalty:10000,approved:false},
 tickets:[{id:'SUP-001',partner:'PAR-022',asset:'CAM-03',issue:'Intermittent camera signal',status:'Assigned',note:''},{id:'HAU-001',partner:'PAR-021',asset:'FAC-001 → FAC-003',issue:'Transfer compacted load',status:'Assigned',note:''}]
});
modules.demo ||= makeDemo();
const sim=modules.demo;
const cash=n=>'₦'+Number(n).toLocaleString('en-NG');
const ownedOrders=()=>sim.orders.filter(o=>!['partner','psp','crew'].includes(journey.role)||o.partner===modules.partnerContext);
const simOrder=id=>ownedOrders().find(o=>o.id===id);
const sampleFacility=id=>modules.facilities.find(f=>f.id===id);
const simNotice=(title,detail,target='scenarios',kind='Information')=>{
 sim.notices.unshift({id:moduleID('ALT',sim.notices),title,detail,target,kind,read:false,time:simNow()});
};
const simSave=(message)=>{recordModuleAction(message);renderJourney();toast(message)};
const simFlag=(title,detail,site)=>{
 if(!modules.incidents.some(i=>i.type===title&&i.subject===site&&i.status!=='Resolved'))modules.incidents.unshift({id:moduleID('INC',modules.incidents),type:title,subject:site,partner:'PAR-020',area:sampleFacility(site)?.area||'Ikeja',priority:'High',status:'Open',owner:'Operations supervisor',description:detail,resolution:'',notes:[],created:simNow()});
 simNotice(title,detail,'incidents','Warning');
};
const isPartnerRole=()=>['partner','psp','crew'].includes(journey.role);
const simulatedNote=()=>'';
const simBtn=(label,cmd,id='',primary=false)=>button(label,'sim-'+cmd,id,primary);
const simNext=o=>({Assigned:'Start route',Collecting:'Capture next collection','Evidence queued':'Sync collection evidence',Collected:'Record facility arrival','At facility':'Record weight & unload',Verified:'Create billing records'}[o.stage]||'View record');
const canOrderAction=o=>isAuthority()||journey.role==='finance'&&o.stage==='Verified'||journey.role==='facility'&&['Collected','At facility'].includes(o.stage)||['partner','psp','crew'].includes(journey.role)&&['Assigned','Collecting','Evidence queued'].includes(o.stage)&&o.partner===modules.partnerContext;
function simMoveVehicle(o){
 const v=fleet.find(v=>v.code===o.vehicle);if(!v)return;
 const r=ROUTES[o.ri],count=o.stops.filter(s=>s.captured).length;
 const fraction=o.stage==='Assigned'?.04:['At facility','Verified'].includes(o.stage)?1:Math.min(.94,.15+count*.24);
 const p=atRoute(r,fraction);Object.assign(v,{ri:o.ri,district:r.name,coord:p.coord,index:p.index,heading:p.heading,fraction,age:0,planned:3,reported:count,verified:sim.online?count:0,status:['At facility','Verified'].includes(o.stage)?'At facility':o.stage==='Collecting'?'Collecting':'On route'});
}
function seedOrder(partner,vehicle,area,crew){
 const ri=Math.max(0,ROUTES.findIndex(r=>r.name===area));
 let props=sim.properties.filter(p=>p.area===area&&p.partner===partner);
 if(!props.length){props=Array.from({length:3},(_,i)=>({id:moduleID('PR',sim.properties.concat(Array(i).fill({}))),area,partner,name:'Sample property '+(sim.properties.length+i+1),tariff:15000,matched:true}));sim.properties.push(...props)}
 const o={id:moduleID('SR',sim.orders),partner,vehicle,ri,crew,area,stage:'Assigned',created:simNow(),facility:'FAC-001',receipt:null,visit:null,billed:false,
 stops:props.slice(0,3).map((p,i)=>({property:p.id,tag:'BIN-'+p.id.slice(3),captured:false,synced:false,photo:null,position:atRoute(ROUTES[ri],.2+i*.27).coord})),events:[{text:'Assignment created',time:simNow()}]};
 sim.orders.unshift(o);simMoveVehicle(o);return o;
}
if(!sim.orders.length&&!sim.initialized){
 seedOrder('PAR-006','FLT-0042','Ikeja','Babatunde A.');
 sim.invoices.push({id:'BILL-001',property:'PR-0182',order:'Historical service period',amount:15000,status:'Outstanding',receipt:null,created:simNow()});
 sim.batches.push({id:'MAT-001',partner:'PAR-019',material:'Sorted PET',weight:1.2,accepted:null,status:'Awaiting receipt',receipt:''});
 sim.initialized=true;
 simNotice('Service ready for dispatch','SR-001 · Ikeja · FLT-0042','serviceLedger');
 simNotice('Holding area above capacity','FAC-002 · 26 vehicles against capacity 24','capacity','Warning');
}
// Add enough dummy resources for each partner to demonstrate its own responsibility.
modules.partners.filter(p=>p.service==='Collection').forEach(p=>{if(!modules.personnel.some(x=>x.partner===p.id))modules.personnel.push({id:moduleID('PER',modules.personnel),partner:p.id,name:'Crew lead '+p.id.slice(4),role:'Driver',status:'Available'})});
modules.vehicleRecords.length||modules.vehicleRecords.push({id:'VEH-001',vehicle:'FLT-0042',plate:'DEMO-042-LA',partner:'PAR-006',kind:'Waste compactor'});
const originalContext=changePartnerContext;
changePartnerContext=function(id){originalContext(id);if(journey.role==='partner'){const p=currentPartner();personaPages.partner.push('alerts');if(p.service==='Collection')personaPages.partner.push('serviceLedger');if(['Transport','Technical support'].includes(p.service))personaPages.partner.push('partnerWork');} };
const addPages=(role,extras)=>{personaPages[role]=[...new Set([...personaPages[role],...extras])]};
['management','admin'].forEach(r=>addPages(r,['serviceLedger','cameras','alerts','scenarios','reports','partnerWork']));
addPages('operations',['serviceLedger','cameras','alerts','scenarios','reports']);addPages('facility',['serviceLedger','cameras','alerts']);addPages('psp',['serviceLedger','alerts']);addPages('crew',['serviceLedger','alerts']);addPages('finance',['serviceLedger','alerts','reports']);addPages('care',['alerts']);addPages('resident',['alerts']);addPages('enforcement',['cameras','alerts']);addPages('recovery',['alerts']);
journeyNav.splice(6,0,['serviceLedger','Service records','file']);journeyNav.push(['cameras','Cameras & sensors','camera'],['partnerWork','Partner work orders','truck'],['reports','Performance','layers'],['alerts','Notifications','alert'],['scenarios','Demo scenarios','play']);
defs.insertAdjacentHTML('beforeend','<symbol id="i-camera" viewBox="0 0 24 24"><path d="M3 6h12v12H3zM15 10l6-4v12l-6-4z"/></symbol><symbol id="i-play" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/></symbol>');
function simScopeInvoice(inv){return journey.role!=='resident'||inv.property===modules.resident.property}
function simOrderTable(list=ownedOrders()){
 return list.length?table(['Service / area','Partner / vehicle','Collection evidence','Stage',''],list.map(o=>[`${o.id}<small class="cell-sub">${esc(o.area)}</small>`,`${esc(partnerName(o.partner))}<small class="cell-sub">${esc(o.vehicle)}</small>`,o.stops.filter(s=>s.synced).length+' / '+o.stops.length+' synced',status(o.stage),link('Open service','sim-order',o.id)])):empty('No assigned services','Create an assignment from Collection operations.');
}
screens.serviceLedger=()=>pageHead('CONNECTED SERVICE RECORDS','Follow every handoff.','Assignment, collection evidence, intake, receipt and related billing share one reference.',simulatedNote())+stats([['Assigned',ownedOrders().filter(o=>o.stage==='Assigned').length,'Ready for a crew'],['In progress',ownedOrders().filter(o=>!['Assigned','Verified'].includes(o.stage)).length,'Collection and facility handoff'],['Verified receipts',ownedOrders().filter(o=>o.receipt).length,'Weight and unloading confirmed'],['Pending sync',ownedOrders().reduce((n,o)=>n+o.stops.filter(s=>s.captured&&!s.synced).length,0),'Original capture time retained']])+panel('Service register','Open any record to continue its journey.',simOrderTable());
screens.dispatch=()=>pageHead('COLLECTION OPERATIONS','Assign the route. Follow the result.','Every assignment opens a connected service record.',simBtn('Create assignment','assign','',true))+panel('Shift register','Sample crews and road-aligned routes are ready to use.',simOrderTable())+note('Route paths use the supplied road geometry. Route optimisation comparisons are illustrative scenarios.');
function scene(kind='camera',night=false){
 return `<svg class="sim-scene ${night?'night':''}" viewBox="0 0 900 450" role="img" aria-label="Generated ${kind==='evidence'?'collection evidence':'facility camera'} demonstration scene"><rect width="900" height="450" fill="${night?'#17242a':'#647175'}"/><path d="M0 340 900 180V450H0Z" fill="#424e51"/><path d="m120 450 240-290M510 450 100-320" stroke="#b7b298" stroke-width="3" stroke-dasharray="22 17"/><path d="M0 75 900 15v125L0 230Z" fill="${night?'#25363b':'#869388'}"/><path d="M40 70h255v108H40zM650 32h225v96H650" fill="#415650"/><path d="M55 80h220M55 100h220M55 120h220M55 140h220" stroke="#6e8279" stroke-width="4"/><g transform="translate(340 225) rotate(-12)"><rect width="170" height="77" rx="6" fill="#dc741d"/><rect x="125" y="5" width="59" height="69" rx="7" fill="#dadbd4"/><rect x="145" y="12" width="29" height="42" rx="3" fill="#31444c"/><circle cx="29" cy="80" r="14" fill="#1b2428"/><circle cx="149" cy="80" r="14" fill="#1b2428"/><text x="20" y="43" fill="#221a13" font-size="17" font-family="sans-serif" font-weight="700">LAWMA</text></g><g transform="translate(690 170) rotate(-12)"><rect width="100" height="44" rx="4" fill="#bd762a"/><rect x="72" width="34" height="44" rx="4" fill="#cbd1cb"/></g><rect x="330" y="195" width="214" height="147" rx="3" fill="none" stroke="#9addad" stroke-width="2"/><text x="337" y="189" fill="#c9f4d3" font-size="13" font-family="monospace">${kind==='evidence'?'COLLECTION CHECKPOINT':'DEMO-042-LA · VEHICLE'}</text><path d="M0 25h900M0 425h900" stroke="#b8cac3" stroke-opacity=".15"/><text x="25" y="40" fill="#f1f3eb" font-size="14" font-family="monospace">${kind==='evidence'?'STAGED EVIDENCE':'SYNTHETIC CAMERA VIEW'} · NOT LIVE FOOTAGE</text><text x="25" y="422" fill="#dbe4df" font-size="12" font-family="monospace">SmartWaste360 / DEMONSTRATION DATA</text></svg>`;
}
let activeService=null;
function openService(id){const o=simOrder(id);if(!o)return;activeService=id;
 const ix=['Assigned','Collecting','Evidence queued','Collected','At facility','Verified'].indexOf(o.stage);
 drawer(o.id+' · '+o.area,simulatedNote()+steps(['Assign','Collect','Facility','Receipt'],o.stage==='Verified'?4:o.stage==='At facility'?2:['Collected','Evidence queued'].includes(o.stage)?1:0)+
 rowKV('Operator',esc(partnerName(o.partner)))+rowKV('Vehicle / crew',esc(o.vehicle+' · '+o.crew))+rowKV('Current stage',esc(o.stage))+
 `<div class="drawer-actions">${canOrderAction(o)&&(!o.billed||o.stage!=='Verified')?simBtn(simNext(o),'advance',o.id,true):''}${permitted('fleet')?simBtn('View route on map','map',o.id):''}${simBtn(sim.online?'Simulate offline':'Restore connection','connection')}${o.receipt?simBtn(o.receipt.kind==='TLS intake'?'View intake receipt':'View disposal receipt','receipt',o.id):''}</div>`+
 table(['Checkpoint','Capture','Sync'],o.stops.map(s=>[esc(s.property),s.captured?'Tag + staged image':'Pending',s.synced?'Synced':s.captured?'Queued':'—']))+
 (o.stops.some(s=>s.captured)?`<h3>Latest staged evidence</h3>${scene('evidence')}<p class="sim-caption">${esc(o.stops.filter(s=>s.captured).at(-1).photo)} · capture metadata retained</p>`:'')+
 (o.billed?rowKV('Related invoices',sim.invoices.filter(i=>i.order===o.id).map(i=>i.id).join(', ')):'')+
 '<h3>Event history</h3><ol class="module-timeline">'+o.events.map(e=>`<li>${esc(e.text)}<small>${stamp(e.time)}</small></li>`).join('')+'</ol>');
}
function orderEvent(o,text){o.events.push({text,time:simNow()});simMoveVehicle(o);recordModuleAction(o.id+': '+text)}
function advanceOrder(o){
 if(!canOrderAction(o)){toast('Switch to the responsible workspace to continue this handoff.');return}
 if(o.stage==='Assigned'){o.stage='Collecting';orderEvent(o,'Route acknowledged and started')}
 else if(o.stage==='Collecting'){
  const s=o.stops.find(s=>!s.captured);if(!s)return;
  Object.assign(s,{captured:true,synced:sim.online,photo:'DEMO-PHOTO-'+o.id+'-'+s.property,time:simNow()});orderEvent(o,'Collection captured at '+s.property+(sim.online?' · synced':' · queued offline'));
  if(o.stops.every(s=>s.captured))o.stage=sim.online?'Collected':'Evidence queued';
 }
 else if(o.stage==='Evidence queued'){
  if(!sim.online){toast('Restore the simulated connection before syncing.');return}
  o.stops.forEach(s=>s.synced=true);o.stage='Collected';orderEvent(o,'Queued evidence synced once; original timestamps preserved');
 }
 else if(o.stage==='Collected'){
  const existing=modules.visits.find(v=>v.vehicle===o.vehicle&&!v.departed);
  if(existing&&existing.facility!==o.facility){toast('Record departure from the other site before this arrival.');return}
  const visit=existing||{id:moduleID('VIS',modules.visits),facility:o.facility,vehicle:o.vehicle,partner:o.partner,arrived:simNow(),departed:null,order:o.id};
  if(!existing)modules.visits.unshift(visit);o.visit=visit.id;o.stage='At facility';orderEvent(o,'Arrival recorded at '+sampleFacility(o.facility).name);
  if(occupancy(sampleFacility(o.facility))>sampleFacility(o.facility).capacity)simFlag('Capacity breach','Simulated arrivals exceed site capacity.',o.facility);
 }
 else if(o.stage==='At facility'){
  openForm('Weigh and confirm unloading',o.id+' · '+o.vehicle,[field('gross','Gross weight (kg)',{type:'number',min:1,value:18400}),field('tare','Tare weight (kg)',{type:'number',min:1,value:11200}),field('unloaded','Unloading confirmed in the designated area',{type:'checkbox'})],'Issue disposal receipt',d=>{
   if(+d.gross<=+d.tare)return'Gross weight must exceed tare weight.';
   o.receipt={id:'LOAD-'+o.id.slice(3),gross:+d.gross,tare:+d.tare,net:+d.gross-+d.tare,time:simNow()};o.stage='Verified';
   const visit=modules.visits.find(v=>v.id===o.visit);if(visit)visit.departed=simNow();orderEvent(o,'Disposal receipt issued; net '+o.receipt.net+' kg. Departure recorded.');simNotice('Collection verified',o.id+' has a disposal receipt. Related account records can be reviewed.','finance');
  });return;
 }
 else if(o.stage==='Verified'){
  if(o.billed){toast('Billing records already exist for this service.');return}
  for(const stop of o.stops){const p=sim.properties.find(p=>p.id===stop.property);sim.invoices.unshift({id:moduleID('BILL',sim.invoices),property:stop.property,order:o.id,amount:p?.tariff||15000,status:'Outstanding',created:simNow(),receipt:null})}
  o.billed=true;orderEvent(o,'Property invoices created using sample period tariffs, independent of disposal weight');simNotice('Invoices ready',o.id+' · '+o.stops.length+' property account records created','finance');
 }
 simMoveVehicle(o);saveModules();renderJourney();openService(o.id);
}
function cameraView(cam){return `<div class="camera-frame ${!cam.online?'camera-offline':''}">${scene('camera',cam.night)}<div class="camera-overlay"><span>${esc(cam.id)} / ${esc(cam.name)}</span><span>${cam.online?(sim.cameraPaused?'REPLAY PAUSED':'SIMULATED FEED'):'OFFLINE'}</span></div>${!cam.online?'<div class="camera-message"><b>Camera signal unavailable</b><span>Last staged frame retained · technical follow-up required</span></div>':''}</div>`}
screens.cameras=()=>{
 const cams=sim.cameras.filter(c=>journey.role!=='partner'||visibleFacilities().some(f=>f.id===c.site));
 const cam=cams.find(c=>c.id===sim.camera)||cams[0];if(!cam)return pageHead('SITE OBSERVATION','No cameras assigned','Assign a site to this partner before previewing camera views.')+empty('No assigned feeds','All feed previews use generated scenes.');
 return pageHead('SITE OBSERVATION','See the site. Investigate the signal.','Generated camera scenes and configurable sensor events for the presentation.',simulatedNote())+
 `<div class="camera-layout"><section class="work-panel">${cameraView(cam)}<div class="camera-controls">${simBtn('Expand camera','expandCamera',cam.id)}${simBtn(sim.cameraPaused?'Play simulation':'Pause simulation','pauseCamera')}${simBtn(cam.night?'Day view':'Night view','nightCamera',cam.id)}${simBtn(cam.online?'Simulate outage':'Restore signal','cameraOutage',cam.id)}</div><div class="module-pad"><b>${esc(sampleFacility(cam.site)?.name||'')}</b><p>Staged plate match: DEMO-042-LA · FLT-0042 · human review required.</p>${simBtn('Flag suspected dumping','dumping',cam.site)}</div></section><aside><section class="work-panel"><header><h2>Site cameras</h2><p>Choose a location and camera.</p></header><div class="camera-list">${cams.map(c=>`<button class="camera-choice ${c.id===cam.id?'selected':''}" data-module="sim-selectCamera" data-record="${c.id}">${icon('camera')}<span><b>${esc(c.name)}</b><small>${esc(sampleFacility(c.site)?.name||'')}</small></span>${status(c.online?'Online':'Offline')}</button>`).join('')}</div></section><section class="work-panel"><header><h2>Vehicle spacing</h2><p>Simulated bumper proximity sensor.</p></header><div class="module-pad"><div class="sensor-reading ${sim.sensorGap<sim.sensorThreshold?'breach':''}"><strong>${sim.sensorGap.toFixed(1)} <small>m</small></strong>${status(sim.sensorGap<sim.sensorThreshold?'Below threshold':'Safe spacing')}</div><p>Minimum gap: ${sim.sensorThreshold.toFixed(1)} m · FLT-0042 → FLT-0043</p>${simBtn('Simulate close spacing','proximity','',true)} ${simBtn('Configure threshold','threshold')} ${simBtn('Restore safe spacing','safeGap')}</div></section></aside></div>`;
};
const cameraTick=setInterval(()=>{
 if(document.hidden||sim.cameraPaused||journey.page!=='cameras')return;
 const el=document.querySelector('.camera-frame');if(el)el.dataset.frame=new Date().toLocaleTimeString('en-GB');
},1000);
function invoiceTable(invoices){return invoices.length?table(['Invoice / property','Related service','Amount','Status',''],invoices.map(i=>[`${i.id}<small class="cell-sub">${esc(i.property)}</small>`,esc(i.order),cash(i.amount),status(i.status),link('Open invoice','sim-invoice',i.id)])):empty('No invoices in this account','Billing records appear after a service receipt is created.');}
screens.finance=()=>pageHead('REVENUE & BILLING','Trace every account and receipt.','Dummy tariffs, property records and payment outcomes support the complete billing journey.',simBtn('Create invoice','newInvoice','',true))+
 stats([['Billed',cash(sim.invoices.reduce((n,i)=>n+i.amount,0)),'Sample account ledger'],['Reconciled',cash(sim.invoices.filter(i=>i.status==='Reconciled').reduce((n,i)=>n+i.amount,0)),'Bank match confirmed in simulation'],['Awaiting settlement',sim.invoices.filter(i=>i.status==='Payment received').length,'Gateway receipt is not settlement'],['Unmatched properties',sim.properties.filter(p=>!p.matched).length,'Revenue discovery candidates']])+
 panel('Invoice register','Payment attempts, receipts and reconciliation retain the invoice reference.',invoiceTable(sim.invoices))+
 panel('Revenue discovery','Resolve the unmatched account before creating a bill.',table(['Property','Area','Provider','State',''],sim.properties.filter(p=>!p.matched).map(p=>[esc(p.id),esc(p.area),esc(partnerName(p.partner)),status('Needs matching'),simBtn('Match account','matchProperty',p.id)])))+
 panel('Payment attempts','All transactions are simulated; no payment credentials are collected.',sim.payments.length?table(['Reference','Invoice','Outcome','Amount'],sim.payments.map(p=>[p.id,p.invoice,status(p.outcome),cash(p.amount)])):empty('No payment attempts','Open an invoice to demonstrate success, failure or retry.'));
function openInvoice(id){const i=sim.invoices.find(i=>i.id===id&&simScopeInvoice(i));if(!i)return;
 drawer(i.id,simulatedNote()+rowKV('Property',esc(i.property))+rowKV('Related service',esc(i.order))+rowKV('Tariff amount',cash(i.amount))+rowKV('Status',esc(i.status))+
 `<div class="drawer-actions">${['Outstanding','Payment failed','Reversed'].includes(i.status)?simBtn('Simulate checkout','checkout',id,true):''}${i.status==='Payment received'&&permitted('finance')?simBtn('Match bank settlement','reconcile',id,true):''}${i.status==='Reconciled'&&permitted('finance')?simBtn('Simulate reversal','reverse',id):''}${i.receipt?simBtn('View payment receipt','paymentReceipt',id):''}</div>`+
 note('Sample billing relates to the property and service period. Customer payment does not authorise partner payout.'));
}
const residentBase=screens.resident;
screens.resident=()=>{
 const r=modules.resident;
 return pageHead('RESIDENT SERVICES',`Hello, ${esc(r.name)}.`,'Your collection provider, schedule, account and service requests.',simBtn('Report a service issue','residentReport','',true))+
 `<div class="module-toolbar"><label for="demoHousehold">Demo household</label><select id="demoHousehold">${selectOptions(sim.properties.filter(p=>p.matched).map(p=>({value:p.id,label:p.id+' · '+p.name+' · '+p.area})),r.property)}</select></div>`+
 '<div class="journey-grid">'+panel('Your collection',esc(r.property)+' · '+esc(r.area),`<div class="module-pad"><h2>${esc(partnerName(r.partner))}</h2><p>Next scheduled collection: Monday · 07:00–12:00<br>Illustrative weekly service window.</p>${button('Find or change provider','residentSetup')}</div>`)+panel('Account summary','Sample charges and receipt status.',`<div class="module-pad"><div class="balance">${cash(sim.invoices.filter(i=>i.property===r.property&&!['Reconciled','Payment received'].includes(i.status)).reduce((n,i)=>n+i.amount,0))}</div><p>Outstanding balance</p>${simBtn('View notifications','goAlerts')}</div>`)+ '</div>'+
 panel('Your bills','Try successful payment or a failed attempt and retry.',invoiceTable(sim.invoices.filter(i=>i.property===r.property)))+
 panel('Your service requests','Reports retain their property and partner links.',modules.serviceRequests.filter(r=>r.property===modules.resident.property).length?table(['Reference','Issue','Status',''],modules.serviceRequests.filter(r=>r.property===modules.resident.property).map(r=>[r.id,esc(r.type),status(r.status),link('View request','residentRequest',r.id)])):empty('No open service requests','Report a missed collection or other issue to start a traceable case.'));
};
const originalCompliance=screens.compliance;
screens.compliance=()=>originalCompliance()+panel('Policy simulation','Illustrative thresholds and tariffs; no real notices or penalties are issued.',`<div class="module-pad"><div class="capacity-line"><span>Service completion target</span><b>${sim.policy.target}%</b></div><div class="capacity-line"><span>Illustrative notice amount</span><b>${cash(sim.policy.penalty)}</b></div><p>${sim.policy.approved?'Approved for this demonstration scenario only.':'Draft policy — review before demonstrating a penalty decision.'}</p>${simBtn('Configure demo policy','policy')}</div>`);
screens.enforcement=()=>pageHead('ENFORCEMENT REVIEW','Review the evidence. Record a fair decision.','Progress a staged camera flag through verification, a demo notice and appeal.',simBtn('Create sample flag','dumping','FAC-003',true))+
 panel('Incident and appeal register','Flags never issue notices automatically.',sim.cases.length?table(['Case / source','Finding','Stage',''],sim.cases.map(c=>[`${c.id}<small class="cell-sub">${esc(c.site)}</small>`,esc(c.finding),status(c.stage),link('Open case','sim-enforcement',c.id)])):empty('No flagged incidents','Create a sample flag here or from Cameras & sensors.'));
screens.recovery=()=>{
 const batches=sim.batches.filter(b=>journey.role!=='partner'||b.partner===modules.partnerContext);
 return pageHead('RESOURCE RECOVERY','Account for what is recovered.','Follow a material batch from declared weight to processor acceptance.',simBtn('Register material batch','batch','',true))+panel('Material batches','Accepted weight and receipt stay linked to the batch.',batches.length?table(['Batch','Organisation','Material','Declared / accepted','Status',''],batches.map(b=>[b.id,esc(partnerName(b.partner)),esc(b.material),b.weight+' t / '+(b.accepted??'—')+' t',status(b.status),link('Open batch','sim-batchDetail',b.id)])):empty('No batches for this partner','Register a material batch to begin its recovery journey.'));
};
screens.partnerWork=()=>{
 const rows=sim.tickets.filter(t=>journey.role!=='partner'||t.partner===modules.partnerContext);
 return pageHead('PARTNER SERVICES','Work assigned to the right organisation.','Haulage transfers and technical support have their own work orders.',simBtn('Create work order','workOrder','',true))+
 panel('Work order register','Organisation, asset, owner and completion evidence.',table(['Order','Partner','Asset / route','Task','Status',''],rows.map(t=>[t.id,esc(partnerName(t.partner)),esc(t.asset),esc(t.issue),status(t.status),link('Update','sim-workDetail',t.id)])));
};
function visibleNotices(){
 return sim.notices.filter(n=>journey.role==='resident'?(n.property===modules.resident.property):isPartnerRole()?(n.partner===modules.partnerContext):true);
}
screens.alerts=()=>pageHead('NOTIFICATIONS','Keep the next action in view.','Operational exceptions and customer receipts from the same demo records.',simBtn('Mark all as read','readAll'))+
 panel('Notification centre','Events created by workflows appear here immediately.',visibleNotices().length?'<div class="notification-list">'+visibleNotices().map(n=>`<article class="notification-item"><div>${status(n.kind)}<h3>${esc(n.title)}</h3><p>${esc(n.detail)}</p><small>${stamp(n.time)} · ${n.read?'Read':'Unread'}</small></div>${simBtn(n.read?'View':'Read notification','notice',n.id)}</article>`).join('')+'</div>':empty('You’re up to date','Relevant workflow events will appear here.'));
const completion=o=>o.stops.filter(s=>s.synced).length/o.stops.length;
screens.reports=()=>pageHead('PERFORMANCE & GOVERNANCE','Make the operational picture explainable.','Figures below are calculated from the demonstration records.',simBtn('Export performance report','reportExport'))+
 stats([['Collection evidence',Math.round((sim.orders.reduce((n,o)=>n+completion(o),0)/Math.max(1,sim.orders.length))*100)+'%','Synced checkpoints across assignments'],['Verified disposal',sim.orders.filter(o=>o.receipt).length,'Linked weight and unloading records'],['Open exceptions',modules.incidents.filter(i=>i.status!=='Resolved').length,'Awaiting operational closure'],['Accepted recovery',sim.batches.reduce((n,b)=>n+(b.accepted||0),0).toFixed(2)+' t','Processor-confirmed sample receipts']])+
 panel('Partner performance','Service responsibilities determine which evidence applies.',table(['Organisation','Responsibility','Evidence / workload'],modules.partners.map(p=>[esc(p.name),esc(p.service),p.service==='Collection'?sim.orders.filter(o=>o.partner===p.id).length+' service assignments':p.service==='Recovery'?sim.batches.filter(b=>b.partner===p.id&&b.status==='Accepted').length+' accepted batches':p.service==='Facility operations'?modules.visits.filter(v=>modules.facilities.some(f=>f.id===v.facility&&f.partner===p.id)).length+' recorded visits':sim.tickets.filter(t=>t.partner===p.id&&t.status==='Completed').length+' completed work orders'])))+
 panel('Route planning comparison','Illustrative comparison only. No optimisation engine is running.',table(['Plan','Distance','Estimated duration','Action'],[['Current sample plan','18.6 km','96 min',simBtn('Preview proposed plan','plan')],['Proposed sample plan','16.2 km','83 min','Subject to road access and service-area validation']]));
screens.scenarios=()=>pageHead('DEMONSTRATION CONTROL','Present the entire operating story.','Choose a scenario, then show its effect in the responsible workspace.',simulatedNote())+
 '<div class="scenario-grid">'+[
 ['Collection to disposal','Assign → collect → offline sync → intake → receipt → property billing.','Open connected services','goServices'],
 ['Facility congestion','Add simulated arrivals until the site limit is exceeded.','Simulate congestion','congestion'],
 ['Camera and vehicle sensor','Inspect a staged feed, lose a signal or trigger a spacing alert.','Open cameras','goCameras'],
 ['Resident payment','Pay a dummy invoice, demonstrate a failed attempt and retry.','Open billing','goFinance'],
 ['Enforcement and appeal','Review a staged flag, verify a finding and record an appeal outcome.','Open enforcement','goEnforcement'],
 ['Platform continuity','Simulate the primary service becoming unavailable and activate standby.','Preview continuity','continuity'],
 ['Route planning','Compare two illustrative plans and inspect a road-aligned path.','Preview route plans','plan'],
 ['Partner work orders','Demonstrate haulage or technical work beyond PSP collection.','Open work orders','goWork']
 ].map(([title,desc,label,cmd])=>`<section class="work-panel"><header><h2>${title}</h2><p>${desc}</p></header><div class="module-pad">${simBtn(label,cmd,'',true)}</div></section>`).join('')+'</div>';
const preSimRun=runModule;
runModule=function(cmd,id){
 if(!cmd.startsWith('sim-')){preSimRun(cmd,id);return}
 const a=cmd.slice(4),o=simOrder(id);
 const dest={goServices:'serviceLedger',goCameras:'cameras',goFinance:'finance',goEnforcement:'enforcement',goWork:'partnerWork',goAlerts:'alerts'};
 if(dest[a]){goJourney(dest[a]);return}
 if(a==='order'){openService(id);return}
 if(a==='advance'){if(o)advanceOrder(o);return}
 if(a==='connection'){sim.online=!sim.online;simSave(sim.online?'Simulated connection restored. Queued records can sync.':'Offline simulation enabled. Captures remain queued.');if(!$('modalBack').hidden&&activeService)openService(activeService);return}
 if(a==='assign'){
  if(!permitted('dispatch'))return;
  const partners=modules.partners.filter(p=>p.status==='Active'&&p.service==='Collection'&&(!isPartnerRole()||p.id===modules.partnerContext));
  if(!partners.length){toast('An active collection partner is needed.');return}
  const preferred=partners.find(p=>p.id==='PAR-006')||partners[0];
  const options=pid=>partnerFleet(pid).filter(v=>!sim.orders.some(o=>o.vehicle===v.code&&o.stage!=='Verified')).map(v=>({value:v.code,label:v.code+' · '+v.district}));
  openForm('Create service assignment','Dummy crews, property checkpoints and a sample road route will be linked automatically.',[field('partner','Collection partner',{options:partners.map(p=>({value:p.id,label:p.name})),value:preferred.id}),field('vehicle','Available vehicle',{options:options(preferred.id)}),field('area','Route area',{options:ROUTES.map(r=>r.name)}),field('facility','Disposal destination',{options:modules.facilities.map(f=>({value:f.id,label:f.name}))})],'Create assignment',d=>{
   const v=fleet.find(v=>v.code===d.vehicle);if(!v||v.partnerId!==d.partner)return'Choose a vehicle belonging to this partner.';
   if(sim.orders.some(o=>o.vehicle===d.vehicle&&o.stage!=='Verified'))return'This vehicle is already assigned.';
   const crew=modules.personnel.find(p=>p.partner===d.partner&&p.status==='Available');if(!crew)return'Add an available crew member to this organisation first.';
   const job=seedOrder(d.partner,d.vehicle,d.area,crew.name);job.facility=d.facility;simNotice('Route assigned',job.id+' · '+job.vehicle,'serviceLedger');sim.notices[0].partner=d.partner;recordModuleAction(job.id+' created with route and property checkpoints');
  });$('mf-partner').onchange=e=>$('mf-vehicle').innerHTML=selectOptions(options(e.target.value));return;
 }
 if(a==='map'){
  if(!o||!permitted('fleet'))return;closeModal();simMoveVehicle(o);state.query=o.vehicle.toLowerCase();state.status='all';state.district='all';state.viewport=false;$('search').value=o.vehicle;$('status').value='all';$('district').value='all';$('viewportOnly').checked=false;goJourney('fleet');selectVehicle(fleet.find(v=>v.code===o.vehicle).id);return;
 }
 if(a==='receipt'&&o?.receipt){drawer(o.receipt.id,simulatedNote()+rowKV('Service',o.id)+rowKV('Vehicle',o.vehicle)+rowKV('Gross',o.receipt.gross+' kg')+rowKV('Tare',o.receipt.tare+' kg')+rowKV('Net',o.receipt.net+' kg')+rowKV('Unloading','Confirmed')+rowKV('Issued',stamp(o.receipt.time)));return}
 if(a==='selectCamera'){sim.camera=id;saveModules();renderJourney();return}
 if(a==='expandCamera'){const c=sim.cameras.find(c=>c.id===id);if(c)drawer(c.name,cameraView(c)+note('Generated scene for the presentation. No camera is connected.'));return}
 if(a==='pauseCamera'){sim.cameraPaused=!sim.cameraPaused;saveAndRender(sim.cameraPaused?'Camera simulation paused.':'Camera simulation playing.');return}
 if(a==='nightCamera'){const c=sim.cameras.find(c=>c.id===id);if(c)c.night=!c.night;saveModules();renderJourney();return}
 if(a==='cameraOutage'){
  const c=sim.cameras.find(c=>c.id===id);if(!c)return;c.online=!c.online;
  if(!c.online){simFlag('Camera offline',c.id+' lost its simulated feed.',c.site);if(!sim.tickets.some(t=>t.asset===c.id&&t.status!=='Completed'))sim.tickets.unshift({id:moduleID('SUP',sim.tickets),partner:'PAR-022',asset:c.id,issue:'Restore camera signal',status:'Assigned',note:''})}
  simSave(c.id+(c.online?' signal restored.':' outage created a technical follow-up.'));return;
 }
 if(a==='proximity'){sim.sensorGap=Math.max(.1,sim.sensorThreshold*.4);simFlag('Unsafe vehicle spacing','FLT-0042 proximity gap '+sim.sensorGap.toFixed(1)+' m; threshold '+sim.sensorThreshold+' m.','FAC-001');simSave('Sensor alert recorded for supervisor review.');return}
 if(a==='safeGap'){sim.sensorGap=sim.sensorThreshold+1.6;simSave('Safe spacing restored. Incident remains for supervisor closure.');return}
 if(a==='threshold'){openForm('Configure spacing alert','This sample threshold is not an approved LAWMA safety standard.',[field('threshold','Minimum gap (metres)',{type:'number',min:.1,max:20,step:.1,value:sim.sensorThreshold})],'Save threshold',d=>{sim.sensorThreshold=+d.threshold;if(sim.sensorGap<sim.sensorThreshold)simFlag('Unsafe vehicle spacing','Current simulated gap falls below the new threshold.','FAC-001');recordModuleAction('Demo sensor threshold set to '+d.threshold+' m')});return}
 if(a==='congestion'){
  const f=sampleFacility('FAC-001');const needed=Math.max(0,f.capacity+2-occupancy(f));
  for(const v of fleet.filter(v=>!modules.visits.some(x=>x.vehicle===v.code&&!x.departed)).slice(0,needed))modules.visits.unshift({id:moduleID('VIS',modules.visits),facility:f.id,vehicle:v.code,partner:v.partnerId,arrived:simNow(),departed:null});
  simFlag('Capacity breach',f.name+' has '+occupancy(f)+' vehicles against capacity '+f.capacity+'.',f.id);simSave('Congestion scenario ready. Review the site and its incident.');goJourney('capacity');return;
 }
 if(a==='invoice'){openInvoice(id);return}
 if(a==='newInvoice'){
  openForm('Create sample invoice','Select a matched property. The amount uses an illustrative tariff.',[field('property','Property account',{options:sim.properties.filter(p=>p.matched).map(p=>({value:p.id,label:p.id+' · '+p.area}))}),field('amount','Amount (NGN)',{type:'number',min:1,value:15000})],'Create invoice',d=>{const inv={id:moduleID('BILL',sim.invoices),property:d.property,order:'Manual service-period invoice',amount:+d.amount,status:'Outstanding',created:simNow(),receipt:null};sim.invoices.unshift(inv);recordModuleAction(inv.id+' sample invoice created')});return;
 }
 if(a==='matchProperty'){const p=sim.properties.find(p=>p.id===id);if(!p)return;openForm('Match property account',p.id+' · '+p.area,[field('partner','Collection partner',{options:partnerOptions(p=>p.service==='Collection'&&p.status==='Active'),value:p.partner}),field('confirmed','Property and service area checked',{type:'checkbox'})],'Confirm match',d=>{p.partner=d.partner;p.matched=true;recordModuleAction(p.id+' linked to a collection account')});return}
 if(a==='checkout'){
  const inv=sim.invoices.find(i=>i.id===id&&simScopeInvoice(i));if(!inv||['Payment received','Reconciled'].includes(inv.status))return;
  openForm('Demo checkout',inv.id+' · '+cash(inv.amount)+' · no money moves and no card details are needed.',[field('provider','Simulated provider',{options:['Paystack demo','Flutterwave demo']}),field('outcome','Payment outcome',{options:['Successful','Failed']})],'Run simulated payment',d=>{
   const payment={id:moduleID('PAY',sim.payments),invoice:id,amount:inv.amount,outcome:d.outcome,provider:d.provider,time:simNow()};sim.payments.unshift(payment);inv.status=d.outcome==='Successful'?'Payment received':'Payment failed';inv.receipt=d.outcome==='Successful'?payment.id:null;
   simNotice(d.outcome==='Successful'?'Payment receipt ready':'Payment failed — retry available',id+' · '+cash(inv.amount),'resident');sim.notices[0].property=inv.property;recordModuleAction(payment.id+' '+d.outcome+' simulated payment');
  });return;
 }
 if(a==='reconcile'){
  const inv=sim.invoices.find(i=>i.id===id);if(!inv||inv.status!=='Payment received'||!permitted('finance'))return;
  openForm('Match settlement',id+' · expected '+cash(inv.amount),[textField('ref','Dummy bank reference','BANK-'+id),field('amount','Bank amount (NGN)',{type:'number',min:1,value:inv.amount})],'Confirm bank match',d=>{if(+d.amount!==inv.amount)return'Amount does not match the invoice. Investigate before reconciliation.';inv.status='Reconciled';inv.bank=d.ref;simNotice('Payment reconciled',id+' matched to the sample bank record.','resident');sim.notices[0].property=inv.property;recordModuleAction(id+' bank match confirmed')});return;
 }
 if(a==='reverse'){
  const inv=sim.invoices.find(i=>i.id===id);if(!inv||inv.status!=='Reconciled')return;
  openForm('Simulate payment reversal',id+' will return to an outstanding balance in the demo.',[textField('reason','Reason')],'Record reversal',d=>{inv.status='Reversed';sim.payments.unshift({id:moduleID('PAY',sim.payments),invoice:id,amount:inv.amount,outcome:'Reversed',provider:'Bank simulation',time:simNow()});simNotice('Payment reversed',id+' · '+d.reason,'resident','Warning');sim.notices[0].property=inv.property;recordModuleAction(id+' sample reversal: '+d.reason)});return;
 }
 if(a==='paymentReceipt'){const i=sim.invoices.find(i=>i.id===id&&simScopeInvoice(i));if(i)drawer('Simulated receipt',rowKV('Reference',esc(i.receipt||'Pending'))+rowKV('Invoice',i.id)+rowKV('Amount',cash(i.amount))+rowKV('State',esc(i.status))+note('Demo receipt. No actual payment or bank confirmation.'));return}
 if(a==='residentReport'){preSimRun('residentReport',id);return}
 if(a==='policy'){openForm('Configure demo policy','Approve only for this simulated scenario. Real rules require LAWMA validation.',[field('target','Completion target (%)',{type:'number',min:1,max:100,value:sim.policy.target}),field('penalty','Illustrative notice amount (NGN)',{type:'number',min:0,value:sim.policy.penalty}),field('approved','Approved for demonstration only',{type:'checkbox'})],'Save demo policy',d=>{sim.policy={target:+d.target,penalty:+d.penalty,approved:true};recordModuleAction('Demonstration policy configured')});return}
 if(a==='dumping'){
  const c={id:moduleID('ENF',sim.cases),site:id||'FAC-003',stage:'Unverified flag',finding:'Staged low-light vehicle detection. Identity and offence unconfirmed.',amount:null,notes:[]};sim.cases.unshift(c);simNotice('Camera flag requires review',c.id+' · no automatic enforcement action','enforcement','Warning');simSave(c.id+' created for human review.');return;
 }
 if(a==='enforcement'){
  const c=sim.cases.find(c=>c.id===id);if(!c)return;
  const labels={'Unverified flag':'Review evidence','Field verification':'Record field finding','Verified finding':'Prepare demo notice','Notice issued':'Submit appeal','Appeal received':'Review appeal'};
  drawer(c.id,simulatedNote()+scene('camera',true)+rowKV('Stage',esc(c.stage))+`<p>${esc(c.finding)}</p>`+(c.amount!==null?rowKV('Illustrative amount',cash(c.amount)):'')+(labels[c.stage]?simBtn(labels[c.stage],'enforceNext',c.id,true):'')+'<ol class="module-timeline">'+c.notes.map(n=>`<li>${esc(n)}</li>`).join('')+'</ol>');return;
 }
 if(a==='enforceNext'){
  const c=sim.cases.find(c=>c.id===id);if(!c)return;
  if(c.stage==='Verified finding'&&!sim.policy.approved){toast('Approve a demonstration policy in Compliance before preparing a notice.');return}
  const options={'Unverified flag':['Request field verification','Dismiss false positive'],'Field verification':['Verify finding','Insufficient evidence'],'Verified finding':['Issue demo notice'],'Notice issued':['Submit appeal'],'Appeal received':['Allow appeal — withdraw notice','Uphold demo notice']}[c.stage];if(!options)return;
  openForm('Review '+id,'A human decision is required at each stage. No legal notice is sent.',[field('decision','Decision',{options}),field('note','Evidence / decision reason',{type:'textarea'})],'Record decision',d=>{
   const states={'Request field verification':'Field verification','Dismiss false positive':'Dismissed','Verify finding':'Verified finding','Insufficient evidence':'Dismissed','Issue demo notice':'Notice issued','Submit appeal':'Appeal received','Allow appeal — withdraw notice':'Notice withdrawn','Uphold demo notice':'Notice upheld'};
   c.stage=states[d.decision];if(['Verified finding','Dismissed'].includes(c.stage))c.finding=d.note;c.notes.push(d.decision+': '+d.note);if(c.stage==='Notice issued')c.amount=sim.policy.penalty;recordModuleAction(id+' '+c.stage);
  });return;
 }
 if(a==='batch'){
  openForm('Register recovery batch','Link material to its recovery partner.',[field('partner','Recovery partner',{options:partnerOptions(p=>p.service==='Recovery'&&(!isPartnerRole()||p.id===modules.partnerContext))}),field('material','Material',{options:['Sorted PET','Paper','Metal','Mixed recyclables']}),field('weight','Declared weight (tonnes)',{type:'number',min:.01,step:.01,value:1.2})],'Register batch',d=>{sim.batches.unshift({id:moduleID('MAT',sim.batches),partner:d.partner,material:d.material,weight:+d.weight,accepted:null,status:'Awaiting receipt',receipt:''});recordModuleAction('Recovery batch registered')});return;
 }
 if(a==='batchDetail'){
  const b=sim.batches.find(b=>b.id===id&&(!isPartnerRole()||b.partner===modules.partnerContext));if(!b)return;
  drawer(b.id,rowKV('Material',esc(b.material))+rowKV('Declared weight',b.weight+' t')+rowKV('Accepted weight',(b.accepted??'—')+' t')+rowKV('Status',esc(b.status))+rowKV('Receipt',esc(b.receipt||'Pending'))+(b.status==='Accepted'?'':simBtn('Record processor outcome','batchAccept',id,true)));return;
 }
 if(a==='batchAccept'){
  const b=sim.batches.find(b=>b.id===id);if(!b)return;
  openForm('Processor outcome',id+' · '+b.weight+' tonnes declared.',[field('outcome','Outcome',{options:['Accepted','Rejected — contamination']}),field('weight','Accepted weight (tonnes)',{type:'number',min:0,max:b.weight,step:.01,value:b.weight}),textField('receipt','Dummy receipt reference','PROC-'+id)],'Save outcome',d=>{if(+d.weight>b.weight)return'Accepted weight cannot exceed declared weight.';b.status=d.outcome;b.accepted=d.outcome==='Accepted'?+d.weight:0;b.receipt=d.receipt;simNotice('Material outcome recorded',id+' · '+d.outcome,'recovery');sim.notices[0].partner=b.partner;recordModuleAction(id+' '+d.outcome)});return;
 }
 if(a==='workOrder'){
  if(!modules.partners.some(p=>p.status==='Active'&&['Transport','Technical support'].includes(p.service)&&(!isPartnerRole()||p.id===modules.partnerContext))){toast('Activate a transport or technical support partner before assigning work.');return}
  openForm('Create partner work order','Assign a non-collection task to an appropriate organisation.',[field('partner','Organisation',{options:partnerOptions(p=>p.status==='Active'&&['Transport','Technical support'].includes(p.service)&&(!isPartnerRole()||p.id===modules.partnerContext))}),textField('asset','Asset or transfer route'),textField('issue','Task description')],'Create work order',d=>{sim.tickets.unshift({id:moduleID('WO',sim.tickets),...d,status:'Assigned',note:''});recordModuleAction('Partner work order created')});return;
 }
 if(a==='workDetail'){
  if(isPartnerRole()&&currentPartner().status!=='Active'){toast('Ask LAWMA to review and activate this partner registration first.');return}
  const t=sim.tickets.find(t=>t.id===id&&(!isPartnerRole()||t.partner===modules.partnerContext));if(!t)return;
  if(t.status==='Completed'){drawer(id,rowKV('Outcome',esc(t.note))+rowKV('Status','Completed'));return}
  openForm('Update '+id,t.issue+' · '+t.asset,[field('status','Progress',{options:t.status==='Assigned'?['In progress']:['Completed','Blocked']}),field('note','Progress / completion evidence',{type:'textarea'})],'Save progress',d=>{t.status=d.status;t.note=d.note;if(t.status==='Completed'&&t.asset.startsWith('CAM-')){const cam=sim.cameras.find(c=>c.id===t.asset);if(cam)cam.online=true}recordModuleAction(id+' '+d.status)});return;
 }
 if(a==='readAll'){visibleNotices().forEach(n=>n.read=true);simSave('Notifications marked as read.');return}
 if(a==='notice'){const n=visibleNotices().find(n=>n.id===id);if(!n)return;n.read=true;saveModules();drawer(n.title,`<p>${esc(n.detail)}</p><small>${stamp(n.time)}</small>`+(permitted(n.target)?simBtn('Open workspace','noticeGo',n.id,true):''));return}
 if(a==='noticeGo'){const n=visibleNotices().find(n=>n.id===id);if(n){closeModal();goJourney(n.target)}return}
 if(a==='continuity'){drawer('Continuity simulation',simulatedNote()+rowKV('Primary service',sim.failover?'Unavailable':'Available')+rowKV('Standby',sim.failover?'Serving simulated traffic':'Ready')+rowKV('Data state','Shared local demonstration records')+simBtn(sim.failover?'Restore primary service':'Simulate primary failure','failover','',true)+note('This demonstrates the decision and interface only. No AWS or Azure resources are deployed.'));return}
 if(a==='failover'){sim.failover=!sim.failover;simNotice('Platform continuity',sim.failover?'Standby activated in the demonstration.':'Primary restored in the demonstration.','systems','Warning');simSave('Continuity state updated.');runModule('sim-continuity','');return}
 if(a==='plan'){drawer('Illustrative route comparison',table(['Plan','Distance','Time'],[['Current sample','18.6 km','96 min'],['Proposed sample','16.2 km','83 min']])+note('Scenario assumptions, not calculated savings. Heavy-vehicle access and actual service boundaries require validation.')+simBtn('Show sample road route','map',sim.orders[0]?.id||'',true));return}
 if(a==='reportExport'){
  const rows=[['DEMONSTRATION REPORT','Not live LAWMA data'],['Service records',sim.orders.length],['Verified receipts',sim.orders.filter(o=>o.receipt).length],['Collected sample revenue',sim.invoices.filter(i=>i.status==='Reconciled').reduce((n,i)=>n+i.amount,0)],['Accepted recovery tonnes',sim.batches.reduce((n,b)=>n+(b.accepted||0),0)]];
  const url=URL.createObjectURL(new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download='LAWMA-demo-performance.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Demonstration report exported.');return;
 }
};
screens.crew=()=>pageHead('FIELD SHIFT','Your assigned collections','Capture staged evidence, work through an offline period and hand over each load.',simBtn(sim.online?'Go offline':'Restore connection','connection'))+panel('Collection work','Open a service to capture each checkpoint.',simOrderTable());
const priorFacility=screens.facility;
screens.facility=()=>pageHead('FACILITY INTAKE','Receive and verify each load.','Gate arrival, weighing, unloading and a traceable receipt.',routeButton('View site capacity','capacity'))+panel('Connected arrivals','Collected services can arrive here. Confirm gross and tare before issuing a receipt.',simOrderTable(ownedOrders().filter(o=>['Collected','At facility','Verified'].includes(o.stage))))+
 panel('Occupancy','Open arrivals contribute to the site count; receipt completion records departure.',`<div class="module-pad">${visibleFacilities().map(f=>`<div class="capacity-line"><span>${esc(f.name)}</span><b>${occupancy(f)} / ${f.capacity}</b></div>`).join('')}</div>`);
screens.overview=()=>pageHead('SmartWaste360','Today at a glance','Partners, service delivery and exceptions across Lagos.',simulatedNote())+
 stats([['Fleet in view',fleet.length,'Simulated vehicle records'],['Partners',modules.partners.length,'Across '+modules.categories.length+' categories'],['Service records',sim.orders.length,'Connected demo assignments'],['Open incidents',modules.incidents.filter(i=>i.status!=='Resolved').length,'Supervisor follow-up']])+
 panel('Needs attention','Open a record to take the next action.',`<div class="module-pad">${routeButton('Service records · '+sim.orders.filter(o=>o.stage!=='Verified').length+' in progress','serviceLedger')}${routeButton('Site capacity · '+modules.facilities.filter(f=>occupancy(f)>f.capacity).length+' above limit','capacity')}${routeButton('Partner registration · '+modules.partners.filter(p=>p.status==='Pending review').length+' pending','partners')}${routeButton('Review incidents','incidents')}</div>`)+
 panel('Follow a complete collection','From dispatch to a verified disposal receipt.',simOrderTable(sim.orders.slice(0,3)))+
 panel('Presentation scenarios','Demonstrate daily work and exception handling.',`<div class="module-pad">${routeButton('Open demo scenarios','scenarios')}${routeButton('Camera and sensor observations','cameras')}${routeButton('Performance report','reports')}</div>`);
// Preserve the existing citizen-care journey while generating matching resident notifications.
const simRenderBase=renderJourney;
renderJourney=function(){
 for(const r of modules.serviceRequests){if(r.simNotified!==r.status){simNotice('Service request '+r.status.toLowerCase(),r.id+' · '+r.type,'resident');sim.notices[0].property=r.property;r.simNotified=r.status}}
 simRenderBase();
 if($('demoHousehold'))$('demoHousehold').onchange=e=>{const p=sim.properties.find(p=>p.id===e.target.value);if(p){Object.assign(modules.resident,{property:p.id,area:p.area,partner:p.partner,name:p.name,address:'Demonstration property, '+p.area});saveModules();renderJourney()}};
 const fresh=document.querySelector('.snapshot');if(fresh)fresh.innerHTML=icon('clock')+'Demo GPS snapshot · '+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
 if(journey.page==='fleet'&&!$('simSnapshot')){const b=document.createElement('button');b.id='simSnapshot';b.className='btn';b.dataset.module='sim-telemetry';b.textContent='Refresh demo positions';document.querySelector('#fleetMain .page-actions').prepend(b)}
 saveModules();
};
const simActionBase=runModule;
runModule=function(cmd,id){
 if(cmd==='sim-telemetry'){
  sim.telemetry++;
  fleet.filter(v=>v.status==='On route'&&!sim.orders.some(o=>o.vehicle===v.code)).forEach(v=>{v.fraction=Math.min(.97,v.fraction+.008);Object.assign(v,atRoute(ROUTES[v.ri],v.fraction));v.age=0});
  sim.orders.slice().reverse().forEach(simMoveVehicle);metrics();list();updateMap();if(state.selected)renderDetail();recordModuleAction('GPS demonstration snapshot refreshed');toast('Sample positions updated along the mapped roads.');return;
 }
 simActionBase(cmd,id);
};
$('journeyGuide').onclick=()=>{if(permitted('scenarios'))goJourney('scenarios');else drawer('Your demo workspace','<p>Open a service or work order and follow its next action. Use Switch workspace to show the receiving team’s view.</p>'+note('All operational records, camera scenes, payments and policy outcomes are simulated.'))};
sim.orders.slice().reverse().forEach(simMoveVehicle);
// Facility identity and partner settlement are separate, reviewable handoffs.
sim.settlements ||= [];
const simFacility=screens.facility;
screens.facility=()=>simFacility()+panel('Gate identity check','Simulated plate recognition checks the linked collection manifest.',`<div class="module-pad">${simBtn('Simulate gate scan','gateScan','',true)}<p>Recognised, unknown and mismatched-vehicle outcomes can be demonstrated.</p></div>`);
const simFinance=screens.finance;
screens.finance=()=>simFinance()+panel('Partner settlement review','Illustrative service fee; independent of customer invoice payments.',`<div class="module-pad">${simBtn('Prepare partner statement','settlement')}</div>`+(sim.settlements.length?table(['Statement','Verified service','Amount','Status',''],sim.settlements.map(s=>[s.id,s.order,cash(s.amount),status(s.status),link('Review','sim-settlementReview',s.id)])):empty('No partner statements','A verified disposal receipt is required before preparing a statement.')));
const exceptionActions=runModule;
runModule=function(cmd,id){
 if(cmd==='sim-gateScan'){
  openForm('Simulated gate scan','Choose a recognition outcome. An unknown identity must be reviewed before admission.',[field('result','Recognition result',{options:['Recognised plate and manifest','Unknown plate','Manifest mismatch']})],'Run scan',d=>{
   if(d.result!=='Recognised plate and manifest'){simFlag('Gate identity exception',d.result+' at the sample entry lane. Admission held for review.','FAC-001');recordModuleAction('Gate admission held: '+d.result);return}
   const o=ownedOrders().find(o=>o.stage==='Collected');
   if(!o)return'No collected service is awaiting arrival. Complete and sync collection evidence first.';
   advanceOrder(o);recordModuleAction('Simulated plate and manifest matched for '+o.id);
  });return;
 }
 if(cmd==='sim-settlement'){
  const jobs=sim.orders.filter(o=>o.receipt&&o.receipt.kind!=='TLS intake'&&!sim.settlements.some(s=>s.order===o.id));if(!jobs.length){toast('A verified service without a statement is required.');return}
  openForm('Prepare partner statement','Illustrative fee; these figures are not approved LAWMA commercial terms.',[field('order','Verified service',{options:jobs.map(o=>({value:o.id,label:o.id+' · '+partnerName(o.partner)}))}),field('amount','Sample service fee (NGN)',{type:'number',min:1,value:80000})],'Prepare statement',d=>{const o=sim.orders.find(o=>o.id===d.order);sim.settlements.push({id:moduleID('SET',sim.settlements),order:o.id,partner:o.partner,amount:+d.amount,status:'Awaiting approval'});recordModuleAction('Partner statement prepared for '+o.id)});return;
 }
 if(cmd==='sim-settlementReview'){
  const s=sim.settlements.find(s=>s.id===id);if(!s)return;
  if(s.status==='Disbursed (demo)'){drawer(id,rowKV('Status',s.status)+rowKV('Amount',cash(s.amount))+note('Simulated payout record only. No money has moved.'));return}
  const next=s.status==='Awaiting approval'?'Approved':'Disbursed (demo)';
  openForm(id+' · '+cash(s.amount),next==='Approved'?'Review the service evidence and receipt.':'Simulate disbursement of the approved statement.',[field('confirmed',next==='Approved'?'Evidence and statement amount reviewed':'Confirm simulated disbursement only',{type:'checkbox'})],next==='Approved'?'Approve statement':'Simulate disbursement',()=>{s.status=next;simNotice('Partner statement '+next.toLowerCase(),id+' · '+cash(s.amount),'partner');sim.notices[0].partner=s.partner;recordModuleAction(id+' '+next)});return;
 }
 exceptionActions(cmd,id);
};
