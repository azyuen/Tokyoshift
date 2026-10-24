#!/usr/bin/env python3
"""Local smoke runner; materializes only requested, tracked assets in sparse checkouts."""
import http.server, os, pathlib, subprocess, threading, urllib.parse, sys
root=pathlib.Path(__file__).resolve().parents[1];os.chdir(root)
lock=threading.Lock()
class Handler(http.server.SimpleHTTPRequestHandler):
 def do_GET(self):
  relative=urllib.parse.unquote(urllib.parse.urlsplit(self.path).path).lstrip('/')
  if relative in ('engineering-cache-test.html','engineering-old-sw.js'):
   data=(b'<!doctype html><title>Engineering cache lifecycle fixture</title>' if relative.endswith('.html') else subprocess.check_output(['git','show',os.environ.get('ENGINEERING_OLD_SW_REF','ccc9ebb21bf0fe2c8b38f8ac4c36204121b82cac')+':sw.js']))
   self.send_response(200);self.send_header('Content-Type','text/html' if relative.endswith('.html') else 'application/javascript');self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(data);return
  path=pathlib.Path(relative)
  if relative.startswith('assets/') and '..' not in path.parts and not path.exists():
   with lock:
    if not path.exists():
     r=subprocess.run(['git','show','HEAD:'+relative],capture_output=True)
     if r.returncode==0:path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(r.stdout)
  super().do_GET()
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',8765),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 r=subprocess.run(['node',sys.argv[1] if len(sys.argv)>1 else 'tests/engineering-browser.mjs'],env=os.environ)
 raise SystemExit(r.returncode)
finally:server.shutdown()
