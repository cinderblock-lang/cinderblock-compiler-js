import { LinkedExpression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Block } from "../block";
import { StructType } from "../type/struct";
import { LinkedType } from "../type/base";

export class MakeExpression extends LinkedExpression {
  readonly #struct: StructType;
  readonly #using: Block;

  constructor(ctx: CodeLocation, struct: StructType, using: Block) {
    super(ctx);
    this.#struct = struct;
    this.#using = using;
  }

  get Type(): LinkedType {
    return this.#struct;
  }
}
