# Channel look: "Case File"

Chosen on the design canvas (Dossier spins → D1 Evidence Board, D2 Redacted, D3 Microfiche, plus the emotion cast). Every video the app makes, Shorts, long-form, series and thumbnails, follows these rules.

## The idea

Every story is a case being cracked open. The world is paper evidence: a cork evidence board with red string, classified memos with redaction bars, and a green microfiche reader. Big-headed, big-emotion characters react to the evidence. The evidence is serious; the characters are funny.

## Scene templates (rotate by beat)

| Template | Use for | Motion |
| --- | --- | --- |
| Evidence Board | Openings, connecting facts, chapter starts | Camera follows the red string from clue to clue; pins pop in |
| Redacted Memo | The key fact or reveal | Redaction bar peels off the key words as the narrator says them |
| Microfiche Reader | Old records, dates, "then they found…" | Film strip advances; dashed zoom box on the detail |

## Cast (original characters)

Shared build: huge round white head, 11 px black outline, soft grey shading at the bottom of the head, giant black bean eyes, very large mouths (red inside, white teeth, pink tongue), thick rounded black limbs. Emotions are pushed to the max.

| Character | Signature | Role |
| --- | --- | --- |
| The Archivist | Mustard newsboy cap, red string tied on the wrist | Narrator, in every video |
| Pip | Green beanie with a pom | Sidekick, panics |
| Nan | Grey bun | Knows everything, smug |
| The crowd | Party hats in pink, blue, yellow | "Everybody" in "everybody but me" videos |

### The hosts: Ledger & Tack

Every explainer Short and documentary long-form is a two-hander. Hosts are drawn by the app's engine (`app/cast.js`) and stand in the bottom corners, Ledger left, Tack right. The speaker's mouth moves and he bobs while talking. Stories and series stay narrated.

| Host | Look | Role | Voice |
| --- | --- | --- | --- |
| Ledger | Tall, rectangular glasses, black hair swoop, red tie | The patient explainer and straight man. Carries every fact. | The voice picked in Style |
| Tack | Short, huge mustard cap, pink cheeks | Asks the dumb-but-funny questions viewers secretly have | Tack's voice (default Puck), 12% faster |

How the double act works (from classic straight-man / funny-man teams like Burns & Allen and Abbott & Costello):

- About 3 Ledger lines for every Tack line; never two Tack lines in a row. Tack lines are 2 to 9 words.
- Every Tack question sets up the next fact. His wrong guess opens the door to the real answer, so jokes move the explanation forward instead of stopping it.
- Ledger's patience drops in threes: kind answer, tighter answer, then a deadpan beat.
- Once per video Tack is accidentally right, and Ledger has to admit it. That reversal is the biggest laugh.
- Tack gets the last line: a button that reframes the topic.
- The facts stay true. The comedy comes from questions and reactions, never wrong information.

Faces the engine can draw: explain, deadpan, confused, proud, smug, shocked, terrified, dizzy, nervous, laughing. Character sheet: `design/canvas/project/C03-LedgerTack.dc.html`.

Reactions on file: neutral, proud, dying laughing, shocked, furious, steaming, in love, sobbing, nervous, smug, dizzy, terrified, determined/grit.

## Color

| Token | Hex | Use |
| --- | --- | --- |
| Cork | #A8794A | Board background |
| Paper | #F2EEE4 | Cards, captions |
| Ink | #231B12 / #111111 | Lines, type |
| Evidence red | #B3261E / #C8281E | String, pins, stamps, highlights |
| Highlighter | #F7E36A | Revealed words |
| Microfiche green | #BFE8C9 on #07130F | Reader screen |
| Microfiche amber | #F2B544 | Reader captions, zoom box |
| Mustard cap | #D9A441 | The Archivist |

## Type

- Headlines and thumbnails: Archivo Black, all caps.
- Evidence text, captions: Special Elite (typewriter) on paper strips.
- Labels and file numbers: Courier Prime / Archivo Narrow, tracked caps ("CASE 1816 · CHAPTER 01").
- Microfiche: IBM Plex Mono, amber.

## Captions

Typewritten line on a paper strip with a drop shadow, bottom of frame, never covering a face. Key word can flip to evidence red.

## Thumbnails

White background, huge black Archivo Black title with one word in evidence red, the Archivist mid-scream on one side, a second character reacting on the other, one pinned photo and a red string crossing the frame.

## Never

Copy another creator's characters, art or audio; realistic AI faces; neon or glow-heavy effects; clutter that hides the faces.
