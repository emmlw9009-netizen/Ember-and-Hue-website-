#!/bin/bash
# Assemble index.html (the published app page) from its parts and syntax-check the script.
set -e
cd "$(dirname "$0")"
{ cat partA.html; echo '<script>'; cat b1.js; echo '/* ================= Voice engine (Kokoro, runs in the browser) ================= */'; cat voice_block.js; cat b3.js cast.js b4.js; echo '</script>'; } > index.html
node -e "const s=require('fs').readFileSync('index.html','utf8'); require('fs').writeFileSync('/tmp/uts-check.js', s.match(/<script>([\s\S]*)<\/script>/)[1])"
node --check /tmp/uts-check.js
echo BUILD_OK
