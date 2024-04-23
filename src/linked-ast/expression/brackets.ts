import { LinkedExpression } from "./base";
import { CodeLocation } from "../../location/code-location";

export class BracketsExpression extends LinkedExpression {
  readonly #expression: LinkedExpression;

  constructor(ctx: CodeLocation, expression: LinkedExpression) {
    super(ctx);
    this.#expression = expression;
  }

  get Type() {
    return this.#expression.Type;
  }
}
