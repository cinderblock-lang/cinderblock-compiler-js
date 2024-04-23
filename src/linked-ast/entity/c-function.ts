import { CodeLocation } from "../../location/code-location";
import { Block } from "../block";
import { ParameterCollection } from "../parameter-collection";
import { FunctionType } from "../type/function";
import { PrimitiveType } from "../type/primitive";
import { Entity } from "./base";
import { FunctionEntity } from "./function";

export class CFunction extends Entity {
  readonly #name: string;
  readonly #includes: Array<string>;
  readonly #parameters: ParameterCollection;
  readonly #content: string;
  readonly #returns: PrimitiveType;

  constructor(
    ctx: CodeLocation,
    includes: Array<string>,
    name: string,
    parameters: ParameterCollection,
    content: string,
    returns: PrimitiveType
  ) {
    super(ctx);

    this.#name = name;
    this.#includes = includes;
    this.#parameters = parameters;
    this.#content = content;
    this.#returns = returns;
  }

  get Type() {
    return new FunctionType(this.CodeLocation, this.#parameters, this.#returns);
  }
}
