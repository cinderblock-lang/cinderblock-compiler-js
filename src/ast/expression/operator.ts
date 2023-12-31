import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { WriterContext } from "../writer";
import { LinkerError } from "../../linker/error";
import { Namer } from "../../location/namer";
import { FunctionType } from "../type/function";
import { GetIterableFunctionStruct } from "../../linker/iterable";
import { StructEntity } from "../entity/struct";
import { RequireType } from "../../location/require-type";
import { Property } from "../property";
import { PrimitiveType } from "../type/primitive";

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
  "<<",
  ">>",
  "&",
  "|",
] as const;
export type Operator = (typeof Operators)[number];

export class OperatorExpression extends Expression {
  readonly #left: Component;
  readonly #operator: Operator;
  readonly #right: Component;

  constructor(
    ctx: CodeLocation,
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

  #build_concat(ctx: WriterContext) {
    const left_type = this.Left.resolve_type(ctx);
    const right_type = this.Right.resolve_type(ctx);
    if (
      !(left_type instanceof FunctionType) ||
      !(right_type instanceof FunctionType)
    )
      throw new LinkerError(
        this.CodeLocation,
        "May only concatinate iterable types"
      );

    const left_type_reference = GetIterableFunctionStruct(left_type)
      .resolve_type(ctx)
      .c(ctx);
    const right_type_reference = GetIterableFunctionStruct(right_type)
      .resolve_type(ctx)
      .c(ctx);

    const name = Namer.GetName();

    ctx.AddGlobalDeclaration(`typedef struct ${name}_context {
      _FUNCTION left;
      _FUNCTION right;
      int crossover;
    } ${name}_context;`);

    ctx.AddGlobalDeclaration(
      `${left_type_reference} ${name}(void* ctx, int index);`
    );

    ctx.AddGlobal(`${left_type_reference} ${name}(void* ctx, int index) {
      ${name}_context* _ctx = (${name}_context*)ctx;

      ${left_type_reference} (*left)(void*, int) = _ctx->left.handle;
      ${right_type_reference} (*right)(void*, int) = _ctx->right.handle;

      if (_ctx->crossover < 0 || index < _ctx->crossover) {
        ${left_type_reference} left_result = (*left)(_ctx->left.data, index);
        if (!left_result.done) {
          return left_result;
        } else {
          _ctx->crossover = index;
        }
      }

      if (_ctx->crossover >= 0 && index >= _ctx->crossover) {
        ${right_type_reference} right_result = (*right)(_ctx->right.data, index - _ctx->crossover);
        ${left_type_reference} done;
        done.result = right_result.result;
        done.done = right_result.done;
        done.next = _ctx->crossover + right_result.next;
        return done;
      }

      ${left_type_reference} done_final;
      done_final.done = 1;
      return done_final;
    }`);

    const instance_name = Namer.GetName();
    const ctx_name = Namer.GetName();

    const left_reference = this.Left.c(ctx);
    const right_reference = this.Right.c(ctx);

    ctx.AddDeclaration(
      `${name}_context* ${ctx_name} = malloc(sizeof(${name}_context));`
    );
    ctx.AddDeclaration(
      `_FUNCTION ${instance_name} = { &${name}, ${ctx_name} };`
    );

    ctx.AddSuffix(`free(${ctx_name});`);

    ctx.AddPrefix(
      `${ctx_name}->left = ${left_reference};`,
      `${ctx_name}->left`,
      [left_reference, ctx_name]
    );

    ctx.AddPrefix(
      `${ctx_name}->right = ${right_reference};`,
      `${ctx_name}->right`,
      [right_reference, ctx_name]
    );

    ctx.AddPrefix(`${ctx_name}->crossover = -1;`, `${ctx_name}->crossover`, [
      ctx_name,
    ]);

    return instance_name;
  }

  #struct_compare(ctx_old: WriterContext, subject: StructEntity): string {
    const name = Namer.GetName();
    const ctx = ctx_old.StartContext(
      this.CodeLocation,
      ctx_old.Namespace,
      ctx_old.Using
    );

    ctx.AddGlobal(`_Bool ${name}(${subject.c(ctx)}* left, ${subject.c(
      ctx
    )}* right) {
      return ${subject.Properties.map((p) => {
        RequireType(Property, p);

        if (p.Type instanceof StructEntity) {
          return `${this.#struct_compare(ctx, p.Type)}(&left->${
            p.Name
          }, &right->${p.Name})`;
        } else if (p.Type instanceof PrimitiveType) {
          return `left->${p.Name} == right->${p.Name}`;
        }
      }).join(" && ")};
    }`);

    return name;
  }

  compatible(target: Component, ctx: WriterContext): boolean {
    return this.resolve_type(ctx).compatible(target, ctx);
  }

  c(ctx: WriterContext): string {
    if (this.Operator === "++") {
      return this.#build_concat(ctx);
    }

    const type = this.Left.resolve_type(ctx);
    if (type instanceof StructEntity) {
      if (this.Operator !== "==" && this.Operator !== "!=")
        throw new LinkerError(
          this.CodeLocation,
          "Only equals or not equals may be used on structs"
        );

      const prefix = this.Operator === "!=" ? "!" : "";
      return `${prefix}${this.#struct_compare(ctx, type)}(&${this.Left.c(
        ctx
      )}, &${this.Right.c(ctx)})`;
    }

    return `${this.Left.c(ctx)} ${this.Operator} ${this.Right.c(ctx)}`;
  }

  resolve_type(ctx: WriterContext): Component {
    return this.Right.resolve_type(ctx);
  }

  default(ctx: WriterContext): string {
    throw new LinkerError(this.CodeLocation, "May not have a default");
  }
}
