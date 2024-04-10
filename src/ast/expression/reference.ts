import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";

export class ReferenceExpression extends Expression {
  readonly #name: string;

  constructor(ctx: CodeLocation, name: string) {
    super(ctx);
    this.#name = name;
  }
}
