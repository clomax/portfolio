# Project website

Static site for GitHub Pages: plain HTML, CSS and JavaScript, no build step.

```
docs/
├── index.html              single page, one <section> per topic
├── .nojekyll               serve files as-is (skip Jekyll)
└── assets/
    ├── css/style.css       colours taken from the logo's gradient
    ├── js/starchitect.js   the working models of the dashboard, client report and site app
    └── img/logo.svg        the logo, also used as the favicon
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

## The logo

A five-pointed star drawn as a Celtic knot. `assets/img/logo.svg` is the full-colour
version. The page draws the same path once, as `<symbol id="star">` at the top of
`index.html`, and reuses it with `<use>`: with the gradient in the header and the
dashboard model, and in the text colour in the hero.

## The working models

`assets/js/starchitect.js` drives the three models, which share one made-up project
(Rowan House, a house extension in RIBA stage 5):

- The dashboard in the hero shows the RIBA Plan of Work 2020 stages and tasks from the
  app's `RIBA2020Seeder`. Ticking a task in stage 5 moves the client report on.
- The client report shows the current stage under its plain name, the architect's note,
  a decision for the client, site photos and a timeline.
- The site app's shutter adds a photo, shows it uploading, and then adds it to the
  dashboard, the client report and the sync log.

Visitors who have asked for reduced motion get uploads that finish straight away.
