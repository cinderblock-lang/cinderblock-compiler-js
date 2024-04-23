import { LinkedExpression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { LinkedType } from "../type/base";
import { PrimitiveType } from "../type/primitive";

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

export class OperatorExpression extends LinkedExpression {
  readonly #left: LinkedExpression;
  readonly #operator: Operator;
  readonly #right: LinkedExpression;

  constructor(
    ctx: CodeLocation,
    left: LinkedExpression,
    operator: Operator,
    right: LinkedExpression
  ) {
    super(ctx);
    this.#left = left;
    this.#operator = operator;
    this.#right = right;
  }

  get Type(): LinkedType {
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
        return this.#right.Type;
    }
  }
}
