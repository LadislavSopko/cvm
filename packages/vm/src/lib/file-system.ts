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
}

// Global instance
export const fileSystem = new SandboxedFileSystem();