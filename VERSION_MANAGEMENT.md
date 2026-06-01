# Version Management

This project uses [`standard-version`](https://github.com/conventional-changelog/standard-version) to bump semver versions in `package.json` files and update `CHANGELOG.md`. Git tags are not created (`skip.tag` in `.versionrc.json`).

## Source of truth

- Root `package.json` `version` (kept in sync with app packages via `.versionrc.json`)
- Injected at build time through `tools/build-metadata.cjs` as `APP_VERSION` / `__APP_VERSION__`

## Bump a version

Use [Conventional Commits](https://www.conventionalcommits.org/) for changelog entries (`feat:`, `fix:`, etc.).

```bash
npm run version:patch   # 1.0.0 -> 1.0.1
npm run version:minor   # 1.0.0 -> 1.1.0
npm run version:major   # 1.0.0 -> 2.0.0
npm run version         # infer bump from commits
npm run version:alpha   # prerelease
npm run version:beta
```

Updated files:

- `package.json` and `package-lock.json` (root)
- `apps/frontend/package.json`
- `apps/backend/package.json`
- `apps/agent-api/package.json`
- `CHANGELOG.md`

Then push when ready:

```bash
git push origin main
```

## Overrides

| Variable | Purpose |
|----------|---------|
| `APP_VERSION` | Force version at build/runtime |
| `BUILD_DATE` | Force build timestamp |
| `VITE_APP_VERSION` | Frontend dev override |

## CI / production builds

Deploy workflows read the root `package.json` version and pass `APP_VERSION` plus `BUILD_DATE` into builds.
