"""Synthesise the 20 s soundtrack: 132 BPM future-house groove, synced to scene.html.

Every hit is placed on the same beat grid the animation uses (BEAT = 60/132 s),
so slams, risers, whooshes and UI sounds land exactly on the cuts.

Usage: python3 music.py out/music.wav
"""
import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
BPM = 132
BEAT = 60 / BPM
BARS = 11
DUR = BARS * 4 * BEAT  # 20.0 s
N = int(DUR * SR) + SR // 2
rng = np.random.default_rng(132)

L = np.zeros((2, N))        # dry bus (stereo)
REV = np.zeros((2, N))      # reverb send


def at(b):
    return int(round(b * BEAT * SR))


def add(buf, start, x, gain=1.0, pan=0.0):
    x = np.asarray(x)
    if x.ndim == 1:
        x = np.stack([x * np.sqrt(.5 * (1 - pan)), x * np.sqrt(.5 * (1 + pan))]) * np.sqrt(2)
    end = min(buf.shape[-1], start + x.shape[-1])
    if end <= start:
        return
    if buf.ndim == 1:
        buf[start:end] += gain * x.mean(0)[: end - start]
    else:
        buf[:, start:end] += gain * x[:, : end - start]


def tt(sec):
    return np.arange(int(sec * SR)) / SR


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="high", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="low", fs=SR, output="sos"), x)


def noise(sec):
    return rng.standard_normal(int(sec * SR))


def saw(freq, t):
    ph = np.cumsum(np.broadcast_to(freq, t.shape) / SR) if np.ndim(freq) else freq * t
    return 2 * (ph % 1.0) - 1


# ---------------------------------------------------------------- instruments
def kick():
    t = tt(.45)
    f = 48 + 125 * np.exp(-t * 38)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 6.5)
    click = hp(noise(.45), 2500) * np.exp(-t * 400) * .5
    return np.tanh((body + click) * 2.2) * .9


def clap():
    t = tt(.35)
    env = np.zeros_like(t)
    for d in (0, .009, .018):
        env += (t >= d) * np.exp(-np.clip(t - d, 0, None) * (220 if d < .018 else 22))
    return bp(noise(.35), 900, 2600) * env * .9


def hat(open_=False):
    d = .22 if open_ else .045
    t = tt(d)
    return hp(noise(d), 7500, 4) * np.exp(-t * (18 if open_ else 110)) * (.35 if open_ else .28)


def snare():
    t = tt(.25)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * .5
    return (bp(noise(.25), 1500, 7000) * np.exp(-t * 24) + tone) * .7


def supersaw(freqs, dur, cutoff=(4500, 1400), voices=5, det=0.12):
    t = tt(dur)
    out = np.zeros((2, len(t)))
    for f in freqs:
        for v in range(voices):
            cents = (v - (voices - 1) / 2) * det * 100 / ((voices - 1) / 2)
            fv = f * 2 ** (cents / 1200)
            ph0 = rng.random()
            s = 2 * ((fv * t + ph0) % 1) - 1
            pan = (v / (voices - 1)) * 2 - 1
            out[0] += s * np.sqrt(.5 * (1 - pan * .8))
            out[1] += s * np.sqrt(.5 * (1 + pan * .8))
    out /= len(freqs) * voices ** .6
    c0, c1 = cutoff
    # time-varying low-pass approximated by crossfading two filtered versions
    a = np.stack([lp(ch, c0, 2) for ch in out])
    b = np.stack([lp(ch, c1, 2) for ch in out])
    k = np.exp(-t * 7)
    return a * k + b * (1 - k)


def stab(freqs, dur=.32, bright=5200):
    x = supersaw(freqs, dur, (bright, 1200))
    t = tt(dur)
    env = np.minimum(1, t / .004) * np.exp(-t * 7)
    return x * env


def pad(freqs, dur, cutoff=900):
    x = supersaw(freqs, dur, (cutoff, cutoff), voices=7, det=.18)
    t = tt(dur)
    env = np.minimum(1, t / .25) * np.minimum(1, (dur - t) / .2)
    return x * env * .8


def sub(freq, dur):
    t = tt(dur)
    env = np.minimum(1, t / .005) * np.exp(-t * 3.2) * np.minimum(1, (dur - t) / .01)
    s = np.sin(2 * np.pi * freq * t) + .25 * lp(saw(freq, t), 700)
    return np.tanh(s * 1.4) * env * .8


def pluck(freq, dur=.28):
    t = tt(dur)
    s = np.sign(np.sin(2 * np.pi * freq * t)) * .5 + saw(freq * 2.0, t) * .3
    s = lp(s, 3800)
    return s * np.exp(-t * 11) * np.minimum(1, t / .002)


def riser(dur, f0=300, f1=6000, amt=1.0):
    t = tt(dur)
    x = noise(dur)
    out = np.zeros_like(x)
    seg = int(SR * .02)
    for i in range(0, len(x), seg):
        u = i / len(x)
        fc = f0 * (f1 / f0) ** u
        out[i:i + seg] = bp(x[max(0, i - 400):i + seg], fc * .7, min(fc * 1.4, SR / 2 - 100))[-len(x[i:i + seg]):]
    tone = saw(np.linspace(110, 880, len(t)), t) * .12
    env = (t / dur) ** 2.2
    return (out * .9 + lp(tone, 3000)) * env * amt


def impact(big=1.0):
    t = tt(2.2)
    f = 28 + 70 * np.exp(-t * 9)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.4)
    crack = lp(noise(2.2), 5000) * np.exp(-t * 14) * .6
    return np.tanh((boom * 1.4 + crack) * 1.5) * big * .9


def crash():
    t = tt(2.0)
    return hp(noise(2.0), 5000, 2) * np.exp(-t * 2.2) * .22


def whoosh(dur=.45, up=True):
    t = tt(dur)
    x = noise(dur)
    fc = np.geomspace(400, 5000, 12) if up else np.geomspace(5000, 400, 12)
    out = np.concatenate([bp(c, max(f * .6, 60), f * 1.6) for c, f in zip(np.array_split(x, 12), fc)])
    env = np.sin(np.pi * t / dur) ** 2
    return out * env * .8


def blip(f0=1400, f1=700, dur=.09, amp=.35):
    t = tt(dur)
    f = f1 + (f0 - f1) * np.exp(-t * 60)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45) * amp


def tick(amp=.18):
    t = tt(.02)
    return hp(noise(.02), 3000) * np.exp(-t * 500) * amp


def ding():
    t = tt(1.0)
    return (np.sin(2 * np.pi * 1318.5 * t) * np.exp(-t * 5) + .6 * np.sin(2 * np.pi * 1975.5 * t) * np.exp(-t * 6)
            + .3 * np.sin(2 * np.pi * 2637 * t) * np.exp(-t * 9)) * .16


# ---------------------------------------------------------------- harmony
def hz(midi):
    return 440 * 2 ** ((midi - 69) / 12)


# F minor: Fm - Db - Ab - Eb  (i VI III VII)
CHORDS = [[65, 68, 72], [61, 65, 68], [68, 72, 75], [63, 67, 70]]
ROOTS = [41, 37, 44, 39]
LEAD = [  # (beat offset in bar, midi) — a simple hooky motif, 2 bars
    [(0, 77), (.75, 75), (1.5, 72), (2.5, 75), (3, 77)],
    [(0, 80), (.75, 77), (1.5, 75), (2.5, 72), (3.25, 70)],
]

K, C, OH, CH, SN = kick(), clap(), hat(True), hat(False), snare()

GROOVE = [(4, 32), (36, 42)]          # full groove sections (beats)
BREAK = (32, 36)


def in_groove(b):
    return any(a <= b < e for a, e in GROOVE)


kicks = []
# hook bar: kicks under the slams
for b in (0, 2, 3):
    kicks.append(b)
for b in np.arange(4, 44, 1.0):
    if in_groove(b):
        kicks.append(b)

for b in kicks:
    add(L, at(b), K, .95)

# claps on 2 & 4 in groove
for b in np.arange(4, 44, 1.0):
    if in_groove(b) and int(b) % 2 == 1:
        add(L, at(b), C, .55)
        add(REV, at(b), C, .25)

# hats: 16ths closed with accent pattern, open on offbeats
for b in np.arange(4, 44, .25):
    if not in_groove(b):
        continue
    frac = b % 1
    if abs(frac - .5) < 1e-6:
        add(L, at(b), OH, .7, pan=.2)
    else:
        v = .9 if frac == 0 else .55
        add(L, at(b), CH, v * (1 + .15 * rng.standard_normal()), pan=-.25)

# hook: chord stabs on each word, then the big slam at beat 2
for b in (0, .5, 1, 1.5):
    ch = [hz(m) for m in CHORDS[0]]
    add(L, at(b), stab(ch, .3, 6000), .55)
    add(REV, at(b), stab(ch, .3, 6000), .25)
add(L, at(2), stab([hz(m) for m in CHORDS[0] + [53, 77]], 1.6, 7000), .7)
add(REV, at(2), stab([hz(m) for m in CHORDS[0]], 1.6, 7000), .35)
add(L, at(2), sub(hz(41), 1.2), .6)

# groove: bass on off-beats + stabs pattern, sidechained
STAB_PAT = [0, .75, 1.5, 2.25, 3]
duck_bus = np.zeros((2, N))
for bar in range(BARS):
    b0 = bar * 4
    ci = bar % 4
    chord = [hz(m) for m in CHORDS[ci]]
    root = hz(ROOTS[ci])
    for off in (.5, 1.5, 2.5, 3.5, 1.75, 3.75):
        b = b0 + off
        if in_groove(b):
            add(duck_bus, at(b), sub(root, BEAT * (.45 if off % 1 == .5 else .22)), .5)
    for off in STAB_PAT:
        b = b0 + off
        if in_groove(b):
            s = stab(chord, .28, 4800 if b < 12 else 6500)
            add(duck_bus, at(b), s, .56)
            add(REV, at(b), s, .18)

# lead motif in the two hottest sections
for sec in [(12, 20), (24, 32), (36, 42)]:
    for b0 in np.arange(sec[0], sec[1], 4):
        motif = LEAD[int((b0 // 4) % 2)]
        for off, m in motif:
            b = b0 + off
            if sec[0] <= b < sec[1]:
                p = pluck(hz(m), .3)
                add(L, at(b), p, .3, pan=.15)
                add(REV, at(b), p, .12)
                add(L, at(b + .75), p * .45, .22, pan=-.35)  # dotted-8th echo

# breakdown pad + filtered chords under the phone scene
add(L, at(32), pad([hz(m) for m in CHORDS[0] + [53]], 4 * BEAT, 700), .55)
add(REV, at(32), pad([hz(m) for m in CHORDS[0]], 4 * BEAT, 700), .3)

# ending: final chord at 42 ringing out
fin = stab([hz(m) for m in CHORDS[0] + [53, 77, 84]], 2.2, 6000)
add(L, at(42), fin, .7)
add(REV, at(42), fin, .6)
add(L, at(42), sub(hz(41), 1.6), .6)
add(L, at(42), K, .9)

# ------------------------------------------------------------------ FX layer
for b, g in [(2, 1.0), (4, .8), (12, .6), (24, .85), (36, 1.0)]:
    add(L, at(b), impact(g), .75)
    add(REV, at(b), impact(g), .2)
    add(L, at(b), crash(), 1.0)
for b, g in [(20, .5)]:
    add(L, at(b), crash(), g)

for start, end, amt in [(3, 4, .5), (10, 12, .55), (22, 24, .5), (32, 35.75, .75)]:
    r = riser((end - start) * BEAT, amt=amt)
    add(L, at(start), r, .5)
    add(REV, at(start), r, .2)

# snare rolls into drops
for start, end in [(3, 4), (11, 12), (23, 24)]:
    for b in np.arange(start, end, .25):
        add(L, at(b), SN, .25 + .35 * (b - start) / (end - start))
for b in np.concatenate([np.arange(34, 35, .25), np.arange(35, 35.75, .125)]):
    add(L, at(b), SN, .2 + .4 * (b - 34) / 1.75)

# whooshes on transitions (centred on the cut)
for b in (3.6, 7.8, 11.5, 19.6, 23.6, 31.6, 35.4):
    w = whoosh(.5)
    add(L, at(b) - int(.25 * SR), w, .45)
    add(REV, at(b) - int(.25 * SR), w, .2)

# UI sounds
for b in (12.5, 14.5, 16.5, 18.5):                       # -20% sticker stamps
    add(L, at(b), blip(900, 300, .12, .4))
for k in range(6):                                          # icon pops
    add(L, at(18 + k * .16), blip(1500 + k * 120, 900, .07, .22), pan=(k % 3 - 1) * .4)
for b in (20.2, 21.2, 22.2):                               # checkmarks
    add(L, at(b), blip(1800, 1200, .1, .25))
for b in np.arange(24.4, 25.8, 1 / 8):                     # counter ticks
    add(L, at(b), tick(.14))
for i in range(11):                                          # typing
    add(L, at(32.6 + i * 1.2 / 11) + int(rng.integers(0, 600)), tick(.22), pan=.1)
add(L, at(34), blip(600, 200, .12, .5))                     # tap
add(L, at(34.4), ding(), 1.0)
add(REV, at(34.4), ding(), .5)
add(L, at(39), blip(1200, 600, .06, .25))                   # cursor click on URL

# ------------------------------------------------------------------ sidechain
duck = np.ones(N)
for b in kicks:
    s = at(b)
    t = tt(.3)
    e = 1 - .75 * np.exp(-t / .07)
    end = min(N, s + len(t))
    duck[s:end] = np.minimum(duck[s:end], e[: end - s])
L += duck_bus * duck

# pre-drop gap: kill everything but the riser tail right before 36
g0, g1 = at(35.75), at(36)
fade = np.ones(N)
fade[g0:g1] = 0.0
L *= fade

# ------------------------------------------------------------------ reverb
ir_len = int(1.6 * SR)
tir = np.arange(ir_len) / SR
ir = np.stack([rng.standard_normal(ir_len), rng.standard_normal(ir_len)]) * np.exp(-tir * 3.2)
ir = np.stack([lp(ch, 7000) for ch in ir])
ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
wet = np.stack([signal.fftconvolve(hp(REV[i], 250), ir[i])[:N] for i in range(2)])
mix = L + wet * .55

# ------------------------------------------------------------------ master
mix = np.stack([hp(ch, 38, 4) for ch in mix])
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
end = int(DUR * SR)
mix = mix[:, :end]
tail = int(.02 * SR)
mix[:, -tail:] *= np.linspace(1, 0, tail)
mix /= np.abs(mix).max() / 0.89
out = sys.argv[1] if len(sys.argv) > 1 else "music.wav"
wavfile.write(out, SR, (mix.T * 32767).astype(np.int16))
print("wrote", out, f"{mix.shape[1] / SR:.2f}s")
