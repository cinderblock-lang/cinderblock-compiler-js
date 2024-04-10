import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { Expression } from "./base";

export class DefaultExpression extends Expression {
  readonly #subject: Component;

  constructor(ctx: CodeLocation, subject: Component) {
    super(ctx);
    this.#subject = subject;
  }
}
