import { Scope } from "../../linker/closure";
import { CodeLocation } from "../../location/code-location";
import { LinkedExpression } from "../expression/base";
import { LinkedType } from "../type/base";
import { LinkedStatement } from "./base";

export class SubStatement extends LinkedStatement {
  readonly #name: string;
  readonly #equals: LinkedExpression;
  readonly #type: LinkedType;

  constructor(ctx: CodeLocation, name: string, equals: LinkedExpression, type: LinkedType) {
    super(ctx);
    this.#name = name;
    this.#equals = equals;
    this.#type = type;
  }

  get Type() {
    return this.#type;
  }
}
