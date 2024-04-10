import { Expression } from "./base";
import { ComponentGroup } from "../component-group";
import { CodeLocation } from "../../location/code-location";
import { Namer } from "../../location/namer";
import { Component } from "../component";

export class LambdaExpression extends Expression {
  readonly #parameters: ComponentGroup;
  readonly #body: ComponentGroup;
  readonly #returns: Component | undefined;

  readonly #name: string;

  constructor(
    ctx: CodeLocation,
    parameters: ComponentGroup,
    body: ComponentGroup,
    returns: Component | undefined
  ) {
    super(ctx);
    this.#parameters = parameters;
    this.#body = body;
    this.#returns = returns;

    this.#name = Namer.GetName();
  }
}
