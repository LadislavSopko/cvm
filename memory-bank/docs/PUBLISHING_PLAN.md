# CVM Publishing Plan - Production-Ready Open Source

## Overview
This document outlines the complete plan to make CVM production-ready for open source with automated publishing to npm, GitHub releases, and Docker registries.

## 1. Package Structure & Naming

### Main Package
- **Name**: `@username/cvm-server` (replace username with actual npm username)
- **Description**: Cognitive Virtual Machine - A bytecode VM that integrates AI cognitive operations
- **Primary Distribution**: npm (enables `npx` usage)

### Installation Methods
1. **Primary**: `npx @username/cvm-server`
2. **Global Install**: `npm install -g @username/cvm-server`
3. **Docker**: `docker run ghcr.io/username/cvm-server`
4. **Direct Download**: From GitHub releases

## 2. NX Workspace Optimization

### Project Configuration Updates
- Add publishable configuration to `apps/cvm-server/project.json`
- Configure proper build outputs for npm distribution
- Set up bundling with all dependencies included
- Add publish target with version management

### Build Targets
```json
{
  "build": {
    "executor": "@nx/js:tsc",
    "options": {
      "outputPath": "dist/apps/cvm-server",
      "main": "apps/cvm-server/src/index.ts",
      "generatePackageJson": true,
      "bundle": true
    }
  },
  "publish": {
    "executor": "nx:run-commands",
    "options": {
      "command": "npm publish dist/apps/cvm-server --access public"
    }
  }
}
```

## 3. NPM Publishing Configuration

### Package.json Updates
```json
{
  "name": "@username/cvm-server",
  "version": "0.0.1",
  "description": "Cognitive Virtual Machine - Seamlessly integrate AI reasoning into deterministic programs",
  "keywords": ["mcp", "ai", "vm", "cognitive", "bytecode", "virtual-machine"],
  "author": "Your Name <email@example.com>",
  "license": "MIT",
  "homepage": "https://github.com/username/cvm#readme",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/username/cvm.git"
  },
  "bugs": {
    "url": "https://github.com/username/cvm/issues"
  },
  "bin": {
    "cvm-server": "./dist/index.js"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### .npmignore Configuration
```
# Source files
src/
*.ts
!*.d.ts

# Test files
**/*.test.js
**/*.spec.js
__tests__

# Development files
.env
.env.*
*.log
node_modules/

# Build files
tsconfig.json
nx.json
project.json
```

## 4. GitHub Actions CI/CD Pipeline

### Main Workflow (.github/workflows/publish.yml)
```yaml
name: Publish Package

on:
  push:
    tags:
      - 'v*'

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npx nx run-many --target=test --all
      - run: npx nx run-many --target=build --all

  publish-npm:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: https://registry.npmjs.org/
      - run: npm ci
      - run: npx nx build cvm-server
      - run: npm publish dist/apps/cvm-server --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  publish-docker:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/${{ github.repository_owner }}/cvm-server:${{ github.ref_name }}

  create-release:
    needs: [publish-npm, publish-docker]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false
```

## 5. Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY nx.json tsconfig.base.json ./
COPY apps/ ./apps/
COPY packages/ ./packages/
RUN npm ci
RUN npx nx build cvm-server

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist/apps/cvm-server ./
RUN npm install --production
EXPOSE 3000
CMD ["node", "index.js"]
```

## 6. Semantic Versioning & Changelog

### Conventional Commits
- feat: New features (minor version bump)
- fix: Bug fixes (patch version bump)
- BREAKING CHANGE: Major version bump

### Auto-changelog Generation
Use `conventional-changelog` or `semantic-release` for automatic versioning and changelog generation.

## 7. GitHub Secrets Setup

### Required Secrets
1. **NPM_TOKEN**: Your npm authentication token
   - Get from: npm.com → Profile → Access Tokens → Generate New Token
   - Type: Automation token
   - Add to: GitHub repo → Settings → Secrets → Actions → New repository secret

### Adding NPM_TOKEN
1. Go to npmjs.com and log in
2. Click profile icon → Access Tokens
3. Generate New Token → Classic Token
4. Select "Automation" type
5. Copy the token
6. Go to GitHub repository
7. Settings → Secrets and variables → Actions
8. New repository secret
9. Name: `NPM_TOKEN`
10. Value: paste your token

## 8. README Installation Section

```markdown
## Installation

### Quick Start (Recommended)
```bash
npx @username/cvm-server
```

### Global Installation
```bash
npm install -g @username/cvm-server
cvm-server
```

### Docker
```bash
docker run -p 3000:3000 ghcr.io/username/cvm-server
```

### From Source
```bash
git clone https://github.com/username/cvm
cd cvm
npm install
npx nx build cvm-server
node dist/apps/cvm-server
```
```

## 9. Pre-publish Validation

### Checklist
- [ ] All tests passing
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Package.json metadata complete
- [ ] README updated
- [ ] CHANGELOG updated
- [ ] Version bumped appropriately

### npm Scripts
```json
{
  "scripts": {
    "prepublishOnly": "nx run-many --target=test,build,typecheck --all",
    "version": "conventional-changelog -p angular -i CHANGELOG.md -s && git add CHANGELOG.md"
  }
}
```

## 10. Release Process

1. Ensure all changes are committed
2. Run tests: `npx nx run-many --target=test --all`
3. Bump version: `npm version [patch|minor|major]`
4. Push with tags: `git push && git push --tags`
5. GitHub Actions automatically:
   - Runs tests on multiple Node versions
   - Publishes to npm
   - Builds and pushes Docker image
   - Creates GitHub release

## Next Steps

1. Implement storage abstraction layer
2. Update package configurations
3. Create GitHub Actions workflows
4. Test publishing process with pre-release version
5. Document MCP integration for Claude.ai