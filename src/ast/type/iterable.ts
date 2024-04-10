import { CodeLocation } from "../../location/code-location";
import { Type } from "./base";

export class IterableType extends Type {
  readonly #type: Type;

  constructor(ctx: CodeLocation, type: Type) {
    super(ctx);
    this.#type = type;
  }
}
