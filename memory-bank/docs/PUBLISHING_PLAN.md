# CVM Publishing Plan - MCP Server with NPX Support

## Overview
Plan to publish CVM as an npm package that can be run with `npx cvm-server` (no scope), following MCP server conventions with environment-based configuration.

## Automatic Versioning Setup (COMPLETED)

### NX Release Configuration
Added to `nx.json`:
```json
"release": {
  "projects": ["cvm-server"],
  "projectsRelationship": "independent",
  "releaseTagPattern": "{projectName}@{version}",
  "version": {
    "conventionalCommits": true
  },
  "changelog": {
    "projectChangelogs": true,
    "createRelease": "github"
  },
  "publish": {
    "executor": "@nx/js:npm-publish"
  }
}
```

### How It Works
1. **Conventional Commits** determine version bumps automatically:
   - `fix:` or `perf:` → patch bump (0.1.1 → 0.1.2)
   - `feat:` → minor bump (0.1.1 → 0.2.0)
   - `BREAKING CHANGE:` → major bump (0.1.1 → 1.0.0)

2. **Release Command**: `npx nx release`
   - Analyzes commits since last tag
   - Updates version in package.json
   - Generates CHANGELOG.md
   - Builds the package
   - Publishes to npm
   - Creates git tag and GitHub release

3. **CI/CD Ready**: Use `npx nx release --ci` with NPM_TOKEN

## 1. Package Structure & Naming

### Main Package
- **Name**: `@cvm/cvm-server`
- **Description**: Cognitive Virtual Machine - A deterministic bytecode VM with AI cognitive operations
- **License**: Apache 2.0
- **Copyright**: "Copyright 2024 The CVM Authors"

### Installation Methods
1. **Primary**: `npx @cvm/cvm-server` (uses file storage by default)
2. **MCP Configuration**: Via `.mcp.json` with custom environment variables
3. **Global Install**: `npm install -g @cvm/cvm-server`

## 2. Configuration Approach

### Environment Variables (MCP Standard)
- `CVM_STORAGE_TYPE` - Storage backend (default: "file")
- `CVM_DATA_DIR` - Data directory (default: ".cvm" in current directory)
- `CVM_LOG_LEVEL` - Logging level (default: "info")
- `MONGODB_URI` - MongoDB connection (only required when storage type is "mongodb")

### Storage Strategy
- **Default**: File storage in `.cvm` directory (project-scoped)
- **⚠️ Important**: Users must add `.cvm/` to .gitignore
- MongoDB remains optional for production use

## 3. Executable Setup

### Create bin/cvm-server.js
```javascript
#!/usr/bin/env node
// Copyright 2024 The CVM Authors
// Licensed under the Apache License, Version 2.0

// Simple wrapper that starts the compiled server
require('../dist/apps/cvm-server/main.js');
```

### Package.json Configuration
```json
{
  "name": "@cvm/cvm-server",
  "version": "0.1.0",
  "description": "Cognitive Virtual Machine (CVM) - A deterministic bytecode VM with AI cognitive operations",
  "keywords": ["mcp", "ai", "vm", "cognitive", "bytecode", "virtual-machine", "claude"],
  "author": "The CVM Authors",
  "license": "Apache-2.0",
  "homepage": "https://github.com/username/cvm#readme",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/username/cvm.git"
  },
  "bugs": {
    "url": "https://github.com/username/cvm/issues"
  },
  "bin": {
    "cvm-server": "./bin/cvm-server.js"
  },
  "files": [
    "bin",
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

## 6. Usage Patterns

### Direct Usage
```bash
npx @cvm/cvm-server
# Server starts with file storage in ./.cvm directory
# Logs: "[CVM] Initializing file storage in: /path/to/current/dir/.cvm"
```

### MCP Configuration (.mcp.json)
```json
{
  "mcpServers": {
    "cvm": {
      "command": "npx",
      "args": ["@cvm/cvm-server"],
      "env": {
        "CVM_STORAGE_TYPE": "file",
        "CVM_DATA_DIR": ".cvm-project"
      }
    }
  }
}
```

### Production with MongoDB
```json
{
  "mcpServers": {
    "cvm": {
      "command": "npx",
      "args": ["@cvm/cvm-server"],
      "env": {
        "CVM_STORAGE_TYPE": "mongodb",
        "MONGODB_URI": "mongodb://user:pass@host:27017/cvm?authSource=admin"
      }
    }
  }
}
```

## 7. README Documentation

### Installation Section
```markdown
## Installation

### Quick Start
```bash
npx @cvm/cvm-server
```

### ⚠️ Important: Add to .gitignore
When using CVM in a git repository, add the data directory to your `.gitignore`:
```gitignore
# CVM data directory
.cvm/
```

### Configuration
CVM uses environment variables for configuration:
- `CVM_STORAGE_TYPE` - Storage backend: "file" (default) or "mongodb"
- `CVM_DATA_DIR` - Data directory for file storage (default: ".cvm")
- `CVM_LOG_LEVEL` - Logging level: "debug", "info" (default), "warn", "error"
- `MONGODB_URI` - MongoDB connection string (required only for mongodb storage)

### MCP Integration
Add to your `.mcp.json`:
```json
{
  "mcpServers": {
    "cvm": {
      "command": "npx",
      "args": ["@cvm/cvm-server"],
      "env": {
        "CVM_STORAGE_TYPE": "file",
        "CVM_DATA_DIR": ".cvm"
      }
    }
  }
}
```
```

## 8. Publishing Steps

### Initial Setup
1. **Create bin/cvm-server.js** with proper shebang and permissions
2. **Add LICENSE file** with full Apache 2.0 text
3. **Update package.json** in cvm-server app with npm metadata
4. **Create .npmignore** to exclude unnecessary files
5. **Add license headers** to all source files

### First Publishing
1. Build the server: `npx nx build cvm-server`
2. Create npm package structure in dist
3. Copy bin directory to dist
4. Test locally: `npm link dist/apps/cvm-server`
5. Test npx: `npx . # from dist/apps/cvm-server`
6. Publish: `npm publish dist/apps/cvm-server --access public`

## 9. Risk Mitigation

### .cvm Directory Warnings
1. **Clear README warning** about .gitignore requirement
2. **Startup log message** showing data directory location
3. **Consider .gitignore check** on startup with warning if missing

### Apache 2.0 License Header Template
```javascript
// Copyright 2024 The CVM Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
```

## 10. Success Criteria

- [ ] `npx @cvm/cvm-server` works immediately with zero config
- [ ] Clear documentation prevents .gitignore mistakes
- [ ] Environment variables follow MCP conventions
- [ ] Apache 2.0 license properly applied
- [ ] Package published to npm registry
- [ ] Community can contribute under clear license terms