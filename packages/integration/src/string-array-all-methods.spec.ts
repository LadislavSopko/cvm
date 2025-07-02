import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from '@cvm/vm';

describe('String and Array Methods - Comprehensive Integration', () => {
  it('should execute all string checking methods correctly', async () => {
    const source = `
      function main() {
        const path = "/home/user/test/file.backup.ts";
        
        // String checking methods
        const hasTs = path.endsWith(".ts");
        const isHome = path.startsWith("/home");
        const hasTest = path.includes("test");
        
        return hasTs + "," + isHome + "," + hasTest;
      }
    `;
    
    const bytecode = compile(source);
    const vm = new VM();
    const compileResult = bytecode;
    expect(compileResult.success).toBe(true);
    
    const result = vm.execute(compileResult.bytecode);
    expect(result.status).toBe('complete');
    expect(result.returnValue).toBe('true,true,true');
  });

  it('should execute all string trim methods correctly', async () => {
    const source = `
      function main() {
        const input = "  hello world  ";
        
        const trimmed = input.trim();
        const trimStart = input.trimStart();
        const trimEnd = input.trimEnd();
        
        return trimmed + "|" + trimStart + "|" + trimEnd;
      }
    `;
    
    const bytecode = compile(source);
    const vm = new VM();
    const compileResult = bytecode;
    expect(compileResult.success).toBe(true);
    
    const result = vm.execute(compileResult.bytecode);
    expect(result.status).toBe('complete');
    expect(result.returnValue).toBe('hello world|hello world  |  hello world');
  });

  it('should execute string replace methods correctly', async () => {
    const source = `
      function main() {
        const text = "foo bar foo baz foo";
        
        const replaced = text.replace("foo", "hello");
        const replacedAll = text.replaceAll("foo", "hello");
        
        return replaced + "|" + replacedAll;
      }
    `;
    
    const bytecode = compile(source);
    const vm = new VM();
    const compileResult = bytecode;
    expect(compileResult.success).toBe(true);
    
    const result = vm.execute(compileResult.bytecode);
    expect(result.status).toBe('complete');
    expect(result.returnValue).toBe('hello bar foo baz foo|hello bar hello baz hello');
  });

  it('should execute string utility methods correctly', async () => {
    const source = `
      function main() {
        const text = "hello.world.test.js";
        
        const lastDot = text.lastIndexOf(".");
        const repeated = "ha".repeat(3);
        
        return lastDot + "," + repeated;
      }
    `;
    
    const bytecode = compile(source);
    const vm = new VM();
    const compileResult = bytecode;
    expect(compileResult.success).toBe(true);
    
    const result = vm.execute(compileResult.bytecode);
    expect(result.status).toBe('complete');
    expect(result.returnValue).toBe('16,hahaha');
  });

  it('should execute string padding methods correctly', async () => {
    const source = `
      function main() {
        const num = "42";
        const name = "John";
        
        const padded = num.padStart(5, "0");
        const paddedEnd = name.padEnd(10, ".");
        
        return padded + "|" + paddedEnd;
      }
    `;
    
    const bytecode = compile(source);
    const vm = new VM();
    const compileResult = bytecode;
    expect(compileResult.success).toBe(true);
    
    const result = vm.execute(compileResult.bytecode);
    expect(result.status).toBe('complete');
    expect(result.returnValue).toBe('00042|John......');
  });

  it('should execute array join method correctly', async () => {
    const source = `
      function main() {
        const items = ["apple", "banana", "cherry"];
        items.push("date");
        
        const csv = items.join(",");
        const lines = items.join("\\n");
        const concat = items.join("");
        
        return csv + "|" + lines + "|" + concat;
      }
    `;
    
    const bytecode = compile(source);
    const vm = new VM();
    const compileResult = bytecode;
    expect(compileResult.success).toBe(true);
    
    const result = vm.execute(compileResult.bytecode);
    expect(result.status).toBe('complete');
    expect(result.returnValue).toBe('apple,banana,cherry,date|apple\nbanana\ncherry\ndate|applebananacherrydate');
  });

  it('should handle string and array methods in complex scenario', async () => {
    const source = `
      function main() {
        // File processing scenario
        const path = "/home/user/docs/report.final.pdf";
        
        // Extract filename
        const lastSlash = path.lastIndexOf("/");
        const filename = path.substring(lastSlash + 1);
        
        // Check file type
        const isPdf = filename.endsWith(".pdf");
        const isTemp = filename.includes("temp");
        
        // Extract name parts
        const parts = filename.split(".");
        const nameOnly = parts[0];
        const hasMiddle = parts.length > 2;
        
        // Format output
        const result = [];
        result.push("File: " + filename);
        result.push("Name: " + nameOnly);
        result.push("PDF: " + isPdf);
        result.push("Temp: " + isTemp);
        result.push("Has middle: " + hasMiddle);
        
        return result.join(", ");
      }
    `;
    
    const bytecode = compile(source);
    const vm = new VM();
    const compileResult = bytecode;
    expect(compileResult.success).toBe(true);
    
    const result = vm.execute(compileResult.bytecode);
    expect(result.status).toBe('complete');
    expect(result.returnValue).toBe('File: report.final.pdf, Name: report, PDF: true, Temp: false, Has middle: true');
  });

  it('should handle text formatting with multiple string methods', async () => {
    const source = `
      function main() {
        // Table formatting
        const headers = ["Name", "Age", "City"];
        const separator = "-".repeat(30);
        
        // Header row with padding
        const col1 = headers[0].padEnd(15, " ");
        const col2 = headers[1].padEnd(5, " ");
        const col3 = headers[2].padEnd(10, " ");
        
        const headerRow = col1 + col2 + col3;
        const output = headerRow + "\\n" + separator;
        
        return output;
      }
    `;
    
    const bytecode = compile(source);
    const vm = new VM();
    const compileResult = bytecode;
    expect(compileResult.success).toBe(true);
    
    const result = vm.execute(compileResult.bytecode);
    expect(result.status).toBe('complete');
    expect(result.returnValue).toBe('Name           Age  City      \n------------------------------');
  });

  it('should handle path manipulation with string methods', async () => {
    const source = `
      function main() {
        const paths = [
          "  /home/user/file.txt  ",
          "/var/log/app.log",
          "C:\\\\Windows\\\\System32\\\\cmd.exe"
        ];
        
        const results = [];
        
        // Process each path
        const p1 = paths[0].trim();
        const p2 = paths[1];
        const p3 = paths[2];
        
        // Unix-style check
        if (p1.startsWith("/")) {
          results.push("unix1");
        }
        if (p2.startsWith("/")) {
          results.push("unix2");
        }
        
        // Windows-style check
        if (p3.includes("\\\\")) {
          const normalized = p3.replaceAll("\\\\", "/");
          results.push(normalized);
        }
        
        return results.join("|");
      }
    `;
    
    const bytecode = compile(source);
    const vm = new VM();
    const compileResult = bytecode;
    expect(compileResult.success).toBe(true);
    
    const result = vm.execute(compileResult.bytecode);
    expect(result.status).toBe('complete');
    expect(result.returnValue).toBe('unix1|unix2|C:/Windows/System32/cmd.exe');
  });

  it('should handle CSV generation with array methods', async () => {
    const source = `
      function main() {
        const data = [];
        data.push("John,25,Engineer");
        data.push("Jane,30,Designer");
        data.push("Bob,35,Manager");
        
        // Create CSV with headers
        const headers = "Name,Age,Role";
        const allLines = [headers];
        
        // Add data lines
        allLines.push(data[0]);
        allLines.push(data[1]);
        allLines.push(data[2]);
        
        // Join with newlines
        const csv = allLines.join("\\n");
        
        return csv;
      }
    `;
    
    const bytecode = compile(source);
    const vm = new VM();
    const compileResult = bytecode;
    expect(compileResult.success).toBe(true);
    
    const result = vm.execute(compileResult.bytecode);
    expect(result.status).toBe('complete');
    expect(result.returnValue).toBe('Name,Age,Role\nJohn,25,Engineer\nJane,30,Designer\nBob,35,Manager');
  });

  it('should validate form inputs with string methods', async () => {
    const source = `
      function main() {
        const inputs = [
          "  john.doe@example.com  ",
          "ADMIN@COMPANY.COM",
          "test@",
          "@invalid.com"
        ];
        
        const results = [];
        
        // Validate each email
        const email1 = inputs[0].trim().toLowerCase();
        const email2 = inputs[1].toLowerCase();
        const email3 = inputs[2];
        const email4 = inputs[3];
        
        // Check for @ symbol
        if (email1.includes("@") && email1.indexOf("@") > 0 && email1.indexOf("@") < email1.length - 1) {
          results.push("valid1");
        }
        
        if (email2.includes("@") && !email2.startsWith("@") && !email2.endsWith("@")) {
          results.push("valid2");
        }
        
        if (email3.endsWith("@")) {
          results.push("invalid3");
        }
        
        if (email4.startsWith("@")) {
          results.push("invalid4");
        }
        
        return results.join(",");
      }
    `;
    
    const bytecode = compile(source);
    const vm = new VM();
    const compileResult = bytecode;
    expect(compileResult.success).toBe(true);
    
    const result = vm.execute(compileResult.bytecode);
    expect(result.status).toBe('complete');
    expect(result.returnValue).toBe('valid1,valid2,invalid3,invalid4');
  });

  it('should create formatted logs with padding and repetition', async () => {
    const source = `
      function main() {
        const logLevel = "INFO";
        const message = "Application started";
        const timestamp = "2024-01-15";
        
        // Format log entry
        const separator = "=".repeat(50);
        const level = ("[" + logLevel + "]").padEnd(10, " ");
        const date = timestamp.padStart(15, " ");
        
        const logEntry = separator + "\\n" + level + message + date + "\\n" + separator;
        
        return logEntry;
      }
    `;
    
    const bytecode = compile(source);
    const vm = new VM();
    const compileResult = bytecode;
    expect(compileResult.success).toBe(true);
    
    const result = vm.execute(compileResult.bytecode);
    expect(result.status).toBe('complete');
    expect(result.returnValue).toBe('==================================================\n[INFO]    Application started     2024-01-15\n==================================================');
  });
});