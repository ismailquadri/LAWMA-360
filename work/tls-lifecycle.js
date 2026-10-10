/* TLS modules 4–10. All observations are local demonstration records. */
const tlsActor=()=>journeyRoles[journey.role][0];
const tlsMass=(value,zero=false)=>Number.isFinite(Number(value))&&(zero?Number(value)>=0:Number(value)>0)&&Number.isSafeInteger(Math.round(Number(value)*1000));
const tlsAll=key=>Object.values(modules.tlsStores).flatMap(s=>s[key]||[]);
const tlsOutstanding=m=>m.kg-(m.accepted||0)-(m.returned||0)-(m.alternative||0);
const tlsReserved=()=>tls.trips.filter(t=>['Unloading','Unload paused'].includes(t.state)).reduce((n,t)=>n+t.net,0);
const tlsDue=hours=>new Date(Date.now()+Number(hours)*3600000).toISOString();
function tlsFlag(ref,reason,type='Review',severity='Medium'){
 const previous=tlsOpen().find(e=>e.ref===ref&&e.type===type);if(previous)return previous;
 const e=tlsException(ref,reason);Object.assign(e,{type,severity,status:'Open',due:tlsDue(24),events:[]});tlsEvent(e,'Review opened: '+reason);return e;
}
function tlsGuard(approve=false){return !permitted('facility')||!tlsSites().some(f=>f.id===tlsSite)?'This facility is outside your workspace.':!(approve?tlsApprove():tlsWrite())?'This action requires an authorised '+(approve?'supervisor.':'facility operator.'):null}
function tlsWeight(t,d){
 const guard=tlsGuard()||tlsSiteError();if(guard)return guard;
 if(!t||!['At weighbridge','Checked in'].includes(t.state))return'The trip is no longer ready for weighing.';
 const outage=tlsConfig(tlsFacility()).bridgeStatus==='Unavailable';
 if(t.state==='Checked in'&&!outage)return'Call this truck to the weighbridge first.';
 if(outage&&(!tlsApprove()||tlsConfig(tlsFacility()).bridgeStatus!=='Unavailable'||!d.override))return'A supervisor must authorise a manual record during a weighbridge outage.';
 if(tlsOpen().some(e=>e.ref===t.id))return'Resolve the trip hold first.';
 if(!tlsMass(d.gross)||!tlsMass(d.tare)||tlsKg(d.gross)<=tlsKg(d.tare))return'Enter valid positive weights; gross must exceed tare.';
 if(!d.evidence||tlsAll('trips').some(x=>x.id!==t.id&&tlsNormal(x.evidence)===tlsNormal(d.evidence)))return'Use a unique scale ticket reference.';
 if(d.inspection==='Rejected'&&!d.findings)return'Record the reason the load was rejected.';
 Object.assign(t,{gross:tlsKg(d.gross),tare:tlsKg(d.tare),net:tlsKg(d.gross)-tlsKg(d.tare),evidence:d.evidence,material:d.material,inspection:d.inspection,findings:d.findings,source:outage?'Manual outage record':d.source,weighed:simNow(),bridge:tlsConfig(tlsFacility()).bridge,bridgeExited:simNow(),weighedBy:tlsActor(),state:d.inspection==='Rejected'?'Rejected':'Weighed'});
 t.weighRecords ||= [];t.weighRecords.push({gross:t.gross,tare:t.tare,net:t.net,ticket:t.evidence,source:t.source,time:t.weighed,actor:tlsActor()});
 tlsEvent(t,t.inspection+' inspection; '+tonnes(t.net)+'; '+t.source+'; ticket '+t.evidence+(d.override?'; override: '+d.override:''));
 if(outage){t.manualPending=true;tlsFlag(t.id,'Manual outage weight requires supervisor reconciliation.','Manual weight','High')}else if(d.source==='Manual scale ticket'){tlsFlag(t.id,'Review the manually entered scale ticket before unloading.','Manual evidence','Low')}
 if(t.state==='Rejected')tlsFlag(t.id,'Rejected load: '+d.findings+'; record its diversion.','Rejected load','High');
}
function tlsReconcileWeight(t,d){
 const guard=tlsGuard(true);if(guard)return guard;
 if(!t?.manualPending||!['Weighed','Rejected'].includes(t.state))return'This weight is not awaiting reconciliation.';
 if(!tlsMass(d.gross)||!tlsMass(d.tare)||tlsKg(d.gross)<=tlsKg(d.tare))return'Gross must exceed a positive tare.';
 if(!d.evidence||!d.reason)return'Provide the verified ticket and reconciliation explanation.';
 if(tlsAll('trips').some(x=>x.id!==t.id&&tlsNormal(x.evidence)===tlsNormal(d.evidence)))return'This ticket is already used by another trip.';
 t.weighRecords ||= [];t.weighRecords.push({gross:tlsKg(d.gross),tare:tlsKg(d.tare),net:tlsKg(d.gross)-tlsKg(d.tare),ticket:d.evidence,source:'Supervisor reconciliation',reason:d.reason,time:simNow(),actor:tlsActor()});
 Object.assign(t,{gross:tlsKg(d.gross),tare:tlsKg(d.tare),net:tlsKg(d.gross)-tlsKg(d.tare),evidence:d.evidence,manualPending:false});
 for(const e of tlsOpen().filter(e=>e.ref===t.id&&e.type==='Manual weight')){e.resolution=d.reason;e.status='Resolved';e.resolved=simNow();tlsEvent(e,'Verified scale reconciliation: '+d.reason)}
 tlsEvent(t,'Scale record reconciled; accepted net '+tonnes(t.net)+'; '+d.reason);
}
function tlsBeginUnload(t,d){
 const guard=tlsGuard()||tlsSiteError();if(guard)return guard;
 if(!t||t.state!=='Weighed')return'This load is not ready to unload.';
 if(t.manualPending||tlsOpen().some(e=>e.ref===t.id))return'Resolve the trip review before unloading.';
 const reserved=tls.trips.filter(x=>['Unloading','Unload paused'].includes(x.state)).reduce((n,x)=>n+x.net,0);
 if(tlsBalance()+reserved+t.net>tlsConfig(tlsFacility()).stockCapacity)return'The holding area has insufficient capacity, including loads already unloading.';
 t.state='Unloading';t.bay=d.bay;t.unloadStarted=simNow();tlsEvent(t,'Unloading started in '+d.bay);
}
function tlsCompleteUnload(t,d){
 const guard=tlsGuard()||tlsSiteError();if(guard)return guard;
 if(t?.state!=='Unloading')return'This load is not actively unloading.';
 if(!d.confirmed)return'Confirm unloading is complete.';
 if(tlsOpen().some(e=>e.ref===t.id)||t.manualPending)return'Resolve the trip review first.';
 if(tlsBalance()+t.net>tlsConfig(tlsFacility()).stockCapacity)return'Configured holding capacity would be exceeded.';
 Object.assign(t,{state:'Unloaded',unloaded:simNow(),receipt:tlsID('INT')});tlsPost(t.id,t.net,'Received',t.id);
 const visit=modules.visits.find(v=>v.id===t.visit);if(visit)visit.departed=t.unloaded;
 const order=sim.orders.find(o=>o.id===t.order);if(order){order.stage='Verified';order.receipt={id:t.receipt,net:t.net,gross:t.gross,tare:t.tare,time:t.unloaded,kind:'TLS intake'};orderEvent(order,'TLS intake '+t.receipt+' completed; disposal remains separately evidenced')}
 tlsEvent(t,'Unloading completed in '+t.bay+'; '+tonnes(t.net)+' posted once; intake receipt '+t.receipt);
}
function tlsDivert(t,d){
 const guard=tlsGuard(true);if(guard)return guard;
 if(t?.state!=='Rejected')return'Only rejected incoming loads can be diverted.';
 if(t.manualPending)return'Reconcile the manual weight first.';
 if(!d.destination||!d.reason||!d.evidence)return'Record the destination, reason and departure evidence.';
 t.state='Diverted';t.diversion={...d,time:simNow(),actor:tlsActor()};const visit=modules.visits.find(v=>v.id===t.visit);if(visit)visit.departed=simNow();
 for(const e of tlsOpen().filter(e=>e.ref===t.id&&e.type==='Rejected load')){e.resolution=d.reason+'; '+d.evidence;e.status='Resolved';e.resolved=simNow();tlsEvent(e,'Diversion verified to '+d.destination)}
 tlsEvent(t,'Rejected load departed for '+d.destination+'; '+d.reason+'; evidence '+d.evidence+'; no TLS stock credited');
}
// Rebuild attributable stock from signed historical movements, including reductions.
tlsSources=function(){
 const lots=[{ref:'Opening stock',kg:tls.initialOpening}];
 for(const e of tls.ledger){
  if(e.kg>0){lots.push({ref:e.kind==='Received'&&tls.trips.some(t=>t.id===e.ref)?e.ref:e.key,kg:e.kg});continue}
  let remaining=-e.kg;const allocations=e.allocations||tls.transfers.find(m=>m.id===e.key)?.sources;
  if(allocations){for(const a of allocations){const lot=lots.find(l=>l.ref===a.ref);if(lot){const take=Math.min(lot.kg,a.kg,remaining);lot.kg-=take;remaining-=take}}}
  for(const lot of lots){if(!remaining)break;const take=Math.min(lot.kg,remaining);lot.kg-=take;remaining-=take}
 }
 return lots.filter(l=>l.kg>0);
};
function tlsAllocate(kg,source='FIFO'){let remaining=kg;const sources=[];for(const lot of tlsSources().filter(l=>source==='FIFO'||l.ref===source)){const take=Math.min(lot.kg,remaining);if(take){sources.push({ref:lot.ref,kg:take});remaining-=take}}return remaining?null:sources}
function tlsDispatch(d){
 const guard=tlsGuard()||tlsSiteError();if(guard)return guard;
 if(!tlsMass(d.kg)||tlsKg(d.kg)>tlsBalance())return'Enter a positive transfer quantity within available stock.';
 if(!d.departed)return'Confirm the truck has departed.';
 if(!tlsConfig(tlsFacility()).destinations.includes(d.destination))return'Choose an approved destination.';
 const carrier=partnerByID(d.partner);if(!carrier||carrier.status!=='Active'||!['Transport','Facility operations'].includes(carrier.service))return'Choose an active haulage or facility partner.';
 if(!tlsMass(d.hours)||Number(d.hours)>168)return'Enter an expected journey duration between 0 and 168 hours.';
 if(!d.ticket||tlsAll('transfers').some(m=>tlsNormal(m.ticket)===tlsNormal(d.ticket)))return'Use a unique outbound weigh ticket.';
 const vehicle=modules.vehicleRecords.find(v=>[v.vehicle,v.plate].some(x=>x&&tlsNormal(x)===tlsNormal(d.truck)));const truck=vehicle?.vehicle||d.truck;
 if(vehicle&&vehicle.partner!==d.partner)return'The registered truck belongs to a different partner.';
 if(tlsActiveTruck(truck)||tlsAll('transfers').some(m=>tlsNormal(m.truck)===tlsNormal(truck)&&tlsOutstanding(m)>0))return'This truck already has an unfinished movement.';
 const kg=tlsKg(d.kg),sources=tlsAllocate(kg,d.source);if(!sources)return'The selected source has insufficient unallocated stock.';
 const m={id:tlsID('MAN'),site:tlsSite,truck,driver:d.driver,partner:d.partner,destinationId:d.destination,destination:modules.facilities.find(f=>f.id===d.destination)?.name,kg,ticket:d.ticket,material:d.material,sources,state:'Awaiting destination',events:[],departed:simNow(),due:tlsDue(d.hours),receipts:[],accepted:0,returned:0,alternative:0};
 tls.transfers.push(m);tlsPost(m.id,-kg,'Transferred',m.id);tlsEvent(m,'Dispatched '+tonnes(kg)+'; ticket '+d.ticket+'; destination '+m.destination);
}
function tlsMovementState(m){const left=tlsOutstanding(m);m.state=left>0?(m.accepted||m.returned||m.alternative?'Partially accounted':'Awaiting destination'):(m.returned||m.alternative?'Accounted with exception':'Disposal confirmed')}
function tlsReceive(m,d){
 const guard=journey.role==='receiving'?(m?.destinationId!==tlsReceivingSite?'This transfer belongs to a different receiving facility.':null):tlsGuard();if(guard)return guard;
 if(!m||tlsOutstanding(m)<=0)return'This movement is fully accounted for.';
 if(!tlsMass(d.accepted,true)||!tlsMass(d.rejected,true))return'Enter non-negative accepted and rejected quantities.';
 const kg=tlsKg(d.accepted),rejected=tlsKg(d.rejected);
 if(kg+rejected<=0||kg+rejected>tlsOutstanding(m))return'Accepted plus rejected mass must be positive and cannot exceed the outstanding load.';
 if(!d.receipt||tlsAll('transfers').some(x=>x.receipt===d.receipt||(x.receipts||[]).some(r=>tlsNormal(r.id)===tlsNormal(d.receipt))))return'Use a unique destination receipt reference.';
 m.receipts ||= [];m.receipts.push({id:d.receipt,accepted:kg,rejected,officer:d.officer,notes:d.notes,time:simNow(),actor:tlsActor(),destination:m.destinationId});m.accepted=(m.accepted||0)+kg;m.receipt=d.receipt;tlsMovementState(m);
 tlsEvent(m,'Destination receipt '+d.receipt+': accepted '+tonnes(kg)+', reported rejected '+tonnes(rejected)+'; officer '+d.officer+'; '+d.notes);
 if(tlsOutstanding(m)>0)tlsFlag(m.id,'Destination has not accounted for '+tonnes(tlsOutstanding(m))+'. Record a further receipt, physical return or alternative disposal.','Destination reconciliation','High');
}
function tlsRemainder(m,d){
 const guard=tlsGuard(true);if(guard)return guard;
 if(!m||!tlsMass(d.kg)||tlsKg(d.kg)>tlsOutstanding(m))return'Enter a positive quantity within the outstanding mass.';
 if(!d.evidence||!d.officer||!d.destination)return'Provide location, officer and evidence.';
 const kg=tlsKg(d.kg),returned=d.kind==='Returned to this TLS';
 if(returned&&tlsBalance()+tlsReserved()+kg>tlsConfig(tlsFacility()).stockCapacity)return'The return exceeds this TLS holding capacity.';
 m.outcomes ||= [];if(m.outcomes.some(o=>tlsNormal(o.evidence)===tlsNormal(d.evidence)))return'This evidence is already recorded.';
 const outcome={id:tlsID('OUT'),...d,kg,time:simNow(),actor:tlsActor()};m.outcomes.push(outcome);
 if(returned){m.returned=(m.returned||0)+kg;tlsPost(outcome.id,kg,'Received',m.id+' return')}else m.alternative=(m.alternative||0)+kg;
 tlsMovementState(m);tlsFlag(m.id,'Review the recorded return or alternative disposal before day closure.','Destination reconciliation','High');tlsEvent(m,d.kind+': '+tonnes(kg)+' at '+d.destination+'; '+d.officer+'; evidence '+d.evidence);
}
function tlsAdjustment(d){
 const guard=tlsGuard(true);if(guard)return guard;
 if(!Number.isFinite(Number(d.kg))||!tlsKg(d.kg)||!d.reason)return'Enter a non-zero adjustment and its evidence.';
 const kg=tlsKg(d.kg),next=tlsBalance()+kg;
 if(next<0||next+tlsReserved()>tlsConfig(tlsFacility()).stockCapacity)return'The adjusted stock must remain between zero and holding capacity.';
 const allocations=kg<0?tlsAllocate(-kg):null;if(kg<0&&!allocations)return'Insufficient attributable stock.';
 const key=tlsID('ADJ');tlsPost(key,kg,'Adjustment',d.reason);tls.ledger.at(-1).allocations=allocations;recordModuleAction(tlsSite+': approved '+key+' '+tonnes(kg)+'; '+d.reason);
}
function tlsReviewException(e,d){
 const guard=tlsGuard();if(guard)return guard;
 if(!e||e.resolution)return'This review is already closed.';
 if(!d.owner||!d.note||!tlsMass(d.hours)||Number(d.hours)>720)return'Enter an owner, evidence note and a due interval up to 720 hours.';
 if(d.status==='Resolved'){
  if(!tlsApprove())return'A management supervisor must verify the resolution.';
  const trip=tls.trips.find(t=>t.id===e.ref),movement=tls.transfers.find(m=>m.id===e.ref);
  if(trip?.manualPending)return'Reconcile the manual scale record before resolving this review.';
  if(trip?.state==='Rejected')return'Record the rejected load’s diversion first.';
  if(movement&&tlsOutstanding(movement)>0)return'Account for the outstanding transfer mass before resolving this review.';
  e.resolution=d.note;e.resolved=simNow();
 }
 Object.assign(e,{owner:d.owner,severity:d.severity,status:d.status,due:tlsDue(d.hours)});tlsEvent(e,d.status+': '+d.note);
}
function tlsScan(record=true){
 for(const m of tls.transfers)if(tlsOutstanding(m)>0&&m.due&&Date.parse(m.due)<Date.now())tlsFlag(m.id,'Destination receipt is overdue; '+tonnes(tlsOutstanding(m))+' remains outstanding.','Overdue receipt','High');
 if(tlsBalance()>tlsConfig(tlsFacility()).stockCapacity)tlsFlag(tlsSite,'Recorded waste exceeds configured holding capacity.','Overcapacity','High');
 for(const t of tls.trips)if(!tlsTerminal(t)&&t.arrived&&Date.now()-Date.parse(t.arrived)>4*3600000)tlsFlag(t.id,'Truck has remained on site for more than the demo review threshold of four hours.','Delayed trip');
 if(record)recordModuleAction(tlsSite+': operational exception scan completed');
}
function tlsCloseDay(d){
 const guard=tlsGuard(true);if(guard)return guard;
 if(!d.confirmed)return'Confirm the reconciliation review.';
 if(tlsOpen().length||tls.trips.some(t=>!tlsTerminal(t))||tls.transfers.some(m=>tlsOutstanding(m)>0))return'Resolve exceptions, finish incoming trips and account for every transfer first.';
 const s=tls.stocktakes.filter(s=>s.day===tls.day).at(-1);
 if(!s||s.expected!==tlsBalance()||s.ledgerCount!==tls.ledger.length||Math.abs(s.kg-tlsBalance())>tlsConfig(tlsFacility()).tolerance)return'Record a fresh stocktake within tolerance after the final movement.';
 const balance=tlsBalance();tls.closed.push({day:tls.day,balance,opening:tls.opening,rows:tlsRows().map(e=>({...e})),stocktake:s.id,time:simNow(),actor:tlsActor()});const date=new Date(tls.day+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+1);tls.day=date.toISOString().slice(0,10);tls.opening=balance;recordModuleAction(tlsSite+': day approved and '+tonnes(balance)+' carried to '+tls.day);
}
for(const store of Object.values(modules.tlsStores)){
 store.exports ||= [];
 for(const e of store.exceptions){e.status ||= e.resolution?'Resolved':'Open';e.severity ||= 'Medium';e.due ||= new Date(Date.parse(e.time)+86400000).toISOString();e.type ||= 'Review'}
 for(const m of store.transfers){m.accepted ??=0;m.returned ??=0;m.alternative ??=0;m.departed ||= m.events?.[0]?.time;m.receipts ||= m.receipt?[{id:m.receipt,accepted:m.accepted,time:m.events?.at(-1)?.time,officer:'Legacy demo record'}]:[]}
}
const tlsMassField=(id,label,value,min=0)=>field(id,label,{type:'number',min,step:.001,value});
const tlsReviewStages=['Open','Acknowledged','Investigating','Correction requested','Awaiting verification','Resolved'];
const tlsMaterials=['Mixed municipal waste','Organic waste','Dry recyclable material','Residual waste'];
let tlsReport={from:'',to:'',partner:'All partners'};
const tlsDateOf=value=>value?new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value)):'';
const tlsReportTrips=()=>tls.trips.filter(t=>{const day=tlsDateOf(t.unloaded||t.weighed||t.arrived||t.registered||t.events?.[0]?.time);return(!tlsReport.from||day>=tlsReport.from)&&(!tlsReport.to||day<=tlsReport.to)&&(tlsReport.partner==='All partners'||t.partner===tlsReport.partner)});
function tlsTripActions(t){
 const actions=[];
 if(tlsWrite()){
  if(t.state==='Expected')actions.push(tlsButton('Check in truck','check',t.id,true));
  if(t.state==='Checked in'){actions.push(tlsButton('Call to weighbridge','bridge',t.id,true));if(tlsApprove()&&tlsConfig(tlsFacility()).bridgeStatus==='Unavailable')actions.push(tlsButton('Record outage weight','weigh',t.id))}
  if(t.state==='At weighbridge')actions.push(tlsButton('Record weight & inspection','weigh',t.id,true));
  if(t.manualPending&&tlsApprove())actions.push(tlsButton('Reconcile manual weight','reconcile-weight',t.id,true));
  if(t.state==='Weighed'&&!t.manualPending)actions.push(tlsButton('Start unloading','start-unload',t.id,true));
  if(t.state==='Unloading')actions.push(tlsButton('Complete unloading','unload',t.id,true),tlsButton('Record interruption','pause-unload',t.id));
  if(t.state==='Unload paused')actions.push(tlsButton('Resume unloading','resume-unload',t.id,true));
  if(t.state==='Rejected'&&tlsApprove())actions.push(tlsButton('Record diversion','divert',t.id,true));
  if(['Expected','Checked in'].includes(t.state))actions.push(tlsButton('Deny entry / withdraw','deny',t.id));
 }
 return '<div class="drawer-actions">'+actions.join('')+'</div>';
}
tlsTripDetail=function(t){
 const movements=tls.transfers.filter(m=>m.sources.some(s=>s.ref===t.id));
 drawer(t.id+' · '+t.truck,rowKV('TLS',esc(tlsName()))+rowKV('Partner',esc(partnerName(t.partner)))+rowKV('Collection assignment',esc(t.order||'Manual arrival'))+rowKV('Driver / route',esc(t.driver+' / '+t.route))+rowKV('Stage',status(t.state))+(t.net?rowKV('Net weight',tonnes(t.net)): '')+(t.material?rowKV('Material / bay',esc(t.material+' / '+(t.bay||'Not yet assigned'))):'')+(t.source?rowKV('Weight source',esc(t.source)): '')+(t.evidence?rowKV('Scale ticket',esc(t.evidence)): '')+(t.findings?rowKV('Inspection findings',esc(t.findings)): '')+(t.arrived?rowKV('Arrival',stamp(t.arrived)):'')+(t.queueMinutes!==undefined?rowKV('Queue time',t.queueMinutes+' min'):'')+(t.unloaded?rowKV('Turnaround',Math.round((Date.parse(t.unloaded)-Date.parse(t.arrived))/60000)+' min'):'')+(t.receipt?rowKV('Intake receipt',esc(t.receipt)):'')+tlsTripActions(t)+(t.weighRecords?.length?'<details class="tls-scale-history"><summary>Scale evidence history ('+t.weighRecords.length+')</summary>'+table(['Ticket / source','Gross / tare','Net'],t.weighRecords.map(w=>[esc(w.ticket)+'<small class="cell-sub">'+esc(w.source)+'</small>',tonnes(w.gross)+' / '+tonnes(w.tare),tonnes(w.net)]))+'</details>':'')+note('Recorded or simulated evidence. TLS intake confirms receipt into stock; destination receipts confirm disposal.')+(movements.length?'<h3>Linked outbound movements</h3>'+movements.map(m=>'<div class="tls-trace-link">'+tlsButton(m.id,'manifest',m.id)+`<span>${tonnes(m.sources.filter(s=>s.ref===t.id).reduce((n,s)=>n+s.kg,0))} allocated · ${esc(m.state)}</span></div>`).join(''):'')+tlsTimeline(t));
};
tlsTransferDetail=function(m){
 drawer(m.id+' · Transfer record',rowKV('Origin',esc(tlsName()))+rowKV('Carrier / truck',esc(partnerName(m.partner)+' / '+m.truck))+rowKV('Driver',esc(m.driver))+rowKV('Destination',esc(m.destination))+rowKV('Dispatched',tonnes(m.kg))+rowKV('Accepted at destination',tonnes(m.accepted||0))+rowKV('Returned to TLS',tonnes(m.returned||0))+rowKV('Alternative disposal',tonnes(m.alternative||0))+rowKV('Still outstanding',tonnes(tlsOutstanding(m)))+rowKV('State',status(m.state))+(m.due?rowKV('Receipt expected',stamp(m.due)):'')+table(['Source allocation','Mass'],m.sources.map(s=>[s.ref==='Opening stock'?s.ref:journey.role!=='receiving'&&tls.trips.some(t=>t.id===s.ref)?tlsButton(s.ref,'trip',s.ref):esc(s.ref),tonnes(s.kg)]))+note('Mixed waste is attributed by recorded mass. These source links do not claim physical segregation.')+`<div class="drawer-actions">${(tlsWrite()||journey.role==='receiving')&&tlsOutstanding(m)>0?tlsButton('Record destination receipt','receive',m.id,true):''}${tlsApprove()&&tlsOutstanding(m)>0?tlsButton('Account for remaining load','remainder',m.id):''}</div>`+((m.receipts||[]).length?table(['Receipt','Accepted / rejected','Receiving officer'],m.receipts.map(r=>[esc(r.id),tonnes(r.accepted)+' / '+tonnes(r.rejected||0),esc(r.officer)])):'')+tlsTimeline(m));
};
function tlsInsights(){
 const trips=tlsReportTrips(),unloaded=trips.filter(t=>t.state==='Unloaded'&&!t.manualPending),visits=unloaded.filter(t=>t.arrived&&t.unloaded),average=visits.length?Math.round(visits.reduce((n,t)=>n+(Date.parse(t.unloaded)-Date.parse(t.arrived))/60000,0)/visits.length):null;
 const partners=[...new Set(trips.map(t=>t.partner))];
 return panel('TLS performance','Trip filters use the completion date, or the latest available trip date, in Lagos time. All figures come from demonstration records.',`<form id="tlsReportFilters" class="tls-report-filters"><label>From<input type="date" name="from" value="${esc(tlsReport.from)}"></label><label>To<input type="date" name="to" value="${esc(tlsReport.to)}"></label><label>Collection partner<select name="partner">${selectOptions([{value:'All partners',label:'All partners'},...modules.partners.filter(p=>p.service==='Collection').map(p=>({value:p.id,label:p.name}))],tlsReport.partner)}</select></label><button class="btn" type="submit">Apply filters</button></form><div class="module-pad"><div class="tls-insight-grid">${[['Trips in selection',trips.length],['Unloaded receipts',unloaded.length],['Received from these trips',tonnes(unloaded.reduce((n,t)=>n+t.net,0))],['Average turnaround',average===null?'No completed visits':average+' min · '+visits.length+(visits.length===1?' visit':' visits')]].map(([label,n])=>`<div><span>${label}</span><strong>${n}</strong></div>`).join('')}</div>${tlsButton('Export filtered trips (CSV)','report-export')}</div>`+table(['Collection partner','Trips / unloaded','Received','Open trip reviews'],partners.map(id=>{const own=trips.filter(t=>t.partner===id);return[esc(partnerName(id)),own.length+' / '+own.filter(t=>t.state==='Unloaded').length,tonnes(own.filter(t=>t.state==='Unloaded').reduce((n,t)=>n+t.net,0)),tlsOpen().filter(e=>own.some(t=>t.id===e.ref)).length]}))+note('Route completion, missed collections and GPS compliance require their own evidence. They are not inferred from tonnage or truck arrival.'))+panel('Trace the selected trips','Open a record to follow its intake and allocated transfers.',trips.length?table(['Trip','Truck','Stage','Evidence source',''],trips.map(t=>[esc(t.id),esc(t.truck),status(t.state),esc(t.source||'Awaiting weight'),tlsButton('Trace trip','trip',t.id)])):empty('No trips match these filters','Choose a wider date range or another partner.'))+panel('Current facility follow-up','These totals cover this TLS across all dates, independently of the trip filters.',`<div class="module-pad"><div class="drawer-actions">${tlsButton(tls.trips.filter(t=>['Checked in','At weighbridge','Weighed','Unloading','Unload paused','Rejected'].includes(t.state)).length+' trucks on site','tab','Queue')}${tlsButton(tls.transfers.filter(m=>tlsOutstanding(m)>0).length+' unconfirmed transfers','tab','Transfers')}${tlsButton(tlsOpen().length+' open reviews','tab','Exceptions')}</div></div>`);
}
function tlsAuditView(){
 const records=[...tls.trips,...tls.transfers,...tls.exceptions].flatMap(r=>(r.events||[]).map(e=>({...e,ref:r.id}))).concat(tls.ledger.map(e=>({time:e.time,actor:e.actor,ref:e.key,text:e.kind+' '+tonnes(e.kg)+' · '+e.ref})),(tls.exports||[]).map(e=>({...e,ref:tlsSite,text:'Exported '+e.kind})),(tlsConfig(tlsFacility()).history||[]).map(e=>({...e,ref:tlsSite,text:'Operating configuration changed'})),tls.closed.map(e=>({...e,ref:e.day,text:'Operating day closed with '+tonnes(e.balance)}))).sort((a,b)=>Date.parse(b.time||0)-Date.parse(a.time||0));
 return panel('Activity and access','Actions retain their role, time and source record within this demonstration.',records.length?table(['When','Role','Record','Action'],records.map(e=>[e.time?stamp(e.time):'Legacy record',esc(e.actor||'Demo role'),esc(e.ref),esc(e.text)])):empty('No TLS activity yet','Recorded actions will appear here.'))+panel('Evidence and access boundaries','For the demonstration and the future operational service.',`<div class="module-pad">${rowKV('Facility operators','Register, weigh, unload, dispatch and record receipt evidence')}${rowKV('Management / administrator','Verify manual weights, approve adjustments, diversions and closure')}${rowKV('Devices','RFID, ANPR, GPS and scales: simulated or manually recorded')}${rowKV('Finance','Operational reconciliation only; no payment authority')}${note('Role previews and browser storage are demonstration controls. Production requires authenticated staff, destination-specific permissions, durable audit records and server enforcement.')}${tlsButton('Export full reconciliation (JSON)','export')}</div>`);
}
const tlsLifecycleScreen=screens.facility;
screens.facility=()=>{
 if(tlsWrite()&&tlsSites().some(f=>f.id===tlsSite))tlsScan(false);
 let html=tlsLifecycleScreen();
 if(!tlsSites().some(f=>f.id===tlsSite))return html;
 if(tlsTab==='Insights')html+=tlsInsights();
 if(tlsTab==='Network')html+=tlsNetwork();
 if(tlsTab==='Audit')html+=tlsAuditView();
 if(tlsTab==='Exceptions')html+=`<div class="module-pad">${tlsWrite()?tlsButton('Check overdue records','scan'):''}${note('Checks run when this workspace opens and every minute while visible. Four hours on site and 24-hour review deadlines are demonstration defaults, subject to LAWMA confirmation.')}</div>`;
 return html;
};
document.addEventListener('submit',event=>{if(event.target.id!=='tlsReportFilters')return;event.preventDefault();const d=Object.fromEntries(new FormData(event.target));if(d.from&&d.to&&d.from>d.to){toast('The end date must follow the start date.');return}tlsReport=d;renderJourney()});
function tlsDownload(data,type,name,kind){tls.exports ||= [];tls.exports.push({kind,time:simNow(),actor:tlsActor()});recordModuleAction(tlsSite+': '+kind+' exported');const blob=new Blob([data],{type}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Export prepared with its source records.');}
const tlsLifecycleRun=runModule;
runModule=function(cmd,id){
 if(!cmd.startsWith('tls-'))return tlsLifecycleRun(cmd,id);
 if(!permitted('facility')||!tlsSites().some(f=>f.id===tlsSite)){toast('This TLS is outside your workspace.');return}
 const c=cmd.slice(4),t=tls.trips.find(t=>t.id===id),m=tls.transfers.find(m=>m.id===id);
 if(c==='site-view'){if(tlsSelect(id)){tlsTab='Insights';renderJourney()}return}
 if(c==='export'){const generated=simNow();tlsDownload(JSON.stringify({schema:'smartwaste-tls-demo-v2',facility:tlsFacility(),units:'kg',generated,exportedBy:tlsActor(),mode:'Local demonstration; no connected devices',...tls},null,2),'application/json','TLS-'+tlsSite+'-'+tls.day+'.json','Full reconciliation');return}
 if(c==='report-export'){const quote=csvCell;const rows=[['Trip','Truck','Partner','Stage','Net kg','Source','Intake receipt','Completion WAT date'],...tlsReportTrips().map(t=>[t.id,t.truck,partnerName(t.partner),t.state,t.net||0,t.source||'Pending',t.receipt||'',tlsDateOf(t.unloaded)])];tlsDownload(rows.map(row=>row.map(quote).join(',')).join('\r\n'),'text/csv;charset=utf-8','TLS-'+tlsSite+'-filtered-trips.csv','Filtered trips '+JSON.stringify(tlsReport));return}
 const mutations=['weigh','reconcile-weight','start-unload','unload','pause-unload','resume-unload','divert','transfer','receive','remainder','adjust','resolve','scan','close','stock'];
 if(!mutations.includes(c))return tlsLifecycleRun(cmd,id);
 const err=tlsGuard(['reconcile-weight','divert','remainder','adjust','close'].includes(c));if(err){toast(err);return}
 if(['weigh','transfer','start-unload','unload'].includes(c)&&tlsSiteError()){toast(tlsSiteError());return}
 if(c==='weigh'&&t){openForm('Weigh and inspect · '+t.truck,'Record the scale evidence and inspect the material before unloading. Stock changes only after confirmed unloading.',[tlsMassField('gross','Gross weight (tonnes)',18.4,.001),tlsMassField('tare','Tare weight (tonnes)',11.2,.001),textField('evidence','Unique scale ticket'),field('source','Weight source',{options:['Simulated weighbridge','Manual scale ticket']}),field('material','Material category',{options:tlsMaterials}),field('inspection','Inspection decision',{options:['Accepted','Rejected']}),textField('findings','Inspection findings / contamination evidence'),...(tlsConfig(tlsFacility()).bridgeStatus==='Unavailable'?[textField('override','Supervisor outage authorisation and reason')]:[])],'Save weight and inspection',d=>tlsWeight(t,d));tlsNetPreview();return}
 if(c==='reconcile-weight'&&t){openForm('Reconcile manual scale evidence','The original record stays in the trip history. Revised quantities apply before stock is received.',[tlsMassField('gross','Verified gross (tonnes)',t.gross/1000,.001),tlsMassField('tare','Verified tare (tonnes)',t.tare/1000,.001),textField('evidence','Verified ticket reference',t.evidence),textField('reason','Reconciliation finding and evidence')],'Verify scale record',d=>tlsReconcileWeight(t,d));tlsNetPreview();return}
 if(c==='start-unload'&&t){openForm('Start unloading','Reserve a receiving bay for '+tonnes(t.net)+'. No stock is posted until completion.',[textField('bay','Receiving bay / holding area')],'Start unloading',d=>tlsBeginUnload(t,d));return}
 if(c==='unload'&&t){openForm('Complete unloading',tonnes(t.net)+' will be received into '+(t.bay||'the holding area')+' once.',[field('confirmed','All accepted waste is unloaded and truck is clear',{type:'checkbox'})],'Issue intake receipt',d=>tlsCompleteUnload(t,d));return}
 if(['pause-unload','resume-unload'].includes(c)&&t){openForm(c==='pause-unload'?'Record unloading interruption':'Resume unloading','The trip remains open; waste is not yet credited to stock.',[textField('reason','Incident / recovery details and evidence')],'Save update',d=>{const expected=c==='pause-unload'?'Unloading':'Unload paused';if(t.state!==expected)return'The trip state has changed.';t.state=c==='pause-unload'?'Unload paused':'Unloading';tlsEvent(t,t.state+': '+d.reason)});return}
 if(c==='divert'&&t){openForm('Divert rejected load','The rejected load will leave without entering TLS stock.',[textField('destination','Approved diversion location'),textField('reason','Supervisor reason'),textField('evidence','Departure / diversion evidence')],'Confirm diversion',d=>tlsDivert(t,d));return}
 if(c==='transfer'){openForm('Dispatch transfer','Available stock: '+tonnes(tlsBalance())+'. Each departure receives its own manifest, including split loads.',[textField('truck','Outbound truck'),textField('driver','Driver'),field('partner','Carrier',{options:partnerOptions(p=>p.status==='Active'&&['Transport','Facility operations'].includes(p.service))}),field('source','Stock allocation',{options:[{value:'FIFO',label:'Mixed stock — oldest available first'},...tlsSources().map(l=>({value:l.ref,label:l.ref+' · '+tonnes(l.kg)}))]}),tlsMassField('kg','Dispatched mass (tonnes)',undefined,.001),field('material','Material category',{options:tlsMaterials}),textField('ticket','Unique outbound scale ticket'),field('destination','Receiving destination',{options:tlsConfig(tlsFacility()).destinations.map(id=>({value:id,label:modules.facilities.find(f=>f.id===id)?.name||id}))}),field('hours','Receipt expected within (hours)',{type:'number',min:.25,max:168,step:.25,value:4}),field('departed','Departure is confirmed',{type:'checkbox'})],'Dispatch and issue manifest',tlsDispatch);return}
 if(c==='receive'&&m){openForm('Record destination receipt','Outstanding: '+tonnes(tlsOutstanding(m))+'. Partial acceptance keeps the remaining quantity open.',[tlsMassField('accepted','Accepted mass (tonnes)',tlsOutstanding(m)/1000),tlsMassField('rejected','Reported rejected mass (tonnes)',0),textField('receipt','Unique destination receipt'),textField('officer','Receiving officer'),textField('notes','Acceptance / rejection evidence')],'Save destination receipt',d=>tlsReceive(m,d));return}
 if(c==='remainder'&&m){openForm('Account for remaining load','Outstanding: '+tonnes(tlsOutstanding(m))+'. Only a confirmed physical return adds stock back to this TLS.',[field('kind','Outcome',{options:['Returned to this TLS','Confirmed alternative disposal']}),tlsMassField('kg','Mass accounted for (tonnes)',tlsOutstanding(m)/1000,.001),textField('destination','Confirmed receiving location'),textField('officer','Receiving officer'),textField('evidence','Receipt / return evidence')],'Record verified outcome',d=>tlsRemainder(m,d));return}
 if(c==='adjust'){openForm('Approve stock adjustment','Original records stay unchanged. Reductions also reduce the mass available for future source allocations.',[field('kg','Signed adjustment (tonnes)',{type:'number',min:-100000,step:.001}),textField('reason','Reason and supporting evidence')],'Approve adjustment',tlsAdjustment);return}
 if(c==='stock'){openForm('Physical stocktake','The estimate is compared with transaction stock in tonnes; it does not replace the ledger.',[tlsMassField('kg','Estimated physical stock (tonnes)'),textField('method','Measurement method and evidence')],'Compare stocktake',d=>{if(!tlsMass(d.kg,true))return'Enter a valid non-negative mass.';const s={id:tlsID('STK'),day:tls.day,kg:tlsKg(d.kg),expected:tlsBalance(),method:d.method,time:simNow(),actor:tlsActor(),ledgerCount:tls.ledger.length};s.variance=s.kg-s.expected;tls.stocktakes.push(s);if(Math.abs(s.variance)>tlsConfig(tlsFacility()).tolerance)tlsFlag(s.id,'Physical stock variance '+tonnes(s.variance),'Stocktake variance','High');recordModuleAction(tlsSite+': stocktake '+s.id+' variance '+tonnes(s.variance))});return}
 if(c==='resolve'){const e=tls.exceptions.find(e=>e.id===id);if(e)openForm('Review '+e.id,e.reason,[textField('owner','Responsible officer',e.owner),field('severity','Priority',{options:['Low','Medium','High'],value:e.severity||'Medium'}),field('status','Review stage',{options:tlsApprove()?tlsReviewStages:tlsReviewStages.filter(s=>s!=='Resolved'),value:e.status||'Open'}),field('hours','Follow-up due within (hours)',{type:'number',min:1,max:720,value:24}),textField('note','Finding, action and evidence')],'Save review',d=>tlsReviewException(e,d));return}
 if(c==='scan'){tlsScan();tlsCommit('Operational checks completed. Open reviews are listed below.');return}
 if(c==='close'){openForm('Close and carry forward','Complete outstanding movements and verify a fresh stocktake before approving the operating period.',[field('confirmed','I have reviewed this period and its physical stocktake',{type:'checkbox'})],'Approve day closure',tlsCloseDay);return}
};
// Receiving and audit personas remain explicitly simulated role previews.
journeyRoles.receiving=['Destination operator','facility','Destination receipts and accepted or rejected load evidence'];
journeyRoles.auditor=['TLS auditor','facility','Read-only trip, ledger and activity review'];
personaPages.receiving=['facility'];personaPages.auditor=['facility'];
for(const select of document.querySelectorAll?.('#persona,#entryRole,#productSignup select[name="role"]')||[]){for(const role of ['receiving','auditor']){if(!select.querySelector(`option[value="${role}"]`)){const option=document.createElement('option');option.value=role;option.textContent=journeyRoles[role][0];select.append(option)}}}
let tlsReceivingSite=modules.facilities.find(f=>f.kind==='Disposal facility')?.id;
const tlsReceivingScreen=screens.facility;
screens.facility=()=>{
 if(journey.role!=='receiving')return tlsReceivingScreen();
 const movements=Object.entries(modules.tlsStores).flatMap(([site,store])=>store.transfers.filter(m=>m.destinationId===tlsReceivingSite).map(m=>({site,m})));
 return pageHead('RECEIVING FACILITY','Confirm what arrived.','Compare the transfer manifest with the measured acceptance at your destination.')+`<div class="tls-site-bar"><label>Receiving facility<select id="tlsReceivingSite">${selectOptions(modules.facilities.filter(f=>f.kind==='Disposal facility').map(f=>({value:f.id,label:f.name})),tlsReceivingSite)}</select></label><span>Destination operator · demonstration access</span></div>`+panel('Transfer receipt inbox','Partial acceptance keeps the remaining load open for reconciliation.',movements.length?table(['Manifest / truck','Origin TLS','Dispatched / outstanding','Stage',''],movements.map(({site,m})=>[esc(m.id)+'<small class="cell-sub">'+esc(m.truck)+'</small>',esc(modules.facilities.find(f=>f.id===site)?.name||site),tonnes(m.kg)+' / '+tonnes(tlsOutstanding(m)),status(m.state),tlsButton('Review load','manifest',m.id)])):empty('No transfers addressed here','Dispatch a transfer from TLS operations to this receiving facility.'));
};
document.addEventListener('change',event=>{if(event.target.id==='tlsReceivingSite'){tlsReceivingSite=event.target.value;renderJourney()}});
const tlsReceivingRun=runModule;
runModule=function(cmd,id){
 if(journey.role!=='receiving'||!cmd.startsWith('tls-'))return tlsReceivingRun(cmd,id);
 if(!['tls-manifest','tls-receive'].includes(cmd)){toast('This workspace records destination receipts only.');return}
 const match=Object.entries(modules.tlsStores).map(([site,s])=>({site,m:s.transfers.find(m=>m.id===id&&m.destinationId===tlsReceivingSite)})).find(x=>x.m);
 if(!match){toast('The transfer is outside this receiving facility.');return}
 tlsSelect(match.site);
 if(cmd==='tls-manifest'){tlsTransferDetail(match.m);return}
 const m=match.m;openForm('Confirm destination receipt','Outstanding: '+tonnes(tlsOutstanding(m))+'. Use destination evidence to record acceptance.',[tlsMassField('accepted','Accepted mass (tonnes)',tlsOutstanding(m)/1000),tlsMassField('rejected','Rejected mass (tonnes)',0),textField('receipt','Unique disposal receipt'),textField('officer','Receiving officer'),textField('notes','Receipt evidence and findings')],'Confirm receipt',d=>tlsReceive(m,d));
};
function tlsNetPreview(){
 if(!$('moduleForm')||!$('mf-gross')||!$('mf-tare'))return;
 let output=$('tlsNetPreview');if(!output){output=document.createElement('p');output.id='tlsNetPreview';output.className='tls-net-preview';output.setAttribute('role','status');output.setAttribute('aria-live','polite');$('moduleForm').insertBefore(output,$('moduleError'))}
 const gross=Number($('mf-gross').value),tare=Number($('mf-tare').value);output.textContent=Number.isFinite(gross)&&Number.isFinite(tare)&&gross>tare&&tare>0?'Calculated net waste: '+tonnes(tlsKg(gross)-tlsKg(tare)):'Net waste will appear when gross exceeds a positive tare weight.';
}
document.addEventListener('input',event=>{if(['mf-gross','mf-tare'].includes(event.target.id))tlsNetPreview()});
function tlsNetwork(){
 const sites=tlsSites().map(f=>{const store=modules.tlsStores[f.id]||{opening:0,day:tlsDay(),trips:[],transfers:[],ledger:[],exceptions:[]};const rows=store.ledger.filter(e=>e.day===store.day);return{f,store,balance:store.opening+rows.reduce((n,e)=>n+e.kg,0),received:rows.filter(e=>e.kind==='Received').reduce((n,e)=>n+e.kg,0),transferred:rows.filter(e=>e.kind==='Transferred').reduce((n,e)=>n-e.kg,0)}});
 return panel('TLS network overview','Each site reports against its own open operating day. Select a site to examine its records.',table(['TLS / operating day','State','On-site trucks','Received / transferred','Stock','Open reviews',''],sites.map(({f,store,balance,received,transferred})=>[esc(f.name)+'<small class="cell-sub">'+store.day+'</small>',esc(tlsConfig(f).status),store.trips.filter(t=>t.arrived&&!tlsTerminal(t)).length,tonnes(received)+' / '+tonnes(transferred),tonnes(balance),store.exceptions.filter(e=>!e.resolution).length,tlsButton('Open TLS','site-view',f.id)])))+note('The facility register is configurable. No illustrative national or state facility count is treated as a confirmed LAWMA estate. Received mass includes confirmed returns.');
}
const tlsPartnerDispatch=screens.dispatch;
screens.dispatch=()=>{
 const html=tlsPartnerDispatch();if(!['psp','partner'].includes(journey.role))return html;
 const trips=Object.entries(modules.tlsStores).flatMap(([site,s])=>s.trips.filter(t=>t.partner===modules.partnerContext).map(t=>({site,t})));
 return html+panel('Your TLS deliveries','Collection partners can follow their own facility evidence and intake receipts.',trips.length?table(['Trip / truck','TLS','Stage','Net intake',''],trips.map(({site,t})=>[esc(t.id)+'<small class="cell-sub">'+esc(t.truck)+'</small>',esc(modules.facilities.find(f=>f.id===site)?.name||site),status(t.state),t.state==='Unloaded'?tonnes(t.net):'Not yet unloaded',button('View delivery','partner-tls-trip',t.id)])):empty('No TLS delivery recorded yet','Your completed collection will appear when the receiving TLS registers its trip.'));
};
const tlsPartnerRun=runModule;
runModule=function(cmd,id){
 if(cmd!=='partner-tls-trip')return tlsPartnerRun(cmd,id);
 if(!permitted('dispatch'))return;
 const found=Object.entries(modules.tlsStores).map(([site,s])=>({site,s,t:s.trips.find(t=>t.id===id&&t.partner===modules.partnerContext)})).find(x=>x.t);if(!found){toast('This delivery belongs to another partner.');return}
 const {t,s,site}=found,movements=s.transfers.filter(m=>m.sources.some(a=>a.ref===t.id));
 drawer(t.id+' · Your delivery',rowKV('TLS',esc(modules.facilities.find(f=>f.id===site)?.name||site))+rowKV('Truck / route',esc(t.truck+' / '+t.route))+rowKV('Stage',status(t.state))+rowKV('Intake receipt',esc(t.receipt||'Awaiting unloading'))+rowKV('Received mass',t.state==='Unloaded'?tonnes(t.net):'Not yet unloaded')+(movements.length?table(['Transfer reference','Allocated mass','State'],movements.map(m=>[esc(m.id),tonnes(m.sources.filter(a=>a.ref===t.id).reduce((n,a)=>n+a.kg,0)),status(m.state)])):'')+note('Transfer allocations follow recorded mass in mixed TLS stock. They do not establish physically segregated disposal of this collection load.')+tlsTimeline(t));
};

if(typeof window!=='undefined')setInterval(()=>{if(journey.page==='facility'&&tlsWrite()&&!document.hidden&&$('modalBack').hidden&&tlsSites().some(f=>f.id===tlsSite)){const count=tls.exceptions.length;tlsScan(false);if(tls.exceptions.length!==count)renderJourney()}},60000);
