# lppjunior.com.public

Public files of lppjunior.com, published with a browsable directory listing.

## How it works

- Put files in `public/`, in any folder structure.
- `npm run build` copies everything in `public/` to the root of `dist/`, keeping the same paths, and generates `dist/index.html` with the folder navigation.
  - `public/docs/guide.pdf` is served at `/docs/guide.pdf`.
  - Folders are browsed through the listing (`/#/docs/`).
- `.gitkeep`, `.DS_Store`, `Thumbs.db` and `desktop.ini` are neither published nor listed.
- `public/index.html` is not allowed, because it would replace the listing.

## Google Tag Manager

Copie `.env.example` para `.env` para ativar o GTM localmente. No provedor de deploy, configure `VITE_GTM_ID=GTM-KMTQTFL` antes do build. O identificador é público e é incluído no HTML. O build exige um identificador válido e falha caso ele esteja ausente ou inválido. No `npm run preview`, a variável é opcional: sem ela, o GTM fica desativado e um aviso é exibido.

## Scripts

- `npm run build`: builds `dist/`.
- `npm run preview`: builds and serves `dist/` at <http://localhost:9010/>.
- `npm test`: runs the build tests.

No dependencies are needed. Node 26 (see `.nvmrc`).
