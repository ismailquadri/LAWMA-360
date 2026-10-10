/* SmartWaste 360 icon helpers. Build injects the trusted local asset registry. */
(function(){
  const assets=/*ASSETS*/;
  const metadata=/*METADATA*/;
  function create(id,{size=48,label}={}){
    if(!assets[id])throw new Error('Unknown SmartWaste icon: '+id);
    const svg=new DOMParser().parseFromString(assets[id],'image/svg+xml').documentElement;
    svg.setAttribute('width',size);svg.setAttribute('height',size);svg.classList.add('sw-library-icon');
    svg.setAttribute('focusable','false');svg.dataset.swIcon=id;
    if(label){svg.setAttribute('role','img');svg.setAttribute('aria-label',label)}else svg.setAttribute('aria-hidden','true');
    return document.importNode(svg,true);
  }
  function animate(svg){
    const parts=[svg,...svg.querySelectorAll('.ticket,.seal,.check')];
    parts.forEach(p=>p.getAnimations?.().forEach(a=>a.cancel()));
    if(matchMedia('(prefers-reduced-motion: reduce)').matches||document.hidden)return;
    const options={duration:320,easing:'cubic-bezier(.2,0,0,1)'};
    const ticket=svg.querySelector('.ticket'),seal=svg.querySelector('.seal'),check=svg.querySelector('.check');
    if(ticket&&seal){
      ticket.animate([{opacity:.3,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],options);
      seal.animate([{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{...options,delay:100,fill:'backwards'});
      if(check){const length=check.getTotalLength();check.animate([{strokeDasharray:length,strokeDashoffset:length},{strokeDasharray:length,strokeDashoffset:0}],{duration:240,delay:180,fill:'backwards',easing:'ease-out'});}
    }else svg.animate([{opacity:.3,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],options);
  }
  window.SmartWasteIcons=Object.freeze({create,animate,list:()=>metadata.map(item=>({...item}))});
})();
