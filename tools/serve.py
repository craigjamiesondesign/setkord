"""Serves docs/ locally at the same /setkord/ base path GitHub Pages uses, without caching.

Run from the repository root:  python3 -I tools/serve.py
Then open:                     http://127.0.0.1:4176/setkord/
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

DOCS = Path(__file__).resolve().parent.parent / "docs"
BASE = "/setkord"


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # Only /setkord/... exists, as on GitHub Pages.
        if path != BASE and not path.startswith(BASE + "/"):
            return str(DOCS / "__missing__")
        return super().translate_path(path[len(BASE):] or "/")

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


ThreadingHTTPServer(("127.0.0.1", 4176), partial(Handler, directory=str(DOCS))).serve_forever()
