# SFMB-TEST-UI – Mario Multiverse menu prototype

Open `index.html` directly in a browser (double-click works, no server needed).

## Files
- `index.html` – the markup of every screen (main menu, user gallery, stages, your profile, Stage World, stage details, pause, clear screen, comment mode).
- `style.css` – all positions, sizes, colours and animations. Sections are marked with `/* ==== Name ==== */`.
- `script.js` – behaviour: data generation, text rendering, tooltips, transitions, comment mode.
- `fonts.js` – the three bitmap fonts, embedded (the page reads their pixels, which browsers block for image files opened from disk).
- `assets/` – every other image as a PNG.

The Stage World search dialog layout values are in `script.js` under `const SFL` (search for "search & filters dialog").

## Fine-tuning values
- Units are game pixels: the screen is 421 × 243. Screenshot coordinate ÷ 3 = value in the CSS.
- `#vw` starts 5px above the visible screen, so a `top` in the CSS equals the y you measure on a 3x screenshot (with its 15px bars) divided by 3.
- Change a number in `style.css`, save, refresh the browser.
- Press `1` in the page to toggle true 1:1 pixel size.

## Useful URL hashes
`#main`, `#users`, `#stages`, `#your-profile`, `#stage-world`, `#world-stage-0`, `#play-stage-0`, `#clear-stage-0`

## Animation timings
All animation speeds are at the top of `style.css`, in the `:root` block under "Animation timings"
(e.g. `--t-iris: 0.45s;`). Change a value, save, refresh. The ones marked (JS) are also read by the script,
so one edit changes both.
