import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { Type } from "../type/base";
import { WriterContext } from "../writer";

export class EmptyExpression extends Expression {
  readonly #of: Component;

  constructor(ctx: CodeLocation, of: Type) {
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
