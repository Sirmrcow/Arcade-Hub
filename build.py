"""Join src/ back into index.html."""
import glob
import os

ROOT = os.path.dirname(os.path.abspath(__file__))


def read(path):
    with open(os.path.join(ROOT, path), encoding="utf-8", newline="") as f:
        return f.read().replace("\r\n", "\n")


games = sorted(glob.glob(os.path.join(ROOT, "src", "[1-9]*.js")))
js = "".join(read(p).rstrip("\n") + "\n\n" for p in games)
out = read("src/00_shell.html") + "<script>\n" + js + "</script>\n" + read("src/99_router.html")

with open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8", newline="\r\n") as f:
    f.write(out)
print(f"index.html built from {len(games)} game files")
