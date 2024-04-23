import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Block } from "../block";
import { StructType } from "../type/struct";
import { Type } from "../type/base";

export class MakeExpression extends Expression {
  readonly #struct: StructType;
  readonly #using: Block;

  constructor(ctx: CodeLocation, struct: StructType, using: Block) {
    super(ctx);
    this.#struct = struct;
    this.#using = using;
  }

  get Type(): Type {
    return this.#struct;
  }
}
