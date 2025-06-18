import { Instruction, OpCode } from './bytecode.js';

export interface JumpContext {
  type: 'if' | 'loop';
  breakTargets?: number[];      // For loops: break statement targets
  continueTargets?: number[];   // For loops: continue statement targets
  elseTarget?: number;          // For if: else block target
  endTargets: number[];         // Common: where to jump after block
  startAddress?: number;        // For loops: loop start for continue
}

export class CompilerState {
  private bytecode: Instruction[] = [];
  private contextStack: JumpContext[] = [];

  /**
   * Emit an instruction and return its index
   */
  emit(op: OpCode, arg?: any): number {
    const index = this.bytecode.length;
    this.bytecode.push({ op, arg });
    return index;
  }

  /**
   * Get the current address (next instruction index)
   */
  currentAddress(): number {
    return this.bytecode.length;
  }

  /**
   * Patch a jump instruction with the target address
   */
  patchJump(instructionIndex: number, targetAddress: number): void {
    if (instructionIndex >= 0 && instructionIndex < this.bytecode.length) {
      this.bytecode[instructionIndex].arg = targetAddress;
    }
  }

  /**
   * Patch multiple jump instructions with the same target
   */
  patchJumps(instructionIndices: number[], targetAddress: number): void {
    instructionIndices.forEach(idx => this.patchJump(idx, targetAddress));
  }

  /**
   * Push a new jump context onto the stack
   */
  pushContext(context: JumpContext): void {
    this.contextStack.push(context);
  }

  /**
   * Pop the current jump context from the stack
   */
  popContext(): JumpContext | null {
    return this.contextStack.pop() || null;
  }

  /**
   * Get the current context without removing it
   */
  getCurrentContext(): JumpContext | null {
    return this.contextStack.length > 0 
      ? this.contextStack[this.contextStack.length - 1] 
      : null;
  }

  /**
   * Find the nearest loop context (for break/continue)
   */
  findLoopContext(): JumpContext | null {
    for (let i = this.contextStack.length - 1; i >= 0; i--) {
      if (this.contextStack[i].type === 'loop') {
        return this.contextStack[i];
      }
    }
    return null;
  }

  /**
   * Get the final bytecode array
   */
  getBytecode(): Instruction[] {
    return this.bytecode;
  }

  /**
   * Check if compilation is in a valid state
   */
  isValid(): boolean {
    return this.contextStack.length === 0;
  }

  /**
   * Get any unclosed contexts (for error reporting)
   */
  getUnclosedContexts(): JumpContext[] {
    return [...this.contextStack];
  }
}