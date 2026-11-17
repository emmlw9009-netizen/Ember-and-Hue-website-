"""Shared narration engine for the Unravel Theory studio and Telegram bot.

Uses Microsoft's neural voices through the edge-tts package (no API key needed).
Each scene is spoken separately, in parallel, then joined into one MP3 so the
studio knows exactly when every scene and every word starts.
"""
import asyncio
import base64
import re

import edge_tts

VOICES = {
    "andrew": ("en-US-AndrewMultilingualNeural", "Andrew · warm, confident"),
    "brian": ("en-US-BrianMultilingualNeural", "Brian · relaxed storyteller"),
    "ava": ("en-US-AvaMultilingualNeural", "Ava · bright, clear"),
    "emma": ("en-US-EmmaMultilingualNeural", "Emma · friendly"),
    "christopher": ("en-US-ChristopherNeural", "Christopher · deep documentary"),
    "ryan": ("en-GB-RyanNeural", "Ryan · British narrator"),
}
DEFAULT_VOICE = "andrew"
# edge-tts default output: 24 kHz mono MP3 at 48 kbit/s (constant bitrate)
BYTES_PER_SECOND = 48000 / 8
MAX_CHARS = 6000


def rate_string(pace):
    """Studio pace (1.0 = normal) -> edge-tts rate like '+15%'."""
    try:
        pct = round((float(pace) - 1.0) * 100)
    except (TypeError, ValueError):
        pct = 15
    pct = max(-30, min(60, pct))
    return f"{pct:+d}%"


def clean_text(text):
    text = re.sub(r"\[[^\]]*\]", " ", text or "")  # drop [visual: ...] tags
    return re.sub(r"\s+", " ", text).strip()


async def _speak(text, voice_id, rate):
    comm = edge_tts.Communicate(text, voice_id, rate=rate, boundary="WordBoundary")
    audio = bytearray()
    words = []
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            words.append({
                "t": chunk["offset"] / 1e7,
                "d": chunk["duration"] / 1e7,
                "w": chunk["text"],
            })
    return bytes(audio), words


async def narrate(scenes, voice="andrew", pace=1.15):
    """scenes: list of strings. Returns dict with base64 MP3 and per-scene timings."""
    voice_id = VOICES.get(voice, VOICES[DEFAULT_VOICE])[0]
    rate = rate_string(pace)
    texts = [clean_text(s) for s in scenes]
    if not any(texts):
        raise ValueError("The script has no words to read.")
    if sum(len(t) for t in texts) > MAX_CHARS:
        raise ValueError(f"The script is too long to narrate in one go (limit {MAX_CHARS} characters).")
    results = await asyncio.gather(*[_speak(t, voice_id, rate) if t else _empty() for t in texts])
    joined = bytearray()
    out_scenes = []
    cursor = 0.0
    for audio, words in results:
        dur = len(audio) / BYTES_PER_SECOND
        out_scenes.append({
            "start": round(cursor, 3),
            "dur": round(dur, 3),
            "words": [{"t": round(w["t"], 3), "d": round(w["d"], 3), "w": w["w"]} for w in words],
        })
        joined.extend(audio)
        cursor += dur
    return {
        "mime": "audio/mpeg",
        "audio": base64.b64encode(bytes(joined)).decode("ascii"),
        "total": round(cursor, 3),
        "voice": voice if voice in VOICES else DEFAULT_VOICE,
        "scenes": out_scenes,
    }


async def _empty():
    return b"", []


async def speak_mp3(text, voice="andrew", pace=1.15):
    """Single block of text -> MP3 bytes (used by the Telegram bot)."""
    voice_id = VOICES.get(voice, VOICES[DEFAULT_VOICE])[0]
    audio, _ = await _speak(clean_text(text), voice_id, rate_string(pace))
    return audio
