import { LinkedExpression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Block } from "../block";
import { EnumType } from "../type/enum";

export class PickExpression extends LinkedExpression {
  readonly #enum: EnumType;
  readonly #key: string;
  readonly #using: Block;

  constructor(ctx: CodeLocation, target: EnumType, key: string, using: Block) {
    super(ctx);
    this.#enum = target;
    this.#key = key;
    this.#using = using;
  }

  get Type() {
    return this.#enum;
  }
}
