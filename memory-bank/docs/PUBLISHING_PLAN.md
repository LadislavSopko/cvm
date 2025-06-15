# Publishing Plan for CVM Server

## ✅ Publishing Successfully Resolved

Version 0.2.7 is live on npm and working correctly. Users can install with:
```bash
npx cvm-server
# or
npm install -g cvm-server
```

## Publishing Workflows

### Option 1: Standard NX Release (Recommended)
```bash
# Version bump, changelog, and publish in one command
npx nx release

# Or separately:
npx nx release version patch
npx nx release publish
```

### Option 2: Custom Publish Target
```bash
# Manual version bump, then:
npx nx run cvm-server:publish
```

### Option 3: Hybrid Approach
```bash
# Use NX for versioning, custom target for publish
npx nx release version patch
npx nx run cvm-server:publish
```

## Configuration Changes Made

1. **Added "type": "commonjs"** to package.json
   - Prevents ES module errors with require()
   - NX respects this when generating dist/package.json

2. **Added typescript to dependencies**
   - Required because parser uses TypeScript compiler API at runtime
   - Without it, published package fails with "Cannot find module 'typescript'"

3. **Updated vite.config.ts externals**
   - Added typescript, fs, path, os to external list
   - Prevents bundling Node.js built-ins

## Files in Correct Build
When built correctly, dist/ contains:
- LICENSE
- README.md  
- bin/cvm-server.cjs
- main.js (compiled from src/)
- package.json (with correct metadata)
- package-lock.json

## Important Notes

### Publishing Configuration
The key to correct publishing is ensuring npm runs from within the dist directory. The project's publish target handles this with:
```bash
cd apps/cvm-server/dist && npm publish
```

Never use `npm publish apps/cvm-server/dist` from the root - it will use root's .gitignore and exclude files.

### Build Before Publish
Always ensure the dist directory is built with the latest version:
```bash
npx nx run cvm-server:build
```

The dist directory should contain:
- main.js (compiled code)
- package.json (with correct version)
- LICENSE
- README.md
- bin/cvm-server.cjs

## Testing Published Package
```bash
# Clear npm cache
npm cache clean --force
rm -rf ~/.npm/_npx/*

# Test
npx cvm-server@latest
```

## Publishing Status
- **Version 0.2.7**: Successfully published and working ✅
- **Versions 0.2.5, 0.2.6**: ✅ Deprecated (were missing main.js)