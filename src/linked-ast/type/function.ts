import { CodeLocation } from "../../location/code-location";
import { ParameterCollection } from "../parameter-collection";
import { Type } from "./base";

export class FunctionType extends Type {
  readonly #parameters: ParameterCollection;
  readonly #returns: Type;

  constructor(
    ctx: CodeLocation,
    parameters: ParameterCollection,
    returns: Type
  ) {
    super(ctx);
    this.#parameters = parameters;
    this.#returns = returns;
  }

  get Name() {
    return "func";
  }

  get Parameters() {
    return this.#parameters;
  }

  get Returns() {
    return this.#returns;
  }
}
