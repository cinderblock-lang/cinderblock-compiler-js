import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Context } from "../context";
import { LinkedBracketsExpression } from "../../linked-ast/expression/brackets";
import { ContextResponse } from "../context-response";

export class BracketsExpression extends Expression {
  readonly #expression: Expression;

  constructor(ctx: CodeLocation, expression: Expression) {
    super(ctx);
    this.#expression = expression;
  }

  Linked(context: Context) {
    return context.Build(
      { expression: (c) => this.#expression.Linked(c) },
      ({ expression }) =>
        new LinkedBracketsExpression(this.CodeLocation, expression)
    );
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
