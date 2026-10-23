"""Serve this local website over HTTP, which YouTube embeds require."""
import argparse
import functools
import http.server
import socket
from pathlib import Path
import urllib.request
import webbrowser

ROOT = Path(__file__).resolve().parent.parent
ADDRESS = ("127.0.0.1", 4173)
URL = "http://127.0.0.1:4173/index.html"
HEALTH_PATH = "/.well-known/cmu-nursing-preview"
IDENTITY = b"cmu-nursing-curriculum-preview"


def is_project_running():
    # Also recognize an existing `python -m http.server` for this exact checkout.
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    for path, expected in ((HEALTH_PATH, IDENTITY), ("/index.html", (ROOT / "index.html").read_bytes())):
        try:
            with opener.open("http://127.0.0.1:4173" + path, timeout=2) as response:
                if response.read(len(expected) + 1) == expected:
                    return True
        except (OSError, ValueError):
            continue
    return False


class PreviewServer(http.server.ThreadingHTTPServer):
    allow_reuse_address = False

    def server_bind(self):
        if hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == HEALTH_PATH:
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(IDENTITY)))
            self.end_headers()
            self.wfile.write(IDENTITY)
        else:
            super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        super().end_headers()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--open", action="store_true", help="Open the website in the default browser")
    args = parser.parse_args()
    try:
        server = PreviewServer(ADDRESS, functools.partial(Handler, directory=str(ROOT)))
    except OSError as error:
        if not is_project_running():
            raise SystemExit("Cannot start preview on port 4173. Close the application using that port and try again.") from error
        print("The website is already running: " + URL)
        if args.open:
            webbrowser.open(URL)
        return
    print("CMU Nursing website: " + URL, flush=True)
    print("Keep this window open. Press Ctrl+C to stop the website.", flush=True)
    if args.open:
        webbrowser.open(URL)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
