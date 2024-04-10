import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { Type } from "../type/base";

export class IsExpression extends Expression {
  readonly #left: Component;
  readonly #right: Component;

  constructor(ctx: CodeLocation, left: Expression, right: Type) {
    super(ctx);
    this.#left = left;
    this.#right = right;
  }
}
