import { CodeLocation } from "../../location/code-location";
import { Block } from "../block";
import { ParameterCollection } from "../parameter-collection";
import { Type } from "../type/base";
import { FunctionType } from "../type/function";
import { Entity } from "./base";

export class FunctionEntity extends Entity {
  readonly #name: string;
  readonly #parameters: ParameterCollection;
  readonly #content: Block;
  readonly #returns: Type;

  constructor(
    ctx: CodeLocation,
    name: string,
    parameters: ParameterCollection,
    content: Block,
    returns: Type
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
