import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { ParserError } from "../../parser/error";
import { Context } from "../context";
import { LinkedOperatorExpression } from "../../linked-ast/expression/operator";
import { TokenGroupResponse } from "../../parser/token-group-response";

export const Operators = [
  "+",
  "-",
  "/",
  "*",
  "==",
  "!=",
  "<",
  ">",
  "<=",
  ">=",
  "&&",
  "||",
  "%",
  "<<",
  ">>",
  "&",
  "|",
] as const;
export type Operator = (typeof Operators)[number];

function IsOperator(item: string | undefined): item is Operator {
  return Operators.includes((item ?? "") as Operator);
}

export class OperatorExpression extends Expression {
  readonly #left: Expression;
  readonly #operator: Operator;
  readonly #right: Expression;

  constructor(
    ctx: CodeLocation,
    left: Expression,
    operator: Operator,
    right: Expression
  ) {
    super(ctx);
    this.#left = left;
    this.#operator = operator;
    this.#right = right;
  }

  Linked(context: Context) {
    return context.Build(
      {
        left: (c) => this.#left.Linked(c),
        right: (c) => this.#right.Linked(c),
      },
      ({ left, right }) =>
        new LinkedOperatorExpression(
          this.CodeLocation,
          left,
          this.#operator,
          right
        )
    );
  }
}

Expression.Register({
  Priority: 2,
  Is(token_group, prefix) {
    return IsOperator(token_group.Text);
  },
  Extract(token_group, prefix, look_for) {
    if (!prefix)
      throw new ParserError(
        token_group.CodeLocation,
        "Operators must have a left hand side"
      );

    return token_group.Build(
      {
        operator: (token_group) => {
          const result = token_group.Text;
          token_group = token_group.Next;

          if (!IsOperator(result))
            throw new ParserError(
              token_group.CodeLocation,
              "Not a valid operator"
            );

          return new TokenGroupResponse(token_group, result);
        },
        right: (token_group) => Expression.Parse(token_group, look_for),
      },
      ({ operator, right }) =>
        new OperatorExpression(
          token_group.CodeLocation,
          prefix,
          operator,
          right
        )
    );
  },
});
