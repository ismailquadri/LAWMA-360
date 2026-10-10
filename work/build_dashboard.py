from pathlib import Path
import base64
s=Path('work/dashboard-v3.html').read_text()
parts={'/*ICONLIB*/':Path('work/illustrations/smartwaste-icons.js').read_text(),'/*MAPCSS*/':Path('outputs/dashboard-assets/maplibre-gl.css').read_text(),'/*APPCSS*/':Path('work/dashboard-v3.css').read_text(),'/*MAPJS*/':Path('outputs/dashboard-assets/maplibre-gl.js').read_text(),'/*APPJS*/':Path('work/dashboard-v3.js').read_text(),'/*ROUTES*/':Path('work/routes.json').read_text(),'/*LOGO*/':'data:image/jpeg;base64,'+base64.b64encode(Path('outputs/lawma-logo.jpg').read_bytes()).decode()}
parts['/*JOURNEYCSS*/']=Path('work/journeys.css').read_text()
parts['/*JOURNEYJS*/']=Path('work/journeys.js').read_text()
parts['/*POLISHCSS*/']=Path('work/polish.css').read_text()
parts['/*POLISHJS*/']=Path('work/polish.js').read_text()
parts['/*MODULECSS*/']=Path('work/modules.css').read_text()
parts['/*MODULEDATA*/']=Path('work/module-data.js').read_text()
parts['/*MODULEJS*/']=Path('work/modules.js').read_text()
parts['/*SIMULATIONJS*/']=Path('work/simulation.js').read_text()
parts['/*SIMULATIONCSS*/']=Path('work/simulation.css').read_text()
parts['/*MOBILEJS*/']=Path('work/mobile-app.js').read_text()
parts['/*MOBILECSS*/']=Path('work/mobile-app.css').read_text()
parts['/*PRESENTATIONCSS*/']=Path('work/presentation.css').read_text()
parts['/*PRESENTATIONJS*/']=Path('work/presentation.js').read_text()
parts['/*TLSJS*/']=Path('work/tls.js').read_text()
parts['/*TLSENTRYJS*/']=Path('work/tls-entry.js').read_text()
parts['/*TLSLIFECYCLEJS*/']=Path('work/tls-lifecycle.js').read_text()
parts['/*TLSCSS*/']=Path('work/tls.css').read_text()+Path('work/experience.css').read_text()
parts['/*EXPERIENCEJS*/']=Path('work/experience.js').read_text()
for key,name,mime in [('PRODUCTLOGO','smartwaste360.svg','image/svg+xml'),('PRODUCTLOGODARK','smartwaste360-dark.svg','image/svg+xml'),('FLEETPHOTO','lawma-fleet.jpg','image/jpeg'),('PRODUCTMOCKUP','mobile-preview.png','image/png'),('PRODUCTVIDEO','product-tour.mp4','video/mp4'),('PRODUCTCAPTIONS','product-tour.vtt','text/vtt')]:
 p=Path('outputs/presentation-assets')/name
 parts['/*'+key+'*/']='data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode() if p.exists() else ''
for k,v in parts.items():s=s.replace(k,v)
Path('outputs/LAWMA_Service_Assurance_Dashboard.html').write_text(s)
print('Built standalone dashboard:',len(s),'characters')
