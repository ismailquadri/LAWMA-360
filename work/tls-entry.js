/* TLS modules 1–3: configuration, trip identity and arrival queue. */
const tlsTerminal=t=>['Unloaded','Denied entry','Diverted'].includes(t.state);
const tlsNormal=s=>String(s||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
const tlsSites=()=>modules.facilities.filter(f=>f.kind==='Transfer station'&&(!['partner','psp','crew'].includes(journey.role)||f.partner===modules.partnerContext));
function tlsConfig(f){return f.tlsConfig ||= {status:'Operational',hours:'07:00–19:00',bridge:'WB-'+f.id,bridgeStatus:'Available',stockCapacity:250000,tolerance:500,cutoff:'00:00',destinations:['FAC-003'],operator:'Demo facility operator',supervisor:'Demo LAWMA supervisor'}}
for(const f of modules.facilities.filter(f=>f.kind==='Transfer station'))tlsConfig(f);
function tlsSelect(id){if(!tlsSites().some(f=>f.id===id))return false;tlsSite=id;tls=modules.tlsStores[id] ||= tlsBlank();return true}
function tlsActiveTruck(truck,except){return Object.values(modules.tlsStores).flatMap(s=>s.trips).find(t=>t.id!==except&&!tlsTerminal(t)&&tlsNormal(t.truck)===tlsNormal(truck))||Object.values(modules.tlsStores).flatMap(s=>s.transfers).find(m=>tlsNormal(m.truck)===tlsNormal(truck)&&m.kg-(m.accepted||0)-(m.returned||0)-(m.alternative||0)>0)}
function tlsSiteError(){const f=tlsFacility();if(!f)return'Choose an assigned TLS.';if(tlsConfig(f).status!=='Operational')return'This TLS is not operational. Ask the supervisor to review its status.';return null}
function tlsRegister(d){
 if(!tlsWrite())return'This role cannot register arrivals.';
 const err=tlsSiteError();if(err)return err;
 if(!d.truck.trim()||!d.driver.trim()||!d.route.trim())return'Provide the truck, driver and service area.';
 const p=partnerByID(d.partner);if(!p||p.status!=='Active'||p.service!=='Collection')return'Choose an active collection partner.';
 const registered=modules.vehicleRecords.find(v=>tlsNormal(v.vehicle)===tlsNormal(d.truck)||tlsNormal(v.plate)===tlsNormal(d.truck));
 if(tlsActiveTruck(registered?.vehicle||d.truck))return'This truck already has an active trip. Open its existing record.';
 if(registered&&registered.partner!==d.partner)return'The registered vehicle belongs to a different partner.';
 const t={id:tlsID('TRP'),site:tlsSite,order:null,truck:registered?.vehicle||d.truck.trim(),plate:registered?.plate||null,driver:d.driver,partner:d.partner,route:d.route,state:'Expected',registered:simNow(),events:[],intendedDestination:tlsConfig(tlsFacility()).destinations[0]};
 tls.trips.push(t);tlsEvent(t,'Manual arrival registered; identity must be checked at the gate');return null;
}
function tlsBind(order){
 if(!tlsWrite())return'This role cannot link collection assignments.';
 if(!order)return'Choose a collection assignment.';
 if(order.facility!==tlsSite)return'This assignment is intended for another TLS. Select that TLS before linking it.';
 if(!['Collected','At facility'].includes(order.stage))return'Collection must be complete before sending this assignment to TLS.';
 const existing=Object.values(modules.tlsStores).flatMap(s=>s.trips).find(t=>t.order===order.id);if(existing)return'This assignment already has trip '+existing.id+'.';
 if(tlsActiveTruck(order.vehicle))return'This truck already has another active trip.';
 const err=tlsSiteError();if(err)return err;
 if(!order.vehicle||!order.crew||!order.partner||!order.area)return'The assignment is missing truck, driver, partner or route details.';
 const t={id:tlsID('TRP'),site:tlsSite,order:order.id,truck:order.vehicle,driver:order.crew,partner:order.partner,route:order.area,state:'Expected',registered:simNow(),events:[],intendedDestination:tlsConfig(tlsFacility()).destinations[0]};
 tls.trips.push(t);tlsEvent(t,'Bound to collection assignment '+order.id+'; gate identity pending');return null;
}
function tlsAdmission(t,d){
 if(!tlsWrite())return'This role cannot admit trucks.';
 if(!t||t.state!=='Expected')return'This trip has already progressed. Open its latest record.';
 const err=tlsSiteError();if(err)return err;
 if(tlsOpen().some(e=>e.ref===t.id))return'Resolve the identity hold before attempting check-in again.';
 const registered=modules.vehicleRecords.find(v=>v.vehicle===t.truck);
 const match=[t.truck,t.plate,registered?.plate].filter(Boolean).some(x=>tlsNormal(x)===tlsNormal(d.observed));
 if(!match||d.result==='Mismatch — hold for review'){
  tlsException(t.id,'Identity mismatch: observed '+d.observed+'; expected '+t.truck);
  tlsEvent(t,'Gate hold recorded; observed '+d.observed+' via '+d.method);return null;
 }
 const count=tls.trips.filter(x=>['Checked in','At weighbridge','Weighed','Unloading','Unload paused','Rejected'].includes(x.state)).length;
 if(count>=tlsFacility().capacity)return'The recorded arrival queue has reached the configured vehicle limit.';
 let visit=modules.visits.find(v=>tlsNormal(v.vehicle)===tlsNormal(t.truck)&&!v.departed);
 if(visit&&visit.facility!==tlsSite)return'This truck has an open visit at another site. Resolve that visit first.';
 t.state='Checked in';t.arrived=simNow();t.identity={observed:d.observed,method:d.method,evidence:d.evidence};
 if(!visit){visit={id:moduleID('VIS',modules.visits),facility:tlsSite,vehicle:t.truck,partner:t.partner,arrived:t.arrived,departed:null,order:t.order};modules.visits.push(visit)}
 t.visit=visit.id;
 const o=sim.orders.find(o=>o.id===t.order);if(o){o.stage='At facility';o.visit=visit.id}
 tlsEvent(t,'Identity confirmed via '+d.method+'; queue joined; evidence '+d.evidence);return null;
}
function tlsStartBridge(t){
 if(!tlsWrite())return'This role cannot manage the weighbridge queue.';
 if(!t||t.state!=='Checked in')return'This trip is not waiting in the queue.';
 const err=tlsSiteError();if(err)return err;
 if(tlsConfig(tlsFacility()).bridgeStatus!=='Available')return'The weighbridge is unavailable. Keep the truck waiting and record an incident.';
 if(tls.trips.some(x=>x.state==='At weighbridge'))return'The weighbridge is occupied. Complete the current weigh record first.';
 if(tlsOpen().some(e=>e.ref===t.id))return'This trip has an unresolved hold.';
 t.state='At weighbridge';t.bridgeEntered=simNow();t.queueMinutes=Math.max(0,Math.round((Date.parse(t.bridgeEntered)-Date.parse(t.arrived))/60000));
 tlsEvent(t,'Called to '+tlsConfig(tlsFacility()).bridge+' after '+t.queueMinutes+' minutes in queue');return null;
}
function tlsSaveConfig(d){
 if(!tlsApprove())return'A management supervisor must save configuration.';
 const f=tlsFacility(),c=tlsConfig(f);const cap=Number(d.capacity),stock=tlsKg(d.stock),tolerance=tlsKg(d.tolerance);
 if(!Number.isInteger(cap)||cap<1||stock<=0||tolerance<0)return'Enter a positive vehicle limit and stock capacity, and a non-negative tolerance.';
 if(cap<tls.trips.filter(t=>['Checked in','At weighbridge','Weighed','Unloading','Unload paused','Rejected'].includes(t.state)).length)return'Vehicle limit cannot be lower than the current admitted queue.';
 if(stock<tlsBalance()+tls.trips.filter(t=>['Unloading','Unload paused'].includes(t.state)).reduce((n,t)=>n+t.net,0))return'Stock capacity cannot be lower than recorded on-site stock.';
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.cutoff))return'Enter the cut-off as HH:MM, for example 00:00.';
 if(!modules.facilities.some(x=>x.id===d.destination&&x.kind==='Disposal facility'))return'Choose a configured disposal destination.';
 const before=JSON.parse(JSON.stringify({name:f.name,area:f.area,capacity:f.capacity,...c}));
 f.name=d.name;f.area=d.area;f.capacity=cap;Object.assign(c,{status:d.status,hours:d.hours,bridge:d.bridge,bridgeStatus:d.bridgeStatus,stockCapacity:stock,tolerance,cutoff:d.cutoff,destinations:[d.destination],operator:d.operator,supervisor:d.supervisor});
 c.history ||= [];c.history.push({before,after:{...c,history:undefined},time:simNow(),actor:journeyRoles[journey.role][0]});
 recordModuleAction('TLS configuration updated for '+f.id);return null;
}
function tlsSettings(){const f=tlsFacility(),c=tlsConfig(f);openForm('Configure '+f.name,'Demo operating settings. Hours and cut-off are recorded for supervisor reference; day closure is an explicit action.',[
 textField('name','Facility name',f.name),textField('area','Location / area',f.area),field('status','Operating status',{options:['Operational','Under maintenance','Closed'],value:c.status}),textField('hours','Operating hours (WAT)',c.hours),field('capacity','Vehicle queue limit',{type:'number',min:1,value:f.capacity}),field('stock','Waste holding capacity (tonnes)',{type:'number',min:.001,step:.001,value:c.stockCapacity/1000}),textField('bridge','Weighbridge reference',c.bridge),field('bridgeStatus','Weighbridge status',{options:['Available','Unavailable'],value:c.bridgeStatus}),field('tolerance','Stocktake tolerance (tonnes)',{type:'number',min:0,step:.001,value:c.tolerance/1000}),textField('cutoff','Daily cut-off (WAT, HH:MM)',c.cutoff),field('destination','Approved receiving destination',{options:modules.facilities.filter(x=>x.kind==='Disposal facility').map(x=>({value:x.id,label:x.name})),value:c.destinations[0]}),textField('operator','Assigned operator (demo)',c.operator),textField('supervisor','Assigned supervisor (demo)',c.supervisor)
 ],'Save operating settings',tlsSaveConfig)}
function tlsQueue(){const waiting=tls.trips.filter(t=>['Checked in','At weighbridge','Weighed','Unloading','Unload paused','Rejected'].includes(t.state)).sort((a,b)=>Date.parse(a.arrived||0)-Date.parse(b.arrived||0));return panel('Arrival queue','Arrival order, gate evidence and weighbridge handoff stay with the trip.',waiting.length?table(['Truck / trip','Arrived','Queue time','Stage','Next action'],waiting.map(t=>[esc(t.truck)+'<small class="cell-sub">'+t.id+'</small>',t.arrived?stamp(t.arrived):'Legacy record',t.arrived?(t.queueMinutes??Math.max(0,Math.round((Date.now()-Date.parse(t.arrived))/60000)))+' min':'Not recorded',status(t.state),t.state==='Checked in'&&tlsWrite()?tlsButton('Call to weighbridge','bridge',t.id,true):tlsButton('Open trip','trip',t.id)])):empty('No trucks waiting','Check in an expected arrival to begin its waiting-time record.'))}
const tlsEntryScreen=screens.facility;
screens.facility=()=>{
 const sites=tlsSites();if(!sites.some(f=>f.id===tlsSite)&&sites[0])tlsSelect(sites[0].id);
 if(!sites.length)return pageHead('TLS OPERATIONS','No TLS assigned','A supervisor must assign a transfer station to this partner.');
 const f=tlsFacility(),c=tlsConfig(f);
 let html=tlsEntryScreen();
 const selector=`<div class="tls-site-bar"><label for="tlsSiteSelect">Transfer loading station<select id="tlsSiteSelect">${selectOptions(sites.map(f=>({value:f.id,label:f.name})),tlsSite)}</select></label><span>${esc(c.status)} · ${esc(c.hours)} WAT</span>${tlsApprove()?tlsButton('Configure TLS','settings')+tlsButton('Add TLS','site-new'):''}</div>`;
 html=selector+html;
 if(tlsTab==='Arrivals')html+=`<div class="module-pad">${tlsWrite()?tlsButton('Link completed collection','bind'):''}</div>`;
 if(tlsTab==='Queue')html+=tlsQueue();
 if(tlsTab==='Configuration')html+=panel('Operating profile','Configured demonstration settings for this TLS.',`<div class="module-pad">${rowKV('Facility',esc(f.name)+' · '+esc(f.area))}${rowKV('Status',esc(c.status))}${rowKV('Vehicle queue limit',f.capacity+' trucks')}${rowKV('Waste holding capacity',tonnes(c.stockCapacity))}${rowKV('Weighbridge',esc(c.bridge)+' · '+esc(c.bridgeStatus))}${rowKV('Receiving destination',esc(modules.facilities.find(x=>x.id===c.destinations[0])?.name||'Not assigned'))}${rowKV('Assigned operator',esc(c.operator))}${rowKV('Assigned supervisor',esc(c.supervisor))}${rowKV('Stocktake tolerance',tonnes(c.tolerance))}${rowKV('Daily cut-off',esc(c.cutoff)+' WAT')}${note('Operating hours and cut-off are reference settings in this demo. The supervisor explicitly closes each operating day. Role previews do not authenticate staff.')}</div>`);
 return html;
};
document.addEventListener('change',e=>{if(e.target.id==='tlsSiteSelect'){tlsSelect(e.target.value);renderJourney();$('tlsSiteSelect')?.focus()}});
const tlsEntryDetail=tlsTripDetail;
tlsTripDetail=function(t){
 const next=t.state==='Expected'?['Check in truck','check']:t.state==='Checked in'?['Call to weighbridge','bridge']:t.state==='At weighbridge'?['Record weight & inspection','weigh']:t.state==='Weighed'?['Confirm unloading','unload']:null;
 drawer(t.id+' · '+t.truck,rowKV('TLS',esc(tlsName()))+rowKV('Collection assignment',esc(t.order||'Manual arrival — no assignment linked'))+rowKV('Partner',esc(partnerName(t.partner)))+rowKV('Driver / route',esc(t.driver+' / '+t.route))+rowKV('Stage',status(t.state))+(t.net?rowKV('Net intake',tonnes(t.net)):'')+(t.arrived?rowKV('Gate admission',stamp(t.arrived)):'')+(t.queueMinutes!==undefined?rowKV('Queue time',t.queueMinutes+' min'):'')+note('Manual demonstration evidence. Intake and landfill receipts are separate records.')+`<div class="drawer-actions">${tlsWrite()&&next?tlsButton(next[0],next[1],t.id,true):''}${tlsWrite()&&['Expected','Checked in'].includes(t.state)?tlsButton('Deny entry / withdraw','deny',t.id):''}</div>`+(t.receipt?rowKV('Intake receipt',esc(t.receipt)):'')+tlsTimeline(t));
};
const tlsEntryRun=runModule;
runModule=function(cmd,id){
 if(!cmd.startsWith('tls-'))return tlsEntryRun(cmd,id);
 if(!permitted('facility')||!tlsSites().some(f=>f.id===tlsSite)){toast('This TLS is outside the current workspace.');return}
 const c=cmd.slice(4),t=tls.trips.find(t=>t.id===id);
 if(['settings','site-new'].includes(c)&&!tlsApprove()){toast('A management supervisor must configure the TLS.');return}
 if(['new','bind','check','bridge','deny'].includes(c)&&!tlsWrite()){toast('This role has view-only access.');return}
 if(c==='settings'){tlsSettings();return}
 if(c==='site-new'){openForm('Add transfer loading station','Creates a demo TLS with zero opening stock. Configure its operating profile before admitting trucks.',[textField('name','Facility name'),textField('area','Location / area'),field('partner','Facility operator organisation',{options:partnerOptions(p=>p.status==='Active'&&p.service==='Facility operations')})],'Add TLS',d=>{if(modules.facilities.some(f=>f.name.toLowerCase()===d.name.toLowerCase()))return'A facility with that name already exists.';const f={id:moduleID('FAC',modules.facilities),name:d.name,area:d.area,partner:d.partner,kind:'Transfer station',capacity:20,baseline:0,expected:0};modules.facilities.push(f);tlsConfig(f).status='Closed';tlsSelect(f.id);tlsTab='Configuration';recordModuleAction('Created TLS '+f.id)});return}
 if(c==='new'){openForm('Register arriving truck','Expected arrivals enter the gate-check list before joining the queue.',[textField('truck','Truck ID or registration plate'),textField('driver','Driver name'),field('partner','Collection partner',{options:partnerOptions(p=>p.status==='Active'&&p.service==='Collection')}),textField('route','Collection route / service area')],'Register trip',tlsRegister);return}
 if(c==='bind'){const orders=sim.orders.filter(o=>o.facility===tlsSite&&['Collected','At facility'].includes(o.stage)&&!Object.values(modules.tlsStores).some(s=>s.trips.some(t=>t.order===o.id)));if(!orders.length){dialog('No completed collections to link',note('Complete a collection in Service records and choose Record facility arrival. Its truck, driver, partner and route will carry into the TLS trip.'));return}openForm('Link collection assignment','Keep the assignment, partner, truck and driver attached to one trip reference.',[field('order','Completed collection',{options:orders.map(o=>({value:o.id,label:o.id+' · '+o.vehicle+' · '+o.area}))})],'Create linked trip',d=>tlsBind(sim.orders.find(o=>o.id===d.order)));return}
 if(c==='check'&&t){openForm('Gate check · '+t.truck,'Compare the vehicle in front of you with the expected trip. A mismatch holds admission.',[textField('observed','Observed truck ID or registration',t.plate||t.truck),field('method','Identity evidence',{options:['Manual document check','Simulated RFID','Simulated ANPR']}),field('result','Identity result',{options:['Matched','Mismatch — hold for review']}),textField('evidence','Evidence / gate log reference')],'Record gate decision',d=>tlsAdmission(t,d));return}
 if(c==='bridge'){const err=tlsStartBridge(t);if(err){toast(err);return}tlsCommit('Truck called to the weighbridge.');tlsTripDetail(t);return}
 if(c==='deny'&&t){openForm('Deny entry / withdraw trip',t.id+' · No received waste will be posted.',[textField('reason','Decision reason and destination advice')],'Record decision',d=>{if(!['Expected','Checked in'].includes(t.state))return'This truck has already progressed beyond the gate.';t.state='Denied entry';const v=modules.visits.find(v=>v.id===t.visit);if(v)v.departed=simNow();tlsEvent(t,'Entry denied / trip withdrawn: '+d.reason)});return}
 if(['weigh','unload','transfer'].includes(c)){const err=tlsSiteError();if(err){toast(err);return}}
 return tlsEntryRun(cmd,id);
};
advanceOrder=function(o){
 if(['Collected','At facility'].includes(o.stage)&&modules.facilities.some(f=>f.id===o.facility&&f.kind==='Transfer station')){
  if(!tlsSelect(o.facility)){toast('This TLS is not assigned to your workspace.');return}
  let t=tls.trips.find(t=>t.order===o.id);
  if(!t){const err=tlsBind(o);if(err){toast(err);return}t=tls.trips.find(t=>t.order===o.id)}
  saveModules();closeModal();goJourney('facility');tlsTripDetail(t);return;
 }
 tlsPreviousAdvance(o);
};
