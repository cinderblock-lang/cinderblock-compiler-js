import { CodeLocation } from "../../location/code-location";
import { ParameterCollection } from "../parameter-collection";
import { LinkedType } from "./base";

export class FunctionType extends LinkedType {
  readonly #parameters: ParameterCollection;
  readonly #returns: LinkedType;

  constructor(
    ctx: CodeLocation,
    parameters: ParameterCollection,
    returns: LinkedType
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
