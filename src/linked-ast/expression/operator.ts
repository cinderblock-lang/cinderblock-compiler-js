import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Type } from "../type/base";
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

  get Type(): Type {
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
