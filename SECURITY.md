## Reporting a vulnerability

Reach out to the <a href="https://github.com/A-Dalton">project lead</a> directly when reporting a vulnerability. __Do not__ use public facing areas, such as GitHub issues, to report security vunerabilities.

Additionally, you can email support@scholarsome.com to report security issues.

A public security advisory will be created once a patch for the issue is available.

## Dependency security

Dependencies are tracked with `npm audit` and Dependabot (`.github/dependabot.yml`). Run `npm audit` after changing dependencies; the goal is to keep the report free of findings other than the accepted one below.

## Accepted vulnerabilities

### quill 2.0.3 — XSS via HTML export (low severity)

- **Advisory:** [GHSA-v3m3-f69x-jf25](https://github.com/advisories/GHSA-v3m3-f69x-jf25) / CVE-2025-15056. Affects exactly `quill@2.0.3`, which is the newest release — **no patched version has been published**. npm's suggested "fix" (downgrading to 2.0.2) is not a security fix and is not used here.
- **Where it is used:** the flashcard editor (`ngx-quill` in `apps/front`). ngx-quill's default `html` format produces editor content through the vulnerable export path (`getSemanticHTML()`).
- **Why this is accepted:**
  - All user-supplied rich text (cards, sets, folders, Quizlet/file imports) is sanitized server-side with `sanitize-html` before it is stored — see `apps/api/src/app/shared/sanitization/sanitization-config.ts` and the `@Transform` validators on the API DTOs.
  - The front end re-renders only HTML that has already passed through that server-side sanitizer.
  - The residual exposure is therefore essentially self-XSS inside a user's own editing session.
- **Revisit when:** a patched quill release ships (Dependabot / `npm audit` will surface it), or the editor is migrated to another rich-text framework (e.g. Tiptap/ProseMirror or CKEditor 5) — currently the only way to actually remove the finding.

## Dependency overrides

`package.json` cannot contain comments, so the intent of each override in `package.json` is documented here. An override forces a dependency version across the whole tree, even where it conflicts with a parent package's declared range.

**Do not remove an override without re-running `npm audit`.** Most exist specifically to keep vulnerable transitive versions out of the lockfile; each can be dropped only once the parent package's own dependency range no longer resolves to a vulnerable version.

### Security-driven pins

| Override | Reason |
| --- | --- |
| `serialize-javascript: ^7.1.1` | Clears [GHSA-5c6j-r48x-rmvq](https://github.com/advisories/GHSA-5c6j-r48x-rmvq) (high, RCE, ≤ 7.0.2) and [GHSA-qj8w-gfj5-8c6v](https://github.com/advisories/GHSA-qj8w-gfj5-8c6v) (moderate, DoS, < 7.0.5). Docusaurus's `copy-webpack-plugin@11` / `css-minimizer-webpack-plugin@5` still declare `^6`. Remove when `@docusaurus/core` resolves ≥ 7.0.5 on its own. |
| `uuid: ^11.1.1` | Clears [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) (moderate, < 11.1.1), reached via `sockjs` → `webpack-dev-server`. Remove when that chain resolves a patched uuid on its own. |
| `less: ^4.9.0` | `@nx/webpack` pins `less <4.9.0`, which pulls in the vulnerable `image-size@0.5.x` (see the `image-size` row); less 4.9 uses `probe-image-size` instead. Remove when `@nx/webpack`'s `less` range includes ≥ 4.9.0. |
| `image-size: npm:image-size-next@2.1.1` | [GHSA-w3rx-r6r6-pgpr](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr) and [GHSA-5p2g-fcmc-qvqq](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq) (high, DoS) affect every released image-size (2.0.2 is the latest) and the upstream repo is archived. `image-size-next` is an API-compatible continuation. Remove when docusaurus stops depending on image-size or pins a fixed release. |
| `ws@7: 7.5.13`, `form-data@2: 2.5.6`, `form-data@3: 3.0.5`, `form-data@4: 4.0.6`, `tar: 7.5.22`, `fast-xml-parser: 5.10.1`, `mailparser: 3.9.16`, `nx → brace-expansion: 5.0.9`, `@prisma/adapter-mariadb → mariadb: 3.5.3`, `@prisma/config → deepmerge-ts: 8.0.2`, `websocket-driver: 0.7.5`, `shell-quote: 1.10.0` | Pins vulnerable transitive dependencies to patched releases (added in `f863ece`, "resolved critical vulnerabilities"). Check `npm audit` before removing any of them. |
