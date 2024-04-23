import { CodeLocation } from "../../location/code-location";
import { Expression } from "../expression/base";
import { Statement } from "./base";

export class SideStatement extends Statement {
  readonly #value: Expression;

  constructor(ctx: CodeLocation, value: Expression) {
    super(ctx);
    this.#value = value;
  }
}
