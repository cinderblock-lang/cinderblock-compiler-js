import {
  Expression,
  LiteralExpression,
  OperatorExpression,
  IfExpression,
  IterateExpression,
  MakeExpression,
  IsExpression,
  ReferenceExpression,
  BracketsExpression,
  LambdaExpression,
  InvokationExpression,
  AccessExpression,
  StructEntity,
  FunctionEntity,
  ReturnStatement,
  Type,
  PrimitiveType,
  FunctionType,
  ComponentGroup,
  SchemaType,
  SchemaEntity,
  ReferenceType,
  BuiltInFunction,
} from "#compiler/ast";
import { PatternMatch } from "#compiler/location";
import { LinkerError } from "../error";

export function ResolveType(
  type: Type
): StructEntity | SchemaEntity | SchemaType | PrimitiveType {
  return PatternMatch(
    StructEntity,
    SchemaEntity,
    SchemaType,
    ReferenceType,
    PrimitiveType
  )(
    (s) => s,
    (s) => s,
    (s) => s,
    (r) => {
      const target = r.References;
      if (!target) throw new LinkerError(r.Location, "Missing reference");

      return ResolveType(target);
    },
    (p) => p
  )(type);
}

export function ResolveBlock(block: ComponentGroup) {
  for (const statement of block.iterator())
    if (statement instanceof ReturnStatement && statement.Value) {
      return ResolveExpression(statement.Value);
    }

  throw new LinkerError(block.First.Location, "All blocks must return a value");
}

export function ResolveExpression(
  expression: Expression
): Type | StructEntity | FunctionEntity | SchemaType | BuiltInFunction {
  return PatternMatch(
    LiteralExpression,
    OperatorExpression,
    IfExpression,
    IterateExpression,
    MakeExpression,
    IsExpression,
    ReferenceExpression,
    BracketsExpression,
    LambdaExpression,
    InvokationExpression,
    AccessExpression,
    SchemaType
  )(
    (
      literal
    ): Type | StructEntity | FunctionEntity | SchemaType | BuiltInFunction => {
      return new PrimitiveType(
        literal.Location,
        literal.Type === "char"
          ? "char"
          : literal.Type === "double"
          ? "double"
          : literal.Type === "float"
          ? "float"
          : literal.Type === "int"
          ? "int"
          : literal.Type === "long"
          ? "long"
          : literal.Type === "bool"
          ? "bool"
          : literal.Type === "string"
          ? "string"
          : "any"
      );
    },
    (operator) => {
      return ResolveExpression(operator.Right);
    },
    (if_) => {
      for (const statement of if_.If.iterator())
        if (statement instanceof ReturnStatement)
          return ResolveExpression(statement.Value);

      throw new LinkerError(
        if_.Location,
        "If statements must have a return value"
      );
    },
    (iterate) => {
      for (const statement of iterate.Body.iterator())
        if (statement instanceof ReturnStatement)
          return ResolveExpression(statement.Value);

      throw new LinkerError(iterate.Location, "Loops must have a return value");
    },
    (make) => {
      const entity = make.StructEntity;
      if (!entity)
        throw new LinkerError(make.Location, "Could not resolve struct");
      return entity;
    },
    (is) => {
      return new PrimitiveType(is.Location, "bool");
    },
    (reference) => {
      if (!reference.References)
        throw new LinkerError(reference.Location, "Unresolved reference");

      return reference.References;
    },
    (bracket) => {
      return ResolveExpression(bracket.Expression);
    },
    (lambda) => {
      return new FunctionType(
        lambda.Location,
        lambda.Parameters,
        ResolveBlock(lambda.Body)
      );
    },
    (invoke) => {
      return ResolveExpression(invoke.Subject);
    },
    (access) => {
      return ResolveExpression(access.Subject);
    },
    (schema) => {
      return schema;
    }
  )(expression);
}
