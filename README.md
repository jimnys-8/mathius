# Mathius

A math practice game for kids. Each question comes with a picture made of
dots that helps find the answer: press **Hint** to see the dots rearranged
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
- On easier levels some pictures start half solved; `guided` in
  `src/game/config.js` sets which, per level
- Rounds of 10 questions, or a timer (30 s, 1 min or 2 min)
- One profile per player, with remembered settings, stats, best timed
  scores and the facts they miss most often (stored in the browser's
  localStorage)
- On-screen number keys on touch devices, and at the press of a button (🔢) with a keyboard, remembered per player
- Swedish and English (Swedish by default); all text is in
  `src/i18n/strings.js`

## Development

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
