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
  StoreStatement,
  FunctionParameter,
  ExternalFunctionDeclaration,
  Component,
} from "#compiler/ast";
import { PatternMatch } from "#compiler/location";
import { LinkerError } from "../error";

export function AccessingType(subject: AccessExpression) {
  const accessing = ResolveExpression(subject.Subject);
  if (
    accessing instanceof StoreStatement ||
    accessing instanceof FunctionParameter
  ) {
    const type = accessing.Type;
    if (!type) throw new LinkerError(accessing.Location, "Could not find type");
    const accessing_type = ResolveType(type);
    if (
      (accessing_type instanceof StructEntity ||
        accessing_type instanceof SchemaEntity ||
        accessing_type instanceof SchemaType) &&
      accessing_type.HasKey(subject.Target)
    ) {
      const key = accessing_type.GetKey(subject.Target);
      if (key) return key.Type;
    }
  }
}

export function ResolveType(
  type: Type
): StructEntity | SchemaEntity | SchemaType | PrimitiveType | FunctionType {
  return PatternMatch(
    StructEntity,
    SchemaEntity,
    SchemaType,
    ReferenceType,
    PrimitiveType,
    AccessExpression,
    FunctionParameter,
    FunctionEntity
  )(
    (s) => s,
    (s) => s,
    (s) => s,
    (r) => {
      const target = r.References;
      if (!target) throw new LinkerError(r.Location, "Missing reference");

      return ResolveType(target);
    },
    (p) => p,
    (a) => {
      const accessing = AccessingType(a);
      if (!accessing)
        throw new LinkerError(a.Location, "Could not resolve type of access");
      return ResolveType(accessing);
    },
    (p) => {
      const type = p.Type;
      if (!type) throw new LinkerError(p.Location, "Untyped function argument");
      return ResolveType(type);
    },
    (f) => {
      const type = f.Returns;
      if (!type) throw new LinkerError(f.Location, "Untyped function return");
      return new FunctionType(f.Location, f.Parameters, type);
    }
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

export function ResolveBlockType(block: ComponentGroup) {
  for (const statement of block.iterator())
    if (statement instanceof ReturnStatement && statement.Value) {
      return ResolveExpressionType(statement.Value);
    }

  throw new LinkerError(block.First.Location, "All blocks must return a value");
}

export function ResolveExpressionType(
  expression: Expression
): Type | StructEntity | SchemaEntity {
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
    SchemaType,
    FunctionParameter,
    FunctionEntity,
    PrimitiveType,
    BuiltInFunction,
    StoreStatement
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
      return ResolveExpressionType(operator.Right);
    },
    (if_) => {
      return ResolveBlockType(if_.If);
    },
    (iterate) => {
      return ResolveBlockType(iterate.Body);
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

      return ResolveExpressionType(reference.References);
    },
    (bracket) => {
      return ResolveExpressionType(bracket.Expression);
    },
    (lambda) => {
      return new FunctionType(
        lambda.Location,
        lambda.Parameters,
        ResolveBlock(lambda.Body)
      );
    },
    (invoke) => {
      const subject = ResolveExpressionType(invoke.Subject);
      const parse_function_type = (t: Component | undefined) => {
        if (!t)
          throw new LinkerError(
            invoke.Location,
            "Could not find a function type"
          );

        return PatternMatch(FunctionType)((f) => f.Returns)(t);
      };

      return PatternMatch(
        FunctionEntity,
        LambdaExpression,
        BuiltInFunction,
        ExternalFunctionDeclaration,
        FunctionParameter,
        FunctionType,
        StoreStatement,
        StructEntity
      )(
        (f) => {
          if (!f.Returns)
            throw new LinkerError(
              f.Location,
              "Could not find function return type"
            );
          return f.Returns;
        },
        (l) => ResolveBlockType(l.Body),
        (b) => b.Returns,
        (e) => e.Returns,
        (p) => parse_function_type(p.Type),
        (f) => {
          if (!f.Returns)
            throw new LinkerError(
              f.Location,
              "Could not find function return type"
            );
          return f.Returns;
        },
        (s) => {
          const type = ResolveExpressionType(s.Equals);
          if (!(type instanceof FunctionType))
            throw new LinkerError(
              s.Location,
              "May only invoke function store types"
            );

          return type.Returns;
        },
        (s) => s
      )(subject);
    },
    (access) => {
      const subject = ResolveExpressionType(access.Subject);
      return PatternMatch(StructEntity, SchemaEntity, SchemaType)(
        (struct) => {
          const result = struct.GetKey(access.Target);
          if (!result)
            throw new LinkerError(access.Location, "Cannot resolve access");

          return result;
        },
        (struct) => {
          const result = struct.GetKey(access.Target);
          if (!result)
            throw new LinkerError(access.Location, "Cannot resolve access");

          return result;
        },
        (struct) => {
          const result = struct.GetKey(access.Target);
          if (!result)
            throw new LinkerError(access.Location, "Cannot resolve access");

          return result;
        }
      )(subject);
    },
    (schema) => {
      return schema;
    },
    (p) => {
      if (!p.Type)
        throw new LinkerError(p.Location, "Unresolved parameter type");
      return p.Type;
    },
    (f) => {
      if (!f.Returns)
        throw new LinkerError(f.Location, "Unresolved function return type");
      return new FunctionType(f.Location, f.Parameters, f.Returns);
    },
    (p) => p,
    (f) => {
      if (!f.Returns)
        throw new LinkerError(f.Location, "Unresolved function return type");
      return new FunctionType(f.Location, f.Parameters, f.Returns);
    },
    (store) => {
      return ResolveExpressionType(store.Equals);
    }
  )(expression);
}
