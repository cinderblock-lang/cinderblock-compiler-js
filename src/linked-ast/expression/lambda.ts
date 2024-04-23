import { LinkedExpression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { LinkedType } from "../type/base";
import { Block } from "../block";
import { ParameterCollection } from "../parameter-collection";

export class LambdaExpression extends LinkedExpression {
  readonly #parameters: ParameterCollection;
  readonly #body: Block;
  readonly #returns: LinkedType;

  constructor(
    ctx: CodeLocation,
    parameters: ParameterCollection,
    body: Block,
    returns: LinkedType
  ) {
    super(ctx);
    this.#parameters = parameters;
    this.#body = body;
    this.#returns = returns;
  }

  get Type() {
    return this.#returns;
  }
}
