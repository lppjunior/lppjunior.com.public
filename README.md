# lppjunior.com.public

Public files of lppjunior.com, published with a browsable directory listing.

## How it works

- Put files in `public/`, in any folder structure.
- `npm run build` copies everything in `public/` to the root of `dist/`, keeping the same paths, and generates `dist/index.html` with the folder navigation.
  - `public/docs/guide.pdf` is served at `/docs/guide.pdf`.
  - Folders are browsed through the listing (`/#/docs/`).
- `.gitkeep`, `.DS_Store`, `Thumbs.db` and `desktop.ini` are neither published nor listed.
- `public/index.html` is not allowed, because it would replace the listing.

## Architecture

Dependencies point inwards only: `domain` ← `application` ← `presentation` / `infrastructure` ← `main` / `bin`.

```text
src/
  domain/          Pure rules: public paths (ignored, reserved, URL) and the GTM ID
  application/     Use case publishSite, written against ports (storage, renderPage, logger)
  presentation/    Listing page: template, styles, HTML escaping and GTM snippet
  infrastructure/  Adapters: file system, build config/.env, esbuild bundler, static server
  main/            Composition root that wires the adapters into the use case
  client/          Browser code: pure logic (folder index, listing, routes, formatting)
                   separated from DOM rendering (view, dom) and wiring (main)
bin/               CLI entry points: build and dev
tests/             Mirrors src/; the use case is tested with in-memory fakes,
                   integration tests run the real build
```

The client and the styles are bundled by esbuild and inlined in `index.html`, so the site has no other generated files that could clash with `public/`.

### CSS

`src/presentation/page/styles/` follows the DOM: each component of the page is one [BEM](https://getbem.com/) block (`block__element--modifier`) with its own file, and files are grouped in [cascade layers](https://developer.mozilla.org/docs/Web/CSS/@layer), from generic to specific:

```text
styles/
  index.css        Declares the layer order and imports every file
  settings/        tokens.css: design tokens (colors, fonts, radii, spacing); no other file hard-codes values
  base/            Element defaults (no classes)
  layout/          .page (<main>) and .card (<section>)
  components/      .site-header, .toolbar, .breadcrumb, .search, .listing, .entry, .file-icon,
                   .copy-button, .message, .fallback-list, .toast, .app-footer
  utilities/       .visually-hidden
```

| DOM | Block | Rendered by |
| --- | --- | --- |
| `<header>` with mark, title and summary | `site-header` | `template.html` + `view.mjs` (summary) |
| `<nav>` folder path | `breadcrumb` | `view.mjs` |
| Search field | `search` | `template.html` |
| Table of rows | `listing` (separators) / `entry` (row, `--head`) | `template.html` + `view.mjs` |
| Row badge | `file-icon--{kind}` (kind from `file-type.mjs`) | `view.mjs` |
| Copy link | `copy-button` | `view.mjs` |
| Empty / no match / not found | `message` | `view.mjs` |
| Copy confirmation | `toast` / `toast--visible` | `link-copier.mjs` |

Responsive rules (breakpoint 640px) live inside each component file. `tests/presentation/styles.test.mjs` checks that every file is imported, sits in the layer of its folder, and that every class used by the template or the client has a rule.

## Google Tag Manager

Copie `.env.example` para `.env` para ativar o GTM localmente. No provedor de deploy, configure `VITE_GTM_ID=GTM-KMTQTFL` antes do build. O identificador é público e é incluído no HTML. O build exige um identificador válido e falha caso ele esteja ausente ou inválido. No `npm run dev`, a variável é opcional: sem ela, o GTM fica desativado e um aviso é exibido.

## Scripts

- `npm run build`: builds `dist/`.
- `npm run dev`: builds without requiring GTM and serves `dist/` at <http://localhost:9010/> (`PORT` changes the port).
- `npm test`: runs all tests.
- `npm run lint`: checks the code with standard.

Node 26 (see `.nvmrc`).
