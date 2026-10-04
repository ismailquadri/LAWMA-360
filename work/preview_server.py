from http.server import BaseHTTPRequestHandler,HTTPServer
from pathlib import Path
page=Path('outputs/LAWMA_Service_Assurance_Dashboard.html').resolve()
class Preview(BaseHTTPRequestHandler):
 def do_GET(self):
  if self.path.split('?')[0] not in ('/','/index.html'):
   self.send_error(404);return
  data=page.read_bytes();self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(data)));self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(data)
HTTPServer(('127.0.0.1',8765),Preview).serve_forever()
