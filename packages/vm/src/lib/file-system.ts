import { CVMValue, createCVMArray } from '@cvm/types';
import * as fs from 'fs';
import * as path from 'path';

export interface FileInfo {
  name: string;
  type: 'file' | 'directory';
  size: number;
  modified: string; // ISO date string
}

export interface ListFilesOptions {
  recursive?: boolean;
  filter?: string; // glob pattern
}

export interface FileSystemService {
  listFiles(filePath: string, options?: ListFilesOptions): CVMValue;
  readFile(filePath: string): string | null;
  writeFile(filePath: string, content: string): boolean;
}

export class SandboxedFileSystem implements FileSystemService {
  private sandboxPaths: string[] = [];

  constructor() {
    // Initialize from environment variables
    const paths = process.env.CVM_SANDBOX_PATHS;
    const root = process.env.CVM_SANDBOX_ROOT;
    
    if (paths) {
      this.sandboxPaths = paths.split(',').map(p => path.resolve(p.trim()));
    } else if (root) {
      this.sandboxPaths = [path.resolve(root)];
    }
  }

  private isPathAllowed(requestedPath: string): boolean {
    // Normalize and resolve the path
    const normalizedPath = path.resolve(requestedPath);
    
    // Check for parent directory traversal
    if (normalizedPath.includes('..')) {
      return false;
    }
    
    // If no sandbox paths configured, deny all access
    if (this.sandboxPaths.length === 0) {
      return false;
    }
    
    // Check if path is within any sandbox path
    return this.sandboxPaths.some(sandboxPath => 
      normalizedPath.startsWith(sandboxPath)
    );
  }

  listFiles(filePath: string, options: ListFilesOptions = {}): CVMValue {
    const result = createCVMArray();
    
    // Validate path
    if (!this.isPathAllowed(filePath)) {
      // Return empty array for unauthorized paths
      return result;
    }

    try {
      const normalizedPath = path.resolve(filePath);
      this.listFilesRecursive(normalizedPath, normalizedPath, result.elements, options);
    } catch (error) {
      // Return empty array on any error
    }

    return result;
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    // Simple glob pattern matching
    // Supports: *.ext, dir/*, **/file.ext, prefix*
    
    // Convert glob pattern to regex
    let regexPattern = pattern
      .replace(/\./g, '\\.')  // Escape dots
      .replace(/\*\*/g, '__DOUBLESTAR__')  // Temporarily replace **
      .replace(/\*/g, '[^/]*')  // * matches anything except /
      .replace(/__DOUBLESTAR__/g, '.*')  // ** matches anything including /
      .replace(/\?/g, '.');  // ? matches single character
    
    // Anchor the pattern
    regexPattern = '^' + regexPattern + '$';
    
    try {
      const regex = new RegExp(regexPattern);
      return regex.test(filePath);
    } catch {
      // If pattern is invalid, don't filter
      return true;
    }
  }

  private listFilesRecursive(
    basePath: string, 
    currentPath: string, 
    results: CVMValue[], 
    options: ListFilesOptions,
    depth: number = 0
  ): void {
    try {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relativePath = path.relative(basePath, fullPath);
        
        // Skip symbolic links for security
        if (entry.isSymbolicLink()) {
          continue;
        }
        
        // Apply filter if specified (simple pattern matching)
        if (options.filter && !this.matchesPattern(relativePath, options.filter)) {
          continue;
        }
        
        // Push the full absolute path as a string since CVM can't access object properties
        results.push(fullPath);
        
        // Recurse into directories if requested
        if (entry.isDirectory() && options.recursive) {
          this.listFilesRecursive(basePath, fullPath, results, options, depth + 1);
        }
      }
    } catch (error) {
      // Silently skip directories we can't read
    }
  }

  readFile(filePath: string): string | null {
    if (!this.isPathAllowed(filePath)) {
      // Security: don't leak information about file existence
      return null;
    }

    try {
      const normalizedPath = path.resolve(filePath);
      
      // Security check: prevent reading through symlinks that might point outside sandbox
      const stats = fs.lstatSync(normalizedPath);
      if (stats.isSymbolicLink()) {
        return null;
      }
      
      // Only allow reading files, not directories
      if (!stats.isFile()) {
        return null;
      }
      
      return fs.readFileSync(normalizedPath, 'utf-8');
    } catch (error: any) {
      // Return null for any error (file not found, permission denied, etc.)
      // This prevents leaking information about file system structure
      return null;
    }
  }

  writeFile(filePath: string, content: string): boolean {
    if (!this.isPathAllowed(filePath)) {
      return false;
    }

    try {
      const normalizedPath = path.resolve(filePath);
      const dir = path.dirname(normalizedPath);
      
      // Security: ensure the parent directory is also within sandbox
      if (!this.isPathAllowed(dir)) {
        return false;
      }
      
      // Security check: prevent overwriting symlinks
      try {
        const stats = fs.lstatSync(normalizedPath);
        if (stats.isSymbolicLink()) {
          return false;
        }
      } catch (error: any) {
        // ENOENT is fine - means we're creating a new file
        if (error.code !== 'ENOENT') {
          return false;
        }
      }
      
      // Create directory if it doesn't exist
      fs.mkdirSync(dir, { recursive: true });
      
      // Write the file
      fs.writeFileSync(normalizedPath, content, 'utf-8');
      return true;
    } catch (error) {
      // Return false for any error
      return false;
    }
  }
}

// Global instance
export const fileSystem = new SandboxedFileSystem();