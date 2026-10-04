import json,time,urllib.request
from pathlib import Path
routes=[('Ikeja', [[3.338,6.601],[3.350,6.620],[3.375,6.595]]),('Yaba',[[3.365,6.528],[3.379,6.508],[3.387,6.497]]),('Surulere',[[3.333,6.500],[3.349,6.493],[3.358,6.511]]),('Lagos Island',[[3.388,6.454],[3.401,6.449],[3.416,6.451]]),('Lekki',[[3.457,6.435],[3.479,6.446],[3.504,6.439]]),('Agege',[[3.303,6.641],[3.321,6.630],[3.343,6.629]]),('Oshodi',[[3.330,6.555],[3.350,6.550],[3.363,6.569]]),('Alimosho',[[3.270,6.610],[3.289,6.600],[3.304,6.595]]),('Ikorodu',[[3.485,6.617],[3.507,6.618],[3.521,6.633]]),('Apapa',[[3.350,6.447],[3.366,6.458],[3.352,6.476]])]
result=[]
for n,pts in routes:
 path=Path('work/route-'+n.replace(' ','-')+'.json')
 try:
  if n=='Ikeja': d=json.loads(Path('work/ikeja-route.json').read_text())
  elif path.exists():d=json.loads(path.read_text())
  else:
   url='https://router.project-osrm.org/route/v1/driving/'+';'.join(','.join(map(str,p)) for p in pts)+'?overview=full&geometries=geojson&steps=false'
   req=urllib.request.Request(url,headers={'User-Agent':'LAWMA-Concept-Dashboard/1.0'})
   with urllib.request.urlopen(req,timeout=25) as r:d=json.load(r)
   path.write_text(json.dumps(d));time.sleep(1.1)
  r=d['routes'][0]
  result.append(dict(name=n,coordinates=r['geometry']['coordinates'],distance=r['distance'],duration=r['duration']))
  print(n,len(r['geometry']['coordinates']),flush=True)
 except Exception as e: print(n,str(e),flush=True)
Path('work/routes.json').write_text(json.dumps(result,separators=(',',':')))
