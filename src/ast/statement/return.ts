import { CodeLocation } from "../../location/code-location";
import { Expression } from "../expression/base";
import { Statement } from "./base";

export class ReturnStatement extends Statement {
  readonly #value: Expression;

  constructor(ctx: CodeLocation, value: Expression) {
    super(ctx);
    this.#value = value;
  }
}

Statement.Register({
  Is(token_group) {
    return token_group.Text === "return";
  },
  Extract(token_group) {
    const [after_expression, expression] = Expression.Parse(token_group.Next);

    return [
      after_expression,
      new ReturnStatement(token_group.CodeLocation, expression),
    ];
  },
});
