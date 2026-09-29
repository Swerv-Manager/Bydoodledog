"""Render scene.html frame-by-frame with headless Chromium, then mux with music.

Usage:
  python3 render.py stills 0.3 1.2 ...   # PNG stills at given seconds -> out/stills
  python3 render.py video                # full render -> out/black-month-pre-access-9x16.mp4
  python3 render.py remux                # re-synthesise music only and swap it into the mp4
"""
import os, sys, subprocess, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "out"
DUR = 20.0
FPS = 60          # rendered rate; blended down to 30 fps for natural motion blur
W, H = 1080, 1920


def ffmpeg():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return "ffmpeg"


def open_page(p):
    exe = os.environ.get("CHROMIUM", "/opt/pw-browsers/chromium")
    kw = {"executable_path": exe} if os.path.exists(exe) else {}
    b = p.chromium.launch(**kw, args=["--disable-gpu-vsync", "--force-color-profile=srgb"])
    pg = b.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)
    pg.goto((HERE / "scene.html").as_uri())
    pg.wait_for_function("window.isReady && window.isReady()")
    return b, pg


def stills(times):
    (OUT / "stills").mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b, pg = open_page(p)
        for i, t in enumerate(times):
            pg.evaluate(f"renderAt({t}, {i})")
            pg.screenshot(path=str(OUT / "stills" / f"t{t:05.2f}.png"))
        b.close()


def normalized_music():
    """Synthesise music.wav and loudness-normalise it to -14 LUFS / -1 dBTP (two-pass)."""
    import json, re
    raw, norm = OUT / "music.wav", OUT / "music-14lufs.wav"
    subprocess.run([sys.executable, str(HERE / "music.py"), str(raw)], check=True)
    ln = "loudnorm=I=-14:TP=-1.0:LRA=11"
    r = subprocess.run([ffmpeg(), "-hide_banner", "-i", str(raw), "-af", ln + ":print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True)
    m = json.loads(re.findall(r"\{[^{}]*\}", r.stderr)[-1])
    ln2 = (f"{ln}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
           f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run([ffmpeg(), "-y", "-loglevel", "error", "-i", str(raw), "-af", ln2, "-ar", "48000", str(norm)], check=True)
    return norm


def remux():
    """Swap in freshly synthesised/normalised audio without re-rendering frames."""
    dst = OUT / "black-month-pre-access-9x16.mp4"
    tmp = OUT / "tmp.mp4"
    music = normalized_music()
    subprocess.run([ffmpeg(), "-y", "-loglevel", "error", "-i", str(dst), "-i", str(music), "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", "-t", str(DUR), str(tmp)], check=True)
    tmp.replace(dst)
    print("remuxed", dst)


def video():
    OUT.mkdir(exist_ok=True)
    music = normalized_music()
    n = int(DUR * FPS)
    dst = OUT / "black-month-pre-access-9x16.mp4"
    cmd = [ffmpeg(), "-y", "-loglevel", "error",
           "-f", "image2pipe", "-framerate", str(FPS), "-c:v", "mjpeg", "-i", "-",
           "-i", str(music),
           "-vf", "tmix=frames=2:weights='1 1',fps=30,format=yuv420p",
           "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-profile:v", "high",
           "-c:a", "aac", "-b:a", "256k", "-ar", "48000",
           "-movflags", "+faststart", "-t", str(DUR), "-shortest", str(dst)]
    enc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    with sync_playwright() as p:
        b, pg = open_page(p)
        for i in range(n):
            pg.evaluate(f"renderAt({i / FPS}, {i // 2})")
            enc.stdin.write(pg.screenshot(type="jpeg", quality=95))
            if i % 120 == 0:
                print(f"frame {i}/{n}", flush=True)
        b.close()
    enc.stdin.close()
    enc.wait()
    print("wrote", dst)


if __name__ == "__main__":
    if sys.argv[1] == "stills":
        stills([float(x) for x in sys.argv[2:]])
    elif sys.argv[1] == "remux":
        remux()
    else:
        video()
