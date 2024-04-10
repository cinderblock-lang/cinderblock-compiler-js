import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { Namer } from "../../location/namer";

export class IterateExpression extends Expression {
  readonly #over: Component;
  readonly #as: string;
  readonly #using: ComponentGroup;
  readonly #struct_name: string;

  constructor(
    ctx: CodeLocation,
    over: Expression,
    as: string,
    using: ComponentGroup
  ) {
    super(ctx);
    this.#over = over;
    this.#as = as;
    this.#using = using;
    this.#struct_name = Namer.GetName();
  }
}
