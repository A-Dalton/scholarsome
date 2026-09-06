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
| `uuid: ^11.1.1` | Clears [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) (moderate, < 11.1.1), reached via `sockjs` → `webpack-dev-server`. `sockjs` still declares `uuid ^8.3.2` and the 8.x line has no fix. Remove when that chain resolves a patched uuid on its own. |
| `qs: ^6.16.0` | Clears [GHSA-q8mj-m7cp-5q26](https://github.com/advisories/GHSA-q8mj-m7cp-5q26), [GHSA-x5fp-wj9c-mxmx](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx) and [GHSA-4mjr-xmp4-gh2g](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g) (moderate, DoS, ≤ 6.15.3), reached via `webpack-dev-server` → `express@4` → `body-parser@1.20.6`. Remove when that chain resolves ≥ 6.16.0 on its own. |
| `prisma → mysql2: ^3.24.2` | Clears [GHSA-3f6p-5ww8-9rcr](https://github.com/advisories/GHSA-3f6p-5ww8-9rcr) (high, auth plugin downgrade leaks plaintext credentials) and [GHSA-rgwj-5xj2-c3m3](https://github.com/advisories/GHSA-rgwj-5xj2-c3m3) (high, decompression-bomb DoS), affecting ≤ 3.23.0. `prisma@7` pins `mysql2 3.15.3` exactly. Remove when prisma pins a patched mysql2 itself. |
| `@prisma/adapter-mariadb → mariadb: 3.5.3` | Clears [GHSA-cqhc-2h57-wpxf](https://github.com/advisories/GHSA-cqhc-2h57-wpxf), [GHSA-42r5-vhpq-m858](https://github.com/advisories/GHSA-42r5-vhpq-m858) and [GHSA-g5xc-5w98-jfvm](https://github.com/advisories/GHSA-g5xc-5w98-jfvm) (all high, affecting 3.4.0 – 3.4.5; the 3.5.x line is the fix). `@prisma/adapter-mariadb@7` pins `mariadb 3.4.5` exactly. Remove when the adapter pins a patched mariadb itself. |
| `@prisma/config → deepmerge-ts: 8.0.2` | Clears [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx) (high, stack exhaustion, < 8.0.0). `@prisma/config@7` pins `deepmerge-ts 7.1.5` exactly. Remove when `@prisma/config` resolves ≥ 8.0.0 on its own. |
| `image-size: npm:image-size-next@2.1.1` | [GHSA-w3rx-r6r6-pgpr](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr) and [GHSA-5p2g-fcmc-qvqq](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq) (high, DoS) affect every released image-size (≤ 2.0.2, no patched version has been published) and the upstream repo is archived. `image-size-next` is an API-compatible continuation. Remove when docusaurus stops depending on image-size or pins a fixed release. |
| `less: ^4.9.0` | `@nx/webpack` still caps `less <4.9.0`; the pin keeps the whole tree on the latest less 4.9.x. `npm audit` shows less 4.8.x is clean (it no longer pulls `image-size`), so this is no longer strictly security-required. Remove when `@nx/webpack`'s `less` range includes ≥ 4.9.0. |

### Compatibility-driven overrides

These reconcile peer-dependency ranges of third-party packages that have not caught up with the NestJS 12 / Angular 22 versions used here. Removing any of them makes `npm install` fail to resolve (or silently installs duplicate older NestJS/Angular copies), not because of a vulnerability.

| Override | Reason |
| --- | --- |
| `@nestjs/throttler → @nestjs/common`/`@nestjs/core ^12.0.0` | `@nestjs/throttler@6.5.0` (latest) declares peers only up to `^11.0.0`. Remove when throttler declares NestJS 12 peers. |
| `@nx/nest → @nestjs/common`/`@nestjs/core >=10.0.0 <13.0.0` | `@nx/nest@23.2.0` (latest) declares peers `>=10.0.0 <12.0.0`; widened to accept NestJS 12. Remove when `@nx/nest` accepts NestJS 12. |
| `@songkeys/nestjs-redis → @nestjs/common`/`@nestjs/core ^12.0.0`, `ioredis ^6.0.0` | Latest (`11.0.0`) declares peers `^10.0.0 \|\| ^11.0.0` and `ioredis ^5.0.0`. Remove when it declares NestJS 12 / ioredis 6 peers. |
| `nest-winston → @nestjs/common ^12.0.0` | `nest-winston@1.10.2` (latest) declares peers only up to `^11.0.0`. Remove when it declares NestJS 12 peers. |
| `ng-recaptcha → @angular/core $@angular/core` | `ng-recaptcha@13.2.1` (latest) declares only `^17.0.0`; `$@angular/core` references the root's Angular version. Remove when ng-recaptcha supports Angular 22. |
