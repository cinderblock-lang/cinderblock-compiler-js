import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Type } from "../type/base";
import { Block } from "../block";
import { ParameterCollection } from "../parameter-collection";

export class LambdaExpression extends Expression {
  readonly #parameters: ParameterCollection;
  readonly #body: Block;
  readonly #returns: Type;

  constructor(
    ctx: CodeLocation,
    parameters: ParameterCollection,
    body: Block,
    returns: Type
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
