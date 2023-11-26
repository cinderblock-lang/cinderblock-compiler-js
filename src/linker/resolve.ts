import { Component } from "../ast/component";
import { ComponentGroup } from "../ast/component-group";
import { BuiltInFunction } from "../ast/entity/built-in-function";
import { ExternalFunctionDeclaration } from "../ast/entity/external-function-declaration";
import { FunctionEntity } from "../ast/entity/function";
import { SchemaEntity } from "../ast/entity/schema";
import { StructEntity } from "../ast/entity/struct";
import { AccessExpression } from "../ast/expression/access";
import { Expression } from "../ast/expression/base";
import { BracketsExpression } from "../ast/expression/brackets";
import { IfExpression } from "../ast/expression/if";
import { InvokationExpression } from "../ast/expression/invokation";
import { IsExpression } from "../ast/expression/is";
import { IterateExpression } from "../ast/expression/iterate";
import { LambdaExpression } from "../ast/expression/lambda";
import { LiteralExpression } from "../ast/expression/literal";
import { MakeExpression } from "../ast/expression/make";
import { OperatorExpression } from "../ast/expression/operator";
import { ReferenceExpression } from "../ast/expression/reference";
import { FunctionParameter } from "../ast/function-parameter";
import { Property } from "../ast/property";
import { RawStatement } from "../ast/statement/raw";
import { ReturnStatement } from "../ast/statement/return";
import { StoreStatement } from "../ast/statement/store";
import { Type } from "../ast/type/base";
import { FunctionType } from "../ast/type/function";
import { PrimitiveType } from "../ast/type/primitive";
import { ReferenceType } from "../ast/type/reference";
import { SchemaType } from "../ast/type/schema";
import { UseType } from "../ast/type/use";
import { WriterContext } from "../ast/writer";
import { PatternMatch } from "../location/pattern-match";
import { LinkerError } from "./error";
import { IsAnyInvokable } from "./types";

export function FindType(name: string, ctx: WriterContext) {
  if (ctx.use_types[name]) return ctx.use_types[name];

  for (const area of ctx.using) {
    const full = `${area}.${name}`;
    const possible = ctx.global_types[full];
    if (!possible) continue;

    if (area === ctx.namespace) return possible;

    if (possible.Exported) return possible;
  }

  return undefined;
}

export function FindReference(name: string, ctx: WriterContext) {
  if (ctx.locals[name]) return ctx.locals[name];

  if (ctx.parameters[name]) return ctx.parameters[name];

  if (ctx.global_functions[ctx.namespace + "." + name])
    return ctx.global_functions[ctx.namespace + "." + name];

  const possible = ctx.global_functions[name];
  if (possible) return possible;

  for (const area of ctx.using) {
    const full = `${area}.${name}`;
    const possible = ctx.global_functions[full];
    if (!possible) continue;

    if (possible instanceof BuiltInFunction) return possible;

    if (area === ctx.namespace) return possible;

    if (possible instanceof ExternalFunctionDeclaration) continue;

    if (possible.Exported) return possible;
  }

  return undefined;
}

export function ResolveType(
  type: Type | StructEntity | SchemaEntity,
  ctx: WriterContext
): Component {
  return PatternMatch(
    StructEntity,
    SchemaEntity,
    SchemaType,
    ReferenceType,
    PrimitiveType,
    AccessExpression,
    FunctionParameter,
    FunctionEntity,
    UseType,
    FunctionType,
    Property
  )(
    (s) => s,
    (s) => s,
    (s) => s,
    (r) => {
      const target = FindType(r.Name, ctx);
      if (!target)
        throw new LinkerError(r.CodeLocation, "Could not resolve symbol");

      return ResolveType(target, ctx);
    },
    (p) => p,
    (a) => {
      const accessing = ResolveExpressionType(a.Subject, ctx);

      const fallback = () => {
        const possible = FindReference(a.Target, ctx);
        if (!possible)
          throw new LinkerError(a.CodeLocation, "Could not resolve symbol");
        return PatternMatch(
          FunctionEntity,
          ExternalFunctionDeclaration,
          BuiltInFunction,
          Component
        )(
          (f): Component => f,
          (f) => f,
          (f) => f,
          () => {
            throw new LinkerError(a.CodeLocation, "Could not resolve symbol");
          }
        )(possible);
      };

      return PatternMatch(StructEntity, SchemaEntity, SchemaType, Component)(
        (s) => {
          const type = s.GetKey(a.Target);
          if (!type) return fallback();
          return type;
        },
        (s) => {
          const type = s.GetKey(a.Target);
          if (!type) return fallback();
          return type;
        },
        (s) => {
          const type = s.GetKey(a.Target);
          if (!type) return fallback();
          return type;
        },
        fallback
      )(accessing);
    },
    (p) => {
      const type = p.Type;
      if (!type)
        throw new LinkerError(p.CodeLocation, "Untyped function argument");
      return ResolveType(type, ctx);
    },
    (f) => {
      const type = f.Returns;
      if (!type)
        throw new LinkerError(f.CodeLocation, "Untyped function return");
      return new FunctionType(f.CodeLocation, f.Parameters, type);
    },
    (u) => {
      return u;
    },
    (f) => {
      return f;
    },
    (p) => {
      return ResolveType(p.Type, ctx);
    }
  )(type);
}

export function ResolveBlockType(block: ComponentGroup, ctx: WriterContext) {
  ctx = {
    ...ctx,
    locals: {
      ...ctx.locals,
    },
  };
  for (const statement of block.iterator()) {
    if (statement instanceof StoreStatement) {
      ctx.locals[statement.Name] = statement;
    }

    if (statement instanceof RawStatement) {
      ctx.locals[statement.Reference] = statement;
    }

    if (statement instanceof ReturnStatement) {
      return ResolveExpressionType(statement.Value, ctx);
    }
  }

  throw new LinkerError(
    block.First.CodeLocation,
    "All blocks must return a value"
  );
}

export function ResolveExpressionType(
  expression: Expression,
  ctx: WriterContext
): Component {
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
    StoreStatement,
    UseType,
    ReferenceType,
    Property,
    FunctionType,
    StructEntity,
    RawStatement
  )(
    (literal): Component => {
      return new PrimitiveType(
        literal.CodeLocation,
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
      return ResolveExpressionType(operator.Right, ctx);
    },
    (if_) => {
      return ResolveBlockType(if_.If, ctx);
    },
    (iterate) => {
      return ResolveBlockType(iterate.Body, ctx);
    },
    (make) => {
      const entity = FindType(make.Struct, ctx);
      if (!entity || !(entity instanceof StructEntity))
        throw new LinkerError(make.CodeLocation, "Could not resolve struct");
      return entity;
    },
    (is) => {
      return new PrimitiveType(is.CodeLocation, "bool");
    },
    (reference) => {
      const target = FindReference(reference.Name, ctx);
      if (!target)
        throw new LinkerError(reference.CodeLocation, "Unresolved reference");

      return ResolveExpressionType(target, ctx);
    },
    (bracket) => {
      return ResolveExpressionType(bracket.Expression, ctx);
    },
    (lambda) => {
      return new FunctionType(
        lambda.CodeLocation,
        new ComponentGroup(
          new FunctionParameter(
            lambda.CodeLocation,
            "ctx",
            new PrimitiveType(lambda.CodeLocation, "null"),
            false
          ),
          ...lambda.Parameters.iterator()
        ),
        ResolveBlockType(lambda.Body, ctx)
      );
    },
    (invoke) => {
      invoke = invoke.BuildInvokation(ctx);

      const subject = ResolveExpressionType(invoke.Subject, ctx);
      const parse_function_type = (t: Component | undefined) => {
        if (!t)
          throw new LinkerError(
            invoke.CodeLocation,
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
          f = f.invoked({ ...ctx, invokation: invoke });
          if (!f.Returns)
            throw new LinkerError(
              f.CodeLocation,
              "Could not resolve function return type"
            );
          return ResolveType(f.Returns, ctx);
        },
        (l) =>
          ResolveBlockType(l.invoked({ ...ctx, invokation: invoke }).Body, ctx),
        (b) => ResolveType(b.Returns, ctx),
        (e) => ResolveType(e.Returns, ctx),
        (p) => parse_function_type(p.Type),
        (f) => ResolveType(f.Returns, ctx),
        (s) => {
          const type = ResolveExpressionType(s.Equals, ctx);
          if (!(type instanceof FunctionType))
            throw new LinkerError(
              s.CodeLocation,
              "May only invoke function store types"
            );

          return ResolveType(type.Returns, ctx);
        },
        (s) => s
      )(subject);
    },
    (access) => {
      const subject = ResolveExpressionType(access.Subject, ctx);
      return PatternMatch(StructEntity, SchemaEntity, SchemaType, Component)(
        (struct) => {
          const result = struct.GetKey(access.Target);
          if (!result)
            throw new LinkerError(access.CodeLocation, "Cannot resolve access");

          return ResolveType(result, ctx);
        },
        (struct) => {
          const result = struct.GetKey(access.Target);
          if (!result)
            throw new LinkerError(access.CodeLocation, "Cannot resolve access");

          return ResolveType(result, ctx);
        },
        (struct) => {
          const result = struct.GetKey(access.Target);
          if (!result)
            throw new LinkerError(access.CodeLocation, "Cannot resolve access");

          return ResolveType(result, ctx);
        },
        () => {
          const target = FindReference(access.Target, ctx);
          if (!target || !IsAnyInvokable(target))
            throw new LinkerError(access.CodeLocation, "Could not resolve");

          return target;
        }
      )(subject);
    },
    (schema) => {
      return schema;
    },
    (p) => {
      if (!p.Type)
        throw new LinkerError(p.CodeLocation, "Unresolved parameter type");
      return ResolveType(p.Type, ctx);
    },
    (f) => {
      if (!f.Returns)
        throw new LinkerError(
          f.CodeLocation,
          "Unresolved function return type"
        );
      return new FunctionType(f.CodeLocation, f.Parameters, f.Returns);
    },
    (p) => p,
    (f) => {
      if (!f.Returns)
        throw new LinkerError(
          f.CodeLocation,
          "Unresolved function return type"
        );
      return new FunctionType(f.CodeLocation, f.Parameters, f.Returns);
    },
    (store) => {
      return ResolveExpressionType(store.Equals, ctx);
    },
    (use) => {
      return use;
    },
    (r) => {
      return ResolveType(r, ctx);
    },
    (p) => {
      return ResolveType(p.Type, ctx);
    },
    (f) => f,
    (s) => s,
    (r) => ResolveType(r.Creates, ctx)
  )(expression);
}
