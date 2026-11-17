# Unravel Theory: setup

Everything lives in this repository and runs on the same Vercel project as the website.

| Piece | Where | Needs |
|---|---|---|
| Video studio (phone + computer) | `https://<your-site>/unravel-theory/` | Nothing. Works once deployed |
| Narrator voices for exports with sound | `/api/tts` (`api/tts.py`, `api/_voice.py`) | Nothing. Uses Microsoft's free neural voices via `edge-tts` |
| Telegram bot | `/api/telegram` (`api/telegram.py`) | A bot token and 2 settings (below) |
| Daily reminder | Vercel Cron in `vercel.json` (15:00 UTC) | `TELEGRAM_CHAT_ID` |

## 1. Deploy

Merge the branch `claude/what-if-lab-files-351wzx` into your main branch. Vercel deploys it automatically
(Python functions are picked up from `api/`, dependencies from `requirements.txt`).

Check it worked: open `https://<your-site>/api/tts`. You should see `{"ok": true, "voices": [...]}`.
Then open the studio: the **Narrator voice** list now starts with **Studio voices (built into exports)**.

## 2. Put the studio on your phone

Open `https://<your-site>/unravel-theory/` on your phone.
- iPhone (Safari): Share → **Add to Home Screen**.
- Android (Chrome): ⋮ menu → **Add to Home screen** / **Install app**.

Export on the phone: pick a studio voice, tap **Export whole video**, keep the screen on until it finishes,
then choose **Save video** in the share sheet. 720p is the default on phones because it records faster.

## 3. Telegram bot (about 5 minutes)

1. In Telegram, message **@BotFather** → `/newbot` → pick a name (e.g. *Unravel Theory Studio*) and a username.
   Copy the token it gives you.
2. In Vercel → your project → **Settings → Environment Variables**, add:
   - `TELEGRAM_BOT_TOKEN` = the token from BotFather
   - `TELEGRAM_WEBHOOK_SECRET` = any long random word you make up (letters and numbers only)
3. Redeploy (Deployments → ⋯ → Redeploy).
4. Open `https://<your-site>/api/telegram?setup=<your TELEGRAM_WEBHOOK_SECRET>` in a browser.
   You should see `"ok": true`.
5. Open your bot in Telegram and send `/start`. It replies with your **chat id**.
6. Add `TELEGRAM_CHAT_ID` = that number in Vercel and redeploy. The bot now only answers you,
   and the daily reminder turns on.
7. Optional: add `CRON_SECRET` (any random word) so only Vercel can trigger the daily reminder.

### What the bot does
- `/idea` (or `/idea space`, `/idea history`…): a video idea with **Open in studio**, which opens the studio with that idea drafted.
- `/ideas`: browse the 7 categories.
- `/outline <title>`: a script outline for any title.
- Send a whole script (first line `# Title`, blank line between scenes): you get the narration MP3,
  4 title options, a description, tags and a pinned comment.
- `/voice <text>`: narrate any text as an MP3.
- `/checklist`, `/schedule`, `/studio`.
- Every day at 15:00 UTC: today's Short idea with buttons.

## Notes
- Exports with sound need a **studio voice**. Claude voices (claude.ai) and browser voices are preview-only,
  because browsers don't let a page record them. On claude.ai you can still upload a voiceover file.
- The bot's idea list is in `api/_ideas.py`, generated from the studio's `IDEAS` list. Keep them in sync if you add ideas.
- Saved videos live in your Claude account (when using the studio on claude.ai) or in the browser (website version).
  The bot doesn't read them.
