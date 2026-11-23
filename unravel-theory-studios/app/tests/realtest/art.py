import json, random, math
INK='#231B12'; PAPER='#F2EEE4'; RED='#C8281E'; CORK='#A8794A'; WAL='#6B4A2B'; HI='#F7E36A'; TAN='#D9B68A'
W,H=1080,1920
def cork(seed):
    r=random.Random(seed); dots=''.join(f'<circle cx="{r.random()*W:.0f}" cy="{r.random()*H:.0f}" r="{1+r.random()*3:.1f}" fill="{"#7A5531" if r.random()<.5 else "#C9A070"}" opacity="{.35+r.random()*.4:.2f}"/>' for _ in range(420))
    return f'<rect width="{W}" height="{H}" fill="{CORK}"/>{dots}<rect width="{W}" height="{H}" fill="url(#vig)"/>'
DEFS=f'<defs><radialGradient id="vig" cx="50%" cy="40%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#2A1608" stop-opacity=".55"/></radialGradient><filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter></defs>'
def pin(x,y,r=16): return f'<circle cx="{x}" cy="{y+5}" r="{r}" fill="#000" opacity=".3"/><circle cx="{x}" cy="{y}" r="{r}" fill="{RED}" stroke="{INK}" stroke-width="3"/><circle cx="{x-r*.35}" cy="{y-r*.35}" r="{r*.3}" fill="#fff" opacity=".6"/>'
def card(cx,cy,w,h,rot,inner,fill=PAPER,pins=True):
    return (f'<g transform="translate({cx} {cy}) rotate({rot})"><rect x="{-w/2+12}" y="{-h/2+18}" width="{w}" height="{h}" fill="#000" opacity=".35" filter="url(#sh)"/>'
            f'<rect x="{-w/2}" y="{-h/2}" width="{w}" height="{h}" fill="{fill}" stroke="{INK}" stroke-width="4"/>{inner}'
            + (pin(0,-h/2+26) if pins else '') + '</g>')
def photo(cx,cy,w,h,rot,inner,bg='#E6D8BF'):
    return card(cx,cy,w,h,rot,f'<rect x="{-w/2+22}" y="{-h/2+22}" width="{w-44}" height="{h-90}" fill="{bg}" stroke="{INK}" stroke-width="3"/>'+inner)
def lines(x,y,w,n,gap=26):
    return ''.join(f'<rect x="{x}" y="{y+i*gap}" width="{w*(0.55 if i==n-1 else 1):.0f}" height="8" rx="4" fill="{INK}" opacity=".25"/>' for i in range(n))
def string(pts): 
    d='M'+' L'.join(f'{x} {y}' for x,y in pts); return f'<path d="{d}" fill="none" stroke="#000" stroke-width="7" opacity=".25" transform="translate(3 5)"/><path d="{d}" fill="none" stroke="{RED}" stroke-width="6"/>'
def fg():
    return (f'<path d="M0 0 H300 C220 40 120 60 0 200 Z" fill="#3A2412" opacity=".85"/><path d="M{W} 0 H{W-260} C{W-200} 50 {W-110} 70 {W} 190 Z" fill="#3A2412" opacity=".85"/>'
            f'<rect x="60" y="120" width="150" height="46" fill="{HI}" opacity=".75" transform="rotate(-18 135 143)"/>')
def scene(seed, mid, fx=540, fy=650):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" data-focus-x="{fx}" data-focus-y="{fy}">{DEFS}<g id="bg">{cork(seed)}</g><g id="mid">{mid}</g><g id="fg">{fg()}</g></svg>'
# ---- drawings (centered at 0,0) ----
def onion(s=1, face='', x=0, y=0):
    g=f'<g transform="translate({x} {y}) scale({s})"><path d="M0 -125 C70 -120 120 -40 120 35 C120 105 65 135 0 135 C-65 135 -120 105 -120 35 C-120 -40 -70 -120 0 -125 Z" fill="{TAN}" stroke="{INK}" stroke-width="6"/>'
    g+=f'<path d="M-45 -95 C-80 -20 -80 80 -40 125 M45 -95 C80 -20 80 80 40 125 M0 -120 V130" fill="none" stroke="{WAL}" stroke-width="4" opacity=".6"/><path d="M-8 -125 C-12 -160 0 -190 22 -205 M6 -125 C14 -150 30 -165 48 -170" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
    if face=='angry': g+=f'<path d="M-62 -18 L-18 2 M62 -18 L18 2" stroke="{INK}" stroke-width="10" stroke-linecap="round"/><circle cx="-36" cy="22" r="10" fill="{INK}"/><circle cx="36" cy="22" r="10" fill="{INK}"/><path d="M-34 78 Q0 50 34 78" fill="none" stroke="{INK}" stroke-width="8" stroke-linecap="round"/>'
    if face=='chill': g+=f'<path d="M-50 20 h34 M16 20 h34" stroke="{INK}" stroke-width="9" stroke-linecap="round"/><rect x="-62" y="2" width="56" height="26" rx="8" fill="{INK}"/><rect x="6" y="2" width="56" height="26" rx="8" fill="{INK}"/><path d="M-6 14 h12" stroke="{INK}" stroke-width="6"/><path d="M-30 70 Q0 95 30 70" fill="none" stroke="{INK}" stroke-width="8" stroke-linecap="round"/>'
    return g+'</g>'
def knife(x,y,rot,s=1): return f'<g transform="translate({x} {y}) rotate({rot}) scale({s})"><path d="M0 0 L260 -10 C230 30 120 46 0 40 Z" fill="{PAPER}" stroke="{INK}" stroke-width="6"/><rect x="-150" y="-2" width="150" height="44" rx="14" fill="{WAL}" stroke="{INK}" stroke-width="6"/><circle cx="-110" cy="20" r="6" fill="{PAPER}"/><circle cx="-50" cy="20" r="6" fill="{PAPER}"/></g>'
def burst(x,y,r,n=10,col=HI): return f'<g transform="translate({x} {y})">'+''.join(f'<path d="M{math.cos(a)*r*.45:.0f} {math.sin(a)*r*.45:.0f} L{math.cos(a)*r:.0f} {math.sin(a)*r:.0f}" stroke="{col}" stroke-width="10" stroke-linecap="round"/>' for a in [i*2*math.pi/n for i in range(n)])+'</g>'
def flask(x,y,col,s=1): return f'<g transform="translate({x} {y}) scale({s})"><path d="M-30 -120 H30 V-40 L95 90 C105 112 90 125 70 125 H-70 C-90 125 -105 112 -95 90 L-30 -40 Z" fill="{PAPER}" stroke="{INK}" stroke-width="6"/><path d="M-62 40 H62 L88 92 C94 106 86 115 72 115 H-72 C-86 115 -94 106 -88 92 Z" fill="{col}"/><rect x="-40" y="-140" width="80" height="24" rx="6" fill="{WAL}" stroke="{INK}" stroke-width="5"/><circle cx="-20" cy="70" r="9" fill="{PAPER}" opacity=".7"/><circle cx="25" cy="88" r="6" fill="{PAPER}" opacity=".7"/></g>'
def molecule(x,y,s=1):
    pts=[(0,0,34,RED),(-110,-60,26,PAPER),(110,-50,26,PAPER),(-80,90,24,HI),(90,95,30,TAN),(0,-130,22,PAPER),(190,40,20,HI)]
    bonds=[(0,1),(0,2),(0,3),(0,4),(1,5),(2,6)]
    b=''.join(f'<path d="M{pts[i][0]} {pts[i][1]} L{pts[j][0]} {pts[j][1]}" stroke="{INK}" stroke-width="10"/>' for i,j in bonds)
    return f'<g transform="translate({x} {y}) scale({s})">{b}'+''.join(f'<circle cx="{a}" cy="{c}" r="{r}" fill="{col}" stroke="{INK}" stroke-width="6"/>' for a,c,r,col in pts)+'</g>'
def cloud(x,y,s=1,col=HI,op=.8): return f'<path transform="translate({x} {y}) scale({s})" d="M-120 30 C-150 30 -160 -20 -125 -35 C-130 -80 -70 -95 -45 -65 C-30 -110 40 -110 55 -65 C90 -90 140 -60 125 -20 C165 -10 160 40 120 40 Z" fill="{col}" opacity="{op}" stroke="{INK}" stroke-width="5"/>'
def eye(x,y,s=1): return f'<g transform="translate({x} {y}) scale({s})"><path d="M-170 0 C-90 -95 90 -95 170 0 C90 95 -90 95 -170 0 Z" fill="{PAPER}" stroke="{INK}" stroke-width="7"/><circle r="58" fill="{WAL}" stroke="{INK}" stroke-width="6"/><circle r="26" fill="{INK}"/><circle cx="-18" cy="-20" r="11" fill="#fff"/><path d="M-120 -58 L-150 -95 M-60 -78 L-70 -120 M0 -84 V-128 M60 -78 L70 -120 M120 -58 L150 -95" stroke="{INK}" stroke-width="7" stroke-linecap="round"/></g>'
def tear(x,y,s=1): return f'<path transform="translate({x} {y}) scale({s})" d="M0 -40 C25 -5 30 15 30 25 C30 45 15 55 0 55 C-15 55 -30 45 -30 25 C-30 15 -25 -5 0 -40 Z" fill="{PAPER}" stroke="{INK}" stroke-width="5"/>'
def arrow(x1,y1,x2,y2,col=RED,w=10):
    a=math.atan2(y2-y1,x2-x1); hx=x2-math.cos(a)*30; hy=y2-math.sin(a)*30
    return f'<path d="M{x1} {y1} L{hx:.0f} {hy:.0f}" stroke="{col}" stroke-width="{w}" stroke-linecap="round"/><path d="M{x2} {y2} L{hx+math.cos(a+1.57)*20:.0f} {hy+math.sin(a+1.57)*20:.0f} L{hx-math.cos(a+1.57)*20:.0f} {hy-math.sin(a+1.57)*20:.0f} Z" fill="{col}"/>'
def board(x,y,w,h,rot=0): return f'<rect x="{x-w/2}" y="{y-h/2}" width="{w}" height="{h}" rx="30" fill="{WAL}" stroke="{INK}" stroke-width="6" transform="rotate({rot} {x} {y})"/><circle cx="{x+w/2-50}" cy="{y}" r="16" fill="{CORK}" stroke="{INK}" stroke-width="4"/>'
def cup(x,y,s=1,heart=False,bolt=None):
    g=f'<g transform="translate({x} {y}) scale({s})"><path d="M-80 -70 H80 L65 90 C62 110 50 118 35 118 H-35 C-50 118 -62 110 -65 90 Z" fill="{PAPER}" stroke="{INK}" stroke-width="6"/><ellipse cx="0" cy="-70" rx="80" ry="18" fill="{WAL}" stroke="{INK}" stroke-width="6"/><path d="M80 -30 C130 -30 130 50 72 50" fill="none" stroke="{INK}" stroke-width="12"/>'
    g+=f'<path d="M-30 -110 C-45 -140 -15 -150 -30 -185 M10 -110 C-5 -140 25 -150 10 -185 M45 -110 C30 -140 60 -150 45 -185" fill="none" stroke="{PAPER}" stroke-width="7" stroke-linecap="round" opacity=".9"/>'
    if heart: g+=f'<path d="M0 -60 C-12 -82 -42 -72 -30 -60 L0 -52 L30 -60 C42 -72 12 -82 0 -60 Z" fill="{PAPER}"/>'
    if bolt: g+=f'<path d="M-5 -20 L-30 30 H0 L-12 80 L35 10 H5 L20 -20 Z" fill="{HI}" stroke="{INK}" stroke-width="5"/>' + (f'<path d="M-50 -20 L50 85" stroke="{RED}" stroke-width="12" stroke-linecap="round"/>' if bolt=='x' else '')
    return g+'</g>'
def colon(x,y,s=1,col='#D88A80'):
    d="M-150 140 V-90 C-150 -140 -110 -150 -60 -150 H60 C110 -150 150 -140 150 -90 V100 C150 140 110 150 60 150 H20 C0 150 -10 170 -10 190"
    return f'<g transform="translate({x} {y}) scale({s})"><path d="{d}" fill="none" stroke="{INK}" stroke-width="64" stroke-linecap="round" stroke-linejoin="round"/><path d="{d}" fill="none" stroke="{col}" stroke-width="50" stroke-linecap="round" stroke-linejoin="round"/>'+''.join(f'<path d="M{px} {py} h28" stroke="{INK}" stroke-width="4" opacity=".5"/>' for px,py in [(-164,-40),(-164,40),(-40,-164),(40,-164),(136,-40),(136,40)])+'</g>'
def stopwatch(x,y,s=1): return f'<g transform="translate({x} {y}) scale({s})"><circle r="120" fill="{PAPER}" stroke="{INK}" stroke-width="8"/><rect x="-22" y="-160" width="44" height="34" rx="6" fill="{RED}" stroke="{INK}" stroke-width="6"/>'+''.join(f'<path d="M{math.sin(a)*95:.0f} {-math.cos(a)*95:.0f} L{math.sin(a)*110:.0f} {-math.cos(a)*110:.0f}" stroke="{INK}" stroke-width="6"/>' for a in [i*math.pi/6 for i in range(12)])+f'<path d="M0 0 L0 -85 M0 0 L55 30" stroke="{INK}" stroke-width="9" stroke-linecap="round"/><path d="M0 0 L0 -100 A100 100 0 0 1 86 -50 Z" fill="{RED}" opacity=".35"/></g>'
def tp(x,y,s=1): return f'<g transform="translate({x} {y}) scale({s})"><rect x="-70" y="-90" width="140" height="180" fill="{PAPER}" stroke="{INK}" stroke-width="6"/><ellipse cx="0" cy="-90" rx="70" ry="24" fill="{PAPER}" stroke="{INK}" stroke-width="6"/><ellipse cx="0" cy="-90" rx="22" ry="8" fill="{WAL}"/><path d="M70 40 V170 H-10" fill="none" stroke="{INK}" stroke-width="6"/><path d="M70 40 V168 H-8 V60" fill="{PAPER}"/><path d="M20 100 h40 M20 130 h40" stroke="{INK}" stroke-width="3" stroke-dasharray="6 6"/></g>'
def envelope(x,y,rot=0,s=1): return f'<g transform="translate({x} {y}) rotate({rot}) scale({s})"><rect x="-50" y="-32" width="100" height="64" fill="{PAPER}" stroke="{INK}" stroke-width="5"/><path d="M-50 -32 L0 8 L50 -32" fill="none" stroke="{INK}" stroke-width="5"/><circle cx="0" cy="8" r="9" fill="{RED}"/></g>'
def stomach(x,y,s=1): return f'<path transform="translate({x} {y}) scale({s})" d="M-60 -120 C-60 -60 -120 -40 -110 30 C-100 110 0 130 60 90 C110 55 110 -10 60 -20 C20 -30 10 -70 20 -120 Z" fill="#D88A80" stroke="{INK}" stroke-width="7"/>'
def blindfold(x,y,s=1): return f'<g transform="translate({x} {y}) scale({s})"><path d="M-200 -20 C-80 -50 80 -50 200 -20 L200 30 C80 0 -80 0 -200 30 Z" fill="{RED}" stroke="{INK}" stroke-width="6"/><path d="M200 0 L260 -40 L250 20 Z M200 10 L250 60 L270 20 Z" fill="{RED}" stroke="{INK}" stroke-width="5"/></g>'
def chunk(x,y,rot,s=1): return f'<path transform="translate({x} {y}) rotate({rot}) scale({s})" d="M-30 -10 C-20 -30 20 -30 30 -10 L20 15 C10 22 -10 22 -20 15 Z" fill="{TAN}" stroke="{INK}" stroke-width="5"/>'
def motion(x,y,n=3,l=60,ang=0): return ''.join(f'<path d="M{x+math.cos(ang)*i*0} {y+i*22} l{-math.cos(ang)*l:.0f} {-math.sin(ang)*l:.0f}" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>' for i in range(n))
def ice(x,y,s=1): return f'<rect x="{x-38*s}" y="{y-38*s}" width="{76*s}" height="{76*s}" rx="{12*s}" fill="#FBF8F1" stroke="{INK}" stroke-width="5" transform="rotate({(x*7)%30-15} {x} {y})"/><path d="M{x-20*s} {y-18*s} l{14*s} 0" stroke="{INK}" stroke-width="4" opacity=".4"/>'
def snow(x,y,r=22): return f'<g stroke="{PAPER}" stroke-width="6" stroke-linecap="round"><path d="M{x-r} {y} h{2*r} M{x} {y-r} v{2*r} M{x-r*.7:.0f} {y-r*.7:.0f} l{r*1.4:.0f} {r*1.4:.0f} M{x+r*.7:.0f} {y-r*.7:.0f} l{-r*1.4:.0f} {r*1.4:.0f}"/></g>'
def mug_bg(): return ''.join(f'<path d="M-260 {y} H260" stroke="{INK}" stroke-width="3" opacity=".35"/>' for y in range(-220,200,40))

ART={}
# ===== ONION video =====
ART['onion_mugshot']=scene(1, card(540,640,720,760,-2, f'<rect x="-320" y="-330" width="640" height="560" fill="#E6D8BF" stroke="{INK}" stroke-width="4"/><g>{mug_bg()}</g>{onion(1.35,"angry",0,10)}<rect x="-140" y="180" width="280" height="60" fill="{INK}"/>{lines(-110,202,220,1)}') + photo(860,1060,260,300,8, onion(.55,'angry',0,-20)))
ART['knife_cells']=scene(2, card(540,640,760,720,2, f'{board(0,60,600,330)}{onion(1.05,"",-40,10)}{knife(-260,-40,-12,1.05)}{burst(-40,-30,170,12)}'+''.join(f'<circle cx="{c[0]}" cy="{c[1]}" r="{c[2]}" fill="{PAPER}" stroke="{INK}" stroke-width="4"/>' for c in [(120,-170,18),(170,-120,12),(-190,-180,14),(200,-200,9),(-230,-120,10)])+lines(-300,-300,300,2)))
ART['two_flasks']=scene(3, card(330,660,420,560,-4, flask(0,40,RED,1.2)+lines(-150,-230,300,2)) + card(780,700,420,560,5, flask(0,40,HI,1.2)+lines(-150,-230,300,2)) + string([(330,400),(560,560),(780,440)]) + f'<g transform="translate(560 980) rotate(-4)">{burst(0,0,90,8,RED)}</g>')
ART['gas_molecule']=scene(4, card(540,640,800,760,-1.5, f'<rect x="-360" y="-340" width="720" height="560" fill="{INK}" stroke="{INK}" stroke-width="4"/>{cloud(0,-80,2.2,HI,.22)}{molecule(0,-60,1.15)}<rect x="-300" y="250" width="600" height="56" fill="{HI}"/>{lines(-270,266,520,1)}'))
ART['eye_tears']=scene(5, card(540,650,780,780,1.5, f'{eye(0,-40,1.45)}{tear(-150,150,1.3)}{tear(10,210,1.1)}{tear(160,140,1.4)}{cloud(-210,-290,0.8,HI,.7)}{cloud(220,-300,0.7,HI,.7)}{arrow(-200,-230,-120,-140)}{arrow(210,-240,120,-140)}'))
ART['blindfold_chaos']=scene(6, card(540,660,780,720,-3, f'{board(0,80,620,320,-3)}{blindfold(-20,-40,1.1)}{knife(-120,140,-8,.8)}'+''.join(chunk(x,y,r,1.2) for x,y,r in [(-250,-230,20),(-100,-280,-30),(80,-260,45),(240,-200,-10),(300,-60,60),(-310,-60,-50),(180,220,15),(-280,230,80)])+motion(330,-250,3,50)+motion(-330,-260,3,-50)))
ART['onion_ice']=scene(7, card(540,640,760,760,2, f'<rect x="-330" y="-330" width="660" height="560" fill="{WAL}" opacity=".9" stroke="{INK}" stroke-width="4"/><path d="M-240 120 C-240 250 240 250 240 120 Z" fill="{PAPER}" stroke="{INK}" stroke-width="6"/>{onion(1.0,"chill",0,-20)}'+''.join(ice(x,y,1) for x,y in [(-190,110),(-100,150),(0,165),(100,150),(190,110),(-150,60),(150,60)])+snow(-250,-250)+snow(250,-220)+snow(-200,-120,16)+snow(230,-60,14)))
# ===== COFFEE video =====
ART['cup_colon']=scene(11, card(540,650,780,780,-2, f'{colon(90,30,1.15)}{cup(-200,-120,.9)}{arrow(-120,-40,-20,0)}'+''.join(f'<path d="M{x} {y} l-20 40 h24 l-14 40" fill="none" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>' for x,y in [(300,-280),(-60,220),(330,180)])))
ART['stopwatch']=scene(12, card(540,640,760,760,1.5, f'{stopwatch(-60,-40,1.6)}{cup(230,170,.7)}{arrow(140,150,40,80)}'))
ART['three_in_ten']=scene(13, card(540,650,800,740,-1, ''.join(cup(-280+(i%5)*140, -170+(i//5)*240, .55) if i>=3 else f'<g>{cup(-280+(i%5)*140, -170+(i//5)*240, .55)}{burst(-280+(i%5)*140, -170+(i//5)*240, 95, 10, RED)}</g>' for i in range(10)) + f'<rect x="-330" y="250" width="660" height="56" fill="{HI}"/>{lines(-300,266,560,1)}'))
ART['jittery_colon']=scene(14, card(540,640,780,780,3, f'{colon(0,20,1.2,"#E0A59D")}'+''.join(cup(x,y,.42) for x,y in [(-260,-260),(250,-270),(-280,230),(270,220),(0,-10)])+''.join(f'<path d="M{x} {y} q12 -14 24 0 t24 0 t24 0" fill="none" stroke="{INK}" stroke-width="6"/>' for x,y in [(-330,-60),(250,-60),(-330,60),(250,60),(-60,-330),(-60,300)])))
ART['decaf_too']=scene(15, card(330,620,440,600,-4, cup(0,0,1.25,bolt='y')) + card(780,640,440,600,4, cup(0,0,1.25,bolt='x')) + f'{colon(560,1080,.55)}' + string([(330,900),(560,1000),(780,920)]))
ART['gut_mail']=scene(16, card(540,650,780,780,-1.5, f'{stomach(-170,-120,1.1)}{colon(150,140,.85)}'+''.join(envelope(x,y,r,.9) for x,y,r in [(-40,-170,-15),(60,-60,10),(-20,40,-5)])+arrow(-60,-260,40,-250,RED,8)+arrow(120,-110,170,-40,RED,8)))
ART['laxative_cup']=scene(17, card(540,640,780,760,2, f'{cup(-140,10,1.3,heart=True)}{tp(220,60,1.1)}{burst(-140,10,260,14,HI)}{cup(-140,10,1.3,heart=True)}'))
json.dump(ART, open('art.json','w'))
print(len(ART), sum(len(v) for v in ART.values()))
