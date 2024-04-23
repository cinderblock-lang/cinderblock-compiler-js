import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Type } from "../type/base";
import { PrimitiveType } from "../type/primitive";

export class IsExpression extends Expression {
  readonly #left: Expression;
  readonly #right: Type;

  constructor(ctx: CodeLocation, left: Expression, right: Type) {
    super(ctx);
    this.#left = left;
    this.#right = right;
  }

  get Type() {
    return new PrimitiveType(this.CodeLocation, "bool");
  }
}
