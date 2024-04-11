import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { ParserError } from "../../parser/error";

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
  "++",
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

    const operator = token_group.Text;
    if (!IsOperator(operator))
      throw new ParserError(token_group.CodeLocation, "Not a valid operator");

    const [after_right, right] = Expression.Parse(token_group, look_for);

    return [
      after_right,
      new OperatorExpression(token_group.CodeLocation, prefix, operator, right),
    ];
  },
});
