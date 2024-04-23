import { LinkedExpression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { LinkedType } from "../type/base";
import { PrimitiveType } from "../type/primitive";

export class IsExpression extends LinkedExpression {
  readonly #left: LinkedExpression;
  readonly #right: LinkedType;

  constructor(ctx: CodeLocation, left: LinkedExpression, right: LinkedType) {
    super(ctx);
    this.#left = left;
    this.#right = right;
  }

  get Type() {
    return new PrimitiveType(this.CodeLocation, "bool");
  }
}
