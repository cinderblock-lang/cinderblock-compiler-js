import { CodeLocation } from "../../location/code-location";
import { Type } from "../type/base";
import { Expression } from "./base";

export class DefaultExpression extends Expression {
  readonly #subject: Type;

  constructor(ctx: CodeLocation, subject: Type) {
    super(ctx);
    this.#subject = subject;
  }

  get Type() {
    return this.#subject;
  }
}
