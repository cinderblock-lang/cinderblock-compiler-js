import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { Type } from "../type/base";

export class EmptyExpression extends Expression {
  readonly #of: Component;

  constructor(ctx: CodeLocation, of: Type) {
    super(ctx);
    this.#of = of;
  }
}
