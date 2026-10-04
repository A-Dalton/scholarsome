## Reporting a vulnerability

Reach out to the <a href="https://github.com/A-Dalton">project lead</a> directly when reporting a vulnerability. __Do not__ use public facing areas, such as GitHub issues, to report security vunerabilities.

Additionally, you can email support@scholarsome.com to report security issues.

A public security advisory will be created once a patch for the issue is available.

## Dependency security

Dependencies are tracked with `npm audit` and Dependabot (`.github/dependabot.yml`). Run `npm audit` after changing dependencies; the goal is to keep the report free of findings other than the accepted one below.

## Accepted vulnerabilities

### braces ≤ 3.0.3 — stack-exhaustion DoS via deeply nested glob patterns (high)

- **Advisory:** [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) / CVE-2026-93687 (CVSS 8.7). Affects every published braces version — `3.0.3` is both the newest release and the version the tree resolves to — **no patched version exists**. The recursive AST walkers lack depth guards, so a deeply nested `{a,b{c,d},…}` pattern can exhaust the call stack and crash the Node process with an uncaught `RangeError`. npm's proposed "fixes" (downgrading `redocusaurus` or `@nx/*`) are not security fixes and are not used here.
- **Where it is used:** `braces` is the glob-expansion primitive underneath `micromatch`, which large parts of the build tooling depend on. Every remaining `npm audit` finding traces to this single advisory. The chain runs through `micromatch` (→ `fast-glob` → `globby` → `copy-webpack-plugin`), `chokidar@3` and `http-proxy-middleware → webpack-dev-server`, and reaches every `@docusaurus/*` package, `@nx/angular` / `@nx/web` / `@nx/webpack`, and the `redocusaurus` packages that way. `nx` itself and the other `@nx/*` packages are kept out of the report by the `axios` / `brace-expansion` overrides below.
- **Why this is accepted:**
  - The vulnerable code runs while expanding glob patterns during builds and dev tooling. Glob patterns originate from repository configuration (nx / docusaurus / webpack configs, CLI flags), never from untrusted input.
  - The chain is not part of the shipped application: the production API bundle contains no `micromatch` / `braces` code, and the front-end and docs bundles match only on unrelated strings (the app's embedded `package.json`, Prism plugin names).
  - The residual exposure is therefore a developer running a build whose inputs contain a pathological glob — an availability nuisance on a developer machine, not an attack surface of the deployed app.
- **Revisit when:** a braces release with depth guards ships (Dependabot / `npm audit` will surface it). Upstream tracking: [micromatch/braces#70](https://github.com/micromatch/braces/issues/70). Until then there is no version to upgrade to, so the finding stays.

## Dependency overrides

`package.json` cannot contain comments, so the intent of each override in `package.json` is documented here. An override forces a dependency version across the whole tree, even where it conflicts with a parent package's declared range. Overrides can also be scoped to a single parent (`"parent": { "dependency": "spec" }`), which applies the spec only where that parent is the dependent — used for the `nx → brace-expansion` pin below.

`axios` and `nodemailer` are also direct dependencies of the root; their direct specs must stay in sync with the override, because npm rejects an override that conflicts with a direct dependency (`EOVERRIDE`).

**Do not remove an override without re-running `npm audit`.** Most exist specifically to keep vulnerable transitive versions out of the lockfile; each can be dropped only once the parent package's own dependency range no longer resolves to a vulnerable version.

### Security-driven pins

| Override | Reason |
| --- | --- |
| `axios: ^1.20.0` | Clears twelve advisories affecting ≤ 1.19.0. Five moderate: [GHSA-vh66-26gq-q6x8](https://github.com/advisories/GHSA-vh66-26gq-q6x8), [GHSA-9fr6-4gfg-395g](https://github.com/advisories/GHSA-9fr6-4gfg-395g), [GHSA-j8rh-479h-cp32](https://github.com/advisories/GHSA-j8rh-479h-cp32), [GHSA-4hqw-qxg8-jxx2](https://github.com/advisories/GHSA-4hqw-qxg8-jxx2), [GHSA-44g4-m2mj-wpvx](https://github.com/advisories/GHSA-44g4-m2mj-wpvx) (prototype-pollution gadgets, header injection, NO_PROXY bypass). Seven high: [GHSA-c29m-xwm3-cm6r](https://github.com/advisories/GHSA-c29m-xwm3-cm6r), [GHSA-mghh-pgcx-3jjj](https://github.com/advisories/GHSA-mghh-pgcx-3jjj), [GHSA-x97p-jq2g-jp4f](https://github.com/advisories/GHSA-x97p-jq2g-jp4f), [GHSA-m8m8-qj5v-23w3](https://github.com/advisories/GHSA-m8m8-qj5v-23w3), [GHSA-3pq3-5fj3-cg6v](https://github.com/advisories/GHSA-3pq3-5fj3-cg6v), [GHSA-542g-h47m-68v8](https://github.com/advisories/GHSA-542g-h47m-68v8), [GHSA-r4gj-5m52-g5wh](https://github.com/advisories/GHSA-r4gj-5m52-g5wh) (ReDoS, socket hijack, redirect-based SSRF, HTTP/2 DNS/proxy bypass and DoS). `nx@23.2.1` pins `axios 1.18.1` exactly; every other consumer accepts `^1.x`. Remove when nx resolves an axios ≥ 1.20.0 on its own. |
| `nodemailer: ^10.0.14` | Clears [GHSA-6vj9-mwq6-2f5v](https://github.com/advisories/GHSA-6vj9-mwq6-2f5v) (moderate, cross-tenant TLS credential disclosure via the process-global DNS cache), [GHSA-8vvx-rff5-p5rq](https://github.com/advisories/GHSA-8vvx-rff5-p5rq) (moderate, stack-exhaustion DoS via nested recipient arrays), [GHSA-g57g-f23g-4646](https://github.com/advisories/GHSA-g57g-f23g-4646) (moderate, malformed envelope recipient via quoted local-part), [GHSA-v53p-9fqp-m79j](https://github.com/advisories/GHSA-v53p-9fqp-m79j) (high, quadratic backtracking DoS) and [GHSA-prgh-xp8r-p3m5](https://github.com/advisories/GHSA-prgh-xp8r-p3m5) (high, O(n²) DoS in `addressparser`, also reachable via mailparser), affecting ≤ 10.0.8. `preview-email@3.4.0` — an optional peer of `@nestjs-modules/mailer` — pins `nodemailer ^9.0.6`, which resolves 9.1.1. Remove when `preview-email` resolves a nodemailer ≥ 10.0.9 on its own. |
| `nx → brace-expansion: ^5.0.12` | Clears [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) (moderate, quadratic-time expansion DoS) plus [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7) and [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) (high, stack-exhaustion DoS), affecting ≤ 1.1.20, 2.0.0 – 2.1.6 and 4.0.0 – 5.0.11; fixed in 1.1.21 / 2.1.7 / 5.0.12. `nx@23.2.1` pins `brace-expansion 5.0.9` exactly. The override is deliberately **scoped to `nx`**: the `minimatch@3` and `minimatch@9` copies elsewhere in the tree require the `^1.1.x` / `^2.1.x` majors and a global `^5` pin would break them — those copies are kept patched by a plain `npm update`. Remove when nx resolves ≥ 5.0.12 on its own. |
| `serialize-javascript: ^7.1.2` | Clears [GHSA-gfhx-hw2g-v5hg](https://github.com/advisories/GHSA-gfhx-hw2g-v5hg) (low, XSS via unescaped `</script>` in serialized function bodies), affecting ≤ 7.0.4 and 7.1.1 (7.1.1 shipped the issue again; fixed in 7.0.5 / 7.1.2). Docusaurus's `copy-webpack-plugin@11` / `css-minimizer-webpack-plugin@5` still declare `^6`. Remove when `@docusaurus/core` resolves ≥ 7.0.5 on its own. |
| `qs: ^6.16.0` | Clears [GHSA-q8mj-m7cp-5q26](https://github.com/advisories/GHSA-q8mj-m7cp-5q26), [GHSA-x5fp-wj9c-mxmx](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx) and [GHSA-4mjr-xmp4-gh2g](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g) (moderate, DoS, ≤ 6.15.3), reached via `webpack-dev-server` → `express@4` → `body-parser@1.20.6`. Remove when that chain resolves ≥ 6.16.0 on its own. |
| `uuid: ^11.1.1` | Clears [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) (moderate, < 11.1.1), reached via `sockjs` → `webpack-dev-server`. `sockjs` still declares `uuid ^8.3.2` and the 8.x line has no fix. Remove when that chain resolves a patched uuid on its own. |
| `smol-toml: ^1.7.1` | Clears [GHSA-7w5x-hrqm-74c2](https://github.com/advisories/GHSA-7w5x-hrqm-74c2) (high, DoS via malformed TOML documents, ≤ 1.7.0). `nx@23.2.x` pins `smol-toml 1.6.1` exactly. Remove when nx pins a ≥ 1.7.1 smol-toml itself. |
| `prisma → mysql2: ^3.24.2` | Clears [GHSA-3f6p-5ww8-9rcr](https://github.com/advisories/GHSA-3f6p-5ww8-9rcr) (high, auth plugin downgrade leaks plaintext credentials) and [GHSA-rgwj-5xj2-c3m3](https://github.com/advisories/GHSA-rgwj-5xj2-c3m3) (high, decompression-bomb DoS), affecting ≤ 3.23.0. `prisma@7` pins `mysql2 3.15.3` exactly. Remove when prisma pins a patched mysql2 itself. |
| `@prisma/adapter-mariadb → mariadb: 3.5.4` | Clears [GHSA-cqhc-2h57-wpxf](https://github.com/advisories/GHSA-cqhc-2h57-wpxf), [GHSA-42r5-vhpq-m858](https://github.com/advisories/GHSA-42r5-vhpq-m858) and [GHSA-g5xc-5w98-jfvm](https://github.com/advisories/GHSA-g5xc-5w98-jfvm) (all high, affecting 3.4.0 – 3.4.5; the 3.5.x line is the fix). `@prisma/adapter-mariadb@7` pins `mariadb 3.4.5` exactly. Remove when the adapter pins a patched mariadb itself. |
| `@prisma/config → deepmerge-ts: 8.0.2` | Clears [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx) (high, stack exhaustion, < 8.0.0). `@prisma/config@7` pins `deepmerge-ts 7.1.5` exactly. Remove when `@prisma/config` resolves ≥ 8.0.0 on its own. |

### Compatibility-driven overrides

These reconcile peer-dependency ranges of third-party packages that have not caught up with the NestJS 12 / Angular 22 versions used here. Removing any of them makes `npm install` fail to resolve (or silently installs duplicate older NestJS/Angular copies), not because of a vulnerability.

| Override | Reason |
| --- | --- |
| `@nx/nest → @nestjs/common`/`@nestjs/core >=10.0.0 <13.0.0` | `@nx/nest@23.2.1` (latest) declares peers `>=10.0.0 <12.0.0`; widened to accept NestJS 12. Remove when `@nx/nest` accepts NestJS 12. |
| `ng-recaptcha → @angular/core $@angular/core` | `ng-recaptcha@13.2.1` (latest) declares only `^17.0.0`; `$@angular/core` references the root's Angular version. Remove when ng-recaptcha supports Angular 22. |
