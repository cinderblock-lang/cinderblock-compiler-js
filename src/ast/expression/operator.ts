import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { WriterContext } from "../writer";

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

  get Left() {
    return this.#left;
  }

  get Operator() {
    return this.#operator;
  }

  get Right() {
    return this.#right;
  }

  get type_name() {
    return "operator_expression";
  }

  c(ctx: WriterContext): string {
    return `${this.Left.c(ctx)} ${this.Operator} ${this.Right.c(ctx)}`;
  }

  resolve_type(ctx: WriterContext): Component {
    return this.Right.resolve_type(ctx);
  }
}
