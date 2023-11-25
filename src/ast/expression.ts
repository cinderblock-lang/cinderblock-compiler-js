import { Component, ComponentGroup, WriterContext } from "./base";
import { Type } from "./type";
import { Location, Namer } from "#compiler/location";
import {
  FunctionParameter,
  FunctionEntity,
  StoreStatement,
  StructEntity,
  Property,
  RawStatement,
  ReturnStatement,
  AssignStatement,
} from ".";
import {
  FindReference,
  FindType,
  ResolveBlockType,
  ResolveExpressionType,
  ResolveType,
} from "../linker/resolve";
import { PatternMatch, RequireType } from "../location/pattern-match";
import { LinkerError } from "../linker/error";
import { IsAnyInvokable, IsAnyStructLike } from "../linker/types";
import { Unique } from "./utils";

export abstract class Expression extends Component {}

export type LiteralType =
  | "string"
  | "int"
  | "char"
  | "float"
  | "double"
  | "long"
  | "bool";

export class LiteralExpression extends Expression {
  readonly #type: LiteralType;
  readonly #value: string;

  constructor(ctx: Location, type: LiteralType, value: string) {
    super(ctx);
    this.#type = type;
    this.#value = value;
  }

  copy() {
    return new LiteralExpression(this.Location, this.#type, this.#value);
  }

  get Type() {
    return this.#type;
  }

  get Value() {
    return this.#value;
  }

  get type_name() {
    return "literal_expression";
  }

  c(ctx: WriterContext): string {
    switch (this.Type) {
      case "bool":
        return this.Value === "true" ? "1" : "0";
      case "char":
        return `'${this.Value}'`;
      case "double":
        return this.Value.replace("d", "");
      case "float":
        return this.Value;
      case "int":
        return this.Value.replace("i", "");
      case "long":
        return this.Value;
      case "string":
        return `"${this.Value}"`;
    }
  }
}

export const Operators = [
  "+",
  "-",
  "/",
  "*",
  "==",
  "!=",
  "<",
  ">",
  "<=",
  ">=",
  "++",
  "&&",
  "||",
  "%",
] as const;
export type Operator = (typeof Operators)[number];

export class OperatorExpression extends Expression {
  readonly #left: Component;
  readonly #operator: Operator;
  readonly #right: Component;

  constructor(
    ctx: Location,
    left: Expression,
    operator: Operator,
    right: Expression
  ) {
    super(ctx);
    this.#left = left;
    this.#operator = operator;
    this.#right = right;
  }

  get Left() {
    return this.#left;
  }

  get Operator() {
    return this.#operator;
  }

  get Right() {
    return this.#right;
  }

  get type_name() {
    return "operator_expression";
  }

  c(ctx: WriterContext): string {
    return `${this.Left.c(ctx)} ${this.Operator} ${this.Right.c(ctx)}`;
  }
}

export class IfExpression extends Expression {
  readonly #check: Component;
  readonly #if: ComponentGroup;
  readonly #else: ComponentGroup;

  constructor(
    ctx: Location,
    check: Expression,
    on_if: ComponentGroup,
    on_else: ComponentGroup
  ) {
    super(ctx);
    this.#check = check;
    this.#if = on_if;
    this.#else = on_else;
  }

  get Check() {
    return this.#check;
  }

  get If() {
    return this.#if;
  }

  get Else() {
    return this.#else;
  }

  get type_name() {
    return "if_expression";
  }

  c(ctx: WriterContext): string {
    const type = ResolveBlockType(this.If, ctx);
    const name = Namer.GetName();
    ctx.prefix.push(`${type.c(ctx)} ${name};`);
    const if_prefix: Array<string> = [];
    const if_suffix: Array<string> = [];

    let if_locals: Record<string, Component> = {};
    for (const statement of this.If.iterator()) {
      if (statement instanceof StoreStatement) {
        if_locals[statement.Name] = statement;
      }

      if (statement instanceof RawStatement) {
        if_locals[statement.Reference] = statement;
      }
    }

    const if_return = this.If.find(ReturnStatement).c({
      ...ctx,
      prefix: if_prefix,
      suffix: if_suffix,
      locals: if_locals,
    });

    const else_prefix: Array<string> = [];
    const else_suffix: Array<string> = [];

    let else_locals: Record<string, Component> = {};
    for (const statement of this.Else.iterator()) {
      if (statement instanceof StoreStatement) {
        else_locals[statement.Name] = statement;
      }

      if (statement instanceof RawStatement) {
        else_locals[statement.Reference] = statement;
      }
    }

    const else_return = this.Else.find(ReturnStatement).c({
      ...ctx,
      prefix: else_prefix,
      suffix: else_suffix,
      locals: else_locals,
    });

    ctx.prefix.push(`if (${this.Check.c(ctx)}) {
      ${if_prefix.filter(Unique).join("\n")}
      ${name} = ${if_return};
      ${if_suffix.filter(Unique).join("\n")}
    } else {
      ${else_prefix.filter(Unique).join("\n")}
      ${name} = ${else_return};
      ${else_suffix.filter(Unique).join("\n")}
    }`);

    return name;
  }
}

export class EmptyExpression extends Expression {
  readonly #of: Component;

  constructor(ctx: Location, of: Type) {
    super(ctx);
    this.#of = of;
  }

  get Of() {
    return this.#of;
  }

  get type_name() {
    return "empty_expression";
  }

  c(ctx: WriterContext): string {
    return "";
  }
}

export class IterateExpression extends Expression {
  readonly #over: Component;
  readonly #as: string;
  readonly #using: ComponentGroup;

  constructor(
    ctx: Location,
    over: Expression,
    as: string,
    using: ComponentGroup
  ) {
    super(ctx);
    this.#over = over;
    this.#as = as;
    this.#using = using;
  }

  get Over() {
    return this.#over;
  }

  get As() {
    return this.#as;
  }

  get Body() {
    return this.#using;
  }

  get type_name() {
    return "iterate_expression";
  }

  c(ctx: WriterContext): string {
    return "";
  }
}

export class MakeExpression extends Expression {
  readonly #struct: string;
  readonly #using: ComponentGroup;

  constructor(ctx: Location, struct: string, using: ComponentGroup) {
    super(ctx);
    this.#struct = struct;
    this.#using = using;
  }

  get Struct() {
    return this.#struct;
  }

  get Using() {
    return this.#using;
  }

  get type_name() {
    return "make_expression";
  }

  c(ctx: WriterContext): string {
    const type = FindType(this.Struct, ctx);
    if (!type) throw new LinkerError(this.Location, "Could not resolve symbol");
    const name = Namer.GetName();
    ctx.prefix.push(`${type.c(ctx)} ${name} = malloc(sizeof(${type.c(ctx)}))`);

    let locals: Record<string, Component> = {};
    for (const statement of this.Using.iterator()) {
      if (statement instanceof StoreStatement) {
        locals[statement.Name] = statement;
      }

      if (statement instanceof RawStatement) {
        locals[statement.Reference] = statement;
      }
    }

    const prefix: Array<string> = [];
    const suffix: Array<string> = [];
    const inputs = this.Using.find_all(AssignStatement).map(
      (a) =>
        `${name}->${a.Name} = ${a.c({
          ...ctx,
          prefix,
          suffix,
          locals,
        })};`
    );

    ctx.prefix.push(`{
      ${prefix.filter(Unique).join("\n")}
      ${inputs.join("\n")}
      ${suffix.filter(Unique).join("\n")}
    }`);

    return `*${name}`;
  }
}

export class IsExpression extends Expression {
  readonly #left: Component;
  readonly #right: Component;

  constructor(ctx: Location, left: Expression, right: Type) {
    super(ctx);
    this.#left = left;
    this.#right = right;
  }

  get Left() {
    return this.#left;
  }

  get Right() {
    return this.#right;
  }

  get type_name() {
    return "is_expression";
  }

  c(ctx: WriterContext): string {
    const left_type = ResolveExpressionType(this.Left, ctx);

    return left_type === ResolveType(this.Right, ctx) ? "1" : "0";
  }
}

export class ReferenceExpression extends Expression {
  readonly #name: string;

  constructor(ctx: Location, name: string) {
    super(ctx);
    this.#name = name;
  }
  get Name() {
    return this.#name;
  }

  get type_name() {
    return "reference_expression";
  }

  c(ctx: WriterContext): string {
    const target = FindReference(this.Name, ctx);
    if (!target)
      throw new LinkerError(this.Location, "Could not find reference");
    if (target instanceof FunctionParameter) return this.Name;
    return `(${target.c(ctx)})`;
  }
}

export class BracketsExpression extends Expression {
  readonly #expression: Component;

  constructor(ctx: Location, expression: Expression) {
    super(ctx);
    this.#expression = expression;
  }

  get Expression() {
    return this.#expression;
  }

  get type_name() {
    return "brackets_expression";
  }

  c(ctx: WriterContext): string {
    const name = Namer.GetName();
    const type = ResolveExpressionType(this.Expression, ctx);

    ctx.prefix.push(`${type.c(ctx)} ${name} = ${this.Expression.c(ctx)};`);

    return name;
  }
}

export class LambdaExpression extends Expression {
  readonly #parameters: ComponentGroup;
  readonly #body: ComponentGroup;

  constructor(ctx: Location, parameters: ComponentGroup, body: ComponentGroup) {
    super(ctx);
    this.#parameters = parameters;
    this.#body = body;
  }

  get Parameters() {
    return this.#parameters;
  }

  get Body() {
    return this.#body;
  }

  get type_name() {
    return "lambda_expression";
  }

  invoked(ctx: WriterContext) {
    const expected = [...this.Parameters.iterator()];
    const actual = [...(ctx.invokation?.Parameters.iterator() ?? [])];
    const input: Array<FunctionParameter> = [];

    for (let i = 0; i < expected.length; i++) {
      const e = expected[i];
      RequireType(FunctionParameter, e);
      const a = actual[i];

      if (!a) {
        input.push(e);
        continue;
      }

      input.push(
        new FunctionParameter(
          e.Location,
          e.Name,
          ResolveExpressionType(a, ctx),
          e.Optional
        )
      );
    }

    return new LambdaExpression(
      this.Location,
      new ComponentGroup(...input),
      this.Body
    );
  }

  c(ctx: WriterContext): string {
    const expected = [...this.Parameters.iterator()];
    const actual = [...(ctx.invokation?.Parameters.iterator() ?? [])];
    const parameters: Record<string, Type> = {};
    const func_parameters: Array<FunctionParameter> = [];

    for (let i = 0; i < expected.length; i++) {
      const e = expected[i];
      RequireType(FunctionParameter, e);
      const a = actual[i];
      if (!a) {
        if (!e.Type) throw new LinkerError(e.Location, "Canot determine type");
        parameters[e.Name] = e;
        func_parameters.push(e);
        continue;
      }

      const param = new FunctionParameter(
        this.Location,
        e.Name,
        ResolveExpressionType(a, ctx),
        false
      );
      parameters[e.Name] = param;
      func_parameters.push(param);
    }

    ctx = {
      ...ctx,
      parameters,
    };

    const name = Namer.GetName();
    const ctx_struct = new StructEntity(
      this.Location,
      true,
      name,
      new ComponentGroup(
        ...Object.keys(ctx.locals).map(
          (k) =>
            new Property(
              this.Location,
              k,
              ResolveExpressionType(ctx.locals[k], ctx),
              false
            )
        ),
        ...Object.keys(ctx.parameters).map(
          (k) => new Property(this.Location, k, ctx.parameters[k], false)
        )
      ),
      ctx.namespace,
      ctx.using
    );

    const func = new FunctionEntity(
      this.Location,
      true,
      Namer.GetName(),
      new ComponentGroup(...func_parameters),
      new ComponentGroup(
        new RawStatement(
          this.Location,
          `${ctx_struct.c(ctx)} _ctx = *(${ctx_struct.c(ctx)}*)ctx;`,
          "_ctx",
          ctx_struct
        ),
        ...Object.keys(ctx.locals).map(
          (k) =>
            new StoreStatement(
              this.Location,
              k,
              new AccessExpression(
                this.Location,
                new ReferenceExpression(this.Location, "_ctx"),
                k
              )
            )
        ),
        ...Object.keys(ctx.parameters).map(
          (k) =>
            new StoreStatement(
              this.Location,
              k,
              new AccessExpression(
                this.Location,
                new ReferenceExpression(this.Location, "_ctx"),
                k
              )
            )
        ),
        ...this.Body.iterator()
      ),
      ResolveBlockType(this.Body, ctx),
      ctx.namespace,
      ctx.using
    );

    ctx.global_functions[func.Name] = func;

    const instance = func.c(ctx);
    const ctx_ref = ctx_struct.c(ctx);
    const data_name = Namer.GetName();
    ctx.prefix.push(`${instance}.data = malloc(sizeof(${ctx_ref}));`);
    ctx.prefix.push(
      `${ctx_ref}* ${data_name} = (${ctx_ref}*)${instance}.data;`
    );

    ctx.prefix.push(
      ...Object.keys(ctx.locals).map(
        (k) => `${data_name}->${k} = ${ctx.locals[k].c(ctx)};`
      ),
      ...Object.keys(ctx.parameters).map((k) => `${data_name}->${k} = ${k};`)
    );

    return instance;
  }
}

export class InvokationExpression extends Expression {
  readonly #subject: Component;
  readonly #parameters: ComponentGroup;

  constructor(ctx: Location, subject: Expression, parameters: ComponentGroup) {
    super(ctx);
    this.#subject = subject;
    this.#parameters = parameters;
  }

  get Subject() {
    return this.#subject;
  }

  get Parameters() {
    return this.#parameters;
  }

  get type_name() {
    return "invokation_expression";
  }

  BuildInvokation(ctx: WriterContext) {
    if (this.Subject instanceof AccessExpression) {
      const target = ResolveExpressionType(this.Subject.Subject, ctx);
      if (IsAnyStructLike(target) && target.HasKey(this.Subject.Target))
        return this;

      const func = FindReference(this.Subject.Target, ctx);
      if (!IsAnyInvokable(func))
        throw new LinkerError(this.Subject.Location, "Could not find subject");

      const params = new ComponentGroup(
        this.Subject.Subject,
        ...this.Parameters.iterator()
      );
      return new InvokationExpression(
        this.Location,
        new ReferenceExpression(this.Subject.Location, func.Name),
        params
      );
    }

    return this;
  }

  c(ctx: WriterContext): string {
    const invokation = this.BuildInvokation(ctx);
    const reference = invokation.Subject.c({
      ...ctx,
      invokation: invokation,
    });

    const returns = ResolveExpressionType(this, ctx);

    const name = Namer.GetName();
    ctx.prefix.push(
      `${returns.c(ctx)} (*${name})(${[
        "void*",
        ...invokation.Parameters.map((p) => {
          const type = ResolveExpressionType(p, ctx);
          return type.c(ctx);
        }),
      ].join(", ")}) = ${reference}.handle;`
    );

    return `(*${name})(${[
      `${reference}.data`,
      ...invokation.Parameters.map((p) => p.c(ctx)),
    ].join(", ")})`;
  }
}

export class AccessExpression extends Expression {
  readonly #subject: Component;
  readonly #target: string;

  constructor(ctx: Location, subject: Expression, target: string) {
    super(ctx);
    this.#subject = subject;
    this.#target = target;
  }

  get Subject() {
    return this.#subject;
  }

  get Target() {
    return this.#target;
  }

  get type_name() {
    return "access_expression";
  }

  c(ctx: WriterContext): string {
    return `${this.Subject.c(ctx)}.${this.Target}`;
  }
}
