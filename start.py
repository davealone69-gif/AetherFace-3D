#!/usr/bin/env python3
"""Start AetherFace locally with a safe fallback when the preferred port is busy."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import errno
import shutil
import subprocess
import threading
import webbrowser

ROOT = Path(__file__).resolve().parent


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)


def open_browser(url):
    # Termux's URL handler is more reliable than Python's generic browser discovery.
    termux_open = shutil.which("termux-open-url")
    if termux_open:
        try:
            subprocess.Popen([termux_open, url], stdout=subprocess.DEVNULL,
                             stderr=subprocess.DEVNULL, start_new_session=True)
            return
        except OSError:
            pass
    webbrowser.open(url)


def bind_server(host, requested_port, allow_fallback):
    ports = [requested_port]
    if allow_fallback:
        ports.extend(port for port in (8080, 8001, 8002, 8003, 8004, 8005)
                     if port != requested_port)
    last_error = None
    for port in ports:
        try:
            return ThreadingHTTPServer((host, port), Handler), port
        except OSError as error:
            last_error = error
            if error.errno != errno.EADDRINUSE:
                raise
            print(f"Port {port} is already in use; trying the next port.", flush=True)
    raise SystemExit(
        f"Could not start AetherFace: ports {', '.join(map(str, ports))} are busy. "
        "Stop the old server or pass --port with a free port."
    ) from last_error


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1",
                        help="bind address (default: loopback only)")
    parser.add_argument("--port", type=int, default=8080,
                        help="preferred port (default: 8080)")
    parser.add_argument("--no-fallback", action="store_true",
                        help="fail instead of trying fallback ports")
    parser.add_argument("--no-open", action="store_true",
                        help="do not open the browser automatically")
    args = parser.parse_args()
    if not 0 <= args.port <= 65535:
        parser.error("--port must be between 0 and 65535")

    server, port = bind_server(args.host, args.port, not args.no_fallback)
    display_host = "127.0.0.1" if args.host in ("0.0.0.0", "::") else args.host
    url = f"http://{display_host}:{port}/"
    print(f"AetherFace 3D running at {url} (Ctrl+C to stop)", flush=True)

    if not args.no_open:
        threading.Timer(0.8, open_browser, args=(url,)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping AetherFace 3D", flush=True)
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
