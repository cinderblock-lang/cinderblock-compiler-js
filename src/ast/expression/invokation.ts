import { Expression } from "./base";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { CodeLocation } from "../../location/code-location";

export class InvokationExpression extends Expression {
  readonly #subject: Component;
  readonly #parameters: ComponentGroup;

  constructor(
    ctx: CodeLocation,
    subject: Expression,
    parameters: ComponentGroup
  ) {
    super(ctx);
    this.#subject = subject;
    this.#parameters = parameters;
  }
}
