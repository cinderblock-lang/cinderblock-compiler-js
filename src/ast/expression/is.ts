import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { Type } from "../type/base";
import { WriterContext } from "../writer";
import { ResolveExpressionType, ResolveType } from "../../linker/resolve";

export class IsExpression extends Expression {
  readonly #left: Component;
  readonly #right: Component;

  constructor(ctx: CodeLocation, left: Expression, right: Type) {
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
