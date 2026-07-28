# Blue Sky

A deliberately small Vite + React + TypeScript single-page app, pinned to **outdated dependency versions** so it can be used as a practice target for dependency scanning and remediation.

Everything is one page: it fetches users from `jsonplaceholder.typicode.com` with **axios**, formats dates with **moment**, and filters/sorts/groups with **lodash**.

## Setup

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc + vite build
npm audit        # see the findings
```

> `npm install` will print vulnerability warnings. That is the point — do **not** run `npm audit fix` until you want the exercise to be over.

## Pinned versions

| Package | Pinned | Latest-known-good target | Remediation effort |
| --- | --- | --- | --- |
| `axios` | 0.18.0 | `^1.x` | **Breaking** — 0.x → 1.x changes error shapes, `paramsSerializer`, and response typings |
| `moment` | 2.19.3 | `2.29.4`+ (or migrate to `dayjs`) | Patch bump is drop-in; migrating off moment is the real fix (it is legacy/EOL) |
| `lodash` | 4.17.4 | `4.17.21` | Drop-in patch bump, no API changes |
| `vite` | 5.0.0 | `^5.4.x` / `^7.x` | Dev-dependency only; 5.0 → 5.4 is drop-in |

The three runtime packages are the intended focus. `vite`/`esbuild` show up in `npm audit` as dev-only findings, which is useful for practising the "is this actually exploitable in production?" triage step.

## Known issue classes (confirm with `npm audit`)

Rather than trusting this table, run the scanner — advisory data moves. These are the classes you should expect to see:

- **axios 0.18.0** — SSRF via proxy/redirect handling, ReDoS in `trim`, request-size DoS, XSRF token leakage to third-party hosts.
- **moment 2.19.3** — ReDoS in RFC 2822 date parsing (CVE-2022-31129), path traversal in locale loading (CVE-2022-24785).
- **lodash 4.17.4** — prototype pollution in `merge`/`defaultsDeep`/`zipObjectDeep`, command injection in `_.template`, ReDoS in `toNumber`/`trim`.

## Where each package is used

| File | Package | Notes for remediation |
| --- | --- | --- |
| `src/api.ts` | `axios` | `axios.create` + `.get`. Uses `res.data as User[]` because 0.18 has no request-method generics — after upgrading to 1.x you can switch to `client.get<User[]>(...)`. |
| `src/App.tsx` | `moment` | `moment().subtract()`, `.format()`, `.fromNow()`, `.startOf()`. Formats come from `settings.view.dateFormat`. |
| `src/App.tsx` | `lodash` | `merge`, `orderBy`, `groupBy`, `filter`, `some`, `debounce`, `words`, `truncate`, `capitalize`, `size`. `merge` is the prototype-pollution sink — worth reviewing even after the version bump. |

Note that `_.merge` is used to build the settings object, so a scanner that flags reachable-sink usage (not just the manifest) should light up on `src/App.tsx`.

## Suggested exercise order

1. `npm audit` / your SCA tool of choice — record the baseline.
2. Bump `lodash` to `4.17.21`. Re-scan. Nothing should break.
3. Bump `moment` to `2.29.4`. Re-scan, check the date rendering still looks right.
4. Bump `axios` to `1.x`. This one needs a code change — `src/api.ts` and the `.catch` in `src/App.tsx`.
5. Bump `vite` and re-run `npm run build`.
6. Decide what to do about `moment` long-term (replace vs. keep).

## File layout

```
index.html
vite.config.ts
tsconfig.json
tsconfig.node.json
src/
  main.tsx      React entry
  App.tsx       the whole page
  api.ts        axios client
  types.ts      User + Settings interfaces
  App.css
  index.css
```
