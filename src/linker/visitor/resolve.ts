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
  IterableType,
  PrimitiveType,
  FunctionType,
  ComponentGroup,
  FunctionParameter,
  SchemaType,
  SchemaEntity,
} from "#compiler/ast";
import { PatternMatch } from "#compiler/location";
import { LinkerError } from "../error";

export function ResolveBlock(block: ComponentGroup) {
  for (const statement of block.iterator())
    if (statement instanceof ReturnStatement && statement.Value) {
      return ResolveExpression(statement.Value);
    }

  throw new LinkerError(block.First.Location, "All blocks must return a value");
}

export function ResolveExpression(
  expression: Expression
): Type | StructEntity | FunctionEntity | SchemaType {
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
    (literal): Type | StructEntity | FunctionEntity | SchemaType => {
      if (literal.Type === "string") {
        return new IterableType(
          literal.Location,
          new PrimitiveType(literal.Location, "char")
        );
      }

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
      const subject = ResolveExpression(invoke.Subject);

      if (subject instanceof FunctionEntity) {
        return subject.Returns ?? ResolveBlock(subject.Content);
      }

      if (subject instanceof FunctionType) {
        return subject.Returns;
      }

      if (subject instanceof LambdaExpression) {
        return ResolveBlock(subject.Body);
      }

      if (subject instanceof FunctionParameter) {
        const type = subject.Type;
        if (type instanceof FunctionType) {
          return type.Returns;
        }
      }

      throw new Error("Attempting to invoke a none function");
    },
    (access) => {
      const references = ResolveExpression(access.Subject);

      if (
        !(references instanceof StructEntity) &&
        !(references instanceof SchemaType) &&
        !(references instanceof SchemaEntity)
      )
        throw new LinkerError(
          access.Location,
          "Attempting to access a none struct"
        );

      const property = references.GetKey(access.Target);
      if (!property)
        throw new LinkerError(access.Location, "Target has no key");

      return property.Type;
    },
    (schema) => {
      return schema;
    }
  )(expression);
}
