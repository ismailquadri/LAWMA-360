from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import os
root = Path(__file__).resolve().parent.parent / 'outputs'
assets = {'/': ('LAWMA_Service_Assurance_Dashboard.html','text/html; charset=utf-8'), '/index.html': ('LAWMA_Service_Assurance_Dashboard.html','text/html; charset=utf-8'), '/desktop': ('LAWMA_Service_Assurance_Dashboard.html','text/html; charset=utf-8'), '/mobile': ('LAWMA_Service_Assurance_Dashboard.html','text/html; charset=utf-8'), '/manifest.webmanifest': ('manifest.webmanifest','application/manifest+json'), '/sw.js': ('sw.js','application/javascript'), '/app-icon-192.png': ('app-icon-192.png','image/png'), '/app-icon-512.png': ('app-icon-512.png','image/png')}
class Preview(BaseHTTPRequestHandler):
 def do_GET(self):
  urlpath=urlsplit(self.path).path
  asset = assets.get(urlpath)
  if not asset and urlpath.startswith('/presentation-assets/release-film/') and '..' not in urlpath:
   import mimetypes
   asset=(urlpath.lstrip('/'),mimetypes.guess_type(urlpath)[0] or 'application/octet-stream')
  if not asset:
   self.send_error(404); return
  path = root / asset[0]
  if not path.exists():
   self.send_error(404); return
  data = path.read_bytes()
  self.send_response(200); self.send_header('Content-Type', asset[1]); self.send_header('Content-Length', str(len(data))); self.send_header('Cache-Control', 'no-store'); self.end_headers(); self.wfile.write(data)
HTTPServer(('127.0.0.1', int(os.environ.get('LAWMA_PREVIEW_PORT','8765'))), Preview).serve_forever()
