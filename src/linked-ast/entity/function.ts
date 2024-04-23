import { CodeLocation } from "../../location/code-location";
import { Block } from "../block";
import { ParameterCollection } from "../parameter-collection";
import { LinkedType } from "../type/base";
import { FunctionType } from "../type/function";
import { LinkedEntity } from "./base";

export class FunctionEntity extends LinkedEntity {
  readonly #name: string;
  readonly #parameters: ParameterCollection;
  readonly #content: Block;
  readonly #returns: LinkedType;

  constructor(
    ctx: CodeLocation,
    name: string,
    parameters: ParameterCollection,
    content: Block,
    returns: LinkedType
  ) {
    super(ctx);
    this.#name = name;
    this.#parameters = parameters;
    this.#content = content;
    this.#returns = returns;
  }

  get Type() {
    return new FunctionType(this.CodeLocation, this.#parameters, this.#returns);
  }
}
