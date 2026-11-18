# lppjunior.com.public

Public files of lppjunior.com, published with a browsable directory listing.

## How it works

- Put files in `public/`, in any folder structure.
- `npm run build` (Vite) copies everything in `public/` to the root of `dist/`, keeping the same paths, and builds `dist/index.html` with the folder navigation.
  - `public/docs/guide.pdf` is served at `/docs/guide.pdf`.
  - Folders are browsed through the listing (`/#/docs/`).
- `.gitkeep`, `.DS_Store`, `Thumbs.db` and `desktop.ini` are not listed.
- `public/index.html` is not allowed, because it would replace the listing.

## Architecture

The system and the build are separate:

- `src/` is the application that runs in the browser. It knows nothing about Vite or the file system: it receives the file list as a module and renders it.
- The build is plain Vite. The only project-specific piece is `vite-plugins/public-files.mjs`, which exposes the files of `public/` as `import files from 'virtual:public-files'`. Vite copies `public/` to `dist/`, bundles `src/`, reads `.env` and serves the dev server.

```text
index.html             Page markup (Vite entry)
src/
  main.mjs             Composition: file list + listing logic + UI, kept in sync with URL and search
  domain/              Pure rules: public paths (ignored, URL, name order) and file types
  application/         Folder index and listing (what to show for a folder/query), no DOM
  ui/                  DOM rendering (view, dom), routes, formatting, link copier, styles
vite-plugins/          Build only: public-files plugin
vite.config.mjs        Vite config: public-files, Google Tag Manager and inline CSS (same as the other projects)
tests/                 Mirrors src/; tests/build runs the real Vite build
```

Dependencies point inwards: `ui` → `application` → `domain`; `main.mjs` wires them.

### CSS

`src/ui/styles/` follows the DOM: each component of the page is one [BEM](https://getbem.com/) block (`block__element--modifier`) with its own file, and files are grouped in [cascade layers](https://developer.mozilla.org/docs/Web/CSS/@layer), from generic to specific:

```text
styles/
  index.css        Declares the layer order and imports every file
  settings/        tokens.css: design tokens (colors, fonts, radii, spacing); no other file hard-codes values
  base/            Element defaults (no classes)
  layout/          .page (<main>) and .card (<section>)
  components/      .site-header, .toolbar, .breadcrumb, .search, .listing, .entry, .file-icon,
                   .copy-button, .message, .toast, .app-footer
  utilities/       .visually-hidden
```

| DOM | Block | Rendered by |
| --- | --- | --- |
| `<header>` with mark, title and summary | `site-header` | `index.html` + `view.mjs` (summary) |
| `<nav>` folder path | `breadcrumb` | `view.mjs` |
| Search field | `search` | `index.html` |
| Table of rows | `listing` (separators) / `entry` (row, `--head`) | `index.html` + `view.mjs` |
| Row badge | `file-icon--{kind}` (kind from `domain/file-type.mjs`) | `view.mjs` |
| Copy link | `copy-button` | `view.mjs` |
| Empty / no match / not found / no JavaScript | `message` | `view.mjs` + `index.html` |
| Copy confirmation | `toast` / `toast--visible` | `link-copier.mjs` |

Responsive rules (breakpoint 640px) live inside each component file. `tests/ui/styles.test.mjs` checks that every file is imported, sits in the layer of its folder, and that every class used by `index.html` or the UI has a rule.

## Google Tag Manager

Copie `.env.example` para `.env` para ativar o GTM localmente. No provedor de deploy, configure `VITE_GTM_ID=GTM-KMTQTFL` antes do build. O identificador é público e é incluído no HTML. O build exige um identificador válido e falha caso ele esteja ausente ou inválido. No servidor de desenvolvimento, a variável é opcional: sem ela, o GTM fica desativado e um aviso é exibido.

## Scripts

- `npm run dev`: Vite dev server at <http://localhost:9010/>; adding or removing files in `public/` refreshes the listing.
- `npm run build`: builds `dist/`.
- `npm run preview`: serves the built `dist/`.
- `npm test`: runs all tests.
- `npm run lint`: checks the code with standard.

Node 26 (see `.nvmrc`).
