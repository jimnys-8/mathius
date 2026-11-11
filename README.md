# Mathius

A math practice game for kids. Each question comes with a picture made of
dots that helps find the answer: press **Hint** to see the dots rearranged
so the answer can be counted, and after answering the picture shows the
solution.

## Features

- Addition, subtraction, multiplication, division, or a mix
- Five levels, from numbers up to 10 to missing-number equations up to 100
  (`? + 4 = 9`, `7 × ? = 56`)
- Rounds of 10 questions, or a timer (30 s, 1 min or 2 min)
- One profile per player, with remembered settings, stats, best timed
  scores and the facts they miss most often (stored in the browser's
  localStorage)
- On-screen number keys on touch devices

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
```

- **Questions** are facts `a op b = c` with one hidden term. Hiding `c`
  gives a regular question; hiding `a` or `b` gives an equation.
- **Visualizations** are built by `viz/scenes.js` as three frames
  (question, hint, solution) of elements with stable ids. The renderer
  animates between frames with CSS transitions: dots that keep their id
  move, new elements fade in and missing ones fade out.
  - Addition: two groups merge, filling up rows of ten.
  - Subtraction: dots are taken away from the end.
  - Multiplication: an array of rows, counted row by row.
  - Division: dots are dealt into boxes.
