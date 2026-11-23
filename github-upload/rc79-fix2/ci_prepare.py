"""Apply this revision's frozen HOME1 overlay."""
import sys
from pathlib import Path

here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent))
from rc79_overlay import apply_overlay

apply_overlay(Path(sys.argv[1]).resolve(), here)
