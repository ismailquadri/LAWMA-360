from pathlib import Path
import base64
s=Path('work/dashboard-v3.html').read_text()
parts={'/*MAPCSS*/':Path('outputs/dashboard-assets/maplibre-gl.css').read_text(),'/*APPCSS*/':Path('work/dashboard-v3.css').read_text(),'/*MAPJS*/':Path('outputs/dashboard-assets/maplibre-gl.js').read_text(),'/*APPJS*/':Path('work/dashboard-v3.js').read_text(),'/*ROUTES*/':Path('work/routes.json').read_text(),'/*LOGO*/':'data:image/jpeg;base64,'+base64.b64encode(Path('outputs/lawma-logo.jpg').read_bytes()).decode()}
parts['/*JOURNEYCSS*/']=Path('work/journeys.css').read_text()
parts['/*JOURNEYJS*/']=Path('work/journeys.js').read_text()
parts['/*POLISHCSS*/']=Path('work/polish.css').read_text()
parts['/*POLISHJS*/']=Path('work/polish.js').read_text()
for k,v in parts.items():s=s.replace(k,v)
Path('outputs/LAWMA_Service_Assurance_Dashboard.html').write_text(s)
print('Built standalone dashboard:',len(s),'characters')
