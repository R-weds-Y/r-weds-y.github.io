"""Local preview server that never lets the browser cache files, so every reload shows your latest edits.

Usage (from the project folder):
    python3 tools/serve.py          # http://localhost:8000
    python3 tools/serve.py 8080     # another port
"""
import http.server
import os
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    print(f'Serving on http://localhost:{port}  (no caching)')
    http.server.ThreadingHTTPServer(('127.0.0.1', port), NoCacheHandler).serve_forever()
