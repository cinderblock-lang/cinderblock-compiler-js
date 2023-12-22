import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { Type } from "../type/base";
import { WriterContext } from "../writer";
import { PrimitiveType } from "../type/primitive";
import { LinkerError } from "../../linker/error";

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

  IsMatch(ctx: WriterContext) {
    const left_type = this.Left.resolve_type(ctx);

    return left_type.compatible(this.Right.resolve_type(ctx), ctx);
  }

  c(ctx: WriterContext): string {
    return this.IsMatch(ctx) ? "1" : "0";
  }

  compatible(target: Component, ctx: WriterContext): boolean {
    return this.resolve_type(ctx).compatible(target, ctx);
  }

  resolve_type(ctx: WriterContext): Component {
    return new PrimitiveType(this.CodeLocation, "bool");
  }

  default(ctx: WriterContext): string {
    throw new LinkerError(this.CodeLocation, "May not have a default");
  }
}
