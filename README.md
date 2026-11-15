# Mathius

A math, reading and telling-the-time practice game for kids. Each math question comes with
a picture made of dots that helps find the answer: press **Hint** to see the dots rearranged
so the answer can be counted, and after answering the picture shows the
solution.

## Features

- Counting, addition, subtraction, multiplication, division, a mix of the
  four, square roots and equations with a variable
- Each category has its own ladder of levels, and each player's last
  level is remembered per category:
  - Counting: how many dots (up to 5, then 10), then picking the button
    with as many dots as a number
  - Arithmetic: a Dots level for addition and subtraction up to 10,
    answered by picking a button with the right number of dots, then five
    levels from numbers up to 10 to missing numbers up to 100
    (`? + 4 = 9`, `7 × ? = 56`)
  - Square roots: perfect squares (`√49`, `√? = 7`) to estimates picked
    from four choices (`√40 ≈ 6.3`)
  - Equations: `x + 3 = 7`, `3x = 12`, `3x + 1 = 10`, then also
    `3x − 2 = 13`
- Reading: *Which word?* shows an emoji to pick the word for, and
  *Which picture?* a word to pick the emoji for, among four. Levels go
  from short words in capitals to all words in lowercase, where the
  wrong words look like the right one. The words (`src/game/words.js`)
  follow the app's language, and a hint takes away two wrong answers
- Telling the time, in four games: an analog clock to read as a digital
  time or in words ("fem i halv nio"), and a digital time to say in
  words or find the clock for. Levels go from whole hours to every five
  minutes, then 24-hour digital times or clocks without numbers. Hands
  and digits share colors (hours purple, minutes orange), and a hint
  writes the minutes around the clock
- On easier levels some pictures start half solved; `guided` in
  `src/game/config.js` sets which, per level
- Rounds of 10 questions, or a timer (30 s, 1 min or 2 min)
- One profile per player, with remembered settings, stats, best timed
  scores and the facts they miss most often (stored in the browser's
  localStorage)
- On-screen number keys on touch devices, and at the press of a button (🔢) with a keyboard, remembered per player
- Swedish and English (Swedish by default); all text is in
  `src/i18n/strings.js`
- Installable as an app with its own icon, and playable offline once
  opened (see below)

## Installing on a phone or tablet

Open the game's address once while online, then:

- **Android (Chrome):** menu ⋮ → *Install app* (or *Add to Home screen*)
- **iPhone/iPad (Safari):** Share → *Add to Home Screen*

It then opens full screen and works without a connection. Each device
keeps its own players and progress. A new version is downloaded in the
background and used the next time the game is opened.

## Development

Uses the Node version in `.nvmrc` (`nvm use`).

```sh
npm install
npm run dev     # start the dev server
npm test        # run the unit tests
npm run lint
npm run build
```

Open `/?gallery` on the dev server to see every kind of visualization side
by side (add `&step=1` for hints, `&step=2` for solutions, `&op=mul` to
filter).

The offline support (a service worker from `vite-plugin-pwa`) is only
active in a build: try it with `npm run build && npm run preview`.

## Publishing

`.github/workflows/deploy.yml` lints, tests, builds and publishes the game
to GitHub Pages on every push to `main` (or by hand from the Actions tab).
One-time setup on GitHub: *Settings → Pages → Source: GitHub Actions*.
The site is served from `https://<user>.github.io/<repository>/`; the
workflow passes that path to the build as `BASE_PATH`.

## How it fits together

```
src/
  game/       questions, levels and the session reducer (pure, tested)
  viz/        visualizations: scene builders (pure) and the SVG renderer
  profiles/   persistent store and stats (pure, tested) + React hook
  screens/    profile picker, setup, play, summary and stats screens
  components/ smaller UI pieces (equation, numpad, countdown, ...)
  i18n/       texts per language and number formatting
```

- **Questions** are facts `a op b = c` with one hidden term. Hiding `c`
  gives a regular question; hiding `a` or `b` gives a missing number.
  Square roots are `√a = b`; estimates also carry `choices`. Counting has
  a single term, and equations are `a·x + b = c` with x hidden.
- **Visualizations** are built by `viz/scenes.js` as three frames
  (question, hint, solution) of elements with stable ids. The renderer
  animates between frames with CSS transitions: dots that keep their id
  move, new elements fade in and missing ones fade out.
  - Addition: two groups merge, filling up rows of ten.
  - Counting: dots in rows of five, numbered one by one in the hint.
  - Subtraction: dots are taken away from the end (orange from the start
    on easy levels).
  - Multiplication: an array of rows, counted row by row.
  - Division: dots are dealt into boxes.
  - Square roots: dots form a square. For estimates, the leftovers after
    the biggest square start the border of the next one, so how far round
    they reach shows the decimal. On easier levels the square is laid
    out from the start.
  - Equations: each x is a bag over a pile of dots. The hint evens out
    both sides, and the solution shares the rest between the bags.
