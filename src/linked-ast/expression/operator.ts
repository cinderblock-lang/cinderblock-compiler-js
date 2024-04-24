import { LinkedExpression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { LinkedType } from "../type/base";
import { LinkedPrimitiveType } from "../type/primitive";
import { WriterFunction } from "../../writer/entity";
import {
  WriterExpression,
  WriterOperatorExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";

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

export class LinkedOperatorExpression extends LinkedExpression {
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
        return new LinkedPrimitiveType(this.CodeLocation, "bool");
      case "%":
        return new LinkedPrimitiveType(this.CodeLocation, "double");
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

  Build(
    file: WriterFile,
    func: WriterFunction
  ): [WriterFile, WriterFunction, WriterExpression] {
    let left: WriterExpression;
    let right: WriterExpression;

    [file, func, left] = this.#left.Build(file, func);
    [file, func, right] = this.#right.Build(file, func);

    return [
      file,
      func,
      new WriterOperatorExpression(left, right, this.#operator),
    ];
  }
}
