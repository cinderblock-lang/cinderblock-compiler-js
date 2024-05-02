import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Type } from "../type/base";
import { ParserError } from "../../parser/error";
import { Context } from "../context";
import { LinkedLiteralExpression } from "../../linked-ast/expression/literal";

export class IsExpression extends Expression {
  readonly #left: Expression;
  readonly #right: Type;

  constructor(ctx: CodeLocation, left: Expression, right: Type) {
    super(ctx);
    this.#left = left;
    this.#right = right;
  }

  Linked(context: Context) {
    return context.Build(
      {
        left: this.#left.Linked,
        right: this.#right.Linked,
      },
      ({ left, right }) =>
        new LinkedLiteralExpression(
          this.CodeLocation,
          "bool",
          left.Type === right ? "true" : "false"
        )
    );
  }
}

Expression.Register({
  Priority: 3,
  Is(token_group, prefix) {
    return token_group.Text === "is";
  },
  Extract(token_group, prefix) {
    if (!prefix)
      throw new ParserError(
        token_group.CodeLocation,
        "Is checks must have a left hand side"
      );

    const [after_right, right] = Type.Parse(token_group);

    return [
      after_right,
      new IsExpression(token_group.CodeLocation, prefix, right),
    ];
  },
});
