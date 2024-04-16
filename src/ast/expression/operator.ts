import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { ParserError } from "../../parser/error";
import { Scope } from "../../linker/closure";
import {
  WriterExpression,
  WriterOperatorExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { Type } from "../type/base";
import { PrimitiveType } from "../type/primitive";
import { WriterFunction } from "../../writer/entity";

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

  Build(
    file: WriterFile,
    func: WriterFunction,
    scope: Scope
  ): [WriterFile, WriterFunction, WriterExpression] {
    let left: WriterExpression;
    let right: WriterExpression;

    [file, func, left] = this.#left.Build(file, func, scope);
    [file, func, right] = this.#right.Build(file, func, scope);

    return [
      file,
      func,
      new WriterOperatorExpression(left, right, this.#operator),
    ];
  }

  ResolvesTo(scope: Scope): Type {
    switch (this.#operator) {
      case "!=":
      case "&&":
      case "<":
      case "<=":
      case "==":
      case ">":
      case ">=":
      case "||":
        return new PrimitiveType(this.CodeLocation, "bool");
      case "%":
        return new PrimitiveType(this.CodeLocation, "double");
      case "&":
      case "*":
      case "+":
      case "-":
      case "/":
      case "<<":
      case ">>":
      case "|":
        return this.#right.ResolvesTo(scope);
    }
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

    let right: Expression;
    [token_group, right] = Expression.Parse(token_group.Next, look_for);

    return [
      token_group,
      new OperatorExpression(token_group.CodeLocation, prefix, operator, right),
    ];
  },
});
