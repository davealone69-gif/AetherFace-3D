#!/usr/bin/env python3
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
import argparse,threading,webbrowser
ROOT=Path(__file__).resolve().parent
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
def main():
 p=argparse.ArgumentParser();p.add_argument('--host',default='127.0.0.1');p.add_argument('--port',type=int,default=8000);p.add_argument('--no-open',action='store_true');a=p.parse_args();s=ThreadingHTTPServer((a.host,a.port),Handler);u=f'http://{a.host}:{a.port}/';print(f'AetherFace 3D running at {u} (Ctrl+C to stop)',flush=True)
 if not a.no_open:threading.Timer(.8,lambda:webbrowser.open(u)).start()
 try:s.serve_forever()
 except KeyboardInterrupt:print('\nStopping AetherFace 3D')
 finally:s.server_close()
if __name__=='__main__':main()
