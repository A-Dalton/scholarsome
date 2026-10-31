## Reporting a vulnerability

Reach out to the <a href="https://github.com/A-Dalton">project lead</a> directly when reporting a vulnerability. __Do not__ use public facing areas, such as GitHub issues, to report security vulnerabilities.

Additionally, you can email support@scholarsome.com to report security issues.

A public security advisory will be created once a patch for the issue is available.

## Dependency security

Dependencies are tracked with `npm audit` and Dependabot (`.github/dependabot.yml`). Run `npm audit` after changing dependencies; the goal is to keep the report free of findings other than the accepted ones below.

After the dependency update described here, `npm audit` reports **20 low findings, no moderate, high, or critical findings**. Every one of the 20 low findings is inherited from one of the two accepted advisories below (`deepmerge` and `quill`). The known `braces` advisory is still accepted, but the current `npm audit` run does not surface it in this tree.

## Accepted vulnerabilities

### braces 3.0.3 — stack-exhaustion DoS via deeply nested glob patterns (high)

- **Advisory:** [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) / CVE-2026-93687 (CVSS 8.7). Affects every published braces version — `3.0.3` is both the newest release and the version installed here — **no patched version exists**. The AST walkers lack depth guards, so a deeply nested `{a,b{c,d},…}` pattern can exhaust the call stack and crash the Node process with an uncaught `RangeError`.
- **Where it is used:** `braces` is the glob-expansion primitive underneath `micromatch`, used by build/dev tooling such as `fast-glob`, `globby`, `copy-webpack-plugin`, `chokidar`, `webpack-dev-server`, `@docusaurus/*`, `redocusaurus`, and `@nx/angular` / `@nx/web` / `@nx/webpack`.
- **Why this is accepted:**
  - Glob patterns come from repository configuration and CLI flags, never from untrusted runtime input.
  - The production API bundle does not contain `micromatch` / `braces`; the front-end and docs bundles only contain unrelated strings.
  - The exposure is a build-time availability nuisance on a developer machine, not an attack surface of the deployed application.
- **Revisit when:** a braces release with depth guards ships. Upstream tracking: [micromatch/braces#70](https://github.com/micromatch/braces/issues/70). The current `npm audit` report does not include this advisory, so it contributes no finding here; if Dependabot or `npm audit` surfaces it later, it remains accepted for the reasons above.

### deepmerge 4.3.1 — prototype poisoning of returned objects (low)

- **Advisory:** [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) (CVSS 5.3, npm severity low). Affects `deepmerge` `>= 4.2.0 <= 4.3.1`; `4.3.1` is the latest release, so **no patched version exists**.
- **Where it is used:** `jest-config` (and therefore `jest` / `@jest/*` / `ts-jest` / `jest-preset-angular` / `@nx/jest`), `fork-ts-checker-webpack-plugin` (and therefore `@nx/webpack`), and `@svgr/plugin-svgo` (and therefore `@svgr/webpack` / `@docusaurus/plugin-svgr` / `@docusaurus/preset-classic`). This is the source of the Jest, Nx, and SVGR low findings in the current report.
- **Why this is accepted:**
  - The merge inputs are build/test configuration derived from repository files, not untrusted runtime data.
  - None of this code is part of the shipped application bundle.
  - The advisory is low severity (integrity-only impact).
- **Revisit when:** a `deepmerge` release fixes the prototype-poisoning behavior; npm's suggested "fixes" are downgrades of `@docusaurus/preset-classic` / `jest-preset-angular`, not security fixes, and are not used.

### quill 2.0.3 — XSS via the HTML export feature (low)

- **Advisory:** [GHSA-v3m3-f69x-jf25](https://github.com/advisories/GHSA-v3m3-f69x-jf25) / CVE-2025-15056 (CVSS 6.1, npm severity low). Affects exactly `2.0.3` — which is both the newest published release and the version pinned here — **no patched version exists**.
- **Where it is used:** the front-end rich-text editor (`ngx-quill@31` with `quill-resize-module`). `ngx-quill@31` requires `quill ^2.0.3`, so the only version-based "fix" would be a downgrade.
- **Why this is accepted:**
  - The flaw is in quill's client-side HTML export path. Content reaching the server is sanitized by `sanitize-html` via class-transformer `@Transform` handlers in every user-content DTO (cards, sets, folders, Quizlet/file imports), so stored XSS is not reachable through the editor.
- **Revisit when:** a quill release > 2.0.3 ships.

## Dependency overrides

`package.json` cannot contain comments, so the intent of each override is documented here. An override forces a dependency version across the whole tree, even where it conflicts with a parent package's declared range. Overrides can also be scoped to a single parent (`"parent": { "dependency": "spec" }`).

`axios` and `joi` are direct dependencies of the root; their direct specs were updated to match the global overrides, because npm rejects an override that conflicts with a direct dependency (`EOVERRIDE`).

**Do not remove an override without re-running `npm audit`.** Most exist specifically to keep vulnerable transitive versions out of the lockfile; each can be dropped only once the parent package's own dependency range no longer resolves to a vulnerable version.

### Security-driven pins

| Override | Reason |
| --- | --- |
| `axios: ^1.21.0` | Clears twelve advisories affecting ≤ 1.19.0: five moderate ([GHSA-vh66-26gq-q6x8](https://github.com/advisories/GHSA-vh66-26gq-q6x8), [GHSA-9fr6-4gfg-395g](https://github.com/advisories/GHSA-9fr6-4gfg-395g), [GHSA-j8rh-479h-cp32](https://github.com/advisories/GHSA-j8rh-479h-cp32), [GHSA-4hqw-qxg8-jxx2](https://github.com/advisories/GHSA-4hqw-qxg8-jxx2), [GHSA-44g4-m2mj-wpvx](https://github.com/advisories/GHSA-44g4-m2mj-wpvx)) and seven high ([GHSA-c29m-xwm3-cm6r](https://github.com/advisories/GHSA-c29m-xwm3-cm6r), [GHSA-mghh-pgcx-3jjj](https://github.com/advisories/GHSA-mghh-pgcx-3jjj), [GHSA-x97p-jq2g-jp4f](https://github.com/advisories/GHSA-x97p-jq2g-jp4f), [GHSA-m8m8-qj5v-23w3](https://github.com/advisories/GHSA-m8m8-qj5v-23w3), [GHSA-3pq3-5fj3-cg6v](https://github.com/advisories/GHSA-3pq3-5fj3-cg6v), [GHSA-542g-h47m-68v8](https://github.com/advisories/GHSA-542g-h47m-68v8), [GHSA-r4gj-5m52-g5wh](https://github.com/advisories/GHSA-r4gj-5m52-g5wh)). The direct `axios` spec is `^1.21.0` to stay in sync. `nx@24.0.3` no longer depends on axios, so the override is now mainly a pin for the remaining axios consumers. |
| `body-parser: ^2.4.0` | Clears [GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828) (high, DoS via trailing bytes after a compressed request body), affecting `< 1.20.9` and `>= 2.0.0 < 2.4.0`. The two affected copies were root `body-parser@2.3.0` (via `express@5`) and `webpack-dev-server/node_modules/body-parser@1.20.6` (via its nested `express@4`). Both are forced to 2.4.0; the larger body-parser API used by Express 4/5 is unchanged. |
| `dompurify: ^3.4.17` | Clears three advisories affecting ≤ 3.4.16: [GHSA-cg2g-xh64-v4q7](https://github.com/advisories/GHSA-cg2g-xh64-v4q7) (critical, `SAFE_FOR_TEMPLATES` bypass / shadow-root template expressions), [GHSA-mrv2-3pqr-j5jr](https://github.com/advisories/GHSA-mrv2-3pqr-j5jr) (high, IN_PLACE hook leaves detached event handlers armed), and [GHSA-c6gr-qvv4-5v3f](https://github.com/advisories/GHSA-c6gr-qvv4-5v3f) (low, SMIL `attributeName=href` guard skipped for XHTML parser mode). Reached via `redoc` → `dompurify@3.4.16`. 3.4.17 is the patched release. |
| `fast-uri: ^4.2.3` | Clears four advisories affecting 3.0.0–3.1.8: [GHSA-w74x-v6f9-j3xg](https://github.com/advisories/GHSA-w74x-v6f9-j3xg) (moderate, URI scheme spoofing), [GHSA-xhq7-xmqj-769h](https://github.com/advisories/GHSA-xhq7-xmqj-769h) (low, path-equivalence normalization), [GHSA-wjr9-j795-jxcr](https://github.com/advisories/GHSA-wjr9-j795-jxcr) (moderate, WHATWG host confusion), and [GHSA-333x-w4r6-6crp](https://github.com/advisories/GHSA-333x-w4r6-6crp) (low, scheme injection). `fast-uri` is used by `ajv` and `@redocly/ajv`; the 4.x release is still CommonJS and the URI-normalization API used by Ajv is unchanged. Verified by the API/docs builds. |
| `follow-redirects: ^1.16.2` | Clears three high advisories affecting 1.16.0–1.16.1: [GHSA-q3jh-wrc6-jgq8](https://github.com/advisories/GHSA-q3jh-wrc6-jgq8), [GHSA-8r9p-f939-6h3c](https://github.com/advisories/GHSA-8r9p-f939-6h3c), and [GHSA-mrwp-f3q8-3g9p](https://github.com/advisories/GHSA-mrwp-f3q8-3g9p) (credential-header bypass / redirect credential leakage). Reached via direct `axios`, `http-proxy`, and (before the nx bump) `nx@23.2.1`. 1.16.2 is the patched release. |
| `glob: ^14.0.3` | Clears [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) (moderate, `AbortSignal` cancellation bypass / post-timeout filesystem traversal) affecting `9.0.0–14.0.1`, plus the `minimatch` chain. Reached via `test-exclude`, `@jest/reporters`, `jest-config`, `jest-runtime`, `@nestjs-modules/mailer`, and `@ngx-env/builder`. Glob 14.0.3 is patched and remains compatible with the callback/sync APIs used by these consumers; verified by `npm run build` and `npm run test`. |
| `joi: ^18.3.1` | Clears [GHSA-4528-x5fx-h6hg](https://github.com/advisories/GHSA-4528-x5fx-h6hg) (high, quadratic-time `string().email({ multiple: true })` DoS) affecting `17.1.1–17.13.8` and `18.0.0–18.3.0`. The direct `joi` spec is `^18.3.1`; the global override also upgrades the nested `joi@17.13.8` copies in `@docusaurus/types` and `@docusaurus/utils-validation`. Verified by the docs build. |
| `minimatch: ^11.0.3` | Clears [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) (moderate, globparts-amplification DoS) affecting `< 11.0.1`. This global override replaces all older copies (3.1.5, 5.1.9, 9.0.9, 10.2.5/10.2.6) and also supplies `brace-expansion ^5.0.12` through minimatch 11, so the former `nx → brace-expansion` pin is no longer needed. Compatibility note: minimatch 11 exposes its ESM entry with named exports only, while `@eslint/eslintrc`'s ESM entry does `import minimatch from "minimatch"`. `eslint.config.mjs` therefore loads `@eslint/eslintrc` through `createRequire` (its CommonJS entry), which keeps `FlatCompat` working with minimatch 11. Verified by build, lint tooling, and tests. |
| `qs: ^6.17.1` | Clears [GHSA-6pq8-jhm2-2vcw](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw) (moderate, `qs.stringify` with `arrayFormat: 'comma'` and a non-callable `toString` → uncaught TypeError / DoS) affecting `6.7.0–6.16.0`. The previous `^6.16.0` pin did not include 6.16.0 itself, so the floor was raised to 6.17.1. Reached via `body-parser`, `express`, `union`, and `@cypress/request`. |
| `serialize-javascript: ^7.1.4` | Clears [GHSA-m5mm-p8h7-m29v](https://github.com/advisories/GHSA-m5mm-p8h7-m29v) (low, XSS via unescaped `</script>` at the end of a serialized function body) affecting `< 7.1.3`. It also keeps the two earlier high advisories cleared ([GHSA-5c6j-r48x-rmvq](https://github.com/advisories/GHSA-5c6j-r48x-rmvq), [GHSA-qj8w-gfj5-8c6v](https://github.com/advisories/GHSA-qj8w-gfj5-8c6v)). Reached via Docusaurus `copy-webpack-plugin@11` / `css-minimizer-webpack-plugin@5` and `@nx/webpack`. |
| `systeminformation: ^5.33.19` | Clears three advisories affecting `< 5.33.16`: [GHSA-4vjg-vx72-qq4g](https://github.com/advisories/GHSA-4vjg-vx72-qq4g) (low, symlink path traversal in Linux `networkStats()`), [GHSA-7648-jmwf-vw7j](https://github.com/advisories/GHSA-7648-jmwf-vw7j) (moderate, prototype pollution via interface name), and [GHSA-3f7j-7jwc-fxfj](https://github.com/advisories/GHSA-3f7j-7jwc-fxfj) (high, Windows command injection in `services()`). Reached via `cypress`. 5.33.19 is the patched release. |
| `vite: ^8.3.5` | Clears six `launch-editor` / Vite advisories affecting `8.3.0–8.3.2`: [GHSA-698v-4r3x-3vcv](https://github.com/advisories/GHSA-698v-4r3x-3vcv) and [GHSA-r825-w8mm-5pxw](https://github.com/advisories/GHSA-r825-w8mm-5pxw) (moderate), [GHSA-587h-7wmj-h5pm](https://github.com/advisories/GHSA-587h-7wmj-h5pm) (high), [GHSA-9jrq-w75r-8gcw](https://github.com/advisories/GHSA-9jrq-w75r-8gcw) (low), and [GHSA-rq7h-c2jc-7f22](https://github.com/advisories/GHSA-rq7h-c2jc-7f22) / [GHSA-vfpm-58rq-9qcg](https://github.com/advisories/GHSA-vfpm-58rq-9qcg) (moderate). Reached via `@angular/build`; `@angular/build` was also updated to `^22.2.5`, which pins `vite 8.3.5`. |
| `argparse: ^2.0.1` | Clears the `sprintf-js` chain: [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c) (moderate, DoS via unbounded precision specifiers, ≤ 1.1.3) via `argparse@1.0.10` → `js-yaml@3.15.2` → `@istanbuljs/load-nyc-config@1.1.0` → `babel-plugin-istanbul` → `@jest/transform` → `ts-jest` / `jest` / `jest-preset-angular`, and the `@nx/cypress` / `@nx/eslint` / `@nx/jest` / `@nx/nest` / `@nx/node` packages. `argparse@2` has no `sprintf-js` dependency; js-yaml@3 only uses argparse in its CLI binary, so the library API is unaffected. |
| `postcss-selector-parser: ^7.1.6` | Clears [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) (moderate, quadratic-complexity flat selector parsing) affecting `< 7.1.6`. Reached via the `cssnano@6.1.2` chain under `@docusaurus/bundler`. 7.1.6 is CJS and the plugin API surface used by `cssnano` is unchanged; verified by the docs production build. |
| `tinypool: ^2.1.2` | Clears [GHSA-5gmw-xhrv-c9v3](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3) (critical, prototype-pollution gadget in worker options → RCE, ≤ 2.1.0) and [GHSA-85c8-ppgw-ccpr](https://github.com/advisories/GHSA-85c8-ppgw-ccpr) (critical, prototype-pollution gadget in `run()` options → RCE, < 2.1.2). Fixed in 2.1.2; the tree resolves 2.2.0. `@docusaurus/core@3.10.2` pins `tinypool ^1.0.2`, but Docusaurus loads tinypool through a dynamic `import()`, so the ESM-only v2 works; verified by the docs SSG build. |
| `uuid: ^11.1.1` | Clears [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) (moderate, < 11.1.1), reached via `sockjs` → `webpack-dev-server`. `sockjs` still declares `uuid ^8.3.2`, whose line has no fix. |
| `prisma → mysql2: ^3.24.2` | Clears [GHSA-3f6p-5ww8-9rcr](https://github.com/advisories/GHSA-3f6p-5ww8-9rcr) (high, auth-plugin downgrade leaking plaintext credentials) and [GHSA-rgwj-5xj2-c3m3](https://github.com/advisories/GHSA-rgwj-5xj2-c3m3) (high, decompression-bomb DoS), affecting ≤ 3.23.0. `prisma@7` pins `mysql2 3.15.3` exactly. Remove when prisma pins a patched mysql2 itself. |
| `@prisma/adapter-mariadb → mariadb: 3.5.4` | Clears seven high advisories affecting 3.3.0–3.5.3: [GHSA-cqhc-2h57-wpxf](https://github.com/advisories/GHSA-cqhc-2h57-wpxf), [GHSA-42r5-vhpq-m858](https://github.com/advisories/GHSA-42r5-vhpq-m858), [GHSA-g5xc-5w98-jfvm](https://github.com/advisories/GHSA-g5xc-5w98-jfvm), [GHSA-r3rv-jm3r-62q2](https://github.com/advisories/GHSA-r3rv-jm3r-62q2), [GHSA-v6pj-gxxw-phfw](https://github.com/advisories/GHSA-v6pj-gxxw-phfw), [GHSA-48qf-xh34-q73r](https://github.com/advisories/GHSA-48qf-xh34-q73r), and [GHSA-cx2f-j9fh-8g68](https://github.com/advisories/GHSA-cx2f-j9fh-8g68). `@prisma/adapter-mariadb@7` pins `mariadb 3.4.5` exactly. Remove when the adapter pins a patched mariadb itself. |
| `@prisma/config → deepmerge-ts: 8.0.2` | Clears [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx) (high, stack exhaustion, < 8.0.0). `@prisma/config@7` pins `deepmerge-ts 7.1.5` exactly. Remove when `@prisma/config` resolves ≥ 8.0.0 on its own. |

### Compatibility-driven overrides

These reconcile peer-dependency ranges of third-party packages that have not caught up with the NestJS 12 / Angular 22 versions used here. Removing any of them makes `npm install` fail to resolve (or silently installs duplicate older NestJS/Angular copies), not because of a vulnerability.

| Override | Reason |
| --- | --- |
| `@nx/nest → @nestjs/common`/`@nestjs/core >=10.0.0 <13.0.0` | `@nx/nest@24.0.3` still declares peers `>=10.0.0 <12.0.0`; widened to accept NestJS 12. Remove when `@nx/nest` accepts NestJS 12. |
| `ng-recaptcha → @angular/core $@angular/core` | `ng-recaptcha@13.2.1` declares only `^17.0.0`; `$@angular/core` references the root's Angular version. Remove when ng-recaptcha supports Angular 22. |
