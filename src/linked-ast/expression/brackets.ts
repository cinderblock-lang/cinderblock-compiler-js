import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";

export class BracketsExpression extends Expression {
  readonly #expression: Expression;

  constructor(ctx: CodeLocation, expression: Expression) {
    super(ctx);
    this.#expression = expression;
  }

  get Type() {
    return this.#expression.Type;
  }
}
