# Project website

Static site for GitHub Pages: plain HTML, CSS and JavaScript, no build step.

```
docs/
├── index.html          single page, one <section> per topic
├── .nojekyll           serve files as-is (skip Jekyll)
└── assets/
    ├── css/style.css   colours taken from the app's skybox at dusk
    ├── js/luno-toy.js  the working model of the app in the hero
    ├── img/            screenshots and video posters
    └── vid/            screen recordings
```

## Preview locally

```
python3 -m http.server -d docs 8000
```

Then open http://localhost:8000.

## Publish

On GitHub: **Settings → Pages → Build and deployment**, source **Deploy from a branch**,
branch `master`, folder `/docs`.

Keep asset links relative (`assets/...`, not `/assets/...`), because the site is
served from a sub-path.

## The working model

The phones in the hero and in "Scrubbing through time" are drawn on canvases by
`assets/js/luno-toy.js`. It ports the app's `AstronomyCalculator` and skybox colours, so
they show the real moon over London. Each `<canvas data-luno-toy="…">` gets one of two modes:

- `interactive` (the hero): opens two hours before the sunset nearest to the visitor's
  time and plays through the evening once. A pulsing "Drag the dot" prompt on the timeline
  stays until the visitor first touches it or uses a key. Visitors can drag across it, tap
  the graph or the arrow, or use the arrow keys, Page Up/Down and Home once it has focus.
- `demo` (Scrubbing through time): not interactive. It loops from the darkest point of
  the nearest night, through the day, to the next night and back, and pauses while it's
  off screen.

Visitors who have asked for reduced motion get a still frame from each instead.

## To do

When the app is released, add each store's `href` to the buttons in the hero and remove
`aria-disabled="true"`, and update the status line beneath them. The illustrator's credit
also needs adding to the facts list in the overview.
