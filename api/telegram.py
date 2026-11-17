"""Unravel Theory Telegram bot (Vercel serverless function).

Setup (see unravel-theory/SETUP.md):
  TELEGRAM_BOT_TOKEN       from @BotFather (required)
  TELEGRAM_WEBHOOK_SECRET  any long random word you choose (required)
  TELEGRAM_CHAT_ID         your chat id; the bot then only answers you and sends the daily reminder
  CRON_SECRET              optional; Vercel sends it with the daily cron call

Routes:
  POST /api/telegram                 Telegram webhook
  GET  /api/telegram?setup=<secret>  registers the webhook with Telegram
  GET  /api/telegram?cron=daily      daily idea + reminder (called by Vercel Cron)
"""
import asyncio
import datetime
import json
import os
import random
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import uuid
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(__file__))
from _ideas import IDEAS  # noqa: E402

TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
SECRET = os.environ.get("TELEGRAM_WEBHOOK_SECRET", "")
OWNER = os.environ.get("TELEGRAM_CHAT_ID", "").strip()
CRON_SECRET = os.environ.get("CRON_SECRET", "")

CATEGORIES = list(dict.fromkeys(c for c, _, _ in IDEAS))
CHECKLIST = (
    "*Before you post*\n"
    "1. Fact-check every claim; put your sources in the description.\n"
    "2. Export from the studio with a studio voice so the video has sound.\n"
    "3. Watch the export once, start to finish.\n"
    "4. Paste the title, description, tags and pinned comment from the Upload kit.\n"
    "5. Set *Altered or synthetic content* to Yes (AI narrator).\n"
    "6. Mark the video Uploaded in My videos."
)
SCHEDULE = (
    "*Posting rhythm*\n"
    "• Three Shorts every day, 20 seconds to 3 minutes each.\n"
    "• Two longer videos a week (Tue and Fri) if you want them.\n"
    "• Hook in the first 2 seconds: say the question and the most surprising result."
)


# ---------- Telegram API ----------
def tg(method, payload=None, files=None):
    """Calls the Telegram Bot API. `files` = {field: (filename, bytes, mime)} for uploads."""
    url = f"https://api.telegram.org/bot{TOKEN}/{method}"
    if files:
        boundary = uuid.uuid4().hex
        body = bytearray()
        for k, v in (payload or {}).items():
            val = v if isinstance(v, str) else json.dumps(v)
            body += f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{val}\r\n".encode()
        for k, (fname, data, mime) in files.items():
            body += f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"; filename=\"{fname}\"\r\nContent-Type: {mime}\r\n\r\n".encode()
            body += data + b"\r\n"
        body += f"--{boundary}--\r\n".encode()
        req = urllib.request.Request(url, data=bytes(body), headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    else:
        req = urllib.request.Request(url, data=json.dumps(payload or {}).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=50) as r:
        return json.loads(r.read())


def send(chat, text, buttons=None):
    payload = {"chat_id": chat, "text": text, "parse_mode": "Markdown", "disable_web_page_preview": True}
    if buttons:
        payload["reply_markup"] = {"inline_keyboard": buttons}
    try:
        return tg("sendMessage", payload)
    except urllib.error.HTTPError:  # Markdown that Telegram can't parse: send it plain instead of losing it
        payload.pop("parse_mode", None)
        return tg("sendMessage", payload)


# ---------- content helpers (mirror the studio) ----------
def studio_url(host):
    base = os.environ.get("STUDIO_URL") or f"https://{host}/unravel-theory/"
    return base


def draft_link(host, title, kind):
    return studio_url(host) + "?" + urllib.parse.urlencode({"draft": title, "v": kind})


def outline(title, kind):
    return (
        f"# {title}\n\n"
        f"[Hook: state the question and the single most surprising result in two sentences.] [visual: {kind}]\n\n"
        f"[First effect, minutes to days: what changes right away and why.] [visual: {kind}]\n\n"
        "[Second effect: the knock-on consequence most people don't expect.] [visual: question]\n\n"
        "[Long-term effect: years to millions of years.] [visual: time]\n\n"
        "[Payoff: what this tells us about the real world, plus ask viewers for the next question.] [visual: question]"
    )


def parse_script(text):
    lines = text.replace("\r", "").split("\n")
    title = "Untitled video"
    if lines and lines[0].startswith("#"):
        title = lines.pop(0).lstrip("#").strip()
    scenes = [re.sub(r"\s+", " ", re.sub(r"\[[^\]]*\]", " ", b)).strip() for b in re.split(r"\n\s*\n", "\n".join(lines))]
    return title, [s for s in scenes if s]


def upload_kit(title, scenes):
    base = title.rstrip("?")
    body = re.sub(r"^what if\s*", "", base, flags=re.I)
    titles = [title, f"{base}? The Science Explained", f"What would actually happen if {body}?", f"{base}? (It's Worse Than You Think)"]
    hook = " ".join(re.findall(r"[^.!?]+[.!?]", scenes[0])[:2]).strip() if scenes else ""
    words = re.findall(r"[A-Za-z]{6,}", " ".join(scenes).lower())
    common = [w for w, _ in sorted({w: words.count(w) for w in set(words)}.items(), key=lambda x: -x[1])[:6]]
    tags = ", ".join(dict.fromkeys(["what if", "unravel theory", body.lower(), "science explained", "shorts", *common]))
    desc = (f"{hook}\n\nOn Unravel Theory, we pull the thread on this question step by step until the science makes sense.\n\n"
            "SOURCES\n(add your sources here)\n\nGot a question you want unraveled? Leave it in the comments.\n\n#unraveltheory #whatif #science #shorts")
    return titles, desc, tags


def idea_message(host, item):
    cat, title, kind = item
    return (f"💡 *{title}*\n_{cat}_", [[{"text": "Open in studio", "url": draft_link(host, title, kind)}],
                                         [{"text": "Show outline", "callback_data": f"o:{IDEAS.index(item)}"},
                                          {"text": "Another idea", "callback_data": f"i:{cat}"}]])


def menu_buttons(host):
    return [[{"text": "💡 Idea", "callback_data": "i:"}, {"text": "📚 Categories", "callback_data": "cats"}],
            [{"text": "✅ Checklist", "callback_data": "check"}, {"text": "🗓 Schedule", "callback_data": "sched"}],
            [{"text": "🎬 Open studio", "url": studio_url(host)}]]


HELP = ("*Unravel Theory bot*\n"
        "/today — today's 3 Shorts to make\n"
        "/idea — a video idea (add a category: /idea space)\n"
        "/ideas — browse categories\n"
        "/outline <title> — a script outline for any title\n"
        "/voice <text> — narrate text as an MP3\n"
        "/checklist — before-you-post checklist\n"
        "/schedule — posting rhythm\n"
        "/studio — open the video studio\n\n"
        "Send a full script (first line `# Title`, blank line between scenes) and I'll send back the narration MP3 and the upload kit.")


def narrate_mp3(scenes, voice="andrew", pace=1.15):
    from _voice import narrate  # imported lazily so the bot still answers if edge-tts is missing
    import base64
    res = asyncio.run(narrate(scenes, voice, pace))
    return base64.b64decode(res["audio"]), res["total"]


# ---------- update handling ----------
def handle_update(update, host):
    if "callback_query" in update:
        q = update["callback_query"]
        chat = q["message"]["chat"]["id"]
        if OWNER and str(chat) != OWNER:
            return
        tg("answerCallbackQuery", {"callback_query_id": q["id"]})
        data = q.get("data", "")
        if data.startswith("i:"):
            cat = data[2:]
            pool = [i for i in IDEAS if not cat or i[0] == cat] or IDEAS
            text, kb = idea_message(host, random.choice(pool))
            send(chat, text, kb)
        elif data.startswith("o:"):
            cat, title, kind = IDEAS[int(data[2:])]
            send(chat, f"```\n{outline(title, kind)}\n```", [[{"text": "Open in studio", "url": draft_link(host, title, kind)}]])
        elif data == "cats":
            send(chat, "Pick a category:", [[{"text": c, "callback_data": f"i:{c}"}] for c in CATEGORIES])
        elif data == "check":
            send(chat, CHECKLIST)
        elif data == "sched":
            send(chat, SCHEDULE)
        return

    msg = update.get("message") or update.get("edited_message")
    if not msg or "text" not in msg:
        return
    chat = msg["chat"]["id"]
    text = msg["text"].strip()
    if OWNER and str(chat) != OWNER:
        if text.startswith("/start"):
            send(chat, f"This bot is private. Your chat id is `{chat}`.")
        return
    cmd, _, arg = text.partition(" ")
    cmd = cmd.split("@")[0].lower()
    arg = arg.strip()

    if cmd in ("/start", "/help", "/menu"):
        extra = "" if OWNER else f"\n\nYour chat id is `{chat}`. Add it as TELEGRAM\\_CHAT\\_ID on Vercel to make the bot private and turn on the daily reminder."
        send(chat, HELP + extra, menu_buttons(host))
    elif cmd == "/idea":
        pool = [i for i in IDEAS if arg and arg.lower() in i[0].lower()] or IDEAS
        t, kb = idea_message(host, random.choice(pool))
        send(chat, t, kb)
    elif cmd == "/ideas":
        send(chat, "Pick a category:", [[{"text": c, "callback_data": f"i:{c}"}] for c in CATEGORIES])
    elif cmd == "/outline":
        if not arg:
            return send(chat, "Send a title after the command, for example:\n`/outline What if the Sun disappeared?`")
        send(chat, f"```\n{outline(arg, 'question')}\n```", [[{"text": "Open in studio", "url": draft_link(host, arg, 'question')}]])
    elif cmd == "/today":
        daily(host, chat)
    elif cmd == "/checklist":
        send(chat, CHECKLIST)
    elif cmd == "/schedule":
        send(chat, SCHEDULE)
    elif cmd == "/studio":
        send(chat, "Your studio:", [[{"text": "🎬 Open studio", "url": studio_url(host)}]])
    elif cmd == "/voice":
        if not arg:
            return send(chat, "Send text after the command, for example:\n`/voice Tonight, look up. The Moon is gone.`")
        tg("sendChatAction", {"chat_id": chat, "action": "upload_voice"})
        try:
            mp3, dur = narrate_mp3([arg])
            tg("sendAudio", {"chat_id": chat, "title": "Narration", "performer": "Unravel Theory"}, {"audio": ("narration.mp3", mp3, "audio/mpeg")})
        except Exception as e:  # voice service down or text too long
            send(chat, f"Couldn't make the narration: {e}")
    elif text.startswith("#"):
        title, scenes = parse_script(text)
        if not scenes:
            return send(chat, "That script has a title but no scenes. Put a blank line between scenes.")
        tg("sendChatAction", {"chat_id": chat, "action": "upload_voice"})
        titles, desc, tags = upload_kit(title, scenes)
        try:
            mp3, dur = narrate_mp3(scenes)
            note = f"Narration · {int(dur // 60)}:{int(dur % 60):02d}" + ("  ⚠️ under 20 s: add words or the studio will stretch it" if dur < 20 else "") + ("  ⚠️ over 3:00, too long for a Short" if dur > 180 else "")
            tg("sendAudio", {"chat_id": chat, "title": title, "performer": "Unravel Theory", "caption": note}, {"audio": (re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") + ".mp3", mp3, "audio/mpeg")})
        except Exception as e:
            send(chat, f"Couldn't make the narration ({e}). The upload kit is below.")
        send(chat, "*Title options*\n" + "\n".join(f"{i + 1}. {t}" for i, t in enumerate(titles)))
        send(chat, f"*Description*\n```\n{desc}\n```\n*Tags*\n`{tags}`\n\n*Pinned comment*\nWhich question should we unravel next? Reply with yours.")
    else:
        send(chat, "I didn't catch that. " + HELP, menu_buttons(host))


def daily(host, chat=None):
    chat = chat or OWNER
    if not chat:
        return "TELEGRAM_CHAT_ID is not set"
    picks = todays_ideas()
    lines = "\n".join(f"{i + 1}. *{t}*  _{c}_" for i, (c, t, _) in enumerate(picks))
    kb = [[{"text": f"{i + 1} · Open in studio", "url": draft_link(host, t, k)}] for i, (c, t, k) in enumerate(picks)]
    kb.append([{"text": "Swap for other ideas", "callback_data": "i:"}, {"text": "✅ Checklist", "callback_data": "check"}])
    send(chat, f"☀️ *Today: make {DAILY_COUNT} Shorts*\n\n{lines}\n\nWrite each one, export it with sound, and post it. Tap a button to start.", kb)
    return "sent"


DAILY_COUNT = 3


def todays_ideas(day=None):
    """Three different ideas from three different categories, rotating every day."""
    day = day if day is not None else datetime.date.today().toordinal()
    rng = random.Random(day)
    cats = rng.sample(CATEGORIES, min(DAILY_COUNT, len(CATEGORIES)))
    return [rng.choice([i for i in IDEAS if i[0] == c]) for c in cats]


class handler(BaseHTTPRequestHandler):
    def _reply(self, code, body):
        data = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        host = self.headers.get("x-forwarded-host") or self.headers.get("host", "")
        if not TOKEN:
            return self._reply(200, {"ok": False, "error": "Set TELEGRAM_BOT_TOKEN in Vercel, then redeploy."})
        if "setup" in q:
            if not SECRET or q["setup"][0] != SECRET:
                return self._reply(403, {"ok": False, "error": "Wrong or missing setup key (use your TELEGRAM_WEBHOOK_SECRET)."})
            res = tg("setWebhook", {"url": f"https://{host}/api/telegram", "secret_token": SECRET, "allowed_updates": ["message", "callback_query"]})
            tg("setMyCommands", {"commands": [{"command": c, "description": d} for c, d in [
                ("today", "Today's 3 Shorts to make"), ("idea", "Get a video idea"), ("ideas", "Browse idea categories"), ("outline", "Outline for a title"),
                ("voice", "Narrate text as MP3"), ("checklist", "Before-you-post checklist"), ("schedule", "Posting rhythm"), ("studio", "Open the studio")]]})
            return self._reply(200, {"ok": res.get("ok"), "webhook": f"https://{host}/api/telegram", "telegram": res.get("description")})
        if q.get("cron") == ["daily"]:
            if CRON_SECRET and self.headers.get("authorization") != f"Bearer {CRON_SECRET}":
                return self._reply(401, {"ok": False})
            return self._reply(200, {"ok": True, "result": daily(host)})
        return self._reply(200, {"ok": True, "bot": "Unravel Theory", "webhook_ready": bool(SECRET)})

    def do_POST(self):
        if not TOKEN or not SECRET or self.headers.get("x-telegram-bot-api-secret-token") != SECRET:
            return self._reply(401, {"ok": False})
        try:
            update = json.loads(self.rfile.read(int(self.headers.get("content-length") or 0)) or b"{}")
            handle_update(update, self.headers.get("x-forwarded-host") or self.headers.get("host", ""))
        except Exception as e:  # never make Telegram retry forever
            print("bot error:", repr(e))
        self._reply(200, {"ok": True})
