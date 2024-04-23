import { CodeLocation } from "../../location/code-location";
import { LinkedExpression } from "../expression/base";
import { LinkedStatement } from "./base";

export class SideStatement extends LinkedStatement {
  readonly #value: LinkedExpression;

  constructor(ctx: CodeLocation, value: LinkedExpression) {
    super(ctx);
    this.#value = value;
  }
}
