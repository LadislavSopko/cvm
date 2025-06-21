import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { ExpressionVisitor } from '../visitor-types.js';

export const compileObjectLiteral: ExpressionVisitor<ts.ObjectLiteralExpression> = (
  node,
  state,
  { compileExpression }
) => {
  // Emit OBJECT_CREATE to create a new empty object
  state.emit(OpCode.OBJECT_CREATE);
  
  // Process each property assignment
  for (const property of node.properties) {
    if (ts.isPropertyAssignment(property)) {
      // Get the property name
      let propertyName: string;
      
      if (ts.isIdentifier(property.name)) {
        propertyName = property.name.text;
      } else if (ts.isStringLiteral(property.name)) {
        propertyName = property.name.text;
      } else {
        throw new Error('Computed property names are not supported');
      }
      
      // Push property name
      state.emit(OpCode.PUSH, propertyName);
      
      // Compile the property value
      compileExpression(property.initializer);
      
      // Set the property
      state.emit(OpCode.PROPERTY_SET);
    } else if (ts.isShorthandPropertyAssignment(property)) {
      // Handle shorthand like { x } which is { x: x }
      const propertyName = property.name.text;
      
      // Push property name
      state.emit(OpCode.PUSH, propertyName);
      
      // Load the variable value
      state.emit(OpCode.LOAD, propertyName);
      
      // Set the property
      state.emit(OpCode.PROPERTY_SET);
    } else {
      throw new Error('Unsupported property type in object literal');
    }
  }
};