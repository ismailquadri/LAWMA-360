/* Fictional, browser-session records. Categories are proposals, not a LAWMA taxonomy. */
const moduleSeed = () => ({
  version: 1,
  categories: ['PSP', 'Recycling & recovery', 'Facility operations', 'Transport & haulage', 'Technical services'],
  partners: [
    ...Array.from({length:18}, (_,i) => ({id:'PAR-'+String(i+1).padStart(3,'0'), name:'PSP partner '+String(i+1).padStart(2,'0'), type:'PSP', service:'Collection', area:i===5?'Ikeja':ROUTES[i%ROUTES.length].name, status:'Active', contact:'Demonstration coordinator', reference:'DEMO-PSP-'+String(i+1).padStart(3,'0')})),
    {id:'PAR-019',name:'Recovery partner 01',type:'Recycling & recovery',service:'Recovery',area:'Ikeja',status:'Active',contact:'Recovery coordinator',reference:'DEMO-REC-019'},
    {id:'PAR-020',name:'Facility partner 01',type:'Facility operations',service:'Facility operations',area:'Oshodi',status:'Active',contact:'Facility coordinator',reference:'DEMO-FAC-020'},
    {id:'PAR-021',name:'Haulage partner 01',type:'Transport & haulage',service:'Transport',area:'Apapa',status:'Pending review',contact:'Transport coordinator',reference:'DEMO-TRN-021'},
    {id:'PAR-022',name:'Technical partner 01',type:'Technical services',service:'Technical support',area:'Lagos',status:'Active',contact:'Support coordinator',reference:'DEMO-TEC-022'}
  ],
  personnel:[{id:'PER-001',partner:'PAR-006',name:'Babatunde A.',role:'Driver',status:'Available'},{id:'PER-002',partner:'PAR-019',name:'Recovery coordinator',role:'Coordinator',status:'Available'}],
  vehicleRecords:[],
  facilities:[
    {id:'FAC-001',partner:'PAR-020',name:'Ikeja transfer station',area:'Ikeja',capacity:30,expected:26,baseline:27,kind:'Transfer station'},
    {id:'FAC-002',partner:'PAR-020',name:'Oshodi holding area',area:'Oshodi',capacity:24,expected:21,baseline:26,kind:'Holding area'},
    {id:'FAC-003',partner:'PAR-020',name:'Disposal site A',area:'Lagos',capacity:45,expected:34,baseline:32,kind:'Disposal facility'}
  ],
  visits:[],
  incidents:[{id:'INC-001',type:'Capacity breach',subject:'FAC-002',partner:'PAR-020',area:'Oshodi',priority:'High',status:'Open',owner:'Unassigned',description:'Manual sample count exceeds the configured holding capacity.',resolution:'',notes:[],created:'2026-10-05T07:20:00.000Z'}],
  reviews:[],
  policies:[{id:'POL-001',name:'Facility capacity review',trigger:'Vehicles present exceed the site capacity',response:'Supervisor reviews occupancy and records an action',status:'Draft — not approved'},{id:'POL-002',name:'Missing collection evidence',trigger:'A service event has incomplete supporting evidence',response:'Request evidence and record a human decision',status:'Draft — not approved'}],
  resident:{name:'Amina',area:'Ikeja',property:'PR-0182',partner:'PAR-006',address:'Demonstration household, Ikeja'},
  serviceRequests:[],
  users:[{id:'USR-001',name:'Operations supervisor',role:'operations',status:'Active'},{id:'USR-002',name:'Partner coordinator',role:'partner',status:'Active'}],
  partnerContext:'PAR-006',audit:[]
});
let modules=moduleSeed();
try {
  const saved=JSON.parse(sessionStorage.getItem('lawma-modules-v1')||localStorage.getItem('lawma-demo-saved-v1')||'null');
  if(saved?.version===1 && Array.isArray(saved.partners) && Array.isArray(saved.incidents)) modules={...modules,...saved};
} catch { /* Start with the demonstration dataset if browser storage is unavailable. */ }
function saveModules(){
  try { sessionStorage.setItem('lawma-modules-v1',JSON.stringify(modules)); localStorage.setItem('lawma-demo-saved-v1',JSON.stringify(modules)); return true; }
  catch { toast('Browser storage is unavailable. Changes last until this page is reloaded.'); return false; }
}
function recordModuleAction(text){
  modules.audit.unshift({time:new Date().toISOString(),actor:journeyRoles[journey.role]?.[0]||'Demonstration user',text});
  saveModules();
}
function moduleID(prefix,records){let n=records.length+1;while(records.some(r=>r.id===prefix+'-'+String(n).padStart(3,'0')))n++;return prefix+'-'+String(n).padStart(3,'0')}
const partnerByID=id=>modules.partners.find(p=>p.id===id);
const partnerName=id=>partnerByID(id)?.name||'No partner assigned';
const partnerFleet=id=>fleet.filter(v=>v.partnerId===id);
const occupancy=f=>f.baseline+modules.visits.filter(v=>v.facility===f.id&&!v.departed).length;
const isAuthority=()=>['management','operations','admin'].includes(journey.role);
const canMaintain=()=>['management','admin'].includes(journey.role);
const currentPartner=()=>partnerByID(modules.partnerContext)||modules.partners[0];

// Existing session fixtures predate explicit facility ownership.
modules.facilities.forEach(f=>{f.partner ||= 'PAR-020'});
