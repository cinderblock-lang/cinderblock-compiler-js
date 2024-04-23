import { CodeLocation } from "../../location/code-location";
import { LinkedType } from "../type/base";
import { LinkedExpression } from "./base";

export class DefaultExpression extends LinkedExpression {
  readonly #subject: LinkedType;

  constructor(ctx: CodeLocation, subject: LinkedType) {
    super(ctx);
    this.#subject = subject;
  }

  get Type() {
    return this.#subject;
  }
}
