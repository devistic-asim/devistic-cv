# Contributing

Devistic CV is a client-side resume studio. Changes should keep that boundary: no account, no analytics, no model, and no resume data leaving the browser.

## Setup

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123/devistic-cv/](http://127.0.0.1:43123/devistic-cv/).

## Checks

```bash
npm run lint
npm test
npm run build
```

`npm run build` typechecks, writes `dist/`, and copies `index.html` to `404.html` so GitHub Pages can serve client-side routes.

## What fits

- A rule a reader can inspect, with a short hint next to the control it affects.
- Typed changes that keep the existing templates, import paths, and exports working.
- Contrast that stays at WCAG 2.2 AA for text and controls. Brand colors live as CSS variables in `src/index.css`.

## What does not fit

- A backend, a tracker, or a call to a writing model.
- A second color palette hardcoded in a component.

## Reports

Use the bug and feature templates. The contact for the project is the GitHub profile: https://github.com/devistic-asim
