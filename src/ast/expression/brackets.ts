import { Expression } from "./base";
import { Component } from "../component";
import { CodeLocation } from "../../location/code-location";

export class BracketsExpression extends Expression {
  readonly #expression: Component;

  constructor(ctx: CodeLocation, expression: Expression) {
    super(ctx);
    this.#expression = expression;
  }
}
