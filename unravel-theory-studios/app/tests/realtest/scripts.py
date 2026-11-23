import json
def L(n, art, lf='explain', tf='confused', sfx='none', beat=False): return dict(speaker='ledger', narration=n, art=art, ledgerFace=lf, tackFace=tf, sfx=sfx, beat=beat)
def T(n, art='', tf='confused', lf='deadpan', sfx='none'): return dict(speaker='tack', narration=n, art=art, ledgerFace=lf, tackFace=tf, sfx=sfx, beat=False)
onion = dict(title="Why Onions Make You Cry", topic="Why do onions make you cry?", tackQ="Why do onions hate me specifically?", scenes=[
 T("Why do onions hate me specifically?", 'onion_mugshot', 'confused', 'deadpan', 'pop'),
 L("They don't hate you. They hate knives.", 'knife_cells', 'deadpan', 'shocked'),
 L("Cutting one breaks its cells and mixes two chemicals it kept apart.", 'two_flasks', 'explain', 'confused'),
 T("Onions have chemicals?!", '', 'shocked', 'explain', 'boom'),
 L("Everything has chemicals, Tack. You have chemicals.", 'two_flasks', 'deadpan', 'nervous', 'crickets', True),
 L("Together they make a gas called syn-propanethial-S-oxide.", 'gas_molecule', 'proud', 'dizzy'),
 T("Bless you.", '', 'smug', 'deadpan', 'boing'),
 L("The gas floats up, hits your eyes, and they flood to wash it out.", 'eye_tears', 'explain', 'terrified'),
 T("So I'll cut onions with my eyes closed.", 'blindfold_chaos', 'smug', 'shocked'),
 L("Absolutely not. Eyes open near knives.", 'knife_cells', 'deadpan', 'nervous', 'slide'),
 L("Real trick: chill the onion first. Cold slows the gas down.", 'onion_ice', 'explain', 'confused'),
 T("So the onion just needs to chill out.", '', 'smug', 'explain', 'pop'),
 L("That's... actually exactly right.", 'onion_ice', 'shocked', 'smug', 'scratch'),
 T("Onions: zero. Tack: one!", '', 'laughing', 'deadpan', 'ding'),
], titles=["Why Onions Make You Cry", "The Onion Is Fighting Back", "Onions Have a Secret Weapon"], description="Ledger explains why cutting an onion makes you cry, and Tack has some theories. Chill your onion first.", hashtags="#shorts #science #onions #cooking #ledgerandtack", pinned="What's the dumbest thing you've done to avoid onion tears?")
coffee = dict(title="Why Coffee Makes You Poop", topic="Why does coffee make you need the bathroom?", tackQ="Why does coffee make me sprint to the bathroom?", scenes=[
 L("Coffee makes about three in ten people need a bathroom. Fast.", 'three_in_ten', 'smug', 'nervous'),
 T("I'm the three. I'm all three.", '', 'nervous', 'deadpan', 'boing'),
 L("Coffee wakes up your colon. It starts squeezing within minutes.", 'stopwatch', 'explain', 'shocked'),
 T("Minutes?! I haven't even finished the damn cup!", '', 'shocked', 'explain', 'boom'),
 L("That's the point. Your colon doesn't wait for you.", 'cup_colon', 'deadpan', 'terrified'),
 T("So my colon's just... over-caffeinated?", 'jittery_colon', 'confused', 'deadpan', 'pop'),
 L("Nope. Decaf does it too.", 'decaf_too', 'deadpan', 'shocked', 'crickets', True),
 T("Then what the fuck is decaf even for?!", '', 'shocked', 'deadpan', 'none'),
 L("Coffee also releases gut hormones that tell everything to get moving.", 'gut_mail', 'explain', 'dizzy'),
 T("So coffee is a laxative in a cute little cup.", 'laxative_cup', 'smug', 'explain', 'none'),
 L("Honestly? Yeah. Pretty much.", 'laxative_cup', 'shocked', 'smug', 'scratch'),
 T("Good morning to everyone except my toilet.", '', 'laughing', 'deadpan', 'ding'),
], titles=["Why Coffee Makes You Poop", "Your Colon Has a Coffee Problem", "Decaf Won't Save You"], description="Ledger explains why coffee sends some people running to the bathroom. Tack takes it personally.", hashtags="#shorts #coffee #science #ledgerandtack", pinned="Be honest: how many minutes after your first sip?")
art = json.load(open('art.json'))
for sc in (onion, coffee):
    for s in sc['scenes']: s['visual'] = ('VISUAL:' + s['art']) if s['art'] else ''; s['motion'] = 'zoom-in'; s['fx'] = 'none'; s['emphasis'] = ''
json.dump(dict(onion=onion, coffee=coffee), open('scripts.json','w'))
print('ok', len(onion['scenes']), len(coffee['scenes']))
