import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";

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

export class OperatorExpression extends Expression {
  readonly #left: Component;
  readonly #operator: Operator;
  readonly #right: Component;

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
