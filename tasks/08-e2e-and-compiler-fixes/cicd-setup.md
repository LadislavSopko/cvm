# CI/CD setup — checklist

## Flow

1. Open PR `main` → `production` → **CI** (`.github/workflows/ci.yml`, job `verify`): npm ci, build, typecheck, lint, test, e2e.
2. CI green → **you** merge by hand.
3. Merge = push to `production` → **CD** (`.github/workflows/release.yml`): build `cvm-server`, `npm publish --provenance` via Trusted Publishing (OIDC, no token, no OTP). Skips if the version is already on npm.

Nothing else runs: no CI on `main`, no CI on other PRs.

## Who can do it — only you

Repo is public: anyone can fork and OPEN a PR, nobody can prevent that. What matters is who can MERGE / PUSH and who can PUBLISH:

| Lock | Where | Effect |
|---|---|---|
| No collaborators with write | Settings → Collaborators | Only users with write can merge PRs or push branches. You are the only one. |
| Ruleset on `production` | Settings → Rules → Rulesets | No direct push, no force push, no delete; only via PR with `verify` green. |
| CI only for `main` of this repo | `ci.yml` `if:` | A fork PR to `production` does not run CI (head is not `main` of this repo) → its required check never passes → it cannot be merged. |
| Environment `production` | Settings → Environments | Only branch `production` may deploy. Optional: required reviewer = you (extra click before publish). |
| npm Trusted Publisher | npmjs.com | npm accepts publishes only from `LadislavSopko/cvm` + `release.yml` + environment `production`. |
| Disallow tokens | npmjs.com publishing access | No stolen/forgotten token can publish. |

## 1. npmjs.com

1. Package `cvm-server` → **Settings** → **Trusted Publisher** → **GitHub Actions**: user `LadislavSopko`, repository `cvm`, workflow `release.yml`, environment `production`.
2. After the first successful CD publish: **Publishing access** → "Require two-factor authentication and disallow tokens" (manual `npm publish --otp` still works).

## 2. GitHub

1. **Settings → Collaborators**: nobody with write/maintain/admin except you.
2. **Settings → Actions → General**:
   - Workflow permissions: **Read repository contents and packages permissions**.
   - Uncheck "Allow GitHub Actions to create and approve pull requests".
   - Fork pull request workflows: **Require approval for all external contributors**.
3. **Settings → Environments** → new `production`:
   - Deployment branches and tags: **Selected** → `production` only.
   - Required reviewers: you (optional; if set, every publish waits for your click).
4. Create the branch — **after** step 1 on npm, otherwise the first CD fails: merge feature 08 into `main`, then `git push origin main:production`.
   - ⚠️ This push triggers CD: `cvm-server@2.1.1` is not on npm yet → it gets published (if you set a reviewer, it waits for you; reject to skip).
5. **Settings → Rules → Rulesets** → New branch ruleset `production` (Active, bypass list empty):
   - Target branch `production`.
   - Restrict deletions · Block force pushes.
   - Require a pull request before merging (0 approvals — you cannot approve your own PR).
   - Require status checks to pass: `verify` · Require branches to be up to date.

## Release

1. Bump `version` in `apps/cvm-server/package.json` on `main`.
2. PR `main` → `production`, wait for `verify` green, merge.
3. CD publishes. Check `npm view cvm-server dist-tags`; invalidate Nexus npm-proxy/npm-group cache as usual.
