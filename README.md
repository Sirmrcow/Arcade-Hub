# Arcade Hub

34 browser games in one page — 3D, arcade, puzzle, board and skill games — with favorites, recently played, search, categories and a settings panel (themes, accent colors, volume, look speed, accessibility).

Everything runs in the browser. There is no server and nothing to install. Best scores, favorites and settings are saved in each player's own browser (localStorage).

## Put it live on GitHub Pages

1. Create a new repository on GitHub (for example `arcade-hub`), set to **Public**.
2. Upload the contents of this folder (keep `index.html` at the top level):
   - On github.com: **Add file → Upload files**, drag everything in, then **Commit changes**.
   - Or with git:
     ```bash
     git init
     git add .
     git commit -m "Arcade Hub"
     git branch -M main
     git remote add origin https://github.com/YOUR-NAME/arcade-hub.git
     git push -u origin main
     ```
3. In the repository go to **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to *Deploy from a branch*, pick **main** and **/ (root)**, and click **Save**.
5. After a minute or two the site is live at `https://YOUR-NAME.github.io/arcade-hub/`.

Each game has its own link too, e.g. `…/arcade-hub/#driftking` or `…/arcade-hub/#snake`.

## Files

| Path | What it is |
|---|---|
| `index.html` | The whole site — this is what GitHub Pages serves |
| `src/` | The source, split into readable pieces (hub UI, one file per game group) |
| `build.py` | Joins `src/` back into `index.html` |
| `.nojekyll` | Tells GitHub Pages to serve the files as-is |

## Editing

Change files in `src/`, then run `python3 build.py` to regenerate `index.html`, and commit both.

- `src/00_shell.html` – page layout, styles, settings defaults, shared game helpers
- `src/99_router.html` – the hub (cards, search, favorites, settings panel) and navigation
- every other `src/*.js` file – games; each one is a `GAMES.push({...})` entry

To add a game, add a `GAMES.push({ id, title, tag, cat, emoji, bg, desc, start(ctx){ ... } })` block to a `.js` file in `src/` and rebuild.

## External resources

The page loads two things from the internet: the Space Grotesk font (Google Fonts) and three.js r128 (cdnjs) for the 3D games. Both work on GitHub Pages without any setup.
