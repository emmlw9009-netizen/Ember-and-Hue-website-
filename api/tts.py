"""POST /api/tts  -> narration for the Unravel Theory studio.

Request JSON:  {"scenes": ["scene one text", "scene two text"], "voice": "andrew", "pace": 1.15}
Response JSON: {"mime", "audio" (base64 MP3), "total", "voice", "scenes": [{"start","dur","words":[{"t","d","w"}]}]}
GET /api/tts   -> {"ok": true, "voices": [{"id","label"}]}  (lets the studio check the server is there)
"""
import asyncio
import json
import os
import sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(__file__))
from _voice import VOICES, narrate  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def _send(self, code, body):
        data = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self._send(204, {})

    def do_GET(self):
        self._send(200, {"ok": True, "voices": [{"id": k, "label": v[1]} for k, v in VOICES.items()]})

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length") or 0)
            if length > 200_000:
                return self._send(413, {"error": "Script is too large."})
            req = json.loads(self.rfile.read(length) or b"{}")
            scenes = req.get("scenes")
            if not isinstance(scenes, list) or not scenes or len(scenes) > 100:
                return self._send(400, {"error": "Send 1 to 100 scenes."})
            result = asyncio.run(narrate([str(s) for s in scenes], req.get("voice", "andrew"), req.get("pace", 1.15)))
            self._send(200, result)
        except ValueError as e:
            self._send(400, {"error": str(e)})
        except Exception as e:  # network or voice service failure
            self._send(502, {"error": f"The voice service didn't answer ({type(e).__name__}). Try again in a minute."})
