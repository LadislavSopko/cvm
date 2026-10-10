# CI/CD setup — checklist

Repo is PUBLIC: anyone can open a PR. Only `production` publishes, only after approval.

## How it works

| Workflow | Trigger | Does |
|---|---|---|
| `.github/workflows/ci.yml` (job `verify`) | push to `main`/`production`, PR to `main`/`production` | npm ci, build, typecheck, lint, test, e2e. Read-only token, no secrets. |
| `.github/workflows/release.yml` | push to `production` only | runs `ci.yml` as gate, then job `publish` in environment `production` (waits for your approval), publishes `cvm-server` with npm Trusted Publishing (OIDC) + provenance. No npm token, no OTP. |

- Version = `apps/cvm-server/package.json` → bump it on `main` before releasing.
- Version already on npm → publish step skips (re-runs are safe).
- Version with `-` (e.g. `2.2.0-beta.1`) → dist-tag `next`, otherwise `latest`.
- Actions are pinned to commit SHAs.

## 1. npmjs.com — Trusted Publisher

1. npmjs.com → package `cvm-server` → **Settings** → **Trusted Publisher** → **GitHub Actions**.
2. Organization/user: `LadislavSopko` · Repository: `cvm` · Workflow filename: `release.yml` · Environment: `production`.
3. After the first successful publish from CI: **Publishing access** → "Require two-factor authentication and disallow tokens". Manual `npm publish --otp` keeps working; tokens are refused.

## 2. GitHub — environment `production`

Settings → **Environments** → New environment `production`:
- **Required reviewers**: you. Leave "Prevent self-review" OFF (you approve your own releases).
- **Deployment branches and tags**: "Selected branches and tags" → add `production` only.
- No secrets needed.

## 3. GitHub — Actions settings

Settings → **Actions** → **General**:
- Workflow permissions: **Read repository contents and packages permissions**.
- Uncheck "Allow GitHub Actions to create and approve pull requests".
- Fork pull request workflows: **Require approval for all external contributors**.

## 4. Create `production` — CAREFUL

Creating the branch triggers `release.yml`. `cvm-server@2.1.1` is NOT on npm yet, so the first run will ask for approval and publish 2.1.1.
- Do steps 1–3 first, then merge feature 08 into `main`, then: `git push origin main:production`.
- If you do not want to publish yet: reject the pending deployment in the Actions run.

## 5. GitHub — rulesets (after `production` exists)

Settings → **Rules** → **Rulesets** → New branch ruleset.

`production`:
- Target: branch `production`. Enforcement: Active. Bypass list: empty.
- Restrict deletions · Block force pushes.
- Require a pull request before merging (approvals: 0 — solo maintainer; the environment approval is the human gate).
- Require status checks to pass: `verify`. Require branches to be up to date.
- Restrict updates is implied by "require PR": direct pushes are rejected.

`main`:
- Same as above (deletions, force push, PR, status check `verify`).

## 6. Release flow (from then on)

1. Feature branch → PR to `main` → CI green → merge.
2. Bump `apps/cvm-server/package.json` version (in the feature PR or a small PR).
3. PR `main` → `production` → CI green → merge.
4. Actions → Release run → approve `production` deployment → published with provenance.
5. Check: `npm view cvm-server dist-tags` (Nexus: invalidate npm-proxy/npm-group cache as usual).
