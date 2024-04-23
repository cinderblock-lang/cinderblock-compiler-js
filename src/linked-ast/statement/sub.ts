import { Scope } from "../../linker/closure";
import { CodeLocation } from "../../location/code-location";
import { Expression } from "../expression/base";
import { Type } from "../type/base";
import { Statement } from "./base";

export class SubStatement extends Statement {
  readonly #name: string;
  readonly #equals: Expression;
  readonly #type: Type;

  constructor(ctx: CodeLocation, name: string, equals: Expression, type: Type) {
    super(ctx);
    this.#name = name;
    this.#equals = equals;
    this.#type = type;
  }

  get Type() {
    return this.#type;
  }
}
