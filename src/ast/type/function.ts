import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { StructEntity } from "../entity/struct";
import { Type } from "./base";

export class FunctionType extends Type {
  readonly #parameters: ComponentGroup;
  readonly #returns: Component;

  constructor(
    ctx: CodeLocation,
    parameters: ComponentGroup,
    returns: Type | StructEntity
  ) {
    super(ctx);
    this.#parameters = parameters;
    this.#returns = returns;
  }
}
