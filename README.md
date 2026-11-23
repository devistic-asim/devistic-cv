# Devistic CV

A private, in-browser resume studio. Write a CV section by section, import an existing file, or let a set of rules lay the page out. Nothing is uploaded and nothing is written by a model.

## Run locally

```bash
npm install
npm run dev
```

The dev server listens on [http://127.0.0.1:43123](http://127.0.0.1:43123).

```bash
npm test
npm run build
npm run preview
```

## What you can do

- **Write.** Personal details, a profile photo with crop and round, rounded, or square framing, summary, experience, education, skills with levels, projects, certifications, languages, links, and custom sections. Drag to reorder sections and entries. Duplicate or remove them. Bold, italic, lists, and links in the text fields.
- **Auto-build.** A short form, or an uploaded file, produces a complete CV. Rules pick a template, put early-career education first, merge duplicates, sort roles, rename familiar headings, normalize dates, and scale type and spacing toward one or two pages.
- **Import.** PDF (text via pdf.js), DOCX (mammoth), JSON Resume, a LinkedIn-style JSON export, plain text, or this app's own JSON. Parsing happens in the browser. Review the result before you export.
- **Preview.** The sheet updates as you type. Eight templates: Atlas, Harbor, Ledger, and Parchment are single column. Meridian, Nimbus, Forge, and Quartz use a second column. Accent, font, size, spacing, margins, date format, page size (A4 or US Letter), photo, and sidebar side are all editable.
- **Check.** A fixed checklist scores contact details, summary length, bullet length, action verbs, metrics, duplicates, dates, photos, and two-column risk. Example lines are a curated list with brackets you replace. No model is called.
- **Export.** Pixel-matched PDF and PNG, plus JSON. Print produces a text PDF for older applicant systems. The paper is white in both app themes.
- **Keep it.** Autosave to IndexedDB, several CVs, undo and redo, and keyboard shortcuts. No account.

Shortcuts: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y redo, Ctrl/Cmd+S confirms the autosave, Ctrl/Cmd+P prints, 1/2/3 switch Write, Design, and Check, ? opens the list.

## Design tokens

Colors live as CSS variables in `src/index.css`. Components use those variables (through Tailwind theme aliases such as `bg-primary` and `text-muted`). Do not hardcode a second palette in components.

| Token | Light | Dark |
| --- | --- | --- |
| Page background | `#F5F9FC` | `#0B1220` |
| Surface | `#FFFFFF` | `#1E293B` |
| Elevated surface | `#FFFFFF` | `#263246` |
| Primary text | `#1E293B` | `#F5F9FC` |
| Secondary text | `#637285` | `#C5D0DC` |
| Primary button | `#20B683` with `#0B1220` text | same |
| Accent | `#3BC1E6` (decorative on light; text on dark) | `#3BC1E6` |
| Accent ink | `#0E7490` | `#3BC1E6` |
| Highlight | `#FFEB5B` with `#1E293B` text | same |
| Focus | `#0F766E` | `#3BC1E6` |
| Borders | `#7E90A4` | `#7E90A4` |

`#C5D0DC`, `#0E7490`, `#0F766E`, and `#7E90A4` are contrast-safe derivations of slate, cyan, and green. Official slate `#637285` is secondary text on light backgrounds (it clears 4.5:1 on `#F5F9FC` and white) and is too faint on navy, so dark mode uses the lighter slate derivation. Green is a button fill, not small text: white on `#20B683` fails WCAG. Cyan is not body text on white. Yellow is only a highlight chip with navy text.

Theme is Light, Dark, or System. The choice is stored in `localStorage` under `devistic-theme`. An inline script in `index.html` sets `data-theme` before paint. The CV sheet stays white paper in every theme.

## Deploy

`npm run build` writes a static `dist/` folder. The app uses client-side routes, so the host must serve `index.html` for unknown paths. `public/_redirects` covers Netlify (`/* /index.html 200`). On another host, configure the same fallback.

## Limits

- PDF import reads selectable text. A scanned page has nothing to parse. Complex layouts, tables, and text boxes are reconstructed with headings, dates, and bullets, then you correct them.
- DOCX import uses the document's raw text, not its visual columns.
- The one-click PDF and PNG are high-resolution images of the sheet, so they match the preview and are not a text layer. Use Print when an applicant system needs selectable text. Single-column templates are the safer choice for those systems.
- Rich text is a small subset: bold, italic, lists, and links.
- Photos and documents stay in this browser's IndexedDB. Clearing site data clears the CVs. Export JSON if you want a copy you can move.
