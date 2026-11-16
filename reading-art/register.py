"""Register a selected three-panel source image as a content-addressed WebP."""
import argparse
import hashlib
import io
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('day', type=int, choices=range(1, 85), metavar='DAY')
parser.add_argument('source', type=Path)
parser.add_argument('--cuts', nargs=2, type=int, metavar=('TOP_END', 'MIDDLE_END'))
args = parser.parse_args()
body = args.source.read_bytes()
image = Image.open(io.BytesIO(body))
image.load()
width, height = image.size
minimum_ratio = 1 if args.cuts else 1.2
if width < 750 or height < 1020 or not minimum_ratio <= height / width <= 1.85:
    raise ValueError(f'Expected a portrait three-panel sheet; received {width}×{height}')
cuts = [0, *(args.cuts or [height // 3, 2 * height // 3]), height]
if any(not height * .27 <= b - a <= height * .40 for a, b in zip(cuts, cuts[1:])):
    raise ValueError('Each panel must occupy roughly one third of the sheet')
dest = io.BytesIO()
image.convert('RGB').save(dest, 'WEBP', quality=85, method=6)
webp = dest.getvalue()
digest = hashlib.sha256(webp).hexdigest()
path = f'assets/reading-art/{digest}.webp'
(ROOT / path).parent.mkdir(parents=True, exist_ok=True)
(ROOT / path).write_bytes(webp)
scenes = json.loads((ROOT / 'reading-art/scenes.json').read_text())
text = '\n'.join(panel['text'] for panel in scenes[args.day - 1]['panels'])
manifest = ROOT / 'reading-art/assets.json'
records = json.loads(manifest.read_text())
records[str(args.day)] = {
    'path': path,
    'width': width,
    'height': height,
    'cuts': cuts,
    'sceneSha256': hashlib.sha256(text.encode()).hexdigest(),
    'sourceSha256': hashlib.sha256(body).hexdigest(),
    'sourceFile': args.source.name,
    'generator': 'ImageGen',
    'status': 'ready',
}
manifest.write_text(json.dumps(records, indent=2, ensure_ascii=False) + '\n')
print(path, len(webp))
