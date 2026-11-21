## Reporting a vulnerability

Reach out to the <a href="https://github.com/A-Dalton">project lead</a> directly when reporting a vulnerability. __Do not__ use public facing areas, such as GitHub issues, to report security vulnerabilities.

Additionally, you can email support@scholarsome.com to report security issues.

A public security advisory will be created once a patch for the issue is available.

## Dependency security

Dependencies are tracked with `npm audit` and Dependabot (`.github/dependabot.yml`). Run `npm audit` after changing dependencies; the goal is to keep the report free of findings other than the accepted ones below.

After the dependency update described here, `npm audit` reports **1 low finding (`quill`) and no moderate, high, or critical findings**. The `braces` and `deepmerge` advisories below are still accepted and remain present in build/dev tooling, but the current `npm audit` run does not surface them in this tree.

## Accepted vulnerabilities

### braces 3.0.3 — stack-exhaustion DoS via deeply nested glob patterns (high)

- **Advisory:** [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) / CVE-2026-93687 (CVSS 8.7). Affects every published braces version — `3.0.3` is both the newest release and the version installed here — **no patched version exists**. The AST walkers lack depth guards, so a deeply nested `{a,b{c,d},…}` pattern can exhaust the call stack and crash the Node process with an uncaught `RangeError`.
- **Where it is used:** `braces` is the glob-expansion primitive underneath `micromatch`, used by build/dev tooling such as `@docusaurus/core` (`@docusaurus/utils` → `micromatch` → `braces`, plus `chokidar`) and `webpack-dev-server` (`chokidar`). The production API bundle does not contain `braces`.
- **Why this is accepted:**
  - Glob patterns come from repository configuration and CLI flags, never from untrusted runtime input.
  - The production API bundle does not contain `micromatch` / `braces`; the front-end and docs bundles only contain unrelated strings.
  - The exposure is a build-time availability nuisance on a developer machine, not an attack surface of the deployed application.
- **Revisit when:** a braces release with depth guards ships. Upstream tracking: [micromatch/braces#70](https://github.com/micromatch/braces/issues/70). The current `npm audit` report does not include this advisory, so it contributes no finding here; if Dependabot or `npm audit` surfaces it later, it remains accepted for the reasons above.

### deepmerge 4.3.1 — prototype poisoning of returned objects (low)

- **Advisory:** [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) (CVSS 5.3, npm severity low). Affects `deepmerge` `>= 4.2.0 <= 4.3.1`; `4.3.1` is the latest release, so **no patched version exists**.
- **Where it is used:** `jest-config` (and therefore `jest` / `@jest/*` / `@nx/jest`), `fork-ts-checker-webpack-plugin` (and therefore `@nx/webpack`), and `@svgr/plugin-svgo` (and therefore `@svgr/webpack` / `@docusaurus/plugin-svgr` / `@docusaurus/preset-classic`).
- **Why this is accepted:**
  - The merge inputs are build/test configuration derived from repository files, not untrusted runtime data.
  - None of this code is part of the shipped application bundle.
  - The advisory is low severity (integrity-only impact).
- **Revisit when:** a `deepmerge` release fixes the prototype-poisoning behavior; npm's suggested "fixes" are downgrades of `@docusaurus/preset-classic` / `jest-preset-angular`, not security fixes, and are not used. The current `npm audit` run does not surface this advisory.

### quill 2.0.3 — XSS via the HTML export feature (low)

- **Advisory:** [GHSA-v3m3-f69x-jf25](https://github.com/advisories/GHSA-v3m3-f69x-jf25) / CVE-2025-15056 (CVSS 6.1, npm severity low). Affects exactly `2.0.3` — which is both the newest published release and the version pinned here — **no patched version exists**.
- **Where it is used:** the front-end rich-text editor (`ngx-quill@31` with `quill-resize-module`). `ngx-quill@31` requires `quill ^2.0.3`, so the only version-based "fix" would be a downgrade.
- **Why this is accepted:**
  - The flaw is in quill's client-side HTML export path. Content reaching the server is sanitized by `sanitize-html` via class-transformer `@Transform` handlers in every user-content DTO (cards, sets, folders, Quizlet/file imports), so stored XSS is not reachable through the editor.
- **Revisit when:** a quill release > 2.0.3 ships. This is the only finding the current `npm audit` run reports.

## Dependency overrides

`package.json` cannot contain comments, so the intent of each override is documented here. An override forces a dependency version across the whole tree, even where it conflicts with a parent package's declared range. Overrides can also be scoped to a single parent (`"parent": { "dependency": "spec" }`).

`joi` is a direct dependency of the root; its direct spec is kept equal to the global override, because npm rejects an override that conflicts with a direct dependency (`EOVERRIDE`).

**Do not remove an override without re-running `npm audit`.** Most exist specifically to keep vulnerable transitive versions out of the lockfile; each can be dropped only once the parent package's own dependency range resolves to a patched version. Several overrides below are no longer required for security because their parents now resolve to patched releases, but they are retained because removing them would silently *downgrade* a package (which is not done, even when it is technically safe).

### Security-driven pins

| Override | Reason |
| --- | --- |
| `@prisma/config → effect: 3.22.5` | Clears [GHSA-7589-6fvf-x4pw](https://github.com/advisories/GHSA-7589-6fvf-x4pw) (high, ReDoS in `Schema.TemplateLiteral` compiled regex) affecting `<= 3.22.0`. `@prisma/config@7.10.1` pins `effect 3.20.0` exactly; `3.22.5` is the newest patched 3.x release. Verified by `npm run generate`. |
| `fast-xml-parser: ^5.12.1` | Clears [GHSA-474x-hrwr-fgx4](https://github.com/advisories/GHSA-474x-hrwr-fgx4) (low, quadratic CPU use scanning unterminated stop-node tags) affecting `<= 5.11.2`. Reached via `redoc@2.4.0` → `openapi-sampler@1.7.5` (declares `^5.5.1`), used by the docs build. 5.12.1 is the patched release; its transitive peers (`fast-xml-builder`, `strnum`, `is-unsafe`, `@nodable/entities`) are updated with it and were verified. |
| `prisma → mysql2: ^3.24.2` | Originally cleared [GHSA-3f6p-5ww8-9rcr](https://github.com/advisories/GHSA-3f6p-5ww8-9rcr) and [GHSA-rgwj-5xj2-c3m3](https://github.com/advisories/GHSA-rgwj-5xj2-c3m3) (both high) affecting `<= 3.23.0`. `prisma@7.10.1` now pins the patched `mysql2 3.24.4` itself, so this is **no longer security-required**; it is retained to keep the tree on the newest `3.24.x` patch (`3.24.6`) rather than dropping to prisma's exact `3.24.4`. |
| `argparse: ^2.0.1` | Clears the `sprintf-js` chain: [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c) (moderate, DoS via unbounded precision specifiers, `<= 1.1.3`) reached via `argparse@1.0.10` → `js-yaml@3` → `@istanbuljs/load-nyc-config` → `babel-plugin-istanbul` → Jest, and the `@nx/*` packages. `argparse@2` has no `sprintf-js` dependency. Removing this override reintroduces nested `argparse@1.0.10` copies. |
| `body-parser: ^2.4.0` | Clears [GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828) (high, DoS via trailing bytes after a compressed request body), affecting `< 1.20.9` and `>= 2.0.0 < 2.4.0`. Remaining `webpack-dev-server` nested `express@4` only accepts `~1.20.5`; without the override it installs a nested `body-parser@1.20.9`. Both are patched now, so this is no longer strictly security-required, but removing it introduces a downgraded duplicate copy, so it is retained. |
| `fast-uri: ^4.2.3` | Clears four advisories affecting `3.0.0–3.1.8`: [GHSA-w74x-v6f9-j3xg](https://github.com/advisories/GHSA-w74x-v6f9-j3xg) and [GHSA-wjr9-j795-jxcr](https://github.com/advisories/GHSA-wjr9-j795-jxcr) (moderate), [GHSA-xhq7-xmqj-769h](https://github.com/advisories/GHSA-xhq7-xmqj-769h) and [GHSA-333x-w4r6-6crp](https://github.com/advisories/GHSA-333x-w4r6-6crp) (low). `ajv` / `@redocly/ajv` declare `^3.0.1`. Without the override they resolve to the patched `3.1.9`, so it is no longer security-required, but removing it downgrades `fast-uri` from 4.x to 3.x, so it is retained. |
| `glob: ^14.0.3` | Clears [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) (moderate, `AbortSignal` cancellation bypass / post-timeout filesystem traversal) affecting `9.0.0–14.0.1`, plus the `minimatch` chain. Reached via `test-exclude`, `@jest/reporters`, `jest-config`, `jest-runtime`, `@nestjs-modules/mailer`, and `@ngx-env/builder`, whose ranges still resolve to vulnerable 11.x/13.x releases without the override. Verified by `npm run build` and `npm run test`. |
| `joi: ^18.3.1` | Clears [GHSA-4528-x5fx-h6hg](https://github.com/advisories/GHSA-4528-x5fx-h6hg) (high, quadratic-time `string().email({ multiple: true })` DoS) affecting `17.1.1–17.13.8` and `18.0.0–18.3.0`. The direct `joi` spec is `^18.3.1`. `@docusaurus/types` / `@docusaurus/utils-validation` now declare `^17.9.2` and resolve to the patched `17.13.9` on their own, so this is no longer security-required, but removing it downgrades those consumers to a nested 17.x copy, so it is retained. Verified by the docs build. |
| `minimatch: ^11.0.3` | Clears [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) (moderate, globparts-amplification DoS) affecting `< 11.0.1`. Removing it reintroduces vulnerable `3.1.5`, `5.1.9`, `9.x`, and `10.2.x` copies across Jest, `@nx/*`, `eslint`, `@redocly`, and `serve-handler`. Compatibility note: minimatch 11 exposes its ESM entry with named exports only, while `@eslint/eslintrc`'s ESM entry does `import minimatch from "minimatch"`. `eslint.config.mjs` therefore loads `@eslint/eslintrc` through `createRequire` (its CommonJS entry), which keeps `FlatCompat` working with minimatch 11. Verified by build, lint tooling, and tests. |
| `postcss-selector-parser: ^7.1.6` | Clears [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) (moderate, quadratic-complexity flat selector parsing) affecting `< 7.1.6`. Reached via the `cssnano@6.1.2` chain under `@docusaurus/bundler` and `@nx/webpack`. Removing it introduces downgraded nested `6.1.6` copies, so it is retained. Verified by the docs production build. |
| `qs: ^6.17.1` | Clears [GHSA-6pq8-jhm2-2vcw](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw) (moderate, `qs.stringify` with `arrayFormat: 'comma'` and a non-callable `toString` → uncaught TypeError / DoS) affecting `6.7.0–6.16.0`. Reached via `body-parser`, `express`, `union`, and `@cypress/request`. Without the override, `webpack-dev-server`'s nested `express` resolves `qs 6.16.2` (patched), so this is no longer security-required, but removing it downgrades that nested copy, so it is retained. |
| `serialize-javascript: ^7.1.4` | Clears [GHSA-m5mm-p8h7-m29v](https://github.com/advisories/GHSA-m5mm-p8h7-m29v) (low, XSS via unescaped `</script>` at the end of a serialized function body) affecting `< 7.1.3`, and keeps the two earlier high advisories cleared ([GHSA-5c6j-r48x-rmvq](https://github.com/advisories/GHSA-5c6j-r48x-rmvq), [GHSA-qj8w-gfj5-8c6v](https://github.com/advisories/GHSA-qj8w-gfj5-8c6v)). Reached via Docusaurus `copy-webpack-plugin@11` / `css-minimizer-webpack-plugin@5` and `@nx/webpack`, which still resolve to `6.0.2` without the override. |
| `tinypool: ^2.1.2` | Clears [GHSA-5gmw-xhrv-c9v3](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3) (critical, prototype-pollution gadget in worker options → RCE, `<= 2.1.0`) and [GHSA-85c8-ppgw-ccpr](https://github.com/advisories/GHSA-85c8-ppgw-ccpr) (critical, prototype-pollution gadget in `run()` options → RCE, `< 2.1.2`). Fixed in 2.1.2; the tree resolves 2.2.0. `@docusaurus/core@3.10.2` pins `tinypool ^1.0.2`, but Docusaurus loads tinypool through a dynamic `import()`, so the ESM-only v2 works; without the override it downgrades to `tinypool@1.1.1` (vulnerable). Verified by the docs SSG build. |
| `uuid: ^11.1.1` | Clears [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) (moderate, `<= 11.1.1`), reached via `sockjs` → `webpack-dev-server`. `sockjs` still declares `uuid ^8.3.2`, whose line has no fix; without the override it downgrades to `uuid@8.3.2` (vulnerable). |

### Compatibility-driven overrides

These reconcile peer-dependency ranges of third-party packages that have not caught up with the NestJS 12 / Angular 22 versions used here. Removing any of them makes `npm install` fail to resolve (or silently installs duplicate older NestJS/Angular copies), not because of a vulnerability.

| Override | Reason |
| --- | --- |
| `@nx/nest → @nestjs/common`/`@nestjs/core >=10.0.0 <13.0.0` | `@nx/nest@24.0.6` still declares peers `>=10.0.0 <12.0.0`; widened to accept NestJS 12. Remove when `@nx/nest` accepts NestJS 12. |
| `ng-recaptcha → @angular/core $@angular/core` | `ng-recaptcha@13.2.1` declares only `^17.0.0`; `$@angular/core` references the root's Angular version. Remove when ng-recaptcha supports Angular 22. |

### Overrides removed in this update

These overrides were dropped because the parent package now resolves to a patched version on its own **and** removing the override caused no version change (no downgrade). Verified with `npm audit`.

| Removed override | Why it was safe to drop |
| --- | --- |
| `@prisma/config → deepmerge-ts: 8.0.2` | `@prisma/config@7.10.1` now pins the patched `deepmerge-ts 8.0.2` itself. |
| `@prisma/adapter-mariadb → mariadb: 3.5.4` | `@prisma/adapter-mariadb@7.10.1` now pins the patched `mariadb 3.5.4` itself. |
| `axios: ^1.21.0` | Root `axios` remains a direct devDependency `^1.21.0`, and `@nestjs/axios` declares `^1.3.1`; both resolve to the patched `1.21.0` without the override. |
| `dompurify: ^3.4.17` | `redoc` declares `^3.0.6` and resolves to the patched `3.4.17` on its own. |
| `follow-redirects: ^1.16.2` | `axios` (`^1.16.0`) and `http-proxy` (`^1.0.0`) resolve to the patched `1.16.2` on their own. |
| `systeminformation: ^5.33.19` | `cypress` declares `^5.33.16` and resolves to the patched `5.33.19` on its own. |
| `vite: ^8.3.5` | `@angular/build@22.2.7` pins `vite 8.3.5` exactly, which is patched. |

Note: the `effect` and `fast-xml-parser` findings were not previously overridden. They are now covered by the two new security pins above, and the resulting `npm audit` run reports only the accepted `quill` advisory.
