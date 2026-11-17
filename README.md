# lppjunior.com.public

Public files of lppjunior.com, published with a browsable directory listing.

## How it works

- Put files in `public/`, in any folder structure.
- `npm run build` copies everything in `public/` to the root of `dist/`, keeping the same paths, and generates `dist/index.html` with the folder navigation.
  - `public/docs/guide.pdf` is served at `/docs/guide.pdf`.
  - Folders are browsed through the listing (`/#/docs/`).
- `.gitkeep`, `.DS_Store`, `Thumbs.db` and `desktop.ini` are neither published nor listed.
- `public/index.html` is not allowed, because it would replace the listing.

## Scripts

- `npm run build`: builds `dist/`.
- `npm run preview`: builds and serves `dist/` at <http://localhost:9010/>.
- `npm test`: runs the build tests.

No dependencies are needed. Node 26 (see `.nvmrc`).
