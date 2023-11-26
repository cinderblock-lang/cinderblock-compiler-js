import { CodeLocation } from "../../location/code-location";
import { WriterContext } from "../writer";
import { Type } from "./base";

export class IterableType extends Type {
  readonly #type: Type;

  constructor(ctx: CodeLocation, type: Type) {
    super(ctx);
    this.#type = type;
  }

  get Type() {
    return this.#type;
  }

  get type_name() {
    return "iterable_type";
  }

  c(ctx: WriterContext): string {
    return `Array`;
  }
}
