import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { WriterContext } from "../writer";
import { IterableType } from "../type/iterable";
import { LinkerError } from "../../linker/error";
import { Namer } from "../../location/namer";
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
      !(left_type instanceof IterableType) ||
      !(right_type instanceof IterableType)
    )
      throw new LinkerError(
        this.CodeLocation,
        "May only concatinate iterable types"
      );

    const left_type_reference = left_type.Result.resolve_type(ctx).c(ctx);
    const right_type_reference = right_type.Result.resolve_type(ctx).c(ctx);

    const not_primitive = !(left_type.Type.resolve_type(ctx) instanceof PrimitiveType);

    const name = Namer.GetName();

    ctx.AddGlobalDeclaration(`typedef struct ${name}_context {
      _FUNCTION* left;
      _FUNCTION* right;
      int crossover;
    } ${name}_context;`);

    ctx.AddGlobalDeclaration(
      `${left_type_reference} ${name}(void* old_scope, void* ctx, int index);`
    );

    ctx.AddGlobal(`${left_type_reference} ${name}(void* old_scope, void* ctx, int index) {
      void* current_scope = _OpenScope(old_scope);
      ${name}_context* _ctx = (${name}_context*)ctx;

      ${left_type_reference} (*left)(void*, void*, int) = _ctx->left->handle;
      ${right_type_reference} (*right)(void*, void*, int) = _ctx->right->handle;

      if (_ctx->crossover < 0 || index < _ctx->crossover) {
        ${left_type_reference} left_result = (*left)(current_scope,  _ctx->left->data, index);
        if (!left_result->done) {
          return _Return(current_scope, left_result);
        } else {
          _ctx->crossover = index;
        }
      }

      if (_ctx->crossover >= 0 && index >= _ctx->crossover) {
        ${right_type_reference} right_result = (*right)(current_scope, _ctx->right->data, index - _ctx->crossover);
        ${left_type_reference} done = _Allocate(
            current_scope, sizeof(${left_type_reference.replace("*", "")})
          );
        done->result = right_result->result;
        ${not_primitive ? '_Assign(current_scope, right_result->result, done);' : ''}
        done->done = right_result->done;
        done->next = _ctx->crossover + right_result->next;
        return _Return(current_scope, done);
      }

      ${left_type_reference} done_final = _Allocate(
        current_scope, sizeof(${left_type_reference.replace("*", "")})
      );
      done_final->done = 1;
      return _Return(current_scope, done_final);
    }`);

    const instance_name = Namer.GetName();
    const ctx_name = Namer.GetName();

    const left_reference = this.Left.c(ctx);
    const right_reference = this.Right.c(ctx);

    ctx.AddDeclaration(
      `${name}_context* ${ctx_name} = _Allocate(current_scope, sizeof(${name}_context));`
    );
    ctx.AddDeclaration(
      `_FUNCTION* ${instance_name} = _Allocate(current_scope, sizeof(_FUNCTION));
      ${instance_name}->handle = ${name};
      ${instance_name}->data = ${ctx_name};`
    );

    ctx.AddPrefix(
      `${ctx_name}->left = _Assign(current_scope, ${left_reference}, ${ctx_name});`,
      `${ctx_name}->left`,
      [left_reference, ctx_name]
    );

    ctx.AddPrefix(
      `${ctx_name}->right = _Assign(current_scope, ${right_reference}, ${ctx_name});`,
      `${ctx_name}->right`,
      [right_reference, ctx_name]
    );

    ctx.AddPrefix(`${ctx_name}->crossover = -1;`, `${ctx_name}->crossover`, [
      ctx_name,
    ]);

    return instance_name;
  }

  c(ctx: WriterContext): string {
    if (this.Operator === "++") {
      return this.#build_concat(ctx);
    }

    return `${this.Left.c(ctx)} ${this.Operator} ${this.Right.c(ctx)}`;
  }

  resolve_type(ctx: WriterContext): Component {
    return this.Right.resolve_type(ctx);
  }
}
