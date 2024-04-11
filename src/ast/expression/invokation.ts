import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { ParserError } from "../../parser/error";

export class InvokationExpression extends Expression {
  readonly #subject: Expression;
  readonly #parameters: Array<Expression>;

  constructor(
    ctx: CodeLocation,
    subject: Expression,
    parameters: Array<Expression>
  ) {
    super(ctx);
    this.#subject = subject;
    this.#parameters = parameters;
  }
}

Expression.Register({
  Priority: 2,
  Is(token_group, prefix) {
    return token_group.Text === "(" && !!prefix;
  },
  Extract(token_group, prefix) {
    const start = token_group.CodeLocation;
    if (!prefix)
      throw new ParserError(
        token_group.CodeLocation,
        "Attempting an invokation without a referenced function"
      );

    let parameters: Array<Expression> = [];
    while (token_group.Text !== ")") {
      token_group = token_group.Next;
      let result: Expression;
      [token_group, result] = Expression.Parse(token_group, [",", ")"]);
      parameters = [...parameters, result];
      token_group = token_group.Previous;
    }

    token_group = token_group.Next;

    return [token_group, new InvokationExpression(start, prefix, parameters)];
  },
});
