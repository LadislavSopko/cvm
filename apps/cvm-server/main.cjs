"use strict";
const mcp_js = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod = require("zod");
const s$1 = require("typescript");
const fs = require("fs");
const c$1 = require("path");
const mongodb = require("mongodb");
const dotenv = require("dotenv");
const url = require("url");
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
function _interopNamespaceDefault(e2) {
  const n2 = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e2) {
    for (const k in e2) {
      if (k !== "default") {
        const d2 = Object.getOwnPropertyDescriptor(e2, k);
        Object.defineProperty(n2, k, d2.get ? d2 : {
          enumerable: true,
          get: () => e2[k]
        });
      }
    }
  }
  n2.default = e2;
  return Object.freeze(n2);
}
const s__namespace = /* @__PURE__ */ _interopNamespaceDefault(s$1);
const c__namespace = /* @__PURE__ */ _interopNamespaceDefault(c$1);
const dotenv__namespace = /* @__PURE__ */ _interopNamespaceDefault(dotenv);
var o$2 = Object.defineProperty;
var p$2 = (i2, a2, t2) => a2 in i2 ? o$2(i2, a2, { enumerable: true, configurable: true, writable: true, value: t2 }) : i2[a2] = t2;
var E$1 = (i2, a2, t2) => p$2(i2, typeof a2 != "symbol" ? a2 + "" : a2, t2);
var r$1 = /* @__PURE__ */ ((i2) => (i2.PUSH = "PUSH", i2.PUSH_UNDEFINED = "PUSH_UNDEFINED", i2.POP = "POP", i2.LOAD = "LOAD", i2.STORE = "STORE", i2.CONCAT = "CONCAT", i2.ARRAY_NEW = "ARRAY_NEW", i2.ARRAY_PUSH = "ARRAY_PUSH", i2.ARRAY_GET = "ARRAY_GET", i2.ARRAY_SET = "ARRAY_SET", i2.ARRAY_LEN = "ARRAY_LEN", i2.STRING_LEN = "STRING_LEN", i2.STRING_SUBSTRING = "STRING_SUBSTRING", i2.STRING_INDEXOF = "STRING_INDEXOF", i2.STRING_SPLIT = "STRING_SPLIT", i2.LENGTH = "LENGTH", i2.JSON_PARSE = "JSON_PARSE", i2.TYPEOF = "TYPEOF", i2.ADD = "ADD", i2.SUB = "SUB", i2.MUL = "MUL", i2.DIV = "DIV", i2.MOD = "MOD", i2.UNARY_MINUS = "UNARY_MINUS", i2.UNARY_PLUS = "UNARY_PLUS", i2.INC = "INC", i2.DEC = "DEC", i2.EQ = "EQ", i2.NEQ = "NEQ", i2.LT = "LT", i2.GT = "GT", i2.LTE = "LTE", i2.GTE = "GTE", i2.EQ_STRICT = "EQ_STRICT", i2.NEQ_STRICT = "NEQ_STRICT", i2.JUMP = "JUMP", i2.JUMP_IF = "JUMP_IF", i2.JUMP_IF_FALSE = "JUMP_IF_FALSE", i2.JUMP_IF_TRUE = "JUMP_IF_TRUE", i2.CALL = "CALL", i2.RETURN = "RETURN", i2.AND = "AND", i2.OR = "OR", i2.NOT = "NOT", i2.BREAK = "BREAK", i2.CONTINUE = "CONTINUE", i2.ITER_START = "ITER_START", i2.ITER_NEXT = "ITER_NEXT", i2.ITER_END = "ITER_END", i2.FS_LIST_FILES = "FS_LIST_FILES", i2.CC = "CC", i2.PRINT = "PRINT", i2.HALT = "HALT", i2))(r$1 || {});
function A(i2) {
  const a2 = [], t2 = [];
  let m2 = false, x = false;
  const l2 = s__namespace.createSourceFile(
    "program.ts",
    i2,
    s__namespace.ScriptTarget.Latest,
    true
  );
  function e2(n2) {
    if (s__namespace.isFunctionDeclaration(n2) && n2.name && n2.name.text === "main" && (m2 = true, n2.parameters.length > 0 && a2.push("main() must not have parameters")), s__namespace.isExpressionStatement(n2) && n2.parent === l2) {
      const c2 = n2.expression;
      s__namespace.isCallExpression(c2) && s__namespace.isIdentifier(c2.expression) && c2.expression.text === "main" && (x = true);
    }
    if (s__namespace.isCallExpression(n2) && s__namespace.isIdentifier(n2.expression)) {
      const c2 = n2.expression.text;
      ["setTimeout", "fetch", "require", "import"].includes(c2) && a2.push(`Unsupported function: ${c2}`);
    }
    s__namespace.forEachChild(n2, e2);
  }
  return e2(l2), m2 || a2.push("Program must have a main() function"), m2 && !x && a2.push("main() must be called at the top level"), a2.length === 0 && t2.push({ op: r$1.HALT }), {
    bytecode: t2,
    errors: a2,
    hasMain: m2
  };
}
class R {
  constructor() {
    E$1(this, "bytecode", []);
    E$1(this, "contextStack", []);
  }
  /**
   * Emit an instruction and return its index
   */
  emit(a2, t2) {
    const m2 = this.bytecode.length;
    return this.bytecode.push({ op: a2, arg: t2 }), m2;
  }
  /**
   * Get the current address (next instruction index)
   */
  currentAddress() {
    return this.bytecode.length;
  }
  /**
   * Patch a jump instruction with the target address
   */
  patchJump(a2, t2) {
    a2 >= 0 && a2 < this.bytecode.length && (this.bytecode[a2].arg = t2);
  }
  /**
   * Patch multiple jump instructions with the same target
   */
  patchJumps(a2, t2) {
    a2.forEach((m2) => this.patchJump(m2, t2));
  }
  /**
   * Push a new jump context onto the stack
   */
  pushContext(a2) {
    this.contextStack.push(a2);
  }
  /**
   * Pop the current jump context from the stack
   */
  popContext() {
    return this.contextStack.pop() || null;
  }
  /**
   * Get the current context without removing it
   */
  getCurrentContext() {
    return this.contextStack.length > 0 ? this.contextStack[this.contextStack.length - 1] : null;
  }
  /**
   * Find the nearest loop context (for break/continue)
   */
  findLoopContext() {
    for (let a2 = this.contextStack.length - 1; a2 >= 0; a2--)
      if (this.contextStack[a2].type === "loop")
        return this.contextStack[a2];
    return null;
  }
  /**
   * Get the final bytecode array
   */
  getBytecode() {
    return this.bytecode;
  }
  /**
   * Check if compilation is in a valid state
   */
  isValid() {
    return this.contextStack.length === 0;
  }
  /**
   * Get any unclosed contexts (for error reporting)
   */
  getUnclosedContexts() {
    return [...this.contextStack];
  }
}
function N(i2) {
  const a2 = A(i2);
  if (a2.errors.length > 0)
    return {
      success: false,
      bytecode: [],
      errors: a2.errors
    };
  const t2 = new R(), m2 = s__namespace.createSourceFile("program.ts", i2, s__namespace.ScriptTarget.Latest, true);
  function x(e2) {
    if (s__namespace.isIfStatement(e2)) {
      l2(e2.expression);
      const n2 = t2.emit(r$1.JUMP_IF_FALSE, -1), c2 = {
        type: "if",
        endTargets: []
      };
      if (e2.elseStatement ? c2.elseTarget = n2 : c2.endTargets.push(n2), t2.pushContext(c2), x(e2.thenStatement), e2.elseStatement) {
        const u2 = t2.emit(r$1.JUMP, -1);
        c2.endTargets.push(u2);
        const T = t2.currentAddress();
        t2.patchJump(n2, T), x(e2.elseStatement);
      }
      const S = t2.popContext();
      if (S) {
        const u2 = t2.currentAddress();
        t2.patchJumps(S.endTargets, u2);
      }
    } else if (s__namespace.isWhileStatement(e2)) {
      const n2 = t2.currentAddress();
      l2(e2.expression);
      const S = {
        type: "loop",
        breakTargets: [t2.emit(r$1.JUMP_IF_FALSE, -1)],
        continueTargets: [],
        endTargets: [],
        startAddress: n2
      };
      t2.pushContext(S), x(e2.statement), t2.emit(r$1.JUMP, n2);
      const u2 = t2.popContext();
      if (u2) {
        const T = t2.currentAddress();
        t2.patchJumps(u2.breakTargets || [], T);
      }
    } else if (s__namespace.isBlock(e2))
      e2.statements.forEach((n2) => {
        x(n2);
      });
    else if (s__namespace.isExpressionStatement(e2)) {
      const n2 = e2.expression;
      if (s__namespace.isCallExpression(n2) && s__namespace.isPropertyAccessExpression(n2.expression) && n2.expression.expression.getText() === "console" && n2.expression.name.getText() === "log")
        n2.arguments.forEach((c2) => {
          l2(c2);
        }), t2.emit(r$1.PRINT);
      else if (s__namespace.isCallExpression(n2) && s__namespace.isIdentifier(n2.expression) && n2.expression.text === "CC")
        n2.arguments.length > 0 && l2(n2.arguments[0]), t2.emit(r$1.CC), t2.emit(r$1.POP);
      else if (s__namespace.isCallExpression(n2) && s__namespace.isPropertyAccessExpression(n2.expression) && n2.expression.name.getText() === "push")
        l2(n2.expression.expression), n2.arguments.length > 0 && l2(n2.arguments[0]), t2.emit(r$1.ARRAY_PUSH);
      else if (s__namespace.isPostfixUnaryExpression(n2) || s__namespace.isPrefixUnaryExpression(n2))
        l2(n2), t2.emit(r$1.POP);
      else if (s__namespace.isBinaryExpression(n2) && n2.operatorToken.kind === s__namespace.SyntaxKind.EqualsToken) {
        if (l2(n2.right), s__namespace.isIdentifier(n2.left))
          t2.emit(r$1.STORE, n2.left.text);
        else if (s__namespace.isElementAccessExpression(n2.left)) {
          const c2 = `__temp_${t2.getBytecode().length}`;
          t2.emit(r$1.STORE, c2), l2(n2.left.expression), l2(n2.left.argumentExpression), t2.emit(r$1.LOAD, c2), t2.emit(r$1.ARRAY_SET);
        }
      }
    } else if (s__namespace.isVariableStatement(e2)) {
      const n2 = e2.declarationList.declarations[0];
      n2.initializer && (l2(n2.initializer), t2.emit(r$1.STORE, n2.name.getText()));
    } else s__namespace.isReturnStatement(e2) && (e2.expression ? l2(e2.expression) : t2.emit(r$1.PUSH, null), t2.emit(r$1.RETURN));
  }
  function l2(e2) {
    if (s__namespace.isStringLiteral(e2))
      t2.emit(r$1.PUSH, e2.text);
    else if (s__namespace.isNumericLiteral(e2))
      t2.emit(r$1.PUSH, Number(e2.text));
    else if (e2.kind === s__namespace.SyntaxKind.TrueKeyword)
      t2.emit(r$1.PUSH, true);
    else if (e2.kind === s__namespace.SyntaxKind.FalseKeyword)
      t2.emit(r$1.PUSH, false);
    else if (e2.kind === s__namespace.SyntaxKind.NullKeyword)
      t2.emit(r$1.PUSH, null);
    else if (s__namespace.isArrayLiteralExpression(e2))
      t2.emit(r$1.ARRAY_NEW), e2.elements.forEach((n2) => {
        l2(n2), t2.emit(r$1.ARRAY_PUSH);
      });
    else if (s__namespace.isElementAccessExpression(e2))
      l2(e2.expression), e2.argumentExpression && l2(e2.argumentExpression), t2.emit(r$1.ARRAY_GET);
    else if (s__namespace.isPropertyAccessExpression(e2) && e2.name.text === "length")
      l2(e2.expression), t2.emit(r$1.LENGTH);
    else if (s__namespace.isIdentifier(e2))
      e2.text === "undefined" ? t2.emit(r$1.PUSH_UNDEFINED) : t2.emit(r$1.LOAD, e2.text);
    else if (s__namespace.isCallExpression(e2)) {
      if (s__namespace.isPropertyAccessExpression(e2.expression) && s__namespace.isIdentifier(e2.expression.expression) && e2.expression.expression.text === "JSON" && e2.expression.name.text === "parse")
        e2.arguments.length > 0 && l2(e2.arguments[0]), t2.emit(r$1.JSON_PARSE);
      else if (s__namespace.isIdentifier(e2.expression) && e2.expression.text === "CC")
        e2.arguments.length > 0 && l2(e2.arguments[0]), t2.emit(r$1.CC);
      else if (s__namespace.isPropertyAccessExpression(e2.expression)) {
        const n2 = e2.expression.name.text;
        n2 === "substring" ? (l2(e2.expression.expression), e2.arguments.length > 0 ? l2(e2.arguments[0]) : t2.emit(r$1.PUSH, 0), e2.arguments.length > 1 && l2(e2.arguments[1]), t2.emit(r$1.STRING_SUBSTRING)) : n2 === "indexOf" ? (l2(e2.expression.expression), e2.arguments.length > 0 ? l2(e2.arguments[0]) : t2.emit(r$1.PUSH, ""), t2.emit(r$1.STRING_INDEXOF)) : n2 === "split" && (l2(e2.expression.expression), e2.arguments.length > 0 ? l2(e2.arguments[0]) : t2.emit(r$1.PUSH, ""), t2.emit(r$1.STRING_SPLIT));
      }
    } else if (s__namespace.isParenthesizedExpression(e2))
      l2(e2.expression);
    else if (s__namespace.isBinaryExpression(e2)) {
      const n2 = e2.operatorToken.kind;
      switch (l2(e2.left), l2(e2.right), n2) {
        case s__namespace.SyntaxKind.PlusToken:
          f$1(e2.left, e2.right) ? t2.emit(r$1.CONCAT) : t2.emit(r$1.ADD);
          break;
        case s__namespace.SyntaxKind.MinusToken:
          t2.emit(r$1.SUB);
          break;
        case s__namespace.SyntaxKind.AsteriskToken:
          t2.emit(r$1.MUL);
          break;
        case s__namespace.SyntaxKind.SlashToken:
          t2.emit(r$1.DIV);
          break;
        case s__namespace.SyntaxKind.PercentToken:
          t2.emit(r$1.MOD);
          break;
        case s__namespace.SyntaxKind.EqualsEqualsToken:
          t2.emit(r$1.EQ);
          break;
        case s__namespace.SyntaxKind.ExclamationEqualsToken:
          t2.emit(r$1.NEQ);
          break;
        case s__namespace.SyntaxKind.LessThanToken:
          t2.emit(r$1.LT);
          break;
        case s__namespace.SyntaxKind.GreaterThanToken:
          t2.emit(r$1.GT);
          break;
        case s__namespace.SyntaxKind.LessThanEqualsToken:
          t2.emit(r$1.LTE);
          break;
        case s__namespace.SyntaxKind.GreaterThanEqualsToken:
          t2.emit(r$1.GTE);
          break;
        case s__namespace.SyntaxKind.EqualsEqualsEqualsToken:
          t2.emit(r$1.EQ_STRICT);
          break;
        case s__namespace.SyntaxKind.ExclamationEqualsEqualsToken:
          t2.emit(r$1.NEQ_STRICT);
          break;
        case s__namespace.SyntaxKind.AmpersandAmpersandToken:
          t2.emit(r$1.AND);
          break;
        case s__namespace.SyntaxKind.BarBarToken:
          t2.emit(r$1.OR);
          break;
      }
    } else if (s__namespace.isPrefixUnaryExpression(e2))
      switch (e2.operator) {
        case s__namespace.SyntaxKind.ExclamationToken:
          l2(e2.operand), t2.emit(r$1.NOT);
          break;
        case s__namespace.SyntaxKind.MinusToken:
          l2(e2.operand), t2.emit(r$1.UNARY_MINUS);
          break;
        case s__namespace.SyntaxKind.PlusToken:
          l2(e2.operand), t2.emit(r$1.UNARY_PLUS);
          break;
        case s__namespace.SyntaxKind.PlusPlusToken:
          s__namespace.isIdentifier(e2.operand) && (t2.emit(r$1.PUSH, e2.operand.text), t2.emit(r$1.INC, false));
          break;
        case s__namespace.SyntaxKind.MinusMinusToken:
          s__namespace.isIdentifier(e2.operand) && (t2.emit(r$1.PUSH, e2.operand.text), t2.emit(r$1.DEC, false));
          break;
      }
    else if (s__namespace.isPostfixUnaryExpression(e2))
      switch (e2.operator) {
        case s__namespace.SyntaxKind.PlusPlusToken:
          s__namespace.isIdentifier(e2.operand) && (t2.emit(r$1.PUSH, e2.operand.text), t2.emit(r$1.INC, true));
          break;
        case s__namespace.SyntaxKind.MinusMinusToken:
          s__namespace.isIdentifier(e2.operand) && (t2.emit(r$1.PUSH, e2.operand.text), t2.emit(r$1.DEC, true));
          break;
      }
    else if (s__namespace.isTypeOfExpression(e2))
      l2(e2.expression), t2.emit(r$1.TYPEOF);
    else if (s__namespace.isConditionalExpression(e2)) {
      l2(e2.condition);
      const n2 = t2.emit(r$1.JUMP_IF_FALSE, -1);
      l2(e2.whenTrue);
      const c2 = t2.emit(r$1.JUMP, -1), S = t2.currentAddress();
      t2.patchJump(n2, S), l2(e2.whenFalse);
      const u2 = t2.currentAddress();
      t2.patchJump(c2, u2);
    }
  }
  return m2.forEachChild((e2) => {
    var n2;
    s__namespace.isFunctionDeclaration(e2) && ((n2 = e2.name) == null ? void 0 : n2.text) === "main" && e2.body && e2.body.statements.forEach((c2) => {
      x(c2);
    });
  }), t2.emit(r$1.HALT), {
    success: true,
    bytecode: t2.getBytecode(),
    errors: []
  };
}
function f$1(i2, a2) {
  return !!(s__namespace.isStringLiteral(i2) || s__namespace.isStringLiteral(a2) || s__namespace.isBinaryExpression(i2) && i2.operatorToken.kind === s__namespace.SyntaxKind.PlusToken && f$1(i2.left, i2.right) || s__namespace.isBinaryExpression(a2) && a2.operatorToken.kind === s__namespace.SyntaxKind.PlusToken && f$1(a2.left, a2.right));
}
function n(r2) {
  return typeof r2 == "string";
}
function t(r2) {
  return typeof r2 == "number";
}
function i$1(r2) {
  return typeof r2 == "boolean";
}
function f(r2) {
  return r2 === null;
}
function e(r2) {
  return r2 !== null && typeof r2 == "object" && "type" in r2 && r2.type === "array";
}
function o$1(r2) {
  return r2 !== null && typeof r2 == "object" && "type" in r2 && r2.type === "undefined";
}
function c(r2) {
  return n(r2) ? r2 : t(r2) || i$1(r2) ? r2.toString() : f(r2) ? "null" : o$1(r2) ? "undefined" : e(r2) ? `[array:${r2.elements.length}]` : String(r2);
}
function y(r2) {
  return i$1(r2) ? r2 : f(r2) || o$1(r2) ? false : t(r2) ? r2 !== 0 : n(r2) ? r2 !== "" : e(r2) ? true : !!r2;
}
function m(r2) {
  return n(r2) ? "string" : t(r2) ? "number" : i$1(r2) ? "boolean" : f(r2) ? "null" : o$1(r2) ? "undefined" : e(r2) ? "array" : "unknown";
}
function d(r2) {
  if (t(r2)) return r2;
  if (i$1(r2)) return r2 ? 1 : 0;
  if (f(r2)) return 0;
  if (o$1(r2)) return NaN;
  if (n(r2)) {
    const u2 = r2.trim();
    return u2 === "" ? 0 : Number(u2);
  }
  return e(r2) ? NaN : Number(r2);
}
function p$1(r2 = []) {
  return { type: "array", elements: r2 };
}
function s() {
  return { type: "undefined" };
}
var l = Object.defineProperty;
var u = (s2, t2, n2) => t2 in s2 ? l(s2, t2, { enumerable: true, configurable: true, writable: true, value: n2 }) : s2[t2] = n2;
var r = (s2, t2, n2) => u(s2, typeof t2 != "symbol" ? t2 + "" : t2, n2);
class h {
  constructor(t2) {
    r(this, "connected", false);
    r(this, "programsDir");
    r(this, "executionsDir");
    r(this, "outputsDir");
    this.dataDir = t2, this.programsDir = c__namespace.join(t2, "programs"), this.executionsDir = c__namespace.join(t2, "executions"), this.outputsDir = c__namespace.join(t2, "outputs");
  }
  async connect() {
    await fs.promises.mkdir(this.dataDir, { recursive: true }), await fs.promises.mkdir(this.programsDir, { recursive: true }), await fs.promises.mkdir(this.executionsDir, { recursive: true }), await fs.promises.mkdir(this.outputsDir, { recursive: true }), this.connected = true;
  }
  async disconnect() {
    this.connected = false;
  }
  isConnected() {
    return this.connected;
  }
  async saveProgram(t2) {
    if (!this.connected) throw new Error("Not connected");
    const n2 = c__namespace.join(this.programsDir, `${t2.id}.json`), e2 = JSON.stringify(t2, null, 2);
    await fs.promises.writeFile(n2, e2, "utf-8");
  }
  async getProgram(t2) {
    if (!this.connected) throw new Error("Not connected");
    const n2 = c__namespace.join(this.programsDir, `${t2}.json`);
    try {
      const e2 = await fs.promises.readFile(n2, "utf-8"), o2 = JSON.parse(e2);
      return o2.created = new Date(o2.created), o2.updated && (o2.updated = new Date(o2.updated)), o2;
    } catch (e2) {
      if (e2.code === "ENOENT")
        return null;
      throw e2;
    }
  }
  async saveExecution(t2) {
    if (!this.connected) throw new Error("Not connected");
    const n2 = c__namespace.join(this.executionsDir, `${t2.id}.json`), e2 = JSON.stringify(t2, null, 2);
    await fs.promises.writeFile(n2, e2, "utf-8");
  }
  async getExecution(t2) {
    if (!this.connected) throw new Error("Not connected");
    const n2 = c__namespace.join(this.executionsDir, `${t2}.json`);
    try {
      const e2 = await fs.promises.readFile(n2, "utf-8"), o2 = JSON.parse(e2);
      return o2.created = new Date(o2.created), o2.updated && (o2.updated = new Date(o2.updated)), o2;
    } catch (e2) {
      if (e2.code === "ENOENT")
        return null;
      throw e2;
    }
  }
  async appendOutput(t2, n2) {
    if (!this.connected) throw new Error("Not connected");
    const e2 = c__namespace.join(this.outputsDir, `${t2}.output`), o2 = n2.join(`
`) + `
`;
    await fs.promises.appendFile(e2, o2, "utf-8");
  }
  async getOutput(t2) {
    if (!this.connected) throw new Error("Not connected");
    const n2 = c__namespace.join(this.outputsDir, `${t2}.output`);
    try {
      return (await fs.promises.readFile(n2, "utf-8")).split(`
`).filter((o2) => o2.length > 0);
    } catch (e2) {
      if (e2.code === "ENOENT")
        return [];
      throw e2;
    }
  }
}
class p {
  constructor(t2) {
    r(this, "client");
    r(this, "db", null);
    r(this, "connected", false);
    this.connectionString = t2, this.client = new mongodb.MongoClient(t2);
  }
  async connect() {
    var o2;
    await this.client.connect();
    const t2 = ((o2 = this.connectionString.split("/").pop()) == null ? void 0 : o2.split("?")[0]) || "cvm";
    this.db = this.client.db(t2), this.connected = true;
    const e2 = (await this.db.listCollections().toArray()).map((a2) => a2.name);
    e2.includes("programs") || await this.db.createCollection("programs"), e2.includes("executions") || await this.db.createCollection("executions"), e2.includes("outputs") || await this.db.createCollection("outputs");
  }
  async disconnect() {
    await this.client.close(), this.connected = false, this.db = null;
  }
  isConnected() {
    return this.connected;
  }
  async getCollections() {
    if (!this.db) throw new Error("Not connected to database");
    return (await this.db.listCollections().toArray()).map((n2) => n2.name);
  }
  getCollection(t2) {
    if (!this.db) throw new Error("Not connected to database");
    return this.db.collection(t2);
  }
  async saveProgram(t2) {
    await this.getCollection("programs").replaceOne(
      { id: t2.id },
      t2,
      { upsert: true }
    );
  }
  async getProgram(t2) {
    return await this.getCollection("programs").findOne({ id: t2 });
  }
  async saveExecution(t2) {
    await this.getCollection("executions").replaceOne(
      { id: t2.id },
      t2,
      { upsert: true }
    );
  }
  async getExecution(t2) {
    return await this.getCollection("executions").findOne({ id: t2 });
  }
  async appendOutput(t2, n2) {
    const e2 = this.getCollection("outputs");
    await e2.findOne({ executionId: t2 }) ? await e2.updateOne(
      { executionId: t2 },
      { $push: { lines: { $each: n2 } } }
    ) : await e2.insertOne({ executionId: t2, lines: n2 });
  }
  async getOutput(t2) {
    const e2 = await this.getCollection("outputs").findOne({ executionId: t2 });
    return (e2 == null ? void 0 : e2.lines) || [];
  }
}
class g {
  static create(t2) {
    const n2 = (t2 == null ? void 0 : t2.type) || process.env.CVM_STORAGE_TYPE || "file";
    switch (n2) {
      case "file": {
        const e2 = (t2 == null ? void 0 : t2.dataDir) || process.env.CVM_DATA_DIR || ".cvm";
        return new h(e2);
      }
      case "mongodb": {
        const e2 = (t2 == null ? void 0 : t2.mongoUri) || process.env.MONGODB_URI || "mongodb://localhost:27017/cvm";
        return new p(e2);
      }
      default:
        throw new Error(`Unsupported storage type: ${n2}`);
    }
  }
}
var P = Object.defineProperty;
var O = (g2, a2, s2) => a2 in g2 ? P(g2, a2, { enumerable: true, configurable: true, writable: true, value: s2 }) : g2[a2] = s2;
var E = (g2, a2, s2) => O(g2, typeof a2 != "symbol" ? a2 + "" : a2, s2);
class w {
  execute(a2, s$12) {
    const r2 = {
      pc: (s$12 == null ? void 0 : s$12.pc) ?? 0,
      stack: (s$12 == null ? void 0 : s$12.stack) ?? [],
      variables: (s$12 == null ? void 0 : s$12.variables) ?? /* @__PURE__ */ new Map(),
      status: "running",
      output: (s$12 == null ? void 0 : s$12.output) ?? [],
      iterators: (s$12 == null ? void 0 : s$12.iterators) ?? [],
      ...s$12
    };
    for (; r2.status === "running" && r2.pc < a2.length; ) {
      const p2 = a2[r2.pc];
      switch (p2.op) {
        case r$1.HALT:
          r2.status = "complete";
          break;
        case r$1.PUSH:
          r2.stack.push(p2.arg), r2.pc++;
          break;
        case r$1.PUSH_UNDEFINED:
          r2.stack.push(s()), r2.pc++;
          break;
        case r$1.POP:
          r2.stack.pop(), r2.pc++;
          break;
        case r$1.LOAD: {
          const t2 = p2.arg;
          r2.variables.has(t2) ? r2.stack.push(r2.variables.get(t2)) : r2.stack.push(s()), r2.pc++;
          break;
        }
        case r$1.STORE:
          const f$12 = r2.stack.pop();
          if (f$12 === void 0) {
            r2.status = "error", r2.error = "STORE: Stack underflow";
            break;
          }
          r2.variables.set(p2.arg, f$12), r2.pc++;
          break;
        case r$1.CONCAT:
          const u2 = r2.stack.pop(), k = r2.stack.pop();
          if (k === void 0 || u2 === void 0) {
            r2.status = "error", r2.error = "CONCAT: Stack underflow";
            break;
          }
          r2.stack.push(c(k) + c(u2)), r2.pc++;
          break;
        case r$1.PRINT:
          const R2 = r2.stack.pop();
          R2 !== void 0 && r2.output.push(c(R2)), r2.pc++;
          break;
        case r$1.CC: {
          const t2 = r2.stack.pop();
          if (t2 === void 0) {
            r2.status = "error", r2.error = "CC: Stack underflow";
            break;
          }
          r2.ccPrompt = c(t2), r2.status = "waiting_cc";
          break;
        }
        // Array operations
        case r$1.ARRAY_NEW:
          r2.stack.push(p$1()), r2.pc++;
          break;
        case r$1.ARRAY_PUSH: {
          const t2 = r2.stack.pop(), e$1 = r2.stack.pop();
          if (t2 === void 0 || e$1 === void 0) {
            r2.status = "error", r2.error = "ARRAY_PUSH: Stack underflow";
            break;
          }
          if (!e(e$1)) {
            r2.status = "error", r2.error = "ARRAY_PUSH requires an array";
            break;
          }
          e$1.elements.push(t2), r2.stack.push(e$1), r2.pc++;
          break;
        }
        case r$1.ARRAY_GET: {
          const t$1 = r2.stack.pop(), e$1 = r2.stack.pop();
          if (t$1 === void 0 || e$1 === void 0) {
            r2.status = "error", r2.error = "ARRAY_GET: Stack underflow";
            break;
          }
          if (!e(e$1)) {
            r2.status = "error", r2.error = "ARRAY_GET requires an array";
            break;
          }
          if (!t(t$1)) {
            r2.status = "error", r2.error = "ARRAY_GET requires numeric index";
            break;
          }
          const o2 = e$1.elements[t$1] ?? null;
          r2.stack.push(o2), r2.pc++;
          break;
        }
        case r$1.ARRAY_SET: {
          const t$1 = r2.stack.pop(), e$1 = r2.stack.pop(), o2 = r2.stack.pop();
          if (t$1 === void 0 || e$1 === void 0 || o2 === void 0) {
            r2.status = "error", r2.error = "ARRAY_SET: Stack underflow";
            break;
          }
          if (!e(o2)) {
            r2.status = "error", r2.error = "ARRAY_SET requires an array";
            break;
          }
          if (!t(e$1)) {
            r2.status = "error", r2.error = "ARRAY_SET requires numeric index";
            break;
          }
          const n2 = Math.floor(e$1);
          if (n2 < 0) {
            r2.status = "error", r2.error = "ARRAY_SET: Negative index not allowed";
            break;
          }
          o2.elements[n2] = t$1, r2.pc++;
          break;
        }
        case r$1.ARRAY_LEN: {
          const t2 = r2.stack.pop();
          if (t2 === void 0) {
            r2.status = "error", r2.error = "ARRAY_LEN: Stack underflow";
            break;
          }
          if (!e(t2)) {
            r2.status = "error", r2.error = "ARRAY_LEN requires an array";
            break;
          }
          r2.stack.push(t2.elements.length), r2.pc++;
          break;
        }
        case r$1.STRING_LEN: {
          const t2 = r2.stack.pop();
          if (t2 === void 0) {
            r2.status = "error", r2.error = "STRING_LEN: Stack underflow";
            break;
          }
          if (!n(t2)) {
            r2.status = "error", r2.error = "STRING_LEN requires a string";
            break;
          }
          r2.stack.push(t2.length), r2.pc++;
          break;
        }
        case r$1.LENGTH: {
          const t2 = r2.stack.pop();
          if (t2 === void 0) {
            r2.status = "error", r2.error = "LENGTH: Stack underflow";
            break;
          }
          if (n(t2))
            r2.stack.push(t2.length);
          else if (e(t2))
            r2.stack.push(t2.elements.length);
          else {
            r2.status = "error", r2.error = "LENGTH requires a string or array";
            break;
          }
          r2.pc++;
          break;
        }
        case r$1.JSON_PARSE: {
          const t2 = r2.stack.pop();
          if (t2 === void 0) {
            r2.status = "error", r2.error = "JSON_PARSE: Stack underflow";
            break;
          }
          if (!n(t2)) {
            r2.status = "error", r2.error = "JSON_PARSE requires a string";
            break;
          }
          try {
            const e2 = JSON.parse(t2);
            Array.isArray(e2) ? r2.stack.push(p$1(e2)) : r2.stack.push(p$1());
          } catch {
            r2.stack.push(p$1());
          }
          r2.pc++;
          break;
        }
        case r$1.TYPEOF: {
          const t2 = r2.stack.pop();
          if (t2 === void 0) {
            r2.status = "error", r2.error = "TYPEOF: Stack underflow";
            break;
          }
          r2.stack.push(m(t2)), r2.pc++;
          break;
        }
        // Arithmetic operations
        case r$1.ADD: {
          const t2 = r2.stack.pop(), e2 = r2.stack.pop();
          if (e2 === void 0 || t2 === void 0) {
            r2.status = "error", r2.error = "ADD: Stack underflow";
            break;
          }
          const o2 = d(e2), n2 = d(t2);
          r2.stack.push(o2 + n2), r2.pc++;
          break;
        }
        case r$1.SUB: {
          const t2 = r2.stack.pop(), e2 = r2.stack.pop();
          if (e2 === void 0 || t2 === void 0) {
            r2.status = "error", r2.error = "SUB: Stack underflow";
            break;
          }
          const o2 = d(e2), n2 = d(t2);
          r2.stack.push(o2 - n2), r2.pc++;
          break;
        }
        case r$1.MUL: {
          const t2 = r2.stack.pop(), e2 = r2.stack.pop();
          if (e2 === void 0 || t2 === void 0) {
            r2.status = "error", r2.error = "MUL: Stack underflow";
            break;
          }
          const o2 = d(e2), n2 = d(t2);
          r2.stack.push(o2 * n2), r2.pc++;
          break;
        }
        case r$1.DIV: {
          const t2 = r2.stack.pop(), e2 = r2.stack.pop();
          if (e2 === void 0 || t2 === void 0) {
            r2.status = "error", r2.error = "DIV: Stack underflow";
            break;
          }
          const o2 = d(e2), n2 = d(t2);
          if (n2 === 0) {
            r2.status = "error", r2.error = "Division by zero";
            break;
          }
          r2.stack.push(o2 / n2), r2.pc++;
          break;
        }
        case r$1.MOD: {
          const t2 = r2.stack.pop(), e2 = r2.stack.pop();
          if (e2 === void 0 || t2 === void 0) {
            r2.status = "error", r2.error = "MOD: Stack underflow";
            break;
          }
          const o2 = d(e2), n2 = d(t2);
          r2.stack.push(o2 % n2), r2.pc++;
          break;
        }
        // Unary operations
        case r$1.UNARY_MINUS: {
          const t2 = r2.stack.pop();
          if (t2 === void 0) {
            r2.status = "error", r2.error = "UNARY_MINUS: Stack underflow";
            break;
          }
          const e2 = d(t2);
          r2.stack.push(-e2), r2.pc++;
          break;
        }
        case r$1.UNARY_PLUS: {
          const t2 = r2.stack.pop();
          if (t2 === void 0) {
            r2.status = "error", r2.error = "UNARY_PLUS: Stack underflow";
            break;
          }
          const e2 = d(t2);
          r2.stack.push(e2), r2.pc++;
          break;
        }
        case r$1.INC: {
          const t2 = r2.stack.pop();
          if (t2 === void 0 || typeof t2 != "string") {
            r2.status = "error", r2.error = "INC: Invalid variable name";
            break;
          }
          const e2 = r2.variables.get(t2) ?? 0, o2 = d(e2) + 1;
          r2.variables.set(t2, o2);
          const n2 = p2.arg === true;
          r2.stack.push(n2 ? d(e2) : o2), r2.pc++;
          break;
        }
        case r$1.DEC: {
          const t2 = r2.stack.pop();
          if (t2 === void 0 || typeof t2 != "string") {
            r2.status = "error", r2.error = "DEC: Invalid variable name";
            break;
          }
          const e2 = r2.variables.get(t2) ?? 0, o2 = d(e2) - 1;
          r2.variables.set(t2, o2);
          const n2 = p2.arg === true;
          r2.stack.push(n2 ? d(e2) : o2), r2.pc++;
          break;
        }
        // Comparison operations
        case r$1.EQ: {
          const t2 = r2.stack.pop(), e2 = r2.stack.pop();
          if (e2 === void 0 || t2 === void 0) {
            r2.status = "error", r2.error = "EQ: Stack underflow";
            break;
          }
          if (f(e2) && o$1(t2) || o$1(e2) && f(t2))
            r2.stack.push(true);
          else if (o$1(e2) && o$1(t2))
            r2.stack.push(true);
          else {
            const o2 = d(e2), n2 = d(t2);
            !isNaN(o2) && !isNaN(n2) ? r2.stack.push(o2 === n2) : r2.stack.push(c(e2) === c(t2));
          }
          r2.pc++;
          break;
        }
        case r$1.NEQ: {
          const t2 = r2.stack.pop(), e2 = r2.stack.pop();
          if (e2 === void 0 || t2 === void 0) {
            r2.status = "error", r2.error = "NEQ: Stack underflow";
            break;
          }
          if (f(e2) && o$1(t2) || o$1(e2) && f(t2))
            r2.stack.push(false);
          else if (o$1(e2) && o$1(t2))
            r2.stack.push(false);
          else {
            const o2 = d(e2), n2 = d(t2);
            !isNaN(o2) && !isNaN(n2) ? r2.stack.push(o2 !== n2) : r2.stack.push(c(e2) !== c(t2));
          }
          r2.pc++;
          break;
        }
        case r$1.LT: {
          const t2 = r2.stack.pop(), e2 = r2.stack.pop();
          if (e2 === void 0 || t2 === void 0) {
            r2.status = "error", r2.error = "LT: Stack underflow";
            break;
          }
          const o2 = d(e2), n2 = d(t2);
          r2.stack.push(o2 < n2), r2.pc++;
          break;
        }
        case r$1.GT: {
          const t2 = r2.stack.pop(), e2 = r2.stack.pop();
          if (e2 === void 0 || t2 === void 0) {
            r2.status = "error", r2.error = "GT: Stack underflow";
            break;
          }
          const o2 = d(e2), n2 = d(t2);
          r2.stack.push(o2 > n2), r2.pc++;
          break;
        }
        case r$1.LTE: {
          const t2 = r2.stack.pop(), e2 = r2.stack.pop();
          if (e2 === void 0 || t2 === void 0) {
            r2.status = "error", r2.error = "LTE: Stack underflow";
            break;
          }
          const o2 = d(e2), n2 = d(t2);
          r2.stack.push(o2 <= n2), r2.pc++;
          break;
        }
        case r$1.GTE: {
          const t2 = r2.stack.pop(), e2 = r2.stack.pop();
          if (e2 === void 0 || t2 === void 0) {
            r2.status = "error", r2.error = "GTE: Stack underflow";
            break;
          }
          const o2 = d(e2), n2 = d(t2);
          r2.stack.push(o2 >= n2), r2.pc++;
          break;
        }
        case r$1.EQ_STRICT: {
          const t2 = r2.stack.pop(), e2 = r2.stack.pop();
          if (e2 === void 0 || t2 === void 0) {
            r2.status = "error", r2.error = "EQ_STRICT: Stack underflow";
            break;
          }
          r2.stack.push(e2 === t2), r2.pc++;
          break;
        }
        case r$1.NEQ_STRICT: {
          const t2 = r2.stack.pop(), e2 = r2.stack.pop();
          if (e2 === void 0 || t2 === void 0) {
            r2.status = "error", r2.error = "NEQ_STRICT: Stack underflow";
            break;
          }
          r2.stack.push(e2 !== t2), r2.pc++;
          break;
        }
        // Jump operations
        case r$1.JUMP: {
          if (p2.arg === void 0) {
            r2.status = "error", r2.error = "JUMP requires a target address";
            break;
          }
          const t2 = p2.arg;
          if (t2 < 0 || t2 >= a2.length) {
            r2.status = "error", r2.error = `Invalid jump target: ${t2}`;
            break;
          }
          r2.pc = t2;
          break;
        }
        case r$1.JUMP_IF_FALSE: {
          const t2 = r2.stack.pop();
          if (t2 === void 0) {
            r2.status = "error", r2.error = "JUMP_IF_FALSE: Stack underflow";
            break;
          }
          if (p2.arg === void 0) {
            r2.status = "error", r2.error = "JUMP_IF_FALSE requires a target address";
            break;
          }
          const e2 = p2.arg;
          if (e2 < 0 || e2 >= a2.length) {
            r2.status = "error", r2.error = `Invalid jump target: ${e2}`;
            break;
          }
          y(t2) ? r2.pc++ : r2.pc = e2;
          break;
        }
        case r$1.ITER_START: {
          if (r2.stack.length === 0) {
            r2.status = "error", r2.error = "ITER_START: Stack underflow";
            break;
          }
          const t2 = r2.stack.pop();
          if (t2 == null) {
            r2.status = "error", r2.error = "TypeError: Cannot iterate over null or undefined";
            break;
          }
          if (!e(t2)) {
            r2.status = "error", r2.error = "TypeError: Cannot iterate over non-array value";
            break;
          }
          if (r2.iterators.length >= 10) {
            r2.status = "error", r2.error = "RuntimeError: Maximum iterator depth exceeded";
            break;
          }
          const e$1 = p$1([...t2.elements]);
          r2.iterators.push({
            array: e$1,
            index: 0
          }), r2.pc++;
          break;
        }
        case r$1.ITER_NEXT: {
          if (r2.iterators.length === 0) {
            r2.status = "error", r2.error = "ITER_NEXT: No active iterator";
            break;
          }
          const t2 = r2.iterators[r2.iterators.length - 1];
          t2.index < t2.array.elements.length ? (r2.stack.push(t2.array.elements[t2.index]), r2.stack.push(true), t2.index++) : (r2.stack.push(null), r2.stack.push(false)), r2.pc++;
          break;
        }
        case r$1.ITER_END: {
          if (r2.iterators.length === 0) {
            r2.status = "error", r2.error = "ITER_END: No active iterator";
            break;
          }
          r2.iterators.pop(), r2.pc++;
          break;
        }
        // Logical operators
        case r$1.AND: {
          const t2 = r2.stack.pop(), e2 = r2.stack.pop();
          if (e2 === void 0 || t2 === void 0) {
            r2.status = "error", r2.error = "AND: Stack underflow";
            break;
          }
          y(e2) ? r2.stack.push(t2) : r2.stack.push(e2), r2.pc++;
          break;
        }
        case r$1.OR: {
          const t2 = r2.stack.pop(), e2 = r2.stack.pop();
          if (e2 === void 0 || t2 === void 0) {
            r2.status = "error", r2.error = "OR: Stack underflow";
            break;
          }
          y(e2) ? r2.stack.push(e2) : r2.stack.push(t2), r2.pc++;
          break;
        }
        case r$1.NOT: {
          const t2 = r2.stack.pop();
          if (t2 === void 0) {
            r2.status = "error", r2.error = "NOT: Stack underflow";
            break;
          }
          r2.stack.push(!y(t2)), r2.pc++;
          break;
        }
        case r$1.RETURN: {
          const t2 = r2.stack.pop() ?? null;
          r2.returnValue = t2, r2.status = "complete";
          break;
        }
        // String methods
        case r$1.STRING_SUBSTRING: {
          if (r2.stack.length < 2) {
            r2.status = "error", r2.error = "STRING_SUBSTRING: Stack underflow";
            break;
          }
          const t2 = r2.stack.length;
          let e2, o2, n$1;
          const A2 = r2.stack[t2 - 1], I = r2.stack[t2 - 2];
          if (t2 >= 3 && typeof A2 == "number" && typeof I == "number" ? (n$1 = r2.stack.pop(), o2 = r2.stack.pop(), e2 = r2.stack.pop()) : (o2 = r2.stack.pop(), e2 = r2.stack.pop(), n$1 = void 0), !n(e2)) {
            r2.status = "error", r2.error = "STRING_SUBSTRING requires a string";
            break;
          }
          if (typeof o2 != "number") {
            r2.status = "error", r2.error = "STRING_SUBSTRING requires numeric start index";
            break;
          }
          const T = e2.length;
          o2 < 0 && (o2 = Math.max(0, T + o2)), n$1 !== void 0 && n$1 < 0 && (n$1 = Math.max(0, T + n$1));
          const y2 = n$1 !== void 0 ? e2.substring(o2, n$1) : e2.substring(o2);
          r2.stack.push(y2), r2.pc++;
          break;
        }
        case r$1.STRING_INDEXOF: {
          const t2 = r2.stack.pop(), e2 = r2.stack.pop();
          if (t2 === void 0 || e2 === void 0) {
            r2.status = "error", r2.error = "STRING_INDEXOF: Stack underflow";
            break;
          }
          if (!n(e2) || !n(t2)) {
            r2.status = "error", r2.error = "STRING_INDEXOF requires string arguments";
            break;
          }
          r2.stack.push(e2.indexOf(t2)), r2.pc++;
          break;
        }
        case r$1.STRING_SPLIT: {
          const t2 = r2.stack.pop(), e2 = r2.stack.pop();
          if (t2 === void 0 || e2 === void 0) {
            r2.status = "error", r2.error = "STRING_SPLIT: Stack underflow";
            break;
          }
          if (!n(e2) || !n(t2)) {
            r2.status = "error", r2.error = "STRING_SPLIT requires string arguments";
            break;
          }
          let o2;
          t2 === "" ? o2 = e2.split("") : o2 = e2.split(t2), r2.stack.push(p$1(o2)), r2.pc++;
          break;
        }
        default:
          r2.status = "error", r2.error = `Unknown opcode: ${p2.op} (type: ${typeof p2.op})`;
      }
    }
    return r2;
  }
  resume(a2, s2, r2) {
    if (a2.status !== "waiting_cc")
      throw new Error("Cannot resume: VM not waiting for CC");
    const p2 = {
      ...a2,
      stack: [...a2.stack, s2],
      status: "running",
      ccPrompt: void 0,
      pc: a2.pc + 1
    };
    return this.execute(r2, p2);
  }
}
class D {
  constructor(a2) {
    E(this, "vms", /* @__PURE__ */ new Map());
    E(this, "storage");
    a2 ? this.storage = a2 : this.storage = g.create();
  }
  /**
   * Initialize the VMManager (connect to database)
   */
  async initialize() {
    await this.storage.connect();
  }
  /**
   * Cleanup resources
   */
  async dispose() {
    await this.storage.disconnect(), this.vms.clear();
  }
  /**
   * Load and compile a program from source code
   */
  async loadProgram(a2, s2) {
    const r2 = N(s2);
    if (!r2.success)
      throw new Error(`Compilation failed: ${r2.errors.join(", ")}`);
    const p2 = {
      id: a2,
      name: a2,
      source: s2,
      bytecode: r2.bytecode,
      // VM decides internal format
      created: /* @__PURE__ */ new Date()
    };
    await this.storage.saveProgram(p2);
  }
  /**
   * Start execution of a loaded program
   */
  async startExecution(a2, s2) {
    if (!await this.storage.getProgram(a2))
      throw new Error(`Program not found: ${a2}`);
    const p2 = {
      id: s2,
      programId: a2,
      state: "READY",
      pc: 0,
      stack: [],
      variables: {},
      created: /* @__PURE__ */ new Date()
    };
    await this.storage.saveExecution(p2);
    const f2 = new w();
    this.vms.set(s2, f2);
  }
  /**
   * Get next action from execution (Claude polls this)
   * This is READ-ONLY - just returns current state
   */
  async getNext(a2) {
    const s2 = await this.storage.getExecution(a2);
    if (!s2)
      throw new Error(`Execution not found: ${a2}`);
    if (s2.state === "READY") {
      const r2 = await this.storage.getProgram(s2.programId);
      if (!r2)
        throw new Error(`Program not found: ${s2.programId}`);
      let p2 = this.vms.get(a2);
      p2 || (p2 = new w(), this.vms.set(a2, p2));
      const f2 = {
        pc: 0,
        stack: [],
        variables: /* @__PURE__ */ new Map(),
        output: []
      }, u2 = p2.execute(r2.bytecode, f2);
      if (u2.output.length > 0 && await this.storage.appendOutput(a2, u2.output), s2.pc = u2.pc, s2.stack = u2.stack, s2.variables = Object.fromEntries(u2.variables), u2.status === "complete")
        return s2.state = "COMPLETED", u2.returnValue !== void 0 && (s2.returnValue = u2.returnValue), await this.storage.saveExecution(s2), this.vms.delete(a2), {
          type: "completed",
          message: "Execution completed",
          result: u2.returnValue
        };
      if (u2.status === "waiting_cc")
        return s2.state = "AWAITING_COGNITIVE_RESULT", s2.ccPrompt = u2.ccPrompt, await this.storage.saveExecution(s2), {
          type: "waiting",
          message: u2.ccPrompt || "Waiting for input"
        };
      if (u2.status === "error")
        return s2.state = "ERROR", s2.error = u2.error, await this.storage.saveExecution(s2), this.vms.delete(a2), {
          type: "error",
          error: u2.error
        };
    }
    if (s2.state === "COMPLETED")
      return {
        type: "completed",
        message: "Execution completed"
      };
    if (s2.state === "ERROR")
      return {
        type: "error",
        error: s2.error || "Unknown error"
      };
    if (s2.state === "AWAITING_COGNITIVE_RESULT")
      return {
        type: "waiting",
        message: s2.ccPrompt || "Waiting for input"
      };
    throw new Error(`Unexpected execution state: ${s2.state}`);
  }
  /**
   * Report result from cognitive operation and continue execution
   */
  async reportCCResult(a2, s2) {
    const r2 = await this.storage.getExecution(a2);
    if (!r2)
      throw new Error(`Execution not found: ${a2}`);
    const p2 = await this.storage.getProgram(r2.programId);
    if (!p2)
      throw new Error(`Program not found: ${r2.programId}`);
    let f2 = this.vms.get(a2);
    f2 || (f2 = new w(), this.vms.set(a2, f2));
    const u2 = {
      pc: r2.pc,
      stack: r2.stack,
      variables: new Map(Object.entries(r2.variables)),
      status: "waiting_cc",
      output: [],
      // Start with empty output for resumed execution
      ccPrompt: void 0,
      iterators: []
      // TODO: persist iterators in future
    }, k = f2.resume(u2, s2, p2.bytecode);
    k.output.length > 0 && await this.storage.appendOutput(a2, k.output), r2.pc = k.pc, r2.stack = k.stack, r2.variables = Object.fromEntries(k.variables), k.status === "complete" ? (r2.state = "COMPLETED", k.returnValue !== void 0 && (r2.returnValue = k.returnValue), this.vms.delete(a2)) : k.status === "error" ? (r2.state = "ERROR", r2.error = k.error, this.vms.delete(a2)) : k.status === "waiting_cc" ? (r2.state = "AWAITING_COGNITIVE_RESULT", r2.ccPrompt = k.ccPrompt) : r2.state = "RUNNING", await this.storage.saveExecution(r2);
  }
  /**
   * Get current execution status
   */
  async getExecutionStatus(a2) {
    const s2 = await this.storage.getExecution(a2);
    if (!s2)
      throw new Error(`Execution not found: ${a2}`);
    return {
      id: s2.id,
      state: s2.state,
      pc: s2.pc,
      stack: s2.stack,
      variables: s2.variables
    };
  }
  /**
   * Get output for an execution
   */
  async getExecutionOutput(a2) {
    return await this.storage.getOutput(a2);
  }
}
var i = Object.defineProperty;
var a = (s2, r2, t2) => r2 in s2 ? i(s2, r2, { enumerable: true, configurable: true, writable: true, value: t2 }) : s2[r2] = t2;
var o = (s2, r2, t2) => a(s2, typeof r2 != "symbol" ? r2 + "" : r2, t2);
class v {
  constructor(r2 = "0.0.1") {
    o(this, "server");
    o(this, "transport", null);
    o(this, "vmManager");
    o(this, "version");
    this.version = r2, this.vmManager = new D(), this.server = new mcp_js.McpServer({
      name: "cvm-server",
      version: this.version
    }), this.setupTools();
  }
  getName() {
    return "cvm-server";
  }
  getVersion() {
    return this.version;
  }
  setupTools() {
    this.server.tool(
      "load",
      {
        programId: zod.z.string(),
        source: zod.z.string()
      },
      async ({ programId: r2, source: t2 }) => {
        try {
          return await this.vmManager.loadProgram(r2, t2), {
            content: [{ type: "text", text: `Program loaded successfully: ${r2}` }]
          };
        } catch (e2) {
          return {
            content: [{ type: "text", text: `Error: ${e2 instanceof Error ? e2.message : "Unknown error"}` }],
            isError: true
          };
        }
      }
    ), this.server.tool(
      "start",
      {
        programId: zod.z.string(),
        executionId: zod.z.string()
      },
      async ({ programId: r2, executionId: t2 }) => {
        try {
          return await this.vmManager.startExecution(r2, t2), {
            content: [{ type: "text", text: `Execution started: ${t2}` }]
          };
        } catch (e2) {
          return {
            content: [{ type: "text", text: `Error: ${e2 instanceof Error ? e2.message : "Unknown error"}` }],
            isError: true
          };
        }
      }
    ), this.server.tool(
      "getTask",
      {
        executionId: zod.z.string()
      },
      async ({ executionId: r2 }) => {
        try {
          const t2 = await this.vmManager.getNext(r2);
          return t2.type === "completed" ? {
            content: [{ type: "text", text: t2.result !== void 0 ? `Execution completed with result: ${JSON.stringify(t2.result)}` : "Execution completed" }]
          } : t2.type === "waiting" ? {
            content: [{ type: "text", text: t2.message || "Waiting for input" }]
          } : t2.type === "error" ? {
            content: [{ type: "text", text: `Error: ${t2.error}` }],
            isError: true
          } : {
            content: [{ type: "text", text: "Unexpected state" }],
            isError: true
          };
        } catch (t2) {
          return {
            content: [{ type: "text", text: `Error: ${t2 instanceof Error ? t2.message : "Unknown error"}` }],
            isError: true
          };
        }
      }
    ), this.server.tool(
      "submitTask",
      {
        executionId: zod.z.string(),
        result: zod.z.string()
      },
      async ({ executionId: r2, result: t2 }) => {
        try {
          return await this.vmManager.reportCCResult(r2, t2), {
            content: [{ type: "text", text: "Execution resumed" }]
          };
        } catch (e2) {
          return {
            content: [{ type: "text", text: `Error: ${e2 instanceof Error ? e2.message : "Unknown error"}` }],
            isError: true
          };
        }
      }
    ), this.server.tool(
      "status",
      {
        executionId: zod.z.string()
      },
      async ({ executionId: r2 }) => {
        try {
          const t2 = await this.vmManager.getExecutionStatus(r2);
          return {
            content: [{ type: "text", text: JSON.stringify(t2, null, 2) }]
          };
        } catch (t2) {
          return {
            content: [{ type: "text", text: `Error: ${t2 instanceof Error ? t2.message : "Unknown error"}` }],
            isError: true
          };
        }
      }
    );
  }
  async start(r2) {
    await this.vmManager.initialize(), this.transport = r2 || new stdio_js.StdioServerTransport(), await this.server.connect(this.transport);
  }
  async stop() {
    this.transport && (await this.transport.close(), this.transport = null), await this.vmManager.dispose();
  }
  // For testing - expose VMManager for direct testing
  getVMManager() {
    return this.vmManager;
  }
}
dotenv__namespace.config({ path: c$1.resolve(__dirname, "../../../.env") });
function loadConfig() {
  const env = process.env.NODE_ENV || "development";
  const storageType = process.env.CVM_STORAGE_TYPE || "file";
  const mongoUri = process.env.MONGODB_URI;
  const dataDir = process.env.CVM_DATA_DIR;
  if (storageType === "mongodb" && !mongoUri) {
    throw new Error("MONGODB_URI environment variable is required when CVM_STORAGE_TYPE is mongodb");
  }
  const logLevel = process.env.CVM_LOG_LEVEL || "info";
  const validLogLevels = ["debug", "info", "warn", "error"];
  if (!validLogLevels.includes(logLevel)) {
    throw new Error(`Invalid CVM_LOG_LEVEL: ${logLevel}. Must be one of: ${validLogLevels.join(", ")}`);
  }
  const maxExecutionTime = parseInt(process.env.CVM_MAX_EXECUTION_TIME || "300000", 10);
  const maxStackSize = parseInt(process.env.CVM_MAX_STACK_SIZE || "1000", 10);
  const maxOutputSize = parseInt(process.env.CVM_MAX_OUTPUT_SIZE || "1048576", 10);
  return {
    storage: {
      type: storageType,
      mongoUri,
      dataDir
    },
    logging: {
      level: logLevel
    },
    execution: {
      maxExecutionTime,
      maxStackSize,
      maxOutputSize
    },
    env
  };
}
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};
class Logger {
  levelValue;
  constructor(level) {
    this.levelValue = LOG_LEVELS[level];
  }
  log(level, message, ...args) {
    if (LOG_LEVELS[level] >= this.levelValue) {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
      if (args.length > 0) {
        console.error(prefix, message, ...args);
      } else {
        console.error(prefix, message);
      }
    }
  }
  debug(message, ...args) {
    this.log("debug", message, ...args);
  }
  info(message, ...args) {
    this.log("info", message, ...args);
  }
  warn(message, ...args) {
    this.log("warn", message, ...args);
  }
  error(message, ...args) {
    this.log("error", message, ...args);
  }
}
let logger;
function initLogger(level) {
  logger = new Logger(level);
  return logger;
}
function getLogger() {
  if (!logger) {
    throw new Error("Logger not initialized. Call initLogger() first.");
  }
  return logger;
}
const __filename$1 = url.fileURLToPath(typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("main.cjs", document.baseURI).href);
const __dirname$1 = c$1.dirname(__filename$1);
async function main() {
  let cvmServer;
  try {
    const config = loadConfig();
    initLogger(config.logging.level);
    const logger2 = getLogger();
    let version = "0.4.3";
    const possiblePaths = [
      c$1.join(__dirname$1, "..", "package.json"),
      // Development
      c$1.join(__dirname$1, "package.json"),
      // Bundled dist
      c$1.join(process.cwd(), "package.json")
      // Current directory
    ];
    for (const packageJsonPath of possiblePaths) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        if (packageJson.name === "cvm-server" && packageJson.version) {
          version = packageJson.version;
          break;
        }
      } catch (e2) {
      }
    }
    logger2.info("Starting CVM Server...", {
      env: config.env,
      logLevel: config.logging.level,
      version
    });
    if (config.storage.type === "file") {
      const dataDir = config.storage.dataDir || ".cvm";
      const fullPath = c$1.resolve(process.cwd(), dataDir);
      logger2.info(`[CVM] Initializing file storage in: ${fullPath}`);
      logger2.warn(`[CVM] ⚠️  Remember to add '${dataDir}/' to your .gitignore file!`);
    } else {
      logger2.info("[CVM] Using MongoDB storage");
    }
    cvmServer = new v(version);
    await cvmServer.start();
    logger2.info("CVM Server is running and ready to accept MCP connections");
    process.on("SIGINT", async () => {
      logger2.info("Received SIGINT, shutting down gracefully...");
      await shutdown();
    });
    process.on("SIGTERM", async () => {
      logger2.info("Received SIGTERM, shutting down gracefully...");
      await shutdown();
    });
  } catch (error) {
    console.error("Fatal error starting CVM Server:", error);
    process.exit(1);
  }
  async function shutdown() {
    const logger2 = getLogger();
    try {
      logger2.info("Closing connections...");
      if (cvmServer) {
        await cvmServer.stop();
      }
      logger2.info("Shutdown complete");
      process.exit(0);
    } catch (error) {
      logger2.error("Error during shutdown:", error);
      process.exit(1);
    }
  }
}
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
