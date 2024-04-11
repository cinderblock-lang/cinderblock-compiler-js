import { Expression } from "./base";
import { Component } from "../component";
import { CodeLocation } from "../../location/code-location";
import { ParserError } from "../../parser/error";

export class BracketsExpression extends Expression {
  readonly #expression: Component;

  constructor(ctx: CodeLocation, expression: Expression) {
    super(ctx);
    this.#expression = expression;
  }
}

Expression.Register({
  Priority: 1,
  Is(token_group, prefix) {
    return token_group.Text === "(" && !prefix;
  },
  Extract(token_group, prefix) {
    const [result_tokens, input] = Expression.Parse(token_group.Next, [")"]);

    return [
      result_tokens,
      new BracketsExpression(token_group.CodeLocation, input),
    ];
  },
});
