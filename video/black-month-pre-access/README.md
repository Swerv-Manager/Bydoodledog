# Black Month pre-access: lead-gen video (DK)

A 20-second, 9:16 motion-graphics ad for ByDoodleDog.dk that collects sign-ups for Black Month pre-access.

**File:** `black-month-pre-access-9x16.mp4` (1080×1920, 30 fps, H.264 + AAC, 20.0 s, audio at −14 LUFS / −1 dBTP)

## Storyboard (132 BPM, cuts land on the beat)

| Time | Scene | On screen |
|---|---|---|
| 0.0–1.8 s | Hook | "Hele shoppen" / "sat ned", then **-20%** slams in with a flash and camera shake, "på alt" |
| 1.8–3.6 s | Title | "ByDoodleDog præsenterer" · **Black Month** · pill: "Åbner lørdag 31.10" |
| 3.6–5.5 s | Pre-access | "Vil du ind før alle andre?", a lock opens, "Pre-access" chip |
| 5.5–9.1 s | Everything is on sale | "Alt er sat ned": Hundekurve → Bilsæder → Trapper → Alt det andet, each stamped -20% |
| 9.1–10.9 s | Product pillars | ✓ Æstetik ✓ Komfort ✓ Nemt vedligehold, "Til hunden. Og til dit hjem." |
| 10.9–14.5 s | Giveaway | Gift card counts up to 5.000 kr, fans out; "20 vindere blandt de første 200 kunder på åbningsdagen", "Live lodtrækning 31.10" |
| 14.5–16.4 s | How to sign up | Phone: types an email, taps "Skriv mig op", "Du er på listen" |
| 16.4–20.0 s | CTA | "Få pre-access", "Skriv dig op gratis på **bydoodledog.dk**", fine print, "Vi ses på shoppen" |

Music: synthesized future-house track in F minor. Every slam, riser, whoosh and UI sound (sticker stamps, counter ticks, typing, tap, success ding) sits on the animation's beat grid. There's a short silence just before the final drop.

## Where the facts come from

Every claim comes from Nexus: `bydoodledog-q4-2026-plan` (approved) and `bydoodledog-black-month-mailplan-2026`.

- Black Month opens Saturday 31.10 with 20% off the whole shop for all of November.
- People on the list get the email a few hours before everyone else.
- Among the first 200 customers on opening day, 20 winners each get a 5.000 kr gift card. The draw happens live.

Brand rules applied (brand profile): sentence case, no pressure or stock claims, no "det bliver ikke billigere", no Trustpilot, the pillars are æstetik / komfort / nemt vedligehold, and the sign-off is "Vi ses på shoppen".

**§ 9 a:** "-20%" / "20% på hele shoppen" is only lawful if every product has held its normal price since 1.10. Any product still marked down after 1.10 must not be advertised with the saving (see the blocker in the mail plan).

## Rendering

```bash
pip install playwright imageio-ffmpeg numpy scipy pillow
python3 render.py video            # full render -> out/black-month-pre-access-9x16.mp4 (~9 min)
python3 render.py remux            # rebuild only the music and swap it in
python3 render.py stills 1.2 9.5   # PNG stills at given seconds -> out/stills/
```

- `scene.html` holds the whole animation as a pure function of time (`renderAt(t)`). Open it in a browser to inspect the layout.
- `render.py` screenshots 60 fps in headless Chromium and blends pairs down to 30 fps, which gives natural motion blur.
- `music.py` synthesizes the track. `render.py` loudness-normalizes it (two-pass loudnorm) and muxes it in.
- Text lives in `scene.html`. Timings are in beats (`BEAT = 60/132 s`), so changing copy doesn't break the sync.

## Known limitations

- The products are **illustrations**, not photos. The sandbox this was built in can't reach Shopify's CDN. To use real Bjørk / bilsæde / trappe photos, replace the SVGs inside `#p1`, `#p2` and `#p3` in `scene.html` with `<img>` tags (transparent PNG cutouts, ~900×600).
- "ByDoodleDog" in the end card and on the gift card is set in type. It is not the official logo file.
